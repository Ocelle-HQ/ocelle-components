import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { Plant } from "../lib/plant-judge.ts";
import { affectedPlants, aloneDecision, containerDecision, engineValue, errorText, failedOwn, gateEntryImports, gateRunsAtOnce, keptPlantDir, limiter, needsEngine, outputLines, otherShardSize, plantShards, plantTimeNote, plantValues, repositoryContentPlants, resolveLocations, runPlant, shardSize } from "../lib/plant-runner.ts";
import type { Affected, BuiltRepo, RunnerTools, TreeView } from "../lib/plant-runner.ts";
import type { Gate, PlantForm } from "../lib/registry.ts";
import type { ToolRun } from "../lib/spawn.ts";

// The plant runner (FR-025, research.md R-10; phase 4 review round 1, R1-09 and R1-11), in process: the tools are
// doubles that record each call, so the tests assert which temporary directory, builder, command and arguments the
// runner uses, what it makes of the gate's output, and that it always removes the temporary directory.
const fail: Plant = { expect: "fail", why: "w", findings: [{ location: "a.ts:1", rule: "r" }] };

function gate(id: string, plantForm: PlantForm, plantCommand: string): Gate {
  return { id, check: id, command: `pnpm run gate:${id}`, plantCommand, plantForm, scope: "s" };
}

interface Recorder {
  readonly tools: RunnerTools;
  readonly calls: string[];
}

function recorder(built: BuiltRepo, ran: ToolRun | Error, buildError?: Error): Recorder {
  const calls: string[] = [];
  const build = (form: PlantForm) => (plant: string, into: string): Promise<BuiltRepo> => {
    calls.push(`build ${form} ${plant} ${into}`);
    return buildError === undefined ? Promise.resolve(built) : Promise.reject(buildError);
  };
  const tools: RunnerTools = {
    tempDir: (prefix) => {
      calls.push(`tempDir ${prefix}`);
      return Promise.resolve(`/tmp/${prefix}1`);
    },
    removeDir: (dir) => {
      calls.push(`removeDir ${dir}`);
      return Promise.resolve();
    },
    build: { "repo-tree": build("repo-tree"), "commit-repo": build("commit-repo"), "mutation-repo": build("mutation-repo"), "tracked-tree": build("tracked-tree"), "pack-tree": build("pack-tree"), workspace: build("workspace") },
    run: (command, args) => {
      calls.push(`run ${command} ${args.join(" ")}`);
      return ran instanceof Error ? Promise.reject(ran) : Promise.resolve(ran);
    },
    node: "/opt/node/bin/node",
    read: (path) => {
      calls.push(`read ${path}`);
      return Promise.resolve(undefined);
    },
    stylesheet: (root) => {
      calls.push(`stylesheet ${root}`);
      return Promise.resolve("");
    },
  };
  return { tools, calls };
}

const output: ToolRun = { exitCode: 1, stdout: "a.ts:1: lint: r: m\n\nlint: 1 finding in 1 file\n", stderr: "warning\n" };

describe("errorText", () => {
  it("is an Error's message, and any other thrown value as text", () => {
    expect([errorText(new TypeError("bad")), errorText("disk full"), errorText(3)]).toEqual(["bad", "disk full", "3"]);
  });
});

describe("outputLines", () => {
  it("splits at newlines and drops empty lines", () => {
    expect([outputLines("a\n\nb\n"), outputLines(""), outputLines("one")]).toEqual([["a", "b"], [], ["one"]]);
  });
});

describe("plantValues", () => {
  it("gives a workspace plant its copy as {plant}, and nothing else", () => {
    expect(plantValues("workspace", "/tmp/p", { base: "b" }, { ...fail, base: "x" })).toEqual({ plant: "/tmp/p" });
  });

  it("gives a repository plant its temporary repository as {root}, and the base commit as {base} when there is one", () => {
    expect([
      plantValues("repo-tree", "/tmp/r", {}, fail),
      plantValues("commit-repo", "/tmp/c", { base: "abc", commits: ["d"] }, fail),
      plantValues("mutation-repo", "/tmp/m", { base: "def" }, fail),
    ]).toEqual([{ root: "/tmp/r" }, { root: "/tmp/c", base: "abc" }, { root: "/tmp/m", base: "def" }]);
  });

  it("gives the plant's own base instead of the base commit (review round 1, R1-11)", () => {
    const plant: Plant = { expect: "error", why: "w", base: "refs/heads/no-such-base" };
    expect([plantValues("mutation-repo", "/tmp/m", { base: "def" }, plant), plantValues("repo-tree", "/tmp/r", {}, plant)]).toEqual([
      { root: "/tmp/m", base: "refs/heads/no-such-base" },
      { root: "/tmp/r", base: "refs/heads/no-such-base" },
    ]);
  });
});

describe("runPlant", () => {
  it("builds the plant in a new temporary directory, runs the command there with Node, and removes the directory", async () => {
    const { tools, calls } = recorder({}, output);
    const run = await runPlant(tools, "/repo", gate("lint", "repo-tree", "node gates/bin/lint.ts --root {root}"), "gates/plants/lint/fail-x", fail);
    expect(run).toEqual({ exit: 1, stdout: ["a.ts:1: lint: r: m", "lint: 1 finding in 1 file"], stderr: ["warning"] });
    expect(calls).toEqual([
      "tempDir ocelle-plant-lint-",
      "build repo-tree /repo/gates/plants/lint/fail-x /tmp/ocelle-plant-lint-1",
      "run /opt/node/bin/node gates/bin/lint.ts --root /tmp/ocelle-plant-lint-1",
      "removeDir /tmp/ocelle-plant-lint-1",
    ]);
  });

  it("uses the builder of the gate's plant form and passes the record commits on", async () => {
    const { tools, calls } = recorder({ base: "b0", commits: ["c1", "c2"] }, { exitCode: 0, stdout: "", stderr: "" });
    const signoff = gate("signoff", "commit-repo", "node gates/bin/signoff.ts --root {root} --range {base}..HEAD");
    const run = await runPlant(tools, "/repo", signoff, "gates/plants/signoff/pass-x", { expect: "pass", why: "w" });
    expect(run).toEqual({ exit: 0, stdout: [], stderr: [], commits: ["c1", "c2"] });
    expect(calls.slice(1, 3)).toEqual([
      "build commit-repo /repo/gates/plants/signoff/pass-x /tmp/ocelle-plant-signoff-1",
      "run /opt/node/bin/node gates/bin/signoff.ts --root /tmp/ocelle-plant-signoff-1 --range b0..HEAD",
    ]);
  });

  it("presents a mutation plant's own base as {base} (review round 1, R1-11)", async () => {
    const { tools, calls } = recorder({ base: "b0" }, { exitCode: 2, stdout: "", stderr: "mutation: could not run: x\n" });
    const mutation = gate("mutation", "mutation-repo", "node gates/bin/mutation.ts --root {root} --base {base}");
    const run = await runPlant(tools, "/repo", mutation, "gates/plants/mutation/error-x", { expect: "error", why: "w", base: "missing" });
    expect(run).toEqual({ exit: 2, stdout: [], stderr: ["mutation: could not run: x"] });
    expect(calls[2]).toBe("run /opt/node/bin/node gates/bin/mutation.ts --root /tmp/ocelle-plant-mutation-1 --base missing");
  });

  it("runs a command other than node as written", async () => {
    const { tools, calls } = recorder({}, { exitCode: 0, stdout: "", stderr: "" });
    await runPlant(tools, "/repo", gate("pins", "workspace", "pnpm run gate:pins -- --plant {plant}"), "gates/plants/pins/pass-x", fail);
    expect(calls.slice(1, 3)).toEqual([
      "build workspace /repo/gates/plants/pins/pass-x /tmp/ocelle-plant-pins-1",
      "run pnpm run gate:pins -- --plant /tmp/ocelle-plant-pins-1",
    ]);
  });

  it("names the plant when its repository cannot be built, runs nothing, and removes the directory", async () => {
    const { tools, calls } = recorder({}, output, new Error("cp failed"));
    const done = runPlant(tools, "/repo", gate("lint", "repo-tree", "node x.ts --root {root}"), "gates/plants/lint/fail-x", fail);
    await expect(done).rejects.toThrow("gates/plants/lint/fail-x: cannot build its temporary repository (cp failed)");
    expect(calls).toEqual([
      "tempDir ocelle-plant-lint-",
      "build repo-tree /repo/gates/plants/lint/fail-x /tmp/ocelle-plant-lint-1",
      "removeDir /tmp/ocelle-plant-lint-1",
    ]);
  });

  it("keeps the build failure as the cause", async () => {
    const cause = new Error("x", { cause: 1 });
    const { tools } = recorder({}, output, cause);
    const error = await runPlant(tools, "/repo", gate("lint", "repo-tree", "node x.ts --root {root}"), "p", fail).catch((thrown: unknown) => thrown);
    expect([(error as Error).message, (error as Error).cause]).toEqual(["p: cannot build its temporary repository (x)", cause]);
  });

  // 006 research.md R-16: the builder reads the plant's plant.json keys that shape its root (`unlinked`).
  it("hands the plant's parsed plant.json to the builder, so its unlinked key reaches the plant root", async () => {
    const { tools } = recorder({}, { exitCode: 2, stdout: "", stderr: "storybook-build: could not run: x\n" });
    const specs: unknown[] = [];
    const repoTree = tools.build["repo-tree"];
    const spy: RunnerTools = {
      ...tools,
      build: { ...tools.build, "repo-tree": (plant, into, spec) => (specs.push(spec), repoTree(plant, into, spec)) },
    };
    const plant: Plant = { expect: "error", why: "w", cause: "x", unlinked: ["storybook/node_modules"] };
    await runPlant(spy, "/repo", gate("storybook-build", "repo-tree", "node gates/bin/storybook-build.ts --root {root}"), "gates/plants/storybook-build/error-x", plant);
    expect(specs).toEqual([plant]);
  });

  it("removes the directory when the gate process cannot start", async () => {
    const { tools, calls } = recorder({}, new Error("spawn ENOENT"));
    const done = runPlant(tools, "/repo", gate("lint", "repo-tree", "node x.ts --root {root}"), "p", fail);
    await expect(done).rejects.toThrow("spawn ENOENT");
    expect(calls.at(-1)).toBe("removeDir /tmp/ocelle-plant-lint-1");
  });
});

