---
phase: 3
round: 1
verdict: approved
base: f6474bdf8b0d9fba6e4a96ace8ed0f86ecfe28bc
head: 60df409aaff2fa95104d1792f314e41d8dd24b04
tdd_check: pass
---

# Phase 3 review, round 1

Scope: `git diff f6474bd..60df409`. That is 43 commits: 41 of this phase and the two merges of `origin/main`
(`1b6ddd5` with mission 007, `39763c7` with mission 005), plus the five untracked tdd-check outputs. Most of the
946-file diff comes in with the two merges. I read the phase's own commits one by one (`git log --no-merges
f6474bd..HEAD ^476602e`) and read the merges' conflict resolutions with `git show --cc`.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | specs/006-storybook-workbench/reviews/phase-3/red-commits:1 | `red-commits` holds only `phase 88aa460`. `red.sh` replaces an entry with the same label, and every phase-3 red commit used the label `phase`. The record for the main red commit `039862a` (T019 to T028) and for the CI reds (`b9e8648`, `b250daa`, `c7d9e0c`, `af49ce3`, `50ccf08`, `5744a80`, `8bd63f4`, `47300eb`, `4170fad`, `52913f9`) is gone, so only their commit messages carry that evidence. I re-ran `039862a` myself (see Test quality) and it is red for the right reason. | None for this phase. In later phases, give each red its own label (for example `fix-<n>` or `ci-<n>`) so that tdd-check re-checks every red. |
| R1-02 | note | specs/006-storybook-workbench/reviews/phase-3/check-final-tests-on-base.log:39, check-final-tests-on-scaffold.log:39 | The final tests on base and on scaffold exit 2 with `unit-tests: could not run: no test file found`. That is a whole-run failure, not a test-by-test one. It meets tdd-check's non-zero rule, but by itself it does not show that each test fails on missing behaviour. The red commits show that, so the verdict does not rest on these two logs. | None. |
| R1-03 | note | .github/workflows/ci.yml:172 | `gate:signoff -- --range f6474bd..HEAD` reports 2 findings. Both are main's squash commits `476602e` and `e7d7d54` (authored by the operator, no `Signed-off-by`), which the merges brought in. CI checks the pull request's base..head, which excludes them. `--range 476602e..HEAD` reports `82 commits checked, no finding`. | None. |
| R1-04 | note | gates/lib/story-page.ts, gates/lib/visual-host.ts, gates/bin/visual.ts, gates/bin/plants.ts, gates/visual/capture.ts | The mutation run lists 475 `process boundary` records in the changed code. Each one names its covering integration test, visual plant or CI job, and 11 of them are "covered by CI only". Mission 007's gate accepts this form, and the run below kills every other mutant. The cover is real: the full plant run (280 plants, every plant as expected) and the integration tests passed here, and CI run 43276896426 passed on code identical to HEAD. The wiring's correctness therefore rests on the plants and on CI, not on unit tests. | None. |
| R1-05 | note | gates/bin/axe.ts | `gate:axe` exits 2 `not implemented (axe, phase 4)`. That is phase 4's scaffold and is outside this phase. | None for phase 3. |

No blocking finding.

## Test quality

**tdd-check.json:** `pass`, with no problems. The red commit `88aa460` exits 1 (8 of 2993 tests fail, all in
`plant-runner.test.ts`, on `plantShards(…, otherSize)` and `otherShardSize` being absent). HEAD exits 0 (2993 tests
pass in 133 files). The final tests exit 2 on base and on the scaffold (R1-02).

**Re-running the main red commit `039862a`:** I created a fresh worktree at `039862a` and ran `setup:offline` then
`pnpm test`. Result: exit 1, `306 of 2366 tests failed`. Each failure is a missing behaviour:
- the scaffold's `not implemented (capture-plan | visual-verdict | container | …, phase 3)` throws;
- plant.json keys not yet known (`unknown key engine`, `unknown key baselinesOf`);
- `visual` missing from the registry and from `ci.yml`.

The mutation-gate tests (`mutation-shards`, `mutation-records`, `mutation-ranges`) fail because their fake git
expects T019's scope with `gates/visual/`, which T029 adds (`unexpected git call: git diff … pathspecs`). That is the
missing behaviour too, not a setup error.

**Scaffold `39106bf`:** signatures that throw `not implemented`, and doc comments. It adds no behaviour and no test
file.

**Weakening:** I read every test change made after a red commit:
- `8e7fa10`:
  - `.plant-spinner` instead of `#storybook-root *`, which first matched an invisible `<style>`; the assertion is
    unchanged.
  - The plant-repo baselines copy is now byte-for-byte against the repository's 24 baselines, which is stricter.
  - Counts follow the registry.
  - The other changes are type-only rewrites (`without()`, a typed `RunnerTools`, a typed env) with the same
    assertions.
- `4e3f9bf`: only adds tests that kill mutants. The `treeProblems(…, [])` calls pass the newly required argument.
- `056a6bb`: the storybook-build integration line is now an exact alternation of two full messages, where before it
  required only a prefix. That is stricter, and the commit message gives the reason (CI run 43056264356).
