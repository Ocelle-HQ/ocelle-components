# Operator decision on phase 0 review round 1, R1-01, 030-release-v1

- **Date:** 2026-11-27
- **Decided by:** human:jeroennouwsdev
- **Finding:** R1-01 (`reviews/phase-0/round-1.md`): the recorded local plant run (`reviews/phase-0/plants.md`)
  exited 2, because this environment has no container engine (46 visual plants) and no pinned Chromium (12
  unit-tests, 22 axe and 4 element mutation plants); every other selected plant was judged as expected.
- **Decision:** "CI decides plants": a local plant run that exits 2 only for environment causes (no container
  engine, no pinned browser), with every other plant judged as expected, is accepted for the phase record; CI's
  required Plants check is the judge of every plant (operator's CI-first rule).
