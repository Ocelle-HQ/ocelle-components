import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import stylelint from "stylelint";
import { afterEach, describe, expect, it } from "vitest";
import { loadLists, manifestProperties } from "../stylelint/token-lists.ts";
import plugin, { rawValues, referencedTokens, ruleName } from "../stylelint/token-only.ts";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

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
    { property: "font-family", value: '"Schibsted Grotesk", var(--ocelle-font-sans)', raw: ['"Schibsted Grotesk"'] },
    { property: "font", value: "bold var(--ocelle-font-sans)", raw: ["bold"] },
    { property: "font-weight", value: "600", raw: ["600"] },
    { property: "width", value: "2", raw: ["2"] },
    { property: "grid-column", value: "2", raw: ["2"] },
    { property: "aspect-ratio", value: "16 / 9", raw: ["16", "9"] },
    { property: "padding", value: "var(--ocelle-space-2, 4px)", raw: ["4px"] },
    { property: "padding", value: "var(--ocelle-space-2, var(--ocelle-space-3, 1em))", raw: ["1em"] },
    { property: "width", value: "calc(var(--a) + 4px)", raw: ["4px"] },
    { property: "width", value: "calc((var(--a) + 2vw) / 2)", raw: ["2vw"] },
    { property: "box-shadow", value: "0 0 2px #000", raw: ["2px", "#000"] },
    { property: "border", value: "1px solid RED", raw: ["1px", "RED"] },
    { property: "transform", value: "rotate(45deg)", raw: ["rotate(45deg)"] },
    { property: "width", value: "min(var(--a), var(--b))", raw: ["min(var(--a), var(--b))"] },
    { property: "--ocelle-space-2", value: "4px", raw: ["4px"] },
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
    { property: "padding", value: "var(--ocelle-space-2)" },
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
    { property: "color", value: "var(--ocelle-space-2, Canvas)" },
    { property: "display", value: "none" },
    { property: "margin", value: "auto" },
    { property: "font", value: "inherit" },
    { property: "font-family", value: "revert-layer" },
    { property: "font-family", value: "var(--ocelle-font-sans)" },
    { property: "font-weight", value: "bold" },
    { property: "--ocelle-space-2", value: "var(--ocelle-space-3)" },
    { property: "border", value: "var(--ocelle-border-width) solid var(--ocelle-color-rule)" },
  ])("$property: $value is token-only (only the control 4px after it is raw)", ({ property, value }) => {
    expect(rawValues(property, `${value} 4px`)).toEqual(["4px"]);
  });
});

// The `scale` allowance (005 research.md R-03, R-08; operator decisions PLAN-TESTABILITY-1-011 (a) and PLAN-FRESH-3-002
// (a); T034): `scale` takes only the numbers -1 and 1, as bare words, so the mirroring rule `scale: -1 1` passes. The
// whole value is checked: any other number, a length or a percentage is raw, and so is any function (calc(), var() or
// another), so calc() does not reopen the allowance. Keywords stay allowed as for every property.
describe("rawValues: scale takes only -1 and 1", () => {
  it.each([
    { value: "-1 1" },
    { value: "1 -1" },
    { value: "-1" },
    { value: "1" },
    { value: "1 1 -1" },
  ])("scale: $value is token-only (only the control 4px after it is raw)", ({ value }) => {
    expect(rawValues("scale", `${value} 4px`)).toEqual(["4px"]);
    expect(rawValues("SCALE", value)).toEqual([]);
  });

  // Each guard below shares its test with the mirroring value it guards (it holds before the allowance too).
  it("keeps keywords allowed: scale: none and inherit pass, beside -1 1", () => {
    expect({ none: rawValues("scale", "none"), inherit: rawValues("scale", "inherit"), mirror: rawValues("scale", "-1 1") }).toEqual({ none: [], inherit: [], mirror: [] });
  });

  it.each([
    { value: "2", raw: ["2"] },
    { value: "2px 1", raw: ["2px"] },
    { value: "calc(2)", raw: ["calc(2)"] },
    { value: "calc(-1) 1", raw: ["calc(-1)"] },
    { value: "calc(3) calc(3)", raw: ["calc(3)", "calc(3)"] },
    { value: "var(--ocelle-icon-size)", raw: ["var(--ocelle-icon-size)"] },
    { value: "-1 0.5", raw: ["0.5"] },
    { value: "0", raw: ["0"] },
    { value: "-2 1", raw: ["-2"] },
    { value: "50% 1", raw: ["50%"] },
    { value: "1.5", raw: ["1.5"] },
    { value: "1px -1", raw: ["1px"] },
    { value: "red 1", raw: ["red"] },
    { value: "#000", raw: ["#000"] },
  ])("scale: $value is raw: $raw, while -1 1 passes", ({ value, raw }) => {
    expect({ value: rawValues("scale", value), mirror: rawValues("scale", "-1 1") }).toEqual({ value: raw, mirror: [] });
  });

  it("leaves other properties as before: a bare -1 or 1 is still raw for width, and calc(2) still passes there, while scale: -1 1 passes", () => {
    expect({ width: rawValues("width", "-1 1"), calc: rawValues("width", "calc(2)"), order: rawValues("order", "-1"), mirror: rawValues("scale", "-1 1") }).toEqual({ width: ["-1", "1"], calc: [], order: [], mirror: [] });
  });

  it("reports the mirroring rule of an element template not at all, and a scale factor at its line", async () => {
    const code = "const css = String.raw;\nexport const styles = css`\n  :host(:dir(rtl)) .mirror {\n    scale: -1 1;\n  }\n  .big {\n    scale: calc(2);\n  }\n`;\n";
    const { results } = await stylelint.lint({ code, codeFilename: "x.ts", config: { plugins: [plugin], rules: { [ruleName]: true }, customSyntax: "postcss-lit" } });
    expect(results[0]?.warnings.map(({ line, text }) => ({ line, text }))).toEqual([
      { line: 7, text: "scale: raw calc(2); use a --ocelle-* token (FR-024) (ocelle/token-only)" },
    ]);
  });
});

