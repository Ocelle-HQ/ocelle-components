---
phase: 4
round: 2
verdict: approved
base: aea13f48a7840be93e737c493f2ea8763cf1dd69
head: 370df1c1cc44d9b21f1ecead4f3dbddef7ec3086
tdd_check: pass
---

# Phase 4 review, round 2

User Story 3, the slot convention for icons in controls (T041 to T049). Since round 1 (`9082aec`), the change is
limited to the test harness and the phase's evidence:
- red commit `09741a7` adds one test to `commands.test.ts`;
- fix commit `2506f50` changes `emulate` in `packages/elements/test/commands.ts` and corrects `notes.md`;
- `370df1c` holds the red/green check outputs.

No source, story or task file changed after round 1. The round 1 blocking finding is resolved, and every check passes.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|

No findings. The round 1 notes (R1-02 to R1-05) stand as recorded and need no change.

## Test quality

- **Red evidence for the fix.** `red-commits` has `fix-1 09741a7`. `red-fix-1.log` and `check-red-fix-1.log` show the
  new test (`commands.test.ts:87`) failed with an `AssertionError`: after `active`/`dark` then `none`, the page was
  still dark. In that same run `icon.test.ts` US1-4 failed too. That is the leak of R1-01 caught a second time, now
  caused by the new test running before `icon.test.ts`. It failed because the behaviour was missing, not because of a
  setup error.
- **The new test.** `commands.test.ts:87-97` checks a full observation object with `toEqual`:
  - `during: true` proves the dark palette was applied, so the test cannot pass vacuously;
  - after `none`: `forced: false`, `dark: false`, `light: true`.

  There is no condition, skip or mock.
- **No weakening.** `git diff 09741a7..HEAD -- '*test*'` changes only `commands.ts` (the fix itself, under
  `test/`). No test was edited, removed or loosened. The phase's earlier test history was checked in round 1, and it
  has not changed since.
- **The fix.** `commands.ts:141-144`: `mode === "none"` now always sets `colorScheme: "light"`, which matches the
  fixture contexts (`browser/serve.ts:127`). `active` with a palette sets that palette as before. `active` without
  one leaves the scheme alone. No caller depended on the scheme surviving `none`:
  - in-process callers reach `emulate` through `emulateForcedColors` (`in-process.ts:162`, the `afterEach` hooks of
    `icon`, `icon-set`, `slot` and `commands` tests);
  - `browser/driver.ts:183` is per fixture page;
  - `packages/styles` tests set `colorScheme` themselves (`pages.ts:46`).
- **Tasks.** T041 to T049 are all ticked, and their work is present (checked in round 1, unchanged since).
- **Mutation.** `gate:mutation -- --base aea13f4` exited 0 in 2 of 2 runs. Each run reported 150 mutants on the
  changed lines of 2 files, none survived, and 0 equivalent records. In round 1 it failed 4 of 5 runs on R1-01.

## Checks run

Node 22.23.4, `OCELLE_CHROMIUM_PATH` set; `PLAYWRIGHT_BROWSERS_PATH` set for Stryker; one heavy job at a time.

| Check | Result |
|---|---|
| order check: `vitest.mutation.elements.config.ts --no-file-parallelism --sequence.shuffle.files`, seeds 1 to 5, over `slot`, `icon`, `commands` tests (seed 3 failed US1-4 in round 1) | 60 of 60 pass for every seed |
| `gate:typecheck` | exit 0 |
| `gate:lint` | exit 0, 214 files |
| `gate:test-lint` | exit 0, 145 files |
| `gate:style-lint` | exit 0, 10 files |
| `gate:prefix` | exit 0, 191 files |
| `gate:pins`, `gate:config-copies`, `gate:manifest`, `gate:contrast`, `gate:brand-rules` | exit 0 |
| `gate:signoff -- --range aea13f4..HEAD` | exit 0, 16 commits |
| `pnpm -r build`, then `gate:csp` | exit 0, 31 files |
| `pnpm test` | exit 0, 2433 tests in 115 files |
| `gate:mutation -- --base aea13f4` | exit 0 in 2 of 2 runs: 150 mutants, none survived, 0 equivalent records |
| `tdd-check.json` | `pass`, head `2506f50`, red `phase` and `fix-1` both exit 1, final tests exit 2 on base and exit 1 on the scaffold, no problems |

`gate:plants` was not rerun because no plant, lint rule or element source changed since the implementer's run
(`plants.md`).

## Earlier findings

- **R1-01 (blocking): resolved.**
  - Fix: `emulate(page, "none")` now resets `colorScheme` to `"light"` (`packages/elements/test/commands.ts:141-144`).
  - Red test: `fix-1` (`09741a7`), failing for the right reason.
  - Order check: seed 3, which put `slot.test.ts` first and failed US1-4 in round 1, now passes, as do seeds 1, 2, 4
    and 5.
  - Gate: `gate:mutation -- --base aea13f4` passes in every run.
  - Notes: `notes.md` "US3-4's colours" now credits the leak, not a harness difference.

  The optional suggestion to bring the ink tokens back into US3-4 was not taken. That is acceptable, since the
  scenario is about inheriting the control's colour.
- R1-02 to R1-05 were notes. They were acknowledged in the fix note with no change, which none of them required.
