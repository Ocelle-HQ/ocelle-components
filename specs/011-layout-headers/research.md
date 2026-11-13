# Research: Layout and Headers (011)

Decisions for [plan.md](plan.md). Each item: Decision, Rationale, Alternatives. "Measure before red" marks a
browser fact that phase 1's spike (`reviews/phase-1/spike.md`) measures in this container's Chromium before any red
commit depends on it; if a measurement disagrees, the spike records it and the plan's fallback named in that item is
used, or the operator is asked when no fallback is named.

## R-01 Conventions and files

**Decision**: the five elements follow `packages/elements/README.md` § Element conventions as mission 005 left
them: `src/ocelle-card.ts`, `src/ocelle-section-header.ts`, `src/ocelle-page-header.ts`,
`src/ocelle-context-sidebar.ts`, `src/ocelle-personal-rail.ts`, each ending in one `define()` call, each exported from
`src/index.ts` and defined by `src/browser.ts`; entry points `@ocelle/elements/<tag>.js` in `package.json` `exports`
(public surface, contracts/elements-package.md). Internal modules beside them: `src/slot-state.ts` (R-03) and
`src/card-context.ts` (R-05). Styles are one `css` template per element; variant rules sit inside
`@media not (forced-colors: active)` only where a forced-colours rule must reach them (grounds); layout rules do not
depend on forced colours and stay outside.

**Rationale**: FR-001; the README says a later element follows these rules without a design question.

**Alternatives**: one module for all five (rejected: an entry point defines one element).

## R-02 Slotted headings and fonts on slotted content

**Decision**: each header renders `<slot name="heading">` and styles `::slotted([slot="heading"])` with the tokens of
FR-012, FR-019 and FR-031 (`font-family`, `font-size`, `font-weight`, `letter-spacing`, `line-height`, `color`,
`margin: 0`, `overflow-wrap: break-word`, and `text-transform: uppercase` in the eyebrow style). No heading, `role` or
`aria-level` is rendered. The `::slotted()` rules beat the user agent's `h1`–`h6` rules (author origin over
user-agent origin) and lose to the page's own rules (outer context first), which is the spec's "Slotted headings"
rule. `--ocelle-figures` is applied with `font-variant-numeric`.

**Rationale**: keeps the page's heading level and outline with no ID reference across a shadow root (constitution
III; spec Assumptions).

**Alternatives**: a `level` property rendering `role="heading" aria-level` (rejected in the spec: page styles and
anchors would not reach it).

Measure before red: the UA `h1` margin and font size are overridden by `::slotted()` in Chromium (expected by the
cascade), and `text-transform` on a slotted heading gives the upper-cased name (already probed for spec check 1).

## R-03 Empty slots

**Decision**: an internal controller in `src/slot-state.ts` tracks, per slot of an element, whether it is empty by
the spec's definition (no assigned element, and every assigned text node empty or whitespace only; `assignedNodes()`
read on `slotchange`). Default slots, the only ones that can hold text nodes, are also re-read when an assigned
text node's data changes: a `MutationObserver` on the host with `characterData: true, subtree: true, childList: true`.
The state is a Lit `state` field per slot (not a property, not an attribute, not in the manifest) that sets an
`empty` class on the slot's wrapper in the shadow root; the wrapper of an empty slot is `display: none`, so it takes
no gap in its flex or grid container and adds no padding or divider (FR-005). A slot's wrapper starts empty until
the first read, which runs in `firstUpdated`, so a first paint never shows a gap that then disappears in a test that
measures after `updateComplete`.

**Rationale**: FR-005, US1-3, US1-4, US1-16, US2-4, US3-5, US3-6, US3-13, US4-6. `:has-slotted` is above the engine
floor (Chromium 134) and does not ignore whitespace text; `slotchange` does not fire for text data changes, hence the
observer.

**Alternatives**: `:has-slotted` (floor, whitespace); attributes on the host reflecting emptiness (would add public
surface the manifest must list).

## R-04 Section header layout (FR-010, FR-011)

