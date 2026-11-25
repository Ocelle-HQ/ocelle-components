---
phase: 1
round: 3
verdict: approved
base: c7ba57d98f410d956c5c072302c8b34ae221dc5b
head: 2a084d796319a0958941814ba64da921e2f02978
tdd_check: pass
---

# Phase 1 review, round 3

Scope: `git diff c7ba57d..2a084d7` (User Story 1, `ocelle-disclosure`). There is no uncommitted change. Since round 2
(`baf9e9f`) the diff adds three commits. `fe17b6e` is the round-2 review. `4942751` is the round-2 fix: it ticks T013
and adds a CI-first line to `tasks.md`, and it adds `round-2-fixes.md`. `2a084d7` adds the regenerated tdd-check
evidence. No source, test, story or baseline file changed after round 2 (`git diff --stat baf9e9f..HEAD`).

Operator decisions applied:
- `reviews/phase-1/operator-spike-decisions.md`: the summary is named from `.label`.
- `reviews/operator-ci-first.md`: CI-first. The full plant set, `gate:storybook-build`, the full `gate:visual` and
  `gate:axe` runs and the mutation shards are left to CI. Sandbox paths are redacted.
- Op 022 (#57) owns the `focusable.ts` closed-`details` case and the icon-slot naming. They are known gaps and are not
  findings here.

`tdd-check.json` was written for `4942751`. HEAD `2a084d7` adds only that check's evidence, so the check is current for
the code.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | note | specs/020-disclosure-code-block/reviews/phase-1/plants.md:5 | Carried from R2-02 and R1-04. The recorded exit of the affected plant run is 143: the operator stopped it under the CI-first decision. The base and the selection match the record (rechecked below). | None in this phase. CI's required Plants check must pass before merge. |

There is no blocking finding.

## Test quality

- **Red evidence.** The one red commit is `f479a3b` (`red-commits`: `phase`), and it exited 1.
  `check-red-phase.log` has 175 failures, each an `AssertionError`, and no import, syntax or setup error. The final
  tests exit 2 on the base ("no test file found") and 1 on the scaffold `dfc24ba`. At HEAD the full run exits 0:
  `unit-tests: 7957 tests passed in 236 files` (`check-head.log`).
- **Scaffold.** `dfc24ba` is unchanged. It adds signatures only and no test file, and the final tests fail against it
  (`tdd-check.json`: `final_tests_on_scaffold_exit: 1`).
- **No weakening.** `git diff f479a3b..HEAD` over `packages/elements/test`, `storybook/test` and `gates/test` touches
  three files:
  - `packages/elements/test/scenarios/disclosure.ts` gains 94 added lines and no removed line. These are the eight
    mutation-survivor bodies.
  - `gates/test/integration/plant-repo.test.ts:225` and `gates/test/integration/axe.test.ts:68` each have a one-line
    exact-count pin update. This was the R1 fix, and each pin still compares an exact value.
  - Nothing changed after round 2.
- **Fix rounds without a red commit.** Neither round 1 nor round 2 has a `fix-<round>` red commit, which is correct.
  Round 1 updated stale count pins, which were already red at that HEAD. Round 2 changed only the task record.
- **Assertions and coverage.** Unchanged since round 1 (`round-1.md` § Test quality):
  - Each body compares an observed value with a full `expected` object.
  - There is no `skip`, `only`, snapshot-only or conditional assertion.
  - Each of US1-1 to US1-23 has a body, as do the FR bodies, the edge cases and the Tab, Shift+Tab, Enter and Space
    paths.
  - Every body runs in both harnesses.
- **Mutation.** Not run locally, because the mutation shards are CI's under the CI-first decision. The phase's source
  (`packages/elements/src/ocelle-disclosure.ts`) has not changed since the implementer's run. That run is recorded in
  `notes.md` § Mutation: 121 mutants on changed lines, none surviving, 2 timeouts, 25 compile errors and no
  equivalent-mutant record.

## Checks run

Run locally on HEAD `2a084d7`:
- Fast gates:
  - `gate:typecheck` (no type error)
  - `gate:lint` (453 files)
  - `gate:style-lint` (42)
  - `gate:test-lint` (333)
  - `gate:prefix` (477)
  - `gate:config-copies` (identical)
  - `gate:manifest` (`21 elements checked, no finding`)
  - `gate:contrast` (207 / 215 pairs, 196 required)
  - `gate:csp` after `pnpm -r run build` (`47 files checked, no finding`)
  - `gate:signoff -- --range c7ba57d..HEAD` (`15 commits checked, no finding`)

  Each gate printed its no-finding summary line.
- The phase's tests, with vitest:
  - `packages/elements/test/disclosure.test.ts`, `test/browser/disclosure.test.ts`, `test/entry-disclosure.test.ts`
    and `gates/test/integration/plant-repo.test.ts`: 140 passed (53 in process, 53 on the strict-CSP fixture, 1 entry
    and 33 plant-repo).
  - `storybook/test/integration/elements-stories.test.ts -t disclosure`: 49 passed. The other 514 were skipped by the
    filter.
  - `packages/elements/test/node`, `test/build`, `test/exports.test.ts`, `test/entry-root.test.ts`,
    `test/driver.test.ts` and `test/browser/driver.test.ts`: 893 passed in 13 files.
- `gate:plants -- --affected c7ba57d98f410d956c5c072302c8b34ae221dc5b --list` printed `note: affected: every plant, by
  packages/elements/package.json (not mapped)` and `317 of 317 plants selected`. The base and the selection match
  `plants.md`.
- From the tdd-check (`check-head.log`), the full unit-tests run at `4942751`: 7957 passed.

Left to CI, by the operator's CI-first decision:
- the full plant set;
- `gate:storybook-build`;
- `gate:visual` and `gate:axe` on the full Storybook;
- the mutation shards.

The implementer's earlier summary lines for those gates, and the note that no podman cross-check was possible, are in
`notes.md`:118-127.

**Whole-phase re-review.** I read `packages/elements/src/ocelle-disclosure.ts` again in full. Round 1's findings on
these points still hold:
- **Names and events.** The element is `ocelle-disclosure` and its event is `ocelle-disclosure-toggle`, which bubbles,
  is composed and is not cancelable.
- **No I/O.** The element does none.
- **Tokens.** The styles use `--ocelle-*` tokens only, with system colours under forced colours.
- **Accessibility.**
  - There is no `delegatesFocus`.
  - The summary is named by an element reference to `.label`, in its own root, while the host gives no
    `aria-labelledby` or `aria-label`. This follows the operator decision.
  - The moved ID references are resolved in the host's tree, so no ID crosses a root.
  - Focus is rescued when the disclosure closes while focus is in the panel (FR-013).
  - A host `aria-expanded` is mapped onto `open` and removed.
- **Stories and baselines.** There are 8 stories, each with a light and a dark baseline.

**Tasks.** Every task of `## Phase 1:` in `tasks.md` is ticked, T013 included.

**Path redaction.** The logs regenerated in `2a084d7` contain no sandbox path (op 023). The only matches under
`reviews/` are prose that names the rule (`operator-ci-first.md`, `round-1.md`:85, `round-2.md`:71) and the plan lens
file `reviews/plan/round-1/lens-correctness.yaml`, which is outside this phase.

## Earlier findings

- **R2-01 (blocking): resolved.** `4942751` ticks T013 (`specs/020-disclosure-code-block/tasks.md`:209) and adds lines
  221-224. These name the steps left to CI: the full plant set, `gate:storybook-build`, `gate:visual` and `gate:axe` on
  the full Storybook, and `gate:mutation`. They also say where the locally run steps are recorded. This matches the
  required change. The checkpoint holds: `tdd-check.json` reports `status: pass`, `head_exit: 0` and no problems.
- R2-02 (note): deferred to CI by the operator decision. It is carried as R3-01.
