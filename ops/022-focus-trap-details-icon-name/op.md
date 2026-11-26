---
op: 022
triage: triage/022-focus-trap-details-icon-name.md
issues: [57]
mode_of_work: task_execution
accountable: "human:jeroennouwsdev"
semver: patch
status: started
---

# Op 022: The focus trap skips a closed `<details>`, and a button's icon adds nothing to its name

## Intent

Issue #57 reports two accessibility defects in `@ocelle/elements`. Mission 020's squad found both and left them for
a separate op. This op fixes both in one phase, red first:

1. **Focus trap.** `rendered()` in `packages/elements/src/focusable.ts` checks only `getClientRects().length` and the
   computed `visibility`. Chromium hides the panel of a closed `<details>` with `content-visibility`, so a link in
   that panel keeps a client rect and `visibility: visible`. The walk counts the link as a stop. In an
   `ocelle-dialog` or `ocelle-drawer` whose last control is a closed `<details>`, Tab from the summary then runs
   natively and focus lands on the page body (measured by mission 020). The fix: `rendered()` also requires
   `element.checkVisibility()`. Tab from the last real stop then wraps to the first stop.
2. **Icon name.** `ocelle-button` renders its `icon` slot in `<span class="icon-slot">` with no `aria-hidden`. A
   bare `<svg>` that holds a `<title>`, slotted as the icon, can get an `image` node and add its title to the
   button's name. The fix (operator, Q1 A): `aria-hidden="true"` on `ocelle-button`'s icon wrapper. This is the
   pattern `ocelle-action-row` already uses on its trailing wrapper (`ocelle-action-row.ts:664`). Phase 1 measured
   that this alone is not enough in Chromium 153: the `image` node goes, but the slotted svg's `<title>` still adds to
   the name computed from the content (`Folder Open`). So the fix is widened (operator, phase-1 decision 1): when
   nothing on the host names it, the inner control is also named from its label wrapper by `aria-labelledby` inside
   its own shadow root. Chromium 156 gave the same `Folder Open` with `aria-hidden` alone, and relating every
   content-named button turned 14 existing rows red on axe's `label-content-name-mismatch` for one-character content,
   so the relation is set only when the icon slot has assigned content (phase-1 decision 7). An icon beside a
   one-character label is a recorded known limitation. The fix does not change the slot convention as a whole.

The op also **measures** `ocelle-action-row`'s icon wrapper (`ocelle-action-row.ts:647`, no `aria-hidden`) and
reports the result to the operator (Q2 A). It does not change that wrapper. Phase 1 measured the same gap there (the
inner control is named `Folder Open project` in the button and the link mode); the operator decided that it is a
follow-up issue, not part of this op (phase-1 decision 2).

No element, attribute, event, slot, part or token is added or changed. The behaviour moves toward what the README
already promises, so the change is semver **patch**, with a `### Fixed` entry in `packages/elements/CHANGELOG.md`.

**Issue text.** The triage session could not read #57 on GitHub. This record relies on the operator's brief and on
mission 020's research notes (`triage/022-focus-trap-details-icon-name.md` § Issues read).

### Operator decisions at approval (2026-11-20, operator jeroennouwsdev)

- **Q1: A.** The icon fix is `aria-hidden="true"` on `ocelle-button`'s icon wrapper, the same pattern as
  `ocelle-action-row`'s trailing wrapper. It is not a convention-wide change.
- **Q2: A.** The op measures `ocelle-action-row`'s icon wrapper (around `:647`) and reports the result. It does not
  fix it unless the operator later decides so.
- **Standing constraints.** One phase. Both fixes test-first, with the story's tests in the phase's red commit.
  Patch-level, with a `### Fixed` entry in `packages/elements/CHANGELOG.md`. Keep the op small. Visual baselines, if
  any were needed, are produced only in #10's pinned container under docker; none are expected. Plants run locally
  with `gate:plants -- --affected <base>`. Every commit is signed off.

### Operator decisions in phase 1 (2026-11-20, `operator-decisions.md`)

1. **Icon fix widened.** `ocelle-button`'s inner control is named from its label wrapper inside the shadow root
   (`aria-labelledby`), and `aria-hidden` stays on the icon wrapper. Patch; no new public API. Covered with a text
   label and with `label` alone, in the button and the link mode.
2. **`ocelle-action-row` is a follow-up.** `ocelle-action-row.ts` stays unchanged; the gap is reported for a separate
   issue.
3. **Uncommitted green work.** The implementer's stashed work is restored and finished on top of the amended
   artifacts.
4. **Docker.** dockerd is started before the next check run, so the visual integration rows run.
5. **Red record for scenario 7's link-mode row.** Logged as `reviews/phase-1/red-widen.log`, not added to
   `red-commits` (commit `f5b0bdf`).
6. **Chromium 156.** Scenario 6 was re-measured on 156 with `aria-hidden` alone first; it still gives `Folder Open`.
7. **Relation only with an icon.** The inner control is named from `.label` by `aria-labelledby` only when the icon
   slot has assigned content and no host `aria-labelledby`, `aria-label` or non-blank `label` names it; the relation
   follows the icon slot after the first render. An icon beside a one-character label (axe
   `label-content-name-mismatch`, incomplete, serious) is a known limitation in the spec, the README and the
   CHANGELOG. Existing rows are not loosened. One phase.

