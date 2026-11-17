# Specification Quality Checklist: Layout and Headers

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

- For a component library the public surface (element names, attributes, slots, tokens) is the product, so the spec
  names it, as earlier missions do; how the elements are built (empty-slot detection, the compact-card mechanism,
  stylesheet structure) is left to the plan.
- The three open questions (card `inset`, the sidebar's landmark, upstream values against the token set) were
  answered by the operator while specifying and are recorded in the spec's header.
- Spec check 1's findings are resolved in the spec (`reviews/spec/check-1-fixes.md`): the "not set" default and
  empty or invalid variant values (FR-006, FR-017, US1-17), the rail's padding against `--ocelle-size-rail-item` and
  the focus ring (FR-025, US4-2), the horizontal rail's wrapped layout (FR-025, US4-7), forced-colours outcomes for
  the card and `inset` (FR-016, US1-13), and the Chromium probe of upper-cased headings in the accessibility tree,
  recorded in the spec's header and applied to US1-5 and FR-013. The check's notes are folded in too: host
  `aria-label` (FR-028), wrapped-action gaps and alignment (FR-010, FR-019), more empty-part scenarios, the prose
  region edge case, and the README statements the documentation test asserts (FR-036).
- Spec check 2's blocking findings are resolved in the spec (`reviews/spec/check-2-fixes.md`): `inset` is a boolean
  whose presence, the empty value included, means inset, and the "empty or invalid is not set" rule covers only the
  enumerated attributes (FR-006, FR-016, US1-10); the landmark name follows the README's Host ARIA rule, a present
  host `aria-label` deciding alone (FR-028, US3-12, US4-11, FR-036, Edge Cases); the sidebar pads the head, each
  section and the footer, with dividers between padded parts and no other gap (FR-021, FR-022, US3-3, US3-11,
  US3-13). Notes SPEC-2-06 (US1-18, FR-017) and SPEC-2-08 (Edge Cases) are folded in too.
- Spec check 3's blocking finding is resolved in the spec (`reviews/spec/check-3-fixes.md`): the sidebar's dividers
  lie between the head, the default slot and the footer and at the block start of every section but the first, and
  text in the default slot makes it non-empty but adds no divider of its own (FR-022, US3-11, Edge Cases). Notes
  SPEC-3-02 (eyebrow variant ignores `size` and card density, FR-013, US1-5), SPEC-3-03 (no card workaround counted,
  SC-006, FR-036, "Consumer need"), SPEC-3-04 (`brand-rules` in SC-004) and, in part, SPEC-3-05 (US4-2's container
  size) are folded in; the rail divider's gaps, the overflowing vertical rail and the page-header band's ground
  (SPEC-3-05, SPEC-3-06) need a product choice and stay open for the plan squad to raise.
- The operator's answers at the spec gate (upper-case accessible name, keeping FR-028, Host ARIA precedence, the
  sidebar spacing of SPEC-2-03, and "Approve after a final fix" after spec check 3) are recorded in the spec's header.
- The spec is approved once spec check 3's findings are fixed; no further spec check follows, and the plan squad
  reads the spec next.
- The operator's decision at the phase-1 spike (option (a), `align-self: start` on the sidebar's and rail's host) is
  recorded in the spec's header and applied to FR-023, FR-025, FR-036, US3-4 and US4-2 (`reviews/phase-1/spike-fixes.md`);
  every item above still holds.
- The operator's decision in phase 4 (decision 6 of `reviews/operator-decisions-implementation.md`, "README
  statement": `align-self: start` stays) is recorded in the spec's header and adds one sidebar statement to FR-036,
  that in a flex column or flex row the container or the page sets the sidebar's inline size; no scenario changes.
