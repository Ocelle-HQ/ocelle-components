# Recheck of the plan and tasks against `main` as merged (T001, research R-14)

- **Branch:** `claude/013-data-display-2`, after the merge of `origin/main` b594b7e (merge commit 8ee3351; operator
  decision `reviews/main-merge.md`, 2026-11-17). Phase 0's base: 8ee3351 (`reviews/phase-0/base.sha`).
- **Compared:** plan.md, tasks.md, research.md, data-model.md and contracts/ as approved (tasks gate 2070848) against
  the working tree at 8ee3351. Line numbers are those at 8ee3351.
- **Result:** five differences, each a question for the operator in § Questions below (Q1 to Q5). Phase 1 (T003) does
  not start until they are answered. One mechanical difference, the driver helper names, is resolved by T001 itself:
  `contracts/checks.md` § Harnesses and § Keyboard bodies now name the merged helpers (item 5).
- **Second pass** (after the operator's decisions, `reviews/recheck-decisions.md`, applied in 827b34a): one difference
  remains, Q6 in § Second pass below.
- **Third pass** (after the operator's decision Q6 (a), applied in b282a98 and 0d57425): no difference remains
  (§ Third pass below). T001 is done.

## 1. 009's overflow-region module

- **As planned** (research R-02, R-03, R-07, R-14; tasks T001): `packages/elements/src/overflow-region.ts` exports
  `OverflowRegion`, `overflowRegionStyles`, `resolveName` ("blank counts as absent") and the pure helpers; options
  `box`, `role` (default `"group"`), `step` (default 40); `setLabel`; outputs `overflowing`, `offStart`, `offEnd`,
  `fadeStart`, `fadeEnd`, `fadeAttribute`, `name`; classes `region-frame`, `region-box`, `region-track`, `region-ring`,
  `region-edge`; `.region-track { inline-size: max-content; min-inline-size: 100% }` (which R-03 overrides with
  `:host .region-track { inline-size: fit-content }`); `.region-box { border: 0 }` with block padding and no inline
  padding; the `data-fade` mask rules on `--ocelle-scroller-fade-size`; `slotchange` heard on the box; a README
  conventions entry.
- **As on `main`:**
  - exports: `EdgeState`, `Span`, `ClearanceBox`, `ClearanceInput`, `Clearance` (types, lines 14 to 46),
    `edgeState` (53), `clearanceScroll` (65), `resolveName` (90 to 96: host `aria-label` trimmed and non-blank first,
    else the trimmed non-blank label, else undefined), `OverflowRegionOptions` (99 to 106), `overflowRegionStyles`
    (117 to 222), `OverflowRegion` (261);
  - constructor (304 to 311): `role` `options.role ?? "group"` (307), `step` `options.step ?? 40` (308); the
    per-instance sheet `#sheet` (286), `replaceSync(".region-box {}")` (309), its `mask-size` written by
    `setProperty` (424), adopted in `hostConnected` (334);
  - `setLabel(label)` (323 to 326); outputs `overflowing`, `offStart`, `offEnd`, `fadeStart`, `fadeEnd` (266 to 278),
    `name` (280), the getter `fadeAttribute` (314 to 317);
  - `.region-frame` (118), `.region-box` (123 to 129: `overflow-x: auto`, `border: 0`, `padding-block:
    calc(var(--ocelle-focus-offset) + var(--ocelle-focus-width))`, no inline padding), `.region-track` (131 to 136:
    `inline-size: max-content; min-inline-size: 100%; box-sizing: border-box; padding-inline: calc(focus-offset +
    focus-width)`), `.region-ring` (146), `.region-edge` (160 to 172: `inline-size: var(--ocelle-scroller-fade-size)`);
  - mask rules inside `@media not (forced-colors: active)` on `data-fade="start" | "end" | "both"`, mirrored under
    `:host(:dir(rtl))` (174 to 200); forced-colours edge lines in `CanvasText` (202 to 221);
  - `slotchange` listened on the box (384), released with the box (396); the observer watches the box's border box and
    the track (375, 378);
  - README § Element conventions, **Overflow region** (`packages/elements/README.md` 1322 to 1348): inputs, outputs,
    effects, lifecycle, structure ("The host may put its own content model inside `.region-track`, and add rules for
    the track and its slotted children in its own styles", 1339 to 1342), and what a using element does not do
    (1343 to 1345).
- **Difference: none.** The ring room is 5 px (`focus-width` 3px + `focus-offset` 2px,
  `packages/tokens/src/source.ts` 175 and 176), as R-07 assumes. R-03's override is a rule for the track in the
  element's own styles, which 1339 to 1342 allow.

## 2. 009's pinned-start option (research R-17)

- **As planned:** if the module has the option, phase 1's caption is sticky through it at `inset-inline-start: 0`
  (T016's conditional item); if not, the caption is not sticky (Q-F (b)) and the request stays open.
- **As on `main`:** `OverflowRegionOptions` (overflow-region.ts 99 to 106) has `box`, `role` and `step` only; the
  README's inputs (1326 to 1328) list the same; nothing in `packages/` or `specs/009-workflow-layouts/` names a pinned
  start box.
- **Difference: none.** The option is absent, so the caption is not sticky (Q-F (b)), T016's conditional item resolves
  to "none", and the request to 009's owner stays open with the operator.

## 3. Tokens (`packages/tokens/src/source.ts`)

- **As planned** (spec FR-006, research R-06, R-13; tasks T006 US1-3, T017, phase 1 Independent Test;
  contracts/styles-data-table.md row 25): column headers `--ocelle-font-size-xs`, `--ocelle-font-weight-medium`
  (Q-B (a)), uppercase, `letter-spacing: var(--ocelle-tracking-caps)` ("from 009"), `--ocelle-color-ink-muted`; "if
  011's or 012's eyebrow tokens are on `main` when the phase starts, the headers use them instead and the plan records
  it" (FR-006, SPEC-3-04). Also used: `--ocelle-measure-container`, `--ocelle-scroller-fade-size`, `--ocelle-size-dot`,
  `--ocelle-size-step`, `--ocelle-ring-step`, `--ocelle-radius-2`, `--ocelle-color-rule`, `--ocelle-color-rule-strong`.
- **As on `main`:**
  - `--ocelle-tracking-caps` does **not** exist. 009 renamed it at landing: "since the merge of 011, 009 uses 011's
    tracking-eyebrow for its uppercase labels and adds no tracking-caps" (`packages/tokens/test/source-table.test.ts`
    99 to 102); `ocelle-workflow-lane.ts` 90 and 112 use `--ocelle-tracking-eyebrow`.
  - 011's four eyebrow tokens exist: `color-eyebrow` (source.ts 48 to 55, `var(--ocelle-color-ink-muted)` in both
    themes, a text declaration on the main grounds, `checked` rows in `packages/tokens/contrast/pairs.json` 29 to 37 and
    198 on), `font-size-eyebrow` (151, `var(--ocelle-font-size-xs)`), `font-weight-eyebrow` (152,
    `var(--ocelle-font-weight-strong)`, 600), `tracking-eyebrow` (153, `0.08em`). `ocelle-page-header.ts` 120 to 142
    and `ocelle-section-header.ts` 118 to 122 use all four; 013's empty-state eyebrow (`ocelle-empty-state.ts` 143 to
    167) uses `font-size-xs`, `font-weight-medium` and `ink-muted` with no tracking.
  - present as planned: `measure-container` (205, `100cqi`), `scroller-fade-size` (168, `var(--ocelle-space-7)`),
    `size-dot` (181), `size-step` (182), `ring-step` (178), `radius-2` (170), `color-rule` (56), `color-rule-strong`
    (57).
- **Difference: yes.** `--ocelle-tracking-caps` is gone, and 011's eyebrow tokens are on `main`, so FR-006's "use
  them instead" applies. 011's eyebrow weight is `strong` (600), which contradicts plan-gate Q-B (a)
  (`font-weight-medium`). → **Q1.**

## 4. 013's README § Element conventions and the `ocelle-facts` pre-upgrade rule

- **As planned** (research R-01, R-02, R-07, R-08; contracts): slotted items by manual assignment, the container module
  importing its item, `wrap="anywhere"` on values only, `static override properties` with `declare` fields and
  `@default undefined`, `:host([hidden]) { display: none; }`, variant rules inside `@media not (forced-colors:
  active)`; the data table's own per-instance constructed sheet, adopted after `overflowRegionStyles`, holding
  `--data-table-box-size` (the measured, unrounded px width) and `--data-table-end-fade` (`var(--ocelle-scroller-fade-size)`
  while the end fade shows) on `.region-track` (R-07; data-model.md rows 19 and 20; plan.md 106 and 107; tasks T016);
  the timeline's and chain's pre-upgrade rules modelled on 013's `:where(ocelle-facts:not(:defined) >
  ocelle-fact:not([hidden]))` and placed as block 3 after block 2 (the prose override), at the end of `base.css`
  (R-06, R-08).
- **As on `main`** (`packages/elements/README.md`):
  - Module and registration (1272 to 1276): "a container module also imports its item element" — as planned;
  - Properties (1278 to 1282): `static override properties`, `declare`, `@tagname`, `@default undefined`, `aria-label`
    in `observedAttributes` without a property — as planned;
  - Slotted items (1305 to 1307) and Identifier wrap (1309 to 1310) — as planned;
  - Styles (1284 to 1294): "plus **at most one** per-instance constructed stylesheet that holds **only px figures the
    element measured from layout**. The per-instance sheet **never holds a value from** an attribute, a property, **a
    token's text** or slotted text … the overflow-region module's mask size and `ocelle-list-detail`'s intrinsic sizes
    are its two uses." These two sentences are pinned word for word by `packages/elements/test/node/readme.test.ts`
    55 to 58. The `:host([hidden])` rule (1290) is as planned. The forced-colours rule is now split: "Variant rules
    that set colours or grounds go inside `@media not (forced-colors: active)` … Variant rules that set layout only
    (size, padding, gap, direction, wrapping) stay outside it" (1291 to 1294); the chain's chip contract already
    keeps its structural rule outside the block and only its colours inside (contracts/ocelle-evidence-chain.md 67),
    so this refinement changes nothing in the plan;
  - no element on `main` combines the module's per-instance sheet with one of its own (`adoptedStyleSheets` in
    `overflow-region.ts` 334, `ocelle-list-detail.ts` 278, `ocelle-tooltip.ts` 231 only; the module's users are the
    scroller, the board and the lane).
  - `packages/styles/src/base.css` 46 to 52: the facts rule sits in the **base layer** (between the code rules and the
    focus ring), and `packages/styles/test/source.test.ts` 49 and 50 pins it inside the `baseLayer` slice;
    `packages/styles/README.md` § Facts before upgrade (107 to 113) documents it.
- **Difference: yes, two.**
  - (a) The data table's own per-instance sheet would be a second per-instance sheet beside the module's ("at most
    one"), and its `--data-table-end-fade: var(--ocelle-scroller-fade-size)` is a token's text, not a measured px
    figure; the README sentences and their pinned test would have to change. → **Q2.**
  - (b) The plan places the records' pre-upgrade rules at the end of `base.css` (block 3); 013's precedent places its
    pre-upgrade rule in the base layer. The rule form is as planned. → **Q5.**

## 5. Test drivers as merged

- **As planned** (plan.md 82 to 84; research R-14; contracts/checks.md § Harnesses and § Keyboard bodies): 013's
  `viewport`, `scrollWidth`, `copy`, `text`, `pressTab`, `focused`, `frames`, `layout`, `computed(id)`,
  `reducedMotion(mode)`; 009's `press`, `tabWalk`, `activeElement`, `focus`, `scrollLeft`, `setScrollLeft`,
  `frameRecord`, `settle`, `computed(target)`, `reducedMotion(on)`; the addition `itemTexts` (R-11). T001 records the
  reconciliation and rewrites checks.md's helper names.
- **As on `main`** (`packages/elements/test/scenarios/driver.ts`; implemented in `test/in-process.ts` and
  `test/browser/driver.ts`):
  - kept unchanged: `viewport` (391), `scrollWidth` (398), `copy` (457), `text` (464), `pressTab` (478), `focused`
    (483), `frames` (493), `layout` (451), `press(key, { shift })` (333), `tabWalk(from, to, backward)` (307),
    `focus(target)` (312), `scrollLeft(target)` (314), `setScrollLeft(target, value)` (316), `frameRecord(target,
    read)` (323), `settle()` (325: two animation frames, then every `ocelle-*` element's `updateComplete`);
  - `computed(target: Target, property)` (259), with `Target = string | { id, inner }` (78): 009's form, of which
    013's `computed(id, …)` is the string case (in-process.ts 304, browser/driver.ts 271);
  - `reducedMotion(mode: ReducedMotion)` (489), `ReducedMotion = "reduce" | "no-preference"`
    (`test/commands.ts` 70): 013's form; 009's boolean form is gone (in-process.ts 577, browser/driver.ts 562);
  - focus readers: 009's deep reader is now **`deepActive()`** (301 to 306), a string such as `"s1 >>
    div.region-box"` (in-process.ts 407, browser/driver.ts 383); **`activeElement()`** (384) is 011's record reader
    (`{ name, id, hosts }`, `test/commands.ts` 51 to 55); `focused()` (013) and `tab(shift)` (382) stay beside them;
  - `itemTexts` does not exist yet (the planned addition).
