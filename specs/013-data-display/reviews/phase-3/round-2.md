---
phase: 3
round: 2
verdict: approved
base: 389b5d44afb3ecd84a1b191a9e0f356640fe837d
head: 33fc6a9a6db4fd9132703b1ec5f1757e0d85a0d9
tdd_check: pass
---

# Phase 3 review, round 2

Scope: `git diff 389b5d4..33fc6a9`. The only change since round 1 (4121cd0) is the fix commit 33fc6a9:

- the driver reader `events(id, during)`, its `ocelle-test-emitter` helper and its driver body;
- US3-2's `events: []`;
- the compact long-label body's `beside`;
- two Stryker record reasons, which are comments only;
- research.md R-06 and contracts/checks.md § Driver additions;
- the fix note.

The only uncommitted changes are the TDD-check outputs I regenerated, which are committed with this file.

The binding operator decisions are the same as in round 1:

- I3;
- `operator-spike-decisions.md` (US3-3 option (a));
- the decision blocks of spec.md and plan.md.

I judged `round-1-fixes.md` against the artifacts and re-ran each plant it claims myself.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | packages/elements/test/in-process.ts:288-307; packages/elements/test/browser/driver.ts:354-386 | **The reader's oracle and its scope.** `events` wraps `EventTarget.prototype.dispatchEvent`, so it sees every event script dispatches on the bar, its shadow root or a node in it. It does not see events the UA dispatches, a dispatch through a native reference cached before the wrap, or a dispatch on `document`/`window`. For "No event is emitted (the element has no user intent to report)" (spec.md:379-381) this is an adequate oracle. A component event in this library is a script `dispatchEvent` on the host (Principle: `ocelle-` names and events). The element calls no UA method that fires events (`click()`, `focus()`, form methods), and neither the element nor Lit caches `dispatchEvent`. The UA events a value change could cause are transitions or animations on the fill, and those are covered separately in the same body by `animations: []`. The window is wide enough. `during` is `setProperty`, which settles on `updateComplete` and then waits one frame (in-process.ts:37-41, browser/driver.ts:20-27). That frame also covers the frame callback the change schedules (`#leave()`'s rAF, R1-08). I planted a dispatch deferred to `requestAnimationFrame` in `updated()`, and US3-2 failed in both harnesses (2 failed, 69 passed). A dispatch two or more frames later would be missed. No path in the source does that. | None. |
| R2-02 | note | packages/elements/test/scenarios/driver-additions.ts:385-398 | The `events` driver body does not show that the native `dispatchEvent` is restored after `during`. A reader that left its wrapper in place would still pass, because each later call wraps the leaked wrapper and still records correctly. Both implementations do restore it: in-process with `finally`, the fixture in `stop()`, including on a throw. A leak would only chain wrappers, and no assertion reads them. | Optional: after the three recordings, add `EventTarget.prototype.dispatchEvent === <the native reference taken at mount>` to the body. |

There are no blocking findings.

## Test quality

- **TDD check.** `tdd-check.json` was older than HEAD (head 24285b5), so I re-ran `tdd-check.sh 3` on 33fc6a9: `pass`, no problems.
  - The red record `phase` (e7c38e3) exits 1.
  - The final tests exit 2 on the base ("no test file", as for every phase base) and 1 on the scaffold (227 of 3792 failed).
  - HEAD exits 0 (3792 passed).
  - On the scaffold, US3-2 and the compact long-label body fail in both harnesses. The new `events` driver body passes there, which is expected: it tests the harness, like the `property` body in round 1.
- **No red commit for the fix.** There is no `fix-1` entry in `red-commits`, and that is correct. R1-01 and R1-05 add missing assertions to behaviour the source already has (no event; `nowrap`), so a red against green code is impossible. Round 1 said so for R1-01. The bites stand in for the red, and I re-ran each claimed plant in a scratch worktree outside the repository. Each held exactly as claimed:
  - a synchronous `ocelle-progress-change` dispatch after the fill's `setProperty` in `updated()` makes US3-2 fail in both harnesses, with `"events": ["ocelle-progress-change"]` received (2 failed, 69 passed);
  - the reader planted to record only the host (`this === target`) makes the `events` body fail in both harnesses (2 failed, 34 passed, driver files);
  - the reader planted to record every dispatch on the page makes the `events` body fail in both harnesses (2 failed, 34 passed);
  - `flex-wrap: wrap` in `:host([size="compact"]) .row` makes the compact long-label body fail in both harnesses on `"beside": false` (2 failed, 69 passed).

  There was one more plant of my own: the rAF-deferred dispatch of R2-01 makes US3-2 fail in both harnesses. The worktree was removed after the runs.