/** A task that runs until `finish` is called, recording when it starts and ends. */
function deferred(log: string[], name: string): { readonly task: () => Promise<string>; readonly finish: () => void; readonly fail: () => void } {
  let resolve: (value: string) => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;
  const task = (): Promise<string> => {
    log.push(`start ${name}`);
    return new Promise<string>((ok, no) => {
      resolve = ok;
      reject = no;
    });
  };
  return {
    task,
    finish: () => {
      log.push(`end ${name}`);
      resolve(name);
    },
    fail: () => {
      log.push(`fail ${name}`);
      reject(new Error(name));
    },
  };
}

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe("limiter", () => {
  it("starts at most `size` tasks at once, the next one in order when a slot frees, and passes results through", async () => {
    const log: string[] = [];
    const limit = limiter(2);
    const tasks = ["a", "b", "c", "d"].map((name) => deferred(log, name));
    const results = tasks.map((t) => limit(t.task).catch((error: unknown) => `failed ${(error as Error).message}`));
    await settle();
    expect(log).toEqual(["start a", "start b"]);
    tasks[1]?.finish();
    await settle();
    expect(log).toEqual(["start a", "start b", "end b", "start c"]);
    tasks[0]?.fail();
    await settle();
    expect(log).toEqual(["start a", "start b", "end b", "start c", "fail a", "start d"]);
    tasks[2]?.finish();
    tasks[3]?.finish();
    expect(await Promise.all(results)).toEqual(["failed a", "b", "c", "d"]);
  });

  it("frees the slot of a finished task for a task started later", async () => {
    const log: string[] = [];
    const limit = limiter(1);
    const first = deferred(log, "a");
    const done = limit(first.task);
    await settle();
    first.finish();
    await done;
    const second = deferred(log, "b");
    const later = limit(second.task);
    await settle();
    expect(log).toEqual(["start a", "end a", "start b"]);
    second.finish();
    expect(await later).toBe("b");
  });

  it("runs one task at a time with size 1", async () => {
    const log: string[] = [];
    const limit = limiter(1);
    const tasks = ["a", "b"].map((name) => deferred(log, name));
    const results = tasks.map((t) => limit(t.task));
    await settle();
    tasks[0]?.finish();
    await settle();
    tasks[1]?.finish();
    expect(await Promise.all(results)).toEqual(["a", "b"]);
    expect(log).toEqual(["start a", "end a", "start b", "end b"]);
  });
});

describe("gateRunsAtOnce", () => {
  it("is half the processors, at least one", () => {
    expect([0, 1, 2, 3, 4, 5, 8].map(gateRunsAtOnce)).toEqual([1, 1, 1, 1, 2, 2, 4]);
  });
});

// Keyed locations (002 contracts/gates.md § Configuration set, *Keyed locations*): a contrast or brand-rules fail plant
// writes each expected location by key; the runner resolves it to `<path>:<line>` in the plant's built tree before the
// plant is judged, and a key that resolves to no line (or a token or pair key to two) is a runner error naming it.
const files: Readonly<Record<string, string>> = {
  "packages/tokens/contrast/pairs.json": [
    "[",
    '  {"theme":"light","fg":"color-ink","bg":"color-canvas","kind":"text","figure":"16.0","status":"checked","source":"#5"},',
    '  {"theme":"dark","fg":"color-ink","bg":"color-canvas","kind":"text","figure":"15.3","status":"checked","source":"computed"},',
    '  {"theme":"light","fg":"color-ink-soft","bg":"color-canvas","kind":"text","figure":"9.7","status":"checked","source":"#5"}',
    "]",
    "",
  ].join("\n"),
  "packages/tokens/src/source.ts": [
    'import { applyOverrides } from "./generate.ts";',
    "export const records = [",
    '  { name: "color-canvas", group: "colour", value: { light: "#F1EEE8", dark: "#15130F" } }, // bone',
    "  {",
    '    name: "color-ink",',
    '    group: "colour",',
    "  },",
    '  { name: "color-ink-soft", group: "colour" },',
    '  { name: "color-twice", group: "colour" },',
    '  { name: "color-twice", group: "colour" },',
    "];",
    "",
  ].join("\n"),
  "packages/tokens/src/overrides.ts": ["// x", "export const overrides = [", '  {"token":"color-ink","light":"#000000"},', '  {"add":{"name":"radius-4","group":"shape","value":"4px"}},', "];", ""].join("\n"),
};
const sheet = ["@font-face {}", ":root {", "  --ocelle-motion-fast: 120ms;", "}", "@media (prefers-reduced-motion: reduce) {", "  --ocelle-motion-fast: 0ms;", "  --ocelle-motion-fast: 0ms;", "}", ""].join("\n");

function view(log: string[] = []): TreeView {
  return {
    read: (path) => {
      log.push(`read ${path}`);
      return Promise.resolve(files[path]);
    },
    stylesheet: () => {
      log.push("stylesheet");
      return Promise.resolve(sheet);
    },
  };
}

describe("resolveLocations", () => {
  it("resolves each key form to its line, and keeps plain locations, rules and messages", async () => {
    const findings = [
      { location: "packages/tokens/contrast/pairs.json#dark/color-ink/color-canvas", rule: "figure-mismatch", message: "15.3" },
      { location: "packages/tokens/contrast/pairs.json#light/color-ink-soft/color-canvas", rule: "below-threshold" },
      { location: "packages/tokens/src/source.ts#color-ink", rule: "missing-required-pair" },
      { location: "packages/tokens/src/source.ts#color-canvas", rule: "dark-chrome" },
      { location: "packages/tokens/src/overrides.ts#radius-4", rule: "radius-set" },
      { location: "packages/tokens/dist/tokens.css#--ocelle-motion-fast: 0ms", rule: "reduced-motion" },
      { location: "packages/tokens/src/source.ts", rule: "radius-set" },
      { location: "a.ts:3", rule: "r", message: "m" },
    ];
    expect(await resolveLocations(findings, view())).toEqual([
      { location: "packages/tokens/contrast/pairs.json:3", rule: "figure-mismatch", message: "15.3" },
      { location: "packages/tokens/contrast/pairs.json:4", rule: "below-threshold" },
      { location: "packages/tokens/src/source.ts:5", rule: "missing-required-pair" },
      { location: "packages/tokens/src/source.ts:3", rule: "dark-chrome" },
      { location: "packages/tokens/src/overrides.ts:4", rule: "radius-set" },
      { location: "packages/tokens/dist/tokens.css:6", rule: "reduced-motion" },
      { location: "packages/tokens/src/source.ts", rule: "radius-set" },
      { location: "a.ts:3", rule: "r", message: "m" },
    ]);
  });

  it("reads each file it needs, and makes the stylesheet only for a tokens.css key", async () => {
    const log: string[] = [];
    await resolveLocations([{ location: "packages/tokens/src/source.ts#color-ink", rule: "r" }, { location: "x.ts:1", rule: "r" }], view(log));
    expect(log).toEqual(["read packages/tokens/src/source.ts"]);
    const withCss: string[] = [];
    await resolveLocations([{ location: "packages/tokens/dist/tokens.css#:root {", rule: "r" }], view(withCss));
    expect(withCss).toEqual(["stylesheet"]);
  });

  it("resolves a tokens.css key at the first line holding the text, which may itself hold #", async () => {
    const found = await resolveLocations([{ location: "packages/tokens/dist/tokens.css#--ocelle-motion-fast", rule: "r" }, { location: "packages/tokens/dist/tokens.css#@font-face {}", rule: "r" }], view());
    expect(found.map((f) => f.location)).toEqual(["packages/tokens/dist/tokens.css:3", "packages/tokens/dist/tokens.css:1"]);
  });

  it.each([
    { location: "packages/tokens/contrast/pairs.json#light/color-ink/color-sheet", problem: "resolves to no line" },
    { location: "packages/tokens/contrast/pairs.json#light/color-ink", problem: "is not <theme>/<fg>/<bg>" },
    { location: "packages/tokens/src/source.ts#color-nope", problem: "resolves to no line" },
    { location: "packages/tokens/src/source.ts#color", problem: "resolves to no line" },
    { location: "packages/tokens/src/source.ts#color-twice", problem: "resolves to 2 lines" },
    { location: "packages/tokens/src/overrides.ts#color-ink", problem: "resolves to no line" },
    { location: "packages/tokens/dist/tokens.css#--ocelle-color-canvas", problem: "resolves to no line" },
    { location: "packages/tokens/src/generate.ts#css", problem: "is not a keyed location (pairs.json, source.ts, overrides.ts or dist/tokens.css)" },
  ])("fails naming the key $location", async ({ location, problem }) => {
    await expect(resolveLocations([{ location, rule: "r" }], view())).rejects.toThrow(`keyed location ${location} ${problem}`);
  });

  // 006 contracts/gates.md § `axe`: the axe gate locates an exception entry's finding at
  // storybook/a11y-exceptions.json#<index>, a location of its own, not a key to resolve.
  it("hands on storybook/a11y-exceptions.json#<index> unchanged, reading nothing", async () => {
    const reads: string[] = [];
    const recording: TreeView = {
      read: (path) => {
        reads.push(path);
        return Promise.resolve(undefined);
      },
      stylesheet: () => Promise.resolve(""),
    };
    const found = await resolveLocations([{ location: "storybook/a11y-exceptions.json#0", rule: "stale-exception" }, { location: "storybook/a11y-exceptions.json#12", rule: "r" }], recording);
    expect({ found, reads }).toEqual({ found: [{ location: "storybook/a11y-exceptions.json#0", rule: "stale-exception" }, { location: "storybook/a11y-exceptions.json#12", rule: "r" }], reads: [] });
  });

  it("fails naming the key when the file is not in the tree", async () => {
    const empty: TreeView = { read: () => Promise.resolve(undefined), stylesheet: () => Promise.resolve("") };
    await expect(resolveLocations([{ location: "packages/tokens/src/source.ts#color-ink", rule: "r" }], empty)).rejects.toThrow(
      "keyed location packages/tokens/src/source.ts#color-ink: packages/tokens/src/source.ts is not in the plant's tree",
    );
  });

  it("fails naming the key when a pairs.json line holds two keyed entries", async () => {
    const twice: TreeView = {
      read: () => Promise.resolve('[\n  {"theme":"light","fg":"a","bg":"b"},\n  {"theme":"light","fg":"a","bg":"b"}\n]\n'),
      stylesheet: () => Promise.resolve(""),
    };
    await expect(resolveLocations([{ location: "packages/tokens/contrast/pairs.json#light/a/b", rule: "r" }], twice)).rejects.toThrow(
      "keyed location packages/tokens/contrast/pairs.json#light/a/b resolves to 2 lines",
    );
  });
});

