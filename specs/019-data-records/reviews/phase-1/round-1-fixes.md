# Phase 1, review round 1: fixes

Review: `round-1.md` (changes_requested, 20e6d1c). Operator decisions: `operator-round-1-decisions.md` (74a4877).
Red commit: ad17b16 (`red-commits`: `fix-1`), recorded by `red.sh 1 fix-1`, log `red-fix-1.log`.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed | ad17b16: "R-02 a caption that grows at run time (review R1-01): …" in `packages/elements/test/scenarios/data-table.ts`, run by both harnesses (`loop`), red in both on its assertion | `packages/styles/src/base.css` (block 1's caption: `min-inline-size: min-content`); three cap bodies added to `packages/elements/test/scenarios/data-table.ts`; README lines of both packages with test statements; research.md R-05 "Correction", R-06 caption row, R-07; contracts/ocelle-data-table.md § Caption, contracts/styles-data-table.md caption row |
| R1-02 | deferred: a note with an optional change only; the equivalence holds for every shipped host, as the review finds, and the operator asked for no change | none (note) | none |
| R1-03 | fixed | none: a weak test, strengthened in the fix commit (see below) | tasks.md T080; the US1-26 captioned body's name, comment and `restLink.endPast` |
| R1-04 | fixed (recorded) | none: both cases run against the code from before their fixes and fail, `round-1-r104-before-fix.log` | this record |
| R1-05 | deferred: the operator accepted the rule as built and moves both gaps to the run's after-run notes as a gate follow-up, which the orchestrator writes | none (note) | none |
| R1-06 | fixed | none (record) | `plants.md`, replaced by this round's run (as the fix command asks). It opens with the `--list` run, which names the trigger `gates/lib/mutation/report.ts (shared gate source)`. The phase's earlier sections (T088, T089, T025) are in git history at 74a4877 |
| R1-07 | fixed | none (comment) | `packages/elements/test/scenarios/data-table.ts`: the JSDoc is above `dataTableScenarios` again |

## R1-01

The red body grows a caption at run time in an open `<dialog>`, an inline-block and a start-aligned column flex, two
ways: the caption's text node edited from "Deploy approvals" to "Deploymentsapprovalspending" (`characterData`), and
the caption's letter-spacing raised to 3 px after mount on "Deployments approvals" (`driver.style`, the mechanism of a
late web font). After each it replaces every host with a fresh one holding the final caption (for the spacing, a page
rule present before the host is inserted) and compares: the host as wide within 1 px, no region overflow
(`scrollWidth − clientWidth ≤ 1`), the caption's text inside the caption and the box, the same `tabindex` and
`data-fade`; and, as its precondition, each fresh host more than 10 px wider than before the growth. On ad17b16 both
harnesses fail on all six grown hosts: the edit gives an overflow, clipped text, `tabindex="0"` and `data-fade="end"`;
the letter-spacing gives an overflow and clipped text with no tab stop; none is as wide as the fresh host.

`red-fix-1.log` (exit 1): the two expected failures, `packages/elements/test/data-table.test.ts` and
`packages/elements/test/browser/data-table.test.ts`, each an `AssertionError` on this body. A third failure there,
`gates/test/integration/plant-repo.test.ts:263` ("Test timed out in 5000ms"), is a load timeout in a test this round
does not touch; it passes in this round's full run below.

The fix is one declaration: `min-inline-size: min-content` on block 1's caption. The caption is then never narrower
than its longest word under any cap. A word that grows (an edit, a style, a font) widens the table, and in a
shrink-to-fit host the box with it. The element's existing `.box-size` observer then writes the wider cap, as on a
fresh load, and nothing overflows the caption. A table caption adds only its min-content to the table's width, so a
caption whose words stay narrower than the cap wraps the same way grown or fresh. I measured "Deployment approvals
pending" edited to "Deployment approvals pending for review": 90.6 px grown and fresh, in all three hosts.
`ocelle-data-table.ts` is unchanged.

The first form of this fix, 0707d27, also added a second `ResizeObserver` on `.region-track`, which remeasured at the
fallback cap a frame after every track change. Mutation (`gate:mutation -- --base 8d104af`, exit 1) showed that no
test needed it: all its mutants survived. Its presence also let the `.box-size` observer's own mutants survive. It is
removed, and the source is back to 74a4877's. Three shared bodies (both harnesses) now pin the cap paths that only the
`.box-size` observer serves. They pass on the source, and each was a survivor's killer in that run:

