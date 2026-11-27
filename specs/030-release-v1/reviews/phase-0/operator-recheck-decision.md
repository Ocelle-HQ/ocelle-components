# Operator decision on the phase 0 recheck, 030-release-v1

- **Date:** 2026-11-27
- **Decided by:** human:jeroennouwsdev
- **Question:** `reviews/recheck.md` item 2b, the hard-coded required-check list of the Visual evidence reuse
  observer (`gates/bin/evidence-reuse-shadow.ts`, #103), which would judge every `ci.yml` run ineligible once this
  mission adds its three jobs.
- **Decision:** (a) extend each registration: T008/T019, T024/T033 and T047 (and their red tests) also add their
  check name to the observer's list, red-first.
