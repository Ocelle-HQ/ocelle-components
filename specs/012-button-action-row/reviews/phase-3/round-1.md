---
phase: 3
round: 1
verdict: changes_requested
base: 2014d993fcaecbef563baa48f2749818014cecb9
head: f60fad05ed3e3d4887a70d459b6bd04a8cebeedd
tdd_check: pass
---

# Phase 3 review, round 1

Scope: `git diff 2014d99..f60fad0` (User Story 2, T030 to T040 and T031a), with the red commit a94d9e8, the green and
follow-up commits 7c72352, 6651ed7, 5cd582f, 144bff7, fabffc3, e1887f7, dcb0a5c and a9a1c74, the tdd-check outputs
2ff1594 and the planner's commit f60fad0 (spec, tasks and research only). There was no uncommitted change apart from the
tdd-check outputs this review regenerated.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | packages/elements/test/scenarios/link.ts:638, :666 (expected :657-658, :688-690) | 7c72352 loosened US2-13 after its red commit. In a94d9e8 both US2-13 bodies used content `Save` with `aria-label="Close"`, so the expected name `Close` could only come from the moved label carried by its mirror. The correction for `label-content-name-mismatch` changed the content to `Close`, the same as the label, so every name assertion in the two bodies (the outerHTML and cloneNode copies, the morphed element, the innerHTML copy, the restored element) now passes whether the label mirror is read back or not. The reviewer showed this with a plant in a scratch worktree at HEAD: `MovedAttributes.connected()` skips the read-back of `aria-label` only (`src/control.ts:89`, `name !== "aria-label" &&` added). `button.test.ts` and `control.test.ts` gave 1 failed and 130 passed. Both US2-13 bodies passed, and only the in-process `control.test.ts` read-back test failed. That test does not run on the fixture build. So the phase's Independent Test, "a clone keeps the moved name", is no longer shown by its acceptance scenario. The commit body says "none loosened", which is wrong for these two bodies. Principle VIII: a corrected red test is replaced by a stricter one, never a looser one. | Keep label-in-name and give the moved label a value that differs from the content but contains it, for example content `Close` with `aria-label="Close dialog"` (in the server markup of the morph body too). Expect `Close dialog` in every name of both bodies, and `Close dialog` for the mirror values. Record the reason in the commit. Show that the bodies now fail under the plant above (the label read-back skipped), and record that run in `plants.md`. |
| R1-02 | blocking | packages/elements/README.md:197-199, :277; packages/elements/test/node/readme.test.ts:166 | The README still makes the claim that the operator decision at phase 3 (f60fad0, spec.md:138-145) replaced. Line 277 says that in link mode "modifier clicks open new tabs or windows". Lines 198-199 say that a Ctrl, Meta, Shift or Alt click delivers its `click` and "the browser's default (a new tab or window, or a download) happens". The amended FR-002 (spec.md:694) and FR-023 (spec.md:850-853) now say the element prevents nothing and the browser's own modifier handling applies. On Chromium on Linux that means a Meta-click navigates the current tab. The phase's own fixture body asserts exactly this (`link.ts:898-923`, `Meta: navigated`). So the published consumer documentation contradicts the spec and the measured behaviour. `readme.test.ts:166` pins the outdated sentence. f60fad0's "No code or test change" covers the element and its scenario tests, not the README statement of FR-002 and FR-023. | Reword both README passages to the amended FR-002 and FR-023 wording: the element prevents nothing, the browser's own modifier handling applies, and on Chromium on Linux a Meta-click navigates the current tab. Change the `readme.test.ts` fragment first, in a commit that fails against the current README, then change the README. |
| R1-03 | note | packages/elements/src/control.ts:165 | Under forced colours, `a.control` sets `background-color: Canvas`, which research.md R-12's table does not list. On the merits it is sound. axe measured a link's `LinkText` against the white it assumes behind a transparent `<a>`. A native button gets `ButtonFace` behind it. R-12 already says that forced colours force backgrounds to `Canvas` (research.md:643), so the rule only states what the system paints anyway. The forced-colours scenario (`link.ts` `forced()`) still asserts `LinkText`, `Highlight` and `GrayText`. | Add the link's `Canvas` background to R-12's forced-colours table the next time research.md is touched. |
| R1-04 | note | specs/012-button-action-row/tasks.md:44 | Every run of this phase used Chromium 156.0.8078.4 (`chromium-1248`), the build that the pinned Playwright 1.64.1 expects. tasks.md's environment note names `chromium-1243` (153). This is accepted. The baselines come from #10's pinned container, not from the host browser. The behaviour under test (element reflection from 135, `:state()` from 125) is well below both builds. The spike measured on 156. | Update the environment note to `chromium-1248` when tasks.md is next touched. |
| R1-05 | note | packages/elements/test/control.test.ts:525-536 (commit 5cd582f) | The test for "the references are resolved again at every connection" landed in the same commit as its fix (`ocelle-button.ts` `connectedCallback` `requestUpdate()`), with no test-only commit before it, and its red run is described in notes.md but not kept. The reviewer reproduced the red run: the test applied alone onto 7c72352 in a scratch worktree failed for the right reason, with an assertion error (expected `after: ["Shadow"]`, received `["Document"]`). The test is not vacuous and the fix is real. Finding the bug through a plant that did not bite is the plant procedure working as intended. | None for this phase. Later in-phase fixes go in a test-only commit first, or keep their red log under `reviews/phase-<N>/`. |
| R1-06 | note | packages/elements/test/scenarios/link.ts:612-633; src/ocelle-button.ts:491 | `:state(pressed)` follows the moved `aria-pressed` in both modes, as the data model says, but no test asserts it in link mode. US2-11 asserts the inner control and the tree only (recorded in notes.md). | Optional: add a link-mode `aria-pressed` host to US2-12's state assertions in a later phase. |
| R1-07 | note | packages/elements/test/browser/driver.ts:222-226 | `callClick` now swallows only the "Execution context was destroyed" error from `settle`, which a link's `click()` causes by navigating. If a button-mode `click()` navigated unexpectedly, the error would also be swallowed. The next driver call or the body's outcome would still fail, so the failure is reported. Acceptable. | None. |

