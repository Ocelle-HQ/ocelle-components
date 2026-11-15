# Contract: checks (018)

Where each acceptance scenario and edge case is proven, and which gates each phase runs. Test paths are under
`packages/elements/test/` unless named otherwise. "In process" = `test/<x>.test.ts` (project `elements`, mutated);
"CSP" = `test/browser/<x>.test.ts` on the strict-CSP fixture (project `elements-browser`). Scenario bodies live once in
`test/scenarios/<x>.ts` and run in both.

## Scenarios

| Spec | Scenario file | Runs | Notes |
|---|---|---|---|
| US1-1 … US1-7 | `scenarios/status-indicator.ts` | in process, CSP | US1-4 by `getAnimations()` timing and sampled frames; US1-5, US1-6 by media emulation; US1-4 (d) for `hidden`, `display: none` ancestor and `<details>` (R-04 spike) |
| US2-1 … US2-6 | `scenarios/metric.ts` | in process, CSP | AT tree term → definition; literal `<b>` text |
| US3-1 … US3-7 | `scenarios/pill-tag.ts` | in process, CSP | heights per density pinned from token values; wraps, no ellipsis |
| US4-1 … US4-12 | `scenarios/pill-tag-interactive.ts` | in process, CSP | event recorder (012 driver): `click` and `ocelle-pill-tag-activate` with flags, order and serials, from pointer, Enter, Space, `click()`; modifier and middle clicks; mode switches with focus |
| US5-1 … US5-6 | `scenarios/pill-tag-truncation.ts` | in process, CSP | width changes, text edits, `disabled` toggles; tooltip open state through `ocelle-tooltip`'s public behaviour only |
| SC-001 | `scenarios/consumers.ts` | in process | each Consumers attribute and slot rendered with no consumer CSS |
| FR-005, SC-006 | `test/node/manifest.test.ts` | node | every member of the contract table, with descriptions |
| FR-007 | `test/node/readme.test.ts` | node | one section per element and each README rule the spec names |
| FR-006 | `gate:csp` | gate | built output |
| `MovedAttributes.release`, `adoptMirrors` | `test/control.test.ts` | in process | additive cases; 012's existing cases unchanged (FR-030) |
| `statusOf` | `test/status.test.ts` | in process | every value, unknown, empty, null, case |

## Edge cases

| Edge case (spec) | Proven in |
|---|---|
| pill with no text (static and interactive) | `pill-tag.ts`, `pill-tag-interactive.ts` (axe reports the unnamed control) |
| `aria-label` / `label` differs from the full text | `pill-tag-truncation.ts` (tooltip shows the full text) |
| `label` on a static pill | `pill-tag.ts` |
| slotted text changes after render | `pill-tag-truncation.ts` |
| unknown tone, status, variant, density, layout | each element's scenario file |
| `pulse` on `neutral` | `status-indicator.ts` |
| blank indicator `label` | `status-indicator.ts` |
| `disabled` on a static pill | `pill-tag.ts` |
| `aria-pressed` on a link | `pill-tag-interactive.ts` (US4-10) |
| mode changes, focus at a switch | `pill-tag-interactive.ts` (US4-8 … US4-11) |
| ARIA states left on a static pill | `readme.test.ts` (the rule); no story |
| static at upgrade with mirrors | `pill-tag-interactive.ts` (US4-12) |
| disabled interactive pill with long text | `pill-tag-truncation.ts` (US5-6) |
| forced colours | each element's scenario file |
| right-to-left | `pill-tag.ts`, `metric.ts`, `pill-tag-truncation.ts` (ellipsis at the inline end) |
| long unbroken words | `pill-tag.ts`, `metric.ts` |

## Gates per phase

| Phase | Gates |
|---|---|
| every phase | typecheck, lint, style-lint, test-lint, unit-tests, manifest, csp, prefix, pins, signoff; plants with op 016's `--affected` mode recorded in `reviews/phase-N/plants.md`; mutation (one heavy job at a time) |
| phases adding tokens (US1, US2 if eyebrow, US3, US4) | contrast, brand-rules (rule (f) for `motion-pulse` in US1) |
| phases adding stories (US1 … US5) | storybook-build, visual (baselines in 006's pinned container), axe |
