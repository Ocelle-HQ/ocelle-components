import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import stylelint from "stylelint";
import { afterEach, describe, expect, it } from "vitest";
import { loadLists } from "../stylelint/token-lists.ts";
import plugin, { rawValues, ruleName } from "../stylelint/token-only.ts";

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

  it("throws when a declared element property has the full name of a token", async () => {
    await expect(loadLists(root(validSource, manifest(["--ocelle-button-gap", "--ocelle-space-2"])))).rejects.toThrow(
      "token-only: element property --ocelle-space-2 has the name of a token",
    );
  });
});
