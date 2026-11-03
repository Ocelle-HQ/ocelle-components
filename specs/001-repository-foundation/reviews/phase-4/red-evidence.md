# Phase 4 red evidence (T063, constitution VIII)

Red commit: `19c872e` (`test(001-repository-foundation): phase 4 red — US3`), against the scaffold `0dca686`, phase
base `4df12b0`. `red.sh 4 phase` recorded it in `red-commits`; its run output is `red-phase.log` in this directory
(395 of 588 tests failed, every failure an assertion).

## T062 (`gates/test/integration/gates-root.test.ts`)

- `lint` and `style-lint`: both cases of each gate fail at the red commit on their existence assertion
  (`expect(configsExist(configs)).toEqual(allExist(configs))`, `red-phase.log` lines for
  `gates-root.test.ts:97` and `:107`): `eslint.config.ts` and `stylelint.config.ts` do not exist yet. The green
  commit creates them (T065, T066). They are part of the phase's missing behaviour (research.md R-05, R-07: the code
  lint and the style lint are these configurations together with their gate entries), not a setup error; the red
  output is kept here with the review.
- `typecheck`, `csp`, `prefix`, `pins` and `signoff`: these cases copy no file the green commit creates (their
  configuration files exist since phase 1, or they copy none) and fail on the gate's missing exit code: the
  scaffold's entries return exit 0 with no output, so `expected { code: +0, stdout: [], stderr: [] } to deeply
  equal { code: 1, ... }` (and the exit 0 cases on their missing summary line) (analysis 3).

## T092 (`gates/test/integration/test-lint.test.ts`)

The `.stryker-tmp/` case fails at the red commit on its assertion: `gates/bin/test-lint.ts --root <tmp>` exits 2
naming the unparsable sandbox file instead of exiting 0 with `test-lint: 1 file checked, no finding`. The green half
(the `.stryker-tmp/**` ignore in `eslint.test.config.ts`) is in the phase's green work, commit `b7950de`.
