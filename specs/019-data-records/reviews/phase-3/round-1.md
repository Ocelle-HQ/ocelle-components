---
phase: 3
round: 1
verdict: changes_requested
base: cd1d73c8d5c390e674480268fb9953c770b10bfc
head: 27ae1d62c768d4860bcb13df0745f91fc1bc8752
tdd_check: pass
---

# Phase 3 review, round 1

Scope: `git diff cd1d73c..27ae1d6` (9 commits, from the spike to the tdd-check record). The tree was clean. The
source at HEAD is the source of 5fa191c, because 27ae1d6 changes only the five check records. The decisions in force
are the ones the task names: the phase 3 inventory decisions and their application, the phase 3 spike decisions
(Q1 (b), Q2 (a)) and their fixes, Q-T4 and Q-T5, phase 2 spike Q2 (a), plan gate Q-A, the recheck and analysis
decisions, and the operator's CI-first rule.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | packages/elements/src/ocelle-evidence-chain.ts:188-201; spec.md:1013-1016 (FR-025) | **A chain changed while it is detached does not show the change once it is attached again.** `connectedCallback` starts observing again but neither re-assigns the slots nor requests an update. `disconnectedCallback` has stopped the `MutationObserver`, so it misses every change made while the chain is detached. I reproduced this in the in-process project. I rendered a chain of six steps and removed it from the document. I appended a seventh `ocelle-evidence-step` and appended the chain back. After the next frames the chain still had 6 `<li>`, the seventh step had no client rect, and `data-line-end` was still on the sixth item. This stays so until some later mutation causes a render. FR-025 says "Adding, removing, hiding or showing an item MUST update the list, markers, connectors and ordinals". The operator ruled the same defect on the data table a defect and had it fixed test-first (phase 1 Q-M2 (a), `reviews/phase-1/operator-mutation-decisions.md`; spec.md:223-224, FR-003). `ocelle-facts` already requests an update on connection (ocelle-facts.ts:217). | Fix it test-first. First a red commit with a shared body: a chain detached, a step appended and another step given `hidden`, then the chain attached again; it shows the new list, ordinals and line ends. Then `connectedCallback` requests an update. |
| R1-02 | blocking | packages/elements/src/ocelle-evidence-chain.ts:195, :199 | **The equivalence record of the `CallExpression` mutant on `this.#mutations.disconnect()` is wrong, so a non-equivalent mutant survives.** The reason given is "a kept observer re-renders a chain out of the document, which shows nothing". That re-render is kept, though, and is what the chain shows once it is attached again. With the call removed, my R1-01 reproduction passes: 7 `<li>`, the seventh step shown, the line end moved to it. With the code as it is, the reproduction fails. The `BlockStatement` record at :195 relies on this one ("each equivalent"). The skill treats a surviving mutant in new code without a valid record as blocking. | After R1-01's fix the two disconnections differ only in a render that happens anyway on connection. Re-derive both reasons from that, and run `gate:mutation -- --base cd1d73c…` again. |
| R1-03 | blocking | 5fa191c, packages/elements/src/ocelle-evidence-chain.ts:193-201; packages/elements/test/scenarios/evidence-chain.ts:513-523 | **Deviation 4: a behaviour change with no red commit.** 5fa191c changes behaviour: a chain moved to another parent kept no size observer and now keeps one. The body that proves the change is in the same commit as the fix, so there is no red commit that changes only test files (Principle VIII, "Red first"; `red-commits` lists only `phase`). The fix itself is right. I ran that body from HEAD against the green source of 95086aa and it fails (`narrow.ends` not all `ok`). At HEAD it passes. The second body added in 5fa191c ("aria-hidden set and removed after mount") covers behaviour the green code already had, as on the timeline (phase 2 R1-09). That one is in order. | The operator decides. One option is to accept the fix as committed and keep the red evidence with the review: the body run against 95086aa, as a `red-*.log`. The other is to have the fix redone test-first in the R1-01 fix round. |
| R1-04 | note | packages/elements/src/ocelle-evidence-chain.ts:240-241; reviews/phase-3/mutation.md (run 1 table, lines 233 and 239) | **Deviation 5.** The reason given is "Observing a target, anew or again, delivers its size once after the next layout" and "observing a target again re-observes it". The "again" half is not true in Chromium. I called `observe()` a second time on a target the observer already observed, with the same box option, and no second callback came. Before 5fa191c, `disconnect()` followed by `observe()` did redeliver. The behaviour still holds, for another reason. The line ends depend only on the `<li>`s' sizes, their count and the `<ol>`'s size, and the observer sees each of these change. An added `<li>` is a new target and delivers. A removed `<li>` reports 0 × 0 and delivers. My probes: removing the last step of a one-row chain, and hiding and showing a step, each moved `data-line-end` correctly. The no-loop test and the 200, 320 and 640 px bodies pass. Rendering and axe: 5fa191c changes when `data-line-end` is written, before the first paint either way, and drops an empty `class=""` that no rule reads. My `gate:axe` run at HEAD is clean: 382 runs, 0 serious or critical, the same 84 notes. I see nothing in the commit that can change a baseline; CI's visual check judges that. One side effect: removed `<li>`s are never unobserved, so the observer holds them for the chain's lifetime. | Correct the comment and the mutation.md wording: re-observing does not deliver; the line ends follow from the observed sizes and from the added or removed targets. Optionally `unobserve` the removed items. No behaviour change is required. |
| R1-05 | note | packages/elements/src/ocelle-evidence-step.ts:293-295; contracts/ocelle-evidence-step.md (§ Shadow structure table) | **Deviation 1 is sound.** The content part becomes a block inside the inline-block host. It is not a flex item, so a standalone or slotted step lays out the same. `visual:update` reported `0 changed`, `wrap="anywhere"` and the `lang`/`dir` body still pass, and axe is clean on the long-step story. The contract's table still lists only `overflow-wrap` for `[part="content"]`. | The planner adds `display: block` and its reason (axe `bgOverlap` between the line boxes of an inline span) to the contract's table. No code change. |
| R1-06 | note | packages/elements/src/ocelle-evidence-chain.ts:214-221 | **Deviation 2 is sound and is not a contract deviation.** R-12 (research.md:831-835) gives the element no tolerance: it says to "compare each visible `<li>`'s block-start offset with the next one's". The 0.5 px is the tests' oracle (scenarios/evidence-chain.ts:71), and it still judges the element. Under `align-items: flex-start` the items of one flex line share their cross-start exactly. Plants 2 and 11 were applied again after the change and still bite (element-plants.md). | None. |
| R1-07 | note | packages/styles/test/source.test.ts:439-449 | **Deviation 3 is not a loosening.** Together the two bodies pin "facts, timeline, chain, the focus ring" in the header comment, which is stricter than the one body before. The red commit e82e535 names the change and gives the reason. | None. |
| R1-08 | note | reviews/phase-3/plants.md; gates/plants/visual/fail-token-changed/plant.json | **Deviation 6 is sound.** My `gate:plants -- --affected cd1d73c… --list` printed `note: affected: every plant, by packages/elements/package.json (not mapped)` and `315 of 315 plants selected`. That matches the record, and the record's base is `base.sha`. The scoped run of 21 plants follows phase 2's accepted approach (phase 2 R1-04). The fixture updates keep each plant's own delta. 146 → 159 is the thirteen chain stories that show `color-ink` (every one except the empty story). 5fa191c reaches none of the 21 plants' inputs in a way that could move their outcome: `gate:manifest` is clean at HEAD, and axe was rerun (R1-04). CI's Plants check judges all 315. | None. |
| R1-09 | note | reviews/phase-3/element-plants.md (plant 11); packages/elements/test/evidence-chain.test.ts | **Deviation 7.** The padding-toggle plant makes the no-loop test fail, which R-12 requires. It fails at the layout wait (`#c did not settle in 10 frames`), not at the loop-error assertion. The recorder is shown able to fire only by the synthetic `ErrorEvent`. The spike saw the real loop error on the stand-in (spike.md § 1). I accept this as it is. | None. |
| R1-10 | note | storybook/stories/evidence-chain.stories.ts | **Deviation 8 is in order.** The stories are T068's green work, and their tests (T061) were in the red commit and failed there. Phase 2 did the same. | None. |
| R1-11 | note | packages/elements/src/ocelle-event-timeline.ts:145-156 | The timeline, from phase 2, has the same reattach defect as R1-01. I reproduced it: a timeline event appended while the timeline is detached is not shown after reattaching. By the same reasoning, though I did not run it, its matching equivalence record (ocelle-event-timeline.ts:154) has the same flaw as R1-02. This is outside phase 3. | The operator decides whether the timeline gets the same test-first fix (in this mission, like Q-M2) or a later one. |

