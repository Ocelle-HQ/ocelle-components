---
phase: 5
round: 3
verdict: approved
base: c46542b546bb3f4d73c1938e027b2bfd949af61b
head: 36918fb670721dcc25f05465697e56505479fb4c
tdd_check: exempt
---

# Phase 5 review, round 3

Scope: the fix for round 2's operator finding R2-01 (task T060), in `5b142cc` (the row change, break-check logs, notes,
`round-2-fixes.md` and `tdd-exempt.md`), `1d804a5` (the full-test log) and `da97557` (the T060 tick). `36918fb`
changes only `reviews/phase-2/` logs and is outside this phase. Since `ea79307` (the round-2 head), the only change
under `packages/` is `packages/elements/test/scenarios/tooltip.ts`: the comment on `longDelay`/`longWait` (:419-425)
and the row "Escape, then a brief hover" (:845-869). No source, spec or other row changed. Landing stop rule: a new
finding blocks only if it breaks a requirement and comes with a reproduction.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | note | packages/elements/test/scenarios/dialog.ts:2249-2257 (run through `packages/elements/test/browser/drawer.test.ts`:37) | My full `pnpm test` at `36918fb` failed 1 of 5107 tests: "Close control activated during the entry, motion on", in the drawer's fixture-twin suite. That was the only failure, and the run was slow (1349 s; the fixer's run at `5b142cc` took 823 s; `check-full-test-36918fb.log`). The row reads the entry animation's `playState` right after `open` and expects `["running"]`. Under load the entry can already be over by then, so this looks like a load-timing flake. It did not reproduce: three isolated runs of the row passed in both harnesses (2 of 2 each time). This round did not touch the row, `dialog.ts` or the drawer. `dialog.ts` last changed in `4a864bf`/`23928b9` (phase 2 round 2), and the fixer's full run at `5b142cc` passed 5107 of 5107. No requirement is shown broken and there is no reproduction, so under the landing stop rule this is not blocking. | None for phase 5. The orchestrator should watch this row in the landing runs. If it fails again, give it the same treatment as the R-12 rows: judge only runs where the entry was still running, or lengthen the entry with its own motion duration. That belongs to the phase that owns the row (phase 2 or 3). |
| R3-02 | note | git `5b142cc`; specs/008-overlays/reviews/phase-5/round-2-fixes.md:3 | Two small departures from T060's wording, with no effect on the evidence. The commit is typed `fix(008-overlays): phase 5 review round 2`, but the task asked for `test(...)`. The fixes table's third column is headed "Red test", but the task asked for "Break check". The column's content states that there is no red test and lists the break checks, so nothing is hidden. | None. |

There is no blocking finding.

## Test quality

### Red evidence and the exemption

- `tdd-check.sh 5` re-run at HEAD `36918fb`: `exempt` (`tdd-check.json`; the previous copy recorded head `1c4f46f`). `red-commits` is absent.
- The new line in `tdd-exempt.md` for R2-01 is justified. The change is test-only: one row is rescaled, and the code already meets that row (`ocelle-tooltip.ts` is unchanged since round 2). So no test could fail before a fix, and a red commit would have to be made up. Per T060 and the round-2 requirement, the test-first evidence is the break checks.

### The row judges only valid runs

`tooltip.ts`:848-866 calls `beforeDelay("the leave", …, longDelay)`, so a run is judged only when the page-side leave (`Frames.left`) came before 1000 ms from the entry:

- A run with no leave (or no entry) throws at once (:441).
- If no run qualifies in three tries, the row fails with "no run it can judge" (:446-447) and never passes.
- In every judged run the wait after the leave is `pause(1000)` + `pause(500)`. That record runs past the latest moment an uncleared 1000 ms delay could fire (entry + 1000 ms), so the window catches a pending delay whenever the leave came, as long as it came before 1000 ms.
- B3 (`r2-01-b3-late-leave.log`) confirms this. With `pause(1000)` before the leave, both harnesses fail with "the leave came at or after 1000 ms from the entry in each of 3 runs (1083, 1083, 1083 / 1083.2, 1083.5, 1082.8 ms …): the row has no run it can judge" (log lines 43, 129, 218, 232). The row does not pass.

### It cannot pass vacuously

