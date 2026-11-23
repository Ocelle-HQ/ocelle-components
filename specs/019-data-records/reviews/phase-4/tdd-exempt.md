# Phase 4: T076 to T078 are exempt from the red/green check

Phase 4 (Polish & Cross-Cutting Concerns) closes the mission's records. Three of its tasks are review records and gate
runs, with nothing a test could assert that is false at the phase's base (4106d7d) and true after it:

- **T076** and **T077** are review records (`coverage.md`): a check of the README mapping against R-16 and the state
  of the R-17 request, read from the repository.
- **T078** runs gates (`quickstart.md`, `plants.md`) on the mission as phases 1 to 3 left it.

Not exempt, written test first in review round 1's fix (`red-commits` `fix-1`, `round-1-fixes.md`):

- **T075** (R1-02, the operator's decision in `operator-round-1-decisions.md`): its CHANGELOG statements, the elements'
  and the styles' minor-change paragraphs and the data table entry's `wrap` (reflected) and `stickyHeader` as
  `sticky-header`, are asserted in `packages/elements/test/node/changelog.test.ts` and
  `packages/styles/test/readme.test.ts`. They were written before their tests, so they already pass at the red commit;
  the TDD check's run of the final tests against the base's CHANGELOGs is what shows them failing.
- **The data table's light-mode mapping row** that T076's gap G-1 adds (decision (b),
  `operator-coverage-decision.md`), asserted in `packages/elements/test/node/readme.test.ts`, red at the red commit.
