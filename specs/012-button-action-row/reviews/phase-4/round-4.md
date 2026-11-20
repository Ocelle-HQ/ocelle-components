---
phase: 4
round: 4
verdict: approved
base: 55ec4105f5ad82f7efbbab81d478b36b75ef98b3
head: aeda25308de1abc359893087461e08cdc567dc40
tdd_check: pass
---

# Phase 4 review, round 4

This is a check-only round under the landing stop rule. I checked two things: that round 3's blocking finding R3-01 is
resolved, and that nothing since round 3 (8dc8147) has regressed phase 4. I did not search afresh.

Six commits came after 8dc8147:
- f6fbec2: the round 3 review.
- 570adc0: the operator decision on R3-01.
- b594b7e: main's mission 009, which is already on `origin/main`.
- feac2fa: the merge of b594b7e, with operator decision D1 on 009's driver names.
- ac2d73a: the re-summed pins.
- aeda253: the CI run link added to plants.md.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R4-01 | note | specs/012-button-action-row/reviews/phase-4/plants.md:62, :67, :68-69 | The quoted operator answer (:62) says "all 312 plants", and so does the record's own bullet: "`--affected 55ec410` selects all 312 plants" (:67). Both give the pre-merge total. The next bullet (:68-69) gives the post-merge plan: 244 non-visual plants in 4 shards and 77 shards in all, which is 244 + 48 + 25 = 317. My `--affected 55ec410 --list` at HEAD prints "317 of 317 plants selected", and `--plan` prints shards 1 to 77. CI ran all 77 Plants shards, so the evidence covers the whole selection. Only the stated total is out of date. | None. A later edit could change :67 to "312 before the merge of 009, 317 after". |
| R4-02 | note | gates/test/integration/setup-offline.test.ts:47 | In this sandbox the full suite at HEAD fails 1 of 7753 tests: "exits 2 naming the missing package …". pnpm reports `ERR_PNPM_NO_OFFLINE_TARBALL` with an empty first message line, so `missingPackage` (gates/bin/setup-offline.ts:45-49) finds no package name. It also fails alone and with the npm proxy variables unset. It is not phase 4 code and was not changed by the merge. `git diff 8dc8147 HEAD` is empty for this test, `setup-offline.ts`, `package.json` and `pnpm-lock.yaml`. CI's "Unit tests" job passed on ac2d73a, which differs from HEAD only in plants.md. So this is a difference in the local environment, not a regression. | None for this phase. If it recurs in CI, it belongs to mission 001's offline setup. |

No blocking finding.

## Test quality

The only test files changed since round 3 that touch phase 4 are:
- `gates/test/plant-runner.test.ts` (ac2d73a). The shard pin goes from 239 others / 3 shards to 244 / 4, which counts 009's five style-lint plants. It is still an exact `toEqual`, and each shard is still checked against the ≤ 80 rule.
- `packages/tokens/test/source-table.test.ts`. 009's block arrives with its pin re-summed to 134 = 127 + 012's seven. That is again an exact `toEqual`.
- `gates/test/gates-readme.test.ts`. 009 adds a style-lint row case, and the phase 4 brand-rules row case is unchanged.

None of these loosens an assertion. `git diff 8dc8147..HEAD` is empty for the phase 4 test files themselves:
- button.test.ts, control.test.ts and scenarios/busy.ts;
- brand-rules.test.ts;
- generate.test.ts and validate.test.ts.

It is also empty for the phase 4 source:
- button, control, spinner and icon-slot;
- tokens `generate.ts`;
- `gates/bin/brand-rules.ts`.

The merge adds five non-motion tokens to `packages/tokens/src/source.ts` (four `shell`, one `space`). Rule (f) and the reduced-motion block do not see them (`gate:brand-rules` 7 rules, 0 findings). The D1 rename in `packages/elements/test/scenarios/driver.ts` is additive: 009's names become `ElementTarget` and `computedOf`, and 012's `Target` and `computed` are unchanged.

I did not run mutation again. No mutated source of this phase changed since round 3's run (`--base 2041399`, 121 mutants, none survived).

## Checks run

At aeda253, with the tree clean apart from an unrelated untracked `reviews/landing/round-2.md`:

| Check | Result |
|---|---|
| `tdd-check.sh 4` (rerun; record older than HEAD) | The run was stopped at the 1-hour background limit during the HEAD sub-check, so `tdd-check.json` was not rewritten and stays the 8dc8147 record (`pass`). The sub-checks it completed match round 3 exactly: the red phase exits 1 (121 of 3579), fix-2 exits 1 (18 of 7061, all `AssertionError`), and the final tests on base exit 2 ("no test file found", as R3-02). The Docker daemon was down on the first attempt. That gave 5 extra visual-integration failures in the fix-2 run, so I started the daemon and used the second attempt. I restored the partially rewritten `check-*.log` files to their committed state. |
| HEAD suite (`node gates/bin/test.ts` in a clean worktree at aeda253, Docker up) | 7752 of 7753 passed; the one failure is R4-02, outside phase 4. Every phase 4 suite passed. |
| `gate:typecheck` | no type error |
| `gate:lint` | 446 files, no finding |
| `gate:test-lint` | 327 files, no finding |
| `gate:style-lint` | 41 files, no finding |
| `gate:brand-rules` | 7 rules checked, 0 findings |
| `gate:contrast` | 207 pairs in light, 215 in dark (196 required), unchanged |
| `gate:manifest` | 20 elements, no finding |
| `gate:prefix`, `gate:pins`, `gate:csp`, `gate:config-copies` | no finding |
| `gate:signoff -- --range b594b7e..HEAD` | 97 commits, no finding. Over `8dc8147..HEAD` it reports one finding, on b594b7e, which is main's own squash commit (already on `origin/main`), not a commit of this branch. |
| `gate:plants -- --affected 55ec410 --list` | "note: affected: every plant, by gates/bin/plants.ts (shared gate source)"; 317 of 317 selected |
| `gate:plants -- --plan` | shards 1 to 77 |
| CI run 44298568583 (`gh run view`) | head `ac2d73a745c9`, attempt 1, completed, success. 148 of 148 jobs succeeded: "Plants plan", 77 "Plants shard (k)" jobs, the "Plants" verdict, "Unit tests", "Visual regression", "Accessibility", "Brand rules" and the rest. |

I did not judge the plants again; the procedure asks only for the record check.

## Earlier findings

- **R3-01: resolved by operator decision.** plants.md § "Operator decision on the fix-2 plants record" (570adc0) records the operator's answer verbatim, "Shards + CI stand (Recommended)", with its three grounds:
  - the shard 1 to 3 run covers all 239 then-non-visual plants, the two new plants included;
  - the real source's stylesheet is byte-identical across bd9aaca;
  - `--affected 55ec410` selects every plant and was not run locally.

  The full evidence it names is the CI Plants run on the pushed head. aeda253 adds the link. I verified that run:
  - it ran on ac2d73a;
  - it was attempt 1;
  - every one of the 77 Plants shards passed, and so did the Plants verdict.

  The selection matches mine: 77 shards = 244 + 48 + 25 = the 317 plants that `--affected 55ec410 --list` selects at HEAD (R4-01 notes the stale 312 in the record). ac2d73a and HEAD differ only in plants.md, so the run is evidence for HEAD.

  This is the alternative that round 3 offered in R3-01. The operator's decision replaces the `- base:` / `- command:` / `- exit:` form for this landing-folded round, and I do not reopen it.
- **R3-02, R3-03, R3-04 (notes):** unchanged. The base sub-check still exits 2.
