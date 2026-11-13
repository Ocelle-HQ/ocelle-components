# Contract: checks 011 changes or relies on

## Package tests (`@ocelle/elements`)

| Project | Files | Mutated |
|---|---|---|
| `elements` | `test/<element>.test.ts` (in process, shared bodies from `test/scenarios/<element>.ts`), `test/slot-state.test.ts`, `test/card-context.test.ts`, `test/entry-<element>.test.ts`, `test/entry-root.test.ts` | yes, under `stryker.elements.config.json` |
| `elements-browser` | `test/browser/<element>.test.ts` on strict-CSP fixture pages of the browser build | no |
| `elements-node` | `test/node/readme.test.ts` (FR-036 statements), `test/node/manifest.test.ts` | yes, default configuration |
| `elements-build` | `test/build/build.test.ts`, `test/build/pack.test.ts` (new `dist/<tag>.js` files) | no |

Mutation scope follows 005 decision 16: `packages/elements/src/**` is the changed source; test code, fixture suites
and build tests are not source.

## Token checks (`@ocelle/tokens`, `gates/`)

- `packages/tokens/test/expected.ts`: the four tokens.
- `contrast`: 9 rows per theme for `color-eyebrow`; counts 169 light, 177 dark, 346 entries, 158 required per theme
  (316 in all), changed first in every test and comment that pins them (research.md R-12).
- `brand-rules`, `style-lint` (`token-only` named-token count), `prefix` (no monospace family) run in phase 2.

## Gates run per phase

`typecheck`, `lint`, `style-lint`, `test-lint`, `test`, `manifest`, `csp`, `prefix`, `mutation` (phase base), and,
from #10, `storybook-build`, `visual` and `axe`; phase 2 adds `contrast` and `brand-rules`. `gate:plants` runs
before each review when a gate's inputs changed (the `contrast` counts in phase 2).

## Story test

`storybook/test/integration/elements-stories.test.ts` is extended first in each phase to the new story ids: each
present in the built Storybook and rendering its element (with its slotted content) in light and dark.

## Pairing plants ("does not" outcomes)

Each is a test-local planted defect (a stylesheet or controller swapped in the in-process harness) that makes the
paired test fail, run in the red/green evidence of its phase.

| "Does not" outcome | Paired positive outcome | Planted defect |
|---|---|---|
| Empty part adds no gap/padding (US1-3, US1-16, US2-4, US3-5, US3-13, US4-6) | filled twin on the same page has the gap | wrapper of an empty slot not hidden |
| Gap follows content change (US1-4, US3-6) | the change that adds content adds the gap | slot state read once at first render only |
| Element adds no heading/landmark (US1-1, US2-1) | the slotted heading is exactly one node with its level | template renders `role="heading"` / a `<header>` |
| No tab stop added (US1-12, US2-6, US3-8) | focus reaches each slotted control in order | wrapper with `tabindex="0"` |
| No attribute written on upgrade (US1-1) | setting `size` by property reflects it | initializer `size = "regular"` |
| Empty or invalid `size` not rewritten and treated as not set (US1-17, US4-8) | valid value draws its look | styles keyed on `:host(:not([size="regular"]))` |
| Nested or body section header not compacted (US1-18) | directly assigned header is compacted | card flags `querySelectorAll` descendants |
| Rail keeps orientation at every width (US4-4) | the set orientation draws its layout | a `@media (max-width: 720px)` flip |
| Orientation change keeps focus (US4-5) | layout changes on the same change | template re-rendered with new nodes per orientation |
| No horizontal scroll at 320 px (US1-14, US2-5, US3-10, US4-7) | parts stack in the stated order | `flex-wrap: nowrap` on the row / `overflow-wrap: normal` |
| No divider for text in the sidebar default slot (US3-11) | one divider at the second section | border on the sections wrapper's text lines |
| Blank host `aria-label` leaves no name (US3-12, US4-11) | non-empty host `aria-label` names the landmark | fallback to `label` when the host value is blank |
| No CSP violation, no extra request (FR-035) | the element renders its slotted content | a template with a `style` attribute |
| Inset card in forced colours like regular (US1-13) | border differs from ground | — (positive outcome only; no "does not") |
