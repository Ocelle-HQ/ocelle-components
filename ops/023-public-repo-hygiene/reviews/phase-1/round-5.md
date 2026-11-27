---
phase: 1
round: 5
verdict: approved
base: ac12998241af8a86f9a88c043654457e41b14b53
head: f829bcc8627e70ef135291d05333d6697521c104
tdd_check: fail
---

# Phase 1 review, round 5

Scope: the fix round for operator round 4 (`round-4.md`, O4-01 and O4-02; tasks T031 to T038), that is the commits
`a9ffc04` (red, `fix-4`), `75391d1` (O4-01), `3160720` (O4-02), `73c8ba1` (evidence), `98f5bbf` (red/green check) and
`f829bcc` (operator decision), and anything they break. Rounds 1 to 3 are approved and not reopened.

`tdd_check` is `fail` as recorded in `tdd-check.json` (head `73c8ba1`). The operator accepted that result at landing,
with reasons, in `triage/decisions/023-landing-red-green.md` (constitution, development workflow: after three rounds
the operator may accept the phase as it is, recorded). The procedure would otherwise make `fail` blocking; per the
operator decision it is not raised as a finding here. What this round checks instead is what that decision rests on:
that `fix-4` is genuinely red and that the O4-01 and O4-02 fixes resolve the findings with tests that fail without them.
Both hold (below).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R5-01 | note | reviews/phase-1/tdd-check.json (`head`) | The record's head is `73c8ba1`; HEAD is `f829bcc`. The two later commits add only the check's own logs (`98f5bbf`) and `triage/decisions/023-landing-red-green.md` (`f829bcc`), with no test or source change, so the record still describes the code under review. It was not rerun, following the operator decision. | None. |
| R5-02 | note | gates/bin/story-evidence.ts:131-139 (`redact`) | `redact()` runs the script with `stdio: [..., "ignore"]` and replaces any failure with one generic cause, so a run that fails for a reason other than a missing script loses the script's own error line. The behaviour T035 requires (write nothing, exit 2, a `story-evidence:` cause) is met and tested. | None required; consider passing the script's first stderr line into the cause. |
| R5-03 | note | CI on `98f5bbf` | I could not read the check runs myself (GitHub access is denied in this session). The full unit suite, the whole Plants check and the whole Mutation check rest on the orchestrator's statement that CI on `98f5bbf` is fully green, which the operator's landing decision also cites. | None for this review; the landing confirms it. |

No blocking finding.

## Test quality

- **Red evidence of `fix-4` is real.** `red-commits` names `fix-4 a9ffc04`. `a9ffc04` changes only test files (7 files
  under `gates/test/`). In `tdd-check.json` (written by the checker itself, not the implementer), `fix-4` has
  `exit_code: 1`, `evidence.status: "red"` and 14 assertions, each a `toEqual` on a line the red commit changed:
  the O4-01 focused path for both script copies (`story-redaction.test.ts:237`, `:268`, x2), the runner without the
  redaction script (`:319`), `story-entry.test.ts:118` (x2, check and red) and `:132`; O4-02
  (`integration/sandbox-paths.test.ts:108` x3 for `-diff`, `binary`, subdirectory `-diff`; `sandbox-paths.test.ts:58`
  for `attributeFreeOptions`); and the plant counts (`plant-runner.test.ts:756`, `gates-readme.test.ts:222`). Each
  diagnostic is a value mismatch (for example `code: 0` where 1 is expected, `attributeFreeOptions` undefined), not a
  setup error. `red-fix-4.log` holds the same red record.
- **Independent check that the tests need the fixes.** In a scratch worktree of HEAD I restored
  `gates/bin/story-evidence.ts` from `a9ffc04`, `gates/bin/sandbox-paths.ts` from `75391d1` (before O4-02), and
  unexported `attributeFreeOptions`; the four touched O4 test files then gave 12 failures (every new O4-01 and O4-02
  case listed above), 55 passing. The other two of the 14 are the count tests, which fail at `a9ffc04` because the
  plant did not yet exist.
- **Nothing weakened after red.** `git diff a9ffc04..HEAD -- gates/test` is empty. In the red commit, the two count
  tests keep every expected value but the counts (252 to 253, seven to eight plants, `fail-gitattributes-diff` added to
  the list); the amendment only names the actual object (`const dealt`, `const listed`), as the fix note explains. The
  one change to an existing fixture (`test-workflow-evidence.test.ts` `fixture()` copies the redaction script) is
  needed because the runner now requires it, and adds no assertion change.
- **Assertions are observable and can fail.** Each new test is one `toEqual` on exit code, stdout/stderr, written
  files and their placeholder/rule-match summary; no conditional assertion, skip, only, snapshot or mock-only check.
  The focused-path tests run the real `red.sh`/`tdd-check.sh` of both copies with `focused_runner` set and a setup and
  assertion message that carry a store path and a checkout path built at run time; they check `<pnpm store>` and
  `<repo>` appear and no line matches `sandboxPathRule`. The NUL-byte case under `text` keeps true binaries out.
