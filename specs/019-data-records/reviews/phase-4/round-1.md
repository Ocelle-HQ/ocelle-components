---
phase: 4
round: 1
verdict: changes_requested
base: 4106d7d50025bec14023a86c39a34493e80ea49b
head: 6fc20963450d6984527b77fea3bd0070b1c13718
tdd_check: exempt
---

# Phase 4 review, round 1

Scope: `git diff 4106d7d..6fc2096` (no uncommitted change): T075's CHANGELOG paragraphs, the records `coverage.md`,
`quickstart.md`, `plants.md`, `tdd-exempt.md`, `tdd-check.json`, `operator-coverage-decision.md`, the tasks.md ticks,
and commit 6f97540 (two stubs in the `storybook-build/fail-empty-index` plant tree). No element, style, story,
baseline or test file changes in this phase.

The operator's CI-first decision (`reviews/operator-ci-first-decision.md`) overrides T078's full local visual and
plant runs and the whole-suite unit run. Those missing full local runs are not findings here.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | `packages/elements/README.md:1085`; `specs/019-data-records/research.md:1048`; `specs/019-data-records/tasks.md:706` | T076 is open. The README mapping has no `.sk-data-table` light-mode row, but #470 makes light mode a required state of the library's data table and the inventory lists a LightMode story (`sources/spec-kitty-design-inventory.md` § 1 and § What `develop` adds). The timeline (`research.md:1085`) and the chain (`research.md:1118`) each have that row. The operator chose G-1 (b) (`reviews/phase-4/operator-coverage-decision.md`). I re-checked the 51 rows (12, 19 and 20) against R-16 and inventory §§ 1 to 3 and found no other gap. `coverage.md`'s family-name check, its "pending inventory" check (one occurrence, the lead-in at README:1017) and its rc.10 check (none named) hold. | In a phase 4 fix round, work test-first: first commit a red statement in `packages/elements/test/node/readme.test.ts` for the row `` `.sk-data-table` `` \| data table light mode \| built in: the light and dark themes. Then add the row after README:1085 and the same row to R-16's phase 1 table in `research.md`. Record `red-commits` `fix-1` and tick T076 in `coverage.md` and `tasks.md`. |
| R1-02 | blocking | `specs/019-data-records/reviews/phase-4/tdd-exempt.md:12`; `packages/elements/CHANGELOG.md:15-19,141-142`; `packages/styles/CHANGELOG.md:8-11` | The exemption does not hold for T075. `tdd-exempt.md` says "no test can fail before them and pass after", but this repository tests its CHANGELOG statements. `packages/elements/test/node/changelog.test.ts:20-28` asserts 009's matching "are additions to the public surface: a minor change" sentence word for word. `readme.test.ts` asserts the CHANGELOG's final surface list (header comment, line 19) and this mission's own entry statements (from line 1001; the block-axis sentence at its `it` near line 1110). T075 adds two such final-surface sentences. It also corrects a false statement: at the base, the data table's entry gave `wrap` without "(reflected)", but `ocelle-data-table.ts:48` reflects it. A statement test for each would fail against 4106d7d's CHANGELOGs and pass at HEAD. So a test could have failed for this phase. This is the same reasoning by which the operator's G-1 decision makes the README row test-first. | In the same fix round, add statement tests for T075's text. In `packages/elements/test/node/changelog.test.ts` (or `readme.test.ts`), cover the five-element minor-change paragraph and the data table entry's `wrap` (reflected) / `stickyHeader` as `sticky-header` wording. In `packages/styles/test/readme.test.ts`, cover the four-blocks paragraph. Show that they fail on the base's CHANGELOGs (the tdd-check's final-tests-on-base log) and pass at HEAD. Remove T075 from `tdd-exempt.md`. |
| R1-03 | note | `specs/019-data-records/reviews/phase-4/plants.md:21-22` | Run 1 is described as "40 plants: the 23 of the elements' gates and 17 mutation plants". Its own log (`plants.md` run 1 `note: affected:` lines) lists 18 mutation plants and 22 others. Run 2's 22 are those 22. | Correct the counts when the record is next touched. |
| R1-04 | note | `specs/019-data-records/reviews/phase-4/quickstart.md:83` | The timeouts are attributed to "the `disconnectedCallback` and `observe()` lines". At HEAD, the lines named (timeline 146-147, event 125-126, chain 189-190) are each element's `connectedCallback` and its `super` call, just above `observe()`. The phase 2 record (`reviews/phase-2/mutation.md:59-62`) and the phase 3 record (`reviews/phase-3/mutation.md:19`) call them `connectedCallback`'s body and call. A timeout counts as killed, so the result stands; only the wording is off. | Say `connectedCallback`. |
| R1-05 | note | commit 6f97540; `gates/plants/storybook-build/fail-empty-index/tree/storybook/stories/` | This commit is outside T075 to T078's written scope, but the reason is sound and recorded. Phases 2 and 3 added two story files without stubs in this plant's tree, so the plant was "not-caught", and CI's Plants check would have failed. The plant tree now has a stub for every story file of `storybook/stories/` (a directory diff shows only `base-content.json` and `render.ts`, which are not story files). The plant's expectation is unchanged. `gate:plants -- --affected 4106d7d` selects only this plant and judges it as expected (Checks run). | None. |
| R1-06 | note | `specs/019-data-records/reviews/phase-4/tdd-check.json` | Its `head` is 247cdbb, which is older than HEAD. The only commit after it (6fc2096) redacts the path inside this file, so a re-run would give the same status. I did not re-run it, because that would write the sandbox path back. | None. |

