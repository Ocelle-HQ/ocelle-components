# Operator decisions during phase 2 (014)

Recorded by the orchestrator, 2026-11-14, human:jeroennouwsdev.

- **Visual baselines under docker (replaces the 2026-11-14 gap decision in `reviews/phase-1/operator-decisions.md`).**
  From phase 2 on, baselines are produced in #10's pinned container under docker (`pnpm run visual:update`) and
  checked with `pnpm run gate:visual`. A note is recorded that no podman cross-engine check was possible in this
  session. CI confirms the baselines at landing. Baseline PNGs that conflict after a merge are regenerated, never
  hand-picked. Relayed by the wave orchestrator session and confirmed by the operator here ("Yes, apply from phase 2").