- **Real-world evidence.** The evidence logs and `tdd-check.json` committed in `98f5bbf` were written by the fixed
  runner over this repository, and `gate:sandbox-paths` passes at HEAD over them.
- **Mutation.** `pnpm run gate:mutation -- --base 183b20f --files gates/lib/sandbox-paths.ts,gates/bin/sandbox-paths.ts`:
  exit 0, 196 mutants on the changed lines of 2 files, none survived (8 timeouts, 15 compile errors, 21 equivalent
  records, the round-2 ones). `pnpm run gate:mutation -- --base a9ffc04 --files gates/bin/story-evidence.ts`: exit 0,
  56 mutants, none survived (13 compile errors, 8 equivalent records). The new process-boundary lines carry
  `Stryker disable` records that name the T031 and T032 integration tests, which exist and pass.

## Checks run

At HEAD `f829bcc` unless stated:

- `pnpm run gate:sandbox-paths`: exit 0 (5852 tracked files, 4 allowed files).
- `pnpm run gate:config-copies`, `gate:typecheck`, `gate:lint`, `gate:test-lint`: exit 0 each.
- `diff -r .specify/extensions/story/scripts tooling/speckit/extensions/story/scripts`: no output (T037).
- Focused Vitest (`--project gates --project gates-integration`) on `gates-readme`, `plant-runner`, `sandbox-paths`,
  `story-entry`, `integration/sandbox-paths`, `integration/story-redaction`, `integration/test-workflow-evidence`:
  7 files, 180 tests passed.
- The two scoped mutation runs above.
- Plants: `plants.md` base equals `base.sha` (`ac12998`). `pnpm run gate:plants -- --affected ac12998 --list` prints
  `note: affected: every plant, by gates/bin/plants.ts (shared gate source)`, the same selection as the recorded run.
  The recorded `exit: 1` stands under the round-1 operator decision (`triage/decisions/023-review-round-1.md`), not
  reopened. The round-4 section records the eight `sandbox-paths` plants, `fail-gitattributes-diff` among them, all as
  expected (exit 0). The new plant holds only marker placeholders, and its `plant.json` expects exactly the two
  findings `notes/hidden.log:1` and `notes/hidden.txt:1`.
- Not run here (orchestrator constraint, multi-hour): the full unit suite, the whole Plants check, the whole Mutation
  check. Stated green on CI for `98f5bbf` (R5-03).

Tasks: T031 to T038 are ticked and their work is present: the tests (T031 to T033), red commit and `red-fix-4.log`
(T034), `redact()` in `writeLog` and `emitStoryReport` with the one redaction script and the exit-2 failure path
(T035), `attributeFreeOptions` with `--attr-source=<empty tree>`, `core.attributesFile=/dev/null`, `GIT_ATTR_NOSYSTEM=1`
and `-I` kept, the plant and the updated `gates/README.md`, `ci-checks.md`, `gate-cli.md`, `plants.md` and
`ocelle-land` step 2.9.2 (T036), the copies check (T037), and the evidence and fix note (T038). Nothing outside the
round's scope changed.

## Earlier findings

- **O4-01 (blocking): resolved.** `gates/bin/story-evidence.ts` passes every log written through `tools.writeLog`
  (fresh at the end of `runCheck`, and reused evidence) through `redact()`, which pipes it through
  `tooling/speckit/bin/redact-sandbox-paths.sh` from the repository root. No second copy of the rule exists.
  `emitStoryReport` redacts the serialised JSON once and uses the same text for the file and the printed line. A
  missing or failing script throws before anything is written. `runStoryCommand` sends a failure to write the failure
  record to `failure` (stderr, exit 2) instead of rejecting. The other writes in the runner are the cache and worker
  files under `reports/story-evidence/` and a temporary directory (not evidence), and `red-commits` (labels and shas
  only). Tests: the focused-path cases of `story-redaction.test.ts` for both copies, the no-script case, and the three
  `story-entry.test.ts` cases. All fail without the fix and pass with it.
- **O4-02 (blocking): resolved.** `gates/bin/sandbox-paths.ts` runs `git grep` with `attributeFreeOptions(<empty tree
  from git hash-object -t tree /dev/null>)` and `GIT_ATTR_NOSYSTEM=1`, so no `.gitattributes`, user or system
  attributes file can mark a file binary or `-diff`. `-I` stays, so binary is decided by content (the NUL-byte case
  still exits 0). `grepArgs` and the 0/1/2 contract are unchanged. The new plant `fail-gitattributes-diff` covers it in
  the Plants check. Tests: the three `.gitattributes` cases and the NUL-byte case of `integration/sandbox-paths.test.ts`,
  and the `attributeFreeOptions` unit test. The three exit-1 cases and the unit test fail without the fix.
- **Red commit for the round:** `red-commits` has `fix-4 a9ffc04`, proven red by the checker (above).
