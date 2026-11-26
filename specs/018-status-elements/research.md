# Research: Status Elements (018)

Facts are as of `main` at `ce1d9c72` and the dependency branches read with `git show` on 2026-11-15:
`origin/claude/007-actions-status` (mission 012, `549409b`), `origin/claude/016-overlays` (mission 008, `9a44e8e`),
`origin/claude/008-layout-headers` (mission 011, `4e559b1`), `origin/claude/009-feedback-forms` (mission 010,
`94af87b`) and `origin/claude/041-plants-affected` (op 016). Implementation starts only after 012, 008 and op 016 are
on `main`; task T001 re-reads every fact marked **(recheck)** against `main` as it is then, and the phase-1 spikes
(T002) measure those that are behaviour rather than code.

**Phase-1 recheck** (T001, `reviews/phase-1/recheck.md`, read at `4f44aa1d`, the merge of `main` `4911fd0b` into this
branch): 012, 008, op 016, 011, 009 and 013 are merged. The operator's decisions on its four questions
(`reviews/phase-1/operator-decisions.md`) and its other facts are folded in below, each marked *phase-1 recheck*; the
list of changes is `reviews/phase-1/design-amendments.md`.

## R-01 Dependencies and the order they are taken in

**Decision**: the feature is implemented on a branch that has 012, 008 and op 016 merged from `main` (by
`/ocelle-land`'s merge, never during a run); every interface of theirs is used as merged. T001 (setup) records, for
each, the merge commit and any difference from what this plan reads; a difference that changes an interface this plan
relies on (012's `control.ts` exports, `ocelle-button`'s activate dispatch, `ocelle-tooltip`'s properties, op 016's
`--affected` command and `plants.md` format) stops the run and goes to the operator.

- 012 (**recheck**): `packages/elements/src/control.ts` exports `linkHref(href, base)`, `ControlState` and
  `controlState(disabled, unavailable)`, `mirrorOf(name)`, `class MovedAttributes(host, names, changed)` with
  `static observed(names)`, `handle(name, value)`, `connected()` and `get(name)`, `resolveIds(host, value)`,
  `guardHost(host, control, available)` and `controlStyles` (focus ring and forced-colours table). Custom states are
  toggled inline on `ElementInternals.states` (`ocelle-button.ts` 516-532 as merged; `pressed` in button mode only,
  525-526, 012 plan decision 32); the activate dispatch is inline (`ocelle-button.ts` 480-485). 012 raises the engine
  floor to Chromium 135 / WebKit 17.4. *Phase-1 recheck*: as planned, except the `pressed` state (R-07) and 012 plan
  decision 33's amendment of the slot convention (R-06).
- 008 (**recheck**): `packages/elements/src/ocelle-tooltip.ts`, entry `@ocelle/elements/ocelle-tooltip.js`;
  properties `text`, `placement` (`top`, default), `disabled`, `describes`; default slot for the trigger; part
  `bubble`; `:host { display: contents }`; tokens `tooltip-delay`, `tooltip-max-inline`, `drawer-inline`. It does not
  detect truncation: the consumer does (its contract, "#7 and #12").
- 011 (**recheck**; *phase-1 recheck*: on `main` at `bea31300` and merged into this branch, its four tokens in
  `source.ts` as below, so they are used as merged and phase 3 adds no token): not on `main` at `ce1d9c72`. Its R-12
  defines `font-size-eyebrow` (`var(--ocelle-font-size-xs)`),
  `font-weight-eyebrow` (`var(--ocelle-font-weight-strong)`), `tracking-eyebrow` (`0.08em`) and `color-eyebrow`
  (`var(--ocelle-color-ink-muted)` in both themes, text contrast on the main grounds, 9 rows per theme). R-10 covers
  both cases.
- Op 016 (**recheck**): `pnpm run gate:plants -- --affected <base>` (and `--list`), record
  `reviews/phase-<N>/plants.md` (`# Plants of phase N`, `- base:`, `- command:`, `- exit: 0`, the output block); the
  base equals the phase's `base.sha`; `--affected` is forbidden in CI.
- The test driver (**recheck**): 012 and 008 each extend `test/scenarios/driver.ts`, `test/in-process.ts`,
  `test/browser/driver.ts` and `test/commands.ts`, with the same method names and different signatures (012: `press(key,
  modifiers?)`, `click(id, options?: ClickOptions)`, `hover(id, options?)`, `events`/`takeEvents`, `reducedMotion(mode)`;
  008: `press(key, { shift? })`, `click(id, inner?, options?)`, `hover(id | null, inner?)`, `reducedMotion(on)`,
  `record`/`recorded`, `animations(id, inner?)`, `topLayer()`, `focusVisible(id, inner?)`), and 008's
  `AnimationRecord` has no iterations, end time, current time, identity or seek. T001 records the reconciled driver as
  merged (each method this plan uses, with its signature) and stops on a difference from R-11's list that changes what
  a scenario can express. *Phase-1 recheck*: `test/scenarios/driver.ts` as merged holds 005's, 012's, 009's, 008's,
  011's and 013's methods in one `Driver`. 012's `press(key, modifiers?)`, `click(id, options?: ClickOptions)` (with
  `inner`, `modifiers`, `button`, `position`), `hover(id, options?)` and `events`/`takeEvents` are as planned; 008's
  same-named methods are renamed `inputPress`, `inputClick`, `inputHover`, and its `animations(id, inner?)` is
  `ownAnimations(id, inner?)`; 008's `record`/`recorded`, `topLayer()`, `focusVisible(id, inner?)` and `focusPath()`
  are as planned; both `reducedMotion` forms are 013's `reducedMotion(mode: ReducedMotion)`. Also there: 013's
  `animations(id): Running[]` (kind, part, property, playState, endTime, currentTime of the host and every shadow
  element), `frames(n)`, `layout(id)`, `text(id, value)`; 009's `clickAt(target, point)`, `focusTarget`, `settle()`;
  011's `textData(id, index, data)`, `size`, `move`. The scenarios use these names.

Per-phase plant runs are always "the affected plants" in op 016's mode; this feature never runs the full plant set
locally. The first task of implementation (T001) rechecks the task list against op 016 as merged (its command, its
`--list` output for a phase's diff and its record format) before any phase starts.

**Alternatives**: building phases 2 to 4 (no dependency) before 012 and 008 land: rejected by the operator's wave plan
(design now, implement after both land).

## R-02 One status vocabulary module

**Decision**: a new internal module `packages/elements/src/status.ts` exports `statuses` (the five values, in the
order `info`, `success`, `warning`, `danger`, `neutral`), `type Status`, and `statusOf(value: string | null |
undefined): Status`, which returns the value when it is one of the five and `"neutral"` otherwise. The indicator's
`tone` and the pill's `status` are attribute-backed accessors rather than Lit-reflected fields: the setter writes the
attribute as given and the getter returns `statusOf(attribute)`, so the two stay in step without Lit ever writing the
parsed value back (FR-002: an unknown value stays in the attribute as written, the property reads `"neutral"`). The
same pattern serves `variant`, `density` and `layout`. The element renders the parsed value as a class on its inner box (`class="… status-${statusOf(…)}"`),
so CSS never sees an unknown value; host attribute selectors and custom states are not used for it (FR-031 allows the
pill no other custom state).

**Rationale**: one definition for the two elements, a pure function that mutation testing covers fully, and no CSS
branch for an unknown value. #9's notice keeps its own `info` default (FR-002).

**Alternatives**: selecting on `:host([tone="..."])` with a `neutral` fallback rule (an unknown value would need a
`:not()` list in CSS, and an unknown value matches nothing, which is easy to get wrong); importing #9's tone module
(not on `main`, and its default differs).

## R-03 `ocelle-status-indicator`: dot, ring and accessibility

**Decision**: shadow root `<span part="dot" class="dot status-…"><span part="ring" class="ring"></span></span>`
(the ring rendered only while `pulse` is set). The dot is `inline-size` and `block-size` `var(--ocelle-size-indicator)`
(new token, 0.5rem = 8 px, R-10). Radius literals such as `50%` are forbidden, so the dot uses
`--ocelle-radius-pill`, which on a square box draws a circle. This is a
state mark, so it is a state pill's use under constitution II (Terms, "State pill", by the same reading as SPEC-1-04;
**plan decision 3**, confirmed by the operator at the tasks gate, analysis finding I1, and now written into the spec's
Terms and FR-003, the pulse ring of R-04 included). Fill `background: var(--ocelle-color-<status>)`, no opacity, no transform on
the dot ever. Accessibility through `ElementInternals` and 005's `expose(internals, name, drawable)` from `naming.ts`:
with a trimmed non-empty `label`, role `img` with that name; otherwise `ariaHidden = "true"`. The name comes from
`label` alone: the element calls `expose(internals, label.trim() || undefined, true)`, does not observe `aria-label`
and never passes a host `aria-label` to 005's `accessibleName` (**plan decision 4**, operator decision on
PLAN-CORRECTNESS-1-005, (b)). A host `aria-label` on the indicator is unsupported: the README says so and that `label`
is the one way to name it. Chromium names an element from its own `aria-label` attribute whatever its internals set,
so what Chromium then exposes for `aria-label` with and without `label`, present and blank, is measured by the
phase-1 spike T002 on a stand-in (a custom element whose `ElementInternals` sets role `img` and, or not, a name, with
a host `aria-label` present and blank), recorded in `reviews/phase-1/spikes.md`, and pinned by US1-8 with that value
written by hand (the element neither reads nor changes it; analysis finding U1).

