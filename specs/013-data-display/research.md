# Research: Data Display, First Slice (013)

Every decision of the plan, with its reason and the alternatives. Measurements were taken in this container in
headless Chromium 153.0.8010.12 with axe-core 4.10.2. The scripts, raw outputs and summary are in [spike/](spike/)
(`spike/RESULTS.md`), and each can be rerun with `node <script>` once axe-core is packed into `spike/pkg/` as
`RESULTS.md` says. #10's `axe` gate pins axe-core 4.14.0. The spike's axe results are re-run against that version in
phase 1's spike (R-01) before the red commit.

## R-01 `ocelle-facts`: description list through manual slot assignment (FR-003, FR-004, FR-005)

**Decision.**
- `ocelle-facts` attaches an open shadow root with `slotAssignment: "manual"` and renders one `<dl part="list">`.
  For each `ocelle-fact` child, in source order, it renders `<dt part="label">${child.label}</dt><dd
  part="value"><slot></slot></dd>`, then assigns that child to that `<dd>`'s slot with `slot.assign(child)`.
- The `ocelle-fact` shadow root, inside `ocelle-facts`, is one `<slot>`, so its own light-DOM content (the value) is
  shown in the `<dd>` unchanged.
- No `slot` attribute is added to the consumer's markup and no content is copied. The label text is the `label`
  property, which the consumer gave as data.

**Measured** (spike A5):
- Chromium's tree is `DescriptionList > term "Owner", definition "Ada", term …, definition …`, with term and
  definition direct children of the list, in source order.
- axe has no violation, and `definition-list` and `dlitem` pass.
- No ID reference is used.

**Alternatives rejected** (spike A1 to A3, A2c):
- **A1/A1c/A1s/A3**: `<dl><slot>` in `ocelle-facts` with `<dt>`/`<dd>` in each `ocelle-fact`'s shadow root, with or
  without `display: contents`, subgrid or `internals.role = "none"`. Chromium's tree is valid (the hosts are ignored
  generics). axe reports `definition-list` (serious) and `dlitem` (serious ×4): in the flat tree the `<dl>`'s children
  are `ocelle-fact` hosts, and axe does not read ElementInternals roles. #10's `axe` gate would fail every facts story.
- **A2a**: `role="term"` and `role="definition"` divs. axe is clean, but there is no list container, which fails
  FR-004.
- **A2b**: ElementInternals `list` and `listitem`. This gives a list, not a description list.
- **A2c**: `associationlist` (ARIA 1.3 draft). Chromium shows generic nodes, and axe reports `aria-roles` (critical).

**Consequences (FR-003, edge cases, SPEC-2-06).**
- `ocelle-facts` keeps its rendering current with a `MutationObserver` on its own `childList` and on the `label`
  attribute of its children (`subtree: true`, `attributeFilter: ["label"]`). With manual assignment there is no
  `slotchange` for an unassigned child.
- `ocelle-fact`'s `label` property reflects to its attribute (`reflect: true`), so a property-only change reaches the
  observer.
- Children that are not `ocelle-fact` (text, a raw `<dt>`, a `<div>`) are never assigned, so they are neither rendered
  nor exposed. Whitespace text nodes are ignored the same way. Nothing throws.
- With no `ocelle-fact` child, `ocelle-facts` renders no `<dl>` (FR-010): nothing visible and nothing exposed. An
  empty `<dl>` is valid but says nothing, and "nothing" gives one rule for the empty case.
- **`ocelle-fact` outside `ocelle-facts`** (`this.parentElement?.localName !== "ocelle-facts"`) renders `<span
  part="label">${label}</span><slot></slot>` as two blocks, with no term or definition role (edge case). A
  `MutationObserver` cannot see a re-parenting, so `ocelle-fact` decides in `connectedCallback`. Moving a fact into or
  out of `ocelle-facts` disconnects and reconnects it, which runs that decision again.
