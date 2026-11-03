import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { judgePlant, parsePlant, plantArgs, plants } from "../bin/plants.ts";
import type { Plant, PlantRun, PlantTools } from "../bin/plants.ts";
import type { Context, Io } from "../lib/cli.ts";
import type { Gate } from "../lib/registry.ts";

// The plant job's verdicts (FR-025, research.md R-10, contracts/plants.md last paragraph) on recorded gate results:
// a fail plant needs exit 1 with exactly its expected findings, a pass plant exit 0 with no finding (and its
// expected records), a breaking plant exit 2; a gate without a fail, pass or breaking plant, an invalid plant.json,
// or a plant carrying configuration fails the job, and so does the registry check. The repository is in memory;
// gate runs are recorded results. The tests assert the job's exit code and output.
const registryText = readFileSync(new URL("fixtures/registry/gates.json", import.meta.url), "utf8");
const workflow = readFileSync(new URL("fixtures/registry/ci.yml", import.meta.url), "utf8");
const gateIds = (JSON.parse(registryText) as { id: string }[]).map((gate) => gate.id);

const failPlant = (location: string, rule: string, message?: string): string =>
  JSON.stringify({ expect: "fail", why: "a planted defect", findings: [{ location, rule, ...(message === undefined ? {} : { message }) }] });
const passPlant = JSON.stringify({ expect: "pass", why: "a near-miss" });
const errorPlant = JSON.stringify({ expect: "error", why: "a breaking input", cause: "could not run: broken input" });

/** A repository in memory: every gate with a fail, a pass and a breaking plant, and two registry plants. */
function world(): Map<string, string> {
  const files = new Map<string, string>([
    ["gates/gates.json", registryText],
    [".github/workflows/ci.yml", workflow],
  ]);
  for (const id of gateIds) {
    files.set(`gates/plants/${id}/fail-basic/plant.json`, failPlant("packages/tokens/src/x.ts:1", "rule-a", "planted"));
    files.set(`gates/plants/${id}/fail-basic/tree/packages/tokens/src/x.ts`, "x");
    files.set(`gates/plants/${id}/pass-basic/plant.json`, passPlant);
    files.set(`gates/plants/${id}/error-basic/plant.json`, errorPlant);
  }
  const withoutCsp = (JSON.parse(registryText) as { id: string }[]).filter((gate) => gate.id !== "csp");
  files.set("gates/plants/plants/missing-entry/plant.json", failPlant("gates.json", "no-registry-entry", "csp"));
  files.set("gates/plants/plants/missing-entry/gates.json", JSON.stringify(withoutCsp));
  files.set("gates/plants/plants/missing-entry/ci.yml", workflow);
  files.set("gates/plants/plants/matching/plant.json", passPlant);
  files.set("gates/plants/plants/matching/gates.json", registryText);
  files.set("gates/plants/plants/matching/ci.yml", workflow);
  return files;
}

/** The recorded run of each plant by its directory; by default each gate does what its plant expects. */
function recorded(gate: Gate, plant: string): PlantRun {
  if (plant.includes("/fail-")) {
    return {
      exit: 1,
      stdout: [`packages/tokens/src/x.ts:1: ${gate.id}: rule-a: a planted defect`, `${gate.id}: 1 finding in 1 file`],
      stderr: [],
    };
  }
  if (plant.includes("/pass-")) return { exit: 0, stdout: [`${gate.id}: 1 file checked, no finding`], stderr: [] };
  return { exit: 2, stdout: [], stderr: [`${gate.id}: could not run: broken input`] };
}

function job(
  files: Map<string, string>,
  runs: Readonly<Record<string, PlantRun>> = {},
): { done: Promise<number>; out: string[]; err: string[]; ran: string[]; specs: Map<string, Plant> } {
  const out: string[] = [];
  const err: string[] = [];
  const ran: string[] = [];
  const specs = new Map<string, Plant>();
  const below = (dir: string): string[] =>
    [...files.keys()].filter((path) => path.startsWith(`${dir}/`)).map((path) => path.slice(dir.length + 1));
  const tools: PlantTools = {
    read: (path) => Promise.resolve(files.get(path)),
    dirs: (path) => Promise.resolve([...new Set(below(path).filter((p) => p.includes("/")).map((p) => p.split("/")[0] ?? ""))].sort()),
    files: (path) => Promise.resolve(below(path).sort()),
    runPlant: (gate, plant, spec) => {
      ran.push(`${gate.id} ${plant}`);
      specs.set(plant, spec);
      return Promise.resolve(runs[plant] ?? recorded(gate, plant));
    },
  };
  const io: Io = { cwd: "/work/repo", env: {}, out: (l) => out.push(l), err: (l) => err.push(l) };
  const context: Context = { root: "/work/repo", toolCwd: "/work/repo", args: [] };
  return { done: plants(context, tools, io), out, err, ran, specs };
}

