# Research: Base Styles (003)

Each item states the decision, why, and what else was considered. "Verify in the spike" marks a browser behaviour the
first phase measures before the tests that depend on it are written (phase 2, T-spike); if a measurement disagrees,
the implementer stops and the orchestrator asks the operator.

## R-01 Package layout and build

**Decision**: the stylesheet is hand-written CSS at `packages/styles/src/base.css`. A build script
`packages/styles/scripts/build.ts` writes it unchanged to `dist/base.css`, in the shape of
`packages/tokens/scripts/build.ts`, with one model of the plan (PLAN-CORRECTNESS-1-008):
- a pure `buildPlan(css: string)` returns `[{ path: "base.css", content: css }]`, a content entry of the tokens
  `PlanEntry` shape, not a `copyFrom` entry, so the plan carries the text the tests parse;
- an I/O `build()` reads `src/base.css`, passes its text to `buildPlan` and writes each entry; its lines carry the
  I/O-boundary Stryker records naming `packages/styles/test/build.test.ts`;
- `build.test.ts` asserts that `buildPlan` returns the given text unchanged under `base.css`, and that `build()`
  writes a `dist/base.css` byte-identical to `src/base.css`;
- the source-level checks (R-11) read `src/base.css` once and parse `buildPlan(text)[0].content`, which is therefore
  the shipped text.

`package.json` gets:
- `"build": "tsc -p tsconfig.json && node scripts/build.ts"`;
- `"exports": { ".": "./dist/index.js", "./base.css": "./dist/base.css" }`;
- `"files": ["dist", "CHANGELOG.md", "README.md"]`;
- `"peerDependencies": { "@ocelle/tokens": "workspace:0.0.0" }`, an exact workspace version as the pins gate requires
  (`gates/lib/pins-rules.ts` checks `peerDependencies` too). `base.css` references the six tokens of R-08, which
  exist only from this tokens version on, so the manifest names the tokens version `base.css` needs (operator decision
  PLAN-CORRECTNESS-1-012 (a)). The README states the same (R-14). The pins gate's `workspace:<its version>` rule
  keeps the peer range in step with the tokens version at release.

`src/index.ts` keeps exporting nothing.

**Why**: the source is linted where it lives (`packages/styles/**/*.css` is in the style-lint scope; built `dist` is
ignored), the shipped file is byte-identical to the linted one, and the copy step mirrors the tokens package, so the
Prefix and csp gates see `dist/base.css` after `pnpm -r build` as they do in CI.

**Alternatives**: generating the CSS from TypeScript (like `css()` in tokens): rejected, nothing is computed and a
generator would put the CSS out of the lint's reach. Exporting `src/base.css` directly: rejected, `files` would ship
source and the build contract of 001 expects `dist`.

## R-02 Hook names and values (FR-004, FR-005)

**Decision**: four attributes, one per hook:

| Hook | Attribute | Allowed values |
|---|---|---|
| compact | `data-ocelle-density` | `compact`; `regular` returns a nested region to the regular scale |
| value | `data-ocelle-value` | empty (muted ink) or `ink` (body ink) |
| prose | `data-ocelle-prose` | empty |
| identifier wrap | `data-ocelle-wrap` | `anywhere` |

Any other value of an attribute has no effect. Every hook selector matches its documented values exactly:
`[data-ocelle-prose=""]`, `[data-ocelle-value=""]` and `[data-ocelle-value="ink"]` (each still one attribute,
(0,1,0)), like `[data-ocelle-density="compact"]` and `[data-ocelle-wrap="anywhere"]` (operator decision
PLAN-CORRECTNESS-1-002 (a)). A bare attribute has the empty value and matches. The README lists exactly these values
and states that other values, `"true"` among them, do nothing. Browser tests prove it with negative cases:
`data-ocelle-value="true"` gets no value style (User Story 2 scenario 3) and `data-ocelle-prose="true"` gets no prose
rule (User Story 3 scenario 5); the plant for both is the presence form (`[data-ocelle-value]`,
`[data-ocelle-prose] :where(p)`) of the rule.

Two hooks have a placement limit, stated in the README and the contract:
- the value hook is for the main grounds only (`ink` and `ink-muted` are contrast-declared for the `main` grounds in
  `packages/tokens/src/source.ts`, and light `ink` equals `chrome`, 1.00:1). It is not used on the chrome (operator
  decision PLAN-A11Y-SECURITY-1-004 (a));
- the prose hook goes on a content container, not on `<html>`. The container rule is
  `[data-ocelle-prose=""]:where(:not(html))`, so on `<html>` it sets neither the root font size nor the root line
  height (operator decision PLAN-FRESH-1-010 (b)). With the hook on `<html>`, the descendant rules still apply, but
  the text size and line height come from the body (and the compact hook, if any), so the README calls that a misuse.

**Why**: `density` and `wrap` carry a value, so later values (`density="comfortable"`, `wrap="path"`) are additions,
a MINOR change (constitution VII), not new attributes. `prose` and `value` are written as bare attributes because
there is nothing to choose, except the value's ink variant; their selectors match the empty value exactly, so a later
value is an addition too.

**Alternatives**: classes (`ocelle-prose`): excluded by FR-005 unless the operator approves at a fork; no reason
found. One attribute `data-ocelle` with space-separated tokens: rejected, one attribute per hook keeps every selector
at one attribute.

## R-03 Selectors and the specificity bound (FR-025)

**Decision**:
- Every base-layer rule wraps its whole selector in `:where()`, so it has specificity (0,0,0). This covers the reset,
  element defaults, `:root`, `:focus-visible` and the `forced-colors` rules. The one exception is the box-sizing
  rule's pseudo-elements: pseudo-elements are invalid inside `:where()` (Chromium drops `*::before` from
  `:where(*, *::before, *::after)` silently, so the `::before` stays `content-box`), so the rule is
  `:where(*), :where(*)::before, :where(*)::after`, at (0,0,0), (0,0,1) and (0,0,1), inside FR-025's (0,0,1) bound for
  non-hook selectors (PLAN-CORRECTNESS-1-001). The User Story 1 scenario 6 test reads `getComputedStyle(el,
  "::before")` and `"::after"` as well as the element (FR-007: every element and pseudo-element).
- Every hook rule is one attribute selector with the rest in `:where()`, for example
  `[data-ocelle-prose=""] :where(h1)`. That gives (0,1,0), under the (0,1,1) bound.
- Order in the file decides between equal hook rules: base layer, then compact, then value, then prose, then wrap.
  That order makes the prose hook win over the compact hook on one element (FR-024).

