import { describe, expect, it } from "vitest";
import { gateKeysProblem, judgePlant, parsePlant, plantFilesProblem } from "../lib/plant-judge.ts";
import type { Plant, PlantRun } from "../lib/plant-judge.ts";

// The plant verdict at the edges (FR-025, research.md R-10, data-model.md § Plant; phase 4 review round 1, R1-06):
// plant.json values that are empty or of the wrong type, output lines that are not findings of the gate, findings
// without a message, a message substring that only one of two equal findings holds, records of other gates, and the
// text of each problem.
const run = (exit: number | null, stdout: readonly string[], stderr: readonly string[] = []): PlantRun => ({ exit, stdout, stderr });

describe("parsePlant: values", () => {
  it.each([
    { plant: '"x"', problem: "plant.json is not an object" },
    { plant: "3", problem: "plant.json is not an object" },
    { plant: { expect: "fail", why: "w", findings: [{ location: "", rule: "r" }] }, problem: "findings[0] needs a location and a rule" },
    { plant: { expect: "fail", why: "w", findings: [{ location: "a", rule: "" }] }, problem: "findings[0] needs a location and a rule" },
    { plant: { expect: "fail", why: "w", findings: [{ location: "a", rule: "r" }, "x"] }, problem: "findings[1] needs a location and a rule" },
    { plant: { expect: "fail", why: "w", findings: {} }, problem: "a fail plant lists its findings" },
    { plant: { expect: "pass", why: "w", records: [{ location: "a", mutator: "", reason: "r" }] }, problem: "records[0] needs a location, a mutator and a reason" },
    { plant: { expect: "pass", why: "w", records: [{ location: "a", mutator: "m", reason: "r" }, null] }, problem: "records[1] needs a location, a mutator and a reason" },
    { plant: { expect: "pass", why: 3 }, problem: "why must be a non-empty string" },
  ])("rejects $plant", ({ plant, problem }) => {
    expect(parsePlant(typeof plant === "string" ? plant : JSON.stringify(plant))).toBe(problem);
  });

  it("names the JSON error of a plant.json that is not JSON, on one line", () => {
    expect(parsePlant("{\n")).toMatch(/^plant\.json is not valid JSON \([^\n]+\)$/);
  });

  it("keeps a finding's message, and reads a finding without one as location and rule only", () => {
    const fail = { expect: "fail", why: "w", findings: [{ location: "a", rule: "r", message: "" }, { location: "b", rule: "s" }] };
    expect(parsePlant(JSON.stringify(fail))).toEqual({ expect: "fail", why: "w", findings: [{ location: "a", rule: "r", message: "" }, { location: "b", rule: "s" }] });
  });
});

describe("judgePlant: output lines", () => {
  const fail: Plant = { expect: "fail", why: "w", findings: [{ location: "a.ts:1", rule: "r" }] };

  it("does not read a line that starts with the gate marker as a finding", () => {
    expect(judgePlant("g", fail, run(1, [": g: r: m", "a.ts:1: g: r: m"]))).toBeUndefined();
    expect(judgePlant("g", fail, run(1, [": g: r: m"]))).toBe("findings differ: missing a.ts:1 r");
  });

  it("reads a finding line without a message: the rest after the gate is the rule", () => {
    expect(judgePlant("g", fail, run(1, ["a.ts:1: g: r"]))).toBeUndefined();
    expect(judgePlant("g", { ...fail, findings: [{ location: "a.ts:1", rule: "r", message: "x" }] }, run(1, ["a.ts:1: g: r"]))).toBe('finding a.ts:1 r lacks "x"');
    expect(judgePlant("g", { ...fail, findings: [{ location: "a.ts:1", rule: "r", message: "here" }] }, run(1, ["a.ts:1: g: r"]))).toBe('finding a.ts:1 r lacks "here"');
  });

  it("splits the rule from the message at the first colon and space", () => {
    expect(judgePlant("g", { ...fail, findings: [{ location: "a.ts:1", rule: "r", message: "b: c" }] }, run(1, ["a.ts:1: g: r: a: b: c"]))).toBeUndefined();
  });
});

