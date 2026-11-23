---
triage: 010
issues: [9]
decision: mission
target: "feedback-forms"
in_scope: [9]
out_of_scope: [1, 7, 8, 10, 11, 12, 13, 14, 15, 16, 27, 28, 29, 30]
semver: minor
spec_prompt: "Build issue #9 (triage/010-feedback-forms.md) in @ocelle/elements on the conventions of mission 005: ocelle-notice (tone, role override, no heading wrapper or gap when no heading is slotted per spec-kitty-design#513, size=\"compact\" per #509, and with announce a polite or assertive live region chosen by tone that announces each change once); ocelle-form-input (label, type, placeholder, .value, input event) and ocelle-form-select (native-select-based, for closed choices such as lane and log filters), both taking part in forms through ElementInternals or a light-DOM control, chosen once as the form-control convention later form elements (#14) follow, with label, description and error message announced and no ID reference crossing a shadow root; for each element the #7 'Done when' checklist (stories per variant and state in light and dark, interaction tests for every event and payload, keyboard and screen-reader behaviour, axe with no serious or critical finding, manifest entries, strict-CSP built output) plus form-submission tests of value and validity and announcement tests for the notice; visual baselines and axe run on the #10 harness (specs/006-storybook-workbench) once it lands; ocelle-button, compact sizing of #7's metric, and the selection elements of #14 stay out."
status: approved
decided_by: "human:jeroennouwsdev"
decided_at: 2026-11-12T22:29:23Z
---

# Triage 010: Feedback and forms (#9): ocelle-notice, ocelle-form-input, ocelle-form-select

## Issues read

**Source of the issue text.** GitHub could not be reached from this session. The orchestrator fetched the data
read-only through the GitHub connector on 2026-11-12 and gave it as `scratchpad/issue-9-context.md`: #9 in full (no
comments, no linked pull requests), the "Done when" checklist of #7 that #9 refers to, excerpts of epic #1, and the
number, state and title of every issue and pull request in the repository. The record is based on that text. The
spec-kitty-design issues #9 cites (#509, #513) and ADR-0078 were not read.

- **#9** "Elements: feedback and forms — ocelle-notice, ocelle-form-input, ocelle-form-select" (open, author
  MOES-Media, parent epic #1; no comments, no linked pull requests). Asks for:
  - `ocelle-notice` (28 uses today): `tone`, `announce` (live region), `role` override; no heading wrapper and no gap
    when no heading is slotted (spec-kitty-design#513); `size="compact"` (#509); with `announce`, a polite or
    assertive live region according to `tone`, announced once per change.
  - `ocelle-form-input` (2 uses): `label`, `type`, `placeholder`, `.value`, input event.
  - `ocelle-form-select`: a native-select-based element for closed choices (lane and log filters); Spec Kitty ships
    it only as a light-DOM style.
  - Both form elements take part in forms through `ElementInternals` (form value, validity, label association) or
    render the control in light DOM; label, description and error message are announced; no ID reference crosses a
    shadow root (ADR-0078, D5).
  - Done when: #7's checklist (story per variant and state with light and dark baselines; interaction tests of every
    event and payload; keyboard and screen-reader behaviour, axe with no serious or critical finding; manifest lists
    every property, event, slot and part; built output passes the strict-CSP check), plus form-submission tests
    (value and validity) and screen-reader announcement tests for the notice.
- Epic #1: element and event naming (`ocelle-<element>-<action>`, bubbles and composed), written from scratch, the
  day-one rule (every gap row met in the first release), gap rows `#509 | ... compact notice | #7, #9, #5` and
  `#513 | notice without empty heading block | #9`. Consumers: Kitty Desktop (WebKit webview) and the Ocelle web
  console (server-rendered, Thymeleaf + htmx, strict CSP, ADR-0078). For the console, real form participation
  matters: htmx and plain HTML forms submit what the browser's form data contains.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #9 | issue (open) | in scope | This mission. |
