---
phase: 1
round: 1
verdict: approved
base: dd69835e5500a7bf0757b43e542f8d9dc978953f
head: 9b06a62d61fe6d0e6ae5abb340bf4810d4399888
tdd_check: pass
---

# Phase 1 review, round 1

Change under review: `git diff dd69835..9b06a62` (no uncommitted change). Source: `focusable.ts`, `ocelle-button.ts`,
`icon-slot.ts` (comment), README, CHANGELOG. Tests: `test/scenarios/{dialog,drawer,button}.ts`, `test/button.test.ts`,
`test/fixtures/shadow-controls.ts`. Judged against spec.md, plan.md and tasks.md as amended by the operator's
decisions 1 to 9 (`operator-decisions.md`).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | ops/022-focus-trap-details-icon-name/spec.md:67, :131 | The spec still says scenario 2 (Shift+Tab from the close control to the summary) fails on main, and SC-001 lists it among the red rows. The red run shows it passes on main (`red-phase.log` lists only the Tab rows of the two closed-`details` cycles; `notes.md` § Red run explains why: `#tryFocus` over the reversed stops skips the hidden link). The row exists and pins the behaviour, so the scenario is covered; only the spec's red claim is stale. | Optional: correct the sentence and SC-001 in a later docs touch, citing the measurement. |
| R1-02 | note | ops/022-focus-trap-details-icon-name/reviews/phase-1/notes.md:229 | The notes say the two mutation pins "pass on main's naming too ... so they are pins, not red rows". `check-final-tests-on-base.log` shows the `label=` / host `aria-label` pin fails on base (in process and on the fixture), on the `image` node, which main still has. Only its name part holds on main; the forwarded-icon pin does pass on base. No effect on the verdict: the row is stricter, not weaker, and was added with the green commit as a pin. | None required; the record could say "the names hold on main; the row fails on main on the image node". |
| R1-03 | note | packages/elements/src/focusable.ts:59 | The equivalent-mutant record `EqualityOperator,ConditionalExpression` also disables the `<= 0`/`false` mutants of that line, which are not equivalent. The record says so and why they would be killed (every Tab cycle row), and Stryker cannot disable single replacements, so this is honest; the reason for `>= 0`/`true` is true (CSSOM gives empty client rects only without a box, and `checkVisibility()` is false then). | None. |
| R1-04 | note | packages/elements/README.md:1037 | "slotted icons never contribute to `ocelle-button`'s name" is unconditional, while spec.md § Edge Cases records that an icon-only button with no `label` and nothing on the host is still named from its content in Chromium 156 (`Folder`), with axe `button-name` (critical). The README's icon bullet tells hosts to name such a button with `label`, and the wording keeps the `readme.test.ts` pin as plan.md asks, so this is a host-mistake case, not a broken promise for a correctly named button. | Optional: scope the sentence to a button with a label when the README is next touched. |

No blocking finding.

## Test quality

- **Red evidence.** `tdd-check.json`: `pass`, red commit `d820f00` (`phase`, exit 1), final tests on base exit 1, head
  exit 0, no problems. `red-phase.log` (red commit, Chromium 153): 17 failures; 12 are the op's rows, each on the
  missing behaviour (dialog and drawer Tab paths with `body` where the close control is expected; button scenario 6
  name `Folder Open` and `image` node; scenario 7 `image` node). The other 5 are the docker-bound
  `gates/test/integration/visual.test.ts` rows, unrelated and failing without docker. `red-widen.log` (`f5b0bdf`) and
  `red-slot.log` (`3f86a0c`), both in clean worktrees on Chromium 156, show the scenario 7 link-mode row and the
  scenario 9 rows failing on the `image`/`Folder` nodes and the name `Folder Open`, not on setup; scenario 10 passes
  there as planned. These two logs are not in `red-commits`, by operator decision 5 (and 8 for the slot red).
  `check-final-tests-on-base.log` shows the final suite fails 18 rows on base, all op rows, so every new red row is
  red against base at HEAD's test files.
- **Test-only commits.** `d820f00`, `f5b0bdf` and `3f86a0c` each change only test scenario files (checked with
  `git show --stat`).
