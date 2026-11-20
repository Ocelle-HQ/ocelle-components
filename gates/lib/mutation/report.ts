// Classification of a Stryker JSON report (FR-011 as amended on 2026-11-02, contracts/gate-cli.md, mutation row):
// only mutants on changed lines decide; Survived and NoCoverage are findings; Killed, Timeout and RuntimeError are
// killed, CompileError is invalid and Ignored is an equivalent record, all of which pass; no usable report, or a
// mutant left in any other state, means the gate could not run. Stryker lists only files with mutants, so a changed
// file the report does not list has none on its changed lines (a type-only or comment-only change) and passes; the
// gate checks before Stryker runs that every changed path can be passed to it verbatim (phase 3 round 7, O7-02).
// That holds only for a file Stryker read: Stryker 10.1.1 never reads a file under a folder named node_modules,
// .git, .next, .nuxt, .svelte-kit or .stryker-tmp and only logs `Glob pattern "<entry>" did not result in any
// files.`, so before the report is classified, any such line in Stryker's output means could not run, naming each
// entry as logged (phase 3 round 12, O12-01; research.md R-08 "Unread `mutate` entries").
// Mission 007 (spec FR-001 to FR-003, data-model § Mutant verdict): the verdict also holds what no test was seen
// killing on changed lines, for the gate to report without changing the verdict: the Timeout and the CompileError
// mutants, each in changed-file order, then start line, start column and mutant id compared as a number (an id that is
// not a decimal integer after every numeric one, by string), and the zero-mutant entries, the entries with no mutant
// on their changed lines (named by their `--files` entry, else by path), in changed-file order.
// Mission 019 (gate gap rule (c); 001 contracts/gate-cli.md, mutation row, amendment 2026-11-19): when every mutant on
// a changed file's changed lines is a CompileError and all of them carry one diagnostic of that file itself (same
// path, line and TS code, read from the `statusReason` lines Stryker 10.1.1's TypeScript checker writes as
// `<path>(<line>,<col>): error TS<code>: <message>`) on a line none of them spans, the checker rejected the file, not
// its mutants: the gate could not run. A CompileError outside such a failure stays invalid and passes.
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

/** A Timeout or CompileError mutant on a changed line, as the gate reports it (007 data-model § Undecided mutant). */
export interface UndecidedMutant {
  readonly path: string;
  /** The mutant's start line, as findings name it, even when that line is unchanged. */
  readonly line: number;
  readonly mutator: string;
  /** The replacement on one line, empty when Stryker gives none. */
  readonly replacement: string;
}

/**
 * The mutants on changed lines: findings, how many mutants decided, the Timeout and CompileError mutants and the
 * zero-mutant entries; or why the report cannot be used.
 */
export type MutantVerdict =
  | {
      readonly ok: true;
      readonly findings: readonly Finding[];
      readonly mutants: number;
      readonly timeouts: readonly UndecidedMutant[];
      readonly compileErrors: readonly UndecidedMutant[];
      readonly zeroEntries: readonly string[];
    }
  | { readonly ok: false; readonly cause: string };

/** A changed file of the run, named by its `--files` entry when it has one (shards.ts `selectFiles`). */
export type RunEntry = ChangedFile & { readonly entry?: string };