describe("judgePlant: fail plants", () => {
  it("needs the message in one of the findings with that location and rule", () => {
    const plant: Plant = { expect: "fail", why: "w", findings: [{ location: "a.ts:1", rule: "r", message: "needle" }, { location: "b.ts", rule: "s" }] };
    expect(judgePlant("g", plant, run(1, ["a.ts:1: g: r: hay", "a.ts:1: g: r: a needle", "b.ts: g: s: x"]))).toBeUndefined();
    expect(judgePlant("g", plant, run(1, ["a.ts:1: g: r: hay", "b.ts: g: s: needle"]))).toBe('finding a.ts:1 r lacks "needle"');
  });

  it("names every missing and every unexpected finding once", () => {
    const plant: Plant = { expect: "fail", why: "w", findings: [{ location: "a", rule: "r" }, { location: "a", rule: "r" }, { location: "b", rule: "r" }] };
    expect(judgePlant("g", plant, run(1, ["c: g: r: m", "c: g: r: n", "d: g: r: m"]))).toBe("findings differ: missing a r, b r; unexpected c r, d r");
    expect(judgePlant("g", plant, run(1, ["a: g: r: m", "b: g: r: m", "c: g: r: m"]))).toBe("findings differ: unexpected c r");
  });

  it("names the findings and the plant's finding count on an unexpected exit", () => {
    const plant: Plant = { expect: "fail", why: "w", findings: [{ location: "a", rule: "r" }] };
    expect(judgePlant("g", plant, run(0, ["x: g: q: m", "y: g: p: m"]))).toBe("expected exit 1 with the plant's 1 finding, got exit 0 (x q, y p)");
    expect(judgePlant("g", plant, run(2, [], []))).toBe("expected exit 1 with the plant's 1 finding, got exit 2");
  });
});

describe("judgePlant: pass plants and records", () => {
  const records: Plant = { expect: "pass", why: "w", records: [{ location: "a.ts:3", mutator: "all", reason: "boundary: covered" }] };

  it("reads a record's mutator up to the first colon and space and the rest as its reason", () => {
    expect(judgePlant("mutation", records, run(0, ["a.ts:3: mutation: record: all: boundary: covered"]))).toBeUndefined();
  });

  it("counts a record line of a gate other than mutation as a finding", () => {
    expect(judgePlant("g", { expect: "pass", why: "w" }, run(0, ["a.ts:3: g: record: all: r"]))).toBe("expected exit 0 with no finding, got exit 0 (a.ts:3 record)");
  });

  it("does not check records when the plant lists none", () => {
    expect(judgePlant("mutation", { expect: "pass", why: "w" }, run(0, ["a.ts:3: mutation: record: all: r"]))).toBeUndefined();
  });

  it("checks an empty records list: any record is unexpected", () => {
    expect(judgePlant("mutation", { expect: "pass", why: "w", records: [] }, run(0, ["a.ts:3: mutation: record: all: r"]))).toBe('records differ: unexpected a.ts:3 all "r"');
  });
});

