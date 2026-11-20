// The sandbox-paths gate (op 023, #60; scaffold: no behaviour yet).
import { main } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { emit } from "../lib/findings.ts";
import { verdict } from "../lib/sandbox-paths.ts";

export function run(argv: readonly string[], io: Io): number {
  void argv.slice(0, 0);
  return emit(verdict({ tracked: 0, code: null, stdout: "", stderr: "" }), io.out, io.err);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/sandbox-paths.test.ts
if (import.meta.main) await main(run);
