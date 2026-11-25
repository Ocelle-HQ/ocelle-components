# Mutation of phase 2 (T051)

Command: `pnpm run gate:mutation -- --base 385dfe6bc917e77c57a42b8c5c05942bbc5ad09e` (the phase base), Stryker on the
in-process `elements` and `elements-touch` projects (`stryker.elements.config.json`) for the changed element source:
`timeline-time.ts`, `ocelle-timeline-event.ts`, `ocelle-event-timeline.ts` and `index.ts`. `base.css` is not mutated
(not TypeScript); no gate source changed. The plan cut the four files into 11 shards.

## Runs

| Run | Tree | Result |
|---|---|---|
| 1 | a30cceb (green, the run-time change bodies of 761abef and the classMap refactor with its equivalence records) | exit 1: `mutation: 2 findings in 4 changed files (148 mutants on changed lines; 4 timeouts, 19 compile errors, 1 zero-mutant entry)` (43 min 13 s). The two survivors: `BlockStatement: replaced by {}` on the `disconnectedCallback` body of each element (timeline line 150, event line 130). During this run the kernel killed one process for lack of memory (Stryker's concurrency 8 on 4 cores); Stryker replaced the worker and the run completed every shard |
| 2 | a30cceb plus the two records below, `--files packages/elements/src/ocelle-event-timeline.ts:150-155,packages/elements/src/ocelle-timeline-event.ts:130-135` | **exit 0**: `mutation: 4 mutants on the changed lines of 2 files, none survived; 0 timeouts, 0 compile errors, 0 zero-mutant entries; 6 equivalent records` (19 min 47 s) |

Run 2 covers only the two `disconnectedCallback` ranges, the only lines run 1 found a survivor on; the records added
for it shift no other line's mutants (each is a comment line). Every other changed line was settled by run 1.

## Survivors closed before run 1

Read from the source before the first run, not from a report (so run 1 is the first run):

- **Killed by new bodies** (761abef, shared, in both harnesses): `wrap` set and unset by property (the event's
  `wrap: { reflect: true }`); `aria-hidden` set and removed on a slotted time after mount (the event's observer filter
  `aria-hidden`) and on an event (the timeline's filter `aria-hidden`); the host `aria-label` set, blanked and removed
  and `label` changed after mount (the timeline's `observedAttributes`, `attributeChangedCallback`'s
  `super.attributeChangedCallback` and `requestUpdate`, and the `ifDefined` on the list's `aria-label`).
- **Removed by a behaviour-neutral refactor** (a30cceb): the item classes through Lit's `classMap` instead of a filtered,
  joined string, whose filter mutants (an extra space in the class string) were equivalent.
- **Recorded as equivalent** (a30cceb, each a `Stryker disable next-line` with its reason; listed by run 1 as records):
  the timeline's `label` options object (Lit's defaults are type String's); the `true` variant of the `aria-label`
  update guard; both elements' `super.disconnectedCallback()` (Lit's own notifies reactive controllers, which neither
  has, and `LitElement`'s also calls `this.__childPart?.setConnected(false)`, which only matters for async directives:
  the event renders no directive, and the timeline's `classMap` and `ifDefined` are synchronous, so neither uses one;
  reason completed after review round 1, R1-07, in the source comments too; the outputs below show the reason as it
  stood at each run) and observer `disconnect()` (a kept observer only re-renders an element out of the document, and
  `observe()` on reconnection replaces its options); the event's initial slotted flag (set by `render()` before any
  comparison can be seen) and the `true` variant of its update guard (an update with no slotted-time change renders
  the same time box).

## Run 1's survivors

- `ocelle-event-timeline.ts:150` and `ocelle-timeline-event.ts:130`, `BlockStatement: replaced by {}` on
  `disconnectedCallback()`: the body holds the two calls recorded as equivalent above, so leaving out both is
  equivalent too. Recorded with `// Stryker disable next-line BlockStatement` and that reason on each method; run 2
  lists both as records and finds no survivor.

## Output

```text
$ node gates/bin/mutation.ts -- --base 385dfe6bc917e77c57a42b8c5c05942bbc5ad09e
packages/elements/src/ocelle-event-timeline.ts:50: mutation: record: ObjectLiteral: equivalent, {} gives Lit's default options, which are type String's (attribute "label", the default converter, not reflected)
packages/elements/src/ocelle-event-timeline.ts:151: mutation: record: CallExpression: equivalent, Lit's own disconnection only notifies reactive controllers, which this element has none of
packages/elements/src/ocelle-event-timeline.ts:153: mutation: record: CallExpression: equivalent, a kept observer re-renders a timeline out of the document, which shows nothing, and observe() on reconnection replaces its options
packages/elements/src/ocelle-event-timeline.ts:159: mutation: record: ConditionalExpression: equivalent for the `true` variant, an update for another attribute, with no property changed, renders the same list
packages/elements/src/ocelle-timeline-event.ts:117: mutation: record: BooleanLiteral: equivalent, render() sets it before the first change it is compared with can be seen: a record delivered before the first render only requests the update already pending
packages/elements/src/ocelle-timeline-event.ts:121: mutation: record: ConditionalExpression: equivalent for the `true` variant, an update with no slotted-time change renders the same time box
packages/elements/src/ocelle-timeline-event.ts:131: mutation: record: CallExpression: equivalent, Lit's own disconnection only notifies reactive controllers, which this element has none of
packages/elements/src/ocelle-timeline-event.ts:133: mutation: record: CallExpression: equivalent, a kept observer re-renders an event out of the document, which shows nothing, and observe() on reconnection replaces its options
packages/elements/src/ocelle-event-timeline.ts:145: mutation: timeout: BlockStatement: replaced by {}
packages/elements/src/ocelle-event-timeline.ts:146: mutation: timeout: CallExpression: replaced by ;
packages/elements/src/ocelle-timeline-event.ts:125: mutation: timeout: BlockStatement: replaced by {}
packages/elements/src/ocelle-timeline-event.ts:126: mutation: timeout: CallExpression: replaced by ;
packages/elements/src/ocelle-event-timeline.ts:33: mutation: compile-error: BlockStatement: replaced by {}
packages/elements/src/ocelle-event-timeline.ts:47: mutation: compile-error: ObjectLiteral: replaced by {}
packages/elements/src/ocelle-event-timeline.ts:47: mutation: compile-error: StringLiteral: replaced by ""
packages/elements/src/ocelle-event-timeline.ts:55: mutation: compile-error: BlockStatement: replaced by {}
packages/elements/src/ocelle-event-timeline.ts:160: mutation: compile-error: CallExpression: replaced by ;
packages/elements/src/ocelle-event-timeline.ts:163: mutation: compile-error: BlockStatement: replaced by {}
packages/elements/src/ocelle-event-timeline.ts:167: mutation: compile-error: BlockStatement: replaced by {}
packages/elements/src/ocelle-event-timeline.ts:173: mutation: compile-error: LogicalOperator: replaced by next !== undefined || hasTime(next)
packages/elements/src/ocelle-event-timeline.ts:173: mutation: compile-error: ConditionalExpression: replaced by true
packages/elements/src/ocelle-event-timeline.ts:173: mutation: compile-error: EqualityOperator: replaced by next === undefined
packages/elements/src/ocelle-event-timeline.ts:183: mutation: compile-error: OptionalChaining: replaced by slots[at].assign
packages/elements/src/ocelle-timeline-event.ts:122: mutation: compile-error: CallExpression: replaced by ;
packages/elements/src/ocelle-timeline-event.ts:137: mutation: compile-error: BlockStatement: replaced by {}
packages/elements/src/ocelle-timeline-event.ts:140: mutation: compile-error: MethodExpression: replaced by this.time ?? ""
packages/elements/src/ocelle-timeline-event.ts:140: mutation: compile-error: LogicalOperator: replaced by this.time && ""
packages/elements/src/timeline-time.ts:12: mutation: compile-error: BlockStatement: replaced by {}
packages/elements/src/timeline-time.ts:24: mutation: compile-error: BlockStatement: replaced by {}
packages/elements/src/timeline-time.ts:25: mutation: compile-error: MethodExpression: replaced by event.getAttribute("time") ?? ""
packages/elements/src/timeline-time.ts:25: mutation: compile-error: LogicalOperator: replaced by event.getAttribute("time") && ""
packages/elements/src/index.ts: mutation: zero-mutants: no mutant on the changed lines
packages/elements/src/ocelle-event-timeline.ts:150: mutation: BlockStatement: Survived: replaced by {}
packages/elements/src/ocelle-timeline-event.ts:130: mutation: BlockStatement: Survived: replaced by {}
mutation: 2 findings in 4 changed files (148 mutants on changed lines; 4 timeouts, 19 compile errors, 1 zero-mutant entry)
[ELIFECYCLE] Command failed with exit code 1.
real	43m13.086s
user	15m19.805s
sys	2m50.054s
exit: 1

$ node gates/bin/mutation.ts -- --base 385dfe6bc917e77c57a42b8c5c05942bbc5ad09e --files packages/elements/src/ocelle-event-timeline.ts:150-155,packages/elements/src/ocelle-timeline-event.ts:130-135
packages/elements/src/ocelle-event-timeline.ts:150: mutation: record: BlockStatement: equivalent, the body's two calls are each equivalent (below), so is leaving out both
packages/elements/src/ocelle-event-timeline.ts:152: mutation: record: CallExpression: equivalent, Lit's own disconnection only notifies reactive controllers, which this element has none of
packages/elements/src/ocelle-event-timeline.ts:154: mutation: record: CallExpression: equivalent, a kept observer re-renders a timeline out of the document, which shows nothing, and observe() on reconnection replaces its options
packages/elements/src/ocelle-timeline-event.ts:130: mutation: record: BlockStatement: equivalent, the body's two calls are each equivalent (below), so is leaving out both
packages/elements/src/ocelle-timeline-event.ts:132: mutation: record: CallExpression: equivalent, Lit's own disconnection only notifies reactive controllers, which this element has none of
packages/elements/src/ocelle-timeline-event.ts:134: mutation: record: CallExpression: equivalent, a kept observer re-renders an event out of the document, which shows nothing, and observe() on reconnection replaces its options
mutation: 4 mutants on the changed lines of 2 files, none survived; 0 timeouts, 0 compile errors, 0 zero-mutant entries; 6 equivalent records
real	19m47.429s
user	2m45.509s
sys	0m24.164s
exit: 0
```
