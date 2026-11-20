# Phase 1 review round 4: fixes

No red commit this round: the only blocking finding (R4-01) is bookkeeping in `tasks.md`, not a behaviour defect
(fix procedure step 3, non-behavioural findings skip red). No code or test changed.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R4-01 | fixed | No red: non-behavioural (task checkboxes only). | ops/021-fold-signing/tasks.md: T011 to T019 ticked (`- [ ]` -> `- [X]`). Nothing else in the file changed. |
| R4-02 | deferred: note, follow-up under L1-05 as the review says; no change in this op. | - | tooling/speckit/bin/fold-history.sh:101 |
| R4-03 | deferred: note, follow-up under L1-05 as the review says; no change in this op. | - | tooling/speckit/bin/fold-history.sh:140 |
| R4-04 | deferred: note, no change required. | - | ops/021-fold-signing/reviews/phase-1/tdd-check.json |
| R4-05 | deferred: note, no change required (orchestrator run summary, not this op's change). | - | knowledge/speckit-flows/runs/ |

## Checks run

- `pnpm test`: exit 0, 3852 tests passed in 153 files.
- `pnpm run gate:typecheck`: exit 0. `gate:lint`: exit 0, 297 files, no finding. `gate:test-lint`: exit 0, 203
  files, no finding.
- No TypeScript source changed, so `gate:mutation` has nothing to mutate; no CI gate changed, so no plant was added.
- `pnpm run gate:plants -- --affected 34ce2afba10b57e4d2df972f1f9497b283c0b75e`: exit 0, no plant selected, 0 of
  309 plants judged. Same output as `plants.md`, so `plants.md` is unchanged.
- Diff of this round: `tasks.md` (nine checkboxes) and this note only.
