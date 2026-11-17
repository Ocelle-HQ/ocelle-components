---
phase: 4
round: 1
verdict: approved
base: 78fe47542f77137d4fb2d45642f89029993a8af3
head: 4d67312
tdd_check: pass
---

# Phase 4 review, round 1

User Story 3, a tooltip that meets WCAG 1.4.13 (T041 to T053). Change under review: `git diff 78fe475..4d67312`, with no
uncommitted change. I read `notes.md` in full, with the operator's decisions on T052 option (a), the R-12 rows measured
in the page, the 1000 ms delay on the R-12 leave row, FR-031 and the immediate-action rows, and the dialog/drawer rows
under load. I also read `reviews/operator-standing-decisions.md`: main is not merged during the run, and phase folds are
approved.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | packages/elements/src/bubble.ts:2-3, :9 | The hook's documentation says `dismiss` "hides every bubble, shown or pending, until the pointer or keyboard focus enters its trigger again", and "Hides every tooltip bubble". Since `1f91513` the code hides only the shown bubble (`packages/elements/src/ocelle-tooltip.ts:137-144`), which is R-10's "hide current". A pending delay is not ended by the hook. It ends only through the trigger's own `pointerout` when the modal backdrop appears under the resting pointer, or through `focusout`. The "Trigger opens an ocelle-dialog before the delay" row (`test/scenarios/tooltip.ts:960`) and its B2 break check prove this in Chromium. It is not measured on WebKit 17, which is in the floor. If the engine sends no boundary event, the pending timer would show the bubble above the modal. | Correct the comment in `bubble.ts` to say "the shown bubble". Optionally, make `dismiss` also end pending delays when a WebKit harness can show a row for it. Not required for this phase: the code matches R-10 and the tested engine. |
| R1-02 | note | packages/elements/test/scenarios/tooltip.ts:658, :667 | The FR-031 click-focus row was renamed to "… no bubble at any frame of a 450 ms wait **from the click**". However, `to450` and `never(f, 400)` measure from the entry (the origin of `Frames`), and the click comes 5 to 66 ms after the entry by the notes' own measurements. The assertion is a little weaker than the name: the wait after the click is at least 450 ms minus the click's offset. | Measure `to450` from `f.clicked` (already recorded), or say "from the entry" in the name. |
| R1-03 | note | packages/elements/test/scenarios/tooltip.ts:836-850 | The "Escape, then a brief hover" row keeps its name "leaves both boxes within 100 ms", but `beforeDelay` judges any run whose measured leave came before 300 ms. A judged run under load can have left at 100 to 299 ms. The outcome (no bubble) is the same for any leave before the delay, so the assertion is not weakened. Still, the name states a time that the row neither ensures nor checks. Its "450 ms wait from the entry" is `never(f, 400)`, measured from the `track` command. | Pass a bound of 100 to `beforeDelay`, or rename the row "before the delay" as was done for the FR-031 row. |
| R1-04 | note | storybook/baselines/tokens--size.{light,dark}.png, tokens--motion.{light,dark}.png | The four baselines changed because the Tokens stories now list `--ocelle-tooltip-max-inline` and `--ocelle-tooltip-delay`. I viewed `tokens--motion.light.png`, which shows the new row "--ocelle-tooltip-delay 500ms". The 18 tooltip baselines are new. All 22 were produced in docker only, with no podman comparison. | The pull request description must say why the four Tokens baselines changed (constitution V), and that the captures are docker only, with CI's captures winning. At `/ocelle-land`, after main is merged, recount the story and baseline figures (44 / 88 / 90, R-17) and regenerate any conflicting PNG in the pinned container, as the standing decision says. |

There is no blocking finding.

## Test quality

**Red evidence.**
- The scaffold `d63190e` adds only the class's declared properties: no behaviour, no definition, no export.
- The red commit `fb7d915` holds test files only. `red-phase.log` shows 271 of 5005 failing, each by an assertion: the undefined element, the missing tokens, the README floor text, the stories and the counts.
- `tdd-check.json` (at `577d442`, written by `4d67312`, which changes only this directory):
  - `pass`;
  - the final tests at the scaffold: 318 failed (`check-final-tests-on-scaffold.log`), all behavioural assertions;
  - at the base: exit 2, no test file found, as in Phases 2 and 3; the scaffold run is the one that shows behaviour;
  - at HEAD: 5067 passed.

