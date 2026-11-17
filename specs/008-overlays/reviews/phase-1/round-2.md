---
phase: 1
round: 2
verdict: approved
base: 15ce56120ffdf26c35593664457a569376c0f252
head: 042f5763c50315beae5d51e1b3cc819b476e4fbe
tdd_check: pass
---

# Phase 1 review, round 2

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | packages/elements/test/scenarios/probe.ts:63-66; packages/elements/test/in-process.ts:99-100, packages/elements/test/browser/driver.ts:72-73 | Because of the R1-01 fix, an element in the `mount` markup that carries `style="…"` now counts: `reset()` runs before `document.body.innerHTML = markup`, and the parsed nodes arrive as one `childList` record. Before the fix, markup-borne attributes made no attribute record and did not count. No scenario mounts styled markup today (`grep 'style='` over test/scenarios/harness.ts finds nothing), and on the strict-CSP fixture such markup would also raise a `style-src-attr` violation. FR-047 counts the elements' own writes, so a styled mount would now give a false positive, not a missed write. | None now. Keep `mount` markup free of `style` attributes, or note this in the `styleAttributes()` doc comment in Phase 2. |
| R2-02 | note | packages/elements/test/scenarios/probe.ts:80-87 | Only roots made through `attachShadow` are observed. A declarative shadow root (`<template shadowrootmode>` parsed by `setHTMLUnsafe` or `parseHTMLUnsafe`) is not wrapped, so writes inside it would be missed. The overlays are Lit elements and attach through `attachShadow`, so FR-047 as this feature uses it is not affected. | None. |

## Test quality

- **Red evidence for the fix.** `69eb0ce` is a test-only commit (packages/elements/test/scenarios/harness.ts, plus the `fix-1` entry in `red-commits`, exit 1). `red-fix-1.log` shows exactly the 2 new rows failing in each of the two harnesses (4 of 3152 tests). The in-process failures are `{ mounted: 0, appended: 0 }` against `appended: 1`, and `{ mounted: 0, committed: 0 }` against `committed: 2`. The fixture failures are the same assertion. They fail because the behaviour is missing, not because of a setup error.
- **The rows match R1-01's required cases.** (a) `detached`: a `<span>` gets a CSSOM `color` while detached and is then appended into the nested inner root (harness.ts:91-95). (b) `fragment`: a template clone whose `<i>` and `<b>` get CSSOM writes in the detached fragment before it is appended, which is the Lit first-render commit order (harness.ts:96-102). Both rows are in the shared `harnessScenarios` table, so both harnesses run them: test/harness.test.ts and test/browser/harness.test.ts. The expected values are hand-written, and `toEqual` checks the whole record.
- **Fix commit.** `728fba7` changes only `probe.ts:63-66` and its header comment. On each added element it counts the element and each `[style]` descendant, and it keeps the `ignored` rule. The existing `probe: 2` row still holds, because `resolveColour` calls `ignore()` before `append` (in-process.ts:183-185, browser/driver.ts:197). The delta from `reset()` is unchanged.
- **Weakening.** `git diff 69eb0ce..728fba7` changes no test expectation. `git diff b9628e9..HEAD -- '*.test.ts'` is empty. No test was skipped, deleted or loosened after its red commit.
- **Mutation.** `pnpm run gate:mutation -- --base 15ce561` printed "nothing to mutate: no package or gate source line changed since 15ce561". All of this phase's code is test harness code.
- `tdd-check.json`: `pass` at 728fba7, with red commits `phase` (exit 1) and `fix-1` (exit 1), `final_tests_on_base_exit` 1, `head_exit` 0, and no problems. HEAD `042f576` adds only the check's evidence files.

## Checks run

All were run at HEAD `042f576` with the task's environment (docker running, `OCELLE_VISUAL_ENGINE=auto`, `CI` and `GITHUB_ACTIONS` unset):

- `pnpm test`: 3152 tests passed in 143 files (exit 0).
- `gate:typecheck`, `gate:lint` (272 files), `gate:test-lint` (182 files), `gate:style-lint` (12 files), `gate:prefix` (207 files), `gate:config-copies`, `gate:pins`, `gate:brand-rules`, `gate:contrast`, `gate:manifest`, `gate:csp` (10 files): no finding, each exit 0.
- `gate:storybook-build` (21 stories), `gate:axe` (42 runs, 0 serious or critical), `gate:visual` (42 captures match): exit 0.
- `gate:mutation`: nothing to mutate (see above).
- `gate:plants`: **not run**. The whole run is longer than the one-hour background limit, and `gates/bin/plants.ts` has no option to run one gate subdirectory. The diff from base changes nothing under `gates/bin/`, `gates/lib/` or `gates/plants/`, so this phase cannot change what the plants judge.

Tasks: T001 to T012 are still ticked. The fix touched only the probe and the self-test table, both inside T001 and T005. Nothing outside the phase was changed.

## Earlier findings

- **R1-01 (blocking): resolved.** The probe now counts elements that carry `style` when they are added (probe.ts:63-66). Self-test rows for both of the required cases were added red first (`69eb0ce`, `red-fix-1.log`) and now pass in both harnesses (`pnpm test` at HEAD). This reproduces the round-1 case: a detached CSSOM write, then an append into a nested shadow root, now counts 1, where round 1 counted 0.
- R1-02, R1-03 and R1-04 were notes, deferred as the fix note says. No change was required.
