// The package build's output step (003 research.md R-01): after `tsc`, writes `dist/base.css`, byte-identical to
// `src/base.css`. Phase 1 stub: buildPlan() plans no file and build() writes nothing; phase 2 gives both their
// behaviour, red first through packages/styles/test/build.test.ts.

/** One file of the output: its path under the output directory and its text (the tokens package's content entry). */
export interface PlanEntry {
  readonly path: string;
  readonly content: string;
}

/** The files to write for the text of `src/base.css`. Stub: none yet. */
export const buildPlan: (css: string) => PlanEntry[] = () => [];

/** Writes the output of the package. Stub: writes nothing yet. */
export const build: () => Promise<void> = () => Promise.resolve();

if (import.meta.main) await build();
