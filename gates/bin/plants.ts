// The plant job (FR-025, research.md R-10, contracts/plants.md). Scaffold: signatures only.
import type { Context, Io } from "../lib/cli.ts";
import type { Gate } from "../lib/registry.ts";

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

/** A plant.json text as a plant, or the problem with it. */
export function parsePlant(_text: string): Plant | string {
  return "";
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
export function plantArgs(_command: string, _values: Readonly<Record<string, string>>): string[] {
  return [];
}

/** The problem with a gate's run on a plant, or undefined when the gate did what the plant expects. */
export function judgePlant(_gate: string, _plant: Plant, _run: PlantRun): string | undefined {
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

export function plants(_context: Context, _tools: PlantTools, _io: Io): Promise<number> {
  return Promise.resolve(0);
}

export function run(_argv: readonly string[], _io: Io): Promise<number> {
  return Promise.resolve(0);
}
