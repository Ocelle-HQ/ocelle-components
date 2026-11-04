// Running one plant through its gate (FR-025, research.md R-10, contracts/plants.md): a new temporary directory, the
// plant's temporary repository built there in the gate's plant form, the gate's plant command with its placeholders
// filled in, run with the current Node for `node`, the plant's keyed locations resolved in the built tree (002
// contracts/gates.md § Keyed locations), and the directory removed again; plus the limit on gate runs at once. The decisions (which builder, which placeholder values, the output lines, the limit) are here and tested in
// process (gates/test/plant-runner.test.ts) with doubles for the tools; gates/bin/plants.ts gives the real ones.
import { join } from "node:path";
import { plantArgs } from "./plant-judge.ts";
import type { ExpectedFinding, Plant, PlantRun } from "./plant-judge.ts";
import type { Gate, PlantForm } from "./registry.ts";
import type { ToolRun } from "./spawn.ts";
import { pairLines, tokenLines } from "./token-source.ts";

/** What building a plant's temporary repository gives: its base commit and its record commits, where it has them. */
export interface BuiltRepo {
  readonly base?: string;
  readonly commits?: readonly string[];
}

/** The tools of the plant runner: the file system, the builders of each plant form, and gate processes. */
export interface RunnerTools {
  /** Makes a new empty temporary directory whose name starts with `prefix`. */
  readonly tempDir: (prefix: string) => Promise<string>;
  /** Removes a directory and everything in it. */
  readonly removeDir: (dir: string) => Promise<void>;
  /** Builds a plant (absolute path) into a directory, by plant form. */
  readonly build: Readonly<Record<PlantForm, (plant: string, into: string) => Promise<BuiltRepo>>>;
  /** Runs a command in the repository root. */
  readonly run: (command: string, args: readonly string[]) => Promise<ToolRun>;
  /** The executable that runs `node` (the current Node). */
  readonly node: string;
  /** Reads a file (absolute path); undefined when it does not exist. */
  readonly read: (path: string) => Promise<string | undefined>;
  /** The stylesheet text the generator of the repository at `root` produces from its token source. */
  readonly stylesheet: (root: string) => Promise<string>;
}

/** What key resolution reads of a plant's built tree (paths relative to it). */
export interface TreeView {
  readonly read: (path: string) => Promise<string | undefined>;
  readonly stylesheet: () => Promise<string>;
}

/** The keyed locations a plant may write, by repository path (002 contracts/gates.md § Keyed locations). */
const keyedPaths = {
  pairs: "packages/tokens/contrast/pairs.json",
  source: "packages/tokens/src/source.ts",
  overrides: "packages/tokens/src/overrides.ts",
  stylesheet: "packages/tokens/dist/tokens.css",
} as const;

/** The line a key resolves to in a file's text, or throws naming the key: none, or two for a token or pair key. */
function lineIn(location: string, lines: readonly number[]): number {
  const [line] = lines;
  if (line === undefined) throw new Error(`keyed location ${location} resolves to no line`);
  if (lines.length > 1) throw new Error(`keyed location ${location} resolves to ${String(lines.length)} lines`);
  return line;
}

/** The line of one keyed location in the built tree. */
async function resolveKey(location: string, path: string, key: string, view: TreeView): Promise<number> {
  if (path === keyedPaths.stylesheet) {
    return lineIn(location, [(await view.stylesheet()).split("\n").findIndex((line) => line.includes(key)) + 1].filter((line) => line > 0));
  }
  if (path !== keyedPaths.pairs && path !== keyedPaths.source && path !== keyedPaths.overrides) {
    throw new Error(`keyed location ${location} is not a keyed location (pairs.json, source.ts, overrides.ts or dist/tokens.css)`);
  }
  const parts = key.split("/");
  if (path === keyedPaths.pairs && parts.length !== 3) throw new Error(`keyed location ${location} is not <theme>/<fg>/<bg>`);
  const text = await view.read(path);
  if (text === undefined) throw new Error(`keyed location ${location}: ${path} is not in the plant's tree`);
  const [theme, fg, bg] = parts as [string, string, string];
  return lineIn(location, path === keyedPaths.pairs ? pairLines(text, theme, fg, bg) : tokenLines(text, key));
}

