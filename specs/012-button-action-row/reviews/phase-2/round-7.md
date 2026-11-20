---
phase: 2
round: 7
verdict: changes_requested
base: 48cdc9584ab93373eff1544378e118f20eded10e
head: 7059c27405e833a35018deb0927b0dda9a7446c4
tdd_check: pass
---

# Phase 2 review, round 7

Scope: fix round 4, which answers operator rounds 5 (O3-01) and 6 (O6-01). Planner d7387291 and 5de85ea9 (T029a to
T029h, plan decision 33 as amended), red 19921596 (`fix-4`) and 082fcd50 (`fix-5`), green f379592c, tdd-check
7059c274. The earlier phase 2 work was approved in round 4 and is not reviewed again here, except where this round
touches it.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R7-01 | blocking | specs/012-button-action-row/reviews/phase-2/plants.md:27-42; .specify/extensions/story/story-config.yml:17 | `plants_command` (`pnpm run gate:plants`) is set. It came in with the merge of op 016 (c4c0af45) after round 4, so this is phase 2's first round under it. The fix procedure (speckit-story-fix step 5) says to run `pnpm run gate:plants -- --affected <base.sha>` and replace `plants.md` with the run, in the form of the implement command (`- base:`, `- command:`, `- exit:` and the output verbatim). `plants.md` has no such record: no base, no command, no selection, no exit. It holds only the two plants run by hand for T029e, in process and against the in-process harness only. `pnpm run gate:plants -- --affected 48cdc958 --list` prints `note: affected: every plant, by gates/bin/plants.ts (shared gate source)` and "317 of 317 plants selected". The selection is everything because the merges changed shared gate source since the phase base, not because of this fix. The run still matters for this fix: f379592c changes 10 repository baselines, and the visual plants compare against the repository's baselines (notes.md:142-143 says `fail-token-changed` "uses the repository's baselines through its delta"). No plant run after the baselines moved is recorded. | Run `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected 48cdc9584ab93373eff1544378e118f20eded10e` and record it at the top of `plants.md` in the implement command's form (base, command as run, exit, output verbatim). The exit must be 0. Keep the hand-run tables below it as the record of the T029 and T029e plants. If running all 317 plants locally is impractical, stop and ask the operator whether CI's Plants check may stand in for the local run. Do not record a run that did not happen. |
| R7-02 | note | packages/elements/src/icon-slot.ts:7-17 | The new bullet ("In a labelled row the label wrapper takes part in baseline alignment …", lines 8-15) was inserted between the row bullet (line 7) and that bullet's second sentence. Line 16 ("Its block padding is half the amount by which the icon is taller …") is now the tail of the baseline bullet, so its "Its" reads as the `bare` row's or the icon's, not the row's. The text itself is right. | Move lines 16-17 back under line 7, so the padding sentence follows the row bullet, and leave the baseline bullet after it. Comment only; no test is needed. |
| R7-03 | note | specs/012-button-action-row/reviews/phase-2/tdd-check.json; check-final-tests-on-scaffold.log; check-final-tests-on-base.log | Both sub-checks exit 2 with `unit-tests: could not run: no test file found`. That is a setup failure, not a test failure. `tdd-check.sh` accepts any non-zero exit (lines 54 and 61), so `status: pass` does not, by itself, show that the final tests fail against the scaffold for the right reason. The cause is the overlay. `story_test_changes base..HEAD` now selects test files brought in by the merges as well (13 under `gates/test`, 10 under `gates/test/integration`, 17 under `gates/plants/storybook-build/.../tree/storybook/stories`, 17 under `storybook/stories`, and files under `packages/styles` and `packages/tokens`), and the scaffold tree cannot run them. Pass still holds, on the evidence. The scaffold property was proved by the last valid run, 2014d993 (exit 1, 261 of 3362 failed, all on assertions such as `no #b with an inner control` and missing exports). This round's new tests have their own red evidence: `fix-4` and `fix-5` both exit 1 for the right reasons, and HEAD exits 0. | None for this phase. The overlay follow-up already known for the base sub-check now covers the scaffold sub-check too. Have `tdd-check.sh` report a setup failure (exit 2, or "no test file found") as a problem, or limit the overlay to the phase's own test files. |
| R7-04 | note | specs/012-button-action-row/reviews/phase-2/notes.md:157-163 | The mutation run in the notes used `--base b594b7e`, not `base.sha`. `git diff` of `icon-slot.ts` is the same from either base (31 insertions, 8 deletions), so the result stands. I re-ran it with `base.sha` (below) and got the same result. | None. |

