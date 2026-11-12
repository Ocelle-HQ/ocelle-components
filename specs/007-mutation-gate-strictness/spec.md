# Feature Specification: Mutation gate strictness

**Feature Branch**: `claude/023-mutation-gate-strictness` (feature directory `specs/007-mutation-gate-strictness`)

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

**Consumer**: the repository's own review process (reviewers and authors of this repository), as for 001 and op 004;
no Kitty Desktop, Kitty Dashboard or Ocelle console screen is concerned.

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
  "Guard the input instead"; PR #18 landing review, 2026-11-03). The unit reported is the entry (FR-003, spec check 1,
  SPEC-1-01).
- Q: How is the CI run of FR-010 produced? → A: A measurement commit on the mission's pull request (operator,
  human:jeroennouwsdev, 2026-11-10, "Measure commit on the PR (Recommended)", spec check 1, SPEC-1-04). See
  *Assumptions*, "CI measurement".
- Q: Is a shard that holds a `source.ts` entry together with entries of other files in scope? → A: No, dropped
  (operator, human:jeroennouwsdev, 2026-11-10, "Drop it (Recommended)", spec check 1, SPEC-1-05). See *Dropped*.

### Session 2026-11-11

- Q: Lever 1 removed every `source.ts` Timeout, but with the TypeScript checker on three of the four 60-line entries
  still miss 176 s (188 s, 251 s, 283 s) and lever 2 (`concurrency` 4, 8, 12) brought none within it. Which
  amendment of 001 FR-013 (FR-014), if any? → A: "30-line entries, all files" (operator, human:jeroennouwsdev,
  2026-11-11, phase 3 stop-and-ask, `reviews/phase-3/operator-decision-fr014.md`): a file with more than 30 changed
  lines is split into entries of at most 30 changed lines (was 60), for every file; the other shard bounds (10
  entries, 250 changed lines; entries of one file never share a shard) are unchanged. **Amendment, 2026-11-11:**
  where this spec says "60-line entries" or "at most 60 changed lines" for the gate's entries (the Input quote aside,
  which is kept as given), read 30; the measurement runs of FR-009 and FR-010 are those of the 30-line entries the
  gate's `--plan` makes for the base. The earlier text is kept.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The gate shows every changed-line mutant that no test was seen killing (Priority: P1)

A reviewer reads the mutation gate's output for a pull request. Today a green run says only "N mutants on the changed
lines of M files, none survived". It does not say how many of those N were killed by a failing test, how many only
timed out, how many the type checker rejected, or that a changed file (or a range of it) yielded no mutant at all. The reviewer therefore
cannot tell a real kill from a late one, or a slow survivor from a kill, or a type-only change from the mission-002
case where "nothing was mutated" because the code was out of Stryker's reach. After this story, the gate's output lists
each such mutant and entry by location, and counts them in its summary line. The verdict stays the same.

**Why this priority**: It closes the blind spot that op 004's landing review found (L1-03) for every future change, in
every package and in gate source. It costs little and needs no heavy run to prove.

**Independent Test**: Run the mutation gate on a change whose changed lines yield at least one Timeout mutant, one
CompileError mutant and one changed file with no mutant on its changed lines, and check that the output names each by
location and that the summary counts them. Exit 0 in every such case that has no Survived or NoCoverage mutant on a
changed line.

**Acceptance Scenarios**:

1. **Given** a change whose only undecided mutant on a changed line ends as Timeout, **When** the gate runs, **Then**
   it exits 0, and its output has one line naming that mutant's path and start line (the line its findings would
   use), its mutator, its replacement and the status `Timeout`, and the summary line counts one timeout.
2. **Given** a change whose only unkilled mutant on a changed line ends as CompileError (today's `pass-compile-error`
   plant), **When** the gate runs, **Then** it exits 0, its output names that mutant the same way with the status
   `CompileError`, and the summary line counts one compile error.
3. **Given** a change to a file in mutation scope that has no mutant on its changed lines (a type-only or comment-only
   change), **When** the gate runs, **Then** it exits 0 and its output names that file's entry (its path) as having no
   mutant on its changed lines, and the summary line counts one zero-mutant entry.
4. **Given** a change whose changed-line mutants were all killed by a failing test, **When** the gate runs, **Then** it
   exits 0, lists no Timeout, CompileError or zero-mutant line, and the summary line says so (zero of each).
