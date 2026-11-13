# Research: Workflow and Screen Layouts

Decisions behind [plan.md](plan.md). Each entry gives the decision, why, and what else was considered. "Measured"
means measured in this container's Chromium (build 1243, Playwright's `chromium.launch()`), on 2026-11-13, with the
probe in the orchestrator's scratchpad. The probe is not part of the repository; each phase's tests measure the same
behaviour again in the repository's harness.

## R-01 Where the region and group roles live (FR-002, FR-010, FR-019)

**Decision.** The region role of the scroller and the board, and the group role of the lane, are on an element in the
element's own shadow root (the scroll box; the lane's group wrapper), never on the host. The element observes the
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

**Alternatives.** Role on the host through internals: rejected, because of the blank-label measurement above. Copying
the host `aria-label` and removing the attribute: rejected, because 005 forbids rewriting the host's ARIA.

## R-02 Arrow keys and reduced motion (FR-006, FR-009, US1-5, US1-11; SPEC-1-08)

**Decision.** The overflow-region module handles `ArrowLeft` and `ArrowRight` itself, only when the keydown's
composed target is the scroll box:

- it calls `preventDefault`;
- it moves `scrollLeft` by 40 px in the key's visual direction with an instant assignment, so no browser smooth
  scrolling is involved;
- at the extent it still calls `preventDefault` and changes nothing, so the page does not scroll.

Keys whose target is a descendant are not touched (US1-10). `Home`, `End`, `PageUp` and `PageDown` are not handled:
the browser's default applies, and the element does not call `preventDefault` on them. The tests assert that, not a
scroll result.

**Why (measured).** Chromium's own arrow-key scrolling of a focused scroll box is 40 px, but animated: `scrollLeft`
was 0 right after the key press and 40 after 300 ms, also in a context with `reducedMotion: "reduce"`. Under reduced
motion FR-009 allows nothing to animate, so the element cannot rely on the browser here. `End` on a focused
horizontal scroll box moved nothing horizontally.

The reduced-motion outcome is tested as "the final position is reached within one frame of the key". With the instant
assignment that holds with and without the preference.

**Alternatives.** Leaving the keys to the browser (FR-006 allows it): rejected because of FR-009. Home and End to the
inline ends: useful, but behaviour the spec does not define; a later MINOR addition if a consumer asks.

## R-03 Overflow state and what updates it (FR-002, US1-3; SPEC-1-07)

**Decision.** The module observes three sources:

- **Size.** One `ResizeObserver` on the scroll box (box size) and on its track, the shadow element that wraps the
  default slot at its `max-content` inline size (content size). A change to slotted content changes the track's size
  even when no assigned element's own size changes, such as text deep in light DOM or an element added inside a slotted
  container.
- **Slot.** `slotchange` on the default slot (items added or removed).
- **Scroll.** A passive `scroll` listener for the edge state.

**Overflow** = `scrollWidth − clientWidth > 1`. With `scrollLeft` (negative under `rtl` in Chromium, as the standard
says), the edges are:

- **start** = `|scrollLeft| > 1`;
- **end** = `scrollWidth − clientWidth − |scrollLeft| > 1`.

The state is written in the observer callback, which runs before paint, so the next frame shows it. The tests wait
for the element's `updateComplete` after two animation frames; that is the "within one animation frame after the
resize is observed" of US1-3.

**Alternatives.** A `MutationObserver` on slotted subtrees: not needed once the track's size is observed, and costly on
large boards.

## R-04 Ring room (FR-001, FR-014; SPEC-1-01 and SPEC-2-02 fixes)

**Decision.** The ring room `calc(var(--ocelle-focus-offset) + var(--ocelle-focus-width))` (5 px) is placed as follows:

- **Block direction.** Block padding of the scroll box (scroller) or of the lanes row (board).
- **Inline direction.** Inline padding of the track, which is inside the scrollable content, so the room is before the
  first and after the last item and counts as content for the overflow rule.

The scroll box has `overflow-x: auto; overflow-y: hidden`. With the block room in its padding, a slotted control's ring
fits inside it.

