---
phase: 3
round: 1
verdict: changes_requested
base: 2004e82030df9c56f99913efa99c0ffda3a705e6
head: 5c4dc14
tdd_check: pass
---

# Phase 3 review, round 1

Scope: `git diff 2004e82..5c4dc14` (User Story 2, `ocelle-form-input`), with no uncommitted change. Outside
`specs/`, HEAD's tree is the same as `b76d4ee`'s (`git diff b76d4ee HEAD -- . ':!specs'` is empty). So the plant run
and the gate runs recorded at `b76d4ee` (`plants.md`, `stop-1.md`) apply to HEAD's code unchanged.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | packages/elements/test/scenarios/form-input.ts:730-736 (commit `8e5ba07`) | The "Edge case, error while focused" cell was loosened after its red commit, and the replacement is not stricter. The red form asserted `focus: inField(tag)`, that is `["<tag>#t", "input#control"]`. The corrected form strips every entry to its `#id` and asserts `["#t", "#control"]`. The reason given ("the first-load host's tag is the fresh one firstLoad gave it") covers only the host entry, and only in process: `test/in-process.ts:510` gives a fresh `ocelle-first-load-N-T` tag, while the fixture driver (`test/browser/driver.ts:365`) keeps the scenario's tag. Nothing explains dropping `input` from the inner entry. As written, focus on any element with id `control` in any host with id `t` passes, so the cell no longer checks that focus is on the native input (spec Edge Cases: "focus still in the field"). Principle VIII says a red test that turns out wrong is replaced by a stricter one. This replacement is weaker in a part that was not wrong. | Keep the inner entry exact (`"input#control"`). Pin the host entry as tightly as the harnesses allow, with no harness condition: for example, a host entry that matches `/^ocelle-[a-z0-9-]+#t$/`, or the tag `firstLoad` actually used, if the driver exposes it. Record the reason in the commit. |
| R1-02 | note | packages/elements/test/scenarios/form-input.ts:188-189, :215-216; packages/elements/src/form-control.ts:302-304 | I judged the End presses added in `8e5ba07` not weaker: no assertion changed, and End fires no `input` or change event. They do hide a difference from the native control, though. I measured it in Chromium 153 (build 1243) with a throwaway Playwright script. A native `<input value="draft">` that gets `focus()` and then typed `x` gives `xdraft`. A native input refocused after typing `ab` gives `abc` (the selection is kept). A `delegatesFocus` host that gets `focus()` selects the whole field, so typing `x` gives `x`. So after `element.focus()` from script (a host focusing a field with an error, say), the user's first keystroke replaces the value, which a native input does not do. Tab selects all in both, as the comment says. Spec US2-14 and FR-021 ("`focus()` on the host focuses the inner control") do not settle caret placement, so this is not a defect against the spec. | Optional: decide whether `focus()` should keep the native caret behaviour (for example by focusing `control()` directly), and if so add a twin row for it red first; otherwise state the behaviour in the README. |
| R1-03 | note | commit `90cbb71`; packages/elements/test/form-input-rules.test.ts:147, :377, :430 | Three behaviour fixes (image-button default button, the `type` attribute written back on removal, an error change while hidden starting a wait) were committed together with the tests that found them, with no test-only commit and no red log. I supplied the missing red evidence. In a scratch clone I ran `form-input-rules.test.ts` as at `90cbb71` against `src/form-control.ts` and `src/ocelle-form-input.ts` as at `8e5ba07`. The result was 3 failed of 30, exactly these three tests, each on an `AssertionError` (no setup or import error). So the tests are not vacuous and the bugs were real. Adding mutation-kill rule tests after green follows phase 2's accepted pattern (`notice-rules.test.ts`, `reviews/phase-2/round-1.md:36`). | For later phases: a behaviour bug found during green gets a test-only commit and a kept red run before its fix. |
| R1-04 | note | specs/010-feedback-forms/tasks.md stop-and-ask list ("Any mutation shard over CI's job limit"); plan.md decision 11 § Known gap; .github/workflows/ci.yml:89 | The rewording of the stop to "10 minutes, or 45 for a shard holding `packages/elements/src/`" follows the operator's decision (`decision-split-shard-change.md`, item 2). On this branch CI's `mutation-shard` job is still `timeout-minutes: 10`. Op 015 (`ce1d9c7`) is not an ancestor of HEAD; `git merge-tree HEAD origin/main` merges cleanly, and `origin/main`'s ci.yml:90 has the 45-minute expression. Three `form-control.ts` shards are estimated at 623 to 749 s on this container (`stop-1.md`), not measured. So a CI run of this branch before `main` is merged can time out on those shards. That is a red check from the missing merge, not a defect of the phase. | At landing, merge `main` before judging the `mutation-shard` jobs, and confirm in CI that no element shard comes near 45 minutes. |
| R1-05 | note | specs/010-feedback-forms/reviews/phase-3/design-change-3.md § Decision (op 017 "can start from `971c431`, `0d99aa5` … `253292f`"); mutation.md § Split and revert | The revert is clean (see Checks), and leaving the design reds in `red-commits` is sound for the fold. `fold-history.sh` keeps `971c431`, `666bb70`, `5c2ef49` and `999e903` as red commits and their parents. Each red commit's diff against its parent is then unchanged, so `tdd-check.sh` check 1 still holds, and the reverted gate files are back to their base content at HEAD, so they are not among the final tests. The fold folds away `0d99aa5`, `9a91a92` and `253292f`, though, and remaps `971c431` and `5c2ef49`. After the phase 3 fold, the SHAs design-change-3.md gives op 017 exist only in `refs/ocelle/prefold/phase-3/…` and the `archive/…-prefold-phase-3` branch the fold gate pushes. No `claude/042-mutation-shards-by-count` branch exists yet. | Before the phase 3 fold, create op 017's branch at `253292f` (or record that op 017 starts from the archive branch). Keep the archive branch. |
| R1-06 | note | packages/elements/test/in-process.ts, test/browser/driver.ts (the phase 3 steps of `772ba41`) | No test in `driver.test.ts` covers the driver steps added in the red commit (`axDetails`, `listen`/`heard`, `validity`, `ids`, `typeOf`, `has`, `call`, `propertyIn`, `pseudoIn`, `instanceOf`, chorded `press`). Neither the plan nor the tasks require one: plan.md:207 scopes `driver.test.ts` to phase 1, and contracts/testing.md § Driver steps names its own-test rule only for `drive.after`. The steps are exercised in both harnesses, and every twin row also asserts the table's absolute outcome (form-twins.ts:1-5), so a step that returned a constant would fail there. `call` uses optional chaining (`target[method]?.(...)`), so a missing method reads `undefined` rather than throwing. | Optional: make `call` throw on a missing method; consider step tests in phase 4 if it adds steps. |