**Nothing weakened since the red commit** (`git diff fb7d915..HEAD` on the test files). Every removed expectation was replaced by a stricter one:
- "Leave" moved `focus` and `layer` into `focusout` and added `again` and `leftAgain`;
- "Escape (US3-4)" added `other`;
- the "Trigger opens" rows added `atOpen` (read in `beforetoggle`);
- "Hover delay 0" added `gap: 8`;
- the re-entry row: `before150: false` became `beforeDelay: false` (no frame before 300 ms), and `beforeRestart: true` is new. The notes' break check shows that the old `by450` alone missed a restarted timer and the new bound catches it.

The rows added after green (`ca2da97`, `0020dab`, `3b6adea`, `19a63c7`) are additions.

**The timing rewrites (`8c49287`, `5d735a8`, `9a66884`).**
- `beforeDelay` (`tooltip.ts:436-446`) cannot pass vacuously:
  - a run without a page-side time throws at once;
  - a run at or after the bound is not judged;
  - after 3 late runs it throws with the measured times;
  - a judged run returns its full observation, which `row` compares with the unchanged expected values.
- The times are read in the page by capture-phase window listeners before the element's own listeners (`left`, `moved`, `clicked`), so they are the times the element saw.
- The extra frame sample at the click only adds observations.
- Discarding a late run is correct, not a loosening: past the delay, the bubble may rightly show.
- Renamed rows against what they assert:
  - the R-12 leave row (1000 ms, a 1500 ms wait from the entry: `toWait`), the re-entry row and the dialog-pending row match their full names;
  - the FR-031 row is slightly off: R1-02;
  - the unrenamed Escape row is slightly off: R1-03.

**The 1000 ms delay on the R-12 leave row.**
- The override is `#tip { --ocelle-tooltip-delay: 1000ms }` over the fixture's `:root` 300 ms. The element reads the trigger's computed value, so the override reaches it, as in the "Hover delay 0" and "0.3s" rows.
- If the override did not apply, a leave after 300 ms would show the bubble before the leave, and the row would fail, not pass.
- B2 (pending timer not cleared) shows the bubble at about 1000 ms inside the 1500 ms window, so the row still catches it.
- The 300 ms test delay stays covered by other rows:
  - "Hover delay" (not before 150 ms, by 450 ms);
  - the re-entry row (no frame before 300 ms, and the restart bound);
  - reduced motion, "0.3s", the FR-031 row (leave before 300 ms: no bubble);
  - "Escape, then a brief hover" (leave before 300 ms with keyboard focus held: the `clearTimeout` in `pointerout`);
  - the dialog-pending row.
- The only part that moved to 1000 ms is the combination "moves inside, then leaves", and the inside test does not depend on the delay value.

**Phase 2/3 rows changed in `157c4cf`** (test-only, operator-decided).
- `openInDrawer` (`dialog.ts:2811`):
  - it polls, for at most 1000 ms, until the drawer's `dialog` runs no animation, then fails with a message unless focus is on `#oi`;
  - the focus check makes it strictly stronger: the old row passed without ever consulting a removed opener, and the B1 break (`opener.isConnected` dropped) now fails it where the old row passed;
  - if the poll returned too early, the focus check fails the row instead of letting it pass.
- The close-control row waits for `kind.settle` (`dialog.ts:1434`) before reading the box. That is a no-op for the dialog. FR-006's size is a static property, the subpixel width during the slide was an artifact, and B2 (a 43 px control) still fails it.
- "Two close-control clicks":
  - one path with a `still` second step. `commands.ts:203-205` throws unless the step names the previous point.
  - `duringExit` (`dialog.ts:427`) judges only a run with exactly two clicks on the control, the first while `open` and the second with `open` gone and the inner `<dialog>` still open; otherwise it retries 3 times and throws with the records;
  - the expected values are unchanged;
  - the old drawer row never clicked the control twice, and under break B3 it passed while the new row fails. The new row is stronger.
- No row was renamed, and each now does what its name says.

**Every row asserts observable behaviour.** `gate:test-lint`: 204 files, no finding. There is no `skip` or `only`, and no assertion sits inside a conditional.

