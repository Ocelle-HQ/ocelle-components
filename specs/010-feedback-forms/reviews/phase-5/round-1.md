---
phase: 5
round: 1
verdict: approved
base: 77dfda1797aa9878c7fa0fd408101077a7044329
head: a2ba23bd6be5cc142b11db59efcdfe3fbc124028
tdd_check: pass
---

# Phase 5 review, round 1

Change under review: `git diff 77dfda1..a2ba23b` (no uncommitted change). Code commits: red `2d7545a`, green
`8a88bcd`, plant fix `84bfbfe`; the rest are records under `specs/`. Operator decisions read as authority:
`decision-t060-merge.md`, `decision-stop-1.md`, `decision-stop-2.md`, and phase 3's shard-time known gap (op 017).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | `gates/test/integration/visual.test.ts:116`, `gates/test/integration/axe.test.ts:52` | The two test titles still say "the repository's 42 story-themes" while their assertions now pin 102 (`visual.test.ts:120`, `axe.test.ts:56`). The titles are keys: 277 `Stryker disable` comments in six files outside this phase's scope (`gates/bin/axe.ts`, `gates/bin/visual.ts`, `gates/lib/storybook-serve.ts`, `gates/lib/visual-host.ts`, `gates/lib/story-page.ts`, `gates/visual/capture.ts`) cite them by title. Renaming here would mean editing gate source the phase may not touch, and the T061 addendum records the choice. The stale figure is only in descriptive text; the assertions are correct and no less strict. Acceptable for this phase. | None now. Suggest a follow-up op that renames both titles and their Stryker citations together, or drops the figure from the titles. |
| R1-02 | note | `gates/test/integration/axe.test.ts:68` | `2 findings in 44 story-theme runs` was changed to `104`. Stop 1 did not list it, but it is the same kind of pinned count in a file stop 1 named (the unlabelled-button root holds the repository's stories plus the fixture's one: 102 + 2), and the story set forces the change. It went into the red commit (`2d7545a`), failed there (`red-phase.log`, `axe.test.ts:61`), and the T061 addendum (`5a98024`, written before the red commit) names it. Only the figure changed. Within the decision's intent. | None. |
| R1-03 | note | `storybook/stories/form-input.stories.ts:41,49`, `form-select.stories.ts:46,54`, `notice.stories.ts:37` | Five baseline pairs are byte-identical to another story's: input `hover` and `required` = `empty`; select `required` = `placeholder`; select `option-groups` = `filled`; notice `without-heading` = `danger`. This follows from the design, not from a defect. The spec asks for no hover style and no visual required marker (FR-025). A closed native select cannot show its groups. The without-heading story is meant to be the danger notice with no heading. The render tests (`elements-stories.test.ts:386`) prove these states in the DOM: `required`, the optgroup labels, the pointer parameter with exactly one target, and no heading shown. So the option-groups baseline guards the closed control only, not the groups. | None. If a hover or required style is ever added, these baselines will catch it as `differs`. |
| R1-04 | note | `reviews/phase-5/decision-t060-merge.md` | Says the phase runs "on the recorded base `11cbe7a`", but `base.sha` is `77dfda1`. `11cbe7a` is not an ancestor of `77dfda1` (the phase 4 history fold), and `git diff 11cbe7a 77dfda1` differs only in `reviews/phase-5/base.sha`, so the two are the same tree. `recheck.md` gives `77dfda1`. Only a stale SHA in a record. | None. |
| R1-05 | note | `reviews/phase-5/tdd-check.json` | Its `head` is `af1356a`, one commit before HEAD. I did not rerun it. The only later commit, `a2ba23b`, changes `specs/` records only (`red-evidence.md`, `readme-map.md`, `check-final-story-test-on-base.log`, a tasks.md tick). Analysis I11 orders `tdd-check.sh` before T066 because T066 reads that run's logs, so a rerun would overwrite the logs `red-evidence.md` cites without changing any outcome. | None. |
| R1-06 | note | `reviews/phase-5/gates.md` § Timing | With 102 story-themes, one visual plant takes 136 to 204 s and a single-process `gate:plants` run no longer finishes in 7000 s. Sharded, as CI runs it, the plants pass (visual shards 396 to 500 s). This falls under phase 3's shard-time known gap (op 017), already with the operator. | None in this phase. |

No blocking finding.

## Test quality

- **Red evidence (Principle VIII).** Red commit `2d7545a` changes test files only: `elements-stories.test.ts` and the
  four pinned-count files. Stories and baselines come in green (`8a88bcd`). `red-phase.log` has 98 failures, all
  `AssertionError`, and I recounted them from the log: 1 index (`:359`), 20 notice renders (`:369`), 40 form-control
  renders (`:386`), 30 baselines (`:402`), plus the 7 pinned-count assertions in 6 gate tests. Each fails because the
  stories or baselines are missing, not because of setup.
- **Check 2 (`check-final-tests-on-base.log`).** Exit 1 with 34 failures: the 30 baseline tests at `:402` and
  `plant-repo.test.ts:218`, `visual.test.ts:115`, `:126` and `:239`, all `AssertionError`. These are exactly the
  failures `red-evidence.md` names. The storybook-build count and both axe counts hold at the base, as decision stop 1
  predicts (the overlay brings the stories).
