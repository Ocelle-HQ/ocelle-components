# Implementation Plan: Action Controls, `ocelle-button` and `ocelle-action-row`

**Branch**: `012-button-action-row` (work on `claude/007-actions-status`) | **Date**: 2026-11-13 | **Spec**:
[spec.md](spec.md)

**Input**: Feature specification from `specs/012-button-action-row/spec.md` (approved at the spec gate after a final
fix, 2026-11-13; one operator decision at planning added to its header and FR-004).

## Summary

The library's first interactive controls, on mission 005's element and slot conventions. `ocelle-button` renders one
native `<button type="button">` or, with an `href`, an `<a>`, in an open shadow root with `delegatesFocus`: three
variants (primary, secondary, quiet), two sizes (default at least 44 × 44 px, compact at least 24 × 24 px), `flush`
for #12's breadcrumbs, a `label`, `disabled`, and `busy` with an SVG spinner in the icon position that stops under
reduced motion. `ocelle-action-row` renders the same kind of inner control as a row or a card, with icon, title,
description, tags and trailing slots, and dispatches `ocelle-action-row-activate` with `{ rowId }`; it has flush and
default presentations, `current` with a mark, `unavailable` and `busy`. A shared internal module `control.ts` carries
the control conventions later controls follow: link versus button, disabled versus unavailable, an activation guard,
host ARIA **moved** onto the inner control (operator decision at planning, measured: a host that keeps them is a second
named node and draws axe "needs review" results), ID references resolved in the host's tree and related by ARIA
element reflection (which raises the engine floor to Chromium 135), and the name order of Accessible Name 1.2. Two
tokens are added (`color-hover-border`, `motion-spin`) and two gain declared grounds (`color-ink` on the state
grounds, `color-accent-strong` on the main grounds, since the ochre fill is below 3:1 on light grounds). The element
test harness gains keyboard, pointer, event, AX-state, reduced-motion and axe support (`axe-core` 4.14.0, the version
#10 pins). Stories follow feature 006's design (#10, complete on its branch, not merged); baselines, the axe gate on
stories and 006's shard budget are phase 7, done once #10 is on `main`, and must be rechecked when it lands. Every
decision is in [research.md](research.md); the surface is in [contracts/elements-package.md](contracts/elements-package.md),
the checks in [contracts/checks.md](contracts/checks.md), the state in [data-model.md](data-model.md).

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), Node 26.13.0 in CI (22 in this container).

**Primary Dependencies**: `lit` 3.3.3 (runtime, unchanged); dev: `axe-core` 4.14.0 (new, exact, root devDependency;
R-11). Existing: Vitest 5.0.5 with `@vitest/browser-playwright`, Playwright 1.64.1, Stryker 10.1.1, Stylelint 17.16.0,
`@custom-elements-manifest/analyzer` 0.11.0, Storybook 10.6.5.

**Storage**: N/A.

**Testing**: mission 005's shared scenario bodies run in-process (`elements`, mutated) and on strict-CSP fixture pages
with the built browser build (`elements-browser`), extended with the R-11 driver methods; navigation and new-tab
outcomes on the fixture harness only. Story tests in `storybook-integration`, written in each phase's red commit
(operator decision I3); `red.sh` keeps one red record per phase.

**Target Platform**: evergreen Chromium measured (153 here); engine floor Chromium 135+ (element reflection, R-04),
WebKit unmeasured (open limitation).

**Project Type**: library (web components) in a pnpm workspace.

**Performance Goals**: N/A beyond mission 005's (one adopted stylesheet per element class).

**Constraints**: strict CSP with no exception; token-only styles with no new lint allowance; no I/O; no `sk-` names;
one heavy job at a time in this container.

**Scale/Scope**: 2 elements, 2 internal modules, 2 new tokens, 2 tokens with new grounds (about 22 new required
contrast rows plus the hover-border rows), about 28 stories.

## Constitution Check

*Gate: passes before Phase 0 and after Phase 1 design, with the exception in Complexity Tracking.*

