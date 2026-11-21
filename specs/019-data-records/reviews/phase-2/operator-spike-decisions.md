# Phase 2: operator decisions on the spike (T026)

The questions are in reviews/phase-2/spike.md § Questions. They were asked on 2026-11-20 as multiple choice.

| Question | Decision |
|---|---|
| Q1, the sunset check is clean for the timeline | (b) Two stories, one with a non-blank host label and one with a blank one, as phase 1's Q1 (b). Phase 2 has 13 stories and 26 baselines; the mission has 46 stories and 92 baselines. The planned exception row is dropped. |
| Q2, axe's `list` and `listitem` rules never run | (a) Keep the explicit roles (R-08, for WebKit), and name `aria-required-children` and `aria-required-parent` in US2-1, R-08, checks.md and T030, and in US3-1 at T052. |
| Q3, the dot's unpainted centre | (a) Draw the dot with one side only: `border-block-start: var(--ocelle-size-dot) solid var(--ocelle-color-ink-muted)`. It stays a border, so forced colours and the background-colour plant still work. The contract, R-10 and the forced-colours oracle name that side. |

## Follow-up Q-S1 (asked after d358823)

Spike Q2's option text ended with "the README states it", but the recorded decision does not list the README.

**Decision: (a) No README line.** The kept roles and the two ARIA rules that axe judges them by stay design-only detail. T037, T047, T062 and T070 are unchanged.
