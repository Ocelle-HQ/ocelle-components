# Research: Workflow and Screen Layouts

Decisions behind [plan.md](plan.md). Each entry gives the decision, why, and what else was considered. "Measured"
means measured in this container's Chromium (build 1243, Playwright's `chromium.launch()`), on 2026-11-13, with the
probe in the orchestrator's scratchpad. The probe is not part of the repository; each phase's tests measure the same
behaviour again in the repository's harness.

## R-01 Where the region and group roles live (FR-002, FR-010, FR-019)

**Decision.** The role of the scroll box (`group` for the scroller and for #13, `region` for the board; operator
decision PLAN-A11Y-SECURITY-1-006 (b)), and the group role of the lane, are on an element in the element's own shadow
root (the scroll box; the lane's group wrapper), never on the host. The module takes the role as a constructor option
(`role`, default `"group"`; contracts/overflow-region.md § Inputs). The element observes the
host's `aria-label` (`observedAttributes`, as 005's elements do) and gives the inner node the name FR-010 and FR-019
define:

- the host's `aria-label`, trimmed, when it holds a non-whitespace character;
- otherwise the element's own `label`-based name.

The host's attribute is never rewritten.

**Why (measured).**
- A custom-element host with a non-empty `aria-label` and no role is exposed by Chromium as a `generic` node with that
  name. Putting the role on the host through `ElementInternals` (`internals.role = "region"`, `internals.ariaLabel`)
  lets a non-empty host `aria-label` win, as ARIA says.
- But a blank host `aria-label` (`""` or `" "`) gives a `generic ""` node: the internals role is dropped and the
  internals name is not used as a fallback. The spec makes a blank host `aria-label` count as absent, with the region
  or group still named by `label` (US1-12, US2-6). Only an inner node can do that.

**Consequence for the tests.** A host with an `id` is already an unignored unnamed `generic` (005's finding). With a
non-empty host `aria-label` it is a `generic` named by it. The scenarios assert:
- exactly one node of the stated role and name;
- nothing else named with the title or count text.

They do not assert that the host is absent. The README names the host node.

**Why `group` for the scroller (operator decision).** Chip and tag rows repeat per card. As `region` landmarks, a
board of five lanes with a tag row per card would put dozens of landmarks named "Tags" in the landmark list, the
crowding the spec's "Lane semantics" assumption rejects for lanes. A named `group` keeps the tab stop's name without
adding a landmark. The board, one per screen, stays a `region`. The README still says to give every scroller a
`label`, and that a scroller repeated per item takes a name that identifies the item ("Tags of WP-12"); the board and
lane stories' nested scroller uses such a name.

**Host ARIA scope (PLAN-CORRECTNESS-1-005 (a)).** 005's README § Host ARIA states, for the whole package, that a
blank host `aria-label` leaves the element unlabelled even with a `label` (pinned by `test/node/readme.test.ts`). For
these elements a blank host `aria-label` counts as absent, for the reason measured above: only an inner node can keep
the `label` name when the host's attribute is blank. The section is rewritten to scope each rule: the icon and the
brand mark, blank decides (unchanged behaviour); the scroller, the board and the lane, blank counts as absent, with
this entry's reason; list-detail takes no name. The new README items go into `readme.test.ts` red first, and the old
package-wide sentence is replaced there by its scoped form (phase 2).

**Alternatives.** Role on the host through internals: rejected, because of the blank-label measurement above. Copying
the host `aria-label` and removing the attribute: rejected, because 005 forbids rewriting the host's ARIA. `region` for
every labelled scroller with item-specific names in the README (option (a) of PLAN-A11Y-SECURITY-1-006): not taken by
the operator.

## R-02 Arrow keys and reduced motion (FR-006, FR-009, US1-5, US1-11; SPEC-1-08)

**Decision.** The overflow-region module handles `ArrowLeft` and `ArrowRight` itself, only when the keydown's
composed target is the scroll box and no modifier is involved: `altKey`, `ctrlKey`, `metaKey` and `shiftKey` are all
false (PLAN-A11Y-SECURITY-1-004). It reads no `isComposing` (below, "Composition"). A modified arrow is left to the
browser untouched: Alt+ArrowLeft and Alt+ArrowRight are history navigation in Chrome on Windows and Linux, Ctrl,
Alt and Meta arrows are word-jump and assistive-technology keys, and Shift+Arrow has no scroll meaning the spec asks
for, so the simplest rule is to leave it to the browser too. For a handled key the module:

- it calls `preventDefault`;
- it moves `scrollLeft` by 40 px in the key's visual direction with an instant assignment, so no browser smooth
  scrolling is involved;
- at the extent it still calls `preventDefault` and changes nothing, so the page does not scroll.

Keys whose target is a descendant are not touched (US1-10). `Home`, `End`, `PageUp` and `PageDown` are not handled:
the browser's default applies, and the element does not call `preventDefault` on them. The tests assert that, not a
scroll result. US1-5's test also presses Alt+ArrowLeft, Ctrl+ArrowRight, Meta+ArrowRight and Shift+ArrowRight on the
focused box, with real input, and asserts that none is default-prevented and that `scrollLeft` does not change. Its
plant is a handler with no modifier check.

**Composition (analysis B1, operator decision (b)).** A text composition (IME) starts only on an editable focus
target: a text `input`, a `textarea` or an editing host. The scroll box is a `div` in the element's shadow root with
no `contenteditable`, and an editing host in the light DOM does not make shadow content editable, so focus on the box
cannot start a composition and a keydown whose composed target is the box always has `isComposing` false. Keys pressed
during a composition in a slotted text control have that control as their composed target, and the module already
leaves them untouched (US1-10). An `isComposing` check would therefore never change an outcome: its removal is an
equivalent mutant, and no test can tell it apart. The operator chose to drop the check and the clause rather than keep
a guard that cannot be tested (constitution V and VIII): US1-5 and FR-006 no longer name composition, and
contracts/overflow-region.md handles the unmodified arrows on the box with no `isComposing` condition. Option (a), a
driver composition method (CDP `Input.imeSetComposition`) and a US1-5 case, was not taken: it would compose on a
target that real input cannot reach.

**Why (measured).** Chromium's own arrow-key scrolling of a focused scroll box is 40 px, but animated: `scrollLeft`
was 0 right after the key press and 40 after 300 ms, also in a context with `reducedMotion: "reduce"`. Under reduced
motion FR-009 allows nothing to animate, so the element cannot rely on the browser here. `End` on a focused
horizontal scroll box moved nothing horizontally.

The reduced-motion outcome is tested as "the final position is reached within one frame of the key". With the instant
assignment that holds with and without the preference.

**Keys from a focused slotted control (PLAN-FRESH-2-003 (a), operator decision).** With focus on a slotted button or
link, the browser scrolls the item's nearest scroll container, the strip, on an arrow key, and animates it under
reduced motion too. Measured (squad round 2, reduced motion emulated, a 300 px `overflow-x: auto` box of twelve 80 px
items, focus on the second, a real ArrowRight): `scrollLeft` per frame 0, 0, 3, 8, 14, 22, 29, 35, 38, 40 for buttons
and 0, 2, 6, 11, 19, 26, 33, 37, 40 for links, focus staying on the item. The module leaves descendant keys untouched
(FR-006, US1-10), so that scroll is the browser's, not the element's. FR-009 and US1-11 say so since the plan gate:
the element itself never animates and never sets smooth scrolling, and the browser's own keyboard scrolling from a
focused slotted control is outside the element and may animate. The README states it (phase 2 Records, red first in
`readme.test.ts`). US1-10's test asserts that the key is not prevented, as before; US1-11's test asserts the box-focused
key and the fades only.

**Alternatives.** Leaving the keys to the browser (FR-006 allows it): rejected because of FR-009. Home and End to the
inline ends: useful, but behaviour the spec does not define; a later MINOR addition if a consumer asks. Taking
unmodified arrows from non-text descendants too, with the same instant scroll (option (b) of PLAN-FRESH-2-003): not
taken by the operator; it would take keys a slotted widget may own.

## R-03 Overflow state and what updates it (FR-002, US1-3; SPEC-1-07)

**Decision.** The module observes three sources:

- **Size.** One `ResizeObserver` on the scroll box (its border-box size, so a horizontal scrollbar that appears or
  goes is a size event, R-05) and on its track, the shadow element that wraps the default slot at its `max-content`
  inline size (content size). A change to slotted content changes the track's size
  even when no assigned element's own size changes, such as text deep in light DOM or an element added inside a slotted
  container.
- **Slot.** `slotchange` on the default slot (items added or removed).
- **Scroll.** A passive `scroll` listener for the edge state.

**Overflow** = `scrollWidth − clientWidth > 1`. With `scrollLeft` (negative under `rtl` in Chromium, as the standard
says), the edges are:

- **start** = `|scrollLeft| > 1`;
- **end** = `scrollWidth − clientWidth − |scrollLeft| > 1`.

The state is written in the observer callback, which runs before paint, so the frame in which the resize is observed
paints it. Lit's update runs in the microtask checkpoint after that callback.

**Testing the bound (PLAN-TESTABILITY-1-004 (a)).** US1-3's "within one animation frame after the resize is observed"
is tested at that bound, not by a two-frame wait. The test registers its own `ResizeObserver` on the scroll box after
the element has connected (observers are notified in creation order, so its callback runs after the module's in the
same delivery) and asserts `tabindex` and the role synchronously in its callback, and again after awaiting
`host.updateComplete` there. The plant is "the module's state write moved into a `requestAnimationFrame`": the
write then lands in the next frame, after the test's callback, so the assertion fails. An assertion in the first
`requestAnimationFrame` after the test's callback would not fail against that plant (the module's deferred frame
callback runs first, with its update in the checkpoint after it), so the assertion stays in the observer callback.
Every other scenario settles with the driver's two-frame `settle()` (R-17).

