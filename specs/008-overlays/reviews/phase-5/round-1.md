---
phase: 5
round: 1
verdict: approved
base: 9a44e8e8589e6719232a725c6b5f4042a08ee126
head: 31489e6
tdd_check: exempt
---

# Phase 5 review, round 1

Phase 5 is "Polish & cross-cutting" (T054 to T057). The change under review is `git diff 9a44e8e..31489e6`, with no
uncommitted change. The phase holds:

- two test commits on `packages/elements/test/scenarios/tooltip.ts`:
  - `f45e42b`, R1-02 and R1-03;
  - `a36d8a1`, the R-12 re-entry row at 1000 ms;
- one comment commit, `915cfdd` (`src/bubble.ts`);
- design-artifact fixes, `15ce835` (quickstart step 6, the R-16 citation, fixes-12.md, the T055 tick);
- notes, logs and ticks.

No source behaviour changed.

I read `notes.md` in full, with the operator's decisions of 2026-11-16:

- accept the `red-commits` deletion and keep `red-phase.log`;
- give the R-12 re-entry row a 1000 ms delay of its own;
- T055: "Fix docs, defer to land".

I also read `reviews/phase-4/round-1.md` and `reviews/operator-standing-decisions.md`.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | packages/elements/src/bubble.ts:3-4 | The new comment says that a pending delay "is not ended by the hook but by the trigger's own `pointerout` or `focusout`". In `ocelle-tooltip.ts` that is half right. (1) A delay is pending only after `#onPointerover` (:258-268), which sets `#hovered = true`. `#onFocusout` (:285-288) calls `#hide` (and so `clearTimeout`, :316) only when `!this.#hovered`, and only `#onPointerout` (:270-275) clears `#hovered`. So `focusout` never ends a pending hover delay. Only `pointerout` does, or the tooltip's removal (:223). (2) "Not ended by the hook" is too broad in one case. A tooltip shown by keyboard focus that the pointer then enters from outside has a pending timer. `dismiss` (:140-143) calls its `#hide`, and that clears the timer. The first half ("hides the shown bubble … until the pointer or keyboard focus enters its trigger again") and the member doc (:10) are accurate. T057's task text prescribed this wording, so the implementer did what the task said. The same claim is in `ocelle-tooltip.ts`:138-139 ("or by the focus that moves into the overlay", from Phase 4). It matters for the deferred WebKit risk of phase-4 R1-01: if WebKit sends no `pointerout` when the backdrop appears, `focusout` does not stop the timer either. | Before `/ocelle-land` merges, make both comments say that a pending delay of another tooltip ends only by its trigger's `pointerout` (or the tooltip's removal), and that `focusout` does not end it while the pointer is over the trigger. Comment only, so no test is needed. |
| R1-02 | note | packages/elements/test/scenarios/tooltip.ts:845, :856 | "Escape, then a brief hover" now judges only a leave before 100 ms (`beforeDelay(…, 100)`), as its name says. The rest of the name, "no bubble at any frame of a 450 ms wait from the entry", is still `never(f, 400)`. That measures 400 ms from the first sample, taken at `track` before the entry, as phase-4 R1-03 already said. In practice the wall-clock pauses (50 + 450 ms after `hover`) carry the record past 450 ms from the entry. B03a proves that a pending delay that was not ended is caught at 300 ms. T057 asked only for the bound, so this is not a regression. | Optional: assert the span from the entry, as the click row now does (`never(f, 0) && (f.frames.at(-1)?.t ?? 0) >= 450`). |
| R1-03 | note | packages/elements/test/scenarios/tooltip.ts:516-541 (a36d8a1); :395-398 | Both R-12 rows now run at 1000 ms. As a result, no row asserts the lower edge of the default 300 ms test delay any more. Before `a36d8a1`, the re-entry row asserted "no frame before 300 ms" (phase-4 round 1 counted it among the 300 ms coverage). Every remaining default-delay row bounds it at 150 ms only (`delay()`: "Hover delay" :503, reduced motion :544, "0.3s" :581, "Click focus, then hover" :701). The notes' "the default 300 ms delay stays covered by the other delay rows" is true for the 150 to 450 ms window. The element reads every delay through one path (`milliseconds(getComputedStyle(…))`, `ocelle-tooltip.ts`:262), and the re-entry row now asserts "no frame before 1000 ms" for the value it reads. So an element that waited less than its computed delay would still fail. I find no lost behavioural coverage. | Optional: in the "Hover delay" row, assert no frame before 300 ms. A timer cannot fire early under load, so that bound is load-safe. |
| R1-04 | note | specs/008-overlays/reviews/phase-5/tdd-exempt.md; break-checks/ | `a36d8a1` rewrote an existing row after the exemption was written. `tdd-exempt.md` has no line for it, and its break checks B1 (no delay) and B2 (restarted timer) are recorded only as prose in `notes.md` § The R-12 re-entry row, with no logs in `break-checks/`. The other break checks have logs. I confirmed both by reading the code (see Test quality). The exemption's reasoning applies to this row too: the code was unchanged and already met the row. | None for this phase. For later phases, keep break-check logs and an exemption line for every row changed after the red step. |

