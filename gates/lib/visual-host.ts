// The host side of the visual gate and the baseline command (FR-009, FR-026; contracts/gates.md § `visual`,
// § `visual:update`; contracts/container.md; research.md R-03, R-06, R-11): which engines are available, the pin check
// through the engine, the Storybook build of the root, the two capture runs in the pinned container (or the host's
// refused one), and the files of storybook/.visual/ and storybook/baselines/. gates/bin/visual.ts, gates/bin/baselines.ts
// and the plant job share it. Every decision is in gates/lib/container.ts, gates/lib/visual-verdict.ts and
// gates/lib/storybook-build.ts; this module only runs commands and moves files (the process boundary, covered by
// gates/test/integration/visual.test.ts and the visual plants).
import { access, constants, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Io } from "./cli.ts";
import { inspectProblem, mediaTypeProblem, parsePin, pinCommands, referenceProblem, resolveEngine, runArgs, runDir } from "./container.ts";
import type { Pin, Resolved } from "./container.ts";
import { runTool } from "./spawn.ts";
import { storybookBuild } from "./storybook-build.ts";
import { parseIndex } from "./storybook-index.ts";
import type { IndexStory } from "./storybook-index.ts";
import { parseResult } from "./visual-verdict.ts";
import type { Capture, CaptureRequest, KeptFile } from "./visual-verdict.ts";

/** The gate's own repository: the directory holding the running gates/ (research.md R-03). */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
export const gateRepository = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** A cause that stops a run (exit 2), or a value. */
export type Outcome<T> = { readonly value: T } | { readonly cause: string };

/** Whether an engine can run: an executable on PATH (or the path named) whose `info` command succeeds. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 naming a missing engine, and in CI refuses a single engine (research.md R-06)" and gates/test/integration/plants.test.ts "exits 2 naming each visual plant it could not run when PATH holds neither docker nor podman"
async function available(name: string, env: Io["env"]): Promise<boolean> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "exits 2 naming each visual plant it could not run when PATH holds neither docker nor podman"
  const candidates = name.includes("/") ? [name] : (env.PATH ?? "").split(":").filter((dir) => dir !== "").map((dir) => join(dir, name));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "exits 2 naming each visual plant it could not run when PATH holds neither docker nor podman"
  let found = false;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "exits 2 naming each visual plant it could not run when PATH holds neither docker nor podman"
  for (const path of candidates) found ||= await access(path, constants.X_OK).then(() => true, () => false);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 naming a missing engine, and in CI refuses a single engine (research.md R-06)"
  if (!found) return false;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  return (await runTool(name, ["info"], gateRepository, env).catch(() => ({ exitCode: 1 }))).exitCode === 0;
}

/** The engines of an `--engine` choice in an environment (contracts/container.md § Engine resolution). */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 naming a missing engine, and in CI refuses a single engine (research.md R-06)"
export async function engines(choice: string, env: Io["env"]): Promise<Resolved> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 naming a missing engine, and in CI refuses a single engine (research.md R-06)"
  const names = [...new Set(["docker", "podman", choice])].filter((name) => !["auto", "both", "host"].includes(name));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 naming a missing engine, and in CI refuses a single engine (research.md R-06)"
  const found = new Set<string>();
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 naming a missing engine, and in CI refuses a single engine (research.md R-06)"
  for (const name of names) if (await available(name, env)) found.add(name);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 naming a missing engine, and in CI refuses a single engine (research.md R-06)"
  return resolveEngine(choice, env, (name) => found.has(name));
}

/** The root's pin (storybook/visual/container.json). */
// Stryker disable next-line all: process boundary, covered by the visual plants error-tag-pin and error-index-pin
export async function readPin(root: string): Promise<Outcome<Pin>> {
  // Stryker disable next-line all: process boundary, covered by the visual plants error-tag-pin and error-index-pin
  return readFile(join(root, "storybook/visual/container.json"), "utf8").then((text) => ({ value: parsePin(text) }), (error: unknown) => ({ cause: `storybook/visual/container.json cannot be read (${error instanceof Error ? error.message : String(error)})` }));
}