// The `aspect-ratio` allowance (005 research.md R-03, R-09; operator decisions PLAN-FRESH-1-006 (a) and PLAN-FRESH-3-002
// (a); T050): `aspect-ratio` takes only the number 1, as the whole value, so the mark's `aspect-ratio: 1` passes and
// takes its size from the token. Any other number, a ratio with `/` (`1 / 1` included), a length and any function
// (calc(), var() or another) are raw, so calc() does not reopen the allowance. Keywords stay allowed as for every
// property. Each guard shares its test with the square value it guards.
describe("rawValues: aspect-ratio takes only 1, as the whole value", () => {
  it("aspect-ratio: 1 is token-only, in any case of the property name, while 16 / 9 stays raw", () => {
    expect({ square: rawValues("aspect-ratio", "1"), upper: rawValues("ASPECT-RATIO", "1"), spaced: rawValues("aspect-ratio", " 1 "), ratio: rawValues("aspect-ratio", "16 / 9") }).toEqual({
      square: [],
      upper: [],
      spaced: [],
      ratio: ["16", "9"],
    });
  });

  it("keeps keywords allowed: aspect-ratio: auto and inherit pass, beside 1", () => {
    expect({ auto: rawValues("aspect-ratio", "auto"), inherit: rawValues("aspect-ratio", "inherit"), square: rawValues("aspect-ratio", "1") }).toEqual({ auto: [], inherit: [], square: [] });
  });

  it.each([
    { value: "2", raw: ["2"] },
    { value: "1 / 1", raw: ["1", "1"] },
    { value: "1/1", raw: ["1", "1"] },
    { value: "calc(2)", raw: ["calc(2)"] },
    { value: "calc(1)", raw: ["calc(1)"] },
    { value: "var(--ocelle-icon-size)", raw: ["var(--ocelle-icon-size)"] },
    { value: "auto 1", raw: ["1"] },
    { value: "0", raw: ["0"] },
    { value: "1.5", raw: ["1.5"] },
    { value: "-1", raw: ["-1"] },
    { value: "1px", raw: ["1px"] },
    { value: "100%", raw: ["100%"] },
    { value: "red", raw: ["red"] },
    { value: "#000 / 1", raw: ["#000", "1"] },
  ])("aspect-ratio: $value is raw: $raw, while aspect-ratio: 1 passes", ({ value, raw }) => {
    expect({ value: rawValues("aspect-ratio", value), square: rawValues("aspect-ratio", "1") }).toEqual({ value: raw, square: [] });
  });

  it("leaves other properties as before: a bare 1 is still raw for width and calc(2) still passes there, while aspect-ratio: 1 passes", () => {
    expect({ width: rawValues("width", "1"), calc: rawValues("width", "calc(2)"), square: rawValues("aspect-ratio", "1") }).toEqual({ width: ["1"], calc: [], square: [] });
  });

  it("reports the mark's aspect-ratio: 1 in an element template not at all, and aspect-ratio: calc(2) at its line", async () => {
    const code = "const css = String.raw;\nexport const styles = css`\n  :host {\n    aspect-ratio: 1;\n  }\n  .wide {\n    aspect-ratio: calc(2);\n  }\n`;\n";
    const { results } = await stylelint.lint({ code, codeFilename: "x.ts", config: { plugins: [plugin], rules: { [ruleName]: true }, customSyntax: "postcss-lit" } });
    expect(results[0]?.warnings.map(({ line, text }) => ({ line, text }))).toEqual([
      { line: 7, text: "aspect-ratio: raw calc(2); use a --ocelle-* token (FR-024) (ocelle/token-only)" },
    ]);
  });
});

// The `1lh` allowance (005 research.md R-03, R-10; operator decisions PLAN-CORRECTNESS-1-004 (a), PLAN-FRESH-2-002 (a)
// and PLAN-FRESH-3-002 (a); T041): the unit `lh` is allowed only as `1lh`, one line box of the element's own line
// height, as a value on its own (the slot wrapper's `block-size: 1lh`) and inside `calc()` only as an operand of `+` or
// `-` (never of `*` or `/`), at most once per `calc()` expression, in a `calc()` that also references an `--ocelle-*`
// token (the row's `padding-block: calc((var(--ocelle-icon-size) - 1lh) / 2)`). Every other use of `lh` is raw. Each
// guard shares its test with the allowed value it guards, since `2lh` and the rest were raw before the allowance too.
describe("rawValues: 1lh alone, and once beside a token in calc()", () => {
  const row = "calc((var(--ocelle-icon-size) - 1lh) / 2)";

  it.each([
    { property: "block-size", value: "1lh" },
    { property: "BLOCK-SIZE", value: "1LH" },
    { property: "min-block-size", value: "1lh" },
  ])("$property: $value is token-only", ({ property, value }) => {
    expect(rawValues(property, value)).toEqual([]);
  });

  it.each([
    { property: "padding-block", value: row },
    { property: "padding-block", value: "calc(var(--ocelle-icon-size) - 1lh)" },
    { property: "padding-block", value: "calc(1lh - var(--ocelle-icon-size))" },
    { property: "margin-block", value: "calc(var(--ocelle-space-1) + 1lh)" },
    { property: "margin-block", value: "calc(var(--ocelle-space-1) + (1lh - var(--ocelle-space-1)))" },
    { property: "margin-block", value: "calc(var(--ocelle-space-1) * 2 + 1lh)" },
    // A comment is no length and no operand, even one that reads 1lh.
    { property: "padding-block", value: "calc(var(--ocelle-icon-size) - /*1lh*/ 1lh)" },
    { property: "inset-block-start", value: "calc((var(--ocelle-icon-size) - 1lh) / 2) var(--ocelle-space-1)" },
  ])("$property: $value is token-only", ({ property, value }) => {
    expect(rawValues(property, value)).toEqual([]);
  });

  it.each([
    { property: "block-size", value: "2lh", raw: ["2lh"] },
    { property: "block-size", value: "0.5lh", raw: ["0.5lh"] },
    { property: "block-size", value: "-1lh", raw: ["-1lh"] },
    { property: "block-size", value: "1rlh", raw: ["1rlh"] },
    { property: "block-size", value: "calc(2lh)", raw: ["2lh"] },
    { property: "block-size", value: "calc(1lh)", raw: ["1lh"] },
    { property: "block-size", value: "calc(1lh * 2)", raw: ["1lh"] },
    { property: "block-size", value: "calc(2 * 1lh)", raw: ["1lh"] },
    { property: "block-size", value: "calc(1lh / 2)", raw: ["1lh"] },
    { property: "block-size", value: "calc(var(--ocelle-space-1) + 1lh * 2)", raw: ["1lh"] },
    { property: "block-size", value: "calc(var(--ocelle-space-1) / 1lh)", raw: ["1lh"] },
    { property: "block-size", value: "calc(var(--ocelle-space-1) + 1lh + 1lh)", raw: ["1lh", "1lh"] },
    { property: "block-size", value: "calc(1lh + 1lh)", raw: ["1lh", "1lh"] },
    { property: "block-size", value: "calc(1lh + 1px)", raw: ["1lh", "1px"] },
    { property: "block-size", value: "calc(1lh + var(--other))", raw: ["1lh"] },
    { property: "block-size", value: "calc((1lh) + 0)", raw: ["1lh"] },
    { property: "block-size", value: "calc(1lh + env(--ocelle-icon-size))", raw: ["1lh", "env(--ocelle-icon-size)"] },
    { property: "padding-block", value: "calc(var(--ocelle-icon-size) - 2lh)", raw: ["2lh"] },
    { property: "padding-block", value: "calc(var(--ocelle-icon-size) - 1lh - 1lh)", raw: ["1lh", "1lh"] },
    { property: "padding-block", value: "calc(var(--ocelle-icon-size) - 1lh) calc(var(--ocelle-icon-size) - 1lh - 1lh)", raw: ["1lh", "1lh"] },
    { property: "padding-block", value: "calc((var(--ocelle-icon-size) - 1lh) / 2) 1lh", raw: ["1lh"] },
    { property: "padding-block", value: "1lh 1lh", raw: ["1lh", "1lh"] },
    { property: "padding-block", value: "1lh var(--ocelle-space-1)", raw: ["1lh"] },
    { property: "block-size", value: "var(--ocelle-icon-size, 1lh)", raw: ["1lh"] },
    { property: "block-size", value: "max(1lh, var(--ocelle-icon-size))", raw: ["max(1lh, var(--ocelle-icon-size))"] },
  ])("$property: $value is raw: $raw, while block-size: 1lh and the row's padding pass", ({ property, value, raw }) => {
    expect({ value: rawValues(property, value), alone: rawValues("block-size", "1lh"), row: rawValues("padding-block", row) }).toEqual({ value: raw, alone: [], row: [] });
  });

  it("counts 1lh once per calc() expression, nested groups and calc() included, while each of two calc() expressions may hold one", () => {
    expect({
      nested: rawValues("padding-block", "calc(var(--ocelle-icon-size) - (1lh + calc(1lh)))"),
      two: rawValues("padding-block", "calc(var(--ocelle-icon-size) - 1lh) calc(var(--ocelle-space-1) + 1lh)"),
    }).toEqual({ nested: ["1lh", "1lh"], two: [] });
  });

  // OP4-01 (landing round 1 L1-02, T067): a group that holds only 1lh, parentheses or a nested calc(), any depth, is
  // that 1lh, so a factor on the group is a factor on 1lh and is raw; a sum beside the group stays admitted.
  it.each([
    { value: "calc((1lh) * 3 + var(--ocelle-space-1))", raw: ["1lh"] },
    { value: "calc(calc(1lh) * 3 + var(--ocelle-space-1))", raw: ["1lh"] },
    { value: "calc(3 * (1lh) + var(--ocelle-space-1))", raw: ["1lh"] },
    { value: "calc(((1lh)) * 3 + var(--ocelle-space-1))", raw: ["1lh"] },
    { value: "calc((1lh) / 2 + var(--ocelle-space-1))", raw: ["1lh"] },
    { value: "calc(var(--ocelle-space-1) * (1lh))", raw: ["1lh"] },
    { value: "calc(var(--ocelle-space-1) - calc((1lh)) / 2)", raw: ["1lh"] },
    // Two line boxes in one expression, each alone in its group (reported before OP4-01 too).
    { value: "calc((1lh) + (1lh) + var(--ocelle-space-1))", raw: ["1lh", "1lh"] },
  ])("padding-block: a factor on a group that holds only 1lh, $value, is raw: $raw", ({ value, raw }) => {
    expect(rawValues("padding-block", value)).toEqual(raw);
  });

  it.each([
    "calc((1lh) + var(--ocelle-space-1))",
    "calc(var(--ocelle-space-1) - calc(1lh))",
    "calc(var(--ocelle-space-1) + ((1lh)))",
    "calc((var(--ocelle-icon-size) - 1lh) / 2)",
  ])("padding-block: %s, 1lh alone in a group that is an operand of + or -, or beside a sum in its group, is token-only", (value) => {
    expect(rawValues("padding-block", value)).toEqual([]);
  });

  it("asks the token of the calc() expression that holds 1lh, wherever it is in that expression", () => {
    expect({
      nested: rawValues("padding-block", "calc((1lh - var(--ocelle-icon-size)) / 2)"),
      other: rawValues("padding-block", "calc(1lh + 0) var(--ocelle-space-1)"),
    }).toEqual({ nested: [], other: ["1lh"] });
  });

  it("reports the slot convention's rules of an element template not at all, and a multiple of a line box at its line", async () => {
    const code =
      "const css = String.raw;\nexport const styles = css`\n  .icon-row {\n    padding-block: calc((var(--ocelle-icon-size) - 1lh) / 2);\n  }\n" +
      "  .icon-slot {\n    block-size: 1lh;\n  }\n  .big {\n    block-size: calc(1lh * 2);\n  }\n`;\n";
    const { results } = await stylelint.lint({
      code,
      codeFilename: "x.ts",
      config: { plugins: [plugin], rules: { [ruleName]: true }, customSyntax: "postcss-lit" },
    });
    expect(results[0]?.warnings.map(({ line, text }) => ({ line, text }))).toEqual([
      { line: 10, text: "block-size: raw 1lh; use a --ocelle-* token (FR-024) (ocelle/token-only)" },
    ]);
  });
});

