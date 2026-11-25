---
phase: landing
round: 1
verdict: changes_requested
base: 183b20f9148e6fa0a402b23e367328f6a8683f97
head: b2bba57db9348d1df60cb03138184f56f3e17bae
tdd_check: pass
---

# Landing review, round 1

PR #80, op 023 (`ops/023-public-repo-hygiene`, closes #60), branch `claude/060-public-repo-hygiene`. I reviewed the
integrated diff `origin/main...HEAD`. The merge-base is `183b20f`, which equals `origin/main`. Main was merged in at
`79b82aa`, and the landing redaction is `b2bba57`. There are 519 files: 408 are one-line placeholder substitutions,
and 111 are the gate, the script, the plants, the tests, the records and the skill text. The story reviews
(`reviews/phase-1/round-1..3.md`) and the operator decisions (`triage/decisions/023-*.md`) were input only. I re-checked
every claim below myself.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L1-01 | blocking | `tooling/speckit/extensions/story/scripts/red.sh:15-18`, `tdd-check.sh:17-20` (both copies); `.specify/extensions/story/story-config.yml:14`; `gates/bin/story-evidence.ts:217-219,323,368` | **On the merged tree, the story scripts' write-time redaction (FR-007, SC-003, scenario 6) is bypassed.** Main's op 025 (#78, `ddecd13`) added `focused_runner: "gates/bin/story-evidence.ts"`. When it is set, `red.sh` and `tdd-check.sh` `exec node gates/bin/story-evidence.ts …` before `story_run_tests_at` or `emit` is reached. Those are the only two places op 023 pipes output through `redact-sandbox-paths.sh`. `story-evidence.ts` writes `red-*.log`, `check-*.log` and `tdd-check.json` itself (`tools.writeLog`, `emitStoryReport`). Its only cleaning is `safeLog`, which replaces the worktree path and the repository root, but not pnpm's store or any other home path. Reproduction in this sandbox: `pnpm store path` prints the root home's `.local/share/pnpm/store/v11`. A `pnpm install --offline --frozen-lockfile` in a fresh worktree of HEAD, which is the setup output the runner writes at the top of every log (see `specs/019-data-records/reviews/phase-1/check-head.log:1-5`), prints `Content-addressable store is at: ` followed by that path. That line matches FR-001. So the next story phase run here commits logs that the `Sandbox paths` gate rejects. Its phase commits also reach the public PR branch before CI and the landing step can catch them. Neither side broke this alone: the op branch had no focused runner, and its test, `gates/test/integration/story-redaction.test.ts:18`, uses a `story-config.yml` without `focused_runner`. So the tests pass while the configured path is unredacted. `story_require_redactor` still runs before the `exec` (`red.sh:11`, `tdd-check.sh:14`). That makes the missing script an exit 2 but redacts nothing on this path. | Redact on the focused path too. Make every log and record that `story-evidence.ts` writes and prints pass through `tooling/speckit/bin/redact-sandbox-paths.sh`, or through a port that a test proves agrees with it on the rule table. Do this test-first: a red test that runs `red.sh` and `tdd-check.sh` with `focused_runner` set (or `story-evidence.ts` directly), with a setup or test output that holds a store path and a checkout path, and asserts that the written logs and `tdd-check.json` hold the placeholders and no line that matches the rule. This is an operator round on phase 1 (landing rule 9), or on a phase 2 if the operator prefers that. |
| L1-02 | note | `gates/lib/sandbox-paths.ts:33` (`-I`); `.claude/skills/ocelle-land/SKILL.md` step 9.2 (`git grep -lIzE`) | **The binary skip is wider than "the four allowed files".** `git grep -I` treats as binary any file with a NUL byte near its start, and also any path that a `.gitattributes` marks `binary` or `-diff`. In a scratch repository, a tracked log with a sandbox path gave exit 1. After one committed line `*.log -diff` in `.gitattributes`, the same tree gave exit 0, and so did a log with a leading NUL byte. The repository has no `.gitattributes` today, and FR-002 and scenario 2 choose "binary files skipped", so this meets the spec. But a plausible future change (hiding noisy evidence-log diffs with `-diff`) would silently exempt every review log from the gate and from the landing step's file list. FR-003 says that only a reviewed code change can widen the exemption. | A follow-up issue, offered to the operator. Options: refuse a tracked `.gitattributes` line that sets `binary`, `-diff` or `-text` on a non-binary extension, or scan with `--attr-source` set to an empty tree (git 2.40+) so that only content decides what is binary. |
| L1-03 | note | `tooling/speckit/bin/redact-sandbox-paths.sh:175-176` | **The `<home>/` substitution can cascade.** It loops until no match is left, so a sandbox path right after another prefix loses bytes that are not part of the prefix. A user-home path whose first segment is `root`, and a root-home path whose first segment is `root`, both become `<home><home>/x`. The inner `root` is consumed, because the first pass leaves `<home>/` followed by `root/x`, which matches the rule again after the `>`. This goes against FR-006's "no other byte changes" as written. But it follows from FR-001: the gate would reject the one-step output. `--verify` stays sound, because it compares against the same program. No such path exists in the tree. | None required. If convenient, record the case in the script's header comment or in FR-006's edge cases. |
| L1-04 | note | `gates/lib/sandbox-paths.ts:15` (the rule) | **The rule does not catch JSON-escaped slashes.** a path whose slashes a JSON encoder escaped as backslash-slash does not match the rule, so neither the gate nor the redaction catches it. This is the same kind of known gap as the ANSI case in the spec's edge cases. Node's and Stryker's JSON do not escape `/`, and the tree holds none. | None. Worth one line under the spec's edge cases when the rule is next touched. |
| L1-05 | note | `e7eb346d` (folded); `ops/023-public-repo-hygiene/reviews/phase-1/redaction.md:3` | **FR-008's "a commit of its own" survives only in the archive.** The phase-1 history fold folded the one-time redaction commit `e77f5bf` into `e7eb346d`, together with the gate code (its body lists it). So on the PR branch the 407-file redaction can no longer be checked with `--verify` on its own. The pre-fold commit is kept: `git branch -r --contains e77f5bf` names `origin/archive/claude/060-public-repo-hygiene-prefold-phase-1`, and `redact-sandbox-paths.sh --verify e77f5bf` exits 0 (`407 files changed, each only by the redaction`). | None. Name the archive branch and the `e77f5bf` verify result in the PR body as the FR-008 and SC-004 evidence. |
| L1-06 | note | `.claude/skills/ocelle-land/SKILL.md` rule 8 | **Rule 8 over the whole PR diff has false hits.** It flags added lines in the one-line `specs/007-mutation-gate-strictness/evidence/**/mutation.json` files. Those files show up as added lines because the whole JSON is a single line that the redaction touched. The hits are pre-existing fixture strings (a one-letter user's home under `/home`, and a `HOME` value of the same kind), which are not sandbox paths and appear on `main` too. Step 9.5's rule-8 reading over the added lines of `b2bba57` prints nothing. | None. FYI for the deliverable-hygiene pass. |

## Correctness, fail-closed behaviour and the exit contracts

- **`sandbox-paths` gate.**
  - **Exit 0, 1 and 2 at the process boundary.** I built each of the seven plants with `buildTrackedTree` and ran the
    gate on it. `error-no-tracked-file` exits 2 with the cause `no tracked file`. The three `fail-*` plants exit 1 with
    exactly their recorded `path:line` findings, and no finding echoes the line. The three `pass-*` plants exit 0.
    `pnpm run gate:sandbox-paths` on HEAD exits 0: 5838 tracked files and the 4 allowed files.
  - **Exit 2 cases.** A git grep exit other than 0 or 1 (including a signal), a match with no parsable record, a
    failing `ls-files`, a root that is not the work-tree top (`realpath` compare) and an empty index are all exit 2
    with a cause (`gates/lib/sandbox-paths.ts:70-85`, `gates/bin/sandbox-paths.ts:102-139`). A malformed record
    throws, and `main` maps that to exit 2.
  - **Parse.** The `-z` parse also handles paths with a colon and a space. `core.quotePath=false` makes no
    difference under `-z`.
- **`redact-sandbox-paths.sh`, all three modes.** I exercised each mode in a scratch repository.
  - **Stdin mode.** It redacts and keeps every line. A stray argument gives exit 2 with the usage line.
  - **`--in-place` mode.** With no file it gives exit 2 with the usage line. A missing file gives exit 2 from GNU sed.
  - **`--verify`, exit 0.** A commit made by `--in-place` passes, given either as one revision or as a range.
  - **`--verify`, exit 1.** Each of these gives one line per file: another word changed, a mode change, an added
    file, a symlink replaced by a file (reported as `mode changed`), and a partial or wrong redaction.
  - **`--verify`, exit 2.** Each of these gives a cause: a root commit, an empty range, a revision that does not
    resolve, no argument, two arguments, and a cwd outside git.
- **Can `--verify` be fooled?** I found no way.
  - The new blob must equal the script's own program run over the old blob, byte for byte.
  - A failing `git cat-file` in either process substitution yields a `cmp` mismatch, so the result is exit 1, not a
    pass. Both sides failing at once would need missing objects for a path that `diff --raw` just listed.
  - A range compares trees only, as FR-011 defines.
  - The landing commit `b2bba57` passes `--verify HEAD` (`1 files changed, each only by the redaction`).
- **Does the rule keep sandbox paths out?** Yes for the defined rule, with the gaps of L1-02 and L1-04. The gate scans
  the work tree of the CI checkout, `gates/plants/` and `gates/test/fixtures/` included. The landing step uses the same
  pathspecs and the same `-I`, so its file list and the gate agree.

## Overlap with existing gates

There is no overlap. No other CI gate scans tracked content for home paths. Landing rule 8 is a manual check over
staged diffs, it has a broader pattern (`/home/[a-z]`), and the op leaves it unchanged apart from how it is read for
step 2.9. The `contracts/gate-cli.md` exception, under which the gate reads `gates/plants/` and `gates/test/fixtures/`
in normal mode, is recorded there and in spec 001. It is needed: the gate's job is the whole tracked tree.

## Design lens on the new seams

- **The `tracked-tree` plant form** (`gates/lib/plant-repo.ts:659-709`). It is a minimal, well-bounded builder: it
  copies `tree/` with the markers expanded, copies no configuration and links no `node_modules`, and an empty tree
  gives a repository with no tracked file. The markers keep every plant file clean, and the gate over the repository
  proves that. The form is registered in `PlantForm`, in `forms`, in the error text, in `plants.ts` and in
  `contracts/plants.md`.
- **Redaction in the shared `common.sh`.** The two copies are byte-identical (`cmp`), and `config-copies` passes.
  Redaction happens in `story_run_tests_at` through a pipe, and `code=${PIPESTATUS[0]}` keeps the test's exit code. The
  seam has one weakness: it covers only the shell path, and since op 025 the configured path is the TypeScript runner
  (L1-01).
- **Landing step 2.9.** It is well ordered: after the fold and after the last merge, and before the push. It is
  skipped when the script is missing or the gate is green. It commits only the redacted files and is proved by
  `--verify HEAD` and the gate. It stops rather than hand-editing a file.
- **The `ocelle-run` rule 6 exception.** It is narrow: it names only step 2.9 and its proof. The orchestrator's merge
  commit `79b82aa` and `b2bba57` follow the step. `b2bba57` is signed off, cites the decision and changes one file.

## The merge's conflict resolutions

- **`knowledge/speckit-flows/runs/index.md`.** Correct. Main's entries (014, 015, 019, 020, 026, 027, op-022) and the
  op's `op-023` entry are all kept, in sorted order. Compared with each parent, the only additions are the other side's
  lines.
- **`gates/test/plant-runner.test.ts`.** Correct. The count is `others: 252`. That is main's 245 plus op 023's seven
  `sandbox-paths` plants, and it matches the branch's own 251, which was 244 plus 7. The `tracked-tree` builder entry
  is kept from the op side. `gate:plants -- --affected HEAD` reports 325 plants in all (48 visual + 25 axe + 252), and
  the test passes.
- **`tdd-check.sh`** merged automatically. The result keeps both `story_require_redactor` and main's focused-runner
  branch, which is the integration that causes L1-01.

## Completeness baselines

`sandbox-paths` is present in each of these places:

- `gates/gates.json`: 18 entries, the last one `sandbox-paths`, with plant form `tracked-tree`.
- `fr020` in `gates/lib/registry.ts`: 18 entries, and the header comment says "nineteen checks".
- `.github/workflows/ci.yml`: job `sandbox-paths`, named `Sandbox paths`, with a pinned checkout,
  `persist-credentials: false` and the shared setup.
- `package.json`: `gate:sandbox-paths`.
- `gates/README.md`: the gate's row, and number 18 of nineteen in the required checks list.
- `specs/001-repository-foundation/contracts/ci-checks.md`: the row, "eighteen in all", nineteen required checks and a
  dated note.
- `contracts/gate-cli.md` and `contracts/plants.md`.

After op 025, the counts still line up. Op 025 added unit-test helper jobs (`unit-tests-plan`, `unit-tests-shard`,
`unit-tests-full`) and no gate, so there are still eighteen gate ids and nineteen required check names. The unit-test
shard plan is built at run time from the discovered test files (`gates/bin/test-shards.ts plan`), so the four new test
files need no wiring. `registry.test.ts`, `governance.test.ts`, `gates-readme.test.ts` and `ci-workflow.test.ts` pass
on the merged tree. The ruleset on `main` must add `Sandbox paths` after the merge. That is an operator action, and the
records say so.

## Test quality

- **Red evidence.** `tdd-check.json` is `pass` with `problems: []`. There are four red commits: `phase` `06a2bca`,
  `fix-0` `13b8f8b`, `fix-1` `0e92460` and `fix-2` `cd7d37a`. Each has exit 1, and their SHAs are the post-fold ones in
  `history-map.txt`. The final tests exit 2 on the base and 1 on the scaffold, and the head is green at 8729 tests. The
  phase reviews read the red reasons, and I did not re-litigate them.
- **No weakening.** Since main, the existing tests change only in aggregate counts (plants 53→56, 17→18 gates,
  34→36 registry problems, 245→252) and in strictly stronger assertions. The `SECURITY.md` test now asserts the exact
  channel sentence and the absence of four phrases, instead of two `toContain` checks. The merge added no test change
  beyond the count. There is no `skip` or `only`, and `gate:test-lint` is clean.
- **Vacuity.** Every new test makes one unconditional `toEqual` on observable output: exit code, findings, file
  contents, or the stdout summary. The integration tests build sandbox paths at run time, so no test file trips the
  gate.
- **Gaps.**
  - `story-redaction.test.ts` covers only the unconfigured shell path (L1-01).
  - `--verify`'s exit 2 on a git failure (cwd outside git) has no test. I checked it by hand: it exits 2 with git's
    first line. This is a note and does not block.
- **Mutation and equivalent records.** The op's source (`gates/lib/sandbox-paths.ts`, `gates/bin/sandbox-paths.ts`, and
  the op's parts of `gates/lib/plant-repo.ts`, `gates/lib/registry.ts` and `gates/bin/plants.ts`) is byte-identical to
  what the round-3 scoped mutation run covered: `git diff a773db1 HEAD` over those files is empty, and main changed none
  of them. That run had no survivor. So I did not rerun mutation.
  - **`gates/lib/sandbox-paths.ts:46`.** This is the only ArithmeticOperator equivalent record, and I re-checked its
    reason. Line 44 has already proved that `stdout[lineEnd-1]` is a digit and `stdout[lineEnd]` a NUL, so the
    newline search from either side finds the same newline. The reason holds.
  - **The `process boundary` records.** Every one cites a gates-integration test that exists (describe plus it name
    checked).
  - **R-08.** The records stay within it: the boundary lines are each covered by a named integration test.

## Checks run

Locally on HEAD `b2bba57`:

- `pnpm run gate:typecheck`: exit 0.
- `pnpm run gate:lint`: exit 0, 686 files.
- `pnpm run gate:test-lint`: exit 0, 522 files.
- `pnpm run gate:config-copies`: exit 0.
- `pnpm run gate:signoff -- --range origin/main..HEAD`: exit 0, 19 commits.
- `pnpm run gate:sandbox-paths`: exit 0, 5838 tracked files.
- `redact-sandbox-paths.sh --verify HEAD`: exit 0. `--verify e77f5bf`: exit 0, 407 files.
- `vitest run` over 14 files: `sandbox-paths` (unit and integration), `redact-sandbox-paths`, `story-redaction`,
  `plant-repo` (unit and integration), `plant-runner`, `registry`, `registry-parts`, `governance`, `gates-readme`,
  `ci-workflow`, `plants` and `plants-job`. All 490 tests passed. `gates/test/integration/plants.test.ts`: 6 passed.
- The seven `sandbox-paths` plants, built and run by hand: all seven as expected.
- `gate:plants -- --affected HEAD`: exit 0, 325 plants.
- Scratch probes of the redaction, `--verify` and the gate, described above.

Not run, under the operator's rule against long runs: the whole unit suite, the full plant run (visual and axe), and
Mutation testing.

**Depends on CI for `b2bba57`, which I cannot read.** The following conclusions rest on CI being green on that head:
`Unit tests` (all shards, including main's new tests on the merged tree), `Plants` (including
`visual/fail-pointer-target-below-fold`, which the operator decision of round 1 hands to CI), `Mutation testing`,
`Sandbox paths` on the runner, `Visual regression` and `Accessibility`. None of them changes L1-01, which is a defect
on a path that CI does not run.

## Earlier findings

This is the first landing round. Phase 1's story rounds ended approved at round 3. Their blocking findings, R1-01 and
R1-02 (by operator decision) and R2-01, are resolved as round 3 records. Nothing in the merge reopens them.
