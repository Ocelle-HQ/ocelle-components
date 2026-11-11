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
import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { availableParallelism, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { main, parseArgs } from "../lib/cli.ts";
import type { Context, Io } from "../lib/cli.ts";
import { directoryNames, filePaths } from "../lib/entries.ts";
import { emit, formatFinding, plural } from "../lib/findings.ts";
import { gateKeysProblem, judgePlant, parsePlant, plantFilesProblem, storybookGates } from "../lib/plant-judge.ts";
import type { Plant, PlantRun } from "../lib/plant-judge.ts";
import { buildCommitRepo, buildMutationRepo, buildRepoTree, carriesConfiguration } from "../lib/plant-repo.ts";
import { containerDecision, gateRunsAtOnce, limiter, needsEngine, runPlant } from "../lib/plant-runner.ts";
import type { RunnerTools, VisualCopyTools } from "../lib/plant-runner.ts";
import { checkRegistry, ciJobs, parseRegistry, plantJob, skipContainerFindings } from "../lib/registry.ts";
import type { Gate } from "../lib/registry.ts";
import { runTool } from "../lib/spawn.ts";
import { parseIndex } from "../lib/storybook-index.ts";
import { loadTokens } from "../lib/token-source.ts";
import { captureRuns, engines, readPin } from "../lib/visual-host.ts";
import { ownStories } from "../lib/visual-verdict.ts";

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
  /** Whether the container engine the visual plants are given is available (006 research.md R-07); absent: not probed. */
  readonly probe?: () => Promise<boolean>;
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
  const findings = [...checkRegistry({ registry, registryPath: "gates.json", jobs: ciJobs(workflow), workflowPath: "ci.yml" }), ...skipContainerFindings(workflow, "ci.yml")];
  return { exit: findings.length > 0 ? 1 : 0, stdout: findings.map(formatFinding), stderr: [] };
}

/** One plant directory's plant.json, or the problem line that rejects it before it runs; `gate` is whose plant it is. */
async function loadPlant(dir: string, gate: string, tools: PlantTools): Promise<Plant | string> {
  const line = (path: string, rule: string, message: string): string => `${path}: ${gateId}: ${rule}: ${message}`;
  const text = await tools.read(`${dir}/plant.json`);
  if (text === undefined) return line(`${dir}/plant.json`, "invalid-plant", "plant.json is missing");
  const plant = parsePlant(text);
  if (typeof plant === "string") return line(`${dir}/plant.json`, "invalid-plant", plant);
  const keys = gateKeysProblem(gate, plant);
  if (keys !== undefined) return line(`${dir}/plant.json`, "invalid-plant", keys);
  const files = await tools.files(dir);
  const tree = (paths: readonly string[]): string[] => paths.filter((path) => path.startsWith("tree/")).map((path) => path.slice("tree/".length));
  let named: { readonly plant: Plant | undefined; readonly tree: readonly string[] } | undefined;
  if (plant.baselinesOf !== undefined) {
    const other = `${dir.slice(0, dir.lastIndexOf("/"))}/${plant.baselinesOf}`;
    const text = await tools.read(`${other}/plant.json`);
    const parsed = text === undefined ? undefined : parsePlant(text);
    named = { plant: typeof parsed === "string" ? undefined : parsed, tree: tree(await tools.files(other)) };
  }
  const filesProblem = plantFilesProblem(plant, tree(files), named);
  if (filesProblem !== undefined) return line(`${dir}/plant.json`, "invalid-plant", filesProblem);
  const configuration = carriesConfiguration(files);
  if (configuration.length > 0) {
    return line(dir, "carries-configuration", `plant carries gate configuration: ${configuration.join(", ")}`);
  }
  return plant;
}

