---
scope: landing
phase: landing
round: 2
verdict: approved
base: 3a247ef5f684a102f95e433e7cf41550839c79e4
head: a7e2381
tdd_check: pass
---

# Landing review, round 2 (PR #25, mission 007-mutation-gate-strictness, #23)

This is a check-only round under the landing stop rule. I checked that round 1's blocking findings are resolved and
that the folds broke nothing. I did not search afresh. Range checked: `da7416c` (round 1 head, pre-fold) to `a7e2381`,
through the landing history fold (pre-fold head `a6c770a`, kept as `archive/claude/023-mutation-gate-strictness-prefold`),
phase 2 and phase 3 fix round 2, the run summary `208ea08`, the measurement commit `d8238ff`, its record `1239deb` and
its revert `a7e2381`. The working tree is clean.

## Findings

No blocking finding.

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L2-01 | note | `gate:mutation -- --base 3a247ef --files gates/lib/mutation/report.ts,gates/lib/plant-judge.ts` at `a7e2381` | **One cold run had 2 Timeouts. I could not reproduce them.** The first heavy run on a sandbox that had just booted (uptime 8 min, 222 s) reported 2 Timeouts: `report.ts:106:17` Regex `/\d+$/` and `/^\D+$/`, both static. Three later runs of the same command, one at a time, had **0 Timeouts**: `main`'s mutation config in a scratch worktree (188 s), HEAD's config in the same worktree (192 s), and HEAD in the checkout again (191 s). The mutation status of every mutant is the same in all three. Tests run before the kill: `main` config 75 and 361, narrowed order 83 and 369 (and 936 on one run). Under lever 1 these mutants had to run every `tokens` module first (L1-01: 365 and 934 against far more). So the narrowed order reaches the killing test about as early as `main` does, and L1-01's mechanism is gone. I did not run `main`'s config cold, so I cannot say whether the cold run would time out there too. With no reproduction, the operator rule drops this. | None (dropped, operator rule). |

Dropped for the operator (no follow-up issue, operator rule):
- L2-01;
- phase 2 R1-01 and the `red.sh` label gap of phase 3 R1-01, as in round 1;
- L1-06 and L1-07, which the operator accepted in round 1.

## Earlier findings

- **L1-01 (blocking): resolved.** The operator chose "only source-table first" (phase 3 operator round 2, O2-01).
  - `vitest.mutation.config.ts:41-45` puts `tokens-source-table` alone at `groupOrder` 1. Every other project is at 2,
    the rest of `tokens` included.
  - The red test came first. It is `fix-2` in `reviews/phase-3/red-commits`, `6c24892` after the fold (`907039f`
    before, per `history-map.txt`). The green commit is `52d24d9`.
  - Phase 3 round 3 approved it. That review re-ran `evidence/compare.mjs` on `fix-2/gate-source`. With `main`'s config
    against the narrowed order, no mutant of `report.ts` or `plant-judge.ts` moves. The two lever 1 Timeouts are Killed.
  - The eight `source.ts` entries and the FR-013 reference entries were measured again (`evidence/fix-2/`).
  - `evidence/fix-2/whole-diff.log` (`--base 3a247ef`): 305 mutants, none survived, **0 timeouts** (round 1: 8).
  - My own check is round 1's reproduction, re-run (table below): 0 Timeouts with `main`'s config and 0 with HEAD's in
    the same worktree. Round 1 had 2 there. One cold first run in the checkout had 2 Timeouts (L2-01, not reproduced).
- **L1-02 (blocking): resolved.** `evidence/README.md` § "Result: CI measurement (landing L1-02, 2026-11-12)" follows
  the procedure in § "Open for landing":
  - *Step 1, the measurement commit.* `d8238ff`, whose parent is `208ea08`, changes only `packages/tokens/src/source.ts`.
    It changes 230 lines of 230. Every added line ends in a space, and `git diff -w 208ea08 d8238ff` is empty. Before
    the commit, no line ended in a space. Backticks occur only in comment lines (4-7, 29), so no template literal
    changes. `ci/dist-compare.txt` records `tokens.css`, `tokens.json` and `index.d.ts` as identical.
  - *Step 2, the local `--plan` check.* I re-ran `gate:mutation -- --base 3a247ef --plan` in a scratch worktree at
    `d8238ff`. stdout and stderr are byte-identical to `ci/plan.stdout` and `ci/plan.stderr`: 14 shards and 13 cuts.
    The eight entries are exactly the 30-line ones, `source.ts:1-30` to `211-230`. Seven are alone in their shard, and
    `1-30` shares a shard with `plant-judge.ts:281-305`. No shard holds two entries of one file.
  - *Step 3, the CI record.* The record and `ci/shards.md` give the shard contents, each `gate:mutation` step time, a
    job link per shard and the run link (run 60). Every `source.ts` shard is within 480 s, and the slowest is `31-60`
    at 400 s. The one mixed shard (`1-30`, 115 s) is under 480 s, so the draft-PR fallback is not needed. No shard is
    over 480 s, so nothing goes to the operator. I could not read the run from this sandbox. The orchestrator's brief
    agrees with the record: run 60 on `d8238ff`, all 29 jobs success.
  - *Core count.* The step log does not state it. The record uses R-05's fallback and says so: the documented size of
    the standard runner (2 vCPUs for private and internal repositories). It is stated as documented, not observed, and
    the 480 s bound is measured on CI itself. This meets the procedure.
  - *Step 4, the revert.* `a7e2381` is a `git revert` of `d8238ff`, on the PR and before merge.
    `git diff 208ea08 a7e2381 -- packages/` is empty, so `packages/` is restored exactly. The whole
    `208ea08..a7e2381` diff is the five evidence files of `1239deb`. `git diff 3a247ef a7e2381 -- packages/` is empty,
    so the PR changes nothing under `packages/`.
