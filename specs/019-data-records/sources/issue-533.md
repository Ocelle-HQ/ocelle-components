<!-- Provenance: spec-kitty/spec-kitty-design issue #533, title, metadata, body and comments as fetched on 2026-11-20, supplied by the operator (IQ-25 (b), reviews/phase-1/inventory-decisions.md; reviews/phase-2-inventory-decisions.md). Recorded verbatim below this note, unedited. The `sk-*` and `--sk-*` names are spec-kitty roles, not names of this library. -->

# data-table: no compact mono cell style, tracked eyebrow header, or body-colour cell text

- Number: #533
- URL: https://github.com/spec-kitty/spec-kitty-design/issues/533
- State: open
- Author: MOES-Media
- Created: 2026-10-11T10:45:35Z
- Updated: 2026-10-11T10:45:35Z
- Labels: (none)
- Milestone: (none)
- Fetched: 2026-11-20 20:03:43 UTC

## Body

**Gap.** The `.sk-data-table` family paints cells in the sans face at the library size with `--sk-fg-default` (255) text and headers in the cell style. A table of machine values (lane names, counts, identifiers) is designed with mono cells in the body colour (214) and headers as small tracked uppercase eyebrows with `0.06em` tracking and `--sk-space-3` padding. Related: #509 and #497 (eyebrow typography), #519 (prose tables).

**Ask.** A compact or mono density for the data-table family (cell face, size and body colour), and a header treatment that reuses the eyebrow style with a tracking token (the prototype uses 0.06em in headers and 0.08em elsewhere), or tokens for these values.

**Local stand-in until then (exception E-37, table part file).** `.sk-data-table td` takes `font-family: var(--sk-font-mono)` and `color: var(--sk-fg-body)`. `th` takes the mono face, `--sk-text-xs`, `text-transform: uppercase`, `letter-spacing: 0.06em` and `color: var(--sk-fg-subtle)`.

---

Source: the Drift screen in MOES-Media/kitty-mission-ui#10 uses a scoped local stand-in until this lands; its exception sunsets on this issue.


## Comments (0)
