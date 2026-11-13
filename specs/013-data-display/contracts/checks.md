# Contract: the checks this feature adds or extends

No gate is added. Every existing gate runs on the new source, stories and built output. This file says what each test
asserts and where it lives, so that `/speckit-tasks` and review can trace each acceptance scenario.

## Scenario bodies and harnesses (FR-052)

| Element | Scenario file | In-process test (mutated) | Fixture test (built browser build, strict CSP) |
|---|---|---|---|
| facts and fact | `packages/elements/test/scenarios/facts.ts` | `test/facts.test.ts` | `test/browser/facts.test.ts` |
| empty state | `test/scenarios/empty-state.ts` | `test/empty-state.test.ts` | `test/browser/empty-state.test.ts` |
| progress | `test/scenarios/progress.ts` | `test/progress.test.ts` | `test/browser/progress.test.ts` |

- **One body per scenario.** Each acceptance scenario of US1 to US3 is a body named after it (`US1-3`), and each body
  makes at least one assertion that can fail.
- **"Does not" outcomes are paired.** A body that asserts something does not happen also asserts a positive outcome
  in the same body. Examples: no tab stop added (US2-6) is paired with the button receiving focus; no event emitted
  (US3-2) is paired with the value changing.
- **Plants.** Where the oracle could pass vacuously, a plant is named in `tasks.md`, as in 005: a mutated copy of the
  element that the test must fail on. Candidates:
  - facts: the probe removed (US1-2 must fail), manual assignment replaced by `<dl><slot>` (US1-6 must fail on
    structure);
  - empty state: the `slotchange` flags removed (US2-5 must fail);
  - progress: `animation: none` removed under reduced motion (US3-5 must fail), the `accent-strong` inset shadow
    removed (US3-7 must fail).

**Extra scenario bodies from the spec check notes:**
- facts: dynamic add, remove and reorder, and a label change (SPEC-2-06); right-to-left columns (SPEC-2-08); a
  640 px "200% zoom" case (SPEC-2-05); `ocelle-fact` outside `ocelle-facts`; a non-`ocelle-fact` child is hidden; a
  shrink-to-fit host (dialog, popover, float, flex item) with FR-009's bound;
- empty state: slots filled and emptied after first render; several actions at 320 px (SPEC-2-07);
- progress: `value-text` ignored while indeterminate and kept when clamped (SPEC-2-02); a `value` attribute removed
  after being set.

## Browser commands

These are the commands 005 added to the `elements` Vitest project: `axTree` (the full Chromium AX tree) and
`emulateForcedColors`. New: `emulateReducedMotion` (CDP `Emulation.setEmulatedMedia`, feature
`prefers-reduced-motion`), with its own unit test in `test/commands.test.ts`.

The progress `valuetext` oracle is chosen in phase 3's spike (research R-05).

## Contrast (SC-004)

- **New rows.** `packages/tokens/contrast/pairs.json` gains 12 non-text rows: `color-accent-strong` on `color-canvas`,
  `color-sheet`, `color-pane`, `color-panel`, `color-inspector` and `color-rail`, light and dark, with source `013`.
  The `color-accent-strong` record in `packages/tokens/src/source.ts` adds those grounds to its declared non-text
  grounds.
- **Pinned counts.** Every place 005 listed for the counts changes first, in the red commit: the contrast gate tests,
  the plants-robustness test, the token-gates integration test, and the comment in `gates/bin/contrast.ts`. The counts
  go from 328 entries (160 light, 168 dark) to 340 (166 and 174).
- **A pairing test.** It ties the shipped progress stylesheet to these rows: the fill's mark colour token and the
  track token, read from the built `dist/ocelle-progress.js`, are the pairs the rows name (005's `brand-pairs` model).

## Story test (I3)

`storybook/test/integration/elements-stories.test.ts` gains each phase's stories (research R-08) in that phase's red
commit. Each new story must be present in the built index, render its element in light and dark, and have no CSP
violation and no outside request.

## Gates touched

| Gate | What changes |
|---|---|
| `manifest` | Four new declarations, regenerated and committed. |
| `style-lint` (`token-only`) | New `css` templates. No new allowance is needed (`%`, `fr`, numbers inside `calc()`, `scale: -1 1` and `0` are already allowed). |
| `prefix` | New source, stories and build output: no `sk-`, no monospace. |
| `csp` | Storybook checks on the new stories. Run-time CSP on the fixture pages. |
| `contrast` | The 12 new rows. |
| `mutation` | New element source, in process; Timeout and CompileError are reported and pass (#23). |
| `test-lint` | New tests. |
| `visual`, `axe`, `storybook-build` | #10's, not on `main`: see research R-08. |