**Why.** Padding of the scroll container itself is inside the scrollport but, at the inline end, depends on the
engine's scrollable-overflow rules. Padding of a track element is ordinary content size in every engine.

## R-05 The fade and the scroll box's own ring (FR-005, FR-007, FR-008, US1-7, US1-9; SPEC-1-09)

**Decision.**

- **Fade.** The fade is a `mask-image` on the scroll box. It is a `linear-gradient` from `transparent` to an opaque
  token colour (`var(--ocelle-color-ink)`; only alpha matters in a mask) over `--ocelle-scroller-fade-size` at each
  fading edge. One rule per edge state (start, end, both) selects it from the module's outputs, and `:host(:dir(rtl))`
  rules mirror the gradient direction.
- **Ring.** The scroll box's focus ring is not drawn on the masked box. It is drawn by a sibling overlay element in
  the shadow root, positioned over the box, inset by the ring width, with no pointer events, and shown by
  `.box:focus-visible ~ .ring`. So the mask never fades it. The overlay is `aria-hidden` and adds no node.
- **Forced colours.** Under `@media (forced-colors: active)` the mask is `none`. Two edge elements, likewise siblings
  and `aria-hidden`, draw a 1 px `CanvasText` `border-inline-start` or `border-inline-end` on the sides the module
  reports as fading. The ring overlay uses `Highlight`.
- **No transition.** The fades appear and disappear with no transition at all. FR-009's "at most `--ocelle-motion-fast`"
  is met trivially. A gradient mask does not interpolate usefully.

**Lint.** `transparent` and `var(--ocelle-*)` pass `token-only`, as do `%` stops. `CanvasText` and `Highlight` are
identifiers, not named colours, so they pass too (the rule rejects only named colours, hex and raw units).

**Alternatives.**
- A gradient overlay painted in the ground colour: rejected, because the element does not know the ground (US1-7: any
  main ground, both themes).
- The ring as an inset `outline` on the box: it would be faded at the edges by the mask.

## R-06 Focus clearance and the fade fallback belong to the module (FR-001, FR-014; SPEC-3-01, 3-02, 3-03)

**Decision.**

- **Owner.** The module owns focus clearance. It listens for `focusin` on its host, in the composed tree, so a focused
  element inside a lane, or inside another element's shadow root, counts.
- **When it applies.** When the focused element (`composedPath()[0]`) matches `:focus-visible`, which covers keyboard
  focus and script focus after keyboard use. Pointer focus does not apply: a click on a chip half under a fade does not
  scroll the strip from under the pointer, and the browser's own focus scrolling is all that happens.
