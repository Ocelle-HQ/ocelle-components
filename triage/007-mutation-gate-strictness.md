---
triage: 007
issues: [23]
decision: mission
target: "mutation-gate-strictness"
in_scope: [23]
out_of_scope: [1, 5, 6, 10, 11, 17, 20]
semver: none
spec_prompt: "Mission for #23 (triage/007-mutation-gate-strictness.md): the mutation gate stops hiding mutants that did not decide on changed lines (Timeout and CompileError reported by location and mutator, and a changed file Stryker read but yields zero mutants reported, with the fail-or-report policy for each settled as an amendment to 001 FR-011 at clarify), the dense token records of packages/tokens/src/source.ts are killed within Stryker's limit so a whole-file run in 60-line entries has zero Timeouts and every entry fits the 10-minute CI shard limit with CI-measured margin (amending 001 FR-013's bound only if that lever alone does not), gate plants updated for every changed verdict; no follow-up issues: anything not done is listed as dropped for the operator."
status: proposed
---

# Triage 007: Mutation gate hides Timeout and CompileError, and source.ts entries risk the CI shard limit (#23)

## Issues read

- **#23** (open, created 2026-11-10, no comments, labels, milestone, parent, sub-issues or linked PRs), read from
  the verbatim text the orchestrator passed in. GitHub itself was not read from this session.
  - It asks about two things: (a) `gates/lib/mutation/report.ts:41` passes `Timeout` and `CompileError`, so a green
    gate cannot tell a late kill from a slow survivor; (b) the whole-file run of `source.ts` took 578 s for entry
    `121-180` and 188 s for `181-230` locally. CI runners are 1.5 to 3.4 times slower, so a broad edit there would be
    cancelled at the 10-minute shard limit.
  - It lists four possible directions: stricter gate; faster kills (a fast test first, or another timeout
    factor); entry bound or shard split for dense files; and, "related", a zero-mutant flag.
- **Operator instruction for this triage:** no follow-ups. #23 already follows up op 004 (#20), which followed up
  mission 002. Every direction in #23 is therefore either in scope here or listed as dropped below.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #23 | issue (open) | in scope | This mission. |
