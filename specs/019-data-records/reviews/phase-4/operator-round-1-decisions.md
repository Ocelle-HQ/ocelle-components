# Phase 4, review round 1: operator decisions

The round-1.md verdict was changes_requested (fead651; `verdict.sh 4`). The questions were asked on 2026-11-23 as multiple choice.

## R1-01 (blocking): T076 is open, G-1

Already decided (operator-coverage-decision.md, (b)). The fix round adds a red statement to `readme.test.ts`, then the data table's light-mode row in the README and in R-16. It records `fix-1` and ticks T076.

## R1-02 (blocking): T075's exemption does not hold

**Decision: add statement tests.** In the same fix round as G-1, red statement tests cover:
- the elements CHANGELOG's minor-change paragraph;
- the data table entry's `wrap` (reflected) and its `stickyHeader` given as `sticky-header`;
- the styles CHANGELOG's four-blocks paragraph.

T075 comes out of `tdd-exempt.md`, and the TDD check must show these tests failing on the base.

Not chosen: keep T075 exempt.

## Notes R1-03 and R1-04

**Decision: fix both.** Correct the run-1 counts in plants.md (22 and 18). Correct quickstart.md's `disconnectedCallback` to `connectedCallback`.