**The board (PLAN-FRESH-1-006 (b)).** For the scroller the track is the content's max-content, so a content change
resizes it. The board's lanes are contained (R-08), so the track's inline size no longer depends on what the lanes
hold. A change inside a lane that changes only a descendant's inline size (a fixed-width element widened in the last
lane) changes the box's `scrollWidth` but neither the box's nor the track's size. FR-014 (operator decision) reads
FR-002 for the board as: such a change is picked up at the next size, slot or scroll event. A change that also
changes a lane's block size (a card added) resizes the track, so it is picked up within one frame. The plan-level
SPEC-2-06 test adds its wide content after the first render, as a new card whose block size grows the last lane, and
asserts the board becomes a tab stop and region within one frame.

**Alternatives.** A `MutationObserver` on slotted subtrees: not needed for the scroller once the track's size is
observed, and costly on large boards. For the board it would catch the width-only change; the operator kept the cost
out (option (a) of PLAN-FRESH-1-006 not taken). A `ResizeObserver` on each lane would not see it either: the lane's
size is fixed by its containment.

## R-04 Ring room (FR-001, FR-014; SPEC-1-01 and SPEC-2-02 fixes)

**Decision.** The ring room `calc(var(--ocelle-focus-offset) + var(--ocelle-focus-width))` (5 px) is placed as follows:

- **Block direction.** Block padding of the scroll box, for every host of the module: the scroller, the board and
  #13 (`.region-box` in contracts/overflow-region.md). The board adds no block room of its own to its lanes row, so
  the room comes from one place (PLAN-CORRECTNESS-1-012).
- **Inline direction.** Inline padding of the track, which is inside the scrollable content, so the room is before the
  first and after the last item and counts as content for the overflow rule.

The scroll box has `overflow-x: auto; overflow-y: hidden`. With the block room in its padding, a slotted control's ring
fits inside it.

**The native scrollbar (PLAN-FRESH-1-003 (a), operator decision).** The box keeps the platform's own horizontal
scrollbar: it is the only drag affordance for a mouse user without a horizontal wheel. On a platform with classic
scrollbars (Windows, most Linux desktops, "always show scrollbars") the scrollbar takes block space between the
box's padding box and its border, so the box's block size is the content's, plus the ring room on each block side,
plus the scrollbar's thickness; FR-001 and US1-13 say so. With overlay scrollbars the thickness is 0. Headless
Chromium hides scrollbars (`--hide-scrollbars`, which Playwright adds in headless runs), so every test and baseline
sees the overlay case. One `elements-browser` test launches Chromium with `ignoreDefaultArgs: ["--hide-scrollbars"]`
and asserts, for an overflowing scroller and an overflowing board: block size = content + 2 × ring room + scrollbar
thickness (`offsetHeight − clientHeight`, measured and greater than 0 in that run); the ring room is above the
scrollbar; the scrollbar is not faded while the content above it is (R-05); and the handover ring of R-07 shows over
the scrollbar band.

**Why.** Padding of the scroll container itself is inside the scrollport but, at the inline end, depends on the
engine's scrollable-overflow rules. Padding of a track element is ordinary content size in every engine.

## R-05 The fade and the scroll box's own ring (FR-005, FR-007, FR-008, US1-7, US1-9; SPEC-1-09)

**Decision.**

- **Fade.** The fade is a `mask-image` on the scroll box. Its fade layer is a `linear-gradient` from `transparent` to
  an opaque token colour (`var(--ocelle-color-ink)`; only alpha matters in a mask) over `--ocelle-scroller-fade-size`
  at each fading edge. One rule per edge state selects it from the module's `fadeAttribute` output:
  `.region-box[data-fade="start"]`, `[data-fade="end"]` and `[data-fade="both"]`, never attribute presence alone.
  When nothing fades the output is `undefined` and the host binds it with `ifDefined`, so the box has no `data-fade`
  attribute, matches no mask rule, and is not a stacking context (PLAN-FRESH-2-006). `:host(:dir(rtl))` rules mirror
  the gradient direction.
- **The scrollbar stays unmasked (PLAN-FRESH-1-003 (a); mechanism re-decided at squad round 2, PLAN-FRESH-2-001
  (a)).** The scrollbar belongs to the scroll box itself, and every element inside the box scrolls with the content,
  so the mask cannot move to an inner element and still stand still over the viewport. It stays on the box. Clipping
  does not keep it off the scrollbar: measured in squad round 2 (classic 15 px scrollbar, `--hide-scrollbars` off),
  Chromium applies a box's mask to its scrollbar whatever `mask-clip` says (`padding-box`, `content-box` and
  `border-box` gave the same pixels, and the round-1 three-layer `exclude` composite gave exactly a plain fade's). Only
  the layers' geometry is honoured: a layer sized to the client height with a border-box origin leaves the band below
  it to the next layer. So the mask has two layers, both `mask-origin: border-box`, `mask-clip: border-box`,
  `mask-repeat: no-repeat`, `mask-composite: add`:
  - the fade layer (the per-value gradient above) at the block start, `mask-size: 100% <client>px`, where `<client>` is
    the box's `clientHeight`, which excludes the scrollbar;
  - an opaque layer (`linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink))`) at the block end,
    `mask-size: 100% <bar>px`, where `<bar>` is the scrollbar's thickness, `offsetHeight − clientHeight` less the
    box's block borders (0 px with overlay scrollbars, so the fade layer then covers the whole box).

  The images, positions, origins, clips, repeat and composite are in the shared `overflowRegionStyles`. The two
  `mask-size` figures are measured layout figures, so they are set in the module's own per-instance constructed
  stylesheet, adopted on the host's shadow root after the shared sheets, with one rule `.region-box {}` whose
  `mask-size` declaration is set through `CSSStyleRule.style.setProperty`, as R-13 does for list-detail (never
  `element.style`, which writes a `style` attribute; constitution IV). The module reads and writes them in the same
  callback that writes the edge state (R-03), and writes only when a figure changed. A scrollbar that appears or goes
  changes the box's border box but not its content box, so the module observes the box with `{ box: "border-box" }`
  (contracts/overflow-region.md § Lifecycle). The scrollbar test of R-04 proves it: with `--hide-scrollbars` off, at a
  faded edge the scrollbar's pixels equal those of a twin plain `overflow-x: auto` box of the same size, content and
  `scrollLeft`, within the pixel tolerance of 005's `pixels()`, and the content pixels just above the scrollbar are
  faded. Its plant is the fade layer sized to the whole box (no measured block size). This makes the module the
  second user of a per-instance sheet of measured figures, after list-detail; FR-030 and the README name the pattern
  (R-13 § Setting them; PLAN-FRESH-2-005 (a)).
- **Ring.** The scroll box's focus ring is not drawn on the masked box. It is drawn by a sibling overlay element in
  the shadow root, positioned over the box, inset by the ring width, with no pointer events, and shown by
  `.box:focus-visible ~ .ring`. So the mask never fades it. The overlay is `aria-hidden` and adds no node. The same
  overlay draws the handover ring of R-07.
- **Edge elements.** Two edge elements, likewise siblings and `aria-hidden`, are always laid out: absolutely
  positioned at the box's inline start and end, `inline-size: var(--ocelle-scroller-fade-size)` with
  `box-sizing: border-box`, no pointer events, and nothing painted outside forced colours. They are also the module's
  measure of the fade depth in px (R-06).
- **Forced colours.** Under `@media (forced-colors: active)` the mask is `none`. The edge element on each side the
  module reports as fading draws `var(--ocelle-border-width) solid CanvasText` on its outer inline side
  (`border-inline-start` at the start, `border-inline-end` at the end). The ring overlay uses `Highlight`.
- **No transition.** The fades appear and disappear with no transition at all. FR-009's "at most `--ocelle-motion-fast`"
  is met trivially. A gradient mask does not interpolate usefully.

