# Implementation Plan: Action Controls, `ocelle-button` and `ocelle-action-row`

**Branch**: `012-button-action-row` (work on `claude/007-actions-status`) | **Date**: 2026-11-13 | **Spec**:
[spec.md](spec.md)

**Input**: Feature specification from `specs/012-button-action-row/spec.md` (approved at the spec gate after a final
fix, 2026-11-13; one operator decision at planning added to its header and FR-004; squad rounds 1 and 2's fixes and
the operator's fork decisions of 2026-11-13 applied to the spec and every design artifact, `reviews/plan/round-1/`,
`reviews/plan/round-2/`; feature 006 (#10) merged into this branch at 37dd501, operator decision 2026-11-13).

## Summary

The library's first interactive controls, on mission 005's element and slot conventions. `ocelle-button` renders one
native `<button type="button">` or, with an `href`, an `<a>`, in an open shadow root with `delegatesFocus`: three
variants (primary, secondary, quiet) with designed hover and active states, two sizes (default at least 44 × 44 px,
compact at least 24 × 24 px), `flush` for #12's breadcrumbs (content at the inline start), a `ground` attribute that
selects the border colour on accent-low, inset, hover-bg and state grounds and a chrome look for the top bar, a
`label`, `disabled`, and `busy` with an SVG spinner in the icon position that turns for 4.8 s and stops (and does not
move under reduced motion). Each host is a grid container whose inner control fills it, so a stretched host has no
area outside the control.
`ocelle-action-row` renders the same kind of inner control as a row or a card, with icon, title, description, tags and
trailing slots, named by its title only, and dispatches `ocelle-action-row-activate` with `{ rowId }`; it has flush
and default presentations, `current` with a bar drawn so it survives forced colours and stays apart from the focus
ring, `unavailable` and `busy`, and its focus ring is drawn inside the row. A shared internal module `control.ts` carries the control conventions later
controls follow: link versus button (by the URL parser), disabled versus unavailable (neither keeps an `href`), an
activation guard in every non-available state and a `click()` that goes through it, host ARIA and `title`
**moved** onto the inner control (operator decision at planning; removal is a no-op, so hosts bind the off value, with
per-stack recipes; the moved states reappear as custom states; each moved value is mirrored in an element-owned
`data-ocelle-moved-*` attribute so copies of the live DOM keep it), ID references resolved in the host's tree and related by ARIA element
reflection, and the name order of Accessible Name 1.2. The engine floor rises to Chromium 135 and WebKit 17.4. Seven
tokens are added (`color-hover-border`, `color-accent-hover`, `color-active-bg`, `color-chrome-active`, `motion-spin`,
`motion-turn`, `focus-offset-inset`) and six gain declared grounds. The element test harness gains keyboard, pointer,
hover, event, navigation-sink, AX-state, reduced-motion and axe support (`axe-core` 4.14.0 and 006's rule selection,
both on this branch since feature 006 merged). Stories, baselines and the story axe gate run on feature 006 as it is
on this branch (#10 is on `main`, 3828d2f, merged here at 37dd501): each phase that adds stories commits their
baselines and passes the `storybook-build`, `visual` and `axe` gates, and phase 1 lowers 006's plant `shardSize` to 1
before any story is added. Every decision is in
[research.md](research.md); the surface is in [contracts/elements-package.md](contracts/elements-package.md), the
checks in [contracts/checks.md](contracts/checks.md), the state in [data-model.md](data-model.md).

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), Node 26.13.0 in CI (22 in this container).

**Primary Dependencies**: `lit` 3.3.3 (runtime, unchanged); no new dependency: `axe-core` 4.14.0 (exact, root
devDependency) came with feature 006 and is used by the element tests with 006's rule selection (R-11). Existing:
Vitest 5.0.5 with `@vitest/browser-playwright`, Playwright 1.64.1, Stryker 10.1.1, Stylelint 17.16.0,
`@custom-elements-manifest/analyzer` 0.11.0, Storybook 10.6.5.

**Storage**: N/A.

**Testing**: mission 005's shared scenario bodies run in-process (`elements`, mutated) and on strict-CSP fixture pages
with the built browser build (`elements-browser`), extended with the R-11 driver methods. Link scenarios have two
bodies: in-process against a navigation sink (so the mutated project covers link mode), and on the fixture with real
navigation and new tabs. Story tests in `storybook-integration`, written in each phase's red commit (operator decision
I3), with 006's pinned story counts; baselines and the `visual` and `axe` gates in the same phase (R-13); `red.sh`
keeps one red record per phase.

**Target Platform**: evergreen Chromium measured (153 here); engine floor Chromium 135+ (element reflection) and
WebKit 17.4+ (custom states; element reflection from 16.4), figures from MDN browser-compat-data 8.1.9 (R-04); WebKit
behaviour unmeasured (open limitation).

**Project Type**: library (web components) in a pnpm workspace.

**Performance Goals**: N/A beyond mission 005's (one adopted stylesheet per element class).

**Constraints**: strict CSP with no exception; token-only styles with no new lint allowance; no I/O; no `sk-` names;
one heavy job at a time in this container.

**Scale/Scope**: 2 elements, 2 internal modules, 1 changed internal module (`icon-slot.ts`), 7 new tokens, 6 tokens
with new grounds (76 new contrast rows, 4 of them exempt), about 31 stories (from 21 to about 52 in the repository),
1 gate constant (`shardSize`).

## Constitution Check

*Gate: passes before Phase 0 and after Phase 1 design, with no exception (Complexity Tracking).*

| Principle | How this plan meets it |
|---|---|
| I. Names, events, no I/O, small interface, manifest | Tags `ocelle-button`, `ocelle-action-row`; event `ocelle-action-row-activate`, `bubbles` and `composed` (and `cancelable`); the button emits only the native `click`. No I/O: navigation is the native link's. Interfaces in contracts/elements-package.md; every property, attribute (the moved ARIA attributes, `title` and the element-owned `data-ocelle-moved-*` mirrors included, with descriptions, R-15), slot, part, custom state and the event's `detail` type in the manifest (FR-053). |
| II. Tokens only, brand rules | Element CSS from tokens only, no new lint allowance: the spinner's angle is the new `motion-turn` token and its factor a number inside `calc()` (R-07). `--ocelle-color-rule` never a boundary; control borders per #5 rule 1, selected by the `ground` attribute; controls on the top bar and rails use the dark chrome tokens through `ground="chrome"` (R-08 item 4a); the primary button keeps an `accent-strong` border because the ochre fill measures 2.37 to 2.98:1 on light grounds (R-08), so ochre fill is never the only mark; one radius (`radius-2` button, `radius-row` row); no monospace; `font: inherit` on inner controls. |
| III. Accessible by construction | One inner control that fills its host, so a stretched host has no area that bypasses the guard (R-01); host ARIA and `title` moved onto it, so the state appears once and axe has nothing to review on the host, and mirrored so copies of the live DOM keep it (R-03); ID references never cross a shadow root (R-04); name order per Accessible Name 1.2, the row named by its title only (R-05), label-in-name stated (WCAG 2.5.3); keyboard: native button (Enter, Space) and link (Enter) behaviour, no composite pattern to roam; Tab and Shift+Tab tested; token focus ring on `:focus-visible`, drawn inside a row so scroll containers and adjacent rows cannot clip or cover it, with the current bar apart from it (R-12), and a documented clearance for a flush button in a clipping container; default size and every row meet `--ocelle-target-min`, compact meets 24 px (WCAG 2.5.8); the spinner runs 4.8 s and stops (WCAG 2.2.2) and does not move under reduced motion (R-07); forced colours: a system colour per element and state, the current bar and flush hover drawn so they survive (R-12); contrast rows for every pair, hover and active included, on the main, state and chrome grounds (R-08); axe in the element tests (006's rule selection, imported) and the `axe` gate on every story in the phase that adds it (R-13). |
| IV. Strict CSP, offline | Adopted stylesheets only; the spinner is inline SVG with presentation attributes; no `javascript:` URL rendered, decided by the URL parser (R-02); every scenario also runs on the strict-CSP fixture with zero violations; axe on the fixture is served same-origin. |
| V. Storybook, behaviour tests | A story per variant and state in light and dark (R-13), each with a committed baseline made in the pinned container in the phase that adds it (006 is on this branch); interaction tests assert the `click` and the activate event with every flag, the target at every listener and one dispatch serial, from pointer, `click()` and every keyboard path (FR-051). |
| VI. Consumer-driven, own code | Needs from #7 and spec-kitty-design #493, #495, #496, #501, #504, #508, #509, #518, #525, #528, #532; consumers #12 (breadcrumb items, and its top-bar menu button with `aria-haspopup` and `ground="chrome"`, so it is not hand-rolled) and #14. Nothing copied from Spec Kitty. |
| VII. Semver | Additions only (MINOR): two elements, two entry points, an event, seven tokens, declared grounds, custom states, the mirror attributes; changelog entries in both packages (FR-055). Raising the engine floor (Chromium 135, WebKit 17.4) is documented in the README's engines section and the CHANGELOG; before 1.0.0 it needs no major bump. The `icon-slot.ts` scoping changes no output of 005's elements. |
| VIII. Test-first, non-vacuous | Each phase starts with one red commit holding its scenario bodies, harness tests, node/build tests and story test (I3), recorded by `red.sh`; each "does not" paired with a positive assertion and a measured plant; every spec edge case and plan decision has a scenario row (contracts/checks.md); clicks on `aria-disabled` controls sent with `force: true` (R-06); link mode covered in-process by the navigation sink, so its mutants are not NoCoverage; `generate.test.ts`'s "exactly two" becomes "exactly the motion durations", recorded as a stricter replacement; element source mutated under the elements config, token, generator and manifest-script source under the default config, with 007's verdicts (R-14). |
| Licence and supply chain | No new dependency: `axe-core` 4.14.0 (MPL-2.0, dev only, not shipped) is already pinned by 006 and is reused by the element tests. |
| Workflow gates | No new gate; the touched gates are listed in contracts/checks.md. Phase 1 lowers 006's plant `shardSize` to 1 before the repository reaches 006's split count of 25 stories (006's Complexity Tracking sunset), test-first; the new split count at size 1 goes to the operator at phase 1's review; phase 6 records a CI run with every Plants shard under 10 minutes (R-13). |

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
   `#3A342B`), `--ocelle-color-chrome-active` (proposed `#3A342B` in both themes, decision 20),
   `--ocelle-motion-spin` (800 ms, 0 ms under reduced motion), `--ocelle-motion-turn` (`1turn`) and
   `--ocelle-focus-offset-inset` (-5 px from the two focus tokens); `color-ink`, `color-ink-soft`,
   `color-accent-strong`, `color-on-accent`, `color-chrome-ink` and `color-disabled-ink` gain declared grounds. If a
   new required pair is below threshold, the phase stops and asks (a value change to an existing token is out of
   scope).
6. **Hover and active** (R-08 item 3, round 2 fix PLAN-FRESH-2-004): every variant has a hover and an active look
   distinct from idle and from each other; the one exception is a flush control's hover where the fill equals the
   ground: the `hover-bg` ground in both themes, the `inset` ground in light, and the `chrome-hover` ground with
   `ground="chrome"` in both themes (documented; hover carries no information). US1-14 and US4-8 list it by hand per
   theme.
7. **`ground` attribute** (R-08 item 4, round 1 fork PLAN-TESTABILITY-1-003 (a), round 2 fix PLAN-FRESH-2-007): both
   elements; selects `accent-strong` borders on `accent-low`, `inset`, `hover-bg` and the state grounds, and the
   chrome look with `chrome` (decision 20). On a container whose surface changes on hover or selection, the host sets
   the changed surface statically (`accent-strong` meets 3:1 on every main ground); README, US1-16 and a story.
8. **Primary button border** (R-08): always an `accent-strong` border (idle), because the fill alone is below 3:1 on
   light grounds.
9. **Disabled and unavailable links have no `href`** (R-02, round 1 fork PLAN-A11Y-SECURITY-1-005 (a)): an unavailable
   link (busy button, unavailable row) renders `<a role="link" tabindex="0" aria-disabled="true">`, focusable; the
   context menu, drag and the status bar offer no URL. The former README context-menu exception is dropped.
10. **Unparseable `href`** (R-02, round 1 fork PLAN-A11Y-SECURITY-1-008 (a)): button mode, no error; `data:` and
    `vbscript:` are left to the host.
11. **Spinner** (R-07, round 1 fork PLAN-A11Y-SECURITY-1-009 (a), round 2 fix PLAN-FRESH-2-008): six turns in 4.8 s,
    then the still arc (WCAG 2.2.2); the README states that an override of `--ocelle-motion-spin` keeps one turn at or
    below 833 ms.
12. **Row focus ring inside** (R-12): drawn with `--ocelle-focus-offset-inset`; the README padding note is dropped.
    The button's ring stays outside; a clipping container holding a flush button at its edge keeps `focus-offset` +
    `focus-width` of unclipped space (README flush note, contract hand-off to #12; round 2 fix PLAN-FRESH-2-009).
13. **Alt-click** on an available link row counts as a modifier click (no event; check-3 note SPEC-3-02).
14. **axe in the element tests** (R-11): `axe-core` 4.14.0 (pinned by 006) with 006's rule selection imported from
    `gates/lib/axe-rules.ts`; no test-side copy and no new dependency.
15. **Feature 006 is merged; its work is done per phase** (R-13; operator decision 2026-11-13, replacing round 1 fork
    PLAN-CORRECTNESS-1-010 (a), which it satisfies): #10 is on `main` (3828d2f) and merged here (37dd501). Each phase
    that adds stories commits their baselines (pinned container), passes the `storybook-build`, `visual` and `axe`
    gates on them, and updates 006's pinned story counts and the `fail-token-changed` and `fail-empty-index` plants.
    Phase 1 lowers `shardSize` from 3 to 1 before any story is added: 006's approved split count is 25 stories, main
    has 21, and at about 52 only size 1 keeps a `visual` shard under 10 minutes (about 533 s by 006's model; 679 s at
    size 2). The 48 `visual` and 25 `axe` plants then take 73 shards instead of 25, each with about 387 s of fixed cost.
    The split count at size 1 (76 stories by the model) goes to the operator at phase 1's review with 006's Complexity
    Tracking row. Checked against the merged code: nothing this design relies on differs from the branch design
    (R-13 lists what changed at 006's landing and why none of it matters here).
16. **Unavailable current row** (check-3 note SPEC-3-07): the unavailable look wins (disabled ink, no hover), and the
    current bar stays drawn (in disabled ink) so the position in the list is still visible; `aria-current` stays.
17. **Manifest** (R-15, round 1 fork PLAN-CORRECTNESS-1-006 (a)): the moved attributes are declared with descriptions;
    the normaliser drops a standard attribute only when the element does not declare it (005's output unchanged).
18. **The inner control fills the host** (R-01, R-10, round 2 fork PLAN-FRESH-2-001 (a)): host `display: inline-grid`
    (button) and `display: grid; min-inline-size: min-content` (row), the inner control the single stretched grid
    item. A click anywhere on a stretched host reaches the inner control, so the guard and the row's activation see
    it; cards in a grid draw equal heights; a button stretched by a flex row grows tall. Plants restore
    `inline-block`/`block`.
19. **Moved values are mirrored** (R-03, round 2 fork PLAN-FRESH-2-002 (a)): one element-owned host attribute
    `data-ocelle-moved-<attribute>` per moved value, read back at upgrade, declared in the manifest (MINOR), so
    `cloneNode`, `innerHTML` round trips and htmx's history restore keep names and states.
20. **`ground="chrome"`** (R-08 item 4a, round 2 fork PLAN-FRESH-2-003 (a)): both elements; `chrome-ink` text,
    `chrome-muted` idle border (no fill, so `secondary` looks like `quiet`), `chrome-hover` hover and current surface,
    a new `--ocelle-color-chrome-active` pressed surface, `chrome-ink` hover border; the primary unchanged. Chrome
    contrast rows join `pairs.json` in phase 2. #12's top-bar menu button uses it.
21. **Current bar apart from the focus ring** (R-12, R-10, round 2 fork PLAN-FRESH-2-005 (b)): the bar is drawn 7 to
    10 px inside the row's border edge, one `focus-offset` inline-end of the ring's band (2 to 5 px), so a gap of the
    row's surface keeps the two `accent-strong` marks apart; the flush row's inline padding becomes `--ocelle-space-3`
    (from `space-2`) to hold ring, gap and bar before the content. Tests read the ring, the gap and the bar
    separately on a focused current row and the ring's four sides on a non-current row.
22. **Host `title` is moved** (R-03, round 2 fork PLAN-FRESH-2-006 (a)): on both elements, onto the inner control
    (native tooltip; description, or name when nothing else names it), mirrored and declared like the ARIA
    attributes.

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
    ├── harness/*.test.ts     # driver method tests (phase 1; axe with gates/lib/axe-rules.ts)
    ├── {control,slot,button,action-row,entry-button,entry-action-row}.test.ts
    ├── commands.ts, in-process.ts (navigation sink)
    ├── browser/{driver,serve}.ts, browser/{button,action-row}.test.ts, browser/fixtures/{button,action-row,link-target}.html
    ├── node/{manifest,readme}.test.ts
    └── build/{build,pack}.test.ts
packages/tokens/src/{source,generate}.ts, test/{expected,generate.test}.ts, test/browser/values.test.ts,
  contrast/pairs.json, README.md, CHANGELOG.md
gates/test/{contrast-pairs,contrast}.test.ts, gates/test/integration/{plants-robustness,token-gates}.test.ts (counts)
gates/lib/plant-runner.ts (shardSize 1, phase 1), gates/test/plant-runner.test.ts, gates/README.md
gates/test/integration/{storybook-build,visual,axe,plant-repo}.test.ts (story counts, per phase)
gates/plants/visual/fail-token-changed/plant.json, gates/plants/storybook-build/fail-empty-index/tree/ (per phase)
vitest.config.ts (commands)
storybook/stories/{button,action-row}.stories.ts, storybook/test/integration/elements-stories.test.ts,
  storybook/baselines/elements-ocelle-{button,action-row}--*.{light,dark}.png (per phase)
```

**Structure Decision**: as mission 005: everything for the elements in `packages/elements`, token changes in
`packages/tokens`, gate count and shard updates in `gates/`, stories and baselines in `storybook/`.

## Phases (user stories) for `/speckit-tasks`

Every phase: one red commit (tests only: scenario bodies, harness, node/build tests, the phase's story test entries,
gate-count tests and 006's pinned story counts, the phase's rows of contracts/checks.md § Edge cases and plan
decisions) recorded by `red.sh`, then green; plants measured and recorded in `reviews/phase-N/plants.md`;
`gate:manifest`, `style-lint`, `csp`, `prefix`, `pins`, `test-lint`, `contrast` where tokens changed; where the phase
adds stories, their baselines (`visual:update` in the pinned container), `gate:storybook-build`, `gate:visual` and
`gate:axe` on the repository and the `fail-token-changed` and `fail-empty-index` plants extended (R-13); then mutation,
one at a time.

1. **Setup: test harness and shard size** (no element behaviour): the R-11 driver methods and commands in both
   harnesses (hover, pointer down and up, `computed` with `inner`, Tab and Shift+Tab orders, the recorder with `at`,
   `target`, `isTrusted` and serials, the in-process navigation sink, `axe` with 006's rule selection imported from
   `gates/lib/axe-rules.ts`) with their unit tests on plain pages (red first), fixture pages and serving (`axe.min.js`
   from the `axe-core` 006 pinned). `shardSize` lowered from 3 to 1 in `gates/lib/plant-runner.ts`, red first in the
   `plantShards` test of the repository's size, with `gates/README.md`'s approved sizes and 006's Complexity Tracking
   row (size 1; the split count at size 1, 76 stories by 006's model, for the operator's approval at this phase's
   review) (R-13).
2. **US1 `ocelle-button`** (P1, MVP): `icon-slot.ts` scoping (with its `slot.test.ts` case) first; `control.ts`
   (button mode only, `delegatesFocus`, `click()` forwarding, `controlStyles` with the focus ring, forced colours per
   R-12's table and `.icon-slot[hidden]`), `ocelle-button.ts` (the `inline-grid` host filled by the inner control,
   variants with hover and active, sizes, flush at the inline start, `ground` with `chrome`, label, disabled, icon
   slot), the tokens `color-hover-border`, `color-accent-hover`, `color-active-bg`, `color-chrome-active` and the
   grounds for `color-ink`, `color-accent-strong`, `color-on-accent`, `color-chrome-ink` and `color-disabled-ink` with
   their contrast rows (counts first), entry point, manifest (`ground`), README (element conventions → control
   conventions 1 (with the filled host), 3 (disabled half), 5 (with label-in-name), 7; the form note; the flush-hover
   note with its exception list; the flush clipping note; the changing-surface `ground` rule; the chrome look),
   CHANGELOGs, button stories (US1 states, chrome, the changing surface; a spike first measures whether a
   programmatically focused story shows `:focus-visible`) with their baselines and the axe gate, US1 scenarios 1 to
   16 and this phase's edge-case rows.
3. **US2 Link mode and ARIA passthrough** (P2): spike first (element reflection on the engine-floor claim; the move
   at upgrade and on later sets; whether analyzer 0.11.0 emits `cssStates`); `control.ts` link mode by the URL parser
   (unparseable → button), `javascript:` rule, `noopener`, disabled link without `href` and with the guard, attribute
   move with clearing and removal as a no-op, `title`, the `data-ocelle-moved-*` mirrors read back at upgrade,
   `aria-haspopup` and `aria-pressed`, custom states, references, name order; `scripts/manifest.ts` and the moved
   attributes and mirrors declared; README conventions 2, 4 (with the per-stack recipes, the mirrors and custom
   states), 6, the `data:`/`vbscript:` note, 005's elements keep their rule, engines floor Chromium 135 and WebKit
   17.4; link stories with their baselines and the axe gate; US2 scenarios 1 to 14 (in-process sink bodies and
   fixture navigation bodies) and this phase's edge-case rows.
4. **US3 Busy** (P3): the unavailable half of the guard, the unavailable link without `href` and with
   `tabindex="0"`, `spinner.ts` (six turns, 4.8 s), the `motion-spin` and `motion-turn` tokens with `generate.ts`'s
   reduced-motion block from the motion durations (tokens and generator tests first), reduced-motion and
   forced-colours rules, the README's 833 ms note for a spin override; busy stories with their baselines and the axe
   gate; US3 scenarios 1 to 10 and this phase's edge-case rows.
5. **US4 `ocelle-action-row`** (P4): `ocelle-action-row.ts` on `control.ts` (the `grid` host filled by the inner
   control, button mode, link mode for activation, `click()`), the activate event, the name from the title wrapper,
   the description from slots, `title` and the mirrors, flush and default presentations, row layout and wrap,
   `overflow-wrap: anywhere` on title and description, min-content width, minimum height, inline padding `space-3`
   in both presentations, hover with `color-hover-border`, `ground` with `chrome`, the focus ring inside with the
   `focus-offset-inset` token, `color-ink-soft` grounds (token tests and contrast rows first); entry point, manifest,
   README, CHANGELOG; row stories with their baselines and the axe gate; US4 scenarios 1 to 17, the row-layout wrap
   (check-3 note SPEC-3-04) and this phase's edge-case rows.
6. **US5 Row states and card** (P5): link-row activation order and `preventDefault`, modifier, Alt and middle clicks
   (sink and fixture bodies), `current` and its bar apart from the ring (R-12's method, with hover precedence, forced
   colours and the chrome surface), `unavailable` (no `href` on a link row, decision 9; with `current`, decision 16;
   a stretched unavailable row), card layout, tags wrapping, title gap and part; stories with their baselines and the
   axe gate; US5 scenarios 1 to 11 and this phase's edge-case rows. The phase's review records a CI run of the branch
   at the full story count with every Plants shard's time (each under 10 minutes) and the run's total (R-13).

**Out of this mission**: `ocelle-pill-tag` and its ellipsis tooltip moved to the later status mission with
`ocelle-status-indicator` and `ocelle-metric` (triage 012). That mission builds the tooltip part on #16's
`ocelle-tooltip` as specified in `specs/008-overlays` on `claude/016-overlays`, without redesigning it, and its
implementation of that part needs #16 merged first. Nothing in this mission depends on #16.

Phase order: 1 → 2 → 3 → 4 → 5 → 6 (each needs the previous). No phase waits for #10: it is on `main` and merged into
this branch, and every phase carries the 006 work for its own stories. A landing after phase 2 gives #14's copy
control only; #12 needs phase 3 as well (link mode and `aria-current` for its `href` crumbs).

## Complexity Tracking

No exception. The former row "No visual baselines and no axe gate run on the new `ocelle-button` and `ocelle-action-row`
stories" (constitution III, V; during phases 2 to 6, sunset "phase 7, before 012 lands", that is the merge of #10) is
closed: #10 is on `main` (3828d2f) and merged into this branch (37dd501), so each phase commits its stories'
baselines and runs the `axe` gate on them (decision 15, operator decision 2026-11-13). The shard-size condition of
006's own row ("Plant roots hold every repository story") is met in phase 1 (R-13).
