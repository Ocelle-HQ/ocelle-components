# Phase 1: TDD exemption for the records (T010)

Constitution VIII *Exemption*: a unit with no behaviour may skip the red step if its review states why no test could
fail for it.

- **Exempt: T001** (the recheck, `recheck.md`, with the operator's answers in `operator-decisions.md` and the design
  amendments in `design-amendments.md`). It reads facts on `main` as merged and records them with the commit they were
  read at; it changes no source, test, configuration or token, so there is no behaviour for a test to fail on. Its
  findings reach code only through the tasks they amended, each of which is tested red first in its own phase.
- **Exempt: T002** (the spikes, `spikes.md`). Measurements on scratch pages outside the repository, with stand-in
  elements written for the spike; nothing of them is committed but the record. The values the later phases pin from it
  (US1-4 (d), US1-8, the metric's find matches, the pill's baseline and icon-only box) are asserted by those phases'
  own red tests, written by hand from this record.
- **Not exempt: T003 to T009.** Their tests are the phase's red commit, recorded in `red-commits` and `red-phase.log`:
  the harness self-tests of contracts/checks.md § Test harness rows 1, 2, 7 and 8 fail because the driver methods
  `animationStates`, `seek`, `settleLayout` and `overflows` do not exist, and `gates/test/vitest-config.test.ts`
  because `vitest.config.ts` registers none of their browser commands. T005 and T006 were removed at the phase-1
  recheck (operator decision Q4 (a)) and write nothing.
- **T010** is this record, the gate runs and the plant record.

Note for the TDD check: the driver implementation (`test/animations.ts`, `test/layout-wait.ts`, `test/overflow.ts`,
`test/commands.ts`, `test/in-process.ts`, `test/browser/driver.ts`) lies under `packages/elements/test/`, which the
story configuration counts as test files, so `tdd-check.sh`'s "final tests against the base" overlays it on the base
too. There the in-process harness tests and the configuration test still fail, because the base `vitest.config.ts`
(not a test file) registers none of the four browser commands; the fixture twins, whose code is all test-side, may pass
on the base with the overlay (as 012's phase 1 recorded for its own harness).
