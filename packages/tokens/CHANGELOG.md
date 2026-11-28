# Changelog

All notable changes to `@ocelle/tokens`. The package follows semantic versioning of its public surface
(constitution VII): the token names, the stylesheet hooks and the JSON shape.

## Unreleased

## 1.0.0 - 2026-11-28

The first public release, 1.0.0, published to the public npm registry with provenance, in lockstep with
`@ocelle/styles` and `@ocelle/elements`: everything below is the package's public surface since its start, every token
name, both themes, the stylesheet hooks, the JSON shape and the brand font.

**First release: hosts and Ocelle elements get every design token, both themes and the brand font from one
package (mission 002; #5).** Before, there was no token package: colours, spacing and type were not available as
shared `--ocelle-*` names. Now a host links `tokens.css` and serves `fonts/` beside it under `font-src 'self'`,
nothing loads from a CDN, and two new merge checks (Contrast, Brand rules) keep the token values accessible.

`--ocelle-lane-min-width`, `--ocelle-list-track-width`, `--ocelle-list-detail-collapse`,
`--ocelle-list-detail-inspector-collapse` and `--ocelle-scroller-fade-size`, the five tokens of the workflow layouts of
`@ocelle/elements`, are additions to the token names: a minor change.

**Controls get their own hover, pressed, inset-focus and spinner tokens (mission 012, #50; part of #7).** Before,
`ocelle-button` and `ocelle-action-row` had no token for a hovered border, a pressed surface, a focus ring drawn inside
the row or a busy spinner's turn. Now seven tokens cover them, every motion duration is zeroed under reduced motion
unless its name ends in `-delay`, and the token build refuses a misplaced delay marker or a duration that is not a
literal `ms` value. The seven tokens are additions to the token names: a minor change.

`--ocelle-size-indicator` and `--ocelle-motion-pulse`, the two tokens of `ocelle-status-indicator` of
`@ocelle/elements`, are additions to the token names: a minor change.

`--ocelle-line-height-snug`, the compact line height of `ocelle-pill-tag` of `@ocelle/elements`, is an addition to the
token names: a minor change.

`--ocelle-target-small`, the 24 px minimum target of an interactive `ocelle-pill-tag` of `@ocelle/elements`, is an
addition to the token names: a minor change.

### Added

- **Configurable app-shell thresholds are a minor addition (mission 015, #12).**
  `--ocelle-app-shell-narrow-below` (45rem) and `--ocelle-app-shell-collapse-below` (68.75rem) let hosts tune
  when a frame switches between narrow drawer, collapsed navigation, and expanded navigation. The defaults are
  published in both themes, and a valid explicit shell setting takes priority over the corresponding token.

- `fonts/`: Schibsted Grotesk, the variable `wght` WOFF2 with its SIL Open Font License 1.1 (`OFL.txt`), declared
  by `@font-face` in `tokens.css` with a relative URL; see the README for the CSP the host needs.
- `tokens.css`: every token as an `--ocelle-*` custom property, light by default and with no system preference,
  dark under `prefers-color-scheme: dark` unless `data-theme="light"`, and under `data-theme="dark"` on `<html>`;
  every motion duration (`--ocelle-motion-fast`, `--ocelle-motion-base`, `--ocelle-motion-spin`,
  `--ocelle-motion-pulse`) at `0ms` under `prefers-reduced-motion: reduce`.
- `tokens.json`: the same tokens with their group and resolved light and dark (or one) value.
- The package entry: `TokenName`, `tokenNames`, `tokens` and `cssName()`.
- The tokens, by group:
  - colour: `--ocelle-color-canvas`, `--ocelle-color-sheet`, `--ocelle-color-pane`, `--ocelle-color-panel`,
    `--ocelle-color-inspector`, `--ocelle-color-rail`, `--ocelle-color-inset`, `--ocelle-color-ink`,
    `--ocelle-color-ink-soft`, `--ocelle-color-ink-muted`, `--ocelle-color-eyebrow` (the eyebrow colour, an alias of
    `--ocelle-color-ink-muted` with a text contrast entry on every main ground, 011), `--ocelle-color-rule`, `--ocelle-color-rule-strong`,
    `--ocelle-color-control-border`, `--ocelle-color-chrome`, `--ocelle-color-chrome-ink`,
    `--ocelle-color-chrome-muted`, `--ocelle-color-chrome-hover`, `--ocelle-color-accent`, `--ocelle-color-on-accent`,
    `--ocelle-color-accent-low`, `--ocelle-color-accent-strong`, `--ocelle-color-focus`, `--ocelle-color-current`,
    `--ocelle-color-link`, `--ocelle-color-link-hover`, `--ocelle-color-hover-bg`, `--ocelle-color-disabled-ink`,
    `--ocelle-color-disabled-bg`, `--ocelle-color-overlay`, `--ocelle-color-danger`, `--ocelle-color-danger-bg`,
    `--ocelle-color-warning`, `--ocelle-color-warning-bg`, `--ocelle-color-success`, `--ocelle-color-success-bg`,
    `--ocelle-color-info`, `--ocelle-color-info-bg`, `--ocelle-color-neutral`, `--ocelle-color-neutral-bg`,
    `--ocelle-color-scheme`
  - type: `--ocelle-font-sans`, `--ocelle-font-display`, `--ocelle-figures`, `--ocelle-font-size-xs`,
    `--ocelle-font-size-sm`, `--ocelle-font-size-md`, `--ocelle-font-size-fact`, `--ocelle-font-size-subhead` (the
    prose `h2` of `@ocelle/styles`, 003), `--ocelle-font-size-lg`, `--ocelle-font-size-xl`, `--ocelle-font-size-2xl`,
    `--ocelle-line-height-tight`, `--ocelle-line-height-snug` (the compact `ocelle-pill-tag` of `@ocelle/elements`,
    018), `--ocelle-line-height-normal`, `--ocelle-line-height-relaxed`,
    `--ocelle-line-height-compact` (the compact scale of `@ocelle/styles`, 003), `--ocelle-line-height-prose` (the
    prose running text of `@ocelle/styles`, 003), `--ocelle-font-weight-regular`, `--ocelle-font-weight-medium`, `--ocelle-font-weight-strong`,
    `--ocelle-font-weight-display`, `--ocelle-tracking-display`, and the eyebrow tokens of `@ocelle/elements`' section
    header (011): `--ocelle-font-size-eyebrow` (an alias of `--ocelle-font-size-xs`), `--ocelle-font-weight-eyebrow`
    (an alias of `--ocelle-font-weight-strong`) and `--ocelle-tracking-eyebrow` (`0.08em`, also the letter spacing of
    the flat lane's title, 009)
  - space: `--ocelle-space-1`, `--ocelle-space-2`, `--ocelle-space-3`, `--ocelle-space-4`, `--ocelle-space-5`,
    `--ocelle-space-6`, `--ocelle-space-7`, `--ocelle-space-8`, `--ocelle-space-9`, `--ocelle-space-10`,
    `--ocelle-gutter`, `--ocelle-scroller-fade-size` (`ocelle-scroller`'s fade depth and focus clearance,
    `--ocelle-space-7`, 009)
  - shape: `--ocelle-radius-1`, `--ocelle-radius-2`, `--ocelle-radius-row`, `--ocelle-radius-shell`,
    `--ocelle-radius-pill`, `--ocelle-border-width`, `--ocelle-focus-width`, `--ocelle-focus-offset`,
    `--ocelle-bar-width`, `--ocelle-ring-step`, and for the inside focus ring of `ocelle-action-row` (012)
    `--ocelle-focus-offset-inset` (`calc(-1 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)))`, -5 px)
  - size: `--ocelle-target-min`, `--ocelle-icon-size`, `--ocelle-size-dot`, `--ocelle-size-step`,
    `--ocelle-size-avatar`, `--ocelle-size-rail-item`, `--ocelle-size-visually-hidden`, `--ocelle-tooltip-max-inline`
    (the maximum inline size of the `ocelle-tooltip` bubble; mission 008), `--ocelle-size-indicator` (the dot of
    `ocelle-status-indicator`, `0.5rem`; 018), `--ocelle-target-small` (the minimum target of an interactive
    `ocelle-pill-tag`, `1.5rem`; 018)
  - shell: `--ocelle-shell-topbar-height`, `--ocelle-shell-rail-width`, `--ocelle-shell-sidebar-width`,
    `--ocelle-shell-inspector-width`, `--ocelle-shell-main-max`, `--ocelle-shell-collapse-inspector`,
    `--ocelle-shell-collapse-sidebar`, `--ocelle-shell-height`, `--ocelle-footer-h`, `--ocelle-measure-sheet`,
    `--ocelle-measure-sentence`, `--ocelle-measure-page`, `--ocelle-measure-reading`, `--ocelle-measure-cell` and
    `--ocelle-measure-container` (the prose measure, table cell floor and caption cap of `@ocelle/styles`, 003),
    `--ocelle-dialog-max-inline`, `--ocelle-dialog-max-block`, `--ocelle-bar-block-narrow`, `--ocelle-drawer-inline`
    (the inline size of `ocelle-drawer`, the sidebar width; mission 008), `--ocelle-lane-min-width` (a board lane's
    minimum and flex basis, `10rem`), `--ocelle-list-track-width` (list-detail's list pane, `18rem`),
    `--ocelle-list-detail-collapse` and `--ocelle-list-detail-inspector-collapse` (list-detail's default
    `collapse-below` and `inspector-below`, `40rem` and `60rem`) (the workflow layouts of `@ocelle/elements`, 009)
  - elevation: `--ocelle-elevation-sheet`, `--ocelle-elevation-raised`, `--ocelle-elevation-row`,
    `--ocelle-elevation-seg`, `--ocelle-elevation-bar`
  - motion: `--ocelle-motion-fast`, `--ocelle-motion-base`, `--ocelle-easing-standard`, `--ocelle-tooltip-delay` (the
    hover delay of `ocelle-tooltip`, not zeroed under reduced motion; mission 008), and for the busy spinner of
    `ocelle-button` (012) `--ocelle-motion-spin` (one turn, `800ms`) and `--ocelle-motion-turn` (its angle, `1turn`),
    and for the pulse of `ocelle-status-indicator` (018) `--ocelle-motion-pulse` (one of its three iterations,
    `1600ms`)
- The token build refuses a misplaced `delay: true` (only a motion token whose name ends in `-delay` may carry it)
  and a motion duration that is not a literal `ms` value, such as `1s`, `var()` or `calc()` (mission 012).
- The control tokens of `@ocelle/elements`' `ocelle-button` (mission 012), in the colour group:
  `--ocelle-color-hover-border` (the border of a hovered or pressed bordered control, `--ocelle-color-ink` unless
  overridden), `--ocelle-color-accent-hover` (a primary control's hover fill), `--ocelle-color-active-bg` (the pressed
  surface of a secondary, quiet or flush control) and `--ocelle-color-chrome-active` (the pressed surface on the
  chrome grounds); their contrast pairs, and `color-accent-strong` declared on every main and chrome ground, join the
  contrast check. `--ocelle-color-ink-soft` is declared on the five state grounds too, for the description and
  tags of `ocelle-action-row` (012).
- `@ocelle/elements`' listbox, tabs and segmented choice (mission 014) draw their selected bars in
  `color-accent-strong` on the main grounds, which the contrast check covers through the grounds above; no token
  name, value or pair is added.
