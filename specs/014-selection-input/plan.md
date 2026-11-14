# Implementation Plan: Selection and Input Elements

**Branch**: `014-selection-input` (work on `claude/014-selection-input`) | **Date**: 2026-11-13 | **Spec**:
[spec.md](spec.md)

**Input**: Feature specification from `specs/014-selection-input/spec.md` (approved at the spec gate after a final fix
of check 3, 2026-11-13).

**Implementation waits for #10.** By the operator's decision at spec check 1 (Q3 (c)), no phase is implemented until
#10 (Storybook workbench, `specs/006-storybook-workbench` on `claude/010-storybook-workbench`) has merged and been
merged into this branch. #10 merged on `main` as `3828d2f` on 2026-11-13. This plan writes stories, baselines and axe
against #10's final design.

**Visual baselines under docker from phase 2** (operator decision 2026-11-14 during phase 2,
`reviews/phase-2/operator-decisions.md`, which replaces the baseline gap decision in
`reviews/phase-1/operator-decisions.md`; FR-053, SC-007, research R-12). From phase 2 on, each phase produces the
light and dark baselines of its new stories, and any shared baseline (the token stories included) that changes, in
#10's pinned container under docker (`pnpm run visual:update`), and checks them with `pnpm run gate:visual`. Phase 2,
whose T027 recorded the earlier gap, produces its baselines in T027a. Each phase records that no podman cross-engine
check was possible in the session; CI's `visual` gate runs both engines and confirms the baselines when the feature
lands. Baseline PNGs that conflict after a merge are regenerated with `pnpm run visual:update`, never hand-picked.

**One axe exception: the scrolling listbox story** (operator decision 2026-11-14, `reviews/phase-2/operator-decisions.md`,
option (a); FR-051). axe-core 4.14.0 reports a serious `color-contrast-incomplete` on each option of
`elements-ocelle-listbox--scrolling-listbox` that the list's `overflow: auto` container clips (`epsilon` to `kappa`),
in both themes: it treats only `overflow: hidden` as hiding content, so clipped text is `elmPartiallyObscured`. These
nodes get entries in `storybook/a11y-exceptions.json` in the form of #10's Prose document entries, recorded in
Complexity Tracking below (T027b). No other story of this feature adds an exception.

**How #10 reaches this branch** (analysis I1, operator decision Q1 (a); who and when: second analysis I1, operator
decision Q1 (b)). Phase 1's first task, T001, merges `origin/main` (`3828d2f` or later) into
`claude/014-selection-input` as one recorded merge commit (`git merge --no-ff --signoff origin/main`, not a rebase and
not a squash). It then rechecks the plan against #10 as merged (FR-053, research R-12). This is the only merge of
`main` during the run. `/ocelle-land` merges `main` again at landing, as it does for every feature.

**Who merges, and when.** The implementer (`implementer-ivan`, delegated "implement phase 1") makes the T001 merge,
and makes it before `/speckit-story-implement`'s step 2 (`base.sh 1`). This is an exception to that procedure's order
for phase 1 only (operator decision Q1 (b) of the second analysis). `base.sh` writes `base.sha` only when it is absent,
so the order decides phase 1's base: merge first, then `base.sh 1`, so `reviews/phase-1/base.sha` is the merge commit.
The orchestrator's "implement phase 1" delegation carries this note (tasks.md, Phase 1 "Delegation note"):

> Phase 1 only, exception to `/speckit-story-implement` (operator decision Q1 (b), second analysis): do T001 (1), the
> recorded merge of `origin/main` (`git merge --no-ff --signoff origin/main`, `3828d2f` or later), before the
> procedure's step 2. Run `base.sh 1` only after the merge commit exists, so `reviews/phase-1/base.sha` is the merge
> commit. If `reviews/phase-1/base.sha` already exists and is not the merge commit, stop and ask. Then continue with
> the procedure from step 2.

If the merge were made after `base.sh 1`, the merge would lie inside phase 1's range: its fold would fail
(`fold-history.sh` refuses a range with a merge) and its review diff and mutation base would cover all of #10.

**The phase folds and the T001 merge.** `/ocelle-run`'s fold step (step 4.3) needs a history with no merge commits:
`fold-history.sh` refuses a range `FB..HEAD` that contains one. So every fold base for this feature starts after the
T001 merge:
- The merge is made before `base.sh 1` runs. Phase 1's `reviews/phase-1/base.sha` is therefore the merge commit
  itself. Phase 1's base, scaffold, red and green commits all come after the merge, and so does the recheck.
