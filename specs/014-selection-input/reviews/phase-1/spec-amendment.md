# Spec amendment after phase 1 (014): visual baselines at landing

Source: operator decision of 2026-11-14 in `reviews/phase-1/operator-decisions.md` (these cloud sessions have no
docker or podman, so #10's pinned container cannot produce baselines here).

The decision: no visual baseline, including the shared token-story baselines, is committed during implementation.
The `visual` gate and the baselines are a recorded known gap, produced from CI's pinned-container captures during
`/ocelle-land`. Container-engine tests that also fail at the phase base are environment-only, not a red/green or
review finding. Unchanged: the stories, the story test in each red commit and the `axe` gate in every phase.

| Artifact | Where | Change |
|----------|-------|--------|
| `spec.md` | "Dependency on #10" paragraph | "No phase lands with its baselines or axe results pending" now covers stories and axe; adds the decision, the known gap closed at `/ocelle-land` and the environment-only rule |
| `spec.md` | FR-053 | Each phase lands with its stories and a passing `axe` gate; the baselines (shared token-story ones included) are committed at landing from CI's pinned-container captures; environment-only rule |
| `spec.md` | SC-007 | `axe` 0 serious or critical per phase; committed light and dark baselines for every story when the feature lands; known gap until then |
| `plan.md` | Summary | New paragraph "Visual baselines are a known gap until landing" |
| `plan.md` | Constitution Check, V and Workflow gates | Baselines at landing; `visual` a known gap per phase, passes at landing |
| `plan.md` | Phase flow | Green commit no longer holds baselines |
| `plan.md` | Complexity Tracking | Exception to constitution V recorded with scope (phases 2 to 7 of 014), rationale and sunset (`/ocelle-land`: baselines from CI captures committed and `visual` passing before merge); operator-approved by the decision |
| `research.md` | R-12 | Title marks baselines at landing; Decision no longer produces baselines in green; new "Amendment: baselines at landing" paragraph |
| `quickstart.md` | Step 4 | `gate:visual` not run during implementation; known gap and environment-only rule |
| `tasks.md` | Tests note | Baselines-in-green sentence replaced by the decision |
| `tasks.md` | T027, T049, T068, T083, T099 | Each now records the known gap in `reviews/phase-N/` instead of producing and committing baselines |
| `tasks.md` | T028 (gate list; T050, T069, T084, T100 run "the gates of T028") | `gate:visual` removed, with the known gap and environment-only rule |
| `tasks.md` | T112, T113 | Composed story's baselines a known gap; full gate run without `gate:visual`, the gap listed in `reviews/phase-7/gates.md` |

Task IDs are kept. No ticked phase 1 task (T001 to T008a) is changed. `checklists/requirements.md`, the contracts and
the data model are unchanged.
