# Implementation Plan: Selection and Input Elements

**Branch**: `014-selection-input` (work on `claude/014-selection-input`) | **Date**: 2026-11-13 | **Spec**:
[spec.md](spec.md)

**Input**: Feature specification from `specs/014-selection-input/spec.md` (approved at the spec gate after a final fix
of check 3, 2026-11-13).

**Implementation waits for #10.** By the operator's decision at spec check 1 (Q3 (c)), no phase is implemented until
#10 (Storybook workbench, `specs/006-storybook-workbench` on `claude/010-storybook-workbench`) has merged and been
merged into this branch. This plan writes stories, baselines and axe against #10's final design; phase 1's first task
rechecks the plan against #10 as merged (FR-053, research R-12).

## Summary

Nine elements in `@ocelle/elements`, written to mission 005's conventions: `ocelle-listbox` + `ocelle-option`,
`ocelle-tabs` + `ocelle-tab` + `ocelle-tab-panel`, `ocelle-segmented-choice` + `ocelle-segment`, `ocelle-copy-field`
and `ocelle-link`. Parents and children stay in the page's tree scope: roles through `ElementInternals`, selection
states as ARIA attributes the parent writes on child hosts (the paint keys on them), roving tabindex on the child
hosts, and the tab-to-panel association by generated light-DOM ids (R-01 to R-03). One internal keyboard mechanism
(`src/roving.ts`) and one internal selection model (`src/selection.ts`) hold the key maps and the value rules of
FR-009 to FR-011a as pure, node-tested functions (R-04, R-05). The joined segmented choice observes its own size and
rounds each row through custom states, raising the engine floor to Chromium 125 / WebKit 17.4 (R-06). The copy field
is request-only with a native Copy button and a polite live region for the host's status (R-07). The link wraps a
native anchor and intercepts plain activations, leaving modified ones to the browser (R-08).

## Technical Context

**Language/Version**: TypeScript (strict), Node and pnpm as pinned by the repository.

**Primary Dependencies**: Lit 3.3.3 (pinned by mission 005). No new runtime or dev dependency is planned. #10 brings
Storybook's gates (axe-core 4.14.0, the pinned capture container).

**Storage**: N/A (elements perform no I/O; constitution I).

**Testing**: Vitest projects `elements` (in-process browser, Stryker-mutated), `elements-node`, `elements-build`,
`elements-browser` (strict-CSP fixture pages), plus a new `elements-browser-file` for User Story 5 scenario 12
(R-09); `storybook-integration` for the story test; #10's `visual` and `axe` gates.

**Target Platform**: Chromium 125+ and WebKit 17.4+ (raised from 120 / 16.4 for `:state()`, R-06); only Chromium is
measured.

**Project Type**: library (web components).

**Performance Goals**: joined rounding settles within one animation frame after a resize (US3-10); no layout loop.

