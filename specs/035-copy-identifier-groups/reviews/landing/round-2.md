---
scope: landing
phase: landing
round: 2
verdict: approved
base: 34c2fe11f9a68d1fde43b3f9d5dff13a29782bd5
head: 5984afeb68540619a379e262fe7da18aeda04097
reviewer: reviewer-renata
---

# Landing review for PR #104, round 2

L1-01 is resolved for this exact head and base under the [operator-approved split evidence for both phases](operator-decisions.md). The pinned historical integration remains a recorded failure for both phases. The alternative retains the original assertion evidence and verifies the current product and the full required checks independently. [Round 1](round-1.md) · [Failed combined replay](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46082716299/job/140785162076)

- Both original canonical replays passed at their recorded commits. The final tests failed against the earlier code and passed at the historical heads. Phase 1 reproduced 51 original product assertion failures and the historical 40-minute `fix-1` assertion. Phase 2 reproduced three original story assertions. The exact integrated head passed 234 focused tests. [Historical replays and integrated focus](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46087265926)
- Both integrated product controls passed. Restoring only the component blob from current `main` reproduced exactly 52 product assertions: all 51 original reds and the wrapping case added before review. Restoring only the Storybook module from current `main` reproduced exactly three missing-story assertions. The first Phase 1 restore job failed its strict assertion matcher. The strict follow-up isolated and verified all 52. [Controls and story restore](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46090537175) · [Component restore and strict matcher](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46091094614/job/140811907695)
- All 19 required checks passed in attempt 1 for both exact refs. I checked all 112 jobs, including the required registry checks and Plants. GitHub's tested merge `bd3acd7e15b699dee936d44511ecb61175f2fb18` names current `main` and the PR head in that order and has the candidate tree `5c326907fe4615e384c8fb6cf4dc0bb7dd526c8f`. [Required CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46084744005) · [Tested merge](https://github.com/Ocelle-HQ/ocelle-components/commit/bd3acd7e15b699dee936d44511ecb61175f2fb18)

The current-main feature delta preserves all 76 reviewed path blobs from round 1 and adds only the two replay-upstream records, each naming the current main SHA. The integrated tree inherits the reviewed 45-minute Mutation budget. The historical 40-minute assertion remains in the original phase evidence. The operator decision expires if either reviewed ref moves before merge. No blocking findings remain. [Exact candidate](https://github.com/Ocelle-HQ/ocelle-components/commit/5984afeb68540619a379e262fe7da18aeda04097)
