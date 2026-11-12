---
triage: 008
issues: [16]
decision: mission
target: "overlays"
in_scope: [16]
out_of_scope: [1, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 23]
semver: minor
spec_prompt: "Build issue #16 (triage/008-overlays.md) in @ocelle/elements, following mission 005's element conventions (README § Element conventions, manifest gate): `ocelle-dialog` and `ocelle-drawer` on native `<dialog>` with `showModal()`, user-agent background, colour and border reset to tokens (spec-kitty-design#503), backdrop on `--ocelle-color-overlay`, the dialog sized by `--ocelle-dialog-max-inline` / `--ocelle-dialog-max-block` and raised by `--ocelle-elevation-raised`, focus moved in on open and returned to the opener on close, Escape closes, a close control using `ocelle-icon name=\"close\"` named on its inner button, the drawer serving #12's narrow-width personal drawer (spec-kitty-design#450) and kitty-mission-ui's flyouts, the Open project dialog (with #14's `ocelle-listbox`) as first consumer; and `ocelle-tooltip` meeting WCAG 1.4.13 (dismissible with Escape, hoverable, persistent while hovered or focused, never the only carrier of essential information) for #12's `ocelle-nav-item` icon-only bubble and #7's `ocelle-pill-tag` ellipsis, with no ID reference crossing a shadow root; `ocelle-<element>-<action>` events with payloads and cancelability, reduced motion, forced colours, a tooltip stacked and dismissed correctly inside a dialog or drawer; decide at clarify the tooltip's platform basis against the Chromium 120 / WebKit 16.4 floor (raised only by operator decision), whether the drawer is modal-only, and any new token (drawer inline size, tooltip delay or offset) added to @ocelle/tokens with its validation; done when #7's checklist holds (a story per variant and state with light and dark baselines, interaction tests for every event and payload, keyboard and screen-reader tests, axe with no serious or critical finding, manifest entries, strict-CSP check) plus focus-management tests for open and close, with top-layer content captured per #10's FR-012; the consumers' elements (#7, #12, #14) stay in their issues."
status: proposed
---

# Triage 008: Overlays: ocelle-dialog, ocelle-drawer, ocelle-tooltip (#16)

## Issues read

