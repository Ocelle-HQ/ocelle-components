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
- Spec check 3 (`reviews/spec/check-3.md`, fixes in `reviews/spec/check-3-fixes.md`): items re-checked after the
  fixes, "Requirements are testable and unambiguous" included (SPEC-3-10). It now also rests on how test-only code
  reaches the strict-CSP fixture (the test host's self-contained file with its own Lit on User Story 3 pages, two
  module-build bundles on the page of User Story 1 scenario 10, both in the allowed request list, with the browser
  build still the file under test); on host ARIA (FR-034: a host `aria-label` is a label, a host
  `aria-hidden="true"` hides, a host `role` or `aria-hidden="false"` is unsupported and documented); on scenarios
  for the `trailing` slot (User Story 3 scenario 10) and for icons in a link in forced colours; on the declared types
  and defaults of every property; on the pixel measure of mirroring; on Lit's production build in the browser build
  and the meaning of "built output"; and on the Lit packages `THIRD_PARTY_NOTICES` names. The operator approved the
  spec at the gate after check 3, once these fixes are made, with no further spec check; that is recorded at the top
  of the spec.
