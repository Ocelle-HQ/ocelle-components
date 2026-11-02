// Runs a tool as a child process and collects its exit code and output: the process boundary of the gates
// (research.md R-09). The gates-integration tests run it; Stryker does not (research.md R-08), so each line with a
// mutant carries an equivalent-mutant record.
import { spawn } from "node:child_process";
import type { Io } from "./cli.ts";

/** One run of a tool: its exit code (null when a signal ended it) and its output. */
export interface ToolRun {
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/setup-offline.test.ts "exits 2 naming the missing package and pnpm run setup:online on an empty store, without the network"
export function runTool(command: string, args: readonly string[], cwd: string, env: Io["env"]): Promise<ToolRun> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/setup-offline.test.ts "exits 2 naming the missing package and pnpm run setup:online on an empty store, without the network"
  return new Promise((resolve, reject) => {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/setup-offline.test.ts "exits 2 naming the missing package and pnpm run setup:online on an empty store, without the network"
    const child = spawn(command, args, { cwd, env });
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/setup-offline.test.ts "exits 2 naming the missing package and pnpm run setup:online on an empty store, without the network"
    let stdout = "";
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/setup-offline.test.ts "exits 2 naming the missing package and pnpm run setup:online on an empty store, without the network"
    let stderr = "";
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/setup-offline.test.ts "exits 2 naming the missing package and pnpm run setup:online on an empty store, without the network"
    child.stdout.on("data", (chunk: Buffer) => (stdout += chunk.toString()));
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/setup-offline.test.ts "exits 2 naming the missing package and pnpm run setup:online on an empty store, without the network"
    child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/setup-offline.test.ts "exits 2 naming the missing package and pnpm run setup:online on an empty store, without the network"
    child.on("error", reject);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/setup-offline.test.ts "exits 2 naming the missing package and pnpm run setup:online on an empty store, without the network"
    child.on("close", (exitCode) => {
      resolve({ exitCode, stdout, stderr });
    });
  });
}
