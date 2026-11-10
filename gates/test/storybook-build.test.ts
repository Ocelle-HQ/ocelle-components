import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Io } from "../lib/cli.ts";
import { formatFinding } from "../lib/findings.ts";
import type { GateResult } from "../lib/findings.ts";
import { buildCommand, buildEnv, buildFindings, classifyBuild, cliProblem, storybookBuild } from "../lib/storybook-build.ts";
import type { BuildRun, BuildTools } from "../lib/storybook-build.ts";

// The Storybook build gate's decisions (FR-001, FR-002, FR-017; contracts/gates.md § `storybook-build`; research.md
// R-09), on the outputs Storybook 10.6.5 gave in the phase 1 spike (reviews/phase-1/spike.md § 1, fixtures under
// gates/test/fixtures/storybook-build/<case>/): a failed build's findings at the file the build names, else at
// storybook/package.json; an index error at the story file; an empty index; the CLI check before the build (the only
// signal of missing dependencies); the build command with pnpm's dependency check turned off (operator decision on the
// spike § 4); and the build environment with Storybook's cache below the root under test.
const fixtures = new URL("fixtures/storybook-build/", import.meta.url);
const text = (name: string, file: string): string => readFileSync(new URL(`${name}/${file}`, fixtures), "utf8");

/** The recorded run of a spike case. */
function recorded(name: string): BuildRun {
  return { exitCode: Number(text(name, "exit").trim()), stdout: text(name, "stdout.txt"), stderr: text(name, "stderr.txt") };
}

const okIndex = text("ok", "index.json");
const emptyIndex = text("empty-index", "index.json");

/** A result as the lines the gate prints: findings and summary, or the cause. */
function printed(result: GateResult): { exit: number; lines: string[] } {
  if (result.exit === 0) return { exit: 0, lines: [result.summary] };
  if (result.exit === 1) return { exit: 1, lines: [...result.findings.map(formatFinding), result.summary] };
  return { exit: 2, lines: [result.cause] };
}

describe("buildFindings (spike § 1)", () => {
  it.each([
    {
      name: "syntax-error",
      line: "storybook/stories/tokens.stories.ts: storybook-build: build-error: SyntaxError: Unexpected token (26:49)",
    },
    {
      name: "syntax-error-imported",
      line: "storybook/stories/helper.ts: storybook-build: build-error: [builtin:vite-transform] Unexpected token",
    },
    {
      name: "unresolved-import",
      line: "storybook/stories/base.stories.ts: storybook-build: build-error: [UNRESOLVED_IMPORT] Could not resolve './no-such-module.ts' in stories/base.stories.ts",
    },
    {
      name: "not-csf",
      line: "storybook/stories/not-csf.stories.ts: storybook-build: index-error: NoMetaError: CSF: missing default export",
    },
  ])("finds exactly one finding at the file the $name build names, its message free of colour codes", ({ name, line }) => {
    expect(buildFindings(recorded(name)).map(formatFinding)).toEqual([line]);
  });

  it("parses missing-deps-no-verify (exit 127, storybook: not found, no file named) as build-error at storybook/package.json, which is why the CLI check comes first", () => {
    expect(buildFindings(recorded("missing-deps-no-verify")).map(formatFinding)).toEqual([
      "storybook/package.json: storybook-build: build-error: the build failed with exit code 127 and named no file",
    ]);
  });

  it("places a failed build that names no file at storybook/package.json, with its exit code or the signal", () => {
    expect([
      buildFindings({ exitCode: 1, stdout: "", stderr: "" }).map(formatFinding),
      buildFindings({ exitCode: null, stdout: "", stderr: "" }).map(formatFinding),
    ]).toEqual([
      ["storybook/package.json: storybook-build: build-error: the build failed with exit code 1 and named no file"],
      ["storybook/package.json: storybook-build: build-error: the build was ended by a signal and named no file"],
    ]);
  });

  it("finds every error of one output, in order, each at its own file", () => {
    const run: BuildRun = {
      exitCode: 1,
      stdout: `${recorded("not-csf").stdout}\n${recorded("unresolved-import").stdout}`,
      stderr: "",
    };
    expect(buildFindings(run).map((finding) => `${formatFinding(finding).split(": ").slice(0, 3).join(": ")}`)).toEqual([
      "storybook/stories/not-csf.stories.ts: storybook-build: index-error",
      "storybook/stories/base.stories.ts: storybook-build: build-error",
    ]);
  });

  it("reads the indexer's error line after its Unable to index line, whatever the line prefix, and a Vite error at its ╭─[ location", () => {
    const run: BuildRun = {
      exitCode: 1,
      stdout: [
        "!  Unable to index ./stories/a.stories.ts:",
        "",
        "|  SyntaxError: Missing semicolon. (3:4)",
        "x  Error: Unable to index ./stories/a.stories.ts",
        "x  Build failed with 1 error:",
        "|  [PARSE_ERROR] Expected a semicolon",
        "|  ╭─[ stories/b.ts:2:1 ]",
      ].join("\n"),
      stderr: "",
    };
    expect(buildFindings(run).map(formatFinding)).toEqual([
      "storybook/stories/a.stories.ts: storybook-build: build-error: SyntaxError: Missing semicolon. (3:4)",
      "storybook/stories/b.ts: storybook-build: build-error: [PARSE_ERROR] Expected a semicolon",
    ]);
  });
});

