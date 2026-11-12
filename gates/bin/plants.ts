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
import { dirname, join, resolve } from "node:path";
import { main, parseArgs } from "../lib/cli.ts";
import type { Context, Io } from "../lib/cli.ts";
import { directoryNames, filePaths } from "../lib/entries.ts";
import { emit, formatFinding, plural } from "../lib/findings.ts";
import { gateKeysProblem, judgePlant, parsePlant, plantFilesProblem, storybookGates } from "../lib/plant-judge.ts";
import type { Plant, PlantRun } from "../lib/plant-judge.ts";
import { buildCommitRepo, buildMutationRepo, buildRepoTree, carriesConfiguration } from "../lib/plant-repo.ts";
import { containerDecision, gateRunsAtOnce, limiter, needsEngine, plantSeconds, plantShards, plantTimeNote, runPlant, shardSize } from "../lib/plant-runner.ts";
import type { RunnerTools, VisualCopyTools } from "../lib/plant-runner.ts";
import { checkRegistry, ciJobs, parseRegistry, plantJob, shardInPlantCheckFindings, skipContainerFindings } from "../lib/registry.ts";
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
  /** Starts a stopwatch: the returned function gives the milliseconds since (plan decision 24); absent: no plant times. */
  readonly stopwatch?: () => () => number;
  /** Writes a file (path relative to the root), making the directories it needs: a shard's report (plan decision 23). */
  readonly write?: (path: string, text: string) => Promise<void>;
  /** The `.json` files of a report directory (as given to `--verdict`) by file name (plan decision 23). */
  readonly reports?: (dir: string) => Promise<ReadonlyMap<string, string>>;
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
  const findings = [...checkRegistry({ registry, registryPath: "gates.json", jobs: ciJobs(workflow), workflowPath: "ci.yml" }), ...skipContainerFindings(workflow, "ci.yml"), ...shardInPlantCheckFindings(workflow, "ci.yml")];
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
  /** The plants (paths) of a shard: only these are judged, and no kind is required (plan decision 23); absent: all. */
  readonly only?: ReadonlySet<string> | undefined;
  /** The verdict mode's problem lines of each plant, from the shards' reports: no plant runs (plan decision 23). */
  readonly reported?: ReadonlyMap<string, readonly string[]> | undefined;
}

/** One judged plant of a shard report (contracts/plants.md § Shards). */
interface JudgedPlant {
  readonly plant: string;
  readonly asExpected: boolean;
  readonly lines: readonly string[];
  readonly seconds: number;
}

/** What judging a set of plants gave: how many plants were judged, the problem lines, and the plants left out. */
interface Judged {
  readonly count: number;
  readonly problems: readonly string[];
  readonly skipped: readonly string[];
  readonly notRun: readonly string[];
  readonly plants: readonly JudgedPlant[];
}

/** A plant's path below gates/plants/, `<gate>/<case>`. */
const plantName = (path: string): string => path.slice(`${plantsDir}/`.length);