/** The pin check under each engine (contracts/container.md § The pin check): the cause that stops the run, or undefined. */
// Stryker disable next-line all: process boundary, covered by the visual plants error-tag-pin and error-index-pin, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
export async function pinCheck(names: readonly string[], pin: Pin, env: Io["env"]): Promise<string | undefined> {
  // Stryker disable next-line all: process boundary, covered by the visual plant error-tag-pin
  const form = referenceProblem(pin);
  // Stryker disable next-line all: process boundary, covered by the visual plant error-tag-pin
  if (form !== undefined) return form;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  for (const engine of new Set(names)) {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    const commands = pinCommands(engine, pin);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    const run = (argv: readonly string[]): ReturnType<typeof runTool> => runTool(String(argv[0]), argv.slice(1), gateRepository, env);
    // Stryker disable next-line all: process boundary, covered by the visual plant error-index-pin
    const media = await run(commands.mediaType);
    // Stryker disable next-line all: process boundary, covered by the visual plant error-index-pin
    const mediaProblem = media.exitCode === 0 ? mediaTypeProblem(media.stdout) : `the image cannot be obtained: ${lastLine(media.stderr)}`;
    // Stryker disable next-line all: process boundary, covered by the visual plant error-index-pin
    if (mediaProblem !== undefined) return mediaProblem;
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    const pull = await run(commands.pull);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    if (pull.exitCode !== 0) return `the image cannot be obtained: ${lastLine(pull.stderr)}`;
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    const inspected = await run(commands.inspect);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    const identity = inspectProblem(engine, inspected.stdout, pin);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    if (identity !== undefined) return identity;
  }
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  return undefined;
}

/** The last non-empty line of a text, or a word saying there is none. */
// Stryker disable next-line all: process boundary, covered by the visual plants error-host and error-no-engine
function lastLine(text: string): string {
  // Stryker disable next-line all: process boundary, covered by the visual plants error-host and error-no-engine
  return text.split("\n").map((line) => line.trim()).filter((line) => line !== "").at(-1) ?? "no output";
}

/** Builds the root's Storybook with the storybook-build gate's build function (research.md R-03); its stories. */
// Stryker disable next-line all: process boundary, covered by the visual plant error-build-fails and gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
export async function buildStories(root: string, env: Io["env"]): Promise<Outcome<IndexStory[]>> {
  // Stryker disable next-line all: process boundary, covered by the visual plant error-build-fails
  const built = await storybookBuild(root, env, {
    // Stryker disable next-line all: process boundary, covered by the visual plant error-build-fails
    read: (path) => readFile(join(root, path), "utf8").catch(() => undefined),
    // Stryker disable next-line all: process boundary, covered by the visual plant error-build-fails
    exists: (path) => access(join(root, path)).then(() => true, () => false),
    // Stryker disable next-line all: process boundary, covered by the visual plant error-build-fails
    run: (command, args, buildEnv) => runTool(command, args, root, buildEnv),
  });
  // Stryker disable next-line all: process boundary, covered by the visual plant error-build-fails
  if (built.exit !== 0) return { cause: "the Storybook build failed; run pnpm run gate:storybook-build" };
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  return { value: parseIndex(await readFile(join(root, "storybook/dist/index.json"), "utf8")) };
}

/** One request of one run: the capture under an engine (or on the host) and its captures read back. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
async function captureRequest(root: string, run: number, engine: string, pin: Pin, request: CaptureRequest, env: Io["env"]): Promise<Outcome<Capture[]>> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const out = runDir(root, run);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  await mkdir(join(out, "home"), { recursive: true });
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const requestFile = join(out, "request.json");
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  await writeFile(requestFile, `${JSON.stringify({ dist: join(root, "storybook/dist"), out, stories: request.stories, themes: request.themes })}\n`);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)"
  const hostEnv = Object.fromEntries(Object.entries(env).filter(([name]) => name !== "OCELLE_VISUAL_PIN"));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const ran =
    engine === "host"
      ? await runTool(process.execPath, [join(gateRepository, "gates/visual/capture.ts"), requestFile], gateRepository, hostEnv)
      : await runTool(engine, runArgs({ engine, repo: gateRepository, root, run, uid: process.getuid?.() ?? 0, gid: process.getgid?.() ?? 0, pin }), gateRepository, env);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)"
  if (engine === "host" && ran.exitCode === 0) return { cause: "the host engine never produces a capture" };
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)"
  if (ran.exitCode !== 0) return { cause: lastLine(ran.stderr) };
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const entries = parseResult(await readFile(join(out, "result.json"), "utf8"));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const captures: Capture[] = [];
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  for (const entry of entries) captures.push(entry.file === undefined ? { entry } : { entry, bytes: await readFile(join(out, entry.file)) });
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  return { value: captures };
}

/**
 * The two runs of the requests: run 1 under the first engine, run 2 under the second (the host engine runs once and
 * is refused); the run directories are removed afterwards.
 */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
