# Contract: checks 011 changes or relies on

## Package tests (`@ocelle/elements`)

| Project | Files | Mutated |
|---|---|---|
| `elements` | `test/<element>.test.ts` (in process, shared bodies from `test/scenarios/<element>.ts`), `test/slot-state.test.ts`, `test/card-context.test.ts`, `test/commands.test.ts` (the new readers, R-13), `test/entry-<element>.test.ts`, `test/entry-card-order.test.ts` (definition order, R-05), `test/entry-root.test.ts` | yes, under `stryker.elements.config.json` |
| `elements-browser` | `test/browser/<element>.test.ts` on strict-CSP fixture pages of the browser build, including the mixed-copy card page (R-05) and the README orientation example page (US4-10) | no |
| `elements-node` | `test/node/readme.test.ts` (FR-036 statements, including the amended Styles paragraph), `test/node/manifest.test.ts` | yes, default configuration |
| `elements-build` | `test/build/build.test.ts`, `test/build/pack.test.ts` (new `dist/<tag>.js` files) | no |

Mutation scope follows 005 decision 16: `packages/elements/src/**` is the changed source; test code, fixture suites
and build tests are not source. Stryker covers the script logic; the `css` templates are covered declaration by
declaration by the style plants below (research.md R-17).

Every element's scenarios include (research.md R-13): a token-sentinel scenario driven by contracts/elements-package.md
§ Tokens each element reads; a no-event check across mount, slot changes and attribute changes; and, for the reflow
scenarios, the scroll-width and text-box assertions. The package scenarios read the accessibility tree only; they do
not run axe (operator decision PLAN-TESTABILITY-1-007 (b)).

## Token checks (`@ocelle/tokens`, `gates/`)

- `packages/tokens/test/expected.ts`: the four tokens.
- `contrast`: 9 rows per theme for `color-eyebrow`; counts 169 light, 177 dark, 346 entries, 158 required per theme
  (316 in all), and the planted-row summary 170 light, changed first at the files and lines research.md R-12 lists
  (including the hand-transcribed A.8 table in `gates/test/contrast-required.test.ts`).
- `brand-rules`, `style-lint`, `prefix` (no monospace family) run in phase 2. The `token-only` named-colour list (148)
  does not change.

## Gates run per phase

`typecheck`, `lint`, `style-lint`, `test-lint`, `test`, `manifest`, `csp`, `prefix`, `mutation` (phase base), and,
from #10, `storybook-build`, `visual` and `axe`; phase 2 adds `contrast` and `brand-rules`. `gate:plants` runs
before each review when a gate's inputs changed (the `contrast` counts in phase 2).

Beside the gates, each phase's evidence holds, in `reviews/phase-N/plants.md`: the pairing plants below, and the
declaration-level style plants of research.md R-17 (every declaration of the phase's new `css` templates
neutralised in the working tree, both harnesses run, the catching scenario recorded; an uncaught declaration blocks
the phase review unless recorded as equivalent with a reason).

## Story test

`storybook/test/integration/elements-stories.test.ts` is extended first in each phase to the new story ids: each
present in the built Storybook and rendering its element (with its slotted content) in light and dark, and each
loaded at 320 × 800 px with `scrollingElement.scrollWidth <= 320` and every slotted text node's box inside its
element's box and every clipping ancestor, paired with the element rendering its content (SC-002, operator decision
PLAN-CORRECTNESS-1-009 (a)). Plant: a story whose slotted text is an unbreakable `white-space: nowrap` run.

The stories include one per case of US3-12 (four) and of US4-11 (three), each rendering that one landmark alone, so
the `axe` gate holds FR-028's axe clause (FR-038).

## Pairing plants ("does not" outcomes)

Each plant is applied by 005's method (`specs/005-icons-brand-mark/reviews/phase-4/plants.md`): the planted edit is
made to the element source (or, where the row says so, the README or a story) in the working tree, the named
scenarios are run through both harnesses with the browser build rebuilt from the planted source, the file is
restored, and `reviews/phase-N/plants.md` records the scenarios that failed in each harness. No plant is committed and
no test hook is added to source.

