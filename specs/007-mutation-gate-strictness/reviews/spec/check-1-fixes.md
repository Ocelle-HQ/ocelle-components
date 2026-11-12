# Spec check 1 — fixes

| ID | Resolution | Where |
|----|------------|-------|
| SPEC-1-01 | fixed | spec.md US1 intro, AS3, AS6 (rewritten with the `source.ts:61-120` case), Edge Cases (range entries), FR-003, FR-004, Key Entities "Zero-mutant entry" and "Entry", SC-001, Clarifications, Dropped. The unit is the entry as the run holds it: `path` in a whole-diff run, the `--files` entry verbatim (`path` or `path:start-end`) in a shard run; each run judges only its own entries; the summary counts zero-mutant entries. |
| SPEC-1-02 | fixed | spec.md FR-009 (defines the measurement run: `gate:mutation --base <B> --files <entry>`, `stryker.config.json` as committed with the checker on, `<B>` a base that changes every line of `source.ts`), FR-010 (wall time of the whole command), new FR-011a (red run repeated under the same command on the code before the change for every entry; op 004's checker-off reports are context only), US2 Independent Test, AS1, SC-003, SC-004, Assumptions "Where the time goes". |
| SPEC-1-03 | fixed | spec.md FR-010, US2 AS3, SC-004, Assumptions "480 s": the measured quantity is the `gate:mutation` step time as GitHub reports it (at most 480 s), and the job must not be cancelled at its 10-minute limit; the 2-minute reserve is for checkout, setup and variance. |
| SPEC-1-04 | answered | spec.md Clarifications, Assumptions "CI measurement", US2 AS3, FR-010: a temporary measurement commit on the mission's pull request changes every line of `source.ts` without changing outputs, CI shards it, the times are recorded with the run's link, and the commit is reverted before merge (operator, human:jeroennouwsdev, 2026-11-10, "Measure commit on the PR (Recommended)"). |
| SPEC-1-05 | answered | spec.md Clarifications, Dropped: a bound for a shard mixing a `source.ts` entry with other files' entries is dropped; 001 FR-013's bounds (10 entries, 250 changed lines) govern mixed shards as today (operator, human:jeroennouwsdev, 2026-11-10, "Drop it (Recommended)"). Assumptions "CI measurement" says a mixed shard's step time stands for the entry's as an upper bound during the measurement. |
| SPEC-1-06 | fixed | spec.md US2 AS4, FR-011: Stryker's killing test for every former Timeout mutant, applied by hand for one per group; mutants identified by record name, field, theme and mutator. |
| SPEC-1-07 | fixed | spec.md SC-002: restated as plant verdicts plus gate tests holding FR-007's verdict for every status with report lines present. |
| SPEC-1-08 | fixed | spec.md FR-013: before/after measurement run of one `generate.ts` entry and one gate source entry (named by the plan), comparing Killed, Timeout, Survived and NoCoverage counts. |
| SPEC-1-09 | fixed | spec.md FR-003, Key Entities "Zero-mutant entry": "read" means in the run, the run not having ended exit 2. |
| SPEC-1-10 | fixed | spec.md US1 Independent Test: exit 0 limited to cases without a Survived or NoCoverage mutant. |
| SPEC-1-11 | fixed | spec.md FR-009: the cut limit of 001 FR-013 applies; the `--plan` cut count is recorded with the evidence. |
| SPEC-1-12 | fixed | spec.md FR-010, US2 AS3, SC-004: 176 s is stated as a proxy; every `source.ts` shard is measured on CI in the measurement commit's run, and the CI figures decide (both must hold). |
| SPEC-1-13 | disputed: the check asks for no spec change; FR-008 already allows a gate test with a synthetic report, and the plan states which it uses for the Timeout case. | — |
| SPEC-1-14 | fixed | spec.md header "Consumer": the repository's own review process. |
