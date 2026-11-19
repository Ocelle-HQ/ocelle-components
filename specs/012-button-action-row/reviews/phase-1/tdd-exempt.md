# Phase 1: TDD exemption for the documentation part (T012)

Constitution VIII *Exemption*: a unit with no behaviour may skip the red step if its review states why no test could
fail for it.

- **Exempt: T011** (the records of the shard size). `gates/README.md`'s description of the split plant job (the
  approved sizes 80 and 1, the split count of 76 stories at size 1 for the operator's approval, size 1 the last lever,
  about 18 stories of headroom after this feature, about 11.2 Plants runner-hours per CI run at 58 stories against
  about 4 today) and the Complexity Tracking row "Plant roots hold every repository story" of
  `specs/006-storybook-workbench/plan.md`, updated with the same facts (research.md R-13, plan decision 15). Both are
  prose read by people; no code reads them, and no test of the repository reads `gates/README.md` or a plan. The
  behaviour they describe, `shardSize` 1, is tested, red first (T006).
- **Not exempt: T007 to T010.** Their tests are the phase's red commit (T001 to T006), recorded in `red-commits` and
  `red-phase.log`: the harness self-tests fail because the driver methods, the browser commands and the fixture's
  support (axe served, visits and tabs recorded) are missing, and the shard tests because `shardSize` is 3.
- **T012 and T013** are records (this file, `notes.md`) and the phase's checks.
