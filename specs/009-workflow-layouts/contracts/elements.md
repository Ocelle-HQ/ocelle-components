# Contract: the public surface this feature adds

Additions only (MINOR, constitution VII; FR-035). Element conventions are 005's (`packages/elements/README.md`
§ Element conventions). The manifest declares every row of the tables below. No element declares a CSS custom property
or a CSS part of its own (FR-030).

## Entry points (`@ocelle/elements`)

| Specifier | File | Defines |
|---|---|---|
| `@ocelle/elements/ocelle-scroller.js` | `dist/ocelle-scroller.js` | `ocelle-scroller` |
| `@ocelle/elements/ocelle-workflow-board.js` | `dist/ocelle-workflow-board.js` | `ocelle-workflow-board` |
| `@ocelle/elements/ocelle-workflow-lane.js` | `dist/ocelle-workflow-lane.js` | `ocelle-workflow-lane` |
| `@ocelle/elements/ocelle-list-detail.js` | `dist/ocelle-list-detail.js` | `ocelle-list-detail` |

The package root (`dist/index.js`) and the browser build (`dist/browser/ocelle-elements.js`) define all four as well.
The board module does not define the lane: a host imports both, or the root.

## `ocelle-scroller`

| Member | Kind | Type, default | Reflects | Description |
|---|---|---|---|---|
| `label` | property + attribute | `string \| undefined`, absent | no | Names the region while it overflows; trimmed, and blank counts as none (FR-010) |
| (default) | slot | | | The strip's content |

- **Events:** none. **Parts:** none. **CSS custom properties:** none.
- **Tokens read:** `--ocelle-focus-offset`, `--ocelle-focus-width`, `--ocelle-color-focus`,
  `--ocelle-scroller-fade-size`, `--ocelle-color-ink` (as a mask colour only).
- **Tree:** while overflowing and named, one `region` node with the name, holding the content. Otherwise no node of its
  own, beyond the host `generic` that an `id` or a host `aria-label` gives (research.md R-01).
- **Keyboard:** it is a tab stop while overflowing. `ArrowLeft` and `ArrowRight` scroll it 40 px with no animation. Other
  keys get the browser default.

## `ocelle-workflow-board`

| Member | Kind | Type, default | Reflects | Description |
|---|---|---|---|---|
| `label` | property + attribute | `string \| undefined`, absent | no | Names the board's region while it overflows (FR-014) |
| (default) | slot | | | The lanes; any child is laid out as a lane (FR-013) |

- **Events:** none. **Parts:** none. **CSS custom properties:** none.
- **Tokens read:** the scroller's, plus `--ocelle-lane-min-width` and `--ocelle-space-3`.
- **Tree and keyboard:** as the scroller (it uses the same module).
- **Ground:** none of its own; it goes on a main ground (research.md R-10).

## `ocelle-workflow-lane`

| Member | Kind | Type, default | Reflects | Description |
|---|---|---|---|---|
| `label` | property + attribute | `string \| undefined`, absent | no | The lane's title; trimmed, and blank counts as absent (FR-018) |
| `count` | property + attribute | `number \| undefined`, absent | no | Shown after the title. The attribute takes decimal digits only after trimming, and the property a safe integer ≥ 0; anything else counts as absent (research.md R-09) |
| `count-label` / `countLabel` | property + attribute | `string \| undefined`, absent | no | Replaces the count in the accessible name; trimmed (FR-019) |
| `variant` | property + attribute | `"flat" \| undefined`, absent | yes | `flat` drops the lane chrome and uses the small uppercase title (FR-017) |
| (default) | slot | | | The lane's content |

- **Events:** none. **Parts:** none. **CSS custom properties:** none.
- **Tokens read:**
  - layout and chrome: `--ocelle-lane-min-width` (through the board), `--ocelle-color-panel`, `--ocelle-radius-row`,
    `--ocelle-space-3`;
  - title and count: `--ocelle-font-size-sm`, `--ocelle-font-size-xs`, `--ocelle-font-weight-strong`,
    `--ocelle-color-ink`, `--ocelle-color-ink-soft`, `--ocelle-color-ink-muted`, `--ocelle-tracking-caps`,
    `--ocelle-font-sans`, `--ocelle-figures`;
  - forced-colours border: `--ocelle-border-width`.
