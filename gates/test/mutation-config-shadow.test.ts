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
    timing: { setupMs: 14_000, elapsedMs: 120_000, retries: 0, priorAttemptMs: 0 },
    receipts: [defaultReceipt, elementsReceipt] satisfies [typeof defaultReceipt, typeof elementsReceipt],
  };
  type SplitJob = Omit<typeof mixed, "receipts"> & { receipts: [typeof defaultReceipt] };
  const split = [
    {
      pins: { ...pins },
      selectors: [defaultSelector],
      verdict: 0,
      timing: { setupMs: 15_000, elapsedMs: 60_000, retries: 1, priorAttemptMs: 20_000 },
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
      timing: { setupMs: 16_000, elapsedMs: 90_000, retries: 0, priorAttemptMs: 0 },
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

function withDefaultMutant(value: unknown): Pick<Fixture, "expected"> & Observation {
  const { expected, mixed, split } = fixture();
  const [defaults, elements] = split;
  return {
    expected,
    mixed: { ...mixed, receipts: [{ ...mixed.receipts[0], mutants: [value] }, mixed.receipts[1]] },
    split: [{ ...defaults, receipts: [{ ...defaults.receipts[0], mutants: [value] }] }, elements],
  };
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

  it.each(["Killed", "Ignored"])("rejects the same stable mutant identity repeated in both arms with status %s", async (status) => {
    const trial = fixture();
    trial.mixed.receipts[0].mutants.push(mutant(defaultFile, 2, status));
    trial.split[0].receipts[0].mutants.push(mutant(defaultFile, 2, status));
    const result = await compare(trial);
    expect(result?.matched).toBe(false);
    expect(result).toMatchObject({ reason: "mutants" });
  });

  it("includes the failed attempt in total runner time when the current split jobs use less compute", async () => {
    const trial = fixture();
    trial.mixed.timing.elapsedMs = 180_000;
    trial.split[0].timing.priorAttemptMs = 90_000;
    const result = await compare(trial);
    expect(result?.matched).toBe(true);
    expect(result).toMatchObject({
      measurements: {
        mixed: { runnerMinutes: 3, totalRunnerMinutes: 3, retries: 0 },
        split: { runnerMinutes: 2.5, totalRunnerMinutes: 4, retries: 1 },
      },
    });
  });

  it("rejects a retry count without observed prior attempt time", async () => {
    const trial = fixture();
    const [defaults, elements] = trial.split;
    const result = await compare({
      ...trial,
      split: [{ ...defaults, timing: { ...defaults.timing, priorAttemptMs: undefined } }, elements],
    });
    expect(result?.matched).toBe(false);
    expect(result).toMatchObject({ reason: "timing" });
  });

  it("requires a receipt object even if an array or a callable carries its fields", async () => {
    const trial = fixture();
    const expected = {
      matched: false,
      reason: "receipts",
      detail: "mixed control: missing or duplicate receipts",
    };
    expect(await compare({ ...trial, mixed: Object.assign([], trial.mixed) })).toEqual(expected);
    expect(await compare({ ...trial, mixed: Object.assign(() => undefined, trial.mixed) })).toEqual(expected);
  });

  it("rejects null provenance with a diagnostic instead of failing to read the receipt", async () => {
    const trial = fixture();
    await expect(compare({ ...trial, mixed: { ...trial.mixed, pins: null } })).resolves.toEqual({
      matched: false,
      reason: "provenance",
      detail: "mixed control: source or runtime differs from the pinned comparison",
    });
  });

  it.each([
    { name: "negative setup duration", change: ({ mixed }) => { mixed.timing.setupMs = -1; } },
    { name: "infinite job duration", change: ({ mixed }) => { mixed.timing.elapsedMs = Infinity; } },
    { name: "fractional retry count", change: ({ mixed }) => { mixed.timing.retries = 0.5; } },
    { name: "negative retry count", change: ({ mixed }) => { mixed.timing.retries = -1; } },
    { name: "prior attempt time without retries", change: ({ mixed }) => { mixed.timing.priorAttemptMs = 1; } },
  ] satisfies readonly Omit<InvalidTrial, "reason">[])("rejects $name with a job timing diagnostic", async ({ change }) => {
    const trial = fixture();
    change(trial);
    expect(await compare(trial)).toEqual({ matched: false, reason: "timing", detail: "mixed control: job timing is incomplete" });
  });

  it.each([
    ["a repeated selector", [elementsSelector, defaultSelector, defaultSelector]],
    ["a different selector with the same count", [defaultSelector, `${elementsFile}:151-166`]],
  ])("rejects %s in the mixed control", async (_description, selectors) => {
    const trial = fixture();
    trial.mixed.selectors = selectors;
    expect(await compare(trial)).toEqual({
      matched: false, reason: "selectors", detail: "mixed control: standard selectors differ from the pinned selection",
    });
  });

  it.each([
    { name: "blank terminal status", changes: { status: "" } },
    { name: "blank mutator name", changes: { mutatorName: "" } },
    { name: "numeric mutator name", changes: { mutatorName: 1 } },
    { name: "non-string replacement", changes: { replacement: true } },
    { name: "zero-based starting line", changes: { location: { start: { line: 0, column: 2 }, end: { line: 3, column: 1 } } } },
    { name: "reversed lines", changes: { location: { start: { line: 3, column: 0 }, end: { line: 2, column: 1 } } } },
    { name: "reversed columns on one line", changes: { location: { start: { line: 3, column: 2 }, end: { line: 3, column: 1 } } } },
  ])("rejects $name even when both arms report it", async ({ changes }) => {
    const result = await compare(withDefaultMutant({ ...mutant(defaultFile, 3, "Killed"), ...changes }));
    expect(result).toEqual({
      matched: false,
      reason: "mutants",
      detail: `mixed control (${defaultConfiguration}): empty, unfinished or out-of-range mutant inventory`,
    });
  });

  it("diagnoses a missing mutant or end position without throwing", async () => {
    const valid = mutant(defaultFile, 3, "Killed");
    const invalid = [null, { ...valid, location: { ...valid.location, end: null } }];
    for (const value of invalid) {
      await expect(compare(withDefaultMutant(value))).resolves.toEqual({
        matched: false, reason: "mutants",
        detail: `mixed control (${defaultConfiguration}): empty, unfinished or out-of-range mutant inventory`,
      });
    }
  });

  it("keeps optional replacements, a zero-width location, and a multi-line mutant with an earlier end column", async () => {
    const points = [
      { start: { line: 3, column: 2 }, end: { line: 3, column: 2 } },
      { start: { line: 3, column: 2 }, end: { line: 4, column: 1 } },
    ];
    for (const location of points) {
      const result = await compare(withDefaultMutant({ path: defaultFile, location, mutatorName: "BlockStatement", status: "Killed" }));
      expect(result?.matched).toBe(true);
      expect(result?.verdict).toBe(0);
    }
  });

  it("assigns mutants to the appropriate bound when one standard selector resolves to multiple changed ranges", async () => {
    const trial = fixture();
    const ranges = [`${defaultFile}:1-5`, `${defaultFile}:10-30`];
    trial.expected.configurations = trial.expected.configurations.map((plan) => plan.configuration === defaultConfiguration ? { ...plan, ranges } : plan);
    for (const receipt of [trial.mixed.receipts[0], trial.split[0].receipts[0]]) {
      receipt.ranges = [...ranges];
      receipt.mutants.push(mutant(defaultFile, 12, "Killed"));
    }
    const result = await compare(trial);
    expect(result?.matched).toBe(true);
    expect(result).toMatchObject({
      measurements: { mixed: { configurations: { [defaultConfiguration]: { mutantCount: 3 } } } },
    });
  });

  it.each([`unexpected\n${defaultSelector}`, `${defaultSelector}unexpected`])("rejects a malformed bound %j", async (range) => {
    const trial = fixture();
    trial.expected.configurations = trial.expected.configurations.map((plan) =>
      plan.configuration === defaultConfiguration ? { ...plan, ranges: [range] } : plan);
    trial.mixed.receipts[0].ranges = [range];
    trial.split[0].receipts[0].ranges = [range];
    expect(await compare(trial)).toEqual({
      matched: false, reason: "mutants",
      detail: `mixed control (${defaultConfiguration}): empty, unfinished or out-of-range mutant inventory`,
    });
  });

  it.each(["tests", "elapsedMs"] as const)("rejects a reported baseline with zero %s", async (field) => {
    const trial = fixture();
    trial.mixed.receipts[0].baseline[field] = 0;
    trial.split[0].receipts[0].baseline[field] = 0;
    expect(await compare(trial)).toEqual({
      matched: false, reason: "timing", detail: `mixed control (${defaultConfiguration}): baseline or mutation time is incomplete`,
    });
  });

  it("accepts matching elapsed times at the baseline and total job boundaries", async () => {
    const trial = fixture();
    const [defaults] = trial.split;
    const [receipt] = defaults.receipts;
    receipt.totalMs = receipt.baseline.elapsedMs;
    defaults.timing.elapsedMs = defaults.timing.setupMs + receipt.totalMs;
    const result = await compare(trial);
    expect(result?.matched).toBe(true);
    expect(result).toMatchObject({
      measurements: { split: { configurations: { [defaultConfiguration]: { totalMs: 10_000 } } } },
    });
  });

  it.each([
    {
      name: "a missing receipt", reason: "receipts", detail: "mixed control: missing or duplicate receipts",
      change: ({ mixed }) => { mixed.receipts.pop(); },
    },
    {
      name: "an unfinished invocation", reason: "verdict", detail: "split invocation: standard gate did not complete",
      change: ({ split }) => { split[1].verdict = 2; },
    },
    {
      name: "a mislabelled receipt", reason: "configuration",
      detail: `split invocation (${defaultConfiguration}): expected its own configuration receipt`,
      change: ({ split }) => { split[0].receipts[0].configuration = elementsConfiguration; },
    },
    {
      name: "an extended changed range", reason: "ranges",
      detail: `split invocation (${defaultConfiguration}): changed ranges differ from the pinned selection`,
      change: ({ split }) => { split[0].receipts[0].ranges = [`${defaultFile}:1-31`]; },
    },
    {
      name: "a different mutant outcome", reason: "mutants", detail: `${elementsConfiguration}: mutant identities or outcomes differ`,
      change: ({ split }) => {
        split[1].receipts[0].mutants = [mutant(elementsFile, 153, "Timeout"), mutant(elementsFile, 160, "CompileError")];
      },
    },
    {
      name: "a different standard gate verdict", reason: "verdict", detail: "mixed and split standard gate verdicts differ",
      change: ({ split }) => { split[0].verdict = 1; },
    },
  ] satisfies readonly (InvalidTrial & { readonly detail: string })[])("names the cause of $name", async ({ reason, detail, change }) => {
    const trial = fixture();
    change(trial);
    expect(await compare(trial)).toEqual({ matched: false, reason, detail });
  });

  it("names the duplicate identity without including its outcome in the identity", async () => {
    const trial = fixture();
    const duplicate = mutant(defaultFile, 2, "Ignored");
    trial.mixed.receipts[0].mutants.push(duplicate);
    trial.split[0].receipts[0].mutants.push(duplicate);
    const identity = JSON.stringify([duplicate.path, duplicate.location.start, duplicate.location.end, duplicate.mutatorName, duplicate.replacement]);
    expect(await compare(trial)).toEqual({
      matched: false, reason: "mutants", detail: `mixed control (${defaultConfiguration}): duplicate mutant identity ${identity}`,
    });
  });
});