describe("referencedTokens()", () => {
  it.each([
    { value: "var(--ocelle-a) var", names: ["--ocelle-a"] },
    { value: "VAR(--ocelle-a)", names: ["--ocelle-a"] },
    { value: "env(--ocelle-b) attr(--ocelle-c) var(--ocelle-a)", names: ["--ocelle-a"] },
    { value: "--ocelle-b var(--ocelle-a)", names: ["--ocelle-a"] },
    { value: "calc(var(--ocelle-a) + var(--ocelle-b, var(--ocelle-a)))", names: ["--ocelle-a", "--ocelle-b"] },
    { value: "var(--tip) var(--ocelle-a)", names: ["--ocelle-a"] },
  ])("gives $names for $value, only the first argument of a var() function", ({ value, names }) => {
    expect(referencedTokens(value)).toEqual(names);
  });
});

describe("the ocelle/token-only plugin", () => {
  const config = { plugins: [plugin], rules: { [ruleName]: true } };

  it("is named ocelle/token-only and reports each declaration with a raw value once, at its line, naming the property and the raw values", async () => {
    expect(ruleName).toBe("ocelle/token-only");
    const code = "a {\n  width: 4px;\n  color: var(--ocelle-space-2);\n  box-shadow: 0 0 2px #000;\n}\n";
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
    const code = "a { width: var(--ocelle-space-2); margin: 0; content: \"\"; }\nb { top: 1px; }\n";
    const { results } = await stylelint.lint({ code, config });
    expect(results[0]?.warnings.map(({ line, text }) => ({ line, text }))).toEqual([
      { line: 2, text: "top: raw 1px; use a --ocelle-* token (FR-024) (ocelle/token-only)" },
    ]);
  });
});

