---
phase: 2
round: 1
verdict: approved
base: cc18f844faa15f01bcb6dc64f9f89f1f9d0d612e
head: e408fe43055befc3bd175215a907223f249c7a1b
tdd_check: pass
---

# Phase 2 review, round 1

Scope: `git diff cc18f84..e408fe4` (77 files), no uncommitted change. Phase 2 is User Story 1, the modal dialog
(T013 to T029). `tdd-check.json` was written at `a6feda9`. The only later commit, `e408fe4`, adds the check's own
evidence files, so the check is current for every source and test file.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | packages/elements/src/overlay.ts:266, :483-489, :628-632; :338-346, :654-661 | The own-close count (`#ownCloses`, R-03) and the toggle path of the below record (R-02) can be removed without any test noticing. Their mutants are all recorded as equivalent: the `dialog.open` check and the state already ignore a stale `close` event, and the close event of the same close already takes a dialog out of the below record. Both are kept on purpose as the design's mechanisms (`e89883c` put back what `827ae7b` had removed), and every record gives a sound reason. That is allowed, but it is code no test can protect. | None for this phase. When phase 3 reuses the base, or at the next plan revision, either decide to drop these redundant paths from R-02 and R-03 or name the case that needs them. |
| R1-02 | note | packages/elements/test/browser/dialog.test.ts:36 | The fixture runner still names its tests `it.each(...)("$name")`, and Vitest shortens those names to 40 characters. Many fixture rows therefore share one name in reports. The in-process runner was changed to full names for Stryker's sake. This does not affect mutation, which runs in process, or the assertions. | Optional: name the fixture tests in full, as test/dialog.test.ts:24-30 does, so a failing fixture row can be found by name. |
| R1-03 | note | specs/008-overlays/reviews/phase-2/notes.md:300-304 | `gate:plants` ran only for shards 16 (`visual/fail-token-changed`, after the eight `differs` lines), 19 and 27. The manifest plants of the changed generator were left to CI. The manifest gate tests on the repository and on `pass-repository` pass (unit suite, below). | CI's full `gate:plants` must pass before merge. |
| R1-04 | note | storybook/baselines/elements-ocelle-dialog--*.png | The 16 baselines were produced locally in the pinned docker image only, with no cross-engine comparison. T029 and 006 FR-005 say CI's captures win. | If CI's `visual` artifact differs, replace the files with CI's before merge. |
| R1-05 | note | specs/008-overlays/reviews/phase-2/notes.md:193-200 | Two behaviour fixes came from T025 rows that failed on the committed source: `827ae7b` (from `b30e65a`) and `e89883c` (from `5c4bf91`). The test commit comes first each time, but the failing output is kept only as text in notes.md, not as a `red-*.log`. These were green-step fixes, not review fixes, so `red-commits` needs no `fix-<round>` entry. | None. Later fixes like these should keep their red output as a log file in the phase directory. |
| R1-06 | note | packages/elements/src/overlay.ts:318-320 | Two comments in a row say the same thing (R-08 naming), the second rephrasing the first. | Optional: keep one. |

There are no blocking findings.

## Test quality

**Red evidence.** The red commit is `cdc4698`. It changes test files only, and its log is `red-phase.log` (the same as
`check-red-phase.log` apart from the run header): 548 of 3688 tests failed. Every failure I read in the log comes from
missing behaviour:
- the dialog rows fail with deep-equal mismatches, the bounded poll "2 events not recorded within 1 000 ms", or
  "no [part="close-button"] in #dlg";
- the entry and export tests fail because `ocelle-dialog` is not defined or exported;
- the manifest and README tests, the dist and pack lists, the story tests and the gate counts fail on missing content.

