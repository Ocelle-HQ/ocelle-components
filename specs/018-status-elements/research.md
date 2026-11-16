# Research: Status Elements (018)

Facts are as of `main` at `ce1d9c72` and the dependency branches read with `git show` on 2026-11-15:
`origin/claude/007-actions-status` (mission 012, `549409b`), `origin/claude/016-overlays` (mission 008, `9a44e8e`),
`origin/claude/008-layout-headers` (mission 011, `4e559b1`), `origin/claude/009-feedback-forms` (mission 010,
`94af87b`) and `origin/claude/041-plants-affected` (op 016). Implementation starts only after 012, 008 and op 016 are
on `main`; task T001 re-reads every fact marked **(recheck)** against `main` as it is then.

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
  toggled inline on `ElementInternals.states` (`ocelle-button.ts` 523-531); the activate dispatch is inline
  (`ocelle-button.ts` 480-485). 012 raises the engine floor to Chromium 135 / WebKit 17.4.
- 008 (**recheck**): `packages/elements/src/ocelle-tooltip.ts`, entry `@ocelle/elements/ocelle-tooltip.js`;
  properties `text`, `placement` (`top`, default), `disabled`, `describes`; default slot for the trigger; part
  `bubble`; `:host { display: contents }`; tokens `tooltip-delay`, `tooltip-max-inline`, `drawer-inline`. It does not
  detect truncation: the consumer does (its contract, "#7 and #12").
- 011 (**recheck**): not on `main` at `ce1d9c72`. Its R-12 defines `font-size-eyebrow` (`var(--ocelle-font-size-xs)`),
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
  a scenario can express.

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
**plan decision 3** for the operator). Fill `background: var(--ocelle-color-<status>)`, no opacity, no transform on
the dot ever. Accessibility through `ElementInternals` and 005's `expose(internals, name, drawable)` from `naming.ts`:
with a trimmed non-empty `label`, role `img` with that name; otherwise `ariaHidden = "true"`. The name comes from
`label` alone: the element calls `expose(internals, label.trim() || undefined, true)`, does not observe `aria-label`
and never passes a host `aria-label` to 005's `accessibleName` (**plan decision 4**, operator decision on
PLAN-CORRECTNESS-1-005, (b)). A host `aria-label` on the indicator is unsupported: the README says so and that `label`
is the one way to name it. Chromium names an element from its own `aria-label` attribute whatever its internals set,
so what Chromium then exposes for `aria-label` with and without `label`, present and blank, is measured in the US1
red step and pinned by US1-8 (the element neither reads nor changes it).

Forced colours: `@media (forced-colors: active) { .dot { background: CanvasText; } .ring { border-color: CanvasText;
} }` with `forced-color-adjust: none` on the dot so the system colour is the one drawn.

**Rationale**: `expose` already gives exactly the two accessibility shapes FR-014 asks for and is mutation-tested.

## R-04 The pulse: CSS only, four start cases

