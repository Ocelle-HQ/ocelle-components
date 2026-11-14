# Operator decisions during implementation (011)

Recorded by the orchestrator; each is the operator's answer (human:jeroennouwsdev) to a multiple-choice question.

1. **2026-11-13, flex-column containers** (raised by phase 1's spike fixes, `reviews/phase-1/spike-fixes.md`):
   "Measure in phase 4". Before the US3 red commit, phase 4's implementer measures `ocelle-context-sidebar` with
   `align-self: start` in a flex-column container. If it shrinks to its content's inline size, the README states
   that the container sets the sidebar's inline size (or a stretch rule is proposed), and any change to a scenario
   goes to the operator before the red commit.
2. **2026-11-14, no container engine in this environment**: "Baselines at landing". Phases 2 to 5 write their
   stories and every other test, but their visual baselines (T023, T031, T039, T046, baselines part) and the
   `visual` gate are left open as a recorded known gap. They are produced from CI's captures at `/ocelle-land`,
   once the pull request exists (#10 FR-005: CI's captures are committed when a local capture and CI's disagree).
   Each phase's red/green check failing only on the five container-engine tests of
   `gates/test/integration/visual.test.ts` goes to the operator as an accept, as phase 1 did
   (`reviews/phase-1/operator-accepted.md`).
