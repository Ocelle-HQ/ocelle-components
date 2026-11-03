---
round: 1
verdict: changes_requested
base: bdb9b704dceac4ac13e5c46c0e63f67c16d211fc
head: 38d4a5a77bbac57a67233c00a7d1054887d59913
---

# Landing review, round 1 (PR #18, mission 001-repository-foundation)

Second-opinion review of the integrated diff `bdb9b70...38d4a5a` (139 commits, 861 files) as one change landing on
`main`. The phase reviews (`reviews/phase-1` to `phase-5`, all approved, TDD check pass or justified exempt) and the
run summary were used as input. This review looks for what they missed.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L1-01 | blocking | gates/lib/mutation/ranges.ts:55-57 (`path = line.slice("+++ b/".length)`), :34 (`inScope`) | **The mutation gate silently skips a changed file when git quotes its path or adds a tab after it, and still reports a pass.** For a name with a space, git writes `+++ b/<path>\t`. For a name with a non-ASCII or special character, it writes `+++ "b/<escaped path>"`. Either way the sliced path fails `inScope` (it ends in a tab or `"`, or starts with `/`), so the file leaves `changedFiles` without a word. If it was the only change, the gate prints "nothing to mutate" and exits 0. Otherwise its lines are simply not mutated. Reproduced on a scratch repository with `packages/tokens/src/a b.ts`, `packages/tokens/src/é.ts` and `ok.ts` all added: `changedFiles` returned only `ok.ts`. The real `git diff` call in gates/bin/mutation.ts:79 has neither `-c core.quotePath=false` nor `-z`. `--plan` takes its shards from the same parse, so CI skips these files the same way. A gate that skips its input must not report a pass (contracts/gate-cli.md: exit 0 means "the gate checked its files"). The unit tests in gates/test/mutation-ranges.test.ts cover only unquoted `+++ b/` headers. | Red test first, on recorded `git diff --unified=0` output: one header with a trailing tab and one quoted header. Then do one of these: (a) decode git's C-style quoting, strip the trailing tab, and keep the file; or (b) fail closed, with exit 2 naming the header, whenever a `+++` line is neither `+++ b/<path>` nor `+++ /dev/null`. Also decide what happens to a mapped path Stryker cannot take as a `mutate` glob (see L1-02). |
| L1-02 | note | gates/lib/mutation/report.ts:69-71; gates/bin/mutation.ts:189 (`--mutate` joined with `,`) | A changed file that does not appear in Stryker's report counts as zero mutants and passes. In Stryker 10.1.1 (`mutation-test-report-helper.js:175`) the report lists only files that have mutants. So a correct "no mutant on these lines" (for example a type-only change) looks exactly like a file Stryker never instrumented. Two ways to get the second case: a `mutate` entry whose path has glob metacharacters (`[`, `(`, `{`, `*`), or a comma, which splits the `--mutate` list. In CI, `--files` turns a comma into exit 2 (`selectFiles`). The local run without `--files` (the story review) does not. No such path exists in the repository today. | Optional hardening: when every changed file of a run is missing from the report, exit 2 if Stryker logged that it found no file to mutate. Or reject paths with glob metacharacters or commas in `changedFiles` with exit 2. |
| L1-03 | note | gates/bin/csp.ts (file collection); gates/plants/csp/pass-inline-script-in-source/ | The csp gate exits 0 when there is no built output at all ("csp: 0 files checked, no finding", confirmed with `--root` on a tree with no `dist/`). This is by design: the plant `pass-inline-script-in-source` expects it. In CI the gate runs after `pnpm -r build &&`, so a failed build fails the job. But a build that succeeds and writes elsewhere (for example a bundler `outDir` change in a later mission) would make the check vacuous without any signal. | Before the first bundler change, make "no `packages/*/dist` file" exit 2 (it names `pnpm -r build`) and move the source-only pass plant onto a tree that also has a clean `dist/`. Or record a decision that an empty output passes. |
| L1-04 | note | gates/lib/plant-judge.ts:183 (`expect: "error"`); data-model.md § Plant | A breaking plant passes on any exit 2. The judge never checks the cause line, so `mutation/error-unresolvable-base` would also pass if the gate could not run for another reason, such as Stryker or Vitest missing in the temporary repository. The pass and fail plants of the same gate limit the risk, since a gate that always exits 2 fails them. | Let `plant.json` of an `error` plant name a `cause` substring that must appear in stderr, as `message` does for findings. |
| L1-05 | note | gates/lib/plant-judge.ts:107-110; data-model.md § Plant (`base`: "optional, any `expect`") | `base` is allowed on `pass` and `fail` plants. A mutation pass plant with `"base": "HEAD"` would pass vacuously ("nothing to mutate", exit 0). Today only `error-unresolvable-base` uses it. | Allow `base` only on `error` plants, or reject a `pass` plant whose `base` resolves to the temporary repository's head. |
| L1-06 | note | .github/workflows/ci.yml; gates/lib/registry.ts:96-119 | Nothing checks mechanically that a gate job really runs its gate, that an action is pinned by SHA, or that every checkout sets `persist-credentials: false`. The registry check compares job ids only. Every job runs the pull request's own `ci.yml`. The rules are kept today: all five actions are pinned with version comments, the token is `contents: read`, pull-request values reach scripts only through `env:`, and the trigger is `pull_request`, not `pull_request_target`. Enforcement rests on review and CODEOWNERS (`* @MOES-Media`). | Follow-up issue: extend the plant job's registry check to compare each gate job's `run:` with `gates.json` `command`, and to reject `uses:` without a 40-hex SHA and checkouts without `persist-credentials: false`. |
| L1-07 | note | specs/001-repository-foundation/verification.md §1, §3 | The ruleset that requires the twelve checks does not exist yet (`rulesets` returned `[]`), and `@MOES-Media` write access is unconfirmed. Without the ruleset every gate is advisory: a red check, or a pull request that removes a gate from `ci.yml`, `gates.json` and `registry.ts` together, can still be merged (contracts/ci-checks.md:49-52). | Operator: create the ruleset with the twelve check names, plus code-owner review if wanted, before or right at merge. Record it in verification.md §3. |
| L1-08 | note | .claude/skills/ocelle-land/SKILL.md:30-31, :173-176; tooling/speckit/bin/fold-history.sh | The fold keeps the evidence SHAs only on the branch. If the operator squash-merges ("the squash at merge time is the operator's"), `main` gets none of the `base.sha`, `scaffold.sha` or `red-commits` SHAs. After a force-push and branch deletion GitHub stops keeping them, so `tdd-check.sh` and the review files cannot be resolved from `main`. `fold-history.sh` (113 lines that rewrite history) has no test. It checks trees before it resets, but if the remap commit fails, `set -e` leaves HEAD on the folded history with no JSON verdict. This tooling, and `/ocelle-land` (b1b027e, 38d4a5a, cc325e7), came after the last phase review and was reviewed by no phase. | Decide the merge method for mission PRs: a merge commit keeps the evidence, a squash loses it. Record the decision in the skill. Track tests for `fold-history.sh` (scratch repository: kept commits, trees, remap, the failure paths) as an op. |
| L1-09 | note | gates/test/fixtures/pins/pnpm/success.ndjson:3, outdated-lockfile.ndjson:3 | Recorded pnpm output includes the recording machine's store path `/root/.local/share/pnpm/store/v11`. It is not personal data under FR-034 (a generic root path), but it is a machine path in the tree. | Optional: replace it with a neutral path such as `/store/v11`. The gate does not read the value. |

