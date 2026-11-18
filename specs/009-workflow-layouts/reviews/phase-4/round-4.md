---
phase: 4
round: 4
verdict: changes_requested
base: 2caad68db62feed502eb3963b65548f47d73ea6c
head: 58fb1ff
tdd_check: pass
---

# Phase 4 review, round 4

US3: `ocelle-list-detail`, after the round-3 fixes. This is the first round of the second batch (operator decision G1,
"more-rounds"). The change under review is `git diff 2caad68..58fb1ff`. There is no uncommitted change. Since round 3
there are four commits:

- `6e0657f`: the operator's decision G1;
- `e64b987`: the red commit, tests only;
- `746b4d1`: the fix;
- `58fb1ff`: the tdd-check, evidence files only.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R4-01 | blocking | commit `58fb1ff` ("chore(009-workflow-layouts): phase 4 tdd-check after review round 3 (pass)") | `gate:signoff -- --range 2caad68..HEAD` fails with exit 1: "58fb1ff…: signoff: no-signoff: no Signed-off-by line for the author Claude <noreply@anthropic.com>; sign off with git commit -s (FR-023)". The commit has the Co-Authored-By and Claude-Session trailers but no `Signed-off-by`. The other 23 commits of the range pass (`--range 2caad68..746b4d1`: no finding). The earlier tdd-check commit `e4bbe18` is signed off, so this one breaks the pattern. The fix note says signoff was run on the fix commit only. That claim is true, but the head under review fails the gate. The commit is already on `origin/claude/015-workflow-layouts`. A failing check is blocking. | Give the tdd-check commit a `Signed-off-by` line, with the same tree and evidence (re-sign `58fb1ff`, or replace it with a signed-off commit of the same content). Then `gate:signoff -- --range 2caad68..HEAD` must exit 0. The branch is already pushed, so any history rewrite is the orchestrator's or operator's call under the fold rules. A fold that carries the group's `Signed-off-by` (`fold-history.sh` takes the union of trailers) would also fix it, but only if the gate passes on the folded head. |
| R4-02 | note | `packages/elements/src/ocelle-list-detail.ts:243-248`, `:250-255`, `:257-263`; `packages/elements/README.md:313-315`; `contracts/elements.md:93` | R3-02's fix makes `remeasure()` do nothing on a detached element and documents the host's duty: "after changing a removed element, call `remeasure()` once it is inserted again". This is correct and tested, and it removes a real defect: a pass on a detached grid wrote 0 px figures to the sheet. Reconnection itself still schedules no pass. `connectedCallback` re-observes the probe, the edge box and the slotted elements, but a light-DOM change made while the element was detached, or a pass cancelled by `disconnectedCallback` during a same-task move, is not measured until the next trigger. This dates from `45a828e` and is not a regression of this round. The documents now state it. | Optional follow-up: schedule a pass from `connectedCallback` when `hasUpdated` is true. The host would then not need to call `remeasure()` after a re-insert. Make the change red first. |
| R4-03 | note | `specs/009-workflow-layouts/contracts/overflow-region.md:121` | Phase 2's R2-02 is still open, carried as instructed (was R3-05). | None this phase. |

## Test quality

**Red evidence.** `e64b987` changes only test files: `list-detail-first-render.test.ts` (new) and
`list-detail-pass.test.ts`. `red-commits` has `fix-3 e64b987`. In `red-fix-3.log`, exactly 2 of 3763 tests fail, both
with an `AssertionError`. That log cuts the R3-02 diff to `…(3)`, so I reproduced the red failure. In the copy, I
removed the guard at `ocelle-list-detail.ts:246`. The test then fails with:

- `errors: ["Uncaught TypeError: Cannot read properties of undefined (reading 'querySelector')"]`;
- the same error twice in `messages`;
- `passes.removed: 1`.

These are the two defects R3-02 names, and the fix note says the same. The red test of R3-03 fails on Lit's
change-in-update `console.warn` in `messages`, as the note says. tdd-check.json shows `status: pass`, four red
commits each with exit 1, `head_exit` 0 and no problems. It records head `746b4d1`, and `58fb1ff` adds only evidence
files.

**Tests changed after red.** `git diff e64b987..HEAD -- packages/elements/test storybook gates/test` touches only
`readme.test.ts`. Its three changed fragments assert the new README sentences exactly: the `remeasure()` item and the
two "may go unseen" limitation items. The two red tests are byte-identical to `e64b987`. No test was skipped, weakened
or deleted.

**Assertions.** Both new tests make one unconditional `toEqual` on observed values. The R3-02 test checks shadow-root
absence, connection state, pass counts for each case, window errors and console messages. The R3-03 test checks the
tier and the messages. The error listener calls `preventDefault()` only to keep the harness quiet, and it records each
error, so nothing is swallowed. `gate:test-lint` reports no finding.

**Plants, run by me** in a byte-identical copy at HEAD. I ran `list-detail-pass`, `list-detail-first-render`,
`list-detail` and `list-detail-upgrade` (64 tests), then restored the source and compared it byte for byte:

| Plant | Fails |
|---|---|
| R3-02 guard removed (`:246`) | the R3-02 test (1 of 64) |
| guard narrowed to `this.shadowRoot === null` (never-connected only) | the R3-02 test, on the removed case (1 of 64) |
| R3-03 early return removed (`:376`) | the R3-03 test (1 of 64) |

Both halves of the R3-02 test therefore do real work. As round 3 asked, `-t "US3-12, 1196 px row"` and `-t "R2-01"` on
`list-detail.test.ts` now pass when run alone (1 and 2 passed).