- "R-07 a table overflowing at 600 and 400 px … its host narrowed from 600 to 400 px (the track's size unchanged)":
  the cap follows the box and every caption line stays inside the unmasked extent;
- "R-07 an overflowing data table moved from a 400 px wrapper into a 320 px one (detached and attached again)": the
  observer is attached again on connect;
- "R-07 a box with no inline size keeps the last cap": hidden, then shown in a 0 px wrapper, the cap stays the 320 px
  measure, and the measure comes back at 320 px.

`packages/styles/test/source.test.ts`'s exact declaration list of block 1's caption gains the declaration (the list
follows the source). The README sentences the review names are now true and say more. Elements README: "A caption
that grows after load (its text edited, a style changed or a web font loaded late) widens the table as it would on a
fresh load." and "No change the data table makes to its region leaves it in a state a fresh load would not give, and nor
does a change to its table or caption after load." Styles README: "The caption is never narrower than its longest
word, whatever the cap, so that word widens the table." Each has a test statement (T013).

## R1-03

The body asserted `top` and `blockFade: null` at rest. `blockFade` is the room rule's there (`atRest.blockFade: null`
in the same body), so it is no evidence of the fallback. Measured at rest in process: ring 27 px against 19.4 px; after
Tab `scrollTop` 5, the ring's start 1 px below the header's current edge, its end 3.6 px past the client block end.
The body now also asserts `endPast` (the ring's block-end edge past the client block end). Together with `top`, that is
the fallback's outcome: the start kept at or below the header with the end past the box. The plain clearance would put
the end inside and the start under the header. The comment says that the suppression is proven by T079's bodies.
tasks.md T080 now states the fallback for the at-rest case and keeps "inside the box" for the link past the caption,
where the body asserts it. This strengthens a test and loosens none; it passes on the fix.

## R1-04

Two bodies came after their fixes and were never red on their own:

- a94eb04's case "cannot run when the shared diagnostic is below every mutant's lines, as above them"
  (`gates/test/mutation-report.test.ts`), which arrived in T089's own fix commit;
- 4ee0215's T086 body "US1-15 (re-attach, Q-M2): an overflowing table replaced while detached by another overflowing
  one is assigned in the task of the re-attach …", which arrived after T086's fix 17febd4.

Both were run in a worktree at ad17b16 (every test of the phase), with `gates/lib/mutation/report.ts` from 850102d
(before a94eb04) and `packages/elements/src/ocelle-data-table.ts` from 016b05a (before 17febd4). Results are in
`round-1-r104-before-fix.log`. The gate case fails with `expected { ok: true, … } to deeply equal { ok: false, … }`
(exit 1). The T086 body fails in both harnesses with `inTask` `""` for `"d-n"` (exit 1 each). Each would have been red
before its fix.

## Checks after the fix (a09b878's source)

| Check | Result |
|---|---|
| `gate:unit-tests` | `unit-tests: 7419 tests passed in 231 files`, exit 0 |
| `gate:typecheck` | `typecheck: no type error in the files of tsconfig.json` |
| `gate:lint` | `lint: 439 files checked, no finding` |
| `gate:test-lint` | `test-lint: 323 files checked, no finding` |
| `gate:style-lint` | `style-lint: 38 files checked, no finding` |
| `gate:manifest` | `manifest: 19 elements checked, no finding` |
| `gate:storybook-build` | `storybook-build: built 164 stories`, exit 0 |
| `gate:visual` (`OCELLE_VISUAL_ENGINE=docker`) | `visual: 328 captures match their baselines (docker only: no cross-engine comparison)`, exit 0; no baseline changed |
| `gate:axe` (`OCELLE_VISUAL_ENGINE=docker`) | `axe: 328 story-theme runs, 0 serious or critical; 84 notes (0 incomplete, 84 excepted)`, exit 0 |
| `gate:mutation -- --base 8d104af` | `mutation: 533 mutants on the changed lines of 5 files, none survived; 8 timeouts, 131 compile errors, 2 zero-mutant entries; 32 equivalent records`, exit 0 (on 0707d27's source the same run gave exit 1, 24 survivors, all in ocelle-data-table.ts; see R1-01) |
| `gate:plants` | `--list`: `315 of 315 plants selected`; shards 1 to 29 each exit 0; `--verdict`: `plants: 315 plants of 17 gates and the registry judged, every plant as expected`, exit 0 (`plants.md`) |
