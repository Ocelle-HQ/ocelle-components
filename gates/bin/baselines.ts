// The baseline command, `pnpm run visual:update` (FR-008; contracts/gates.md § `visual:update`; research.md R-11):
// the visual gate's engine resolution, pin check, build and two runs, then the update plan: it writes nothing and
// exits 1 when any story-theme ends at a refusing step, else writes every new or changed baseline, removes the stray
// ones and prints the summary line. With `--plant visual/<name> [--story <id>]` it materialises the plant's root as
// the plant job does and writes that plant's own stories' baselines into its tree/storybook/baselines/. The decisions
// are gates/lib/visual-verdict.ts; this entry and gates/lib/visual-host.ts only run the engines and move files (the
// process boundary, tested by gates/test/integration/visual.test.ts).
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { formatFinding, plural } from "../lib/findings.ts";
import { filePaths } from "../lib/entries.ts";
import { parsePlant } from "../lib/plant-judge.ts";
import type { Plant } from "../lib/plant-judge.ts";
import { buildRepoTree } from "../lib/plant-repo.ts";
import { buildStories, captureRuns, engines, pinCheck, readBaselines, readPin } from "../lib/visual-host.ts";
import { judge, ownStories, parseUpdateArgs, plantBaselinesDir, plantModeProblem, plantRequests, storyThemes, strayBaselines, themes, updatePlan, updateSummary } from "../lib/visual-verdict.ts";
import type { CaptureRequest, UpdateArgs } from "../lib/visual-verdict.ts";

/** Where an update captures (`root`), which requests, which baselines it judges (`dir`) and the story-themes it knows. */
interface Target {
  readonly root: string;
  readonly requests: readonly CaptureRequest[];
  readonly dir: string;
  readonly known: readonly string[];
}

/** Applies the update plan of a target; the exit code. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
async function update(target: Target, engine: string, io: Io, fail: (cause: string) => number): Promise<number> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  const resolved = await engines(engine, io.env);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  if (resolved.kind === "error") return fail(resolved.cause);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  const pin = await readPin(target.root);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  if ("cause" in pin) return fail(pin.cause);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  const pinned = resolved.kind === "engines" ? await pinCheck(resolved.engines, pin.value, io.env) : undefined;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  if (pinned !== undefined) return fail(pinned);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  const runs = await captureRuns(target.root, resolved, pin.value, target.requests, io.env);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  if ("cause" in runs) return fail(runs.cause);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  const [run1, run2] = runs.value;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  const baselines = await readBaselines(target.dir);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  const verdicts = judge(target.requests.flatMap((request) => storyThemes(request)), run1, run2, baselines);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  const stray = strayBaselines([...baselines.keys()], storyThemes({ stories: target.known, themes }));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  const plan = updatePlan(verdicts, run1, stray, target.dir);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  if ("refuse" in plan) {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
    for (const finding of plan.refuse) io.out(formatFinding(finding));
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
    io.out(`baselines: wrote nothing: ${plural(plan.refuse.length, "finding")}`);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
    return 1;
  }
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
  for (const file of plan.write) await writeFile(join(target.dir, file.file), file.bytes);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
  for (const file of plan.remove) await rm(join(target.dir, file));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  io.out(updateSummary(plan));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  return 0;
}

/** The plant mode: the plant's root built in a temporary directory, its own stories captured, its tree's baselines updated. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
async function plantMode(repo: string, args: UpdateArgs & { readonly plant: string }, io: Io, fail: (cause: string) => number): Promise<number> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
  const dir = join(repo, "gates/plants", args.plant);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
  const text = await readFile(join(dir, "plant.json"), "utf8").catch(() => undefined);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
  const parsed = text === undefined ? undefined : parsePlant(text);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
  if (typeof parsed === "string") return fail(`gates/plants/${args.plant}/plant.json: ${parsed}`);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
  const spec: Plant | undefined = parsed;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
  const problem = plantModeProblem(args.plant, spec, args.story);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
  if (problem !== undefined) return fail(problem);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
  const into = await mkdtemp(join(tmpdir(), "ocelle-plant-visual-"));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
  try {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
    await buildRepoTree(repo, dir, into, spec);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
    const stories = await buildStories(into, io.env);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
    if ("cause" in stories) return fail(stories.cause);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
    const tree = join(dir, "tree");
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
    const own = ownStories(stories.value, filePaths(await readdir(tree, { recursive: true, withFileTypes: true }).catch(() => []), tree));
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
    const requests = plantRequests(args.plant, own, args.story);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
    if ("cause" in requests) return fail(requests.cause);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
    return await update({ root: into, requests, dir: join(repo, plantBaselinesDir(args.plant)), known: own }, args.engine, io, fail);
  } finally {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
    await rm(into, { recursive: true, force: true });
  }
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
export async function run(argv: readonly string[], io: Io): Promise<number> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  const context = parseArgs(argv, io.cwd);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  const fail = (cause: string): number => {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
    io.err(`baselines: could not run: ${cause}`);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
    return 2;
  };
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  const args = parseUpdateArgs(context.args);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  if ("cause" in args) return fail(args.cause);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)"
  if (args.plant !== undefined) return plantMode(context.root, { ...args, plant: args.plant }, io, fail);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  const stories = await buildStories(context.root, io.env);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  if ("cause" in stories) return fail(stories.cause);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  const ids = stories.value.map((story) => story.id);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
  return update({ root: context.root, requests: [{ stories: ids, themes }], dir: join(context.root, "storybook/baselines"), known: ids }, args.engine, io, fail);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "writes nothing on an unchanged tree and says so (FR-008, analysis G1)"
if (import.meta.main) await main(run);
