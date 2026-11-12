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

async function gate(tools: MutationTools): Promise<{ readonly code: number; readonly out: readonly string[]; readonly err: readonly string[] }> {
  const { io, out, err } = capture();
  const code = await mutation(context(["--base", base]), tools, io);
  return { code, out, err };
}

function tools(changed: Readonly<Record<string, number>>, stryker: FakeStryker, extra: Readonly<Record<string, string>> = {}): MutationTools {
  const files = Object.fromEntries(Object.entries(changed).map(([path, lines]) => [path, source(lines)]));
  return { git: fakeGit(newFilesDiff(changed)), ...fakeRepo({ ...files, ...extra }, stryker) };
}

const killed = configuredStryker(() => "Killed");
const survives = configuredStryker(() => "Survived");

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
});
