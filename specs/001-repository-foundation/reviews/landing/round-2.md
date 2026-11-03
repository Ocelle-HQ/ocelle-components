---
round: 2
verdict: changes_requested
base: bdb9b704dceac4ac13e5c46c0e63f67c16d211fc
head: b943e9974bf6c452c6ed6e25a9172ea2d2cc7623
---

# Landing review, round 2 (PR #18, mission 001-repository-foundation)

Second-opinion review of the integrated diff `bdb9b70...b943e99` as one change landing on `main`, with a close look
at `git diff 38d4a5a..HEAD` (21 commits, 93 files): the L1-01/L1-02 fold (phase 3 rounds 7 to 8), the L1-04/L1-05
fold (phase 4 rounds 5 to 6), the shard split within files (phase 3 rounds 9 to 11) and the L1-08 skill change
(ef9d466). The phase reviews (phase 3 round 11 and phase 4 round 6, both approved, TDD check `pass`) and the CI runs
41671185705 and 41672562167 were used as input. Each L1 finding was judged from the code, not from the fix notes.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L2-01 | blocking | gates/lib/mutation/ranges.ts:126-131 (`unusable`, `unusableMutatePaths`); gates/lib/mutation/report.ts:73 (`files[file.path]?.mutants ?? []`); spec.md FR-011, "Mutation testing MUST NOT pass with changed code it did not check" | **The mutation gate still passes a changed in-scope file that Stryker never reads, when the file lies in a directory Stryker always ignores.** Stryker 10.1.1 (`core/dist/src/fs/project-reader.js:10-18`, `ALWAYS_IGNORE`) skips every entry named `node_modules`, `.git`, `.next`, `.nuxt` or `.svelte-kit`, plus `.stryker-tmp` (`tempDirName`). It matches the name in any directory, ignoring case (`nocase: true`). For such a `mutate` entry Stryker only logs `Glob pattern "<entry>" did not result in any files.` and goes on. The file is then missing from the report, counts as zero mutants (report.ts) and passes. The new input guard checks only glob metacharacters, commas, backslashes, extglobs and line terminators. Git tracks `.next/`, `.nuxt/` and `.svelte-kit/` here, since `.gitignore` lists only `node_modules/`, `.stryker-tmp/`, `reports/` and the dist paths. Reproduced with the real gate on a scratch repository built like `mutationRepo("mutation-uncovered")`: the head adds `packages/tokens/src/.next/y.ts`, which no test imports. The gate printed `mutation: 0 mutants on the changed lines of 1 file, none survived; 0 equivalent records` and exited 0. The same file moved to `packages/tokens/src/n/y.ts` gives `StringLiteral: NoCoverage` and exit 1. This is the same fail-open class as L1-01/L1-02. FR-011 as amended is not met for these paths, though no such path exists in the repository today. | Red test first. Pick one fix: (a) **Inside the operator's "Guard the input" decision:** add path segments that Stryker always ignores (`node_modules`, `.git`, `.next`, `.nuxt`, `.svelte-kit`, `.stryker-tmp`, case-insensitive) to `unusableMutatePaths`, with the cause text and contracts/gate-cli.md updated. (b) **More robust:** make Stryker's `did not result in any files` warning for any `mutate` entry exit 2, naming the entry. This closes the whole class, including future Stryker ignore rules. Either way, keep "absent from the report and read by Stryker = zero mutants". |
| L2-02 | note | specs/001-repository-foundation/verification.md §2, §4, missing §5 | **verification.md is stale for the current head.** See "Records" below. §2 cites run 41619235381 on `9140fac` with 18 shards. The head now plans 21 shards, and the green run on the head is 41675069807. §4 SC-005 still rests on the old shard layout. It does not mention the 9:49 run (41635769914) or the shard cancelled at 10:04 (41656706363) that led to the split. §5 (merge method and evidence home, plan.md § Verification item 5, L1-08) is missing. | Before sign-off, the orchestrator or operator brings §2 and §4 to the final head and adds §5. This review does not edit the file. |
| L2-03 | note | specs/001-repository-foundation/reviews/phase-1/tdd-check.json:1 (`reason_file`); 36 `check-*.log`/`red-*.log` files under reviews/phase-2 to phase-5; reviews/phase-2/sc-003-fail-demo.md:10; reviews/phase-4/sc-001-timing.md:12, :19; reviews/phase-5/round-1.md:67; reviews/plan/round-1/lens-a11y-security.yaml:58 | Committed evidence holds machine paths: the repository checkout under the sandbox home directory (`<home>/ocelle-components`) and the root user's pnpm store (`<root home>/.local/share/pnpm/store/v11`). They were already there at round 1, which flagged only the pins fixtures (L1-09). The user name is the generic `user`, so this is not personal data under FR-034. But `/ocelle-land` rule 8 forbids home-directory and root-home paths "in any commit", and the squash puts every one of these paths on `main`. | Operator: accept them as sandbox paths (record it), or scrub them in one `docs(landing):` hygiene commit before the fold, replacing them with `<repo>` and `<store>`. Do not rewrite the logs that `tdd-check.sh` regenerates. Rerun it instead. |

