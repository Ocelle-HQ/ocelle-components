# Tasks gate and analysis decisions, 030-release-v1

- **Date:** 2026-11-26
- **Decided by:** human:jeroennouwsdev
- **Analysis:** `analysis-report.md` at 2a145bf (4 critical, 1 high, 9 medium, 4 low; coverage 100%). The analyst
  profile's write of the report was refused by the tool; the orchestrating session saved its text verbatim.
- **Tasks gate:** approve, on condition that the findings are resolved before the first red commit.
- **Fix scope:** "Everything now": all 18 findings (K1 to K4, E1, F1 to F6, E2, C1, A1, L1 to L4) are resolved
  before building, then the analysis runs again.
- **A1 (recorded third-party registry responses as test fixtures):** "Treat as asset": the fixtures under
  `gates/test/fixtures/install-check/` are third-party assets; they are listed in `THIRD_PARTY_NOTICES` with their
  licences, approved by the operator (constitution § Technology, Licence and Supply Chain).
