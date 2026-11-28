# Shared chrome glyph verification

The new catalog, chrome actions and Storybook examples passed the same behavioral assertions first exercised against the phase base. In-process Chromium passed 25 focused tests. The built fixture and built Storybook passed 30 focused tests, including all five named actions.

| Check | Result |
| --- | --- |
| Storybook build | 427 stories, including the five isolated actions and both set galleries |
| Typecheck | No type errors |
| Production lint | 762 files, no findings |
| Test lint | 580 files, no findings |
| Manifest | 52 elements, no findings |
| Manifest preflight | All eight applicable overlay receipts matched their intended findings, with no missing snapshots |
| Built strict CSP | 93 distribution files checked, no findings |
| Docker capture | Two matching pinned captures for seven stories in both themes. Ten new files and four changed gallery files totaled 233,561 bytes. Each file also matched the corresponding image from a separate Docker capture. |

The focused Chromium commands were:

```sh
pnpm exec vitest run packages/elements/test/icon-set.test.ts packages/elements/test/button.test.ts -t 'Chrome action|eighteen-name set'
pnpm exec vitest run packages/elements/test/browser/icon-set.test.ts packages/elements/test/browser/button.test.ts storybook/test/integration/elements-stories.test.ts -t 'eighteen-name set|Chrome action|isolated chrome action'
```

The Docker captures used the repository's pinned image, Storybook builder, two-pass capture runner and baseline comparison. The selected IDs were `elements-ocelle-icon--set`, `elements-ocelle-icon--set-right-to-left` and `elements-ocelle-icon--{inbox,history,settings,notifications,appearance}-action`. Cross-engine verification requires a separate Podman capture. The existing count-only Visual, Visual findings and Axe integration suites are assigned to the required hosted jobs in `test-scope.txt`.
