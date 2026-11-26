---
phase: 1
round: 1
verdict: changes_requested
base: c7ba57d98f410d956c5c072302c8b34ae221dc5b
head: 74f74060d3c819d3c359e40fa8dd140af202252b
tdd_check: fail
---

# Phase 1 review, round 1

Scope: `git diff c7ba57d..74f7406` (User Story 1, `ocelle-disclosure`), no uncommitted change. Operator decisions
applied: `reviews/phase-1/operator-spike-decisions.md` (summary named from `.label`) and `reviews/operator-ci-first.md`
(CI-first: the full plant set, full visual and mutation runs are CI's; sandbox paths redacted). `tdd-check.json` was
written for `a2b9147`; HEAD `74f7406` adds only the check's own evidence files, so it is current for the code.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | gates/test/integration/plant-repo.test.ts:225 | The test pins the repository's baseline count at 388. This phase adds 16 baselines (`storybook/baselines/elements-ocelle-disclosure--*.png`), so at HEAD the test fails: `expected [ …(404) ] to have a length of 388 but got 404` (`check-head.log`, and reproduced in this review). The red commit updated the other 388 pins (visual.test.ts, axe.test.ts:52) but not this one. `tdd-check.json` reports `fail`: "tests fail at HEAD". | Pin 404, the repository's count with this phase's baselines. |
| R1-02 | blocking | gates/test/integration/axe.test.ts:68 | The unlabelled-button plant's expected summary still reads `axe: 2 findings in 390 story-theme runs` (388 + the plant's 2). With this phase's 16 story-themes the gate prints 406, so the test fails at HEAD (`check-head.log`: "fails a story with an unlabelled button in both themes ... AssertionError"). The first test of the same file was updated to 404, this one was missed. | Expect `axe: 2 findings in 406 story-theme runs`. Run the test, or leave it to CI's unit-tests check and say so in the fix note. |
| R1-03 | note | specs/020-disclosure-code-block/reviews/phase-1/plants.md:5 | The record says "252 of the 337 plants". `pnpm run gate:plants -- --affected c7ba57d --list` prints `317 of 317 plants selected`. The `note: affected:` line matches the record (`every plant, by packages/elements/package.json (not mapped)`), and so does the base. | Correct the total when the record is next changed. |
| R1-04 | note | specs/020-disclosure-code-block/reviews/phase-1/plants.md:5 | The recorded exit is 143: the run was stopped after 252 plants. The procedure treats an exit other than 0 as blocking. The selection is the full set, though, and the operator's CI-first decision leaves the full local plant run to CI's required Plants check. I apply that decision, so this is not blocking here. It is CI's to decide before merge. | None in this phase. CI's Plants check must pass. |
| R1-05 | note | specs/020-disclosure-code-block/tasks.md:128 | T013 is unticked. By the CI-first decision its heavy gates are CI's, and its checkpoint is "`tdd-check.sh 1` reports `pass`", which R1-01 and R1-02 block. | After the fix, rerun `tdd-check.sh 1`. Tick T013, recording which steps are left to CI. |

## Test quality

- **Red evidence.** There is one red commit, `f479a3b` (`red-commits`: `phase`), with exit 1. `check-red-phase.log`
  has 175 of 7941 tests failing, every one on an `AssertionError`, none on an import, syntax or setup error. The final
  tests on the scaffold `dfc24ba` fail 191 of 7957, again all on `AssertionError`
  (`check-final-tests-on-scaffold.log`). That count includes the eight bodies added later in `1a0b915`. On the base
  the run reports "no test file found" (exit 2), as expected before the scaffold.
- **Scaffold.** `git show dfc24ba`: `src/ocelle-disclosure.ts` with `define`, `@tagname`, the declared `open` and an
  empty render, plus its exports in `index.ts`, `browser.ts` and `package.json`. There is no behaviour and no test file.
  The VIII exemption is stated in the commit and in `notes.md`.
- **No weakening.** `git diff f479a3b..HEAD` over the test files touches only
  `packages/elements/test/scenarios/disclosure.ts`, and only by adding lines (+94, no `-` lines): eight bodies for
  mutation survivors (`1a0b915`). No body of the red commit was changed.
