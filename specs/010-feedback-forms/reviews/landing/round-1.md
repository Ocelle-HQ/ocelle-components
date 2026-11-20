---
scope: landing
phase: landing
round: 1
verdict: changes_requested
base: 23ba5c57a1db18ca7f935fefdce77d156e86e8f5
head: a860bbc
tdd_check: pass
---

# Landing review, round 1 (PR #49, mission 010-feedback-forms)

This is a fresh second opinion on the integrated diff `git diff origin/main...HEAD` (`23ba5c5...a860bbc`, 90 commits,
353 files). HEAD includes the merge commit `fe0feb8` (main at `23ba5c5` into branch head `86505f5`, merge base
`3828d2f`), recorded in `reviews/landing/merge.md`. Most of the files are evidence under `specs/` and the 60 new
baselines. The code part is:
- the package source: `src/live.ts`, `src/form-control.ts`, `src/ocelle-notice.ts`, `src/ocelle-form-input.ts`,
  `src/ocelle-form-select.ts`, `src/icon-svg.ts` (drawing moved out of `ocelle-icon.ts`), `src/define.ts`
  (`registering()`), `src/index.ts`, `package.json` exports;
- the manifest generator (`scripts/manifest.ts`: `fold`, `bases`, the extended standard-attribute list), the CLI config
  glob, the committed manifest and its eight plant copies;
- the token source (`color-ink` on the five state grounds) and `contrast/pairs.json` (+10 pairs);
- the gate tests' count bumps, the `visual/fail-token-changed` and `storybook-build/fail-empty-index` plant updates, a
  Stryker comment in `gates/bin/contrast.ts`;
- the element test harness (driver, in-process and browser harnesses, live-region capture, scenarios, fixtures,
  plants) and `vitest.config.ts` (`liveStart`, `liveStop`, `fileParallelism: false`, `optimizeDeps`);
- three story files and the README, CHANGELOG and triage record.

Input, not a substitute: the phase reviews (phase 1 approved in round 2, phase 2 in round 3, phase 3 in round 2,
phases 4 and 5 in round 1), every phase's `tdd-check.json` (`pass`), `red-commits`, `history-map.txt`, the operator
decisions under `reviews/`, and the CI run the orchestrator gave (43943138908 on `a860bbc`: all jobs green except
Sign-off).

Settled, so not raised again: operator decisions recorded in spec.md, plan.md, research.md and `reviews/**/decision-*.md`
(among them the shard-planner split out of 010, phase 3 `decision-split-shard-change.md`, and the shard-time known gap).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L1-01 | blocking | `packages/elements/src/ocelle-form-select.ts:160-162` (`initialValue()`), `:155-158` (`control()`), reached from `src/form-control.ts:408-414` (`resetValue()`) through `formResetCallback()` (:435) | **A form reset before the select's first render throws.** `control()` asserts a non-null `HTMLSelectElement` with the comment "the element asks for it only after a render", and `initialValue()` reads `this.control().options`. `formResetCallback()` does not wait for a render. If a host inserts the select into a form and resets the form in the same task, the shadow `<select>` does not exist yet, and `resetValue()` throws `TypeError: Cannot read properties of null (reading 'options')`. Reproduction: a scratch Playwright script on an esbuild bundle of `src/browser.ts` (Chromium 1243). Set `f.innerHTML = '<ocelle-form-select id="s" name="lane" label="Lane"><option value="a">A</option><option value="b" selected>B</option></ocelle-form-select>'`, call `f.reset()`, then await `updateComplete`. The output is `{"r":{"value":"b","data":[["lane","b"]]},"errors":["Cannot read properties of null (reading 'options')"]}`. The end state is right only because `resetValue()` clears `dirty` before the throw, and `firstUpdated()` then shows the default selection. But the element reports an uncaught error to `window` (and so to any error monitor). A native select never throws on reset, and FR-024 and the README make the element reset like one. Only the select is affected: `ocelle-form-input`'s `initialValue()` reads an attribute, and `restoreValue()` and `syncFormValue()` already guard on `hasUpdated`. | Test-first, as for any behaviour finding: first a scenario that resets the form in the insertion task and asserts no page error (red on the current code), then a guard. For example, `initialValue()` reads the default from the light-DOM options while not rendered, or `resetValue()` defers to the first update. Then fix the `control()` comment. |
| L1-02 | blocking | commit `832e36b` (`docs(plan): squad round 3 — 4 confirmed, 2 forks`) | **The Sign-off check is red on the head.** `git log --no-merges --format='%h %(trailers:key=Signed-off-by,valueonly)' 23ba5c5..HEAD` lists one commit without a `Signed-off-by` trailer: `832e36b`, author `Claude <noreply@anthropic.com>`. This matches CI: "signoff: 1 finding in 90 commits". Every other commit, including the merge `fe0feb8` and `a860bbc`, is signed off. This is a history defect, not a code defect, but it keeps a CI check red, and the constitution (§ Development Workflow and Quality Gates) names the DCO check. | Give `832e36b` a sign-off, for example in the landing history fold (step 8) with a fold base before it, or settle it by an operator decision. No code change. |
| L1-03 | note | `packages/elements/src/ocelle-notice.ts:343-344` | The equivalent-mutant reason on `super.disconnectedCallback()` says LitElement's method "only tells reactive controllers". LitElement's `disconnectedCallback` also calls `this.__childPart?.setConnected(false)` (`lit-element/development/lit-element.js:174-177`), which disconnects async directives. The mutant is still equivalent, because the notice's template uses no async directive. `form-control.ts:478` already gives the full reason. | Cheap: reword it as in form-control.ts. |
| L1-04 | note | `packages/elements/README.md:160-163`; spec.md Assumptions (first bullet) | The tone is shown only by hue: the same bar on every tone, in a different colour, on a ground of a different colour. In forced colours every tone looks the same. The spec's assumption puts the tone in the host's text ("Saved", "Run failed"), and WCAG 1.4.1 depends on that. But the README says only that "the ground is never the only mark of the tone", which a host can read as meaning colour is not the only carrier. | Cheap: one README sentence saying that the text must state the tone, because the bar and the ground differ only by colour and do not differ in forced colours. |
| L1-05 | note | `packages/elements/scripts/manifest.ts` (`bases`, `fold`, `standardAttributes`) | (a) `bases()` reads the internal superclass modules of the element modules one level deep. If an internal base extends another internal base, the second one's members are not folded in. Nothing in the tree does that today. (b) `role`, `hidden`, `form`, `aria-invalid`, `aria-required`, `aria-disabled` and `aria-description` are now dropped from every element's attribute list. An element that later declares one of them as a real attribute member would lose it from the manifest, and the gate's no-description check would not see it. Neither is a defect on this tree: the manifest gate passes with 9 elements, and the generator still fails closed, because a missing base file throws inside `generate()` and `gates/bin/manifest.ts:137-141` turns that into the gate's error exit. | Follow-up only, if wanted: read bases transitively, and drop a standard attribute only when it has no `fieldName`. |
| L1-06 | note | `reviews/landing/merge.md` § Resolution per file | `gates/test/integration/plants-robustness.test.ts` changed on both sides (the branch's contrast summaries 165/173/154, main's plant count 35 to 36). It auto-merged correctly to both, and HEAD has both. It is the one file of the 33 that both sides touched that the table does not name. | None; record completeness only. |

