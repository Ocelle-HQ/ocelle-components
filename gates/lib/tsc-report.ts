// Classification of tsc diagnostics (contracts/gate-cli.md, typecheck row). tsc exits 2 both on a type error and on
// some configuration errors, so the verdict comes from the diagnostics' codes: TS5xxx and TS6xxx are configuration
// and option diagnostics (exit 2, the gate could not run); every other diagnostic is a finding (exit 1).
import { relative, resolve } from "node:path";
import { oneLine, plural } from "./findings.ts";
import type { Finding, GateResult } from "./findings.ts";

/** One `tsc --noEmit --pretty false` run, as the typecheck gate saw it. */
export interface TscRun {
  /** tsc's stdout and stderr together: one diagnostic per line, continuation lines indented. */
  readonly output: string;
  /** tsc's exit code (null when it was killed by a signal). */
  readonly exitCode: number | null;
  /** The repository root the run used; finding paths are relative to it. */
  readonly root: string;
}

interface Diagnostic {
  readonly path: string;
  readonly line: number | undefined;
  readonly code: string;
  readonly message: string;
}

const gate = "typecheck";
/** `path(line,col): error TS1234: message` or `error TS1234: message` (a diagnostic about no file). */
const diagnosticLine = /^(?:(.+)\((\d+),\d+\): )?error (TS\d+): (.*)/;

/** The diagnostics of tsc's output; an indented line continues the message of the diagnostic before it. */
function diagnostics(output: string, root: string): Diagnostic[] {
  const found: Diagnostic[] = [];
  for (const line of output.split(/\r?\n/)) {
    const match = diagnosticLine.exec(line);
    const last = found.at(-1);
    if (match === null) {
      if (last !== undefined && /^\s/.test(line)) found[found.length - 1] = { ...last, message: `${last.message} ${line.trim()}` };
      continue;
    }
    const [, file, lineNumber, code, message] = match as unknown as [string, string | undefined, string | undefined, string, string];
    found.push({
      path: file === undefined ? "tsconfig.json" : relative(root, resolve(root, file)),
      line: lineNumber === undefined ? undefined : Number(lineNumber),
      code,
      message,
    });
  }
  return found;
}

function where(diagnostic: Diagnostic): string {
  return diagnostic.line === undefined ? diagnostic.path : `${diagnostic.path}:${String(diagnostic.line)}`;
}

/** The first line of tsc's output that names an error, else its first line. */
function detail(output: string): string {
  const lines = output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  return lines.find((line) => /^\w*Error\b/.test(line)) ?? lines[0] ?? "no output";
}

export function classifyTsc(run: TscRun): GateResult {
  const found = diagnostics(run.output, run.root);
  const configuration = found.find((diagnostic) => /TS[56]\d{3}$/.test(diagnostic.code));
  if (configuration !== undefined) {
    const cause = `${configuration.code} at ${where(configuration)}: ${configuration.message}`;
    return { exit: 2, cause: `${gate}: could not run: ${cause}; fix the TypeScript configuration or the file it names` };
  }
  if (found.length === 0) {
    if (run.exitCode === 0) return { exit: 0, summary: `${gate}: no type error in the files of tsconfig.json` };
    const cause = `tsc exited ${String(run.exitCode)} without a diagnostic (${detail(run.output)})`;
    return { exit: 2, cause: `${gate}: could not run: ${cause}; run pnpm run setup:offline` };
  }
  const findings: Finding[] = found.map((diagnostic) => ({
    location: diagnostic.line === undefined ? { path: diagnostic.path } : { path: diagnostic.path, line: diagnostic.line },
    gate,
    rule: diagnostic.code,
    message: oneLine(diagnostic.message),
  }));
  const files = new Set(found.map((diagnostic) => diagnostic.path)).size;
  return { exit: 1, findings, summary: `${gate}: ${plural(findings.length, "finding")} in ${plural(files, "file")}` };
}
