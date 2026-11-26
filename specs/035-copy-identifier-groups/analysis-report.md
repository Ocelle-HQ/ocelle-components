---
analyzed_at: 2026-11-26T11:17:59Z
head: d24efbb4bca7d74435296589d94421eac571e05f
critical: 0
high: 0
medium: 0
low: 0
coverage: 100
---

## Specification Analysis Report

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|

**Coverage Summary Table**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 | Yes | T002, T003, T006, T008 | Default field regression and opt-in grouped behavior on source and built fixtures. |
| FR-002 | Yes | T002, T003, T006 | Four code points per group, prefix and case, whitespace, selection, wrapping and physical RTL order. |
| FR-003 | Yes | T002, T003, T006, T011, T013 | Compact eligibility, both disclosure directions, complete accessible reading and focus after disclosure or host replacement. |
| FR-004 | Yes | T002, T003, T006, T011, T013 | Native input, activation-time text, connected dispatch, status timing, identical outcomes in a burst and separate disclosure effects. |
| FR-005 | Yes | T002, T006, T011, T013 | Actual wrapping, computed text enlargement, token-sized controls and painted focus across themes and forced colours. |
| FR-006 | Yes | T003, T004, T007–T013 | Generated declarations, package entry points and usage, MINOR changelog, three Storybook states, six pinned captures and built proof. |
| SC-001 | Yes | T002, T003, T005, T006, T008 | Direction, exact group and selection boundaries, default behavior and Copy through replacement, disconnection and bursts. |
| SC-002 | Yes | T002, T003, T005, T006, T008, T011 | Native disclosure state, complete identifier, focus identity and order, and no Copy or host outcome changes through disclosure. |
| SC-003 | Yes | T002, T003, T008, T009, T011–T013 | Separate 320 px and 200% cases, pinned themes and accessibility checks, and trusted grouped and compact Copy and Reveal on the built package under strict CSP. |

**Constitution Alignment**

The component uses the existing token and event conventions. Clipboard access and copy outcomes stay with the host. The plan retains test-only red, assertion-specific replay on the phase base, changed-source mutation, independent review and complete required CI. Op 034 observations run alongside those checks. No constitution conflicts were found.

**Unmapped Tasks**

All 13 tasks support requirements or their verification. The phase runner discovers eight tasks in Phase 1 and five in Phase 2. T005 follows the source, built and manifest tests and precedes T006. T009 follows Phase 1 green evidence. T010 precedes story implementation, and T012 integrates the story inventory and captures before T013. The workflow reviews each phase independently before advancing.

Phase 1 shares `packages/elements/test/scenarios/copy-field.ts` between `packages/elements/test/copy-field.test.ts` in the mutation-retained `elements` project and `packages/elements/test/browser/copy-field.test.ts` in `elements-browser`. The generated declaration test uses `packages/elements/test/node/manifest.test.ts`. T007 owns the canonical manifest and the eight valid full overlays. The malformed JSON Plant retains its intentional parse error. The existing built checks in `packages/elements/test/build/build.test.ts` and the built Copy fixture cover the individual module and browser bundle, which loads the package root.

Phase 2 uses `storybook/test/integration/copy-field-stories.test.ts` as the focused proof in `storybook-integration` and declares `storybook/stories/copy-field.stories.ts` as the implementation story for base replay. One integration owner owns the six baselines and the six existing count suites matched in the plan, along with the affected Plants. If using the supported `ci-only` route for collateral count updates, its allowlist covers `axe`, `visual`, `visual-findings` and `visual-capture`. `storybook-build`, `plant-repo` and the new behavioral suite stay in local scope. Neither phase declares parallel ownership. The same integration owner keeps the shared `reviews/pilot-034.md` receipt across both phases.

**Metrics**

- Total requirements and buildable success criteria: 9
- Total tasks: 13
- Coverage: 100%
- Ambiguity count: 0
- Duplication count: 0
- Critical issues: 0

**Next Actions**

The task artifacts are ready for the operator's tasks gate. Op 034 remains an external prerequisite for using the pilot. Its later local receipt at `da730f5abddb3aa109d20b9b5ebabed1a4bc8247` reports replay and local checks for `b247f13a3edf86e36317a3ec1fcde6e5da875fe2`. The receipt leaves full required CI and the matched hosted mutation benchmark pending. Before applying the pilot, link the signed readiness evidence to the exact approved runnable tooling revision, head, base and tested merge, and record the hosted checks. Preserve required control checks and leave reuse savings pending until an eligible matched pair is verified.
