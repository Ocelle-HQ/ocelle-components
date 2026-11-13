# Research: Action Controls, `ocelle-button` and `ocelle-action-row`

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Date**: 2026-11-13

Measurements were taken on 2026-11-13 in this container with Chromium 153.0.8010.12
(`/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, the build `OCELLE_CHROMIUM_PATH` points at here; the pinned
Playwright 1.64.1 expects build 1248, which CI installs) through the CDP Accessibility domain, and axe-core on the same
pages. The experiment scripts are not part of the repository; each finding below states what was measured. WebKit is
not available here and is not measured (an open limitation, as in mission 005).

## R-01 Element structure: one inner control, no `delegatesFocus`

**Decision**: each element renders, in an open shadow root, exactly one native `<button type="button">` (button mode)
or `<a>` (link mode) with the CSS part `control`, laid out by mission 005's slot convention (`icon-row`,
`iconSlotStyles`). The host is `display: inline-block` (button) or `display: block` (row) and gets no tabindex and no
role. The shadow root is attached without `delegatesFocus`.

**Rationale**: measured: the host is never in the tab order and never marked focusable in the AX tree whether or not
`delegatesFocus` is set; `document.activeElement` is the host while the inner control has focus in both cases (normal
shadow DOM retargeting), so a host's `focusout` and `:focus-within` work either way. `delegatesFocus` adds that
`host.focus()` and clicks on the host's padding move focus to the inner control; the host has no padding of its own
(the inner control fills it), and `host.focus()` is a convenience a host may want. **Decision refined**: set
`delegatesFocus: true`, because `ocelle-button.focus()` is what a host (and #16's dialog returning focus to its
opener) calls; measured, it focuses the inner control, `:focus-visible` follows the last interaction mode, and it
does nothing when the inner button is disabled, which is the wanted result (a disabled control takes no focus).

**Alternatives**: a light-DOM inner control (rejected: the host page's CSS would style it, against constitution II's
token-only rule and mission 005's conventions); `ElementInternals` with `role="button"` on a focusable host (rejected:
link mode needs a real `<a>` for modifier clicks, the context menu and drag, which a host role cannot give).

## R-02 Link versus button

**Decision**: link mode exactly when `href` is non-empty after trimming and its scheme, parsed with `new URL(href,
document.baseURI)`, is not `javascript:`; otherwise button mode. A disabled link renders `<a role="link"
aria-disabled="true">` with no `href` attribute; a busy button in link mode and an unavailable link row keep `href`
(they stay focusable, R-04).

**Rationale**: measured: an `<a>` without `href` is ignored in the AX tree and not focusable (its `tabIndex` property
still reads 0); with `role="link" aria-disabled="true"` it is one node of role `link`, disabled, not focusable by Tab
or `.focus()`. Removing `href` also turns `draggable` false and removes the context menu's link items, so a disabled
link opens nothing by any means. A `javascript:` URL in an `href` is a script source the strict CSP blocks anyway;
not rendering it keeps the built output free of it (spec edge case).

## R-03 ARIA passthrough by moving host attributes (operator decision)

**Decision**: the attributes FR-009 and FR-030 list (`aria-expanded`, `aria-controls`, `aria-current`, `aria-label`,
`aria-labelledby`, `aria-describedby` on the button; `aria-label`, `aria-labelledby`, `aria-describedby` on the row)
are observed. When one is set on the host, the element stores the value in a private field, removes the attribute
from the host, and renders the stored value onto the inner control (non-reference attributes as attributes; ID
references through element reflection, R-04). An empty value clears the stored value. Removing an attribute the
element itself removed is ignored (it is the element's own `attributeChangedCallback` with `null`). A value present
in the markup before upgrade is moved at `connectedCallback`.

**Rationale**, measured (operator question at planning, answer "Move to inner control", recorded in the spec header):

- a host that keeps `aria-label` or `aria-labelledby` and has no role is a `generic` node named by it, beside the
  inner button with the same name: two named nodes for one control;
- axe-core gives no violation but two "needs review" (incomplete) results on such a host: `aria-allowed-attr`
  (critical, for `aria-expanded`) and `aria-prohibited-attr` (serious, for `aria-label`/`aria-labelledby`); #10's axe
  gate counts incomplete serious and critical results as failures (006 contracts/gates.md);
- an `ElementInternals` role of `none` or `presentation` does not remove the host from the tree (still `generic`,
  named) and does not clear either axe result; `ariaHidden` on the internals hides the inner control too.

The cost, stated in the README: `getAttribute` on the host returns `null` after the move, and `removeAttribute`
cannot clear a moved state; a host clears with the empty value or `"false"`. Frameworks that set attributes
declaratively (Svelte, htmx swaps, Thymeleaf renders) set the attribute again on each change, which the element
moves again, so their state stays in step. ARIA reflection properties on the host (`host.ariaExpanded = "true"`) set
the attribute and are moved the same way.

**Alternatives**: keep on host with recorded axe exceptions (rejected by the operator); element properties instead of
host ARIA (rejected by the operator: rewrites #501's ask).

## R-04 ID references by element reflection; engine floor to Chromium 135

**Decision**: `aria-controls`, `aria-labelledby` and `aria-describedby` values are split on whitespace, each id is
looked up with `this.getRootNode().getElementById(id)` (the document or the shadow root the host is in), found
elements are assigned in order to the inner control's `ariaControlsElements`, `ariaLabelledByElements` and
`ariaDescribedByElements`, and ids not found are skipped. Lookup runs when the attribute is set and on
`connectedCallback`. The row's own description (FR-034) is built the same way: the inner control's
`ariaDescribedByElements` is set to the elements assigned to the `description` slot followed by those of the `tags`
slot, unless a host `aria-describedby` was moved, which then wins. The README's engine floor rises from Chromium 120
to **Chromium 135**, the release that shipped element reflection for these properties, and the engines section names
the feature behind it; WebKit's floor is stated as unmeasured for this feature.

**Rationale**, measured: the three properties exist; set on an inner button to light-DOM elements (a
shadow-including ancestor tree) the AX tree shows the controls relation, the name from the labelledby element and the
description from the describedby element; elements in a sibling shadow root are dropped (the getter returns `[]`);
plain id attributes copied into the shadow root do not resolve. Slotted elements are in the host's light tree, so
the row's description and tags elements resolve as light-DOM targets. Chrome 135 (stable 2025-04-01) shipped the element-reference properties (Chrome 135 release
notes; blink-dev intent to ship; `ariaLabelledByElements` is not named there individually, so phase 3's spike
checks the Chromium release notes again and the README floor names the first release that has all three); `ariaOwnsElements` does not exist and is not used.

**Alternatives**: copying ids into the shadow root (does not resolve, constitution III forbids); a light-DOM proxy
element carrying `aria-labelledby` (rejected: adds nodes to the host's tree).

## R-05 Name precedence

**Decision**: the inner control's name sources are set so Chromium's own name computation gives FR-006's order: a
moved `aria-labelledby` becomes `ariaLabelledByElements`; a moved `aria-label` becomes the inner control's
`aria-label`; otherwise a trimmed non-empty `label` becomes the inner control's `aria-label`; otherwise the content
(the default slot; slotted icons are decorative and contribute nothing, mission 005). Measured: with both
`ariaLabelledByElements` and `aria-label` on the inner button, labelledby wins (Accessible Name 1.2). The element
never trims a moved `aria-label` (mission 005's rule: hosts pass it trimmed). Mission 005's `naming.ts` (`expose`) is
image-specific and is not reused; a new internal module `control.ts` holds the shared control logic (R-12).

## R-06 Stopping activation ("not activated")

**Decision**: one capture-free guard on the inner control, in the shadow root: a `click` listener and an `auxclick`
listener that, while the control is unavailable (busy button, unavailable row), call `preventDefault()` and
`stopImmediatePropagation()`. Disabled button mode relies on the native `disabled` attribute; disabled link mode has
no `href` (R-02). The row's own activation listener runs after the guard and only when the control is available; in
link mode it ignores clicks with `ctrlKey`, `metaKey`, `shiftKey` or `altKey` and dispatches nothing for `auxclick`
(SPEC-1-09; Alt is treated as a modifier, closing check-3 note SPEC-3-02: Chromium may download on Alt-click, which is
the browser's default the operator chose to leave alone).

**Rationale**, measured: `preventDefault()` in a `click` listener stops navigation for plain, Ctrl, Meta, Shift and Alt
clicks and for Enter and Ctrl+Enter on a focused link; a middle click fires no `click`, only `auxclick`, and opens a
new tab unless `auxclick` is prevented; Enter and Space on a focused button fire a `click` the same listener stops;
`stopImmediatePropagation()` on the inner element keeps the composed click from reaching bubble-phase listeners on
the host and the document, while a capture-phase listener on the document still sees it (the spec's stated limit).
A disabled native `<button>` delivers only `pointerdown` to ancestors, no `mousedown`, `mouseup` or `click`, and
`.click()` does nothing. Playwright refuses to click an `aria-disabled` element without `force: true`, so the tests
click with `force: true` (otherwise the "not activated" tests would pass vacuously, with no click sent at all).

**Open (check-3 note SPEC-3-03)**: a busy link-mode button and an unavailable link row keep `href`, so the context
menu's "open in new tab" and drag-to-tab still work (not automatable here). Decided: accepted and documented in the
README ("unavailable stops activation by click and key; the browser's context menu is outside it"), because removing
`href` would also remove the link role's focusability, which unavailable must keep. The plan squad may challenge it.

## R-07 Busy spinner and reduced motion

**Decision**: the spinner is an inline SVG in the shadow root (one circle arc, `stroke="currentColor"`, no fill), in
a wrapper `span.icon-slot` placed where the `icon` slot wrapper is; while busy the `icon` slot's wrapper gets the
`hidden` attribute (the slotted icon is not shown) and the spinner wrapper is shown, so with an icon the box keeps its
size and without one the spinner takes the icon position with the slot convention's gap (`--ocelle-space-2` as
`margin-inline-end`). It rotates with an `@keyframes` animation whose duration is a motion token; under
`prefers-reduced-motion: reduce` the animation is `none` (measured: `animation-name` computes `none`). The arc is a
partial circle drawn by `stroke-dasharray` in the SVG's own units (presentation attributes, not a `style` attribute),
so it is still visibly a busy mark when still. The spinner SVG has `aria-hidden="true"`.

**Rationale**: measured, a border-based spinner (transparent border segment) computes every segment to the system
colour in forced colours, a full ring with no gap; an SVG stroke in `currentColor` keeps its gap and takes the system
colour. The motion token: `--ocelle-motion-base` is 200 ms, too fast for one turn; a new token is not needed if the
duration is `calc(var(--ocelle-motion-base) * 4)`, but the `token-only` lint forbids a bare number factor beside a
token, so: add the duration token `--ocelle-motion-spin` (800 ms, `0ms` under reduced
motion, as the other motion tokens) to `@ocelle/tokens` (FR-055's tokens changelog applies). An animation with 0 ms
duration still has `animation-name` set, so the element also sets `animation: none` under the reduced-motion query
(two independent mechanisms, each tested: the token's value in the tokens tests, the element's rule in the element
tests).

**Alternatives**: a CSS border spinner (fails forced colours, above); `animation-play-state: paused` under reduced
motion (rejected: leaves a moving element if the query flips mid-animation in some engines; `none` is plain).

## R-08 Tokens and contrast

**Decisions**:

1. **`color-ink` on the state grounds** (spec FR-018, US1-4, US1-13; check-2 note SPEC-2-05): add the five state
   grounds to `color-ink`'s `contrast.grounds` in `packages/tokens/src/source.ts` and the ten new required rows (both
   themes) to `packages/tokens/contrast/pairs.json` with figures from `gate:contrast --print`. If any figure is below
   4.5:1 the phase stops and the operator is asked (it would be a token value change, out of this feature's scope).
2. **Hover border** (FR-036, #525): a new token `--ocelle-color-hover-border` with `ref: ["color-accent-strong"]`
   (`var(--ocelle-color-accent-strong)`), non-text, grounds `color-hover-bg` and `color-accent-low` (the two surfaces
   a hovered row has) and the main and state grounds a hovered row's border sits against. A host overrides it on an
   ancestor (#525's ask) without touching `color-accent-strong`.
3. **Current bar** on main grounds: the bar always sits on the row's `accent-low` surface (FR-037), already a declared
   ground of `color-current`; no new pair. Focus ring: `color-focus` is declared on main, chrome and state grounds,
   which cover `accent-low` and `hover-bg`; no new pair.
4. **Button fills** (check-2 note SPEC-2-06): `primary` fills with `--ocelle-color-accent` and `--ocelle-color-on-accent`
   text (a declared pair), with an `--ocelle-color-accent-strong` border on every ground. Measured from the token
   values: the ochre fill against the light main grounds is 2.37 (rail) to 2.98 (pane), below 3:1, so in light mode
   the fill cannot be the boundary (and constitution II forbids it as the only mark); `color-accent-strong` measures
   4.43 to 5.56 light and 7.44 to 8.30 dark against canvas, sheet, pane and rail. `color-accent-strong`'s
   `contrast.grounds` gain `color-canvas`, `color-sheet`, `color-pane`, `color-panel`, `color-inspector` and
   `color-rail` (twelve new required rows). `secondary` fills with `--ocelle-color-sheet`, border
   `--ocelle-color-control-border` (or `color-accent-strong` on `accent-low`, `inset`, `hover-bg` and the state
   grounds, #5 rule 1); `quiet` has no fill and the same border rule; secondary and quiet fill with `--ocelle-color-hover-bg`
   on hover; a hovered primary keeps its fill and its border changes to `--ocelle-color-hover-border`, so hover adds
   no new text pair.
5. **Row fill**: `default` row surface `--ocelle-color-sheet` (cards and facts, as the token's comment says).
6. **Disabled**: `--ocelle-color-disabled-bg` fill (filled variants) and `--ocelle-color-disabled-ink` text, exempt.
7. **Title gap** (FR-038): `--ocelle-space-1`, exposed through the part `title`; no new token.
8. **Spinner duration**: `--ocelle-motion-spin` (R-07).

Every new or changed token goes through `source.ts`, `test/expected.ts` (hand-written), the tokens browser values
test, `pairs.json`, the tokens README and CHANGELOG, as mission 003 did.

## R-09 Sizes and the minimum target

**Decision**: `size="default"`: `min-block-size` and `min-inline-size` `var(--ocelle-target-min)`, font
`--ocelle-font-size-md`, `padding-inline: var(--ocelle-space-4)`; the inner control is a flex box that centres the
slot convention's `icon-row` (which carries no block padding of its own beyond the convention's). `size="compact"`:
font `--ocelle-font-size-sm`, line height `--ocelle-line-height-compact`, `padding-inline: var(--ocelle-space-2)`,
`min-block-size` and `min-inline-size` `var(--ocelle-space-6)` (1.5 rem, 24 px). `flush`: `padding-inline: 0`, no
border, transparent background, minimum sizes of its `size` unchanged. A row: `min-block-size:
var(--ocelle-target-min)` in every presentation and layout (SPEC-1-08).

**Rationale**: tokens only; 24 px from an existing space token; measured nothing needed beyond computed values, which
the tests read.

## R-10 Row layout and width

**Decision**: the row's inner control is a flex container (`row` layout: `flex-wrap: wrap`, the icon/title/description
group `flex: 1 1 auto` with `min-inline-size: min-content`, the tags-and-trailing group `flex: 0 0 auto` wrapping as a
whole, FR-032; `card` layout: a two-row grid, title line with trailing at its end, then description, then tags). The
tags slot's container is `display: flex; flex-wrap: wrap; gap: var(--ocelle-space-1)` and each slotted tag gets
`::slotted(*) { overflow-wrap: normal; word-break: normal; }` so a tag never breaks inside a word, except a tag wider
than the card, which gets `max-inline-size: 100%` and `overflow-wrap: anywhere` (US5-8). The host is `display: block;
min-inline-size: min-content` (FR-040).

**Rationale**, measured: inside a shrink-to-fit parent every display value gives the content width; a block or flex
host collapses to 0 only when its parent is forced narrower than its content, and `min-inline-size: min-content`
prevents that while still stretching in a block parent; `inline-flex` never collapses but does not stretch, which a
list row must.

## R-11 Test harness extensions

**Decision**: extend mission 005's driver (`packages/elements/test/scenarios/driver.ts`), both drivers (in-process
and fixture), and the browser commands, red first in phase 1:

- `focus(id)`, `press(key, modifiers?)` (keyboard through the browser, so Enter and Space reach the native control),
  `click(id, { inner?, modifiers?, button? })` with `force: true` (R-06), `tabOrder()` (Tab from the start of the
  page, collecting `activeElement` paths including the shadow-retargeted inner control), `activeInner(id)`;
- `events(id, types)` and `takeEvents()`: a recorder that adds bubble-phase listeners on the element, its ancestors,
  `document` and `window` and records type, `bubbles`, `composed`, `cancelable`, `defaultPrevented` and `detail`;
  `preventNext(type)` to make a listener call `preventDefault()`;
- `navigations()`: in-process, a `click` default observer cannot see navigation, so link scenarios run on the fixture
  harness only (a page with a target route recording visits and `context.on("page")` for new tabs), and the
  in-process run asserts `defaultPrevented` of the click event instead (the observable in-process half);
- AX states and relations: `ax(id)` returns `{ role, name, description, disabled, expanded, busy, current?,
  focusable, controls: [ids] }`; measured, CDP never reports `aria-current`, so `current` is read as the inner
  control's `ariaCurrent` reflection plus the attribute (documented as a DOM assertion, not an AX one);
- `emulateReducedMotion("reduce" | "no-preference")` beside `emulateForcedColors`, reset after each test (mission 005
  finding: in-process tests share one page);
- `axe(scope?)`: runs axe-core in the page with 006's rule set and returns serious and critical violations and
  incomplete results; added as a root devDependency `axe-core` **4.14.0**, the version 006 pins (so the lockfile
  converges when #10 lands), loaded in-process by import and on the fixture by serving the file under the strict CSP
  (`script-src 'self'`).

Every new driver method and command gets a unit test against a plain test page, red first (the commands are test
infrastructure but have behaviour).

## R-12 Module layout

**Decision**: `src/control.ts` (internal) holds: the mode decision (R-02), the attribute move and reference
resolution (R-03, R-04), the name source rule (R-05), the activation guard (R-06) and the shared control styles
(focus ring, forced colours, disabled look) as a `css` export `controlStyles`. `src/spinner.ts` (internal) holds the
spinner template and styles. `src/ocelle-button.ts` and `src/ocelle-action-row.ts` follow mission 005's element
conventions (one module each, `define()`, `static properties`, `@tagname`, `@default`, JSDoc on every public member
for the manifest, `:host([hidden])`, variant rules inside `@media not (forced-colors: active)`). The focus ring uses
`outline` longhands (mission 005 finding: the shorthand with `var()` fails in Chromium): `outline-style: solid`,
`outline-width: var(--ocelle-focus-width)`, `outline-color: var(--ocelle-color-focus)`, `outline-offset:
var(--ocelle-focus-offset)`, on `:focus-visible` of the inner control, for both elements. A full-width row at the
viewport edge would clip an outer ring (mission 005 finding); the README tells hosts to give a row list
`--ocelle-focus-offset` plus `--ocelle-focus-width` of inline padding. The plan squad may challenge it.

## R-13 Stories, baselines and axe against feature 006

**Decision**: stories in `storybook/stories/button.stories.ts` and `storybook/stories/action-row.stories.ts` (title
`Elements/ocelle-button`, `Elements/ocelle-action-row`), one export per variant and state as FR-050 lists, right-to-
left as separate stories with `dir="rtl"` in their markup (006 has no direction axis), hover and press declared with
`parameters.ocelle.pointer` (one per story, a selector that matches exactly one element, inside 1280 × 800 at scroll
0, 0), focus by a wrapper that focuses programmatically (006 has no focus parameter; whether `:focus-visible` then
shows is measured in phase 2 before the focus story is written). Inner controls set `font: inherit` (006's `font`
check). Forced colours are not captured by 006; they stay in the element tests. Story tests (operator decision I3)
are written in each phase's red commit: the existing `storybook/test/integration/elements-stories.test.ts` is
extended with the new story ids, red first, each story rendering its elements in light and dark.

When #10 has merged (it is complete on its branch, all phases approved, waiting for its landing), the branch takes it
at landing (`/ocelle-land` merges main) and phase 7 does the 006 work: baselines produced in the pinned container
(`pnpm run visual:update`, CI's job artifact committed when local and CI captures differ), the axe gate on every new
story, the hard-coded story counts in four integration tests (`storybook-build`, `visual`, `axe`, `plant-repo`), the
`fail-token-changed` and `fail-empty-index` plants, and the shard budget: 006's Complexity Tracking requires lowering
`shardSize` (3, `gates/lib/plant-runner.ts`) before the repository has 25 stories; main has 21 and this feature adds
about 28, so phase 7 lowers `shardSize` test-first with a CI run showing every Plants shard under 10 minutes. The
CSP checks that 006 removes from `elements-stories.test.ts` are not added to the new stories' tests. If #10 has not
merged at landing, 001's "gates absent" exception applies to the new stories as in mission 005, with the sunset "the
merge of #10" (Complexity Tracking), and phase 7 becomes the first task of whichever lands second. **This section must
be rechecked when #10 lands** (operator instruction).

## R-14 Mutation testing

**Decision**: element source (`src/control.ts`, `src/spinner.ts`, `src/ocelle-button.ts`,
`src/ocelle-action-row.ts`) is mutated in-process under `stryker.elements.config.json`, as mission 005 routed it.
Verdicts follow mission 007: Survived and NoCoverage on a changed line fail; Killed, Timeout and RuntimeError are
killed; CompileError is invalid; Timeout and CompileError are reported and still pass (007 clarifications,
2026-11-10). The spinner's animation and the activation guard invite Timeout mutants (a removed guard can loop a
click handler); they pass by that decision but are listed in the phase review. Equivalent mutants are recorded inline
with a reason. Entries are at most 30 changed lines (007 FR-014). Token source changes are mutated under the default
configuration with the tokens tests.

## R-15 Out of scope reminders

The pill tag (and its tooltip from #16's `ocelle-tooltip`, `specs/008-overlays` on `claude/016-overlays`) moved to
the later status mission; its implementation needs #16 merged first. Nothing in this feature depends on #16.
`ocelle-button`'s public interface (contracts/elements-package.md) is what #12 (flush, compact breadcrumb items) and
#14 (a flush Copy control) consume.
