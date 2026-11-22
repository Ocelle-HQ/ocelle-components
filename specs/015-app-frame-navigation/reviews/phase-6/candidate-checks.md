# Phase 6 candidate checks

## Test-first evidence

- Phase 6 starts at `b5119f3`. Scaffold `67cfc03` renders an inert native control. Initial tests-only commits `ed1f5c7` and `1b25b2a` establish the source and built fixture checks. The final replay uses tests-only checkpoint `9dba5e2`.
- The first built run exposed a locator that could not find a slotted link from inside the dialog locator. After fixing the fixture, the expanded-to-narrow resize, real drawer opening and dismissal, projected link focus and menu restoration all passed. The strict-CSP recorders were clean. Skip activation left focus on the inert control, with the next Tab on the menu.
- The final scaffold replay reports four source failures and one built failure at the intended visibility and focus checks, with eight passes. The same workflow passes with the focus transfer in place.
- The complete selected shell, navigation, skip, export, touch and built fixture suites passed all 109 cases. The element-node manifest and README tests passed all 1,031 assertions.
- The native control stays visually hidden until keyboard focus. On activation a direct reference takes priority. Otherwise the first selector match in the containing root is used, including when it cannot receive focus. Native focus leaves the control focused after a failed attempt.

## Mutation checks

- The isolated Stryker run scored 100%. It killed 10 mutants, rejected five at compilation, and reported one invalid custom-element registration at runtime. It reported zero survivors, uncovered mutations or timeouts.
- After the token-only visibility adjustment, replaying the exact empty-stylesheet mutation failed the keyboard reveal test at the idle opacity assertion. The final related suite still passed 109/109.

## Assets and gates

- The Storybook index has 300 stories and 600 baselines. The injected axe fixture has 602 story-theme runs. The manifest describes 38 elements, including the standalone skip link.
- Pinned Docker captured all six new story-theme images twice. The keyboard-focus stories reserve space for the focused control above the sample title. Axe passed all six cases with zero findings and no notes.
- The color-ink plant reports three additional light differences and three matching dark captures. All 13 targeted manifest and Storybook plants produced their expected results. The sequential inventory test selection passed 54/54.
- Code lint, test lint, style lint, TypeScript, manifest, element build and built-output CSP passed. The pack and build assertions passed 5/5.
- Full hosted checks and independent review remain pending.
