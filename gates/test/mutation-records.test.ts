import { describe, expect, it } from "vitest";
import { mutation } from "../bin/mutation.ts";
import { formatRecord, scanRecords } from "../lib/mutation/records.ts";
import { base, capture, context, fakeGit, fakeRead, fakeStryker } from "./mutation-fakes.ts";

// Equivalent-mutant records (FR-012, data-model.md): a reasoned next-line record in changed code is listed with its
// path, line, mutator and reason; a record without a reason and every other disable form in a changed file is a
// finding (rule disable-form).
const path = "gates/lib/a.ts";
const noReason = "equivalent-mutant record without a reason; write the reason after the colon (FR-012)";
const otherForm = "only a reasoned next-line record directly above the mutated line may disable mutants (FR-012)";

const recorded = [
  "export async function f(a: number): Promise<number> {",
  "  // Stryker disable next-line ConditionalExpression: the guard only narrows the type",
  "  if (a > 0) return a;",
  "  // Stryker disable next-line StringLiteral, EqualityOperator:   both are logged only  ",
  '  log(a === 1 ? "one" : "");',
  "  // Stryker disable next-line all: process boundary, covered by gates-integration",
  "  if (import.meta.main) await main(run);",
  "  return 0;",
  "}",
].join("\n");

function file(ranges: readonly { start: number; end: number }[]) {
  return { path, ranges, lines: ranges.reduce((sum, r) => sum + r.end - r.start + 1, 0) };
}

describe("scanRecords", () => {
  it("lists the reasoned next-line records whose own line or mutated line changed", () => {
    expect(scanRecords(file([{ start: 3, end: 5 }]), recorded)).toEqual({
      records: [
        { path, line: 2, mutator: "ConditionalExpression", reason: "the guard only narrows the type" },
        { path, line: 4, mutator: "StringLiteral, EqualityOperator", reason: "both are logged only" },
      ],
      findings: [],
    });
  });

  it("lists a record whose own line changed even when its mutated line did not", () => {
    expect(scanRecords(file([{ start: 6, end: 6 }]), recorded)).toEqual({
      records: [
        { path, line: 6, mutator: "all", reason: "process boundary, covered by gates-integration" },
      ],
      findings: [],
    });
  });

  it("does not list a record two lines or more away from the changed lines", () => {
    expect(scanRecords(file([{ start: 1, end: 1 }, { start: 8, end: 9 }]), recorded)).toEqual({
      records: [{ path, line: 2, mutator: "ConditionalExpression", reason: "the guard only narrows the type" }],
      findings: [],
    });
  });

  it("makes a record without a reason and every other disable form in the changed file a finding", () => {
    const source = [
      "// Stryker disable next-line all",
      "x();",
      "// Stryker disable next-line all:   ",
      "y();",
      "// Stryker disable all",
      "z();",
      "// Stryker restore all",
      "/* Stryker disable next-line all: a block comment */",
      "w(); // Stryker disable next-line all: a trailing comment",
      "// Stryker disable StringLiteral: until restored",
      "//   Stryker   disable   next-line all: spaced so that Stryker does not read it as a record",
      "// A comment that mentions Stryker but disables nothing.",
      "v();",
    ].join("\n");
    const finding = (line: number, message: string): object => ({
      location: { path, line },
      gate: "mutation",
      rule: "disable-form",
      message,
    });
    expect(scanRecords(file([{ start: 13, end: 13 }]), source)).toEqual({
      records: [],
      findings: [
        finding(1, noReason),
        finding(3, noReason),
        finding(5, otherForm),
        finding(7, otherForm),
        finding(8, otherForm),
        finding(9, otherForm),
        finding(10, otherForm),
        finding(11, otherForm),
      ],
    });
  });
});

describe("formatRecord", () => {
  it("writes <path>:<line>: mutation: record: <mutator>: <reason> (data-model.md § Finding)", () => {
    expect(formatRecord({ path, line: 2, mutator: "ConditionalExpression", reason: "the guard only narrows the type" })).toBe(
      "gates/lib/a.ts:2: mutation: record: ConditionalExpression: the guard only narrows the type",
    );
  });
});

describe("mutation gate: records and disable forms (US2 scenario 4)", () => {
  const diff = [
    `diff --git a/${path} b/${path}`,
    "index 1111111..2222222 100644",
    `--- a/${path}`,
    `+++ b/${path}`,
    "@@ -3,3 +3,3 @@ export async function f(a: number): Promise<number> {",
    "-old",
    "+new",
    "",
  ].join("\n");

  it("passes with every mutant killed and lists the records for the review", async () => {
    const { io, out, err } = capture();
    const tools = { git: fakeGit(diff), read: fakeRead({ [path]: recorded }), stryker: fakeStryker(() => "Killed") };
    const code = await mutation(context(["--base", base]), tools, io);
    expect({ code, out, err }).toEqual({
      code: 0,
      out: [
        "gates/lib/a.ts:2: mutation: record: ConditionalExpression: the guard only narrows the type",
        "gates/lib/a.ts:4: mutation: record: StringLiteral, EqualityOperator: both are logged only",
        "mutation: 1 mutant on the changed lines of 1 file, none survived; 2 equivalent records",
      ],
      err: [],
    });
  });

  it("fails on a disable form in a changed file even when every mutant is killed", async () => {
    const source = recorded.replace("// Stryker disable next-line all: process boundary", "// Stryker disable all: process boundary");
    const { io, out, err } = capture();
    const tools = { git: fakeGit(diff), read: fakeRead({ [path]: source }), stryker: fakeStryker(() => "Killed") };
    const code = await mutation(context(["--base", base]), tools, io);
    expect({ code, out, err }).toEqual({
      code: 1,
      out: [
        "gates/lib/a.ts:2: mutation: record: ConditionalExpression: the guard only narrows the type",
        "gates/lib/a.ts:4: mutation: record: StringLiteral, EqualityOperator: both are logged only",
        `gates/lib/a.ts:6: mutation: disable-form: ${otherForm}`,
        "mutation: 1 finding in 1 changed file (1 mutant on changed lines)",
      ],
      err: [],
    });
  });

  it("exits 2 when a changed file cannot be read", async () => {
    const { io, out, err } = capture();
    const tools = { git: fakeGit(diff), read: fakeRead({}), stryker: fakeStryker(() => "Killed") };
    const code = await mutation(context(["--base", base]), tools, io);
    expect({ code, out, err }).toEqual({
      code: 2,
      out: [],
      err: [`mutation: could not run: cannot read ${path}; check out the files of the change`],
    });
  });
});
