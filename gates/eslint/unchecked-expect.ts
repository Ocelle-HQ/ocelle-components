// ESLint rules for unchecked assertions (FR-010, research.md R-06 "Unchecked assertions"): an assertion in a promise
// callback that is neither awaited nor returned, in a timer callback, or inside a try whose catch swallows it.
// Phase 3 addendum stub (tasks.md T091 step 1): the rules report nothing yet.
import type { Rule } from "eslint";

export const noFloatingPromiseExpect: Rule.RuleModule = {
  meta: { type: "problem", messages: { floating: "" }, schema: [] },
  create() {
    return {};
  },
};

export const noTimerExpect: Rule.RuleModule = {
  meta: { type: "problem", messages: { timer: "" }, schema: [] },
  create() {
    return {};
  },
};

export const noSwallowedExpect: Rule.RuleModule = {
  meta: { type: "problem", messages: { swallowed: "" }, schema: [] },
  create() {
    return {};
  },
};

/** The rules of this module, for the local ESLint plugin `ocelle`. */
export const plugin = {
  rules: {
    "no-floating-promise-expect": noFloatingPromiseExpect,
    "no-timer-expect": noTimerExpect,
    "no-swallowed-expect": noSwallowedExpect,
  },
};
