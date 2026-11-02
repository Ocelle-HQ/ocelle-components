// ESLint rule ocelle/no-snapshot-only (FR-010, research.md R-06). Scaffold: signatures only, reports nothing.
import type { Rule } from "eslint";

export const noSnapshotOnly: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Reject a test whose only assertions are snapshot matchers" },
    messages: { snapshotOnly: "" },
    schema: [],
  },
  create: () => ({}),
};

/** The local ESLint plugin `ocelle`. */
export const plugin = { rules: { "no-snapshot-only": noSnapshotOnly } };
