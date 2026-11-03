// Running one plant through its gate (FR-025, research.md R-10, contracts/plants.md): a new temporary directory, the
// plant's temporary repository built there in the gate's plant form, the gate's plant command with its placeholders
// filled in, run with the current Node for `node`, and the directory removed again; plus the limit on gate runs at
// once. The decisions (which builder, which placeholder values, the output lines, the limit) are here and tested in
// process (gates/test/plant-runner.test.ts) with doubles for the tools; gates/bin/plants.ts gives the real ones.
import { join } from "node:path";
import { plantArgs } from "./plant-judge.ts";
import type { Plant, PlantRun } from "./plant-judge.ts";
import type { Gate, PlantForm } from "./registry.ts";
import type { ToolRun } from "./spawn.ts";

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
    const [command = "", ...args] = plantArgs(gate.plantCommand, plantValues(gate.plantForm, into, built, plant));
    const ran = await tools.run(command === "node" ? tools.node : command, args);
    const commits = built.commits === undefined ? {} : { commits: built.commits };
    return { exit: ran.exitCode, stdout: outputLines(ran.stdout), stderr: outputLines(ran.stderr), ...commits };
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