Two blocking findings: L1-01 and L1-02.

## Gate boundaries and the exit contract

- No gate's exit logic changed. In `gates/bin/` the diff has one change, a Stryker citation title in `contrast.ts:116`
  updated to the new test title (165/173/154). The gates whose inputs changed are contrast (pairs, token source),
  manifest (generator), visual, axe and storybook-build (stories and baselines), and plants (plant copies). Their
  0/1/2 contracts are untouched, and their tests pin the new counts with exact `toEqual` on code and output.
- The manifest generator is the one gate-side seam that changed (`fold`, `bases`). It is fail-closed: a base file that
  cannot be read throws, and the gate reports it as an error exit (above). A stale or reordered manifest is still
  caught: the eight manifest plants were regenerated and are judged in CI (`fail-lost-attribute`,
  `fail-undescribed-*`, `pass-reordered`). I checked that every module of the committed manifest equals, object for
  object, the same module of either the branch's (`86505f5`) or main's (`23ba5c5`) committed manifest, as merge.md says.
- Overlap with existing gates: no new gate, check or plant kind. The ten new contrast pairs go through the existing
  contrast gate, and `contrast-required.test.ts` pins the five ink-on-state-ground triples per theme from the source,
  so a dropped ground fails. The story-build plant gains three empty story files in the tree it replaces, as it did
  for each earlier story file. Registry completeness is unchanged.

## Public surface (design lens)

- **`ocelle-notice`**: `tone`, `size`, `announce` (reflected; an unknown value is kept in the attribute, and the
  property reads the default); slots `heading` and default; parts `heading` and `body`; no event. Announcing goes
  through a separate atomic live region. The host's node is kept from being a second live region by
  `internals.ariaLive = "off"`, and a host `alert` takes the alert path (no copy). The announced text is computed
  without `innerHTML` (text nodes, icon `label`, `img` `alt`; `hidden`, `aria-hidden`, `script`, `style` and
  `template` skipped), and the copy is written as `textContent`.
- **`FormControl` base** (internal, not exported): form association through `ElementInternals` (value, validity
  anchored on the native control, reset, restore, fieldset disabling, external labels). The name is built in a
  `hidden` span referenced by `aria-labelledby`, and the description chain is description, host `aria-description`,
  error. Every ID reference stays inside one shadow root with `delegatesFocus`. Its members reach the manifest through
  the fold, and `index.ts` does not export it.
