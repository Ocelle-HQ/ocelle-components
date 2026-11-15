# Implementation Plan: Feedback and Forms

**Branch**: `010-feedback-forms` (work on `claude/009-feedback-forms`) | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/010-feedback-forms/spec.md` (issue #9, triage `triage/010-feedback-forms.md`)

## Summary

Three elements in `@ocelle/elements`, written on mission 005's element conventions: `ocelle-notice` (five tones, a
heading slot that leaves no box or gap when absent, a compact size, and announcements through a separate live region
in its shadow root that receives a copy of the text after Chromium's accessibility serialisation delay, once per
insertion, reveal, text or politeness change, with changes closer together than the wait merged, and never on first
load; for `role="alert"` the platform's alert event carries insertion, reveal and a change to `alert`, with the
baseline taken at the end of the task), and two
form-associated controls, `ocelle-form-input` and `ocelle-form-select`, on one internal base class that takes part in
forms through `ElementInternals` (value, validity mirrored from the native control, reset, history restore, fieldset
disabling, external labels), names the inner control without an ID reference across the shadow root, and announces a
host-set error politely through the same announcer. Announcements are measured by a new test capture that snapshots
Chromium's accessibility tree on every mutation of the element and tags each snapshot with rendering updates and time,
so only states that a serialisation can hand to assistive technology count (research R-01; re-measured by the T002
spike). The plan reflects the operator's decisions at plan squad rounds 1 to 3 (`reviews/plan/round-1/refute.md`,
`reviews/plan/round-2/refute.md`, `reviews/plan/round-3/refute.md`). Stories, baselines and axe follow #10's
design (`specs/006-storybook-workbench`, not yet merged) and are rechecked against it when #10 lands; implementation
starts only after #10 is on `main` (operator wave planning).

## Technical Context

**Language/Version**: TypeScript (strict), Node and pnpm as pinned by the repository (CI 26.13.0; this session Node 22,
frontend finding)

**Primary Dependencies**: Lit 3.3.3 (pinned, 005); no new runtime dependency. `ocelle-form-select` draws the shared
set's `chevron-down` itself, the icon data from `src/icons.ts` and the drawing from the internal `src/icon-svg.ts`,
and does not define `ocelle-icon` (R-07).

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
external labels, and one timer per pending announcement. An announcement reaches the tree `W` after its last trigger
(300 ms after load, 700 ms before; R-02), and no earlier than `W` of the load state in which the announcer's current
empty state began, counted from its start (a change right after a first load: about 650 to 690 ms after the trigger
on Chromium; phase 2 stop 2, decision (a)), and its copy is held for `H` (5000 ms), or until the next announcement but
at least `W`.

**Constraints**: strict CSP (`default-src 'none'; script-src 'self'; style-src 'self'`), token-only styles, no ID
reference across a shadow root, open shadow roots (006 FR-014, FR-027).

**Scale/Scope**: 3 elements, 1 internal base class, 1 internal announcement helper, a registration flag in
`src/define.ts`, the icon drawing moved to an internal module; about 60 acceptance scenarios plus the SC-002 matrix;
one token-record change (ink on state grounds).

## Constitution Check

*GATE: checked before Phase 0, re-checked after Phase 1 design, after plan squad round 2's fixes (rows III and
VIII, and I for the internal setter), after round 3's fixes (rows I, III and VIII) and after the analysis fixes
(`reviews/analysis/fixes-1.md`, `fixes-2.md` and `fixes-3.md`; rows I and VIII; `fixes-5.md`, row III), and after phase 3's split decision (`reviews/phase-3/decision-split-shard-change.md`; the Licence and supply chain row back to no new dependency). Result: passes, with the one tracked exception below (stories before #10 is not planned: implementation waits for #10).*

| Principle | How this plan meets it |
|---|---|
| I. `ocelle-` names, no I/O, small interface, manifest | Tags `ocelle-notice`, `ocelle-form-input`, `ocelle-form-select`. Events `ocelle-form-input-change`, `ocelle-form-select-change` (`bubbles`, `composed`, `{ value }`), dispatched once per commit through one guarded path (R-05); the native composed `input` is the browser's own, not emitted by the element (FR-003). No I/O. Every public member is in `contracts/elements.md` and the generated manifest, which a phase-3 generator change makes carry the base class's members and `focus()`; observed standard attributes are documented, not declared (FR-034); the input's `value` attribute, its default value with no property of its own, is declared as an attribute with type, default and description, so no exception to this principle is needed (FR-034, research R-05 § Manifest; analysis U6). The protected methods the test plants override (`contracts/testing.md` § Plants, Seams) are not public members; the generator drops them (analysis U7). Importing an element module defines that element and no other (R-07). The test-only timing setter of `src/live.ts` and its `announcerDefaults` constant are internal (not exported from `index.ts` or `browser.ts`, not in the manifest) and change no public member (R-09). |
| II. Tokens only, brand rules | Every value is a token (contracts list them, `icon-size` for the select's indicator included); widths `--ocelle-border-width` and `--ocelle-bar-width`, no new token. `--ocelle-color-rule` never marks a control boundary (FR-025). Ink, markers and placeholder contrast computed (R-04): all pass; ink-on-state-ground records added with every count that holds the required set. No monospace. |
| III. Accessible by construction | No ID reference crosses a shadow root: names by `aria-labelledby` and descriptions by `aria-describedby` to `hidden` spans within the control's shadow root (no duplicate reading), external labels through `ElementInternals.labels`, observed so a changed label renames the control without a focus (R-05, measured). Host ARIA reaches the inner control for `"true"`; other host values, and a host `aria-label` without the visible label text (WCAG 2.5.3), are documented as not supported; a host `aria-label` and `aria-description` also stay on the host's node, pinned by a test (operator decisions, R-05). A host `aria-hidden="true"` is not supported on the notice or a form control, with `hidden` named instead, so the README never tells a host to hide focusable content from assistive technology (FR-009, FR-022; axe `aria-hidden-focus`). Focus ring, target size, forced colours (the error mark's width outside the not-forced-colours block), reduced motion (no motion used), an indicator that lets clicks through. Announcements designed in through a separate atomic announcer that never hides the visible or focusable content and writes after Chromium's serialisation delay (R-02, R-06), measured on the tree at serialisable states only (R-01). A copy is never emptied before it has been current for `W`, and is held for `H` so that a slow screen reader can still fetch it; `H` is a chosen figure the capture cannot prove, stated in the README (operator decision PLAN-FRESH-2-005 (b)). For `role="alert"`, insertion, reveal and a change to `alert` rely on Chromium's alert event instead of a copy, so no change is read twice; the event is cited from Chromium's source, not measured, and named in the README with the WebKit limit (operator decision PLAN-FRESH-2-002 (a)). The alert path takes its baseline at the end of the task, so text or a `tone` set in the same task as the trigger is read once, by the event, and a change back to `status` in that task announces as a `status` notice would, since no alert event fires (round 3 verify 1); a change in a later task before the next serialisation is read twice, a cost the operator accepted and the README states with the advice to set the text first (operator decision PLAN-FRESH-3-002 (b)). The README and FR-008 also say that the event reads a `role="alert"` notice shown by a hidden ancestor, which the other rows do not announce (PLAN-FRESH-3-003). An insertion or a reveal resets the baseline, so the end-of-wait re-check never drops it (PLAN-FRESH-3-001). Changes closer together than `W` merge, and a text changing faster than `W` is not announced until it stops, by operator ruling on FR-008 (PLAN-FRESH-2-001 (a)); the README says so. axe on every story via #10. |
| IV. Strict CSP, offline | Adopted stylesheets only; browser scenarios on strict-CSP fixture pages loading only the browser build; the `csp` gate on built output. |
| V. Storybook, behaviour tests | A story per variant and state in light and dark with baselines from #10's pinned container (R-08); interaction tests for both events and their payloads and every keyboard path (Enter submission, Tab, arrows on number and select). |
| VI. Consumer-driven, own code | Needs from #9, spec-kitty-design #509 and #513 (through #9's wording, operator SPEC-1-09), kitty-mission-ui's 28 notices and 2 inputs, Kitty Desktop V2's lane and log filters (#15), the Ocelle console's server-rendered forms. Written from scratch. `tel`, `password`, `number`, `min`, `max`, `step` are a stated small addition (spec Assumptions). |
| VII. Semver | All additions (MINOR): three elements, two events, their entry points; CHANGELOG entry (FR-036). The engine floor is not raised (R-03), so no consumer loses an engine; a feature found newer than the floor goes to the operator with its semver classification before it is used. The registration flag in `src/define.ts` and the icon drawing's move are internal. |
| VIII. Test-first, non-vacuous | Each phase red first. Announcement scenarios count announcements, under both the `"settled"` and the `"rendered"` rule, from a capture armed before the step (on a container, following shadow roots as they attach, or from navigation for first load) and bounded so a loop fails as an assertion; its reading and counting functions have per-rule unit tests and planted readings (not mutated, reason in R-09). Each assertion family has a plant, run by `test/plants.test.ts` and recorded per phase (`contracts/testing.md`). Native-twin comparisons for forms also assert an absolute expected outcome (SC-003). Source mutated in process (R-09), first load and submission included through in-process paths; Timeout and CompileError on changed lines are reported, not failing (007), and every Timeout in `src/live.ts`, `src/define.ts` and `src/form-control.ts` is reviewed one by one; survivors are blocking. In process the announcer's `D` and `H` come from a test-only setter in `src/live.ts` that only `test/in-process.ts` calls (a `test/node/` test checks this), with the capture's `D` from the same constant, so the timing is shortened for element and oracle alike and the fixture pages prove the real figures (operator decision PLAN-FRESH-2-003 (a), R-09); the shipped figures are one internal constant that an in-process test asserts, with the timing the setter first replaced, against the spec's 150, 350 and 5000 ms, so their mutants are killed in process (operator decision PLAN-FRESH-3-004 (a)). stop()'s quiet window is derived from `W`, the minimum hold and `D`, so a late write cannot end a zero count vacuously (PLAN-FRESH-2-004); the merge, minimum-hold, re-check, reveal-baseline, hold, alert-path, alert-baseline and late-write plants each turn a named scenario red. Every test change of a phase is in its red commit: the gate tests' contrast counts (the `pairs.json` rows are green records), and the README and CHANGELOG documentation assertions of the phase that writes each item, so phase 5 adds none and only maps them; the oracle's node lists are recorded before the red commit and not replaced afterwards (analysis I1, I3, I6, U2). The pinned element lists and counts (the manifest gate's "N elements checked", the README's Entry points rows, the exact `exports` keys, the manifest's module paths, the root's export names) change in the red commit of the phase that adds the element (analysis I7). Red failures are never import errors (analysis C1, C2): phases 2 to 4 commit a scaffold of their new `src/` modules, recorded by `scaffold.sh`, before the red commit, so `tdd-check.sh` check 3 runs the final tests against it; phase 1's new modules are test paths, which `scaffold.sh` refuses and check 2 overlays onto the base, so its red commit carries signature-only stubs and the final tests are run against those stubs and the log kept (`reviews/phase-1/red-evidence.md`); phase 5 merges `main` before its base and its story test also asserts the committed baselines, the phase's only output outside the test pathspec, so check 2 fails on them and the review records that reading; and since check 2 there overlays the stories too, the final story test is also run, recorded, against T060's base without the stories, every assertion it adds failing (analysis C3). A test that passes at `tdd-check.sh` check 3 because the final test infrastructure is overlaid (phase 2's `timing-setter.test.ts`) has its red run as its evidence, and the review names it (analysis C4). The README's pinned convention fragments that the new elements contradict are restated in the red commit of the phase that adds the element, or of an earlier phase, not dropped (analysis I10, I17). |
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
6. **Focused-state stories** focus the element by script after render (a wrapper element in the story file whose
   `connectedCallback` calls `.focus()`), the pattern #10's plant `pass-focus-below-fold` proves keeps focus and hides
   the caret; #10 has no focus parameter and does not prove `autofocus`. Whether the select's `:focus-visible` ring
   shows after a programmatic focus is measured when its stories are written; if not, stop for the operator (R-08).
7. **Announcements through a separate region** (R-02; operator decisions PLAN-FRESH-1-001 (b) and
   PLAN-A11Y-SECURITY-1-002 (a)): a copy of the text is written into a visually hidden atomic live region `W` after the
   last trigger (300 ms after load, 700 ms before), and no earlier than `W` of the load state in which the region's
   current empty state began, counted from its start (phase 2 stop 2, operator decision (a): a change right after a
   first load is written about 700 ms after the region's first render), and held for `H` (5000 ms, or until the next announcement but at
   least `W`), so a browse-mode user may meet the text twice within that window (README; operator decision
   PLAN-FRESH-2-005 (b), which restates the cost accepted at round 1 as `W`). The host's node is kept from being a
   second live region by `internals.ariaLive = "off"`, measured in T002; if Chromium does not honour it, the plan
   stops for the operator before phase 2.
8. **Select indicator drawn in the select** (R-07; operator decision PLAN-CORRECTNESS-1-003 (a)): the convention
   "importing the module defines that element and no other" stands unchanged.
9. **Merging and the minimum hold** (R-02; operator decision PLAN-FRESH-2-001 (a), with spec FR-008, FR-027 and
   SC-002 amended): a trigger while waiting restarts the wait, so changes less than `W` apart in any tasks announce
   the final text once; the text is compared with the baseline when the wait ends; a trigger during the hold empties
   the copy only once it has been current for `W`. A text changing more often than every `W` is not announced until
   it stops (README). The wait also ends no earlier than `W` of the load state in which the region's empty state
   began, counted from its start (phase 2 stop 2, operator decision (a), `reviews/phase-2/decision-stop-2.md`), so a
   region rendered empty before the load is kept for the pre-load `D` the capture's `"settled"` rule asks before a
   change right after the load is written (README).
10. **The platform alert event** (R-02; operator decision PLAN-FRESH-2-002 (a), with spec FR-009 amended): for a host
    `role="alert"`, insertion, reveal and a change to `alert` write no copy; Chromium's alert event
    (`ax_event_generator.cc`) carries them. Not measured by the capture; the scenarios check a zero count and the
    host's `alert` role. The baseline is taken at the end of the task (operator decision PLAN-FRESH-3-002 (b)), so
    text or a `tone` set in the same task is read once, and a change back to `status` in that task acts as if the
    trigger had happened under `status` (the pending marker records the trigger; data-model.md rows; the end-of-task
    step does nothing once the marker has been reset, round 3 verify 2); a change in a later task before the next serialisation is read twice
    (README). The event also reads a `role="alert"` notice shown by a hidden ancestor (PLAN-FRESH-3-003, spec FR-008).
11. **Test-only timing in process** (R-09; operator decision PLAN-FRESH-2-003 (a)): `src/live.ts` exports an internal
    setter for `D` and `H` used only by `test/in-process.ts`; fixture pages run at the real figures. T002 measures the
    mutation dry run and a shard of one 30-line entry of a draft `src/live.ts` (uncommitted, driven by an uncommitted
    spike test through the capture; research R-09; analysis U8), and the plan stops for the operator if that
    `gate:mutation` run takes over 7:00 (420 s) wall-clock (analysis A3). The same check is repeated on the real
    shards that hold `src/live.ts` at phase 2's end (T025) and `src/live.ts` or `src/form-control.ts` at phase 3's
    end (T041), with the same stop (at T041 replaced by the known-gap record below). The shipped figures are the internal constant `announcerDefaults`; the setter returns the timing
    it replaced, and `test/live-timing.test.ts` asserts both against 150, 350 and 5000 ms, so the figures' mutants are
    killed in process (operator decision PLAN-FRESH-3-004 (a), R-09).
    **Known gap: element shards over 7:00 in phase 3** (operator decision, 2026-11-15,
    `reviews/phase-3/decision-split-shard-change.md`; `reviews/phase-3/design-change-3.md`). Mission 010 plans its
    mutation shards on 007 FR-014's rule, as `gates/lib/mutation/shards.ts` has it again since `14538fa`: 30-line entries and
    shards of at most 10 entries and 250 lines, for every file, element source included. On that plan phase 3's
    shards holding `src/form-control.ts` run over 7:00 on this container (`reviews/phase-3/stop-1.md`): shard 2
    (`scripts/manifest.ts:136-166` and `src/form-control.ts:1-30`) took 569.4 s and shard 3 (`:31-60`) 534.6 s; shard 4,
    with no mutant on its lines, took 216.9 s, the fixed cost; by estimate (217 s plus about 14 s a valid mutant)
    eight of the 19 are over 420 s and shards 14, 18 and 19 over 600 s. Shards of static mutants (code run when the
    module loads) cost more: under a 10-mutant cap, shards of 9 static valid mutants took 435.6 s to 448.4 s
    (`reviews/phase-3/stop-2.md`). The two planner changes designed for this at phase 3 stops 1 and 2 (element source
    cut by mutant count, `design-change-1.md`, T041a; probably-static mutants weighted, `design-change-2.md`, T041b)
    were split out of mission 010 by the operator into their own op, op 017 (issue #42, branch
    `claude/042-mutation-shards-by-count`), and reverted on this branch (`14538fa`), history kept so op 017 can start
    from those commits. Mission 010 lands without the rule. CI covers the gap: since op 015 (`ce1d9c7` on `main`) the
    `mutation-shard` job's limit is 45 minutes for a shard holding `packages/elements/src/` and 10 minutes for any
    other (`.github/workflows/ci.yml` on `main`; 010 takes it when `main` is merged at landing), so the measured and estimated element shards fit it. At T041 the shard timing
    against 7:00 is replaced by this record; the whole-diff `gate:mutation -- --base 2004e82` must still exit 0.
    T002's and T025's timings (phases 1 and 2) stand as recorded. Phase 4 has no shard-timing stop of its own; its
    element shards are under the same gap. A mutation shard over CI's limit for it (10 minutes, or 45 for a shard
    holding element source) is still a stop.

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
│   ├── ocelle-form-select.ts     # new element (chevron-down: data from icons.ts, drawn by icon-svg.ts, R-07)
│   ├── form-control.ts           # internal base class (R-05, R-06)
│   ├── live.ts                   # internal: first load, move, the Announcer class (R-02, R-06; plant seam, R-09)
│   ├── define.ts                 # existing: gains the registration flag (R-02)
│   ├── ocelle-icon.ts, icon-svg.ts  # the icon drawing moved to an internal module both elements use; data stays in icons.ts (R-07)
│   ├── index.ts, browser.ts      # re-export and define (shared with 008, 009, 011)
├── test/
│   ├── live.ts                   # live-region capture shared by both harnesses (R-01)
│   ├── live-reading.ts           # pure regionText() and announcements() (R-01, R-09)
│   ├── live-rules.ts             # the reading's unit-test cases, taking the reading as a parameter (U7)
│   ├── live.test.ts              # runs live-rules.ts with live-reading.ts, on recorded trees
│   ├── live-timing-check.ts      # checkShippedTiming(defaults, firstReturn), run by live-timing.test.ts and a plant row (U7)
│   ├── live-timing.test.ts       # in process: shipped announcer figures (R-09, PLAN-FRESH-3-004)
│   ├── in-process-timing.test.ts # in process: capture D and element timing from one constant (R-09)
│   ├── live-capture.test.ts, browser/live-capture.test.ts  # the capture in each harness (phase 1)
│   ├── driver.test.ts, browser/driver.test.ts              # the driver steps in each harness (phase 1)
│   ├── plants.test.ts            # runs each plant against its scenario body (contracts/testing.md)
│   ├── browser/plants.test.ts    # plant rows under startDocument, elements-browser project (U9)
│   ├── browser/plants-entry.ts, browser/global-setup.ts  # plant classes bundled into ocelle-plants.js (phase 2)
│   ├── scenarios/{notice,form-input,form-select}.ts
│   ├── scenarios/notice-matrix.ts   # the SC-002 matrix, table-driven
│   ├── scenarios/form-twins.ts      # native twins with the absolute table (contracts/testing.md § Twins)
│   ├── scenarios/driver.ts, in-process.ts, browser/driver.ts  # existing driver, extended (phase 1; timing call phase 2)
│   ├── {notice,form-input,form-select}.test.ts           # in process
│   ├── browser/{notice,form-input,form-select}.test.ts   # strict-CSP fixture pages
│   ├── browser/serve.ts          # no-store route, submission recorder; ocelle-plants.js in its built files (phase 2)
│   ├── browser/fixtures/         # served fixture pages: planted-region pages, the insertInteractive page and its
│   │                             # DOMContentLoaded script, the capture-loop page and script (phase 1; I12)
│   ├── fixtures/ax/              # recorded getFullAXTree node lists for the reading's unit tests (R-09)
│   ├── fixtures/live-regions.ts, live-loop.ts, reading-plants.ts  # in-process planted regions, looping element, planted readings (phase 1)
│   ├── fixtures/{notice,form-input,form-select}-plants.ts  # plants (contracts/testing.md § Plants, Seams)
│   ├── entry-{notice,form-input,form-select}.test.ts  # each entry defines its own tag only
│   ├── exports.test.ts           # existing: the root's exact export names (pinned list, analysis I7; red)
│   └── node/readme.test.ts, manifest.test.ts, timing-setter.test.ts  # timing-setter: only in-process.ts calls the setter;
│                                 # readme: entryRows and the exact exports keys; manifest: module paths (pinned lists, I7; red)
├── scripts/manifest.ts, custom-elements-manifest.config.mjs  # base-class members, focus(), observed attributes, the input's declared value attribute (phase 3)
├── custom-elements.json, README.md, CHANGELOG.md, package.json (exports)
packages/tokens/src/source.ts     # ink contrast grounds and the count comment (R-04; green)
packages/tokens/contrast/pairs.json  # ten ink-on-state-ground rows (R-04; green)
gates/test/contrast-required.test.ts, contrast.test.ts, contrast-pairs.test.ts,
gates/test/integration/token-gates.test.ts, plants-robustness.test.ts  # required-set counts (R-04 table; red)
gates/bin/contrast.ts             # the count comment (R-04; green)
gates/test/manifest.test.ts, gates/test/integration/manifest.test.ts  # "N elements checked": 3, 4, 5 (analysis I7; red)
gates/plants/manifest/*/tree/packages/elements/custom-elements.json  # plant copies of the manifest, regenerated with it (green)
storybook/stories/{notice,form-input,form-select}.stories.ts
storybook/baselines/*.png         # from #10's pinned container
storybook/test/integration/elements-stories.test.ts
```

