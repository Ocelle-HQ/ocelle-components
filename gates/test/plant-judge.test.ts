import { describe, expect, it } from "vitest";
import { judgePlant, parsePlant } from "../lib/plant-judge.ts";
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
