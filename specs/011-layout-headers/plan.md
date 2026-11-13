# Implementation Plan: Layout and Headers

**Branch**: `011-layout-headers` (work on `claude/008-layout-headers`) | **Date**: 2026-11-13 | **Spec**:
[spec.md](spec.md)

**Input**: Feature specification from `specs/011-layout-headers/spec.md` (approved at the spec gate after a final
fix, 2026-11-13).

## Summary

Five structural elements in `@ocelle/elements`, written by 005's element conventions, and four eyebrow tokens in
`@ocelle/tokens`. `ocelle-section-header` and `ocelle-page-header` style a heading the page slots (no heading of their
own) with an eyebrow, a description and actions that wrap under the heading column only when its longest word and
the actions do not fit side by side; `ocelle-card` has a regular and a compact density and an inset ground, and
compacts a section header directly in its `header` slot through an internal, module-private flag (no public surface);
`ocelle-context-sidebar` is a named navigation landmark with a head, sections and a footer, divided by full-width rules
placed by `::slotted()` and `:nth-child(1 of :not([slot]))`; `ocelle-personal-rail` is a named navigation landmark on
the dark chrome whose orientation the page or #12's shell sets, with no threshold of its own. Empty parts take no space
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
pages on the browser build), node tests for README, manifest and tokens, build and pack tests, the story test, and
#10's `visual` and `axe` gates (research.md R-13, R-14).

**Target Platform**: Chromium measured; WebKit unmeasured (README). Engine floor unchanged: Chromium 120+, WebKit
16.4+ (R-15).

**Project Type**: library (web components) in a pnpm workspace.

**Performance Goals**: no element adds layout work beyond flexbox; slot state is read on `slotchange` and text-data
mutation only.

**Constraints**: strict CSP; token-only styles; no `sk-` names, no monospace; no I/O; no change to the page's DOM;
one heavy job at a time.

**Scale/Scope**: 5 elements, 4 tokens, 18 contrast rows, 2 internal modules, about 70 acceptance scenarios, stories
per variant and state.

## Constitution Check

*Gate: passes before Phase 0; re-checked after Phase 1 design — passes, no exception.*

| Principle | How this plan meets it |
|---|---|
| I. Names, no I/O, small interface, manifest | Tags `ocelle-card`, `ocelle-section-header`, `ocelle-page-header`, `ocelle-context-sidebar`, `ocelle-personal-rail`. No events, no I/O. Interface: `density`, `inset`, `size`, `variant`, `label`, `orientation` and slots; no parts, no element custom properties (FR-007). The compact-card channel is a module-private `WeakMap`, not surface (R-05). Manifest entries generated and gated. |
| II. Tokens only, brand rules | All values from tokens; `uppercase`, `auto`, `100%`, `50%` and `-1` inside `calc()` are allowed by `token-only` as it stands (no new allowance). The rail is on `color-chrome` in both themes. Eyebrow in Schibsted Grotesk, no monospace (FR-031). Cards use `radius-row`; no other radius. `color-rule` draws decorative dividers only, never a control boundary. |
| III. Accessible by construction | Slotted headings keep the page's level; no ID reference crosses a shadow root (the nav's name is a string, not a reference). Landmarks named by `label` or the host `aria-label` by the Host ARIA rule (R-11, measured before red). No tab stops; focus order is the page's. Borders survive forced colours (FR-003). Eyebrow colour has text contrast rows on every main ground. axe through #10 on every story. |
| IV. Strict CSP | Adopted stylesheets; no `style` attribute or `<style>`; fixture pages under the strict header for every scenario; `csp` gate on both builds. |
| V. Storybook, behaviour tests | A story per variant and state, light and dark, baselines from #10's pinned container (R-14). No events to assert; keyboard paths (tab order, orientation change with focus) tested. |
| VI. Consumer-driven, own code | Needs from #8 and spec-kitty-design #450, #492, #497, #516, #529 (`sources/README.md`); deviations listed in the spec. Nothing copied. |
| VII. Semver | MINOR additions only: five elements, five entry points, four tokens; both CHANGELOGs. |
| VIII. Test-first, non-vacuous | Red first per phase; every "does not" outcome paired with a positive one and a named plant (contracts/checks.md); scenario bodies shared so the mutated in-process run covers every scenario; mutation scope as 005 decision 16. Spike findings are measured before the red commits that depend on them. |
| Workflow gates | No gate added. `contrast` counts change (R-12). #10's three gates join every phase's gate set once merged. |

## Decisions the operator should see at the plan gate

1. **Compact card → section header channel** (R-05): a module-private flag set by the card on directly assigned
   section headers; no CSS custom property, so FR-007 holds and a header in the card's body is not compacted.
