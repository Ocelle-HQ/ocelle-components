# Implementation Plan: Layout and Headers

**Branch**: `011-layout-headers` (work on `claude/008-layout-headers`) | **Date**: 2026-11-13 | **Spec**:
[spec.md](spec.md)

**Input**: Feature specification from `specs/011-layout-headers/spec.md` (approved at the spec gate after a final
fix, 2026-11-13).

## Summary

Five structural elements in `@ocelle/elements`, written by 005's element conventions, and four eyebrow tokens in
`@ocelle/tokens`. `ocelle-section-header` and `ocelle-page-header` style a heading the page slots (no heading of their
own) with an eyebrow, a description and actions that wrap under the heading column only when its longest word and
the actions do not fit side by side, the eyebrow on its own line above them; `ocelle-card` has a regular and a
compact density and an inset ground, and a section header directly in its `header` slot reads that slot and compacts
itself (no public surface, no stored flag); `ocelle-context-sidebar` is a navigation landmark on its own host, named
through `ElementInternals`, with a head, sections and a footer, divided by full-width rules placed by `::slotted()`
and `:nth-child(1 of :not([slot]))`; `ocelle-personal-rail` is a host navigation landmark on the dark chrome whose
orientation the page or #12's shell sets, with no threshold of its own. Empty parts take no space
through a shared internal slot-state controller. Stories, baselines and axe follow #10's design; implementation
starts only after #10 is merged, and phase 1 rechecks this plan against #10 as merged. Every decision is in
[research.md](research.md); the surface is in [contracts/elements-package.md](contracts/elements-package.md) and the
checks in [contracts/checks.md](contracts/checks.md).

## Technical Context

**Language/Version**: TypeScript (strict) as pinned; Node 26.13.0 in CI (22 in this container).

**Primary Dependencies**: `lit` 3.3.3 (already pinned by 005); no new dependency. Dev tools as pinned: Vite, Vitest
with `@vitest/browser-playwright`, Playwright, Stryker, Stylelint with `postcss-lit`, Storybook, and #10's capture
container and axe-core once merged.

**Storage**: N/A.

**Testing**: 005's two harnesses over shared scenario bodies (in process from source, mutated; strict-CSP fixture
pages on the browser build), node tests for README, manifest and tokens, build and pack tests, the story test (with
a 320 px pass over every story), #10's `visual` and `axe` gates, and declaration-level style plants per phase
(research.md R-13, R-14, R-17).

**Target Platform**: Chromium measured; WebKit unmeasured (README). Engine floor unchanged: Chromium 120+, WebKit
16.4+ (R-15).

**Project Type**: library (web components) in a pnpm workspace.

**Performance Goals**: no element adds layout work beyond flexbox; slot state is read on `slotchange` and text-data
mutation only.

**Constraints**: strict CSP; token-only styles; no `sk-` names, no monospace; no I/O; no change to the page's DOM;
one heavy job at a time.

**Scale/Scope**: 5 elements, 4 tokens, 18 contrast rows, 2 internal modules, about 70 acceptance scenarios, stories
per variant and state plus one per landmark-naming case.

## Constitution Check

*Gate: passes before Phase 0; re-checked after Phase 1 design and again after plan squad round 1's fixes
(`reviews/plan/round-1/`) — passes, no exception.*

