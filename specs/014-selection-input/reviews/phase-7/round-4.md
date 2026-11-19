---
phase: 7
round: 4
verdict: approved
base: 51648060f379f41bd57ed9bf5d0522326fe06b32
head: f8e57cdd738255e3ab2fa24d04c5547cb37e56c7
tdd_check: pass
---

# Phase 7 review, round 4

Scope: the two commits since round 3 (`f1481d8`):

- `3e51bc5` adds phase 7 operator decision 3, which answers R3-01.
- `f8e57cd` is the planner's rewording of R3-02 in research.md (R-03 and the R-12 amendment) and in tasks.md (T114
  step 2).

`git diff f1481d8..HEAD --stat` lists only `research.md`, `tasks.md` and `reviews/phase-7/operator-decisions.md`
(14 insertions, 4 deletions). The same diff over `packages`, `storybook` and `gates` is empty. No code, test, story,
baseline or count changed.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R4-01 | note | specs/014-selection-input/tasks.md:355 (T114 step 1a); reviews/phase-7/operator-decisions.md:15, :17 (decision 2) | Step 1a still says a dialog open at load picks its initial focus "before `ocelle-listbox` has written its roving `tabindex`". That is the cause as first diagnosed. It is not the measured cause: the tabindex was already written in `connectedCallback` (`#apply(this.#model.batch())`, ocelle-listbox.ts:140), and the shadow list and slot came late. Step 2 (tasks.md:356) now states the measured cause explicitly ("the roving `tabindex` and the selection states were already written at connect, but the shadow list and slot came only with the first deferred update"), so a reader of T114 meets the correction one step later. The sentence is introduced as "Found while building the story", which is the finding as it was reported. Decision 2's context and answer in operator-decisions.md are operator records and rightly stay as they are. The prescribed and actual commit titles (`11ae954`, "writes its tab stop when it connects") are history and cannot change. Step 1a's test and its acceptance (focus on `gamma`, tabindex 0/-1) are correct whatever the cause. | Optional, for the planner: in step 1a, mark the sentence as the first diagnosis and point to step 2 for the measured cause, e.g. "(first diagnosis; the measured cause is in step 2)". |
| R4-02 | note | specs/014-selection-input/reviews/phase-7/plants.md:3-4 | The record still names base `ea7eca6^`, and nothing in it points to decision 3. Decision 3 accepts that run for fix-2 and moves the full run against `base.sha` to the head after the second merge of main, "recorded in `reviews/phase-7/plants.md` and the landing records". That run is still owed before hand-off. Until it is recorded, a reader of plants.md alone would find the base mismatch that R3-01 raised. | When the post-merge full run is recorded, give it base `5164806` (or the phase base as it then stands), its full output and exit 0, and cite decision 3. Until then, a one-line pointer to decision 3 in plants.md would help, but it is not required. |

## Test quality

Unchanged since round 3, which read every added and changed test, reran both red commits and found:

- genuine red failures: `2b73f1f` on `active: "ocelle-dialog"`, and `ea7eca6` with the story not yet built;
- no weakening after either red commit;
- no vacuous assertion;
- FR-054 covered in both themes;
- one mutant on the changed line of `ocelle-listbox.ts`, killed.

`git diff f1481d8..HEAD -- '*.test.ts' packages storybook gates` is empty, so none of these results can have moved.

## Checks run

| Command | Exit | Result |
|---|---|---|
| `git diff f1481d8..HEAD --stat` | 0 | research.md, tasks.md and phase-7 operator-decisions.md only |
| `git diff 5272edc..HEAD --stat` | 0 | records and docs only (research.md, tasks.md, phase-7 evidence logs, gates.md, operator-decisions.md, round-3.md, tdd-check.json) |
| `pnpm run gate:plants -- --affected 51648060f379f41bd57ed9bf5d0522326fe06b32 --list` | 0 | "every plant, by gates/bin/plants.ts (shared gate source)"; 314 of 314 selected, none judged (as in round 3) |
| `pnpm run gate:plants -- --affected 'ea7eca6^' --list` | 0 | its `note: affected:` lines are identical to plants.md (21 plants) |

As instructed, I did not rerun the heavy gates. The code is unchanged since round 3, which ran the following, all with
exit 0:

- listbox unit and browser suites;
- the composed story test in light and dark;
- typecheck, lint, test-lint and CSP;
- the file-scoped mutation run.

The suite totals rest on `check-head.log` (8007 passed) and on gates.md (visual 356, axe 356, storybook-build 178).

`tdd_check`: `tdd-check.json` is `pass`, with no problem, at `5272edc`. HEAD is newer, but `5272edc..HEAD` changes
only records and docs (above), so its proof of the code and tests still holds. I did not rerun the four-run check,
because nothing it measures has changed.

Tasks: every task under `## Phase 7:` is still ticked. `f8e57cd` changed only the wording of T114 step 2, and T114
stays checked. The new wording matches the code: `this.performUpdate()` sits at the end of `connectedCallback`
(ocelle-listbox.ts:145), after `#apply(...)` at :140, and the in-code comment at :141-144 says the same.

Constitution: no principle is touched by these two docs commits. Decision 3 is a recorded human operator decision
(`human:jeroennouwsdev`), which the workflow section provides for when a fork needs the operator.

## Earlier findings

- **R3-01 (blocking): resolved by operator decision.** Decision 3 (operator-decisions.md:19-25, commit `3e51bc5`,
  dated 2026-11-19 by the human operator) states R3-01 and the three options. It answers "Full run after merge
  (Recommended)".
  - It accepts the round-scoped run (`--affected ea7eca6^`, 21 plants, exit 0) for fix-2 and closes R3-01 explicitly.
  - It requires the full plants run against the phase base once, on the head after the second merge of main, before
    hand-off, recorded in plants.md and the landing records.
  - It excludes the interrupted `a121cad` run as evidence.

  R3-01's own required change named an operator decision as the alternative. Landing decision 4 (2026-11-18) is
  consistent with it: one further merge of main after #49, then counts, baselines and CI are redone. The decision's
  facts hold:
  - `--affected 5164806 --list` still selects 314 of 314 plants, because the landing merge `ac2f991` changes the gate
    source;
  - the recorded `ea7eca6^` selection still matches.

  The obligation that remains (the full run before hand-off) is tracked as R4-02. It does not block this phase.
- **R3-02 (note): addressed.** Three places now state the measured cause correctly: research.md:117-120 (R-03),
  research.md:698-701 (R-12 amendment) and tasks.md:356 (T114 step 2). The tabindex was written at connect, and the
  shadow list and slot came with the deferred first update. The fix renders at connect. One residual sentence in step
  1a remains (R4-01).
- **R3-03, R3-04, R3-05 (notes):** these required no change, and nothing in them has changed.
