# Phase 3: operator decisions on the spike (T052)

The questions are in reviews/phase-3/spike.md § Questions. They were asked on 2026-11-22 as multiple choice.

| Question | Decision |
|---|---|
| Q1, the sunset check is clean for the chain | (b) Two stories, as in phases 1 and 2: a non-blank `aria-label="Proof"` and a blank `aria-label="  "`, each beside `label="Evidence"`. Phase 3 has 14 stories and 28 baselines, with `(28 added, 0 changed, 0 removed)`; the mission has 48 stories and 96 baselines. T061, T068 and T069 change to match. The Complexity Tracking row is dropped, since the chain was its last element. US3-10's browser bodies stay. |
| Q2, the 1.5 px ring is drawn as 1 px | (a) The planner corrects the two figures in R-12 and in contracts/ocelle-evidence-chain.md: the chip is 19.39 px and the marker's inner box 20.39 px. The red bodies compare border widths with the probe's `--ocelle-ring-step` read as a border width, and assert the chip's block size is below `--ocelle-size-step`, never an exact figure. |
