---
phase: 6
round: 1
verdict: approved
base: 89a1369c0e2d4ee15eb9ec2598b211fd99ba4809
head: 2b5e298b4567cd7d208620cb2a0e22ee1378cad8
tdd_check: pass
---

# Phase 6 review, round 1

User Story 5 covers row states and the card layout (T060 to T068, with T061a and T064a). The change under review is
`git diff 89a1369..2b5e298`. The working tree is clean.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | specs/012-button-action-row/tasks.md:279; specs/006-storybook-workbench/plan.md:637 | **T067 is still open.** It needs a push and a CI run at 72 stories, and neither the implementer nor the reviewer may push. I judge that it belongs to landing and does not block this phase. The phase checkpoint (tasks.md:282) is `tdd-check.sh 6` = pass, and that holds. The constitution's merge gate already requires the gate plants in CI, so CI will run the check that T067 records. All the work that can be done locally is done: the 76 shards passed locally (notes.md), I ran shards 40, 1, 2 and 3 again, and the T068 figures are corrected. One risk is worth stating. By 006's own record, at the slowest measured rate (1.457 s per story-theme), 387 + 1.457 × 146 = 599.7 s, so the split count is exactly 72 stories. At the full story count there is therefore no margin on a slow runner. The local docker shard times (about 100 to 234 s) do not predict CI times. | Before merge: push, record `reviews/phase-6/ci-run.md` with every Plants shard's time and the run's total, and tick T067. A shard at or over 10 minutes is a stop-and-ask (T067), and the merge waits for the operator. |
| R1-02 | note | packages/elements/test/node/manifest.test.ts:381-417; gates/test/integration/{axe,plant-repo,storybook-build,visual}.test.ts | The red commit changes two more existing test files than the two the operator named. (1) Phase 5's manifest test for `ocelle-action-row` now pins `current` and `unavailable` in its exact member and attribute lists. (2) The pinned counts in four gate tests move from 61 to 72 stories, 122 to 144 story-themes, 124 to 146 axe plant runs and 122 to 144 baselines. Neither change loosens anything. (1) makes the exact list longer, so it is stricter, and T062 requires it ("manifest.test.ts … for `current`, `unavailable`"). (2) is the count update every phase makes. The only expectations that were replaced are US2-12 (link.ts) and the readme custom-states sentence, as the operator authorised. | None. |
| R1-03 | note | packages/elements/src/ocelle-action-row.ts:622-627 | A cancelled activate calls `preventDefault()` on the originating click in both modes. In link mode this is FR-033 and is tested (sink and fixture "cancelled" bodies; plant "cancel not forwarded"). In button mode its only effect is that the delivered `click` has `defaultPrevented: true`. That matches `ocelle-button` (ocelle-button.ts:103-104 and README.md:200 state it for the button). The row's `@fires` text (ocelle-action-row.ts:109-112) and its README lines state only the link case, and no row test pins the button-mode `click.defaultPrevented`. It is harmless and consistent across both elements. | Optional: say it in the row's `@fires` text the next time the file is touched. |
| R1-04 | note | storybook/baselines/elements-ocelle-action-row--current-{page,true}.{light,dark}.png | The "Current page" and "Current true" baselines are byte-identical (`cmp`). This is correct: the two values differ only in the `aria-current` value, not in how they look (FR-037). | None. |
| R1-05 | note | reviews/phase-6/tdd-check.json | `head` is 614207e and HEAD is 2b5e298. 2b5e298 adds only the tdd-check record files (`check-*.log`, `tdd-check.json`), so the check covers the reviewed code and tests. | None. |

No blocking finding.

## Test quality

