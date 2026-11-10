# Phase 2 notes: correction of round 1's mutation claim (op 004, 2026-11-10)

`round-1.md` is not edited. This note corrects one statement in it.

## The claim

`round-1.md:39`, under *Mutation*:

> source.ts has no survivors: source-table.test.ts kills its value mutants, as planned.

## Why it was wrong when it was written

There were no value mutants to kill. Stryker 10.1.1 generated no mutant at all in `packages/tokens/src/source.ts`.
Its instrumenter treats a `TSAsExpression` as a type node and does not descend into it
(`@stryker-mutator/instrumenter`, `util/syntax-helpers.js`, `tsTypeAnnotationNodeTypes`). Every record was inside
`[ … ] as const satisfies readonly TokenRecord[]`, and the ground lists `main`, `stateGrounds` and `chrome` were
inside `as const` too. "No survivors" was true only because the file had no mutants, so the run did not show that
source-table.test.ts kills anything in `source.ts`. The phase 3 spike found this (`../phase-3/spike.md` § 5), and the
operator decided to fix it in a follow-up op (`../phase-3/operator-decisions.md`, R1-03).

## What holds now

Op 004 (`ops/004-token-source-mutation/`) removed every type assertion around the token data. The records go
through a `const`-type-parameter identity function (`tokenRecords`), which keeps `TokenName` a literal union, and the
ground lists are plain arrays. A whole-file Stryker run with the checker off, in 60-line entries, now mutates every
record and ground-list line. No mutant survives: each one is Killed, or is a Timeout whose mutant was applied by hand
and shown to fail the tests. The evidence, with the counts and times, is in
`ops/004-token-source-mutation/mutation/README.md`.
