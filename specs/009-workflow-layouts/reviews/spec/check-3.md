---
check: 3
verdict: clean
---

# Spec check 3

Inputs read: `spec.md`, `checklists/requirements.md`, `.specify/memory/constitution.md` (1.3.1),
`reviews/spec/check-1.md`, `check-1-fixes.md`, `check-2.md` and `check-2-fixes.md`, and the diff of the check-2 fix
commit (`9c7d55c`). No `[NEEDS CLARIFICATION]` marker remains, and no prose line is wider than 120 columns.

**Earlier check.** The three blocking findings of check 2 are resolved as the fix note says:

- **SPEC-2-01.** FR-001 defines the ring box. It requires a focused slotted control to sit at least
  `--ocelle-scroller-fade-size` from each inline edge that still fades, with the fade-drop fallback for a control too
  wide for that. FR-007 and US1-7 point to it. US1-13 has the twelve-link tab walk (LTR and RTL, Tab and Shift+Tab,
  checked at every step) and the wide-button case. The paired table has the "no clearance for the fade" row.
- **SPEC-2-02.** FR-014 applies FR-001 in full to the board's scroll box. FR-015 and SC-003 give 858 px of 876 px.
  US2-3 subtracts the ring room. US2-15 covers flat lanes in Frame W and Frame N at all four edges. The paired table
  has the "board scroll box with no room for the ring" row. The arithmetic holds: (876 − 10 − 48) / 5 = 163.6 px per
  lane, which is at least 160 px.
- **SPEC-2-03.** I checked every US3-10 value against Frame W (876 px) or Frame N (636 px). Each accepted value gives
  an outcome other than the default's: 896, 888, 880, 880 and 896 px give one column in W; `45em` gives 900 px at a
  20 px font size against 720 px at the root's; `0` and 624 px give two columns in N. Each rejected value would flip
  the outcome if it were wrongly accepted: 1051, 1024, 964, 933, 900, 896 and 896 px against 876 px. The same holds
  for `inspector-below`: 438, 512, 438, 67, 50, 800 and 800 px against 876 px. Both token overrides (`120%`, `50%`)
  flip if wrongly accepted. `876px` tests the exclusive bound. The paired rows name Frame W and use the same values.

Notes SPEC-2-05, 2-07, 2-08 and 2-10 are fixed as stated. SPEC-2-04 is fixed in part (block direction stated; lane
block sizes are left to the plan), and SPEC-2-06, 2-09 and 2-11 are left to the plan, as the checklist records. The
fixes open no blocking gap. The rows below are notes for the plan.

| ID | Severity | Where | Finding | Fix |
|----|----------|-------|---------|-----|
| SPEC-3-01 | note | spec.md SC-001, FR-001 fallback, US1-13 last Given, US1-6, FR-008 | SC-001 says the fades are on "exactly the sides with content off-screen" in 100% of User Story 1's measured states. The FR-001 fallback breaks that while a too-wide control has focus: a side with content off-screen shows no fade. The wide-button case of US1-13 is a User Story 1 state. The states SC-001 lists do not include it, so in practice nothing conflicts, but the wording does (the same kind of wording issue as SPEC-1-18). FR-008 does not say whether the forced-colours line on that side is also dropped while the focused control would sit under it. | Add "except while the FR-001 fallback holds" to SC-001. State whether the forced-colours line follows the fallback, and add that case to US1-13 or US1-8. |
| SPEC-3-02 | note | spec.md FR-011, FR-014, FR-001 | FR-014 has the board scroll "through the overflow-region module" and requires FR-001's focus scrolling, fade clearance and fade-drop fallback. FR-011's explicit interface does not include any of these. Its Outputs are overflow and the two off-screen flags, its Effects are tab stop, role, name and focus handover, and it has no "fade suppressed on this side" output. Followed literally, the scroller and the board would each implement the clearance logic, and #13 would have a third copy if its code block ever holds focusable content. Neither reading changes what users see, and US2-15 tests the board's outcome. | In `contracts/overflow-region.md`, the plan states whether focus clearance and the fade-drop state belong to the module (as an extra output and effect) or to each host. If they belong to the module, FR-011's list grows to match. |
| SPEC-3-03 | note | spec.md FR-001, US1-13, US2-15 | The clearance rule applies to "a slotted control that takes focus" whatever the cause, but every scenario focuses by keyboard. On pointer focus, a click on a chip partly under a fade scrolls the strip under the pointer by up to the fade depth or more. Programmatic `focus()` is not covered either. Also, the wide-button case puts no upper bound on the button's width. If its ring box is wider than the scroll box itself, "scrolled fully into view, ring included" cannot hold, and the spec does not say what happens then. | The plan states whether clearance scrolling applies to pointer and script focus, and tests the chosen case. It also bounds the US1-13 wide button (ring box wider than the box less two fade depths, but no wider than the box) and states what happens to a control wider than the box: for example, its inline start is aligned with the box's inline start. |
| SPEC-3-04 | note | spec.md FR-025, FR-034 | The grammar of the accepted forms leaves some spellings open, and these are public surface (constitution VII) that #8 and #12 will copy: a leading `+` (`+56rem`), a leading or trailing dot (`.5rem`, `56.rem`), exponent notation (`5.6e1rem`), upper-case units (`56REM`, which CSS accepts), and `-0` or `0px` / `0rem` (accepted, since they are non-negative decimals with a unit). | The plan's contract gives the exact grammar, for example `^(0|[0-9]+(\.[0-9]+)?(px|rem|em))$` with units matched case-sensitively or not, and US3-10 gains one accepted or rejected example for each choice. |

Counts: 0 blocking, 0 operator, 4 note.
