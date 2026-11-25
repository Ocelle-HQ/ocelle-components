import { describe, expect, it } from "vitest";
import { mutation } from "../bin/mutation.ts";
import type { MutationTools } from "../bin/mutation.ts";
import { base, capture, configuredStryker, context, elementsReportPath, fakeGit, fakeRepo, mutant, newFilesDiff, strykerReport } from "./mutation-fakes.ts";
import type { FakeStryker } from "./mutation-fakes.ts";

// The mutation gate's split by configuration (005 research.md R-12, T019): the selected changed files are split into
// element source (packages/elements/src/**), which runs under stryker.elements.config.json (its Vitest config holds
// only the in-process elements project), and every other file, which runs under stryker.config.json; each non-empty
// group runs once, with its own report deleted first, and the classified results are merged into one verdict. The
// Stryker double runs only its own configuration's tests, as the real configurations do (mutation-fakes.ts
// `configuredStryker`): under the wrong configuration a mutant is NoCoverage. So an element-only change that the split
// lost, or that ran under the default configuration, never passes, and never ends in "nothing to mutate".
const elementFile = "packages/elements/src/x.ts";
const gateFile = "gates/lib/x.ts";

function source(lines: number): string {
  return Array.from({ length: lines }, (_, i) => `export const v${String(i)} = ${String(i)};`).join("\n");
}

async function gate(tools: MutationTools, args: readonly string[] = []): Promise<{ readonly code: number; readonly out: readonly string[]; readonly err: readonly string[] }> {
  const { io, out, err } = capture();
  const code = await mutation(context(["--base", base, ...args]), tools, io);
  return { code, out, err };
}

function tools(changed: Readonly<Record<string, number>>, stryker: FakeStryker, extra: Readonly<Record<string, string>> = {}): MutationTools {
  const files = Object.fromEntries(Object.entries(changed).map(([path, lines]) => [path, source(lines)]));
  return { git: fakeGit(newFilesDiff(changed)), ...fakeRepo({ ...files, ...extra }, stryker) };
}

const killed = configuredStryker(() => "Killed");

/** The third changed file of the 007 cases: package source outside elements, so it runs under stryker.config.json. */
const tokenFile = "packages/tokens/src/x.ts";

/**
 * A Stryker that, under either configuration, gives each `mutate` entry a Timeout mutant at its first line and a
 * CompileError mutant at the line after it, and writes the report its configuration names (007 FR-001, FR-002).
 */
const undecidedStryker: FakeStryker = (mutate, files, config) => {
  const mutants: Record<string, object[]> = {};
  mutate.forEach((entry, index) => {
    const [, path = "", start = "0"] = /^(.*):(\d+)-(\d+)$/s.exec(entry) ?? [];
    (mutants[path] ??= []).push(mutant(`${String(index)}t`, Number(start), "Timeout"), mutant(`${String(index)}c`, Number(start) + 1, "CompileError"));
  });
  files.set(config === "stryker.elements.config.json" ? elementsReportPath : "reports/mutation/mutation.json", strykerReport(mutants));
  return { exitCode: 0, stdout: "", stderr: "" };
};

/** A Stryker that finds no mutant on any entry, under either configuration (007 FR-003). */
const zeroStryker: FakeStryker = (_mutate, files, config) => {
  files.set(config === "stryker.elements.config.json" ? elementsReportPath : "reports/mutation/mutation.json", strykerReport({}));
  return { exitCode: 0, stdout: "", stderr: "" };
};
const survives = configuredStryker(() => "Survived");

