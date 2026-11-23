---
phase: 3
round: 2
verdict: approved
base: 2014d993fcaecbef563baa48f2749818014cecb9
head: f391c37929a8459da28ee4b2b0574c083ecffe61
tdd_check: pass
---

# Phase 3 review, round 2

Scope: `git diff 2014d99..f391c37`, with attention to the changes since round 1 (`027de68..f391c37`): the red commit
ff917fb (test files only), the green commit 184bed8 (README, tasks.md environment note, plants.md, fix note, red log,
`red-commits`) and the tdd-check outputs f391c37. No element source changed since round 1
(`git diff f60fad0..HEAD -- packages/elements/src` is empty). There was no uncommitted change apart from the
tdd-check outputs this review regenerated.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | specs/012-button-action-row/research.md:643 (R-12) | R1-03 (the link's `Canvas` background under forced colours is not in R-12's table) is deferred to the planner, as the fix note says. This is acceptable. It was a note and never blocking. The change belongs to a planning artifact, not to the implementer's files, and the behaviour it would record is already correct and tested (`link.ts` `forced()`). | The planner adds the row the next time research.md is touched. Carry the note forward. |
| R2-02 | note | packages/elements/test/scenarios/link.ts:612-636 (US2-12) | R1-06's link-mode `:state(pressed)` assertion is not red-first, because the code was already right (`ocelle-button.ts:491`). This is acceptable. The finding was a note asking for coverage of existing behaviour, not a behavioural fix. The test landed in the test-only commit ff917fb, before 184bed8. The reviewer reproduced the fix note's plant: `pressed` limited to button mode gave 1 failed, 130 passed (US2-12, `lp` matches no `pressed`). So the assertion is not vacuous. | None. |

No blocking finding.

## Test quality

- **Red evidence, fix-1.** ff917fb changes `readme.test.ts` and `link.ts` only. `red-fix-1.log` and the regenerated
  `check-red-fix-1.log` show exit 1 with 2 failures. Both are `readme.test.ts:238` "README states" `AssertionError`s
  for the two amended modifier-click fragments, and they fail because the README still had the old sentences. That is
  the right reason. The US2-12 and US2-13 changes pass on the code, as expected for strengthened tests of correct
  behaviour.
- **No weakening after red.** 184bed8 and f391c37 change no test file (`git diff ff917fb..HEAD -- packages/elements/test`
  is empty). Against round 1's head, the test changes are stricter, not looser:
  - US2-13 copies and morph: the content `Close` and the label `Close dialog` are now distinct, so every expected name
    and label mirror (`Close dialog`) can come only from the moved label. Label-in-name still holds, so axe stays `[]`.
  - The morph's server markup carries the same label.
  - US2-12 gains the `lp` host. It adds expectations and removes none.
- **Reviewer's R1-01 plant re-run at HEAD** (scratch worktree, removed afterwards). The plant adds
  `name !== "aria-label" &&` to the read-back condition in `MovedAttributes.connected()` (`src/control.ts:89`).
  - In process, `--project elements`, `button.test.ts` and `control.test.ts`: 3 failed, 128 passed (131). The failures
    are the `control.test.ts` read-back test and both US2-13 bodies. The diff shows `"name": "Close"` received where
    `"name": "Close dialog"` is expected, which is the right reason.
  - On the fixture build, `--project elements-browser`, `test/browser/button.test.ts`: 2 failed, 75 passed (77). The
    failures are both US2-13 bodies.
  - This matches plants.md § Review round 1 fixes. In round 1 both bodies passed under this plant.
- **R1-06 plant re-run.** `pressed` in `updated()` also requires
  `linkHref(this.href, document.baseURI) === undefined`. Result: 1 failed (US2-12), 130 passed. This matches plants.md.
- **Assertions.** The changed bodies assert with `toEqual` on the accessibility name, the attributes, the custom
  states and the inner control's tag and `href`. There is no conditional, skip, only or snapshot. `gate:test-lint`
  reports no finding in 189 files.