## Earlier findings (round 1)

| ID | Status now | Evidence from the code |
|----|------------|------------------------|
| L1-01 | **resolved** | `headerPath` (ranges.ts:65-77) reads `b/<path>` with a trailing tab cut off, and C-quoted `"b/<escaped>"` with octal and C escapes decoded as UTF-8. Any other header throws, and `mutation()` maps the throw to exit 2 before every mode, `--plan` included (mutation.ts:111-121). I checked this on a scratch repository with a real `git diff --unified=0` of `a b.ts`, `é.ts`, `q"uote.ts`, a path with a tab, `back\slash.ts`, `c[1].ts`, `x:1-2.ts` and `ok.ts`. All eight paths were read, with both `core.quotePath` settings. With `diff.noprefix=true` the real gate exits 2 and names the header. Recorded fixtures (`quoted-paths.diff`, `mnemonic-prefix.diff`, `line-terminators.diff`) cover these cases in mutation-ranges.test.ts. Red evidence: phase 3 `fix-7`. |
| L1-02 | **partly resolved; the rest is L2-01 (blocking)** | The operator chose "Guard the input". Paths with `*?[]{}!`, a comma, a backslash, `+(`/`@(`, or `\n`, `\r`, U+2028 or U+2029 now give exit 2 before Stryker runs. I checked this on the real gate with `c[1]/z.ts` and `--plan`: exit 2, path named. The absent-from-report rule is unchanged (report.ts:73), so any other path Stryker does not read still passes. L2-01 is such a case. |
| L1-03 | still a note | gates/bin/csp.ts is unchanged since round 1. No `dist/` still passes. In CI the `pnpm -r build &&` prefix still guards it. |
| L1-04 | **resolved** | `parsePlant` requires a non-empty `cause` on an `error` plant and rejects `cause` on the other kinds (plant-judge.ts:99-104). `judgePlant` passes an exit 2 only when a stderr line contains the cause (:184-189). All 13 breaking plants name a specific `<gate>: could not run: ...` cause. Checked in-process: `{"expect":"error","why":"w"}` gives "an error plant names its cause, a non-empty string". `gate:plants`: 136 plants as expected. Red evidence: phase 4 `fix-5`. |
| L1-05 | **resolved** | `base` on a pass plant is rejected (plant-judge.ts:106). Checked in-process: `{"expect":"pass","why":"w","base":"HEAD"}` gives "a pass plant may not set base". Only `mutation/error-unresolvable-base` sets `base`. |
| L1-06 | still a note | ci.yml, gates.json and registry.ts are unchanged since round 1. The mechanical checks of job commands, SHA pins and `persist-credentials` are still not made. |
| L1-07 | still a note, open | `gh api repos/Ocelle-HQ/ocelle-components/rulesets` still returns `[]`. verification.md §1 and §3 are open. |
| L1-08 | decided; the rest is a note | Operator decision: squash merge, keep the folded branch or an `archive/` ref. It is recorded in `.claude/skills/ocelle-land/SKILL.md` rule 2, step 2.8.4 and step 5.3 (ef9d466), plan.md § Verification item 5 and tasks.md "Operator verification". Still missing: tests for `tooling/speckit/bin/fold-history.sh` (no file references it from a test), and the verification.md §5 record (L2-02). |
| L1-09 | still a note | The root pnpm store path (`<root home>/.local/share/pnpm/store/v11`) is still in both pins ndjson fixtures. It is widened by L2-03. |