async function result(ran: ReturnType<typeof job>): Promise<{ code: number; out: string[]; err: string[] }> {
  return { code: await ran.done, out: ran.out, err: ran.err };
}

describe("plants (the job)", () => {
  it("exits 0 when every gate does what each of its plants expects and the registry matches", async () => {
    const ran = job(world());
    expect(await result(ran)).toEqual({
      code: 0,
      out: ["plants: 35 plants of 11 gates and the registry judged, every plant as expected"],
      err: [],
    });
    expect(ran.ran).toHaveLength(33);
    expect(ran.ran).toContain("typecheck gates/plants/typecheck/fail-basic");
    expect(ran.ran).toContain("signoff gates/plants/signoff/error-basic");
  });

  it("fails when a gate passes its fail plant", async () => {
    const ran = job(world(), { "gates/plants/lint/fail-basic": { exit: 0, stdout: ["lint: 1 file checked, no finding"], stderr: [] } });
    expect(await result(ran)).toEqual({
      code: 1,
      out: [
        "gates/plants/lint/fail-basic: plants: not-caught: expected exit 1 with the plant's 1 finding, got exit 0",
        "plants: 1 problem in 35 plants",
      ],
      err: [],
    });
  });

  it("fails when a gate breaks on its fail plant, naming its cause", async () => {
    const ran = job(world(), { "gates/plants/csp/fail-basic": { exit: 2, stdout: [], stderr: ["csp: could not run: boom"] } });
    expect((await result(ran)).out[0]).toBe(
      "gates/plants/csp/fail-basic: plants: not-caught: expected exit 1 with the plant's 1 finding, got exit 2 (csp: could not run: boom)",
    );
  });

  it("fails when a gate breaks on its breaking plant for another cause, naming the expected cause (phase 4 round 5, O5-01)", async () => {
    const ran = job(world(), { "gates/plants/csp/error-basic": { exit: 2, stdout: [], stderr: ["csp: could not run: spawn node ENOENT"] } });
    expect(await result(ran)).toEqual({
      code: 1,
      out: [
        'gates/plants/csp/error-basic: plants: not-reported-broken: expected exit 2 (could not run) with the cause "could not run: broken input", ' +
          "got exit 2 (csp: could not run: spawn node ENOENT)",
        "plants: 1 problem in 35 plants",
      ],
      err: [],
    });
  });

  it("rejects a pass plant that sets base and a breaking plant without a cause as invalid plants (phase 4 round 5, O5-01 and O5-02)", async () => {
    const files = world();
    files.set("gates/plants/mutation/pass-basic/plant.json", JSON.stringify({ expect: "pass", why: "a near-miss", base: "HEAD" }));
    files.set("gates/plants/lint/error-basic/plant.json", JSON.stringify({ expect: "error", why: "a breaking input" }));
    expect(await result(job(files))).toEqual({
      code: 1,
      out: [
        "gates/plants/lint/error-basic/plant.json: plants: invalid-plant: an error plant names its cause, a non-empty string",
        "gates/plants/lint: plants: missing-plant: gate lint has no error plant",
        "gates/plants/mutation/pass-basic/plant.json: plants: invalid-plant: a pass plant may not set base",
        "gates/plants/mutation: plants: missing-plant: gate mutation has no pass plant",
        "plants: 4 problems in 35 plants",
      ],
      err: [],
    });
  });

  it("fails when a gate reports other findings than its fail plant expects", async () => {
    const run: PlantRun = {
      exit: 1,
      stdout: ["packages/tokens/src/x.ts:2: prefix: rule-a: planted", "packages/tokens/src/y.ts:1: prefix: rule-b: planted", "prefix: 2 findings"],
      stderr: [],
    };
    const ran = job(world(), { "gates/plants/prefix/fail-basic": run });
    expect(await result(ran)).toEqual({
      code: 1,
      out: [
        "gates/plants/prefix/fail-basic: plants: not-caught: findings differ: missing packages/tokens/src/x.ts:1 rule-a; " +
          "unexpected packages/tokens/src/x.ts:2 rule-a, packages/tokens/src/y.ts:1 rule-b",
        "plants: 1 problem in 35 plants",
      ],
      err: [],
    });
  });

  it("fails when a finding lacks the message its plant expects", async () => {
    const run: PlantRun = { exit: 1, stdout: ["packages/tokens/src/x.ts:1: pins: rule-a: something else", "pins: 1 finding"], stderr: [] };
    const ran = job(world(), { "gates/plants/pins/fail-basic": run });
    expect((await result(ran)).out[0]).toBe(
      'gates/plants/pins/fail-basic: plants: not-caught: finding packages/tokens/src/x.ts:1 rule-a lacks "planted"',
    );
  });

  it("fails when a gate rejects its pass plant", async () => {
    const run: PlantRun = { exit: 1, stdout: ["packages/a.ts:3: typecheck: TS7006: x", "typecheck: 1 finding in 1 file"], stderr: [] };
    const ran = job(world(), { "gates/plants/typecheck/pass-basic": run });
    expect(await result(ran)).toEqual({
      code: 1,
      out: [
        "gates/plants/typecheck/pass-basic: plants: not-accepted: expected exit 0 with no finding, got exit 1 (packages/a.ts:3 TS7006)",
        "plants: 1 problem in 35 plants",
      ],
      err: [],
    });
  });

  it("fails when a gate does not report its breaking plant as could not run", async () => {
    const ran = job(world(), { "gates/plants/signoff/error-basic": { exit: 1, stdout: ["x: signoff: no-signoff: m", "s"], stderr: [] } });
    expect((await result(ran)).out).toEqual([
      "gates/plants/signoff/error-basic: plants: not-reported-broken: expected exit 2 (could not run), got exit 1",
      "plants: 1 problem in 35 plants",
    ]);
  });

  it("fails when a gate has no fail, pass or breaking plant", async () => {
    const files = world();
    files.delete("gates/plants/csp/error-basic/plant.json");
    for (const path of [...files.keys()]) if (path.startsWith("gates/plants/style-lint/")) files.delete(path);
    expect(await result(job(files))).toEqual({
      code: 1,
      out: [
        "gates/plants/style-lint: plants: missing-plant: gate style-lint has no fail plant",
        "gates/plants/style-lint: plants: missing-plant: gate style-lint has no pass plant",
        "gates/plants/style-lint: plants: missing-plant: gate style-lint has no error plant",
        "gates/plants/csp: plants: missing-plant: gate csp has no error plant",
        "plants: 4 problems in 31 plants",
      ],
      err: [],
    });
  });

  it("fails when the registry has no fail or pass plant", async () => {
    const files = world();
    files.delete("gates/plants/plants/matching/plant.json");
    expect((await result(job(files))).out).toEqual([
      "gates/plants/plants: plants: missing-plant: the registry check has no pass plant",
      "plants: 1 problem in 34 plants",
    ]);
  });

  it("fails on a plant without a valid plant.json, and does not run it", async () => {
    const files = world();
    files.set("gates/plants/lint/fail-odd/plant.json", JSON.stringify({ expect: "fail", why: "no findings" }));
    files.set("gates/plants/lint/fail-none/tree/packages/tokens/src/x.ts", "x");
    const ran = job(files);
    expect(await result(ran)).toEqual({
      code: 1,
      out: [
        "gates/plants/lint/fail-none/plant.json: plants: invalid-plant: plant.json is missing",
        "gates/plants/lint/fail-odd/plant.json: plants: invalid-plant: a fail plant lists its findings",
        "plants: 2 problems in 37 plants",
      ],
      err: [],
    });
    expect(ran.ran.filter((line) => line.includes("fail-odd") || line.includes("fail-none"))).toEqual([]);
  });

  it("fails on a plant that carries gate configuration, and does not run it", async () => {
    const files = world();
    files.set("gates/plants/lint/fail-config/plant.json", failPlant("a.ts:1", "x"));
    files.set("gates/plants/lint/fail-config/tree/eslint.config.ts", "export default [];");
    files.set("gates/plants/lint/fail-config/tree/packages/tokens/tsconfig.json", "{}");
    const ran = job(files);
    expect(await result(ran)).toEqual({
      code: 1,
      out: [
        "gates/plants/lint/fail-config: plants: carries-configuration: " +
          "plant carries gate configuration: tree/eslint.config.ts, tree/packages/tokens/tsconfig.json",
        "plants: 1 problem in 36 plants",
      ],
      err: [],
    });
    expect(ran.ran.filter((line) => line.includes("fail-config"))).toEqual([]);
  });

  it("fails when the repository's registry, CI jobs and FR-020 list differ, and on plants of an unknown gate", async () => {
    const files = world();
    files.set("gates/gates.json", JSON.stringify((JSON.parse(registryText) as { id: string }[]).filter((gate) => gate.id !== "pins")));
    files.set("gates/plants/extra/pass-x/plant.json", passPlant);
    expect(await result(job(files))).toEqual({
      code: 1,
      out: [
        "gates/gates.json: plants: no-registry-entry: gate pins has no registry entry",
        "gates/plants/extra: plants: unknown-gate: plants of extra, which has no registry entry",
        "gates/plants/pins: plants: unknown-gate: plants of pins, which has no registry entry",
        "plants: 3 problems in 32 plants",
      ],
      err: [],
    });
  });

  it("fails when a registry plant is not caught", async () => {
    const files = world();
    files.set("gates/plants/plants/missing-entry/gates.json", registryText);
    expect((await result(job(files))).out).toEqual([
      "gates/plants/plants/missing-entry: plants: not-caught: expected exit 1 with the plant's 1 finding, got exit 0",
      "plants: 1 problem in 35 plants",
    ]);
  });

  it("judges a commit plant's findings by record number", async () => {
    const files = world();
    files.set("gates/plants/signoff/fail-basic/plant.json", failPlant("commit:2", "no-signoff"));
    const hashes = ["a".repeat(40), "b".repeat(40)];
    const run: PlantRun = { exit: 1, stdout: [`${"b".repeat(40)}: signoff: no-signoff: m`, "signoff: 1 finding"], stderr: [], commits: hashes };
    expect(await result(job(files, { "gates/plants/signoff/fail-basic": run }))).toEqual({
      code: 0,
      out: ["plants: 35 plants of 11 gates and the registry judged, every plant as expected"],
      err: [],
    });
  });

  it("hands each plant's parsed plant.json to the runner, so a mutation plant's base reaches it (review round 1, R1-11)", async () => {
    const files = world();
    const spec = { expect: "error", why: "an unresolvable base", cause: "could not run: broken input", base: "refs/heads/no-such-base" };
    files.set("gates/plants/mutation/error-basic/plant.json", JSON.stringify(spec));
    const ran = job(files);
    expect((await result(ran)).code).toBe(0);
    expect(ran.specs.get("gates/plants/mutation/error-basic")).toEqual(spec);
    expect(ran.specs.get("gates/plants/lint/pass-basic")).toEqual({ expect: "pass", why: "a near-miss" });
  });

  it.each([
    { path: "gates/gates.json", cause: "plants: could not run: gates/gates.json is missing; restore it from git" },
    { path: ".github/workflows/ci.yml", cause: "plants: could not run: .github/workflows/ci.yml is missing; restore it from git" },
  ])("exits 2 when $path is missing", async ({ path, cause }) => {
    const files = world();
    files.delete(path);
    expect(await result(job(files))).toEqual({ code: 2, out: [], err: [cause] });
  });

  it("exits 2 when gates/gates.json is not a valid registry", async () => {
    const files = world();
    files.set("gates/gates.json", "{}");
    expect(await result(job(files))).toEqual({
      code: 2,
      out: [],
      err: ["plants: could not run: gates.json is not a list of gates; fix gates/gates.json"],
    });
  });
});