**Decision**: the ring is a separate span, absolutely placed over the dot (`position: relative` on the dot, `position:
absolute; inset: 0` on the ring), with `border: var(--ocelle-border-width) solid currentColor`, `border-radius:
var(--ocelle-radius-pill)` and `color: var(--ocelle-color-<status>)`. Its animation is written as longhands, with no
delay (the token-only lint rejects a `0s` literal, `gates/stylelint/token-only.ts` 57-69): `animation-name:
ocelle-pulse; animation-duration: var(--ocelle-motion-pulse); animation-timing-function:
var(--ocelle-easing-standard); animation-iteration-count: var(--ocelle-motion-pulse-count)`; direction and fill mode
stay at their initial values (`normal`, `none`, as 012's spinner). The ring grows through `inset`, not `scale` (the lint
lets `scale` take only -1 or 1 and rejects `transform: scale()`, token-only.ts 134-143, 197-205): the keyframes go
`from { inset: 0; opacity: 1; }` `to { inset: calc(var(--ocelle-size-indicator) * -0.5); opacity: 0; }`, so the ring
grows from the dot's 8 px to 16 px and fades out, from an existing token and no new one. The ring is out of flow, so
the growing `inset` moves nothing around it and never changes the dot's box. At rest (before and after the run) the
ring has `opacity: 0`, so after the run only the solid dot is seen. `@media (prefers-reduced-motion: reduce) { .ring {
animation: none; } }`. New tokens (motion group): `motion-pulse` 1600ms and `motion-pulse-count` `3` (3 × 1.6 s = 4.8 s
≤ 5 s, FR-012; the same margin as 012's spinner, 6 × 800 ms). `gate:style-lint` on the phase's source is the check that
every declaration here passes.

The four start cases of FR-012, as amended after squad round 1 (operator decisions on PLAN-CORRECTNESS-1-013 (a) and
PLAN-CORRECTNESS-1-014 (b)), are what CSS animations do natively, with no script:
- (a) `pulse` absent → present as a rendered change: the ring element is created, so its animation starts; removing
  `pulse` removes the ring and so the animation. A removal and re-addition within one task coalesce into one Lit
  update with `pulse` still true, so the ring node is kept and no run starts; FR-012 (a) counts only rendered changes,
  the README says changes within one task coalesce, and a scenario pins the no-restart case.
- (b) connection: an element inserted into a document gets a fresh style, and CSS animations start; there is no state
  across a disconnection. A state-preserving move (`moveBefore()`, in the Chromium floor of R-14) keeps the running
  animation and is not a start case (FR-012 (b) as amended); the T001 spike measures it and a scenario pins what it
  shows (the run under way continues, the same animation object, its current time not reset).
- (c) `reduce` → no preference: `animation-name` changes from `none` to `ocelle-pulse`, which starts a new animation;
  the reverse change cancels the running one at once (FR-013).
- (d) not rendered → rendered (an ancestor's `display: none`, the `hidden` attribute in its hidden state, a closed
  `<details>`): an element without a box has its CSS animations cancelled and gets new ones when it is rendered again.
  For the `<details>` case Chromium hides the closed content through its slot (`content-visibility: hidden` in recent
  versions), which may keep the animation instead of cancelling it: a spike in T001 measures (d) for `hidden`, an
  ancestor's `display: none` and `<details>`, and if `<details>` does not restart natively the phase-2 tasks add the
  smallest fix the spike shows (**recheck**). `hidden="until-found"` hides with `content-visibility` too and is not a
  start case (FR-012 (d) as amended); the spike measures it and a scenario pins what it shows.
- No other change restarts the animation: changing `tone` changes only `color`/`background` on the ring and dot, never
  an `animation-*` longhand; theme, size, position, `visibility`, opacity and scrolling do not cancel CSS animations.
  This is proven on the running animation, not on computed longhands (contracts/checks.md § US1-4): for each change
  FR-012 lists, the scenario seeks the run, applies the change and reads back the same animation (its stable identity
  in the driver) at a current time at or after the seek, beside a positive twin in which `pulse` is removed and set
  again in separate tasks and a new animation runs from near 0. Plant: the ring re-created on every render.

**Rationale**: no timers, no `animationend` listener and no JS state, so no Timeout mutants (op 015) and nothing to
keep across a disconnection. The rule (f) of 002 as generalised by 012 (**recheck**) sets every motion *duration* to
0ms under reduced motion: `motion-pulse` is a duration and joins it; `motion-pulse-count` is unitless, which the
validator accepts (no per-group syntax rule, `generate.ts` 133-168) and rule (f) skips (not a duration). If 008 lands
after 012 with its `tooltip-delay` exemption, nothing here changes. The element's own `animation: none` under reduced
motion does not rely on the 0ms duration, and the tests prove that: with the element's rule removed, three 0 ms
iterations would end at once at opacity 0 and look the same, so the US1-5 body that catches it runs under `reduce`
with a host rule restoring `--ocelle-motion-pulse: 1600ms` and asserts no animation on the ring, beside its twin under
no preference with the same host rule, which shows one run. Plant: the element's `animation: none` rule removed.

**Tests**: through the driver's animation record (R-11): existence, `iterations` (3) and `endTime` (≤ 5000), a stable
identity per animation, and frames sampled by seeking the animation and reading the dot's computed `opacity` and box
(dot unchanged, ring box changing). Reduced motion and forced colours through the harness's media emulation, reset
after each test (frontend findings).

**Alternatives**: a JS timer that removes the ring after 5 s (state, timers, Timeout mutants, and (b) to (d) by hand);
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
PLAN-A11Y-SECURITY-1-001, (a)): the visible `.eyebrow` span, `aria-hidden`, carries `text-transform: uppercase`,
`font-size: var(--ocelle-font-size-eyebrow)`, `font-weight: var(--ocelle-font-weight-eyebrow)`, `letter-spacing:
var(--ocelle-tracking-eyebrow)` and `color: var(--ocelle-color-eyebrow)`; the `.written` span holds the label as
written, untransformed, and is hidden visually with token-only CSS (`position: absolute; inline-size: 0; block-size: 0;
overflow: hidden; white-space: nowrap`, every value a keyword or 0; the `dt` is `position: relative`), so the term's
name is the written text. A T001 probe confirms on Chromium's tree that the term is named by the written text and the
copy adds no other node (**recheck**); if the zero-size copy is pruned from the tree, the phase-3 tasks use the
smallest token-only hiding the probe shows to be kept, and the operator is told. Value: `font-variant-numeric:
var(--ocelle-figures)`, the family inherited from the base styles (Schibsted Grotesk). `stack`: block flow; `row`: the
rule is on the pair, `.layout-row .pair { display: flex; flex-wrap: wrap; align-items: baseline; column-gap:
var(--ocelle-space-2); }` (the `dl`'s only child is the pair, so a flex `dl` would leave `dt` and `dd` stacked).
Empty value: `dd { min-block-size: 1lh; }` (the one `lh` use 005's lint allows). `overflow-wrap: anywhere` on both.

**Rationale**: a `dl` with one group is the plainest markup that gives the term/definition pair FR-024 asks for; the
hidden copy keeps 011's eyebrow look and FR-022's written name together.

**Alternatives**: `role="group"` with two spans (no term/definition semantics); a light-DOM render (005's conventions
use shadow DOM); `font-variant-caps: all-small-caps` (keeps the written text but changes 011's eyebrow look);
accepting the upper-cased name (an amendment of US2-2 and FR-022). The last two were options (b) and (c) of
PLAN-A11Y-SECURITY-1-001, not chosen.

## R-06 `ocelle-pill-tag`, static: box, densities and variants

**Decision**: host `display: inline-grid; min-inline-size: 0; max-inline-size: 100%` in every mode, the inner box
(the static `.pill` span, or the inner control in R-07) its one grid item, stretched in both axes, with
`min-inline-size: 0` on a static `.pill` so the host's automatic minimum is never its unwrapped text (a static pill in
a flex row or grid track shrinks and wraps, FR-027). Shadow root (static mode):

```html
<span part="pill" class="pill status-… variant-… density-…">
  <span class="icon-row"><span class="icon-slot"><slot name="icon"></slot></span><span class="text"><slot></slot></span></span>
</span>
```

with `iconSlotStyles` (005). The `.pill` box carries the density padding, the colours, the border and the radius; the
`.icon-row` is nested inside it, so the slot convention's `padding-block` (`calc((var(--ocelle-icon-size) - 1lh) / 2)`,
`icon-slot.ts`) is on a different box from the density padding and the two never compete. `--ocelle-icon-size: 1lh`
is set on `.pill` (the convention's one resizing route), so the row's block padding is 0, the 1lh-tall `.icon-slot`
holds an icon one line tall, and a pill with and without an icon has the same height; the scenarios pin each
density's height from the token values. The `.icon-row` has `min-inline-size: 0` and the text span `min-inline-size:
0` so the text can wrap (static) or truncate (R-09). Sizes, all tokens:

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
var(--ocelle-radius-pill)`. Text: `white-space: normal; overflow-wrap: anywhere` (wraps, never truncates, FR-027).

A static pill is inert content: its click guard is inactive (R-07), its shadow root has no `delegatesFocus` (R-07) and
it has no inner control, so a click on it reaches its ancestors as a click on its text would (an enclosing `<a href>`
navigates, a row's listener sees it with `defaultPrevented` false, a focusable ancestor takes focus), and
`pill.click()` dispatches a native click at the host.

Contrast (FR-028, SC-003): `color-<status>` is declared `kind: "text"` on `[...main, "color-<status>-bg"]` on `main`
already (`source.ts` 104-116), so the pill's text on its ground, the badge's text and border on the main grounds and
the dot on the main grounds (non-text 3:1 is weaker than the text 4.5:1 already checked) are all in the contrast gate
today: **no new contrast rows** for the status vocabulary. A badge or indicator placed on a state ground (inside a
notice) is outside the checked set; the README says so.

**Rationale**: every value a token; forced colours handled by the transparent-border idiom; no new contrast surface;
one structure (`.pill` > `.icon-row`) in every mode.

## R-07 `ocelle-pill-tag`, interactive: 012's conventions reused

**Decision**: in button and link mode the visual box *is* the inner control: `<button type="button" part="pill
control" class="control pill status-… variant-… density-…">` or `<a part="pill control" href=… class="control pill
…">`, holding the same nested `.icon-row` as R-06, wrapped in `<ocelle-tooltip>` (R-09). The `control` class is what
every `controlStyles` rule selects (012 `control.ts` 157-194), so the token focus ring, the link without underline and
the forced-colours table apply. The inner control is the host's one stretched grid item (R-06's `display:
inline-grid`, as `ocelle-button.ts` 134), so it fills the host in both axes and a host stretched by a flex row or a grid
cell has no area outside it (012 FR-001, adopted by FR-030); the tooltip host between them is `display: contents`, so
the control is the grid item.

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

The `aria-pressed` rule on a link is the pill's own (operator decision on PLAN-CORRECTNESS-1-007, (a)): in link mode
the pill holds and mirrors `aria-pressed` but applies none and exposes no `:state(pressed)`. `ocelle-button` as merged
differs: it applies no `aria-pressed` on its link either (`ocelle-button.ts` 509) but sets `:state(pressed)` from the
held value with no mode check (`ocelle-button.ts` 525; 012 data-model § states). The spec words the pill's rule as its
own (FR-031, US4-10, Edge Cases), and the difference is recorded for mission 012 as a triage note (**plan decision
12**), not changed here (`ocelle-button` is not changed by this feature).

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
  `Highlight` hover border is; a T001 probe confirms it for `background-color` in Chromium's forced-colours emulation,
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
removes on → static (adopted stylesheets, CSP-safe, constitution IV). The block axis is the host's: the README carries
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
order: slotchange, then later microtasks); the T001 spike confirms the order with the real tooltip, and if it does not
hold, the refocus waits for the tooltip's `slotchange` event on the shadow root. Chromium's `:focus-visible` heuristic
keeps the ring for a programmatic focus that moves from an element that matched `:focus-visible`, and not otherwise
(**recheck** in the T001 spike, as 012's decision 27 did; if the heuristic does not hold once the old control is
removed, use `focus({ focusVisible })` with the recorded match). A scenario switches a keyboard-focused truncated pill
between button and link mode in both directions and asserts focus, ring and shown tooltip on the new control.
Becoming static while focused: no call; focus falls to the body.

**Alternatives**: a second, pill-only passthrough class (re-implements 012's FR-004 mirroring, which the spec forbids);
calling `connected()` again on becoming interactive (it returns at once after the first call and reads only mirrors);
`release()` skipping names the host sets (with a synchronous release no held name can be on the host, so the branch
would be unreachable and its mutant equivalent); a pill-owned copy of the guard (duplicates 012's logic).

## R-09 Truncation and the tooltip (FR-033, FR-034)

**Decision**: in an enabled interactive pill the text span has `white-space: nowrap; overflow: hidden;
text-overflow: ellipsis; min-inline-size: 0` and the control `max-inline-size: 100%` of the host, which is capped as
R-07 says and has `min-inline-size: 0` (R-06), so a flex or grid parent can shrink it to the room left and it truncates
there; in a disabled interactive pill the text has the static pill's wrapping rules. In an auto-layout table a cell
grows to its content's max-content width, so a pill there does not truncate; the README says truncation needs a
definite inline size (a fixed table layout, a cell or column width) and scenarios pin the flex row and the grid track.

`truncated` (internal reactive state) is `!disabled && overflow`, where *overflow* is measured with fractional
geometry, since `scrollWidth` and `clientWidth` are integers and the ellipsis is drawn on a sub-pixel overflow: a
`Range` from before the first to after the last node assigned to the default slot gives the text's inline extent
(`getBoundingClientRect()`, unclipped layout geometry), compared with the text span's content box from its own
`getBoundingClientRect()`; overflow is true when the text's inline end passes the span's (the inline start in a
right-to-left pill) by more than 0. The harness step proves the measure on a stand-in (an overflow of 0.1 px is
overflow, an exact fit is not) before any element uses it (**recheck** in T001 that the Range rect is unclipped under
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
| `motion-pulse-count` | motion | `3` | FR-012, FR-041 (3 × 1.6 s = 4.8 s) | US1 |
| `font-size-eyebrow`, `font-weight-eyebrow`, `tracking-eyebrow`, `color-eyebrow` | type, colour | as 011's R-12 | only if 011 is not on `main` at US2 (FR-042); then also 011's 9 contrast rows per theme and the count changes R-12 lists, recomputed from `main` | US2 |
| `line-height-snug` | type | `1.2` | FR-040 | US3 |
| `target-small` | size | `1.5rem` | FR-043 (24 px, WCAG 2.5.8) | US4 |

Each token is added red first: `packages/tokens/test/expected.ts` gains the record, the generator's output tests and
`@ocelle/tokens`' CHANGELOG follow. The pinned contrast counts do not change unless the eyebrow tokens are added here.
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
the driver methods the scenarios need that neither branch has, or has in a form that cannot express them, are added
and self-tested on plain stand-in pages in both harnesses (`test/harness/*.test.ts` and its browser twin), each "does
not" paired with a positive, before any element exists:
- an animation record with a stable identity per `Animation` object, `iterations`, `endTime`, `currentTime` and
  `playState` (008's `animations(id, inner?)` extended or a sibling), and `seek(id, inner, ms)`;
- `editText(id, data)`: edits the data of the host's text node (the `characterData` path);
- the tooltip's shown state through 008's `topLayer()` or a nested shadow read of the bubble inside the pill's shadow
  root;
- `focusVisible(id, inner?)` and `focusPath()` as merged, with a nested-shadow read for the control inside the
  tooltip inside the pill;
- clicks at a chosen point of an element (012's `ClickOptions.position` as merged) for the corner clicks of US4-7;
- `settleLayout()`: `settle()`, then a second animation frame and every element's `updateComplete` again, so a
  `ResizeObserver` callback and the Lit update it causes have run (`settle()` alone awaits one frame, whose callbacks
  run before layout and observer delivery, `in-process.ts` 35-39). Its self-test: a stand-in element that sets a
  reactive property from a `ResizeObserver` is read correctly after `settleLayout()` and, as the positive that the
  wait is needed, a read after `settle()` alone is allowed to be stale.
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
`Button`, `Pressed` (pill and badge, pressed and not), `Link`, `Disabled`, `Focus`; truncation `Truncated` (with a
focused truncated pill in a clipping container, R-07), `DisabledWraps`: **17 stories** (the separate `Pulse` story is
folded into `Tones`, operator decision on PLAN-TESTABILITY-1-011, (b)), each with light and dark baselines made with
`OCELLE_VISUAL_ENGINE=docker pnpm run visual:update` in 006's pinned container (dockerd started as root; conflicting
PNGs regenerated, never hand-picked).

**Risk**: 012's plan estimates about 4 stories of headroom to the plant split count (76 at `shardSize` 1) after 012,
and asks for a triage record on a plant design that does not grow with the story count. 17 stories exceed it. T001
reads the split count and the story total on `main` then; if this feature's stories would exceed it and no such op
has landed, the run stops and asks the operator (**plan decision 9**). Op 016's `--affected` mode limits the local
plant runs to the plants a phase's diff can affect, so the local cost is the phase's, not the whole set's.

## R-13 Gates per phase, plants and mutation

**Decision**: each phase runs, after green: `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`,
`gate:unit-tests`, `gate:manifest`, `gate:csp`, `gate:prefix`, `gate:pins`, `gate:contrast` and `gate:brand-rules`
where tokens changed, the phase's stories' baselines with `gate:storybook-build`, `gate:visual` and `gate:axe`, then
the plants of the phase with op 016's mode, `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected
$(cat reviews/phase-N/base.sha)`, recorded in `reviews/phase-N/plants.md` in op 016's format, then mutation
(`gate:mutation`, elements config for element source, default config for token source), one heavy job at a time, with
007's verdicts and op 015's time limit. A full `gate:plants` is never run locally. Node 26.13.0 and
`OCELLE_CHROMIUM_PATH` as the frontend findings say. Op 016 as merged is rechecked by T001 (R-01) before the task
list is used: if its command, its `--list` output or its record format differ from what is written here, the tasks are
amended first.

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
