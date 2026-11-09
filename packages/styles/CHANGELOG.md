# Changelog

All notable changes to `@ocelle/styles`. The package follows semantic versioning of its public surface
(constitution VII): the `base.css` export, its hook attributes and their values, and what each family does.

## Unreleased

### Added

- `base.css`: the base layer for host pages, linked after `@ocelle/tokens` `tokens.css`: a minimal reset, the body
  in Schibsted Grotesk at the regular scale in ink on canvas, the root `color-scheme`, the token focus ring (in
  `Highlight` under forced colours), and `code`, `pre`, `kbd` and `samp` in Schibsted Grotesk with tabular figures.
  Every value is a token, every selector is wrapped in `:where()`, and it adds no motion. It declares
  `@ocelle/tokens` as an exact peer dependency.
- `data-ocelle-density`: the compact scale on an element and its descendants with `compact` (14 px, line height 1.5,
  on `<html>` the body, so the root font size and every `rem` token keep their values), and back to the regular scale
  with `regular`. Any other value has no effect.
- `data-ocelle-value`: the value text style, Schibsted Grotesk at 14 px with tabular figures in muted ink (the empty
  value) or body ink (`ink`), for the main grounds only. Any other value has no effect.
