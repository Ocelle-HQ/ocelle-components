# Changelog

All notable changes to `@ocelle/tokens`. The package follows semantic versioning of its public surface
(constitution VII): the token names, the stylesheet hooks and the JSON shape.

## Unreleased

### Added

- `tokens.css`: every token as an `--ocelle-*` custom property, light by default and with no system preference,
  dark under `prefers-color-scheme: dark` unless `data-theme="light"`, and under `data-theme="dark"` on `<html>`;
  `--ocelle-motion-fast` and `--ocelle-motion-base` at `0ms` under `prefers-reduced-motion: reduce`.
- `tokens.json`: the same tokens with their group and resolved light and dark (or one) value.
- The package entry: `TokenName`, `tokenNames`, `tokens` and `cssName()`.
- The tokens, by group:
  - colour: `--ocelle-color-canvas`, `--ocelle-color-sheet`, `--ocelle-color-pane`, `--ocelle-color-panel`,
    `--ocelle-color-inspector`, `--ocelle-color-rail`, `--ocelle-color-inset`, `--ocelle-color-ink`,
    `--ocelle-color-ink-soft`, `--ocelle-color-ink-muted`, `--ocelle-color-rule`, `--ocelle-color-rule-strong`,
    `--ocelle-color-control-border`, `--ocelle-color-chrome`, `--ocelle-color-chrome-ink`,
    `--ocelle-color-chrome-muted`, `--ocelle-color-chrome-hover`, `--ocelle-color-accent`, `--ocelle-color-on-accent`,
    `--ocelle-color-accent-low`, `--ocelle-color-accent-strong`, `--ocelle-color-focus`, `--ocelle-color-current`,
    `--ocelle-color-link`, `--ocelle-color-link-hover`, `--ocelle-color-hover-bg`, `--ocelle-color-disabled-ink`,
    `--ocelle-color-disabled-bg`, `--ocelle-color-overlay`, `--ocelle-color-danger`, `--ocelle-color-danger-bg`,
    `--ocelle-color-warning`, `--ocelle-color-warning-bg`, `--ocelle-color-success`, `--ocelle-color-success-bg`,
    `--ocelle-color-info`, `--ocelle-color-info-bg`, `--ocelle-color-neutral`, `--ocelle-color-neutral-bg`,
    `--ocelle-color-scheme`
  - type: `--ocelle-font-sans`, `--ocelle-font-display`, `--ocelle-figures`, `--ocelle-font-size-xs`,
    `--ocelle-font-size-sm`, `--ocelle-font-size-md`, `--ocelle-font-size-fact`, `--ocelle-font-size-lg`,
    `--ocelle-font-size-xl`, `--ocelle-font-size-2xl`, `--ocelle-line-height-tight`, `--ocelle-line-height-normal`,
    `--ocelle-line-height-relaxed`, `--ocelle-font-weight-regular`, `--ocelle-font-weight-medium`,
    `--ocelle-font-weight-strong`, `--ocelle-font-weight-display`, `--ocelle-tracking-display`
  - space: `--ocelle-space-1`, `--ocelle-space-2`, `--ocelle-space-3`, `--ocelle-space-4`, `--ocelle-space-5`,
    `--ocelle-space-6`, `--ocelle-space-7`, `--ocelle-space-8`, `--ocelle-space-9`, `--ocelle-space-10`,
    `--ocelle-gutter`
  - shape: `--ocelle-radius-1`, `--ocelle-radius-2`, `--ocelle-radius-row`, `--ocelle-radius-shell`,
    `--ocelle-radius-pill`, `--ocelle-border-width`, `--ocelle-focus-width`, `--ocelle-focus-offset`,
    `--ocelle-bar-width`, `--ocelle-ring-step`
  - size: `--ocelle-target-min`, `--ocelle-icon-size`, `--ocelle-size-dot`, `--ocelle-size-step`,
    `--ocelle-size-avatar`, `--ocelle-size-rail-item`, `--ocelle-size-visually-hidden`
  - shell: `--ocelle-shell-topbar-height`, `--ocelle-shell-rail-width`, `--ocelle-shell-sidebar-width`,
    `--ocelle-shell-inspector-width`, `--ocelle-shell-main-max`, `--ocelle-shell-collapse-inspector`,
    `--ocelle-shell-collapse-sidebar`, `--ocelle-shell-height`, `--ocelle-footer-h`, `--ocelle-measure-sheet`,
    `--ocelle-measure-sentence`, `--ocelle-measure-page`, `--ocelle-dialog-max-inline`, `--ocelle-dialog-max-block`,
    `--ocelle-bar-block-narrow`
  - elevation: `--ocelle-elevation-sheet`, `--ocelle-elevation-raised`, `--ocelle-elevation-row`,
    `--ocelle-elevation-seg`, `--ocelle-elevation-bar`
  - motion: `--ocelle-motion-fast`, `--ocelle-motion-base`, `--ocelle-easing-standard`
