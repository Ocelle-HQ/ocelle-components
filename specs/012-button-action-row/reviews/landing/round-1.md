---
phase: landing
round: 1
verdict: changes_requested
base: 13af7a91c590507787dc0a687e4956170ddafe02
head: 04ae98eea2e6cf84454adae706d409c6d8840bc0
tdd_check: pass
---

# Landing review, round 1

This round reviews PR #50 (mission 012, `ocelle-button` and `ocelle-action-row`) as it will land. The change under
review is `git diff origin/main...HEAD`: merge base 13af7a9, HEAD 04ae98e, branch `claude/007-actions-status`, 346
files. The working tree was clean. The round also covers the three merges of main (8cd1f45, 4dc8e92, 84e8bf0) and the
landing commits d4a56ea (red), 558c560 (fix), 497b05f and 04ae98e. I used the phase 1 to 6 story reviews, the run
summary and plan decisions 29 to 32 as inputs and checked them against the code. They did not replace that check.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | specs/012-button-action-row/tasks.md:279 (T067 `[ ]`); specs/012-button-action-row/tasks.md:67; specs/006-storybook-workbench/plan.md:637 (sunset column); gates/lib/plant-runner.ts:272 (`shardSize = 1`) | **The Plants shard-time check that 012 must pass before merge was never run, and the merged repository is far past the size it was approved for.** T067 is still open and `reviews/phase-6/ci-run.md` does not exist (`ls`: no such file). Phase 6 review R1-01 sent T067 to landing: "Before merge: push, record `reviews/phase-6/ci-run.md` with every Plants shard's time and the run's total, and tick T067. A shard at or over 10 minutes is a stop-and-ask … and the merge waits for the operator". The operator approved size 1 for about 72 stories, with a split count of 76 (plan decision 15). The three merges raised the repository to **171 stories** (84e8bf0 body: "stories 120+51 = 171"; `storybook-build: built 171 stories` pinned in gates/test/integration/storybook-build.test.ts:55). That is 95 stories past the split count. 006's model (387 + 1.377 × (2s + 2) s per size-1 `visual` shard) gives **about 861 s per shard at 171 stories**. That is over the 570 s "near 10 minutes" line (006 plan.md:383) and over 600 s. It also gives about 73 × 861 s ≈ **17.5 Plants runner-hours** per CI run, against the 11.9 that was accepted. The CI facts I was given state job outcomes only, not shard times, so the model has not been checked against a real run at 171 stories. Run 44098238937, attempt 1, also did not complete every shard: shard 23 never ran. Size 1 is the last setting (`plantShards` keeps each plant whole), so no setting is left to fix this. | Once a CI run on the final HEAD has completed all 76 shards (attempt 2 of 44098238937, or a new run), write `specs/012-button-action-row/reviews/phase-6/ci-run.md`. Record the run id, the attempt, every Plants shard's wall time, the slowest `visual` shard and the job total. If every shard is under 570 s, tick T067. If any shard is above 570 s, stop and ask the operator, as T067 and 006 plan.md:637 require. The merge waits for that answer. |
| R1-02 | blocking | gates/README.md:58-66; gates/lib/plant-runner.ts:266-268; specs/006-storybook-workbench/plan.md:637 | **The gate contract states sizing figures the merge made false.** gates/README.md says "a size-1 shard takes about 588 s at the 72 stories the repository holds after 012", "after 012 about **4 stories** of headroom remain" and "at 72 stories … about **11.9 Plants runner-hours**". The `shardSize` comment says "a `visual` shard stays under 10 minutes at about 58 repository stories". 006's Complexity Tracking row repeats the 72-story figures and the 4-story headroom. After the merges the repository holds 171 stories (R1-01), so there is no headroom: it is 95 stories past the approved split count. These are the figures the operator reads to decide the plant-design triage that decision 15 defers to landing. | Correct the three places to the merged state: 171 stories, the measured shard times and total from R1-01's `ci-run.md` (state that the model is used only where nothing was measured), and the split count's status, now exceeded. Make the edit in the same commit as `ci-run.md` or right after it. |
| R1-03 | note | gates/README.md:36 (`brand-rules` row); specs/002-design-tokens/contracts/gates.md:232 | The `brand-rules` row says "reduced motion at 0ms for every motion duration of the token source". Since C1 (558c560) the gate skips records marked `delay: true` (gates/bin/brand-rules.ts:196-200), and the row does not mention this exception, which decision 29 now names ("every motion duration except those marked as delays"). 04ae98e brought the spec documents in line but did not touch gates/README.md. 002's plant table also does not list the new `f-motion-spin-missing` plant (the README row does, and gates-readme.test.ts pins that). | Add "except those the source marks as delays (`delay: true`; operator decision C1)" to the row, and list `f-motion-spin-missing` in 002's contracts/gates.md. Both can go in R1-02's commit. |
| R1-04 | note | gates/bin/brand-rules.ts:196-200; packages/tokens/src/generate.ts:274-283 | **Rule (f) now takes its requirement from the same source it checks, so some cases are exempt with no finding.** Rule (f) requires exactly the `motion` records that match `^\d+(?:\.\d+)?ms$` and are not `delay: true`. Three cases therefore pass with no finding, and the token would not be zeroed under reduced motion. (1) Any motion duration marked `delay: true`: the marker has no limit, so `motion-base` with `delay: true` passes. (2) A motion duration written in seconds (`1s`), as `var()` or as `calc()`. (3) `motion-fast` or `motion-base` removed or regrouped. On main, rule (f) named `motion-fast` and `motion-base`, so (1) and (3) failed there. Decisions 29 (scoped to `ms`) and C1 (an unbounded marker) approve this design, so it does not block this round. Today values.test.ts:139-147 still pins fast, base and spin at `0s` under reduced motion, which protects the current tokens. The gate itself no longer does. | For the operator: whether rule (f) should also fail closed on (a) a `motion` record whose value is a CSS time in a unit other than `ms` or is not a literal, and (b) a `delay: true` record outside the agreed set (for example, only `tooltip-delay`, or only names ending in `-delay`). Either change needs a unit test and a fail plant. A triage record suffices if it is deferred. |
| R1-05 | note | CI run 44098238937, attempt 1, "Plants shard (23)" / "Plants" | Shard 23 failed in setup: `pnpm store path` printed nothing, then `actions/cache/restore` failed with "Input required and not supplied: path". No plant ran. The verdict then exited 2: "plants: could not run: shard 23 of 76 reported no result". That is the correct fail-closed result, because a missing shard report blocks the merge rather than passing it. The setup action and ci.yml are not in this diff (`git diff --name-only origin/main...HEAD` has no `.github/` path), so this looks like a runner flake, not a defect of 012. | The merge waits for attempt 2 (or a new run) to be green on all 145 jobs. Use that run for R1-01. If the empty `pnpm store path` happens again, open a triage item for `.github/actions/setup`. |
| R1-06 | note | gates/test/integration/visual.test.ts:26 (`timeout = 600_000`); gates/test/integration/axe.test.ts:14 | The implementer measured the repository visual integration test at 519 s against its 600 s limit, with 171 stories. Its time grows with every story, as the plant shards' does, so a few dozen more stories will reach the limit on the same machine. CI passed it on 497b05f. | Add this limit to the operator's plant-design triage record (decision 15), so both are handled by one design. |
| R1-07 | note | packages/elements/src/ocelle-tooltip.ts:404-455, 336; packages/elements/src/control.ts:104-117 | **Untested seam with mission 008.** An icon-only `ocelle-button` inside `ocelle-tooltip` is the obvious consumer composition, and nothing tests it (the tooltip README examples at README.md:323-324 use native `<button>`). Reading the code: (a) `describes` writes `aria-describedby` on the trigger host. `ocelle-button` moves that onto its inner control, which works. When `describes` ends, the tooltip calls `removeAttribute`, which FR-004 makes a no-op after the move. The button therefore keeps the stored id and its `data-ocelle-moved-aria-describedby` mirror, though the span it pointed at is gone. (b) The tooltip hides a shown bubble when `trigger.matches(":disabled")`. An `ocelle-button` host is not form-associated, so a disabled `ocelle-button` never matches `:disabled`. | Before the next element mission (or as a triage item): add a scenario or story of `ocelle-tooltip` around `ocelle-button`, covering `describes` on and off and a disabled trigger. Then decide whether the tooltip should clear its id with an empty value, which the move treats as a clear, and how it should detect a disabled Ocelle control. |
| R1-08 | note | 558c560 `packages/tokens/test/readme.test.ts:61-62` | The fix commit of C1 adds a README-fragment assertion together with the README sentence it checks, so that assertion was never seen red. The behaviour tests of C1 were red first in d4a56ea, which changes only `gates/test/brand-rules.test.ts` and `packages/tokens/test/generate.test.ts` (commit body: "2 failed, 51 passed", assertion errors). Only the documentation assertion skipped the red step. | None required. Next time, put documentation assertions in the red commit. |
| R1-09 | note | specs/012-button-action-row/plan.md decision 15; specs/012-button-action-row/reviews/phase-6/round-1.md:140 | The operator's triage record for "a plant design whose shard time does not grow with the story count" is due "when this feature lands". There is none under `triage/` yet. R1-01 and R1-06 make it more urgent: the repository is past both the size-3 split count of main (25) and the size-1 split count (76). | For the operator, at landing. |

