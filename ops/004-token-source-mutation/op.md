---
op: 004
triage: triage/004-token-source-mutation.md
issues: [20]
mode_of_work: task_execution
accountable: "human:jeroennouwsdev"
semver: none
status: started
---

# Op 004: Make the token source mutation-testable

## Intent

Stryker does not mutate inside a `[…] as const` expression (its instrumenter treats `TSAsExpression` as a type node
and does not descend into it). So `packages/tokens/src/source.ts` yields no mutant at all: not for the token records,
not for the ground lists `main`, `stateGrounds` and `chrome`. The source-table test compares every token with the
table transcribed from #5, but no mutation run has shown that it kills value mutants. A phase 2 review of mission
002 said it did (`specs/002-design-tokens/reviews/phase-2/round-1.md:39`).

Operator decision R1-03 (2026-11-04, `specs/002-design-tokens/reviews/phase-3/operator-decisions.md`): drop
`as const` from the records so that Stryker mutates the values, keep `TokenName` a literal union, and correct the
phase 2 claim. This op does that. It adds no token, changes no value, changes no gate and adds no public surface
(semver `none`): the token names, the stylesheet, the JSON export and the `TokenName` type stay as they are.

The issue's optional item, a mutation-gate flag for a changed source file that yields zero mutants, is out of
scope. The triage record leaves it out, and the operator approved the record as written.

The issue text of #20 was given to this op's setup verbatim by the orchestrator. It matches the triage record's
reading of it, and it asks for nothing more than the record holds.

## Acceptance

Checks 1 and 2 are tests. Check 1 fails before the change. Checks 3 to 6 are evidence, not tests (see the plan's
*Test approach*: a refactor with no behaviour of its own cannot have red tests for everything it keeps).

1. **The token data are mutable (red test).** A node test reads `packages/tokens/src/source.ts`, parses it with the
   TypeScript compiler API, finds the declarations `records`, `main`, `stateGrounds` and `chrome`, and asserts that
   no `as`, `satisfies` or `<T>` type assertion appears anywhere in their initializers. Against the code before the
   change it fails, naming all four. After the change it passes, also on the copy that Stryker instruments in its
   sandbox.
2. **`TokenName` stays a literal union (existing guard).** `packages/tokens/test/index.test.ts:27`
   (`// @ts-expect-error` on `cssName("color-canvs")`) still holds in `gate:typecheck`, and `tokenNames` still equals
   the names of Appendix A. No hand-kept second list of names is added. Both pass before and after the change.
3. **Outputs unchanged (recorded diff).** `dist/tokens.css` and `dist/tokens.json`, built before and after the
   change, are byte-identical (`cmp`). The emitted `dist/index.d.ts` still declares `TokenName`, and a scratch
   consumer compiled against the built package rejects `cssName("color-canvs")` and accepts
   `cssName("color-canvas")`, as in the 002 landing review.
4. **Whole-file mutation evidence.** Stryker runs over every line of `source.ts` in 60-line entries
   (`1-60`, `61-120`, …, to the last line), TypeScript checker off. Every mutant is Killed at run time, or is a
   Timeout explained in the evidence, or carries an equivalent-mutant record (R-08 form: a reasoned
   `// Stryker disable next-line <mutator>: <reason>` directly above the line). Zero Survived, zero NoCoverage, zero
   CompileError (there is no checker). Every entry finishes within 600 s / 3.4 = 176 s locally, or the measured time
   is reported to the operator as a CI risk.
5. **The gate passes.** `pnpm run gate:mutation -- --base <op base>`, with the checker on as configured, exits 0.
6. **Records corrected.** A note beside the phase 2 review (`specs/002-design-tokens/reviews/phase-2/notes.md`)
   corrects the claim at `round-1.md:39`. Dated addenda correct `data-model.md` (§ Token, the `as const` form, and
   § Expected tables at line 125) and `research.md` *Mutation path*, and an Update closes the
   `knowledge/speckit-flows/log.md` finding. The original text stays readable in every file, and the review file
   itself is not edited.

## Constitution principles touched

- **VIII Test-first, proven non-vacuous.** It is why the op exists: changed source must be mutation-tested, and a
  kill claimed with no mutant behind it is a vacuous claim. The red test is acceptance check 1. Kill-tests added for
  survivors take their red evidence from the mutation report (plan, *Test approach*). Timeouts and compile errors are
  not accepted as kills without an explanation (`knowledge/speckit-flows/guards/vacuous-tests.md`).
- **VII Semantic versioning.** The token names are public surface, and this op leaves them unchanged. `TokenName` keeps
  its literal union (acceptance 2 and 3). Semver `none`, no changelog entry.
- **II Tokens only.** No token value changes (acceptance 3).