No failure is a syntax, import or setup error. notes.md:27-30 records the first red run's setup problems: TypeErrors,
an unbounded `whenDefined`, and two nested-modal rows that passed vacuously. They were fixed by amending the red commit
before green. `final_tests_on_base_exit` is 2 (the elements tests do not run without the scaffold's files), and
`final_tests_on_scaffold_exit` is 1.

**Scaffold.** `6711652` adds signatures for `focusable.ts`, `overlay.ts` and `ocelle-dialog.ts` and no test file. The
final tests fail against it (`check-final-tests-on-scaffold.log`).

**Tests changed after the red commit** (`git diff cdc4698..HEAD` on the test pathspecs):
- The repeated-Escape row was moved from `dialogScenarios` to `repeatedEscapeScenario`. Its body and expected value
  are unchanged. It runs on a page of its own in process (`test/dialog-repeated-escape.test.ts`) and on the fixture,
  which uses a fresh page per test anyway. The reason (the platform's activation history in the page) is in the test
  comment and notes.md:39-41. This is not a weakening.
- In-process test names changed from `$name` to the full row names. The assertions are the same.
- The `dispatch` stand-in command gained an optional `bubbles`, false by default, so the old rows behave as before.
- New rows (T025) are additions only. No row, assertion or expected value was removed or loosened.
- Count tests outside R-16 decision D's list: `gates/test/manifest.test.ts` and
  `gates/test/integration/manifest.test.ts` went from 2 to 3 elements, `gates/test/integration/axe.test.ts` from 44
  to 60 story-theme runs (58 plus the plant's 2), and `gates/test/integration/plant-repo.test.ts` from 42 to 58
  baselines. These are exact counts brought up to the phase's new content, still asserted with `toEqual` or
  `toHaveLength`. They are not loosened.

**Vacuous assertions.** None found. Every row goes through `row()`, which adds the FR-047 counts to both sides
(scenarios/dialog.ts:403-409). The polls are bounded and throw (`events`, :302-309). The only `catch` (:270) returns
the error to `act()`, which throws it again (:286-290). There is no `skip`, `only` or conditional assertion, and
`gate:test-lint` reports no finding.

**Coverage of the story.** US1 scenarios 1 to 16 each have rows. Scenario 12 (reduced motion) is not tagged
`US1-12` but is covered by the rows "Motion under reduced motion…". Every keyboard path has rows: Tab and Shift+Tab
over every matrix case, Escape in all its variants, and Enter and Space on the close control. Both events and their
payloads at dispatch are asserted through `record()`.

**Mutation.** I read the three recorded `--files` runs in `mutation.log`, each exit 0:
- run 1, at `c8ad511`, on the gate files, `scripts/manifest.ts`, `focusable.ts`, `index.ts` and `ocelle-dialog.ts`:
  290 mutants, none survived, 0 timeouts;
- run 2, at `c00a83e`, on `overlay.ts:1-446`: 249 mutants, none survived, 0 timeouts;
- run 3, at `c8ad511`, on `overlay.ts:447-790`: 394 mutants, none survived, 2 timeouts.

`git diff c8ad511..HEAD -- packages/elements/src packages/elements/scripts gates` is empty, so runs 1 and 3 are of the
final source. The only change between `c00a83e` and `c8ad511` is at `overlay.ts:770-771`, outside run 2's range, so
run 2's lines are also final. The changes to the six gate files are Stryker comment texts only (42 → 58
story-themes), and the gate reports zero mutants on their changed lines.

I ran a spot-check myself, `gate:mutation -- --base cc18f84 --files
packages/elements/src/ocelle-dialog.ts,packages/elements/scripts/manifest.ts,packages/elements/src/overlay.ts:548-618`:
138 mutants, none survived, 0 timeouts, 50 compile errors, 1 equivalent record, exit 0. It matches the recorded runs.

The two timeouts (`overlay.ts:774`, `:780`) turn `before()`'s path walk into a loop that never ends. No assertion can
return from it, so the time limit is the kill, and the gate treats these lines as reports.

I read all 22 new `Stryker disable` records in `src/` and `scripts/`, against the code:
- `manifest.ts:121`, `focusable.ts:197`, `:219`;
- `overlay.ts:76`, `:87`, `:270`, `:304`, `:323`, `:335`, `:339`, `:341`, `:344`, `:398`, `:400`, `:486`, `:624`,
  `:628`, `:654`, `:657`, `:659`, `:694`, `:770`.

Each states why no test can tell the mutant apart, and I found none where a test could. Two of them, `:270` (the body
measured by the resize observer before any key) and `:694` (the native backward move from the sentinel reaching the
same last candidate), rest on platform timing or measured lists. The rows record those lists. R1-01 covers the
records that leave a whole mechanism unprotected.

## Checks run

All at HEAD `e408fe4`, environment as given (`PLAYWRIGHT_BROWSERS_PATH`, `OCELLE_CHROMIUM_PATH`,
`OCELLE_VISUAL_ENGINE=auto`, `CI` and `GITHUB_ACTIONS` unset, docker with the pinned image).

| Check | Result |
|---|---|
| `pnpm test` (unit, interaction in process and on the strict-CSP fixture, node, build, storybook, gates) | 3922 tests passed in 148 files, exit 0 |
| `gate:typecheck` | no type error |
| `gate:lint` | 282 files, no finding |
| `gate:style-lint` | 15 files, no finding |
| `gate:test-lint` | 189 files, no finding |
| `gate:manifest` | 3 elements, no finding |
| `gate:csp` | 13 files, no finding |
| `gate:prefix` | 224 files, no finding |
| `gate:signoff -- --range cc18f84..HEAD` | 34 commits, no finding |
| `gate:pins` | 5 manifests, no finding |
| `gate:contrast` | 160 pairs in light, 168 in dark, 149 required per theme; pass |
| `gate:brand-rules` | 7 rules checked; pass |
| `gate:config-copies` | identical |
| `gate:storybook-build` | built 29 stories |
| `gate:visual` (re-run after the post-baseline fixes, as asked) | 58 captures match their baselines (docker only: no cross-engine comparison), exit 0 |
| `gate:axe` (re-run after the post-baseline fixes, as asked) | 58 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted, all in the existing prose-document story), exit 0. There is no `color-contrast-incomplete` on any dialog story, so the `dialog-scroll-edge` block works as the operator decided, with no exception entry. |
| `gate:mutation` | the recorded three-run split (above), plus my spot-check run (above) |
| `gate:plants` | not run by me, since the full suite exceeds the session limit. The implementer ran shards 16, 19 and 27, all as expected. The rest is left to CI (R1-03). |

**Tasks.** T013 to T029 are all ticked, and the work of each is present:
- the measurements and operator decisions are in `measure.md`, fixes-4 to fixes-6 and spec.md § "Operator decisions
  in Phase 2", and they match the code and tests;
- the sentinel is the panel's last child (`overlay.ts:348`), and its wrap is at `overlay.ts:693-699`;
- the manifest reads `src/overlay.ts` and drops it (`scripts/manifest.ts:119-131`), the analyzer config was widened
  to match, and the replaced pinned test is in `test/node/manifest.test.ts`;
- Tab inside a nested native modal is left to the platform (`#watcherAbove(true)` at `overlay.ts:679`);
- the `dialog-scroll-edge` block has a layout rule only (`stories-layout.css`) and no style attribute, text or
  exception;
- the repeated-Escape warm-up is in the row (scenarios/dialog.ts:2541-2565);
- the entry point, export, CHANGELOG and README section are present;
- there are 8 stories, matching data-model § Stories, with 16 baselines and 8 new `differs` lines in
  `fail-token-changed`.

Nothing outside the phase changed without a reason. The gate and test count updates are explained in notes.md:45-46
and in their commits.

**Constitution.**
- I: the names, events and parts use the `ocelle-` prefix, both events have `bubbles` and `composed`
  (`overlay.ts:23-25`), and there is no I/O (grep for fetch, storage, clipboard, `innerHTML`, `eval` and style
  attributes in the three new modules finds nothing). The manifest declares every member, and the gate passes.
- II: tokens only, and the gates pass. The system colours appear only under `forced-colors`.
- III: `aria-labelledby="heading"` stays inside the shadow root, and a host `aria-label` reaches the panel. The dialog
  keyboard model is covered by tests, the close control meets `--ocelle-target-min` with the token focus ring, reduced
  motion is honoured (`overlay.ts:531`), and axe is clean.
- IV: the CSP gate passes, and the fixture rows assert zero violations and no requests.
- V: every story has baselines in light and dark.
- VII: the CHANGELOG entry names the new surface.
- VIII: see Test quality above.

**Plan.** The structure follows plan.md: `focusable.ts`, `overlay.ts` and `ocelle-dialog.ts`, the shared scenario
bodies run by the in-process and fixture runners, and the stories and baselines under `storybook/`. The decisions
changed during the phase (18, 19, 21, 22, 23, decision 7) are made as fixes-4 to fixes-6 record.

## Earlier findings

None: this is the first round of phase 2.
