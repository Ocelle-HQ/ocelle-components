---
phase: 1
round: 1
verdict: changes_requested
base: ac12998241af8a86f9a88c043654457e41b14b53
head: 72228d2173054be5ebb7e2c23d8549da9d17c7e8
tdd_check: pass
---

# Phase 1 review, round 1

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | ops/023-public-repo-hygiene/reviews/phase-1/plants.md:5 | The plant record has `exit: 1`. One plant of 324, `visual/fail-pointer-target-below-fold`, ended with exit 2 because its container image could not be pulled (the registry request was cancelled by the peer, plants.md:343). The record's base equals `base.sha`, and its selection matches the selection at HEAD (`--list`: "every plant, by gates/bin/plants.ts", 324 of 324). But the procedure treats a recorded exit other than 0 as blocking, and the review does not judge plants again. | Record a plant run of this base that exits 0, for example by rerunning `pnpm run gate:plants -- --affected ac12998…` once the image pull works, and keep its output in `plants.md`, redacted. Or the operator records a decision that CI's Plants check stands in for this one plant. Without one of these, the phase cannot be accepted. |
| R1-02 | blocking | ops/023-public-repo-hygiene/tasks.md:73 | Task T024 of `## Phase 1:` is not ticked. Its own condition, "The exit must be 0", is not met (see R1-01). | Tick T024 once R1-01 is resolved, by the same fix. |
| R1-03 | note | tooling/speckit/bin/redact-sandbox-paths.sh:74 | The `not a regular file` reason of `--verify`, listed in FR-011 (a symlink or a gitlink with the same mode on both sides), has no test. Acceptance check 11 and T026 do not ask for one, so this is not a task gap. | Optional: add a symlink case in a later round. |
| R1-04 | note | gates/bin/sandbox-paths.ts:33-35 | The exit code of `git ls-files -z` is not checked. If it failed, the gate would report "no tracked file" (exit 2) rather than git's error. It still exits 2, so nothing passes vacuously, but the cause would mislead. | Optional: map a failing `ls-files` to `git ls-files failed` with git's first error line. |
| R1-05 | note | ops/023-public-repo-hygiene/reviews/phase-1/plants.md:4 | The plant run was made at `e7976dd`, before `28afb19`..`ba62579` (verify mode, skill and README text). Those commits change no gate source, plant or registry file, and the selection at HEAD is the same (every plant). | None. Keep this in mind for the rerun of R1-01. |

## Test quality

