---
phase: 1
round: 4
verdict: approved
base: 80ea82594a0d29800fc692a87041dbadabdd20a2
head: e10f16617a9d79a0e858569de0be3099666a4630
tdd_check: pass
---

# Phase 1 review, round 4

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R4-01 | note | tooling/speckit/bin/fold-history.sh:123-128; gates/test/integration/fold-history.test.ts | OR-008 has two parts: the remap of `plants.md`'s `- base:` line, and an outside-evidence check that allows that change and nothing else in `plants.md`. The new test covers only the first part. No test makes the fold change another line of `plants.md` and checks that the fold fails. This check guards against a bug in the script itself, because only the script's own remap commit can change `plants.md`. I read `base_line_only`: it counts exactly one `-- base:` line, one `+- base:` line and two change lines in total, and that logic is sound. | None for this phase. A negative case would be a cheap addition if the fold is touched again. |
| R4-02 | note | gates/lib/plant-runner.ts:399 | The mutation run reports one timeout. The mutant drops the `$` after `custom-elements\.json` in `elementPath`. It is equivalent: class 5 is reached only after `repositoryContentPath` (gates/lib/plant-runner.ts:375) has matched `packages/elements/custom-elements.json` exactly, so no longer path reaches the regex. | None. |

## Test quality

- **Red evidence, fix-3.** `red-commits` has `fix-3 b9dc410`. That commit (`test(op-016): phase 1 review round 3 red`) changes only `gates/test/plant-runner.test.ts` and the new `gates/test/integration/fold-history.test.ts`. `red-fix-3.log` and the automatic `check-red-fix-3.log` both show 8 failures out of 3161 tests. Each is an assertion on the missing behaviour:
  - the selection that token, element and `gates/bin/prefix.ts` paths get today;
  - `gateEntryImports` is undefined (`to deeply equal undefined`);
  - the fold leaves the old SHA on `plants.md`'s base line.
  None fails on a setup or load error. The grown pin (T020), the import reader's own test and the two content-only tests pass at once, as T020 and the fix note say.
- **Changed existing tests.** The red commit changes two existing expectations in `affectedPlants (op 016)`: the token paths of "selects the repository-content plants for each repository-content path…" and the `packages/tokens/package.jsonc` near miss. Both now expect `contrast/fail-x` as well. This follows the operator's "Widen by gate" (spec OR-001 class 5). It makes the expectations stricter, not looser, and both failed red.
- **After red.** `git diff b9dc410..HEAD -- gates/test` only adds the O3-02 integration test (gates/test/integration/plants.test.ts:260-284). Nothing was skipped, deleted or loosened.
- **O3-02 without a red commit.** This is correct under fix step 3: it is a missing test for behaviour that already worked. `check-final-tests-on-base.log` shows the test failing against the code from before the phase, on the assertion. The test asserts the whole outcome with `toEqual`: code 2, empty stdout, and one stderr line matched by a regex that leaves only the index path open. It has no conditional. The two records at gates/bin/plants.ts:664 and :666, on `failed` and its `return { cause }`, now name this test, and that is now true.
- **Scenario coverage.** Each scenario has a test that asserts the whole result:
  - scenario 10: the pin for manifest 12, contrast 14 and brand-rules 14 (gates/test/plant-runner.test.ts:1122);
  - scenario 12: line 1029;
  - scenario 13: line 1034, with `packages/tokens/package.json` still giving the full set;
  - the element and token union: line 1040;
  - scenario 14: line 1063;
  - scenario 15: line 1175, which reads every registered gate entry, plus the reader's own test of static, type, side-effect and dynamic imports;
  - scenario 16: gates/test/integration/plants.test.ts:265;
  - scenario 17: gates/test/integration/fold-history.test.ts:19. It checks the new base SHA, the unchanged tree and every line of `plants.md`.
- **Mutation.** I ran `pnpm run gate:mutation -- --base 80ea82594a0d29800fc692a87041dbadabdd20a2` and it exited 0. There were 417 mutants on the changed lines of 3 files, and none survived. The run also reported 1 timeout (R4-02, equivalent) and 120 compile errors. I read the 9 equivalent records:
  - the eight process-boundary records in `realTools.changed` (gates/bin/plants.ts:653-668) each name an integration test that exists and exercises that line;
  - the record at gates/lib/registry.ts:187 is unchanged since round 2, and its reason is true.
