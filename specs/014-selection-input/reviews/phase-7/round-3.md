---
phase: 7
round: 3
verdict: changes_requested
base: 51648060f379f41bd57ed9bf5d0522326fe06b32
head: f01d3b7665ffb735716954a497762d7a47ec60b8
tdd_check: pass
---

# Phase 7 review, round 3

Scope: the fix of operator round 2 (O2-01, FR-054, T114) and phase 7 operator decision 2 (fix first-open focus in
the listbox). Red set fix-2: `ea7eca6` (story test) and `2b73f1f` (listbox test, recorded in `red-commits`). Green:
`11ae954` (listbox), `62805ad` (story), `e8c3cee` (baselines and counts), `5272edc` (records), `f01d3b7`
(tdd-check). `27e9a4a` (landing operator decision 4) is outside this phase and touches no phase 7 file.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | blocking | specs/014-selection-input/reviews/phase-7/plants.md:3-4 | The plant record's base is `ea7eca6^` (`a84a3e1`), not `base.sha` (`5164806`). The selection differs too: `pnpm run gate:plants -- --affected 51648060f379f41bd57ed9bf5d0522326fe06b32 --list` gives `note: affected: every plant, by gates/bin/plants.ts (shared gate source)` and selects 314 of 314 plants, because the landing merge `ac2f991` falls inside the phase range and changes the gate source. The record judges 21. The review procedure (step 5, Plants) makes "another base" and "a different selection" blocking. T114 step 5 (tasks.md:359) told the implementer to use `--affected ea7eca6^`, so the implementer followed the task. The deviation comes from the task, which conflicts with the procedure. | Record in `plants.md` a plant run against `base.sha` with exit 0. Either run `pnpm run gate:plants -- --affected 5164806` (all 314 plants) or use the full `pnpm run gate:plants` run, which judges the same 314 plants, with its full output and exit. The coordinator's detached full run may serve once it ends with exit 0. Keep the round-scoped `ea7eca6^` run as supplementary evidence if wanted. The other way out is an operator decision that accepts the round-scoped base for this landing fold, recorded in `operator-decisions.md`. |
| R3-02 | note | specs/014-selection-input/research.md:117-119, :697-698; tasks.md:356 (T114 step 2); commit title of `11ae954` | These describe the fix as the planner's hypothesis: the listbox "writes the tab stop as soon as it connects, not in its first deferred update". That is not the measured cause. The roving `tabindex` was already written in `connectedCallback` before the fix (`#apply(this.#model.batch())`, ocelle-listbox.ts:140). My rerun of `2b73f1f` confirms it: only `active` differed (`"ocelle-dialog"` instead of `"gamma"`), and the `tabindex` part of the same `toEqual` already matched. What came late was the shadow `part="list"` and `<slot>`, so the options were unslotted and could not take focus. The code comment (ocelle-listbox.ts:141-144), the commit body and notes.md § T114 state this correctly. The design records do not. The behaviour they promise (a tab stop that is focusable at connect) does hold. | Optional, for the planner: change R-03 and R-12 to say that the listbox renders its shadow list and slot (it flushes its first update) when it connects, so its already written tab stop can take focus. |
| R3-03 | note | specs/014-selection-input/reviews/phase-7/tdd-check.json (`final_tests_on_base_exit: 2`), check-final-tests-on-base.log:42 | The base comparison has no evidential value in this round. At `5164806`, with 216 test-path files of HEAD overlaid (most of them brought by the merge of main: fixtures, global setup, helpers), Vitest reports no test result, so the gate prints "could not run: no test file found" (gates/lib/vitest-report.ts:87-88). The check counts any non-zero exit as "fails on base". Before the landing merge (`9be797d`) the same step failed on real assertions. For this round, the evidence that the tests test the change rests on the two red commits. Both are genuine (see Test quality). | None for this phase. The tdd-check limit after a mid-range merge could be raised with the flow owners. |
| R3-04 | note | specs/014-selection-input/reviews/phase-7/{red-fix-2.log,check-*.log} | The committed logs were edited after generation in one place: the pnpm store line reads `<the pnpm store, path redacted>`. Commits `5272edc` and `f01d3b7` say so. No other line differs in kind, and the test outcomes in the logs match my own reruns. This is acceptable as a privacy redaction. | None. |
| R3-05 | note | specs/014-selection-input/reviews/phase-7/tdd-check.json | `head` is `5272edc`, while HEAD is `f01d3b7`. `f01d3b7` changes only the check's own evidence files and `gates.md`, so I did not rerun the (full-suite, four-run) check while the detached `gate:plants` held the machine. | None. |

