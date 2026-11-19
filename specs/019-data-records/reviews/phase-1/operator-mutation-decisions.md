# Phase 1: operator decisions at the T025 mutation stop

Asked after 9d71380, as multiple choice. The context is in reviews/phase-1/mutation.md.

## Q-M1: overflow-region.ts:660, `#release`'s `this.#axis = false`

The `true` mutant survives. The two differ only in the frame after a box swap, before the observer measures again: keyboard focus entering the new box in that frame gets block clearance under the mutant and none under the code. The contract describes the mutant's behaviour.

**Decision: (b) Read overflow fresh.** Change `onFocusIn` to read the block overflow directly instead of `#axis`, test-first. The mutant then becomes truly equivalent.

## Q-M2: re-attach defect in ocelle-data-table

When the element is detached, its `<table>` replaced and the element reattached, nothing is slotted. `connectedCallback` neither re-assigns the slot nor requests an update.

**Decision: (a) Fix in phase 1,** test-first: a red body, then `connectedCallback` re-assigns the slot and requests an update.

## Gate gap: gate:mutation passes a file whose every mutant is a compile error

**Decision: Fix the gate in this mission.** Add a task so that gate:mutation fails a file whose mutants are all compile errors, with a plant.

## Gate gap rule (follow-up, asked after 8d8320b)

"Fail any file whose mutants are all compile errors" conflicts with mission 007's `pass-compile-error` plant, whose only mutant is a compile error.

**Decision: (c) Checker failure.** gate:mutation exits 2 ("could not run", naming the file and the diagnostic) when all of a file's changed-line mutants are CompileError and share one diagnostic (the same path, line and TS code) on a line none of them spans. `pass-compile-error` stays a pass plant and 007's verdicts stand. A gate self-test pins how Stryker 10.1.1's TypeScript checker formats its diagnostics.

Not chosen: (a) fail on all-compile-error, amending 007; (b) the same with a threshold of two mutants.