There is no blocking finding.

## Test quality

### Red evidence and the exemption

- `tdd-check.json` reports `exempt` (head `e1c029f`; `31489e6` adds only that file).
- `red.sh 5 phase` at `f45e42b` failed one unchanged row: the re-entry row, with "no run it can judge" at 334, 354.2 and 470.3 ms (`red-phase.log`). That is a load-timing setup failure, not a red under T057's rule, and both changed rows passed. The operator accepted deleting `red-commits` and keeping the log.
- The exemption is justified:
  - T056 changes no file;
  - R1-01 is comment text, and Stryker makes no mutant of it: I re-ran the shard, `zero-mutants`;
  - R1-02, R1-03 and `a36d8a1` tighten or rescale rows against source that is unchanged since Phase 4 and already meets them, so no row could fail before a fix.
- The test-first evidence is the break checks.

### R1-02, the FR-031 click-focus row (`tooltip.ts`:664-682)

Not weakened, against the base row (`never(f, 400)`, last frame ≥ 450 from the entry, `pause(450)`):

- `never(f, 0)` still requires no frame in the whole record to show the bubble. The record runs from `track`, before the entry, to the last frame.
- `to450` now requires `last >= click + 450`. Because `click >= 0`, that is at least the old `last >= 450`.
- The span condition is `last - click >= 400`, which `to450` already implies. It is redundant but harmless.
- The pause grew from 450 to 500 ms. That only adds frames that must show no bubble.

No vacuous pass:

- if `f.clicked === null`, the row throws (:674), and `beforeDelay` does not catch it;
- `clicked` is set only after an entry (:176), so a run without an entry also throws;
- an empty record gives `last = 0`, so `to450` is false.

The name matches the assertions:

- "no bubble at any frame of a 450 ms wait from the click" is `never(f, 0)` together with `to450`;
- "moved off it before the delay" is `beforeDelay` on `f.left` at 300;
- "without :focus-visible" is `visible: false`;
- "Shift+Tab and Tab back show it at once" is `keyboard: true`.

Break check B02 (a show timer started at the click, at 450 minus half the click offset):

- the new row fails in both harnesses with `never: false` and `to450: true` (`b02-new.log`:218-230, :247-259);
- the old row also failed it (`b02-old.log`). The notes say so plainly: the old row was weaker in what it guaranteed, not in what it saw in these runs.

### R1-03, "Escape, then a brief hover" (`tooltip.ts`:845-858)

- The only change is the bound of 100. The expected values are unchanged.
- B03a (the `clearTimeout` dropped from `#onPointerout`) fails both rows with `never: false`.
- B03b (`pause(150)` before the leave):
  - the new row fails with "the leave came at or after 100 ms … no run it can judge" in both harnesses;
  - the old row passes (`b03b-old.log`, 2 passed).
- So the bound is what closes the gap R1-03 named. The residual wording is R1-02 above.

### The re-entry row at 1000 ms (`a36d8a1`, `tooltip.ts`:516-541)

- The override `#tip { --ocelle-tooltip-delay: 1000ms }` goes through `start`'s rules, as in the leave row.
- If it did not apply, the bubble would show at about 300 ms and `beforeDelay` would be true, so the row fails rather than passes. B1 shows the same at about 0 ms.
- `f.moved` null throws in `beforeDelay`, so `back = f.moved ?? 0` is never 0 in a judged run.

The restart bound can still catch a restarted timer, under any load:

- the page records `moved` in a capture-phase window listener before the element's `pointerover` handler runs;
- a timer restarted at the move back therefore fires no earlier than `back + 1000`, and `beforeRestart` is false (B2);
- a timer that was not restarted shows at about `entry + 1000 + ε`, which is below `back + 1000` whenever `back > ε`. The move back is measured at 133 ms, and ε is about 17 ms;
- load only delays the show, which could make the row fail falsely, never pass falsely;
- judged runs need `back < 1000`, so the window `[1000, back + 1000)` is never empty.

`byWait` and the two 1000 ms pauses respect R-15. The name states each assertion. Default-delay coverage is R1-03 above.

