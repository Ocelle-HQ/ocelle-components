// The accessibility gate (contracts/gates.md § `axe`).
// Entry stub (specs/006-storybook-workbench tasks.md T003): it exits 2 "not implemented" until phase 4 implements it.
import { main } from "../lib/cli.ts";

/** Not implemented yet: the entry wrapper turns the error into exit 2 with one line naming it. */
export function run(): number {
  throw new Error("not implemented (axe, phase 4)");
}

if (import.meta.main) await main(run);
