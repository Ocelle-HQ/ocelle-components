// Classification of a Stylelint JSON report (contracts/gate-cli.md, style-lint row). Stylelint exits 2 on lint
// problems and 1, 64 or 78 when it cannot run; a CssSyntaxError warning, a parse error of the custom syntax and an
// invalid rule option also mean the gate could not run. Every other warning is a finding.
import { relative } from "node:path";
import { oneLine, plural } from "./findings.ts";
import type { Finding, GateResult } from "./findings.ts";

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

interface Warning {
  readonly line: number;
  readonly rule: string;
  readonly text: string;
}

interface FileResult {
  readonly source: string;
  readonly ignored?: boolean;
  readonly warnings: readonly Warning[];
  readonly parseErrors: readonly { readonly line: number; readonly text: string }[];
  readonly invalidOptionWarnings: readonly { readonly text: string }[];
}

const gate = "style-lint";
const fix = "check the Stylelint configuration";

function parse(text: string | undefined): readonly FileResult[] | undefined {
  if (text === undefined) return undefined;
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

/** The line of Stylelint's output that names the error, else its first line. */
function detail(output: string): string {
  const lines = output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  return lines.find((line) => /^\w*Error\b/.test(line)) ?? lines[0] ?? "no output";
}

/** A warning's text without the ` (<rule>)` Stylelint appends. */
function withoutSuffix(text: string, suffix: string): string {
  return text.endsWith(` (${suffix})`) ? text.slice(0, -suffix.length - 3) : text;
}

export function classifyStylelint(run: StylelintRun): GateResult {
  const cannotRun = (cause: string): GateResult => ({ exit: 2, cause: `${gate}: could not run: ${cause}` });
  if (run.exitCode !== 0 && run.exitCode !== 2) {
    return cannotRun(`Stylelint exited ${String(run.exitCode)} (${detail(run.output)}); ${fix}`);
  }
  const report = parse(run.report);
  if (report === undefined) return cannotRun(`Stylelint wrote no JSON report (${detail(run.output)}); ${fix}`);

  const findings: Finding[] = [];
  let checked = 0;
  let files = 0;
  for (const file of report) {
    if (file.ignored === true) continue;
    checked += 1;
    const path = relative(run.root, file.source);
    const invalid = file.invalidOptionWarnings[0];
    if (invalid !== undefined) return cannotRun(`${invalid.text}; ${fix}`);
    const syntax = file.warnings.find((warning) => warning.rule === "CssSyntaxError");
    const parseError = file.parseErrors[0];
    const broken = syntax ?? parseError;
    if (broken !== undefined) {
      const text = oneLine(broken.text.replace(/ \([^()]*\)$/, ""));
      return cannotRun(`${path}:${String(broken.line)} does not parse (${text}); fix the stylesheet`);
    }
    if (file.warnings.length > 0) files += 1;
    for (const warning of file.warnings) {
      findings.push({
        location: { path, line: warning.line },
        gate,
        rule: warning.rule,
        message: oneLine(withoutSuffix(warning.text, warning.rule)),
      });
    }
  }
  if (findings.length > 0) {
    return { exit: 1, findings, summary: `${gate}: ${plural(findings.length, "finding")} in ${plural(files, "file")}` };
  }
  return { exit: 0, summary: `${gate}: ${plural(checked, "file")} checked, no finding` };
}
