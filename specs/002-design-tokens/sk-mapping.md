# Role mapping: kitty-mission-ui `--sk-*` roles to `@ocelle/tokens`

kitty-mission-ui commit: `c994c8ea07643050a5b2d159ae6ff16da709a7da`

The 55 `--sk-*` custom properties that the package source of kitty-mission-ui (`packages/*/src/`, without tests and
stories) referred to at the commit above, each with the `--ocelle-*` token that replaces it (FR-024, User Story 4).
Only the role names were read from kitty-mission-ui (constitution VI); the replacements are chosen from this
repository's token list by role, not by value.

This file is documentation, not source: it is never built, imported or published, and it lies outside the packages
the prefix gate scans (constitution I, plan.md Constitution Check). `packages/tokens/test/sk-mapping.test.ts` checks
it: 55 rows, column 2 a token or `dropped`, every `--ocelle-*` name a token of the stylesheet and the JSON export.

Columns: **Role** (the kitty-mission-ui role), **Token** (the replacement token, or `dropped` when no token takes the
role's place), **Replacement** (what to use instead of a dropped role, or the other roles merged into the same
token), **Note**.

| Role | Token | Replacement | Note |
|---|---|---|---|
| `--sk-border-control` | `--ocelle-color-control-border` | | boundary of inputs, buttons and chips (non-text 3:1) |
| `--sk-border-default` | `--ocelle-color-rule` | | decorative dividers only; where the border marks a control boundary use `--ocelle-color-control-border` (brand rule) |
| `--sk-border-focus` | `--ocelle-color-focus` | | focus ring colour; width `--ocelle-focus-width`, offset `--ocelle-focus-offset` |
| `--sk-border-selected` | `--ocelle-color-accent-strong` | | selected and current-item edge; for the rail and sidebar current item `--ocelle-color-current` |
| `--sk-border-strong` | `--ocelle-color-rule-strong` | | |
| `--sk-border-width-1` | `--ocelle-border-width` | | the one hairline width |
| `--sk-border-width-2` | `--ocelle-focus-width` | | used for focus outlines; other borders use `--ocelle-border-width` |
| `--sk-border-width-4` | `--ocelle-bar-width` | | the inline-start bar of a current or selected item |
| `--sk-fg-body` | `--ocelle-color-ink` | merged with `--sk-fg-default` | body text |
| `--sk-fg-default` | `--ocelle-color-ink` | merged with `--sk-fg-body` | default text |
| `--sk-fg-muted` | `--ocelle-color-ink-muted` | merged with `--sk-fg-subtle` | secondary text; for secondary headings `--ocelle-color-ink-soft` |
| `--sk-fg-subtle` | `--ocelle-color-ink-muted` | merged with `--sk-fg-muted` | the brand has no text step below muted that keeps 4.5:1; disabled text uses `--ocelle-color-disabled-ink` |
| `--sk-font-display` | `--ocelle-font-display` | | |
| `--sk-font-mono` | dropped | `--ocelle-font-sans` with `font-variant-numeric: var(--ocelle-figures)` | no monospace anywhere (brand rule): ids, digests, values and code use the sans with tabular figures; digests in groups of four |
| `--sk-font-sans` | `--ocelle-font-sans` | | |
| `--sk-layout-context-sidebar-width` | `--ocelle-shell-sidebar-width` | | the context sidebar |
| `--sk-layout-personal-rail-width` | `--ocelle-shell-rail-width` | | the personal rail is the shell's icon rail; it uses the chrome colour tokens in both themes |
| `--sk-mission-shell-content-padding` | `--ocelle-gutter` | | a property kitty-mission-ui declares itself from the space scale; the shell's content padding is the gutter, or a step of the space scale (`--ocelle-space-4`, `--ocelle-space-6`) where it changes with the viewport |
| `--sk-on-status-attention` | `--ocelle-color-warning` | | text and edge of the warning state, on `--ocelle-color-warning-bg` |
| `--sk-on-status-danger` | `--ocelle-color-danger` | | text and edge of the danger state, on `--ocelle-color-danger-bg` |
| `--sk-on-status-info` | `--ocelle-color-info` | merged with `--sk-on-status-recovery` | text and edge of the info state, on `--ocelle-color-info-bg` |
| `--sk-on-status-neutral` | `--ocelle-color-neutral` | | text and edge of the neutral state, on `--ocelle-color-neutral-bg` |
| `--sk-on-status-recovery` | `--ocelle-color-info` | merged with `--sk-on-status-info` | the tokens have no recovery state; a recovery in progress is shown as info |
| `--sk-on-status-success` | `--ocelle-color-success` | | text and edge of the success state, on `--ocelle-color-success-bg` |
| `--sk-radius-lg` | `--ocelle-radius-row` | merged with `--sk-radius-md` | the brand has one radius; rows and cards use the row radius |
| `--sk-radius-md` | `--ocelle-radius-row` | merged with `--sk-radius-lg` | rows and cards |
| `--sk-radius-pill` | `--ocelle-radius-pill` | | state pills only (brand rule); other pills use `--ocelle-radius-2` |
| `--sk-radius-sm` | `--ocelle-radius-2` | | buttons, chips and inputs: the brand's one radius |
| `--sk-space-1` | `--ocelle-space-1` | | |
| `--sk-space-10` | `--ocelle-space-10` | | |
| `--sk-space-12` | dropped | `calc(2 * var(--ocelle-space-10))`, or `--ocelle-measure-sheet` where it sets a reading width | the scale ends at `--ocelle-space-10` |
| `--sk-space-2` | `--ocelle-space-2` | | |
| `--sk-space-3` | `--ocelle-space-3` | | |
| `--sk-space-4` | `--ocelle-space-4` | | |
| `--sk-space-5` | `--ocelle-space-5` | | |
| `--sk-space-6` | `--ocelle-space-6` | | |
| `--sk-space-7` | `--ocelle-space-7` | | |
| `--sk-space-8` | `--ocelle-space-8` | | |
| `--sk-space-9` | `--ocelle-space-9` | | |
| `--sk-surface-card` | `--ocelle-color-sheet` | merged with `--sk-surface-input` | cards and the facts sheet; reading panes use `--ocelle-color-pane` |
| `--sk-surface-hero` | `--ocelle-color-panel` | | the tokens have no hero ground; a header band sits on the panel ground, ruled off |
| `--sk-surface-input` | `--ocelle-color-sheet` | merged with `--sk-surface-card` | inputs are field white |
| `--sk-surface-muted` | `--ocelle-color-inset` | | wells and digest backgrounds; a control drawn on it is bordered with `--ocelle-color-accent-strong` |
| `--sk-surface-page` | `--ocelle-color-canvas` | | the page ground |
| `--sk-surface-pill` | `--ocelle-color-neutral-bg` | | pill ground; a state pill uses the ground of its state (`--ocelle-color-danger-bg` and the others) |
| `--sk-text-2xl` | `--ocelle-font-size-2xl` | merged with `--sk-text-3xl` | |
| `--sk-text-3xl` | dropped | `--ocelle-font-size-2xl` | the type scale ends at `2xl`; a display title adds `--ocelle-font-weight-display` and `--ocelle-tracking-display` |
| `--sk-text-base` | `--ocelle-font-size-md` | | body size; fact values use `--ocelle-font-size-fact` |
| `--sk-text-lg` | `--ocelle-font-size-lg` | | |
| `--sk-text-sm` | `--ocelle-font-size-sm` | | |
| `--sk-text-xs` | `--ocelle-font-size-xs` | | |
| `--sk-weight-bold` | `--ocelle-font-weight-strong` | merged with `--sk-weight-semibold` | the brand has no step between strong and display; display is for the wordmark and display titles |
| `--sk-weight-medium` | `--ocelle-font-weight-medium` | | |
| `--sk-weight-normal` | `--ocelle-font-weight-regular` | | |
| `--sk-weight-semibold` | `--ocelle-font-weight-strong` | merged with `--sk-weight-bold` | |
