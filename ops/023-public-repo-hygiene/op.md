---
op: 023
triage: triage/023-public-repo-hygiene.md
issues: [60]
mode_of_work: task_execution
accountable: "human:jeroennouwsdev"
semver: none
status: started
---

# Op 023: Public repository hygiene (sandbox paths and SECURITY.md)

## Intent

The repository is now public. Its committed evidence on `main` (test logs, Stryker reports, review prose) holds
sandbox paths: pnpm's store under `/root/` + `.local/share/pnpm/store/v<N>`, the checkout root under `/home/user/` +
`ocelle-components`, and a few other `/root/` + `…` paths. 411 tracked files match the rule of triage 023 today.
`SECURITY.md` still describes the private reporting channel as something that "is switched on when the repository
goes public with release 1.0.0", and names `@MOES-Media` as the contact "until then".

This op:

1. **redacts** the sandbox paths in the committed files on the branch (which carries `main` at `7f61959`), with
   the stable placeholders `<pnpm store>`, `<repo>` and `<home>/`, and changes nothing else in those files. The four
   allowed files keep their paths and are listed in the gate's source;
2. adds the **`sandbox-paths` CI gate**, which fails on any tracked file outside the allowed list holding a line
   that matches the rule. It is test-first and has plants;
3. makes **`red.sh` and `tdd-check.sh` redact** every log and JSON record they write, with the same redaction
   script, in both identical copies of the story scripts;
4. updates **`SECURITY.md` and spec 001 FR-032** for the public repository: GitHub private vulnerability reporting
   is the only channel, and `@MOES-Media` is removed (operator Q1 (a); private vulnerability reporting is switched
   on, Q3 (a)).

Git history is not rewritten. No element, attribute, event, slot, part, token or package changes (semver `none`).

**The rule** (triage 023, item 1; the gate, the redaction and the reviews use this rule and no other). A line holds a
sandbox path when it matches the POSIX extended regular expression

```
(^|[^A-Za-z0-9._~-])/(root|home/user)/[A-Za-z0-9._-]
```

