# Phase 4 is exempt from the red/green check (T075 to T078)

Phase 4 (Polish & Cross-Cutting Concerns) closes the mission's records; tasks.md marks every one of its tasks exempt
(documentation and gate runs). It changes no source, no test, no style, no story, no baseline and no configuration:

- **T075** adds the final surface lists to `packages/elements/CHANGELOG.md` and `packages/styles/CHANGELOG.md`: a
  summary paragraph under each Unreleased heading (the five elements, their properties, the `time` slot, the parts,
  the entry points, `base.css`'s four blocks, the base-style hook, the `data-ocelle-align` hook, no token added) and,
  in the data table's entry, the property name `stickyHeader` and `wrap`'s reflection, as the manifest has them. The
  surface itself was added and tested in phases 1 to 3 (their CHANGELOG statements in
  `packages/elements/test/node/readme.test.ts` and `packages/styles/test/readme.test.ts`, which pass unchanged after
  this edit); the lists add no surface, so no test can fail before them and pass after.
- **T076** and **T077** are review records (`coverage.md`): a check of the README mapping against R-16 and the state
  of the R-17 request, read from the repository.
- **T078** runs gates (`quickstart.md`, `plants.md`) on the mission as phases 1 to 3 left it.

There is nothing a test could assert that is false at the phase's base (4106d7d) and true after it, so no red commit
is made. Should the operator's answer to G-1 (`coverage.md`) add a README row, that row is behaviour of the README and
is written test first in a fix round, outside this exemption.
