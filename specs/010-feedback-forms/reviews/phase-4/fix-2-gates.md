# Phase 4 fix round fix-2: gates (T057b)

Run on 2026-11-17 in this container (4 CPUs, Chromium build 1243 through `OCELLE_CHROMIUM_PATH`, dockerd running,
`OCELLE_VISUAL_ENGINE=docker`), one job at a time, on the fix's working tree (red commit `e01ecf3` plus the green
change of `packages/elements/src/ocelle-form-select.ts`; the fix commit holds exactly that tree plus `specs/`).

| Gate | Result |
|---|---|
| targeted: `vitest run --project elements --project elements-browser` on `form-select-rules`, `form-select` (in process and on the fixture), `plants`, `form-input` (in process and on the fixture) | 6 files, 316 tests passed |
| `gate:unit-tests` (= `pnpm test`) | exit 0, "unit-tests: 4739 tests passed in 174 files", 1298 s |
| `gate:typecheck` | exit 0, "no type error in the files of tsconfig.json" |
| `gate:lint` | exit 0, "355 files checked, no finding" |
| `gate:test-lint` | exit 0, "255 files checked, no finding" |
| `gate:manifest` | exit 0, "9 elements checked, no finding" (the changed and new members are protected; the manifest is unchanged) |
| `gate:mutation -- --base 68f4608 --files packages/elements/src/ocelle-form-select.ts`, run 1 | exit 2, 47 s: "could not run: Stryker wrote no report (There were failed tests in the initial test run.)" |
| the same, run 2 | **exit 0**, 320 s: "16 mutants on the changed lines of 1 file, none survived; 0 timeouts, 3 compile errors, 0 zero-mutant entries; 0 equivalent records" |
| `gate:plants -- --affected 68f4608` | exit 0, 1248 s: "21 of 309 plants judged, every plant as expected" (`plants.md`) |

The mutation base is the red commit's parent `68f4608` (the orchestrator's instruction), so the changed lines are
exactly the green change; T057b's wording names the phase base, whose diff to this tree also holds the merge of
`main`.

Mutation run 1 started right after the 22-minute `gate:unit-tests` run and Stryker's initial (unmutated) test run
reported failed tests; the gate wrote no report, so which test failed is not known. A direct
`stryker run stryker.elements.config.json --mutate packages/elements/src/ocelle-form-select.ts:160-170` straight
after had a clean initial run (exit 0), and run 2 of the gate, unchanged, passed. The 3 compile errors of run 2 are
reported, not failing (007):

```text
packages/elements/src/ocelle-form-select.ts:144: mutation: compile-error: BlockStatement: replaced by {}
packages/elements/src/ocelle-form-select.ts:176: mutation: compile-error: LogicalOperator: replaced by options[this.defaultIndex(options)]?.value && ""
packages/elements/src/ocelle-form-select.ts:176: mutation: compile-error: OptionalChaining: replaced by options[this.defaultIndex(options)].value
mutation: 16 mutants on the changed lines of 1 file, none survived; 0 timeouts, 3 compile errors, 0 zero-mutant entries; 0 equivalent records
```
