---
phase: landing
round: 2
verdict: changes_requested
base: b594b7e98bb5480aad9cc8dcf0bd3f7f378f920f
head: aeda25308de1abc359893087461e08cdc567dc40
tdd_check: pass
---

# Landing review, round 2

This is a check-only round under the landing stop rule (`.claude/skills/ocelle-land/SKILL.md`, step 2, "Stop rule").
It checks four things:

- round 1's blocking findings R1-01 and R1-02 are resolved;
- the two notes the operator chose to fold, R1-03 and R1-04, are resolved;
- the folds regressed nothing;
- the merge of main since round 1 regressed nothing.

It does not search afresh.

The change under review is `git diff origin/main...HEAD`. The merge base is b594b7e (main, mission 009), HEAD is
aeda253, and the diff covers 371 files. Round 1 was written at 70f2936. Since then the following commits landed:

- **The operator rounds:** phase 4 round 2 and phase 6 round 2.
- **Phase 4's fold:** fix-2 (red 2041399, green bd9aaca), reviewed in phase 4 round 3.
- **Phase 6's fold:** fix-2 (7a3385e, db5edfd, 904e5cf, 226e29e, 8dc8147), reviewed in phase 6 round 3.
- **The operator decision on phase 4 R3-01:** 570adc0, with its run link in aeda253.
- **The merge of main:** b594b7e at feac2fa, with operator decision D1.
- **The pin re-sum:** ac2d73a.

