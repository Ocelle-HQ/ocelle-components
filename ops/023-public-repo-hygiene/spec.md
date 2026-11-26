# Op Specification: Public repository hygiene (sandbox paths and SECURITY.md)

**Op**: `ops/023-public-repo-hygiene` | **Issue**: #60 | **Triage**: `triage/023-public-repo-hygiene.md`
**Created**: 2026-11-20 | **Status**: started
**Operator answers**: `triage/decisions/023-q1-q3-security-scope.md` (Q1 (a), Q2 (a), Q3 (a));
`triage/decisions/023-landing-redaction.md` (a sanctioned redaction step at landing, 2026-11-20); operator round 4
on phase 1 (`reviews/phase-1/round-4.md`, 2026-11-25: the focused runner redacts, and `.gitattributes` cannot exempt
a file)

## Intent

The repository is public, and its committed evidence names the paths of the sandbox it was built in. This op
replaces those paths with stable placeholders without changing what the evidence shows. It stops new ones with a CI
gate, and makes the story scripts write logs without them. It also updates `SECURITY.md` and spec 001 FR-032: the
private reporting channel is on now, not "once public with 1.0.0". Branches in flight are redacted when they land:
`/ocelle-land` runs the redaction script on the merged tree as a commit of its own, and the script's verify mode
proves that the commit is only placeholder substitutions. Git history is not rewritten.

## User Scenarios & Testing

### User Story 1 - The public tree holds no sandbox paths, and new ones are refused (Priority: P1)

A reader of the public repository finds no sandbox path in the tracked files, apart from four listed test inputs.
A contributor whose pull request adds one gets a failing `Sandbox paths` check, which names each file and line. An
implementer running the story workflow gets logs and records that are already redacted. A security reporter finds
one private channel in `SECURITY.md`: GitHub private vulnerability reporting. A maintainer landing a branch that
was in flight before this op redacts its merged tree with one sanctioned commit, and can prove that the commit
changed nothing but sandbox-path prefixes.

**Why this priority**: it is the op's only story.

**Independent Test**: the gate's unit and integration tests, its plants, the redaction script's tests, the story
script tests and the governance test pass after each is seen red. `pnpm run gate:sandbox-paths` exits 0 on the
branch.

**Acceptance Scenarios**:

1. **Given** a tracked file outside the allowed list with a line that matches the rule, **When** the gate runs,
   **Then** it exits 1 with one finding `<path>:<line>` (rule `sandbox-path`) for each matching line, and no finding
   echoes the line.
2. **Given** matching lines only in the four allowed files, in untracked or git-ignored files, or in binary files
   (binary by content: a NUL byte near the start), **When** the gate runs, **Then** it exits 0.
3. **Given** lines with `/work/root/x`, `gates/test/fixtures/root/x`, `` `/root/` ``, `/root/|`, `/root/…`,
   `/home/user/…`, `/home/u/x`, `/home/runner/x` or a placeholder, **When** the gate runs, **Then** it exits 0.
4. **Given** a root with no tracked file, or a root that is not the top of a git work tree, **When** the gate runs,
   **Then** it exits 2 and names the cause.
5. **Given** text with a store path, a repository-root path (also after `file://`) and another matching path,
   **When** the redaction script reads it, **Then** it writes `<pnpm store>`, `<repo>` and `<home>/` in their
   places, and every other byte is unchanged.
6. **Given** a test command, a setup command or a test failure whose output holds sandbox paths, **When** `red.sh`
   or `tdd-check.sh` runs it, with or without `focused_runner` set in `story-config.yml`, **Then** every log and JSON
   record the script or the focused runner writes or prints holds the placeholders and no line matches the rule.
7. **Given** the branch after this op, **When** the gate runs on it, **Then** it exits 0. The redaction commit
   shows only placeholder substitutions.
8. **Given** `SECURITY.md`, **When** a reporter reads it, **Then** it names GitHub private vulnerability reporting
   as the channel. It names no other contact and says nothing about a later switch-on or 1.0.0. It still says what
   to include, promises 3 and 10 working days, and asks for no public issue.
