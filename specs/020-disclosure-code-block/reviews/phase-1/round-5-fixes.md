# Phase 1 operator round 5 fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| T015 | fixed | `fix-5` at `4dff9105`. Separate fresh detached elements threw when calling `focus()` and `click()`. | `packages/elements/src/ocelle-disclosure.ts` and `packages/elements/test/disclosure.test.ts` |

`focus()` and `click()` both use the summary lookup. Lit has no render root on a fresh detached element, so
the lookup now returns `null` until the root exists. Each new test confirms the element is disconnected and
has no shadow root, invokes one method, and checks that it returns without throwing and leaves the element
closed. The browser scenarios also exercise rendered summary focus and a single toggle per `click()`.

`red.sh 1 fix-5` recorded the test-only commit with exit 1. The local story configuration temporarily ran
the unit-test gate on the two T015 cases and was restored after the replay. The stored [red log](red-fix-5.log)
names both failed assertions. Direct Vitest output showed `TypeError: Cannot read properties of undefined
(reading 'querySelector')` at the no-throw assertion. The focused configuration applies to local red evidence.

Both full disclosure test files passed all 110 tests in 43.20 seconds, including the in-process and built
strict-CSP browser scenarios. Targeted ESLint, test lint, typecheck and the manifest gate also passed.

The affected selection since `0c459416` includes 21 plants, among them full-repository visual and axe cases.
The phase-base selection remains the full plant set. The operator's CI-first decision assigns the full
plant run and the hosted mutation verdict to required CI.
