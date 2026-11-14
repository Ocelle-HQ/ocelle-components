---
phase: 2
round: 1
verdict: changes_requested
base: 4980f66206b3362a0cd3775c73ad39f053ca9ec4
head: c8792fc721428357cca82a6d7f521062f86b53ae
tdd_check: pass
---

# Phase 2 review, round 1

Change under review: `git diff 4980f66..c8792fc` (User Story 1, `ocelle-listbox` and `ocelle-option`), no
uncommitted change. The operator decisions of `reviews/phase-1/operator-decisions.md` and
`reviews/phase-2/operator-decisions.md` (docker-only baselines with the recorded no-podman note; the single axe
exception for the scrolling listbox story's clipped options, FR-051 amended) are taken as given and are not findings.
The missing `Signed-off-by` on the orchestrator's operator-decision commits `cd034d1` and `50ff132` is a known
orchestrator issue that the phase fold clears; it is not a phase finding.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | `packages/elements/src/selection.ts:332-336`, `packages/elements/src/ocelle-listbox.ts:122-125` | A host `value` set (property, or the `value` attribute through `attributeChangedCallback`) in the same task as a removal or move of the focused option loses focus to the body. The removal's `focusout` (relatedTarget `null`) sets `blurred` and queues the R-03 microtask, but the setter runs first: `SelectionModel.set` calls `this.#source.take()` and throws the removed nodes away, processes the batch with `hadFocus = this.#record.focused` (already `null` after the `focusout`), and the setter applies `#apply(null)`, discarding any focus target. The `focusout` microtask then finds no records (`afterBlur`, `records.length === 0` returns null), so nothing refocuses. Measured on the built browser build in Chromium (Playwright, beta focused in `alpha beta gamma delta`, settled two frames after): `beta.remove()` alone moves focus to `gamma`; `beta.remove(); lb.value = "gamma"` and `beta.remove(); lb.setAttribute("value", "gamma")` leave `document.activeElement` on the body; `lb.append(beta)` alone keeps focus on beta; `lb.append(beta); lb.value = "beta"` and even `lb.append(beta); lb.value = "alpha"` (the current value, which FR-010 makes a no-op) leave focus on the body. This breaks FR-011 / US1-14 (focus moves to the next enabled option), US1-21 and data-model § Transitions (a moved child that had focus is refocused), and constitution III's keyboard model; a host re-render that reorders the options and writes `value` in one task (the common Svelte / htmx pattern R-03 is about) drops keyboard users on the body. No test covers a value set in the task of the removal or move. | Test first (Principle VIII, a `fix-1` red commit): add scenario bodies to `test/scenarios/listbox.ts` (run in both harnesses) and a `SelectionModel` case to `test/selection.test.ts` for the focused option removed, and moved (including re-inserted in place), followed in the same task by a host set of `value` by property and by attribute, a new value and the current value, asserting focus (FR-011 target / the moved option), selection, tab stop and no event. Then fix so the records the setter takes still feed R-03's focus record: e.g. the setter runs the taken records through `takeBlurred` (with the `document.activeElement` body-or-null test) and the listbox applies the resulting focus target, or the taken removals are kept for the pending `afterBlur`, so the outcome is the same as without the set. |
| R1-02 | note | `packages/elements/src/ocelle-listbox.ts:145` | The equivalent-mutant record for the `aria-label` read rests on Chromium alone ("WebKit is not measured"). Acceptable for this phase since the test harness is Chromium-only, but the record should be revisited if a WebKit project is added. | None now. |
| R1-03 | note | `packages/elements/src/ocelle-listbox.ts:222` | The R-03 microtask passes `document.activeElement === document.body` as "focus left"; data-model § Selection state says "the body or `null`". Chromium never reports `null` here in the measured cases, so this is not observable in the current harness. | Optionally test `=== null` too, for engines that report no active element. |

## Test quality

- Red evidence: `red-commits` lists `phase d8a4f49` (test files only); `red-phase.log` exits 1 with 282 of 3421 tests
  failing, every listed failure an `AssertionError` on the missing behaviour (scaffold stubs return `null` / `""` /
  throw "not implemented" from `attachInternalsTo`, which the element tests read as missing behaviour, not as an
  import or syntax error). `tdd-check.json`: `pass`, final tests on the base exit 2 (no test file at the base), on the
  scaffold exit 1, at HEAD exit 0, no problems.
- Scaffold (`768fe5b`): signatures only (stubs returning empty values or throwing), no test file, no `define` call;
  the final tests fail against it (`check-final-tests-on-scaffold.log`).
- Tests changed after the red commit (`git diff d8a4f49..HEAD` on test files): pinned counts moved with the new
  elements, pairs and stories (manifest 2 to 4, contrast `--print` 298 to 310, story-themes 42 to 56, axe 10 to 22
  excepted notes, the axe expectations now list each excepted node exactly); the harnesses moved from `it.each` to one
  `it` per body with identical assertions; R-05's body made stricter (also reads `value` and `aria-selected` in the
  task); the scrolling story's export renamed so its id matches. Nothing was loosened, skipped or deleted; nine
  bodies and in-process tests were added after the mutation run. Reasons are recorded in `notes.md` and `plants.md`.
