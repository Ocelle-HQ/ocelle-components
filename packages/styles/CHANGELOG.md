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