**Why**: (0,0,0) (and (0,0,1) for the two pseudo-element selectors) means any rule of the host page's own stylesheets wins (a custom
element's `:host` rules do not, R-12), which the spec's
"easy to override" asks for; one attribute per hook rule
keeps the hooks predictable. The "same element" rule needs no extra selector because both rules have equal
specificity and prose comes later.

**Alternatives**: `@layer`: considered; it would also make host rules win, but a host that itself uses layers could
then lose to the base layer depending on layer order. `:where()` has no such interaction. Bare element selectors at
(0,0,1): allowed by FR-025 but not needed.

## R-04 The compact hook on the root (FR-012, User Story 2 scenario 4)

**Decision**:
- `[data-ocelle-density="compact"]:where(:not(html))` sets the compact size and line height on any element except the
  root.
- `[data-ocelle-density="compact"] > :where(body)` sets them on the body when the hook is on `<html>`.
- The root's own font size is never set.
- `[data-ocelle-density="regular"]` sets the regular size and line height.

All of these are (0,1,0).

**Why**: setting `font-size` on `<html>` rescales every `rem` token, so `--ocelle-target-min` would drop from 44 px to
38.5 px (SPEC-1-01).

## R-05 Focus ring without tokens (FR-009, User Story 1 scenario 6)

**Decision**: longhands, not the shorthand:

```css
:where(:focus-visible) {
  outline-style: solid;
  outline-width: var(--ocelle-focus-width);
  outline-color: var(--ocelle-color-focus);
  outline-offset: var(--ocelle-focus-offset);
}
```

Under `@media (forced-colors: active)`, `outline-color: Highlight`.

The forced-colours rule is kept as defence for host regions that set `forced-color-adjust: none` (operator decision
PLAN-TESTABILITY-1-006 (b)). Outside such a region Chromium forces the outline colour itself: a keyboard-focused
button computes `rgba(5, 0, 73, 0.8)` with and without the rule, so no test can observe the rule there. Inside an
ancestor with `forced-color-adjust: none` the browser does not force it: without the rule the ring is the token
focus colour, with it the ring is Highlight's resolved colour (squad round 1 refute: `rgb(200, 0, 0)`, the probe's
focus colour, without the rule, and `rgba(5, 0, 73, 0.8)` with it). So User Story 1 scenario 4 asserts, in that
host region, that the focused button's computed `outline-color` equals the resolved `Highlight` (read from a probe
element with `color: Highlight` in the same page) and differs from the resolved `--ocelle-color-focus`. The spike
confirms that the value differs without the rule; if it does not, the phase stops for the operator. The plant is the
rule's removal, as a plant stylesheet that restores `outline-color: var(--ocelle-color-focus)` under
`forced-colors: active`.

The `forced-color-adjust: none` of that host region is host CSS in the fixture's `layout.css` (R-09); the source
check of R-11 forbids it only in `base.css`.

Prose tables override one longhand: `[data-ocelle-prose=""] :where(table:focus-visible)` sets
`outline-offset: calc(var(--ocelle-focus-width) * -1)`, so the ring is drawn inside the table's own box (R-06).

**Why**: in Chromium the shorthand `outline: var(…) solid var(…)` is invalid at computed-value time when a variable is
missing, so the whole declaration drops to `outline-style: none` (spec check 2, SPEC-2-12). With longhands only the
width and colour fall back, and `outline-style` stays `solid`. `Highlight` is a system colour keyword, which the
token-only lint allows.

## R-06 The table scroll box without a wrapper (FR-017, operator decision SPEC-3-01)