describe("runPlant: keyed locations", () => {
  function keyed(): { tools: RunnerTools; calls: string[] } {
    const { tools, calls } = recorder({}, output);
    const tree: Readonly<Record<string, string>> = { "/tmp/ocelle-plant-contrast-1/packages/tokens/src/source.ts": files["packages/tokens/src/source.ts"] ?? "" };
    return {
      calls,
      tools: {
        ...tools,
        read: (path) => {
          calls.push(`read ${path}`);
          return Promise.resolve(tree[path]);
        },
        stylesheet: (root) => {
          calls.push(`stylesheet ${root}`);
          return Promise.resolve(sheet);
        },
      },
    };
  }
  const contrast = gate("contrast", "repo-tree", "node gates/bin/contrast.ts --root {root}");

  it("resolves the plant's keyed locations in its built tree before the directory is removed, and hands them on", async () => {
    const { tools, calls } = keyed();
    const plant: Plant = { expect: "fail", why: "w", findings: [{ location: "packages/tokens/src/source.ts#color-ink", rule: "missing-required-pair" }, { location: "packages/tokens/dist/tokens.css#: 0ms", rule: "r" }] };
    const run = await runPlant(tools, "/repo", contrast, "gates/plants/contrast/fail-x", plant);
    expect(run.expected).toEqual([
      { location: "packages/tokens/src/source.ts:5", rule: "missing-required-pair" },
      { location: "packages/tokens/dist/tokens.css:6", rule: "r" },
    ]);
    expect(calls.slice(2)).toEqual([
      "run /opt/node/bin/node gates/bin/contrast.ts --root /tmp/ocelle-plant-contrast-1",
      "read /tmp/ocelle-plant-contrast-1/packages/tokens/src/source.ts",
      "stylesheet /tmp/ocelle-plant-contrast-1",
      "removeDir /tmp/ocelle-plant-contrast-1",
    ]);
  });

  it("hands on no expected findings for a plant without keyed locations, and reads nothing; a keyed plant reads its tree", async () => {
    const { tools, calls } = keyed();
    const run = await runPlant(tools, "/repo", contrast, "gates/plants/contrast/fail-x", fail);
    expect({ expected: "expected" in run, calls: calls.filter((call) => call.startsWith("read") || call.startsWith("stylesheet")) }).toEqual({ expected: false, calls: [] });
    const plant: Plant = { expect: "fail", why: "w", findings: [{ location: "packages/tokens/src/source.ts#color-ink", rule: "r" }, { location: "a.ts:1", rule: "r" }] };
    const keyedRun = await runPlant(tools, "/repo", contrast, "gates/plants/contrast/fail-x", plant);
    expect({ expected: keyedRun.expected, reads: calls.filter((call) => call.startsWith("read") || call.startsWith("stylesheet")) }).toEqual({
      expected: [{ location: "packages/tokens/src/source.ts:5", rule: "r" }, { location: "a.ts:1", rule: "r" }],
      reads: ["read /tmp/ocelle-plant-contrast-1/packages/tokens/src/source.ts"],
    });
  });

  it("hands on no expected findings and reads nothing for an axe plant whose findings are at storybook/a11y-exceptions.json#<index>", async () => {
    const { tools, calls } = keyed();
    const axe = gate("axe", "repo-tree", "node gates/bin/axe.ts --root {root}");
    const plant: Plant = { expect: "fail", why: "w", findings: [{ location: "storybook/a11y-exceptions.json#0", rule: "stale-exception" }] };
    const run = await runPlant(tools, "/repo", axe, "gates/plants/axe/fail-x", plant);
    expect({ expected: "expected" in run, calls: calls.filter((call) => call.startsWith("read") || call.startsWith("stylesheet")) }).toEqual({ expected: false, calls: [] });
  });

  it("names the plant and the key when a key does not resolve, and removes the directory", async () => {
    const { tools, calls } = keyed();
    const plant: Plant = { expect: "fail", why: "w", findings: [{ location: "packages/tokens/src/source.ts#color-nope", rule: "r" }] };
    await expect(runPlant(tools, "/repo", contrast, "gates/plants/contrast/fail-x", plant)).rejects.toThrow(
      "gates/plants/contrast/fail-x: keyed location packages/tokens/src/source.ts#color-nope resolves to no line",
    );
    expect(calls.at(-1)).toBe("removeDir /tmp/ocelle-plant-contrast-1");
    const error = await runPlant(tools, "/repo", contrast, "p", plant).catch((thrown: unknown) => thrown);
    expect((error as Error).cause).toBeInstanceOf(Error);
    expect(((error as Error).cause as Error).message).toBe("keyed location packages/tokens/src/source.ts#color-nope resolves to no line");
  });
});

// 006 research.md R-06, R-07 and R-11 (contracts/plants.md § Plant runner changes): a visual plant's `{engine}`, which
// plants need a container engine and what the job does with them, and the copy of a failing visual pass plant's
// captures in tree layout (run 1's, or for a captureAlone plant captures made alone, never run 1's).
const pass: Plant = { expect: "pass", why: "w" };
const visualGate = gate("visual", "repo-tree", "node gates/bin/visual.ts --root {root} --engine {engine}");

describe("engineValue", () => {
  it("is the plant's engine, else $OCELLE_VISUAL_ENGINE, else both; missing is the engine name ocelle-no-such-engine", () => {
    expect(engineValue({ ...pass, engine: "host" }, { OCELLE_VISUAL_ENGINE: "auto" })).toBe("host");
    expect(engineValue({ ...pass, engine: "both" }, { OCELLE_VISUAL_ENGINE: "auto" })).toBe("both");
    expect(engineValue({ ...pass, engine: "missing" }, {})).toBe("ocelle-no-such-engine");
    expect(engineValue(pass, { OCELLE_VISUAL_ENGINE: "auto" })).toBe("auto");
    expect(engineValue(pass, { OCELLE_VISUAL_ENGINE: "" })).toBe("both");
    expect(engineValue(pass, {})).toBe("both");
  });
});

describe("runPlant: {engine}", () => {
  it("fills {engine} from the plant and the job's environment, and leaves other commands as they are", async () => {
    const commands: string[] = [];
    for (const [plant, env] of [
      [pass, { OCELLE_VISUAL_ENGINE: "auto" }],
      [{ ...pass, engine: "missing" }, { OCELLE_VISUAL_ENGINE: "auto" }],
      [pass, undefined],
    ] as const) {
      const { tools, calls } = recorder({}, { exitCode: 0, stdout: "", stderr: "" });
      await runPlant(env === undefined ? tools : { ...tools, env }, "/repo", visualGate, "gates/plants/visual/pass-x", plant);
      commands.push(...calls.filter((call) => call.startsWith("run ")));
    }
    expect(commands).toEqual([
      "run /opt/node/bin/node gates/bin/visual.ts --root /tmp/ocelle-plant-visual-1 --engine auto",
      "run /opt/node/bin/node gates/bin/visual.ts --root /tmp/ocelle-plant-visual-1 --engine ocelle-no-such-engine",
      "run /opt/node/bin/node gates/bin/visual.ts --root /tmp/ocelle-plant-visual-1 --engine both",
    ]);
  });
});