## Test quality

- **Red evidence.** a94d9e8 changes test files only. `red-phase.log` and `check-red-phase.log` show 142 failing tests at
  the red commit, every one an `AssertionError`, none a syntax, import or setup error. Examples: missing link stories,
  pinned story counts 44 and 88, mode table rows, moved attributes absent. The two harness self-tests passed at red
  because the code they test is test code from the same commit. That is acceptable, as in phase 2.
- **Corrections after red (`git diff a94d9e8..HEAD -- <tests>`)**:
  - US2-8 (`link.ts:532-551`): not weakened. The three sources (`Save draft`, `Save now`, `Save`) are still distinct,
    so each expected name can come only from its source.
  - US2-9 (`link.ts:553-567`): not weakened. The content is now an icon only, so the name can come only from
    `aria-labelledby` or `aria-label`. This is stricter than before.
  - US2-13 (both bodies): **weakened**, see R1-01.
  - SC-006 (`link.ts:221-222`): not weakened. The `.page` container rule sets the canvas ground and the ink colour on a
    container, not on the elements. The `chrome-ink` and `chrome-muted` assertions on the menu button still tell its
    own rules from the inherited ink. The `id` added by `withId` (`link.ts:71`) is needed by the driver, and
    `readme.test.ts` compares the README with the constants without it.
  - `readme.test.ts:165`: correct. The fragment had a literal TAB where the README shows the two characters `\t`, and
    the expected sentence is unchanged.
  - `callClick` (`driver.ts:222-226`): narrowly scoped, see R1-07.
- **Tests added in green.** 5cd582f (R1-05) and the three tests of e1887f7 (`control.test.ts:438-484`). Each pairs a
  negative outcome with a positive one in the same assertion and fails on the phase base. They were added to kill
  mutants, not to change behaviour. None uses skip, only, a conditional expect or a snapshot. Every assertion is a
  `toEqual` on observed DOM, the accessibility tree, events or computed style. `gate:test-lint` reports no finding in
  189 files.
- **Coverage of the story.** US2-1 to US2-14 each have a shared body. US2-1 and US2-3 also have sink and fixture bodies.
  The cancel path, the modifier and middle clicks (with Meta following the operator decision at phase 3), Space, the
  `href` edge cases, several ids, a referenced element added later, `aria-current` values, the forced colours of the
  link half and FR-002's same look all have bodies. SC-006 is covered for both themes.
- **Plants (plants.md).** Every T031 to T033 plant bit on e1887f7. The reference plant did not bite on 7c72352, which
  led to 5cd582f. The reviewer re-ran gate plant shard 40 (`visual/fail-token-changed`, with the five new light
  story-themes) under `OCELLE_VISUAL_ENGINE=docker`: "every plant as expected", 133.1 s.
