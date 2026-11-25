# Decisions applied before phase 3 (2026-11-22)

- **Decisions:** IQ-18 to IQ-24 and IQ-27 (`reviews/phase-3-inventory-decisions.md`), each (a), made by the operator
  on 2026-11-22; Q-T4 (a) and Q-T5 (b) (`reviews/issue-texts-check.md` § Operator decisions, 2026-11-20) were applied
  before phase 2 and stay in force.
- **Base:** d7b9ffa. Design artifacts only; no source or test file changes.
- **Counts:** unchanged. Phase 3 keeps 12 stories and 24 baselines; the mission keeps 46 stories and 92 baselines
  (since the phase 2 spike's Q1 (b)). No answer adds a property, attribute, slot, part or story, and no task is added,
  removed or renumbered.
- **Still open:** no inventory question. With Q-T4 (a) and Q-T5 (b), every inventory question is answered.

## Fails at red

`packages/elements/README.md` as folded at d7b9ffa has no chain section and names neither `ocelle-evidence-chain`
nor `ocelle-evidence-step`, so each statement T062 lists, the Q-T4 (a) chip row among them, fails at phase 3's red
against it, and T070 writes it in the green.

## Changes

| ID | Resolution | Where |
|---|---|---|
| IQ-27 | decided: (a). Phase 3 builds the chain as specified for #13 and the Ocelle console; the README maps the library's chain role by role; the metric and pill-tag families are not this mission's; no row changes on its account | research.md R-16 phase 3 table (closing note); contracts/ocelle-evidence-chain.md § README mapping; spec.md decisions; plan.md summary, § Decisions on the phase 3 inventory; tasks.md T062 |
| IQ-18 | decided: (a). `stages` → one `ocelle-evidence-step` per stage, in source order (Q3 (a)); a stage's `id` → an `id` the consumer sets on the step, which the element neither reads nor writes | research.md R-16 (stages, a stage's id); contracts/ocelle-evidence-chain.md and ocelle-evidence-step.md § README mapping; tasks.md T062, T070; spec.md decisions, FR-058; plan.md |
| IQ-19 | decided: (a). Label, display value and annotation → the consumer's markup in the step's content; a later issue covers a valued stage | research.md R-16; contracts/ocelle-evidence-step.md § README mapping; tasks.md T062, T070; spec.md decisions; plan.md |
| IQ-20 | decided: (a). Tone → the state worded in the step's text, no state colour on any mark (FR-013); a later issue covers a tone | as IQ-19 |
| IQ-21 | decided: (a). FR-034 stands; the stacked narrow layout → the wrapping chain, which follows its container | research.md R-16 (narrow layout); contracts/ocelle-evidence-chain.md § README mapping; tasks.md T062, T070; spec.md decisions; plan.md |
| IQ-22 | decided: (a). The arrow → the plain connector; a later issue covers an arrowhead | research.md R-16 (the connector's arrow); as IQ-21 |
| IQ-23 | decided: (a). FR-025 stands; the empty state → 013's `ocelle-empty-state`, placed by the consumer; the invalid-input state has no counterpart | research.md R-16 (empty state, invalid input); as IQ-21 |
| IQ-24 | decided: (a). No new parts: `list` → `list`; `stage` → the `ocelle-evidence-step` host and its `content` part; `connector` and `empty-state` → none | research.md R-16 (the four part rows); both chain contracts § README mapping; tasks.md T062, T070; spec.md decisions; plan.md |
| Q-T4 | already decided (a), 2026-11-20. The chip row is now the library's compact-step row of R-16's phase 3 table, mapping #517's pill-shaped chip to `variant="chip"` with `--ocelle-radius-2`; it stays in T062's and T070's lists | research.md R-16 (the compact step; the former stand-alone chip paragraph replaced by the table); contracts/ocelle-evidence-step.md § README mapping; tasks.md T062, T070 |
| T054 | the answers applied and the chain's rows written in R-16's phase 3 table, in this documentation commit; ticked | tasks.md T054 |

R-16's phase 3 table also holds the built-in rows the library's chain needs, one per behaviour state and story with
no question behind it: the wide layout, forced colours, light mode, two and six stages, long content, no static form,
and the approved example's card-and-grid composition. Each maps to behaviour the spec already requires (FR-013,
FR-024, FR-030 to FR-034, the pre-upgrade rules), so no test or requirement changes on their account beyond T062's
row-by-row assertion.

## Tasks changed

T054 (ticked), T062, T070, and a "Phase 3 inventory decisions in force" paragraph at the head of tasks.md. None
added, and nothing else ticked.

## Files changed

- `specs/019-data-records/research.md` (R-16)
- `specs/019-data-records/tasks.md`
- `specs/019-data-records/contracts/ocelle-evidence-chain.md`
- `specs/019-data-records/contracts/ocelle-evidence-step.md`
- `specs/019-data-records/spec.md` (decisions, FR-058)
- `specs/019-data-records/plan.md` (summary, § Decisions on the phase 3 inventory, § Phases US3 red)
- `specs/019-data-records/reviews/decisions-applied-phase-3.md` (this file)
