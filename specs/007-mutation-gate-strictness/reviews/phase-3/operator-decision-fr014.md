# Operator decision: lever 3 (spec FR-014)

- Decided by: human:jeroennouwsdev (operator), 2026-11-11, at the phase 3 stop-and-ask (`stop-and-ask.md`).
- Question: lever 1 removed every `source.ts` Timeout, but with the TypeScript checker on three of the four 60-line
  entries still miss 176 s (188 s, 251 s, 283 s), and lever 2 (concurrency 4 / 8 / 12) brought none within it. Which
  amendment of 001 FR-013, if any?
- Options offered: "30-line entries, all files"; "30-line entries, source.ts only"; "Keep 60, CI decides"; "Drop the
  time bound".
- Answer: **"30-line entries, all files"**: amend 001 FR-013 (and SC-005 where it states the bound) so that a file with
  more than 30 changed lines is split into entries of at most 30 changed lines (was 60), for every file. The other
  shard bounds (10 entries, 250 changed lines per shard; entries of one file never share a shard) are unchanged.
- The orchestrator's estimate of about 110 mutants and 145 s for the densest `source.ts` entry is an estimate only:
  the measurement runs of spec FR-009 / FR-010 with 30-line entries decide. If any entry still misses 176 s or keeps
  a Timeout, the question goes back to the operator.
