# Data model: Mutation gate strictness (007)

All of it is in-process data of the mutation gate (`gates/bin/mutation.ts`, `gates/lib/mutation/*.ts`) and of the plant
judge (`gates/lib/plant-judge.ts`). Nothing is stored; nothing is published.

## Undecided mutant (spec Key Entities)

A mutant on a changed line of an entry (its range overlaps a changed range, as for findings) whose status is `Timeout`
or `CompileError`.

| Field | From | Rule |
|---|---|---|
| `path` | the report's file key | the changed file's path |
| `line` | `location.start.line` | the start line, as findings use, even if that line is unchanged |
| `mutator` | `mutatorName` | as Stryker names it |
| `replacement` | `replacement` (empty when absent) | through `oneLine` |
| `status` | `status` | `Timeout` or `CompileError` |
| `id` | `id` | ordering only, never printed |

## Entry (spec Key Entities, 001 FR-013)

A selected `ChangedFile` with one more field, `entry`: the name the run holds it under. In a whole-diff run it is the
`path`; in a `--files` run it is the `--files` item as given (`path` or `path:start-end`, trimmed as `selectFiles`
trims it). One shard never holds two entries of one file, so `entry` is unique within a run.

## Zero-mutant entry

An entry for which the classification counted no mutant on its changed lines, in a run that reached the classification
(no exit 2). Printed by its `entry` name.

## Mutant verdict (`classifyMutants`)

`{ ok: true, findings, mutants, timeouts, compileErrors, zeroEntries }` or `{ ok: false, cause }`:

- `findings`, `mutants`: unchanged meaning (FR-007).
- `timeouts`, `compileErrors`: undecided mutants by status, in changed-file order, then start line, then `id`.
- `zeroEntries`: entry names, in changed-file order.

Status table, unchanged except the two report columns (FR-007):

| Status | Counts as | Fails | Reported as |
|---|---|---|---|
| Killed, RuntimeError | killed | no | — |
| Timeout | killed | no | `timeout` line |
| CompileError | invalid | no | `compile-error` line |
| Ignored | equivalent record | no | `record` line (from the source scan, as today) |
| Survived, NoCoverage | survivor | yes (exit 1) | finding |
| any other | — | exit 2 | cause |

## Plant (`plant.json`), one new optional key

`reports`: a list of `{ "location": string, "rule": "timeout" | "compile-error" | "zero-mutants", "message"?: string }`,
allowed in `pass` and `fail` plants of any gate but meaningful only for `mutation`. When present, the report lines of the
run (rules above, gate `mutation`) must equal the list by location and rule (and message when given): missing and
unexpected lines both fail the plant. When absent, report lines are not checked. In every case the four report rules
(`record`, `timeout`, `compile-error`, `zero-mutants`) are never counted as findings of a mutation run.
