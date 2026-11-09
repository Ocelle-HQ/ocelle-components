import { describe, expect, it } from "vitest";
import type { Plant } from "../lib/plant-judge.ts";
import { errorText, gateRunsAtOnce, limiter, outputLines, plantValues, resolveLocations, runPlant } from "../lib/plant-runner.ts";
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