- **Difference: helper names only.** The plan's "009's `activeElement`" is `deepActive` on `main`; `computed` takes a
  `Target`; `reducedMotion` takes a mode. Resolved by T001 as tasked: `contracts/checks.md` § Harnesses now states the
  merged names and reconciliation, and § Keyboard bodies' US1-13 row uses `deepActive`. plan.md 82 to 84 and research
  R-14 still describe the branches' names, which is true of the branches; they are not changed here (no plan change
  by the implementer). No question.

## 6. `packages/styles/test/source.test.ts` and 003's prose rules (R-06)

- **As planned** (R-06, R-07): `source.test.ts` "lines 192 to 203" pin the prose slice and the last-rule assertion
  (`rules(root).slice(start)` equals `[wrap]`), which each phase's red edits; `base.css` prose rules "lines 127 to 223"
  (shared margin rule, table, `table:focus-visible` "198 to 201", caption "187 to 209", `th, td`, `th`) against R-06's
  restated list, including the shared rule's `margin-block` (SPEC-3-01).
- **As on `main`:** `source.test.ts` 204 to 212 (the prose slice at 204 to 207, the last-rule assertion at 209 to 212,
  same text as before); `base.css`: the shared rule at 139 to 141, the table rule 202 to 208, `table:focus-visible`
  210 to 213, caption 215 to 221, `th, td` 223 to 228, `th` 230 to 235, the wrap rule last (242 to 244). The prose
  rules' text is unchanged (`git diff ce1d9c72 8ee3351 -- packages/styles/src/base.css` touches only the header
  comment, the facts rule and the density hooks); every line moved by +12 (+12 and +10 in source.test.ts). R-06's
  restated list still matches property for property, `margin-block` included.
