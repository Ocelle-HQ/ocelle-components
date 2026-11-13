# Feature Specification: Feedback and Forms

**Feature Branch**: `010-feedback-forms` (work happens on `claude/009-feedback-forms`)

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "Build issue #9 (triage/010-feedback-forms.md) in @ocelle/elements on the conventions of
mission 005: ocelle-notice (tone, role override, no heading wrapper or gap when no heading is slotted per
spec-kitty-design#513, size="compact" per #509, and with announce a polite or assertive live region chosen by tone
that announces each change once); ocelle-form-input (label, type, placeholder, .value, input event) and
ocelle-form-select (native-select-based, for closed choices such as lane and log filters), both taking part in forms
through ElementInternals or a light-DOM control, chosen once as the form-control convention later form elements (#14)
follow, with label, description and error message announced and no ID reference crossing a shadow root; for each
element the #7 'Done when' checklist (stories per variant and state in light and dark, interaction tests for every
event and payload, keyboard and screen-reader behaviour, axe with no serious or critical finding, manifest entries,
strict-CSP built output) plus form-submission tests of value and validity and announcement tests for the notice;
visual baselines and axe run on the #10 harness (specs/006-storybook-workbench) once it lands; ocelle-button, compact
sizing of #7's metric, and the selection elements of #14 stay out."

**Issues**: #9 (triage record `triage/010-feedback-forms.md`, approved by the operator on 2026-11-12). The body of #9
and the "Done when" checklist of #7 it refers to are the sources of the requirements below. The spec-kitty-design
issues #9 cites (#509 compact notice, #513 notice without an empty heading block) and ADR-0078 (D5, no ID reference
across a shadow root) were not read for this spec; their content is known only through #9's wording and epic #1's gap
table. The operator confirmed at spec check 1 that #9's own wording is the requirement for them and that their texts
are not read (SPEC-1-09). Their `sk-*` names are kitty-mission-ui roles, not names of this library.

**Operator decisions while specifying** (2026-11-12, human:jeroennouwsdev):

