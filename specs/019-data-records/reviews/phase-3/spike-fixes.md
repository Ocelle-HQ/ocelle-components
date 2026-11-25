# Changes for the phase 3 spike decisions

Source: `reviews/phase-3/spike.md` (T052, 2026-11-22) and the operator's answers in
`reviews/phase-3/operator-spike-decisions.md` (2026-11-22). Design artifacts only; no source or test file is touched.
T052 is ticked (its record and decisions are in); no other task changes state, and nothing ticked is unticked.

## Decisions applied

| Item | Decision | Change | Where |
|---|---|---|---|
| Q1 | (b) two host `aria-label` chain stories | Two stories added: "named by a host `aria-label`" (`aria-label="Proof"`, `label="Evidence"`, six steps, the list named "Proof") and "blank host `aria-label`" (`aria-label="  "`, `label="Evidence"`, six steps, the list named "Evidence") | contracts/checks.md § Stories (Chain (14)); tasks.md T068; quickstart.md step 5 (Chain, host `aria-label`); data-model.md (the chain's host `aria-label` row) |
| Q1 | (b) | Counts: phase 3 12 → 14 stories, 24 → 28 baselines (`visual:update` `(28 added, 0 changed, 0 removed)`); mission 46 → 48 stories, 92 → 96 baselines; per-phase `<n>` 42, 26, 28 | plan.md § Summary (the library inventory, re-analysis and phase 2 spike bullets, and a new phase 3 spike bullet), § Technical Context (Scale/Scope), § Decisions after the analysis (C1), § Decisions after the phase 1 spike (Q1), § Decisions on the re-analysis (item 6), § Decisions on the issue texts (closing line), § Decisions on the phase 2 spike (Q1), § Decisions on the phase 3 inventory (closing line), § Phases phase 3 Red and Green; research.md R-15, R-16 (phase 3 closing line), R-18 (Stories and baselines); contracts/checks.md § Stories (heading and count paragraph); spec.md § Operator decisions after the phase 1 spike (Q1), on the re-analysis (fixes-2 Q-1), on the phase 2 spike (Q1), on the phase 3 inventory (closing line); checklists/requirements.md (fixes-2 and phase 2 spike notes); tasks.md § Library inventory, Re-analysis, Phase 3 inventory and Phase 2 spike decisions in force, phase 3 Goal, T061, T068, T069, T078 |
| Q1 | (b) | Principle V exception row for the host `aria-label` states dropped from Complexity Tracking (the chain was its last element; sunset met for the chain on 2026-11-22); the notes say two rows stand and record the dropped row; US3-10's browser bodies kept | plan.md § Complexity Tracking (row removed, notes), § Constitution Check (intro, row V), § Summary (C1 bullet), § Decisions after the analysis (C1), § Decisions after the phase 1 spike (Q1), § Decisions on the phase 2 spike (Q1); spec.md FR-050 and § Operator decisions after the analysis (C1); research.md R-09; contracts/checks.md § Stories (paragraph after the list); contracts/ocelle-evidence-chain.md § Behaviour (Name); tasks.md § Analysis decisions in force, § Phase 1 spike decisions in force, § Stop-and-ask points (host `aria-label` item), T055 (US3-10) |
| Q1 | (b) | Story test asserts the two stories' list names ("Proof", "Evidence") | tasks.md T061; plan.md § Phases phase 3 Red |
| Q2 | (a) figures corrected | The chip is 19.39 px (17.4 px line + 2 × 1 px border as Chromium draws `--ocelle-ring-step`), not 20.4 px; the marker's inner box 20.39 px (22.39 − 2 × 1), not 19.4 px; a one-line chip sits about 1.5 px from each edge of the reserved box | research.md R-12 (One centre line, a new "The ring as drawn" bullet, Two-digit fit, Chip step); contracts/ocelle-evidence-chain.md § Behaviour (Marks, Chip); plan.md § Summary (chain bullet) |
| Q2 | (a) | Red bodies compare the ring's and the chip outline's border width with the probe's `--ocelle-ring-step` read as a border width (`border-top-width`, 1 px), never as a padding, and assert the chip's block size below `--ocelle-size-step`, never an exact figure | tasks.md T055 (US3-2, US3-4, US3-8), T056 (ordinal fit); contracts/checks.md § Oracles (computed style, geometry); research.md R-12; contracts/ocelle-evidence-chain.md § Behaviour (Chip); plan.md § Phases phase 3 Red |
| All | record | Decision blocks added | spec.md § Operator decisions on the phase 3 spike; plan.md § Summary (bullet) and § Decisions on the phase 3 spike; tasks.md § Phase 3 spike decisions in force, T052 (ticked, outcome noted); checklists/requirements.md § Notes |

Spec Q2 changes no requirement: FR-033 and FR-035 state bounds, which hold, and the spec block says the plan carries
the figures.

## Spike design detail recorded

| Fact (spike.md) | Change | Where |
|---|---|---|
| § 2: the "`1lh` wrapper again" does not fit, since the 22.4 px marker is taller than the step's 20.3 px line; the first line is centred by `margin-block-start: calc((var(--ocelle-size-step) - 1lh) / 2)` on `::slotted(ocelle-evidence-step:not([variant="chip"]))`, no shadow node added (first-line centres within 0.002 px) | Replaces "the `1lh` wrapper again" | research.md R-12 (Default step); contracts/ocelle-evidence-chain.md § Behaviour (Default content); plan.md § Summary (chain bullet), § Decisions on the phase 3 spike; tasks.md T065, § Phase 3 spike decisions in force |

## Spike facts recorded for the red bodies

| Fact (spike.md) | Change | Where |
|---|---|---|
| §§ 1 to 4: line ends equal a fresh load at every width and change, the 200 px container, the late-font stand-in, RTL; the loop plant raises the error three times; geometry at DPR 1 and 2; forced colours; standalone, empty and hidden | Result added | research.md R-12 (Result, T052) |
| § 5: axe applies `aria-required-children` and `aria-required-parent` to the chain's explicit roles, `list` and `listitem` inapplicable | Recorded as confirmed | research.md R-08; spec.md US3-1; contracts/checks.md § Oracles (AX tree, lists); plan.md § Decisions on the phase 2 spike (Q2) |
| § 6: axe clean on a non-blank, a blank and an empty host `aria-label`; Chromium shows the host as a `generic` node of the same name beside the `list` | Recorded | research.md R-09; contracts/ocelle-evidence-chain.md § Behaviour (Name) |
| Facts for the red bodies: lengths within 0.5 px (marker 22.390625 px), line pitch 34.4 px, `StaticText` at any depth, the ordinal box by a `Range`, width changes re-decide line ends | Recorded | plan.md § Decisions on the phase 3 spike; tasks.md § Phase 3 spike decisions in force, T056 |

`tasks.md` still parses: `units.sh` reports phase 3 with 23 tasks (T052 to T074), 21 open (T052 and T054 ticked).

No question for the operator.