5. **Given** a change with a survivor and also a Timeout on changed lines, **When** the gate runs, **Then** it exits 1
   with the survivor as a finding, exactly as today, and the Timeout is still listed as a report line, apart from the
   findings.
6. **Given** a CI shard run (`--files`) whose entries include `source.ts:61-120`, which has no mutant on its changed
   lines, while `source.ts:1-60` (in another shard) has mutants, **When** the shard runs, **Then** its output names
   the entry `source.ts:61-120` exactly as given to `--files` as a zero-mutant entry and counts it, and it reports the
   shard's Timeout and CompileError mutants the same way as a whole-diff run, limited to the shard's entries. What
   other shards hold does not change the line.

---

### User Story 2 - A broad edit of the token source gets real kills and fits the CI shard limit (Priority: P2)

An author changes most of the dense record lines of `packages/tokens/src/source.ts` in one pull request, for example a
rewrite of the type or space scale. Today a whole-file run of that file takes 578 s for the entry `121-180` alone on
the sandbox, and 121 of its 681 mutants end as Timeout (op 004's runs, TypeScript checker off): every one of them is a
`""` string mutant that a test does catch (op 004 applied one per group by hand), but only after Stryker's limit of
about 32 s. CI runners are 1.5 to 3.4 times
slower, so that shard would be cancelled at CI's 10-minute limit and the pull request could not pass. After this story,
each of those mutants, under the gate's own run with the type checker on, is either killed by a failing test within
Stryker's limit or rejected by the type checker (CompileError), and each 60-line entry (30-line since 2026-11-11, FR-014) of the file finishes with a
margin that holds on CI. If the red run of FR-011a already meets these bounds, the story delivers the evidence and no
change (FR-011a).

**Why this priority**: It removes a known future blocker on the one file op 004 made mutable, and it makes User Story
1's Timeout report meaningful for that file (a Timeout there then means something new). It needs heavy runs and a CI
measurement, so it comes second.

**Independent Test**: Run the measurement run of FR-009 (the gate, one entry of `source.ts` at a time, as committed)
for every entry the gate's plan makes for a change of every line, and read each entry's report and wall time; then
read the `gate:mutation` step time of every `source.ts` shard on CI from the measurement commit's run.

**Acceptance Scenarios**:

1. **Given** the mission's final repository, **When** the measurement run of FR-009 runs for each of the gate's
   60-line entries (30-line since 2026-11-11, FR-014) of `source.ts`, **Then** every entry's report has zero Timeout, zero Survived and zero NoCoverage
   mutants, and no mutant in it has a status the gate does not know.
2. **Given** the same runs, **When** each entry's wall time is read, **Then** every entry finishes within 176 s on the
   sandbox (600 s divided by 3.4, the slowest CI factor measured so far).
3. **Given** the measurement commit of *Assumptions* on the mission's pull request, **When** CI runs every `source.ts`
   entry as a `mutation-shard` job, **Then** each such job's `gate:mutation` step takes at most 480 s as GitHub reports
   it, no such job is cancelled at its 10-minute limit, and each time is recorded with the run's link.
4. **Given** any mutant of the same record value (record name, field and theme) and mutator as one that op 004
   recorded as Timeout, **When** the measurement run of FR-009 runs, **Then** Stryker records it either as Killed,
   with a killing test that fails on an assertion about that record's value or group, or as CompileError where the
   red run of FR-011a already records it as CompileError (expected for group A, whose `""` is not a token group).
   For at least one Killed mutant of each group that has one (B and C, and A if any of its mutants ends Killed),
   this is also shown by applying the mutant by hand and running the tests (not failing because an unrelated check or
   the setup breaks).
5. **Given** the mission's final repository, **When** the token package is built, **Then** its outputs (`dist/tokens.css`,
   `dist/tokens.json`, `dist/index.d.ts`) are byte-identical to those of the base commit.

---

### Edge Cases

- A Timeout or CompileError mutant on an **unchanged** line of a changed file: not reported and not counted. Only
  changed lines decide, and only changed lines are reported (001 FR-011).
- A changed file whose report lists mutants, but none on the changed lines of an entry: that entry counts as a
  zero-mutant entry and is reported like an entry of a file the report does not list.
