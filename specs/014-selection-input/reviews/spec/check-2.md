---
check: 2
verdict: issues
---

# Spec check 2

Inputs read: `specs/014-selection-input/spec.md` (after commit `2acb632`, "fixes for check 1"),
`checklists/requirements.md`, `reviews/spec/check-1.md`, `reviews/spec/check-1-fixes.md`,
`.specify/memory/constitution.md`, `packages/elements/README.md` (§ Slot convention, § Element conventions, "Files and
tests"), #14's text and the related issue summaries (orchestrator scratchpad), 006's spec on
`origin/claude/010-storybook-workbench` (FR-016, FR-025, FR-031) and 008's spec on `origin/claude/016-overlays` (first
consumer). No `[NEEDS CLARIFICATION]` marker is left.

**Earlier check.** The six blocking findings of check 1 are resolved as the fix note says. SPEC-1-01: FR-010, FR-011,
FR-011a, US1 scenarios 11, 14 and 18, US2 scenarios 17 and 18, and US3 scenario 15. SPEC-1-02: US3 scenarios 9 to 11
and FR-029. SPEC-1-03: US4 scenarios 5 and 6, FR-041, FR-042 and SC-006, now observable through the tree and a
MutationObserver. SPEC-1-04: the fixture's `link-target.html` and "Observing navigation". SPEC-1-05: "Handled and
unhandled keys", FR-015, FR-021a, FR-028, US2 scenarios 13 to 15, US3 scenario 13 and US4 scenario 4. SPEC-1-06:
FR-009 index default and US1 scenario 17, US2 scenario 16 and US3 scenario 14. The three operator answers (Q1 (b),
Q2 (a), Q3 (c)) are recorded and carried into FR-046, FR-047, FR-053, SC-007 and US5 scenarios 9 to 13.

Two new rules contradict each other (SPEC-2-01 and SPEC-2-02). The fixes also added two things for the operator to
confirm: an extension beyond the Q2 answer (SPEC-2-04) and a host-timing gap that the first consumer meets
(SPEC-2-03).