describe("judgePlant", () => {
  const fail: Plant = { expect: "fail", why: "x", findings: [{ location: "a.ts:1", rule: "r" }, { location: "b.ts", rule: "s", message: "needle" }] };
  const caught: PlantRun = { exit: 1, stdout: ["a.ts:1: g: r: m", "b.ts: g: s: a needle here", "g: 2 findings"], stderr: [] };

  const uncaught = "expected exit 1 with the plant's 2 findings, got exit 0";

  it("accepts a fail plant caught with exactly its findings, in any order (and not one the gate passes)", () => {
    const reordered: PlantRun = { ...caught, stdout: [caught.stdout[1] ?? "", caught.stdout[0] ?? ""] };
    const passed: PlantRun = { exit: 0, stdout: ["g: ok"], stderr: [] };
    expect([judgePlant("g", fail, caught), judgePlant("g", fail, reordered), judgePlant("g", fail, passed)]).toEqual([
      undefined,
      undefined,
      uncaught,
    ]);
  });

  it("compares findings as a set of location and rule (and reports a missing one)", () => {
    const twice: PlantRun = { ...caught, stdout: [...caught.stdout, "a.ts:1: g: r: again"] };
    const missing: PlantRun = { ...caught, stdout: ["b.ts: g: s: needle"] };
    expect([judgePlant("g", fail, twice), judgePlant("g", fail, missing)]).toEqual([undefined, "findings differ: missing a.ts:1 r"]);
  });

  it("does not read another gate's lines as findings", () => {
    expect(judgePlant("g", fail, { ...caught, stdout: ["a.ts:1: other: r: m", "b.ts: g: s: needle"] })).toBe(
      "findings differ: missing a.ts:1 r",
    );
  });

  it("accepts a pass plant at exit 0 with no finding, and checks its records when it lists them", () => {
    const records: Plant = { expect: "pass", why: "x", records: [{ location: "a.ts:3", mutator: "StringLiteral", reason: "equivalent" }] };
    const run: PlantRun = { exit: 0, stdout: ["a.ts:3: mutation: record: StringLiteral: equivalent", "mutation: ok"], stderr: [] };
    expect(judgePlant("mutation", { expect: "pass", why: "x" }, run)).toBeUndefined();
    expect(judgePlant("mutation", records, run)).toBeUndefined();
    expect(judgePlant("mutation", records, { ...run, stdout: ["a.ts:4: mutation: record: StringLiteral: equivalent", "ok"] })).toBe(
      'records differ: missing a.ts:3 StringLiteral "equivalent"; unexpected a.ts:4 StringLiteral "equivalent"',
    );
    expect(judgePlant("mutation", records, { ...run, stdout: ["ok"] })).toBe('records differ: missing a.ts:3 StringLiteral "equivalent"');
  });

  it("does not count a record as a finding", () => {
    const run: PlantRun = { exit: 1, stdout: ["a.ts:3: mutation: record: all: r", "mutation: 0 findings"], stderr: [] };
    expect(judgePlant("mutation", { expect: "fail", why: "x", findings: [{ location: "a.ts:1", rule: "r" }] }, run)).toBe(
      "findings differ: missing a.ts:1 r",
    );
  });

  it("rejects a pass plant with a finding at exit 0", () => {
    expect(judgePlant("g", { expect: "pass", why: "x" }, { exit: 0, stdout: ["a.ts:1: g: r: m"], stderr: [] })).toBe(
      "expected exit 0 with no finding, got exit 0 (a.ts:1 r)",
    );
  });

  it("names the cause of an unexpected exit 2 on a pass plant", () => {
    expect(judgePlant("g", { expect: "pass", why: "x" }, { exit: 2, stdout: [], stderr: ["g: could not run: x", "more"] })).toBe(
      "expected exit 0 with no finding, got exit 2 (g: could not run: x)",
    );
  });

  it("accepts an error plant at exit 2 only", () => {
    const plant: Plant = { expect: "error", why: "x" };
    expect(judgePlant("g", plant, { exit: 2, stdout: [], stderr: ["g: could not run"] })).toBeUndefined();
    expect(judgePlant("g", plant, { exit: 0, stdout: [], stderr: [] })).toBe("expected exit 2 (could not run), got exit 0");
    expect(judgePlant("g", plant, { exit: null, stdout: [], stderr: [] })).toBe("expected exit 2 (could not run), got exit null");
  });

  it("maps a commit hash to its record number, and keeps a hash of no record", () => {
    const plant: Plant = { expect: "fail", why: "x", findings: [{ location: "commit:1", rule: "no-signoff" }] };
    const run: PlantRun = { exit: 1, stdout: [`${"c".repeat(40)}: signoff: no-signoff: m`], stderr: [], commits: ["d".repeat(40)] };
    expect(judgePlant("signoff", plant, run)).toBe(`findings differ: missing commit:1 no-signoff; unexpected ${"c".repeat(40)} no-signoff`);
  });
});

