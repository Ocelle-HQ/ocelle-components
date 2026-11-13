# Implementation Plan: Feedback and Forms

**Branch**: `010-feedback-forms` (work on `claude/009-feedback-forms`) | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/010-feedback-forms/spec.md` (issue #9, triage `triage/010-feedback-forms.md`)

## Summary

Three elements in `@ocelle/elements`, written on mission 005's element conventions: `ocelle-notice` (five tones, a
heading slot that leaves no box or gap when absent, a compact size, and announcements through a separate live region
in its shadow root that receives a copy of the text after Chromium's accessibility serialisation delay, once per
insertion, reveal, text or politeness change and never on first load), and two
form-associated controls, `ocelle-form-input` and `ocelle-form-select`, on one internal base class that takes part in
forms through `ElementInternals` (value, validity mirrored from the native control, reset, history restore, fieldset
disabling, external labels), names the inner control without an ID reference across the shadow root, and announces a
host-set error politely through the same announcer. Announcements are measured by a new test capture that snapshots
Chromium's accessibility tree on every mutation of the element and tags each snapshot with rendering updates and time,
so only states that a serialisation can hand to assistive technology count (research R-01; re-measured by the T002
spike). The plan reflects the operator's decisions at plan squad round 1 (`reviews/plan/round-1/refute.md`). Stories, baselines and axe follow #10's
design (`specs/006-storybook-workbench`, not yet merged) and are rechecked against it when #10 lands; implementation
starts only after #10 is on `main` (operator wave planning).

## Technical Context

**Language/Version**: TypeScript (strict), Node and pnpm as pinned by the repository (CI 26.13.0; this session Node 22,
frontend finding)

**Primary Dependencies**: Lit 3.3.3 (pinned, 005); no new runtime dependency. `ocelle-form-select` draws the shared
set's `chevron-down` from `src/icons.ts` itself and does not define `ocelle-icon` (R-07).

**Storage**: N/A (elements perform no I/O)

**Testing**: Vitest browser mode with the Playwright provider (projects `elements`, `elements-browser`,
`elements-node`, `elements-build`), strict-CSP fixture pages (005), CDP accessibility tree (005 `test/commands.ts`)
plus the new live-region capture (R-01) and its pure reading in `test/live-reading.ts`; Stryker on
`packages/elements/src/**` (005, 007); #10's `storybook-build`,
`visual` and `axe` gates for stories.

**Target Platform**: browsers at the README's engine floor, unchanged at Chromium 120 and WebKit 16.4: no CSS custom
state is used (operator decision PLAN-FRESH-1-004 (c), R-03), and each phase checks the features it adds against the
README's floor list. Only Chromium is measured.

**Project Type**: library (web components)

**Performance Goals**: no measurable cost beyond one `MutationObserver` per notice, per select and per control with
external labels, and one timer per pending announcement. An announcement reaches the tree `W` after its trigger
(300 ms after load, 700 ms before; R-02) and its copy is held for `W`.

**Constraints**: strict CSP (`default-src 'none'; script-src 'self'; style-src 'self'`), token-only styles, no ID
reference across a shadow root, open shadow roots (006 FR-014, FR-027).

**Scale/Scope**: 3 elements, 1 internal base class, 1 internal announcement helper, a registration flag in
`src/define.ts`, the icon drawing moved to an internal module; about 60 acceptance scenarios plus the SC-002 matrix;
one token-record change (ink on state grounds).

## Constitution Check

*GATE: checked before Phase 0 and re-checked after Phase 1 design. Result: passes, with the one tracked exception
below (stories before #10 is not planned: implementation waits for #10).*

| Principle | How this plan meets it |
|---|---|
| I. `ocelle-` names, no I/O, small interface, manifest | Tags `ocelle-notice`, `ocelle-form-input`, `ocelle-form-select`. Events `ocelle-form-input-change`, `ocelle-form-select-change` (`bubbles`, `composed`, `{ value }`), dispatched once per commit through one guarded path (R-05); the native composed `input` is the browser's own, not emitted by the element (FR-003). No I/O. Every public member is in `contracts/elements.md` and the generated manifest, which a phase-3 generator change makes carry the base class's members and `focus()`; observed standard attributes are documented, not declared (FR-034). Importing an element module defines that element and no other (R-07). |
| II. Tokens only, brand rules | Every value is a token (contracts list them, `icon-size` for the select's indicator included); widths `--ocelle-border-width` and `--ocelle-bar-width`, no new token. `--ocelle-color-rule` never marks a control boundary (FR-025). Ink, markers and placeholder contrast computed (R-04): all pass; ink-on-state-ground records added with every count that holds the required set. No monospace. |
| III. Accessible by construction | No ID reference crosses a shadow root: names by `aria-labelledby` and descriptions by `aria-describedby` to `hidden` spans within the control's shadow root (no duplicate reading), external labels through `ElementInternals.labels`, observed so a changed label renames the control without a focus (R-05, measured). Host ARIA reaches the inner control for `"true"`; other host values, and a host `aria-label` without the visible label text (WCAG 2.5.3), are documented as not supported; a host `aria-label` and `aria-description` also stay on the host's node, pinned by a test (operator decisions, R-05). Focus ring, target size, forced colours (the error mark's width outside the not-forced-colours block), reduced motion (no motion used), an indicator that lets clicks through. Announcements designed in through a separate atomic announcer that never hides the visible or focusable content and writes after Chromium's serialisation delay (R-02, R-06), measured on the tree at serialisable states only (R-01). axe on every story via #10. |
| IV. Strict CSP, offline | Adopted stylesheets only; browser scenarios on strict-CSP fixture pages loading only the browser build; the `csp` gate on built output. |
| V. Storybook, behaviour tests | A story per variant and state in light and dark with baselines from #10's pinned container (R-08); interaction tests for both events and their payloads and every keyboard path (Enter submission, Tab, arrows on number and select). |
| VI. Consumer-driven, own code | Needs from #9, spec-kitty-design #509 and #513 (through #9's wording, operator SPEC-1-09), kitty-mission-ui's 28 notices and 2 inputs, Kitty Desktop V2's lane and log filters (#15), the Ocelle console's server-rendered forms. Written from scratch. `tel`, `password`, `number`, `min`, `max`, `step` are a stated small addition (spec Assumptions). |
| VII. Semver | All additions (MINOR): three elements, two events, their entry points; CHANGELOG entry (FR-036). The engine floor is not raised (R-03), so no consumer loses an engine; a feature found newer than the floor goes to the operator with its semver classification before it is used. The registration flag in `src/define.ts` and the icon drawing's move are internal. |
| VIII. Test-first, non-vacuous | Each phase red first. Announcement scenarios count announcements, under both the `"settled"` and the `"rendered"` rule, from a capture armed before the step (on a container, following shadow roots as they attach, or from navigation for first load) and bounded so a loop fails as an assertion; its reading and counting functions have per-rule unit tests and planted readings (not mutated, reason in R-09). Each assertion family has a plant, run by `test/plants.test.ts` and recorded per phase (`contracts/testing.md`). Native-twin comparisons for forms also assert an absolute expected outcome (SC-003). Source mutated in process (R-09), first load and submission included through in-process paths; Timeout and CompileError on changed lines are reported, not failing (007), and every Timeout in `src/live.ts`, `src/define.ts` and `src/form-control.ts` is reviewed one by one; survivors are blocking. |
| Licence and supply chain | No new dependency, no new third-party asset. |
| Workflow gates | No new gate. #10's gates (`storybook-build`, `visual`, `axe`) are used as #10 lands them. |

## Decisions the operator should see at the plan gate

1. **Announcement capture** (R-01): a test recorder that pauses the page at each mutation (`debugger` in a
   `MutationObserver`), reads the accessibility tree over CDP, and tags each snapshot with rendering updates and time;
   only states current across a rendering update and for longer than Chromium's serialisation delay count (operator
   decision PLAN-TESTABILITY-1-001 (a)). Whether it works in the in-process Vitest harness, and the first-load and
   `readyState` paths of R-09, are the first task (T002). If it does not, the announcement code cannot be
   mutation-tested in process and the plan returns to the operator before phase 2.
2. **Engine floor kept** at Chromium 120 and WebKit 16.4 (operator decision PLAN-FRESH-1-004 (c)): styles follow the
   effective `tone` and `size` through classes on a shadow-internal box, and `type` through the inner input's own
   attribute (R-03); no `:state()`.
3. **Host ARIA combination** (R-05; the spec left it to the plan): host `aria-invalid`, `aria-required` and
   `aria-disabled` are combined with the element's own attributes by "either one" for the value `"true"` only; any
   other host value is not supported and documented (operator decision PLAN-CORRECTNESS-1-006 (a)). Host
   `aria-description` is added to the description. A host `aria-label` and `aria-description` stay on the host's node
   (operator decision PLAN-A11Y-SECURITY-1-005 (b)); a host `aria-label` with a visible label must contain its text
   (operator decision PLAN-A11Y-SECURITY-1-006 (b)). The first draft's "never differs" claim is withdrawn.
4. **No `:not(:defined)` rule in the base stylesheet** (R-10, the spec left it to the plan): the README gives hosts the
   rule instead.
5. **Spec-fix calls the operator has not ruled on** (spec check 3 fixes): a form control revealed by removing `hidden`
   announces its current error once; a notice or control inserted before the browser build loads counts as first load
   and does not announce. Since plan squad round 1 (PLAN-CORRECTNESS-1-001), "first load" is "connected while the
   document is loading, or upgraded by the registration of the definition", so an htmx swap after the build has
   loaded announces (spec FR-008).
6. **Focused-state stories** use `autofocus`; #10 has no focus parameter, so this is rechecked when #10 lands (R-08).
7. **Announcements through a separate region** (R-02; operator decisions PLAN-FRESH-1-001 (b) and
   PLAN-A11Y-SECURITY-1-002 (a)): a copy of the text is written into a visually hidden atomic live region `W` after the
   trigger (300 ms after load, 700 ms before) and held for `W`, so a browse-mode user may meet the text twice within
   that window (README). The host's node is kept from being a second live region by `internals.ariaLive = "off"`,
   measured in T002; if Chromium does not honour it, the plan stops for the operator before phase 2.
8. **Select indicator drawn in the select** (R-07; operator decision PLAN-CORRECTNESS-1-003 (a)): the convention
   "importing the module defines that element and no other" stands unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/010-feedback-forms/
├── spec.md, checklists/requirements.md, triage.ref
├── plan.md            # this file
├── research.md        # R-01 to R-11
├── data-model.md      # element state and announcement transitions
├── quickstart.md
├── contracts/
│   ├── elements.md    # public surface of the three elements
│   └── testing.md     # live-region capture, form helpers, plants
├── reviews/           # spec checks, plan squad, phase reviews
└── tasks.md           # /speckit-tasks
```

### Source Code (repository root)

```text
packages/elements/
├── src/
│   ├── ocelle-notice.ts          # new element
│   ├── ocelle-form-input.ts      # new element
│   ├── ocelle-form-select.ts     # new element (draws chevron-down from icons.ts, R-07)
│   ├── form-control.ts           # internal base class (R-05, R-06)
│   ├── live.ts                   # internal: first load, move, announcer (R-02, R-06)
│   ├── define.ts                 # existing: gains the registration flag (R-02)
│   ├── ocelle-icon.ts, icon-svg.ts  # the icon drawing moved to an internal module both elements use (R-07)
│   ├── index.ts, browser.ts      # re-export and define (shared with 008, 009, 011)
├── test/
│   ├── live.ts                   # live-region capture shared by both harnesses (R-01)
│   ├── live-reading.ts           # pure regionText() and announcements() (R-01, R-09)
│   ├── live.test.ts              # unit tests of the reading and counting, on recorded trees
│   ├── plants.test.ts            # runs each plant against its scenario body (contracts/testing.md)
│   ├── scenarios/{notice,form-input,form-select}.ts
│   ├── {notice,form-input,form-select}.test.ts           # in process
│   ├── browser/{notice,form-input,form-select}.test.ts   # strict-CSP fixture pages
│   ├── browser/serve.ts          # no-store route, submission recorder
│   ├── fixtures/                 # plants (contracts/testing.md)
│   ├── entry-{notice,form-input,form-select}.test.ts  # each entry defines its own tag only
│   └── node/readme.test.ts, manifest.test.ts
├── scripts/manifest.ts, custom-elements-manifest.config.mjs  # base-class members, focus(), observed attributes (phase 3)
├── custom-elements.json, README.md, CHANGELOG.md, package.json (exports)
packages/tokens/src/source.ts     # ink contrast grounds (R-04)
packages/tokens/contrast/pairs.json  # ten ink-on-state-ground rows (R-04)
gates/test/contrast-required.test.ts, contrast.test.ts, contrast-pairs.test.ts,
gates/test/integration/token-gates.test.ts, plants-robustness.test.ts, gates/bin/contrast.ts  # required-set counts (R-04)
storybook/stories/{notice,form-input,form-select}.stories.ts
storybook/baselines/*.png         # from #10's pinned container
storybook/test/integration/elements-stories.test.ts
```

**Structure Decision**: one element per module as 005; shared form behaviour in one internal base class so #14 reuses
it; announcement timing in one internal helper used by the notice and the base class.

## Phases (user stories) for `/speckit-tasks`

1. **Setup.**
   - not exempt: the live-region capture (`test/live.ts`, `test/live-reading.ts`, `test/live.test.ts`, the browser
     commands in `vitest.config.ts`), tests first: the per-rule unit tests of `regionText()` and `announcements()`
     (both keeping rules, vacuous cases) and the planted readings; container arming with the `attachShadow` patch, the
     document mode, the frame hook and the bounds, each with a test that fails without it. Then a spike task T002 that
     runs the capture in both harnesses on test-only planted regions (`test/fixtures/`) and records in
     `reviews/phase-1/spike.md`: that a region written after `W` counts one under both rules and one written in a
     microtask or the first animation frame counts zero under `"settled"`; that `internals.ariaLive = "off"` keeps a
     `role="alert"` host from being a live region node; that the in-process first-load path (`registerFirstLoad`) and
     the `readyState` drive work, naming any unreachable mutant; the bounds' figures and scenario times for the Stryker
     timeout factor; the recorded `getFullAXTree` node lists the unit tests use. Stop for the operator if the
     in-process run or the host-role measurement fails (decisions 1 and 7).
   - not exempt: driver additions (`insert` per way, `laterTask`, `registerFirstLoad`, `drive.readyState`, form
     helpers with the in-process `submit` semantics, `blur`, `click` at a point, focus path) and `serve.ts`'s no-store
     route and submission recorder, each with a test that fails without it; `test/plants.test.ts` with its row format.
   - exempt: package `exports` entries and empty registrations are not added here; each phase adds its own.
2. **User Story 1, `ocelle-notice`** (P1, MVP): tokens contrast records (R-04) with every file that holds the required
   set (`pairs.json`, the A.8 test, the summary-count tests, the `contrast.ts` comment), red first; the notice
   scenarios 1 to 19 (8 and 9 once per way of inserting; 12 and 15 with the focused-link variants) and the **SC-002
   matrix**, a table-driven scenario body with one expected count per cell (five tones × triggers insertion, reveal,
   text change, politeness change, and non-triggers first load, same text, re-render, move, `announce` set later,
   change while hidden × the no-role, `alert` and `status` rows, with the politeness change and "`announce` set later"
   read per row as SC-002 says), no conditional assertion, red first; then the registration flag in `src/define.ts`,
   `src/live.ts` and `src/ocelle-notice.ts`; the notice's plants (`contracts/testing.md` § Plants) run and recorded in
   `reviews/phase-2/plants.md`; the README floor list checked against the features used (no raise planned, R-03);
   README section (the announcer, `W` and its source, the transient double reading, the host-role limit), manifest
   regeneration, CHANGELOG line, entry point and its entry test.
3. **User Story 2, `ocelle-form-input`** (P2): first, test first in `test/node/manifest.test.ts`, the manifest
   generator change (PLAN-CORRECTNESS-1-004): `scripts/manifest.ts` and `custom-elements-manifest.config.mjs` analyse
   `src/form-control.ts`, fold its members into each subclass's entry and drop the internal module from the output, so
   no new kind of source path appears (FR-034, #27); `focus()` is declared (an override with a description in the base
   class, or a normalisation step); the drop list of observed standard attributes gains `role`, `hidden`, `form`,
   `aria-invalid`, `aria-required`, `aria-disabled` and `aria-description`. Then scenarios 1 to 23 (20 once per way of
   inserting; 21 with the mixed form) and the native twins with the absolute table (SC-003), red first; then
   `src/form-control.ts` and `src/ocelle-form-input.ts`; the form and error plants run and recorded; README "Form
   controls" section (FR-020 to FR-028 items, host ARIA `"true"` only, `aria-label` with the visible label text, the
   host's duplicate name and description, the mixed-form limitation, htmx triggers, limitations), manifest, CHANGELOG,
   entry point and its entry test.
4. **User Story 3, `ocelle-form-select`** (P3): scenarios 1 to 9 and the shared ones of scenario 7 red first, and the
   select's entry test (defines `ocelle-form-select` only); then the icon drawing moved to `src/icon-svg.ts` with the
   icon tests green, and `src/ocelle-form-select.ts`; the select's plants run and recorded; README section (tokens read
   with `icon-size`), manifest, CHANGELOG, entry point.
5. **User Story 4, stories, baselines, axe, records** (P4). **Starts only after #10 is on `main` and research R-08's
   recheck is done.** Stories for every state of User Story 4 scenario 1 with the story test red first in
   `storybook/test/integration/elements-stories.test.ts`; baselines from the pinned container; `visual` and `axe` gates
   green; README documentation test complete (SC-006). The engine floor is not raised (decision 2).

Each phase ends with `pnpm run gate:unit-tests`, `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:manifest`,
`gate:csp`, `gate:prefix`, `gate:contrast`, `gate:test-lint` and `gate:mutation` green on the branch.

**Recheck when #10 lands** (FR-033, operator wave planning): this plan's story, baseline and axe items are written
against `specs/006-storybook-workbench` on branch `claude/010-storybook-workbench` (spec FR-025, FR-031,
`contracts/gates.md`, `contracts/container.md`). When #10 is merged, research R-08's comparison is done before phase 5,
and any difference is a recorded plan change.

**Merges** (R-11): shared files with missions 008, 009 and 011 (`src/index.ts`, `src/browser.ts`, `package.json`
exports, `custom-elements.json`, the README element list, Storybook configuration) are reconciled by merging `main`,
never rebasing; the manifest is regenerated, not hand-merged.

## Complexity Tracking

| Exception | Scope | Rationale | Sunset |
|---|---|---|---|
| None planned. | — | Stories, baselines and axe are not deferred: implementation waits for #10 (FR-033). If the operator lets phases 2 to 4 land before #10, the stories of 005's precedent row ("no baselines and no axe until #10") would be needed here too, with the operator's approval. | — |