- No scaffold commit (`scaffold.sha` absent).

## Checks run

- `tdd-check.json`: `pass`, head `e10f166`, red commits `phase` and `fix-3`, both exit 1, final tests on base exit 1, head exit 0, no problems. The only changes in the rewritten `check-head.log` and `check-red-phase.log` are timing and the test count (3162 in 139 files).
- `pnpm test`: 3162 tests passed in 139 files.
- `gate:typecheck`, `gate:lint` (264 files), `gate:test-lint` (174 files), `gate:config-copies`, `gate:csp`, `gate:prefix`, `gate:pins`, `gate:contrast`, `gate:brand-rules`, `gate:manifest` and `gate:style-lint`: no finding.
- `gate:signoff -- --range 80ea825..HEAD`: 10 commits, no finding.
- `gate:storybook-build`: 21 stories. `gate:visual` (`OCELLE_VISUAL_ENGINE=docker`, because this container has no podman): 42 captures match, with no cross-engine comparison. `gate:axe`: 42 runs, 0 serious or critical, 10 excepted notes.
- **Plants.**
  - `plants.md` has base `80ea825…`, which equals `base.sha`, and its recorded exit is 0.
  - `pnpm run gate:plants -- --affected 80ea825… --list` now gives `note: affected: every plant, by gates/bin/plants.ts (shared gate source)` and `302 of 302 plants selected, none judged (--list)`. This is the same selection as the record (302 of 302 judged, every plant as expected).
- **T018 / OR-007.** `git diff 80ea825..HEAD` leaves untouched: `.github/workflows/ci.yml`, `gates/test/ci-workflow.test.ts`, `gates/lib/plant-repo.ts` and every existing plant directory (the only change under `gates/plants/` is `plants/fail-affected-in-plant-check/`). `plantShards`, `shardSize` and `otherShardSize` are unchanged in the fix commit.
- **Tasks.** T019 to T030 are ticked and their work is present in `e10f166` and `b9dc410`. The commit also touches `.claude/skills/ocelle-run/SKILL.md` (T026) and `tasks.md` (ticks only). Nothing outside the phase changed.
- **Constitution.** This is gate tooling, so it has no element, token, CSS or network change. Principle VIII is met as described under Test quality.
- **README.** The op-016 paragraph is rewrapped, and every line is at most 119 columns (R2-01 closed). The known limit no longer names `gates/bin/prefix.ts`, and the paragraph names `gateEntryImports` and its pin.

## Earlier findings

Round 3 (operator round), against `e10f166`:

- **O3-01, resolved.** Class 5 (gates/lib/plant-runner.ts:419-428) adds every `manifest/*` plant for `elementPath` and every `contrast/*`, `brand-rules/*` and `style-lint/*` plant for a path under `packages/tokens/`. It does so only inside the repository-content branch, so `packages/tokens/package.json` still gives the full set. `repositoryContentPlants` keeps its ten entries. The pin covers all five gates, the JSDoc and README match, and spec and plan were amended in `5d0394f`. Its red test is under `fix-3`.
- **O3-02, resolved.** The integration test exists, it fails on base and passes at head, and both records name it. No red commit is needed, as above.
- **O3-03, resolved.** These are dated amendments (2026-11-15, op 016):
  - specs/006-storybook-workbench/contracts/plants.md:141 (registry plant and rule) and :193 (the `--affected <base> [--list]` mode row, outputs and exit-2 causes);
  - specs/006-storybook-workbench/contracts/gates.md:168 (`affected-in-ci` for the three plant jobs).
  The diff only adds lines.
- **O3-04, resolved.** tooling/speckit/bin/fold-history.sh:106-113 rewrites only the first `- base:` line. The outside-evidence check allows `plants.md` only for that line. The header comment and the remap commit body name it, and so does the ocelle-run fold step. Its red test is under `fix-3`. See R4-01 (note).
- **O3-05, resolved.** `gateEntryImports` lists `{ entry: "prefix", importer: "brand-rules" }` with its reason. Class 3 (gates/lib/plant-runner.ts:413-417) adds the importers' plants. The cross-import pin reads `gates/gates.json` and every `gates/bin/<id>.ts`. Today it finds exactly that pair; the other relative import in `gates/bin` (setup-offline → test) is between files that are not registered gate entries. Its red test is under `fix-3`.
