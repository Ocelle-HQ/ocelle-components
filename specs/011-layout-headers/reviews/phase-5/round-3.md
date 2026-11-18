---
phase: 5
round: 3
verdict: approved
base: a54366b18c1937589c05f8d510b74a362f65eae9
head: 1d83347465c3dae2c54a0c85840bfd3cebc3d734
tdd_check: pass
---

# Phase 5 review, round 3

Scope: `git diff a54366b..1d83347`, 34 commits. Before I started, the working tree had no uncommitted change.
Round 1 (fff002c, approved) reviewed the phase's own work. After the history fold, `reviews/history-map.txt` maps
round 1's SHAs to the folded ones: base 2b1c1ac to a54366b, scaffold 3cda650 to 6e2f6e4, red 5d556e3 to 258da64, and
head f4ca8ec to the green commit 6a0710c. This round adds the following for phase 5:

- the operator round `4e559b1` (`round-2.md`, R2-01 = landing L1-05);
- the planner's T052 in `f7fe243`;
- the red commit `8ccda41` (fix-2);
- the fix `33d7df1`;
- the tdd-check outputs `d93f145`;
- the T052 tick `504f018`.

The rest of the range is other phases' landing fixes and reviews. Each of those is reviewed in its own phase's round:

- phase 1: `f47c795`, `cd81e00`, `05c4e75`;
- phase 2: `1926756`, `f058ea9`;
- phase 4: `4da65c9`, `749125b`;
- the landing and flow records.

After `33d7df1`, only `tasks.md` and files under `specs/011-layout-headers/reviews/` changed
(`git diff --name-only 33d7df1..HEAD`).

I read the following:

- spec.md (FR-027, the FR-036 rail bullet, the Edge Case on plain `<a>` items at spec.md:607-609, and the L1-05 line
  at spec.md:128);
- tasks.md Phase 5, including T052;
- contracts/elements-package.md (rail, line 79);
- the constitution;
- `reviews/landing/round-1.md` (L1-05) and `reviews/landing/round-1-tasks.md`;
- rounds 1 and 2;
- `round-2-fixes.md`, `red-commits`, `red-fix-2.log`;
- the README rail section;
- the readme test.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | note | specs/011-layout-headers/reviews/phase-5/check-final-tests-on-base.log (tail) | The "final tests against the base" run exits 2 with `unit-tests: could not run: no test file found`. That is a load error, not a failure for missing behaviour, and `tdd-check.sh` accepts any non-zero exit. This is the `tdd-check.sh` matter already recorded in phase 1 (R3-03, R4-01) and phase 4 (R3-01). I cite it rather than re-derive it. For phase 5 the behavioural evidence is intact. The scaffold run exits 1: `check-final-tests-on-scaffold.log` has 126 of 3601 tests failed, and each of the 126 is an `AssertionError`. `check-red-phase.log` has 118 of 3593 failed, and `check-red-fix-2.log` has 2 of 3601 failed. Every failure in both logs is an `AssertionError`. | None for this phase. The possible op on `tdd-check.sh` recorded in phase 1 round 3 applies. |

There is no blocking finding.

## Test quality

**Red/green check (re-run, HEAD moved).** `tdd-check.sh 5` reports `pass` with no problems:

- head 1d83347;
- red `phase` 258da64 exit 1 and red `fix-2` 8ccda41 exit 1;
- base exit 2 (R3-01);
- scaffold exit 1;
- head exit 0 (`check-head.log`: "3601 tests passed in 158 files").

The run left no worktree behind (`git worktree list` shows only the main tree).

**Red evidence for fix-2.** `red-fix-2.log` (from `red.sh 5 fix-2`) and the re-run `check-red-fix-2.log` each show
"2 of 3601 tests failed". Both failures are in `packages/elements/test/node/readme.test.ts`, and each is an
`AssertionError` on `toContain`:

- line 269, the stricter `states:` fragment;
- line 283, the new raw-text test.

Neither is a load or setup error. The red commit `8ccda41` changes only `packages/elements/test/node/readme.test.ts`,
which is inside `test_pathspec`.

**No weakening.** `git diff 8ccda41..HEAD` touches no test file and no story file. Since the phase's red commit,
`git diff 258da64..HEAD` changes these test files:

- **The readme test.** The change is the R2-01 replacement, plus the fragments of phase 1 (T048) and phase 4 (T050),
  which only add assertions.
- **The scenario, driver and build-test additions of phases 2 and 4.** These only add.
- **The storybook-build plant copy `fail-empty-index/.../personal-rail.stories.ts`.** The green commit 6a0710c added
  it, and round 1 reviewed it.

The R2-01 replacement is stricter, and its reason is given in the test's comment (readme.test.ts:210) and in
`round-2-fixes.md`:

- The new fragment keeps the old statement word for word up to "use `ocelle-nav-item` elements".
- It adds "once they are released; no release of this package ships `ocelle-nav-item` yet.", the wording that FR-027
  and the Edge Case now require (spec.md:608-609, 791-793).
- The old full stop gives way to that clause. A README that states the new fragment states everything the old one
  asserted, plus the release status.

**Assertions.** Both tests assert observable README text with `toContain`. They have no condition, no skip and no
snapshot. The raw-text test reads the file without `flat()`, so a line break between "is expected to have." and "The
rail sets only the gap" fails it.

I planted each half separately on the README at HEAD and restored it afterwards:

- With "; no release of this package ships `ocelle-nav-item` yet." removed, exactly the `states:` fragment fails.
- With the line break restored before "The rail sets", exactly the raw-text test fails.

