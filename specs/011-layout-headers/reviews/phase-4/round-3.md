---
phase: 4
round: 3
verdict: approved
base: 0313f9f955f085d60d70be012411a70faeb54577
head: 9bf9f900ce6c1bc0f0c1ac8ac1c417369d745473
tdd_check: pass
---

# Phase 4 review, round 3

Scope: `git diff 0313f9f..9bf9f90`. That is the whole phase (US3, T033 to T040 with T035a) plus the round 2 fix: the
planner's f7fe243 (T050, T051 and the design changes in `reviews/landing/round-1-tasks.md`), the red commit 4da65c9,
the fix commit 749125b and the tick commit 993b948. The working tree was clean at 9bf9f90 before this review. Since
33d7df1, the head of the last phase 4 tdd-check, only `tasks.md` and review or evidence files changed
(`git diff --name-only 33d7df1..HEAD`: 34 files, all under `specs/011-layout-headers/`).

Inputs: spec.md (US3-3, FR-021, FR-022, FR-034, FR-036), plan.md (§ Fixes, Constitution Check I and VII),
research.md R-09 § never-rendered elements and R-11 § Type declarations, contracts/checks.md and
contracts/elements-package.md, tasks.md Phase 4, the constitution, rounds 1 and 2, `round-2-fixes.md`, `plants.md`
and the landing review round 1.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | note | specs/011-layout-headers/reviews/phase-4/check-final-tests-on-base.log, check-final-tests-on-scaffold.log (tail) | Both "final tests against old code" runs exit 2 with `unit-tests: could not run: no test file found`. That is a load error, not a failure for missing behaviour. The phase base 0313f9f lies before phase 5, so the final-test set that `tdd-check.sh` lays over base and scaffold now includes the test files of phase 5 and of the later fix rounds. The script accepts any non-zero exit, so it reports `pass`. This is the same cause as phase 1 R3-03 and R4-01. It began at 944b2d8; at a54366b the same scaffold run failed 115 tests, every one an `AssertionError`. For phase 4 the behavioural evidence still holds: that scaffold run, `check-red-phase.log` (115 of 3486 failed, every one an `AssertionError`) and `check-red-fix-2.log` (4 of 3600, every one an `AssertionError`). | None for this phase. The possible op on `tdd-check.sh` from phase 1 round 3 applies here too: treat exit 2 against base or scaffold as no proof, or run only the phase's own tests. |

## Test quality

- **Red evidence.** `red-commits` holds `phase f35290e` and `fix-2 4da65c9`, and both exit 1 in the re-run.
  - `check-red-phase.log`: 115 of 3486 failed, every one an `AssertionError`.
  - `check-red-fix-2.log`: 4 of 3600 failed, every one an `AssertionError`, and these are exactly the four new tests:
    - `build.test.ts:168`, the type declarations;
    - `readme.test.ts:268`, the template and script fragment;
    - the US3-3 template-and-script scenario, in process and on the strict-CSP fixture.
  - Each fails on missing behaviour (the `.d.ts` still declares the key, the README lacks the sentence, the templates
    and scripts are drawn as blocks), not on setup.
  - 4da65c9 changes only test files: `build.test.ts`, `readme.test.ts` and `test/scenarios/context-sidebar.ts`.
- **Nothing weakened after red.** `git diff 4da65c9..HEAD -- <test pathspec>` touches only `readme.test.ts`, in
  8ccda41, phase 5's red commit. That change makes the rail's `ocelle-nav-item` fragment stricter, says why in a
  comment, and adds a line assertion. The phase 4 fragment and the two new phase 4 tests are unchanged since their red
  commit.
- **Assertions.**
  - The new scenario has a fixed `expected` value:
    - `mixed`: the full `layoutExpected` of the two visible sections, with a template and a JSON script before,
      between and after them;
    - `never`: each of the seven never-rendered elements is `["none", 0, 0]`;
    - `only`: with only a `<template>` in the slot, the head and footer dividers meet with `space-4` and no padding
      between them.
  - It runs in both harnesses through the shared scenario. The CSP, request and console record of the fixture stays
    clean, so the JSON data block raises no violation.
  - The declarations test puts each "no `internalsKey`" beside a positive (`label: string | undefined;`, or
    `export declare function accessibleName(`) in one `toEqual`, so a missing or empty file cannot pass.
  - The changed tests have no `skip`, `only`, `todo`, conditional assertion or snapshot.
