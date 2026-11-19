---
phase: 2
round: 8
verdict: approved
base: 48cdc9584ab93373eff1544378e118f20eded10e
head: e676357f970a8d838b4cc0e3f11c45a607cc018b
tdd_check: pass
---

# Phase 2 review, round 8

Scope: a check-only round, under the landing stop rule. I checked that round 7's findings are settled and that
nothing regressed, and did not search the phase afresh. Round 7's head was 7059c274. The phase 2 commits since then
are b35d3d80 (R7-01, the operator decision in `plants.md`) and 571a8ed5 (R7-02, the comment move). The later commits
f5a38a30..e676357f are phase 6 work.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R8-01 | note | specs/012-button-action-row/reviews/phase-2/plants.md:55 | The CI Plants run link reads "_to be added after the push_". The operator's decision makes that run the full plant evidence for fix round 4, so the phase's plant record is complete only once the link is filled in and that run is green. This is expected at this point, because the branch has not been pushed since. | None in this phase. At landing, add the link to the CI Plants run on the pushed head, and confirm that all of its shards pass. |

## Test quality

This round adds and changes no test. `git diff 7059c274..HEAD -- packages/` touches only
`packages/elements/src/icon-slot.ts`, and that change is the comment move checked under R7-02. The red evidence,
weakened-test check and mutation result in round 7 still apply unchanged. `tdd-check.json` is the round 7 one
(7059c274, `pass`). No phase 2 source or test changed after it, so it was not re-run.

## Checks run

On e676357f:

| Check | Result |
|---|---|
| `git diff 7059c274..HEAD -- packages/` | only `icon-slot.ts`, 2 comment lines moved (`-w --stat`: 2 insertions, 2 deletions, all `//` lines) |
| `git diff --name-only f5a38a30~1..HEAD` | `gates/test/integration/visual.test.ts`, `gates/test/visual-timeout.test.ts`, `specs/006-storybook-workbench/plan.md`, `reviews/phase-6/*`, `tasks.md`; no phase 2 file |
| `tasks.md` hunks in f5a38a30..HEAD | lines 441+ and 528+, both inside `## Phase 6` (starts at line 369); Phase 2 (lines 113-220) is untouched |
| `pnpm run gate:lint` | 447 files checked, no finding |

The other checks of round 7 were not re-run, as the check-only scope allows. No phase 2 code or test changed after
them.

## Earlier findings

- **R7-01 (blocking): resolved.** Round 7's required change allowed two outcomes: record a local
  `gate:plants -- --affected 48cdc958…` run with exit 0, or, if running all 317 plants locally was impractical,
  "stop and ask the operator whether CI's Plants check may stand in for the local run", and never record a run that
  did not happen. b35d3d80 takes the second outcome. `plants.md` § "Operator decision on the fix round 4 plants
  record" (lines 44-55) records:
  - the question, asked as multiple choice;
  - the operator's answer, "CI Plants stands", quoted;
  - the local evidence that does exist: the two in-process plants, and `gate:visual` under docker on f379592c, with
    388 captures matching after the 10 regenerated baselines;
  - a plain statement that the `--affected 48cdc958…` selection is all 317 plants and "was not run locally";
  - the CI Plants run on the pushed head as the full evidence, with its link pending.

  No run that did not happen is recorded as having happened. The base it names is `base.sha`. The hand-run tables
  above it are kept. The record matches round 7's "stop and ask the operator" branch. The pending link is expected
  until the push (R8-01).
- **R7-02 (note): done.** 571a8ed5 moves the two lines "Its block padding is half the amount …
  (PLAN-FRESH-2-002 (a))" from the end of the label-baseline bullet back to just after the row bullet
  (`icon-slot.ts:7-9`). The rest of the change is in phase 2's own notes (`notes.md`, `round-5-fixes.md`). In the
  source, the diff is two `//` lines removed and the same two lines re-added, with no wording or code changed. "Its"
  now refers to the `inline-flex` row. The baseline bullet (lines 10-17) follows the row bullet and ends at its own
  references. The header reads correctly.
- **R7-03, R7-04 (notes):** no change was required, and none was made.

## Verdict

approved. Round 7's one blocking finding is settled by the recorded operator decision. The R7-02 comment move is
comment-only and correct. Nothing regressed, and the later phase 6 commits touch no phase 2 file. One note remains
for landing (R8-01): fill in the CI Plants run link after the push.
