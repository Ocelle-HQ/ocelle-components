# Phase 5 notes: Polish & cross-cutting (T054 to T057)

Phase base `9a44e8e` (`base.sh 5`, `base.sha`). Commits of the phase:

- `f45e42b` `test(008-overlays): phase 5 red — Polish & cross-cutting`: T057 R1-02 and R1-03, test files only
  (`packages/elements/test/scenarios/tooltip.ts`);
- `915cfdd` `docs(008-overlays): phase 5 — bubble.ts says dismiss hides the shown bubble`: T057 R1-01, comment only;
- the phase commit with these notes, `tdd-exempt.md`, the logs and the ticks in `tasks.md`.

Environment: Chromium `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (`OCELLE_CHROMIUM_PATH`), docker with
the pinned image `ee15712262f0`, `OCELLE_VISUAL_ENGINE=auto`, `CI` and `GITHUB_ACTIONS` unset. No WebKit harness.

## T057: the three notes of `reviews/phase-4/round-1.md`

### R1-02, the FR-031 click-focus row, measured from the click

`Frames.clicked` serves (a capture-phase window listener, ms from the entry, the origin of the frame times), so the
row keeps its name "Click focus (FR-031): a pointer click on the button trigger and the pointer moved off it before
the delay: focus on the trigger without :focus-visible, no bubble at any frame of a 450 ms wait from the click; then
Shift+Tab and Tab back (keyboard focus) show it at once". In `f45e42b`:

- a run whose page recorded no click fails at once: `the click on the trigger: the page recorded no time for it after
  the entry`;
- `to450`: the last frame's `t` is at least `f.clicked + 450`;
- `never`: no frame of the whole record shows the bubble (from `track`, before the entry, to the last frame, which is
  past `f.clicked + 450`), and the frames span at least 400 ms from the click (`last - f.clicked >= 400`), not from the
  first sample;
- the pause after the move off is 500 ms (was 450), so the record reaches 450 ms from the click with a margin; a longer
  wait only adds frames that must show no bubble;
- `beforeDelay` on the move off (`f.left`, 300 ms bound) and the expected values are unchanged.

Measured, unloaded, with a temporary probe (never committed): click at 4.5 to 4.6 ms from the entry in process and
5.2 to 9.7 ms on the fixture; move off at 49.8 to 49.9 / 33.0 to 33.3 ms; last frame at 616.4 to 616.6 / 599.4 to
599.8 ms, so `to450` holds with about 160 ms to spare.

### R1-03, "Escape, then a brief hover", bound 100

`beforeDelay("the leave", …, 100)` in `f45e42b`: only a run whose page-side leave came before 100 ms is judged. Name
and expected values unchanged. Measured leave (probe as above): 83.1 to 83.4 ms in both harnesses, so the bound holds
unloaded. Under load a run at or after 100 ms is retried, at most 3 runs in all, then the row fails with "no run it can
judge"; it never passes without a judged run.

### Red step: no red recorded

`red.sh 5 phase` at `f45e42b` (full `pnpm test`, `red-phase.log`) reported `"tests_only": true, "red": true` and wrote
`phase f45e42b…` to `red-commits`. That is **not a red under T057's rule**: the run's one failure (`unit-tests: 1 of
5067 tests failed`) is an unchanged row, "Hover delay, moves inside the tooltip before the delay (R-12's delay rule,
the matrix's re-entry): the pointer enters the trigger, moves onto its inner span and back onto the trigger's edge,
both moves before the delay: the timer is not restarted, not shown before the 300 ms delay from the first entry, shown
before 300 ms from the move back and by 450 ms" (in process), with `the move back onto the trigger came at or after
the 300 ms test delay in each of 3 runs (334, 354.2, 470.3 ms from the entry): the row has no run it can judge`. That
is a load-timing setup failure of a row this phase does not touch. Both changed rows passed in that run, in both
harnesses. So the code already meets the stricter rows, as T057 expected, and no red commit counts. I removed the
`red-commits` file (its only line was that entry) so that `tdd-check.sh 5` reads the phase as exempt through
`tdd-exempt.md` and does not report a `pass` for a red that does not exist. `red-phase.log` is kept as the record.
`tdd-check.sh` was not run (orchestrator's instruction).

The re-entry row's "no run it can judge" under full load is open: see § Open.

### Break checks (temporary changes, reverted, never committed)

Each ran the row in both harnesses, `elements` (`packages/elements/test/tooltip.test.ts`, in process) and
`elements-browser` (`packages/elements/test/browser/tooltip.test.ts`, the strict-CSP fixture with the browser build
made from the edited source), first with the new row (`f45e42b`), then with the old row (the phase base's
`tooltip.ts`, `git show 9a44e8e:packages/elements/test/scenarios/tooltip.ts`). Command:

```
pnpm exec vitest run --project elements --project elements-browser packages/elements/test/tooltip.test.ts \
  packages/elements/test/browser/tooltip.test.ts -t "<row>" --reporter=verbose
