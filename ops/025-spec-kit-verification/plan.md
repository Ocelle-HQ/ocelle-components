# Plan: Shorter phase verification and parallel Unit tests CI

## Approach

- Start at `tooling/speckit/extensions/story` and keep the installed `.specify/extensions/story` copy aligned. Extend the existing isolated replay so test selection and expected evidence are explicit per red commit, final base/scaffold overlay, and head. Match stable project, file and test identities in structured Vitest output. Carry the expected assertion evidence through replay so a failing unrelated test, no tests, or an operational failure cannot produce a pass verdict. For a genuinely new module, a missing import on the base cannot replace the assertion on the scaffold. Preserve the reviewers' existing records and history checks.
- Include runnable phase files and consumers of changed shared test helpers or fixtures. Use a conservative project or full-suite selection when coverage cannot be inferred. Keep paths as arguments rather than interpolated commands. Check staged/committed test inputs in disposable worktrees and keep setup and runner results distinct.
- Store completed sub-checks under ignored verification output. Bind reuse to the checkout and overlay contents, test selection and expected outcome, runner configuration and relevant environment/tool versions. Publish completed records atomically; ignore incomplete or corrupt records. Evidence stores both tested identities and the individual assertion result. Keep the documented full-suite command unchanged.
- Extend `.github/workflows/ci.yml` and the existing gate code under `gates/` with full-suite inventory, execution and verdict steps. Discover independently from the shard partition using the repository's Vitest configuration. Assign project/file entries deterministically, use measured durations where available, and persist inventory and results tied to the revision. Preserve serial settings within each job and isolate output across runners. Keep `unit-tests` / `Unit tests` as the aggregate check; require all planned jobs and manifests, including exact assignment and nonempty output. Do not trust a job's status alone for completeness.
- Collect an original and a sharded run on one revision in the rollout; compare project, file and test inventories and statuses. Exercise required-check failure with the gate's tests or plants. Record separate timing for setup, tests and the end-to-end workflow. Start CI as soon as a green phase is reviewable; final required checks apply to the final merge candidate.

## Test approach

Write red gate and story integration tests first in the existing Vitest test tree. Cover an expected assertion and a missing, unrelated or non-assertion failure, matching and stale resume records, interrupted evidence, and scaffold replay. Exercise a complete shard set along with missing, skipped, duplicated, failed and wrong-revision results. Test that the required Unit tests verdict cannot succeed if discovery or the matrix fails. Keep existing gate and story tests green. Record any production mutation that proves the new check can reject incomplete input.

## Files

Story extension source and installed copy, the relevant gate and CI workflow tests under `gates/test`, gate CLI/reporting and workflow helpers, `.github/workflows/ci.yml`, and the contributor workflow documentation where the changed procedure is described.

## Constitution check

Principle VIII and the required-check rules apply throughout. The plan changes test scheduling and evidence collection only. The regular full suite and all required checks still gate the final merge candidate. No package release, new public surface or constitutional exception.
