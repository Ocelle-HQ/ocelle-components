# Research: Overlays — Dialog, Drawer and Tooltip

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Date**: 2026-11-12

Measurements were taken in this container with Playwright 1.64.1's Chromium (153.0.8010.12), using the probes noted
under each decision. WebKit is not measured here (elements README § Engines). Facts about the repository come from
`main` at `476602e` and the #10 branch `origin/claude/010-storybook-workbench` (`specs/006-storybook-workbench`,
unmerged).

## R-01 Overlay base: one internal base class, two elements

- **Decision**: `ocelle-dialog` and `ocelle-drawer` share an internal base class `OcelleOverlay` in
  `packages/elements/src/overlay.ts` (not an entry point, no tag). It owns `open`, `label`, `close-label`, the
  rendered `<dialog>`, focus, Escape, the close control, events and motion. The subclasses add layout (dialog: centred,
  `--ocelle-dialog-inline-size`; drawer: `side`, `ground`, `heading-hidden`, backdrop click) and their event prefix.
- **Rationale**: FR-001 to FR-023 are shared word for word; one implementation means one set of mutants and one place
  for the Escape and focus rules that #12 will lean on.
- **Manifest**: the manifest script analyses `src/ocelle-*.ts` only (`custom-elements-manifest.config.mjs`). Phase 2's
  first task measures whether the analyzer lists inherited members on each subclass with their descriptions when the
  base is outside the glob. If not, the glob gains `src/overlay.ts` (the base has no `@tagname`, so it is no element
  entry) and the gate's `no-description` rule covers it. Either way each element entry lists every member it has.
