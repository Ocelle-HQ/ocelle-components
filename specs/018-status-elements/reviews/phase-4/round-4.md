---
phase: 4
round: 4
verdict: changes_requested
base: b1de26af18d6bd3ead3f13149eff67459f039187
head: 97154a0a3e5d84f1e8b8f2f3ea5e9f960745ffec
tdd_check: fail
---

# Phase 4 review, round 4

Scope: the fix for operator round 3 (O3-01, option A), T044a as planned in `2f6a3245` (tasks.md:236-239,
contracts/checks.md:80, plan.md decision 15, research.md R-06). Fix commits `ccd9c5a5` (test-only:
`packages/elements/test/scenarios/pill-tag.ts`, `test/pill-tag.test.ts`, `test/browser/pill-tag.test.ts`) and
`97154a0a` (evidence: `notes.md`, `plants.md`, `red-fix-1.log`, `round-3-fixes.md`). `git diff 2f6a3245..HEAD` touches
those seven files only; no element source, story, baseline or other test changed (T044a's path list).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R4-01 | blocking | specs/018-status-elements/reviews/phase-4/tdd-check.json (`problems[0]`); packages/elements/test/exports.test.ts:18 | `tdd-check.sh 4` at HEAD `97154a0a` reports `fail`. The phase's own red commit `2eaa948f` (T035 to T039, not this fix) is now judged `invalid`, exit 2: its failing assertion `exports.test.ts:18` (the root-exports list, expected 22 names, got 23 with `OcellePillTag`) is classed "unchanged assertion". The same commit was `pass` (exit 1) in the check of `4ea285b0`. Between the two runs the replay was hardened on main (`64c57578`, #101, merged by `dfa6bc09`). T044a did not cause this, but the procedure makes every listed `fail` problem blocking. | The orchestrator, or the operator, decides how phase 4's original red evidence stands under the hardened replay (for example a recorded operator decision, or red evidence the new rule accepts). Then `tdd-check.sh 4` is re-run until it reports `pass`. No change to T044a's tests is asked for. |
| R4-02 | blocking | specs/018-status-elements/reviews/phase-4/tdd-check.json (`problems[1]`, `problems[2]`) | With `phase` invalid, the final tests on base and on the scaffold have "no independently proven red assertions available for replay" (both exit 2). This follows from R4-01. | Resolved with R4-01. |
| R4-03 | blocking | specs/018-status-elements/reviews/phase-4/tdd-check.json (`problems[3]`); gates/test/integration/axe.test.ts | Final tests on HEAD, exit 2: a non-assertion error in the whole-repository axe gate test, the same failure `red-fix-1.log` shows. `notes.md` says `reviews/operator-ci-first.md` leaves it to CI, but `tdd-check.json` does not exempt it, and no same-candidate CI run is recorded for this HEAD. | Either the check excludes that test under the CI-first decision (as a recorded `deferred_ci` entry, with the required same-candidate `Accessibility`/`Unit tests` proof for `97154a0a` or its successor), or the axe gate runs green locally. `tdd-check.sh 4` then reports `pass`. |
| R4-04 | note | packages/elements/test/scenarios/pill-tag.ts:852-861 | In process the icon-only pill's `top` and `height` go from exact pixel equality to `top < 0` and a lower bound. That is a loosening of an earlier assertion, but it is the operator's decision (O2-01, amended by O3-01 option A) with its reason recorded (the line box's descent depends on the fallback font), the exact pin is kept unchanged on the fixture, and the in-process body gains a new, font-independent `wrapperTop` equality and a token-derived `width` that it did not have before. Accepted as the operator-sanctioned replacement. | none |
| R4-05 | note | specs/018-status-elements/reviews/phase-4/notes.md § Operator rounds 2 and 3 fix, (1) | The fixture's pin passing is not by itself proof that Schibsted Grotesk loaded there, because the sandbox's fallback measures the same box. The proof is the recorded `document.fonts` reading (scratch test, not committed) together with the fixture driver's `document.fonts.ready` wait (`test/browser/driver.ts:58,80`) and `packages/tokens/test/browser/font.test.ts`. On CI a fixture that failed to load the font would fail the pin, so the check fails closed. | none |

No blocking finding concerns T044a's change itself (R4-04, R4-05 and the sections below). The three blocking findings come from `tdd-check.sh 4`, which reports `fail` at this HEAD. None of its problems is in the files T044a changed.

## Test quality

Read the whole diff of `ccd9c5a5` against `2f6a3245`.

- **The fixture pin is unchanged.** The `iconOnly` table (pill-tag.ts:98-101: −7.09, 29.19 × 50.09; compact −7.39,
  27.78 × 40.39) is byte-identical, and with `fontLoaded: true` the `only-p` / `only-r` observation and expectation are
  exactly the old ones (`{ row, top: hundredth(top), size: [hundredth(height), hundredth(width)] }`). The browser
  runner passes `pillScenarios({ fontLoaded: true })` (test/browser/pill-tag.test.ts:36), the in-process runner
  `pillScenarios({ fontLoaded: false })` (test/pill-tag.test.ts:30). These are the only two consumers.
- **In process, the five facts of O3-01, from tokens.** `row` `icon-row bare`; `aboveText: top < 0`;
  `width` within 0.5 px of `iconOnlyWidth` = 2 × `sizes[d].inline` + 2 × `borderWidth` + `sizes[d].lineHeight` +
  `space2` (pill-tag.ts:104); `wrapperTop` = `.icon-slot` top within 0.5 px of pill top + `borderWidth` +
  `sizes[d].block`; `heightAtLeast` ≥ `iconOnlyLeastHeight` = 2 × block + 2 × border + icon (pill-tag.ts:107) less
  0.02 px for the layout unit (the same allowance as the one-line `height` check). Every term comes from
  `expectedTokens` through `declared()` / `rem()` (`border-width`, `space-1/2/3`, `font-size-sm/xs`,
  `line-height-tight/snug`); no pixel literal is written. The icon size is `1lh` = font-size × line-height token,
  which is font-independent. Every other Baseline assertion is textually identical in both harnesses; the four
  bodies moved to the end of the list (`baselineScenarios`), which no count or index depends on.
- **Font independence, checked independently.** In a scratch worktree at HEAD, with `:root { --ocelle-font-sans:
  <font>; }` added to the Baseline body's rules, the four in-process Baseline bodies pass under FreeSans, DejaVu
  Serif and Liberation Sans. The same FreeSans override on the scenario of `2f6a3245` fails all four, on the icon-only
  pill only (top −10.09 against −7.09, height 30.19 against 29.19, width 50.09 unchanged), so the override reaches
  the pill and reproduces the PR #105 shard-4 failure, and the new assertions do not depend on the fallback font.
- **Plants (T044a (3)).** `plants.md` § T044a records each of the three plants killed 4 of 4 in each harness, with the
  killing assertion. I reproduced the two whose in-process kill is new, in the scratch worktree (main tree never
  touched), in process: the dropped override (`css` `.icon-row { align-items: baseline; } .icon-slot { align-self:
  flex-start; }` after `iconSlotStyles`) fails 4 of 4 on `only-p` / `only-r` `wrapperTop` false only, as recorded;
  `bare` never set (`class=${"icon-row"}`) fails 4 of 4 on `row` `icon-row` and `wrapperTop` false, as recorded.
  `bare` on every row is killed by the unchanged one-line `onBaseline` / `firstLineOnBaseline` assertions, shared by
  both harnesses. The fixture kills rest on the unchanged pixel pin, which killed the same plants at T044. The
  evidence supports "all three killed in process and on the fixture". The phase `--list` run in `plants.md` matches
  mine (326 of 326, `.github/workflows/mutation-shadow.yml` not mapped, exit 0, base = `base.sha`).
- **Red evidence.** `red.sh 4 fix-1` on `ccd9c5a5` returned `red: false`, `recorded: false` (`red-fix-1.log`); its
  only failure is the whole-repository axe gate, unrelated. That is acceptable here: the change tightens and
  re-partitions a test after an operator round, the element is correct and unchanged, and no commit of these tests
  alone can fail for a defect that was in the test (Principle VIII's exception, stated). The landing skill allows
  hand-applied mutants for behaviour-neutral coverage fixes and leaves the choice to the reviewer
  (`.claude/skills/ocelle-land/SKILL.md:139-141`); T044a names that alternative. I accept the hand-applied plants,
  two of them reproduced above, as the evidence that the new assertions can fail. `red-commits` correctly gains no
  `fix-1` line.
- **Vacuity.** No `skip`/`only`, no conditional assertion: the harness branch selects which observation and which
  expectation, and both branches are compared with `toEqual`. Booleans are compared against `true` and each was
  shown false under a plant (`wrapperTop`, `row`) or under a font change in the old body; `aboveText` and
  `heightAtLeast` are bounds the operator chose.
- **Mutation.** `pnpm run gate:mutation -- --base 2f6a3245`: "nothing to mutate: no package or gate source line
  changed" (test-only change).

## Checks run

At HEAD `97154a0a`, Node 26, `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`:

- `vitest run --project elements packages/elements/test/pill-tag.test.ts`: 42 of 42 passed.
- `vitest run --project elements-browser packages/elements/test/browser/pill-tag.test.ts`: 41 of 41 passed.
- `gate:typecheck` (no type error), `gate:lint` (750 files, no finding), `gate:test-lint` (574 files, no finding): exit 0.
- `gate:plants -- --affected b1de26af… --list`: exit 0, 326 of 326, as recorded.
- `gate:mutation -- --base 2f6a3245`: nothing to mutate.
- Scratch-worktree reproductions above (fonts and plants), worktree removed afterwards.
- `tdd-check.sh 4`: run separately by the orchestrator, not by me; its result at HEAD `97154a0a` is `fail` (`tdd-check.json`, `check-*.log` updated by that run and committed with this round): see R4-01 to R4-03. The previous pass (`4ea285b0`) predates the replay hardening of #101.

## Earlier findings

- **O3-01 (round 3, operator): resolved.** The Baseline bodies take the harness from their runner; the fixture keeps
  T002's pin unchanged; in process they assert exactly the five facts of option A, from token values, in the
  paragraph and the row and in each density; the three plants are killed in both harnesses and recorded per harness
  in `plants.md`; the font proof and the FreeSans reproduction are in `notes.md`. No element source changed.
- **O2-01 (round 2, operator): resolved** through O3-01, which amends its in-process facts.

T044a (tasks.md:238): its work is present and complete, and on its own evidence I accept it: the fixture pin is unchanged, the five in-process facts come from tokens and do not depend on the font, the three plants are killed in both harnesses, and hand-applied plants are acceptable red evidence. This round is still `changes_requested`, because `tdd-check.sh 4` fails (R4-01 to R4-03, none of them in T044a's files). T044a stays unticked until a round approves. A later round needs to check only that `tdd-check.sh 4` reports `pass`, plus anything new.
