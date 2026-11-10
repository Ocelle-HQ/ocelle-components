---
triage: 004
issues: [20]
decision: op
target: "token-source-mutation"
in_scope: [20]
out_of_scope: [1, 5, 6, 10, 11]
semver: none
spec_prompt: "Op 004 for #20 (triage/004-token-source-mutation.md): drop `as const` from the token records and ground lists in packages/tokens/src/source.ts so Stryker generates their value mutants, keep `TokenName` a literal union with no hand-kept duplicate name list (the index.test.ts @ts-expect-error and the built .d.ts must still hold), run the mutation gate over the whole of source.ts (not only the changed lines) in 60-line entries within the 10-minute shard limit with every mutant killed or recorded as equivalent and every timeout explained, keep the stylesheet, JSON export and token names byte-identical, and correct the phase 2 claim (specs/002-design-tokens/reviews/phase-2/round-1.md:39, data-model.md:125) as operator decision R1-03 requires; no new token, no gate change."
status: approved
decided_by: "human:jeroennouwsdev"
decided_at: 2026-11-10T00:11:28Z
---

# Triage 004: Make the token source mutation-testable (#20)

## Issues read

**Limitation, read first.** GitHub could not be read from this session: `gh issue view` fails (GraphQL is blocked
from Claude Code sessions) and `gh api` (REST) was denied by the permission system. No GitHub MCP tool was
available. The body, comments, labels, milestone and timeline of #20 were therefore **not read**. Everything below
about #20 comes from what this repository records about it:

