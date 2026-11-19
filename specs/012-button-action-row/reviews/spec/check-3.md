---
check: 3
verdict: issues
---

# Spec check 3

Scope: `spec.md` (Draft, 2026-11-13, after the fixes for check 2) and `checklists/requirements.md`, checked against
constitution 1.3.1 (unchanged since check 2), `reviews/spec/check-2.md` and `check-2-fixes.md`, and the tokens in
`packages/tokens/src/source.ts`. No `[NEEDS CLARIFICATION]` marker is left. No requirement conflicts with a
constitution principle (no I/O, no raw style values, no `sk-` names, no monospace, no inline script or style, no
network request).

**Earlier checks.** The three blocking findings of check 2 are fixed as `check-2-fixes.md` says:
- SPEC-2-01: SC-005 is scoped per element. An available row, busy or not, produces exactly one event. A disabled or
  busy button and an unavailable row produce nothing. This matches FR-035 and US4 sc5.
- SPEC-2-02: the "Not activated" definition, FR-003 and FR-033 now cover modifier clicks and the middle click in link
  mode. US3 sc8 and US5 sc6 test them.
- SPEC-2-03: FR-031, FR-036, FR-042, US4 sc8 and US5 sc4 now say that a flush row has no border in any state. Hover
  changes only its surface, and the full current mark is drawn.

The operator answer to SPEC-2-04, "(a) in the description", is recorded in the header and applied in FR-034, US4 sc3,
US4 sc12, US5 sc5 and Key Entities. US4 sc12 also covers the row half of SPEC-2-07.

| ID | Severity | Where | Finding | Fix |
|----|----------|-------|---------|-----|
| SPEC-3-01 | blocking | spec.md FR-036 vs FR-037, US5 sc4, FR-031; FR-042; `source.ts` `color-current` | Two requirements contradict each other for a current row under the pointer. FR-036 says "On hover (and not when unavailable) the row's surface becomes `--ocelle-color-hover-bg`", with no exception. FR-037 and US5 sc4 say a `current` row shows the current mark, which is an `--ocelle-color-accent-low` surface plus the bar. FR-031 says a flush row draws the mark "in full". A hovered current row can satisfy only one of them. This is the main case in US5's navigation list (the pointer rests on the current item). A test written from either requirement fails against a build that follows the other. The contrast pairs depend on the answer. FR-042 lists the current bar only against `accent-low`, and `color-current` declares non-text grounds `chrome`, `rail` and `accent-low` only. If hover wins, the bar sits on `hover-bg`, and that pair is in neither list. | State the precedence for a hovered current row. Option 1: the surface stays `accent-low` and hover changes only the border on `default`, so a flush current row shows no hover change. Option 2: the surface becomes `hover-bg` and the bar stays. In that case, add the pair "current bar against `--ocelle-color-hover-bg`" to FR-042 and to the contrast check. Add the hovered current row to US4 sc8 or US5 sc4. |
| SPEC-3-02 | note | spec.md "Not activated" (Ctrl, Meta, Shift or Alt) vs FR-033, US5 sc1, sc2, sc6, US3 sc8 (Ctrl, Meta or Shift) | The fix for SPEC-2-02 adds Alt to the definition, but the scenarios and FR-033 still list only Ctrl, Meta and Shift. For an unavailable or busy link, Alt is covered by the definition but not tested by a scenario. For an available link row, FR-033 does not count Alt as a modifier, so an Alt-click dispatches the event and the browser default follows. In Chromium on Linux and Windows that default is a download, not the navigation US5 sc1 describes. This continues SPEC-2-10. | Add Alt to US3 sc8 and US5 sc6. In FR-033, state what an Alt-click on an available link row does: the same as the other modifiers (no event, browser default), or a plain click. |
| SPEC-3-03 | note | spec.md "Not activated", FR-003, US3 sc8, US5 sc6 | The guarantee covers clicks only. A busy link-mode button and an unavailable link row keep their `href`: the definition stops only clicks, and FR-003 removes the navigable target only for `disabled`. The context menu's "Open link in new tab" and dragging the link to the tab bar still navigate. FR-003's "cannot be used right now" does not say whether this is acceptable. | Either state it in the README as a limitation beside the capture-phase one, or state that an unavailable or busy link exposes no navigable target while it stays focusable and keeps role `link`. |
| SPEC-3-04 | note | spec.md FR-032 (`layout="row"`: the tags and trailing group moves as a whole to a second line) | No acceptance scenario tests this wrap. US5 sc8 covers card tags only. SC-001 counts only scenarios, so FR-032's row-layout rule has no success criterion. | Add a US4 scenario: in a row narrower than its content, the tags and trailing boxes are on a second line together, and the icon, title and description stay on the first. |
| SPEC-3-05 | note | spec.md US4 sc6 vs FR-031, FR-036, FR-037 | US4 sc6 says a flush row "has no border, no surface fill" when rendered. A flush row that is current or hovered does have a surface. | Limit the scenario to a row with no `current` and no hover. |
| SPEC-3-06 | note | spec.md FR-031 ("No state of a flush row moves or resizes its content"), FR-036, FR-037 | The no-movement rule is stated for `flush` only. For a `default` row, it is not said whether the hover border or the current bar may change the border width or take inline space, which would shift the title. | Extend the sentence to every presentation, or state where the bar sits on a `default` row (over the border, inside the padding). |
| SPEC-3-07 | note | check-2 SPEC-2-05, SPEC-2-06, SPEC-2-07 (button half), SPEC-2-08, SPEC-2-09, SPEC-2-11, SPEC-2-12 | These notes are still open, as `check-2-fixes.md` says. One addition to SPEC-2-08: FR-034 reads "when the host sets `aria-describedby`, that wins and neither slot contributes". Taken literally, a host `aria-describedby` whose ids all fail to resolve leaves the row with no description, not the slotted one. SPEC-2-09 now also touches SPEC-3-01: it is still not said whether an unavailable current row keeps the `accent-low` surface and the bar. | The plan settles each one, or a later spec revision does. For the unresolved `aria-describedby`, confirm the literal reading in the README. |