**Coverage of the matrix.** Matrix § Tooltip, the acceptance scenarios US3-1 to US3-15, and each event and keyboard path (hover, keyboard focus, click focus, late `:focus-visible`, the text field, the gap, leave, Escape inside and outside overlays, touch, no Popover API) have rows in both harnesses and in the touch contexts.

**Mutation.**
- I ran `gate:mutation -- --base 78fe475 --plan` at HEAD: 22 shards, identical to the final plan in `mutation.log`.
- No source changed since `1f91513`, and the gate files are unchanged since `ca2da97` (`git diff --stat` empty). The recorded shard runs therefore stand for HEAD:
  - every shard exits 0 with "none survived";
  - shard 21 had one survivor at `3b6adea` (`:444` `id === undefined` → false), killed by `19a63c7`;
  - shards 11 and 15 to 17 ran again after each test rewrite, with the same counts.
- The two Timeout lines (`:415` the id loop `=== null`, `:429` `takeRecords()` removed) are named with their causes, which are endless loops.
- The six equivalent records in `ocelle-tooltip.ts` each give a sound reason. I checked them against the code:
  - `:55` `text: {}`;
  - `:221` `super.disconnectedCallback()`;
  - `:305` `shown === this` → false;
  - `:319` `cancelAnimationFrame`;
  - `:344` `placed !== this.#placed` → true;
  - `:441` the observer's `disconnect()`.
- The 35 records of the gate files are the process-boundary comments of earlier missions, with only their quoted test titles renamed.
- I did not re-run the 22 shards (about 3.5 hours). I rely on the logged runs and the unchanged source.

## Checks run

At HEAD `4d67312`, with Chromium 153 at `OCELLE_CHROMIUM_PATH`, `OCELLE_VISUAL_ENGINE=auto`, and `CI` / `GITHUB_ACTIONS` unset:

- `pnpm test`: **5067 tests passed in 159 files**, exit 0, 824 s. This includes:
  - the tooltip, dialog and drawer rows in process, on the fixture and in the touch contexts;
  - the storybook story tests and T052's long-text row;
  - the visual gate integration ("captures the repository's 88 story-themes twice under docker and exits 0");
  - the axe gate integration (88 story-theme runs, 0 serious or critical, 10 excepted);
  - the plant-repo, manifest and storybook-build counts.
- `gate:typecheck`, `gate:lint` (300 files), `gate:style-lint` (18), `gate:test-lint` (204), `gate:manifest` (5 elements), `gate:csp` (16), `gate:prefix` (251), `gate:brand-rules`, `gate:contrast`, `gate:config-copies`, `gate:pins`: no finding.
- `gate:mutation --plan`: see above.
- The baselines: 18 added and 4 changed (`git diff --name-status`), 88 files. I viewed the long-text baseline: the bubble lies inside the one paragraph, as T052 option (a) decided.
- **Tasks.** T041 to T053 are all ticked, and their work is present:
  - T053's hand-off to kitty-mission-ui #20 is in `notes.md`, and T053 does not block approval;
  - T049's floor-consumer search is recorded.
- **Changes outside this phase.**
  - The gate source changes are Stryker comment text only, as T050 states.
  - The phase 2/3 rows changed in `157c4cf` were decided by the operator and are reasoned above.
  - `src/bubble.ts` is a new internal module and is not in plan.md's structure. It lets `overlay.ts` call the tooltip's "hide current" (R-10) without importing `ocelle-tooltip.ts`, so `ocelle-dialog.js` defines no tooltip and `ocelle-tooltip.js` defines no `ocelle-icon`. In `dist`, both `overlay.js` and `ocelle-tooltip.js` import the one shared `./bubble.js`, so the hook connects across separate entry points. This is justified.
- **Constitution.**
  - `ocelle-` naming holds, and the tooltip emits no event.
  - There is no I/O.
  - Tokens only, with forced colours as Canvas / CanvasText.
  - `aria-describedby` points to a light-DOM span in the trigger's own tree, so the ID reference crosses no shadow root (III).
  - Position comes from a constructable sheet, not a `style` attribute (IV, FR-047).
  - Every state has a story and a baseline (V).
  - The tooltip delay is not zeroed under reduced motion (brand rule (f), tested).
- **Earlier rounds.** This is the first round, so there are none.

## Earlier findings

None: this is round 1.