## Test quality

- **Red evidence:** none, because the phase is exempt. The exemption holds for T076, T077 and T078, which are review
  records and gate runs with nothing a test could assert. It does not hold for T075 (R1-02). G-1's row is to be
  test-first (R1-01).
- **Weakened tests:** none. No test file changes between 4106d7d and HEAD.
- **009's tests unedited (SC-007):** confirmed. The 18 files that `quickstart.md` lists, and their fixtures and
  scenarios (`fixtures/overflow-host.ts`, `fixtures/list-detail-controls.ts`, `scenarios/scroller.ts`,
  `scenarios/list-detail.ts`, `scenarios/board.ts`, `scenarios/lane.ts`, 009's `browser/fixtures/*.html`), are
  unchanged since 8d104af. Every test file that the mission changed (rather than added) is shared harness, never one
  of 009's bodies: `driver.ts`, `in-process.ts`, `global-setup.ts`, `serve.ts`, `scenarios/driver.ts`, the
  define/entry/exports/manifest/readme tests and `build.test.ts`. Those changes are additions, for example the
  per-run module query in `browser/driver.ts`, which phases 1 to 3 reviewed. I re-ran the 18 files and all 315 tests
  passed.
- **Mutation (phase base):** `pnpm run gate:mutation -- --base 4106d7d` exits 0: "nothing to mutate: no package or
  gate source line changed".
- **Mutation (the mission's three batches, T078 step 6):** the record is sound.
  - `gate:mutation -- --base 8d104af --plan` gives 43 shards over exactly 10 files: `gates/bin/mutation.ts`,
    `gates/lib/mutation/report.ts`, `index.ts`, `ocelle-data-table.ts`, `overflow-region.ts`,
    `ocelle-event-timeline.ts`, `ocelle-timeline-event.ts`, `timeline-time.ts`, `ocelle-evidence-chain.ts` and
    `ocelle-evidence-step.ts`.
  - Batches A, B and C name each of these files whole, once. Nothing is cut, so no mutant spans a cut.
  - Batch A repeats phase 1's accepted count (533 mutants, 131 compile errors, 2 zero-mutant entries, 32 equivalent
    records). Batch B's 149 / 4 timeouts / 19 compile errors matches phase 2. Batch C's 99 / 2 / 15 matches phase 3
    minus its one-off record line.
  - No element or gate source has changed since phase 3's approval (`git log 4106d7d..HEAD` on `packages/*/src`,
    `gates/lib` and `gates/bin` is empty).
  - Only summary lines are committed, which is what T078 asks for. The timeout wording is R1-04.

## Checks run

On HEAD 6fc2096, one at a time:

