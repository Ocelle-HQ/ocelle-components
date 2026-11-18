# Changes for the phase 1 spike decisions

Source: `reviews/phase-1/spike.md` (T003, 2026-11-17) and the operator's answers in
`reviews/phase-1/operator-spike-decisions.md` (2026-11-18, human:jeroennouwsdev). Design artifacts only; no source or
test file is touched. T003 and T005 stay unticked for the implementer.

## Decisions applied

| Item | Decision | Change | Where |
|---|---|---|---|
| Q1 | (b) two host `aria-label` data-table stories | Two stories added: "overflows, named by a host `aria-label`" (`aria-label="Deployments"`, `label="Work packages"`, `group` "Deployments") and "overflows, blank host `aria-label`" (`aria-label="  "`, `label="Work packages"`, `group` "Work packages") | contracts/checks.md § Stories; tasks.md T019; quickstart.md step 5; data-model.md (host `aria-label` row) |
| Q1 | (b) | Counts: phase 1 12 → 14 stories, 24 → 28 baselines (`visual:update` `(28 added, 0 changed, 0 removed)`); mission 35 → 37 stories, 70 → 74 baselines; per-phase `<n>` 28, 22, 24 | plan.md § Summary, § Technical Context (Scale/Scope), § Decisions after the analysis (C1 note), § Decisions after the phase 1 spike; research.md R-15; contracts/checks.md § Stories; tasks.md § Baselines, phase 1 Goal, T014, T019, T020, T078 |
| Q1 | (b) | Principle V exception row: scope drops the data table's region (timeline and chain stay until T026, T052); sunset recorded as met for the data table on 2026-11-17; approval cites spike Q1 (b); T006's FR-010 body kept | plan.md § Complexity Tracking, § Constitution Check (intro and row V), § Phases phase 1 Red; spec.md FR-050 and § Operator decisions after the analysis (C1 note); research.md R-09; contracts/checks.md § Stories (paragraph after the list); contracts/ocelle-data-table.md § Behaviour (Host ARIA); tasks.md § Analysis decisions in force, § Stop-and-ask points (third item), T006 (FR-010 bullet) |
| Q1 | (b) | Story test asserts the two stories' `group` names ("Deployments", "Work packages") | tasks.md T014 |
| Q2 | (a) uppercase kept | US1-1: compare with the same table outside whose column headers a test-only rule makes upper case (a constructed sheet in the fixture harness, strict CSP kept), plus the assertion that the five headers are named "ID", "TITLE", "LANE", "OWNER", "LINK" | spec.md US1-1; research.md R-01 (Result, Decision on the difference); contracts/checks.md § Oracles (AX tree, table); contracts/ocelle-data-table.md § Accessibility tree; plan.md § Phases phase 1 Red; tasks.md phase 1 Independent Test, T006 (US1-1) |
| Q2 | (a) | README statement in both packages: the accessible names of column headers follow the drawn upper-case text | spec.md FR-006; contracts/styles-data-table.md § Consumer rules; plan.md § Phases phase 1 Red and Green; tasks.md T011, T013, T017, T021; quickstart.md step 5 (headers) |
| T005 | "Proceed, map later" | Phase 1 does not wait for the `.sk-data-table` inventory; mapping rows (FR-058) read "pending inventory", asserted by T013 and written by T021; the inventory is recorded in R-16 and mapped test first before the pull request lands: in phase 1's red if it arrives before it, otherwise in the next phase's red (T037 or T062) with the rows written in that phase's green (T047 or T070); not mapped by phase 3's red: stop and ask | spec.md FR-058; research.md R-16 (Phase 1 paragraph); plan.md decision 9, § Phases phase 0 and step 3 (Red commit), § Decisions after the phase 1 spike; tasks.md § Phase flow, § Stop-and-ask points (inventory item), T005, T013, T021, T037, T062, § Dependencies (Within each phase) |
| T005 | "Proceed, map later" | SC-001 stays open until the inventory is supplied and mapped; measurable as "no row reads 'pending inventory'" | spec.md SC-001; tasks.md T076; quickstart.md § Prerequisites |
| All | record | Decision blocks added | spec.md § Operator decisions on the phase 1 spike; plan.md § Summary (bullet) and § Decisions after the phase 1 spike; tasks.md § Phase 1 spike decisions in force; checklists/requirements.md § Notes |

## Spike facts recorded for the red bodies

| Fact (spike.md) | Change | Where |
|---|---|---|
| § 3: the US1 identifier must have no break opportunity (`01JD8X2K7Q9M4N6P3R5T0V2W8Y`); a hyphenated slug fits at 320 px | Result added; Independent Test and US1-4/US1-5 name an unbroken identifier | research.md R-03; spec.md US1 Independent Test; tasks.md phase 1 Independent Test, T006 (US1-4 and US1-5) |
| § 6: the one-long-word precondition needs `letter-spacing` 0.07 px in process, 0.02 px on the fixture with Schibsted Grotesk (0.609 without, out of range) | Result added; T008 states cells "Ok" and "3", the caption, and the per-harness values | research.md R-02; tasks.md T008 |
| § 5: the end-fade body's caption is chosen per font and asserts its one-line precondition first ("Deploy approvals Deploy approvals Deploy approvals D" in the fallback font) | Result added; T007 states it | research.md R-07 (The flat tree); tasks.md T007 |
| § 5: `position: static`, `--data-table-box-size` reaches the slotted caption, cap 278 px at 320 px, no loop error, the three loop plants bite | Result added | research.md R-07 (The flat tree) |
| § 4: R-05 "none" (already recorded in the spike commit) | T013 no longer carries the conditional statement; data-model notes no escaping change | tasks.md T013; data-model.md § Data table (States) |
| § 8: print clips content past the box and keeps the end fade | Result added; README print statement worded | research.md R-07 (Print); plan.md § Phases phase 1 Red; tasks.md T013 |
| § 1: R-01's tree and axe results | Result added | research.md R-01 |
| § 2: axe clean; Chromium shows the host as a `generic` node of the host's name beside the `group` | Recorded | research.md R-09; contracts/ocelle-data-table.md § Behaviour (Host ARIA) |

`tasks.md` still parses: `units.sh` reports phase 1 with 23 tasks (T003 to T025), all open, as before.

## Question for the operator

**Q-S1. Where the `.sk-data-table` mapping goes if the inventory arrives late.** "Proceed, map later" leaves the place
of the mapping open. These changes plan it in the first red commit after the inventory is recorded (phase 1's, else
phase 2's T037 or phase 3's T062, which already add mapping statements), and stop and ask if it has not been mapped
by phase 3's red commit. Phase 4 is exempt throughout, so it cannot hold a red/green pair as planned. Options:

- (a) As planned above; if the inventory comes after phase 3's red commit, the operator is asked then.
- (b) As planned above, and if it comes after phase 3's red commit, phase 4 gains one test-first unit (red statement
  change in `packages/elements/test/node/readme.test.ts`, then the README rows), recorded with `red.sh` and dropped
  from phase 4's exemption.
- (c) Always in phase 4 as the test-first unit of (b), whatever the timing, so phases 2 and 3 stay as they are.
- (d) Phase 1's review stays open until the inventory arrives, and the rows are a phase 1 fix (test first) before its
  approval.
