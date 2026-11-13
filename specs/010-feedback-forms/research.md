# Research: Feedback and Forms

Phase 0 of `/speckit-plan` for `specs/010-feedback-forms`. Each entry: decision, rationale, alternatives. Measured
items say where they were measured: "spike 2026-11-13" means a Playwright script against the pre-installed Chromium in
this session (scripts not committed; their outcome is recorded here and re-measured by the phase-1 spike task).

## R-01 The accessibility-tree capture ("What 'announced' means here", spec Assumptions)

**Decision.** A *paused-mutation capture*. A test-only recorder, installed for the scenario on the element under test
(its host, its shadow root, and its parent for insertion), is a `MutationObserver` (childList, attributes,
characterData, subtree) whose callback executes `debugger`. The test side holds a CDP session with `Debugger` and
`Accessibility` enabled; on each `Debugger.paused` it reads `Accessibility.getFullAXTree`, extracts every live region
node at or inside the watched host (a non-ignored node whose `live` property is `polite` or `assertive`), computes each
region's text by the spec's reading (StaticText and `img` names in tree order, inline text boxes skipped, whitespace
collapsed and trimmed), appends the snapshot, and resumes. A final snapshot is taken when the scenario's step settles.
The announcement count is computed from the snapshot sequence exactly as the spec defines it (a region present in two
consecutive snapshots whose text changed to a non-empty text), by a pure function `announcements(snapshots)` with its
own unit tests.

**Rationale.** Every change the element makes to its tree is a DOM mutation (an attribute such as `aria-hidden` or
`aria-live`, a slot assignment, a text change), so a snapshot per mutation batch sees every state the tree can take,
including the one-frame empty region; it is event-driven, not polling. Measured (spike 2026-11-13): for an inserted
region whose content is withheld for one animation frame, the sequence was `polite:""`, `polite:""`, `polite:"Saved"`,
then a text change gave `polite:"Saved again"`, one announcement each. `getFullAXTree` while paused returns the tree
for the current DOM (it brings layout and the accessibility cache up to date before answering).

**Alternatives.** CDP `Accessibility.nodesUpdated`: measured, never fired (0 events over an insertion and a text
change, with `Accessibility.enable` and a prior full-tree read). Polling `getFullAXTree` each frame: misses one-frame
states and is ruled out by the spec. Chromium's internal live-region events: not exposed over CDP. A real screen reader:
not available in CI (spec).

**Limits, recorded in the README (FR-035).** The capture shows what the accessibility tree holds after each mutation;
what a screen reader then speaks is not measured. Whether the in-process harness (Vitest browser mode, where the
tested page is an iframe of the runner) tolerates `debugger` pauses is re-measured by the phase-1 spike task T002; if it
does not, the announcement scenarios cannot run in process, Stryker cannot kill mutants in the announcement code, and
the plan stops for an operator decision before phase 2 (fork recorded in the spike note).

## R-02 How the notice announces