- **Story test alone against the base (`check-final-story-test-on-base.log`).** Exit 1 with 91 failures (1 + 20 + 40
  + 30), every test T061 added, each on an assertion. This matches `red-evidence.md` (2).
- **No weakening.** `git diff 2d7545a..HEAD` over every test path is empty, so no test changed after red. In the gate
  tests, base to HEAD, only the numbers moved: 21→51, 42→102 (four places) and 44→104. No matcher, expectation shape
  or exit code changed, and no assertion was removed. The plant change (`84bfbfe`) adds three empty story files to
  `fail-empty-index`'s tree and 30 `differs` lines to `fail-token-changed`. The plant judge compares findings exactly,
  and the rerun shows the gate reports exactly these 50 light story-themes and nothing in dark (`plants.md`). No plant
  was loosened.
- **Assertions.** Each new test does one whole-object `toEqual` on observed DOM, index or file state, with no
  conditional assertion and no `skip` or `only` (`gate:test-lint` passes). The `.catch(() => undefined)` on the wait
  in `openStory` only bounds the wait: a story that never renders still fails the assertion after it, as the red runs
  show.
- **Focused stories (R-08).** Both wrappers (`form-input.stories.ts:15-27`, `form-select.stories.ts:16-28`) wait for
  `whenDefined` and `updateComplete` and then call `.focus()`. Neither story uses `autofocus`. The test asserts
  `autofocus: false` on host and control, `document.activeElement === host`, the shadow root's active element being
  the control, and `:focus-visible`.
- **`select-focus-ring.md`.** I recomputed it from the committed PNGs. Select focused against hover, and input focused
  against empty, in both themes: 7841 differing pixels, box x 11 to 1268 and y 35 to 88, 7742 (light) and 7740 (dark)
  pixels of `#8f5e0f` / `#e0a23a`. This matches the record. The ring shows after programmatic focus.
- **Coverage of T061 / US4 scenario 1.** The notice has 5 tones, 2 sizes, with and without a heading, and announcing:
  10 stories. The input has empty, placeholder, filled, with description, with error, required, disabled, read-only,
  focused and hover: 10. The select has the same states minus read-only, plus option groups: 10. Hover uses #10's
  pointer parameter, and the test checks its selector matches exactly one element and that only hover stories carry
  it. Every story has light and dark PNG baselines. Scenario 2 (font rule, baseline match) and scenario 3 (axe, closed
  shadow root) are covered by the gates below. Scenarios 4 and 5 (manifest and README) come from earlier phases:
  `readme-map.md` maps every FR-035 / SC-006 item to an assertion seen failing in T017, T035 or T053, and
  `packages/` is unchanged since base. US4 adds no event and no keyboard path.
- **Mutation.** `pnpm run gate:mutation -- --base 77dfda1` exits 0 with "nothing to mutate: no package or gate source
  line changed since 77dfda1". Story files are outside the mutation scope, so there is no surviving mutant and no
  equivalent-mutant record to read.

## Checks run

At HEAD `a2ba23b`, in this container, with `OCELLE_CHROMIUM_PATH` set to Chromium build 1243 and
`OCELLE_VISUAL_ENGINE=docker`:

| Check | Result |
|---|---|
| `gate:storybook-build` | exit 0, "built 51 stories" |
| `gate:visual -- --engine docker` | exit 0, "102 captures match their baselines (docker only …)". The committed baselines match the pinned container's capture, so they were produced there (T065). |
| `gate:axe` | exit 0, "102 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted)". The 10 notes are all on `base-styles--prose-document`; none is on a phase 5 story. |
| `vitest --project storybook-integration` | 138 passed (2 files) |
| `vitest --project gates-integration` on `axe`, `storybook-build`, `plant-repo`, `visual` tests | 53 passed (4 files) |
| `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint` | all exit 0, no finding |
| `gate:prefix`, `gate:csp`, `gate:manifest`, `gate:contrast`, `gate:pins`, `gate:brand-rules`, `gate:config-copies` | all exit 0, no finding |
| `gate:signoff -- --range 77dfda1..HEAD` | 14 commits, no finding |
| `gate:mutation -- --base 77dfda1` | exit 0, nothing to mutate |
| `gate:plants` | not rerun, by instruction. Recorded green at `84bfbfe` in `plants.md`: shards 1 and 16 rerun, then a verdict over all 28 with exit 0, 301 plants as expected. No plant or gate file changed after `84bfbfe`. |
| Full `pnpm test` | not rerun. `check-head.log` (at `af1356a`, same code as HEAD) shows 4005 passed. |

**Tasks.** T060 to T066 are ticked, and the work is present: the stories, 60 baselines, the counts, the plants,
`select-focus-ring.md`, `red-evidence.md` and `readme-map.md`. T060's merge was not done, by operator decision
(`decision-t060-merge.md`), and that is recorded in `recheck.md`.

**Scope.** Excluding `specs/`, the files changed since base are exactly T066's widened list. `render.ts` and
`packages/` are unchanged.

**Plan / constitution.** Each element has one CSF file in `storybook/stories/`, in the same inline-markup form as
`icon.stories.ts` and with no style attribute (`gate:csp`). The wrapper elements are `ocelle-` prefixed. There is a
story per variant and state, in light and dark, each with a baseline from the pinned container (Principle V). axe
reports nothing serious or critical. No network request leaves the origin (asserted per story).

## Earlier findings

None: this is round 1.
