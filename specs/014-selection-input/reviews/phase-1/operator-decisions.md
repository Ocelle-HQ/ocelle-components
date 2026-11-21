# Operator decisions during phase 1 (014)

Recorded by the orchestrator, 2026-11-14, human:jeroennouwsdev.

- **Visual baselines in cloud sessions.** These cloud sessions have no running docker or podman, so #10's pinned
  container cannot produce baselines here. For 014: no visual baselines (including the shared token-story baselines)
  are committed during implementation; the `visual` gate and the baselines are a recorded known gap, produced from
  CI's pinned-container captures during `/ocelle-land`. Container-engine tests that also fail at the phase base are
  environment-only (not a red/green or review finding). This amends FR-053, SC-007 and the per-phase baseline tasks
  (T027, T049, T068, T083, T099). Relayed by the wave orchestrator session and confirmed by the operator here.
