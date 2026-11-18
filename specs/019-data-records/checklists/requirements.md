# Specification Quality Checklist: Data Records (Data Table, Event Timeline, Evidence Chain)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-11-15
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- This is a component library: the users are developers and assistive-technology users, so element names, tokens and
  the accessibility tree are the user-facing surface, as in missions 005 and 013; they are not implementation details.
- The four clarify questions of the triage record were put to the operator while specifying (spec § Operator
  decisions while specifying); no marker remains.
- Spec check 1 (`reviews/spec/check-1.md`, fixes in `reviews/spec/check-1-fixes.md`): the data-table rules' specificity
  and the prose override are stated (FR-005, FR-012, US1-10, US1-14); each line and mark is classed structural (3:1)
  or decorative (FR-013, US1-11, US2-8, US3-8); the measured "item text" is defined (FR-016); a blank host
  `aria-label` counts as absent for the timeline and the chain (FR-022, US2-10, US3-10); the chip's radius and size
  are measurable (FR-035, US3-4). The unread issues #470, #517 and #533 are open questions for the plan gate
  (operator decision SPEC-1-06 (b)), not markers in the spec.
- Spec check 2 (`reviews/spec/check-2.md`, fixes in `reviews/spec/check-2-fixes.md`): FR-013 names the nine main
  grounds and says which tokens a structural mark may use (an ink token, whose text declaration covers all nine; not
  the focus, current, link or state colours), so no mark-colour token is added; US2-8 and US3-8 test the same nine
  grounds. Notes taken up: the chip's padding and font-size scale (FR-035, US3-4), the full prose reset list (FR-012,
  US1-10), the step marker's inside as the ordinal's ground (FR-031), header-cell precedence (FR-006), slot
  re-assignment and two swap/rename scenarios (FR-003, US1-15, US1-16), the pre-upgrade children (Edge Cases,
  FR-012), tests for behavioural edge cases (FR-052) and no loading state (Edge Cases).
- Plan gate (2026-11-16, `reviews/plan/operator-gate.md`, changes in `reviews/plan/gate-answers.md`): the operator
  answered the open questions. Decision 1, Q-A, Q-B and Q-C confirm the plan's defaults (FR-035 now states no fill,
  FR-023 the time above the content). Q-E, "Yes: named time slot", changes FR-023 (a named `time` slot that takes
  precedence over the `time` attribute) and adds US2-11 to US2-14; each is testable (checks.md). Q-G, whether an
  empty or hidden slotted time lets the attribute apply, is put back to the operator; the spec states the plan's
  reading until then.
- Phase 1 spike (2026-11-18, `reviews/phase-1/spike.md`, decisions in `reviews/phase-1/operator-spike-decisions.md`,
  changes in `reviews/phase-1/spike-fixes.md`): Q1 (b) adds two data-table stories named through a host `aria-label`,
  non-blank and blank (FR-050; the exception keeps the timeline and the chain only); Q2 (a) keeps the upper-case column
  headers, and US1-1 and FR-006 now say that each column header is named by its drawn upper-case text, compared with
  an outside table drawn the same way, with a README statement in both packages; T005 "Proceed, map later": FR-058's
  data-table rows read "pending inventory" until the inventory is supplied before the pull request lands, and SC-001
  stays open (measurable: no row reads "pending inventory"). Every item above still holds.
- Library inventory (2026-11-18, `reviews/phase-1/inventory-questions.md`, decisions in
  `reviews/phase-1/inventory-decisions.md`, changes in `reviews/phase-1/inventory-fixes.md`): IQ-1 (a) makes the
  library's variant set the inventory (FR-058 and SC-001 now measurable as one row per modifier, state, structure role
  and part, no "pending inventory"); IQ-2 to IQ-5 add FR-017 (sticky header row, with the page's block bound), FR-018
  (009's module's opt-in block-axis option; FR-008 amended for exactly it; SC-007 now covers 009's tests), FR-019 (the
  `data-ocelle-align="end"` hook), FR-060 (striped rows) and FR-061 (row hover), with US1-17 to US1-25, edge cases and
  FR-013 rows for the three grounds and the forced-colours band; IQ-6 (a) adds a README statement to FR-010. Each new
  requirement has acceptance scenarios and measurable oracles (contracts/checks.md). Every item above still holds.
- Inventory follow-up questions (answered 2026-11-18, end of `reviews/phase-1/inventory-decisions.md`; changes in
  `reviews/phase-1/inventory-fixes.md` § Follow-up answers applied): Q-I1 to Q-I3 confirm the defaults FR-017 and
  FR-061 already state; Q-I4 adds the block-end fade to FR-018 (block end only, never under the pinned box, combined
  with the inline fades, kept clear by the focus clearance, a `CanvasText` line in forced colours), with US1-26 to
  US1-28, edge cases and two FR-013 rows; Q-I5 adds a one-line pointer in 009's contract file. Two new operator
  questions, Q-I6 (the fade's room rule) and Q-I7 (a story for the fade's off state), name the defaults the spec
  follows; no `[NEEDS CLARIFICATION]` marker is added. Every item above still holds.
