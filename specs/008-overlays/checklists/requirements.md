# Specification Quality Checklist: Overlays — Dialog, Drawer and Tooltip

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-11-12
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs) — see Notes
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders — see Notes
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
- [x] No implementation details leak into specification — see Notes

## Notes

- The platform features named in the spec (native `<dialog>` with `showModal()`, the Popover API, `CustomEvent`
  events, shadow roots, tokens) are the library's public contract and the issue's own requirements (#16:
  "Built on native `<dialog>` with `showModal`"; operator decision on the Popover API), as in earlier element specs
  (005). They are kept deliberately; how each is used is left to the plan.
- The three clarifications (tooltip platform, drawer modality, backdrop click) were asked while specifying and are
  recorded under "Operator decisions while specifying".
- FR-016 (platform-initiated closes) and FR-036 (the cross-root description mechanism) leave a choice to the plan by
  design, with the outcome fixed in the spec.
- Spec check 1 fixes (`reviews/spec/check-1-fixes.md`): whether the tooltip text is a description is stated by the
  host through `describes` (FR-036), not by comparing names; one keyboard-focus condition (`:focus-visible`) governs
  show, stay and hide (FR-031 to FR-033, US3 scenarios 10 and 12); no `style` attribute or `<style>` element is
  written at runtime, with an assertion after each placement (FR-047, US3 scenario 13, SC-007). The operator's answer
  to SPEC-1-04 adds the drawer's `heading-hidden` (FR-048, US2 scenario 6), recorded under "Operator decisions while
  specifying". The `:focus-visible` and `style` names are kept as the observable platform conditions the tests check.
- Phase 2 operator decisions (2026-11-14, `reviews/analysis/fixes-4.md`), recorded under "Operator decisions in
  Phase 2": the reverse-wrap limit is removed from FR-008, SC-002 and US1 scenario 14, and FR-008 states testably
  that whatever the overlay adds for the wrap is not a Tab stop, unnamed and absent from the accessibility tree;
  FR-045 states that inherited members are declared and marked inherited and the internal base is not published.
  Both are stated as outcomes; the mechanisms (an end sentinel, the analyzer's module list) are left to research.