- **No weakening.** `git diff d820f00..HEAD -- packages/elements/test` has no removed line in a scenario file; the
  only removed lines are in the header comment and import of `test/button.test.ts` and the fixture header comment,
  which are extended. No existing button, link, dialog or drawer row changed; no `skip`/`only`.
- **Assertions.** Every new row returns the observed role and name, the filtered `image` and `Folder` nodes and
  `severe(driver)`, compared by `toEqual` with a fixed expected value; no conditional or snapshot-only assertion, no
  mock. The dialog rows assert the start, the full Tab/Shift+Tab path and that the dialog is still shown.
- **Coverage of the story.** Scenarios 1, 2, 4, 5 (`detailsRows`, both directions), 3 (drawer `inheritedRows`), 6, 7
  in both modes, 8, 9 and 10 in both modes each have a row. Scenarios 4, 5, 8, 10 and the Shift+Tab rows (see R1-01)
  are pins passing on main.
- **Scaffold.** No `scaffold.sha`.
- **Mutation.** `pnpm run gate:mutation -- --base dd69835...`: exit 0, "43 mutants on the changed lines of 3 files,
  none survived; 0 timeouts, 2 compile errors, 1 zero-mutant entry; 1 equivalent record". The compile errors
  (`#labelledBy` body emptied, `"aria-labelledby"` literal emptied) and `icon-slot.ts` zero mutants (comment only) are
  reports. The one record is read in R1-03; its reason is true. The two survivors of the implementer's first run
  (`flatten`, `#name() === undefined` to `true`) are killed by the added pins `forwardedIconScenarios` and the
  `label=`/`aria-label` row.

## Checks run

All locally, at HEAD `9b06a62`, under operator decision 9 (CI-first):

- `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:manifest`, `gate:config-copies`,
  `gate:csp`, `gate:prefix`, `gate:pins`, `gate:signoff -- --range dd69835..HEAD` (12 commits): each exit 0, no
  finding.
- Browser suites the phase changes, in process and on the strict-CSP fixture (`--project elements --project
  elements-browser`, button, dialog and drawer): `Test Files 6 passed (6)`, `Tests 1826 passed (1826)`, exit 0.
- `gate:mutation -- --base <base>`: exit 0 (above).
- Full `pnpm test` at the tested head: `check-head.log` (the pre-review check) reports `7815 tests passed in 233
  files`. Not rerun by the reviewer (decision 9).
- **Plants.** `plants.md` base equals `base.sha`; recorded exit 0. `gate:plants -- --affected <base> --list` selects
  the same 21 plants as the record's `note: affected:` lines (identical sorted lists). The record ran with
  `--skip-container`: 16 judged, the 5 visual plants not run because no podman is available here; by decision 9 they
  and the full visual run are left to CI's required checks. No podman cross-check was possible.
- **Tasks.** T001 to T015 are all ticked and their work is present. `overlay.ts`, `ocelle-action-row.ts`,
  `custom-elements.json`, `storybook/` and `gates/` are untouched (`git diff --stat` empty). The op documents
  (`op.md`, `spec.md`, `plan.md`, `tasks.md`, `operator-decisions.md`) changed by the operator's recorded amendments.
- **Constitution.** I: no new name, attribute, slot, part or event; manifest gate clean. II: no style change. III: the
  new `aria-labelledby` relation is set by element reflection between two nodes of one shadow root (`.label` of the
  same render root), so no ID reference crosses a shadow root; the Tab cycle now wraps at its real end; axe is `[]` on
  every new row; the icon plus one-character label case is a recorded known limitation (README, CHANGELOG, spec) on
  no story, per decision 7. IV: one attribute, one listener and a reflection assignment; csp gate clean. V: no visual
  change, no story or baseline. VII: patch, CHANGELOG `### Fixed` with both entries of plan.md. VIII: above.
- **Plan.** `rendered()` keeps its two conditions first and adds `checkVisibility()`; `ocelle-button` follows
  *Icon name*: `aria-hidden` wrapper, `@slotchange` on the icon slot with `assignedElements({ flatten: true })`, a
  private field and `requestUpdate()`, and the relation in `updated()` in the planned order. Action-row measured
  (`notes.md`, `Folder Open project` in both modes) and left unchanged, for a follow-up issue (decision 2).

## Earlier findings

None: this is the first round.
