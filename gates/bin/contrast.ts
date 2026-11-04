// The contrast gate (002 FR-016, FR-017, FR-021; research.md R-07; contracts/gates.md § `contrast`).
import { main } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";

/** Scaffold: checks nothing yet (phase 5). */
export function run(argv: readonly string[], io: Io): Promise<number> {
  io.out(`scaffold: ${String(argv.length)} arguments, nothing checked`);
  return Promise.resolve(0);
}

if (import.meta.main) await main(run);
