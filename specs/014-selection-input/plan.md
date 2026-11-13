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
and `ocelle-link`; a parent's entry point also defines its children and the copy field's defines `ocelle-icon` (R-16).
Parents and children stay in the page's tree scope: roles through `ElementInternals` (kept where axe-core reads them),
selection states as ARIA attributes the parent writes on child hosts (the paint keys on them), roving tabindex on the
child hosts with disabled children kept focusable at -1, the tablist role on the tabs' shadow `part="tablist"` (not
the host) and the tab-to-panel association by generated light-DOM ids (R-01 to R-03). Every parent takes its child
list from a `MutationObserver` on its host and keeps a focus record, so moves keep focus (R-03, R-05). One internal
keyboard mechanism (`src/roving.ts`, with an origin filter so keys from panel content are left alone) and one internal
selection model (`src/selection.ts`) hold the key maps and the value rules of FR-009 to FR-011a as pure functions
tested in the in-process project Stryker runs (R-04, R-05, R-13). The segmented choice is a toolbar; its joined
variant observes its own and its segments' sizes and rounds each row through custom states, raising the engine floor
to Chromium 125 / WebKit 17.4 (R-06). The listbox emits `ocelle-listbox-activate` for a confirm gesture (R-18). The
copy field is request-only with a native Copy button and a polite live region written outside Lit, and dispatches its
request after the cleared region has reached the accessibility tree (R-07). The link wraps a native anchor, intercepts
plain activations (Enter included on an anchor without `href`), resolves `href` at each activation through a pure
decision function, and leaves modified activations to the browser (R-08). Paints and the drawing techniques per
ground are R-15; the selected bars' `accent-strong` pairs on the main grounds are added to `@ocelle/tokens` (R-17).

## Technical Context

**Language/Version**: TypeScript (strict), Node and pnpm as pinned by the repository.

**Primary Dependencies**: Lit 3.3.3 (pinned by mission 005). No new runtime or dev dependency is planned. #10 brings
Storybook's gates (axe-core 4.14.0, the pinned capture container).

**Storage**: N/A (elements perform no I/O; constitution I).

**Testing**: Vitest projects `elements` (in-process browser, Stryker-mutated; also the pure-module tests of
`roving.ts`, `selection.ts` and `link-target.ts`, R-13), `elements-node` (README, manifest, the element pairs check),
`elements-build`, `elements-browser` (strict-CSP fixture pages), plus a new `elements-browser-file` for User Story 5
scenario 12 (R-09; not mutated); `storybook-integration` for the story test; #10's `visual` and `axe` gates; the
`contrast` gate over `@ocelle/tokens`' extended pair list (R-17).

**Target Platform**: Chromium 125+ and WebKit 17.4+ (raised from 120 / 16.4 for `:state()`, R-06); only Chromium is
measured.

**Project Type**: library (web components).

**Performance Goals**: joined rounding is right in the frame that renders a resize, measured after that frame's
resize observations are delivered (US3-10, R-06); no layout loop.

