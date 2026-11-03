// The plant job (FR-025, research.md R-10, contracts/plants.md): first the registry check (gates/gates.json, the
// gate jobs of .github/workflows/ci.yml and the FR-020 list must be one set), then every plant of every registered
// gate under gates/plants/<gate-id>/<case>/, run through the gate in normal mode on a temporary repository built
// from the plant (pins: on a copy of its mini-workspace), and judged against its plant.json; then the registry's own
// plants under gates/plants/plants/. The job fails when a gate does not do what a plant expects, a gate lacks a
// fail, pass or breaking plant, a plant.json is missing or invalid, or a plant carries gate configuration.
// parsePlant, plantArgs, judgePlant and plants() are the decision, tested in process on recorded gate runs;
// run() gives them the file system and the gate processes (the process boundary).
import { cp, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main, parseArgs } from "../lib/cli.ts";
import type { Context, Io } from "../lib/cli.ts";
import { emit, formatFinding, oneLine, plural } from "../lib/findings.ts";
import { buildCommitRepo, buildMutationRepo, buildRepoTree, carriesConfiguration } from "../lib/plant-repo.ts";
import { checkRegistry, ciJobs, parseRegistry, plantJob } from "../lib/registry.ts";
import type { Gate } from "../lib/registry.ts";
import { runTool } from "../lib/spawn.ts";

/** One expected finding of a fail plant. */
export interface ExpectedFinding {
  readonly location: string;
  readonly rule: string;
  readonly message?: string;
}

/** One expected equivalent-mutant record of a mutation pass plant. */
export interface ExpectedRecord {
  readonly location: string;
  readonly mutator: string;
  readonly reason: string;
}

/** A plant's plant.json. */
export interface Plant {
  readonly expect: "fail" | "pass" | "error";
  readonly why: string;
  readonly findings?: readonly ExpectedFinding[];
  readonly records?: readonly ExpectedRecord[];
}

const gateId = "plants";
const registryPath = "gates/gates.json";
const workflowPath = ".github/workflows/ci.yml";
const plantsDir = "gates/plants";
const keys = new Set(["expect", "why", "findings", "records"]);
const kinds = ["fail", "pass", "error"] as const;

function isText(value: unknown): value is string {
  return typeof value === "string" && value !== "";
}

function readFindings(value: unknown): ExpectedFinding[] | string {
  if (!Array.isArray(value) || value.length === 0) return "a fail plant lists its findings";
  const findings: ExpectedFinding[] = [];
  for (const [index, item] of (value as unknown[]).entries()) {
    const at = `findings[${String(index)}]`;
    const fields = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
    const { location, rule, message } = fields;
    if (!isText(location) || !isText(rule)) return `${at} needs a location and a rule`;
    if (message !== undefined && typeof message !== "string") return `${at}.message must be a string`;
    findings.push(message === undefined ? { location, rule } : { location, rule, message });
  }
  return findings;
}

function readRecords(value: unknown): ExpectedRecord[] | string {
  if (!Array.isArray(value)) return "records must be a list";
  const records: ExpectedRecord[] = [];
  for (const [index, item] of (value as unknown[]).entries()) {
    const fields = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
    const { location, mutator, reason } = fields;
    if (!isText(location) || !isText(mutator) || !isText(reason)) {
      return `records[${String(index)}] needs a location, a mutator and a reason`;
    }
    records.push({ location, mutator, reason });
  }
  return records;
}

/** A plant.json text as a plant, or the problem with it. */
export function parsePlant(text: string): Plant | string {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    return `plant.json is not valid JSON (${oneLine(error instanceof Error ? error.message : String(error))})`;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) return "plant.json is not an object";
  const fields = value as Record<string, unknown>;
  const unknown = Object.keys(fields).find((key) => !keys.has(key));
  if (unknown !== undefined) return `unknown key ${unknown}`;
  const { expect, why } = fields;
  if (expect !== "fail" && expect !== "pass" && expect !== "error") return "expect must be fail, pass or error";
  if (typeof why !== "string" || why.trim() === "") return "why must be a non-empty string";
  let plant: Plant = { expect, why };
  if (expect === "fail") {
    const findings = readFindings(fields.findings);
    if (typeof findings === "string") return findings;
    plant = { ...plant, findings };
  } else if (fields.findings !== undefined) {
    return "only a fail plant lists findings";
  }
  if (fields.records !== undefined) {
    if (expect !== "pass") return "only a pass plant lists records";
    const records = readRecords(fields.records);
    if (typeof records === "string") return records;
    plant = { ...plant, records };
  }
  return plant;
}

