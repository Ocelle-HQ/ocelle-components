# Phase 5 review round 7: fixes

Review: `round-7.md` (changes_requested, 1 blocking finding, 2 notes). Documentation only: no code or test changed,
so no red commit applies.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R7-01 | fixed | none (documentation only) | 001 `spec.md` FR-013: an entry is a changed file, or for a file with more than 60 changed lines one line range of it, entries of at most 60 changed lines, so no shard holds more than 60 changed lines of one file, citing the operator decision of 2026-11-05 (phase 5 round 6 of mission 002, O6-01). 001 `spec.md` SC-005: no entry over 60 changed lines, with the same dated note. 001 `plan.md` Performance Goals: a file over 60 changed lines split into entries of at most 60, with the same note; a new "Re-check after phase 5 round 6 of mission 002" after the phase 3 round 12 re-check; § Verification item 4 notes the later lowering to 60. The 10-entry and 250-line bounds and the one-file-per-shard rule are unchanged; the historical re-checks after phase 3 rounds 9 and 10 and the recorded measurements stay as written. |
| R7-02 | note, no change | - | - |
| R7-03 | note, no change | - | - |