/** Judges every plant of a set with `judge`; returns the number of plants and the problem lines. */
async function judgeAll(
  set: PlantSet,
  tools: PlantTools,
  judge: (plant: Plant, path: string) => Promise<string | undefined>,
  note: (line: string) => void,
): Promise<Judged> {
  const { dir, owner, needed } = set;
  const problems: string[] = [];
  const seen = new Set<string>();
  const left = { skip: new Set<string>(), "not-run": new Set<string>() };
  const cases: string[] = [];
  for (const name of await listCases(set, tools)) if (set.only?.has(`${dir}/${name}`) ?? true) cases.push(name);
  // A plant's problem lines: its plant.json's, or the verdict's mode's from the reports, or its gate run's judgement.
  const lines = async (path: string): Promise<readonly string[] | undefined> => {
    const plant = await loadPlant(path, set.gate, tools);
    if (typeof plant === "string") return [plant];
    seen.add(plant.expect);
    if (set.reported !== undefined) return set.reported.get(path) ?? [];
    const decision = set.decide === undefined ? "run" : await set.decide(plant);
    if (decision !== "run") {
      left[decision].add(path);
      return undefined;
    }
    const problem = await judge(plant, path);
    return problem === undefined ? [] : [`${path}: ${gateId}: ${missed[plant.expect]}: ${problem}`];
  };
  // Plan decision 24: each judged plant's time, from the start of its plant.json's reading to its judgement.
  const verdict = async (name: string): Promise<JudgedPlant | undefined> => {
    const path = `${dir}/${name}`;
    // The verdict mode judges no plant, so it times none.
    const elapsed = set.reported === undefined ? tools.stopwatch?.() : undefined;
    const found = await lines(path);
    if (found === undefined) return undefined;
    const milliseconds = elapsed?.() ?? 0;
    if (elapsed !== undefined) note(plantTimeNote(plantName(path), milliseconds));
    return { plant: plantName(path), asExpected: found.length === 0, lines: found, seconds: Number(plantSeconds(milliseconds)) };
  };
  // Every plant is judged at once (the runner limits how many gate runs start together), or one after another for a
  // serial set; the lines keep plant order.
  const verdicts: (JudgedPlant | undefined)[] = [];
  if (set.serial === true) for (const name of cases) verdicts.push(await verdict(name));
  else verdicts.push(...(await Promise.all(cases.map(verdict))));
  const judged = verdicts.filter((plant) => plant !== undefined);
  for (const plant of judged) problems.push(...plant.lines);
  for (const kind of set.only === undefined ? needed : []) {
    if (!seen.has(kind)) problems.push(`${dir}: ${gateId}: missing-plant: ${owner} has no ${kind} plant`);
  }
  const inOrder = (paths: ReadonlySet<string>): string[] => cases.map((name) => `${dir}/${name}`).filter((path) => paths.has(path));
  const skipped = inOrder(left.skip);
  const notRun = inOrder(left["not-run"]);
  // The count is printed only when every plant that needs an engine ran, so it leaves out the skipped plants alone.
  return { count: cases.length - skipped.length, problems, skipped, notRun, plants: judged };
}

/** The case names of a set's directory, sorted: every directory, or for the registry's plants those with plant.json. */
async function listCases(set: PlantSet, tools: PlantTools): Promise<string[]> {
  const cases: string[] = [];
  for (const name of [...(await tools.dirs(set.dir))].sort()) {
    if (set.everyDir || (await tools.read(`${set.dir}/${name}/plant.json`)) !== undefined) cases.push(name);
  }
  return cases;
}

/** The mode of a run (plan decision 23): every plant, the plan, one shard, or the verdict on the shards' reports. */
type Mode = { readonly kind: "all" } | { readonly kind: "plan" } | { readonly kind: "shard"; readonly shard: string } | { readonly kind: "verdict"; readonly dir: string } | { readonly kind: "error"; readonly cause: string };

/** The mode of the job's arguments (a leading `--` of `pnpm run gate:plants -- …` skipped). */
function modeOf(args: readonly string[]): Mode {
  const value = (option: string): string | undefined => args[args.indexOf(option) + 1];
  if (args.includes("--plan")) return { kind: "plan" };
  const shard = value("--shard");
  const dir = value("--verdict");
  if (args.includes("--shard")) return shard === undefined ? { kind: "error", cause: "--shard needs a shard number" } : { kind: "shard", shard };
  if (args.includes("--verdict")) return dir === undefined ? { kind: "error", cause: "--verdict needs a report directory" } : { kind: "verdict", dir };
  return { kind: "all" };
}

/** Every plant of the repository as `<gate>/<case>`: each registered gate's, in registry order, then the registry's. */
async function listPlants(registry: readonly Gate[], tools: PlantTools): Promise<string[]> {
  const plants: string[] = [];
  for (const gate of registry) for (const name of await listCases(gateSet(gate), tools)) plants.push(`${gate.id}/${name}`);
  for (const name of await listCases(registrySet, tools)) plants.push(`${plantJob}/${name}`);
  return plants;
}

/** The plant set of a gate (its decision and order are added by the job). */
function gateSet(gate: Gate): PlantSet {
  return { dir: `${plantsDir}/${gate.id}`, gate: gate.id, owner: `gate ${gate.id}`, needed: kinds, everyDir: true };
}

