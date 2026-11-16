---
scope: landing
phase: landing
round: 1
verdict: changes_requested
base: 3828d2fee8dccab6f5c2697f859e2af7247d3378
head: 4479617
tdd_check: pass
---

# Landing review, round 1 (PR #43, mission 013-data-display)

This is a fresh second opinion on the integrated diff `origin/main...HEAD` (`3828d2f...4479617`): 66 commits and 284
files. Most of them are evidence and the 80 new baselines. The code part is:
- the four elements (`packages/elements/src/ocelle-{facts,fact,empty-state,progress}.ts`), the root `index.ts` and
  `package.json` exports;
- the committed manifest and its eight manifest plant copies;
- `base.css`'s two rule changes;
- the `token-only` allowance (`gates/stylelint/token-only.ts`) and its seven style-lint plants;
- the storybook-build and visual plant updates;
- the gate tests' count bumps;
- the element test harness (driver, commands, scenarios, fixtures), `vitest.config.ts`'s `emulateReducedMotion`
  command;
- the stories, the stories layout CSS, the READMEs and the CHANGELOGs.

`origin/main` is `ce1d9c7` (op 015), one commit ahead of the merge base. `git merge-tree --write-tree origin/main HEAD`
is clean (tree `e345955`). Op 015 also edits `gates/README.md`, `gates/test/vitest-config.test.ts` and
`gates/test/ci-workflow.test.ts`, so I ran the `gates` project on a scratch merge of the two: it passes (below).

I used these as input:
- the phase reviews (phase 1 approved in round 2, phase 2 in round 1, phase 3 in round 2, phase 4 in round 1 with
  `tdd-check` exempt);
- the run summary `knowledge/speckit-flows/runs/013-data-display.md`;
- the operator decisions under `reviews/` (in particular phase 3's spike decision (a) on value-text exposure, and
  the fold decision);
- the CI result the orchestrator gave: every check passed on `4479617`, run 43742696075.

Settled, so not raised again here:
- the operator's decisions recorded in spec.md, plan.md and research.md decision blocks (IQ-01 to IQ-15, PLAN-FRESH-*,
  PLAN-A11Y-SECURITY-*, PLAN-CORRECTNESS-*);
- the phase 3 spike decision (a): the value text's wiring is proven through the visible part, not its exposure;
- phase 1 R1-03, the detached sheet's resource retention, as a judgement on that phase. L1-01 below adds a
  reproduction the phase review did not have, and that reproduction contradicts the record's stated reason.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L1-01 | blocking | packages/elements/src/ocelle-facts.ts:220-233 (the `BlockStatement` record on `disconnectedCallback`, and the `StringLiteral, CallExpression` record on `window.removeEventListener("resize", …)` at :232-233) | **Two equivalent-mutant records cover mutants that a test can observe, so they are not equivalent under R-08.** The reasons say the cleanup "has no observable effect" and that "a kept listener only re-runs the idempotent pass on a sheet out of the document". Phase 1 R1-03 accepted this as "DOM-unobservable", on the evidence that no test kills the mutant. A test can see it, though. Reproduction (a scratch Playwright script on the built `dist/browser/ocelle-elements.js` with `tokens.css`, Chromium 1243): put a sheet with one fact in a 200 px block, so its `<dl>` has class `stacked`, then remove the sheet, dispatch `resize` on `window` and wait two frames. With the shipped code the detached sheet's `<dl>` keeps `stacked`. With `window.removeEventListener` for `resize` made a no-op during the removal (exactly the `CallExpression` mutant, and the effect of the `""` `StringLiteral` and the empty-block mutants), the `<dl>` loses `stacked` (output: `{"keep":false,"before":"stacked","after":"stacked"} {"keep":true,"before":"stacked","after":""}`). The reason for the difference: `#measure()` on a detached host reads `NaN` for the inline size and 0 for the threshold, so it clears the class. Beyond the open shadow root, the kept listener is the one part of the cleanup that matters to a consumer. `window` keeps a reference to every removed sheet, and through it to the consumer's light-DOM content, for the life of the page, and it measures each of them on every window resize. An htmx page that swaps sheets keeps collecting them. research.md:206 makes the removal part of the design ("removed in `disconnectedCallback`"), but no test holds it, and the records stop every future mutation run from noticing if it goes. | (a) Recommended: add an in-process test (red against the mutant, for example shown by the mutation run on `ocelle-facts.ts` with no survivor on those lines) that a removed sheet does not re-decide its layout on a window resize, for example the reproduction above as a scenario body. Then delete the two records whose mutants it kills (the block record and the `removeEventListener` record). The other records inside the block (`super`, both observers' `disconnect()`, `cancelAnimationFrame`) can stay with their reasons. (b) If the operator prefers not to test it: correct both reasons to say what the mutant does (it keeps every removed sheet referenced from `window` and re-measured on each resize, observable only on the detached shadow root), and record the operator's acceptance in an operator round. |
