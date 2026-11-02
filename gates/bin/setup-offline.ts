// Offline setup, the story configuration's setup command (FR-008, research.md R-04): installs the `--root` workspace
// from the local pnpm store only, then checks Chromium the same way as `pnpm test`. It never falls back to the
// network: pnpm's `--offline` refuses it, and a missing package or Chromium is reported with the online install.
import { main, parseArgs } from "../lib/cli.ts";
import type { Context, Io } from "../lib/cli.ts";
import { emit } from "../lib/findings.ts";
import type { GateResult } from "../lib/findings.ts";
import { runTool } from "../lib/spawn.ts";
import { checkChromium } from "./test.ts";
import type { ChromiumCheck } from "./test.ts";

/** One `pnpm install --frozen-lockfile --offline --reporter=ndjson` run. */
export interface InstallRun {
  readonly exitCode: number | null;
  readonly output: string;
}

interface PnpmError {
  readonly code: string;
  readonly message: string;
}

const online = "run pnpm run setup:online";

/** The first error record of pnpm's ndjson log; lines that are not JSON records are skipped. */
function firstError(output: string): PnpmError | undefined {
  for (const line of output.split("\n")) {
    let record: unknown;
    try {
      record = JSON.parse(line);
    }
    // Stryker disable next-line BlockStatement: equivalent, an empty catch leaves record undefined, which the level check below skips
    catch {
      continue;
    }
    const fields = record as { level?: unknown; code?: unknown; message?: unknown } | null;
    if (fields?.level !== "error") continue;
    const { code, message } = fields;
    return { code: typeof code === "string" ? code : "", message: typeof message === "string" ? message : "" };
  }
  return undefined;
}

/** The package an offline install lacks: a tarball missing from the store, or metadata missing from the cache. */
function missingPackage(error: PnpmError): string | undefined {
  const tarball = /Failed to fetch tarball for (\S+) from/.exec(error.message);
  if (tarball?.[1] !== undefined) return tarball[1];
  const meta = /ERR_PNPM_NO_OFFLINE_META: Failed to resolve (\S+) in package mirror/.exec(error.message);
  return meta?.[1];
}

function installProblem(install: InstallRun): string | undefined {
  if (install.exitCode === 0) return undefined;
  const error = firstError(install.output);
  if (error === undefined) return `pnpm install --offline failed (exit ${String(install.exitCode)})`;
  const missing = missingPackage(error);
  if (missing !== undefined) return `missing: ${missing}; ${online}`;
  const firstLine = String(error.message.split("\n")[0]);
  return `pnpm install --offline failed: ${error.code}: ${firstLine}`;
}

export function decideSetup(install: InstallRun, chromium: ChromiumCheck): GateResult {
  const problem = installProblem(install) ?? chromium.problem;
  if (problem !== undefined) return { exit: 2, cause: `setup: ${problem}` };
  return { exit: 0, summary: `setup: installed offline; Chromium at ${chromium.executable ?? "(unknown)"}` };
}

/** The tools the offline setup uses. */
export interface SetupTools {
  /** Runs `pnpm <args>` in the tool working directory. */
  readonly pnpm: (args: readonly string[]) => Promise<InstallRun>;
  /** The Chromium check of the environment (checkChromium). */
  readonly chromium: () => Promise<ChromiumCheck>;
}

/**
 * The offline setup: a frozen, offline install with pnpm's ndjson log, then the Chromium check. Playwright is only
 * importable once the install worked, so a failed install is reported on its own, without the Chromium check.
 */
export async function setupOffline(tools: SetupTools, io: Io): Promise<number> {
  const install = await tools.pnpm(["install", "--frozen-lockfile", "--offline", "--reporter=ndjson"]);
  const chromium = install.exitCode === 0 ? await tools.chromium() : { executable: undefined, problem: undefined };
  return emit(decideSetup(install, chromium), io.out, io.err);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/setup-offline.test.ts "exits 2 naming the missing package and pnpm run setup:online on an empty store, without the network"
export async function run(argv: readonly string[], io: Io): Promise<number> {
  const context: Context = parseArgs(argv, io.cwd);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/setup-offline.test.ts "exits 2 naming the missing package and pnpm run setup:online on an empty store, without the network"
  const tools: SetupTools = {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/setup-offline.test.ts "exits 2 naming the missing package and pnpm run setup:online on an empty store, without the network"
    pnpm: async (args) => {
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/setup-offline.test.ts "exits 2 naming the missing package and pnpm run setup:online on an empty store, without the network"
      const ran = await runTool("pnpm", args, context.toolCwd, io.env);
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/setup-offline.test.ts "exits 2 naming the missing package and pnpm run setup:online on an empty store, without the network"
      return { exitCode: ran.exitCode, output: `${ran.stdout}\n${ran.stderr}` };
    },
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/setup-offline.test.ts "exits 2 naming Chromium and pnpm run setup:online on an empty browser path, without the network"
    chromium: () => checkChromium(io.env),
  };
  return setupOffline(tools, io);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/setup-offline.test.ts "exits 2 naming the missing package and pnpm run setup:online on an empty store, without the network"
if (import.meta.main) await main(run);
