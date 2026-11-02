// Classification of a Stylelint JSON report (contracts/gate-cli.md, style-lint row). Scaffold: signatures only.
import type { GateResult } from "./findings.ts";

/** One Stylelint run with `--formatter json`, as the style-lint gate saw it. */
export interface StylelintRun {
  /** The JSON report's text, or undefined when Stylelint wrote none. */
  readonly report: string | undefined;
  /** Stylelint's exit code (null when it was killed by a signal). */
  readonly exitCode: number | null;
  /** Stylelint's own stdout and stderr together. */
  readonly output: string;
  /** The repository root the run used; finding paths are relative to it. */
  readonly root: string;
}

export function classifyStylelint(_run: StylelintRun): GateResult {
  return { exit: 0, summary: "" };
}