describe("mutation gate: a grouped element invocation", () => {
  it("reports a survivor in a paired bucket and excludes a mutant beyond the selected lines", async () => {
    const writesMutants: FakeStryker = (selected, files, configuration) => {
      const mutants = selected.includes(`${elementFile}:1-60`) && configuration === "stryker.elements.config.json"
        ? [mutant("first", 3, "Killed"), mutant("second", 44, "Survived"), mutant("outside", 61, "Survived")]
        : [];
      files.set(elementsReportPath, strykerReport({ [elementFile]: mutants }));
      return { exitCode: 1, stdout: "", stderr: "" };
    };
    const result = await gate(tools({ [elementFile]: 100 }, writesMutants), ["--shadow-grouped", "--files", `${elementFile}:1-60`]);
    expect(result.code, "the selected grouped range retains the survivor verdict").toBe(1);
    expect(result.out).toContain(`${elementFile}:44: mutation: ConditionalExpression: Survived: replaced by true`);
    expect(result.out).not.toContain(`${elementFile}:61: mutation: ConditionalExpression: Survived: replaced by true`);
  });

  it("reports a missing grouped report even when a previous report is present", async () => {
    const previous = strykerReport({ [elementFile]: [mutant("old", 3, "Killed")] });
    const noReport: FakeStryker = () => ({ exitCode: 1, stdout: "", stderr: "" });
    const result = await gate(tools({ [elementFile]: 60 }, noReport, { [elementsReportPath]: previous }), [
      "--shadow-grouped", "--files", `${elementFile}:1-60`,
    ]);
    expect(result.code).toBe(2);
    expect(result.err[0], "the grouped invocation must produce its own usable report").toContain("Stryker wrote no report");
  });
});

