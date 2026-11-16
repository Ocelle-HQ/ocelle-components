---
phase: 5
round: 1
verdict: approved
base: cf52eb16666c41c0fd982f4d58491ff9fab775f2
head: f3e6ce7f4840b29747efc7725b49527d8053c12e
tdd_check: pass
---

# Phase 5 review, round 1

User Story 4, `ocelle-action-row`, tasks T049a to T059. Change under review: `git diff cf52eb1..f3e6ce7`, with a
clean working tree. The red commit is df9dcc7 and the scaffold is 5e3d44b. The operator decisions recorded in
notes.md and in plan decision 30 are taken as given: row structure (b) then (c), the positive stacking, the survivor
tests of option (a), and the line 421 simplification.

## Findings

No blocking finding.

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | packages/elements/src/ocelle-action-row.ts:4-7, 16-18, 36-38, 85 | Parts of the file's header comment describe the structure from before decision 30. Line 5 says "the inner control its single stretched grid item", but the layout wrapper is that item and the hit layer fills the host. Lines 16-18 say that with no higher source "the inner control is labelled by its own `[part=title]` wrapper", but since decision 30 the code names it from content with no internal reference (T056; `updated()` at lines 524-532 sets `ariaLabelledByElements` only from a host `aria-labelledby`). Lines 36-38 describe the colour rules as `.control:where(...)`, but they target `.hit` and the sibling wrappers. The `@csspart control` text (line 85, and so the manifest's `cssParts[0].description`) does not state what the README states (decision 30, T057): the part is the icon-and-title control, not the row's surface. Behaviour, the README and the tests are all correct; only the comment and the manifest text lag. | Before landing, in any later phase that touches the file: bring the header comment and the `@csspart control` description in line with decision 30, then regenerate the manifest. Not blocking. |
| R1-02 | note | reviews/phase-5/check-final-tests-on-base.log:42 | The run of the final tests against base exited 2 with "could not run: no test file found". That run is not a failure for the right reason. The tdd-check counts it as non-zero, which is correct for its rule. The evidence that the tests fail against the old code is the scaffold run instead (exit 1, 196 of 3720 tests failing, check-final-tests-on-scaffold.log): every failure there is an assertion, or one of the drivers' own "no shadow root" / "no .hit" / "no inner control" errors on the scaffold's empty element. That is the missing behaviour, not a setup error, and it is the scaffold's purpose here. | None. Recorded so a later reader does not take the base exit as proof. |
| R1-03 | note | storybook/baselines/elements-ocelle-action-row--busy.{light,dark}.png | The Busy baselines are byte-identical to the All slots baselines (`cmp`). This is correct: on a row, `busy` only sets `aria-busy` and does not block activation (FR-035), so it has no look. The baseline pins that busy changes nothing visible. | None. |
| R1-04 | note | reviews/phase-5/plants.md | The element plants ran on 1274bbd, before 4637d79 changed the moved-attribute callback (line 421). That change touches no CSS and no rendering path a plant targets. The second mutation run, which I repeated on HEAD, covers the changed line. | None. |

## Items the coordinator asked me to judge

- **28 baselines (26 new, 2 tokens--shape changed): accepted.**
  - Notes.md records that they were written only by `OCELLE_VISUAL_ENGINE=docker pnpm run visual:update` in the pinned
    container ("wrote 28 files (26 added, 2 changed, 0 removed)").
  - My own `gate:visual` run on HEAD: "122 captures match their baselines (docker only: no cross-engine comparison)".
  - I inspected all-slots light, chrome dark, focused dark and flush-hovered light:
    - the ring is inside the row on all four sides;
    - chrome ink and chrome-muted are correct;
    - the flush hover is a fill with no border;
    - the description and tags are drawn beside the title, over the layer's surface.
  - The tokens--shape change adds only the `--ocelle-focus-offset-inset` line, `calc(-1 * (2px + 3px))`, as T052 and
    T055 require.
  - The missing podman cross-engine check is expected; CI confirms it at landing.