- **Missing halves** (FR-003): a `label` that is absent or empty renders an empty `<dt>`, exposed as an empty term. A
  fact with no content renders an empty `<dd>` (an empty definition). Each pair keeps its row because the grid cells
  always exist. To be confirmed in phase 1's spike: whether Chromium still exposes an empty `<dt>` as a term node.
  If it does not, US1-10's assertion becomes "the definition follows its (empty) row" and the plan's reading goes to
  review.

**Operator decision pending (spec SPEC-1-04 "D").** The measurement shows FR-004 can be met as written with Q1 (b).
The operator confirms or replaces FR-004 at the plan gate, before tasks.

**Recheck in phase 1's spike:** axe-core 4.14.0 (#10's pin) on the A5 structure, and the A5 structure built with Lit.
Lit's `createRenderRoot` must pass `slotAssignment: "manual"`, and its template must render the `<slot>` elements
whose assignment the element then sets in `updated()`.

## R-02 `ocelle-facts`: stacking on its own inline size without containment (FR-005, FR-009)

**Problem.** A size container query on the host needs `container-type: inline-size`. The spike (C) measured that host
at 0 px inline size inside a `showModal()` dialog and inside a default flex item. This is the collapse FR-009 forbids,
and the same as 003's finding. A flex-wrap row per pair never collapses, but it loses the shared label column FR-005
requires (each pair is its own flex line), and it stacks in a shrink-to-fit dialog even when there is room. A plain
grid keeps the column and never collapses, but cannot stack without a query.

**Decision.** The grid is plain, with no containment. The element switches between two columns and one column with a
`ResizeObserver` on its own box, which needs no containment.
- **Threshold.** It comes from a hook, `--ocelle-facts-stack-below`, set by default in `:host` to
  `calc(var(--ocelle-shell-sidebar-width) + var(--ocelle-space-10))`, which is 24rem (384 px at the default root size,
  more than 320 px as FR-005 requires).
- **Probe.** The element resolves the hook to pixels through a probe: an empty `<div part="probe" aria-hidden="true">`
  in the shadow root with `inline-size: var(--ocelle-facts-stack-below); block-size: 0; visibility: hidden; position:
  absolute`, observed by the same `ResizeObserver`.
- **Rule.** When the host's content-box inline size is below the probe's, the element sets an internal `stacked`
  state, which is a class on the `<dl>`, not a host attribute, so it is not public surface. The `<dl>` then becomes one
  column, `minmax(0, 1fr)`, with each value below its label.
- **Why this holds in a shrink-to-fit host.** Without containment, the host's max-content inline size is the
  two-column grid's (the widest label plus the widest value, capped by the available space), so it is never 0
  (FR-009). If that width is below the threshold the element stacks, and its stacked max-content is no wider, so the
  state is stable: there is no oscillation.
- **Why a hook rather than a constant.** `--ocelle-facts-stack-below` is the element's own hook (README § Element
  conventions: `--ocelle-<element>-<property>`). A consumer with a wider inspector can lower it. It is declared in the
  manifest's CSS custom properties.

**Alternatives rejected.**
- A container query on the host (the collapse above).
- A container query on a consumer's container: it needs the consumer to set one up, and FR-005 says the element's
  own inline size.
- A media query: viewport size, which FR-005 excludes.
- `contain-intrinsic-inline-size` with a fixed length: the element's width in a dialog would be that length, not its
  content's max-content, and it fails FR-009 for long values.
- Flex-wrap per pair: it loses the shared column.

**Before first layout.** The first `ResizeObserver` callback runs before paint on connection, so there is no visible
two-column frame at 320 px. US1-2 and US1-3 read the layout after `updateComplete` and one animation frame. The
`stacked` decision is made in the callback, not in `render()`, so a Lit update loop cannot oscillate.

**To measure in phase 1's spike**, before the red commit:
- the host's inline size in a `showModal()` dialog, a popover, a float and a default flex item, against FR-009's
  bound;
- the stacked state at 300 px and the two-column state at 600 px;
- right-to-left mirroring of the columns (SPEC-2-08).

