# Phase 1 review round 3 (operator round): fixes

Red commit: `fix-3 2355951` in `red-commits`, log `red-fix-3.log` (`red.sh 1 fix-3`: tests only, red, recorded; 1 of
3852 tests failed, the SHA-256 test (R1-03), on its `toEqual`: its `plantsBase` field received the stale
`- base: <old phase base>` line (64 characters, not remapped) where `- base: <new base.sha>` was expected. Every
other test passed, the O3-01 test and the three O3-03 tests included.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O3-01 | fixed | No red needed: the finding is a missing test of behaviour that is already right (fix procedure step 3; tasks.md T011), so the new test passes against the phase's code. It is in the red commit `2355951`. Hand mutants MA and MB now fail it (table below). | gates/test/integration/fold-history.test.ts "folds with exit 0 when origin/main and main exist but reach no commit of the range (op 021, edge case never refuses wrongly, O3-01)": `signedRepo("ok")`, `refs/remotes/origin/main` and `refs/heads/main` both at `foldBase`; one `toEqual` on exit 0, `ok:true`, `problems` `[]`, base.sha rewritten, both main refs still at `foldBase`, no unsigned commit in `<foldBase>..HEAD`. |
| O3-02 | fixed | `2355951` (red): `signedRepo` gets an optional third parameter `withPlants` (default off, so the other tests' repositories are unchanged) that writes `plants.md` with `- base: <phaseBase>` between two fixed lines before the green commit. The SHA-256 test turns it on and adds `plantsBase` (`[- base: <new base.sha>]`) and `plantsOther` (the other lines unchanged) to its `toEqual`; its other expected values, `commits: 4` included, are kept. | tooling/speckit/bin/fold-history.sh: the remap's `sed` pattern (`:123`) and both `base_line_only` `grep` patterns (`:146`) go from `{7,40}` to `{7,64}`. Nothing else in the script changed. |
| O3-03 | fixed | No red needed: assertions strengthened on behaviour that is already right (tasks.md T013); they pass against the phase's code and are in the red commit `2355951`. No expected value was dropped. | gates/test/integration/fold-history.test.ts: scenario 3 asserts `notBuilt: true` (a problem including `could not build the folded commit`); scenario 4 and the R1-02 test assert `remapUnsigned: true` (a problem including `the remap commit could not be signed`), in the form of scenario 5. |
| O3-04 | fixed | No red: docs only. | .claude/skills/ocelle-land/SKILL.md:181, the one sentence on a failed fold now states the script's contract: HEAD on the old head, exit 1 when a verification failed, 2 when the fold could not run; the prefold ref is kept only once the rebuilt commits have passed their checks, and a failed or unsigned remap commit removes it again. No other line of the skill and no other skill changed (`ocelle-run` unchanged). |

## Hand mutants

Each run against `gates/test/integration/fold-history.test.ts` with the fixed script mutated in place (the original
saved outside the repository), then restored; `git diff` afterwards shows only the two widened lines.

| Mutant | Change | Result |
|---|---|---|
| MA | `(( on_main == 0 )) \|\| die …` -> `die …` | killed by the O3-01 test |
| MB | first count `"$base..$old_head"` -> `"$base^..$old_head"` | killed by the O3-01 test |
| P1 | remap `sed` pattern back to `{7,40}` | killed by the SHA-256 test (O3-02) |
| P2 | `base_line_only` `^-- base:` `grep` back to `{7,40}` | killed by the SHA-256 test (O3-02) |
| P3 | `base_line_only` `^\+- base:` `grep` back to `{7,40}` | killed by the SHA-256 test (O3-02) |
| T1 | the `commit-tree` `die` message replaced by an unrelated one (`working tree not clean`) | killed by scenario 3 (O3-03) |
| T2 | the remap problem text replaced by `final tree differs outside the evidence files` | killed by scenario 4 and the R1-02 test (O3-03) |

## Checks run

- `pnpm test`: exit 0, 3852 tests passed in 153 files.
- `pnpm run gate:typecheck`, `gate:lint` (297 files), `gate:test-lint` (203 files): exit 0, no finding.
- No TypeScript source changed, so `gate:mutation` has nothing to mutate; no CI gate changed, so no plant was added.
- `pnpm run gate:plants -- --affected 34ce2afba10b57e4d2df972f1f9497b283c0b75e`: exit 0, no plant selected, 0 of
  309 plants judged. The output is the same as the one in `plants.md`, so `plants.md` is unchanged.
- Diff against the phase base outside `ops/021-fold-signing/`: `gates/test/integration/fold-history.test.ts`,
  `tooling/speckit/bin/fold-history.sh`, `tooling/speckit/README.md`, `.claude/skills/ocelle-land/SKILL.md` (the one
  sentence of O3-04), and the orchestrator's run summary under `knowledge/speckit-flows/runs/` (commit `58ffad21`,
  not this op's change). No other skill, no `gates/bin/signoff.ts`, no `.github/`.