| L1-02 | note | packages/elements/src/ocelle-facts.ts:199, 244, 248, 277, 309 | Phase 1 R1-02 still applies at HEAD. `// Stryker disable next-line ConditionalExpression` ignores every `ConditionalExpression` mutant on the line, not just the equivalent direction the reason names. Phase 1's stripped run showed that the other directions are killed today (for example `if (true) return` at :199, `if (false)` at :244 and :248, `if (true) continue` at :277, and on :309 the whole condition as `true` or `false`). But no committed run executes them, so they will not catch a later regression of the tests that kill them. At :309 the record can go entirely: `classes.toggle("cols-2", size < 2 * threshold)` behaves the same, because below the threshold `cols-1` is set too and its rule comes later, which is the record's own argument, so the `size >= threshold &&` operand and its record are redundant. | Optional: drop the redundant operand at :309 and its record. For the other lines, restructure them so the equivalent direction stands alone, where that is cheap. |
| L1-03 | note | gates/stylelint/token-only.ts:286 | The `StringLiteral` record in `iterationCountRaw` says "classify() reads the property only for font values and unitless numbers". Since this mission, `functionRaw()` (reached from `classify()` for a function node, which `iterationCountRaw` does pass on, for example `var(--x, 2)`) also reads the property for `grid-template-columns` and `transform` (:177-178). The conclusion still holds, because neither `""` nor `animation-iteration-count` is one of those names or a unitless or font property. The reason is incomplete. The two older records at :240 and :260 pass no function node, so they are unaffected. | Optional: add "and, for a function, the grid and transform allowances" to the reason. |
| L1-04 | note | packages/elements/src/ocelle-progress.ts:304, :322 | Two records are not strict equivalences, and their reasons say so. That is honest, but it is outside R-08's "equivalent mutant". :304 is "equivalent in effect": the mutant can delete a record opened by a bar inserted between two leave callbacks of one frame, and that bar re-joins at its next `animationstart` with the shared start moved by up to a frame. The bar does not re-join while it is hidden or under reduced motion, where no `animationstart` comes, so a later bar can open a fresh episode while it is still connected. That is a corner of a corner. :322 is "not observable", which stands on the operator's phase 3 spike decision (a). | None required; recorded for the operator. |
| L1-05 | note | storybook/baselines/elements-ocelle-facts--stacked.*.png, …--stacked-wide.*.png | Phase 1 R1-05 still holds: the two stories' baselines are byte-identical, so the visual gate cannot tell them apart. Behaviour is covered by US1-11's body. | None required. |

## Gate boundaries and the exit contract

- **`token-only` allowance (gates/stylelint/token-only.ts:133-178, 265-297).** It fails closed:
  - `gridTrack()` admits only `fit-content(<one percentage word>)` and `minmax(0, <one fr word>)` with a real `,`
    divider. Anything else is raw: a `var()`, a `calc()`, a nested function, a length, `auto`, a third argument,
    `repeat()`, `max()` or `/`.
  - It applies only for the lower-cased property `grid-template-columns` and outside `calc()`. `grid-template`,
    `grid-template-rows`, `grid-auto-columns`, `width` and `inline-size` keep it raw. A `var()` fallback of an
    allowed track passes, which is consistent with how fallbacks are classified everywhere else.
  - `percentageTranslate()` admits only `translateX(<one percentage word>)` in `transform`. `translateY`,
    `translate`, `translate3d`, two arguments, `calc()` and `var()` stay raw, and so does any other function beside
    the allowed one.
  - `iterationCountRaw()` admits one bare `^[1-9]\d*$` count per comma-separated item. A fraction, a sign, an
    exponent, a leading zero, two counts in an item and a quoted comma stay raw. A count inside a `var()` fallback
    is still raw, which is stricter than needed. `animation` shorthands stay raw. `infinite` was already an
    identifier before this mission, so the WCAG 2.2.2 bound rests on the element tests (US3-12), not on the lint.
  - The rule's exit contract and finding format are unchanged: no gate entry point or `gates/lib` file changed.
    `gate:style-lint` locally: `style-lint: 16 files checked, no finding`, exit 0.
  - The tests pair each finding with the allowed value it guards, plus a `4px` control. The two lint-level tests
    pin the line and the message. The seven plants (three pass, four fail) bite in CI (Plants verdict green).
