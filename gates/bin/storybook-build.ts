// The Storybook build gate (contracts/gates.md § `storybook-build`).
// Entry stub (specs/006-storybook-workbench tasks.md T003): it exits 2 "not implemented" until phase 2 implements it.
import { main } from "../lib/cli.ts";

/** Not implemented yet: the entry wrapper turns the error into exit 2 with one line naming it. */
export function run(): number {
  throw new Error("not implemented (storybook-build, phase 2)");
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/entry-stubs.test.ts "storybook-build exits 2 with exactly could not run: not implemented (storybook-build, phase 2)"
if (import.meta.main) await main(run);