**Lint (PLAN-CORRECTNESS-1-002 (a), operator decision).** `gates/stylelint/token-only.ts` `functionRaw` classifies
only `var()` and `calc()`; any other function is raw whole, which `gates/test/token-only.test.ts` pins for
`rgb(0 0 0)`. As the rule stands, every `mask-image: linear-gradient(...)` is reported. The `ocelle/token-only` rule
is therefore extended: inside `linear-gradient()` the arguments are classified as at the top level of a value (each
word by `wordAllowed`, so direction keywords such as `to` and `right`, `transparent` and `%` stops pass, and a hex,
a named colour, a raw length and an angle are raw), `var()` and `calc()` are checked as everywhere, and any other
nested function is raw. Every other gradient function (`radial-gradient()`, `conic-gradient()`,
`repeating-linear-gradient()`) stays raw whole. The change is a gate change with red-first tests, plants and a
contract entry (contracts/gates.md), done at the start of phase 2 before the scroller's styles. `CanvasText` and
`Highlight` are identifiers, not named colours, so they pass as they are.

**What the fade tests assert (PLAN-TESTABILITY-1-003).** A fade has no box, and the module's `data-fade` output says
nothing about the mask, its mirror or the ring overlay. `data-fade` is never the assertion of a fade test. US1-6,
US1-7 and US2-2 assert pixels (`driver.pixels()`): with opaque content of a known colour, on two different main
grounds (`color-canvas` and `color-pane`) and in both themes, in `ltr` and `rtl`:

- at a fading edge the composited colour rises monotonically from the ground at the box's edge to the content colour
  over `--ocelle-scroller-fade-size` (32 px at a 16 px root);
- inside that depth on a side without a fade, the pixels are the content colour;
- under `rtl` at the inline start the fade is on the right edge, at the end on the left;
- with the box focused by keyboard, the ring's pixels at a fading edge are the full `--ocelle-color-focus`.

US1-6 also asserts that the scroll box of a fitting scroller, and of the fitting test host (US1-16), has no
`data-fade` attribute and a computed `mask-image` of `none`, beside its overflowing twin whose computed `mask-image` is
not `none`. Its plant is the round-1 binding: `fadeAttribute` `""` bound as `data-fade=""`, with the mask selected on
`[data-fade]` (PLAN-FRESH-2-006). This is a computed-style assertion about the absence of a mask, not a fade
assertion, so it does not contradict "`data-fade` is never the assertion of a fade test".

US1-8 asserts, under emulated forced colours, the computed `border-inline-start`/`border-inline-end` colour, width and
side of each edge element and its box against the scroll box's edge; the edge element of a side with nothing
off-screen has no border. The plants are those of the spec's table (both fades always; both lines always), plus "the
`rtl` mirror rule removed" and "the ring overlay inside the masked box", each of which the pixel assertions catch.

**Alternatives.**
- A gradient overlay painted in the ground colour: rejected, because the element does not know the ground (US1-7: any
  main ground, both themes).
- The ring as an inset `outline` on the box: it would be faded at the edges by the mask.
- Gradients carried as tokens so element CSS says `mask-image: var(...)` only (option (b) of PLAN-CORRECTNESS-1-002):
  not taken by the operator.
- Hiding or thinning the scrollbar (`scrollbar-width`, option (b) of PLAN-FRESH-1-003): not taken by the operator.
- The round-1 mechanism, a fade layer clipped to the padding box with two opaque layers composited with `exclude`:
  Chromium ignores the clip box for the scrollbar (measured, squad round 2), so it fades the scrollbar as a plain fade
  does.
- Letting the fades cover the scrollbar's ends and amending FR-007 (option (b) of PLAN-FRESH-2-001): not taken by the
  operator.

## R-06 Focus clearance and the fade fallback belong to the module (FR-001, FR-014; SPEC-3-01, 3-02, 3-03)

**Decision.**

- **Owner.** The module owns focus clearance. It listens for `focusin` on its host, in the composed tree, so a focused
  element inside a lane, or inside another element's shadow root, counts. Focus on the module's own shadow nodes (the
  box, and the handover node of R-07) is not cleared.
- **When it applies.** When the focused element (`composedPath()[0]`) matches `:focus-visible`, which covers keyboard
  focus and script focus after keyboard use. FR-001 says so since the plan gate (PLAN-CORRECTNESS-1-006 (a)). Pointer
  focus on a button, a link or a chip does not apply: a click on a chip half under a fade does not scroll the strip
  from under the pointer, and the browser's own focus scrolling is all that happens.
- **Text-entry controls (PLAN-A11Y-SECURITY-1-008).** A text `<input>`, a `<textarea>` and a contenteditable element
  match `:focus-visible` on any focus, pointer focus included (the Selectors 4 heuristic Chromium implements). They
  are therefore cleared on any focus, on purpose: they show a ring, and the ring must not sit under a fade. FR-001
  names them, and US1-13 tests the pair: a slotted text input and a slotted button, each half under the end fade,
  clicked; the input is scrolled clear, the button is not moved.
- **Reading the figures (PLAN-CORRECTNESS-1-009).** The arithmetic needs px figures, and an unregistered custom
  property computes to its token text (`--ocelle-scroller-fade-size` computes to `2rem`, and a host override such as
  `calc(1rem + 4px)` to that text), so the module never parses custom-property text. It measures laid-out boxes at the
  time of focus: the fade depth is the inline size of an edge element (R-05; `inline-size:
  var(--ocelle-scroller-fade-size)`), and the ring room is the track's computed `padding-inline-start`, a used px
  value. A 20 px root font size and a `calc()` override of the fade token are element-level cases (R-17).
