---
phase: 6
round: 2
verdict: approved
base: c2731a36106984d8f27d29b9b0a0af52c15f70e3
head: fed3d6959bfd26bf0a5d7ef54922279970b9dd32
tdd_check: pass
---

# Phase 6 review, round 2

This round reviews the round-1 fix of User Story 5. It covers the red commit `2a3d0a89` (R1-05, tests only), the fix
commit `b831cf6e`, the operator-decision record `d4771755` (Q-F1) and the red/green check `fed3d695`. I checked every
round-1 finding against the code and documents at HEAD, not against the fix note. Operator decisions applied:
Q-P6-1 (a); R1-03 in fix-1; R1-04 fixed; R1-05 "interactive only, and recorded"; Q-F1 (c). Under Q-F1 (c) the
README sentence on the `slotchange` stop gets its pin in phase 7's T063, so the missing pin is not a finding here.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | specs/018-status-elements/tasks.md:308 | Q-F1 (c) moves the README `slotchange` pin to phase 7's T063, but T063's text does not mention it. The only place the deferral is recorded is reviews/phase-6/operator-decisions.md. The operator decided this, so it does not block. | When phase 7 starts, add the pin to T063's text (or its red commit) so the deferral is not lost. No change in this phase. |

No blocking finding.

## Test quality

- **TDD check.** `tdd-check.json`: `pass`, head `b831cf6e`. It lists two red commits: `phase` `e5102bd0` with exit 1
  and `fix-1` `2a3d0a89` with exit 1. Final tests on base exit 1, head exit 0, and there are no problems.
  `check-head.log` shows 8317 tests passed in 251 files. Since `b831cf6e`, the later commits (`d4771755`,
  `fed3d695`) change only review records, so the check holds for HEAD.
- **Red evidence, fix-1.** `red-fix-1.log` and `check-red-fix-1.log` agree except for pnpm noise. Each shows 3 of
  8317 failing. Two are the new body "A forwarded slot's slotchange" (in process and on the fixture). Both fail with
  an `AssertionError` and the right reason: at the red commit a static pill swallowed the forwarded `slotchange`. The
  third is `build.test.ts:395`, the stale R1-01 pin, which was already failing at the round-1 head and which the red
  commit does not touch. There is no import, setup or timeout error. The story's tests are in the red commit, as the
  standing rule requires.
- **R1-01 has no red commit, correctly.** The `./ocelle-tooltip.js` import has existed since `a6200bc3`, so a corrected
  pin cannot fail at any commit after it. The non-vacuity evidence is `check-build-pin-on-base.log`: the new
  build.test.ts against the base's dist gives 1 failed and 38 passed. The failure is exactly the missing
  `"./ocelle-tooltip.js"` in `own` (build.test.ts:404). I confirmed the cause separately: the base source
  (`git show c2731a36:packages/elements/src/ocelle-pill-tag.ts`, :62-66) imports lit, control, define, icon-slot and
  status, and no tooltip.
- **No test weakened.** `git diff 2a3d0a89..HEAD -- packages/elements/test` touches only `build/build.test.ts`, the
  R1-01 pin. That pin is stricter: it names an exact ordered list with one more entry, and still checks `lit` and
  `rootImportsIt`. No test file was deleted, skipped or loosened between `120afc90` and HEAD. The fixture harness's
  allowed requests gained `module.js` (browser/pill-tag-truncation.test.ts:38). The new body needs it for
  `driver.module`, and pill-tag-interactive.test.ts allows the same file. The test still asserts zero CSP violations
  and no request outside the list.
- **The new body asserts.** scenarios/pill-tag-truncation.ts:545 returns `{ span, static, button, link }` and
  compares it with `toEqual` against `"default i"`, `"default i"`, `""`, `""`. The plain `<span>` twin shows the
  listener and the forwarding work, so the `""` of button and link are real negatives, not a broken harness. The body
  has no conditional, no skip and no swallowed error.
- **Plants on the stop (my own runs, source restored after each).**
  - `#stop` made unconditional (the stop not limited to the interactive modes): the new body fails, 1 of 1. Killed.
  - `#stop`'s test inverted to `=== "static"`: the bodies `slotchange \(R-09|US4-10|mode switch|An icon` give 5
    failed. Killed.

  These two agree with the fix note's plant table.
- **Mutation.** See the "Checks run" table.

## Checks run

Environment: Node 26 first on PATH, `OCELLE_CHROMIUM_PATH` set. Per reviews/operator-ci-first.md I ran only the fast
gates, the affected-plants list and the browser tests this phase changes. I did not run the full suite or the full
tdd-check, nor visual, axe, contrast or brand-rules; CI judges those.