| Principle | How this plan meets it |
|---|---|
| I. Names, no I/O, small interface, manifest | Tags `ocelle-card`, `ocelle-section-header`, `ocelle-page-header`, `ocelle-context-sidebar`, `ocelle-personal-rail`. No events (checked per element, FR-002), no I/O. Interface: `density`, `inset`, `size`, `variant`, `label`, `orientation` and slots; no parts, no element custom properties (FR-007). The compact-card channel is the header reading its own assigned slot, with the card calling the inherited `requestUpdate()`: no new surface (R-05). Manifest entries generated and gated. |
| II. Tokens only, brand rules | All values from tokens; `uppercase`, `auto`, `100%`, `50%` and `-1` inside `calc()` are allowed by `token-only` as it stands (no new allowance). The rail is on `color-chrome` in both themes. Eyebrow in Schibsted Grotesk, no monospace (FR-031). Cards use `radius-row`; no other radius. `color-rule` draws decorative dividers only, never a control boundary. |
| III. Accessible by construction | Slotted headings keep the page's level; no ID reference crosses a shadow root (the landmark's name is a string, not a reference). The sidebar and rail hosts are the navigation landmarks through `ElementInternals` (005's `naming.ts` pattern), named by `label` or the host `aria-label` by the Host ARIA rule, with no second named node (R-11, probed in plan squad round 1). No tab stops; focus order is the page's. Borders survive forced colours (FR-003), and layout variants hold in them (FR-001 as amended). Eyebrow colour has text contrast rows on every main ground. axe through #10 on every story, including one story per US3-12 and US4-11 case. |
| IV. Strict CSP | Adopted stylesheets; no `style` attribute or `<style>`; fixture pages under the strict header for every scenario; `csp` gate on both builds. |
| V. Storybook, behaviour tests | A story per variant and state, light and dark, baselines from #10's pinned container (R-14). No events to assert; keyboard paths (tab order, orientation change with focus) tested. |
| VI. Consumer-driven, own code | Needs from #8 and spec-kitty-design #450, #492, #497, #516, #529 (`sources/README.md`); deviations listed in the spec. Nothing copied. |
| VII. Semver | MINOR additions only: five elements, five entry points, four tokens; both CHANGELOGs. |
| VIII. Test-first, non-vacuous | Red first per phase, including the driver's behavioural readers (R-13); every "does not" outcome paired with a positive one and a named plant applied by 005's working-tree method (contracts/checks.md); token-sentinel scenarios so a wrong token fails (R-13); scenario bodies shared so the mutated in-process run covers the script logic, mutation scope as 005 decision 16; the `css` templates, which Stryker mutates at most whole, are covered by declaration-level style plants per phase, an uncaught declaration blocking unless recorded as equivalent (R-17). Spike findings are measured before the red commits that depend on them. |
| Workflow gates | No gate added. `contrast` counts change at the places R-12 lists. #10's three gates join every phase's gate set once merged. |

## Decisions the operator should see at the plan gate

1. **Compact card → section header channel** (R-05; operator decision PLAN-CORRECTNESS-1-007 (a), pull model): the
   section header resolves its size from its own `size`, else from its assigned slot (a compact `ocelle-card`'s
   `header` slot), and the card only asks directly assigned headers, and those that just left, to update. No CSS
   custom property and no stored flag, so FR-007 holds, a header in the card's body is not compacted, and it works
   whichever element is defined first and across two copies of the package.
2. **Empty-slot detection** (R-03): `slotchange` plus a `MutationObserver` for text-data changes in default slots;
   empty wrappers are `display: none`.
3. **Section and page header wrap rule** (R-04): the eyebrow on its own line above a row of [heading column,
   actions], so the actions align with the heading; `flex-basis: min-content`, `min-inline-size: 0`,
   `overflow-wrap: break-word`, measured before red, with a grid fallback.
4. **Page header ground** (R-07, SPEC-2-07/3-06): none of its own; the band shows the surface it sits on, ruled off
   below. No `<header>` in the shadow root (it would be a banner).
5. **Sidebar box and dividers** (R-09; operator decision PLAN-CORRECTNESS-1-004 (b), the divider follows the
   content): a flex-column host with `min-block-size: 100%` and a growing layout container, so it fills its
   container or grows past it; sections `display: block`; each section's `border-block-start` except the first by
   `::slotted(:nth-child(1 of :not([slot])))`, the sections wrapper's block-start and block-end borders by head and
   footer state (the head's block-end border when the default slot is empty), negative inline margins for full-width
   rules around inline-padded text. The free space of a tall sidebar lies between the last divider and the footer.
   If the measurement fails, the operator is asked; the page's DOM is never changed.
6. **Rail** (R-10, SPEC-2-04/2-05/3-05): the host carries the 52 px border-box size and the padding (border-box in
   every new element, R-01); `--ocelle-space-1` on each side of the divider, the divider following the primary group
   and the free space before the bottom group (operator decision PLAN-CORRECTNESS-1-004 (b)); a vertical rail taller
   than its container grows with its content, scrolling is the container's; horizontal: primary group wraps, bottom
   group at the inline end (also with no primary items) and at most half the inline size, divider over every row;
   orientation is CSS only, outside the forced-colours query, so focus, DOM and layout in forced colours stay.
7. **Landmarks** (R-11): the host is the navigation landmark (`internals.role = "navigation"`, `internals.ariaLabel`
   from `label`), no inner `<nav>`; a host `aria-label` overrides natively and the element never writes it. axe is
   not run in the package scenarios: FR-028's axe clause is held by #10's `axe` gate on one story per US3-12 and
   US4-11 case (operator decision PLAN-TESTABILITY-1-007 (b)). Whether axe 4.14.0 sees the internals landmark, and
   any serious or critical finding on these hosts, is measured with #10's axe-core on a probe page and taken to the
   operator at the plan gate if adverse.
8. **Eyebrow tokens** (R-12): four tokens, three of them aliases; tracking `0.08em`; contrast counts 169 / 177 / 346 /
   158 (316 required), planted summary 170, at the exact places R-12 lists. If #7 adds them first, this feature uses
   them.
9. **#10** (R-14): planned against `claude/010-storybook-workbench` at `5f49794`; rechecked in phase 1 against #10 as
   merged; implementation does not start before #10 is on `main` (operator).
10. **Siblings** (R-16): shared files (`src/index.ts`, `src/browser.ts`, `exports`, `custom-elements.json`, README,
    CHANGELOG, the story test) conflict with #16, #15 and #9; resolved by merging `main` at landing, never a rebase;
    the manifest is regenerated after the merge.
11. **Forced colours and variant rules** (R-01, FR-001 as amended): colour and ground variant rules inside
    `@media not (forced-colors: active)`, layout-only variant rules outside; the README's Styles convention is
    amended in phase 2 to say so.
12. **CSS evidence** (R-17; operator decision PLAN-TESTABILITY-1-001 (a)): declaration-level style plants per phase,
    recorded in `reviews/phase-N/plants.md`; an uncaught declaration blocks unless recorded as equivalent.
13. **SC-002** (R-14; operator decision PLAN-CORRECTNESS-1-009 (a)): the story test loads every new story at
    320 × 800 px and asserts no scroll and no clipped text.

## Project Structure

### Documentation (this feature)

```text
specs/011-layout-headers/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/elements-package.md, contracts/checks.md
├── sources/README.md, checklists/requirements.md, triage.ref
├── reviews/spec/ (checks 1-3 and fixes), reviews/plan/ (squad rounds), reviews/phase-N/
└── tasks.md (/speckit-tasks)
```

### Source Code (repository root)

```text
packages/tokens/
├── src/source.ts                     # four eyebrow tokens
├── contrast/pairs.json               # 18 rows
└── test/expected.ts, CHANGELOG.md, README.md
packages/elements/
├── src/ocelle-card.ts, ocelle-section-header.ts, ocelle-page-header.ts,
│   ocelle-context-sidebar.ts, ocelle-personal-rail.ts
├── src/slot-state.ts, card-context.ts  # internal
├── src/index.ts, browser.ts            # shared with siblings
├── package.json (exports), custom-elements.json, README.md, CHANGELOG.md
└── test/
    ├── scenarios/<element>.ts, scenarios/driver.ts, <element>.test.ts, slot-state.test.ts,
    │   card-context.test.ts, commands.ts, commands.test.ts, entry-<element>.test.ts,
    │   entry-card-order.test.ts, entry-root.test.ts
    ├── browser/<element>.test.ts, browser/fixtures/ (incl. the mixed-copy card page, the README example page)
    ├── node/readme.test.ts, node/manifest.test.ts
    └── build/build.test.ts, build/pack.test.ts
storybook/
├── stories/<element>.stories.ts
├── baselines/<story-id>.<theme>.png  # #10's layout
└── test/integration/elements-stories.test.ts
gates/test/… and gates/bin/contrast.ts # pinned contrast counts
```

## Phases (user stories) for `/speckit-tasks`

1. **Setup and spike** (no behaviour unless named):
   - the #10 recheck (R-14) against `main`, recorded in `reviews/phase-1/spike.md`, a difference that changes a task
     raised to the operator;
   - the spike, measured in this container's Chromium and recorded in the same file: R-02 (UA heading rules lose to
     `::slotted()`), R-04 (wrap rule a–d, d being the actions aligned with the heading under an eyebrow), R-09
     (`:nth-child(1 of :not([slot]))` under `::slotted()`, negative margins on `div`, `span` and
     `ocelle-section-header` sections, the host box in block, flex-row and grid containers with and without
     base.css), R-10 (focus ring inside the vertical rail, 52 / 44 px border and content box and the horizontal border
     box at 320 px with and without base.css, the host in the three container kinds, the horizontal bottom group
     with no primary items), R-11 (the host-as-landmark tree reads for the US3-12 and US4-11 cases, and axe 4.14.0 on
     them against #10 as merged);
   - not exempt: `src/slot-state.ts` with `test/slot-state.test.ts` first (empty by the spec's definition, whitespace
     text, text-data change, element added and removed), red then green;
   - not exempt, red first on a known page (R-13): the behavioural driver and command readers, namely the heading
     level in `axNodes` (`AxNode.level`, `test/commands.ts`, tested in `test/commands.test.ts`), the document's scroll
     width, the deep active element and the text-node boxes with clipping ancestors;
   - exempt, as plumbing, with the reason recorded in the phase-1 review: DOM append, remove and text-data change of
     light DOM, Tab presses, viewport and container size, the `driver.rules` token overrides, fixture page templates
     for the five elements (`dir` already exists, `driver.ts:111`).
2. **US1 Section header, card and eyebrow tokens** (P1): tokens first (expected tokens, contrast rows and every
   pinned count at the places R-12 lists changed first); `card-context.ts` with its unit test first
   (`inCompactCardHeader`, `notifyHeaders`); `ocelle-section-header.ts` and `ocelle-card.ts` with US1 scenarios 1–19
   as shared bodies run by both harnesses, each "does not" with its pair and plant, plus each element's
   token-sentinel scenario and no-event check (R-13); the R-05 transition scenarios (density set then removed by
   script, a header moved between the `header` slot and the body by its `slot` attribute and by DOM moves), the
   definition-order entry test `entry-card-order.test.ts` (import `ocelle-card.js`, mount, then import
   `ocelle-section-header.js`, and the reverse), and the mixed-copy fixture page (a named same-origin test bundle of
   the module build's `ocelle-card.js` before the browser build); the forced-colours layout check of US1-13 (compact
   card); entry tests and `entry-root.test.ts`; `exports`; manifest regenerated; stories for every variant and state
   (story test extended first, with its 320 px pass) and their baselines; README sections, the amended Styles
   convention paragraph (FR-001, FR-036) and the readme test's statements, red first; both CHANGELOGs (the Styles
   change as a documentation note); the style plants of R-17 for both templates. Gates include `contrast`,
   `brand-rules`, `visual`, `axe`.
3. **US2 Page header** (P2): `ocelle-page-header.ts`, US2 scenarios 1–7 as shared bodies, its token-sentinel scenario
   and no-event check; entry, exports, manifest, stories (with the 320 px pass) and baselines, README and readme
   test, CHANGELOG; style plants.
4. **US3 Context sidebar** (P3): `ocelle-context-sidebar.ts`, US3 scenarios 1–13 as shared bodies (US3-3 with its
   `ocelle-section-header` and `span` section variant; US3-12 reading the tree only, R-11), its token-sentinel
   scenario and no-event check; entry, exports, manifest, stories (one landmark per story, distinct label, and one
   story per US3-12 case rendered alone for the `axe` gate) and baselines, README and readme test, CHANGELOG; style
   plants.
5. **US4 Personal rail** (P4): `ocelle-personal-rail.ts`, US4 scenarios 1–11 as shared bodies (US4-4 through 721,
   720, 719 and 320 px; US4-6 in both orientations; US4-9 with the horizontal rail still a row; US4-10 running the
   README's orientation example code on the fixture page through a same-origin module; US4-11 reading the tree
   only), its token-sentinel scenario and no-event check; entry, exports, manifest, stories (one per US4-11 case
   rendered alone) and baselines, README (the #12 note and the orientation example) and readme test, CHANGELOG;
   style plants.

Each phase is folded after its approval (`/ocelle-run` step 4.3). Element source of each phase is mutation-tested with
the phase base, and its `css` templates are covered by the style plants of R-17. Phase 5 is separable: if the operator splits the rail off (triage 011), phases 1–4 stand alone.

## Complexity Tracking

No exception. The forced-colours rule for layout variants is an amendment of FR-001 and the README convention, not
an exception (R-01); CSS coverage is met by the style plants of R-17, not excepted. 001's exception "Storybook build, visual regression and axe gates absent" ends with #10's merge, which
the operator has made a precondition of implementation, so it does not apply to this feature's stories.