describe("classifyBuild", () => {
  it("passes the repository's build with the number of stories in the built index", () => {
    expect(printed(classifyBuild(recorded("ok"), okIndex))).toEqual({ exit: 0, lines: ["storybook-build: built 12 stories"] });
  });

  it("passes a build with a type error only: the build does not type-check (pass-type-error-only)", () => {
    expect(printed(classifyBuild(recorded("type-error-only"), okIndex))).toEqual({ exit: 0, lines: ["storybook-build: built 12 stories"] });
  });

  it("names one story in the singular", () => {
    const one = JSON.stringify({ v: 5, entries: { "a--b": { type: "story", id: "a--b" } } });
    expect(printed(classifyBuild({ exitCode: 0, stdout: "", stderr: "" }, one))).toEqual({ exit: 0, lines: ["storybook-build: built 1 story"] });
  });

  it("fails a successful build whose index holds no story (empty-index), and one with docs entries only", () => {
    const docsOnly = JSON.stringify({ v: 5, entries: { "a--docs": { type: "docs", id: "a--docs" } } });
    const expected = {
      exit: 1,
      lines: ["storybook/dist/index.json: storybook-build: empty-index: the built index holds no story", "storybook-build: 1 finding in 1 file"],
    };
    expect([printed(classifyBuild(recorded("empty-index"), emptyIndex)), printed(classifyBuild(recorded("ok"), docsOnly))]).toEqual([expected, expected]);
  });

  it("fails a failed build with its findings and a summary of findings and files, and does not read the index", () => {
    expect(printed(classifyBuild(recorded("unresolved-import"), okIndex))).toEqual({
      exit: 1,
      lines: [
        "storybook/stories/base.stories.ts: storybook-build: build-error: [UNRESOLVED_IMPORT] Could not resolve './no-such-module.ts' in stories/base.stories.ts",
        "storybook-build: 1 finding in 1 file",
      ],
    });
    const two: BuildRun = { exitCode: 1, stdout: `${recorded("not-csf").stdout}\n${recorded("unresolved-import").stdout}`, stderr: "" };
    expect(printed(classifyBuild(two, undefined)).lines.at(-1)).toBe("storybook-build: 2 findings in 2 files");
  });

  it("could not run when a successful build left no index, or an index it cannot read", () => {
    expect([
      printed(classifyBuild(recorded("ok"), undefined)),
      printed(classifyBuild(recorded("ok"), '{"v":5}')),
    ]).toEqual([
      { exit: 2, lines: ["storybook-build: could not run: the build wrote no storybook/dist/index.json"] },
      { exit: 2, lines: ["storybook-build: could not run: storybook/dist/index.json has no entries"] },
    ]);
  });
});

describe("cliProblem (research.md R-09: checked before the build, in this order)", () => {
  const manifest = JSON.stringify({ name: "@ocelle/storybook", scripts: { build: "storybook build" } });

  it("lets the build run when storybook/package.json has a build script and Storybook is installed", () => {
    expect(cliProblem(manifest, true)).toBeUndefined();
  });

  it.each([
    { name: "no storybook/package.json", packageJson: undefined, installed: true, cause: "storybook/package.json is missing; restore it from git" },
    { name: "a storybook/package.json that is not JSON", packageJson: "{", installed: true, cause: "storybook/package.json is not valid JSON; fix it" },
    { name: "no scripts", packageJson: "{}", installed: true, cause: "storybook/package.json has no build script" },
    { name: "a manifest that is a list", packageJson: "[]", installed: true, cause: "storybook/package.json has no build script" },
    { name: "scripts that are null", packageJson: '{"scripts":null}', installed: true, cause: "storybook/package.json has no build script" },
    { name: "no build script", packageJson: '{"scripts":{"prebuild":"x"}}', installed: true, cause: "storybook/package.json has no build script" },
    { name: "an empty build script", packageJson: '{"scripts":{"build":""}}', installed: true, cause: "storybook/package.json has no build script" },
    { name: "a build script that is not text", packageJson: '{"scripts":{"build":1}}', installed: true, cause: "storybook/package.json has no build script" },
    { name: "Storybook not resolvable", packageJson: manifest, installed: false, cause: "storybook is not installed; run pnpm install" },
    { name: "both, the manifest first", packageJson: '{"scripts":{}}', installed: false, cause: "storybook/package.json has no build script" },
  ])("stops the gate on $name", ({ packageJson, installed, cause }) => {
    expect(cliProblem(packageJson, installed)).toBe(cause);
  });
});

