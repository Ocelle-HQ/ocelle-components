---
phase: 2
round: 2
verdict: approved
base: 4980f66206b3362a0cd3775c73ad39f053ca9ec4
head: f40d949503cb7672faec1c7ab25f03717765b241
tdd_check: pass
---

# Phase 2 review, round 2

Change under review: `git diff 4980f66..f40d949`, with this round's focus on the round 1 fixes
(`git diff f21a9ba..f40d949`: red `4f3271c`, fix `37e5ee5`, follow-up `2348584`, check `f40d949`). There is no
uncommitted change. The operator decisions of `reviews/phase-1/operator-decisions.md` and
`reviews/phase-2/operator-decisions.md` are taken as given, as in round 1. That covers the docker-only baselines with
the no-podman note, and the single axe exception for the scrolling listbox story with FR-051 amended. The missing
`Signed-off-by` on the orchestrator's commits `cd034d1` and `50ff132` is a known orchestrator issue that the phase fold
clears, so it is not a phase finding.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | `packages/elements/src/ocelle-listbox.ts:145` | R1-02 is deferred as the fix note says: the equivalent record for the `aria-label` read still rests on Chromium alone. | None now; revisit if a WebKit project is added. |
| R2-02 | note | `packages/elements/src/ocelle-listbox.ts:244-247` | The R1-03 fix adds a `null` branch to `focusLeft()` with an equivalent record ("Chromium reports the body, never null"). That is consistent with R2-01: it is untestable in the Chromium-only harness and is kept for other engines. | None now. |

No blocking finding.

## Test quality

- Red evidence: `red-commits` now lists `phase d8a4f49` and `fix-1 4f3271c`. `4f3271c` changes only test files
  (`test/scenarios/listbox.ts`, `test/selection.test.ts`). `red-fix-1.log` exits 1 with 25 of 3469 tests failing:
  - the twelve `R1-01:` bodies in both harnesses (12 + 12);
  - the `SelectionModel` case.

  Each failure is an `AssertionError` on focus or on the setter's return value, which is the missing behaviour.
  `tdd-check.json`: `pass` on both red commits, with the final tests failing on the base (exit 2) and on the scaffold
  (exit 1), and passing at HEAD (exit 0).
- The new bodies cover what round 1 asked for. The focused option is removed, moved to the end, or re-inserted in
  place, and the host then sets `value` in the same task, by property or by attribute, to a new value (`gamma`) or to
  the current one (`alpha`). Each body asserts focus, the tree, the tab indexes, `value` and that no event fired, all
  with one `toEqual` against the outcome without the set. The model case also asserts that the later `afterBlur` finds
  nothing left, and adds a `focusLeft` false case that does not refocus.
- Tests changed after the fix-1 red commit: `2348584` only adds an explicit `false` to five existing
  `model.set(...)` calls in `test/selection.test.ts`, because the parameter became required. There is no pending blur
  in those cases, so the outcome does not change and nothing is loosened. No test was skipped, deleted or weakened
  (`git diff 4f3271c..HEAD -- packages/elements/test`).
- `changeAndSet`'s early `return` is a guard in a page helper, not a conditional assertion.
- Mutation: this review ran `pnpm run gate:mutation -- --base 4980f66` on HEAD.
  - Result: 617 mutants on the changed lines of 7 files, none survived. It also reports 0 timeouts, 211 compile errors,
    1 zero-mutant entry (`src/index.ts`) and 11 equivalent records.
  - Ten of the records are the ones read and accepted in round 1.
  - The new one is `focusLeft()`'s `null` branch (R2-02), accepted.
  - The surviving default-parameter mutant the implementer reports was removed by making the parameter required
    (`2348584`).

## Checks run

All run on HEAD `f40d949`, one at a time, with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`
and `OCELLE_VISUAL_ENGINE=docker`:

| Check | Result |
|---|---|
| `gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:style-lint`, `gate:brand-rules`, `gate:pins`, `gate:config-copies`, `gate:prefix` | exit 0 |
| `gate:contrast` | exit 0 |
| `gate:manifest` | exit 0 |
| `gate:csp` | exit 0 |
| `gate:storybook-build` | exit 0 |
| `gate:unit-tests` | exit 0: 3469 tests in 150 files |
| `gate:visual` | exit 0: 56 captures match (docker only; operator decision) |
| `gate:axe` | exit 0: 56 story-theme runs, 0 serious or critical, 22 notes all excepted |
| `gate:signoff -- --range 4980f66..HEAD` | exit 1: 2 findings in 18 commits, only `cd034d1` and `50ff132` (the orchestrator's records; known, cleared by the fold) |
| `gate:mutation -- --base 4980f66` | exit 0 (above) |
| `gate:plants` | exit 0: 301 plants of 17 gates and the registry, every plant as expected |
| Probe (scratch, not committed): Playwright on the rebuilt `dist/browser/ocelle-elements.js` | round 1's six cases plus three more, all correct (below) |

Probe outcomes. In each case beta is focused in alpha, beta, gamma, delta with `value="alpha"`, and the page is read
two frames after the host's change:

- Removing beta, with or without a same-task `value` set by property or attribute, focuses `gamma`.
- Moving beta to the end, with or without a set (a new value, the current value, or two sets in a row), keeps focus on
  beta.
- A host that removes beta and focuses the button after the list before setting `value` keeps focus on that button.
- A blur to nothing, then a move and a set in a later task, leaves focus on the body: no focus is stolen back.

The tab stop and `value` follow the set in every case.

## Earlier findings

- **R1-01 (blocking): resolved.**
  - `SelectionModel.set(value, focusLeft)` (`packages/elements/src/selection.ts:221-227`) runs the records it takes
    through `takeBlurred` before processing them. It processes with `hadFocus ?? record.focused` and returns the focus
    target.
  - The listbox's setter (`packages/elements/src/ocelle-listbox.ts:122-124`) applies that target.
  - The pending `focusout` microtask then takes no records and returns null.
  - The red test came first (`fix-1` in `red-commits`) and the probe confirms the fix on the built bundle.
  - A correction to round 1: its first location `selection.ts:332-336` was a misread line offset. The setter was at
    `packages/elements/src/selection.ts:216-220` in `c8792fc`. The finding itself stands as stated and is resolved.
- R1-02 (note): deferred, see R2-01.
- R1-03 (note): fixed. `focusLeft()` tests the body or `null` for both the setter and the microtask, with an
  equivalent record for the branch Chromium cannot reach (R2-02).
