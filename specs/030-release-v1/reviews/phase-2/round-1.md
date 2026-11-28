---
phase: 2
round: 1
verdict: changes_requested
base: 7bf0d39216d4ab83147c90352bec028555a6e1d6
head: de775d26d153da7fe6f6062e9a11bf0aeb420c5a
tdd_check: fail
---

# Phase 2 review, round 1

Change under review: `git diff 7bf0d392..de775d26`. The commits are:

- scaffold `6f1b8234`;
- red `8f5fea78`;
- operator decisions `2f3094be` and `ae455925`;
- green `d86d16f8`;
- plants and T034 `05873d9d`;
- tdd-check output `de775d26`.

The only uncommitted change is the untracked `reviews/phase-2/red-phase.log`, kept that way as in phase 1.

`tdd_check` is `fail`. All three problems in `tdd-check.json` come from one cause: no red commit recorded, so no proven
red assertion to replay on the base or on the scaffold. `reviews/phase-2/operator-red-decision.md` names that cause
(#111) and accepts it, so I judged the red evidence against that decision and checked it myself (see Test quality). The
head run in `tdd-check.json` is green (`head_exit` 0, evidence `green`) on `05873d9d`. `de775d26` adds only the
tdd-check output. There is no `deferred_ci` list.

The verdict is `changes_requested` for two blocking findings, R1-01 and R1-02. The operator-accepted `tdd_check` cause
is not one of them.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | `gates/lib/plant-repo.ts:232-235`, `:250`, `:776-780`; `specs/001-repository-foundation/contracts/plants.md:56-57`; `gates/test/plant-repo-parts.test.ts:195-238` | The green commit adds a fourth `commits.txt` header, `shallow: true`. `parseCommits` reads it and rejects any other value with "shallow must be true", and `buildCommitRepo` writes the record's commit to `.git/shallow`. No test was written red-first for this (Principle VIII, "every behaviour change is test-driven, red first"), and no test exists now. `plant-repo-parts.test.ts` covers `files:`, `delete:` and `secret:` with their rejections but not `shallow:`. No integration test builds a shallow repository. The mutation run confirms this: line 232 (`key === "shallow"` → `false`) survives; lines 234, 235 and 250 are `NoCoverage` (the rejection, its message, `shallow = true`, and the `{ shallow: true }` spread). The two `Stryker disable` records at 776-780 cite the plant `break-shallow`, not a test. The plant only proves the gate's exit 2 on a shallow root, not the header's parse or rejection. The header is also outside every decision on the plant format. research.md R-17 lists only `files:`, `delete:` and `secret:` ("planned explicitly, test-first"). `operator-plant-format-decision.md` accepts two named additions, `args` and `commit:<n>:<path>`, and not this one. Only the spec 001 contract amendment in the green commit mentions it. | Add red-first tests: (a) in `plant-repo-parts.test.ts`, `shallow: true` parses to `{ shallow: true }` and `shallow: <other>` is rejected with `record 1: shallow must be true`; (b) in `integration/plant-repo.test.ts`, a plant with `shallow: true` builds a repository whose `git rev-parse --is-shallow-repository` is `true`, with that record's commit as the boundary. Then, if needed, the green change, and point the two Stryker records at test (b). Have the operator accept the header as a plant-format addition (as for `args`), or have the planner add it to R-17. |
| R1-02 | blocking | `gates/bin/release-readiness.ts` (whole file); `gates/lib/gap-rows.ts:52-226`; `gates/lib/secret-scan.ts:48-261`; `gates/lib/release-readiness.ts:61-125`; `gates/lib/plant-judge.ts:267` | `pnpm run gate:mutation -- --base 7bf0d392` exits 1 with `211 findings in 10 changed files (1439 mutants on changed lines; 103 timeouts, 378 compile errors, 0 zero-mutant entries)`. None of the 211 surviving or uncovered mutants in new code has an equivalent-mutant record. **`gates/bin/release-readiness.ts`:** 100 `NoCoverage`, 0 `Stryker disable` records. The file's header calls it "the process boundary, run by gates/test/integration/release-readiness.test.ts and the plants". Phase 1's `gates/bin/pack-contents.ts` records each such line with the test that covers it (51 records); this file records none. **`gates/lib/secret-scan.ts`:** 51. Among them, `logScanner`'s context-line branch at 141-143 survives as `BlockStatement {}`, `+= 1` and `&&`: no test shows that context lines advance the hunk counters, which is what stops a `+++` content line from being read as a header. The hunk regex survives at 157 (six variants) and at 159 (`?? 1`). The `valueSha256` anchors survive at 199, and the plant-value generator at 226-230. **`gates/lib/gap-rows.ts`:** 42. Among them, the upstream `#<n>` check (91: `every`→`some`, both anchors), the gap-table header regex at 111 (`\s*`→`\s`, anchors), the header-not-found guard at 113, the row-end and `filter(Boolean)` at 115 and 117, and `names` at 126. **`gates/lib/release-readiness.ts`:** 6, including both anchors of the dated-heading regex at 103 (`changelog-undated`) and the Unreleased guard at 107. **`gates/lib/plant-judge.ts:267`:** 2. The `[hash]`→`[]` mutant there is equivalent through the destructuring default. The anchor-drop mutant is not. tasks.md's CI-first rule leaves mutation to CI's required Mutation testing check. This local run on the same diff shows that check cannot pass as the code stands. The 103 timeouts may come from memory pressure in this session, and I do not count them. Survived and NoCoverage results do not come from that pressure. | For each surviving mutant, either kill it with a test that fails first (a `fix-1` red commit; Principle VIII "fixes are test-first too"), or record it as an equivalent mutant with its reason. Give the process-boundary lines of `gates/bin/release-readiness.ts` `Stryker disable` records that name the integration test or plant covering each line, in the repository's style. Then CI's Mutation testing check decides. |
| R1-03 | note | `gates/test/integration/plant-repo.test.ts:544-563` | The green commit replaces the red test "keeps the empty base for a plant built without the repository ...". **Justified:** as written in the red commit, it could not pass at the same time as the red test "fails to build a record that deletes a path the tree does not hold". The readiness fixture's second record deletes `gates/release/pack-manifest.json`, and an empty base does not hold that file. The reason is in the test comment, the green commit body and `replaced-tests.md`. **Stricter:** only just. The replacement keeps every tree assertion (base `[]`, the two record trees), runs on a copy that differs by that one header, and adds a guard that the copy lacks it. Nothing was loosened. But it is "equal plus a guard", not stricter about behaviour. | Optional: also assert that building the unmodified fixture without the repository rejects with `record 2: delete gates/release/pack-manifest.json: the tree holds no such path`. That would make the replacement strictly stronger. |
| R1-04 | note | `packages/*/CHANGELOG.md:8` | `## 1.0.0 - 2026-11-28` is dated before the release on purpose, as everything that governs the release expects. FR-005 requires a dated `1.0.0` entry now. R-09 and FR-013 require the heading `## <version> - <YYYY-MM-DD>` for the gate to report ready. T031 sets the date to "today", which is the green commit's date. The spec (Clarifications, PLAN-FRESH-1-007 (b)), FR-043, R-09 ("The entry's date is not compared with the tag") and R-15 all leave the final date to the pre-tag pull request, which the operator confirms. The entry's lead ("published to the public npm registry with provenance") describes the release before it has happened, which suits a release entry. | None now. The R-15 procedure (US5) must keep the re-dating step. |
| R1-05 | note | `specs/030-release-v1/reviews/phase-2/red-phase.log` (untracked) | The log is redacted (no sandbox path). It records only `red.sh`'s first rejection, not the 407 changed-line failures. As in phase 1, it stays uncommitted. The caller asked for no commit this round. | The operator decides whether to commit it later. |

Two blocking findings, three notes.

## Test quality

- **Red commit is tests-only.** Every one of the 29 paths in `8f5fea78` is under `gates/test/`, `packages/*/test/` or
  `specs/030-release-v1/`. That includes the fixtures `gates/test/fixtures/plant-repo/readiness-plant/*` and
  `gates/test/fixtures/registry/{ci.yml,gates.json}`. No source file is touched.
- **Failures are for the right reason.** I reran the red commit's unit-level files in a temporary worktree of
  `8f5fea78`, then removed the worktree. The projects were gates, tokens, styles and elements-node, and the files were
  release-readiness, plant-repo-parts, plant-judge, ci-workflow, registry, registry-parts, gates-readme, plant-runner
  and the four package changelog tests. Result: 390 of 1878 tests fail, every one an `AssertionError`. By file:
  elements readme 198, release-readiness 129, elements changelog 16, plant-repo-parts 11, registry 10, styles readme
  9, plant-judge 6, tokens readme 3, ci-workflow 3, gates-readme 2, plant-runner 2, registry-parts 1. None is an
  import, setup or type error. They fail against the scaffold's stubs, the missing `1.0.0` changelog sections, the
  missing registry, job and README entries, and the missing `args` and `commit:<n>:<path>` handling.
  - I could not rerun the gates-integration files against the red commit: the session's permission rule denied it,
    and the caller limited local runs to the fast gates. Their failure on the red commit follows from the scaffold.
    `buildCommitRepo` ignores the new headers, `hasConfigurationBase` returns `false`, and the CLI exits 2 "not
    implemented". `red-phase.log` and the operator's decision account for the 123 shared-data failures.
- **Scaffold** (`6f1b8234`) holds signatures and neutral stubs only. The verdict is "not implemented" (exit 2), the
  lists are empty and `hasConfigurationBase` is `false`. It adds no test file, and the final tests fail against it
  (`final_tests_on_scaffold_exit` 2).
- **Green edits one test.** `git diff 8f5fea78..HEAD` over `test_pathspec` touches only
  `gates/test/integration/plant-repo.test.ts` (+8 −1), the replacement of R1-03. `replaced-tests.md` and the commit
  body justify it.
- **Red-commit replacements** of the changelog, registry, README, ci-workflow, observer and plant-count tests are
  listed in `replaced-tests.md`, each with a comment naming 030 and the reason:
  - each reads the `## 1.0.0 - <YYYY-MM-DD>` section, which must exist in that form, with the same statements;
  - the tokens test keeps the full-name rule over the 1.0.0 entry and Unreleased together, and adds the heading-order
    case;
  - the count tests move by exactly the new gate and its plants.

  None is weakened.
- **No vacuous assertions.** `gate:test-lint` passes. The two history tests in `integration/release-readiness.test.ts`
  first assert a non-shallow clone and that `183b20f` resolves, and fail, never skip, otherwise.
- **Scenario coverage.** Story 2's scenarios 1 to 5 and T022's rule list each have tests:
  - every evidence kind, met and unmet;
  - a spec-only row;
  - the mismatch kinds;
  - one test per R-08 rule;
  - the non-hits;
  - the allow-list rules;
  - the version and tag rules;
  - the changelog rules;
  - the summaries;
  - the exit-2 causes.

  The two gaps are the `shallow:` header (R1-01) and the mutants of R1-02. The phase has no element, event or keyboard
  path.
- **Mutation:** blocking, see R1-02. The equivalent-mutant records in the changed code are the 19 `Stryker disable`
  records of `buildCommitRepo` and the one of `gates/bin/plants.ts:589`. I read each one:
  - the 17 that name a `plant-repo` integration test are valid process-boundary records;
  - the two that name `break-shallow` (776-780) name a plant, not a test (R1-01).

### Points the caller asked about

1. **Plant-repo replacement:** justified, not weaker, stricter only by a guard (R1-03, note).
2. **`shallow: true`:** blocking (R1-01).
3. **Changelog date:** expected (R1-04, note).
4. **Secret scan:** no finding.
   - `pnpm run gate:release-readiness` on the branch reports `0 secrets` over the whole history reachable from HEAD,
     including every file of this phase.
   - The unit tests build values from fragments (`["np", "m_"].join("")`, `part(...)` in `plantedSecret`).
   - The plants hold only `secret:` headers.
   - `pass-env-variable` and `pass-npmrc-variable` hold `${...}` forms only.
   - A finding's message is the fixed text "`<rule>: an added line matches this rule; the matched text is not
     printed`" at `<commit>:<path>`. `LineHit` carries only the SHA-256.
   - The allow list is keyed by `path`, `rule` and `valueSha256`, with no commit in the key. An entry with an empty
     reason allows nothing and is reported. `pass-allowlisted` keys by `valueSha256`.
5. **Gap rows:** 17 rows, and `upstream`, `need` and `metIn` match `sources/issue-1-gap-table.md` verbatim and in
   order. I checked this with a script; the source file is unchanged since base. No row rests on spec items alone.
   - Against the inputs of `183b20f`, extracted by `git archive` and run through `readGapInputs` and
     `gapRowFindings`: `met 14`, `gap-row-unmet` for rows 6, 10 and 15. They are missing `ocelle-status-indicator`,
     `ocelle-metric` and `ocelle-pill-tag` with their members, and `018-status-elements`.
6. **Registry plants:** all eight dirs of `gates/plants/plants/*` gain the `release-readiness` entry in `gates.json` and
   the job in `ci.yml`. The job is the same as the real one (`fetch-depth: 0`, `persist-credentials: false`). The
   recorded run lists all eight as judged.

- **ci.yml re-pin (#112):** the diff `0b807c71..c7cf3b06` is only the intended changes:
  - the header's "twenty-one";
  - `fetch-depth: 0` (with a comment) on the `unit-tests-shard` and `unit-tests-full` checkouts;
  - the new `release-readiness` job.

  `git rev-parse HEAD:.github/workflows/ci.yml` is `c7cf3b06a173...`, the blob pinned in
  `tooling/speckit/bin/evidence-reuse-observe.ts:413`.
- **No sandbox path** in any new file: `gate:sandbox-paths` checked 7105 tracked files and found none. The
  `/tmp/ocelle-plant-…` strings in `plant-runner.test.ts` follow the file's existing synthetic pattern, 22 of them at
  base.

## Checks run

Run locally on `de775d26`, per tasks.md's CI-first rule (fast gates, the phase's own gate, plants `--list`):

| Check | Result |
|---|---|
| `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:csp`, `gate:prefix`, `gate:config-copies`, `gate:pins`, `gate:contrast`, `gate:brand-rules`, `gate:manifest`, `gate:sandbox-paths` | exit 0 each |
| `gate:signoff -- --range 7bf0d392..HEAD` | exit 0, "7 commits checked, no finding" |
| `gate:release-readiness` | exit 0, `ready (17/17 rows, 0 secrets, version 1.0.0)`; the clone is not shallow |
| vitest, gates, tokens, styles and elements-node projects, nine phase test files at HEAD | 522 passed |
| `gate:plants -- --affected 7bf0d392... --list` | `note: affected: every plant, by gates/bin/evidence-reuse-shadow.ts (shared gate source)`, 375 of 375 selected |
| `gate:mutation -- --base 7bf0d392...` | **exit 1, 211 findings** (R1-02) |

- **Plants record.** `plants.md` records base `7bf0d392...`, the same `note: affected:` line and exit 2. 329 plants
  were judged with no problem line, and 46 visual plants were not run for want of a container engine. That exit is
  accepted by `reviews/phase-0/operator-plants-decision.md`, and CI's Plants check decides. All 31
  `release-readiness` plants, every T032 name, are in the record and in `gates/plants/release-readiness/`.
- **Not run locally:** the gates-integration suite (denied by this session's permission rule, see above), the full
  unit suite, visual, axe and the full plant job. CI's required checks decide them on the candidate. Under the
  caller's instruction I did not consult GitHub, so no CI run is cited here.

## Earlier findings

None: this is round 1.