- Every later fold base is a descendant of the merge commit: a later phase's `base.sha`, or the latest fold's remap
  commit. Every fold range `FB..HEAD` therefore holds no merge commit.
- No fold rewrites or drops the merge commit. Every fold keeps it, with `origin/main`'s history under it, as the
  common base of the folded history.
- The "no merge commits" checks of the orchestrator's skills are read for this feature as "none in the fold range
  `FB..HEAD`", which is what `fold-history.sh` checks (second analysis I2, operator decision Q2 (b) in
  `reviews/analysis/operator-decisions.md` § "Second analysis"). This covers `/ocelle-run` step 4.3.1 ("no merge
  commits on the branch", checked before every phase fold) and `/ocelle-land` step 8.1 ("no merge commits since the
  PR base", checked before the landing fold). The T001 merge is the operator's decision and lies below every fold
  base, so neither check stops on it. `/ocelle-run` step 4.3.1's "never merge `main` during a run" does not apply to
  the T001 merge, which the operator decided. A second merge of `main` during the run would break this, and none is
  planned. Amending both skills to state the range reading for every feature is a separate change outside this
  feature (a follow-up for the operator), not part of these tasks.

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
to Chromium 125 / WebKit 17.4 (R-06), if the operator confirms plan decision 1. Otherwise it rounds each row through
element-owned row attributes and keeps the floor (R-06 Status). The listbox emits `ocelle-listbox-activate` for a
confirm gesture (R-18). The copy field is request-only with a native Copy button and a polite live region written
outside Lit, and dispatches its request after the cleared region has reached the accessibility tree (R-07). The link
wraps a native anchor, intercepts plain activations (Enter included on an anchor without `href`), resolves `href` at
each activation through a pure decision function, and leaves modified activations to the browser (R-08). Paints and the
drawing techniques per ground are R-15; the selected bars' `accent-strong` pairs on the main grounds are added to
`@ocelle/tokens` (R-17).

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

**Target Platform** (conditional on plan decision 1, still open; operator decision Q2 (c)): Chromium 125+ and WebKit
17.4+ (raised from 120 / 16.4 for `:state()`, R-06) if the operator confirms the floor after kitty-mission-ui's
WebKitGTK and WKWebView minimums are known; otherwise Chromium 120+ and WebKit 16.4+, unchanged, with the row-attribute
alternative (R-06 Status). Only Chromium is measured.

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
| III. Accessible by construction | Children in the parent's tree scope; ids generated only in that scope (R-02, SC-003). Full keyboard models of their ARIA patterns with roving tabindex: listbox, tablist (the role on the shadow `part="tablist"`, so panels are beside it, R-01), toolbar of toggle buttons for the segmented choice (operator decision PLAN-A11Y-SECURITY-1-008 (a)); keys taken only from the parent's own children (R-04); focus kept across moves and on a child that becomes disabled, through a focus record that counts a blur only when the removal or move caused it (`relatedTarget` null and the child in the records its `focusout` microtask takes), so neither a later host move nor a host re-render on blur steals focus back and the user can always Tab or click out (WCAG 2.1.2; R-03); the focus ring of options, tabs and segments drawn on a raised `::after` above every neighbour while the focused host stays unraised, so no side is cut and no neighbour's `accent-strong` line is covered (R-06, R-15). Host `aria-label` decides naming on the listbox and the segmented choice; `ocelle-tabs` is named from `label` only, a host `aria-label` not forwarded (FR-006's tabs exception, operator decision during phase 3, R-01; exception to this principle in Complexity Tracking); host `aria-label` forwarded to the link's anchor with exactly one named node, and the README requires it to contain the visible text (WCAG 2.5.3, R-08). Targets at `target-min` (R-10). Non-text contrast of every bar, border and divider checked automatically: `@ocelle/tokens`' pair list (R-17) and the element pairs check over each stylesheet (R-17). Forced-colours `Highlight` bars as pseudo-elements with `forced-color-adjust: none`, system boundaries, `Highlight` focus rings (outlines, and the raised ring pseudo-elements with `forced-color-adjust: none`) never clipped (R-03, R-06, R-15). Axe on every story through #10, internals stored where axe reads them (R-01, operator decision PLAN-FRESH-1-001 (a)); one exception, node by node, for the scrolling listbox story's clipped options (FR-051, operator decision 2026-11-14 option (a); Complexity Tracking); `aria-labelledby` only on the assigned tab panel, so axe 4.14.0 reports no serious `incomplete` on the tabs (R-02). The copy field's request reaches the host after the cleared live region is in the tree (R-07, operator decision PLAN-TESTABILITY-1-011 (a)); that it arrives outside the click's task is stated in the README for hosts that copy from the page (operator decision PLAN-FRESH-2-004 (a)). |
| IV. Strict CSP, offline | Adopted stylesheets only; no `style` attribute (joined rounding through custom states, or row attributes if plan decision 1 is not confirmed, R-06); browser build under the fixture's strict CSP in every browser scenario; the `file:` scenario carries the same policy in a `<meta>` element (R-09). |
| V. Storybook, behaviour tests | Stories per variant and state in light and dark with baselines from #10's pinned container, an icon story per child (R-12); from phase 2 on the baselines are produced under docker in the pinned container and checked by the `visual` gate in each phase, with CI confirming them at landing (operator decision 2026-11-14, `reviews/phase-2/operator-decisions.md`). The states with their own paint have their own stories too: hovered option, tab and segment (default and joined), the focused Copy control and the focused tab panel (FR-050; analysis C1, operator decision Q3 (a)); every event, payload and key path asserted with real input, and every paint claim read from computed styles or pixels, not from baselines alone (R-11, R-15). Stories written in the red commit (operator decision I3). |
| VI. Consumer-driven, own code | Needs from #14 and spec-kitty-design #511, #521, #522, #527, #534 (read only as requirements, not available to this session); first consumer #16's Open project dialog, whose confirm gesture is `ocelle-listbox-activate` (operator decision PLAN-CORRECTNESS-1-018 (b)). Form association has no consumer need and stays out (spec Assumptions). Nothing copied. |
| VII. Semver | Nine elements, six events, parts and attributes: MINOR in `@ocelle/elements`. The `copy-control` part's surface is stated as its box, accessible name and events, so the later `ocelle-button` swap is a PATCH under that stated surface (operator decision PLAN-CORRECTNESS-1-017 (a); README, FR-044). The README's module rule is amended (a parent's entry defines its children, R-16). If plan decision 1 is confirmed, the engine-floor raise is documented in the README and the changelog (before 1.0.0 the surface may change; a floor raise is named as a notable change); if not, the README states that the segment hosts' `data-ocelle-row-*` attributes are internal, not a styling hook, and may change in a PATCH (contracts/elements.md § `ocelle-segmented-choice`; second analysis U2). `@ocelle/tokens`: new checked pairs only, no token change, named in its changelog (R-17). |
| VIII. Test-first, non-vacuous | Each phase red first with story tests in the red commit, after the phase's scaffold (`.claude/skills/speckit-story-implement`); every "does not" outcome paired with a named plant and a falsifiable setup (`contracts/elements.md` § Pairings), plant runs recorded in `reviews/phase-N/plants.md`; the pure modules' tests run in the in-process `elements` project, the one the elements Stryker configuration runs, so their mutants are killed there (R-13); the link's navigation decision is killed in process, not only on the unmutated fixture (R-08, R-11); timing claims measured as the platform orders them (R-06, R-07); #23's rules for timeouts. Phase 1 has one exemption-candidate task (the #10 recheck, documentation only). |
| Workflow gates | No new gate. The constitution's merge gates as the repository defines them must pass in every phase: `typecheck`, `lint`, `test-lint`, `style-lint`, `brand-rules`, `unit-tests`, `signoff`, `pins`, `config-copies`, `manifest`, `csp`, `contrast`, `prefix`, `plants`, `mutation`, and #10's `storybook-build`, `visual` and `axe` (tasks T028; analysis G4). The `visual` gate runs under docker in these sessions; no podman cross-engine check is possible here, which each phase records, and CI's run of both engines confirms the baselines at landing (operator decision 2026-11-14, `reviews/phase-2/operator-decisions.md`). The Vitest configuration gains `elements-browser-file`, excluded from mutation runs, with its configuration test first (R-09). |

## Decisions the operator should see at the plan gate

1. **Engine floor raised to Chromium 125 / WebKit 17.4** (R-06) for `:state()` in the joined segmented choice. The
   alternative is row attributes the element writes on segment hosts (`data-ocelle-row-*`), the same element-owned
   model as R-01's states and R-03's `tabindex`, read by the segment's own CSS with no cross-element call and no floor
   raise. Open before this decision: kitty-mission-ui's WebKitGTK (Linux) and WKWebView (macOS) minimums, which this
   repository has never recorded (PLAN-FRESH-1-012); the earlier "touches no consumer" claim is withdrawn. **Still
   open** (analysis U1, operator decision Q2 (c)). The operator asks kitty-mission-ui first. Phase 4 stops for this
   decision before it starts, before T060 (stop task T059a; second analysis U1, operator decision Q3 (b)). "Yes" to
   the floor: T064, T066 and T067 as written. "No": T062a, T064a, T066a and T067a replace the
   custom-state parts, the floor stays at Chromium 120 / WebKit 16.4, and phase 4 still has its tasks. The same
   request asks kitty-mission-ui and the console owners whether a clipboard write from the deferred copy request
   still counts as user-activated in those engines (R-07, PLAN-FRESH-2-004 (a)).
2. **Generated ids for tabs** (R-02): `ocelle-tabs` writes `id`, `aria-controls` (every paired tab) and
   `aria-labelledby` (the assigned panel only, for axe 4.14.0, PLAN-FRESH-2-002) on its light-DOM children; a host's
   own `id` on a child is kept. ARIA element reflection would avoid ids but needs
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
   accessibility tree (R-07; phase 5). **Tabs: decided** (T040, `reviews/phase-3/spike.md`; operator decision during
   phase 3, `reviews/phase-3/operator-decisions.md`): no measured form that forwards a host `aria-label` and leaves it
   on the host gives one named node, so `ocelle-tabs` is named from `label` only. A host `aria-label` is not
   forwarded or observed, the element writes no host attribute, and the README tells hosts to use `label` (FR-006's
   tabs exception, US2-24, R-01). The link host's spike (phase 6) is unchanged.

Decided at plan squad round 1 (`reviews/plan/round-1/refute.md`, Decision column; operator notes of 2026-11-13):
disabled children keep `tabindex="-1"` (PLAN-CORRECTNESS-1-004 (a)); `accent-strong` lines on the joined pressed
segment and the copy divider (PLAN-CORRECTNESS-1-010 (a)); bars on main grounds with new token pairs
(PLAN-CORRECTNESS-1-011 (b)); one microtask checkpoint as "one operation" (PLAN-CORRECTNESS-1-014 (a)); a parent's
entry defines its children and the copy field's defines `ocelle-icon`, source staying strict TypeScript
(PLAN-CORRECTNESS-1-015 (a)); `copy-control` guarantees its box, name and events (PLAN-CORRECTNESS-1-017 (a));
`ocelle-listbox-activate` (PLAN-CORRECTNESS-1-018 (b)); the segmented choice as a toolbar (PLAN-A11Y-SECURITY-1-008
(a)); the request after the cleared region is in the tree (PLAN-TESTABILITY-1-011 (a)); internals under a symbol axe
reads (PLAN-FRESH-1-001 (a)).

Decided at plan squad round 2 (`reviews/plan/round-2/refute.md`): the copy request stays deferred past the next
frame; the phase-5 spike records a page clipboard write from it in Chromium (no permission granted, behind a
reject control and a resolve control, plan squad round 3, PLAN-FRESH-3-004), the WebKit question goes with decision 1,
and the README tells page-copying hosts the request is outside the click's task (PLAN-FRESH-2-004 (a)).

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
│   ├── internals.ts               # internal symbol for internals (R-01); the row-state method only if decision 1 is confirmed (R-06)
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
storybook/test/integration/elements-stories.test.ts  # extended (axe: aria-allowed-attr R-01; full rule set on tabs R-02; link label R-08)
vitest.config.ts, vitest.mutation.config.ts           # elements-browser-file project and exclusions (R-09)
gates/test/vitest-config.test.ts                      # owners and excluded list, red first
```

**Structure Decision**: the existing `packages/elements` layout of mission 005 (one module per element, scenarios
shared by the two harnesses), plus #10's Storybook layout. Source stays strict TypeScript under `src/`.

## Phases (user stories) for `/speckit-tasks`

Every phase from 2 on: scaffold (new modules with signatures and no behaviour, recorded by the story procedure's
`scaffold.sh`) → red commit (tests, scenario bodies, fixtures, stories and the story test, test-only files) →
`red.sh` record → green commit(s) (source, manifest, README section, baselines from the pinned container under
docker, operator decision 2026-11-14 in `reviews/phase-2/operator-decisions.md`) → mutation gate on the phase's changes → plant runs recorded in `reviews/phase-N/plants.md`. Story tests are in the red commit
(operator decision I3). Each phase's scenarios also cover, by name, the spec's Edge Cases for its elements: a child
outside its parent, duplicate values, the empty listbox, long labels at 320 px, host `hidden`, two copies of the
package, the name following a text change, a disabled option, tab or segment under the pointer showing no hover
paint (second analysis G1), and for the copy field a `status` set without a request and the
unreflected `status` attribute. Each "does not" outcome among them is paired in `contracts/elements.md` § Pairings
(analysis G1).

1. **Setup**
   - The implementer merges `origin/main` into the branch as a recorded merge commit, before `base.sh 1`, as an
     exception to `/speckit-story-implement`'s step 2 for phase 1 only, stated in T001 and in the phase 1 delegation
     (see "Who merges, and when" and "The phase folds and the T001 merge" above; operator decision Q1 (b) of the
     second analysis).
   - Recheck against #10 as merged (FR-053, R-12): compare gate ids, story id scheme, pointer/focus parameters,
     baseline command, contributor note and contracts; record in `reviews/phase-1/recheck-10.md`; fix plan and tasks
     before phase 2 (documentation; exemption with reason).
   - Driver extensions, tests first (R-11): `press`, `click` with button, modifiers and count, child addressing by
     `{ parent, kind, index }`, `activeElement` through shadow roots returning that identity, `mutate` (several DOM
     steps in one task), the non-settling `resize` and `afterResizeDelivery`, `computedPart`, page scroll offset and
     viewport size, the keydown recorder, the clipboard observer installed at every mount and fixture page, the
     separate `axStates` command (005's `axTree` unchanged), `activationRecord` and the `axUpdates` recorder of
     `Accessibility.nodesUpdated` (R-07), each with a unit test that fails before it exists. The driver lives under
     `packages/elements/test/`, which `story-config.yml` counts as a test path, so `tdd-check.sh` runs T002 and T003
     against the new driver too. `red.sh 1` is the red proof for those two files. One named plant per driver command
     and recorder is run and recorded in `reviews/phase-1/plants.md`, and phase 1's review states this limitation
     (analysis U2).
   - `vitest.config.ts` gains `elements-browser-file` and excludes `test/browser-file/**` from `elements`;
     `vitest.mutation.config.ts` excludes `elements-browser-file`; `gates/test/vitest-config.test.ts` first (R-09).
2. **US1 Listbox (P1, MVP)**: `roving.ts`, `selection.ts` and `internals.ts` with in-process tests over every key, edge,
   origin case and FR-009 to FR-011a transition, batching and focus-record case (data-model.md), including SPEC-3-02 and
   SPEC-3-03 (R-14) and the `blurred` record (set only on a `relatedTarget`-null `focusout`, kept only when the records
   its `focusout` microtask takes list the child) with its "a move does not steal focus back" and "Tab out while the
   host re-renders on blur" pairings (R-03); a spike recording the Chromium order of listener calls and microtasks for a
   removal-induced blur and for a user Tab and click followed by a host move or removal in a microtask and in a
   `requestAnimationFrame` (`reviews/phase-2/spike.md`); the option's ring on a raised `::after` with the four-sided
   read beside a hovered next and previous option inside the US1-16 clip (R-06, R-15); `ocelle-listbox`, `ocelle-option`
   with the activate event (R-18); scenarios US1-1 to 23 in both harnesses; `@ocelle/tokens`' new `accent-strong` pairs
   and the element pairs check (R-17); listbox stories (FR-050, the hovered option and the icon story included) and
   the story test with the axe `aria-allowed-attr` check (R-01); entry points (R-16), manifest, README section (activate
   event, module rule amended) with the engine floor unchanged in this phase; CHANGELOGs of both packages.
3. **US2 Tabs (P2)**: spike R-02 (generated ids vs element reflection) and the host-exposure spike (R-01), recorded
   (decided: named from `label` only, plan decision 7);
   `ocelle-tabs` (tablist on the shadow part named from `label` only, manual assignment per batch, panel focusability
   observer), `ocelle-tab`,
   `ocelle-tab-panel` (`aria-labelledby` on the assigned panel only, R-02; the focused tab's ring on a raised `::after`,
   R-06); scenarios US2-1 to 24 with the focused-tab ring read (R-15) and US2-24's unforwarded host `aria-label`; tabs stories (the hovered tab and the focused
   tab panel with no focusable content included, FR-050) and the story test running #10's full rule set on them (no
   violation, no serious or critical `incomplete`; plant: `aria-labelledby` on every panel);
   the axe defect recorded in `reviews/phase-3/spike.md` for an upstream report; manifest; README (tabs are named
   with `label`; a host `aria-label` does not name the tablist, checked by the documentation test).
4. **US3 Segmented choice (P3)**: the phase stops before it starts (before T060) until plan decision 1 is recorded
   (T059a; operator decision Q3 (b) of the second analysis). `ocelle-segmented-choice` (toolbar), `ocelle-segment`;
   the joined variant with the internal `ResizeObserver` on the group and its segments and the shared-line technique;
   if decision 1 is confirmed, custom states (R-06) and the engine-floor raise in the README; if not, element-owned
   row attributes documented as internal (not a styling hook, may change in a PATCH), the floor unchanged, tasks
   T062a, T064a, T066a and T067a (R-06 Status); the
   focused segment's ring on a raised `::after`, the host not raised by focus
   (R-06); scenarios US3-1 to 19 with resize measurements after the observations' delivery, the four-sided ring read
   beside the pressed and a hovered segment, and the `accent-strong` shared-line read with a focused neighbour on
   either side of the pressed and of a hovered segment (R-15); stories (default, joined one row and wrapped, pressed,
   disabled, focused, hovered in the default and in the joined variant, icon).
5. **US4 Copy field (P4)**: spike R-07 (request timing against the tree, observed through `Accessibility.nodesUpdated`;
   a spike-page host listener writing the clipboard from the deferred request in Chromium with no clipboard permission
   granted, after two controls in the same page hold (a write with no prior click rejects, a write synchronously in the
   click handler resolves), `navigator.userActivation.isActive` at dispatch and the result recorded, or, if the controls
   cannot hold, the question recorded as unanswerable here and sent open with decision 1; PLAN-FRESH-2-004 (a),
   PLAN-FRESH-3-004); `ocelle-copy-field` (R-07) with the imperative live-region text and `ocelle-icon` defined by its
   entry; scenarios US4-1 to 12 with the clipboard observer, the live-region MutationObserver, and for US4-6 a
   synchronous listener with the frame-order record and the tree-update history (no tree read from the listener);
   stories (the focused Copy control included, FR-050); README with the `copy-control` surface, the future
   `ocelle-button` swap (FR-044) and the request's timing outside the click's task with the user-activation note for
   page-copying hosts (FR-035).
6. **US5 Link (P5)**: spikes R-09 and the host-exposure spike (R-08); `link-target.ts` with its in-process tests;
   `ocelle-link` (R-08); `link-target.html`; scenarios US5-1 to 14 including the navigation observations (fragments
   in process, cross-document on the fixture, US5-11's base inserted after load, `context.on("page")` for US5-13);
   US5-8's fixture and every host-label story with a label containing the visible text; stories with the hover
   pointer state and the story test asserting no `label-content-name-mismatch` (plant: a label without the visible
   text); README with the `detail.href` warning, the label-in-name rule (R-08), the resolved-protocol check a host that
   navigates itself applies (FR-047), that hosts needing other schemes handle the event (US5-9), and FR-049's three
   statements (a modified activation keeps the browser's new tab or window; a modified activation without `href` does
   nothing; a host that wants a new window handles the event), each checked by the documentation test (analysis G2).
7. **Polish**: README overview (nine elements, engine floor as decided at the phase 4 stop, T059a, module rule) and one README example
   per SC-009 use (the Open project folder picker, tabbed screens, segmented choices, in-text links, copy fields),
   checked by the documentation test, red first (analysis G3); CHANGELOG MINOR entry, the composed dialog
   + listbox story if #16 has merged (FR-054), a full gate run per quickstart.md.

## Complexity Tracking

Opened by this feature, an exception to constitution III's "ARIA state set on a host (`aria-expanded`,
`aria-current`, an accessible name) reaches the real inner control" (operator decision during phase 3, 2026-11-14,
`reviews/phase-3/operator-decisions.md`, human:jeroennouwsdev; FR-006's tabs exception, R-01).

| Scope | Rationale | Sunset |
|---|---|---|
| `ocelle-tabs` only: a host `aria-label` is not forwarded to `part="tablist"`; the tabs are named from `label` only, and the README says so. The listbox, the segmented choice, the copy field and the link are not affected. | T040 (`reviews/phase-3/spike.md`): Chromium 153 names the role-less tabs host from its `aria-label` in every measured host form, so forwarding always gives two named nodes; the one form with one named node removes the host's attribute, against mission 005's rule that an element never writes its host's attributes. Options (a) and (b) were declined. | the op that forwards a host `aria-label` on `ocelle-tabs` with exactly one named node and no host attribute written (for example once every engine of the floor supports a form that keeps the host's name out of the tree), to be opened by the operator |

No constitution V exception: the phase 1 gap decision that opened one is replaced (operator decision 2026-11-14,
`reviews/phase-2/operator-decisions.md`). Every phase's baselines are produced in the pinned container under docker
and checked by the `visual` gate in the phase (phase 2's in T027a). That no podman cross-engine check is possible in
these sessions is a recorded note of each phase, not an exception: CI's `visual` gate runs both engines before the
pull request merges.

Opened by this feature, axe exceptions under 006 FR-029 to constitution III (operator decision 2026-11-14,
`reviews/phase-2/operator-decisions.md`, option (a), human:jeroennouwsdev; FR-051). In
`elements-ocelle-listbox--scrolling-listbox`, in both themes, axe-core 4.14.0 reports a serious
`color-contrast-incomplete` (`elmPartiallyObscured`) on each of the six options the list's `overflow: auto` container
clips, `epsilon` to `kappa`: it treats only `overflow: hidden` ancestors as hiding content, so it cannot decide their
contrast. The scrolled-in options of the same story, and every other story, have no finding. Each row below is one
entry of `storybook/a11y-exceptions.json` (same story, theme, rule, selector and sunset, each in backticks as the
gate reads them; the entry's `plan` is `specs/014-selection-input/plan.md`), twelve rows in all, six per theme. T027b
adds the rows with the selectors exactly as `gate:axe` prints them, in the same commit as the entries; no other story
or node may add a row.

| Story | Theme | Rule | Selector | Reason | Sunset |
|---|---|---|---|---|---|
| `elements-ocelle-listbox--scrolling-listbox` | `light` | `color-contrast-incomplete` | `ocelle-option[value="epsilon"] >>> .label` | option clipped by the list part's `overflow: auto` scroll box (`elmPartiallyObscured`) | the op that removes the clipped options' color-contrast incomplete results of the scrolling listbox story (an axe-core release that treats text clipped by an overflow: auto scroller as hidden, or a change of the story), to be opened by the operator |
| `elements-ocelle-listbox--scrolling-listbox` | `light` | `color-contrast-incomplete` | `ocelle-option[value="zeta"] >>> .label` | option clipped by the list part's `overflow: auto` scroll box (`elmPartiallyObscured`) | the op that removes the clipped options' color-contrast incomplete results of the scrolling listbox story (an axe-core release that treats text clipped by an overflow: auto scroller as hidden, or a change of the story), to be opened by the operator |
| `elements-ocelle-listbox--scrolling-listbox` | `light` | `color-contrast-incomplete` | `ocelle-option[value="eta"] >>> .label` | option clipped by the list part's `overflow: auto` scroll box (`elmPartiallyObscured`) | the op that removes the clipped options' color-contrast incomplete results of the scrolling listbox story (an axe-core release that treats text clipped by an overflow: auto scroller as hidden, or a change of the story), to be opened by the operator |
| `elements-ocelle-listbox--scrolling-listbox` | `light` | `color-contrast-incomplete` | `ocelle-option[value="theta"] >>> .label` | option clipped by the list part's `overflow: auto` scroll box (`elmPartiallyObscured`) | the op that removes the clipped options' color-contrast incomplete results of the scrolling listbox story (an axe-core release that treats text clipped by an overflow: auto scroller as hidden, or a change of the story), to be opened by the operator |
| `elements-ocelle-listbox--scrolling-listbox` | `light` | `color-contrast-incomplete` | `ocelle-option[value="iota"] >>> .label` | option clipped by the list part's `overflow: auto` scroll box (`elmPartiallyObscured`) | the op that removes the clipped options' color-contrast incomplete results of the scrolling listbox story (an axe-core release that treats text clipped by an overflow: auto scroller as hidden, or a change of the story), to be opened by the operator |
| `elements-ocelle-listbox--scrolling-listbox` | `light` | `color-contrast-incomplete` | `ocelle-option[value="kappa"] >>> .label` | option clipped by the list part's `overflow: auto` scroll box (`elmPartiallyObscured`) | the op that removes the clipped options' color-contrast incomplete results of the scrolling listbox story (an axe-core release that treats text clipped by an overflow: auto scroller as hidden, or a change of the story), to be opened by the operator |
| `elements-ocelle-listbox--scrolling-listbox` | `dark` | `color-contrast-incomplete` | `ocelle-option[value="epsilon"] >>> .label` | option clipped by the list part's `overflow: auto` scroll box (`elmPartiallyObscured`) | the op that removes the clipped options' color-contrast incomplete results of the scrolling listbox story (an axe-core release that treats text clipped by an overflow: auto scroller as hidden, or a change of the story), to be opened by the operator |
| `elements-ocelle-listbox--scrolling-listbox` | `dark` | `color-contrast-incomplete` | `ocelle-option[value="zeta"] >>> .label` | option clipped by the list part's `overflow: auto` scroll box (`elmPartiallyObscured`) | the op that removes the clipped options' color-contrast incomplete results of the scrolling listbox story (an axe-core release that treats text clipped by an overflow: auto scroller as hidden, or a change of the story), to be opened by the operator |
| `elements-ocelle-listbox--scrolling-listbox` | `dark` | `color-contrast-incomplete` | `ocelle-option[value="eta"] >>> .label` | option clipped by the list part's `overflow: auto` scroll box (`elmPartiallyObscured`) | the op that removes the clipped options' color-contrast incomplete results of the scrolling listbox story (an axe-core release that treats text clipped by an overflow: auto scroller as hidden, or a change of the story), to be opened by the operator |
| `elements-ocelle-listbox--scrolling-listbox` | `dark` | `color-contrast-incomplete` | `ocelle-option[value="theta"] >>> .label` | option clipped by the list part's `overflow: auto` scroll box (`elmPartiallyObscured`) | the op that removes the clipped options' color-contrast incomplete results of the scrolling listbox story (an axe-core release that treats text clipped by an overflow: auto scroller as hidden, or a change of the story), to be opened by the operator |
| `elements-ocelle-listbox--scrolling-listbox` | `dark` | `color-contrast-incomplete` | `ocelle-option[value="iota"] >>> .label` | option clipped by the list part's `overflow: auto` scroll box (`elmPartiallyObscured`) | the op that removes the clipped options' color-contrast incomplete results of the scrolling listbox story (an axe-core release that treats text clipped by an overflow: auto scroller as hidden, or a change of the story), to be opened by the operator |
| `elements-ocelle-listbox--scrolling-listbox` | `dark` | `color-contrast-incomplete` | `ocelle-option[value="kappa"] >>> .label` | option clipped by the list part's `overflow: auto` scroll box (`elmPartiallyObscured`) | the op that removes the clipped options' color-contrast incomplete results of the scrolling listbox story (an axe-core release that treats text clipped by an overflow: auto scroller as hidden, or a change of the story), to be opened by the operator |

Sunset of every row: `the op that removes the clipped options' color-contrast incomplete results of the scrolling
listbox story (an axe-core release that treats text clipped by an overflow: auto scroller as hidden, or a change of
the story), to be opened by the operator`.

Otherwise none. The `axe` gate is not deferred (#10 is merged into the branch by T001
before phase 1's base, operator decisions Q1 (a) and, second analysis, Q1 (b)), every state with its own paint has a story (operator decision Q3
(a)), the engine-floor raise, if confirmed, follows the README's documented rule, and #5 rule 1 is met rather than
excepted (operator decision PLAN-CORRECTNESS-1-010 (a)).