## Test quality

- **Red evidence, `fix-4` (19921596).** `red-fix-4.log`: 9 of 7761 failed, all on assertions. They are the CHANGELOG
  line, the two README lines, the button scenario in both harnesses, and the test-host scenario in both harnesses,
  with and without `base.css`. The red commit changes test files only (`changelog.test.ts`, `readme.test.ts`,
  `scenarios/button.ts`, `scenarios/slot.ts`). The red log shows only the aggregated object diff, so I checked each
  case myself. In a scratch worktree of HEAD with the rule removed and the scenario changed to return raw offsets,
  the seven button cases measure -4.59 to -6.19 px (`baseline`) and 0 px (`rowStart`). Every labelled case was red
  on its own, well outside the 0.5 px tolerance, compact included. With the rule they measure exactly 0 px.
- **Red evidence, `fix-5` (082fcd50).** `red-fix-5.log`: 11 of 7765 failed. These are the 9 failures of `fix-4` plus
  the two new README lines (the `bare` modifier, and baseline alignment for labelled rows only). That is this step's
  only red. The icon-only scenario passes against the code before the rule, as T029h and plan decision 33 say in
  advance. The change it guards is a regression (the unscoped rule), not missing behaviour, so a plant is the right
  proof.
- **Do the plants prove the icon-only cases?** Yes. In the same scratch worktree, with the unscoped
  `.icon-row > .label { align-self: baseline; }`, the icon's block-centre minus the native svg's is +21.59 px for
  `only`, +21.59 px for `only-compact` and +20.5 px for `only-busy`. Without the rule and with the scoped rule it is
  0 px. All three `centre` checks fail under the plant, far outside 0.5 px, and the labelled scenario still passes.
  This matches plants.md:39 and round 6's figures (-10 px to +11.6 px, a 21.6 px move). The other plant
  (`.icon-row { align-items: baseline }`) makes `rowStart` fail for all seven button cases and both test-host cases
  (plants.md:38), so the block-start half of T029a and T029b can fail too.
- **The 0.5 px tolerances.** They are sound. Every measured value is 0 px (or -4e-6 px) on the passing side. The
  failing side is at least 4.59 px (labelled) and at least 20.5 px (icon-only). The expected values are the
  paragraph marker's and the native svg's own positions, never a figure read from the rule under test. A zero-size
  empty `inline-block` has its baseline at its bottom edge, so the marker's top is the baseline.
- **Vacuous checks.** There are none. Both harnesses' `box()` returns `display: "absent"` with y 0 for a missing
  target (`test/in-process.ts:153`, `test/browser/driver.ts:218`), so a missing `.label`, `.icon-slot` or `.spinner`
  could make `rowStart` true without testing anything. The `align-items: baseline` plant rules that out: it makes
  `rowStart` false for every case, so every target exists. `bare` reads `.icon-row.bare` and compares against
  `"absent"`, so it fails if the class is lost. `square` (`native.height === icon`, `icon = 20` at
  `scenarios/button.ts:58`) keeps the native reference honest. No conditional assertion, `skip` or `only`, and no
  snapshot-only assertion.
- **Weakened tests.** None. `git diff 082fcd50..HEAD -- packages/elements/test` is empty, and the `fix-5` commit
  only adds to what `fix-4` added.
- **Coverage of the operator findings.** O3-01: default, compact, with an icon, flush, quiet flush, link mode and
  busy, plus the test host with and without an icon. O6-01: icon-only default, compact and busy. The test host has
  no bare row (`test/fixtures/test-host.ts` always renders `class="icon-row"`), so `slot.ts` has no icon-only case,
  as T029g allows. The notes say so (notes.md:99-100).
- **Mutation.** `pnpm run gate:mutation -- --base 48cdc958… --files packages/elements/src/icon-slot.ts` reports
  "0 mutants on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 1 zero-mutant entry; 0
  equivalent records". The changed lines are a CSS rule inside a `css` template and the header comment. Stryker
  makes no mutants of those, so the zero-mutant entry is a report, not a gap. The two plants stand in for the
  mutants a CSS mutator would make (all items baseline-aligned; every row including `bare`).

## Doc text and decision 33