- **`ocelle-form-input`**: `type` (unknown reads `text`), the FR-029 pass-throughs, `value` attribute as the default
  value, `ocelle-form-input-change` (`bubbles`, `composed`, `{ value }`). Enter is handled by the element
  (`preventDefault`, commit, then HTML's implicit-submission rule: the first submit button of the form owner in tree
  order across `form=`-associated controls, else `requestSubmit()` with exactly one blocking field). `isComposing` is
  respected. A disabled default button makes `click()` a no-op, as natively.
- **`ocelle-form-select`**: options mirrored from light-DOM `<option>`/`<optgroup>` by `cloneNode` with ids removed;
  `ocelle-form-select-change`; chevron from `icon-svg.ts`, `aria-hidden`, `pointer-events: none`. L1-01 is the one
  defect I found on this surface.
- **`live.ts`**: internal. The test-only `setAnnouncerTimingForTests` is not reachable through `package.json`
  `exports`, and `test/node/timing-setter.test.ts` pins its one caller. **`define.ts`** `registering()` is pinned by
  `define.test.ts` (false before, true inside the upgrade's constructor, false after and in a later constructor).
- **Exports, manifest, CSS parts, events**: the root exports nine classes plus `FormInputType`, `IconName`,
  `NoticeSize` and `NoticeTone`, in code-point order (`exports.test.ts`). `package.json` adds three entry points, and
  each has an entry test that defines only its own tag.

## Accessibility and security

- The error state is not shown by colour alone (`border-width: var(--ocelle-bar-width)` outside the forced-colours
  query). The focus ring uses `Highlight` in forced colours. The live regions are visually hidden but not
  `display: none`. The notice sets no `tabindex` and traps no focus. Axe on CI: 182 story-theme runs, 0 serious or
  critical. Tone and colour: L1-04.
- Security: no `innerHTML`, `unsafeHTML` or inline style in package code. Lit text bindings only, and the CSP gate is
  green. Mirroring the options clones nodes the host already put in its own light DOM, so it adds no capability.

## Test quality

- **Red evidence**: every SHA in `phase-{1..5}/red-commits` (9 in all) is an ancestor of HEAD and changes only tests,
  fixtures, plants or `specs/` (`git show --name-only` on each). Every `tdd-check.json` is `pass`, with base exit 1 or
  2 and scaffold exit 1 or 2 where a scaffold exists, and head exit 0. The base exit 2 values (phases 2 to 4) are the
  missing modules, which the phase reviews read. `history-map.txt` maps the folded SHAs, and the remapped
  `red-commits` point at the folded commits.
- **Weakened tests**: the changes to existing tests are count bumps to the new exact figures (contrast 165/173/154 and
  308/338, visual and axe 182/184, storybook-build 91, manifest 9). Each is still an exact equality, and none is
  loosened. `define.test.ts` gains a test and loses none.
- **Equivalent-mutant records**: the 18 new `Stryker disable next-line` records in `src/` each name one mutator and
  give a reason. I checked them against the code and Lit's source, and they hold. The one inaccurate reason is L1-03,
  and its conclusion still holds. This is the kind of check 007 R-08 asks for. The mutation job and its 63 shards are
  green on `a860bbc`.

## Merge resolution (`fe0feb8`, merge.md)

- Merge base of `86505f5` and `23ba5c5` is `3828d2f`, as recorded. Every file only one side changed equals that side
  at HEAD (scripted check over `git diff --name-only 3828d2f` of each side: no difference). 33 files changed on both
  sides. merge.md covers all of them but one (L1-06).
- **`Driver.property`**: the interface (`scenarios/driver.ts:280-284`), the in-process harness (`in-process.ts:453-456`,
  `plain()` at :257) and the browser harness (`browser/driver.ts:334-340`) all implement the same merged rule: string,
  number or boolean as it is, `undefined` as `undefined`, anything else as `null`. Main's two readers pin `undefined`
  for an unset property (`driver-additions.ts:378-383`, `progress.ts:666-670`). The branch's readers of absent
  pass-throughs use `typeOf` (`form-input.ts:886-887`), and its driver tests pin only strings, booleans and numbers
  (`driver.test.ts:306`, `browser/driver.test.ts:191`). No test of either side relies on an object or on `null` from
  an unset property, so the merged rule is consistent with both. The unit-tests job passes them on CI.
- **Pinned counts**: 182 baselines outside the plants (`git ls-files '*.png'`), 91 story exports in
  `storybook/stories/*.stories.ts`, 9 element modules `src/ocelle-*.ts`, and 83 distinct findings in
  `visual/fail-token-changed/plant.json`, its `why` saying "eighty-three". These match `axe.test.ts:52-68` (182, 184
  with the plant), `visual.test.ts:116-244` (182), `storybook-build.test.ts:55` (91), `manifest.test.ts:19` and
  `gates/test/manifest.test.ts:86,91` (9), and `plant-repo.test.ts:225` (182). The Visual regression, Plants,
  Accessibility and Storybook build jobs are green on the merged head.