/**
 * The expected findings with every keyed location (`<path>#<key>`, 002 contracts/gates.md § Keyed locations)
 * resolved to `<path>:<line>` in the built tree; throws naming a key that resolves to no line or, for a token or pair
 * key, to two.
 */
export async function resolveLocations(findings: readonly ExpectedFinding[], view: TreeView): Promise<ExpectedFinding[]> {
  const resolved: ExpectedFinding[] = [];
  for (const finding of findings) {
    const at = finding.location.indexOf("#");
    if (at === -1) {
      resolved.push(finding);
      continue;
    }
    const path = finding.location.slice(0, at);
    const line = await resolveKey(finding.location, path, finding.location.slice(at + 1), view);
    resolved.push({ ...finding, location: `${path}:${String(line)}` });
  }
  return resolved;
}

/** The message of a thrown value: an Error's message, anything else as text. */
export function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Output text as lines, without empty ones. */
export function outputLines(text: string): string[] {
  return text.split("\n").filter((line) => line !== "");
}

/**
 * The placeholder values of a plant command: `{plant}`, the copy of a workspace plant; otherwise `{root}`, the
 * temporary repository, and `{base}`, the plant's own base if it sets one, else the repository's base commit.
 */
export function plantValues(form: PlantForm, into: string, built: BuiltRepo, plant: Plant): Record<string, string> {
  if (form === "workspace") return { plant: into };
  const base = plant.base ?? built.base;
  return base === undefined ? { root: into } : { root: into, base };
}

/** Builds the plant's temporary repository, runs the gate's plant command on it, and removes the repository. */
export async function runPlant(tools: RunnerTools, root: string, gate: Gate, path: string, plant: Plant): Promise<PlantRun> {
  const into = await tools.tempDir(`ocelle-plant-${gate.id}-`);
  try {
    const built = await tools.build[gate.plantForm](join(root, path), into).catch((error: unknown) => {
      throw new Error(`${path}: cannot build its temporary repository (${errorText(error)})`, { cause: error });
    });
    const [command, ...args] = plantArgs(gate.plantCommand, plantValues(gate.plantForm, into, built, plant));
    const ran = await tools.run(command === "node" ? tools.node : String(command), args);
    const commits = built.commits === undefined ? {} : { commits: built.commits };
    const findings = plant.findings ?? [];
    const view: TreeView = { read: (file) => tools.read(join(into, file)), stylesheet: () => tools.stylesheet(into) };
    const expected = findings.some((finding) => finding.location.includes("#"))
      ? {
          expected: await resolveLocations(findings, view).catch((error: unknown) => {
            throw new Error(`${path}: ${errorText(error)}`, { cause: error });
          }),
        }
      : {};
    return { exit: ran.exitCode, stdout: outputLines(ran.stdout), stderr: outputLines(ran.stderr), ...commits, ...expected };
  } finally {
    await tools.removeDir(into);
  }
}

/** A limit on how many tasks run at once: `limit(task)` starts `task` when one of `size` slots is free. */
export function limiter(size: number): <T>(task: () => Promise<T>) => Promise<T> {
  let running = 0;
  const waiting: (() => void)[] = [];
  const release = (): void => {
    running -= 1;
    waiting.shift()?.();
  };
  return async (task) => {
    if (running >= size) await new Promise<void>((resolve) => waiting.push(resolve));
    running += 1;
    return task().finally(release);
  };
}

/** How many gate runs start at once: half the processors (at least one), since a gate run starts its own workers. */
export function gateRunsAtOnce(processors: number): number {
  return Math.max(1, Math.floor(processors / 2));
}
