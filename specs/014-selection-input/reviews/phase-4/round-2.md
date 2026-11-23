---
phase: 4
round: 2
verdict: approved
base: 29ae41cd83ce3da6d317c5304bd628df3648c149
head: bdcdc1f
tdd_check: pass
---

# Phase 4 review, round 2

This round reviews the fixes made since round 1: `git diff 983cefe..bdcdc1f`, with the whole phase checked again
against base `29ae41c`. That range holds two commits:
- e29033c, the implementer's fixes;
- 816c428, the planner's edits to `research.md`.

The resolutions are recorded in `round-1-fixes.md`. The working tree was clean before the review and is clean after it.
The operator decisions listed in round 1 are still in force and are not findings.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|

None.

## Test quality

**Red evidence.** `tdd-check.json` (head e29033c) reports `pass`:
- red exit 1;
- final tests on the base: exit 2;
- final tests on the scaffold: exit 1;
- head: exit 0.

bdcdc1f differs from that head only by the check commit.

**R1-01, the joined forced-colours bar in US3-11** (`packages/elements/test/scenarios/segmented-choice.ts:308-318`,
`:715-744`). The body keeps every computed read and adds a pixel read back:
- the read is a run of the colour `over(Highlight, Canvas)` across the bar's block-end edge;
- the expected value is `paint: { colour: "Highlight over Canvas", width: 3 }`;
- `distinct` also asserts that this composite colour differs from `Canvas` and from `ButtonBorder`.

This is stricter than both the red form and the round-1 form. The red form could not pass, because the emulated
Highlight is translucent. The round-1 form could not see a hidden bar.

I applied my three plants myself, each alone, to the forced-colours `::before` rule in
`src/ocelle-segment.ts:196-199`, and ran each with `-t "US3-11"`. The unchanged baseline passes. Each plant now fails
US3-11 on the new pixel read, which receives `{ colour: "none", width: 0 }`:
- `display: none`;
- `visibility: hidden`;
- `position: static`.

`plants.md` records the three plants, and the notes entry is updated.

**No fix-1 red commit.** R1-01 was a weakened-test finding, not a behaviour defect. The element already painted the
bar, so a stricter test could only pass on the code, and the plants are the evidence that it can fail. No behaviour
changed, so no `fix-1` entry is expected in `red-commits`.

**Test files changed since round 1:**
- only `scenarios/segmented-choice.ts`: the US3-11 body above, plus comments beside US3-11 and FR-006;
- no assertion was removed or loosened (`git diff 983cefe..HEAD -- packages/elements/test`).

**Mutation.** `pnpm run gate:mutation -- --base 29ae41c` exits 0:
- 271 mutants on the changed lines of 4 files, none survived;
- 0 timeouts;
- 80 compile errors and 2 zero-mutant entries, which are reports, as in round 1;
- 6 equivalent records.

The records changed in their reasons only (R1-04), and the disabled mutator kinds are the same. My round-1 mutant
application therefore still holds: every surviving mutant under a record is equivalent. Each reason now names the
equivalent mutants and the mutants of the same kind that are killed, and both lists match what I measured.

## Checks run

All checks were run one at a time on bdcdc1f, with
`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and `OCELLE_VISUAL_ENGINE=docker`:

| Check | Result |
|---|---|
| gate:typecheck | exit 0 |
| gate:lint | exit 0, 305 files |
| gate:test-lint | exit 0, 205 files |
| gate:style-lint | exit 0, 22 files |
| gate:brand-rules | exit 0 |
| gate:pins | exit 0 |
| gate:config-copies | exit 0 |
| gate:prefix | exit 0, 276 files |
| gate:contrast | exit 0: 166 pairs in light, 174 in dark |
| gate:manifest | exit 0, 9 elements |
| gate:csp | exit 0, 27 files |
| gate:signoff `--range 29ae41c..HEAD` | exit 0, 17 commits |
| gate:unit-tests | exit 0, 3822 tests in 160 files (both harnesses, so the restored pixel read also passes on the strict-CSP fixture) |
| gate:mutation `--base 29ae41c` | exit 0 (above) |
| gate:plants | exit 0: 301 plants of 17 gates and the registry, every plant as expected (run detached) |
| US3-11 with each of the three hide plants | fails, as required (above) |

**Visual, axe and storybook-build were not rerun.** The implementer's reason holds. Since round 1, every added or
removed line under `packages/elements/src` is a comment: the three Stryker records, checked by filtering the diff for
non-comment lines, which found none. No story, layout rule or baseline changed. The rendered output these three gates
read is therefore the same as in round 1, where they passed:
- visual: 90 captures match;
- axe: 0 serious or critical;
- storybook-build: 45 stories.

**I reran gate:plants anyway.** The plants link the repository's packages and tests, and a test file changed.

## Earlier findings

| Round 1 | Status | Evidence |
|---|---|---|
| R1-01 (blocking) | resolved | The pixel read is restored, as above. Each of the three hide plants fails US3-11 in my own run, and the body passes in both harnesses. |
| R1-02 (note) | resolved | 816c428: R-06 now names the three states built (`joined`, `row-start`, `row-end`) and gives the reason there are no `first-row` or `last-row` states. |
| R1-03 (note) | resolved | 816c428: R-01 records that the orientation is implicit, and R-06 records that the regroup after a batch happens at the next delivery. |
| R1-04 (note) | resolved | The reasons at `ocelle-segment.ts:59` and `ocelle-segmented-choice.ts:206` and `:297` now name only the equivalent mutants, and name the killed ones as killed. |
| R1-05 (note) | resolved | `plants.md` softens the record and adds the plant "the element removing a blank host `aria-label` in `updated()`", which bit in my round-1 run. The FR-006 comment names it. |
