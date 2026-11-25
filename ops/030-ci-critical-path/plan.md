# Implementation plan — Shorten the CI and review path

## Mutation shadow

Start with existing `planShards` and `selectFiles`. In the opt-in path, co-locate at most two adjacent standard range entries for the same file under `packages/elements/src/` in one invocation. Pair only contiguous bounds, keep at most 60 changed lines per paired bucket, retain existing range clipping, and keep stable ordering and exact changed-line coverage. Keep the input list for each standard entry and preserve its separate mutate ranges when supported by Stryker. Leave entries with gaps, lone entries, and non-element files on the standard path. The production planner, 30-line entries, cut contract, CLI defaults, job limits, and verdict retain their behavior.

Run comparison from a manual shadow workflow on full pinned revisions. The #94 control uses base `183b20f9148e6fa0a402b23e367328f6a8683f97` and the tested tree at `4c3503fdfda2cf51bb062d2d162f76a966c6e545` (published head `99cef9887df8aded9be8e8721f38e08a4c4dac22` has the same tree). Verify source and runner identities for both arms. Collect existing Stryker dry-run and total timing lines and report outcome and elapsed time with the planned ranges and report. Require complete coverage, reports and successful behavior on deliberately planted defects. Compare mutants by path, locations, mutator and replacement, without Stryker's per-run numeric IDs. If an expanded candidate instrumenter window produces a mutant across a standard cut, identify it separately and treat a survivor as a failure. Keep any new timeout proposal tied to hosted measurements and an explicit rollout decision.

## Visual integration scheduling

Keep the existing full-capture happy path in `visual.test.ts`. Move the expensive visual finding case, independent CLI and refusal paths, and capture plus animation cases into independent integration files. Keep the original assertion text and counts, the `gates-integration` project, isolated fixtures, engine refusal and cleanup behavior. Extract only shared plumbing needed by the moved tests. Discover through the existing Unit planner. Compare the old and split scenario inventory by stable test identity and explicit old-file to new-file mapping, including original expected negative verdicts. Let observed hosted file durations guide placement. Keep the separate full Visual gate exercising Docker and Podman, with its current full story-theme inventory.

## Early evidence and handoff

Use the existing exact-revision Unit plans, shard receipts and `deferred_ci` contract. Keep explicit eligible paths for `visual.test.ts`, the split collateral Visual integration files, and `axe.test.ts`. Keep helper files and named red proof in local checks. Carry the reviewed eligible-file list into `gates/lib/story-selection.ts`; missing or stale evidence must fail. Report any consumed receipt to the reviewer with its revision, project and test identities and the matching dedicated gate. Start those checks while the reviewed source candidate is stable. Batch phase evidence, scopes and folds before publishing the final candidate for every required check.

Use Op 028's reviewed contract at `dce21bac` to build a read-only worktree-return check independently of landing that branch. Accept the pinned base and each worker's directory and exact owned paths. Verify clean status, canonical repository, same pinned base, a nonempty linear range, matching DCO sign-off and changed paths per commit. Account for old and new paths of renames. Lock the receipt to the actual returned head and fail on overlap between worker paths. Wire the orchestrator instructions to validate immediately on return and let the canonical owner stage that verified head or fall back serially. Keep red-only integration and combined green under the existing owner and phase gate.

## Write ownership

| Owner | Exact production or workflow paths |
| --- | --- |
| Mutation trial | `gates/bin/mutation.ts`, `gates/lib/mutation/shards.ts`, `gates/lib/mutation/report.ts`, `.github/workflows/mutation-shadow.yml` |
| Visual integration | `gates/test/integration/visual.test.ts`, `gates/test/integration/visual-findings.test.ts`, `gates/test/integration/visual-cli.test.ts`, `gates/test/integration/visual-capture.test.ts`, `gates/test/integration/visual-fixture.ts` |
| Early review evidence | `gates/lib/story-selection.ts`, `gates/lib/test-evidence.ts` |
| Worktree handoff | `tooling/speckit/bin/worktree-return-check.sh`, `.claude/skills/ocelle-run/SKILL.md`, `.claude/agents/planner-pim.md` |
| Canonical integration | `tooling/speckit/README.md`, `gates/README.md`, this op's phase evidence and task status |

## Verification and constitution check

Commit automated tests alone first and show their expected assertion failures. Require a passing combined replay and independent review. Run applicable typecheck, code and test lint, focused Unit and integration tests, relevant Plants, and changed-source mutation. Compare identical hosted inputs with both gate paths before drawing speed or quality conclusions. Preserve the production required-check names, complete Unit and Visual inventories, mutation verdict and packageless scope. Repository tooling rights, phase ordering and package contracts stay in force.
