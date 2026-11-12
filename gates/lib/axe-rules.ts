// The axe rule set and context of the accessibility gate (FR-016; research.md R-08): every rule the pinned axe-core
// enables by default and every rule tagged wcag2a, wcag2aa, wcag21a, wcag21aa or wcag22aa, less the rules tagged
// experimental and the harness-document rules (rules that judge the preview document Storybook supplies, not a
// story); the context is the whole document less Storybook's harness nodes. Pure, tested in process
// (gates/test/axe-rules.test.ts); gates/bin/axe.ts reads the metadata from axe-core and passes the options to axe.run.

/** The metadata of one axe rule the selection reads (axe-core's `axe._audit.rules`). */
export interface RuleMeta {
  readonly id: string;
  readonly tags: readonly string[];
  readonly enabled: boolean;
  readonly selector: string;
}

/** The WCAG tags whose rules run even when axe does not enable them by default (FR-016). */
export const wcagTags: readonly string[] = [];

/** The rules of axe-core 4.14.0 that judge the Storybook harness document, not a story (FR-016); never run. */
export const harnessDocumentRules: readonly string[] = [];

/** The metadata of axe-core's rule objects (`axe._audit.rules`), as the selection reads it. */
export function ruleMeta(rules: readonly unknown[]): RuleMeta[] {
  throw new Error(`not implemented (axe-rules, phase 4): ${String(rules.length)}`);
}

/** The ids of the rules the gate runs, in metadata order. */
export function enabledRules(rules: readonly RuleMeta[]): string[] {
  throw new Error(`not implemented (axe-rules, phase 4): ${String(rules.length)}`);
}

/** axe.run's `rules` option: every rule of the metadata, enabled exactly when the selection runs it. */
export function ruleOptions(rules: readonly RuleMeta[]): Record<string, { readonly enabled: boolean }> {
  throw new Error(`not implemented (axe-rules, phase 4): ${String(rules.length)}`);
}

/** axe.run's context: the whole document, Storybook's harness nodes excluded (research.md R-08). */
export function axeContext(): { readonly exclude: readonly (readonly string[])[] } {
  throw new Error("not implemented (axe-rules, phase 4)");
}
