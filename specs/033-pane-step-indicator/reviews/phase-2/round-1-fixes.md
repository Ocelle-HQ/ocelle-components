# Phase 2 fixes for review round 1

| Finding | Resolution |
|---------|------------|
| R1-01 | The regular Vitest workspace routes the direct host checks exclusively to `storybook-browser`. Default Stryker keeps that project. The standard local host scope detected or accounted for all 140 mutants, with no survivors, uncovered mutants or timeouts. Both built browser proofs still run. |
| R1-02 | The eight pinned light and dark images are checked in. Real Storybook, accessibility, responsive negative controls, the exact Unit receipts and full Plants passed. Both phase red pins replay at their named assertions. |
| R1-03 | Review note retained. In the Back arrangement, a second Back activation on Review keeps the current pane. |

[Test-first replay](tdd-check.json) · [Mutation](mutation.md) · [Negative controls](negative-controls.md) · [Baselines](visual-baselines.md) · [Plants](plants.md)

## Exact hosted candidate

All 19 repository checks passed on `086e11acd0693235880275ea04d5f54f897a7ace` against main `25c53a915717fe464a67b53a7dd58ceaf4abc0c7`. The tested merge is `aa12493e9bc93d97f761337a0ebd9dc9f4ca7e92`, run 45749472887 attempt 1. [CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45749472887)

Unit tests passed 12,220 tests in 369 files across six shards. Both pinned Visual engines matched all 796 story-theme baselines. Accessibility passed on the same candidate. [Unit tests](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45749472887/job/139682721769) · [Visual](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45749472887/job/139673514989) · [Mutation testing](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45749472887/job/139687421567)

The focused local replay passed seven files. The four existing aggregate count files were deferred to CI. The Unit plan and individual result artifacts name the same tested merge and report these exact successes.

- `gates/test/integration/axe.test.ts`, shard 3, 4 passed
- `gates/test/integration/visual-capture.test.ts`, shard 2, 4 passed
- `gates/test/integration/visual-findings.test.ts`, shard 0, 1 passed
- `gates/test/integration/visual.test.ts`, shard 1, 1 passed

The previous hosted Unit run failed only in the mutation configuration inventory. Its complete shard receipts named two stale expected project lists. Signed commit `18e3ecef` updates that inventory and the collected browser test identities. The focused inventory suites passed 15 tests. [Previous run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45746677249)