Forced colours: `@media (forced-colors: active) { .dot { background: CanvasText; } .ring { border-color: CanvasText;
} }` with `forced-color-adjust: none` on the dot so the system colour is the one drawn.

**Rationale**: `expose` already gives exactly the two accessibility shapes FR-014 asks for and is mutation-tested.

## R-04 The pulse: CSS only, four start cases

**Decision**: the ring is a separate span, absolutely placed over the dot (`position: relative` on the dot, `position:
absolute; inset: 0` on the ring), with `border: var(--ocelle-border-width) solid currentColor`, `border-radius:
var(--ocelle-radius-pill)` and `color: var(--ocelle-color-<status>)`. Its animation is written as longhands, with no
delay (the token-only lint rejects a `0s` literal, `gates/stylelint/token-only.ts` 57-69): `animation-name:
ocelle-pulse; animation-duration: var(--ocelle-motion-pulse); animation-timing-function:
var(--ocelle-easing-standard); animation-iteration-count: 3`; direction and fill mode
stay at their initial values (`normal`, `none`, as 012's spinner). The ring grows through `inset`, not `scale` (the lint
lets `scale` take only -1 or 1 and rejects `transform: scale()`, token-only.ts 134-143, 197-205): the keyframes go
`from { inset: 0; opacity: 1; }` `to { inset: calc(var(--ocelle-size-indicator) * -0.5); opacity: 0; }`, so the ring
grows from the dot's 8 px to 16 px and fades out, from an existing token and no new one. The ring is out of flow, so
the growing `inset` moves nothing around it and never changes the dot's box. At rest (before and after the run) the
ring has `opacity: 0`, so after the run only the solid dot is seen. `@media (prefers-reduced-motion: reduce) { .ring {
animation: none; } }`. New token (motion group): `motion-pulse` 1600ms; the count is the literal `3` (3 × 1.6 s =
4.8 s ≤ 5 s, FR-012; the same margin as 012's spinner, 6 × 800 ms). *Phase-1 recheck* (operator decision Q1 (a)): the
planned `motion-pulse-count` token is dropped, since the generator's `validateSource()` (`generate.ts` 180-183) refuses
a motion value that is not a literal `<number>ms` duration, an angle or an easing function, and brand rule (f)
reports one (`brand-rules.ts` 206-217, "fail closed"); 013's `gate:style-lint` lets `animation-iteration-count` take a
bare positive integer (`gates/stylelint/token-only.ts` 18-19). `gate:style-lint` on the phase's source is the check that
every declaration here passes.

The four start cases of FR-012, as amended after squad round 1 (operator decisions on PLAN-CORRECTNESS-1-013 (a) and
PLAN-CORRECTNESS-1-014 (b)) and squad round 2 (PLAN-FRESH-2-001 (b)), are what CSS animations do natively, with no
script:
- (a) `pulse` absent → present as a rendered change: the ring element is created, so its animation starts; removing
  `pulse` removes the ring and so the animation. A removal and re-addition within one task coalesce into one Lit
  update with `pulse` still true, so the ring node is kept and no run starts; FR-012 (a) counts only rendered changes,
  the README says changes within one task coalesce, and a scenario pins the no-restart case.
- (b) connection: an element inserted into a document gets a fresh style, and CSS animations start; there is no state
  across a disconnection. A state-preserving move (`moveBefore()`, in the Chromium floor of R-14) keeps the running
  animation and is not a start case (FR-012 (b) as amended); the T002 spike measures it and a scenario pins what it
  shows (the run under way continues, the same animation object, its current time not reset).
- (c) `reduce` → no preference: `animation-name` changes from `none` to `ocelle-pulse`, which starts a new animation;
  the reverse change cancels the running one at once (FR-013).
- (d) not rendered → rendered (an ancestor's `display: none`, the `hidden` attribute in its hidden state): an element
  without a box has its CSS animations cancelled and gets new ones when it is rendered again (squad round 2's probe5 on
  Chromium 153: `hidden` on the parent cancels the run, and on reveal a new one starts). A `<details>` is not a start
  case (FR-012 (d) as amended, operator decision on PLAN-FRESH-2-001, (b)): Chromium hides closed content through its
  slot (`content-visibility: hidden`), which keeps the animation. The round's probe1 measured it: after `open = false`
  the same `Animation` is still `running` (current time 500 → 800 ms over 300 ms), after 5 s closed it has ended, and
  after `open = true` `getAnimations()` is empty, so no run starts; a `<details>` closed for less than one run lets the
  run go on and shows its remainder on opening. Detecting the opening would need an `IntersectionObserver` and script
  state per pulsing indicator (the only signal on close and open, probe2), which the pulse does not have; so the pulse
  stays CSS-only and the README states that opening a `<details>` starts no run. The T002 spike re-measures (d) for
  `hidden` and an ancestor's `display: none`, and the `<details>` behaviour (closed for less and for more than one run,
  and an indicator connected or given `pulse` inside a closed `<details>`) on the merged Chromium, and the scenarios pin
  what it shows (**recheck**). `hidden="until-found"` hides with `content-visibility` too and is not a start case
  either; the spike measures it and a scenario pins what it shows.
- No other change restarts the animation: changing `tone` changes only `color`/`background` on the ring and dot, never
  an `animation-*` longhand; theme, size, position, `visibility`, opacity, scrolling and a `<details>` closed and
  opened do not cancel CSS animations.
  This is proven on the running animation, not on computed longhands (contracts/checks.md § US1-4): for each change
  FR-012 lists, the scenario seeks the run, applies the change and reads back the same animation (its stable identity
  in the driver) at a current time at or after the seek, beside a positive twin in which `pulse` is removed and set
  again in separate tasks and a new animation runs from near 0. Plant: the ring re-created on every render.

**Rationale**: no timers, no `animationend` listener and no JS state, so no Timeout mutants (op 015) and nothing to
keep across a disconnection. The rule (f) of 002 as generalised by 012 (**recheck**) sets every motion *duration* to
0ms under reduced motion: `motion-pulse` is a duration and joins it. (The earlier reading here, that a unitless
`motion-pulse-count` would pass the validator and be skipped by rule (f), was wrong as merged: both refuse it, so the
count is the literal 3, phase-1 recheck Q1.) The `tooltip-delay` exemption as merged (`delay: true` on a `-delay`
motion token) changes nothing here. The element's own `animation: none` under reduced
motion does not rely on the 0ms duration, and the tests prove that: with the element's rule removed, three 0 ms
iterations would end at once at opacity 0 and look the same, so the US1-5 body that catches it runs under `reduce`
with a host rule restoring `--ocelle-motion-pulse: 1600ms` and asserts no animation on the ring, beside its twin under
no preference with the same host rule, which shows one run. Plant: the element's `animation: none` rule removed.

**Tests**: through the driver's animation record (R-11): existence, `iterations` (3, written by hand from the
literal) and `endTime` (≤ 5000), a stable
identity per animation, and frames sampled by seeking the animation and reading the dot's computed `opacity` and box
(dot unchanged, ring box changing). Reduced motion and forced colours through the harness's media emulation, reset
after each test (frontend findings).

**Alternatives**: a JS timer that removes the ring after 5 s (state, timers, Timeout mutants, and (b) to (d) by hand);
an `IntersectionObserver` on the ring that re-creates it when a `<details>` opens (option (a) of PLAN-FRESH-2-001, not
chosen: script state and an observer on every pulsing indicator, and a `checkVisibility()` test so that scrolling back
into view does not count);
animating the dot's opacity (the #498 defect); a new ring-extent token (not needed: the extent is half the dot's size
token); keying the ring on a counter so a same-task toggle restarts (rejected by the operator, PLAN-CORRECTNESS-1-014
(b)).

## R-05 `ocelle-metric`: one term and its definition

