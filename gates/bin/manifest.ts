// The manifest gate (005 FR-009, research.md R-06, contracts/checks.md § New gate `manifest`). Scaffold: signatures
// only, not registered.
import type { Io } from "../lib/cli.ts";
import type { Finding } from "../lib/findings.ts";

/** The findings of a committed manifest against the generated one: stale members and undescribed public members. */
export function manifestFindings(committed: unknown, generated: unknown): Finding[] {
  throw new Error(`not implemented: manifestFindings(${typeof committed}, ${typeof generated})`);
}

export function run(argv: readonly string[], io: Io): Promise<number> {
  return Promise.reject(new Error(`not implemented: manifest ${argv.join(" ")} in ${io.cwd}`));
}
