# Quickstart: validating mission 007

Prerequisites: `pnpm install --frozen-lockfile`; `OCELLE_CHROMIUM_PATH` and, for Stryker and plant runs, the browsers
alias of `knowledge/speckit-flows/findings/frontend-missions.md` § Browser path. One heavy job at a time.

## User Story 1: the report

1. `pnpm exec vitest run gates/test/mutation-report.test.ts gates/test/mutation-shards.test.ts gates/test/plant-judge.test.ts` (and the other `gates/test/mutation-*.test.ts`):
   the classification, the output lines and summaries of `contracts/mutation-output.md`, and the judge's `reports` key,
   for every status of data-model.md's table (spec SC-002).
2. `pnpm run gate:plants`: every mutation plant keeps its verdict; `pass-compile-error` and `pass-zero-mutant` assert
   their report lines on the real gate (spec FR-008, SC-001).
3. A real branch: `pnpm run gate:mutation -- --base <sha>` on a change with a type-only edit prints a `zero-mutants`
   line and exits 0.

## User Story 2: the token source

1. `B=$(git rev-parse ec0f533~1)`; `pnpm --silent run gate:mutation -- --base "$B" --plan` lists the `source.ts`
   entries and writes the cut count to stderr.
2. For each `source.ts` entry, the measurement run of research.md R-06, timed. Expected: 0 `timeout` lines, exit 0,
   at most 176 s (spec FR-009, FR-010).
3. The same for the FR-013 reference entries; compare with `evidence/red/`.
4. `pnpm --filter @ocelle/tokens build` and `cmp` `dist/tokens.css`, `dist/tokens.json`, `dist/index.d.ts` with the
   base's build (spec SC-005).
5. At landing: the CI measurement of research.md R-07.

The evidence README in `evidence/` holds every figure and the per-mutant record of spec FR-011.