**Decision**: the shadow root holds a row container (`display: flex; flex-wrap: wrap; column-gap:
var(--ocelle-space-4); row-gap: var(--ocelle-space-2); align-items: flex-start`) with two children: the heading
column (`display: flex; flex-direction: column; gap: var(--ocelle-space-1); flex: 1 1 min-content; min-inline-size:
0`) holding the eyebrow, heading and description wrappers, and the actions wrapper (`flex: 0 0 auto; display: flex;
flex-wrap: wrap; gap: var(--ocelle-space-2)`). Text wraps with `overflow-wrap: break-word`, so a word's min-content is
the whole word (the column wraps the actions under it only when its longest word and the actions do not fit side by
side) and a word longer than the line still breaks inside itself once the column is on its own line. The page header
uses the same structure with its own padding and rule (R-07).

**Rationale**: FR-010's rule and US1-14, US2-5. With an empty heading column side the wrappers are `display: none`
(R-03), so no gap remains.

Measure before red: `flex-basis: min-content` with `min-inline-size: 0` and `overflow-wrap: break-word` gives (a) the
actions beside the heading when the longest word plus actions fit, (b) the actions under the column when they do
not, and (c) a 60-character run broken inside the column at 320 px with no horizontal overflow. Fallback if (a)–(c)
fail: a grid with `grid-template-columns: minmax(min-content, 1fr) auto` and a container-free wrap rule decided in the
spike and recorded as a plan amendment at the phase-1 review.

## R-05 How a compact card reaches a slotted section header (SPEC-2-10, FR-007, FR-017)

**Decision**: an internal module, `src/card-context.ts`, holds a module-private `WeakMap<SectionHeader, boolean>`
setter and getter. The card, on its `header` slot's `slotchange` and whenever its `density` changes, calls
`setCardCompact(header, compact)` for every `ocelle-section-header` among `slot.assignedElements()` (directly
assigned only: FR-017 and US1-18) and `setCardCompact(header, false)` for those that left the slot since the last
read. The section header keeps the value in a Lit `state` field and resolves its size as: its own `size` when valid
(`"regular"` or `"compact"`), else compact when the card flag is set, else regular. No CSS custom property, part,
attribute or public property carries it, so FR-007's empty lists hold and the `style-lint` rule's unknown-`--ocelle-*`
check is untouched.

**Rationale**: `:host-context()` is not in WebKit; an element hook custom property would be public surface that
FR-007 excludes; a CSS custom property inherited from the card would also reach a header nested in the card's body
(US1-18 forbids that).

**Alternatives**: `--ocelle-card-header-size` declared in the manifest (rejected by FR-007, and it would reach nested
headers); `:host-context(ocelle-card[density=compact])` (Chromium only).

Two copies on a page (README § Two copies on a page): the first definition wins, so a card and header from one copy
share one `WeakMap`; the browser build and a module-build bundle each carry their own module, and the elements on the
page are the first copy's, so they still share one. No test is added for a mixed page beyond 005's.

## R-06 Variant attributes and "not set" (FR-006)

**Decision**: every variant property is declared with `reflect: true` and no initializer (`declare` field, JSDoc
`@default undefined`), so upgrade writes no attribute (US1-1). Styles key on the valid attribute values only
(`:host([density="compact"])`, `:host([size="compact"])`, `:host([orientation="horizontal"])`,
`:host([variant="eyebrow"])`), so an empty or invalid value matches no rule and draws the default look without
the element rewriting it (US1-17, US4-8). `inset` is `type: Boolean, reflect: true`, styled by `:host([inset])`,
so `inset=""` and `inset="inset"` both draw inset (US1-10). The section header's size that the card can override
(R-05) is resolved in script, since it needs the card flag: the header sets an internal class `compact` on its row
container when the resolved size is compact, and its stylesheet keys the heading size on that class.

**Rationale**: FR-006, FR-012, FR-017; no attribute churn on upgrade.

## R-07 Page header (FR-019) and its ground (SPEC-2-07, SPEC-3-06)