**Decision**: shadow root `<dl class="metric layout-…"><div class="pair"><dt part="label"><span class="eyebrow"
aria-hidden="true">${label}</span><span class="written">${label}</span></dt><dd part="value">${displayValue}</dd></div>
</dl>`, text bound as Lit text (never `unsafeHTML`). Chromium exposes `dt` as role `term` and `dd` as `definition`, in
DOM order, in both layouts (the row layout is CSS only). Chromium builds the accessibility tree from the transformed
text, so a `text-transform: uppercase` label is exposed upper-cased (011 research.md 80-81 recorded it; the squad's
probe of a shadow-root `dt` agrees). The label is therefore drawn twice in the `dt` (operator decision on
PLAN-A11Y-SECURITY-1-001, (a)): the eyebrow's `font-size: var(--ocelle-font-size-eyebrow)`, `font-weight:
var(--ocelle-font-weight-eyebrow)` and `letter-spacing: var(--ocelle-tracking-eyebrow)` are set on the `dt`, so the
term's line box is the eyebrow's and not the body's strut, and the visible `.eyebrow` span, `aria-hidden`, inherits them
and carries `text-transform: uppercase` and `color: var(--ocelle-color-eyebrow)` (amended in phase 7 to match the
element, phase-3 review R1-03: the five declarations were first all on the `.eyebrow` span); the `.written` span holds
the label as written, untransformed, and is hidden visually with token-only CSS (`position: absolute; inline-size: 0; block-size: 0;
overflow: hidden; white-space: nowrap`, every value a keyword or 0; the `dt` is `position: relative`), so the term's
name is the written text. A T002 probe confirms on Chromium's tree that the term is named by the written text and the
copy adds no other node (**recheck**); if the zero-size copy is pruned from the tree, the phase-3 tasks use the
smallest token-only hiding the probe shows to be kept, and the operator is told. Value: `font-variant-numeric:
var(--ocelle-figures)`, in Schibsted Grotesk set by the element itself (`.metric { font-family:
var(--ocelle-font-sans) }`), so the family holds with no base styles on the page (FR-023; amended in phase 7 to match
the element, phase-3 review R1-02: the family was first inherited from the base styles). `stack`: block flow; `row`: the
rule is on the pair, `.layout-row .pair { display: flex; flex-wrap: wrap; align-items: baseline; column-gap:
var(--ocelle-space-2); }` (the `dl`'s only child is the pair, so a flex `dl` would leave `dt` and `dd` stacked).
Empty value: `dd { min-block-size: 1lh; }` (the one `lh` use 005's lint allows). `overflow-wrap: break-word` on both
(operator decision on PLAN-FRESH-2-002, (a)), which breaks a word only where it would overflow and, unlike `anywhere`,
does not lower the min-content size: so a metric in a host's flex row is not shrunk below its longest word and a
one-word label or value stays on one line (US2-7), while a long unbroken value in a block container still breaks inside
the box. In `row` the `dt` and `dd` are flex items of the pair, whose automatic minimum would be that word, so
`.layout-row .pair > * { min-inline-size: 0; }` lets a long value shrink to the pair and break; this does not lower the
metric's own min-content (the squad's probe on Chromium 153, a 100 px block and a 220 px flex row: without the rule a
long row value overflows, with it the value breaks over three lines and a one-word metric in the flex row stays 39 px
wide on one line, against 29 px and two lines with `anywhere`). A host that wants a metric to shrink further in a flex
row sets `min-inline-size: 0` on it (README).

Find in page (squad round 2, PLAN-FRESH-2-006): the written copy is text in the document, so the browser's find bar
matches a metric's label twice, the visible uppercase span (find is case-insensitive) and the zero-size copy, whose
highlight cannot be seen (the round's probe4: `window.find('Open missions')` matches twice in one metric). This is a
known limitation, recorded here and in the README and pinned by a scenario in `scenarios/metric.ts` (two matches per
label, the second inside the `.written` span). The T002 probe of the term's name also tries the token-only hidings it
can find for one that find-in-page skips while the term keeps the written name and no other node is added; if one is
found, phase 3 adopts it, the scenario pins one match instead, and the operator is told.

**Rationale**: a `dl` with one group is the plainest markup that gives the term/definition pair FR-024 asks for; the
hidden copy keeps 011's eyebrow look and FR-022's written name together.

**Alternatives**: `role="group"` with two spans (no term/definition semantics); a light-DOM render (005's conventions
use shadow DOM); `font-variant-caps: all-small-caps` (keeps the written text but changes 011's eyebrow look);
accepting the upper-cased name (an amendment of US2-2 and FR-022). The last two were options (b) and (c) of
PLAN-A11Y-SECURITY-1-001, not chosen.

## R-06 `ocelle-pill-tag`, static: box, densities and variants

**Decision** (revised after squad round 2, operator decision on PLAN-FRESH-2-002, (a)): a static pill's host is
`display: inline-block; max-inline-size: 100%`, its `.pill` span `display: block`, the `.icon-row` capped at
`max-inline-size: 100%` and the text span at `min-inline-size: 0`, with `overflow-wrap: break-word` on the text. No
`min-inline-size: 0` is set on the static host or the `.pill`: a flex row's automatic minimum for the pill is then its
longest word, so a one-word pill such as "Blocked" beside a long name keeps its word on one line (US3-8), while in a
block container or a grid track the capped row lets a long unbroken word break inside the pill (Edge Cases). The
interactive pill's `display: inline-grid` lives in the interactive host sheet (R-07); it truncates through the same
merged rules (the text span's `min-inline-size: 0`, the row's cap, and the control's `--ocelle-target-small` minimum,
FR-043), with no `min-inline-size: 0` on the host, the control or the `.icon-row` (R-07, operator decision Q-P6-1
(a)). Squad round 2's probes on Chromium 153 (14 px text,
4/12 padding): in a 220 px flex row beside "Refactor the mission scheduler pipeline", the round-1 box (the chain in
every mode and `anywhere`) gave a 45 to 50 px host with "Blocked" over three or four lines; this box gives 76 px and one
line. A 34-letter word in a 100 px block container or grid track breaks inside the pill over three lines; the same box
with an `inline-grid` host, or without the row cap, keeps the word on one line and overflows the pill (a grid item's
and an `inline-flex` row's automatic minimum is the word), which is why the static host is not a grid. In a 150 px
flex row the long word sets the pill's minimum up to the row's full inline size (the host's `max-inline-size: 100%`)
and breaks there; the cap is the whole row's inline size, not the room a sibling leaves, so with "Name" before it in
the 150 px row the 150 px pill's right edge is at 192.7 px and the row overflows by the sibling's width (squad round 3,
PLAN-FRESH-3-005), which the Edge Cases state and US3-8's body pins beside a `min-inline-size: 0` twin that fits. A
static pill in a flex row that stretches its items keeps its own block size inside the stretched host. A host that
wants the round-1 shrinking sets `min-inline-size: 0` on the pill, and the word then breaks inside the pill (README,
US3-8).

Stretched hosts (squad round 3, PLAN-FRESH-3-002): a grid item and a stretched flex item are blockified and stretched,
and a block `.pill` fills its host, so "Blocked" in a 200 px grid track or a 200 px column flex was a 200.0 × 26.1 px bar
with its text ending at 62.8 px. The static `.pill` therefore also has `inline-size: fit-content; max-inline-size: 100%;
box-sizing: border-box`, selected as `.pill:not(.control)` so it never reaches the interactive control, whose stretch
012's FR-001 requires (R-07). Probed on Chromium 153: "Blocked" is 75.8 px in the grid track and the column, as in a
block container; the 34-letter word still breaks inside a 100 px pill in a block container and a grid track (100.0 ×
58.3 px); the 220 px flex row is unchanged (75.8 px, one line). Without `box-sizing: border-box` the capped pill is
126 px in a 100 px track (176 px in the 150 px row beside "Name"), sticking out of its host and container, so it is
needed; the long-word twins of US3-8 catch its removal by asserting the `.pill` box inside the host and the container
(squad round 3, verify 1).

Baseline (squad round 3, operator decision on PLAN-FRESH-3-001, (a); the means amended at the phase-1 recheck,
operator decision Q2 (a), see "As amended" below; the paragraph up to there is the round-3 record): 005's
`iconSlotStyles` sets `.icon-row {
align-items: flex-start }`, so no item takes part in baseline alignment and the row's baseline is synthesized from its
first item, the empty or SVG-holding 1lh `.icon-slot`, at its bottom edge (CSS Flexbox § 8.5): with 005's alignment the
pill's text sat 3.1 px above the surrounding text (probe p5, 14 px text: 21.0 against 24.1 px in a paragraph, 61.1
against 64.2 with an icon, 189.6 against 192.7 in an `align-items: baseline` flex row; probe p6, the interactive box of
R-07: 25.0 against 28.0). The pill's own static styles, which apply in every mode, therefore override the row as
`.icon-row { align-items: baseline } .icon-slot { align-self: flex-start }`: the text item gives the row its baseline
while the 1lh icon slot stays at the start, centred on the first line as 005 requires, and the pill's height does not
change. Probed with the override: 21.0 / 21.0, 61.1 / 61.1, 189.6 / 189.6, and 25.0 / 25.0 in the interactive box. A
one-line pill, static or interactive, inline in text or in a baseline-aligned flex row, thus sits on the surrounding
baseline. A pill that wraps is at its `max-inline-size: 100%` and so on a line of its own; its first text line is on
that line's baseline (the inline-block's one line box holds the `.icon-row`, whose baseline is the text's first line).
The § US3 and § US4 baseline bodies measure it (contracts/checks.md). `ocelle-button` uses the same row and very likely
has the same offset; this plan does not change it, and the orchestrator files a note to mission 012 or 005 (plan
decision 15).

As amended at the phase-1 recheck (operator decision Q2 (a); plan decision 15): 012 found the same offset on
`ocelle-button` and changed the slot convention as merged (012 plan decision 33, amended at its round 6;
`icon-slot.ts` 1-31, README § Slot convention). The label wrapper `<span class="label">` around the default slot and the
`bare` modifier on a row with no label are part of the convention, and `iconSlotStyles` holds `.icon-row:not(.bare) >
.label { align-self: baseline; }`, so a labelled row's baseline, and its host's, is the label's first line while no
position inside the row moves (012 measured 0 px of movement). 012 measured `.icon-row { align-items: baseline }`, this
plan's override, and rejected it because it moves the items inside the row. So the pill drops the override and follows
the convention as merged: its text is in `.label` (the text span this research calls "the text span" from here on), and
its `.icon-row` carries `bare` while the pill has no text. Whether it has text is read as `ocelle-button` reads it
(`ocelle-button.ts` 412-438: non-whitespace text in the default slot's flattened assignment, re-read on the slot's
`slotchange` and by a `MutationObserver` with `characterData`, `childList` and `subtree` on the host, observed from the
constructor for the element's lifetime and held weakly, so it needs no disconnection), in every mode; this observer is
separate from R-09's truncation observers and their lifecycle. The probes above (p5, p6) were taken with the override,
not with the convention's rule, so the T002 spike measures the pill box on the convention as merged before the bodies
are written: static and interactive (the enabled `.label` with `overflow: hidden`, R-09) and disabled, with and without
an icon, inline in a paragraph and in an `align-items: baseline` flex row, and an icon-only `bare` pill's position; a
labelled case off the baseline by more than 0.5 px stops the phase (stop-and-ask). The § US3 and § US4 baseline bodies
stay; their plants are in the pill's source (the text wrapper rendered without the `label` class; `bare` set on every
row), and an icon-only pill's position is pinned as T002 measured it (plant: `bare` never set). The note to 012 or 005
is moot.

Shadow root (static mode, as amended at the phase-1 recheck):

```html
<span part="pill" class="pill status-… variant-… density-…">
  <span class="icon-row [bare]"><span class="icon-slot"><slot name="icon"></slot></span><span class="label"><slot></slot></span></span>
