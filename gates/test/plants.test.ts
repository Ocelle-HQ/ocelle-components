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
const axeDelta = JSON.stringify({ exceptions: "repository" });

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
  // Every axe plant root carries the repository's exceptions (006 research.md R-16).
  for (const name of ["fail-basic", "pass-basic", "error-basic"]) files.set(`gates/plants/axe/${name}/delta.json`, axeDelta);
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
      out: ["plants: 53 plants of 17 gates and the registry judged, every plant as expected"],
      err: [],
    });
    expect(ran.ran).toHaveLength(51);
    expect(ran.ran).toContain("typecheck gates/plants/typecheck/fail-basic");
    expect(ran.ran).toContain("signoff gates/plants/signoff/error-basic");
  });

  it("fails when a gate passes its fail plant", async () => {
    const ran = job(world(), { "gates/plants/lint/fail-basic": { exit: 0, stdout: ["lint: 1 file checked, no finding"], stderr: [] } });
    expect(await result(ran)).toEqual({
      code: 1,
      out: [
        "gates/plants/lint/fail-basic: plants: not-caught: expected exit 1 with the plant's 1 finding, got exit 0",
        "plants: 1 problem in 53 plants",
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
        "plants: 1 problem in 53 plants",
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
        "plants: 4 problems in 53 plants",
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
        "plants: 1 problem in 53 plants",
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
        "plants: 1 problem in 53 plants",
      ],
      err: [],
    });
  });

  it("fails when a gate does not report its breaking plant as could not run", async () => {
    const ran = job(world(), { "gates/plants/signoff/error-basic": { exit: 1, stdout: ["x: signoff: no-signoff: m", "s"], stderr: [] } });
    expect((await result(ran)).out).toEqual([
      "gates/plants/signoff/error-basic: plants: not-reported-broken: expected exit 2 (could not run), got exit 1",
      "plants: 1 problem in 53 plants",
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
        "plants: 4 problems in 49 plants",
      ],
      err: [],
    });
  });

  it("fails when the registry has no fail or pass plant", async () => {
    const files = world();
    files.delete("gates/plants/plants/matching/plant.json");
    expect((await result(job(files))).out).toEqual([
      "gates/plants/plants: plants: missing-plant: the registry check has no pass plant",
      "plants: 1 problem in 52 plants",
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
        "plants: 2 problems in 55 plants",
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
        "plants: 1 problem in 54 plants",
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
        "plants: 3 problems in 50 plants",
      ],
      err: [],
    });
  });

  it("fails when a registry plant is not caught", async () => {
    const files = world();
    files.set("gates/plants/plants/missing-entry/gates.json", registryText);
    expect((await result(job(files))).out).toEqual([
      "gates/plants/plants/missing-entry: plants: not-caught: expected exit 1 with the plant's 1 finding, got exit 0",
      "plants: 1 problem in 53 plants",
    ]);
  });

  it("judges a commit plant's findings by record number", async () => {
    const files = world();
    files.set("gates/plants/signoff/fail-basic/plant.json", failPlant("commit:2", "no-signoff"));
    const hashes = ["a".repeat(40), "b".repeat(40)];
    const run: PlantRun = { exit: 1, stdout: [`${"b".repeat(40)}: signoff: no-signoff: m`, "signoff: 1 finding"], stderr: [], commits: hashes };
    expect(await result(job(files, { "gates/plants/signoff/fail-basic": run }))).toEqual({
      code: 0,
      out: ["plants: 53 plants of 17 gates and the registry judged, every plant as expected"],
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

// 006 contracts/plants.md § Plant runner changes (research.md R-07, R-16): the plants of storybook-build, visual and
// axe each build the Storybook (through the storybook/node_modules every plant root shares), so they run one at a
// time, after every other plant; the other gates' plants still run together.
describe("plants: Storybook plants run one at a time, after the others (006 research.md R-07)", () => {
  const storybookGates = ["storybook-build", "visual", "axe"];

  /** The job on `files` with gate runs that last a few ticks, logging when each starts and ends. */
  async function timed(files: Map<string, string>): Promise<{ code: number; log: string[]; out: string[] }> {
    const log: string[] = [];
    const out: string[] = [];
    const below = (dir: string): string[] => [...files.keys()].filter((path) => path.startsWith(`${dir}/`)).map((path) => path.slice(dir.length + 1));
    const tools: PlantTools = {
      read: (path) => Promise.resolve(files.get(path)),
      dirs: (path) => Promise.resolve([...new Set(below(path).filter((p) => p.includes("/")).map((p) => p.split("/")[0] ?? ""))].sort()),
      files: (path) => Promise.resolve(below(path).sort()),
      runPlant: async (gate, plant) => {
        log.push(`start ${plant}`);
        for (let tick = 0; tick < 3; tick += 1) await new Promise((resolve) => setTimeout(resolve, 0));
        log.push(`end ${plant}`);
        return recorded(gate, plant);
      },
    };
    const io: Io = { cwd: "/work/repo", env: {}, out: (l) => out.push(l), err: (l) => out.push(l) };
    const context: Context = { root: "/work/repo", toolCwd: "/work/repo", args: [] };
    return { code: await plants(context, tools, io), log, out };
  }

  /**
   * The repository in memory with visual and axe registered beside storybook-build, each with three plants; visual and
   * axe come right after lint in the registry, before gates whose plants run together, storybook-build last.
   */
  function storybookWorld(): Map<string, string> {
    const files = world();
    // The registry fixture registers visual and axe last (006 FR-017); here they move right after lint.
    const registry = (JSON.parse(registryText) as Record<string, string>[]).filter((gate) => gate.id !== "visual" && gate.id !== "axe");
    const base = registry.find((gate) => gate.id === "storybook-build") ?? {};
    const extra = ["visual", "axe"].map((id) => ({ ...base, id, check: id, command: `pnpm run gate:${id}`, plantCommand: `node gates/bin/${id}.ts --root {root}` }));
    files.set("gates/gates.json", JSON.stringify([...registry.slice(0, 2), ...extra, ...registry.slice(2)]));
    for (const id of ["visual", "axe"]) {
      files.set(`gates/plants/${id}/fail-basic/plant.json`, failPlant("packages/tokens/src/x.ts:1", "rule-a", "planted"));
      files.set(`gates/plants/${id}/pass-basic/plant.json`, passPlant);
      files.set(`gates/plants/${id}/error-basic/plant.json`, errorPlant);
    }
    return files;
  }

  it("starts no Storybook plant before every other plant has ended, runs them in registry and name order, never two at once", async () => {
    const { log } = await timed(storybookWorld());
    const isStorybook = (line: string): boolean => storybookGates.some((id) => line.includes(`gates/plants/${id}/`));
    const others = log.filter((line) => !isStorybook(line));
    expect(others).toHaveLength(2 * 42);
    expect(log.slice(0, others.length)).toEqual(others);
    expect(log.slice(others.length)).toEqual(
      ["visual", "axe", "storybook-build"].flatMap((id) => ["error-basic", "fail-basic", "pass-basic"].flatMap((name) => [`start gates/plants/${id}/${name}`, `end gates/plants/${id}/${name}`])),
    );
  });

  it("still runs the other gates' plants together, a gate's own plants among them", async () => {
    const { log } = await timed(storybookWorld());
    expect(log.slice(0, 2).map((line) => line.split(" ")[0])).toEqual(["start", "start"]);
    const at = (line: string): number => log.indexOf(line);
    expect(at("start gates/plants/csp/fail-basic")).toBeLessThan(at("end gates/plants/csp/error-basic"));
    expect(at("start gates/plants/csp/error-basic")).toBeGreaterThanOrEqual(0);
  });

  it("keeps the problem lines in registry order, a Storybook gate's among the others", async () => {
    const files = world();
    files.set("gates/plants/storybook-build/fail-basic/plant.json", "{");
    files.set("gates/plants/lint/fail-basic/plant.json", "{");
    files.set("gates/plants/brand-rules/fail-basic/plant.json", "{");
    const { out } = await timed(files);
    expect(out.map((line) => line.split(":")[0])).toEqual([
      "gates/plants/lint/fail-basic/plant.json",
      "gates/plants/lint",
      "gates/plants/brand-rules/fail-basic/plant.json",
      "gates/plants/brand-rules",
      "gates/plants/storybook-build/fail-basic/plant.json",
      "gates/plants/storybook-build",
      "plants",
    ]);
  });
});

// plant.json `unlinked` is valid only for plants of storybook-build, visual and axe (006 contracts/plants.md § Plant
// runner changes): on another gate's plant the plant is invalid and does not run.
describe("plants: the unlinked key (006 research.md R-16)", () => {
  it("runs a storybook-build plant with unlinked, and rejects a lint plant with it without running it", async () => {
    const files = world();
    const spec = { expect: "error", why: "a breaking input", cause: "could not run: broken input", unlinked: ["storybook/node_modules"] };
    files.set("gates/plants/storybook-build/error-basic/plant.json", JSON.stringify(spec));
    files.set("gates/plants/lint/error-basic/plant.json", JSON.stringify(spec));
    const ran = job(files);
    expect(await result(ran)).toEqual({
      code: 1,
      out: [
        "gates/plants/lint/error-basic/plant.json: plants: invalid-plant: unlinked is only for plants of storybook-build, visual and axe",
        "gates/plants/lint: plants: missing-plant: gate lint has no error plant",
        "plants: 2 problems in 53 plants",
      ],
      err: [],
    });
    expect(ran.specs.get("gates/plants/storybook-build/error-basic")).toEqual(spec);
    expect(ran.ran).not.toContain("lint gates/plants/lint/error-basic");
  });

  it("rejects an unlinked value other than storybook/node_modules", async () => {
    const files = world();
    files.set("gates/plants/storybook-build/error-basic/plant.json", JSON.stringify({ expect: "error", why: "w", cause: "c", unlinked: ["node_modules"] }));
    expect((await result(job(files))).out[0]).toBe('gates/plants/storybook-build/error-basic/plant.json: plants: invalid-plant: unlinked must be ["storybook/node_modules"]');
  });
});

// 006 contracts/plants.md § Plant runner changes, research.md R-16 and plan decision 14 (phase 4 review round 1,
// R1-01): every axe plant root holds the repository's stories and carries their exceptions, so an axe plant whose
// delta.json is missing, does not set `exceptions: "repository"` or is not a valid delta is invalid and does not run;
// the key on a plant of another gate is not refused.
describe("plants: an axe plant carries the repository's exceptions (006 research.md R-16)", () => {
  const r16 = "an axe plant root holds the repository's stories and carries their exceptions";

  it("rejects an axe plant with no delta.json or one without exceptions, without running it", async () => {
    const files = world();
    files.delete("gates/plants/axe/error-basic/delta.json");
    files.set("gates/plants/axe/fail-basic/delta.json", JSON.stringify({ baselines: [] }));
    const ran = job(files);
    expect(await result(ran)).toEqual({
      code: 1,
      out: [
        `gates/plants/axe/error-basic/plant.json: plants: invalid-plant: ${r16}`,
        `gates/plants/axe/fail-basic/plant.json: plants: invalid-plant: ${r16}`,
        "gates/plants/axe: plants: missing-plant: gate axe has no fail plant",
        "gates/plants/axe: plants: missing-plant: gate axe has no error plant",
        "plants: 4 problems in 53 plants",
      ],
      err: [],
    });
    expect(ran.ran.filter((plant) => plant.startsWith("axe "))).toEqual(["axe gates/plants/axe/pass-basic"]);
  });

  it("rejects an axe plant whose delta.json is not a valid delta, naming the problem", async () => {
    const files = world();
    files.set("gates/plants/axe/error-basic/delta.json", JSON.stringify({ exceptions: "all" }));
    files.set("gates/plants/axe/fail-basic/delta.json", JSON.stringify({ exception: "repository" }));
    const ran = job(files);
    expect((await result(ran)).out).toEqual([
      'gates/plants/axe/error-basic/plant.json: plants: invalid-plant: delta.json: exceptions must be "repository"',
      "gates/plants/axe/fail-basic/plant.json: plants: invalid-plant: delta.json: unknown key exception",
      "gates/plants/axe: plants: missing-plant: gate axe has no fail plant",
      "gates/plants/axe: plants: missing-plant: gate axe has no error plant",
      "plants: 4 problems in 53 plants",
    ]);
    expect(ran.ran.filter((plant) => plant.startsWith("axe "))).toEqual(["axe gates/plants/axe/pass-basic"]);
  });

  it("does not refuse exceptions \"repository\" on a plant of another gate", async () => {
    const files = world();
    files.set("gates/plants/visual/pass-basic/delta.json", axeDelta);
    files.set("gates/plants/storybook-build/fail-basic/delta.json", axeDelta);
    files.set("gates/plants/lint/error-basic/delta.json", axeDelta);
    const ran = job(files);
    expect(await result(ran)).toEqual({ code: 0, out: ["plants: 53 plants of 17 gates and the registry judged, every plant as expected"], err: [] });
    expect(ran.ran).toEqual(expect.arrayContaining(["visual gates/plants/visual/pass-basic", "storybook-build gates/plants/storybook-build/fail-basic", "lint gates/plants/lint/error-basic"]));
  });
});

// 006 contracts/plants.md § Plant runner changes and research.md R-06, R-07, R-16: the visual plants' keys (`engine`,
// `baselinesOf`, `captureAlone`, each valid only where the contract says), `--skip-container` (a partial run that names
// each visual plant it skips) and the engine probe (no visual plant that needs an engine is run, each is named, and the
// job exits 2 whatever the others did). The registry fixture registers visual with its three basic plants.
describe("plants: the visual plants (006 FR-018)", () => {
  interface VisualRun {
    readonly code: number;
    readonly out: string[];
    readonly err: string[];
    readonly ran: string[];
    readonly probes: number;
  }

  async function visualJob(files: Map<string, string>, options: { readonly args?: readonly string[]; readonly probe?: boolean; readonly runs?: Readonly<Record<string, PlantRun>> } = {}): Promise<VisualRun> {
    const out: string[] = [];
    const err: string[] = [];
    const ran: string[] = [];
    let probes = 0;
    const below = (dir: string): string[] => [...files.keys()].filter((path) => path.startsWith(`${dir}/`)).map((path) => path.slice(dir.length + 1));
    const tools: PlantTools = {
      read: (path) => Promise.resolve(files.get(path)),
      dirs: (path) => Promise.resolve([...new Set(below(path).filter((p) => p.includes("/")).map((p) => p.split("/")[0] ?? ""))].sort()),
      files: (path) => Promise.resolve(below(path).sort()),
      runPlant: (gate, plant) => {
        ran.push(plant);
        return Promise.resolve(options.runs?.[plant] ?? recorded(gate, plant));
      },
      ...(options.probe === undefined
        ? {}
        : {
            probe: () => {
              probes += 1;
              return Promise.resolve(options.probe === true);
            },
          }),
    };
    const io: Io = { cwd: "/work/repo", env: {}, out: (l) => out.push(l), err: (l) => err.push(l) };
    const context: Context = { root: "/work/repo", toolCwd: "/work/repo", args: options.args ?? [] };
    return { code: await plants(context, tools, io), out, err, ran, probes };
  }

  const visualRan = (run: VisualRun): string[] => run.ran.filter((plant) => plant.startsWith("gates/plants/visual/"));

  it("runs every visual plant when the probe finds the engines, probing once", async () => {
    const run = await visualJob(world(), { probe: true });
    expect({ code: run.code, out: run.out, err: run.err, probes: run.probes }).toEqual({
      code: 0,
      out: ["plants: 53 plants of 17 gates and the registry judged, every plant as expected"],
      err: [],
      probes: 1,
    });
    expect(visualRan(run)).toEqual(["gates/plants/visual/error-basic", "gates/plants/visual/fail-basic", "gates/plants/visual/pass-basic"]);
  });

  it("--skip-container: runs every other plant, names each visual plant it skips, never probes, and says the run is partial", async () => {
    const run = await visualJob(world(), { args: ["--skip-container"], probe: false });
    expect({ code: run.code, out: run.out, err: run.err, probes: run.probes, visual: visualRan(run), others: run.ran.length }).toEqual({
      code: 0,
      out: ["plants: 50 plants of 17 gates and the registry judged, every plant as expected; partial run: 3 visual plants not run"],
      err: ["plants: skipped (no container): gates/plants/visual/error-basic", "plants: skipped (no container): gates/plants/visual/fail-basic", "plants: skipped (no container): gates/plants/visual/pass-basic"],
      probes: 0,
      visual: [],
      others: 48,
    });
  });

  it("--skip-container: exits by the other plants' result, and still says the run is partial", async () => {
    const run = await visualJob(world(), { args: ["--skip-container"], runs: { "gates/plants/lint/fail-basic": { exit: 0, stdout: [], stderr: [] } } });
    expect({ code: run.code, out: run.out }).toEqual({
      code: 1,
      out: ["gates/plants/lint/fail-basic: plants: not-caught: expected exit 1 with the plant's 1 finding, got exit 0", "plants: 1 problem in 50 plants; partial run: 3 visual plants not run"],
    });
  });

  it("no engine: runs no visual plant that needs one, names each, runs the host and missing ones, and exits 2 whatever the others did", async () => {
    const files = world();
    files.set("gates/plants/visual/error-basic/plant.json", JSON.stringify({ expect: "error", why: "w", cause: "could not run: broken input", engine: "host" }));
    files.set("gates/plants/visual/error-missing/plant.json", JSON.stringify({ expect: "error", why: "w", cause: "could not run: broken input", engine: "missing" }));
    const run = await visualJob(files, { probe: false, runs: { "gates/plants/lint/fail-basic": { exit: 0, stdout: [], stderr: [] } } });
    expect({ code: run.code, out: run.out, err: run.err, probes: run.probes, visual: visualRan(run) }).toEqual({
      code: 2,
      out: ["gates/plants/lint/fail-basic: plants: not-caught: expected exit 1 with the plant's 1 finding, got exit 0"],
      err: [
        "plants: not run (no container engine): gates/plants/visual/fail-basic",
        "plants: not run (no container engine): gates/plants/visual/pass-basic",
        "plants: could not run: no container engine for 2 visual plants; start docker or podman, or run a partial job with --skip-container",
      ],
      probes: 1,
      visual: ["gates/plants/visual/error-basic", "gates/plants/visual/error-missing"],
    });
  });

  it("no engine and every other plant as expected: still exits 2, with nothing on standard output", async () => {
    const run = await visualJob(world(), { probe: false });
    expect({ code: run.code, out: run.out, last: run.err.at(-1) }).toEqual({
      code: 2,
      out: [],
      last: "plants: could not run: no container engine for 3 visual plants; start docker or podman, or run a partial job with --skip-container",
    });
  });

  it("accepts engine on a visual plant only, with the values both, host and missing", async () => {
    const files = world();
    files.set("gates/plants/visual/error-basic/plant.json", JSON.stringify({ expect: "error", why: "w", cause: "could not run: broken input", engine: "both" }));
    files.set("gates/plants/lint/error-basic/plant.json", JSON.stringify({ expect: "error", why: "w", cause: "c", engine: "host" }));
    files.set("gates/plants/csp/error-basic/plant.json", JSON.stringify({ expect: "error", why: "w", cause: "c", engine: "podman" }));
    const run = await visualJob(files);
    expect(run.out.slice(0, 2)).toEqual(["gates/plants/lint/error-basic/plant.json: plants: invalid-plant: engine is only for plants of visual", "gates/plants/lint: plants: missing-plant: gate lint has no error plant"]);
    expect(run.out).toContain("gates/plants/csp/error-basic/plant.json: plants: invalid-plant: engine must be both, host or missing");
    expect(run.ran).toContain("gates/plants/visual/error-basic");
  });

  it("accepts baselinesOf on a visual fail plant naming a visual pass plant that holds baselines, and nothing else", async () => {
    const files = world();
    files.set("gates/plants/visual/pass-basic/tree/storybook/baselines/own--a.light.png", "png");
    files.set("gates/plants/visual/pass-bare/plant.json", passPlant);
    const fail = (baselinesOf: string): string => JSON.stringify({ ...(JSON.parse(failPlant("own--a/light", "differs")) as object), baselinesOf });
    files.set("gates/plants/visual/fail-basic/plant.json", fail("pass-basic"));
    files.set("gates/plants/visual/fail-none/plant.json", fail("pass-none"));
    files.set("gates/plants/visual/fail-bare/plant.json", fail("pass-bare"));
    files.set("gates/plants/visual/fail-own/plant.json", fail("pass-basic"));
    files.set("gates/plants/visual/fail-own/tree/storybook/baselines/own--a.dark.png", "png");
    files.set("gates/plants/lint/fail-basic/plant.json", fail("pass-basic"));
    const run = await visualJob(files, { runs: { "gates/plants/visual/fail-basic": { exit: 1, stdout: ["own--a/light: visual: differs: m"], stderr: [] } } });
    expect(run.out).toEqual([
      "gates/plants/lint/fail-basic/plant.json: plants: invalid-plant: baselinesOf is only for visual fail plants",
      "gates/plants/lint: plants: missing-plant: gate lint has no fail plant",
      "gates/plants/visual/fail-bare/plant.json: plants: invalid-plant: baselinesOf names pass-bare, which holds no baselines",
      "gates/plants/visual/fail-none/plant.json: plants: invalid-plant: baselinesOf names pass-none, which is not a visual pass plant",
      "gates/plants/visual/fail-own/plant.json: plants: invalid-plant: a plant with baselinesOf holds no file under storybook/baselines/ in its tree/",
      "plants: 5 problems in 57 plants",
    ]);
    expect(visualRan(run)).toEqual(["gates/plants/visual/error-basic", "gates/plants/visual/fail-basic", "gates/plants/visual/pass-bare", "gates/plants/visual/pass-basic"]);
  });

  it("reads only tree/ of a baselinesOf plant and of the plant it names, and reads no other plant for a plant without the key", async () => {
    const files = world();
    files.set("gates/plants/visual/pass-basic/tree/storybook/baselines/own--a.light.png", "png");
    files.set("gates/plants/visual/fail-basic/plant.json", JSON.stringify({ ...(JSON.parse(failPlant("own--a/light", "differs")) as object), baselinesOf: "pass-basic" }));
    files.set("gates/plants/visual/fail-basic/base/storybook/baselines/own--a.dark.png", "not the plant's tree");
    const reads: string[] = [];
    const read = (path: string): Promise<string | undefined> => {
      reads.push(path);
      return Promise.resolve(files.get(path));
    };
    const below = (dir: string): string[] => [...files.keys()].filter((path) => path.startsWith(`${dir}/`)).map((path) => path.slice(dir.length + 1));
    const tools: PlantTools = {
      read,
      dirs: (path) => Promise.resolve([...new Set(below(path).filter((p) => p.includes("/")).map((p) => p.split("/")[0] ?? ""))].sort()),
      files: (path) => Promise.resolve(below(path).sort()),
      runPlant: (gate, plant) => Promise.resolve(plant.endsWith("/fail-basic") && gate.id === "visual" ? { exit: 1, stdout: ["own--a/light: visual: differs: m"], stderr: [] } : recorded(gate, plant)),
    };
    const out: string[] = [];
    const io: Io = { cwd: "/work/repo", env: {}, out: (l) => out.push(l), err: (l) => out.push(l) };
    const code = await plants({ root: "/work/repo", toolCwd: "/work/repo", args: [] }, tools, io);
    expect({ code, out }).toEqual({ code: 0, out: ["plants: 53 plants of 17 gates and the registry judged, every plant as expected"] });
    expect(reads.filter((path) => path.includes("/undefined/"))).toEqual([]);
    expect(reads).toContain("gates/plants/visual/pass-basic/plant.json");
  });

  it("judges a registry plant whose ci.yml passes --skip-container in its plants job by the finding at ci.yml", async () => {
    const files = world();
    files.set("gates/plants/plants/skip/plant.json", failPlant("ci.yml", "skip-container-in-ci"));
    files.set("gates/plants/plants/skip/gates.json", registryText);
    files.set("gates/plants/plants/skip/ci.yml", workflow.replace("      - run: pnpm run gate:plants\n", "      - run: pnpm run gate:plants -- --skip-container\n"));
    const run = await visualJob(files);
    expect({ code: run.code, out: run.out }).toEqual({ code: 0, out: ["plants: 54 plants of 17 gates and the registry judged, every plant as expected"] });
  });

  it("judges a registry plant whose ci.yml runs --shard in its plants job by the finding at ci.yml (plan decision 23)", async () => {
    const files = world();
    files.set("gates/plants/plants/shard/plant.json", failPlant("ci.yml", "shard-in-plant-check"));
    files.set("gates/plants/plants/shard/gates.json", registryText);
    files.set("gates/plants/plants/shard/ci.yml", workflow.replace("      - run: pnpm run gate:plants\n", "      - run: pnpm run gate:plants -- --shard 1\n"));
    const run = await visualJob(files);
    expect({ code: run.code, out: run.out }).toEqual({ code: 0, out: ["plants: 54 plants of 17 gates and the registry judged, every plant as expected"] });
  });

  it("accepts captureAlone (true) on a visual pass plant with stories of its own only", async () => {
    const files = world();
    files.set("gates/plants/visual/pass-basic/plant.json", JSON.stringify({ expect: "pass", why: "w", captureAlone: true }));
    files.set("gates/plants/visual/pass-basic/tree/storybook/stories/second.stories.ts", "export default {};");
    files.set("gates/plants/visual/pass-bare/plant.json", JSON.stringify({ expect: "pass", why: "w", captureAlone: true }));
    files.set("gates/plants/visual/pass-false/plant.json", JSON.stringify({ expect: "pass", why: "w", captureAlone: false }));
    files.set("gates/plants/axe/pass-x/plant.json", JSON.stringify({ expect: "pass", why: "w", captureAlone: true }));
    const run = await visualJob(files);
    expect(run.out).toEqual([
      "gates/plants/visual/pass-bare/plant.json: plants: invalid-plant: a captureAlone plant has stories of its own in tree/storybook/stories/",
      "gates/plants/visual/pass-false/plant.json: plants: invalid-plant: captureAlone must be true",
      "gates/plants/axe/pass-x/plant.json: plants: invalid-plant: captureAlone is only for visual pass plants",
      "plants: 3 problems in 56 plants",
    ]);
    expect(visualRan(run)).toContain("gates/plants/visual/pass-basic");
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

  it("judges a plant whose locations are keyed by the expected findings the runner resolved (002 contracts/gates.md § Keyed locations)", () => {
    const keyed: Plant = { expect: "fail", why: "x", findings: [{ location: "p.json#light/a/b", rule: "r", message: "needle" }] };
    const run: PlantRun = { exit: 1, stdout: ["p.json:7: g: r: a needle", "g: 1 finding"], stderr: [], expected: [{ location: "p.json:7", rule: "r", message: "needle" }] };
    expect(judgePlant("g", keyed, run)).toBeUndefined();
    expect(judgePlant("g", keyed, { ...run, expected: [{ location: "p.json:8", rule: "r", message: "needle" }] })).toBe("findings differ: missing p.json:8 r; unexpected p.json:7 r");
    expect(judgePlant("g", keyed, { ...run, expected: [{ location: "p.json:7", rule: "r", message: "haystack" }] })).toBe('finding p.json:7 r lacks "haystack"');
    expect(judgePlant("g", keyed, { ...run, stdout: ["g: 0 findings"], exit: 0 })).toBe("expected exit 1 with the plant's 1 finding, got exit 0");
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

// Plan decisions 23 and 24 (operator decisions 2026-11-11, "In phase 3 now" and "Measure first"; contracts/plants.md
// § Shards, § Plant runner changes): each plant's time on stderr, and the three modes of the split plant job. The
// repository in memory holds 9 visual plants and 3 axe plants, so with the repository's size 3 (plan decision 30) the
// plan has 5 shards: shard 1 every other plant and the registry's, shard 2 the visual plants error-basic, fail-basic
// and pass-basic, shard 3 pass-v01 to pass-v03, shard 4 pass-v04 to pass-v06, shard 5 the axe plants. The stopwatch gives 1,250 ms for every plant.
describe("plants: plant times and shards (plan decisions 23 and 24)", () => {
  const extra = Array.from({ length: 6 }, (_, index) => `pass-v${String(index + 1).padStart(2, "0")}`);
  const visual = ["error-basic", "fail-basic", "pass-basic", ...extra].map((name) => `visual/${name}`);
  const axe = ["error-basic", "fail-basic", "pass-basic"].map((name) => `axe/${name}`);
  const others = gateIds.filter((id) => id !== "visual" && id !== "axe").flatMap((id) => ["error-basic", "fail-basic", "pass-basic"].map((name) => `${id}/${name}`));
  // The registry fixture registers axe (006 FR-017): its plants make a fifth shard after the visual ones.
  const partition = [[...others, "plants/matching", "plants/missing-entry"], visual.slice(0, 3), visual.slice(3, 6), visual.slice(6), axe];
  const note = (plant: string): string => `note: plant time: ${plant}: 1.3 s`;

  function sharded(): Map<string, string> {
    const files = world();
    for (const name of extra) files.set(`gates/plants/visual/${name}/plant.json`, passPlant);
    return files;
  }

  interface Report {
    readonly shard: number;
    readonly of: number;
    readonly plants: readonly { readonly plant: string; readonly asExpected: boolean; readonly lines: readonly string[]; readonly seconds: number }[];
    readonly skipped: readonly string[];
    readonly notRun: readonly string[];
  }

  /** A report of shard `k` in which every plant of the partition was judged as expected. */
  const report = (k: number, changes: Partial<Report> = {}): Report => ({
    shard: k,
    of: 5,
    plants: (partition[k - 1] ?? []).map((plant) => ({ plant, asExpected: true, lines: [], seconds: 1.3 })),
    skipped: [],
    notRun: [],
    ...changes,
  });

  interface ShardRun {
    readonly code: number;
    readonly out: string[];
    readonly err: string[];
    readonly ran: string[];
    readonly written: Map<string, string>;
    readonly read: string[];
  }

  async function shardJob(files: Map<string, string>, args: readonly string[], options: { readonly runs?: Readonly<Record<string, PlantRun>>; readonly reports?: ReadonlyMap<string, string> } = {}): Promise<ShardRun> {
    const out: string[] = [];
    const err: string[] = [];
    const ran: string[] = [];
    const written = new Map<string, string>();
    const read: string[] = [];
    const below = (dir: string): string[] => [...files.keys()].filter((path) => path.startsWith(`${dir}/`)).map((path) => path.slice(dir.length + 1));
    const tools: PlantTools = {
      read: (path) => Promise.resolve(files.get(path)),
      dirs: (path) => Promise.resolve([...new Set(below(path).filter((p) => p.includes("/")).map((p) => p.split("/")[0] ?? ""))].sort()),
      files: (path) => Promise.resolve(below(path).sort()),
      runPlant: (gate, plant) => {
        ran.push(plant);
        return Promise.resolve(options.runs?.[plant] ?? recorded(gate, plant));
      },
      stopwatch: () => () => 1250,
      write: (path, text) => {
        written.set(path, text);
        return Promise.resolve();
      },
      reports: (dir) => {
        read.push(dir);
        return Promise.resolve(options.reports ?? new Map());
      },
    };
    const io: Io = { cwd: "/work/repo", env: {}, out: (l) => out.push(l), err: (l) => err.push(l) };
    const context: Context = { root: "/work/repo", toolCwd: "/work/repo", args };
    return { code: await plants(context, tools, io), out, err, ran, written, read };
  }

  const reports = (...list: Report[]): Map<string, string> => new Map(list.map((one) => [`${String(one.shard)}.json`, JSON.stringify(one)]));
  const complete = (): Report[] => [1, 2, 3, 4, 5].map((k) => report(k));
  /** The repository with a registry finding (--skip-container in the plants job) and a gate without a breaking plant. */
  function flawed(): Map<string, string> {
    const files = sharded();
    files.set(".github/workflows/ci.yml", workflow.replace("      - run: pnpm run gate:plants\n", "      - run: pnpm run gate:plants -- --skip-container\n"));
    files.delete("gates/plants/lint/error-basic/plant.json");
    return files;
  }

  it("prints one plant time per plant judged, the registry's plants included, with one decimal, and the summary unchanged", async () => {
    const run = await shardJob(world(), []);
    const expected = [...gateIds.flatMap((id) => ["error-basic", "fail-basic", "pass-basic"].map((name) => `${id}/${name}`)), "plants/matching", "plants/missing-entry"];
    expect({ code: run.code, out: run.out, err: [...run.err].sort(), written: [...run.written.keys()], read: run.read }).toEqual({
      code: 0,
      out: ["plants: 53 plants of 17 gates and the registry judged, every plant as expected"],
      err: expected.map(note).sort(),
      written: [],
      read: [],
    });
  });

  it("--plan prints the shard numbers as one JSON line and runs no plant", async () => {
    const run = await shardJob(sharded(), ["--", "--plan"]);
    expect({ code: run.code, out: run.out, err: run.err, ran: run.ran }).toEqual({ code: 0, out: ["[1,2,3,4,5]"], err: [], ran: [] });
  });

  it("--shard 2 judges only shard 2's plants, runs no registry check, and writes its report", async () => {
    const run = await shardJob(flawed(), ["--", "--shard", "2"]);
    expect({ code: run.code, out: run.out, err: run.err, ran: run.ran }).toEqual({
      code: 0,
      out: ["plants: shard 2 of 5: 3 plants judged, every plant as expected"],
      err: visual.slice(0, 3).map(note),
      ran: visual.slice(0, 3).map((plant) => `gates/plants/${plant}`),
    });
    expect([...run.written.keys()]).toEqual(["storybook/.visual/plant-shards/2.json"]);
    expect(JSON.parse(run.written.get("storybook/.visual/plant-shards/2.json") ?? "")).toEqual(report(2));
  });

  it("--shard writes its report also when a plant is not as expected, with that plant's problem lines (exit 1)", async () => {
    const rejected: PlantRun = { exit: 1, stdout: ["a--b/light: visual: differs: x", "visual: 1 finding in 24 story-themes"], stderr: [] };
    const line = "gates/plants/visual/pass-v01: plants: not-accepted: expected exit 0 with no finding, got exit 1 (a--b/light differs)";
    const run = await shardJob(sharded(), ["--shard", "3"], { runs: { "gates/plants/visual/pass-v01": rejected } });
    expect({ code: run.code, out: run.out }).toEqual({ code: 1, out: [line, "plants: 1 problem in 3 plants"] });
    const written = report(3);
    expect(JSON.parse(run.written.get("storybook/.visual/plant-shards/3.json") ?? "")).toEqual({
      ...written,
      plants: written.plants.map((plant) => (plant.plant === "visual/pass-v01" ? { ...plant, asExpected: false, lines: [line] } : plant)),
    });
  });

  it("--shard 1 judges the other gates' and the registry's plants, and reports neither a registry finding nor a structural problem", async () => {
    const run = await shardJob(flawed(), ["--shard", "1"]);
    expect({ code: run.code, out: run.out, ran: run.ran.length }).toEqual({ code: 0, out: ["plants: shard 1 of 5: 46 plants judged, every plant as expected"], ran: 44 });
  });

  it("--shard 6 exits 2 naming the plan's shard count, and writes no report", async () => {
    const run = await shardJob(sharded(), ["--shard", "6"]);
    expect({ code: run.code, out: run.out, err: run.err, ran: run.ran, written: [...run.written.keys()] }).toEqual({
      code: 2,
      out: [],
      err: ["plants: could not run: there is no shard 6; the plan has 5"],
      ran: [],
      written: [],
    });
  });

  it("--shard and --verdict without a value, and a shard number not written as the plan writes it, exit 2", async () => {
    const runs = await Promise.all([["--shard"], ["--verdict"], ["--shard", "02"], ["--shard", "0"]].map((args) => shardJob(sharded(), args)));
    expect(runs.map((run) => ({ code: run.code, err: run.err, ran: run.ran.length, written: run.written.size }))).toEqual([
      { code: 2, err: ["plants: could not run: --shard needs a shard number"], ran: 0, written: 0 },
      { code: 2, err: ["plants: could not run: --verdict needs a report directory"], ran: 0, written: 0 },
      { code: 2, err: ["plants: could not run: there is no shard 02; the plan has 5"], ran: 0, written: 0 },
      { code: 2, err: ["plants: could not run: there is no shard 0; the plan has 5"], ran: 0, written: 0 },
    ]);
  });

  it("--verdict refuses every report that is not one, in file name order, and one naming shard 0", async () => {
    const valid = JSON.parse(JSON.stringify(report(2))) as Record<string, unknown>;
    const plant = { plant: "visual/error-basic", asExpected: true, lines: [], seconds: 1.3 };
    const broken: [string, unknown][] = [
      ["b-not-json.json", "{"],
      ["c-null.json", null],
      ["d-shard.json", { ...valid, shard: "2" }],
      ["e-of.json", { ...valid, of: 4.5 }],
      ["f-plants.json", { ...valid, plants: {} }],
      ["g-plant-null.json", { ...valid, plants: [null] }],
      ["h-plant-name.json", { ...valid, plants: [{ ...plant, plant: 1 }] }],
      ["i-as-expected.json", { ...valid, plants: [{ ...plant, asExpected: "yes" }] }],
      ["j-lines.json", { ...valid, plants: [{ ...plant, lines: "x" }] }],
      ["k-line.json", { ...valid, plants: [{ ...plant, lines: [1] }] }],
      ["l-seconds.json", { ...valid, plants: [{ ...plant, seconds: "1.3" }] }],
      ["m-skipped.json", { ...valid, skipped: "visual/x" }],
      ["n-not-run.json", { ...valid, notRun: [2] }],
    ];
    const texts = new Map<string, string>([...reports(...complete()), ...[...broken].reverse().map(([name, value]): [string, string] => [name, typeof value === "string" ? value : JSON.stringify(value)])]);
    texts.set("a-zero.json", JSON.stringify(report(0)));
    const run = await shardJob(sharded(), ["--verdict", "dir"], { reports: texts });
    expect({ code: run.code, err: run.err }).toEqual({
      code: 2,
      err: ["plants: could not run: a-zero.json: shard 0 of 5, but the plan has 5 shards", ...broken.map(([name]) => `plants: could not run: ${name} is not a shard report`)],
    });
  });

  it("--verdict names every plant of a report that is not its shard's, sorted, and prints the problems before the causes", async () => {
    const two = report(2);
    const moved = { ...two, plants: [...two.plants.filter((plant) => plant.plant !== "visual/error-basic"), { plant: "visual/pass-v06", asExpected: true, lines: [], seconds: 1.3 }] };
    const run = await shardJob(flawed(), ["--verdict", "dir"], { reports: reports(report(1, { plants: report(1).plants.filter((plant) => plant.plant !== "lint/error-basic") }), moved, report(3), report(4), report(5)) });
    expect({ code: run.code, out: run.out, err: run.err }).toEqual({
      code: 2,
      out: [
        ".github/workflows/ci.yml: plants: skip-container-in-ci: the plants job passes --skip-container, so CI would not run the visual plants",
        "gates/plants/lint: plants: missing-plant: gate lint has no error plant",
      ],
      err: ["plants: could not run: shard 2 judged other plants than the partition gives it: visual/error-basic, visual/pass-v06"],
    });
  });

  it("--verdict on a complete, as-expected set of reports prints exactly the single run's summary line and runs no plant", async () => {
    const run = await shardJob(sharded(), ["--", "--verdict", "storybook/.visual/plant-shards"], { reports: reports(...complete()) });
    expect({ code: run.code, out: run.out, err: run.err, ran: run.ran, read: run.read }).toEqual({
      code: 0,
      out: ["plants: 59 plants of 17 gates and the registry judged, every plant as expected"],
      err: [],
      ran: [],
      read: ["storybook/.visual/plant-shards"],
    });
  });

  it("--verdict exits 2 naming a shard with no report", async () => {
    const run = await shardJob(sharded(), ["--verdict", "dir"], { reports: reports(report(1), report(2), report(4), report(5)) });
    expect({ code: run.code, out: run.out, err: run.err }).toEqual({ code: 2, out: [], err: ["plants: could not run: shard 3 of 5 reported no result"] });
  });

  it("--verdict exits 2 on a report of another plan's shard count, and on one that is not a shard report", async () => {
    const other = await shardJob(sharded(), ["--verdict", "dir"], { reports: reports(report(1), report(2, { of: 3 }), report(3), report(4), report(5)) });
    expect({ code: other.code, err: other.err }).toEqual({ code: 2, err: ["plants: could not run: 2.json: shard 2 of 3, but the plan has 5 shards", "plants: could not run: shard 2 of 5 reported no result"] });
    const broken = await shardJob(sharded(), ["--verdict", "dir"], { reports: new Map([...reports(...complete()), ["2.json", '{"shard":2}']]) });
    expect({ code: broken.code, err: broken.err }).toEqual({ code: 2, err: ["plants: could not run: 2.json is not a shard report", "plants: could not run: shard 2 of 5 reported no result"] });
    const outside = await shardJob(sharded(), ["--verdict", "dir"], { reports: reports(...complete(), report(9)) });
    expect({ code: outside.code, err: outside.err }).toEqual({ code: 2, err: ["plants: could not run: 9.json: shard 9 of 5, but the plan has 5 shards"] });
  });

  it("--verdict exits 2 when a report holds a plant of another shard", async () => {
    const two = report(2);
    const moved = { ...two, plants: [...two.plants, { plant: "visual/pass-v06", asExpected: true, lines: [], seconds: 1.3 }] };
    const run = await shardJob(sharded(), ["--verdict", "dir"], { reports: reports(report(1), moved, report(3), report(4), report(5)) });
    expect({ code: run.code, err: run.err }).toEqual({ code: 2, err: ["plants: could not run: shard 2 judged other plants than the partition gives it: visual/pass-v06"] });
  });

  it("--verdict exits 2 on a report with a skipped plant, naming it", async () => {
    const three = report(3);
    const skipped = { ...three, plants: three.plants.filter((plant) => plant.plant !== "visual/pass-v03"), skipped: ["visual/pass-v03"] };
    const run = await shardJob(sharded(), ["--verdict", "dir"], { reports: reports(report(1), report(2), skipped, report(4), report(5)) });
    expect({ code: run.code, err: run.err }).toEqual({
      code: 2,
      err: ["plants: skipped (no container): gates/plants/visual/pass-v03", "plants: could not run: shard 3 skipped 1 visual plant (--skip-container); the Plants check judges every plant"],
    });
  });

  it("--verdict exits 2 on a report with a plant not run for want of an engine, naming it", async () => {
    const three = report(3);
    const notRun = { ...three, plants: three.plants.filter((plant) => plant.plant !== "visual/pass-v02" && plant.plant !== "visual/pass-v03"), notRun: ["visual/pass-v02", "visual/pass-v03"] };
    const run = await shardJob(sharded(), ["--verdict", "dir"], { reports: reports(report(1), report(2), notRun, report(4), report(5)) });
    expect({ code: run.code, err: run.err }).toEqual({
      code: 2,
      err: [
        "plants: not run (no container engine): gates/plants/visual/pass-v02",
        "plants: not run (no container engine): gates/plants/visual/pass-v03",
        "plants: could not run: shard 3 could not run 2 visual plants (no container engine); the Plants check judges every plant",
      ],
    });
  });

  it("--verdict prints the reports' problem lines with the single run's summary of problems (exit 1)", async () => {
    const line = "gates/plants/visual/pass-v01: plants: not-accepted: expected exit 0 with no finding, got exit 1 (a--b/light differs)";
    const three = report(3);
    const failing = { ...three, plants: three.plants.map((plant) => (plant.plant === "visual/pass-v01" ? { ...plant, asExpected: false, lines: [line] } : plant)) };
    const run = await shardJob(sharded(), ["--verdict", "dir"], { reports: reports(report(1), report(2), failing, report(4), report(5)) });
    expect({ code: run.code, out: run.out, err: run.err }).toEqual({ code: 1, out: [line, "plants: 1 problem in 59 plants"], err: [] });
  });

  it("--verdict reports the registry finding and the gate without a breaking plant that --shard does not", async () => {
    const one = report(1);
    const without = { ...one, plants: one.plants.filter((plant) => plant.plant !== "lint/error-basic") };
    const run = await shardJob(flawed(), ["--verdict", "dir"], { reports: reports(without, report(2), report(3), report(4), report(5)) });
    expect({ code: run.code, out: run.out, err: run.err, ran: run.ran, read: run.read }).toEqual({
      code: 1,
      out: [
        ".github/workflows/ci.yml: plants: skip-container-in-ci: the plants job passes --skip-container, so CI would not run the visual plants",
        "gates/plants/lint: plants: missing-plant: gate lint has no error plant",
        "plants: 2 problems in 58 plants",
      ],
      err: [],
      ran: [],
      read: ["dir"],
    });
  });
});

// Op 016 (#41; spec.md scenarios 5 to 8, OR-003 and OR-004; plan.md *The mode* and *Output*): --affected <base> judges
// only the plants the changed paths select, after the registry check and the structural checks of the whole set;
// --list judges none. The changed paths come from a double that records each base it is asked for.
describe("plants: the registry plant of affected-in-ci (op 016)", () => {
  // Added in the green step for the mutation run: the registry plants' check applies affectedInCiFindings too.
  it("judges a registry plant whose plants job passes --affected as caught with the finding at ci.yml", async () => {
    const files = world();
    files.set("gates/plants/plants/affected/plant.json", failPlant("ci.yml", "affected-in-ci", "the plants job passes --affected"));
    files.set("gates/plants/plants/affected/gates.json", registryText);
    files.set("gates/plants/plants/affected/ci.yml", workflow.replace("      - run: pnpm run gate:plants\n", "      - run: pnpm run gate:plants -- --affected HEAD~1\n"));
    expect(await result(job(files))).toEqual({ code: 0, out: ["plants: 54 plants of 17 gates and the registry judged, every plant as expected"], err: [] });
  });
});

describe("plants: --affected <base> (op 016)", () => {
  interface AffectedRun {
    readonly code: number;
    readonly out: string[];
    readonly err: string[];
    readonly ran: string[];
    readonly asked: string[];
  }

  type Changes = { readonly paths: readonly string[] } | { readonly cause: string };

  async function affectedJob(files: Map<string, string>, args: readonly string[], changes: Changes | undefined): Promise<AffectedRun> {
    const out: string[] = [];
    const err: string[] = [];
    const ran: string[] = [];
    const asked: string[] = [];
    const below = (dir: string): string[] => [...files.keys()].filter((path) => path.startsWith(`${dir}/`)).map((path) => path.slice(dir.length + 1));
    const tools: PlantTools = {
      read: (path) => Promise.resolve(files.get(path)),
      dirs: (path) => Promise.resolve([...new Set(below(path).filter((p) => p.includes("/")).map((p) => p.split("/")[0] ?? ""))].sort()),
      files: (path) => Promise.resolve(below(path).sort()),
      runPlant: (gate, plant) => {
        ran.push(plant);
        return Promise.resolve(recorded(gate, plant));
      },
      ...(changes === undefined
        ? {}
        : {
            changed: (base: string) => {
              asked.push(base);
              return Promise.resolve(changes);
            },
          }),
    };
    const io: Io = { cwd: "/work/repo", env: {}, out: (l) => out.push(l), err: (l) => err.push(l) };
    const context: Context = { root: "/work/repo", toolCwd: "/work/repo", args };
    return { code: await plants(context, tools, io), out, err, ran: [...ran].sort(), asked };
  }

  const three = { paths: ["gates/plants/lint/fail-basic/plant.json", "gates/plants/csp/pass-basic/plant.json", "gates/plants/plants/matching/ci.yml", "specs/x/tasks.md"] };
  const threeNotes = [
    "note: affected: lint/fail-basic, by gates/plants/lint/fail-basic/plant.json",
    "note: affected: csp/pass-basic, by gates/plants/csp/pass-basic/plant.json",
    "note: affected: plants/matching, by gates/plants/plants/matching/ci.yml",
  ];
  const none = { paths: ["specs/x/tasks.md", "specs/x/reviews/phase-1/red-phase.log"] };
  /** The repository with an unknown gate directory, a gate without a breaking plant and an invalid pass plant. */
  function flawed(): Map<string, string> {
    const files = world();
    files.set("gates/plants/no-gate/fail-a/plant.json", passPlant);
    files.delete("gates/plants/lint/error-basic/plant.json");
    files.set("gates/plants/mutation/pass-basic/plant.json", JSON.stringify({ expect: "pass", why: "a near-miss", base: "HEAD" }));
    return files;
  }
  const flaws = [
    "gates/plants/no-gate: plants: unknown-gate: plants of no-gate, which has no registry entry",
    "gates/plants/lint: plants: missing-plant: gate lint has no error plant",
    "gates/plants/mutation/pass-basic/plant.json: plants: invalid-plant: a pass plant may not set base",
    "gates/plants/mutation: plants: missing-plant: gate mutation has no pass plant",
  ];
  const affectedInCi = ".github/workflows/ci.yml: plants: affected-in-ci: the plants job passes --affected, so CI would judge only the plants a diff selects";
  function withAffectedInCi(): Map<string, string> {
    const files = world();
    files.set(".github/workflows/ci.yml", workflow.replace("      - run: pnpm run gate:plants\n", "      - run: pnpm run gate:plants -- --affected HEAD~1\n"));
    return files;
  }

  it("scenario 6: judges only the three selected plants, notes each with its path, and says this is not the Plants check", async () => {
    expect(await affectedJob(world(), ["--", "--affected", "abc123"], three)).toEqual({
      code: 0,
      out: ["plants: affected since abc123: 3 of 53 plants judged, every plant as expected; not the Plants check"],
      err: threeNotes,
      ran: ["gates/plants/csp/pass-basic", "gates/plants/lint/fail-basic"],
      asked: ["abc123"],
    });
  });

  it("scenario 6: a selected plant that is not as expected fails the run, counted among the plants judged", async () => {
    const files = world();
    files.set("gates/plants/lint/fail-basic/plant.json", failPlant("packages/tokens/src/x.ts:9", "rule-a", "planted"));
    const run = await affectedJob(files, ["--affected", "abc123"], three);
    expect({ code: run.code, out: run.out }).toEqual({
      code: 1,
      out: ["gates/plants/lint/fail-basic: plants: not-caught: findings differ: missing packages/tokens/src/x.ts:9 rule-a; unexpected packages/tokens/src/x.ts:1 rule-a", "plants: 1 problem in 3 plants (affected since abc123; not the Plants check)"],
    });
  });

  it("scenario 5: judges no plant when nothing is selected, and exits 0 with the no-plant line", async () => {
    expect(await affectedJob(world(), ["--affected", "abc123"], none)).toEqual({
      code: 0,
      out: ["plants: affected since abc123: no plant selected, 0 of 53 plants judged; not the Plants check"],
      err: [],
      ran: [],
      asked: ["abc123"],
    });
  });

  it("scenario 7: --list prints the same notes and the selection's summary, and judges no plant", async () => {
    expect(await affectedJob(world(), ["--affected", "abc123", "--list"], three)).toEqual({
      code: 0,
      out: ["plants: affected since abc123: 3 of 53 plants selected, none judged (--list)"],
      err: threeNotes,
      ran: [],
      asked: ["abc123"],
    });
  });

  it("still runs the structural checks of the whole set when nothing is selected, and with --list", async () => {
    const summary = "plants: 4 problems in 0 plants (affected since abc123; not the Plants check)";
    expect(await affectedJob(flawed(), ["--affected", "abc123"], none)).toEqual({ code: 1, out: [...flaws, summary], err: [], ran: [], asked: ["abc123"] });
    expect(await affectedJob(flawed(), ["--list", "--affected", "abc123"], three)).toEqual({ code: 1, out: [...flaws, summary], err: threeNotes, ran: [], asked: ["abc123"] });
  });

  it("reports affected-in-ci for the repository's ci.yml in this mode and in the single run", async () => {
    expect(await affectedJob(withAffectedInCi(), ["--affected", "abc123"], none)).toEqual({
      code: 1,
      out: [affectedInCi, "plants: 1 problem in 0 plants (affected since abc123; not the Plants check)"],
      err: [],
      ran: [],
      asked: ["abc123"],
    });
    expect(await result(job(withAffectedInCi()))).toEqual({ code: 1, out: [affectedInCi, "plants: 1 problem in 53 plants"], err: [] });
  });

  it("judges every plant when a path selects the full set, naming it and its reason", async () => {
    const run = await affectedJob(world(), ["--affected", "abc123"], { paths: ["gates/plants/lint/fail-basic/plant.json", "gates/lib/registry.ts", "pnpm-lock.yaml"] });
    expect({ code: run.code, out: run.out, err: run.err, ran: run.ran.length }).toEqual({
      code: 0,
      out: ["plants: affected since abc123: 53 of 53 plants judged, every plant as expected; not the Plants check"],
      err: ["note: affected: every plant, by gates/lib/registry.ts (shared gate source)"],
      ran: 51,
    });
    const unmapped = await affectedJob(world(), ["--affected", "abc123", "--list"], { paths: ["pnpm-lock.yaml"] });
    expect({ code: unmapped.code, out: unmapped.out, err: unmapped.err, ran: unmapped.ran }).toEqual({
      code: 0,
      out: ["plants: affected since abc123: 53 of 53 plants selected, none judged (--list)"],
      err: ["note: affected: every plant, by pnpm-lock.yaml (not mapped)"],
      ran: [],
    });
  });

  it("with --skip-container skips a selected visual plant and says the run is partial", async () => {
    const run = await affectedJob(world(), ["--affected", "abc123", "--skip-container"], { paths: ["gates/plants/visual/pass-basic/plant.json", "gates/plants/lint/pass-basic/plant.json"] });
    expect(run).toEqual({
      code: 0,
      out: ["plants: affected since abc123: 1 of 53 plants judged, every plant as expected; not the Plants check; partial run: 1 visual plant not run"],
      err: [
        "note: affected: lint/pass-basic, by gates/plants/lint/pass-basic/plant.json",
        "note: affected: visual/pass-basic, by gates/plants/visual/pass-basic/plant.json",
        "plants: skipped (no container): gates/plants/visual/pass-basic",
      ],
      ran: ["gates/plants/lint/pass-basic"],
      asked: ["abc123"],
    });
  });

  // Added in the green step for the mutation run: the selection reads each plant's baselinesOf from its plant.json,
  // and a case without one, or with one that is not a plant, names none.
  it("selects the visual plant whose baselinesOf names a changed plant, and reads past a case without a valid plant.json", async () => {
    const files = world();
    files.set("gates/plants/visual/pass-basic/tree/storybook/baselines/a--b.light.png", "png");
    files.set("gates/plants/visual/fail-below/plant.json", JSON.stringify({ expect: "fail", why: "w", baselinesOf: "pass-basic", findings: [{ location: "a--b/light", rule: "differs" }] }));
    files.set("gates/plants/lint/fail-no-plant/tree/a.ts", "x");
    files.set("gates/plants/lint/fail-not-a-plant/plant.json", "[]");
    const path = "gates/plants/visual/pass-basic/tree/storybook/baselines/a--b.light.png";
    const run = await affectedJob(files, ["--affected", "abc123", "--list"], { paths: [path] });
    expect(run).toEqual({
      code: 1,
      out: [
        "gates/plants/lint/fail-no-plant/plant.json: plants: invalid-plant: plant.json is missing",
        "gates/plants/lint/fail-not-a-plant/plant.json: plants: invalid-plant: plant.json is not an object",
        "plants: 2 problems in 0 plants (affected since abc123; not the Plants check)",
      ],
      err: [`note: affected: visual/fail-below, by ${path}`, `note: affected: visual/pass-basic, by ${path}`],
      ran: [],
      asked: ["abc123"],
    });
  });

  it("scenario 8: exits 2 naming each argument error, before asking for the changes or running a plant", async () => {
    const cases = [
      ["--affected"],
      ["--affected", "--list"],
      ["--affected", "abc123", "--plan"],
      ["--shard", "1", "--affected", "abc123"],
      ["--affected", "abc123", "--verdict", "dir"],
      ["--list"],
    ];
    const runs = await Promise.all(cases.map((args) => affectedJob(world(), args, three)));
    const combined = "plants: could not run: --affected is a mode of its own; it cannot be combined with --plan, --shard or --verdict";
    expect(runs).toEqual(
      [
        "plants: could not run: --affected needs a base commit",
        "plants: could not run: --affected needs a base commit",
        combined,
        combined,
        combined,
        "plants: could not run: --list needs --affected <base>",
      ].map((line) => ({ code: 2, out: [], err: [line], ran: [], asked: [] })),
    );
  });

  it("scenario 8: exits 2 naming the cause when the base does not resolve, and when the changes cannot be read", async () => {
    const cause = "--affected no-such-ref does not resolve to a commit; pass the phase's base.sha";
    expect(await affectedJob(world(), ["--affected", "no-such-ref"], { cause })).toEqual({ code: 2, out: [], err: [`plants: could not run: ${cause}`], ran: [], asked: ["no-such-ref"] });
    expect(await affectedJob(world(), ["--affected", "abc123"], undefined)).toEqual({ code: 2, out: [], err: ["plants: could not run: --affected needs git to read the changed paths"], ran: [], asked: [] });
  });
});