- **Mutation.** The reviewer ran `pnpm run gate:mutation -- --base 2014d99` at f391c37: "242 mutants on the changed
  lines of 3 files, none survived; 0 timeouts, 71 compile errors, 0 zero-mutant entries; 0 equivalent records". This
  matches round 1, as expected with no source change. The compile errors are TypeScript-checker rejections, a report
  and not a finding.
- **tdd-check.** Re-run by the reviewer at f391c37, because the committed record named 184bed8.
  - Status `pass`.
  - Red `phase` a94d9e8 exits 1, and red `fix-1` ff917fb exits 1.
  - The final tests on the base exit 1, and HEAD exits 0.
  - No problems were reported.
  - The regenerated `tdd-check.json` and `check-*.log` files are committed with this review.

## Checks run

On f391c37, by the reviewer:

- `gate:typecheck`, `gate:lint` (281 files), `gate:test-lint` (189 files), `gate:style-lint`, `gate:csp`, `gate:prefix`,
  `gate:pins`, `gate:contrast` (193 pairs light, 201 dark, 182 required), `gate:manifest` (3 elements), `gate:brand-rules`,
  `gate:config-copies`, `gate:signoff -- --range 2014d99..HEAD` (15 commits, no finding): all exit 0.
- `pnpm test` (the HEAD run of tdd-check, `check-head.log`): 3501 tests passed in 149 files.
- `vitest --project elements-browser` (fixture build) at HEAD, unplanted: 190 passed.
- `gate:storybook-build`: 44 stories.
- `gate:axe`: 88 story-theme runs, 0 serious or critical, 10 excepted notes.
- `gate:mutation -- --base 2014d99`: none survived (above).
- `tdd-check.sh 3`: pass (above).
- Not re-run: `gate:visual` and `gate:plants`. No element source, style, story or baseline changed since round 1, when
  both ran clean (88 captures matched, and shard 40 gave every plant as expected). The changes since then are the
  README, two test files, tasks.md and the review records, and none of them is captured.

## Earlier findings

- **R1-01 (blocking): resolved.**
  - Both US2-13 bodies now use content `Close` with `aria-label="Close dialog"`, the morph's server markup too
    (`link.ts:641`, `:670`), and expect `Close dialog` in every name and label mirror (`link.ts:657-661`, `:690-693`).
  - The commit body of ff917fb gives the reason and calls the change stricter. That is correct.
  - The reviewer's plant now fails both bodies, in process and on the fixture build, and the run is recorded in
    plants.md.
- **R1-02 (blocking): resolved.**
  - The two `readme.test.ts` fragments (`:166`, `:189`) were changed first, in ff917fb, and failed against the old
    README.
  - The README was then reworded in 184bed8, in § Activation (`README.md:197-201`) and convention 2
    (`README.md:278-282`). It now says the element prevents nothing and the browser's own modifier handling applies.
    It also says that on Chromium on Linux, Ctrl, Shift and Alt give a new tab, a new window or a download, and that
    Meta navigates the current tab.
  - This agrees with the amended spec (spec.md:140-145, :335-337, FR-002 at :694) and with the fixture body
    (`link.ts:901`).
  - No other README passage still claims that modifier clicks open new tabs.
- R1-03 (note): deferred to the planner, acceptable (R2-01).
- R1-04 (note): resolved. The tasks.md environment note (`tasks.md:44`) names `chromium-1248` (Chromium 156).
- R1-05 (note): no change was required. This round's test change came with its own red commit, as asked.
- R1-06 (note): resolved with a test that is shown not to be vacuous (R2-02).
- R1-07 (note): accepted in round 1, no change.
- `red-commits` has the `fix-1` entry (ff917fb). R1-02 is a documentation fix, and its red test came first. R1-01 and
  R1-06 changed tests only, with no behaviour change, and plants back them.
