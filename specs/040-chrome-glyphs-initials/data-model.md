# Data Model

## Chrome glyph

A glyph has an exact public `IconName`, drawing geometry in the shared view box and a direction-mirroring flag. The five new glyphs have distinct drawings and a false mirroring flag. Its host control owns the accessible name. Lookups for unknown, empty or differently spelled names preserve the existing reserved empty box.

## Initials presentation

A host optionally supplies `initials` as one or two non-whitespace Unicode grapheme clusters after trimming surrounding whitespace. Internal whitespace and out-of-range values use the ordinary presentation. Preserve the supplied casing and characters. Only a native button with empty visual slots uses the mark. The accessible name is separate and follows the existing button contract.

Normal enabled, busy and disabled button states retain their existing activation rules. Busy temporarily replaces the mark with the existing spinner. The treated presentation responds to changes to the initials, slot content, and button/link mode. The page owns account data and actions. The component adds no state persistence.
