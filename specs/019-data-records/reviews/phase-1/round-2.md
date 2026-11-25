---
phase: 1
round: 2
verdict: approved
base: 8d104af23ce177ec4acbbfaba59bf433f9520d6d
head: f4da1d4bed6ee54a5df703511f979c70b3223efc
tdd_check: pass
---

# Phase 1 review, round 2

Reviewed `git diff 8d104af..f4da1d4`, with the fix round being `74a4877..f4da1d4`, and no uncommitted change. I was
asked to review 4d50a09. f4da1d4 landed during the review and adds only
`reviews/operator-ci-first-decision.md` (the operator's CI-first gating and path redaction decision), so no source,
test or story changed. Operator decisions in force: those listed in round 1, plus `operator-round-1-decisions.md` and
`../operator-ci-first-decision.md`.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | commit 0707d27 (message) | 0707d27's message still describes the `.region-track` remeasure observer, and a09b878 removed that observer. The next commit's message (a09b878) and `round-1-fixes.md` § R1-01 record the removal and the reason, so the history can be read correctly, and `ocelle-data-table.ts` at HEAD is byte-equal to 74a4877's. | None. History is not rewritten for this. |
| R2-02 | note | packages/elements/test/node/readme.test.ts:443-444 | The old fragment at line 443 is a prefix of the new one at line 444, so it can no longer fail on its own. This is harmless, because line 444 pins the whole sentence. | Optional: drop line 443. |

No blocking finding.

## R1-01's fix, judged on the evidence

**The fix.** It adds one declaration, `min-inline-size: min-content`, to block 1's caption
(packages/styles/src/base.css:272), and `packages/styles/test/source.test.ts:214`'s exact list gains it.
`packages/elements/src` is unchanged from 74a4877 (`git diff 74a4877..HEAD -- packages/elements/src` is empty).

**Grown caption reaching the fresh-load state in the three hosts.**
- The shared body "R-02 a caption that grows at run time (review R1-01)" (packages/elements/test/scenarios/data-table.ts:834-911) was added in red commit ad17b16. It is unchanged since then: `git diff ad17b16..HEAD` touches only the three cap bodies, the US1-26 body and the JSDoc move.
- `red-fix-1.log` and `check-red-fix-1.log` show it failing on an `AssertionError` in both harnesses, the right reason. It is a `loop` body, so the in-process harness also checks for "ResizeObserver loop" errors.
- It covers both kinds of growth: a text edit (`characterData`) and letter-spacing raised after mount. It covers all three hosts: an open `<dialog>`, an inline-block and a start-aligned column flex.
- For each host it compares the grown state with a fresh mount on the host's width (within 1 px), region overflow, caption text inside the caption and the box, `tabindex` and `data-fade`. A precondition asserts that the fresh host is more than 10 px wider than before.
- It passes at HEAD: `gate:unit-tests` passes in full.
- **Causality.** In a scratch worktree at HEAD I deleted only that declaration. The body then failed again in process.
- **Hosts and growth kinds outside the body.** I ran my own probe in the scratch worktree, comparing grown against fresh on host width, overflow, `tabindex`, `data-fade`, the caption and table widths, and caption-text clipping. All nine cases were identical, with no loop error:
  - a bounded 320 px block host, caption edited to a word wider than the box: overflow 54, `tabindex="0"`, `data-fade="end"`, in both states, as the README describes;
  - the same host with the caption edited shorter;
  - an inline-block and a dialog with the caption edited shorter, so the table narrows back to the fresh 66 px;
  - an inline-block with `sticky-header` and a 100 px bound, caption grown;
  - an inline-block whose multi-word caption grew without its longest word growing: 76 px, both states;
  - an inline-block with a body cell edited longer;
  - the caption's `font-size` raised to 40 px, in an inline-block and in the bounded 320 px host.

  Nothing from the probe was committed.

**The three new bodies for the `.box-size` observer paths** (data-table.ts:913-977): the host narrowed with its
track unchanged, the host moved between wrappers, and the 0 px box keeping the last cap.
- They arrived in a09b878 after the remeasure observer was removed, so none was red on its own. They pin existing behaviour that the fix did not change, not behaviour the fix added, so no red commit is owed.
- Each asserts observable output: `--data-table-box-size` against the measured `.box-size`, caption line boxes inside the unmasked extent, and fade and track widths. None asserts conditionally.
- They pass in both harnesses (full `gate:unit-tests`).
- My `gate:mutation` run has no survivor. On 0707d27's source the fix record found 24 survivors in `ocelle-data-table.ts`. That fits the claim that these bodies, with the source back to 74a4877's, cover the observer.

**README and R-05 corrections.**
- Elements README:939 ("A caption that grows after load … widens the table as it would on a fresh load") and :949 ("… and nor does a change to its table or caption after load") are borne out by the R-02 body and my nine probe cases.
- Styles README:226 ("never narrower than its longest word, whatever the cap") is the declaration itself.
- Each has a test statement (packages/elements/test/node/readme.test.ts:444-445, packages/styles/test/readme.test.ts:101).
- research.md R-05 "Correction" describes the defect as round 1 measured it, admits that the one-long-word body had been written around it, and states the fix. It also states that the element gains no observer, which is true at HEAD. Its claim that a caption adds only its min-content to the table's width matches my multi-word probe: 76 px, grown and fresh.
- R-06's caption row and both contracts (`ocelle-data-table.md` § Caption, `styles-data-table.md` caption row) match base.css.

**Effect on existing stories.** The selector is block 1's `ocelle-data-table > table > caption`, inside `:where()`, so
only data tables are affected. The declaration only matters where the cap is narrower than the caption's longest
word.
- `gate:visual` (docker): 328 captures match their baselines.
- `git diff 8d85000..HEAD` (the round's fix and record commits, so this round) adds or changes no baseline.
- `gate:storybook-build`: 164 stories, the same count as round 1.

No story changed its rendering.

**Anything newly broken.**
- Every check passes (below). The full unit suite has 7419 tests, which is round 1's 7408 plus the four bodies in both harnesses, plus the styles and README statements.
- The round removed no test and loosened none. The only change to a test that already existed is R1-03's added `endPast` assertion, which makes that test stricter.
- The plant selection is unchanged.

## Test quality

- **Red evidence.**
  - `tdd-check.json`: `pass`. Red commits: `phase` 6d6dacb (exit 1) and `fix-1` ad17b16 (exit 1). The final tests exit 2 on the base and 1 on the scaffold, and exit 0 on head 8d85000.
  - 8d85000..f4da1d4 changes only review evidence and the operator decision doc, so no test or source changed.
  - In `check-red-fix-1.log` exactly the two R-02 bodies fail, on `AssertionError`. `red-fix-1.log` also has a plant-repo timeout, which the fix record names and which passes in the full run.
- **After the red commits.**
  - `git diff ad17b16..HEAD` on test files adds the three cap bodies, the `endPast` assertion (R1-03), the JSDoc move, the source and README statements, and the harness comment.
  - Nothing is deleted, skipped or loosened. `gate:test-lint`: 323 files, no finding.
- **R1-03.** `endPast` (data-table.ts:1574) asserts that the ring's block end lies past the client block end. Together with `top`, that is the outcome of the contract's fallback. tasks.md T080 now states the fallback at rest and keeps "inside the box" past the caption, where the body asserts it.
- **Mutation** (my run of `pnpm run gate:mutation -- --base 8d104af…`, exit 0): `533 mutants on the changed lines of 5 files, none survived; 8 timeouts, 131 compile errors, 2 zero-mutant entries; 32 equivalent records`. This is the same as round 1 except for timeouts (4 in round 1, 8 now), which are caused by machine load. base.css is not a mutation target. The 32 equivalent records are unchanged since round 1, where I read and accepted them.

## Checks run

On HEAD, one heavy job at a time, with Storybook gates under `OCELLE_VISUAL_ENGINE=docker`. The source is the same as
at 4d50a09.

| Check | Result |
|---|---|
| `gate:typecheck` | `typecheck: no type error in the files of tsconfig.json` |
| `gate:lint` | `lint: 439 files checked, no finding` |
| `gate:style-lint` | `style-lint: 38 files checked, no finding` |
| `gate:test-lint` | `test-lint: 323 files checked, no finding` |
| `gate:csp` | `csp: 36 files checked, no finding` |
| `gate:prefix` | `prefix: 474 files checked, no finding` |
| `gate:manifest` | `manifest: 19 elements checked, no finding` |
| `gate:config-copies` | identical, exit 0 |
| `gate:pins` | `pins: 5 manifests checked, no finding` |
| `gate:signoff -- --range 8d104af..HEAD` | `signoff: 63 commits checked, no finding` |
| `gate:contrast` | `contrast: 169 pairs checked in light, 177 in dark (158 required per theme)` |
| `gate:brand-rules` | `brand-rules: 7 rules checked` |
| `gate:unit-tests` | `unit-tests: 7419 tests passed in 231 files`, exit 0 |
| `gate:storybook-build` | `storybook-build: built 164 stories`, exit 0 |
| `gate:visual` | `visual: 328 captures match their baselines (docker only: no cross-engine comparison)`, exit 0 |
| `gate:axe` | `axe: 328 story-theme runs, 0 serious or critical; 84 notes (0 incomplete, 84 excepted)`, exit 0 |
| `gate:mutation -- --base 8d104af…` | exit 0, as above |
| `gate:plants -- --affected 8d104af… --list` | `note: affected: every plant, by gates/lib/mutation/report.ts (shared gate source)`, `315 of 315 plants selected`. Matches `plants.md`: same base as `base.sha`, same trigger and selection, every shard and the `--verdict` exit 0, run on a09b878's source, which equals HEAD's |

Tasks: every task of `## Phase 1:` is still ticked. The fix round changed no file outside the phase's stated scope
(the styles and elements packages, their READMEs and tests, and 019's research, contracts, tasks and reviews).

## Earlier findings

| Round 1 | Status | Evidence |
|---|---|---|
| R1-01 (blocking) | **resolved** | Red body ad17b16, failing in both harnesses for the right reason; the one-declaration fix; the body passes, and fails again with the declaration removed; the three hosts and nine further probe cases reach the fresh-load state; README:939, :949, styles README:226 and R-05 are corrected and true; no story's rendering changed. See above. |
| R1-02 (note) | deferred, as the operator decided | no change, as allowed |
| R1-03 (note) | resolved | tasks.md T080 wording; `endPast` in the US1-26 body |
| R1-04 (note) | resolved (recorded) | `round-1-fixes.md` § R1-04; `round-1-r104-before-fix.log` shows the gate case failing (exit 1) and the T086 body failing in both harnesses against the code before each fix |
| R1-05 (note) | moved to the orchestrator's after-run notes, as the operator decided | not a finding against this phase |
| R1-06 (note) | resolved | `plants.md` opens with the `--list` run naming `gates/lib/mutation/report.ts (shared gate source)`; my `--list` matches |
| R1-07 (note) | resolved | the JSDoc sits above `dataTableScenarios` (data-table.ts:1899-1900) |
