# Feature Specification: Mutation gate strictness

**Feature Branch**: `claude/023-mutation-gate-strictness`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Mission for #23 (triage/007-mutation-gate-strictness.md): the mutation gate stops hiding
mutants that did not decide on changed lines (Timeout and CompileError reported by location and mutator, and a changed
file Stryker read but yields zero mutants reported, with the fail-or-report policy for each settled as an amendment to
001 FR-011 at clarify), the dense token records of packages/tokens/src/source.ts are killed within Stryker's limit so a
whole-file run in 60-line entries has zero Timeouts and every entry fits the 10-minute CI shard limit with CI-measured
margin (amending 001 FR-013's bound only if that lever alone does not), gate plants updated for every changed verdict;
no follow-up issues: anything not done is listed as dropped for the operator."

**Triage**: `triage/007-mutation-gate-strictness.md` (approved by the operator, human:jeroennouwsdev, 2026-11-10).
Issue in scope: #23. Evidence: `ops/004-token-source-mutation/mutation/README.md`, op 004 review notes R1-01
(`reviews/phase-1/round-1.md`) and L1-03 (`reviews/landing/round-1.md`).

**No follow-ups** (operator instruction, 2026-11-10: "no follow ups allowed this is already a follow up from a follow
up"). Everything #23 raises is either a requirement below or listed under *Dropped*. This mission proposes and files
no follow-up issue.

## Clarifications

### Session 2026-11-10

- Q: What does the mutation gate do with a Timeout mutant on a changed line? → A: Report it, still pass (operator,
  human:jeroennouwsdev, "Report, still pass (Recommended)"). FR-011 of 001 keeps "a timeout is a kill".
- Q: What does the mutation gate do with a CompileError mutant on a changed line? → A: Report it, still pass (operator,
  human:jeroennouwsdev, "Report, still pass (Recommended)", asked again after the operator first chose "Fail" and then
  asked whether the gate checks that the code compiles. It does not: `gate:typecheck` checks the real code, and a
  CompileError is a mutated copy the type checker rejects). The 2026-11-02 amendment of 001 FR-011 ("invalid, does
  not fail the run") stands.
- Q: What does the gate do with a changed file it read that yields no mutant on its changed lines? → A: Report it,
  still pass (triage gate, approved by the operator, 2026-11-10: a hard failure was dropped because it contradicts
  "Guard the input instead"; PR #18 landing review, 2026-11-03).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The gate shows every changed-line mutant that no test was seen killing (Priority: P1)

A reviewer reads the mutation gate's output for a pull request. Today a green run says only "N mutants on the changed
lines of M files, none survived". It does not say how many of those N were killed by a failing test, how many only
timed out, how many the type checker rejected, or that a changed file yielded no mutant at all. The reviewer therefore
cannot tell a real kill from a late one, or a slow survivor from a kill, or a type-only change from the mission-002
case where "nothing was mutated" because the code was out of Stryker's reach. After this story, the gate's output lists
each such mutant and file by location, and counts them in its summary line. The verdict stays the same.

**Why this priority**: It closes the blind spot that op 004's landing review found (L1-03) for every future change, in
every package and in gate source. It costs little and needs no heavy run to prove.

**Independent Test**: Run the mutation gate on a change whose changed lines yield at least one Timeout mutant, one
CompileError mutant and one changed file with no mutant on its changed lines, and check that the output names each by
location and that the summary counts them. Exit 0 in every case.

**Acceptance Scenarios**:

1. **Given** a change whose only undecided mutant on a changed line ends as Timeout, **When** the gate runs, **Then**
   it exits 0, and its output has one line naming that mutant's path and line, its mutator, its replacement and the
   status `Timeout`, and the summary line counts one timeout.
2. **Given** a change whose only unkilled mutant on a changed line ends as CompileError (today's `pass-compile-error`
   plant), **When** the gate runs, **Then** it exits 0, its output names that mutant the same way with the status
   `CompileError`, and the summary line counts one compile error.
3. **Given** a change to a file in mutation scope that Stryker read and that has no mutant on its changed lines (a
   type-only or comment-only change), **When** the gate runs, **Then** it exits 0 and its output names that file as
   having no mutant on its changed lines, and the summary line counts it.
4. **Given** a change whose changed-line mutants were all killed by a failing test, **When** the gate runs, **Then** it
   exits 0, lists no Timeout, CompileError or zero-mutant line, and the summary line says so (zero of each).
5. **Given** a change with a survivor and also a Timeout on changed lines, **When** the gate runs, **Then** it exits 1
   with the survivor as a finding, exactly as today, and the Timeout is still listed as a report line, apart from the
   findings.
6. **Given** a CI shard run (`--files`), **When** the shard's entries yield Timeout, CompileError or zero-mutant
   entries, **Then** that shard's output reports them the same way, limited to the shard's entries.

---

### User Story 2 - A broad edit of the token source gets real kills and fits the CI shard limit (Priority: P2)

An author changes most of the dense record lines of `packages/tokens/src/source.ts` in one pull request, for example a
rewrite of the type or space scale. Today a whole-file run of that file takes 578 s for the entry `121-180` alone on
the sandbox, and 121 of its 681 mutants end as Timeout: every one of them is a `""` string mutant that a test does
catch (op 004 applied all 121 by hand), but only after Stryker's limit of about 32 s. CI runners are 1.5 to 3.4 times
slower, so that shard would be cancelled at CI's 10-minute limit and the pull request could not pass. After this story,
those mutants are killed by a failing test within Stryker's limit, and each 60-line entry of the file finishes with a
margin that holds on CI.

**Why this priority**: It removes a known future blocker on the one file op 004 made mutable, and it makes User Story
1's Timeout report meaningful for that file (a Timeout there then means something new). It needs heavy runs and a CI
measurement, so it comes second.

**Independent Test**: Run the mutation tool on the whole of `source.ts` in the entries the gate's plan makes for a
change of every line, one entry at a time, and read each entry's report and wall time; then run the slowest entry as a
CI shard and read its time.

**Acceptance Scenarios**:

1. **Given** the mission's final repository, **When** every line of `source.ts` is mutated in the gate's 60-line
   entries, **Then** every entry's report has zero Timeout, zero Survived and zero NoCoverage mutants, and no mutant
   in it has a status the gate does not know.
2. **Given** the same runs, **When** each entry's wall time is read, **Then** every entry finishes within 176 s on the
   sandbox (600 s divided by 3.4, the slowest CI factor measured so far).
3. **Given** the slowest of those entries, **When** it runs as a `mutation-shard` job on a GitHub runner, **Then** it
   finishes within 480 s (80 % of the 10-minute job limit), and the measured time is recorded with the run's link.
4. **Given** any of the 121 mutants that op 004 recorded as Timeout, **When** it is applied to `source.ts` and the
   tests run, **Then** at least one test fails on an assertion about the mutated record (not because an unrelated check
   or the setup breaks), and Stryker records that mutant as Killed.
5. **Given** the mission's final repository, **When** the token package is built, **Then** its outputs (`dist/tokens.css`,
   `dist/tokens.json`, `dist/index.d.ts`) are byte-identical to those of the base commit.

---

### Edge Cases

- A Timeout or CompileError mutant on an **unchanged** line of a changed file: not reported and not counted. Only
  changed lines decide, and only changed lines are reported (001 FR-011).
- A changed file whose report lists mutants, but none on its changed lines: it counts as a zero-mutant file and is
  reported like a file the report does not list.
- A test-only change, or a changed file outside mutation scope: not reported as a zero-mutant file. Only changed files
  in mutation scope (package source, gate source, the Storybook paths of 002) are candidates.
- Many undecided mutants (for example 121 Timeouts): every one is listed. The output is not truncated.
- A run that ends as "could not run" (exit 2): it prints its cause as today and no report lines, because no report was
  classified.
- A RuntimeError mutant on a changed line: still killed, as 001 FR-011 says. It is not part of this report (#23 does not
  raise it). See *Assumptions*.
- An `Ignored` mutant (an FR-012 equivalent record): reported as today in the equivalent-record lines, not as an
  undecided mutant.
- A change that makes a Timeout appear in `source.ts` after this mission: reported by User Story 1, and still passes.
  The reviewer decides whether it matters.
- The speed-up of User Story 2 must not come from fewer mutants (excluded mutators, an ignore list, disable comments in
  `source.ts`), from skipping tests, or from turning late kills into Timeouts by a shorter limit.

## Requirements *(mandatory)*

### Functional Requirements

#### The report (User Story 1)

- **FR-001**: The mutation gate MUST list, in a passing and in a failing run, every mutant on a changed line whose
  status is Timeout, one line per mutant, naming its path, line, mutator, replacement and status.
- **FR-002**: The mutation gate MUST list every mutant on a changed line whose status is CompileError the same way.
- **FR-003**: The mutation gate MUST list every changed file in mutation scope that Stryker read and that has no mutant
  on its changed lines, one line per file, naming its path.
- **FR-004**: The gate's summary line MUST give, besides what it gives today, the number of Timeout mutants, the
  number of CompileError mutants and the number of zero-mutant files, each also when it is zero. The plan fixes the
  exact wording in the gate contract.
- **FR-005**: The report lines of FR-001 to FR-003 MUST be told apart from findings: they are not findings, they do not
  change the exit code, and a tool that reads the gate's findings (the CI annotation, the plant judge) MUST NOT read
  them as findings.
- **FR-006**: FR-001 to FR-004 MUST hold for a whole-diff run and for a `--files` shard run alike; a shard run reports
  only its own entries. `--plan` is unchanged.
- **FR-007**: The verdicts MUST stay as they are: Survived and NoCoverage on a changed line fail (exit 1); Killed,
  Timeout and RuntimeError are killed; CompileError is invalid; Ignored is an equivalent record; all of these pass; any
  other status, and every existing "could not run" cause, is exit 2.
- **FR-008**: Each new behaviour MUST be proven by a plant or a gate test that fails without it. At least:
  the `pass-compile-error` plant (or a test on it) checks the CompileError report line; a plant or test with a
  Timeout on a changed line checks its report line; a plant or test with a type-only or comment-only change checks the
  zero-mutant line. Every existing mutation plant keeps its verdict.

#### The token source (User Story 2)

- **FR-009**: With every line of `packages/tokens/src/source.ts` changed, each entry of the gate's plan for that file
  MUST end with zero Timeout, zero Survived and zero NoCoverage mutants on the sandbox.
- **FR-010**: Each such entry MUST finish within 176 s on the sandbox, and the slowest MUST finish within 480 s as a
  `mutation-shard` job on a GitHub runner, with the time and the run recorded in the feature's evidence.
- **FR-011**: Every kill that replaces an op 004 Timeout MUST come from a test that fails on an assertion about the
  mutated record value or group (`knowledge/speckit-flows/guards/vacuous-tests.md`), shown for at least one mutant of
  each op 004 Timeout group (A, B and C).
- **FR-012**: The change MUST NOT reach FR-009 and FR-010 by removing mutants (excluding mutators, ignoring
  `source.ts` or parts of it, disable comments), by skipping or deleting tests, by weakening an assertion, or by
  shortening Stryker's time limit so that late kills become Timeouts. It MUST NOT change the token package's built
  outputs.
- **FR-013**: The change MUST NOT make mutation runs of other files fail, lose kills or turn kills into Timeouts: every
  mutation plant keeps its verdict, and the plant job still finishes within its CI time limit.
- **FR-014**: If FR-009 and FR-010 cannot be met by making the kills faster, the mission MUST amend 001 FR-013's entry
  or shard bound (for example a bound on mutants per entry or shard) so that they are met. The amendment is the
  operator's decision, recorded with its date, and it is part of this mission, not a follow-up.

#### Records

- **FR-015**: The mission MUST record, as dated amendments that keep the earlier text readable: in
  `specs/001-repository-foundation/spec.md` FR-011, the report of FR-001 to FR-004 and the operator's decisions above;
  FR-013 and SC-005 of 001 if FR-014 changes a bound; the mutation rows of
  `specs/001-repository-foundation/contracts/gate-cli.md` and of `gates/README.md`.
- **FR-016**: The mission MUST close what it resolves in `knowledge/speckit-flows/` (the zero-mutant candidate of
  `log.md`, 2026-11-04 and 2026-11-10; the "next lever" of `findings/frontend-missions.md` § Mutation shard time),
  saying how each was resolved.

### Key Entities

- **Undecided mutant**: a mutant on a changed line that no test was seen failing on, but that does not fail the gate:
  status Timeout or CompileError. It has a path, a line, a mutator, a replacement and a status.
- **Zero-mutant file**: a changed file in mutation scope that Stryker read and that has no mutant on its changed lines.
- **Entry**: as 001 FR-013 defines it, a changed file or a `path:start-end` range of at most 60 changed lines of it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For every one of the three kinds (Timeout, CompileError, zero-mutant file), a reviewer can find each
  instance on the changed lines from the gate's output alone, with no report file opened: checked by a plant or test
  per kind (FR-008).
- **SC-002**: No existing mutation plant changes its verdict, and no pull request that passes the gate before this
  mission fails it after for a reason this mission adds.
- **SC-003**: A whole-file run of `source.ts` in the gate's entries has 0 Timeouts, 0 survivors and 0 uncovered
  mutants (down from 121 Timeouts in op 004).
- **SC-004**: The slowest entry of that run takes at most 176 s on the sandbox (down from 578 s) and at most 480 s on
  a GitHub runner.
- **SC-005**: The token package's built outputs are byte-identical before and after the mission.

## Assumptions

- **Policy.** Report and pass, for all three kinds: the operator's answers in *Clarifications*. So the verdict of
  every run is the one it has today, and the parallel missions for #17 and #10 see more output from the mutation gate
  but no new failure.
- **RuntimeError** stays a kill and is not reported: #23 and its evidence do not raise it. Listed under *Dropped* so
  the operator can see it.
- **Sandbox.** The sandbox numbers come from the container op 004 used (4 cores, Node 22; CI pins Node 26.13.0), with
  `OCELLE_CHROMIUM_PATH` and the browsers-path alias of `knowledge/speckit-flows/findings/frontend-missions.md`
  § Browser path. Only one heavy job (browser tests, mutation, plants) runs at a time.
- **CI measurement.** Pull-request CI runs only on `pull_request`, so the CI time of FR-010 is measured on the
  mission's pull request (at landing), or on a run the operator starts; the plan names which. Until then FR-010's CI
  half is open, and the landing pass checks it.
- **480 s.** The CI bound leaves 2 minutes of the 10-minute job limit for setup and runner variance; the plan may
  propose another figure to the operator.
- **Where the time goes.** Op 004 found that each static `source.ts` mutant runs the whole in-process suite, that
  eight runs share four cores, and that the killing tests come after the limit. The plan chooses the lever (test
  order, a fast test or project run first, concurrency, Stryker's timeout settings with a measured reason) and its red
  evidence: op 004's reports with 121 Timeouts are the natural red run.

## Dropped (no follow-up issue)

Confirmed by the operator at the triage gate, 2026-11-10:

- A hard failure for every Timeout or CompileError on a changed line (also declined at clarify, above).
- A hard failure for a zero-mutant file.
- Mutating whole files instead of changed lines.
- Mutant density in files other than `source.ts`, unless an FR-014 bound covers them by construction.

Added by this spec, for the operator at the spec gate:

- Reporting RuntimeError mutants (not raised by #23).
