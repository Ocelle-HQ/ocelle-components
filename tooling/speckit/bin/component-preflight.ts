// Contributor checks for Op 034. The manifest gate and Vitest supply the observations printed in these receipts.
import { cp, lstat, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { parseArgs as parseOptions } from "node:util";
import { run as runManifest } from "../../../gates/bin/manifest.ts";
import { main, parseArgs } from "../../../gates/lib/cli.ts";
import type { Io } from "../../../gates/lib/cli.ts";
import { compareOverlayFindings, focusedStorybookTests, hasUniqueHostRoute } from "../../../gates/lib/component-preflight.ts";
import { oneLine } from "../../../gates/lib/findings.ts";
import { inScope } from "../../../gates/lib/mutation/ranges.ts";
import { gateKeysProblem, parsePlant } from "../../../gates/lib/plant-judge.ts";
import type { Plant } from "../../../gates/lib/plant-judge.ts";
import { runTool } from "../../../gates/lib/spawn.ts";

const manifestPath = "packages/elements/custom-elements.json";
const elementsSource = "packages/elements/src";
const manifestPlants = "gates/plants/manifest";
const findingMarker = ": manifest: ";
const normalVitestConfig = "vitest.config.ts";
const strykerConfig = "stryker.config.json";
const usage = "usage: component-preflight.ts manifest [--root DIR]\n"
  + "       component-preflight.ts host --source FILE --test FILE --project NAME [--root DIR]";

interface OverlayReceipt {
  readonly descriptor: string;
  readonly fixturePaths: readonly string[];
  readonly findings: readonly string[];
  readonly unexpectedFindings: readonly string[];
  readonly missingFindings: readonly string[];
}

function missingFile(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | undefined)?.code === "ENOENT";
}

async function fileExists(path: string): Promise<boolean> {
  try {
    if (!(await lstat(path)).isFile()) throw new Error(`${path} must be a regular file`);
    return true;
  } catch (error) {
    if (missingFile(error)) return false;
    throw error;
  }
}

function expectation(descriptor: string, text: string): Plant {
  const plant = parsePlant(text);
  if (typeof plant === "string") throw new Error(`${descriptor}: ${plant}`);
  const problem = gateKeysProblem("manifest", plant);
  if (problem !== undefined) throw new Error(`${descriptor}: ${problem}`);
  return plant;
}