**Constraints**: strict CSP (`default-src 'none'; script-src 'self'; style-src 'self'`), token-only styles, no `style`
attribute, no ID reference across a shadow root, real keyboard input in tests, mutation shards under CI's limit
(#23: 30-line entries).

**Scale/Scope**: 9 elements, 6 events, 5 user stories, 91 acceptance scenarios.

## Constitution Check

| Principle | How this plan meets it |
|---|---|
| I. `ocelle-` names, no I/O, small interface, manifest | Nine `ocelle-*` tags; events `ocelle-listbox-change`, `ocelle-listbox-activate`, `ocelle-tabs-change`, `ocelle-segmented-choice-change`, `ocelle-copy-field-request`, `ocelle-link-activate`, all bubbling and composed. No I/O: the copy field emits a request and never touches the clipboard; the link's only navigation is `location.assign` of an `href` that `navigationTarget` allows at activation, after an uncancelled event (FR-047, R-08), which is the documented behaviour, not I/O (SPEC-1-22). The `ResizeObserver` of R-06 observes the element and its own segments. Manifest per `contracts/elements.md`, every list stated; `roving.ts`, `selection.ts`, `link-target.ts` and `internals.ts` are internal, and the internals symbol is not surface. |
| II. Tokens only, brand rules | All styles from tokens (`color-accent-low`, `color-accent-strong`, `color-hover-bg`, `color-disabled-ink`, `bar-width`, `border-width`, `control-border`, `inset`, `sheet`, `link`, `link-hover`, `focus-*`, `target-min`, `radius-2`, `space-2`, `icon-size`), per element and ground in R-15. Ochre fill never alone: every selected state has an `accent-strong` bar. #5 rule 1 (extended) held everywhere: a control on `accent-low`, `inset` or `hover-bg` is bordered in `accent-strong`, so the joined pressed (and hovered) segment's lines and the Copy control's divider against the `inset` well are `accent-strong` at `border-width` (operator decision PLAN-CORRECTNESS-1-010 (a)); no `control-border` line bounds `accent-low`, `inset` or `hover-bg`; no control boundary on `color-rule`. No monospace: the copy field's text uses the sans with tabular figures. No new token; `@ocelle/tokens` gains the checked non-text pairs of `color-accent-strong` on the six main grounds (R-17, operator decision PLAN-CORRECTNESS-1-011 (b)). |
| III. Accessible by construction | Children in the parent's tree scope; ids generated only in that scope (R-02, SC-003). Full keyboard models of their ARIA patterns with roving tabindex: listbox, tablist (the role on the shadow `part="tablist"`, so panels are beside it, R-01), toolbar of toggle buttons for the segmented choice (operator decision PLAN-A11Y-SECURITY-1-008 (a)); keys taken only from the parent's own children (R-04); focus kept across moves and on a child that becomes disabled (R-03). Host `aria-label` decides naming; forwarded to the link's anchor with exactly one named node (R-08). Targets at `target-min` (R-10). Non-text contrast of every bar, border and divider checked automatically: `@ocelle/tokens`' pair list (R-17) and the element pairs check over each stylesheet (R-17). Forced-colours `Highlight` bars as pseudo-elements with `forced-color-adjust: none`, system boundaries, outline focus rings never clipped (R-03, R-15). Axe on every story through #10, internals stored where axe reads them (R-01, operator decision PLAN-FRESH-1-001 (a)). The copy field's request reaches the host after the cleared live region is in the tree (R-07, operator decision PLAN-TESTABILITY-1-011 (a)). |
| IV. Strict CSP, offline | Adopted stylesheets only; no `style` attribute (joined rounding through custom states, R-06); browser build under the fixture's strict CSP in every browser scenario; the `file:` scenario carries the same policy in a `<meta>` element (R-09). |
| V. Storybook, behaviour tests | Stories per variant and state in light and dark with baselines from #10's pinned container, an icon story per child (R-12); every event, payload and key path asserted with real input, and every paint claim read from computed styles or pixels, not from baselines alone (R-11, R-15). Stories written in the red commit (operator decision I3). |
| VI. Consumer-driven, own code | Needs from #14 and spec-kitty-design #511, #521, #522, #527, #534 (read only as requirements, not available to this session); first consumer #16's Open project dialog, whose confirm gesture is `ocelle-listbox-activate` (operator decision PLAN-CORRECTNESS-1-018 (b)). Form association has no consumer need and stays out (spec Assumptions). Nothing copied. |
| VII. Semver | Nine elements, six events, parts and attributes: MINOR in `@ocelle/elements`. The `copy-control` part's surface is stated as its box, accessible name and events, so the later `ocelle-button` swap is a PATCH under that stated surface (operator decision PLAN-CORRECTNESS-1-017 (a); README, FR-044). The README's module rule is amended (a parent's entry defines its children, R-16), and the engine-floor raise is documented in the README and the changelog (before 1.0.0 the surface may change; a floor raise is named as a notable change). `@ocelle/tokens`: new checked pairs only, no token change, named in its changelog (R-17). |
| VIII. Test-first, non-vacuous | Each phase red first with story tests in the red commit, after the phase's scaffold (`.claude/skills/speckit-story-implement`); every "does not" outcome paired with a named plant and a falsifiable setup (`contracts/elements.md` § Pairings), plant runs recorded in `reviews/phase-N/plants.md`; the pure modules' tests run in the in-process `elements` project, the one the elements Stryker configuration runs, so their mutants are killed there (R-13); the link's navigation decision is killed in process, not only on the unmutated fixture (R-08, R-11); timing claims measured as the platform orders them (R-06, R-07); #23's rules for timeouts. Phase 1 has one exemption-candidate task (the #10 recheck, documentation only). |
| Workflow gates | No new gate. The `manifest`, `csp`, `style-lint`, `contrast`, `prefix`, `mutation` gates and #10's `storybook-build`, `visual` and `axe` gates must pass. The Vitest configuration gains `elements-browser-file`, excluded from mutation runs, with its configuration test first (R-09). |

## Decisions the operator should see at the plan gate

1. **Engine floor raised to Chromium 125 / WebKit 17.4** (R-06) for `:state()` in the joined segmented choice. The
   alternative is row attributes the element writes on segment hosts (`data-ocelle-row-*`), the same element-owned
   model as R-01's states and R-03's `tabindex`, read by the segment's own CSS with no cross-element call and no floor
   raise. Open before this decision: kitty-mission-ui's WebKitGTK (Linux) and WKWebView (macOS) minimums, which this
   repository has never recorded (PLAN-FRESH-1-012); the earlier "touches no consumer" claim is withdrawn.
2. **Generated ids for tabs** (R-02): `ocelle-tabs` writes `id`, `aria-controls` and `aria-labelledby` on its
   light-DOM children; a host's own `id` on a child is kept. ARIA element reflection would avoid ids but needs
   Chromium 135 and is not in WebKit's floor.
3. **State attributes on child hosts** (R-01): `aria-selected` / `aria-pressed` / `aria-disabled` and `tabindex` are
   written by the parent; a host's own values on children are overwritten (documented).
4. **Minimum target 44 px** for options, tabs and segments (R-10), not only the segments and the Copy control.
5. **The link intercepts every plain activation** (R-08), including Alt-click, so Chromium's Alt-click download does
   not happen (spec-check note SPEC-2-07).
6. **`file:` scenario** runs in its own Vitest project with `--allow-file-access-from-files` (R-09), behind a spike;
   if it fails, the operator decides.
7. **Spikes whose failure goes to the operator**: the tabs host's and the link host's exposure with a host
   `aria-label` (one named node, R-01, R-08; phases 3 and 6), and the copy field's request timing against the
   accessibility tree (R-07; phase 5).

Decided at plan squad round 1 (`reviews/plan/round-1/refute.md`, Decision column; operator notes of 2026-11-13):
disabled children keep `tabindex="-1"` (PLAN-CORRECTNESS-1-004 (a)); `accent-strong` lines on the joined pressed
segment and the copy divider (PLAN-CORRECTNESS-1-010 (a)); bars on main grounds with new token pairs
(PLAN-CORRECTNESS-1-011 (b)); one microtask checkpoint as "one operation" (PLAN-CORRECTNESS-1-014 (a)); a parent's
entry defines its children and the copy field's defines `ocelle-icon`, source staying strict TypeScript
(PLAN-CORRECTNESS-1-015 (a)); `copy-control` guarantees its box, name and events (PLAN-CORRECTNESS-1-017 (a));
`ocelle-listbox-activate` (PLAN-CORRECTNESS-1-018 (b)); the segmented choice as a toolbar (PLAN-A11Y-SECURITY-1-008
(a)); the request after the cleared region is in the tree (PLAN-TESTABILITY-1-011 (a)); internals under a symbol axe
reads (PLAN-FRESH-1-001 (a)).

## Project Structure

### Documentation (this feature)

```text
specs/014-selection-input/
├── spec.md, triage.ref, checklists/requirements.md
├── plan.md              # this file
├── research.md          # R-01 to R-18
├── data-model.md        # child entries, selection transitions, focus record, roving input, link state
├── contracts/elements.md  # manifest surface, entry points and the pairing plants
├── quickstart.md
├── reviews/spec/        # spec checks 1-3 and fixes
├── reviews/plan/        # squad rounds
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
packages/elements/
├── src/
│   ├── roving.ts                  # internal keyboard mechanism and origin guard (R-04)
│   ├── selection.ts               # internal selection model, batching, focus record (R-05, R-03)
│   ├── link-target.ts             # internal navigation decision (R-08)
│   ├── internals.ts               # internal symbol for internals and the row-state method (R-01, R-06)
│   ├── ocelle-listbox.ts, ocelle-option.ts
│   ├── ocelle-tabs.ts, ocelle-tab.ts, ocelle-tab-panel.ts
│   ├── ocelle-segmented-choice.ts, ocelle-segment.ts
│   ├── ocelle-copy-field.ts, ocelle-link.ts
│   ├── index.ts, browser.ts       # re-export and define the new elements
├── test/
│   ├── roving.test.ts, selection.test.ts, link-target.test.ts           # in-process `elements`, no DOM (R-13)
│   ├── node/readme.test.ts (extended), node/selection-pairs-check.ts, node/selection-pairs.test.ts (R-17)
│   ├── scenarios/{listbox,tabs,segmented-choice,copy-field,link}.ts, scenarios/driver.ts (extended, R-11)
│   ├── {listbox,tabs,segmented-choice,copy-field,link}.test.ts        # in-process
│   ├── commands.ts (axStates), in-process.ts, browser/driver.ts (extended)
│   ├── browser/{listbox,tabs,segmented-choice,copy-field,link}.test.ts # strict-CSP fixture
│   ├── browser/fixtures/{listbox,tabs,segmented-choice,copy-field,link,link-target}.html
│   ├── browser-file/link-file.test.ts, browser-file/fixtures/         # elements-browser-file (R-09)
│   ├── build/build.test.ts (extended: the pairs check on the built modules)
│   └── entry-<tag>.test.ts for each new entry point (R-16)
├── custom-elements.json, README.md, CHANGELOG.md, package.json (exports, contract § Entry points)
packages/tokens/src/source.ts, packages/tokens/contrast/pairs.json, packages/tokens/CHANGELOG.md  # R-17
gates/test/contrast-pairs.test.ts                     # pinned counts (R-17)
storybook/stories/{listbox,tabs,segmented-choice,copy-field,link}.stories.ts
storybook/baselines/<story-id>.{light,dark}.png      # #10's layout
storybook/test/integration/elements-stories.test.ts  # extended (axe aria-allowed-attr check, R-01)
vitest.config.ts, vitest.mutation.config.ts           # elements-browser-file project and exclusions (R-09)
gates/test/vitest-config.test.ts                      # owners and excluded list, red first
```

**Structure Decision**: the existing `packages/elements` layout of mission 005 (one module per element, scenarios
shared by the two harnesses), plus #10's Storybook layout. Source stays strict TypeScript under `src/`.

## Phases (user stories) for `/speckit-tasks`

Every phase from 2 on: scaffold (new modules with signatures and no behaviour, recorded by the story procedure's
`scaffold.sh`) → red commit (tests, scenario bodies, fixtures, stories and the story test, test-only files) →
`red.sh` record → green commit(s) (source, manifest, README section, baselines from the pinned container) → mutation
gate on the phase's changes → plant runs recorded in `reviews/phase-N/plants.md`. Story tests are in the red commit
(operator decision I3).

1. **Setup**
   - Recheck against #10 as merged (FR-053, R-12): compare gate ids, story id scheme, pointer/focus parameters,
     baseline command, contributor note and contracts; record in `reviews/phase-1/recheck-10.md`; fix plan and tasks
     before phase 2 (documentation; exemption with reason).
   - Driver extensions, tests first (R-11): `press`, `click` with button, modifiers and count, child addressing by
     `{ parent, kind, index }`, `activeElement` through shadow roots returning that identity, `mutate` (several DOM
     steps in one task), the non-settling `resize` and `afterResizeDelivery`, `computedPart`, page scroll offset and
     viewport size, the keydown recorder, the clipboard observer installed at every mount and fixture page, and the
     separate `axStates` command (005's `axTree` unchanged), each with a unit test that fails before it exists.
   - `vitest.config.ts` gains `elements-browser-file` and excludes `test/browser-file/**` from `elements`;
     `vitest.mutation.config.ts` excludes `elements-browser-file`; `gates/test/vitest-config.test.ts` first (R-09).
2. **US1 Listbox (P1, MVP)**: `roving.ts`, `selection.ts` and `internals.ts` with in-process tests over every key,
   edge, origin case and FR-009 to FR-011a transition, batching and focus-record case (data-model.md), including
   SPEC-3-02 and SPEC-3-03 (R-14); `ocelle-listbox`, `ocelle-option` with the activate event (R-18); scenarios US1-1
   to 23 in both harnesses; `@ocelle/tokens`' new `accent-strong` pairs and the element pairs check (R-17); listbox
   stories (FR-050, the icon story included) and the story test with the axe `aria-allowed-attr` check (R-01); entry
   points (R-16), manifest, README section (activate event, module rule amended) with the engine floor unchanged in
   this phase; CHANGELOGs of both packages.
3. **US2 Tabs (P2)**: spike R-02 (generated ids vs element reflection) and the host-exposure spike (R-01), recorded;
   `ocelle-tabs` (tablist on the shadow part, manual assignment per batch, panel focusability observer),
   `ocelle-tab`, `ocelle-tab-panel`; scenarios US2-1 to 23; tabs stories; manifest; README.
4. **US3 Segmented choice (P3)**: `ocelle-segmented-choice` (toolbar), `ocelle-segment`; the joined variant with the
   internal `ResizeObserver` on the group and its segments, the shared-line technique and custom states (R-06), the
   engine-floor raise in the README; scenarios US3-1 to 19 with resize measurements after the observations'
   delivery; stories (default, joined one row and wrapped, pressed, disabled, focused, icon).
5. **US4 Copy field (P4)**: spike R-07 (request timing against the tree); `ocelle-copy-field` (R-07)
   with the imperative live-region text and `ocelle-icon` defined by its entry; scenarios US4-1 to 12 with the
   clipboard observer, the live-region MutationObserver and the tree read in the listener; stories; README with the
   `copy-control` surface and the future `ocelle-button` swap (FR-044).
6. **US5 Link (P5)**: spikes R-09 and the host-exposure spike (R-08); `link-target.ts` with its in-process tests;
   `ocelle-link` (R-08); `link-target.html`; scenarios US5-1 to 14 including the navigation observations (fragments
   in process, cross-document on the fixture, US5-11's base inserted after load, `context.on("page")` for US5-13);
   stories with the hover pointer state; README with the `detail.href` warning.
7. **Polish**: README overview (nine elements, engine floor, module rule), CHANGELOG MINOR entry, the composed dialog
   + listbox story if #16 has merged (FR-054), a full gate run per quickstart.md.

## Complexity Tracking

None. No constitution exception is needed: baselines and axe are not deferred (implementation waits for #10), the
engine-floor raise follows the README's documented rule, and #5 rule 1 is met rather than excepted (operator decision
PLAN-CORRECTNESS-1-010 (a)).