- **44 px minimum on the native "before"/"after"/"start" buttons in the test pages (`nativeRules`, scenarios/action-row.ts): accepted.**
  - These buttons are page fixtures that mark where focus starts and ends; they are not the element under test.
  - axe's `target-size` would name those native buttons, not the row.
  - The row's own target is the hit layer, which fills a host at least `--ocelle-target-min` tall (US4-11, and US4-15's
    box equality). Its stories have no native buttons and give 0 findings in `gate:axe`, which I re-ran.
  - So the rule hides no finding about the row. It only keeps the fixture's own buttons out of the result.
- **Pair-count pin 394 → 404 in the red commit: accepted.**
  - `pairs.json` gains exactly 10 entries: `color-ink-soft` on the five state grounds, in light and in dark (R-08 item 2).
  - This matches 193→198 and 201→206.
  - The pin is in df9dcc7 with the other pinned counts. `git diff df9dcc7..HEAD` on the test paths changes no pin.
- **Plant "name from content" replaced by "description wrapper back inside the inner control": accepted.**
  - Since decision 30, the row is named from its content by design, so the old plant (dropping the internal title
    reference) has nothing left to guard.
  - The property it guarded, "the name is exactly the title", is now guarded by the new plant. That plant made US4-3
    (the AX subtree's text and axe `label-content-name-mismatch`) and US4-12 fail.
  - contracts/checks.md lines 32 and 87 and T050 already name the new plant.
- **fail-token-changed gains 12 row story-themes: accepted.**
  - The 12 are every row story's light theme except chrome, whose text uses `chrome-ink`, not `color-ink`.
  - The plant's `why` records it.
  - I ran `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 40`: "1 plant judged, every plant as expected",
    191.4 s.

## Verified operator decisions

- **Positive stacking matches planner commit 1016c03.**
  - `.layout` is `position: relative; z-index: 0` with no `isolation` (src lines 128-130).
  - `.hit` is `position: absolute; inset: 0; z-index: 0` (186-189).
  - The icon wrapper, the title, `.description`, `.tags` and `.trailing` are `position: relative; z-index: 1` (213-220).
  - `.hit` is `background-color: Canvas` under forced colours (310-313).
  - The siblings and the `.lead` and `.end` groups have `pointer-events: none`, and the control has `auto`
    (151-156, 179, 222-226).
  - The wording of data-model.md lines 103-130, plan decision 30 and T056 matches.
- **440340a changes no existing test.**
  - `git diff df9dcc7..HEAD -- packages/elements/test/action-row.test.ts` has no removed line, only 107 added lines.
  - It is the only test file changed after the red commit.
- **4637d79** removes only the redundant condition in the `MovedAttributes` callback (lines 420-423). The mutation run
  on HEAD shows no survivor.
- **Order of commits:** scaffold 5e3d44b, then planner 549409b (specs only), then red df9dcc7.

## Test quality

- **Red evidence.**
  - `red.sh` on df9dcc7: tests only, 192 of 3715 failed (red-phase.log).
  - tdd-check: red exit 1, scaffold exit 1 (196 of 3720), head exit 0, status `pass`, no problem listed.
  - The failures are assertion mismatches on the absent rendering, events, AX state and look, plus the drivers' own
    errors on the scaffold's empty shadow root. No import, syntax or setup error: I grepped both logs for
    `Cannot find`, `SyntaxError`, `Failed to load/resolve` and `TypeError`, and found none.
  - The one knock-on failure, `vitest-mutation-config` ordering, is explained in notes.md and passes at HEAD.
- **Scaffold.** 5e3d44b adds only `export class OcelleActionRow extends LitElement {}` and a comment: no behaviour, no
  test file.
- **No test weakened.** Only additions after the red commit (440340a), as the operator authorised.
- **Vacuity.**
  - Each scenario body returns one object compared with `toEqual` against hand-written expectations.
  - I found no conditional assertion, `skip`/`only` or snapshot.
  - The in-process tests compare whole objects as well.
  - The survivor tests assert observables: inner-control ARIA attributes, `ariaDescribedByElements` after a text-node
    data write, a flattened forwarded slot, labelledby resolution before connection and after moving into a shadow
    tree, and the exact shrink-wrap width.
- **Coverage.**
  - US4-1 to US4-18 each have a body.
  - US4-1 and US4-10 cover pointer, Enter and Space, and US4-1 covers `click()` too.
  - US4-3 covers Tab and Shift+Tab order.
  - Edge cases: an empty title in button and link mode, unknown values, mirrors and morph, and the host guard.
  - Forced colours are covered for both palettes.
  - The parts of US4-8 and US4-9 that concern `current`, and card-layout geometry, belong to phase 6 by the task split.
- **Mutation (`pnpm run gate:mutation -- --base cf52eb1`, run by me on HEAD).**
  - Result: "191 mutants on the changed lines of 3 files, none survived; 3 timeouts, 35 compile errors, 1 zero-mutant
    entry; 1 equivalent record".
  - The equivalent record (line 99, `label: { type: String }` → `{}`) is valid: Lit's default options give the same
    attribute `label`, the default converter and no reflection.
  - The timeouts (lines 444, 452, 458: the observer options, an emptied `connectedCallback`, and the
    `super.connectedCallback()` call removed) are reports. Each stops the element from rendering or constructing, so
    the bodies wait until the timeout.

## Checks run

All on HEAD f3e6ce7, one heavy job at a time, with docker up.

| Check | Result |
|---|---|
| `pnpm test` | 3720 tests passed in 152 files |
| `gate:typecheck` | no type error |
| `gate:lint` / `gate:test-lint` | 289 / 195 files, no finding |
| `gate:style-lint`, `gate:csp`, `gate:prefix`, `gate:pins` | 16, 14, 309 files, 5 manifests: no finding |
| `gate:manifest` | 4 elements, no finding |
| `gate:contrast` | 198 pairs in light, 206 in dark, 187 required per theme |
| `gate:brand-rules` | 7 rules checked |
| `gate:config-copies` | identical |
| `gate:signoff -- --range cf52eb1..HEAD` | 12 commits, no finding |
| `gate:storybook-build` | 61 stories |
| `gate:axe` | 122 story-theme runs, 0 serious or critical; 10 notes (the Prose document's excepted) |
| `OCELLE_VISUAL_ENGINE=docker gate:visual` | 122 captures match (docker only) |
| `gate:mutation -- --base cf52eb1` | pass (above) |
| `gate:plants -- --shard 40` (fail-token-changed) | every plant as expected, 191.4 s |
| `gate:plants -- --shard 1` (incl. the manifest plants' copies) | 77 plants, every plant as expected |

I did not re-run the other 74 plant shards (8417 s in all). Notes.md records all 76 shards as "every plant as
expected" on 5b0917c, and nothing since then changes a gate or a plant tree. I did not re-run the element plants of
plants.md, because that would mean editing source. The mutation run is my independent evidence of the tests'
strength.

Tasks: every task of `## Phase 5:` (T049a to T059) is ticked, and its work is present.
- T049a: spike.md.
- T050 to T054: the red commit.
- T055: source.ts, pairs.json, tokens README and CHANGELOG.
- T056: the element.
- T057: package.json export, manifest, README, CHANGELOG, including decision 30's four README sentences.
- T058: the stories, the fail-empty-index tree, fail-token-changed, the baselines.
- T059: plants.md, gate runs, mutation.

Changes outside the element are the pinned counts of the gate tests, the manifest plants' copies (8f78754), and the
planner's spec, plan, research, data-model, contracts and tasks edits (549409b, 1016c03). The operator decisions
cover all of them.

Constitution:
- I: `ocelle-` names and events.
- II: tokens only (the new `focus-offset-inset` is derived from existing tokens); brand rules pass.
- III:
  - no ID reference crosses the shadow root (element reflection, host-tree resolution);
  - host ARIA reaches the inner control;
  - native keyboard model;
  - token ring drawn inside the row;
  - the row is at least 44 px tall;
  - forced-colours table;
  - axe is clean on every story.
- IV: adopted styles only; `gate:csp` passes; no network.
- V: one story per state in light and dark, each with a pinned-container baseline.
- VII: CHANGELOG names the additions.
- VIII: as above.

## Earlier findings

None: this is round 1.
