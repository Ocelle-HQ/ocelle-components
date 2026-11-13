# Implementation Plan: Action Controls, `ocelle-button` and `ocelle-action-row`

**Branch**: `012-button-action-row` (work on `claude/007-actions-status`) | **Date**: 2026-11-13 | **Spec**:
[spec.md](spec.md)

**Input**: Feature specification from `specs/012-button-action-row/spec.md` (approved at the spec gate after a final
fix, 2026-11-13; one operator decision at planning added to its header and FR-004; squad round 1's fixes and the
operator's fork decisions of 2026-11-13 applied to the spec and every design artifact, `reviews/plan/round-1/`).

## Summary

The library's first interactive controls, on mission 005's element and slot conventions. `ocelle-button` renders one
native `<button type="button">` or, with an `href`, an `<a>`, in an open shadow root with `delegatesFocus`: three
variants (primary, secondary, quiet) with designed hover and active states, two sizes (default at least 44 × 44 px,
compact at least 24 × 24 px), `flush` for #12's breadcrumbs (content at the inline start), a `ground` attribute that
selects the border colour on accent-low, inset, hover-bg and state grounds, a `label`, `disabled`, and `busy` with an
SVG spinner in the icon position that turns for 4.8 s and stops (and does not move under reduced motion).
`ocelle-action-row` renders the same kind of inner control as a row or a card, with icon, title, description, tags and
trailing slots, named by its title only, and dispatches `ocelle-action-row-activate` with `{ rowId }`; it has flush
and default presentations, `current` with a bar drawn so it survives forced colours, `unavailable` and `busy`, and its
focus ring is drawn inside the row. A shared internal module `control.ts` carries the control conventions later
controls follow: link versus button (by the URL parser), disabled versus unavailable (neither keeps an `href`), an
activation guard in every non-available state and a `click()` that goes through it, host ARIA **moved** onto the inner
control (operator decision at planning; removal is a no-op, so hosts bind the off value, with per-stack recipes; the
moved states reappear as custom states), ID references resolved in the host's tree and related by ARIA element
reflection, and the name order of Accessible Name 1.2. The engine floor rises to Chromium 135 and WebKit 17.4. Six
tokens are added (`color-hover-border`, `color-accent-hover`, `color-active-bg`, `motion-spin`, `motion-turn`,
`focus-offset-inset`) and four gain declared grounds. The element test harness gains keyboard, pointer, hover, event,
navigation-sink, AX-state, reduced-motion and axe support (`axe-core` 4.14.0, the version #10 pins). Stories follow
feature 006's design (#10, complete on its branch, not merged); 012 lands only after #10 is on `main`, with phase 7
(baselines, the story axe gate, 006's counts and `shardSize` 1) as a blocking part of the landing. Every decision is in
[research.md](research.md); the surface is in [contracts/elements-package.md](contracts/elements-package.md), the
checks in [contracts/checks.md](contracts/checks.md), the state in [data-model.md](data-model.md).

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), Node 26.13.0 in CI (22 in this container).

**Primary Dependencies**: `lit` 3.3.3 (runtime, unchanged); dev: `axe-core` 4.14.0 (new, exact, root devDependency;
R-11). Existing: Vitest 5.0.5 with `@vitest/browser-playwright`, Playwright 1.64.1, Stryker 10.1.1, Stylelint 17.16.0,
`@custom-elements-manifest/analyzer` 0.11.0, Storybook 10.6.5.

**Storage**: N/A.

**Testing**: mission 005's shared scenario bodies run in-process (`elements`, mutated) and on strict-CSP fixture pages
with the built browser build (`elements-browser`), extended with the R-11 driver methods. Link scenarios have two
bodies: in-process against a navigation sink (so the mutated project covers link mode), and on the fixture with real
navigation and new tabs. Story tests in `storybook-integration`, written in each phase's red commit (operator decision
I3); `red.sh` keeps one red record per phase.

**Target Platform**: evergreen Chromium measured (153 here); engine floor Chromium 135+ (element reflection) and
WebKit 17.4+ (custom states; element reflection from 16.4), figures from MDN browser-compat-data 8.1.9 (R-04); WebKit
behaviour unmeasured (open limitation).

**Project Type**: library (web components) in a pnpm workspace.

**Performance Goals**: N/A beyond mission 005's (one adopted stylesheet per element class).

**Constraints**: strict CSP with no exception; token-only styles with no new lint allowance; no I/O; no `sk-` names;
one heavy job at a time in this container.

**Scale/Scope**: 2 elements, 2 internal modules, 1 changed internal module (`icon-slot.ts`), 6 new tokens, 4 tokens
with new grounds (66 new required contrast rows), about 28 stories.

## Constitution Check

*Gate: passes before Phase 0 and after Phase 1 design, with the exception in Complexity Tracking.*

| Principle | How this plan meets it |
|---|---|
| I. Names, events, no I/O, small interface, manifest | Tags `ocelle-button`, `ocelle-action-row`; event `ocelle-action-row-activate`, `bubbles` and `composed` (and `cancelable`); the button emits only the native `click`. No I/O: navigation is the native link's. Interfaces in contracts/elements-package.md; every property, attribute (the moved ARIA attributes included, with descriptions, R-15), slot, part, custom state and the event's `detail` type in the manifest (FR-053). |
| II. Tokens only, brand rules | Element CSS from tokens only, no new lint allowance: the spinner's angle is the new `motion-turn` token and its factor a number inside `calc()` (R-07). `--ocelle-color-rule` never a boundary; control borders per #5 rule 1, selected by the `ground` attribute; the primary button keeps an `accent-strong` border because the ochre fill measures 2.37 to 2.98:1 on light grounds (R-08), so ochre fill is never the only mark; one radius (`radius-2` button, `radius-row` row); no monospace; `font: inherit` on inner controls. |
| III. Accessible by construction | One inner control; host ARIA moved onto it, so the state appears once and axe has nothing to review on the host (R-03); ID references never cross a shadow root (R-04); name order per Accessible Name 1.2, the row named by its title only (R-05), label-in-name stated (WCAG 2.5.3); keyboard: native button (Enter, Space) and link (Enter) behaviour, no composite pattern to roam; Tab and Shift+Tab tested; token focus ring on `:focus-visible`, drawn inside a row so scroll containers and adjacent rows cannot clip or cover it (R-12); default size and every row meet `--ocelle-target-min`, compact meets 24 px (WCAG 2.5.8); the spinner runs 4.8 s and stops (WCAG 2.2.2) and does not move under reduced motion (R-07); forced colours: a system colour per element and state, the current bar and flush hover drawn so they survive (R-12); contrast rows for every pair, hover and active included (R-08); axe in the element tests now (006's rule selection) and on every story in phase 7, before landing. |
| IV. Strict CSP, offline | Adopted stylesheets only; the spinner is inline SVG with presentation attributes; no `javascript:` URL rendered, decided by the URL parser (R-02); every scenario also runs on the strict-CSP fixture with zero violations; axe on the fixture is served same-origin. |
| V. Storybook, behaviour tests | A story per variant and state in light and dark (R-13); interaction tests assert the `click` and the activate event with every flag, the target at every listener and one dispatch serial, from pointer, `click()` and every keyboard path (FR-051). Baselines in phase 7, before landing (Complexity Tracking during development only). |
| VI. Consumer-driven, own code | Needs from #7 and spec-kitty-design #493, #495, #496, #501, #504, #508, #509, #518, #525, #528, #532; consumers #12 (including its menu button's `aria-haspopup`) and #14. Nothing copied from Spec Kitty. |
| VII. Semver | Additions only (MINOR): two elements, two entry points, an event, six tokens, declared grounds, custom states; changelog entries in both packages (FR-055). Raising the engine floor (Chromium 135, WebKit 17.4) is documented in the README's engines section and the CHANGELOG; before 1.0.0 it needs no major bump. The `icon-slot.ts` scoping changes no output of 005's elements. |
| VIII. Test-first, non-vacuous | Each phase starts with one red commit holding its scenario bodies, harness tests, node/build tests and story test (I3), recorded by `red.sh`; each "does not" paired with a positive assertion and a measured plant; every spec edge case and plan decision has a scenario row (contracts/checks.md); clicks on `aria-disabled` controls sent with `force: true` (R-06); link mode covered in-process by the navigation sink, so its mutants are not NoCoverage; `generate.test.ts`'s "exactly two" becomes "exactly the motion durations", recorded as a stricter replacement; element source mutated under the elements config, token, generator and manifest-script source under the default config, with 007's verdicts (R-14). |
| Licence and supply chain | `axe-core` 4.14.0 (MPL-2.0) is a devDependency used only in tests, not shipped: no `THIRD_PARTY_NOTICES` entry (as for other dev tools); exact pin, release age satisfied; it is the version #10 adds, so the lockfile converges. |
| Workflow gates | No new gate; the touched gates are listed in contracts/checks.md. Phase 7 lowers 006's plant `shardSize` to 1 (its Complexity Tracking condition) with a CI run. |

## Decisions the operator should see at the plan gate

1. **Host ARIA is moved** (operator decision at planning; R-03; round 1 fork PLAN-CORRECTNESS-1-001 (a)): the
   elements remove the listed ARIA attributes from the host and apply them to the inner control. Hosts clear with an
   empty value or the off value (`"false"`); `removeAttribute`, and a framework binding that becomes `undefined`, is a
   no-op; the README gives a recipe per stack (React, Lit, Svelte, htmx/Thymeleaf). Spec FR-004 and its header record
   it.
2. **Moved list and styling hooks** (round 1 forks PLAN-A11Y-SECURITY-1-004 (a), PLAN-FRESH-1-009 (a)): the button
   also moves `aria-haspopup` and `aria-pressed`; it exposes `:state(expanded)`, `:state(pressed)` and
   `:state(current)` for host styling.
3. **Engine floor Chromium 135 and WebKit 17.4** (R-04, round 1 fork PLAN-FRESH-1-008 (a)): element reflection
   (Chromium 135, WebKit 16.4) and custom states (Chromium 125, WebKit 17.4), from MDN browser-compat-data; no fallback.
4. **`delegatesFocus` and `click()`** (R-01, R-06): `element.focus()` focuses the inner control; `element.click()`
   clicks it, so a disabled or busy button's `click()` delivers nothing and a row's `click()` activates it.
5. **Tokens** (R-07, R-08, R-12; round 1 forks PLAN-CORRECTNESS-1-004 (a), PLAN-FRESH-1-007 (a),
   PLAN-A11Y-SECURITY-1-006 (a)): new `--ocelle-color-hover-border` (alias of `color-ink`, overridable per #525),
   `--ocelle-color-accent-hover` (proposed `#D9A23F`), `--ocelle-color-active-bg` (proposed light `#D3CCBF`, dark
   `#3A342B`), `--ocelle-motion-spin` (800 ms, 0 ms under reduced motion), `--ocelle-motion-turn` (`1turn`) and
   `--ocelle-focus-offset-inset` (-5 px from the two focus tokens); `color-ink`, `color-ink-soft`,
   `color-accent-strong` and `color-on-accent` gain declared grounds. If a new required pair is below threshold, the
   phase stops and asks (a value change to an existing token is out of scope).
6. **Hover and active** (R-08 item 3): every variant has a hover and an active look distinct from idle and from each
   other; the one exception is a flush control's hover on the `inset` and `hover-bg` grounds in light, where the fill
   equals the ground (documented; hover carries no information).
7. **`ground` attribute** (R-08 item 4, round 1 fork PLAN-TESTABILITY-1-003 (a)): both elements; selects
   `accent-strong` borders on `accent-low`, `inset`, `hover-bg` and the state grounds.
8. **Primary button border** (R-08): always an `accent-strong` border (idle), because the fill alone is below 3:1 on
   light grounds.
9. **Disabled and unavailable links have no `href`** (R-02, round 1 fork PLAN-A11Y-SECURITY-1-005 (a)): an unavailable
   link (busy button, unavailable row) renders `<a role="link" tabindex="0" aria-disabled="true">`, focusable; the
   context menu, drag and the status bar offer no URL. The former README context-menu exception is dropped.
10. **Unparseable `href`** (R-02, round 1 fork PLAN-A11Y-SECURITY-1-008 (a)): button mode, no error; `data:` and
    `vbscript:` are left to the host.
11. **Spinner** (R-07, round 1 fork PLAN-A11Y-SECURITY-1-009 (a)): six turns in 4.8 s, then the still arc (WCAG
    2.2.2).
12. **Row focus ring inside** (R-12): drawn with `--ocelle-focus-offset-inset`; the README padding note is dropped.
13. **Alt-click** on an available link row counts as a modifier click (no event; check-3 note SPEC-3-02).
14. **`axe-core` 4.14.0** as a dev dependency now (R-11), with 006's rule selection in a test-side module, so spec
    scenarios that run axe on test pages are real tests before #10's story gate exists.
15. **012 lands only after #10** (R-13, round 1 fork PLAN-CORRECTNESS-1-010 (a)): phase 7 (baselines, the story axe
    gate, 006's story counts and plants, `shardSize` lowered to 1) is a blocking part of the landing. At about 49
    stories only `shardSize` 1 keeps a `visual` shard under 10 minutes (about 525 s by 006's model); the `visual` and
    `axe` plants then need about three times as many shards, each with about 387 s of fixed cost. Recheck R-13 when #10
    lands.
16. **Unavailable current row** (check-3 note SPEC-3-07): the unavailable look wins (disabled ink, no hover), and the
    current bar stays drawn (in disabled ink) so the position in the list is still visible; `aria-current` stays.
17. **Manifest** (R-15, round 1 fork PLAN-CORRECTNESS-1-006 (a)): the moved attributes are declared with descriptions;
    the normaliser drops a standard attribute only when the element does not declare it (005's output unchanged).

## Project Structure

### Documentation (this feature)

```text
specs/012-button-action-row/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/elements-package.md, contracts/checks.md
├── checklists/requirements.md
├── triage.ref
└── reviews/ (spec checks; plan squad rounds; phase reviews)
```

### Source Code (repository root)

```text
packages/elements/
├── package.json              # exports ./ocelle-button.js, ./ocelle-action-row.js
├── custom-elements.json      # regenerated
├── README.md, CHANGELOG.md   # control conventions, two elements, engines (Chromium 135, WebKit 17.4), notes
├── scripts/manifest.ts       # normaliser keeps declared standard attributes (R-15)
├── src/
│   ├── control.ts            # internal: mode, attribute move, custom states, references, name, guard, click, controlStyles
│   ├── spinner.ts            # internal: spinner template and styles
│   ├── icon-slot.ts          # size rules scoped to the icon and trailing slots (R-10)
│   ├── ocelle-button.ts
│   ├── ocelle-action-row.ts
│   └── index.ts              # re-exports both
└── test/
    ├── scenarios/{driver,button,link,busy,action-row,row-states}.ts
    ├── harness/*.test.ts     # driver method tests (phase 1)
    ├── axe-rules.ts          # 006's axe rule selection, test-side until phase 7
    ├── {control,slot,button,action-row,entry-button,entry-action-row}.test.ts
    ├── commands.ts, in-process.ts (navigation sink)
    ├── browser/{driver,serve}.ts, browser/{button,action-row}.test.ts, browser/fixtures/{button,action-row,link-target}.html
    ├── node/{manifest,readme}.test.ts
    └── build/{build,pack}.test.ts
packages/tokens/src/{source,generate}.ts, test/{expected,generate.test}.ts, test/browser/values.test.ts,
  contrast/pairs.json, README.md, CHANGELOG.md
gates/test/{contrast-pairs,contrast}.test.ts, gates/test/integration/{plants-robustness,token-gates}.test.ts (counts)
vitest.config.ts (commands), package.json + pnpm-lock.yaml (axe-core 4.14.0)
storybook/stories/{button,action-row}.stories.ts, storybook/test/integration/elements-stories.test.ts
phase 7 (with #10, before landing): storybook/baselines/*, 006 integration test counts, plants,
  gates/lib/plant-runner.ts shardSize 1 (with its plantShards test), test/axe-rules.ts → gates/lib/axe-rules.ts
```

**Structure Decision**: as mission 005: everything for the elements in `packages/elements`, token changes in
`packages/tokens`, gate count updates in `gates/`, stories in `storybook/`.

## Phases (user stories) for `/speckit-tasks`

Every phase: one red commit (tests only: scenario bodies, harness, node/build tests, the phase's story test entries,
gate-count tests, the phase's rows of contracts/checks.md § Edge cases and plan decisions) recorded by `red.sh`, then
green; plants measured and recorded in `reviews/phase-N/plants.md`; `gate:manifest`, `style-lint`, `csp`, `prefix`,
`pins`, `test-lint`, `contrast` where tokens changed, then mutation, one at a time.

1. **Setup: test harness** (no element behaviour): the R-11 driver methods and commands in both harnesses (hover,
   pointer down and up, `computed` with `inner`, Tab and Shift+Tab orders, the recorder with `at`, `target`,
   `isTrusted` and serials, the in-process navigation sink, the test-side axe rule module) with their unit tests on
   plain pages (red first), `axe-core` 4.14.0 pinned, fixture pages and serving. Exempt part: the dependency pin
   (checked by `gate:pins`).
2. **US1 `ocelle-button`** (P1, MVP): `icon-slot.ts` scoping (with its `slot.test.ts` case) first; `control.ts`
   (button mode only, `delegatesFocus`, `click()` forwarding, `controlStyles` with the focus ring, forced colours per
   R-12's table and `.icon-slot[hidden]`), `ocelle-button.ts` (variants with hover and active, sizes, flush at the
   inline start, `ground`, label, disabled, icon slot), the tokens `color-hover-border`, `color-accent-hover`,
   `color-active-bg` and the grounds for `color-ink`, `color-accent-strong` and `color-on-accent` with their contrast
   rows (counts first), entry point, manifest (`ground`), README (element conventions → control conventions 1, 3
   (disabled half), 5 (with label-in-name), 7; the form note; the flush-hover note), CHANGELOGs, button stories (US1
   states; a spike first measures whether a programmatically focused story shows `:focus-visible`), US1 scenarios 1
   to 14 and this phase's edge-case rows.
3. **US2 Link mode and ARIA passthrough** (P2): spike first (element reflection on the engine-floor claim; the move
   at upgrade and on later sets; whether analyzer 0.11.0 emits `cssStates`); `control.ts` link mode by the URL parser
   (unparseable → button), `javascript:` rule, `noopener`, disabled link without `href` and with the guard, attribute
   move with clearing and removal as a no-op, `aria-haspopup` and `aria-pressed`, custom states, references, name
   order; `scripts/manifest.ts` and the moved attributes declared; README conventions 2, 4 (with the per-stack
   recipes and custom states), 6, the `data:`/`vbscript:` note, 005's elements keep their rule, engines floor
   Chromium 135 and WebKit 17.4; link stories; US2 scenarios 1 to 12 (in-process sink bodies and fixture navigation
   bodies) and this phase's edge-case rows.
4. **US3 Busy** (P3): the unavailable half of the guard, the unavailable link without `href` and with
   `tabindex="0"`, `spinner.ts` (six turns, 4.8 s), the `motion-spin` and `motion-turn` tokens with `generate.ts`'s
   reduced-motion block from the motion durations (tokens and generator tests first), reduced-motion and
   forced-colours rules; busy stories; US3 scenarios 1 to 9 and this phase's edge-case rows.
5. **US4 `ocelle-action-row`** (P4): `ocelle-action-row.ts` on `control.ts` (button mode, link mode for activation,
   `click()`), the activate event, the name from the title wrapper, the description from slots, flush and default
   presentations, row layout and wrap, `overflow-wrap: anywhere` on title and description, min-content width,
   minimum height, inline padding, hover with `color-hover-border`, `ground`, the focus ring inside with the
   `focus-offset-inset` token, `color-ink-soft` grounds (token tests and contrast rows first); entry point, manifest,
   README, CHANGELOG; row stories; US4 scenarios 1 to 14, the row-layout wrap (check-3 note SPEC-3-04) and this phase's
   edge-case rows.
6. **US5 Row states and card** (P5): link-row activation order and `preventDefault`, modifier, Alt and middle clicks
   (sink and fixture bodies), `current` and its bar (R-12's method, with hover precedence and forced colours),
   `unavailable` (no `href` on a link row, decision 9; with `current`, decision 16), card layout, tags wrapping,
   title gap and part; stories; US5 scenarios 1 to 10 and this phase's edge-case rows.
7. **Workbench integration (#10)**, blocking for landing, once #10 is on `main` and merged into this branch:
   baselines in the pinned container, the axe gate on every new story, 006's integration counts and plants, the
   test-side axe module replaced by `gates/lib/axe-rules.ts`, `shardSize` lowered to 1 test-first with a CI run
   showing every Plants shard under 10 minutes and the run's total recorded.

**Out of this mission**: `ocelle-pill-tag` and its ellipsis tooltip moved to the later status mission with
`ocelle-status-indicator` and `ocelle-metric` (triage 012). That mission builds the tooltip part on #16's
`ocelle-tooltip` as specified in `specs/008-overlays` on `claude/016-overlays`, without redesigning it, and its
implementation of that part needs #16 merged first. Nothing in this mission depends on #16.

Phase order: 1 → 2 → 3 → 4 → 5 → 6 (each needs the previous); 7 after #10 is on `main`, before landing. Every landing
needs phase 7 for the stories it carries. A landing after phase 2 gives #14's copy control only; #12 needs phase 3 as
well (link mode and `aria-current` for its `href` crumbs).

## Complexity Tracking

| Exception | Scope | Rationale | Sunset |
|---|---|---|---|
| No visual baselines and no axe gate run on the new `ocelle-button` and `ocelle-action-row` stories (constitution III, V) | the stories of this feature, during phases 2 to 6 on the feature branch only; never on `main` | #10, which adds both, is complete on its branch but not on `main`; 001's recorded exception "Storybook build, visual regression and axe gates absent" applies to the branch as for mission 005; axe does run on every element test page in this feature; 012 does not land before phase 7 (decision 15) | phase 7, before 012 lands |
