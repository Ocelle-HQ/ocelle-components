# Contract: checks (018)

Where each acceptance scenario and edge case is proven, and which gates each phase runs. Test paths are under
`packages/elements/test/` unless named otherwise. "In process" = `test/<x>.test.ts` (project `elements`, mutated);
"CSP" = `test/browser/<x>.test.ts` on the strict-CSP fixture (project `elements-browser`). Scenario bodies live once in
`test/scenarios/<x>.ts` and run in both. Every "does not" is paired with a positive in the same body and has a named
plant (research.md R-11); plants run in op 016's `--affected` mode only.

## Test harness (phase 1, red first, after T001)

The driver as merged after 012 and 008 is recorded by T001 (research.md R-01); the methods below are added or
extended in phase 1, each with a self-test on a plain stand-in page (no `ocelle-*` element of this feature) in
`test/harness/*.test.ts` (in process) and its browser twin (CSP), before any element exists (research.md R-11).

| Method | Self-test (positive and negative on a stand-in) |
|---|---|
| animation record: stable identity, `iterations`, `endTime`, `currentTime`, `playState` | a stand-in with a 3-iteration CSS animation reads 3 and its end time; one without reads none; the same `Animation` read twice has the same identity, a re-created one a new identity |
| `seek(id, inner, ms)` | seeking to 1000 ms reads a current time of 1000 ms and the keyframe value at that time; an unseeked twin reads near 0 |
| `editText(id, data)` | the host's Text node data changes and a `MutationObserver` with `characterData` sees one record; a twin observer without `characterData` sees none |
| tooltip shown state (through `topLayer()` or a nested shadow read) | a stand-in `ocelle-tooltip` trigger hovered past the test delay reads shown; the same before the delay and a disabled twin read not shown |
| `focusVisible` / `focusPath` through nested shadow roots | a keyboard-focused control inside a tooltip inside a shadow host reads focused and focus-visible; a pointer-focused twin reads focused, not focus-visible |
| click at a point of an element | clicks at each corner inset 1 px of a 24 × 24 px stand-in button are received; a click 1 px outside is not |
| `settleLayout()` | a stand-in that sets a reactive property from a `ResizeObserver` is read with its final value after `settleLayout()`; the self-test records that a read after `settle()` alone may be stale (why the wait exists) |
| fractional overflow measure (the helper R-09 uses, run on a stand-in) | an overflow of 0.1 px reads overflow; an exact fit reads none; right-to-left reads the same |

## Scenarios

| Spec | Phase | Scenario file | Runs | Notes |
|---|---|---|---|---|
| US1-1 … US1-8 | 2 | `scenarios/status-indicator.ts` | in process, CSP | US1-4 by the animation record and seeks (§ US1 bodies); US1-5, US1-6 by media emulation; US1-4 (d) for `hidden`, `display: none` ancestor and `<details>` (R-04 spike) |
| SC-001, indicator | 2 | `scenarios/consumers.ts` | in process | `tone` per value with no consumer CSS: the dot's computed fill equals the token value from `expected.ts` for each tone, and an unknown tone reads the neutral value |
| US2-1 … US2-6 | 3 | `scenarios/metric.ts` | in process, CSP | AT tree term → definition, the term named by the written label (not upper-cased) while the visible label is upper-cased; literal `<b>` text; `.layout-row .pair` on one line |
| SC-001, metric | 3 | `scenarios/consumers.ts` | in process | `label` and `display-value` with no consumer CSS: Chromium's tree has the term named by the label and its definition with the value, and both texts are visible |
| US3-1 … US3-7 | 4 | `scenarios/pill-tag.ts` | in process, CSP | heights per density pinned from token values (`.icon-row` nested in `.pill`, with and without an icon); wraps, no ellipsis; § US3 bodies |
| SC-001, pill | 4 | `scenarios/consumers.ts` | in process | `status`: the ground and text equal the status tokens' values; badge use: the border in the status colour at `border-width`; `title`: kept on the host as written; slotted content: the text is in the tree as plain text |
| US4-1 … US4-12 | 5 | `scenarios/pill-tag-interactive.ts` | in process, CSP | event recorder: `click` and `ocelle-pill-tag-activate` with flags, order and serials, from pointer, Enter, Space, `click()`; modifier and middle clicks; mode switches with focus; § US4 bodies |
| US5-1 … US5-6 | 6 | `scenarios/pill-tag-truncation.ts` | in process, CSP | every step settled by `settleLayout()`; tooltip state through `ocelle-tooltip`'s public behaviour only, negatives read after the test delay beside a showing twin; § US5 bodies |
| FR-005, SC-006 | 2 to 6 | `test/node/manifest.test.ts` | node | every member of the contract table, with descriptions, the pill's `label` attribute included |
| FR-007 | 2 to 7 | `test/node/readme.test.ts` | node | one section per element and each README rule the spec and the contract name |
| FR-006 | 2 to 7 | `gate:csp` | gate | built output |
| `MovedAttributes.capture`, `release`, `adoptMirrors`; `guardHost`'s `active` | 5 | `test/control.test.ts` | in process | additive cases on a stand-in host; 012's existing cases unchanged (FR-030); `active` false lets a click through untouched, true guards it as before |
| `statusOf` | 2 | `test/status.test.ts` | in process | every value, unknown, empty, null, case |