- **Difference: line citations only** (research R-06 and R-07 cite the old lines; the content they cite is unchanged).
  → **Q4.**

## 7. Op 016 and the story commands

- **As planned** (tasks § Plants, R-15): `pnpm run gate:plants -- --affected <base>` and `--list`; the
  `reviews/phase-<N>/plants.md` form; `plants_command` in `story-config.yml`; the story implement, review and fix
  commands.
- **As on `main`:** `ops/016-plants-affected/op.md` 21 to 27; `gates/README.md` 67 to 88 (§ A phase's plants:
  `--affected <base>` diffs `<base>` against the working tree plus untracked files, `--list` judges nothing, `note:
  affected:` lines); `gates/bin/plants.ts` 259 to 260; `package.json` `gate:plants` (28); `story-config.yml`
  `plants_command: "pnpm run gate:plants"`; `speckit.story.implement.md` step 9 (the `plants.md` form, identical to
  tasks.md § Plants), `speckit.story.review.md` 56 to 60 (`--list` comparison), `speckit.story.fix.md` 33 to 41.
  `.claude/skills/speckit-story-implement/SKILL.md` matches `speckit.story.implement.md` word for word.
- **Difference: none.** `--affected` diffs trees, so a phase base at or after the merge commit gives the phase's own
  paths only.

