import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { classifyMutants } from "../lib/mutation/report.ts";
import type { ChangedFile, LineRange } from "../lib/mutation/ranges.ts";

// A recorded Stryker 10 JSON report (gates/test/fixtures/stryker/report.json: gates/lib/sample.ts mutated on lines
// 2 to 6 and 9, three statuses edited to Timeout, RuntimeError and Ignored) and the output of a failed dry run,
// classified per FR-011 (as amended, 2026-11-02) and contracts/gate-cli.md (mutation row). In the report, line 3 has
// mutants 1 (Timeout), 2 (RuntimeError), 3 (Survived, "value <= low") and 4 (Killed); mutant 0 (CompileError) spans
// lines 2 to 6; line 4 has 5 and 7 (Survived) and 6 and 8 (Killed); line 9 has 9, 11 and 10 (Survived), 13
// (NoCoverage) and 12 (Ignored).
const fixture = (name: string): string => readFileSync(new URL(`fixtures/stryker/${name}`, import.meta.url), "utf8");
const report = fixture("report.json");
const sample = "gates/lib/sample.ts";

function changed(path: string, ranges: readonly LineRange[]): ChangedFile {
  return { path, ranges, lines: ranges.reduce((sum, r) => sum + r.end - r.start + 1, 0) };
}

function survivor(line: number, rule: string, message: string): object {
  return { location: { path: sample, line }, gate: "mutation", rule, message };
}