- `knowledge/speckit-flows/findings/frontend-missions.md`: "Stryker does not mutate inside `[…] as const`, so source
  data written that way is never mutation-tested. (002 phase 3, #20)".
- `triage/003-base-styles.md` and `specs/003-base-styles/spec.md:708`: #20 is "drop `as const` in the token source",
  open, an op, independent of #6.
- `specs/002-design-tokens/reviews/phase-3/operator-decisions.md`, decision **R1-03** (human:jeroennouwsdev,
  2026-11-04): a follow-up op after mission 002 that **drops `as const`** from the token records in
  `packages/tokens/src/source.ts`, so that Stryker generates the value mutants the source-table test must kill;
  `TokenName` must stay a literal union without it; the op also corrects the phase 2 claim that those mutants were
  killed. (The first R1-03 decision also allowed "have the mutation gate flag a changed file that yields zero
  mutants"; the later decision chose dropping `as const`.)

The operator should confirm that the issue text of #20 says no more than this (for example that it does not also
ask for the zero-mutant flag in the mutation gate) before the op is set up.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #20 | issue (open, per triage 003) | in scope | This op. |
| 002 phase 3 review R1-03 and its operator decisions | review finding, decision | source of the op, in scope | `reviews/phase-3/round-1.md:18`: Stryker's instrumenter treats `TSAsExpression` as a type node and does not descend into it, so `source.ts` yields 0 mutants and the mutation gate passes it silently. The decision fixes the approach (drop `as const`, keep `TokenName` literal, correct the phase 2 record). |
| `specs/002-design-tokens/reviews/phase-3/spike.md` § 5 | measurement | input | A scratch run with `as const` dropped on `source.ts:1-120`, TypeScript checker off: **343 mutants, 303 killed, 40 timeouts, 0 survived, 5 min 4 s**. It also showed that dropping `as const` widens `TokenName` to `string`, which makes the `@ts-expect-error` in `packages/tokens/test/index.test.ts` unused and fails the checker's initial compile. |
| 002 landing review L1 ("Design lens") | review note | constrains | "The follow-up op that drops `as const` must keep this": `TokenName` a literal union through the built `.d.ts`, guarded by `packages/tokens/test/index.test.ts:27`. |
| `specs/002-design-tokens/reviews/phase-2/round-1.md:39`, `data-model.md:125`, `research.md` *Mutation path* | records | in scope (correction) | They state that the source-table test kills the value mutants of `source.ts`; there were none. R1-03 asks the op to correct the phase 2 claim. |
| `knowledge/speckit-flows/log.md:38` | flow finding | related | Records the finding and a candidate: "the mutation gate flags a changed source file that yields zero mutants". |
| #5 / PR #19 / `specs/002-design-tokens` | issue, merged mission (`ec0f533`) | out of scope (done) | Introduced `source.ts` with `as const satisfies readonly TokenRecord[]`. |
| #6 / PR #21 / `specs/003-base-styles` | issue, merged mission (`64c61d9`) | out of scope (done); no longer a coordination point | Triage 003 asked to order #20 and #6 because both edit `source.ts`. #6 landed first and added six records (`font-size-subhead`, `line-height-compact`, `line-height-prose`, `measure-reading`, `measure-cell`, `measure-container`) in the existing `as const` form, so they are unmutated too and fall in this op's scope by file. |
| #1 | epic (open) | out of scope | Parent epic. |
| #10 | issue (open) | out of scope | Storybook, visual regression and axe; unrelated to the mutation path (the browser and Storybook projects are excluded from mutation anyway). |
| #11 | issue (open) | out of scope | Release v1.0.0. This op changes no public surface, so it adds nothing a release must announce. |
| Elements and icons (#7 to #9, #12 to #17) | issues (open) | out of scope | They may consume `TokenName`; the op keeps the type unchanged, so they are unaffected. |
| `ops/` | repository | none to fold into | Absent; no op is in progress. |
| `specs/001`, `002`, `003` | finished missions | none to fold into | All merged; nothing in progress covers #20. |
| `.specify/memory/constitution.md` | constitution | constrains | VIII "Changed source is mutation-tested", "a surviving mutant in new or changed code is a blocking review finding unless recorded as equivalent"; VII (token names are public surface; unchanged here). |
| `knowledge/speckit-flows/guards/vacuous-tests.md` | guard | applies | Mutants counted as killed for the wrong reason (timeouts, compile errors) are a vacuous kill. |
| `knowledge/speckit-flows/log.md:26`, `:51` | flow findings | applies | Entry bound is 60 changed lines; shard time follows mutants per file; CI runners are 1.5 to 3.4 times slower than the sandbox. |

## Decision

**op.** One bounded change in one file (plus records) with a clear expected behaviour:

- **No new public surface.** Token names, values, the stylesheet, the JSON export and the `TokenName` type stay the
  same; the change is how the source is written so the existing mutation gate can see it. Semver `none` (the public
  surface of constitution VII is unchanged; PATCH at most if the operator wants a changelog line, but there is
  nothing a consumer observes).
- **No open design question.** The operator already decided the approach (R1-03): drop `as const`, keep `TokenName`
  literal, correct the record. How to keep the literal type (for example a `const` type parameter on a small
  identity helper, or `satisfies` with the names typed another way) is an implementation choice inside that
  decision, settled in the op's plan.
- **One story, one phase.** "The value mutants of `source.ts` are generated and killed" is a single, independently
  testable outcome.

Why not the others: not a **mission** (no surface, no design decision left, one story, one package, no accessibility
or security behaviour); not a **fold** (no feature or op is in progress; 003 is merged); not **none** (`source.ts`
still ends with `] as const satisfies readonly TokenRecord[]` at line 221, and the ground lists at lines 11 to 25
are `as const` too); not **decision-needed** (R1-03 already decided).

## Scope

In scope (#20):

1. Drop `as const` from `records` and from the ground lists `main`, `stateGrounds` and `chrome` in
   `packages/tokens/src/source.ts`.
2. Keep `TokenName` a literal union of the record names, derived from the records (no second, hand-kept name list
   that could drift), so `index.test.ts`'s `@ts-expect-error` holds and the built `.d.ts` still exposes the union
   (the landing review's scratch-consumer check).
3. Keep the outputs byte-identical: the generated `tokens.css` and `tokens.json` before and after are equal (a test
   or a recorded diff), and all existing tests pass unchanged.
4. Mutation evidence over the **whole** of `source.ts`, not only the changed lines: every value mutant killed by the
   source-table node test or recorded as equivalent with a reason; every Timeout explained.
5. Correct the phase 2 claim (`specs/002-design-tokens/reviews/phase-2/round-1.md:39`) and the statements that rely
   on it (`data-model.md:125`, `research.md` *Mutation path*), as an addendum that keeps the original text
   readable, and close the `knowledge/speckit-flows/log.md:38` finding.

Out of scope:

- **A zero-mutant flag in the mutation gate** (the log candidate, and the alternative R1-03 dropped). It would be a
  gate change with its own plants; open it as a separate issue or op if the operator still wants it.
- **New tokens or value changes** of any kind.
- **Other `as const` uses** in tests (`packages/*/test/**`) and in `gates/`: tests are not mutated, and no other
  source data is affected.

## Risks and open questions

- **Issue text unread.** See the limitation above. If #20 asks for more (the gate flag, other files), the scope here
  grows or splits.
- **The changed-lines gate will not see most of the file.** `gate:mutation` mutates only lines changed against the
  base (`gates/lib/mutation/ranges.ts`). Dropping `as const` changes a handful of lines, so a normal op run would
  again yield almost no `source.ts` mutants and pass, repeating the 002 mistake. The op must run Stryker over the
  whole file (in 60-line entries) and keep that run's report as evidence, or reformat in a way that touches every
  record line. Every later feature that adds a token gets its new lines mutated automatically.
- **Timeouts as kills.** The spike counted 40 of 343 mutants as Timeout, which the gate treats as killed. A literal
  mutant in static data should not loop; the op should find out why they time out (for example a mutated `ref`
  sending `resolve()` round a cycle) and confirm each is a real failure, not a slow suite.
- **Compile errors as kills.** If the literal union is kept by type inference, a mutant on a record `name` breaks
  `cssName("color-canvas")` in the tests and Stryker marks it CompileError, which the gate counts as passing. That
  is acceptable only if the source-table test would also kill it; the op should confirm the name mutants are killed
  at run time with the checker off, as the spike did.
- **Shard time.** Each `source.ts` mutant is static (the records are fixed at import), so it runs the full mutated
  test set. 343 mutants on 120 lines took 5 min 4 s in the sandbox; the file is now 223 lines (003 added six
  records), and CI runners are 1.5 to 3.4 times slower. With the 60-line entry bound the shards should fit the
  10-minute limit, but the op should measure the slowest shard on CI, not only locally.
- **Test-first for a refactor.** The change has no behaviour of its own, so there is no natural red test. The op's
  plan must say what its red evidence is (for example a red mutation run showing surviving or uncovered mutants that
  a new or stricter test then kills, or a justified `exempt` as 001 phase 1 had) and keep the output.
- **Node version.** The container runs Node 22 and CI pins 26.13.0 (`log.md:24`); a red step that depends on Node
  messages may not reproduce locally.
- **Branch.** This record is committed on `claude/020-token-value-mutation`, not pushed.

## What would change this decision

- The issue text of #20 (or the operator) adds the zero-mutant flag to the mutation gate: still an op if bounded, but
  it adds gate plants; if both are wanted, prefer two ops so the source change does not wait on gate review.
- Keeping `TokenName` literal without `as const` turns out to need a change to the public type (for example a
  separate exported name list, or a different `TokenName` shape): it touches the token surface and becomes a
  `mission` or `decision-needed`.
- The whole-file mutation run surfaces surviving mutants that need new tests across the generator or the gates:
  still an op if they stay in `@ocelle/tokens`; a mission if they reach the gate contracts.
- Shards cannot fit the 10-minute limit without changing the shard bound or the mutation configuration: that is a
  change to 001's spec (FR-013, SC-005) and needs the operator's decision first.