| Principle | How this plan meets it |
|---|---|
| I. Names, events, no I/O, small interface, manifest | Tags `ocelle-button`, `ocelle-action-row`; event `ocelle-action-row-activate`, `bubbles` and `composed` (and `cancelable`); the button emits only the native `click`. No I/O: navigation is the native link's. Interfaces in contracts/elements-package.md, every property, attribute, slot, part and the event's `detail` type in the manifest (FR-053). |
| II. Tokens only, brand rules | Element CSS from tokens only, no new lint allowance. `--ocelle-color-rule` never a boundary; control borders per #5 rule 1; the primary button keeps an `accent-strong` border because the ochre fill measures 2.37 to 2.98:1 on light grounds (R-08), so ochre fill is never the only mark; one radius (`radius-2` button, `radius-row` row); no monospace; `font: inherit` on inner controls. |
| III. Accessible by construction | One inner control; host ARIA moved onto it, so the state appears once and axe has nothing to review on the host (R-03, operator decision); ID references never cross a shadow root: resolved in the host's tree and related by element reflection (R-04); name order per Accessible Name 1.2 (R-05); keyboard: native button (Enter, Space) and link (Enter) behaviour, no composite pattern to roam; token focus ring on `:focus-visible`; default size and every row meet `--ocelle-target-min`, compact meets 24 px (WCAG 2.5.8); spinner stops under reduced motion; forced colours tested per state; contrast rows for every pair (R-08); axe in the element tests now and on every story with #10 (Complexity Tracking until then). |
| IV. Strict CSP, offline | Adopted stylesheets only; the spinner is inline SVG with presentation attributes; no `javascript:` URL rendered; every scenario also runs on the strict-CSP fixture with zero violations; axe on the fixture is served same-origin. |
| V. Storybook, behaviour tests | A story per variant and state in light and dark (R-13); interaction tests assert the `click` and the activate event with every flag and the payload, from pointer and every keyboard path (FR-051). Baselines: Complexity Tracking until #10. |
| VI. Consumer-driven, own code | Needs from #7 and spec-kitty-design #493, #495, #496, #501, #504, #508, #509, #518, #525, #528, #532; consumers #12 and #14. Nothing copied from Spec Kitty. |
| VII. Semver | Additions only (MINOR): two elements, two entry points, an event, two tokens, declared grounds; changelog entries in both packages (FR-055). Raising the engine floor is documented in the README's engines section and the CHANGELOG; before 1.0.0 it needs no major bump. |
| VIII. Test-first, non-vacuous | Each phase starts with one red commit holding its scenario bodies, harness tests, node/build tests and story test (I3), recorded by `red.sh`; each "does not" paired with a positive assertion and a measured plant; clicks on `aria-disabled` controls sent with `force: true` so "not activated" tests cannot pass without a click (R-06); element source mutated under the elements config with 007's verdicts (R-14). |
| Licence and supply chain | `axe-core` 4.14.0 (MPL-2.0) is a devDependency used only in tests, not shipped: no `THIRD_PARTY_NOTICES` entry (as for other dev tools); exact pin, release age satisfied; it is the version #10 adds, so the lockfile converges. |
| Workflow gates | No new gate; the touched gates are listed in contracts/checks.md. |

## Decisions the operator should see at the plan gate

1. **Host ARIA is moved** (operator decision at planning; R-03): the elements remove the listed ARIA attributes from
   the host and apply them to the inner control. Hosts clear with an empty value or `"false"`; `getAttribute` reads
   `null`. Spec FR-004 and its header record it.