No other finding. I checked and accepted the remaining points raised:

- **`composed: true` on the submit event** (US2-3, form-input.ts:202). The scenario's form has a submit button (`<button id="go">`), so Enter clicks the default button. I measured native Chromium 153: implicit submission through a default button dispatches `submit` with `composed: true`, while `requestSubmit()` and a form without a button give `false`. The expected value is the native fact, and the spec does not state it. Not weaker.
- **The US2-22 "announced, hidden and revealed" wait** (form-input.ts:645-647). The scenario says the first error is announced before the hide. Without the wait, on the fixture pages the hide cancelled the first write, because of R-02 step 2's pre-load floor. The window right after a first load is still covered in both harnesses: both FR-027 merge cells set `error` in the first task after the load and assert their counts. So this is not phase 2 R1-01's pattern. Not weaker.
- **US2 plant cells in process only.** contracts/testing.md:231 gives the US2-18 cell with no harness, while it names both for US1-10. No US2 row names `startDocument`, so T034 puts no US2 cell in `test/browser/plants.test.ts`. Accepted as `plants.md` says.
- **`vitest.config.ts:92-94`** pre-bundles `lit/directives/class-map.js` and `live.js` for the `elements` project (and so for `vitest.mutation.elements.config.ts`, which reuses that project). It is configuration only, adds and changes no assertion, and the source imports both directives (ocelle-form-input.ts:11-12). Fine.

