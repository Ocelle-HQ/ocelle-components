# Op Specification: Make the token source mutation-testable

**Op**: `ops/004-token-source-mutation` | **Created**: 2026-11-10 | **Status**: Draft
**Input**: Issue #20, triage record `triage/004-token-source-mutation.md` (approved), operator decision R1-03
(`specs/002-design-tokens/reviews/phase-3/operator-decisions.md`)

## Intent

The token records and ground lists in `packages/tokens/src/source.ts` are written inside `[…] as const`. Stryker
skips that expression, so the mutation gate has never mutated a token value. This op rewrites the source so that
Stryker mutates it, keeps every output and the `TokenName` type as they are, shows that the existing tests kill every
value mutant, and corrects the record that said they did. Consumer need: none new. The library's own gate must test
the data that consumers receive (constitution VIII).

## User Scenarios & Testing

### User Story 1 - The token values are mutation-tested (Priority: P1)

A maintainer changes a token value or a record in `source.ts`. The mutation gate generates mutants for the changed
lines, and the tests kill them, so a test that would miss a wrong value cannot pass unseen.

**Why this priority**: It is the only story. Without it, constitution VIII ("changed source is mutation-tested") does
not hold for the token data.

**Independent Test**: Run Stryker over the whole of `source.ts` with the TypeScript checker off. It reports mutants on
every record line. None survives, and each Timeout is explained.

**Acceptance Scenarios**:

1. **Given** `source.ts` after the op, **When** its source is parsed, **Then** no `as`, `satisfies` or `<T>` type
   assertion appears in the initializers of `records`, `main`, `stateGrounds` or `chrome`. Before the op, this check
   fails for all four.
2. **Given** `source.ts` after the op, **When** Stryker mutates the whole file in 60-line entries with the checker
   off, **Then** every mutant is Killed, or is a Timeout with a recorded cause, or carries a reasoned
   equivalent-mutant record. None is Survived, NoCoverage or CompileError.
3. **Given** a misspelt token name such as `"color-canvs"`, **When** it is passed to `cssName()` in a TypeScript
   consumer, **Then** the typecheck rejects it, in the repository (`index.test.ts`'s `@ts-expect-error`) and against
   the built `.d.ts`, as before the op.
4. **Given** the package built before and after the op, **When** `dist/tokens.css` and `dist/tokens.json` are
   compared, **Then** they are byte-identical, and `tokenNames` lists the same names in the same order.
5. **Given** the phase 2 review of mission 002, **When** a reader opens `reviews/phase-2/`, **Then** a note beside
   `round-1.md` states that its line 39 claim was wrong when it was written (there were no mutants) and points to
   this op's evidence. `round-1.md` is not edited.

### Edge Cases

- A name mutant (for example `"color-canvas"` → `""`) also changes the inferred `TokenName`, so with the checker on
  Stryker reports a CompileError. That is not enough: the checker-off run must show that the tests kill it at run
  time.
- A mutant of a `ref` or of a `var(--ocelle-…)` value can send `resolve()` round a reference cycle, or make the
  tests loop. A Timeout counts as a kill only once its cause is shown to be a real failure of the mutated code. A
  slow suite is not a cause.
- A record that is not a valid `TokenRecord` (a misspelt key, a wrong group) must still fail the typecheck, as it
  did under `satisfies`.
- The six records that mission 003 added (`font-size-subhead`, `line-height-compact`, `line-height-prose`,
  `measure-reading`, `measure-cell`, `measure-container`) are in scope like every other record.

## Requirements

### Functional Requirements

- **OR-001**: `records`, `main`, `stateGrounds` and `chrome` in `source.ts` MUST NOT be inside a type assertion
  (`as`, `as const`, `satisfies`, `<T>`), so that Stryker instruments every literal in them.
- **OR-002**: `TokenName` MUST remain the literal union of the record names, derived from the records. No second
  name list is written by hand. The union holds in the repository typecheck and in the built `.d.ts`.
- **OR-003**: The records MUST still be checked against `TokenRecord` by the type checker.
- **OR-004**: The generated stylesheet, the JSON export and `tokenNames` MUST be byte-identical before and after.
  No token is added, removed, renamed or revalued.
- **OR-005**: Stryker over the whole of `source.ts` (60-line entries, checker off) MUST end with zero Survived, zero
  NoCoverage and zero CompileError mutants. Every Timeout is explained, and every equivalent mutant carries an R-08
  record (001 research R-08, FR-012). A surviving mutant gets a test that kills it, or that record.
- **OR-006**: `gate:mutation -- --base <op base>` MUST exit 0. Each 60-line whole-file entry's local time MUST be
  recorded and compared with the 10-minute `mutation-shard` limit, with the CI factor of 1.5 to 3.4.
- **OR-007**: The phase 2 claim MUST be corrected by a note (`specs/002-design-tokens/reviews/phase-2/notes.md`),
  not by an edit of `round-1.md`. The statements that rest on it (`data-model.md` § Token and line 125,
  `research.md` *Mutation path*) get dated addenda, and the original text stays readable. The
  `knowledge/speckit-flows/log.md` finding of 2026-11-04 is closed by an Update entry.
- **OR-008**: No gate code, gate configuration, Stryker configuration or Vitest project changes.

### Out of scope

- A zero-mutant flag in the mutation gate (the issue's optional item; not approved for this op).
- New tokens or value changes.
- `as const` in tests and in `gates/`.

## Success Criteria

- **SC-001**: The whole-file Stryker run reports at least one mutant on every line of `source.ts` that holds a
  literal of a record or a ground list (before the op: 0 mutants in the file), with 0 Survived.
- **SC-002**: `cmp` of the before and after `tokens.css` and `tokens.json` reports no difference.
- **SC-003**: The full test suite and every gate the op touches pass, with no existing test changed.

## Assumptions

- The spike of 002 phase 3 (`reviews/phase-3/spike.md` § 5) is representative. On lines 1 to 120, with `as const`
  dropped and the checker off, it found 343 mutants: 303 killed, 40 timeouts, 0 survived, in 5 min 4 s. The file now
  has 223 lines.
- A `const` type parameter (TypeScript 6.0.3, as pinned) keeps the record names literal without `as const`.