## Test quality

- **Red evidence:** every phase with behaviour has `red-commits` and a TDD check of `pass`. Phase 1 is a justified
  exempt (setup). The phase reviews read the red logs, the scaffold checks and `git diff <red>..HEAD`. This pass
  found no weakened test.
- **Vacuous or weak assertions:** no `.skip`, `.todo`, `toBeDefined()` or `toBeTruthy()` in repository test code
  (`git grep`). The snapshot hits are rule-test inputs of `no-snapshot-only`. Test lint passes on 56 files.
- **Equivalent-mutant records (R-08):** 180 `Stryker disable next-line` records in gate source. Each one that
  names a covering `gates-integration` case was resolved against its file: every named case exists, as
  `describe`-plus-`it` full names in `gates-root.test.ts` and `plant-repo.test.ts`. The ten non-boundary records
  (empty `catch` blocks, the csp tokenizer flag and pre-filters, the plants `stdout: []`) give reasons that hold.
  No record covers a branch that decides a verdict. The `dirs`/`files` `.catch(() => [])` adapters in
  gates/bin/plants.ts end as "missing-plant" problems, so they fail closed.
- **Gap:** git's quoted and tab-suffixed diff headers are untested (L1-01).
- **Mutation:** the full suite was not run, by the brief. `--plan` against `bdb9b70` gives the same shard set as CI.
  CI run 41624961740 on 38d4a5a was taken as given: 18 shards green, longest about 8 to 9 minutes, R4-01 accepted.

