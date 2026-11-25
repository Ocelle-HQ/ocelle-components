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
| 233 | `CallExpression: replaced by ;` on `#sizes.disconnect()` in `updated()` | removed. Corrected in review round 1 (R1-04): this row said that observing a target again re-observes it. It does not deliver again in Chromium; the disconnection before observing was what redelivered every target after each render. The line ends still follow without it, because they depend only on the `<li>`s' sizes, their number and the `<ol>`'s size, and the observer sees each of these change: an added `<li>` is a new target and delivers, a removed one reports 0 × 0 and delivers, and a size change delivers |
| 239 | `CallExpression: replaced by ;` on `#lineEnds()` in `updated()` | removed: the observer's callback decides the line ends whenever a render or a resize can move them (row 233, as corrected in review round 1, R1-04), so the call after a render was redundant (the no-loop test and US3-2, US3-3, US3-6 and the 640 px and 200 px bodies pass on it) |

All seventeen element plants were applied again to the final source and still bite (`element-plants.md`).

## Review round 1 (R1-02, R1-11)

After the round's fixes (`round-1-fixes.md`): `connectedCallback` requests an update on the chain and on the timeline,
and the chain keeps its size observer across a disconnection again, redone test-first (R1-03). Run 1's row for lines
191 to 194 said the moved-chain body fails with `#sizes.disconnect()` put back. That held for 5fa191c's source; since
connection renders again, the render after a move also observes the list and items, so that body no longer depends on
the call alone (it fails at the red commit f2ec02e, whose source is f572910's with neither fix, and passes with only the kept observer, checked in
process before the red commit).

Command: `pnpm run gate:mutation -- --base 5e7f6df60c22a732e4f5a383f4b0c97774261794 --files
packages/elements/src/ocelle-evidence-chain.ts,packages/elements/src/ocelle-evidence-step.ts,packages/elements/src/ocelle-event-timeline.ts`,
on the fix tree. The base is phase 2's, so every line of the three files is a changed line: the timeline's records,
which lie on lines phase 3's base does not count as changed, are judged too. 45 min 29 s.

```text
mutation: 174 mutants on the changed lines of 3 files, none survived; 8 timeouts, 26 compile errors, 0 zero-mutant entries; 10 equivalent records
exit 0
```

The re-derived records (R1-02, R1-11): with connection rendering again, a mutation observer kept across a
disconnection (`#mutations.disconnect()` removed) only adds renders while the element is detached. Those renders read
the same children as the render `connectedCallback` requests on reconnection, which is the one that decides what is
shown; `observe()` on reconnection replaces the options. Both `CallExpression` records (chain line 202, timeline line
157) say so, and the two `BlockStatement` records (chain 198, timeline 153) rest on them and on the
`super.disconnectedCallback()` records, which are unchanged. Probe, not committed: with the call removed from both
elements, all 62 in-process chain and timeline bodies pass, the two re-attach bodies among them. Before the fix the
review's reproduction told the mutant apart; now it does not, because the requested render shows the change.

The other six records are unchanged and were accepted in round 1 (chain) and in phase 2 (timeline). The timeouts are
the `connectedCallback` bodies and their `observe()` calls on both elements, as in run 1, the timeline's `aria-label`
attribute name and comparison (no update ever comes, so the naming body waits), and the timeline's new
`requestUpdate()` call (the re-attach body waits on a render that never comes). The chain's new `requestUpdate()` call
is killed by its re-attach body. The compile errors are the templates, `static properties` and optional chains, as
before.