| #20 / PR #22 / `ops/004-token-source-mutation` | op, merged (`3a247ef`) | out of scope (done); source of the evidence | It made `source.ts` mutable and measured the whole file. `mutation/README.md` has the 681/560/121 counts, the timeout groups A to C (all `StringLiteral` to `""`), the ≈32 s limit (1.5 × ≈6 s + 5 s + ≈18 s overhead) and § CI risk. The review notes are `reviews/phase-1/round-1.md` R1-01 (shard time) and `reviews/landing/round-1.md` L1-03 (`Timeout`/`CompileError`; with the checker on, lines 25, 27 `[]` and 30 `{}` are CompileError). |
| `specs/001-repository-foundation/spec.md` FR-011 | spec requirement (merged) | **amended by this mission** | It defines `Timeout` and `RuntimeError` as killed, and a CompileError mutant as invalid, "does not fail the run". The invalid rule is an operator amendment (plan squad round 3, 2026-11-02). It also says a changed file with no mutants in the report passes (PR #18 landing, "Guard the input instead"). Any change to these verdicts amends operator decisions. |
| `specs/001-repository-foundation/spec.md` FR-013, SC-005; `contracts/gate-cli.md` mutation rows; `gates/lib/mutation/shards.ts` | spec, contract, code | amended only if needed | The bounds (60 lines per entry, 10 entries and 250 lines per shard, entries of one file never share a shard) are all operator decisions. An entry bound that depends on mutant density, or a bound on mutants per shard (`findings/frontend-missions.md` § Mutation shard time: "the next lever"), would amend them. |
| `gates/README.md:29`, the mutation plants | gate docs, plants | in scope | "a `CompileError`-only change" is a pass plant today. Constitution VIII ("Gates are proven, too") requires the plants to follow every verdict that changes. |
| `stryker.config.json`, `vitest.mutation.config.ts` | config | in scope | `timeoutMS` and `timeoutFactor` are at their defaults, `concurrency` is 8 on a 4-core sandbox, and `coverageAnalysis` is `perTest`. Each static `source.ts` mutant runs every in-process test, and the killer tests (`packages/tokens/test/source-table.test.ts`, the story list tests) come after the limit. |
| 002 phase 3 R1-03 and its operator decisions; `log.md` 2026-11-04 (`:38`) and 2026-11-10 Update | decision, diary | input (zero-mutant flag) | The first R1-03 decision allowed "the mutation gate flags a changed file that yields zero mutants". The final decision chose to drop `as const` instead, and op 004 did that. The 2026-11-10 Update says the candidate "stays open". #23 names it, so it lands here or is dropped. |
| `knowledge/speckit-flows/guards/vacuous-tests.md`; constitution VIII | guard, constitution | applies | A kill claimed from a Timeout or CompileError, with no test seen failing, is a vacuous kill. |
| `log.md` 2026-11-04 (CI 1.5 to 3.4 times slower), 2026-11-05 (O6-01, `generate.ts:121-240`: 264 mutants, 670 s, cancelled in CI) | diary | applies | The same failure mode has happened before. Shard limits must be measured on CI, not only locally. |
| `triage/004-token-source-mutation.md` | earlier triage | input | Its *Risks* named both gaps (timeouts as kills, compile errors as kills) and the shard time. Its *What would change* said: shards not fitting "is a change to 001's spec (FR-013, SC-005) and needs the operator's decision first". |
| `ops/`, `specs/001` to `003` | repository | none to fold into | Op 004 and missions 001 to 003 are merged, so nothing in progress covers #23. |
| Triage 005 (#17), 006 (#10) | parallel triage (other branches) | out of scope | #17 is an element/icon issue and #10 is Storybook, visual regression and axe. Neither changes the mutation gate. If either mission's later mutation runs land after this one, they inherit its verdicts, so neither blocks this mission. |
| #1 | epic (open) | out of scope | The parent epic. #23 has no parent. |
| #5, #6 (`specs/002`, `specs/003`) | merged missions | out of scope (done) | They wrote `source.ts`, but their scope is done. |
| #11 | issue (open) | out of scope | Release v1.0.0. This mission changes no published package surface. |

## Decision

**mission.** These rules apply:

- **It needs design decisions, and they amend operator decisions.** Each verdict #23 questions is written into 001
  FR-011 by an earlier operator decision. Choosing between "fail" and "report" is a product choice for the gate. It
  has no obvious answer:
  - Failing every `Timeout` would also fail real kills by non-termination (a mutated loop bound).
  - Failing every `CompileError` would undo the "invalid" amendment. A mutant the type checker rejects can never
    ship, and `gate:typecheck` would catch it.
  - A hard zero-mutant flag would contradict "Guard the input instead" (type-only and comment-only changes pass).
  - The shard question may need a new FR-013 bound.

  These are clarify-and-squad questions, not plan details.
- **More than one story.** (1) A reviewer can see, from the gate's output alone, every changed-line mutant that did
  not decide. (2) A broad edit of `source.ts` gets real kills inside Stryker's limit and fits the CI shard limit.
  Each story can be tested on its own.
- **More than one area.** The change touches the gate code and plants (`gates/`), the mutation config at the root,
  and possibly test ordering or a fast test in `packages/tokens`.

Why not the others:
- Not an **op**: the semver is `none`, but there is an open design question, and #23 itself lists alternatives. When
  in doubt, governance errs toward review.
- Not a **fold**: nothing is in progress.
- Not **none**: `report.ts:41` still passes both states, and nothing has changed the shard risk.
- Not **decision-needed**: the questions can be scoped now and settled inside the mission's clarify step. No
  conflict between issues or constitution change has to be resolved first.

**Semver `none`.** The gate is repository tooling, so no published package, element, token or type changes. A
stricter gate may fail later pull requests that pass today. That is a governance change, and the spec records it as
an FR-011 amendment.

## Scope

In scope (#23). The spec settles each item, and this record proposes a default for each:

1. **Report every changed-line mutant that did not decide.** The gate's output lists each `Timeout` and
   `CompileError` mutant on changed lines (file, line, mutator, replacement) and counts them in its summary line.
   Proposed default: report both, fail neither. The safe, cheap way to make Timeouts fail is item 3: once the known
   timeouts are gone, any Timeout is worth a look. Whether a Timeout should fail when no test failed (for example,
   unless it carries a reasoned record like the equivalent-mutant one) is a clarify question.
2. **Report a changed file Stryker read that yields zero mutants.** This is #23's "related" direction. It is report
   only and keeps the PR #18 rule that such a file passes. The output names the file, so a reviewer can tell a
   type-only change from the 002-style "nothing was mutated" case.
3. **Kill the dense-data mutants within Stryker's limit.** Change what makes `source-table.test.ts` (and the story
   list tests) late, so the 121 `""` mutants end as Killed, not Timeout. Candidates for the plan, measured:
   - a fast test or project that runs first;
   - test ordering;
   - concurrency that matches the cores;
   - `timeoutMS` and `timeoutFactor`.

   Lowering the factor alone shortens the wait but turns more late kills into Timeouts, so it does not count as a fix
   by itself.
4. **Fit the CI shard limit.** Acceptance: a whole-file run of `source.ts` in 60-line entries has zero Timeouts and
   zero survivors, and every entry finishes within 600 s / 3.4 ≈ 176 s locally. The slowest entry is also measured
   on a CI runner. If item 3 is not enough, the mission amends FR-013 (a density-aware entry bound, or a mutants-per-
   shard bound) within this scope. It does not hand that work on.
5. **Plants and records.** Update or add gate plants for every verdict that changes (constitution VIII). Amend 001
   FR-011, FR-013 if touched, `contracts/gate-cli.md` and `gates/README.md` as dated amendments that keep the
   original text readable. Close the `log.md` zero-mutant candidate and the `findings/frontend-missions.md` § Mutation
   shard time lever if they are resolved.

**Dropped, for the operator to confirm at the gate** (no follow-up issue is proposed for any of these):

- **A hard failure for every Timeout or every CompileError.** It conflicts with FR-011's definition of a kill by
  non-termination and with the CompileError "invalid" amendment. The spec may still choose a narrower failure rule
  in item 1.
- **A hard failure for zero-mutant files.** It conflicts with "Guard the input instead". Item 2 reports these files
  instead.
- **Making the gate mutate whole files instead of changed lines.** #23 does not ask for this, and it would multiply
  every shard's time.
- **Mutant-density problems in files other than `source.ts`**, unless item 4's bound change covers them by
  construction.

## Risks and open questions

- **Issue text from the prompt.** #23 was read as given, not from GitHub. The operator should confirm that it has no
  comments that widen it.
- **Heavy evidence.** Items 3 and 4 need several whole-file Stryker runs (≈15 min locally in total before the fix)
  and at least one CI measurement. Only one heavy job can run at a time in the sandbox. The container runs Node 22
  while CI pins 26.13.0. The browser path needs `OCELLE_CHROMIUM_PATH` or the scratchpad alias.
- **Test-first for config changes.** A `stryker.config.json` or ordering change has no unit test of its own. The
  plan must name its red evidence: the op 004 reports with 121 Timeouts are the natural red run, and a gate plant
  with a known-late kill can serve as a test.
- **Changing verdicts on `main`.** If any reporting becomes a failure, a change that passes today may fail after
  this mission. The spec should check the merged branches' own changed-line runs against the new rule.
- **Kills from the wrong test.** Op 004 found that 545 of 560 kills come from `gates/test/contrast.test.ts`. A fast
  test that runs first must kill for the right reason (an assertion on the value), not because something unrelated
  breaks (`guards/vacuous-tests.md`).
- **Branch.** This record is committed on `claude/023-mutation-gate-strictness` and is not pushed. The mission's
  spec number is not reserved by this record.

## What would change this decision

- The operator chooses "report only" for items 1 and 2 and accepts the shard risk as recorded (dropping 3 and 4).
  That leaves a bounded gate-output change with no verdict change, which could run as an **op**.
- The operator wants a verdict change that the constitution's wording on mutation testing does not cover (for
  example, Timeouts as blocking findings that the review records the way it records equivalents). That is
  **decision-needed** on a constitution or FR-011 amendment before the spec.
- Item 3 turns out to need changes across every package's test layout, not only `packages/tokens` and the root
  config. The scope then grows, but it stays one mission under the no-follow-ups rule.