| ID | Severity | Where | Finding | Fix |
|----|----------|-------|---------|-----|
| SPEC-2-01 | blocking | spec.md FR-011, FR-011a, US1 scenario 14, US2 scenario 18, US3 scenario 15 | Two rules pick where focus goes when the focused child is removed, and they disagree. FR-011, for all three parents: focus moves to "the enabled child now at its index, else the last enabled child". FR-011a, for tabs and segments: when the selected child is removed, the "next enabled child after it" is selected and "takes focus if the previous child had focus". In tabs and segments the focused child is usually the selected one. Take tabs `A`, `X` (selected, focused), `C` (disabled), `D`, `E`, and remove `X`. FR-011 sends focus to `E`: the child now at index 1 is `C`, which is disabled, so the last enabled child is chosen. FR-011a selects `D` and gives it focus. Focus and selection end up apart, or a test can expect either. US1 scenario 14 also says "the option now at its index (or the last)" without "enabled". | Use one rule for the focus target. The simplest: "the next enabled child after it in document order, else the nearest enabled child before it", for all three parents, in FR-011 and US1 scenario 14. State that for tabs and the segmented choice, focus and selection land on the same child. |
| SPEC-2-02 | blocking | spec.md FR-010, US1 scenario 18 | In the listbox a disabled option can stay selected (US1 scenario 18: `gamma` disabled, `value` stays `"gamma"`). Now let a host set `listbox.value = "gamma"`. Two clauses of FR-010 apply. "Setting the current value changes nothing" keeps the selection. "A value no enabled child has … on the listbox, clears the selection" clears it. A test of this set can expect either outcome. | State which clause wins when the current value names a disabled selected option. For example: "setting the current value is always a no-op, even when its child is disabled". Add that case to US1 scenario 18. |
| SPEC-2-03 | operator | spec.md FR-010, FR-021, FR-027, US1 scenario 11; Consumer need (folder picker); 008 spec "First consumer" | The spec does not say what happens to a `value` set before the matching child exists. A framework host often sets the parent's property before it renders the children, and the folder picker of #16's Open project dialog fills its list after reading the folders. Under FR-010 as written, the listbox clears its selection, so the host's value is lost. Tabs and the segmented choice ignore the value and later fall back to the first enabled child. Server-rendered markup is not affected, because the children are parsed before the module script runs. | Operator: answer Q1 below. Then state the rule in FR-010 and add a scenario: set `value`, then append the matching child. |
| SPEC-2-04 | operator | spec.md FR-046, US5 scenario 13; check-1-fixes.md SPEC-1-08 | The fix went beyond the operator's Q2 (a) answer, and the fix note invites this check to challenge it. Without `href`, Ctrl, Meta or Shift on a click or Enter is a plain activation, which emits and lets the host route in place, and a middle click emits nothing. The `detail` (`{ href }`) carries no modifier keys. So a Kitty Dashboard user's Ctrl-click on a host-routed link, which in a browser means "new tab", routes in place, and the host cannot tell the difference. This is a product choice the operator has not made. | Operator: answer Q2 below. Then align FR-046 and US5 scenario 13. |
| SPEC-2-05 | note | spec.md US5 scenario 11, "The strict-CSP fixture" | `<base href="kitty-app://app/">` also changes how the fixture's own relative URLs resolve. Those are the module script, the stylesheets, the vendored font and `link-target.html`. If the base is in the markup from the start, the element never loads, and the scenario passes for the wrong reason: no navigation, but no event either, so the pairing catches it only if the event is asserted first. It is also not shown that Chromium accepts a custom-scheme base URL. | The plan states how the base is applied, either inserted after load or with the fixture's resources at absolute URLs. It confirms that the document base becomes `kitty-app://app/` before the activation, by reading `document.baseURI`. |
| SPEC-2-06 | note | spec.md US5 scenario 12, FR-057 | The `file:` case may not be able to load the element at all. Chromium blocks module scripts loaded from a `file:` page, because the origin is `null` and module loads need CORS. Without `--allow-file-access-from-files` the import fails. How CSP `'self'` behaves under a `<meta>` policy on a `file:` document also needs checking. The spec already sends a failure to the operator. This note names the likely cause, so the plan checks it first. | Plan: try loading the browser build from a `file:` page under the meta policy in the pinned runner first. If the only way is a launch flag or a classic script, raise it then. |
| SPEC-2-07 | note | spec.md FR-046, US5 scenario 13 | FR-046 makes Alt-only a plain activation, which emits and then navigates. In Chromium on Linux and Windows, Alt-click on an `<a href>` downloads the target and does not navigate. If the element leaves navigation to the browser's default action, as SPEC-1-22 suggests for constitution I, an Alt-click starts a download, and "the page navigates" fails. | State the expected outcome of an Alt-click with `href`: navigate in place, or keep the download as a browser behaviour, as with Ctrl and Shift. Add it to scenario 13. |
| SPEC-2-08 | note | spec.md FR-046, FR-047, "Observing navigation" | Two `href` forms have no stated outcome. `href=""` resolves to the document itself, so under FR-047 the page reloads. `href="#section"` is a same-document fragment navigation: the marker stays, so by "Observing navigation" it reads as "does not navigate", although the URL changes. In-text links to a section are common in running text. | State whether an empty `href` counts as "with `href`", and the outcome of a fragment `href`, including how it is observed (URL hash and scroll, marker kept). |
| SPEC-2-09 | note | spec.md FR-010, FR-031, FR-046, FR-055 | Three attributes do not say whether they reflect: the parents' `value` (listbox, tabs, segmented choice), the copy field's `value`, and the link's `href`. The link also does not say whether `href` is a property. Reflection is observable. For example, after a user selection, does the `value` attribute change? If a framework writes the old attribute value again, it causes no attribute change, so the selection is not restored. FR-055 also needs the attribute and property list. The spec also does not say whether the parent's `value` already holds the new value when a listener reads it during the `-change` event. | State reflection and property existence for each, as FR-009 does for children. State that `value` is updated before the change event is dispatched. |
| SPEC-2-10 | note | spec.md FR-033, FR-055 | "Showing `ocelle-icon name="copy"` through the slot convention" does not say whether the copy field has a public `icon` slot, with the copy icon as fallback content, or renders the icon itself and has no slot. Under the README's slot convention, a slot is public surface, and FR-055 lists it. | State the copy field's slot list: none, or `icon` with the copy icon as default content. |
| SPEC-2-11 | note | spec.md US4 scenario 4, SC-001, "Handled and unhandled keys" | SC-001 reads the keydown's `defaultPrevented` for Enter and Space on the Copy control. US4 does not say whether those keys are "handled". On a native `<button>`, neither keydown has its default prevented: Space activates on keyup, and the button's own default stops the page from scrolling. A test that expects "handled" fails on a correct native button. | State, for the Copy control, that Enter and Space activate the button with the native button's key behaviour, with no `defaultPrevented` claim, and that Space does not scroll the page. |
| SPEC-2-12 | note | spec.md US4 scenario 6, FR-041, SC-006 | A host listener that sets `status` synchronously inside `ocelle-copy-field-request` clears the region and fills it again in the same task. The MutationObserver records both changes, so the scenario passes. The accessibility tree may still see no change between two snapshots, and a screen reader may not repeat the same text. The test proxy holds while the user need ("a host's new status is a new live-region change") may not. | Let the plan state whether the clear must reach the tree before the host's set (for example, the event dispatched after a frame), or record this limitation in the README. |
| SPEC-2-13 | note | spec.md Edge Cases (reduced motion) | "None of these elements animates … beyond the token durations" does not say whether any element animates at all. If none does, the case is empty. If one does, the case does not say which property animates. | State that no element animates, or name the animated property and the duration token. |
| SPEC-2-14 | note | check-1.md SPEC-1-13, -14, -15, -16, -19, -20, -22 to -27 | These notes are still open and unchanged in the spec. Two of them would fail a gate if the plan leaves them out. SPEC-1-16 concerns the axe `target-size` rule: 006 FR-016 runs every `wcag22aa` rule, so short option or tab rows fail FR-051. SPEC-1-14 concerns the border of the copy field on `--ocelle-color-inset`: `color-control-border` there is 2.80:1. The plan must also decide the selected background token and the contrast pair for the bar (SPEC-1-13). Still open as well: the scenario and story for the `icon` slot, long labels, children's hover paint, and tabs or a segmented choice with no children (SPEC-1-15); the unnamed copy-field group (SPEC-1-19); the part surface after the `ocelle-button` swap (SPEC-1-20); the navigation mechanism for constitution I (SPEC-1-22); the focused-state stories (SPEC-1-23); which box scrolls in the listbox (SPEC-1-24); unpaired tabs (SPEC-1-25); "light DOM it owns" in US2 scenario 12 (SPEC-1-26); and "flicker" and SC-009 (SPEC-1-27). | The plan answers each in its decisions or research, or the next spec fix closes them. |

