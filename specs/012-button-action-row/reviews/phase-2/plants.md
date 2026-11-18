# Phase 2 plants (T029): the plants of T015 to T018, each run once

Each plant was applied to the element source in the working tree on top of 4d5eb50, the in-process tests
(`npx vitest run --project elements packages/elements/test/button.test.ts packages/elements/test/control.test.ts
packages/elements/test/slot.test.ts`, 102 tests) were run once, and the source was restored. Every plant made the
tests fail (102 of 102 pass without a plant). Run on 2026-11-14 in Chromium 1248.

| Plant | Result | Failing tests (first ones, as Vitest abbreviates them) |
|---|---|---|
| guard ignores disabled (US1-3, T017) | 1 failed, 101 passed (102) | stops every click while the control is not available: a click dispatched on a disabled button's inner control reaches neither document nor the activate event, while one dispatched on its enabled twin' |
| no host listener (US1-17, T017) | 7 failed, 95 passed (102) | available: a click and an auxclick dispatched on the host (their composed path misses the inner control) are prevented and reach neither document nor a host listener added after upgrade, while the inn; disabled: a click and an auxclick dispatched on the host (their composed path misses the inner control) are prevented and reach neither document nor a host listener added after upgrade, while the inne; stops every click while the control is not available: a click dispatched on a disabled button's inner control reaches neither document nor the activate event, while one dispatched on its enabled twin'; is registered when the element is constructed: an element created by document.createElement and connected later guards its host before a listener the page adds |
| host display inline-block (US1-15) | 1 failed, 101 passed (102) | US1-15: in a flex row beside a taller s… |
| no activate event (US1-2) | 18 failed, 84 passed (102) | a disabled button's click() delivers nothing, while its enabled twin's delivers one click; stops every click while the control is not available: a click dispatched on a disabled button's inner control reaches neither document nor the activate event, while one dispatched on its enabled twin'; US1-2, a pointer click: exactly one oce…; US1-2, Enter on the focused button: exa… |
| cancel not forwarded to the click (US1-18) | 3 failed, 99 passed (102) | US1-18, a pointer click: a listener tha…; US1-18, Enter on the focused button: a …; US1-18, Space on the focused button: a … |
| activation calls requestSubmit() (US1-19) | 1 failed, 101 passed (102) | US1-19: inside a <form> with submit and… |
| hover-bg ground ignored (US1-16) | 4 failed, 98 passed (102) | US1-4, US1-5 (light): each variant's id…; US1-16 (light): a quiet button with gro…; US1-4, US1-5 (dark): each variant's idl…; US1-16 (dark): a quiet button with grou… |
| chrome treated as unknown (US1-4, US1-5, US1-13, US1-14) | 10 failed, 92 passed (102) | US1-4, US1-5 (light): each variant's id…; US1-13, US1-14 (light), primary: on eac…; US1-13, US1-14 (light), secondary: on e…; US1-13, US1-14 (light), quiet: on each … |
| flush hover token changed (US1-14) | 2 failed, 100 passed (102) | US1-13, US1-14 (light), flush: on each …; US1-13, US1-14 (dark), flush: on each m… |
| ring on :focus instead of :focus-visible (US1-10) | 4 failed, 98 passed (102) | US1-10 (light): keyboard focus draws th…; US1-10 (dark): keyboard focus draws the…; US1-11, forced colours with the light p…; US1-11, forced colours with the dark pa… |
| click() not forwarded (US1-2, T017) | 5 failed, 97 passed (102) | the host's click() clicks the inner control: its click passes through the inner control and reaches document with the host as target, once; a disabled button's click() delivers nothing, while its enabled twin's delivers one click; is registered when the element is constructed: an element created by document.createElement and connected later guards its host before a listener the page adds; US1-2, the element's click() method: ex… |
| label not trimmed (T017) | 3 failed, 99 passed (102) | label, trimmed; a whitespace-only label counts as none:…; US1-9: an icon-only button with label="… |
| unscoped ::slotted(*) (T015) | 2 failed, 100 passed (102) | 012 R-10, without base.css: a block ele…; 012 R-10, with base.css: a block elemen… |

The fixture run (test/browser/button.test.ts) shares the same bodies on the built browser build; the plants were not
rebuilt into it.

## Fix round 4 (operator rounds 5 and 6: O3-01, O6-01; T029e)

Each plant was applied to `packages/elements/src/icon-slot.ts` in the working tree on top of the green change (the
scoped rule `.icon-row:not(.bare) > .label { align-self: baseline; }`, over the red commits 19921596 and 082fcd50).
The plan decision 33 scenarios were run once in process
(`pnpm exec vitest run --project elements packages/elements/test/button.test.ts packages/elements/test/slot.test.ts
-t "decision 33"`, 4 tests), and then the source was restored. Without a plant, 4 of 4 pass. Run on 2026-11-18 in
Chromium 1248.

| Plant | Result | What failed |
|---|---|---|
| `.icon-row { align-items: baseline }` in place of the label rule (T029a, T029b) | 3 failed, 1 passed (4) | The block-start checks only: `rowStart` is false for all seven button cases (plain, compact, icon, flush, quiet, link, busy) and for both test-host cases (bare, iconed), with and without `base.css`. Every `baseline` check passes. The icon-only scenario passes. |
| the unscoped `.icon-row > .label { align-self: baseline; }` in place of the scoped rule (T029f) | 1 failed, 3 passed (4) | The icon-only cases only: `centre` is false for `only`, `only-compact` and `only-busy`. `square` and `bare` stay true. The labelled button scenario and both test-host scenarios pass. |

The fixture run (`test/browser/button.test.ts`, `test/browser/slot.test.ts`) uses the same bodies on the built
browser build. The plants were not rebuilt into it.