describe("needsEngine and containerDecision (006 research.md R-07)", () => {
  it("needs an engine for a visual plant whose engine is not host or missing, for no other gate", () => {
    expect([needsEngine("visual", pass), needsEngine("visual", { ...pass, engine: "both" }), needsEngine("visual", { ...pass, engine: "host" }), needsEngine("visual", { ...pass, engine: "missing" }), needsEngine("axe", pass)]).toEqual([
      true,
      true,
      false,
      false,
      false,
    ]);
  });

  it("skips every visual plant with --skip-container, does not run one that needs a missing engine, and runs the rest", () => {
    const host: Plant = { ...pass, engine: "host" };
    expect([
      containerDecision("visual", pass, { skipContainer: true, engines: true }),
      containerDecision("visual", host, { skipContainer: true, engines: false }),
      containerDecision("lint", pass, { skipContainer: true, engines: false }),
      containerDecision("visual", pass, { skipContainer: false, engines: false }),
      containerDecision("visual", host, { skipContainer: false, engines: false }),
      containerDecision("visual", pass, { skipContainer: false, engines: true }),
      containerDecision("storybook-build", pass, { skipContainer: false, engines: false }),
    ]).toEqual(["skip", "skip", "run", "not-run", "run", "run", "run"]);
  });
});

describe("failedOwn, keptPlantDir and aloneDecision (006 research.md R-11)", () => {
  it("takes the differs and missing-baseline story-themes of the plant's own stories from the gate's output, in order", () => {
    const stdout = [
      "second--a/light: visual: differs: the capture differs from its baseline second--a.light.png",
      "second--a/dark: visual: missing-baseline: no baseline second--a.dark.png",
      "tokens--colour/light: visual: differs: the capture differs from its baseline tokens--colour.light.png",
      "second--b/light: visual: nondeterministic: run 1 and run 2 differ",
      "second--b/dark: axe: differs: m",
      "storybook/baselines/second--c.light.png: visual: stray-baseline: the baseline names no story-theme of the index",
      "visual: 5 findings in 30 story-themes (docker only: no cross-engine comparison)",
    ];
    expect(failedOwn(stdout, ["second--a", "second--b"])).toEqual([
      { story: "second--a", theme: "light" },
      { story: "second--a", theme: "dark" },
    ]);
    expect(failedOwn(stdout, ["second"])).toEqual([]);
    expect(failedOwn(["note second--ab/light: visual: differs: m", "second--ab/dark: visual: differs: m"], ["second--ab"])).toEqual([{ story: "second--ab", theme: "dark" }]);
  });

  it("keeps a plant's captures at storybook/.visual/plants/<plant path>/tree/storybook/baselines/", () => {
    expect(keptPlantDir("gates/plants/visual/pass-below-fold")).toBe("storybook/.visual/plants/gates/plants/visual/pass-below-fold/tree/storybook/baselines");
  });

  it("copies a capture made alone unless it equals the committed baseline, which gives the freshness line", () => {
    const at = { story: "second--render", theme: "dark" } as const;
    expect(aloneDecision("gates/plants/visual/pass-second-render", at, Uint8Array.from([1, 2]), Uint8Array.from([1, 2]))).toEqual({
      line: "plants: visual/pass-second-render: second--render/dark: captured alone matches the baseline; the full run differs (freshness)",
    });
    expect(aloneDecision("gates/plants/visual/pass-second-render", at, Uint8Array.from([1, 2]), Uint8Array.from([1, 3]))).toEqual({ copy: true });
    expect(aloneDecision("gates/plants/visual/pass-second-render", at, Uint8Array.from([1, 2]), Uint8Array.from([1, 2, 0]))).toEqual({ copy: true });
    expect(aloneDecision("gates/plants/visual/pass-second-render", at, Uint8Array.from([1, 2]), undefined)).toEqual({ copy: true });
  });
});

describe("runPlant: the captures of a failing visual pass plant (006 research.md R-11)", () => {
  const failing: ToolRun = {
    exitCode: 1,
    stdout: ["own--a/light: visual: differs: m", "own--a/dark: visual: missing-baseline: m", "tokens--colour/light: visual: differs: m", "visual: 3 findings in 26 story-themes (docker+podman)"].join("\n"),
    stderr: "",
  };
  const into = "/tmp/ocelle-plant-visual-1";

  /** The recorder's tools with visual copy tools that log each call; captures made alone are `alone` by story-theme. */
  function withVisual(ran: ToolRun, alone: Readonly<Record<string, Uint8Array>> = {}, committed: Readonly<Record<string, Uint8Array>> = {}): Recorder {
    const { tools, calls } = recorder({}, ran);
    const visual = {
      own: (root: string, plant: string) => {
        calls.push(`own ${root} ${plant}`);
        return Promise.resolve(["own--a", "own--b"]);
      },
      copy: (from: string, to: string) => {
        calls.push(`copy ${from} ${to}`);
        return Promise.resolve();
      },
      captureAlone: (root: string, at: { readonly story: string; readonly theme: string }) => {
        calls.push(`alone ${root} ${at.story}/${at.theme}`);
        return Promise.resolve(alone[`${at.story}/${at.theme}`]);
      },
      readBytes: (path: string) => {
        calls.push(`readBytes ${path}`);
        return Promise.resolve(committed[path]);
      },
      write: (path: string, bytes: Uint8Array) => {
        calls.push(`write ${path} ${String(bytes.length)}`);
        return Promise.resolve();
      },
      note: (line: string) => {
        calls.push(`note ${line}`);
      },
    };
    const withCopy: RunnerTools = { ...tools, visual };
    return { tools: withCopy, calls };
  }

  it("copies run 1's captures of the failing own story-themes in tree layout, before the root is removed", async () => {
    const { tools, calls } = withVisual(failing);
    await runPlant(tools, "/repo", visualGate, "gates/plants/visual/pass-x", pass);
    const kept = "/repo/storybook/.visual/plants/gates/plants/visual/pass-x/tree/storybook/baselines";
    expect(calls.slice(3)).toEqual([
      `own ${into} /repo/gates/plants/visual/pass-x`,
      `copy ${into}/storybook/.visual/baselines/own--a.light.png ${kept}/own--a.light.png`,
      `copy ${into}/storybook/.visual/baselines/own--a.dark.png ${kept}/own--a.dark.png`,
      `removeDir ${into}`,
    ]);
  });

  it("for a captureAlone plant copies none of run 1's captures: captures alone, copies one that differs, and names one equal to the baseline", async () => {
    const committed = "/repo/gates/plants/visual/pass-second-render/tree/storybook/baselines";
    const { tools, calls } = withVisual(failing, { "own--a/light": Uint8Array.from([1, 2, 3]), "own--a/dark": Uint8Array.from([4, 5]) }, { [`${committed}/own--a.dark.png`]: Uint8Array.from([4, 5]) });
    await runPlant(tools, "/repo", visualGate, "gates/plants/visual/pass-second-render", { ...pass, captureAlone: true });
    const kept = "/repo/storybook/.visual/plants/gates/plants/visual/pass-second-render/tree/storybook/baselines";
    expect(calls.slice(3)).toEqual([
      `own ${into} /repo/gates/plants/visual/pass-second-render`,
      `alone ${into} own--a/light`,
      `readBytes ${committed}/own--a.light.png`,
      `write ${kept}/own--a.light.png 3`,
      `alone ${into} own--a/dark`,
      `readBytes ${committed}/own--a.dark.png`,
      "note plants: visual/pass-second-render: own--a/dark: captured alone matches the baseline; the full run differs (freshness)",
      `removeDir ${into}`,
    ]);
    expect(calls.some((call) => call.startsWith("copy "))).toBe(false);
  });

  it("copies nothing for a capture made alone that did not capture (a refusing status or the runs differing)", async () => {
    const { tools, calls } = withVisual(failing);
    await runPlant(tools, "/repo", visualGate, "gates/plants/visual/pass-second-render", { ...pass, captureAlone: true });
    expect(calls.filter((call) => /^(?:copy|write|note|readBytes) /.test(call))).toEqual([]);
  });

  it("copies nothing for a passing visual plant, a fail plant, another gate's pass plant, or without the copy tools", async () => {
    for (const [run, plant, on] of [
      [{ exitCode: 0, stdout: "visual: 26 captures match their baselines (docker+podman)", stderr: "" }, pass, visualGate],
      [failing, { expect: "fail", why: "w", findings: [{ location: "own--a/light", rule: "differs" }] }, visualGate],
      [failing, pass, gate("axe", "repo-tree", "node gates/bin/axe.ts --root {root}")],
      // CI run 43056264356 (PR #24): a pass plant whose gate could not run (exit 2) built no Storybook, so there are no
      // captures to keep; reading its index stopped the whole plant job.
      [{ exitCode: 2, stdout: "", stderr: "visual: could not run: the image cannot be obtained: x\n" }, pass, visualGate],
    ] as const) {
      const { tools, calls } = withVisual(run);
      await runPlant(tools, "/repo", on, "gates/plants/visual/pass-x", plant);
      expect(calls.filter((call) => !/^(?:tempDir|build|run|removeDir) /.test(call))).toEqual([]);
    }
    const { tools, calls } = recorder({}, failing);
    await runPlant(tools, "/repo", visualGate, "gates/plants/visual/pass-x", pass);
    expect(calls.at(-1)).toBe(`removeDir ${into}`);
  });
});