**Decision**: the host is `display: block` with block padding `--ocelle-space-4`, inline padding `--ocelle-space-6`
and `border-block-end: var(--ocelle-border-width) solid var(--ocelle-color-rule)`; it paints **no ground of its own**
(`background: none`): the band shows the surface it sits on (the page canvas or a pane). The description wrapper
carries `margin-block-start: var(--ocelle-space-1)` and the column has no other gap between heading and description;
the eyebrow-to-heading gap is `--ocelle-space-1`. The actions follow R-04's wrap rule, `--ocelle-space-2` under the
column. The `<header>` element is not used in the shadow root (a `header` not inside sectioning content maps to a
banner landmark); the band is a plain `div` (US2-1).

**Rationale**: #529 names no ground; a ground of its own would differ from the pane a header sits on in Kitty Desktop
(canvas in lists, pane in detail); the README states it. Plan squad may confirm.

## R-08 Card (FR-014 to FR-018)

**Decision**: the host is `display: block` with the border, radius, ground and padding of its density; inside, a
flex column with `gap` of the density (`--ocelle-space-2` regular, `--ocelle-space-4` compact) holding the `header`
wrapper and the default-slot wrapper. A card whose header slot is empty hides its wrapper (R-03), so no gap remains
(US1-11). `inset` swaps `background-color` to `--ocelle-color-inset`. In forced colours the border colour is left to
the system (`border-color` is forced to a system colour by the user agent) and grounds become `Canvas`; nothing
else is needed for US1-13 beyond `forced-color-adjust: auto` (the default). The card renders no role.

## R-09 Context sidebar dividers (FR-020 to FR-023)

**Decision**: the shadow root holds `<nav aria-label=…>` (R-11) as a flex column filling the host
(`display: flex; flex-direction: column; min-block-size: 100%`), with three wrappers: head (padding
`--ocelle-space-4`), sections (the default slot) and footer (padding `--ocelle-space-4`, `margin-block-start: auto`
so it sits at the block end when content is shorter, US3-3, and follows the last section when taller, US3-4).
Dividers:

- each section (`::slotted(:not([slot]))`, an element in the default slot) has padding `--ocelle-space-4` and
  `border-block-start: var(--ocelle-border-width) solid var(--ocelle-color-rule)`; the first section
  (`::slotted(:nth-child(1 of :not([slot])))`) has none;
- the sections wrapper has `border-block-start` when the head is non-empty and `border-block-end` when the footer is
  non-empty (internal classes from R-03; nothing when the default slot is empty, R-03 hides it);
- when the default slot is empty and both head and footer are non-empty, the footer wrapper has
  `border-block-start` (US3-13);
- text in the default slot: the sections wrapper has inline padding `--ocelle-space-4` and no block padding; each
  section takes negative inline margins equal to that padding (`margin-inline: calc(-1 * var(--ocelle-space-4))`) so
  its border spans the sidebar's whole inline size and its own padding gives the content inset (FR-021, FR-022,
  US3-11).

Element children with `slot=""` are not in scope: the README says sections carry no `slot` attribute. Hidden sections
still count (spec "Empty slot").

**Rationale**: the spec's divider placement (FR-022 as fixed for SPEC-3-01) with no change to the page's DOM.

Measure before red: `::slotted(:nth-child(1 of :not([slot])))` matches the first default-slot element when a head
element precedes it in DOM order (`:nth-child(of S)` is Chromium 111, WebKit 9, inside the floor); negative margins on
`::slotted()` elements in a padded wrapper give a full-width border. The page's DOM is never changed, so there is no
script fallback that marks the first section; if the measurement fails, the operator is asked before the US3 red
commit.

## R-10 Personal rail layout (FR-024 to FR-027; SPEC-2-04, SPEC-2-05, SPEC-3-05)

**Decision**: `<nav aria-label=…>` as a flex container filling the host, with three children: the primary wrapper,
a divider `div` (decorative, `aria-hidden="true"`, shown only when both groups are non-empty) and the bottom
wrapper. The nav's `gap` is `--ocelle-space-1`, which is also the gap on each side of the divider (SPEC-2-04).

