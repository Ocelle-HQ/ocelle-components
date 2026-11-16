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
- `data-ocelle-prose`: the prose family for a rendered Markdown document in a content container (the empty value
  only): text at 16 px with a line height of 1.65, an 18 px `h2`, paragraphs held to a 68ch measure, underlined
  links, code on the inset ground that wraps, and tables that scroll in their own box with a 12ch cell floor, an
  inset focus ring and a caption that stays in view. On one element with the compact hook it wins. Any other value
  has no effect.
- `data-ocelle-wrap`: the identifier wrap with `anywhere`: `overflow-wrap: anywhere` on the element, so a long
  identifier breaks anywhere instead of widening its grid column, and copies unchanged. It sets no font property.
  Any other value has no effect.
- The `ocelle-facts` value hooks: in a `data-ocelle-density="compact"` region `--ocelle-facts-value-size` and
  `--ocelle-facts-value-line-height` are the compact size and line height, and in a `regular` region the default
  ones, so fact values follow the region's scale.
- `ocelle-facts` before upgrade: each `ocelle-fact` child of an undefined `ocelle-facts` is a block, one value per line,
  at specificity (0,0,0); a hidden fact stays hidden.