### US1 bodies

| Body | Assertion | Plant |
|---|---|---|
| US1-4, each listed change | for each change FR-012 lists (`tone`, `label`, theme, inline size, position, `visibility`, opacity, scroll out of view and back): seek the run to 1000 ms, apply the change, read the same animation (identity) at a current time ≥ 1000 ms | the ring re-created on every render |
| US1-4, positive twin | `pulse` removed, settled, set again in a later task: a new animation (new identity) at a current time near 0 | the ring kept when `pulse` is removed |
| US1-4, same task | `pulse` removed and set again within one task on an ended run: no animation runs and the ring node is the same (FR-012 (a) as amended), beside the positive twin above | (pinned behaviour; the twin is the positive) |
| US1-4, `moveBefore()` and `hidden="until-found"` | what the T001 spike showed, pinned: after `moveBefore()` the same animation continues at a current time ≥ before the move; a reveal from `until-found` as the spike measured; each beside an `appendChild` move or a `hidden` reveal that starts a new run | (pinned behaviour) |
| US1-5, the element's own rule | under `reduce` with a host rule restoring `--ocelle-motion-pulse: 1600ms`: no animation on the ring; twin under no preference with the same host rule: one run | the element's `animation: none` rule removed |
| US1-8, host `aria-label` | `aria-label` present and blank, each with and without `label`: the element's internals (role, name, `ariaHidden`) follow `label` alone in every combination, equal to the same indicator without `aria-label`; Chromium's resulting tree is pinned as the red step measured it | `aria-label` read by the element |

### US3 bodies

| Body | Assertion | Plant |
|---|---|---|
| static click | a static pill, enabled and with `disabled`, inside `<a href>` and under an ancestor click listener: the click reaches the ancestor with `defaultPrevented` false and the link's activation runs; `pill.click()` reaches a host listener; twin: the same on an interactive pill is guarded as 012 says | the guard active while static |
| static focus | a click on a static pill inside a focusable ancestor (`tabindex="0"`) focuses the ancestor; twin: a click on an interactive pill focuses its inner control | `delegatesFocus` set |
| seven names on a static pill | for each of `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-controls`, `aria-current`, `aria-pressed`, `title`: set on an upgraded static pill, then changed: it stays on the host as set, no `data-ocelle-moved-*` mirror, no inner control, no custom state; interactive twin: the attribute is moved and mirrored | the static guard in `attributeChangedCallback` removed |

### US4 bodies

| Body | Assertion | Plant |
|---|---|---|
| US4-1, `label` attribute | `label="Mine"` as an attribute names the inner control, and the attribute stays as written (not reflected from the property); a property set names it with no attribute written | `label` property-only |
| US4-4, values as written | `aria-pressed="bogus"` reaches the inner button as written (012 FR-004), no pressed look, no state | an `aria-pressed` value filter |
| US4-4 / looks, equal boxes | the control's box at rest, hover, active and pressed is the same, pill and badge, both densities | `border-width` changed by a state |
| looks, resting and pressed | an interactive `pill` at rest has a `color-accent-strong` border, a static twin a transparent one; an interactive badge hovered and pressed has the `color-<status>-bg` fill, at rest none; pressed shows the inset bar-width cue, not pressed none | resting border removed; badge fill removed |
| US4-5, disabled look | enabled vs disabled neutral pill, both modes: border `color-accent-strong` vs `color-disabled-ink`, ground `color-neutral-bg` vs `color-disabled-bg` (computed), text `color-neutral` vs `color-disabled-ink` | the disabled border rule removed |
| forced colours | a disabled pill in button and in link mode computes `GrayText` text and border; an enabled link twin `LinkText`; the focus ring on the button and on the link computes `Highlight` | the `:host([disabled]) .control` forced-colours rule removed |
| forced colours, pressed | under forced colours, a pressed button-mode `pill` and `badge` compute background `Highlight`, text `HighlightText` and border `Highlight` (each read against a probe element styled with that system colour in the same mode); their unpressed twins compute a background other than `Highlight` and text `ButtonText`; the control's box is the same pressed and unpressed; a pressed and `disabled` pill computes `GrayText` text and border and no `Highlight` background | the forced-colours pressed rule removed; its `:not([disabled])` dropped |
| US4-6, ring | the focus ring on both controls from the focus tokens (the `control` class present) | the `control` class dropped |
| US4-7, target | the control's box ≥ `target-small` (value from `expected.ts`) in both axes; on a one-character compact badge a click at each corner inset 1 px delivers one `click` and one `ocelle-pill-tag-activate`; a click 1 px outside delivers none | `min-block-size` removed |
| FR-001 of 012, stretched host | a pill host stretched by a flex row (and a grid cell): the control's box equals the host's, and a click 1 px inside the host's edge delivers one `click` and one activate | the host not `inline-grid` |
| US4-8, same task | `interactive` removed and `aria-label="New"` set in one task, in both orders: `aria-label="New"` on the host, no mirror; then a later change of a written-back attribute stays on the host with no mirror | `release()` deferred to the update |
| US4-9, attribute order | `<ocelle-pill-tag title="x" aria-current="page" interactive>` and `… href="/x">` at upgrade (passthrough before the mode attribute), and the same set one by one after creation with the passthrough attribute first: moved, mirrored, `:state(current)` | the mode read from Lit properties; `capture()` not called |
| US4-10, focus and tooltip | a keyboard-focused truncated pill switched button → link and link → button: focus on the new control, ring shown, tooltip shown (read after the test delay); a pointer-focused twin: focus kept, no ring | the refocus in `updated()` (not queued) |

