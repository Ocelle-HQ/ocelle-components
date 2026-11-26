# Contract: checks (018)

Where each acceptance scenario and edge case is proven, and which gates each phase runs. Test paths are under
`packages/elements/test/` unless named otherwise. "In process" = `test/<x>.test.ts` (project `elements`, mutated);
"CSP" = `test/browser/<x>.test.ts` on the strict-CSP fixture (project `elements-browser`). Scenario bodies live once in
`test/scenarios/<x>.ts` and run in both. Every "does not" is paired with a positive in the same body and has a named
plant (research.md R-11); plants run in op 016's `--affected` mode only.

## Test harness (phase 1, red first, after T001)

The driver as merged on `main` is recorded by T001 (`reviews/phase-1/recheck.md` § The test driver; research.md R-01):
one `Driver` with 005's, 012's, 009's, 008's, 011's and 013's methods, 008's same-named methods renamed at the merge
(`inputPress`, `inputClick`, `inputHover`, `ownAnimations`). As amended at the phase-1 recheck (operator decision Q4
(a)), phase 1 adds or extends only the methods `main` lacks, rows 1, 2, 7 and 8 below, each with a self-test on a
plain stand-in page (no `ocelle-*` element of this feature) in `test/harness/*.test.ts` (in process) and its browser
twin (CSP), red before the method exists (research.md R-11). Rows 3 to 6 exist on `main` and are used by the scenarios
as merged, with no new method and no self-test: a self-test of them would pass before any change and so cannot be in
the red commit; each scenario negative that uses them is paired with its positive in the same body.

