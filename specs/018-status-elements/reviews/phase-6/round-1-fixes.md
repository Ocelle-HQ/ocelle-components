# Phase 6 review round 1: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed | none possible: a stale test brought in line with behaviour already present (the `./ocelle-tooltip.js` import exists since `a6200bc3`), so no `fix-1` red entry can exist for it; the corrected pin fails against the phase base's dist for the right reason (check-build-pin-on-base.log) | packages/elements/test/build/build.test.ts (header, T038 block comment, test name, `own`) |
| R1-02 | fixed | none: not a behaviour finding (task text) | specs/018-status-elements/tasks.md T056, T059 |
| R1-03 | fixed | none: not a behaviour finding (design documents) | data-model.md § interactive host sheet; research.md R-06, R-07, R-09; plan.md decision 5; contracts/checks.md § US5 "flex row and grid track" (plant column) |
| R1-04 | fixed | none: not a behaviour finding (comment and changelog) | packages/elements/src/ocelle-pill-tag.ts header; packages/elements/CHANGELOG.md (phase-4 entry point line) |
| R1-05 | fixed (operator: interactive only, and recorded) | `fix-1 2a3d0a89` (red-commits; red-fix-1.log: exit 1, 3 of 8317 failed: the new body in process and on the fixture, and the stale T038 pin of R1-01, already failing at the review head) | packages/elements/src/ocelle-pill-tag.ts `#stop()`, `#onSlotchange()`, `render()`; packages/elements/test/scenarios/pill-tag-truncation.ts "A forwarded slot's slotchange"; packages/elements/test/browser/pill-tag-truncation.test.ts (allowed list); research.md R-09; packages/elements/README.md § Truncation and the full text |

## R1-01

The pin now reads `own` = `["./control.js", "./define.js", "./icon-slot.js", "./ocelle-tooltip.js", "./status.js"]`,
the test is named for it ("... ./ocelle-tooltip.js and ./status.js, and no other element module nor the root ..."),
and the block comment and the file header say that from phase 6 (US5, FR-034) the pill imports exactly one element
module, `./ocelle-tooltip.js`, and no other element nor the root. The rest of the pin (`lit`, `rootImportsIt`, the
browser build test) is unchanged. It is a stricter, corrected pin, not a loosened one.

No red commit is possible: the import has been in the source and dist since the green commit `a6200bc3`, so the
corrected pin passes at once. To show it is not vacuous, it was run against the phase base's dist: a worktree at
`c2731a36` with the new build.test.ts copied in, `setup:offline`, the package built, `vitest --project elements-build`:
1 failed, 38 passed, the failure exactly the missing `"./ocelle-tooltip.js"` in `own` (check-build-pin-on-base.log,
paths redacted). At the fix head: `vitest --project elements-build` 39 passed.

## R1-02, R1-03

T056 now says the carried behaviour (shrinking in a flex row or grid track, a disabled pill breaking a long word) is
pinned by the flex-row, grid-track and long-word bodies, and that the three rules have no body because no Chromium
layout tells them apart from the merged rules, citing Q-P6-1 (a). T059 says the chain is the merged one and that the
host's and `.icon-row`'s `min-inline-size: 0` and `overflow-wrap: anywhere` are not written, per Q-P6-1 (a); it also
names the round-1 `slotchange` stop.

data-model.md, R-06 (both of its mentions, :248 and :327), R-07, R-09 and plan.md decision 5 now describe the merged
chain: the text span's `min-inline-size: 0`, the `.icon-row`'s `max-inline-size: 100%`, and the control's minimum
`--ocelle-target-small` (FR-043), not 0, with the merged `overflow-wrap: break-word` on disabled text; R-07 carries an
"Amended by operator decision Q-P6-1 (a)" paragraph. The interactive host sheet is described as it is written
(`inline-grid`, the cap and margin, the enabled text's `nowrap`/`hidden`/`ellipsis`, the disabled text's
`normal`/`visible`/`clip`).

checks.md's plant for "flex row and grid track" was "the host's `min-inline-size: 0` removed", a rule that does not
exist. A plant must exist and be killed, so the merged rules were planted against the two bodies first: the text span's
`min-inline-size: 0` removed **survived** (2 passed: an `overflow: hidden` flex item's automatic minimum is already
0), so it is not the plant; the `.icon-row`'s `max-inline-size: 100%` removed was **killed** (2 failed), and so was
the host's `display: inline-grid` removed (2 failed). The column now names the row cap, with the Q-P6-1 (a) reason why
the host's rule is not planted.

## R1-04

The source header now ends "Importing this module defines `ocelle-pill-tag` and the `ocelle-tooltip` it renders around
an interactive pill's control (FR-034), and no other element"; the phase-4 CHANGELOG entry point line reads "(defines
`ocelle-pill-tag`, and the `ocelle-tooltip` an interactive pill renders)".

## R1-05

Red (`2a3d0a89`, tests only): one shared body, "A forwarded slot's slotchange", run in both harnesses. Four hosts each
forward `<slot name="i" slot="icon">` and `<slot>` from their shadow root into, in turn, a plain `<span>`, a static
pill, a button-mode pill and a link-mode pill. A module (`driver.module`) adds a `slotchange` listener on each host's
shadow root that writes the slot names it hears to the host's `data-heard`; the body then appends text and an icon to
each host. Expected, written from the operator decision: span `"default i"`, static `"default i"`, button `""`, link
`""`. At the red commit the static pill gave `""` (in process and on the fixture), the other three as expected: the
reviewer's probe (0 events with the pill, 1 with `ocelle-metric`), now with a plain-span twin in the same body. The
fixture harness adds `module.js` to the page's allowed requests (as pill-tag-interactive.test.ts has it).

