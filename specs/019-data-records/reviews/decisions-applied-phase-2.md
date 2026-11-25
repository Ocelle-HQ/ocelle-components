# Decisions applied before phase 2 (2026-11-20)

- **Decisions:** Q-T1 to Q-T5 (`reviews/issue-texts-check.md` § Operator decisions) and IQ-8 to IQ-17, IQ-26 and IQ-28
  (`reviews/phase-2-inventory-decisions.md`), all made by the operator on 2026-11-20.
- **Base:** f108182. Design artifacts only; no source or test file changes.
- **Counts:** unchanged. The mission keeps 44 stories and 88 baselines (phase 2: 11 and 22; phase 3: 12 and 24). No
  task is added, removed or renumbered.
- **Still open:** IQ-18 to IQ-24 and IQ-27 (phase 3, T054).

## Placement of the data table's notes (Q-T1 to Q-T3)

Phase 1 is approved and folded, so its tasks are not reopened. Phase 4 runs no red commit: every one of its tasks is
exempt documentation or a gate run, so a test-first README task there would need a red and green pair that phase 4
does not have. Phase 2's README tasks write to the same two files (`packages/elements/test/node/readme.test.ts` and
`packages/elements/README.md`) in a phase that has a red commit, so the three notes go there: T037 asserts them and
T047 writes them. That is why phase 2, not phase 4, carries them.

## Changes

| ID | Resolution | Where |
|---|---|---|
| Q-T1 | decided: (a). R-16's header-cells and body-cells rows map the prototype's mono cells and headers to the sans face with tabular figures; asserted in phase 2's red, written in its green | research.md R-16; tasks.md T037, T047, decisions paragraph; spec.md decisions, FR-058; plan.md summary, § Decisions on the issue texts and the phase 2 inventory, § Phases (US2 red) |
| Q-T2 | decided: (a). The header-cells row maps the prototype's 0.06em tracking to `--ocelle-tracking-eyebrow`; recheck Q1 (a) stands | as Q-T1 |
| Q-T3 | decided: (a). The header-cells row maps the prototype's header padding to the cells' padding | as Q-T1 |
| Q-T4 | decided: (a). The chain's compact-step row maps the pill-shaped chip to `variant="chip"` with `--ocelle-radius-2`, with phase 3's README tasks | research.md R-16 (phase 3 note); tasks.md T062, T070; spec.md decisions, FR-058; plan.md § Phases (US3 red) |
| Q-T5 | decided: (b). US3-3 also holds in a 200 px container; one more body in T055 (phase 3's red), and the spike measures line ends at 200 px too; FR-053's 320 px reflow test is unchanged; no story or baseline added | spec.md US3-3, FR-034, decisions; tasks.md T052, T055; plan.md § Phases (US3 spike and red); research.md R-12 |
| IQ-8, IQ-26 | decided: (a). Compact form → the default timeline, more density by the consumer's `::part` rules | research.md R-16 phase 2 table; contracts/ocelle-event-timeline.md § README mapping; tasks.md T037, T047 |
| IQ-9, IQ-26 | decided: (a). Narrow form and measure cap → the container, `max-inline-size` on the host as the remedy | as IQ-8 |
| IQ-10 | decided: (a). Summary and supporting content → the consumer's markup in the content | research.md R-16; contracts/ocelle-timeline-event.md § README mapping; tasks.md T037 |
| IQ-11 | decided: (a). Actor and further facts → the consumer's markup in the content | as IQ-10 |
| IQ-12 | decided: (a). Time position → the time above the content (Q-C), item text time first | as IQ-10 |
| IQ-13 | decided: (a). Trailing verification label → the consumer's text in the content | as IQ-10 |
| IQ-14 | decided: (a). Leading marker → the default dot | as IQ-10 |
| IQ-15 | decided: (a). Linked event → a link in the content, and one README statement, written test first, that an `id` on `ocelle-timeline-event` is the consumer's fragment target | research.md R-16; contracts/ocelle-timeline-event.md § README mapping; tasks.md T037, T047 |
| IQ-16 | decided: (a). Degraded → a rule in the consumer's own stylesheet (no inline style) plus the state in text | research.md R-16; contracts/ocelle-event-timeline.md § README mapping; tasks.md T037 |
| IQ-17 | decided: (a). Unavailable retention → 013's `ocelle-empty-state` in place of the timeline | as IQ-16 |
| IQ-28 | decided: (a). No row changes; kitty-mission-ui replaces the families | research.md R-16; spec.md decisions |
| T028 | the answers applied and the timeline's rows written in R-16, in this documentation commit; IQ-27 moves to phase 3's questions (T054 already lists it) | tasks.md T028 |

## Tasks changed

T028, T037, T047, T052, T055, T062, T070, and the decisions-in-force paragraph at the head of tasks.md. None added.
