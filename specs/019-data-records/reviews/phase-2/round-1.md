---
phase: 2
round: 1
verdict: changes_requested
base: 385dfe6bc917e77c57a42b8c5c05942bbc5ad09e
head: 84bbd96c851b92e8a8d0c10aab0f5d642bbd3f43
tdd_check: pass
---

# Phase 2 review, round 1

Scope: `git diff 385dfe6..84bbd96` (12 commits, from the spike to the tdd-check record). The tree was clean. The
source at HEAD is the source of a30cceb: 67343d4 and 84bbd96 change only records. The decisions in force are those
the task names: the phase 2 inventory, spike (Q1 to Q3, Q-S1) and issue-text decisions, the plan gate (Q-C, Q-E,
Q-G), the recheck and analysis decisions, and the operator's CI-first rule.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | specs/019-data-records/tasks.md:535 | T028 is a task of `## Phase 2:` and is still `- [ ]`. Its work is present. The answers are recorded (`reviews/phase-2-inventory-decisions.md`, `reviews/issue-texts-check.md`), applied in the documentation commit named by `reviews/decisions-applied-phase-2.md`, and the timeline's rows are in research.md R-16 (§ "Phase 2: the event timeline's rows"). T037 asserts those rows and T047 writes them. Phase 1's operator inventory step (T005, tasks.md:359) is ticked. The procedure requires every task of the phase to be ticked, so the phase cannot be accepted while tasks.md reports T028 as open. The implementer was right to leave the tick alone, since T028 is an operator and planner step. | The planner or the operator ticks T028 in a documentation commit. This is not a behaviour change, so no red test is needed. |
| R1-02 | note | packages/elements/src/ocelle-timeline-event.ts:19, :141; contracts/ocelle-timeline-event.md:4; contracts/ocelle-event-timeline.md:82 | Deviation 1 (the event imports only `hasSlottedTime` and applies `hasTime`'s rule to the `time` property). This is sound. In LitElement, `update()` calls `render()` before `ReactiveElement.update()` reflects properties to attributes. So `hasTime(this)` inside `render()` would read the old attribute after a property set. Line 141 uses the same rule as `timeline-time.ts:25`: a slotted time, or a trimmed non-blank `time`. Once the attribute is reflected, the timeline's `hasTime(event)` gives the same answer. The body "time set, changed and cleared by property after mount" pins this, and the plant "`time` not reflected" bites. The contract text no longer matches the code: it says the event imports both predicates, and that the timeline's predicate is "the same one the event uses for its time box". | The planner aligns the two contract sentences with the code: the event applies `hasTime`'s rule to the property because reflection comes after the render. No code change. |
| R1-03 | note | specs/019-data-records/spec.md:503-505; packages/elements/test/scenarios/event-timeline.ts:182-195 | Deviation 2 (US2-4 also runs in a 200 px column). This is sound and stricter. At 320 px the body asserts that the identifier stays inside the content box, that scroll width equals 320 and that copying gives the identifier unchanged. It also asserts that the identifier is on one line (`wide.lines: 1`). The 200 px column asserts the wrap (`lines: 2`, inside). Both were in the red commit (5a2ab3a, whose message gives the reason). The spec's "Then the identifier wraps inside the event" at 320 px describes a premise that the measured layout does not meet: the identifier fits there. | The planner rewords US2-4 to match what is asserted: the identifier stays inside at 320 px and wraps where the column is narrower than the identifier. No test change. |
| R1-04 | note | specs/019-data-records/reviews/phase-2/plants.md:3-5, :23-27 | Deviation 4 (the scoped plant run). The record's base equals `base.sha`. Its `--list` section matches my run: `note: affected: every plant, by packages/elements/package.json (not mapped)`, `315 of 315 plants selected`. The selection is therefore not different. Leaving out the 315-plant run follows the operator's CI-first rule, and CI's Plants check judges it. The 21-plant run with `package.json` reverted is extra local evidence, and I judge it sound. The only `package.json` change is two `exports` entries pointing into `dist/`. No gate under `gates/lib` or `gates/bin` reads the elements package's `exports` map. The element build is `tsc` plus `vite.browser.config.ts`. The stories import the element source by relative path. The manifest is generated from `src/`. The tool, not a hand-made list, selected the 21 plants from every other changed path. The 8 problems of the first scoped run were fixture drift caused by the two new elements and the twelve `color-ink` stories, not gate faults. The fixes keep each plant's own delta. | None. |
| R1-05 | note | packages/elements/test/node/records-pairs-check.ts:8-9, :37-38, :82 | Deviation 5 (rule tokens treated as decorative lines). Sound. It was changed in the red commit, not after it. It follows R-13 ("the decorative lines use `color-rule` and `color-rule-strong`, which have none" [no text declaration]). It does not open a gap. Each body asserts the exact painted list (`recordsPainted`), so a mark repainted in a rule token changes `painted` and fails. The rendered US2-8 body and the plant "the marker in `rule-strong`" cover the dot. The data table's body is unchanged. | None. |
| R1-06 | note | packages/elements/src/ocelle-event-timeline.ts:173; reviews/phase-2/element-plants.md:32 | Deviation 6 (the classMap refactor after the plant run). Sound. a30cceb changes only how the two item classes reach the `<li>`. Every body that reads the classes passes at HEAD, in process and on the fixture. Plant 4 was applied again to the new line and bites. The other plants change lines that the refactor does not touch. The manifest and the stories' markup do not depend on the line, so the gate plants are unaffected. | None. |
| R1-07 | note | packages/elements/src/ocelle-event-timeline.ts:150-155; packages/elements/src/ocelle-timeline-event.ts:130-135 | Deviation 7 (the emptied `disconnectedCallback` bodies recorded as equivalent). I accept the records. The reason "Lit's own disconnection only notifies reactive controllers" is incomplete. In the pinned Lit, `LitElement.disconnectedCallback` also calls `this.__childPart?.setConnected(false)`, and `ReactiveElement`'s notifies controllers. `setConnected` only reaches `AsyncDirective`s. The event renders no directive, and the timeline's `classMap` and `ifDefined` are synchronous directives, so the conclusion holds. A kept observer only re-renders a detached element, and `observe()` on reconnection replaces its options, so nothing observable changes. | Optional: complete the reason in the two `CallExpression` records the next time the lines are touched. |
| R1-08 | note | gates/test/integration/axe.test.ts:79-84, :96; gates/test/integration/storybook-build.test.ts:55; gates/test/integration/visual.test.ts:116-139, :244; gates/test/integration/plant-repo.test.ts:225; gates/test/manifest.test.ts:86-91; gates/test/integration/manifest.test.ts:19 | Deviation 8 (the pinned counts). Not a loosening. Each assertion is still an exact equality, moved by exactly the phase's additions: 2 elements, 13 stories, 26 story-themes and baselines. My `gate:axe` run prints the new axe line (`354 story-theme runs`), and `gate:manifest` prints `21 elements`. | None. |
| R1-09 | note | packages/elements/test/scenarios/event-timeline.ts:644-716 (761abef) | The four `change:` bodies were added after green, for T051. They cover behaviour the green code already had, with no source change, so they could not be red. The mutation run shows they can fail: they kill the `wrap` reflection, `aria-hidden` filter, `observedAttributes` and `ifDefined` mutants named in mutation.md. This is in line with Principle VIII's mutation clause. | None. |
| R1-10 | note | packages/elements/test/scenarios/event-timeline.ts:134-145 | Deviation 3 (the `generic` node per event in US2-1's tree). Sound. Each `generic` is an `ocelle-timeline-event` host with `display: block`, which spike.md § 1 measured. It is not a marker or connector node: those spans are `aria-hidden`, and the DOM half of the body pins that. The expected tree is unchanged since red. Green only added `roles` to the DOM half, which makes the body stricter, with the reason in the body's name and in element-plants.md (WebKit; the `role="list"` plant bites only through it). | None. |

## Test quality

- **Red evidence.** `tdd-check.json`: `pass`. Red commit 5a2ab3a has exit 1, the final tests exit 2 on the base and 1 on the scaffold, and the head exits 0. `red-phase.log` reports `191 of 7596 tests failed`. 189 of them are `AssertionError`s on the missing behaviour: the timeline bodies, the list-items, build, README, CHANGELOG, records-pairs and story-index bodies, and the six `gates/test` manifest bodies explained in gates.md. The other two are pre-existing `plant-repo.test.ts` bodies that timed out at 5 000 ms under the full suite's load and pass alone. The log has no syntax, import or reference error, and no sandbox path.
- **Scaffold.** 4b7a5f2 adds the three modules' signatures (empty `render()`, predicates returning `false`) and the exports, with no test file. The final tests fail against it (`final_tests_on_scaffold_exit: 1`).
- **Weakened tests.** I ran `git diff 5a2ab3a..HEAD` on the test pathspec. `scenarios/event-timeline.ts` gains only the stricter `roles` field (R1-10) and the four added bodies (R1-09). The `gates/test` files change only their pinned counts (R1-08). `event-timeline.stories.ts` is T045's green work. No test is skipped, focused, deleted or loosened.
- **Vacuous assertions.** The harnesses (`test/event-timeline.test.ts`, `test/browser/event-timeline.test.ts`) assert `toEqual(expected)` on each body's result. The fixture harness also asserts the clean CSP, request and console record in the same `toEqual`. In-page reads return a failure string, never `undefined`, when a node is missing, so a body run on the scaffold fails on its value. No conditional assertion, `skip`, `only`, snapshot or mock assertion. `gate:test-lint` is clean.
- **Coverage of the story.** US2-1 to US2-14 each have a body, as do US2-14's `slot` change, the `time` property bodies, the two connector-geometry bodies, and the edge cases of T033: standalone event, empty, `aria-hidden`, `lang` and `dir`, two slotted nodes, the blank-beside-filled slot, FR-026 and FR-001's hidden hosts. The pre-upgrade bodies are in `list-items.test.ts`, records-pairs has two bodies, and the README statements and the 13 story-index bodies are there. The timeline is not interactive, so no keyboard path beyond US2-7's `tabWalk` applies, and it emits no event.
- **Element plants.** All 21 plants of T050 are recorded in element-plants.md, each with its guard and failing assertion. Each bites.
- **Mutation.** I ran `pnpm run gate:mutation -- --base 385dfe6bc917e77c57a42b8c5c05942bbc5ad09e` at HEAD. Result: **exit 0**, `mutation: 148 mutants on the changed lines of 4 files, none survived; 5 timeouts, 19 compile errors, 1 zero-mutant entry; 10 equivalent records` (42 min). I read the 10 records: the `label` options object, the `aria-label` guard's `true` variant, the event's initial `#slotted` flag and its guard's `true` variant, and the two `disconnectedCallback` bodies with their two calls each. I accept each reason; R1-07 covers the incomplete one. The timeouts (`connectedCallback`'s `super` and `observe` calls, and one more line in the timeline's) and the compile errors are reports, not findings. My run has one timeout more than mutation.md's run 1 (4).

## Checks run

On HEAD, one heavy job at a time, under the operator's CI-first rule:

| Check | Result |
|---|---|
| `gate:typecheck` | exit 0, `typecheck: no type error in the files of tsconfig.json` |
| `gate:lint` | exit 0, `lint: 449 files checked, no finding` |
| `gate:style-lint` | exit 0, `style-lint: 41 files checked, no finding` |
| `gate:test-lint` | exit 0, `test-lint: 330 files checked, no finding` |
| `gate:manifest` | exit 0, `manifest: 21 elements checked, no finding` |
| `gate:config-copies` | exit 0 |
| `gate:csp` | exit 0, `csp: 39 files checked, no finding` |
| `gate:prefix` | exit 0, `prefix: 463 files checked, no finding` |
| `gate:signoff -- --range 385dfe6..HEAD` | exit 0, `signoff: 12 commits checked, no finding` |
| `gate:axe` | exit 0, `axe: 354 story-theme runs, 0 serious or critical; 84 notes (0 incomplete, 84 excepted)` |
| `gate:plants -- --affected 385dfe6 --list` | exit 0, `note: affected: every plant, by packages/elements/package.json (not mapped)`, `315 of 315 plants selected`; this matches plants.md (R1-04) |
| `gate:mutation -- --base 385dfe6…` | exit 0 (above) |
| `vitest --project elements`: event-timeline, the two entry files, entry-root, define, exports, driver | 7 files, 93 passed |
| `vitest --project elements-node`: readme, records-pairs, manifest, changelog | 4 files, 701 passed |
| `vitest --project elements-browser`: event-timeline, driver | 2 files, 80 passed (76 in gates.md, plus the four `change:` bodies of 761abef) |
| `vitest --project styles --project styles-browser packages/styles` | 14 files, 210 passed |
| `vitest --project elements-build` build.test.ts | 26 passed |
| `vitest --project storybook-integration` elements-stories, `-t event-timeline` | 56 passed |

Under the operator's rule, CI decides the full unit suite, `gate:storybook-build`, `gate:visual`, `gate:contrast`, `gate:brand-rules` and the full plant run.

**Constitution.**
- I: the names are `ocelle-`, there is no I/O, and the manifest declares the `time` and `wrap` properties, the default and `time` slots, the `time`/`content`/`list` parts, and `label`. `timeline-time.ts` is outside the manifest and the exports.
- II: tokens only (style-lint clean). The dot is in `ink-muted` and the connector in the decorative `rule-strong`. No monospace.
- III: the list is named through 009's `resolveName`, with no ID reference across the shadow root. The decorative spans are `aria-hidden`, and forced colours give `CanvasText`. axe is clean on the 13 stories in both themes.
- IV: CSP is clean, and the fixture bodies assert zero violations and no outside request.
- V: there are 13 stories and 26 baselines, as recorded by `visual:update` (`26 added, 0 changed, 0 removed`).
- VII: CHANGELOG entries for both elements, the styles rule and the `time` slot.
- VIII: above.

**Plan.** The structure follows plan.md and the contracts, except for the documented predicate call (R1-02): manual slot assignment on the timeline, named slots on the event, block 3's two rules in the base layer after the facts rule, and the internal `timeline-time.ts`. The implementation commits changed nothing outside the phase except the gate fixtures and pinned counts the two elements require (R1-04, R1-08). In tasks.md they changed only check boxes: T027 and T029 to T051.

## Earlier findings

None. This is round 1.
