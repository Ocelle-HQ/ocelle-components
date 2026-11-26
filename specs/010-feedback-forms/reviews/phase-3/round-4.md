---
phase: 3
round: 4
verdict: approved
base: 38e9bd5e683c506e6b83a5d12ad22d8a17def72a
head: b4b5989
tdd_check: pass
---

# Phase 3 review, round 4

Scope: the operator round `round-3.md` (O3-01) and its fix, `git diff 78b5b57..b4b5989`: planner `cc13925` (spec,
plan, contracts, tasks T041c/T041d), red `d260a95` (`red.sh 3 fix-3`), green `7aecd09`, tdd-check `b4b5989`. No
uncommitted change. Stop rule: this round checks that O3-01 is resolved and that nothing regressed; it does not search
afresh. Outside `specs/`, the fix touches only `packages/elements/scripts/manifest.ts`,
`packages/elements/custom-elements-manifest.config.mjs`, `packages/elements/test/node/manifest.test.ts`,
`packages/elements/custom-elements.json` and seven `gates/plants/manifest/fail-*` copies plus `pass-reordered`. No file
under `src/`, no story, no baseline and no gate source changed.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R4-01 | note | packages/elements/scripts/manifest.ts:49 | The `"overlay.ts"` → `""` mutant is a timeout, and no test on this branch exercises the entry, because the branch has no `src/overlay.ts` and no test has an overlay fixture. It is not a survivor (the gate counts a timeout as detected and reports it). Main's test "reads every src/ocelle-*.ts and src/overlay.ts, and nothing else" (`origin/main:packages/elements/test/node/manifest.test.ts:219`) covers it after the merge. The `"form-control.ts"` entry's mutants are killed. | None now. At the merge of `origin/main`, keep main's overlay test. |
| R4-02 | note | reviews/phase-3/plants.md | The record's base is `cc139254` (the red commit's parent, as T041d asks), not `base.sha`. The selection is the same either way. `--affected 38e9bd5e --list` gives "every plant, by gates/bin/plants.ts (shared gate source)" and `--affected cc13925 --list` gives "every plant, by packages/elements/custom-elements-manifest.config.mjs (not mapped)". The recorded exit is 0 (the 28 shards plus `--verdict`, "309 plants of 17 gates and the registry judged, every plant as expected"). | None. |

No blocking finding.

## Test quality

- **Red evidence.** `red-fix-3.log`: 3 of 4739 failed, namely the T030 generator test (`manifest.test.ts:323`) and the
  `ocelle-form-input` (`:480`) and `ocelle-form-select` (`:564`) entry tests. Each failed on an `AssertionError`, with
  no setup or import error. `red-commits` has `fix-3 d260a95f`, and `tdd-check.json` records it with exit 1. The log
  keeps pnpm's `<pnpm store>` line. That line is known and accepted, and it is not evidence of a
  setup failure.