- **Scenario coverage.** US3-3's template variant (spec, as amended by f7fe243) has its scenario. FR-034's declaration
  statement has the build test. The README statement has its fragment. The sidebar has no event or keyboard path.
- **Scaffold.** `scaffold.sha` 666e7a3 was judged in round 1 (signatures only). The final-tests-on-scaffold check is
  now a load error (R3-01). The proof that the tests fail against the scaffold is the a54366b run named in R3-01.
- **Mutation, phase base.**
  - Result of `pnpm run gate:mutation -- --base 0313f9f…` at 9bf9f90: "57 mutants on the changed lines of 5 files,
    none survived; 0 timeouts, 4 compile errors, 3 zero-mutant entries; 2 equivalent records". Exit 0, no survivor.
  - The two equivalent records (`ocelle-context-sidebar.ts:43` and `ocelle-personal-rail.ts:44`, `label`'s options
    `{ type: String }` to `{}`) are equivalent: Lit's defaults are attribute `label`, the default converter, not
    reflected. These are the records the landing review read.
  - The four compile errors (the `??` to `&&` in `updated()`, and `updated()` emptied, in both landmark classes) are
    reports, not survivors.
  - Zero-mutant entries: `index.ts` (exports), `naming.ts` (a constant) and `ocelle-card.ts`, whose changed lines in
    this range have no mutant.
- **Mutation, fix only.** The implementer's round 2 mutation report is not in the repository; `round-2-fixes.md`
  defers it to the round's report, so I read the brief's summary of it ("0 mutants on the changed lines", zero-mutants
  entries). I reproduced it: `gate:mutation -- --base 4da65c9` gives "0 mutants on the changed lines of 1 file … 1
  zero-mutant entry" (`ocelle-context-sidebar.ts`). This is correct:
  - the fix's source lines are CSS selectors inside the `css` template and a comment, which Stryker does not mutate;
  - `tsconfig.json` is not mutated source.
  The plants below cover those lines.
- **Plants.** A full `gate:plants` does not finish within 2 hours, and the gate selects plants only by shard, not by
  name. No gate, gate test, story or token changed in the round 2 fix. So I did not run the 28 shards. Instead I
  reproduced the round 2 element plants of `plants.md` § Review round 2 fix, plus two plants of my own:
  - **Setup:** a scratch worktree of 9bf9f90 and a script that applies each plant, runs the projects and restores the
    file. The worktree was clean afterwards and was removed.
  - **Control runs:** no failure (the scenario projects 52 passed; `elements-build` 13 passed).
  - **Pairing plants**, each failing exactly the US3-3 template-and-script test in `elements` and in
    `elements-browser` (2 failed, 50 passed):
    - `:not(template, script)` dropped from the section rule;
    - `:not(template, script)` dropped from the first-section rule only;
    - mine: only `template` excluded in both rules;
    - mine: only `script` excluded in both rules.
  - **Declarations plants**, each failing the type-declarations test in `elements-build` (1 failed, 12 passed):
    - `stripInternal` removed;
    - `@internal` removed from the sidebar's field;
    - `@internal` removed from the rail's field;
    - mine: `@internal` removed from `naming.ts`'s `internalsKey`.
  - I did not re-run the R-17 style plants of the two changed rules. Their declarations did not change, only the
    selectors, and the pairing plants above cover the selectors.

## Checks run