/** How the plants of one directory are found and which kinds it needs. */
interface PlantSet {
  readonly dir: string;
  /** Whose plants they are: the gate id, or the plant job's own id for the registry's plants. */
  readonly gate: string;
  /** Who needs the plants, in the missing-plant message: `gate <id>` or `the registry check`. */
  readonly owner: string;
  readonly needed: readonly (typeof kinds)[number][];
  /**
   * Whether a case directory without plant.json is a plant (an invalid one). True for a gate's plants, whose cases
   * hold their inputs in tree/, base/ and head/; false for the registry's plants, each a gates.json and ci.yml pair
   * that its plant.json makes a plant.
   */
  readonly everyDir: boolean;
  /** Whether its plants run one at a time (the Storybook gates' plants, 006 research.md R-07); else all at once. */
  readonly serial?: boolean;
  /** Whether a valid plant runs, is skipped (`--skip-container`) or is not run (no container engine); absent: it runs. */
  readonly decide?: (plant: Plant) => Promise<"run" | "skip" | "not-run">;
}

/** What judging a set of plants gave: how many plants were judged, the problem lines, and the plants left out. */
interface Judged {
  readonly count: number;
  readonly problems: readonly string[];
  readonly skipped: readonly string[];
  readonly notRun: readonly string[];
}

/** Judges every plant of a set with `judge`; returns the number of plants and the problem lines. */
async function judgeAll(
  set: PlantSet,
  tools: PlantTools,
  judge: (plant: Plant, path: string) => Promise<string | undefined>,
): Promise<Judged> {
  const { dir, owner, needed } = set;
  const problems: string[] = [];
  const seen = new Set<string>();
  const left = { skip: new Set<string>(), "not-run": new Set<string>() };
  const cases: string[] = [];
  for (const name of [...(await tools.dirs(dir))].sort()) {
    if (set.everyDir || (await tools.read(`${dir}/${name}/plant.json`)) !== undefined) cases.push(name);
  }
  const verdict = async (name: string): Promise<string | undefined> => {
    const path = `${dir}/${name}`;
    const plant = await loadPlant(path, set.gate, tools);
    if (typeof plant === "string") return plant;
    seen.add(plant.expect);
    const decision = set.decide === undefined ? "run" : await set.decide(plant);
    if (decision !== "run") {
      left[decision].add(path);
      return undefined;
    }
    const problem = await judge(plant, path);
    return problem === undefined ? undefined : `${path}: ${gateId}: ${missed[plant.expect]}: ${problem}`;
  };
  // Every plant is judged at once (the runner limits how many gate runs start together), or one after another for a
  // serial set; the lines keep plant order.
  const verdicts: (string | undefined)[] = [];
  if (set.serial === true) for (const name of cases) verdicts.push(await verdict(name));
  else verdicts.push(...(await Promise.all(cases.map(verdict))));
  for (const line of verdicts) if (line !== undefined) problems.push(line);
  for (const kind of needed) {
    if (!seen.has(kind)) problems.push(`${dir}: ${gateId}: missing-plant: ${owner} has no ${kind} plant`);
  }
  const inOrder = (paths: ReadonlySet<string>): string[] => cases.map((name) => `${dir}/${name}`).filter((path) => paths.has(path));
  const skipped = inOrder(left.skip);
  const notRun = inOrder(left["not-run"]);
  // The count is printed only when every plant that needs an engine ran, so it leaves out the skipped plants alone.
  return { count: cases.length - skipped.length, problems, skipped, notRun };
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

  const problems = [...checkRegistry({ registry, registryPath, jobs: ciJobs(workflow), workflowPath }), ...skipContainerFindings(workflow, workflowPath)].map(formatFinding);
  // 006 research.md R-07: --skip-container leaves out every visual plant; otherwise the engines the visual plants are
  // given are probed once, before the first plant that needs one, and a plant that needs a missing engine is not run.
  const skipContainer = context.args.includes("--skip-container");
  let probed: Promise<boolean> | undefined;
  const engines = (): Promise<boolean> => (probed ??= tools.probe?.() ?? Promise.resolve(true));
  const decide = async (gate: Gate, plant: Plant): Promise<"run" | "skip" | "not-run"> =>
    containerDecision(gate.id, plant, { skipContainer, engines: skipContainer || !needsEngine(gate.id, plant) || (await engines()) });
  const registered = new Set(registry.map((gate) => gate.id));
  for (const dir of [...(await tools.dirs(plantsDir))].sort()) {
    if (dir === plantJob || registered.has(dir)) continue;
    problems.push(`${plantsDir}/${dir}: ${gateId}: unknown-gate: plants of ${dir}, which has no registry entry`);
  }
  let count = 0;
  const judgeGate = (gate: Gate, serial: boolean): ReturnType<typeof judgeAll> => {
    const set: PlantSet = { dir: `${plantsDir}/${gate.id}`, gate: gate.id, owner: `gate ${gate.id}`, needed: kinds, everyDir: true, serial, decide: (plant) => decide(gate, plant) };
    return judgeAll(set, tools, async (plant, path) => judgePlant(gate.id, plant, await tools.runPlant(gate, path, plant)));
  };
  // Every other gate's plants are judged at once; the Storybook gates' plants then one at a time, in registry order
  // (006 research.md R-07). The lines keep registry order.
  const together = new Map(registry.filter((gate) => !storybookGates.includes(gate.id)).map((gate) => [gate.id, judgeGate(gate, false)]));
  await Promise.all(together.values());
  const gateVerdicts: Judged[] = [];
  for (const gate of registry) gateVerdicts.push(await (together.get(gate.id) ?? judgeGate(gate, true)));
  const skipped: string[] = [];
  const notRun: string[] = [];
  for (const judged of gateVerdicts) {
    count += judged.count;
    problems.push(...judged.problems);
    skipped.push(...judged.skipped);
    notRun.push(...judged.notRun);
  }
  const registrySet: PlantSet = { dir: `${plantsDir}/${plantJob}`, gate: gateId, owner: "the registry check", needed: ["fail", "pass"], everyDir: false };
  const registryPlants = await judgeAll(registrySet, tools, async (plant, path) =>
    judgePlant(gateId, plant, registryRun(await tools.read(`${path}/gates.json`), await tools.read(`${path}/ci.yml`))),
  );
  count += registryPlants.count;
  problems.push(...registryPlants.problems);

  for (const plant of skipped) io.err(`${gateId}: skipped (no container): ${plant}`);
  if (notRun.length > 0) {
    for (const problem of problems) io.out(problem);
    for (const plant of notRun) io.err(`${gateId}: not run (no container engine): ${plant}`);
    const cause = `no container engine for ${plural(notRun.length, "visual plant")}; start docker or podman, or run a partial job with --skip-container`;
    return emit({ exit: 2, cause: `${gateId}: could not run: ${cause}` }, io.out, io.err);
  }
  const partial = skipped.length > 0 ? `; partial run: ${plural(skipped.length, "visual plant")} not run` : "";
  if (problems.length > 0) {
    for (const problem of problems) io.out(problem);
    io.out(`${gateId}: ${plural(problems.length, "problem")} in ${plural(count, "plant")}${partial}`);
    return 1;
  }
  const gates = plural(registry.length, "gate");
  io.out(`${gateId}: ${plural(count, "plant")} of ${gates} and the registry judged, every plant as expected${partial}`);
  return 0;
}