- **Manifest plants.** The eight `gates/plants/manifest/*/tree/.../custom-elements.json` copies are the new
  committed manifest with each plant's one defect. The gate counts 6 elements in the repository and in
  `pass-repository`. The cost: every new element rewrites eight 480-line copies. That pattern was there before this
  mission.
- **storybook-build `fail-empty-index`.** The three new story files are replaced by default-export-only stubs, so the
  built index still holds no story. The plant would otherwise have passed once the new stories existed, so this keeps
  it biting.
- **visual `fail-token-changed`.** It expects 53 `differs` findings. There are 53 distinct locations, and the `why`
  sums to 53 (20 + 22 + 6 + 1 + 4). Phase 1 R1-07's missing separator is fixed.
- **Gate test count bumps** (42 → 122 story-themes, 21 → 61 stories, 2 → 6 elements). They match
  `storybook/baselines` (122 files, 61 light) and the manifest. No assertion was loosened: the only removed test
  lines in the diff are these counts and texts that the stricter replacements absorb, for example the browser build
  test, which now also requires the four new tags.
- **Overlap with existing gates.** No new gate. The allowance sits inside `style-lint` only. The contrast gate
  checks the progress pairs through `progress-pairs-check.ts` on the shipped stylesheet (build test). `axe` covers
  the 61 new story-themes in both themes, and its blindness to ElementInternals is recorded in research R-05 with its
  sunset.

## Public surface (design lens)

- **`ocelle-facts` / `ocelle-fact`.** The attributes, properties, slot, parts and three CSS properties match
  contracts/elements.md and the manifest. Every property is `| undefined` with `@default undefined` and writes no
  attribute when unset. `shadowRootOptions` is `@ignore`d. `ocelle-fact`'s `label` is reflected because the sheet
  reads the attribute: a property set reflects, then the sheet's `MutationObserver` re-renders, which is consistent.
  The `layout` doc names the shrink-to-fit caveat. Importing the container module defines the item element, as the
  amended convention says, and the build test asserts the import graph.
- **`ocelle-empty-state`.** It has five slots, part `body`, one property, no CSS property and no event. It adds no
  role, heading, landmark or tab stop. Presence follows rendered assigned nodes (`slotchange`, plus a
  `MutationObserver` on `hidden` and text). The README states that class-based hiding is not observed.
- **`ocelle-progress`.** The seven properties have their stated attribute names. Only `size` and `ground` are
  reflected, so a consumer's `value` and `max` markup is never rewritten. It has four parts and no slot. A host
  `aria-label` overrides the name from internals (Host ARIA rule).
- **`base.css`.** The pre-upgrade rule is `:where()` whole, (0,0,0), and a hidden fact keeps `display: none`. The
  density hooks set the two facts custom properties in the compact and regular regions on the same selectors as
  the existing scale. This couples `@ocelle/styles` to an element's hook names, and contracts/elements.md and both
  READMEs record that.
- **Exports and manifest.** `package.json` gains the four entry points, and `src/index.ts` re-exports the four
  classes (test `exports.test.ts`). The manifest declares exactly the contract's members for all six elements.
  `gate:manifest` locally: `manifest: 6 elements checked, no finding`.

## Accessibility and security

- The facts structure is one shadow `<dl>` with `<dt>` per pair and `<dd><slot>` assigned by manual slot
  assignment. No consumer content is copied, and no ID reference crosses the shadow root. The probes are
  `aria-hidden`.
- The progressbar is the host through ElementInternals: role, min 0, effective max, clamped now (none while
  indeterminate), the value text while determinate, and the name. The visible label and value text are
  `aria-hidden` duplicates.
- No tab stop is added anywhere: there is no `tabindex` in any template, and the progress body "no tab stop" presses
  Tab past it.
- Reduced motion sets `animation: none` on the mark (US3-5). The sweep is bounded at 21 × `--ocelle-motion-base`
  (4200 ms measured, US3-12). Forced colours give the track an outline in `CanvasText` and the fill `Highlight`.
