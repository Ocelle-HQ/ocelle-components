---
phase: 3
round: 1
verdict: changes_requested
base: 83a6f8bb18b847d67dc7309f01e82d683dce181e
head: 4f6b6b5f4088a3a910b876d86ce770f40250105b
tdd_check: pass
---

# Phase 3 review, round 1

Change under review: `git diff 83a6f8b..4f6b6b5` (User Story 2: `ocelle-tabs`, `ocelle-tab`, `ocelle-tab-panel`), with
no uncommitted change. Commits: spike `a061742`, the operator decisions and the planner's amendment (`407764c`,
`82ea0c4`, `56c2040`), scaffold `30a0789`, red `8a59155`, green `9418dc6`, mutation follow-up `9dffb23`, gate run
`5abe235`, check `4f6b6b5`.

The operator decisions in force are taken as given and are not findings:
- the docker-only baselines with the no-podman note (`reviews/phase-2/operator-decisions.md`);
- the single axe exception for the scrolling listbox story;
- `ocelle-tabs` named from `label` only, with the constitution III exception approved in plan.md's Complexity
  Tracking (`reviews/phase-3/operator-decisions.md`).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | `packages/elements/src/ocelle-tab.ts:157-158` | The record says the `ConditionalExpression,StringLiteral` mutants of `if (name !== "value")` are equivalent ("Lit would set the `value` accessor from the attribute, whose setter writes the same attribute value back"). They are not. With the condition forced `true` (the `StringLiteral` mutant `name !== ""` is the same), removing a tab's `value` attribute does not give the tab its index. Lit's attribute path sets the accessor, the setter writes the attribute back, and the tab keeps the old value. Measured in a scratch worktree (in process, Chromium): with three tabs `spec`, `plan`, `tasks`, `removeAttribute("value")` on the third tab gives `getAttribute("value")` `"tasks"` and `value` `"tasks"`. The source gives `null` and `"2"`, as FR-009 and US2-16 require ("with no value ... the tab's index"). The disabled mutant is a survivor: with it applied, `test/tabs.test.ts`, both entry tests and `test/selection.test.ts` still pass (128 of 128). No body removes a tab's `value` attribute; phase 2's listbox has one for the option ("its value attribute removed"), and the option's identical line carries no disable comment. | Test first: add a body to `test/scenarios/tabs.ts`, run in both harnesses, in which a host removes a tab's `value` attribute after render. Assert the tab's `value` attribute stays absent, the tab reads its index, and the tabs' `value` and the next change event report that index. Then remove the `Stryker disable` comment and show the mutants killed in the gate run. |