## Acceptance

Checks 1 and 2 are browser scenario rows, committed red in one test-only commit. Each one fails on main for the
stated reason. Check 3 rows go in the same commit and pass on main; they pin that the fix hides nothing else.

1. **Closed `details` at the end of a dialog (red, `test/scenarios/dialog.ts`; the drawer inherits the row).** The
   dialog body is a button `b1` and then a closed
   `<details id="d"><summary id="s">More</summary><a id="l" href="#x">Hidden link</a></details>`, with no footer.
   Tab from the summary gives the close control and then `b1`. Shift+Tab from the close control gives the summary.
   The dialog stays open. On main, Chromium puts focus on the body after Tab from the summary, because the walk
   counts the hidden link as the cycle's last stop.
2. **Titled bare svg in `ocelle-button`'s icon slot (red, `test/scenarios/button.ts`).** With
   `<svg slot="icon" viewBox="0 0 16 16"><title>Folder</title>…</svg>`:
   - `<ocelle-button id="b">Open</ocelle-button>`: the inner control's name is `Open`, and the button's
     accessibility subtree has no `image` node and no node named `Folder`.
   - `<ocelle-button id="b" label="Open project">` with no default-slot text: the name is `Open project`, and there is
     no `image` node.

   Both cases hold in the button and the link mode (`href="#x"`). On main the subtree has an `image` node named
   `Folder`, and in the first case the name includes `Folder`. The red commit `d820f00` holds the first case in both
   modes and the second in the button mode; the second case in the link mode is added in a second test-only commit
   (`f5b0bdf`) before the source change (phase-1 decision 1). A third test-only commit, before the source change,
   adds an icon moved into the icon slot after render (named `Open`, no `Folder`; red on main) and an icon moved out
   beside the text `S` (named `S`, axe clean; passes on main), in both modes (spec.md scenarios 9 and 10, phase-1
   decision 7). If the
   row passes on main, the icon half of the op is **none**: the record says so, and the operator is told.
3. **Non-regression (pass on main and after; in the red commit with checks 1 and 2).** The same closed `details`
   followed by a footer button `f1`: Tab from the summary gives `f1`, because native Tab skips the hidden link between
   two real stops. An open `<details>` at the end: Tab from the summary reaches the link, and the cycle wraps after
   it. A button with an `ocelle-icon` slotted as the icon keeps its name from its label. Every existing dialog,
   drawer and button row stays green. That covers the Tab cycle, the scroller, opaque-content and radio rows, which
   all go through `rendered()` at both call sites.
4. **Mutation (gate).** `gate:mutation` over the changed source kills the mutant that removes the
   `checkVisibility()` condition. If Stryker generates a mutant for the template's `aria-hidden`, that mutant is
   killed too, and so are the mutants of the label-wrapper relation in `updated()`, of its icon condition and of the
   icon slot's `slotchange` listener (plan.md *Test approach*). Any survivor is killed with a stricter test or recorded as equivalent with a true reason.
5. **Action-row measurement (record, not a test).** A probe (not committed as a test) slots the same titled svg into
   `ocelle-action-row`'s `icon` slot. It records the row's inner control name and whether the svg has an
   accessibility node. The result goes in `reviews/phase-1/notes.md` and in the phase report, as a follow-up issue
   (phase-1 decision 2).
6. **Docs (record, no test).** `packages/elements/README.md`: the dialog's **Focus** paragraph says the content of a
   closed `<details>`, apart from its summary, is not a stop. The drawer inherits this sentence (it refers to the
   dialog's focus behaviour). The button's icon-slot bullet, the controls' **Name order** item and § Slot convention
   say that an icon slotted into `ocelle-button` is decorative and adds nothing to the button's name, which comes from
   the default slot's text when nothing on the host names it; they make no such promise for `ocelle-action-row`. The
   icon-slot bullet also records the known limitation (an icon beside a one-character label: axe
   `label-content-name-mismatch` needs review; the name is correct). `src/icon-slot.ts`'s comment sentence "No
   generated content, so the control's name is its label's" is corrected to say where the guarantee lives.
   `packages/elements/CHANGELOG.md` § Unreleased gets `### Fixed` with one entry per defect; the `ocelle-button`
   entry names the known limitation.

## Constitution principles touched

- **III Accessible by construction.** Both fixes restore the keyboard model and accessible name of existing
  elements: the modal Tab cycle wraps at its real ends, and the button's name is its label. The new
  `aria-labelledby` relation stays inside one shadow root and is set only when an icon is slotted, so no existing row
  or story gains an axe result; the icon and one-character label case is a recorded known limitation (no story has
  it).
- **VII Semantic versioning.** No surface changes. The custom-elements manifest is unchanged, so this is a patch,
  with a CHANGELOG entry.
- **VIII Test-first, proven non-vacuous.** One test-only red commit, which `red.sh 1 phase` records. Each red row
  fails on main for the missing behaviour, and mutation testing covers the changed lines.
- **I, II, IV, V, VI.** Not touched. There is no new element, token, inline style or network use. There is no
  visual change, so no story or baseline changes.
