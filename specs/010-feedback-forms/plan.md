# Implementation Plan: Feedback and Forms

**Branch**: `010-feedback-forms` (work on `claude/009-feedback-forms`) | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/010-feedback-forms/spec.md` (issue #9, triage `triage/010-feedback-forms.md`)

## Summary

Three elements in `@ocelle/elements`, written on mission 005's element conventions: `ocelle-notice` (five tones, a
heading slot that leaves no box or gap when absent, a compact size, and announcements through a live region in its
shadow root or on its host, once per insertion, reveal, text or politeness change and never on first load), and two
form-associated controls, `ocelle-form-input` and `ocelle-form-select`, on one internal base class that takes part in
forms through `ElementInternals` (value, validity mirrored from the native control, reset, history restore, fieldset
disabling, external labels), names the inner control without an ID reference across the shadow root, and announces a
host-set error politely. Announcements are measured by a new test capture that snapshots Chromium's accessibility tree
on every mutation of the element (research R-01, measured working in a spike). Stories, baselines and axe follow #10's
design (`specs/006-storybook-workbench`, not yet merged) and are rechecked against it when #10 lands; implementation
starts only after #10 is on `main` (operator wave planning).

## Technical Context

**Language/Version**: TypeScript (strict), Node and pnpm as pinned by the repository (CI 26.13.0; this session Node 22,
frontend finding)

**Primary Dependencies**: Lit 3.3.3 (pinned, 005); no new runtime dependency. `ocelle-form-select` uses `ocelle-icon`.

**Storage**: N/A (elements perform no I/O)

**Testing**: Vitest browser mode with the Playwright provider (projects `elements`, `elements-browser`,
`elements-node`, `elements-build`), strict-CSP fixture pages (005), CDP accessibility tree (005 `test/commands.ts`)
plus the new live-region capture (R-01); Stryker on `packages/elements/src/**` (005, 007); #10's `storybook-build`,
`visual` and `axe` gates for stories.

**Target Platform**: browsers at the README's engine floor; this feature raises it to Chromium 125 and WebKit 17.4 for
CSS custom states (`:state()`, R-03) unless the operator chooses the fallback. Only Chromium is measured.

**Project Type**: library (web components)

**Performance Goals**: no measurable cost beyond one `MutationObserver` per notice and per select, and one animation
frame of withheld tree exposure per announcement.

**Constraints**: strict CSP (`default-src 'none'; script-src 'self'; style-src 'self'`), token-only styles, no ID
reference across a shadow root, open shadow roots (006 FR-014, FR-027).

**Scale/Scope**: 3 elements, 1 internal base class, 1 internal announcement helper; about 60 acceptance scenarios; one
token-record change (ink on state grounds).

## Constitution Check

*GATE: checked before Phase 0 and re-checked after Phase 1 design. Result: passes, with the one tracked exception
below (stories before #10 is not planned: implementation waits for #10).*

| Principle | How this plan meets it |
|---|---|
| I. `ocelle-` names, no I/O, small interface, manifest | Tags `ocelle-notice`, `ocelle-form-input`, `ocelle-form-select`. Events `ocelle-form-input-change`, `ocelle-form-select-change` (`bubbles`, `composed`, `{ value }`); the native composed `input` is the browser's own, not emitted by the element (FR-003). No I/O. Every public member is in `contracts/elements.md` and the generated manifest; observed standard attributes are documented, not declared (FR-034). |
| II. Tokens only, brand rules | Every value is a token (contracts list them); widths `--ocelle-border-width` and `--ocelle-bar-width`, no new token. `--ocelle-color-rule` never marks a control boundary (FR-025). Ink, markers and placeholder contrast computed (R-04): all pass; ink-on-state-ground records added. No monospace. |
| III. Accessible by construction | No ID reference crosses a shadow root: names by `aria-labelledby` and descriptions by `aria-describedby` within the control's shadow root, external labels through `ElementInternals.labels` (R-05, measured). Host ARIA reaches the inner control (R-05). Focus ring, target size, forced colours, reduced motion (no motion used). Announcements designed in (R-02, R-06) and measured on the tree (R-01). axe on every story via #10. |
| IV. Strict CSP, offline | Adopted stylesheets only; browser scenarios on strict-CSP fixture pages loading only the browser build; the `csp` gate on built output. |
| V. Storybook, behaviour tests | A story per variant and state in light and dark with baselines from #10's pinned container (R-08); interaction tests for both events and their payloads and every keyboard path (Enter submission, Tab, arrows on number and select). |
| VI. Consumer-driven, own code | Needs from #9, spec-kitty-design #509 and #513 (through #9's wording, operator SPEC-1-09), kitty-mission-ui's 28 notices and 2 inputs, Kitty Desktop V2's lane and log filters (#15), the Ocelle console's server-rendered forms. Written from scratch. `tel`, `password`, `number`, `min`, `max`, `step` are a stated small addition (spec Assumptions). |
| VII. Semver | All additions (MINOR): three elements, two events, their entry points; CHANGELOG entry (FR-036). |
| VIII. Test-first, non-vacuous | Each phase red first. Announcement scenarios count announcements from a capture whose counting function has its own unit tests including vacuous cases, and each assertion family has a plant (`contracts/testing.md`). Native-twin comparisons for forms (SC-003). Source mutated in process (R-09); Timeout and CompileError on changed lines are reported, not failing (007); survivors are blocking. |
| Licence and supply chain | No new dependency, no new third-party asset. |
| Workflow gates | No new gate. #10's gates (`storybook-build`, `visual`, `axe`) are used as #10 lands them. |

## Decisions the operator should see at the plan gate

1. **Announcement capture** (R-01): a test recorder that pauses the page at each mutation (`debugger` in a
   `MutationObserver`) and reads the accessibility tree over CDP. Measured working on a plain page; whether it works in
   the in-process Vitest harness is the first task (T002). If it does not, the announcement code cannot be
   mutation-tested in process and the plan returns to the operator before phase 2.
2. **Engine floor raised** to Chromium 125 and WebKit 17.4 for CSS custom states (R-03), which let the styles follow
   the effective `tone`, `size` and `type` without rewriting host attributes. Fallback without the raise: attribute
   selectors with `:not()` lists for unknown values.
3. **Host ARIA combination** (R-05; the spec left it to the plan): host `aria-invalid`, `aria-required`,
   `aria-disabled` and `aria-description` are combined with the element's own attributes by "either one" and passed
   to the inner control; the host's attribute is left as written (it never differs from the inner control's state).
4. **No `:not(:defined)` rule in the base stylesheet** (R-10, the spec left it to the plan): the README gives hosts the
   rule instead.
5. **Spec-fix calls the operator has not ruled on** (spec check 3 fixes): a form control revealed by removing `hidden`
   announces its current error once; a notice or control inserted before the browser build loads counts as first load
   and does not announce.
6. **Focused-state stories** use `autofocus`; #10 has no focus parameter, so this is rechecked when #10 lands (R-08).

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
│   ├── ocelle-form-select.ts     # new element (imports ./ocelle-icon.js)
│   ├── form-control.ts           # internal base class (R-05, R-06)
│   ├── live.ts                   # internal: first load, move, withhold (R-02, R-06)
│   ├── index.ts, browser.ts      # re-export and define (shared with 008, 009, 011)
├── test/
│   ├── live.ts                   # live-region capture shared by both harnesses (R-01)
│   ├── live.test.ts              # unit tests of announcements()
│   ├── scenarios/{notice,form-input,form-select}.ts
│   ├── {notice,form-input,form-select}.test.ts           # in process
│   ├── browser/{notice,form-input,form-select}.test.ts   # strict-CSP fixture pages
│   ├── browser/serve.ts          # no-store route, submission recorder
│   ├── fixtures/                 # plants (contracts/testing.md)
│   └── node/readme.test.ts, manifest.test.ts
├── custom-elements.json, README.md, CHANGELOG.md, package.json (exports)
packages/tokens/src/source.ts     # ink contrast grounds (R-04); test/expected.ts counts
storybook/stories/{notice,form-input,form-select}.stories.ts
storybook/baselines/*.png         # from #10's pinned container
storybook/test/integration/elements-stories.test.ts
```

**Structure Decision**: one element per module as 005; shared form behaviour in one internal base class so #14 reuses
it; announcement timing in one internal helper used by the notice and the base class.

## Phases (user stories) for `/speckit-tasks`

1. **Setup.**
   - not exempt: the live-region capture (`test/live.ts`, `test/live.test.ts`, the browser commands in
     `vitest.config.ts`), tests first: `announcements()` unit tests including vacuous cases; then a spike task T002
     that runs the capture in both harnesses on a test-only planted region (`test/fixtures/`) and records the result
     in `reviews/phase-1/spike.md`. Stop for the operator if the in-process run fails (decision 1).
   - not exempt: driver additions (form helpers, focus path) and `serve.ts`'s no-store route and submission recorder,
     each with a test that fails without it.
   - exempt: package `exports` entries and empty registrations are not added here; each phase adds its own.
2. **User Story 1, `ocelle-notice`** (P1, MVP): tokens contrast records (R-04) with the token tests' new counts; the
   notice scenarios 1 to 19 red first, then `src/live.ts` and `src/ocelle-notice.ts`; plants for never-withhold,
   withhold-on-first-load and nested region; README section, manifest regeneration, CHANGELOG line, entry point.
3. **User Story 2, `ocelle-form-input`** (P2): scenarios 1 to 22 and the native twins (SC-003) red first, then
   `src/form-control.ts` and `src/ocelle-form-input.ts`; plants for missing `setFormValue` and reset; README "Form
   controls" section (FR-020 to FR-028 items, htmx triggers, limitations), manifest, CHANGELOG, entry point.
4. **User Story 3, `ocelle-form-select`** (P3): scenarios 1 to 9 and the shared ones of scenario 7 red first, then
   `src/ocelle-form-select.ts`; README section, manifest, CHANGELOG, entry point.
5. **User Story 4, stories, baselines, axe, records** (P4). **Starts only after #10 is on `main` and research R-08's
   recheck is done.** Stories for every state of User Story 4 scenario 1 with the story test red first in
   `storybook/test/integration/elements-stories.test.ts`; baselines from the pinned container; `visual` and `axe` gates
   green; README documentation test complete (SC-006); engine floor raised (decision 2).

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