- **Assertions.** Each body returns an observed value that is compared with a full `expected` object. I found no
  `skip`, `only`, snapshot or conditional assertion. `attempt()` (scenarios/disclosure.ts:58) catches a failed
  shadow-part lookup, but it turns it into the value `"absent"`, which no `expected` holds, so the body still fails on
  its assertion. That is not a swallowed error.
- **Coverage.** US1-1 to US1-23 each have a body (US1-7 as a, b and c; US1-14 and US1-21 per motion setting and per
  theme; US1-19 per focus target). The FR-003, 004, 005, 006, 007, 011, 013 and 014 bodies and the edge cases are
  present. The keyboard paths (Tab, Shift+Tab, Enter, Space) are in US1-4, US1-5 and US1-22. Each body runs in both
  harnesses: 53 in process and 53 on the strict-CSP fixture.
- **Mutation.** Not run by this review. A whole-diff run takes about 45 minutes here, and under the CI-first decision
  the mutation run is CI's. The implementer's record (`notes.md` § Mutation): the final run had 121 mutants on changed
  lines, none survived, 2 timeouts (`connectedCallback` body and its `super` call removed), 25 compile errors and
  0 equivalent records. The first run's survivors were handled by simplifying equivalent branches out of the source
  and adding eight bodies. CI's mutation shards decide before merge.

## Checks run

Locally, on HEAD `74f7406`:
- `gate:typecheck`, `gate:lint` (453 files), `gate:style-lint` (42), `gate:test-lint` (333), `gate:prefix` (477),
  `gate:config-copies`, `gate:manifest` (`21 elements checked, no finding`), `gate:contrast` (207 / 215 pairs),
  `gate:csp` after `pnpm -r run build` (`47 files checked, no finding`), and `gate:signoff -- --range c7ba57d..HEAD`
  (`9 commits checked`): no finding from any of them.
- vitest on the disclosure's and the related tests: `test/disclosure.test.ts`, `test/browser/disclosure.test.ts`, the
  entry, root, exports and driver tests in both harnesses, `test/node/`, `test/build/` and
  `gates/test/integration/plant-repo.test.ts`. 1032 passed, 1 failed (R1-01).
- `storybook/test/integration/elements-stories.test.ts -t disclosure`: 49 passed.
- `gate:plants -- --affected c7ba57d --list`: `every plant ... (not mapped)`, 317 of 317 selected (R1-03, R1-04).
- From the tdd-check (`check-head.log`): the full unit-tests run at HEAD has 2 of 7957 failing (R1-01, R1-02).

Left to CI, by the operator's CI-first decision: the full plant set, `gate:visual` and `gate:axe` on the full
Storybook, `gate:storybook-build`, and the mutation shards. The implementer records runs of storybook-build (202
stories), axe (404 story-theme runs, 0 serious or critical, no exception entry) and visual (404 captures match), made
before that decision. No podman cross-check was possible.

Constitution and plan, by evidence:
- **Naming and I/O.** `ocelle-disclosure` and `ocelle-disclosure-toggle` are used. The element does no I/O.
- **Tokens.** The styles use only `--ocelle-*` tokens, with system colours under forced colours
  (src/ocelle-disclosure.ts:88-150).
- **Accessibility.** The shadow root has no `delegatesFocus` (R-01). The summary is named from `.label` by element
  reference, inside its own root, so no ID crosses a root (the operator spike decision, lines 276-278). The moved ID
  references are resolved in the host's tree. Focus is rescued when a close leaves it in the panel (FR-013). The axe
  tests and story tests pass.
- **Stories and baselines.** There are 8 stories, each with a baseline in both themes. `stories-layout.css` adds the
  288 px frame through a `data-story` selector, with no style attribute.
- **Scope guards.** `notes.md` § Gates records an empty diff over the SC-007 and SC-008 paths. The phase's diff
  touches none of them.
- **Path redaction.** No phase-1 evidence file contains `/root/` or `/home/user/`.

## Earlier findings

None: this is the first round.