- Assertions: every scenario body returns its observations and is compared with `toEqual` against a full expected
  object, paired with a "beside" positive read where the outcome is a "does not"; no `skip`/`only`, no conditional
  assertion, no snapshot-only test found (`gate:test-lint` passes). The axe test in `test/listbox.test.ts` asserts the
  passing rule and the roles axe reads, so it cannot pass with axe seeing nothing.
- Coverage: US1-1 to US1-23 each have a body, plus the spec's listbox Edge Cases and the R-03/R-04/R-05 pairings;
  every key path (ArrowUp, ArrowDown, Home, End, Enter, Space, the unhandled keys) and both events with their payloads
  are asserted. Gap: R1-01 (value set in the task of a focused option's removal or move).
- Plants: `plants.md` records 41 plants, each biting at least one test, four first-run misses handled by stricter
  bodies or a corrected plant before the green commit.
- Mutation (`pnpm run gate:mutation -- --base 4980f66`, run by this review): 613 mutants on the changed lines of 7
  files, none survived; 0 timeouts, 209 compile errors, 1 zero-mutant entry (`src/index.ts`, re-exports only), 10
  equivalent records. Each record read: Lit property options for `label`, `value` (listbox) and `value` (option)
  (the class accessors do the work); the listbox `value` attribute branch and its `""` replacement (Lit's path calls
  the same setter; a removed attribute selects nothing either way); the `aria-label` read (R1-02); the non-option
  `focusout` guard (`focused` is already null when a non-option descendant has focus); roving's `behind` list (read
  only after every `ahead` child is disabled); `hostDisconnected` (a re-added identical listener is deduplicated and
  `owns` reads `defaultPrevented`); `focusVisible` (Chromium shows the ring after a keyboard focus anyway). All
  accepted as equivalent.

## Checks run

On HEAD `c8792fc`, one at a time, with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`
and `OCELLE_VISUAL_ENGINE=docker`:

| Check | Result |
|---|---|
| `gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:style-lint`, `gate:brand-rules`, `gate:pins`, `gate:config-copies`, `gate:prefix` | exit 0 |
| `gate:contrast` | exit 0: 166 pairs in light, 174 in dark, 155 required per theme |
| `gate:manifest` | exit 0: 4 elements, no finding |
| `gate:csp` | exit 0: 15 files, no finding |
| `gate:storybook-build` | exit 0: 28 stories |
| `gate:unit-tests` | exit 0: 3444 tests in 150 files |
| `gate:visual` | exit 0: 56 captures match (docker only, no cross-engine comparison; operator decision) |
| `gate:axe` | exit 0: 56 story-theme runs, 0 serious or critical, 22 notes all excepted (the Prose document's 10 and the scrolling listbox story's 12, the operator's one exception) |
| `gate:signoff -- --range 4980f66..HEAD` | exit 1: 2 findings, only `cd034d1` and `50ff132` (the orchestrator's records; known, cleared by the fold, not a phase finding) |
| `gate:mutation -- --base 4980f66` | exit 0 (above) |
| `gate:plants` (`OCELLE_VISUAL_ENGINE=docker`) | exit 0: 301 plants of 17 gates and the registry, every plant as expected |
| Probe (scratch, not committed): Playwright on `dist/browser/ocelle-elements.js` | R1-01's six cases |

Also checked: every task of `## Phase 2:` (T010 to T028, T027a, T027b) is ticked and its work is present (spike
record, scaffold, red commit, sources, R-17 pairs with the counts moved, manifest, README and CHANGELOG entries, 14
listbox baselines, 12 exception entries with their 12 Complexity Tracking rows in plan.md, `plants.md`, the gate run in
`notes.md`); T027's gap note is superseded by T027a as recorded. Constitution: `ocelle-` names and events
(`ocelle-listbox-change`, `ocelle-listbox-activate`, bubbling, composed, not cancelable), no I/O, token-only styles
with variant rules inside `@media not (forced-colors: active)`, roles through internals and no ID reference across a
shadow root, the full listbox keyboard model and the focus ring on all four sides, no inline style in the stories,
seven stories per state with light and dark baselines. Plan: module layout, the internals symbol, `part="list"`
padding and `tabindex="-1"`, the raised `::after` ring and the batching design are as `plan.md` and research R-01 to
R-18 state, except R1-01's gap in R-05's setter path.

## Earlier findings

None: this is the first round.