interface Mutant {
  readonly id: string;
  readonly mutatorName: string;
  readonly replacement?: string;
  readonly status: string;
  readonly statusReason?: string;
  readonly location: {
    readonly start: { readonly line: number; readonly column: number };
    readonly end: { readonly line: number };
  };
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

/** Stryker's warning for a `mutate` entry it did not read; the entry is the text between the quotes. */
const unreadWarning = /Glob pattern "(.*)" did not result in any files\./g;

/** The `mutate` entries Stryker's output reports it did not read, in its order, as logged. */
function unreadEntries(output: string): string[] {
  return [...output.matchAll(unreadWarning)].map((match) => String(match[1]));
}

const decimal = /^\d+$/;

/** Stryker's mutant ids compared as numbers; an id that is not a decimal integer after every numeric one, by string. */
function compareIds(a: string, b: string): number {
  const numericA = decimal.test(a);
  const numericB = decimal.test(b);
  if (numericA && numericB) return Number(a) - Number(b);
  if (numericA !== numericB) return numericA ? -1 : 1;
  if (a < b) return -1;
  // Stryker disable next-line ConditionalExpression,EqualityOperator: equivalent, Array.prototype.sort reads only whether a comparison is below 0 here: it orders a pair the same for 0 and 1 (checked on V8 with random ids, duplicates included)
  return a > b ? 1 : 0;
}

/** Mutants of one file by start line, then start column, then id. */
function byPosition(a: Mutant, b: Mutant): number {
  const { start: x } = a.location;
  const { start: y } = b.location;
  return x.line - y.line || x.column - y.column || compareIds(a.id, b.id);
}

/** A diagnostic of Stryker's TypeScript checker in a mutant's `statusReason`. */
interface Diagnostic {
  readonly path: string;
  readonly line: number;
  readonly column: number;
  readonly code: string;
}

/** A diagnostic line of Stryker 10.1.1's TypeScript checker (gates/test/mutation-report.test.ts pins the form). */
const diagnosticLine = /^(\S.*)\((\d+),(\d+)\): error TS(\d+): /;

/** The diagnostics of a `statusReason`, in its order; a line not of the diagnostic form (a continuation) is skipped. */
function diagnosticsOf(reason: string | undefined): Diagnostic[] {
  // Stryker disable next-line StringLiteral: equivalent, a missing statusReason read as any other text with no line of the diagnostic form gives no diagnostic either (T025)
  return (reason ?? "").split("\n").flatMap((line) => {
    const match = diagnosticLine.exec(line);
    return match === null ? [] : [{ path: String(match[1]), line: Number(match[2]), column: Number(match[3]), code: String(match[4]) }];
  });
}

/**
 * The checker failure of a changed file (gate gap rule (c)): when its mutants on changed lines are all CompileError,
 * the first diagnostic of the first of them that is in `path`, on a line none of the mutants spans, and in every
 * other mutant's diagnostics (same path, line and code); else undefined. No mutant, or no parsable diagnostic, is none.
 */
function checkerFailure(path: string, mutants: readonly Mutant[]): Diagnostic | undefined {
  if (!mutants.every((mutant) => mutant.status === "CompileError")) return undefined;
  const [first, ...rest] = mutants;
  const same = (a: Diagnostic) => (b: Diagnostic): boolean => a.path === b.path && a.line === b.line && a.code === b.code;
  return diagnosticsOf(first?.statusReason).find(
    (diagnostic) =>
      diagnostic.path === path &&
      mutants.every(({ location: { start, end } }) => diagnostic.line < start.line || diagnostic.line > end.line) &&
      rest.every((mutant) => diagnosticsOf(mutant.statusReason).some(same(diagnostic))),
  );
}

export function classifyMutants(run: StrykerRun, changed: readonly RunEntry[]): MutantVerdict {
  const unread = unreadEntries(run.output);
  if (unread.length > 0) {
    const skipped = "node_modules, .git, .next, .nuxt, .svelte-kit or .stryker-tmp, in any case";
    return cannotRun(
      `Stryker did not read these mutate entries (it skips every file under a folder named ${skipped}): ` +
        `${unread.join(", ")}; move the files out of such a folder`,
    );
  }
  if (run.report === undefined) {
    return cannotRun(`Stryker wrote no report (${lastError(run.output) ?? `Stryker exited ${String(run.exitCode)}`}); ${fix}`);
  }
  const files = filesOf(run.report);
  if (files === undefined) return cannotRun(`the Stryker report is not a JSON object with files; ${fix}`);

  const findings: Finding[] = [];
  const timeouts: UndecidedMutant[] = [];
  const compileErrors: UndecidedMutant[] = [];
  const zeroEntries: string[] = [];
  let mutants = 0;
  for (const file of changed) {
    const onChanged = (files[file.path]?.mutants ?? []).filter(({ location: { start, end } }) =>
      file.ranges.some((range) => start.line <= range.end && end.line >= range.start),
    );
    if (onChanged.length === 0) zeroEntries.push(file.entry ?? file.path);
    const rejected = checkerFailure(file.path, onChanged);
    if (rejected !== undefined) {
      const { path, line, column, code } = rejected;
      const diagnostic = `${path}(${String(line)},${String(column)}): error TS${code}`;
      return cannotRun(`Stryker's type checker rejects ${file.path} itself, not its mutants: ${diagnostic}; fix that type error (an explicit type often does) and rerun`);
    }
    const undecided = (status: string): UndecidedMutant[] =>
      onChanged
        .filter((mutant) => mutant.status === status)
        .sort(byPosition)
        .map((mutant) => ({
          path: file.path,
          line: mutant.location.start.line,
          mutator: mutant.mutatorName,
          replacement: oneLine(mutant.replacement ?? ""),
        }));
    timeouts.push(...undecided("Timeout"));
    compileErrors.push(...undecided("CompileError"));
    mutants += onChanged.length;
    for (const mutant of onChanged) {
      const { start } = mutant.location;
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
  return { ok: true, findings, mutants, timeouts, compileErrors, zeroEntries };
}
