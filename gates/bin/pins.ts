// The install-and-pins gate (FR-027, research.md R-14). Scaffold: signatures only.
import type { Context, Io } from "../lib/cli.ts";
import type { Finding } from "../lib/findings.ts";
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

/** The pins rules on the workspace files (every rule but the lockfile's). */
export function checkFiles(_files: WorkspaceFiles): PinsCheck {
  return { findings: [] };
}

/** The lockfile verdict on one `pnpm install --frozen-lockfile --lockfile-only --offline --reporter=ndjson` run. */
export function lockfileVerdict(_run: { readonly exitCode: number | null; readonly output: string }): PinsCheck {
  return { findings: [] };
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

export function pins(_context: Context, _tools: PinsTools, _io: Io): Promise<number> {
  return Promise.resolve(0);
}

export function run(_argv: readonly string[], _io: Io): Promise<number> {
  return Promise.resolve(0);
}
