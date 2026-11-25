import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { classifyMutants } from "../lib/mutation/report.ts";
import type { MutantVerdict } from "../lib/mutation/report.ts";
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
      timeouts: [{ path: sample, line: 3, mutator: "ConditionalExpression", replacement: "true" }],
      compileErrors: [{ path: sample, line: 2, mutator: "BlockStatement", replacement: "{}" }],
      zeroEntries: [],
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
      timeouts: [],
      compileErrors: [{ path: sample, line: 2, mutator: "BlockStatement", replacement: "{}" }],
      zeroEntries: [],
      findings: [
        survivor(4, "ConditionalExpression", "Survived: replaced by true"),
        survivor(4, "EqualityOperator", "Survived: replaced by value >= high"),
      ],
    });
    expect(classifyMutants(run, [changed(sample, [{ start: 6, end: 7 }])])).toEqual({
      ok: true,
      mutants: 1,
      findings: [],
      timeouts: [],
      compileErrors: [{ path: sample, line: 2, mutator: "BlockStatement", replacement: "{}" }],
      zeroEntries: [],
    });
  });

  it("leaves out mutants of a file that did not change", () => {
    const run = { report, exitCode: 1, output: "" };
    const files = [changed("gates/lib/other.ts", [{ start: 3, end: 3 }]), changed(sample, [{ start: 5, end: 5 }])];
    expect(classifyMutants(run, files)).toEqual({
      ok: true,
      mutants: 1,
      findings: [],
      timeouts: [],
      compileErrors: [{ path: sample, line: 2, mutator: "BlockStatement", replacement: "{}" }],
      zeroEntries: ["gates/lib/other.ts"],
    });
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
      timeouts: [],
      compileErrors: [],
      zeroEntries: [],
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
      timeouts: [],
      compileErrors: [],
      zeroEntries: [],
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
      timeouts: [],
      compileErrors: [],
      zeroEntries: [],
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

// Phase 3 round 7 (O7-02 as amended by the operator, "Guard the input instead (Recommended)"; tasks.md T095):
// Stryker 10.1.1 lists only files with mutants, so a changed file the report does not list holds no mutable code on
// its changed lines (a type-only or comment-only change) and counts as zero mutants; the gate guards the paths it
// passes to Stryker instead (gates/test/mutation-ranges.test.ts).
describe("classifyMutants: a changed file absent from the report (phase 3 round 7, O7-02)", () => {
  const run = { report, exitCode: 0, output: "" };
  const typesOnly = changed("gates/lib/types-only.ts", [{ start: 1, end: 4 }]);

  it("counts a changed file with changed lines that the recorded report does not list as zero mutants, and passes", () => {
    expect(classifyMutants(run, [typesOnly])).toEqual({
      ok: true,
      mutants: 0,
      findings: [],
      timeouts: [],
      compileErrors: [],
      zeroEntries: ["gates/lib/types-only.ts"],
    });
  });

  it("passes a file the report lists with every mutant on its changed lines killed, next to an absent file", () => {
    expect(classifyMutants(run, [typesOnly, changed(sample, [{ start: 6, end: 7 }])])).toEqual({
      ok: true,
      mutants: 1,
      findings: [],
      timeouts: [],
      compileErrors: [{ path: sample, line: 2, mutator: "BlockStatement", replacement: "{}" }],
      zeroEntries: ["gates/lib/types-only.ts"],
    });
  });
});

// Phase 3 round 12 (O12-01, operator decision "Fail on unread files (Recommended)"; tasks.md T099; research.md R-08
// "Unread `mutate` entries"): Stryker 10.1.1 never reads a file under a folder named node_modules, .git, .next,
// .nuxt, .svelte-kit or .stryker-tmp (any case, any depth) and only logs `Glob pattern "<entry>" did not result in
// any files.`, so the file is missing from the report. Recorded outputs of real Stryker runs (machine paths replaced
// by <repo>): unread-pattern.output.txt, on the one entry packages/tokens/src/.next/y.ts:1-2; unread-patterns.output.txt,
// on .next/y.ts:1-2, x.ts:2-2 (read) and .Svelte-Kit/z.ts:1-1; unexcluded-pattern.output.txt, on x.ts:2-2 and the
// exclusion !packages/tokens/src/.next/y.ts, which excludes nothing.
describe("classifyMutants: a mutate entry Stryker did not read (phase 3 round 12, O12-01)", () => {
  const unread = (entries: string): string =>
    "mutation: could not run: Stryker did not read these mutate entries (it skips every file under a folder named " +
    `node_modules, .git, .next, .nuxt, .svelte-kit or .stryker-tmp, in any case): ${entries}; ` +
    "move the files out of such a folder";
  const next = changed("packages/tokens/src/.next/y.ts", [{ start: 1, end: 2 }]);
  const empty = JSON.stringify({ schemaVersion: "1.0", files: {} });

  it("cannot decide when Stryker logs that an entry did not result in any files, naming the entry as logged", () => {
    const run = { report: empty, exitCode: 0, output: fixture("unread-pattern.output.txt") };
    expect(classifyMutants(run, [next])).toEqual({ ok: false, cause: unread("packages/tokens/src/.next/y.ts:1-2") });
  });

  it("cannot decide on an unread entry even when the report holds survivors of other files", () => {
    const run = { report, exitCode: 1, output: fixture("unread-pattern.output.txt") };
    expect(classifyMutants(run, [changed(sample, [{ start: 3, end: 3 }]), next])).toEqual({
      ok: false,
      cause: unread("packages/tokens/src/.next/y.ts:1-2"),
    });
  });

  it("names every unread entry in Stryker's order, the read entry of the same run not among them", () => {
    const run = { report: empty, exitCode: 0, output: fixture("unread-patterns.output.txt") };
    const files = [
      next,
      changed("packages/tokens/src/x.ts", [{ start: 2, end: 2 }]),
      changed("packages/tokens/src/.Svelte-Kit/z.ts", [{ start: 1, end: 1 }]),
    ];
    expect(classifyMutants(run, files)).toEqual({
      ok: false,
      cause: unread("packages/tokens/src/.next/y.ts:1-2, packages/tokens/src/.Svelte-Kit/z.ts:1-1"),
    });
  });

  it("leaves the verdict as before on Stryker's other glob warnings and on an output without the warning", () => {
    const ranges = [
      { start: 3, end: 3 },
      { start: 9, end: 9 },
    ];
    const files = [changed(sample, ranges)];
    const before = classifyMutants({ report, exitCode: 1, output: "" }, files);
    expect(before).toMatchObject({ ok: true, mutants: 10 });
    const testFiles = '\u001b[33m17:19:17 (1655) WARN ProjectReader\u001b[39m Glob pattern "test/**/*.ts" did not match any test files.\n';
    const without = fixture("unread-pattern.output.txt")
      .split("\n")
      .filter((line) => !line.includes("did not result in any files."))
      .join("\n");
    for (const output of [fixture("unexcluded-pattern.output.txt"), testFiles, without, fixture("dry-run-failed.output.txt")]) {
      expect(classifyMutants({ report, exitCode: 1, output }, files)).toEqual(before);
    }
  });
});

// research.md R-08 "Unread `mutate` entries": Stryker logs the warning at `warn`, so a console logLevel above it
// (`error`, `fatal`, `off`) would hide it; Stryker's default is `info`.
describe("stryker.config.json: the unread-entry warning prints (phase 3 round 12, O12-01)", () => {
  it("sets no logLevel, or one of trace, debug, info and warn", () => {
    const config = JSON.parse(readFileSync(new URL("../../stryker.config.json", import.meta.url), "utf8")) as { logLevel?: unknown };
    expect([undefined, "trace", "debug", "info", "warn"]).toContain(config.logLevel);
  });
});

// 007 User Story 1 (spec FR-001 to FR-003, FR-007; data-model § Mutant verdict; research R-01, R-03): besides the
// findings and the mutant count, the verdict holds the Timeout and the CompileError mutants on changed lines (path,
// start line, mutator, replacement through oneLine), in changed-file order, then start line, then start column, then
// mutant id compared as a number (a non-decimal id after every numeric one, by string), and the entries with no
// mutant on their changed lines (named by `entry`, else by path), in changed-file order. The verdicts are unchanged.
describe("classifyMutants: the report of undecided mutants and zero-mutant entries (007)", () => {
  function at(id: string, line: number, column: number, status: string, mutatorName = `M${id}`, replacement = `r${id}`): object {
    return { id, mutatorName, replacement, status, location: { start: { line, column }, end: { line, column: column + 4 } } };
  }
  const reportOf = (files: Readonly<Record<string, readonly object[]>>): string =>
    JSON.stringify({ files: Object.fromEntries(Object.entries(files).map(([path, mutants]) => [path, { mutants }])) });
  const other = "packages/tokens/src/other.ts";

  it("holds every status of the status table with its verdict unchanged: only Timeout and CompileError are reported", () => {
    const statuses = ["Killed", "RuntimeError", "Timeout", "CompileError", "Ignored", "Survived", "NoCoverage"];
    const mutants = statuses.map((status, index) => at(String(index), index + 1, 1, status, status));
    const run = { report: reportOf({ [sample]: mutants }), exitCode: 0, output: "" };
    expect(classifyMutants(run, [changed(sample, [{ start: 1, end: 7 }])])).toEqual({
      ok: true,
      mutants: 7,
      findings: [survivor(6, "Survived", "Survived: replaced by r5"), survivor(7, "NoCoverage", "NoCoverage: replaced by r6")],
      timeouts: [{ path: sample, line: 3, mutator: "Timeout", replacement: "r2" }],
      compileErrors: [{ path: sample, line: 4, mutator: "CompileError", replacement: "r3" }],
      zeroEntries: [],
    });
  });

  it("cannot decide on an unknown status beside a Timeout and a CompileError, with today's cause", () => {
    const mutants = [at("0", 1, 1, "Timeout"), at("1", 2, 1, "CompileError"), at("2", 3, 1, "Pending")];
    const run = { report: reportOf({ [sample]: mutants }), exitCode: 0, output: "" };
    expect(classifyMutants(run, [changed(sample, [{ start: 1, end: 3 }])])).toEqual({
      ok: false,
      cause: `mutation: could not run: mutant 2 at ${sample}:3 has status Pending; re-run the mutation gate`,
    });
  });

  it("neither reports nor counts a Timeout or a CompileError on an unchanged line", () => {
    const mutants = [at("0", 2, 1, "Timeout"), at("1", 4, 1, "CompileError"), at("2", 3, 1, "Killed")];
    const run = { report: reportOf({ [sample]: mutants }), exitCode: 0, output: "" };
    expect(classifyMutants(run, [changed(sample, [{ start: 3, end: 3 }])])).toEqual({
      ok: true,
      mutants: 1,
      findings: [],
      timeouts: [],
      compileErrors: [],
      zeroEntries: [],
    });
  });

  it("reports an undecided mutant at its start line when only a later line of its range changed", () => {
    const spanning = (id: string, status: string): object => ({
      id,
      mutatorName: "BlockStatement",
      replacement: "{}",
      status,
      location: { start: { line: 2, column: 5 }, end: { line: 6, column: 1 } },
    });
    const run = { report: reportOf({ [sample]: [spanning("0", "Timeout"), spanning("1", "CompileError")] }), exitCode: 0, output: "" };
    expect(classifyMutants(run, [changed(sample, [{ start: 6, end: 6 }])])).toEqual({
      ok: true,
      mutants: 2,
      findings: [],
      timeouts: [{ path: sample, line: 2, mutator: "BlockStatement", replacement: "{}" }],
      compileErrors: [{ path: sample, line: 2, mutator: "BlockStatement", replacement: "{}" }],
      zeroEntries: [],
    });
  });

  it("joins a replacement over several lines into one line, and gives a mutant without a replacement an empty one", () => {
    const withoutReplacement = { id: "1", mutatorName: "BlockStatement", status: "CompileError", location: { start: { line: 2, column: 1 }, end: { line: 2, column: 5 } } };
    const mutants = [at("0", 1, 1, "Timeout", "ObjectLiteral", "{\n  a: 1\n}"), withoutReplacement];
    const run = { report: reportOf({ [sample]: mutants }), exitCode: 0, output: "" };
    expect(classifyMutants(run, [changed(sample, [{ start: 1, end: 2 }])])).toMatchObject({
      timeouts: [{ path: sample, line: 1, mutator: "ObjectLiteral", replacement: "{ a: 1 }" }],
      compileErrors: [{ path: sample, line: 2, mutator: "BlockStatement", replacement: "" }],
    });
  });

  it("orders by changed-file order, then start line, then start column, then id as a number, non-decimal ids last by string", () => {
    const sampleMutants = [
      at("b", 5, 3, "Timeout"),
      at("1e1", 5, 3, "Timeout"),
      at("10", 5, 3, "Timeout"),
      at("a", 5, 3, "Timeout"),
      at("9", 5, 3, "Timeout"),
      at("2", 5, 3, "Timeout"),
      at("3", 5, 2, "Timeout"),
      at("4", 4, 9, "Timeout"),
      at("30", 7, 1, "CompileError"),
      at("31", 6, 8, "CompileError"),
      at("32", 6, 10, "CompileError"),
      at("100", 6, 10, "CompileError"),
      at("99", 6, 10, "CompileError"),
    ];
    const otherMutants = [at("50", 9, 1, "Timeout"), at("51", 1, 1, "CompileError"), at("52", 3, 1, "Timeout")];
    // The report lists sample.ts first; the changed files list other.ts first.
    const run = { report: reportOf({ [sample]: sampleMutants, [other]: otherMutants }), exitCode: 0, output: "" };
    const verdict = classifyMutants(run, [changed(other, [{ start: 1, end: 9 }]), changed(sample, [{ start: 1, end: 9 }])]);
    const key = (mutant: { readonly path: string; readonly mutator: string }): string => `${mutant.path === other ? "other" : "sample"} ${mutant.mutator}`;
    expect(verdict).toMatchObject({ ok: true });
    expect(verdict).toHaveProperty("timeouts");
    expect(verdict).toHaveProperty("compileErrors");
    const { timeouts, compileErrors } = verdict as Extract<MutantVerdict, { ok: true }>;
    expect(timeouts.map(key)).toEqual([
      "other M52",
      "other M50",
      "sample M4",
      "sample M3",
      "sample M2",
      "sample M9",
      "sample M10",
      "sample M1e1",
      "sample Ma",
      "sample Mb",
    ]);
    expect(compileErrors.map(key)).toEqual([
      "other M51",
      "sample M31",
      "sample M32",
      "sample M99",
      "sample M100",
      "sample M30",
    ]);
  });

  it("orders mutants of equal position and equal numeric value as Stryker listed them", () => {
    const mutants = [at("07", 1, 1, "Timeout"), at("7", 1, 1, "Timeout"), at("007", 1, 1, "Timeout")];
    const run = { report: reportOf({ [sample]: mutants }), exitCode: 0, output: "" };
    const verdict = classifyMutants(run, [changed(sample, [{ start: 1, end: 1 }])]);
    expect(verdict).toMatchObject({ ok: true });
    expect(verdict).toHaveProperty("timeouts");
    expect((verdict as Extract<MutantVerdict, { ok: true }>).timeouts.map((mutant) => mutant.mutator)).toEqual(["M07", "M7", "M007"]);
  });

  it("keeps mutants of equal position and an equal non-decimal id as Stryker listed them, and orders other ids by string", () => {
    const mutants = [at("x", 1, 1, "Timeout", "first"), at("x", 1, 1, "Timeout", "second"), at("w", 1, 1, "Timeout", "third")];
    const run = { report: reportOf({ [sample]: mutants }), exitCode: 0, output: "" };
    const verdict = classifyMutants(run, [changed(sample, [{ start: 1, end: 1 }])]);
    expect(verdict).toMatchObject({ ok: true });
    expect(verdict).toHaveProperty("timeouts");
    expect((verdict as Extract<MutantVerdict, { ok: true }>).timeouts.map((mutant) => mutant.mutator)).toEqual(["third", "first", "second"]);
  });

  it("makes an entry with no mutant on its changed lines a zero-mutant entry, also when its file has mutants elsewhere", () => {
    const run = { report: reportOf({ [sample]: [at("0", 2, 1, "Killed"), at("1", 70, 1, "Timeout")] }), exitCode: 0, output: "" };
    const files = [
      { ...changed("packages/tokens/src/types.ts", [{ start: 1, end: 3 }]), entry: "packages/tokens/src/types.ts" },
      { ...changed(sample, [{ start: 61, end: 69 }]), entry: `${sample}:61-69` },
      { ...changed(other, [{ start: 1, end: 1 }]), entry: other },
    ];
    expect(classifyMutants(run, files)).toEqual({
      ok: true,
      mutants: 0,
      findings: [],
      timeouts: [],
      compileErrors: [],
      zeroEntries: ["packages/tokens/src/types.ts", `${sample}:61-69`, other],
    });
  });

  it("names a zero-mutant entry by its entry when given and by its path otherwise, in changed-file order", () => {
    const run = { report: reportOf({ [sample]: [at("0", 2, 1, "Killed")] }), exitCode: 0, output: "" };
    const files = [
      changed(other, [{ start: 1, end: 1 }]),
      changed(sample, [{ start: 2, end: 2 }]),
      { ...changed("gates/lib/z.ts", [{ start: 121, end: 130 }]), entry: "gates/lib/z.ts:121-130" },
      changed("gates/lib/a.ts", [{ start: 1, end: 1 }]),
    ];
    expect(classifyMutants(run, files)).toMatchObject({ ok: true, mutants: 1, zeroEntries: [other, "gates/lib/z.ts:121-130", "gates/lib/a.ts"] });
  });

  it("makes every entry a zero-mutant entry when the report has no mutant at all, and keeps an entry with only undecided mutants out", () => {
    const empty = { report: reportOf({}), exitCode: 0, output: "" };
    expect(classifyMutants(empty, [changed(sample, [{ start: 1, end: 2 }]), changed(other, [{ start: 3, end: 3 }])])).toEqual({
      ok: true,
      mutants: 0,
      findings: [],
      timeouts: [],
      compileErrors: [],
      zeroEntries: [sample, other],
    });
    const undecided = { report: reportOf({ [sample]: [at("0", 1, 1, "Timeout")], [other]: [at("1", 3, 1, "CompileError")] }), exitCode: 0, output: "" };
    expect(classifyMutants(undecided, [changed(sample, [{ start: 1, end: 2 }]), changed(other, [{ start: 3, end: 3 }])])).toMatchObject({
      ok: true,
      mutants: 2,
      zeroEntries: [],
    });
  });

  it("reports a Timeout beside a survivor, apart from the findings", () => {
    const run = { report: reportOf({ [sample]: [at("0", 1, 1, "Survived", "StringLiteral", '""'), at("1", 2, 1, "Timeout", "StringLiteral", '""')] }), exitCode: 0, output: "" };
    expect(classifyMutants(run, [changed(sample, [{ start: 1, end: 2 }])])).toEqual({
      ok: true,
      mutants: 2,
      findings: [survivor(1, "StringLiteral", 'Survived: replaced by ""')],
      timeouts: [{ path: sample, line: 2, mutator: "StringLiteral", replacement: '""' }],
      compileErrors: [],
      zeroEntries: [],
    });
  });
});

// 019 gate gap, rule (c) (019 reviews/phase-1/operator-mutation-decisions.md § Gate gap rule; 001 contracts/gate-cli.md,
// mutation row, amendment 2026-11-19): a changed file whose mutants on its changed lines are all CompileError, every
// one of them carrying one same diagnostic of the file itself (path, line and TS code) on a line none of them spans,
// was rejected by Stryker's type checker for what the file already is, not for any mutant: the gate could not
// mutation-test it (exit 2). The recorded report (fixtures/stryker/checker-failure.report.json) is a real Stryker
// 10.1.1 run, trimmed to its file: packages/tokens/src/x.ts, whose un-annotated field `#region` passes `this` to a
// constructor with a callback while the class is in the global HTMLElementTagNameMap; tsc accepts it, Stryker's
// checker reports TS7022 at (21,12) and TS7023 at (22,5) for each of the six mutants of the added lines 40 to 42.
describe("classifyMutants: a checker failure (019, gate gap rule (c))", () => {
  const recorded = fixture("checker-failure.report.json");
  const x = "packages/tokens/src/x.ts";
  const added = [{ start: 39, end: 42 }];
  const cause = `mutation: could not run: Stryker's type checker rejects ${x} itself, not its mutants: ${x}(21,12): error TS7022; fix that type error (an explicit type often does) and rerun`;
  const diagnosticLine = /^(\S.*)\((\d+),(\d+)\): error TS(\d+): (.+)$/;
  interface RecordedMutant {
    readonly status: string;
    readonly statusReason?: string;
  }
  const recordedMutants = (): readonly RecordedMutant[] => (JSON.parse(recorded) as { files: Record<string, { mutants: RecordedMutant[] }> }).files[x]?.mutants ?? [];
  function mutant(id: string, line: number, status: string, statusReason?: string, endLine = line): object {
    return { id, mutatorName: `M${id}`, replacement: `r${id}`, status, ...(statusReason === undefined ? {} : { statusReason }), location: { start: { line, column: 1 }, end: { line: endLine, column: 9 } } };
  }
  const reportOf = (files: Readonly<Record<string, readonly object[]>>): string =>
    JSON.stringify({ files: Object.fromEntries(Object.entries(files).map(([path, mutants]) => [path, { mutants }])) });
  const ts = (path: string, line: number, code: number, message = "a message."): string => `${path}(${String(line)},3): error TS${String(code)}: ${message}`;
  const compileError = (line: number, mutator = `M${String(line)}`): object => ({ path: x, line, mutator, replacement: `r${mutator.slice(1)}` });

  it("pins Stryker 10.1.1's diagnostic form: each CompileError's statusReason opens with `<path>(<line>,<col>): error TS<code>: <message>`, other lines a diagnostic or indented", () => {
    const mutants = recordedMutants();
    expect(mutants.map((each) => each.status)).toEqual(Array.from({ length: 6 }, () => "CompileError"));
    const first = mutants.map((each) => {
      const lines = (each.statusReason ?? "").split("\n").filter((line) => line !== "");
      const match = diagnosticLine.exec(lines[0] ?? "");
      return {
        first: match === null ? null : { path: match[1], line: Number(match[2]), column: Number(match[3]), code: Number(match[4]) },
        rest: lines.slice(1).every((line) => diagnosticLine.test(line) || /^\s/.test(line)),
      };
    });
    expect(first).toEqual(Array.from({ length: 6 }, () => ({ first: { path: x, line: 21, column: 12, code: 7022 }, rest: true })));
  });

  it("cannot run on the recorded report: every mutant on the changed lines is a CompileError on one diagnostic of the file, off their lines", () => {
    const run = { report: recorded, exitCode: 0, output: "" };
    expect(classifyMutants(run, [changed(x, added)])).toEqual({ ok: false, cause });
  });

  it("cannot run on the recorded report when another changed file of the run has a survivor (exit 2 wins)", () => {
    const parsed = JSON.parse(recorded) as { files: Record<string, unknown> };
    const files = { [sample]: { mutants: [mutant("90", 3, "Survived")] }, ...parsed.files };
    const run = { report: JSON.stringify({ ...parsed, files }), exitCode: 0, output: "" };
    expect(classifyMutants(run, [changed(sample, [{ start: 3, end: 3 }]), changed(x, added)])).toEqual({ ok: false, cause });
  });

  it("cannot run in a --files run whose range entry holds the recorded mutants", () => {
    const run = { report: recorded, exitCode: 0, output: "" };
    expect(classifyMutants(run, [{ ...changed(x, [{ start: 40, end: 42 }]), entry: `${x}:40-42` }])).toEqual({ ok: false, cause });
  });

  it("passes pass-compile-error's shape: one CompileError whose diagnostic is on the mutant's own line", () => {
    const own = mutant("3", 3, "CompileError", `${ts(x, 3, 2322, `Type '""' is not assignable to type '"planted"'.`)}\n`);
    const run = { report: reportOf({ [x]: [own] }), exitCode: 0, output: "" };
    expect(classifyMutants(run, [changed(x, [{ start: 3, end: 3 }])])).toEqual({ ok: true, mutants: 1, findings: [], timeouts: [], compileErrors: [compileError(3)], zeroEntries: [] });
  });

  it("passes when every mutant is a CompileError but no diagnostic is in all of them", () => {
    const mutants = [mutant("5", 5, "CompileError", `${ts(x, 1, 7022)}\n`), mutant("6", 6, "CompileError", `${ts(x, 2, 7022)}\n${ts(x, 1, 2322)}\n`)];
    const run = { report: reportOf({ [x]: mutants }), exitCode: 0, output: "" };
    expect(classifyMutants(run, [changed(x, [{ start: 5, end: 6 }])])).toEqual({ ok: true, mutants: 2, findings: [], timeouts: [], compileErrors: [compileError(5), compileError(6)], zeroEntries: [] });
  });

  it("passes when a diagnostic off the mutants' lines is shared but one mutant on the changed lines is Killed", () => {
    const shared = `${ts(x, 1, 7022)}\n`;
    const mutants = [mutant("5", 5, "CompileError", shared), mutant("6", 6, "Killed"), mutant("7", 7, "CompileError", shared)];
    const run = { report: reportOf({ [x]: mutants }), exitCode: 0, output: "" };
    expect(classifyMutants(run, [changed(x, [{ start: 5, end: 7 }])])).toEqual({ ok: true, mutants: 3, findings: [], timeouts: [], compileErrors: [compileError(5), compileError(7)], zeroEntries: [] });
  });

  it("passes when the shared diagnostic is in another path: only the file's own path counts", () => {
    const shared = `${ts("packages/tokens/src/caller.ts", 1, 2345)}\n`;
    const mutants = [mutant("5", 5, "CompileError", shared), mutant("6", 6, "CompileError", shared)];
    const run = { report: reportOf({ [x]: mutants }), exitCode: 0, output: "" };
    expect(classifyMutants(run, [changed(x, [{ start: 5, end: 6 }])])).toEqual({ ok: true, mutants: 2, findings: [], timeouts: [], compileErrors: [compileError(5), compileError(6)], zeroEntries: [] });
  });

  // T089 (T025's mutation of report.ts): the rule's parts at their edges.
  it("passes when every mutant carries the diagnostic but one on the changed lines is Killed (its test's message quoting it)", () => {
    const shared = `${ts(x, 1, 7022)}\n`;
    const mutants = [mutant("5", 5, "CompileError", shared), mutant("6", 6, "Killed", shared)];
    const run = { report: reportOf({ [x]: mutants }), exitCode: 0, output: "" };
    expect(classifyMutants(run, [changed(x, [{ start: 5, end: 6 }])])).toEqual({ ok: true, mutants: 2, findings: [], timeouts: [], compileErrors: [compileError(5)], zeroEntries: [] });
  });

  it("passes when one CompileError of three lacks the diagnostic the other two share", () => {
    const shared = `${ts(x, 1, 7022)}\n`;
    const mutants = [mutant("5", 5, "CompileError", shared), mutant("6", 6, "CompileError", shared), mutant("7", 7, "CompileError", `${ts(x, 2, 2322)}\n`)];
    const run = { report: reportOf({ [x]: mutants }), exitCode: 0, output: "" };
    expect(classifyMutants(run, [changed(x, [{ start: 5, end: 7 }])])).toEqual({ ok: true, mutants: 3, findings: [], timeouts: [], compileErrors: [compileError(5), compileError(6), compileError(7)], zeroEntries: [] });
  });

  it("passes when the other mutant has the same line and code in another path only: the path is part of the diagnostic", () => {
    const mutants = [mutant("5", 5, "CompileError", `${ts(x, 1, 7022)}\n`), mutant("6", 6, "CompileError", `${ts("packages/tokens/src/caller.ts", 1, 7022)}\n`)];
    const run = { report: reportOf({ [x]: mutants }), exitCode: 0, output: "" };
    expect(classifyMutants(run, [changed(x, [{ start: 5, end: 6 }])])).toEqual({ ok: true, mutants: 2, findings: [], timeouts: [], compileErrors: [compileError(5), compileError(6)], zeroEntries: [] });
  });

  it("passes when the shared text is only on indented lines: a continuation is not a diagnostic", () => {
    const indented = `${ts(x, 9, 2345)}\n  ${ts(x, 1, 7022)}\n`;
    const mutants = [mutant("5", 5, "CompileError", indented), mutant("6", 6, "CompileError", `${ts(x, 6, 2322)}\n  ${ts(x, 1, 7022)}\n`)];
    const run = { report: reportOf({ [x]: mutants }), exitCode: 0, output: "" };
    expect(classifyMutants(run, [changed(x, [{ start: 5, end: 6 }])])).toEqual({ ok: true, mutants: 2, findings: [], timeouts: [], compileErrors: [compileError(5), compileError(6)], zeroEntries: [] });
  });

  it("cannot run when the shared diagnostic is below every mutant's lines, as above them", () => {
    const shared = `${ts(x, 9, 7022)}\n`;
    const mutants = [mutant("5", 5, "CompileError", shared), mutant("6", 6, "CompileError", shared, 7)];
    const run = { report: reportOf({ [x]: mutants }), exitCode: 0, output: "" };
    expect(classifyMutants(run, [changed(x, [{ start: 5, end: 7 }])])).toEqual({
      ok: false,
      cause: `mutation: could not run: Stryker's type checker rejects ${x} itself, not its mutants: ${x}(9,3): error TS7022; fix that type error (an explicit type often does) and rerun`,
    });
  });

  it("passes when the shared diagnostic is on a line one of the mutants spans", () => {
    const shared = `${ts(x, 5, 2322)}\n`;
    const mutants = [mutant("5", 5, "CompileError", shared), mutant("6", 6, "CompileError", shared)];
    const run = { report: reportOf({ [x]: mutants }), exitCode: 0, output: "" };
    expect(classifyMutants(run, [changed(x, [{ start: 5, end: 6 }])])).toEqual({ ok: true, mutants: 2, findings: [], timeouts: [], compileErrors: [compileError(5), compileError(6)], zeroEntries: [] });
  });

  it("passes when a statusReason has no parsable diagnostic line: it shares none", () => {
    const unparsable = "x.ts:1:3 - error TS7022: a message.\n";
    const mutants = [mutant("5", 5, "CompileError", unparsable), mutant("6", 6, "CompileError", unparsable)];
    const run = { report: reportOf({ [x]: mutants }), exitCode: 0, output: "" };
    expect(classifyMutants(run, [changed(x, [{ start: 5, end: 6 }])])).toEqual({ ok: true, mutants: 2, findings: [], timeouts: [], compileErrors: [compileError(5), compileError(6)], zeroEntries: [] });
  });
});
