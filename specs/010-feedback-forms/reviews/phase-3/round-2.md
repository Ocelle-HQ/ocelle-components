---
phase: 3
round: 2
verdict: approved
base: 2004e82030df9c56f99913efa99c0ffda3a705e6
head: fc12296
tdd_check: pass
---

# Phase 3 review, round 2

Scope: `git diff 2004e82..fc12296`, with no uncommitted change. Round 1 reviewed up to `5c4dc14`. Since then,
`git diff 5c4dc14 fc12296` outside `specs/` touches five test-path files only:
`packages/elements/test/driver.test.ts`, `test/browser/driver.test.ts` (red `0aa39bd`), `test/in-process.ts`,
`test/browser/driver.ts` and `test/scenarios/form-input.ts` (fix `4fc2534`). No file under `src/`, no story, no
baseline, no gate and no configuration changed. So round 1's source-level results still apply to HEAD: the
whole-diff mutation run, `plants.md`, storybook, axe and visual.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | packages/elements/test/scenarios/form-input.ts:733 | `tag` goes into the `RegExp` source without escaping. Every tag the scenarios are run with is an `ocelle-` name made of `[a-z0-9-]`, so no character has a regex meaning today, and the cell is correct. | Optional: escape `tag`, or compare the host entry with `each === \`${tag}#t\`` alongside the first-load pattern. |

No blocking finding.

Operator decisions: the split of the shard-planner change to op 017 and its revert (`decision-split-shard-change.md`,
`design-change-3.md`) are taken as given. Per the operator, the shard-time gap recorded there is not a finding of this
phase. Round 1 notes R1-04 and R1-05, which concern landing and the fold, stay open as notes for those steps. They are
outside what a fix round of this phase can change.

## Test quality

- **Red evidence for fix 1.** `red-commits` has `fix-1 0aa39bd`. In `red-fix-1.log`, 2 of 3775 tests fail, exactly the
  two new "rejects when the element has no such method" tests (`driver.test.ts:355`,
  `browser/driver.test.ts:395`). Each fails with `promise resolved "null" instead of rejecting`. That is the missing
  behaviour (optional chaining read `undefined`), not a setup error. `tdd-check.json` (head `4fc2534`) is `pass`
  with no problems, and it lists all four red commits with exit 1. The companion test, "calls the element's method
  with the arguments and returns its plain result", passed at red. It is a guard for the rewritten step, not the red
  test. It checks that the arguments reach the method (`getAttribute("value")` gives `"draft"`), that `this` is bound
  (`checkValidity` gives `true`, and it would throw "Illegal invocation" if called unbound) and that a non-plain
  result reads `null`.
- **No weakening after red.** `git diff 0aa39bd fc12296 -- packages/elements/test/driver.test.ts
  packages/elements/test/browser/driver.test.ts` is empty. The only other test-file change after round 1 is the
  R1-01 cell, which is stricter (see Earlier findings).
- **Vacuity.** The new tests assert outcomes of the step under test (results, rejection message, clean recorders on the
  fixture pages). There is no conditional assertion and no `skip`/`only`. `gate:test-lint` is clean.
- **Mutation.** I did not run it, per the caller's instruction and because it was already recorded green. No changed
  line since round 1 is mutable: all are under `packages/elements/test/`, which `gates/lib/mutation/ranges.ts`
  excludes. Round 1's run at `5c4dc14` (exit 0, 496 mutants, none survived, 5 equivalent records accepted) covers
  HEAD's source unchanged.

## Checks run

At HEAD `fc12296`, in this container, one job at a time, `OCELLE_CHROMIUM_PATH` set:

| Check | Result |
|---|---|
| Targeted: `vitest run` on `test/driver.test.ts`, `test/browser/driver.test.ts`, `test/form-input.test.ts`, `test/browser/form-input.test.ts` | 4 files, 182 tests passed, 95 s |
| `pnpm test` (`gate:unit-tests`) | exit 0, "3775 tests passed in 157 files", 576 s |
| `gate:typecheck` | "no type error in the files of tsconfig.json" |
| `gate:lint` | "312 files checked, no finding" |
| `gate:test-lint` | "218 files checked, no finding" |
| `gate:style-lint` | "16 files checked, no finding" |
| `gate:csp` | "14 files checked, no finding" |
| `gate:prefix` | "263 files checked, no finding" |
| `gate:manifest` | "4 elements checked, no finding" |
| `gate:pins` | "5 manifests checked, no finding" |
| `gate:config-copies` | the two story-config copies identical |
| `gate:signoff -- --range 2004e82..HEAD` | "32 commits checked, no finding" |
| `gate:plants`, `gate:mutation`, storybook, axe, visual | not re-run: no source, story or baseline changed since round 1. Recorded green in `plants.md`, `mutation.md` and round 1's Checks. |

## Earlier findings

- **R1-01 (blocking): resolved.** At form-input.ts:730-738 the inner entry is exact again, `"input#control"`, as in
  the red form `inField(tag)` (form-input.ts:51). The host entry, index 0 only, is matched against
  `^(?:<tag>|ocelle-first-load-\d+-\d+)#t$`. Those are exactly the two tags a first-load host can have: the
  scenario's tag on the fixture pages, and in process the fresh tag `ocelle-first-load-${fresh}-${Math.round(performance.now())}`
  from in-process.ts:510. A matching entry maps to a fixed placeholder before the deep-equal. Any other host tag, a
  host without id `t`, a path of another length, or focus on anything other than the native `input#control` fails
  the cell. There is no harness condition. This is stricter than `8e5ba07`'s id-only comparison, and stricter than
  the example round 1 suggested. Both harnesses run it, and it passes.
- **R1-02 to R1-05 (notes):** deferred with reasons in `round-1-fixes.md`. No change was required.
- **R1-06 (note): addressed.** `call` now throws `call: #<id> has no method <method>` when the property is not a
  function, and calls it with `Reflect.apply` on the element: in-process.ts:553-560 and browser/driver.ts:536-542.
  Both harnesses have step tests, and the fixture one asserts clean recorders. It came with a red test (`fix-1`), as
  required for a behavioural fix.

The repository tree is unchanged by my runs apart from this file.