- CSP: all styles are static `css` templates (adoptedStyleSheets), and the fill's inline size is written through
  the CSSOM (`style.setProperty`), which the strict CSP does not govern. No `innerHTML`, `unsafeHTML` or
  `unsafeCSS` appears in package source (grep). No network access. The content security gate is green.
- Engines: everything used is at or under the stated floor (`:dir()` Chromium 120 is the floor feature).

## Test quality

- **TDD check.** Phases 1 to 3 are `pass` (tdd-check.json on the folded SHAs, no problems). Phase 4 is `exempt`, and
  `tdd-exempt.md` is justified: CHANGELOG prose already asserted by the readme tests, plus review records.
  Red evidence was read per phase by the phase reviews (`red-phase.log`: assertion failures, no setup errors). I
  spot-checked the phase 1 account, which agrees.
- **Weakened tests.** Across `origin/main...HEAD` no test was deleted, skipped or loosened. The only removed
  assertion lines are count and text updates (above), and each replacement is equal or stricter.
- **Vacuity.** Each scenario body asserts one `toEqual` against a hand-written expectation, pairing every "does not"
  outcome with a positive control. The timing bodies of the sweep (US3-12, US3-14, US3-15 and the episode bodies)
  read `getAnimations()` and computed geometry, not internal state. `gate:test-lint` is green.
- **Equivalent-mutant records (26 added).** All are in the next-line form with a reason (R-08 step 5). By kind:
  - Sound: `token-only.ts:286` (reason incomplete, L1-03); `ocelle-fact.ts:83`; `ocelle-empty-state.ts:188, 202,
    204, 206, 224`; `ocelle-facts.ts:222, 224, 226, 229`, the `super`, the observers' `disconnect()` and
    `cancelAnimationFrame` (an interim state of a detached sheet, re-decided on reconnection, and no
    reference from outside the sheet's own subtree); `ocelle-facts.ts:238, 240, 252, 279`, and the equivalent
    directions of 198, 243, 247, 276, 308 (with L1-02 for the killed directions they also hide);
    `ocelle-progress.ts:51, 282`.
  - Not equivalent: `ocelle-facts.ts:220` and `:232` (L1-01, reproduced).
  - Near-equivalent or operator-authorised: `ocelle-progress.ts:304, 322` (L1-04).
- **Mutation.** CI's 36 mutation shards and the verdict passed on `4479617` with no survivor. I did not re-run it;
  L1-01 is about what the records exclude from every run, not a surviving mutant.

## Completeness baselines (step 2.7)

No new gate, check or CI job: `gates/gates.json`, `gates/lib/registry.ts`, `.github/workflows/ci.yml` and 001's
`contracts/ci-checks.md` are unchanged, and need no change. The seven new style-lint plants are discovered by
directory, as every plant is. They are listed in `gates/README.md`'s `style-lint` row, and two new
`gates-readme.test.ts` cases pin the row's text and the directories. The new test files all fall inside existing
Vitest projects:
- `packages/elements/test/*.test.ts` → `elements`;
- `test/node` → `elements-node`;
- `test/build` → `elements-build`;
- `test/browser` → `elements-browser`;
- `packages/styles/test/browser` → `styles-browser`;
- `storybook/test/integration` → `storybook-integration`.

The HTML fixtures and the helper modules (`progress-pairs-check.ts`, `scenarios/*.ts`, `layout-wait.ts`,
`animations.ts`) are imported by those tests. `emulateReducedMotion` is wired into the `elements` project's commands.

## Checks run

On HEAD `4479617` in this container (`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`):

| Check | Result |
|---|---|
| `git merge-tree --write-tree origin/main HEAD` | clean, tree `e345955` |
| `gate:style-lint` | `style-lint: 16 files checked, no finding`, exit 0 |
| `gate:manifest` | `manifest: 6 elements checked, no finding`, exit 0 |
| `vitest --project gates` on a scratch merge of HEAD and `origin/main` (worktree removed afterwards) | 65 files, 2275 tests passed (includes `gates-readme`, `vitest-config`, `ci-workflow`, `token-only`) |
| Scratch Playwright reproduction of L1-01 on `dist/browser/ocelle-elements.js` | as quoted in L1-01 |

Every other check is CI run 43742696075 on `4479617`, all green, as given. I did not repeat them.

## Earlier findings

This is the first landing round. The phase reviews' blocking findings (phase 1 R1-01, phase 3 R1-01) were resolved
in their round 2, per the run summary and those rounds. Phase 1 notes R1-02, R1-03 and R1-05 are carried here as
L1-02, L1-01 (with new evidence) and L1-05.