async function runOverlay(root: string, tree: string, io: Io): Promise<readonly string[]> {
  const work = await mkdtemp(join(tmpdir(), "ocelle-component-preflight-"));
  try {
    await cp(join(root, elementsSource), join(work, elementsSource), { recursive: true });
    await cp(join(root, tree), work, { recursive: true });
    const out: string[] = [];
    const err: string[] = [];
    const exit = await runManifest(["--root", work], { ...io, out: (line) => out.push(line), err: (line) => err.push(line) });
    if (exit === 2) throw new Error(`${tree}/${manifestPath}: ${err.join(" ")}`);
    return out.filter((line) => line.includes(findingMarker));
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

async function checkOverlay(root: string, directory: string, io: Io): Promise<OverlayReceipt | undefined> {
  const descriptor = `${directory}/plant.json`;
  const plant = expectation(descriptor, await readFile(join(root, descriptor), "utf8"));
  if (plant.expect === "error") return undefined;
  const tree = `${directory}/tree`;
  const snapshot = `${tree}/${manifestPath}`;
  if (!await fileExists(join(root, snapshot))) return undefined;

  const treePath = join(root, tree);
  const entries = await readdir(treePath, { recursive: true, withFileTypes: true });
  const fixturePaths = entries.filter((entry) => entry.isFile())
    .map((entry) => `${tree}/${relative(treePath, join(entry.parentPath, entry.name)).split(sep).join("/")}`).sort();
  const expected = (plant.findings ?? []).map(({ location, rule, message }) =>
    `${location}${findingMarker}${oneLine(rule)}: ${oneLine(message ?? "")}`);
  const findings = await runOverlay(root, tree, io);
  const { unexpectedFindings, missingFindings } = compareOverlayFindings(expected, findings);
  const affectedPath = (finding: string): string => `${tree}/${finding.slice(0, finding.indexOf(findingMarker))}`;
  for (const finding of unexpectedFindings) {
    io.err(`${affectedPath(finding)}: unexpected finding ${finding}. Update the overlay against the candidate while preserving its intended defect.`);
  }
  for (const finding of missingFindings) {
    io.err(`${affectedPath(finding)}: missing expected finding ${finding}. Restore the fixture input or update ${descriptor} for an intentional change.`);
  }
  return { descriptor, fixturePaths, findings, unexpectedFindings, missingFindings };
}

async function checkManifest(root: string, io: Io): Promise<number> {
  const entries = await readdir(join(root, manifestPlants), { withFileTypes: true });
  const directories = entries.filter((entry) => entry.isDirectory()).map(({ name }) => name).sort();
  const overlays: OverlayReceipt[] = [];
  for (const directory of directories) {
    const receipt = await checkOverlay(root, `${manifestPlants}/${directory}`, io);
    if (receipt !== undefined) overlays.push(receipt);
  }
  if (overlays.length === 0) throw new Error(`${manifestPlants}: found no full manifest overlays`);
  io.out(JSON.stringify({ overlays }));
  return overlays.some(({ unexpectedFindings, missingFindings }) => unexpectedFindings.length > 0 || missingFindings.length > 0) ? 1 : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function repoPath(path: string): boolean {
  return !isAbsolute(path) && !path.includes("\\") && path.split("/").every((part) => part !== "" && part !== "." && part !== "..");
}

async function configuredMutationVitest(root: string): Promise<string> {
  const config: unknown = JSON.parse(await readFile(join(root, strykerConfig), "utf8"));
  if (!isRecord(config) || config.testRunner !== "vitest" || !isRecord(config.vitest)
    || typeof config.vitest.configFile !== "string" || !repoPath(config.vitest.configFile)) {
    throw new Error(`${strykerConfig}: expected the default Vitest runner and its repository-relative configFile`);
  }
  return config.vitest.configFile;
}

async function discoverProjects(root: string, cli: string, config: string, test: string, io: Io): Promise<string[]> {
  // File-only discovery loads the real configuration without running tests, browser providers, or global setups.
  const { exitCode, stdout, stderr } = await runTool(process.execPath, [cli, "list", test, "--config", config, "--filesOnly", "--json"], root, io.env);
  if (exitCode !== 0) throw new Error(`${config}: Vitest could not discover ${test}: ${oneLine(stderr || stdout)}`);
  const output: unknown = JSON.parse(stdout);
  if (!Array.isArray(output)) throw new Error(`${config}: Vitest did not print its file discovery list`);
  const projects: string[] = [];
  for (const entry of output as unknown[]) {
    if (!isRecord(entry) || typeof entry.file !== "string" || (entry.projectName !== undefined && typeof entry.projectName !== "string")) {
      throw new Error(`${config}: Vitest printed an invalid file discovery entry`);
    }
    // Vitest's filter accepts substrings. Match the exact declared file before counting its owners.
    if (resolve(root, entry.file) === resolve(root, test)) projects.push(entry.projectName ?? "(unlabelled)");
  }
  return projects.sort();
}

async function checkHost(root: string, args: readonly string[], io: Io): Promise<number> {
  const { values: { source, test, project } } = parseOptions({
    args: [...args],
    options: { source: { type: "string" }, test: { type: "string" }, project: { type: "string" } },
  });
  if (source === undefined || test === undefined || project === undefined || project.trim() === "") throw new Error(usage);
  if (!repoPath(source) || !source.startsWith("storybook/") || !inScope(source) || !await fileExists(join(root, source))) {
    throw new Error(`${source}: declare an existing Storybook host source in mutation scope`);
  }
  if (!repoPath(test) || !test.startsWith("storybook/test/") || !await fileExists(join(root, test))) {
    throw new Error(`${test}: declare an existing Storybook test file`);
  }

  const mutationVitestConfig = await configuredMutationVitest(root);
  const require = createRequire(join(root, "package.json"));
  const cli = join(dirname(require.resolve("vitest/package.json")), "vitest.mjs");
  const normalProjects = await discoverProjects(root, cli, normalVitestConfig, test, io);
  const mutationProjects = await discoverProjects(root, cli, mutationVitestConfig, test, io);
  io.out(JSON.stringify({
    source, test, project, normalVitestConfig, strykerConfig, mutationVitestConfig, normalProjects, mutationProjects,
    mutationEvidence: "required",
  }));
  if (hasUniqueHostRoute(test, project, normalProjects, mutationProjects)) return 0;
  io.err(`${test}: ${source} needs one focused in-process test in ${project}, discovered once by both configurations. `
    + `Normal owners: ${normalProjects.join(", ") || "none"}. Default mutation owners: ${mutationProjects.join(", ") || "none"}. `
    + `Declare a test under ${focusedStorybookTests}browser/ for a browser host and rerun discovery.`);
  return 1;
}

export async function run(argv: readonly string[], io: Io): Promise<number> {
  const { root, args: [command, ...args] } = parseArgs(argv, io.cwd);
  if (command === "manifest" && args.length === 0) return checkManifest(root, io);
  if (command === "host") return checkHost(root, args, io);
  io.err(usage);
  return 2;
}

if (import.meta.main) await main(run);
