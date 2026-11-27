---
phase: landing
round: 2
verdict: approved
base: 183b20f9148e6fa0a402b23e367328f6a8683f97
head: ac5bebc6d718a54a69ae6d5e6b81db4bdd4e3cfa
tdd_check: fail
---

# Landing review, round 2

PR #80, op 023 (`ops/023-public-repo-hygiene`, closes #60), branch `claude/060-public-repo-hygiene`. The integrated
diff is `origin/main...HEAD`. The merge-base is still `183b20f`, which equals `origin/main`.

Scope (operator stop rule, 2026-11-03): this round checks only that the blocking findings of landing round 1 are
resolved and that the folds regressed nothing. It does not search afresh. Round 1 had L1-01 (blocking) and L1-02 (a
note that the operator folded). Both were folded as operator round 4 (`reviews/phase-1/round-4.md`, O4-01 and O4-02)
and fixed in fix round 4: red `a9ffc04`, fixes `75391d1` (O4-01) and `3160720` (O4-02), evidence `73c8ba1`, fix note
`round-4-fixes.md`. The later commits are `98f5bbf` (red/green check logs), `f829bcc` (operator decision) and
`ac5bebc` (phase 1 review round 5, approved). Phase 1 round 5 and the `023-*` operator decisions were input only. I
re-checked every claim below myself.

`tdd_check` is `fail` in `reviews/phase-1/tdd-check.json` (head `73c8ba1`). The operator accepted that at landing, with
reasons, in `triage/decisions/023-landing-red-green.md`: the three failing reasons come from running op 025's checker
over pre-merge history, not from op 023's code. Per that decision, it is not raised as a finding here. What the
decision rests on holds: `fix-4` (`a9ffc04`) changes only test files, and the record shows it red with exit 1 and
assertions on changed lines.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L2-01 | note | `gates/bin/sandbox-paths.ts` (the `git grep` options); `gates/README.md` and `contracts/gate-cli.md` (the wording "no attribute from any `.gitattributes`, the user or the system") | **A repository-local `$GIT_DIR/info/attributes` still exempts a file.** `--attr-source`, `core.attributesFile=/dev/null` and `GIT_ATTR_NOSYSTEM=1` shut out the tracked `.gitattributes` files, the user file and the system file, but git still reads `info/attributes`. Reproduction in a scratch repository: a tracked `notes/a.log` and `notes/b.txt`, each with a sandbox path. With `*.log binary` in `.git/info/attributes`, the gate reports only `notes/b.txt:2` (exit 1, one finding instead of two). The file is not tracked, so no reviewed or unreviewed commit can set it, and CI's fresh checkout has none. FR-003 ("only a reviewed code change can widen the exemption") and O4-02 (a committed `.gitattributes`) are therefore met. The only exposure is a local run, for example landing step 2.9 on a machine with such a file, and CI's `Sandbox paths` check still catches what it misses. | None for this PR. A follow-up issue candidate: also neutralise `info/attributes` (for example, run git with a temporary `GIT_DIR`-independent attribute setup, or check that the file is absent), or narrow the documents' wording to "no tracked, user or system attributes file". |
| L2-02 | note | `gates/plants/sandbox-paths/fail-gitattributes-diff/tree/.gitattributes` | **The plant's `.gitattributes` also applies inside this repository.** It is a tracked file under `tree/`, so git in this repository treats `tree/notes/hidden.log` as `-diff` and `tree/notes/hidden.txt` as binary. `git diff --stat` shows them as `Bin 0 -> 82 bytes` and `Bin 0 -> 47 bytes`, so a reviewer of a later change to them sees no text diff. The gate is not affected: it ignores the attribute, and the two files hold only markers (`gate:sandbox-paths` exits 0 on HEAD). | None. If convenient, a later change can review those two files with `git diff --text`, or note this in the plant's `why`. |

No blocking finding.

## Round 1 findings

- **L1-01 (blocking): resolved.**
  - **The fix.** `gates/bin/story-evidence.ts` now has `redact()`, which runs `tooling/speckit/bin/redact-sandbox-paths.sh`
    from the repository root, stdin to stdout. It is the same script the shell path uses, so there is still one copy
    of the rule. `checkTools.writeLog` writes `redact(log)`, and that covers both fresh logs (`runCheck`) and reused
    evidence, which passes through `tools.writeLog` too. `emitStoryReport` redacts the serialised JSON once and uses
    that text both for `tdd-check.json` and for the printed line.
  - **Fail-closed behaviour.** A missing or failing script throws before anything is written. `runStoryCommand` now
    sends a failure to write the failure record to `tools.failure`, so the command exits 2 with a `story-evidence:`
    cause instead of rejecting.
  - **No other evidence write is left unredacted.** The remaining `writeJson` calls write the worker's selection and
    result files in a temporary directory, and the cache under `reports/story-evidence/`, which `.gitignore` excludes.
  - **Both configs still use the focused path.** `focused_runner: "gates/bin/story-evidence.ts"` is set in both
    `story-config.yml` copies, the two `scripts/` directories are identical (`diff -r` prints nothing), and
    `gate:config-copies` passes.
  - **The reproduction of round 1 is now a test, and it passes.** `gates/test/integration/story-redaction.test.ts`
    ("the story scripts of %s with the focused runner set", for both copies) does what round 1 asked for. It sets
    `focused_runner`. Its setup command prints `Content-addressable store is at:` followed by a store path, and a
    checkout path. A red assertion names both paths. It then runs the real `red.sh 1 fix-4` and `tdd-check.sh 1`. The
    test asserts that `red-fix-4.log`, the three failing check logs, `check-head.log`, `tdd-check.json` and stdout
    hold `<pnpm store>` and `<repo>` and no line that matches the rule. The no-script case asserts exit 2 and that
    nothing is written.
  - **The tests need the fix.** Round 5 restored the pre-fix runner and saw these cases fail. `git diff a9ffc04..HEAD
    -- gates/test` is empty, so the tests did not change after red.