// Plan decisions 23 and 24 (operator decisions 2026-11-11, "In phase 3 now" and "Measure first"; contracts/plants.md
// § Shards, § Plant runner changes): the partition of the plants into shards, and the note of a plant's time.
describe("plantShards and shardSize (plan decision 23)", () => {
  const registry = ["plants/fail-gate-without-entry", "plants/fail-gate-without-job", "plants/pass-matching"];
  const lint = ["lint/error-a", "lint/fail-b", "lint/fail-c", "lint/pass-d", "lint/pass-e"];
  const storybook = ["storybook-build/fail-x", "storybook-build/pass-y"];
  const visual = Array.from({ length: 17 }, (_, index) => `visual/case-${String(index + 1).padStart(2, "0")}`);
  const axe = Array.from({ length: 9 }, (_, index) => `axe/case-${String(index + 1)}`);
  // The visual and axe plants out of name order, and before the others, to show both orders are the shards' own.
  const shuffled = (list: readonly string[]): string[] => [...list].reverse();

  // Plan decision 30 ("Split its plants"): an otherSize of 80 gives one shard of the other plants here, and that shard
  // holds them sorted by <gate>/<case>, no longer in their input order.
  it("puts the registry's and the other gates' plants in shard 1, sorted, then the visual plants by name in groups of the size", () => {
    expect(plantShards([...shuffled(visual), ...registry, ...lint, ...storybook], 8, 80)).toEqual([
      [...lint, ...registry, ...storybook],
      visual.slice(0, 8),
      visual.slice(8, 16),
      visual.slice(16),
    ]);
  });

  it("adds the axe plants after the visual ones the same way, and gives one shard without visual or axe plants", () => {
    const shards = plantShards([...shuffled(axe), ...registry, ...shuffled(visual), ...lint], 8, 80);
    expect(shards).toEqual([[...lint, ...registry], visual.slice(0, 8), visual.slice(8, 16), visual.slice(16), axe.slice(0, 8), axe.slice(8)]);
    expect(plantShards([...registry, ...lint, ...storybook], 8, 80)).toEqual([[...lint, ...registry, ...storybook]]);
    expect(plantShards([...registry, ...visual.slice(0, 3)], 2, 80)).toEqual([registry, visual.slice(0, 2), visual.slice(2, 3)]);
  });

  it("puts every plant in exactly one shard", () => {
    const all = [...registry, ...lint, ...storybook, ...visual, ...axe];
    expect(plantShards(all, 8, 80).flat().sort()).toEqual([...all].sort());
  });

  // Plan decision 30 (operator decision 2026-11-12, "Split its plants"; contracts/plants.md § Shards): the other plants
  // sorted by <gate>/<case> and dealt in turn over max(1, ceil(n / otherSize)) shards, before the visual plants.
  it("deals the 10 other plants in turn over 3 shards at otherSize 4, the 17 visual plants at size 8 following as shards 4 to 6", () => {
    expect(plantShards([...shuffled(visual), ...registry, ...lint, ...storybook], 8, 4)).toEqual([
      ["lint/error-a", "lint/pass-d", "plants/fail-gate-without-job", "storybook-build/pass-y"],
      ["lint/fail-b", "lint/pass-e", "plants/pass-matching"],
      ["lint/fail-c", "plants/fail-gate-without-entry", "storybook-build/fail-x"],
      visual.slice(0, 8),
      visual.slice(8, 16),
      visual.slice(16),
    ]);
  });

  it("deals the 10 other plants over 2 shards of 5 at otherSize 5", () => {
    expect(plantShards([...registry, ...lint, ...storybook], 8, 5)).toEqual([
      ["lint/error-a", "lint/fail-c", "lint/pass-e", "plants/fail-gate-without-job", "storybook-build/fail-x"],
      ["lint/fail-b", "lint/pass-d", "plants/fail-gate-without-entry", "plants/pass-matching", "storybook-build/pass-y"],
    ]);
  });

  it("keeps the 10 other plants in one shard, sorted, at otherSize 10 or more", () => {
    for (const otherSize of [10, 11, 80]) {
      expect(plantShards([...storybook, ...registry, ...lint, ...visual.slice(0, 2)], 8, otherSize)).toEqual([[...lint, ...registry, ...storybook], visual.slice(0, 2)]);
    }
  });

  it("gives the same partition for the input reversed or shuffled", () => {
    const all = [...registry, ...lint, ...storybook, ...visual, ...axe];
    const interleaved = all.filter((_, index) => index % 2 === 1).concat(all.filter((_, index) => index % 2 === 0).reverse());
    const sorted = plantShards([...all].sort(), 8, 4);
    expect(sorted.slice(0, 3)).toEqual([
      ["lint/error-a", "lint/pass-d", "plants/fail-gate-without-job", "storybook-build/pass-y"],
      ["lint/fail-b", "lint/pass-e", "plants/pass-matching"],
      ["lint/fail-c", "plants/fail-gate-without-entry", "storybook-build/fail-x"],
    ]);
    expect(plantShards([...all].reverse(), 8, 4)).toEqual(sorted);
    expect(plantShards(interleaved, 8, 4)).toEqual(sorted);
  });

  it("puts every plant in exactly one shard, the other plants' shards differing in size by at most one", () => {
    const all = [...registry, ...lint, ...storybook, ...visual, ...axe];
    for (const otherSize of [1, 2, 3, 4, 5, 6, 7, 9, 10]) {
      const shards = plantShards(all, 8, otherSize);
      const others = shards.slice(0, Math.ceil(10 / otherSize));
      expect(shards.flat().sort()).toEqual([...all].sort());
      expect(others.flat().sort()).toEqual([...registry, ...lint, ...storybook].sort());
      expect(Math.max(...others.map((shard) => shard.length)) - Math.min(...others.map((shard) => shard.length))).toBeLessThanOrEqual(1);
    }
  });

  it("is 80 for the other plants in the repository, by plan decision 30", () => {
    expect(otherShardSize).toBe(80);
  });

  // 012 research.md R-13 and plan decision 15: size 1, so a `visual` shard stays under 10 minutes at about 58 stories
  // (size 3, approved by 006 plan decision 30 up to its split count of 25 stories, would take about 875 s). Size 1 is
  // the floor: plantShards keeps each plant whole.
  it("is 1 in the repository (012 research.md R-13), the floor of a shard", () => {
    expect(shardSize).toBe(1);
  });

  // 012 tasks.md T006: the repository's own plants (every case directory under gates/plants/<gate>/, as gate:plants
  // lists them) at the repository's sizes: one visual or axe plant per shard, the other plants dealt over shards of at
  // most 80.
  it("deals the repository's plants into one visual or axe plant per shard and the other plants into shards of at most 80", () => {
    const root = fileURLToPath(new URL("../plants", import.meta.url));
    const cases = (gate: string): string[] => readdirSync(join(root, gate), { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => `${gate}/${entry.name}`);
    const plants = readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).flatMap((entry) => cases(entry.name));
    const visualAndAxe = plants.filter((plant) => plant.startsWith("visual/") || plant.startsWith("axe/"));
    const others = plants.length - visualAndAxe.length;
    const shards = plantShards(plants, shardSize, otherShardSize);
    const otherShards = Math.ceil(others / 80);
    const dealt = {
      counts: { visual: plants.filter((plant) => plant.startsWith("visual/")).length, axe: plants.filter((plant) => plant.startsWith("axe/")).length, others },
      shards: shards.length,
      otherSizes: shards.slice(0, otherShards).map((shard) => shard.length <= 80 && shard.every((plant) => !plant.startsWith("visual/") && !plant.startsWith("axe/"))),
      visualAndAxe: shards.slice(otherShards),
    };
    expect(dealt).toEqual({
      // 030: the eighteen pack-contents plants join the others (253 before), still four shards of at most 80.
      counts: { visual: 48, axe: 25, others: 271 },
      shards: 4 + 48 + 25,
      otherSizes: [true, true, true, true],
      visualAndAxe: [...visualAndAxe.filter((plant) => plant.startsWith("visual/")).sort(), ...visualAndAxe.filter((plant) => plant.startsWith("axe/")).sort()].map((plant) => [plant]),
    });
  });
});

describe("plantTimeNote (plan decision 24)", () => {
  it("names the plant and its seconds with one decimal", () => {
    expect(plantTimeNote("visual/error-host", 1250)).toBe("note: plant time: visual/error-host: 1.3 s");
    expect(plantTimeNote("plants/pass-matching", 41_660)).toBe("note: plant time: plants/pass-matching: 41.7 s");
    expect(plantTimeNote("lint/fail-b", 0)).toBe("note: plant time: lint/fail-b: 0.0 s");
    expect(plantTimeNote("lint/fail-b", 1249)).toBe("note: plant time: lint/fail-b: 1.2 s");
  });
});

