import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

const defaultConfiguration = "stryker.config.json";
const elementsConfiguration = "stryker.elements.config.json";
const defaultFile = "storybook/stories/pane-action-footer.ts";
const elementsFile = "packages/elements/src/ocelle-step-indicator.ts";
const defaultSelector = `${defaultFile}:1-30`;
const elementsSelector = `${elementsFile}:151-167`;

function mutant(path: string, line: number, status: string) {
  return {
    path,
    location: { start: { line, column: 0 }, end: { line, column: 5 } },
    mutatorName: "ConditionalExpression",
    replacement: "true",
    status,
  };
}

function fixture() {
  // The standard mixed shard on the folded #87 review, with synthetic observations.
  const pins = {
    head: "fb7e9acb2939b3f80ed2ca010224b6834b56dfb2",
    base: "25c53a915717fe464a67b53a7dd58ceaf4abc0c7",
    tree: "a33989d6f271e46bf7f7f4f216b90bd4990418f1",
    runtime: `sha256:${"a".repeat(64)}`,
  };
  const expected = {
    pins,
    configurations: [
      { configuration: defaultConfiguration, selectors: [defaultSelector], ranges: [defaultSelector] },
      { configuration: elementsConfiguration, selectors: [elementsSelector], ranges: [elementsSelector] },
    ],
  };
  const defaultReceipt = {
    configuration: defaultConfiguration,
    ranges: [defaultSelector],
    baseline: { tests: 310, elapsedMs: 12_000 },
    totalMs: 45_000,
    mutants: [mutant(defaultFile, 2, "Killed"), mutant(defaultFile, 5, "Ignored")],
  };
  const elementsReceipt = {
    configuration: elementsConfiguration,
    ranges: [elementsSelector],
    baseline: { tests: 154, elapsedMs: 9_000 },
    totalMs: 50_000,
    mutants: [mutant(elementsFile, 153, "Killed"), mutant(elementsFile, 160, "CompileError")],
  };
  const mixed = {
    pins: { ...pins },
    selectors: [elementsSelector, defaultSelector],
    verdict: 0,
    timing: { setupMs: 14_000, elapsedMs: 120_000, retries: 0 },
    receipts: [defaultReceipt, elementsReceipt] satisfies [typeof defaultReceipt, typeof elementsReceipt],
  };
  type SplitJob = Omit<typeof mixed, "receipts"> & { receipts: [typeof defaultReceipt] };
  const split = [
    {
      pins: { ...pins },
      selectors: [defaultSelector],
      verdict: 0,
      timing: { setupMs: 15_000, elapsedMs: 60_000, retries: 1 },
      receipts: [{
        ...structuredClone(defaultReceipt),
        baseline: { tests: 310, elapsedMs: 10_000 },
        totalMs: 39_000,
        mutants: structuredClone(defaultReceipt.mutants).reverse(),
      }],
    },
    {
      pins: { ...pins },
      selectors: [elementsSelector],
      verdict: 0,
      timing: { setupMs: 16_000, elapsedMs: 90_000, retries: 0 },
      receipts: [{
        ...structuredClone(elementsReceipt),
        baseline: { tests: 154, elapsedMs: 11_000 },
        totalMs: 65_000,
      }],
    },
  ] satisfies [SplitJob, SplitJob];
  return { expected, mixed, split };
}

type Fixture = ReturnType<typeof fixture>;
interface Comparison {
  readonly matched: boolean;
  readonly verdict?: number;
}

interface Observation {
  readonly mixed: unknown;
  readonly split: unknown;
}

async function compare({ expected, mixed, split }: Pick<Fixture, "expected"> & Observation): Promise<Comparison | undefined> {
  // The canonical red replay overlays this test on a base that lacks the comparator.
  const source = "../bin/mutation-config-shadow.ts";
  if (!existsSync(new URL(source, import.meta.url))) return undefined;
  const module = await import(source) as {
    readonly compareMutationConfigShadow?: (
      expected: Fixture["expected"],
      observed: Observation,
    ) => Comparison;
  };
  return module.compareMutationConfigShadow?.(expected, { mixed, split });
}

