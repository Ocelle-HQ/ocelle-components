// Gate entry wrapper and `--root` parsing (contracts/gate-cli.md, research.md R-09). Scaffold: signatures only.
import type { Write } from "./findings.ts";

/** What a gate run sees of its process: working directory, environment and output. */
export interface Io {
  readonly cwd: string;
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly out: Write;
  readonly err: Write;
}

/** Parsed command line: the repository root, the tool's working directory, and every other argument. */
export interface Context {
  readonly root: string;
  readonly toolCwd: string;
  readonly args: readonly string[];
}

/** A gate's run function: returns the exit code under the 0/1/2 contract. */
export type Run = (argv: readonly string[], io: Io) => number | Promise<number>;

export function parseArgs(_argv: readonly string[], _cwd: string): Context {
  return { root: "", toolCwd: "", args: [] };
}

/** Calls a gate's run function; any uncaught error becomes exit 2 with one line naming its cause. */
export async function entry(_run: Run, _argv: readonly string[], _io: Io): Promise<number> {
  return 0;
}

/** The Io of the current process. */
export function processIo(): Io {
  return { cwd: "", env: {}, out: () => undefined, err: () => undefined };
}

/** Runs a gate as the process entry point and sets the process exit code. */
export async function main(_run: Run): Promise<void> {
  // Scaffold: no behaviour.
}