Two blocking findings (R1-01, R1-02) and seven notes.

## What I checked and found sound

- **Operator decisions on the merges.**
  - **A1:** `emulate(page, "none")` no longer touches reduced motion (packages/elements/test/commands.ts:236-247). 012's expectation at scenarios/harness-scenarios.ts:351-365 now expects `reset: "rgb(8, 8, 8)"`. Every 012 `afterEach` that resets forced colours also calls `emulateReducedMotion("no-preference")`: button, action-row, control, harness/{ax,axe,events,interaction,navigation}. The main-owned tests without that call (`slot.test.ts`, `icon.test.ts`, the 011 and 013 suites) are untouched, as A1 requires. The one 012 scenario added to `scenarios/slot.ts` does not touch reduced motion.
  - **B1:** `clipboardCopy` and `dispatched` are used throughout driver-additions.ts, facts.ts and progress.ts. Typecheck is clean, so no old name remains.
  - **C2:** 008's `inputPress`, `inputHover` and `inputClick` (scenarios/driver.ts:412-419) are separate from 012's `press`, `click` and `hover` (:349-361). There are no `driver.press(`, `driver.hover(` or `driver.click(` calls left in 008's dialog, drawer, tooltip or harness scenarios.
  - **C3:** 008's suite stays at browser/harness.test.ts. 012's suite is at browser/harness-scenarios.test.ts and scenarios/harness-scenarios.ts, and the `elements-browser` include (`packages/elements/test/browser/**/*.test.ts`) picks it up.
  - **C1:** `tooltip-delay` carries `delay: true` (source.ts:280). Its value (500ms) and group (motion) are unchanged. The generator and rule (f) both skip it. 008's values test (`delay: "0.5s"` under reduce) and 012's (fast, base and spin at `0s`) both pass.
  - Decision 29's text (plan.md:256-283) says the same as the code.
