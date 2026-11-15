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
with a trimmed non-empty `label`, role `img` with that name; otherwise `ariaHidden = "true"`. The host has no ARIA of
its own to move; a host `aria-label` on the indicator is not supported (the README says `label` is the one way; 005's
`accessibleName(label, hostAriaLabel)` lets a present host `aria-label` decide, which is kept for consistency with
`ocelle-icon`: **plan decision 4**).

Forced colours: `@media (forced-colors: active) { .dot { background: CanvasText; } .ring { border-color: CanvasText;
} }` with `forced-color-adjust: none` on the dot so the system colour is the one drawn.

**Rationale**: `expose` already gives exactly the two accessibility shapes FR-014 asks for and is mutation-tested.

## R-04 The pulse: CSS only, four start cases for free

**Decision**: the ring is a separate span, absolutely placed over the dot, with `border: var(--ocelle-border-width)
solid currentColor` and `color: var(--ocelle-color-<status>)`; its animation is
`animation: ocelle-pulse var(--ocelle-motion-pulse) var(--ocelle-easing-standard) 0s var(--ocelle-motion-pulse-count)
normal none` (no fill mode, as 012's spinner). The keyframes scale the ring from 1 to 2 and fade it from opacity 1 to 0; at rest (before and after the
run) the ring has `opacity: 0`, so after the run only the solid dot is seen. `@media (prefers-reduced-motion: reduce)
{ .ring { animation: none; } }`. New tokens (motion group): `motion-pulse` 1600ms and `motion-pulse-count` `3`
(3 × 1.6 s = 4.8 s ≤ 5 s, FR-012; the same margin as 012's spinner, 6 × 800 ms).

The four start cases of FR-012 are what CSS animations do natively, with no script:
- (a) `pulse` absent → present: the ring element is created, so its animation starts; removing `pulse` removes the
  ring and so the animation.
- (b) connection: an element inserted into a document gets a fresh style, and CSS animations start; there is no state
  across a disconnection.
- (c) `reduce` → no preference: `animation-name` changes from `none` to `ocelle-pulse`, which starts a new animation;
  the reverse change cancels the running one at once (FR-013).
- (d) not rendered → rendered (an ancestor's `display: none`, `hidden`, a closed `<details>`): an element without a
  box has its CSS animations cancelled and gets new ones when it is rendered again. For the `<details>` case Chromium
  hides the closed content through its slot (`content-visibility: hidden` in recent versions), which may keep the
  animation instead of cancelling it: a spike in T001 measures (d) for `hidden`, an ancestor's `display: none` and
  `<details>`, and if `<details>` does not restart natively the phase-2 tasks add the smallest fix the spike shows
  (**recheck**).
- No other change restarts the animation: changing `tone` changes only `color`/`background` on the ring and dot, never
  an `animation-*` longhand; theme, size, position, `visibility`, opacity and scrolling do not cancel CSS animations.
  The CSS keeps every `animation-*` longhand independent of tone and theme, and a test pins that.

**Rationale**: no timers, no `animationend` listener and no JS state, so no Timeout mutants (op 015) and nothing to
keep across a disconnection. The rule (f) of 002 as generalised by 012 (**recheck**) sets every motion *duration* to
0ms under reduced motion: `motion-pulse` is a duration and joins it; `motion-pulse-count` is unitless, which the
validator accepts (no per-group syntax rule, `generate.ts` 133-168) and rule (f) skips (not a duration). If 008 lands
after 012 with its `tooltip-delay` exemption, nothing here changes. The element's own `animation: none` under reduced
motion does not rely on the 0ms duration.

**Tests**: `shadowRoot.getAnimations()` / `ring.getAnimations()` for existence, `effect.getComputedTiming()` for
`iterations` (3) and `endTime` (≤ 5000), and frames sampled by setting `currentTime` on the animation and reading the
dot's computed `opacity` and box (dot unchanged, ring changing). Reduced motion and forced colours through the
harness's media emulation, reset after each test (frontend findings).

**Alternatives**: a JS timer that removes the ring after 5 s (state, timers, Timeout mutants, and (b) to (d) by hand);
animating the dot's opacity (the #498 defect).

## R-05 `ocelle-metric`: one term and its definition

**Decision**: shadow root `<dl class="metric layout-…"><div class="pair"><dt part="label">${label}</dt><dd
part="value">${displayValue}</dd></div></dl>`, text bound as Lit text (never `unsafeHTML`). Chromium exposes `dt` as
role `term` and `dd` as `definition`, in DOM order, in both layouts (the row layout is CSS only). Label:
`font-size: var(--ocelle-font-size-eyebrow)`, `font-weight: var(--ocelle-font-weight-eyebrow)`, `letter-spacing:
var(--ocelle-tracking-eyebrow)`, `color: var(--ocelle-color-eyebrow)`, `text-transform: uppercase` (the accessibility
tree keeps the written text). Value: `font-variant-numeric: var(--ocelle-figures)`, the family inherited from the base
styles (Schibsted Grotesk). `stack`: block flow; `row`: `display: flex; flex-wrap: wrap; align-items: baseline;
column-gap: var(--ocelle-space-2)`. Empty value: `dd { min-block-size: 1lh; }` (the one `lh` use 005's lint allows).
`overflow-wrap: anywhere` on both.

**Rationale**: a `dl` with one group is the plainest markup that gives the term/definition pair FR-024 asks for.

**Alternatives**: `role="group"` with two spans (no term/definition semantics); a light-DOM render (005's conventions
use shadow DOM).

## R-06 `ocelle-pill-tag`, static: box, densities and variants

**Decision**: host `display: inline-block; max-inline-size: 100%`. Shadow root (static mode)
`<span part="pill" class="pill icon-row status-… variant-… density-…"><span class="icon-slot"><slot
name="icon"></slot></span><span class="text"><slot></slot></span></span>` with `iconSlotStyles` (005). Sizes, all
tokens:

| | default | compact |
|---|---|---|
| font size | `--ocelle-font-size-sm` | `--ocelle-font-size-xs` |
| line height | `--ocelle-line-height-tight` | `--ocelle-line-height-snug` (new, 1.2) |
| block padding | `--ocelle-space-1` | `--ocelle-space-1` (static: exactly; interactive: at least, R-07) |
| inline padding | `--ocelle-space-3` | `--ocelle-space-2` |

`pill` variant: `background: var(--ocelle-color-<status>-bg); color: var(--ocelle-color-<status>)`; `badge`:
`background: transparent; border-color: var(--ocelle-color-<status>); font-variant-numeric: var(--ocelle-figures)`.
Both: `border: var(--ocelle-border-width) solid transparent` (the pill's border is transparent outside forced colours,
which forced colours turns into a visible system-colour border, FR-028), `border-radius: var(--ocelle-radius-pill)`.
Text: `white-space: normal; overflow-wrap: anywhere` (wraps, never truncates, FR-027). The slot convention sets its
row block padding (`calc((icon-size - 1lh)/2)`) on `.icon-row`, which would make the pill taller than the density's
padding and break US3-4's exact 4 px. So the pill's box is not the `.icon-row` itself: the `.pill` box carries the
density padding, and the icon is placed in a 1lh-tall `.icon-slot` with the icon scaled to `1lh` through
`--ocelle-icon-size: 1lh` set on the pill (the convention's one resizing route). A pill with and without an icon then
has the same height, and the scenarios pin each density's height from the token values.

Contrast (FR-028, SC-003): `color-<status>` is declared `kind: "text"` on `[...main, "color-<status>-bg"]` on `main`
already (`source.ts` 104-116), so the pill's text on its ground, the badge's text and border on the main grounds and
the dot on the main grounds (non-text 3:1 is weaker than the text 4.5:1 already checked) are all in the contrast gate
today: **no new contrast rows** for the status vocabulary. A badge or indicator placed on a state ground (inside a
notice) is outside the checked set; the README says so.

**Rationale**: every value a token; forced colours handled by the transparent-border idiom; no new contrast surface.

## R-07 `ocelle-pill-tag`, interactive: 012's conventions reused

**Decision**: in button and link mode the visual box *is* the inner control: `<button type="button" part="pill
control" class="pill …">` or `<a part="pill control" href=… class="pill …">`, wrapped in `<ocelle-tooltip>` (R-09).
Reused from 012's `control.ts` as merged: `linkHref` decides the mode (FR-002 of 012), `controlState(disabled, false)`
(the pill has no unavailable state), `MovedAttributes` for `aria-label`, `aria-labelledby`, `aria-describedby`,
`aria-controls`, `aria-current`, `aria-pressed` and `title` (FR-030), `resolveIds` for the three ID-reference
attributes (element reflection), `guardHost` registered in the constructor, `controlStyles` for the focus ring and
forced colours. `delegatesFocus: true`; `focus()` and `click()` forward as in `ocelle-button`. The activate dispatch
copies `ocelle-button`'s inline pattern (listener on the inner control: return if not available or, in link mode, if
a modifier key is held; dispatch `ocelle-pill-tag-activate` `{ bubbles, composed, cancelable, detail: {} }`; if
cancelled, `event.preventDefault()`), so its order relative to bubble-phase listeners is the same (FR-031).
`aria-pressed` is applied to the button only when `true`, `false` or `mixed` and only in button mode; custom states:
`pressed` iff button mode and the applied value is `true`; `current` iff the applied `aria-current` is present and not
`false`.

Target size (FR-029, FR-032, FR-043): `min-block-size` and `min-inline-size` `var(--ocelle-target-small)` on the
inner control in both densities, with `display: inline-flex; align-items: center; justify-content: center`, so a
compact pill grows to 24 px by spreading its padding (padding stays `space-1` at least). New token `target-small`
1.5rem (size group): 012 adds no 24 px target token (its compact button reaches 24 px through padding) (**recheck**).

Looks (**plan decision 6**), all drawn with the status colour on the status ground, a pair the contrast gate already
checks at 4.5:1, so no contrast row is added and the status ground is never replaced:
- hover: the border, transparent at rest, takes `--ocelle-color-<status>` at `--ocelle-border-width`;
- active (pointer down): the same border at `--ocelle-bar-width`;
- pressed (`:state(pressed)`): the border at `--ocelle-bar-width` permanently;
- link mode adds no underline (a pill is a state mark; its role is announced).
Disabled: text `--ocelle-color-disabled-ink` on `--ocelle-color-neutral-bg`, whatever the status. If 012 as merged
declares `color-disabled-ink` on the state grounds with a passing figure (**recheck**), that row is reused; otherwise
the phase stops and asks the operator, because a new required pair below threshold is the operator's decision (as in
012's decision 5).

## R-08 Mode changes and `MovedAttributes` (FR-035)

**Decision**: the pill keeps one `MovedAttributes` instance for its seven names and calls it only while interactive.
Two additive methods are added to 012's class (no existing method changes, so `ocelle-button` and `ocelle-action-row`
behave as before and their passthrough tests pass unchanged, FR-030 / SPEC-3-05):

- `release(): void` — for each held value, write it back to the host as that attribute (the last value, off values
  included, cleared values not), remove its mirror, forget it; the host observes the write-back as an ordinary
  attribute change, which the pill (now static) ignores.
- `adoptMirrors(): void` — for each mirror on the host whose attribute the host does not set, write the mirror's value
  as the attribute; remove every mirror (FR-035 (e)).

While static, `attributeChangedCallback` for the seven names does nothing (the attributes stay on the host,
FR-027); mirror changes are ignored. On becoming interactive, `connected()` is called again (it reads the host
attributes and mirrors as at upgrade, FR-035 (b)). On a button ↔ link switch, nothing is released: the held values are
re-applied to the new control in `updated()` (FR-035 (c)).

Focus (FR-035 (d)): in `willUpdate`, when the mode will change between button and link, record whether
`shadowRoot.activeElement` is the inner control; in `updated`, call `newControl.focus()`. Chromium's `:focus-visible`
heuristic keeps the ring for a programmatic focus that moves from an element that matched `:focus-visible`, and not
otherwise (**recheck** in a T001 spike, as 012's decision 27 did; if the heuristic does not hold, use `focus({
focusVisible })` with the recorded match). Becoming static while focused: no call; focus falls to the body.

**Alternatives**: a second, pill-only passthrough class (re-implements 012's FR-004 mirroring, which the spec forbids).

## R-09 Truncation and the tooltip (FR-033, FR-034)

**Decision**: in an enabled interactive pill the text span has `white-space: nowrap; overflow: hidden;
text-overflow: ellipsis; min-inline-size: 0` and the control `max-inline-size: 100%`; in a disabled interactive pill
it has the static pill's wrapping rules. `truncated` (internal reactive state) is `!disabled && text.scrollWidth >
text.clientWidth`, re-evaluated by:
- a `ResizeObserver` on the text span (inline size changes);
- `slotchange` on the default slot and a `MutationObserver` (`characterData`, `childList`, `subtree`) on the host for
  text edits inside slotted nodes;
- `updated()` when `disabled`, `density`, `variant` or the mode changed;
- `document.fonts` `loadingdone` (a late font load changes text width without a resize, check-1 note).
The observers are created in `connectedCallback` only while interactive and disconnected in `disconnectedCallback`
or when the pill becomes static. Full text: `normalise(slot.assignedNodes({ flatten: true }).map(n =>
n.textContent).join(""))` (trim, collapse whitespace).

Render: `<ocelle-tooltip text=${fullText} ?disabled=${!truncated}>${control}</ocelle-tooltip>`, no `describes`, as the
contract shows; the pill imports `./ocelle-tooltip.js` (so the pill's entry point defines the tooltip too). The text in
the control is the slotted text (the contract's snippet renders `${this.text}`; the interface used, `text` and
`disabled` and no `describes`, is the same).

Moved `title` and the tooltip (check-1 note): 012's FR-004 applies a moved `title` to the inner control, so a
truncated pill with a `title` would show both the native title and the tooltip. **Plan decision 8**: the moved `title`
stays applied (012 as written); the README tells hosts not to set `title` on an interactive pill, whose full text the
tooltip shows. Touch: the tooltip's own behaviour (008), not changed here; the README notes it.

**Alternatives**: measuring with a canvas (needs the font, and is wrong for letter spacing); a fixed character limit
(not what #524 asks).

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
Names are **plan decision 2** for the operator.

## R-11 Tests and harness

**Decision**: scenarios in `packages/elements/test/scenarios/{status-indicator,metric,pill-tag,pill-tag-interactive,
pill-tag-truncation}.ts` against 012's driver (as merged), run in process (`test/*.test.ts`, mutated) and on the
strict-CSP fixture pages (`test/browser/*.test.ts`, fixtures `status-indicator.html`, `metric.html`, `pill-tag.html`).
Node tests: manifest entries, README sections, `index.ts` re-exports, entry points. Accessibility-tree assertions read
Chromium's tree through the driver (never an empty shadow root, frontend finding); axe through 006's rule selection.
Every "does not" assertion is paired with a positive one and a measured plant (finding). Media emulation (reduced
motion, forced colours, colour scheme) is reset after each test.

## R-12 Stories, baselines and the plant shard headroom

**Decision**: stories in `storybook/stories/{status-indicator,metric,pill-tag}.stories.ts`. To keep the count low, a
story shows every status side by side where the state is the same: indicator `Tones`, `Labelled`, `Pulse` (captured
under reduced motion with animations disabled by 006's capture plan, so the baseline is the solid dot); metric
`Stack`, `Row`, `EmptyValue`; pill `Statuses`, `Badge`, `Compact`, `WithIcon`, `LongTextWraps`; interactive
`Button`, `Pressed`, `Link`, `Disabled`, `Focus`; truncation `Truncated`, `DisabledWraps`: **19 stories**, each with
light and dark baselines made with `OCELLE_VISUAL_ENGINE=docker pnpm run visual:update` in 006's pinned container
(dockerd started as root; conflicting PNGs regenerated, never hand-picked).

**Risk**: 012's plan estimates about 4 stories of headroom to the plant split count (76 at `shardSize` 1) after 012,
and asks for a triage record on a plant design that does not grow with the story count. 19 stories exceed it. T001
reads the split count and the story total on `main` then; if this feature's stories would exceed it and no such op
has landed, the run stops and asks the operator (**plan decision 9**).

## R-13 Gates per phase, plants and mutation

**Decision**: each phase runs, after green: `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`,
`gate:unit-tests`, `gate:manifest`, `gate:csp`, `gate:prefix`, `gate:pins`, `gate:contrast` and `gate:brand-rules`
where tokens changed, the phase's stories' baselines with `gate:storybook-build`, `gate:visual` and `gate:axe`, then
the plants of the phase with op 016's mode, `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected
$(cat reviews/phase-N/base.sha)`, recorded in `reviews/phase-N/plants.md` in op 016's format, then mutation
(`gate:mutation`, elements config for element source, default config for token source), one heavy job at a time, with
007's verdicts and op 015's time limit. A full `gate:plants` is never run locally. Node 26.13.0 and
`OCELLE_CHROMIUM_PATH` as the frontend findings say.

## R-14 Engine floor

**Decision**: no feature newer than the floor 012 and 008 set (Chromium 135 / WebKit 17.4 after both): CSS animations,
`getAnimations`, `ResizeObserver`, `MutationObserver`, `document.fonts`, `ElementInternals` roles and custom states
are all older. The README's engines section is not changed (**recheck** after both merges, since 008's branch states
Chromium 120 / WebKit 17 and 012's 135 / 17.4: the higher one stands).

## R-15 Manifest

**Decision**: the three classes declared as 005 and 012 do it (JSDoc with `@tagname`, `@slot`, `@csspart`, `@fires`,
`@cssstate`), the pill's passthrough attributes and their `data-ocelle-moved-*` mirrors declared as 012's R-15
normaliser keeps them (**recheck**), `focus()` and `click()` documented, events `click` and `ocelle-pill-tag-activate`
(`CustomEvent<Record<string, never>>`), custom states `pressed` and `current`. Parts: indicator `dot`, `ring`; metric
`label`, `value`; pill `pill` (all modes) and `control` (interactive modes). No CSS custom property of their own.
