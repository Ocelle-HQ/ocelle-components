---
op: 015
triage: triage/015-mutation-shard-timeout.md
issues: [35]
mode_of_work: task_execution
accountable: "human:jeroennouwsdev"
semver: none
status: started
---

# Op 015: Mutation shards of element source get a CI-measured time limit

## Intent

Every `mutation-shard` job in `.github/workflows/ci.yml` is cancelled at 10 minutes (`ci.yml:89`). A shard that
holds `packages/elements/src` source runs Stryker under `stryker.elements.config.json`. That run's dry run executes
every in-process `elements` row, whatever `--files` names. In the sandbox it took 5 m 31 s on mission 008's branch and
hit Stryker's 5-minute default dry-run limit. CI runners are 1.5 to 3.4 times slower than the sandbox. So element
mission PRs, starting with 009's (#15), would fail the required **Mutation testing** check because their shards are
cancelled, and no mutant would be judged.

This op lands before the first element mission PR. It does two things:

1. `stryker.elements.config.json` gets `"dryRunTimeoutMinutes": 30`. The value comes from mission 008's operator
   decision (008 research R-15), and 008 drops its own copy of the change. `stryker.config.json` is unchanged.
2. Shards whose `files` name `packages/elements/src/` get a job limit of N minutes. Every other shard keeps 10
   minutes. N comes from a CI measurement, not the sandbox.

Operator decisions at the triage gate (`reviews/triage/operator-decisions.md`, 2026-11-15):

- **Q1 A:** the raised limit applies only to shards whose files name `packages/elements/src/`.
- **Q2 A:** the measurement runs on a draft PR, closed unmerged, of mission 008's branch (`claude/016-overlays`) plus
  this op's provisional workflow.
- **Q3 A:** N = worst measured elements shard job time × 1.5, rounded up to a multiple of 5 minutes, and never below 45.

No gate code, shard split, entry bound or per-mutant limit changes. No public surface changes (semver `none`).
Records change too: 001 FR-013, SC-005 and `contracts/ci-checks.md` get amendments in place, and `gates/README.md`
gets a correction. On main its line 184 says each shard "runs under a 10-minute limit", although the triage record
read the file as stating no limit.

The issue body of #35 reached this session only through the triage record. The record quotes the body, which the
coordinator relayed. This session does not read GitHub.

## Acceptance

Checks 1 and 2 are tests, and both fail before the change. Checks 3 to 5 are evidence and records, not tests.

1. **The dry-run limit (red test).** `gates/test/vitest-config.test.ts` expects `stryker.elements.config.json` to be
   `stryker.config.json` plus its own Vitest config, its own report file and `dryRunTimeoutMinutes: 30`. It also
   expects `stryker.config.json` to have no `dryRunTimeoutMinutes` key. On main the first assertion fails because
   the key is missing.
2. **The shard job limit (red test).** `gates/test/ci-workflow.test.ts` pins the `mutation-shard` job's limit line as
   `    timeout-minutes: ${{ contains(matrix.shard.files, 'packages/elements/src/') && <N> || 10 }}`, with N the
   measured value. It also checks that this N is at least 45 and greater than `dryRunTimeoutMinutes` in
   `stryker.elements.config.json`. On main it fails because the line reads `timeout-minutes: 10`.
3. **The CI measurement (evidence).** `ops/015-mutation-shard-timeout/measurement/README.md` records the draft PR
   and its CI run: the 008 head SHA and the scratch head SHA it ran on, and for every shard its files, job time,
   `gate:mutation` step time, conclusion and, for the elements shards, Stryker's dry-run time. It shows N derived by
   the Q3 A rule from the worst elements shard job time. No elements shard was cancelled, and no dry run reached 30
   minutes.
4. **Records amended.** 001 `spec.md` FR-013 and SC-005 get dated amendments (op 015, operator decisions Q1 to Q3,
   the measured figures). `contracts/ci-checks.md` (the `mutation-shard` row) and `gates/README.md` (line 184)
   state the two limits. The comment at `ci.yml:64-65` states them too. Earlier text stays readable in the spec,
   and the amendment says what now reads differently.
5. **Cost recorded.** `knowledge/speckit-flows/log.md` gets an entry under 2026-11-15: every elements shard repeats
   the whole elements dry run, so runner minutes grow with each element mission. A cheaper dry run is a candidate
   for the operator, and this op files no issue for it.

## Constitution principles touched

- **VIII Test-first, proven non-vacuous.** Both behaviour changes (the configuration key and the workflow limit)
  are pinned by tests committed red first. Mutation testing itself is the reason for the op: a cancelled shard judges
  no mutant. The op raises a job limit and a dry-run limit only. Per-mutant limits (`timeoutMS`, `timeoutFactor`)
  are not touched, so no verdict of the gate is weakened. No gate code changes, so no plant is added. The mutation
  plants copy both Stryker configurations (`gates/lib/plant-repo.ts`, 008 R-15), so they run with the new key.
- **VII Semantic versioning.** No package surface changes. Semver `none`, no changelog entry.
- **Development workflow, merge gates.** The required **Mutation testing** check stays required. Only the limit
  that decides when a shard job is cancelled changes, and only for element shards.