- **No change after red.** `git diff d260a95..b4b5989 -- packages/elements/test` is empty.
- **The pinned assertions that changed are stricter, and the reason is recorded.** The commit message and comments
  in the test file record it: the operator decision, constitution VIII.
  - The generator test now pins `inheritedFrom` on every inherited member and attribute, and its absence on the
    element's own ones. It pins the analyzer's superclass, and that a base in `src/base-control.ts` gives nothing
    (main's `helper.ts` case). It pins that only `ocelle-*` modules and declarations are published.
  - The two entry tests keep every earlier assertion and add `inheritedFrom` to the member and attribute mappings and
    the `FormControl` superclass.
- **The fold() tests were removed without weakening coverage of remaining behaviour.** Both removed tests pinned
  `fold`: dropping `inheritedFrom` and replacing the superclass along the chain. The operator removed that rule, and
  `fold` itself is gone from `scripts/manifest.ts`. The remaining behaviour they touched is still pinned elsewhere:
  - "only the element modules are kept" is in the T030 generator test (`paths`, `declarations`) and in
    "reads every src/ocelle-*.ts … and nothing else of src/" (`:237`);
  - "states the lists" is in the normalise test at `:72` and in "keeps lists that the analyzer stated" (`:137`).
  - A new normalise case (`:188`) pins that `inheritedFrom` and the superclass pass through unchanged.
- **Mutation** (rerun here): `gate:mutation -- --base 38e9bd5e --files packages/elements/scripts/manifest.ts` gives
  "33 mutants on the changed lines of 1 file, none survived; 1 timeout, 6 compile errors, 0 zero-mutant entries;
  1 equivalent record".
  - The equivalent record at `:125` (a missing directory lists "Stryker was here", which matches neither pattern) is
    main's record, reworded for a list of bases. Its reason holds.
  - The timeout at `:49` is R4-01.

## Checks run

`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, at `b4b5989`:

| Check | Result |
|---|---|
| `vitest run packages/elements/test/node/manifest.test.ts` | 30 of 30 passed |
| `gate:manifest` | exit 0, "9 elements checked, no finding" |
| `gate:typecheck` | exit 0, no type error |
| `gate:lint` | exit 0, 355 files, no finding |
| `gate:test-lint` | exit 0, 255 files, no finding |
| `gate:mutation -- --base 38e9bd5e --files packages/elements/scripts/manifest.ts` | exit 0, as above |
| `vitest run packages/elements/test/plants.test.ts` (elements-browser) | 79 of 79 passed |
| `gate:plants -- --affected <base> --list` | every plant, the same selection as `plants.md`, which records exit 0 |

- **Full suite not rerun.** The full `pnpm test` was not rerun here, to keep reruns short. The record shows exit 0,
  4739 tests in 174 files, on a rerun.
- **The first run's failure.** It was the phase 2 timing-sensitive row "minimum hold … US1-13 10 ms after a write" in
  `test/plants.test.ts`. The fix does not touch that file or any `src/` file it exercises. The whole file passes
  here.
- **Plants.** Plants were not judged again.
- **tdd-check.** `tdd-check.json` is `pass` with no problems, at head `7aecd09`. HEAD `b4b5989` adds only that check's
  logs and JSON.
- **Manifest plant copies.** The seven `fail-*` copies that hold the manifest each differ from the regenerated
  `custom-elements.json` by their own small planted change. `fail-stale-property` and `pass-repository` hold no copy.

## Comparison with main's generator

`diff` against `origin/main:packages/elements/scripts/manifest.ts` gives these differences:

- **Head and doc comments.** They name `src/form-control.ts` as a second named base and state "no fold".
- **The base list.** `internalBase = "overlay.ts"` becomes `internalBases = ["form-control.ts", "overlay.ts"]`, with
  `includes` and `some` at the two use sites (`:129`, `:132`).
- **The standard-attribute list.** It keeps this mission's union, which `merge-stop-2.md` already found to merge
  cleanly.
- **The Stryker comment.** It is reworded for a list of bases.

The config differs from main's only in its comment and in the added `src/form-control.ts` glob. `fold`, `own`, `bases`,
`isElementModule` and the second analyzer pass are gone. This mission's tests do not touch main's overlay cases. Main's
`helper.ts` case passes with this generator, because `helper.ts` is not in `internalBases`. The next merge can take
main's generator with the `form-control.ts` entry and this mission's standard attributes added, as T041d requires.

## Earlier findings

- **O3-01 (operator round 3): resolved.**
  - The generator and the config follow main's 2026-11-14 rule, with `src/form-control.ts` as a second named base
    (`manifest.ts:49`, config glob).
  - `ocelle-form-input` and `ocelle-form-select` list FormControl's members and attributes with
    `inheritedFrom: { name: "FormControl", module: "src/form-control.ts" }` and keep the superclass
    `{ name: "FormControl", module: "/src/form-control.ts" }`. The entry tests pin this and pass, and `gate:manifest`
    passes on the regenerated `custom-elements.json`.
  - T030 and T036's tests were changed test-first (`fix-3`, `d260a95`). Main's tests are not on this branch and were
    not altered.
  - The manifest plant copies were regenerated, and the plant record has exit 0.
  - The spec, plan, contracts and tasks text was updated in `cc13925`, and T041c and T041d are ticked.