### US5 bodies

| Body | Assertion | Plant |
|---|---|---|
| trigger: width | the container narrowed until the text overflows, then widened: truncated and tooltip enabled, then not | the `ResizeObserver` removed |
| trigger: `characterData` | the host's Text node data edited (`editText`) so the text overflows, then fits | `characterData` or `subtree` false |
| trigger: nested `childList` | a nested element's text replaced so the text overflows | `childList` false |
| trigger: `slotchange` | a child's `slot` attribute changed so the default slot's text grows past the width (no `childList` record on the host) | the `slotchange` listener removed |
| trigger: `updated()` | `density` switched to `default` in a fixed-width container (the span's box held at its maximum): truncated; `disabled` removed on a long pill: truncated | re-measure in `updated()` removed |
| sub-pixel | the container at the fitting width minus 0.1 px: tooltip shown; at the fitting width: not shown | the measure by `scrollWidth > clientWidth` |
| flex row and grid track | a pill beside a name in a flex row and in a grid track narrower than the text: the pill shrinks to the room left and truncates; the sibling keeps its size | the host's `min-inline-size: 0` removed |
| after static → interactive | a pill made interactive (`interactive` set, and a link-mode `href` set) after connection, then narrowed: truncated, tooltip shown | observers created in `connectedCallback` only |
| after a mode switch | a truncated button-mode pill switched to link mode, then widened until it fits: tooltip disabled | the `ResizeObserver` not re-targeted |
| ring in a clipping container | a keyboard-focused truncated pill inside an `overflow: hidden` container: the ring's box (control box grown by offset + width) lies inside the container | the interactive host sheet not adopted |
| negatives | every "no tooltip" read after hover or focus held past the test delay, beside a truncated twin whose tooltip shows | `truncated` forced to false; `truncated` forced to true |

Recorded equivalent mutants (research.md R-09): the `disconnect()` calls of the truncation observers on → static and
on disconnection have no public observable; the phase-6 review records them with that reason.

## Edge cases

| Edge case (spec) | Proven in |
|---|---|
| pill with no text (static and interactive) | `pill-tag.ts`, `pill-tag-interactive.ts` (axe reports the unnamed control) |
| `aria-label` / `label` differs from the full text | `pill-tag-truncation.ts` (tooltip shows the full text) |
| `label` on a static pill | `pill-tag.ts` |
| slotted text changes after render | `pill-tag-truncation.ts` (§ US5 triggers) |
| unknown tone, status, variant, density, layout | each element's scenario file |
| `pulse` on `neutral` | `status-indicator.ts` |
| blank indicator `label` | `status-indicator.ts` |
| host `aria-label` on the indicator | `status-indicator.ts` (US1-8) |
| `pulse` toggled within one task; `moveBefore()`; `hidden="until-found"` | `status-indicator.ts` (§ US1 bodies) |
| `disabled` on a static pill | `pill-tag.ts` (§ US3 static click) |
| click on a static pill inside a link or row | `pill-tag.ts` (§ US3) |
| `aria-pressed` on a link | `pill-tag-interactive.ts` (US4-10) |
| mode changes, focus at a switch | `pill-tag-interactive.ts` (US4-8 … US4-11, § US4) |
| ARIA states left on a static pill | `pill-tag.ts` (§ US3 seven names) and `readme.test.ts` (the rule); no story |
| static at upgrade with mirrors | `pill-tag-interactive.ts` (US4-12) |
| disabled interactive pill with long text | `pill-tag-truncation.ts` (US5-6) |
| forced colours | each element's scenario file; § US4 forced colours and forced colours, pressed |
| right-to-left | `pill-tag.ts`, `metric.ts`, `pill-tag-truncation.ts` (ellipsis at the inline end; the measure at the inline start) |
| long unbroken words | `pill-tag.ts`, `metric.ts` |

## Gates per phase

| Phase | Gates |
|---|---|
| every phase | typecheck, lint, style-lint, test-lint, unit-tests, manifest, csp, prefix, pins, signoff; plants with op 016's `--affected` mode against the phase's `base.sha`, recorded in `reviews/phase-N/plants.md` (never the full plant set locally); mutation (one heavy job at a time) |
| phases adding tokens (US1, US2 if eyebrow, US3, US4) | contrast, brand-rules (rule (f) for `motion-pulse` in US1) |
| phases adding stories (US1 … US5) | storybook-build, visual (baselines in 006's pinned container), axe |