## New work since round 1 (lens on what the phase reviews could miss)

- **Regressions:** none found. The removed shard tests (the 250-line "shard of its own" cases, the old
  `parsePlant` error case) were replaced by tests of the amended FR-013 and FR-025 rules (mutation-shards.test.ts:94,
  :107, :124, :131, :140, :344; plants.test.ts). The diff adds no `.skip`, `.todo`, `.only`, `toBeDefined`,
  `toBeTruthy` or snapshot.
- **Shard split, cross-phase:** ci.yml is unchanged. `--plan` keeps stdout as one JSON array and writes the cut
  count to stderr only. `shards="$(...)"` captures stdout only, and the new ci-workflow.test.ts pins both job
  scripts. `selectFiles` reads a whole changed path before it tries a range suffix, so a changed file named like
  `x:1-2.ts` still selects as a whole. Stryker's `MUTATION_RANGE_REGEX` (`(.*?):(...)$`, anchored at the end)
  splits `x:1-2.ts:1-2` correctly, because a changed path always ends in `.ts`. The plan on the head gives 21 shards
  and 14 cuts, matching the CI matrix of 41675069807. The cut limit (O10-02) is accepted and documented in
  gates/README.md, spec.md FR-013, contracts/gate-cli.md and research.md R-08.
- **Completeness (step 2.7):** no gate, check or plant kind was added. The eleven gate ids are still one set across
  gates.json, `fr020` in registry.ts, the ci.yml gate jobs, the gates/README.md table and contracts/ci-checks.md.
  The registry check inside `gate:plants` passes. The new `cause` field is documented the same way in
  contracts/plants.md, data-model.md § Plant, gates/README.md and spec.md FR-025. contracts/ci-checks.md describes
  the `mutation-plan` and `mutation-shard` job scripts as ci.yml has them. The new test fixtures under
  `gates/test/fixtures/` (git-diff, mutation-split) fall under the existing R-10 fixture exclusions.
- **SC-005 margin (R11-01):** still thin. On run 41675069807 (the head) the longest shard took 8:12
  (`gates/lib/plant-judge.ts:121-216,gates/lib/plant-repo.ts:1-120`), then 7:50 and 7:39. All 21 shards were green.
  No new finding; R11-01's "bound mutants, not lines" lever stands for the operator.
- **Squash onto main:** `git merge-tree --write-tree bdb9b70 HEAD` gives tree `133854a`, which equals `HEAD^{tree}`.
  `main` is still `bdb9b70` (`git ls-remote origin main`), so the merge is clean. ci.yml runs on `pull_request`
  only, and cache.yml on a push to `main`. A squash breaks no workflow. The evidence SHAs survive only through the
  kept branch or archive ref (L1-08).

## Records

- **tasks.md:** every task is ticked: 98 `[X]`/`[x]`, no `[ ]` (T095, T096, T097 and T098 included). The "Operator
  verification" block is prose, not a task.
