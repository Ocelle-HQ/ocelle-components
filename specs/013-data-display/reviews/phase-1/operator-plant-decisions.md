# Operator decision: T021 plant that does not bite

Date: 2026-11-14. Asked as multiple choice after the implementer's stop-and-ask (reviews/phase-1/plants.md).

Plant: two-column and stacked track `minmax(0, 1fr)` → `1fr` passes all 52 facts bodies, also with the `<dd>`'s `min-inline-size: 0` removed, because every overflowing body sets `wrap="anywhere"`.

**Decision: (b) Add test, keep R-03.** Add a body: a 600 px two-column sheet with an unbroken 64-character value and no `wrap`, asserting the value column's width. Redefine the plant as "`1fr` plus the `<dd>`'s `min-inline-size: 0` removed". Keep `min-inline-size: 0` on `<dd>` (R-03). The new body lands in a `fix-1` red commit before any change that makes it pass.

Rejected: (a) record as equivalent; (c) drop the `<dd>` guard.
