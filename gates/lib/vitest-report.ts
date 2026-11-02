// Classification of a Vitest JSON report (contracts/gate-cli.md, unit-tests row). Scaffold: signatures only.
import type { GateResult } from "./findings.ts";

/** One Vitest run as the unit-tests gate saw it. */
export interface VitestRun {
  /** The JSON report's text, or undefined when Vitest wrote none. */
  readonly report: string | undefined;
  /** Vitest's exit code (null when it was killed by a signal). */
  readonly exitCode: number | null;
  /** Vitest's own stdout and stderr together. */
  readonly output: string;
  /** The repository root the run used; finding paths are relative to it. */
  readonly root: string;
}

export function classifyVitest(_run: VitestRun): GateResult {
  return { exit: 0, summary: "" };
}
