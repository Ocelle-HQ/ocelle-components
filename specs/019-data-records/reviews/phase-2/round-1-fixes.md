# Phase 2, review round 1: fixes

Review: `round-1.md` (changes_requested, 86f467b). No finding is a behaviour defect, so this round has no red commit,
no `red.sh` run and no new `red-commits` entry. No source behaviour changes: the only source edits are two
`Stryker disable` comment reasons (R1-07).

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed | none: documentation (a check box), as the review says | `tasks.md` T028 ticked. Its answers are recorded in `reviews/phase-2-inventory-decisions.md` and applied in the documentation commit named by `reviews/decisions-applied-phase-2.md`; the timeline's rows are in research.md R-16 (§ "Phase 2: the event timeline's rows") |
| R1-02 | fixed | none: documentation | `contracts/ocelle-timeline-event.md` (module paragraph: the event imports only `hasSlottedTime` and applies `hasTime`'s rule to its `time` property, because Lit reflects after `render()`); `contracts/ocelle-event-timeline.md` (the `has-time` bullet: the timeline's `hasTime(event)` is the rule the event applies to its property, and both agree once `time` is reflected) |
| R1-03 | fixed | none: documentation | `spec.md` US2-4: the identifier stays inside the event at 320 px (it fits on one line there) and wraps in a column narrower than it (200 px), as the body asserts |
| R1-04 | deferred: note with no change required | none (note) | none |
| R1-05 | deferred: note with no change required | none (note) | none |
| R1-06 | deferred: note with no change required | none (note) | none |
| R1-07 | fixed | none: a comment and a record, no behaviour | the `super.disconnectedCallback()` reason in `packages/elements/src/ocelle-event-timeline.ts` and `packages/elements/src/ocelle-timeline-event.ts` now also names `LitElement`'s `__childPart?.setConnected(false)`, which reaches only async directives, and that neither element uses one; `reviews/phase-2/mutation.md` § "Recorded as equivalent" completed the same way (the run outputs are left as they were run) |
| R1-08 | deferred: note with no change required | none (note) | none |
| R1-09 | deferred: note with no change required | none (note) | none |
| R1-10 | deferred: note with no change required | none (note) | none |

## Checks

Under the operator's CI-first rule, only the fast gates the change touches were run locally:

| Check | Result |
|---|---|
| `gate:test-lint` | exit 0, `test-lint: 330 files checked, no finding` |
| `gate:lint` | exit 0, `lint: 449 files checked, no finding` |
| `gate:typecheck` | exit 0, `typecheck: no type error in the files of tsconfig.json` |

`plants.md` is not replaced. The only source change is two comment texts on lines no plant edits, and the selection for
this phase is every plant (`packages/elements/package.json`, not mapped; R1-04), so the 315-plant run is left to CI's
Plants check, as for the round reviewed. The mutation run is not repeated: the changed text is the reason of two
records that already stand, and CI's mutation check reads it.

The same incomplete reason stands in `packages/elements/src/ocelle-facts.ts:221`, which is outside this phase's diff;
it is left unchanged.
