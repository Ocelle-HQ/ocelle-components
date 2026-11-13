# Research: Feedback and Forms

Phase 0 of `/speckit-plan` for `specs/010-feedback-forms`. Each entry: decision, rationale, alternatives. Measured
items say where they were measured: "spike 2026-11-13" means a Playwright script against the pre-installed Chromium in
this session (scripts not committed; their outcome is recorded here and re-measured by the phase-1 spike task).

## R-01 The accessibility-tree capture ("What 'announced' means here", spec Assumptions)

**Decision.** A *paused-mutation capture with rendering-update tags* (operator decision PLAN-TESTABILITY-1-001 (a)).
A test-only recorder is a `MutationObserver` (childList, attributes, characterData, subtree) whose callback executes
`debugger`. The test side holds a CDP session with `Debugger` and `Accessibility` enabled; on each `Debugger.paused`
it reads `Accessibility.getFullAXTree`, extracts every live region node at or inside a watched host (a non-ignored
node whose `live` property is `polite` or `assertive`), computes each region's text with the pure reading function
`regionText(nodes, region)` (the spec's reading: StaticText and `img` names in tree order, an `img`'s descendants not
visited, other names skipped, inline text boxes skipped, ignored nodes contributing nothing, whitespace collapsed and
trimmed), records the role of each `ocelle-*` host's own node from the same tree (for `hostRole`, contracts/testing.md,
PLAN-FRESH-2-002), appends the snapshot, and resumes.