**Decision**: `[data-ocelle-prose=""] :where(table) { display: block; overflow-x: auto; max-inline-size: 100%;
container-type: inline-size }`. The rows, header and cells keep their table display, so an anonymous table box lays
them out inside the block. Cells get `min-inline-size: var(--ocelle-measure-cell)`. Three additions complete it:
- inline-size containment (PLAN-A11Y-SECURITY-1-001), applied by `container-type: inline-size` (PLAN-FRESH-2-002,
  which replaces round 1's `contain: inline-size` so that the caption can size against the table): a block scroll
  container still gives its content's min-content width to its ancestors, so when the prose container, or a wrapper
  above it, is a `1fr` grid item or a `flex: 1` item, the 12-column table widens that column and the page scrolls
  (squad round 1, Chromium 153 at 320 px: 1212 px as the `1fr` item beside a 60 px rail, 1152 px as `flex: 1`,
  1500 px nested one level inside the grid item). With inline-size containment the table's own min-content width no
  longer escapes, and the page stays at 320 px in all three. `min-inline-size: 0` on the container is not enough,
  because it does not cover the nested case. `container-type: inline-size` also applies style containment, which
  scopes counters and quotes to the table; Markdown tables use neither.
- the host requirement (operator decision PLAN-FRESH-2-001 (a)): containment removes the table from both intrinsic
  sizes of its ancestors, the max-content size too. So in any host sized from its content (shrink-to-fit or
  fit-content sizing), the table adds 0 to that width. Examples: a modal or non-modal `<dialog>`, which the UA gives
  `width: fit-content`; a popover; a fixed or absolutely positioned panel without both inline insets or a width (a
  side drawer); `inline-block`; a float; a `display: table-cell` box; a default item of a row flex container; a grid or flex item
  aligned to start. Squad round 2 measured, in Chromium 153 at 1280 px
  with a 2-column table of short text (natural width 214 px): in a modal `<dialog>` the table's `clientWidth` is 8 px
  with only the table and 79 px after a short paragraph, against a `scrollWidth` of 214, and the first Tab lands on the
  table; as a default flex item beside a 60 px rail it is 0 and 79; with `contain: none` it is 214 in both hosts. No
  table rule tried keeps both the min-content fix and the max-content size (`width: 0; min-inline-size: 100%` behaves
  like containment, `inline-size: max-content` widens the page to 1341 px in the grid and flex hosts). Squad round 3
  measured the same at 1280 px in a fixed side drawer (`position: fixed; inset-block: 0; inset-inline-end: 0`), a
  non-modal `<dialog>` opened with `show()`, a `display: table-cell` box and a grid item with `justify-items: start`:
  `clientWidth` 78 against `scrollWidth` 214, and the first Tab lands on the table (PLAN-FRESH-3-003). The operator
  kept containment: the README, the contract and the spec (Edge Cases, FR-004, FR-017) state the rule by its cause,
  that a prose container must not be sized from its content and gets its width from its context, and give the boxes
  above as examples, not as a complete list; a host gives such a box a definite width or stretches it. `prose-hosts.html` has a modal `<dialog>` host
  whose width is definite (`inline-size: var(--ocelle-dialog-max-inline)` in `layout.css`), in which the table that
  fits keeps its natural width and is not a tab stop (User Story 3 scenario 3).
- `[data-ocelle-prose=""] :where(table:focus-visible) { outline-offset: calc(var(--ocelle-focus-width) * -1) }`
  (operator decision PLAN-A11Y-SECURITY-1-003 (a)): a table flush with the viewport (the body margin is 0) would
  otherwise show only the block sides of its ring, which look like the table's own rules. The inset ring keeps all
  four sides inside the table's box. The other longhands of the ring (style, width, colour) are those of R-05.
- `[data-ocelle-prose=""] :where(caption) { position: sticky; inset-inline-start: 0; max-inline-size:
  var(--ocelle-measure-container); text-align: start }` (PLAN-A11Y-SECURITY-1-005, PLAN-FRESH-2-002): Chromium lays
  the caption out across the whole width of the table grid inside the scroll box. Centred, its text sits at x 513 to
  639 in a 320 px box (squad round 1); with `text-align: start` alone an 88-character caption is one line box from
  x 0 to 630 against a `clientWidth` of 320, so its second half shows only after scrolling (squad round 2). The table
  is the caption's nearest query container, so `--ocelle-measure-container` (`100cqi`, R-08) is the table's visible
  inline size, the sticky offset keeps the caption at the scroll box's start edge while the table scrolls, and
  `text-align: start` starts each line there (the UA centres captions). Squad round 2 measured the
  caption wrapping to three lines inside x 0 to 293 at 320 px, staying at x 0 to 320 at `scrollLeft` 500, with the page
  at 320 px and the AX tree still holding role `table` named by the caption plus its 26 `row`, `columnheader` and
  `cell` nodes. `start` and `inset-inline-start` mirror under `dir="rtl"` (squad round 3: lines x 5 to 320 and 40
  to 320 at `scrollLeft` 0 and -500). Both parts are required and tested (operator decision PLAN-FRESH-3-001 (a),
  spec FR-017, US3-3, US3-9). The test reads the caption text's rects with `Range.getClientRects()` and the
  table's visible box with `getBoundingClientRect()`. `getClientRects()` gives one rect per text-direction run, not
  one per line: squad round 3 (verify 1) measured, under `dir="rtl"` with the planned rule, three rects for a
  two-line Latin caption that ends in a full stop, x 3.2 to 320 (top 4), 42.3 to 46.3 (top 30.4, the full stop,
  which takes the paragraph's RTL direction and sits at the line's left end) and 46.3 to 320 (top 30.4); without
  the full stop the same caption gives one rect per line. So the test first merges the rects into line boxes: rects
  whose `top` agrees within 1 px form one line, whose left edge is the smallest `left` and whose right edge the
  largest `right` of its rects. It then asserts on the merged line boxes: at `scrollLeft` 0 each line box lies inside
  the box and its start edge is the box's start edge within 1 px (left under `ltr`, right under `rtl`); after two
  ArrowRight presses on the focused table (`scrollLeft` above 0), and at the most negative `scrollLeft` under
  `dir="rtl"`, each line box still lies inside the box. The fixture caption ends in a full stop, so the merge is
  exercised (merged, the rtl lines above are x 3.2 to 320 and 42.3 to 320, both ending at the start edge). Squad round 3 measured that each of the rule's parts is
  reached only by its own assertion: without the sticky offset the caption lines lie inside the box at `scrollLeft`
  0 but at x -500 to -185 at `scrollLeft` 500; centred, the capped lines lie at x 3 to 317 and 20 to 300, inside the
  box at every scroll position but not at its start edge; without the cap the caption is one line from x 0 to 599.

**Why**: this is the only no-wrapper mechanism that gives the table its own scroll box. Spec check 3 measured in
Chromium 153 that such a box is a tab stop when it has no focusable content, and that Tab lands on a link inside it
otherwise, from which the arrow keys scroll it. That is the behaviour the operator chose.

**Verify in the spike**:
1. In the accessibility tree (CDP `Accessibility.getFullAXTree`), the table with `display: block` and
   `container-type: inline-size`, and its sticky caption, keeps role `table`, its `row`, `columnheader` and `cell`
   nodes, and its `caption` as the accessible name. Chromium has kept table semantics for `display: block` since it
   built the tree from the DOM table, but this is measured, not assumed, with the containment and the caption rule
   on. The AX tree gives no
   row, column or header-index property for these nodes (squad round 1: `columnheader` has only `readonly` and
   `required`), so the association of each cell with its column header is asserted on the tree's structure
   (PLAN-TESTABILITY-1-009): walking `childIds` from the table, the header row holds `columnheader` nodes, and each
   `cell` of a body row sits at the same child index in its row as the `columnheader` of its column, whose name is that
   header's text. If the spike finds a better observable (for example `Accessibility.queryAXTree`, or a column index
   property), it records it and the test uses it.
2. A cell with `min-inline-size: 12ch` is at least 12ch wide in the anonymous table layout. If Chromium ignores
   `min-inline-size` on cells, the alternative is `min-inline-size` on the cell's content, through
   `[data-ocelle-prose=""] :where(th, td)`, with `inline-size` left to the table algorithm; the spike records which one
   works.
3. With `container-type: inline-size`, the wide table in each host layout of `prose-hosts.html` (grid `1fr` beside a
   rail, `flex: 1` beside a rail, nested in the grid item) leaves `documentElement.scrollWidth` at the viewport width
   at 320 px, while the table's own `scrollWidth` exceeds its `clientWidth`; and in the modal `<dialog>` host of
   definite width, at 1280 px, the table that fits has `clientWidth` equal to `scrollWidth` and is not a tab stop.
4. The plant for the table that fits (R-10) makes it overflow and a tab stop.
5. At 320 px, with the `Range.getClientRects()` rects merged per line first (same `top` within 1 px; smallest
   `left`, largest `right`), every line box of the fixture's caption of at least 80 characters, ending in a full
   stop, lies inside the table's visible box and starts at its start edge (within 1 px) at `scrollLeft` 0, and still
   lies inside it after two ArrowRight presses and, under `dir="rtl"`, at the most negative `scrollLeft`. Each of the three caption plants of R-10 bites
   alone and is recorded: `position: static` fails the scrolled assertion, `text-align: center` the start-edge
   assertion, and `max-inline-size: none` the `scrollLeft`-0 containment assertion (PLAN-FRESH-3-001 (a)).

If (1) fails, the spec's fork applies (FR-017): the optional wrapper goes to the operator. If (3), (4) or (5) fails,
the phase stops and the orchestrator asks the operator.

