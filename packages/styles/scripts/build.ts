// The package build's output step (003 research.md R-01): after `tsc`, writes `dist/base.css`, byte-identical to
// `src/base.css`. Stub (phase 1, with build()'s phase 2 signature in the phase 2 scaffold): buildPlan() plans no
// file and build() writes nothing; phase 2 gives both their behaviour, red first through packages/styles/test/build.test.ts.

/** One file of the output: its path under the output directory and its text (the tokens package's content entry). */
export interface PlanEntry {
  readonly path: string;
  readonly content: string;
}

/** The files to write for the text of `src/base.css`. Stub: none yet. */
export const buildPlan: (css: string) => PlanEntry[] = () => [];

/** Writes the output of the package in `packageDir` into `outDir`. Stub: writes nothing yet. */
export const build: (packageDir: string, outDir: string) => Promise<void> = () => Promise.resolve();

// Stryker disable next-line all: equivalent while build() is the phase-1 stub that resolves without doing anything; calling it on import or not calling it from the CLI changes nothing observable. Phase 2 replaces this with the R-01 I/O-boundary record naming packages/styles/test/build.test.ts
if (import.meta.main) await build("", "");