/** The registry's own plants under gates/plants/plants/. */
const registrySet: PlantSet = { dir: `${plantsDir}/${plantJob}`, gate: gateId, owner: "the registry check", needed: ["fail", "pass"], everyDir: false };

/** A shard's report (contracts/plants.md § Shards). */
interface ShardReport {
  readonly shard: number;
  readonly of: number;
  readonly plants: readonly JudgedPlant[];
  readonly skipped: readonly string[];
  readonly notRun: readonly string[];
}

const texts = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");

/** A JSON text's value, or undefined when it is not JSON. */
// Stryker disable next-line BlockStatement: equivalent, an empty catch block returns undefined as the catch's own return does
const json = (text: string): unknown => { try { return JSON.parse(text) as unknown; } catch { return undefined; } };

/** A report's text as a report, or undefined when it is not one. */
function parseReport(text: string): ShardReport | undefined {
  const report = (json(text) ?? {}) as Record<string, unknown>;
  const plantOk = (item: unknown): boolean => {
    const plant = (item ?? {}) as Record<string, unknown>;
    return typeof plant.plant === "string" && typeof plant.asExpected === "boolean" && texts(plant.lines) && typeof plant.seconds === "number";
  };
  const valid = Number.isInteger(report.shard) && Number.isInteger(report.of) && Array.isArray(report.plants) && report.plants.every(plantOk) && texts(report.skipped) && texts(report.notRun);
  return valid ? (report as unknown as ShardReport) : undefined;
}

/** What the plants of a run gave: the problem lines, the plants judged, skipped and not run, and the per-plant results. */
interface Outcome {
  readonly count: number;
  readonly problems: readonly string[];
  readonly skipped: readonly string[];
  readonly notRun: readonly string[];
  readonly plants: readonly JudgedPlant[];
}

/**
 * The verdict mode's causes on the shards' reports (contracts/plants.md § Shards): a report that is not one or names
 * another plan, a shard without a report, a report whose plants are not its shard's, a skipped or not-run plant; and
 * the stderr lines naming those plants.
 */
