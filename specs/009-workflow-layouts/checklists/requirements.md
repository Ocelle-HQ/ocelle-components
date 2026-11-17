# Specification Quality Checklist: Workflow and Screen Layouts

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-11-12
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

- As in this repository's earlier element specs (005), the spec names element attributes, tokens, slots and ARIA
  outcomes: for a component library these are the user-facing surface, not implementation. Lit, module layout and
  measuring technique are left to the plan, except where an earlier finding forbids one (no `container-type` on a
  shrink-to-fit host, FR-025).
- The six open questions of the triage record were settled by the operator while specifying (spec preamble); no
  [NEEDS CLARIFICATION] marker was needed.
- Check 1 fixes (`reviews/spec/check-1-fixes.md`): the scroller keeps room for its slotted controls' focus rings
  (FR-001, US1-13); a lane never widens for its content and non-lane children share alike (FR-013, US2-14); an
  untitled lane's name and role and a host `aria-label` on a lane are defined (FR-018, FR-019, US2-6); the
  `*-below` attributes accept a closed list of forms and default to the token as computed on the element (FR-025,
  FR-034, US3-10); a shrink-to-fit list-detail has layout-independent intrinsic sizes and a stated expected layout
  (FR-025, US3-12); the board's "no page scroll" is bounded to a definite-size container (FR-014, Edge Cases). The
  paired "does not" table carries the new pairs. Items above re-checked and still hold; the 14 notes of check 1 are
  left to the plan except SPEC-1-13 and SPEC-1-18, which are fixed.
- Check 2 fixes (`reviews/spec/check-2-fixes.md`): a slotted control that takes focus is scrolled clear of the fades,
  with a fallback that drops a fade only while it would cover a control too wide for that clearance (FR-001, FR-007,
  US1-7, US1-13); the board's scroll box takes FR-001 in full, ring room and focus scrolling included, and five
  lanes with that room need 858 px of Frame W's 876 px (FR-014, FR-015, SC-003, new US2-15); US3-10 now uses values
  whose wrongly-accepted outcome differs from the default's, for both `*-below` attributes and the token overrides,
  and the paired rows name Frame W and the same values. The paired "does not" table carries the new pairs. Notes
  SPEC-2-05, SPEC-2-07, SPEC-2-08 and SPEC-2-10 are fixed; SPEC-2-04 is fixed in part (the board never scrolls in
  the block direction, FR-014; lane block sizes are left to the plan); SPEC-2-06, SPEC-2-09 and SPEC-2-11 are left
  to the plan. Items above re-checked and still hold.
