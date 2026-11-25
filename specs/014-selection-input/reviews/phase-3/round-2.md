---
phase: 3
round: 2
verdict: approved
base: 83a6f8bb18b847d67dc7309f01e82d683dce181e
head: c5397ebd5fe9ae0dfeb948362d4a8de0a1544b26
tdd_check: pass
---

# Phase 3 review, round 2

Change under review: `git diff 83a6f8b..c5397eb`, with no uncommitted change. `c5397eb` arrived during this review
and adds only an operator-decision record (`reviews/phase-3/operator-decisions.md`, the phase folds and their force-push),
so the checks below, which ran on `869db9f`, hold for it. This round focuses on the round 1 fixes
(`git diff 4f6b6b5..869db9f`):
- the planner's `5fe3143` (T062b and T093a; R-15 updated for the tab's border bar);
- the fix `0360d4e`;
- the check `869db9f`.

The operator decisions of round 1 stay in force and are not findings:
- the docker-only baselines with the no-podman note;
- the single axe exception for the scrolling listbox story;
- `ocelle-tabs` named from `label` only, with its approved constitution III exception.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | `packages/elements/test/scenarios/tabs.ts:183-185` (US2-1 `panelAncestors`) | R1-06 is deferred as a note, with the reason the fix note gives: the `tree` read in the same body guards the case. | None now. |

No blocking finding.

## Test quality

**Whether the weak-test rule of `/speckit-story-fix` step 3 holds** (no `fix-1` red commit; `red-commits` still lists
only `phase 8a59155`)

- **R1-01: the rule holds.** The finding was a missing test that let a mutant survive behind a false equivalent
  record. The source already behaved correctly, which round 1 measured: the tab reads `"2"` after its `value` attribute
  is removed. A test-only commit could not have been red against the source. The red evidence is
  `fix-1-mutant.log`. It shows the new body (`FR-009: a host that removes a tab's value attribute ...`, in
  `scenarios/tabs.ts`, run in both harnesses) failing against the formerly disabled mutant. The failure is an
  `AssertionError`: the attribute and value read `"tasks"`, not `null`/`"2"`, and the event reports `"tasks"`. That
  is the right reason. The disable comment is gone, and this round's mutation run reports no survivor on
  `ocelle-tab.ts:158`.
- **R1-02: the rule holds; there is no behaviour change.** The finding concerned a record, not behaviour. The fix
  removes `ocelle-tabs`' `attributeChangedCallback` override, so the `value` attribute takes Lit's path,
  `this.value = fromAttribute(value)`, which is the same string for a present attribute. For a removed attribute the
  setter now receives `null` instead of `""`. In `hostSet` (`src/selection.ts:60-66`), `null` matches no entry,
  keeps the selection for the tabs kind and gives `remembered: null`, because `null` is not `""`. That is the
  outcome `""` gave. Before and after are the same, so no red test is owed. The existing bodies cover the paths:
  US2-8 (attribute set), FR-021 (first-render `value`), FR-006 (`label` by attribute, which kills a misrouted
  attribute). The reworded record at `ocelle-tabs.ts:76` is accepted. With `{}`, Lit's String defaults give the same
  attribute and converter. Without `noAccessor`, Lit wraps the class's own accessor and still calls it.
- **R1-03: the rule holds, as a record.** The behaviour fix itself was made in round 0. Its red evidence is
  `red-mutation.log`: HEAD's `test/tabs.test.ts` against green `9418dc6`'s tab sources exits 1 and fails only the
  `FR-023: the shown panel ...` body (1 of 57), at the contenteditable step (expected `null`, received `"0"`). This
  matches what round 1 measured independently. `notes.md` now describes the change as a behaviour fix to FR-023 that
  was not run red first, not as a simplification. The commit was not split because the branch is published, which is
  acceptable: rewriting published history is the larger harm, and the evidence is now kept.

**Tests changed since round 1** (`git diff 4f6b6b5..869db9f` on test files)
- One body was added (R1-01).
- One test title was reworded (`selection.test.ts:448`, R1-07). Its assertion is unchanged.
- Nothing was removed or loosened.

**TDD check**: `tdd-check.json`, at head `0360d4e`, is `pass`. The final tests exit 2 on the base and 1 on the
scaffold, and pass at the fix. `869db9f` adds only the check's own outputs.

**Mutation**: this review ran `pnpm run gate:mutation -- --base 83a6f8b` on `869db9f`, which exited 0.
- 392 mutants on the changed lines of 7 files, none survived.
- Reports: 1 timeout (`ocelle-tabs.ts:361`, `write`'s condition forced `false`), 122 compile errors and 1
  zero-mutant entry (`src/index.ts`).
- 11 equivalent records. These are round 1's twelve accepted records with the `:163` record removed: that record went
  with the removed override, under R1-02. The reworded `:76` record is accepted. Round 1's two rejected records are
  gone.

## Checks run

On `869db9f` (same code as HEAD `c5397eb`), one heavy job at a time, with
`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and `OCELLE_VISUAL_ENGINE=docker`:

| Check | Result |
|---|---|
| `gate:typecheck`, `gate:lint` (296 files), `gate:test-lint` (198 files), `gate:style-lint` (20 files), `gate:brand-rules`, `gate:pins`, `gate:config-copies`, `gate:prefix` (262 files) | exit 0, no finding |
| `gate:contrast` | exit 0: 166 pairs in light, 174 in dark, 155 required per theme |
| `gate:manifest` | exit 0: 7 elements, no finding |
| `gate:csp` | exit 0: 25 files |
| `gate:storybook-build` | exit 0: 36 stories |
| `gate:unit-tests` | exit 0: 3642 tests in 155 files |
| `gate:visual` | exit 0: 72 captures match (docker only; operator decision) |
| `gate:axe` | exit 0: 72 story-theme runs, 0 serious or critical; 22 notes, all excepted |
| `gate:signoff -- --range 83a6f8b..HEAD` | exit 0: 15 commits, no finding |
| `gate:mutation -- --base 83a6f8b` | exit 0 (above) |
| `gate:plants` (docker) | exit 0: 301 plants of 17 gates and the registry, every plant as expected (run to completion, about 70 minutes) |

## Earlier findings

Round 1 had four blocking findings.

- **R1-01: resolved.** The body exists and fails on the mutant (`fix-1-mutant.log`). The disable comment is removed
  (`ocelle-tab.ts:157-158`). The mutation run has no survivor.
- **R1-02: resolved.** The override and its record are removed (`ocelle-tabs.ts:152-160`), and the behaviour is
  unchanged, as argued above. The mutation run has no survivor, and no record over-claims.
- **R1-03: resolved as a record.** The red evidence is in `red-mutation.log` and `notes.md` is corrected. A
  behaviour fix was not red-first in `9dffb23`. That cannot be undone without rewriting published history, and the
  evidence now shows its test failing for the right reason against the old code.
- **R1-04: resolved.** `5fe3143` adds T062b (phase 4, US2-21 with a real `ocelle-segmented-choice`, in that phase's
  red commit, both harnesses) and T093a (phase 6, US2-22 with a real `ocelle-link`). The phase 3 stand-ins stay.

Round 1's notes:
- **R1-05: fixed.** R-15 in `research.md` now states the tab's border bar, its forced-colours rule and its test read.
- **R1-06: deferred** (R2-01).
- **R1-07: fixed** (the title only).