- **Gates.**
  - **Exit codes 0/1/2:** rule (f) still reports a missing block, an extra declaration and a missing duration as findings (exit 1).
  - **New plant:** the `f-motion-spin-missing` plant (a wrapped generator) is picked up by directory. It is listed in plant-runner.test.ts:1133 and gates/README.md:36, and counted in plants-robustness (37).
  - **Registry:** no new gate, so gates.json, registry.ts, ci.yml and 001's ci-checks.md are correctly unchanged.
  - **Other plant updates:** the contrast plant `exempt-disabled-ink` has new figures for the chrome grounds. `fail-empty-index` has the two new story files, and `fail-token-changed` has 143 light story-themes.
  - **Pointer state:** `applyPointer` now settles before a press (story-page.ts:354-359), with a unit test.
- **Public surface.**
  - **Exports:** package.json gains `./ocelle-button.js` and `./ocelle-action-row.js`, and src/index.ts exports both classes, sorted.
  - **Manifest:** custom-elements.json matches the source (`manifest: 16 elements checked, no finding`). The manifest script keeps standard attributes that are declared with a description, which is how the moved ARIA attributes appear.
  - **Names:** events follow `ocelle-<element>-<action>` and are `bubbles`, `composed` and `cancelable`.
  - **Changelogs:** both packages' changelogs name the surface additions, including the seven new tokens and the raised engine floor.
- **Accessibility and security.**
  - **Semantics:** a native `<button type="button">` or `<a>`, with `delegatesFocus`.
  - **Disabled and unavailable:** disabled controls leave the tab order. An unavailable link is `role="link" tabindex="0" aria-disabled="true"` with no `href`.
  - **Link safety:** `javascript:` URLs are rejected by `URL` parsing, and `_blank` gets `rel="noopener"`.
  - **Forced colours:** system colours inside `@media (forced-colors: active)`.
  - **Reduced motion:** `animation: none` under reduced motion, and the spinner turns six times in 4.8 s, then stops.
  - **Unsafe code:** no `unsafeHTML`, `innerHTML`, `style=` or I/O in the new source (grep).
  - **CSP:** the `csp` gate passes.