describe("parsePlant", () => {
  it("reads a fail, a pass and an error plant", () => {
    const fail = { expect: "fail", why: "w", findings: [{ location: "a.ts:1", rule: "r", message: "m" }] };
    expect(parsePlant(JSON.stringify(fail))).toEqual(fail);
    const pass = { expect: "pass", why: "w", records: [{ location: "a.ts:1", mutator: "all", reason: "r" }] };
    expect(parsePlant(JSON.stringify(pass))).toEqual(pass);
    expect(parsePlant(JSON.stringify({ expect: "error", why: "w", cause: "c" }))).toEqual({ expect: "error", why: "w", cause: "c" });
  });

  it("reads the base a plant presents to its gate instead of the base commit (review round 1, R1-11)", () => {
    const plant = { expect: "error", why: "w", cause: "c", base: "refs/heads/no-such-base" };
    expect(parsePlant(JSON.stringify(plant))).toEqual(plant);
    expect(parsePlant(JSON.stringify({ ...plant, base: "" }))).toBe("base must be a non-empty string");
    expect(parsePlant(JSON.stringify({ ...plant, base: 1 }))).toBe("base must be a non-empty string");
  });

  it.each([
    { plant: "{", problem: /^plant\.json is not valid JSON/ },
    { plant: "[]", problem: /^plant\.json is not an object$/ },
    { plant: "null", problem: /^plant\.json is not an object$/ },
    { plant: { expect: "maybe", why: "w" }, problem: /^expect must be fail, pass or error$/ },
    { plant: { expect: "pass" }, problem: /^why must be a non-empty string$/ },
    { plant: { expect: "pass", why: " " }, problem: /^why must be a non-empty string$/ },
    { plant: { expect: "fail", why: "w" }, problem: /^a fail plant lists its findings$/ },
    { plant: { expect: "fail", why: "w", findings: [] }, problem: /^a fail plant lists its findings$/ },
    { plant: { expect: "fail", why: "w", findings: [{ location: "a" }] }, problem: /^findings\[0\] needs a location and a rule$/ },
    { plant: { expect: "fail", why: "w", findings: [{ location: "a", rule: "r", message: 1 }] }, problem: /^findings\[0\]\.message must be a string$/ },
    { plant: { expect: "pass", why: "w", findings: [{ location: "a", rule: "r" }] }, problem: /^only a fail plant lists findings$/ },
    { plant: { expect: "error", why: "w", cause: "c", records: [] }, problem: /^only a pass plant lists records$/ },
    { plant: { expect: "pass", why: "w", records: {} }, problem: /^records must be a list$/ },
    { plant: { expect: "pass", why: "w", records: [{ location: "a", mutator: "m" }] }, problem: /^records\[0\] needs a location, a mutator and a reason$/ },
    { plant: { expect: "pass", why: "w", extra: 1 }, problem: /^unknown key extra$/ },
  ])("rejects $plant", ({ plant, problem }) => {
    const text = typeof plant === "string" ? plant : JSON.stringify(plant);
    expect(parsePlant(text)).toMatch(problem);
  });
});

describe("plantArgs", () => {
  it("splits the command at spaces and replaces each placeholder in its argument", () => {
    expect(plantArgs("node gates/bin/signoff.ts  --root {root} --range {base}..HEAD", { root: "/tmp/a b", base: "abc" })).toEqual([
      "node",
      "gates/bin/signoff.ts",
      "--root",
      "/tmp/a b",
      "--range",
      "abc..HEAD",
    ]);
    expect(plantArgs("node gates/bin/pins.ts --plant {plant}", { plant: "/p" })).toEqual(["node", "gates/bin/pins.ts", "--plant", "/p"]);
  });

  it("rejects a placeholder the plant job does not set", () => {
    expect(() => plantArgs("node x.ts --base {base}", { root: "/r" })).toThrow("plantCommand uses {base}, which this plant does not set");
  });
});
