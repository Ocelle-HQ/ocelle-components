# Operator decision: the DigestScroll axe exception rows (T028 stop)

Date: 2026-11-21. Operator: jeroennouwsdev. Source: `reviews/phase-2/notes.md` § Stop for the operator.

## Finding

Twelve of the 14 planned rows match the real element exactly. The two DigestScroll rows (`ocelle-code-block >>> .code`, light and dark) match nothing: the digest is one span per group, so the gate prints one serious `color-contrast-incomplete` node per clipped group, `ocelle-code-block >>> .group:nth-child(11)`, `(13)`, … `(33)`, 12 per theme.

## Answer

**(a) 24 per-group rows.**
- Replace the story's two `.code` rows with 24 rows: 12 groups × light and dark.
- Selector: `ocelle-code-block >>> .group:nth-child(<n>)`, with the same reason and sunset as the other rows.
- Add matching rows to plan.md's Complexity Tracking table, which brings the total to 36 entries.
- The story does not change.

If the digest, the frame or the font changes, the selectors move, and that fails the gate as `stale-exception` or as an unexcepted finding.