## Test quality

- **Red evidence.** `tdd-check.json`: `pass`, with no problems. `772ba41` (`phase`) failed 202 of 3725 tests. The failures I sampled in `red-phase.log` are all `AssertionError`s or "promise rejected … instead of resolving" on a scenario's assertion message. None is an import or setup error. Final tests against the scaffold `f9f3699`: exit 1, 247 failed, each on an assertion (`check-final-tests-on-scaffold.log`). Against the base: exit 2, on the missing `ocelle-form-input` module, which T029a expects. That is why the scaffold run is the evidence. The scaffold adds only the two class signatures. `design-1` and `design-2` are history of the moved T041a/T041b (R1-05).
- **Changes after red** (`git diff 772ba41 HEAD` on test paths): form-input.ts (the four corrections of `8e5ba07`: R1-01 is weaker, R1-02 and the two items above are not), the type-only cast in test/browser/driver.ts:497, and two new test sets: `fold()` cases in test/node/manifest.test.ts:183-229 and test/form-input-rules.test.ts (`90cbb71` onward). Nothing was skipped, deleted or loosened apart from R1-01. `gate:test-lint` found no assertion-free, skipped, focused or conditional-assertion test. The `if` statements in form-twins.ts:67-78 select a row's steps, not its assertions.
- **Coverage.** Scenarios 1 to 23 of US2 each have a cell (form-input.ts, form-twins.ts), and so do FR-027's merge, the Edge Cases, the twins table (with absolute outcomes), and the keyboard paths Tab, Shift+Tab, Enter and Enter-then-blur.
- **Mutation.** I ran `pnpm run gate:mutation -- --base 2004e82` at HEAD: exit 0, "496 mutants on the changed lines of 4 files, none survived; 2 timeouts, 110 compile errors, 1 zero-mutant entry; 5 equivalent records", 26:28. That matches run 5.
  - Timeouts (`form-control.ts:472`, `:473`, `connectedCallback()` emptied or `super.connectedCallback()` removed): the element never renders, so these are kills, as `mutation.md` § Compile errors and timeouts says.
  - Equivalent records, each read against the source and Lit 3:
    - `form-control.ts:478`, `super.disconnectedCallback()`: the class has no reactive controller and uses only the synchronous `classMap` and `live` directives. Equivalent.
    - `form-control.ts:530`, `super.updated()`: `ReactiveElement.updated()` is empty and `LitElement` does not override it. Equivalent.
    - `ocelle-form-input.ts:55`, `type`'s options to `{}`: Lit wraps the class's own accessor, which writes the attribute itself, and reflects nothing (`reflect` is undefined). Equivalent.
    - `ocelle-form-input.ts:57`, `reflect: true` to `false`: with `noAccessor` Lit's accessor never calls `requestUpdate("type", …)`, and the only other `requestUpdate()` calls (form-control.ts:228, :245, :263, :413, :422, :447, :488) pass no name, so no reflection is ever queued for `type`. Equivalent.
    - `ocelle-form-input.ts:178`, `name === "value"` to `true`: `defaultChanged()` writes nothing while dirty. While not dirty, `current`, `lastCommitted` and `initialValue()` agree: every `value` attribute change, construction, reset and `defaultChanged()` set them together, and only an edit, a script value or a restore changes `current`, each setting `dirty`. `syncFormValue()` (form-control.ts:334-336) depends only on `current`. Equivalent.
  - **The 255 kills first made by timing cells.** `mutation-recheck.log` lists 255 suspects: 207 `KILLED rules`, 39 `KILLED scenarios` and 9 `SURVIVED`, which matches mutation.md § Kills checked for an assertion. I re-applied the eight non-equivalent survivors to HEAD's source in a scratch clone and ran only `test/form-input-rules.test.ts` (fake clock, no in-process timing). Each fails exactly one named rule test on its assertion, and the unmutated run gives 44 of 44 passed:
    - `:243` (syncFormValue): "a named input with no value…";
    - `:462` body emptied, `:462` `moving = false`, `:480` and `:496`: "moved after its error was written…";
    - `:491`: "another attribute changed during the wait…";
    - `:520`: "an error that goes back…";
    - `ocelle-form-input.ts:59` (noAccessor): "type set by the property to an unknown value…".

