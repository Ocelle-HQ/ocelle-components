# T001: recheck of #10 as merged (phase 1)

**Read on** 2026-11-13, at `2427d20` (this branch, which already holds `main` at `3828d2f`, "Mission 006: Storybook
workbench, visual regression and axe gates (#10) (#24)"). `main` was not merged again: `2427d20` is that merge
(operator constraint for this phase; no rebase).

**Result: two items differ.** Under the operator's constraint for this phase, nothing in research.md, contracts/ or
tasks.md is changed by this record. The phase stops here so the orchestrator can put the changes below to the operator.

## Items of R-15's list

| # | Item | Result | Evidence (as merged) |
|---|---|---|---|
| 1 | Viewport and scale | as designed | `gates/lib/capture-plan.ts` `contextOptions`: 1280 × 800, `deviceScaleFactor: 1`, `reducedMotion: "reduce"`, `forcedColors: "none"`; `scrollBack` resets the page to (0, 0) before the capture (`gates/visual/capture.ts`) |
| 2 | Theme global | as designed | `storybook/.storybook/preview.ts`: global `theme`, light at start, `light`/`dark`, a decorator sets `data-theme` on `<html>`; the gates capture and audit each story in both |
| 3 | Baseline path and `visual:update` | as designed | `storybook/baselines/<story-id>.<theme>.png`, byte-compared; `pnpm run visual:update` (`gates/bin/baselines.ts`) in the pinned linux/amd64 container (`storybook/visual/container.json`), docker or podman; CI's artifact `visual` is the record (`storybook/README.md` § Baselines) |
| 4 | Render signal and timeout | as designed | Storybook's `storyRendered` (failure on `storyThrewException`, `storyErrored`, `storyMissing` or the error display), 15 s (`readinessTimeout`); then fonts ready and two animation frames; two captures per story-theme, `nondeterministic` when they differ. R-15's mid-scroll stories (scroll set after `updateComplete` in the render, no timers) rest on this unchanged |
| 5 | Pointer-state parameter | as designed | `parameters: { ocelle: { pointer: { hover: "<selector>" } } }` or `{ press: … }`, one key, one matching element inside 1280 × 800 at (0, 0), else `pointer-target` |
| 6 | `a11y-exceptions.json` format | as designed | a list of `{ story, theme, rule, selector, reason, sunset, plan }`; honoured only with the named plan's Complexity Tracking row (`stale-exception`, `unrecorded-exception`), `plan` must be `specs/<feature>/plan.md`. R-15 adds nothing to it without the operator, so nothing changes |
| 7 | Story file and layout-stylesheet locations | as designed (locations); **differs: the frame route** (below, D1) | `storybook/.storybook/main.ts` `stories: ["../stories/*.stories.ts"]`; `storybook/.storybook/stories-layout.css` exists, `[data-story]` rules only, imported by `preview.ts` |
| 8 | Contributor note's items | as designed | `storybook/README.md` § Adding stories: one file per element, one story per variant and state, the pointer parameter, both themes without writing a story twice, open shadow roots, surfaces inside the host, `font: inherit` on form controls, run-time strict CSP proved in the package's own browser tests |
| 9 | Storybook configuration this feature touches | **differs** (D1 and D2 below) | `main.ts`, `preview.ts`, `gates/lib/plant-repo.ts` configuration set, `gates/bin/csp.ts` |

## D1. The story frame route: an `@import` of `frames.css` breaks every Storybook plant root

The operator prefers that `storybook/.storybook/stories-layout.css` imports `packages/elements/test/fixtures/frames.css`.
Tried at `2427d20` with a stand-in `frames.css` (one rule) and `@import "../../packages/elements/test/fixtures/frames.css";`
at the top of `stories-layout.css` (both reverted, nothing committed):

1. **In the repository:** `pnpm --dir storybook run build` succeeds, and the rule is bundled into
   `dist/assets/iframe-*.css` (`[data-frame=W]{inline-size:876px}`). Vite's build resolves the relative path outside
   `storybook/`; `main.ts` sets no restriction that stops it.
2. **In a plant root:** #10's repo-tree plants copy only the configuration set of `gates/lib/plant-repo.ts`
   (`storybookFiles`: `storybook/.storybook`, `storybook/stories`, …; `elementFiles`: `packages/elements/src` only), so
   `packages/elements/test/` is absent there. A root built with `buildRepoTree` for
   `gates/plants/storybook-build/pass-repository` holds the `@import` but not the file, and its Storybook build fails:
   `Error: [postcss] ENOENT: no such file or directory, open '../../packages/elements/test/fixtures/frames.css'`.
   Every plant that builds the Storybook from a repo-tree root (`storybook-build` `pass-repository`, the `visual` and
   `axe` plants) would then fail or break, so `gate:plants` would fail.

So the import route needs a gate-source change the tasks do not hold, and the copy route is the one #10's
configuration allows as it stands. Either way an artifact changes:

- **(a) Import, as the operator prefers.** Add `packages/elements/test/fixtures/frames.css` to the configuration set in
  `gates/lib/plant-repo.ts` (`storybookFiles` or `elementFiles`), with its test in
  `gates/test/plant-repo.test.ts` (`configurationSet`) and, if wanted, the integration case in
  `gates/test/integration/plant-repo.test.ts`, red first. That is gate source (mutated under `stryker.config.json`),
  so it needs a task in phase 1 or 2 (tests in the red commit, the change in green), a line in R-15 and R-17, and
  possibly `contracts/gates.md` (which does not list the configuration set today); `plan.md`'s phase 1 "read by both drivers and by the story
  stylesheet" then holds as written.
- **(b) Copy.** `stories-layout.css` holds the four `[data-frame]` rules, and a `storybook-integration` test compares
  them with `frames.css` (R-17 already allows this). Per the operator's rule, that test belongs in the red commit of
  the phase that writes the rules (phase 2, beside T020), so T020 (or a new phase 2 test task) gains it, and T027,
  R-15 and `contracts/elements.md` § Stories say "copy" instead of "by import or as a copy". No gate change.

## D2. The Storybook is no longer a CSP target

#10 as merged (006 FR-020, operator decision Q1 (a)) took the Storybook out of the `csp` gate: `gates/bin/csp.ts`
reads `packages/*/dist/` only ("no file below `storybook/` is read"), the Storybook is served with no CSP header, and
`storybook/test/integration/elements-stories.test.ts` counts no violation ("the Storybook is not a CSP target"). The
plant `csp/pass-storybook-out-of-scope` passes a `style` attribute in a story's markup. What this changes here:

- **R-15 Decision, Stories:** "with no `style` attribute and no class (the `csp` gate's Storybook check)": no gate
  checks that any more. The rule itself still stands as 003's convention (`stories-layout.css` header, R-17 "No
  `style` attribute anywhere"), but its stated enforcement does not exist. Either the stories' own tests assert it
  (a `storybook-unit` or `storybook-integration` assertion on each new story's markup, red first) or R-15 drops the
  gate reference and keeps the rule as convention.
- **T020** ("each renders `ocelle-scroller` in light and dark with zero CSP violations"): the story test no longer
  measures CSP violations, so this clause cannot be written as 006 left the test. It would become "renders, with no
  request outside the origin" (what `elements-stories.test.ts` asserts since 006), and strict CSP stays proved in the
  `elements-browser` fixtures (contributor note, item 8). T037 and T053 do not name CSP and are unaffected.
- `contracts/elements.md` § Stories ("No story uses a `style` attribute or a class") is unaffected in wording; only
  its enforcement is in question, as for R-15.

## What would change (for the operator)

| Artifact | D1 (a) import | D1 (b) copy | D2 |
|---|---|---|---|
| research.md R-15 | the import route and its configuration-set entry | "copy, checked by a `storybook-integration` test" | drop "the `csp` gate's Storybook check"; name the check that replaces it, or none |
| research.md R-17 (Frames) | "by import" only, plus the plant-root entry | "a copy" only | none |
| contracts/elements.md § Stories | "imports" | "a copy checked against" | none, or the enforcing test |
| contracts/gates.md | a row for the configuration-set entry (it lists none today) | none | none |
| tasks.md | a new red test and green task for `gates/lib/plant-repo.ts` (phase 1 or 2); T027 says "import" | T020 (or a new phase 2 red task) gains the copy test; T027 says "copy" | T020 loses "zero CSP violations"; optionally a red assertion of no `style` attribute and no class in each phase's story test (T020, T037, T053) |

## Not changed by this record

- T002 (sibling 011) was not recorded: the phase stops at this record.
- No merge: `main` (`3828d2f`) is already in this branch (`2427d20`).
- The stand-in `frames.css` and the `@import` used for D1 were reverted; the plant root was built in the scratchpad and
  removed.