9. **Given** a commit or a commit range, **When** `redact-sandbox-paths.sh --verify` checks it, **Then** it exits 0
   only when every changed file is a modified regular file whose new content is the script's redaction of its old
   content. Any other change (another word changed, a wrong placeholder, a partial redaction, an added, deleted or
   renamed file, a mode change) exits 1 with one finding per file. A range with no change, or a revision that does
   not resolve, exits 2 with its cause.
10. **Given** a branch in flight whose merged tree holds sandbox paths in review records, **When** `/ocelle-land`
    lands it, **Then** after the last merge of `main` it makes one commit with the redaction script's output only.
    That commit passes `--verify` and the `Sandbox paths` gate, and it does not count as editing a review, verdict
    or check file.
11. **Given** a tracked text file with a matching line and a committed `.gitattributes` (at the root or in a
    subdirectory) that marks it `binary` or `-diff`, **When** the gate runs, **Then** it exits 1 with the file's
    finding: no `.gitattributes` can exempt a file (operator round 4, O4-02).

### Edge Cases

- A path directly after a letter or a digit, for example after an ANSI colour code (`…m` + `/root/…`), is not
  matched. This is the rule's known gap (triage 023). None exist today, and the scripts redact such paths at write
  time anyway. The redaction uses the same rule, so it leaves them as they are too.
- A path whose name contains a colon or a space: the gate reports it correctly, because it reads `git grep -z`
  output.
- pnpm's store at any version `v<N>` is redacted to `<pnpm store>`. A store path without `/v<N>` falls to the
  `<home>/` rule.
- The repository root is `/home/user/` + `ocelle-components` only when no path-name character follows it.
  Otherwise the `<home>/` rule applies.
- A branch that adds an unredacted log fails the gate. The fix is one run of the redaction script with `--in-place`
  on the files the gate names. At landing that run is the sanctioned step of FR-012.
- The verify mode compares whole files, so it also fails a commit that redacts only some of a file's matching lines.
  It reads committed objects only, so uncommitted changes do not affect it.