| "Does not" outcome | Paired positive outcome | Planted defect |
|---|---|---|
| Empty part adds no gap/padding (US1-3, US1-16, US2-4, US3-5, US3-13, US4-6) | filled twin on the same page has the gap | wrapper of an empty slot not hidden |
| Gap follows content change (US1-4, US3-6) | the change that adds content adds the gap | slot state read once at first render only |
| Other elements' boxes unchanged by a slot change (US1-4) | the changed header gains or loses its gap | a host margin keyed on the internal slot state |
| Element adds no heading/landmark (US1-1, US2-1) | the slotted heading is exactly one node with its level | template renders `role="heading"` / a `<header>` |
| Empty heading slot leaves no heading (US1-16) | the filled twin's slotted heading is one node with its level | heading wrapper rendered with `role="heading"` and `aria-level` |
| No `h1` from the element (US2-1, `h2` case) | the slotted `h2` is level 2 | heading wrapper rendered as an `h1` |
| Eyebrow and description not rendered in the eyebrow variant (US1-5) | the heading drawn in the eyebrow style and the actions rendered | eyebrow and description wrappers rendered in the eyebrow variant |
| Card adds no node of its own (US1-19, FR-018) | the slotted `h2` is present in the card's subtree | a `role="region"` wrapper in the card's template |
| No event (FR-002) | the step's layout change happens | `dispatchEvent(new Event("change"))` on slot change |
| No tab stop added (US1-12, US2-6, US3-8) | focus reaches each slotted control in order | wrapper with `tabindex="0"` |
| No attribute written on upgrade (US1-1) | setting `size` by property reflects it | initializer `size = "regular"` |
| Empty or invalid `size` not rewritten and treated as not set (US1-17, US4-8) | valid value draws its look | styles keyed on `:host(:not([size="regular"]))` |
| Nested or body section header not compacted (US1-18) | directly assigned header is compacted | card notifies, and the header resolves from, `querySelectorAll` descendants instead of its assigned slot |
| Header no longer compact after density removed (R-05, PLAN-TESTABILITY-1-009) | header compact after density set by script | card does not notify headers when `density` changes |
| Header moved to the body is no longer compact, and compact again when moved back (R-05) | header compact while in the `header` slot | card does not notify headers that left the slot (`previous` dropped) |
| Definition order changes nothing (R-05; header defined after the card, and before) | header compact in both orders | header resolves its size only in its constructor, not in `willUpdate` / on connect |
| Layout variants hold in forced colours (US1-13 compact card, US4-9 horizontal rail; FR-001) | borders and divider visible in a system colour | the layout rule moved inside `@media not (forced-colors: active)` |
| No divider between sections in a one-section sidebar, none before the first section (US3-7, US3-3) | four dividers in US3-3 | border on the first section too (the `:nth-child(1 of :not([slot]))` rule dropped) |
| Footer does not overlap the last section (US3-4) | the sidebar grows with its content | `max-block-size: 100%` on the layout container |
| No divider for text in the sidebar default slot (US3-11) | one divider at the second section | border on the sections wrapper's text lines |
| Rail divider absent unless both groups are non-empty (US4-6) | divider shown when both are non-empty | divider shown when either group is non-empty |
| Rail keeps orientation at every width (US4-4) | the set orientation draws its layout | a `@media (max-width: 720px)` flip; separately, `container-type: inline-size` on the host with a `@container (max-width: 720px)` flip |
| Orientation change keeps focus (US4-5) | layout changes on the same change | template re-rendered with new nodes per orientation |
| README orientation example uses an exclusive bound (US4-10) | rail vertical at the bound, horizontal 1 px below | the README example rewritten to `max-width: N` (README planted; the test runs the README's code) |
| No horizontal scroll at 320 px (US1-14, US2-5, US3-10, US4-7) | parts stack in the stated order | `flex-wrap: nowrap` on the row / `overflow-wrap: normal` |
| No text clipped at 320 px (Reflow, US1-14, US2-5, US3-10, US4-7) | parts stack in the stated order | `overflow: hidden` plus `white-space: nowrap` on a wrapper |
| Blank host `aria-label` leaves no name (US3-12, US4-11) | non-empty host `aria-label` names the landmark | the element replaces a blank host `aria-label` by the `label` value |
| No other node carries the landmark's name (US3-12, US4-11, R-11) | the landmark is named | an inner `<nav>` carrying the same name beside the host landmark |
| Host `aria-label` never written, rewritten or removed (FR-028) | the landmark is named by `label` or the host value | the element writes `aria-label` from `label` on the host, and removes a blank one |
| No CSP violation, no extra request (FR-035) | the element renders its slotted content | a template with a `style` attribute |
| Inset card in forced colours like regular (US1-13) | border differs from ground | — (positive outcome only; no "does not") |

US4-10 reads the orientation example's code block from `packages/elements/README.md` (located as the readme test
locates sections) and runs it on the fixture page through a same-origin module, so the README's code is what is
measured at N and N − 1 (PLAN-TESTABILITY-1-010).