// The unknown-token check (FR-010, SC-006, research.md R-09, contracts/gates.md § `style-lint`): a var() reference to
// an --ocelle-* name that is neither a token nor a custom property the custom-elements manifest declares (exact name,
// no prefix rule) is reported, also inside calc() and as a var() fallback. The lists are rule options here (fixture
// lists); without options the rule reads them under the root. A token source that fails validation, a manifest that
// is not JSON or not the manifest schema, and an element property with a token's full name stop the rule (exit 2).
describe("ocelle/token-only: unknown tokens, with fixture lists", () => {
  const lists = { tokens: ["--ocelle-color-canvas", "--ocelle-space-2"], elementProperties: ["--ocelle-button-gap"] };
  async function warnings(code: string, options: unknown = [true, lists]): Promise<{ line: number; text: string }[]> {
    const { results } = await stylelint.lint({ code, config: { plugins: [plugin], rules: { [ruleName]: options } } });
    return (results[0]?.warnings ?? []).map(({ line, text }) => ({ line, text }));
  }

  it("reports a misspelt token at its line, naming it", async () => {
    expect(await warnings("a {\n  color: var(--ocelle-color-canvs);\n}\n")).toEqual([
      { line: 2, text: "unknown token --ocelle-color-canvs (ocelle/token-only)" },
    ]);
  });

  it("reports an unknown token inside calc() and as a var() fallback", async () => {
    expect(await warnings("a {\n  width: calc(var(--ocelle-space-22) * 2);\n  color: var(--ocelle-color-canvas, var(--ocelle-color-canvs));\n}\n")).toEqual([
      { line: 2, text: "unknown token --ocelle-space-22 (ocelle/token-only)" },
      { line: 3, text: "unknown token --ocelle-color-canvs (ocelle/token-only)" },
    ]);
  });

  it("reports each unknown name of a declaration, after its raw values", async () => {
    expect(await warnings("a {\n  margin: var(--ocelle-spce-2, 4px) var(--ocelle-spce-3);\n}\n")).toEqual([
      { line: 2, text: "margin: raw 4px; use a --ocelle-* token (FR-024) (ocelle/token-only)" },
      { line: 2, text: "unknown token --ocelle-spce-2 (ocelle/token-only)" },
      { line: 2, text: "unknown token --ocelle-spce-3 (ocelle/token-only)" },
    ]);
  });

  it("accepts a real token, a declared element property and a custom property outside --ocelle- (only the control)", async () => {
    const code = "a {\n  color: var(--ocelle-color-canvas);\n  gap: var(--ocelle-button-gap);\n  anchor-name: var(--tip);\n  padding: var(--ocelle-space-2);\n  top: var(--ocelle-nope);\n}\n";
    expect(await warnings(code)).toEqual([{ line: 6, text: "unknown token --ocelle-nope (ocelle/token-only)" }]);
  });

  it("exempts element properties by exact name only: a misspelt one is unknown", async () => {
    expect(await warnings("a {\n  gap: var(--ocelle-button-gpa);\n  margin: var(--ocelle-button-gap-x);\n}\n")).toEqual([
      { line: 2, text: "unknown token --ocelle-button-gpa (ocelle/token-only)" },
      { line: 3, text: "unknown token --ocelle-button-gap-x (ocelle/token-only)" },
    ]);
  });

  it("does not treat a token definition as a reference", async () => {
    expect(await warnings("a {\n  --ocelle-color-canvs: var(--ocelle-color-canvas);\n  top: var(--ocelle-colour);\n}\n")).toEqual([
      { line: 3, text: "unknown token --ocelle-colour (ocelle/token-only)" },
    ]);
  });

  it("stops (throws) when an element property has the full name of a token", async () => {
    await expect(warnings("a { gap: var(--ocelle-space-2); }", [true, { tokens: ["--ocelle-space-2"], elementProperties: ["--ocelle-space-2"] }])).rejects.toThrow(
      "token-only: element property --ocelle-space-2 has the name of a token",
    );
  });

  it("takes an absent list as empty: tokens alone make element properties unknown, element properties alone make tokens unknown", async () => {
    const code = "a {\n  gap: var(--ocelle-button-gap);\n  padding: var(--ocelle-space-2);\n}\n";
    expect(await warnings(code, [true, { tokens: ["--ocelle-space-2"] }])).toEqual([{ line: 2, text: "unknown token --ocelle-button-gap (ocelle/token-only)" }]);
    expect(await warnings(code, [true, { elementProperties: ["--ocelle-button-gap"] }])).toEqual([{ line: 3, text: "unknown token --ocelle-space-2 (ocelle/token-only)" }]);
  });

  it("takes a bare word var as no reference (only the control)", async () => {
    expect(await warnings("a {\n  animation-name: var;\n  top: var(--ocelle-nope);\n}\n")).toEqual([{ line: 3, text: "unknown token --ocelle-nope (ocelle/token-only)" }]);
  });

  it.each([[{ tokens: [1] }], [{ tokens: ["--ocelle-a"], elementProperties: [2] }], [{ colours: [] }]])("reports the invalid secondary option %j", async (secondary) => {
    const { results } = await stylelint.lint({ code: "a { color: var(--ocelle-x); }", config: { plugins: [plugin], rules: { [ruleName]: [true, secondary] } } });
    expect(results[0]?.invalidOptionWarnings).toHaveLength(1);
  });
});

describe("ocelle/token-only without options reads the lists of the repository it runs in", () => {
  it("reports a misspelt token of the real source and accepts a real one", async () => {
    const code = "a {\n  color: var(--ocelle-color-canvs);\n  background: var(--ocelle-color-canvas);\n}\n";
    const { results } = await stylelint.lint({ code, config: { plugins: [plugin], rules: { [ruleName]: true } } });
    expect(results[0]?.warnings.map(({ line, text }) => ({ line, text }))).toEqual([{ line: 2, text: "unknown token --ocelle-color-canvs (ocelle/token-only)" }]);
  });

  it("takes a null secondary option as no options: a real token of the repository is known", async () => {
    const code = "a {\n  background: var(--ocelle-color-canvas);\n  padding: var(--ocelle-space-2);\n}\n";
    const { results } = await stylelint.lint({ code, config: { plugins: [plugin], rules: { [ruleName]: [true, null] } } });
    expect(results[0]?.warnings).toEqual([]);
  });
});