HEAD differs from the CI head ac2d73a only in `reviews/phase-4/plants.md`. Phase 4 round 4 is being written at the
same time, and this round does not rely on it. The one uncommitted change in the tree belongs to that run:
`reviews/phase-4/check-red-phase.log`. I left it alone.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | blocking | gates/README.md:61-67; gates/lib/plant-runner.ts:266-269; specs/006-storybook-workbench/plan.md:634, :639 | **R1-02 has regressed: the merge of 009 made the sizing figures false again.** The R1-02 fold (7a3385e, 904e5cf, 226e29e) states the sizing in three places. It says "the repository holds **171 stories** after 012's landing, in 76 shards (3 + 48 + 25)". The plant-runner comment says "at the 171 stories after 012's landing". 006 says "now exceeded at 171 stories" and "171 stories, 76 shards". All three cite run 44098238937 on 497b05f as the cost of the landed state. Since feac2fa the landed state is different. The repository holds **194 stories**: feac2fa's body says "stories 143+51 = 194", `storybook-build: built 194 stories` is pinned at gates/test/integration/storybook-build.test.ts:55, and 194 `export const` stories exist under storybook/stories. The plants run in **77 shards** (4 + 48 + 25): `pnpm run gate:plants -- --plan` prints shards 1 to 77, and gates/test/plant-runner.test.ts:756-758 pins `others: 244` and `4 + 48 + 25`. ac2d73a re-summed those two test pins but not the prose they describe, and feac2fa did not touch the three places. A later CI run measures the landed state: 44298568583 on ac2d73a, with a longest Plants gate step of 524 s. None of the three places mentions it. This is the defect R1-02 named, "the gate contract states sizing figures the merge made false". These are the figures the operator reads for the pending plant-design triage. | Correct the three places to the state after merging 009: **194 stories** and **77 shards (4 + 48 + 25)**. Cite run 44298568583 (ac2d73a, attempt 1) for the measured gate-step peak (524 s, none at or over 570 s). Add its totals if the orchestrator has them; otherwise say they were not recorded. Run 44098238937 (171 stories, 76 shards) may stay as the earlier measurement, labelled as before 009's merge. Keep "split count of 76 exceeded" and "triage pending". The records under `reviews/phase-6/` (ci-run.md, T067's tick) stay as they are: they are what was decided at 171 stories. 524 s is still under 570 s, so T067's condition holds on the new run too. |
| R2-02 | note | gates/lib/plant-runner.ts:278-279 | The `otherShardSize` comment says 80 "deals the repository's 232 into 3 shards". This text comes from main (`git show origin/main:gates/lib/plant-runner.ts`, :273). It was already stale before 012. At HEAD the figure is 244 into 4 shards, pinned at plant-runner.test.ts:756-758. This is not a regression of a fold. | Optional, in R2-01's commit: "244 into 4 shards". |
| R2-03 | note | gates/test/integration/visual.test.ts:26 (`timeout = 600_000`) | Round 1's R1-06 recorded the repository visual integration test at 519 s of its 600 s limit with 171 stories. It now runs 194 stories, 388 captures (feac2fa). I did not time it locally. CI run 44298568583 passed it, as the caller reports. Its margin is now smaller than in R1-06. | None for this pull request. The follow-up issue the operator accepted already covers it (decision 15 triage together with R1-06). Its text should state 194 stories. |

One blocking finding and two notes.

## Earlier findings

| ID | Status | Evidence |
|----|--------|----------|
| R1-01 (blocking) | **resolved** | The operator settled it in phase 6 round 2 (O2-01), and phase 6 round 3 approved the fold. `reviews/phase-6/ci-run.md` exists. tasks.md:328 has T067 ticked (`[X]`), citing the operator's decision of 2026-11-17 on the gate-step figure (all 76 shards under 570 s on run 44098238937). Phase 6 round 3 checked the per-shard table for internal consistency. The new run 44298568583 on ac2d73a has a longest gate step of 524 s across all 77 shards, none over 570 s, so the merge has not broken the condition T067 rests on. I take this run's figures from the caller. I did not open the run, because GitHub is outside my role. |
| R1-02 (blocking) | **resolved at 8dc8147, regressed at feac2fa** | Phase 6 round 3 verified the fold: the 72-story figures were gone and 171 stories, 76 shards and the measured run were stated. The merge of 009 has made those figures false again. See R2-01. |
| R1-03 (note, folded) | **resolved** | gates/README.md:36, the `brand-rules` row, states the delay exception as the operator amended it: only a `-delay` name with `delay: true`, and every motion duration a literal `<number>ms`. It lists `f-motion-spin-missing`, `f-delay-marker-misplaced` and `f-motion-not-ms`. specs/002-design-tokens/contracts/gates.md:232 lists the same three. All three plant directories exist under gates/plants/brand-rules/. The merge changed the README only in the `style-lint` row (009's gradient clause), not the brand-rules row (`git diff 570adc0 feac2fa -- gates/README.md`). |
| R1-04 (note, folded) | **resolved** | Phase 4 round 2 (O2-01, O2-02) and fix-2 (red 2041399, green bd9aaca) folded it. Phase 4 round 3 judged the fix resolved. Its one blocking finding, R3-01, concerned the plants evidence. The operator answered it at 570adc0 ("Shards + CI stand"), and aeda253 adds the run link the decision asked for: 44298568583, every Plants shard and the verdict passing. The merge did not touch `gates/bin/brand-rules.ts` or `packages/tokens/src/generate.ts`. It added only 009's records to `packages/tokens/src/source.ts`, none of them in the `motion` group (feac2fa body; `gate:brand-rules` passes). `tooltip-delay` (source.ts:286) is still the only `delay: true` record. Whether phase 4's records are complete is for phase 4 round 4, not this round. |

### The merge and the pin re-sum

- **D1 is a pure rename on 009's side.** `git diff 570adc0 feac2fa` does not touch 012's files:
  `ocelle-button.ts`, `ocelle-action-row.ts`, `control.ts`, `scenarios/driver-additions.ts`, `scenarios/button.ts`,
  `scenarios/action-row.ts`, `brand-rules.ts` and `generate.ts` are all unchanged. 012's `computed(id, prop, inner?)`
  callers stay on 012's signature (for example scenarios/facts.ts:847). `gate:typecheck` is clean, so no caller of
  `Target`, `computed` or `focus` from 009 is left under the old name. A1, B1, C1, C2 and C3 are restated in the
  merge body. The code they rest on is unchanged by the merge.
- **ac2d73a makes the pins stricter, not looser.** It moves two exact pins to the merged values:
  - source, export and `:root` go from 127 to 134, which is 009's 127 plus 012's seven, named in the comment;
  - the plants go from 239 others in 3 shards to 244 in 4, which is 009's five new style-lint plants.

  Both stay `toEqual` on exact values. The commit body says the whole suite caught both, which is the pins doing
  their job. `vitest run --project tokens` passes, as does `--project gates` (both below).
- **The run on the merged head.** The caller reports CI run 44298568583 on ac2d73a, attempt 1: 148 of 148 jobs
  succeeded, with 77 Plants shards and the verdict.

## Test quality

- **No new behaviour since round 1 outside phase 4's fix-2.** Phase 4 round 3 judged the red evidence for fix-2:
  2041399 changes tests only, and its log shows 18 `AssertionError` failures and no setup error. `git diff
  2041399..bd9aaca` on those test files is empty. Phase 6's fold is documentation only. Phase 6 round 3 records
  that, and no `fix-2` entry is needed for phase 6.
- **The merge and ac2d73a weaken nothing.** The re-summed counts are exact pins and the expectations moved upward.
  Each conflict resolution listed in feac2fa's body is a union of both sides. The fail plant
  `visual/fail-token-changed` grows to 159 findings.
- **`tdd_check: pass`.** At HEAD, every committed phase record (`reviews/phase-{1..6}/tdd-check.json`) has
  `status: pass`. Phase 4 and phase 6 round 3 explain why the final-tests-on-base sub-check exits 2 after the
  merges (R3-02 and R3-03 there), and why direct evidence stands in for it. This round changes no test, so that
  judgement is unchanged.
- **Mutation.** Not rerun. No package or gate source line changed since phase 4 round 3's mutation run, except
  009's records in source.ts, which arrived through the merge, and the D1 renames in test code.

## Checks run

On aeda253, locally:

| Command | Result |
|---------|--------|
| `pnpm run gate:typecheck` | exit 0, no type error |
| `pnpm run gate:lint` | exit 0, 446 files, no finding |
| `pnpm run gate:style-lint` | exit 0, 41 files, no finding |
| `pnpm run gate:test-lint` | exit 0, 327 files, no finding |
| `pnpm run gate:brand-rules` | exit 0, 7 rules checked |
| `pnpm run gate:contrast` | exit 0, 207 pairs in light, 215 in dark (196 required per theme) |
| `pnpm run gate:manifest` | exit 0, 20 elements, no finding |
| `pnpm run gate:prefix` | exit 0, 460 files, no finding |
| `pnpm run gate:pins` | exit 0, 5 manifests |
| `pnpm run gate:config-copies` | exit 0 |
| `pnpm run gate:signoff -- --range origin/main..HEAD` | exit 0, 97 commits, no finding |
| `vitest run --project tokens` | 12 files, 166 tests passed |
| `vitest run --project gates` | 66 files, 2362 tests passed (brand-rules, gates-readme and plant-runner included) |
| `pnpm run gate:plants -- --plan` | 77 shards (R2-01); listed only, no plant judged |
| `grep -rhoE "^export const [A-Z]\w*" storybook/stories \| wc -l` | 194 (R2-01) |

I did not rerun `pnpm test` in full, `storybook-build`, `visual`, `axe` or the plants. The CI run on ac2d73a is the
evidence for those, and HEAD differs from ac2d73a only in a review record.

verdict: changes_requested
