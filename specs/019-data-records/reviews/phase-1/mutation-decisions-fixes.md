# Changes for the operator's decisions at phase 1's mutation stop (T025)

Source: `reviews/phase-1/mutation.md` (T025, open, at 9d71380) and the operator's decisions in
`reviews/phase-1/operator-mutation-decisions.md` (be22a30, 2026-11-19). Design artifacts only; no source or test file
is touched. T025 stays open: it completes after the tasks below.

## Decisions applied

| Item | Decision | Change | Where |
|---|---|---|---|
| Q-M1 | (b) read overflow fresh | The block clearance runs when, at the time of focus, the option is on and the box overflows in the block axis (`scrollHeight − clientHeight > 1`), read from the box then, not from `#axis`; so focus entering a box the module was just handed gets the clearance before the observer's first measurement. Reading it writes no `data-axis` and no output. Why: `#release`'s `this.#axis = false` and its `true` mutant differ only in that frame, and the contract already described the mutant's behaviour; with the fresh read the mutant becomes equivalent and T025 records it so | contracts/overflow-region-block-axis.md § Effects (Focus clearance, "When it runs"), § Tests (new bullet); spec.md § Operator decisions at phase 1's mutation stop; tasks.md § Phase 1 mutation decisions in force, T083 (red body, both harnesses, option-off pair in `overflowBlockGuards`), T084 (the change), T025 |
| Q-M2 | (a) fix in phase 1, test first | `connectedCallback` re-assigns the slot (first direct `table` child or nothing) and calls `requestUpdate()`. Why: the `MutationObserver` is disconnected while the element is detached, so a `<table>` replaced then was never assigned; FR-003 already required a replaced table to be shown, and now says so for this path | contracts/ocelle-data-table.md § Behaviour (Assignment); spec.md FR-003, § Operator decisions at phase 1's mutation stop; tasks.md § Phase 1 mutation decisions in force, T085 (red body, both harnesses, paired with the attached swap), T086 (the change; then T025 re-triages `disconnectedCallback`'s survivors), T025 |
| Gate gap | fix the gate in this mission; rule (c), checker failure (answered after 8d8320b, b77875e) | `gate:mutation` exits 2 when every mutant on a changed file's changed lines (a `--files` entry's ranges in a shard run) is a CompileError and one diagnostic of that file (same path, line and TS code, read from `statusReason` in Stryker 10.1.1's `<path>(<line>,<col>): error TS<code>: …` form) appears in all of them on a line none of them spans; the cause names the file and the diagnostic; exit 2 wins over other files' findings, as the other could-not-run causes. Why: that is how `ocelle-data-table.ts` went untested in run 1 (TS7022/TS7023 off the mutated lines), while a mutant the checker rejects for its own change (`pass-compile-error`, diagnostic on its own line) stays invalid and passing, so 007's verdicts stand. Interpretation applied, not asked: "one diagnostic of that file" means a diagnostic in the file's own path; a shared diagnostic in another file (a caller) does not trigger the rule, since a mutant can legitimately break a caller. A `statusReason` with no parsable diagnostic shares none, so such a file passes as before; T088's plant, a real Stryker run, is the live pin against a format change | tasks.md § Phase 1 mutation decisions in force (open note cleared), T087 (red self-test on `classifyMutants` with a recorded report and the format pin, in `gates/test/mutation-report.test.ts`, fixture `gates/test/fixtures/stryker/checker-failure.report.json`), T088 (plant `gates/plants/mutation/error-checker-failure/`, `expect: "error"`), T089 (the change in `gates/lib/mutation/report.ts`, `gates/bin/mutation.ts` if needed, `gates/README.md`), T025, § Dependencies; specs/001-repository-foundation/contracts/gate-cli.md (mutation row, amendment 2026-11-19); specs/001-repository-foundation/contracts/plants.md (mutation row, breaking plant); plan.md § Constitution Check (intro, Workflow gates row), § Source Code; spec.md § Operator decisions at phase 1's mutation stop |

Task order: T083 → T084, T085 → T086 and T087 → T088 → T089 (each red test or plant committed alone before its fix),
all before T025 completes (tasks.md § Mutation fixes, § Dependencies). Red runs are recorded in `reviews/phase-1/mutation.md`, since
`red.sh` takes only the labels `phase` and `fix-<round>` and the latter belongs to the review rounds.

Not changed, and why:
- plan.md for Q-M1 and Q-M2: it states neither the module's focus-time reads nor the data table's assignment
  triggers. For the gate gap it now names the `gates/` change (Constitution Check, § Source Code).
- contracts/checks.md: its § Gates per phase says when `gate:mutation` runs, not what it decides; what it decides is
  001's contracts/gate-cli.md, amended instead. 007's contracts/mutation-output.md is unchanged: it covers the
  report lines at exit 0 and 1, and exit 2 prints none.
- research.md, data-model.md, quickstart.md: no behaviour they state changes.

## Answered: the gate rule against 007's `pass-compile-error` plant

Asked after 8d8320b with options (a) as worded, (b) a threshold of two, (c) checker failure and (d) other; the
operator chose (c) (`reviews/phase-1/operator-mutation-decisions.md` § Gate gap rule, b77875e). Applied as the Gate gap
row above. T087 stops for the operator if the checker failure cannot be reproduced under Stryker 10.1.1 at all.