## 8. #10's commands and container, and the story test file

- **As planned:** `pnpm run visual:update`, `gate:storybook-build`, `gate:visual`, `gate:axe`;
  `storybook/visual/container.json`; `storybook/README.md` § Baselines and the contributor note;
  `storybook/test/integration/elements-stories.test.ts`.
- **As on `main`:** `package.json` 29 to 32 (`gate:storybook-build`, `gate:visual`, `gate:axe`, `visual:update` →
  `gates/bin/baselines.ts`); `storybook/visual/container.json` (Playwright `v1.64.1-noble`, linux/amd64, digest
  `sha256:ee15712…b1d0`, Node 26.13.0, `chromium_headless_shell-1248`); `storybook/README.md` § Adding stories for an
  element (8), § Baselines (30 to 45: docker or podman, writes new or changed baselines, removes stray ones);
  `storybook/test/integration/elements-stories.test.ts` (one `describe` per element's stories, from 143).
- **Difference: none.**

## 9. The manifest glob and the `exports` map (R-10)

- **As planned:** the generator reads `src/ocelle-*.ts`, so `src/timeline-time.ts` stays internal; `exports` lists one
  `./ocelle-<tag>.js` per element.
- **As on `main`:** `packages/elements/custom-elements-manifest.config.mjs` `globs: ["src/ocelle-*.ts",
  "src/overlay.ts"]` (008 added its internal base, which `scripts/manifest.ts` 128 drops); `packages/elements/package.json`
  `exports` lists `.`, the eighteen `./ocelle-*.js` element modules, `./browser.js` and `./custom-elements.json`.
- **Difference: none.** `src/timeline-time.ts` matches neither glob and is not exported.

## 10. Mutation (#23, op 015)

- **As planned:** `pnpm run gate:mutation -- --base <phase base>` under #23's rules and op 015's shard time limit.
- **As on `main`:** `gates/bin/mutation.ts` 93 to 140 (`--base <sha>` required, `--plan`, `--files`);
  `ops/015-mutation-shard-timeout/op.md` 15 to 34 (shards naming `packages/elements/src/` get the CI-measured limit,
  at least 45 minutes; others 10 minutes).
- **Difference: none.**

## 11. The history fold after the merge (`tooling/speckit/bin/fold-history.sh`; op 021 not on `main`)

- **As planned:** `/ocelle-run` folds each approved phase with `fold-history.sh <FB> <feature-dir> phase-N`, `FB` the
  latest remap commit or the phase's `base.sha`; `/ocelle-land` folds once more from the latest remap commit or the PR
  base. `.claude/skills/ocelle-run/SKILL.md` step 3.1: "no merge commits on the branch (never merge `main` during a
  run; `/ocelle-land` does that)"; `.claude/skills/ocelle-land/SKILL.md` step 8.1: "no merge commits since the PR base
  (the script refuses them; fold before merging `main`)".