- A file of more than 60 changed lines (30 since 2026-11-11, FR-014) is split into range entries that never share a shard (001 FR-013). Each shard
  judges only its own entries: a range entry with no mutant on its changed lines is a zero-mutant entry even when
  another entry of the same file has mutants.
- A test-only change, or a changed file outside mutation scope: not reported as a zero-mutant entry. Only entries of
  changed files in mutation scope (package source, gate source, the Storybook paths of 002) are candidates.
- Many undecided mutants (for example 121 Timeouts): every one is listed. The output is not truncated.
- A run that ends as "could not run" (exit 2): it prints its cause as today and no report lines, because no report was
  classified.
- A RuntimeError mutant on a changed line: still killed, as 001 FR-011 says. It is not part of this report (#23 does not
  raise it). See *Assumptions*.
- An `Ignored` mutant (an FR-012 equivalent record): reported as today in the equivalent-record lines, not as an
  undecided mutant.
- A change that makes a Timeout appear in `source.ts` after this mission: reported by User Story 1, and still passes.
  The reviewer decides whether it matters.
- A run in which no entry has any mutant at all (for example a type-only change to one file): every entry is a
  zero-mutant entry and the run passes (AS3). This holds on a real Stryker run, not only on a recorded report
  (FR-008).
- The speed-up of User Story 2 must not come from fewer mutants (excluded mutators, an ignore list, disable comments in
  `source.ts`), from skipping tests, or from turning late kills into Timeouts by a shorter limit.

## Requirements *(mandatory)*

### Functional Requirements

#### The report (User Story 1)

