# Phase 3 review round 1: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed | `fix-1` 4d1c3a1 (`red-fix-1.log`): the three new fragments fail against the README at e39524c | `packages/elements/test/node/readme.test.ts` (`codeBlockFragments`); `packages/elements/README.md` (unchanged from 463e160); `reviews/phase-3/tdd-exempt.md` removed; `tasks.md` T042 note; `reviews/phase-3/notes.md` |
| R1-02 | note, no change | none | `contracts/elements.md` left as it is, as the review allows |

## R1-01

Three fragments are added to `codeBlockFragments` in `readme.test.ts`. No existing fragment is changed:

- (a) the late-font caveat of § Direction (T042), as two statements: "That holds once the block has laid out in its
  font: the one write uses the widths of the first layout, and a font swap does not repeat it" (the qualifier), and
  "On a page where the sans face (`--ocelle-font-sans`) arrives after the first layout, … so preload the sans face for
  `rtl` scroll blocks";
- (b) the code block's sentence in § Engines' WebKit paragraph (T040): "Nor is `ocelle-code-block`'s scroll mode, on
  the same module: … are untested in WebKit".

**Red, against the README at e39524c.** The phase had already put both sentences into the README (463e160).
`red.sh` runs the tests at the red commit itself, so the red sequence is three commits:

1. ce77dd8 (docs) returns `packages/elements/README.md` to its text at e39524c (`git checkout e39524c -- …`). Between
   e39524c and 463e160 the README differs only by the two sentences.
2. 4d1c3a1 (test-only) adds the fragments. `red.sh 3 fix-1` ran the whole suite at this commit and reported
   `"tests_only": true, "red": true, "recorded": true`. It is recorded as `fix-1` in `red-commits`. The failures are
   these three fragments, and nothing else fails: "unit-tests: 3 of 8156 tests failed" (`red-fix-1.log`, with the
   machine's paths replaced by placeholders). A run of the README test file alone at this commit gave 3 failed and
   725 passed.
3. The fix commit puts the README back to its text at 463e160, unchanged, and the three fragments pass.

**Exemption.** `tdd-exempt.md` is removed. `tdd-check.sh` treats a phase as exempt only while `red-commits` is empty,
so with `fix-1` recorded the exemption no longer applies. The full check now runs for phase 3: the red commit, the
final tests against e39524c, and the tests at HEAD. `notes.md` marks its "No test-first commit" section as superseded
and keeps the original reasoning as written.

**T042 text.** tasks.md T042 says "No element code, story or test changes". Principle VIII overrides that text. A
review note on T042 now records that the review required these fragments and that they were added test-first in this
round. No element code or story changed.

## Checks

Run locally (operator CI-first decision): `gate:typecheck`, `gate:lint`, `gate:test-lint` (338 files) and
`gate:signoff` over the round's commits, all with no finding. `vitest run --project elements-node` gave 6 files and
784 tests passed (781 before the round, plus the 3 new fragments). The red run (`red.sh`) ran the whole `pnpm test`
at 4d1c3a1. The browser projects, plants, mutation and the visual and axe gates are left to CI. The round changes no
source, story, token or baseline.
