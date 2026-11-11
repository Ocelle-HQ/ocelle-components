# Phase 4, review round 1: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed: `emulate(page, "none")` now also sets `colorScheme: "light"`, the scheme the fixture contexts start in (`browser/serve.ts`), so ending forced colours after US3-8's dark palette no longer leaves later in-process files in the dark scheme. `active` with a palette sets that palette as before; `active` without one leaves the scheme untouched as before. notes.md's "US3-4's colours" bullet is corrected: the dark ink token in process was this leak, not a harness difference. | `commands.test.ts` › `emulateForcedColors(mode, palette)` › `"none" after a dark palette leaves the page in the light colour scheme…` (red commit `09741a7`, `red-fix-1.log`: it failed with `dark: true, light: false`; in that full run the leak also failed `icon.test.ts` US1-4) | `packages/elements/test/commands.ts` (`emulate`), `packages/elements/test/commands.test.ts`, `reviews/phase-4/notes.md` |
| R1-02 | noted, no change (none required) | — | — |
| R1-03 | noted, no change: `color: inherit` on `::slotted(*)` is kept as documentation of intent | — | — |
| R1-04 | noted, no change (none required) | — | — |
| R1-05 | noted, no change (none required) | — | — |

## Checks after the fix

Node 22, `OCELLE_CHROMIUM_PATH` set; `PLAYWRIGHT_BROWSERS_PATH` aliased for Stryker; one heavy job at a time.

| Check | Result |
|---|---|
| order check: `vitest.mutation.elements.config.ts --no-file-parallelism --sequence.shuffle.files` over `slot`, `icon`, `commands` tests, seeds 1 to 5 (seed 3 put `slot.test.ts` first and failed before) | 60 of 60 pass for every seed |
| `gate:typecheck`, `gate:lint` (214 files), `gate:test-lint` (145 files), `gate:prefix` (191 files) | exit 0 |
| `pnpm test` | exit 0, 2433 tests in 115 files |
| `gate:mutation -- --base aea13f4` | exit 0 in 3 of 3 runs: 150 mutants on the changed lines of 2 files, none survived, 0 equivalent records |
