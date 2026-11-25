---
phase: 4
round: 2
verdict: approved
base: 4106d7d50025bec14023a86c39a34493e80ea49b
head: 7e60b38e5e922fb502d85d04582d005abc0758eb
tdd_check: pass
---

# Phase 4 review, round 2

Scope: `git diff 4106d7d..7e60b38` (no uncommitted change). Since round 1 (fead651), the changes are as follows:

- the operator's decisions (bbb5822);
- the red commit ce23bd9 (`red-commits` `fix-1`), which changes test files only: `changelog.test.ts` and
  `readme.test.ts` of the elements, and `readme.test.ts` of the styles;
- the fix e05373a: the README row, R-16's row, `coverage.md`, `plants.md`, `quickstart.md`, `tdd-exempt.md`,
  `tasks.md`, `round-1-fixes.md` and `red-fix-1.log`;
- the TDD check's evidence (7e60b38).

No element, style, story, baseline or gate source changed after round 1.

The operator's CI-first decision (`reviews/operator-ci-first-decision.md`) still applies. The full local visual,
plant and whole-suite runs are not findings. Neither are the five `gates/test/integration/visual.test.ts` failures in
`red-fix-1.log`, where the docker daemon was unreachable.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | `specs/019-data-records/reviews/phase-4/quickstart.md:83` | R1-04 is fixed as the operator decided: the record now says `connectedCallback`. The second line of each pair is still described as "its `observe()` call", which is phase 3's wording. At HEAD, those lines (timeline 147, event 126, chain 190) are `super.connectedCallback()`. The `observe()` call is the line after each (148, 127, 191). A timeout counts as killed, so the result stands. | None. If the record is touched again, say "its `super` call". |

No blocking finding.

## Test quality

- **Red evidence, README row (R1-01).** At ce23bd9, `check-red-fix-1.log` shows two failures, both on their
  assertions:
  - `readme.test.ts:748`: "data table light mode" expected `built in: the light and dark themes` but got `undefined`.
  - `readme.test.ts:753`: the data-table role list has 12 roles where 13 are expected.

  The other five failures in that run are the visual gate's integration tests. Docker was unreachable, and those tests
  do not depend on this commit (CI-first).
