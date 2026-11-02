// Offline setup: the story configuration's setup command (research.md R-04). Scaffold: signatures only.
import type { Io } from "../lib/cli.ts";
import type { GateResult } from "../lib/findings.ts";
import type { ChromiumCheck } from "./test.ts";

/** One `pnpm install --frozen-lockfile --offline --reporter=ndjson` run. */
export interface InstallRun {
  readonly exitCode: number | null;
  readonly output: string;
}

export function decideSetup(_install: InstallRun, _chromium: ChromiumCheck): GateResult {
  return { exit: 0, summary: "" };
}

export function run(_argv: readonly string[], _io: Io): Promise<number> {
  return Promise.resolve(0);
}
