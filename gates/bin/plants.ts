// The plant job (FR-025, research.md R-10, contracts/plants.md): first the registry check (gates/gates.json, the
// gate jobs of .github/workflows/ci.yml and the FR-020 list must be one set), then every plant of every registered
// gate under gates/plants/<gate-id>/<case>/, run through the gate in normal mode on a temporary repository built
// from the plant (pins: on a copy of its mini-workspace), and judged against its plant.json; then the registry's own
// plants under gates/plants/plants/. The job fails when a gate does not do what a plant expects, a gate lacks a
// fail, pass or breaking plant, a plant.json is missing or invalid, or a plant carries gate configuration.
// plants() is the decision, tested in process on recorded gate runs (gates/test/plants.test.ts), with the judging of
// gates/lib/plant-judge.ts and the runner of gates/lib/plant-runner.ts; realTools() only hands it the file system, the
// plant builders of gates/lib/plant-repo.ts and gate processes (the process boundary, run end to end by
// gates/test/integration/plants.test.ts).
import { cp, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { availableParallelism, tmpdir } from "node:os";
import { join } from "node:path";
import { main, parseArgs } from "../lib/cli.ts";
import type { Context, Io } from "../lib/cli.ts";
import { directoryNames, filePaths } from "../lib/entries.ts";
import { emit, formatFinding, plural } from "../lib/findings.ts";
import { judgePlant, parsePlant } from "../lib/plant-judge.ts";
import type { Plant, PlantRun } from "../lib/plant-judge.ts";
import { buildCommitRepo, buildMutationRepo, buildRepoTree, carriesConfiguration } from "../lib/plant-repo.ts";
import { gateRunsAtOnce, limiter, runPlant } from "../lib/plant-runner.ts";
import type { RunnerTools } from "../lib/plant-runner.ts";
import { checkRegistry, ciJobs, parseRegistry, plantJob } from "../lib/registry.ts";
import type { Gate } from "../lib/registry.ts";
import { runTool } from "../lib/spawn.ts";

export { judgePlant, parsePlant, plantArgs } from "../lib/plant-judge.ts";
export type { ExpectedFinding, ExpectedRecord, Plant, PlantRun } from "../lib/plant-judge.ts";

const gateId = "plants";
const registryPath = "gates/gates.json";
const workflowPath = ".github/workflows/ci.yml";
const plantsDir = "gates/plants";
const kinds = ["fail", "pass", "error"] as const;

/** The tools the plant job uses, in the repository root. */
export interface PlantTools {
  /** Reads a file (path relative to the root); undefined when it does not exist. */
  readonly read: (path: string) => Promise<string | undefined>;
  /** The names of the directories directly in a directory (path relative to the root); empty when it does not exist. */
  readonly dirs: (path: string) => Promise<readonly string[]>;
  /** Every file below a directory (path relative to the root), as paths relative to that directory. */
  readonly files: (path: string) => Promise<readonly string[]>;
  /** Builds the plant's temporary repository and runs the gate's plant command on it, as its plant.json asks. */
  readonly runPlant: (gate: Gate, plant: string, spec: Plant) => Promise<PlantRun>;
}

/** The rule of a plant that did not do what it expects. */
const missed = { fail: "not-caught", pass: "not-accepted", error: "not-reported-broken" } as const;

/** The registry check on a registry plant's gates.json and ci.yml, as a gate run (exit 0, 1 or 2). */
function registryRun(registryText: string | undefined, workflow: string | undefined): PlantRun {
  const broken = (cause: string): PlantRun => ({
    exit: 2,
    // Stryker disable next-line ArrayDeclaration: equivalent, the verdict reads a run's stdout only for lines of this gate, and any other text there is ignored
    stdout: [],
    stderr: [`${gateId}: could not run: ${cause}`],
  });
  if (registryText === undefined) return broken("gates.json is missing");
  if (workflow === undefined) return broken("ci.yml is missing");
  let registry: readonly Gate[];
  try {
    registry = parseRegistry(registryText);
  } catch (error) {
    return broken(error instanceof Error ? error.message : String(error));
  }
  const findings = checkRegistry({ registry, registryPath: "gates.json", jobs: ciJobs(workflow), workflowPath: "ci.yml" });
  return { exit: findings.length > 0 ? 1 : 0, stdout: findings.map(formatFinding), stderr: [] };
}

/** One plant directory's plant.json, or the problem line that rejects it before it runs. */
async function loadPlant(dir: string, tools: PlantTools): Promise<Plant | string> {
  const line = (path: string, rule: string, message: string): string => `${path}: ${gateId}: ${rule}: ${message}`;
  const text = await tools.read(`${dir}/plant.json`);
  if (text === undefined) return line(`${dir}/plant.json`, "invalid-plant", "plant.json is missing");
  const plant = parsePlant(text);
  if (typeof plant === "string") return line(`${dir}/plant.json`, "invalid-plant", plant);
  const configuration = carriesConfiguration(await tools.files(dir));
  if (configuration.length > 0) {
    return line(dir, "carries-configuration", `plant carries gate configuration: ${configuration.join(", ")}`);
  }
  return plant;
}

/** How the plants of one directory are found and which kinds it needs. */
interface PlantSet {
  readonly dir: string;
  /** Who needs the plants, in the missing-plant message: `gate <id>` or `the registry check`. */
  readonly owner: string;
  readonly needed: readonly (typeof kinds)[number][];
  /**
   * Whether a case directory without plant.json is a plant (an invalid one). True for a gate's plants, whose cases
   * hold their inputs in tree/, base/ and head/; false for the registry's plants, each a gates.json and ci.yml pair
   * that its plant.json makes a plant.
   */
  readonly everyDir: boolean;
}

/** Judges every plant of a set with `judge`; returns the number of plants and the problem lines. */
async function judgeAll(
  set: PlantSet,
  tools: PlantTools,
  judge: (plant: Plant, path: string) => Promise<string | undefined>,
): Promise<{ readonly count: number; readonly problems: readonly string[] }> {
  const { dir, owner, needed } = set;
  const problems: string[] = [];
  const seen = new Set<string>();
  const cases: string[] = [];
  for (const name of [...(await tools.dirs(dir))].sort()) {
    if (set.everyDir || (await tools.read(`${dir}/${name}/plant.json`)) !== undefined) cases.push(name);
  }
  // Every plant is judged at once (the runner limits how many gate runs start together); the lines keep plant order.
  const verdicts = await Promise.all(
    cases.map(async (name) => {
      const path = `${dir}/${name}`;
      const plant = await loadPlant(path, tools);
      if (typeof plant === "string") return plant;
      seen.add(plant.expect);
      const problem = await judge(plant, path);
      return problem === undefined ? undefined : `${path}: ${gateId}: ${missed[plant.expect]}: ${problem}`;
    }),
  );
  for (const verdict of verdicts) if (verdict !== undefined) problems.push(verdict);
  for (const kind of needed) {
    if (!seen.has(kind)) problems.push(`${dir}: ${gateId}: missing-plant: ${owner} has no ${kind} plant`);
  }
  return { count: cases.length, problems };
}

export async function plants(context: Context, tools: PlantTools, io: Io): Promise<number> {
  const fail = (cause: string): number => emit({ exit: 2, cause: `${gateId}: could not run: ${cause}` }, io.out, io.err);
  const registryText = await tools.read(registryPath);
  if (registryText === undefined) return fail(`${registryPath} is missing; restore it from git`);
  const workflow = await tools.read(workflowPath);
  if (workflow === undefined) return fail(`${workflowPath} is missing; restore it from git`);
  let registry: readonly Gate[];
  try {
    registry = parseRegistry(registryText);
  } catch (error) {
    return fail(`${error instanceof Error ? error.message : String(error)}; fix ${registryPath}`);
  }

  const problems = checkRegistry({ registry, registryPath, jobs: ciJobs(workflow), workflowPath }).map(formatFinding);
  const registered = new Set(registry.map((gate) => gate.id));
  for (const dir of [...(await tools.dirs(plantsDir))].sort()) {
    if (dir === plantJob || registered.has(dir)) continue;
    problems.push(`${plantsDir}/${dir}: ${gateId}: unknown-gate: plants of ${dir}, which has no registry entry`);
  }
  let count = 0;
  const gateVerdicts = await Promise.all(
    registry.map((gate) => {
      const set: PlantSet = { dir: `${plantsDir}/${gate.id}`, owner: `gate ${gate.id}`, needed: kinds, everyDir: true };
      return judgeAll(set, tools, async (plant, path) => judgePlant(gate.id, plant, await tools.runPlant(gate, path, plant)));
    }),
  );
  for (const judged of gateVerdicts) {
    count += judged.count;
    problems.push(...judged.problems);
  }
  const registrySet: PlantSet = { dir: `${plantsDir}/${plantJob}`, owner: "the registry check", needed: ["fail", "pass"], everyDir: false };
  const registryPlants = await judgeAll(registrySet, tools, async (plant, path) =>
    judgePlant(gateId, plant, registryRun(await tools.read(`${path}/gates.json`), await tools.read(`${path}/ci.yml`))),
  );
  count += registryPlants.count;
  problems.push(...registryPlants.problems);

  if (problems.length > 0) {
    for (const problem of problems) io.out(problem);
    io.out(`${gateId}: ${plural(problems.length, "problem")} in ${plural(count, "plant")}`);
    return 1;
  }
  const gates = plural(registry.length, "gate");
  io.out(`${gateId}: ${plural(count, "plant")} of ${gates} and the registry judged, every plant as expected`);
  return 0;
}

/** The builders and gate processes of the repository at `root`. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
function runnerTools(root: string, io: Io): RunnerTools {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
  return {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
    tempDir: (prefix) => mkdtemp(join(tmpdir(), prefix)),
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
    removeDir: (dir) => rm(dir, { recursive: true, force: true }),
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
    build: {
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
      "repo-tree": (plant, into) => buildRepoTree(root, plant, into).then(() => ({})),
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
      "commit-repo": (plant, into) => buildCommitRepo(plant, into),
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
      "mutation-repo": (plant, into) => buildMutationRepo(root, plant, into),
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
      workspace: (plant, into) => cp(plant, into, { recursive: true }).then(() => rm(join(into, "plant.json"))).then(() => ({})),
    },
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
    run: (command, args) => runTool(command, args, root, io.env),
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
    node: process.execPath,
  };
}

/** The file system and gate processes of the repository at `root`. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
function realTools(root: string, io: Io): PlantTools {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
  const limit = limiter(gateRunsAtOnce(availableParallelism()));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
  const runner = runnerTools(root, io);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
  return {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
    read: (path) => readFile(join(root, path), "utf8").catch(() => undefined),
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
    dirs: async (path) => directoryNames(await readdir(join(root, path), { withFileTypes: true }).catch(() => [])),
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
    files: async (path) => filePaths(await readdir(join(root, path), { recursive: true, withFileTypes: true }).catch(() => []), join(root, path)),
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
    runPlant: (gate, plant, spec) => limit(() => runPlant(runner, root, gate, plant, spec)),
  };
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
export async function run(argv: readonly string[], io: Io): Promise<number> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
  const context = parseArgs(argv, io.cwd);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
  return plants(context, realTools(context.root, io), io);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
if (import.meta.main) await main(run);