## R-03 `ocelle-facts`: grid, type and density (FR-005 to FR-008)

- **Columns.** `<dl>` is `display: grid; grid-template-columns: fit-content(50%) minmax(0, 1fr)`. The label column is
  the widest label's max-content, capped at 50%, and longer labels wrap between words inside the cap. The value column
  takes the rest and is never widened by content. Spike A5 measured both: 176 px for the widest normal label in 600 px,
  and 300 px (the cap) for a very long label. `minmax(auto, 50%)` was rejected because it always gives 50%.
- **Gaps.** Column gap `--ocelle-space-4`. Row gap `--ocelle-space-3`, or `--ocelle-space-1` with
  `density="compact"`. When stacked, a pair's label-to-value gap is `--ocelle-space-1` and the gap between pairs is
  the row gap. `<dt>` and `<dd>` have no margins (`margin: 0`).
- **Type.**
  - Labels: `--ocelle-font-sans`, `--ocelle-font-size-sm`, `--ocelle-font-weight-medium`, `--ocelle-color-ink-muted`
    (declared text on every main ground). Labels differ from values by size and weight, not only colour.
  - Values: `--ocelle-font-sans`, `--ocelle-font-size-fact`, `--ocelle-font-weight-regular`, `--ocelle-color-ink`,
    `font-variant-numeric: var(--ocelle-figures)`, `line-height: var(--ocelle-line-height-normal)`.
  - Compact density keeps `--ocelle-font-size-fact` (FR-008).
- **Upstream issues (SPEC-1-12).** The spec-kitty-design issues #280, #498, #510, #523, #531 and #535 could not be
  read from this session. That repository is outside this session's GitHub scope, `gh api` is denied, and GraphQL
  returns 403. The plan uses #13's text and the epic's gap table, as the triage record did. FR-008's #531 clause
  therefore keeps the spec's default (value size unchanged in compact). The plan gate lists this for the operator.
- **Wrap policy (FR-007, SPEC-2-10).** `ocelle-fact` has a `wrap` property, reflected and taking only `"anywhere"`.
  With it, the fact's `:host` sets `overflow-wrap: anywhere`, which the value content inherits. The label is rendered
  by `ocelle-facts` in its own `<dt>`, outside the fact, so it never takes the policy. A value element holding
  `data-ocelle-wrap="anywhere"` keeps 003's base-style behaviour, because it is light DOM styled by `base.css`.
  Without either, values wrap between words (`overflow-wrap: normal`). Copying gives the text unchanged (US1-4):
  nothing is inserted.
- **Digests (SPEC-2-04).** A digest in a facts value is the consumer's text. The element does not group or rewrite it
  (FR-003). The README says digests are grouped by the consumer, or by follow-on 2's code-block digest mode once it
  exists.
- **200% zoom (SPEC-2-05).** At 1280 × 800 CSS px and 200% zoom, the layout viewport is 640 CSS px wide. The tests set
  a 640 px viewport for "200% zoom" and a 320 px viewport for the reflow test (FR-053, which is also 400% of 1280).
- **Focus.** Facts adds no tab stop. A link in a value keeps its own focus ring from `base.css` (FR-011).

## R-04 `ocelle-empty-state` (FR-020 to FR-024)

- **Structure.** The shadow root renders `<div part="body" class="stack">` holding `<div class="visual"><slot
  name="visual"></slot></div>`, `<div class="heading"><slot name="heading"></slot></div>`, `<div class="text"><slot>
  </slot></div>` and `<div class="actions"><slot name="actions"></slot></div>`. None of these wrappers has a role:
  they are generic and ignored. There is no heading, landmark, live region or tab stop.
- **Empty slots (FR-023, SPEC-2-06).** Each wrapper is `display: none` while its slot has no assigned nodes,
  whitespace-only text included. This is tracked by a `slotchange` listener per slot into internal state, so the
  column's `gap` adds no space for an absent part. Filling or emptying a slot later updates it.
