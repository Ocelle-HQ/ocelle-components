# Phase 1 spikes (T002)

Measured on 2026-11-19 by the implementer at `73d0f086` (branch `claude/007-status-elements`), on scratch pages only:
no repository source or test was changed for them. Browser: Chrome for Testing **153.0.8010.12**
(`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, Playwright `chromium.launch`, a
1280 × 800 context), Node 26.13.0. Each page was served over HTTP from a scratch directory with the token stylesheet
generated from `packages/tokens/src/source.ts` (`css(source)`, font included), `@ocelle/styles`' `base.css`, 008's
`test/fixtures/tooltip-delay.css` and the browser build of `packages/elements` at this commit (built into the scratch
directory with `vite.browser.config.ts`), so `ocelle-tooltip` is the merged one. The stand-ins are plain custom
elements written for the spike, described with each item; the numbers below are as printed.

**Outcome: no stop.** Every labelled pill sits on the surrounding baseline (offset 0.00 px in all 48 labelled cases),
and no result contradicts a scenario as written. Two findings for the phases that use them are flagged in § Notes for
later phases (an icon-only static pill is taller than a labelled one; the dropped override is caught by the icon-only
check, not by the wrappers' block-starts).

## R-06, R-07: the pill box on the slot convention as merged (operator decision Q2 (a))

Stand-in `spike-pill`: the shadow root of research.md R-06 as amended (`.pill` > `.icon-row[.bare]` > `.icon-slot`
(slot `icon`) and `.label` (default slot)), with `iconSlotStyles` copied verbatim from
`packages/elements/src/icon-slot.ts` at this commit; `.pill` with `--ocelle-icon-size: 1lh`, `padding-block:
var(--ocelle-space-1)`, `padding-inline: var(--ocelle-space-3)` (compact `--ocelle-space-2`), `font-size:
var(--ocelle-font-size-sm)` / `line-height: var(--ocelle-line-height-tight)` (compact `--ocelle-font-size-xs` / `1.2`,
the planned `line-height-snug`), a 1 px transparent border (badge: the status colour), the pill radius; static: host
`inline-block`, `.pill:not(.control) { inline-size: fit-content; max-inline-size: 100% }`, `.label { min-inline-size: 0;
overflow-wrap: break-word }`. Interactive: the same row inside `<ocelle-tooltip disabled><button class="control
pill …">`, host `inline-grid; min-inline-size: 0`, control `inline-flex; align-items: center; justify-content: center;
min-block-size: 1.5rem` (the planned `target-small`), `.label { white-space: nowrap; overflow: hidden; text-overflow:
ellipsis; min-inline-size: 0 }` while enabled, `white-space: normal; overflow: visible; overflow-wrap: anywhere` while
disabled. `bare` on the row exactly when the pill has no text. Icon: an inline `<svg slot="icon">`.

Measured for every combination of mode (static, interactive enabled, interactive disabled) × density (default,
compact) × variant (pill, badge) × icon (none, one) × context (inline in `<p>Before … after … end</p>`; an
`align-items: baseline` flex row beside `<span>Name</span>`), the surrounding text at the pill's font size (14 px,
compact 12 px), text "Blocked":

| Measure | Result |
|---|---|
| bottom of the pill's text (`Range` over the slotted text) − bottom of the surrounding text | **0.00 px in all 48 cases** |
| icon wrapper's block-start − `.label`'s block-start | 0.00 px in all 48 cases |
| pill height, default density | 26.09 px (static, enabled and disabled; with and without an icon) |
| pill height, compact density | 24.39 px (static, enabled and disabled; with and without an icon) |

Icon-only pill (no text, its row `bare`), in the same paragraph and flex row, relative to the surrounding text's
`Range` box (top: pill top − text top; bottom: pill bottom − text bottom), the same in the paragraph and the flex row and
for both variants:

| Mode, density | top | bottom | height × width | icon top / bottom (vs the text's top / bottom) |
|---|---|---|---|---|
| static, default | −7.09 px | +4.09 px | 29.19 × 50.09 px | −2.09 / −4.00 px |
| static, compact | −7.39 px | +5.39 px | 27.78 × 40.39 px | −2.39 / −3.00 px |
| interactive (enabled or disabled), default | −7.09 px | +1.00 px | 26.09 × 50.09 px | −2.09 / −4.00 px |
| interactive (enabled or disabled), compact | −7.39 px | +2.00 px | 24.39 × 40.39 px | −2.39 / −3.00 px |

The plants of contracts/checks.md § US3 baseline, applied to the stand-in (static, and enabled interactive, 14 px):

| Plant | Labelled pill offset | Icon-only pill (top / bottom) | Wrappers' block-starts |
|---|---|---|---|
| none (the convention) | 0.00 | −7.09 / +4.09 static, −7.09 / +1.00 interactive | equal |
| text wrapper without the `label` class | −3.09 px | unchanged | equal |
| `bare` on every row | −3.09 px | unchanged | equal |
| `bare` never set | 0.00 | −4.00 / **+17.09** (hangs below the line; interactive +9.00 / +17.09) | equal |
| the dropped override (`.icon-row { align-items: baseline } .icon-slot { align-self: flex-start }`) | 0.00 | −4.00 / **+17.09** (as `bare` never set; interactive +9.00 / +17.09) | **equal** |

Wrapping twin ("Blocked by the review of the scheduler" in a 120 px block): static wraps over 3 lines, first line 4 px
below the host's top; an enabled interactive pill keeps one line (truncates, R-09).

## R-04 (d): the pulse under `hidden`, `display: none`, `<details>`; R-04 (b), (d): `moveBefore()`, `hidden="until-found"`

Stand-in `spike-ring`: shadow root `<span class="dot">`, with `<span class="ring">` added while the `pulse` attribute is
set, the ring `position: absolute; inset: 0; opacity: 0; animation-name: spike-pulse; animation-duration: 1600ms;
animation-timing-function: cubic-bezier(0.2, 0, 0, 1); animation-iteration-count: 3` (end time 4800 ms), keyframes
`from { inset: 0; opacity: 1 } to { inset: -0.25rem; opacity: 0 }`, in an adopted sheet. Read: the ring's
`getAnimations()`, each `Animation` numbered by a `WeakMap` (same number = same object), its `playState` and
`currentTime` (ms, rounded). Times are wall-clock waits, so currents are approximate.

| Case | Readings in order | What it shows |
|---|---|---|
| `hidden` on the parent at ≈500 ms, removed 300 ms later | #1 running 483 → hidden: none → revealed: **#2** running 50 | cancelled while hidden; a new run on reveal (a start case) |
| `display: none` on an ancestor (class), removed 300 ms later | #1 running 500 → none → **#2** running 50 | the same as `hidden` |
| `<details>` closed at ≈500 ms for 300 ms (less than one run) | #1 running 483 → closed: #1 running 533 → +300: #1 running 833 → opened: #1 running 883 | the run goes on while closed; opening shows its remainder, no new run |
| `<details>` closed at ≈500 ms for 5000 ms (more than one run) | #1 running 483 → closed 5000: #1 finished 5483 → opened: none → +500: none | ended while closed; **no run on opening** |
| indicator connected (with `pulse`) inside a closed `<details>`, opened at ≈600 ms | #1 running 0 (at 50 ms) → #1 running 483 → opened: #1 running 533 | the run starts while closed; opening continues it |
| the same, opened after 5050 ms | #1 running 0 → #1 finished 5000 → opened: none | ended while closed; no run on opening |
| `pulse` set inside a closed `<details>`, opened at ≈600 ms | #1 running 0 → opened: #1 running 550 | the same as connecting while closed |
| the same, opened after 5000 ms | #1 running 0 → opened: none | no run on opening |
| `moveBefore()` into another parent at ≈500 ms (`typeof Element.prototype.moveBefore` = `"function"`) | #1 running 483 → moved: **#1** running 533 → then `append()` (remove and insert): **#2** running 33 | a state-preserving move keeps the same animation and its time; a remove-and-insert starts a new run |
| `hidden="until-found"` on the parent at ≈500 ms for 300 ms, then removed | #1 running 500 → #1 running 550 → #1 running 850 → revealed: #1 running 900 | like `<details>`: kept while hidden, not a start case |
| `hidden="until-found"` for 5000 ms, then removed | #1 finished 5483 → revealed: none | ended while hidden; no run on reveal |

All as research.md R-04 states; the US1-4 (d) scenarios can pin these as written.

## R-05: the metric term's name, and a hiding that find-in-page skips

Stand-in `spike-metric`: shadow root `<dl class="metric"><div class="pair"><dt part="label"><span class="eyebrow"
aria-hidden="true">Open missions</span><span class="written">Open missions</span></dt><dd part="value">12</dd></div></dl>`,
`dt { position: relative }`, `.eyebrow { text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.75rem }`, and the
`.written` hiding varied. Read: Chromium's full accessibility tree over CDP (`Accessibility.getFullAXTree`), the
unignored subtree of the `term` node; `window.find("Open missions")` repeated until it returns false (case-insensitive,
so the uppercase span matches too).

| `.written` hiding | term's name | unignored nodes under the term | find matches |
|---|---|---|---|
| planned: `position: absolute; inline-size: 0; block-size: 0; overflow: hidden; white-space: nowrap` | **"Open missions"** | one StaticText "Open missions" (and its InlineTextBox) | **2** |
| planned + `user-select: none` | "Open missions" | the same | 2 |
| `position: absolute; font-size: 0; white-space: nowrap` | "Open missions" | the same | 2 |
| `position: absolute; opacity: 0; inline-size: 0; overflow: hidden` | "Open missions" | the same | 2 |
| `position: absolute; clip-path: inset(50%)` (a percentage, not token-only) | "Open missions" | the same | 2 |
| `position: absolute; content-visibility: hidden; inline-size: 0; block-size: 0` | "" | none | 1 |
| `position: absolute; visibility: hidden` | "" | none | 1 |

The planned hiding works as R-05 says: the term is named by the written text, not upper-cased, and the copy adds no
other node (the `aria-hidden` span adds none). No token-only hiding was found that find-in-page skips while the term
keeps its name: every hiding that find skipped also removed the name. So phase 3 keeps the planned hiding and the
scenario pins **two matches per label** (the known limitation R-05 records).

## R-07: an author `Highlight` background under forced colours

Stand-in: a `<button class="control pressed">` and an `<a class="control pressed" href>` in a shadow root, with
`@media (forced-colors: active) { .pressed { background-color: Highlight; color: HighlightText; border-color:
Highlight } }`; a twin adds `forced-color-adjust: none`; a third control has no rule. Forced colours by
`page.emulateMedia({ forcedColors: "active" })`; system colours resolved on a probe element in the same mode.

| | background | colour | border |
|---|---|---|---|
| system colours | `Highlight` = rgba(5, 0, 73, 0.8) | `HighlightText` = rgb(255, 255, 255) | |
| pressed button, no `forced-color-adjust` | rgba(5, 0, 73, 0.8) | rgb(255, 255, 255) | rgba(5, 0, 73, 0.8) |
| pressed link, no `forced-color-adjust` | rgba(5, 0, 73, 0.8) | rgb(255, 255, 255) | rgba(5, 0, 73, 0.8) |
| pressed, with `forced-color-adjust: none` | the same | the same | the same |
| no rule (button / link) | `Canvas` rgb(255, 255, 255) | `ButtonText` rgb(0, 0, 0) / `LinkText` rgb(0, 0, 159) | the same as the colour |

A screenshot pixel inside the pressed button's ground reads rgb(55, 51, 109), `Highlight` at 0.8 over white, so the
author system colour is drawn, not only computed. **`forced-color-adjust: none` is not needed**; the pressed rule of
R-07 stands as written.

## R-08: `:focus-visible` after a programmatic refocus, and the refocus order against `ocelle-tooltip`'s `slotchange`

Stand-in `spike-switch`: shadow root `<ocelle-tooltip text="Blocked by the review"><button class="control">` (the merged
tooltip from the browser build). Its switch replaces the control with an `<a class="control" href>` (or back) by
`replaceWith` (as a commit does), then focuses the new control either at once ("sync") or in a queued microtask; a
capture listener on the tooltip's own shadow root logs its `slotchange`. The control was focused by Tab from a button
before it (so it matched `:focus-visible` and the tooltip showed).

| Refocus | Order logged | after the commit | new control `:focus-visible` | tooltip shown after 100 ms |
|---|---|---|---|---|
| microtask | commit, **tooltip slotchange, refocus** | focus on nothing in the shadow root | **true** | **true** |
| sync | commit, refocus, tooltip slotchange | the same | true | **false** (the tooltip's `slotchange` reset its focus state after the `focusin`) |
| microtask, `focus({ focusVisible: true })` | commit, slotchange, refocus | the same | true | true |
| microtask, the control focused by a mouse click first | commit, slotchange, refocus | the same | **false** | false |

So the order R-08 relies on holds with the real tooltip (the `slotchange` is dispatched before a microtask queued after
the commit), and Chromium's heuristic keeps `:focus-visible` for a programmatic focus that follows a focus-visible
control even though that control was removed first (focus was on nothing in between); it gives none after a pointer
focus. No `focus({ focusVisible })` is needed.

## R-03, US1-8: the tree for `ElementInternals` role `img` and a host `aria-label`

Stand-in `spike-img`, written as 005's `expose(internals, name, true)` behaves: with a `label` attribute,
`internals.role = "img"`, `internals.ariaLabel = label`, `internals.ariaHidden = null`; without one, `role = null`,
`ariaLabel = null`, `ariaHidden = "true"`. Read: the host's node from `Accessibility.getPartialAXTree` over CDP.

| `label` (internals) | host `aria-label` | Chromium's node |
|---|---|---|
| "Online" | "Busy" (present) | role `image`, name **"Busy"** |
| "Online" | "" (blank) | role `image`, name **""** |
| none | "Busy" (present) | **ignored** (`ariaHiddenElement`), role `none`, no name |
| none | "" (blank) | **ignored** (`ariaHiddenElement`), role `none`, no name |
| "Online" | absent (control) | role `image`, name "Online" |
| none | absent (control) | ignored (`ariaHiddenElement`) |

So a host `aria-label` overrides the internals' name, a blank one leaves the image with an empty name, and an
unlabelled indicator stays hidden whatever the host's `aria-label` (the internals' `ariaHidden` holds). These are the
values T012 pins for US1-8, written by hand from this table.

## R-09: the fractional overflow measure under `text-overflow: ellipsis`

A span `display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 14px` with
"Blocked by the review of the scheduler", in `dir="ltr"` and `dir="rtl"`; its natural width W from a `Range` over its
contents (253.25 px), then its `inline-size` set to W, W − 0.1, W − 0.02 and W / 2. Overflow = the `Range`'s inline end
past the span's (left edges in right-to-left).

| Inline size | span | `Range` width | excess | overflow | `scrollWidth` / `clientWidth` |
|---|---|---|---|---|---|
| exact (W) | 253.25 | 253.25 | 0 | **false** | 253 / 253 |
| W − 0.1 | 253.140625 | 253.25 | 0.109375 | **true** | 253 / 253 |
| W − 0.02 | 253.21875 | 253.25 | 0.03125 | true | 253 / 253 |
| W / 2 | 126.625 | 253.25 | 126.625 | true | 253 / 127 |

Right-to-left gives the same figures on the inline start. The `Range` box is unclipped under `text-overflow: ellipsis`
(its width stays 253.25), so the measure of R-09 works as planned; the integer `scrollWidth` and `clientWidth` miss
both sub-pixel cases. Widths snap to 1/64 px (LayoutUnit), so "0.1 px" is 0.109375 px of layout.

## R-09: a tooltip enabled while its trigger has keyboard focus

`<button id="before">`, `<ocelle-tooltip text="Blocked by the review" disabled><button id="trig">`, `<button
id="after">`; the trigger focused by Tab (it matches `:focus-visible`); then `disabled = false`.

| Step | Bubble shown |
|---|---|
| trigger focused by Tab while the tooltip is disabled | false |
| tooltip enabled while the trigger keeps focus (read after 700 ms) | **false** |
| Tab away and Shift+Tab back | **true** |
| disabled and enabled again while focused | false |
| `blur()` and `focus()` by script (the trigger had keyboard focus, so it matches `:focus-visible` again) | true |

So a pill that becomes truncated while its control has focus shows no tooltip until focus leaves and comes back; the
README rule of T057 states this.

## Notes for later phases (no stop)

- **Icon-only static pill height** (phase 4, § US3 baseline): a static `bare` pill is 29.19 px tall (compact 27.78
  px), 3.10 px (3.39 px) taller than a labelled one, because the row's baseline is the icon wrapper's bottom and the
  `.pill`'s line box adds the strut's descent below it; the interactive `bare` pill is 26.09 px (24.39 px), since its
  control is a flex container with no line box. The § US3 body pins the icon-only box "where T002 measured it", which
  is the table above; no scenario says an icon-only pill has its density's labelled height.
- **The dropped-override plant** (phase 4, § US3 baseline): with `.icon-slot { align-self: flex-start }` beside it,
  `.icon-row { align-items: baseline }` leaves the icon wrapper's and the `.label`'s block-starts equal (0.00 px), so
  the "wrappers' block-starts then differ" reason in contracts/checks.md does not hold. The plant is still caught by
  the same body: its icon-only pill hangs below the line (+17.09 px instead of +4.09 px), as with `bare` never set.
  Recorded for the phase-4 notes; the body as written still kills the plant.