| Check | Result |
|---|---|
| `gate:typecheck`, `gate:lint` (481), `gate:style-lint` (45), `gate:test-lint` (358), `gate:manifest` (23), `gate:config-copies`, `gate:csp` (48), `gate:prefix` (511), `gate:pins` (5) | no finding |
| `gate:signoff -- --range c2731a36..HEAD` | 10 commits, no finding |
| `vitest --project elements`: pill-tag-truncation (28), pill-tag-interactive (67), pill-tag (42), entry-pill-tag (1), tooltip (104) | 242 passed. Round 1's table gave 242 for these files with 27 truncation bodies. No test in them was removed since (git diff above), so that earlier total was off by one. |
| `vitest --project elements-browser`: browser/pill-tag*, browser/tooltip | 239 passed |
| `vitest --project elements-node` | 838 passed |
| `vitest --project elements-build` (after `pnpm run build` in packages/elements) | 39 passed, the corrected pin included |
| `gate:plants -- --affected c2731a36 --list` | 21 `note: affected:` lines, identical to plants.md. plants.md's base equals base.sha, its recorded exit is 0, and it judged the 21 (selection narrower than every plant, per operator-plants.md) |
| `gate:mutation -- --base c2731a36` (rerun by the reviewer) | exit 0: 129 mutants on the changed lines of `ocelle-pill-tag.ts`, none survived; 3 timeouts (the measure's change test, now :656, as in round 1), 29 compile errors (two more than round 1: :634, the `#stop` binding, as mutation-fix-1.log shows), 9 equivalent records. These are the same nine records I read and accepted in round 1, at shifted lines; the fix added none. The fix's own `#stop` mutants are all killed |
| TDD check (`tdd-check.json`, not rerun, as instructed) | `pass` |

None of the three timing flakes outside 018 that the operator named (dialog, tooltip, drawer) appeared in my runs or
in `check-head.log`.

## Earlier findings

- **R1-01 (blocking): resolved.** build.test.ts:404 pins `own` to `["./control.js", "./define.js", "./icon-slot.js",
  "./ocelle-tooltip.js", "./status.js"]`. The test name (:398), the block comment (:390-394) and the file header
  (:24-26) all say the pill imports exactly one element module, `./ocelle-tooltip.js`, and no other element nor the
  root. The suite passes at HEAD (`check-head.log`; my `elements-build` run). The fix commit has no red commit, which
  is correct because it is a stale test, and the base-dist run shows the pin fails for the right reason (above).
- **R1-02 (blocking): resolved.** T056 (tasks.md:289) now says the flex-row, grid-track and long-word bodies pin the
  behaviour the three rules stood for, and that the rules have no body, citing Q-P6-1 (a). T059 (tasks.md:295) names
  the merged chain, says the three rules are not written, and adds the R1-05 stop. Both now match the source: the
  interactive sheet at ocelle-pill-tag.ts:102-118 has no `min-inline-size` and no `overflow-wrap`.
- **R1-03 (blocking): resolved.**
  - data-model.md:96-111 describes the merged chain and the control's `--ocelle-target-small` minimum (FR-043), and
    says why the three rules are not written.
  - The amendments in research.md:
    - R-06 :248-251 and :328-331;
    - R-07 :469-482, with an "Amended by operator decision Q-P6-1 (a)" paragraph;
    - R-09 :551-559.
  - plan.md decision 5 (:121-129) also matches.
  - contracts/checks.md:115's plant column is no longer "the host's `min-inline-size: 0` removed". It now names "the
    `.icon-row`'s `max-inline-size: 100%` removed (the merged chain's row cap)" and gives the Q-P6-1 (a) reason why
    the host's and the row's own rules are not planted. It does not name the text span's `min-inline-size: 0`. That
    is correct: the fix note records that this plant survives the flex-row and grid-track bodies, while the row-cap
    plant is killed (2 failed). I reran the row-cap plant: with `.icon-row { max-inline-size: 100% }` (ocelle-pill-tag.ts:249-251) removed, the `Flex row|Grid track` bodies give 2 failed. Killed.
  - A search of the design documents for `anywhere` and for a host-level `min-inline-size: 0` finds only the
    amendment texts and the static-pill and metric plants of US2-7 and US3-8. Those are separate rules and correct
    as written.
- **R1-04 (note): resolved.**
  - ocelle-pill-tag.ts:74-75 says the module defines `ocelle-pill-tag` and the `ocelle-tooltip` it renders (FR-034),
    and no other element.
  - CHANGELOG.md:130 says "(defines `ocelle-pill-tag`, and the `ocelle-tooltip` an interactive pill renders)".
- **R1-05 (note): resolved per the operator decision.**
  - **The code.** ocelle-pill-tag.ts:633-635 `#stop` calls `stopPropagation()` only while `#modeNow()` is not static,
    and reads the mode when the event is dispatched. The icon slot binds it (:721), and `#onSlotchange` calls it
    (:642). `ocelle-tooltip` is unchanged (`git diff c2731a36..HEAD -- packages/elements/src/ocelle-tooltip.ts` is
    empty).
  - **The mode switch.** A slot is rendered for its mode, so judging the event by the mode at dispatch holds in
    practice. The window between an attribute change and the next render could stop a static slot's event once, or
    let one interactive slot's event through to a tooltip that the same render removes. Neither has an observable
    effect, and the mode-switch bodies pass.
  - **Recorded.** research.md:625-640 (R-09) records the stop as a decision with its reason, the 008 contract
    mismatch, the side effect and the alternatives. README.md:1446-1449 states that in button and link mode a
    forwarded slot's `slotchange` stops at the pill and that a static pill lets it bubble. That README sentence has
    no pin yet: Q-F1 (c) moves it to T063 (R2-01).
  - **Plants.** The new body (red in `2a3d0a89`) kills the stop's extension to static mode; I confirmed this above.
    The label-slot and icon-slot removals are killed by US4-10, the mode-switch bodies, "An icon" and the new body.
  - **008 triage.** The fix note passes the triage item on to the orchestrator (the tooltip should read its own slot,
    not `event.target`). Nothing was filed on GitHub, as the operator decided.