export async function captureRuns(root: string, resolved: Resolved, pin: Pin, requests: readonly CaptureRequest[], env: Io["env"]): Promise<Outcome<readonly [Capture[], Capture[]]>> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 naming a missing engine, and in CI refuses a single engine (research.md R-06)"
  if (resolved.kind === "error") return { cause: resolved.cause };
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const runs: Capture[][] = [];
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  try {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    for (const run of [1, 2]) {
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      const engine = resolved.kind === "host" ? "host" : resolved.engines[run - 1] ?? "docker";
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      const captures: Capture[] = [];
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      for (const request of requests) {
        // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
        const done = await captureRequest(root, run, engine, pin, request, env);
        // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)"
        if ("cause" in done) return done;
        // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
        captures.push(...done.value);
      }
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      runs.push(captures);
    }
  } finally {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    for (const run of [1, 2]) await rm(runDir(root, run), { recursive: true, force: true });
  }
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  return { value: [runs[0] ?? [], runs[1] ?? []] };
}

/** The files of a baselines directory by name (none when it does not exist). */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "keeps the capture, its diff image and run 1 in baseline layout for differs and missing-baseline, and nothing for any other story-theme (FR-005, analysis G2)"
export async function readBaselines(dir: string): Promise<Map<string, Uint8Array>> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "keeps the capture, its diff image and run 1 in baseline layout for differs and missing-baseline, and nothing for any other story-theme (FR-005, analysis G2)"
  const names = (await readdir(dir, { withFileTypes: true }).catch(() => [])).filter((entry) => entry.isFile()).map((entry) => entry.name);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "keeps the capture, its diff image and run 1 in baseline layout for differs and missing-baseline, and nothing for any other story-theme (FR-005, analysis G2)"
  return new Map(await Promise.all(names.map(async (name) => [name, await readFile(join(dir, name))] as const)));
}

/** Clears the root's storybook/.visual/ of an earlier run, but the plant job's captures (storybook/.visual/plants/). */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "keeps the capture, its diff image and run 1 in baseline layout for differs and missing-baseline, and nothing for any other story-theme (FR-005, analysis G2)"
export async function clearVisual(root: string): Promise<void> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "keeps the capture, its diff image and run 1 in baseline layout for differs and missing-baseline, and nothing for any other story-theme (FR-005, analysis G2)"
  const dir = join(root, "storybook/.visual");
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "keeps the capture, its diff image and run 1 in baseline layout for differs and missing-baseline, and nothing for any other story-theme (FR-005, analysis G2)"
  for (const name of await readdir(dir).catch(() => [])) if (name !== "plants") await rm(join(dir, name), { recursive: true, force: true });
}

/** Writes files below a directory, making the directories they need. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "keeps the capture, its diff image and run 1 in baseline layout for differs and missing-baseline, and nothing for any other story-theme (FR-005, analysis G2)"
export async function writeFiles(dir: string, files: readonly KeptFile[]): Promise<void> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "keeps the capture, its diff image and run 1 in baseline layout for differs and missing-baseline, and nothing for any other story-theme (FR-005, analysis G2)"
  for (const file of files) {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "keeps the capture, its diff image and run 1 in baseline layout for differs and missing-baseline, and nothing for any other story-theme (FR-005, analysis G2)"
    await mkdir(dirname(join(dir, file.path)), { recursive: true });
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "keeps the capture, its diff image and run 1 in baseline layout for differs and missing-baseline, and nothing for any other story-theme (FR-005, analysis G2)"
    await writeFile(join(dir, file.path), file.bytes);
  }
}