// Op 016 (#41; spec.md OR-001, plan.md *Path classes*): the plants a phase's changed paths can affect. The plant and
// gate lists are written here; each result is asserted whole, the selected plants in order with the path that
// selected each.
describe("affectedPlants (op 016)", () => {
  const gates = ["lint", "contrast", "brand-rules", "manifest", "storybook-build", "visual", "axe"];
  const content = [
    "contrast/repository-values",
    "brand-rules/repository-values",
    "manifest/pass-repository",
    "storybook-build/pass-repository",
    "visual/pass-repository",
    "visual/fail-token-changed",
    "visual/fail-one-pixel",
    "visual/fail-missing-baseline",
    "visual/fail-same-pixels-other-bytes",
    "axe/pass-repository",
  ];
  const plants = [
    { name: "lint/fail-a" },
    { name: "lint/pass-b" },
    { name: "contrast/fail-x" },
    { name: "contrast/repository-values" },
    { name: "brand-rules/repository-values" },
    { name: "manifest/pass-repository" },
    { name: "storybook-build/fail-y" },
    { name: "storybook-build/pass-repository" },
    { name: "visual/pass-below-fold" },
    { name: "visual/fail-below-fold", baselinesOf: "pass-below-fold" },
    { name: "visual/pass-repository" },
    { name: "visual/fail-token-changed" },
    { name: "visual/fail-one-pixel" },
    { name: "visual/fail-missing-baseline" },
    { name: "visual/fail-same-pixels-other-bytes" },
    { name: "visual/fail-network" },
    { name: "axe/fail-empty" },
    { name: "axe/pass-repository" },
    { name: "plants/pass-matching" },
    { name: "plants/fail-gate-without-entry" },
  ];
  /** The result with its selection as a list of [plant, path] entries, so that the order is asserted too. */
  const view = (result: Affected): unknown => ("full" in result ? result : { plants: [...result.plants] });
  const select = (changed: readonly string[], list: typeof plants = plants): unknown => view(affectedPlants({ plants: list, gates, changed }));
  const selected = (...entries: (readonly [string, string])[]): unknown => ({ plants: entries });
  const contentBy = (path: string): unknown => selected(...content.map((plant) => [plant, path] as const));
  /** A token path (operator round 3, O3-01): the repository-content plants and this list's one other contrast plant. */
  const tokenBy = (path: string): unknown => selected(["contrast/fail-x", path], ...content.map((plant) => [plant, path] as const));
  const full = (path: string, reason: "shared gate source" | "not mapped"): unknown => ({ full: { path, reason } });

  it("scenario 1: a plant's plant.json selects that plant and the plant whose baselinesOf names it, and no other", () => {
    const path = "gates/plants/visual/pass-below-fold/plant.json";
    expect(select([path])).toEqual(selected(["visual/pass-below-fold", path], ["visual/fail-below-fold", path]));
  });

  it("scenario 2: a gate entry selects every plant of that gate and no other", () => {
    expect(select(["gates/bin/contrast.ts"])).toEqual(selected(["contrast/fail-x", "gates/bin/contrast.ts"], ["contrast/repository-values", "gates/bin/contrast.ts"]));
  });

  it("scenario 3: a story and a baseline select exactly the repository-content plants, by the first of them", () => {
    expect(select(["storybook/stories/icon.stories.ts", "storybook/baselines/tokens--colour.light.png"])).toEqual(contentBy("storybook/stories/icon.stories.ts"));
  });

  it("scenario 4: shared gate source, the lock file or an unmapped path selects the full set, naming the first such path", () => {
    expect(select(["gates/plants/lint/fail-a/plant.json", "gates/lib/registry.ts", "pnpm-lock.yaml"])).toEqual(full("gates/lib/registry.ts", "shared gate source"));
    expect(select(["pnpm-lock.yaml", "gates/lib/registry.ts"])).toEqual(full("pnpm-lock.yaml", "not mapped"));
    expect(select(["specs/x/tasks.md", "docs/notes.txt"])).toEqual(full("docs/notes.txt", "not mapped"));
  });

  it("scenario 5: a feature's tasks.md and review files select no plant", () => {
    expect(select(["specs/x/tasks.md", "specs/x/reviews/phase-1/red-phase.log", "specs/x/reviews/phase-1/plan.md"])).toEqual(selected());
  });

  it("selects no plant for an empty list", () => {
    expect(select([])).toEqual(selected());
  });

  it("selects no plant for each no-plant path", () => {
    const none = [
      "specs/x/spec.md",
      "ops/016-plants-affected/op.md",
      "triage/016-plants-affected.md",
      "knowledge/speckit-flows/log.md",
      ".claude/skills/speckit-story-implement/SKILL.md",
      ".specify/memory/constitution.md",
      "tooling/speckit/extensions/story/story-config.yml",
      "gates/test/plants.test.ts",
      "gates/test/fixtures/registry/ci.yml",
      "gates/README.md",
      "packages/elements/test/a.test.ts",
      "packages/tokens/test/source.test.ts",
      "storybook/test/a.test.ts",
      "README.md",
      "packages/tokens/README.md",
      "packages/elements/CHANGELOG.md",
      "storybook/README.md",
    ];
    expect(none.map((path) => select([path]))).toEqual(none.map(() => selected()));
  });

  it("gives each no-plant path's near miss its own class", () => {
    expect([
      select(["specs/x/plan.md"]),
      select(["packages/elements/src/a.ts"]),
      select(["packages/elements/src/README.md"]),
      select(["storybook/stories/a.stories.ts"]),
      select(["gates/gates.json"]),
      select(["gates/lib/plants.ts"]),
      select(["gates/testing.ts"]),
      select(["package.json"]),
      select(["packages/tokens/package.json"]),
      select(["packages/elements/tsconfig.json"]),
      select(["storybook/package.json"]),
      select(["opsx/a.md"]),
      select([".github/workflows/other.yml"]),
      select(["docs/README.md"]),
    ]).toEqual([
      contentBy("specs/x/plan.md"),
      contentBy("packages/elements/src/a.ts"),
      contentBy("packages/elements/src/README.md"),
      contentBy("storybook/stories/a.stories.ts"),
      full("gates/gates.json", "shared gate source"),
      full("gates/lib/plants.ts", "shared gate source"),
      full("gates/testing.ts", "not mapped"),
      full("package.json", "not mapped"),
      full("packages/tokens/package.json", "not mapped"),
      full("packages/elements/tsconfig.json", "not mapped"),
      full("storybook/package.json", "not mapped"),
      full("opsx/a.md", "not mapped"),
      full(".github/workflows/other.yml", "not mapped"),
      full("docs/README.md", "not mapped"),
    ]);
  });

  it("selects the repository-content plants for each repository-content path, and only those that exist", () => {
    const paths = [
      "storybook/.storybook/main.ts",
      "storybook/scripts/serve.ts",
      "storybook/baselines/tokens--colour.dark.png",
      "storybook/a11y-exceptions.json",
      "packages/styles/src/base.css",
      "packages/elements/custom-elements.json",
    ];
    expect(paths.map((path) => select([path]))).toEqual(paths.map(contentBy));
    // Operator round 3 (O3-01): a token path also selects every contrast plant, here contrast/fail-x.
    const tokenPaths = ["packages/tokens/src/source.ts", "packages/tokens/fonts/schibsted-grotesk.woff2"];
    expect(tokenPaths.map((path) => select([path]))).toEqual(tokenPaths.map(tokenBy));
    const fewer = plants.filter((plant) => plant.name !== "visual/fail-one-pixel" && plant.name !== "axe/pass-repository");
    const path = "packages/tokens/src/source.ts";
    expect(select([path], fewer)).toEqual(
      selected(["contrast/fail-x", path], ...content.filter((plant) => plant !== "visual/fail-one-pixel" && plant !== "axe/pass-repository").map((plant) => [plant, path] as const)),
    );
  });

  it("selects the full set for package configuration and the other unmapped repository paths", () => {
    const unmapped = ["packages/tokens/tsconfig.build.json", "packages/elements/package.json", "packages/elements/scripts/manifest.ts", "storybook/visual/container.json", ".node-version", "tsconfig.base.json"];
    expect(unmapped.map((path) => select([path]))).toEqual(unmapped.map((path) => full(path, "not mapped")));
  });

  it("selects the full set for gates/bin/plants.ts and the other gate files that are not a gate's entry, and for the lint configurations", () => {
    const shared = ["gates/bin/plants.ts", "gates/bin/baselines.ts", "gates/bin/setup-offline.ts", "gates/bin/no-such-gate.ts", "gates/eslint/rules.ts", "gates/stylelint/config.ts"];
    expect(shared.map((path) => select([path]))).toEqual(shared.map((path) => full(path, "shared gate source")));
  });

  it("selects every registry plant for the workflow, and one registry plant for its own files", () => {
    expect(select([".github/workflows/ci.yml"])).toEqual(selected(["plants/pass-matching", ".github/workflows/ci.yml"], ["plants/fail-gate-without-entry", ".github/workflows/ci.yml"]));
    expect(select(["gates/plants/plants/pass-matching/ci.yml"])).toEqual(selected(["plants/pass-matching", "gates/plants/plants/pass-matching/ci.yml"]));
  });

  it("selects the plants whose baselinesOf names a deleted plant, and not the deleted plant", () => {
    const path = "gates/plants/visual/pass-below-fold/tree/storybook/baselines/a--b.light.png";
    expect(select([path], plants.filter((plant) => plant.name !== "visual/pass-below-fold"))).toEqual(selected(["visual/fail-below-fold", path]));
    expect(select(["gates/plants/lint/fail-gone/plant.json"])).toEqual(selected());
  });

  it("selects the full set for a path under gates/plants/ that is not in a case directory of a registered gate or of the registry", () => {
    const unmapped = ["gates/plants/no-gate/fail-a/plant.json", "gates/plants/README.md", "gates/plants/lint/notes.md", "gates/plants/plants/notes.md"];
    expect(unmapped.map((path) => select([path]))).toEqual(unmapped.map((path) => full(path, "not mapped")));
  });

  it("keeps the first changed path that selected each plant, in the plants' order", () => {
    expect(select(["gates/bin/lint.ts", "gates/plants/lint/fail-a/plant.json"])).toEqual(selected(["lint/fail-a", "gates/bin/lint.ts"], ["lint/pass-b", "gates/bin/lint.ts"]));
    expect(select(["gates/plants/lint/pass-b/plant.json", "specs/x/tasks.md", "gates/bin/lint.ts"])).toEqual(selected(["lint/fail-a", "gates/bin/lint.ts"], ["lint/pass-b", "gates/plants/lint/pass-b/plant.json"]));
  });

  // Added in the green step for the mutation run: each path is a near miss of one class's pattern, at another place
  // in the path or with another ending.
  it("matches each class's pattern from the start of the path and to its end", () => {
    expect([
      select(["specs/016-x/specs/abc/plan.md"]),
      select(["specs/016-x/plan.mdx"]),
      select(["specs/016-x/plan.md/notes.txt"]),
      select(["packages/elements/src/tooling/a.ts"]),
      select(["packages/elements/src/storybook/test/a.ts"]),
      select(["README.mdx"]),
      select(["storybook/stories/packages/a/package.json"]),
      select(["packages/tokens/package.jsonc"]),
      select(["gates/lib/storybook/stories/a.ts"]),
      select(["packages/x/specs/abc/plan.md"]),
      select(["docs/packages/a/src/x.ts"]),
      select(["docs/gates/plants/lint/fail-a/plant.json"]),
      select(["docs/gates/bin/lint.ts"]),
      select(["gates/bin/lint.tsx"]),
      select(["gates/gates.json5"]),
    ]).toEqual([
      selected(),
      selected(),
      selected(),
      contentBy("packages/elements/src/tooling/a.ts"),
      contentBy("packages/elements/src/storybook/test/a.ts"),
      full("README.mdx", "not mapped"),
      contentBy("storybook/stories/packages/a/package.json"),
      tokenBy("packages/tokens/package.jsonc"),
      full("gates/lib/storybook/stories/a.ts", "shared gate source"),
      full("packages/x/specs/abc/plan.md", "not mapped"),
      full("docs/packages/a/src/x.ts", "not mapped"),
      full("docs/gates/plants/lint/fail-a/plant.json", "not mapped"),
      full("docs/gates/bin/lint.ts", "not mapped"),
      full("gates/bin/lint.tsx", "shared gate source"),
      full("gates/gates.json5", "not mapped"),
    ]);
    expect(select(["specs/016-x/plan.md"])).toEqual(contentBy("specs/016-x/plan.md"));
  });

  it("selects by baselinesOf only the plants of the changed plant's own gate", () => {
    const path = "gates/plants/visual/pass-below-fold/plant.json";
    expect(select([path], [...plants, { name: "axe/fail-z", baselinesOf: "pass-below-fold" }])).toEqual(selected(["visual/pass-below-fold", path], ["visual/fail-below-fold", path]));
  });

  it("selects the full set for a full-set path given after selected paths", () => {
    expect(select(["gates/plants/lint/fail-a/plant.json", "gates/bin/contrast.ts", "storybook/stories/a.stories.ts", "storybook/package.json"])).toEqual(full("storybook/package.json", "not mapped"));
  });
});