**Browsers** (operator decision PLAN-A11Y-SECURITY-1-002 (a)): the keyboard model of FR-017 (a scroll box with no
focusable content is itself a tab stop) is Chromium's keyboard-focusable scrollers, measured only in Chromium (spec
check 3, the tests of 001 FR-005). It is guaranteed only in Chromium hosts. WebKit hosts (Kitty Desktop's webview on
macOS and Linux) are not measured, and their Markdown renderer adds `tabindex="0"` to tables. The spec Assumptions
and the README state this, and the README records it as an open limitation for kitty-mission-ui. No WebKit test is
added: 001 FR-005 keeps the tests on Chromium.

**Alternatives**: `overflow-x: auto` on the prose container: rejected, the whole document would scroll. A wrapper
`<div>`: excluded unless (1) fails.

## R-07 Line heights as tokens (FR-002)

**Decision**: the rule `ocelle/token-only` gets a secondary option, `lineHeight: "token"`. With it, a `line-height`
value, and the line-height part of a `font` shorthand (after the `/`), passes only if it is a single
`var(--ocelle-*)` token reference or a CSS-wide keyword (`inherit`, `initial`, `unset`, `revert`, `revert-layer`).
Everything else is raw there: a unitless number (`1.65`), a percentage (`165%`), any `calc()` (`calc(1.65)`), and a
keyword such as `normal` (PLAN-FRESH-1-003). Today token-only lets `%` through for any property
(`gates/stylelint/token-only.ts:53`), any number inside `calc()` (:55) and any non-colour identifier (:60), so dropping
`line-height` from the unitless set alone would leave those three holes. Unitless numbers stay allowed for `flex`,
`z-index`, `opacity` and `order`. `stylelint.config.ts` gets an override,
`{ files: ["packages/styles/**/*.css"], rules: { "ocelle/token-only": [true, { lineHeight: "token" }] } }`. Element
styles keep the 002 behaviour.

**Option model** (PLAN-TESTABILITY-1-003). Today `validateOptions` accepts only `tokens` and `elementProperties`
(token-only.ts:142) and the rule returns on invalid options (:144), and `optionLists` treats any secondary object as
the token lists, with `?? []` (:128-132). Left so, `{ lineHeight: "token" }` either turns the rule off or reports
every `var(--ocelle-*)` as unknown. So:
- `validateOptions` gains `lineHeight: ["token"]` as a possible value;
- `optionLists` uses the given lists only when `tokens` or `elementProperties` is present, else the repository lists
  loaded from the token source, so a `lineHeight`-only object keeps them;
- the flag is read apart from the lists and passed to the value check.

**Unit tests** in `gates/test/token-only.test.ts` (and `gates/test/token-only-parts.test.ts` if `rawValues` or its
parts change):
- with the option, `line-height: 1.65`, `165%`, `calc(1.65)` and `normal`, and `font: 16px/1.65 …`, are raw;
- without it, the same values are allowed as in 002;
- with `{ lineHeight: "token" }` alone (the repository lists), `line-height: var(--ocelle-line-height-normal)` and
  `line-height: inherit` pass and an unknown `var(--ocelle-nope)` is still reported;
- an invalid `lineHeight` value is reported as an invalid option.

The new branch is in mutation scope (`gates/**/*.ts`), so these unit tests, not only the gates-integration plants,
must kill its mutants.

**Plants** (all under `gates/plants/style-lint/`):
- `fail-styles-literal-line-height`: `line-height: 1.65` in `tree/packages/styles/src/x.css`, one `ocelle/token-only`
  finding;
- `fail-styles-percent-line-height` (`165%`), `fail-styles-calc-line-height` (`calc(1.65)`) and
  `fail-styles-normal-line-height` (`normal`), each in `tree/packages/styles/src/x.css`, one finding each;
- `pass-styles-line-height-token`: `line-height: var(--ocelle-line-height-normal)` in
  `tree/packages/styles/src/x.css`, expect pass (a token that exists in phase 2; the prose token comes in phase 4), so a rule that loses its lists or rejects its options fails a plant;
