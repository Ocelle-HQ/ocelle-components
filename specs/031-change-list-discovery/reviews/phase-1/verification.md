# Issue 75 workflow pilot verification

The paired tested merges were `d33bd40b1ef369bc6dd7f1f2bda4b04ea743d57d` (main workflow, published head `b83927ab`) and `784fedde2409a09b089da8ddff12dea1c830eddf` (Op 030, published head `f2540731`). Both had identical stories, Storybook layout CSS, browser tests, Axe assertions, four pinned new PNGs and affected Plant fixtures. There were 394 stories and 788 pinned images in both arms.

The standard candidate replay reproduced all six named missing-story assertions on the pre-implementation source, then passed the same head selection. Both replay arms passed six selected local files. The candidate reused its verified initial red in 0.53 seconds, repeated final-on-base in 7.10 seconds and ran the local head check in 322.97 seconds. The control workflow used the explicit pathspec for replay, while the candidate used the normal installed script and its two implementation-story declarations. [Candidate replay](tdd-check.json)

| Check or timing | Control | Op 030 |
|---|---:|---:|
| Required checks | 18/18 | 18/18 |
| Unit file identities | 357 | 360 |
| Visual integration cases | 11 passed | 11 passed |
| Discovery behavior cases | 6 passed | 6 passed |
| Axe integration cases | 4 passed | 4 passed |
| Wall time to all required checks | 43m 22s | 23m 17s |
| Unit stage wall time | 43m 20s | 23m 13s |
| Unit shard runner time | 108m 09s | 112m 15s |

Both dedicated Visual jobs matched all 788 story themes under Docker and Podman. Both dedicated Axe jobs audited 788 story themes with zero serious or critical issues and the expected 132 exception notes. The negative Axe test still requires exit 1 and both exact critical selector findings across 790 story themes. The empty-index and token-change Plants matched their expected verdicts in both arms. The successful candidate Unit receipts bind the four explicitly deferred count-only suites to its tested merge and to shards 0, 1, 2 and 3. [Control CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45704188146) · [Candidate CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45704388510) · [Plants evidence](plants.md)

The signed worktree verifier accepted both story implementations from the same red pin before integration. The discovery recommends a shared composition recipe using the existing elements, with each host supplying its own interpretation and actions. [Recommendation](../../recommendation.md)
