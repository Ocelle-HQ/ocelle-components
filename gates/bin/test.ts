// The unit-tests gate and `pnpm test` (research.md R-03): checks that Chromium exists, then runs every Vitest project
// with a JSON report and classifies it (contracts/gate-cli.md). `--root <dir>` is the workspace whose tests it runs.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { emit } from "../lib/findings.ts";
import { classifyVitest } from "../lib/vitest-report.ts";

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

/** Playwright's own Chromium executable (it reads PLAYWRIGHT_BROWSERS_PATH from the environment). */
async function playwrightChromium(): Promise<string | undefined> {
  const { chromium } = await import("playwright");
  try {
    return chromium.executablePath();
  } catch {
    return undefined;
  }
}

/** The Chromium check of this process's environment; shared with gates/bin/setup-offline.ts. */
export async function checkChromium(env: Io["env"]): Promise<ChromiumCheck> {
  return chromiumCheck({
    override: env["OCELLE_CHROMIUM_PATH"],
    playwrightPath: await playwrightChromium(),
    exists: existsSync,
  });
}

interface Spawned {
  readonly exitCode: number | null;
  readonly output: string;
}

function runVitest(vitest: string, args: readonly string[], cwd: string, env: Io["env"]): Promise<Spawned> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [vitest, ...args], { cwd, env });
    let output = "";
    child.stdout.on("data", (d: Buffer) => (output += d.toString()));
    child.stderr.on("data", (d: Buffer) => (output += d.toString()));
    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolve({ exitCode, output });
    });
  });
}

export async function run(argv: readonly string[], io: Io): Promise<number> {
  const context = parseArgs(argv, io.cwd);
  const chromium = await checkChromium(io.env);
  if (chromium.problem !== undefined) {
    return emit({ exit: 2, cause: `unit-tests: could not run: ${chromium.problem}` }, io.out, io.err);
  }
  const vitest = join(context.root, "node_modules", "vitest", "vitest.mjs");
  if (!existsSync(vitest)) {
    return emit(
      { exit: 2, cause: `unit-tests: could not run: Vitest is not installed in ${context.root}; run pnpm run setup:offline` },
      io.out,
      io.err,
    );
  }
  const dir = mkdtempSync(join(tmpdir(), "ocelle-unit-tests-"));
  try {
    const reportFile = join(dir, "report.json");
    const args = [
      "run",
      "--reporter",
      "default",
      "--reporter",
      "json",
      `--outputFile.json=${reportFile}`,
      "--includeTaskLocation",
      ...context.args,
    ];
    const ran = await runVitest(vitest, args, context.toolCwd, io.env);
    const report = existsSync(reportFile) ? readFileSync(reportFile, "utf8") : undefined;
    return emit(
      classifyVitest({ report, exitCode: ran.exitCode, output: ran.output, root: context.root }),
      io.out,
      io.err,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (import.meta.main) await main(run);