**Structure Decision**: one element per module as 005; shared form behaviour in one internal base class so #14 reuses
it; announcement timing in one internal helper used by the notice and the base class.

## Phases (user stories) for `/speckit-tasks`

1. **Setup.**
   - not exempt: the live-region capture (`test/live.ts`, `test/live-reading.ts`, `test/live.test.ts`, the browser
     commands in the repository root's `vitest.config.ts`), tests first: the per-rule unit tests of `regionText()` and `announcements()`
     (both keeping rules, vacuous cases) and the planted readings; container arming with the `attachShadow` patch, the
     document mode, the frame hook and the bounds, each with a test that fails without it. Then a spike task T002 that
     runs the capture in both harnesses on test-only planted regions (in process from `test/fixtures/`, on fixture pages
     as pages under `test/browser/fixtures/`, the directory `test/browser/serve.ts` serves; analysis I12) and records in
     `reviews/phase-1/spike.md`: that a region written after `W` counts one under both rules and one written in a
     microtask or the first animation frame counts zero under `"settled"`; that `internals.ariaLive = "off"` keeps a
     `role="alert"` host from being a live region node; that the in-process first-load path (`registerFirstLoad`) and
     the `readyState` drive work, naming any unreachable mutant; the test `D` for the in-process run (at least two
     rendering updates, so the microtask and first-frame plants still count zero under `"settled"`) and that the
     setter of decision 11 changes the element's and the capture's figures together, returns the timing it replaced,
     and that each test file gets its own `src/live.ts` module instance (so the first call returns
     `announcerDefaults`); the bounds' figures and scenario
     times for the Stryker timeout factor; with the test `D`, the `elements` project's dry-run time and a shard of one
     30-line entry (the largest the shard plan cuts, `gates/lib/mutation/shards.ts:43`) of an uncommitted draft
     `src/live.ts`, driven by an uncommitted spike test through the capture (research R-09; analysis U8), against the
     mutation shard's 10-minute limit
     (`.github/workflows/ci.yml:84-89`), and the fixture-page suite's time at the real figures; the comparison of
     the unit tests' `getFullAXTree` node lists with a re-recording (below). Stop for the operator if the in-process run or the host-role
     measurement fails (decisions 1 and 7), or if a shard's `gate:mutation` run takes over 7:00 (420 s)
     wall-clock (decision 11; analysis A3). The node lists of the
     reading's unit tests are recorded before the red commit by a throwaway script (not committed) and committed with
     the tests in `test/fixtures/ax/`; T002 re-records them with the capture as drafted for T004 (the "prototype": that
     code in the working tree, run by an uncommitted spike test) and stops for the operator if a field the reading
     uses differs; the committed lists are never replaced (analysis I6). `test/in-process.ts` gets the one timing
     constant and gives the capture its `D` from it; the setter call waits for phase 2 (analysis G7).
   - red evidence (constitution VIII; analysis C1): every new module of this phase is under the test pathspec
     (`story-config.yml`: `**/test/**`); only the command registration in the root `vitest.config.ts` is not. So no
     scaffold is possible (`scaffold.sh` refuses test files), and `tdd-check.sh` check 2, which overlays every changed
     test-path file onto the base, puts the capture and driver back and can fail only on the missing registration.
     The red commit therefore carries signature-only stubs of the capture, reading and driver modules (neutral
     returns, no browser command called), against which every test of T001 to T001c fails on an assertion (a test
     whose expected value is a stub's neutral value pairs it with a non-neutral one). After green, the final test
     files are run against the red commit's stubs, as check 3 runs them against a scaffold, and the log is kept;
     `reviews/phase-1/red-evidence.md` records it with the reading of check 2 (not evidence here; a zero exit stops
     for the operator), written after `tdd-check.sh` has run, since it reads that run's log (T005a; analysis I11).
   - not exempt: driver additions (`insert` per way, `laterTask`, `registerFirstLoad`, `drive.readyState`,
     `drive.after` returning the gap it achieved and the `W` in force that scenario bodies state times against (analysis A2),
     `insertInteractive` in both harnesses (in process through `drive.readyState`, on fixture pages from a
     `DOMContentLoaded` handler under `startDocument`; analysis U4), `hostRole`, `liveCapture.stop({ atLeast })` and the derived quiet window, form
     helpers with the in-process `submit` semantics, `blur`, `click` at a point, focus path) and `serve.ts`'s no-store
     route and submission recorder, each with a test that fails without it; `test/plants.test.ts` and
     `test/browser/plants.test.ts` (rows under `startDocument`, the `elements-browser` project; analysis U9) with their
     row format; the reading's unit-test cases written once, taking the reading as a parameter, in
     `test/live-rules.ts`, so the planted-reading rows run the same cases (analysis U7).
   - exempt: package `exports` entries and empty registrations are not added here; each phase adds its own.
2. **User Story 1, `ocelle-notice`** (P1, MVP): first the scaffold, recorded by `scaffold.sh`: `src/live.ts`
   (`announcerDefaults` with a neutral value, the setter returning it) and `src/ocelle-notice.ts` (the class, not
   defined), so the red tests fail on assertions; its staleness of the committed manifest makes the manifest gate's
   repository cases fail until the green regeneration, as in 005 phase 5 (analysis C2). Then the
   pinned element lists and counts, red first, in the order R-11 gives (3 elements checked; the notice's entry after
   `ocelle-brand-mark`'s; analysis I7); tokens contrast records (R-04) with every file that holds a figure of
   the required set, as R-04's table lists them with file, line and derivation: the gate tests (the A.8 test, the
   summary-count, entry-count and plant-variant tests) red first, then `pairs.json`, `source.ts` and the comments in
   `contrast.ts` and `source.ts` in green (analysis I1, U1); the notice
   scenarios 1 to 19 (8 and 9 once per way of inserting; 12 and 15 with the focused-link variants; 15 with the
   `role="alert"` cells whose text is set in the same task after insertion, after reveal and after the role change,
   and whose `tone` is changed in the same task after insertion (count 0, host role `alert`, PLAN-FRESH-3-002 (b)),
   and the cells inserted or revealed as `alert` and changed to `status` in the same task (count 1, polite, host
   role `status`; round 3 verify 1); 17 with first loaded hidden then revealed, and announced,
   hidden and revealed with the same text (count 1 each, PLAN-FRESH-3-001); 13 with the
   changes in different tasks 100 ms apart (count 1), `A`, `B`, `A` within the wait (count 0), a change 10 ms after
   a write (the first copy counts under `"settled"`, then the new text once) and the hold (the copy settled for `H`,
   then emptied); 15 with the `alert` cells that count zero and check the host's `alert` role; 8 inserted while
   `readyState` is `"interactive"`, an insertion with the pre-load `W` (spec FR-008, analysis A1); the notice Edge
   Cases: removed and inserted again in a later task, whitespace only, an empty notice, two notices changed in one task,
   long unbroken text, two copies (analysis G1, G4); unknown `tone` and `size` kept in the attribute (analysis G5);
   a notice inside a hidden ancestor that is then shown, count 0 with the region present and the text visible, and
   with `role="alert"` count 0 with the host role `alert` (analysis G10); the timed cells asserting the gap
   `drive.after` returns lies between their stated fraction of `W` and `W` (analysis A2)) and the **SC-002
   matrix**, a table-driven scenario body with one expected count per cell (five tones × triggers insertion, reveal,
   text change, politeness change, and non-triggers first load, same text, re-render, move, `announce` set later,
   change while hidden × the no-role, `alert` and `status` rows, with the politeness change and "`announce` set later"
   read per row as SC-002 says; in the `alert` row insertion, reveal and `status` → `alert` expect zero live-region
   announcements and the host's `alert` role, as SC-002 says), no conditional assertion, red first; then the
   registration flag in `src/define.ts`, `src/live.ts` (with `announcerDefaults`, the test-only timing setter that
   returns the timing it replaced, `test/live-timing.test.ts` red first against the spec figures, and the `test/node/`
   check of the setter's only caller, and `test/in-process-timing.test.ts` red first for the wiring of
   `test/in-process.ts` to the setter with the capture's constant, analysis G7) and `src/ocelle-notice.ts`; the
   notice's manifest entry tested red first (`test/node/manifest.test.ts`: its attributes, two slots, two parts, no
   events, no CSS custom properties, no `role` or `hidden` attribute) with `role` and `hidden` added to the
   generator's drop list in this phase (analysis I2); the notice's plants (`contracts/testing.md` § Plants) run and recorded
   in `reviews/phase-2/plants.md`; the README floor list checked against the features used, `ElementInternals` with
   `ariaLive` and `MessageChannel` (no raise planned, R-03; analysis I8);
   README section (the announcer, `W` and its source, the merging of changes closer than `W` and the starvation case,
   the hold `H` as a chosen figure not measured, the double reading for up to `H`, the platform alert event for
   `role="alert"` with its source and the WebKit limit, the end-of-task alert baseline with the double reading of a
   later-task change before the next serialisation and the advice to set the text first, the same-task change back to `status`, the alert event's reading
   of a `role="alert"` notice shown by a hidden ancestor (`ax_event_generator.cc` 416-417, 1081-1082) against the
   other rows' silence, the host-role limit), its assertions and the CHANGELOG line's in `test/node/readme.test.ts`
   in the red commit (analysis I3, U2), with the README's pinned convention fragments that the notice contradicts
   restated in that red commit and the README text in green (the `@default undefined` rule, now a `@default` with the
   value the property reads on every property that can be set; the host-`aria-label` sentences
   (`readme.test.ts:74-76`) scoped to `ocelle-icon` and `ocelle-brand-mark`, analysis I14; the host-`role` sentence,
   now scoped to `ocelle-icon`
   and `ocelle-brand-mark`, with the notice's roles and `aria-hidden="false"` not supported in its section; the host
   `aria-hidden="true"` and `hidden` sentences scoped likewise, with a host `aria-hidden="true"` on the notice not
   supported and `hidden` named instead, FR-009; analysis I10, I15, U10, U11), manifest regeneration, CHANGELOG line, entry point and its entry
   test; the plant seams of `contracts/testing.md` § Plants (the scaffold exports `Announcer`; analysis U7); and, at
   the phase-end `gate:mutation`, every shard holding a `src/live.ts` entry timed, a shard over 7:00 a stop
   (decision 11; analysis U8).
3. **User Story 2, `ocelle-form-input`** (P2): a scaffold first (`src/form-control.ts` and `src/ocelle-form-input.ts`,
   classes without members, not defined; analysis C2) and the pinned lists and counts in the red commit (4 elements;
   analysis I7); then, test first in `test/node/manifest.test.ts`, the manifest
   generator change (PLAN-CORRECTNESS-1-004): `scripts/manifest.ts` and `custom-elements-manifest.config.mjs` analyse
   `src/form-control.ts`, fold its members into each subclass's entry and drop the internal module from the output, so
   no new kind of source path appears (FR-034, #27); `focus()` is declared (an override with a description in the base
   class, or a normalisation step); the drop list of observed standard attributes gains `form`, `aria-invalid`,
   `aria-required`, `aria-disabled` and `aria-description` (`role` and `hidden` were added in phase 2), and the
   `ocelle-form-input` entry with every FR-034 member, its event and detail type, its four parts and its empty slot
   and CSS-property lists (analysis G9), including the `value` attribute declared without a field (type `string`,
   default `""`, a description; research R-05 § Manifest; analysis U6). Then scenarios 1 to 23 (20 once per way of
   inserting; 21 with the mixed form; 22 with first loaded hidden then revealed, and announced, hidden and revealed
   with the same `error`, count 1 each, PLAN-FRESH-3-001), an `error` set while the field has focus (count 1, then
   the same text again count 0) and a control with `error` shown through a hidden ancestor (count 0; analysis G10),
   FR-027's merge (two `error` changes 100 ms apart count 1, `A`, `B`, `A` within
   the wait count 0), `font: inherit` on the inner control (FR-002, analysis G3), the pass-through properties' types,
   no `defaultValue` and an unknown `type` kept (FR-001, FR-021, FR-029, analysis G5), the input's Edge Cases (a
   non-numeric `number`, long unbroken text, right-to-left, two copies; analysis G4) and the native twins with the
   absolute table (SC-003), the `form="other"` and outside-any-form rows included (FR-020, analysis G2), red first; then
   `src/form-control.ts` and `src/ocelle-form-input.ts`; the form and error plants run and recorded; README "Form
   controls" section (FR-020 to FR-028 items, host ARIA `"true"` only, `aria-label` with the visible label text, the
   host's duplicate name and description, the mixed-form limitation, htmx triggers, limitations) with its assertions
   and the CHANGELOG line's in the red commit; the engine floor checked against the features this phase adds
   (form association and the form-associated callbacks, `delegatesFocus`; `ElementInternals` itself is phase 2's) and
   recorded (analysis G8, I8); beside the Host ARIA sentences phase 2 scoped to `ocelle-icon` and
   `ocelle-brand-mark`, the form controls' rule for a host `aria-label` (a blank one is skipped, FR-022) and their
   host `role`, `aria-hidden="false"` and `aria-hidden="true"` not supported (`hidden` named instead), the control's
   name taking a host `aria-label` collapsed and trimmed while the host's node keeps it as written (pass it trimmed;
   US2 scenario 13's cell), and the declared `value` attribute stated, each fragment in the red commit (analysis
   I10, U6, U10, U11, A5); manifest, CHANGELOG, entry point and its
   entry test; at the phase-end `gate:mutation`, every shard holding a `src/live.ts` or `src/form-control.ts` entry
   timed, a shard over 7:00 a stop (decision 11; analysis U8). After phase 3 stops 1 and 2, that timing is replaced
   by decision 11's known-gap record: the element-shard planner change (T041a, T041b) moved to op 017 (#42) by the
   operator's decision, and the phase lands on the 30-line shard plan of 007 FR-014.
4. **User Story 3, `ocelle-form-select`** (P3): a scaffold first (`src/ocelle-form-select.ts`, the class without
   members, not defined; analysis C2) and the pinned lists and counts in the red commit (5 elements; analysis I7);
   the `ocelle-form-select` manifest entry tested red first as the input's (analysis G9); scenarios 1 to 9 and the shared ones of scenario 7 red first, with the
   select's twin rows (`form="other"` and outside any form included), `font: inherit`, the ignored host `value`
   attribute, no `defaultValue`, no options, long label text and right-to-left (analysis G2 to G5), the README and
   CHANGELOG assertions, and the select's entry test (defines `ocelle-form-select` only); then the icon drawing moved
   to `src/icon-svg.ts` with the icon tests green (the icon data stays in `src/icons.ts`), and
   `src/ocelle-form-select.ts`; the select's plants run and recorded; README section (tokens read with `icon-size`);
   the engine floor checked against the features this phase adds and recorded (analysis G8); manifest, CHANGELOG,
   entry point.
5. **User Story 4, stories, baselines, axe, records** (P4). **Starts only after #10 is on `main` and research R-08's
   recheck is done.** `main` is merged before `base.sh 5`, so the base holds #10's harness and the three elements.
   Stories for every state of User Story 4 scenario 1 with the story test red first in
   `storybook/test/integration/elements-stories.test.ts`, which also asserts each new story's committed light and
   dark baselines; the stories are test paths (no scaffold), so `tdd-check.sh` check 2 fails on the missing baselines
   alone, and the review records that reading with the red log as the stories' evidence (analysis C1); the final
   story test is also run against T060's base with no story file, its log kept and every assertion it adds failing
   (analysis C3); phase 5 changes no file outside the three story files, the story test and the baselines
   (`storybook/stories/render.ts`, not a test path, stays as the base has it; a story that needs it changed is a
   stop for the operator); baselines from the pinned container; `visual` and `axe` gates
   green; the README documentation test checked complete (SC-006): every item of FR-035 and SC-006 mapped to its
   assertion and the phase 2 to 4 red commit that showed it failing, with no assertion added in phase 5 (analysis U2). The engine floor is not raised (decision 2).

Each phase ends with `pnpm run gate:unit-tests`, `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:manifest`,
`gate:csp`, `gate:prefix`, `gate:contrast`, `gate:test-lint` and `gate:mutation` green on the branch.

**Recheck when #10 landed** (FR-033, operator wave planning): #10 is on `main` (3828d2f) and this plan's story,
baseline and axe items follow `specs/006-storybook-workbench` as merged there (spec FR-025, FR-031,
`contracts/gates.md`, `contracts/container.md`). Research R-08's comparison was done on 2026-11-13 against 3828d2f
(`reviews/phase-5/recheck.md`): everything matched except the focused-state mechanism, changed by operator decision
from `autofocus` to a focus by script after render (decision 6). A later difference is a recorded plan change.

**Merges** (R-11): shared files with missions 008, 009 and 011 (`src/index.ts`, `src/browser.ts`, `package.json`
exports, `custom-elements.json`, the README element list, Storybook configuration) are reconciled by merging `main`,
never rebasing; the manifest is regenerated, not hand-merged. Each new element's `exports` key and Entry points row
goes after the last element entry and before `./browser.js`, in the order the elements are added (the existing order,
`ocelle-icon` then `ocelle-brand-mark`, is that order); the manifest's module paths and the root's export names are
in code-point order (analysis I7).

## Complexity Tracking

| Exception | Scope | Rationale | Sunset |
|---|---|---|---|
| None planned. | — | Stories, baselines and axe are not deferred: implementation waits for #10 (FR-033). If the operator lets phases 2 to 4 land before #10, the stories of 005's precedent row ("no baselines and no axe until #10") would be needed here too, with the operator's approval. | — |
