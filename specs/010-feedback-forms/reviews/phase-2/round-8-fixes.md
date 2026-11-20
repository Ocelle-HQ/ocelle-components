# Phase 2 review round 8: fixes (fix-6)

Review: round-8.md (operator round, changes_requested; operator: "Revert split, 75-minute limit (Recommended)").
Red commit `42539f40` (parent `a0e40aed`), recorded by `red.sh 2 fix-6` as `fix-6` in `red-commits`. Tasks T025k to
T025o.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O8-01 | fixed | none: not behavioural (the withdrawal of round 7's split: evidence kept, uncommitted change discarded, red commit reverted). The `fix-5` line of `red-commits` stays as the record of the reverted red | `1136ce71` (evidence: reviews/phase-2/mutation.md § O7-01 with its outcome paragraph, red-fix-5.log, red-commits `fix-5`, mutation-fix-5-before.log, mutation-fix-5-after.log); `git restore` of the T025i change (nothing committed); `a0e40aed` (signed-off revert of `636207eb`) |
| O8-02 | fixed | `42539f40`: in gates/test/ci-workflow.test.ts, the pinned `mutation-shard` line (`&& 75 \|\| 10`) and the op 015 limit test, now "a limit of exactly 75 minutes (010 operator rounds 6 and 8), 10 to the others, above the elements dry-run limit (op 015)", red on their assertions against the ci.yml of `a0e40aed` (red-fix-6.log: 2 of 7916 tests failed, `AssertionError: expected [ '  mutation-shard:', …(9) ] to deeply equal [ ... ]` and `AssertionError: expected 45 to be 75`; no setup or import error) | `7c26ed19`: .github/workflows/ci.yml (`mutation-shard` `timeout-minutes`, the comment above `mutation-plan`); specs/001-repository-foundation/contracts/ci-checks.md (`mutation-shard` row); gates/README.md; gates/test/ci-workflow.test.ts (in `42539f40`) |
| O8-03 | fixed | none: no test timed out, so nothing changed (T025o: "If no test times out, that run is the evidence and nothing changes") | unit-tests-fix-6.log |

## O8-01

T025k committed the measurement first, by path, with a closing paragraph in § O7-01 of `mutation.md` stating that the
split is withdrawn and why: under Stryker it made the cancelled shard slower (2748 s to 3515 s) and left the dry run
unchanged (1273 s, 1275 s), since `@stryker-mutator/vitest-runner` 10.1.1 passes `maxWorkers: 1` for Vitest 4 and
later. T025l then restored `vitest.config.ts`, `vitest.mutation.config.ts`, `vitest.mutation.elements.config.ts`,
`gates/README.md`, `gates/bin/mutation.ts`, `gates/bin/test.ts` and `packages/elements/README.md` to `HEAD` with
`git restore --`; `git status --short` was empty afterwards, and `vitest.config.ts` keeps `fileParallelism: false` on
`elements`. T025m: `git revert -s --no-edit 636207eb` made `a0e40aed`, git's default subject and body, nothing else in
it. Checks: `git diff 5c2cd73b HEAD -- . ':!specs/'` was empty, and `pnpm exec vitest run
gates/test/vitest-config.test.ts gates/test/integration/vitest-mutation-config.test.ts
packages/elements/test/node/readme.test.ts` passed (3 files, 685 tests).

The revert commit carries git's default message as T025m requires (`--no-edit`, no amend), so it has the sign-off but
not the Co-Authored-By and Claude-Session lines, and its subject is git's `Revert "..."` form.

## O8-02

The red changes pinned assertions because the operator decided the limit (rounds 6 and 8; constitution VIII); the
commit message says so. The limit test now also captures the `||` value and asserts it is 10, and still asserts that
75 is above `dryRunTimeoutMinutes` of `stryker.elements.config.json`. The head comment states N = 75 with the
measurements (2493–2717 s on run 44354367030, one shard cancelled at 45 minutes; 2748 s on this machine).

Stop condition (a shard measured or estimated on CI over 75 minutes): not met. The CI element shards took 2493–2717 s
and the slowest measurement on this machine was 2748 s (46 minutes), all under 4500 s. The 3515 s figure came from the
withdrawn split and does not apply to this tree.

## O8-03

A full `pnpm run gate:unit-tests` ran on `7c26ed19` (the tree after T025n), alone, starting 2026-11-19T01:22:01Z:
exit 0, 7916 tests passed in 239 files, 3570 s wall-clock. No test timed out, the visual test at
`gates/test/integration/visual.test.ts:115` included, so no limit changed. The two other full runs of this round also
had no timeout: the red run at `42539f40` (only the two red assertions failed) and `pnpm test` at the green tree.

## Checks

Machine: this container, 4 CPUs, Chromium build 1243 through `OCELLE_CHROMIUM_PATH`, `OCELLE_VISUAL_ENGINE=docker`.
One heavy job at a time.

| Check | Result | Log |
|-------|--------|-----|
| `red.sh 2 fix-6` at `42539f40` (a full `pnpm test` in a worktree) | `"tests_only":true,"red":true,"recorded":true,"exit_code":1`; 2 of 7916 tests failed, both red assertions; 3581 s wall-clock. A first attempt was stopped at the 30-minute background limit and its worktree removed; this is the rerun from the start | red-fix-6.log |
| `pnpm exec vitest run gates/test/ci-workflow.test.ts` after the green change | 10 tests passed | (console) |
| `pnpm run gate:test-lint` | exit 0: 356 files, no finding | test-lint-fix-6.log |
| `pnpm test` on the green tree | exit 0: 7916 tests passed in 239 files, 3588 s. A first run was lost when the container restarted; this is the rerun from the start | test-fix-6.log |
| `pnpm run gate:unit-tests` on `7c26ed19` (T025o) | exit 0: 7916 tests passed in 239 files, 3570 s, no timeout | unit-tests-fix-6.log |
| `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected a0e40aed` (skill step 5) | exit 0: 8 of 314 plants judged, every plant as expected. The red commit's parent is the base, as fix-4 did (see plants.md) | plants.md |

`red-fix-6.log` contains pnpm's store path as the tool printed it.

The green change was committed (`7c26ed19`) before T025o, as the coordinator asked. This note, plants.md and
unit-tests-fix-6.log are in a second commit.