**Mutation.** I ran `pnpm run gate:mutation -- --base 2caad68` in the copy. It found 292 mutants on the changed lines of
4 files, and none survived. It also reported 2 timeouts (`connectedCallback`, as before), 96 compile errors (53 in
`ocelle-list-detail.ts`, 34 in `tiers.ts` and 9 in `list-detail-measure.ts`; type narrowing and unreachable code),
1 zero-mutant entry (`src/index.ts`) and 8 equivalent records. Exit 0. The record at `:224`, `#hasInspector`'s initial
value, still holds with the new early return. When the host has no inspector, `connectedCallback`'s
`#observeSlots` returns early with the value `false` already in force, and the first update is requested by Lit's
connection anyway. With an inspector, the value changes and the update is requested. Either way the first
`willUpdate` reads the right value. No mutant of the new lines `:246` and `:375-378` survived.

## Checks run

I ran these on HEAD `58fb1ff`, in a byte-identical copy in the session scratchpad. The plant shards ran in the
repository itself. `git status` of the repository was clean before and after.

- `gate:typecheck`: no type error.
- `gate:lint`: 307 files, no finding.
- `gate:style-lint`: 20 files, no finding.
- `gate:test-lint`: 209 files, no finding.
- `gate:prefix`: 265 files, no finding.
- `gate:csp`: 18 files, no finding.
- `gate:manifest`: 6 elements, no finding.
- `gate:brand-rules`: 7 rules.
- `gate:contrast`: 160 pairs in light, 168 in dark.
- `gate:pins`: 5 manifests, no finding.
- `gate:config-copies`: identical.
- `gate:signoff -- --range 2caad68..HEAD`: **exit 1, 1 finding in 24 commits** (R4-01). The range `2caad68..746b4d1`
  has 23 commits and no finding.
- `pnpm test`: 3763 tests passed in 162 files.
- `gate:mutation -- --base 2caad68`: exit 0, as above.
- `gate:storybook-build`: 44 stories.
- `OCELLE_VISUAL_ENGINE=docker gate:visual`: 88 captures match their baselines.
- `OCELLE_VISUAL_ENGINE=docker gate:axe`: 88 story-theme runs, 0 serious or critical, 10 excepted notes (003's prose
  story).
- `OCELLE_VISUAL_ENGINE=docker gate:plants --shard 1`, `--shard 2` and `--shard 3`: 78, 78 and 77 plants judged,
  "every plant as expected", each exit 0. These three shards hold all 233 plants of the gates other than `visual` and
  `axe`, and the registry's, including all 12 `manifest` plants. I did not rerun shards 4 to 28, the 73 `visual` and
  `axe` plants, because R3-01 does not touch them. `gate:visual` and `gate:axe` pass on this head. The fix note
  reports the full job at exit 0 with 306 plants. Together these cover the job.
- **R3-01 by structure.** A script in the scratchpad parsed each of the nine manifest plant copies and compared it with
  the committed `packages/elements/custom-elements.json`, ignoring key order:
  - `pass-reordered` is equal to the manifest, with its text in a different (reversed) key order;
  - each of the six `fail-undescribed-*` copies is equal plus one extra module, `src/ocelle-plant.ts`;
  - `fail-lost-attribute` is equal except for the missing `label` attribute of `OcelleIcon`;
  - `break-not-json` is not JSON, as planted.

  `git show --stat 746b4d1` shows each of the eight JSON copies changed by one line, the `remeasure` description.

## Earlier findings

- **R3-01 (blocking): resolved.** All eight JSON manifest copies now hold the committed `remeasure()` description
  ("re-chooses the tier" and "not in a document" appear once in each). Each keeps exactly its planted difference, as
  the structural comparison above shows. The fix also brought `fail-lost-attribute` in line, which round 3 had not
  flagged, because its member finding hid the whole-file `stale` finding. The `manifest` plants all judge as expected
  in my shard runs. No red test was needed, as round 3 said.
- **R3-02 (note): fixed, red first.** `remeasure()` returns when `!this.isConnected` (`ocelle-list-detail.ts:246`).
  The red test at `list-detail-pass.test.ts:196` covers both the never-connected case and the removed case, and my
  plants show it fails without each half of the fix. The documents state the new behaviour: the JSDoc and the
  regenerated manifest, contract row `:93`, FR-025 (`spec.md:774-775`), and README `:313-315` (asserted). The follow-up
  on reconnection is R4-02.
- **R3-03 (note): fixed, red first.** `#observeSlots` calls `requestUpdate()` only when `#hasInspector` changes
  (`:375-378`). It still re-observes the slotted elements before the early return, so the light-DOM observation is
  unchanged. The new file `list-detail-first-render.test.ts` is the guard, and the R3-03 plant makes it fail. The
  scenarios round 3 named now pass alone. I found no regression. The inspector-added and inspector-removed scenarios
  still pass, because the value then changes and the update is requested. The other slot changes need no update:
  their pass's `after` step calls `#resized`, which requests an update when the size changes.
- **R3-04 (note): fixed.** "No observer reports it" is now "may go unseen", with its condition: the containing block
  of the edge box, and the example of a positioned container. The text is the same in FR-025, the contract's
  convention and its `remeasure()` row, the README (asserted), data-model.md `measured`, research.md R-13 and the
  `#remeasured` JSDoc. The contract row now qualifies the narrow-host case. The wording is accurate, and it matches
  what round 3 measured.
- **R3-05 (note):** carried as R4-03.