## Test quality

- **Red evidence.** `tdd-check.json`: `pass`. The red commit e82e535 exits 1. The final tests exit 2 on the base and 1 on the scaffold, and the head exits 0. `red-phase.log`: `unit-tests: 178 of 7765 tests failed`, and all 178 are `AssertionError`s. The log has no syntax, import, reference or type error and no sandbox path. The failures are the missing behaviour: the shared bodies in both harnesses, the no-loop test, the entry, define and build bodies, the manifest, records-pairs, no-pill and README bodies, the styles bodies, the story bodies, and the pinned gate counts. `exports.test.ts` passes at red because the scaffold exports the classes.
- **Scaffold.** bfe5e1a adds only the signatures (the property declarations and an empty `render()`) and the exports, with no test file. The final tests fail against it (`final_tests_on_scaffold_exit: 1`).
- **Weakened tests.** I ran `git diff e82e535..HEAD` on the test pathspec. `scenarios/evidence-chain.ts` only gains the two 5fa191c bodies (R1-03). `evidence-chain.stories.ts` is green work (R1-10). No test is skipped, focused, deleted or loosened. The source.test.ts change is in the red commit and is stricter (R1-07).
- **Vacuous assertions.** Both harnesses assert `toEqual(expected)` on each body's whole result. The fixture harness also checks the clean CSP, request and console record in the same assertion. When a node is missing, an in-page read returns a failure string, so a body fails on its value. No body has a conditional assertion, `skip`, `only`, a snapshot or a mock assertion. `gate:test-lint` is clean.
- **Coverage.** US3-1 to US3-10 each have a body. US3-3 also runs in a 200 px column (Q-T5 (b)). The bodies of T056 are there: the twenty-step ordinal fit, the mixed-chips centre line and the edge cases (standalone step, empty chain, `aria-hidden`, a link's tab stop, `lang`/`dir`, FR-026, FR-001's hidden hosts, 640 px, unset properties). So are the naming changes after mount, the pre-upgrade bodies, records-pairs, no-pill, the README statements and the 14 stories' bodies. The chain emits no event and is not interactive. The link's tab walk is its only keyboard path, and a body covers it. No body covers a change made while the chain is detached (R1-01).
- **Element plants.** All 17 plants of T073 are recorded with their guards and failing assertions. They were applied again to the final source, and each bites.
- **Mutation.** I ran `pnpm run gate:mutation -- --base cd1d73c8d5c390e674480268fb9953c770b10bfc` at HEAD: **exit 0**, `mutation: 98 mutants on the changed lines of 3 files, none survived; 2 timeouts, 15 compile errors, 1 zero-mutant entry; 5 equivalent records`. I read the five records. I accept three: the `label` options object (:49), the `super.disconnectedCallback()` call (:197) and the `aria-label` guard's `true` variant (:205). I reject the `#mutations.disconnect()` record (:199), and with it the body record (:195), because the mutant behaves differently (R1-02). The two timeouts (`connectedCallback`'s body and its `observe()`) and the compile errors are reports, not findings.

