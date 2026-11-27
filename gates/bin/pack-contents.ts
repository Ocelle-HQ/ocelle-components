// The pack-contents gate (030 FR-004; scaffold: no behaviour yet).
import { main } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { emit } from "../lib/findings.ts";
import { verdict } from "../lib/pack-contents.ts";

export function run(argv: readonly string[], io: Io): number {
  const result = verdict({ manifest: [], tarballs: [], sources: new Map(), version: argv.join(" ") }).result;
  return emit(result, io.out, io.err);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/pack-contents.test.ts
if (import.meta.main) await main(run);
