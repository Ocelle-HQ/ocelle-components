---
analyzed_at: 2026-11-20T11:42:31Z
head: 33751a914d36021ec1bfa0fc7e37022dc06a59d2
critical: 0
high: 2
medium: 6
low: 5
coverage: 96.2
---

## Specification Analysis Report

Feature: `specs/020-disclosure-code-block` (spec.md, plan.md, tasks.md, with research.md, data-model.md,
contracts/elements.md, contracts/checks.md and quickstart.md as supporting artifacts), checked against constitution
1.3.1. `.specify/extensions.yml` has no `before_analyze` or `after_analyze` hooks (`hooks: {}`).

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C1 | Inconsistency | HIGH | spec.md:L259-262 (US2-12), spec.md:L507-512 (FR-033); research.md R-07 (L286-297); plan.md:L89-91 (Decision 3); contracts/elements.md:L95-96; tasks.md:T024, T040 | The spec and the design disagree about a digest prefix that is wider than the line. FR-033 says a break never falls inside the prefix, and US2-12 says "the prefix and each group have exactly one rect" at every `pre` width from 60 to 300 px. R-07, plan Decision 3 and the README digest rule do the opposite: the prefix has no `nowrap` and breaks inside when it is wider than the line (WCAG 1.4.10). R-07 measured a 60 px `ni:sha-256:` prefix at 2 rects. The operator kept the wording as a note at the plan gate, and T040 corrects it only in phase 3, after T024 has already written the US2-12 bodies from the spec. A body written to the spec either fails on correct code or forces the prefix to `nowrap`, which breaks 1.4.10. | Before T024, align FR-033 and US2-12 with R-07: lines break only between units, and a unit wider than the line breaks inside. You can do this by moving T040's FR-033 correction ahead of T024, or by having T024 state that its US2-12 oracle is contracts/checks.md's (one rect per group, and one rect for the prefix only where it fits). |
| D1 | Constitution Alignment | HIGH | plan.md:L184 (Complexity Tracking); spec.md:L533-536 (FR-050), L236-237 (US2-7); research.md R-09 (L358-360); storybook/stories/scroller.stories.ts:L65; tasks.md:T028 | The exception to Principle V ("a story per variant and per state") rests on the claim that "axe fails the unnamed states by design". For the unnamed overflowing scroll block, the repository contradicts this. `ocelle-scroller`'s `Unlabelled` story uses the same overflow-region module with no label, and `storybook/a11y-exceptions.json` has no scroller entry, so it passes the `axe` gate today. Under the module's name rule, an unnamed box has no role, so the code block should pass the same way. The exception's premise is unproven for this state, so a story the constitution requires may be left out without a valid reason. | Measure it. If axe passes, add an unlabelled overflowing scroll story to T028 (as the scroller has) and drop that state from the Complexity Tracking row. If axe fails, record the measured rule in research R-09 and keep the exception. |
| A1 | Ambiguity | MEDIUM | spec.md:L261-262 (US2-12, last sentence); contracts/checks.md:L167-169; tasks.md:T024 | US2-12's base64url and base64 sweep does not name its digest: which prefix it has (if any) and how long it is. "The block holds more than one line" only holds at 300 px for a long enough digest, and "the prefix has exactly one rect" at 60 px depends on the prefix (see C1). contracts/checks.md's body asserts the groups and the line starts but not the line count or the prefix. | Name the exact sweep strings, or their prefix and length, in contracts/checks.md. State that the multi-line assertion applies only at widths where the digest is wider than the `pre`. |
| D2 | Constitution Alignment | MEDIUM | plan.md:L184; tasks.md (no task) | The Complexity Tracking exception shows its approval as "Operator, tasks gate (pending)". No task records that approval, yet T008 and T028 leave the stories out on the strength of it. The row is also titled "Two supported states have no story" but lists three (the unnamed disclosure, the unnamed scroll block, and the wrap-mode code block with a host `aria-label`). | Record the operator's tasks-gate decision before T008. Correct the row's count. |
| E1 | Coverage Gap | MEDIUM | spec.md:L585-586 (SC-002), L593-595 (SC-005), L595 (SC-006); tasks.md:T008, T028; storybook/test/integration/elements-stories.test.ts:L826, L1242, L1259 | SC-002, SC-005 and SC-006 are stated per story: every wrap code-block story and the long-summary story at 320 px, keyboard use in every story, and no running animation in any story. T008 and T028 name only "named summary in every story" for the story-test extension. The existing extensions are per-mission lists of stories, not checks every story inherits, so the 320 px and animation checks will not apply unless a task adds them. The scenario bodies (T004, T024) cover the behaviour on fixtures, not on the stories. | In T008 and T028, list the story checks: page scroll width 320 at a 320 px viewport (SC-002) and no running animation (SC-006). Or state that SC-002 and SC-006 are met by the scenario bodies, and change the SCs to match. |
| E2 | Coverage Gap | MEDIUM | tasks.md:T028; spec.md:L530-533 (FR-050); constitution V; storybook/stories/scroller.stories.ts:L59-61 | Principle V asks for a story per state. The code-block story list has no scroll block scrolled to the middle or the end (fade at both ends, fade at the start only) and no focused scroll box showing the module's ring. The scroller, which uses the same module, has `OverflowingInTheMiddle` and `OverflowingAtTheEnd` stories. | Add scrolled-middle and scrolled-end scroll stories to T028, and a focused one if the ring is a state, or record why those states are not code-block states. |
| F1 | Inconsistency | MEDIUM | tasks.md:T020, T033, T041; spec.md:L596-600 (SC-007, SC-008) | T020 lets the operator choose to "have `/ocelle-land` integrate first". If they do, phase 2's base contains mission 019's changes. T033 and T041 still diff against the fixed `4911fd0b`, so SC-007 (overflow-region.ts unchanged) and SC-008 (no 019 element file changed) would report 019's own changes as this mission's. | Have T020's record name phase 2's base. Run T033's and T041's diffs against the base recorded there (the spec's "branch base"), not a fixed sha. |
| F2 | Inconsistency | MEDIUM | spec.md:L384-386 (FR-008), L120-123 (US1-1); research.md R-08 (L343-347) and § Repository-wide notes (L394-396); tasks.md:T004 | FR-008 says a closed panel's content "has no box". Research measured the opposite: Chromium skips a closed `details` panel with content-visibility, so a slotted link keeps one client rect and `visibility: visible`. The observable R-08 chose is `checkVisibility()` false. A test written to FR-008's words (`getClientRects().length === 0`) fails on correct code, and T004 does not name the oracle. | Name `checkVisibility()` false, absence from the tab order and absence from the AX tree as FR-008's oracle in T004 (or in contracts/checks.md § Oracles), and align FR-008's wording. |
| F3 | Inconsistency | LOW | spec.md:L42; research.md R-11 (L374-375); plan.md:L98-100; tasks.md:T040 | The spec's Consumers paragraph still says "see FR-048". The intended requirement is FR-058. R-11 and plan Decision 7 say it was corrected "at the first squad fix", but it was not. The operator kept it as a note, and T040 fixes it in phase 3. | Leave it to T040, or fix it with C1's correction. |
| C2 | Underspecification | LOW | tasks.md:T040 | T040 asks that the README's WebKit limitation line name "the code block's tab stop". No spec, plan or research entry defines a WebKit limitation for the code block's tab stop; only the disclosure marker has one (R-01, made conditional on T001). | Define the limitation in research, or drop it from T040. Make the marker line depend on T001's outcome. |
| C3 | Underspecification | LOW | spec.md:L377-383 (FR-007), L189-192 (US1-23); data-model.md:L212; contracts/elements.md:L18; tasks.md:T004 | The upgrade order (`aria-expanded` is read after `open` and wins, so `<ocelle-disclosure open aria-expanded="false">` upgrades closed with no event) is in the data model, the contract and T004's bodies, but not in the spec's FR-007 or US1-23. | Add the upgrade order to FR-007 when the spec is next touched (T040). |
| D3 | Constitution Alignment | LOW | plan.md:L71 (Constitution Check III); spec.md:L417-420 (FR-014) | Principle III asks that targets meet `--ocelle-target-min` (44 px) "where the element is a primary action". The disclosure's summary targets 24 × 24 (WCAG 2.5.8). The Constitution Check does not say that the summary is not a primary action. | Add one line to the Constitution Check row for III stating why `target-min` does not apply. |
| B1 | Duplication | LOW | spec.md:L233-235 (US2-6, last clause), L283-285 (US2-21) | Both US2-6's "widens again while focused" and US2-21 specify the focus handover when overflow ends. US2-21 states it more precisely (`.region-frame`, `document.activeElement`). | Keep US2-21 as the oracle, and have US2-6's body refer to it. |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 element conventions | Yes | T002, T009, T010, T011, T022, T029, T030, T031 | |
| FR-002 no class, no sk-, no style attr | Yes | T008, T013, T028, T033 | prefix gate in T013/T033 |
| FR-003 details structure, no delegatesFocus | Yes | T001, T005, T009 | |
| FR-004 one inner control, click() | Yes | T004 (US1-20, -22), T005, T009 | |
| FR-005 chevron, icon slot | Yes | T004 (US1-11, -17), T005, T009 | |
| FR-006 name order, expanded | Yes | T001, T004 (US1-1, -12) | |
| FR-007 moved ARIA, aria-expanded | Yes | T004 (US1-12, -13, -23), T005, T009 | C3 |
| FR-008 inline panel, hidden while closed | Yes | T004 (US1-1, -2, -5) | F2: oracle wording |
| FR-009 open state reflected | Yes | T004 (US1-2, -3, -6), T009 | |
| FR-010 find in page | Yes | T001, T003, T004 (US1-10) | |
| FR-011 :state(open) | Yes | T005, T009 | |
| FR-012 toggle event, coalescing | Yes | T003, T004 (US1-2 to -10), T009 | |
| FR-013 focus out of closing panel | Yes | T004 (US1-19), T005, T009 | |
| FR-014 ring, hover, 24 x 24 | Yes | T004 (US1-4, -21), T005, T009 | D3 |
| FR-015 no animation | Yes | T004 (US1-14), T013 plants | |
| FR-016 forced colours | Yes | T004 (US1-15), T009 | |
| FR-017 disclosure manifest | Yes | T007, T010 | |
| FR-020 textContent copy, observer | Yes | T024 (US2-16, -20), T025, T029 | |
| FR-021 look, ltr lines, rtl opening | Yes | T021, T024 (US2-1, -2, -8), T029 | |
| FR-022 overflow parsing | Yes | T025, T029 | |
| FR-023 wrap policy | Yes | T024 (US2-3), T029 | |
| FR-024 overflow-region use | Yes | T024 (US2-4 to -7, -21), T029, T033 | |
| FR-025 run-time switch, focus | Yes | T025, T029 | |
| FR-026 label, host aria-label | Yes | T025, T029 | |
| FR-027 scroller statements by reference | Yes | T031 | |
| FR-028 digest attribute | Yes | T022, T024 (US2-9), T029 | |
| FR-029 digest derivation | Yes | T024 (US2-14, -15), T025, T029 | |
| FR-030 gap, no added characters | Yes | T024 (US2-9, -12), T029 | |
| FR-031 copy unbroken | Yes | T021, T023, T024 (US2-10) | |
| FR-032 AX text unbroken | Yes | T021, T023, T024 (US2-11) | |
| FR-033 break positions, README rule | Yes | T024 (US2-12), T029, T031 | C1, A1 |
| FR-034 forced colours edge | Yes | T024 (US2-17), T029 | |
| FR-035 code-block manifest | Yes | T027, T030 | |
| FR-040 tokens only where none fits | No | (none) | No token expected (R-10); nothing to build |
| FR-050 stories per variant and state | Yes | T008, T028 | D1, D2, E2 |
| FR-051 baselines, gates | Yes | T012, T013, T032, T033 | |
| FR-052 shared bodies, both harnesses | Yes | T003 to T006, T023 to T026 | |
| FR-053 320 px reflow tests | Yes | T004 (US1-16), T024 (US2-3, -12) | |
| FR-054 event interaction tests | Yes | T004 | |
| FR-055 strict CSP | Yes | T006, T013, T026, T033 | |
| FR-056 changelog | Yes | T007, T011, T027, T031 | |
| FR-057 mutation | Yes | T013, T033 | |
| FR-058 kitty-mission-ui mapping | No | (none) | No inventory (R-11); README gets no rows, nothing to build |
| FR-060 phase order, operator stop | Yes | T020, scope guards | F1 |
| SC-001 red/green per scenario | Yes | T004, T024, checkpoints (`tdd-check.sh`) | |
| SC-002 320 px per story | Partial | T004, T024 (fixtures only) | E1 |
| SC-003 axe per story | Yes | T013, T033 | |
| SC-004 copy and AX measure | Yes | T021, T024 | |
| SC-005 keyboard-only | Partial | T004, T024 (fixtures only) | E1 |
| SC-006 no animation per story | Partial | T004 (US1-14), T013 plants | E1 |
| SC-007 overflow-region unchanged | Yes | T033, T041 | F1 |
| SC-008 013/019 files unchanged | Yes | T041 | F1 |

**Constitution Alignment Issues:** no MUST principle is violated outright. D1: the Principle V exception's rationale
does not hold for the unnamed scroll block, going by the scroller's `Unlabelled` story. D2: the Principle V
exception's approval is still pending, and no task records it. D3: Principle III's `target-min` clause is not
addressed for the disclosure summary.

**Unmapped Tasks:** none. T001 and T021 (spikes) serve FR-006, FR-010, FR-031 and FR-032. T020 serves FR-060. T040
and T041 are polish and verify SC-007 and SC-008.

**Metrics:**

- Total Requirements: 52 (44 functional requirements, 8 success criteria requiring buildable work)
- Total Tasks: 29 (T001 to T013, T020 to T033, T040, T041)
- Coverage % (requirements with >=1 task): 96.2% (50 of 52; FR-040 and FR-058 need no work as planned; SC-002, SC-005
  and SC-006 are covered only by fixture bodies, not per story)
- Ambiguity Count: 1
- Duplication Count: 1
- Critical Issues Count: 0

## Next Actions

- No CRITICAL issue: `/speckit-implement` (the `ocelle-implement` workflow) is not blocked.
- Fix the two HIGH findings before the red step they affect.
  - C1: before phase 2's red commit (T024), align FR-033 and US2-12 with R-07, or have T024 name contracts/checks.md as
    its oracle. Edit tasks.md to move T040's FR-033 correction ahead of T024.
  - D1: before phase 2's T028, measure axe on an unlabelled overflowing code block. Then either add the story and
    shrink the Complexity Tracking row, or record the measured failing rule in research R-09.
- Before phase 1's T008: record the operator's tasks-gate approval of the Complexity Tracking row (D2), and add the
  320 px and animation story checks to T008 and T028 (E1).
- Before phase 2: make T020's record name the phase base used by T033 and T041 (F1). Extend T028's story list (E2).
  Name the US2-12 sweep strings (A1).
- During phase 1: name FR-008's oracle (`checkVisibility()`) in T004 (F2).
- LOW items (F3, C2, C3, D3, B1) can go into T040's documentation pass.
