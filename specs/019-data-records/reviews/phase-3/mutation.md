# Mutation of phase 3 (T074)

Command: `pnpm run gate:mutation -- --base cd1d73c8d5c390e674480268fb9953c770b10bfc` (the phase base), Stryker on the
in-process `elements` and `elements-touch` projects (`stryker.elements.config.json`) for the changed element source:
`ocelle-evidence-step.ts`, `ocelle-evidence-chain.ts` and `index.ts`. `base.css` is not mutated (not TypeScript); no
gate source changed. Run one heavy job at a time.

## Runs

| Run | Tree | Result |
|---|---|---|
| 1 | 95086aa (green) | exit 1: `mutation: 9 findings in 3 changed files (102 mutants on changed lines; 2 timeouts, 15 compile errors, 1 zero-mutant entry)` |
| 2 | 95086aa plus the changes below (source, two shared bodies, the equivalence records) | exit 1: `mutation: 1 finding in 3 changed files (98 mutants on changed lines; 2 timeouts, 15 compile errors, 1 zero-mutant entry)` (41 min 35 s). The one survivor: `ObjectLiteral: replaced by {}` on the `label` options (line 49), which run 1 did not report |
| 3 | run 2's tree plus that line's record, `--files packages/elements/src/ocelle-evidence-chain.ts:48-51` | **exit 0**: `mutation: 2 mutants on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 0 zero-mutant entries; 1 equivalent record` |

Run 3 covers only the `label` options line, the only line run 2 found a survivor on; the record added for it is a
comment line and shifts no other line's mutants. Every other changed line was settled by run 2.

The two timeouts (both runs) are `connectedCallback`'s body and its `observe()` call: without the mutation observer a
body waits on a change that never renders, so the mutant is detected by timeout. The compile errors are Stryker's
mutants that do not type-check (Lit's `css`/`html` templates, `static properties`, the optional chains), and
`index.ts`'s two export lines carry no mutant.

## Run 1's survivors and what closed them

| Line (run 1) | Mutant | Closed by |
|---|---|---|
| 188 | `StringLiteral: replaced by ""` in the observer's attribute filter (`"aria-hidden"`) | a new shared body, "aria-hidden set and removed on a step after mount" (both harnesses), which fails with `"aria-hidden"` dropped from the filter |
| 191 to 194 | `disconnectedCallback`'s body and each of its three calls | `#sizes.disconnect()` removed from it: a chain moved to another parent was left with no size observer (no render follows a reconnection), so its line ends stopped following its width. A new shared body, "a chain moved to another parent and then narrowed to 200 px", fails with the call put back. The body's other two calls are recorded as equivalent, as on the timeline (phase 2): Lit's `super.disconnectedCallback()` reaches only reactive controllers and async directives (the chain has neither; `ifDefined` is synchronous), and a kept mutation observer only re-renders a chain out of the document, while `observe()` on reconnection replaces its options |
| 199 | `ConditionalExpression: replaced by true` on the `aria-label` update guard | recorded as equivalent: an update for another attribute, with no property changed, renders the same list |
| 223 | `StringLiteral: replaced by "Stryker was here!"` on a default step's `<li>` class | the class written through `ifDefined(chip ? "chip" : undefined)`: a default `<li>` has no `class` attribute, and every remaining mutant is killed |
| 233 | `CallExpression: replaced by ;` on `#sizes.disconnect()` in `updated()` | removed: observing a target again re-observes it, so the call was a no-op for the current items |
| 239 | `CallExpression: replaced by ;` on `#lineEnds()` in `updated()` | removed: observing the list and items after each render delivers once after the next layout, so the observer's callback already decides the line ends after every render (the no-loop test and US3-2, US3-3, US3-6 and the 640 px and 200 px bodies pass on it) |

All seventeen element plants were applied again to the final source and still bite (`element-plants.md`).
