// The unit-tests gate and `pnpm test` (research.md R-03): checks that Chromium exists, then runs every Vitest project
// with a JSON report and classifies it (contracts/gate-cli.md). `--root <dir>` is the workspace whose tests it runs.
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main, parseArgs } from "../lib/cli.ts";
import type { Context, Io } from "../lib/cli.ts";
import { emit } from "../lib/findings.ts";
import { runTool } from "../lib/spawn.ts";
import { classifyVitest } from "../lib/vitest-report.ts";
import type { VitestRun } from "../lib/vitest-report.ts";

/** What the Chromium check reads: the override, Playwright's own executable path, and a file test. */
export interface ChromiumLookup {
  readonly override: string | undefined;
  readonly playwrightPath: string | undefined;
  readonly exists: (path: string) => boolean;
}

/** The executable the elements project will launch, and the problem when it is missing. */
export interface ChromiumCheck {
  readonly executable: string | undefined;
  readonly problem: string | undefined;
}

/**
 * The elements project launches `OCELLE_CHROMIUM_PATH` when it is set and non-empty (vitest.config.ts, research.md
 * R-03), otherwise Playwright's own Chromium; the check looks at the executable that will actually be launched.
 */
export function chromiumCheck(lookup: ChromiumLookup): ChromiumCheck {
  if (lookup.override !== undefined && lookup.override !== "") {
    const executable = lookup.override;
    const problem = lookup.exists(executable)
      ? undefined
      : `Chromium not found at ${executable} (OCELLE_CHROMIUM_PATH); point OCELLE_CHROMIUM_PATH at an existing ` +
        "executable, or unset it and run pnpm run setup:online";
    return { executable, problem };
  }
  const executable = lookup.playwrightPath;
  if (executable === undefined) {
    return { executable, problem: "Playwright names no Chromium executable; run pnpm run setup:online" };
  }
  const problem = lookup.exists(executable)
    ? undefined
    : `Chromium not found at ${executable}; run pnpm run setup:online`;
  return { executable, problem };
}

/** The tools the unit-tests gate uses. */
export interface UnitTestTools {
  /** The Chromium check of the environment (checkChromium). */
  readonly chromium: () => Promise<ChromiumCheck>;
  /** Whether a file exists. */
  readonly exists: (path: string) => boolean;
  /** Runs `node <vitest> <args>` in the tool working directory with a JSON report; the report is undefined when none was written. */
  readonly vitest: (vitest: string, args: readonly string[]) => Promise<Omit<VitestRun, "root">>;
}

/**
 * The unit-tests gate: the Chromium check first, so no test runs without the browser, then every Vitest project with
 * the default and JSON reporters and test locations, extra arguments passed on, the report classified.
 */
export async function unitTests(context: Context, tools: UnitTestTools, io: Io): Promise<number> {
  const chromium = await tools.chromium();
  if (chromium.problem !== undefined) {
    return emit({ exit: 2, cause: `unit-tests: could not run: ${chromium.problem}` }, io.out, io.err);
  }
  const vitest = join(context.root, "node_modules", "vitest", "vitest.mjs");
  if (!tools.exists(vitest)) {
    const cause = `unit-tests: could not run: Vitest is not installed in ${context.root}; run pnpm run setup:offline`;
    return emit({ exit: 2, cause }, io.out, io.err);
  }
  const args = ["run", "--reporter", "default", "--reporter", "json", "--includeTaskLocation", ...context.args];
  const ran = await tools.vitest(vitest, args);
  return emit(classifyVitest({ ...ran, root: context.root }), io.out, io.err);
}

/** Playwright's own Chromium executable (it reads PLAYWRIGHT_BROWSERS_PATH from the environment). */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-command.test.ts "exits 2 naming pnpm run setup:online when Chromium is missing, and runs no test (US1 scenario 9)"
async function playwrightChromium(): Promise<string | undefined> {
  const { chromium } = await import("playwright");
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-command.test.ts "exits 2 naming pnpm run setup:online when Chromium is missing, and runs no test (US1 scenario 9)"
  try {
    return chromium.executablePath();
  }
  // Stryker disable next-line BlockStatement: equivalent, an empty catch returns undefined as well (no gates-integration case makes Playwright throw)
  catch {
    return undefined;
  }
}

/** The Chromium check of this process's environment; shared with gates/bin/setup-offline.ts. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-command.test.ts "exits 2 naming the override when OCELLE_CHROMIUM_PATH points at no executable"
export async function checkChromium(env: Io["env"]): Promise<ChromiumCheck> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-command.test.ts "exits 2 naming the override when OCELLE_CHROMIUM_PATH points at no executable"
  return chromiumCheck({
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-command.test.ts "exits 2 naming the override when OCELLE_CHROMIUM_PATH points at no executable"
    override: env["OCELLE_CHROMIUM_PATH"],
    playwrightPath: await playwrightChromium(),
    exists: existsSync,
  });
}

/** Vitest as a child process, its JSON report written to a temporary file that is removed afterwards. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-command.test.ts "exits 1 naming the failing test as a finding (US1 scenario 5)"
async function runVitest(vitest: string, args: readonly string[], cwd: string, env: Io["env"]): Promise<Omit<VitestRun, "root">> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-command.test.ts "exits 1 naming the failing test as a finding (US1 scenario 5)"
  const dir = mkdtempSync(join(tmpdir(), "ocelle-unit-tests-"));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-command.test.ts "exits 1 naming the failing test as a finding (US1 scenario 5)"
  const reportFile = join(dir, "report.json");
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-command.test.ts "exits 1 naming the failing test as a finding (US1 scenario 5)"
  const ran = await runTool(process.execPath, [vitest, ...args, `--outputFile.json=${reportFile}`], cwd, env);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-command.test.ts "exits 1 naming the failing test as a finding (US1 scenario 5)"
  const report = existsSync(reportFile) ? readFileSync(reportFile, "utf8") : undefined;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-command.test.ts "exits 1 naming the failing test as a finding (US1 scenario 5)"
  rmSync(dir, { recursive: true, force: true });
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-command.test.ts "exits 1 naming the failing test as a finding (US1 scenario 5)"
  return { report, exitCode: ran.exitCode, output: `${ran.stdout}${ran.stderr}` };
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-command.test.ts "exits 1 naming the failing test as a finding (US1 scenario 5)"
export async function run(argv: readonly string[], io: Io): Promise<number> {
  const context = parseArgs(argv, io.cwd);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-command.test.ts "exits 1 naming the failing test as a finding (US1 scenario 5)"
  const tools: UnitTestTools = {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-command.test.ts "exits 2 naming the override when OCELLE_CHROMIUM_PATH points at no executable"
    chromium: () => checkChromium(io.env),
    exists: existsSync,
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-command.test.ts "exits 1 naming the failing test as a finding (US1 scenario 5)"
    vitest: (vitest, args) => runVitest(vitest, args, context.toolCwd, io.env),
  };
  return unitTests(context, tools, io);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-command.test.ts "exits 1 naming the failing test as a finding (US1 scenario 5)"
if (import.meta.main) await main(run);
