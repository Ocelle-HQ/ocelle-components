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
through `ElementInternals` (held where axe's role computation reads it), with a head, sections and a footer, divided
by full-width rules placed by `::slotted()` and `:nth-child(1 of :not([slot]):not([hidden]))`, set `!important` so a
page reset cannot remove them, hidden sections drawing nothing; `ocelle-personal-rail` is a host navigation landmark on the dark chrome whose
orientation the page or #12's shell sets, with no threshold of its own. Empty parts take no space
through a shared internal slot-state controller, and the user agent's margins at the edges of slotted content are
trimmed, skipping hidden elements. Stories, baselines and axe follow #10's design; implementation
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

**Scale/Scope**: 5 elements, 4 tokens, 18 contrast rows, 2 internal modules, 51 acceptance scenarios (US1 19, US2 8,
US3 13, US4 11; several run in more than one variant), stories per variant and state plus one per landmark-naming
case.

## Constitution Check

*Gate: passes before Phase 0; re-checked after Phase 1 design and again after the fixes of plan squad rounds 1, 2 and 3
(`reviews/plan/round-1/`, `reviews/plan/round-2/`, `reviews/plan/round-3/`), after the analysis of the tasks
(`reviews/analysis/fixes-1.md`), after the phase-1 spike decision (`reviews/phase-1/spike-fixes.md`) and after the
operator decisions at landing (`reviews/landing/round-1-tasks.md`) — passes, no exception.*

| Principle | How this plan meets it |
|---|---|
| I. Names, no I/O, small interface, manifest | Tags `ocelle-card`, `ocelle-section-header`, `ocelle-page-header`, `ocelle-context-sidebar`, `ocelle-personal-rail`. No events (checked per element, FR-002), no I/O. Interface: `density`, `inset`, `size`, `variant`, `label`, `orientation` and slots; no parts, no element custom properties (FR-007). The compact-card channel is the header reading its own assigned slot, with the card calling the inherited `requestUpdate()`: no new surface (R-05). Manifest entries generated and gated; the published type declarations declare nothing the manifest omits as internal (`stripInternal` in the package's build configuration, R-11, operator decision at landing). |
| II. Tokens only, brand rules | All values from tokens; `uppercase`, `auto`, `100%`, `50%` and `-1` inside `calc()` are allowed by `token-only` as it stands (no new allowance). The sidebar's section rules use `!important` as the slot convention does (R-09). The rail is on `color-chrome` in both themes. Eyebrow in Schibsted Grotesk, no monospace (FR-031). Cards use `radius-row`; no other radius. `color-rule` draws decorative dividers only, never a control boundary. |
| III. Accessible by construction | Slotted headings keep the page's level; no ID reference crosses a shadow root (the landmark's name is a string, not a reference). The sidebar and rail hosts are the navigation landmarks through `ElementInternals` (005's `naming.ts` pattern), named by `label` or the host `aria-label` by the Host ARIA rule, with no second named node (R-11, probed in plan squad round 1). No tab stops; focus order is the page's. Borders survive forced colours (FR-003), and layout variants hold in them (FR-001 as amended). Eyebrow colour has text contrast rows on every main ground. axe through #10 on every story, including one story per US3-12 and US4-11 case; the hosts hold their internals under an `internals` symbol key, so axe's role computation gives them `navigation` and judges their ARIA attributes against it, shown by a role probe planted with a `#private` field; axe's landmark rules select by `role` attribute or tag and do not see the hosts, so landmark naming is held by the tree reads, not by axe (R-11, PLAN-FRESH-2-004 (b), PLAN-FRESH-3-001 (b)). Rail stories and fixtures use stand-in items that inherit chrome ink and are 40 px squares, so `color-contrast` and `target-size` hold, and the README says plain `<a>` items need `color: inherit` and a 24 px target (R-10). |
| IV. Strict CSP | Adopted stylesheets; no `style` attribute or `<style>`; fixture pages under the strict header for every scenario; the rail's stand-in items are styled by same-origin linked stylesheets keyed on `data-story`, never a `style` attribute (R-10); `csp` gate on both builds. |
| V. Storybook, behaviour tests | A story per variant and state, light and dark, baselines from #10's pinned container (R-14). No events to assert; keyboard paths (tab order, orientation change with focus) tested. |
| VI. Consumer-driven, own code | Needs from #8 and spec-kitty-design #450, #492, #497, #516, #529 (`sources/README.md`); deviations listed in the spec. Nothing copied. |
| VII. Semver | MINOR additions only: five elements, five entry points, four tokens; both CHANGELOGs. The internals key is in neither the manifest nor the `.d.ts`, so it is no part of the versioned surface (R-11). |
| VIII. Test-first, non-vacuous | Red first per phase, including the driver's behavioural readers (R-13); every "does not" outcome paired with a positive one and a named plant applied by 005's working-tree method (contracts/checks.md); token-sentinel scenarios so a wrong token fails (R-13); scenario bodies shared so the mutated in-process run covers the script logic, mutation scope as 005 decision 16, every phase that changes source mutation-tested with its own phase base, phase 1 included (`src/slot-state.ts`); the `css` templates, which Stryker mutates at most whole, are covered by declaration-level style plants per phase, an uncaught declaration blocking unless recorded as equivalent (R-17). Spike findings are measured before the red commits that depend on them. |
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
   content): a flex-column host with `min-block-size: 100%` and `align-self: start` and a growing layout container,
   so it fills its container or grows past it in a block, flex-row or grid container (operator decision at the
   phase-1 spike, option (a): without `align-self: start` it stayed at a shorter flex-row or grid container's size;
   a page rule on the host's `align-self` wins, stated in the README; in a flex column or flex row it takes its
   content's inline size, and the README states that the container sets it there and that in a flex column
   `align-self: stretch` on the host also does, operator decisions 6 and 7 of
   `reviews/operator-decisions-implementation.md`); sections `display: block`; each section's `border-block-start` except the first by
   `::slotted(:nth-child(1 of :not([slot]):not([hidden])))`, every section rule excluding `[hidden]` so a hidden
   section (an `ocelle-section-header` included) draws nothing (PLAN-FRESH-2-001); a section's padding, inline
   margins, divider and display are `!important`, as the slot convention's slotted box rules are, so a page reset
   (`ul { margin: 0; padding: 0 }`, a preflight `border: 0 solid`) cannot remove them, while its block margins stay
   normal and the page's (operator decision PLAN-FRESH-3-002 (a)); the sections wrapper's block-start and block-end borders by head and
   footer state (the head's block-end border when the default slot is empty), negative inline margins for full-width
   rules around inline-padded text. The free space of a tall sidebar lies between the last divider and the footer.
   Measured in the phase-1 spike (`reviews/phase-1/spike.md`); the page's DOM is never changed.
6. **Rail** (R-10, SPEC-2-04/2-05/3-05): the host carries the 52 px border-box size and the padding (border-box in
   every new element, R-01); `--ocelle-space-1` on each side of the divider, the divider following the primary group
   and the free space before the bottom group (operator decision PLAN-CORRECTNESS-1-004 (b)); a vertical rail taller
   than its container grows with its content in a block, flex-row or grid container, the host being `align-self:
   start` as the sidebar's (operator decision at the phase-1 spike, option (a); a page rule on the host's
   `align-self` wins, stated in the README), scrolling is the container's; horizontal: primary group wraps, bottom
   group at the inline end (also with no primary items) and at most half the inline size, divider over every row;
   orientation is CSS only, outside the forced-colours query, so focus, DOM and layout in forced colours stay. The
   rail styles no item: chrome ink is on the host, and stories and fixtures hold stand-in `<a>` items sized and set
   to `color: inherit` by a same-origin stylesheet (operator decision PLAN-FRESH-2-003 (a)). The README's orientation
   example is `matchMedia("(width < Npx)")` on the viewport (operator decision PLAN-FRESH-2-005 (a)).
7. **Landmarks** (R-11): the host is the navigation landmark (`internals.role = "navigation"`, `internals.ariaLabel`
   from `label`), no inner `<nav>`; a host `aria-label` overrides natively and the element never writes it. axe is
   not run in the package scenarios: FR-028's axe clause is held by #10's `axe` gate on one story per US3-12 and
   US4-11 case (operator decision PLAN-TESTABILITY-1-007 (b)). Measured in plan squad round 2: axe 4.14.0 does not
   read a `#private` internals field, so with 005's pattern it would not see these landmarks at all. By operator
   decision PLAN-FRESH-2-004 (b) the internals are held under an own `Symbol("internals")` key (internal, off the
   manifest), which axe's role computation reads, so axe judges the host's ARIA attributes against `navigation`.
   Measured in plan squad round 3 (operator decision PLAN-FRESH-3-001 (b)): axe's landmark rules, `landmark-unique`
   included, select by `role` attribute or landmark tag and never see an internals-only host, so no story or
   requirement relies on them and there is no unnamed-pair story; the evidence is a role probe,
   `axe.commons.aria.getRole(host) === "navigation"`, which reads `null` when the internals are planted back in a
   `#private` field. Landmark naming is held by the package scenarios' tree reads. This
   departs from 005's `#internals`; the same change for `ocelle-icon` and `ocelle-brand-mark` is a follow-up for the
   operator, not part of this feature. #10's `axe` gate is a stub at `5f49794`; the phase-1 recheck confirms it runs
   as merged (R-14).
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
14. **Edge margins of slotted content** (R-02, FR-008; operator decision PLAN-FRESH-2-002 (a)): the elements trim
    the UA block margins at the edges of slotted content (description, eyebrow, card body's first and last visible
    element, sidebar sections, head and footer edges, a `hidden` edge element skipped, PLAN-FRESH-3-004); margins
    between slotted elements and any page rule on them stay the page's. The page header's heading-to-description gap
    is a flex `gap`, as the section header's, so an empty heading leaves no gap (R-07, US2-8, PLAN-FRESH-3-003).

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
├── src/naming.ts                       # existing; gains internalsKey (phase 4, R-11)
├── src/index.ts, browser.ts            # shared with siblings
├── package.json (exports), custom-elements.json, README.md, CHANGELOG.md
├── tsconfig.json                       # gains stripInternal (landing fix, phase 4, R-11)
└── test/
    ├── scenarios/<element>.ts, scenarios/driver.ts, <element>.test.ts, slot-state.test.ts,
    │   card-context.test.ts, commands.ts, commands.test.ts, entry-<element>.test.ts,
    │   entry-card-order.test.ts, entry-root.test.ts, exports.test.ts, in-process.ts
    ├── browser/<element>.test.ts, browser/driver.ts, browser/fixtures/ (incl. the mixed-copy card page, the README
    │   example page, rail-items.css)
    ├── node/readme.test.ts, node/manifest.test.ts
    └── build/build.test.ts, build/pack.test.ts
vitest.config.ts                      # browser commands of the new readers (phase 1)
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
     `::slotted()`; UA `p` and `ul` margins trimmed by the edge-margin rules, the margin between two `p` kept, a
     `<p hidden>` at a body or footer edge skipped), R-04
     (wrap rule a–d, d being the actions aligned with the heading under an eyebrow), R-09
     (`:nth-child(1 of :not([slot]):not([hidden]))` under `::slotted()`, negative margins on `div`, `span` and
     `ocelle-section-header` sections, `ul` and `p` sections, `ul` sections under a page `ul` reset and a
     `* { margin: 0; padding: 0; border: 0 solid }` reset with the `!important` rules, hidden `div` and
     `ocelle-section-header` sections and a hidden first section, the host box in block, flex-row and grid containers with and without base.css), R-10
     (focus ring inside the vertical rail, 52 / 44 px border and content box and the horizontal border box at 320 px
     with and without base.css, the host in the three container kinds, the horizontal bottom group with no primary
     items, the stand-in items' colour and axe `color-contrast` and `target-size`), R-11 (the host-as-landmark tree
     reads for the US3-12 and US4-11 cases, and axe-core as pinned by #10 as merged with the internals under the
     `internals` symbol key: no serious or critical finding on the seven cases, and the role probe
     `axe.commons.aria.getRole(host) === "navigation"`, reading `null` with the `#private`-field plant);
   - not exempt: `src/slot-state.ts` with `test/slot-state.test.ts` first (empty by the spec's definition, whitespace
     text, text-data change, element added and removed), red then green;
   - not exempt, red first on a known page (R-13): the behavioural driver and command readers, namely the heading
     level in `axNodes` (`AxNode.level`, `test/commands.ts`, tested in `test/commands.test.ts`), the document's scroll
     width, the deep active element and the text-node boxes with clipping ancestors;
   - checkpoint gates `typecheck`, `lint`, `test-lint`, `test` and `mutation` (phase base, over `src/slot-state.ts`);
   - exempt, as plumbing, with the reason recorded in the phase-1 review: DOM append, remove and text-data change of
     light DOM, Tab presses, viewport and container size, the `driver.rules` token overrides, fixture page templates
     for the five elements (`dir` already exists, `driver.ts:111`).