function reportCauses(texts: ReadonlyMap<string, string>, shards: readonly (readonly string[])[]): { readonly causes: string[]; readonly lines: string[]; readonly reports: ShardReport[] } {
  const n = shards.length;
  const causes: string[] = [];
  const lines: string[] = [];
  const byShard = new Map<number, ShardReport>();
  for (const [name, text] of [...texts].sort(([a], [b]) => a.localeCompare(b))) {
    const report = parseReport(text);
    if (report === undefined) causes.push(`${name} is not a shard report`);
    else if (report.shard < 1 || report.shard > n || report.of !== n) causes.push(`${name}: shard ${String(report.shard)} of ${String(report.of)}, but the plan has ${String(n)} shards`);
    else byShard.set(report.shard, report);
  }
  const reports: ShardReport[] = [];
  shards.forEach((planned, index) => {
    const k = index + 1;
    const report = byShard.get(k);
    if (report === undefined) {
      causes.push(`shard ${String(k)} of ${String(n)} reported no result`);
      return;
    }
    reports.push(report);
    const named = new Set([...report.plants.map((plant) => plant.plant), ...report.skipped, ...report.notRun]);
    const wanted = new Set(planned);
    const other = [...new Set([...named, ...wanted])].filter((plant) => named.has(plant) !== wanted.has(plant)).sort();
    if (other.length > 0) causes.push(`shard ${String(k)} judged other plants than the partition gives it: ${other.join(", ")}`);
    for (const plant of report.skipped) lines.push(`${gateId}: skipped (no container): ${plantsDir}/${plant}`);
    if (report.skipped.length > 0) causes.push(`shard ${String(k)} skipped ${plural(report.skipped.length, "visual plant")} (--skip-container); the Plants check judges every plant`);
    for (const plant of report.notRun) lines.push(`${gateId}: not run (no container engine): ${plantsDir}/${plant}`);
    if (report.notRun.length > 0) causes.push(`shard ${String(k)} could not run ${plural(report.notRun.length, "visual plant")} (no container engine); the Plants check judges every plant`);
  });
  return { causes, lines, reports };
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

  // Plan decision 23: the plan, one shard, or the verdict on the shards' reports; without a mode, every plant.
  const mode = modeOf(context.args);
  const shards = plantShards(await listPlants(registry, tools), shardSize);
  const n = shards.length;
  if (mode.kind === "plan") {
    io.out(JSON.stringify(shards.map((_, index) => index + 1)));
    return 0;
  }
  if (mode.kind === "error") return fail(mode.cause);
  const k = mode.kind === "shard" ? mode.shard : undefined;
  let shard: readonly string[] | undefined;
  if (k !== undefined) {
    // A shard number as the plan prints it: `02` or `2.0` name no shard.
    shard = String(Number(k)) === k ? shards[Number(k) - 1] : undefined;
    if (shard === undefined) return fail(`there is no shard ${k}; the plan has ${String(n)}`);
  }
  const reported = mode.kind === "verdict" ? reportCauses((await tools.reports?.(mode.dir)) ?? new Map(), shards) : undefined;
  const lines = new Map((reported?.reports ?? []).flatMap((report) => report.plants.map((plant) => [`${plantsDir}/${plant.plant}`, plant.lines] as const)));
  const only = shard === undefined ? undefined : new Set(shard.map((plant) => `${plantsDir}/${plant}`));
  const outcome = await judgeRun(context, tools, io, registry, workflow, { only, reported: reported === undefined ? undefined : lines });

  if (shard !== undefined) {
    const report: ShardReport = { shard: Number(k), of: n, plants: outcome.plants, skipped: outcome.skipped.map(plantName), notRun: outcome.notRun.map(plantName) };
    await tools.write?.(`storybook/.visual/plant-shards/${String(report.shard)}.json`, `${JSON.stringify(report, null, 2)}\n`);
  }
  for (const plant of outcome.skipped) io.err(`${gateId}: skipped (no container): ${plant}`);
  // A skipped or not-run plant's line always comes with its cause.
  if (reported !== undefined && reported.causes.length > 0) {
    for (const problem of outcome.problems) io.out(problem);
    for (const line of reported.lines) io.err(line);
    for (const cause of reported.causes) io.err(`${gateId}: could not run: ${cause}`);
    return 2;
  }
  if (outcome.notRun.length > 0) {
    for (const problem of outcome.problems) io.out(problem);
    for (const plant of outcome.notRun) io.err(`${gateId}: not run (no container engine): ${plant}`);
    const cause = `no container engine for ${plural(outcome.notRun.length, "visual plant")}; start docker or podman, or run a partial job with --skip-container`;
    return emit({ exit: 2, cause: `${gateId}: could not run: ${cause}` }, io.out, io.err);
  }
  const count = outcome.count;
  const partial = outcome.skipped.length > 0 ? `; partial run: ${plural(outcome.skipped.length, "visual plant")} not run` : "";
  if (outcome.problems.length > 0) {
    for (const problem of outcome.problems) io.out(problem);
    io.out(`${gateId}: ${plural(outcome.problems.length, "problem")} in ${plural(count, "plant")}${partial}`);
    return 1;
  }
  const gates = plural(registry.length, "gate");
  const judged = shard === undefined ? `${plural(count, "plant")} of ${gates} and the registry judged` : `shard ${String(k)} of ${String(n)}: ${plural(count, "plant")} judged`;
  io.out(`${gateId}: ${judged}, every plant as expected${partial}`);
  return 0;
}

/**
 * Judges the plants of a run: the registry check and the structural checks unless it is one shard (`only`), every
 * plant, or a shard's, through its gate, or with `reported` none run and their lines taken from the shards' reports.
 */
