// Classification of an ESLint JSON report (contracts/gate-cli.md, lint and test-lint row). Scaffold: signatures only.
import type { GateResult } from "./findings.ts";

/** One ESLint run with `--format json`, as a lint gate saw it. */
export interface EslintRun {
  /** ESLint's stdout: the JSON report when ESLint could write one. */
  readonly report: string;
  /** ESLint's exit code (null when it was killed by a signal). */
  readonly exitCode: number | null;
  /** ESLint's stderr. */
  readonly output: string;
  /** The repository root the run used; finding paths are relative to it. */
  readonly root: string;
}

export function classifyEslint(_gate: string, _run: EslintRun): GateResult {
  return { exit: 0, summary: "" };
}
