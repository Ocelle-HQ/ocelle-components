# Quickstart: validating mission 007

Prerequisites: `pnpm install --frozen-lockfile`; `OCELLE_CHROMIUM_PATH` and, for Stryker and plant runs, the browsers
alias of `knowledge/speckit-flows/findings/frontend-missions.md` § Browser path. One heavy job at a time.

## User Story 1: the report

1. `pnpm exec vitest run gates/test/mutation-report.test.ts gates/test/mutation-shards.test.ts
   gates/test/plant-judge.test.ts gates/test/findings.test.ts` (and the other `gates/test/mutation-*.test.ts`): the
   classification and its order, the output lines and summaries of `contracts/mutation-output.md` with their exact
   nouns, the repeated-file `--files` cause, and the judge's `reports` and `records`, for every status of
   data-model.md's table (spec SC-002).
2. `pnpm run gate:plants`: every mutation plant keeps its verdict; `pass-compile-error` and `pass-zero-mutant` assert
   their report lines on the real gate (spec FR-008, SC-001), and `error-zero-mutant-failing-test` ends exit 2 with
   Stryker's dry-run cause.
3. A real branch: `pnpm run gate:mutation -- --base <sha>` on a change with a type-only edit prints a `zero-mutants`
   line and exits 0.

## User Story 2: the token source

1. `B=$(git rev-parse ec0f533~1)`; `pnpm --silent run gate:mutation -- --base "$B" --plan` lists the `source.ts`
   entries and writes the cut count to stderr.
2. For each `source.ts` entry, the measurement run of research.md R-06, timed. Expected: 0 `timeout` lines, exit 0,
   at most 176 s (spec FR-009, FR-010); compare per mutant with `evidence/red/`, taken before any mission code, by the
   key of step 3; a mutant Killed red and Timeout green is listed as lever 1's, with its re-run (R-06).
3. The same for the FR-013 reference entries; compare per mutant with `evidence/red/`, each mutant keyed by start and
   end (line, column), mutator and replacement; a repeated or unmatched key fails the comparison loudly (R-06, with its
   re-run rule).
4. `pnpm exec vitest run --project gates-integration gates/test/integration/vitest-mutation-config.test.ts`: under
   Stryker's options `packages/tokens/test/source-table.test.ts` starts before every other module, then the other token
   modules before any other project; the mutation projects are the stated split of `tokens` and collect every test
   module once (R-05).
   *Amendment, 2026-11-11 (lever 1 narrowed, phase 3 O2-01):* `source-table.test.ts` starts first, and the next module
   is one of `elements`, not of `tokens`: every other project is one group at order 2 in Vitest's default order.
5. `pnpm --filter @ocelle/tokens build` and `cmp` `dist/tokens.css`, `dist/tokens.json`, `dist/index.d.ts` with the
   base's build (spec SC-005).
6. At landing: the CI measurement of research.md R-07 (the measurement commit on the mission's pull request, its
   `--plan` checked for the four sandbox entries first; a source.ts-only draft run only if a mixed shard misses 480 s).
   *Amendment, 2026-11-11 (lever 3, spec FR-014):* the `--plan` check expects the eight 30-line `source.ts` entries
   of `evidence/README.md` § Lever 3, not four.

The evidence README in `evidence/` holds every figure and the per-mutant record of spec FR-011.
