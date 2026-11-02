// The prefix gate (FR-022, research.md R-12). Scaffold: signatures only.
import type { Io } from "../lib/cli.ts";
import type { Finding, GateResult } from "../lib/findings.ts";

/** One file of a package: its repository path and bytes. */
export interface PackageFile {
  readonly path: string;
  readonly bytes: Uint8Array;
}

/** Whether a repository path is a file the prefix check reads (package source, test code, built output). */
export function isCovered(_path: string): boolean {
  return false;
}

/** The `sk-` name and monospace findings in one file's text. */
export function scanText(_path: string, _text: string): Finding[] {
  return [];
}

/** The gate's verdict on the package files. */
export function checkPackages(_files: readonly PackageFile[]): GateResult {
  return { exit: 0, summary: "" };
}

export function run(_argv: readonly string[], _io: Io): Promise<number> {
  return Promise.resolve(0);
}