- **Mutation.** `pnpm run gate:mutation -- --base 2014d99`, reviewer's run at f60fad0: "242 mutants on the changed lines
  of 3 files, none survived; 0 timeouts, 71 compile errors, 0 zero-mutant entries; 0 equivalent records". The 71
  compile errors are TypeScript-checker rejections, a report and not a finding. The first run's 7 equivalent mutants
  were handled by removing the equivalent code in e1887f7, and the 8 untested ones by its three tests. The reviewer
  read the four removals listed in e1887f7's body against `control.ts` and `ocelle-button.ts` and found no behaviour
  lost.
- **tdd-check.** Re-run by the reviewer at f60fad0, because the earlier record was for a9a1c74. Status `pass`: red exit
  1, final tests on base exit 1, HEAD exit 0, no problems. The regenerated `tdd-check.json` and `check-*.log` are
  committed with this review.

## Other checks of the deviations

- **Engine floor from MDN browser-compat-data 8.1.9** instead of the Chrome release notes (proxy 403). T030 allows
  "release notes or compat data", and the plan cites the same data. The figures in spike.md (reflection Chrome 135 and
  Safari 16.4, custom states Chrome 90 and Safari 17.4, `:state()` Chrome 125) support the README's Chromium 135 and
  WebKit 17.4. Accepted.
- **Modifier clicks (f60fad0).** The spec, tasks and research rewording matches what the code does
  (`ocelle-button.ts:450`: return before dispatch, nothing prevented) and what the fixture body asserts. The planner's
  carry-over to FR-033, US5-2 and T061 is consistent. Only the README was not brought along (R1-02).
- **Tasks.** T030 to T040 and T031a are ticked, and their work is present: the spike, `link.ts`, the `control.test.ts`
  link part, `button.test.ts` and the browser runner, the manifest and README tests, the story tests, `control.ts`,
  `ocelle-button.ts`, `manifest.ts` with a regenerated `custom-elements.json`, the README and CHANGELOG, six stories with
  12 baselines, `fail-token-changed`, plants.md and the gate runs. Files outside the phase changed for a reason: the
  plant copies of `custom-elements.json`, the gate integration counts (in the red commit) and the spec, tasks and
  research wording (f60fad0).
- **Constitution.**
  - Names and events use the `ocelle-` prefix.
  - The element does no I/O.
  - Only tokens are used (`gate:style-lint`, `gate:contrast`, `gate:brand-rules` clean).
  - Accessibility: reflection resolves ids in the host's own tree only, other shadow roots stay unresolved, the name
    order follows R-05, a disabled link is not focusable, `noopener` is set, and axe is clean.
  - CSP: `gate:csp` is clean, and `javascript:` URLs are rejected by the URL parser.
  - Every new story has light and dark baselines made in the pinned container.

## Checks run

On f60fad0 (source identical to a9a1c74), by the reviewer:

- `gate:typecheck`, `gate:lint`, `gate:test-lint` (189 files), `gate:style-lint`, `gate:csp`, `gate:prefix`,
  `gate:pins`, `gate:contrast` (193 pairs light, 201 dark, 182 required), `gate:manifest` (3 elements, no finding),
  `gate:brand-rules`, `gate:config-copies`, `gate:signoff -- --range 2014d99..HEAD` (11 commits, no finding): all exit
  0.
- `pnpm test`: 3501 tests passed in 149 files.
- `gate:storybook-build`: 44 stories.
- `gate:axe`: 88 story-theme runs, 0 serious or critical, 10 excepted notes.
- `OCELLE_VISUAL_ENGINE=docker pnpm run gate:visual` under 16 `yes > /dev/null` processes: 88 captures match (docker
  only, no cross-engine comparison, as recorded). The processes were killed afterwards and none remain.
- `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 40`: every plant as expected (133.1 s). The other 75
  shards were not re-run. They are recorded in notes.md on e1887f7 and dcb0a5c, and no source changed after them.
- `gate:mutation -- --base 2014d99`: none survived (above).
- `tdd-check.sh 3`: pass (above).
- Reviewer plants in scratch worktrees, removed afterwards:
  - the `aria-label` read-back plant at HEAD (R1-01);
  - the 5cd582f test on 7c72352 (R1-05).

## Earlier findings

None: this is the first round of phase 3.