- Form-control convention, "ElementInternals (Recommended)": `ocelle-form-input` and `ocelle-form-select` are
  form-associated custom elements. The native control lives in the element's open shadow root together with its
  label, description and error text, so every ID reference stays inside one root, and the host element carries the
  form value, validity, reset and restore, the disabled state and the association with an external `<label for>`.
  This is the convention later form-like elements (#14) follow (FR-020).
- Notice announcements, "Insertion and changes (Recommended)": with `announce`, a notice inserted into the page after
  it has loaded is announced once, and each later change of its text or tone is announced once more. A notice that is
  part of the page as first loaded is not announced (FR-008).
- Error text, "Announce only (Recommended)": a host-set `error` is shown, announced and marks the control invalid for
  assistive technology, but does not block form submission; the form's validity comes only from the native
  constraints (FR-027).

**Operator answers at spec check 1** (2026-11-12, human:jeroennouwsdev):

- SPEC-1-09, "#9's wording suffices": #9's own wording is the requirement for spec-kitty-design#509, #513 and
  ADR-0078 D5; their texts are not read.
- SPEC-1-10, "Reveal announces": removing `hidden` from an announcing notice announces its current text once, as an
  insertion does (FR-008).
- SPEC-1-11, "Nothing automatic": an `error` present when the page is first loaded is not announced and does not move
  focus. It is part of the control's description and invalid state, so it is read when the user reaches the control.
  The README tells hosts to put an error summary or a notice at the top of the page and focus it. Only later changes
  of `error` are announced (FR-027).
- SPEC-1-12, "Block, fill container": the form-control hosts are block-level and the control fills their inline size.
  In a filter bar the host sets the element's width, or places it as a flex or grid item (FR-025).

**Operator answers at spec check 2** (2026-11-13, human:jeroennouwsdev):

- SPEC-2-03, "Announce once per control": a form control inserted after parsing with a non-empty `error` announces
  that error politely, once, as an inserted notice does; several controls inserted at once each announce their own
  error once (FR-027, User Story 2 scenario 20).
- FR-009, the role rows of the check 1 fix, "Keep: role implies announce": a host `role="alert"` or `role="status"` on
  `ocelle-notice` without `announce` behaves as `announce` with that role's politeness: insertion, reveal and changes
  announce once, never on first load (FR-009, User Story 1 scenario 15).

**Operator decision at the spec gate** (2026-11-13, human:jeroennouwsdev):

- Spec gate after spec check 3, "Approve after a final fix": the spec is approved once the findings of spec check 3
  (`reviews/spec/check-3.md`) are fixed, as `reviews/spec/check-3-fixes.md` records. No further spec check follows;
  the plan squad reads the spec next. Check 3 had no operator questions.

**Operator decisions at plan squad round 1** (2026-11-13, human:jeroennouwsdev; `reviews/plan/round-1/refute.md`):

- PLAN-FRESH-1-001 (b) and PLAN-A11Y-SECURITY-1-002 (a): announcements go through a separate live region in the
  element's shadow root that never contains the slotted content. It is present and empty before the text is written,
  and the text is written only after Chromium's accessibility serialisation delay, so no focusable content is ever
  hidden to make a region go empty ("What 'announced' means here", Capture; plan research R-02).
- PLAN-TESTABILITY-1-001 (a): the capture counts only tree states that were current across a rendering update and
  for longer than the serialisation delay ("What 'announced' means here", Capture).
- PLAN-A11Y-SECURITY-1-005 (b): a host `aria-label` and `aria-description` stay on the host, whose node then carries
  the same name and description as the control; the README says so and a test pins the tree (FR-022).
- PLAN-A11Y-SECURITY-1-006 (b): a host `aria-label` keeps its precedence; with a visible label drawn, the README
  requires the `aria-label` to contain the visible label text, and any other combination is not supported (FR-022).
- PLAN-CORRECTNESS-1-006 (a): host `aria-invalid`, `aria-required` and `aria-disabled` are combined only for the
  value `"true"`; any other host value is not supported (FR-022).
- PLAN-CORRECTNESS-1-003 (a) and PLAN-FRESH-1-004 (c) are plan decisions (research R-07, R-03) with no change here.

**Operator decisions at plan squad round 2** (2026-11-13, human:jeroennouwsdev; `reviews/plan/round-2/refute.md`):

- PLAN-FRESH-2-001 (a): changes of a notice's text or politeness, or of a control's `error`, made less than the
  announcement wait apart (the plan's `W`, twice Chromium's serialisation delay: 300 ms after load, 700 ms before),
  in one task or in different tasks, announce only the final text, once. A text that is back to the last announced
  text when the wait ends announces nothing. A text that keeps changing more often than every `W` is not announced
  until it stops changing; the README says so (FR-008, FR-027, SC-002, User Story 1 scenario 13).
- PLAN-FRESH-2-002 (a): for a host `role="alert"`, insertion after parsing, reveal and a change of the host role to
  `alert` are carried by the platform's alert event for the host's node, which Chromium fires when an alert node is
  created, unignored or given the alert role, whatever its live politeness. The notice writes no copy into a live
  region for them, so the tree measure counts zero for them; the README says so (FR-009, User Story 1 scenario 15,
  SC-002).
- PLAN-FRESH-2-005 (b): an announced copy stays in the notice's or control's live region for a bounded hold of
  several seconds (the plan names the figure), not only for the serialisation delay; the figure is not measured by the
  tree capture, and the README says so (FR-035).
- PLAN-FRESH-2-003 (a) is a plan decision (research R-09) with no change here.

## Consumer need

- kitty-mission-ui uses the Spec Kitty notice in 28 places. Its notice draws a heading block and a gap even when no
  heading is given (spec-kitty-design#513), has no compact size for dense screens (#509), and announces through a live
  region whose politeness does not follow the notice's tone (#9).
- kitty-mission-ui uses a form input in 2 places, and Kitty Desktop V2's lane and log filters need a select for closed
  choices; Spec Kitty ships the select only as a light-DOM style, so each screen styles a raw `<select>` itself (#9).
- The Ocelle web console renders forms on the server (Thymeleaf) and submits them as plain HTML forms or with htmx
  under a strict CSP: a form control only counts if the browser's own form data contains its value and the browser's
  own constraint validation sees it. Label, description and error must be announced by assistive technology, and no
  ID reference may cross a shadow root (constitution III; ADR-0078 D5 as #9 cites it).
- Epic #1's gap table: `#513 | notice without empty heading block | #9`, and `#509 | ... compact notice | #7, #9, #5`
  (the compact notice is this feature's part of #509; the metric's row layout and the eyebrow style stay with #7).
- Expected outcomes elsewhere, which this feature makes possible but cannot show itself: kitty-mission-ui replaces
  its notices, inputs and filter selects with `ocelle-*` and drops its local styles and empty-heading workarounds;
  #14's form-like elements follow FR-020 without a new design question. What this feature checks for them is SC-006.

## User Scenarios & Testing *(mandatory)*

The users of this feature are host pages that show notices and collect input (Kitty Desktop's webview, Kitty
Dashboard, the Ocelle console's server-rendered pages under the strict CSP, which load the browser build), assistive
technology users of those hosts, keyboard users, the authors of later form-like elements of this library, and the
operator who reviews pull requests.

**Engines.** Behaviour is measured in Chromium, the only engine available to this repository's test runs. WebKit
(Kitty Desktop on macOS and Linux) is not measured; the README names that as an open limitation, as for mission 005.

**Fixture pages.** Every browser scenario below, except the Storybook stories (FR-033), runs as mission 005's browser
scenarios do (README "Element conventions", Files and tests): written once against a driver and run both in process on
the element source and on strict-CSP fixture pages that load only the browser build, served with
`Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'`, with no CSP violation reported.

**What "announced" means here.** No screen reader runs in this repository's tests. A scenario that says a text is
*announced* (politely or assertively) is checked on the browser's accessibility tree, read as a sequence of snapshots
taken after each accessibility-tree update:

- A *live region node* is a non-ignored node whose live politeness in the accessibility tree is `polite` or
  `assertive`, whatever gives it that politeness: a role with an implicit politeness (`status`, `alert`, `log` and any
  other), an `aria-live` attribute, or anything else the browser maps to it. The host's own node counts.
- *The region's text* in a snapshot is read from the tree alone: visit the region node's descendants in tree order;
  take the name of each non-ignored node with role StaticText, and the name of each non-ignored node with role `img`
  (an `ocelle-icon` with a `label` is one) without visiting the `img`'s own descendants; skip every other node's name
  (a link's name, for example, is not taken, only its StaticText children are), and skip inline text boxes. Each taken
  name counts as if surrounded by a space; the result has whitespace collapsed and trimmed. Ignored nodes (an
  `aria-hidden` subtree, a `hidden` element) contribute nothing, whatever the snapshot options include. For a notice
  whose slotted content is made only of what FR-008 names (text nodes, `ocelle-icon` with a `label`, `img` with an
  `alt`, and subtrees skipped by `hidden`, `aria-hidden="true"`, `script`, `style` or `template`), this reading equals
  the notice's text as FR-008 defines it on the DOM side; a scenario's expected string is that text, and every
  scenario uses only such content. For other slotted content (an element with `role="img"` and an `aria-label`, an
  `svg`, CSS-generated content, content hidden by host CSS without `hidden`) the announced text is not specified and
  no scenario tests it; the README says so (FR-035).
- *Capture.* The snapshots are taken by a capture that sees every accessibility-tree state, not by polling, and an
  *accessibility-tree update* is a state that Chromium can hand to assistive technology: one that was current across
  at least one rendering update and for longer than Chromium's accessibility serialisation delay (the plan names the
  capture, the delay and its source). A state that lasts a shorter time (an attribute set and cleared in one task or
  in the first animation frame) is not an update and is skipped before the rule below is applied (operator decision
  PLAN-TESTABILITY-1-001). A zero count is also checked with only the rendering-update condition, so a short-lived
  state cannot hide an unwanted announcement.
- An *announcement* is a live region node that is in two consecutive snapshots and whose text in the later one differs
  from its text in the earlier one and is not empty. The announced text is the region's text in the later snapshot.
  Its politeness is the region node's live politeness in the later snapshot: *politely* means `polite`, *assertively*
  means `assertive`.
- *Insertion and reveal.* When an announcing notice is inserted, or is revealed by removing `hidden` (FR-008), or a
  form control holding a non-empty `error` is inserted or revealed (FR-027), its live region node first appears in a
  snapshot with empty text; in a later snapshot its text becomes exactly the announced text. That one change is the
  announcement (for a `role="alert"` notice the platform's alert event carries the insertion and the reveal instead,
  and the region stays empty, FR-009). A region that first appears already holding text (first load, `announce` or a live host role set on
  an existing notice, a reveal by an ancestor) has made no announcement. The notice's content is visible from the
  first frame in which its box is drawn, and the control's error text from the first frame in which the control is,
  and both are in the accessibility tree from then on; only the announcement may come later (by the serialisation
  delay the plan names), so no visibly empty box precedes an announcement.
- *Once* means exactly one announcement per triggering change, counted over the whole scenario on every live region
  node that is the notice's host or inside it, or the form control's host or inside it. Changes that follow each other
  by less than the announcement wait are one triggering change (FR-008). "Never by two live regions"
  is measured the same way: for one triggering change, exactly one such node announces, so a live region nested in
  another live region whose text also changes counts as two announcements and fails.

A scenario
that says a control's label, description or error is *announced* checks the accessible name, the accessible
description and the invalid state of the focused control's node in the accessibility tree. Tests that only check that
an attribute such as `aria-live` is present do not count (knowledge guard `vacuous-tests`).

A scenario written with **Given** and **Then** and no **When** means "**When** it renders" (or, for a gate, "**When**
the gate runs").

### User Story 1 - `ocelle-notice` (Priority: P1)

A host shows a message about a state or result (an info hint, a success, a warning, a failure) in a box whose look
follows its tone, with or without a heading, in the regular or the compact size. When the message is news to the user,
the host sets `announce` and assistive technology reads it out once, politely or assertively according to its tone.

**Why this priority**: 28 uses in kitty-mission-ui today, the smallest element, and the one #513 and #509 name. It
can ship and be used on its own.

**Independent Test**: Place notices of every tone, size and heading state on a fixture page, read their boxes,
colours and accessibility tree; insert and change announcing notices and count the live-region changes.

**Acceptance Scenarios**:

1. **Given** `<ocelle-notice>` with body text and no `tone`, **When** it renders, **Then** it shows the body text in a
   box with the `info` look: ground `--ocelle-color-info-bg`, the tone marker (FR-004) in `--ocelle-color-info`, text
   `--ocelle-color-ink`, radius `--ocelle-radius-row`; `tone` reads back as `"info"`.
2. **Given** each tone `info`, `success`, `warning`, `danger` and `neutral`, **When** it renders in light and in dark,
   **Then** the ground is `--ocelle-color-<tone>-bg` and the marker `--ocelle-color-<tone>`, and the body text meets
   4.5:1 and the marker 3:1 against that ground (the contrast check, FR-005).
3. **Given** `tone="bogus"` or `tone=""`, **When** it renders, **Then** it has the `info` look and the `info`
   announcement politeness, with no error or console message.
4. **Given** a notice whose heading is absent (FR-006): no element in its `heading` slot, or only elements whose text
   content is empty or whitespace, such as `<span slot="heading"></span>` or `<span slot="heading"> </span>` as a
   server template writes for a null heading, **When** it renders, **Then** the box's content starts with the body
   text: no heading box is rendered, and the distance from the top of the box's content box to the top of the first
   line box of the body is 0, in both sizes, with and without forced colours (#513).
5. **Given** a notice with `<span slot="heading">Run failed</span>` and body text, **When** it renders, **Then** the
   heading is drawn above the body, in the heading text style (FR-006), separated from it by the gap FR-006 names
   for the size (`--ocelle-space-2` regular, `--ocelle-space-1` compact); removing the heading element afterwards
   returns the box to scenario 4's layout without a reload.
6. **Given** `size="compact"`, **When** it renders, **Then** its text uses `--ocelle-font-size-sm` and
   `--ocelle-line-height-compact` (the scale of the base styles' `data-ocelle-density="compact"` hook) and its
   padding is the compact padding of FR-007, smaller than the regular padding on both axes; `size="regular"`, no
   `size` and any other value give the regular size.
7. **Given** a notice without `announce`, with no host `role` or a host role that gives the host's node no live
   politeness (for example `note`, `region` with an `aria-label`, `none`), and with no host `aria-live`, `aria-atomic`
   or `aria-relevant` (the first row of FR-009's table; its unsupported rows are not tested), **When** it is inserted
   into a parsed page, revealed, or its text or tone changes, **Then** neither its host nor any node inside it is a
   live region node in the accessibility tree and nothing is announced.
8. **Given** a page that has finished parsing, **When** a script or an htmx swap inserts
   `<ocelle-notice announce tone="success">Saved</ocelle-notice>`, **Then** "Saved" is announced politely, once. The
   same holds for each way of inserting it: `innerHTML` on a container, a `<template>`'s content cloned and appended,
   a `DOMParser` document's node adopted and appended (as htmx does), and `document.createElement` (FR-008, "First
   load and insertion").
9. **Given** the same with `tone="danger"` (or `warning`), **Then** the text is announced assertively, once, for each
   of those ways of inserting it.
10. **Given** an announcing notice that is part of the page as first loaded (in the HTML the server sent), **When** the
    page is parsed and loaded, **Then** nothing is announced for it; a later change of its text is announced once.
11. **Given** a connected announcing notice, **When** its text (FR-008) changes (the host replaces a text node, or changes
    the heading), **Then** the new text (heading and body, in that order, separated by one space) is announced once;
    **When** the host sets the same text again, or the element re-renders for any other reason (a `size` change, a
    theme change, moving the element within the page), **Then** nothing is announced.
12. **Given** a connected announcing `info` notice, **When** its `tone` changes to `danger` with the same text, **Then**
    the text is announced once, assertively; a change from `danger` to `warning` with the same text announces nothing
    (same politeness, same text). Both hold the same when keyboard focus is on a link slotted in the notice's body
    while the tone changes, and the link stays focused and in the accessibility tree throughout.
13. **Given** several text changes made in one task (for example a script that sets the body three times in a row),
    **When** they settle, **Then** only the final text is announced, once. **Given** two text changes in different
    tasks 100 ms apart (`A` to `B`, then `B` to `C`), **Then** only `C` is announced, once (operator decision
    PLAN-FRESH-2-001, changes less than the wait apart). **Given** a text that goes from `A` to `B` and back to `A`
    within the wait, **Then** nothing is announced. **Given** a text change made 10 ms after a copy has been
    announced, **Then** the earlier announcement still counts (its copy stays in the region for at least the wait),
    and the new text is announced once after it. **Given** an announced text and no further change, **Then** the copy
    stays in the region for the plan's hold and is then removed, which announces nothing.
14. **Given** an announcing notice, **When** `announce` is removed, **Then** later changes are not announced; **when**
    it is set again, **Then** the current text is not announced, and the next change is.
15. **Given** a host `role` on the notice (FR-009), **When** it renders, **Then** the host's node in the accessibility
    tree has that role, and the outcome is the one FR-009's table gives for that role with and without `announce`:
    `role="alert"` announces assertively and `role="status"` politely whatever the tone, with or without `announce`,
    at the moments FR-008 names (insertion after parsing, reveal, change) and not on first load (operator answer at
    spec check 2), except that for `role="alert"` the insertion after parsing, the reveal and a change of the role to
    `alert` are carried by the platform's alert event and no live region node at or inside the host announces them
    (count zero, with the host's node having the role `alert`; operator decision PLAN-FRESH-2-002); with a role that
    gives the host's node no live politeness (for example `note`, `region` with an `aria-label`, `none`) the notice
    behaves as with no role. In every case each triggering change that a live region announces is announced by
    exactly one live region node (no nested second region), and a server-rendered `role="alert"` notice is not
    announced when the page is first parsed. **When** the host sets `role="alert"` at runtime on a connected notice without `announce`, **Then** no
    live region node announces (the platform's alert event reads the notice, which the tree measure does not see),
    and its next text change is announced assertively once; **when** the host then changes the role to `status`,
    **Then** the current text is announced politely once, the same when keyboard focus is on a link slotted in the
    notice's body (the link stays focused and in the accessibility tree); **when** it changes the role back to
    `alert`, **Then** no live region node announces (the platform's alert event); **when** it removes the role,
    **Then** nothing is announced and later changes are not announced (FR-008, "Live host role at runtime"). (`log`
    and other live roles, and a host `aria-live`, are not supported and not tested; FR-009.)
16. **Given** forced-colours mode, **When** a notice of each tone renders, **Then** the box border and the marker are
    visible in system colours (the marker in `CanvasText`), and the text is `CanvasText` on `Canvas`.
17. **Given** a host `hidden` attribute, **Then** the notice has no box and nothing in it is announced while hidden;
    **when** the host removes `hidden` from an announcing notice (inserted hidden, or part of the page as first loaded
    and hidden), **Then** its current text is announced once, as for an insertion (operator answer SPEC-1-10); text
    changes made while hidden are not announced on their own, only the text current at the reveal is.
18. **Given** a notice with slotted inline content (a link, an `ocelle-icon`), **When** it
    renders, **Then** the content keeps its own semantics in the accessibility tree (the link stays a link, focusable
    by Tab) and inherits the notice's text colour.
19. **Given** an announcing notice inserted with the body
    `<ocelle-icon name="arrow-end" label="Error"></ocelle-icon> Run failed. <a href="/runs/7">View run 7</a><span
    aria-hidden="true"> (details)</span>` and no heading, **Then** "Error Run failed. View run 7" is announced once
    (the icon's `label` counts, the `aria-hidden` span does not); **when** the host then changes the link's text node
    to "View run 8", **Then** "Error Run failed. View run 8" is announced once; **when** the host sets
    `aria-hidden="true"` on the link, **Then** "Error Run failed." is announced once; **when** the host changes the
    link's `href` only, **Then** nothing is announced.

---

### User Story 2 - `ocelle-form-input` (Priority: P2)

A host asks for a short text value (a name, a filter, an email, a URL) with a visible label, an optional description
and an error the host may set. The value takes part in the surrounding form like a native input: it is submitted, it is
validated by the browser's own constraints, reset restores it, a disabled fieldset disables it.

**Why this priority**: 2 uses today, but it settles the form-control convention (FR-020) that the select and #14
reuse; the select is built on it.

**Independent Test**: Put inputs in a real `<form>` on a fixture page; type, submit, reset and read `FormData`,
validity, events and the accessibility tree.

**Acceptance Scenarios**:

1. **Given** `<form><ocelle-form-input name="title" label="Title"></ocelle-form-input></form>`, **When** it renders,
   **Then** a visible label "Title" is drawn above a text field; the focused field's node in the accessibility tree is
   a textbox named "Title"; clicking the label focuses the field; the control's shadow tree exposes the label text
   once (one StaticText "Title", from the visible label, and none from the node that carries the name).
2. **Given** that form, **When** the user types "Fix lane", **Then** `element.value` is `"Fix lane"`, and both
   `new FormData(form).get("title")` and the request a plain submit sends contain `title=Fix lane`.
3. **Given** each typing step, **When** a character is typed, **Then** one `input` event reaches a listener on the host
   with `event.target` the host and `element.value` already the new value; **when** the field loses focus after a
   change, or the user presses Enter, **Then** exactly one `ocelle-form-input-change` event with
   `detail: { value: "<the value>" }`, `bubbles` and `composed`, is dispatched on the host (FR-024); no change event is
   dispatched when the value did not change since the last one. **When** the user types, presses Enter and then
   moves focus out of the field, **Then** exactly one `ocelle-form-input-change` is dispatched over the whole sequence,
   before any submission the Enter starts (FR-030).
4. **Given** `value="draft"` as an attribute, **When** the user types and the form is reset, **Then** the value
   returns to `"draft"` and no `ocelle-form-input-change` is dispatched; **given** the property `element.value = "x"`
   set by script, **Then** the field shows `x`, the form value is `x`, and no event is dispatched.
5. **Given** `required` and an empty value, **When** the form's `checkValidity()` runs or the user submits, **Then** it
   reports invalid, the submit does not happen, `element.validity.valueMissing` is `true`, `element.validationMessage`
   is the browser's message for the inner field, and `reportValidity()` focuses the field; typing a value makes it
   valid.
6. **Given** `type="email"` with the value `"not-an-email"` (or `type="url"` with `"x"`, or `minlength`, `maxlength`
   or `pattern` that the value breaks), **Then** the element's validity matches what a native `<input>` with the same
   attributes and value reports, flag by flag, and the form does not submit.
7. **Given** `type` set to each of `text`, `email`, `url`, `tel`, `search`, `password` and `number`, **Then** the inner
   field has that type, and for `number` ArrowUp and ArrowDown step the value as in a native number input with the
   same `step`, `min` and `max`; any other value, or no `type`, gives `text` and `type` reads back as `"text"`. The
   `email` keyboard hint and the masking of `password` cannot be observed in desktop Chromium beyond the inner
   field's type; they are not measured, and the README lists them under its limitations.
8. **Given** `placeholder="Filter lanes"` and an empty value, **Then** the placeholder is shown in
   `--ocelle-color-ink-muted` (meeting 4.5:1) and is not the field's accessible name when a `label` is set.
9. **Given** `description="Shown on the lane card"`, **Then** the text is shown under the label and is the focused
   field's accessible description.
10. **Given** a host that sets `error="Title is taken"`, **When** it renders, **Then** the error text is shown under
    the field in `--ocelle-color-danger` with a non-colour mark (FR-028), the focused field reports invalid to
    assistive technology and its description is the description followed by the error, and the error text is
    announced politely once; the form still submits (operator decision); clearing `error` removes the text, the
    invalid state and announces nothing. **When** the host then sets `error="Title is taken"` again (the sequence
    `"Title is taken"`, `""`, `"Title is taken"` that a host clearing the error on input and a server returning the
    same message produce), **Then** it is announced politely once more, since clearing resets the baseline (FR-027);
    **when** the host changes it to `" Title  is taken "`, **Then** nothing is announced (same text after whitespace
    is collapsed and trimmed).
11. **Given** `disabled`, or the element inside `<fieldset disabled>`, **Then** the field cannot be focused or edited,
    is drawn with the disabled tokens, reports disabled in the accessibility tree, and its value is not in the form
    data; enabling it restores all of that.
12. **Given** `readonly`, **Then** the field can be focused and its value is submitted, but it cannot be edited.
13. **Given** an external label, `<label for="t">Title</label><ocelle-form-input id="t" name="title">`, **Then** the
    field is named "Title", clicking the label focuses the field, and `element.labels` holds that label; **when** the
    host then changes the external label's text to "Card title", **Then** the field's node is named "Card title" in
    the accessibility tree without the field being focused first; **given** a
    host `aria-label="Search lanes"` without `label` and without an external label, **Then** the field is named
    "Search lanes"; **given** both
    `<label for="t">Title</label>` and `label="Lane title"`, **Then** the field is named "Title Lane title"; **given**
    `aria-label="Title Lane title, filter"` (holding the visible label text, as FR-022 requires) together with
    `label="Lane title"` and the external label, **Then** the field is named "Title Lane title, filter"; **given** a
    host `aria-label="Search lanes"` and `aria-description="Filters the board"`, **Then** the textbox is named "Search lanes"
    and described by "Filters the board", and the host's own node is a generic with the same name and description
    (as Chromium exposes it; the test pins both nodes, operator decision PLAN-A11Y-SECURITY-1-005);
    **given** a host `aria-labelledby` naming an element in the page and no other source, **Then** the
    field has no accessible name (FR-022).
14. **Given** keyboard use, **When** the user tabs, **Then** the field takes focus once (the host is not a second tab
    stop), shows the token focus ring (`--ocelle-color-focus`, `--ocelle-focus-width`, `--ocelle-focus-offset`), and
    `element.focus()` focuses the field; Shift+Tab leaves it.
15. **Given** forced-colours mode, **Then** the field's boundary, the focus ring (in `Highlight`) and the error mark
    are visible.
16. **Given** the user has typed a value on a fixture page that is excluded from the back/forward cache (served with
    `Cache-Control: no-store`), **When** the user navigates away and back so that the browser restores the page's
    form state from history, **Then** the page is a new document (its `pageshow` event has `persisted` false), and
    the field shows and submits the restored value. (Autofill is not
    measured: it cannot be triggered by a test; README, limitations.)
17. **Given** `autocomplete="email"` on the host, **Then** the inner field carries the same `autocomplete` value.
18. **Given** a page as first loaded (the server re-rendered a failed plain form post) with
    `<ocelle-form-input name="title" label="Title" error="Title is taken">`, **When** the page is parsed and loaded,
    **Then** nothing is announced for the error and focus does not move (it stays where the browser puts it on load);
    the error text is shown, and when the user reaches the field, the focused field reports invalid and its
    accessible description ends with "Title is taken" (operator answer SPEC-1-11); **when** the host later changes
    `error` to "Title is too long", **Then** that text is announced politely once.
19. **Given** an input in a container 30rem wide with no width set on the host, **Then** the host's computed `display`
    is `block` and the field's border box is as wide as the host's content box; **given** the host placed as a flex
    item, or with a `width` set by the host page, **Then** the field fills that width (operator answer SPEC-1-12).
20. **Given** a page that has finished parsing, **When** an htmx swap (or a script) inserts, in one task, a form
    fragment holding `<ocelle-form-input name="title" label="Title" error="Title is taken">` and
    `<ocelle-form-input name="lane" label="Lane" error="Lane is required">`, **Then** "Title is taken" is announced
    politely once, at or inside the first control's host, and "Lane is required" is announced politely once, at or
    inside the second's, for each way of inserting the fragment that User Story 1 scenario 8 names (`innerHTML`,
    `<template>` content, a `DOMParser` node, `document.createElement`); focus does not move; **when** the same fragment is moved within the page in one task,
    **Then** nothing is announced (operator answer SPEC-2-03).
21. **Given** three forms, each built twice, once with `ocelle-form-input` and once with a native `<input>` in the same
    place with the same attributes: one with a submit button, one with no submit button and one field, and one with no
    submit button and two fields, **When** the user presses Enter in the (first) field, **Then** the form submits, or
    does not, exactly as its native twin does, with the same form data (FR-030); **given** `required` and an empty
    value in the form with a submit button, **When** the user presses Enter, **Then** the submit does not happen and
    the field is focused, as for the native twin. **Given** a mixed form with no submit button, one native text
    `<input>` and one `ocelle-form-input`, **When** the user presses Enter in the `ocelle-form-input`, **Then** the form
    does not submit (it holds two blocking fields, as the all-native twin with two fields); **when** the user presses
    Enter in the native input, **Then** the form submits, because the browser does not count the custom element as a
    blocking field (FR-030; the README lists this under its limitations).
22. **Given** a control with a host `hidden` attribute and `error="Title is taken"` (inserted hidden, or part of the
    page as first loaded and hidden), **Then** nothing is announced while it is hidden, and an `error` change while
    hidden is not announced on its own; **When** the host removes `hidden`, **Then** the `error` current at that
    moment, if non-empty, is announced politely once, as for an insertion (FR-027); a control without `error` announces
    nothing when revealed.
23. **Given** a host `aria-invalid="false"` with `error="Title is taken"`, a host `aria-required="false"` with
    `required`, and a host `aria-disabled="false"` with `disabled`, each on its own control, **Then** the inner
    control's node is invalid, required and disabled respectively, as the element's own attribute says; a host value
    other than `"true"` does not change the inner control's state, and what the host's own node then carries is not
    specified (FR-022, operator decision PLAN-CORRECTNESS-1-006).

---

### User Story 3 - `ocelle-form-select` (Priority: P3)

A host offers a closed choice (a lane filter, a log level) as a native select with the same label, description,
error and form behaviour as `ocelle-form-input`, written with ordinary `<option>` children so a server-rendered page
needs no script to fill it.

**Why this priority**: Kitty Desktop V2's lane and log filters need it (#15 is the consumer); it reuses User Story 2's
convention.

**Independent Test**: Put selects with `<option>` and `<optgroup>` children in a real `<form>`; choose with mouse and
keyboard, submit, reset, change the options, and read `FormData`, validity, events and the accessibility tree.

**Acceptance Scenarios**:

1. **Given** `<ocelle-form-select name="lane" label="Lane"><option value="todo">To do</option><option value="done"
   selected>Done</option></ocelle-form-select>` in a form, **Then** a visible label "Lane" is drawn above a native
   select showing "Done"; the focused select's node is a combobox (Chromium's role for a single native select) named
   "Lane"; `element.value` is `"done"` and the form data holds `lane=done`.
2. **Given** keyboard use, **When** the select is focused, **Then** the native select's own keys work unchanged,
   measured on the test platform (Chromium on Linux): ArrowDown and ArrowUp on the closed select change the choice,
   and typing a letter selects the next option whose label starts with it. That Alt+Down or Space opens the list is
   not visible in the DOM or the tree; it is not measured, and the README lists it under its limitations. **When** the
   choice changes, **Then** one `input` event reaches the host with `element.value` already the new value, and one
   `ocelle-form-select-change` with `detail: { value }`, `bubbles` and `composed`.
3. **Given** `<optgroup label="Active">` children holding options, and options with `disabled`, **Then** the native
   select shows the same groups and disabled options, in the same order, with the same labels and values.
4. **Given** the host adds, removes or edits an `<option>` child (text, `value`, `selected`, `disabled`) after
   rendering, **Then** the native select reflects the change; if the selected option is removed, the value becomes
   what a native select would choose (the first enabled option), without dispatching a change event.
5. **Given** `required` and a first option with an empty value selected (`<option value="">Choose a lane</option>`),
   **Then** the element reports `valueMissing` and the form does not submit, as a native select does; choosing another
   option makes it valid.
6. **Given** a form reset, **Then** the selection returns to the option marked `selected` in the markup (or the first
   option without one), and no change event is dispatched; `element.value = "todo"` by script selects that option
   with no event; setting a value no option has selects nothing and `element.value` reads `""`, as a native select.
7. **Given** `description`, `error`, `disabled`, `<fieldset disabled>`, an external `<label for>`, a host `aria-label`,
   history restore, forced-colours mode, keyboard focus, a first-load `error`, the inline size, an insertion with
   `error` set, a reveal with `error` set and host ARIA values other than `"true"`, **Then** each behaves as User Story
   2 scenarios 9, 10, 11, 13, 14, 15, 16, 18, 19, 20, 22 and 23 describe for the input.
8. **Given** the select, **Then** it shows an open-list indicator drawn with the `chevron-down` icon of the shared set
   in `currentColor`, which is decorative and is also visible in forced colours; **when** the user clicks at the
   centre of the indicator, **Then** the native select takes focus, as a click elsewhere on it does (the indicator
   does not take pointer events).
9. **Given** an `<option>` child, **Then** the light-DOM `<option>` elements themselves are not rendered or exposed
   outside the native select (no duplicate text in the accessibility tree).

---

### User Story 4 - Stories, baselines, axe and records (Priority: P4)

A contributor and the operator see every variant and state of the three elements in Storybook, in light and dark,
with committed baselines and an axe run, and the README, manifest and changelog describe the new surface.

**Why this priority**: constitution V and #7's "Done when"; it depends on Stories 1 to 3 and on #10's harness.

**Independent Test**: Build Storybook and run the `visual` and `axe` gates of #10, the `manifest`, `csp` and `prefix`
gates and the README documentation test.

**Acceptance Scenarios**:

1. **Given** the built Storybook, **Then** it holds a story for each notice tone, each size, with and without a
   heading, and an announcing notice; for each form element its empty, placeholder, filled, with description, with
   error, required, disabled, read-only (input only) and focused states, and the select with option groups; hover is
   declared as #10's harness asks (006 FR-031).
2. **Given** #10's `visual` gate, **Then** every one of these stories has a committed baseline in light and dark that
   matches its capture, and no story is drawn with a font other than Schibsted Grotesk, form-control text included.
3. **Given** #10's `axe` gate, **Then** it reports no serious or critical finding on any of these stories in either
   theme, and no element attaches a closed shadow root.
4. **Given** the `manifest` gate, **Then** the committed manifest declares each element's tag, class, properties and
   attributes with types, defaults and descriptions, events with their detail types, slots, CSS parts and CSS custom
   properties (each list stated even when empty), and it matches a regeneration.
5. **Given** the README documentation test, **Then** the README documents each element's attributes, properties,
   events, slots, parts and the tokens it reads, the form-control convention (FR-020), what "announced" covers and
   what it does not (no real screen reader), and the WebKit limitation; the changelog names the new surface.

---

### Edge Cases

- A notice's body is empty and it has no heading: it renders an empty box with padding only, and announces nothing.
- A notice whose text changes to the same text with different whitespace (`"Saved"` → `" Saved "`): the normalized text
  (whitespace collapsed and trimmed) is unchanged, so nothing is announced.
- A notice moved to another place in the page (removed and inserted in the same task): not a new insertion; nothing
  is announced. A notice removed and inserted again in a later task is a new insertion and is announced.
- An announcing notice inserted while hidden (`hidden`), then shown: nothing is announced while hidden; removing
  `hidden` announces its current text once, as an insertion does (operator answer SPEC-1-10); hiding and showing it
  again announces it once more. The same holds for a hidden announcing notice that is part of the page as first
  loaded.
- A notice whose heading slot holds only an empty or whitespace element (`<span slot="heading"></span>`): the heading
  is absent (FR-006); the notice looks as one without a heading, and its announced text is the body alone.
- Two announcing notices change in the same task: each announces its own text once.
- A form element outside any `<form>`: it works as a control (value, events, validity) and submits nothing.
- A form element with `form="other-form"` naming a form elsewhere in the page: it belongs to that form, as a native
  control does.
- A form element without `name`: its value is not in the form data, as for a native control.
- `ocelle-form-input` with `type="number"` and a non-numeric typed value: the value is `""` and the validity is
  `badInput`, as for a native number input.
- `ocelle-form-select` with no `<option>` children: an empty native select; `value` is `""`; with `required` it is
  `valueMissing`.
- An `error` set while the field has focus: announced once, politely; set to the same text again (with no clearing
  in between): not announced.
- An `error` present in the page as first loaded: not announced and focus does not move; it is read as part of the
  control's description when the user reaches the control (operator answer SPEC-1-11).
- A form control inserted after parsing with `error` already set (the console's htmx swap of a re-rendered form
  fragment): its error is announced politely once; several controls swapped in at once each announce their own error
  once (operator answer SPEC-2-03).
- A notice with a host `role="log"` (or another live role) or a host-written `aria-live`: not supported; the README
  says to use `announce`, `role="alert"` or `role="status"` instead (FR-009).
- A host that adds `role="alert"` or `role="status"` at runtime to a notice without `announce`: nothing is announced
  then by a live region (for `role="alert"` the platform's alert event reads the notice, FR-009); the current text is
  the baseline and later changes announce. Removing the role acts as removing `announce`. Changing `alert` to
  `status` is a politeness change and announces the current text once (FR-008); changing `status` to `alert` is
  carried by the platform's alert event, not by a live region (FR-009, operator decision PLAN-FRESH-2-002).
- A notice whose text changes again less than the announcement wait after the previous change, in the same task or
  in a later one (a progress or count notice fed every 200 ms): the changes merge and only the final text is announced
  once; a notice that keeps changing more often than every wait is not announced until it stops (operator decision
  PLAN-FRESH-2-001); the README says so. The same holds for a control's `error`.
- A notice or form control inside a hidden ancestor (a container with `hidden`, a closed `<details>`, a
  `display: none` panel) that is then shown: not a reveal; nothing is announced. Only the host's own `hidden` counts
  (FR-008, FR-027); the README says so.
- An announcing notice or a form control with `error` that an htmx swap or a script inserts before the browser build
  has loaded: it is in the document when the definition is registered and is upgraded by that registration, so it
  counts as first load and announces nothing (FR-008); the README tells hosts to load the build before such swaps. A
  notice or control an htmx swap inserts after the build has loaded is an insertion, although the browser upgrades it
  already connected (FR-008).
- A form control whose `error` goes `"A"`, then `""`, then `"A"`: "A" is announced each time it is set, since clearing
  `error` resets the baseline; whitespace-only differences do not count (FR-027).
- Long unbroken text (a URL, a digest) in a notice's heading or body, or in a control's label, description or error:
  it wraps inside the box at any character rather than overflowing it, and the box grows in block size. In a container
  narrower than the text, the notice and the form controls stay within the container's inline size; the native
  control's own text (a long value, a long option label) is clipped or scrolled by the browser as in a native control.
- Before the definition has loaded (a not-yet-upgraded element): the light-DOM content shows as the browser draws
  unknown elements (a select's `<option>` children may show as text), and a form element is not in its form's data
  and is not validated. The README says so and tells hosts how to hide undefined elements with a rule in their own
  stylesheet; whether the base stylesheet ships such a rule is settled by the plan.
- Both `label` and an external `<label for>`: the field's name is the external label text, then the `label` text,
  joined by one space (FR-022). A host `aria-label` overrides both.
- A host `aria-labelledby`: not supported (it would cross the shadow root); it does not name the control, and the
  README says to use `label` or `aria-label`.
- A host `aria-describedby` pointing at an element in the page: not supported (it would cross the shadow root); the
  README says to use `description`.
- Right-to-left text (`dir="rtl"`): label, field, description and error follow the inline direction; the select's
  indicator moves to the inline end.
- Two copies of the package on a page: the first definition wins, as for mission 005's elements; form association is
  that of the first copy.

## Requirements *(mandatory)*

### Functional Requirements

**Conventions shared by the three elements**

- **FR-001**: Each element follows the README's "Element conventions" (mission 005): its own module and entry point,
  `define` registration, static token-only styles with `:host([hidden]) { display: none; }`, variant rules inside
  `@media not (forced-colors: active)`, the manifest generated and committed, stories in the existing Storybook, both
  builds (module and browser), and the browser scenarios run in process and on strict-CSP fixture pages. An
  unknown value of an enumerated attribute (`tone`, `size`, `type`) is kept in the attribute as written; the element
  never rewrites it, and only the property reads the default (`tone="bogus"` stays in the attribute while `tone`
  reads `"info"`).
- **FR-002**: Every element attaches an open shadow root and renders every surface inside its own host (006 FR-014,
  FR-027). Styles of form controls inside the shadow root set `font: inherit` (006 FR-025).
- **FR-003**: Elements perform no I/O and emit no event other than those named in FR-024; the native
  composed `input` event of the inner control reaches the host as the browser delivers it.

**`ocelle-notice`**

- **FR-004**: `tone` (attribute and property, reflected): `info` (default), `success`, `warning`, `danger`, `neutral`;
  any other value behaves as `info` and the property reads `"info"`. The notice draws its ground in
  `--ocelle-color-<tone>-bg` and a tone marker, a solid bar of `--ocelle-bar-width` (the shape token for a bar) along
  the box's inline-start edge, in `--ocelle-color-<tone>`; the bar marks the tone together with the ground, so the
  ground colour is never the only mark.
- **FR-005**: For every tone, in both themes, the body and heading text in `--ocelle-color-ink` meet 4.5:1 and the
  marker meets 3:1 against the tone's ground, checked by the repository's contrast check. Where a pair fails, the plan
  changes the element's colour choice (not a token value) or, if no token pair passes, records the token change this
  needs as part of this feature.
- **FR-006**: Slots: `heading` (optional) and the default slot (the body). The heading is drawn at
  `--ocelle-font-weight-strong`; at the regular size in `--ocelle-font-size-subhead` with
  `--ocelle-line-height-tight`, separated from the body by a gap of `--ocelle-space-2`; at the compact size in
  `--ocelle-font-size-sm` with `--ocelle-line-height-compact`, separated from the body by a gap of `--ocelle-space-1`.
  Only elements can be assigned to the `heading` slot. The heading is *absent* when no element is assigned to it, or
  when the text content of all its assigned elements together is empty or whitespace only (for example the
  `<span slot="heading"></span>` a server template writes for a null heading). The rule reads text content only, so a
  heading whose only content is an `ocelle-icon` or an `img` is absent and not drawn, and a heading whose only text is
  inside an `aria-hidden="true"` element is present and drawn but adds nothing to the notice's text (FR-008); the
  README says so. An absent heading renders no heading box and leaves no gap (#513), and contributes nothing to the
  announced text; the layout updates when slotted content changes. CSS parts: `heading` and `body`.
- **FR-007**: `size` (attribute and property, reflected): `regular` (default) or `compact`; any other value behaves as
  `regular`. Regular padding is `--ocelle-space-3` block and `--ocelle-space-4` inline; compact padding is
  `--ocelle-space-2` block and `--ocelle-space-3` inline, with the text at `--ocelle-font-size-sm` and
  `--ocelle-line-height-compact`, the scale of the base styles' compact density hook (#509, the notice's part).
- **FR-008**: `announce` (boolean attribute and property, reflected).
  - *The notice's text* is the heading text, then the body text, each with whitespace collapsed and trimmed, joined by
    one space (an absent or empty part adds nothing and no space). The heading text is taken from the elements
    assigned to the `heading` slot (empty when the heading is absent by FR-006, so an icon-only heading adds
    nothing), the body text from the nodes assigned to the default slot, in tree order: the data
    of each text node, and for an `ocelle-icon` with a non-empty `label` that label and for an `img` with a non-empty
    `alt` that alt, each counted as if surrounded by spaces. The subtree of an element with `hidden` or
    `aria-hidden="true"`, and of `script`, `style` and `template` elements, is skipped. Other accessible names
    (`title`, `aria-label` of slotted elements) do not count.
  - *A change* is any mutation of the notice's light-DOM subtree or of its `tone` or host `role` (child nodes added or
    removed, text data changed, an attribute changed) after which the notice's text or its politeness (FR-009) differs
    from the last text and politeness it announced or, if it has not announced, from those it had when it began
    announcing. A mutation that leaves both unchanged (an `href` change, the same text set again, a re-render) is not
    a change.
  - With `announce` and while the notice is shown (not `hidden`), the notice announces its text once: when it is
    inserted into a document that has finished parsing, when `hidden` is removed (operator answer SPEC-1-10), and on
    each later change. It does not announce when it is part of the document as first parsed, when it re-renders for
    another reason, when it is moved within the page in one task, or when `announce` is set on an existing notice
    (the current text is then the baseline for the next change). Changes while hidden are not announced; the reveal
    announces the text current at that moment. Several changes in one task announce the final text once. By operator
    ruling (PLAN-FRESH-2-001 (a)), so do changes in different tasks that follow each other by less than the
    announcement wait (the plan's `W`: twice Chromium's serialisation delay, 300 ms after load, 700 ms before): the
    announcement comes `W` after the last of them, with the text and politeness current then, and if those equal the
    baseline at that moment nothing is announced (a text that went `A`, `B`, `A`). A notice whose text keeps changing
    more often than every `W` is not announced until the changes stop; the README states `W` and this case. A change
    made while an announced copy is still held is announced after that copy has been in the region for at least `W`,
    so the earlier announcement is not lost.
  - *First load and insertion.* A notice is *part of the document as first parsed* (first load) when it is connected
    while `document.readyState` is `"loading"` (the parser inserts it, whether or not its definition is registered
    yet), or when it is upgraded by the registration of its definition (the `customElements.define` call, which
    upgrades the elements already in the document, shadow roots included), whenever that registration happens (a
    notice an htmx swap or a script inserted before the browser build has loaded included). A notice is *inserted
    into a document that has finished parsing* when it is connected after its definition is registered and while
    `document.readyState` is not `"loading"`, however it is created: `document.createElement`, or fragment parsing
    (`innerHTML`, `insertAdjacentHTML`, `<template>` content, a `DOMParser` document, an htmx swap), where the browser
    upgrades it on insertion, already connected; that upgrade is not first load (plan review PLAN-CORRECTNESS-1-001).
    Both are observable from the element. The README tells hosts to load the build before any swap or script inserts
    announcing notices, since a notice upgraded by the registration does not announce.
  - *Live host role at runtime.* Setting a host `role` of `alert` or `status` on a connected notice without
    `announce` acts as setting `announce` later: the notice's current text and the role's politeness become the
    baseline and nothing is announced. Removing that role (or replacing it with a role that gives no live politeness)
    from a notice without `announce` acts as removing `announce`. Changing the host role from `alert` to `status` or
    the reverse, or adding or removing a live role on a notice with `announce`, is a change by the rule above when the
    politeness it gives differs from the baseline's, and then announces the current text once with the new
    politeness; when the politeness stays the same (a `danger` notice with `announce` that gets `role="alert"`) it
    announces nothing.
  - Without `announce`, with no host `role` or a host role that gives the host's node no live politeness, and with no
    host `aria-live`, `aria-atomic` or `aria-relevant` (the first row of FR-009's table), the notice has no live region
    node and announces nothing. FR-009's unsupported rows are outside this rule.
  - Only the host's own `hidden` attribute counts as hiding and revealing for this requirement. A notice inside a
    hidden ancestor (a container with `hidden`, a closed `<details>`, a `display: none` panel) that is then shown
    enters the tree already holding text and is not announced; the README says so.
- **FR-009**: Politeness: `assertive` for `warning` and `danger`, `polite` for `info`, `success` and `neutral`. A host
  `role` attribute is the host's role as written (the "role override") and is the role of the host's node in the
  accessibility tree. The outcome for each combination, measured as "What 'announced' means here" says:

  | Host role | Without `announce` | With `announce` |
  |-----------|--------------------|-----------------|
  | none, or a role that gives the host's node no live politeness (for example `note`, `region`, `none`) | No live region node at or inside the host; nothing is announced. | One live region node; politeness from the tone; announces as FR-008 says. |
  | `alert` | Announces as FR-008 says, assertively whatever the tone: a host that writes `role="alert"` asks for announcements by the role's own meaning. Insertion after parsing, reveal and a change of the host role to `alert` are carried by the platform's alert event for the host's node, not by a live region (below). | The same. |
  | `status` | Announces as FR-008 says, politely whatever the tone. | The same. |
  | `log`, or any other role that gives the host's node a live politeness | Not supported. | Not supported. |
  | any role, with a host-written `aria-live`, `aria-atomic` or `aria-relevant` on `ocelle-notice` | Not supported. | Not supported. |

  The `alert` and `status` rows are an operator decision (operator answer at spec check 2, "Keep: role implies
  announce"): a host `role="alert"` or `role="status"` without `announce` behaves as `announce` with that role's
  politeness, so insertion after parsing, reveal and each change announce once, and first load never does.

  *Platform alert event* (operator decision PLAN-FRESH-2-002 (a), plan research R-02). Chromium fires an alert event
  for a node with the role `alert` when the node is created, when it stops being ignored (a reveal) and when its role
  becomes `alert`, whatever its live politeness, and screen readers read the node's content on it. For a host
  `role="alert"`, the insertion after parsing, the reveal and a change of the host role to `alert` (from `status`, or
  added at runtime, with or without `announce`) are therefore carried by that event: the notice writes no copy into
  its live region for them and takes the current text and the assertive politeness as its baseline, so the tree
  measure counts zero announcements for them and checks that the host's node has the role `alert`. Text changes, and
  a change of the role from `alert` to `status`, announce through the live region as FR-008 says. The alert event is
  not seen by the tree capture and is not measured; the README names it, its source and that it is Chromium's
  behaviour (WebKit not measured).

  *Not supported* means: the README tells hosts not to write these on the notice (use `announce`, or `role="alert"`
  or `role="status"`), the outcome is not specified, and no scenario tests it; the rules of this requirement and of
  SC-002 cover only the three supported rows.

  In every supported row, first load announces nothing (a server-rendered `role="alert"` notice included), and each
  triggering change is announced by exactly one live region node at or inside the host, or, in the `alert` row for
  the changes the platform's alert event carries, by none: the host's role never adds a second announcement of a
  change, and no live region node whose text changes is nested inside another one whose text
  changes too. Without a host role the notice adds no landmark or live role to the page beyond the live region of
  FR-008.
- **FR-010**: In forced-colours mode the box has a border of `--ocelle-border-width` (1 px) and the marker is drawn in
  `CanvasText`, so each notice stays outlined and marked; text is `CanvasText` on `Canvas`.
- **FR-011**: Slotted content keeps its own semantics and focusability; the notice sets no `tabindex` and traps no
  focus. The notice has no event and no CSS custom property of its own.

**Form-control convention (`ocelle-form-input`, `ocelle-form-select`, and #14 after them)**

- **FR-020**: Both are form-associated custom elements (operator decision). The native control, the visible label, the
  description and the error live in one open shadow root, and every ID reference among them stays inside it. The host
  takes part in its form through `ElementInternals`: it submits its value under `name` (none without `name` or when
  disabled), joins the form named by a `form` attribute, follows a `fieldset`'s disabled state, restores its default
  value on form reset and its state on history restore, and is associated with an external `<label for>`. Restore
  by autofill is not measured (no test can trigger autofill); the README lists it under its limitations, as it does
  WebKit. The README documents this as the convention later form-like elements follow.
- **FR-021**: Shared attributes and properties: `name`, `label`, `description`, `error`, `required`, `disabled`
  (all reflected) and `value` (property; the `value` attribute of the input is its default value, restored on reset).
  As for a native input, changing the input's `value` attribute changes the current value only while the value is not
  dirty (the user has not edited it and no script has set `value` since the last reset); once dirty, it changes only
  the default. The select has no `value` attribute: its default is the option marked `selected` (FR-031), and a
  host `value` attribute on it is ignored (README). Neither element exposes a `defaultValue` property.
  The host exposes `form`, `labels`, `validity`, `validationMessage`, `willValidate`, `checkValidity()` and
  `reportValidity()` as a native control does. `focus()` on the host focuses the inner control; the host is not a
  separate tab stop.
- **FR-022**: Naming: the inner control's accessible name is, in this order of precedence (constitution III: ARIA
  set on a host reaches the inner control):
  1. a non-empty host `aria-label`: its text, alone, whatever else is set. When a visible label is drawn (the
     `label` text or an external `<label>`), the `aria-label` must contain the visible label text (WCAG 2.2 SC 2.5.3);
     the README says so, and a host `aria-label` that does not contain it while a visible label is drawn is not
     supported (operator decision PLAN-A11Y-SECURITY-1-006);
  2. otherwise the text of each external `<label>` associated with the host (in `element.labels` order), then the
     `label` text, each with whitespace collapsed and trimmed, joined by one space (for example "Title Lane title");
     either part may be missing;
  3. with none of them the control has no name, and the README says one is required.

  A host `aria-labelledby` is not supported (it would reference across the shadow root): it does not name the
  control, and the README says to use `label` or `aria-label`. The `description` is the control's accessible
  description; a host `aria-describedby` is not supported (README).

  Other ARIA states and properties a server template may write on the host (`aria-invalid`, `aria-required`,
  `aria-disabled`, `aria-description`) must reach the inner control and must not stay as a second, differing state
  on the host's node (constitution III). How each one combines with the element's own `error`, `required`,
  `disabled` and `description` is settled by the plan, and the README documents it together with the advice to use
  the element's own attributes. For `aria-invalid`, `aria-required` and `aria-disabled` this rule covers the host
  value `"true"` only: a host value other than `"true"` (such as `"false"`) does not change the inner control's state,
  which follows the element's own attributes, and is not supported (the host's node may then carry a state that
  differs from the control's; the README tells hosts to write only `"true"` or nothing; operator decision
  PLAN-CORRECTNESS-1-006, User Story 2 scenario 23). A host `aria-label` and `aria-description` stay on the host
  (the element does not rewrite host attributes), so the host's node carries the same name and description as the
  control beside it; the README says so and a test pins the tree (operator decision PLAN-A11Y-SECURITY-1-005).
- **FR-023**: Validity mirrors the inner control's native constraint validation (`required`, `type`, `minlength`,
  `maxlength`, `pattern`, `min`, `max`, `step` for the input; `required` for the select): the host's validity flags
  and message equal those of the inner control, and `reportValidity()` focuses the inner control and makes the
  browser show its validation message. Where the browser draws that message (its anchor) is in neither the DOM nor
  the accessibility tree, so it is not measured; the README lists it under its limitations.
- **FR-024**: Events: the native `input` event of the inner control reaches host listeners (it is composed), with
  the host's `value` already updated; on each committed change (the change the native control signals with its own
  `change` event) the host dispatches `ocelle-form-input-change` or `ocelle-form-select-change`, a `CustomEvent` with
  `detail: { value: string }`, `bubbles: true`, `composed: true`. No event is dispatched for a change made by script,
  by reset or by restore.
- **FR-025**: Size: the host is `display: block` and the control fills the host's inline size (operator answer
  SPEC-1-12); the element sets no width of its own, so in a filter bar the host page sets the element's width or
  places it as a flex or grid item. Look: the label above the control in the label text style
  (`--ocelle-font-size-sm`, `--ocelle-font-weight-strong`, `--ocelle-line-height-normal`, `--ocelle-color-ink`), the
  control on a ground of `--ocelle-color-sheet` with a boundary of `--ocelle-border-width` (1 px) in
  `--ocelle-color-control-border` (never `--ocelle-color-rule`), radius `--ocelle-radius-2`, block size at least
  `--ocelle-target-min`, the token focus ring on `:focus-visible`, disabled colours from `--ocelle-color-disabled-*`,
  and the description under it in `--ocelle-color-ink-muted` at `--ocelle-font-size-sm` and
  `--ocelle-line-height-normal`; the error (FR-028) uses the same size and line height. The placeholder's 4.5:1 is
  measured against `--ocelle-color-sheet`. The form controls are placed on the main grounds that
  `--ocelle-color-control-border` is checked against (canvas, sheet, pane, panel, inspector, rail); a control placed on
  a state ground, `--ocelle-color-accent-low`, an inset or a hover ground (where the token record asks for
  `--ocelle-color-accent-strong`) is not supported in this feature, and the README says so. In forced-colours mode
  the boundary uses `ButtonBorder` or `CanvasText` and the focus ring `Highlight`.
- **FR-026**: CSS parts: `label`, `control`, `description`, `error`. Slots: none (label, description and error are text
  attributes, so their content cannot cross the shadow root; the select's `<option>` children are read, not slotted,
  per FR-031).
- **FR-027**: `error` (operator decision, announce only): a non-empty, non-whitespace `error` is shown under the
  control, makes the control report invalid to assistive technology, is added after the description to its accessible
  description, and is announced politely once each time its text changes, after the document has finished parsing,
  to a new non-empty text (measured as "What 'announced' means here" says). An `error` present when the page is first
  loaded is not announced and does not move focus; it is read as part of the control's description and invalid state
  when the user reaches the control, and the README tells hosts to put an error summary or a notice at the top of the
  page and focus it (operator answer SPEC-1-11). A form control inserted into a document that has finished parsing
  with a non-empty `error` already set (an htmx swap of a form fragment, or a script) announces that error politely,
  once, as an inserted notice does (operator answer SPEC-2-03, "Announce once per control"); when several such
  controls are inserted at once, each announces its own error once. Moving a control within the page in one task is
  not an insertion, as for the notice. "First loaded" and "inserted into a document that has finished parsing" are
  defined for form controls as FR-008 defines them for the notice ("First load and insertion"). The element never
  moves focus because of `error`. It does not change the host's form validity or block submission; the host clears
  it. An empty `error` shows nothing.

  The error text is compared with whitespace collapsed and trimmed; an `error` that is empty or whitespace only after
  that counts as empty. "A new non-empty text" is measured against a baseline: the error text the control last
  announced, or the text it held at first load if it has announced nothing since; setting `error` to empty resets
  the baseline to empty, so `"A"`, then `""`, then `"A"` announces "A" twice. Only the host's own `hidden` counts as
  hiding: while the host is `hidden`, no error is announced and changes of `error` are not announced on their own;
  removing `hidden` announces the error current at that moment once, politely, if it is non-empty, as an insertion
  does (the same rule as the notice's reveal, operator answer SPEC-1-10). A control revealed through a hidden
  ancestor announces nothing (FR-008). Changes of `error` that follow each other by less than the announcement wait,
  in one task or in different tasks, announce only the final text once, compared with the baseline when the wait
  ends, as FR-008 rules for the notice (operator decision PLAN-FRESH-2-001 (a)).
- **FR-028**: The error text is drawn in `--ocelle-color-danger` (meeting 4.5:1 on the main grounds) with a non-colour
  mark: the control's boundary becomes `--ocelle-color-danger` and `--ocelle-bar-width` (3 px) wide instead of
  `--ocelle-border-width`, so the error state is not shown by text colour alone. Both are existing tokens; this
  feature adds no width token.

**`ocelle-form-input`**

- **FR-029**: `type` (attribute and property, reflected): `text` (default), `email`, `url`, `tel`, `search`,
  `password`, `number`; any other value behaves as `text`. `placeholder`, `readonly`, `autocomplete`, `inputmode`,
  `minlength`, `maxlength`, `pattern`, `min`, `max` and `step` are passed to the inner field unchanged. Each is an
  attribute and a reflected property of the same name (`readOnly`, `minLength` and `maxLength` use the camel case a
  native input uses, `inputMode` likewise): `readOnly` is boolean, `minLength` and `maxLength` are numbers (absent
  means no limit), and the others are strings (absent means not set).
- **FR-030**: Pressing Enter in the field submits its form as a native input does (implicit submission), after the
  `ocelle-form-input-change` event if the value changed. For Enter pressed in the element's own field, the host
  counts as a field that blocks implicit submission, as a native text input does, so a form with no submit button
  and two such fields (or one such field and one native text input) does not submit on Enter; a form whose
  constraints fail does not submit and shows the validation message instead (User Story 2 scenario 21). For Enter
  pressed in a native field of the same form, the browser applies its own rule, which does not count the element;
  the element does not reach outside its host to change that, and the README lists the mixed-form case under its
  limitations (plan review PLAN-FRESH-1-003).

**`ocelle-form-select`**

- **FR-031**: The element's light-DOM `<option>` and `<optgroup>` children are the source of the choices: the native
  select inside mirrors their order, labels, values, `selected` (as the default selection, restored on reset) and
  `disabled`, and follows every later change to them. The light-DOM children are not rendered and not exposed. One
  choice only: there is no `multiple` and no `size` list mode.
- **FR-032**: The select draws an open-list indicator with the shared icon set's `chevron-down` in `currentColor`,
  decorative (hidden from the accessibility tree), visible in forced colours, at the inline end under either text
  direction. The native select's own keyboard behaviour is not changed.

**Stories, gates and records**

- **FR-033**: Each element has a Storybook story per variant and state (User Story 4 scenario 1), in light and dark,
  written as the contributor note of #10's harness says (006 FR-025, FR-031). Each story has a committed baseline from
  #10's pinned container, passes the `visual` and `axe` gates, and passes the `csp` and `prefix` gates' Storybook
  checks. This feature is implemented after #10 is on `main` (operator wave planning); if #10's harness differs from
  the design in `specs/006-storybook-workbench` when it lands, the plan is rechecked before the stories phase.
- **FR-034**: The manifest declares, for each element, every public property and attribute (type, default,
  description), every event with its detail type, every slot (the notice's two; none for the form elements), every
  CSS part and every CSS custom property (none), each list stated even when empty. For the form elements the
  declared members include the pass-through properties of FR-029, the read-only properties `form`, `labels`,
  `validity`, `validationMessage` and `willValidate`, and the methods `checkValidity()`, `reportValidity()` and
  `focus()` (FR-021). Standard attributes the elements observe without a property of the same meaning (`role` on the
  notice; `aria-label` and the other host ARIA attributes of FR-022 on the form elements; the `form` attribute, whose
  like-named property is the read-only owning form, as on a native control) are not declared as attributes, as the
  conventions say, and the README documents them. The manifest adds no new kind of source path (#27).
- **FR-035**: The README gets one section per element and a "Form controls" section (FR-020 to FR-028), names the tokens
  each element reads, defines what "announced" covers in the tests (accessibility tree, not a screen reader), and
  states the WebKit limitation for form association, `ElementInternals` and live regions and that restore by autofill
  is not measured, tells hosts how to surface a first-load `error` (FR-027), and names the notice's unsupported host
  roles and attributes (FR-009). It also states: that slotted content other than what FR-008 names gives an
  unspecified announced text ("What 'announced' means here"); that only the host's own `hidden` counts as a reveal
  (FR-008, FR-027); that hosts load the build before swapping in announcing notices or controls with `error`
  (FR-008); that an icon-only heading is absent (FR-006); the limitations not measured (the validation message's
  anchor, the `email` keyboard hint, `password` masking, the select's list opening); that form controls are not
  supported on state grounds (FR-025); how host ARIA attributes combine with the element's own (FR-022), that only
  `"true"` is supported for host `aria-invalid`, `aria-required` and `aria-disabled`, that a host `aria-label` must
  contain the visible label text, and that a host `aria-label` and `aria-description` also stay on the host's node;
  how announcements reach the tree (a separate live region holding a copy of the text, written after the
  serialisation delay, and the delay); the announcement wait, that changes closer together than it merge and that a
  text changing more often than it is not announced until it stops (FR-008); how long a copy is held, that the figure
  is not measured by the tree capture, and that a browse-mode user may meet the text twice for that time; that for a
  `role="alert"` notice the insertion, reveal and change to `alert` are read through the platform's alert event, with
  its source (FR-009); the mixed-form implicit-submission case (FR-030); the
  not-yet-upgraded state (Edge Cases); and, for htmx hosts, that the trigger is `hx-trigger="ocelle-form-input-change"`
  or `"ocelle-form-select-change"` (or `input`), since the native `change` event does not leave the shadow root and
  htmx's default trigger for an unknown element is `click`. A documentation test checks
  that these sections exist and name each attribute, event, slot and part.
- **FR-036**: The `@ocelle/elements` changelog names the three elements and their attributes, properties, events,
  slots and parts as new (MINOR). The engine floor in the README is raised if an element uses a feature newer than it.

### Key Entities

- **Notice**: a message with a tone (five values), an optional heading, a body, a size, and an announcement mode;
  its announced text is heading and body joined, as FR-008 defines it.
- **Announcement**: one change of a live region's text to a new non-empty text with a politeness (polite or
  assertive), caused by an insertion, a reveal, a text change or a politeness change of an announcing notice, or by a
  new error text of a form control after first load, or by the insertion after parsing or the reveal of a form
  control holding an error. For a `role="alert"` notice, the insertion, reveal and change to `alert` are carried by
  the platform's alert event instead (FR-009), which the tree measure does not count.
- **Form control**: a form-associated element with a name, a value, a default value, a validity, a label, a
  description, an error text and a disabled state; the input adds a type and its native constraints, the select a list
  of options and option groups read from its children.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every acceptance scenario of User Stories 1 to 3 passes on the in-process run and on the strict-CSP
  fixture pages, with zero CSP violations reported.
- **SC-002**: For each of the five tones, the announcement scenarios count exactly one announcement per triggering
  change (insertion, reveal, text change, politeness change) and zero for each non-triggering one (first load, same
  text, re-render, move, `announce` set later, change while hidden), for each supported host role row of FR-009. In
  the no-role row a politeness change is a tone change across politeness; in the `alert` and `status` rows, where the
  tone sets no politeness, it is a runtime role change from `alert` to `status` or the reverse (FR-008, "Live host
  role at runtime"), and setting a live role at runtime counts with "`announce` set later". Changes that follow each
  other by less than the announcement wait count as one triggering change (FR-008, operator decision
  PLAN-FRESH-2-001). In the `alert` row, insertion, reveal and the role change from `status` to `alert` count zero
  live-region announcements, with the host's node having the role `alert`: they are carried by the platform's alert
  event, not by a live region (FR-009, operator decision PLAN-FRESH-2-002).
- **SC-003**: Over all combinations of these factors: `name` present or absent, `required` with an empty and with a
  non-empty value, `disabled` set or not, inside a `fieldset disabled` or not, and the state as set, after a form
  reset and after a history restore, the form data and validity flags of each form element equal those of a native
  `<input>` or `<select>` with the same attributes and value, entry by entry.
- **SC-004**: A notice with an absent heading (FR-006) has zero pixels between the top of its content box and the top
  of its body's first line box, in both sizes, with and without forced colours (#513).
- **SC-005**: Every story of the three elements has a committed baseline in light and dark and zero serious or
  critical axe findings, and the manifest, csp, prefix and documentation checks pass.
- **SC-006**: The README's form-control section answers, without further design, how a later form-like element takes
  part in forms, names its control and shows an error: the documentation test finds the items of FR-020 to FR-028.
  This is a presence check; whether the text answers the question is judged in review.
- **SC-007**: Changed source is mutation-tested under the repository's mutation gate with no surviving mutant in new
  code that the review does not record as equivalent.

## Assumptions

- The tone of a notice is also stated by its text (hosts write "Saved", "Run failed"); the marker and ground support it
  visually and are not the only carrier of meaning, so no tone icon is required. The notice does not draw a tone icon
  of its own; a host may slot an `ocelle-icon` into the body or heading. A tone icon set can be added later as a MINOR
  change.
- No dismiss button or action slot is added to the notice: #9 names neither, and a dismiss control would depend on
  #7's `ocelle-button`. Toasts and notice stacks are out of scope.
- `textarea`, checkbox, radio, multi-select, combobox with typing and the selection elements of #14 are out of scope;
  #14 follows FR-020.
- The form elements perform no validation logic of their own beyond the native constraints (constitution I); server
  validation reaches them as `error` text.
- The compact notice uses the existing compact scale tokens; no new size token is needed. If the contrast check shows
  a tone pair failing (FR-005), the needed token change is part of this feature.
- The contrast records of `--ocelle-color-ink` list only the main grounds today. Checking ink and the markers
  against the five state grounds (FR-005) needs contrast metadata for those pairs in the token records; adding it is
  part of this feature.
- `type` values `tel`, `password` and `number` and the attributes `min`, `max` and `step` have no named consumer: #9
  names only "type". They are kept knowingly as a small stated addition without a named consumer (constitution VI):
  they pass native attributes through to the inner field and raise no design question of their own.
- The plan must settle, at the latest before its tasks: the accessibility-tree capture ("What 'announced' means
  here"); how host ARIA states combine with the element's own attributes (FR-022); and whether the base stylesheet
  hides not-yet-upgraded elements (Edge Cases).
- Chromium exposes a single native select as a combobox; scenarios name Chromium's roles. WebKit's roles, form
  association and live-region behaviour in shadow roots are not measured (README, Engines).
- #10 (mission 006) lands on `main` before this feature's implementation starts (operator wave planning); its design is
  read from branch `claude/010-storybook-workbench`, `specs/006-storybook-workbench` (spec FR-025, contracts/gates.md,
  contracts/container.md) and must be rechecked when #10 lands.
- Parallel missions (#16 as 008, #15 as 009, #8 as 011) edit `packages/elements/src/index.ts`,
  `custom-elements.json` and the Storybook configuration; conflicts are resolved by merging `main`, never by rebasing.
- spec-kitty-design#509, #513 and ADR-0078 were not read. The operator confirmed at spec check 1 that #9's wording is
  sufficient and is the requirement for them (SPEC-1-09); their texts are not read for this feature.