Each snapshot is tagged with the time (`performance.now()` in the page) and a rendering-update counter. The recorder
also runs a test-side frame hook: a `requestAnimationFrame` callback that posts a `MessageChannel` message, whose
handler runs after that rendering update's style, layout and accessibility lifecycle; the handler increments the
counter and takes a *lifecycle snapshot*. A region state (its text) is *rendered* when it is current in at least one
lifecycle snapshot, and *settled* when it is rendered and stays current for at least the serialisation delay `D` of
Chromium (`AXObjectCacheImpl::GetDeferredEventsDelay()` in
`third_party/blink/renderer/modules/accessibility/ax_object_cache_impl.cc`, main, read 2026-11-13:
`kDelayForDeferredUpdatesAfterPageLoad` 150 ms, `kDelayForDeferredUpdatesBeforePageLoad` 350 ms; the capture takes
the value for the page's load state when the state began). The capture holds its own copy of these figures; it does
not read the element's. In process both the element and the capture take a shorter test value of `D` from one
constant in `test/in-process.ts` (operator decision PLAN-FRESH-2-003 (a), R-09); fixture pages keep Chromium's 150
and 350 ms.

`announcements(snapshots, rule)` is a pure function: it keeps, per region node, only the states that satisfy `rule`
(`"settled"` or `"rendered"`), then counts as the spec defines (a region in two consecutive kept states whose text
changed to a non-empty text). Every announcement assertion checks the expected count under both rules: `"settled"`
is the spec's measure, and `"rendered"`, which keeps more states, makes sure that a short-lived state cannot hide an
unwanted announcement (for a zero count) or an extra one (for a count of one). A withhold, or a text write, that
happens in a microtask or in the first animation frame is not settled and counts zero; plants of both kinds are run
(`contracts/testing.md`).

**Arming** (PLAN-TESTABILITY-1-002, PLAN-TESTABILITY-1-003). `liveCapture.start(containerId)` arms on a container
that exists before the step: it observes the container's subtree and every open shadow root inside it, and the
recorder patches `Element.prototype.attachShadow` in the page so that each shadow root attached later (Lit attaches
its render root in `connectedCallback`) is observed from the moment it is attached; nested roots included. Regions are
keyed by their node and by the nearest `ocelle-*` host at or above them, so "at or inside the first control's host"
is checkable. On fixture pages a *document mode*, `liveCapture.startDocument(url)`, enables `Debugger` and
`Accessibility`, installs the recorder with `Page.addScriptToEvaluateOnNewDocument` and then navigates, so the
recorder sees the document from its first node; every first-load assertion on fixture pages uses it. In process,
first load is reached by registration (R-09), with the capture armed on the container before the registration.

**Bounds** (PLAN-TESTABILITY-1-009). A capture fails its step with an assertion ("capture exceeded 2000 pauses",
"capture step exceeded 5000 ms") well before the Vitest and Stryker timeouts, so a mutant that loops mutations ends
Killed, not Timeout; the figures are re-measured in T002 against the longest scenario.

**Rationale.** A snapshot per mutation batch sees every DOM state, and the tags say which of them a rendering update
and a serialisation could have handed to assistive technology. The untagged capture recorded states that no lifecycle
exposes (PLAN-FRESH-1-001, PLAN-TESTABILITY-1-001: an `aria-hidden` set in a task and removed in the first
`requestAnimationFrame` is gone at the first layout, and a state set and cleared in one task was recorded as an
announcement), so it could prove only the oracle. The spike result of the first plan draft (`polite:""`,
`polite:""`, `polite:"Saved"` for a one-frame withhold) was measured with that untagged capture and is not evidence
that the design works; T002 re-measures with the tags. `getFullAXTree` while paused returns the tree for the current
DOM (it brings layout and the accessibility cache up to date before answering).

**Alternatives.** CDP `Accessibility.nodesUpdated`: measured, never fired (0 events over an insertion and a text
change, with `Accessibility.enable` and a prior full-tree read). Polling `getFullAXTree` each frame: misses states
between frames and is ruled out by the spec. Snapshots only at lifecycle points (no pauses): cannot show what happened
between two frames, so a flicker inside a frame would be invisible to the `"rendered"` check. Chromium's internal
live-region events: not exposed over CDP. A real screen reader: not available in CI (spec). The operator's other
option (b), redefining the measure as "after each mutation batch, tree forced up to date", was declined.

**Limits, recorded in the README (FR-035).** The capture shows what the accessibility tree holds and for how long;
what a screen reader then speaks is not measured, and the serialisation delay is Chromium's current value, read from
its source, which a later Chromium may change. Whether the in-process harness (Vitest browser mode, where the tested
page is an iframe of the runner) tolerates `debugger` pauses and the frame hook is re-measured by the phase-1 spike task
T002; if it does not, the announcement scenarios cannot run in process, Stryker cannot kill mutants in the
announcement code, and the plan stops for an operator decision before phase 2 (fork recorded in the spike note).

## R-02 How the notice announces

**Decision** (operator decisions PLAN-FRESH-1-001 (b) and PLAN-A11Y-SECURITY-1-002 (a); at plan squad round 2
PLAN-FRESH-2-001 (a), PLAN-FRESH-2-002 (a) and PLAN-FRESH-2-005 (b); at round 3 PLAN-FRESH-3-002 (b)). A *separate announcer region*: the visible content is never inside a live region and is never hidden from the tree; a copy of the notice's
text is written into a persistent, visually hidden live region after Chromium's serialisation delay.

Shadow structure: `<div class="box tone-<tone> size-<size>">` (R-03) > `<div part="heading">` (with
`<slot name="heading">`) and `<div part="body">` (with the default `<slot>`); after the box, a sibling
`<div class="announcer" aria-live="<politeness>|off" aria-atomic="true">`, visually hidden (the clip pattern), whose
only content is a text node holding the copy or nothing. The element keeps two facts: *live* (is it announcing:
`announce`, or a host `role` of `alert` or `status`) and *politeness* (host `alert` → assertive, host `status` →
polite, else tone: `warning`, `danger` → assertive, others polite). The announcer's `aria-live` is the politeness while
live and `off` otherwise, so a notice that is not live has no live region node (US1 scenario 7).

**The host's node.** A host `role="alert"` or `role="status"` would make the host's own node a live region holding the
visible content, so a write into the announcer would change two live regions (FR-009, "exactly one"). The element
therefore sets `internals.ariaLive = "off"` (an `ElementInternals` default, not a host attribute; a host-written
`aria-live` stays unsupported, FR-009), and the announcer is the one live region node in every supported row. That
Chromium then reports the host's node with its role and without a live politeness is measured in T002; if it does not,
the plan stops for the operator before phase 2.

**The platform alert event** (PLAN-FRESH-2-002 (a)). `internals.ariaLive = "off"` does not stop Chromium's alert
event: `ui/accessibility/ax_event_generator.cc` (main, read 2026-11-13) adds `Event::ALERT` in `OnRoleChanged` when
the new role is an alert role (line 394), in `OnIgnoredChanged` when an alert node becomes unignored (lines 416-417)
and for a created alert node (lines 1081-1082, before the live-region branch and without consulting live
politeness); `IsAlert` in `ax_role_properties.cc` is `kAlert` and `kAlertDialog`. Screen readers voice that event with
the node's content, here the visible notice. A copy written for the same change would be a second reading. So, for a
host whose role is `alert`, the element writes no copy for an insertion after parsing, a reveal or a change of the
host role to `alert` (from `status`, or added at runtime, with or without `announce`): it cancels any pending wait
(a held copy is emptied once it has been current for `W`, step 1 below), sets the announcer's `aria-live` to
`assertive`, and takes the baseline at the end of the current task (operator decision PLAN-FRESH-3-002 (b)): it marks
the baseline pending and posts a message on the module's `MessageChannel` (the one the move detection uses); the
handler runs in a later task, after the current task's `MutationObserver` records are delivered, and sets the
baseline to the text and politeness current then. Until it runs, light-DOM mutations and `tone` changes start no
wait (data-model.md gives every other row for these events the condition that no alert baseline is pending, so each
event matches one row). So the common
`host.append(n); n.textContent = msg`, reveal-then-fill and role-then-fill in one task are read once, by the alert
event, which reads the node at the next serialisation (at least `D` after the task, R-01), and no copy follows. A
baseline taken synchronously would hold the text from before the fill, the microtask observer would see a
difference and write a copy `W` later: a double reading. The cost, accepted by the operator and stated in FR-009 and
the README: a change made in a later task but before that serialisation (less than `D` after the trigger) is read
twice, by the alert event and by the copy, since the element cannot know when the serialisation happened; the README
tells hosts to set the text before, or in the same task as, the insertion, reveal or role change. The declined
alternatives were a `W` window after the trigger in which changes only move the baseline (option (a), a change after
the serialisation and before the window's end read by neither) and keeping the synchronous baseline with the double
reading documented (option (c)). A role change away from `alert` that keeps the notice live (to `status`, or the
role removed from a notice with `announce`) before the end-of-task step has run clears the pending baseline and
acts as the trigger would have under the new role, since Chromium has not serialised the `alert` role yet and fires
no alert event: an insertion or a reveal announces the current text with the new politeness (baseline none), a
change to `alert` compares the text and politeness with the baseline from before it, and a role set on a notice that
was not live takes the current text and politeness as the baseline and announces nothing (plan squad round 3
verify 1). The pending marker records which of these triggers set it. Text changes of an `alert` notice once the
step has run, and a role change from `alert` to `status` after it, go through the announcer as below.

The event does not depend on what made the node created or unignored (PLAN-FRESH-3-003): `OnIgnoredChanged` adds
`Event::ALERT` for any alert node that becomes unignored (lines 416-417) and `OnAtomicUpdateFinished` for any alert
node created in the update (lines 1081-1082). A `role="alert"` notice inside a hidden ancestor (a container with
`hidden`, a closed `<details>`, a `display: none` panel) that is then shown is created or unignored too, so Chromium
reads it, although the element sees no change and writes no copy; the `status` and `announce` rows are not
announced in that case. The spec's hidden-ancestor rule (FR-008) and the README say so: read for `alert`, by the
platform event, Chromium only and not measured; not announced for the other rows. The capture counts zero
live-region announcements for it in every row, which for the `alert` row says nothing about the event. The capture cannot see the event, so the
scenarios for these cells assert a zero count and that the host's node has the role `alert` (spec FR-009, SC-002);
the README names the event, its source lines, that it is Chromium's behaviour (WebKit not measured) and that a later
Chromium may change it. What the event does on first load (a server-rendered `role="alert"` notice) is not measured
either, and the README says so.

**Announcing** (the `Announcer` of `src/live.ts`, shared with R-06). With `W = 2 × D` and `D` the serialisation delay
of R-01 for the document's current load state (150 ms once `document.readyState` is `"complete"`, 350 ms before, so
`W` is 300 ms or 700 ms; source and figures in the README), and the hold `H` = 5000 ms, an announcement:

1. if the announcer holds a copy, waits until that copy has been current for at least `W` (the *minimum hold*), then
   empties the announcer; sets its `aria-live` to the current politeness;
2. waits until the announcer has been live, shown and empty for `W` (a timer; a new trigger while waiting restarts
   the wait, so changes less than `W` apart, in one task or in different tasks, write only the final text: spec
   FR-008 as amended by operator decision PLAN-FRESH-2-001 (a)); a text that keeps changing more often than every
   `W` is therefore not announced until it stops (README);
3. when the wait ends, computes the notice's text as FR-008 defines it and the politeness from the DOM at that
   moment and compares them with the baseline: if both are equal (a text that went `A`, `B`, `A`), or the text is
   empty, it writes nothing and the announcer stays empty; otherwise it writes the text as the copy and sets the
   baseline to that text and politeness. An insertion or a reveal sets the baseline to none before its wait
   (PLAN-FRESH-3-001), so a wait that includes one always writes the current non-empty text and only the cancel
   triggers stop it; the comparison can drop only a wait made of changes alone. Without that reset, a notice first
   loaded hidden (baseline: its text) or announced, hidden and revealed with the same text would compute text equal to
   the baseline on reveal and write nothing, against spec US1-17 and SC-002;
4. holds the copy for `H` and then empties the announcer; a trigger during the hold goes back to step 1, so the
   copy is emptied no earlier than `W` after it was written (more than `D`, so at least one serialisation hands it
   to assistive technology; PLAN-FRESH-2-001's lost announcement).

`H` is a bounded hold set from the assistive-technology side, not from Chromium's serialisation delay (operator
decision PLAN-FRESH-2-005 (b)): a Windows screen reader acts on the live-region event and then fetches the region's
text out of process, and a busy or lagging screen reader may fetch it well after the next serialisation, so a copy
emptied after `W` could be read as empty. No figure for that latency was measured or found for this plan, and the
capture cannot measure it; 5000 ms is chosen as "several seconds", more than fifteen times `W` after load, and the
README records it as a chosen figure that the tests do not prove. A scenario asserts that the copy stays current
(settled) for `H` and is then emptied (spec User Story 1 scenario 13).

Every announcement is therefore the whole text written into a region that has been empty across several rendering
updates and serialisations, with `aria-atomic="true"` (PLAN-A11Y-SECURITY-1-003: an `aria-live` div is not atomic by
default, and a removal-only change, such as `aria-hidden` set on the slotted link of US1 scenario 19, would not be
announced by AT under the default `aria-relevant`). Text changes, politeness changes, insertions and reveals use the
same path; none hides the visible content, so a focused slotted link stays focused and exposed (US1 scenarios 12, 15;
PLAN-A11Y-SECURITY-1-002: Chromium ignores `aria-hidden` on an ancestor of the focused element, which ruled out
content withholding).

**Triggers.** Insertion after parsing (not a move, not first load), reveal (the host's `hidden` removed), and a change
by FR-008's rule: a light-DOM `MutationObserver` (childList, characterData, attributes, subtree) and the heading
`slotchange`, together with `tone` and host `role` changes, recompute the text and politeness and compare them with
the baseline (the last announced text and politeness, or those current when the notice began announcing; none from
an insertion or a reveal until the next write). `announce` set, or a live role set on a notice that was not live,
only sets the baseline. While the host is `hidden` the
announcer stays empty and a pending announcement is cancelled; the reveal triggers with the text current then. A
notice that stops being live cancels any pending announcement and empties the announcer.

**First load** (FR-008, PLAN-CORRECTNESS-1-001). `src/define.ts` sets a module-level flag while its
`customElements.define` call runs and exports a reader; the constructor records whether the flag is set (the elements
the registration upgrades, in the document and in shadow roots, are constructed inside that call, measured in the
review's probe). The first `connectedCallback` counts as first load when that was recorded or `document.readyState`
is `"loading"` (read through one function of `src/live.ts`, which the in-process test drives, R-09). Every other
connection is an insertion, including the fragment-parsed ones (`innerHTML`, `insertAdjacentHTML`, `<template>`
content, `DOMParser`, htmx), which the browser upgrades on insertion, already connected: the first plan draft's rule
("the constructor records `this.isConnected`") classed those as first load and is kept only as a plant. The browser
build is a module script and runs after parsing, so every notice in the server's HTML is upgraded by the registration:
first load, as the spec says. On first load the announcer is present and empty; nothing is written until a change.

**Move in one task**: `disconnectedCallback` sets a flag and posts a message on a module-level `MessageChannel`; its
handler, which runs in a later task, clears the flags and cancels the pending announcement of an element that is still
disconnected. A `connectedCallback` that finds the flag set is a move and does not trigger (a pending announcement
continues). A removal and an insertion in different tasks are therefore an insertion; tests make the later task with
the driver's `laterTask()` step (`contracts/testing.md`), not with `setTimeout(0)`, whose order against the
`MessageChannel` task source the HTML standard leaves to the UA (PLAN-TESTABILITY-1-011).

**Heading absent** (FR-006): on `slotchange` of the heading slot and on the light-DOM `MutationObserver` the element
computes whether the assigned elements' text content is empty after whitespace collapse; the heading part gets
`hidden` (no box, no gap: the gap is the heading part's `margin-block-end`).

**Costs, re-justified against the first draft's rejection of a separate region.** The first draft rejected a separate
region because it "reads the text twice". That cost is accepted and bounded: the copy exists for at most `H` (5 s)
after each announcement, or until the next announcement's step 1 (no earlier than `W`), so a browse-mode user meets
the text twice only within that window (README; the bound was `W` before PLAN-FRESH-2-005 and is restated for the
operator with that decision); the element computes the
text itself, which FR-008 defines on the DOM side precisely enough to do so (spec "What 'announced' means here": for
the content FR-008 names, the tree reading equals that text). Announcements reach the tree `W` after the trigger
(300 ms after load). The alternative of hiding the visible content from the tree while the copy is read was rejected:
it hides focusable slotted links (FR-011, US1 scenario 18; axe `aria-hidden-focus`).

**Alternatives.** Content-wrapper withholding for one animation frame (the first draft): undone before the first
lifecycle and coalesced by the serialisation delay (PLAN-FRESH-1-001, PLAN-A11Y-SECURITY-1-001). Content-wrapper
withholding for longer than `2 × D` (operator option (a) of PLAN-FRESH-1-001, declined): reaches AT, but leaves the
focused-link failure of PLAN-A11Y-SECURITY-1-002 and hides focusable content for 300 ms or more. A double
`requestAnimationFrame` withhold: still inside one serialisation window. `aria-live` on the host through
`ElementInternals.ariaLive`: the host's subtree holds the visible content, so it needs withholding too. At plan squad
round 2 the operator declined: queueing triggers so that each change in a different task is announced in turn
(PLAN-FRESH-2-001 (b)); keeping the copy until the next announcement as the CDK `LiveAnnouncer` does by default
(PLAN-FRESH-2-005 (a)); and keeping the copy for `role="alert"` and documenting the double reading
(PLAN-FRESH-2-002 (b)).

## R-03 Notice styles

**Decision** (operator decision PLAN-FRESH-1-004 (c)). The box is a wrapper in the shadow root, `<div class="box
tone-<tone> size-<size>">`, whose classes Lit sets from the normalised `tone` and `size` properties (an unknown
attribute value gives `tone-info` or `size-regular`). The host is `display: block` with no box of its own, and "the
notice's content box" of SC-004 and US1 scenario 4 is the wrapper's content box. Host attributes are never rewritten
(FR-001), each value has one selector, and no CSS custom state (`:state()`) is used, so **the engine floor stays at
Chromium 120 and WebKit 16.4** (README § Engines; PLAN-CORRECTNESS-1-008: no feature newer than the floor is planned,
so FR-036's raise does not apply, and each phase checks the features it adds against the README's floor list; a
feature found newer than the floor goes back to the operator before it is used, with its README entry, CHANGELOG line
and semver classification in the phase that first uses it).

Ground `--ocelle-color-<tone>-bg`, marker as `border-inline-start: var(--ocelle-bar-width) solid
var(--ocelle-color-<tone>)`, radius `--ocelle-radius-row`, text `--ocelle-color-ink`, padding per size (FR-007), all on
`.box`. Tone and size rules sit inside `@media not (forced-colors: active)`; in forced colours the box gets
`border: var(--ocelle-border-width) solid CanvasText` with the inline-start side at `--ocelle-bar-width`, so it is
outlined and marked (FR-010). The heading's `margin-block-end` is `--ocelle-space-2` (regular) or `--ocelle-space-1`
(compact). The announcer (R-02) sits outside the box and is visually hidden, so it adds nothing to the box's layout.

For the form controls, the same rule applies: state that styles depend on is a class on a shadow-internal node set
from the normalised property (the error state, R-05), and any `type`-dependent style selects on the inner input's own
`type` attribute (`input[type="number"]`), which always carries the effective type.

**Alternatives.** `:host(:state(tone-danger))` through `ElementInternals.states`: needs Chromium 125 and WebKit 17.4,
a library-wide floor raise that matters for Kitty Desktop's WebKit webviews (operator option (a), declined).
`:host([tone="danger"])` with `:not()` lists for unknown values: works at the current floor, but every new value
changes several selectors (option (b), declined).

## R-04 Contrast records (FR-005)

**Decision.** Add the five state grounds to `color-ink`'s contrast grounds in `packages/tokens/src/source.ts`. The
markers (`color-<tone>`) already carry text-kind records on their own grounds (4.5:1 covers the 3:1 non-text need).
Computed ratios (WCAG 2): ink on danger-bg 14.91 light, 13.96 dark; warning 15.02, 12.60; success 15.69, 13.35;
info 15.70, 13.59; neutral 14.25, 12.43. Markers on their grounds: danger 5.34 and 5.77, warning 5.60 and 6.83,
success 5.40 and 8.55, info 5.82 and 9.42, neutral 5.40 and 5.59. All pass; no token value changes.

The required set grows by five pairs per theme, and every place that holds it changes in the same phase-2 task
(PLAN-CORRECTNESS-1-005; `packages/tokens/test/expected.ts` holds no pair count and is not touched):

- `packages/tokens/contrast/pairs.json`: ten computed rows (`color-ink` on each state `-bg` ground, light and dark,
  with the figures above); without them `gates/bin/contrast.ts:74-77` reports `missing-required-pair`;
- `gates/test/contrast-required.test.ts:7,58-63`: the hand-transcribed A.8 set gains `[["color-ink"], "text",
  stateGrounds]`, 149 → 154 (a deliberate edit of the test that guards the required set, made red first);
- the summary counts 160/168/149 → 165/173/154 in `gates/test/contrast.test.ts:80-81`,
  `gates/test/contrast-pairs.test.ts:5,59-61`, `gates/test/integration/token-gates.test.ts:13-16` and
  `gates/test/integration/plants-robustness.test.ts:116-128`;
- the comment at `gates/bin/contrast.ts:116`.

## R-05 Form association (FR-020 to FR-024)

**Decision.** One internal base class, `src/form-control.ts` (`OcelleFormControl extends LitElement`, not an entry
point), with `static formAssociated = true`, `attachInternals()`, an open shadow root with `delegatesFocus: true`. It
owns `name`, `label`, `description`, `error`, `required`, `disabled`, the `form`/`labels`/`validity`/
`validationMessage`/`willValidate` getters and `checkValidity`/`reportValidity`, `formResetCallback`,
`formStateRestoreCallback`, `formDisabledCallback`, the naming of FR-022 and the error announcement of FR-027. Each
element supplies the inner control and its value semantics. Value and state go through
`internals.setFormValue(value, value)`; validity through `internals.setValidity(inner.validity, inner.validationMessage,
inner)` after every input, attribute and option change (an empty flags object when valid).

Measured (spike 2026-11-13, Chromium): clicking an external `<label for>` of the host focuses the inner input
(`delegatesFocus`); `internals.labels` lists it; the inner input named by an `aria-label` built from the labels reads
"Title" in the tree; a form-associated host on a `Cache-Control: no-store` page restores through
`formStateRestoreCallback(state, "restore")` after back navigation with `pageshow.persisted` false, and `FormData`
holds the restored value.

**Naming** (FR-022): the inner control is named by `aria-labelledby` pointing at one span in the same shadow root
whose text is the computed name (host `aria-label`, else the labels' text then `label`, joined by one space); with no
source the attribute is removed. The span has the `hidden` attribute, not a visually hidden style: accessible-name
computation follows `aria-labelledby` into hidden nodes, and a hidden span adds no StaticText to the tree, where a
clipped span is read a second time in browse mode (PLAN-A11Y-SECURITY-1-004, probe: clipped span gave StaticText
"Title" twice before the textbox "Title"; with `hidden`, none, and the textbox is still named "Title"). The visible
`<label part="label" for="control">` keeps click-to-focus. The name is recomputed on connect, on every observed
attribute change, on `focusin`, and when an external label's subtree changes: a `MutationObserver` (childList,
characterData, subtree) observes each element of `internals.labels`, and the observed set is refreshed on connect, on
`focusin` and on each recompute (PLAN-A11Y-SECURITY-1-007), so a changed label text renames the control without a
focus. A label associated later (a new `<label for>`) is picked up at the next refresh (README). A host
`aria-labelledby` is ignored (README).

A host `aria-label` keeps its precedence (operator decision PLAN-A11Y-SECURITY-1-006 (b)): the README requires it to
contain the visible label text when a visible label is drawn (WCAG 2.2 SC 2.5.3) and lists any other combination as
not supported; US2 scenario 13 tests an `aria-label` that holds the visible text.

**Description** (FR-022, FR-027): `aria-describedby` on the inner control lists, in order, the description part, a
`hidden` span holding a host `aria-description` (hidden for the same reason as the name span, PLAN-FRESH-1-005), and
the error part, each only when non-empty.

**Host ARIA** (FR-022, spec Assumptions; operator decisions PLAN-CORRECTNESS-1-006 (a) and PLAN-A11Y-SECURITY-1-005
(b)): the element observes `aria-invalid`, `aria-required`, `aria-disabled` and `aria-description` on the host and
combines them with its own: invalid = `error` non-empty or host `aria-invalid="true"`; required = `required` or host
`aria-required="true"` (only `required` sets the native constraint); `aria-disabled="true"` on the host sets
`aria-disabled` on the inner control (it stays focusable, as ARIA defines; only `disabled` disables);
`aria-description` is added to the description as above. Only the value `"true"` is combined: any other host value
(`"false"` included) leaves the inner control as the element's own attributes say (US2 scenario 23) and is not
supported, because the host's attribute is not rewritten (005 convention) and the host's node may then carry a state
that differs from the control's; the README tells hosts to write only `"true"` or nothing, and to prefer the
element's attributes. With `"true"`, the host's node and the inner control carry the same state. A host `aria-label`
and `aria-description` stay on the host as written, so Chromium exposes the host as a generic with the same name and
description beside the control (probe: `generic "Search lanes" desc=Host desc` wrapping the textbox "Search lanes");
the README says so, and US2 scenario 13 pins both nodes so that a Chromium change is noticed. The first draft's claim
that the host "never differs" held for `"true"` only and is withdrawn.

**Events** (FR-024; PLAN-CORRECTNESS-1-002): one commit path. The element keeps the *last committed value*, set
without an event on connect, reset, restore and a script `value`. `commit()` dispatches `ocelle-form-<x>-change` with
`{ value }` when the value differs from the last committed value, and then updates it. The inner control's `change`
(not composed), listened to in the shadow root, calls `commit()`; so does Enter (below). On Enter the element calls
`preventDefault()` on the `keydown`, which, as measured, suppresses Chromium's native `change` that would otherwise
follow (probe: `keydown Enter`, then `change ab` from the inner input); the guard covers both sources anyway, so
Enter followed by blur dispatches once (US2 scenario 3). The composed native `input` reaches the host by itself, after
the element has updated `value` in an `input` listener registered on the inner control first (listeners on the inner
control run before the event reaches the host).

**Implicit submission** (FR-030, as narrowed by PLAN-FRESH-1-003): on Enter (`keydown`, not composing) in the inner
field, the element calls `commit()`, then applies HTML's implicit-submission rule to its form: with a default button
(the first submit button of `form.elements`), it calls `defaultButton.click()` unless the button is disabled; without
one, it calls `form.requestSubmit()` only when the form's elements hold exactly one field that blocks implicit
submission, counting native inputs of the blocking types and every `ocelle-form-input`. Validation then runs as for a
native submit and focuses the anchor (the inner field). Enter in a native field of the same form is the browser's
own rule, which does not count the element (probe: a form with no submit button, one native input and one
form-associated element submits on Enter in the native input); the element adds no listener on its form, and the
README lists the mixed-form case under its limitations (US2 scenario 21 tests both directions).

**Error state styles** (FR-028, PLAN-A11Y-SECURITY-1-009): the control carries a class `invalid` set from the
normalised `error` (R-03's rule; a whitespace-only `error` sets nothing). The rule that widens the boundary to
`--ocelle-bar-width` for `.invalid` sits outside the `@media not (forced-colors: active)` block, so the width mark
stays in forced colours; inside that block the boundary colour is `--ocelle-color-danger`, and in forced colours it is
the FR-025 system colour (`CanvasText`, as the normal boundary's `ButtonBorder` or `CanvasText`), with the error text
in `CanvasText`. US2 scenario 15 measures the width in forced colours.

**Alternatives.** Light-DOM control: rejected by the operator (spec). Delegating to a hidden light-DOM `<input>` that
the element creates: rewrites host children. `aria-label` on the inner control instead of `aria-labelledby`: works,
but keeps the computed name out of the DOM, which makes the README's statement and the tests' oracle less direct;
either is acceptable and the tests check the tree, not the mechanism. Removing `aria-label` and `aria-description`
from the host after copying them (option (a) of PLAN-A11Y-SECURITY-1-005, declined): an exception to the "no host
rewrite" convention. A name that starts with the visible label text whatever `aria-label` says (option (a) of
PLAN-A11Y-SECURITY-1-006, declined): departs from native accname precedence.

## R-06 Error announcement (FR-027)

**Decision.** The error part (`part="error"`) is visible, referenced by `aria-describedby` (R-05) and not live. The
announcement goes through the same `Announcer` of `src/live.ts` as the notice (R-02): a sibling
`<div class="announcer" aria-live="polite" aria-atomic="true">` in the control's shadow root, visually hidden,
present and empty from the first render, into which the normalised error text is written after the wait `W` and
emptied after the hold `H`, with the same restart, baseline re-check and minimum hold as R-02 (spec FR-027 as amended
by PLAN-FRESH-2-001 (a)); as there, an insertion or a reveal sets the error baseline to none before its wait, so the
re-check never drops it (PLAN-FRESH-3-001, spec US2-22: a control first loaded hidden with an `error`, or one whose
error was announced and which was hidden and revealed with the same error, announces it once). It triggers on insertion after parsing (not a move, not first load) when `error` is
non-empty, on reveal of the host when `error` is non-empty, and when `error` changes to a non-empty normalised text
that differs from the baseline. The element normalises the error text (collapse, trim) before rendering and comparing
it, so a whitespace-only difference changes nothing; clearing it resets the baseline to empty, cancels a pending
announcement and empties the announcer, so the next non-empty text is an announcement. First load is detected as for
the notice (R-02, the registration flag). The announcer holds only the error, so the description and label are never
announced, and the error part, which a focused control's description reads, is never hidden.

## R-07 Select options (FR-031)

**Decision.** The element renders a native `<select part="control">` with no slot, so its light-DOM `<option>` and
`<optgroup>` children are neither rendered nor in the tree. A `MutationObserver` on the host (childList, subtree,
attributes `value`, `label`, `selected`, `disabled`, characterData) rebuilds the inner options by cloning, in order.
Selection: while the select is not dirty (no user choice and no script `value` since the last reset), the selection
follows the children's `selected` attributes (the last `selected` wins, as a native single select, or the first enabled
option); once dirty it keeps the chosen value if an option still has it, and otherwise falls back to the first enabled
option, without an event. Reset clears dirtiness. A host `value` attribute is ignored (FR-021).

**Indicator** (operator decision PLAN-CORRECTNESS-1-003 (a)): the select draws the `chevron-down` drawing of the
shared set itself, from `iconOf("chevron-down")` of `src/icons.ts`, as an `aria-hidden="true"` inline SVG in
`currentColor` in its own shadow root, sized by `--ocelle-icon-size`; the shape-to-SVG rendering of
`src/ocelle-icon.ts` moves to an internal module both elements use (a refactor of 005 code, kept green by the icon
tests). The select module therefore imports no other element module and defines only `ocelle-form-select`, as the
README's "importing the module defines that element and no other" requires (`test/node/readme.test.ts:29`, the
select's entry test written as `test/entry-icon.test.ts`). The indicator is positioned at the inline end with logical
properties and has `pointer-events: none`, so a click on it reaches the native select (PLAN-A11Y-SECURITY-1-008, US3
scenario 8); the native select gets `appearance: none` so only one indicator shows. In forced colours the SVG's
`currentColor` is the system text colour, so it stays visible.

## R-08 Stories, baselines and axe against #10's design (FR-033)

**Decision.** Stories follow `specs/006-storybook-workbench` on branch `claude/010-storybook-workbench`: one CSF file per
element in `storybook/stories/` (`notice.stories.ts`, `form-input.stories.ts`, `form-select.stories.ts`), rendered
through `storybook/stories/render.ts` without inline styles, both themes captured by the harness, baselines at
`storybook/baselines/<story-id>.<theme>.png` produced with `pnpm run visual:update` in the pinned container, hover
declared with the story pointer parameter (006 FR-031). The **focused** states (US4 scenario 1) use a story that renders
the element with `autofocus` on the host (a form-associated element with `delegatesFocus` focuses its inner control);
whether #10's capture keeps that focus is re-measured when #10 lands (006 has no focus parameter; FR-031 covers hover
and press only). If it does not, the plan is rechecked with the operator before the stories phase. The announcing-notice
story shows the notice as rendered (announcement is behaviour, tested in the browser scenarios, not in a pixel).

**Recheck when #10 lands (FR-033).** Before phase 5 starts, the implementer compares #10's merged contributor note,
`contracts/gates.md` and `contracts/container.md` with this entry (story location, render helper, pointer parameter,
baseline naming and command, the `closed-shadow-root`, `font` and `outside-root` rules). A difference that changes a
task is a plan change, made by the planner and recorded, before the stories are written.

## R-09 Tests and mutation (constitution VIII; mission 007)

**Decision.** As 005: scenario bodies in `test/scenarios/{notice,form-input,form-select}.ts` against the driver,
run in process by `test/{notice,form-input,form-select}.test.ts` (the `elements` project, mutated by Stryker) and on
strict-CSP fixture pages by `test/browser/*.test.ts`. The driver gains (`contracts/testing.md`): the capture of R-01
(`liveCapture.start(containerId)`, `liveCapture.startDocument(url)` on fixture pages, `liveCapture.stop()` →
snapshots), form helpers (`formData(id)`, `submit(id)`, `reset`, `type`, `press`), `laterTask()`, an insertion helper
for each way of inserting markup (`innerHTML`, `<template>` content, `DOMParser`, `createElement`), and history
navigation on a no-store route of `test/browser/serve.ts` (fixture pages only: the in-process harness cannot navigate
its iframe away and back, so history restore is asserted on fixture pages; the in-process test calls
`formStateRestoreCallback(state, "restore")` on the element directly and checks the observable result, so Stryker
covers the restore logic, while the fixture test proves the browser calls it). Native twins (US2 scenario 21, SC-003)
are built in the same form, and each twin comparison also asserts an absolute expected outcome
(`contracts/testing.md` § Twins).

**First load in process** (PLAN-TESTABILITY-1-004). `test/in-process.ts` `mount()` sets `document.body.innerHTML`
after the test file has defined the element, so in process every element would be an insertion. The driver therefore
gains `registerFirstLoad(containerId, markup, base)`: it mounts markup that uses a fresh test-only tag, arms the capture on the
container, then calls `define(tag, class extends Base {})` from `src/define.ts`, so the elements are upgraded by the
registration and take the first-load path, and the registration flag's mutants are reachable. The `readyState` read
is one function of `src/live.ts`; the in-process test drives it with a getter spy on the document (T002 confirms the
spy works in the `elements` project). Mutants that stay unreachable in process (for example the parser-inserted
`"loading"` case, if the spy does not work) are named in the spike note before phase 2, each with the fixture-page
scenario that covers it.

**Submission in process** (PLAN-TESTABILITY-1-005). In process `submit(formId)` installs a capture-phase `submit`
listener on the form that records `event.submitter` and `new FormData(form, event.submitter)` and calls
`preventDefault()`, so the Vitest iframe does not unload; it returns the entries, or `null` when no `submit` event
fired. On fixture pages it returns the request body the fixture server received. The fixture harness thus also proves
the request body; the in-process run is what Stryker uses for the implicit-submission code.

**Mutation.** Element source under `packages/elements/src/**` is mutated in process; per mission 007, a Timeout or
CompileError mutant on a changed line is reported and does not fail the gate, and a survivor in new code is a blocking
review finding unless the review records it as equivalent. Because `gates/lib/mutation/report.ts:72` counts Timeout as
passing, every Timeout in `src/live.ts`, `src/define.ts` and `src/form-control.ts` is reviewed one by one in the phase
review, and the capture's bounds (R-01) make a looping mutant fail as an assertion (PLAN-TESTABILITY-1-009).

**Timing in process** (operator decision PLAN-FRESH-2-003 (a)). At Chromium's figures every announcing cell costs at
least `W` plus stop()'s quiet window (2100 ms at Chromium's figures, `contracts/testing.md`), about 2.4 s, so the SC-002 matrix
alone would take several minutes in Stryker's dry run and again for every surviving or equivalent mutant
(`coverageAnalysis: perTest`), against the mutation shard's 10-minute limit (`.github/workflows/ci.yml:84-89`; specs
001 FR-013, whose records show shards at 9:49 and 670 s). `src/live.ts` therefore exports, from the internal module
only (not from `index.ts` or `browser.ts`, not in the manifest), a test-only setter `setAnnouncerTimingForTests({
delayLoaded, delayLoading, hold })` that replaces `D` (both load states) and `H` and returns the timing it replaced;
`W` and the minimum hold stay `2 × D`. Only `test/in-process.ts` calls it, before each scenario, from one constant that also gives the capture's
`"settled"` rule and stop()'s quiet window their in-process `D` (R-01), so the element and the oracle use the same
figure while the oracle keeps its own copy. The test `D` is chosen in T002 and is at least two rendering updates long,
so the microtask and first-frame plants still count zero under `"settled"`. Fixture pages never call the setter and
run at Chromium's 150 and 350 ms and the real `H`; they are the evidence that the real figures work. A test in
`test/node/` checks that the setter is called only from `test/in-process.ts` (no `src/` module, no fixture page). T002 measures, with
the test `D`, the `elements` project's dry run and a worst-case shard (60 changed lines of `src/live.ts`, the largest
entry specs 001 FR-013 allows), and the fixture-page suite at real figures; if a shard exceeds about 7 minutes, the
plan stops for the operator before phase 2. The Stryker timeout factor is set from the same measurement.