2. **US1 Section header, card and eyebrow tokens** (P1): tokens first (expected tokens, contrast rows and every
   pinned count at the places R-12 lists changed first); `card-context.ts` with its unit test first
   (`inCompactCardHeader`, `notifyHeaders`); `ocelle-section-header.ts` and `ocelle-card.ts` with US1 scenarios 1–19
   as shared bodies run by both harnesses (US1-2 with `p` description and eyebrow, US1-7 and US1-11 with `p`
   bodies, measured to the slotted element's border box, US1-7 also with a `<p hidden>` at each body edge, FR-008), each "does not" with its pair and plant, plus each element's
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
3. **US2 Page header** (P2): `ocelle-page-header.ts`, US2 scenarios 1–8 as shared bodies (US2-2 with a `p`
   description, FR-008; US2-8 with an empty heading, the heading column's `gap` of R-07), its token-sentinel scenario
   and no-event check; entry, exports, manifest, stories (with the 320 px pass) and baselines, README and readme
   test, CHANGELOG; style plants.
4. **US3 Context sidebar** (P3): `ocelle-context-sidebar.ts`, US3 scenarios 1–13 as shared bodies (US3-3 with its
   `ocelle-section-header` and `span` section variant, its `ul` and `p` section, head and footer variant, its
   footer `<p hidden>` edge variant, its page-reset variants and its hidden-section variant; US3-4 in a block,
   flex-row and grid container, with the 600 px flex-row and grid fill; US3-12 reading the tree only, R-11), its token-sentinel scenario and no-event check; the
   internals under `internalsKey` in `src/naming.ts` and the manifest test's no-member assertion; entry, exports,
   manifest, stories (one landmark per story, with a distinct label where the case names the landmark, one story per
   US3-12 case rendered alone for the `axe` gate) and baselines, the role probe of R-11 recorded in the phase evidence, README and readme test, CHANGELOG; style
   plants.
5. **US4 Personal rail** (P4): `ocelle-personal-rail.ts`, US4 scenarios 1–11 as shared bodies (US4-4 through 721,
   720, 719 and 320 px; US4-6 in both orientations; US4-9 with the horizontal rail still a row; US4-10 running the
   README's `matchMedia("(width < Npx)")` orientation example on the fixture page through a same-origin module, the
   viewport set to N and N − 1; US4-2 with the stand-in items' computed colour, the 600 px flex-row and grid
   variants and the taller-than-container variant in a block, flex-row and grid container; US4-11 reading the tree
   only), its
   token-sentinel scenario and no-event check; the internals under `internalsKey`; the stand-in item stylesheets
   for the fixture pages and the stories (`[data-story="rail-items"]`); entry, exports, manifest, stories (one per
   US4-11 case rendered alone) and baselines, the role probe of R-11 recorded in the phase evidence, README (the #12 note, the orientation
   example and the `<a>` item note) and readme test, CHANGELOG; style plants.

Each phase is folded after its approval (`/ocelle-run` step 4.3). The changed source of each phase
(`packages/elements/src/**`) is mutation-tested with the phase base at the phase checkpoint: `src/slot-state.ts` in
phase 1, whose checkpoint runs `typecheck`, `lint`, `test-lint`, `test` and `mutation`; the elements,
`card-context.ts` and `naming.ts` in the phase that changes them. The tests that pin the package's element lists
(`test/exports.test.ts`, the readme test's Entry points rows and `exports` keys, the manifest test's module paths,
the build and pack lists, `entry-root.test.ts`) are re-listed at each phase base and changed in that phase's red
commit, and each phase's README task adds its Entry points row. Each phase's `css` templates are covered by the
style plants of R-17. Phase 5 is separable: if the operator splits the rail off (triage 011), phases 1–4 stand alone.
Phase 5 uses `internalsKey`, which phase 4 adds to `src/naming.ts`; if phase 4 is deferred or runs after phase 5,
that change moves into phase 5 (tasks.md T036).

### Fixes from the landing review (operator decisions at landing, 2026-11-15)

`reviews/landing/round-1.md` led to one operator round per phase it touches; each fix is red first under the story
fix procedure (`red.sh <N> fix-<k>`, `<k>` the operator round) and reviewed as that phase's next round. The mapping
of finding, task and artifact change is `reviews/landing/round-1-tasks.md`.

- **Phase 1** (T048, L1-04): no code change. The slot-state controller keeps reading `assignedNodes()` unflattened
  (R-03); the README gains one statement for shell authors on forwarded slots (FR-036), asserted by the readme test
  first.
- **Phase 2** (T049, L1-01): the card passes its own `header` slot to `notifyHeaders` on `slotchange` (R-05), after a
  red shared card scenario with a wrapper slot forwarded into the `header` slot, run by both harnesses.
- **Phase 4** (T050, L1-03; T051, L1-02), one red commit: the sidebar's section rules exclude `template` and `script`
  (R-09, FR-021, FR-022), after a red US3-3 variant in both harnesses, with its README statement; and
  `packages/elements/tsconfig.json` sets `stripInternal`, so the `.d.ts` do not declare the internals key (R-11,
  FR-034), after a red build test on the emitted declarations.
- **Phase 5** (T052, L1-05): README only: `ocelle-nav-item` named as not released yet, and the stray line break
  in the rail section removed (FR-027, FR-036), the readme test first.

## Complexity Tracking

No exception. The forced-colours rule for layout variants is an amendment of FR-001 and the README convention, not
an exception (R-01); CSS coverage is met by the style plants of R-17, not excepted. 001's exception "Storybook build, visual regression and axe gates absent" ends with #10's merge, which
the operator has made a precondition of implementation, so it does not apply to this feature's stories.