- **L1-03 (note): folded.** Phase 2 fix round 2, O2-01. `gates/bin/mutation.ts:170-171` passes the `timeout` and
  `compile-error` line through `oneLine`, with a red test first (`fix-2` `20a5bd1`). Phase 2 round 3 approved it.
- **L1-04 (note): folded.** Phase 3 O2-02. 001 `research.md:387` and `:434` and `plan.md:57` and `:217` each carry a
  dated 2026-11-11 note. The 60-line text is kept.
- **L1-05 (note): folded.** Phase 2 O2-02. `specs/001-repository-foundation/contracts/gate-cli.md:7` keeps "a one-line
  summary" and adds the dated note on record and report lines at exit 0.
- **L1-06, L1-07 (notes): accepted** in round 1, unchanged.

## The folds

- **Landing history fold.** `git diff a6c770a 52d24d9` is empty, so the fold changed history only, not the tree.
- **Remap commit.** `2c1befd` maps the five landing-fold commits in `history-map.txt` and rewrites `red-commits` for
  phases 2 and 3 to the folded SHAs. Every red SHA and phase base is an ancestor of HEAD: `6351832`, `20a5bd1`,
  `3894d2b`, `849b5a0`, `6c24892`, `a4b3222` and `4100cdc`.
- **`tdd-check.json` (`8b2bb54`, head `2c1befd`).**
  - Phase 1 is `exempt`, with `tdd-exempt.md`.
  - Phase 2 is `pass`: red `phase` and `fix-2` exit 1, the final tests exit 1 on base, and head exits 0.
  - Phase 3 is `pass`: red `phase`, `lever-3` and `fix-2` exit 1, the final tests exit 1 on base, and head exits 0.
  - Since `2c1befd`, only files under `specs/` and `knowledge/` have changed, plus the measurement commit and its
    revert, which cancel out. So the checks still hold at `a7e2381`.

## Checks run

All ran at `a7e2381` unless stated. Node 22.23.4, `OCELLE_CHROMIUM_PATH` and `PLAYWRIGHT_BROWSERS_PATH` set, one heavy
job at a time.

| Check | Result |
|---|---|
| `gate:typecheck` | exit 0 |
| `gate:lint` | exit 0, 173 files |
| `gate:test-lint` | exit 0, 114 files |
| `gate:config-copies` | exit 0, identical |
| `gate:signoff -- --range 3a247ef..HEAD` | exit 0, 53 commits |
| `gate:mutation -- --base 3a247ef --plan`, scratch worktree at `d8238ff` | 14 shards, 13 cuts; byte-identical to `evidence/ci/plan.*` |
| `gate:mutation -- --base 3a247ef --files report.ts,plant-judge.ts`, checkout, first run after boot | exit 0, 222 s; 2 timeouts (L2-01) |
| same, scratch worktree, `vitest.mutation.config.ts` and its unit test from `3a247ef` | exit 0, 188 s; 0 timeouts |
| same, scratch worktree, HEAD config restored | exit 0, 192 s; 0 timeouts |
| same, checkout, again | exit 0, 191 s; 0 timeouts |
| `git diff 208ea08 a7e2381 -- packages/`; `git diff 3a247ef a7e2381 -- packages/` | both empty |
| `git diff a6c770a 52d24d9` | empty |

The four mutation runs agree on every mutant except the two Timeouts of the cold run: 159 Killed, 65 CompileError
and 4 Ignored, with 13 static mutants. I did not rerun `pnpm test`, `gate:plants` or the `source.ts` sandbox entries.
Phase 3 round 3 ran or read them at `a670dd6`, and since then no code or test has changed. CI on `a7e2381` had just
started at the briefing, so I did not wait for it. The scratch worktrees were removed afterwards.
