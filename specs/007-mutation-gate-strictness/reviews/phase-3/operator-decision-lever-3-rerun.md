# Operator decision: after lever 3

- Decided by: human:jeroennouwsdev (operator), 2026-11-11, at the stop-and-ask after lever 3
  (`stop-and-ask-lever-3.md`).
- Question: with 30-line entries every `source.ts` entry has 0 Timeout, 0 Survived, 0 NoCoverage and FR-011 holds;
  six of eight fit 176 s, but `91-120` (177.68 s) and `151-180` (182.52 s) miss it, each measured once. What now?
- Options offered: "Re-run the two once"; "Accept, CI decides"; "Smaller entries"; "Stop the run".
- Answer: **"Re-run the two once"**: re-measure `source.ts:91-120` and `source.ts:151-180` once each, alone, with the
  same command and base. If both are within 176 s, record both runs and go on. If either still misses, record it as
  measured, make no further change, and the CI measurement at landing (480 s per `gate:mutation` step, spec FR-010)
  decides.