async function judgeRun(
  context: Context,
  tools: PlantTools,
  io: Io,
  registry: readonly Gate[],
  workflow: string,
  options: { readonly only: ReadonlySet<string> | undefined; readonly reported: ReadonlyMap<string, readonly string[]> | undefined },
): Promise<Outcome> {
  const { only, reported } = options;
  const whole = only === undefined;
  const registryFindings = whole ? [...checkRegistry({ registry, registryPath, jobs: ciJobs(workflow), workflowPath }), ...skipContainerFindings(workflow, workflowPath), ...shardInPlantCheckFindings(workflow, workflowPath)] : [];
  const problems = registryFindings.map(formatFinding);
  // 006 research.md R-07: --skip-container leaves out every visual plant; otherwise the engines the visual plants are
  // given are probed once, before the first plant that needs one, and a plant that needs a missing engine is not run.
  const skipContainer = context.args.includes("--skip-container");
  let probed: Promise<boolean> | undefined;
  const engines = (): Promise<boolean> => (probed ??= tools.probe?.() ?? Promise.resolve(true));
  const decide = async (gate: Gate, plant: Plant): Promise<"run" | "skip" | "not-run"> =>
    containerDecision(gate.id, plant, { skipContainer, engines: skipContainer || !needsEngine(gate.id, plant) || (await engines()) });
  const registered = new Set(registry.map((gate) => gate.id));
  for (const dir of whole ? [...(await tools.dirs(plantsDir))].sort() : []) {
    if (dir === plantJob || registered.has(dir)) continue;
    problems.push(`${plantsDir}/${dir}: ${gateId}: unknown-gate: plants of ${dir}, which has no registry entry`);
  }
  const note = (line: string): void => {
    io.err(line);
  };
  const judgeGate = (gate: Gate, serial: boolean): ReturnType<typeof judgeAll> => {
    const set: PlantSet = { ...gateSet(gate), serial, decide: (plant) => decide(gate, plant), only, reported };
    return judgeAll(set, tools, async (plant, path) => judgePlant(gate.id, plant, await tools.runPlant(gate, path, plant)), note);
  };
  // Every other gate's plants are judged at once; the Storybook gates' plants then one at a time, in registry order
  // (006 research.md R-07). The lines keep registry order.
  const together = new Map(registry.filter((gate) => !storybookGates.includes(gate.id)).map((gate) => [gate.id, judgeGate(gate, false)]));
  await Promise.all(together.values());
  const judgedSets: Judged[] = [];
  for (const gate of registry) judgedSets.push(await (together.get(gate.id) ?? judgeGate(gate, true)));
  judgedSets.push(
    await judgeAll({ ...registrySet, only, reported }, tools, async (plant, path) => judgePlant(gateId, plant, registryRun(await tools.read(`${path}/gates.json`), await tools.read(`${path}/ci.yml`))), note),
  );
  return {
    count: judgedSets.reduce((sum, judged) => sum + judged.count, 0),
    problems: [...problems, ...judgedSets.flatMap((judged) => judged.problems)],
    skipped: judgedSets.flatMap((judged) => judged.skipped),
    notRun: judgedSets.flatMap((judged) => judged.notRun),
    plants: judgedSets.flatMap((judged) => judged.plants),
  };
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
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
    stopwatch: () => {
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
      const start = performance.now();
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "plants --root <tmp> runs each plant form through its gate and judges it"
      return () => performance.now() - start;
    },
    // Stryker disable next-line all: process boundary, covered by CI only: each Plants shard job of tasks.md T045's run writes its report, which the Plants job then reads (plan decision 23)
    write: async (path, text) => {
      // Stryker disable next-line all: process boundary, covered by CI only: each Plants shard job of tasks.md T045's run writes its report, which the Plants job then reads (plan decision 23)
      await mkdir(dirname(join(root, path)), { recursive: true });
      // Stryker disable next-line all: process boundary, covered by CI only: each Plants shard job of tasks.md T045's run writes its report, which the Plants job then reads (plan decision 23)
      await writeFile(join(root, path), text);
    },
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "--verdict on an empty directory exits 2 naming every shard of the repository's plan"
    reports: async (dir) => {
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "--verdict on an empty directory exits 2 naming every shard of the repository's plan"
      const at = resolve(io.cwd, dir);
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "--verdict on an empty directory exits 2 naming every shard of the repository's plan"
      const names = (await readdir(at).catch(() => [])).filter((name) => name.endsWith(".json"));
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/plants.test.ts "--verdict on an empty directory exits 2 naming every shard of the repository's plan"
      return new Map(await Promise.all(names.map(async (name) => [name, await readFile(join(at, name), "utf8")] as const)));
    },
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