- **FR-001**: The mutation gate MUST list, in a passing and in a failing run, every mutant on a changed line whose
  status is Timeout, one line per mutant, naming its path, line, mutator, replacement and status. "On a changed line"
  is as for findings (the mutant's range overlaps a changed range), and the line named is the one findings name: the
  mutant's start line, even where that line is itself unchanged.
- **FR-002**: The mutation gate MUST list every mutant on a changed line whose status is CompileError the same way.
- **FR-003**: The mutation gate MUST list every zero-mutant entry of the run, one line per entry, naming the entry as
  the run holds it: in a whole-diff run each changed file in mutation scope is one entry, named by its `path`; in a
  `--files` shard run each entry is named exactly as given to `--files` (`path`, or `path:start-end` for a range). A
  run judges only its own entries. "Stryker read" is not a positive signal the gate can see: an entry counts as read
  when it is in the run and the run did not end as "could not run" (exit 2), since an entry Stryker did not read
  already ends the run as exit 2 (001 FR-011, phase 3 round 12).
- **FR-004**: The gate's summary line MUST give, besides what it gives today, the number of Timeout mutants, the
  number of CompileError mutants and the number of zero-mutant entries, each also when it is zero. The plan fixes the
  exact wording in the gate contract.
- **FR-005**: The report lines of FR-001 to FR-003 MUST be told apart from findings: they are not findings, they do not
  change the exit code, and a tool that reads the gate's findings MUST NOT read them as findings: the plant judge,
  and any reader that parses the finding format `path:line: gate: rule: message` of
  `specs/001-repository-foundation/contracts/gate-cli.md`.
- **FR-006**: FR-001 to FR-004 MUST hold for a whole-diff run and for a `--files` shard run alike; a shard run reports
  only its own entries. `--plan` is unchanged.
- **FR-007**: The verdicts MUST stay as they are: Survived and NoCoverage on a changed line fail (exit 1); Killed,
  Timeout and RuntimeError are killed; CompileError is invalid; Ignored is an equivalent record; all of these pass; any
  other status, and every existing "could not run" cause, is exit 2.
- **FR-008**: Each new behaviour MUST be proven by a plant or a gate test that fails without it. At least:
  the `pass-compile-error` plant (or a test on it) checks the CompileError report line; a plant or test with a
  Timeout on a changed line checks its report line; a plant or test with a type-only or comment-only change checks the
  zero-mutant line. The zero-mutant case is also proven on a real Stryker run in which no entry has any mutant (a
  plant or an integration test), so that AS3 holds on the real gate and not only on a recorded report. Every existing
  mutation plant keeps its verdict.

#### The token source (User Story 2)

- **FR-009**: The **measurement run** of an entry is the gate itself, `gate:mutation --base <B> --files <entry>`, with
  `stryker.config.json` as committed (the TypeScript checker on), where `<B>` is a base against which every line of
  `packages/tokens/src/source.ts` is changed (the plan names it) and `<entry>` is one entry of the gate's `--plan` for
  that base. With that base, each `source.ts` entry's measurement run MUST end with zero Timeout, zero Survived and
  zero NoCoverage mutants on the sandbox. A mutant spanning a cut between two entries is mutated in no shard (001
  FR-013, accepted limit); the cut count that `--plan` reports for that base is recorded with the evidence.
- **FR-010**: Each such measurement run MUST finish within 176 s of wall time on the sandbox, measured for the whole
  command (including the gate's own diff and record scan). On CI, in the run of the measurement commit (*Assumptions*),
  every `source.ts` entry's `mutation-shard` job MUST have a `gate:mutation` step of at most 480 s as GitHub reports
  it, and no such job may be cancelled at its 10-minute limit. Every time and the run's link are recorded in the
  feature's evidence. The sandbox bound is a proxy with no margin for job setup; the CI figures decide, and both
  must hold.
- **FR-011**: In the measurement runs of FR-009 after the change, every mutant that op 004 recorded as Timeout MUST
  end as one of two statuses:
  - **Killed**, by a test that fails on an assertion about the mutated record value or group
    (`knowledge/speckit-flows/guards/vacuous-tests.md`): Stryker's report names a killing test whose assertion is on
    the record's value or group. This is expected for groups B and C, and for group A where the checker accepts the
    mutant.
  - **CompileError**, only where the red run of FR-011a already records that mutant as CompileError. This is
    expected for group A: its `""` is not a member of `Group`, and `tokenRecords` checks every record against
    `TokenRecord`. Stryker runs no test on such a mutant, so no killing test is asked for.

  The status of each such mutant in the red run and after the change is recorded with the evidence. For at least one
  Killed mutant of each op 004 Timeout group that has one (B and C, and A if any of its mutants ends Killed), the kill
  is also shown by applying the mutant by hand and running the tests. A group A mutant that ends as CompileError is
  not applied by hand: a hand run has no type check and says nothing about Stryker's status. Mutants are identified
  by record name, field, theme and mutator, not by op 004's mutant ids or line numbers, which move if the mission
  edits the text of `source.ts`.
- **FR-011a**: The red evidence for FR-009 and FR-010 MUST come from the same measurement run on the code before the
  mission's change, for every `source.ts` entry. Op 004's reports are context only: they were made with raw Stryker,
  a scratch configuration and the TypeScript checker off (`ops/004-token-source-mutation/mutation/README.md` § How the
  whole-file runs were made), so their statuses and times are not comparable with the gate's. An entry whose red
  run already meets FR-009, FR-010 and FR-011 needs no change: its green evidence is that same run plus the CI
  measurement of FR-010. If every entry meets them, User Story 2 delivers the red runs, the FR-011 record and the CI
  measurement as its evidence, and changes no code. A lever that is configuration only (test order, a Stryker or
  Vitest setting) and changes no test takes its red evidence from these runs under the exemption of constitution
  Principle VIII, and its review states why no test could fail for it; any test change still goes red first.
- **FR-012**: The change MUST NOT reach FR-009 and FR-010 by removing mutants (excluding mutators, ignoring
  `source.ts` or parts of it, disable comments), by skipping or deleting tests, by weakening an assertion, or by
  shortening Stryker's time limit so that late kills become Timeouts. It MUST NOT change the types that decide which
  `source.ts` mutants the checker rejects (`Group` and `TokenRecord` in `packages/tokens/src/generate.ts`, the
  `tokenRecords` signature in `source.ts`): not loosened to turn CompileErrors into kills, and not tightened to turn
  Timeouts into CompileErrors. It MUST NOT change the token package's built outputs.
- **FR-013**: The change MUST NOT make mutation runs of other files fail, lose kills or turn kills into Timeouts: every
  mutation plant keeps its verdict, and a before/after
  measurement run (the same command as FR-009, same base) of one entry of `packages/tokens/src/generate.ts` and one
  entry of a gate source file (the plan names both) shows no fewer Killed, no more Timeout and no more Survived or
  NoCoverage mutants after the change than before.
- **FR-014**: If FR-009 and FR-010 cannot be met by making the kills faster, the mission MUST amend 001 FR-013's entry
  or shard bound (for example a bound on mutants per entry or shard) so that they are met. The amendment is the
  operator's decision, recorded with its date, and it is part of this mission, not a follow-up.
  **Decided, 2026-11-11:** "30-line entries, all files" (*Clarifications*, session 2026-11-11).

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
- **Zero-mutant entry**: an entry of the run, of a changed file in mutation scope, with no mutant on its changed lines,
  in a run that did not end as "could not run" (FR-003). It is named as the run holds it: `path`, or `path:start-end`.
- **Entry**: as 001 FR-013 defines it, a changed file or a `path:start-end` range of at most 60 changed lines of it
  (30 since 2026-11-11, the operator's FR-014 decision). In
  a whole-diff run every changed file is one entry.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For every one of the three kinds (Timeout, CompileError, zero-mutant entry), a reviewer can find each
  instance on the changed lines from the gate's output alone, with no report file opened: checked by a plant or test
  per kind (FR-008).
- **SC-002**: No existing mutation plant changes its verdict, and gate tests hold FR-007's verdict for every status
  (Killed, Timeout, RuntimeError, CompileError, Ignored, Survived, NoCoverage, and an unknown status) with the report
  lines present, so the report lines change no exit code.
- **SC-003**: The measurement runs of every `source.ts` entry (FR-009) have 0 Timeouts, 0 survivors and 0 uncovered
  mutants, and every mutant op 004 recorded as Timeout ends as Killed with a killing test on its record, or as
  CompileError where the red run already had it so (FR-011). The red run of FR-011a gives the figures before; op 004
  recorded 121 Timeouts with the checker off.
- **SC-004**: Every such run takes at most 176 s on the sandbox (op 004: 578 s for `121-180`, checker off), and every
  `source.ts` shard's `gate:mutation` step on CI takes at most 480 s.
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
- **CI measurement** (operator, human:jeroennouwsdev, 2026-11-10, "Measure commit on the PR (Recommended)"). At
  landing, a temporary commit on the mission's pull request changes every line of `source.ts` without changing the
  token package's outputs (for example a trailing comment or trailing whitespace on each line), so that CI's
  `mutation-plan` shards every `source.ts` entry. The `gate:mutation` step time of each `source.ts` shard is recorded
  with the run's link, and the commit is then reverted on the pull request before merge. Until then FR-010's CI half is
  open, and the landing pass checks it. Where that plan puts a `source.ts` entry in one shard with other files'
  entries, the shard's step time stands for the entry's (an upper bound); it still has to meet 480 s. The evidence
  records which entries each `source.ts` shard held. If a mixed shard misses 480 s, the `source.ts` entry is measured
  again on CI in a shard that holds it alone (the plan says how that run is made), and that time decides.
- **480 s.** The CI bound is on the `gate:mutation` step; it leaves 2 minutes of the 10-minute job limit for the job's
  checkout and setup steps and for runner variance. The plan may propose another figure to the operator.
- **Where the time goes.** Op 004 found that each static `source.ts` mutant runs the whole in-process suite, that
  eight runs share four cores, and that the killing tests come after the limit. The plan chooses the lever (test
  order, a fast test or project run first, concurrency, Stryker's timeout settings with a measured reason). Its red
  evidence is the measurement run of FR-011a on the code before the change; op 004's 121 Timeouts (checker off) show
  where to look.

## Dropped (no follow-up issue)

Confirmed by the operator at the triage gate, 2026-11-10:

- A hard failure for every Timeout or CompileError on a changed line (also declined at clarify, above).
- A hard failure for a zero-mutant file (a zero-mutant entry, FR-003).
- Mutating whole files instead of changed lines.
- Mutant density in files other than `source.ts`, unless an FR-014 bound covers them by construction.

Added by this spec, for the operator at the spec gate:

- Reporting RuntimeError mutants (not raised by #23).

Decided by the operator at the spec check, 2026-11-10 (human:jeroennouwsdev, "Drop it (Recommended)", SPEC-1-05):

- A bound for a shard that holds a `source.ts` entry together with entries of other files. 001 FR-013's bounds (at
  most 10 entries and 250 changed lines per shard) govern such mixed shards as today; this mission bounds `source.ts`
  entries alone.
