# Operator decisions during the landing of PR #105

Recorded by the orchestrator during `/ocelle-land`, from the operator's answers (multiple choice). Dated 2026-11-27.

## L-01: mutation shards stop at the 30-minute dry-run cap

**Facts.** CI on PR #105 heads 97154a0a, a4e2690c and c5d23c12: unit tests, accessibility and plants are green.
Every mutation shard that mutates element source (38 on c5d23c12, run 45963721649) ends with Stryker's
"Something went wrong in the initial test run" after 30 m 30 s to 32 m. That matches `dryRunTimeoutMinutes: 30` in
`stryker.elements.config.json`, a value pinned by `gates/test/vitest-config.test.ts:88` and set in 008
(`specs/008-overlays/research.md`). On main, #102's element shards already took 31 to 41 minutes per job.
018 adds about 6,000 lines of element tests.

**Decision (operator: "Measure, then fold").** Time the elements dry run locally, on main and on this branch, to
confirm the timeout. If it is confirmed, fold a test-first raise of the cap (staying under the 75-minute
element-shard job limit in `ci.yml`) as a landing change.

**Measured 2026-11-27, in this sandbox (4 CPUs).** Stryker ran with `stryker.elements.config.json`, its cap
lifted in a scratch copy, through the gate's own `strykerEnv`, mutating 3 lines. The "Initial test run succeeded"
line reads:

| Revision | Tests | Initial test run |
|---|---|---|
| main 1d599fd4 | 3725 | 30 min 25 s |
| this branch b23411d8 | 3940 | 32 min 36 s |

Main is already past the 30-minute cap here; 018's 215 tests add 2 min 11 s. The fold raises
`dryRunTimeoutMinutes` from 30 to 45 minutes. That leaves the branch about 12 minutes of headroom and the 75-minute
element-shard job limit about 30 minutes for the mutants. The test pin in `gates/test/vitest-config.test.ts`
changes with it.

## L-02: phase red/green evidence after main was merged in

**Facts.** #101 (64c57578) added a replay pin: `base.sh N --with-main <sha>` writes `replay-upstream.sha`, and
`tdd-check.sh` builds each replay base with `git merge-tree <phase base> <main>`. After main 1d599fd4 was merged
(e465bfbc), that merge-tree conflicts for the bases of phases 2 to 7, in 5 to 35 files. Phase 1's base merges
cleanly. `tdd-check.sh 4` stops with "cannot integrate pinned main 1d599fd4 into replay revision b1de26af; resolve
the replay conflict before proceeding". Without the pin, phase 4's original red commit 2eaa948f is judged
`invalid` at 97154a0a (round 4, R4-01), because the root-exports list it asserts grew on main. Each phase passed
`tdd-check.sh` before main was merged in.

**Decision (operator: "Pre-merge evidence").** The `replay-upstream.sha` pins are removed. Each phase's evidence is
its last passing `tdd-check.json` from before the merge, in history:

| Phase | Passing check committed in | Checked head |
|---|---|---|
| 1 | 4fc2ed5b | 7aff3a95 |
| 2 | 9e1f1093 | c278ea4c |
| 3 | b1de26af | 431fa7e6 |
| 4 | 401f8db1 | 4ea285b0 |
| 5 | db9f3658 | 02097a92; the post-fold check ca9e3dbb failed only on timing flakes outside 018, accepted in 6d6d3299 |
| 6 | 7b4624e9 | 836d33ce |
| 7 | 0dc9792f | 217ab92d |

Phase 4's operator round 3 fix (T044a, ccd9c5a5 and 97154a0a) is test-only. Its evidence is the hand-applied
plants in `phase-4/plants.md`, which reviewer round 4 accepted. HEAD is checked by CI on the merged candidate.
For the retrospective: #101's replay cannot handle a phase base that conflicts with main, which is the usual
state of a long mission after its first main merge.