## Checks run

On HEAD, one heavy job at a time, under the operator's CI-first rule:

| Check | Result |
|---|---|
| `gate:typecheck` | exit 0, `typecheck: no type error in the files of tsconfig.json` |
| `gate:lint` | exit 0, `lint: 458 files checked, no finding` |
| `gate:style-lint` | exit 0, `style-lint: 43 files checked, no finding` |
| `gate:test-lint` | exit 0, `test-lint: 337 files checked, no finding` |
| `gate:manifest` | exit 0, `manifest: 23 elements checked, no finding` |
| `gate:config-copies` | exit 0 |
| `gate:csp` | exit 0, `csp: 41 files checked, no finding` |
| `gate:prefix` | exit 0, `prefix: 477 files checked, no finding` |
| `gate:signoff -- --range cd1d73c..HEAD` | `signoff: 8 commits checked, no finding` |
| `gate:axe` | exit 0, `axe: 382 story-theme runs, 0 serious or critical; 84 notes (0 incomplete, 84 excepted)` |
| `gate:plants -- --affected cd1d73c… --list` | exit 0; matches plants.md (R1-08) |
| `gate:mutation -- --base cd1d73c…` | exit 0 (above; R1-02) |
| `vitest --project elements`: evidence-chain, the two entry files, entry-root, define, exports | 6 files, 41 passed |
| `vitest --project elements-browser` evidence-chain | 25 passed |
| `vitest --project elements-node packages/elements/test/node` | 8 files, 749 passed |
| `vitest --project styles --project styles-browser packages/styles` | 14 files, 216 passed |
| `vitest --project storybook-integration` elements-stories, `-t evidence-chain` | 60 passed |
| `vitest --project elements-build` build.test.ts | 28 passed |
| In-process probes (scratch, not committed) | R1-01's reattach reproduction fails at HEAD and passes with the `#mutations.disconnect()` mutant. The 5fa191c move body fails on 95086aa's source. A repeated `observe()` delivers no second callback. Removing or hiding a step moves the line end correctly. |