- **Tests after the merges.** 497b05f only makes expectations stricter: it adds the computed `description` to expected AX nodes in action-row.ts, busy.ts and link.ts, and pins the union of 13 commands in vitest-config.test.ts. Nothing was loosened. The added `Stryker disable` comments (two `ObjectLiteral` on `label`, one process boundary in contrast.ts) each give a valid reason.

## Test quality

- **Red evidence per phase.** For each of phases 1 to 6, `reviews/phase-N/tdd-check.json` has `status: pass`. I checked every red commit in `red-commits` (970c5d0, c7ff7b9, ce332c3, f78609b, 18f2a43, e36a379, f56ec48, c9851db, 2e874ae, 126871c) with `git show --stat`. Each changes only test files, test fixtures and its phase's `reviews/` evidence. Phase 6 R1-02 records the scope of the US2-12 replacement (decision 32), which is stricter.
- **Landing red/green.** d4a56ea changes only the two test files and records assertion failures, not setup errors. 558c560 makes them pass (see R1-08 for the one documentation assertion).
- **Weakening across the merges.** None found. 8cd1f45 changed the expectation at harness.ts:351 because the operator ruled so (A1). 497b05f is stricter.
- **Mutation.** `pnpm run gate:mutation -- --base 84e8bf0` covers the landing source changes to gates/bin/brand-rules.ts, packages/tokens/src/generate.ts and source.ts: "43 mutants on the changed lines of 3 files, none survived; 0 timeouts, 19 compile errors, 0 zero-mutant entries; 0 equivalent records", exit 0. The 19 compile errors are mutants the `delay?: true` type rules out, such as `delay !== false`. I read them as a report, not a finding. The implementer reported 161 mutants on the changed token files on 497b05f with none surviving. Phases 1 to 6 recorded their own mutation runs.

## Checks run

On 04ae98e, locally:

| Command | Result |
|---------|--------|
| `pnpm run gate:typecheck` | exit 0, no type error |
| `pnpm run gate:lint` | exit 0, 402 files, no finding |
| `pnpm run gate:style-lint` | exit 0, 33 files, no finding |
| `pnpm run gate:test-lint` | exit 0, 291 files, no finding |
| `pnpm run gate:csp` | exit 0, 31 files, no finding |
| `pnpm run gate:prefix` | exit 0, 416 files, no finding |
| `pnpm run gate:pins` | exit 0, 5 manifests |
| `pnpm run gate:contrast` | exit 0, 207 pairs in light, 215 in dark (196 required per theme) |
| `pnpm run gate:brand-rules` | exit 0, 7 rules checked |
| `pnpm run gate:manifest` | exit 0, 16 elements, no finding |
| `pnpm run gate:config-copies` | exit 0 |
| `pnpm run gate:signoff -- --range origin/main..HEAD` | exit 0, 79 commits, no finding |
| `vitest run --project gates --project tokens` | 78 files, 2484 tests passed |
| `vitest run --project tokens-browser --project elements` (values, button, action-row, control, harness/*, tooltip, harness) | 11 files, 401 tests passed |
| `pnpm run gate:mutation -- --base 84e8bf0` | exit 0, 43 mutants, none survived |
| `pnpm run gate:plants -- --affected 84e8bf0 --list` | 98 of 310 plants selected (contrast, brand-rules including `f-motion-spin-missing`, manifest, storybook-build, visual, axe); listed only, not judged |

I did not repeat the full `pnpm test`, `storybook-build`, `visual`, `axe` or the 76 plant shards. On 497b05f the implementer reported 7042 tests passed, a 171-story build, 342 matching captures and 342 axe runs with 0 serious or critical results. CI run 44036606605 on 8cd1f45 was 145/145 green. Run 44098238937 on 497b05f was 143/145 on attempt 1 (R1-05), and attempt 2 is still running.

## Earlier findings

This is the first landing round. Every phase review ended `approved`. The one finding sent on to landing is phase 6 R1-01 (T067, a CI run at the full story count). It is unresolved and is now R1-01 above.

verdict: changes_requested