describe("the split of the mutation gate (005 research.md R-12)", () => {
  it("runs an element-only change under the elements configuration: its mutant is killed and the gate passes, not 'nothing to mutate' (pass-element-source)", async () => {
    expect(await gate(tools({ [elementFile]: 2 }, killed))).toEqual({
      code: 0,
      out: ["mutation: 1 mutant on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 0 zero-mutant entries; 0 equivalent records"],
      err: [],
    });
  });

  it("reports an element-source survivor as Survived at its line (fail-element-source-survivor)", async () => {
    expect(await gate(tools({ [elementFile]: 2 }, survives))).toEqual({
      code: 1,
      out: [`${elementFile}:1: mutation: ConditionalExpression: Survived: replaced by true`, "mutation: 1 finding in 1 changed file (1 mutant on changed lines; 0 timeouts, 0 compile errors, 0 zero-mutant entries)"],
      err: [],
    });
  });

  it("reports an element module that no elements test covers as NoCoverage (fail-element-source-no-coverage)", async () => {
    const uncovered = configuredStryker((path) => (path === elementFile ? "NoCoverage" : "Killed"));
    expect(await gate(tools({ [elementFile]: 2 }, uncovered))).toEqual({
      code: 1,
      out: [`${elementFile}:1: mutation: ConditionalExpression: NoCoverage: replaced by true`, "mutation: 1 finding in 1 changed file (1 mutant on changed lines; 0 timeouts, 0 compile errors, 0 zero-mutant entries)"],
      err: [],
    });
  });

  it("runs a mixed change as two runs, one per configuration, and merges their counts when both are killed", async () => {
    expect(await gate(tools({ [gateFile]: 3, [elementFile]: 2 }, killed))).toEqual({
      code: 0,
      out: ["mutation: 2 mutants on the changed lines of 2 files, none survived; 0 timeouts, 0 compile errors, 0 zero-mutant entries; 0 equivalent records"],
      err: [],
    });
  });

  it("merges the survivors of both runs, the default configuration's first (fail-mixed-survivors)", async () => {
    expect(await gate(tools({ [gateFile]: 3, [elementFile]: 2 }, survives))).toEqual({
      code: 1,
      out: [
        `${gateFile}:1: mutation: ConditionalExpression: Survived: replaced by true`,
        `${elementFile}:1: mutation: ConditionalExpression: Survived: replaced by true`,
        "mutation: 2 findings in 2 changed files (2 mutants on changed lines; 0 timeouts, 0 compile errors, 0 zero-mutant entries)",
      ],
      err: [],
    });
  });

  it("deletes the elements report before its run, so an earlier report never decides: a run that writes none cannot decide", async () => {
    const earlier = strykerReport({ [elementFile]: [mutant("0", 1, "Killed")] });
    const writesNothing: FakeStryker = (mutate, files, config) => (config === "stryker.elements.config.json" ? { exitCode: 1, stdout: "", stderr: "" } : killed(mutate, files, config));
    const ran = await gate(tools({ [elementFile]: 2 }, writesNothing, { [elementsReportPath]: earlier }));
    expect({ code: ran.code, out: ran.out, err: ran.err.map((line) => line.split(" (")[0]) }).toEqual({
      code: 2,
      out: [],
      err: ["mutation: could not run: Stryker wrote no report"],
    });
  });

  // 007 (contracts/mutation-output.md) on the split: the timeout, compile-error and zero-mutants lines of both runs are
  // reported and counted, in the changed files' order (gates/lib, then packages/elements, then packages/tokens), not
  // in the order of the runs, which puts the token file of the default run before the element file.
  it("reports the timeout and compile-error lines of both runs in the changed files' order, and counts them (007)", async () => {
    expect(await gate(tools({ [gateFile]: 2, [elementFile]: 2, [tokenFile]: 2 }, undecidedStryker))).toEqual({
      code: 0,
      out: [
        `${gateFile}:1: mutation: timeout: ConditionalExpression: replaced by true`,
        `${elementFile}:1: mutation: timeout: ConditionalExpression: replaced by true`,
        `${tokenFile}:1: mutation: timeout: ConditionalExpression: replaced by true`,
        `${gateFile}:2: mutation: compile-error: ConditionalExpression: replaced by true`,
        `${elementFile}:2: mutation: compile-error: ConditionalExpression: replaced by true`,
        `${tokenFile}:2: mutation: compile-error: ConditionalExpression: replaced by true`,
        "mutation: 6 mutants on the changed lines of 3 files, none survived; 3 timeouts, 3 compile errors, 0 zero-mutant entries; 0 equivalent records",
      ],
      err: [],
    });
  });

  it("reports the zero-mutant entries of both runs in the changed files' order, and counts them (007)", async () => {
    expect(await gate(tools({ [gateFile]: 2, [elementFile]: 2, [tokenFile]: 2 }, zeroStryker))).toEqual({
      code: 0,
      out: [
        `${gateFile}: mutation: zero-mutants: no mutant on the changed lines`,
        `${elementFile}: mutation: zero-mutants: no mutant on the changed lines`,
        `${tokenFile}: mutation: zero-mutants: no mutant on the changed lines`,
        "mutation: 0 mutants on the changed lines of 3 files, none survived; 0 timeouts, 0 compile errors, 3 zero-mutant entries; 0 equivalent records",
      ],
      err: [],
    });
  });

  it("names the zero-mutant entries of a --files run of both configurations as given, in the changed files' order (007)", async () => {
    const ran = await gate(tools({ [elementFile]: 4, [tokenFile]: 4 }, zeroStryker), ["--files", `${tokenFile}:2-3,${elementFile}`]);
    expect(ran).toEqual({
      code: 0,
      out: [
        `${elementFile}: mutation: zero-mutants: no mutant on the changed lines`,
        `${tokenFile}:2-3: mutation: zero-mutants: no mutant on the changed lines`,
        "mutation: 0 mutants on the changed lines of 2 files, none survived; 0 timeouts, 0 compile errors, 2 zero-mutant entries; 0 equivalent records",
      ],
      err: [],
    });
  });

  it("reports the findings of both runs with the timeout lines of both, the summary counting each (007)", async () => {
    const mixed: FakeStryker = (mutate, files, config) => {
      undecidedStryker(mutate, files, config);
      const path = config === "stryker.elements.config.json" ? elementsReportPath : "reports/mutation/mutation.json";
      const report = JSON.parse(files.get(path) ?? "{}") as { files: Record<string, { mutants: object[] }> };
      for (const [file, entry] of Object.entries(report.files)) entry.mutants.push(mutant("s", 1, file === tokenFile ? "Killed" : "Survived"));
      files.set(path, JSON.stringify(report));
      return { exitCode: 0, stdout: "", stderr: "" };
    };
    expect(await gate(tools({ [elementFile]: 2, [tokenFile]: 2 }, mixed))).toEqual({
      code: 1,
      out: [
        `${elementFile}:1: mutation: timeout: ConditionalExpression: replaced by true`,
        `${tokenFile}:1: mutation: timeout: ConditionalExpression: replaced by true`,
        `${elementFile}:2: mutation: compile-error: ConditionalExpression: replaced by true`,
        `${tokenFile}:2: mutation: compile-error: ConditionalExpression: replaced by true`,
        `${elementFile}:1: mutation: ConditionalExpression: Survived: replaced by true`,
        "mutation: 1 finding in 2 changed files (6 mutants on changed lines; 2 timeouts, 2 compile errors, 0 zero-mutant entries)",
      ],
      err: [],
    });
  });
});