// Phase 4 round 5 (operator round from the PR #18 landing review, O5-01 and O5-02; tasks.md T096, contracts/plants.md,
// data-model.md § Plant): an error plant names the cause it expects, a substring of a line of the gate's error output
// at exit 2, so a breakage for another reason does not prove the gate's "could not run" path; `cause` belongs to an
// error plant only; a pass plant may not set `base`, since a base such as the head would make it pass vacuously.
describe("parsePlant: cause and base (phase 4 round 5, O5-01 and O5-02)", () => {
  it("reads an error plant's cause, with and without a base", () => {
    const plant = { expect: "error", why: "w", cause: "does not resolve to a commit" };
    expect(parsePlant(JSON.stringify(plant))).toEqual(plant);
    expect(parsePlant(JSON.stringify({ ...plant, base: "refs/heads/no-such-base" }))).toEqual({ ...plant, base: "refs/heads/no-such-base" });
  });

  it("keeps a base on a fail plant", () => {
    const plant = { expect: "fail", why: "w", findings: [{ location: "a", rule: "r" }], base: "refs/heads/other" };
    expect(parsePlant(JSON.stringify(plant))).toEqual(plant);
  });

  it.each([
    { plant: { expect: "error", why: "w" }, problem: "an error plant names its cause, a non-empty string" },
    { plant: { expect: "error", why: "w", cause: "" }, problem: "an error plant names its cause, a non-empty string" },
    { plant: { expect: "error", why: "w", cause: 2 }, problem: "an error plant names its cause, a non-empty string" },
    { plant: { expect: "error", why: "w", base: "refs/heads/x" }, problem: "an error plant names its cause, a non-empty string" },
    { plant: { expect: "fail", why: "w", findings: [{ location: "a", rule: "r" }], cause: "x" }, problem: "only an error plant names a cause" },
    { plant: { expect: "pass", why: "w", cause: "x" }, problem: "only an error plant names a cause" },
    { plant: { expect: "pass", why: "w", base: "HEAD" }, problem: "a pass plant may not set base" },
    { plant: { expect: "pass", why: "w", base: "" }, problem: "a pass plant may not set base" },
    { plant: { expect: "pass", why: "w", records: [], base: "HEAD" }, problem: "a pass plant may not set base" },
  ])("rejects $plant", ({ plant, problem }) => {
    expect(parsePlant(JSON.stringify(plant))).toBe(problem);
  });
});

describe("judgePlant: error plants and their cause (phase 4 round 5, O5-01)", () => {
  const plant: Plant = { expect: "error", why: "w", cause: "does not resolve to a commit" };

  it("accepts exit 2 when a line of the error output contains the cause, not only the first", () => {
    expect(judgePlant("g", plant, run(2, [], ["g: could not run: --base x does not resolve to a commit; pass one"]))).toBeUndefined();
    expect(judgePlant("g", plant, run(2, [], ["warning: slow", "g: could not run: --base x does not resolve to a commit"]))).toBeUndefined();
  });

  it("fails exit 2 for another cause, naming the expected cause and the first error line", () => {
    expect(judgePlant("g", plant, run(2, [], ["g: could not run: spawn stryker ENOENT", "more"]))).toBe(
      'expected exit 2 (could not run) with the cause "does not resolve to a commit", got exit 2 (g: could not run: spawn stryker ENOENT)',
    );
  });

  it("does not read the cause from standard output, and names no line when the error output is empty", () => {
    expect(judgePlant("g", plant, run(2, ["g: could not run: does not resolve to a commit"], []))).toBe(
      'expected exit 2 (could not run) with the cause "does not resolve to a commit", got exit 2',
    );
  });

  it("keeps the exit problem for any exit other than 2", () => {
    expect(judgePlant("g", plant, run(1, [], ["g: could not run: does not resolve to a commit"]))).toBe("expected exit 2 (could not run), got exit 1");
  });
});

