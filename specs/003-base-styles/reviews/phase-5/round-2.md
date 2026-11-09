---
phase: 5
round: 2
verdict: approved
base: 523c5ce0cb9d3444ffe9b4d4292c2996b7801fa1
head: 30f70cf4faebd3e04d181f477c72982027c1cdc0
tdd_check: pass
---

# Phase 5 review, round 2

Scope: `git diff 523c5ce..30f70cf`. Since round 1 (681a473), only the fix commit 30f70cf has landed. It touches
README.md, readme.test.ts, wrap.test.ts, wrap.html, base-content.json, and adds the fix note and `fix-1-guards.log`.
The re-run `tdd-check.sh 5` outputs in the tree are committed with this review. They change only `head`, timings,
line numbers moved by 3, and the test count (2005 to 2008).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|

No findings.

## Test quality

- **Red evidence.** The phase red commit f6434c2 is unchanged (`red-commits`: `phase f6434c2`), and `tdd-check.json`
  is `pass`:
  - red exits 1;
  - the final tests exit 1 on the base and on the scaffold;
  - HEAD exits 0.

  The fix has no `fix-1` red entry, and that is justified. R1-01 adds assertions for statements the README already
  carried. R1-02, R1-03 and R1-04 are wording changes. R1-06 tightens a test helper. None of them changes behaviour,
  so no behavioural red test was possible.
- **Guard evidence for R1-01, reproduced.** I edited a working copy of `packages/styles/README.md` and restored it
  with `git checkout` after each run:
  - Unmodified: 57 of 57 pass.
  - Base layer token list (README:46-48) removed: only "Tokens it uses: `--ocelle-color-scheme`, ..." fails, with an
    `AssertionError`.
  - Qualifier changed to "Examples of such boxes:": only "Examples of such boxes, not a complete list:" fails.
  - Remedy sentence "Give such a box a definite width or stretch it." (README:173-174) removed: only that fragment
    fails.

  This matches `fix-1-guards.log`. The example list between the qualifier and the remedy stays unasserted, as plan
  decision 14 wants (readme.test.ts:72-75).
- **R1-06: the plant assertion is kept, and the check is stricter.** `wrapProblems` (wrap.test.ts:49-69) now
  measures `scrollWidth > clientWidth + 1` on the box element rather than on the identifier.
  - US4-1 calls it with `("hooked", "hooked")` (wrap.test.ts:84, 92). The measured element is the same as before, so
    the check is unchanged for the cell. The `wrap-ellipsis` plant expectation (wrap.test.ts:97, which includes
    `"hooked: clipped"`) is byte-for-byte unchanged since red. It passes in the full run, and `gate:plants` reports
    every plant as expected.
  - For the spans (wrap.test.ts:177), the check now bites. I reproduced this on working copies of `base.css` without
    the wrap rule and of `wrap.test.ts` with the narrow assertion moved first, then restored both. `prose-id: clipped`
    and `compact-id: clipped` are reported at 320 px and at 200%, in light and in dark, as `fix-1-guards.log` shows.
- **Weakened tests.** `git diff f6434c2..HEAD` on the test files shows only additions. Three new fragments were added
  in readme.test.ts. The `wrapProblems` change is equal or stricter for every caller. The fixture change is wording
  only ("Run id", "The id of the run is"), and no assertion reads that text. No skip, only, conditional assertion or
  snapshot was added.
- **Mutation.** `pnpm run gate:mutation -- --base 523c5ce` ran 11 mutants on the changed lines of 1 file. None
  survived, and the command found 0 equivalent records.

## Checks run

Container Node 22 (not the pinned 26.13.0); Chromium from the given `PLAYWRIGHT_BROWSERS_PATH`; one heavy job at a
time.

| Check | Result |
|---|---|
| `pnpm test` | 2008 tests passed in 96 files |
| `gate:typecheck` | no type error |
| `gate:lint` | 170 files, no finding |
| `gate:test-lint` | 111 files, no finding |
| `gate:style-lint` | 2 files, no finding |
| `gate:prefix` | 132 files, no finding |
| `gate:csp` | 23 files, no finding |
| `gate:contrast` | 158 pairs in light, 157 in dark |
| `gate:brand-rules` | 7 rules checked |
| `gate:config-copies` | identical |
| `gate:pins` | 5 manifests, no finding |
| `gate:mutation -- --base 523c5ce` | 11 mutants, none survived, 0 equivalent records |
| `gate:plants` (alone, after mutation) | 182 plants, every plant as expected |
| `tdd-check.sh 5` (run before this review) | `pass` |

Axe and visual regression are absent under 001's recorded exception (sunset #10), as in earlier phases.

## Earlier findings

- **R1-01 (blocking): resolved.**
  - readme.test.ts:43 asserts the base layer's full token sentence, which matches README:46-48.
  - readme.test.ts:74 asserts the qualifier on its own.
  - readme.test.ts:75 asserts the remedy sentence.
  - Each fragment fails when its statement is removed (reproduced above).
- **R1-02 (blocking): resolved.** In storybook/stories/base-content.json:61, the Identifier wrap story's `short` is
  now "Run id". The unbroken 120-character identifier at line 60 is unchanged. The only remaining "Digest" is the
  Value hook story's `3f2a 9c1b 07d4 e5a8` (base-content.json:19), which is in groups of four, as constitution II
  requires. The render, stories and csp tests read the text from the story data and pass.
- **R1-03 (note): done.** wrap.html:14, 18, 22 and 25 now say "Run id" and "The id of the run is".
- **R1-04 (note): done.** README:186 reads "mission slugs, ids and paths". No fragment asserted the old wording.
- **R1-05 and R1-07 (notes): no change was required.** Both are deferred as the fix note records.
- **R1-06 (note): done.** See Test quality. The plant assertion is kept and the span check now bites.
