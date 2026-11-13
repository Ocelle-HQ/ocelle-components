---
triage: 014
issues: [14]
decision: mission
target: "selection-input"
in_scope: [14]
out_of_scope: [1, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 23, 27, 28, 29, 30]
semver: minor
spec_prompt: "Build issue #14 (triage/014-selection-input.md) in @ocelle/elements, following mission 005's element conventions (packages/elements/README.md § Element conventions, Host ARIA, slot convention, manifest gate): `ocelle-listbox` and `ocelle-option` (single select, roving tabindex, Arrow, Home and End, selection on Enter or Space, `aria-selected` paint, forced-colours selected edge, named without an ID reference across a shadow root; spec-kitty-design#527; first consumer the folder picker in kitty-mission-ui's Open project dialog, #16), `ocelle-tabs` (a real `role=\"tablist\"` with roving tabindex, wrapping arrows, Home and End, selection follows focus, `aria-selected` paint, forced-colours selected edge, tab-to-panel association inside the element so no `aria-controls` id crosses a shadow root; #521), `ocelle-segmented-choice` (an element replacing the class family, paint keyed on `aria-pressed` distinct from tabs, a joined variant with one shared border between neighbours, outer radius only on the first and last segment and per-row rounding when it wraps without a consumer ResizeObserver; #511), `ocelle-copy-field` (request-only: it never writes the clipboard, emits `ocelle-copy-field-request` and lets the host report the outcome in its own words, long commands wrap instead of scrolling, a flush Copy control using `ocelle-icon name=\"copy\"`, built as the operator answers Q1 of the record; #534) and `ocelle-link` (inline text-styled link in running text on `--ocelle-color-link`, emitting `ocelle-link-activate` instead of navigating, keeping link semantics and the token focus ring, optional `href` for real navigation; #522); one user story per element in that order, shared keyboard machinery internal; events `ocelle-<element>-<action>`, bubbling and composed, every payload tested; done when #7's checklist holds (a story per variant and state with light and dark baselines on #10's harness, interaction tests for every event and payload, keyboard and screen-reader tests, axe with no serious or critical finding, manifest entries, strict-CSP check) plus a keyboard-model test per element; `ocelle-button` (#7), the dialog (#16) and the Storybook harness (#10) stay in their issues."
status: approved
decided_by: "human:jeroennouwsdev"
decided_at: 2026-11-13T18:29:30Z
---

# Triage 014: Selection and input: segmented choice, tabs, listbox, link, copy field (#14)

## Issues read

**Source.** GitHub was not reachable from this session. The orchestrator fetched #14, every other open and closed
issue of the repository and the pull requests verbatim on 2026-11-13 into
`scratchpad/issue-14-context.md`; this record is based on that text. The spec-kitty-design issues #14 cites (#511,
#521, #522, #527, #534) were not read. Sibling designs were read from the local refs
`origin/claude/010-storybook-workbench` (`specs/006-storybook-workbench`, `triage/006-storybook-workbench.md`) and
`origin/claude/016-overlays` (`specs/008-overlays`, `triage/008-overlays.md`). #7's branch (mission 012) is not on
the remote and was not read.