**Decision.** Shadow structure: `<div class="region" [aria-live]>` > `<div class="content" [aria-hidden]>` >
`<div part="heading">` (with `<slot name="heading">`) and `<div part="body">` (with the default `<slot>`). The element
keeps three facts: *live* (is it announcing: `announce`, or a host `role` of `alert` or `status`), *politeness* (host
`alert` → assertive, host `status` → polite, else tone: `warning`, `danger` → assertive, others polite) and *where*
(the host's own node when the host role is `alert` or `status`, so the inner region carries no `aria-live`; the inner
region otherwise). It announces by *withholding*: the content wrapper gets `aria-hidden="true"` for one animation frame,
then loses it, so the region's text goes from empty to the current text once. It withholds on: insertion after parsing
(not a move), reveal (the host's `hidden` removed), and a politeness change while live. Text changes need no action:
the browser updates the region's text in place, which is an announcement by the spec's measure, and several changes in
one task reach the tree as one. The text is visible throughout (only the tree exposure is withheld), as the spec
requires.

**First load** (FR-008): the constructor records `this.isConnected` (true only when an already-connected element is
upgraded); the first `connectedCallback` counts as first load when that was true or `document.readyState` is
`"loading"`. The browser build is a module script and runs after parsing, so every notice in the server's HTML is
upgraded already connected: first load, as the spec says.

**Move in one task**: `disconnectedCallback` sets a flag and posts a message on a module-level `MessageChannel`; its
handler, which runs in a later task, clears the flags. A `connectedCallback` that finds the flag set is a move and does
not withhold. A removal and an insertion in different tasks are therefore an insertion. Measured behaviour of the
withholding and the reveal is covered by US1 scenarios 8 to 17.

**Heading absent** (FR-006): on `slotchange` of the heading slot and on a light-DOM `MutationObserver` (childList,
characterData, subtree) the element computes whether the assigned elements' text content is empty after whitespace
collapse; the heading part gets `hidden` (no box, no gap: the gap is the heading part's `margin-block-end`).

**Alternatives.** A separate visually hidden live region holding a copy of the text: reads the text twice (once in the
visible content) and needs the element to compute the text itself. Rendering without slots for the first frame: the
content would not be visible from the first frame (spec). `aria-live` on the host through `ElementInternals.ariaLive`: puts the region on the host's node in every case, but then
the withholding has to hide the host's whole subtree from the tree for a frame, including focusable slotted links, and
the host-role rows would still need a second mechanism.

## R-03 Notice styles

**Decision.** The box is the host (`:host { display: block; }`), so "the notice's content box" in SC-004 is the host's.
Ground `--ocelle-color-<tone>-bg`, marker as `border-inline-start: var(--ocelle-bar-width) solid
var(--ocelle-color-<tone>)`, radius `--ocelle-radius-row`, text `--ocelle-color-ink`, padding per size (FR-007).
Tone and size rules sit inside `@media not (forced-colors: active)`; in forced colours the host gets
`border: var(--ocelle-border-width) solid CanvasText` with the inline-start side at `--ocelle-bar-width`, so it is
outlined and marked (FR-010). The heading's `margin-block-end` is `--ocelle-space-2` (regular) or `--ocelle-space-1`
(compact). Unknown `tone` and `size` keep the attribute as written (FR-001): the styles select on a private state
(`:host(:state(tone-danger))` through `ElementInternals.states`, Chromium 125, WebKit 17.4) rather than on the
attribute. **Engine floor**: custom states raise the README's floor to Chromium 125 and WebKit 17.4 (FR-036); the
alternative, a reflected private attribute on the host, rewrites host attributes, which the conventions avoid.

**Alternatives.** Selecting on `:host([tone="danger"])` with a fallback for unknown values via `:not()` lists: works
without raising the floor, but every new tone value changes four selectors; kept as the fallback if the floor raise is
refused at the plan gate (fork, see plan "Decisions the operator should see").

## R-04 Contrast records (FR-005)

**Decision.** Add the five state grounds to `color-ink`'s contrast grounds in `packages/tokens/src/source.ts`. The
markers (`color-<tone>`) already carry text-kind records on their own grounds (4.5:1 covers the 3:1 non-text need).
Computed ratios (WCAG 2): ink on danger-bg 14.91 light, 13.96 dark; warning 15.02, 12.60; success 15.69, 13.35;
info 15.70, 13.59; neutral 14.25, 12.43. Markers on their grounds: danger 5.34 and 5.77, warning 5.60 and 6.83,
success 5.40 and 8.55, info 5.82 and 9.42, neutral 5.40 and 5.59. All pass; no token value changes. The token tests'
pair counts (`expected.ts`, "149 required pairs per theme") grow by five per theme.

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

**Naming** (FR-022): the inner control is named by `aria-labelledby` pointing at one visually hidden span in the same
shadow root whose text is the computed name (host `aria-label`, else the labels' text then `label`, joined by one
space); with no source the attribute is removed. The visible `<label part="label" for="control">` keeps click-to-focus.
The name is recomputed on connect, on every observed attribute change and on `focusin` (an external label's text is
read when the control is next focused; README). A host `aria-labelledby` is ignored (README).

**Description** (FR-022, FR-027): `aria-describedby` on the inner control lists, in order, the description span, a
span holding a host `aria-description`, and the error span, each only when non-empty.

**Host ARIA** (FR-022, spec Assumptions): the element observes `aria-invalid`, `aria-required`, `aria-disabled` and
`aria-description` on the host and combines them with its own: invalid = `error` non-empty or host
`aria-invalid="true"`; required = `required` or host `aria-required="true"` (only `required` sets the native
constraint); `aria-disabled="true"` on the host sets `aria-disabled` on the inner control (it stays focusable, as ARIA
defines; only `disabled` disables); `aria-description` is added to the description as above. The host's own attribute
is not rewritten (005 convention), so its node carries the same value as the inner control, never a differing one. The
README says to use the element's attributes.

**Events** (FR-024): the inner control's `change` (not composed) is listened to in the shadow root and re-dispatched as
`ocelle-form-<x>-change` with `{ value }`; the composed native `input` reaches the host by itself, after the element
has updated `value` in an `input` listener registered on the inner control first (listeners on the inner control run
before the event reaches the host).

**Implicit submission** (FR-030): on Enter (`keydown`, not composing) in the inner field, the element dispatches the
change event if the value changed, then applies HTML's implicit-submission rule to its form: with a default button
(the first submit button of `form.elements`), it calls `defaultButton.click()` unless the button is disabled; without
one, it calls `form.requestSubmit()` only when the form's elements hold exactly one field that blocks implicit
submission, counting native inputs of the blocking types and every `ocelle-form-input`. Validation then runs as for a
native submit and focuses the anchor (the inner field).

**Alternatives.** Light-DOM control: rejected by the operator (spec). Delegating to a hidden light-DOM `<input>` that
the element creates: rewrites host children. `aria-label` on the inner control instead of `aria-labelledby`: works,
but keeps the computed name out of the DOM, which makes the README's statement and the tests' oracle less direct;
either is acceptable and the tests check the tree, not the mechanism.

## R-06 Error announcement (FR-027)

**Decision.** The error span (`part="error"`) sits inside a polite live region in the control's shadow root, with the
same withholding mechanism as the notice (R-02): withhold for one frame on insertion after parsing (not a move) when
`error` is non-empty, on reveal of the host when `error` is non-empty; text changes need no action. The element
normalises the error text (collapse, trim) before rendering it, so a whitespace-only difference changes nothing in the
tree; clearing it empties the region, so the next non-empty text is an announcement. First load is detected as for the
notice. The region holds only the error, so the description and label are never announced.

## R-07 Select options (FR-031)

**Decision.** The element renders a native `<select part="control">` with no slot, so its light-DOM `<option>` and
`<optgroup>` children are neither rendered nor in the tree. A `MutationObserver` on the host (childList, subtree,
attributes `value`, `label`, `selected`, `disabled`, characterData) rebuilds the inner options by cloning, in order.
Selection: while the select is not dirty (no user choice and no script `value` since the last reset), the selection
follows the children's `selected` attributes (the last `selected` wins, as a native single select, or the first enabled
option); once dirty it keeps the chosen value if an option still has it, and otherwise falls back to the first enabled
option, without an event. Reset clears dirtiness. A host `value` attribute is ignored (FR-021). The indicator is an
`ocelle-icon name="chevron-down"` in the shadow root (decorative, as `ocelle-icon` is by default), positioned at the
inline end with logical properties; the native select gets `appearance: none` so only one indicator shows. The select
module imports `./ocelle-icon.js` so the icon is defined.

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
strict-CSP fixture pages by `test/browser/*.test.ts`. The driver gains: the capture of R-01 (`liveCapture.start(id)`,
`liveCapture.stop()` → snapshots), form helpers (`formData(id)`, `submit(id)` recording the submission's body, `reset`,
`type`, `press`), and history navigation on a no-store route of `test/browser/serve.ts` (fixture pages only: the
in-process harness cannot navigate its iframe away and back, so history restore is asserted on fixture pages; the
in-process test calls `formStateRestoreCallback(state, "restore")` on the element directly and checks the observable
result, so Stryker covers the restore logic, while the fixture test proves the browser calls it). Native twins (US2 scenario 21, SC-003) are built in the same form.
Mutation: element source under `packages/elements/src/**` is mutated in process; per mission 007, a Timeout or
CompileError mutant on a changed line is reported and does not fail the gate, and a survivor in new code is a blocking
review finding unless the review records it as equivalent.

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