- **Vertical** (default): `flex-direction: column; inline-size: var(--ocelle-shell-rail-width); min-block-size:
  100%; padding-block: var(--ocelle-space-2); padding-inline: var(--ocelle-space-1)`; groups are columns with
  `align-items: center; gap: var(--ocelle-space-1)`; the bottom wrapper has `margin-block-start: auto`; the divider is
  `border-block-start` across the content box. **Taller content than its container** (SPEC-2-05): the rail grows
  with its content (`min-block-size: 100%`, no `max-block-size`, no overflow clipping), as the sidebar does (FR-023);
  scrolling is the container's (#12's), stated in the README.
- **Horizontal**: `flex-direction: row; inline-size: 100%; padding: var(--ocelle-space-2)`; the primary wrapper is
  `flex: 1 1 0; display: flex; flex-wrap: wrap; gap: var(--ocelle-space-1)`; the bottom wrapper is `flex: 0 1 auto;
  max-inline-size: 50%; display: flex; flex-wrap: wrap; align-self: flex-start; justify-content: flex-end`; the
  divider is `align-self: stretch; border-inline-start` over the rail's content block size (every row, US4-7). Items
  are centred in the block direction within their row (`align-items: center`).
- The focus ring fits: the vertical content box is 44 px, a 40 px item leaves 2 px each side; the ring is drawn
  `--ocelle-focus-offset` + `--ocelle-focus-width` = 5 px outside the item, i.e. 3 px into the 4 px inline padding
  (1 px inside the border box). No `overflow` clipping is set on the rail (US4-2).
- Orientation is pure CSS on `:host([orientation="horizontal"])`; the template does not change with orientation, so
  focus, DOM order and the landmark node stay (US4-5).

**Rationale**: FR-025 as fixed; #492's exclusive-bound complaint is answered by having no threshold in the element
(FR-026). #12 drives the rail by setting `orientation` (a reflected attribute), which a drawer or a shell query can do;
no event is needed.

## R-11 Landmark naming (FR-020, FR-024, FR-028)

**Decision**: the sidebar and rail render `<nav>` in the shadow root with `aria-label` bound to the resolved name:
the host's `aria-label` attribute when present (a blank one yields an unnamed nav: the nav gets no `aria-label`),
else `label` (none when empty or whitespace). The host observes `aria-label` through `observedAttributes`, not a
declared property, as 005's elements do, so the manifest does not list it. The element never rewrites or removes the
page's `aria-label` on the host.

What the host itself exposes is measured before red: with `aria-label="Team"` on a custom-element host with an `id`
and no role, (a) does Chromium's full AX tree expose a second node named "Team" for the host besides the nav, and
(b) does axe 4.14.0 report a serious or critical finding (for example `aria-prohibited-attr`) on the host? Two options
are measured: (i) nothing on the host; (ii) `ElementInternals` with `internals.role = "none"` on the host. The first
option that gives exactly one navigation landmark with the expected name, no other node carrying the name, and no
serious or critical axe finding in all four US3-12 cases is used; it is recorded in `reviews/phase-1/spike.md` and
the README's section for these elements. Neither option adds public surface. If neither passes, the operator is asked
before the US3 red commit.

**Rationale**: the operator's "Follow convention" and FR-028's axe clause.

## R-12 Eyebrow tokens (FR-030 to FR-032)

**Decision**: four records in `packages/tokens/src/source.ts`, type group: `font-size-eyebrow` (`var(--ocelle-font-
size-xs)`, `ref: ["font-size-xs"]`), `font-weight-eyebrow` (`var(--ocelle-font-weight-strong)`), `tracking-eyebrow`
(`0.08em`); colour group: `color-eyebrow` (`{ light: "var(--ocelle-color-ink-muted)", dark: … }`, `ref` both themes,
`contrast: { kind: "text", grounds: main }`). Contrast: 9 new rows per theme in `pairs.json`; pinned counts change
from 160 light / 168 dark / 328 entries / 149 required per theme to 169 / 177 / 346 / 158, in every test and comment
that pins them (`gates/test/contrast-pairs.test.ts`, `gates/test/contrast-required.test.ts`, `gates/bin/contrast.ts`,
`gates/test/integration/token-gates.test.ts`, `gates/test/integration/plants-robustness.test.ts`, and any other found
by `grep -rn "160\|168\|328\|149\|298"` in `gates/`); `packages/tokens/test/expected.ts` gains the four tokens; the
`token-only` named-token count (`gates/test/token-only-parts.test.ts`, 148) follows. The `brand-rules` gate's rules
are unaffected (no monospace, no radius, no chrome) and it runs in the phase's gate set.

