---
phase: 1
round: 1
verdict: changes_requested
base: 767c09779ea8e58c52d6f8f1182b2015ae74b821
head: 285b235b72e45643b7f33db0c92eeab60fe0b7e3
tdd_check: fail
---

# Phase 1 review, round 1

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | specs/011-layout-headers/reviews/phase-1/tdd-check.json:1, check-head.log:44-49 | The red/green check reports `fail` with one problem, "tests fail at HEAD". The 5 failing tests are all in `gates/test/integration/visual.test.ts` (lines 115, 126, 239, 251, 271), which need a container engine. This container has none (`node gates/bin/visual.ts` prints "could not run: no container engine (docker or podman) is available"), and the file says these tests "fail with the gate's exit 2, never skip" (visual.test.ts:21-24). The phase changed nothing under `gates/`, `storybook/` or `package.json` (`git diff 767c097..HEAD --stat` on those paths is empty). The same 5 failures show up in the red run and the scaffold run. My own `pnpm test` at HEAD gives the same result: 5 of 3130 failed, all of them these 5. Nothing in the phase's code is wrong, but the procedure counts a `fail` problem as blocking and the checkpoint in tasks.md requires `tdd-check.sh 1` to report `pass`. | Run `.specify/extensions/story/scripts/tdd-check.sh 1` again where a docker daemon or podman is available (for example the CI runner) and commit the new `tdd-check.json` and logs. If that is not possible, the operator decides whether to accept the phase with this environmental failure on record. No code change is asked for. |
| R1-02 | note | packages/elements/src/slot-state.ts:19, 22-33 | R-03 and T005 say "one Lit `state` field per slot" and "the first read runs in `firstUpdated`". The code keeps a private `Map` and calls `host.requestUpdate()` only when a state changes. The first read comes from the first `slotchange`, and every slot counts as empty until then (`empty()` returns `?? true`). What you can observe is what R-03 asks for: the state is not a property, not an attribute and not in the manifest, the host is re-rendered on a change and not without one (slot-state.test.ts:173), and the first-render tests pass (slot-state.test.ts:215, 223). | None needed. You could align the wording of R-03 and T005 with the controller, or the other way round, the next time those files are edited. |
| R1-03 | note | packages/elements/src/slot-state.ts:46-54 | There is no `hostDisconnected`, so a host removed from the page keeps its `slotchange` listener and its `MutationObserver`. Registering again is idempotent, and the moved-host test (slot-state.test.ts:194) passes. It is harmless today, and the file header states the design. | None needed. |
| R1-04 | note | gates/lib/vitest-report.ts:108 (outside this phase) | In the red and scaffold logs the four new command tests fail as `Error: empty`. I re-ran `commands.test.ts -t scrollWidth` at the red commit `c983351` in a scratch worktree: Vitest's own message there is `Error: scrollWidth: not implemented`, the scaffold's rejection, so the tests failed for the right reason. The gate's one-line summary loses that message, which makes the red evidence harder to read. | None for this phase. Worth an op on the reporter. |

## Test quality

