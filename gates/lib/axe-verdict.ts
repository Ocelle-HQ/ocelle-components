// The verdict of the accessibility gate (FR-013 to FR-015, FR-029; contracts/gates.md § `axe`; data-model.md § axe
// result per story-theme; research.md R-08): per story-theme the render failure, the checks that stop axe
// (closed-shadow-root, pointer-target, empty), the elements outside the story root, and axe's serious and critical
// nodes (violations, and incomplete results as `<rule>-incomplete`) one finding each, moderate and minor results as
// notes; exceptions honoured per node, unrecorded and stale entries as findings; the summary line. Pure, tested in
// process (gates/test/axe-verdict.test.ts); gates/bin/axe.ts only collects the page data and axe's results.
import type { GateResult } from "./findings.ts";
import type { ExceptionState } from "./a11y-exceptions.ts";
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
  throw new Error(`not implemented (axe-verdict, phase 4): ${String(target.length)}`);
}

/** The check that stops axe on a rendered story-theme (closed-shadow-root, pointer-target, empty, in that order), or undefined. */
export function blocker(rendered: Rendered): { readonly rule: string; readonly message: string } | undefined {
  throw new Error(`not implemented (axe-verdict, phase 4): ${String(rendered.empty)}`);
}

/** The gate's verdict on every story-theme's outcome with the exception entries. */
export function axeVerdict(audits: readonly Audit[], exceptions: readonly ExceptionState[]): AxeVerdict {
  throw new Error(`not implemented (axe-verdict, phase 4): ${String(audits.length)} ${String(exceptions.length)}`);
}
