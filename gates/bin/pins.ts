// The install-and-pins gate (FR-027, research.md R-14): the lockfile matches the manifests (a frozen, lockfile-only,
// offline pnpm install changes nothing), every dependency of every manifest is an exact version (a workspace package
// as `workspace:<its version>`), `.node-version` and `packageManager` are exact, `pnpm-workspace.yaml` keeps the
// release-age and install-script policy of research.md R-04, and hoisting stays off. Plant mode (`--plant <dir>`)
// checks a plant's mini-workspace the same way, with file paths relative to it. The rules are in
// gates/lib/pins-rules.ts and the pnpm-workspace.yaml subset in gates/lib/workspace-yaml.ts; `checkFiles()` and
// `pins()` are the decision, tested in process with a pnpm double; `run()` gives it the file system and pnpm (the
// process boundary, tested by gates/test/integration/gates-root.test.ts).
import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { main, parseArgs } from "../lib/cli.ts";
import type { Context, Io } from "../lib/cli.ts";
import { directoryNames } from "../lib/entries.ts";
import { emit, plural } from "../lib/findings.ts";
import { dependencyFindings, lockfileVerdict, pinFindings, workspaceFindings } from "../lib/pins-rules.ts";
import type { PinsCheck, Settings } from "../lib/pins-rules.ts";
import { runTool } from "../lib/spawn.ts";
import type { ToolRun } from "../lib/spawn.ts";
import { parseWorkspaceYaml } from "../lib/workspace-yaml.ts";

export { lockfileVerdict } from "../lib/pins-rules.ts";
export type { PinsCheck } from "../lib/pins-rules.ts";

/** The files the pins rules read, as text (undefined when the file does not exist). */
export interface WorkspaceFiles {
  /** Each manifest by repository path: the root `package.json` and every workspace package's. */
  readonly manifests: readonly { readonly path: string; readonly text: string }[];
  readonly workspaceYaml: string | undefined;
  readonly nodeVersion: string | undefined;
}

const gate = "pins";
const install = ["install", "--frozen-lockfile", "--lockfile-only", "--offline", "--reporter=ndjson"];
const usage = "usage: gate:pins [-- --plant <dir>]";

/** The settings of pnpm-workspace.yaml (none when it does not exist), or the cause when it cannot be read. */
function readSettings(text: string | undefined): Settings | string {
  if (text === undefined) return {};
  try {
    return parseWorkspaceYaml(text);
  } catch (error) {
    return `pnpm-workspace.yaml cannot be read (${(error as Error).message}); fix the file`;
  }
}

/** The pins rules on the workspace files (every rule but the lockfile's), the root manifest's findings first. */
export function checkFiles(files: WorkspaceFiles): PinsCheck {
  const settings = readSettings(files.workspaceYaml);
  if (typeof settings === "string") return { cause: settings };
  const manifests: { path: string; json: Record<string, unknown> }[] = [];
  for (const manifest of files.manifests) {
    try {
      manifests.push({ path: manifest.path, json: JSON.parse(manifest.text) as Record<string, unknown> });
    } catch (error) {
      return { cause: `${manifest.path} is not valid JSON (${(error as Error).message}); fix the file` };
    }
  }
  const isRoot = (manifest: { readonly path: string }): boolean => manifest.path === "package.json";
  const packages = manifests.filter((manifest) => !isRoot(manifest));
  const siblings = new Map(packages.map((manifest) => [String(manifest.json.name), String(manifest.json.version)]));
  const roots = manifests.filter(isRoot);
  return {
    findings: [
      ...roots.flatMap((manifest) => dependencyFindings(manifest.path, manifest.json, siblings)),
      ...pinFindings(roots[0]?.json ?? {}, files.nodeVersion),
      ...packages.flatMap((manifest) => dependencyFindings(manifest.path, manifest.json, siblings)),
      ...workspaceFindings(settings),
    ],
  };
}

/** The tools the pins gate uses, in the workspace root. */
export interface PinsTools {
  /** Reads a file (path relative to the root); undefined when it does not exist. */
  readonly read: (path: string) => Promise<string | undefined>;
  /** The names of the directories directly in a directory (path relative to the root); empty when it does not exist. */
  readonly dirs: (path: string) => Promise<readonly string[]>;
  /** Runs pnpm with these arguments. */
  readonly pnpm: (args: readonly string[]) => Promise<ToolRun>;
}