**The shipped figures under mutation** (operator decision PLAN-FRESH-3-004 (a)). Because every in-process scenario
replaces `D` and `H` first, no scenario reads the shipped figures, and the mutation gate runs only the in-process
configuration (`gates/bin/mutation.ts:71-74`) and fails on both `Survived` and `NoCoverage`
(`gates/lib/mutation/report.ts:71`); the fixture pages that run at the real figures kill no mutant. The mutants are
not equivalent (`D = 0` gives `W = 0`, the coalesced write PLAN-FRESH-1-001 removed). So the defaults are one
internal constant of `src/live.ts`, `announcerDefaults = { delayLoaded: 150, delayLoading: 350, hold: 5000 }` (not
exported from `index.ts` or `browser.ts`, not in the manifest), from which the timing in force starts, and
`test/in-process.ts` keeps the value its first `setAnnouncerTimingForTests` call of the file returns (Vitest gives
each test file its own module instance; T002 confirms). An in-process test, `test/live-timing.test.ts` in the
`elements` project, asserts that this value and `announcerDefaults` each deep-equal `{ delayLoaded: 150,
delayLoading: 350, hold: 5000 }`, written as literals in the test, not imported. It kills `150 → 0`, `350 → 0`, `5000
→ 0` (and any other change of those literals), the constant's object literal emptied, the timing in force not
started from the constant, and the setter's return value mutated. The literals sit in module-level code, which
Stryker treats as static mutants and runs against every test, so `coverageAnalysis: perTest` does not leave them
NoCoverage. The test does not call the setter itself, so the `test/node/` caller check stands. The declined
alternative was a Stryker disable comment on those lines naming the fixture-page scenarios (option (b)).