**Rationale**: FR-030's aliases keep one source of truth for the eyebrow's size, weight and colour, while #7 can use
the same names. `0.08em` is the spec's assumption.

## R-13 Tests: harnesses, fixtures and pairing plants

**Decision**: as 005: shared scenario bodies in `packages/elements/test/scenarios/<element>.ts` against the driver,
run in process by `test/<element>.test.ts` (mutated) and on strict-CSP fixture pages by
`test/browser/<element>.test.ts` (browser build). Measurements read computed styles against the token values read
from the same page (never literals), boxes by `getBoundingClientRect`, the AX tree by the `axTree` command, forced
colours by `emulateForcedColors`. Right-to-left runs set `dir="rtl"` on `<html>`. Reflow at 320 px sets the viewport
and asserts `document.scrollingElement.scrollWidth <= 320` together with the positive stacking outcome. Each "does
not" outcome has its pair and plant listed in contracts/checks.md § Pairing plants. Keyboard: Playwright `Tab` presses
on the fixture and `userEvent.tab` in process, asserting `document.activeElement` (deep, through shadow roots) per
press.

## R-14 Stories, baselines and axe against #10 (FR-033, FR-037, FR-038)

**Decision**: planned against #10's design at commit `5f49794` of `claude/010-storybook-workbench`
(`specs/006-storybook-workbench`: spec FR-012, FR-013 to FR-016, FR-025 to FR-031; contracts/gates.md;
contracts/container.md). One story file per element, `storybook/stories/<element>.stories.ts`, each story rendering
one element state inside the story root, open shadow roots only, no element outside the root, no pointer state (none
of these elements has hover or press behaviour). Baselines are produced by `pnpm run visual:update` in the pinned
container and committed under `storybook/baselines/<story-id>.<theme>.png`; when a local capture and CI's disagree,
CI's captures from the job artifact are committed (#10 FR-005). The `axe` gate runs every story in both themes; axe's
`landmark-unique` rule means sidebar and rail stories each render one landmark with a distinct label.
`storybook/test/integration/elements-stories.test.ts` (005) is extended first in each phase to the new stories.

**Recheck when #10 lands**: before phase 1 starts, the implementer compares #10 as merged on `main` against this
item (story file location, story id scheme, baseline path and naming, `visual:update` and gate commands, the axe rule
set and its excluded rules, the contributor note's items) and records any difference in `reviews/phase-1/spike.md`;
a difference that changes a task is raised to the operator before the red commit.

## R-15 Engine floor (FR-039)

**Decision**: the features used are inside the current floor (Chromium 120, WebKit 16.4): flexbox `gap`,
`flex-wrap`, logical properties, `:nth-child(of S)` (Chromium 111, WebKit 9), `::slotted()`, `MutationObserver`,
`WeakMap`. No container query, `:has()`, `:has-slotted`, `:state()` or `:host-context()`. The floor is unchanged; the
README's Engines list is not touched.

## R-16 Shared files and siblings

**Decision**: `packages/elements/src/index.ts`, `src/browser.ts`, `package.json` `exports`, `custom-elements.json`,
the README, the CHANGELOG and `storybook/test/integration/elements-stories.test.ts` are shared with #16 (008), #15
(009) and #9 (010). Conflicts are resolved by merging `main` into the branch (never a rebase), at landing
(`/ocelle-land`); `custom-elements.json` is regenerated after the merge, never hand-merged. No phase merges `main`
during the run (`/ocelle-run` step 4.3). #7 may land the eyebrow tokens first: if so, phase 1 uses them and drops its
token task, recorded at the phase-1 review.