- the existing `pass-line-height` moves from `tree/packages/styles/src/x.css` to `tree/packages/elements/src/x.css`
  (still in the lint's scope through `packages/elements/**/*.css`), with its `why` changed to "A unitless line-height
  (line-height: 1.5) is allowed in element styles (002 FR-024); packages/styles requires a token (003 FR-002)". Where
  it is now, the override would turn it red (PLAN-CORRECTNESS-1-003). The move is part of the lint change in phase 2.
The plants are not test files under the story configuration's `test_pathspec`, so they land in phase 2's green half
with the option; the unit tests above are the option's red evidence (analysis finding F1).

**Why**: FR-002 asks for the line-height tokens to be used, and a browser test cannot tell a token from a literal.
Scoping the option keeps 002's element contract unchanged.

## R-08 New tokens (FR-021, operator decision SPEC-1-11)

**Decision**:

| Token | Group | Value | Use |
|---|---|---|---|
| `--ocelle-line-height-compact` | type | `1.5` | compact scale (#531) |
| `--ocelle-line-height-prose` | type | `1.65` | prose running text (#519) |
| `--ocelle-font-size-subhead` | type | `1.125rem` | prose `h2`, 18 px (#519) |
| `--ocelle-measure-reading` | shell | `68ch` | prose paragraph measure (#519) |
| `--ocelle-measure-cell` | shell | `12ch` | prose table cell floor (#519) |
| `--ocelle-measure-container` | shell | `100cqi` | the inline size of the nearest query container: caps a prose caption at the table's visible width (R-06, PLAN-FRESH-2-002) |

`--ocelle-measure-container` is the sixth token (FR-021). FR-002 admits no literal length in `base.css`, so `100cqi`
is a token rather than a token-only lint exemption: the lint stays unchanged for container units. An unregistered
custom property substitutes its value where it is used, so `100cqi` resolves at the caption against its nearest
query container, the table, not at `:root`. Without a query container, `cqi` falls back to the small viewport size.
Its `expected.ts` entry is `{ property: "width", used: 1000 }`, and the token browser test proves the container
resolution only with a change to its harness (PLAN-FRESH-2-002, squad round 2 verify 1). Today
`packages/tokens/test/browser/values.test.ts` appends the probes to a 1000px `position: relative` block that is not a
query container, so `width: var(--ocelle-measure-container)` measures 1280px, the viewport fallback, and a
`width(1280)` entry would pass while showing nothing about the container. The harness change gives that block
`container-type: inline-size`, so the same probe measures 1000px, the block's inline size, and the 1000 entry fails
if the token resolves against the viewport (1280px) or if the block stops being a query container. The block keeps
its explicit 1000px width, stays the probes' containing block and still establishes no layout containment, so the
transcribed values of the other probed tokens do not change; the existing suite run on the changed harness confirms
it. The header comment of `values.test.ts` names the query container with the 1000px containing block. Like
`measure-page` (`100%`), it is a relative measure in the shell group.

The token count goes from 109 to 115. No colour token is added. The colour pairings the prose and value families
create, nesting included, are:
- link and link-hover on canvas, and on inset (a link around or inside code);
- ink on inset (code), ink-soft on canvas (block quotes) and ink-soft on inset (code in a block quote);
- ink-muted on canvas (the value style; the value hook is for the main grounds only, R-02);
- focus on canvas and on inset (the ring on a prose link, table or code).

Each of these is already a `checked` pair of 002 in both themes in `packages/tokens/contrast/pairs.json`, so no new
contrast pair is needed. A test makes that a check, not a manual step (PLAN-TESTABILITY-1-012, User Story 3
scenario 6): `packages/styles/test/pairs.test.ts` (styles project) holds the list above as (foreground token, ground
token) pairs, read from one exported constant, and asserts that each is a `checked` pair in both themes in
`pairs.json`. Its plant is a fixture list with one pairing that is not in the file (`color-link` on `color-chrome`),
for which the same helper reports the missing pair.

**Why**: the names follow 002: `line-height-<use>`, `font-size-<name>` for an off-scale size (like `font-size-fact`),
and `measure-<use>` in the shell group. `subhead` names what it is in the prototype rather than "h2", so an element
can use it too.

**Alternatives**: `font-size-h2`: rejected, it ties a token to one element. A new group `prose`: rejected, the 002
groups are a closed set tested by `validateSource`.

**Where a token is added**, per the 002 test layout:
- `packages/tokens/src/source.ts` (record);
- `packages/tokens/test/expected.ts` (transcribed value and probe, by hand);
- for `measure-container` only, `packages/tokens/test/browser/values.test.ts`: the probe block becomes a query
  container (`container-type: inline-size`), so the probe resolves `100cqi` against its 1000px, not the viewport;
- `packages/tokens/CHANGELOG.md` (the Unreleased list is checked against `expectedTokens`);
- the tokens README table where it lists groups;
- the Storybook story of its group, which is checked by the Storybook csp test.

## R-09 Browser test harness (FR-022)

**Decision**: a new Vitest project, `styles-browser` (node environment, Playwright driven directly, like
`tokens-browser`), for `packages/styles/test/browser/**/*.test.ts`. It is excluded from mutation runs like
`tokens-browser`.

`packages/styles/test/browser/serve.ts` writes a temporary directory and serves it with the CSP header
`default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'`. `page.html`, the one fixture with an
image request (the local `img` source of User Story 1 scenario 10), is served with the same header plus
`img-src 'self'`, the directive a host needs for its own images; `default-src 'none'` would otherwise block the image
(squad round 2: one `img-src` violation and `naturalWidth` 0). Every page, `page.html` included, must report zero
violations (US1-5, US1-10, SC-001; operator decision PLAN-FRESH-2-003 (b)). `base.css` needs no `img-src`: it has no
`url()`. serve.ts's content types gain `.svg` as `image/svg+xml` (002's serve.ts served only html, css and woff2,
`packages/tokens/test/browser/serve.ts:56-60`). The directory holds:
- `tokens.css`, from the token generator;
- `base.css`, copied from `src`;
- the vendored fonts;
- the fixture pages from `packages/styles/test/fixtures/*.html`. These have no inline style or script;
- `media.svg` from `packages/styles/test/fixtures/`, the local `img` source of `page.html`, with a 2:1 natural size;
- `layout.css` from `packages/styles/test/fixtures/` (PLAN-A11Y-SECURITY-1-006): the host CSS the fixtures need and
  `base.css` does not provide (the 300 px two-column grid of User Story 4 scenario 1 and SC-005, the grid and flex
  hosts of `prose-hosts.html`, the `forced-color-adjust: none` region of User Story 1 scenario 4). It holds no rule of
  `base.css`; its selectors are `data-fixture` attributes. A fixture links it after `base.css` only where it needs
  it, as 002 served `font.css` (`packages/tokens/test/browser/serve.ts:42-47`);
- the plant stylesheets of R-10, linked only where a guard needs a planted rule;
- `control.html`, written by `serve.ts` from 002's `controlPage` (one inline `<style>`), the control page whose one
`style-src` violation shows that the collector reports (SC-001), as in 002.

It reuses `launch`, `collectViolations` and `violations` from `packages/tokens/test/browser/serve.ts` by relative
import.

**Vitest projects** (PLAN-TESTABILITY-1-004): the existing `styles` project includes `packages/styles/**/*.test.ts`
and excludes only the shared list (`vitest.config.ts:36-39`), so it would also run the browser tests. It gains
`exclude: [...excluded, "packages/styles/test/browser/**"]`, as `tokens` excludes its browser directory.
`gates/test/vitest-config.test.ts` pins the mutation-excluded list exactly (:41-48) and requires one project per test
file (:52-61); it changes first in phase 1: the excluded list gains `styles-browser`, and an owner assertion states
that `packages/styles/test/browser/*.test.ts` belong to `styles-browser` only. That test fails against the old
config, so this Setup change is not exempt from the red step.

The emulation:
- themes with `emulateMedia({ colorScheme })` and `data-theme` set through `page.evaluate`, as in 002;
- forced colours with `emulateMedia({ forcedColors: "active" })`, new in this repository;
- 200% zoom as a 640 px CSS viewport at `deviceScaleFactor: 2`, the CSS-pixel equivalent of a 1280 px window at 200%;
- 320 px as the viewport width;
- focus with `page.keyboard.press("Tab")` and `ArrowRight`;
- the accessibility tree with a CDP session (`Accessibility.getFullAXTree`).

**Table semantics** (User Story 3 scenario 7): asserted on the AX tree structure as R-06 (1) states.

**Copy test**: select the node's contents with the Selection API and read `getSelection().toString()`. Chromium
serialises the rendered text, so `text-transform` and `white-space` collapsing change it, which is what the copy
guards need.

## R-10 Guards and their plants (SC-002)

**Decision**: a guard ("does not") shares its test with the positive assertion it guards. Each test reads its
observations through a helper that returns a list of problems, for example `proseScopeProblems(page)`. The guard's
plant is a second fixture stylesheet that contains the defect, linked after `base.css`, so a plant rule of the same
specificity as the base rule wins by order. A plant test loads the page with that stylesheet and asserts that the same
helper reports the expected problem. This is how a browser test is shown able to fail without a gate. The
source-level checks (R-11) are unit tests whose plants are fixture strings. Every plant below is run once in the
spike, which records that it bites (the helper reports the problem); a plant that does not bite stops the phase.
A plant can only bite against the rule it undoes, and the spike runs in phase 2, before most rules and fixtures exist.
So the spike links a scratch stylesheet that defines the six tokens of R-08 and then holds the whole data-model § Rule
table (all four families, in order), and it measures on scratch copies of the fixture layouts of data-model § Test
fixtures (the media page and the `prose-hosts.html` hosts among them); neither is committed, and `spike.md` records
both (tasks T007).

**Browser guards**

| Guard | Plant |
|---|---|
| control borders (FR-007, US1-4) | `button { border: 0 }` |
| list semantics (FR-007) | none: no CSS plant exists in Chromium (see below) |
| pointer click shows no ring (US1-2) | `:focus { outline-style: solid }` |
| outline style without tokens (US1-6) | the 002 shorthand `:where(:focus-visible) { outline: var(--ocelle-focus-width) solid var(--ocelle-color-focus) }`, linked without `tokens.css` (it computes to `none`, SPEC-2-12) |
| forced-colours ring in a `forced-color-adjust: none` host region (US1-4) | `@media (forced-colors: active) { :where(:focus-visible) { outline-color: var(--ocelle-color-focus) } }`, the removal of the `Highlight` rule (R-05) |
| media aspect ratio of `img`, `video`, `svg` (US1-10) | `:where(img, video, svg) { block-size: revert-layer }` (`revert` does not bite; see below) |
| media aspect ratio of `canvas` (US1-10) | `:where(canvas) { aspect-ratio: 1 / 1 }`; no form of undoing `block-size: auto` bites for `canvas` (see below) |
| only the region is compact (US2-2) | `body { font-size: var(--ocelle-font-size-sm) }` |
| root size and target-min under compact on `<html>` (US2-4) | `[data-ocelle-density="compact"] { font-size: var(--ocelle-font-size-sm) }` without `:not(html)` |
| focus ring under compact on `<html>` (US2-4) | `[data-ocelle-density="compact"] :where(:focus-visible) { outline-width: var(--ocelle-border-width) }` (the root-size plant above cannot change the ring: `focus-width` 3px and `focus-offset` 2px are px tokens, `packages/tokens/src/source.ts:152-153`, PLAN-CORRECTNESS-1-006) |
| undocumented value of the density hook (FR-005; `data-ocelle-density="true"`) | `[data-ocelle-density] { font-size: var(--ocelle-font-size-sm); line-height: var(--ocelle-line-height-compact) }` (the presence form) |
| undocumented value of the value hook (US2-3) | `[data-ocelle-value] { color: var(--ocelle-color-ink-muted) }` (the presence form) |
| prose outside its container (US3-5) | `p { line-height: var(--ocelle-line-height-prose) }` |
| undocumented value of the prose hook (US3-5) | `[data-ocelle-prose] :where(p) { line-height: var(--ocelle-line-height-prose) }` (the presence form) |
| prose container rule not on `<html>` (US3-5, `prose-root.html`) | `[data-ocelle-prose] { line-height: var(--ocelle-line-height-prose) }` without `:where(:not(html))` |
| no page scroll in grid and flex hosts (US3-3, SC-004) | `[data-ocelle-prose=""] :where(table) { container-type: normal }` (`contain: none` does not remove the containment that `container-type` applies) |
| inset table ring inside the viewport (US3-3) | `[data-ocelle-prose=""] :where(table:focus-visible) { outline-offset: var(--ocelle-focus-offset) }` |
| caption wraps inside the visible box at `scrollLeft` 0 (US3-3, US3-9) | `[data-ocelle-prose=""] :where(caption) { max-inline-size: none }` (the long caption runs on one line past the visible box, x 0 to 599 at 320 px) |
| caption stays inside the visible box when scrolled (US3-3, US3-9; PLAN-FRESH-3-001 (a)) | `[data-ocelle-prose=""] :where(caption) { position: static }` (the lines pass at `scrollLeft` 0 but lie at x -500 to -185 at `scrollLeft` 500) |
| caption starts at the start edge (US3-3, US3-9; PLAN-FRESH-3-001 (a)) | `[data-ocelle-prose=""] :where(caption) { text-align: center }` (the capped lines lie at x 3 to 317 and 20 to 300, inside the box but not at its start edge) |
| table that fits is not a tab stop (US3-3) | `[data-ocelle-prose=""] :where(table) { max-inline-size: var(--ocelle-measure-cell) }`, which makes the fitting table overflow and so a tab stop (PLAN-TESTABILITY-1-005; `overflow-x: scroll` does not bite, Chromium skips a fitting scroller) |
| link underlined in every state (US3-6) | `[data-ocelle-prose=""] :where(a:any-link:hover, a:any-link:focus-visible) { text-decoration-line: none }` |
| `<a id>` target is not styled as a link (US3-6) | `[data-ocelle-prose=""] :where(a) { color: var(--ocelle-color-link) }` |
| table semantics (US3-7) | `[data-ocelle-prose=""] :where(table) { display: grid }`, if the spike measures that it drops the `row`/`columnheader`/`cell` structure; otherwise none, with the measurement recorded |
| `pre` copy (US3-8) | `[data-ocelle-prose=""] :where(pre) { white-space: normal }` (a bare `pre` at (0,0,1) loses to the base rule's (0,1,0) and computes `pre-wrap`, so it does not bite) |
| wrap is opt-in (US4-2) | `* { overflow-wrap: anywhere }` |
| no ellipsis (US4-1) | `[data-ocelle-wrap] { text-overflow: ellipsis; overflow: hidden; white-space: nowrap }` |
| identifier copy (US4-3) | `[data-ocelle-wrap] { text-transform: uppercase }` |
| undocumented value of the wrap hook (FR-005; `data-ocelle-wrap="true"`) | `[data-ocelle-wrap] { overflow-wrap: anywhere }` (the presence form) |

**List semantics have no CSS plant in Chromium** (PLAN-TESTABILITY-1-005; SC-002 lets the plan record why). Squad
round 1 measured, in Chromium 153, that `ul { list-style: none; display: contents }` and `ul { display: grid }` keep
the `list` node and both `listitem` nodes in `getFullAXTree`. The spike repeats this with `list-style: none`,
`display: contents`, `display: grid`, `display: flex` and `display: block` and records the result. The test still
asserts role `list` next to the `box-sizing` positive, so it fails at red; if the spike finds a value that does drop
the role, that value becomes the plant.

**The media aspect-ratio plants** (PLAN-CORRECTNESS-1-009). Squad round 1 measured, in Chrome for Testing 153.0.8010.12
at 320 px, with `img`, `svg`, `canvas` and `video` at `width="2000" height="1000"` under the media rule of data-model
§ Base layer: a plant `block-size: revert` leaves all four at 320 x 160, because `revert` rolls back the whole author
origin, the `height` presentational hint included, to the UA's `auto`; it cannot fail the test. `block-size: unset`
gives the same. `block-size: revert-layer` rolls back only to the presentational hint, which sits below the unlayered
author rules: `img`, `svg` and `video` render 320 x 1000, the state of a `base.css` without `block-size: auto`, so it
is their plant. `canvas` stays 320 x 160 under every one of these, since its `width` and `height` attributes set its
bitmap size, which is its natural size and ratio, not a presentational hint: without `block-size: auto` its height is
already `auto`, so the canvas half of the assertion is a guard no removal of the rule can break. Its plant is a defect
of the same outcome, `:where(canvas) { aspect-ratio: 1 / 1 }`, which renders 320 x 320, so the canvas assertion is shown
able to fail. The fixture `img` source is a local file, `media.svg`, whose natural ratio is the attributes' 2:1, since
a loaded image's natural ratio replaces the attribute ratio. It loads because `page.html` is served with
`img-src 'self'` (R-09, operator decision PLAN-FRESH-2-003 (b)), and the test asserts that it loaded (`naturalWidth`
above 0) before it measures the ratio.

**Source-level guards** (R-11; plants are fixture strings)

| Guard | Plant (fails) | Boundary that must pass |
|---|---|---|
| motion (US1-3) | `transition: color 1s`; `animation-name: x`; `scroll-behavior: smooth`; `transition-duration: 1s` inside `@media (prefers-reduced-motion: no-preference)` | — |
| `forced-color-adjust` (US1-3) | `forced-color-adjust: none` | — |
| `outline: none` (FR-009) | `:where(a) { outline: none }`; `:where(a) { outline: 0 }`; `:where(a) { outline-style: none }`; the same inside `@media (forced-colors: active)` | — |
| `@import`, `url()` (US1-5) | `@import "x.css";`; `background-image: url(x.png)` | — |
| class selector (US1-8) | `.x {}`; `[data-ocelle-prose] p:not(.x) {}` | — |
| specificity (US1-8) | `#x p {}`; `:root {}` (0,1,0); `:focus-visible {}` (0,1,0); `[data-ocelle-prose] :where(a):hover {}` (0,2,0); `[data-ocelle-prose] p:not(.x) {}` | `[data-ocelle-prose] p {}` (0,1,1); `:where(:root) {}` (0,0,0); `:where(*)::before {}` (0,0,1) |
| FR-020's list on the wrap rule | `word-break: break-all`; `hyphens: auto`; `text-overflow: ellipsis`; `white-space: nowrap` | — |

**Other guards**

| Guard | Plant |
|---|---|
| literal line height (FR-002) | the style-lint plants of R-07 |
| colour pairings (US3-6) | the pairs test's fixture list with `color-link` on `color-chrome` (R-08) |

## R-11 Source-level checks (User Story 1 scenarios 3, 5 and 8; FR-009, FR-010, FR-011, FR-020, FR-025)

**Decision**: unit tests in the `styles` project, `packages/styles/test/source.test.ts`, read `src/base.css` once and
parse `buildPlan(text)[0].content` (R-01) with PostCSS. `build.test.ts` proves that `dist/base.css` is
byte-identical to it, so together they cover the shipped file (PLAN-CORRECTNESS-1-008). They report:
- any declaration whose property is or starts with `transition` or `animation`, or is `scroll-behavior`, at any depth
  (inside `@media` and other at-rules too);
- `forced-color-adjust: none`;
- `outline: none`, `outline: 0` and `outline-style: none`, on any selector (FR-009);
- any `@import` or `url(`;
- any class selector;
- any selector over its specificity bound;
- any property from FR-020's forbidden list (`word-break`, `hyphens: auto`, `text-overflow: ellipsis`,
  `white-space: nowrap`) on a `data-ocelle-wrap` rule.

**Each guard is paired with a positive assertion over the same parse, in the same test** (PLAN-TESTABILITY-1-001),
so the test fails against the empty `src/base.css` of phase 1 and cannot pass vacuously:
- motion and `forced-color-adjust` (US1-3): the parse holds the `:where(:focus-visible)` rule with its four outline
  longhands, and the `@media (forced-colors: active)` rule;
- `outline: none` (FR-009): the same `:where(:focus-visible)` rule declares `outline-style: solid`;
- `@import` and `url()` (US1-5): the parse holds at least one rule of each family the phase has added;
- class and specificity (US1-8): the parse contains every selector of data-model § Rule table that the phase has
  added, so at least one hook selector and one base selector were measured, and the counted list is not empty;
- FR-020: the `[data-ocelle-wrap="anywhere"]` rule exists and declares `overflow-wrap: anywhere`.

Each positive grows with its phase, red first, as the guarded rules land. The plants of R-10 (source-level guards)
are fixture strings run through the same helper, which must report them, and the boundary strings, which it must not.

Specificity is computed with `postcss-selector-parser`. It is already in the lockfile through stylelint, and becomes
an explicit pinned devDependency of the root (the pins gate requires that). Pseudo-elements count as (0,0,1),
pseudo-classes as (0,1,0) except `:where()` (0) and `:not()`/`:is()` (their argument), per Selectors Level 4.

**Why**: these are properties of the file, not of a page, and are cheapest and most exact at the source.

## R-12 Storybook (FR-023)

**Decision**:
- `storybook/scripts/swatches.ts` `writeGenerated` also copies `packages/styles/src/base.css` to
  `.generated/base.css`.
- `.storybook/preview-head.html` links it after `tokens.css`, for the whole preview. Every story, the element stories
  of #7 to #17 and their future baselines (#10) included, renders with `base.css`, so no story shows an element on a
  page without it (operator decision PLAN-FRESH-2-004 (a)). Because `base.css` styles custom-element hosts (R-14),
  an element story shows the host with the base `box-sizing` and, on a focusable host, the base ring.
- A new `storybook/stories/base.stories.ts` (title "Base styles") has four stories: Base page, Compact screen (compact
  and value hooks), Prose document and Identifier wrap. Each returns escaped markup from
  `storybook/stories/render.ts`'s new `renderFamily(name)` with no style attributes and no class.
- The stories' layout (the 300 px two-column grid of the Identifier wrap story) comes from a story-only stylesheet,
  `storybook/.storybook/stories-layout.css`, imported by `preview.ts` as `preview.css` is
  (PLAN-A11Y-SECURITY-1-006). It holds layout only, no rule of `base.css`, and its selectors are `data-story`
  attributes.
- The prose text of the stories (headings, paragraphs, table cells) lives in a data file,
  `storybook/stories/base-content.json`, which `renderFamily` reads. It is outside the mutation scope
  (`gates/lib/mutation/ranges.ts:34` covers `storybook/stories/**/*.ts`), so the text cannot leave string mutants that
  no test can kill (PLAN-TESTABILITY-1-011).

The tests to update or add:
- `storybook/test/unit/render.test.ts` (in mutation runs) gains behavioural cases for `renderFamily`
  (PLAN-TESTABILITY-1-011): each family's markup carries its hook attribute with its documented value (compact:
  `data-ocelle-density="compact"` and `data-ocelle-value` in both variants; prose: `data-ocelle-prose`; wrap:
  `data-ocelle-wrap="anywhere"`); it holds the elements its story must show (for prose, the US3 element list, a wide
  table and a table with a link); it has no `style` attribute and no `class`; and text from the data file is escaped
  (a `<` in a content string comes out as `&lt;`);
- `swatches.test.ts` (the directory listing);
- `stories.test.ts`;
- the integration `csp.test.ts`: its `groups` and its document count gain the four stories, which must show zero
  violations and no monospace.

`storybook/.storybook/preview.css` today has a bare `pre, code, kbd, samp` rule at (0,0,1), which beats `base.css`'s
(0,0,0) rule in every story, so the csp test's no-monospace check would pass with the base rule removed
(PLAN-FRESH-1-012). It is narrowed to the preview's own error display, the markup it exists for:
`.sb-errordisplay_main :where(pre, code, kbd, samp), .sb-errordisplay_main .sb-errordisplay_code`. Story content is
then styled by `base.css` alone.

## R-13 Measures in `ch` and the line-height pixel values

**Decision**: the tests compare computed values at the default 16 px root.
- The prose line height 1.65 × 16 px = 26.4 px, and the compact 1.5 × 14 px = 21 px. A line height is 1.65 times
  the element's own computed font size, so a 12 px `th` (FR-018) has 19.8 px, while `td` has 26.4 px.
- `68ch` and `12ch` are compared against the width of `"0"` in the element's font, measured in the page with a canvas
  `measureText`. The measure is a maximum, so a paragraph's box is at most 68 × that width (±1 px).

## R-14 Documentation

**Decision**:
- `packages/styles/README.md` covers:
  - the link order (`tokens.css`, then `base.css`) and the host CSP;
  - the `@ocelle/tokens` version `base.css` needs (the version that adds the six tokens of R-08), matching the
    `peerDependencies` entry (R-01); before the first release both packages are at 0.0.0, so the README says the pin
    becomes meaningful at the first release (#11);
  - the four hooks with their values (R-02), and that any other value, `"true"` among them, does nothing;
  - each family, what it styles and its tokens;
  - the rule that prose wins over compact on one element;
  - placement: the value hook is for the main grounds only, not the chrome; the prose hook goes on a content
    container, not on `<html>` (R-02);
  - the host width of a prose container (operator decision PLAN-FRESH-2-001 (a), PLAN-FRESH-3-003, R-06), stated by
    its cause in one sentence: a prose container must not be sized from its content (shrink-to-fit or fit-content
    sizing); it gets its width from its context (block flow, a stretched grid or flex item such as `1fr` or
    `flex: 1`, a definite width). In a box sized from its content a table that would fit is cut down, scrolls and
    becomes a tab stop. The examples follow as examples, not as a complete list: a modal or non-modal `<dialog>`, a
    popover, a fixed or absolutely positioned panel without both inline insets or a width, `inline-block`, a float, a
    `display: table-cell` box, a default item of a row flex container, and a grid or flex item aligned to start; give such a box a
    definite width or stretch it;
  - custom-element hosts (operator decision PLAN-FRESH-2-004 (a)): `base.css` also styles the host of every element,
    which is in the light DOM: the `box-sizing` reset, and the focus ring on a focusable host. For normal declarations
    the page's rules beat a shadow tree's `:host` rules whatever their specificity, so an element cannot override
    them from its own stylesheet. Elements put their focusable part inside the shadow root or use `delegatesFocus`,
    and do not depend on their host's `box-sizing`; the Storybook preview renders every story with `base.css` (R-12);
  - for Markdown renderers: tables of three or more columns overflow at 320 px, so they scroll and, with no
    focusable content, are tab stops (PLAN-FRESH-1-006); the no-wrapper keyboard model is guaranteed only in
    Chromium hosts, WebKit hosts (Kitty Desktop on macOS and Linux) add `tabindex="0"` to tables in their renderer,
    and this is an open limitation for kitty-mission-ui (R-06); print is out of scope: prose tables are screen scroll
    boxes, so a printed document shows only the columns that fit the page, and a host that prints adds its own print
    rule (operator decision PLAN-FRESH-3-002 (b));
  - a table mapping kitty-mission-ui's E-23, E-37 and E-39 to the hooks and tokens that replace them (SC-006).
- `packages/styles/CHANGELOG.md` gets `## Unreleased` / `### Added`, naming `base.css` and the four attributes.
- `packages/styles/test/readme.test.ts` checks each statement, as the tokens readme test does. It grows red-first with
  the phases (PLAN-CORRECTNESS-1-010): phase 2 asserts the link order, the CSP, the tokens version, the base layer, the
  custom-element host statement and the CHANGELOG `base.css` entry; phase 3 adds the density and value hooks (README
  values, that any other value does nothing, what the compact-scale family styles and its tokens, the main-grounds
  limit, the CHANGELOG attribute names); phase 4 adds the prose hook, what the prose family styles and its tokens,
  prose over compact, the
  `<html>` placement, the host-width cause sentence (asserted as the cause, not as the list of examples), the
  three-column and WebKit statements, and the print statement; phase 5 adds the wrap hook, what the identifier-wrap
  family styles and its tokens, and SC-006. User Story 1 scenario 6's documentation half is complete only after phase 5.
- The tokens README sentence on `color-scheme` ("the base styles (#6) apply it…") becomes "`@ocelle/styles`
  `base.css` applies it", and its readme test changes with it.