/** The plant directory of `--plant <dir>` (relative to the root), "" without it, or the problem with the arguments. */
function parsePlant(context: Context): { readonly dir: string } | { readonly problem: string } {
  let dir = "";
  for (let i = 0; i < context.args.length; i += 1) {
    const arg = context.args[i];
    if (arg === "--") continue;
    if (arg !== "--plant") return { problem: `unknown argument ${String(arg)}` };
    const value = context.args[i + 1];
    if (value === undefined || value === "") return { problem: "--plant needs a directory" };
    dir = relative(context.root, resolve(context.root, value));
    i += 1;
  }
  return { dir };
}

/** The workspace package directories of pnpm-workspace.yaml's `packages` (each `<dir>/*` lists the dirs in `<dir>`). */
async function packageDirs(settings: Settings, at: (path: string) => string, tools: PinsTools): Promise<string[]> {
  const patterns = settings.packages;
  const dirs: string[] = [];
  for (const pattern of Array.isArray(patterns) ? patterns.map(String) : []) {
    const parent = /^(.*)\/\*$/.exec(pattern)?.[1];
    if (parent === undefined) dirs.push(pattern);
    else dirs.push(...(await tools.dirs(at(parent))).map((name) => `${parent}/${name}`));
  }
  return dirs.sort();
}

export async function pins(context: Context, tools: PinsTools, io: Io): Promise<number> {
  const fail = (cause: string): number => emit({ exit: 2, cause: `${gate}: could not run: ${cause}` }, io.out, io.err);
  const plant = parsePlant(context);
  if ("problem" in plant) return fail(`${plant.problem}; ${usage}`);
  const at = (path: string): string => (plant.dir === "" ? path : join(plant.dir, path));
  const rootText = await tools.read(at("package.json"));
  if (rootText === undefined) return fail("package.json is missing; run the gate in the workspace root");
  const workspaceYaml = await tools.read(at("pnpm-workspace.yaml"));
  const settings = readSettings(workspaceYaml);
  if (typeof settings === "string") return fail(settings);
  const manifests = [{ path: "package.json", text: rootText }];
  for (const dir of await packageDirs(settings, at, tools)) {
    const text = await tools.read(at(`${dir}/package.json`));
    if (text !== undefined) manifests.push({ path: `${dir}/package.json`, text });
  }
  const checked = checkFiles({ manifests, workspaceYaml, nodeVersion: await tools.read(at(".node-version")) });
  if ("cause" in checked) return fail(checked.cause);
  const ran = await tools.pnpm(plant.dir === "" ? install : ["--dir", resolve(context.root, plant.dir), ...install]);
  const lockfile = lockfileVerdict({ exitCode: ran.exitCode, output: `${ran.stdout}${ran.stderr}` });
  if ("cause" in lockfile) return fail(lockfile.cause);
  const findings = [...lockfile.findings, ...checked.findings];
  if (findings.length > 0) {
    const files = new Set(findings.map((found) => ("path" in found.location ? found.location.path : ""))).size;
    return emit({ exit: 1, findings, summary: `${gate}: ${plural(findings.length, "finding")} in ${plural(files, "file")}` }, io.out, io.err);
  }
  return emit({ exit: 0, summary: `${gate}: ${plural(manifests.length, "manifest")} checked, no finding` }, io.out, io.err);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "pins --root <tmp> exits 1 with exactly the lockfile finding"
function realTools(root: string, env: Io["env"]): PinsTools {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "pins --root <tmp> exits 1 with exactly the lockfile finding"
  return {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "pins --root <tmp> exits 1 with exactly the lockfile finding"
    read: (path) => readFile(resolve(root, path), "utf8").catch(() => undefined),
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "pins --root <tmp> exits 1 with exactly the lockfile finding"
    dirs: async (path) => directoryNames(await readdir(resolve(root, path), { withFileTypes: true }).catch(() => [])),
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "pins --root <tmp> exits 1 with exactly the lockfile finding"
    pnpm: (args) => runTool("pnpm", args, root, env),
  };
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "pins --root <tmp> exits 1 with exactly the lockfile finding"
export async function run(argv: readonly string[], io: Io): Promise<number> {
  const context = parseArgs(argv, io.cwd);
  return pins(context, realTools(context.root, io.env), io);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "pins --root <tmp> exits 1 with exactly the lockfile finding"
if (import.meta.main) await main(run);