</span>
```

with `iconSlotStyles` (005, as amended by 012 decision 33); `bare` only while the pill has no text. The `.pill` box carries the density padding, the colours, the border and the radius; the
`.icon-row` is nested inside it, so the slot convention's `padding-block` (`calc((var(--ocelle-icon-size) - 1lh) / 2)`,
`icon-slot.ts`) is on a different box from the density padding and the two never compete. `--ocelle-icon-size: 1lh`
is set on `.pill` (the convention's one resizing route), so the row's block padding is 0, the 1lh-tall `.icon-slot`
holds an icon one line tall, and a pill with and without an icon has the same height; the scenarios pin each
density's height from the token values. The `.icon-row` has `max-inline-size: 100%` and the text span
`min-inline-size: 0` so the text can wrap inside a capped pill (static); in interactive modes the same two rules let
the text truncate, and the interactive host sheet adds no `min-inline-size: 0` on the `.icon-row` (R-07, R-09;
operator decision Q-P6-1 (a): its plant survived every body, reviews/phase-6/notes.md). Sizes, all tokens:

| | default | compact |
|---|---|---|
| font size | `--ocelle-font-size-sm` | `--ocelle-font-size-xs` |
| line height | `--ocelle-line-height-tight` | `--ocelle-line-height-snug` (new, 1.2) |
| block padding | `--ocelle-space-1` | `--ocelle-space-1` (static: exactly; interactive: at least, R-07) |
| inline padding | `--ocelle-space-3` | `--ocelle-space-2` |

`pill` variant: `background: var(--ocelle-color-<status>-bg); color: var(--ocelle-color-<status>)`; `badge`:
`background: transparent; border-color: var(--ocelle-color-<status>); font-variant-numeric: var(--ocelle-figures)`.
Both: `border: var(--ocelle-border-width) solid transparent` (the static pill's border is transparent outside forced
colours, which forced colours turns into a visible system-colour border, FR-028), `border-radius:
var(--ocelle-radius-pill)`. Text: `white-space: normal; overflow-wrap: break-word` (wraps, never truncates, FR-027).

A static pill is inert content: its click guard is inactive (R-07), its shadow root has no `delegatesFocus` (R-07) and
it has no inner control, so a click on it reaches its ancestors as a click on its text would (an enclosing `<a href>`
navigates, a row's listener sees it with `defaultPrevented` false, a focusable ancestor takes focus), and
`pill.click()` dispatches a native click at the host.

Contrast (FR-028, SC-003): `color-<status>` is declared `kind: "text"` on `[...main, "color-<status>-bg"]` on `main`
already (`source.ts` 104-116), so the pill's text on its ground, the badge's text and border on the main grounds and
the dot on the main grounds (non-text 3:1 is weaker than the text 4.5:1 already checked) are all in the contrast gate
today: **no new contrast rows** for the status vocabulary. A badge or indicator placed on a state ground (inside a
notice) is outside the checked set; the README says so.

**Rationale**: every value a token (the keywords, `0` and `100%`; `fit-content` and `border-box` are keywords, which
`token-only.ts` passes); forced colours handled by the transparent-border idiom; no new contrast surface; one structure
(`.pill` > `.icon-row`) in every mode, with the host's display and minimum set per mode.

**Alternatives**: keeping the round-1 box and telling hosts to give a static pill `flex: none` in a flex row (option
(b) of PLAN-FRESH-2-002, not chosen); `break-word` with the round-1 `inline-grid` host (a long word overflows the pill
in a block container, see the probes above); keeping 005's row alignment and recording the 3 px baseline offset as a
known limitation (option (b) of PLAN-FRESH-3-001, not chosen).

## R-07 `ocelle-pill-tag`, interactive: 012's conventions reused

**Decision**: in button and link mode the visual box *is* the inner control: `<button type="button" part="pill
control" class="control pill status-… variant-… density-…">` or `<a part="pill control" href=… class="control pill
…">`, holding the same nested `.icon-row` as R-06, wrapped in `<ocelle-tooltip>` (R-09). The `control` class is what
every `controlStyles` rule selects (012 `control.ts` 157-194), so the token focus ring, the link without underline and
the forced-colours table apply. The inner control is the host's one stretched grid item (the interactive host
sheet's `display: inline-grid`, as `ocelle-button.ts` 134), so it fills the host in both axes and a host stretched by a
flex row or a grid cell has no area outside it (012 FR-001, adopted by FR-030); the tooltip host between them is `display: contents`, so
the control is the grid item. The static `.pill:not(.control)` sizing of R-06 (`inline-size: fit-content`) does not
match the control, so the control still fills a stretched host; the slot convention's label rule (R-06, as amended
at the phase-1 recheck) applies in every mode, so a one-line interactive pill sits on the surrounding baseline (probe
p6 measured the earlier override: 25.0 / 25.0 px; T002 re-measures on the convention as merged); the § US4 baseline
body measures an enabled pill, whose `.label` has `overflow: hidden` for truncation, and a disabled one.

Reused from 012's `control.ts` as merged: `linkHref` decides the mode (FR-002 of 012), `controlState(disabled, false)`
(the pill has no unavailable state), `MovedAttributes` for `aria-label`, `aria-labelledby`, `aria-describedby`,
`aria-controls`, `aria-current`, `aria-pressed` and `title` (FR-030; R-08 for the mode changes), `resolveIds` for the
three ID-reference attributes (element reflection), `guardHost` registered in the constructor with the additive
`active` predicate of R-08 set to "the pill is interactive", so the guard returns at once while the pill is static
(a static pill swallows no click, R-06) and acts as on `ocelle-button` while it is interactive, and `controlStyles`.

