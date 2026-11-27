# Phase 1 notes (implementer)

## What the phase added

The four driver methods of contracts/checks.md § Test harness rows 1, 2, 7 and 8 (operator decision Q4 (a)), on the
`Driver` interface as merged (`test/scenarios/driver.ts`), each one self-contained page function shared by both
harnesses through the readers of `test/commands.ts` (the in-process project through new browser commands registered
in `vitest.config.ts`, the fixture driver on its page's main frame), as 011's document readers are:

| Row | Method | Page function | Browser command |
|---|---|---|---|
| 1 | `animationStates(id)`: 013's `Running` fields plus `identity` (a page-held `WeakMap` from each `Animation` to a number, `Symbol.for("ocelle.test.animationIdentity")`) and `iterations` (`"infinite"` for an infinite one) | `animationStatesOf` (`test/animations.ts`) | `animationStates` |
| 2 | `seek(id, inner, ms)`: pauses every animation of the target (the host when `inner` is null) at `ms`, then settles; rejects when there is none | `seekOf` (`test/animations.ts`) | `seek` |
| 7 | `settleLayout()`: `settle()`, then frames until two consecutive post-render reads of every element's border box (document and open shadow roots, an element with a running animation of its own and its subtree left out) agree with no update pending; rejects after 30 frames | `layoutSettle` (`test/layout-wait.ts`) | `settleLayout` |
| 8 | `overflows(target)`: the fractional measure of R-09 (a `Range` over the first slot's flattened assignment, or the target's own children, against its content box; the inline start when right-to-left) | `overflowOf` (`test/overflow.ts`) | `overflows` |

`settleLayout()` is stricter than research.md R-11's sketch ("`settle()`, then a second animation frame and every
element's `updateComplete` again"): it waits at least that, and then until the layout holds still, so a chain of
`ResizeObserver` deliveries is waited out. Existing methods and their callers are unchanged (013's `Running` and
`animations(id)`, 008's `ownAnimations`), so no existing body changed.

The self-tests (shared bodies in `test/scenarios/harness-status.ts`) run in process in
`test/harness/{animation,text,layout}.test.ts` and on the strict-CSP fixture in `test/browser/harness.test.ts`; the
stand-ins are plain custom elements with adopted sheets, so the fixture's recorders stay clean. Each was run 5 times in
process and 3 times on the fixture before the red commit without a flake. The `settleLayout` body was also run once
with the in-process method reduced to `settle()` alone (scratch, not committed): it failed with `settled: 70` against
130, so the wait is what the body proves.

`gates/test/vitest-config.test.ts` pins the in-process browser commands; it gained the four new ones in the red
commit (it failed there because the base `vitest.config.ts` registers none of them).

## Red record

`red.sh 1 phase` on `f2bf1d07`: `tests_only: true`, `red: true`, exit 1, 14 of 7776 tests failed
(`red-phase.log`):
- the 8 harness self-tests (4 in process, 4 on the fixture): `TypeError: driver.animationStates / overflows /
  settleLayout is not a function`, the missing behaviour;
- `gates/test/vitest-config.test.ts`: the command list without the four new commands;
- **5 tests of `gates/test/integration/visual.test.ts` that failed on the environment, not on this phase**: dockerd was
  not running in the container when `red.sh` ran (`code: 2`, the engine unavailable). dockerd was then started as root
  (`nohup dockerd > /tmp/dockerd.log 2>&1 &`) and `pnpm run setup:online` run, as the operator's rules say; with it the
  full suite passes (below). These 5 are not tests of this phase and do not change its red/green record.

## Checks run, 2026-11-19, Node 26.13.0 (`/opt/node26/bin` first on PATH), pnpm 12.16.1, `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, one at a time

- `gate:typecheck`: `typecheck: no type error in the files of tsconfig.json`.
- `gate:lint`: `lint: 452 files checked, no finding`.
- `gate:style-lint`: `style-lint: 41 files checked, no finding`.
- `gate:test-lint`: `test-lint: 333 files checked, no finding`.
- `gate:manifest`: `manifest: 20 elements checked, no finding`.
- `gate:csp`: `csp: 0 files checked, no finding`.
- `gate:prefix`: `prefix: 378 files checked, no finding`.
- `gate:pins`: `pins: 5 manifests checked, no finding`.
- `gate:config-copies`: the two story configuration copies are identical.
- `pnpm test` (= `gate:unit-tests`) on the working tree of the green commit, dockerd running: `unit-tests: 7776 tests
  passed in 236 files`, exit 0.
- `gate:mutation -- --base 4f44aa1d…`: `mutation: nothing to mutate: no package or gate source line changed since
  4f44aa1d74626db76a4baab534d1bd168dc2aae0`, exit 0 (the phase changes test code and `vitest.config.ts` only).
- `gate:signoff`: run on the commit range after the green commit (see the report).

## Plants (T010): not run, stop-and-ask

`OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected 4f44aa1d74626db76a4baab534d1bd168dc2aae0 --list`
on the green tree prints:

```text
note: affected: every plant, by vitest.config.ts (not mapped)
plants: affected since 4f44aa1d74626db76a4baab534d1bd168dc2aae0: 317 of 317 plants selected, none judged (--list)
```

`vitest.config.ts` is not mapped by op 016's selection (gates/README.md § A phase's plants: "anything unmapped,
selects the full set"), so the affected run of this phase is the full plant set. tasks.md says the full set is never
run locally (§ Plants per phase), and the operator's rules allow plants only in op 016's affected mode, one heavy job at
a time. T009 names `vitest.config.ts` (the in-process browser commands), and the commands are what keeps
`tdd-check.sh`'s "final tests against the base" failing (tdd-exempt.md, note), so the change cannot simply be dropped.
`plants.md` is therefore not written and T010 stays open; the question is in the implementer's report.
