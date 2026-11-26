# Landing verification

Op 032 preserves focused red and green replay after integrating main. It reports exact shard inventory differences and bounded worker errors, rejects delegated changes outside their role, and adds a planning preflight for Storybook. [Scope](spec.md) · [Triage](../../triage/032-workflow-hardening.md)

## Integrated replay

The branch merged main at `3d090026a19dd8e2479ff02f2ff9b8161fe00ef1` and kept the original phase base and failing commits. The corrected runner pinned the unique merge base and proved the final tests green at `5ee0928364077c41a48689cc543d9a06b7a2897b`. The historical and overlay checks each reproduced the required 14 original assertions, two first-review assertions and eight landing-fix assertions. [Replay receipt](reviews/phase-1/tdd-check.json) · [Phase review](reviews/phase-1/round-4.md)

## Landing findings

- Pin creation and proof reject stale and ambiguous common ancestors. They still accept the latest integrated commit when the remote main ref has advanced.
- The runner shows at most eight 500-character errors and reports the omitted count. It preserves the full `result.json` and the exact inventory differences.

The five focused suites passed 259 tests. Local Typecheck, Code lint, Test lint, Sign-off, Sandbox paths and Story config copies passed. All 326 Plants were selected for hosted execution. [Fix evidence](reviews/phase-1/round-3-fixes.md) · [Independent landing verification](reviews/landing/round-2.md)

## Hosted checks

The pre-integration folded candidate passed all 19 repository checks. The final published candidate requires another pass of all 19, including the complete Unit inventory, all Plants, changed-source mutation and Sandbox paths. Match the final PR head, main base and tested merge to the workflow receipt. [Earlier folded CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45740068184) · [Final pull request checks](https://github.com/Ocelle-HQ/ocelle-components/pull/101/checks)

GitHub's main ruleset requires 18 named checks. The repository also verifies Sandbox paths before landing. Repository settings remain operator-controlled. The intermittent browser worker failure remains tracked in #97. [Issue #97](https://github.com/Ocelle-HQ/ocelle-components/issues/97)
