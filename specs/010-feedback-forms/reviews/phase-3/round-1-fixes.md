# Phase 3 review round 1: fixes

Review: round-1.md (changes_requested, head `5c4dc14`). Fixes made on `92e2c3b`, red commit `0aa39bd`.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed | none: the finding is that a test was weakened, so the stronger test is in the fix commit (skill step 3). It passes at once in both harnesses, because the code was right | packages/elements/test/scenarios/form-input.ts, the "Edge case, error while focused" cell |
| R1-02 | deferred: a note. Spec US2-14 and FR-021 do not settle where the caret goes after `focus()` from script. Whether to keep the native caret behaviour is a design choice for the planner or a later phase, so no change is made here | none | none |
| R1-03 | deferred: a note for later phases (a behaviour bug found during green gets its own test-only commit and kept red run). The reviewer supplied the missing red evidence. No change asked | none | none |
| R1-04 | deferred: a note for landing (merge `main` before judging the `mutation-shard` jobs). Nothing to change in this phase | none | none |
| R1-05 | deferred: a note for the fold step (create op 017's branch at `253292f`, or record that it starts from the archive branch). Outside this step's scope | none | none |
| R1-06 | fixed | `0aa39bd` (`fix-1` in red-commits, red-fix-1.log: 2 of 3775 failed, exactly the two new tests, each with "promise resolved "null" instead of rejecting") | packages/elements/test/in-process.ts and packages/elements/test/browser/driver.ts (`call`); packages/elements/test/driver.test.ts and packages/elements/test/browser/driver.test.ts (the step tests) |

## R1-01

The inner entry is exact again, `"input#control"`, so focus must be on the native input in the field's shadow root.
The host entry is now matched against
`^(?:<tag>|ocelle-first-load-\d+-\d+)#t$`, and a match is mapped to a fixed placeholder before the deep-equal. These
are exactly the two tags the first-load host can have:

- On the fixture pages it is the scenario's tag, because `firstLoad` writes the markup with `tag` (test/browser/driver.ts).
- In process it is the fresh `ocelle-first-load-N-T` subclass tag from `registerFirstLoad` (test/in-process.ts).

There is no harness condition: both harnesses accept either form. Any other host tag, a host without id `t`, a focus
path of another length, or focus anywhere other than `input#control` fails the cell. This is tighter than the
review's example `/^ocelle-[a-z0-9-]+#t$/`, which would also accept any other `ocelle-` element with id `t`.
`gate:unit-tests` runs the cell in both harnesses, and it passes.

## R1-06

`call` now throws `call: #<id> has no method <method>` when the property is not a function. It used to read
`undefined` through optional chaining. It calls the method with `Reflect.apply` on the element. It is tested in both
harnesses:

- The first test checks that a method is called with its arguments and that a plain result comes back.
- The second test checks that a missing method rejects. This test was red at `0aa39bd`.

On the fixture pages, the second test also asserts clean recorders.

## Checks

At the fix commit, in this container, one job at a time, with `OCELLE_CHROMIUM_PATH` set:

| Check | Result |
|---|---|
| `gate:unit-tests` | exit 0, "3775 tests passed in 157 files" |
| `gate:lint` | "312 files checked, no finding" |
| `gate:typecheck` | "no type error in the files of tsconfig.json" |
| `gate:test-lint` | "218 files checked, no finding" |
| `gate:mutation -- --base 2004e82` | not run: every changed line is in `packages/elements/test/`, which the mutation gate excludes (`gates/lib/mutation/ranges.ts`, `**/test/**`). There is no mutable changed line, and the source under `src/` is unchanged since the review's run (exit 0, none survived) |
