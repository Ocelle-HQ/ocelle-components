# Changes for the phase 2 spike decisions

Source: `reviews/phase-2/spike.md` (T026, 2026-11-20) and the operator's answers in
`reviews/phase-2/operator-spike-decisions.md` (2026-11-20). Design artifacts only; no source or test file is touched.
T026 is ticked (its record and decisions are in); no other task changes state, and nothing ticked is unticked.

## Decisions applied

| Item | Decision | Change | Where |
|---|---|---|---|
| Q1 | (b) two host `aria-label` timeline stories | Two stories added: "named by a host `aria-label`" (`aria-label="History"`, `label="Mission history"`, the list named "History") and "blank host `aria-label`" (`aria-label="  "`, `label="Mission history"`, the list named "Mission history") | contracts/checks.md § Stories; tasks.md T045; quickstart.md step 5 (Timeline, host `aria-label`); data-model.md (the timeline's host `aria-label` row; the chain's row no longer reads "As the timeline's") |
| Q1 | (b) | Counts: phase 2 11 → 13 stories, 22 → 26 baselines (`visual:update` `(26 added, 0 changed, 0 removed)`); mission 44 → 46 stories, 88 → 92 baselines; per-phase `<n>` 42, 26, 24 | plan.md § Summary (two bullets and a new one), § Technical Context (Scale/Scope), § Decisions after the analysis (C1), § Decisions after the phase 1 spike (Q1), § Decisions on the re-analysis (item 6), § Decisions on the issue texts (closing line), § Phases phase 2 Red and Green; research.md R-15, R-18 (Stories and baselines); contracts/checks.md § Stories (heading and count paragraph); spec.md § Operator decisions on the phase 1 spike (Q1) and on the re-analysis (fixes-2 Q-1); checklists/requirements.md (fixes-2 note); tasks.md § Library inventory and Re-analysis decisions in force, § Baselines, phase 2 Goal, T038, T045, T046, T078 |
| Q1 | (b) | Principle V exception row: scope drops the timeline (the chain stays until T052); sunset recorded as met for the timeline on 2026-11-20; approval cites phase 2 spike Q1 (b); T030's US2-10 bodies kept | plan.md § Complexity Tracking (row and its notes), § Constitution Check (intro, rows V and III), § Decisions after the analysis (C1), § Decisions after the phase 1 spike (Q1); spec.md FR-050 and § Operator decisions after the analysis (C1) and on the phase 1 spike (Q1); research.md R-09; contracts/checks.md § Stories (paragraph after the list); contracts/ocelle-event-timeline.md § Behaviour (name); tasks.md § Analysis decisions in force, § Phase 1 spike decisions in force, § Stop-and-ask points (host `aria-label` item), T030 (US2-10) |
| Q1 | (b) | Story test asserts the two stories' list names ("History", "Mission history") | tasks.md T038; plan.md § Phases phase 2 Red |
| Q2 | (a) roles kept, axe's ARIA rules named | US2-1's axe clause names `aria-required-children` and `aria-required-parent`, which axe applies to the explicit roles in place of `list` and `listitem`, met by the `axe` gate on the timeline stories (element tests run no axe) | spec.md US2-1; research.md R-08 (new paragraph "Which axe rules judge the lists", the Spike plan line); contracts/checks.md § Oracles (AX tree, lists); contracts/ocelle-event-timeline.md § Accessibility tree; plan.md § Constitution Check row III, § Phases phase 2 Red; tasks.md T030 (US2-1) |
| Q2 | (a) | The same for the chain: US3-1 names the two rules, and T052 confirms that axe applies them to the chain's explicit roles (`list` and `listitem` inapplicable) | spec.md US3-1; contracts/checks.md § Oracles (AX tree, lists); plan.md § Phases phase 3 Spike; tasks.md T052 |
| Q3 | (a) one border side | The dot is `border-block-start: var(--ocelle-size-dot) solid var(--ocelle-color-ink-muted)` with no other border side, `box-sizing: border-box`, the `--ocelle-size-dot` box and `border-radius: 50%` kept; the earlier four-side `calc(var(--ocelle-size-dot) / 2)` form and its 1.19 px hole recorded as the reason | contracts/ocelle-event-timeline.md § Marks; research.md R-10 (the marker paragraph); plan.md § Decisions on the phase 2 spike; tasks.md T042 |
| Q3 | (a) | Forced-colours oracle names the drawing sides: the dot's `border-block-start` and the connector's `border-inline-start`, each `CanvasText` with a width above zero | contracts/checks.md § Oracles (forced colours); research.md R-10 (Forced colours); contracts/ocelle-event-timeline.md § Forced colours; plan.md § Constitution Check row III, § Phases phase 2 Red; tasks.md T030 (US2-8) |
| All | record | Decision blocks added | spec.md § Operator decisions on the phase 2 spike; plan.md § Summary (bullet) and § Decisions on the phase 2 spike; tasks.md § Phase 2 spike decisions in force, T026 (ticked, outcome noted); checklists/requirements.md § Notes |

The `background-color` element plant of T050 and checks.md is unchanged: the dot is still a border (Q3 (a)).

## Spike facts recorded for the red bodies

| Fact (spike.md) | Change | Where |
|---|---|---|
| § 5: the dot lays out at 7.1875 px (0.45 rem to 1/64 px) | US2-2's size assertion is within 0.5 px of the probe-resolved `--ocelle-size-dot` | research.md R-10; contracts/checks.md § Oracles (geometry); tasks.md T030 (US2-2) |
| § 1: a slotted `<time>` adds a `time` node around its `StaticText` | `itemTexts` reads `StaticText` at any depth under each `listitem` | research.md R-11 (Result); contracts/checks.md § Oracles (AX tree, lists); contracts/ocelle-event-timeline.md § Accessibility tree; tasks.md T029 |
| § 4: the connector's `calc()` insets, gaps 4.016 px and 4.000 px, dot centres within 0.02 px, `elementFromPoint` the marker, the same at 320 px; Stylelint accepts the form and both dot border forms | Result added | research.md R-10 (A gapped connector) |
| §§ 1, 3, 6: the tree, item texts, axe results, the `time` slot cases, the standalone event and the empty timeline | Result added | research.md R-08; contracts/ocelle-timeline-event.md § Item text and § Outside a timeline |
| § 2: axe clean on a non-blank, a blank and an empty host `aria-label`; Chromium shows the host as a `generic` node of the same name beside the `list` | Recorded | research.md R-09; contracts/ocelle-event-timeline.md § Behaviour |
| § 5: forced colours `CanvasText` on both marks, backgrounds transparent; RTL marks on the right | Result added | research.md R-10 (Forced colours) |

`tasks.md` still parses: `units.sh` reports phase 2 with 26 tasks (T026 to T051), 25 open (T026 ticked).

## Question for the operator

**Q-S1. A README statement for Q2 (a).** The spike's option (a) for Question 2 ends "the README states it", but the
recorded decision names only US2-1, R-08, checks.md, T030 and US3-1 at T052, so no README statement has been added
(T037 and T047 for the timeline, T062 and T070 for the chain are unchanged). Options:

- (a) No README statement: the axe rules are test and gate detail, recorded in the design only (as applied).
- (b) One statement in the elements README's timeline section (asserted in T037, written in T047), and the same in
  the chain's section (T062, T070): the explicit `list` and `listitem` roles are kept for WebKit, and axe judges them
  by `aria-required-children` and `aria-required-parent`.
- (c) One statement in the README's Host ARIA or conventions section covering both lists, asserted in T037 and
  written in T047 only.
