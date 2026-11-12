# Phase 2, review round 2: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| OP2-01 | fixed | none: a record no test or gate reads, exempt from red (`tdd-exempt.md`, T066) | specs/001-repository-foundation/contracts/ci-checks.md: the first table's row `Custom-elements manifest` / `pnpm run gate:manifest` (job id `manifest`; since 005) before `Plants`; the gate-id paragraph names 005 FR-009's `manifest`, fourteen in all (was thirteen); the required-checks paragraph says fifteen check names, and that `gates/README.md` lists the same fifteen (was fourteen); a 005 paragraph after 002's: the ruleset on `main` must add `Custom-elements manifest`, and until then the gate does not block a merge |
| OP2-02 | fixed | `fix-2` aa82d51 (`red-fix-2.log`: 3 of 2520 tests failed on assertions, the README's `define` and `:host([hidden])` statements expected without "(FR-006)" and "(FR-034)", and the README case of the new planning-ID check, `[ 'FR-006', 'FR-034' ]`) | packages/elements/test/node/readme.test.ts: the two statements end at the sentence's full stop, and "the package-facing documents carry no planning ID" checks `README.md` and `CHANGELOG.md` for `FR-`, `SC-`, `US<n>-<n>`, `PLAN-`, `R-<nn>` and `T<nnn>` references (T064); packages/elements/README.md:231 and :243 lose "(FR-006)" and "(FR-034)", the sentences otherwise unchanged (T065) |

The first red run of `fix-2` failed in setup (the default Chromium path does not exist in this environment), not on
the tests; it was run again with `OCELLE_CHROMIUM_PATH` set, and `red-fix-2.log` is that second run.

Checks run on Node 22, one at a time: `gate:unit-tests` (2520 tests passed in 119 files), `gate:typecheck`,
`gate:lint` (223 files, no finding), `gate:test-lint` (152 files, no finding), `gate:plants` (217 plants of 14 gates
and the registry judged, every plant as expected).