- `99062ff`: `plants-robustness` now asserts each plant-time stderr line instead of `[]`, which is stricter.
- `72a393b` and `c77fe56`: shard counts changed by plan decisions 29 and 30, re-derived by hand. The red commits
  `4170fad` and `52913f9` precede them.
- The merges `1b6ddd5` and `39763c7` keep both sides' tests. The `--cc` diffs show only unions and the counts that
  follow from them.

No test was skipped, deleted or loosened.

**Vacuous assertions:** none found in the files I read:
- `gates/test/integration/visual.test.ts`
- `png.test.ts`
- `visual-verdict.test.ts`
- `container.test.ts`
- `story-checks.test.ts`
- `plant-runner.test.ts`
- the `plants.test.ts` additions

Every assertion is an exact `toEqual` or `toBe` on exit code and lines. None is conditional or snapshot-only, and
none uses `skip` or `only` (`gate:test-lint`: 168 files, no finding).

**Acceptance scenarios:** scenarios 1 to 12 of User Story 2 are each covered by an integration test, a plant, or both.
The 48 directories in `gates/plants/visual/` are exactly the 48 rows of contracts/plants.md § `visual` (diffed by
name).

**Mutation:** `pnpm run gate:mutation -- --base f6474bd…` (local, about 30 min) gave `4339 mutants on the changed
lines of 37 files, none survived; 40 timeouts, 1226 compile errors, 3 zero-mutant entries; 488 equivalent records`.
Of these, 475 are the process-boundary records of R1-04. Of the 13 equivalent records, the 8 in phase-3 code
were each read and their reasons hold:
- `plants.ts:260` and `container.ts:147`: an empty catch returns undefined;
- `registry.ts:150/164/175`: a job's lines start empty;
- `story-checks.ts:45/47/49`: CDP attribute pairs.

The other 5 belong to the merged missions 005 and 007.

## Checks run

These ran in the sandbox with Node 22.23.4 and docker, one at a time, on HEAD `60df409`:

| Check | Result |
|---|---|
| `pnpm test` (tdd-check, check-head.log) | 2993 tests passed in 133 files |
| `gate:typecheck` | no type error |
| `gate:lint` | 255 files, no finding |
| `gate:test-lint` | 168 files, no finding |
| `gate:style-lint`, `gate:prefix`, `gate:csp`, `gate:pins`, `gate:config-copies`, `gate:contrast`, `gate:brand-rules`, `gate:manifest` | no finding |
| `gate:signoff -- --range 476602e..HEAD` | 82 commits, no finding (R1-03 for base..HEAD) |
| `gate:storybook-build` | `built 21 stories` |
| `gate:visual` (docker) | `visual: 42 captures match their baselines (docker only: no cross-engine comparison)`, 56 s |
| `visual:update` on the unchanged tree | `baselines: wrote 0 files (0 added, 0 changed, 0 removed), 0 bytes in total`; `git status` unchanged |
| `gate:plants -- --plan` (`OCELLE_VISUAL_ENGINE=auto`) | `[1,…,19]` |
| `gate:plants -- --shard 1` … `--shard 19`, then `--verdict storybook/.visual/plant-shards` | every shard as expected; `plants: 280 plants of 16 gates and the registry judged, every plant as expected` |
| `gate:mutation -- --base f6474bd` | none survived (see above) |
| `gate:axe` | exit 2, phase 4 not implemented (R1-05) |

**Baselines:** 42 files in `storybook/baselines/`, 2,490,191 bytes in total (T039 and T046q), every story in both
themes.

**CI:** CI is not readable from here. The record `ci-run-43276896426.md` covers head `23580e1`, whose diff to
`60df409` is docs only (`tasks.md`, the record itself). It records:
- all 138 jobs succeeded;
- Visual regression: `42 captures match their baselines (docker+podman)`;
- the Plants verdict: 280 plants as expected;
- 19 shards, the longest 463 s (under 570 s);
- `E_k` of at least 26G against `M` = 4G.

T046z's five checks are recorded as met.

**Tasks:** every task of `## Phase 3:` is ticked:
- T019 to T046z;
- T046m and T046n, recorded as "Does not apply" by plan decision 30.

I checked that the work is present: the files of plan.md § Project structure, the 48 plants, the 42 baselines,
`shardSize` 3 and `otherShardSize` 80. Outside the merges, the phase changed only:
- `gates/`;
- `storybook/baselines/`;
- `specs/006-storybook-workbench/`;
- `.github/workflows/ci.yml`.

**Constitution:**
- IV, no network: covered by the I/O recorder and the `fail-network`, `fail-same-origin-fetch`, `fail-websocket` and
  `fail-xhr` plants.
- V, a story and baseline per state: 42 of 42.
- VIII, test-first: see Test quality.
- I to III: no element code changed in this phase outside the merge of mission 005.

**Plan:** decisions 21 to 30 are followed as recorded. The operator's choices are cited in tasks.md and decision-30.md.

## Earlier findings

None: this is round 1.