- **How it scrolls.** It reads the ring box (the focused element's border box grown by the ring room) against the
  scroll box. It scrolls by the smallest amount that leaves the ring box at least `--ocelle-scroller-fade-size` from
  each inline edge that would then still fade.
- **When the control does not fit.** If the ring box is wider than the box less the fade depths, the module aligns the
  ring box's inline start with the box's inline start. It reports the fade on the covering side(s) as suppressed until
  `focusout` from that element or a scroll the module did not make (a flag set around its own assignment).
- **A control wider than the box** (SPEC-3-03) is aligned the same way and suppresses both fades. Only its start is
  guaranteed visible.
- **Forced colours** (SPEC-3-01). Suppression applies to the forced-colours line too: the module's two edge outputs
  already include it, so the line and the fade can never disagree.
- **SC-001.** It is read as "exactly the sides with content off-screen, except while the FR-001 fallback suppresses one
  for a focused control". The wide-button case of US1-13 asserts the fallback, and the SC-001 states assert the rule.

**Contract.** `contracts/overflow-region.md` lists `fadeStart` and `fadeEnd` (off-screen and not suppressed) as outputs
beside `offStart` and `offEnd`. FR-011's list grows accordingly; this is the reading of FR-011 the plan takes. #13 gets
clearance for free when its code block holds a focusable element.

**Alternatives.**
- Clearance per host: rejected, because three copies would follow (scroller, board, #13).
- Clearance on every focus: rejected, because the strip would jump under the pointer.

## R-07 Focus handover when overflow ends (FR-004, US1-4)

**Decision.** When an update turns overflow off while the scroll box is `document.activeElement` through the shadow
root, the module moves focus:

- to the first focusable assigned element (or descendant of one), found with a `tabbable` walk over the slot's
  flattened assigned elements: `tabIndex >= 0`, not disabled, not `inert`, with a box;
- when there is none, to the host. The module first sets `tabindex="-1"` on the host and removes it on the host's
  `focusout`.

This is the module's only effect on the host. It is documented, and it does not touch a `tabindex` the host page set:
if the host already has a `tabindex` attribute, the module leaves it alone and focuses the host as it is.

## R-08 Board and lane layout (FR-013 to FR-016, US2-1 to US2-4, US2-14; SPEC-2-04, 2-06)

**Board layout.**
- **Scroll box.** The board's shadow root is the scroller's structure: a scroll box, a track with the inline ring room,
  the ring overlay and the edge elements.
- **Track.** `display: flex; gap: var(--ocelle-space-3); min-inline-size: 100%`, with `box-sizing: border-box`, so a
  fitting board's lanes share the box minus the ring room.
- **Lanes.** `::slotted(*)` gets `flex: 1 1 var(--ocelle-lane-min-width); min-inline-size: var(--ocelle-lane-min-width)`.
  Every child has the same basis and minimum, so the shares are equal (FR-013), and no child takes its min-content as
  its minimum.

**Check (FR-015).** Five lanes need 5 × 160 + 4 × 12 = 848 px plus 2 × 5 px of ring room, 858 px, which is less than
Frame W's 876 px. In Frame N (636 px) they overflow.

**Block direction (SPEC-2-04).**
- The track stretches its items (`align-items: stretch`), so lanes are as tall as the tallest one, the kanban
  convention.
- The board takes that block size plus its block ring room and never scrolls in the block direction
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
tab stop. The README tells hosts to wrap such content in an `ocelle-scroller` (FR-013).

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

## R-10 The flat lane's ground (US2-7; SPEC-1-15)

The board paints no ground: it is layout only. A flat lane therefore sits on the host's ground. The flat lane's colours
are `--ocelle-color-ink-soft` for title and count, and their text pairs are checked on every main ground (002). The
README says the board and flat lanes go on a main ground. The flat-lane stories render on `color-canvas`, the
preview's ground.

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

**Empty inspector.** `slotchange` on the `inspector` slot sets an internal `hasInspector` state. Without one, no
inspector pane is rendered at all (FR-024).

**Tree.** The panes are plain `div`s with no role (FR-029, US3-14).

## R-12 The `*-below` grammar and resolution (FR-025, FR-034; SPEC-3-04)

**Grammar.** After trimming ASCII whitespace, the value must match
`^(?:0|[0-9]+(?:\.[0-9]+)?(?:px|rem|em))$`, units matched ASCII case-insensitively, as CSS does.

| Accepted | Rejected |
|---|---|
| `0`, `0px`, `0rem`, `56rem`, `55.5rem`, `880px`, `55em`, `56REM` | `+56rem`, `.5rem`, `56.rem`, `5.6e1rem`, `-0`, `-1rem`, units other than the three, `%`, `calc()`, `var()`, unitless numbers other than `0`, `wide`, empty |

US3-10's lists gain `56REM` (accepted, one column in Frame W) and `+56rem`, `.5rem`, `5.6e1rem` (rejected, two columns
in Frame W). These are examples within FR-025's text, so the spec is unchanged.

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

- **Measurement pass.** It runs on `slotchange` and when the track observer sees a content size change. In one task,
  with no paint between, it renders all panes in the three-column grid, reads the max-content and min-content inline
  sizes of the three-column grid and of the one-column stack from probe wrappers (`inline-size: max-content` and
  `min-content`), then restores the tier.
- **Sizer.** The two figures are applied to an internal, `aria-hidden`, zero-block-size sizer element in the shadow
  grid. Its `inline-size` is the max-content figure, capped by `max-inline-size: 100%`. The grid's `min-inline-size` is
  the min-content figure.
- **Setting them.** Both are set through the CSSOM (`element.style.setProperty`) on shadow elements. Under the strict
  CSP, CSSOM writes are allowed: CSP governs markup `style` attributes and `<style>` elements, which the `csp` gate
  checks in built output, and a CSSOM write creates neither. The values are px figures computed by the element, not
  author input.
- **Expected results.** A shrink-to-fit host then sees a max-content of 1074 px and a min-content of the one-column
  stack's. In a 1196 px flex row the element is 1074 px wide and shows three columns; in a 636 px row it shrinks to
  636 px and shows one. A `<dialog>` with `max-inline-size: var(--ocelle-dialog-max-inline)` (1248 px in a 1280 px
  viewport) gives three columns. A table cell in a 636 px table gives one column. These are the figures SPEC-2-09 asks
  for, added to US3-12's test as stated cases.
- **Spike pass condition.** US3-12's figures hold, the tier is stable over ten frames, and the measurement pass shows
  no intermediate layout in a screenshot taken right after a `slotchange`.
- **If the spike fails.** It is a fork for the operator before phase 4 is implemented: relax US3-12 to "does not
  collapse to 0 px and does not alternate", dropping the exact 1074 px.

**Alternatives.**
- `contain: inline-size` with `contain-intrinsic-inline-size`: it gives one figure for min-content and max-content, so
  a 636 px host could not shrink it (003's collapse pitfall, the other way round).
- Keeping hidden panes in layout with `visibility: hidden`: contradicts "no box" (FR-027).

## R-14 Focus on a pane switch and at upgrade (FR-028, US3-6, US3-7; SPEC-1-11, SPEC-1-12, SPEC-2-11)

**Decision.**

- **Pane wrappers.** Each pane wrapper has `tabindex="-1"` at all times. Script focus only: it is never in the tab
  order.
- **When the element moves focus.** Before applying a tier or `detail-open` change, the element records whether
  `document.activeElement`, through the composed tree, is inside a pane that the change hides. After the update it
  calls `focus()` on the shown pane's wrapper.
- **Ring.** The wrapper's ring is the token focus ring on `:focus-visible`. Chromium's heuristic shows it after script
  focus when the last user input was a key, and not after a pointer input. The tests cover both: a key press then the
  host sets `detail-open` (ring shown), and a click then the host sets it (no ring). The spec's "when the change came
  from the keyboard" is read as this heuristic.
- **Upgrade (SPEC-1-12, SPEC-2-11).** At first render, the element checks whether focus is inside a pane that the
  first layout hides. If so, focus moves to the shown pane, because "focus never stays on a node that has no box"
  (US3-7) wins over "upgrading moves no focus". Otherwise upgrade moves nothing. The edge case in the spec is read that
  way; a test covers both upgrade cases on a server-rendered fixture page.

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
  - frames sized by `[data-story="…"]` rules in `storybook/.storybook/stories-layout.css`, with no `style` attribute
    and no class (the `csp` gate's Storybook check);
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
  with the new story ids, red first in each phase.

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
browser build (`elements-browser`). The fixture pages add the frames as fixture-page CSS files (served same-origin, no
inline style).

**Overflow-region proof.** A test-only element `ocelle-test-overflow-host` (`test/fixtures/overflow-host.ts`) built on
the module, with a scroll box of its own markup, runs US1-1, US1-3, US1-4 and US1-12 (US1-16, SC-008). It ships in no
package, as 005's test host does.

**Mutation.** The module and the four elements are element source, mutated in-process. 007's stricter gate applies:
Timeout and CompileError mutants are reported by location, and 30-line entries. The module's clearance arithmetic and
the grammar of R-12 are pure functions with their own unit tests, so their mutants are killed without a browser
layout.

**Plants.** Each "does not" row of the spec's table names its planted defect. The plan's phases name the test that
carries each one.

## R-18 Engine floor (README § Engines)

The new features used are:

| Feature | Chromium | WebKit |
|---|---|---|
| `mask-image` unprefixed | 120 | 15.4 |
| `:focus-visible` | 86 | 15.4 |
| `ResizeObserver` | 64 | 13.1 |
| `:dir()` | already on the list | already on the list |

All are within the current floor (Chromium 120+, WebKit 16.4+), so the floor does not move. The README's list gains
`mask-image` with its figures.

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