/** The captures copy of failing visual pass plants (006 research.md R-11), with the job's environment. */
// Stryker disable next-line all: process boundary, covered by gate:plants in CI: a failing visual pass plant's captures under storybook/.visual/plants/ (research.md R-11)
function visualCopyTools(io: Io): VisualCopyTools {
  // Stryker disable next-line all: process boundary, covered by gate:plants in CI: a failing visual pass plant's captures under storybook/.visual/plants/ (research.md R-11)
  return {
    // Stryker disable next-line all: process boundary, covered by gate:plants in CI: a failing visual pass plant's captures under storybook/.visual/plants/ (research.md R-11)
    own: async (into, plant) => ownStories(parseIndex(await readFile(join(into, "storybook/dist/index.json"), "utf8")), filePaths(await readdir(join(plant, "tree"), { recursive: true, withFileTypes: true }).catch(() => []), join(plant, "tree"))),
    // Stryker disable next-line all: process boundary, covered by gate:plants in CI: a failing visual pass plant's captures under storybook/.visual/plants/ (research.md R-11)
    copy: async (from, to) => {
      // Stryker disable next-line all: process boundary, covered by gate:plants in CI: a failing visual pass plant's captures under storybook/.visual/plants/ (research.md R-11)
      await mkdir(dirname(to), { recursive: true });
      // Stryker disable next-line all: process boundary, covered by gate:plants in CI: a failing visual pass plant's captures under storybook/.visual/plants/ (research.md R-11)
      await cp(from, to);
    },
    // Stryker disable next-line all: process boundary, covered by gate:plants in CI: a failing visual pass plant's captures under storybook/.visual/plants/ (research.md R-11)
    captureAlone: async (into, at) => {
      // Stryker disable next-line all: process boundary, covered by gate:plants in CI: a failing visual pass plant's captures under storybook/.visual/plants/ (research.md R-11)
      const pin = await readPin(into);
      // Stryker disable next-line all: process boundary, covered by gate:plants in CI: a failing visual pass plant's captures under storybook/.visual/plants/ (research.md R-11)
      if ("cause" in pin) return undefined;
      // Stryker disable next-line all: process boundary, covered by gate:plants in CI: a failing visual pass plant's captures under storybook/.visual/plants/ (research.md R-11)
      const runs = await captureRuns(into, await engines(io.env.OCELLE_VISUAL_ENGINE ?? "both", io.env), pin.value, [{ stories: [at.story], themes: [at.theme] }], io.env);
      // Stryker disable next-line all: process boundary, covered by gate:plants in CI: a failing visual pass plant's captures under storybook/.visual/plants/ (research.md R-11)
      if ("cause" in runs) return undefined;
      // Stryker disable next-line all: process boundary, covered by gate:plants in CI: a failing visual pass plant's captures under storybook/.visual/plants/ (research.md R-11)
      const [[one], [two]] = runs.value;
      // Stryker disable next-line all: process boundary, covered by gate:plants in CI: a failing visual pass plant's captures under storybook/.visual/plants/ (research.md R-11)
      return one?.bytes !== undefined && two?.bytes !== undefined && Buffer.from(one.bytes).equals(Buffer.from(two.bytes)) ? one.bytes : undefined;
    },
    // Stryker disable next-line all: process boundary, covered by gate:plants in CI: a failing visual pass plant's captures under storybook/.visual/plants/ (research.md R-11)
    readBytes: (path) => readFile(path).catch(() => undefined),
    // Stryker disable next-line all: process boundary, covered by gate:plants in CI: a failing visual pass plant's captures under storybook/.visual/plants/ (research.md R-11)
    write: async (path, bytes) => {
      // Stryker disable next-line all: process boundary, covered by gate:plants in CI: a failing visual pass plant's captures under storybook/.visual/plants/ (research.md R-11)
      await mkdir(dirname(path), { recursive: true });
      // Stryker disable next-line all: process boundary, covered by gate:plants in CI: a failing visual pass plant's captures under storybook/.visual/plants/ (research.md R-11)
      await writeFile(path, bytes);
    },
    // Stryker disable next-line all: process boundary, covered by gate:plants in CI: a failing visual pass plant's captures under storybook/.visual/plants/ (research.md R-11)
    note: (line) => {
      // Stryker disable next-line all: process boundary, covered by gate:plants in CI: a failing visual pass plant's captures under storybook/.visual/plants/ (research.md R-11)
      io.err(line);
    },
  };
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
      "repo-tree": (plant, into, spec) => buildRepoTree(root, plant, into, spec).then(() => ({})),
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
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants-robustness.test.ts "%s: the change is consistent, and every plant keeps its outcome"
    read: (path) => readFile(path, "utf8").catch(() => undefined),
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants-robustness.test.ts "%s: the change is consistent, and every plant keeps its outcome"
    stylesheet: async (dir) => (await loadTokens(dir)).css(),
    // Stryker disable next-line all: process boundary, covered by gate:plants in CI: a failing visual pass plant's captures under storybook/.visual/plants/ (research.md R-11)
    env: io.env,
    // Stryker disable next-line all: process boundary, covered by gate:plants in CI: a failing visual pass plant's captures under storybook/.visual/plants/ (research.md R-11)
    visual: visualCopyTools(io),
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
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "exits 2 naming each visual plant it could not run when PATH holds neither docker nor podman"
    probe: async () => (await engines(io.env.OCELLE_VISUAL_ENGINE ?? "both", io.env)).kind !== "error",
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