describe("loadLists()", () => {
  const made: string[] = [];
  const generator = readFileSync(join(repoRoot, "packages/tokens/src/generate.ts"), "utf8");
  const validSource =
    'export const source = [\n  { name: "color-canvas", group: "colour", value: { light: "#FFFFFF", dark: "#000000" } },\n  { name: "space-2", group: "space", value: "0.5rem" },\n];\n';

  /** A temporary repository root with a token source (and the real generator) and, when given, a manifest. */
  function root(sourceText: string | undefined, manifest?: string): string {
    const dir = mkdtempSync(join(tmpdir(), "ocelle-token-lists-"));
    made.push(dir);
    mkdirSync(join(dir, "packages/tokens/src"), { recursive: true });
    writeFileSync(join(dir, "packages/tokens/src/generate.ts"), generator);
    if (sourceText !== undefined) writeFileSync(join(dir, "packages/tokens/src/source.ts"), sourceText);
    if (manifest !== undefined) {
      mkdirSync(join(dir, "packages/elements"), { recursive: true });
      writeFileSync(join(dir, "packages/elements/custom-elements.json"), manifest);
    }
    return dir;
  }

  afterEach(() => {
    for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  const manifest = (properties: readonly string[]): string =>
    JSON.stringify({
      schemaVersion: "2.1.0",
      modules: [
        { kind: "javascript-module", path: "src/x.ts", declarations: [{ kind: "class", name: "X" }] },
        {
          kind: "javascript-module",
          path: "src/button.ts",
          declarations: [{ kind: "class", name: "OcelleButton", tagName: "ocelle-button", cssProperties: properties.map((name) => ({ name })) }],
        },
      ],
    });

  it("reads the full token names of the source and no element property while the manifest is absent", async () => {
    await expect(loadLists(root(validSource))).resolves.toEqual({ tokens: ["--ocelle-color-canvas", "--ocelle-space-2"], elementProperties: [] });
  });

  it("reads the cssProperties names the manifest declares", async () => {
    await expect(loadLists(root(validSource, manifest(["--ocelle-button-gap", "--ocelle-button-pad"])))).resolves.toEqual({
      tokens: ["--ocelle-color-canvas", "--ocelle-space-2"],
      elementProperties: ["--ocelle-button-gap", "--ocelle-button-pad"],
    });
  });

  it("throws naming the file when the token source is missing", async () => {
    await expect(loadLists(root(undefined))).rejects.toThrow("token-only: cannot load the token source packages/tokens/src/source.ts");
  });

  it("throws naming the rule when the token source fails validation", async () => {
    const duplicate = validSource.replace('"space-2"', '"color-canvas", group: "colour", value: { light: "#FFFFFF", dark: "#000000" } }, { name: "space-2"');
    await expect(loadLists(root(duplicate))).rejects.toThrow(
      "token-only: the token source packages/tokens/src/source.ts is invalid: invalid token source: token color-canvas: duplicate name",
    );
  });

  it("throws when the manifest is not JSON", async () => {
    await expect(loadLists(root(validSource, "{ not json"))).rejects.toThrow("token-only: packages/elements/custom-elements.json is not JSON");
  });

  it.each([
    ["no schemaVersion", JSON.stringify({ modules: [] })],
    ["modules not a list", JSON.stringify({ schemaVersion: "2.1.0", modules: {} })],
    ["a cssProperties entry without a name", JSON.stringify({ schemaVersion: "2.1.0", modules: [{ declarations: [{ cssProperties: [{ syntax: "<length>" }] }] }] })],
    ["a list at the top", "[]"],
  ])("throws when the manifest is not the custom-elements manifest schema: %s", async (_, text) => {
    await expect(loadLists(root(validSource, text))).rejects.toThrow("token-only: packages/elements/custom-elements.json is not a custom-elements manifest");
  });

  it("throws naming the file, the reason and the cause when the manifest cannot be read", async () => {
    const dir = root(validSource);
    mkdirSync(join(dir, "packages/elements/custom-elements.json"), { recursive: true });
    const loading = loadLists(dir);
    await expect(loading).rejects.toHaveProperty("cause.code", "EISDIR");
    const error = (await loading.catch((thrown: unknown) => thrown)) as Error & { cause: Error };
    expect(error).toBeInstanceOf(Error);
    expect(error.cause).toBeInstanceOf(Error);
    expect(error.cause.message).not.toBe("");
    expect(error.message.startsWith("token-only: cannot read packages/elements/custom-elements.json: ")).toBe(true);
    expect(error.message.endsWith(error.cause.message)).toBe(true);
    expect(error.message).toBe(`token-only: cannot read packages/elements/custom-elements.json: ${error.cause.message}`);
  });

  it("throws with the parse error as the cause when the manifest is not JSON", async () => {
    const loading = loadLists(root(validSource, "{ not json"));
    await expect(loading).rejects.toThrow(/^token-only: packages\/elements\/custom-elements\.json is not JSON \(.+\)$/);
    await expect(loading).rejects.toHaveProperty("cause.name", "SyntaxError");
  });

  it("throws naming the reason exactly when the manifest is not the schema", async () => {
    await expect(loadLists(root(validSource, JSON.stringify({ schemaVersion: "2.1.0", modules: [{ declarations: {} }] })))).rejects.toThrow(
      new Error("token-only: packages/elements/custom-elements.json is not a custom-elements manifest (declarations is not a list)"),
    );
  });

  it("throws naming the source and the cause when the source exports no list", async () => {
    const loading = loadLists(root("export const source = {};\n"));
    await expect(loading).rejects.toThrow(new Error("token-only: cannot load the token source packages/tokens/src/source.ts: it exports no source list"));
    await expect(loading).rejects.toHaveProperty("cause.message", "it exports no source list");
  });

  it("throws naming the generator when it exports no validateSource", async () => {
    const dir = root(validSource);
    writeFileSync(join(dir, "packages/tokens/src/generate.ts"), "export const validate = 1;\n");
    const loading = loadLists(dir);
    await expect(loading).rejects.toThrow(
      new Error("token-only: cannot load the token source packages/tokens/src/source.ts: packages/tokens/src/generate.ts exports no validateSource"),
    );
    await expect(loading).rejects.toHaveProperty("cause.message", "packages/tokens/src/generate.ts exports no validateSource");
  });

  it("throws with the validation error as the cause when the source is invalid", async () => {
    const duplicate = validSource.replace('"space-2"', '"color-canvas", group: "colour", value: { light: "#FFFFFF", dark: "#000000" } }, { name: "space-2"');
    await expect(loadLists(root(duplicate))).rejects.toHaveProperty("cause.message", "invalid token source: token color-canvas: duplicate name");
  });

  it("throws when a declared element property has the full name of a token", async () => {
    await expect(loadLists(root(validSource, manifest(["--ocelle-button-gap", "--ocelle-space-2"])))).rejects.toThrow(
      "token-only: element property --ocelle-space-2 has the name of a token",
    );
  });
});

// manifestProperties() reads the cssProperties names of a parsed custom-elements manifest, or gives the exact reason
// it is not one; the gate's message carries that reason (contracts/gates.md § `style-lint`).
describe("manifestProperties()", () => {
  const module = (declarations: unknown): unknown => ({ schemaVersion: "2.1.0", modules: [{ kind: "javascript-module", declarations }] });

  it.each([
    ["null", null, "not an object"],
    ["a list", [], "not an object"],
    ["a string", "manifest", "not an object"],
    ["no schemaVersion", { modules: [] }, "no schemaVersion"],
    ["a schemaVersion that is not text", { schemaVersion: 2, modules: [] }, "no schemaVersion"],
    ["modules that is not a list", { schemaVersion: "2.1.0", modules: {} }, "modules is not a list"],
    ["a module that is null", { schemaVersion: "2.1.0", modules: [null] }, "a module is not an object"],
    ["a module that is a list", { schemaVersion: "2.1.0", modules: [[]] }, "a module is not an object"],
    ["declarations that is not a list", module({}), "declarations is not a list"],
    ["a declaration that is null", module([null]), "a declaration is not an object"],
    ["a declaration that is a list", module([[]]), "a declaration is not an object"],
    ["cssProperties that is not a list", module([{ cssProperties: "--ocelle-x" }]), "cssProperties is not a list"],
    ["a cssProperties entry that is null", module([{ cssProperties: [null] }]), "a cssProperties entry has no name"],
    ["a cssProperties entry without a name", module([{ cssProperties: [{ syntax: "<length>" }] }]), "a cssProperties entry has no name"],
    ["a cssProperties entry whose name is not text", module([{ cssProperties: [{ name: 1 }] }]), "a cssProperties entry has no name"],
  ])("gives the reason for %s", (_, manifest, reason) => {
    expect(manifestProperties(manifest)).toBe(reason);
  });

  it("gives the names in order, skipping modules without declarations and declarations without cssProperties", () => {
    const manifest = {
      schemaVersion: "2.1.0",
      modules: [
        { kind: "javascript-module", path: "src/a.ts" },
        { kind: "javascript-module", declarations: [{ kind: "class" }, { kind: "class", cssProperties: [{ name: "--ocelle-a-gap" }, { name: "--ocelle-a-pad" }] }] },
        { kind: "javascript-module", declarations: [{ kind: "class", cssProperties: [{ name: "--ocelle-b-gap" }] }] },
      ],
    };
    expect(manifestProperties(manifest)).toEqual(["--ocelle-a-gap", "--ocelle-a-pad", "--ocelle-b-gap"]);
  });
});

// The secondary option `lineHeight: "token"` (003 FR-002, research.md R-07, contracts/checks.md § Gates changed):
// with it, a line height, in `line-height` or after the `/` of `font`, passes only as one var(--ocelle-*) reference
// (no fallback) or a CSS-wide keyword; a number, a percentage, any calc() and `normal` are raw there. Without it they
// stay as 002 allows them. The option is read apart from the token lists: an object with only `lineHeight` keeps the
// repository lists, and lists given with it are used. Any other value of the option is an invalid option.
describe("rawValues with the lineHeight: \"token\" option", () => {
  const token = { lineHeight: "token" } as const;

  it.each([
    { property: "line-height", value: "1.65" },
    { property: "line-height", value: "165%" },
    { property: "line-height", value: "calc(1.65)" },
    { property: "line-height", value: "normal" },
    { property: "line-height", value: "calc(var(--ocelle-line-height-normal) * 1)" },
    { property: "LINE-HEIGHT", value: "1.65" },
  ])("$property: $value is raw with the option and allowed without it", ({ property, value }) => {
    expect([rawValues(property, value, token), rawValues(property, value)]).toEqual([[value], []]);
  });

  it.each([
    { value: "var(--ocelle-font-size-md)/165% var(--ocelle-font-sans)", raw: "165%" },
    { value: "var(--ocelle-font-size-md) / calc(1.65) var(--ocelle-font-sans)", raw: "calc(1.65)" },
  ])("font: $value has the raw line height $raw with the option and none without it", ({ value, raw }) => {
    expect([rawValues("font", value, token), rawValues("font", value)]).toEqual([[raw], []]);
  });

  it("font: a number or normal after the slash stays raw with and without the option, reported once", () => {
    expect([
      rawValues("font", "var(--ocelle-font-size-md)/1.65 var(--ocelle-font-sans)", token),
      rawValues("font", "var(--ocelle-font-size-md)/1.65 var(--ocelle-font-sans)"),
      rawValues("font", "var(--ocelle-font-size-md)/normal var(--ocelle-font-sans)", token),
      rawValues("font", "var(--ocelle-font-size-md)/165% var(--ocelle-font-sans)", token),
    ]).toEqual([["1.65"], ["1.65"], ["normal"], ["165%"]]);
  });

  it.each(["var(--ocelle-line-height-normal)", "VAR(--ocelle-line-height-prose)", "inherit", "initial", "unset", "revert", "revert-layer", "INHERIT"])(
    "line-height: %s passes with the option, and a fallback or a second part beside it is raw",
    (value) => {
      expect([
        rawValues("line-height", value, token),
        rawValues("line-height", `${value} 1`, token),
        rawValues("line-height", "var(--ocelle-line-height-normal, 1.5)", token),
        rawValues("line-height", "var(--tip)", token),
      ]).toEqual([[], [`${value} 1`], ["var(--ocelle-line-height-normal, 1.5)"], ["var(--tip)"]]);
    },
  );

  it("font: a token or a CSS-wide keyword after the slash passes with the option; other parts keep their 002 checks", () => {
    expect([
      rawValues("font", "var(--ocelle-font-size-md)/var(--ocelle-line-height-normal) var(--ocelle-font-sans)", token),
      rawValues("font", "var(--ocelle-font-size-md) / inherit var(--ocelle-font-sans)", token),
      rawValues("font", "16px/var(--ocelle-line-height-normal) Inter", token),
      rawValues("font", "var(--ocelle-font-size-md)/165%", token),
      rawValues("font", "inherit", token),
    ]).toEqual([[], [], ["16px", "Inter"], ["165%"], []]);
  });

  it("leaves every other property as 002 checks it: unitless numbers stay allowed for flex, z-index, opacity and order", () => {
    expect([
      rawValues("flex", "1 1 0%", token),
      rawValues("z-index", "10", token),
      rawValues("opacity", "0.5", token),
      rawValues("order", "-1", token),
      rawValues("width", "165%", token),
      rawValues("width", "calc(1.65)", token),
      rawValues("margin", "2rem", token),
      rawValues("line-height", "1.65", token),
    ]).toEqual([[], [], [], [], [], [], ["2rem"], ["1.65"]]);
  });
});

// Added after the phase 2 mutation run (surviving mutants of tokenLineHeight(), fontRaw() and rawValues()): a
// string or another function is not a token, the line height of `font` is the part right after the slash (not after
// a comma or a string "/"), a `font` without a slash keeps its 002 checks, every other part of a `font` value is
// checked outside calc(), and the raw line height is reported trimmed.
describe("rawValues with the lineHeight: \"token\" option: edges", () => {
  const token = { lineHeight: "token" } as const;

  it("reports a string, another function naming a token and a function with no argument as a raw line height", () => {
    expect([
      rawValues("line-height", '"var"', token),
      rawValues("line-height", "env(--ocelle-line-height-normal)", token),
      rawValues("line-height", "var()", token),
    ]).toEqual([['"var"'], ["env(--ocelle-line-height-normal)"], ["var()"]]);
  });

  it("takes the part right after the slash as the line height of font, not the part after a comma or a string \"/\"", () => {
    expect([
      rawValues("font", "var(--ocelle-font-sans), var(--ocelle-font-size-md)/165%", token),
      rawValues("font", '"/" var(--ocelle-font-size-md)/165%', token),
    ]).toEqual([["165%"], ['"/"', "165%"]]);
  });

  it("reports a font value without a slash as raw with the option (it resets line-height to normal), and checks it as 002 does without it, so a percentage or calc() there is allowed", () => {
    expect([
      rawValues("font", "165% var(--ocelle-font-sans)", token),
      rawValues("font", "calc(var(--a) * 2) var(--ocelle-font-sans)", token),
      rawValues("font", "165% var(--ocelle-font-sans)"),
      rawValues("font", "calc(var(--a) * 2) var(--ocelle-font-sans)"),
    ]).toEqual([["165% var(--ocelle-font-sans)"], ["calc(var(--a) * 2) var(--ocelle-font-sans)"], [], []]);
  });

  it("checks the other parts of a font value outside calc(): a bare number is raw", () => {
    expect(rawValues("font", "600 var(--ocelle-font-size-md)/var(--ocelle-line-height-normal) var(--ocelle-font-sans)", token)).toEqual(["600"]);
  });

  it("reports a raw line height without the surrounding white space", () => {
    expect(rawValues("line-height", "  1.65 ", token)).toEqual(["1.65"]);
  });
});

describe("the ocelle/token-only plugin with the lineHeight: \"token\" option", () => {
  async function lint(code: string, options: unknown): Promise<{ readonly warnings: { line: number; text: string }[]; readonly invalid: number }> {
    const { results } = await stylelint.lint({ code, config: { plugins: [plugin], rules: { [ruleName]: options } } });
    return {
      warnings: (results[0]?.warnings ?? []).map(({ line, text }) => ({ line, text })),
      invalid: (results[0]?.invalidOptionWarnings ?? []).length,
    };
  }

  const code =
    "a {\n  line-height: var(--ocelle-line-height-normal);\n  line-height: inherit;\n  line-height: 1.65;\n  font: var(--ocelle-font-size-md)/165% var(--ocelle-font-sans);\n  line-height: var(--ocelle-nope);\n}\n";

  it("keeps the repository token lists when lineHeight is the only option (a real token and a keyword pass, a literal and an unknown token are reported); without the option only the unknown token is", async () => {
    expect([await lint(code, [true, { lineHeight: "token" }]), await lint(code, true)]).toEqual([
      {
        warnings: [
          { line: 4, text: "line-height: raw 1.65; use a --ocelle-* token (FR-024) (ocelle/token-only)" },
          { line: 5, text: "font: raw 165%; use a --ocelle-* token (FR-024) (ocelle/token-only)" },
          { line: 6, text: "line-height: raw var(--ocelle-nope); use a --ocelle-* token (FR-024) (ocelle/token-only)" },
          { line: 6, text: "unknown token --ocelle-nope (ocelle/token-only)" },
        ],
        invalid: 0,
      },
      { warnings: [{ line: 6, text: "unknown token --ocelle-nope (ocelle/token-only)" }], invalid: 0 },
    ]);
  });

  it("uses the lists given beside the option instead of the repository's", async () => {
    const lists = { tokens: ["--ocelle-line-height-normal", "--ocelle-font-size-md", "--ocelle-font-sans"], lineHeight: "token" };
    const listed = "a {\n  line-height: var(--ocelle-line-height-normal);\n  line-height: var(--ocelle-line-height-tight);\n  line-height: 1.5;\n}\n";
    expect(await lint(listed, [true, lists])).toEqual({
      warnings: [
        { line: 3, text: "unknown token --ocelle-line-height-tight (ocelle/token-only)" },
        { line: 4, text: "line-height: raw 1.5; use a --ocelle-* token (FR-024) (ocelle/token-only)" },
      ],
      invalid: 0,
    });
  });

  it.each([[{ lineHeight: "number" }], [{ lineHeight: true }], [{ lineHeight: "token", tokens: [1] }]])(
    "reports the invalid secondary option %j and checks nothing with it, while lineHeight: \"token\" is valid",
    async (secondary) => {
      expect([await lint("a { line-height: 1.65; }", [true, secondary]), (await lint("a { line-height: 1.65; }", [true, { lineHeight: "token" }])).invalid]).toEqual([
        { warnings: [], invalid: 1 },
        0,
      ]);
    },
  );
});

// Scope amended by the operator round of 2026-11-09 (003 phase 2 round 2, O2-01; landing review L1-01; research.md
// R-07): under the option a line height passes only as var(--ocelle-line-height-*) (one argument, case-sensitive
// name) or a CSS-wide keyword, so another token is raw there; and a font value with no top-level `/` (one inside a
// function or a string does not count) is raw as a whole, its trimmed value, unless it is a CSS-wide keyword alone.
// Without the option each value gives what 002 gives.
describe("rawValues with the lineHeight: \"token\" option: only a line-height token is a line height (O2-01)", () => {
  const token = { lineHeight: "token" } as const;

  it.each([
    { property: "line-height", value: "var(--ocelle-space-4)", raw: ["var(--ocelle-space-4)"] },
    { property: "line-height", value: "var(--ocelle-line-height)", raw: ["var(--ocelle-line-height)"] },
    { property: "line-height", value: "var(--OCELLE-line-height-normal)", raw: ["var(--OCELLE-line-height-normal)"] },
    { property: "line-height", value: "var(--ocelle-font-size-md)", raw: ["var(--ocelle-font-size-md)"] },
    { property: "line-height", value: "var(--ocelle-line-height-normal, 1.5)", raw: ["var(--ocelle-line-height-normal, 1.5)"] },
    { property: "font", value: "var(--ocelle-font-size-md)/var(--ocelle-space-4) var(--ocelle-font-sans)", raw: ["var(--ocelle-space-4)"] },
    { property: "font", value: "var(--ocelle-font-size-md)/var(--ocelle-line-height) var(--ocelle-font-sans)", raw: ["var(--ocelle-line-height)"] },
  ])("$property: $value has the raw line height $raw with the option and none without it", ({ property, value, raw }) => {
    expect([rawValues(property, value, token), rawValues(property, value)]).toEqual([raw, []]);
  });

  it.each(["var(--ocelle-line-height-normal)", "VAR(--ocelle-line-height-prose)", "var(--ocelle-line-height-nope)", "inherit", "INHERIT", "revert-layer"])(
    "%s passes as a line height with the option, in line-height and after the slash of font",
    (value) => {
      expect([rawValues("line-height", value, token), rawValues("font", `var(--ocelle-font-size-md)/${value} var(--ocelle-font-sans)`, token)]).toEqual([[], []]);
    },
  );
});

describe("rawValues with the lineHeight: \"token\" option: a font value must state its line height (O2-01)", () => {
  const token = { lineHeight: "token" } as const;

  it.each([
    { value: "var(--ocelle-font-size-md) var(--ocelle-font-sans)", without: [] },
    { value: "165% var(--ocelle-font-sans)", without: [] },
    { value: "var(--ocelle-font-sans)", without: [] },
    { value: "normal", without: ["normal"] },
    { value: "caption", without: ["caption"] },
    { value: "var(--ocelle-font-sans, 16px/1.5 Inter)", without: ["16px", "1.5", "Inter"] },
    { value: '"/" var(--ocelle-font-sans)', without: ['"/"'] },
  ])("font: $value without a top-level slash is raw as one entry with the option, and gives $without without it", ({ value, without }) => {
    expect([rawValues("font", value, token), rawValues("font", value)]).toEqual([[value], without]);
  });

  it("reports a slash-less font value trimmed", () => {
    expect([rawValues("font", "  var(--ocelle-font-size-md) var(--ocelle-font-sans) ", token), rawValues("font", "  var(--ocelle-font-size-md) var(--ocelle-font-sans) ")]).toEqual([
      ["var(--ocelle-font-size-md) var(--ocelle-font-sans)"],
      [],
    ]);
  });

  it.each(["inherit", "INHERIT", "initial", "unset", "revert", "revert-layer", "  inherit "])("font: %j, a CSS-wide keyword alone, passes with and without the option", (value) => {
    expect([rawValues("font", value, token), rawValues("font", value)]).toEqual([[], []]);
  });
});

describe("the ocelle/token-only plugin with the lineHeight: \"token\" option: O2-01", () => {
  async function lint(code: string, options: unknown): Promise<{ line: number; text: string }[]> {
    const { results } = await stylelint.lint({ code, config: { plugins: [plugin], rules: { [ruleName]: options } } });
    return (results[0]?.warnings ?? []).map(({ line, text }) => ({ line, text }));
  }

  const code =
    "a {\n  line-height: var(--ocelle-space-4);\n  font: var(--ocelle-font-size-md) var(--ocelle-font-sans);\n  font: inherit;\n  line-height: var(--ocelle-line-height-nope);\n}\n";

  it("reports another token as a line height and a font without a line height, once each, with the repository lists; nothing for font: inherit; and without the option only the unknown token", async () => {
    expect([await lint(code, [true, { lineHeight: "token" }]), await lint(code, true)]).toEqual([
      [
        { line: 2, text: "line-height: raw var(--ocelle-space-4); use a --ocelle-* token (FR-024) (ocelle/token-only)" },
        { line: 3, text: "font: raw var(--ocelle-font-size-md) var(--ocelle-font-sans); use a --ocelle-* token (FR-024) (ocelle/token-only)" },
        { line: 5, text: "unknown token --ocelle-line-height-nope (ocelle/token-only)" },
      ],
      [{ line: 5, text: "unknown token --ocelle-line-height-nope (ocelle/token-only)" }],
    ]);
  });
});

// The grid allowance of 013 (research.md R-10, PLAN-CORRECTNESS-1-001 (a); tasks.md T008, T008a): in
// `grid-template-columns` only, a track may be `fit-content(<percentage>)` (the facts label column, capped) or
// `minmax(0, <flex>)` (the value column, and each of the grid layout's four tracks written out). Any other argument,
// any other property, a nested function and `repeat()` stay raw. Each finding shares its test with the allowed value
// it guards, so the allowance and its limits are seen together.
describe("rawValues: the grid-template-columns allowance (013 R-10)", () => {
  const allowed = "fit-content(50%) minmax(0, 1fr)";

  it.each([
    { value: "fit-content(50%) minmax(0, 1fr)" },
    { value: "minmax(0, 1fr)" },
    { value: "minmax(0, 2.5fr)" },
    { value: "fit-content(33.3%)" },
    { value: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)" },
    { value: "minmax(0, 1fr) minmax(0, 1fr)" },
    { value: "minmax(0, /* the value column */ 1fr)" },
    { value: "fit-content(/* the label column */ 50%)" },
  ])("grid-template-columns: $value is token-only (only the control 4px after it is raw)", ({ value }) => {
    expect({ value: rawValues("grid-template-columns", value), control: rawValues("grid-template-columns", `${value} 4px`), upper: rawValues("GRID-TEMPLATE-COLUMNS", value) }).toEqual({ value: [], control: ["4px"], upper: [] });
  });

  it.each([
    { value: "fit-content(200px)", raw: ["fit-content(200px)"] },
    { value: "fit-content(0)", raw: ["fit-content(0)"] },
    { value: "fit-content(50%, 1fr)", raw: ["fit-content(50%, 1fr)"] },
    { value: "minmax(auto, 50%)", raw: ["minmax(auto, 50%)"] },
    { value: "minmax(0, 200px)", raw: ["minmax(0, 200px)"] },
    { value: "minmax(0, 50%)", raw: ["minmax(0, 50%)"] },
    { value: "minmax(1px, 1fr)", raw: ["minmax(1px, 1fr)"] },
    { value: "minmax(0, 1fr, 2fr)", raw: ["minmax(0, 1fr, 2fr)"] },
    { value: "minmax(0, calc(1fr))", raw: ["minmax(0, calc(1fr))"] },
    { value: "fit-content(calc(50%))", raw: ["fit-content(calc(50%))"] },
    { value: "fit-content(var(--ocelle-space-4))", raw: ["fit-content(var(--ocelle-space-4))"] },
    { value: "minmax(0, fit-content(50%))", raw: ["minmax(0, fit-content(50%))"] },
    { value: "repeat(4, minmax(0, 1fr))", raw: ["repeat(4, minmax(0, 1fr))"] },
    { value: "fit-content(50%) minmax(0, 200px)", raw: ["minmax(0, 200px)"] },
    { value: "max(0, 1fr)", raw: ["max(0, 1fr)"] },
    { value: "minmax(0 / 1fr)", raw: ["minmax(0 / 1fr)"] },
  ])("grid-template-columns: $value is raw: $raw, while fit-content(50%) minmax(0, 1fr) passes", ({ value, raw }) => {
    expect({ value: rawValues("grid-template-columns", value), allowed: rawValues("grid-template-columns", allowed) }).toEqual({ value: raw, allowed: [] });
  });

  it.each([
    { property: "grid-template-rows", value: "minmax(0, 1fr)" },
    { property: "grid-template-rows", value: "fit-content(50%)" },
    { property: "grid-auto-columns", value: "minmax(0, 1fr)" },
    { property: "width", value: "fit-content(50%)" },
    { property: "inline-size", value: "minmax(0, 1fr)" },
    { property: "grid-template", value: "minmax(0, 1fr) / fit-content(50%)" },
  ])("$property: $value stays raw in any other property, while grid-template-columns passes it", ({ property, value }) => {
    expect({ other: rawValues(property, value).length > 0, columns: rawValues("grid-template-columns", allowed) }).toEqual({ other: true, columns: [] });
  });

  it("reports the facts tracks of an element template not at all, and fit-content(200px) and repeat() at their lines", async () => {
    const code =
      "const css = String.raw;\nexport const styles = css`\n  dl {\n    grid-template-columns: fit-content(50%) minmax(0, 1fr);\n  }\n  .grid {\n    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);\n  }\n  .bad {\n    grid-template-columns: fit-content(200px);\n  }\n  .worse {\n    grid-template-columns: repeat(4, minmax(0, 1fr));\n  }\n`;\n";
    const { results } = await stylelint.lint({ code, codeFilename: "x.ts", config: { plugins: [plugin], rules: { [ruleName]: true }, customSyntax: "postcss-lit" } });
    expect(results[0]?.warnings.map(({ line, text }) => ({ line, text }))).toEqual([
      { line: 10, text: "grid-template-columns: raw fit-content(200px); use a --ocelle-* token (FR-024) (ocelle/token-only)" },
      { line: 13, text: "grid-template-columns: raw repeat(4, minmax(0, 1fr)); use a --ocelle-* token (FR-024) (ocelle/token-only)" },
    ]);
  });
});

// The sweep allowance of 013 phase 3 (research.md R-10, PLAN-CORRECTNESS-1-001 (a), PLAN-A11Y-SECURITY-1-001 (a); tasks.md
// T042): in `transform`, in a rule or in `@keyframes`, `translateX(<percentage>)` (one percentage argument) passes, and
// in `animation-iteration-count` a bare positive integer passes. Any other function, argument or property stays raw;
// `infinite` was already an identifier. Each finding shares its test with the allowed value it guards.
describe("rawValues: the transform and animation-iteration-count allowance (013 R-10)", () => {
  it.each([
    { property: "transform", value: "translateX(-175%)" },
    { property: "transform", value: "translateX(175%)" },
    { property: "transform", value: "translateX(0%)" },
    { property: "transform", value: "translateX(12.5%)" },
    { property: "TRANSFORM", value: "TRANSLATEX(50%)" },
    { property: "animation-iteration-count", value: "3" },
    { property: "animation-iteration-count", value: "1" },
    { property: "animation-iteration-count", value: "12" },
  ])("$property: $value is token-only (only the control 4px after it is raw)", ({ property, value }) => {
    expect({ value: rawValues(property, value), control: rawValues(property, `${value} 4px`) }).toEqual({ value: [], control: ["4px"] });
  });

  it.each([
    { value: "translateX(8px)", raw: ["translateX(8px)"] },
    { value: "translateX(0)", raw: ["translateX(0)"] },
    { value: "translateY(50%)", raw: ["translateY(50%)"] },
    { value: "translate(50%)", raw: ["translate(50%)"] },
    { value: "translate3d(50%, 0, 0)", raw: ["translate3d(50%, 0, 0)"] },
    { value: "translateX(50%, 10%)", raw: ["translateX(50%, 10%)"] },
    { value: "translateX(calc(50%))", raw: ["translateX(calc(50%))"] },
    { value: "translateX(var(--ocelle-space-4))", raw: ["translateX(var(--ocelle-space-4))"] },
    { value: "translateX(50%) rotate(45deg)", raw: ["rotate(45deg)"] },
    { value: "scale(2)", raw: ["scale(2)"] },
  ])("transform: $value is raw: $raw, while translateX(175%) passes", ({ value, raw }) => {
    expect({ value: rawValues("transform", value), allowed: rawValues("transform", "translateX(175%)") }).toEqual({ value: raw, allowed: [] });
  });

  it.each([
    { value: "2.5", raw: ["2.5"] },
    { value: "-1", raw: ["-1"] },
    { value: "3 2", raw: ["3", "2"] },
    { value: "1e1", raw: ["1e1"] },
  ])("animation-iteration-count: $value is raw: $raw, while 3 passes", ({ value, raw }) => {
    expect({ value: rawValues("animation-iteration-count", value), allowed: rawValues("animation-iteration-count", "3") }).toEqual({ value: raw, allowed: [] });
  });

  it.each([
    { property: "translate", value: "translateX(50%)" },
    { property: "background-position", value: "translateX(50%)" },
    { property: "animation", value: "sweep 3" },
    { property: "column-count", value: "3" },
    { property: "transition-delay", value: "3" },
  ])("$property: $value stays raw in any other property, while transform and animation-iteration-count pass theirs", ({ property, value }) => {
    expect({ other: rawValues(property, value).length > 0, transform: rawValues("transform", "translateX(-175%)"), count: rawValues("animation-iteration-count", "3") }).toEqual({ other: true, transform: [], count: [] });
  });

  it("reports the sweep's keyframes and iteration count of an element template not at all, and translateX(8px) and a fractional count at their lines", async () => {
    const code =
      "const css = String.raw;\nexport const styles = css`\n  @keyframes sweep {\n    from { transform: translateX(-175%); }\n    to { transform: translateX(175%); }\n  }\n  .mark {\n    animation-iteration-count: 3;\n  }\n  .bad {\n    transform: translateX(8px);\n    animation-iteration-count: 2.5;\n  }\n`;\n";
    const { results } = await stylelint.lint({ code, codeFilename: "x.ts", config: { plugins: [plugin], rules: { [ruleName]: true }, customSyntax: "postcss-lit" } });
    expect(results[0]?.warnings.map(({ line, text }) => ({ line, text }))).toEqual([
      { line: 11, text: "transform: raw translateX(8px); use a --ocelle-* token (FR-024) (ocelle/token-only)" },
      { line: 12, text: "animation-iteration-count: raw 2.5; use a --ocelle-* token (FR-024) (ocelle/token-only)" },
    ]);
  });
});