**Allowed files** (exactly four, a constant in the gate's source): `gates/test/capture-plan.test.ts`,
`gates/test/fixtures/pins/pnpm/success.ndjson`, `gates/test/fixtures/pins/pnpm/outdated-lockfile.ndjson`,
`specs/001-repository-foundation/reviews/phase-4/round-1.md`.

Operator answers and constraints (2026-11-20, `triage/decisions/023-q1-q3-security-scope.md`):

- Q1 (a): `SECURITY.md` names GitHub private vulnerability reporting only, and `@MOES-Media` is removed from it.
- Q2 (a): scratchpad paths under `/tmp/claude…` are left as they are. They are not part of this op, and the rule
  does not match them.
- Q3 (a): private vulnerability reporting is switched on.
- The story's tests go in the phase's red commit. The gate check is test-first, with a plant. No history rewrite.
  CI comes first: locally only the fast gates and `gate:plants -- --affected <base>` run. Every commit is signed off.

### Choices the plan makes

These are within the triage's scope, and the operator can overrule them at the phase review.

- **How the plants hold sandbox paths: a new plant form, `tracked-tree`.** The gate runs `git grep` over the tracked
  files of its root. No existing plant form gives a git checkout whose files the plant controls: `repo-tree` is not a
  git repository, `commit-repo` has empty trees, and `mutation-repo` commits the whole configuration set. Also, a
  plant must not hold a sandbox path literally, or the gate would fail on `gates/plants/` in the repository itself,
  and the plant directory is not one of the four allowed files. So `tracked-tree` copies the plant's `tree/` into an
  empty directory. It replaces the two markers `@SANDBOX_ROOT@` and `@SANDBOX_HOME_USER@` with `/root` and
  `/home/user`, which it builds at run time, then commits the result as a git repository. See plan.md *Plant form*.
- **A checkout with no tracked file is a setup error (exit 2).** Passing a scan of nothing would be vacuous. This
  is also the gate's breaking plant (an empty `tree/`).
- **The gate's message does not echo the matched line**, so the gate's own output, kept as evidence, holds no
  sandbox path.
- **The gate reads `gates/plants/` and `gates/test/fixtures/` in normal mode.** `contracts/gate-cli.md` forbids that
  for gates. The triage's rule scans the whole tracked tree, so the contract gets an exception for `sandbox-paths`.
- **The redaction script**: `tooling/speckit/bin/redact-sandbox-paths.sh` reads stdin and writes stdout, or
  redacts the files it is given with `--in-place <file>...`. The story scripts call it by its path from the
  repository root, and they stop with exit 2 when it is missing, before they write any log.
- **The scripts' write-time redaction sits in the shared `common.sh`.** `story_run_tests_at` writes every log that
  `red.sh` and `tdd-check.sh` write, so redacting there covers all of them. `tdd-check.sh` also passes its JSON
  record through the script. All three files change identically in `.specify/extensions/story/scripts/` and
  `tooling/speckit/extensions/story/scripts/`.
- **FR-032 and the other spec 001 text** (US4 scenario 3, SC-006) get a dated amendment. The original text stays.
  The governance test changes red first. The amendment and `SECURITY.md` follow in the implementation, because a
  red commit holds only test files.

## Acceptance

Each check is a test that fails before the change, except check 9 (a gate run, red before the redaction) and check
10 (records). Sandbox paths in tests are built at run time (for example `"/" + "root/"`).

1. **The rule** (`gates/test/sandbox-paths.test.ts`, in process). One `toEqual` over a table of lines and whether
   each matches. A store path, a repository-root path, `file://` followed by a repository-root path, a `/root/` +
   `.cache` path, a path after a space, a quote and `(`, and a path at the start of a line all match. `/work/root/x`,
   `gates/test/fixtures/root/x`, `` `/root/` ``, `/root/|`, `/root/…`, `/home/user/…`, `/home/u/x`,
   `/home/runner/x`, `<pnpm store>`, `file://<repo>/x` and `<home>/.cache` do not. The same table run through
   `git grep -E` in a temporary repository (integration test) gives the same answers, so the gate's regular
   expression and git's agree.
2. **The gate** (`gates/test/integration/sandbox-paths.test.ts`, on temporary git repositories).
   - A tracked file outside the allowed list with a store path on line 2 and a repository-root path on line 5: exit
     1, exactly two findings `<path>:2` and `<path>:5` with rule `sandbox-path`, neither echoing the line.
   - The same lines in each of the four allowed files, an untracked file, a git-ignored file and a binary file (a
     NUL byte): exit 0.
   - No tracked file, or a root that is not the top of a git work tree: exit 2, with a cause naming the problem.
3. **The plants** (`gates/plants/sandbox-paths/`, judged by the plant job). Every fail plant fails with exactly its
   findings, every pass plant passes, and the breaking plant exits 2 with its cause. The `tracked-tree` form is
   covered by `gates/test/integration/plant-repo.test.ts`: the markers are replaced and the tree is committed, and
   an empty `tree/` gives a repository with no tracked file.
4. **The registry**. `sandbox-paths` is in `gates/gates.json`, in `fr020` of `gates/lib/registry.ts` and in
   `ci.yml` (check name `Sandbox paths`), and `tracked-tree` is an accepted plant form. The existing count tests go
   from seventeen gates to eighteen (`registry.test.ts`, `registry-parts.test.ts`) and from eighteen required
   checks to nineteen (`gates-readme.test.ts`). The job has the same checkout and setup shape as `config-copies`.
5. **The redaction script** (`gates/test/integration/redact-sandbox-paths.test.ts`). Through stdin and with
   `--in-place`, a store path becomes `<pnpm store>` and a repository-root path becomes `<repo>` (also after
   `file://`). Any other path that matches the rule becomes `<home>/`, and the rules apply in that order. Every other
   byte stays the same, and the line count and the line order do not change. A JSON file still parses afterwards.
   No output line matches the rule. The script's own source does not match the rule.
6. **`red.sh` writes a redacted log** (`gates/test/integration/story-redaction.test.ts`, once for each of the two
   script copies). In a temporary repository whose test command prints a store path and a repository-root path and
   exits 1, `red.sh 1 phase` writes `red-phase.log` with `<pnpm store>` and `<repo>` and no line that matches the
   rule.
7. **`tdd-check.sh` writes redacted logs and a redacted record** (same test file, both copies). Every log it writes
   (`check-red-*.log`, `check-final-tests-on-base.log`, `check-head.log`) and `tdd-check.json` hold the placeholders
   and no line that matches the rule. The JSON record gets its sandbox path from an input that the test chooses, as
   plan.md *Test approach* describes. Without the redaction script, both scripts exit 2 before they write any log.
8. **`SECURITY.md` for the public repository** (`gates/test/governance.test.ts`, changed). It names GitHub private
   vulnerability reporting. It does not contain `@MOES-Media`, "Until then", "Once the repository is public" or
   "1.0.0". It still promises 3 and 10 working days and does not ask for public issues.
9. **The tree is clean** (a gate run, recorded in `reviews/phase-1/`). After the gate commit and before the
   redaction commit, `pnpm run gate:sandbox-paths` exits 1, with one finding per matching line outside the allowed
   files (415 lines on `main` at `7f61959`). After the redaction it exits 0. The redaction commit changes only
   matched prefixes: `git diff --word-diff` shows only placeholder substitutions.
10. **Records (no test).** Spec 001 carries the dated amendments of FR-020, FR-032, US4 scenario 3 and SC-006.
    `contracts/ci-checks.md`, `contracts/gate-cli.md`, `contracts/plants.md` and `gates/README.md` describe the gate
    and the form. The run summary tells the operator two things. First, add `Sandbox paths` to the ruleset on `main`
    (nineteen names). Second, the in-flight branches (missions 018, 019 and 020, op 022 or #57, and #54) need one
    redaction pass before they land.

## Constitution principles touched

- **VIII Test-first, proven non-vacuous.** All of the story's tests are in one test-only red commit. A scaffold
  commit comes first if a missing module would make them fail to load. "Gates are proven, too": the new gate has
  fail, pass and breaking plants, run by the plant job in CI. The new TypeScript gate source is mutation-tested.
- **Technology, Licence and Supply Chain.** "No secrets, tokens or personal data": sandbox paths are container
  paths, not personal data (triage 023). This is hygiene, and no constitution change is needed. "A `SECURITY.md` with
  a private reporting channel exists before the repository goes public" still holds. The CI job pins its actions and
  keeps `contents: read` and `persist-credentials: false`. Every commit is signed off (DCO).
- **Not changed, for the operator.** The constitution still says "The repository is internal until then and goes
  public with 1.0.0" (Technology, Licence and Supply Chain). That is no longer true. This op does not amend the
  constitution, which has its own amendment procedure (Governance).
- **I to VII.** Not touched: no element, token, story, baseline, manifest or package changes.
