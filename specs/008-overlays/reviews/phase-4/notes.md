# Phase 4 notes: User Story 3, a tooltip that meets WCAG 1.4.13

Base `78fe475` (`base.sha`). Environment: Chromium 153 (`OCELLE_CHROMIUM_PATH`), Playwright 1.64.1, docker with the
pinned Playwright image; `CI` and `GITHUB_ACTIONS` unset.

## Scaffold and red (T041 to T046, T050)

- Scaffold `d63190e` (`scaffold.sha`): `src/ocelle-tooltip.ts`, the class `OcelleTooltip extends LitElement` with its
  declared `text`, `placement`, `disabled` and `describes`, no behaviour, no JSDoc tags, not defined and not exported.
- Red commit `fb7d915` (amended once before `red.sh`; `red-commits`), test files only; `red.sh 4 phase`: `tests_only`
  true, `red` true, exit 1 (11 m 45 s). Log: `red-phase.log`, **271 of 5005 tests failed, every one by an
  assertion**:
  - the shared tooltip bodies in process (74) and on the strict-CSP fixture (74), the touch rows (2 + 2), "No Popover
    API" (1): `ocelle-tooltip` is not defined, so no bubble part exists (`popoverOpen` undefined, the geometry NaN,
    the description spans empty, the stand-in's samples show no open bubble);
  - the entry test, the export keys, the manifest entry (the scaffold class has no JSDoc tags) and the published check
    (2), the README and CHANGELOG fragments (40), the dist and pack lists (3 + 1);
  - the tokens: `expected.ts`'s two rows show in `index`, `source-table`, `themes`, `values`, `font` and the
    CHANGELOG and README checks, and the new tests (288 px, the delay kept under reduced motion); through them the
    Tokens story tests (`storybook/test/unit/stories.test.ts` × 6, `render.test.ts` × 4);
  - the 18 tooltip story tests (no story, no override); the gate counts (`storybook-build` 44 stories, `axe` 88 and
    the plant run 90, `visual` 88 × 2, the baseline command's 88 files, `plant-repo` 88);
  - the manifest gate's repository runs (`gates/test/manifest.test.ts` × 5, `gates/test/integration/manifest.test.ts`),
    red because the scaffold module is not in the committed manifest (as in Phases 2 and 3); and
    `gates/test/integration/vitest-mutation-config.test.ts` "starts source-table.test.ts first …", which stops after
    the failing `source-table.test.ts` (as in Phase 3).
- Before `red.sh`, a run of the new files in a worktree at the first red commit showed two rows failing for the wrong
  reason: "describes lifecycle … the host removes the span" (the stand-in's `remove` of an id that did not exist) and
  "Hoverable gap" on the fixture (a pointer move to NaN coordinates from the absent bubble, a CDP `Invalid
  parameters`). The amend removes the spans through a stand-in command that counts them, and gives the gap row's
  points a finite fallback; the expected values are unchanged.

## Measurements while writing the rows

- Pressing Shift alone makes a clicked button match `:focus-visible` (Chromium 153, probe outside the repository), so
  the late `:focus-visible` row's precondition holds as the matrix states it.
- Chromium collapses the two spaces of the name `aria-label="Open  project"` in the computed name: the trigger is
  named "Open project". The row of US3-11 asserts that name and no description.
- The description span must be assigned to a slot the shadow root holds but never renders (R-13: "assigned to a slot
  the shadow root does not render"). With no `description` slot in the shadow root the span is not in the flat tree,
  and Chromium gives the trigger no description from its `aria-describedby`; with `<slot name="description" hidden>`
  it does (measured in process: the four description rows failed with the first form and pass with the second).
- On the fixture the font of `tokens.css` loads after the first show, which widens the bubble: the per-frame check
  places the bubble again when its own size changes, not only when the trigger moves (measured: the start and end
  placement rows were 0.7 px off on the fixture with the first form).
- The Storybook build minifies `stories-layout.css` and writes the override `--ocelle-tooltip-delay: 0ms` as `0s`, so
  the computed custom property on a story's trigger reads `0s`. T050's story test reads the computed value as a
  duration and asserts 0 ms (what the override means); the element reads both units (`0.3s` and `300ms` alike).
- Story layout: the stories add no layout rule. Each trigger stands inline in a sentence after three short paragraphs,
  so every placement has room on its side at 1280 × 800; the flipped story's trigger is in the first line (the 16 px
  story padding is less than the bubble's block size plus the gutter). A first form of the flipped story put the
  trigger at the line's start, where the cross-axis clamp moved the bubble off the trigger's centre; the long-text
  story with one intro paragraph flipped below. Both were measured by T050's test and changed before the baselines.

## Floor consumers (T049, FR-040, analysis I5)

Searched the whole workspace (`git ls-files`, outside `specs/`, `knowledge/`, `triage/`, `ops/`) at Phase 4 for
`"engines"`, `browserslist` (a package key or a `.browserslistrc`) and `build.target` (Vite, esbuild, a `tsconfig`
`target` read as an engine floor), with no merge of `main` in this phase:

- `package.json` (root) `engines`: `node` 26.13.0 and `pnpm` 12.16.1, Node's and pnpm's, not a browser floor; it stays.
- No other `package.json` has `engines` or `browserslist`; no `.browserslistrc` exists.
- `packages/elements/vite.browser.config.ts` sets no `build.target`; `storybook/.storybook/main.ts` sets none.
- `tsconfig.base.json` `"target": "es2024"` is the language level of the TypeScript output, not an engine floor; the
  package tsconfigs set none.
- The gates' `engines` matches (`gates/lib/container.ts`, `gates/bin/visual.ts`, `gates/bin/baselines.ts`) are the
  container engines of the visual gate, not browser floors.

So no browser floor consumer exists besides the elements README § Engines, which now states Chromium 120+ and WebKit
17+ with the Popover API (Chromium 114, WebKit 17) as the newest feature (T044, T049).

## Kitty Desktop's webview (T053, FR-041; operator decision 2026-11-15, plan decision 26)

Hand-off for kitty-mission-ui #20:

- **Outcome: not yet determinable: Kitty Desktop has no webview until kitty-mission-ui #20.** The floor stays Chromium
  120 / WebKit 17 (FR-040).
- Evidence (read by the orchestrator from MOES-Media/kitty-mission-ui at commit `c994c8e`, 2026-10-17; research R-10):
  `apps/desktop/src-tauri/Cargo.toml` is a compile-only placeholder with no dependencies, its comment "Tauri and its
  system packages arrive with #20 (research R-02)"; `main.rs` reads "Kitty Desktop placeholder: builds and exits. The
  Tauri host arrives with #20."; the charter names Tauri 2; the phase-0 research defers the webkit2gtk system packages
  to #20; CI runs on ubuntu-24.04; no WebKitGTK version is pinned anywhere.
- What #20 must do: when it adds Tauri 2 on Linux (the distro's webkit2gtk-4.1), choose a WebKitGTK that meets WebKit
  17. By R-10's reading of the WebKitGTK release notes that is the 2.44 line or later; this is **unverified**. On macOS
  WKWebView is the system WebKit, at WebKit 17 or newer on macOS 12+ with current updates.
- Where the floor is stated: the elements README § Engines ("Engine floor: Chromium 120+ and WebKit 17+", with the
  Popover API as the newest feature; T044's README test pins it).
- Below the floor a tooltip shows nothing and throws nothing (R-10's guard, the "No Popover API" row), and its trigger
  keeps its own name (FR-037), so nothing essential is lost.

## Green (T047 to T049, T051)

- Green commit `561c58e`: the two tokens, `src/ocelle-tooltip.ts`, the internal `src/bubble.ts` (the hooks the overlays and
  the tooltip share without importing each other, so `ocelle-tooltip.js` defines no `ocelle-icon` and the overlays no
  tooltip), the overlay base's hide-on-open call and topmost-overlay hook, the export, entry point, manifest, README
  and CHANGELOGs, the delay override in `stories-layout.css`, the stories, the baselines and the plant lines. The
  gates' Stryker comments that quote the renamed integration test titles name 88 story-themes (comment text only).
- `ca2da97`: rows my own review of the source asked for before mutation (each passing on `561c58e`).
- The tooltip's projects at green: `elements`, `elements-touch`, `elements-browser` (tooltip files) 189 passed;
  `elements-node`, `tokens` 395 passed; `tokens-browser`, `elements-build` 48 passed; the 18 story tests passed.
  `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:manifest` (5 elements), `gate:csp`,
  `gate:prefix`, `gate:config-copies`, `gate:contrast`, `gate:brand-rules`, `gate:pins`: no finding.

## Mutation (T049)

`gate:mutation -- --base 78fe475 --plan`, then one `gate:mutation -- --base 78fe475 --files <entries>` run per planned
shard, the gate and `stryker.elements.config.json` as committed (`dryRunTimeoutMinutes` 30), each run's output in
`mutation.log`. `.github/workflows/ci.yml` is unchanged (op 015 owns CI's `mutation-shard` limit).

**Run time and the dry run.** The gate prints no Stryker output when Stryker completes, so Stryker's own dry-run
figure is not in the logs. An elements shard with no mutant on its lines (shards 9 and 10 of the first plan, the
tooltip's CSS) takes 448 s from start to exit: setup, the TypeScript checker and the dry run of every in-process row
of `elements` and `elements-touch` (the dialog's, the drawer's and now the tooltip's). That bounds the dry run well
under the 30-minute limit, so nothing goes to the operator under R-15. A shard with mutants took 467 to 964 s here.
The six shards of gate files (comment-only changes) take 55 to 59 s each under `stryker.config.json`.

### The first runs (`ca2da97`, plan of 21 shards)

| Shard | Entries | Mutants on changed lines | Survived, NoCoverage | Timeouts | Compile errors | Exit | Time |
|---|---|---|---|---|---|---|---|
| 1 to 6 | the gate files (Stryker comment text only) | 0 (zero-mutant entries) | 0 | 0 | 0 | 0 | 55 to 59 s |
| 7 | `visual-host.ts:180-207`, `capture.ts`, `bubble.ts`, `index.ts`, `ocelle-tooltip.ts:1-30` | 5 | 0 | 0 | 5 | 0 | 876 s |
| 8 | `ocelle-tooltip.ts:31-60` | 21 | 2 | 0 | 4 | 1 | 905 s |
| 9, 10 | `ocelle-tooltip.ts:61-120` (CSS) | 0 | 0 | 0 | 0 | 0 | 448 s each |
| 11 | `:121-150` | 2 | 2 | 0 | 0 | 1 | 467 s |
| 12 | `:151-180` | 3 | 3 | 0 | 0 | 1 | 515 s |
| 13 | `:181-210` | 3 | 0 | 0 | 3 | 0 | 516 s |
| 14 | `:211-240` | 22 | 4 | 0 | 4 | 1 | 584 s |
| 15 | `:241-270` | 31 | 5 | 0 | 4 | 1 | 537 s |
| 16 | `:271-300` | 49 | 3 | 0 | 20 | 1 | 561 s |
| 17 | `:301-330` | 31 | 2 | 0 | 18 | 1 | 536 s |
| 18 | `:331-360` | 22 | 2 | 0 | 9 | 1 | 527 s |
| 19 | `:361-390` | 63 | 3 | 0 | 7 | 1 | 666 s |
| 20 | `:391-420` | 54 | 1 | 1 | 15 | 1 | 540 s |
| 21 | `:421-448`, `overlay.ts`, `source.ts` | 48 | 7 (one NoCoverage) | 1 | 15 | 1 | 964 s |

`overlay.ts` (the hook calls), `bubble.ts`, `index.ts` and `source.ts` had no survivor. How each finding was resolved
(lines are `ca2da97`'s): rows in `0020dab`,
written from the spec and passing on the source of the time, and the source change `1f91513`.

| Finding (`ca2da97` lines) | Code | Resolution |
|---|---|---|
| `:38` StringLiteral `endsWith("")` | `milliseconds()` reads a value without a unit as 0 | Row: `--ocelle-tooltip-delay: 300` (no unit) shows in the same task, as the overlays read a duration (Phase 2). |
| `:53` ObjectLiteral `{}` | `text: { type: String }` | Equivalent, recorded: `{}` gives Lit's default options, type String's (Phase 2 recorded the overlays' `label` alike). |
| `:136`, `:137` the hook's body; `:211`, `:217` `instances.add/delete` | hide every connected tooltip when an overlay opens | In Chromium the bubble also hides a little later by itself (focus moves into the overlay; the backdrop under the resting pointer gives a `pointerout`), so no row looked at the moment the overlay opens. Row: the trigger-opens rows read, in the overlay `<dialog>`'s synchronous `beforetoggle`, that no bubble is shown (R-10: the hide comes before `showModal()`). The hook now hides the shown bubble only, R-10's "hide current"; the set of tooltips is removed. |
| `:174`, `:176` BooleanLiteral, `:180` StringLiteral | the initial `#hovered`, `#focused`, `#placed` | Removed: the first `slotchange` sets the first two before any event can matter, and any placement key differs from none. |
| `:216` CallExpression | `super.disconnectedCallback()` | Equivalent, recorded (Lit's reactive controllers and async directives; the overlays' record of Phase 2). |
| `:218` CallExpression | `#hide()` on disconnection | Row: the tooltip removed during the delay: no bubble, nothing thrown (without it the timer shows a disconnected popover, which throws). |
| `:255` × 4 | `#inside(relatedTarget) \|\| pointerType === "touch"` | Rows: a synthetic touch `pointerover` with delay 0 shows nothing, a mouse one shows (R-12); moves inside the tooltip, then leaving before the delay: no bubble (without the inside test each move starts another timer, and the first fires after the leave). |
| `:268` CallExpression | `clearTimeout` in `pointerout` | Row: shown by keyboard focus, Escape, then the pointer passes through within 100 ms: no bubble (keyboard focus holds, so the leave does not call `#hide`). |
| `:281` BooleanLiteral | `#focused = false` on `focusout` | The Leave row now also shows the bubble by hover after the keyboard focus left and checks that leaving hides it. |
| `:297` CallExpression | `clearTimeout` in `#show` | Removed: every path that leaves a timer pending ends in `#hide`, which clears it. |
| `:300` ConditionalExpression `shown === this` → false | the already-shown return | Equivalent, recorded: the bubble would hide and show again in the same task, with no frame, event or focus change between. The line is split so the record covers this test alone. |
| `:311` ConditionalExpression | `#hide`'s return when not shown | Row: two tooltips, the first trigger's focus leaving to the page button while the second is shown by hover, then keyboard focus back on the first: one bubble (without the return the first's `#hide` clears the second's record). |
| `:313` CallExpression | `cancelAnimationFrame` | Equivalent, recorded: a loop left running only places a hidden bubble again and hides it again once its trigger is gone. |
| `:336` StringLiteral `join("")`, `:337` ConditionalExpression → true | the placement key | The key is now a JSON array (no string literal); the test that skips an unchanged placement is equivalent, recorded (placing at every frame gives the same coordinates). |
| `:361`, `:363` ArithmeticOperator `+ gutter` | the bottom and right fit | Rows: one pixel short of the exact fit on each side flips (the exact-fit rows of `ca2da97` kill the `>`/`<` mutants). |
| `:380` CallExpression | `#hide()` on a slot change | The slot-change row with a keyboard-focused old trigger now reads the bubble right after the new trigger is slotted: hidden. |
| `:407` Timeout | `while (getElementById(id) !== null)` → `=== null` | The loop never ends (every id it tries is free), so the page hangs: no assertion can kill it, Stryker's time limit is the kill (R-15). |
| `:417`, `:436` Regex `/\s/`, `:436` `?? ""` (NoCoverage) and `each !== ""`, `:435` `trigger === undefined` | reading the ids of `aria-describedby` | One helper reads the ids for `#describe` and `#unlink`, split on single white space, so the `?? ""` and the empty-id filter run on every description (a trigger without the attribute). `trigger === undefined` with a span cannot arise (no trigger, no span); kept for the type. |
| `:437` StringLiteral `join("")` | the host's remaining ids | Row: host ids "x y" give "x y <id>" with `describes` and "x y" again without it. |
| `:421` Timeout | `takeRecords()` | Without it the observer reacts to its own `append`, which records again: an endless microtask loop, the page hangs. Stryker's time limit is the kill; R-13 states that the element's own writes are not acted on again. |
| `:433` CallExpression | the observer's `disconnect()` in `#unlink` | Equivalent, recorded: a callback of a stale observation only runs `#describe`, which writes nothing while the description is not wanted or already in place. |

### The final runs (`1f91513`, plan of 22 shards)

After the source change `1f91513` the plan has 22 shards. The gate files of shards 1 to 6 are unchanged since
`ca2da97`, so their first runs (no mutant on their changed lines) stand. Every other shard ran again at `1f91513`;
the test commits after it (`3b6adea`, `19a63c7`) change no source line, so the results of shards 7 to 20 and 22 stand
for HEAD, and shard 21 ran again at `19a63c7`.

| Shard | Entries | Mutants on changed lines | Survived | Timeouts | Compile errors | Equivalent records | Exit | Time |
|---|---|---|---|---|---|---|---|---|
| 7 | the two gate files, `bubble.ts`, `index.ts`, `ocelle-tooltip.ts:1-30` | 14 | 0 | 0 | 9 | 35 (the gate files' process-boundary records) | 0 | 888 s |
| 8 | `ocelle-tooltip.ts:31-60` | 25 | 0 | 0 | 3 | 1 | 0 | 543 s |
| 9, 10, 12 | `:61-120` (CSS), `:151-180` (declarations) | 0 | 0 | 0 | 0 | 0 | 0 | 453 to 456 s |
| 11 | `:121-150` | 5 | 0 | 0 | 4 | 0 | 0 | 475 s |
| 13 | `:181-210` | 17 | 0 | 0 | 3 | 0 | 0 | 536 s |
| 14 | `:211-240` | 19 | 0 | 0 | 3 | 1 | 0 | 582 s |
| 15 | `:241-270` | 24 | 0 | 0 | 4 | 0 | 0 | 509 s |
| 16 | `:271-300` | 39 | 0 | 0 | 10 | 0 | 0 | 521 s |
| 17 | `:301-330` | 34 | 0 | 0 | 16 | 2 | 0 | 550 s |
| 18 | `:331-360` | 30 | 0 | 0 | 18 | 1 | 0 | 540 s |
| 19 | `:361-390` | 66 | 0 | 0 | 9 | 0 | 0 | 699 s |
| 20 | `:391-420` | 32 | 0 | 1 | 11 | 0 | 0 | 563 s |
| 21 | `:421-450` (at `19a63c7`) | 39 | 0 | 1 | 10 | 1 | 0 | 560 s |
| 22 | `:451-457`, `overlay.ts`, `source.ts` | 12 | 0 | 0 | 5 | 0 | 0 | 917 s |

Shard 21 first ran at `3b6adea` with one survivor, `:444` `id === undefined` → false (columns 34 to 50; `3b6adea`'s
message names the trigger test by mistake, and its row of the trigger removed with `describes` set stays as a row).
Without the return, `#unlink` rewrites a trigger's `aria-describedby` when the tooltip has no description, normalising
the host's white space. Row (`19a63c7`): without `describes`, a host `aria-describedby=" x  y "` stays exactly as
written through an update and a slot change (R-13: the tooltip removes only its own id); it passes on the source and
failed with the mutant applied by hand (in process, outside a commit). Shard 21 then exits 0.

**The final runs' Timeout report lines**:

| Report line | Cause |
|---|---|
| `packages/elements/src/ocelle-tooltip.ts:415: mutation: timeout: EqualityOperator: replaced by root.getElementById(id) === null` | The id loop of `#describe` then runs while the id it tries is free, which every id is: it never ends and the page hangs at the first description. No assertion can kill it; Stryker's time limit is the kill (R-15). |
| `packages/elements/src/ocelle-tooltip.ts:429: mutation: timeout: CallExpression: replaced by ;` | `takeRecords()` removed: the observer then reacts to the element's own `append` of the span, which records again, so `#describe` runs in an endless microtask loop and the page hangs. R-13's "its own re-insert is recognised and not acted on again" is that call; Stryker's time limit is the kill. |

**Equivalent-mutant records** (next-line disable comments in `src/ocelle-tooltip.ts`, each with its reason; the gate
lists them as `record` lines):

| Line | Mutators | Why no test can tell |
|---|---|---|
| `text: { type: String }` | ObjectLiteral | `{}` gives Lit's default options, type String's (attribute `text`, the default converter, not reflected). |
| `super.disconnectedCallback()` | CallExpression | Lit's own disconnection serves reactive controllers and async directives; the tooltip uses neither (the overlays' record of Phase 2). |
| `if (shown === this) return;` in `#show` | ConditionalExpression | `false`: a bubble already shown hides and shows again in the same task, with no frame, event or focus change between, so nothing sees it. (`true`, which every show row kills, shares the mutator.) |
| `cancelAnimationFrame(this.#frame)` | CallExpression | A loop left running after the hide only places a hidden bubble again, and hides it again once its trigger is gone: nothing is painted or dispatched. |
| `if (placed !== this.#placed)` | ConditionalExpression | `true`: placing at every frame gives the same coordinates; the test only spares the work. (`false`, which the following rows kill, shares the mutator.) |
| `this.#observer.disconnect()` in `#unlink` | CallExpression | A callback of a stale observation only runs `#describe`, which writes nothing while the description is not wanted or already in place. |

No survivor or NoCoverage mutant is left on a changed line. T049 is done.

## Stories and baselines (T051, T052)

- `storybook/stories/tooltip.stories.ts`: the nine stories of data-model § Stories, each inside `<div
  data-story="tooltip">`, each with `parameters.ocelle.pointer.hover` on `#tooltip-trigger`. `gate:storybook-build`:
  built 44 stories. T050's story tests: 18 passed.
- Baselines produced in the pinned container with `pnpm run visual:update` (docker): 22 files written, 18 added (the
  tooltip's) and 4 changed: `tokens--size.light.png`, `tokens--size.dark.png`, `tokens--motion.light.png` and
  `tokens--motion.dark.png`, because those Tokens stories list every size and motion token and now show
  `--ocelle-tooltip-max-inline` and `--ocelle-tooltip-delay` (T047); the pull request must say so (constitution V).
  No cross-engine (podman) comparison was possible in this container: only docker is available (`gate:visual`
  reports "docker only: no cross-engine comparison"). CI's captures win over these.
- `gate:visual`: 88 captures match their baselines.
- `fail-token-changed`: measured in the pinned container by `gate:plants -- --shard 16` before the lines were added
  (9 unexpected `differs`: every tooltip story in light; the tooltip's painted box is on the chrome ground, but each
  story's text is `color-ink`), then the nine lines added (and the plant's `why` counted again: 41 light
  story-themes); shard 16 then judged every plant as expected.
- After the source change `1f91513` (after the baselines): `visual:update` wrote 0 files, `gate:visual` 88 captures
  match, `gate:axe` the same result as below; no light story-theme changed, so shard 16 was not run again.

### axe: open for the operator (R-16)

`gate:axe`: **2 findings in 88 story-theme runs**: `elements-ocelle-tooltip--long-text/light` and `/dark`,
`color-contrast-incomplete: serious: ocelle-tooltip >>> .box`, the long-text story's painted bubble. axe's reason,
read with axe-core 4.14 on the built Storybook in a probe outside the repository (1280 × 800, reduced motion, the
mouse on the trigger as the gate moves it): `elmPartiallyObscuring`, "Element's background color could not be
determined because it partially overlaps other elements". The long bubble (288 × 91 px) lies over the story's
paragraphs above the trigger and crosses their boxes. The other eight tooltip stories have no finding: their bubbles
lie in empty space or wholly inside one line box (the `rtl` ones). T052 and R-16 say a `color-contrast-incomplete`
node stops for the operator, so the story is left as data-model § Stories states it and the finding is the
operator's. Measured, for the decision only (a scratch change of the page in the probe, not of the repository):
with the trigger placed later in one long paragraph, so that the bubble lies wholly inside that paragraph's box, axe
reports no incomplete result for the bubble. Options I see, not chosen:

- (a) re-lay the long-text story's markup so the bubble lies wholly inside one element's box (as measured above), no
  new layout rule and no exception;
- (b) a text-free spacer block in the story, sized by its own `[data-story="tooltip-…"]` rule in
  `stories-layout.css` (as the operator decided for the overlays' scroll edges), so the bubble overlaps no text;
- (c) an `a11y-exceptions.json` entry with a Complexity Tracking row, which T052 excludes ("no new
  `a11y-exceptions.json` entry").

T052 stays open until that decision; after it, the baselines, `gate:visual`, `gate:axe` and shard 16 run again.

### Plants

`gate:plants -- --shard 16` (`visual/fail-token-changed`, `fail-websocket`, `fail-xhr`): every plant as expected after
the nine lines. `--shard 19` (`visual/pass-repository`, `pass-second-render`, `pass-unused-face`): every plant as
expected. `--shard 27` (`axe/pass-excepted-shadow`, `pass-minor-only`, `pass-repository`): 3 problems, each the open axe
finding above (the planted repositories hold the repository's stories, so each run finds the long-text story's two
`color-contrast-incomplete` nodes). The full `gate:plants` was not run (the brief: only the shards these changes
touch); the other shards are left to CI.
