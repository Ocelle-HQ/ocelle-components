# Phase 3: stop-and-ask after lever 2 (T028)

Recorded by the implementer on 2026-11-11, as tasks.md's stop-and-ask points require. This is a question for the
operator, not a verdict.

## The point reached

tasks.md: "after lever 2 (T028), any `source.ts` entry still misses 176 s or keeps a Timeout (lever 3, FR-014: an
amendment of 001 FR-013 is the operator's decision)".

With lever 1 (`vitest.mutation.config.ts`, commit `3986b74`) every `source.ts` entry has 0 Timeout, 0 Survived and
0 NoCoverage, and all 122 former Timeouts meet FR-011 (57 Killed by the named `source-table.test.ts` tests, 65 group A
CompileError as in the red run). The FR-013 reference entries keep every status and are not slower. But three entries
miss 176 s with the checker on as configured (`evidence/README.md` § Green table):

| Entry | Red | Lever 1 (concurrency 8) | Checker off (diagnostic) |
|---|---|---|---|
| `source.ts:1-60` | 227.08 s | 188.37 s | 72.24 s |
| `source.ts:61-120` | 285.43 s | 251.13 s | 94.81 s |
| `source.ts:121-180` | 537.27 s | 283.22 s | 76.87 s |
| `source.ts:181-230` | 259.26 s | 170.54 s (within) | - |

Lever 2 on the slowest entry, `source.ts:121-180` (§ Lever 2): concurrency 4 → 358.77 s, 8 → 283.22 s, 12 → 316.27 s
(checker off 66.23 s, 76.87 s, 76.13 s). No value brings it within 176 s; `concurrency` stays 8.

## The question

Lever 3 (spec FR-014): which amendment of 001 FR-013 (and SC-005), if any, does the operator decide, for example a
bound on mutants per entry? Until then T028 (its outcome), T030 and T031 stay open.

## Also for the operator

- The `taskset -c 0,1` (two-core) runs of T028 were not taken: they only rank candidates for a 2-vCPU CI runner, and
  with no candidate within 176 s on four cores none could be kept; each would also risk the 10-minute stop point.
  Say if they are wanted anyway.
- `gates/test/vitest-config.test.ts` (not named by tasks.md) held the same deep-equal as the integration test T019
  replaced, and failed Stryker's dry run once lever 1 was in (first green run, exit 2). It was updated to the split in
  commit `9f56827` (reason in the commit body); it fails against the phase base's configuration and passes now.
- Today's order under Stryker's options was not the project-name order research R-05 describes: the red run of the
  T019 order test started `gates/test/plants.test.ts` (project `gates`) first, then `packages/elements/test/sample.test.ts`
  (`elements (chromium)`). Either way the token tests did not start first, which is what the red test asserts.