| Row | Method | Phase 1 | Self-test (positive and negative on a stand-in) |
|---|---|---|---|
| 1 | animation record: stable identity, `iterations`, `endTime`, `currentTime`, `playState` | extend (013's `animations(id)` gives `endTime`, `currentTime`, `playState`; identity and `iterations` added, additively, or a sibling) | a stand-in with a 3-iteration CSS animation reads 3 and its end time; one without reads none; the same `Animation` read twice has the same identity, a re-created one a new identity |
| 2 | `seek(id, inner, ms)` | add | seeking to 1000 ms reads a current time of 1000 ms and the keyframe value at that time; an unseeked twin reads near 0 |
| 3 | editing a text node's data (the `characterData` path; planned as `editText(id, data)`) | none: 013's `text(id, value)` (the first text node child's data) and 011's `textData(id, index, data)` as merged | — |
| 4 | tooltip shown state | none: 008's `topLayer()` as merged (`:popover-open` elements in every shadow root the probe saw attached, nested ones included) | — |
| 5 | `focusVisible` / `focusPath` through nested shadow roots | none: 008's `focusVisible(id, inner?)` and `focusPath()` as merged (the pill's control is in the pill's own shadow root, the tooltip's trigger its light-DOM child there, so `focusVisible(pill, ".control")` reaches it) | — |
| 6 | click at a point of an element | none: 012's `click(id, { position })` (a point from the top-left corner) and 009's `clickAt(target, point)` as merged | — |
| 7 | `settleLayout()` | add (013's `layout(id)` settles and reads a `dl`'s box only) | a stand-in that sets a reactive property from a `ResizeObserver` is read with its final value after `settleLayout()`; the self-test records that a read after `settle()` alone may be stale (why the wait exists) |
| 8 | fractional overflow measure (the helper R-09 uses, run on a stand-in) | add | an overflow of 0.1 px reads overflow; an exact fit reads none; right-to-left reads the same |

## Scenarios

| Spec | Phase | Scenario file | Runs | Notes |
|---|---|---|---|---|
| US1-1 … US1-8 | 2 | `scenarios/status-indicator.ts` | in process, CSP | US1-4 by the animation record and seeks (§ US1 bodies); US1-5, US1-6 by media emulation; US1-4 (d) for `hidden` and a `display: none` ancestor; the `<details>` case pinned as not a start case (§ US1 bodies, R-04) |
| SC-001, indicator | 2 | `scenarios/consumers.ts` | in process (`test/consumers.test.ts`, created in phase 2) | `tone` per value with no consumer CSS: the dot's computed fill equals the token value from `expected.ts` for each tone, and an unknown tone reads the neutral value |
| US2-1 … US2-7 | 3 | `scenarios/metric.ts` | in process, CSP | AT tree term → definition, the term named by the written label (not upper-cased) while the visible label is upper-cased; literal `<b>` text; `.layout-row .pair` on one line; § US2 bodies |
| SC-001, metric | 3 | `scenarios/consumers.ts` | in process (`test/consumers.test.ts`, extended) | `label` and `display-value` with no consumer CSS: Chromium's tree has the term named by the label and its definition with the value, and both texts are visible |
| US3-1 … US3-8 | 4 | `scenarios/pill-tag.ts` | in process, CSP | heights per density pinned from token values (`.icon-row` nested in `.pill`, with and without an icon); wraps, no ellipsis; § US3 bodies, static-only (US3-7's "has become static" half is proven by US4-8 in phase 5) |
| SC-001, pill | 4 | `scenarios/consumers.ts` | in process (`test/consumers.test.ts`, extended) | `status`: the ground and text equal the status tokens' values; badge use: the border in the status colour at `border-width`; `title`: kept on the host as written; slotted content: the text is in the tree as plain text |
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
| US1-4, `moveBefore()` and `hidden="until-found"` | what the T002 spike showed, pinned: after `moveBefore()` the same animation continues at a current time ≥ before the move; a reveal from `until-found` as the spike measured; each beside an `appendChild` move or a `hidden` reveal that starts a new run | (pinned behaviour) |
| US1-4, `<details>` | what Chromium does, pinned (operator decision on PLAN-FRESH-2-001, (b)): a pulsing indicator in an open `<details>`, seeked to 500 ms, then `open = false`: the same animation is still running after 300 ms at a current time ≥ 800 ms; closed for longer than one run (the run's end time passed), then `open = true`: no animation on the ring, the dot solid; closed for less than one run and opened: the same animation, not a new one; an indicator connected and one given `pulse` inside a closed `<details>`, then opened: as the T002 spike measured; each beside a twin whose `hidden` parent is hidden and revealed and which starts a new run (new identity, current time near 0) | (pinned behaviour; the `hidden` twin is the positive) |
| US1-5, the element's own rule | under `reduce` with a host rule restoring `--ocelle-motion-pulse: 1600ms`: no animation on the ring; twin under no preference with the same host rule: one run | the element's `animation: none` rule removed |
| US1-8, host `aria-label` | `aria-label` present and blank, each with and without `label`: the element's internals (role, name, `ariaHidden`) follow `label` alone in every combination, equal to the same indicator without `aria-label`; Chromium's resulting tree is pinned as the T002 spike measured it on a stand-in (`reviews/phase-1/spikes.md`), the value written by hand | `aria-label` read by the element |

### US2 bodies

| Body | Assertion | Plant |
|---|---|---|
| US2-7, flex row | in a 220 px flex row beside "Refactor the mission scheduler pipeline", a metric `label="Open"` `display-value="12345"` in `stack` and in `row`: label and value each on one line (one line box each, measured by a `Range` over the text), the metric's inline size at least its longest word; twin: a 34-letter value in a 100 px block container, in both layouts, breaks inside the metric (more than one line, the `dd` box inside the host's); a twin with `min-inline-size: 0` on the host in the flex row: the metric narrower than its longest word, every character inside it | `overflow-wrap: anywhere` on `dt` and `dd`; the row's `min-inline-size: 0` on `dt` and `dd` removed |
| find in page | `window.find(label)` from the start of a page with one metric matches twice, and the second match's range lies in the `.written` span with a zero-size rect (the recorded limitation, R-05); if the T002 probe adopted a hiding that find skips: one match, in the eyebrow span; positive twin: a label also written once in the page outside the metric adds one match | (pinned behaviour; the twin is the positive) |

### US3 bodies

Static-only (analysis finding I2): phase 4 builds no interactive mode, so each body's positive is a static pill or a
plain-element twin, and the interactive twins of the static click, static focus and seven names bodies are § US4's
"interactive click", "interactive focus" and "seven names, interactive" rows, in phase 5.

| Body | Assertion | Plant |
|---|---|---|
| static click | a static pill, enabled and with `disabled`, inside `<a href>` and under an ancestor click listener, beside a plain `<span>` twin in the same places: the pill's click reaches the ancestor with `defaultPrevented` false and the link's activation runs, as the span's does; `pill.click()` reaches a host listener and the ancestor | a click guard on the static host (a host click listener calling `preventDefault()` and `stopPropagation()`) |
| static focus | a click on a static pill inside a focusable ancestor (`tabindex="0"`) focuses the ancestor, as a click on a plain `<span>` twin in the same ancestor does; the pill's shadow root holds no focus | `delegatesFocus` set |
| US3-8, flex row | in a 220 px flex row beside "Refactor the mission scheduler pipeline", `<ocelle-pill-tag status="warning">Blocked</ocelle-pill-tag>` in each variant and density: the text on one line (one line box), the host at least the word's width plus the padding and border; the same pill with `min-inline-size: 0` set by the host: narrower than the word, the word over more than one line, every character inside the `.pill` box; twin: a 34-letter word in a 100 px block container and in a 100 px grid track breaks inside the pill (more than one line, the text box inside the `.pill` box, the host within the container, and the `.pill` box inside the host and the container: its inline size at most 100 px and its edges within the host's, within 0.5 px); in a 150 px flex row holding "Name" and then the long-word pill, the pill's host is at most the row's inline size, the `.pill` box lies inside the host (its inline size at most the host's, its edges within the host's, within 0.5 px), and the host's right edge lies beyond the row's by the sibling's width (within 0.5 px; the accepted overflow, PLAN-FRESH-3-005), and the twin with `min-inline-size: 0` on that pill fits inside the row (its right edge at most the row's, the word over more than one line, every character inside the `.pill` box) | `overflow-wrap: anywhere` on the text; `min-inline-size: 0` on the static host or `.pill`; the static host `inline-grid`; the `.icon-row` cap removed; `box-sizing: border-box` removed from the static `.pill` (the capped `.pill` is then 126 px and sticks out of its 100 px host and container, 176 px in the 150 px row; PLAN-FRESH-3-002) |
| stretched host | `<ocelle-pill-tag status="warning">Blocked</ocelle-pill-tag>` in each variant and density, in a 200 px grid track and in a 200 px `flex-direction: column` container (default `align-items: stretch`): the `.pill` box's inline and block size equal the same pill's in a block container (within 0.5 px), one line, the host stretched to 200 px; the long-word twins of US3-8 unchanged, and they, not this body, kill the `box-sizing: border-box` plant (below the cap "Blocked" is the same size with either box model) | `inline-size: fit-content` removed from the static `.pill` |
| baseline (amended at the phase-1 recheck, Q2: measures the slot convention as merged, 012 decision 33; amended at phase-4 round 2, O2-01: the icon-only pixel pin on the fixture only; amended at phase-4 round 3, O3-01: the in-process facts) | a static pill, with and without an icon, in each variant, density and status example: inline in a paragraph (`<p>Before <ocelle-pill-tag>Blocked</ocelle-pill-tag> after</p>`) and in an `align-items: baseline` flex row beside "Name", the surrounding text at the pill's font size: the bottom of the pill's first text line (a `Range` over the slotted text) equals the surrounding text's (within 0.5 px), the icon wrapper's block-start equals the `.label`'s (within 0.5 px; nothing inside the row moved), and the pill's height equals the pinned height of its density; twin: a long text that wraps, whose first text line is on the baseline of its own line; an icon-only pill (no text, its row `bare`) in the same paragraph and row, in both harnesses: its row's class `icon-row bare`; on the strict-CSP fixture only, where the real font loads, its box (`top` against the surrounding text, `height`, `width`) where T002 measured it (`reviews/phase-1/spikes.md`, written by hand); in process, whose token sheet has no `@font-face` rule so the text uses the machine's fallback font (`test/in-process.ts`), only font-independent facts, in the paragraph and the row and in each density: its top above the surrounding text's top; its width equal to 2 × the inline padding + 2 × the border + the icon's size + `space-2` (the icon's margin), within 0.5 px; the icon wrapper's top equal to the pill's top + the border + the block padding, within 0.5 px; and its height at least 2 × the block padding + 2 × the border + the icon's size (a lower bound only: the line box adds a descent that depends on the font), all from token values (operator decision on phase-4 round 2, O2-01: the pin held in the sandbox and failed on the CI runner's fallback font; the facts as amended by the operator's option A on phase-4 round 3, O3-01, which replaces O2-01's height and width equalities; T044a) | the pill's text rendered in a wrapper without the `label` class (the convention's rule no longer reaches it); `bare` set on every row; `bare` never set (the icon-only pill then hangs below the line); `.icon-row { align-items: baseline } .icon-slot { align-self: flex-start }` in the pill's own styles, placed after `iconSlotStyles` (the dropped override, both declarations together: the icon-only pill then hangs below the line, its top at −4.00 px, as with `bare` never set; the wrappers' block-starts stay equal, since the plant's own `.icon-slot { align-self: flex-start }` holds the icon wrapper at the row's start; each of the three plants (`bare` never set, `bare` set on every row, the dropped override) is killed in process as well as on the fixture (phase-4 round 3, O3-01), and each plant's killing assertion per harness is recorded by T044a in reviews/phase-4/plants.md: plan.md decision 15, reviews/phase-1/spikes.md § R-06, R-07 (the plants table) and § Notes for later phases, reviews/phase-4/notes.md, phase-4 review R1-03, corrected in phase 7 and in phase-7 review R1-01) |
| seven names on a static pill | for each of `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-controls`, `aria-current`, `aria-pressed`, `title`: set on an upgraded static pill, then changed: it stays on the host as set and as changed (the positive), no `data-ocelle-moved-*` mirror, no inner control, no custom state | the seven names handed to 012's `MovedAttributes.handle()` while static (moved and mirrored) |

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
| US4-7, target (amended by operator decision Q-P5-1 (a), `reviews/phase-5/operator-decisions.md`) | the target is the control's box, at least `target-small` (value from `expected.ts`) in each axis; on a one-character compact badge a click 1 px inside the midpoint of each edge delivers one `click` and one `ocelle-pill-tag-activate`; a click 1 px outside delivers none. The pill radius stays, so its rounded corners take no click (Chromium hit-tests the rounded shape); the earlier corner-click clause is dropped | `min-block-size` removed |
| FR-001 of 012, stretched host | a pill host stretched by a flex row (and a grid cell): the control's box equals the host's, and a click 1 px inside the host's edge delivers one `click` and one activate | the host not `inline-grid`; the static `.pill` sizing selected as `.pill` (reaching the control) |
| baseline (amended at the phase-1 recheck, Q2) | an interactive pill, button and link mode, enabled (its `.label` `overflow: hidden`, fitting) and disabled, with and without an icon, each variant and density: inline in a paragraph and in an `align-items: baseline` flex row beside "Name", the surrounding text at the pill's font size: the bottom of the pill's text line equals the surrounding text's (within 0.5 px) | the interactive render's text wrapper without the `label` class; `bare` set on every row |
| US4-8, same task | `interactive` removed and `aria-label="New"` set in one task, in both orders: `aria-label="New"` on the host, no mirror; then a later change of a written-back attribute stays on the host with no mirror | `release()` deferred to the update |
| US4-9, attribute order | `<ocelle-pill-tag title="x" aria-current="page" interactive>` and `… href="/x">` at upgrade (passthrough before the mode attribute), and the same set one by one after creation with the passthrough attribute first: moved, mirrored, `:state(current)` | the mode read from Lit properties; `capture()` not called |
| interactive click (twin of § US3 static click) | an interactive pill, button and link mode, inside `<a href>` and under an ancestor click listener: the click is guarded as 012 says, beside a static twin in the same places whose click reaches the ancestor with `defaultPrevented` false and runs the link's activation | the guard active while static (`guardHost`'s `active` true in static mode) |
| interactive focus (twin of § US3 static focus) | a click on an interactive pill inside a focusable ancestor (`tabindex="0"`) focuses its inner control (`focusPath` ends at the control), beside a static twin whose click focuses the ancestor | `delegatesFocus` set (the static twin then fails) |
| seven names, interactive (twin of § US3 seven names) | each of the seven names set on an upgraded interactive pill, button and link mode: moved to the inner control and mirrored as `data-ocelle-moved-<name>` (`aria-pressed` applied on the button only), beside a static twin on which it stays on the host with no mirror | the static guard in `attributeChangedCallback` removed |
| US4-10, focus and tooltip | a keyboard-focused truncated pill switched button → link and link → button: focus on the new control, ring shown, tooltip shown (read after the test delay); a pointer-focused twin: focus kept, no ring | the refocus in `updated()` (not queued) |

### US5 bodies

| Body | Assertion | Plant |
|---|---|---|
| trigger: width | the container narrowed until the text overflows, then widened: truncated and tooltip enabled, then not | the `ResizeObserver` removed |
| trigger: `characterData` | the host's Text node data edited (013's `text(id, value)` or 011's `textData`, as merged) so the text overflows, then fits | `characterData` or `subtree` false |
| trigger: nested `childList` | a nested element's text replaced so the text overflows | `childList` false |
| trigger: `slotchange` | a child's `slot` attribute changed so the default slot's text grows past the width (no `childList` record on the host) | the `slotchange` listener removed |
| trigger: `updated()` | `density` switched to `default` in a fixed-width container (the span's box held at its maximum): truncated; `disabled` removed on a long pill: truncated | re-measure in `updated()` removed |
| sub-pixel | the container at the fitting width minus 0.1 px: tooltip shown; at the fitting width: not shown | the measure by `scrollWidth > clientWidth` |
| flex row and grid track | a pill beside "Mission name" in a 200 px flex row and in a grid track narrower than the text: the pill shrinks to the room left and truncates. In the flex row the fixture sets the sibling rule explicitly (operator decision on PLAN-FRESH-2-003, (a)): a row with the sibling `flex: none` and a row with the pill `flex: 1 1 0` each keep the sibling at its natural size (its box equal to the same sibling's alone, one line); the twin row with neither pins the shared shrink: the pill truncates and the sibling is narrower than its natural width (two lines). The `flex: 1 1 0` route's cost pinned (PLAN-FRESH-3-004): a fitting "Blocked" pill with `flex: 1 1 0` in a 300 px row beside "Mission name": the control's inline size equals the room left (the row's inline size minus the sibling's natural width and the pill's inline margins, within 0.5 px), wider than the same pill's natural width, while with the sibling `flex: none` instead the control has its natural width | the `.icon-row`'s `max-inline-size: 100%` removed (the merged chain's row cap; the host's and the `.icon-row`'s own `min-inline-size: 0` are not written, operator decision Q-P6-1 (a): their plants survived every body, reviews/phase-6/notes.md) |
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
| click on a static pill inside a link or row | `pill-tag.ts` (§ US3 static click); its interactive twin `pill-tag-interactive.ts` (§ US4 interactive click) |
| `aria-pressed` on a link | `pill-tag-interactive.ts` (US4-10) |
| mode changes, focus at a switch | `pill-tag-interactive.ts` (US4-8 … US4-11, § US4) |
| ARIA states left on a static pill | `pill-tag.ts` (§ US3 seven names) and `readme.test.ts` (the rule); no story |
| static at upgrade with mirrors | `pill-tag-interactive.ts` (US4-12) |
| disabled interactive pill with long text | `pill-tag-truncation.ts` (US5-6) |
| forced colours | each element's scenario file; § US4 forced colours and forced colours, pressed |
| right-to-left | `pill-tag.ts`, `metric.ts`, `pill-tag-truncation.ts` (ellipsis at the inline end; the measure at the inline start) |
| long unbroken words; a one-word pill or metric in a flex row; a capped long word beside a sibling | `pill-tag.ts` (§ US3 bodies, US3-8), `metric.ts` (§ US2 bodies, US2-7) |
| a short static pill in a grid track or a stretching flex column | `pill-tag.ts` (§ US3 stretched host) |
| a one-line pill on the surrounding baseline | `pill-tag.ts` (§ US3 baseline), `pill-tag-interactive.ts` (§ US4 baseline) |
| `<details>` around a pulsing indicator | `status-indicator.ts` (§ US1 bodies) |

## Gates per phase

| Phase | Gates |
|---|---|
| every phase | typecheck, lint, style-lint, test-lint, unit-tests, manifest, csp, prefix, pins, signoff; plants with op 016's `--affected` mode against the phase's `base.sha` (phase 7: phase 2's `base.sha`, so the run covers the whole feature's diff), recorded in `reviews/phase-N/plants.md` (never the full plant set locally); mutation (one heavy job at a time) |
| phases adding tokens (US1, US3, US4; US2 adds none, 011's eyebrow tokens being on `main`, phase-1 recheck) | contrast, brand-rules (rule (f) for `motion-pulse` in US1) |
| phases adding stories (US1 … US5) | storybook-build, visual (baselines in 006's pinned container), axe |

Each phase-end task of tasks.md (T010, T023, T034, T044, T055, T062, T065) names the gates of its rows here.