```

Logs in `break-checks/` (colour codes stripped). The source and the test file were back at HEAD after each check
(`git status` clean but for this directory).

| Check | Change | New row | Old row (at `9a44e8e`) |
|---|---|---|---|
| R1-02 (`b02-*.log`) | In the constructor of `ocelle-tooltip.ts`: record the entry time at each `pointerover` from outside; on `click`, `setTimeout(() => this.#show(), 450 - offset / 2)`, `offset` the click's time from that entry. The bubble shows on click focus after 450 ms from the entry and before 450 ms from the click | fails in both harnesses: `clicked.never: false` (`to450: true`) | fails in both harnesses: `clicked.never: false`. The old row did **not** miss it: its `never(f, 400)` read every frame of its record, which in practice ran past 450 ms from the entry by more than the click's offset |
| R1-03 (a) (`b03a-*.log`) | `window.clearTimeout(this.#timer)` removed from `#onPointerout` only (keyboard focus is held, so the leave does not call `#hide`) | fails in both harnesses: `never: false` (the pending delay shows the bubble at 300 ms) | fails in both harnesses: `never: false` |
| R1-03 (b) (`b03b-*.log`) | Test side: `pause(150)` instead of `pause(50)` before the leave | fails in both harnesses with `beforeDelay`'s message, not by passing: `the leave came at or after 100 ms from the entry in each of 3 runs (183.1, 183.4, 183.5 ms from the entry): the row has no run it can judge` (in process) and `(183.8, 199.5, 183.2 …)` (fixture) | **passes** in both harnesses: the 300 ms bound judges a leave at about 183 ms, which the name's "within 100 ms" does not cover. This is the gap R1-03 named |

So R1-02's new row catches the break, and so did the old row in these runs: the old row was weaker in what it
guaranteed (frames to 450 ms from the entry), not in what it saw here. R1-03's new bound is what turns the 183 ms
leave from a judged pass into a "no run it can judge" failure.

### R1-01, `bubble.ts` comment (`915cfdd`)

`packages/elements/src/bubble.ts`:1-6 now says that `dismiss` hides the shown bubble (R-10 "hide current",
`ocelle-tooltip.ts`:137-144) until the pointer or keyboard focus enters its trigger again, and that a pending delay is
ended by the trigger's own `pointerout` or `focusout`, not by the hook. The member's doc comment (:10) reads "Hides the
shown tooltip bubble (an overlay is opening)". No code changed. No break check (comment only; `tdd-exempt.md`).

Out of scope, open for a later mission: making `dismiss` end pending delays, and a WebKit 17 row for a pending delay
under a modal. The elements suites have no WebKit harness, so no such row can be added cheaply here.

### Checks after the comment (at `915cfdd`)

- `gate:typecheck`: no type error. `gate:lint`: 300 files, no finding. `gate:style-lint`: 18 files, no finding.
  `gate:test-lint`: 204 files, no finding.
- The tooltip rows: covered by quickstart step 2 below (`elements` and `elements-browser` all green) and the full run.

## T054: R-16 closed out

- #10 is merged: `3828d2f` ("Mission 006: Storybook workbench, visual regression and axe gates (#10) (#24)") is
  `origin/main` and the merge base of HEAD with it; `origin/main` has no commit that HEAD lacks
  (`git rev-list --count HEAD..origin/main` = 0). The merge into this branch is `588d5a7`, an ancestor of HEAD.
- No story task depends on the unmerged branch: of the 72 commits of `origin/claude/010-storybook-workbench` that are
  not in `origin/main`, none is an ancestor of HEAD.
- R-16 ("rechecked against merged `main` (T026)") cites the merged tree. I checked each citation at HEAD:
  `gates/lib/capture-plan.ts:47-60` (context and screenshot options), `gates/gates.json:137` (axe uses the capture's
  context), `storybook/README.md:13-15`, `:20-28`, `:33-36`, `:41-43`, `gates/lib/story-page.ts:343` (the pointer
  locator) and `:449-457`, `gates/bin/axe.ts:55-69`, `gates/visual/capture.ts:72`, `gates/lib/axe-rules.ts:17-39`,
  `gates/lib/axe-verdict.ts:3-4`, `gates/lib/a11y-exceptions.ts:1-6`, `storybook/a11y-exceptions.json` (92 lines; R-16
  says 1-91, the last line being the closing bracket), `storybook/.storybook/stories-layout.css` (data-story selectors
  only, padding at 5-7). They state what the tree holds. Since `588d5a7` those gate files changed only in Stryker
  comment text (the renamed count titles), not at the cited lines' meaning.
- One citation is off: R-16 § Short viewport cites `storybook/.storybook/main.ts:49` for `viewport: false`; the line
  is `:23`, at `588d5a7`, at `origin/main` and at HEAD (the file has 31 lines). The fact stated is right. Not changed
  here (research.md is a design artifact; implementer role); open for the analysis step.
- The story counts R-16 names for after Phase 4 hold at HEAD: `gate:storybook-build` built 44 stories, and
  `gate:visual` and `gate:axe` ran 88 story-themes (below).

## T055: quickstart walk-through (at `915cfdd`)

| Step | Command | Result |
|---|---|---|
| 1 | `pnpm run gate:typecheck && pnpm run gate:lint && pnpm run gate:style-lint` | pass (as above) |
| 2 | `pnpm vitest run --project elements --project elements-touch --project elements-browser --project elements-node --project elements-build` (run as `pnpm exec vitest run …`) | 42 files, 2231 of 2231 passed |
| 3 | `pnpm vitest run --project tokens --project tokens-browser` | 16 files, 174 of 174 passed |
| 4 | `pnpm run gate:manifest` | 5 elements checked, no finding |
| 5 | `gate:csp`, `gate:prefix`, `gate:contrast`, `gate:brand-rules` | csp: 16 files, no finding; prefix: 251 files, no finding; contrast: 160 pairs in light, 168 in dark (149 required per theme); brand-rules: 7 rules checked |
| 6 | `pnpm run gate:mutation` | As written, the step cannot run: the gate requires `--base` (`could not run: --base <sha> is required`, exit 2). Phase 5's own run is in § Mutation. For the whole mission, `--base 3828d2f --plan` plans 60 shards with 59 cuts; I did not run those here (hours of Stryker). They ran phase by phase (`reviews/phase-2/`, `phase-3/`, `phase-4/` notes § Mutation), and CI runs the shards on the pull request |
| 7 | `gate:storybook-build && gate:visual && gate:axe` | storybook-build: built 44 stories; visual: 88 captures match their baselines (docker only, no cross-engine comparison), 113 s; axe: 88 story-theme runs, 0 serious or critical, 10 notes (0 incomplete, 10 excepted: the Prose document's clipped-table cells, as before), 71 s |

The two hand checks in the built Storybook were **not done**. They need a person at a browser, and none took part in
this run. I give no result for them:

- the Open project dialog story: Tab cycles inside it, Escape closes it, focus returns to the page;
- the tooltip-in-dialog story (`Inside an open dialog`): the first Escape hides the bubble, the second closes the
  dialog.

What automated evidence exists for the same behaviour (not a substitute for the hand check): the "Tab cycle (US1-2,
SC-002)" rows and the Escape and focus-return rows of `test/scenarios/dialog.ts` in both harnesses, and the row "Escape inside an open
ocelle-dialog (US3-4, SC-005, FR-010, FR-033): the bubble shown by keyboard focus; the first Escape hides the bubble
only: …; the second Escape requests its close, which closes it, focus back on the opener" in `test/scenarios/tooltip.ts`,
all green in step 2. WebKit has no harness here, so nothing in this phase ran on WebKit.

## T056: the three CHANGELOGs

Checked against the surface the mission adds (`git diff origin/main HEAD`: `packages/elements/package.json` gains
three exports; `packages/tokens/src/source.ts` gains three tokens; `packages/styles/` is unchanged):

- `packages/elements/CHANGELOG.md` § Unreleased › Added names the three elements, `ocelle-dialog`, `ocelle-drawer` and
  `ocelle-tooltip`, each with its properties, slots, parts and events, and each with its entry point,
  `@ocelle/elements/ocelle-dialog.js`, `@ocelle/elements/ocelle-drawer.js` and `@ocelle/elements/ocelle-tooltip.js`
  (the three new `exports` keys), and the floor ("the engine floor raised to Chromium 120 and WebKit 17, for the
  Popover API the tooltip uses (it was Chromium 120 and WebKit 16.4)").
- `packages/tokens/CHANGELOG.md` names the three tokens in their groups: `--ocelle-tooltip-max-inline` (size),
  `--ocelle-drawer-inline` (shell) and `--ocelle-tooltip-delay` (motion, "not zeroed under reduced motion"), each
  marked mission 008.
- `packages/styles/CHANGELOG.md`: the mission adds nothing to `@ocelle/styles`, and the CHANGELOG names nothing of it.

Nothing is missing, so nothing was changed. The elements CHANGELOG's general "Entry points" bullet still lists only the
entries that came before this mission. That is not a gap: each new element's bullet names its own entry point.

## Mutation

`gate:mutation -- --base 9a44e8e --plan` planned one shard, `packages/elements/src/bubble.ts` (6 changed lines, the
comment); T057 expected none. I ran it (`mutation.log`):

- run 1 could not run (exit 2, 29 s): Stryker failed to copy `reviews/phase-5/red-commits` into its sandbox because I
  deleted that file while the sandbox was being made. My error, not a gate problem;
- run 2, with the tree unchanged during the run: `zero-mutants: no mutant on the changed lines`; `0 mutants on the
  changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 1 zero-mutant entry; 0 equivalent records`,
  exit 0, 454 s. As expected for a comment.

No test file is in the mutation scope, so the two row changes plan no shard.

## Checkpoint: full `pnpm test`

`pnpm test` at `915cfdd` (`full-test-915cfdd.log`, started 2026-11-15T23:14:01Z, 719 s): **5067 of 5067 passed**
in 159 files, exit 0. The commit that adds these notes changes only `specs/008-overlays/`, so the code it holds is the
code that ran.

## Open

- The re-entry row ("Hover delay, moves inside the tooltip before the delay …") can fail under full-suite load with
  "no run it can judge" (red step above: moves back at 334, 354.2 and 470.3 ms). Its moves are timed by the host, so
  under load they can come after the 300 ms delay in all three runs. Not changed here. Whether to change its timing
  is a question for the operator. Decided (decision 2 below) and done in `a36d8a1`: see § The R-12 re-entry row
  after the operator's decision.
- R-16's `storybook/.storybook/main.ts:49` should read `:23` (T054).
- Out of scope per T057: `dismiss` ending pending delays, and a WebKit 17 row for a pending delay under a modal (no
  WebKit harness in the elements suites).
- The two quickstart hand checks (T055) need a person. T055 stays open (`- [ ]` in `tasks.md`): steps 1 to 5 and 7
  ran and passed, step 6 ran in its phase-scoped form only, and the hand checks have no result.
- `tdd-check.sh 5` is not run here; the checkpoint runs it before the review.

## Operator decisions after the Phase 5 implementation (2026-11-16)

Asked in this session as multiple-choice questions:

1. **red-commits deletion:** "Accept, keep the log".
   - red.sh's only failure was an unchanged row under load, so it was not a red.
   - `red-phase.log` and these notes record that failure.
   - The break checks are the test-first evidence, and tdd-check reports `exempt`.
2. **R-12 re-entry row:** "Longer delay on this row".
   - The same remedy as the leave row: a 1000 ms delay on this row's page only.
   - The bounds are scaled and the restart check is kept.
   - Break checks: a missing delay, and a restarted timer.
3. **T055:** "Fix docs, defer to land".
   - The planner fixes quickstart step 6 to include `--base`.
   - The planner corrects R-16's citation from `storybook/.storybook/main.ts:49` to `:23`.
   - Deferred to /ocelle-land and the PR as known gaps:
     - the mission-wide mutation run (60 shards);
     - the two hand checks;
     - WebKit.
   - T055 is ticked with these stated.

## The R-12 re-entry row after the operator's decision (`a36d8a1`)

`a36d8a1` changes `packages/elements/test/scenarios/tooltip.ts` only (no source, default delay, other row or spec
change), following the R-12 leave row (`reviews/phase-4/notes.md` § The R-12 leave row after the operator's decision).
The row's page sets `#tip { --ocelle-tooltip-delay: 1000ms; }` through `start`'s rules, as the leave row does.
`beforeDelay("the move back onto the trigger", …, longDelay)` keeps the measured move back (`Frames.moved`) and judges
a run only when it came before 1000 ms. The moves are unchanged (entry at the trigger's edge, the inner span's centre,
the edge again, no pause between). The wait after them is `pause(1000)` then `pause(500)` (each at most 1 000 ms,
R-15), the leave row's `longWait`. The bounds are scaled: `beforeDelay` is no bubble before 1000 ms from the entry,
`beforeRestart` is shown before the move back plus 1000 ms (the restart check, kept), and `byWait` (was `by450`) is
shown by 1500 ms from the entry. `longDelay` and `longWait` are the leave row's constants; their comment now names
both rows. The default 300 ms delay stays covered by the other delay rows.

### Row changed (old and new full names, measured times)

- Old: "Hover delay, moves inside the tooltip before the delay (R-12's delay rule, the matrix's re-entry): the pointer
  enters the trigger, moves onto its inner span and back onto the trigger's edge, both moves before the delay: the
  timer is not restarted, not shown before the 300 ms delay from the first entry, shown before 300 ms from the move
  back and by 450 ms"
- New: "Hover delay, moves inside the tooltip before the delay (R-12's delay rule, the matrix's re-entry): with
  --ocelle-tooltip-delay: 1000ms on the tooltip, the pointer enters the trigger, moves onto its inner span and back
  onto the trigger's edge, both moves before that delay: the timer is not restarted, over a 1500 ms wait from the
  first entry: not shown before 1000 ms from the first entry, shown before 1000 ms from the move back and by 1500 ms
  from the first entry"
- Times, page-side, in ms from the entry, unloaded, 3 runs in each harness (in process / fixture twin), read with a
  temporary probe that was then removed: move back at 134.1, 149.9, 133.0 / 133.3, 133.2, 133.2 ms; first frame
  showing the bubble at 1016.6, 1016.7, 1016.9 / 1016.3, 1016.5, 1016.5 ms; last frame at 1682.9, 1699.7, 1683.1 /
  1683.0, 1682.9, 1682.9 ms. A restarted timer would show the bubble at about 1133 ms or later, after the
  `beforeRestart` bound. The moves back that failed red.sh (334, 354.2, 470.3 ms) are well under the new 1000 ms bound.

### Break checks (temporary source edits, reverted, never committed)

Each ran the row in both harnesses (`tooltip.test.ts` in process, `test/browser/tooltip.test.ts` on the fixture,
built from the edited source) with the new row. The results were the same in both.

- B1, no delay (`if (delay > 0 && false)` in `#onPointerover`): the row fails, `beforeDelay: true`.
- B2, the timer restarted on re-entry (in `#onPointerover`, the `this.#inside(event.relatedTarget)` return removed and
  `window.clearTimeout(this.#timer)` added before the new `setTimeout`): the row fails, `beforeRestart: false`
  (`byWait` stays true: the restarted timer still shows the bubble inside the 1500 ms window).

### Repeat runs at `a36d8a1`

- `tooltip.test.ts` (in process) and `test/browser/tooltip.test.ts` (fixture twin), run together: 208 of 208 passed
  (104 in each), 3 runs of 3.
- `gate:typecheck`, `gate:lint`, `gate:test-lint`: no finding.
- `pnpm test` run 1 (`full-test-a36d8a1.log`, 718 s): **5067 of 5067 passed** in 159 files, exit 0.
- `pnpm test` run 2 (`full-test-a36d8a1-run2.log`, 721 s): **5067 of 5067 passed** in 159 files, exit 0.
- The commits after `a36d8a1` that hold these logs change only `specs/008-overlays/`, so the code that ran is the
  code they hold.

### Mutation at `a36d8a1`

The row kills mutants in `#onPointerover` (B1, B2), so shards 15 to 17 ran again, `gate:mutation -- --base 78fe475
--files packages/elements/src/ocelle-tooltip.ts:<lines>`, output appended to `mutation.log`. No new survivor; the
counts equal the phase 4 runs at `9a66884`.

| Shard | Entries | Mutants on changed lines | Survived | Timeouts | Compile errors | Equivalent records | Exit | Time |
|---|---|---|---|---|---|---|---|---|
| 15 | `:241-270` | 24 | 0 | 0 | 4 | 0 | 0 | 508 s |
| 16 | `:271-300` | 39 | 0 | 0 | 10 | 0 | 0 | 519 s |
| 17 | `:301-330` | 34 | 0 | 0 | 16 | 2 | 0 | 551 s |