2. **Engine floor Chromium 135** (R-04): needed for element reflection; README engines section and CHANGELOG.
3. **`delegatesFocus`** (R-01): `ocelle-button.focus()` and `ocelle-action-row.focus()` focus the inner control.
4. **Tokens** (R-08, R-07): new `--ocelle-color-hover-border` (alias of `accent-strong`, overridable per #525) and
   `--ocelle-motion-spin` (800 ms, 0 ms under reduced motion); `color-ink` declared on the state grounds and
   `color-accent-strong` on the six main grounds it was not declared on. If a new required pair is below threshold,
   the phase stops and asks (a value change is out of scope).
5. **Primary button border** (R-08): always an `accent-strong` border, because the fill alone is below 3:1 on light
   grounds.
6. **Busy link and unavailable link row keep `href`** (R-06, check-3 note SPEC-3-03): the context menu's "open in new
   tab" and drag still work; documented. Removing `href` would remove focusability, which unavailable keeps.
7. **Alt-click** on an available link row counts as a modifier click (no event; check-3 note SPEC-3-02).
8. **`axe-core` 4.14.0** as a dev dependency now (R-11), so spec scenarios that run axe on test pages are real tests
   before #10's story gate exists.
9. **Phase 7 waits for #10** (R-13): baselines, the story axe gate, 006's story counts and plants, and lowering
   `shardSize` before the repository passes 25 stories. Recheck R-13 when #10 lands.
10. **Unavailable current row** (check-3 note SPEC-3-07): the unavailable look wins (disabled ink, no hover), and the
    current bar stays drawn (in disabled ink) so the position in the list is still visible; `aria-current` stays.

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
├── README.md, CHANGELOG.md   # control conventions, two elements, engines 135, notes
├── src/
│   ├── control.ts            # internal: mode, attribute move, references, name, guard, controlStyles
│   ├── spinner.ts            # internal: spinner template and styles
│   ├── ocelle-button.ts
│   ├── ocelle-action-row.ts
│   └── index.ts              # re-exports both
└── test/
    ├── scenarios/{driver,button,link,busy,action-row,row-states}.ts
    ├── harness/*.test.ts     # driver method tests (phase 1)
    ├── {control,button,action-row,entry-button,entry-action-row}.test.ts
    ├── commands.ts, in-process.ts
    ├── browser/{driver,serve}.ts, browser/{button,action-row}.test.ts, browser/fixtures/{button,action-row,link-target}.html
    ├── node/{manifest,readme}.test.ts
    └── build/{build,pack}.test.ts
packages/tokens/src/source.ts, test/expected.ts, test/browser/values.test.ts, contrast/pairs.json, README.md, CHANGELOG.md
gates/test/{contrast-pairs,contrast}.test.ts, gates/test/integration/{plants-robustness,token-gates}.test.ts (counts)
vitest.config.ts (commands), package.json + pnpm-lock.yaml (axe-core 4.14.0)
storybook/stories/{button,action-row}.stories.ts, storybook/test/integration/elements-stories.test.ts
phase 7 (with #10): storybook/baselines/*, 006 integration test counts, plants, gates/lib/plant-runner.ts shardSize
```

**Structure Decision**: as mission 005: everything for the elements in `packages/elements`, token changes in
`packages/tokens`, gate count updates in `gates/`, stories in `storybook/`.

## Phases (user stories) for `/speckit-tasks`

Every phase: one red commit (tests only: scenario bodies, harness, node/build tests, the phase's story test entries,
gate-count tests) recorded by `red.sh`, then green; plants measured and recorded in `reviews/phase-N/plants.md`;
`gate:manifest`, `style-lint`, `csp`, `prefix`, `pins`, `test-lint`, `contrast` where tokens changed, then mutation,
one at a time.

1. **Setup: test harness** (no element behaviour): the R-11 driver methods and commands in both harnesses with their
   unit tests on plain pages (red first), `axe-core` 4.14.0 pinned, fixture pages and serving. Exempt part: the
   dependency pin (checked by `gate:pins`).
2. **US1 `ocelle-button`** (P1, MVP): `control.ts` (button mode only, `delegatesFocus`, `controlStyles` with the focus
   ring and forced colours), `ocelle-button.ts` (variants, sizes, flush, label, disabled, icon slot), the token
   grounds for `color-ink` and `color-accent-strong` with their contrast rows (counts first), entry point, manifest,
   README (element conventions → control conventions 1, 3 (disabled half), 5, 7; the form note), CHANGELOGs, button
   stories (US1 states; a spike first measures whether a programmatically focused story shows `:focus-visible`),
   US1 scenarios 1 to 13.
3. **US2 Link mode and ARIA passthrough** (P2): spike first (element reflection on the engine-floor claim; the move
   at upgrade and on later sets); `control.ts` link mode, `javascript:` rule, `noopener`, disabled link, attribute
   move, references, name order; README conventions 2, 4, 6 and engines floor 135; link stories; US2 scenarios 1 to 9
   (navigation on the fixture).
4. **US3 Busy** (P3): the unavailable half of the guard, `spinner.ts`, `motion-spin` token (tokens tests first),
   reduced-motion and forced-colours rules; busy stories; US3 scenarios 1 to 8.
5. **US4 `ocelle-action-row`** (P4): `ocelle-action-row.ts` on `control.ts` (button mode, link mode for activation),
   the activate event, description from slots, flush and default presentations, row layout and wrap, min-content
   width, minimum height, hover with `color-hover-border` (token tests and contrast rows first); entry point,
   manifest, README, CHANGELOG; row stories; US4 scenarios 1 to 12 and the row-layout wrap (check-3 note SPEC-3-04).
6. **US5 Row states and card** (P5): link-row activation order and `preventDefault`, modifier and middle clicks,
   `current` and its mark (with hover precedence), `unavailable` (with decision 10), card layout, tags wrapping, title
   gap and part; stories; US5 scenarios 1 to 10.
7. **Workbench integration (#10)** — only once #10 is on `main` and merged into this branch at landing: baselines in
   the pinned container, the axe gate on every new story, 006's integration counts and plants, `shardSize` lowered
   test-first with a CI run under 10 minutes per Plants shard. If #10 is not on `main` at landing, this phase is
   left to whichever of 012 and #10 lands second, and the Complexity Tracking row stands.

**Out of this mission**: `ocelle-pill-tag` and its ellipsis tooltip moved to the later status mission with
`ocelle-status-indicator` and `ocelle-metric` (triage 012). That mission builds the tooltip part on #16's
`ocelle-tooltip` as specified in `specs/008-overlays` on `claude/016-overlays`, without redesigning it, and its
implementation of that part needs #16 merged first. Nothing in this mission depends on #16.

Phase order: 1 → 2 → 3 → 4 → 5 → 6 (each needs the previous); 7 after #10. A landing after phase 2 alone already
gives #12 and #14 the button.

## Complexity Tracking

| Exception | Scope | Rationale | Sunset |
|---|---|---|---|
| No visual baselines and no axe gate run on the new `ocelle-button` and `ocelle-action-row` stories (constitution III, V) | the stories of this feature, until phase 7 | #10, which adds both, is complete on its branch but not on `main`; 001's recorded exception "Storybook build, visual regression and axe gates absent" applies as for mission 005; axe does run on every element test page in this feature | the merge of #10 (phase 7 then runs) |