- **Default variant (FR-021).**
  - Centred column (`text-align: center`, `align-items: center`), block padding `--ocelle-space-6`.
  - Gaps: visual to heading `--ocelle-space-3`, heading to text `--ocelle-space-2`, text to actions `--ocelle-space-4`.
    These are per-wrapper `margin-block-start`, not one `gap`, so each gap can differ.
  - Heading: `::slotted([slot="heading"])` at `--ocelle-font-size-lg`, `--ocelle-font-weight-strong`,
    `--ocelle-color-ink`, `margin: 0`.
  - Text: `--ocelle-color-ink-muted`, `--ocelle-font-size-md`, with the measure capped by `--ocelle-measure-reading`.
- **Panel variant (FR-022, operator Q2: existing tokens).**
  - Block padding `--ocelle-space-10`.
  - Gaps `--ocelle-space-5`, `--ocelle-space-3` and `--ocelle-space-6`.
  - Heading at `--ocelle-font-weight-medium` (500, lighter than 600). The heading size stays `--ocelle-font-size-lg`.
  - Each gap is larger than the default's and the weight is lighter, which is the order the spec fixes.
- **Actions (SPEC-2-07).** The actions wrapper is `display: flex; flex-wrap: wrap; justify-content: center; gap:
  var(--ocelle-space-2)`. Several buttons wrap at 320 px without horizontal overflow.
- **Ground.** Neither variant paints a background (FR-021). It sits on its container's ground.
- **Cascade.** The heading's look comes from `::slotted()`, which beats the user-agent heading styles but not a
  page's own author rules on the heading. `base.css` styles headings only inside `[data-ocelle-prose]` (a
  zero-specificity `:where()`), so outside prose the element's rules apply. The README says a page rule on the slotted
  heading wins, by design: the consumer owns its heading. This is not `!important` (unlike the icon slot), because
  overriding a heading's look is a legitimate consumer need.
- **Loading panel (US2-7).** An `ocelle-progress` slotted as `visual` is a block in the column. The README's mapping
  gives `.sk-empty-state` loading as `variant="panel"` with an indeterminate `ocelle-progress` in `visual`.

## R-05 `ocelle-progress`: ElementInternals progressbar (FR-030 to FR-032)

**Decision.** The host is the progressbar, through `ElementInternals` (spike B3):
- `internals.role = "progressbar"`;
- `internals.ariaValueMin = "0"`, `ariaValueMax = String(max)`;
- `ariaValueNow = String(clamped value)`, or `null` when indeterminate;
- `ariaValueText` = `value-text` when determinate and set, else `null`;
- `ariaLabel = label || null`.

The shadow root draws the track and fill as `<div part="track"><div part="fill"></div></div>`, plus, with
`show-label`, `<span part="label">` and `<span part="value-text">` (R-07). It has no role of its own: progressbar
children are presentational.

**Measured** (spike B3):
- one `progressbar` node with name, value, min and max;
- indeterminate shows no value;
- a host `aria-label` overrides `internals.ariaLabel`, which is the library's Host ARIA rule and constitution III (host
  ARIA reaches the control);
- no extra node.

**Alternatives rejected.**
- **B1, native `<progress aria-label>` in the shadow root.** The labelled cases are correct, but a host `aria-label`
  does not name the bar. It adds a `generic "Host name"` node around it, and axe reports `aria-prohibited-attr`
  (serious). Forwarding the host's `aria-label` into the shadow keeps the extra generic node and the axe finding
  unless the host attribute is removed, and removing a consumer's attribute is rewriting it.
- **B2, `role="progressbar"` div in the shadow root.** The same host-label problem as B1.

**Costs of B3, recorded.**
- axe does not see ElementInternals roles. It cannot check the bar's name on any story (no rule applies), and a story
  that sets a host `aria-label` gets a false `aria-prohibited-attr`.
- So the name, value, min, max and indeterminate state are proven by this mission's accessibility-tree tests in both
  harnesses (US3-1 to US3-4, US3-10, US3-11), not by axe.