## Operator questions

- **Q1 (SPEC-2-03). A host sets a parent's `value` before a child with that value exists, for example a folder list
  filled after it is read. What happens?**
  (a) Nothing is kept. The listbox clears, and tabs and the segmented choice keep or fall back as FR-010 says now. The
  README tells hosts to set `value` after the children are in place.
  (b) The parent remembers the last value the host set. When a matching enabled child appears, the parent selects it,
  with no event. Until then the listbox's `value` reads `""`, and tabs and the segmented choice show their current or
  first enabled child. The parent forgets the value on the next user selection or host set.
  (c) As (b), but the parent remembers the value only until the first child is connected after the set. Children
  added later never take it.
- **Q2 (SPEC-2-04). How does `ocelle-link` without `href` treat a modified activation (Ctrl, Meta or Shift held, or a
  middle click)?**
  (a) As the spec says now: Ctrl, Meta or Shift is a plain activation and emits, and a middle click emits nothing.
  (b) Every modified activation, middle click included, emits nothing, as with `href`. The host routes only plain
  activations.
  (c) Every activation emits, and the `detail` gains the modifier keys and the button (`{ href, ctrlKey, metaKey,
  shiftKey, altKey, button }`), so the host decides. With `href` the Q2 (a) rule stays.

## Counts

- blocking: 2 (SPEC-2-01, SPEC-2-02)
- operator: 2 (SPEC-2-03, SPEC-2-04)
- note: 10 (SPEC-2-05 to SPEC-2-14)