describe("classifyMutants", () => {
  it("makes Survived and NoCoverage mutants on changed lines findings; Killed, Timeout, RuntimeError, CompileError and Ignored pass", () => {
    const run = { report, exitCode: 1, output: "" };
    const ranges = [
      { start: 3, end: 3 },
      { start: 9, end: 9 },
    ];
    expect(classifyMutants(run, [changed(sample, ranges)])).toEqual({
      ok: true,
      mutants: 10,
      findings: [
        survivor(3, "EqualityOperator", "Survived: replaced by value <= low"),
        survivor(9, "ConditionalExpression", "Survived: replaced by true"),
        survivor(9, "EqualityOperator", "Survived: replaced by n !== 1"),
        survivor(9, "ConditionalExpression", "Survived: replaced by false"),
        survivor(9, "StringLiteral", 'NoCoverage: replaced by ""'),
      ],
    });
  });

  it("leaves out survivors on unchanged lines of a changed file", () => {
    const run = { report, exitCode: 1, output: "" };
    expect(classifyMutants(run, [changed(sample, [{ start: 4, end: 4 }])])).toEqual({
      ok: true,
      mutants: 5,
      findings: [
        survivor(4, "ConditionalExpression", "Survived: replaced by true"),
        survivor(4, "EqualityOperator", "Survived: replaced by value >= high"),
      ],
    });
    expect(classifyMutants(run, [changed(sample, [{ start: 6, end: 7 }])])).toEqual({ ok: true, mutants: 1, findings: [] });
  });

  it("leaves out mutants of a file that did not change", () => {
    const run = { report, exitCode: 1, output: "" };
    const files = [changed("gates/lib/other.ts", [{ start: 3, end: 3 }]), changed(sample, [{ start: 5, end: 5 }])];
    expect(classifyMutants(run, files)).toEqual({ ok: true, mutants: 1, findings: [] });
  });

  it("counts a mutant whose lines overlap a changed range, at the range's first and last line too", () => {
    const at = (id: string, start: number, end: number): object => ({
      id,
      mutatorName: `M${id}`,
      replacement: id,
      status: "Survived",
      location: { start: { line: start, column: 1 }, end: { line: end, column: 2 } },
    });
    const mutants = [at("a", 1, 4), at("b", 1, 5), at("c", 7, 9), at("d", 8, 9), at("e", 6, 6), at("f", 4, 8)];
    const run = { report: JSON.stringify({ files: { [sample]: { mutants } } }), exitCode: 1, output: "" };
    expect(classifyMutants(run, [changed(sample, [{ start: 5, end: 7 }])])).toEqual({
      ok: true,
      mutants: 4,
      findings: [
        survivor(1, "Mb", "Survived: replaced by b"),
        survivor(7, "Mc", "Survived: replaced by c"),
        survivor(6, "Me", "Survived: replaced by e"),
        survivor(4, "Mf", "Survived: replaced by f"),
      ],
    });
  });

  it("joins a replacement over several lines into one line", () => {
    const mutant = {
      id: "0",
      mutatorName: "ObjectLiteral",
      replacement: "{\n  a: 1\n}",
      status: "NoCoverage",
      location: { start: { line: 2, column: 1 }, end: { line: 4, column: 2 } },
    };
    const run = { report: JSON.stringify({ files: { [sample]: { mutants: [mutant] } } }), exitCode: 1, output: "" };
    expect(classifyMutants(run, [changed(sample, [{ start: 3, end: 3 }])])).toEqual({
      ok: true,
      mutants: 1,
      findings: [survivor(2, "ObjectLiteral", "NoCoverage: replaced by { a: 1 }")],
    });
  });

  it("cannot decide on a changed-line mutant that Stryker left in another state", () => {
    const mutant = {
      id: "7",
      mutatorName: "BooleanLiteral",
      replacement: "false",
      status: "Pending",
      location: { start: { line: 5, column: 1 }, end: { line: 5, column: 6 } },
    };
    const run = { report: JSON.stringify({ files: { [sample]: { mutants: [mutant] } } }), exitCode: 1, output: "" };
    expect(classifyMutants(run, [changed(sample, [{ start: 5, end: 5 }])])).toEqual({
      ok: false,
      cause: `mutation: could not run: mutant 7 at ${sample}:5 has status Pending; re-run the mutation gate`,
    });
  });

  it("cannot decide without a report, naming Stryker's error (a failed dry run)", () => {
    const run = { report: undefined, exitCode: 1, output: fixture("dry-run-failed.output.txt") };
    expect(classifyMutants(run, [changed(sample, [{ start: 3, end: 3 }])])).toEqual({
      ok: false,
      cause:
        "mutation: could not run: Stryker wrote no report (There were failed tests in the initial test run.); " +
        "run pnpm test and check stryker.config.json",
    });
  });

  it("cannot decide without a report, naming Stryker's exit code when its output has no error", () => {
    const run = { report: undefined, exitCode: 137, output: "INFO starting\n" };
    expect(classifyMutants(run, [changed(sample, [{ start: 3, end: 3 }])])).toEqual({
      ok: false,
      cause: "mutation: could not run: Stryker wrote no report (Stryker exited 137); run pnpm test and check stryker.config.json",
    });
  });

  it("writes a survivor without a replacement as its status alone (added: mutation run)", () => {
    const mutant = {
      id: "0",
      mutatorName: "BlockStatement",
      status: "Survived",
      location: { start: { line: 3, column: 1 }, end: { line: 3, column: 2 } },
    };
    const run = { report: JSON.stringify({ files: { [sample]: { mutants: [mutant] } } }), exitCode: 1, output: "" };
    expect(classifyMutants(run, [changed(sample, [{ start: 3, end: 3 }])])).toEqual({
      ok: true,
      mutants: 1,
      findings: [survivor(3, "BlockStatement", "Survived: replaced by")],
    });
  });

  it("cannot decide on a report whose files are not an object (added: mutation run)", () => {
    const files = [changed(sample, [{ start: 3, end: 3 }])];
    expect(classifyMutants({ report: '{"files":"x"}', exitCode: 1, output: "" }, files)).toEqual({
      ok: false,
      cause:
        "mutation: could not run: the Stryker report is not a JSON object with files; run pnpm test and check stryker.config.json",
    });
  });

  it("cannot decide on a report that is not JSON or has no files", () => {
    const cause =
      "mutation: could not run: the Stryker report is not a JSON object with files; run pnpm test and check stryker.config.json";
    const files = [changed(sample, [{ start: 3, end: 3 }])];
    expect(classifyMutants({ report: "{not json", exitCode: 1, output: "" }, files)).toEqual({ ok: false, cause });
    expect(classifyMutants({ report: '{"schemaVersion":"1.0"}', exitCode: 1, output: "" }, files)).toEqual({ ok: false, cause });
    expect(classifyMutants({ report: '{"files":null}', exitCode: 1, output: "" }, files)).toEqual({ ok: false, cause });
    expect(classifyMutants({ report: "null", exitCode: 1, output: "" }, files)).toEqual({ ok: false, cause });
  });
});