- **#14** (open), "Elements: selection and input — ocelle-segmented-choice, ocelle-tabs, ocelle-listbox,
  ocelle-link, ocelle-copy-field". Parent: epic #1. No comments, labels or linked pull requests. "Controls with a
  keyboard model." What it asks:
  - `ocelle-segmented-choice` ("15 uses as a class family today"): an element, not a class family; a **joined**
    variant ("touching segments, one shared border between neighbours, outer radius only on the first and last
    segment, and per-row rounding when the group wraps, without a consumer `ResizeObserver`", #511); "Paint keyed on
    `aria-pressed` (toggle group), distinct from tabs."
  - `ocelle-tabs`: "A real `role="tablist"`: roving tabindex, wrapping arrows, Home and End, selection follows focus,
    paint keyed on `aria-selected`, a forced-colours selected edge; tab-to-panel association inside the element so no
    `aria-controls` id crosses a shadow root (#521)."
  - `ocelle-listbox` and `ocelle-option`: "Single-select list: roving tabindex, Arrow, Home and End, selection on
    Enter or Space, `aria-selected` paint, forced-colours selected edge (#527). First consumer: the folder picker in
    kitty-mission-ui's Open project dialog."
  - `ocelle-link`: "Inline, text-styled link for running text that emits `ocelle-link-activate` instead of
    navigating, keeps link semantics and focus styling, and takes an optional `href` for real navigation (#522)."
  - `ocelle-copy-field`: "A **request-only** mode: emits `ocelle-copy-field-request` and lets the host write to the
    clipboard (desktop webview bridge) and report the outcome in its own words (#534)"; "Long commands wrap instead
    of scrolling; a flush Copy control."
  - Done when: "Same checklist as the actions issue, plus a keyboard-model test per element." #7's checklist: a story
    per variant and state with visual baselines in light and dark; interaction tests assert every emitted event and
    its payload; keyboard and screen-reader behaviour tested, axe with no serious or critical finding; the manifest
    lists every public property, event, slot and part; built output passes the strict-CSP check.
- **#1** gap table row: "#511 #521 #522 #527 #534 | joined segmented choice, tabs, inline link, listbox, request-only
  copy field | #14 selection and input". Events `ocelle-<element>-<action>`, bubbles and composed.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #14 | issue (open) | in scope | This mission: six elements (five controls, `ocelle-option` with the listbox) and the checklist above. |
| #1 | epic (open) | out of scope | Parent. Its gap row for #511, #521, #522, #527 and #534 closes with this mission; event naming rule applies. |
| #7 (mission 012, designed in parallel, branch not on the remote) | issue (open) | out of scope; **defines #14's done-when**; **blocks** `ocelle-copy-field` only if Q1 is answered (a) | `ocelle-button` (variant, size, label, disabled, busy, href, icon slot, compact, quiet bordered, 44 px target). Possible consumer for the copy field's Copy control (Q1). `ocelle-button` with `href` renders a button-styled link; `ocelle-link` is text-styled in running text: different elements, but the two specs must not both claim the same use, so this spec names the boundary. Segments and tabs are not `ocelle-button`s: their roles (`aria-pressed` toggle, `tab`) and joined borders are their own. Unread, so its event and ARIA-passthrough choices cannot be reused yet. |
| #16 / `origin/claude/016-overlays`, `specs/008-overlays` | mission (designed, not merged) | out of scope; **related** (consumer composes it); neither blocks | `triage/008-overlays.md` and 008's spec name the Open project dialog "with #14's `ocelle-listbox`" as first consumer; 008 spec line 576: "#14's `ocelle-listbox` is not built; the Open project story uses a stand-in list. The feature that lands second of #14 and this one adds the composed story." This mission takes that on if it lands second. The listbox is inline, not a popup, and must leave Escape to the dialog. Integration inside kitty-mission-ui is the consumer's. |
| #10 / PR #24 (draft) / `origin/claude/010-storybook-workbench`, `specs/006-storybook-workbench` | mission (design final, **not merged**) | **blocks** (stories, baselines, axe only) | Gives the build, visual-regression (pinned container, light and dark) and axe gates; 006 leaves element stories to element issues. Spec and plan can proceed now; the baseline and axe work of each phase is written against #10's harness and lands after #10 merges. |
| #17 / PR #26 / `476602e`, `specs/005-icons-brand-mark` | mission (merged) | out of scope (done); **conventions apply** | Element conventions (module per element, `define`, `static properties`, token-only `static styles`, `:host([hidden])`, variants inside `@media not (forced-colors: active)`, manifest gate, engine floor Chromium 120 / WebKit 16.4), Host ARIA rules and the icon slot convention. Icons ready for this mission: `copy` ("the copy field's control (#14)"), `chevron-*`. |
| #23 / PR #25 / `e7d7d54`, `specs/007-mutation-gate-strictness` | mission (merged) | out of scope (done); applies | Timeout, CompileError and zero-mutant entries are report lines, not findings; 30-line entries. Keyboard handlers produce many mutants: plan tests that kill each key path. |
| #9 | issue (open) | out of scope | `ocelle-form-select` is native-select-based, so it needs no custom listbox. Shares the "no ID reference crosses a shadow root" labelling problem with the listbox; if #9 settles a pattern first, reuse it. |
| #12 | issue (open) | out of scope | `ocelle-nav-item` and `ocelle-nav-pill` are navigation (`aria-current`, links), not selection: they must not reuse tabs' `aria-selected` or segments' `aria-pressed`. No shared element. |
| #13 | issue (open) | out of scope; **related** | `ocelle-code-block` has a wrap policy and a scroll region that is a tab stop only while overflowing. The copy field's "long commands wrap instead of scrolling" must agree with #13's wrap policy and with `base.css` (code blocks wrap with `pre-wrap` and `overflow-wrap: anywhere`; identifier wrap `data-ocelle-wrap`). No monospace (constitution II) applies to both. |
| #15 | issue (open) | out of scope | `ocelle-scroller`. A tab list wider than its container either wraps or scrolls; if it scrolls it would reuse #15's scroller. Spec decides; no dependency unless it picks scrolling. |
| #8 | issue (open) | out of scope | Layout and headers; no selection or input surface. |
| #11 | issue (open) | out of scope; **blocked by #14** | v1.0.0 is blocked by every element issue including #14; changelog entry for `@ocelle/elements` (and `@ocelle/tokens` if a token is added). |
| #27 | issue (open) | out of scope | Manifest names `src` paths; affects every new manifest entry here but does not block. |
| #28, #30 | issues (open) | out of scope | Registry gate contract; `runs/index.md` conflicts between parallel mission branches. Process issues; #30 will bite this mission's run summary beside 006, 008 and 012. |
| #29 | issue (open) | out of scope | Flaky prose browser test; may fail this mission's CI runs for an unrelated reason. |
| `packages/tokens/src/source.ts` | tokens (merged) | applies | `color-link` and `color-link-hover` (links), `color-accent-low` ("selected rows, current nav"), `color-focus`, `focus-width`, `focus-offset`, `radius-2`, `target-min` exist. No token for a selected edge or a joined border; a new one spans packages and goes through 002's validation and contrast pairs. |
| `packages/styles/README.md` | base styles (merged) | applies | Links in prose differ from text by more than colour; code wraps anywhere; identifier wrap. `ocelle-link` in running text must meet the same non-colour cue. |
| constitution I, III, IV, V, VIII | constitution | applies | I: "Elements perform no I/O: no ... clipboard writes"; the copy field's request event is the only lawful behaviour. III: full keyboard model, no ID reference across a shadow root, host ARIA reaches the inner control, `target-min` for primary actions. IV: no inline style (per-row rounding must not write `style` attributes). V and VIII: every event, payload and keyboard path tested, red first. |
| `knowledge/speckit-flows/findings/frontend-missions.md`, `guards/vacuous-tests.md` | findings, guard | applies | Only Chromium is measurable (Kitty Desktop is WebKit); one heavy job at a time; Node and browser path setup. A keyboard test that dispatches synthetic key events on the host, or queries an empty shadow root, can pass vacuously: drive real keyboard input and assert focus and the accessibility tree. |
| `specs/`, `ops/`, `triage/` | repository | none to fold into | `specs/001` to `003`, `005`, `007` and `ops/004` are merged; 006 and 008 (unmerged) do not cover these elements. No triage record covers #14. |
| spec-kitty-design #511, #521, #522, #527, #534 | external issues | requirement sources, not read | Constitution VI: read as requirements only, nothing copied. The spec session reads them. |

## Decision

**mission.** Several rules each require it:

- **New public surface (MINOR):** six new elements with properties, attributes, events (`ocelle-link-activate`,
  `ocelle-copy-field-request`, and selection events for listbox, tabs and segmented choice), slots and parts in the
  manifest; possibly new tokens (selected edge, joined border), which would **span packages**.
- **Design decisions** #14 leaves open: the tabs' and listbox's child-element API and how a tab names its panel
  inside one tree scope; the segmented choice's keyboard model and exclusivity; how the joined variant detects wrapped
  rows within constitution IV; how the host reports the copy outcome and who announces it; `ocelle-link` semantics
  without `href` and its event with `href`; the Copy control (Q1).
- **More than one user story:** five independently testable outcomes.
- **Accessibility beyond a local fix:** three ARIA composite-widget keyboard models and cross-shadow-root naming are
  constitution III's core.

`op` does not apply (new surface and open design questions). `fold` does not apply: nothing in progress covers these
elements; 008 consumes the listbox, it does not contain it. `none` does not apply: none exists, and #16 and #11 depend
on it. `decision-needed` does not apply: the open questions below change how a story is built, not what the mission
covers, and can be answered at approval or at the spec check.

## Scope

In scope: **#14** whole, one mission, one user story per element. Kept together because #14 bundles them as one gap
row, three of them (listbox, tabs, segmented choice) share one internal roving-focus and selection mechanism that
should be written once, and they share the selected-state paint and forced-colours edge. Each ships as its own phase,
in this priority:

1. **`ocelle-listbox` and `ocelle-option` (P1, MVP).** Single select; roving tabindex; Arrow, Home, End; selection on
   Enter or Space; `aria-selected` paint on `color-accent-low` (or as the spec decides) with a forced-colours selected
   edge; named by `label` or host `aria-label` (no `aria-labelledby` across a shadow root); a selection event with
   payload; leaves Escape unhandled so a containing dialog closes. First because it has a named consumer (the Open
   project dialog, #16) and proves the shared mechanism.
2. **`ocelle-tabs` (P2).** `role="tablist"`, wrapping arrows, Home, End, selection follows focus, `aria-selected`
   paint, forced-colours edge, tab and panel associated inside one tree scope; a change event with payload.
3. **`ocelle-segmented-choice` (P3).** An element with `aria-pressed` paint distinct from tabs; the joined variant with
   shared borders, end radii and per-row rounding on wrap, without a consumer `ResizeObserver`; a change event. The
   "15 uses as a class family today" are in consumers; migrating them is the consumers' work.
4. **`ocelle-copy-field` (P4).** Shows a command; never touches the clipboard; emits `ocelle-copy-field-request`
   (payload: the text); the host reports the outcome in its own words through a property or slot the spec defines;
   long commands wrap; a flush Copy control with `ocelle-icon name="copy"`, named on its inner control. #14 calls
   request-only "a mode"; under constitution I it is the only behaviour, so the spec should define no mode switch.
5. **`ocelle-link` (P5).** Inline, text-styled on `color-link` / `color-link-hover` with a non-colour cue in running
   text, the token focus ring across line wraps, link role and Enter activation; emits `ocelle-link-activate`; an
   optional `href` for real navigation.

Plus: README sections per element, `@ocelle/elements` changelog, manifest entries, stories per variant and state, and
the composed dialog-and-listbox story if this mission lands after #16.

Out of scope: `ocelle-button` (#7); the dialog and its focus handling (#16); a custom select or popup listbox (#9 is
native); multi-select listbox, typeahead and option groups (not asked for); the Storybook harness (#10); migrating
consumers' class-family uses; kitty-mission-ui's integration.

## Risks and open questions

Questions for the operator, at approval of this record or at the spec check:

- **Q1. The copy field's Copy control.** (a) Use `ocelle-button` from #7: consistent look and one control to
  maintain, but `ocelle-copy-field` waits for #7 (mission 012) to merge and its phase goes after #7's; (b) an internal
  native `<button>` in the copy field's shadow root, styled from tokens, following the icon slot convention: no
  dependency, at the cost of a second button style that must match #7's; (c) (b) now, switched to `ocelle-button` in a
  later op once #7 merges. Recommended: (c), so the phase is not blocked and the swap is a PATCH with no surface change
  if the spec keeps the Copy control's parts and name stable.
- **Q2. Scope.** (a) All of #14 in this one mission, five phases (recommended: shared mechanism, one gap row); (b) this
  mission takes listbox, tabs and segmented choice, and `ocelle-link` with `ocelle-copy-field` go to a separate later
  mission (they share nothing with the roving-focus elements; a smaller first delivery for #16's consumer).
- **Q3. Segmented choice semantics** (#14 fixes `aria-pressed`, not the rest). (a) Exclusive toggle group: exactly one
  segment pressed, one tab stop with arrow keys between segments (toolbar pattern, the shared mechanism); (b)
  exclusive, every segment its own tab stop, no arrows; (c) (a) plus a `multiple` attribute allowing several pressed.
  Recommended: (a).
- **Q4. `ocelle-link` with `href`.** (a) Without `href` it emits `ocelle-link-activate` and never navigates; with
  `href` it navigates natively and emits nothing; (b) it always emits `ocelle-link-activate`, cancelable, and with
  `href` navigates unless the host cancels it; (c) as (b) but not cancelable. Recommended: (b), one event path for
  hosts such as the desktop webview that intercept navigation.

Risks:

- **Cross-shadow-root ARIA.** Tabs: if tabs and panels are slotted light-DOM children, ids between them stay in one
  tree scope; if a tab's role lives in a child's shadow root, they do not. The listbox's name cannot come from the
  dialog's heading by id. The spec must state the structure and test the accessibility tree in Chromium, not
  attributes.
- **Per-row rounding on wrap.** CSS cannot select the first and last item of a wrapped row; the element likely
  observes its own layout (an internal `ResizeObserver`, no I/O) and toggles classes or parts. It must not write a
  `style` attribute (constitution IV) and must not flicker on resize. Forced colours must still show every segment's
  boundary, and `color-rule` may not mark a control boundary (constitution II).
- **Copy outcome announcement.** "Report the outcome in its own words" needs a live region the host's text reaches;
  whether the element owns it (and when it clears) or the host does is a spec decision with a screen-reader test.
- **Selected edge in forced colours.** System colours only; the spec may need a width token (spans `@ocelle/tokens`).
- **Ordering.** Baselines and axe wait for #10's merge. With #16, whichever lands second adds the composed story. With
  #7, only Q1 (a) creates a dependency. #30 will conflict on `runs/index.md` with parallel branches.
- **Only Chromium measured.** Keyboard and accessibility-tree behaviour in WebKit (Kitty Desktop) stays an open
  limitation, as for every element.
- **Size.** Six elements is the largest element mission so far (005 had four stories and eleven review rounds); Q2 (b)
  is the lever if the operator wants smaller.
- **External sources unread.** The five spec-kitty-design issues may add detail (for example sizes, a compact
  segmented variant); the spec session reads them.
- **Branch.** This record is committed on `claude/014-selection-input`, not pushed. The feature directory will be
  `specs/014-selection-input/`.

## What would change this decision

- Q2 answered (b): this mission keeps listbox, tabs and segmented choice; link and copy field get a new triage record
  and mission (or an op each if their design questions are all closed by then).
- Q1 answered (a) and #7 slips: the copy-field phase moves last or splits out; the rest is unaffected.
- #7's spec turns out to cover inline text links (an `ocelle-button` link variant styled as text): `ocelle-link` folds
  into #7 and drops from here, or the two specs reconcile which element owns running-text links.
- #16's spec makes the listbox part of the dialog (a picker element): the listbox story moves into 008's scope, and
  this mission is blocked on that boundary until the operator chooses.
- A spec-kitty-design issue asks for a popup listbox, multi-select or typeahead: that need gets its own story or
  issue, not this mission.
