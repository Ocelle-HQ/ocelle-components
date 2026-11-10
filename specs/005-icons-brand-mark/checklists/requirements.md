# Specification Quality Checklist: Icons and Brand Mark

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-11-10
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

- As in specs 001 to 003, the spec names the public surface (element names, attributes, tokens, gates) and the
  constitution's stack (Lit 3, Storybook), because the surface is the product of a component library
  (constitution VII). That is a deliberate exception to "no implementation details", not a leak.
- The two open choices (brand-mark terms, icon source) were put to the operator while specifying and are recorded
  at the top of the spec.
- Spec check 1 (`reviews/spec/check-1.md`, fixes in `reviews/spec/check-1-fixes.md`): items re-checked after the
  fixes. "Requirements are testable and unambiguous" now rests on the strict-CSP fixture definition (one page, full
  CSP header with `font-src 'self'`, allowed request list), the token rule for the manifest's CSS custom properties
  (FR-007), the pairing of every "does not" outcome with a positive outcome and a planted defect, and the observable
  icon-only naming outcome (User Story 3 scenario 6). The operator's answer to SPEC-1-05 (a thirteenth icon, `file`)
  is recorded at the top of the spec. SC-007 and SC-008 are now documentation checks in this repository; their
  outcomes elsewhere are listed under Consumer need.
- Spec check 2 (`reviews/spec/check-2.md`, fixes in `reviews/spec/check-2-fixes.md`): items re-checked after the
  fixes. "Requirements are testable and unambiguous" now also rests on the browser build (FR-033), which the
  strict-CSP fixture loads with one same-origin module script and no import map, so its CSP, request, size, colour
  and accessibility checks can run and test a named artefact; on the slot rule that the convention's size wins over
  host rules for slotted icons (FR-022, User Story 3 scenario 9, SC-002); on the mark's pairing test, which makes a
  missing `pairs.json` row fail (FR-026, SC-005); and on the `id` on every element whose accessibility tree is read.
  The operator's answer to SPEC-2-02 (also ship a browser build with Lit inside; Lit's notice in
  `THIRD_PARTY_NOTICES`) is recorded at the top of the spec.