| #1 | epic (open) | out of scope | Parent; its gap rows #513 and (in part) #509 close here. |
| #17 / PR #26 / `476602e` | issue (closed), merged mission 005 | done, was blocking | Sets the element conventions this mission follows: Lit pinned, `define.ts` registration, token-only static styles, generated `custom-elements.json` and the manifest gate, the browser build for hosts without a bundler, host ARIA (README "Host ARIA"), `attachInternals()` already used by `ocelle-icon` and `ocelle-brand-mark` for ARIA. A tone icon in the notice, if the spec wants one, comes from its icon set. |
| #5 / PR #19, #6 / PR #21 | issues (closed), merged | done | Tone tokens exist (`color-info`, `color-success`, `color-warning`, `color-danger`, `color-neutral` and their `-bg`), plus `color-control-border`, `color-disabled-*`, `color-focus`. Base styles define `data-ocelle-density="compact"` and make form controls inherit the font; `size="compact"` should agree with that hook, not invent a second scale. |
| #7 | issue (open, not triaged) | out of scope; **coordinate** | Source of the "Done when" checklist. Also cites #509 ("compact notice" row is shared with #7's metric and #5). Compact notice belongs here; metric layout and eyebrow style stay with #7. #9 does not need `ocelle-button`; if the notice gets a dismiss or action slot, it is a slot, not a dependency on #7. |
| #10 / PR #24 (do-not-merge CI run) / `origin/claude/010-storybook-workbench` `specs/006-storybook-workbench` | issue (open), mission 006 in implementation | **blocked by #10** for baselines and axe only | 006 builds the pinned-container visual gate and axe on every story; its spec says every element issue (#7 to #9) adds stories to that harness. Its FR-027 treats form-control text (values, placeholders) as rendered text and fails closed shadow roots, which bears directly on `ocelle-form-input` and `ocelle-form-select`. Behaviour, form and announcement tests do not depend on #10; the baseline and axe items of "Done when" do. |
| #14 | issue (open) | out of scope; **blocked by #9** (soft) | segmented-choice, listbox, copy-field are form-like controls; the form-association convention (ElementInternals or light-DOM control, label, description, error) set here is what they follow. `ocelle-listbox` is a custom ARIA listbox, not the native-select `ocelle-form-select`: no duplicate. |
| #15 | issue (open), triaged in parallel as 009 | out of scope; consumer | "Lane and log filters" are the stated use of `ocelle-form-select`; workflow lanes may place it but do not build it. |
| #16 | issue (open), triaged in parallel as 008 | out of scope; **coordinate** | A dialog or drawer that holds a form is the likely place both meet; also tooltip vs. description text. No shared surface to build. |
| #8 | issue (open), triaged in parallel as 011 | out of scope | Layout and headers; a section header slotted into a notice would only use the notice's heading slot. |
| #12, #13 | issues (open) | out of scope | No notice or form control named. #13's empty-state is a different element from a notice. |
| #11 | issue (open) | out of scope, blocked by #9 | Release v1.0.0; day-one rule needs #513 and #509 met. |
| #27 | issue (open) | out of scope; **coordinate** | `custom-elements.json` names source files the package does not ship. New elements add entries to the same manifest; whichever lands second rebases, and this mission must not deepen the problem (no new kind of path). |
| #28, #29, #30 | issues (open) | out of scope | Registry gate contract, a flaky prose browser test, and run-summary index conflicts: tooling, not element surface. #30 will touch this mission's PR when it lands. |
| `specs/001`-`003`, `005`, `007`; `ops/004` | repository | none to fold into | All merged; none covers notice or form elements. |
| `triage/001`-`007` | repository | note | 005 listed #9 as inheriting element conventions only; 008, 009, 011 are in parallel and do not take #9. |
| `knowledge/speckit-flows/findings/frontend-missions.md` | finding | applies | Node 22 here vs 26.13.0 in CI; `OCELLE_CHROMIUM_PATH`; **no WebKit**, while Kitty Desktop is WebKit; one heavy job at a time. |
| `knowledge/speckit-flows/guards/vacuous-tests.md` | guard | applies | A live-region test that only checks `aria-live` is present, or a form test that never submits, passes vacuously. |
| `knowledge/speckit-flows/runs/005-icons-brand-mark.md` | run summary | note | Four stories, five phases, 11 rounds, 3 blocking findings: a three-element mission of this shape is manageable. |

## Decision

**mission.** Several mission criteria apply:

- **New public surface (MINOR).** Three new elements, their attributes (`tone`, `announce`, `role`, `size`, `label`,
  `type`, `placeholder`, plus `name`, `required`, `disabled`, `value` that form participation implies), properties,
  events, slots (notice heading and body; description and error for the controls) and parts, all in the manifest.
- **Design decisions.** ElementInternals (form-associated custom element) or a light-DOM control, for both form
  elements, which becomes the convention #14 follows; how label, description and error are associated without an ID
  reference crossing a shadow root; which `type` values `ocelle-form-input` accepts; the event contract (native
  `input` is composed and crosses the shadow root, native `change` is not, so it must be re-dispatched or renamed
  under the `ocelle-<element>-<action>` rule); how options reach `ocelle-form-select` (slotted `option` elements or
  a property); how a live region inside a shadow root announces once per change, and how `role` override and
  `announce` combine.
