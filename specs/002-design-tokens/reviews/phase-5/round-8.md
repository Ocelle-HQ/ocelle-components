---
phase: 5
round: 8
verdict: approved
base: eeb95d43d7ffa147e14193e215859c2c4a41586d
head: d5cc5e188672f94b130354b518a5b275691fd92e
tdd_check: pass
---

# Phase 5 review, round 8

Scope: the R7-01 fix, d5cc5e1 (planner, documentation only, so no red commit). `git diff 8e14b6c..d5cc5e1
--name-only` lists only `specs/001-repository-foundation/plan.md`, `specs/001-repository-foundation/spec.md` and
`specs/002-design-tokens/reviews/phase-5/round-7-fixes.md`. No source, test, gate, workflow or configuration file
changed, so the code under review is the same as in round 7 (7fb1a86).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R8-01 | note | specs/001-repository-foundation/plan.md:388-390 (§ Verification item 4) | The new clause "the entry bound was later lowered to 60 changed lines (operator decision, 2026-11-05, phase 5 round 6 of mission 002, O6-01)" does not name the decider. The other citations of the same decision (spec.md:282-283, :497-498; plan.md:54-55, :206-207) all say `human:jeroennouwsdev`. The decision is still traceable through O6-01. | None required. The next edit of that paragraph could add `human:jeroennouwsdev`. |

## Test quality

- No test changed since round 7 (`git diff 7fb1a86..HEAD -- gates/test packages` is empty). The round 7 analysis
  of red `fix-6` (fc27170, 22 assertion failures in `gates/test/mutation-shards.test.ts`, no setup error) and of the
  unweakened tests still holds.
- `tdd-check.sh 5`, re-run at d5cc5e1: `pass`. Phase red 06a58cb, fix-1 03520ef, fix-3 2bf1e4b and fix-6 fc27170
  each exit 1. Final tests exit 2 on the base and 1 on the scaffold, the head exits 0 (`check-head.log`: 1798 tests
  passed in 88 files), and `problems` is empty.
- Mutation was not run, as instructed. The code is unchanged since round 7, whose shards.ts run and the full-diff
  run of `round-6-mutation.log` (1193 mutants, none survived) stand.

## Checks run

On Node 22.23.4, at d5cc5e1:

- `.specify/extensions/story/scripts/tdd-check.sh 5`: `pass` (it runs the unit tests on each red commit, the base,
  the scaffold and the head).
- `git diff 8e14b6c..d5cc5e1 --stat`: 3 files, all spec, plan or review text.
- `grep -n 120` over 001 spec.md, plan.md, research.md, contracts/ and gates/README.md, read hit by hit (below).

## Earlier findings

- **R7-01 (round 7, blocking): resolved.**
  - **FR-013** (001 spec.md:278-287) now says an entry is a changed file, or one line range of a file with more
    than 60 changed lines. Such a file MUST be split into entries of at most 60 changed lines, and no shard holds
    more than 60 changed lines of one file. The text cites the operator decision of 2026-11-05 (phase 5 round 6 of
    mission 002, O6-01, human:jeroennouwsdev, "Smaller chunks (Recommended)"). The quote and the figures (264
    mutants, 670 s, cancelled at the 10-minute limit in CI) match round-6.md O6-01, which records the cancel at
    10:21 on run 41930740532. The 10-entry and 250-line bounds, the same-file rule and the cut limit are unchanged.
  - **SC-005** (spec.md:493-499) now says "no entry over 60 changed lines of one file", with the same dated note.
    The stale "the 120-line split" is now "the split within files", whose bound was lowered from 120 to 60.
  - **001 plan.md Performance Goals** (:49-58) now say "a file over 60 changed lines split into `path:start-end`
    entries of at most 60 changed lines", with the decision cited.
  - **Re-check note.** A new "Re-check after phase 5 round 6 of mission 002" (plan.md:206-215) follows the earlier
    re-check notes in form. It names FR-013, SC-005, R-08, contracts/gate-cli.md, gates/README.md and T071 / `red.sh
    5 fix-6`, and says the other bounds stay.
  - **The planner's extra clause, § Verification item 4** (plan.md:379-392, the clause at :388-390). It is appended to the historical
    account of the 120-line split adopted after run 41635769914. That account stays as it was, and the clause adds
    that the bound was later lowered to 60. This is accurate. It does not rewrite the recorded SC-005 measurement
    (run 41613884529) or the R4-01 decision. The one gap is the missing decider (R8-01, note).
  - **Remaining `120`s, each historical and correct.** spec.md:282 and :497-499 ("lowered from 120 to 60", "the
    120-line shard ... took 670 s"). plan.md:54-55, :209 and :213 (the new note). plan.md:165 and :179 (the re-checks
    after phase 3 rounds 9 and 10, which the round 7 required change said to keep). plan.md:386 (Verification item
    4's history). research.md:383, :423-440 (amended in round 6; measurements under the old bound). gate-cli.md:30
    and gates/README.md:137 ("down from 120"). Nothing in 001 now states 120 as the current bound, so FR-013, SC-005,
    the plan, R-08, the gate contract and `maxEntryLines = 60` (gates/lib/mutation/shards.ts:32) agree.
- R7-02 and R7-03 were notes; the fix note leaves them unchanged, which is fine.

## Verdict

`approved`: no blocking finding, `tdd_check` is `pass`, and the only change since round 7 is the documentation that
R7-01 asked for. One note (R8-01).
