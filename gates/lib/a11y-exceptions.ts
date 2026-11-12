// The axe gate's exceptions (FR-029; data-model.md § Exception; research.md R-08): storybook/a11y-exceptions.json, a
// list of { story, theme, rule, selector, reason, sunset, plan } entries, every field a non-empty string. An entry is
// honoured only when its plan's `## Complexity Tracking` section holds a table row naming the same story, theme, rule
// and selector (each in backticks, a `|` written `\|`) and the sunset; an honoured entry excepts the one node of its
// rule with its selector in its story-theme. Pure, tested in process (gates/test/a11y-exceptions.test.ts).

/** One exception entry. */
export interface Exception {
  readonly story: string;
  readonly theme: string;
  readonly rule: string;
  readonly selector: string;
  readonly reason: string;
  readonly sunset: string;
  readonly plan: string;
}

/** The exceptions file of a root. */
export const exceptionsPath = "storybook/a11y-exceptions.json";

/** An entry and whether its plan records it (honoured), or why not. */
export type ExceptionState = { readonly entry: Exception; readonly recorded: true } | { readonly entry: Exception; readonly recorded: false; readonly reason: string };

/** A serious or critical node an exception may match: its story-theme, rule (`<id>` or `<id>-incomplete`) and selector. */
export interface Candidate {
  readonly story: string;
  readonly theme: string;
  readonly rule: string;
  readonly selector: string;
}

/** The entries of an exceptions file, or the problem that makes the gate unable to run. */
export function parseExceptions(text: string): Exception[] | { readonly problem: string } {
  throw new Error(`not implemented (a11y-exceptions, phase 4): ${String(text.length)}`);
}

/** The table rows of a plan's `## Complexity Tracking` section, as cells with `\|` unescaped. */
export function complexityRows(plan: string): string[][] {
  throw new Error(`not implemented (a11y-exceptions, phase 4): ${String(plan.length)}`);
}

/** Whether a plan's text (undefined: no such file) records an entry. */
export function recordedIn(entry: Exception, plan: string | undefined): ExceptionState {
  throw new Error(`not implemented (a11y-exceptions, phase 4): ${entry.plan} ${String(plan?.length)}`);
}

/** Which candidates the honoured entries except (candidate index to entry index), and the entries that matched none. */
export function matchExceptions(candidates: readonly Candidate[], states: readonly ExceptionState[]): { readonly excepted: ReadonlyMap<number, number>; readonly stale: readonly number[] } {
  throw new Error(`not implemented (a11y-exceptions, phase 4): ${String(candidates.length)} ${String(states.length)}`);
}