- **Red evidence.** `tdd-check.json` shows `pass`, with `problems: []`. Both red commits fail: `phase` `25ecc2d` (exit 1) and `fix-0` `28afb19` (exit 1, the operator's label, `triage/decisions/023-verify-label-skills.md`). The final tests fail on the base (exit 2, a missing module) and on the scaffold `c2d72a7` (exit 1). HEAD passes (`check-head.log`: 8726 tests in 258 files).
- **The right reason.** In `red-phase.log`, every new or changed test fails on an assertion or on the scaffold's `not implemented` stub, which is missing behaviour and not a setup error. The plant-job tests fail on the fixture registry's missing `fr020` entry, which is the behaviour under test. In `red-fix-0.log`, each `--verify` case fails on its assertion, because the scaffold-era script exits 2 with its usage. The five `visual.test.ts` failures in that log are the host's container engine, not this op. They pass at HEAD.
- **Scaffold.** `c2d72a7` adds four source files with neutral bodies or stubs, and no test file. Nothing is wired in.
- **No weakening after red.** Here is what `git diff 25ecc2d..HEAD -- gates/test` shows:
  - `28afb19` only adds the `--verify` describe. The existing cases are unchanged.
  - `97cc34b` makes `gates/test/sandbox-paths.test.ts` stricter. The `parseGrep` throw test goes from one malformed record to five. A record without a trailing newline is added, and so is a blank-lines stderr case. No expected value was dropped.
  - `e7976dd` updates counts mechanically for the eighteenth gate and seven plants: 15 to 16 other gates, 244 to 251 other plants, 47 to 50 problems with `missing("sandbox-paths")` added.
- **Vacuity.** Every test asserts exit codes and exact output with one `toEqual`. There are no `skip` or `only` calls, no conditional assertions, no snapshots and no swallowed errors. The `try`/`catch` in the `parseGrep` throw test maps each outcome into the asserted array, so a missing throw fails as "no error". Each `--verify` case also asserts that no output line matches the rule, that `git status --porcelain` is empty and that `ls-files -s` is unchanged.
- **Acceptance coverage.** Each of checks 1 to 8 and 11 has its test: the rule table, both in process and under `git grep -E`, the gate on temporary repositories, the plants and the `tracked-tree` builder, the registry, CI and README counts, the redaction script, both story-script copies, `SECURITY.md` and verify mode. Check 9 is a gate run. `sandbox-paths-before.txt` holds 411 findings before the redaction, and `--verify e77f5bf`, run here, gives exit 0: "407 files changed, each only by the redaction". Checks 10 and 12 are records, and they are present: the spec 001 amendments, the contracts, `gates/README.md`, `ocelle-land` step 2.9 with rules 2.3 and 8, `ocelle-run` rule 6 and `tooling/speckit/README.md`.
- **Mutation.** Not run locally. The operator's rule is CI first (tasks.md, T024: "The review reads CI's Mutation testing and Plants results"), and this reviewer does not read GitHub. The changed mutable source is `gates/lib/sandbox-paths.ts`, `expandMarkers` in `gates/lib/plant-repo.ts` and `gates/lib/registry.ts`. Every `Stryker disable` line names a process boundary and an existing integration test by its title. CI's Mutation testing check is the evidence still to read before landing.

## Checks run

All at HEAD `72228d2`, locally:

- `pnpm run gate:typecheck`: exit 0.
- `pnpm run gate:lint`: exit 0, 512 files.
- `pnpm run gate:test-lint`: exit 0, 385 files.
- `pnpm run gate:config-copies`: exit 0.
- `pnpm run gate:sandbox-paths`: exit 0, with 4532 tracked files and 4 allowed files.
- `pnpm run gate:signoff -- --range ac12998..HEAD`: 16 commits, no finding.
- `vitest run` over the 14 test files this op adds or changes: 486 tests passed. The files are the sandbox-paths unit and integration tests, redact-sandbox-paths, story-redaction, plant-repo (both), registry, registry-parts, ci-workflow, gates-readme, governance, plants, plants-job and plant-runner.
- `pnpm test` (whole suite): not completed here. It was stopped at the 30-minute limit while the visual container tests ran, so the operator's no-long-runs rule applies. I relied on `check-head.log`, where tdd-check ran the whole suite at `ba62579` and 8726 tests passed. `72228d2` adds only evidence files.
- `pnpm run gate:plants -- --affected ac12998… --list`: "every plant, by gates/bin/plants.ts (shared gate source)", 324 of 324. This matches `plants.md`.
- `redact-sandbox-paths.sh --verify e77f5bf`: exit 0, 407 files.
- `diff -r` of the two story `scripts/` directories: identical.

Constitution and plan:

- The gate pins its actions in the CI job, with `persist-credentials: false` and the shared setup, the same shape as `config-copies` (`.github/workflows/ci.yml`, the `sandbox-paths` job).
- No element, token, story or package changed.
- `SECURITY.md` names one private channel, keeps the 3 and 10 working days and asks for no public issue.
- No commit rewrites history.
- The rule, the allowed files, the placeholders and their order, the verify reasons and its exit codes follow op.md, spec.md FR-001 to FR-012 and plan.md.
- The operator decisions are followed: `023-landing-redaction.md` (the sanctioned step, not a `reviews/` exemption) and `023-verify-label-skills.md` (red label `fix-0`, and the skill edits made by the implementer).

## Earlier findings

None. This is round 1.