- **Accessibility beyond a local fix.** Live regions, form labelling and error announcement across the shadow
  boundary: the issue's own words, "where accessibility across the shadow boundary matters most".
- **More than one user story** (three elements, below).

Why not the others: not an **op** (new public surface, open design questions); not a **fold** (nothing in progress
covers it; 006 is a harness, not elements); not **none** (no such element exists); not **decision-needed** (the open
choices are design questions for the spec and its checks; none needs a constitution change or a product choice
before scoping).

**One mission, not three.** The notice could ship alone, and the two form controls share one design. They stay
together because #9 is one issue with one "Done when", the form controls must agree on one form-association
convention, and the notice is small. If the operator wants smaller missions, the split is notice first and the two
form controls second (see the last section).

## Scope

In scope (#9), suggested user stories in priority order:

1. **`ocelle-notice` (MVP, 28 uses).** Tones on the existing tone tokens; a heading slot with no wrapper and no gap
   when empty (#513); `size="compact"` consistent with `data-ocelle-density` (#509, the notice part only); `role`
   override reaching the right node; with `announce`, polite or assertive by tone, announced once per change (no
   repeat on re-render, no announcement on first render unless the spec decides otherwise), with announcement
   tests that observe the accessibility tree or the live region's content changes, not attributes alone.
2. **`ocelle-form-input`.** `label`, `type` (a stated subset), `placeholder`, `.value`, the input event; form value
   and validity in a real `<form>` submission and `FormData`; reset and restore; label, description and error
   announced; focus ring and target size; forced colours.
3. **`ocelle-form-select`.** Native `select` inside, closed choices, the same form-association convention, value
   and validity in submission, keyboard behaviour of the native control preserved.

Plus for each: stories per variant and state in light and dark, manifest entries, strict-CSP built output, README
sections and the CHANGELOG entry. Visual baselines and axe over the stories when #10's harness is on main.

Out of scope: `ocelle-button` and #7's metric compact layout; textarea, checkbox, radio and the selection elements
(#14) unless the spec finds a named consumer need; validation logic beyond the native constraints the control
exposes (elements perform no I/O); toasts or a notice stack.

## Risks and open questions

- **External sources unread.** spec-kitty-design#509, #513 and ADR-0078 (D5) were not read; the spec session reads
  them, or the operator supplies them, before the spec check.
- **#10 not merged.** Baselines and axe depend on 006. Either this mission's last phase waits for #10, or it lands
  without baselines and adds them in a follow-up, which the "Done when" does not allow. Plan the order with #10.
- **No WebKit.** Form-associated custom elements, ElementInternals ARIA and live regions in shadow roots behave
  differently in WebKit, which Kitty Desktop uses; only Chromium can be measured here (frontend finding).
- **Screen-reader tests.** No real screen reader runs in CI; "announcement tests" must be defined as tests of the
  accessibility tree and live-region mutations, and the spec should say so plainly so the claim is not overstated.
- **Live region in shadow DOM.** A region created at the same time as its content is often not announced; the
  region usually has to exist before the change. "Once per change" also needs a definition of a change (text, tone,
  both).
- **Label association.** `<label for>` pointing at a form-associated host works; a light-DOM `<label>` pointing into
  a shadow root does not. The `label` attribute path and an external `<label>` path both need tests.
- **006 FR-027.** Form-control text counts as rendered text for the visual gate, and closed shadow roots fail axe;
  the elements must use open roots.
- **Manifest (#27)** and **run-summary index (#30)** conflicts with parallel work; rebase on whichever lands first.
- **Environment.** Node 22 here against 26.13.0 in CI; browser runs need `OCELLE_CHROMIUM_PATH`.
- **Branch.** This record is committed on `claude/009-feedback-forms`, not pushed. If the mission runs, its spec
  directory is `specs/010-feedback-forms/`.

## What would change this decision

- The operator wants smaller missions: split into a notice mission (#513, #509, live region) and a form-controls
  mission (input and select, the form-association convention); both stay missions.
- The operator wants the form-association convention decided before any form element, across #9 and #14: then
  `decision-needed` (or a convention-only mission first), and the form-control stories here are blocked by it.
- #7 is triaged first and takes the compact sizing convention (#509) for all elements: the notice's `size="compact"`
  follows #7 and this mission is blocked by it for that item.
- #10 is abandoned or its harness changes shape: baselines and axe move to whatever replaces it.