describe("buildCommand and buildEnv (research.md R-09, R-16)", () => {
  it("runs the workspace's own build script through pnpm with its dependency check turned off (operator decision on the spike § 4)", () => {
    expect(buildCommand()).toEqual({ command: "pnpm", args: ["--config.verify-deps-before-run=false", "--dir", "storybook", "run", "build"] });
  });

  it("sets CACHE_DIR to the root's storybook/.cache and keeps every other variable, without changing the given environment", () => {
    const env: Io["env"] = { PATH: "/usr/bin", HOME: "/home/a", CACHE_DIR: "/elsewhere", EMPTY: undefined };
    expect(buildEnv("/work/root", env)).toEqual({ PATH: "/usr/bin", HOME: "/home/a", CACHE_DIR: "/work/root/storybook/.cache", EMPTY: undefined });
    expect(env.CACHE_DIR).toBe("/elsewhere");
    expect(buildEnv("/r", {})).toEqual({ CACHE_DIR: "/r/storybook/.cache" });
  });
});

describe("storybookBuild (the gate on a root)", () => {
  const manifest = JSON.stringify({ scripts: { build: "storybook build" } });

  interface World {
    readonly files?: Readonly<Record<string, string>>;
    readonly existing?: readonly string[];
    readonly run?: BuildRun | Error;
  }

  const installed = ["storybook/node_modules/storybook/package.json", "storybook/node_modules/.bin/storybook"];

  function gate(world: World): { done: Promise<GateResult>; calls: string[] } {
    const calls: string[] = [];
    const files = world.files ?? { "storybook/package.json": manifest, "storybook/dist/index.json": okIndex };
    const existing = world.existing ?? installed;
    const tools: BuildTools = {
      read: (path) => {
        calls.push(`read ${path}`);
        return Promise.resolve(files[path]);
      },
      exists: (path) => {
        calls.push(`exists ${path}`);
        return Promise.resolve(existing.includes(path));
      },
      run: (command, args, env) => {
        calls.push(`run ${command} ${args.join(" ")} CACHE_DIR=${String(env.CACHE_DIR)} PATH=${String(env.PATH)}`);
        const ran = world.run ?? recorded("ok");
        return ran instanceof Error ? Promise.reject(ran) : Promise.resolve(ran);
      },
    };
    return { done: storybookBuild("/work/root", { PATH: "/usr/bin" }, tools), calls };
  }

  it("checks the workspace, builds with the command and environment, reads the built index and passes", async () => {
    const { done, calls } = gate({});
    expect(printed(await done)).toEqual({ exit: 0, lines: ["storybook-build: built 12 stories"] });
    expect(calls).toEqual([
      "read storybook/package.json",
      "exists storybook/node_modules/storybook/package.json",
      "exists storybook/node_modules/.bin/storybook",
      "run pnpm --config.verify-deps-before-run=false --dir storybook run build CACHE_DIR=/work/root/storybook/.cache PATH=/usr/bin",
      "read storybook/dist/index.json",
    ]);
  });

  it.each([
    { name: "the Storybook CLI's package.json", existing: [installed[1]] },
    { name: "the Storybook CLI's bin link", existing: [installed[0]] },
    { name: "both", existing: [] },
  ])("could not run, and builds nothing, without $name in storybook/node_modules", async ({ existing }) => {
    const { done, calls } = gate({ existing: existing.map(String) });
    expect(printed(await done)).toEqual({ exit: 2, lines: ["storybook-build: could not run: storybook is not installed; run pnpm install"] });
    expect(calls.filter((call) => call.startsWith("run ") || call.endsWith("index.json"))).toEqual([]);
  });

  it.each([
    { name: "no storybook/package.json", files: {}, cause: "storybook-build: could not run: storybook/package.json is missing; restore it from git" },
    { name: "no build script", files: { "storybook/package.json": '{"scripts":{}}' }, cause: "storybook-build: could not run: storybook/package.json has no build script" },
  ])("could not run, and builds nothing, with $name", async ({ files, cause }) => {
    const { done, calls } = gate({ files });
    expect(printed(await done)).toEqual({ exit: 2, lines: [cause] });
    expect(calls.filter((call) => call.startsWith("run "))).toEqual([]);
  });

  it("could not run when pnpm cannot be started", async () => {
    const { done } = gate({ run: Object.assign(new Error("spawn pnpm ENOENT"), { code: "ENOENT" }) });
    expect(printed(await done)).toEqual({ exit: 2, lines: ["storybook-build: could not run: pnpm could not be started (spawn pnpm ENOENT); install pnpm"] });
  });

  it("fails with the build's findings and does not read the index of a failed build", async () => {
    const { done, calls } = gate({ run: recorded("not-csf") });
    expect(printed(await done)).toEqual({
      exit: 1,
      lines: ["storybook/stories/not-csf.stories.ts: storybook-build: index-error: NoMetaError: CSF: missing default export", "storybook-build: 1 finding in 1 file"],
    });
    expect(calls.at(-1)?.startsWith("run ")).toBe(true);
  });

  it("fails a successful build of an empty index", async () => {
    const { done } = gate({ files: { "storybook/package.json": manifest, "storybook/dist/index.json": emptyIndex }, run: recorded("empty-index") });
    expect(printed(await done).lines[0]).toBe("storybook/dist/index.json: storybook-build: empty-index: the built index holds no story");
  });
});
