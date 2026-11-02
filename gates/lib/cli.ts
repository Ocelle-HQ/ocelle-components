// Gate entry wrapper and `--root` parsing (contracts/gate-cli.md, research.md R-09).
import { resolve } from "node:path";
import { oneLine } from "./findings.ts";
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

/**
 * `--root <dir>` sets the repository root and the tool's working directory (default: the current directory) and
 * changes nothing else; every other argument is kept in order.
 */
export function parseArgs(argv: readonly string[], cwd: string): Context {
  let root = cwd;
  const args: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = String(argv[i]);
    if (arg !== "--root") {
      args.push(arg);
      continue;
    }
    const dir = argv[i + 1];
    if (dir === undefined || dir === "") throw new Error("--root needs a directory");
    root = resolve(cwd, dir);
    i += 1;
  }
  return { root, toolCwd: root, args };
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Calls a gate's run function; any uncaught error becomes exit 2 with one line naming its cause. */
export async function entry(run: Run, argv: readonly string[], io: Io): Promise<number> {
  let code: number;
  try {
    code = await run(argv, io);
  } catch (error) {
    io.err(oneLine(`could not run: ${describe(error)}`));
    return 2;
  }
  if (code === 0 || code === 1 || code === 2) return code;
  io.err(`could not run: the gate returned exit code ${String(code)}, outside the 0/1/2 contract`);
  return 2;
}

/** The Io of the current process. */
export function processIo(): Io {
  return {
    cwd: process.cwd(),
    env: process.env,
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-command.test.ts "exits 0 with a one-line summary when every test passes"
    out: (line) => process.stdout.write(`${line}\n`),
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-command.test.ts "exits 2 when no test file is found (FR-004)"
    err: (line) => process.stderr.write(`${line}\n`),
  };
}

/** Runs a gate as the process entry point and sets the process exit code. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-command.test.ts "exits 0 with a one-line summary when every test passes"
export async function main(run: Run): Promise<void> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-command.test.ts "exits 0 with a one-line summary when every test passes"
  process.exitCode = await entry(run, process.argv.slice(2), processIo());
}
