# Phase 1 operator decisions

## T019 and the visual gate: "Try dockerd first" (2026-11-14, human:jeroennouwsdev)

Decision, as relayed by the coordinator: this container has the docker CLI and `/usr/bin/dockerd` but no running
daemon. At T019, first try to start `dockerd` and pull #10's pinned image (`storybook/visual/container.json`) through
the proxy. If that works, follow the plan (T019, `gate:visual`). If it does not, do not stop: fall back to the recorded
known gap. Commit no baselines, record `gate:visual` and any container-engine test that also fails at the phase base
as environment-only in the phase review (with the exact error), and the baselines are produced from CI's
pinned-container captures at `/ocelle-land`.

Outcome in this run: not reached. The phase stopped at the T001 spike's stop-and-ask point (`spike.md`, § Question
for the operator) before the scaffold, so T019 was not started and `dockerd` was not tried. The decision stands for
the run that resumes the phase.