## Checks run

All at HEAD `5c4dc14`, in this container, one job at a time, `OCELLE_CHROMIUM_PATH` set:

| Check | Result |
|---|---|
| `pnpm test` (`gate:unit-tests`) | exit 0, "3771 tests passed in 157 files", 627 s |
| `gate:typecheck` | "no type error in the files of tsconfig.json" |
| `gate:lint` | "312 files checked, no finding" |
| `gate:style-lint` | "16 files checked, no finding" |
| `gate:test-lint` | "218 files checked, no finding" |
| `gate:csp` | "14 files checked, no finding" |
| `gate:prefix` | "262 files checked, no finding" |
| `gate:manifest` | "4 elements checked, no finding"; `pnpm --filter @ocelle/elements run manifest` leaves no diff |
| `gate:contrast` | "165 pairs checked in light, 173 in dark (154 required per theme)" |
| `gate:brand-rules` | "7 rules checked" |
| `gate:pins` | "5 manifests checked, no finding" |
| `gate:config-copies` | the two story-config copies identical |
| `gate:signoff -- --range 2004e82..HEAD` | "28 commits checked, no finding" |
| `gate:storybook-build` | "built 21 stories" |
| `gate:axe` | "42 story-theme runs, 0 serious or critical" |
| `gate:visual` (`OCELLE_VISUAL_ENGINE=docker`) | "42 captures match their baselines" |
| `gate:mutation -- --base 2004e82` | exit 0, as above, 26:28 |
| `gate:plants` | not re-run: HEAD's non-spec tree equals `b76d4ee`'s, where `plants.md` records exit 0, "301 plants … every plant as expected" (67:33). I read the 24 US2 rows' lines in `plants.md`: each turns its named body red. |
| Revert check | `git diff 666bb70 HEAD` on `gates/lib/mutation/shards.ts`, `gates/bin/mutation.ts`, `gates/test/mutation-shards.test.ts`, `gates/test/mutation-fakes.ts`, `gates/README.md`, `package.json` and `pnpm-lock.yaml` is empty. `git diff 2004e82 666bb70` on the same files is empty too, so the gate code is as at the phase base. Only the pinned counts in `gates/test/manifest.test.ts` and `gates/test/integration/manifest.test.ts` and the manifest plants' copies differ from the base, which T034b and T039 expect. |
| Tasks | Every `## Phase 3:` task is `[X]` except T041a and T041b, which are `[-]`, moved to op 017 by the operator's decision. The story scripts count only `[ ]` and `[X]` (common.sh:107, units.sh:37). T041's README, CHANGELOG, engine floor (`engine-floor.md`: no feature above Chromium 120 or WebKit 16.4), plants, gates and whole-diff mutation run are present. |
| Constitution | `ocelle-` names and an `ocelle-form-input-change` event with `bubbles` and `composed` (ocelle-form-input.ts:192); no I/O in the element; token-only styles with forced-colours rules (form-control.ts:60-165; style-lint clean); no ID reference crossing the shadow root (the inner field's `aria-labelledby` and `aria-describedby` name nodes in its own shadow root, ocelle-form-input.ts:251-252); strict CSP clean on the fixture pages (`browser/form-input.test.ts` asserts clean recorders). Stories and baselines for the input belong to phase 5 (US4), so none are expected here. |

Experiments ran in a scratch clone with its own copy of `node_modules`. The repository tree is unchanged by my runs
(`git status` clean apart from this file).

## Earlier findings

None: this is round 1.
