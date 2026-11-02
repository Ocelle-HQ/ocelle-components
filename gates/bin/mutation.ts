// The mutation gate (FR-011 to FR-013, research.md R-08). Scaffold: signatures only.
import type { Context, Io } from "../lib/cli.ts";
import type { StrykerRun } from "../lib/mutation/report.ts";

/** One run of a tool: exit code and output. */
export interface ToolRun {
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

/** The tools the mutation gate uses, all in the repository root. */
export interface MutationTools {
  /** Runs git with these arguments. */
  readonly git: (args: readonly string[]) => Promise<ToolRun>;
  /** Reads a repository file (path relative to the root); undefined when it cannot be read. */
  readonly read: (path: string) => Promise<string | undefined>;
  /** Runs Stryker on these `mutate` entries and returns its JSON report and output. */
  readonly stryker: (mutate: readonly string[]) => Promise<StrykerRun>;
}

export function mutation(_context: Context, _tools: MutationTools, _io: Io): Promise<number> {
  return Promise.resolve(0);
}

export function run(_argv: readonly string[], _io: Io): Promise<number> {
  return Promise.resolve(0);
}
