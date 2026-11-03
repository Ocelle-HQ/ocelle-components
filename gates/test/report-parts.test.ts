import { describe, expect, it } from "vitest";
import { classifyStylelint } from "../lib/stylelint-report.ts";
import { classifyTsc } from "../lib/tsc-report.ts";

// The tsc and Stylelint classifiers at the edges (contracts/gate-cli.md; phase 4 review round 1, R1-07): diagnostic
// lines with multi-digit lines and columns, continuation lines and lines that only contain "error TS", the summary
// line tsc prints, which line of a tool's own error output is named, and the rule suffix of a parse error.
const root = "/work/repo";

describe("classifyTsc: diagnostic lines", () => {
  it("reads multi-digit lines and columns, and appends indented lines to the last diagnostic only", () => {
    const output = [
      "a.ts(12,34): error TS7006: Parameter 'a' implicitly has an 'any' type.",
      "b.ts(1,1): error TS2322: Type 'x' is not assignable.",
      "c.ts(100,2): error TS2304: Cannot find name 'y'.",
      "  More about y.",
      "    And more.",
      "Found 3 errors in 3 files.",
    ].join("\n");
    expect(classifyTsc({ output, exitCode: 2, root })).toEqual({
      exit: 1,
      findings: [
        { location: { path: "a.ts", line: 12 }, gate: "typecheck", rule: "TS7006", message: "Parameter 'a' implicitly has an 'any' type." },
        { location: { path: "b.ts", line: 1 }, gate: "typecheck", rule: "TS2322", message: "Type 'x' is not assignable." },
        { location: { path: "c.ts", line: 100 }, gate: "typecheck", rule: "TS2304", message: "Cannot find name 'y'. More about y. And more." },
      ],
      summary: "typecheck: 3 findings in 3 files",
    });
  });

  it("does not read a line that only contains error TS<code> as a diagnostic", () => {
    const output = "a.ts(1,1): error TS2322: Type mismatch.\n  The text error TS2304: quoted here.\nnote error TS5023: not a diagnostic\n";
    expect(classifyTsc({ output, exitCode: 2, root })).toEqual({
      exit: 1,
      findings: [{ location: { path: "a.ts", line: 1 }, gate: "typecheck", rule: "TS2322", message: "Type mismatch. The text error TS2304: quoted here." }],
      summary: "typecheck: 1 finding in 1 file",
    });
  });

  it.each([
    { output: "\n   Error: Cannot find module 'typescript'\n", detail: "Error: Cannot find module 'typescript'" },
    { output: "warning: first\nat Error thrower\n", detail: "warning: first" },
    { output: "warning: first\nTypeError: x is not a function\n", detail: "TypeError: x is not a function" },
    { output: "warning: first\n!Error: odd\n", detail: "warning: first" },
    { output: "", detail: "no output" },
  ])("names the error line of tsc's own output: $detail", ({ output, detail }) => {
    expect(classifyTsc({ output, exitCode: 1, root })).toEqual({
      exit: 2,
      cause: `typecheck: could not run: tsc exited 1 without a diagnostic (${detail}); run pnpm run setup:offline`,
    });
  });
});

describe("classifyStylelint: tool output and parse errors", () => {
  const report = (text: string): string =>
    JSON.stringify([{ source: `${root}/a.css`, warnings: [{ line: 2, rule: "CssSyntaxError", text }], parseErrors: [], invalidOptionWarnings: [] }]);

  it("keeps a warning's text whole when it does not end with its rule", () => {
    const text = JSON.stringify([{ source: `${root}/a.css`, warnings: [{ line: 1, rule: "r", text: "raw value (x)" }], parseErrors: [], invalidOptionWarnings: [] }]);
    expect(classifyStylelint({ report: text, exitCode: 2, output: "", root })).toEqual({
      exit: 1,
      findings: [{ location: { path: "a.css", line: 1 }, gate: "style-lint", rule: "r", message: "raw value (x)" }],
      summary: "style-lint: 1 finding in 1 file",
    });
  });

  it("drops only the rule suffix at the end of a parse error's text", () => {
    expect(classifyStylelint({ report: report("Unknown word (a) here (CssSyntaxError)"), exitCode: 2, output: "", root })).toEqual({
      exit: 2,
      cause: "style-lint: could not run: a.css:2 does not parse (Unknown word (a) here); fix the stylesheet",
    });
  });

  it.each([
    { output: "\n   Error: No configuration provided\n", detail: "Error: No configuration provided" },
    { output: "warning: first\nat Error thrower\n", detail: "warning: first" },
    { output: "warning: first\nConfigurationError: bad\n", detail: "ConfigurationError: bad" },
    { output: "warning: first\n!Error: odd\n", detail: "warning: first" },
    { output: "", detail: "no output" },
  ])("names the error line of Stylelint's own output: $detail", ({ output, detail }) => {
    expect(classifyStylelint({ report: undefined, exitCode: 1, output, root })).toEqual({
      exit: 2,
      cause: `style-lint: could not run: Stylelint exited 1 (${detail}); check the Stylelint configuration`,
    });
  });
});
