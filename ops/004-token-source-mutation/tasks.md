---

description: "Task list for op 004: make the token source mutation-testable"
---

# Tasks: Make the token source mutation-testable

**Input**: `ops/004-token-source-mutation/` (op.md, spec.md, plan.md)

**Tests**: Required. Test-first per constitution VIII and plan.md *Test approach*.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, the op's one story

---

## Phase 1: Make the token source mutation-testable

**Goal**: Stryker mutates every token value and ground list in `packages/tokens/src/source.ts`, the tests kill every
mutant, `TokenName` and every output stay as they are, and the 002 records are corrected.

**Independent Test**: The whole-file Stryker run (checker off, 60-line entries) reports 0 Survived, 0 NoCoverage and 0
CompileError, with every Timeout explained. `gate:mutation -- --base <op base>` exits 0. `cmp` of the outputs built
before and after shows no difference.

### Tests for User Story 1

- [ ] T001 [US1] Baseline, no commit: build `@ocelle/tokens` (`pnpm --filter @ocelle/tokens build`) and copy `packages/tokens/dist/tokens.css`, `tokens.json` and `index.d.ts` to the scratchpad. Set up the browser alias and `OCELLE_CHROMIUM_PATH` as plan.md *Technical Context* describes.
- [ ] T002 [US1] Pre-red measurement, no commit (plan.md *Test approach*): in the working tree, drop `as const` from `main`, `stateGrounds`, `chrome` and `records` in `packages/tokens/src/source.ts`, and pass the records through the `const`-type-parameter identity function. Run Stryker directly with the checker off on `source.ts:1-60`, `61-120`, `121-180` and `181-<last>`, one at a time. Save each report and its clear-text output under `ops/004-token-source-mutation/mutation/pre-red/`, list the survivors and timeouts, then restore `source.ts` with `git checkout --` (never `git stash`).
- [ ] T003 [US1] Write the red test `packages/tokens/test/source-form.test.ts` (acceptance 1, OR-001). It parses `source.ts` with the TypeScript compiler API, finds `records`, `main`, `stateGrounds` and `chrome`, and expects no `AsExpression`, `SatisfiesExpression` or `TypeAssertion` in their initializers, naming every offender. As a non-vacuity check, the `records` initializer contains `"color-canvas"`.
- [ ] T004 [US1] For each survivor of T002 that is not equivalent, a kill-test in the matching existing test file under `packages/tokens/test/`. It asserts generator output on the real source against `expected.ts`, never the source against itself. Record each one's mutant id and pre-red status in `ops/004-token-source-mutation/mutation/README.md`. Skip this task if T002 found no survivor.
- [ ] T005 [US1] Commit T003 and T004 as the red commit (test files only, signed off). Run `.specify/extensions/story/scripts/red.sh 1 phase` and confirm that the failure is the missing behaviour: the four declarations named as offenders, no import or parse error.

### Implementation for User Story 1

- [ ] T006 [US1] In `packages/tokens/src/source.ts`, drop `as const` from `main`, `stateGrounds` and `chrome`, and pass the records through the unexported identity function `tokenRecords<const N extends string>(…)` of plan.md *Approach*, without `as const` or `satisfies`. Update the file's header comment. No record, value, order or comment beside a record changes. `packages/tokens/src/index.ts` stays unchanged.
- [ ] T007 [US1] Run `pnpm test`, `gate:typecheck`, `gate:lint` and `gate:test-lint`. Every existing test passes unchanged, including the `@ts-expect-error` at `packages/tokens/test/index.test.ts:27`. Check OR-003 by hand (a scratch `contrats:` key and a scratch `group: "colours"` both fail the typecheck, then revert) and note it in the evidence README. If the union is lost, follow plan.md *Approach* and *Stop conditions*.
- [ ] T008 [US1] Rebuild `@ocelle/tokens` and `cmp` `tokens.css` and `tokens.json` against T001's copies (no difference). Check that `dist/index.d.ts` still declares `TokenName`, and run the scratch-consumer check against the built package (rejects `cssName("color-canvs")`, accepts `cssName("color-canvas")`). Record the results in `ops/004-token-source-mutation/mutation/README.md`.
- [ ] T009 [US1] Whole-file mutation run on the final source (plan.md *Whole-file mutation run*): the four entries, checker off, one at a time, with each report and clear-text output in `ops/004-token-source-mutation/mutation/`. Write the summary table in `README.md`: mutants, Killed, Timeout, Survived, NoCoverage and CompileError per entry, the time per entry against the 176 s local bound, and every line holding a literal of a record or ground list covered by at least one mutant (SC-001).
- [ ] T010 [US1] Explain every Timeout of T009, grouped by cause, with one representative mutant applied by hand per group and the observed failure recorded. Give any survivor, or any Timeout that is only slowness, an R-08 record with its reason in `source.ts` if it is equivalent. Otherwise stop and hand back for a test-first fix round. Rerun the affected entries.
- [ ] T011 [US1] Run `pnpm run gate:mutation -- --base <op base>` with the configured checker on. It exits 0. Save the output in `ops/004-token-source-mutation/mutation/gate.log`.
- [ ] T012 [P] [US1] Write `specs/002-design-tokens/reviews/phase-2/notes.md`, the correction note. It quotes the claim at `round-1.md:39`, explains that Stryker generated no mutant in `source.ts` (it skips `TSAsExpression`; 002 phase 3 `spike.md` § 5, R1-03), and points to this op's evidence. Do not edit `round-1.md`.
- [ ] T013 [P] [US1] Add dated addenda (2026-11, op 004) after `specs/002-design-tokens/data-model.md` § Token's `TokenName` paragraph (the `as const` form) and after the § Expected tables paragraph at line 125, and after `specs/002-design-tokens/research.md` *Mutation path*. Each says what was not true before the op and what holds now, with the original text kept.
- [ ] T014 [P] [US1] Add an Update entry under 2026-11-10 to `knowledge/speckit-flows/log.md` that closes the 2026-11-04 `as const` finding (op 004). It keeps the zero-mutant gate flag as an open candidate.
- [ ] T015 [US1] Commit the green work (source, evidence, records) signed off, then run `tdd-check`.

**Checkpoint**: acceptance checks 1 to 6 of `op.md` are met, and the phase is ready for review.