- `never: never(f, 0)` (:863) requires that no frame of the whole record shows the bubble. The record runs from `track`, which comes after Escape and before the entry.
- `never(f, 0)` alone holds on an empty record. `toWait` covers that: `(f.frames.at(-1)?.t ?? 0) >= longWait` is false on an empty record or a short one, so the row needs real frames that reach at least 1500 ms from the entry.
- Since a judged run has a non-null `f.left`, an entry exists, and `t` is measured from it.
- B1 (`r2-01-b1-no-escape-hide.log`): `this.#hide()` removed from `#onKeydown`. Both harnesses fail with `never: false` (lines 42-43, 128, 229-230, 259-260). The row still depends on the Escape dismissal (FR-033).
- B2 (`r2-01-b2-no-clear-on-leave.log`): `window.clearTimeout(this.#timer)` removed from `#onPointerout`. Both harnesses fail with `never: false`, because the 1000 ms delay that the leave did not end shows the bubble inside the window (R-12).
- I compared the old row at `ea79307` with the new one; it is not weakened:
  - the old `never(f, 400)` spanned 400 ms from the first sample;
  - the new row covers every frame and requires the record to reach 1500 ms from the entry;
  - the only looser part is the bound (100 to 1000 ms), and the operator chose that remedy (round 2). With a 1000 ms delay it keeps the row's meaning: the leave still comes before the delay.
- No `skip`/`only`, conditional assertion or swallowed error is added. `gate:test-lint` reports no finding.

### Name and expected values match the measurement

The new name says "with --ocelle-tooltip-delay: 1000ms on the tooltip … leaves both boxes before that delay: no bubble at any frame of a 1500 ms wait from the entry". Each part maps to the code:

- the delay is the page rule `#tip { --ocelle-tooltip-delay: 1000ms; }` (:851);
- "before that delay" is the `longDelay` bound;
- "no bubble at any frame" is `never(f, 0)`;
- "1500 ms … from the entry" is `toWait` against `longWait`.

The focus parts of the name are `focus: "trg"` and `visible: true`, unchanged. The expected value `{ never: true, toWait: true, focus: "trg", visible: true }` is what T060 specifies. The fixer measured the leave at about 83 to 99 ms and the last frame at about 1650 ms (`notes.md` § Review round 2, R2-01 fix). Both are consistent with the name, and the leave sits far below the new bound. The `longDelay`/`longWait` comment (:419-425) now names this row.

### It follows the earlier R-12 rows

The row matches the R-12 leave row (:613-641) and the re-entry row (:516-542) in:

- the same `start(..., \`#tip { --ocelle-tooltip-delay: ${String(longDelay)}ms; }\`)`;
- the same `beforeDelay(…, longDelay)`;
- the same `pause(1000); pause(longWait - 1000)` (each pause at most 1000 ms, R-15);
- the same `toWait` expression;
- the same name phrasing: "with --ocelle-tooltip-delay: 1000ms on the tooltip", "leaves both boxes before that delay", "a 1500 ms wait from the entry".

The leave row splits "no bubble" into `beforeLeave`/`afterLeave`. This row's `never(f, 0)` covers the same frames as one check.

The leave row does not itself prove that the `#tip` rule takes effect. The re-entry row's "not shown before 1000 ms" (:537) does prove the mechanism, and B2's failure shows that a pending delay is caught inside the window.

### Mutation

Not re-run. No source changed in this round (`git diff ea79307..HEAD -- packages` touches only `test/scenarios/tooltip.ts`), so there is no new or changed code to mutate. The phase's source mutation results stand as recorded in `mutation.log` and `notes.md` § Mutation.

## Checks run

Run at HEAD `36918fb` with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`. The default Playwright headless shell 1248 is not installed here.

- `pnpm exec vitest run --project elements --project elements-browser packages/elements/test/tooltip.test.ts packages/elements/test/browser/tooltip.test.ts -t "Escape, then a brief hover"`: 2 passed.
- The same two files in full: 208 of 208 passed (111 s).
- `gate:typecheck`: no type error. `gate:lint`: 300 files, no finding. `gate:test-lint`: 204 files, no finding.
- `tdd-check.sh 5`: `exempt`.
- Full `pnpm test`: 5106 of 5107 passed in 1349 s, exit 1 (`check-full-test-36918fb.log`).
  - The tooltip rows, including this one, passed under that load.
  - The one failure was the unchanged drawer row in R3-01. Re-run alone 3 times, it passed in both harnesses each time.
  - The fixer's full run at `5b142cc`, with the same code under `packages/`, passed 5107 of 5107 (`full-test-5b142cc.log`).
- Not run: visual, axe, CSP, style and the other gates. This round changed no source, style, story or fixture, so their results cannot have changed.

## Earlier findings

- **R2-01** (blocking, operator round): **resolved**.
  - The row "Escape, then a brief hover (FR-033, R-12)" has its own 1000 ms delay through the page rule, and its bounds and waits scale with it (`longDelay`/`longWait`), as for the R-12 leave and re-entry rows.
  - "No bubble at any frame" is still judged only on runs whose leave came before the delay.
  - The hand-applied breaks B1 (Escape dismissal removed) and B2 (leave not clearing the timer) fail the row in both harnesses. B3 shows a late leave gives "no run it can judge", not a pass.
  - As a test-only stabilisation it has no red commit, and `tdd-exempt.md` records why.
  - The row passed in my targeted run, in the full tooltip files and under full-suite load.
  - T060 is ticked (`tasks.md`), and its work is present as specified.
- Round 1 had no blocking finding.