- **How it scrolls.** It reads the ring box (the focused element's border box grown by the ring room) against the
  scroll box. It scrolls by the smallest amount that leaves the ring box at least the fade depth from each inline edge
  that would then still fade.
- **When the control does not fit.** If the ring box is wider than the box less the fade depths, the module aligns the
  ring box's inline start with the box's inline start and reports the fade on the covering side(s) as suppressed.
- **Ending the suppression (PLAN-A11Y-SECURITY-1-001).** A flag set around the module's own `scrollLeft` assignment
  cannot work: the `scroll` event of that assignment is dispatched in the rendering steps of a later frame (measured:
  after the synchronous code and after the microtasks), when the flag is already reset, so the module would take its
  own scroll for a user's and drop the suppression at once. Instead the module records the `scrollLeft` it wrote. The
  suppression ends on `focusout` from the focused element, or on a `scroll` event whose `scrollLeft` differs from the
  recorded value by more than 1 px (the user scrolled). The browser's clamping of a write is read back once after the
  write, so the recorded value is the position the box really took. The test (US1-13's wide-button case) asserts
  that no fade is drawn over the ring box in each of at least two animation frames after focus, and that a user
  scroll (a wheel event over the box, and an arrow key on the box after Shift+Tab back to it) restores the fade. Its
  plant is the synchronous flag.
- **A control wider than the box** (SPEC-3-03) is aligned the same way and suppresses both fades. Only its start is
  guaranteed visible.
- **Forced colours** (SPEC-3-01). Suppression applies to the forced-colours line too: the module's two edge outputs
  already include it, so the line and the fade can never disagree.
- **SC-001.** SC-001 names the exception since the plan gate: exactly the sides with content off-screen, except while
  the FR-001 fallback suppresses one for a focused control. The wide-button case of US1-13 asserts the fallback, and
  the SC-001 states assert the rule.

**Pointer-focus oracle (PLAN-TESTABILITY-1-005).** "Not moved beyond the browser's own scroll" needs a figure. The
test places, beside the scroller, a twin plain `overflow-x: auto` box with the same content, inline size, ring room
padding and starting `scrollLeft`, and no module. Both receive the same real pointer click on the chip partly under
the end fade. The scroller's `scrollLeft` after the click equals the twin's within 1 px, and the chip's fade side is
not suppressed. The paired positive in the same test: the same chip, focused by Tab, is moved clear of the fade. The
plant is "clearance on every `focusin`".

**Contract.** `contracts/overflow-region.md` lists `fadeStart` and `fadeEnd` (off-screen and not suppressed) as outputs
beside `offStart` and `offEnd`. FR-011 lists them since the plan gate. #13 gets clearance for free when its code block
holds a focusable element.

**Alternatives.**
- Clearance per host: rejected, because three copies would follow (scroller, board, #13).
- Clearance on every focus: rejected, because the strip would jump under the pointer.
- Ending the suppression on user scroll input (`wheel`, `pointerdown`, keys) instead of on `scroll`: it misses a drag
  of the scrollbar thumb and touch panning that start outside the box; the position check sees every user scroll.

## R-07 Focus handover when overflow ends (FR-004, US1-4)

**Decision.** When an update turns overflow off while the scroll box is `document.activeElement` through the shadow
root, the module moves focus:

- **To the first focusable slotted element (PLAN-A11Y-SECURITY-1-002).** The library's own controls keep their
  focusable part in their shadow root or use `delegatesFocus` (packages/styles/README.md, 003's PLAN-FRESH-2-004 (a)),
  so a light-DOM walk would find nothing in a row of library chips. The walk goes over the slot's flattened assigned
  elements in tree order and descends into open shadow roots (and their slots' assigned nodes). A candidate is
  focusable when it is not disabled, has no `inert` ancestor (checked across shadow boundaries, not only on the node
  itself), has a box (`getClientRects().length > 0`) and is not `visibility: hidden` (R-18), and either its `tabIndex >= 0` or it is a shadow host with `delegatesFocus`
  whose shadow root holds such a candidate. It is focused with `focus()`. US1-4 adds two cases: a slotted test element
  whose button is in its open shadow root, and one that delegates focus; the deep active element is that button. The
  plant is the light-DOM-only walk.
- **Otherwise to the element itself, on an inner node (PLAN-A11Y-SECURITY-1-007 (a), operator decision).** The module
  gives `.region-frame`, the shadow wrapper of the box and its overlays, `tabindex="-1"` and focuses it. It removes the
  attribute on the frame's `focusout`. `document.activeElement` is then the host, as FR-004 says, and nothing is
  written to the host: the module has no host effect at all. The frame's ring is drawn by the box's ring overlay
  (`.region-ring`, R-05), not by an outline of the frame (PLAN-FRESH-2-004): `.region-frame:focus-visible >
  .region-ring` shows the same token ring as `.region-box:focus-visible ~ .region-ring`, inset inside the element's
  box, so a clipping ancestor does not cut it, and in `Highlight` under forced colours. An outline of the frame would
  be hidden wherever the masked box, a stacking context painted after the frame's outline, covers the frame's inset
  band: measured in squad round 2, the ring's pixels became the content's under any `mask-image`, and the scrollbar's
  over a classic scrollbar. The overlay is positioned and comes after the box, so it paints over it. base.css cannot
  reach it (it does not style shadow nodes), and it does not depend on whether the page links base.css. US1-4 asserts,
  after a keyboard-driven handover with no focusable content, that the deep active element is the frame, and asserts
  the ring on pixels (`driver.pixels()`): the full `--ocelle-color-focus` on each of the four inset edges inside the
  host's box, inside an `overflow: hidden` container, in a second case after the content has overflowed again while
  the frame holds focus (the box masked and fading), and over the scrollbar band in the scrollbar test of R-04; and
  `Highlight` under forced colours. Plants: the frame's ring rule removed, and the ring as an outline of the frame.
  While it holds focus the frame is an unignored focusable `generic` node; it loses the attribute, and the node, when
  focus leaves.

**Alternatives.** Focusing the host with a temporary `tabindex="-1"` (option (b) of PLAN-A11Y-SECURITY-1-007): its ring
would be base.css's outset ring (page rules beat `:host` rules) or the UA ring without base.css, clipped at container
edges; not taken by the operator.

## R-08 Board and lane layout (FR-013 to FR-016, US2-1 to US2-4, US2-14; SPEC-2-04, 2-06)

**Board layout.**
- **Scroll box.** The board's shadow root is the scroller's structure: a scroll box, a track with the inline ring room,
  the ring overlay and the edge elements. The board constructs the module with `role: "region"` (R-01).
- **Track.** `display: flex; gap: var(--ocelle-space-3); min-inline-size: 100%`, with `box-sizing: border-box`, so a
  fitting board's lanes share the box minus the ring room.
- **Lanes.** `::slotted(*)` gets `flex: 1 1 var(--ocelle-lane-min-width); min-inline-size: var(--ocelle-lane-min-width);
  contain: inline-size`. Every child has the same basis and minimum, so the shares are equal (FR-013), and no child
  takes its min-content as its minimum. The containment is the board's, on every slotted child, so a non-lane child
  is contained like a lane; the lane sets none of its own (analysis F1). The Edge Case "Non-lane children of a
  board" has its own case, with sentence text in a `div` child, whose plant is the containment on the lane host only.
- **Why the containment (PLAN-CORRECTNESS-1-001, measured by the squad).** The track keeps the module's
  `inline-size: max-content`, so its inline-end ring room always follows the last lane. A row flex container's
  max-content is the sum of its items' max-content contributions, not their flex bases, and `min-inline-size` only
  sets a floor. Without containment a lane's contribution is its longest unwrapped card text: in Frame W (876 px)
  five lanes holding one 66-character sentence each gave a 2200 px track (`scrollWidth` 2200 against 876, lanes
  428 px), so the board overflowed at 1280 px, the complaint of spec-kitty-design#507. Lanes holding only "WP01" gave
  876 px, which is why short test cards hide the defect. With `contain: inline-size` each child's intrinsic inline
  size is its `min-inline-size`, the lane minimum, whatever it holds: sentence text, a 60-character identifier, a
  400 px image and a nested 400 px scroller all gave `scrollWidth` 876 and five 164 px lanes in Frame W, and the board
  still overflowed in Frame N (858 > 636, 5 px end room). A `fit-content` or `min-content` track does not do it: a
  nested scroller's and a capped image's min-content contributions still widen the lanes (1108 px and 1098 px), and
  an `auto` track loses the inline-end ring room in Frame N.
- **Test content.** US2-1, US2-3, US2-14 and US2-15 use cards whose text is a sentence wider on one line than a lane's
  share, as the spec's US2-1 now says. US2-14's plants are "min-content minimum" and "the board's
  `::slotted(*)` without inline-size containment"; the second makes US2-1 fail in Frame W.

**Check (FR-015).** Five lanes need 5 × 160 + 4 × 12 = 848 px plus 2 × 5 px of ring room, 858 px, which is less than
Frame W's 876 px. In Frame N (636 px) they overflow. At a 20 px root (R-17) the lanes are 200 px and five need
5 × 200 + 4 × 15 + 2 × 5 = 1070 px, so the board overflows in Frame W.

**Block direction (SPEC-2-04).**
- The track stretches its items (`align-items: stretch`), so lanes are as tall as the tallest one, the kanban
  convention.
- The board takes that block size plus the block ring room of the module's `.region-box` padding (R-04; the lanes
  row adds none), plus the scrollbar's thickness where one is drawn, and never scrolls in the block direction
  (`overflow-y: hidden`, with the room keeping rings inside).
- `ArrowUp` and `ArrowDown` are not handled.

**Lane content.** The lane's content wrapper has `min-inline-size: 0; overflow-wrap: anywhere`. `::slotted(*)` gets
`max-inline-size: 100%`. An image nested inside a slotted card is out of reach of `::slotted()`. Its cap comes from
`base.css`, which gives replaced content `max-inline-size: 100%` (003). So US2-14 runs "with `base.css`", and the
README says a host without `base.css` caps its own nested images. This is a reading of FR-013's "an image … in it",
recorded here for the squad.

**Content that cannot shrink (SPEC-2-06).** A descendant with a fixed inline size overflows its lane visibly
(`overflow: visible`). It paints over the gap and into the next lane, and when it reaches past the board's end it adds
to the board's scrollable overflow, so the board overflows. A plan-level test states both: the overlap is measured
(the descendant's box crosses the lane's inline end), and with the wide content in the last lane the board becomes a
tab stop. The wide content is added after the first render, as a new card that also grows the last lane's block size,
so the observers see it within one frame (R-03, FR-014); a width-only change is the operator's reading of FR-002 and
is not asserted within a frame. The README tells hosts to wrap such content in an `ocelle-scroller` (FR-013).

## R-09 Lane naming and the count (FR-018, FR-019; SPEC-1-14)

**Shadow structure.** A wrapper `div` that carries the group role and name (R-01) holds:
- the visible header, `aria-hidden="true"`, with the title `span` and the count `span`;
- the content slot.

Without a title and without a shown count, the wrapper has no role and no `aria-label` (FR-019).

**Count.**
- **Attribute.** After trimming, it is accepted only as decimal digits (`^[0-9]+$`) whose value is at most
  `Number.MAX_SAFE_INTEGER`. `" 3 "` and `"03"` are accepted; `"+3"`, `"3e0"`, `"3.0"`, `"-1"`, `"2.5"`, `"abc"` and
  an empty string are not.
- **Property.** It accepts a safe integer of 0 or more; anything else counts as absent.
- **Shown and named form.** `String(value)`: plain digits, no grouping and no leading zeros, so `"03"` shows "3". No
  locale formatting, because a locale-formatted number would be a built-in convention the operator ruled out (no
  built-in words).

**Name.** `"<title>, <count-label or count>"`, `"<count-label or count>"` without a title, or `"<title>"` without a
shown count. The title and `count-label` are trimmed.

## R-10 The lanes' grounds (US2-4, US2-7, US2-11; SPEC-1-15, PLAN-CORRECTNESS-1-011)

**Flat lane.** The board paints no ground: it is layout only. A flat lane therefore sits on the host's ground. The flat
lane's colours are `--ocelle-color-ink-soft` for title and count, and their text pairs are checked on every main
ground (002). The README says the board and flat lanes go on a main ground. The flat-lane stories render on
`color-canvas`, the preview's ground.

**Default lane (operator decision PLAN-CORRECTNESS-1-011 (b)).** `color-canvas`, `color-panel` and `color-inspector`
are the same value in both themes (`#F1EEE8` light, `#15130F` dark; packages/tokens/src/source.ts), so a lane on a
`color-panel` ground would show no ground and no corners on the canvas, in a panel or in an inspector, and the
default and flat lanes would differ by a few pixels. The default lane's ground is `--ocelle-color-sheet` (`#FBFAF7`
light, `#211E18` dark), the ground cards use, which differs from canvas, panel and inspector, and from `color-pane`
(`#FFFFFF`, `#1C1A15`) and `color-rail` (`#E9E5DD`, `#1C1A15`), in both themes. Its title and count colours
(`color-ink`, `color-ink-muted`) are checked text pairs on `color-sheet`, a main ground, so no contrast pair is added.
The default-lane stories render on `color-canvas`.

A test asserts, in light and in dark, that the default lane's computed `background-color` differs from the computed
values of `--ocelle-color-canvas`, `--ocelle-color-panel`, `--ocelle-color-inspector` and `--ocelle-color-pane` (each
resolved through `driver.resolveColour()`), and a token test pins that `color-sheet` differs from those four records
in both themes, so a later token change that merges them fails here. Plant: the lane ground set to
`--ocelle-color-panel`.

A consequence, recorded for #8: a card that uses `color-sheet` as its own ground has no ground of its own inside a
default lane; it keeps whatever border or shadow #8 gives it. A host that wants grounded cards on a board uses the
`flat` lane.

## R-11 list-detail layout (FR-022 to FR-027, US3-1 to US3-5, US3-13, US3-14)

**Tier.** The element computes a tier (`three`, `two` or `one`) from its measured inline size (R-12, R-13) and from
`narrow`. It writes the tier to an internal reactive state, which the template renders as a `data-tier` attribute on
the shadow grid. The host's attributes are not touched.

**Grid.** One shadow grid:

| Tier | Columns | Inspector |
|---|---|---|
| `three` | `var(--ocelle-list-track-width) minmax(0, 1fr) var(--ocelle-shell-inspector-width)` | its own column |
| `two` | `var(--ocelle-list-track-width) minmax(0, 1fr)` | stacked in the detail column's second row |
| `one` | `minmax(0, 1fr)` | stacked under the detail |

In the one-column tier the panes that are not shown are `display: none` (no box, no node), following `detail-open`.

**Borders.** `border-inline-start: var(--ocelle-border-width) solid var(--ocelle-color-rule)` on the detail pane and on
the inspector when it is a column. `border-block-start` on the inspector when it is stacked. Forced colours turn these
into `CanvasText` by the user-agent's forced colour of `border-color` (tested).

**Widths include the rule (operator decision PLAN-CORRECTNESS-1-003 (a)).** The inspector's border sits inside its
fixed 19rem track, and the detail's inside its `1fr` share, so `--ocelle-shell-inspector-width` is the inspector's
border-box width (304 px, content 303 px) and the three-column max-content is 288 + (480 + 1) + 304 = 1073 px for a
30rem detail block (measured by the squad in a 1196 px flex row). FR-023 and US3-12 say so.

**Empty inspector (PLAN-CORRECTNESS-1-007).** `slotchange` fires only on a slot in the shadow tree, so the `inspector`
slot is always rendered. `slotchange` on it sets the internal `hasInspector` state. While it is false the slot's pane
wrapper is `display: none` and outside the grid template: no track, no border and no space (FR-024). Only the track,
the border and the space depend on `hasInspector`, never the slot. US3-8's test slots an inspector after the first
render (three columns in Frame R), then removes it (two columns again). Plant: the slot rendered only when an
inspector is present.

**Tree.** The panes are plain `div`s with no role and, at rest, no `tabindex` (FR-029, US3-14, R-14).

## R-12 The `*-below` grammar and resolution (FR-025, FR-034; SPEC-3-04)

**Grammar.** After trimming ASCII whitespace, the value must match
`^(?:0|[0-9]+(?:\.[0-9]+)?(?:px|rem|em))$`, units matched ASCII case-insensitively, as CSS does.

| Accepted | Rejected |
|---|---|
| `0`, `0px`, `0rem`, `56rem`, `55.5rem`, `880px`, `55em`, `56REM` | `+56rem`, `.5rem`, `56.rem`, `5.6e1rem`, `-0`, `-1rem`, units other than the three, `%`, `calc()`, `var()`, unitless numbers other than `0`, `wide`, empty |

US3-10's lists gain `56REM` (accepted, one column in Frame W) and `+56rem`, `.5rem`, `56.rem`, `5.6e1rem` and `-0`
(rejected, two columns in Frame W). FR-025 states this grammar exactly since the plan gate (PLAN-CORRECTNESS-1-006 (a)):
`.5` is a CSS number but not one of FR-025's forms.

**Resolution.** It is re-read at every measurement:

| Unit | Resolved against |
|---|---|
| `px` | as is |
| `rem` | the root element's computed `font-size` |
| `em` | the host's computed `font-size` |

**Default.** `getComputedStyle(host).getPropertyValue("--ocelle-list-detail-collapse")` (respectively `-inspector-
collapse`), trimmed and parsed with the same grammar. A value that does not parse gives the published default (40rem,
60rem), held as constants that a test compares with the token source.

**Comparison.** Exclusive: the narrower tier applies when `measured < threshold`.

**Convention.** The README's container-tier convention copies this grammar exactly, for #8 and #12.

## R-13 Intrinsic sizes in a shrink-to-fit host (FR-025, US3-12; SPEC-1-05, SPEC-2-09) — spike first

FR-025 asks that the element's max-content size be its three-column layout's and its min-content size its one-column
layout's, whatever tier it shows, so a shrink-to-fit host cannot make the tier alternate. Hidden panes have no box
(FR-027), so CSS alone sizes the element from the shown panes only.

**Decision (to be proven by a spike before phase 4's red step).**

- **Measurement pass.** In one task, with no paint between, it renders all panes in the three-column grid, reads the
  max-content and min-content inline sizes of the three-column grid and of the one-column stack from probe wrappers
  (`inline-size: max-content` and `min-content`), then restores the tier.
- **When it runs (PLAN-CORRECTNESS-1-008; PLAN-FRESH-2-002 (a), PLAN-FRESH-3-001 (a), PLAN-FRESH-3-003 (b), operator
  decisions; PLAN-FRESH-3-002).** list-detail has no track; its triggers are named here and in data-model.md:
  - `slotchange` on each of the three slots (an assigned element added or removed);
  - a `MutationObserver` (`childList`, `characterData`, `subtree`; no `attributes`) on the assigned elements of all
    three panes, shown or hidden. A hidden pane has no box and so fires no resize, and a shown pane's wrapper is sized
    by its grid track, not its content, so a width-only change of its content fires no resize either: a host that
    replaces the detail's inner content in light DOM (the select-a-record flow, an htmx swap), in any tier, is seen;
  - the public `remeasure(): void` method, which the host calls after a change the observer cannot see (below);
  - before applying a tier or `detail-open` change that comes from a property or attribute (`narrow`, `detail-open`,
    `collapse-below`, `inspector-below`), so a pane that is about to be shown is measured with its current content.
    This pass runs synchronously, in the property's update.

  **Scheduling (PLAN-FRESH-3-002).** The `MutationObserver` callback, `slotchange` and `remeasure()` never run the
  pass. Each sets a pending flag and, if no frame is requested yet, requests one animation frame; that frame callback
  clears the flag and runs the pass, with no paint between its render, reads and restore. So the pass runs at most
  once per frame, however many deliveries, slot changes or calls came before it. A mutation made in a task is
  measured in the next frame's animation-frame callbacks, before that frame's layout and `ResizeObserver` delivery. A
  mutation made inside a `ResizeObserver` or animation-frame callback is measured one frame later. The pass writes a
  figure only when it differs from the one in force.

  The host's `ResizeObserver` gives `measured` only, and a tier change it causes is applied without a pass: it never
  writes the figures. So the element never writes the sizer from inside a `ResizeObserver` delivery, whoever made the
  mutation. Measured in squad round 2, a pane `ResizeObserver` whose callback set the sizer grew a shrink-to-fit host
  inside the delivery, and the window received "ResizeObserver loop completed with undelivered notifications." with
  the host's new size a frame late; and a width-only widening of a shown pane's content fired no pane observation at
  all. Measured in squad round 3, a pass run in the `MutationObserver` callback brought the same error back when the
  mutation was made inside a slotted element's own `ResizeObserver` callback: the callback's microtask checkpoint
  delivers the records inside the `ResizeObserver` delivery (one column with the detail shown, the sizer above the
  shown content: host 1192 px and the error; with the pass in an animation frame, 1192 px and no error). The frame
  scheduling removes that case. It cannot remove one the element does not cause: in three columns, content a
  consumer mutates inside its own `ResizeObserver` callback grows a shrink-to-fit host through CSS within the
  delivery, and the browser reports the loop message with no pass at all (measured in round 3). The README says so.
  A host that sets `narrow`, `detail-open` or a threshold inside its own `ResizeObserver` callback runs the
  synchronous pass there; the README tells hosts to set them from a task.
  **Per-pass cost (PLAN-FRESH-3-003).** Measured in squad round 3 on a three-column grid with 1000 text rows in the
  list, a stand-in pass (max-content read, one-column min-content read, restore) took a median of 9.9 ms, 7.0 ms at
  least and 19.3 ms at most on the refuter's machine, and more is expected on slower devices. With `attributes` not
  observed, a selection or hover that toggles a row's `class` or `aria-selected`, htmx's request classes and a
  reflected attribute on a slotted element run no pass. A light-DOM node or text change (an htmx swap, a ticking
  `<time>` text) runs at most one pass per frame, whatever the host. The README's convention states this cost and the
  trigger set.
  **Recorded cost (operator decisions, rounds 2 and 3).** These size changes are not seen: a change with no light-DOM
  node or text change in a pane, such as an image or a font loading; content a slotted element renders inside its own
  shadow root (an ocelle element or a consumer's web component re-rendering from a property; a `MutationObserver`'s
  `subtree` follows tree children, and a shadow root is not one); and a change of an attribute only (a class or a
  style swap on pane content). They are picked up at the next slot change, light-DOM mutation, property-driven tier
  change or `remeasure()` call, and the host calls `remeasure()` after one. Where CSS already carries the change (a
  shown pane in three columns, whose content counts in the grid's own intrinsic size), it shows without a pass; where
  it does not (a hidden pane, or the max-content figure while one column shows), the figures stay stale until then.
  FR-025 states this reading since the plan gate, and the README says it in the container-tier convention.
- **Sizer.** The two figures are applied to an internal, `aria-hidden`, zero-block-size sizer element in the shadow
  grid. Its `inline-size` is the max-content figure, capped by `max-inline-size: 100%`. The grid's `min-inline-size` is
  the min-content figure.
- **Setting them (PLAN-CORRECTNESS-1-004).** A CSSOM write through `element.style` sets the element's `style`
  attribute (measured: `d.style.setProperty("inline-size", "10px")` serialises as `<div style="inline-size: 10px;">`),
  which constitution IV forbids with no exception. The figures therefore go into a per-instance constructed
  stylesheet adopted on the element's shadow root: `new CSSStyleSheet()` with two empty rules (`.sizer {}` and
  `.grid {}`), appended to `shadowRoot.adoptedStyleSheets` after Lit's own sheets, and on each measurement the two
  declarations are set through `CSSStyleRule.style.setProperty` on those rules. This writes no attribute, builds no CSS
  text from input, and is the mechanism `static styles` uses. The values are px figures computed by the element. A
  test asserts that no element of list-detail's shadow root carries a `style` attribute, after first render and after
  a tier change and a measurement.
- **The conventions and constitution II (PLAN-FRESH-2-005 (a), operator decision).** The README's § Styles says an
  element's styles are one `css` template in `static styles`, "so every instance adopts one shared stylesheet", and
  `test/node/readme.test.ts` pins that sentence; FR-030 says "token-only shared `static styles`". A per-instance sheet
  of px figures is outside both as written. FR-030 and the README name the one allowed exception since the plan gate:
  besides its shared `static styles`, an element (or the overflow-region module on its host, R-05) may adopt one
  per-instance constructed sheet that holds only px figures it measured from layout, never a value taken from an
  attribute, a property, a token's text or slotted text; list-detail and the overflow-region module are the named
  cases. The README sentence changes red first in `readme.test.ts` in phase 2 Records, where the module is the first
  user. The driver's `sheets()` asserts the count over two instances of each element: for the scroller, the board and
  list-detail every shadow root adopts its shared sheets plus exactly one per-instance sheet (`perRoot` is one number,
  the shared count plus one, and `distinct` is the shared count plus the number of instances); the lane adopts its
  shared sheets only. Constitution II forbids raw size literals in element CSS; the plan records,
  for the operator at the plan gate, that measured layout figures are not the design-value literals II forbids, so
  this is a reading of II and not an exception (plan.md Constitution Check II; no Complexity Tracking row).
- **Expected results (operator decision PLAN-CORRECTNESS-1-003 (a)).** A shrink-to-fit host then sees a max-content of
  1073 px (288 + 480 + 1 + 304; the inspector's border is inside its 19rem) and a min-content of the one-column
  stack's. In a 1196 px flex row the element is 1073 px wide and shows three columns; in a 636 px row it shrinks to
  636 px and shows one. A `<dialog>` with `max-inline-size: var(--ocelle-dialog-max-inline)` (1248 px in a 1280 px
  viewport) gives three columns. A table cell in a 636 px table gives one column. These are the figures SPEC-2-09 asks
  for, added to US3-12's test as stated cases.
- **Stale content case (PLAN-CORRECTNESS-1-008).** In a 1196 px flex row with `narrow` set (one column, the list
  shown), the host replaces the detail's inner content with a 40rem block that does not wrap, inside the same slotted
  element (no `slotchange`, no resize). Then `narrow` is removed. Expected: the element is 1196 px wide (max-content
  288 + 640 + 1 + 304 = 1233 px, shrunk to the row) and shows three columns. Stale figures would give 1073 px.
- **Content change in a shown pane (PLAN-FRESH-2-002 (a)).** In a 1196 px flex row, three columns at 1073 px, the
  host replaces the detail's inner content, inside the same slotted element, by a 35rem block twice as tall as the
  30rem one, and in a second case by a 35rem block of the same height that does not wrap. Expected in both: the
  element is 1153 px wide (288 + 560 + 1 + 304) and shows three columns in the first frame record after the change,
  and `driver.messages()` is empty (no "ResizeObserver loop" error event). The plant is the shown-pane
  `ResizeObserver` of round 1 as the trigger: the same-height case then stays at 1073 px, and the taller case reports
  the window error.
- **Unseen changes and `remeasure()` (PLAN-FRESH-3-001 (a), PLAN-FRESH-3-003 (b)).** In a 1196 px flex row with
  `narrow` set (one column, the list shown, 1073 px), the detail is an element with an open shadow root (a test
  fixture element) that renders the 30rem block. The host sets a property on it that renders a 40rem block that does
  not wrap in its shadow root instead. In a second case, the detail holds the 30rem block in light DOM and the host
  swaps a class on it that a fixture rule makes 40rem wide. Expected in both: the element is 1073 px wide on each of
  ten frames after the change (the recorded cost); then the host calls `remeasure()`, and in the first frame record
  after the call the element is 1196 px wide (1233 px shrunk to the row), still one column. Plants: `remeasure()` as a
  no-op (both cases stay at 1073 px); `attributes` observed (the class case reaches 1196 px before the call).
- **Mutation inside a `ResizeObserver` callback (PLAN-FRESH-3-002).** In a 1196 px flex row with `narrow` set and the
  list shown, the detail's slotted element holds the 30rem block and, from its own `ResizeObserver`, appends a 35rem
  block that does not wrap once it is observed with a non-zero inline size. The host sets `detail-open`. This is the
  setting where the pass is the only writer: one column, the detail shown, the sizer above the shown content.
  Expected: after settle the element is 1153 px wide and shows the detail in one column, and `driver.messages()` is
  empty. Plant: the pass run in the `MutationObserver` callback (the window reports the loop error).
- **Once per frame (PLAN-FRESH-3-002, PLAN-FRESH-3-003).** A `MutationObserver` already delivers once per task, so a
  test of many changes in one task would pass against the old design. The counted case spans tasks: three
  `setTimeout(0)` tasks before one frame each change the list's text, and the next frame runs one pass; a change in
  the frame after runs one more. The count is read from a test-only pass counter in the element's internal
  scheduling module (`src/list-detail-measure.ts`), which is not exported from the package and not in the manifest,
  so this case runs in-process only. Plant: one pass per `MutationObserver` delivery (three passes).
- **Frame record (PLAN-TESTABILITY-1-006).** A screenshot samples whatever frame it captures, so it cannot catch one
  leaked frame. From just before the `slotchange` (or the resize) until settle, a `requestAnimationFrame` loop and a
  `ResizeObserver` on the grid record, in every frame, the grid's column count and each pane's box. The pass condition
  is that every recorded frame shows the old or the new tier, never the measurement grid. The same record is an
  assertion in US3-12's test, with the plant "the measurement pass split across a `requestAnimationFrame`". Since the
  pass runs in an animation-frame callback (PLAN-FRESH-3-002), a frame's sizes are taken from the grid's
  `ResizeObserver` delivery of that frame, after layout, not from the loop's own callback, which may run before the
  pass's; "the first frame record after the change" means that delivery.
- **Spike pass condition.** US3-12's figures, the stale content case, both content-change cases, the two unseen
  cases with `remeasure()` and the `ResizeObserver` callback case hold with `driver.messages()` empty, the tier is
  stable over ten frames, and the frame record never shows the measurement grid.
- **If the spike fails.** It is a fork for the operator before phase 4 is implemented: relax US3-12 to "does not
  collapse to 0 px and does not alternate", dropping the exact 1073 px.

**Alternatives.**
- `contain: inline-size` with `contain-intrinsic-inline-size`: it gives one figure for min-content and max-content, so
  a 636 px host could not shrink it (003's collapse pitfall, the other way round).
- Keeping hidden panes in layout with `visibility: hidden`: contradicts "no box" (FR-027).
- `element.style` writes with an operator ruling that IV means markup only: not offered, because IV is not negotiable
  and the constructed stylesheet complies.
- A `ResizeObserver` on each shown pane's wrapper (round 1), with the window error and the one-frame lag accepted and
  the width-only gap read into FR-025 (option (b) of PLAN-FRESH-2-002): not taken by the operator.
- For content rendered in a slotted element's shadow root (PLAN-FRESH-3-001): a `ResizeObserver` on each assigned
  element that only schedules the pass, option (b), which misses a hidden pane's content (no box, no resize) and a
  width-only change in a shown pane; and recording the gap only, option (c). Not taken by the operator.
- Running the pass in the `MutationObserver` callback and telling consumers to defer mutations made in their own
  `ResizeObserver` callbacks (PLAN-FRESH-3-002, the lens's second remedy): it breaks the round-2 decision that the
  element never writes in a delivery.
- For attributes (PLAN-FRESH-3-003): an `attributeFilter` (`class`, `style`, `hidden`, `width`, `height`, `src`,
  `colspan`), option (a), which still runs a pass on the most common list-detail mutation, a selection that toggles
  a row's class; and all attributes with the cost recorded, option (c). Not taken by the operator.
- A Complexity Tracking exception to constitution II for the per-instance sheets (option (b) of PLAN-FRESH-2-005):
  not taken by the operator; the plan records a reading of II instead.

## R-14 Focus on a pane switch and at upgrade (FR-028, US3-6, US3-7; SPEC-1-11, SPEC-1-12, SPEC-2-11)

**Decision.**

- **Pane wrappers (PLAN-A11Y-SECURITY-1-005).** At rest no pane wrapper has a `tabindex`. A permanent `tabindex="-1"`
  would make each wrapper an unignored focusable `generic` node (measured by the squad; a plain `div` around a slot is
  ignored), against US3-14's "as it would without the element", and would make every click on pane text focus the
  wrapper, which then arms the focus move below for pointer users who never focused anything. As R-07 does for the
  scroller, the element sets `tabindex="-1"` on the shown pane's wrapper immediately before it calls `focus()` on it,
  and removes it on the wrapper's `focusout`. Script focus only: it is never in the tab order. Tests: before any
  switch no wrapper has a `tabindex` and the filtered tree under the host is exactly the slotted content in pane
  order; after a switch, once focus has left the wrapper, the same holds; a real click on pane text does not make the
  host `document.activeElement`. Plant: wrappers focusable at all times.
- **When the element moves focus.** Before applying a tier or `detail-open` change, the element records whether
  `document.activeElement`, through the composed tree, is inside a pane that the change hides. After the update it
  focuses the shown pane's wrapper as above.
- **Ring (PLAN-A11Y-SECURITY-1-003).** base.css does not reach into the shadow root, so the wrapper's ring is what the
  element's sheet says: on `:focus-visible`, `outline: var(--ocelle-focus-width) solid var(--ocelle-color-focus)` with
  `outline-offset: calc(var(--ocelle-focus-width) * -1)`, inset as base.css does for full-width prose tables. In one
  column the wrapper is as wide as the element, so the default outset ring would be clipped by any clipping ancestor.
  Under `@media (forced-colors: active)` the outline colour is `Highlight`, as every other ring in the library.
  Chromium's heuristic shows the ring after script focus when the last user input was a key, and not after a pointer
  input. The tests cover both: a key press then the host sets `detail-open` (ring shown), and a click then the host
  sets it (no ring). The keyboard case runs in Frame N inside an `overflow: hidden` container and asserts that the
  outline box lies inside the container on all four sides, and a forced-colours case asserts `Highlight`. Plant: the
  default outset ring. The spec's "when the change came from the keyboard" is read as this heuristic.
- **Upgrade (SPEC-1-12, SPEC-2-11; PLAN-CORRECTNESS-1-006 (a)).** At first render, the element checks whether focus is
  inside a pane that the first layout hides. If so, focus moves to the shown pane, because focus never stays on a
  node that has no box (US3-7). Otherwise upgrade moves nothing. FR-028 and the Edge Case say so since the plan gate.
- **Upgrade tests (PLAN-TESTABILITY-1-007).** The first-render branch is element source, and only the in-process
  `elements` project is mutated, so its cases run in-process: `test/list-detail-upgrade.test.ts` mounts the
  server-rendered markup (with `detail-open`, in Frame N's width) with focus placed inside the list pane, and a twin
  with focus outside the element, then dynamic-imports `src/ocelle-list-detail.ts` so the element upgrades in place
  (each test file has its own iframe and registry). The server-rendered fixture page of `elements-browser` stays as
  the built-output check.

## R-15 Stories, baselines and axe against #10 (FR-032, SC-007) — recheck when #10 lands

**Basis.** #10's design on `origin/claude/010-storybook-workbench` (`specs/006-storybook-workbench`), read on
2026-11-12:

- `visual` and `axe` gates over every story of the built index, in light and dark;
- one 1280 × 800 context at scale 1, with reduced motion;
- captures taken at page scroll (0, 0);
- baselines in `storybook/baselines/<story-id>.<theme>.png`, byte-compared;
- `visual:update` in the pinned linux/amd64 container (docker or podman), with CI's captures committed when a local
  run disagrees;
- FR-031 pointer states (hover or press only), no forced-colours capture and no focus state;
- open shadow roots required; `closed-shadow-root`, `font`, `network`, `io` and `pointer-target` findings;
- `storybook/a11y-exceptions.json` for recorded exceptions only;
- the FR-025 contributor note.

**Decision.**

- **Stories.** In `storybook/stories/<element>.stories.ts`, as 005's are:
  - frames sized by the tests' `[data-frame]` rules (one source, R-17), held as a copy in
    `storybook/.storybook/stories-layout.css` that a `storybook-integration` test checks against
    `packages/elements/test/fixtures/frames.css`. Not an import: #10's repo-tree plant roots do not hold
    `packages/elements/test/`, so an `@import` breaks every Storybook plant (recheck D1, operator decision (b));
  - other story layout by `[data-story="…"]` rules there, with no `style` attribute and no class. Each phase's story
    test asserts this on its new stories' markup (Story test below). #10 took the Storybook out of the `csp` gate
    (006 FR-020), so no gate checks it (recheck D2);
  - the board and lane stories' nested scroller labelled per item ("Tags of WP-12", R-01), and the default-lane
    stories on `color-canvas` (R-10);
  - each story inside 1280 × 800 at scroll (0, 0).
- **Story list.** FR-032's list, plus the states SPEC-1-16 named that change pixels:
  - board right to left;
  - list-detail right to left;
  - flat lane without a count.
- **States without a story, because they draw the same pixels as a story above:**
  - `count-label` and host `aria-label`: tree only;
  - `narrow`: the one-column stories;
  - an empty list slot: the list track's ground only.
- **Proven by tests, not stories.** Focus and forced-colours states: #10 captures neither.
- **Not applicable.** Loading, error and disabled states do not apply to layout elements; the README says so.
- **Mid-scroll stories.** A story at "middle" or "end" sets the scroll position after the element's `updateComplete`,
  inside its render function (a returned element with a `connectedCallback`-time promise, no timers). #10's
  double-capture determinism check (`nondeterministic`) proves it.
- **Baselines.** Each phase produces its stories' baselines with `pnpm run visual:update` in the pinned container
  under docker, which this sandbox can start (#10's assumption, "Container in this environment"). They are confirmed
  by a CI run of the branch. When CI's captures differ, the CI artifact's files are committed, as #10's note says.
- **axe.** It runs through #10's `axe` gate on every story-theme. Nothing goes into `a11y-exceptions.json` without the
  operator. Each element's browser tests also assert the tree exactly (R-01), and US1-12's unlabelled scroller is
  asserted as a tab stop with no role and no name (SPEC-1-10).
- **Story test.** The existing `storybook-integration` story-inventory test (005's `elements-stories.test.ts`) grows
  with the new story ids, red first in each phase. For each new story, in light and dark, it asserts that the story
  renders its element, that no element of the story's markup (the light DOM it renders, not the elements' shadow
  trees) carries a `style` attribute or a class, and that no request leaves the origin. It counts no CSP violations:
  the Storybook is not a CSP target since 006 FR-020, and strict CSP is proved in the `elements-browser` fixtures
  (recheck D2). Phase 2's story test (T020) also checks the frame copy against `frames.css` (recheck D1).

**Recheck when #10 lands** (a task at the start of implementation). Before phase 2's red step, re-read #10 as merged
on `main` and update this entry, `contracts/elements.md` § Stories and the tasks where any of these differ:

- the viewport and scale;
- the theme global;
- the baseline paths and command;
- the render signal and its timeout;
- the pointer-state parameter;
- the exception file's format;
- the story file and layout-stylesheet locations;
- the contributor note's items;
- any Storybook configuration this feature touches.

Then merge `main` (never rebase).

**Rechecked** at T001 (`reviews/phase-1/recheck-10.md`): every item as designed except the frame route (D1) and the
Storybook's CSP check (D2), both settled above by the operator (`reviews/phase-1/operator-decisions.md`).

**Alternatives.** Stories under 001's "visual regression and axe absent" exception, as 005 did: not needed, because the
operator sequences this feature after #10.

## R-16 Tokens (FR-033; Assumptions "Sibling tokens")

**Decision.** Six records in `packages/tokens/src/source.ts`, each with its documentation row:

| Token | Group | Value |
|---|---|---|
| `lane-min-width` | `shell` | `10rem` |
| `list-track-width` | `shell` | `18rem` |
| `list-detail-collapse` | `shell` | `40rem` |
| `list-detail-inspector-collapse` | `shell` | `60rem` |
| `scroller-fade-size` | `space` | `var(--ocelle-space-7)`, `ref: ["space-7"]` |
| `tracking-caps` | `type` | `0.06em` |

**Gates.** The token gates' pinned counts and the generated `tokens.css` and documentation change with them. As plain
records they are mutation-tested (op 004).

**Sibling 011 (#8).** If #8 lands first with an uppercase letter-spacing token, this feature adopts its name and value
and drops `tracking-caps` at the merge of `main`. If this lands first, #8 adopts `tracking-caps`. The same holds for the
container-tier convention (R-12). A task at the start of implementation checks `main` for both.

## R-17 Tests and harnesses (constitution V, VIII)

**Harnesses.** As 005 (its R-11): shared scenario bodies in `packages/elements/test/scenarios/`, run in-process (the
`elements` project, mutated by the elements-only Stryker configuration) and on strict-CSP fixture pages from the built
browser build (`elements-browser`). Every US1 to US3 keyboard and focus scenario runs in-process as well as on the
fixture pages, so the module's `keydown`, `focusin`, `focusout`, clearance and handover code, and list-detail's pane
focus code, are mutated against them (PLAN-TESTABILITY-1-001).

**Driver (PLAN-TESTABILITY-1-001, 1-002).** 005's `Driver` (`test/scenarios/driver.ts`) has no method for most of
this feature's behaviour, and its in-process `settle()` (`test/in-process.ts`) waits for `updateComplete` and one
`requestAnimationFrame`, which resolves before that frame's `ResizeObserver` delivery. A driver task, test first, opens
phase 2 (as 005's T013 did for its interface). It adds, in both harnesses (`test/in-process.ts` and
`test/browser/driver.ts`):

- `press(key)`: real keyboard input by key name and chord (`Tab`, `Shift+Tab`, `ArrowLeft`, `ArrowRight`, `Home`,
  `End`, `Alt+ArrowLeft`, `Ctrl+ArrowRight`, `Meta+ArrowRight`, `Shift+ArrowRight`), through `vitest/browser`'s
  `userEvent` in-process (the Playwright provider sends real input) and Playwright's `page.keyboard` on the fixture
  pages, never dispatched synthetic events, because `:focus-visible` follows real input only;
- `click(target, point)`: a real pointer click at a point of an element's box;
- `wheel(target, deltaX)`: a real wheel event over a box;
- `activeElement()`: the deep active element, as the host's `id` plus a shadow selector;
- `tabWalk(from, to)`: the sequence of deep focused nodes from a sentinel before the element to one after it;
- `scrollLeft(target)` and `setScrollLeft(target, value)`;
- `lastKeyPrevented()`: whether the last keydown was default-prevented, read by a capture listener on the window;
- `reducedMotion(on)`, beside `forcedColors()`;
- `viewport(width, height)`: in-process through `vitest/browser`'s `page.viewport`, on the fixture pages through
  `page.setViewportSize`; the in-process default is Vitest's 414 × 896, so every frame scenario sets its frame's
  viewport (1280 for Frames W and R, 720 for N, 320 for S) before mounting;
- `frameRecord(target, read)`: a per-frame record (a `requestAnimationFrame` loop and a `ResizeObserver`) of a reading
  until settle (R-13);
- `settle()`: `updateComplete` after two animation frames, the contract's rule.

The driver task's own tests prove each method against a plain fixture (a key that moves focus, a viewport that
changes `innerWidth`). US3-10's `vw` case asserts the viewport width it relies on (1280 px), so a run at the wrong
viewport fails instead of passing.

**Frames (PLAN-TESTABILITY-1-008).** The frames are test oracles with margins as small as 18 px, so they are one
source and they are tested. `packages/elements/test/fixtures/frames.css` holds Frames W, R, N and S as
`[data-frame="W"]` (and so on) rules in px. The in-process driver reads it as text (`?raw`) and adopts it through
`driver.rules()`; the fixture pages link it same-origin; the stories use the same `data-frame` attribute (an
attribute, not a class or a `style`), and `storybook/.storybook/stories-layout.css` holds a copy of those rules that a
`storybook-integration` test (phase 2's story test, T020, red first) compares with the source. An import is not used:
#10's Storybook plant roots do not hold `packages/elements/test/` (R-15, recheck D1). The frames are not exempt: a
phase 1 test, red before the frame CSS exists, asserts in both harnesses each frame's measured inline size (876, 1196,
636 and 288 px) at its viewport.

**Root font size (PLAN-TESTABILITY-1-010).** Every px figure above assumes a 16 px root, so a hard-coded `× 16` would
pass. Each element has one case at a 20 px root font size (set by a test stylesheet through `driver.rules()`, not a
`style` attribute), with fixed expected figures written in the test:

- scroller: US1-13's clearance leaves the focused link's ring box 40 px from a fading edge, also with
  `--ocelle-scroller-fade-size: calc(1rem + 4px)` set on the element (24 px);
- board: lanes at 200 px minimum, so five lanes in Frame W overflow (5 × 200 + 4 × 15 + 2 × 5 = 1070 px > 876 px);
- list-detail: the 40rem default is 800 px, so in a 720 px frame (1280 px viewport) it shows one column, and two at a
  16 px root.

**Overflow-region proof.** A test-only element `ocelle-test-overflow-host` (`test/fixtures/overflow-host.ts`) built on
the module, with a scroll box of its own markup and the default `group` role, runs US1-1, US1-3, US1-4 and US1-12
(US1-16, SC-008). It ships in no package, as 005's test host does. The board's tests cover the `region` role.

**Mutation.** The module and the four elements are element source, mutated in-process. 007's stricter gate applies:
Timeout and CompileError mutants are reported by location, and 30-line entries. The module's clearance arithmetic and
the grammar of R-12 are pure functions with their own unit tests, so their mutants are killed without a browser
layout. The `ocelle/token-only` change (R-05) is gate source, mutated under `stryker.config.json`.

**Plants (PLAN-TESTABILITY-1-009).** Each "does not" row of the spec's table names its planted defect, and the plan's
phases name the test that carries each one, with the plants this plan adds. As in 005 (`specs/005-icons-brand-mark/
tasks.md`), every pairing plant is run once by the implementer against its test, the output is recorded in the
phase's `reviews/phase-N/plants.md`, and a plant that does not make its test fail stops the phase (stop and ask). The
pairing plants are not gate plants, so `gate:plants` does not run them; the record is their proof.

## R-18 Engine floor (README § Engines)

The new features used are:

| Feature | Chromium | WebKit |
|---|---|---|
| `mask-image` unprefixed | 120 | 15.4 |
| `mask-clip`, `mask-origin`, `mask-size`, `mask-position` and `mask-composite` unprefixed (R-05) | 120 | 15.4 |
| `contain: inline-size` (R-08) | 105 | 15.4 |
| `:focus-visible` | 86 | 15.4 |
| `ResizeObserver` | 64 | 13.1 |
| `:dir()` | already on the list | already on the list |

All are within the current floor (Chromium 120+, WebKit 16.4+), so the floor does not move. The README's list gains
the mask properties and `contain: inline-size` with their figures. `Element.checkVisibility()` (WebKit 17.4) would
raise the floor, so R-07's walk tests for a box with `getClientRects().length > 0` and a computed `visibility` other
than `hidden` instead.

## R-19 Spec-check notes settled here

| Note | Settled in |
|---|---|
| SPEC-1-07 | R-03 |
| SPEC-1-08 | R-02 |
| SPEC-1-09 | R-05 |
| SPEC-1-10 | R-15, tests |
| SPEC-1-11 | R-14 |
| SPEC-1-12, SPEC-2-11 | R-14 |
| SPEC-1-14 | R-09 |
| SPEC-1-15 | R-10 |
| SPEC-1-16 | R-15 |
| SPEC-1-17 | below |
| SPEC-1-19 | left as is; the component-library convention of 005 |
| SPEC-2-04 | R-08 |
| SPEC-2-06 | R-08 |
| SPEC-2-09 | R-13 |
| SPEC-3-01, SPEC-3-02, SPEC-3-03 | R-06 |
| SPEC-3-04 | R-12 |

**SPEC-1-17** (`inspector-below` has no named consumer). The approved spec keeps it. Its consumer is the Pipeline
inspector on a screen whose list-detail has less or more room than the default assumes, such as a screen with or
without the context sidebar. The operator may drop it at the plan gate (a fork for the squad if raised).