`red.sh 6 fix-1` on `2a3d0a89`: `tests_only: true`, `red: true`, `recorded: true`, exit 1, **3 of 8317 tests
failed** (red-fix-1.log, paths redacted): `pill-tag-truncation.test.ts` and `browser/pill-tag-truncation.test.ts`, the
new body, each an `AssertionError` (static `""` for `"default i"`), and `build/build.test.ts:395`, the stale pin of
R1-01, which the red commit does not touch and which fails at the review head too. No import, setup or timeout error;
none of the timing flakes outside 018 that the operator named appeared.

Fix: `stop` (a module function bound to both slots in every mode) became the method `#stop(event)`, which calls
`stopPropagation()` only while `#modeNow()` is not static, read when the event is dispatched; the icon slot binds it and
`#onSlotchange` calls it. A mode switch renders new slots, so a slot's events are judged by the mode it was rendered
in. `ocelle-tooltip` is not changed. The stop is recorded as a decision in research.md R-09 (its reason, the 008
defect, the side effect and the alternatives), and the README's § Truncation and the full text states that in button
and link mode a forwarded slot's `slotchange` stops at the pill while a static pill lets it bubble.

008 triage item (for the orchestrator, not filed here): `ocelle-tooltip.ts` 387-396 takes
`event.target.assignedElements()[0]` as its trigger for any `slotchange` that reaches its slot; 008's contract
(specs/008-overlays/contracts/elements-overlays.md:109) makes the trigger the first element assigned to its own slot.
It should ignore a `slotchange` whose target is not its own slot (or read its own slot instead of `event.target`).

## Plants

Each applied once to the fix's source (restored after), running in process only the bodies named
(`vitest --project elements test/pill-tag-truncation.test.ts -t <pattern>`):

| Plant | Bodies | Result | Verdict |
|---|---|---|---|
| the label slot's stop removed (`#onSlotchange` without `#stop`) | `US4-10\|After a mode switch\|slotchange \(R-09` | 4 failed (both mode switches, US4-10, the new body) | killed |
| the icon slot's stop removed (no `@slotchange` on the icon slot) | `An icon\|slotchange \(R-09` | 2 failed | killed |
| the stop not limited to the interactive modes (`stopPropagation()` in every mode) | `slotchange \(R-09` | 1 failed | killed |
| the `.icon-row`'s `max-inline-size: 100%` removed (checks.md § US5 flex row and grid track, as amended) | `Flex row\|Grid track` | 2 failed | killed |
| the host's `display: inline-grid` removed | `Flex row\|Grid track` | 2 failed | killed |
| the text span's `min-inline-size: 0` removed | `Flex row\|Grid track` | 2 passed | survived these two bodies, so it is not their checks.md plant (R1-03) |
| the same, against every pill body in process (pill-tag, pill-tag-interactive, pill-tag-truncation) | all | 6 failed (US3-8 in four variants and densities; US5-6's long word in button and link mode), 131 passed | killed: the rule is observed, by the static flex row and the disabled long word |

`OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --affected <base.sha>` (`docker info` checked first): **21 of 317
plants judged, every plant as expected**, exit 0; the same 21 as the phase run. The selection is narrower than every
plant, so every selected plant was run, not only listed (reviews/operator-plants.md). plants.md is replaced with this
run.

## Mutation

`gate:mutation -- --base 51059341` (the fix's base; mutation-fix-1.log, paths redacted): **10 mutants on the changed
lines of `ocelle-pill-tag.ts`, none survived**; 0 timeouts, 2 compile errors (line 634, the `#stop` binding), 0
equivalent records. Every mutant of `#stop`'s mode test is killed; its `true` mutant is the plant "the stop not limited to the
interactive modes", which only the new body kills.

## Checks run

PATH with Node 26 first, `OCELLE_CHROMIUM_PATH` set; per reviews/operator-ci-first.md (no full suite, visual, axe,
contrast or brand-rules locally; the full TDD check is the orchestrator's):

- `gate:typecheck`, `gate:lint` (481), `gate:style-lint` (45), `gate:test-lint` (358), `gate:manifest` (23),
  `gate:config-copies`, `gate:csp` (48), `gate:prefix` (511), `gate:pins` (5): no finding; `gate:signoff` over
  `51059341..HEAD` after the commits.
- In process: `pill-tag-truncation` (28), `pill-tag-interactive`, `pill-tag`, `entry-pill-tag`, `tooltip`, `consumers`,
  `exports`: 253 passed.
- On the fixture: `browser/pill-tag-truncation` (28), `browser/pill-tag-interactive`, `browser/pill-tag`,
  `browser/tooltip`: 237 passed.
- `elements-node`: 838 passed. `elements-build` (after `pnpm run build` in packages/elements): 39 passed, the
  corrected pin included.
- `red.sh 6 fix-1` (full suite at the red commit, above); `gate:mutation`; `gate:plants --affected` (above).
