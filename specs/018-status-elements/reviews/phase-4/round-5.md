---
phase: 4
round: 5
verdict: approved
base: b1de26af18d6bd3ead3f13149eff67459f039187
head: 0752a284c11da4982d4bd106f4b582d5a1ac36a5
tdd_check: pass
---

# Phase 4 review, round 5

Scope: whether round 4's three blocking findings (R4-01 to R4-03, all from `tdd-check.sh 4` at `97154a0a`) stand after
the operator decision L-02 (`reviews/operator-landing.md` § L-02, committed in `b23411d8`), and whether T044a can be
ticked. Since round 4 (`a4e2690c`), `git diff 97154a0a..HEAD` changes none of T044a's files
(`packages/elements/test/scenarios/pill-tag.ts`, `test/pill-tag.test.ts`, `test/browser/pill-tag.test.ts`) and not
`src/ocelle-pill-tag.ts`. Under `reviews/phase-4/` only `round-4.md` and the round-4 check outputs changed. The main
merge `e465bfbc` changes nothing under `packages/elements/`. The rest is landing work: L-01 (`0672d63d`, `dbf7de88`,
`40d1b7e6`), L-02 (`b23411d8`, which removes the seven `replay-upstream.sha` pins `c5d23c12` added) and L-03
(`c19eb084`, `0752a284`).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R5-01 | note | specs/018-status-elements/reviews/phase-4/tdd-check.json | The `tdd-check.json` in the tree is still round 4's `fail` record for `97154a0a`. Under L-02 the phase's evidence is the record committed in `401f8db1` (`status: pass`, head `4ea285b0`), so this review's `tdd_check: pass` refers to that record, not to the file at HEAD. I did not re-run `tdd-check.sh 4`. L-02 replaces its result, and I confirmed the cause independently (see Checks run: `git merge-tree` of base `b1de26af` with main `1d599fd4` conflicts, exit 1, in 33 files). | none |
| R5-02 | note | specs/018-status-elements/reviews/phase-4/plants.md:10 | `gate:plants -- --affected b1de26af… --list` at HEAD selects the same set as recorded, 326 of 326 with exit 0. The unmapped file that triggers it is now `.github/workflows/evidence-reuse-shadow.yml` (from main), not `mutation-shadow.yml`. The selection is the same ("every plant"), so this is not a different selection. | none |
| R5-03 | note | PR #105 CI, run 46005074224 (head `0752a284`) | CI on the current head was still in progress at the time of review. Typecheck, Code lint, Style lint and Test lint had passed; Unit test shards, Accessibility and Visual regression were running. This phase 4 verdict does not depend on that run (see Checks run). The landing still needs it green, because `c19eb084` adds a test body. | none |
| R5-04 | note | packages/elements/src/ocelle-pill-tag.ts:765; specs/018-status-elements/reviews/landing/plants-l03.md | L-03 (landing fold, not phase 4): the surviving mutants of CI shard `ocelle-pill-tag.ts:751-780` (run 45980648741) are on line 765. That line came in with phase 5 (`7824d341`), so it is not phase 4 code. The new body in `test/scenarios/pill-tag-interactive.ts` (`c19eb084`) is test-only. Its assertions are exact `toEqual` expectations on a per-step `{ extra, display }` table, with no conditional assertion and no `skip`/`only`. `plants-l03.md` records all four mutants killed in both harnesses, and `mutation-l03.log` records 58 mutants with none surviving. Both suites pass locally at HEAD (Checks run). I did not judge it further here; it belongs to the landing review. | none |

No blocking finding.

## Test quality

- **Red evidence of the phase (R4-01, R4-02).** `git show 401f8db1:…/phase-4/tdd-check.json` reads `status: "pass"`,
  `base: b1de26af…` (equals `base.sha`), `head: 4ea285b0…`, red commit `phase` `2eaa948f` exit 1, final tests on the
  scaffold exit 1, at head exit 0, `problems: []`. `401f8db1` is the direct child of `4ea285b0` and changes only the five
  check outputs under `reviews/phase-4/`, so the record is for exactly that head. Its logs support it:
  `check-red-phase.log` and `check-final-tests-on-scaffold.log` fail on assertions for the missing behaviour
  (`build.test.ts:395,404` the pill module and its definition; `pack.test.ts:51` the export;
  `elements-stories.test.ts:1628` the pill stories; `themes`/`values`/`stories` tests on the new `line-height-snug`
  token), not on setup errors. `check-head.log` reads "8062 tests passed in 247 files". The final tests on base exit 2
  with "no test file found". The script at `401f8db1` (`tdd-check.sh` lines 7-8) accepts this, because there the scaffold
  run is the behaviour proof. Round 1 approved on this same evidence.
