import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { Plant } from "../lib/plant-judge.ts";
import { aloneDecision, containerDecision, engineValue, errorText, failedOwn, gateRunsAtOnce, keptPlantDir, limiter, needsEngine, outputLines, otherShardSize, plantShards, plantTimeNote, plantValues, resolveLocations, runPlant, shardSize } from "../lib/plant-runner.ts";
import type { BuiltRepo, RunnerTools, TreeView } from "../lib/plant-runner.ts";
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
    build: { "repo-tree": build("repo-tree"), "commit-repo": build("commit-repo"), "mutation-repo": build("mutation-repo"), workspace: build("workspace") },
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
    expect({
      counts: { visual: plants.filter((plant) => plant.startsWith("visual/")).length, axe: plants.filter((plant) => plant.startsWith("axe/")).length, others },
      shards: shards.length,
      otherSizes: shards.slice(0, otherShards).map((shard) => shard.length <= 80 && shard.every((plant) => !plant.startsWith("visual/") && !plant.startsWith("axe/"))),
      visualAndAxe: shards.slice(otherShards),
    }).toEqual({
      counts: { visual: 48, axe: 25, others: 228 },
      shards: 3 + 48 + 25,
      otherSizes: [true, true, true],
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
