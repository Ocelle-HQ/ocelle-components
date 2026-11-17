# Phase 5, review round 2: fixes

Operator round at landing (PR #44), task T052 (`reviews/landing/round-1-tasks.md`).

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R2-01 | fixed: in the rail section of `packages/elements/README.md` the sentence now reads "… or use `ocelle-nav-item` elements once they are released; no release of this package ships `ocelle-nav-item` yet.", keeping FR-027's wording, and the paragraph is re-wrapped so that "`ocelle-nav-item` is expected to have. The rail sets only the gap" sits on one line (the stray line break of the landing review's line 445 removed). "For #12:" stays. No source, CHANGELOG or story change, so no mutation run and no baseline. The readme test's fragment was replaced by a stricter one, not a looser one: the new fragment holds the old statement word for word up to "use `ocelle-nav-item` elements" and adds the release statement FR-027 now asks for, so a README that passes the new fragment still states everything the old one asserted. | `fix-2` 8ccda41 (tests only), recorded by `red.sh 5 fix-2` (`red-fix-2.log`: "2 of 3601 tests failed", both in `test/node/readme.test.ts`, each an `AssertionError` on `toContain`: the stricter fragment, and the new raw-text test "keeps the rail's item-size sentence and the next one on one line of the README as written"). | packages/elements/README.md; packages/elements/test/node/readme.test.ts (fix-2) |

## Checks at the fix

| Check | Result |
|---|---|
| `pnpm exec vitest run --project elements-node` | 251 passed |
| `pnpm exec vitest run --project elements-browser test/browser/personal-rail.test.ts` | 28 passed (US4-10 still finds the README's orientation example) |
| `gate:test-lint` (207 files), `gate:lint` (304 files) | pass |

T052 was not ticked in `tasks.md` by the fix commit 33d7df1; the tick was added afterwards in a bookkeeping commit, its work checked present first.