// plant.json `unlinked` (specs/006-storybook-workbench contracts/plants.md § Plant runner changes, data-model.md § Plant
// keys, research.md R-16): a list whose only value is "storybook/node_modules", for plants of storybook-build, visual
// and axe only; the plant root then has no storybook/node_modules link. Like `engine` it presents an input, not gate
// configuration.
describe("parsePlant: unlinked (006 research.md R-16)", () => {
  const error = { expect: "error", why: "w", cause: "storybook is not installed; run pnpm install" };

  it('reads unlinked ["storybook/node_modules"] on any kind of plant', () => {
    expect(parsePlant(JSON.stringify({ ...error, unlinked: ["storybook/node_modules"] }))).toEqual({ ...error, unlinked: ["storybook/node_modules"] });
    expect(parsePlant(JSON.stringify({ expect: "pass", why: "w", unlinked: ["storybook/node_modules"] }))).toEqual({ expect: "pass", why: "w", unlinked: ["storybook/node_modules"] });
  });

  it.each([
    { unlinked: ["node_modules"] },
    { unlinked: ["storybook/node_modules", "node_modules"] },
    { unlinked: ["storybook/node_modules", "storybook/node_modules"] },
    { unlinked: [] },
    { unlinked: "storybook/node_modules" },
    { unlinked: null },
    { unlinked: [1] },
  ])("rejects unlinked $unlinked", ({ unlinked }) => {
    expect(parsePlant(JSON.stringify({ ...error, unlinked }))).toBe('unlinked must be ["storybook/node_modules"]');
  });
});

describe("gateKeysProblem (006 contracts/plants.md § Plant runner changes)", () => {
  const unlinked: Plant = { expect: "error", why: "w", cause: "c", unlinked: ["storybook/node_modules"] };
  const plain: Plant = { expect: "error", why: "w", cause: "c" };

  it.each(["storybook-build", "visual", "axe"])("accepts unlinked on a plant of %s", (gate) => {
    expect(gateKeysProblem(gate, unlinked)).toBeUndefined();
  });

  it.each(["typecheck", "lint", "csp", "mutation", "plants", "storybook"])("rejects unlinked on a plant of %s, and accepts the plant without it", (gate) => {
    expect([gateKeysProblem(gate, unlinked), gateKeysProblem(gate, plain)]).toEqual(["unlinked is only for plants of storybook-build, visual and axe", undefined]);
  });
});

// 006 contracts/plants.md § Plant runner changes, data-model.md § Plant keys: `engine` (both, host, missing; visual
// plants), `baselinesOf` (visual fail plants whose tree/ holds no baseline, naming a visual pass plant holding
// baselines) and `captureAlone` (only true; visual pass plants with stories of their own).
describe("parsePlant: engine, baselinesOf and captureAlone (006 research.md R-06, R-11, R-16)", () => {
  const error = { expect: "error", why: "w", cause: "not the pinned container" };
  const fail = { expect: "fail", why: "w", findings: [{ location: "a--b/light", rule: "differs" }] };

  it("reads each key's allowed values", () => {
    for (const engine of ["both", "host", "missing"]) expect(parsePlant(JSON.stringify({ ...error, engine }))).toEqual({ ...error, engine });
    expect(parsePlant(JSON.stringify({ ...fail, baselinesOf: "pass-below-fold" }))).toEqual({ ...fail, baselinesOf: "pass-below-fold" });
    expect(parsePlant(JSON.stringify({ expect: "pass", why: "w", captureAlone: true }))).toEqual({ expect: "pass", why: "w", captureAlone: true });
  });

  it.each([
    [{ ...error, engine: "docker" }, "engine must be both, host or missing"],
    [{ ...error, engine: "" }, "engine must be both, host or missing"],
    [{ ...fail, baselinesOf: "" }, "baselinesOf must be the name of a visual pass plant"],
    [{ ...fail, baselinesOf: "../pass-x" }, "baselinesOf must be the name of a visual pass plant"],
    [{ ...fail, baselinesOf: "visual/pass-x" }, "baselinesOf must be the name of a visual pass plant"],
    [{ ...fail, baselinesOf: 1 }, "baselinesOf must be the name of a visual pass plant"],
    [{ expect: "pass", why: "w", captureAlone: false }, "captureAlone must be true"],
    [{ expect: "pass", why: "w", captureAlone: "true" }, "captureAlone must be true"],
  ])("rejects %j", (value, problem) => {
    expect(parsePlant(JSON.stringify(value))).toBe(problem);
  });
});