Focus: the shadow root is attached **without** `delegatesFocus` (a class-wide option fixed at `attachShadow`, which
would make a click on a static pill drop focus to the body instead of a focusable ancestor). `focus(options)` forwards
to the inner control in interactive modes and does nothing while static (the host is not focusable); a click on an
interactive pill lands on the inner control, whose box is the host's, so it focuses the control natively. `click()`
forwards to the inner control in interactive modes, as in `ocelle-button`, and is the native `HTMLElement.click()`
while static.

The activate dispatch copies `ocelle-button`'s inline pattern (listener on the inner control: return if not available
or, in link mode, if a modifier key is held; dispatch `ocelle-pill-tag-activate` `{ bubbles, composed, cancelable,
detail: {} }`; if cancelled, `event.preventDefault()`), so its order relative to bubble-phase listeners is the same
(FR-031). `aria-pressed`: the held value is applied to the button as written (012 FR-004, "any other value is applied
as written"), in button mode only; no value filter. Custom states: `pressed` iff button mode and the applied value is
`"true"`; `current` iff the applied `aria-current` is present and not `false`.

The `aria-pressed` rule on a link (operator decision on PLAN-CORRECTNESS-1-007, (a)): in link mode the pill holds and
mirrors `aria-pressed` but applies none and exposes no `:state(pressed)`. When this was planned, `ocelle-button` set
`:state(pressed)` from the held value with no mode check. *Phase-1 recheck*: as merged on `main` it sets `pressed` in
button mode only (`ocelle-button.ts` 525-526, 012 plan decision 32, a finding routed from this mission), so the two now
match and **plan decision 12**'s triage note to mission 012 is moot; nothing changes for this feature.

Target size (FR-029, FR-032, FR-043): `min-block-size` and `min-inline-size` `var(--ocelle-target-small)` on the
inner control in both densities, with `display: inline-flex; align-items: center; justify-content: center`, so a
compact pill grows to 24 px by spreading its padding (padding stays `space-1` at least). New token `target-small`
1.5rem (size group): 012 adds no 24 px target token (its compact button reaches 24 px through padding) (**recheck**).
The clickable area is the control's box, which fills the host; the scenarios measure it by clicks (contracts/checks.md
§ US4-7).

Looks (**plan decision 6**, with the operator decisions on PLAN-A11Y-SECURITY-1-005 (a) and PLAN-A11Y-SECURITY-1-006
(a)). No state changes `border-width` or padding, so the box, and the truncation state of R-09, are the same at rest,
hover, active and pressed; the wider cue is an inset `box-shadow: inset 0 0 0 var(--ocelle-bar-width)
var(--ocelle-color-<status>)` drawn inside the border, from tokens:
- rest: a `pill`-variant interactive pill has a resting border `var(--ocelle-color-accent-strong)` at
  `--ocelle-border-width` on its status ground (002's rule for a control on a state ground, spec 521-526; the pair is
  declared non-text on every state ground, `source.ts` 66-72), so it is recognisable as a control and unlike a static
  pill; a `badge` keeps its status-colour border on the page ground;
- hover: a pill's border takes `--ocelle-color-<status>`; a badge fills with `--ocelle-color-<status>-bg` (its text
  in `--ocelle-color-<status>` on that ground, a checked pair);
- active (pointer down): the hover look plus the inset bar-width cue;
- pressed (`:state(pressed)`): the inset bar-width cue permanently, and on a badge the `--ocelle-color-<status>-bg`
  fill too; the scenarios pin equal boxes pressed and unpressed, and the `Pressed` story shows pill and badge;