- **Red evidence.** red-commits names the phase red commit 14ca8d5. It changes only test files and the phase's
  specs/ evidence (base.sha, spike.md, notes.md). red-phase.log has 109 of 3824 tests failing. Every failure is an
  assertion mismatch or the driver's own `no .bar in the shadow root` on a row that draws no bar. The examples:
  - US5-6: 126 and 114 events where 0 are expected;
  - US5-9: `titleGap: -23.2` where 4 is expected;
  - US5-8: `lines: false`;
  - US2-12;
  - the pinned counts and the story tests.

  I found no import, syntax or setup error (grep for `Cannot find`, `SyntaxError`, `Failed to`, `ReferenceError`,
  `TypeError`). tdd-check.json: `pass`, red exit 1, final tests on base exit 1 (check-final-tests-on-base.log: an
  assertion failure, for example the visual gate's 144-capture test), head exit 0.
- **Nothing was weakened after red.** `git diff 14ca8d5..HEAD` on the test paths touches only
  `packages/elements/test/action-row.test.ts`, which gains 18 lines in c6eb589.
- **Survivor test c6eb589.** It adds one new `describe` block (action-row.test.ts:312-328): a Ctrl, Meta, Shift and
  Alt click on a button-mode row each give exactly one `click` and one `ocelle-action-row-activate`. It changes no
  existing test and no source file. Its only file is the test file, as authorised (option (a), operator question 2 in
  notes.md). It kills the mutant at ocelle-action-row.ts:624: my mutation run below has no survivor.
- **US2-12 replaced by a stricter test (T061a, decision 32).** The old test expected `lp: ["pressed"]`. The new one:
  - expects `lp: []` in `set`, `off`, `again` and `empty`;
  - adds a mode-switch step for `sw`: it matches `:state(pressed)` in button mode, stops matching once `href` is set
    (inner `<a>` without `aria-pressed`), and matches again once `href` is removed.

  The reason is recorded in the red commit message and in notes.md. readme.test.ts:180 gains only "in button mode".
  The plant "`pressed` state in any mode" fails US2-12 (plants.md).
- **Assertions.** Each body in row-states.ts returns its observations and is compared with `toEqual` against values
  written by hand: token colours by name, forced-colour keywords resolved in the page, measured geometry, event
  counts and sink records. There is no conditional assertion, `skip`, `only`, snapshot or mock. Every "does not"
  shares its body with a positive twin: the available row's one event, the hover change on the non-current row, the
  plain click's navigation, and the flush available row's dashed outline. `test-lint` passes.
- **Coverage of the story.**
  - US5-1: sink, fixture, cancel, and Space on a link.
  - US5-2: Ctrl, Meta, Shift, Alt and middle clicks, sink and fixture. The fixture keeps phase 3's Meta-click
    reading: on Chromium on Linux a Meta-click navigates the current tab.
  - US5-3: `page`, `true`, `step`, `false`, `""`, absent, and current on a button-mode row.
  - US5-4: the mark, hover, geometry stability, axe, and ring, gap and bar read apart in ltr and rtl, light and dark.
  - US5-5 and US5-6: button and link mode, Tab and Shift+Tab order, every click, key and `click()`, stretched and
    restyled hosts.
  - US5-7 and decision 31: inks, no hover, the unavailable current surface, axe on 12 unavailable cases per theme,
    and the wrappers' `aria-disabled` set and cleared.
  - US5-8 to US5-12, busy with unavailable, forced colours with both palettes, and the reflection test.
  - The story tests (T063) cover the eleven new stories.
- **Element plants.** plants.md lists 12, run on cf36bbf, and each one makes tests fail.
- **Mutation** (`pnpm run gate:mutation -- --base 89a1369`, run by me): 77 mutants on the changed lines of
  `ocelle-action-row.ts` and `ocelle-button.ts`, none survived; 0 timeouts, 9 compile errors, 0 zero-mutant entries,
  0 equivalent records. I read the compile-error lines. They are type-level mutants: the `#current()` narrowing at
  :631, the `controlState` arrow at :573 and the states array at ocelle-button.ts:526. None is a finding.

## Checks run

All were run by me on 2b5e298, one heavy job at a time, with docker up.

| Check | Result |
|---|---|
| `pnpm test` | 3825 tests passed in 152 files, exit 0 |
| `gate:mutation -- --base 89a1369` | pass, as above |
| `gate:typecheck` | no type error |
| `gate:lint` / `gate:test-lint` / `gate:style-lint` | 290 / 196 / 16 files, no finding |
| `gate:csp` / `gate:prefix` / `gate:pins` / `gate:manifest` | 14 / 310 files, 5 manifests, 4 elements, no finding |
| `gate:contrast` / `gate:brand-rules` / `gate:config-copies` | 198 + 206 pairs (187 required) / 7 rules / identical |
| `gate:signoff -- --range 89a1369..HEAD` | 8 commits, no finding |
| `gate:storybook-build` | built 72 stories |
| `OCELLE_VISUAL_ENGINE=docker gate:visual` | 144 captures match (docker only; the podman cross-engine check is not available here, and CI confirms it at landing as recorded) |
| `gate:axe` | 144 story-theme runs, 0 serious or critical; 10 notes (the Prose document's excepted nodes) |
| `OCELLE_VISUAL_ENGINE=docker gate:plants -- --shard 40` | `visual/fail-token-changed`: every plant as expected, 234 s |
| `gate:plants -- --shard 1`, `2`, `3` | 77, 76 and 76 plants (the manifest plants among them), every plant as expected; 116, 102 and 98 s |

I did not repeat the full 76-shard run, which takes about 3 hours. notes.md records all 76 shards passing on cf36bbf,
and the shards I ran cover the two plant changes of this phase.

**The items I was asked to judge.**
- **Baselines.** All 22 are new files (`0 -> N bytes` in the diff), so no existing baseline changed (constitution V).
  The "card with many tags" pair was rewritten by `visual:update` before commit, so it has a single committed version.
  `gate:visual` matches all 144 under docker.
  - I inspected the "card with many tags" baseline: three lines of tags wrapping between tags in the 1280 px frame.
  - I inspected the "current focused" baseline. I sampled pixels in dark at the block centre: ring at 2 to 4 px from
    the border edge, `accent-low` gap at 5 and 6 px, bar at 7 to 9 px, then the surface.
  - I inspected the "unavailable current" baseline: the `accent-low` surface stays and the bar is in disabled ink at
    7 to 9 px. This matches decision 21 and reading (i) of decision 31.
- **`fail-token-changed`** gains exactly the eight light story-themes that show `color-ink`: current page, current
  true, current hovered, current focused, link row, card, card with many tags and card rtl. It leaves out unavailable,
  unavailable current and chrome current, whose text is in disabled ink or chrome ink. The `why` text names the
  phase. Shard 40 passes.
- **Manifest plant copies.** I compared each of the 8 copies with the regenerated manifest (sorted JSON):
  - `fail-lost-attribute` differs only by the removed `label` attribute;
  - each of the six `fail-undescribed-*` copies differs only by its one appended plant module;
  - `pass-reordered` is semantically identical but not byte-identical (its keys are reordered);
  - `break-not-json` is unchanged.

  Each copy keeps its own defect, and shards 1 to 3 judge them as expected.
- **Card grid** (ocelle-action-row.ts:272-298).
  - `grid-template-areas: "title trailing"` creates the implicit `title-*` and `trailing-*` lines.
    `grid-template-columns: [full-start] 1fr auto [full-end]` names the outer lines, so `grid-column: full` resolves
    to `full-start / full-end`.
  - The description and tags are placed automatically into the implicit rows below. The row gap is
    `--ocelle-space-1` (FR-038), and the trailing column collapses to 0 when the trailing slot is empty.
  - Both directions mirror correctly: US5-9 and US5-10 measure a title gap of 4 px, the trailing icon on the title
    line 13 px from the inline end, and the content start, in ltr and rtl.
  - No raw number was needed: style-lint passes with no new allowance.
  - One harmless detail: `:host([layout="card"]) .end { display: contents }` outranks `.end[hidden]`. A hidden `.end`
    is therefore `contents` rather than `none`, but both of its children are then hidden themselves, so it produces
    no box.
- **Cancelled activate and the click.** See R1-03. The behaviour is correct in link mode, harmless in button mode, and
  consistent with `ocelle-button` (FR-023).
- **T068.** I checked the arithmetic:
  - 387 + 1.377 × (2 × 72 + 2) = 588.0 s;
  - size 2 is 789 s and size 3 is 990 s;
  - 73 × 588 s = 42,924 s, about 11.9 h;
  - 76 − 72 = 4 stories of headroom.

  gates/README.md:57-66 and 006 plan.md:637 say the same. notes.md (Green notes, T068) records the operator's request
  to open, when this feature lands, a triage record for a plant design whose shard time does not grow with the story
  count. See R1-01 for the margin at the slowest rate.
- **Plan decisions.**
  - **30 (positive stacking).** `.layout` is at `z-index: 0` and the hit layer at 0. The content is at 1, the bar sits
    inside the layer, and the siblings take no pointer events.
  - **31.** The wrappers carry `aria-disabled` from `controlState` (ocelle-action-row.ts:661-664). An unavailable row
    keeps its current surface because every hover rule is gated on `:not([unavailable])` (:346-366).
  - **32.** `pressed` is set only when `linkHref(...) === undefined` (ocelle-button.ts:526), recomputed in `updated()`
    on every mode change. The `@cssstate` text, README and CHANGELOG say "button mode only".
- **Motion rule (phase 4).** The row adds no transition or animation, and `gate:brand-rules` passes.
- **Constitution.**
  - I: `ocelle-` names and event; no I/O.
  - II: tokens only; style-lint, contrast and brand-rules pass.
  - III: no ID reference crosses the shadow root; the bar stays apart from the ring; forced colours; axe at 0.
  - IV: `gate:csp` passes.
  - V: a story and a baseline per new state.
  - VII: CHANGELOG lines for `current`, `unavailable`, `layout="card"` and `:state(pressed)`.
  - VIII: as above.

## Earlier findings

This is round 1 of phase 6, so there is no earlier round of this phase.

**Phase 5 review R1-01** (a note, to be fixed in a later phase that touches the file) is **resolved**:
- The header comment of ocelle-action-row.ts:1-57 now describes decision 30's structure:
  - the layout wrapper is the host's single stretched grid item, and the hit layer fills the host;
  - the control is named from content with no internal reference;
  - the colour rules target the hit layer, the bar, the control and the sibling wrappers.
- The `@csspart control` text (:103-105) states that the part is the icon-and-title control and not the row's surface.
- The regenerated manifest carries that text. manifest.test.ts pins it word for word ("describes the row's part
  control as its icon-and-title control …"), and `gate:manifest` passes.
