# Phase 3 stop 1: mutation shards holding `src/form-control.ts` run over 7:00

tasks.md T041: "phase-end gates, with each planned shard that holds a `packages/elements/src/live.ts` or
`packages/elements/src/form-control.ts` entry run with `--files` and timed as T025 does, the times recorded in
`specs/010-feedback-forms/reviews/phase-3/`, and a shard over 7:00 (420 s) a stop for the operator (plan decision 11;
analysis U8)". Two of the first three such shards took longer than 420 s. **The phase stops here for the operator.**
Nothing was changed to work around it: not the shard plan (`gates/lib/mutation/shards.ts`), not the Stryker
configuration, not the elements project's tests or their timing, not CI's limit.

## What was measured (2026-11-15, this container, 4 CPUs, Chromium 153 build 1243, one job at a time)

`pnpm run gate:mutation -- --base 2004e82 --plan` plans 29 shards (28 cuts within files). `src/live.ts` has no changed
line in this phase, so the shards T041 names are those holding a `src/form-control.ts` entry: shards 2 to 20. Each was
run alone as `pnpm run gate:mutation -- --base 2004e82 --files <entries>` at `a9ec9da` and timed from the command's
start to its exit, as T025 did:

| Shard | Entries | Wall-clock | Result |
|---|---|---|---|
| 2 | `packages/elements/scripts/manifest.ts:136-166,packages/elements/src/form-control.ts:1-30` | **569.4 s (9:29.4)** | exit 1: 1 finding in 2 changed files (64 mutants on the changed lines; 0 timeouts, 34 compile errors, 0 zero-mutant entries); the finding, `form-control.ts:20`, is fixed in `a999b72` (mutation.md) |
| 3 | `packages/elements/src/form-control.ts:31-60` | **534.6 s (8:54.6)** | exit 0: 23 mutants on the changed lines of 1 file, none survived; 0 timeouts, 2 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 4 | `packages/elements/src/form-control.ts:61-90` | 216.9 s (3:36.9) | exit 0: no mutant on the changed lines (zero-mutant entry) |

Shards 5 to 20 were not run once the stop condition held: each costs from 3.5 to about 12.5 minutes (below), the
answer would not change, and the remaining phase-end gates needed the container.

**Where the time goes.** Shard 4, with no mutant on its lines, is the fixed cost: about 217 s (the gate's setup and the
elements project's in-process dry run under Stryker's per-test coverage). Shard 3 adds 22 valid mutants for about
318 s more, about 14 s a mutant: each mutant runs the in-process tests that cover it, in the browser, and for the
form control's template, styles and lifecycle that is most of the in-process input suites and the plant rows. Shard 2
also runs the default Stryker configuration (for `scripts/manifest.ts`), with its own dry run, which is why it is
slower than its 11 valid element mutants suggest. Phase 2's zero-mutant shards took 173 s (`reviews/phase-2/mutation.md`),
so this phase's suites (the input's in-process scenarios and twins, the rule file, 23 plant rows) added about 44 s to the
fixed cost.

**Estimate for the shards not run**, from the valid (not compile-error) mutants of each shard in the whole-diff report
of run 3 (`mutation.md`), at 217 s plus 14 s a mutant (shard 3's figures; it matches shard 3's own measurement, 525 s
estimated against 534.6 s measured). It is an estimate, not a measurement:

| Shard | Entries | Valid mutants | Estimate |
|---|---|---|---|
| 9 | `form-control.ts:211-240` | 14 | 413 s |
| 10 | `form-control.ts:241-270` | 9 | 343 s |
| 12 | `form-control.ts:301-330` | 2 | 245 s |
| 13 | `form-control.ts:331-360` | 15 | 427 s |
| 14 | `form-control.ts:361-390` | 31 | 651 s |
| 15 | `form-control.ts:391-420` | 15 | 427 s |
| 16 | `form-control.ts:421-450` | 12 | 385 s |
| 17 | `form-control.ts:451-480` | 18 | 469 s |
| 18 | `form-control.ts:481-510` | 38 | 749 s |
| 19 | `form-control.ts:511-540` | 29 | 623 s |
| 20 | `form-control.ts:541-545,src/index.ts,src/ocelle-form-input.ts:1-30` | 18 | 469 s |

Shards 5 to 8 and 11 hold no valid mutant (about 217 s each). By the estimate, eight of the 19 shards are over 420 s,
and shards 14, 18 and 19 are over 600 s, the CI job's `timeout-minutes: 10` (`.github/workflows/ci.yml`, job
`mutation-shard`), before CI's own setup is counted; shard 2 measured 569.4 s here. The `ocelle-form-input.ts` shards
21 to 28 are not T041's subject, but the same figures put shards 22, 25 and 26 at 525 to 595 s.

## The question for the operator

The phase-end `gate:mutation` exits 0 over the whole diff (run 3, `mutation.md`), but its CI shards that hold
`src/form-control.ts` are over T041's 7:00, and by the estimate some are over CI's 10-minute job limit. Options the
implementer sees (none taken):

(a) accept the longer shards for this phase: record the times and raise T041's 7:00 to a figure under CI's job limit
for the form-control shards, and measure shards 5 to 20 to confirm none is over that figure;
(b) cut the form-control's shards smaller (a gate change: the 30-line cut and 10-entry cap of
`gates/lib/mutation/shards.ts:43-45`, or a per-file cut), so each shard holds fewer mutants;
(c) shorten the elements project's dry run and per-mutant cost: for example run the in-process plant rows, whose cells
cost the most per covering test, in a project Stryker does not use, or reduce the scenarios a form-control mutant
covers;
(d) raise the mutation shard job's `timeout-minutes` in CI;
(e) another decision.

## What this stop leaves open

T041 stays open: its shard timing is the stop. Its other parts are done and recorded: the README, the CHANGELOG line,
the engine floor (`engine-floor.md`), the phase-end gates and the mutation run (`mutation.md`). T040 is done
(`plants.md`).

## The phase-end checks run before the stop (at `b76d4ee`, one job at a time)

| Gate | Result |
|---|---|
| `gate:unit-tests` | exit 0, "3771 tests passed in 157 files", 10:14 wall-clock |
| `gate:typecheck` | exit 0, "no type error in the files of tsconfig.json" |
| `gate:lint` | exit 0, "312 files checked, no finding" |
| `gate:style-lint` | exit 0, "16 files checked, no finding" |
| `gate:test-lint` | exit 0, "218 files checked, no finding" |
| `gate:csp` | exit 0, "14 files checked, no finding" |
| `gate:prefix` | exit 0, "262 files checked, no finding" |
| `gate:contrast` | exit 0, "165 pairs checked in light, 173 in dark (154 required per theme)" |
| `gate:manifest` | exit 0, "4 elements checked, no finding"; `pnpm --filter @ocelle/elements run manifest` regenerates `custom-elements.json` with no diff |
| `gate:plants` (`OCELLE_VISUAL_ENGINE=docker`) | exit 0, "301 plants of 17 gates and the registry judged, every plant as expected", 67:33 (`plants.md`) |
| `gate:mutation -- --base 2004e82` (whole diff) | exit 0, run 4: 496 mutants on the changed lines of 4 files, none survived; 2 timeouts (reviewed: kills), 110 compile errors, 1 zero-mutant entry; 5 equivalent records; 26:29 (`mutation.md`) |

An earlier `gate:unit-tests` run (at `8e5ba07`) failed one test, the storybook-build integration test's check that the
repository's `node_modules` is unchanged, because a node test run of mine wrote Vite's cache there at the same time;
alone it passed, and the run above, with nothing else running, is green.