- No story sets a host `aria-label`. The host-label override (US3-10) is a browser test only, beside the unnamed state
  (US3-11, FR-050). This keeps #10's `axe` gate free of a false positive with no exception entry.
- When #10 lands, its `axe` gate runs on the progress stories and passes, but without testing the name. The README
  says so.

**`value-text` (FR-031, SPEC-2-01, SPEC-2-02).** It is exposed only while the bar is determinate. An indeterminate
bar exposes no value text, even when `value-text` is set, because there is no value to describe. When the value is
clamped, `value-text` is still exposed as given (the consumer's words). The element never formats numbers. Without
`value-text`, Chromium computes the value text (the percentage) itself.

**Measuring `valuetext`.** CDP's `Accessibility.getFullAXTree` returned an empty `valuetext` in every case, including
a light-DOM control (spike B). Phase 3's spike picks another oracle before the red commit: Playwright's
`locator.ariaSnapshot()`, CDP `Accessibility.getPartialAXTree` on the node, or the `aria-valuetext` reflection read
from `internals`. A reflection read is not an oracle of exposure, so it is used only if both platform reads fail, and
review is told.

**Value parsing (FR-032).**
- `value` and `max` are properties of type `Number | null` with custom attribute converters.
  - An absent, empty or whitespace-only attribute, or a property set to `null` or `undefined`, gives `null`
    (indeterminate).
  - A non-finite number (`NaN`, `"abc"`, `Infinity`) gives `null`.
- The effective max is `max` when finite and above 0, else 100.
- The effective value is `min(max(value, 0), effective max)`.
- Nothing throws: the converters never throw, and `render()` reads only the effective values.

## R-06 `ocelle-progress`: look, motion and contrast (FR-033 to FR-038)

**Track.**
- `block-size: var(--ocelle-space-2)` (8 px). With `size="compact"`, `--ocelle-space-1` (4 px).
- `background-color: var(--ocelle-color-inset)`, `border-radius: var(--ocelle-radius-1)`.
- `box-shadow: 0 0 0 var(--ocelle-border-width) var(--ocelle-color-control-border)`, which is an outline drawn outside
  the box so it takes no layout space. Zero is a permitted raw value.
- `min-inline-size: var(--ocelle-measure-cell)`, so a compact bar beside a long label keeps a visible length
  (edge case).

**Fill.**
- `background-color: var(--ocelle-color-accent)` with `box-shadow: inset 0 0 0 var(--ocelle-border-width)
  var(--ocelle-color-accent-strong)`. This gives the `accent-strong` mark on every edge of the filled part, in both
  themes and in every variant (FR-036, SPEC-2-03).
- The determinate fill's inline size is set in `updated()` through the CSSOM:
  ``fill.style.inlineSize = `${fraction * 100}%` ``. A CSSOM write is not a `style-src` violation under the strict CSP
  (only parsed `style` attributes and `<style>` elements are), so the template keeps no `style` attribute (constitution
  IV, README § Element conventions). The fraction is `effective value / effective max`. The browser-build fixture
  tests assert zero CSP violations with a determinate bar on the page.
- The fill grows from the inline start: `inset-inline-start: 0`, mirrored under `dir="rtl"` (FR-038).
- A width transition uses `--ocelle-motion-base` and `--ocelle-easing-standard`, which is 0 ms under reduced motion
  through the tokens.

**Contrast.** The mark is `accent-strong`, computed from the token values:

| Mark against | Light | Dark |
|---|---|---|
| the track (`color-inset`) | 4.11 | 6.28 |
| canvas, panel, inspector | 4.80 | 8.30 |
| sheet | 5.33 | 7.44 |
| pane | 5.56 | 7.78 |
| rail | 4.43 | 7.78 |
| accent-low | 4.31 | 6.13 |

Every pair is ≥ 3:1. The `accent-strong` token already declares non-text contrast on `color-inset` and
`color-accent-low`. This plan adds its rows on canvas, sheet, pane, panel, inspector and rail, in both themes, to
`packages/tokens/contrast/pairs.json` and to the token's declared grounds, so the contrast gate checks them (12 rows,
SC-004).