- **`icon-slot.ts`** (lines 1-15, 42-44). The rule is `.icon-row:not(.bare) > .label { align-self: baseline; }` and
  nothing else in the stylesheet changed. The header names the label wrapper and the `bare` modifier, says why the
  rule is there, and says why it skips `bare` rows. All of it is accurate. Placement is R7-02.
- **README § Slot convention** (packages/elements/README.md:1302-1308, 1327-1333). It names the label wrapper and
  `bare` as part of the markup, and the Alignment bullet states both cases. It matches the code and the five
  `readme.test.ts` fragments.
- **CHANGELOG** (packages/elements/CHANGELOG.md:183-188). One Unreleased line, which states the before (4.6 to
  6.2 px above) and the icon-only behaviour. Accurate.
- **Plan decision 33 as amended** (plan.md:414-459). It matches the code: the scoped selector, `bare` as part of the
  convention, `ocelle-button.ts` unchanged (it already renders `icon-row bare` without a label,
  `src/ocelle-button.ts:504`), and the rule does not reach `ocelle-action-row`. I confirmed that last point:
  `ocelle-action-row.ts` renders no `.icon-row` and no `.label`, and the only other user of the convention,
  `spinner.ts`, renders no row. The test descriptions in the decision match T029a, T029b and T029f, and the plants
  match T029e.
- **Tasks.** T029a to T029h are ticked (tasks.md:184-211), and each one's work is present. No file outside the
  tasks was changed by this round's commits.

## Checks run

On HEAD 7059c274, clean tree:

| Check | Result |
|---|---|
| `pnpm test` | 7765 tests passed in 232 files |
| `gate:typecheck`, `gate:lint` (446), `gate:style-lint` (41), `gate:test-lint` (327), `gate:csp` (44), `gate:prefix` (465), `gate:manifest` (20 elements) | no finding |
| `OCELLE_VISUAL_ENGINE=docker pnpm run gate:visual` | 388 captures match their baselines (docker only) |
| `gate:storybook-build` | built 194 stories |
| `gate:mutation -- --base 48cdc958… --files packages/elements/src/icon-slot.ts` | 0 mutants, 1 zero-mutant entry, 0 equivalent records |
| `gate:plants -- --affected 48cdc958… --list` | `note: affected: every plant, by gates/bin/plants.ts (shared gate source)`; 317 of 317 selected, none judged (R7-01) |
| Scratch worktree of HEAD, `vitest --project elements button.test.ts -t "decision 33"` with the rule removed, with the scoped rule, and with the unscoped rule | figures in § Test quality; the worktree was removed afterwards |

I did not re-run `gate:axe` (the implementer reports 0 serious or critical across 388 story-theme runs), and I did
not compare the 10 regenerated baselines pixel by pixel. `gate:visual` passing confirms only that they match what
HEAD renders. The claim that only labelled controls moved, as a whole, rests on the implementer's measurements in
notes.md:123-148. The commit touches no `icon-only` or `action-row` baseline.

`tdd_check: pass`. The six red commits exit 1 and HEAD exits 0. The base and scaffold sub-checks exit 2 because of
a setup failure in the overlay (R7-03), and that is not held against this phase.

## Earlier findings

- **O3-01 (round 5): resolved.** A one-line labelled `ocelle-button` in a 16 px line, in all seven cases, and the
  test host with and without an icon, have the label's baseline on the text's at 0 px (red at -4.59 to -6.19 px).
  Positions inside the row are unchanged (`rowStart` 0 px, guarded by the `align-items: baseline` plant). The
  convention comment, the README and the CHANGELOG are updated. `ocelle-action-row` was checked and is unaffected.
  Only the 10 baselines that move were regenerated, and the notes list them. The red test is `fix-4`.
- **O6-01 (round 6): resolved.** The rule is scoped to `:not(.bare)`, and `bare` is part of the convention in the
  comment, the README and the plan. The icon-only default, compact and busy buttons keep their icon at the native
  svg's centre (0 px; the unscoped plant moves them 20.5 to 21.6 px). The red test is `fix-5`, with the README lines
  as its red and the plant as the proof of the behaviour case, as planned.

## Verdict

changes_requested. One blocking finding (R7-01): the plant-run record the procedure requires is missing, and it
matters here because the round changed baselines that the visual plants read. The fix itself is correct and well
tested. Once `plants.md` records a `gate:plants -- --affected 48cdc958…` run with exit 0, or the operator decides
that CI's Plants check stands in for it, the phase should be ready to approve.
