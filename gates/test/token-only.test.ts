import stylelint from "stylelint";
import { describe, expect, it } from "vitest";
import plugin, { rawValues, ruleName } from "../stylelint/token-only.ts";

// The FR-024 allow-list of gates/stylelint/token-only.ts on single declarations (research.md R-07, contracts/plants.md
// style-lint row; operator decision FRESH-1-009 (a)): every value is classified per word, string, number, function and
// var() fallback; a declaration is token-only when rawValues() is empty.
describe("rawValues: rejected values", () => {
  it.each([
    { property: "margin", value: "2rem", raw: ["2rem"] },
    { property: "transition-duration", value: "150ms", raw: ["150ms"] },
    { property: "color", value: "#fff", raw: ["#fff"] },
    { property: "color", value: "rgb(0 0 0)", raw: ["rgb(0 0 0)"] },
    { property: "color", value: "hsl(0 0% 0%)", raw: ["hsl(0 0% 0%)"] },
    { property: "color", value: "red", raw: ["red"] },
    { property: "border-color", value: "RebeccaPurple", raw: ["RebeccaPurple"] },
    { property: "font-family", value: "Inter", raw: ["Inter"] },
    { property: "font-family", value: '"Schibsted Grotesk", var(--ocelle-font)', raw: ['"Schibsted Grotesk"'] },
    { property: "font", value: "bold var(--ocelle-font)", raw: ["bold"] },
    { property: "font-weight", value: "600", raw: ["600"] },
    { property: "width", value: "2", raw: ["2"] },
    { property: "grid-column", value: "2", raw: ["2"] },
    { property: "aspect-ratio", value: "16 / 9", raw: ["16", "9"] },
    { property: "padding", value: "var(--ocelle-x, 4px)", raw: ["4px"] },
    { property: "padding", value: "var(--ocelle-x, var(--ocelle-y, 1em))", raw: ["1em"] },
    { property: "width", value: "calc(var(--a) + 4px)", raw: ["4px"] },
    { property: "width", value: "calc((var(--a) + 2vw) / 2)", raw: ["2vw"] },
    { property: "box-shadow", value: "0 0 2px #000", raw: ["2px", "#000"] },
    { property: "border", value: "1px solid RED", raw: ["1px", "RED"] },
    { property: "transform", value: "rotate(45deg)", raw: ["rotate(45deg)"] },
    { property: "width", value: "min(var(--a), var(--b))", raw: ["min(var(--a), var(--b))"] },
    { property: "--ocelle-x", value: "4px", raw: ["4px"] },
    { property: "margin", value: "-4px", raw: ["-4px"] },
    { property: "margin", value: "0px", raw: ["0px"] },
    { property: "transition", value: "opacity 0.2s", raw: ["0.2s"] },
    { property: "width", value: "1.5", raw: ["1.5"] },
  ])("$property: $value is raw: $raw", ({ property, value, raw }) => {
    expect(rawValues(property, value)).toEqual(raw);
  });
});

describe("rawValues: allowed values", () => {
  it.each([
    { property: "padding", value: "var(--ocelle-x)" },
    { property: "margin", value: "0" },
    { property: "margin", value: "-0" },
    { property: "width", value: "100%" },
    { property: "color", value: "Canvas" },
    { property: "color", value: "ButtonText" },
    { property: "color", value: "currentColor" },
    { property: "background", value: "transparent" },
    { property: "grid-template-columns", value: "1fr 2fr" },
    { property: "width", value: "calc(var(--a) * 2)" },
    { property: "width", value: "calc((var(--a) + var(--b)) / 2)" },
    { property: "line-height", value: "1.5" },
    { property: "LINE-HEIGHT", value: "1.5" },
    { property: "flex", value: "1 1 0%" },
    { property: "flex-grow", value: "2" },
    { property: "flex-shrink", value: "0" },
    { property: "z-index", value: "10" },
    { property: "opacity", value: "0.5" },
    { property: "order", value: "-1" },
    { property: "content", value: '""' },
    { property: "grid-template-areas", value: '"a b"' },
    { property: "anchor-name", value: "--tip" },
    { property: "position-anchor", value: "--tip" },
    { property: "animation-name", value: "fade" },
    { property: "color", value: "var(--ocelle-x, Canvas)" },
    { property: "display", value: "none" },
    { property: "margin", value: "auto" },
    { property: "font", value: "inherit" },
    { property: "font-family", value: "revert-layer" },
    { property: "font-family", value: "var(--ocelle-font)" },
    { property: "font-weight", value: "bold" },
    { property: "--ocelle-x", value: "var(--ocelle-y)" },
    { property: "border", value: "var(--ocelle-w) solid var(--ocelle-c)" },
  ])("$property: $value is token-only (only the control 4px after it is raw)", ({ property, value }) => {
    expect(rawValues(property, `${value} 4px`)).toEqual(["4px"]);
  });
});

describe("the ocelle/token-only plugin", () => {
  const config = { plugins: [plugin], rules: { [ruleName]: true } };

  it("is named ocelle/token-only and reports each declaration with a raw value once, at its line, naming the property and the raw values", async () => {
    expect(ruleName).toBe("ocelle/token-only");
    const code = "a {\n  width: 4px;\n  color: var(--ocelle-x);\n  box-shadow: 0 0 2px #000;\n}\n";
    const { results } = await stylelint.lint({ code, config });
    expect(results[0]?.warnings.map(({ line, rule, text }) => ({ line, rule, text }))).toEqual([
      { line: 2, rule: "ocelle/token-only", text: "width: raw 4px; use a --ocelle-* token (FR-024) (ocelle/token-only)" },
      {
        line: 4,
        rule: "ocelle/token-only",
        text: "box-shadow: raw 2px, #000; use a --ocelle-* token (FR-024) (ocelle/token-only)",
      },
    ]);
  });

  it("checks the declarations of a style template embedded in TypeScript (postcss-lit)", async () => {
    const code = "const css = String.raw;\nexport const styles = css`\n  :host {\n    color: red;\n  }\n`;\n";
    const { results } = await stylelint.lint({ code, codeFilename: "x.ts", config: { ...config, customSyntax: "postcss-lit" } });
    expect(results[0]?.warnings.map(({ line, text }) => ({ line, text }))).toEqual([
      { line: 4, text: "color: raw red; use a --ocelle-* token (FR-024) (ocelle/token-only)" },
    ]);
  });

  it("reports nothing on token-only declarations (only the control declaration)", async () => {
    const code = "a { width: var(--ocelle-x); margin: 0; content: \"\"; }\nb { top: 1px; }\n";
    const { results } = await stylelint.lint({ code, config });
    expect(results[0]?.warnings.map(({ line, text }) => ({ line, text }))).toEqual([
      { line: 2, text: "top: raw 1px; use a --ocelle-* token (FR-024) (ocelle/token-only)" },
    ]);
  });
});
