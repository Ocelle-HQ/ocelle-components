---
scope: landing
round: 2
verdict: approved
base: ce1d9c72b7f9e028565e61684465cf8df448ac1d
head: 59f8ff9ef52ee91c08d2ac0e5de4c2bc94af3109
tdd_check: pass
---

# Landing review, round 2: PR #45 (op 016, issue #41)

This round follows the stop rule (operator decision 2026-11-03). It checks only two things: that landing round 1's
blocking findings are resolved, and that the folds regressed nothing. It does not search afresh. `origin/main` is
still `ce1d9c7`, the merge base, so the branch is up to date.

The operator folded L1-01 to L1-05 into the PR as phase 1 operator round 3 (`reviews/phase-1/round-3.md`, O3-01 to
O3-05). The fixes are in `round-3-fixes.md`, and phase round 4 (`round-4.md`) approved them. I used those files as
input and checked every claim below myself on HEAD `59f8ff9`. `59f8ff9` differs from `e10f166` only in phase evidence
files and `round-4.md`, so the CI result I was given for `e10f166` (every suite completed, nothing failed) applies to
the code under review.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L2-01 | note | `ops/016-plants-affected/spec.md` *Assumptions*; `gates/README.md` known limit | The known limit that remains, accepted and documented, still applies. Token values, `base.css`, fonts and element source reach the visual plants' own stories and the `unit-tests` and `mutation` plants, and only CI's full set judges those. This is no change from round 1. I list it so the PR body can carry it as an accepted limit. | None. |

There is no blocking finding.

## Round 1 blocking findings

### L1-01: under-selection for element and token paths. Resolved.

- **Code.** `gates/lib/plant-runner.ts:399-429`, class 5. An element path (`elementPath`: `packages/elements/src/` or
  `packages/elements/custom-elements.json`) now also selects every `manifest/*` plant. A path under `packages/tokens/`
  now also selects every `contrast/*`, `brand-rules/*` and `style-lint/*` plant. Both come on top of
  `repositoryContentPlants`. This is the operator's "Widen by gate".
- **Round 1 reproduction, run again on HEAD.** I made a scratch worktree, changed one JSDoc sentence of
  `OcelleBrandMark` and regenerated the manifest (`packages/elements/scripts/manifest.ts`). Then I ran
  `gate:plants -- --affected HEAD --list`, which exited 0. It selects all 12 `manifest` plants, `manifest/pass-reordered`
  among them, plus the 10 listed repository-content plants: 22 notes in all.
- **Token probe.** A one-line change to `packages/tokens/src/source.ts` selects 90 of 302 plants: contrast 14 of 14,
  brand-rules 14 of 14 and style-lint 54 of 54, plus the listed plants. `packages/tokens/package.json` still gives
  the full set (unit test, scenario 13).
- **Pin.** The pin now covers the 12 `manifest`, 14 `contrast` and 14 `brand-rules` cases, as round 1 asked
  (`gates/test/plant-runner.test.ts`, "pins the 12 manifest, 14 contrast and 14 brand-rules cases, …").
- **Red evidence.** The red commit `b9dc410` (`fix-3` in `red-commits`) changes only test files. `red-fix-3.log` shows
  the new selection tests failing on their assertions. Two existing expectations became stricter (each adds
  `contrast/fail-x`); none became looser.
- **Records.** The README paragraph, spec OR-001/OR-002, the plan's path classes and spec *Assumptions* describe the
  widened classes. The remaining known limit is L2-01.

### L1-02: no test for a failing `git diff` / `git ls-files`. Resolved.

- **Test.** `gates/test/integration/plants.test.ts` gains the case "--affected HEAD exits 2 naming git's first stderr
  line when git diff fails, and judges no plant". It sets a junk `GIT_INDEX_FILE` and asserts the whole outcome:
  `{ code: 2, stdout: [], stderr: [<git failed (fatal: … index file smaller than expected)>] }`, with only the index
  path left open. It passes on HEAD.
- **The test can fail.** In a scratch worktree I changed `const failed = runs.find((ran) => ran.exitCode !== 0)` to
  `runs.find((ran) => false)`. The test then failed: `expected { code: 1, stdout: [ …(48) ] … } to deeply equal
  { code: 2, stdout: [] … }`. So the fail-open mutant that round 1 described is now killed. I reverted the change and
  removed the worktree.
- **Records.** The two `Stryker disable` records at `gates/bin/plants.ts:664` and `:666` now name this test, which is
  true. Nothing else in the file changed.
- **No red commit.** This is right: it is a missing test for behaviour that already worked, the fix procedure's
  step 3, as round 1 said.

## Folded notes (L1-03 to L1-05), checked for regressions

- **L1-03.** `gateEntryImports` holds one pair: `prefix` imported by `brand-rules`. Class 3 also selects each
  importer's plants. A change to `gates/bin/prefix.ts` selects 25 plants on HEAD: all 11 `prefix` plants and all 14
  `brand-rules` plants. Scenario 15 reads every registered gate entry's imports and pins the pairs. The README's
  known limit no longer needs the `prefix.ts` exception.
- **L1-04.** `specs/006-storybook-workbench/contracts/plants.md` (lines 141 and 193) and `contracts/gates.md:168` each
  gain a dated amendment. The amendments add the `--affected` mode, `fail-affected-in-plant-check` and
  `affected-in-ci`. No existing contract line changed.
- **L1-05.** `tooling/speckit/bin/fold-history.sh` now remaps the first `- base:` line of each phase's `plants.md`.
  Its outside-evidence check accepts a `plants.md` diff only when that diff is exactly one `- base:` line out and one
  in. `gates/test/integration/fold-history.test.ts` covers the remap and passes. Round 4's R4-01 already notes that
  no test proves the check rejects other changes; I do not raise it again. `.claude/skills/ocelle-run/SKILL.md`
  changed only in the matching sentence of the fold step. `.claude/skills/ocelle-land/SKILL.md` is untouched.

## Regression checks

All run on HEAD `59f8ff9` with Node 22.23.4, the only Node installed here; the pinned version is 26.13.0.

- `pnpm test`: exit 0, 3162 tests passed in 139 files.
- `vitest run gates/test/plant-runner.test.ts gates/test/plants.test.ts gates/test/registry.test.ts`: 223 passed.
- `vitest run --project gates-integration gates/test/integration/plants.test.ts gates/test/integration/fold-history.test.ts`:
  7 passed.
- `gate:typecheck`, `gate:lint` (264 files), `gate:test-lint` (174 files) and `gate:config-copies`: all exit 0,
  no finding.
- `tdd-check.json`: `status: pass`, red commits `phase` and `fix-3`, both exit 1, `final_tests_on_base_exit: 1`,
  `head_exit: 0`, no problems.
- Scope of the fold (`git diff 31bf23e..HEAD`): it touches only the files that O3-01 to O3-05 name, plus the phase-1
  evidence and the op records. `ci.yml`, `plant-repo.ts`, `plantShards`, `shardSize` and `otherShardSize` are
  unchanged (round 3 fixes, T018).

I did not run the mutation gate again. Round 4 ran it on these changed lines: 417 mutants, none survived, one
equivalent timeout. My hand mutation above checks the one boundary that round 1 found unguarded. I did not run the
full `gate:plants` either. CI's Plants check on `e10f166` passed.

## Verdict

approved. L1-01 and L1-02 are resolved, the folded notes L1-03 to L1-05 are in place, and nothing regressed.
