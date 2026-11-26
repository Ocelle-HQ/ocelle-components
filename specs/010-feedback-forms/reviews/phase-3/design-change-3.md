# Phase 3 design change 3: the element-shard planner change split out, known gap recorded

## Decision

Operator, 2026-11-15 (human:jeroennouwsdev), `decision-split-shard-change.md`, option "revert, record gap":

- The element-shard planner change of T041a and T041b (design changes 1 and 2) is split into its own issue and op. It
  does not land as part of mission 010. This supersedes `decision-design-change-1.md` and `decision-stop-2.md` as far
  as they put that change into 010.
- The gate change comes off 010's branch as a revert commit, history kept.
- T041a and T041b are marked as moved to the op.
- Phase 3's element mutation shards over 7:00 (`stop-1.md`, `stop-2.md`) are recorded as a known gap; with op 015,
  CI's 45-minute limit for element shards covers them.
- T041 is finished without the 7:00 shard rule. The whole-diff `gate:mutation` must still exit 0.

The new op is op 017, issue #42, branch `claude/042-mutation-shards-by-count`. The revert is `14538fa`: the files of
the change (`gates/lib/mutation/shards.ts`, `gates/bin/mutation.ts`, `gates/test/mutation-shards.test.ts`,
`gates/test/mutation-fakes.ts`, the `@stryker-mutator/instrumenter` devDependency in `package.json` and
`pnpm-lock.yaml`, the `gates/README.md` amendment) are as at `666bb70`. Op 017 can start from `971c431`, `0d99aa5`
(T041a) and `5c2ef49`, `9a91a92`, `253292f` (T041b).

## The known gap

Mission 010 plans its mutation shards on 007 FR-014's rule: 30-line entries, shards of at most 10 entries and 250
lines, for every file. On that plan, in this container (4 CPUs, Chromium 153 build 1243, one job at a time):

| Plan | Shard | Wall-clock | Source |
|---|---|---|---|
| 30-line | 2 (`scripts/manifest.ts:136-166`, `src/form-control.ts:1-30`) | 569.4 s | `stop-1.md` |
| 30-line | 3 (`src/form-control.ts:31-60`) | 534.6 s | `stop-1.md` |
| 30-line | 4 (`src/form-control.ts:61-90`, no mutant) | 216.9 s | `stop-1.md` |
| T041a's (moved) | 9 (`src/form-control.ts:43-46`, 9 static valid mutants) | 439.5 s, 448.4 s | `stop-2.md` |
| T041a's (moved) | 10 (`src/form-control.ts:47-56`, 9 static valid mutants) | 435.6 s | `stop-2.md` |

By estimate (217 s plus about 14 s a valid mutant, `stop-1.md`), eight of the 19 `src/form-control.ts` shards of the
30-line plan are over 420 s, and shards 14, 18 and 19 (651 s, 749 s, 623 s) are over 600 s. These shards were not run.

CI covers the gap: op 015 (`ce1d9c7` on `main`) sets the `mutation-shard` job's `timeout-minutes` to 45 for a shard
whose files hold `packages/elements/src/`, and 10 for any other. 010's branch takes that when `main` is merged at
landing (decision 1 of `decision-split-shard-change.md`: no merge of `main` during the run).

## What changes in the design artifacts

- `plan.md` decision 11: the two planner rules are taken out; the known gap, the move to op 017 (#42), op 015's CI
  limit and that 010 lands without the rule are recorded. The Primary Dependencies line and the Constitution Check's
  Licence and supply chain row return to no new dependency. The phase 3 entry of the phase list points to the gap.
- `research.md` R-09 and `quickstart.md` step 8: the planner rules are replaced by the known-gap record.
- `tasks.md`: T041a and T041b are marked `[-]`, moved to op 017 (#42); T041's shard timing is replaced by the
  known-gap record and T041 is ticked; the stop-and-ask list replaces T041's 7:00 stop by the record and reads the
  10-minute shard stop as CI's job limit (10 minutes, or 45 for an element shard); § Dependencies drops T041a and
  T041b from phases 3 to 5. Phase 4 has no shard-timing rule of its own.
- `design-change-1.md` and `design-change-2.md` stay, each with a note at the top that this decision supersedes it.
- `mutation.md` § Split and revert records the revert and the whole-diff run after it.

## T041 after the split

T041's other parts are done: the README "Form controls" and `ocelle-form-input` sections and Entry points row, the
CHANGELOG line, `engine-floor.md`, the plants and phase-end gates at `b76d4ee` (`plants.md`, `stop-1.md`), and the
whole-diff `pnpm run gate:mutation -- --base 2004e82` at `14538fa`: exit 0, 496 mutants on the changed lines of 4 files,
none survived; 2 timeouts, 110 compile errors, 5 equivalent records; 26:46 (`mutation.md` § Split and revert).

T002's and T025's shard timings (phases 1 and 2) stand as recorded; neither is changed by this decision.
