# Phase 5 candidate checks

## Test-first evidence

- Phase 5 starts at `f2d1465`. The inert control scaffold is `edf016e`. The first tests-only commit is `1e8d769`; the final scoped replay uses the tests-only checkpoint `4fde805`.
- The original test replay exposed the six missing primitive behaviors and a newer-modal fixture that sent a nonbubbling event. The corrected fixture confirmed that the existing tooltip and drawer already arbitrate Escape in the requested order. The scaffold also passed native first-touch link activation.
- The exact final scoped replay yielded six intended failures across the two new primitives and 12 passes. The same selection with the implementation plus the root export check passed all 19 element and touch cases.
- All 1,031 element-node manifest and README assertions passed. The manifest, plant repository and Storybook integration selection passed 54 assertions.

## Assets and gates

- The Storybook index has 297 stories, yielding 594 repository story-theme runs and 596 for the injected axe plant. The 37-element manifest and its mirror fixtures include both new registrations.
- Pinned Docker captured all 20 new story-theme images twice. The empty nav-pill story includes a page heading to exercise the omitted control on a nonblank canvas. The repeated captures changed only those two provisional baselines. Axe passed all 20 cases with zero findings and no notes.
- The color-ink plant produced eight additional light differences and matching dark captures. All 13 targeted manifest and Storybook plants produced their expected outcomes.
- Code lint, test lint, style lint, TypeScript, the element build, the manifest gate and the built-output CSP gate passed.
- Full hosted checks and independent review remain pending.

## Focus and mutation follow-up

- The initial scoped diagnostic instrumented 65 mutations across the two new elements. It killed 51, rejected 11 at compilation, and reported two survivors and one uncovered branch for a 94.44% score. All three remaining mutations changed public label defaults or the nav pill's blank-label fallback.
- The added assertions pass for both constructor defaults and the nav pill's blank-label fallback. Each exact source fault failed its intended assertion in an isolated worktree.
- At 320 px with forced colors active, the long-label nav pill keeps the same focused link after wrapping, has a visible focus ring and avoids page overflow. Disabling the outline failed the new assertion.
- The combined drawer scenario retains focus on the other control after the first Escape and restores the external opener after the second Escape. The final scoped replay on the scaffold still shows six intended failures and 12 passes. The green browser and touch suite passed 19/19, the build and pack suites passed 5/5, and test lint passed.