### Other checks on the tests

- `gate:test-lint` reports 204 files, no finding.
- No `skip` or `only`. No assertion sits inside a conditional: the throw at :674 is a failure path, not a guard.

### Mutation

- `gate:mutation -- --base 9a44e8e --plan` plans 1 shard, `bubble.ts`.
- I ran it: `0 mutants on the changed lines of 1 file, none survived; … 1 zero-mutant entry; 0 equivalent records`, exit 0, 457 s. This matches `mutation.log` run 2.
- Run 1's exit 2 was the implementer's own sandbox race with the `red-commits` deletion, as `mutation.log` says.
- The re-runs of tooltip shards 15 to 17 at `a36d8a1` (`--base 78fe475`) give exactly the phase-4 counts at `9a66884`: 24/39/34 mutants, none survived, 4/10/16 compile errors, and 0/0/2 equivalent records. The two equivalent records (:305, :319) were checked in phase-4 round 1.

## Checks run

At `31489e6`, with Chromium at `OCELLE_CHROMIUM_PATH`, `OCELLE_VISUAL_ENGINE=auto`, and `CI` / `GITHUB_ACTIONS` unset:

- `pnpm test`: **5067 tests passed in 159 files**, exit 0, 732 s. This agrees with `full-test-a36d8a1.log` (718 s) and `full-test-a36d8a1-run2.log` (721 s). The commits after `a36d8a1` change only `specs/`.
- No finding from any of these gates:
  - `gate:typecheck`;
  - `gate:lint` (300 files);
  - `gate:style-lint` (18 files);
  - `gate:test-lint` (204 files);
  - `gate:manifest` (5 elements);
  - `gate:csp` (16 files);
  - `gate:prefix` (248 files);
  - `gate:brand-rules` (7 rules);
  - `gate:contrast` (160 pairs light, 168 dark).
- `gate:mutation -- --base 9a44e8e` (the plan and the one shard): see above.
- `gate:mutation -- --base 3828d2f --plan`: 60 shards and 59 cuts, as quickstart step 6 now states.

### Tasks

**T054.**

- `git rev-list --count HEAD..origin/main` is 0.
- The merge base is `3828d2f`.
- `588d5a7` is an ancestor of HEAD.
- None of the 72 commits of `origin/claude/010-storybook-workbench` that are not in main is an ancestor of HEAD.
- The R-16 citations I spot-checked state what the tree holds: `capture-plan.ts`:47-60, `gates.json`:137, `axe-rules.ts`:17-39, and `storybook/.storybook/main.ts`:23 `viewport: false` (31 lines, corrected in `15ce835`).

**T055.**

- Steps 1 to 5 and 7 are recorded as passing.
- Step 6 is fixed in `quickstart.md`:15-18. The `--base` requirement and the 60-shard plan are true, as above.
- These are recorded as deferred to `/ocelle-land` and the PR under operator decision 3:
  - the mission-wide mutation run;
  - the two hand checks, which a person must do (the notes give no result for them, correctly);
  - WebKit.
- The tick with its stated outcome follows that decision (`tasks.md`:450-451, `fixes-12.md`).

**T056.**

- `git diff origin/main HEAD` adds three `exports` keys (`package.json`) and three tokens (`tokens/src/source.ts`: `tooltip-max-inline` size, `drawer-inline` shell, `tooltip-delay` motion), and leaves `packages/styles` unchanged.
- `elements/CHANGELOG.md`:18-37 names the three elements, their three entry points and the floor (Chromium 120 / WebKit 17).
- `tokens/CHANGELOG.md`:48-60 names the three tokens in their groups.
- Nothing is missing.

**T057.** R1-01 to R1-03 are done, as reviewed above. R1-04 (the PR text and recount at land) is outside this phase.

All four tasks are ticked. No file outside the phase's scope changed.

### Constitution

- No source behaviour changed.
- VIII is met through a justified exemption and break checks (see Test quality).
- No `ocelle-` names, events, tokens, stories or baselines changed.

## Earlier findings

This is the first round of Phase 5, so there is no earlier round. The phase-4 round-1 notes carried here are resolved
as follows:

- R1-01 (the `bubble.ts` comment): done in `915cfdd`, with the residual inaccuracy recorded as R1-01 above.
- R1-02 (the click row measured from the click): resolved in `f45e42b`.
- R1-03 (the 100 ms bound): resolved in `f45e42b`; the residual wording is R1-02 above.
- R1-04 (the PR text on the four Tokens baselines and docker-only captures; the recount at land): open for
  `/ocelle-land`, as planned.