- `.git/info/attributes`, `core.attributesFile` and the system attributes file are not part of the tracked tree.
  The gate ignores the last two, and a clone (CI's checkout included) has no `.git/info/attributes` unless someone
  writes one locally. That local file stays a known gap of a local run. CI's run is the verdict.
- A file whose path itself holds a sandbox path is not redacted by the script (it changes contents, not names). The
  gate reports it, and the landing step stops and reports it to the operator.

## Requirements

### Functional Requirements

- **FR-001 (rule)**: A line holds a sandbox path when it matches the POSIX extended regular expression
  `(^|[^A-Za-z0-9._~-])/(root|home/user)/[A-Za-z0-9._-]`. The gate and the redaction use this rule and no other.
- **FR-002 (gate)**: `pnpm run gate:sandbox-paths` (`gates/bin/sandbox-paths.ts --root <dir>`) searches the tracked
  files of `<dir>` with `git grep` (extended regular expressions, binary files skipped, `-z`). Whether a file is
  binary is decided by its content alone (git's NUL-byte test): git runs with `--attr-source` set to the empty tree,
  `core.attributesFile=/dev/null` and `GIT_ATTR_NOSYSTEM=1`, so no `.gitattributes` (`binary`, `-diff` or any other)
  can exempt a file (amended 2026-11-25, operator round 4, O4-02). It excludes exactly the
  allowed files of FR-003. It exits 1 with one finding per matching line (`<path>:<line>: sandbox-paths:
  sandbox-path: <message>`, where the message names the fix and does not echo the line). It exits 0 with a one-line
  summary when nothing matches. It exits 2 with a cause when `<dir>` is not the top of a git work tree, when it has
  no tracked file, or when `git` fails. It scans the whole tracked tree, `gates/plants/` and `gates/test/fixtures/`
  included (an exception to `contracts/gate-cli.md`, recorded there).
- **FR-003 (allowed files)**: The allowed files are a constant in the gate's source. There are exactly four:
  `gates/test/capture-plan.test.ts`, `gates/test/fixtures/pins/pnpm/success.ndjson`,
  `gates/test/fixtures/pins/pnpm/outdated-lockfile.ndjson` and
  `specs/001-repository-foundation/reviews/phase-4/round-1.md`. Adding one is a reviewed code change.
- **FR-004 (registry and CI)**: The gate has an entry in `gates/gates.json` (check `Sandbox paths`, plant form
  `tracked-tree`), an entry in `fr020` and a `ci.yml` job `sandbox-paths`. The job has pinned actions, top-level
  `contents: read` (unchanged), checkout with `persist-credentials: false`, and the shared setup action.
- **FR-005 (plants)**: `gates/plants/sandbox-paths/` holds at least one fail plant, one pass plant and one breaking
  plant. No plant file matches the rule. The `tracked-tree` form puts sandbox paths into the plant's root at run time
  through the markers `@SANDBOX_ROOT@` and `@SANDBOX_HOME_USER@`.
- **FR-006 (redaction)**: `tooling/speckit/bin/redact-sandbox-paths.sh` replaces only the matched prefix, in this
  order: `/root/` + `.local/share/pnpm/store/v<N>` becomes `<pnpm store>`, `/home/user/` + `ocelle-components` (when
  no path-name character follows it) becomes `<repo>`, and any other prefix `/root/` or `/home/user/` that matches
  FR-001 becomes `<home>/`. The character before the path is kept. No line is added, removed or reordered, and no
  other byte changes. It reads stdin and writes stdout, or with `--in-place <file>...` rewrites the files it is
  given. Its source does not match FR-001.
- **FR-007 (write-time redaction)**: Every log that `red.sh` and `tdd-check.sh` write, and the JSON record
  `tdd-check.json` (also as printed), passes through the redaction script. This holds on both paths: the shell path
  (`story_run_tests_at` and `emit` in the story scripts) and the focused path, when `story-config.yml` sets
  `focused_runner` and the scripts hand off to `gates/bin/story-evidence.ts`. The focused runner passes every log it
  writes (fresh or reused evidence) and every JSON record it writes or prints through the same script, so there is
  one rule and no second copy of it (amended 2026-11-25, operator round 4, O4-01). If the script is missing or
  fails, the runner writes nothing and exits 2. The scripts keep their exit codes and JSON fields. When the script is missing, they exit 2 with a `story:` message before they write any log. Both
  copies of the story scripts (`.specify/extensions/story/scripts/` and
  `tooling/speckit/extensions/story/scripts/`) stay byte-identical.
- **FR-008 (one-time redaction)**: Every tracked file on the branch outside the allowed files that matches FR-001 is
  redacted by FR-006 in one commit of its own. That commit holds nothing else.
- **FR-009 (SECURITY.md)**: `SECURITY.md` names GitHub private vulnerability reporting ("Report a vulnerability"
  on the Security tab) as the only reporting channel. It holds no `@MOES-Media`, no "until then" contact and no
  "once public" or 1.0.0 condition. What to include, the 3 and 10 working days and "do not open a public issue" stay.
- **FR-010 (records)**: Spec 001 gets dated amendments (2026-11-20, op 023, #60) of FR-020 (the eighteenth gate,
  `sandbox-paths`), FR-032 (FR-009 above), US4 scenario 3 and SC-006 (no owner handle in `SECURITY.md`). The original
  text stays. `contracts/ci-checks.md` (the row, eighteen gates, nineteen required checks and a dated note),
  `contracts/gate-cli.md` (the row and the exception of FR-002), `contracts/plants.md` (the form and the gate's row),
  `gates/README.md` (the gate's row and the required checks list) and the comment in `gates/lib/registry.ts`
  match.
- **FR-011 (verify mode)**: `redact-sandbox-paths.sh --verify <rev>` checks `<rev>` against its first parent, and
  `--verify <from>..<to>` checks that range. It lists the changes with `git diff --raw --no-renames -z`. It passes
  (exit 0, one summary line `redact-sandbox-paths: verify: <n> files changed, each only by the redaction`) when at
  least one file changed and each changed file is a modified regular file (`100644` or `100755`, the same mode on
  both sides) whose content at `<to>` is byte for byte the script's redaction of its content at `<from>`. Otherwise
  it exits 1 with one line per file, `redact-sandbox-paths: verify: <path>: <reason>`. The reasons are `added`,
  `deleted`, `mode changed`, `not a regular file` and `not the redaction of its old content`. It exits 2 with a
  cause on stderr when the argument is missing or extra, when a revision does not resolve to a commit, when `<rev>`
  has no parent, when the range changes no file, or when `git` fails. It never echoes a file's lines, reads git
  objects only and writes no file or index. Its source still does not match FR-001.
- **FR-012 (sanctioned landing step)**: The landing flow (`/ocelle-land`) redacts a mission or op branch on its
  merged tree, as the operator decided on 2026-11-20. The step runs after the last `git merge --signoff
  origin/main` (and so after the history fold) and before the final push. It runs only when the merged tree has
  `tooling/speckit/bin/redact-sandbox-paths.sh` and `pnpm run gate:sandbox-paths` exits 1. It runs the script with
  `--in-place` on the tracked files outside the allowed files that match FR-001 (found with the gate's own
  `git grep` options of FR-002, so `.gitattributes` cannot hide one), and commits those files alone
  (`chore(landing): redact sandbox paths in the merged tree`, signed off). Then `--verify HEAD` (FR-011) and the
  gate must both exit 0. Landing rule 8 is read over the commit's added lines, because the removed lines are the
  old paths. This commit does not count as editing a review, verdict or check file. Where a run rule forbids such
  edits, it names this exception. If `--verify` or the gate fails, the step stops, the commit is not pushed, and the
  operator is told. The step is recorded in `.claude/skills/ocelle-land/SKILL.md`, in the "never edit" rule of
  `.claude/skills/ocelle-run/SKILL.md`, in `tooling/speckit/README.md` and in `gates/README.md`.

### Out of scope

- Rewriting git history.
- The 1.0.0 release (#11) and the constitution's sentence "goes public with 1.0.0" (a constitution amendment for
  the operator).
- Scratchpad paths under `/tmp/claude…` (Q2 (a)).
- Other personal-data patterns (e-mail addresses, keys), which landing rule 8 still covers. Landing rule 8 is
  unchanged, except that FR-012 says how it is read for the sanctioned commit.
- Redacting the in-flight branches (missions 018, 019 and 020, op 022 or #57, and #54) on their own branches, and
  exempting `reviews/` from the gate (both not chosen, decision of 2026-11-20). They are redacted when they land, by
  FR-012.
- Adding `Sandbox paths` to the ruleset on `main`, which is an operator action after the merge.

## Success Criteria

- **SC-001**: `git grep -nIE '<FR-001>'` over the branch's tracked files matches only lines in the four allowed
  files.
- **SC-002**: The plant job proves the gate: its fail plants fail with exactly their findings, its pass plants pass,
  and its breaking plant exits 2 with its cause.
- **SC-003**: A story phase run after this op commits no log or record that the gate rejects.
- **SC-004**: Every landing redaction commit passes `redact-sandbox-paths.sh --verify` for that commit.

## Assumptions

- `git` 2.34 or newer, as for the other gates. `git grep -z` and `:(exclude,literal)` pathspecs are available. The
  `sandbox-paths` gate needs `git` 2.40 or newer, for `--attr-source` (FR-002). CI's `ubuntu-24.04` runner has a newer
  one. An older git rejects the option, and the gate exits 2 with git's line.
- CI's checkout path (under `/home/runner/`) and its pnpm store do not match FR-001. The gate is clean on CI's own
  output.
- The branch carries `main` at `7f61959` and nothing newer. If `main` moves before the landing, the landing runs the
  redaction once more on the merged tree, with the sanctioned step of FR-012.