- **Red evidence, CHANGELOG statements (R1-02).** These tests pass at ce23bd9, because T075's text (7160e2e) predates
  them. The proof that they can fail is the run of the final tests against the base, which the operator's decision
  asks for. `check-final-tests-on-base.log` lists exactly seven failures, each an assertion failure:
  - the two sentences of the elements paragraph: `toContain` on the Unreleased section, which at the base names only
    009's layouts;
  - `` `wrap` (reflected) `` and "the property `stickyHeader` as `sticky-header` (reflected)" in the data table's
    entry: the entry is found at the base, but without those words;
  - the styles four-blocks paragraph;
  - the two README row tests.

  I reproduced this independently. I ran HEAD's three test files against a detached checkout of 4106d7d: `7 failed |
  786 passed (793)`, with the same seven tests and the same messages. These are the right failures: the statements
  were missing, and the base's `wrap` had no "(reflected)". None is a setup error.
- **Non-vacuous.** Each new test asserts with `toContain` on the flattened text, or `toBe`/`toEqual` on the README
  table cells. Each assertion is unconditional, has no `skip` or `only`, and fails on the base. The data-table entry is
  cut by a regex anchored at its bullet. A missing entry gives `""`, so the test fails instead of passing. The
  role-list test is strict: it is a `toEqual` on the whole list of 13 roles.
- **Weakened tests:** none. `git diff ce23bd9..HEAD` on the three test files is empty. No other test file changed in
  the phase.
- **Mutation:** `pnpm run gate:mutation -- --base 4106d7d` exits 0 ("nothing to mutate: no package or gate source
  line changed"). Round 1 accepted the mission's batches A to C, and the source has not changed since.
- **Exemption:** `tdd-exempt.md` now exempts only T076 to T078, which are review records and gate runs. It names T075
  and the G-1 row as test-first under `fix-1`. The exemption holds for what remains.

## Checks run

On HEAD 7e60b38, one at a time:

| Check | Exit | Summary |
|---|---|---|
| `gate:typecheck` | 0 | no type error in the files of tsconfig.json |
| `gate:lint` | 0 | 458 files checked, no finding |
| `gate:style-lint` | 0 | 43 files checked, no finding |
| `gate:test-lint` | 0 | 337 files checked, no finding |
| `gate:manifest` | 0 | 23 elements checked, no finding |
| `gate:config-copies` | 0 | the two story-config copies are identical |
| `gate:csp` | 0 | 41 files checked, no finding |
| `gate:prefix` | 0 | 477 files checked, no finding |
| `gate:contrast` | 0 | 169 pairs in light, 177 in dark (158 required per theme) |
| `gate:brand-rules` | 0 | 7 rules checked |
| `gate:signoff -- --range 4106d7d..HEAD` | 0 | 10 commits checked, no finding |
| `vitest run --project elements-node` on the README and CHANGELOG tests | 0 | 2 files, 704 tests passed |
| `vitest run` on `packages/styles/test/readme.test.ts` | 0 | 1 file, 89 tests passed (793 in all, as `round-1-fixes.md` records) |
| HEAD's three statement test files against 4106d7d's README and CHANGELOGs | 1 (expected) | 7 failed, 786 passed: the seven of `check-final-tests-on-base.log` |
| `gate:mutation -- --base 4106d7d` | 0 | nothing to mutate |
| `gate:plants -- --affected 4106d7d --list` | 0 | 1 of 315: `storybook-build/fail-empty-index`, by its `event-timeline.stories.ts` stub |

The TDD check (`tdd-check.json`) is `pass`, with no problem:

- red `fix-1` (ce23bd9) has exit 1;
- the final tests on the base have exit 1;
- HEAD has exit 0, `unit-tests: 7779 tests passed in 241 files` (`check-head.log`).

Its `head` is e05373a. The only later commit (7e60b38) adds that check's own evidence.

Not run here, under CI-first: the whole `gate:unit-tests`, `gate:visual`, `gate:axe`, `gate:storybook-build` and the
full plant run.

**Plants.**

- **Base.** `plants.md`'s header base stays the mission's base (8d104af), as T078 prescribes. Round 1 accepted this.
- **Appended section.** The fix appends a section "Review round 1 fix (the phase's own base)":
  - its base is `base.sha` (4106d7d);
  - its `note: affected:` line equals my `--list` selection (the one plant, by the same stub file);
  - its recorded exit is 0.
- **Appending is right.** The sections above it are T078's mission-wide record, which phase 4 is required to keep.
  Replacing them would have lost:
  - run 1 and run 2 on the mission's base;
  - the scoping argument;
  - the stale-fixture account.

  Those are what T078 and round 1 rest on. The appended section also says why it does not replace them. It is a
  separate dated section with its own base, command and exit, so neither record can be mistaken for the other.
- **No-change check.** The appended run was taken "in the working tree, with the fix applied", before the commit. The
  fix changes no gate input that selects plants, and my selection at HEAD is the same.

**Light-mode row.**

- `packages/elements/README.md:1086` reads `` `.sk-data-table` `` \| data table light mode \| built in: the light and
  dark themes, after the tone row. That is exactly the operator's G-1 (b) text.
- R-16's phase 1 table has the same row (`research.md:1046`), citing FR-013 and the decision. The following sentence,
  "covered by the rows above", is now true for light mode.
- The README's data-table family has 13 rows. With the timeline's 19 and the chain's 20, that makes the 52 that
  `coverage.md` records. "pending inventory" still occurs once, in the lead-in.
- `coverage.md` closes G-1 and ticks T076.
- `tasks.md:707` ticks T076. Every task of `## Phase 4:` (T075 to T078) is ticked, and its work is present.

**Records.** `tasks.md`'s phase 4 goal and T075 (lines 701-706) no longer call T075 exempt. They name the tests and
`fix-1`. No evidence file in this phase directory contains a local environment path.

## Earlier findings

- **R1-01 (blocking): resolved.**
  - Red first: ce23bd9 adds the "data table light mode" entry to `dataTableMapping` in `readme.test.ts`, which fails
    on its assertions at ce23bd9.
  - Then e05373a adds the row to `packages/elements/README.md:1086` and to R-16's phase 1 table
    (`research.md:1046`).
  - `red-commits` records `fix-1 ce23bd9`.
  - T076 is ticked in `coverage.md` and `tasks.md:707`.
- **R1-02 (blocking): resolved.** The statement tests cover what the round required:
  - the five-element minor-change paragraph, as its two sentences (`changelog.test.ts`);
  - the data table entry's `` `wrap` (reflected) `` and "the property `stickyHeader` as `sticky-header` (reflected)"
    (`changelog.test.ts`);
  - the styles four-blocks paragraph (`packages/styles/test/readme.test.ts`).

  They fail on the base's CHANGELOGs for the right reason, as `check-final-tests-on-base.log` shows and as I
  reproduced. They pass at HEAD. T075 is removed from `tdd-exempt.md`'s exemption, and `tasks.md` is updated to match.
- **R1-03 (note): corrected.** `plants.md:21-22` now reads "the 22 of the elements' gates and 18 mutation plants",
  which matches run 1's log.
- **R1-04 (note): corrected as asked.** `quickstart.md:83` now says `connectedCallback`. The remaining wording of the
  second line is R2-01, a note.
- **R1-05 and R1-06 (notes):** no change was asked. Round 2's TDD check supersedes R1-06: it ran in full, with
  `head` e05373a.