- **L1-02 (note, folded as O4-02): resolved.**
  - **The fix.** `gates/bin/sandbox-paths.ts` runs `git -C <root> -c core.quotePath=false -c
    core.attributesFile=/dev/null --attr-source=<empty tree> grep …` with `GIT_ATTR_NOSYSTEM=1`. The empty tree comes
    from `git hash-object -t tree /dev/null`.
  - **Behaviour that did not change.** `-I` stays, so binary is decided by content. `grepArgs` and the exit 0/1/2
    contract are unchanged. If `hash-object` fails, the empty `--attr-source=` makes git exit with a code other than 0
    or 1, which the gate maps to exit 2, so the failure stays fail-closed.
  - **Scratch reproduction of round 1, rerun on HEAD's gate.** With a committed `.gitattributes` holding
    `*.log -diff` and `*.txt binary`, the gate exits 1 with both findings. Round 1 got exit 0 there. A global
    `core.attributesFile` that marks `*.log binary` (through `GIT_CONFIG_GLOBAL`) also gives exit 1 with both findings.
  - **The new plant.** `fail-gitattributes-diff` was built by hand (markers expanded, committed) and gives exit 1 with
    exactly `notes/hidden.log:1` and `notes/hidden.txt:1`, as `plant.json` expects.
  - **The landing step and the documents.** Step 2.9.2 of `ocelle-land` uses the same options, so its file list and
    the gate still agree. The rule's documents (`gates/README.md`, `ci-checks.md`, `gate-cli.md`, `plants.md`) are
    updated. The residual local `info/attributes` case is L2-01.

## Regressions from the folds

I found none. Since round 1's head `b2bba57`, the changes are the two fixes, their tests, the plant, the count updates,
the documents and skill text above, and op records and evidence. The counts are `others` 252 to 253 (one new plant)
and seven to eight `sandbox-paths` plants in the README test. No existing assertion was weakened. The one fixture
change (`test-workflow-evidence.test.ts` copies the redaction script) is needed, because the runner now requires the
script, and it changes no assertion. Round 1's other notes (L1-03 to L1-06) are untouched and stay notes.
`redact-sandbox-paths.sh --verify b2bba57` still exits 0. The phase-1 evidence logs were rewritten by the fixed runner
in `98f5bbf`, and the gate passes over them.

## Checks run

Locally on HEAD `ac5bebc`:

- `pnpm run gate:sandbox-paths`: exit 0, 5853 tracked files, 4 allowed files.
- `pnpm run gate:typecheck`, `gate:lint` (686 files), `gate:test-lint` (522 files) and `gate:config-copies`: exit 0
  each.
- `pnpm run gate:signoff -- --range origin/main..HEAD`: exit 0, 30 commits.
- `vitest run --project gates --project gates-integration` over 11 files: `gates-readme`, `plant-runner`,
  `sandbox-paths` (unit and integration), `story-entry`, `story-redaction`, `test-workflow-evidence`,
  `redact-sandbox-paths`, `registry`, `ci-workflow` and `governance`. All 258 tests passed.
- `diff -r` of the two story `scripts/` directories: no output.
- `redact-sandbox-paths.sh --verify b2bba57`: exit 0.
- Scratch probes of the gate: a committed `.gitattributes`, a global attributes file, `info/attributes` (L2-01), and
  the new plant built by hand.

Not run, under the operator's rule against long runs: the whole unit suite, the full plant run and Mutation testing.
Round 5 ran scoped mutation over the three changed source files with no survivor. I did not rerun it.

**Depends on CI.** I could not read CI myself. The orchestrator reports that every check is green on `98f5bbf`,
including Unit tests (all 6 shards), Plants, Mutation testing, Sandbox paths, Accessibility, Visual regression and
Story config copies. `98f5bbf` differs from `73c8ba1` only in logs. The later commits `f829bcc` and `ac5bebc` add only
an operator decision and a review record, and the `Sandbox paths` gate passes on them locally. On `73c8ba1`, Unit test
shard 4 failed once with "shard 0 inventory differs from the plan" and passed on the next run. The operator decision
records it as a flake. It is unrelated to this op's changes, which add no test file after `a9ffc04`.

## Verdict

approved. L1-01 and L1-02 are resolved, and the folds regressed nothing. L2-01 is a follow-up issue candidate, and
L2-02 is a note.
