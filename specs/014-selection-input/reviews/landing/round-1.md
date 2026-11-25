---
phase: landing
round: 1
verdict: changes_requested
base: b594b7e98bb5480aad9cc8dcf0bd3f7f378f920f
head: f1084a9a897baf1069acbb5d3f4265c0115db769
tdd_check: pass
---

# Landing review, round 1

Scope: the integrated diff `git diff origin/main...HEAD` for PR #54. The merge base is `b594b7e` (origin/main), and the
head is `f1084a9`. The diff covers 350 files, +37882/−589. Main was merged in at `ac2f991`, and `d885610` and `c4eb93a`
followed. I read merge-notes.md and landing operator decisions 1–4. The phase reviews (phase-1 to phase-7, each last
round `approved` with `tdd-check.json` `pass`) are input to this review, not a substitute for it.

`git diff f1481d8..HEAD` touches only `research.md`, `tasks.md`, phase-7 `operator-decisions.md` and `round-4.md`. Over
`packages`, `storybook`, `gates`, `vitest*.ts` and `.github` it is empty. The CI run on `f1481d8` is therefore the CI
evidence for this head's code.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L1-01 | blocking | packages/elements/test/link.test.ts:36; packages/elements/test/browser/link.test.ts:91; scenario packages/elements/test/scenarios/link.ts:543-565 (US5-7) | CI's Unit tests job fails on `f1481d8` (run 44419041559, job 135206837145), in both harnesses, on "US5-7: in forced colours the link … read from pixels". The in-process failure is `expected { …(2) }` and the fixture failure `{ …(3) }`; the log prints no diff. The same two tests have failed on every CI run since the merge (`5dac013`, `7982627`, `27e9a4a`, `f01d3b7`, `f1481d8`), and no CI ran before the merge. The tests pass locally. That does not stand in for CI, because the gate the PR must pass is CI's. The scenario reads exact colours at single points (`colourAt` 3.5 px outside each fragment, scenarios/link.ts:306-317) and compares them with `over(Highlight, Canvas)` and `LinkText`. Any difference in the CI Chromium's forced-colours rendering or antialiasing shows up here. Without the CI diff I cannot tell whether the element or the test is wrong. Another agent is diagnosing it, so this review only states the finding. | Find the cause from CI's actual values (for example, print the observed object on failure, or reproduce in the CI image). If the element is wrong, fix it test first (a red commit, then the fix). If the test depends on the environment, replace it with one that is at least as strict about the behaviour (LinkText, underline, a Highlight ring on both sides of each fragment), and record the reason (Principle VIII: replaced by a stricter test, never loosened). Then get one green CI run on the landing head. |
| L1-02 | blocking | CI run 44419041559: the 80 "Mutation shard" jobs and "Mutation testing" (job 135209628294) | The brief says "29 of the 30 jobs passed". The run has 129 jobs and 82 failed: Unit tests, all 80 mutation shards and the Mutation testing aggregate. Every shard I opened (135207086911, 135207081562, 135207081533) ends with `mutation: could not run: Stryker wrote no report (There were failed tests in the initial test run.)`, exit 2. The cause is L1-01: the in-process `link.test.ts` is in the `elements` project that Stryker runs (research.md R-13). The gate behaves correctly here: it fails closed with exit 2 ("could not run"), and the aggregate refuses `SHARDS: failure`. But it means CI has no mutation result for the integrated source: the 9 element modules, `roving.ts`, `selection.ts`, `link-target.ts`, `internals.ts`, `index.ts` and `tokens/src/source.ts`. The phase reviews' local mutation runs predate the merge. Since then main's harness changes (two-frame `settle`, the srcdoc wait) and 014's resolver move run under these tests. | Once L1-01 is fixed, get a green CI Mutation testing job on the landing head. Every surviving mutant in new or changed code must be killed or recorded as equivalent, with its reason. Correct the landing records so they count the mutation jobs as failed, not just Unit tests. |
| L1-03 | note | packages/elements/README.md:1301-1303 (question 1) | The folder-picker example uses `/home/ana/kitty-desktop`, `/home/ana/ocelle-console` and `/home/ana/archive`. "ana" is a generic fictional first name. It is not tied to any contributor, it appears nowhere else in the repository, and no test pins it (readme.test.ts:1086-1088 checks the heading and the API strings only). This is not a privacy or licence problem, and it may stay. For a published package README, neutral values read better: a home-directory layout implies one user and one OS, and Kitty Desktop also runs on macOS (`/Users/…`). Line 1314 also calls `projects.open(…)`, a host object the example never introduces. | Optional, documentation only (no test change needed): use neutral values such as `projects/kitty-desktop`, or a placeholder root such as `/srv/projects/…`. Add a comment, or one sentence in the paragraph above, saying that `projects` stands for the host's own bridge. |
| L1-04 | note | packages/elements/README.md:16-17, :1761-1763; README entry table :29; src/ocelle-workflow-board.ts:9 | The module-rule resolution (question 2). 014's sentence "defines that element and the elements it renders or owns as children" correctly replaces 013's "no other, except that a container module also imports its item element". It covers `ocelle-facts`→`ocelle-fact`, the overlays' rendered `ocelle-icon` (src/overlay.ts), `ocelle-copy-field`→`ocelle-icon` and 014's three parents. `ocelle-workflow-board` is the one container whose module deliberately does not define its child: it takes any slotted child, "a lane or not" (src/ocelle-workflow-board.ts:6-9), and the entry table says "not the lane". The general sentence leaves the reader to work out that the board does not "own" its lanes. Main's 013 sentence had the same gap, so the merge did not introduce it. | Optional: add a clause such as "(a container that accepts any child, such as `ocelle-workflow-board`, owns none)", or point to the entry table. If readme.test.ts pins the sentence, update it there in the same commit. |
| L1-05 | note | packages/elements/test/scenarios/driver.ts:378-414 and 009's methods below them | Design lens on the Driver after decision 3. The interface now has five pairs of near-synonyms: `press`/`pressKeys`, `click`/`clickTarget`, `hover`/`hoverTarget`, `activeElement`/`focusedElement` and `viewportSize`/`setViewportSize`. They differ in signature and return shape (for example `ActiveElement` vs `Focused \| null`). This was the operator's chosen option, and it is correct as a merge: main's code is untouched and both harnesses implement both sets. The cost is that scenario authors must choose between two vocabularies for the same input, so later features may add a third. The `Target` widening and the single resolver are clean (see Merge resolution). | None for this PR. Consider a follow-up issue to consolidate the pairs (decision 3's option "unify into overloads") once both sides' scenarios can be migrated together. |
| L1-06 | note | specs/014-selection-input/reviews/phase-7/plants.md; phase 7 operator decision 3 | The full local `gate:plants` run against the phase base, on the head after the second merge of main, is still owed before hand-off (decision 3; decision 4 schedules that merge after #49). Interim evidence: on `f1481d8` every CI Plants shard passed, and the code is unchanged since. `d885610`'s five regenerated plants were also run alone (`--affected c4eb93a`, exit 0, merge-notes). | Record the owed full run as decision 3 requires, after the second merge. This does not block this round. |

## Merge resolution (question 2)

- **Driver renames** (scenarios/driver.ts, in-process.ts, browser/driver.ts): the five renames in merge-notes are
  present. Main's methods keep their names and signatures. `git diff origin/main...HEAD` touches no scenario file of
  main's: the scenario files it changes are 014's own, plus driver.ts. The planner's wording has been updated
  (research.md:599 names the renames, and no stale `press(`/`click(`/`hover(` reference remains in tasks.md or
  contracts).
- **Shared Target resolver** (test/page-helpers.ts:47-63): a single `resolve` handles the id, `{ id, inner }` and
  `{ parent, kind, index }` forms. Each missing target throws with a message that names it, so a missing target fails
  the test rather than resolving silently.
  - In process, `resolve` delegates to it (in-process.ts:56-58).
  - On the fixture, `rectOf`, `box`, `computed`, `focus`, `scrollLeft`, `setScrollLeft` and both of `frameRecord`'s
    lookups go through `window.__ocelleDriver.resolve`.
  - Behaviour against main's inline lookups is unchanged. A missing host throws in both versions; only the message
    text differs. `box` still returns `display: "absent"` for a missing `inner`.
  - The helpers are installed by `context.addInitScript` in `visit` (serve.ts), the only place that opens fixture pages
    (no other `newPage`/`newContext` under test/browser). The init script wraps `Clipboard.prototype` and
    `execCommand`. Of all elements, only `ocelle-copy-field` mentions the clipboard (in comments), so main's fixture
    tests are not affected.
  - Both forms are exercised: driver.test.ts:171, :203, :273 and :293-308 use `{ id, inner }`, and
    driver-commands.ts:137-148 uses the child form.
- **Module-rule sentence:** correct and more general (L1-04 is a wording note).
- **Engine floor:** README:1710 keeps the higher floor, Chromium 125+ / WebKit 17.4+. The custom-states bullet (the
  new top) and 008's Popover API bullet are both present, and the overview (:16) and CHANGELOG lead state the same
  floor. Raising the floor from WebKit 17 to 17.4 drops Safari/WebKit 17.0–17.3. That is permitted before 1.0
  (constitution VII), and the CHANGELOG names it.
- **Regenerated manifest plants (d885610):** I compared each plant copy, key-sorted, with the real
  `packages/elements/custom-elements.json`.
  - The six `fail-undescribed-*` copies differ only by the one added `src/ocelle-plant.ts` module: 37 lines, or 42
    for `-property`. No other module contains a plant declaration, so the wrong-context patch is gone.
  - `fail-lost-attribute` differs only by the icon's `label` attribute (9 lines).
  - `pass-reordered` has the same content as the real manifest with its keys reordered.
  - `gate:manifest` on the repository: exit 0, "27 elements checked, no finding".

## Gates: correctness, fail-closed, overlap

- 014 adds no gate binary and changes no gate source (`gates/bin`, `gates/lib`, `gates/eslint`, `gates/stylelint`, `gates/gates.json` and `.github` are unchanged against the
  merge base). The gate changes are counts in gate tests (contrast 175/183 with 164 required, 27 manifest elements,
  177 stories, 354 story-themes), plant fixtures, and the visual integration timeout (600 s to 900 s, c4eb93a, with no
  assertion change). I checked each removed test line against main (`git diff origin/main...HEAD -- '*.test.ts'`).
  Every removal is a count, list or name that was replaced by the union value; none is a deleted, skipped or loosened
  assertion.
- Exit contract: the CI evidence shows the mutation gate's exit 2 ("could not run") and the aggregate's refusal on
  `SHARDS: failure` (L1-02), and the unit-tests gate failing with exit 1 on real test failures. Both fail closed.
- Overlap: `test/node/selection-pairs-check.ts` ties each element's painted tokens to `checked` rows of pairs.json.
  The contrast gate checks the figures and the required set from `tokens/src/source.ts`. The two are complementary,
  and this follows the existing pattern (`brand-pairs-check.ts`, 005; `progress-pairs-check.ts`, 013). The 12 new
  `color-accent-strong` rows match the 6 grounds added to `source.ts`, and `gate:contrast` passes.

## Design lens: the five elements' public surfaces

From the manifest:

| Element | Attributes | Events | Parts | Slots |
|---|---|---|---|---|
| `ocelle-listbox` / `ocelle-option` | `label`, `value` / `disabled`, `value` | `-change`, `-activate` | `list` | default, `icon` |
| `ocelle-tabs` / `ocelle-tab` / `ocelle-tab-panel` | `label`, `value` | `-change` | `tablist`, `panels` | manual assignment (`ocelle-tabs.ts:71`, `:237-238`) |
| `ocelle-segmented-choice` / `ocelle-segment` | `label`, `joined`, `value` | `-change` | | |
| `ocelle-copy-field` | `value`, `status`, `copy-label` | `ocelle-copy-field-request` | `value`, `copy-control` | |
| `ocelle-link` | `href`, `label` | `ocelle-link-activate` (cancelable) | `anchor` | |

- The names follow the `ocelle-<element>-<action>` convention, and the vocabulary (`label`/`value`/`disabled`) is
  consistent across the three selection families.
- `ocelle-copy-field` performs no clipboard I/O (constitution I). It requests the copy, and the host writes `status`.
- Security, `ocelle-link`: navigation is decided on the URL as resolved against `document.baseURI`, not on the string
  as written (`link-target.ts`). Only `http:`, `https:` and the document's own protocol are allowed, so
  `javascript:` (also with leading spaces or embedded tabs) is refused, and the anchor loses its `href`. Navigation
  happens only after the cancelable event. Modified activations are left to the browser, and a refused link gives the
  browser no `href` to follow. I found no network request and no inline style or script in package code. `gate:csp`
  passes in CI.
- Accessibility: the phase reviews covered it per element. I checked that `ocelle-tabs` keeps the tablist in its
  shadow root while tabs and panels stay light-DOM children, so no ID reference crosses a shadow root. The link
  without `href` keeps `role="link"` and `tabindex="0"` and does not handle Space, which matches the link pattern.
  Forced-colours styles are present (LinkText/Highlight, ButtonBorder/ButtonText) and are under test (L1-01 concerns
  that test in CI).

## Test quality

- Red evidence: every phase's `tdd-check.json` is `pass` and its last review round is `approved` (phases 1–7). The
  merge changed no 014 test's meaning:
  - the Driver renames are mechanical;
  - `true as unknown as string` was removed from scenarios/segmented-choice.ts because main widened `setProperty`'s
    value type, which is a type-only change;
  - count updates.
- Weakened or vacuous tests: none found in the merge's test diff (see Gates). `link.test.ts` and `browser/link.test.ts`
  assert the whole observed object, plus `clipboard: []` and, on the fixture, `recorded: clean`, with no conditional
  assertion.
- Equivalent-mutant records (Principle VIII; research.md R-13): the new source has 31 `Stryker disable next-line`
  records, and each one gives a reason.
  - Most are Lit option-object equivalences, or are equivalent only in Chromium ("kept for engines that report null").
    The phase reviews accepted these, and they stay within R-13's in-process routing.
  - ocelle-link.ts:166 (the `event.button !== 0` guard) is a mixed record. Forced `false` is equivalent in Chromium.
    Forced `true` is not equivalent: the record says US5-3 kills it, but Stryker disables by mutator kind, so it is
    disabled anyway. The record says so, and it is acceptable, but no Stryker run checks that kill. I reported it as a
    fact, not a finding.
- Mutation on the integrated head: there is no CI result (L1-02).

## Checks run

| Command | Exit | Result |
|---|---|---|
| `pnpm run gate:contrast` | 0 | 175 pairs in light, 183 in dark (164 required per theme) |
| `pnpm run gate:manifest` | 0 | 27 elements checked, no finding |
| `pnpm run gate:prefix` | 0 | 522 files, no finding |
| `pnpm run gate:brand-rules` | 0 | 7 rules checked |
| `pnpm run gate:config-copies` | 0 | identical |
| `pnpm run gate:typecheck` | 0 | no type error |
| `pnpm run gate:signoff -- --range origin/main..HEAD` | 0 | 103 commits, no finding |
| `vitest run --project elements-node` readme, manifest, selection-pairs tests | 0 | 3 files, 808 tests passed |
| plant copies vs real manifest (`jq -S` diff, see Merge resolution) | n/a | only each plant's own difference |
| `vitest run --project elements link.test.ts -t US5-7` | could not run | Playwright's Chromium is not installed in this environment (`/opt/pw-browsers/chromium_headless_shell-1248` missing). I installed nothing. |
| CI run 44419041559 (`f1481d8`), read only | n/a | 47 jobs passed, 82 failed: Unit tests (2 of 8007) plus 80 mutation shards and the aggregate, all exit 2 from the failed initial test run |

As asked, I did not run the heavy gates (unit-tests, storybook-build, visual, axe, plants, mutation). Those results
rest on CI (`f1481d8`: Visual regression, Accessibility, Storybook build, every Plants shard, Content security and
Sign-off passed) and on the merge-notes gate table.

## Earlier findings

This is the first landing round. Phase 7 round 4's R4-02, the full plants run owed under decision 3, carries forward
as L1-06.
