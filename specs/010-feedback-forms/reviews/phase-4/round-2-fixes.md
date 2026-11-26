# Phase 4 review round 2 (operator round, landing L1-01): fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O2-01 | fixed: `initialValue()` reads the default selection from the light-DOM options (`listedOptions()`: each `<option>` child and each `<option>` of an `<optgroup>` child, the list a native select with those children has), so a form reset before the first render no longer asks for the shadow select. `firstEnabled()` and `defaultIndex()` take the options they choose among (the native select's for the mirror and `showChoice()`, the light-DOM ones for `initialValue()`). The `control()` comment now says which callers run only after a render and that a reset or restore before it does not ask for the select. A form reset in the insertion's task reports no error, gives the default value at once, and the select then shows it, as a native select. | `e01ecf3` (`red-commits` `fix-2`), `red.sh 4 fix-2`: `"tests_only":true,"red":true,"recorded":true`, exit 1, "3 of 4739 tests failed", only the new tests (`red-fix-2.log`): the FR-024 scenario in process and on the strict-CSP fixture, each failing on its no-error assertion ("FR-024, reset before the first render: no error on the page"; in process `error: Uncaught TypeError: Cannot read properties of null (reading 'options')`, on the fixture page the same `pageerror`), and the rule test, failing on `errors` (three `TypeError`s) and the values. | `packages/elements/src/ocelle-form-select.ts` (`firstEnabled`, `defaultIndex`, `listedOptions`, `control`, `initialValue`); tests: `packages/elements/test/scenarios/form-select.ts` (FR-024 reset before the first render; run by `test/form-select.test.ts` and `test/browser/form-select.test.ts`, which iterate `formSelectScenarios`), `packages/elements/test/form-select-rules.test.ts` (the synchronous rule), `packages/elements/test/scenarios/driver.ts`, `test/in-process.ts`, `test/browser/driver.ts` (a `batch` `reset` operation, so the reset shares the insertion's task) |

Notes:

- Beyond T057a's two test files, the red commit adds the rule test in `test/form-select-rules.test.ts` (a test path):
  the scenario can only read the end state, which `firstUpdated()` corrects whatever the reset computed, so the rule
  test reads the value synchronously after the reset (a marked option inside a group; no marked option with a disabled
  group and a disabled option first; no options) against a native select given the same steps. It is what kills the
  mutants of the light-DOM path. The driver gains the `reset` batch operation the scenario needs.
- Unchanged behaviour, not in the finding: before its first render the select's form value is still none (as before
  the fix, `syncFormValue()` guards on `hasUpdated`), while a native select would already submit its default; the
  scenario reads the form data after the render, where both agree.
- `red-fix-2.log` line 8 had the pnpm store's absolute path under the root user's home; it is written as
  `~/.local/share/pnpm/store/v11` (no other change to the log).
- Checks: `fix-2-gates.md` (`gate:unit-tests` 4739 passed, typecheck, lint, test-lint, manifest exit 0; mutation on
  the changed file 16 mutants, none survived, at its second run; the first did not start, see there) and `plants.md`
  (21 affected plants since `68f4608`, every plant as expected).
