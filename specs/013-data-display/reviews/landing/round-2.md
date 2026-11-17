---
scope: landing
phase: landing
round: 2
verdict: approved
base: 3828d2fee8dccab6f5c2697f859e2af7247d3378
head: 98b1e290
tdd_check: pass
---

# Landing review, round 2 (PR #43, mission 013-data-display)

Round 2 has a narrow scope under the stop rule. It checks that round 1's blocking finding L1-01 is resolved, checks
the two notes the operator chose to act on (L1-02, L1-03), and checks that nothing regressed since round 1 (`1a35461`).
It is not a fresh full review. I judged the code and tests at HEAD `98b1e290` against L1-01 to L1-03 as round 1 wrote
them, and did not rely on the fix notes.

How it was handled: an operator round (`reviews/phase-1/round-3.md`, O3-01 for L1-01, O3-02 for L1-02, O3-03 for
L1-03), planner tasks T021b to T021d (`af7c01d`), and a fix (`13f7a00`). Phase 1 round 4 then found the new test's
connected half vacuous (R4-01). It was fixed at `2e1215d`, and phase 1 round 5 approved it (`98b1e29`).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L2-01 | note | packages/elements/src/ocelle-facts.ts:13 | Phase 1 R5-01 still applies. The header comment says the grid pass "sets `cols-1` below the threshold or `cols-2` below twice it". Since O3-02, the pass sets both classes below the threshold (:305-306). The layout is unchanged, because the later `cols-1` rule (:121) overrides `cols-2` (:117), and data-model.md :66 and :82 describe this correctly. The problem is only the comment. | Optional: at a later source change, use data-model.md :66's wording. |

There is no blocking finding.

## Earlier findings

- **L1-01 (blocking): resolved.**
  - At HEAD, `disconnectedCallback` (:220-232) carries no `BlockStatement` record. `window.removeEventListener("resize",
    this.#resized)` (:231) carries no `StringLiteral, CallExpression` record. The records round 1 said could stay are
    still there with their reasons: `super`, both observers' `disconnect()` and `cancelAnimationFrame`.
  - The new test is `packages/elements/test/facts.test.ts:48-80`, "a removed sheet stops listening, in process". It
    is the remedy round 1 recommended in (a): the reproduction, run in process.
    - A 300 px sheet, which is `stacked`, is removed. Then `window` receives `resize`, and the test asserts that the
      removed `<dl>` keeps `stacked`.
    - The positive control is a connected sheet with a fixed block size and hidden overflow. Its class is cleared by
      hand, and `undispatched: []` shows that no `ResizeObserver` callback restores it. Only the same `resize`
      dispatch does that, so the dispatch is shown to reach a listening sheet. This is phase 1 R4-01's fix, and phase
      1 round 5 confirmed it with a plant that deletes `addEventListener`.
  - My plant was a different mutant from the two in contracts/checks.md. I changed :231 to
    `window.removeEventListener("", this.#resized)`, which is the `StringLiteral` mutant that the deleted record used
    to hide. The test then failed on `removed: []` against the expected `["stacked"]`. That is the same detached-sheet
    behaviour round 1 reproduced. I restored the line with `git checkout` and the tree was clean.
  - The `BlockStatement` and `CallExpression` mutants have the same effect: the listener stays. contracts/checks.md
    :90-95 records them as the test's plants. Phase 1 round 5 ran `gate:mutation` on `ocelle-facts.ts`'s changed
    lines with no survivor (190 mutants). I did not re-run it.
- **L1-02 (note): acted on as far as the operator chose (O3-02).** At :306, the redundant `size >= threshold &&`
  operand and its `ConditionalExpression` record are gone. The line is `classes.toggle("cols-2", size < 2 *
  threshold)`. Below the threshold this sets `cols-2` as well as `cols-1`, and `cols-1`'s later rule at the same
  specificity wins, so the layout is the same, as round 1 argued. No test or story reads the `cols-*` class names
  (grep). The tests assert computed tracks. The other `ConditionalExpression` records stay by operator decision, as
  O3-02 records. The comment left behind is L2-01.
- **L1-03 (note): resolved (O3-03).** The reason at `gates/stylelint/token-only.ts:286` now names the
  `functionRaw` reads for `grid-template-columns` and `transform translateX(<percentage>)`, and says why `""` is
  none of them. The change is a comment only.
- **L1-04, L1-05 (notes):** they needed no change. The relevant code is untouched since round 1.

## No regression since round 1

`git diff 1a35461..HEAD -- packages gates storybook` touches 3 files, +36 / -5:
- `ocelle-facts.ts`: the two record deletions (L1-01) and the :306 operand and record removal (L1-02).
- `facts.test.ts`: one added `describe` with one test. No existing line changed.
- `token-only.ts`: the one reason line (L1-03).

Outside those paths, the range changes only `specs/013-data-display/{contracts/checks.md, data-model.md, tasks.md}`
and `reviews/phase-1/*`. checks.md adds the removed-sheet check and its plants. data-model.md :66 and :82 describe the
two-class grid toggle. Nothing under `storybook`, `gates/visual`, `gates/bin`, `gates/lib`, `gates/gates.json` or
`.github` changed, so the gate boundaries and the step 2.7 completeness that round 1 assessed still hold. No test was
deleted, skipped or loosened.

`origin/main` is still `ce1d9c7`. `git merge-tree --write-tree origin/main HEAD` is clean (tree `36d2175`).

## Checks run

On HEAD `98b1e290` in this container (`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`,
`OCELLE_VISUAL_ENGINE=docker`):

| Check | Result |
|---|---|
| `vitest --project elements facts.test.ts -t "removed sheet"` | 1 passed |
| The same with my plant (`removeEventListener("", …)`) | 1 failed, on `removed: []`. Restored afterwards. |
| `gate:lint` | `lint: 296 files checked, no finding`, exit 0 |
| `gate:typecheck` | `typecheck: no type error in the files of tsconfig.json`, exit 0 |
| `gate:style-lint` | `style-lint: 16 files checked, no finding`, exit 0 |
| `gate:test-lint` | `test-lint: 202 files checked, no finding`, exit 0 |
| `pnpm test` | 3788 of 3793 passed. The 5 failures are all in `gates/test/integration/visual.test.ts` (:115, :126, :239, :251, :271), which need the pinned container. This container has no running container engine: `gate:visual` exits 2 with "no container engine (docker or podman) is available". The visual gate and its tests are untouched since round 1, so this is the environment, not a regression. |
| `git merge-tree --write-tree origin/main HEAD` | clean |

Skipped, left to CI on `98b1e290`:
- the visual tests and gate under docker;
- `gate:mutation` (phase 1 round 5 ran it on the changed lines);
- plants;
- storybook-build;
- axe, contrast and the other gates.