## Analysis of the listbox fix (`11ae954`)

`this.performUpdate()` as the last statement of `connectedCallback` (ocelle-listbox.ts:145). I read Lit's
implementation (`@lit/reactive-element` 2.1.2, `reactive-element.js:828-834`): `performUpdate` returns at once when no
update is pending. Lit documents that case as calling it early "to flush" the update. On the first update it creates
the render root if needed and restores instance properties saved before upgrade.

- **First connect.** The constructor's `requestUpdate` left an update pending, and `super.connectedCallback()` has
  created the render root and resolved `enableUpdating`. The flush renders the list and slot, runs `updated()` (the
  internals name) and clears `isUpdatePending`. The queued `__enqueueUpdate` microtask then calls `scheduleUpdate` →
  `performUpdate`, which returns because nothing is pending. So the element does not update twice, and
  `updateComplete` still resolves.
- **Reconnects and moves.** No update is pending unless a property changed while the element was detached. In that
  case the flush applies it now rather than one microtask later, which is harmless. A move is disconnect plus connect,
  so a moved listbox does not render again.
- **Created before upgrade, properties set before connect.** Lit saves own `label` and `value` in the constructor and
  sets them through the accessors on the first update. That still happens after `#apply(batch)`, in the same order as
  before, only synchronously within the connect. `value` uses the class's own setter (`noAccessor`), which goes through
  the model as before.
- **No SSR** in this package, so hydration does not apply.
- **Composition.** No other element source composes `ocelle-listbox` (`grep` over packages/elements/src: only
  index.ts, ocelle-listbox.ts and ocelle-option.ts). `ocelle-dialog` and `overlay.ts` are untouched
  (`git diff 2b73f1f..HEAD -- packages/` changes only ocelle-listbox.ts, +5 lines).
- **Operator decision 2.** The fix lies in 014's listbox only, with a listbox unit test that fails first inside fix-2,
  as decided. The decision's wording ("writes the roving tabindex as soon as it connects") repeats the planner's
  hypothesis; see R3-02.

The fix is correct and safe.

## Test quality

- **Red evidence, `2b73f1f` (recorded).** I reran `packages/elements/test/listbox.test.ts` in a worktree at `2b73f1f`:
  1 failed, 67 passed. The failure is the new T114 test, on its assertion: `- "active": "gamma"` /
  `+ "active": "ocelle-dialog"`. Focus fell back to the dialog's close control, which is the missing behaviour and not
  a setup or load error. `red-fix-2.log` shows the same failure, together with the two story tests.
- **Red evidence, `ea7eca6`.** The two story tests (light, dark) failed on their single `toEqual` because the story
  was not built yet: no dialog and no listbox were observed. Their `red.sh` output is quoted in notes.md § T114, since
  `red.sh` keeps one line per label. The two unrelated failures of that run (drawer.test.ts:37, driver.test.ts:298)
  are classified there as load flakes. They pass at the tip (`check-head.log`: 8007 passed).
- **No weakening.** `git diff ea7eca6..HEAD -- '*.test.ts'` shows that the story test is unchanged since its red
  commit. Its focus expectation is still `folderOptions("gamma", "", "gamma")`, with the deep active element compared
  to the `gamma` option (elements-stories.test.ts:1241-1255). `listbox.test.ts` is unchanged since `2b73f1f`. The
  other changed tests are the count updates (axe, visual, storybook-build, plant-repo), which change numbers only.
- **No vacuous assertion.** Each new test is a single `toEqual` over observed state with no conditional, skip or only.
  The listbox test's `shown` and `tabindex` parts already held at red, but `active` discriminates, and the object as a
  whole failed. The optional synchronous-tabindex check was dropped because it already passed before the fix, as T114
  step 1a required.
- **Acceptance.** FR-054's story is covered in both themes: dialog shown and modal, listbox inside it, `gamma`
  selected and focused, on top at its centre, axe full rule set with no violation and no serious or critical
  incomplete, and no request outside the origin.