- **#16** (open), "Elements: overlays — ocelle-dialog, ocelle-drawer, ocelle-tooltip". Parent: epic #1. No comments.
  Read from the body as fetched by the orchestrator through the GitHub tools (scratchpad copy of #16 and every
  sub-issue of #1). What it asks, quoted:
  - Why: "Spec Kitty has no overlay primitives, so consumers cannot reset native `<dialog>` chrome under token-only
    lint rules (spec-kitty-design#503)."
  - `ocelle-dialog` and `ocelle-drawer`:
    - "Built on native `<dialog>` with `showModal`; user-agent background, colour and border reset to tokens."
    - "Focus moves in on open and returns to the opener on close; Escape closes; the backdrop uses tokens."
    - "The drawer serves the app shell's narrow-width personal drawer (#450) and kitty-mission-ui's flyouts."
    - "kitty-mission-ui's Open project dialog is the first consumer (with `ocelle-listbox`)."
  - `ocelle-tooltip`:
    - "Meets WCAG 1.4.13: dismissible with Escape, hoverable, persistent while hovered or focused; never the only
      carrier of essential information."
    - "Used by `ocelle-nav-item`'s icon-only mode and `ocelle-pill-tag`'s ellipsis."
  - Done when: "Same checklist as the actions issue, plus focus-management tests for open and close." The actions
    issue is **#7**, whose checklist is: a story per variant and state with visual baselines in light and dark;
    interaction tests asserting every emitted event and its payload; keyboard and screen-reader behaviour tested, axe
    with no serious or critical finding; the custom-elements manifest listing every public property, event, slot and
    part; built output passing the strict-CSP check.
  - `#450`, `#503` refer to spec-kitty/spec-kitty-design issues (the issue's footnote).
- Also read, as siblings under #1: #7, #8, #9, #10, #11, #12, #13, #14, #15 (open) and #2 to #6, #17 (closed), for
  references to the three elements and for any other popup or top-layer surface.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #16 | issue (open) | in scope | This mission: three named elements and the checklist above. |
| #1 | epic (open) | out of scope | Parent of #16. #11 ties v1.0.0 to "every row of the gap table in #1". |
| #12 | issue (open) | out of scope; **blocked by #16** | `ocelle-app-shell`: "A **personal drawer** pattern for the no-team-context state at narrow widths (#450), using `ocelle-drawer`." `ocelle-nav-item`: "a compact icon-only mode that keeps the accessible name and shows the label in a bubble on hover and focus (#500)", the tooltip consumer #16 names. #12's `ocelle-top-bar` has "a menu button"; whether it opens the drawer is #12's design, not this one. The shell, top bar and nav item stay in #12. |
| #7 | issue (open) | out of scope; **blocked by #16** (pill-tag ellipsis only); **defines #16's done-when** | `ocelle-pill-tag`: "Interactive variant with a native button inside, the pill look, shared ellipsis with full text as tooltip, focus ring (#524)." The rest of #7 does not need overlays. #7's "Done when" is #16's checklist by reference. If #7 is specified first, it must not hand-roll a tooltip (constitution VI). |
| #14 | issue (open) | out of scope; **related** (first consumer composes it) | `ocelle-listbox`: "First consumer: the folder picker in kitty-mission-ui's Open project dialog." #16 names the same dialog as its first consumer "with `ocelle-listbox`". The listbox is an **inline** list inside the dialog, not a popup: it brings no second top-layer surface. Neither blocks the other; a story composing dialog and listbox belongs to whichever lands second (see *Risks* 5). `ocelle-copy-field` is request-only and "lets the host ... report the outcome in its own words" (#534): no "Copied" bubble, so no tooltip need. |
| #8 | issue (open) | out of scope; **related** | No overlay surface. `ocelle-personal-rail` "Works with the personal drawer of the app frame (#450)": the rail's content may sit in #12's drawer, so the drawer must not constrain slotted content width (see base-styles row) and must accept chrome grounds. No shared machinery to move here. |
| #9 | issue (open) | out of scope | No overlay surface: `ocelle-form-select` is "A native-select-based element", so its popup is the user agent's, not a custom listbox; `ocelle-notice` is a live region. Shares only the shadow-root ARIA rule ("no ID reference crosses a shadow root (ADR-0078, D5)") the tooltip also faces. |
| #15 | issue (open) | out of scope | No overlay surface. `ocelle-scroller` (region, tab stop only while overflowing) is the pattern `ocelle-code-block` reuses; dialog content that overflows may reuse it, a plan detail, not a dependency. |
| #13 | issue (open) | out of scope | `ocelle-disclosure` is inline (`<details>` or a button with `aria-expanded`); no overlay. |
| #10 / branch `origin/claude/010-storybook-workbench` / `specs/006-storybook-workbench` | mission, **not merged** | **blocks** (stories, baselines, axe only) | #10: "One story per element per variant and state, in light and dark ... axe checks run on every story ... each element issue adds its own stories." Its design (006) is final on that branch; US1 scenario 15 / FR-012 captures a story that "opens a top-layer surface (a popover, a dialog)" with that content, which this mission needs. Spec and plan can proceed now; the story, baseline and axe phase is written against #10's harness and starts after #10 merges. |
| #17 / PR #26 / `specs/005-icons-brand-mark` | mission, merged (`476602e`) | out of scope (done); **conventions apply** | #17 lists "close" in the icon set; `packages/elements/README.md` § Icons gives `close` the need "closing a dialog or drawer and dismissing (#16)". "An icon-only control gets its name from the control, not the icon" applies to the close control. Element conventions (Lit 3, `define()`, token-only styles, forced-colours rule, manifest gate, engine floor) apply. |
| #23 / PR #25 / `specs/007-mutation-gate-strictness` | mission, merged (`e7d7d54`) | out of scope (done); applies | Stricter mutation verdicts apply. Hover and focus timing code invites Timeout mutants; plan for kills that decide. |
| #11 | issue (open) | out of scope; **blocked by #16** | "Blocked by: #4 and every element issue (#7, #8, #9, #12, #13, #14, #15, #16, #17)." Changelog entries for `@ocelle/elements` (and `@ocelle/tokens` if a token is added). |
| #5 (closed) / `packages/tokens/src/source.ts` | tokens, merged | applies | `color-overlay` ("dialog backdrop"), `dialog-max-inline` / `dialog-max-block` ("viewport minus two gutters"), `motion-fast`, `motion-base` (0 ms under reduced motion), `easing-standard` exist. #5: "Shadows only for the dialog (`elevation-raised`)". No drawer width or tooltip token exists yet. |
| #3 (closed) / constitution III | constitution | applies | "ID-referenced ARIA does not cross shadow roots, so labelled or described primitives use light DOM or `ElementInternals`" (#3); constitution III: tooltips meet WCAG 1.4.13, dialog keyboard model, reduced motion, axe clean. |
| constitution I, IV, V | constitution | applies | Events `ocelle-<element>-<action>`, bubbling and composed; no I/O; no inline style under CSP (tooltip positioning must not write a `style` attribute); interaction tests for every event and keyboard path. |
| `packages/elements/README.md` § Engines | conventions | applies; **design question for the tooltip only** | Floor Chromium 120 / WebKit 16.4. #16 fixes the dialog and drawer on `<dialog>` + `showModal()`, inside the floor. The tooltip's basis is not named by #16: the Popover API needs WebKit 17, CSS anchor positioning Chromium 125 / WebKit 26. |
| `packages/styles/README.md:171-172`, `specs/003-base-styles` FR-017 | base styles, merged | applies | Prose in a `<dialog>` or side drawer without a definite width shrinks to fit and its table becomes a tab stop; dialog and drawer give their content box a definite inline size, proven by a story with prose inside. |
| `knowledge/speckit-flows/findings/frontend-missions.md` | findings | applies | Measure layout fixes in the top layer (dialogs, drawers), not only in block flow. |
| `specs/001` to `003`, `005`, `007`, `ops/004` | repository | none to fold into | All merged; nothing in progress covers overlays. `specs/006` (unmerged) is the harness and excludes element stories. |
| `triage/` | repository | none | No other record covers #16. No triage 009 or later exists on any branch of this repository at the time of writing. |

## Decision

**mission.** Several rules each require it, from #16's own text:

- **New public surface:** three new elements (`ocelle-dialog`, `ocelle-drawer`, `ocelle-tooltip`) with properties,
  events, slots and parts in the manifest (#7's checklist), semver MINOR; possibly new tokens in `@ocelle/tokens`
  (drawer inline size, tooltip delay), which would **span packages**.
- **Design decisions** #16 leaves open: the tooltip's platform basis against the engine floor; how a tooltip describes
  a trigger in another shadow root without an ID reference (#3's "light DOM or `ElementInternals`"); close event
  payload and cancelability; whether "kitty-mission-ui's flyouts" are modal like the personal drawer.
- **More than one user story:** dialog, drawer and tooltip are three independently testable outcomes.
- **Accessibility beyond a local fix:** modal focus management and WCAG 1.4.13 are constitution III's core.

`op` does not apply (new surface, open design questions). `fold` does not apply: nothing in progress covers overlays,
and #10 leaves element stories to element issues. `none` does not apply: two open issues (#7, #12) name these
elements as dependencies. `decision-needed` does not apply: the open questions (tooltip platform, flyout modality,
tokens) are clarify-stage decisions inside the mission and do not change its scope.

## Scope

In scope: **#16** only, one mission, one user story per element in this priority:

1. **`ocelle-dialog`** (P1). "Built on native `<dialog>` with `showModal`", UA background, colour and border reset to
   tokens, backdrop on `color-overlay`, sized by `dialog-max-*`, `elevation-raised`; "focus moves in on open and
   returns to the opener on close; Escape closes"; a close control with `ocelle-icon name="close"` named on its inner
   button; close event; reduced motion; forced colours; prose at a definite width. Story: the Open project dialog
   shape (#16's first consumer), with a stand-in list if #14 has not landed.
2. **`ocelle-drawer`** (P2). Same `<dialog>` machinery, a side panel on the logical start or end under `ltr` and
   `rtl`; serves #12's narrow-width personal drawer (#450) and kitty-mission-ui's flyouts; takes chrome grounds as
   #12 / #8's personal rail require (#5: personal rail on `color-chrome`).
3. **`ocelle-tooltip`** (P3). WCAG 1.4.13 as quoted; shown on hover and focus (#12: "on hover and focus"); never the
   only carrier of essential information, so #12's icon-only nav item "keeps the accessible name" on the control;
   works for #7's pill-tag ellipsis ("full text as tooltip"); stacks above and is dismissed before a dialog or drawer
   that contains its trigger (Escape closes the tooltip first).

Kept together because #16 bundles them, they share the overlay rules (top layer, Escape order, event naming, motion,
focus tests), and the tooltip-inside-dialog stacking would otherwise go untested. Each ships as its own phase.

Out of scope: the consumers' elements (#7's pill tag, #12's shell, top bar and nav item, #14's listbox, #8's
personal rail); a toast, menu or non-modal popover (none is asked for by #16 or any sibling); non-modal `<dialog>`
(`show()`) unless clarify finds the flyouts need it; the Storybook harness (#10); any engine-floor change without an
operator decision.

**Sibling comparison (#8, #9, #14, #15).** None of them has a popup or top-layer surface of its own: #9's select is
native, #14's listbox is inline, #15's scroller and #8's layouts are in-flow. So there is no shared overlay machinery
to pull into this mission or to push out to another; the only cross-issue contacts are consumption (#12's drawer, #8's
rail inside it, #14's listbox inside the dialog) and the shadow-root ARIA rule shared with #9 and #14.

## Risks and open questions

1. **Tooltip platform basis (operator decision at clarify).** Options: (a) stay on the floor: a tooltip inside its
   own shadow root, not in the top layer, positioned by script through CSP-safe CSSOM writes, which may be clipped by
   overflow containers and paint under a modal dialog unless placed inside it; (b) raise the floor to WebKit 17 for the
   Popover API (top layer, light dismiss), checking Kitty Desktop's WebKit webview; (c) use anchor positioning with a
   fallback (Chromium 125 / WebKit 26). Recommended: (a) or (b); (c) only as progressive enhancement.
2. **Cross-root description.** #3 allows "light DOM or `ElementInternals`". Options: `ocelle-tooltip` wraps its trigger
   in one shadow root; the tooltip renders its text in light DOM beside the trigger; ARIA element reflection (support
   to measure). This decides #7's and #12's markup, so it should be settled before either is specified.
3. **Flyouts' modality.** #16 says `showModal` for both elements and that the drawer serves "kitty-mission-ui's
   flyouts". If a flyout must leave the page interactive, the drawer needs a non-modal mode (`show()`, no backdrop,
   no focus trap). Specify asks the operator; default: modal only, as #16 states.
4. **Tokens.** A drawer inline size and tooltip show/hide delays are new `@ocelle/tokens` surface with mission 002's
   validation; the tooltip's ground and ink in both themes need a contrast entry (#5's contrast check in CI).
5. **First-consumer story.** #16 names the Open project dialog "with `ocelle-listbox`" (#14). This mission's stories
   use a stand-in list; whichever of #14 and #16 lands second adds the composed story. Not a blocker.
6. **Order with #10.** Stories, baselines and axe need #10's harness (unmerged; design on
   `origin/claude/010-storybook-workbench`). Wait for it rather than land under 001's exception, since top-layer capture
   (006 FR-012) is what overlays need tested.
7. **Order with #7 and #12.** Both are blocked on this mission for one feature each. If the operator schedules them
   first, they may ship without the tooltip / drawer parts and add them after, but must not hand-roll either.

## What would change this decision

- The operator decides at clarify that the tooltip needs a raised floor or its own design round: split `ocelle-tooltip`
  into its own mission after dialog and drawer; #7 (ellipsis) and #12 (nav-item bubble) are then blocked by that one.
- A comment or edit on #16 adds a menu, popover or toast: it joins if it shares the `<dialog>` / top-layer machinery,
  otherwise it goes to its own issue.
- A sibling issue gains a custom popup (for example #9's select moves off the native `<select>`): that popup then reuses
  this mission's dismissal and stacking rules, or the operator widens this mission to a shared overlay layer.
- The flyouts turn out to need a non-modal surface with a different focus model: the operator may split the non-modal
  drawer out as a follow-up op or mission.
