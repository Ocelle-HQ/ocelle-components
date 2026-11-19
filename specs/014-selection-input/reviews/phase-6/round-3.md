---
phase: 6
round: 3
verdict: changes_requested
base: ac2eebe229dc860390ba4ba1c69ff1725fe8b1fe
head: fec463e
tdd_check: pass
reviewer: human:jeroennouwsdev (operator round, recorded by the orchestrator)
---

# Phase 6, round 3: operator round from the landing review

<!-- Not a reviewer-renata phase review. The /ocelle-land landing review of PR #54 (reviews/landing/round-1.md) found
L1-01 (blocking): US5-7 fails in CI in both harnesses on every run since the merge of main, and with it every mutation
shard (L1-02). A diagnosis without changes found the cause: CI's Chromium draws text with subpixel (LCD)
antialiasing, while the local browser draws grayscale. The coloured fringe of the "e" in "See " reaches the pixel
sampled 3.5 px left of the link, under the 80%-opaque Highlight ring, and moves its red channel by one (54 against
55). ocelle-link is not at fault, and the merge did not cause it: pre-merge 049c1e0 fails the same way in the Playwright
image. Phase 6 built US5-7, so the fold is recorded here as an operator round, so that the fix procedure (label fix-3)
and a round 4 review apply. The operator's answer is quoted verbatim. -->

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| O3-01 | blocking | packages/elements/test/scenarios/link.ts (US5-7 body) | Landing L1-01: US5-7's left-side ring sample depends on how the machine draws text, and fails with subpixel antialiasing (CI). Operator: "Space the test link (Recommended)": "One line in the US5-7 test fixture: give the link `margin-inline: 0.75em` so neighbouring glyphs sit clear of the ring band, with a comment explaining why. The assertion and sample point are unchanged, so it stays exactly as strict." | Red first, in a CI-like subpixel setup: show US5-7 failing on its assertion, unchanged, with subpixel text (a fontconfig with `rgba=rgb` and the unwrapped headless shell, or the Playwright Docker image), and record how it was run. Then the one-line spacing with its comment. US5-7 passes with subpixel text, with grayscale text and in the Docker image, and a planted wrong ring still fails it. Then a green CI run, including the mutation shards (L1-02). |

## Verdict

changes_requested (operator round).