- pressed in forced colours: forced colours set `box-shadow` to `none` and replace the status fill with a system
  colour, and 012's `controlStyles` table has no pressed rule (`control.ts` 157-194: hover, active, focus and disabled
  only), so without a rule of its own a pressed pill or badge would look exactly like an unpressed one there
  (constitution III). The pill adds `@media (forced-colors: active) { :host(:state(pressed):not([disabled])) .control
  { background-color: Highlight; color: HighlightText; border-color: Highlight; } }`, the system pair for a selected
  item, which the user's theme keeps in contrast. It changes colours only, so the box stays the same; the slotted icon
  follows through `currentColor`; the focus ring (`Highlight`, outside the control at `--ocelle-focus-offset`) stays
  apart from the fill by the offset gap; hover and active keep 012's `Highlight` border; a disabled pressed pill keeps
  the `GrayText` look of § Disabled (the `:not([disabled])`, matching "no inset cue" when disabled). System colour
  keywords are what `ocelle-button`'s own forced-colours rule already uses (`ocelle-button.ts` 301-304), so
  gate:style-lint takes them as it takes that rule. Author system colours are kept under forced colours as 012's
  `Highlight` hover border is; a T002 probe confirms it for `background-color` in Chromium's forced-colours emulation,
  and if the fill is forced to the canvas colour the rule adds `forced-color-adjust: none` on the pressed control
  (every colour it then shows is a system colour, so the user's theme still decides them);
- link mode adds no underline (a pill is a state mark; its role is announced).
Every colour pair above is one the contrast gate already checks (`color-<status>` text on its ground and the main
grounds, `color-accent-strong` non-text on the state grounds), so no contrast row is added.

Disabled (**plan decision 7**, settled at the plan gate): `:host([disabled]) .control` (a static pill has no
`.control`, so `disabled` has no effect on it) sets text and border `--ocelle-color-disabled-ink` on
`--ocelle-color-disabled-bg`, no inset cue, whatever the status and variant, as `ocelle-button` does
(`ocelle-button.ts` 274-277). `color-disabled-ink` on `color-disabled-bg` is a declared pair on `main` and after 012,
`exempt: true` (012 `source.ts` 126-129; inactive components are exempt from 1.4.3 and 1.4.11), so nothing stops the
phase. The visible change from an enabled neutral pill is the border (accent-strong to disabled-ink) as well as the
text colour; a scenario compares the computed border colour and ground of an enabled and a disabled neutral pill in
both modes. Forced colours: the pill copies `ocelle-button`'s `@media (forced-colors: active) { :host([disabled])
.control { color: GrayText; border-color: GrayText; } }` (`ocelle-button.ts` 301-304), because `controlStyles`'
`.control:disabled` never matches a disabled link-mode `<a>`; scenarios assert the computed system colours of a
disabled pill in both modes and of the focus ring on both controls.

Focus-ring clearance (**plan decision 11**, operator decision on PLAN-A11Y-SECURITY-1-007, (a)): 012's ring is an
outline outside the control at `--ocelle-focus-offset` + `--ocelle-focus-width` (5 px), and a truncating pill fills its
container, so a clipping container would cut it. In interactive modes the host is capped at `max-inline-size:
calc(100% - 2 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)))` and offset by `margin-inline:
calc(var(--ocelle-focus-offset) + var(--ocelle-focus-width))`, so the ring lies inside the container at both inline
ends (the cap alone would leave the inline-start ring outside it). The margin is outside the host's box, so it is no
area of the host the guard could swallow. Host selectors cannot see the derived mode (`href=""` or a non-link URL is
static), and the pill sets no host attribute or custom state for it (FR-031), so these two host rules live in one
constructable stylesheet that the pill adds to `shadowRoot.adoptedStyleSheets` on entry to an interactive mode and
removes on → static (adopted stylesheets, CSP-safe, constitution IV). Since squad round 2 (operator decision on
PLAN-FRESH-2-002, (a)) the same sheet, added after the static styles so that it wins on equal specificity, also
carries what only an interactive pill needs: `:host { display: inline-grid; }`, an enabled pill's text span at
`white-space: nowrap; overflow: hidden; text-overflow: ellipsis`, and, for a disabled interactive pill, which wraps
instead (FR-033), the text back at `white-space: normal; overflow: visible; text-overflow: clip`, with the merged
`overflow-wrap: break-word`, so that a host shrunk below a word still shows every character inside the pill (US5-6).
The chain that lets a flex or grid parent shrink an enabled pill until it truncates (R-09) is the merged one: the text
span's `min-inline-size: 0`, the `.icon-row`'s `max-inline-size: 100%` and the control's minimum
`--ocelle-target-small` (FR-043; not 0, which would break the 24 px target); in Chromium the host's automatic minimum
is then the control's padding and border. A disabled interactive pill in a flex row can therefore break a short word,
as the round-1 static pill did. **Amended by operator decision Q-P6-1 (a)** (reviews/phase-6/operator-decisions.md):
the `min-inline-size: 0` this section first gave the host, the control and the `.icon-row`, and the disabled text's
`overflow-wrap: anywhere`, are not written, because no Chromium layout tells them apart from the merged rules
(reviews/phase-6/notes.md: the host's and the row's plants survived the flex-row and grid-track bodies, and
`anywhere` gave the same box as `break-word` in 13 layouts); the flex-row, grid-track and long-word bodies pin the
behaviour. The block axis is the host's: the README carries
012's clearance rule for a container that clips in the block direction. A scenario focuses a truncated pill inside an
`overflow: hidden` container and checks the ring's box lies inside it; the `Truncated` story shows a focused truncated
pill in a clipping container.

## R-08 Mode changes and `MovedAttributes` (FR-035)

012's `MovedAttributes` as merged: `handle(name, value)` stores a moved attribute and removes it from the host (a
blank value clears it), or restores a mirror the host changed; `connected()` runs once, at the first connection, and
reads back only the mirrors of names not yet held (012 `control.ts` 97-104); host attributes are moved only by
`handle()`, which elements call from `attributeChangedCallback`.

**Decision**: the pill keeps one `MovedAttributes` instance for its seven names. The pill's mode is read from the
host's `interactive` and `href` **attributes** (`linkHref(getAttribute("href"), document.baseURI)`), never from Lit
properties, which Lit sets only in the later `interactive`/`href` callback: so at upgrade, where every attribute is
already present and the callbacks arrive in attribute order, a passthrough attribute written before `interactive` or
`href` in the markup is handled in the right mode. Both are reflected, so a property set reaches the attribute in
Lit's update and takes the same path. Every passthrough step runs synchronously in `attributeChangedCallback` (or
`connectedCallback`); only rendering waits for Lit's update.

Three additive methods on 012's class and one additive parameter of `guardHost` (no existing method or parameter
changes, so `ocelle-button` and `ocelle-action-row` behave as before and their passthrough tests pass unchanged,
FR-030 / SPEC-3-05; **plan decision 10**):

- `capture(): void` — for each listed name the host sets, `handle(name, host.getAttribute(name))` (moved and
  mirrored as at upgrade, 012 FR-004); then, for each name still not held, read back its mirror as `connected()` does.
  Called on every static → interactive transition after the upgrade (FR-035 (b)).
- `release(): void` — for each held value, write it back to the host as that attribute (the last value, off values
  included, cleared values not), remove its mirror, forget it. Called synchronously from the `interactive`/`href`
  callback in which the mode computed from the attributes becomes static, so a passthrough attribute the host sets
  later in the same task arrives while the pill is static and stays on the host as set, and one set earlier in the
  same task arrived while the pill was interactive and is the value written back: the host's newest value wins in
  either order (FR-035, "no passthrough value is lost"). The write-back reaches `attributeChangedCallback` as an
  ordinary attribute change, which the static pill ignores.
- `adoptMirrors(): void` — for each mirror on the host whose attribute the host does not set, write the mirror's value
  as the attribute; remove every mirror (FR-035 (e)). Called from the first `connectedCallback` of a pill that is
  static at upgrade.
- `guardHost(host, control, available, active = () => true)` — the guard returns at once while `active()` is false;
  012's three-argument calls are unchanged.

At upgrade: an interactive pill hands each passthrough callback to `handle()` and calls `connected()` from its first
`connectedCallback`, as `ocelle-button`; a static pill calls `adoptMirrors()` there. While static,
`attributeChangedCallback` for the seven names and their mirrors does nothing (the attributes stay on the host, no
mirror is written, no custom state is set, FR-027); a scenario proves it for each of the seven names (contracts/checks.md
§ US3). On a button ↔ link switch, nothing is released or captured: the held values are re-applied to the new control
in the render (FR-035 (c)).

Focus (FR-035 (d)): in `willUpdate`, when the mode will change between button and link, record whether
`shadowRoot.activeElement` is the inner control and whether it matches `:focus-visible`. The render replaces the
inner control inside `ocelle-tooltip`, which learns its new trigger from its own `slotchange` (008 `ocelle-tooltip.ts`
385-394, which also hides the bubble and resets its focus state), and its `focusin` handler tests the stored trigger
(278-282). The slot change is signalled after the synchronous commit, so a `focus()` called in `updated()` would reach
the tooltip while it still holds the removed control, and a focused truncated pill would lose its tooltip. So
`updated()` queues the refocus in a microtask, which runs after the slotchange the commit signalled (the squad's probe
order: slotchange, then later microtasks); the T002 spike confirms the order with the real tooltip, and if it does not
hold, the refocus waits for the tooltip's `slotchange` event on the shadow root. Chromium's `:focus-visible` heuristic
keeps the ring for a programmatic focus that moves from an element that matched `:focus-visible`, and not otherwise
(**recheck** in the T002 spike, as 012's decision 27 did; if the heuristic does not hold once the old control is
removed, use `focus({ focusVisible })` with the recorded match). A scenario switches a keyboard-focused truncated pill
between button and link mode in both directions and asserts focus, ring and shown tooltip on the new control.
Becoming static while focused: no call; focus falls to the body.

**Alternatives**: a second, pill-only passthrough class (re-implements 012's FR-004 mirroring, which the spec forbids);
calling `connected()` again on becoming interactive (it returns at once after the first call and reads only mirrors);
`release()` skipping names the host sets (with a synchronous release no held name can be on the host, so the branch
would be unreachable and its mutant equivalent); a pill-owned copy of the guard (duplicates 012's logic).

## R-09 Truncation and the tooltip (FR-033, FR-034)

**Decision**: in an enabled interactive pill the text span has `white-space: nowrap; overflow: hidden;
text-overflow: ellipsis` and the merged `min-inline-size: 0`, the `.icon-row` the merged `max-inline-size: 100%`, and
the control, the stretched item of the host's inline grid, the minimum `--ocelle-target-small` (FR-043); the host is
capped as R-07 says, and in Chromium its automatic minimum is then the control's padding and border, so a flex or grid
parent can shrink it to the room left and it truncates there. In a disabled interactive pill the text wraps
(`white-space: normal`, with the merged `overflow-wrap: break-word`, R-07). No `min-inline-size: 0` is set on the
host, the control or the `.icon-row`, and no `overflow-wrap: anywhere` (operator decision Q-P6-1 (a): no Chromium
layout tells them apart from the merged rules; the flex-row, grid-track and long-word bodies pin the behaviour). In an
auto-layout table a cell grows to its content's max-content width, so a pill there does not truncate; the README says truncation needs a
definite inline size (a fixed table layout, a cell or column width) and scenarios pin the flex row and the grid track.

Siblings in a flex row (operator decision on PLAN-FRESH-2-003, (a)): flex shrink is weighted by flex basis, so a
truncating pill and a sibling with `flex: 0 1 auto` share the overflow, and the sibling shrinks too, down to its longest
word (squad round 2's probe3 on Chromium 153, a 200 px row: the pill truncates at 130 px while "Mission name" wraps to
51.6 × 36 px against its natural 90.2 × 17 px; the pill's 10 px of inline margin, decision 11, adds to the overflow
shared out). The element does not settle this. The README and the contract say that the sibling keeps its size only if
it is `flex: none`, or if the pill takes the remaining room through `flex: 1 1 0` set by the host, and the checks.md
fixture sets each explicitly beside a twin row with neither that pins the shared shrink. The two routes are not equal
(squad round 3, PLAN-FRESH-3-004): the control fills its stretched host (R-07, 012 FR-001), so `flex: 1 1 0` also
stretches a fitting pill's visible box to the remaining width (probe p7, a 300 px row beside "Mission name": "Blocked"
with `flex: 1 1 0` has a 213.6 px control, with the sibling `flex: none` instead 75.8 px). The README therefore
recommends `flex: none` (or `flex-shrink: 0`) on the sibling and states the stretch of the `flex: 1 1 0` route, and
the checks.md row pins the stretched width.

`truncated` (internal reactive state) is `!disabled && overflow`, where *overflow* is measured with fractional
geometry, since `scrollWidth` and `clientWidth` are integers and the ellipsis is drawn on a sub-pixel overflow: a
`Range` from before the first to after the last node assigned to the default slot gives the text's inline extent
(`getBoundingClientRect()`, unclipped layout geometry), compared with the text span's content box from its own
`getBoundingClientRect()`; overflow is true when the text's inline end passes the span's (the inline start in a
right-to-left pill) by more than 0. The harness step proves the measure on a stand-in (an overflow of 0.1 px is
overflow, an exact fit is not) before any element uses it (**recheck** in the T002 spike that the Range rect is unclipped under
`text-overflow: ellipsis`; if not, the phase-6 tasks use the smallest fractional measure the spike shows).

Re-evaluation, each trigger with a scenario that changes truncation through it alone (contracts/checks.md § US5):
- a `ResizeObserver` on the text span: the span's inline size changes (a container width change, and a late font load
  wherever it changes the span's box);
- a `MutationObserver` (`characterData`, `childList`, `subtree`) on the host: a Text node's data edited, a nested
  element's text replaced;
- `slotchange` on the default slot: a child's `slot` attribute changed (a reassignment the host `childList` record does
  not show);
- every `updated()` while interactive, with no list of properties (so no condition mutants): `disabled`, `density`
  and the mode change the text's box or font without any observer firing (proven by `density` and `disabled` switched
  in a fixed-width container).
`document.fonts` `loadingdone` is dropped: no font loads in the mutated in-process project (`in-process.ts` 25 strips
`@font-face`), and a late font load changes the span's box, which the `ResizeObserver` sees, except when the text fits
exactly before the load and overflows after it with the span already at its maximum, a stated limit in the README
(the next width or text change corrects it). `variant` needs no trigger of its own: it reaches `updated()` like any
property.

A pill that becomes truncated while its control has focus: 008's tooltip opens its bubble on a `focusin` while
enabled (`ocelle-tooltip.ts` 277-282, 301-309), so enabling it on a focused trigger may show nothing until focus
leaves and re-enters. The T002 spike measures it on a stand-in (an `ocelle-tooltip` whose trigger is focused while
the tooltip is disabled and is then enabled, and the same after a blur and a refocus), recorded in
`reviews/phase-1/spikes.md`; the README rule of T057 states what it measured (analysis finding U1).

Observer lifecycle (one rule, R-08's transitions): the observers exist iff the pill is connected and interactive. They
are created in `updated()` when the pill is connected, interactive and has none (so on the first render of an
interactive pill and on every static → interactive transition), and in `connectedCallback` after a reconnection of an
interactive pill; disconnected in `updated()` on → static and in `disconnectedCallback`. In every `updated()` the
`ResizeObserver`'s target is compared with the current text span and re-targeted (unobserve the old, observe the new)
when it changed, since a button ↔ link switch renders the text span inside a new control. Teardown has no public
observable (a static or disconnected pill ignores a late measure, a reconnected one creates new observers): the
mutants that remove the `disconnect()` calls are recorded as equivalent with that reason in the phase-6 review, and
the scenarios prove the re-targeting and the creation after static → interactive by behaviour (a width change after
the switch updates the tooltip).

Full text: `normalise(slot.assignedNodes({ flatten: true }).map(n => n.textContent).join(""))` (trim, collapse
whitespace).

Render: `<ocelle-tooltip text=${fullText} ?disabled=${!truncated}>${control}</ocelle-tooltip>`, no `describes`, as the
contract shows; the pill imports `./ocelle-tooltip.js` (so the pill's entry point defines the tooltip too). The text in
the control is the slotted text (the contract's snippet renders `${this.text}`; the interface used, `text` and
`disabled` and no `describes`, is the same).

The pill's own `slotchange` events and the tooltip (found while going green in phase 6; review round 1, R1-05,
operator decision "interactive only, and recorded"): the pill's slots (the `.label` wrapper's default slot and the
`icon` slot) sit inside the inner control, which is slotted into `ocelle-tooltip` as its trigger, so a `slotchange` on
them bubbles through the tooltip's own slot. 008's tooltip (`ocelle-tooltip.ts` 387-396) then takes the first element
assigned to `event.target`, the slot the event came from, as its new trigger, where 008's contract
(specs/008-overlays/contracts/elements-overlays.md, the trigger is "the first assigned element" of its own default
slot) means its own slot: after a button ↔ link switch a text-only slot leaves it with no trigger, and an icon change
makes the icon the trigger. **Decision**: while the pill is interactive, it stops each of its own slots' `slotchange`
at the slot (`stopPropagation()` in the slot's listener, the mode read when the event is dispatched); a static pill has
no tooltip and stops nothing. `ocelle-tooltip` is not changed (a triage item for 008: ignore a `slotchange` whose
target is not its own slot). Side effect, stated in the README: in button and link mode a host that forwards its own
`<slot>` into the pill hears that slot's `slotchange` on the forwarded `<slot>` itself, not on an element or shadow
root above the pill; a static pill lets it bubble, as a plain element does. The US4-10, mode-switch and icon bodies
kill the stop's removal; the forwarded-slot `slotchange` body kills both its removal and its extension to static mode.
Alternatives: stopping in every mode (the phase-6 green commit `a6200bc3`: a static pill swallowed a forwarded slot's `slotchange` for no
reason); changing the tooltip (outside this feature).

Moved `title` and the tooltip (check-1 note): 012's FR-004 applies a moved `title` to the inner control, so a
truncated pill with a `title` would show both the native title and the tooltip. **Plan decision 8**: the moved `title`
stays applied (012 as written); the README tells hosts not to set `title` on an interactive pill, whose full text the
tooltip shows. Touch: the tooltip's own behaviour (008), not changed here; the README notes it.

**Alternatives**: measuring with a canvas (needs the font, and is wrong for letter spacing); a fixed character limit
(not what #524 asks); `scrollWidth > clientWidth` (misses an overflow below about 0.5 px, PLAN-CORRECTNESS-1-012).

## R-10 Tokens

| Token | Group | Value | Why | Phase |
|---|---|---|---|---|
| `size-indicator` | size | `0.5rem` | the 8 px dot floor (FR-011); `size-dot` is 7.2 px and is the timeline dot | US1 |
| `motion-pulse` | motion | `1600ms`, `0ms` under reduced motion (rule (f) as generalised by 012) | FR-012, FR-041 | US1 |
| ~~`motion-pulse-count`~~ | — | — | dropped at the phase-1 recheck (operator decision Q1 (a)): the generator and rule (f) refuse a unitless motion value; the count is the literal `animation-iteration-count: 3` (R-04), 3 × 1.6 s = 4.8 s | — |
| `font-size-eyebrow`, `font-weight-eyebrow`, `tracking-eyebrow`, `color-eyebrow` | type, colour | as 011's R-12 | not added: on `main` since 011 (`bea31300`), used as merged (FR-042's second branch; phase-1 recheck (c)) | — |
| `line-height-snug` | type | `1.2` | FR-040 | US3 |
| `target-small` | size | `1.5rem` | FR-043 (24 px, WCAG 2.5.8) | US4 |

Each token is added red first: `packages/tokens/test/expected.ts` gains the record, the generator's output tests and
`@ocelle/tokens`' CHANGELOG follow. The pinned contrast counts do not change (the eyebrow tokens are on `main`).
Names are **plan decision 2** for the operator. The pulse ring's growth needs no token of its own: its extent is half
of `size-indicator` (R-04).

## R-11 Tests and harness

**Decision**: scenarios in `packages/elements/test/scenarios/{status-indicator,metric,pill-tag,pill-tag-interactive,
pill-tag-truncation,consumers}.ts` against the test driver as merged after 012 and 008 (their two extensions
reconciled, R-01 **recheck**), run in process (`test/*.test.ts`, mutated) and on the strict-CSP fixture pages
(`test/browser/*.test.ts`, fixtures `status-indicator.html`, `metric.html`, `pill-tag.html`). Node tests: manifest
entries, README sections, `index.ts` re-exports, entry points. Accessibility-tree assertions read Chromium's tree
through the driver (never an empty shadow root, frontend finding); axe through 006's rule selection. Every "does not"
assertion is paired with a positive one and a measured plant (finding). Media emulation (reduced motion, forced
colours, colour scheme) is reset after each test.

**Harness step** (phase 1, red first, after T001; contracts/checks.md § Test harness), modelled on 012's and 008's:
the driver methods the scenarios need that the merged driver does not have, or has in a form that cannot express them,
are added and self-tested on plain stand-in pages in both harnesses (`test/harness/*.test.ts` and its browser twin),
each "does not" paired with a positive, before any element exists. As amended at the phase-1 recheck (operator decision
Q4 (a)), these are four: the rows 1, 2, 7 and 8 of § Test harness:
- an animation record with a stable identity per `Animation` object, `iterations`, `endTime`, `currentTime` and
  `playState`: 013's `animations(id)` (`Running`: `endTime`, `currentTime`, `playState`, no identity, no `iterations`)
  or 008's `ownAnimations(id, inner?)` extended additively, or a sibling, with every existing caller unchanged; and
  `seek(id, inner, ms)`;
- `settleLayout()` (013's `layout(id)` settles and reads a `dl`'s box only): `settle()`, then a second animation frame and every element's `updateComplete` again, so a
  `ResizeObserver` callback and the Lit update it causes have run (`settle()` alone awaits one frame, whose callbacks
  run before layout and observer delivery, `in-process.ts` 35-39). Its self-test: a stand-in element that sets a
  reactive property from a `ResizeObserver` is read correctly after `settleLayout()` and, as the positive that the
  wait is needed, a read after `settle()` alone is allowed to be stale;
- the fractional overflow measure of R-09, as a helper run on a stand-in.

Rows 3 to 6 exist on `main` and are used as merged, with no new method and no self-test (a self-test of an existing
method passes before any change, so it cannot be part of a red commit): editing a text node's data (the
`characterData` path) is 013's `text(id, value)` or 011's `textData(id, index, data)`; the tooltip's shown state is
008's `topLayer()`, which reads `:popover-open` elements in every shadow root the probe saw attached, nested ones
included; `focusVisible(id, inner?)` and `focusPath()` reach the pill's control, which is in the pill's own shadow root
(the tooltip's trigger is its light-DOM child there); a click at a point is 012's `click(id, { position })` or 009's
`clickAt(target, point)`. Each scenario negative that relies on them is paired with its positive in the same body, as
contracts/checks.md requires, so a method that always answered the same would fail that positive.
A driver method that always answered "no animation" or "tooltip closed" would make the negatives pass vacuously; the
self-tests rule that out.

**Waits and negatives**: the truncation scenarios settle through `settleLayout()` after every layout-changing step
(mount, width, text, `disabled`, `density`, mode). Every "no tooltip" assertion is read after hover or focus has been
held longer than 008's test tooltip delay (300 ms, `test/fixtures/tooltip-delay.css`), in the same body as a twin pill
whose tooltip does show under the same wait. Plants for US5: `truncated` forced to false, and `truncated` forced to true.

## R-12 Stories, baselines and the plant shard headroom

**Decision**: stories in `storybook/stories/{status-indicator,metric,pill-tag}.stories.ts`. To keep the count low, a
story shows every status side by side where the state is the same: indicator `Tones` (a first row without `pulse`
and a second row with `pulse`; captured under reduced motion with animations disabled by 006's capture plan,
`gates/lib/capture-plan.ts` 48, 59, so both rows show the solid dot, and the second row carries axe and the FR-004
state coverage for `pulse`, no visual evidence for FR-011 or FR-012, which the US1-4 scenarios prove) and `Labelled`;
metric `Stack`, `Row`, `EmptyValue`; pill `Statuses`, `Badge`, `Compact`, `WithIcon`, `LongTextWraps`; interactive
`Button`, `Pressed` (pill and badge, pressed and not), `Link`, `Disabled`, `Focus`, and the pointer states of decision
6 declared with 006's pointer parameter as 012 declares `PrimaryHovered` and `SecondaryPressed`
(`button.stories.ts` 3, 65-87): `PillHovered` (`{ hover: "ocelle-pill-tag" }`, the border in the status colour),
`BadgeHovered` (the status-ground fill), `PillActive` (`{ press: "ocelle-pill-tag" }`, the hover border and the inset
bar-width cue) and `BadgeActive` (the fill and the cue). 006's `pointerProblem` (`gates/lib/capture-plan.ts` 230-233)
rejects a selector that matches more than one element, so each of these stories holds exactly one `ocelle-pill-tag`, an
enabled button-mode pill of one status, and the pill and the badge, whose hover and active looks differ, each have
their own (FR-004, constitution V; squad round 2, PLAN-FRESH-2-004); truncation `Truncated`, `DisabledWraps`:
**21 stories** (the separate `Pulse` story is folded into `Tones`, operator decision on PLAN-TESTABILITY-1-011, (b)),
each with light and dark baselines made with
`OCELLE_VISUAL_ENGINE=docker pnpm run visual:update` in 006's pinned container (dockerd started as root; conflicting
PNGs regenerated, never hand-picked).

`Truncated` (squad round 2, PLAN-FRESH-2-005; revised at squad round 3, operator decision on PLAN-FRESH-3-003, (b)):
a row of enabled interactive pills in a narrow container, truncated and fitting, none focused, and below them, alone,
one truncated pill in an `overflow: hidden` container (R-07) that a story-only wrapper focuses after `updateComplete`,
as 012's `StoryFocus` does (`button.stories.ts` 17-28), with the pill's plain `focus()`, which 006's capture shows as
`:focus-visible` (012's phase-2 spike). The baseline shows the focused pill with its ring whole inside the clipping
container and **no tooltip bubble**. The open bubble is not part of any baseline: round 2's wrapper, which waited for
the tooltip's `disabled` to turn false before focusing, finished frames after the render that `storyRendered` reports
and so raced 006's `settle()` (`gates/lib/story-page.ts`: readiness, then scrollBack, pointer, `document.fonts.ready`
and two animation frames), and nothing in the capture waits for a story-only element. With the focus after
`updateComplete`, the focus lands before the pill's `ResizeObserver` has measured truncation and enabled the tooltip
(R-09), and 008's tooltip shows its bubble only on a `focusin` while enabled (`ocelle-tooltip.ts` 277-282, 301-309), so
no bubble opens in the capture. The tooltip's bubble, its text and its showing on focus and hover are proven by the
§ US5 scenarios alone (contracts/checks.md), and the baseline does not depend on 008's bubble styling. The phase-6
review checks that both captured themes show the ring and no bubble; a bubble in either capture is a finding, not a
re-baseline.

**Risk**: 012's plan estimates about 4 stories of headroom to the plant split count (76 at `shardSize` 1) after 012,
and asks for a triage record on a plant design that does not grow with the story count. 21 stories exceed it. T001
reads the split count and the story total on `main` then; if this feature's stories would exceed it and no such op
has landed, the run stops and asks the operator (**plan decision 9**). *Phase-1 recheck*: 194 stories on `main`
against a split count of 76, the plant-design triage still pending; the operator decided to proceed with the 21
stories (215 in all), the shard question staying with that triage (Q3). Op 016's `--affected` mode limits the local
plant runs to the plants a phase's diff can affect, so the local cost is the phase's, not the whole set's.

## R-13 Gates per phase, plants and mutation

**Decision**: each phase runs, after green: `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`,
`gate:unit-tests`, `gate:manifest`, `gate:csp`, `gate:prefix`, `gate:pins`, `gate:contrast` and `gate:brand-rules`
where tokens changed, the phase's stories' baselines with `gate:storybook-build`, `gate:visual` and `gate:axe`, then
the plants of the phase with op 016's mode, `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected
$(cat reviews/phase-N/base.sha)`, recorded in `reviews/phase-N/plants.md` in op 016's format, then mutation
(`gate:mutation`, elements config for element source, default config for token source), one heavy job at a time, with
007's verdicts and op 015's time limit. A full `gate:plants` is never run locally. Node 26.13.0 and
`OCELLE_CHROMIUM_PATH` as the frontend findings say (T001 (f): `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`,
Chrome for Testing 153.0.8010.12, here; this container has only Node 22.23.4). Op 016 as merged is rechecked by T001 (R-01) before the task
list is used: if its command, its `--list` output or its record format differ from what is written here, the tasks are
amended first. Phase 7 (polish, documentation only) runs its affected plants against phase 2's `base.sha`, not its
own, so that the run covers the whole feature's diff (plan, phase 7; analysis finding I4).

## R-14 Engine floor

**Decision**: no feature newer than the floor 012 and 008 set (Chromium 135 / WebKit 17.4 after both): CSS animations,
`getAnimations`, `ResizeObserver`, `MutationObserver`, `Range.getBoundingClientRect`, constructable stylesheets,
`ElementInternals` roles and custom states are all older. `moveBefore()` (Chromium 133) is not used by the elements;
the tests use it only to pin that a state-preserving move keeps a run (R-04 (b)). The README's engines section is not changed (**recheck** after both merges, since 008's branch states
Chromium 120 / WebKit 17 and 012's 135 / 17.4: the higher one stands).

## R-15 Manifest

**Decision**: the three classes declared as 005 and 012 do it (JSDoc with `@tagname`, `@slot`, `@csspart`, `@fires`,
`@cssstate`), the pill's passthrough attributes and their `data-ocelle-moved-*` mirrors declared as 012's R-15
normaliser keeps them (**recheck**), the pill's `label` as an attribute and property, not reflected (012 FR-013, `ocelle-button.ts` 116-117), `focus()`
and `click()` documented, events `click` and `ocelle-pill-tag-activate`
(`CustomEvent<Record<string, never>>`), custom states `pressed` and `current`. Parts: indicator `dot`, `ring`; metric
`label`, `value`; pill `pill` (all modes) and `control` (interactive modes). No CSS custom property of their own.
