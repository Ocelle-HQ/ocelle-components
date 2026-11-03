import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { classifyEslint } from "../lib/eslint-report.ts";

// Recorded ESLint 10 `--format json` output and stderr in gates/test/fixtures/eslint/ (paths rewritten to /work/repo),
// classified per contracts/gate-cli.md (lint and test-lint row): non-fatal messages are findings (exit 1); ESLint
// exit 2, no JSON, or a fatal message (a file that does not parse) is exit 2.
const root = "/work/repo";
const fixture = (name: string): string => readFileSync(new URL(`fixtures/eslint/${name}`, import.meta.url), "utf8");
const configError = fixture("config-error.stderr.txt");

function oneFile(messages: readonly object[]): string {
  return JSON.stringify([{ filePath: `${root}/gates/test/a.test.ts`, messages }]);
}

describe("classifyEslint", () => {
  it("is exit 0 with the number of files checked when ESLint reports no message", () => {
    expect(classifyEslint("test-lint", { report: fixture("clean.json"), exitCode: 0, output: "", root })).toEqual({
      exit: 0,
      summary: "test-lint: 2 files checked, no finding",
    });
  });

  it("says 1 file when one file was checked", () => {
    expect(classifyEslint("test-lint", { report: oneFile([]), exitCode: 0, output: "", root })).toEqual({
      exit: 0,
      summary: "test-lint: 1 file checked, no finding",
    });
  });

  it("makes each non-fatal message one finding at path:line with its rule id, and is exit 1", () => {
    expect(classifyEslint("test-lint", { report: fixture("findings.json"), exitCode: 1, output: "", root })).toEqual({
      exit: 1,
      findings: [
        {
          location: { path: "gates/test/c.test.ts", line: 3 },
          gate: "test-lint",
          rule: "vitest/expect-expect",
          message: "Test has no assertions",
        },
        {
          location: { path: "packages/tokens/test/b.test.ts", line: 3 },
          gate: "test-lint",
          rule: "vitest/expect-expect",
          message: "Test has no assertions",
        },
        {
          location: { path: "packages/tokens/test/b.test.ts", line: 5 },
          gate: "test-lint",
          rule: "vitest/no-disabled-tests",
          message: "Disabled test - if you want to skip a test temporarily, use .todo() instead",
        },
        {
          location: { path: "packages/tokens/test/b.test.ts", line: 8 },
          gate: "test-lint",
          rule: "eslint",
          message: "Unused eslint-disable directive (no problems were reported from 'vitest/no-focused-tests').",
        },
      ],
      summary: "test-lint: 4 findings in 2 files",
    });
  });

  it("uses the gate id it is given in findings and summary", () => {
    expect(classifyEslint("lint", { report: fixture("findings.json"), exitCode: 1, output: "", root })).toMatchObject({
      exit: 1,
      findings: [{ gate: "lint" }, { gate: "lint" }, { gate: "lint" }, { gate: "lint" }],
      summary: "lint: 4 findings in 2 files",
    });
  });

  it("counts a warning as a finding even when ESLint exits 0", () => {
    const report = oneFile([{ ruleId: "vitest/valid-title", severity: 1, message: "Title is empty", line: 4 }]);
    expect(classifyEslint("test-lint", { report, exitCode: 0, output: "", root })).toEqual({
      exit: 1,
      findings: [
        {
          location: { path: "gates/test/a.test.ts", line: 4 },
          gate: "test-lint",
          rule: "vitest/valid-title",
          message: "Title is empty",
        },
      ],
      summary: "test-lint: 1 finding in 1 file",
    });
  });

  it("joins a message over several lines into one line", () => {
    const report = oneFile([{ ruleId: "r", severity: 2, message: "first\n  second", line: 2 }]);
    expect(classifyEslint("test-lint", { report, exitCode: 1, output: "", root })).toMatchObject({
      exit: 1,
      findings: [{ message: "first second" }],
    });
  });

  it("is exit 2 naming the file and the parse error when a file does not parse, even next to findings", () => {
    expect(classifyEslint("test-lint", { report: fixture("fatal.json"), exitCode: 1, output: "", root })).toEqual({
      exit: 2,
      cause: "test-lint: could not run: gates/test/c.test.ts:2 does not parse (Parsing error: ')' expected.)",
    });
  });

  it("is exit 2 with the error line of ESLint's output when ESLint exits 2 (configuration error)", () => {
    expect(classifyEslint("test-lint", { report: "", exitCode: 2, output: configError, root })).toEqual({
      exit: 2,
      cause:
        'test-lint: could not run: ESLint exited 2 (TypeError: Key "rules": Key "vitest/no-such-rule": ' +
        'Could not find "no-such-rule" in plugin "vitest".); check the ESLint configuration',
    });
  });

  it("is exit 2 when ESLint exits 2 even with a clean JSON report", () => {
    expect(
      classifyEslint("test-lint", { report: fixture("clean.json"), exitCode: 2, output: "", root }),
    ).toEqual({ exit: 2, cause: "test-lint: could not run: ESLint exited 2 (no output); check the ESLint configuration" });
  });

  it("is exit 2 when ESLint was killed by a signal", () => {
    expect(
      classifyEslint("test-lint", { report: fixture("clean.json"), exitCode: null, output: "Killed", root }),
    ).toEqual({ exit: 2, cause: "test-lint: could not run: ESLint exited null (Killed); check the ESLint configuration" });
  });

  it("is exit 2 with the first output line when ESLint writes no JSON report", () => {
    const output = "\n  node:internal/modules/cjs/loader:1\n  Error: Cannot find module '/x/eslint.js'\n";
    expect(classifyEslint("test-lint", { report: "", exitCode: 1, output, root })).toEqual({
      exit: 2,
      cause:
        "test-lint: could not run: ESLint wrote no JSON report (Error: Cannot find module '/x/eslint.js'); " +
        "check the ESLint configuration",
    });
  });

  it("is exit 2 when the output has no error line, naming its first line", () => {
    expect(classifyEslint("test-lint", { report: "not json", exitCode: 0, output: "\nsomething odd\nmore\n", root })).toEqual({
      exit: 2,
      cause: "test-lint: could not run: ESLint wrote no JSON report (something odd); check the ESLint configuration",
    });
  });

  it("takes the error line only where a line starts with the error's name (added: mutation run)", () => {
    const output = "Oops! An Error occurred:\nTypeError: boom\n";
    expect(classifyEslint("test-lint", { report: "", exitCode: 2, output, root })).toEqual({
      exit: 2,
      cause: "test-lint: could not run: ESLint exited 2 (TypeError: boom); check the ESLint configuration",
    });
  });

  it("is exit 2 when the report is JSON but not a list of files", () => {
    expect(classifyEslint("test-lint", { report: '{"messages":[]}', exitCode: 0, output: "", root })).toEqual({
      exit: 2,
      cause: "test-lint: could not run: ESLint wrote no JSON report (no output); check the ESLint configuration",
    });
  });
});
