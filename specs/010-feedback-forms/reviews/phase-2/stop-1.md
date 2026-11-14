# Phase 2 stop 1: `drive.after` in process overshoots by `2W/3` or more under the full suite

tasks.md § Stop-and-ask, T002 spike outcomes: "`drive.after` in process overshoots its `ms` by `2W/3` or more at the
test `W`". The spike measured the overshoot with the spike file alone (largest 4.3 ms over 50 runs of `after(W / 3)`;
reviews/phase-1/spike.md § Timing). At the phase-end gates the in-process suites run beside every other project, and
the overshoot is far larger. **The phase stops here for the operator.** Nothing was changed to work around it: not the
test `D` of `test/in-process.ts`, not the gap bounds of the scenarios, not the projects' parallelism.

## What was measured (2026-11-14, this container, 4 CPUs, Chromium 153 build 1243)

| Run | In-process failures | Overshoot seen |
|---|---|---|
| `vitest run --project elements` of `notice.test.ts` and `plants.test.ts` together | 1: "baseline re-check ... US1-13 A, B, A" rejected on its gap | `after(33.3)` returned 100.8 ms: 67.5 ms, above `2W/3` = 66.7 ms |
| `vitest run --project elements` alone, three runs | 1, 1, 0: "minimum hold ... US1-13 10 ms after a write" resolved (the plant did not bite in that run); "US1-13 10 ms after a write" lost its first write | the C trigger came before the B write's timer fired, a margin of `W / 30` = 3.3 ms in process |
| `pnpm run gate:unit-tests` (every project) | 8 of 3455 tests: 5 notice cells (US1-8 template, US1-11 re-render, US1-15 status reveal, SC-002 none info and none warning) and 3 plant rows | truncated by the gate's report; see the next run |
| `vitest run` of every project | 6 of 3455: US1-15 revealed as alert to status, US1-17 first loaded hidden, SC-002 none info, and 3 plant rows | `after(100)` returned 227.1 ms and 207 ms: 127.1 ms and 107 ms |

Each plants file alone, and the fixture-page suite (`elements-browser`, Chromium's figures, `W` = 300 ms), pass in
every run (plants.md). The fixture pages measure against Chromium's real `D`, so a 100 ms overshoot is within their
bounds; in process, `W` is 100 ms and the cells' bounds are fractions of it.

## The question for the operator

The phase-end `gate:unit-tests` cannot be green reliably on this container with the in-process test `D` of 50 ms
(`W` = 100 ms). Options the implementer sees (none taken):

(a) raise the in-process timing constant (`test/in-process.ts`, `timing`, T002's choice; for example `D` = 100 ms,
`W` = 200 ms; T002 requires the test `D` to stay below Chromium's 150 ms), and re-measure the overshoot under the full
suite as T002 did;
(b) run the `elements` project's timing files one at a time (`fileParallelism: false` for that project in the root
`vitest.config.ts`, or a separate project for the notice and plants files), and re-measure;
(c) another decision.

Not done because of this stop: T019 to T022 and T020a stay open (their fixture-page suite is green and the in-process
suites pass alone, but the phase-end checks are not green), and T025's phase-end gates and the mutation run with its
shard timing (the in-process tests are the mutation run's tests, so a flaky cell would also make its dry run or its
mutants unreliable).

## Other phase-end checks run before the stop

At `2070cc8`: `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:csp`, `gate:prefix`,
`gate:contrast` (165 / 173 pairs, 154 required) and `gate:manifest` ("3 elements checked, no finding") green;
`gate:unit-tests` red on the timing failures above. `gate:plants` was started with `OCELLE_VISUAL_ENGINE=docker`
(podman is absent from this container; dockerd running) and stopped by the implementer's 30-minute time limit after
248 plant timings (all twelve manifest plants among them), before its verdict: no result is recorded for it, and it is
to be re-run with T025. `gate:mutation` (the plan and the `src/live.ts` shard timings) was not started.
