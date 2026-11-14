---
scope: landing
phase: landing
round: 1
verdict: changes_requested
base: 476602ef67c2ce6c514f8ad22c9938112d69b032
head: cc5a4c19c717e0ccd26bbe1500f96ee04983f5d1
tdd_check: pass
---

# Landing review, round 1 (PR #24, mission 006-storybook-workbench, issue #10)

This is a fresh second opinion on the integrated diff `origin/main...HEAD` (`476602e...cc5a4c1`): 84 commits and
552 files, 447 of them outside `specs/` and `knowledge/`. `origin/main` is the merge base, so the diff merges cleanly.
I used the phase reviews as input: `reviews/phase-1` to `phase-5`, all approved with TDD check `pass` and 3 blocking
findings over 7 rounds. I also used the run summary `knowledge/speckit-flows/runs/006-storybook-workbench.md` and
CI run 43445129460 on the head, which the operator reports green in every job. This review looks for what the phase
reviews missed.

Known and decided, so not raised as a finding: the stale "the first element feature (#17 or #7)" wording. It appears
in the gates/README.md "Deferred gates" row for the `@ocelle/elements` run-time CSP test (gates/README.md:194), in
research.md:676 and in 001's manifest sunset (phase-5/round-1.md R1-01). The operator will fix it in a phase 5 fold
round during this landing. I saw it in all three places.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L1-01 | blocking | specs/001-repository-foundation/contracts/ci-checks.md:14-28, :49-57, :59-67 | **The CI checks contract has neither the three new checks nor the split plant job.** Its first table still has fifteen rows. There is no `Storybook build`, `Visual regression` or `Accessibility` row, and the Plants row still says `pnpm run gate:plants`. The helper-job table has `mutation-plan` and `mutation-shard` but no `plants-plan` or `plants-shard`. Line 52 says the gate job ids are "fourteen in all", which is now seventeen. Lines 54-56 say the ruleset requires "the fifteen check names" and that gates/README.md "lists the same fifteen names". The diff does not touch the file (`git diff --stat 476602e...HEAD -- specs/001-repository-foundation` lists only plan.md). The other baselines agree on eighteen checks: gates/gates.json (three new entries), `fr020` and `plantHelperJobs` in gates/lib/registry.ts, the `storybook-build`, `visual`, `axe`, `plants-plan`, `plants-shard` and `plants` jobs in ci.yml (header line 4: "eighteen"), and the gates/README.md gate table and required-check list (gates/README.md:143-163). Only this contract is stale. The operator configures the ruleset on `main` from it. This is the same gap as 002's L1-02 and 005's L1-01. | Add rows for `Storybook build` (`pnpm run gate:storybook-build`, job id `storybook-build`; since 006), `Visual regression` (`pnpm run gate:visual -- --engine both --remove-docker-image`, the pin record step and the `visual` artifact on failure) and `Accessibility` (`pnpm run gate:axe`). Change the Plants row to the verdict job: `needs: [plants-plan, plants-shard]`, `if: always()`, the download, then `pnpm run gate:plants -- --verdict storybook/.visual/plant-shards`. Add `plants-plan` and `plants-shard` to the helper-job table, as the registry's `plantHelperJobs`. Change "fourteen in all" to seventeen and "fifteen" to "eighteen" in both places. Add a "Mission 006" paragraph that tells the operator to add `Storybook build`, `Visual regression` and `Accessibility` to the ruleset on `main`. Until the operator does, none of the three gates blocks a merge. While editing the contracts, consider also updating specs/001-repository-foundation/contracts/gate-cli.md: its `csp` row (line 37) says "(after `pnpm -r build`)", which is now `pnpm --filter "./packages/*" -r build`, and its `plants` row (line 42) has no `--plan`, `--shard` or `--verdict` mode. |
| L1-02 | blocking | gates/lib/storybook-build.ts:81 | **A mutant of new gate code survives, with no equivalent record.** `pnpm run gate:mutation -- --base 476602e --files gates/lib/storybook-build.ts:61-90` (plan shard 92) exits 1 twice in a row: `gates/lib/storybook-build.ts:81: mutation: Regex: Survived: replaced by /╭─\[ (\S+?):\d:\d+ \]/`. The mutant is not equivalent. Every Vite location in the tests and fixtures has a one-digit line (`stories/b.ts:2:1`, `stories/helper.ts:1:25`, `stories/base.stories.ts:1:8`; `grep -rnE "\.ts:[0-9]{2,}:[0-9]+ " gates/test` finds nothing). With `\d`, a build error at line 10 or later matches no location. The finding then falls back to `storybook/package.json` ("named no file"), which breaks FR-001's "each finding names the file where the build names one". Constitution VIII makes a surviving mutant in new code blocking. CI's Mutation testing job on the head is reported green. I cannot explain the difference without its log (see L1-07). | Red test first: a `buildFindings` case, or a recorded fixture, whose Vite location has a line and a column of two or more digits (for example `╭─[ stories/b.ts:12:34 ]`), expecting the finding at `storybook/stories/b.ts`. It must fail against the mutant. The current code should already pass it, so no source change is expected. Run shard 92 again until it shows none survived. |
| L1-03 | blocking | gates/lib/storybook-build.ts:113-115, :150-161; spec.md FR-001; contracts/gates.md § `storybook-build` | **A Storybook configuration that cannot be read exits 1 with a finding that names no file. FR-001 asks for exit 2.** Reproduced on a scratch root (`git archive HEAD` with the repository's `node_modules` and `storybook/node_modules` linked) where `storybook/.storybook/main.ts` is `const config = {;`. `node gates/bin/storybook-build.ts --root <tmp>` prints `storybook/package.json: storybook-build: build-error: the build failed with exit code 1 and named no file` and exits 1. Storybook's own output names the cause and the file: `SB_CORE-SERVER_0007 (MainFileEvaluationError): Storybook couldn't evaluate your .storybook/main.ts file.` FR-001 says the gate "MUST exit 2 when it cannot run (tool missing, configuration unreadable)" and that "each finding names the file where the build names one". The output breaks the second rule under any reading, and the first under the plain reading of "configuration". contracts/gates.md narrowed exit 2 to the checks before the build (`package.json`, the CLI, pnpm), so the phase 2 review judged against the narrower contract. No plant covers this. On a related point, a build ended by a signal (`exitCode === null`, for example the OOM killer or a runner timeout) is also exit 1 ("was ended by a signal"), though nothing in the tree is at fault. | Red test first, on a recorded output of the `MainFileEvaluationError` case. Then either (a) exit 2 `storybook-build: could not run: storybook/.storybook/main.ts cannot be evaluated (<first error line>)`, with a breaking plant `error-config-unreadable`, or (b) if the operator prefers exit 1, a finding at `storybook/.storybook/main.ts` with FR-001 and contracts/gates.md amended to say so. Decide the signal case with it (exit 2 "the build was ended by a signal" is my suggestion). This is an operator fork between (a) and (b). |
| L1-04 | note | gates/lib/a11y-exceptions.ts:56-59, :87-92 | An exception entry's `plan` may name any file inside the repository. The gate honours the entry when that file has a `## Complexity Tracking` heading followed by a matching row. In process, `parseExceptions` accepts `"plan": "storybook/notes.md"`, and `recordedIn` returns `recorded: true` for a text holding `## Complexity Tracking` and one table row whose cells are `a--b`, `light`, `button-name` and `button` (each in backticks) and `never`. So a serious finding can be excepted through a file that is not a plan, which no plan review reads. FR-029 and the constitution's Governance want the row in "the plan's Complexity Tracking". The exceptions file itself still changes in the diff, so a reviewer sees it. | Optional hardening: accept only `specs/<feature>/plan.md` (a path matching `^specs/[^/]+/plan\.md$`), with a breaking or fail plant that names another file. |
| L1-05 | note | gates/gates.json:126, gates/README.md:39 | The registry and the README give the `visual` command as `pnpm run gate:visual -- --engine both`. ci.yml:217 and contracts/gates.md:38 run it with `--remove-docker-image`. A contributor who copies the registry's command gets the run without the removal (it only matters for runner disk), so this is documentation drift. | Add `--remove-docker-image` to both, or state there that CI adds it. |
| L1-06 | note | .github/workflows/ci.yml:218-230 (the record step after the gate step at :217, and the `pin-record` upload) | The pin record step runs inside the required "Visual regression" check, after the gate. It reads the registry over the network, including the mutable tag (`skopeo inspect --raw "docker://$tag"`, line 226). If the tag `v1.64.1-noble` is retagged or removed, or the registry is unreachable at that moment, the required check fails on a pull request that changed nothing, even though the gate passed. The gate itself pulls by digest only. The operator decided this step ("Add the CI step", "Add the tag read", 2026-11-11 and 2026-11-12). | Optional: `continue-on-error: true` on the record and upload steps, or move them to a non-required job, so evidence collection cannot fail the gate's check. |
| L1-07 | note | gates/lib/storybook-build.ts:75, :77, :79 (shard 92); CI run 43445129460, Mutation testing | In the same shard as L1-02, four regex mutants at lines 75, 77 and 79 end as `timeout`, both times. One example: the line-mark regex at :75 loses its `^` anchor. A timeout counts as detected, so a mutant that no test kills can still pass whenever it runs slowly. Since CI reported this shard green while the line 81 mutant survives here, the CI run probably classified it differently (timeout or not generated), but I did not read the CI log. | Read the Mutation testing shard log of run 43445129460 for `gates/lib/storybook-build.ts:61-90`. If L1-02's mutant was a timeout there, the timeouts at lines 75 to 79 deserve the same test-data check (inputs whose unanchored or `{2}`-less forms would match differently). |
| L1-08 | note | storybook/baselines/ (42 files) | Constitution V: "Baselines change only in a pull request whose description says why". This PR adds all 42 baselines. I did not read PR #24 on GitHub (this review does not touch GitHub). spec.md § Assumptions says landing checks it. | Operator: confirm that PR #24's description says why the 42 baselines are added (FR-011, plan decision 29). |
| L1-09 | note | 25 files under specs/006-storybook-workbench/reviews/ (the `check-*.log` and `red-*.log` evidence of phases 1 to 5) | Personal-data scan of every file the diff adds or changes. These files carry container paths (`/home/user/ocelle-components/…`, the root pnpm store). There is no personal e-mail address (only the `example.com` and `example.org` fixtures) and no token (`ghp_`, `github_pat_`, `npm_`, `sk-ant-`, `AKIA` patterns: none). The `/work/root` and `/root/.cache` strings in gates/test/ are invented test paths. This is the same pattern 002's L1-06 noted. That note's follow-up (tdd-check and red.sh writing repository-relative paths) is still open. | None for this PR. Keep the follow-up before the repository goes public. |

## Gate boundaries and the exit contract

- **`storybook-build`** (gates/bin/storybook-build.ts, gates/lib/storybook-build.ts). Before the build, it exits 2
  when `storybook/package.json` is missing, is not JSON or has no `build` script, when the Storybook CLI is not
  resolvable from `storybook/node_modules` (both paths are checked), and when pnpm cannot start. After a build that
  exits 0, it exits 2 when `dist/index.json` is missing or unreadable (`parseIndex` throws on a missing `entries` or an
  entry without `id` or `type`). It exits 1 on an empty index, on located Vite and indexer errors, and otherwise with
  one finding at `storybook/package.json`. Every failed build is a non-zero exit, so nothing fails open. The exit
  class and the location for an unreadable `.storybook/main.ts` are L1-03. The location regex has an unkilled
  mutant (L1-02).
- **`visual`** (gates/bin/visual.ts, gates/lib/container.ts, gates/lib/visual-host.ts, gates/visual/capture.ts,
  gates/lib/visual-verdict.ts). Engine resolution exits 2 when an engine is missing. In CI (`CI` or
  `GITHUB_ACTIONS` is `true`), `auto` becomes both engines and a named single engine is refused. The pin check runs
  under each engine before its first run: the reference form, then the media type (an index or a manifest list is
  refused), then the pull by digest, then `RepoDigests`, `Os` and `Architecture`, plus `Digest` under podman. The
  capture refuses (exit 2) unless the platform, arch, Node version, `OCELLE_VISUAL_PIN` variable and
  `/ms-playwright/<browser>` all hold. The host run strips that variable, so `--engine host` can never capture. The
  container runs with `--network none`, the gate repository and the root mounted read-only, and only the run
  directory writable. `judge` throws when a run has no capture of a wanted story-theme, and `parseResult` throws on
  a malformed entry. Both are uncaught, so `main` maps them to exit 2. A missing run cannot pass. The refusing
  statuses come before the `nondeterministic`, `missing-baseline` and `differs` checks. `stray-baseline` also covers
  names that do not parse. `pnpm run gate:visual -- --engine docker` here: 42 captures match.
- **`axe`** (gates/bin/axe.ts, gates/lib/axe-verdict.ts, gates/lib/axe-rules.ts, gates/lib/a11y-exceptions.ts). It
  exits 2 when the exceptions file is not a list of complete entries, when a plan path leaves the repository, when
  axe-core is not found, when the build fails, or when there is no browser. A missing exceptions file means no
  exceptions, and a missing plan means `unrecorded-exception`. Both fail closed. The run count is
  2 × stories by construction (FR-015). A node with impact `serious` or `critical` is a finding unless an honoured
  entry claims it, and each entry claims at most one node (`matchExceptions`). `stale-exception` catches entries that
  match no node. The rule options come from axe-core's own metadata, and the harness-document list is pinned by a
  test against that metadata. The one loose point is where a `plan` may live (L1-04). `pnpm run gate:axe` here:
  `42 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted)`.
- **`csp`** now reads `packages/*/dist/` only, and the CI step builds only the packages
  (`pnpm --filter "./packages/*" -r build`). The Storybook plants moved to `pass-storybook-out-of-scope`, and the
  `.ts` parse breaking plant went with the Storybook scope. `gate:csp` here: 17 files, no finding.
- **`prefix`** keeps its Storybook scope (FR-022). Font declarations are now matched across lines and reported at
  the line where they start. This is stricter, never looser; phase 5 R1-07 notes the cost. The new fail plant
  `fail-storybook-html-multiline-monospace` proves it. `gate:prefix` here, after `pnpm -r build`: 237 files, no
  finding.
- **Plants** (gates/bin/plants.ts, gates/lib/plant-runner.ts). `--shard` writes its report for any exit. `--verdict`
  recomputes the partition from the tree and exits 2 in each of these cases: a shard with no report, a report that
  is not one, a report that names another plan, a report whose plant set differs from its shard's, and a skipped or
  not-run plant. It still runs the registry and structural checks of the whole set. With `if: always()` the verdict
  job also runs when the plan or a shard job fails, and then exits 2. The registry check fails on `--skip-container`
  in any of the three plant jobs and on `--shard` or `--plan` in `plants`. Without an engine the job exits 2 and
  names every visual plant it did not run. I found no fail-open here.
- **Mutation scope.** `scopePathspecs` and `source` both gain `gates/visual/` (FR-019, red in
  `mutation-ranges.test.ts`). `--plan` over the integrated diff gives 120 shards (3982 changed lines, 119 cuts).
- **Overlap.** `visual` and `axe` both report `render-failed`, `render-timeout`, `closed-shadow-root` and
  `pointer-target`, so one broken story gives a finding in each gate. That is by design (FR-014, FR-027, FR-031).
  axe's `color-contrast` judges rendered pixels, and `contrast` judges token pairs, so they do not overlap. The
  visual `font` rule (faces actually used) and `prefix` (monospace names in source) are different layers. The
  Storybook is built in five jobs per pull request: the three gates, Prefix (`pnpm -r build`, for the HTML entries)
  and the `storybook-integration` setup of Unit tests. That is cost, not a correctness problem.

## Design lens: new seams and public surfaces

Nothing in `packages/` changes, so no published surface moves (constitution VII). The new contributor-facing
surfaces are these:

- **Gate CLIs and `visual:update`** follow the gate CLI contract (`--root`, one line per finding, a summary, exit 2
  with a cause). `visual:update` refuses to write while any refusing or `nondeterministic` verdict exists
  (`updatePlan`). Its plant mode is closed: `plantModeProblem` rejects a non-visual plant, a missing plant,
  `baselinesOf`, and `captureAlone` without `--story`.
- **The story pointer parameter** `parameters.ocelle.pointer` is parsed strictly: exactly one key, `hover` or
  `press`, and a non-empty selector. A target that matches no element, more than one, or lies outside the viewport is
  a finding, never a silent skip. Phase 5 R1-05 notes that the selector is matched over the whole preview page. The
  README says "the story renders", which is narrower.
- **`storybook/a11y-exceptions.json`** has a closed entry shape, and each entry excepts one node. L1-04 is about
  where the row may live.
- **`storybook/visual/container.json`** pins image, digest, platform, tag, node and browser. A test ties it to
  `.node-version` and to Playwright's headless-shell revision.
- **Plant keys** (`unlinked`, `engine`, `baselinesOf`, `captureAlone`; delta keys `exceptions`, `baselines`) are
  closed enumerations, checked per gate (`gateKeysProblem`, `plantFilesProblem`, `treeProblems`).

## Accessibility and security

- **What ships:** nothing. `storybook/` is private, and `packages/` is unchanged. The only story change is
  `tabindex="0"` on the prose tables (storybook/stories/render.ts:146). Together with base.css's scroll box, it makes
  them keyboard-scrollable, as packages/styles/README.md advises, and clears `scrollable-region-focusable`. The ten
  `color-contrast-incomplete` exceptions are per node, each with a Complexity Tracking row
  (specs/006-storybook-workbench/plan.md) and a sunset op. They are 003-surface causes, as FR-029 allows.
- **CI:** top-level `contents: read` is unchanged. Every new checkout sets `persist-credentials: false`. No secret is
  used. The new actions (`upload-artifact`, `download-artifact`) are pinned by SHA. The artifacts the verdict job
  downloads come from the same run's shard jobs. The toolset removal uses `sudo rm -rf` on fixed paths only.
- **Gate processes:** the capture container has no network, the repository and root are mounted read-only, and it
  runs as the invoking user (`--user uid:gid` or `--userns=keep-id`). The host-side servers bind `127.0.0.1`, and
  `servedFile` rejects paths that leave `dist` after decoding. The page route aborts every request outside the
  origin.
- **Constitution IV:** the Storybook is no longer a CSP target (operator Q1 (a)). 002's two exceptions and 001's
  "gates absent" row are closed in their plans (FR-024). Run-time strict CSP for elements is proven in
  `packages/elements/test/browser/` (phase 5 R1-01); the README wording about it is the known stale item.

## Test quality

- **Red evidence.** Every phase's `tdd-check.json` is `pass` with no problems. The red commits are `d19eac7`
  (phase 1), `251decf` (phase 2), `40881a0` (phase 3, the last of its reds; `red.sh` overwrote the earlier ones under the same label,
  which phase 3 R1-01 records, and that review re-ran the main red `039862a`), `48cdc66` and `72b0e4c` (phase 4, fix-1) and `594d376`
  (phase 5). Each is an ancestor of HEAD after the fold (`history-map.txt`), and each changes only test files and
  fixtures plus the scaffold record. Final tests on base exit 1 or 2 in every phase. Phase 3 R1-02 explains the
  exit 2 and does not rest on it.
- **Weakened tests.** Each phase review checked `git diff <red>..HEAD` on its tests, and I found nothing they missed.
  The CSP assertions removed in phase 5 are behaviour FR-021 removes. Each has a replacement control
  (`render.test.ts:154`, the outside-request recorder). `externalise.test.ts`'s fixture families changed with a
  reason (phase 5 R1-03). No `skip`, `only`, `todo` or `fails` was added. The new tests' `try`/`catch` blocks only
  capture an error so that its `cause` can be asserted afterwards (container, plant-repo, storybook-index and
  visual-verdict tests), and none swallows a failure. `gate:test-lint`: 173 files, no finding.
- **Equivalent-mutant records** in the new non-boundary code: eight records of six kinds. I re-derived each one.
  1. `ArrayDeclaration` in `jobLines` and its two readers (registry.ts, three records). A placeholder line contains
     neither `--skip-container` nor `--shard`/`--plan`. Equivalent.
  2. `BlockStatement`, the empty `catch` of `json` (container.ts, plants.ts). It returns `undefined` either way.
     Equivalent.
  3. `StringLiteral` and `ArrayDeclaration` in `attribute` (story-checks.ts). No mutated default is a harness id or
     class. Equivalent.
  4. `EqualityOperator` and `ArithmeticOperator` on `at + 1 < list.length`. With even lengths, `<=` visits the same
     indices, and `-` adds one read of `undefined`, which never equals a name. Equivalent.
  5. `OptionalChaining` on `exceptions[entry]?.entry.reason` (axe-verdict.ts). `entry` is always an index from
     `matchExceptions`. Equivalent.

  The 475 `process boundary` records (phase 3 R1-04) each name their integration test, plant or CI job. Their cover
  is the plant run in CI, which is green on the head.
- **Mutation (sampled).** The integrated diff is 120 shards, which is too long to run here in full; CI ran it. I ran
  23 shards of the pure decision modules (results below). Every shard but 92 passes. Shard 92 has the survivor of
  L1-02.

## Checks run

Environment: Node 22.23.4 (the pin is 26.13.0), pnpm from the repository, dockerd running, no podman.
`OCELLE_CHROMIUM_PATH` was set for the browser checks and unset for Stryker.

| Check | Result |
|---|---|
| `gate:typecheck` | exit 0 |
| `gate:lint` | exit 0: 263 files |
| `gate:style-lint` | exit 0: 12 files |
| `gate:test-lint` | exit 0: 173 files |
| `gate:unit-tests` | exit 0: 3089 tests passed in 138 files (gates-integration with docker included) |
| `pnpm --filter "./packages/*" -r build && gate:csp` | exit 0: 17 files |
| `pnpm -r build && gate:prefix` | exit 0: 237 files |
| `gate:config-copies`, `gate:pins`, `gate:contrast`, `gate:brand-rules`, `gate:manifest` | exit 0 each |
| `gate:signoff -- --range 476602e..HEAD` | exit 0: 84 commits |
| `gate:storybook-build` | exit 0: built 21 stories |
| `gate:visual -- --engine docker` | exit 0: 42 captures match their baselines (docker only: no cross-engine comparison) |
| `gate:axe` | exit 0: 42 story-theme runs, 0 serious or critical; 10 notes (10 excepted) |
| `gate:mutation -- --base 476602e --plan` | 120 shards, 119 cuts |
| `gate:mutation -- --base 476602e --files <shard>` for shards 29, 30, 33 to 35, 91, 93, 94 (a11y-exceptions, axe-verdict, storybook-build) | exit 0 each: none survived (shard 33: one zero-mutant entry, type declarations) |
| the same for shard 92 (`gates/lib/storybook-build.ts:61-90`), twice | **exit 1**: one survivor at :81 (L1-02); 4 timeouts at :75 to :79 (L1-07); log `round-1-mutation-shard-92.log` |
| the same for shards 23, 36 to 38, 42, 51, 61, 66, 67, 69, 95, 96, 106, 107 (plants.ts, prefix.ts, axe-rules, capture-plan, container, mutation/ranges, plant-judge, plant-runner, png, registry, story-checks, storybook-index, storybook-serve, visual-verdict) | exit 0 each: none survived; shard 67 has 4 timeouts; the non-boundary equivalent records listed are those re-derived under Test quality |
| L1-03 reproduction (scratch root, `.storybook/main.ts` unparsable) | exit 1, `storybook/package.json: … named no file` |
| L1-04 reproduction (in process, `plan: "storybook/notes.md"`) | `recorded: true` |
| `gate:plants` | not run here. CI run 43445129460 ran all 27 plant shards and the verdict, green, under docker and podman |

## Earlier findings

This is the first landing round. The phase reviews' blocking findings (phase 1 round 1: one; phase 4 round 1: two)
were resolved in their own rounds. The phase 5 notes R1-01 to R1-07 are still open as notes. R1-01 is the known
wording, which the operator will fold during this landing.

## Verdict

`changes_requested`, with three blocking findings:

- L1-01: the stale CI checks contract. The operator must also add `Storybook build`, `Visual regression` and
  `Accessibility` to the ruleset on `main`.
- L1-02: a surviving mutant in gates/lib/storybook-build.ts:81. The fix is a test; no source change is expected.
- L1-03: the storybook-build exit contract for an unreadable `.storybook/main.ts`. Fix it test-first, or amend
  FR-001; this is an operator fork.

L1-04 to L1-09 are notes.
