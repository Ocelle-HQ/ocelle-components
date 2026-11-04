// The brand-rules gate (002 FR-018, FR-019; research.md R-08; contracts/gates.md § `brand-rules`).
import { main } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";

/** Scaffold: checks nothing yet (phase 5). */
export function run(argv: readonly string[], io: Io): Promise<number> {
  io.out(`scaffold: ${String(argv.length)} arguments, nothing checked`);
  return Promise.resolve(0);
}

if (import.meta.main) await main(run);
