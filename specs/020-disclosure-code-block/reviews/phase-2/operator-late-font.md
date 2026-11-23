# Operator decision: late web font and the rtl opening write (review note R1-01)

Date: 2026-11-21. Operator: jeroennouwsdev. Source: `reviews/phase-2/round-1.md`, R1-01.

## Finding

On a page that lays out a right-to-left scroll code block before its web font loads, the element's one opening write
(FR-021) leaves the line starts out of view. FR-021's stated result and the README's "the start of every line is in
view" are then untrue for that page.

## Answer

**Add a README caveat.** In phase 3 (polish):
- Add a README caveat telling consumers to preload the sans face for right-to-left scroll blocks.
- Qualify FR-021's stated result to match.
- The element does not change.

Also list the late font as a known gap in the ALL PHASES DONE message.
