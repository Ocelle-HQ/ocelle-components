# Phase 6 plants (T100)

Each named plant of User Story 5 was applied alone to the implementation at `cf475d4`, run once against the test file
named and then reverted. The runner checked after each plant that the source file was byte for byte as before it. The
plants come from contracts/elements.md § Pairings (the link rows), research.md R-08, R-11 and R-15, and the plants
named beside each body of `packages/elements/test/scenarios/link.ts`, `test/scenarios/tabs.ts` (US2-22's real body)
and `storybook/stories/link.stories.ts`.

The runs used `pnpm exec vitest run --project <project> <file> -t <filter>` with `OCELLE_CHROMIUM_PATH` set; the
fixture runs (`elements-browser`, `elements-browser-file`) build the browser build from the planted source in their
setup. A failing test name is cut at 110 characters. Every plant in the table made at least one test fail.

## The contract's link rows

| Contract row | Plant | Bites |
|---|---|---|
| no navigation without `href` / when cancelled / disallowed protocol | navigating on every activation; deciding on the written string; deciding on the document URL | yes: US5-2 and US5-3 on the fixture, US5-9 in both harnesses and link-target, US5-11 in both harnesses |
| Enter without `href` emits | activation on the native click only | yes: US5-2 |
| Space emits nothing, its default not prevented | Space handled on the link | yes: US5-2 |
| modified activation emits nothing | emitting on every click | yes: US5-13 in both harnesses |
| modified activation's default not prevented | `preventDefault()` on every click | yes: US5-13 in both harnesses (on the fixture no new tab or window opens) |
| exactly one named node | `label` set as the host's `aria-label` instead of the anchor's | yes: both US5-8 bodies |
| a host `aria-label` does not name the link | forwarding the host `aria-label` to `part="anchor"` | yes: US5-8's host body |
| no `label-content-name-mismatch` on the link stories | a story `label` without the visible text | yes: the label story in light and dark |
| a cancelled fragment link does not change the fragment | ignoring `defaultPrevented` | yes: US5-14 in process, US5-5 on the fixture |
| the panel is not a stop when it holds a shadow-delegating focusable (US2-22) | a light-DOM selector query at tabs updates only | yes: the real US2-22 body in both harnesses |

## Plants corrected after their first run

Two plant forms did not bite on their first run (on `cf475d4`). Neither was a guard that cannot fail: each form was not
the defect its name states, and each corrected form bites (the table below has the corrected rows).

- *Resolving once at render* (US5-11). The first form cached the target with `??=` at the first activation. With the
  `kitty-app:` base that target is `null`, and `??=` assigns again whenever the value is `null`, so the form resolved at
  every refused activation: it was the source's behaviour. The corrected form computes the target in
  `connectedCallback`, before the base is inserted, and uses it at every activation. It makes both US5-11 bodies fail on the fixture
  (the link to `x` navigates under the base; in the second body the fragment changes under the base).
- *A display rule on `:host` that overrides `:host([hidden])`* (Edge Cases). The first form only reordered the two
  rules. `:host([hidden])` has the higher specificity, so the order changes nothing: no defect. The corrected form
  removes the `:host([hidden])` rule, so the element's `:host { display: inline }` beats the user-agent `[hidden]`
  rule, the defect mission 005's convention prevents. It makes the hidden body fail.

## Navigating on every activation in process

The plant *navigating on every activation*, with the `null` href's base URL assigned (`location.assign(new URL(href ??
"", document.baseURI).href)`), reloads the document on every activation without `href`. Run in process against US5-2
it reloads the Vitest runner's frame: the run ends with "Failed to run the test", an error, not an assertion. The same
plant on the fixture makes US5-2 fail (the page's execution context is destroyed by the reload) and US5-3 fail on its
assertion (the marker is gone). It is in the table as the fixture run. In process, the navigation decision is killed by
the `javascript:` bodies (US5-9) and the fragment bodies (US5-11, US5-14), and by link-target's tests.

## The plants

| Plant | Source | Test file (project) | Failing tests |
|---|---|---|---|
| the link in another token (ink) at rest | `ocelle-link.ts` | `link.test.ts` (elements) | US5-1: a link in a paragraph is exposed as a link named by its text inside the paragraph's text, is in the tab… (1 failed | 18 skipped (19)) |
| no underline | `ocelle-link.ts` | `link.test.ts` (elements) | US5-1: a link in a paragraph is exposed as a link named by its text inside the paragraph's text, is in the tab… (1 failed | 18 skipped (19)) |
| no hover rule | `ocelle-link.ts` | `link.test.ts` (elements) | US5-1: a link in a paragraph is exposed as a link named by its text inside the paragraph's text, is in the tab…; R-15: in dark the link is drawn in the dark color-link with an underline, and in the dark color-link-hover und… (2 failed | 17 skipped (19)) |
| the hover in the link token (dark included) | `ocelle-link.ts` | `link.test.ts` (elements) | R-15: in dark the link is drawn in the dark color-link with an underline, and in the dark color-link-hover und… (1 failed | 18 skipped (19)) |
| the anchor not in the tab order (tabindex -1 without href) | `ocelle-link.ts` | `link.test.ts` (elements) | US5-1: a link in a paragraph is exposed as a link named by its text inside the paragraph's text, is in the tab… (1 failed | 18 skipped (19)) |
| activation on the native click only (no keydown handler) | `ocelle-link.ts` | `link.test.ts` (elements) | US5-2: with the link focused, Enter emits one ocelle-link-activate with detail { href: null }, bubbling, compo… (1 failed | 18 skipped (19)) |
| the event not cancelable | `ocelle-link.ts` | `link.test.ts` (elements) | US5-2: with the link focused, Enter emits one ocelle-link-activate with detail { href: null }, bubbling, compo… (1 failed | 18 skipped (19)) |
| the event not composed | `ocelle-link.ts` | `link.test.ts` (elements) | US5-2: with the link focused, Enter emits one ocelle-link-activate with detail { href: null }, bubbling, compo… (1 failed | 18 skipped (19)) |
| Space handled on the link (its keydown default prevented) | `ocelle-link.ts` | `link.test.ts` (elements) | US5-2: with the link focused, Enter emits one ocelle-link-activate with detail { href: null }, bubbling, compo… (1 failed | 18 skipped (19)) |
| no click handler | `ocelle-link.ts` | `link.test.ts` (elements) | US5-3: a click on the link without href emits one ocelle-link-activate with detail { href: null } and the page… (1 failed | 18 skipped (19)) |
| the click's default not prevented | `ocelle-link.ts` | `link.test.ts` (elements) | US5-3: a click on the link without href emits one ocelle-link-activate with detail { href: null } and the page… (1 failed | 18 skipped (19)) |
| two events per click | `ocelle-link.ts` | `link.test.ts` (elements) | US5-3: a click on the link without href emits one ocelle-link-activate with detail { href: null } and the page… (1 failed | 18 skipped (19)) |
| the link as display: inline-block (one box, one ring) | `ocelle-link.ts` | `link.test.ts` (elements) | US5-6: in light, a link that wraps across two lines in a narrow paragraph, focused by keyboard, has its 3 px c…; US5-6: in dark, a link that wraps across two lines in a narrow paragraph, focused by keyboard, has its 3 px co… (2 failed | 17 skipped (19)) |
| the ring as a box-shadow | `ocelle-link.ts` | `link.test.ts` (elements) | US5-6: in light, a link that wraps across two lines in a narrow paragraph, focused by keyboard, has its 3 px c…; US5-6: in dark, a link that wraps across two lines in a narrow paragraph, focused by keyboard, has its 3 px co… (2 failed | 17 skipped (19)) |
| the ring in another token (link) | `ocelle-link.ts` | `link.test.ts` (elements) | US5-6: in light, a link that wraps across two lines in a narrow paragraph, focused by keyboard, has its 3 px c… (1 failed | 1 passed | 17 skipped (19)) |
| forced-color-adjust: none with the token colour kept | `ocelle-link.ts` | `link.test.ts` (elements) | US5-7: in forced colours the link with and without href is drawn in the system LinkText colour, underlined, an… (1 failed | 18 skipped (19)) |
| the underline removed in forced colours | `ocelle-link.ts` | `link.test.ts` (elements) | US5-7: in forced colours the link with and without href is drawn in the system LinkText colour, underlined, an… (1 failed | 18 skipped (19)) |
| the ring removed in forced colours | `ocelle-link.ts` | `link.test.ts` (elements) | US5-7: in forced colours the link with and without href is drawn in the system LinkText colour, underlined, an… (1 failed | 18 skipped (19)) |
| label set as the host's aria-label instead of the anchor's | `ocelle-link.ts` | `link.test.ts` (elements) | US5-8: a label that starts with the visible text names the link, with exactly one named node in the paragraph,…; US5-8: a host aria-label does not name the link: beside label the link is named from label, also after the hos… (2 failed | 17 skipped (19)) |
| label not trimmed | `ocelle-link.ts` | `link.test.ts` (elements) | US5-8: a label that starts with the visible text names the link, with exactly one named node in the paragraph,… (1 failed | 1 passed | 17 skipped (19)) |
| the label read once at first render | `ocelle-link.ts` | `link.test.ts` (elements) | US5-8: a label that starts with the visible text names the link, with exactly one named node in the paragraph,… (1 failed | 1 passed | 17 skipped (19)) |
| forwarding the host aria-label to part=anchor (first render and changes) | `ocelle-link.ts` | `link.test.ts` (elements) | US5-8: a host aria-label does not name the link: beside label the link is named from label, also after the hos… (1 failed | 1 passed | 17 skipped (19)) |
| deciding on the written string (navigationTarget) | `link-target.ts` | `link.test.ts` (elements) | US5-9, in process: Enter and a plain click on links whose href is javascript: (plain, padded with spaces, with… (1 failed | 18 skipped (19)) |
| deciding on the written string (navigationTarget), link-target tests | `link-target.ts` | `link-target.test.ts` (elements) | javascript: padded with spaces is null, and link-target.html on the same page is its URL; javascript: padded with a newline and s… is null, and link-target.html on the same page is its URL; javascript: with a tab inside the scheme is null, and link-target.html on the same page is its URL; javascript: with a newline inside the s… is null, and link-target.html on the same page is its URL; a custom scheme that is not the documen… is null, and link-target.html on the same page is its URL; mailto: is null, and link-target.html on the same page is its URL; blob: is null, and link-target.html on the same page is its URL; a file: href is refused on an http: page and allowed on a file: page (the decision reads documentProtocol, not…; an href that does not parse is null and throws nothing, beside one that does; a kitty-app: base on an http: page refuses a relative href and allows an absolute https: one; without the base… (10 failed | 14 passed (24)) |
| deciding on the document URL (location.href for the base) | `ocelle-link.ts` | `link.test.ts` (elements) | US5-11, in process: with <base href=kitty-app://app/> inserted after render, Enter on one link and a click on … (1 failed | 18 skipped (19)) |
| deciding on the document URL, fixture | `ocelle-link.ts` | `link.test.ts` (elements-browser) | US5-11: on the fixture, with <base href=kitty-app://app/> inserted after the element loaded (document.baseURI …; US5-11, in process: with <base href=kitty-app://app/> inserted after render, Enter on one link and a click on … (2 failed | 23 skipped (25)) |
| the anchor not refreshed at a click's pointerdown | `ocelle-link.ts` | `link.test.ts` (elements) | US5-11, in process: with <base href=kitty-app://app/> inserted after render, Enter on one link and a click on … (1 failed | 18 skipped (19)) |
| the anchor not refreshed at Enter's keydown | `ocelle-link.ts` | `link.test.ts` (elements) | US5-11, in process: with <base href=kitty-app://app/> inserted after render, Enter on one link and a click on … (1 failed | 18 skipped (19)) |
| navigating on every activation (no protocol check), fixture | `link-target.ts` | `link.test.ts` (elements-browser) | US5-9, in process: Enter and a plain click on links whose href is javascript: (plain, padded with spaces, with…; US5-9, on the fixture: Enter and a plain click on javascript:alert(1), its padded form, its form with a tab in… (2 failed | 23 skipped (25)) |
| protocol check against http: only (the document's own protocol ignored), file: suite | `link-target.ts` | `link-file.test.ts` (elements-browser-file) | US5-12: Enter on <ocelle-link href=link-target.html> emits { href: link-target.html } and the file: page navig…; US5-12: a plain click on the same link emits its event and the file: page navigates to its file: target (2 failed (2)) |
| emitting on every click (modifiers ignored) | `ocelle-link.ts` | `link.test.ts` (elements) | US5-13, without href: Ctrl, Meta or Shift held on a click or on Enter, and a middle click, emit nothing, leave… (1 failed | 18 skipped (19)) |
| preventDefault() on every click | `ocelle-link.ts` | `link.test.ts` (elements) | US5-13, without href: Ctrl, Meta or Shift held on a click or on Enter, and a middle click, emit nothing, leave… (1 failed | 18 skipped (19)) |
| preventDefault() on every click, fixture (new tab or window) | `ocelle-link.ts` | `link.test.ts` (elements-browser) | US5-13, with href, on the fixture: Ctrl and Shift held on a click or on Enter, and a middle click, emit no oce… (1 failed | 24 skipped (25)) |
| emitting on every click, fixture | `ocelle-link.ts` | `link.test.ts` (elements-browser) | US5-13, with href, on the fixture: Ctrl and Shift held on a click or on Enter, and a middle click, emit no oce… (1 failed | 24 skipped (25)) |
| the modifiers not read on Enter (Ctrl+Enter emits) | `ocelle-link.ts` | `link.test.ts` (elements) | US5-13, without href: Ctrl, Meta or Shift held on a click or on Enter, and a middle click, emit nothing, leave… (1 failed | 18 skipped (19)) |
| Alt treated as a modifier | `ocelle-link.ts` | `link.test.ts` (elements) | US5-13, without href: Ctrl, Meta or Shift held on a click or on Enter, and a middle click, emit nothing, leave… (1 failed | 18 skipped (19)) |
| ignoring defaultPrevented | `ocelle-link.ts` | `link.test.ts` (elements) | US5-14: Enter and a plain click on <ocelle-link href=#section-2> with no listener cancelling each emit { href:… (1 failed | 18 skipped (19)) |
| ignoring defaultPrevented, fixture | `ocelle-link.ts` | `link.test.ts` (elements-browser) | US5-5: on the fixture, with a listener that cancels the event, Enter and a click on <ocelle-link href=link-tar… (1 failed | 24 skipped (25)) |
| no location.assign | `ocelle-link.ts` | `link.test.ts` (elements) | US5-14: Enter and a plain click on <ocelle-link href=#section-2> with no listener cancelling each emit { href:… (1 failed | 18 skipped (19)) |
| an empty href treated as no href | `ocelle-link.ts` | `link.test.ts` (elements-browser) | US5-14, on the fixture: href="" is an href: cancelled, the event carries { href: "" } and the page does not na… (1 failed | 24 skipped (25)) |
| href on the anchor whatever its protocol | `ocelle-link.ts` | `link.test.ts` (elements) | R-08: the anchor carries the host's href as written only when it is allowed, else no href with role link and t… (1 failed | 18 skipped (19)) |
| no role or tabindex without href | `ocelle-link.ts` | `link.test.ts` (elements) | R-08: the anchor carries the host's href as written only when it is allowed, else no href with role link and t… (1 failed | 18 skipped (19)) |
| the anchor's state not refreshed on an href change | `ocelle-link.ts` | `link.test.ts` (elements) | R-08: the anchor carries the host's href as written only when it is allowed, else no href with role link and t… (1 failed | 18 skipped (19)) |
| href not reflected | `ocelle-link.ts` | `link.test.ts` (elements) | the properties: href is reflected to the attribute, label is not; with no attribute both read undefined, besid… (1 failed | 18 skipped (19)) |
| label reflected | `ocelle-link.ts` | `link.test.ts` (elements) | the properties: href is reflected to the attribute, label is not; with no attribute both read undefined, besid… (1 failed | 18 skipped (19)) |
| a transition on the link's colour | `ocelle-link.ts` | `link.test.ts` (elements) | Edge Cases, motion: the link declares no transition or animation, beside the focus ring it shows at once (1 failed | 18 skipped (19)) |
| a light-DOM selector query at tabs updates only (tabs) | `ocelle-tabs.ts` | `tabs.test.ts` (elements) | US2-22: the selected panel holding only an ocelle-link is no stop: Tab on the selected tab focuses the link's … (1 failed | 59 skipped (60)) |
| a light-DOM selector query at tabs updates only (tabs), fixture | `ocelle-tabs.ts` | `tabs.test.ts` (elements-browser) | US2-22: the selected panel holding only an ocelle-link is no stop: Tab on the selected tab focuses the link's … (1 failed | 58 skipped (59)) |
| a story label without the visible text | `link.stories.ts` | `elements-stories.test.ts` (storybook-integration) | elements-ocelle-link--with-label in light: renders its link in a paragraph with the state it states, and axe's…; elements-ocelle-link--with-label in dark: renders its link in a paragraph with the state it states, and axe's … (2 failed | 84 skipped (86)) |
| resolving once at render (the target computed at connection, used at every activation) | `ocelle-link.ts` | `link.test.ts` (elements-browser) | US5-11: on the fixture, with <base href=kitty-app://app/> inserted after the element loaded (document.baseURI read…; US5-11, in process: with <base href=kitty-app://app/> inserted after render, Enter on one link and a click on anoth… (2 failed | 23 skipped (25)) |
| the :host([hidden]) rule missing (the :host display rule then overrides the user-agent [hidden] rule) | `ocelle-link.ts` | `link.test.ts` (elements) | Edge Cases: host hidden removes the link, no box and no node; without it the link has a box and its node (1 failed | 18 skipped (19)) |
| the host given a role (internals role link: a second node) | `ocelle-link.ts` | `link.test.ts` (elements) | US5-1: a link in a paragraph is exposed as a link named by its text inside the paragraph's text, is in the tab… (1 failed | 18 skipped (19)) |
| navigating on every activation (the null href's base URL assigned) | `ocelle-link.ts` | `link.test.ts` (elements-browser) | US5-2: with the link focused, Enter emits one ocelle-link-activate … (Execution context was destroyed: the pag…; US5-3: a click on the link without href emits one ocelle-link-activate with detail { href: null } and the page… (2 failed | 23 skipped (25)) |

## Review round 1 (R1-01)

*Meta not read as a modifier on a click* (`ocelle-link.ts`: the click handler's `event.metaKey` dropped), run against
`browser/link.test.ts` (elements-browser) with `-t "US5-13, with href"` on the round 1 fix: US5-13, with href, on the
fixture … (1 failed | 24 skipped (25)). The Meta click and the new Meta+Enter both emit under it. The source was
restored byte for byte.

## Landing fold, operator round 3 (T115, O3-01)

The ring plants of US5-7 were run again on the fold's green test commit `96dd714` (the spaced link), each applied
alone to `ocelle-link.ts`'s `@media (forced-colors: active)` block, run with `-t US5-7` and then reverted. The runner
checked after each plant that the source file was byte for byte as before it. Each plant ran under two launches, with
`OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`:

- *grayscale*: the default launch, which draws grayscale text;
- *subpixel*: `FONTCONFIG_FILE` set to the absolute path of `packages/elements/test/browser/subpixel/fonts.conf` for
  the vitest process, which both harnesses' browsers inherit, and the committed suite `browser/link-subpixel.test.ts`,
  which launches its own browser with that file.

| Plant | Launch | Test file (project) | Bites |
|---|---|---|---|
| the ring removed in forced colours (`outline: none` for `:focus-visible`) | grayscale | `link.test.ts` (elements); `browser/link.test.ts` (elements-browser) | yes: US5-7 fails on `ring` (1 failed, 18 skipped; 1 failed, 24 skipped) |
| the ring removed in forced colours | subpixel | `link.test.ts` (elements); `browser/link.test.ts` (elements-browser); `browser/link-subpixel.test.ts` (elements-browser) | yes: US5-7 fails on `ring` in all three (1 failed, 18 skipped; 1 failed, 24 skipped; 1 failed, 1 passed, the precondition passing) |
| forced-color-adjust: none with the token colour kept (anchor colour and ring in their tokens) | grayscale | `link.test.ts` (elements); `browser/link.test.ts` (elements-browser) | yes: US5-7 fails on `plain`, `ring` and `withHref` (1 failed, 18 skipped; 1 failed, 24 skipped) |
| forced-color-adjust: none with the token colour kept | subpixel | `link.test.ts` (elements); `browser/link.test.ts` (elements-browser); `browser/link-subpixel.test.ts` (elements-browser) | yes: US5-7 fails on `plain`, `ring` and `withHref` in all three (the precondition passing) |
| the ring's `outline-color: Highlight` swapped for `var(--ocelle-color-focus)` alone | grayscale and subpixel | the same files | does not bite: equivalent in Chromium (forced colours force the outline colour). In forced colours Chromium replaces an author outline colour with the system colour unless `forced-color-adjust: none` is set, and that case is the row above, which bites. No test and no source change (T115 step 4); US5-7's plant comment no longer names this form |

### The gate plant run of the fold

- base: ca18374^ (cafa4ba2432924c813f7ed69f13059672d6f317a, the parent of the fix-3 red commit, as T115 step 5 names it)
- command: pnpm run gate:plants -- --affected ca18374^
- exit: 0

```text
$ node gates/bin/plants.ts -- --affected 'ca18374^'
plants: affected since ca18374^: no plant selected, 0 of 314 plants judged; not the Plants check
```

The fold changes only test files (`link-subpixel.test.ts`, `subpixel/fonts.conf`, `scenarios/link.ts`) and these
records, so no gate plant is affected and the plant repository's counts are unchanged.

Review round 4 (R4-01) found that this base is `ca18374^`, not `base.sha` (`ac2eebe`), which selects all 314 plants
because the landing merge of main lies in the phase range. Operator decision 5 (`operator-decisions.md`) accepts this
round-scoped run for fix-3 and closes R4-01: the one full plants run against the phase base, on the head after the
second merge of main and before hand-off, covers phase 6 as well as phase 7 and is recorded here, in
`reviews/phase-7/plants.md` and in the landing records. This run stays as supplementary evidence.

## The full plants run after the second merge of main

The full run owed by phase 6 operator decision 5 was moved to CI by landing operator decision 5 ("CI carries
heavy gates"). CI's Plants shards on the final head stand in for it; the CI run id is added after the push. Locally,
the selection against the phase base on the merge head e47888d selects every plant
(`pnpm run gate:plants -- --affected ac2eebe229dc860390ba4ba1c69ff1725fe8b1fe --list`: 317 of 317 selected, by shared gate source; exit 0).