| R1-02 | blocking | `packages/elements/src/ocelle-tabs.ts:161-162` | The record disables `ConditionalExpression,BlockStatement,StringLiteral,LogicalOperator` on `if (name === "value")` as "equivalent, Lit's own path sets the same accessor". The condition forced `true` is not equivalent. Every observed attribute, `label` included, then goes to the `value` setter, so the tablist is never named. Measured: with that mutant `setAttribute("label", "Other")` leaves the tablist without `aria-label`, where the source names it "Other". The line has no logical operator, so `LogicalOperator` matches nothing. The existing bodies would kill the `true` mutant, but an equivalent record that is false for a mutant it disables breaks constitution VIII's rule that only equivalent mutants are recorded, each with its true reason. | Narrow the disable comment to the mutants that are equivalent (the condition forced `false`, the empty block and the `"value"` string literal, each with its reason) and let the gate run the rest. Record the result in the gate run. |
| R1-03 | blocking | `9dffb23`; `packages/elements/src/ocelle-tabs.ts:342-348`; `reviews/phase-3/notes.md:91-92` | `9dffb23` is labelled `test(...)` but changes behaviour in `sequential()`: an editing host (`contenteditable`, no `tabindex`) now counts as focusable, so a shown panel that holds only one is no longer a tab stop (FR-023, US2-6). The test for it, the `FR-023: the shown panel is a stop while ...` body, is in the same commit. It was never run red, and `notes.md` calls the change "simplifying the source". Measured: the final tests against green `9418dc6`'s `ocelle-tabs.ts` and `ocelle-tab.ts` fail exactly that body (1 of 57), on the contenteditable step (expected `null`, received `"0"`: the panel stays a stop beside a focusable editing host). The test therefore does fail for the right reason, but the red-first and "fixes are test-first" rules of Principle VIII were not followed, and the record misdescribes a behaviour fix as a simplification. The other source edits of `9dffb23` (the `area` branch dropped, the WeakMap `delete` dropped, the disable comments) are not behaviour changes in Chromium. | Record the red evidence and correct the record. Run the `FR-023: the shown panel ...` body against `9418dc6`'s tab sources and keep the output as `reviews/phase-3/red-mutation.log` (or a `fix-1` red entry if the fix is replayed as red-then-green). In `notes.md`, state that counting an editing host is a behaviour fix to FR-023 found by the mutation run. If the branch is still unpublished, splitting `9dffb23` into a test-only red commit and a `fix(...)` commit is the clean form. |
| R1-04 | blocking | `packages/elements/test/scenarios/tabs.ts:940` (US2-21), `:983` (US2-22); `specs/014-selection-input/tasks.md` T062 (phase 4), T093 (phase 6) | The stand-ins are acceptable for this phase. A nested `ocelle-tabs` exercises the outer origin filter with a handled ArrowRight, as the segmented choice's would. `x-shadow-link` is a focusable reached only through an open shadow root with `delegatesFocus`, as `ocelle-link`'s anchor is. But US2-21 and US2-22 name `ocelle-segmented-choice` and `ocelle-link`, and the bodies with the real elements are recorded only in `reviews/phase-3/notes.md`. No task of phase 4 or phase 6 adds them: `grep "US2-21\|US2-22\|scenarios/tabs" tasks.md` finds only T042. As it stands, the acceptance scenarios as written would never get a test. | Track the real bodies durably: amend `tasks.md` (through the planner or orchestrator, as for other artifact changes) so that phase 4 (for example T062) adds US2-21's body with an `ocelle-segmented-choice` in the Plan panel, and phase 6 (for example T093) adds US2-22's body with an `ocelle-link`, both to `test/scenarios/tabs.ts`, run in both harnesses. |
| R1-05 | note | `specs/014-selection-input/research.md:736-755` (R-15 Techniques and "What the tests read") | The tab's selected bar is now the `::before`'s block-end border (`Highlight` border colour in forced colours), not its background. The reason is axe-core 4.14.0's `pseudoContent` incomplete on short labels, recorded in `notes.md`. The test read is as strict as before: thickness, style, colour, block-end and inline offsets, transparent background. The plants "the bar drawn by colour only" and "the bar as an inset box-shadow only" still bite. R-15's technique text still says the bar is a background (`background: Highlight` in forced colours) and that the test reads the background colour. | Optionally amend R-15 for the tab's border bar at the next artifact pass. |
| R1-06 | note | `packages/elements/test/commands.ts:259-264`; `packages/elements/test/scenarios/tabs.ts:183-185`, US2-1 `panelAncestors` | The new `"ancestors"` scope returns `[]` when the target has no accessibility node, so US2-1's `panelAncestors: (...).includes("tablist")` would also be `false` for a panel missing from the tree. In US2-1 this is covered by the `tree` read in the same body (one tabpanel named Spec), and the plant "the tablist role on the host" bites. The scope's own test (`test/ax-states.test.ts:56`) and its plant are sound. | Optionally read the full ancestor list, or its length, in US2-1 so the read stands alone. |
| R1-07 | note | `packages/elements/test/selection.test.ts:448` | The `delivered` case's title says "focus gone elsewhere or no blur gives none". The fourth case (no blur, `g` focused) expects `focus: "g"`, the focused child. The assertion is right and the title is loose. | Optionally reword the title. |

## Test quality

**Red evidence**
- `red-commits` lists `phase 8a59155`. That commit changes only test files, test infrastructure (`test/commands.ts`)
  and `reviews/phase-3/scaffold.sha`.
- `red-phase.log` exits 1 with 168 of 3623 tests failing. Every failure is an `AssertionError`; there is no import,
  syntax or setup error. Against the scaffold the stubs define nothing, and the tests read that as missing behaviour.