| Check | Exit | Summary |
|---|---|---|
| `gate:typecheck` | 0 | no type error in the files of tsconfig.json |
| `gate:lint` | 0 | 458 files checked, no finding |
| `gate:style-lint` | 0 | 43 files checked, no finding |
| `gate:test-lint` | 0 | 337 files checked, no finding |
| `gate:manifest` | 0 | 23 elements checked, no finding |
| `gate:config-copies` | 0 | the two story-config copies are identical |
| `gate:csp` | 0 | 41 files checked, no finding |
| `gate:prefix` | 0 | 477 files checked, no finding |
| `gate:contrast` | 0 | 169 pairs in light, 177 in dark (158 required per theme) |
| `gate:brand-rules` | 0 | 7 rules checked |
| `gate:signoff -- --range 4106d7d..HEAD` | 0 | 5 commits checked, no finding |
| `vitest run` README and CHANGELOG tests (`elements-node` readme and changelog, `styles` readme) | 0 | 3 files, 787 tests passed |
| `vitest run` on 009's 18 test files | 0 | 18 files, 315 tests passed |
| `gate:mutation -- --base 4106d7d` | 0 | nothing to mutate |
| `gate:mutation -- --base 8d104af --plan` | 0 | 43 shards, 10 files (see above) |
| `gate:plants -- --affected 4106d7d --list` | 0 | 1 of 315: `storybook-build/fail-empty-index` |
| `gate:plants -- --affected 8d104af --list` | 0 | every plant, by `gates/lib/mutation/report.ts`, 315 of 315 (matches `plants.md`) |
| `gate:plants -- --affected 4106d7d` | 0 | 1 of 315 judged, every plant as expected (checks 6f97540 only, not a re-judgement of `plants.md`) |

Not run here, under CI-first: the full `gate:visual`, the full plant run and the whole `gate:unit-tests`. The
implementer's `gate:storybook-build`, `gate:axe` and `visual:update` lines are in `quickstart.md`. Step 5 (Storybook
by hand) was not done.

**T075 against the manifest and the exports.**
- `custom-elements.json` agrees with the elements paragraph (`CHANGELOG.md:15-19`):
  - `ocelle-data-table`: `label`, `wrap`, `sticky-header`/`stickyHeader` and `striped`, no part.
  - `ocelle-event-timeline` and `ocelle-evidence-chain`: `label`, part `list`.
  - `ocelle-timeline-event`: `time` and `wrap`, slots default and `time`, parts `time` and `content`.
  - `ocelle-evidence-step`: `variant` and `wrap`, part `content`.
  - Every one of the five has `events: []` and no CSS custom property.
- `package.json` exports the five entry points, and `src/index.ts` exports the five classes.
- `wrap` (`ocelle-data-table.ts:48`), `sticky-header` and `striped` reflect, as the corrected entry
  (`CHANGELOG.md:141-142`) now says.
- The styles paragraph names the `data-ocelle-align` hook with `end` and the base-style hook. It says no token was
  added, and `packages/tokens` is unchanged by the mission.
- The block-axis option's internal-change sentence (`CHANGELOG.md:12-13`) is there from phase 1.
- The content is right. Its missing test is R1-02.

**T077 (R-17), from the repository.**
- The state is open, as `coverage.md` records. The local `origin/main` (b594b7e) is an ancestor of HEAD. There,
  `OverflowRegionOptions` has `box`, `role` and `step`. At HEAD it also has the mission's `blockAxis` and
  `blockStartBox`.
- No pinned-start option exists. In `packages/elements/src`, "pinned-start" appears only in README:945, which says
  the caption scrolls until the option lands.
- The remote was not fetched.

**T078's plant records.**
- `plants.md`'s base is the mission's base (8d104af), not `base.sha`, because T078 prescribes it.
- On `base.sha`, the selection is the one plant that 6f97540 touches. Run 2 judged it, and I re-ran it.
- The scoping is sound for what it judges:
  - Run 2 puts four paths back to the mission's base: `report.ts`, `mutation.ts`, `packages/elements/package.json`
    and the `mutation/error-checker-failure` plant. That leaves the 22 plants of the gates the elements' changes
    reach (contrast, brand-rules, manifest, storybook-build, visual and axe). None of those gates reads the restored
    files, and `storybook-build/pass-repository` passed on that tree.
  - The mutation gate files and plants were last changed in phase 1 (c8452f4, `git log 8d104af..HEAD`). Phase 1's
    sharded full run judged them there.
  - `package.json` changed only by entry-point lines (c08b1ec, 2836827, dd0ad04).
  - The remaining plants are left to CI's Plants check, as the CI-first decision allows.
- Run 1's two problems are explained:
  - The checker plant failed because of the scoping.
  - The empty-index plant was a real stale fixture, fixed in 6f97540 (R1-05).
- The recorded exit is 0 for the selection and 0 for run 2.

**Baselines (SC-007).** `git diff --name-status 8d104af HEAD -- storybook/baselines` adds 96 files, 42 + 26 + 28, and
modifies or removes none. That equals 2 themes × the 21 + 13 + 14 story exports.

## Earlier findings

None. This is round 1.
