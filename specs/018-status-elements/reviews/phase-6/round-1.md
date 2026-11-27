---
phase: 6
round: 1
verdict: changes_requested
base: c2731a36106984d8f27d29b9b0a0af52c15f70e3
head: 27ffc83ccfef3548678f61ba44a64dd6c1fb141d
tdd_check: fail
---

# Phase 6 review, round 1

This round reviews User Story 5 (truncation and the full-text tooltip). The commits are the red commit `e5102bd0` and
the green commit `a6200bc3`. `7d53cec8` records operator decision Q-P6-1 (a), and `27ffc83c` holds the red/green check
output. No scaffold was used, and none was needed: every module and driver method the tests call exists on the base.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | packages/elements/test/build/build.test.ts:389-401 (and its header, :24-25) | **The T038 build pin is stale, and the suite fails at HEAD.** `tdd-check.json` is `fail` ("tests fail at HEAD"). `check-head.log` shows 1 of 8315 tests failing, at `build.test.ts:395`. That test pins `dist/ocelle-pill-tag.js` to the imports `./control.js`, `./define.js`, `./icon-slot.js` and `./status.js`, and to "no element module". Phase 6 adds `import "./ocelle-tooltip.ts"` (`src/ocelle-pill-tag.ts:78`, `dist/ocelle-pill-tag.js:78`). The plan calls for this import (plan.md:208, research.md:607, tasks.md T059), and so does the contract (contracts/elements-status.md:5: the pill's entry point "also defines `ocelle-tooltip`"). The source is right and the phase-4 pin is out of date, so this is a stale test, not a defect in the code. It still blocks: a failing check and a `fail` from the TDD check are both blocking. I reproduced the failure: `vitest --project elements-build` gives 1 failed, 38 passed, with the same assertion. The pin should have been updated in the red commit, under the standing rule that story tests belong there. Against the base source the updated pin would have failed for the right reason, since the base has no tooltip import. tasks.md has no phase-6 task for this file, which is how it was missed. | Update the pin so `own` equals `["./control.js", "./define.js", "./icon-slot.js", "./ocelle-tooltip.js", "./status.js"]`. Rename the test and fix its comment at :389-391 and the header at :24-25: the pill imports exactly one element module, `./ocelle-tooltip.js`, and still imports no other element and not the root. This is a stricter, corrected pin, not a loosened one. It is a test-only change that brings the test in line with behaviour already present, so no `fix-1` red entry can exist. The fix note must say so, and should show that the new pin fails against the base's dist. Then rerun `tdd-check.sh 6`, which must report `pass`. |
| R1-02 | blocking | specs/018-status-elements/tasks.md:289, :295 | **T056 and T059 are ticked, but their text describes work that is not in the code.** T059 lists "the `min-inline-size: 0` chain of the interactive host sheet and the disabled text's `overflow-wrap: anywhere`, written once T056's bodies observe them". T056 says each of these has "a shared body that observes it". Neither rule exists: the interactive sheet at `src/ocelle-pill-tag.ts:100-118` sets no `min-inline-size` and no `overflow-wrap`. No body can observe them in Chromium; the notes.md measurements show this and the plant runs confirm it (each removal survived). Operator decision Q-P6-1 (a) leaves the rules out, but the task text still says otherwise. The task check fails: a ticked task whose stated work is absent. | Reword T056 and T059 to say what was done, citing Q-P6-1 (a). The flex-row, grid-track and long-word bodies pin the behaviour. The three rules are not written because no Chromium layout can distinguish them from the merged rules. |
| R1-03 | blocking | specs/018-status-elements/data-model.md:96-99; research.md:327-328 (R-06), :466-470 (R-07), :541-544 (R-09); contracts/checks.md:115 (plant column); plan.md:121-122 | **The design documents still specify the three rules Q-P6-1 (a) left out.** data-model.md § interactive host sheet lists "the `min-inline-size: 0` chain on host, control, `.icon-row` and text span; the disabled pill's `overflow-wrap: anywhere`". R-07 gives `:host { display: inline-grid; min-inline-size: 0; }`, the chain on the control, `.icon-row` and text span, and `overflow-wrap: anywhere` for disabled text. R-09 repeats both. R-06 says the interactive sheet "adds `min-inline-size: 0` on the `.icon-row`". checks.md § US5 "flex row and grid track" lists the plant "the host's `min-inline-size: 0` removed", which cannot run because the rule does not exist. The code also departs from the docs on the control: per FR-043 its minimum is `--ocelle-target-small`, not 0. The operator decision requires these amendments and assigns them to "the round-1 fix or to phase 7". tasks.md has no phase-7 task that carries them (T063 covers only README and CHANGELOG). | In fix-1, amend data-model.md, R-06, R-07, R-09, plan.md decision 5 and the checks.md plant column to match the merged chain the source comment describes (`src/ocelle-pill-tag.ts:66-70`). That chain is the text span's `min-inline-size: 0`, the row's `max-inline-size: 100%` and the control's `--ocelle-target-small`, with `break-word` on disabled text. Cite Q-P6-1. If the operator prefers phase 7, add a named phase-7 task for it to tasks.md in fix-1 so the deferral is tracked. |
| R1-04 | note | packages/elements/src/ocelle-pill-tag.ts:72-73; packages/elements/CHANGELOG.md:130 | **Two older statements say the pill's module defines only `ocelle-pill-tag`.** The source header still ends "Importing this module defines `ocelle-pill-tag` and no other element", and the phase-4 CHANGELOG entry, still under Unreleased, says the entry point "(defines `ocelle-pill-tag` only)". Both contradict this phase's CHANGELOG paragraph (:35-37), README:42 and contracts/elements-status.md:5. | Fix both in the same pass as R1-01 so the module defines `ocelle-pill-tag` and the `ocelle-tooltip` it renders. Otherwise T063 must catch the CHANGELOG line. |
| R1-05 | note | packages/elements/src/ocelle-pill-tag.ts:135-144, :633-641, :717 | **The pill stops its own slots' `slotchange` to protect `ocelle-tooltip`. The workaround is sound, but it has an unrecorded side effect.** The diagnosis holds. The pill's slots sit inside the inner control, which is assigned to the tooltip's slot, so a `slotchange` on them bubbles through the tooltip's slot. `ocelle-tooltip.ts:387-396` then takes `event.target.assignedElements()[0]`, the pill's slot's first element, as its trigger. 008's contract says the trigger is "the first assigned element" of the tooltip's own default slot (specs/008-overlays/contracts/elements-overlays.md:109), so the defect is in 008's implementation. The stop keeps the tooltip working to that contract, and the tooltip is unchanged, as required. Three plants kill both halves of the stop (label slot: US4-10 and mode switch; icon slot: "An icon"). Two side effects are not recorded in research.md or the README. (1) The stop runs in every mode, including static, where there is no tooltip. (2) It also stops a forwarded slot's `slotchange`, so a host that slots its own `<slot>` into a pill no longer receives that `slotchange` on any listener above the pill in its shadow tree. A probe of the HEAD browser build: a listener on the forwarding host's shadow root saw 0 events with the pill, static or interactive, and 1 with `ocelle-metric` in the same place. Listeners on the host's own slot still fire. No spec requirement or test covers this, so it is not blocking. | Record the stop as a decision in research.md R-08 or R-09, with its reason and the 008 defect. Consider limiting the stop to interactive modes, or say in the README that a forwarded slot's `slotchange` stops at the pill. File the 008 triage item notes.md proposes: the tooltip should ignore a `slotchange` whose target is not its own slot. |

## Test quality

- **Red evidence.** `red.sh 6 phase` at `e5102bd0` exited 1 with 79 of 8315 failing (`red-phase.log`; the
  committed `check-red-phase.log` matches it except for the pnpm timing lines). All 79 failures are `AssertionError`s,
  with no import, setup or timeout error. The files are both truncation harnesses (27 + 27), `entry-pill-tag` (1), the
  node README and CHANGELOG pins (13) and the story and gate counts (11). Running the final tests on the base source gives
  76 failures, all on assertions (`check-final-tests-on-base.log`). The difference is the three story and gate counts
  pinned in the red commit itself.
- **No test changed after red.** `git diff e5102bd0..a6200bc3` touches no test file. The amend before the red run
  added three bodies (a right-to-left fitting twin, a text replaced while truncated, a forwarded slot) and weakened
  nothing. The stale build pin (R1-01) is the one test that should have changed in red and did not.
- **Assertions.** Each body returns an observed object compared with `toEqual` against a full expectation, with axe
  included in process. Every negative is read past the test delay beside a showing twin. There is no `skip` or `only`,
  no conditional assertion, no swallowed error and no snapshot. The one `throw` (`scenarios/pill-tag-truncation.ts:40`)
  fails loudly when a computed style is missing. US5-1 to US5-6 each have bodies, in button and link mode where the
  story says so. So do the five triggers, sub-pixel, flex row and grid track (with the plan decision 14 sibling rules and
  the `flex: 1 1 0` cost), static → interactive, the mode switch, reconnection, the clipping ring, US4-10's tooltip half,
  the icon slot, the forwarded slot and full-text normalisation. Keyboard paths: focus shows the bubble, Escape hides
  it, and blur hides it. Story tests read both themes and confirm there is no open bubble in `Truncated`.
- **Plants.** notes.md records 21 source plants, each applied once and each killed. Among them is phase 5's carried
  plant "the refocus in `updated()` (not queued)", which now dies through the tooltip half of US4-10.
- **Mutation.** See the "Checks run" table.

## Checks run

Environment: Node 26 first on PATH, `OCELLE_CHROMIUM_PATH` set. Per reviews/operator-ci-first.md I did not run the full
suite, visual, axe, contrast or brand-rules locally; the TDD check ran the full suite, and CI judges the rest.

| Check | Result |
|---|---|
| `gate:typecheck`, `gate:lint` (481), `gate:style-lint` (45), `gate:test-lint` (358), `gate:manifest` (23), `gate:config-copies`, `gate:csp` (48), `gate:prefix` (511), `gate:pins` (5) | no finding |
| `gate:signoff -- --range c2731a36..HEAD` | 4 commits, no finding |
| `vitest --project elements`: pill-tag-truncation, pill-tag-interactive, pill-tag, entry-pill-tag, tooltip | 242 passed |
| `vitest --project elements-browser`: browser/pill-tag-truncation, browser/pill-tag* | 132 passed |
| `vitest --project elements-node` | 838 passed |
| `vitest --project elements-build` | **1 failed** (build.test.ts:395, R1-01), 38 passed |
| `gate:plants -- --affected c2731a36 --list` | 21 `note: affected:` lines, the same as plants.md; plants.md base equals base.sha; recorded exit 0 |
| `gate:mutation -- --base c2731a36` (rerun by the reviewer) | exit 0: 126 mutants on the changed lines, none survived; 3 timeouts (the measure's change test at :652, which re-renders forever), 27 compile errors, 9 equivalent records. I read each record: the initial `#fullText` and `#truncated`, the observer teardown (as checks.md § US5 and R-09 foresee), `super.disconnectedCallback()`, the re-target test as `true`, and `#readLabel()`'s test as `false`. Each reason holds. The result matches `mutation-phase.log` |
| TDD check (`tdd-check.json`, not rerun) | `fail`: tests fail at HEAD (1 of 8315, R1-01); red commit exit 1; final tests on base exit 1 |

None of the timing flakes outside 018 that the operator named (dialog, tooltip, drawer) appears in `check-head.log`.

## Earlier findings

This is round 1 of phase 6, so there is no earlier round. Phase 5 deferred items to this phase (phase-5 round-1 R1-04,
a note, and operator decision R1-04: carry them in T056/T059). This is where each stands:

- **The tooltip half of § US4-10, with its plant "the refocus in `updated()` (not queued)": closed.** The US4-10 body
  (`scenarios/pill-tag-truncation.ts:488`) is in red, and its plant is killed (notes.md § Plants).
- **The `min-inline-size: 0` chain and the disabled text's `overflow-wrap: anywhere`: closed by operator decision
  Q-P6-1 (a), but the documents do not match yet.** The behaviour is pinned by the flex-row, grid-track and long-word
  bodies, and the rules are left out. The task text (R1-02) and the design documents (R1-03) still say otherwise.