**Track boundary (SPEC-2-03).** `color-control-border` is ≥ 3:1 on the six declared grounds (3.02 to 3.79 light,
3.50 to 3.90 dark: already declared and checked). On `color-inset` and `color-accent-low` grounds it is 2.80 and 2.94
(light) and 2.95 and 2.88 (dark).
- The spec requires 3:1 for the filled part only (FR-036), not the track.
- The track's end marks the maximum, which is also exposed as `aria-valuemax`, and the fill is the information.
- The README says a bar on an inset or accent-low ground has a track boundary below 3:1, and that the filled part
  still meets it.
- This is no constitution exception: III's contrast rule is checked on the pairs the spec requires.

**Forced colours (FR-037).** Inside `@media (forced-colors: active)`:
- the track has `outline: var(--ocelle-border-width) solid CanvasText` and `background-color: Canvas`;
- the fill has `background-color: Highlight` and `forced-color-adjust: none` on the fill only, so `Highlight` survives;
- the moving and still marks use the same rule.

**Indeterminate (FR-033).**
- The fill becomes a mark 40% wide (`inline-size: 40%`), animated with `transform: translateX()` from `-100%` to
  `250%`, with `animation-duration: calc(var(--ocelle-motion-base) * 7)` (1400 ms), `--ocelle-easing-standard` and
  `infinite`.
- `translateX` is mirrored under `:dir(rtl)` with `scale: -1 1` on the track. Both are allowed by the lint: `scale -1`
  since 005, `%` and numbers inside `calc()` since 001.
- No new motion token is needed: `calc()` with a number factor on a token passes `token-only`, and it resolves to 0 ms
  under reduced motion because `--ocelle-motion-base` does (FR-040: no new token where an existing one fits).

**Reduced motion.** Inside `@media (prefers-reduced-motion: reduce)` the mark has `animation: none` and is parked at
`inset-inline-start: 30%`, 40% wide: a still segment in the middle of the track. It reads as "in progress" and cannot
be mistaken for a determinate fill, which always starts at the inline start. The mark keeps the `accent-strong` edge.

**Labelled variant (FR-035).**
- With `label` and `show-label`, a row above the bar (default size) or beside it (compact) shows `<span part="label">`
  in `--ocelle-color-ink` at `--ocelle-font-size-sm`.
- When determinate and `value-text` is set, `<span part="value-text">` follows in `--ocelle-color-ink-muted` with
  `--ocelle-figures`.
- Both are `aria-hidden="true"`, because the host already carries the name and value text, and the visible text must
  not be read twice.
- Without `value-text`, no number is shown: the element does not format numbers (SPEC-2-01).
- In compact, the row is `display: flex; flex-wrap: wrap; align-items: center; gap: var(--ocelle-space-2)`. A long
  label wraps and the bar keeps `min-inline-size: var(--ocelle-measure-cell)`.

**Busy vocabulary (FR-033).** This goes in the README, as the spec words it. #7's status indicator is coordinated
through 012's spec. Nothing here depends on it.

## R-07 Tokens (FR-040)

No new token.
- The panel rhythm uses existing tokens (operator Q2).
- The progress track uses `color-inset`, `color-control-border`, `space-2`, `space-1`, `radius-1` and `measure-cell`.
- The loop period is `calc(var(--ocelle-motion-base) * 7)`.
- The facts threshold is the hook `--ocelle-facts-stack-below`, which defaults to existing tokens.

`@ocelle/tokens` changes only in its contrast declarations: the 12 new `accent-strong` rows in `pairs.json` and the
token record's declared grounds. That is a test-data change, not a surface change: no token is added or renamed. The
tokens CHANGELOG gets an entry saying the contrast coverage was extended.

## R-08 Test harnesses, stories and #10 (FR-050 to FR-055, I3)