Each run is `vitest --project elements-node readme.test.ts` with "1 failed | 221 passed".

**Coverage.** R2-01 is documentation only. Its two required outcomes, the release statement and the removed line
break, each have a test. US4-10 still finds and runs the README's orientation example: the rail browser tests pass in
the head run.

**Mutation.** I ran `pnpm run gate:mutation -- --base a54366b18c1937589c05f8d510b74a362f65eae9`. It reported "29
mutants on the changed lines of 4 files, none survived; 0 timeouts, 2 compile errors, 3 zero-mutant entries; 1
equivalent record".

- The equivalent record is `ocelle-personal-rail.ts:44`, the `label` options `{}`, which give Lit's String defaults.
  Round 1 accepted it and I accept it again.
- The compile errors are on rail lines 164 and 167.
- The zero-mutant entries are these:
  - `src/index.ts` (re-exports);
  - `src/ocelle-card.ts` and `src/ocelle-context-sidebar.ts`, whose changed lines here are the phase 2 and phase 4
    landing fixes and fall in their own rounds.
- These are reports, not findings. The phase 5 fix changes no source.

**Plants.** The fix changes only the README, and no code, test, gate or story changed after 33d7df1. As the
orchestrator relayed, the implementer's full sharded `gate:plants` run passed at 33d7df1 with 301 plants as expected.
This is the same record that phase 1 round 4 and phase 2 round 5 cite; no file in the repository holds it. I found no
reason to re-run the plants. My two README plants are above.

## Other checks of the phase

**Tasks.**

- T041 to T047 and T043a are ticked, as round 1 found.
- T052 is ticked (`504f018`) and its work is present:
  - the red commit changes only the test file;
  - the green commit changes, outside the review directory, only `packages/elements/README.md`, the rail section
    lines 448-452 (`git show --stat 33d7df1`);
  - there is no source, CHANGELOG or story change, as T052 says;
  - "For #12:" stays (README.md:444).
- `round-2-fixes.md` records that the tick came in a later bookkeeping commit.

**R2-01 against the artifacts.**

- README.md:451-452 now reads "or use `ocelle-nav-item` elements once they are released; no release of this package
  ships `ocelle-nav-item` yet." This matches FR-027 ("once released: no release of `@ocelle/elements` ships
  `ocelle-nav-item` yet", spec.md:791-793), the Edge Case (spec.md:608-609) and contracts/elements-package.md:79.
- The other two `ocelle-nav-item` mentions present it as expected, not as available:
  - README.md:449, "the size #12's `ocelle-nav-item` is expected to have";
  - README.md:452.
- Neither CHANGELOG nor the root README names it.
- The paragraph has been re-wrapped, and no line of it exceeds 120 characters.

**Constitution.** The fix touches no element, token, style or story, so Principles I to V are not affected. VII: the
README gains no planning ID. VIII: test first, as above.

**Plan.** plan.md § Fixes and T052 are followed.

## Checks run

All checks ran at 1d83347 with `SPECIFY_FEATURE_DIRECTORY=specs/011-layout-headers`,
`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and `OCELLE_VISUAL_ENGINE=docker`
(`docker info` succeeded).

| Check | Result |
|---|---|
| `tdd-check.sh 5` (re-run: HEAD moved) | pass, head 1d83347; red `phase` and `fix-2` exit 1; base exit 2 (R3-01), scaffold exit 1 (126 of 3601, all `AssertionError`); head exit 0, 3601 tests passed in 158 files (this is also the `pnpm test` result) |
| `gate:typecheck` | no type error |
| `gate:lint` | 304 files, no finding |
| `gate:style-lint` | 19 files, no finding |
| `gate:test-lint` | 207 files, no finding |
| `gate:csp` | 24 files, no finding |
| `gate:prefix` | 270 files, no finding |
| `gate:pins` | 5 manifests, no finding |
| `gate:config-copies` | identical |
| `gate:contrast` | 169 pairs in light, 177 in dark (158 required) |
| `gate:brand-rules` | 7 rules checked |
| `gate:manifest` | 7 elements checked, no finding |
| `gate:storybook-build` | built 57 stories |
| `gate:axe` | 114 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted, all in the Prose document, as before) |
| `gate:visual -- --engine docker` | "114 captures match their baselines (docker only: no cross-engine comparison)" |
| `gate:signoff -- --range a54366b..HEAD` | 34 commits checked, no finding |
| `gate:mutation -- --base a54366b…` | 29 mutants, none survived (see Test quality) |
| `gate:plants` | not re-run: the implementer's full sharded run passed at 33d7df1 (301 plants as expected); no code, test, gate or story changed after it |
| Two README plants of my own, restored afterwards | each fails exactly its R2-01 test (see Test quality) |

## Earlier findings

Round 2 was the operator round and had one blocking finding.

- **R2-01** (landing L1-05, `packages/elements/README.md:440-448`): **resolved.**
  - The rail section now says that `ocelle-nav-item` is not released yet, in the wording that FR-027, the Edge Case
    and the contract ask for (README.md:451-452).
  - The stray line break is gone: "`ocelle-nav-item` is expected to have. The rail sets only the gap" is one line
    (README.md:449).
  - The fix came test-first. `red-commits` has `fix-2 8ccda41`, and `red-fix-2.log` and `check-red-fix-2.log` show
    both new assertions failing on `toContain` before 33d7df1.
  - Both pass at HEAD, and each fails alone when its half of the fix is undone.
  - The fix note (`round-2-fixes.md`) matches the commits.