- **Mutation.** `pnpm run gate:mutation -- --base 2b73f1f --files packages/elements/src/ocelle-listbox.ts`: exit 0,
  "1 mutant on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 0 zero-mutant entries; 0
  equivalent records". A first unrestricted run with `--base 2b73f1f` exited 2 ("There were failed tests in the
  initial test run"). It shared the machine with the detached full `gate:plants`, and the file-scoped rerun passed its
  initial run.

## Counts and baselines

- `storybook/baselines` holds 356 PNGs. `git diff a84a3e1..HEAD --name-status -- storybook/baselines` shows exactly
  two added files (`elements-ocelle-listbox--inside-an-open-dialog.{light,dark}.png`), and none modified or deleted. I
  inspected both: the dialog over its backdrop, the five folders with `gamma` selected (bar) and focus-ringed, and
  Cancel and Open in the footer, in light and dark.
- Each count moves by exactly one story or two story-themes: storybook-build 177 → 178; axe 354 → 356 (plant
  356 → 358); visual 354 → 356 in four places plus `before.size`; plant-repo 354 → 356.
- `fail-token-changed/plant.json` has 150 `location` entries with no duplicate. The new entry is
  `elements-ocelle-listbox--inside-an-open-dialog/light` (`differs`), and `why` says "one hundred and fifty" and names
  the composed story. That is plausible from the light baseline (body text and options in `color-ink`). The record
  says the plant was measured in the pinned container through the `ea7eca6^` plant run, which judged
  `visual/fail-token-changed` as expected.

## Checks run

All runs used `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome OCELLE_VISUAL_ENGINE=docker`.
The detached full `gate:plants` was running throughout.

| Command | Exit | Result |
|---|---|---|
| `vitest run packages/elements/test/listbox.test.ts packages/elements/test/browser/listbox.test.ts` (HEAD) | 0 | 134 tests passed |
| `vitest run packages/elements/test/listbox.test.ts` (worktree at `2b73f1f`) | 1 | 1 failed (T114, `active: "ocelle-dialog"`), 67 passed |
| `vitest run --project storybook-integration storybook/test/integration/elements-stories.test.ts -t "composed ocelle-dialog + ocelle-listbox"` | 0 | 2 passed (light, dark) |
| `pnpm run gate:typecheck` | 0 | no type error |
| `pnpm run gate:lint` | 0 | 475 files, no finding |
| `pnpm run gate:test-lint` | 0 | 347 files, no finding |
| `pnpm run gate:csp` | 0 | 55 files, no finding |
| `pnpm run gate:mutation -- --base 2b73f1f --files packages/elements/src/ocelle-listbox.ts` | 0 | 1 mutant, killed |
| `pnpm run gate:plants -- --affected 5164806... --list` | 0 | 314 of 314 selected (every plant, shared gate source) |
| `pnpm run gate:plants -- --affected 'ea7eca6^' --list` | 0 | the 21 `note: affected:` lines are identical to plants.md |

I did not rerun `pnpm test` in full, `gate:visual`, `gate:axe` or `gate:storybook-build`, to keep the load light next
to the detached plant run. I rely on `check-head.log` (8007 tests passed at `5272edc`; `f01d3b7` changes no code or
test) and on gates.md (visual 356 match, axe 356 runs with 0 serious or critical, storybook-build 178). The targeted
story test above exercises the same story in the built Storybook with axe.

Tasks: every task under `## Phase 7:` is ticked, and T114's work is present (story, listbox fix, baselines, counts,
notes, gates). Constitution: the story markup has no style attribute, uses tokens only (no new CSS), adds no axe
exception (`storybook/a11y-exceptions.json` is unchanged) and makes no outside request (asserted). The keyboard model
is unchanged, and the fix restores FR-007's initial focus onto the listbox's single tab stop.

## Earlier findings

- **O2-01 (operator round 2): resolved in substance.** The story `elements-ocelle-listbox--inside-an-open-dialog`
  exists (storybook/stories/listbox.stories.ts:61-65) as specified, with a red story test first (`ea7eca6`), docker
  baselines (two added, none changed), axe clean, union counts updated, and tasks.md, notes.md and gates.md updated.
  Decision 2's fix carries its own red listbox test (`2b73f1f`), and `red-commits` has `fix-2 2b73f1f`. The one gap is
  the plant record's base (R3-01).