**The oracle** (PLAN-TESTABILITY-1-008). The reading `regionText()` and the counting `announcements()` are pure
functions in `test/live-reading.ts`, unit-tested per rule (StaticText taken; `img` name taken and its descendants not
visited; a link's own name skipped while its StaticText children count; inline text boxes skipped; ignored subtrees
contributing nothing; whitespace; the `"settled"` and `"rendered"` rules; the vacuous cases) on recorded
`getFullAXTree` node lists saved from the T002 spike. They are not mutated: the mutation gate selects changed package
and gate source and runs the elements configuration on `packages/elements/src/` only (`gates/bin/mutation.ts:71-74`),
and extending its selection to test code would be a gate change this plan does not make. Instead each rule has a
planted reading (a reading that takes a link's name, one that visits an `img`'s descendants, one that ignores the
settle rule) that must turn a named unit test red (`contracts/testing.md` § Plants).

## R-10 Undefined elements (spec Edge Cases)

**Decision.** The base stylesheet does not ship a `:not(:defined)` rule: it would hide hosts' content when the build
fails to load, and the base styles are optional for hosts. The README gives the rule hosts may add to their own
stylesheet (`ocelle-form-select:not(:defined) { visibility: hidden; }` and the like) and states that undefined form
elements are not in their form's data.

## R-11 Parallel missions and merges

**Decision.** `packages/elements/src/index.ts`, `src/browser.ts`, `package.json` exports, `custom-elements.json`, the
README's element list and the Storybook configuration are shared with missions 008, 009 and 011. Each phase adds its
lines in alphabetical order of tag to reduce conflicts. Conflicts are resolved by merging `main` (never rebasing) at
landing, then regenerating `custom-elements.json` with `pnpm --filter @ocelle/elements run manifest` rather than
hand-merging it.
