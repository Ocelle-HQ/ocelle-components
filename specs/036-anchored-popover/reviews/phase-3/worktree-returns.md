# Phase 3 test worktree returns

- Pin `cc68c81d82b05b29c740d15130ad1090f9c51442`
- Joined tests-only revision `05c793e9e7657fa04104cafc614f9c4c311eea2b`
- The local workspace was unavailable. The three drafts were checked in separate disposable worktrees on the hosted runner. The grouped return checker and implementation scopes passed.
- The built preview's existing index contains 398 stories. Four assertions identify the exact missing popover story IDs. The other three assertions identify missing shared host and stylesheet assets before loading or compiling them. [Canonical red and worktree checks](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46175959371/job/141074545867)

| Assignment | Verified return | Assigned paths |
| --- | --- | --- |
| T018 built Storybook | `a2b0597c04c37d0dda4ff5551b005623cb53e472` | `storybook/test/integration/anchored-popover.test.ts` |
| T019 strict packaged browser | `4a8d59b404cb51c2fcbdfedf4a95b6b38bb3a912` | `packages/elements/test/browser/anchored-popover-stories.test.ts`<br>`packages/elements/test/browser/fixtures/anchored-popover-stories.html` |
| T020 retained host | `3d7608080d187b940f0511a458157e526938dc89` | `storybook/test/unit/browser/anchored-popover.test.ts` |
