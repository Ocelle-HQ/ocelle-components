# Implementation Plan: Public repository hygiene (sandbox paths and SECURITY.md)

**Op**: `ops/023-public-repo-hygiene` | **Date**: 2026-11-20 | **Spec**: `spec.md` | **Record**: `op.md`
**Input**: triage `triage/023-public-repo-hygiene.md` (#60), with its rule stated exactly; the operator answers of
`triage/decisions/023-q1-q3-security-scope.md` (Q1 (a), Q2 (a), Q3 (a)); the operator constraints of 2026-11-20
(the story's tests in the red commit, a test-first gate with a plant, no history rewrite, CI first, sign-off).

## Summary

The op has four parts in one phase:

- a new CI gate `sandbox-paths` (a pure rule module, a CLI that runs `git grep`, plants, and the registry, CI and
  docs entries);
- a new plant form `tracked-tree`, so the gate's plants are git checkouts that hold sandbox paths only at run time;
- a shared redaction script, which `red.sh` and `tdd-check.sh` use through `common.sh` when they write, and which
  redacts the tracked files once, in a commit of its own;
- `SECURITY.md` for the public repository, with the spec 001 amendments.

## Technical Context

- **Languages**: TypeScript (Node 26 type stripping, as the other gates) for the gate and the plant form. Bash and
  GNU `sed -E` for the redaction script and the story scripts. Tests are Vitest: the `gates` project in process,
  and `gates-integration` for child processes and git.
- **Gates that judge this op locally** (operator constraint: CI first, so only the fast gates run locally):
  `pnpm test`, `gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:config-copies`, the new `gate:sandbox-paths`,
  and `pnpm run gate:plants -- --affected <phase base>`. The op changes `gates/lib/` and `package.json`, so op 016's
  selection takes the full set ("shared gate source"). The phase records that run in `reviews/phase-1/plants.md`,
  whatever it selects. Mutation testing, the full plant job and every other check run in CI on the pull request. The
  review reads their results there.
- **Mutation**: the new gate source (`gates/lib/sandbox-paths.ts`, `gates/bin/sandbox-paths.ts`) and the changed
  lines of `gates/lib/plant-repo.ts`, `gates/lib/registry.ts` and `gates/bin/plants.ts` are in the mutation gate's
  scope. Process-boundary lines get the repository's existing `// Stryker disable next-line all: process boundary,
  covered by gates-integration: <file> "<test>"` records, which name the integration test that covers them. The
  shell scripts are not mutated.

## Files to change

| File | Change |
|---|---|
| `gates/lib/sandbox-paths.ts` (new) | The pure module: `sandboxPathRule` (the FR-001 source text, used as is by `git grep -E` and by `new RegExp`), `allowedFiles` (the four paths of FR-003, sorted), `grepArgs(allowed)` (the `git grep` arguments: `--no-color -z -n -I -E -e <rule> -- . ':(exclude,literal)<path>'...`), `parseGrep(stdout)` (the `-z` records `path\0line\0text\n` as findings, `path:line`, rule `sandbox-path`, a fixed message that does not echo the text), and `verdict(...)` (the `GateResult` for git's exit code and output, and the tracked-file count). |
| `gates/bin/sandbox-paths.ts` (new) | The CLI under `gates/lib/cli.ts`'s `main` and `parseArgs` (`--root`, default the working directory). It checks that `git -C <root> rev-parse --show-toplevel` is `<root>` (by real path), and counts `git ls-files -z` (0 is exit 2). It runs `git -C <root> -c core.quotePath=false grep <grepArgs>` and emits the verdict: git exit 1 is pass (exit 0), git exit 0 is findings (exit 1), and anything else is exit 2 with git's error line. |
| `gates/lib/plant-repo.ts` | `expandMarkers(bytes)` (pure): replaces every `@SANDBOX_ROOT@` with `"/" + "root"` and every `@SANDBOX_HOME_USER@` with `"/" + "home/user"`, byte for byte, in any file. `buildTrackedTree(plant, into)` (process boundary): copies the plant's `tree/` into the empty `into` through `expandMarkers`, runs `git init -q -b main`, and if any file was copied, runs `git add -A` and one commit by `Plant Base <base@example.com>` (RFC 2606, `commit.gpgsign=false`, as `git()` does). With no `tree/` or an empty one, nothing is tracked. No configuration set and no `node_modules` link: the gate reads only the root's tracked files. The header comment gets one sentence on the form. |
| `gates/lib/registry.ts` | `PlantForm` and `forms` gain `tracked-tree`, and the error text becomes `plantForm must be repo-tree, commit-repo, mutation-repo, tracked-tree or workspace`. `fr020` gains `"sandbox-paths"` after `"axe"`, with the comment `// op 023 (#60): the sandbox-paths gate.` The header comment changes from "eighteen checks" to "nineteen checks". |
| `gates/bin/plants.ts` | `build["tracked-tree"]: (plant, into) => buildTrackedTree(plant, into).then(() => ({}))`, with its process-boundary record. |
| `gates/gates.json` | After `axe`: `{"id": "sandbox-paths", "check": "Sandbox paths", "command": "pnpm run gate:sandbox-paths", "plantCommand": "node gates/bin/sandbox-paths.ts --root {root}", "plantForm": "tracked-tree", "scope": "every tracked file of the checkout but the four allowed files of gates/lib/sandbox-paths.ts (op 023, #60): no line may match the sandbox-path rule"}`. |
| `package.json` | `"gate:sandbox-paths": "node gates/bin/sandbox-paths.ts"`, after `gate:axe`. |
| `.github/workflows/ci.yml` | A job `sandbox-paths`, `name: Sandbox paths`, the shape of `config-copies`: `runs-on: ubuntu-24.04`, `actions/checkout` pinned by the same SHA with `persist-credentials: false`, `./.github/actions/setup`, and `run: pnpm run gate:sandbox-paths`. The top-level permissions stay as they are. |
| `gates/plants/sandbox-paths/**` (new) | The plants of *Plants*. |
| `tooling/speckit/bin/redact-sandbox-paths.sh` (new) | See *Redaction script*. |
| `.specify/extensions/story/scripts/common.sh`, `tooling/speckit/extensions/story/scripts/common.sh` | `story_redactor` (the script's path from `story_repo_root`) and `story_require_redactor` (exit 2 with `story: <path> is missing; it redacts the logs this script writes` unless it is executable). In `story_run_tests_at`, the subshell's output goes through the redactor into `$log`, and the function still returns the test exit code (`PIPESTATUS[0]`). The "test_command is not set" line goes through it too. |
| `.specify/extensions/story/scripts/red.sh`, the `tooling/` copy | `story_require_redactor` after `story_require_phase`, before anything is written. |
| `.specify/extensions/story/scripts/tdd-check.sh`, the `tooling/` copy | `story_require_redactor` after `story_require_phase`. `emit` becomes `printf '%s\n' "$1" \| "$(story_redactor)" \| tee "$out"`. |
| `SECURITY.md` | "Reporting a vulnerability": one channel, GitHub private vulnerability reporting ("Report a vulnerability" on the repository's Security tab). The "Once the repository is public" and "Until then" items go. The rest is unchanged. |
| `gates/test/**` | The tests of *Test approach*. |
| `specs/001-repository-foundation/spec.md` | Dated amendments (2026-11-20, op 023, #60), each after the text it amends, with the original text kept: FR-020 (the eighteenth gate `sandbox-paths` and its scope, so eighteen gate ids and nineteen required check names); FR-032 (FR-009 of this op: private vulnerability reporting is switched on and is the only channel, `@MOES-Media` is no longer named, and the rest stands; operator Q1 (a) and Q3 (a)); US4 scenario 3 and SC-006 (no owner handle in `SECURITY.md`). |
| `specs/001-repository-foundation/contracts/ci-checks.md` | The `Sandbox paths` row (job id `sandbox-paths`; since op 023). "seventeen in all" becomes eighteen, and "the eighteen check names" becomes nineteen. A dated note in the style of the mission notes says that the ruleset on `main` must add `Sandbox paths`. |
| `specs/001-repository-foundation/contracts/gate-cli.md` | The `sandbox-paths` row. After "A gate MUST NOT read `gates/plants/` or `gates/test/fixtures/` outside plant mode", the exception: `sandbox-paths` scans every tracked file, those directories included (op 023). The plant-mode paragraph names `tracked-tree`. |
| `specs/001-repository-foundation/contracts/plants.md` | The `tracked-tree` form paragraph (the markers, no configuration set, an empty tree gives no tracked file) and the `sandbox-paths` row of the gate table. |
| `gates/README.md` | The `sandbox-paths` row in "The gates", with its plants. "Required checks on `main`" changes from eighteen to nineteen, with `Sandbox paths` as item 18, before `Plants`. |
| `ops/023-public-repo-hygiene/reviews/phase-1/**` | Evidence. Any line that matches the rule is redacted before it is committed (see *Own evidence*). |
| about 411 files under `specs/*/`, `ops/*/` and `knowledge/speckit-flows/log.md` | The one-time redaction (FR-008), in a commit of its own. |

Unchanged, and the review checks this: `.claude/skills/**` (landing rule 8 stays), `tooling/speckit/bin/guard-commit.sh`,
the constitution, the four allowed files, every element, token, story and baseline, and git history.

## Approach

### The gate

`git grep` is the matcher, so the gate's rule is git's ERE. The in-process tests use the same source text with
`new RegExp`. The integration test shows that both agree on the whole table (*Test approach* 1). The parser reads
`-z` output, so a path with `:` is reported exactly. The `-I` flag skips binary files. The `:(exclude,literal)`
pathspecs make the allowed list exact paths, never globs or directories. Exit codes: git `grep` exits 1 when there
is no match, so 1 maps to a pass. It exits 0 when there are matches, which maps to findings. Any other exit is the
gate's exit 2, with git's first error line as the cause. The check that `<root>` is the top of a work tree stops the
gate from scanning a parent repository by mistake. The tracked-file count stops a vacuous pass. Both are exit 2.

Summary on a pass: `sandbox-paths: <n> tracked files checked, none holds a sandbox path (4 allowed files)`. The
finding message: `holds a sandbox path; redact it with tooling/speckit/bin/redact-sandbox-paths.sh --in-place`.

### Plant form `tracked-tree`

The triage requires that the plants build their sandbox paths at run time and need no allowed entry. A plant file
therefore holds the markers `@SANDBOX_ROOT@` (for `/root`) and `@SANDBOX_HOME_USER@` (for `/home/user`). In the
repository, neither marker matches the rule: a marker is followed by `/`, but it does not start with one. The
builder expands the markers while it copies, so the temporary checkout holds the real paths. Placeholders such as
`<pnpm store>` are not markers and are copied as they are, so a pass plant can show that redacted text passes. The
plant job's existing checks apply as they do to every form: `plant.json`, the kinds, and no carried configuration.

### Plants

All of them are under `gates/plants/sandbox-paths/`. Locations are `path:line` below `tree/`, and the rule is
`sandbox-path`.

| Plant | `tree/` | Expect |
|---|---|---|
| `fail-store-and-repo-root` | `specs/999-example/reviews/phase-1/check-head.log`: line 2 `Content-addressable store is at: @SANDBOX_ROOT@/.local/share/pnpm/store/v10`, line 5 ` RUN  v5.0.5 @SANDBOX_HOME_USER@/ocelle-components`, other lines plain | fail: `…/check-head.log:2` and `:5` |
| `fail-file-url-in-json` | `specs/999-example/reviews/phase-1/mutation/mutation.json`: a `"projectRoot"` value and a `file://` URL, both under `@SANDBOX_HOME_USER@/ocelle-components`, on two lines | fail: the two lines |
| `fail-allowed-name-elsewhere` | `gates/test/fixtures/pins/pnpm/other.ndjson` with a store path: the allowed list is exact files, not their directory | fail: its line |
| `pass-near-misses` | `notes/near-misses.md`, one line each: `/work/root/x`, `gates/test/fixtures/root/x`, `` `/root/` ``, `/root/\|`, `/root/…`, `/home/user/…`, `/home/u/x`, `/home/runner/x`, `<pnpm store>`, `file://<repo>/x`, `<home>/.cache` | pass |
| `pass-allowed-files` | the four allowed paths, each with one marker line (`gates/test/capture-plan.test.ts` as a TypeScript comment) | pass |
| `pass-binary-file` | `notes/blob.bin`: a NUL byte, then a store path line | pass |
| `error-no-tracked-file` | no `tree/` (`cause`: `no tracked file`) | error |

### Redaction script

`tooling/speckit/bin/redact-sandbox-paths.sh`, Bash with `set -euo pipefail`, runs one `sed -E` program of three
substitutions, in order. Each keeps the preceding character through a group: `(^|[^A-Za-z0-9._~-])` followed by

1. the store prefix `/root/` + `.local/share/pnpm/store/v[0-9]+` becomes `<pnpm store>`;
2. the repository root `/home/user/` + `ocelle-components` becomes `<repo>`, when no `[A-Za-z0-9._-]` follows it
   (the next character, or the end of the line, is kept);
3. `/(root|home/user)/` followed by `[A-Za-z0-9._-]` becomes `<home>/` (the following character is kept).

Each substitution is applied globally on the line. With no arguments, the script filters stdin to stdout. With
`--in-place <file>...`, it rewrites each file (`sed -i`; no backup file). Any other argument exits 2 with usage. The
script's source must not match the rule. For example, it writes the prefixes with a group or an escape right after
the leading `/` and before the next path character (`/(root)/\.local`), never as a plain path. The gate checks the
script like every other tracked file.

The one-time run: `git grep -lIzE '<rule>' -- . <the exclude pathspecs of the gate> | xargs -0
tooling/speckit/bin/redact-sandbox-paths.sh --in-place`, then `pnpm run gate:sandbox-paths` (exit 0), then a
JSON parse of every changed `.json` file. That commit holds only these files.

### Story scripts

`story_run_tests_at` changes to

```bash
( cd "$wt"; … ) 2>&1 | "$(story_redactor)" > "$log"
code=${PIPESTATUS[0]}
```

keeping `set +e` around it as now. Both script copies get the same text, and `diff -r` of the two `scripts/`
directories stays empty. The scripts are installed copies of `tooling/speckit/extensions/story`. Editing both
copies to the same bytes matches what `specify extension add --dev` would install, so no reinstall is needed.

### SECURITY.md

```markdown
Please report a suspected vulnerability privately. Do not open a public issue, pull request or discussion about it.

Use GitHub private vulnerability reporting: "Report a vulnerability" on the repository's Security tab.
```

The other sections do not change.

### Own evidence

The red log is written by `red.sh` before the story scripts redact, and Stryker's reports name the checkout root.
So before each evidence commit after the redaction script exists, the implementer runs the script with `--in-place`
on the phase's files that match the rule. The gate's exit 0 at the head of the phase is the check. The red log's
SHA line and its test results are unchanged by this: only the prefix changes, as in the one-time run.

## Test approach (red first)

The commit order: `base.sh 1`. Then a scaffold commit, if a missing module would make the red tests fail to load.
Then one test-only red commit with every test below, `red.sh 1 phase`, and the implementation commits. The red log
must show each new or changed test failing on its assertion, not on setup.

**Scaffold** (`scaffold.sh 1`; no test file, no behaviour). It adds `gates/lib/sandbox-paths.ts` with the exports
and neutral bodies: an empty rule, an empty list, `parseGrep` returning `[]`, and `verdict` returning exit 2 `not
implemented`. It adds `gates/bin/sandbox-paths.ts`, which emits that verdict, and `expandMarkers` (returns its input)
and `buildTrackedTree` (throws `not implemented`) in `plant-repo.ts`. It also adds
`tooling/speckit/bin/redact-sandbox-paths.sh`, which copies stdin to stdout and changes no file with `--in-place`.
The registry, CI, plants and story scripts are not touched.

Tests (each assertion one `toEqual` on an object of observable facts, as op 021 does):

1. `gates/test/sandbox-paths.test.ts` (in process): the rule table of acceptance check 1 (line to matched or not) as
   one `toEqual`. `allowedFiles` equals the four paths. `grepArgs` holds one `:(exclude,literal)` pathspec for each
   allowed file. `parseGrep` turns `-z` records (one path with a `:`, one with a space) into findings at `path:line`,
   and no finding message contains the matched text. `verdict` maps git exit 1 to exit 0 with the summary, git exit 0
   to exit 1 with the findings, git exit 128 to exit 2 with git's line, and zero tracked files to exit 2 `no tracked
   file`. Red: the scaffold's neutral bodies.
2. `gates/test/integration/sandbox-paths.test.ts` (child processes, temporary repositories): the cases of acceptance
   check 2. The same rule table, written to a file and searched with `git grep -nE <sandboxPathRule>`, gives the same
   matched set as test 1. Red: the scaffold CLI exits 2 `not implemented`. Each pass and error case asserts its
   summary or cause text as well as the exit code, so the stub cannot pass it.
3. `gates/test/plant-repo.test.ts`: `expandMarkers` (both markers, several on one line, bytes around them
   unchanged, a placeholder unchanged). `gates/test/integration/plant-repo.test.ts`: `buildTrackedTree` commits the
   expanded tree (`git ls-files` and the content of `git show HEAD:<file>`), and an empty or missing `tree/` gives a
   repository with no tracked file.
4. `gates/test/registry.test.ts`, `gates/test/registry-parts.test.ts`: eighteen gates with `sandbox-paths` last.
   `tracked-tree` is accepted, and the new error text is checked. The registry entry is `{id, check, command,
   plantCommand, plantForm}` as in *Files to change*. `gates/test/ci-workflow.test.ts`: the job is named `Sandbox
   paths` and runs `pnpm run gate:sandbox-paths` after checkout (`persist-credentials: false`) and setup.
   `gates/test/gates-readme.test.ts`: nineteen required checks in the new order, and the gate's row lists its
   plants.
5. `gates/test/integration/redact-sandbox-paths.test.ts`: acceptance check 5. The inputs are built at run time. It
   checks stdin to stdout and `--in-place` on two files, including a JSON file that parses before and after. Every
   output byte outside the replaced prefixes is unchanged (compared after reversing the placeholders the test
   inserted). No output line matches the rule. A bad argument exits 2. The script's own text does not match the rule.
6. `gates/test/integration/story-redaction.test.ts`, for each script copy (`describe.each` over the two
   directories). It uses a temporary git repository with `.specify/scripts/bash/`, the story extension's
   `scripts/` and `story-config.yml` from that copy, `tooling/speckit/bin/redact-sandbox-paths.sh`, a feature
   directory with `spec.md`, `plan.md` and `tasks.md`, and `.specify/feature.json`. The test command prints a store
   path and a repository-root path (built at run time) and exits 1, and there is no setup command.
   - `red.sh 1 phase` on a test-only commit writes `red-phase.log` with `<pnpm store>` and `<repo>`, and no line
     matches the rule.
   - `tdd-check.sh 1` after a green commit: every `check-*.log` holds the placeholders and no matching line.
   - A second `tdd-check.sh 1` run, with a `red-commits` label that holds a sandbox path (`tdd-check.sh` reads labels
     as written): `tdd-check.json` and its stdout hold `<home>/` and no matching line.
   - With the redaction script removed, both scripts exit 2 with the `story:` message, and no log file exists.

   Red: the current scripts write the paths as they are, and they run without the script.
7. `gates/test/governance.test.ts`: the FR-032 test changes to acceptance check 8. It names GitHub private
   vulnerability reporting, and has no `@MOES-Media`, "Until then", "Once the repository is public" or "1.0.0".
   The 3 and 10 working days test stays. Red: the current `SECURITY.md` holds `@MOES-Media`.

The tests build every sandbox path at run time (`"/" + "root/"`, `"/" + "home/user/"`), so no test file needs an
allowed entry. The CODEOWNERS test (FR-035) is unchanged.

## Constitution Check

| Principle | Status |
|---|---|
| I to VII | Not touched: no element, token, story, baseline, manifest or package surface change. Semver `none`. |
| VIII Test-first | One test-only red commit with every test of the story, after a scaffold if needed. Each test fails on behaviour against the scaffold. No existing assertion is weakened: the count tests and the FR-032 test change to the new requirement, through the spec amendment. |
| VIII Gates are proven | The new gate has three fail plants, three pass plants and one breaking plant, judged in CI by the plant job. Its CLI is also tested directly. |
| VIII Mutation | The new and changed TypeScript gate source is mutated in CI's Mutation testing check. Survivors are killed or recorded with a reason. |
| Supply chain | The CI job pins its actions, keeps `contents: read` and checks out with `persist-credentials: false`. No secret is used. No dependency is added. |
| No personal data | The op removes container paths from the public tree. Plant identities are RFC 2606 identities. |
| Workflow | Approved triage 023. An op with one phase, reviewed like a mission phase. History is not rewritten. Every commit is signed off. |

No Complexity Tracking entry.

## Risks

- **In-flight branches** (missions 018, 019 and 020, op 022 or #57, and #54) fail `Sandbox paths` until they run the
  redaction once. The run summary says so, and names the one-time command above.
- **Required check**: the gate blocks merges only after the operator adds `Sandbox paths` to the ruleset on `main`.
- **Size**: about 411 files in the redaction commit. It is a commit of its own, so review can read it with
  `git diff --word-diff`.
- **The local plant run** selects the full set, because the op changes shared gate source. It may take long, or
  need the container engines for the visual plants. It is recorded as it ran, and CI's Plants check is the verdict.

## Stop conditions

- The work needs a new public surface (package, element, token) or a constitution change: stop, record it in
  `op.md`, and tell the operator that it is a mission.
- The rule as stated cannot be implemented with `git grep -E`, or the operator wants it widened (any `/home/<name>/`,
  scratchpad paths): stop. Triage 023 *What would change this decision* applies.
- The redaction would change anything but a matched prefix in some file (for example a JSON file that no longer
  parses): stop and report the file. Do not hand-edit evidence.