## Checks run

PATH=/opt/node26/bin, OCELLE_CHROMIUM_PATH set as instructed, on 38d4a5a:

| Check | Result |
|---|---|
| `pnpm run gate:plants` | exit 0: "136 plants of 11 gates and the registry judged, every plant as expected" (2m45s) |
| `pnpm run gate:config-copies` | exit 0: the two copies are identical |
| `pnpm run gate:pins` | exit 0: 4 manifests, no finding |
| `pnpm run gate:typecheck` | exit 0 |
| `pnpm run gate:test-lint` | exit 0: 56 files |
| `pnpm run gate:prefix` | exit 0: 19 files |
| `pnpm run gate:signoff -- --range bdb9b70..HEAD` | exit 0: 139 commits |
| `pnpm run gate:csp` | exit 0 with `dist/` (3 files); exit 0 with no `dist/` (L1-03) |
| `gate:mutation -- --base bdb9b70 --plan` | one line of JSON, shards as in CI |
| `changedFiles` on a scratch repository (L1-01) | `a b.ts` and `é.ts` dropped, `ok.ts` kept |

**Consistency (lens 2):** the eleven gate ids are one set across `gates/gates.json`, `fr020` in
gates/lib/registry.ts, the gate jobs of ci.yml (plus `plants` and the helper jobs `mutation-plan` and
`mutation-shard`), the gates/README.md table and contracts/ci-checks.md. The check names match the twelve required
names. Plants and fixtures are excluded from tsconfig, both ESLint configs, Stylelint `ignoreFiles` and every
Vitest project (R-10). `vitest.mutation.config.ts` drops `gates-integration` only. The installed skill copies under
`.claude/skills/` match `.specify/extensions/*/.specify-dev/`, and the `.specify/extensions` scripts match
`tooling/speckit/extensions` (only the `.specify-dev` install copies differ).

**CI fail-closed (lens 1):** a failed plan skips the shards, and the verdict fails on `PLAN != success`. A failed,
cancelled or timed-out shard (`timeout-minutes: 10`) makes the matrix result `failure`, so the verdict fails. An
empty or invalid plan output fails the matrix expression. Zero shards pass only with `PLANNED == "[]"`. The
assignment `shards="$(…)"` under the default `bash -e` passes on the gate's exit code. `cli.ts` `entry` maps any
throw, and any code outside 0, 1 and 2, to exit 2. The only fail-open path found is L1-01.

## Verdict

**changes_requested**: one blocking finding (L1-01) and eight notes. Everything else is ready to land on the
evidence: all checks green locally and in CI, plants complete, registry consistent, workflow hardened, records
valid. L1-01 is a small parser fix with a red test. The operator should settle L1-07 (the ruleset) and L1-08 (the
merge method) before merging.