| Check | Result |
|---|---|
| `tdd-check.sh 4` (re-run: HEAD moved) | pass, head 9bf9f90; red `phase` and `fix-2` both exit 1; base exit 2 and scaffold exit 2 (R3-01); head exit 0 (`check-head.log`: 3601 tests passed in 158 files); no problem |
| `pnpm test` | 3601 tests passed in 158 files |
| `gate:typecheck` | pass |
| `gate:lint` | 304 files, no finding |
| `gate:style-lint` | 19 files, no finding |
| `gate:test-lint` | 207 files, no finding |
| `gate:csp` | 24 files, no finding |
| `gate:prefix` | 270 files, no finding |
| `gate:pins` | 5 manifests, no finding |
| `gate:contrast` | 169 pairs light, 177 dark (158 required) |
| `gate:brand-rules` | 7 rules |
| `gate:manifest` | 7 elements, no finding (no manifest change from `stripInternal`) |
| `gate:config-copies` | identical |
| `gate:signoff -- --range 0313f9f..HEAD` | 38 commits, no finding |
| `gate:storybook-build` | 57 stories built |
| `gate:visual -- --engine docker` | 114 captures match their baselines |
| `gate:axe` | 114 story-theme runs, 0 serious or critical; 10 notes, all excepted |
| `gate:mutation -- --base 0313f9f…` | 57 mutants, none survived (see Test quality) |
| `gate:mutation -- --base 4da65c9` | 0 mutants, 1 zero-mutant entry (the fix's lines) |
| `gate:plants` | not run as a gate; round 2 plants reproduced by hand (see Test quality) |
| `tsc -p packages/elements/tsconfig.json` into two scratch directories, with and without `--stripInternal false`, then `diff -r` | see R2-02 below |

## Earlier findings

Round 2 was an operator round recording landing review findings L1-03 and L1-02. Both are resolved.

- **R2-01 (landing L1-03): resolved.**
  - **The fix:** `ocelle-context-sidebar.ts:95` and `:103` add `:not(template, script)` to the section rule and to
    the first-section rule. Those are the only two rules that select default-slot children. The other `::slotted`
    rules (`:107-114`) select `[slot="head"]` and `[slot="footer"]` only.
  - **Real sections stay styled:** the exclusion is by element type, so every other element in the default slot
    still gets the section rule, `div`, `span`, `ul`, `p` and `ocelle-section-header` included. The 52 sidebar
    tests of the two harnesses still pass, among them the existing US3-3 variants with those section types and the
    page-reset variants. The style plants of `plants.md` § Review round 2 fix fail across them (for example
    `margin-inline` dropped fails 20).
  - **The first-section rule:** `:nth-child(1 of …)` with the same exclusion still finds the first real section when
    a `template` or `script` precedes it. The new scenario's "before" elements prove this, and dropping the exclusion
    from that rule alone fails the test.
  - **What a template or script draws:** each keeps the UA's `display: none` and gets no box (`["none", 0, 0]` for
    all seven).
  - **Slot state:** it still counts as content and is unchanged. The `only` case keeps the head and footer dividers,
    as FR-021 says and as a hidden section does.
  - **`style`:** it is deliberately not excluded. research.md R-09 gives the reason: an inline `<style>` is what the
    strict CSP forbids, and the fixture could not hold one.
  - **README:** the new paragraph (`packages/elements/README.md`, after the hidden-section paragraph) matches the
    behaviour. "A page rule does not change a section's … display" stays accurate, because a template is not a
    section.
  - **Red test:** red-commits `fix-2` 4da65c9. No story was added: a template draws nothing, so it has no visual state
    of its own.
- **R2-02 (landing L1-02): resolved.**
  - **The fix:** `packages/elements/tsconfig.json` sets `"stripInternal": true`. `tsconfig.base.json` is unchanged, so
    the tokens and styles packages are unaffected.
  - **Only what is meant is stripped:** `grep -rn @internal packages/elements/src` finds exactly three places:
    - `naming.ts:38`;
    - `ocelle-context-sidebar.ts:136`;
    - `ocelle-personal-rail.ts:150`.

    I emitted the package with and without stripping and diffed the trees. The only differences are:
    - `naming.d.ts` loses `export declare const internalsKey: unique symbol` and its JSDoc;
    - `ocelle-context-sidebar.d.ts` and `ocelle-personal-rail.d.ts` each lose `import { internalsKey } from
      "./naming.ts"` and `readonly [internalsKey]: ElementInternals` with its JSDoc.

    No other `.d.ts` line differs. No `.js` or `.js.map` file differs, so the run-time own symbol property that axe
    reads is kept.
  - **The stripped declarations stand alone:** they type-check on their own (`tsc --noEmit` over every emitted
    `.d.ts`, `skipLibCheck: false`, exit 0), so nothing left in them refers to a stripped name.
  - **Manifest:** `gate:manifest` passes with 7 elements and no change, and `custom-elements.json` is not in the fix
    diff.
  - **Research:** the planner corrected R-11 (§ Type declarations, `@internal` only, the intended `.d.ts` treatment),
    and the code matches it.
  - **Red test:** the build test in red commit `fix-2` 4da65c9. Each of the four declarations plants above fails it.
- **Tasks.** T050 and T051 are ticked (993b948), and their work is present: the scenario, the README fragment and
  paragraph, the build test, the selectors, `stripInternal` and the plants. Every task of `## Phase 4:` is ticked.
  The round 2 fix changed nothing outside phase 4 except its evidence.
