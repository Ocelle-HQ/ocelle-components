# Phase 2 plants (T034 step 1, T034a)

Each empty-state plant of contracts/checks.md (§ CSS-only behaviours) run once on 2026-11-14 against the green source:
`packages/elements/src/ocelle-empty-state.ts` edited as named, the shared bodies run in process
(`packages/elements/test/empty-state.test.ts`, 18 bodies), then the file restored from a copy of the green source.
Scratch runner in the session scratchpad; no plant is committed. The `::slotted(ocelle-progress)` plant is not run
here (T034 step 1): phase 2's stand-in is not an `ocelle-progress`, so the rule cannot match it; it runs in T052.

| Plant | Guard named | Result |
|---|---|---|
| the "last present part has no margin" rule removed (`.stack > .last` and its panel twin) | US2-3, US2-4, present-parts bodies | bites: 8 bodies fail, among them US2-5 and the present-parts bodies, US2-7, US2-9, slots filled and emptied, unset variant (panel padding), the eyebrow present-parts, visual-and-eyebrow and eyebrow-and-text bodies. US2-3 and US2-4 pass under it: their last part is the actions, which has no margin of its own |
| the `hidden` observer removed (the `MutationObserver` callback does nothing; presence counted from `slotchange` only) | US2-9 | bites: US2-9 fails (the action stays absent after `hidden` is removed, and the whitespace text changed to words keeps the text part absent); the other 17 pass |
| T034a: the eyebrow type rule removed (`::slotted([slot="eyebrow"])` keeps only `margin: 0`; its `ink-muted` colour removed) | US2-10 | bites: US2-10 fails (16 px, 400, ink, no upper case), and the visual-and-eyebrow body (its AX text is no longer upper case) |
| T034a: the eyebrow's heading-dependent class ignored (`before-heading` never set) | US2-10, eyebrow present-parts, eyebrow and text | bites: US2-10 and the visual-and-eyebrow body fail (the eyebrow-to-heading gap is `space-2`/`space-3`, not `space-1`/`space-2`); the eyebrow present-parts and eyebrow-and-text bodies pass, as expected, since they have no heading |
| T034a: the body `margin-block: 0` removed (`::slotted(:not([slot]))`) | US2-11 | bites: 10 bodies fail, US2-11 among them (the 1em user-agent margins return) |
| T034a: the body gap removed (the `.text` wrapper's `gap`) | US2-11, inline-content body | bites: both fail (the paragraphs touch, the three blocks touch); the other 16 pass |

Every plant bites. No plant needed a decision.