- The amended red bodies (implementer point 1):
  - the two listbox bodies (`R-03: a host that removes delta and then the focused beta ...` and `... moves alpha and
    then the focused beta to the end ...`) fail in red in both harnesses (`test/listbox.test.ts:31` and
    `test/browser/listbox.test.ts:41`, two each). At `8a59155` the listbox source is phase 2's, so they fail on phase
    2's code;
  - the tabs counterpart `R-03: a host that moves Spec and then the selected, focused Plan ...` fails in red as well.
- `SelectionModel.delivered` (`src/selection.ts:241-250`) runs the observer's delivered records through
  `takeBlurred`, as the setter and the `focusout` microtask do. `ocelle-listbox.ts:82-87` now uses it. It is a
  phase 2 behaviour fix that came with red bodies, and it is not out of scope.
- `tdd-check.json`: `pass`. The final tests exit 2 on the base and 1 on the scaffold and pass at `5abe235`. `4f6b6b5`
  adds only the check's own outputs, so the check was not rerun.

**Tests changed after red** (`git diff 8a59155..HEAD`, implementer point 2). None is loosened.
- `bar()` / `selectedBar()`: from `block-size` plus `background-color` to `border-block-end-width`, `-color`, `-style`
  and a transparent `background-color`. The read is at least as strict, with one more property.
- `selection-pairs-check.ts`: a `::before` border was not read before and is now read as `bar`. This is stricter.
- `tabs.test.ts`'s in-process axe `passed` list: `aria-required-parent` was replaced by `aria-allowed-role`.
  `aria-required-parent` stays in `runOnly`, so a violation of it still fails through `violations: []`. The red
  expectation was unreachable (axe reports the rule inapplicable to internals-role children, as `listbox.test.ts`
  shows), and the reason is recorded.
- `selection.test.ts` gains one case for the new method.
- `scenarios/tabs.ts` gained 8 bodies in `9dffb23`, additions only (228 lines added, 0 removed). R1-03 covers the one
  that also carries a behaviour fix.

**Assertions**
- Every body returns one observation compared with `toEqual` against a hand-written expected value. Each "does not"
  outcome is paired with its positive read in the same body.
- `gate:test-lint` passes: no `skip` or `only`, no conditional assertion, no assertion-free test.
- Events are read at the document with `type`, `detail`, `bubbles`, `composed`, `cancelable`, target and `value` at
  dispatch.

**Coverage**
- US2-1 to US2-24 each have a body (US2-21 and US2-22 with stand-ins, R1-04).
- The tabs' Edge Cases by name are covered: lone children, duplicate values, the long label at 320 px, host `hidden`,
  second definitions, name follows text, disabled hover.
- Every key path is covered (ArrowLeft and ArrowRight, also under rtl; Home, End, Enter, Space; the unhandled
  ArrowUp, ArrowDown, Escape and letters; keys from panel content), and so are the pointer paths.
- Gap: removing a tab's `value` attribute (R1-01).

**Stand-ins** (implementer point 3): acceptable as stand-ins (R1-04). The tracking of the real bodies is missing.

