---
phase: 5
round: 2
verdict: approved
base: 75965e1d4f4051b72a9c93cde9501f03b2a86a53
head: 95b493d
tdd_check: pass
---

# Phase 5 review, round 2

The change since round 1 (`git diff 7c853b9..95b493d`):
- `15d61d3`, the fix: one new body in `packages/elements/test/scenarios/copy-field.ts`, plus `plants.md`, `notes.md`
  and `round-1-fixes.md`;
- `95b493d`, the red/green check after the fix.

No source file changed. There were no uncommitted changes.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|

No new finding. The round 1 notes R1-02 (triple click for US4-12), R1-03 (WebKit user activation open in R-07) and
R1-04 (docker-only baselines) still stand as notes, unchanged.

## Test quality

- **The new body.** It is named "FR-041, FR-042: a clear and a set of the same status in one task …" and is at
  `copy-field.ts:879-926`, with `fixture: true`, so it runs in both harnesses.
  - It clears the status and sets the same text again in one page script, with no microtask checkpoint between them.
    It does this twice: once with a `value` change as the clear, once with the host's own `status = ""`.
  - A MutationObserver with `characterDataOldValue` records the region's mutations. The body expects `[copied, ""]`
    for each case, that is, old text → empty and empty → text.
  - Any `childList` record lands in the same list as the string `"childList"`, so replacing the text node instead of
    writing it would also fail the body.
  - Beside these, a repeated set in a later task must record nothing (US4-5), and the tree must show the new text and
    the status.
  - This is stricter than the round 1 probe, which recorded only the text at each observer delivery.
  - The assertions are unconditional, and the body reads no mock.
- **The plant bites.** I applied *the region in the Lit template* myself in a throwaway worktree at `95b493d`. In that
  plant the `status` setter only requests an update, the template renders `status` into the region, and there is no
  own text node. On the source the in-process file passes 30 of 30. With the plant, exactly the new body fails:
  1 failed, 29 passed of 30. This matches `plants.md`'s rewritten section and its table row. `notes.md` withdraws the
  "not a defect" record. `contracts/elements.md` is unchanged, as round 1 asked.
- **No red commit was needed.** The fix is test-only, and the body passes on the unchanged source, so a red commit
  could not fail for the right reason. The plant run above is the evidence that the body can fail.
  `round-1-fixes.md` says so.
- **No weakening.** `git diff 575d351..95b493d -- packages/elements/test` adds 48 lines and removes none.
- **TDD check.** `tdd-check.json` (head `15d61d3`) reports `pass`: the final tests fail on base (exit 2) and on the
  scaffold (exit 1) and pass on head (exit 0), with no problems listed.
- **Mutation.** I did not run it again. The phase source has not changed since round 1's run (83 mutants, none
  survived, 2 equivalent records accepted), and adding a test can only kill more mutants.

## Checks run

These ran on `95b493d` one at a time, with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`
and `OCELLE_VISUAL_ENGINE=docker`. I reran the checks the diff since `575d351` can affect: a test scenario file and
review records.

| Gate | Exit | Result |
|---|---|---|
| typecheck | 0 | no type error |
| lint | 0 | 311 files, no finding |
| test-lint | 0 | 210 files, no finding |
| prefix | 0 | 285 files, no finding |
| signoff `--range 75965e1..HEAD` | 0 | 11 commits, no finding |
| unit-tests | 0 | 3919 tests passed in 163 files (round 1: 3917; the new body runs in process and on the fixture) |

I did not rerun these, because their inputs did not change since round 1 (all exited 0 there): style-lint,
brand-rules, pins, config-copies, contrast, manifest, csp, storybook-build, visual, axe, mutation and plants. No
source, style, story, baseline, manifest, token or gate file changed.

## Earlier findings

- **R1-01 (blocking): resolved.** This was the contract plant *the region in the Lit template*, which made no test
  fail. The new FR-041/FR-042 body covers the clear and same-text set in one task. I applied the plant myself, and it
  now makes that body fail. `plants.md` and `notes.md` are corrected, and the contract is unchanged.
