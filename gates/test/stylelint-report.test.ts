import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { classifyStylelint } from "../lib/stylelint-report.ts";

// gates/lib/stylelint-report.ts on recorded Stylelint `--formatter json` reports in gates/test/fixtures/stylelint/
// (contracts/gate-cli.md, style-lint row): warnings other than CssSyntaxError are findings (exit 1); Stylelint exit 1,
// 64 or 78, no JSON report, or a CssSyntaxError warning is exit 2.
const root = "/work/repo";

function fixture(name: string): string {
  return readFileSync(new URL(`fixtures/stylelint/${name}`, import.meta.url), "utf8");
}

describe("classifyStylelint", () => {
  it("reports each warning as a finding at its repository path and line, without the rule suffix (exit 1)", () => {
    expect(classifyStylelint({ report: fixture("findings.json"), exitCode: 2, output: "", root })).toEqual({
      exit: 1,
      findings: [
        {
          location: { path: "packages/elements/src/x.ts", line: 3 },
          gate: "style-lint",
          rule: "ocelle/token-only",
          message: "width: raw 4px; use a --ocelle-* token (FR-024)",
        },
        {
          location: { path: "packages/elements/src/x.ts", line: 4 },
          gate: "style-lint",
          rule: "ocelle/token-only",
          message: "color: raw red; use a --ocelle-* token (FR-024)",
        },
        {
          location: { path: "packages/styles/src/x.css", line: 1 },
          gate: "style-lint",
          rule: "ocelle/token-only",
          message: "margin: raw 2px; use a --ocelle-* token (FR-024)",
        },
      ],
      summary: "style-lint: 3 findings in 2 files",
    });
  });

  it("exits 0 with the number of files checked, not counting ignored files", () => {
    expect(classifyStylelint({ report: fixture("clean.json"), exitCode: 0, output: "", root })).toEqual({
      exit: 0,
      summary: "style-lint: 2 files checked, no finding",
    });
  });

  it("exits 0 when no file matched (allowEmptyInput)", () => {
    expect(classifyStylelint({ report: "[]", exitCode: 0, output: "", root })).toEqual({
      exit: 0,
      summary: "style-lint: 0 files checked, no finding",
    });
  });

  it("exits 2 on a CssSyntaxError warning, naming the file and line", () => {
    expect(classifyStylelint({ report: fixture("syntax-error.json"), exitCode: 2, output: "", root })).toEqual({
      exit: 2,
      cause: "style-lint: could not run: packages/styles/src/x.css:1 does not parse (Unclosed block); fix the stylesheet",
    });
  });

  it("exits 2 on a parse error of the custom syntax", () => {
    expect(classifyStylelint({ report: fixture("parse-error.json"), exitCode: 2, output: "", root })).toEqual({
      exit: 2,
      cause: "style-lint: could not run: packages/elements/src/x.ts:2 does not parse (Unexpected token); fix the stylesheet",
    });
  });

  it("exits 2 on an invalid rule option", () => {
    expect(classifyStylelint({ report: fixture("invalid-option.json"), exitCode: 2, output: "", root })).toEqual({
      exit: 2,
      cause:
        'style-lint: could not run: Invalid option value "sometimes" for rule "ocelle/token-only"; ' +
        "check the Stylelint configuration",
    });
  });

  it.each([1, 64, 78, null])("exits 2 when Stylelint exits %s, naming its error", (exitCode) => {
    const output = fixture("configuration-error.stderr.txt");
    expect(classifyStylelint({ report: undefined, exitCode, output, root })).toEqual({
      exit: 2,
      cause:
        `style-lint: could not run: Stylelint exited ${String(exitCode)} ` +
        '(ConfigurationError: Could not find "./gates/stylelint/token-only.ts". Do you need to install the package or ' +
        'use the "configBasedir" option?); check the Stylelint configuration',
    });
  });

  it("exits 2 when Stylelint exits 78 even with a report", () => {
    expect(classifyStylelint({ report: fixture("findings.json"), exitCode: 78, output: "", root })).toEqual({
      exit: 2,
      cause: "style-lint: could not run: Stylelint exited 78 (no output); check the Stylelint configuration",
    });
  });

  it.each([
    { report: undefined, detail: "Stylelint wrote no JSON report" },
    { report: "not json", detail: "Stylelint wrote no JSON report" },
    { report: '{"a":1}', detail: "Stylelint wrote no JSON report" },
  ])("exits 2 when the report is $report", ({ report, detail }) => {
    expect(classifyStylelint({ report, exitCode: 0, output: "Error: boom\n", root })).toEqual({
      exit: 2,
      cause: `style-lint: could not run: ${detail} (Error: boom); check the Stylelint configuration`,
    });
  });
});