- **Red evidence.** `red-commits` holds one entry, `phase c983351`. That commit changes only `packages/elements/test/commands.test.ts`, `test/commands.ts` and `test/slot-state.test.ts`, and all three match `test_pathspec`. It sits on top of the scaffold `cab41f9`. `red-phase.log` and `check-red-phase.log` agree: all 12 `slot-state.test.ts` tests and the 6 new `commands.test.ts` tests fail on assertions. The slot-state tests fail on wrong wrapper states. The two `axTree` level tests fail because `level` is missing. The four reader tests fail on the scaffold's "not implemented" rejection, which I confirmed directly (R1-04). None of these is a syntax, import or setup error.
- **Against base and scaffold.** On base the final tests exit 2 because `src/slot-state.ts` does not exist yet. That is expected, and the scaffold run is the real evidence: there the final tests exit 1 with the same 18 behavioural failures.
- **Scaffold.** `cab41f9` adds `src/slot-state.ts` with its signatures only (`empty()` returns `false`, nothing wired) and three command stubs in `vitest.config.ts` that reject. It adds no test file and no behaviour.
- **Tests weakened after red.** None. `git diff c983351..HEAD -- packages/elements/test/commands.test.ts packages/elements/test/slot-state.test.ts` is empty. After the red commit only the T006 readers and the T007 plumbing changed, in non-`.test.ts` files.
- **Vacuous assertions.** None found. Every test ends in one `toEqual` on a recorded object of observed states: wrapper classes, box heights, update counts, `slotchange` counts, accessibility nodes, scroll widths, the deep active element, text boxes and their clippers. There is no `skip` or `only`, no assertion inside a conditional, no snapshot and no mock. In commands.test.ts:170 the `if (shadow !== undefined)` guards setup, not an assertion. `gate:test-lint` passes.
- **Coverage of T003 and T004.** Every item listed in T003 has a test: no node, empty or whitespace-only text, an element (also `hidden`), non-whitespace text, append and remove, the `slot` attribute, text data with no `slotchange`, and the first render. So does every item of T004: heading `level`, scroll width 400 to 320, the deep active element, and text boxes with clipping. The extra cases (separate state per host, a moved host, no update for a change that keeps the state) make the tests stricter. Phase 1 has no user story, event or keyboard path.
- **Exemption (`tdd-exempt.md`).** T001 and T002 are records. T007 forwards calls to the DOM, Playwright or Vitest, plus five fixture pages identical to `icon.html` except for the title. I agree that no test could fail for these on their own. The behaviour T007 forwards to (the T006 readers) is covered by T004.
- **Mutation.** `pnpm run gate:mutation -- --base 767c097…` gives 35 mutants on the changed lines of `slot-state.ts` and none survived. It reports 5 compile errors (lines 24, 31, 36, 42, 43) and 0 timeouts. It lists one equivalent record, at line 50: `childList: true` replaced by `false`. I accept it as equivalent. A direct child added to or removed from the host, including an empty text node, changes the assigned nodes and so fires `slotchange`, which already triggers the same read. A deeper child added or removed cannot change whether a slot is empty, because only direct children are assigned and any assigned element already makes the slot not empty. R-03 still names `childList: true`, so keeping the declaration matches the plan.

## Checks run

All run at HEAD `285b235` in this container, with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.

| Check | Result |
|---|---|
| `gate:typecheck` | pass |
| `gate:lint` | pass |
| `gate:style-lint` | pass |
| `gate:test-lint` | pass |
| `pnpm test` (`gate:unit-tests`) | **fail**: 5 of 3130 failed, all in `gates/test/integration/visual.test.ts`, no container engine (R1-01); every elements test passes, `slot-state.test.ts` and `commands.test.ts` included |
| `gate:mutation -- --base 767c097` | pass (0 survived, 1 equivalent record accepted) |
| `gate:csp` | pass |
| `gate:prefix` | pass |
| `gate:signoff -- --range 767c097..HEAD` | pass (6 commits, no finding) |
| `gate:pins` | pass |
| `gate:contrast` | pass |
| `gate:brand-rules` | pass |
| `gate:manifest` | pass (`slot-state` is not exported from `src/index.ts` and not in the manifest) |
| `gate:config-copies` | pass |
| `gate:visual`, `gate:axe`, `gate:storybook-build`, `gate:plants` | not run. `gate:visual` cannot run here (no container engine), and phase 1 adds no story or element. |

Other checks:

- **Tasks.** T001 to T008 are ticked and each one's work is present: `spike.md` covers T001 and T002, `slot-state.test.ts` T003, `commands.test.ts` T004, `src/slot-state.ts` T005, `test/commands.ts` and `vitest.config.ts` T006, the driver methods and the five fixture pages T007, and `tdd-exempt.md` T008.
- **Changes outside the code.** The edits to `spec.md`, `plan.md`, `research.md`, `tasks.md`, `contracts/checks.md` and `checklists/requirements.md` carry their reason in `spike-fixes.md`: the operator's decision (a), `align-self: start`, on the spike's stop-and-ask.
- **Constitution.** I found no principle that this phase violates. The controller does no I/O. The test plumbing sets sizes through the CSSOM, not through `style` attributes, which fits a strict CSP. `slot-state` is internal, with no `sk-` name and no new public surface.
- **Plan.** Phase 1 of plan.md is followed: the controller has its test first, the R-13 readers are shared by both harnesses, and the phase was mutation-tested from its own base.

## Earlier findings

None: this is round 1.