/** One gate run on a plant: its exit code and output lines, and for a commit plant the hashes of its records. */
export interface PlantRun {
  readonly exit: number | null;
  readonly stdout: readonly string[];
  readonly stderr: readonly string[];
  readonly commits?: readonly string[];
}

/**
 * The arguments of a registry `plantCommand` with `{root}`, `{plant}` and `{base}` replaced, split at spaces; the
 * leading `node` stays as written (the runner starts it as the current Node).
 */
export function plantArgs(command: string, values: Readonly<Record<string, string>>): string[] {
  return command
    .split(" ")
    .filter((arg) => arg !== "")
    .map((arg) =>
      arg.replace(/\{(\w+)\}/g, (_, name: string) => {
        const value = values[name];
        if (value === undefined) throw new Error(`plantCommand uses {${name}}, which this plant does not set`);
        return value;
      }),
    );
}

/** A finding or a record line of a gate's output, by location and rule (and the text after the rule). */
interface Reported {
  readonly location: string;
  readonly rule: string;
  readonly rest: string;
}

/** The lines of `gate` in its output (`<location>: <gate>: <rule>: <message>`); a commit hash becomes `commit:<n>`. */
function reported(gate: string, run: PlantRun): Reported[] {
  const marker = `: ${gate}: `;
  const found: Reported[] = [];
  for (const line of run.stdout) {
    const at = line.indexOf(marker);
    if (at <= 0) continue;
    const hash = line.slice(0, at);
    const record = run.commits?.indexOf(hash) ?? -1;
    const location = record === -1 ? hash : `commit:${String(record + 1)}`;
    const body = line.slice(at + marker.length);
    const end = body.indexOf(": ");
    found.push(end === -1 ? { location, rule: body, rest: "" } : { location, rule: body.slice(0, end), rest: body.slice(end + 2) });
  }
  return found;
}

/** The difference of two lists of keys: what `expected` has and `actual` lacks, and the reverse (each once). */
function differ(what: string, expected: readonly string[], actual: readonly string[]): string | undefined {
  const missing = [...new Set(expected.filter((key) => !actual.includes(key)))];
  const unexpected = [...new Set(actual.filter((key) => !expected.includes(key)))];
  if (missing.length === 0 && unexpected.length === 0) return undefined;
  const parts = [
    ...(missing.length > 0 ? [`missing ${missing.join(", ")}`] : []),
    ...(unexpected.length > 0 ? [`unexpected ${unexpected.join(", ")}`] : []),
  ];
  return `${what} differ: ${parts.join("; ")}`;
}

/** The detail of an unexpected result: the findings it reported, else the first line of its error output. */
function detail(findings: readonly Reported[], run: PlantRun): string {
  if (findings.length > 0) return ` (${findings.map((found) => `${found.location} ${found.rule}`).join(", ")})`;
  const [cause] = run.stderr;
  return cause === undefined ? "" : ` (${cause})`;
}

/** The problem with a gate's run on a plant, or undefined when the gate did what the plant expects. */
export function judgePlant(gate: string, plant: Plant, run: PlantRun): string | undefined {
  const exit = String(run.exit);
  if (plant.expect === "error") return run.exit === 2 ? undefined : `expected exit 2 (could not run), got exit ${exit}`;
  const lines = reported(gate, run);
  const isRecord = (found: Reported): boolean => gate === "mutation" && found.rule === "record";
  const findings = lines.filter((found) => !isRecord(found));
  if (plant.expect === "pass") {
    if (run.exit !== 0 || findings.length > 0) return `expected exit 0 with no finding, got exit ${exit}${detail(findings, run)}`;
    if (plant.records === undefined) return undefined;
    const records = lines.filter(isRecord).map((found) => {
      const end = found.rest.indexOf(": ");
      return `${found.location} ${found.rest.slice(0, end)} "${found.rest.slice(end + 2)}"`;
    });
    const expected = plant.records.map((record) => `${record.location} ${record.mutator} "${record.reason}"`);
    return differ("records", expected, records);
  }
  const expected = plant.findings ?? [];
  if (run.exit !== 1) return `expected exit 1 with the plant's ${plural(expected.length, "finding")}, got exit ${exit}${detail(findings, run)}`;
  const key = (found: { readonly location: string; readonly rule: string }): string => `${found.location} ${found.rule}`;
  const differs = differ("findings", expected.map(key), findings.map(key));
  if (differs !== undefined) return differs;
  for (const wanted of expected) {
    if (wanted.message === undefined) continue;
    const { message } = wanted;
    const matches = findings.filter((found) => key(found) === key(wanted));
    if (!matches.some((found) => found.rest.includes(message))) return `finding ${key(wanted)} lacks "${message}"`;
  }
  return undefined;
}