**The `"ancestors"` scope** (implementer point 5): it has its own test on native roles and a recorded plant ("returns
the node itself and not its ancestors"). R1-06 is a note.

**Plants**: `plants.md` records 52 plants, each biting. One was corrected on its first run ("the tab's name read
once"), with the reason given.

**Mutation**: this review ran `pnpm run gate:mutation -- --base 83a6f8b`, which exited 0.
- 401 mutants on the changed lines of 7 files, none survived.
- Reports: 1 timeout (`ocelle-tabs.ts:369`, `ConditionalExpression` to `false` in `write`), 123 compile errors and
  1 zero-mutant entry (`src/index.ts`, re-exports only).
- 14 equivalent records, each read:
  - accepted:
    - `ocelle-tab.ts:34` (Lit options of `value`);
    - `ocelle-tabs.ts:45` (`"disabled"` in the panel filter: the host observer follows `disabled` subtree-wide with
      `attributeFilter: ["value", "disabled"]`, and its batch re-measures);
    - `:74` and `:76` (Lit options);
    - `:105` (counter direction);
    - `:163` (the replacement string for a removed attribute);
    - `:247` and `:249` (re-observing, or leaving an old panel observed: the callback measures `#shown` only);
    - `:253` (`childList`: the host observer's subtree `childList` re-measures too);
    - `:332` (`null` active element, as phase 2 R1-03);
    - `:360` (the slot check for shadow-root children);
    - `roving.ts:118` (`focusVisible`);
  - not accepted:
    - `ocelle-tab.ts:157` (R1-01: not equivalent, and it survives);
    - `ocelle-tabs.ts:161` (R1-02: partly false).

## Checks run

On HEAD `4f6b6b5`, one heavy job at a time, with
`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and `OCELLE_VISUAL_ENGINE=docker`:

| Check | Result |
|---|---|
| `gate:typecheck`, `gate:lint` (296 files), `gate:test-lint` (198 files), `gate:style-lint` (20 files), `gate:brand-rules`, `gate:pins`, `gate:config-copies`, `gate:prefix` (262 files) | exit 0, no finding |
| `gate:contrast` | exit 0: 166 pairs in light, 174 in dark, 155 required per theme |
| `gate:manifest` | exit 0: 7 elements, no finding |
| `gate:csp` | exit 0: 25 files, no finding |
| `gate:storybook-build` | exit 0: 36 stories |
| `gate:unit-tests` | exit 0: 3640 tests in 155 files |
| `gate:visual` | exit 0: 72 captures match (docker only, no cross-engine comparison; operator decision) |
| `gate:axe` | exit 0: 72 story-theme runs, 0 serious or critical; 22 notes, all excepted (the Prose document's 10 and the scrolling listbox's 12); none on a tabs story; `storybook/a11y-exceptions.json` unchanged |
| `gate:signoff -- --range 83a6f8b..HEAD` | exit 0: 10 commits, no finding |
| `gate:mutation -- --base 83a6f8b` | exit 0 (above) |
| `gate:plants` (docker) | not completed: the run was stopped by this review's own 50-minute `timeout` (exit 124) after 257 plant runs had finished with no failure printed; it was not rerun. The implementer's run on `9dffb23` reports 301 plants, every plant as expected (`notes.md`). Not a finding; the next round should complete it |

Probes in a scratch worktree (not committed, removed afterwards):
- R1-01: the tab-attribute mutant against the tabs suite, and a value-attribute removal;
- R1-02: the tabs-attribute mutants against a `label` attribute change;
- R1-03: HEAD's `test/tabs.test.ts` against `9418dc6`'s `ocelle-tabs.ts` and `ocelle-tab.ts`.

**Also checked**

Tasks:
- Every task of `## Phase 3:` (T040 to T050) is ticked and its work is present: spike record, scaffold, red commit,
  sources, manifest, README tabs section and Host ARIA note, CHANGELOG, 16 baselines for 8 stories, the moved gate
  counts and the `fail-token-changed` findings, `plants.md`, the gate run in `notes.md`.
- Changes outside the tabs:
  - `ocelle-listbox.ts`, `roving.ts` (`moved` hook) and `selection.ts` (`delivered`), each with a reason;
  - `stories-layout.css` (the wrapped story's row width);
  - the manifest plant copies.

Constitution:
- `ocelle-` names. `ocelle-tabs-change` bubbles and is composed, with `{ value }`.
- No I/O.
- Token-only styles, with the variant paint inside `@media not (forced-colors: active)` and `Highlight` in forced
  colours.
- Roles come through internals. Ids are generated in the page's own scope, so no id reference crosses a shadow root:
  `aria-controls` and `aria-labelledby` stay among the light-DOM children, and US2-12 checks it.
- The full tablist keyboard model with one tab stop. The raised `::after` ring.
- No inline style in the stories. One story per state in both themes, each with a baseline.
- The constitution III exception for the tabs' name is in plan.md's Complexity Tracking with scope and sunset, as
  approved.

Plan: the decisions of `plan.md` and R-01 to R-06 are followed, with these exceptions:
- the bar technique (R1-05);
- the operator-approved naming change.

The baselines inspected show the bar, the ring and the panel ring as specified.

## Earlier findings

None: this is the first round.