// Operator round 3 of phase 1 (reviews/phase-1/round-3.md, O3-01 "Widen by gate" and O3-05; spec.md scenarios 12 to
// 14): element paths also select every manifest plant, token paths every contrast, brand-rules and style-lint plant,
// and a gate entry the plants of the gates whose entry imports it. The lists are written here, each result whole.
describe("affectedPlants: element, token and imported gate entry paths (op 016, operator round 3)", () => {
  const gates = ["prefix", "style-lint", "contrast", "brand-rules", "manifest", "storybook-build", "visual", "axe"];
  const plants = [
    { name: "prefix/fail-generic-monospace" },
    { name: "prefix/pass-name-boundaries" },
    { name: "style-lint/fail-hex-colour" },
    { name: "style-lint/pass-var-token" },
    { name: "contrast/text-below-threshold" },
    { name: "contrast/repository-values" },
    { name: "brand-rules/a-monospace" },
    { name: "brand-rules/repository-values" },
    { name: "manifest/pass-reordered" },
    { name: "manifest/fail-stale-property" },
    { name: "manifest/pass-repository" },
    { name: "storybook-build/fail-y" },
    { name: "storybook-build/pass-repository" },
    { name: "visual/pass-repository" },
    { name: "visual/fail-token-changed" },
    { name: "visual/fail-one-pixel" },
    { name: "visual/fail-missing-baseline" },
    { name: "visual/fail-same-pixels-other-bytes" },
    { name: "visual/fail-network" },
    { name: "axe/fail-empty" },
    { name: "axe/pass-repository" },
  ];
  const view = (result: Affected): unknown => ("full" in result ? result : { plants: [...result.plants] });
  const select = (changed: readonly string[]): unknown => view(affectedPlants({ plants, gates, changed }));
  const by = (path: string, names: readonly string[]): (readonly [string, string])[] => names.map((name) => [name, path] as const);
  const element = (path: string): unknown => ({
    plants: [
      ...by(path, ["contrast/repository-values", "brand-rules/repository-values", "manifest/pass-reordered", "manifest/fail-stale-property", "manifest/pass-repository", "storybook-build/pass-repository"]),
      ...by(path, ["visual/pass-repository", "visual/fail-token-changed", "visual/fail-one-pixel", "visual/fail-missing-baseline", "visual/fail-same-pixels-other-bytes", "axe/pass-repository"]),
    ],
  });
  const contentOnly = (path: string): unknown => ({
    plants: [
      ...by(path, ["contrast/repository-values", "brand-rules/repository-values", "manifest/pass-repository", "storybook-build/pass-repository", "visual/pass-repository", "visual/fail-token-changed"]),
      ...by(path, ["visual/fail-one-pixel", "visual/fail-missing-baseline", "visual/fail-same-pixels-other-bytes", "axe/pass-repository"]),
    ],
  });
  const token = (path: string): unknown => ({
    plants: [
      ...by(path, ["style-lint/fail-hex-colour", "style-lint/pass-var-token", "contrast/text-below-threshold", "contrast/repository-values", "brand-rules/a-monospace", "brand-rules/repository-values"]),
      ...by(path, ["manifest/pass-repository", "storybook-build/pass-repository", "visual/pass-repository", "visual/fail-token-changed", "visual/fail-one-pixel", "visual/fail-missing-baseline"]),
      ...by(path, ["visual/fail-same-pixels-other-bytes", "axe/pass-repository"]),
    ],
  });

  it("scenario 12: an element source file or the element manifest selects the repository-content plants and every manifest plant, and no other", () => {
    const paths = ["packages/elements/src/ocelle-brand-mark.ts", "packages/elements/custom-elements.json"];
    expect(paths.map((path) => select([path]))).toEqual(paths.map(element));
  });

  it("scenario 13: the token source or the contrast pairs select the repository-content plants and every contrast, brand-rules and style-lint plant, and no other", () => {
    const paths = ["packages/tokens/src/source.ts", "packages/tokens/contrast/pairs.json"];
    expect(paths.map((path) => select([path]))).toEqual(paths.map(token));
    expect(select(["packages/tokens/package.json"])).toEqual({ full: { path: "packages/tokens/package.json", reason: "not mapped" } });
  });

  it("selects the union for an element path and a token path together, each plant with its first path", () => {
    const [elementPath, tokenPath] = ["packages/elements/src/ocelle-brand-mark.ts", "packages/tokens/src/source.ts"];
    expect(select([elementPath, tokenPath])).toEqual({
      plants: [
        ...by(tokenPath, ["style-lint/fail-hex-colour", "style-lint/pass-var-token", "contrast/text-below-threshold"]),
        ...by(elementPath, ["contrast/repository-values"]),
        ...by(tokenPath, ["brand-rules/a-monospace"]),
        ...by(elementPath, ["brand-rules/repository-values", "manifest/pass-reordered", "manifest/fail-stale-property", "manifest/pass-repository", "storybook-build/pass-repository"]),
        ...by(elementPath, ["visual/pass-repository", "visual/fail-token-changed", "visual/fail-one-pixel", "visual/fail-missing-baseline", "visual/fail-same-pixels-other-bytes", "axe/pass-repository"]),
      ],
    });
  });

  it("still selects only the repository-content plants for a story, a baseline or the base styles", () => {
    const paths = ["storybook/stories/icon.stories.ts", "storybook/baselines/tokens--colour.light.png", "packages/styles/src/base.css"];
    expect(paths.map((path) => select([path]))).toEqual(paths.map(contentOnly));
  });

  it("matches element and token paths from the start of the path", () => {
    const paths = ["packages/styles/src/elements/custom-elements.json", "packages/styles/src/packages/tokens/a.ts", "packages/elements-x/src/a.ts", "storybook/stories/packages/elements/src/a.ts"];
    expect(paths.map((path) => select([path]))).toEqual(paths.map(contentOnly));
  });

  it("scenario 14: gates/bin/prefix.ts selects every prefix plant and every brand-rules plant, whose entry imports it; gates/bin/brand-rules.ts only brand-rules", () => {
    expect(select(["gates/bin/prefix.ts"])).toEqual({
      plants: by("gates/bin/prefix.ts", ["prefix/fail-generic-monospace", "prefix/pass-name-boundaries", "brand-rules/a-monospace", "brand-rules/repository-values"]),
    });
    expect(select(["gates/bin/brand-rules.ts"])).toEqual({ plants: by("gates/bin/brand-rules.ts", ["brand-rules/a-monospace", "brand-rules/repository-values"]) });
  });
});

