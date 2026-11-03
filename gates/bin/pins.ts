// The install-and-pins gate (FR-027, research.md R-14): the lockfile matches the manifests (a frozen, lockfile-only,
// offline pnpm install changes nothing), every dependency of every manifest is an exact version (a workspace package
// as `workspace:<its version>`), `.node-version` and `packageManager` are exact, `pnpm-workspace.yaml` keeps the
// release-age and install-script policy of research.md R-04, and hoisting stays off. Plant mode (`--plant <dir>`)
// checks a plant's mini-workspace the same way, with file paths relative to it. `pins()` is the decision, tested in
// process with a pnpm double; `run()` gives it the file system and pnpm (the process boundary, tested by
// gates/test/integration/gates-root.test.ts).
import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { main, parseArgs } from "../lib/cli.ts";
import type { Context, Io } from "../lib/cli.ts";
import { emit, oneLine, plural } from "../lib/findings.ts";
import type { Finding } from "../lib/findings.ts";
import { runTool } from "../lib/spawn.ts";
import type { ToolRun } from "../lib/spawn.ts";

/** The files the pins rules read, as text (undefined when the file does not exist). */
export interface WorkspaceFiles {
  /** Each manifest by repository path: the root `package.json` and every workspace package's. */
  readonly manifests: readonly { readonly path: string; readonly text: string }[];
  readonly workspaceYaml: string | undefined;
  readonly nodeVersion: string | undefined;
}

/** Findings, or the cause when an input cannot be read or parsed. */
export type PinsCheck = { readonly findings: readonly Finding[] } | { readonly cause: string };

const gate = "pins";
const exact = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const dependencyFields = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
const install = ["install", "--frozen-lockfile", "--lockfile-only", "--offline", "--reporter=ndjson"];
const usage = "usage: gate:pins [-- --plant <dir>]";

/** A value of the YAML subset pnpm-workspace.yaml uses: a scalar, a list of scalars or a map of scalars. */
type Yaml = string | number | boolean | null | readonly Yaml[] | { readonly [key: string]: Yaml };

/** A YAML value as one line of text: a scalar as written, a collection as JSON. */
function show(value: unknown): string {
  return typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
}

