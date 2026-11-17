---
review: landing
round: 1
pr: 44
verdict: changes_requested
base: 3828d2fee8dccab6f5c2697f859e2af7247d3378
main: ce1d9c72b7f9e028565e61684465cf8df448ac1d
head: 63002ae52b7d3116517384dea4c5618d6bdc1aaf
tdd_check: pass
reviewer: reviewer-renata
---

# Landing review, round 1 (011-layout-headers, PR #44, closes #8)

Scope: the integrated diff `git diff origin/main...HEAD` (merge base 3828d2f, 300 files). I read all new package source,
the gate and test changes, the README, both CHANGELOGs, the stories and the evidence of phases 1 to 5. Inputs were the
spec, plan, research, contracts, tasks, the phase reviews and operator decisions 1 to 10. Decision 10 (the red Sign-off
check on 3a7bc81) is accepted and is not raised here.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L1-01 | blocking | packages/elements/src/ocelle-card.ts:105-107; packages/elements/src/card-context.ts:35-39; spec FR-017; README.md:229-231 | **Wrong slot in the card's `slotchange` handler.** `#headerChanged` passes `event.target` to `notifyHeaders`. `slotchange` bubbles, so it can reach the card's `header` slot with a different target: a slot that a wrapper's shadow root forwards into the card's `header` slot (`<slot name="extra" slot="header">`). When that forwarded slot's assignment changes, `notifyHeaders` reads the wrapper's slot. It then replaces `#headers` with the headers assigned there and drops the section headers assigned directly to the card's own `header` slot. Later, one of those headers leaves the slot without being reconnected (its `slot` attribute removed, so it moves into the card's body). It is in neither `current` nor `previous`, gets no `requestUpdate()`, and stays compact in the body. FR-017 and the README say a header "in its body" is drawn at its own size. **Reproduction** (Chromium 1243, the built `dist/browser/ocelle-elements.js`): an `x-wrap` whose shadow root holds `<ocelle-card density="compact"><slot name="extra" slot="header"></slot></ocelle-card>`. A light-DOM `ocelle-section-header slot="header"` is appended to that card. Then a `span slot="extra"` is appended to `x-wrap`, and then `slot` is removed from the header. Result: listener targets `["other slot","card slot"]`; the header's `.row` class is `row compact` before and **`row compact` after** it left the slot. Without the forwarded-slot step, the same sequence ends at `row`, which is correct. Only the `slotchange` path is affected: the `density` path in `updated()` already queries the card's own slot. | Test first under the story-fix procedure (phase 2, `red.sh 2 fix-<M>`). Add a card scenario with a forwarded slot in the `header` slot and the move above, failing on the header's size. Then use the card's own slot in `#headerChanged` (`event.currentTarget`, or the `slot[name="header"]` that `updated()` already queries). |
| L1-02 | note | packages/elements/src/ocelle-context-sidebar.ts:131-137, ocelle-personal-rail.ts:146-152; dist/ocelle-context-sidebar.d.ts; research.md R-11 ("marked `@internal` (and `@ignore`)") | **`internalsKey` as surface.** The manifest omits the field, and the manifest tests assert that (test/node/manifest.test.ts:352-381). But `@internal` acts only on the analyzer. `tsconfig.base.json` has no `stripInternal`, so both public classes declare `readonly [internalsKey]: ElementInternals` in their `.d.ts`, and that declaration imports the symbol from `./naming.ts`. The exports map does not expose that module. At run time, `Object.getOwnPropertySymbols(host)` gives any page script the element's internals, so it can rewrite the role and name. That is not a security boundary, because page scripts already own the DOM, but it is reachable surface beyond the manifest. R-11 says the field carries `@ignore` too; the code has `@internal` only. The manifest result is the same either way. | None required. Either add `@ignore`, as R-11 states, or correct R-11. Consider a CHANGELOG or README line saying the symbol-keyed internals are not public API and may change without a major version. |
| L1-03 | note | packages/elements/src/ocelle-context-sidebar.ts:94-100; README.md:368-370 | **`!important` section rules.** Every element in the default slot that is not `[hidden]` gets `display: block !important`, padding, margins and a divider. Two effects reach beyond page resets. (a) A page cannot hide a section with a class: `.gone { display: none !important }` still drew a 51 px block with a 1 px divider. (b) A `<template>` child, which Alpine.js `x-if`/`x-for` hosts put in light DOM, is drawn as an empty 33 px section with a divider. Both are measured with the built browser module in Chromium. (a) matches the README's statement that a page cannot change a section's display. (b) is not covered by any statement. | Follow-up, offered to the operator: exclude `template` (and `script` or `style`) from the section selectors, or say in the README that such children must not be in the default slot. |
| L1-04 | note | packages/elements/src/slot-state.ts:28 | **Forwarded slots count as content.** Emptiness reads `assignedNodes()` without flattening, so a forwarded `<slot>` element counts as content even when nothing is assigned to it. A shell such as #12 that forwards an empty `actions` or `footer` slot into these elements gets the wrapper, gap or divider. This follows the README's definition ("no element is assigned"), so it is not a defect. | Consider one README sentence for shell authors: forward a slot only when it has content. |
| L1-05 | note | packages/elements/README.md:440, 444-448 | **Unshipped element in consumer docs.** The rail section tells consumers to "use `ocelle-nav-item` elements", an element no release of this package ships yet. It also addresses "For #12:" by issue number. FR-027 asks for the nav-item wording, and the README already cites issue numbers (#7, #12, #13). No planning ID (FR-, T0, R1-, SC-, US, R-NN, PLAN-, SPEC-) appears in either README or either CHANGELOG. | Optional: add "(once released)" after `ocelle-nav-item`. Also mend the stray line break at line 445. |

## Design lens on the public surface

- Attributes and properties: `size`/`variant` (section header), `density`/`inset` (card), `size` (page header), `label`
  (sidebar), `label`/`orientation` (rail). All are reflected or not as the spec says, have no initial value, and treat
  invalid values as the default without rewriting them. The manifest describes each one; the manifest gate passed in
  CI with 7 elements.
- Slots have plain names (`heading`, `eyebrow`, `description`, `actions`, `header`, `head`, `footer`, `bottom`, default).
  No events, parts or CSS custom properties, which matches Principle I and the README.
- Entry points: the five new `./ocelle-*.js` exports match the files, pack.test.ts and the README table. The root and
  the browser build define all seven elements, and `exports.test.ts` pins the root's exports to the seven classes.
  `card-context`, `slot-state` and `internalsKey` are not exported.
- Tokens: four eyebrow tokens (three aliases and `tracking-eyebrow`). `color-eyebrow` has text contrast entries on
  the nine main grounds in both themes (pairs.json 169/177, 158 required). The contrast plant was extended to the alias,
  so it still fails for the right reason.
- The card-context channel uses no public hook (local names and `requestUpdate()`), so two copies of the package
  still agree. Its one defect is L1-01.

## Accessibility and security

- Landmarks: the sidebar and rail hosts carry `navigation` through `ElementInternals`, set in `updated()`. The name
  comes from the trimmed `label`, and a host `aria-label` wins natively; the element never writes it. There is no
  inner `<nav>` and no second landmark. The page header uses plain `div`s, so there is no banner. The card has no role.
  The phase 4 and 5 role probes are recorded, and CI's axe gate passed on 114 story-themes.
- Forced colours: every colour or ground rule sits inside `@media not (forced-colors: active)`. Dividers and rules are
  borders, so the system colours draw them. Layout variants stay outside the query, as the README's updated convention
  says.
- Focus: none of the elements adds a tab stop or a focusable part, and the rail's orientation change keeps the template.
- CSP: Lit adopted stylesheets only, no inline style or script, and no network or storage. Story markup has no `style`
  attribute and stories-layout.css uses `data-story` selectors. The content-security gate passed in CI.
- The personal rail uses the chrome tokens in both themes (Principle II) and `--ocelle-radius-row` for the card.

## Gates: correctness, exit contract, overlap

No gate logic changed. `gates/bin/contrast.ts` changes only the test name in its process-boundary record. The other
gate-side changes are count updates in the gate tests (pair counts, story-theme counts 42 to 114, manifest 2 to 7
elements, 21 to 57 built stories). They also include the manifest plant trees' copies of the new manifest, the
storybook-build `fail-empty-index` plant gaining one empty story file per new story file, the contrast plant's alias
rows and the visual plant's token delta. Each fail plant still fails for its stated reason: CI ran all 28 plant shards
and plants green. The exit 0/1/2 contract is untouched. No new gate was added, so the registry and ci.yml need nothing.
The three new browser commands in vitest.config.ts (`scrollWidth`, `activeElement`, `textBoxes`) are test readers that
follow the existing `axTree`/`emulateForcedColors` pattern, not gates.

## Test quality

- Red/green: `tdd-check.json` is `pass` for every phase. Phase 1 has `pass` since d2de40a re-ran it with the container
  engine, which ends the operator acceptance of its round 1. Each phase red commit and the phase 2 `fix-1`/`fix-2` red
  commits exited 1. The final tests fail on base and scaffold for each phase.
- No `skip`, `only`, `todo`, snapshot-only assertion or conditional assertion in the changed tests. The one `.catch` in
  `storybook/test/integration/elements-stories.test.ts:82` is the existing bounded wait, followed by assertions that fail
  when the story did not render.
- The changed gate tests only update counts to the new repository; none is loosened, and each still asserts the full
  summary line.
- Equivalent-mutant records under R-08 (five added), each read:
  - `ocelle-context-sidebar.ts`, `ocelle-personal-rail.ts` `label: { type: String }` to `{}`: equivalent. Lit's defaults
    are attribute `label`, the default converter, not reflected.
  - `ocelle-section-header.ts` `#compact = false`: equivalent, because `willUpdate` writes it before every render.
  - `slot-state.ts` `childList: true`: equivalent. Adding or removing a host child changes some slot's assigned nodes
    and fires `slotchange`. Only the slots in the render root are read, so the extra child-list read changes nothing.
  - `contrast.ts`: an existing process-boundary record (kind 1) whose named test was renamed with the new counts.
- Mutation: CI ran all 30 shards and `Mutation testing` green at 416ba40, and the code is unchanged since. I did not
  re-run it. L1-01's line survives no mutant today because no test covers the forwarded-slot path. That gap is a
  coverage gap in the scenarios, not a weak test.

## Checks run

- `git merge-tree --write-tree origin/main HEAD`: clean, as stated in the brief. Not re-run.
- Chromium probes against `packages/elements/dist/browser/ocelle-elements.js` (playwright 1.64.1, chromium-1243):
  the L1-01 reproduction, with a control run without the forwarded-slot step, and the L1-03 measurements. The probe
  scripts are scratch files and are not committed.
- No gate re-run: CI run 43764641711 at 416ba40 passed every check except Sign-off (decision 10). The two later commits
  (d2de40a, 63002ae) touch only evidence and records.

## Earlier findings

This is the first landing round. The phase reviews' notes left open (phase 4 R1-01 to R1-05, phase 5 R1-01 and R1-02)
were read. None of them blocks landing. Phase 4 R1-04, the README's flex-container wording, is resolved by operator
decisions 6 and 7 and the README text at lines 372-379.
