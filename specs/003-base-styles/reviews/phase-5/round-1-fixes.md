# Phase 5 review round 1: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed | No red commit: the finding is that the test was missing statements, and the README already carries them, so the new fragments pass at once. Their guard is shown in `fix-1-guards.log`: on a working copy of the README with each statement removed (restored with `git checkout` after each run), each new fragment fails with an `AssertionError`, one test each: the base layer's token list, the "not a complete list" qualifier and the remedy sentence. | `packages/styles/test/readme.test.ts`: three fragments, the base layer's "Tokens it uses: …" list, "Examples of such boxes, not a complete list:" and "Give such a box a definite width or stretch it". The qualifier is asserted on its own, so the example list between the two fragments stays unasserted (plan decision 14). |
| R1-02 | fixed | None: this is a labelling change with no behaviour (constitution II, groups of four for digests). The render, stories and csp tests read the short text from the story data, so they need no change, and they pass with it. | `storybook/stories/base-content.json`: the Identifier wrap story's short text is "Run id" instead of "Digest". The unbroken 120-character identifier is unchanged. The Value hook story's "Digest" (`3f2a 9c1b 07d4 e5a8`) is in groups of four and stays. |
| R1-03 | fixed | None: test-only wording. | `packages/styles/test/fixtures/wrap.html`: "Run id" and "The id of the run is" instead of "Digest" and "The digest of the run is". |
| R1-04 | fixed | None: documentation wording that no fragment asserts. | `packages/styles/README.md`: "mission slugs, ids and paths", with "digests" dropped. |
| R1-05 | deferred: the review requires no change and accepts the 320 px / 200% per-element proof | — | — |
| R1-06 | fixed | The check now measures clipping on the box the identifier must stay in (the hooked cell is its own box; the spans use their paragraph). `fix-1-guards.log` shows it bites: on a working copy of `base.css` without the wrap rule, with US4-4's narrow assertion moved first in a working copy of `wrap.test.ts` (both restored after the run), `prose-id: clipped` and `compact-id: clipped` are reported at 320 px and 200%. Before the fix the spans could never report it. The US4-1 plant expectation (`hooked: clipped`) is unchanged and still holds. | `packages/styles/test/browser/wrap.test.ts`, `wrapProblems` |
| R1-07 | deferred: the review requires no change; the 300 px is story layout in the story-only sheet, as R-12 plans | — | — |

## Checks

Container Node 22 (not the pinned 26.13.0), Chromium from `PLAYWRIGHT_BROWSERS_PATH`, one heavy job at a time:

- `pnpm test`: 2008 tests passed in 96 files (2005 plus the three new fragments).
- `gate:typecheck`, `gate:lint` (170 files), `gate:test-lint` (111), `gate:style-lint` (2), `gate:prefix` (132),
  `gate:csp` (23), `gate:brand-rules` (7 rules), `gate:config-copies`, `gate:pins` (5 manifests): no finding.
- `gate:contrast`: 158 pairs in light, 157 in dark.
- `gate:mutation -- --base 523c5ce`: 11 mutants on the changed lines of 1 file, none survived, 0 equivalent records.
- `gate:plants` (alone, after mutation finished): 182 plants of 13 gates and the registry, every plant as expected.