- **Harnesses.** These are 005's (`packages/elements/README.md` § Files and tests).
  - Scenario bodies live in `test/scenarios/facts.ts`, `empty-state.ts` and `progress.ts`, and run in process in the
    `elements` project (the one Stryker mutates) and on the built browser build on strict-CSP fixture pages
    (`test/browser/*.test.ts`).
  - The browser commands `axTree` and `emulateForcedColors` already exist. One is added: `emulateReducedMotion`, which
    sets `prefers-reduced-motion` through CDP `Emulation.setEmulatedMedia`, with a unit test.
- **Stories.** In `storybook/stories/<element>.stories.ts`, in light and dark (#10's harness captures both):
  - **facts**: default, compact, stacked (a 300 px wrapper), identifier wrap, missing label, missing value, link in
    value, right-to-left;
  - **empty-state**: default, panel, panel loading (with an indeterminate `ocelle-progress`), heading only, actions
    only, several actions at 320 px;
  - **progress**: determinate, zero, full, indeterminate, compact, labelled, labelled compact, value text,
    right-to-left. The indeterminate story is captured with reduced motion by #10's `visual` and `axe` contexts, which
    gives a still, deterministic baseline.
  - No story has a hover or press state, so none declares one (#10 FR-031).
  - There is no story for the unnamed progress (FR-050) or for a host `aria-label` on progress (R-05).
- **Story test (I3).** `storybook/test/integration/elements-stories.test.ts` is extended in each phase's red commit,
  before green. It checks each new story is present in the built Storybook and renders its element in light and dark,
  with no CSP violation and no outside request, as 005 did. `red.sh` records one red record per phase. The stories
  themselves are not tests and land in green.
- **#10 (FR-051).** #10 is designed, not merged (`origin/claude/010-storybook-workbench`,
  `specs/006-storybook-workbench`). The stories follow its contributor note (FR-025): open shadow roots, every surface
  inside the host, `font: inherit` on form controls (none here), and run-time CSP proven in the element package's own
  browser tests.
  - **#10 on `main` before phase 4:** phase 4 merges `main` through `/ocelle-land`'s procedure, never mid-run, and
    commits the baselines from #10's pinned container (`contracts/container.md` there). The `axe` gate then passes on
    every new story.
  - **#10 not on `main`:** the accessibility-tree tests stand in, as SC-003 says, and #10's rebase picks the stories
    up.
  - **To recheck when #10 lands:** the story list against #10's index rules (`empty`, `outside-root`,
    `closed-shadow-root`), the axe-core 4.14.0 result on facts (R-01), and that no `a11y-exceptions.json` entry is
    needed.
- **Mutation (#23).** Element source under `packages/elements/src/**` is mutated in process under the elements-only
  Stryker configuration (005 R-12). A Timeout or CompileError mutant on a changed line is reported and passes
  (007's operator decisions). The indeterminate animation is CSS text inside a `css` template, so it gives Stryker
  string mutants that the computed-style assertions kill (the animation name, duration and none under reduced motion).
- **Engines.** ElementInternals ARIA reflection (`role`, `ariaValueNow`, …) is already used by `ocelle-icon`.
  `slotAssignment: "manual"` and `HTMLSlotElement.assign()` are Chromium 86 and WebKit 16.4. `ResizeObserver` is older
  than both. `fit-content()` in grid tracks is older than both. The floor (Chromium 120, WebKit 16.4) does not rise.
  The README's Engines list adds manual slot assignment with its figures.

## R-09 Wave dependencies

- **#15 (`ocelle-scroller`, overflow region):** not needed. None of the four elements has a scroll region. Follow-on
  2's `ocelle-code-block` needs it. No part of this mission waits for #15.
- **#10:** a soft dependency, for baselines and axe only (R-08).
- **011 / 012 eyebrow tokens:** not needed (facts labels are not eyebrows).
- **012 (#7):** the busy vocabulary sentence in the README only.
- **014 (#14):** none. Facts values are not copy fields.