describe("gateKeysProblem: the visual keys", () => {
  const fail: Plant = { expect: "fail", why: "w", findings: [{ location: "a", rule: "b" }] };
  const pass: Plant = { expect: "pass", why: "w" };

  it("accepts engine on visual plants only", () => {
    expect(gateKeysProblem("visual", { ...pass, engine: "host" })).toBeUndefined();
    for (const gate of ["axe", "storybook-build", "lint"]) expect(gateKeysProblem(gate, { ...pass, engine: "host" })).toBe("engine is only for plants of visual");
  });

  it("accepts baselinesOf on visual fail plants only", () => {
    expect(gateKeysProblem("visual", { ...fail, baselinesOf: "pass-x" })).toBeUndefined();
    expect(gateKeysProblem("visual", { ...pass, baselinesOf: "pass-x" })).toBe("baselinesOf is only for visual fail plants");
    expect(gateKeysProblem("axe", { ...fail, baselinesOf: "pass-x" })).toBe("baselinesOf is only for visual fail plants");
  });

  it("accepts captureAlone on visual pass plants only", () => {
    expect(gateKeysProblem("visual", { ...pass, captureAlone: true })).toBeUndefined();
    expect(gateKeysProblem("visual", { ...fail, captureAlone: true })).toBe("captureAlone is only for visual pass plants");
    expect(gateKeysProblem("axe", { ...pass, captureAlone: true })).toBe("captureAlone is only for visual pass plants");
  });
});

describe("plantFilesProblem (006 research.md R-16)", () => {
  const fail: Plant = { expect: "fail", why: "w", findings: [{ location: "a", rule: "b" }], baselinesOf: "pass-x" };
  const pass: Plant = { expect: "pass", why: "w" };
  const holding = { plant: pass, tree: ["storybook/stories/x.stories.ts", "storybook/baselines/x--a.light.png"] };

  it("accepts a baselinesOf plant without baselines of its own, naming a visual pass plant that holds some", () => {
    expect(plantFilesProblem(fail, ["storybook/stories/x.stories.ts"], holding)).toBeUndefined();
    expect(plantFilesProblem(fail, [], holding)).toBeUndefined();
  });

  it("names a baseline in the plant's own tree/, a named plant that is missing, not a pass plant or holds no baselines", () => {
    expect(plantFilesProblem(fail, ["storybook/baselines/x--a.dark.png"], holding)).toBe("a plant with baselinesOf holds no file under storybook/baselines/ in its tree/");
    expect(plantFilesProblem(fail, [], undefined)).toBe("baselinesOf names pass-x, which is not a visual pass plant");
    expect(plantFilesProblem(fail, [], { plant: undefined, tree: [] })).toBe("baselinesOf names pass-x, which is not a visual pass plant");
    expect(plantFilesProblem(fail, [], { plant: fail, tree: holding.tree })).toBe("baselinesOf names pass-x, which is not a visual pass plant");
    expect(plantFilesProblem(fail, [], { plant: pass, tree: ["storybook/stories/x.stories.ts", "storybook/baselines"] })).toBe("baselinesOf names pass-x, which holds no baselines");
  });

  it("needs a story file of a captureAlone plant's own in tree/storybook/stories/", () => {
    const alone: Plant = { ...pass, captureAlone: true };
    const problem = "a captureAlone plant has stories of its own in tree/storybook/stories/";
    expect(plantFilesProblem(alone, ["storybook/stories/second.stories.ts"])).toBeUndefined();
    expect(plantFilesProblem(alone, [])).toBe(problem);
    expect(plantFilesProblem(alone, ["storybook/stories/render.ts", "stories/second.stories.ts", "storybook/baselines/a--b.light.png"])).toBe(problem);
  });

  it("names nothing for a plant without either key", () => {
    expect(plantFilesProblem(pass, ["storybook/baselines/a--b.light.png"])).toBeUndefined();
    expect(plantFilesProblem({ ...fail, baselinesOf: undefined } as Plant, ["storybook/baselines/a--b.light.png"])).toBeUndefined();
  });
});
