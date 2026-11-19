# Changes for the operator's decisions at phase 1's mutation stop (T025)

Source: `reviews/phase-1/mutation.md` (T025, open, at 9d71380) and the operator's decisions in
`reviews/phase-1/operator-mutation-decisions.md` (be22a30, 2026-11-19). Design artifacts only; no source or test file
is touched. T025 stays open: it completes after the tasks below.

## Decisions applied

| Item | Decision | Change | Where |
|---|---|---|---|
| Q-M1 | (b) read overflow fresh | The block clearance runs when, at the time of focus, the option is on and the box overflows in the block axis (`scrollHeight − clientHeight > 1`), read from the box then, not from `#axis`; so focus entering a box the module was just handed gets the clearance before the observer's first measurement. Reading it writes no `data-axis` and no output. Why: `#release`'s `this.#axis = false` and its `true` mutant differ only in that frame, and the contract already described the mutant's behaviour; with the fresh read the mutant becomes equivalent and T025 records it so | contracts/overflow-region-block-axis.md § Effects (Focus clearance, "When it runs"), § Tests (new bullet); spec.md § Operator decisions at phase 1's mutation stop; tasks.md § Phase 1 mutation decisions in force, T083 (red body, both harnesses, option-off pair in `overflowBlockGuards`), T084 (the change), T025 |
| Q-M2 | (a) fix in phase 1, test first | `connectedCallback` re-assigns the slot (first direct `table` child or nothing) and calls `requestUpdate()`. Why: the `MutationObserver` is disconnected while the element is detached, so a `<table>` replaced then was never assigned; FR-003 already required a replaced table to be shown, and now says so for this path | contracts/ocelle-data-table.md § Behaviour (Assignment); spec.md FR-003, § Operator decisions at phase 1's mutation stop; tasks.md § Phase 1 mutation decisions in force, T085 (red body, both harnesses, paired with the attached swap), T086 (the change; then T025 re-triages `disconnectedCallback`'s survivors), T025 |
| Gate gap | fix the gate in this mission | **Not applied yet**: the rule as worded conflicts with mission 007's `pass-compile-error` plant (§ Open). The spec's decision block and tasks.md's decisions block record it as open; no gate task is added until it is answered | spec.md § Operator decisions at phase 1's mutation stop; tasks.md § Phase 1 mutation decisions in force |

Task order: T083 → T084 and T085 → T086 (each red body committed alone, tests only, before its fix), all before T025
completes (tasks.md § Mutation fixes, § Dependencies). Red runs are recorded in `reviews/phase-1/mutation.md`, since
`red.sh` takes only the labels `phase` and `fix-<round>` and the latter belongs to the review rounds.

Not changed, and why:
- plan.md: it states neither the module's focus-time reads nor the data table's assignment triggers, and lists the
  gates only by phase. Once § Open is answered, the gate change touches `gates/` (mission 001/007 source), which the
  plan's Project Structure and Constitution Check must then name.
- contracts/checks.md: its § Gates per phase says when `gate:mutation` runs, not what it decides; the gate's
  behaviour is 001's `contracts/gate-cli.md` and 007's spec. It changes only if § Open's answer needs a line there.
- research.md, data-model.md, quickstart.md: no behaviour they state changes.

## Open: the gate rule against 007's `pass-compile-error` plant

The decision is that `gate:mutation` fails "a file whose mutants are all compile errors". Mission 007 (operator
decision of 2026-11-10, chosen over "Fail" after the operator asked whether the gate checks that code compiles; FR-002,
FR-007, US1 scenario 2) requires `gates/plants/mutation/pass-compile-error` to **pass**. That plant's file
`packages/tokens/src/x.ts` has exactly one mutant on its changed lines (line 3, a StringLiteral that the literal type
`"planted"` rejects), and it is a CompileError: its file's mutants are all compile errors, so the rule as worded turns
that plant into a failure and reverses 007's decision for every change whose only mutants the type checker rejects.
The data table's case differs in kind: in run 1 all 238 mutants failed on TS7022/TS7023 on lines no mutant touched (the
unmutated file did not type-check under Stryker's checker). Stryker's JSON gives each CompileError's diagnostic as
`<path>(<line>,<col>): error TS<code>: …` in `statusReason` (seen in `reports/mutation/mutation-elements.json`, run 3).

**Question for the operator: which rule does `gate:mutation` apply?**

- **(a) As worded.** A changed file (in a `--files` run, an entry) with at least one mutant on its changed lines, all
  of them CompileError, is a finding (exit 1). `pass-compile-error` becomes a fail plant; a new pass plant keeps 007's
  report line with one CompileError beside a killed mutant; 007's FR-002, FR-007 and US1 scenario 2 are amended by
  this mission. A small change whose only mutant the type checker rejects then fails until a reasoned disable record
  is added.
- **(b) Threshold.** As (a), but only for two or more mutants on the changed lines, all CompileError.
  `pass-compile-error` stays a pass plant and 007's scenario holds; a new fail plant has two. A file whose single
  mutant is a compile error still passes even when the checker is broken for the whole file.
- **(c) Checker failure (recommended).** A changed file is reported as could not run (exit 2, naming the file and the
  diagnostic) when every mutant on its changed lines is a CompileError and all of them carry one same diagnostic
  (path, line and TS code) on a line none of those mutants spans: the unmutated file does not type-check under
  Stryker's checker, which is the data table's case. `pass-compile-error` stays a pass plant (its diagnostic is on its
  mutant's own line) and 007's verdicts stand; a new plant reproduces a checker failure off the mutated lines. The
  gate then depends on the diagnostic format of Stryker 10.1.1's TypeScript checker, which a gate self-test pins.
- **(d) Other** (state the rule).

Whichever is chosen, the tasks follow the gates package's layout: a red gate self-test in
`gates/test/mutation-report.test.ts` (on `classifyMutants`, with a recorded report) and a plant directory
`gates/plants/mutation/<expect>-<name>/` (`base/`, `head/`, `plant.json` with `expect`, `why` and `findings` or
`cause`), committed test first, then the change in `gates/lib/mutation/report.ts` (and `gates/bin/mutation.ts` if the
output changes), `gates/README.md` and the gate contract it names, all in phase 1 before T025 completes.
