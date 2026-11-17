---
phase: 1
round: 4
verdict: approved
base: 767c09779ea8e58c52d6f8f1182b2015ae74b821
head: 504f01841b00ec5da41fcee7d8b967c8e9e8fe2d
tdd_check: pass
---

# Phase 1 review, round 4

Scope: phase 1 at HEAD `504f018`. Since round 3 (`c3aadfa`), four commits landed. `05c4e75` ticks T048 in
`tasks.md` and adds `reviews/phase-1/round-3-fixes.md`. `cc87331`, `993b948` and `504f018` tick T049 to T052 in
`tasks.md` and append one line each to `reviews/phase-2/round-4-fixes.md`, `reviews/phase-4/round-2-fixes.md` and
`reviews/phase-5/round-2-fixes.md`. `git diff --stat c3aadfa..HEAD` lists only those 5 files. `git diff --stat
c3aadfa..HEAD -- packages storybook gates .specify` is empty, so no source, test, story, gate or script file changed.
Round 3's results for the code still hold. This round re-runs the TDD check, the fast gates and signoff.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R4-01 | note | specs/011-layout-headers/reviews/phase-1/check-final-tests-on-base.log, check-final-tests-on-scaffold.log | Same as R3-03. Both "final tests against old code" runs still exit 2 with `unit-tests: could not run: no test file found`. That is a load error, not proof of a behavioural failure. The behavioural evidence for phase 1 is still the red runs (`check-red-phase.log`: 18 of 3130 failed; `check-red-fix-2.log`: 1 of 3594 failed) and the round 1 scaffold run. | None for this phase. The possible op on `tdd-check.sh` from round 3 still applies. |

No blocking finding.

## Test quality

- **Tests changed since round 3:** none. `git diff c3aadfa..HEAD` touches no file under `test_pathspec`. Round 3's
  assessment stands: the red commits are `phase` `acda1d4` and `fix-2` `f47c795`, both failed for the right reason, no
  test was weakened after red, there are no vacuous assertions, and the scaffold `37cdf8e` holds signatures only.
- **Red evidence, re-run now:** `tdd-check.sh 1` at `504f018` gives `phase` exit 1 (`check-red-phase.log`: 18 of 3130
  tests failed) and `fix-2` exit 1 (`check-red-fix-2.log`: 1 of 3594 tests failed). Both match the earlier rounds.
- **Exemption:** `tdd-exempt.md` is unchanged and still holds (round 1).
- **Mutation:** not re-run, because no source changed since `c3aadfa`. Round 3's run (`gate:mutation -- --base
  767c097`, 268 mutants, 0 survived) covers the same code. The equivalent record for slot-state.ts:50 is still accepted
  (round 1).

## Checks run

All checks ran at HEAD `504f018` with `SPECIFY_FEATURE_DIRECTORY=specs/011-layout-headers`,
`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and `OCELLE_VISUAL_ENGINE=docker`. `docker
info` succeeded.

| Check | Result |
|---|---|
| `check-prerequisites.sh --json --require-tasks --include-tasks` | ok, FEATURE_DIR `specs/011-layout-headers` |
| `tdd-check.sh 1` (re-run: HEAD moved) | pass, head `504f018`; red `phase` and `fix-2` both exit 1; base exit 2 and scaffold exit 2 (R4-01); head exit 0 (`check-head.log`: 3601 tests passed in 158 files); no problem |
| `gate:typecheck` | pass |
| `gate:lint` | pass (304 files) |
| `gate:style-lint` | pass (19 files) |
| `gate:test-lint` | pass (207 files) |
| `gate:csp` | pass (24 files) |
| `gate:prefix` | pass (270 files; round 3 counted 298. The gate also counts untracked build output, `storybook/.generated` and `storybook/dist/*.html`, which round 3 had just rebuilt. No tracked file changed.) |
| `gate:pins` | pass (5 manifests) |
| `gate:contrast` | pass (169 pairs light, 177 dark, 158 required) |
| `gate:brand-rules` | pass (7 rules) |
| `gate:manifest` | pass (7 elements) |
| `gate:config-copies` | pass |
| `gate:signoff -- --range 767c097..HEAD` | pass (56 commits) |
| `pnpm test` | pass, via the head run of `tdd-check.sh` (3601 tests in 158 files) |
| `gate:mutation`, `gate:storybook-build`, `gate:visual -- --engine docker`, `gate:axe` | not re-run, because no source, story or baseline changed since `c3aadfa`. They passed in round 3: mutation 0 survived, 57 stories, 114 captures matched, 114 axe runs with 0 serious or critical. |
| `gate:plants` | not re-run. Round 3 found no failure in the 252 plants that finished before the 2-hour limit. The implementer's full sharded run passed at `33d7df1` (301 plants as expected). No code, test or gate changed after `33d7df1`. |

Other checks:

- **Tasks.** Every task of `## Phase 1:` is ticked: T001 to T008 and T048 (tasks.md:89). `story_phase_table`
  (`.specify/extensions/story/scripts/common.sh:97`) reports phase 1 with 0 open tasks out of 9. The work of T048 is
  still present: README.md:530-536 `## Forwarded slots`, readme.test.ts:75-76, `red-commits` `fix-2 f47c795`.
- **Changes outside the phase.** The ticks of T049 to T052 (tasks.md:151, 241, 266, 315) and the appended lines in
  the phase 2, 4 and 5 fix notes are bookkeeping for those phases. Each has its reason in the line it adds. They are
  for those phases' reviews to judge, and they change no behaviour of phase 1.
- **Constitution and plan.** Nothing changed in code since round 3, so round 3's findings on these hold. The four new
  commits are signed off (`gate:signoff`).

## Earlier findings

- **R3-01** (blocking): **resolved.** T048 now reads `- [X]` (tasks.md:89, commit `05c4e75`). `round-3-fixes.md`
  records the fix as bookkeeping with no red commit, which fits: the finding asked for no change in behaviour, and
  `red-commits` correctly has no `fix-3` entry. The task's work was already present and is still present (see Tasks).
- **R3-02** (note): no change, none was asked for.
- **R3-03** (note): still applies, carried as R4-01.
