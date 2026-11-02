// Classification of a Stryker JSON report (FR-011 as amended on 2026-11-02, contracts/gate-cli.md, mutation row):
// only mutants on changed lines decide; Survived and NoCoverage are findings; Killed, Timeout and RuntimeError are
// killed, CompileError is invalid and Ignored is an equivalent record, all of which pass; no usable report, or a
// mutant left in any other state, means the gate could not run.
import { oneLine } from "../findings.ts";
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

interface Mutant {
  readonly id: string;
  readonly mutatorName: string;
  readonly replacement?: string;
  readonly status: string;
  readonly location: { readonly start: { readonly line: number }; readonly end: { readonly line: number } };
}

type Files = Readonly<Record<string, { readonly mutants: readonly Mutant[] } | undefined>>;

const surviving = new Set(["Survived", "NoCoverage"]);
const passing = new Set(["Killed", "Timeout", "RuntimeError", "CompileError", "Ignored"]);
const fix = "run pnpm test and check stryker.config.json";

function cannotRun(cause: string): MutantVerdict {
  return { ok: false, cause: `mutation: could not run: ${cause}` };
}

/** The message of the last ERROR line of Stryker's log output (`<time> (<pid>) ERROR <category> <message>`). */
function lastError(output: string): string | undefined {
  const messages = output.split("\n").map((line) => /\bERROR \S+ (.+)/.exec(line)?.[1]);
  return messages.filter((message) => message !== undefined).at(-1);
}

function filesOf(report: string): Files | undefined {
  let value: unknown;
  try {
    value = JSON.parse(report);
  }
  // Stryker disable next-line BlockStatement: equivalent, an empty catch leaves value undefined, which the check below also rejects
  catch {
    return undefined;
  }
  const files = (value as { files?: unknown } | null)?.files;
  return typeof files === "object" && files !== null ? (files as Files) : undefined;
}

export function classifyMutants(run: StrykerRun, changed: readonly ChangedFile[]): MutantVerdict {
  if (run.report === undefined) {
    return cannotRun(`Stryker wrote no report (${lastError(run.output) ?? `Stryker exited ${String(run.exitCode)}`}); ${fix}`);
  }
  const files = filesOf(run.report);
  if (files === undefined) return cannotRun(`the Stryker report is not a JSON object with files; ${fix}`);

  const findings: Finding[] = [];
  let mutants = 0;
  for (const file of changed) {
    for (const mutant of files[file.path]?.mutants ?? []) {
      const { start, end } = mutant.location;
      if (!file.ranges.some((range) => start.line <= range.end && end.line >= range.start)) continue;
      mutants += 1;
      if (passing.has(mutant.status)) continue;
      if (!surviving.has(mutant.status)) {
        const where = `${file.path}:${String(start.line)}`;
        return cannotRun(`mutant ${mutant.id} at ${where} has status ${mutant.status}; re-run the mutation gate`);
      }
      findings.push({
        location: { path: file.path, line: start.line },
        gate: "mutation",
        rule: mutant.mutatorName,
        message: oneLine(`${mutant.status}: replaced by ${mutant.replacement ?? ""}`),
      });
    }
  }
  return { ok: true, findings, mutants };
}
