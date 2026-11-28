# Phase 2 test worktree returns

- Pin `36e3a7d1680673705bfc0090894b52098267601e`
- The worker drafts were materialized as separate detached worktrees on the hosted runner after the local workspace failed. The canonical return checker and the implementation scope checks exited 0.
- Joined tests-only revision `55826ccd052f46e8468906d8e1ae11c7af520a38`. All 18 new cases failed on their intended placement assertions in the two scoped projects. The static checks passed. [Red and worktree evidence](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46156700051/job/141014822806) · [Static checks](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46156700051/job/141014823076)

| Assignment | Checked return | Assigned paths |
| --- | --- | --- |
| T011 retained placement | `a65e87c82038229ebcabbc9531d4c9a59adccb09` | `packages/elements/test/anchored-popover-placement.test.ts` |
| T012 strict packaged browser | `eddba450da3999b085c1dc5b23dbf33ace4cf078` | `packages/elements/test/browser/anchored-popover-compat.mjs`<br>`packages/elements/test/browser/anchored-popover.test.ts`<br>`packages/elements/test/browser/fixtures/anchored-popover.html`<br>`packages/elements/test/browser/fixtures/anchored-popover.ts` |