// Op 016 (Q3 C; spec.md OR-002 and scenario 10): every visual, axe, manifest, contrast and brand-rules case directory
// is pinned here (the last three by operator round 3, O3-01), with the ones whose expectation names repository
// content, so that a new plant fails this test until someone classifies it.
describe("repositoryContentPlants and the visual, axe, manifest, contrast and brand-rules pin (op 016)", () => {
  const plantsDir = new URL("../plants/", import.meta.url);
  const cases = (gate: string): string[] =>
    readdirSync(new URL(`${gate}/`, plantsDir), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  const visualPin = [
    "error-build-fails", "error-host", "error-index-pin", "error-no-engine", "error-tag-pin", "fail-beacon", "fail-below-fold", "fail-cache-api",
    "fail-clipboard-write", "fail-closed-shadow-root", "fail-cookie", "fail-exec-copy", "fail-font-file-missing", "fail-font-not-loaded", "fail-hover-style-changed",
    "fail-indexeddb", "fail-input-system-font", "fail-local-storage", "fail-missing-baseline", "fail-network", "fail-one-pixel", "fail-other-font",
    "fail-overflow-changed", "fail-pointer-target-below-fold", "fail-pointer-target-missing", "fail-popover-changed", "fail-press-style-changed", "fail-random",
    "fail-render-throws", "fail-same-origin-fetch", "fail-same-pixels-other-bytes", "fail-session-storage", "fail-storage-left-by-worker", "fail-storage-property",
    "fail-stray-baseline", "fail-throws-on-load", "fail-token-changed", "fail-websocket", "fail-xhr", "pass-animation-and-caret", "pass-below-fold",
    "pass-focus-below-fold", "pass-hover-and-press", "pass-input-font", "pass-overflow-and-popover", "pass-repository", "pass-second-render", "pass-unused-face",
  ];
  const axePin = [
    "error-bad-exceptions", "error-build-fails", "error-exception-plan-not-a-plan", "fail-closed-shadow-root", "fail-empty", "fail-excepted-second-node",
    "fail-hover-near-fold", "fail-hover-reveals-unlabelled", "fail-incomplete", "fail-no-box", "fail-open-shadow-unlabelled", "fail-outside-root",
    "fail-pointer-target-below-fold", "fail-render-throws", "fail-stale-exception", "fail-throws-on-load", "fail-two-low-contrast", "fail-unlabelled-button",
    "fail-unrecorded-exception", "pass-excepted", "pass-excepted-incomplete", "pass-excepted-shadow", "pass-minor-only", "pass-repository", "pass-second-render",
  ];
  const manifestPin = [
    "break-missing", "break-not-json", "fail-lost-attribute", "fail-stale-property", "fail-undescribed-attribute", "fail-undescribed-css-part",
    "fail-undescribed-css-property", "fail-undescribed-event", "fail-undescribed-property", "fail-undescribed-slot", "pass-reordered", "pass-repository",
  ];
  const contrastPin = [
    "empty-list", "excluded-without-reason", "exempt-disabled-ink", "exempt-not-disabled-ink", "figure-mismatch", "missing-required-pair", "non-text-below-threshold",
    "not-opaque", "repository-values", "required-pair-excluded", "source-throws", "text-below-threshold", "unknown-token", "unparsable-list",
  ];
  const brandRulesPin = [
    "a-monospace", "b-link-equals-accent", "b-ochre-pair-not-excluded", "c-extra-radius", "c-wrong-value", "d-rule-as-boundary", "e-light-chrome",
    "f-delay-marker-misplaced", "f-motion-not-ms", "f-motion-not-zero", "f-motion-spin-missing", "g-forced-colours-override", "g-system-colour-mapping", "generator-throws", "repository-values", "source-invalid", "source-throws",
  ];
  const classified = (gate: string, pin: readonly string[]): string[] => pin.filter((name) => repositoryContentPlants.includes(`${gate}/${name}`));

  it("pins the 48 visual cases, five of them repository content", () => {
    expect({ count: visualPin.length, listed: cases("visual"), content: classified("visual", visualPin) }).toEqual({
      count: 48,
      listed: visualPin,
      content: ["fail-missing-baseline", "fail-one-pixel", "fail-same-pixels-other-bytes", "fail-token-changed", "pass-repository"],
    });
  });

  it("pins the 25 axe cases, one of them repository content", () => {
    expect({ count: axePin.length, listed: cases("axe"), content: classified("axe", axePin) }).toEqual({ count: 25, listed: axePin, content: ["pass-repository"] });
  });

  it("pins the 12 manifest, 14 contrast and 17 brand-rules cases, one of each gate repository content (operator round 3, O3-01)", () => {
    expect([
      { count: manifestPin.length, listed: cases("manifest"), content: classified("manifest", manifestPin) },
      { count: contrastPin.length, listed: cases("contrast"), content: classified("contrast", contrastPin) },
      { count: brandRulesPin.length, listed: cases("brand-rules"), content: classified("brand-rules", brandRulesPin) },
    ]).toEqual([
      { count: 12, listed: manifestPin, content: ["pass-repository"] },
      { count: 14, listed: contrastPin, content: ["repository-values"] },
      { count: 17, listed: brandRulesPin, content: ["repository-values"] },
    ]);
  });

  it("lists the ten repository-content plants in plan order, each an existing plant directory with a plant.json", () => {
    expect(repositoryContentPlants).toEqual([
      "visual/pass-repository",
      "visual/fail-token-changed",
      "visual/fail-one-pixel",
      "visual/fail-missing-baseline",
      "visual/fail-same-pixels-other-bytes",
      "axe/pass-repository",
      "storybook-build/pass-repository",
      "manifest/pass-repository",
      "contrast/repository-values",
      "brand-rules/repository-values",
    ]);
    expect(repositoryContentPlants.filter((plant) => !existsSync(new URL(`${plant}/plant.json`, plantsDir)))).toEqual([]);
  });
});

// Operator round 3 of phase 1 (O3-05; spec.md OR-002 and scenario 15, plan.md *Cross-imports of gate entries*): every
// registered gate entry gates/bin/<id>.ts is read, and each of its relative imports of another registered gate entry
// (static, type or dynamic) is a pair that gateEntryImports must list, so that class 3 selects the importer's plants.
describe("gateEntryImports and the cross-import pin (op 016, operator round 3)", () => {
  const gatesDir = new URL("../", import.meta.url);
  const ids = (JSON.parse(readFileSync(new URL("gates.json", gatesDir), "utf8")) as { readonly id: string }[]).map((gate) => gate.id);
  const entries = ids.filter((id) => existsSync(new URL(`bin/${id}.ts`, gatesDir)));
  /** The registered gate entries a source imports by a relative path: `from "./x.ts"`, `import "./x.ts"` or `import("./x.ts")`. */
  const importsOf = (source: string): string[] => [...source.matchAll(/(?:\bfrom|\bimport)\s*\(?\s*["']\.\/([^"'/]+)\.ts["']/g)].map((match) => String(match[1]));
  const pairs = (): { entry: string; importer: string }[] =>
    entries
      .flatMap((importer) => importsOf(readFileSync(new URL(`bin/${importer}.ts`, gatesDir), "utf8")).filter((entry) => entry !== importer && ids.includes(entry)).map((entry) => ({ entry, importer })))
      .filter((pair, index, all) => all.findIndex((other) => other.entry === pair.entry && other.importer === pair.importer) === index)
      .sort((a, b) => `${a.entry} ${a.importer}`.localeCompare(`${b.entry} ${b.importer}`));

  it("reads every static, type and dynamic relative import, and only of a .ts file in the same directory", () => {
    expect(importsOf('import { a } from "./prefix.ts";\nimport type { B } from "./visual.ts";\nconst c = await import("./axe.ts");\nimport "./csp.ts";\nimport { d } from "../lib/x.ts";\nimport { e } from "./sub/y.ts";\nimport { f } from "node:fs";')).toEqual([
      "prefix",
      "visual",
      "axe",
      "csp",
    ]);
  });

  it("scenario 15: lists exactly the pairs of registered gate entries that import one another, sorted, today prefix imported by brand-rules", () => {
    expect(pairs()).toEqual(gateEntryImports);
    expect(gateEntryImports).toEqual([{ entry: "prefix", importer: "brand-rules" }]);
  });
});