/** A scalar: a quoted string, true, false, null, a number, or a plain string. */
function scalar(text: string): Yaml {
  const value = text.trim();
  if (/^(['"]).*\1$/.test(value)) return value.slice(1, -1);
  if (value === "true" || value === "false") return value === "true";
  if (value === "null" || value === "~" || value === "") return null;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  if (/^[&*!|>[\]{},]/.test(value)) throw new Error(`unsupported value ${value}`);
  return value;
}

/** A flow collection on one line: `[a, b]` or `{ a: 1, b: 2 }`; anything else is a scalar. */
function flow(text: string): Yaml {
  const value = text.trim();
  const list = /^\[(.*)\]$/.exec(value);
  if (list !== null) return list[1]?.trim() === "" ? [] : String(list[1]).split(",").map(scalar);
  const map = /^\{(.*)\}$/.exec(value);
  if (map === null) return scalar(value);
  if (map[1]?.trim() === "") return {};
  return Object.fromEntries(
    String(map[1])
      .split(",")
      .map((entry) => {
        const pair = /^\s*([^:]+?)\s*:\s*(.*)$/.exec(entry);
        if (pair === null) throw new Error(`unsupported entry ${entry.trim()}`);
        return [show(scalar(String(pair[1]))), scalar(String(pair[2]))];
      }),
  );
}

/** The top-level keys of the YAML subset of pnpm-workspace.yaml; throws on anything outside it. */
function readYaml(text: string): Record<string, Yaml> {
  const settings: Record<string, Yaml> = {};
  let open: { key: string; list: Yaml[]; map: Record<string, Yaml>; indent: number | undefined } | undefined;
  const close = (): void => {
    if (open === undefined) return;
    settings[open.key] = open.list.length > 0 ? open.list : Object.keys(open.map).length > 0 ? open.map : null;
    open = undefined;
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, "").replace(/^#.*$/, "");
    if (line.trim() === "") continue;
    const indent = /^ */.exec(line)?.[0].length ?? 0;
    if (indent === 0) {
      close();
      const pair = /^([A-Za-z][\w-]*)\s*:(.*)$/.exec(line);
      if (pair === null) throw new Error(`unsupported line ${line.trim()}`);
      const [, key = "", rest = ""] = pair;
      if (rest.trim() === "") open = { key, list: [], map: {}, indent: undefined };
      else settings[key] = flow(rest);
      continue;
    }
    if (open === undefined || (open.indent !== undefined && open.indent !== indent)) {
      throw new Error(`unexpected indentation at ${line.trim()}`);
    }
    open.indent = indent;
    const item = /^ *- (.*)$/.exec(line);
    if (item !== null) {
      open.list.push(scalar(String(item[1])));
      continue;
    }
    const entry = /^ *([^:]+?)\s*:(.*)$/.exec(line);
    if (entry === null) throw new Error(`unsupported line ${line.trim()}`);
    open.map[show(scalar(String(entry[1])))] = scalar(String(entry[2]));
  }
  close();
  return settings;
}

function finding(path: string, rule: string, message: string): Finding {
  return { location: { path }, gate, rule, message };
}

/** The dependency findings of one manifest, given the workspace packages' versions by name. */
function dependencyFindings(path: string, manifest: Record<string, unknown>, siblings: ReadonlyMap<string, string>): Finding[] {
  const found: Finding[] = [];
  for (const field of dependencyFields) {
    const dependencies = manifest[field];
    if (typeof dependencies !== "object" || dependencies === null) continue;
    for (const [name, value] of Object.entries(dependencies as Record<string, unknown>)) {
      const spec = String(value);
      const sibling = siblings.get(name);
      const workspace = /^workspace:(.*)$/.exec(spec)?.[1];
      const named = `${field}.${name} is "${spec}"`;
      if (workspace !== undefined && !exact.test(workspace)) {
        found.push(finding(path, "range", `${named}, not an exact version`));
      } else if (workspace !== undefined && sibling === undefined) {
        found.push(finding(path, "workspace", `${named}, but ${name} is not a workspace package`));
      } else if (sibling !== undefined && workspace !== sibling) {
        found.push(finding(path, "workspace", `${named}, but ${name} is at ${sibling}; write "workspace:${sibling}"`));
      } else if (sibling === undefined && !exact.test(spec)) {
        found.push(finding(path, "range", `${named}, not an exact version`));
      }
    }
  }
  return found;
}

function pinFindings(root: Record<string, unknown>, nodeVersion: string | undefined): Finding[] {
  const found: Finding[] = [];
  const manager = root.packageManager;
  if (manager === undefined) {
    found.push(finding("package.json", "package-manager", "packageManager is missing; pin pnpm exactly (pnpm@<major>.<minor>.<patch>)"));
  } else if (!/^pnpm@\d+\.\d+\.\d+(?:\+[\w.-]+)?$/.test(show(manager))) {
    found.push(finding("package.json", "package-manager", `packageManager is "${show(manager)}", not an exact pnpm version`));
  }
  if (nodeVersion === undefined) {
    found.push(finding(".node-version", "node-version", ".node-version is missing; pin the exact Node version (for example 26.13.0)"));
  } else if (!/^v?\d+\.\d+\.\d+$/.test(nodeVersion.trim())) {
    found.push(finding(".node-version", "node-version", `.node-version is "${nodeVersion.trim()}", not an exact version`));
  }
  return found;
}

/** The names of the entries of a map setting that are `true`; a list's entries all count. */
function allowed(value: Yaml | undefined): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).filter(([, allow]) => allow === true).map(([name]) => name);
}

function workspaceFindings(settings: Readonly<Record<string, Yaml>>): Finding[] {
  const path = "pnpm-workspace.yaml";
  const found: Finding[] = [];
  const add = (rule: string, message: string): void => {
    found.push(finding(path, rule, message));
  };
  const age = settings.minimumReleaseAge;
  if (age === undefined) add("release-age", "minimumReleaseAge is missing; set it to at least 10080 (7 days)");
  else if (typeof age !== "number") add("release-age", `minimumReleaseAge is "${show(age)}", not a number; set it to at least 10080 (7 days)`);
  else if (age < 10080) add("release-age", `minimumReleaseAge is ${show(age)}, below 10080 (7 days)`);
  const strict = settings.minimumReleaseAgeStrict;
  if (strict === undefined) add("release-age", "minimumReleaseAgeStrict is missing; set it to true");
  else if (strict !== true) add("release-age", `minimumReleaseAgeStrict is ${show(strict)}; set it to true`);
  const excluded = settings.minimumReleaseAgeExclude;
  if (Array.isArray(excluded) && excluded.length > 0) {
    add("release-age", `minimumReleaseAgeExclude lists ${excluded.map(String).join(", ")}; remove the exclusion`);
  }
  if (!("allowBuilds" in settings)) add("allow-builds", "allowBuilds is missing; set it to {} (no dependency may run an install script)");
  for (const name of allowed(settings.allowBuilds)) add("allow-builds", `allowBuilds lets ${name} run install scripts; remove the entry`);
  if ("dangerouslyAllowAllBuilds" in settings) add("allow-builds", "dangerouslyAllowAllBuilds is set; remove it");
  if (settings.shamefullyHoist === true) add("hoisting", "shamefullyHoist is true; remove it");
  const hoisted = settings.publicHoistPattern;
  if (Array.isArray(hoisted) && hoisted.length > 0) add("hoisting", `publicHoistPattern is not empty (${hoisted.map(String).join(", ")}); remove it`);
  const linker = settings.nodeLinker;
  if (linker !== undefined && linker !== "isolated") add("hoisting", `nodeLinker is ${show(linker)}; use isolated`);
  return found;
}

function readSettings(text: string | undefined): Record<string, Yaml> | string {
  if (text === undefined) return {};
  try {
    return readYaml(text);
  } catch (error) {
    return `pnpm-workspace.yaml cannot be read (${error instanceof Error ? error.message : String(error)}); fix the file`;
  }
}

/** The pins rules on the workspace files (every rule but the lockfile's). */
export function checkFiles(files: WorkspaceFiles): PinsCheck {
  const settings = readSettings(files.workspaceYaml);
  if (typeof settings === "string") return { cause: settings };
  const manifests: { path: string; json: Record<string, unknown> }[] = [];
  for (const manifest of files.manifests) {
    try {
      manifests.push({ path: manifest.path, json: JSON.parse(manifest.text) as Record<string, unknown> });
    } catch (error) {
      return { cause: `${manifest.path} is not valid JSON (${error instanceof Error ? error.message : String(error)}); fix the file` };
    }
  }
  const siblings = new Map(
    manifests
      .filter((manifest) => manifest.path !== "package.json")
      .map((manifest) => [String(manifest.json.name), String(manifest.json.version)]),
  );
  const root = manifests.find((manifest) => manifest.path === "package.json")?.json ?? {};
  return {
    findings: [
      ...manifests.filter((manifest) => manifest.path === "package.json").flatMap((manifest) => dependencyFindings(manifest.path, manifest.json, siblings)),
      ...pinFindings(root, files.nodeVersion),
      ...manifests.filter((manifest) => manifest.path !== "package.json").flatMap((manifest) => dependencyFindings(manifest.path, manifest.json, siblings)),
      ...workspaceFindings(settings),
    ],
  };
}

/** The first error record of pnpm's ndjson log. */
function firstError(output: string): { readonly code: string; readonly message: string } | undefined {
  for (const line of output.split("\n")) {
    let record: unknown;
    try {
      record = JSON.parse(line);
    } catch {
      continue;
    }
    const fields = record as { level?: unknown; code?: unknown; message?: unknown } | null;
    if (fields?.level !== "error") continue;
    return { code: String(fields.code), message: String(fields.message) };
  }
  return undefined;
}

/** The lockfile verdict on one `pnpm install --frozen-lockfile --lockfile-only --offline --reporter=ndjson` run. */
export function lockfileVerdict(run: { readonly exitCode: number | null; readonly output: string }): PinsCheck {
  if (run.exitCode === 0) return { findings: [] };
  const command = "pnpm install --frozen-lockfile --lockfile-only --offline";
  const error = firstError(run.output);
  if (error === undefined) return { cause: `${command} failed (exit ${String(run.exitCode)}); run pnpm run setup:online` };
  if (error.code === "ERR_PNPM_OUTDATED_LOCKFILE") {
    const message = "pnpm-lock.yaml is not up to date with the manifests; run pnpm install and commit pnpm-lock.yaml";
    return { findings: [finding("pnpm-lock.yaml", "lockfile", message)] };
  }
  return { cause: `${command} failed: ${error.code}: ${oneLine(String(error.message.split("\n")[0]))}; run pnpm run setup:online` };
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
async function packageDirs(settings: Readonly<Record<string, Yaml>>, at: (path: string) => string, tools: PinsTools): Promise<string[]> {
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
    dirs: async (path) => (await readdir(resolve(root, path), { withFileTypes: true }).catch(() => [])).filter((entry) => entry.isDirectory()).map((entry) => entry.name),
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