2. **Empty-slot detection** (R-03): `slotchange` plus a `MutationObserver` for text-data changes in default slots;
   empty wrappers are `display: none`.
3. **Section and page header wrap rule** (R-04): `flex-basis: min-content`, `min-inline-size: 0`,
   `overflow-wrap: break-word`, measured before red, with a grid fallback.
4. **Page header ground** (R-07, SPEC-2-07/3-06): none of its own; the band shows the surface it sits on, ruled off
   below. No `<header>` in the shadow root (it would be a banner).
5. **Sidebar dividers** (R-09): each section's `border-block-start` except the first by
   `::slotted(:nth-child(1 of :not([slot])))`, the sections wrapper's block-start and block-end borders by head and
   footer state, negative inline margins for full-width rules around inline-padded text. If the measurement fails,
   the operator is asked; the page's DOM is never changed.
6. **Rail** (R-10, SPEC-2-04/2-05/3-05): `--ocelle-space-1` on each side of the divider; a vertical rail taller than
   its container grows with its content, scrolling is the container's; horizontal: primary group wraps, bottom group
   at most half the inline size, divider over every row; orientation is CSS only, so focus and DOM stay.
7. **Host `aria-label` on the landmarks** (R-11): the nav takes the resolved name; whether the host needs
   `internals.role = "none"` to avoid a second named node or an axe finding is measured before red.
8. **Eyebrow tokens** (R-12): four tokens, three of them aliases; tracking `0.08em`; contrast counts 169 / 177 / 346 /
   158. If #7 adds them first, this feature uses them.
9. **#10** (R-14): planned against `claude/010-storybook-workbench` at `5f49794`; rechecked in phase 1 against #10 as
   merged; implementation does not start before #10 is on `main` (operator).
10. **Siblings** (R-16): shared files (`src/index.ts`, `src/browser.ts`, `exports`, `custom-elements.json`, README,
    CHANGELOG, the story test) conflict with #16, #15 and #9; resolved by merging `main` at landing, never a rebase;
    the manifest is regenerated after the merge.

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
    ├── scenarios/<element>.ts, <element>.test.ts, slot-state.test.ts, card-context.test.ts,
    │   entry-<element>.test.ts, entry-root.test.ts
    ├── browser/<element>.test.ts, browser/fixtures/
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
     `::slotted()`), R-04 (wrap rule a–c), R-09 (`:nth-child(1 of :not([slot]))` under `::slotted()`, negative
     margins), R-10 (focus ring inside the vertical rail), R-11 (host `aria-label`, options i and ii, with axe);
   - not exempt: `src/slot-state.ts` with `test/slot-state.test.ts` first (empty by the spec's definition, whitespace
     text, text-data change, element added and removed), red then green;
   - exempt: scenario driver additions (viewport, `dir`, deep active element), fixture page templates for the five
     elements.
2. **US1 Section header, card and eyebrow tokens** (P1): tokens first (expected tokens, contrast rows and every
   pinned count changed first, R-12); `card-context.ts` with its unit test first; `ocelle-section-header.ts` and
   `ocelle-card.ts` with US1 scenarios 1–18 as shared bodies run by both harnesses, each "does not" with its pair and
   plant; entry tests and `entry-root.test.ts`; `exports`; manifest regenerated; stories for every variant and state
   (story test extended first) and their baselines; README sections and the readme test's US1 statements, red first;
   both CHANGELOGs. Gates include `contrast`, `brand-rules`, `visual`, `axe`.
3. **US2 Page header** (P2): `ocelle-page-header.ts`, US2 scenarios 1–7 as shared bodies; entry, exports, manifest,
   stories and baselines, README and readme test, CHANGELOG.
4. **US3 Context sidebar** (P3): `ocelle-context-sidebar.ts`, US3 scenarios 1–13 as shared bodies (US3-12 with axe on
   the fixture page, R-11's chosen option); entry, exports, manifest, stories (one landmark per story, distinct
   label) and baselines, README and readme test, CHANGELOG.
5. **US4 Personal rail** (P4): `ocelle-personal-rail.ts`, US4 scenarios 1–11 as shared bodies (US4-4 through 721,
   720, 719 and 320 px; US4-10 with a test page query at an exclusive bound); entry, exports, manifest, stories and
   baselines, README (the #12 note and the orientation example) and readme test, CHANGELOG.

Each phase is folded after its approval (`/ocelle-run` step 4.3). Element source of each phase is mutation-tested with
the phase base. Phase 5 is separable: if the operator splits the rail off (triage 011), phases 1–4 stand alone.

## Complexity Tracking

No exception. 001's exception "Storybook build, visual regression and axe gates absent" ends with #10's merge, which
the operator has made a precondition of implementation, so it does not apply to this feature's stories.
