// Classification of a Vitest JSON report (contracts/gate-cli.md, unit-tests row).
import { relative } from "node:path";
import { plural } from "./findings.ts";
import type { Finding, GateResult } from "./findings.ts";

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

interface TestResult {
  readonly fullName: string;
  readonly status: string;
  readonly failureMessages: readonly string[];
  readonly location?: { readonly line: number };
}

interface FileResult {
  readonly name: string;
  readonly status: string;
  readonly message: string;
  readonly assertionResults: readonly TestResult[];
}

interface Report {
  readonly success: boolean;
  readonly testResults: readonly FileResult[];
}

const gate = "unit-tests";
const ansi = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

function cannotRun(cause: string): GateResult {
  return { exit: 2, cause: `${gate}: could not run: ${cause}` };
}

function firstLine(text: string): string {
  const line = text
    .replace(ansi, "")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  return line ?? "";
}

function parse(text: string | undefined): Report | undefined {
  if (text === undefined) return undefined;
  let value: unknown;
  try {
    value = JSON.parse(text);
  }
  // Stryker disable next-line BlockStatement: equivalent, an empty catch leaves value undefined, which the check below also rejects
  catch {
    return undefined;
  }
  return Array.isArray((value as { testResults?: unknown } | null)?.testResults) ? (value as Report) : undefined;
}

/** A report path relative to the root; a path outside the root stays as it is. Vitest reports absolute paths. */
function repoPath(root: string, file: string): string {
  const rel = relative(root, file);
  return rel.startsWith("..") ? file : rel;
}

/** An error the run reported outside any test, from Vitest's own output. */
function outsideError(output: string): string | undefined {
  return output
    .replace(ansi, "")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => /^[A-Za-z]*Error:/.test(l));
}

export function classifyVitest(run: VitestRun): GateResult {
  const report = parse(run.report);
  if (report === undefined) {
    const detail = outsideError(run.output) ?? `Vitest exited ${String(run.exitCode)}`;
    return cannotRun(`no Vitest report (${detail}); run pnpm run setup:offline and check vitest.config.ts`);
  }
  if (report.testResults.length === 0) {
    return cannotRun("no test file found; check the include patterns of vitest.config.ts");
  }

  for (const file of report.testResults) {
    const failedTest = file.assertionResults.some((t) => t.status === "failed");
    if (file.status !== "failed" || failedTest) continue;
    const path = repoPath(run.root, file.name);
    const what = file.assertionResults.length === 0 ? `${path} failed to load` : `${path}: error outside tests`;
    return cannotRun(`${what}: ${firstLine(file.message)}`);
  }

  const tests = report.testResults.flatMap((file) =>
    file.assertionResults.map((test) => ({ path: repoPath(run.root, file.name), test })),
  );
  const findings: Finding[] = tests
    .filter(({ test }) => test.status === "failed")
    .map(({ path, test }) => ({
      location: test.location === undefined ? { path } : { path, line: test.location.line },
      gate,
      rule: test.fullName,
      message: firstLine(test.failureMessages[0] ?? "failed"),
    }));
  if (findings.length > 0) {
    return { exit: 1, findings, summary: `${gate}: ${String(findings.length)} of ${plural(tests.length, "test")} failed` };
  }

  if (!report.success || run.exitCode !== 0) {
    const detail = outsideError(run.output) ?? `Vitest exited ${String(run.exitCode)} with no failed test`;
    return cannotRun(`Vitest reported errors outside tests: ${detail}`);
  }
  const passed = tests.filter(({ test }) => test.status === "passed").length;
  return {
    exit: 0,
    summary: `${gate}: ${plural(passed, "test")} passed in ${plural(report.testResults.length, "file")}`,
  };
}
