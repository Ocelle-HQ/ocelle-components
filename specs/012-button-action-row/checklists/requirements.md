# Specification Quality Checklist: Action Controls, `ocelle-button` and `ocelle-action-row`

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-11-13
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

- The product is a component library, so the public interface (attributes, slots, events, parts, native inner
  control, ARIA semantics) is the user-facing surface and is named in the spec on purpose, as in spec 005. Framework
  and build details (Lit, Vite, test runner) are left to the plan.
- Three clarifications were put to the operator on 2026-11-13 and are recorded in the spec header (FR-010, FR-011,
  FR-022).
- Source issues of spec-kitty-design (#493, #495, #501, #504 row part, #508, #518, #525, #528, #532) were not read in
  full; #7's summaries are the requirement, and the assumptions name where exact figures were inferred.
- Spec check 1 (2026-11-13): the six blocking findings were fixed and the four operator questions answered by the
  operator (human:jeroennouwsdev) and recorded in the spec header (FR-012, FR-031, FR-033, FR-009 and FR-037). The
  items above were re-checked after the fixes: "not activated" now names its observables and leaves capture-phase
  listeners out (testable); the name order follows Accessible Name 1.2 with a scenario for the conflict; row contrast
  has its own requirement (FR-042); flush alignment, row minimum height and modifier clicks have measurable
  scenarios. See `reviews/spec/check-1-fixes.md`.
- Spec check 2 (2026-11-13): the three blocking findings were fixed and the operator question answered by the
  operator (human:jeroennouwsdev) and recorded in the spec header (FR-034). The items above were re-checked after the
  fixes: SC-005 is scoped per element and matches FR-035 (a busy row still dispatches); "not activated" covers
  modifier and middle clicks in link mode, with scenarios for the busy link-mode button and the unavailable link row;
  the flush row's hover (surface only, no border, no layout shift) and current mark (full mark, no border) are stated,
  and the hover-border scenario and contrast pair are limited to the `default` presentation; the row's tags reach the
  accessible description after the description, with a scenario. Notes SPEC-2-05 to SPEC-2-12 are left open. See
  `reviews/spec/check-2-fixes.md`.
- Spec check 3 (2026-11-13): the blocking finding SPEC-3-01 was fixed: the current mark takes precedence over the
  hover surface, so a hovered current row keeps its `accent-low` surface and bar (a `default` current row changes
  only its border, a `flush` current row shows no hover change), and the hover-border contrast pair now includes
  `accent-low`; the current bar stays on `accent-low` only. Note SPEC-3-05 was fixed with it (US4 scenario 6 is
  limited to a row with no `current` and no hover). The items above were re-checked after the fixes. Notes SPEC-3-02,
  SPEC-3-03, SPEC-3-04, SPEC-3-06 and SPEC-3-07 are left open for the plan. The operator approved the spec at the
  gate after this final fix; no further spec check follows. See `reviews/spec/check-3-fixes.md`.
- Operator decisions at phase 5 (2026-11-15, human:jeroennouwsdev; plan decision 30), recorded in the spec header:
  the row's description, tags and trailing content are shown beside its inner control and hidden from assistive
  technology as content, the description and tags reaching it only as the accessible description (FR-034, FR-006,
  US4-3; FR-034's "named exactly by its title" kept), so axe's `label-content-name-mismatch` (enabled in axe-core
  4.14.0, not experimental) finds nothing and FR-052 holds on every page; and the row's control owns a hit layer that
  fills the host and takes every click, the content beside the control included (FR-001, US4-15, § Restyled host),
  with FR-032's wrap (US4-18) unchanged. The interactive-content edge case gains its axe consequence
  (`aria-hidden-focus`). The items above were re-checked after the change: the restated fill and the new sibling
  clicks of US4-15 are measurable; the spec names the hit layer only as the area that takes the row's clicks, at the
  level it already names the inner control.
- Operator decisions at phase 6 (2026-11-16, human:jeroennouwsdev; plan decision 31), recorded in the spec header:
  while a row is unavailable, the content beside its inner control is marked disabled with it, so axe treats its
  disabled ink as part of the inactive component (FR-042's exemption) and FR-052 holds on unavailable rows; and an
  unavailable current row keeps its current surface, with disabled ink, a disabled-ink bar and no hover (edge case
  "`unavailable` and `current` together", reading (i) of plan decision 16). US5-7, the edge case and FR-052 gain a
  sentence each. The items above were re-checked after the change: both additions are measurable (axe results, the
  surface's computed colour) and add no implementation detail beyond the level the spec already names.
- Operator decision at phase 6 (2026-11-16, human:jeroennouwsdev; "fix in phase 6", a finding routed from mission 018;
  plan decision 32), recorded in the spec header: `:state(pressed)` is button mode only, as `aria-pressed` is, so a
  link-mode button never exposes it. FR-004, FR-009 and US2-12 gain a sentence each. The items above were re-checked:
  the addition is measurable (whether a host rule on `:state(pressed)` matches, in each mode and across a mode
  switch) and closes the gap where the spec said nothing about the state on a link.