Under the operator's rule, CI decides the full unit suite, `gate:storybook-build`, `gate:visual`, `gate:contrast`, `gate:brand-rules` and the full plant run. The tdd-check's head run covered the full suite on the final source.

**Tasks.** T052 to T074 are ticked, and their work is present. The phase's commits changed nothing else in tasks.md, apart from the counts that phase 3 spike Q1 (b) moved, which spike-fixes.md records. Outside the phase, the only changes are the gate fixtures and pinned counts that the two elements and 14 stories require.

**Constitution.**
- I: the names are `ocelle-` and the elements do no I/O. The manifest declares `label` and the `list` part on the chain, and `variant`, `wrap`, the default slot and the `content` part on the step.
- II: tokens only (style-lint is clean). The chip uses `--ocelle-radius-2` and never the pill radius (no-pill body). The connector is in the decorative `rule-strong`. No monospace.
- III: `resolveName` names the list, with no ID reference across the shadow root. The markers and connectors are `aria-hidden`. Forced colours give `CanvasText` borders. axe is clean on all 14 stories in both themes.
- IV: CSP is clean. The fixture bodies assert zero violations and no outside request.
- V: 14 stories and 28 baselines (`28 added, 0 changed, 0 removed`).
- VII: CHANGELOG entries for both elements and for the styles rules.
- VIII: see Test quality, R1-02 and R1-03.

**Plan.** The plan's structure and R-12 are followed: manual slot assignment, a wrapping flex row, the reserved `--ocelle-size-step` line box, the connector in trailing padding hidden by `data-line-end`, the first-line margin with no wrapper, and block 3's two rules after the timeline's. The exceptions are the contract gap of R1-05 and the reattach gap of R1-01.

## Earlier findings

None: this is round 1.
