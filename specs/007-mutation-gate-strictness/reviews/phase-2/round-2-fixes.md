# Phase 2, round 2: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O2-01 | fixed: the `timeout` and `compile-error` report lines go through `oneLine`, as findings do, so a mutant with no replacement ends its line at `replaced by`, with no trailing space. The form was already stated in `contracts/mutation-output.md` (amendment 2026-11-11). | `gates/test/mutation-shards.test.ts`, describe "a mutant with no replacement (phase 2 round 2, O2-01)": three runs (exit 0; exit 1 beside a Survived finding; exit 1 with a Survived finding that has no replacement), exact lines plus no stdout line ending in whitespace. Red commit e17d9ed, `red-fix-2.log`: the three tests fail only on the trailing space. | `gates/bin/mutation.ts` (the `undecided` line and the header comment) |
| O2-02 | fixed: dated note added to the general exit-0 row, "a one-line summary" kept. No red test: a record note, no behaviour (Principle VIII). | none | `specs/001-repository-foundation/contracts/gate-cli.md:7` |

Checks: `pnpm test` (2102 passed), `gate:typecheck`, `gate:lint`, `gate:test-lint` all pass; `gate:plants` alone, every
plant as expected (`evidence/us1-fix-2-plants.txt`); `gate:mutation -- --base e17d9ed`, alone, before the commit: 1
mutant on the changed lines, none survived (`evidence/us1-fix-2-gate.log`).
