---
phase: 4
round: 2
verdict: changes_requested
base: 3bf3b098918f8d82f576ec7ff6cd8a746934d1dc
head: 3bf3b098918f8d82f576ec7ff6cd8a746934d1dc
tdd_check: pending
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 4, round 2: operator round, the icon-only baseline pin fails on the CI runner

<!-- Not a reviewer-renata review. It was found during the /ocelle-land pass of PR #105 on 2026-11-26, in CI run
45845590938 at 3bf3b098. Unit test shard (4) failed, and every 018 mutation shard failed in Stryker's initial run.
The shard's result.json (artifact unit-test-shard-4) names four failures in packages/elements/test/pill-tag.test.ts
(project "elements (chromium)"): "Baseline, pill, default", "Baseline, pill, compact", "Baseline, badge, default" and
"Baseline, badge, compact". Each is an AssertionError on the scenario's observed record. The full shard-4 plan passes
in the sandbox at the same head (2,522 tests in 69 files). The answer is quoted verbatim. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O2-01 | blocking | packages/elements/test/scenarios/pill-tag.ts:92-96 (`iconOnly`) and the Baseline scenario (:480-548); packages/elements/test/in-process.ts:4, :98 | The Baseline scenario pins the icon-only pill's `top`, `height` and `width` to pixel values from the phase-1 spike, written by hand (default `top: -7.09, height: 29.19, width: 50.09`; compact `-7.39, 27.78, 40.39`). The in-process harness removes the `@font-face` rules, so the text there uses the machine's fallback font. The runner's fallback font differs from the sandbox's, so the pin holds in the sandbox and fails on GitHub. The same scenario passed in CI on the strict-CSP fixture (elements-browser). Operator, answering "Pin on fixture only (Recommended)": "Keep the pixel pin (top, height, width) only where the real font loads (the strict-CSP fixture). In process, assert only font-independent facts: the bare row, the icon-only pill above the surrounding text's top, and its height and width equal to the one-line pill's padding plus icon size. The plant 'bare never set' stays killed." | Planner: add a phase-4 task and amend contracts/checks.md § US3 baseline to match. Implementer: (1) show that the fixture really loads the font (the pin needs it); (2) red first under `red.sh 4 fix-1`, or, if this test-only change cannot fail on a commit, show with hand-applied mutants that the in-process facts still kill "bare never set", "bare on every row" and the dropped override, as the landing skill allows for behaviour-neutral coverage fixes, with the reviewer deciding; (3) run `tdd-check.sh 4`, then a reviewer-renata round on phase 4. No element source changes. |

## Verdict

changes_requested (operator round).
