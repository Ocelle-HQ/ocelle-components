---
phase: 3
round: 1
verdict: changes_requested
base: e39524c54f643a19315489db7c19f9773e1bf5a9
head: 88f4c9a
tdd_check: exempt
---

# Phase 3 review, round 1

Scope: `git diff e39524c..88f4c9a`. That is the planner's documentation commit c13c3c5 (FR-021, the spec Edge Case,
research R-06, contracts/elements.md, the contracts/checks.md driver table and the T042 task text), the phase commit
463e160 (README, T040/T042/T041 ticks, phase 2 `plants.md` cleanup, the phase 3 records) and the red/green record
88f4c9a. The working tree had no uncommitted change. Binding decisions applied: `reviews/phase-2/operator-late-font.md`,
`reviews/operator-ci-first.md`, `reviews/phase-2/operator-019.md`.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | reviews/phase-3/tdd-exempt.md:13-16; packages/elements/README.md:1334-1338, 1695-1697; packages/elements/test/node/readme.test.ts:270-271, 975-993; contracts/elements.md:81-85 | **The exemption does not meet Principle VIII.** The Exemption clause allows the red step to be skipped "only if its review states why no test could fail for it". The skill makes an exemption blocking "if any test could have failed for this phase". Here a test could have failed, and `tdd-exempt.md` says so itself: the README statements "are asserted by `readme.test.ts`", and the two new sentences "get no new assertion" because T042 forbids a test change. A README fragment test of the kind this project uses is a test that fails for this phase. Before the phase, both sentences were absent from the README. That makes the README a unit with checked behaviour, not one with no behaviour. The project's convention is also explicit. `readme.test.ts:975-977` asserts the `ocelle-code-block` README statements of contracts/elements.md "each statement by phrase", and the late-font caveat is now one of those statements (contracts/elements.md:83-85, "on a page where the sans face arrives after the first layout ... preload the sans face"). The WebKit sentence sits beside a fragment already asserted at readme.test.ts:271. As things stand, deleting either new sentence, or the qualifying "That holds once the block has laid out in its font" (README:1334-1335), leaves all 781 node tests green. The only thing in the code-block section that guards the operator's caveat is therefore nothing. T042's "No element code, story or test changes" (tasks.md:434-435) does not override this. The operator decision asks for no element change. It does not say "no test", and the constitution's principles are not negotiable against task text. | In a fix round, add fragments to `readme.test.ts` for (a) the late-font caveat (README:1334-1338, at least "That holds once the block has laid out in its font" and "preload the sans face for `rtl` scroll blocks") and (b) the WebKit sentence of T040 (README:1695-1697). Do not change any existing fragment. Show that the new fragments can fail (a red log against the README at e39524c, or with the sentences removed) and record it under `red-commits` as `fix-1`. If the orchestrator reads T042 as binding against a test change, the operator must decide that instead (accept the README sentences unasserted, recorded). The reviewer cannot waive it. |
| R1-02 | note | packages/elements/README.md:1331-1338; contracts/elements.md:80-85; readme.test.ts:984 | **README and contract agree in meaning, not to the letter.** The contract puts the qualifier inside the opening-write statement ("so, once the block has laid out in its font, the start of every line is in view"). The README keeps that sentence verbatim and qualifies it in the next sentence ("That holds once the block has laid out in its font: the one write uses the widths of the first layout, and a font swap does not repeat it"). The caveat and the preload advice follow. Read as a paragraph, the README states every element of the contract's statement: the condition, the late-font consequence and the preload advice with the token name. It adds nothing the spec does not hold (the arrow-key clause is FR-021's). The operator asked for "a README caveat", and this is one. The separate sentence is a reasonable way to keep readme.test.ts:984 valid without editing a fragment, so I do not count it as a disagreement. The cost is that the qualifier is now a separate statement, and only R1-01's fragment ties it to the README. | None beyond R1-01. Optionally, the contract could quote the README's two-sentence form at landing, so the letter matches too. |

## Test quality

- **Red evidence.** None. `tdd-check.json` is `exempt` (head 463e160; 88f4c9a only adds that file). The exemption is
  not justified (R1-01).
- **Weakened tests.** `git diff e39524c..HEAD` touches no test, story or gate file. Nothing was skipped, deleted or
  loosened. `test-lint` passes on 338 files.
- **Vacuous assertions.** No test was added, so there is nothing to judge. The gap is the missing assertions (R1-01).
- **Scaffold.** None for this phase.
- **Mutation.** `pnpm run gate:mutation -- --base e39524c…`: "nothing to mutate: no package or gate source line
  changed". That matches the phase, which changes no source.

## Checks run

Under `operator-ci-first.md`, locally:

- `gate:typecheck`: no type error. `gate:lint`: 459 files, no finding. `gate:style-lint`: 43 files, no finding.
  `gate:test-lint`: 338 files, no finding. `gate:manifest`: 22 elements, no finding. `gate:config-copies`: identical.
  `gate:prefix`: 486 files, no finding.
- `pnpm -r run build` exit 0, then `gate:csp`: 48 files, no finding.
- Manifest regenerated (`pnpm --filter @ocelle/elements run manifest`): no diff to `custom-elements.json`.
- `gate:signoff --range e39524c…..HEAD`: 4 commits, no finding.
- `vitest run --project elements-node` (the README test): 6 files, 781 tests passed.
- **Plants.** `plants.md` base equals `base.sha`, exit 0. My `gate:plants -- --affected e39524c… --list` shows "0 of
  317 plants selected", the same as the record ("no plant selected"). That is not a plant pass. CI's Plants check
  judges every plant.
- Left to CI: full `pnpm test`, the browser projects, `gate:contrast`, full mutation, full plants,
  `gate:storybook-build`, `gate:axe`, `gate:visual`. The phase changes no source, story, token or baseline.

Other checks:

- **Tasks.** T040, T042 and T041 are ticked (tasks.md:422, 430, 438), and their work is present. T040: the engine floor
  is unchanged with the reason recorded (notes.md § T040, consistent with research), the WebKit sentence matches
  research R-06 § WebKit (research.md:300-303) item for item, and the WebKit marker gets no line because `style-lint`
  admits it (phase 1 spike). T042: the README caveat (R1-02), and the spec, research and contract text was aligned
  in c13c3c5, as T042 states. T041: `checks.md` records the quickstart steps, the CI-first split and the SC-007/SC-008
  diffs against 8ebbe439 (operator-019.md). The phase 2 `plants.md` empty block was removed with the reason given
  (phase 2 R1-07). The contracts/checks.md driver-table rewrite in c13c3c5 lies outside phase 3's tasks. T042's text
  names it as the planner's alignment for phase 2 R1-03 and R1-04, so it has a reason.
- **Constitution.** No element, event, style, token, I/O or network change. The new records contain no sandbox paths
  (`tdd-check.json` uses `<repo>`).
- **Earlier phase 2 note R1-01.** It went to the operator and was answered by `operator-late-font.md`. The decision is
  carried out as asked: the README caveat, FR-021 qualified (spec.md:472-476), and no element change. The known-gap
  entry for the ALL PHASES DONE message is recorded in notes.md for the orchestrator.

## Earlier findings

This is round 1 of phase 3, so there is no earlier round.
