// Classification of an ESLint JSON report (contracts/gate-cli.md, lint and test-lint row): messages that are not
// fatal are findings (exit 1); ESLint exiting other than 0 or 1, no JSON report, or a fatal message (a file that does
// not parse) is exit 2. Shared by the test lint (phase 3) and the code lint (phase 4).
import { relative } from "node:path";
import { oneLine, plural } from "./findings.ts";
import type { Finding, GateResult } from "./findings.ts";

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

interface Message {
  readonly ruleId: string | null;
  readonly message: string;
  readonly line: number;
  readonly fatal?: boolean;
}

interface FileResult {
  readonly filePath: string;
  readonly messages: readonly Message[];
}

const fix = "check the ESLint configuration";

function parse(text: string): readonly FileResult[] | undefined {
  let value: unknown;
  try {
    value = JSON.parse(text);
  }
  // Stryker disable next-line BlockStatement: equivalent, an empty catch leaves value undefined, which the check below also rejects
  catch {
    return undefined;
  }
  return Array.isArray(value) ? (value as FileResult[]) : undefined;
}

/** The line of ESLint's output that names the error, else its first line. */
function detail(output: string): string {
  const lines = output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  return lines.find((line) => /^\w*Error\b/.test(line)) ?? lines[0] ?? "no output";
}

export function classifyEslint(gate: string, run: EslintRun): GateResult {
  const cannotRun = (cause: string): GateResult => ({ exit: 2, cause: `${gate}: could not run: ${cause}` });
  if (run.exitCode !== 0 && run.exitCode !== 1) {
    return cannotRun(`ESLint exited ${String(run.exitCode)} (${detail(run.output)}); ${fix}`);
  }
  const report = parse(run.report);
  if (report === undefined) return cannotRun(`ESLint wrote no JSON report (${detail(run.output)}); ${fix}`);

  const findings: Finding[] = [];
  let files = 0;
  for (const file of report) {
    const path = relative(run.root, file.filePath);
    const fatal = file.messages.find((message) => message.fatal === true);
    if (fatal !== undefined) return cannotRun(`${path}:${String(fatal.line)} does not parse (${oneLine(fatal.message)})`);
    if (file.messages.length > 0) files += 1;
    for (const message of file.messages) {
      findings.push({
        location: { path, line: message.line },
        gate,
        rule: message.ruleId ?? "eslint",
        message: oneLine(message.message),
      });
    }
  }
  if (findings.length > 0) {
    return { exit: 1, findings, summary: `${gate}: ${plural(findings.length, "finding")} in ${plural(files, "file")}` };
  }
  return { exit: 0, summary: `${gate}: ${plural(report.length, "file")} checked, no finding` };
}
