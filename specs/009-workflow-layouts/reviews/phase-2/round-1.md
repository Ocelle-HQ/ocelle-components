---
phase: 2
round: 1
verdict: changes_requested
base: 247991d7f2fdd7163d768f771279d17014d9c0b3
head: 333139e
tdd_check: pass
---

# Phase 2 review, round 1

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | `specs/009-workflow-layouts/contracts/overflow-region.md:107`, `:120`, `:143-146`, `:160`; `specs/009-workflow-layouts/tasks.md:202`; `packages/elements/src/overflow-region.ts:65`, `:126`, `:364`, `:385` | The module departs from its contract in three places, and no record of the feature says so. T023 says "exactly as contracts/overflow-region.md defines it", and the contract says that changing this interface changes every element that uses it: the board in phase 3, and `ocelle-code-block` (#13) after it. (1) `clearanceScroll` takes `{ ring, box, fade, direction }`. The contract (`:160`) and T012 (`tasks.md:202`) give `{ ring, box, fade, fadeStart, fadeEnd, direction }`. (2) `slotchange` is heard on the box (`overflow-region.ts:364`), not "on every slot inside the track" (`:120`). (3) `.region-box` has `border: 0` (`overflow-region.ts:126`). The stylesheet table does not list it, and the mask figures still say "less the block borders" (`:107`), which the code no longer subtracts (`:385`). It also relies on this in the clearance, where it takes the box's border-box left as its client-area left (`:458-459`). On substance, each departure agrees with the spec and plan (see the assessment below), so none needs to be reverted. But the contract is the source a phase 3 or #13 implementer builds against, and it now describes a different signature, a different listener and a different measuring rule. | Make the contract match the code: § Pure functions (the signature, and that the sides which still fade are worked out from the new position, as R-06 says), § Lifecycle `hostUpdated` (the `slotchange` heard on the box, as it bubbles from any slot in the track), § Stylesheet `.region-box` (`border: 0`), and § Effects, Mask figures (no block border to subtract, because the module's stylesheet sets none). Make the same change to T012's signature in tasks.md. If changing a contract needs the operator's approval in this workflow, record the departures as a stop-and-ask item instead. |
| R1-02 | note | `packages/elements/src/overflow-region.ts:344-353` vs `contracts/overflow-region.md:121` | `hostDisconnected` takes off the host's three listeners and disconnects the observer. The box's `scroll` and `slotchange` listeners and the frame's `focusout` listener stay on. Re-adding the same function references is a no-op, and a disconnected box gets no user scroll, so nothing observable changes. The contract's "removes its listeners" is still broader than what the code does. The same goes for `a363d50`, a "fix" commit marked wholly equivalent with no red test: acceptable only because it is not a behaviour change. | Optional: name the scope in the contract when R1-01 is fixed. |
| R1-03 | note | `packages/elements/src/overflow-region.ts:363-364`, `:487-491` | The `slotchange` listener is recorded as an equivalent mutant, because a slot change that changes the content's width also resizes the track. That holds for the scroller, whose track is `max-content`. Contracts § Lifecycle notes that the board's track does not follow its content. When phase 3 reuses the module, the equivalence must be checked again there: a board whose lanes are contained may need `slotchange` to be load-bearing. | Re-check the equivalent record in phase 3. |
| R1-04 | note | `packages/elements/test/browser/scrollbar.test.ts:140-142` | The mask-size case now asserts only the fade layer's figure before the content overflows (`100% <client>px`), not the opaque layer's `0px`. That figure can no longer be read: with no `data-fade` the box has one mask layer (`none`), and the computed `mask-size` lists one size per layer. Nothing is masked at rest, so the lost figure paints nothing. The assertion after overflow, both layers and the measured thickness, is unchanged, and plant B1 bites on it. The reason is recorded in the test. I do not count this as a weakening. | None. |
| R1-05 | note | `packages/elements/src/overflow-region.ts:440`, `:453` (mutation report) | 130 mutants are compile errors, among them the modifier check and the `:focus-visible` guard (`ConditionalExpression → false` breaks TypeScript's narrowing). Stryker does not exercise those guards. They are covered by plants S6, S12 and S16 (`plants.md`), which were run and bite. | None. |

### The implementer's three departures, judged against spec and plan

1. **`clearanceScroll({ ring, box, fade, direction })`.** research.md R-06 says the module "scrolls by the smallest
   amount that leaves the ring box at least the fade depth from each inline edge that would *then* still fade", and
   T012's first case says the same ("each edge that still fades"). Which edges fade depends on the new position, so it
   cannot be passed in as the current `fadeStart`/`fadeEnd`. The helper works it out from `range` and the position
   (`overflow-region.ts:71-75`). This is more faithful to R-06 than the contract's signature. The signature was already
   this way in the scaffold (`624461c`) and in the red test (`ec2e003`, `overflow-region.test.ts` describe
   "clearanceScroll({ ring, box, fade, direction })"), so it was not changed after red. Accepted on substance. The
   unrecorded contract difference is R1-01.
2. **`slotchange` heard on the box.** `slotchange` bubbles (it is not composed), so a listener on the box hears it from
   every slot in the track, including slots rendered after `#follow`. That covers at least what research.md R-03
   ("`slotchange` on the default slot") and the contract ask for. Accepted on substance; see R1-01 and R1-03.
3. **`.region-box { border: 0 }`.** A `div` has no border by default, so nothing paints differently. Because the
   module's sheet comes after the host's own styles, it also keeps the "less the block borders" term of R-05 at 0.
   That is what lets `#measure` and the clearance use `offsetHeight − clientHeight` and the border-box left directly.
   It agrees with R-05 and data-model.md (`maskFigures`). Accepted on substance; see R1-01.

### `46c5742` ("nothing paints differently")

The claim holds:

- **Ring overlay.** At rest it was transparent with no outline, so it painted nothing. It is now `display: none`. When
  it shows a ring it is `display: block` with the same insets (`inset-block-start: 0` plus `inset-block-end: 0` is the
  old `inset-block: 0`) and the same outline.
- **Edge elements.** Outside forced colours they paint nothing in either version (no background, no border), so a
  block size of 0 changes no pixel. In forced colours, `block-size: 100%` from `inset-block-start: 0` gives the same
  box as `inset-block: 0` in the `position: relative` frame, which has no padding of its own.
- **Inline size.** The edge elements keep their inline size, so the fade-depth measure (`overflow-region.ts:463`) is
  unchanged, and the contract's "always laid out" still holds.
- **Evidence.** Rest-state pixels: `gate:visual` matches all 54 captures, rerun here. Focus-ring pixels: US1-4, US1-7
  and US1-9. Forced-colours edge box: US1-8. Plants S4, S5 and S9 were rerun on the new ring rule.

## Test quality

**Red evidence.** `red-phase.log` (`ec2e003`, exit 1) fails for missing behaviour:

- the scaffold's "not implemented" stubs and the unregistered `ocelle-scroller`;
- the README statements;
- the gradient rows of `token-only`;
- the manifest and stories counts.

There are no syntax or import errors. `check-final-tests-on-scaffold.log` (191 failures) fails on the absent
`.region-box`, the stub helpers and the state assertions. `check-final-tests-on-base.log` exits 2. Four of the
scaffold failures are `commands.emulateReducedMotion is not a function`, a command added to `vitest.config.ts` in
green; the rest of those scenarios fail for the missing behaviour as well. The scaffold (`624461c`) adds signatures
only, with no test file. `tdd-check.json`: `pass`.

**Tests changed after the red commit** (`git diff ec2e003..HEAD`). None is weakened:

- **The hidden link without `.item`** (`scenarios/scroller.ts:286-287`). `.item { display: inline-block }` beat the
  user-agent `[hidden]` rule, so the "hidden" link had a box and was rightly focusable, and the red fixture contradicted
  its own intent. Without the class the link is `display: none` and boxless, which is the case R-07 says to skip. The
  expectation (handover to `k`) is unchanged, and the reason is in the comment.
- **Forced-colours `Highlight` composited over `Canvas`** (`scenarios/scroller.ts:163-173`, `:298`, `:566`).
  Chromium's emulated light palette gives `Highlight` as `rgba(5, 0, 73, 0.8)`. Taking the RGB alone named a colour
  that is never painted. The expected pixel is now the exact composite over `Canvas`, which is everything under the
  ring in forced colours. This is an exact, correct oracle, not a looser one.
- **The script list in the scrollbar test** (`scrollbar.test.ts:45-46`). `fixtures/scroller.html` has loaded both
  `ocelle-elements.js` and `ocelle-test-controls.js` since the red commit, and is unchanged since. The default
  allowlist named only the first, so the page's own script would have counted as an outside request.
  `browser/scroller.test.ts` already passed this exact list at red. The check stays an exact allowlist.
- **`mask-size` with one size per layer.** R1-04, not a weakening.
- **`frameRecord` observing the border box** (`scenarios/driver.ts:96-99`, `in-process.ts:293`,
  `browser/driver.ts:335`). The driver was stubbed ("not implemented") at red, so this is its first implementation,
  not a change to an assertion. A border-box observer also sees the scrollbar that appears, which a content-box one
  would not, so the scrollbar case is reachable at all. It still runs after the module's border-box observer in the
  same delivery, as US1-3 requires.
- **The pinned counts.** In `gates/test/manifest.test.ts:86`, `:91` and `gates/test/integration/manifest.test.ts:19`,
  2 → 3 elements: `ocelle-scroller` was added. In `gates/test/integration/axe.test.ts:68`, 44 → 56 story-theme runs:
  the six scroller stories in two themes. These are exact counts that follow the new surface. They are not red tests
  of this phase, and the finding lines they pin are unchanged.
- **Tests added after green.** These are guards, not replacements, and each has its plant or surviving mutants:
  `scrollerGuards`, `scroller-lifecycle.test.ts`, the twelve `clearanceScroll` bounds, the unitless-number gradient row
  and `driver.focus`.

**Vacuity.** No `skip`, `only`, `todo` or conditional `expect` in the changed tests. The one `catch`
(`scenarios/scroller.ts`, `driver.reducedMotion(false).catch(...)`) is cleanup, not the assertion. Every scenario
compares an observed record with an exact expected value.

**Coverage.** US1 scenarios 1 to 16, the 20 px root case and the sheets case each have a scenario. The pairing plants
G1, D1 to D3, S1 to S17, L1, L2 and B1 (`plants.md`) were all run and all bite. Every keyboard path of FR-006 has a
test: unmodified, modified, at the extent, Home/End, and from a slotted link.

**Mutation.** `pnpm run gate:mutation -- --base 247991d`, rerun here: 438 mutants on the changed lines of 4 files,
none survived. The run also reported 0 timeouts, 130 compile errors, 1 zero-mutant entry (`src/index.ts`) and 23
equivalent records. I read each equivalent record and its reason in the source and accept them. The `slotchange`
record is to be checked again in phase 3 (R1-03).

## Checks run

On `333139e`, with `OCELLE_VISUAL_ENGINE=docker`. All pass:

| Check | Result |
|---|---|
| `gate:typecheck` | no type error |
| `gate:lint` | 281 files, no finding |
| `gate:test-lint` | 189 files, no finding |
| `gate:style-lint` | 14 files, no finding |
| `gate:csp` | 12 files, no finding |
| `gate:prefix` | 222 files, no finding |
| `gate:manifest` | 3 elements, no finding |
| `gate:config-copies` | pass |
| `gate:pins` | pass |
| `gate:contrast` | 160 / 168 pairs |
| `gate:brand-rules` | 7 rules |
| `gate:signoff -- --range 247991d..HEAD` | 21 commits, no finding |
| `pnpm test` | 3351 tests passed in 149 files, including the `elements-browser` scrollbar and scroller fixtures |
| `gate:storybook-build` | 27 stories |
| `gate:visual` | 54 captures match |
| `gate:axe` | 54 story-theme runs, 0 serious or critical, 10 pre-existing excepted notes |
| `gate:mutation -- --base 247991d` | as above |
| `gate:plants` | incomplete: stopped by this session's 60-minute limit after 271 of the 306 plants, with no plant judged other than expected up to then. The rest rests on the implementer's full run (306 as expected, `stop-and-ask.md`) |

Out of scope, by operator decision B2: CI confirmation of the docker baselines (T028), and baselines produced under
docker rather than podman.

**Tasks.** T010 to T030 are all ticked, and each one's work is present. The tasks.md diff only ticks boxes. T030's
stop-and-ask was raised (`stop-and-ask.md`) and answered by the operator (P1). B1 was run as written and recorded.
Nothing outside the phase was changed without a reason.

**Constitution.**

- **I.** `ocelle-` name, no I/O, no event.
- **II.** Tokens only; the gradients pass the amended `token-only` rule.
- **III.** No ID reference across the shadow root; FR-006 keyboard model; ring overlay; forced colours.
- **IV.** One per-instance constructed sheet, written through `CSSStyleRule.style`; no `style` attribute; the
  US1-15 and sheets scenarios.
- **V.** Six stories, with baselines in light and dark.
- **VIII.** As above.

All are met.

## Earlier findings

None: this is round 1.
