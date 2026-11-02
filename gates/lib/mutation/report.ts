// Classification of a Stryker JSON report (FR-011, contracts/gate-cli.md, mutation row). Scaffold: signatures only.
import type { Finding } from "../findings.ts";
import type { ChangedFile } from "./ranges.ts";

/** One Stryker run as the mutation gate saw it. */
export interface StrykerRun {
  /** The JSON report's text, or undefined when Stryker wrote none. */
  readonly report: string | undefined;
  /** Stryker's exit code (null when it was killed by a signal). */
  readonly exitCode: number | null;
  /** Stryker's stdout and stderr together. */
  readonly output: string;
}

/** The mutants on changed lines: findings and how many mutants decided, or why the report cannot be used. */
export type MutantVerdict =
  | { readonly ok: true; readonly findings: readonly Finding[]; readonly mutants: number }
  | { readonly ok: false; readonly cause: string };

export function classifyMutants(_run: StrykerRun, _changed: readonly ChangedFile[]): MutantVerdict {
  return { ok: true, findings: [], mutants: 0 };
}
