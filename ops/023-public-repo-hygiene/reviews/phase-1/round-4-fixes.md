# Phase 1, review round 4 (operator round): fixes

Red commit `fix-4`: `a9ffc04` (`red.sh 1 fix-4`: `"tests_only": true, "red": true, "recorded": true`, exit 1).
`red-fix-4.log` holds red evidence with 14 failing assertions, each on a changed line and each an `AssertionError`:

- the focused path of O4-01. For each script copy, `red.sh 1 fix-4` and `tdd-check.sh 1` with `focused_runner` set
  wrote logs and records that matched the rule and held no placeholder (4). The runner run directly without the
  redaction script exited 0 and wrote its log and record (1). `runStoryCommand` rejected when the failure record
  could not be written (2), and `emitStoryReport` ignored a redaction (1).
- O4-02. A text file under a committed `.gitattributes` that marks it `-diff`, `binary`, or `-diff` from a
  subdirectory gave exit 0 where exit 1 was expected (3). `attributeFreeOptions` was missing (1).
- the plant counts: `others` 252 and the seven-plant README row (2).

The tests that already passed stayed green: the shell-path cases, the focused scripts' `story:` exit 2 when the
script is missing (the scripts check it before they hand off), the NUL-byte file under `text`, and
`test-workflow-evidence.test.ts` with its fixture now holding the redaction script. A first run of `red.sh` on the
unamended red commit was not recorded (`unchanged assertion in gates/test/plant-runner.test.ts:755`): the two count
tests changed only their expected values, not their assertion lines. The amend names the actual object in each of
them (`const dealt` and `const listed`) and changes no expected value. The rerun is `red-fix-4.log`.

`red-fix-4.log` was written by the runner from before the fix. `redact-sandbox-paths.sh --in-place` changed nothing,
because the log already held no line that matches the rule. The diagnostics are cut short, `safeLog` replaced the
root, and the `<pnpm store>` and `<repo>` in it are from test names.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O4-01 | fixed. `gates/bin/story-evidence.ts` runs every log that `tools.writeLog` writes through `redact()`, both fresh and reused evidence, after `safeLog` as before. `redact()` runs `tooling/speckit/bin/redact-sandbox-paths.sh` from the repository root (stdin to stdout, `execFileSync`). It is the script `story_redactor` resolves, so the rule has only one copy. `emitStoryReport` redacts the serialised JSON once and uses that text for both `tdd-check.json` and the printed line. If the script is missing or fails, it throws before anything is written. When `runStoryCommand` cannot write a failure record, it now sends that cause to `failure`, which prints `story-evidence: tooling/speckit/bin/redact-sandbox-paths.sh is missing or failed; …` on stderr and exits 2. Each line of `redact()` and the `writeLog` wiring carries its process-boundary `Stryker disable` record, naming the T031 tests. | `gates/test/integration/story-redaction.test.ts` "the story scripts of … with the focused runner set" (both copies: "red.sh 1 fix-4 writes red-fix-4.log …", "tdd-check.sh 1 after a green commit writes every check log and tdd-check.json …", "red.sh and tdd-check.sh exit 2 with the story: message …") and "the focused runner … without the redaction script"; `gates/test/story-entry.test.ts` "sends a failure to write the failure record to the error output" (check, red) and "redacts the phase report once …" | `gates/bin/story-evidence.ts` (`redact`, `emitStoryReport`, `runStoryCommand`, the main block); test fixture: `gates/test/integration/test-workflow-evidence.test.ts` `fixture()` copies the redaction script |
| O4-02 | fixed. `gates/lib/sandbox-paths.ts` exports `attributeFreeOptions(emptyTree)`, which returns `["-c", "core.attributesFile=/dev/null", "--attr-source=<emptyTree>"]`. `gates/bin/sandbox-paths.ts` takes the empty tree from `git -C <root> hash-object -t tree /dev/null`, then runs `git -C <root> -c core.quotePath=false <options> grep <grepArgs>` with `GIT_ATTR_NOSYSTEM=1`. `-I` stays, so binary is decided by content alone. `grepArgs` and the exit 0, 1 and 2 contract do not change. The new plant `fail-gitattributes-diff` has `*.log -diff` and `*.txt binary` and exactly its two findings. The rule's description is updated in the `sandbox-paths` row of `gates/README.md` (with the plant), in `specs/001-repository-foundation/contracts/ci-checks.md`, `gate-cli.md` and `plants.md`, and in step 2.9.2 of `.claude/skills/ocelle-land/SKILL.md` (the same options before `grep`). `op.md` and `spec.md` already had the new wording from `d0ea3eb`. | `gates/test/integration/sandbox-paths.test.ts` "exits 1 with exactly the finding of a text file that a committed .gitattributes marks $name" (`-diff`, `binary`, a subdirectory's `-diff`) and "exits 0 when a sandbox path is only in a binary file (a NUL byte) that a committed .gitattributes marks text"; `gates/test/sandbox-paths.test.ts` "attributeFreeOptions …"; `gates/test/plant-runner.test.ts` (`others` 253), `gates/test/gates-readme.test.ts` "… its eight plants" | `gates/lib/sandbox-paths.ts`, `gates/bin/sandbox-paths.ts`, `gates/plants/sandbox-paths/fail-gitattributes-diff/`, the documents named |

Commits: red `a9ffc04`, O4-01 `75391d1`, O4-02 `3160720`, and this evidence.

Checks run here: `pnpm run gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:config-copies` (exit 0), and
`gate:sandbox-paths` at every commit of this round (exit 0). `diff -r` of the two story `scripts/` directories prints
nothing. The changed test files and the story-runner unit files (10 files, 354 tests) and the whole `gates` Vitest
project (78 files, 2855 tests) pass. A scoped
`pnpm run gate:mutation -- --base 183b20f --files gates/bin/story-evidence.ts,gates/lib/sandbox-paths.ts,gates/bin/sandbox-paths.ts`
exited 0: 252 mutants on the changed lines of 3 files, none survived (15 timeouts, 28 compile errors, 29 equivalent
records). The `sandbox-paths` plants were judged locally: 8 of 8 as expected (`plants.md`, "Operator round 4").

Left to CI (operator constraint, CI first): the full unit suite, the whole Plants check and the whole Mutation testing
check.