interface InvalidTrial {
  readonly name: string;
  readonly reason: string;
  readonly change: (trial: Fixture) => void;
}

describe("mutation configuration shadow", () => {
  it("matches both unchanged configuration inventories and reports the measured timing of each arm", async () => {
    const result = await compare(fixture());
    expect(result?.matched, "both configurations cover the standard shard with matching mutant identities and outcomes").toBe(true);
    expect(result).toMatchObject({
      verdict: 0,
      measurements: {
        mixed: {
          setupMs: 14_000, slowestJobMs: 120_000, runnerMinutes: 2, retries: 0,
          configurations: {
            [defaultConfiguration]: { baseline: { tests: 310, elapsedMs: 12_000 }, totalMs: 45_000, mutantCount: 2 },
            [elementsConfiguration]: { baseline: { tests: 154, elapsedMs: 9_000 }, totalMs: 50_000, mutantCount: 2 },
          },
        },
        split: {
          setupMs: 31_000, slowestJobMs: 90_000, runnerMinutes: 2.5, retries: 1,
          configurations: {
            [defaultConfiguration]: { baseline: { tests: 310, elapsedMs: 10_000 }, totalMs: 39_000, mutantCount: 2 },
            [elementsConfiguration]: { baseline: { tests: 154, elapsedMs: 11_000 }, totalMs: 65_000, mutantCount: 2 },
          },
        },
      },
    });
  });

  it("retains the standard gate failure when both arms report the seeded survivor", async () => {
    const trial = fixture();
    trial.mixed.receipts[1].mutants.push(mutant(elementsFile, 155, "Survived"));
    trial.split[1].receipts[0].mutants.push(mutant(elementsFile, 155, "Survived"));
    trial.mixed.verdict = 1;
    trial.split[1].verdict = 1;
    const result = await compare(trial);
    expect(result?.matched, "the seeded failure has matching inventories and verdicts").toBe(true);
    expect(result?.verdict, "matching a surviving mutant still fails the standard gate").toBe(1);
  });

  it.each([
    {
      name: "a missing mixed receipt", reason: "receipts",
      change: ({ mixed }) => { mixed.receipts.pop(); },
    },
    {
      name: "a missing split receipt", reason: "receipts",
      change: ({ split }) => { split[1].receipts.pop(); },
    },
    {
      name: "a duplicate receipt", reason: "receipts",
      change: ({ split }) => { split[0].receipts.push(split[0].receipts[0]); },
    },
    {
      name: "a duplicate split invocation", reason: "receipts",
      change: ({ split }) => { split.push(split[0]); },
    },
    {
      name: "a stale source head", reason: "provenance",
      change: ({ mixed, split }) => {
        const staleHead = "b".repeat(40);
        mixed.pins.head = staleHead;
        split[0].pins.head = staleHead;
        split[1].pins.head = staleHead;
      },
    },
    {
      name: "a moved diff base", reason: "provenance",
      change: ({ split }) => { split[0].pins.base = "b".repeat(40); },
    },
    {
      name: "a mismatched source tree", reason: "provenance",
      change: ({ mixed }) => { mixed.pins.tree = "c".repeat(40); },
    },
    {
      name: "a different runtime", reason: "provenance",
      change: ({ split }) => { split[1].pins.runtime = `sha256:${"b".repeat(64)}`; },
    },
    {
      name: "changed selectors with the same resolved lines", reason: "selectors",
      change: ({ mixed, split }) => {
        mixed.selectors[0] = `${elementsFile}:0151-167`;
        split[1].selectors[0] = `${elementsFile}:0151-167`;
      },
    },
    {
      name: "matching ranges that extend the standard selection", reason: "ranges",
      change: ({ mixed, split }) => {
        mixed.receipts[0].ranges = [`${defaultFile}:1-31`];
        split[0].receipts[0].ranges = [`${defaultFile}:1-31`];
      },
    },
    {
      name: "a receipt under the wrong configuration", reason: "configuration",
      change: ({ split }) => { split[0].receipts[0].configuration = elementsConfiguration; },
    },
    {
      name: "a mutant outside its configuration's selection", reason: "mutants",
      change: ({ mixed, split }) => {
        mixed.receipts[0].mutants.push(mutant(elementsFile, 153, "Killed"));
        split[0].receipts[0].mutants.push(mutant(elementsFile, 153, "Killed"));
      },
    },
    {
      name: "a matching empty inventory for an expected configuration", reason: "mutants",
      change: ({ mixed, split }) => {
        mixed.receipts[1].mutants = [];
        split[1].receipts[0].mutants = [];
      },
    },
    {
      name: "an omitted mutant in an otherwise populated lane", reason: "mutants",
      change: ({ split }) => { split[1].receipts[0].mutants.pop(); },
    },
    {
      name: "a changed mutant identity with the same verdict", reason: "mutants",
      change: ({ split }) => {
        split[1].receipts[0].mutants = [
          { ...mutant(elementsFile, 153, "Killed"), replacement: "false" },
          mutant(elementsFile, 160, "CompileError"),
        ];
      },
    },
    {
      name: "changed mutant outcomes with equal status totals", reason: "mutants",
      change: ({ split }) => {
        split[1].receipts[0].mutants = [mutant(elementsFile, 153, "CompileError"), mutant(elementsFile, 160, "Killed")];
      },
    },
    {
      name: "an unfinished mutant even when both lanes report it", reason: "mutants",
      change: ({ mixed, split }) => {
        mixed.receipts[1].mutants.push(mutant(elementsFile, 157, "Pending"));
        split[1].receipts[0].mutants.push(mutant(elementsFile, 157, "Pending"));
      },
    },
    {
      name: "different baseline test counts in the same configuration", reason: "timing",
      change: ({ split }) => { split[1].receipts[0].baseline.tests += 1; },
    },
    {
      name: "an unusable gate verdict", reason: "verdict",
      change: ({ split }) => { split[1].verdict = 2; },
    },
    {
      name: "a different standard verdict with equal inventories", reason: "verdict",
      change: ({ split }) => { split[1].verdict = 1; },
    },
  ] satisfies readonly InvalidTrial[])("rejects $name", async ({ reason, change }) => {
    const trial = fixture();
    change(trial);
    const result = await compare(trial);
    expect(result?.matched, "an invalid comparison must explicitly reject the receipts").toBe(false);
    expect(result).toMatchObject({ reason });
  });

  it.each([
    {
      name: "an expected plan without both configurations", reason: "configuration",
      detail: "expected a standard mixed shard with both configurations",
      change: ({ expected }) => { expected.configurations.pop(); },
    },
    {
      name: "multiple mixed receipts for one configuration", reason: "receipts",
      detail: `mixed control (${defaultConfiguration}): duplicate configuration receipt`,
      change: ({ mixed }) => { mixed.receipts[1] = structuredClone(mixed.receipts[0]); },
    },
    {
      name: "two split invocations that claim the same standard selectors", reason: "receipts",
      detail: `${defaultConfiguration}: duplicate split invocation`,
      change: ({ split }) => { split[1] = structuredClone(split[0]); },
    },
    {
      name: "a split invocation with selectors assigned to neither configuration", reason: "selectors",
      detail: `${elementsConfiguration}: missing unchanged split selectors`,
      change: ({ split }) => { split[1].selectors = [`${elementsFile}:151-166`]; },
    },
    {
      name: "a split baseline whose elapsed time exceeds total mutation time", reason: "timing",
      detail: `split invocation (${elementsConfiguration}): baseline or mutation time is incomplete`,
      change: ({ split }) => { split[1].receipts[0].totalMs = split[1].receipts[0].baseline.elapsedMs - 1; },
    },
    {
      name: "split setup and execution that exceed job time", reason: "timing",
      detail: "split invocation: setup and execution exceed job time",
      change: ({ split }) => { split[0].timing.elapsedMs = split[0].timing.setupMs + split[0].receipts[0].totalMs - 1; },
    },
    {
      name: "unequal baseline counts with the configuration identified", reason: "timing",
      detail: `${elementsConfiguration}: baseline test counts differ`,
      change: ({ split }) => { split[1].receipts[0].baseline.tests += 1; },
    },
    {
      name: "a mutant owned by another configuration on a line inside the reported bounds", reason: "mutants",
      detail: `mixed control (${defaultConfiguration}): empty, unfinished or out-of-range mutant inventory`,
      change: ({ mixed, split }) => {
        mixed.receipts[0].mutants.push(mutant(elementsFile, 2, "Killed"));
        split[0].receipts[0].mutants.push(mutant(elementsFile, 2, "Killed"));
      },
    },
    {
      name: "a passing exit code when both arms report an uncovered mutant", reason: "verdict",
      detail: `mixed control (${elementsConfiguration}): passing gate verdict includes a survivor`,
      change: ({ mixed, split }) => {
        mixed.receipts[1].mutants.push(mutant(elementsFile, 155, "NoCoverage"));
        split[1].receipts[0].mutants.push(mutant(elementsFile, 155, "NoCoverage"));
      },
    },
  ] satisfies readonly (InvalidTrial & { readonly detail: string })[])("diagnoses $name", async ({ reason, detail, change }) => {
    const trial = fixture();
    change(trial);
    expect(await compare(trial)).toEqual({ matched: false, reason, detail });
  });

  it("requires the complete array of split invocation receipts", async () => {
    const trial = fixture();
    const rejection = {
      matched: false,
      reason: "receipts",
      detail: "expected one completed split invocation per configuration",
    };
    expect(await compare({ ...trial, split: trial.split.slice(0, 1) })).toEqual(rejection);
    await expect(compare({ ...trial, split: null })).resolves.toEqual(rejection);
  });

  it("identifies the configuration missing its split invocation when an entry is malformed", async () => {
    const trial = fixture();
    expect(await compare({ ...trial, split: [trial.split[0], null] })).toEqual({
      matched: false,
      reason: "selectors",
      detail: `${elementsConfiguration}: missing unchanged split selectors`,
    });
  });

  it.each([150, 168])("rejects matching mutant inventories outside the selected interval at line %s", async (line) => {
    const trial = fixture();
    trial.mixed.receipts[1].mutants.push(mutant(elementsFile, line, "Killed"));
    trial.split[1].receipts[0].mutants.push(mutant(elementsFile, line, "Killed"));
    expect(await compare(trial)).toEqual({
      matched: false,
      reason: "mutants",
      detail: `mixed control (${elementsConfiguration}): empty, unfinished or out-of-range mutant inventory`,
    });
  });

  it("accepts completed mutants that touch either selected boundary and preserves the split job timings", async () => {
    const trial = fixture();
    const first = mutant(elementsFile, 150, "RuntimeError");
    first.location.end.line = 151;
    const last = mutant(elementsFile, 167, "Timeout");
    last.location.end.line = 168;
    trial.mixed.receipts[1].mutants.push(first, last);
    trial.split[1].receipts[0].mutants.push(structuredClone(last), structuredClone(first));
    trial.split.reverse();
    const result = await compare(trial);
    expect(result?.matched).toBe(true);
    expect(result).toMatchObject({
      verdict: 0,
      measurements: {
        split: {
          jobs: [
            { selectors: [defaultSelector], verdict: 0, timing: { setupMs: 15_000, elapsedMs: 60_000, retries: 1 } },
            { selectors: [elementsSelector], verdict: 0, timing: { setupMs: 16_000, elapsedMs: 90_000, retries: 0 } },
          ],
          configurations: { [elementsConfiguration]: { mutantCount: 4 } },
        },
      },
    });
  });
});
