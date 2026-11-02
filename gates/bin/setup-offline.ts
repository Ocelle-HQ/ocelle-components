// Offline setup, the story configuration's setup command (FR-008, research.md R-04): installs the `--root` workspace
// from the local pnpm store only, then checks Chromium the same way as `pnpm test`. It never falls back to the
// network: pnpm's `--offline` refuses it, and a missing package or Chromium is reported with the online install.
import { spawn } from "node:child_process";
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { emit } from "../lib/findings.ts";
import type { GateResult } from "../lib/findings.ts";
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

/** The first error record of pnpm's ndjson log. */
function firstError(output: string): PnpmError | undefined {
  for (const line of output.split("\n")) {
    if (!line.startsWith("{")) continue;
    let record: unknown;
    try {
      record = JSON.parse(line);
    } catch {
      continue;
    }
    if (typeof record !== "object" || record === null) continue;
    const { level, code, message } = record as { level?: unknown; code?: unknown; message?: unknown };
    if (level !== "error") continue;
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
  const firstLine = error.message.split("\n")[0] ?? "";
  return `pnpm install --offline failed: ${error.code}: ${firstLine}`;
}

export function decideSetup(install: InstallRun, chromium: ChromiumCheck): GateResult {
  const problem = installProblem(install) ?? chromium.problem;
  if (problem !== undefined) return { exit: 2, cause: `setup: ${problem}` };
  return { exit: 0, summary: `setup: installed offline; Chromium at ${chromium.executable ?? "(unknown)"}` };
}

function pnpmInstall(cwd: string, env: Io["env"]): Promise<InstallRun> {
  return new Promise((resolve, reject) => {
    const args = ["install", "--frozen-lockfile", "--offline", "--reporter=ndjson"];
    const child = spawn("pnpm", args, { cwd, env });
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
  const install = await pnpmInstall(context.toolCwd, io.env);
  // Playwright is only importable once the install worked; a failed install is reported on its own.
  const chromium = install.exitCode === 0 ? await checkChromium(io.env) : { executable: undefined, problem: undefined };
  return emit(decideSetup(install, chromium), io.out, io.err);
}

if (import.meta.main) await main(run);
