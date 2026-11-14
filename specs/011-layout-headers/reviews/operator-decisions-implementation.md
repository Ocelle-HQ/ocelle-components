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
3. **2026-11-14, token and element baselines across a merge of main** (standing rule relayed by the orchestrator):
   "Apply it at landing". A baseline PNG that conflicts in a merge of main is left out, the merge is finished, and
   the gap is recorded. The token stories' baselines (`tokens--colour`, `tokens--type`, which list the eyebrow
   tokens) and the new elements' baselines are regenerated from CI's captures at `/ocelle-land`, under decision 2.
4. **2026-11-14, a container engine after all** (the operator's final baseline rule, relayed by the orchestrator,
   session_01NUfZSc26YwQLeow31d6R6X): "Adopt new rule". It supersedes decisions 2 and 3. `dockerd` runs in these
   sessions once started as root (`nohup dockerd > <log> 2>&1 &`; docker 29.9.2 answers here; podman is absent).
   From phase 2 on (and anything phase 1 needs), baselines are made in #10's pinned container as #10 designed
   (`pnpm run visual:update`) and checked with `pnpm run gate:visual`; the record states that no cross-engine
   (podman) comparison was possible, and CI confirms the baselines at landing. When a merge of main conflicts on a
   baseline PNG, neither side is taken: the merge is finished, the affected baselines are regenerated in the pinned
   container and committed in the merge. The five container-engine tests of `gates/test/integration/visual.test.ts`
   are re-run with the engine and are expected to pass.
5. **2026-11-14, research.md R-04 after phase 2** (phase 2 reviews R1-04, R2-03, R3-02): "Planner amends R-04".
   Before phase 3, the planner corrects R-04 (and R-07 where it repeats it) to the section header as built: the
   actions wrapper keeps `flex: 0 1 auto` (FR-004 at 320 px), and the actions take `margin-inline-start: auto` when
   the empty heading column is hidden (FR-005, FR-010). No requirement changes.
6. **2026-11-14, the sidebar in a flex-column container** (decision 1's measurement, phase 4,
   `reviews/phase-4/flex-column-probe.log`): with `align-self: start` the sidebar fills a block or grid container
   but takes its content's inline size in a flex column (95 of 800 px); a page rule `align-self: stretch` on the host
   gives the full inline size; block size and the footer at the block end hold everywhere, and no US3 scenario
   changes. "README statement": `align-self: start` stays. The planner adds one statement to FR-036's README list
   for the sidebar, with its assertion in T035: in a flex column or flex row the container or the page sets the
   sidebar's inline size (an `inline-size`, a `flex` value, a grid track, or `align-self: stretch` on the host).
   No scenario is added.
