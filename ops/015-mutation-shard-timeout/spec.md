# Op Specification: Mutation shards of element source get a CI-measured time limit

**Op**: `ops/015-mutation-shard-timeout` | **Created**: 2026-11-15 | **Status**: Draft
**Input**: Issue #35, triage record `triage/015-mutation-shard-timeout.md` (approved), operator decisions Q1 A,
Q2 A and Q3 A (`reviews/triage/operator-decisions.md`)

## Intent

A pull request that changes `packages/elements/src` source must get a mutation verdict in CI. Today its elements
shards can be cancelled at the 10-minute job limit, or cut off by Stryker's 5-minute dry-run default, before any
mutant is judged. Consumer need: none directly. The library's own merge gate must work for every element mission
(constitution VIII, "changed source is mutation-tested").

## User Scenarios & Testing

### User Story 1 - An element PR's mutation shards finish in CI (Priority: P1)

A maintainer opens a pull request that changes element source. The mutation plan gives it shards with
`packages/elements/src/` entries. Each such shard runs under a job limit of N minutes, and its Stryker dry run runs
under a 30-minute limit. The shard finishes and gives its verdict. Shards with no element source keep the 10-minute
limit.

**Why this priority**: It is the only story. Without it the first element mission PR (009, #15) cannot pass the
required **Mutation testing** check.

**Independent Test**: The two pinned tests, plus the CI measurement on the draft PR of 008's branch. No elements
shard is cancelled there, and the worst job time × 1.5 fits under N.

**Acceptance Scenarios**:

1. **Given** `stryker.elements.config.json` after the op, **When** it is compared with `stryker.config.json`,
   **Then** it equals that configuration plus its own Vitest config, its own report file and
   `dryRunTimeoutMinutes: 30`. `stryker.config.json` has no `dryRunTimeoutMinutes`. Before the op the elements
   configuration lacks the key and the test fails.
2. **Given** the `mutation-shard` job of `ci.yml` after the op, **When** its lines are read, **Then** its limit
   line is `    timeout-minutes: ${{ contains(matrix.shard.files, 'packages/elements/src/') && <N> || 10 }}`.
   N is at least 45 and greater than the elements dry-run limit. Before the op the line is `timeout-minutes: 10`
   and the test fails.
3. **Given** a shard whose `files` value (comma-separated entries) contains an entry under
   `packages/elements/src/`, including a shard that mixes element and other entries, **When** the job starts,
   **Then** its limit is N minutes. **Given** a shard with no such entry, **Then** its limit is 10 minutes.
4. **Given** the draft PR of 008's branch plus the provisional workflow (provisional limit 90 for elements shards),
   **When** CI runs, **Then** every elements shard finishes without being cancelled, each dry run ends under 30
   minutes, and N = max(45, ⌈worst elements shard job time × 1.5 / 5 min⌉ × 5 min).
5. **Given** 001's spec, its CI contract and `gates/README.md` after the op, **When** a reader looks up the shard
   limit, **Then** each states 10 minutes for shards without element source and N minutes for shards with it, with
   the op, the operator decisions and the measured figures cited.

### Edge Cases

- `matrix.shard.files` is a string (`shards.ts` `formatPlan` joins the entries with commas), so `contains()` does a
  substring test. A file under `packages/elements/src/` in any entry, ranged (`path:start-end`) or whole, matches.
  A path that only resembles it, such as `packages/elements/test/`, does not match.
- GitHub's `cond && a || b` gives `b` when `a` is falsy. N is a positive number, so the expression cannot fall
  through to 10 for an elements shard.
- A job limit at or below the dry-run limit plus setup would cancel the job before Stryker could report a dry-run
  timeout, and the key would have no effect in CI. The pinned test therefore requires N > `dryRunTimeoutMinutes`,
  and N ≥ 45 leaves 30 for the dry run, about 10 for mutants and about 5 for setup.
- A measured elements shard that fails for another reason (a survivor, a CompileError report) still counts, if
  Stryker's mutant run completed. A shard that ends before its dry run completes, for example in setup, is not a
  measurement and is rerun.

## Requirements

### Functional Requirements

- **OR-001**: `stryker.elements.config.json` MUST set `"dryRunTimeoutMinutes": 30`. `stryker.config.json` MUST
  NOT set it. No other Stryker key changes, the per-mutant limits included.
- **OR-002**: The `mutation-shard` job MUST set
  `timeout-minutes: ${{ contains(matrix.shard.files, 'packages/elements/src/') && <N> || 10 }}` (Q1 A). No other
  line of the job's steps, matrix or `needs` changes.
- **OR-003**: N MUST come from a CI run of the draft PR of Q2 A, by the rule of Q3 A. The run's figures and the
  derivation MUST be recorded in `ops/015-mutation-shard-timeout/measurement/README.md` before N is committed.
- **OR-004**: The tests of OR-001 and OR-002 MUST be committed red first, in a test-only commit, before the
  configuration and workflow change.
- **OR-005**: 001 FR-013 and SC-005 MUST get dated amendments that name the op, the operator decisions and the
  figures. `contracts/ci-checks.md` and `gates/README.md` MUST state both limits, and so MUST the comment at
  `ci.yml:64-65`.
- **OR-006**: No change to the gate code (`gates/lib/**`, `gates/*.ts`), the shard split, the entry or shard bounds,
  `stryker.config.json`, the Vitest configurations or the gate plants.

### Out of scope

- Shard split, entry bounds, shard filling (#23, mission 007).
- A cheaper elements dry run, such as related tests only or one shared dry run (it needs its own design).
- Limits of the other CI jobs.

## Success Criteria

- **SC-001**: In the measurement run, no elements shard is cancelled, and the worst elements shard job time × 1.5
  is at most N.
- **SC-002**: The full test suite and every gate the op touches pass. The only existing tests that change are the
  two pinned tests of OR-001 and OR-002.

## Assumptions

- Job-level `timeout-minutes` accepts the `matrix` context (GitHub Actions context availability:
  `jobs.<job_id>.timeout-minutes` allows `github, needs, strategy, matrix, vars, inputs`). The measurement run
  confirms it in practice: an elements shard that runs past 10 minutes without being cancelled shows the expression
  took effect.
- 008's branch is representative of the next element PRs: about 760 browser rows and 6 elements shards out of 12.
  When 008 and 009 are both on main the suite grows. The × 1.5 margin and the floor of 45 are the operator's
  allowance for that and for runner variance.
