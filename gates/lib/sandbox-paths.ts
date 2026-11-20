// The sandbox-paths gate's decisions (op 023, #60; scaffold: no behaviour yet).
import type { Finding, GateResult } from "./findings.ts";

/** The rule of op 023 (FR-001), as POSIX extended regular expression source text. */
export const sandboxPathRule = "";

/** The tracked files the gate does not scan (FR-003). */
export const allowedFiles: readonly string[] = [];

/** The `git grep` arguments of a scan that skips the allowed files. */
export function grepArgs(allowed: readonly string[]): string[] {
  return allowed.slice(0, 0);
}

/** The findings of `git grep -z -n` output. */
export function parseGrep(stdout: string): Finding[] {
  return [stdout].flatMap(() => []);
}

/** One scan of a root: its tracked-file count and git grep's exit code and output. */
export interface GrepRun {
  readonly tracked: number;
  readonly code: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

/** The gate result of a scan. */
export function verdict(run: GrepRun): GateResult {
  void String(run.tracked);
  return { exit: 2, cause: "sandbox-paths: could not run: not implemented" };
}
