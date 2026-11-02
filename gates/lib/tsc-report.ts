// Classification of tsc diagnostics (contracts/gate-cli.md, typecheck row). Scaffold: signatures only.
import type { GateResult } from "./findings.ts";

/** One `tsc --noEmit --pretty false` run, as the typecheck gate saw it. */
export interface TscRun {
  /** tsc's stdout and stderr together: one diagnostic per line, continuation lines indented. */
  readonly output: string;
  /** tsc's exit code (null when it was killed by a signal). */
  readonly exitCode: number | null;
  /** The repository root the run used; finding paths are relative to it. */
  readonly root: string;
}

export function classifyTsc(_run: TscRun): GateResult {
  return { exit: 0, summary: "" };
}