- **verification.md** (drafted in c3daf70, unchanged since). Accurate for the head: §1 (CODEOWNERS: no errors,
  write access still unconfirmed) and §3 (no ruleset, `[]` today). Stale:
  - §2 names run 41619235381 on `9140fac`, "the 18 `Mutation shard` jobs". The head's green run is
    https://github.com/Ocelle-HQ/ocelle-components/actions/runs/41675069807 on `b943e99`: 34 jobs, 21 shards.
  - §4 SC-005 still measures on 41613884529 and 41619235381 (whole-file shards, "plant-judge.ts ... 198 lines, at
    8:49") and is marked "done (operator decision R4-01)". It leaves out the later 9:49 (41635769914), the shard
    cancelled at 10:04 (41656706363), the split within files (O9-01, O10-01) and the current timings (8:30 and 7:35
    on 41671185705 and 41672562167, 8:12 on 41675069807).
  - §4 SC-001 timing comes from the old head. The Unit tests job on 41672562167 took about 2:43, still under 5
    minutes. Re-confirm it on the final head.
  - §5, the merge method and evidence home (plan.md § Verification item 5, tasks.md "Operator verification"), is
    missing.
- **Run summary:** `knowledge/speckit-flows/runs/001-repository-foundation.md` was last committed before the
  rounds since landing round 1. Regenerate it with `$S/summary.sh --commit` at the hygiene step (step 3).

## Test quality

- **Red evidence:** phase 3 `red-commits` gains `fix-7`, `fix-9` and `fix-10`, and phase 4 gains `fix-5`. Both
  `tdd-check.json` files are `pass`, with every red commit exiting 1 and the final tests exiting 2 on the base and
  on the scaffold.
- **Vacuous or weakened tests:** none found in `git diff 38d4a5a..HEAD -- gates/test`. The new integration case
  (`--files ... path:start-end`) checks both the exit and that no reported mutant lies outside lines 10 to 12.
- **Gap:** no test covers a changed file in a directory that Stryker always ignores (L2-01).
- **Mutation:** the full run was not repeated, as the brief asked. CI covers it on 41671185705, 41672562167 and
  41675069807, all green.

## Checks run

PATH=/opt/node26/bin, OCELLE_CHROMIUM_PATH set as instructed, on b943e99:

| Check | Result |
|---|---|
| `pnpm test` | exit 0: 1240 tests passed in 55 files (1m20s) |
| `pnpm run gate:typecheck` | exit 0 |
| `pnpm run gate:lint` | exit 0: 100 files |
| `pnpm run gate:style-lint` | exit 0: 1 file |
| `pnpm run gate:unit-tests` | exit 0: 1240 tests in 55 files |
| `pnpm run gate:test-lint` | exit 0: 57 files |
| `pnpm run gate:config-copies` | exit 0: identical |
| `pnpm run gate:pins` | exit 0: 4 manifests |
| `pnpm run gate:prefix` | exit 0: 19 files |
| `pnpm run gate:signoff -- --range bdb9b70..HEAD` | exit 0: 160 commits |
| `pnpm -r build && pnpm run gate:csp` | exit 0: 3 files |
| `pnpm run gate:plants` | exit 0: "136 plants of 11 gates and the registry judged, every plant as expected" (2m29s) |
| `gate:mutation -- --base bdb9b70 --plan` | exit 0: 21 shards; stderr "21 shards, 14 cuts within files" |
| `git merge-tree --write-tree bdb9b70 HEAD` | exit 0, tree `133854a` = `HEAD^{tree}` (`origin/main` = `bdb9b70`) |
| CI on the head, run 41675069807 | success, 34 of 34 jobs |
| Scratch probes | header parsing (L1-01), glob guard and `diff.noprefix` on the real gate, `parsePlant` (L1-04/L1-05), Stryker `ProjectReader` and the real gate on a `.next/` file (L2-01) |

## Verdict

**changes_requested**: one blocking finding (L2-01) and two notes (L2-02, L2-03). L1-01, L1-04 and L1-05 are
resolved. L1-02 is resolved except for the residual in L2-01. L1-03, L1-06, L1-07 and L1-09 stay notes. L1-08 is
decided, and its open items are a test op for fold-history.sh and verification.md §5. Everything else is ready to
land: all checks green locally and in CI on the head, plants complete, registry consistent, the merge onto `main`
clean. L2-01 is a small guard extension, or a Stryker-warning check, with a red test. Before merging, the operator
still settles L1-07 (the ruleset) and brings verification.md up to date (L2-02).
