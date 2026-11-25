# Plan gate, 030-release-v1

- **Date:** 2026-11-25
- **Decided by:** human:jeroennouwsdev
- **Squad:** round 1 (4 lenses, 40 findings, 26 confirmed: 17 fixes, 9 forks; 2 refuted, 12 duplicates; 2 fix
  passes), round 2 (fresh, 6 confirmed: 3 fixes, 3 forks; 2 passes), round 3 (fresh, 2 confirmed: 2 forks; 1 pass);
  0 unresolved, cap of three rounds reached.
- **Plan decisions approved with the plan:** D1 (operator placeholder bootstrap, then OIDC-only `1.0.0`), D2 (peer
  `workspace:^1.0.0`, pins exception, constitution MINOR 1.4.0 per round-1 fork), D3 (Release readiness a required
  gate), D4 (`release.yml` reuses `ci.yml` via `workflow_call`), D5 (dry run not required; verdict check per round-3
  fork), D6 (own secret-scan rules), and the agent-side deny rules recorded as an operator task.
- **Decision:** approve.
