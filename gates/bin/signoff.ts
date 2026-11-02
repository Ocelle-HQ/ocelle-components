// The sign-off gate (FR-023, research.md R-13). Scaffold: signatures only.
import type { Context, Io } from "../lib/cli.ts";
import type { Finding } from "../lib/findings.ts";
import type { ToolRun } from "../lib/spawn.ts";

/** One commit as `git log` describes it. */
export interface CommitRecord {
  readonly hash: string;
  readonly parents: readonly string[];
  /** `Name <email>`. */
  readonly author: string;
  readonly message: string;
}

/** The repository's unsigned root commit, the one commit FR-023 exempts (by its full hash, with no parent). */
export const rootCommit = "d08d4133bf0034e3d1ff29cddf2b0f13ca63290a";

/** The `git log --format` that parseLog reads. */
export const logFormat = "";

/** The commit records of `git log --format=<logFormat>` output. */
export function parseLog(_text: string): CommitRecord[] {
  return [];
}

/** One finding per commit that needs a sign-off and has none matching its author. */
export function checkCommits(_records: readonly CommitRecord[]): Finding[] {
  return [];
}

/** The tools the sign-off gate uses, in the repository root. */
export interface SignoffTools {
  readonly git: (args: readonly string[]) => Promise<ToolRun>;
}

export function signoff(_context: Context, _tools: SignoffTools, _io: Io): Promise<number> {
  return Promise.resolve(0);
}

export function run(_argv: readonly string[], _io: Io): Promise<number> {
  return Promise.resolve(0);
}