- **Alternatives**: a mixin (the analyzer's mixin support is weaker and the type surface noisier); two copies
  (rejected: duplicated mutants and drift).

## R-02 Escape, the platform's close watcher and the veto

- **Measured** (probe `probes/probe2.cjs`, Chromium 153): with only a `cancel` listener that calls `preventDefault()`, the
  first Escape fires `cancel` with `cancelable: true` (vetoed). The second Escape without user activation in between fires
  `cancel` with `cancelable: false`, and the dialog **closes**. With a `keydown` listener on the `<dialog>` that calls
  `preventDefault()` for Escape, three Escapes fire no `cancel` and the dialog **stays open**.
- **Decision**: the overlay handles Escape on `keydown` (bubble phase, on its `<dialog>`), calls `preventDefault()`
  and runs the request path (FR-010, FR-013). It also listens to `cancel` and always calls `preventDefault()`. If a
  `cancel` arrives for a press the keydown path did not handle (an engine that fires `cancel` without a preceding
  keydown), it runs the request path once for it. So the veto holds on every repetition (US1-4, edge case "repeated
  Escape").
- **Not used**: `closedby` and `requestClose()` (Chromium 134 / WebKit 26 and Chromium 134 / WebKit 18.4: above the
  floor); the plan keeps the floor at what the tooltip needs (R-10).

## R-03 Platform-initiated closes (FR-016)

- **Decision**: "consistent with a close of reason `host`". A `close` event on the inner `<dialog>` that the overlay
  did not cause (a slotted `<form method="dialog">` submit, `close()` called on the inner dialog through the open
  shadow root) sets `open` to false, returns focus (R-05) and dispatches `…-close` with `detail.reason === "host"`.
  Preventing it would need the form's `submit` intercepted in the host's light DOM, which the element does not own.
- The documentation says a form in the dialog should use its own submit handling. A `method="dialog"` submit closes
  the overlay with reason `host`.

## R-04 Initial focus and the Tab cycle (FR-007, FR-008)

- **Decision**: after `showModal()`, the overlay focuses explicitly rather than relying on the dialog focusing steps
  (their treatment of slotted and shadow content differs between engines and is not specified for slots). Order:
  the first element marked `autofocus` among the default slot's assigned elements and their descendants (shadow roots
  included); else the first focusable element of the default slot's flattened content in tree order; else the close
  control. Footer content is not an initial focus target (FR-007 names the body only).
- **Tab cycle**: the tab order is the close control (in the header), then the body's content, then the footer's.
  `keydown` Tab on the last tabbable element (or Shift+Tab on the first) moves focus to the other end and prevents
  the default. The rest of the document is inert through `showModal()`; the explicit wrap keeps focus out of the
  browser chrome, so the cycle is the same in every engine.
- A small internal module `src/focusable.ts` holds the "tabbable in flat-tree order" walk (open shadow roots and slots
  followed; `disabled`, `inert`, `hidden` and `tabindex="-1"` excluded). It is mutation-tested through the overlay
  scenarios, with a scenario per exclusion.

## R-05 Focus return (FR-009, SPEC-1-12)

- **Decision**: at open, record the opener: the deepest active element (`document.activeElement` followed through
  `shadowRoot.activeElement`). On close, focus it if it is still connected, not `disabled` and not inside an inert
  subtree. Otherwise:
  - if an overlay beneath is still open, focus goes to that overlay's initial focus target (R-04);
  - else focus goes to the document body (`document.activeElement === document.body`), with nothing thrown.
  The README states both.

## R-06 Close timing and motion (FR-014, FR-020, SPEC-1-05, SPEC-1-06)

- **Decision**:
  - Order on close: `open` becomes false, then the exit animation runs, then `<dialog>.close()`, then focus returns
    (R-05), then `…-close` is dispatched.
  - The close event therefore fires when the element has left the top layer.
  - Under reduced motion the duration is 0 and all of it happens in the same task after the next update.
  - Setting `open` again during an exit cancels the animation: the dialog stays shown, and no close event is
    dispatched for the cancelled close.
- **Mechanism**: the Web Animations API (`element.animate`), not CSS transitions. Closing a top-layer `<dialog>` with
  an exit transition needs `transition-behavior: allow-discrete` / `@starting-style` (WebKit 17.4 / 17.5) or `overlay`
  (no WebKit). WAAPI is in WebKit since 13.1 and writes no `style` attribute (FR-047).
  - The duration is read from the computed `--ocelle-motion-base` on the host; the easing is read from
    `--ocelle-easing-standard`.
  - Keyframes: the dialog fades (`opacity` 0 → 1). The drawer slides on the inline axis (`translate` from -100 % or
    100 %, signed by its side and by `:dir(rtl)`) and fades.
  - A duration of 0 ms skips `animate()` altogether.
  - The backdrop is not animated.
  - Keyframes are JS values, not element CSS. They use only `%` and unitless opacity, so they meet constitution II's
    intent.
- **Floor**: nothing here is newer than WebKit 17, so the floor stays where the tooltip puts it (R-10).

## R-07 Backdrop click (FR-012)

- **Decision**: the `<dialog>` element is the panel, so a click on `::backdrop` targets the dialog with coordinates
  outside its border box. The drawer records `pointerdown` (primary button, `isPrimary`). A `click` whose `pointerdown`
  and `click` both lie outside the panel's border box, and whose target is the `<dialog>` itself, is a backdrop click.
  A press that starts inside and ends outside is not one.
- The dialog has no backdrop handler.

## R-08 Name, heading and `heading-hidden` (FR-005, FR-048, SPEC-1-13, SPEC-1-17)

- **Decision**: the shadow root renders `<h2 part="heading" id="heading">` with `label`, and the `<dialog>` has
  `aria-labelledby="heading"` (both in one shadow root). When the host has an `aria-label` attribute, the `<dialog>`
  gets `aria-label` with that value instead and no `aria-labelledby`, following the elements README § Host ARIA rule;
  `naming.ts`'s `accessibleName` decides.
  - **Heading level 2**, fixed and asserted in the tree tests (SPEC-1-17).
  - `heading-hidden` hides the heading visually (the `--ocelle-size-visually-hidden` pattern used by base styles) and
    keeps it in the tree.
  - The close control keeps its place at the block start of the header.
- **No label, no host `aria-label`** (SPEC-1-13): the overlay has no name (axe reports it). The element invents none
  and prints nothing, because constitution I allows no console I/O as behaviour. The README says a label is required.
- **Long label**: it wraps. The header is a row with the heading `min-inline-size: 0` and the close control not
  shrinking.

## R-09 Sizes and tokens (FR-024, FR-026, FR-038, SPEC-1-14, SPEC-1-16)

| Token / hook | Value | Source |
|---|---|---|
| `--ocelle-drawer-inline` (new, shell) | `var(--ocelle-shell-sidebar-width)` (20rem), `ref: ["shell-sidebar-width"]` | #12's personal drawer replaces the sidebar at narrow widths (spec-kitty-design#450), so it takes the sidebar's width. |
| `--ocelle-tooltip-delay` (new, motion) | `500ms` | The library's choice, within the 300 to 1000 ms range common in toolkits. Shown at the plan gate. Not zeroed under reduced motion, because a delay is not motion. Brand rule (f) sets only `motion-fast`/`motion-base`, so it stays unchanged. |
| `--ocelle-tooltip-max-inline` (new, size) | `18rem` | Library choice: about 40 characters of `font-size-sm`, so a pill tag's full text wraps on two or three lines. Shown at the plan gate. |
| `--ocelle-dialog-inline-size` (element hook) | default `var(--ocelle-measure-reading)` (68ch) | A dialog of prose or a list reads at the reading measure; it is capped by `--ocelle-dialog-max-inline`. |

- **Bubble colours**: the existing `--ocelle-color-chrome` (ground) and `--ocelle-color-chrome-ink` (text) in both
  themes. Their text contrast is already in the contrast check (`color-chrome-ink` has `grounds: chrome`). No new
  colour token.
  - No shadow: #5 reserves `elevation-raised` for the dialog. The drawer uses it as a dialog surface.
  - In forced colours the bubble gets `CanvasText` / `Canvas` and a `border-width` solid `CanvasText` border.
- **Validation**: the new tokens go through `validateSource()`, `test/expected.ts`, the README's token list and the
  tokens CHANGELOG "Added". `motion` and `size` groups exist, so no group is new.
- **Lint**: element CSS uses only `var()` and `calc()`. For example the drawer's
  `max-inline-size: var(--ocelle-dialog-max-inline)` and `inline-size: var(--ocelle-drawer-inline)`. `min()` is raw
  under `token-only` and is not used.

## R-10 Tooltip in the top layer and the engine floor (FR-034, FR-040, FR-041)

- **Measured** (probe `probes/probe.cjs`): a `popover="manual"` element in a custom element's open shadow root inside a modal
  `<dialog>` is `:popover-open` after `showPopover()`, and hit-testing at its box reaches it (retargeted to the host)
  above the modal.
- **Decision**: the bubble is `<div part="bubble" popover="manual">` in the tooltip's shadow root. The overlay stays
  inside its host (006 FR-014: every surface inside its own host). `manual` means no light dismiss and no automatic
  Escape, so FR-033's Escape is the element's own. Showing one bubble hides the one shown before (a module-level
  "current bubble"). The user-agent `[popover]` styles (inset, margin, border, padding, background, colour, overflow)
  are reset.
- **Floor**: Chromium 120 (unchanged) / **WebKit 17** (Popover API: Chromium 114, WebKit 17). These do not raise it:
  WAAPI (R-06), `:focus-visible` (Chromium 86, WebKit 15.4) and `inert` (Chromium 102, WebKit 15.5). Anchor
  positioning (Chromium 125, WebKit 26) and ARIA element reflection (`ariaDescribedByElements`, Chromium 135) are
  above the floor and not used.
- **Floor consumers**: none declares one today (no `engines` or `browserslist` in `@ocelle/elements`, no Vite
  `build.target`, `tsconfig` `es2024`). So FR-040 changes only the README § Engines list.
- **Kitty Desktop** (FR-041): Tauri uses WKWebView on macOS and WebKitGTK on Linux.
  - macOS: WKWebView is the system WebKit. Safari 17 shipped for macOS 12 Monterey and later, so a Mac on macOS 12+
    with current updates is at WebKit 17 or newer.
  - Linux: WebKitGTK version numbers are not WebKit's. The Popover API is enabled in WebKitGTK from the 2.44 line by
    our reading of its release notes, which is **unverified here** (no network access to Kitty Desktop's build).
  - **Risk for the operator** (plan § Risks): a Linux host with an older WebKitGTK shows no bubble. Its trigger keeps
    its name (FR-037), so nothing essential is lost. Phase 4's review records the WebKitGTK version Kitty Desktop
    ships, from its build files, before approval.

## R-11 Placing the bubble without a `style` attribute (FR-035, FR-047, SPEC-1-03, SPEC-1-08)

- **Decision**: the tooltip owns one constructable `CSSStyleSheet` per instance, adopted after the shared element
  sheet. Placing the bubble calls `replaceSync()` with one rule
  `[part="bubble"] { inset-block-start: <y>px; inset-inline-start: <x>px; }` (numbers computed at run time, not
  literals in element CSS), with `position: fixed` and `inset: auto` from the static sheet. No `style` attribute, no
  `<style>` element, no CSSOM write to an element's `style`.
- **Placement**: measure the trigger's border box and the bubble's size after it is shown.
  - Main axis: `placement` (logical; `start`/`end` follow `:dir(rtl)` on the tooltip host), offset by
    `--ocelle-space-2`. If it overflows the viewport minus `--ocelle-gutter`, use the opposite side. If neither side
    fits, keep the `placement` side.
  - Cross axis: centre on the trigger, then clamp inside the viewport minus `--ocelle-gutter` (SPEC-1-08).
- While shown, it is re-placed on `scroll` (capture, any scroller) and `resize`, throttled to one placement per
  animation frame. It is hidden if the trigger is removed or `disabled`.
- **Gap and hoverability** (FR-032): the bubble's hit box includes the offset. Its padding on the trigger's side is
  `--ocelle-space-2`, transparent, with the visible box painted by an inner element. The pointer therefore goes from
  trigger to bubble without leaving both, and no timer is needed for the crossing.

## R-12 Tooltip show and hide logic (FR-031 to FR-033, SPEC-2-02, SPEC-2-03)

- **Trigger**: the first element assigned to the default slot (`slotchange` tracked).
- **Pointer**: `pointerenter` on trigger or bubble with `pointerType` other than `touch` starts the delay timer, or
  shows at once when it is already shown or the delay is 0 ms. `pointerleave` from both clears the timer and hides
  unless keyboard focus holds.
- **Keyboard focus**: on `focusin` (composed) the deepest active element inside the trigger is checked against
  `:focus-visible`. If it matches, the bubble shows at once. A trigger focused by a click that later starts matching
  `:focus-visible` (after a keypress, without focus moving) does **not** show the bubble. Only focus arriving while it
  matches does (SPEC-2-03). `focusout` hides unless hovered.
- **Escape** (FR-033): while a bubble is shown, a `keydown` listener in the capture phase on `window` takes Escape,
  hides the bubble, and calls `preventDefault()` and `stopPropagation()`. An overlay's keydown (R-02) never sees it.
  The listener is removed on hide. After Escape the bubble stays hidden until the pointer re-enters the trigger or
  bubble, or keyboard focus re-enters. FR-032's "stays while" is read with this exception (SPEC-2-02).
- **Touch**: `pointerType === "touch"` never starts a show. A tap's focus does not match `:focus-visible`.
- **Delay**: read from the computed `--ocelle-tooltip-delay` on the host when the timer starts (`setTimeout` with a
  function; the `csp` gate's `pass-function-timer` plant allows it).

## R-13 Tooltip semantics without crossing a shadow root (FR-036, FR-037, SPEC-2-01, SPEC-2-05)

- **Without `describes`** (default): the bubble has `aria-hidden="true"`. The tree holds no tooltip node and the
  trigger has no description from the tooltip. The text is the trigger's name only, as the host gave it.
- **With `describes`**: the tooltip adds one light-DOM child to its host,
  `<span slot="ocelle-description" role="tooltip" hidden id="<generated>">text</span>`. It is assigned to a slot the
  shadow root does not render, so it is never painted. The tooltip also adds that id to the trigger's
  `aria-describedby`, keeping any ids the host put there and removing only its own on change or disconnect.
  - Trigger, span and id are in one tree (the trigger's), so no ID reference crosses a shadow root.
  - The visible bubble stays `aria-hidden`, so the text is heard once.
  - **Measured** (probe `probes/probe2.cjs`): a button with `aria-describedby` pointing at a `hidden` `role="tooltip"` span
    has the description "Saves the draft" in Chromium's AX tree.
- **Where the spec text moves**: FR-036's "the bubble has role `tooltip`" becomes, in this design, "the description
  node has role `tooltip`; the painted bubble is hidden from the tree". The plan squad decides whether the spec takes
  this wording.
- **Custom-element triggers** (SPEC-2-05): `describes` is supported only when the trigger itself is the focusable
  element (a native control, or a custom element that is focusable as its host). A custom element whose inner control
  takes focus (#7's pill tag, #12's nav item) cannot receive a description from outside its shadow root. Neither
  consumer needs one: both use the default mode. The README states the limit, and a later mission that needs it adds a
  contract.
- **ARIA element reflection** (Chromium 135+) is not used: it is above the Chromium floor, and it cannot reach into a
  descendant shadow root either.

## R-14 Test harness additions

- **Driver** (`test/scenarios/driver.ts`) gains input and state methods, implemented in both harnesses:
  - `press(key, { shift? })`, `hover(id | null, inner?)`, `click(id, inner?, { button? })`, `tap(id)`;
  - `focusPath()`: the deep active element as id plus inner selector, or `"body"`;
  - `reducedMotion(on)`;
  - `record(id, eventNames)` and `recorded()`: events with `detail`, `cancelable`, `bubbles` and `composed`, recorded in
    the page;
  - `topLayer()`: which overlay and popover elements are open, in stacking order (`:modal`, `:popover-open`);
  - `styleAttributes()` and `styleElements()`: FR-047's counts over the document and every open shadow root.
- **In process**: `userEvent` from `vitest/browser` (the Playwright provider sends real CDP input, so `:hover`,
  `:focus-visible` and pointer events are real). A new browser command `emulateReducedMotion` calls
  `page.emulateMedia({ reducedMotion })`. The reset helper resets it together with forced colours, so state never
  leaks between files (finding `frontend-missions.md` L161-165). `axTree` returns `description`, `modal` and `level`
  as well as role and name.
- **Strict-CSP fixture**: new pages `overlays.html` and `tooltip.html`, with real input through `page.keyboard` and
  `page.mouse`.

## R-15 Timing tests and mutation (FR-046; mission 007)

- **Mission 007** keeps "a timeout is a kill" (001 FR-011) and reports every Timeout and CompileError mutant on a
  changed line as a report line, not a finding. Its FR-012 forbids reaching the bounds by shortening Stryker's time
  limit, excluding mutators or adding disable comments.
- **Decision**: no test waits without a bound shorter than Stryker's limit. Every wait is a bounded poll (at most
  1 000 ms, failing with a message). A mutant that stops a bubble from showing, or an overlay from closing, then
  fails an assertion (**Killed**) instead of hanging (**Timeout**). Each timing rule is tested from both sides:
  - Fixture pages and in-process mounts set `--ocelle-tooltip-delay: 200ms` through a test stylesheet (adopted
    in process, linked on the fixture). Hover, then check that the bubble is not shown after one frame and 100 ms, and
    that it is shown within the bounded poll.
  - With the delay at `0ms`, the bubble shows in the same task as `pointerenter`.
  - Keyboard focus shows it at once, whatever the delay.
- The exit animation is tested with `--ocelle-motion-base` at its real 200 ms: `open` is false at once, the close
  event fires only after the dialog has left the top layer, and focus is returned before the close event is
  dispatched. Under reduced motion all of this happens within one update.
- The phase reviews read the 007 report lines. Any Timeout on this feature's changed lines is named in the review with
  its cause, and a test is added that kills it by assertion where possible.

## R-16 Stories against #10 (FR-042) — recheck when #10 lands

From `specs/006-storybook-workbench` on its branch (design final, unmerged):

- **Capture context** (`gates/lib/capture-plan.ts`): 1280 × 800, `reducedMotion: "reduce"`,
  `animations: "disabled"`, full page. Top-layer content inside `#storybook-root` is in the capture (FR-012; plant
  `pass-overflow-and-popover`). Elements must use open shadow roots and render every surface inside their own host
  (FR-014, FR-027); the overlays and the bubble do.
- **Open overlays**: a story renders `<ocelle-dialog open …>`. The element calls `showModal()` on its first update, so
  the capture (after `STORY_RENDERED`, `fonts.ready` and two frames) holds the open dialog. No play function exists or
  is needed.
- **Shown tooltip**: 006 FR-031's pointer state `parameters: { ocelle: { pointer: { hover: "<selector>" } } }` moves
  the mouse onto the trigger. The trigger must lie wholly inside 1280 × 800 at scroll (0, 0). The capture follows
  within two frames, before a 500 ms delay would fire, so the tooltip stories override `--ocelle-tooltip-delay` to
  `0ms` with a class rule in `storybook/.storybook/stories-layout.css` (no `style` attribute in story markup). With
  0 ms the bubble shows in the same task as `pointerenter` (R-15). One hover state per story, so there is one story per
  placement.
- **Focus-shown tooltip**: 006 has no focus state, so no story shows the bubble by focus. Focus behaviour is proven by
  the interaction tests (FR-043).
- **axe**: runs on the same context. Overlays name themselves (R-08). The tooltip's description node is `hidden`. No
  `a11y-exceptions.json` entry is planned.
- **Baselines**: `storybook/baselines/<story-id>.<theme>.png`, produced by `pnpm run visual:update` in the pinned
  container. CI's captures win over local ones (006 FR-005). Each new story and theme needs its baseline.
- **Contributor note**: `storybook/README.md` (006 FR-025) is followed. Nothing in this feature changes it.
- **Recheck when #10 lands**: before the story tasks run, compare these facts with merged `main`: the parameter shape,
  the capture context, the baseline path and command, the stories-layout stylesheet, the axe rule set and exceptions
  file, and the story-index test. Then update this section and the tasks in one commit. Implementation waits for #10
  (operator).

## R-17 Shared files with parallel missions

- `packages/elements/src/index.ts`, `test/exports.test.ts` (the sorted export keys), `package.json` `exports`,
  `custom-elements.json`, `README.md`, `CHANGELOG.md`, `storybook/.storybook/*` and `packages/tokens/src/source.ts`
  with `test/expected.ts` are also touched by 009 to 011 (#15, #9, #8).
- Conflicts are resolved by merging `main` into `claude/016-overlays`, never by rebasing. After a merge, the manifest
  is regenerated (`pnpm --filter @ocelle/elements run manifest`) rather than hand-merged, and the export-key list is
  re-sorted.

## Spec-check notes settled here

| Note | Settled in |
|---|---|
| SPEC-1-05 close timing | R-06 |
| SPEC-1-06 exit animation and floor | R-06, R-10 |
| SPEC-1-07 FR-034 light-dismiss wording | R-10 (`popover="manual"`). The spec wording is for the squad fix. |
| SPEC-1-08 cross-axis overflow | R-11 |
| SPEC-1-09 SC-001 path count | plan § Test matrix: three request reasons (two on the dialog) × {veto, no veto}, plus `host` |
| SPEC-1-11 drawer reset, forced colours and long body | plan § Test matrix and the drawer story list (data-model) |
| SPEC-1-12 opener gone | R-05 |
| SPEC-1-13 unnamed overlay, long label | R-08 |
| SPEC-1-14 token values | R-09 |
| SPEC-1-15 / SPEC-2-05 custom-element trigger | R-13 |
| SPEC-1-16 dialog default inline size | R-09 |
| SPEC-1-17 heading level | R-08 (level 2) |
| SPEC-2-01 tree in each mode | R-13 |
| SPEC-2-02 Escape versus "stays" | R-12 |
| SPEC-2-03 late `:focus-visible` | R-12 |
| SPEC-2-04 FR-047 placement | plan § Test matrix: FR-047's counts run after every open, close and placement scenario |
