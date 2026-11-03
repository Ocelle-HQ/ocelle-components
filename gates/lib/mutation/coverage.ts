// Stryker's coverage record for a run whose tests load no mutated file (FR-011; phase 4 review round 1, R1-10).
// Stryker's instrumented code creates the record `globalThis.__stryker__.mutantCoverage` in a test worker when a
// mutated file loads, and its Vitest runner passes it on per test file. When no test loads any mutated file (a change
// only to source no test imports), no record exists, Stryker takes that for "no coverage analysis" and runs every test
// against every mutant, so each mutant is reported Survived after a full test run. Preloading a module that creates
// the empty record in every process Stryker starts makes Stryker report those mutants NoCoverage, as for any mutant no
// test reaches. The dry run must run the tests for that: stryker.config.json sets `vitest.related` to false.
import type { Io } from "../cli.ts";

/** The module that creates Stryker's empty coverage record, unless instrumented code already made one. */
export const coverageRecordModule = `data:text/javascript,${encodeURIComponent(
  "const ns = (globalThis.__stryker__ ??= {}); ns.mutantCoverage ??= { static: {}, perTest: {} };",
)}`;

/** The environment of a Stryker run: `env`, with the coverage record module preloaded after any NODE_OPTIONS. */
export function strykerEnv(env: Io["env"]): Io["env"] {
  const preload = `--import=${coverageRecordModule}`;
  const options = env.NODE_OPTIONS;
  return { ...env, NODE_OPTIONS: options === undefined || options === "" ? preload : `${options} ${preload}` };
}