/** The tools the plant job uses, in the repository root. */
export interface PlantTools {
  /** Reads a file (path relative to the root); undefined when it does not exist. */
  readonly read: (path: string) => Promise<string | undefined>;
  /** The names of the directories directly in a directory (path relative to the root); empty when it does not exist. */
  readonly dirs: (path: string) => Promise<readonly string[]>;
  /** Every file below a directory (path relative to the root), as paths relative to that directory. */
  readonly files: (path: string) => Promise<readonly string[]>;
  /** Builds the plant's temporary repository and runs the gate's plant command on it. */
  readonly runPlant: (gate: Gate, plant: string) => Promise<PlantRun>;
}

/** The rule of a plant that did not do what it expects. */
const missed = { fail: "not-caught", pass: "not-accepted", error: "not-reported-broken" } as const;

/** The registry check on a registry plant's gates.json and ci.yml, as a gate run (exit 0, 1 or 2). */
function registryRun(registryText: string | undefined, workflow: string | undefined): PlantRun {
  const broken = (cause: string): PlantRun => ({ exit: 2, stdout: [], stderr: [`${gateId}: could not run: ${cause}`] });
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
  for (const name of cases) {
    const path = `${dir}/${name}`;
    const plant = await loadPlant(path, tools);
    if (typeof plant === "string") {
      problems.push(plant);
      continue;
    }
    seen.add(plant.expect);
    const problem = await judge(plant, path);
    if (problem !== undefined) problems.push(`${path}: ${gateId}: ${missed[plant.expect]}: ${problem}`);
  }
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
  for (const gate of registry) {
    const set: PlantSet = { dir: `${plantsDir}/${gate.id}`, owner: `gate ${gate.id}`, needed: kinds, everyDir: true };
    const judged = await judgeAll(set, tools, async (plant, path) => judgePlant(gate.id, plant, await tools.runPlant(gate, path)));
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

/** Output text as lines, without empty ones. */
// Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
function lines(text: string): string[] {
  // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
  return text.split("\n").filter((line) => line !== "");
}

/** Builds the temporary repository of a plant in `into` and the placeholder values of its plant command. */
// Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
async function build(root: string, gate: Gate, plant: string, into: string): Promise<{ values: Record<string, string>; commits?: readonly string[] }> {
  // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
  switch (gate.plantForm) {
    case "repo-tree":
      // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
      await buildRepoTree(root, plant, into);
      // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
      return { values: { root: into } };
    case "commit-repo": {
      // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
      const { base, commits } = await buildCommitRepo(plant, into);
      // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
      return { values: { root: into, base }, commits };
    }
    case "mutation-repo": {
      // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
      const { base } = await buildMutationRepo(root, plant, into);
      // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
      return { values: { root: into, base } };
    }
    case "workspace":
      // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
      await cp(plant, into, { recursive: true });
      // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
      await rm(join(into, "plant.json"));
      // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
      return { values: { plant: into } };
  }
}

/** The file system and gate processes of the repository at `root`. */
// Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
function realTools(root: string, io: Io): PlantTools {
  // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
  return {
    // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
    read: (path) => readFile(join(root, path), "utf8").catch(() => undefined),
    // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
    dirs: async (path) => (await readdir(join(root, path), { withFileTypes: true }).catch(() => [])).filter((entry) => entry.isDirectory()).map((entry) => entry.name),
    // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
    files: async (path) => (await readdir(join(root, path), { recursive: true, withFileTypes: true }).catch(() => []))
      // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
      .filter((entry) => entry.isFile())
      // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
      .map((entry) => join(entry.parentPath, entry.name).slice(join(root, path).length + 1)),
    // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
    runPlant: async (gate, plant) => {
      // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
      const into = await mkdtemp(join(tmpdir(), `ocelle-plant-${gate.id}-`));
      // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
      try {
        // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
        const { values, commits } = await build(root, gate, join(root, plant), into);
        // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
        const [command = "", ...args] = plantArgs(gate.plantCommand, values);
        // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
        const ran = await runTool(command === "node" ? process.execPath : command, args, root, io.env);
        // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
        return { exit: ran.exitCode, stdout: lines(ran.stdout), stderr: lines(ran.stderr), ...(commits === undefined ? {} : { commits }) };
      } finally {
        // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
        await rm(into, { recursive: true, force: true });
      }
    },
  };
}

// Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
export async function run(argv: readonly string[], io: Io): Promise<number> {
  const context = parseArgs(argv, io.cwd);
  // Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
  return plants(context, realTools(context.root, io), io);
}

// Stryker disable next-line all: process boundary, covered by the plant job itself: pnpm run gate:plants (CI check Plants) runs every plant through it
if (import.meta.main) await main(run);