- **Why the record had to change.** The `fail` at `97154a0a` came from the replay hardening of #101, not from phase 4's
  tests. Under the new rule, `exports.test.ts:18` was judged against main's longer export list. Pinning the replay to
  main would need `git merge-tree b1de26af 1d599fd4`, which conflicts (exit 1, 33 files, among them `exports.test.ts`,
  `src/index.ts`, `test/in-process.ts`). R4-01 asked for "a recorded operator decision, or red evidence the new rule
  accepts". L-02 is that decision, recorded with its facts and its table. **R4-01 and R4-02 are resolved by L-02.**
- **Phase 4 source after the checked head.** `ocelle-pill-tag.ts` changed after `4ea285b0` only in phases 5 and 6
  (`7824d341`, `db9f3658`, `88f87ae6`, `5a871ac2`), each with its own phase evidence. T044a changed no source.
- **T044a.** It is unchanged since round 4, which read its whole diff, reproduced its plants and its font independence,
  and accepted the hand-applied plants in `plants.md` § T044a as its red evidence (`red.sh 4 fix-1` gave `red: false`
  for this behaviour-neutral test-only change, `red-fix-1.log`). Round 4 also found no weakened or vacuous assertion
  (R4-04, an operator-sanctioned replacement, and R4-05 stay notes). L-02 names the same evidence. T044a's item (4),
  "`tdd-check.sh 4` reports `pass`", is met through L-02: the phase's passing record plus CI on the candidate for HEAD.
- **Mutation.** T044a is test-only (round 4: `gate:mutation -- --base 2f6a3245` found nothing to mutate). No phase 4
  source line changed since. I did not run `gate:mutation -- --base b1de26af`: since the main merge, that base spans
  main's own source changes, so the run would not measure this phase. CI's Mutation testing on `40d1b7e6` failed only
  the shard `ocelle-pill-tag.ts:751-780`, which is phase 5 code. L-03 addresses it (R5-04).

## Checks run

At HEAD `0752a284`, Node 26.13.0, `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`:

- `vitest run --project elements packages/elements/test/pill-tag.test.ts packages/elements/test/pill-tag-interactive.test.ts`:
  2 files, 110 of 110 passed.
- `vitest run --project elements-browser packages/elements/test/browser/pill-tag.test.ts packages/elements/test/browser/pill-tag-interactive.test.ts`:
  2 files, 106 of 106 passed.
- `gate:typecheck` (no type error), `gate:lint` (759 files, no finding), `gate:test-lint` (577 files, no finding): exit 0.
- `gate:plants -- --affected b1de26af18d6bd3ead3f13149eff67459f039187 --list`: 326 of 326, exit 0 (R5-02).
- `git merge-tree --write-tree b1de26af 1d599fd4`: exit 1, 33 conflicting files (confirms L-02's facts for phase 4).
- **Accessibility and unit tests in CI (R4-03).** PR #105, CI run 45980648741, head `40d1b7e6`, synthetic merge
  `21fa877` ("Merge 40d1b7e6… into 1d599fd4…"). Main `1d599fd4` is already merged into the branch (`e465bfbc`), so the
  tested tree is the branch's own. Results: `Accessibility` success ("axe: 838 story-theme runs, 0 serious or
  critical"); `Unit tests` success ("13035 tests passed in 391 files across 6 shards", shards 0 to 5 all success);
  `Unit test inventory`, `Visual regression`, `Plants`, `Typecheck`, `Code lint`, `Test lint` and `Sign-off` success.
  The only failure in the run is `Mutation testing`, from shard `ocelle-pill-tag.ts:751-780` (R5-04). The
  whole-repository axe gate test `gates/test/integration/axe.test.ts`, which failed locally with a non-assertion error
  in round 4, is a Vitest test in the unit suite, and the full suite passed on this candidate. I could not download the
  `unit-test-plan` artifact (artifact API access is denied in this session), so I did not check its per-file listing. No
  `deferred_ci` entry exists in this phase's record, so step 3's per-file proof is not required. **R4-03 is resolved by
  this CI run.** `40d1b7e6..0752a284` adds only `test/scenarios/pill-tag-interactive.ts` (+44 lines, a phase 5 body) and
  two files under `reviews/landing/`. It changes no phase 4 file, so the phase 4 verdict rests on run 45980648741 and
  does not depend on run 46005074224 (R5-03).
- `c19eb084` and `0752a284` are signed off.

## Earlier findings

- **R4-01: resolved** by L-02. The phase's evidence is the passing `tdd-check.json` of `401f8db1` for head `4ea285b0`,
  verified above. The cause of the failure at `97154a0a` (the hardened replay against a conflicting main) is recorded
  and reproduced.
- **R4-02: resolved** with R4-01. In the `401f8db1` record, the final tests fail on the scaffold (exit 1, assertion
  failures) and on base.
- **R4-03: resolved.** The axe gate test and the `Accessibility` check pass in CI on head `40d1b7e6` (run 45980648741),
  and nothing in phase 4 changed after that head.
- R4-04, R4-05 (notes): unchanged and still accepted.

T044a (tasks.md:238) is accepted. Its work is present, its evidence is the hand-applied plants in `plants.md`, and its
item (4) is met through L-02 and CI. It can be ticked.