- **Name:** `"<title>, <count-label or count>"`, `"<count-label or count>"` without a title, or `"<title>"` without a
  shown count. With neither title nor count, there is no group. A non-blank host `aria-label` decides the name alone.

## `ocelle-list-detail`

| Member | Kind | Type, default | Reflects | Description |
|---|---|---|---|---|
| `collapse-below` / `collapseBelow` | property + attribute | `string \| undefined`, absent | no | One column below this length; grammar below (FR-025) |
| `inspector-below` / `inspectorBelow` | property + attribute | `string \| undefined`, absent | no | Inspector stacked below this length; grammar below |
| `narrow` | property + attribute | `boolean`, `false` | yes | Forces one column (FR-027) |
| `detail-open` / `detailOpen` | property + attribute | `boolean`, `false` | yes | In one column, shows the detail instead of the list (FR-027) |
| `list` | slot | | | The list pane |
| (default) | slot | | | The detail pane |
| `inspector` | slot | | | The optional inspector pane (FR-024) |

- **Events:** none (FR-029). **Parts:** none. **CSS custom properties:** none.
- **Tokens read:** `--ocelle-list-track-width`, `--ocelle-shell-inspector-width`, `--ocelle-list-detail-collapse`,
  `--ocelle-list-detail-inspector-collapse`, `--ocelle-color-rule`, `--ocelle-border-width`, and the focus ring tokens
  for the pane wrappers.

### Container-tier convention (README; for #8 and #12)

- **Measurement.** A tier is chosen from the element's own border-box inline size, measured by a `ResizeObserver` and
  never from the viewport.
- **Threshold attribute.** Each threshold is a `*-below` attribute. After trimming ASCII whitespace it accepts exactly
  `^(?:0|[0-9]+(?:\.[0-9]+)?(?:px|rem|em))$`, units ASCII case-insensitive:
  - `rem` resolves at the root's computed font size, and `em` at the host's;
  - every other value counts as absent.
- **Default.** The token's value as computed on the element, parsed with the same grammar. When the token's value does
  not parse, the token's published value applies.
- **Bound.** Exclusive: the narrower tier applies when `measured < threshold`.
- **Forced narrow tier.** A boolean attribute set by the host (`narrow`) forces the narrowest tier.
- **No `container-type`.** It is never set on a host that may shrink to fit.
- **Intrinsic sizes.** They do not depend on the tier shown: max-content is the widest tier's and min-content the
  narrowest's (research.md R-13).

## Tokens (`@ocelle/tokens`)

| Token | Value | Group | Use |
|---|---|---|---|
| `--ocelle-lane-min-width` | `10rem` | shell | a lane's minimum and flex basis |
| `--ocelle-list-track-width` | `18rem` | shell | the list pane |
| `--ocelle-list-detail-collapse` | `40rem` | shell | the default `collapse-below` |
| `--ocelle-list-detail-inspector-collapse` | `60rem` | shell | the default `inspector-below` |
| `--ocelle-scroller-fade-size` | `var(--ocelle-space-7)` | space | the fade depth and the focus clearance |
| `--ocelle-tracking-caps` | `0.06em` | type | letter spacing of small uppercase labels (shared with #8, R-16) |

## Stories (`storybook/stories/`; recheck against #10 as merged, research.md R-15)

| File | Stories (each in light and dark) |
|---|---|
| `scroller.stories.ts` | Fits; Overflowing at start; Overflowing in the middle; Overflowing at the end; Right to left; Unlabelled |
| `workflow-board.stories.ts` | Five lanes (Frame W); Five lanes, narrow (overflowing); One lane; No lanes; Right to left |
| `workflow-lane.stories.ts` | Default with count; Default without count; Flat with count; Flat without count; Long title; Untitled with count |
| `list-detail.stories.ts` | Three columns; Two columns, inspector stacked; One column, list; One column, detail; No inspector; Right to left |

Frames are sized by `[data-story]` rules in `storybook/.storybook/stories-layout.css`. No story uses a `style`
attribute or a class.
