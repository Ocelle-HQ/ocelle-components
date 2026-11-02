// Stylelint plugin ocelle/token-only (FR-024, research.md R-07). Scaffold: signatures only, reports nothing.
import stylelint from "stylelint";
import type { Rule } from "stylelint";

export const ruleName = "ocelle/token-only";

/** The raw values (FR-024) in one declaration's value, in source order; empty when the value is token-only. */
export function rawValues(_property: string, _value: string): string[] {
  return [];
}

const rule: Rule = () => () => undefined;
rule.ruleName = ruleName;
rule.messages = stylelint.utils.ruleMessages(ruleName, { raw: () => "" });

export default stylelint.createPlugin(ruleName, rule);