- **Weakening.** The fix commit only adds to existing tests:
  - in progress.ts, US3-2 gets `events` and the long-label body gets `beside`, and both names are extended to say so;
  - the driver interface, both implementations and the driver body are added.

  Nothing was deleted, loosened or skipped.
- **Vacuity.** `events: []` is paired in the same observation with the positive reads (9 exposed, 75 % fill). The driver body shows the reader lists a host CustomEvent and a shadow-node event in order, ignores another element's events, and gives `[]` for a quiet change. `beside` is paired with `track`, `wraps` and `scrollWidth`. test-lint passes.
- **Mutation.** `pnpm run gate:mutation -- --base 389b5d4` reports 247 mutants on the changed lines of 3 files, none survived. There are 0 timeouts, 79 compile errors and 1 zero-mutant entry (index.ts), and 5 equivalent records. These are the same counts as in round 1. The two reworded records (:282, :304) still match their mutants. Their new reasons are now accurate (see Earlier findings), and the other three are unchanged from round 1.

## Checks run

On HEAD 33fc6a9, with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and `OCELLE_VISUAL_ENGINE=docker`. I ran what the diff calls for. The source change is comments only. The test change is the driver and two bodies, and the docs are research.md and checks.md.

| Gate | Result |
|------|--------|
| `pnpm test` (the HEAD run of tdd-check, clean worktree) | 3792 tests passed in 152 files |
| `gate:typecheck` | no type error |
| `gate:lint` | 296 files, no finding |
| `gate:test-lint` | 202 files, no finding |
| `gate:prefix` | 243 files, no finding (no build output present) |
| `gate:manifest` | 6 elements, no finding |
| `gate:signoff -- --range 389b5d4..HEAD` | 17 commits, no finding |
| `gate:mutation -- --base 389b5d4` | as above |
| `tdd-check.sh 3` | pass |

I did not re-run the visual, axe, CSP, storybook-build, contrast, style-lint or plant gates. The fix changes no CSS, story, token, baseline or plant, and round 1 ran them on e36862f with every result passing.

## Earlier findings

- **R1-01 (blocking): resolved.**
  - US3-2 (packages/elements/test/scenarios/progress.ts:169-181) records the events dispatched on the bar, its shadow root and its shadow nodes while `value` goes from 7 to 9, and asserts `events: []` in the same observation as the 9 / 75 % read. The shared scenario runs in both harnesses.
  - The reader has its own driver body in both harnesses (driver-additions.ts:385-398), and the helper `ocelle-test-emitter` is defined at driver-additions.ts:151-166.
  - The bites hold (Test quality), and the oracle is adequate for the clause (R2-01).
  - No red commit was required, as round 1 stated.
- R1-02 (note): no change, as required.
- **R1-03 (note): fixed.** The record at ocelle-progress.ts:304 now gives the reason "equivalent in effect, with a one-frame shift", which matches the interleaving I observed in round 1.
- **R1-04 (note): fixed.** The record at ocelle-progress.ts:281 names `setConnected(false)` on the child part and the template's lack of directives.
- **R1-05 (note): fixed.**
  - research.md:923-929 now says `nowrap`, with the reason.
  - The long-label body reads `beside` (progress.ts:602, :608), and a revert to `wrap` fails it in both harnesses.
- R1-06 and R1-08 (notes): no change, as required.
- **R1-07 (note): fixed.** contracts/checks.md:422-427 lists `changeAttributes`, `textOf`, `rendered`, `property`, `events` and the widened `animations`/`setProperty`. Each row matches its implementation and driver body.
