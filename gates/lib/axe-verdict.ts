// The verdict of the accessibility gate (FR-013 to FR-015, FR-029; contracts/gates.md § `axe`; data-model.md § axe
// result per story-theme; research.md R-08): per story-theme the render failure, the checks that stop axe
// (closed-shadow-root, pointer-target, empty), the elements outside the story root, and axe's serious and critical
// nodes (violations, and incomplete results as `<rule>-incomplete`) one finding each, moderate and minor results as
// notes; exceptions honoured per node, unrecorded and stale entries as findings; the summary line. Pure, tested in
// process (gates/test/axe-verdict.test.ts); gates/bin/axe.ts only collects the page data and axe's results.
import { exceptionsPath, matchExceptions } from "./a11y-exceptions.ts";
import type { Candidate, ExceptionState } from "./a11y-exceptions.ts";
import { plural } from "./findings.ts";
import type { Finding, GateResult } from "./findings.ts";
import type { Theme } from "./visual-verdict.ts";

/** axe-core's `NodeResult.target`: one entry per frame level, an entry a selector or one selector per shadow level. */
export type Target = readonly (string | readonly string[])[];

/** A node of an axe result. */
export interface AxeNode {
  readonly target: Target;
  readonly impact?: string | null;
}

/** One rule's result: its id, impact and nodes. */
export interface AxeRuleResult {
  readonly id: string;
  readonly impact?: string | null;
  readonly nodes: readonly AxeNode[];
}

/** The results of one axe run the gate reads. */
export interface AxeResults {
  readonly violations: readonly AxeRuleResult[];
  readonly incomplete: readonly AxeRuleResult[];
}

/** What the page showed after the render: closed shadow roots, the pointer problem, whether the root is empty, the elements outside it. */
export interface Rendered {
  readonly closed: readonly string[];
  readonly pointer?: string;
  readonly empty: boolean;
  readonly outside: readonly string[];
}

/** One story-theme's outcome: a render failure, or the page's checks and (when axe ran) its results. */
export type Outcome = { readonly kind: "render-failed" | "render-timeout"; readonly message: string } | ({ readonly kind: "rendered"; readonly results?: AxeResults } & Rendered);

/** One story-theme and its outcome. */
export interface Audit {
  readonly story: string;
  readonly theme: Theme;
  readonly outcome: Outcome;
}

/** The gate's result and its notes (stderr lines). */
export interface AxeVerdict {
  readonly result: GateResult;
  readonly notes: readonly string[];
}

/** The printed selector of a node (research.md R-08): shadow levels joined by ` >>> `, frame levels by ` >>frame>> `. */
export function printSelector(target: Target): string {
  return target.map((level) => (typeof level === "string" ? level : level.join(" >>> "))).join(" >>frame>> ");
}

/** The check that stops axe on a rendered story-theme (closed-shadow-root, pointer-target, empty, in that order), or undefined. */
export function blocker(rendered: Rendered): { readonly rule: string; readonly message: string } | undefined {
  if (rendered.closed.length > 0) return { rule: "closed-shadow-root", message: rendered.closed.join(", ") };
  if (rendered.pointer !== undefined) return { rule: "pointer-target", message: rendered.pointer };
  if (rendered.empty) return { rule: "empty", message: "the story root renders no content" };
  return undefined;
}

const gate = "axe";

/** The impacts that are findings; any other impact is a note. */
const blocking = ["serious", "critical"];

/** One node of axe's results in a story-theme: where, its rule as the gate names it, its impact and selector. */
interface Node extends Candidate {
  readonly impact: string;
}

/** Every node of a story-theme's results, violations first, each with its own impact (else its rule's; axe gives one of them). */
function nodesOf(audit: Audit, results: AxeResults): Node[] {
  const at = { story: audit.story, theme: audit.theme };
  const listed = (list: readonly AxeRuleResult[], suffix: string): Node[] =>
    list.flatMap((result) => result.nodes.map((node) => ({ ...at, rule: `${result.id}${suffix}`, impact: String(node.impact ?? result.impact), selector: printSelector(node.target) })));
  return [...listed(results.violations, ""), ...listed(results.incomplete, "-incomplete")];
}

/** The gate's verdict on every story-theme's outcome with the exception entries. */
export function axeVerdict(audits: readonly Audit[], exceptions: readonly ExceptionState[]): AxeVerdict {
  const where = (audit: Audit): string => `${audit.story}/${audit.theme}`;
  const at = (audit: Audit, rule: string, message: string): Finding => ({ location: { path: where(audit) }, gate, rule, message });
  // The serious and critical nodes of every audited story-theme, which the exceptions may match.
  const audited = audits.map((audit) => {
    const { outcome } = audit;
    const nodes = outcome.kind === "rendered" && blocker(outcome) === undefined ? nodesOf(audit, outcome.results ?? { violations: [], incomplete: [] }) : [];
    return { audit, nodes };
  });
  const candidates = audited.flatMap(({ nodes }) => nodes.filter((node) => blocking.includes(node.impact)));
  const { excepted, stale } = matchExceptions(candidates, exceptions);
  const findings: Finding[] = [];
  const notes: string[] = [];
  let incomplete = 0;
  let exceptedCount = 0;
  let candidate = 0;
  for (const { audit, nodes } of audited) {
    const { outcome } = audit;
    if (outcome.kind !== "rendered") {
      findings.push(at(audit, outcome.kind, outcome.message));
      continue;
    }
    for (const tag of outcome.outside) findings.push(at(audit, "outside-root", tag));
    const stop = blocker(outcome);
    if (stop !== undefined) findings.push(at(audit, stop.rule, stop.message));
    for (const node of nodes) {
      const line = `note: ${where(audit)}: ${node.rule}: ${node.impact}: ${node.selector}`;
      if (!blocking.includes(node.impact)) {
        notes.push(line);
        if (node.rule.endsWith("-incomplete")) incomplete += 1;
        continue;
      }
      const entry = excepted.get(candidate);
      candidate += 1;
      if (entry === undefined) {
        findings.push(at(audit, node.rule, `${node.impact}: ${node.selector}`));
        continue;
      }
      // Stryker disable next-line OptionalChaining: equivalent, matchExceptions maps a node only to an index of the entries
      notes.push(`${line} excepted (${String(exceptions[entry]?.entry.reason)})`);
      exceptedCount += 1;
    }
  }
  for (const [index, state] of exceptions.entries()) {
    const location = { path: `${exceptionsPath}#${String(index)}` };
    const { entry } = state;
    if (!state.recorded) findings.push({ location, gate, rule: "unrecorded-exception", message: state.reason });
    else if (stale.includes(index)) findings.push({ location, gate, rule: "stale-exception", message: `matches no node: ${entry.story}/${entry.theme} ${entry.rule} ${entry.selector}` });
  }
  const runs = plural(audits.length, "story-theme run");
  if (findings.length > 0) return { result: { exit: 1, findings, summary: `${gate}: ${plural(findings.length, "finding")} in ${runs}` }, notes };
  const summary = `${gate}: ${runs}, 0 serious or critical; ${plural(notes.length, "note")} (${String(incomplete)} incomplete, ${String(exceptedCount)} excepted)`;
  return { result: { exit: 0, summary }, notes };
}