**Constraints**: strict CSP (`default-src 'none'; script-src 'self'; style-src 'self'`), token-only styles, no `style`
attribute, no ID reference across a shadow root, real keyboard input in tests, mutation shards under CI's limit
(#23: 30-line entries).

**Scale/Scope**: 9 elements, 5 events, 5 user stories, ~100 acceptance scenarios.

## Constitution Check

| Principle | How this plan meets it |
|---|---|
| I. `ocelle-` names, no I/O, small interface, manifest | Nine `ocelle-*` tags; events `ocelle-listbox-change`, `ocelle-tabs-change`, `ocelle-segmented-choice-change`, `ocelle-copy-field-request`, `ocelle-link-activate`, all bubbling and composed. No I/O: the copy field emits a request and never touches the clipboard; the link's only navigation is `location.assign` of an allowed `href` after an uncancelled event (FR-047), which is the documented behaviour, not I/O. The `ResizeObserver` of R-06 observes the element itself. Manifest per `contracts/elements.md`; `roving.ts` and `selection.ts` are internal. |
| II. Tokens only, brand rules | All styles from tokens (`color-accent-low`, `color-accent-strong`, `bar-width`, `border-width`, `control-border`, `inset`, `sheet`, `link`, `link-hover`, `focus-*`, `target-min`, `radius-2`, `space-2`, `icon-size`). Ochre fill never alone: every selected state has an `accent-strong` bar. No control boundary on `color-rule`; no control boundary drawn against `color-inset` (R-07). No monospace: the copy field's text uses the sans with tabular figures. No new token. |
| III. Accessible by construction | Children in the parent's tree scope; ids generated only in that scope (R-02, SC-003). Full keyboard models with roving tabindex (R-03, R-04). Host `aria-label` decides naming; forwarded to the link's anchor (R-08). Targets at `target-min` (R-10). Forced-colours `Highlight` edges and system boundaries. Axe on every story through #10. |
| IV. Strict CSP, offline | Adopted stylesheets only; no `style` attribute (joined rounding through custom states, R-06); browser build under the fixture's strict CSP in every browser scenario; the `file:` scenario carries the same policy in a `<meta>` element (R-09). |
| V. Storybook, behaviour tests | Stories per variant and state in light and dark with baselines from #10's pinned container (R-12); every event, payload and key path asserted with real input (R-11). Stories written in the red commit (operator decision I3). |
| VI. Consumer-driven, own code | Needs from #14 and spec-kitty-design #511, #521, #522, #527, #534 (read only as requirements, not available to this session); first consumer #16's Open project dialog. Nothing copied. |
| VII. Semver | Nine elements, five events, parts and attributes: MINOR. The engine-floor raise is documented in the README and the changelog (before 1.0.0 the surface may change; a floor raise is named as a notable change). |
| VIII. Test-first, non-vacuous | Each phase red first with story tests in the red commit; every "does not" outcome paired with a named plant (`contracts/elements.md` § Pairings); pure logic in node-tested modules so mutants die fast; #23's rules for timeouts. Phase 1 has one exemption-candidate task (the #10 recheck, documentation only). |
| Workflow gates | No new gate. The `manifest`, `csp`, `style-lint`, `contrast`, `prefix`, `mutation` gates and #10's `storybook-build`, `visual` and `axe` gates must pass. |

## Decisions the operator should see at the plan gate

1. **Engine floor raised to Chromium 125 / WebKit 17.4** (R-06) for `:state()` in the joined segmented choice. The
   alternative is attributes the element writes on segment hosts (`data-ocelle-row-*`), which keeps the floor but
   leaks internal state into the host's DOM.
2. **Generated ids for tabs** (R-02): `ocelle-tabs` writes `id`, `aria-controls` and `aria-labelledby` on its
   light-DOM children; a host's own `id` on a child is kept. ARIA element reflection would avoid ids but needs
   Chromium 135 and is not in WebKit's floor.
3. **State attributes on child hosts** (R-01): `aria-selected` / `aria-pressed` / `aria-disabled` are written by the
   parent; a host's own values on children are overwritten (documented).
4. **Minimum target 44 px** for options, tabs and segments (R-10), not only the segments and the Copy control.
5. **The link intercepts every plain activation** (R-08), including Alt-click, so Chromium's Alt-click download does
   not happen (spec-check note SPEC-2-07).
6. **`file:` scenario** runs in its own Vitest project with `--allow-file-access-from-files` (R-09), behind a spike;
   if it fails, the operator decides.

## Project Structure

### Documentation (this feature)

```text
specs/014-selection-input/
├── spec.md, triage.ref, checklists/requirements.md
├── plan.md              # this file
├── research.md          # R-01 to R-14
├── data-model.md        # child entries, selection transitions, roving input
├── contracts/elements.md  # manifest surface and the pairing plants
├── quickstart.md
├── reviews/spec/        # spec checks 1-3 and fixes
├── reviews/plan/        # squad rounds
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
packages/elements/
├── src/
│   ├── roving.ts                  # internal keyboard mechanism (R-04)
│   ├── selection.ts               # internal selection model (R-05)
│   ├── ocelle-listbox.ts, ocelle-option.ts
│   ├── ocelle-tabs.ts, ocelle-tab.ts, ocelle-tab-panel.ts
│   ├── ocelle-segmented-choice.ts, ocelle-segment.ts
│   ├── ocelle-copy-field.ts, ocelle-link.ts
│   ├── index.ts, browser.ts       # re-export and define the new elements
├── test/
│   ├── node/roving.test.ts, node/selection.test.ts, node/readme.test.ts (extended)
│   ├── scenarios/{listbox,tabs,segmented-choice,copy-field,link}.ts, scenarios/driver.ts (extended)
│   ├── {listbox,tabs,segmented-choice,copy-field,link}.test.ts        # in-process
│   ├── browser/{listbox,tabs,segmented-choice,copy-field,link}.test.ts # strict-CSP fixture
│   ├── browser/file/link-file.test.ts                                  # elements-browser-file (R-09)
│   ├── browser/fixtures/{listbox,tabs,segmented-choice,copy-field,link,link-target}.html
│   └── entry-*.test.ts for each new entry point
├── custom-elements.json, README.md, CHANGELOG.md, package.json (exports)
storybook/stories/{listbox,tabs,segmented-choice,copy-field,link}.stories.ts
storybook/baselines/<story-id>.{light,dark}.png      # #10's layout
storybook/test/integration/elements-stories.test.ts  # extended
vitest.config.ts                                      # elements-browser-file project
```

**Structure Decision**: the existing `packages/elements` layout of mission 005 (one module per element, scenarios
shared by the two harnesses), plus #10's Storybook layout.

## Phases (user stories) for `/speckit-tasks`

Every phase from 2 on: red commit (tests, scenario bodies, fixtures, stories and the story test, test-only files) →
`red.sh` record → green commit(s) (source, manifest, README section, baselines from the pinned container) → mutation
gate on the phase's changes. Story tests are in the red commit (operator decision I3).

1. **Setup**
   - Recheck against #10 as merged (FR-053, R-12): compare gate ids, story id scheme, pointer/focus parameters,
     baseline command, contributor note and contracts; record in `reviews/phase-1/recheck-10.md`; fix plan and tasks
     before phase 2 (documentation; exemption with reason).
   - Driver extensions, tests first: `press`, `click` with button and modifiers, `activeElement` through shadow roots,
     the keydown recorder, the `axTree` extension for `selected`, `pressed`, `disabled`, `controls`, live properties
     (R-11), each with a unit test that fails before it exists.
   - `vitest.config.ts` gains `elements-browser-file` (R-09) with `gates/test/vitest-config.test.ts` first.
2. **US1 Listbox (P1, MVP)**: `roving.ts` and `selection.ts` with node tests over every key, edge and FR-009 to
   FR-011a transition (data-model.md), including SPEC-3-02 and SPEC-3-03 (R-14); `ocelle-listbox`, `ocelle-option`;
   scenarios US1-1 to 19 in both harnesses; listbox stories (FR-050) and the story test; entry points, manifest,
   README section with the engine floor unchanged in this phase; CHANGELOG.
3. **US2 Tabs (P2)**: spike R-02 (generated ids vs element reflection, recorded); `ocelle-tabs`, `ocelle-tab`,
   `ocelle-tab-panel` with manual slot assignment; scenarios US2-1 to 20; tabs stories; manifest; README.
4. **US3 Segmented choice (P3)**: `ocelle-segmented-choice`, `ocelle-segment`; the joined variant with the internal
   `ResizeObserver` and custom states (R-06), the engine-floor raise in the README; scenarios US3-1 to 17 with resize
   measurements; stories (default, joined one row and wrapped, pressed, disabled, focused).
5. **US4 Copy field (P4)**: `ocelle-copy-field` (R-07); scenarios US4-1 to 12 with the clipboard observer and the
   live-region MutationObserver; stories; README with the future `ocelle-button` swap (FR-044).
6. **US5 Link (P5)**: spike R-09; `ocelle-link` (R-08); `link-target.html`; scenarios US5-1 to 13 including the
   navigation observations; stories with the hover pointer state; README.
7. **Polish**: README overview (nine elements, engine floor), CHANGELOG MINOR entry, the composed dialog + listbox
   story if #16 has merged (FR-054), a full gate run per quickstart.md.

## Complexity Tracking

None. No constitution exception is needed: baselines and axe are not deferred (implementation waits for #10), and the
engine-floor raise follows the README's documented rule.