- **As on `main`:** `fold-history.sh` 33 refuses when `git rev-list --merges <base>..HEAD` is not empty ("history has
  merge commits; fold before merging main"). Any other check (ancestry, 32 and 39; trees; the remap) is merge-blind.
  Tried in a scratch clone of this branch with two extra commits after 8ee3351:
  - base b594b7e (`main`, the PR base after the merge): refused, "history has merge commits";
  - base 55fb94e (the pre-merge tip): refused, same;
  - base 8ee3351 (the merge commit, phase 0's `base.sha`): `ok`, two commits folded, remap commit made.
  So every fold whose base is 8ee3351 or later works; every phase `base.sha` of this mission is 8ee3351 or later.
  The landing fold works from the latest remap commit (after the merge), and is refused from the PR base. Op 021 (#51)
  is not merged and is not in this tree, so its changes could not be checked.
- **Difference: yes.** The script works for this mission's phase folds, but the run skill's step 3.1 ("no merge
  commits on the branch") is false of the branch now, and a landing fold from the PR base (rather than a remap commit)
  would be refused. → **Q3.**

## Questions for the operator

**Q1. Column headers: which eyebrow tokens?** (`--ocelle-tracking-caps` no longer exists; 011's eyebrow tokens are on
`main`, item 3.) Effect: spec FR-006 and US1 text, research R-06 (table and prose override) and R-13, contracts
styles-data-table.md row 25, tasks phase 1 Independent Test, T006 US1-3, T017, the pairs checks
(`data-table-pairs.test.ts`: `color-eyebrow` or `ink-muted`).
- (a) All four of 011's eyebrow tokens, as `ocelle-page-header` and `ocelle-section-header` do:
  `--ocelle-font-size-eyebrow`, `--ocelle-font-weight-eyebrow` (strong, 600), `--ocelle-tracking-eyebrow`,
  `--ocelle-color-eyebrow`. Replaces Q-B (a)'s weight with strong.
- (b) 011's size, tracking and colour tokens (`font-size-eyebrow`, `tracking-eyebrow`, `color-eyebrow`), keeping
  Q-B (a)'s `--ocelle-font-weight-medium`.
- (c) The plan's tokens as decided (`font-size-xs`, `font-weight-medium`, `ink-muted`) with only
  `--ocelle-tracking-caps` replaced by `--ocelle-tracking-eyebrow` (0.08em).

**Q2. The data table's own per-instance sheet against the README Styles convention** (item 4 (a)). Effect: R-07,
data-model.md rows 19 and 20, contracts/ocelle-data-table.md 55 to 61, plan.md 106 and 107, T016, the README and
`test/node/readme.test.ts` 55 to 58 in phase 1.
- (a) Amend the convention in phase 1 (README 1284 to 1289 and its pinned test): an element that uses the overflow
  region may hold one sheet of its own beside the module's, and the data table's sheet may hold the end fade as
  `var(--ocelle-scroller-fade-size)`; the plan stays as written.
- (b) Keep "px figures only": the own sheet holds only the measured `--data-table-box-size`; the end fade becomes a
  shadow attribute on `.region-track` set and removed in the same deferred animation frame, with a static rule
  `:host .region-track[data-end-fade] { --data-table-end-fade: var(--ocelle-scroller-fade-size); }`. The convention
  is amended only for "a second sheet beside the module's".
- (c) Keep "px figures only" by measuring: the deferred frame writes the end fade as the `.region-edge.end` element's
  measured px width (the fade depth from layout). The convention is amended only for the second sheet.

**Q3. History folds after the merge** (item 11).
- (a) Proceed: every fold base is a phase `base.sha` or a remap commit, all after 8ee3351, which the script accepts;
  read `/ocelle-run` step 3.1 as "no merge commit after the fold base", and land from the latest remap commit, never
  the PR base. Recorded in `reviews/main-merge.md` by the operator.
- (b) As (a), and fold phase 0 too, so a remap commit after the merge exists before phase 1 and the landing fold
  always has one.
- (c) Implement and review the phases, but hold every fold until op 021 (#51) is on `main` and merged here.
- (d) Do not fold this mission's phases (keep the unfolded history at each "fold phase N" gate).

**Q4. Stale line citations in research R-06 and R-07** (item 6; content unchanged, every line +12, source.test.ts
192 to 203 now 204 to 212).
- (a) The planner updates the citations in a documentation commit before phase 1.
- (b) Leave them; this record maps old to new lines, and the review reads them through it.

**Q5. Where the records' pre-upgrade rules go in `base.css`** (item 4 (b)). Effect: R-06's per-phase edits of
`source.test.ts`, R-08, T035 and T059.
- (a) As planned: block 3 at the end of `base.css`, after the prose override; phases 2 and 3 extend the last-rule
  assertion.
- (b) Beside 013's facts rule in the base layer, in `source.test.ts`'s `baseLayer` slice; the last-rule assertion
  then ends at block 2 from phase 1 on.

## Second pass: the artifacts after the operator's decisions (827b34a)

- **Decisions:** `reviews/recheck-decisions.md` (human:jeroennouwsdev, 2026-11-17): Q1 (a), Q2 (c), Q3 (a), Q4 (a),
  Q5 (b). **Applied:** 827b34a (`reviews/recheck-fixes.md`). **Compared:** spec.md, plan.md, research.md,
  data-model.md, tasks.md, quickstart.md and contracts/ at 827b34a against the working tree (sources unchanged since
  8ee3351; `git diff 8ee3351 827b34a` touches `specs/019-data-records/` only).

| Item | Check at 827b34a | Result |
|---|---|---|
| 1. Overflow-region module | unchanged by the decisions; R-07 now cites `overflow-region.ts` 160 to 164 (`.region-edge { inline-size: var(--ocelle-scroller-fade-size); block-size: 0 }`, so the edge is laid out in every state) and the module's own read of the fade depth as `edge.getBoundingClientRect().width` (`#onFocusIn`, 490 to 498, `fade:` at 497): both as on `main` | none |
| 2. Pinned-start option | unchanged (absent; caption not sticky, Q-F (b)) | none |
| 3. Tokens (Q1 (a)) | spec FR-006, US1-3 (164 to 168), the Q-B lines (72 to 73, superseded), research R-06, R-13, Q-B (840 to 844), plan § Decisions after the recheck 1 and plan-gate item 3 (superseded), contracts/styles-data-table.md column-header row, tasks T006 US1-3 (204), T017 (268) all name `--ocelle-font-size-eyebrow`, `--ocelle-font-weight-eyebrow`, `--ocelle-tracking-eyebrow`, `--ocelle-color-eyebrow`, which are `source.ts` 48 to 55 and 151 to 153 (weight `var(--ocelle-font-weight-strong)`); `--ocelle-tracking-caps` remains only in the verbatim spec Input (16), the recheck's own scope lists (tasks.md 142, plan.md 325, research R-14) and statements that it is gone, as recheck-fixes § Notes says | none |
| 4 (a). Per-instance sheet (Q2 (c)) | data-model.md row 20, research R-07 (292 to 300 and § "The README's Styles convention" 364 to 378), plan.md 113, 143, 208 to 213, contracts/ocelle-data-table.md § Shadow structure (54 to 67), contracts/styles-data-table.md row 25, contracts/checks.md 107, quickstart.md 39, tasks T007, T013, T016, T021, T024: the end fade is the measured px width of `.region-edge.end`, never the token's text. R-07's "before" sentences match `packages/elements/README.md` 1284 to 1289 and `test/node/readme.test.ts` 57 and 58 word for word; the token's text would compute to `2rem` (`scroller-fade-size` is `var(--ocelle-space-7)`, `space-7` `2rem`, `source.ts` 162 and 168), as checks.md 107 says. **But** contracts/ocelle-data-table.md § Interface, "Base-style hook (analysis I7 (a))", lines 32 to 34, still says: "`--data-table-end-fade` (the end fade's depth, `var(--ocelle-scroller-fade-size)`, while the end fade shows)". It was not in 827b34a's diff and contradicts lines 54 to 67 of the same file and Q2 (c) | **yes** → **Q6** |
| 4 (b). Pre-upgrade rules (Q5 (b)) | research R-06 (221 to 231), R-08 (463), contracts/styles-data-table.md 7 and § Block 3, the timeline and chain contracts § Before upgrade, plan.md 220 to 223 and 275, tasks T035, T043, T059, T066: block 3 in the base layer after `base.css` 50 to 52 (the facts rule) and before the focus rule 55; `source.test.ts` `baseLayer` 31 to 53 with the facts entry at 50, the last-rule assertion 209 to 212 keeping "wrap, block 1, block 2". The base layer's header comment (`base.css` 8) is not pinned by any test, so naming the new rules in it breaks nothing | none |
| 5. Drivers | checks.md § Harnesses (20 to 24) and § Keyboard bodies US1-13 (52) still name `deepActive`, `activeElement()` as 011's record reader, `computed(Target)`, `reducedMotion(mode)` | none |
| 6. Line citations (Q4 (a)) | research R-06: prose rules 139 to 235 (`base.css` 139 shared margin rule, 235 end of `th`), `table:focus-visible` 210 to 213 (211 to 213 the rule, 210 its comment), prose table and caption 199 to 221 (202 to 208 table, 215 to 221 caption); `source.test.ts` 195 to 212 (describe 195, `baseLayer` 31 to 53, its assertion 196 to 198, prose slice 204 to 207, last rule 209 to 212) | none |
| 7. Op 016, story commands | unchanged | none |
| 8. #10's commands | unchanged | none |
| 9. Manifest glob, exports | unchanged | none |
| 10. Mutation | unchanged | none |
| 11. Folds (Q3 (a)) | tasks.md § Folds (49) and § Implementation strategy (465), plan.md § Phases and § Decisions after the recheck 3: fold bases at 8ee3351 or later, which `fold-history.sh` 33 accepts (first pass, item 11); no skill or script changed | none |

**Q6. The data-table contract's base-style hook paragraph still gives the end fade as the token's text**
(contracts/ocelle-data-table.md 32 to 34; the only remaining difference). The implementer does not edit contracts.
Effect: none on the tasks (T007, T016, T024 already follow Q2 (c)); the contract would contradict itself in phase 1's
review.
- (a) The planner changes the parenthesis to "(the end fade's depth, the measured px inline size of `.region-edge.end`,
  while the end fade shows)" in a documentation commit; the implementer then rechecks that line alone and ticks T001.
- (b) The operator accepts the line as a known slip, recorded here, and lets the implementer tick T001 now; the planner
  corrects it with phase 1's first planning fix, and phase 1's review reads lines 54 to 67 as the contract.
- (c) The implementer makes the one-line correction in the T001 commit, under the operator's explicit authorisation,
  and ticks T001.

## Third pass: the Q6 line after the operator's decision (0d57425)

- **Decision:** `reviews/recheck-decisions.md` (6900039): Q6 (a). **Applied:** b282a98 (the parenthesis) and 0d57425
  (rewrap only, no word changed; `reviews/recheck-fixes.md` Q6 row). `git diff bf39e06 0d57425` touches
  `contracts/ocelle-data-table.md`, `reviews/recheck-decisions.md` and `reviews/recheck-fixes.md` only; sources are
  unchanged since 8ee3351.

| Item | Check at 0d57425 | Result |
|---|---|---|
| Q6. contracts/ocelle-data-table.md § Interface, "Base-style hook (analysis I7 (a))", lines 32 to 34 | Now reads "`--data-table-end-fade` (the end fade's depth, the measured px inline size of `.region-edge.end`, while the end fade shows; recheck Q2 (c))": option (a)'s wording, plus the decision's citation. It agrees with § Shadow structure of the same file (lines 54 to 67: px figures only, the edge's unrounded `getBoundingClientRect().width`, never the token's text), contracts/styles-data-table.md row 25, research R-07, data-model.md's "end fade" row and tasks T016; `.region-edge.end` is in `overflow-region.ts` (170, laid out in every state by 160 to 164). The paragraph keeps the 120-column wrap | none |
| Stale text elsewhere | `var(--ocelle-scroller-fade-size)` in specs/019-data-records outside reviews/ now appears only as the cap's zero fallback `0 * var(--ocelle-scroller-fade-size)` (tasks T017, research 327, styles-data-table row 25), as statements that the token's text is never written (plan.md 210, research 298, ocelle-data-table.md 67), as the plant of checks.md 107, the rejected sticky caption of checks.md 108, and 009's own rules (research 299, 811) | none |

T001 is ticked. Phase 0's plant run is recorded in `reviews/phase-0/plants.md`.
