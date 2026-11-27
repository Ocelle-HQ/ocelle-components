---
phase: 3
round: 1
verdict: approved
base: f74dec851e763bb8c19533ac4118bec79457d6d0
head: e9e7380f8543e123adda51e1ba5de1de7dde5b26
tdd_check: pass
---

# Phase 3 review, round 1

User Story 2, `ocelle-metric`. Change reviewed: `git diff f74dec85..e9e7380f` (scaffold `3e4c0390`, red `9a166398`,
green `e9e7380f`); no uncommitted change other than the untracked `tdd-check.json` and `check-*.log` committed with this
review.

## Findings

No blocking finding. The seven departures the implementer raised in `notes.md` § Points for the review are judged
below (R1-01 to R1-07); each is a note.

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | packages/elements/test/scenarios/metric.ts:82-85; packages/elements/test/browser/fixtures/metric.html:7 | **Bodies mount with base.css.** Every US2 body mounts with `base: true` and the fixture links base.css, because without it the dark theme has no dark ground and axe reports the dark eyebrow colour on white. Neither checks.md nor the plan says the bodies run without base.css, and `facts-base.html` is a precedent. What base.css could mask, the value's family and the texts being drawn with no consumer CSS, is still read without base.css by SC-001's metric row (packages/elements/test/scenarios/consumers.ts:41-66, `driver.mount` with no `base`), in light and dark. Accepted. | None. |
| R1-02 | note | packages/elements/src/ocelle-metric.ts:50-53; research.md R-05 ("the family inherited from the base styles") | **The element sets its own family.** `.metric { font-family: var(--ocelle-font-sans) }` departs from R-05's wording, but meets FR-023 (Schibsted Grotesk) more strongly: the family holds with no base.css, as SC-001's row pins (`family: fontSans`). It is a token, so constitution II holds, and eight other elements already set `--ocelle-font-sans` in their own styles (`ocelle-fact.ts`, `ocelle-facts.ts`, `ocelle-empty-state.ts`, `ocelle-section-header.ts`, among others). A host's own `font-family` no longer reaches the metric except through `::part()`, which the brand rule (no other family) does not ask for anyway. | None for this phase. R-05's sentence could be brought in line when research.md is next touched. |
| R1-03 | note | packages/elements/src/ocelle-metric.ts:61-70, :101-104; research.md R-05 | **The eyebrow's styles are split.** R-05 puts all five eyebrow declarations on the `.eyebrow` span; the element puts size, weight and tracking on the `dt` (so the term's line box is the eyebrow's, not a 16 px strut) and the uppercase transform and colour on `.eyebrow` alone. The observable contract is unchanged: US2-1 reads all four tokens, the uppercase transform and the family on `.eyebrow` (scenarios/metric.ts:62-72, :165) and `text-transform: none` on `.written` (:175); US2-2 reads the term named as written. The `.written` copy now also inherits the eyebrow size, weight and tracking, which has no visible effect (its box is 0 × 0, pinned at :199). The plant "upper-case on `dt`" fails nine bodies (notes.md). Accepted. | None. |
| R1-04 | note | packages/elements/src/ocelle-metric.ts:96-99 | **Empty inline-block in `row`.** `.layout-row dd::before { content: ""; display: inline-block }` gives an empty `dd` in a baseline-aligned flex row a line box, so FR-024's "keeps the one-line value height" holds in `row` (US2-5, scenarios/metric.ts:265-294, `row.twinHeight`, `row.valueHeight`). It adds no text: the US2-5 tree reads no text under the definition (`treeOf(…, "")`) and find in page reads two matches per label. `content: ""` and `display: inline-block` pass `gate:style-lint` (tokens-only rule). The plant that removes the rule fails US2-5. `dd { min-block-size: 1lh }` stays as R-05 has it. Not in R-05, but it implements an FR the R-05 rule alone does not meet in `row`. Accepted. | None. |
| R1-05 | note | packages/elements/test/scenarios/metric.ts:150-154, :340-368; contracts/checks.md:65 (§ US2 bodies, US2-7) | **The `min-inline-size: 0` twin's flex row is 120 px, not 220 px.** checks.md's twin reads "a twin with `min-inline-size: 0` on the host in the flex row", i.e. the 220 px row. The implementer's reason holds by the flex shrink rule: shrink is shared by flex basis, so in `row` layout the metric (basis ~88 px: "OPEN" + 8 px gap + "12345") beside the ~290 px name loses only ~37 px of the 158 px deficit and stays ~51 px, wider than its longest word; at 220 px the twin could not show the README's claim in `row`. At 120 px it is shrunk below its word in both layouts with every character inside. The main US2-7 assertion (one line each, at least the longest word) keeps the 220 px row as checks.md sets it, and the long-word twin keeps the 100 px block. The twin still proves what it is for (the README's `min-inline-size: 0` rule is effective). The departure is recorded in notes.md but checks.md is not amended. | None for this phase. The orchestrator may record the 120 px reading in checks.md § US2 bodies (or the phase-3 record) so the contract and the test say the same. |
| R1-06 | note | packages/elements/src/ocelle-metric.ts:116, :125; packages/elements/custom-elements.json (`ocelle-metric`); contracts/elements-status.md § `ocelle-metric` (Default `""`) | **Manifest defaults `undefined`.** `label` and `displayValue` are declared `@default undefined` where the contract table writes `""`. Unset and empty render the same (US2-5 and the label's twin read both: empty term, no placeholder, same tree). This is the same reading phase 2's round 1 accepted as R1-01 for the indicator, and the repository convention for reflected optional properties. `layout` declares `"stack"` as the contract does. | None for this phase (same follow-up as phase 2 R1-01: amend the contract's Default column or record the reading). |
| R1-07 | note | gates/plants/visual/fail-token-changed/plant.json:3, :644-651; specs/018-status-elements/reviews/phase-3/plants.md | **`fail-token-changed` lines not measured by a plant run.** The plant gains `elements-ocelle-metric--stack/light` and `--row/light` as `differs`; `--empty-value` is left out because it shows only labels in `color-eyebrow`. The reasoning matches the element: `dd` is `color-ink` (ocelle-metric.ts:106-108) and the empty-value story has no value text (baseline `elements-ocelle-metric--empty-value.*.png` shows labels only). The `why` text says the lines are not yet measured, as phase 2 did. Under `reviews/operator-plants.md` the plant is judged by CI's Plants check on the pull request, not locally; a wrong line would fail that check. Not blocking. | None; CI's Plants check must pass on the pull request. |

## Test quality

- **Red evidence.** `tdd-check.json`: `status: pass`, no problems; red commit `9a166398` (`red-commits`: `phase`), exit 1
  on the tests-only commit; final tests on base exit 2 (`unit-tests: could not run: no test file found`, which tdd-check counts as failing),
  on the scaffold exit 1 (77 of 7933 failed), head exit 0 (7933 passed). The scaffold `3e4c0390` adds only the empty
  `OcelleMetric` class (6 lines, no behaviour, no registration, no test file). The failures on the scaffold
  (`check-final-tests-on-scaffold.log`) are assertion mismatches on missing parts, tree, find matches and counts, and
  `no [part="label"] .eyebrow in the shadow root` from the forced-colours and SC-001 bodies' `computed` reads: the
  element renders nothing, which is the missing behaviour, not a setup error.
- **No weakened test.** `git diff 9a166398..e9e7380f` on the test pathspec changes three files: `storybook/stories/metric.stories.ts`
  (the stories themselves, T033), its copy in the `fail-empty-index` plant tree, and one *added* body in
  `scenarios/metric.ts` ("US2-5, the label's twin", from the first mutation run's survivor at `ocelle-metric.ts:150`).
  Nothing deleted, skipped or loosened. The added body fails on the scaffold in both harnesses (scaffold log lines 83,
  110), so it is not vacuous.
- **Assertions.** Each harness (`metric.test.ts`, `browser/metric.test.ts`) asserts one `toEqual` of observation and
  axe/CSP record against hand-written expectations; no conditional assertion, `skip`, `only` or snapshot. Expected
  token values come from `packages/tokens/test/expected.ts`, not the element source. Geometry uses same-page twins.
  Every "does not" outcome sits beside its positive twin (find in page with `#prose`, empty value with its valued
  twin, unknown layout with the `row` twin, hidden with the visible twin).
- **Coverage of the story.** US2-1 (both themes, structure), US2-2 (both layouts; set by property and attribute), US2-3,
  US2-4, US2-5 (stack, empty, row; and the label twin), US2-6, US2-7 (stack and row, with both twins), find in page,
  forced colours (both palettes), right to left, hidden/no tab stop, SC-001's metric row in light and dark. The metric
  has no events or keyboard model.
- **Plants (T034).** notes.md records nine in-process plants, each failing at least one body, including the two
  checks.md § US2 names (`overflow-wrap: anywhere`; the row's `min-inline-size: 0` removed).
- **Mutation.** `pnpm run gate:mutation -- --base f74dec85…` (run by this review): 30 mutants on the changed lines of 2
  files, none survived; 0 timeouts, 5 compile errors (`ocelle-metric.ts:37`, `:135`, `:136` ×2, `:149`), 1
  zero-mutant entry (`index.ts`); 0 equivalent records. The CSS in the `css` template is not mutated by Stryker; the
  plants above cover its rules.

## Checks run

Node 26 first on PATH, `OCELLE_CHROMIUM_PATH` set; per `reviews/operator-ci-first.md` the fast gates and this phase's
browser, visual and axe tests only, the full suites left to CI.

| Check | Result |
|---|---|
| `gate:typecheck` | no type error |
| `gate:lint` | 469 files, no finding |
| `gate:style-lint` | 44 files, no finding |
| `gate:test-lint` | 347 files, no finding |
| `gate:manifest` | 22 elements, no finding |
| `gate:config-copies` | identical |
| `gate:prefix` | 495 files, no finding |
| `gate:pins` | 5 manifests, no finding |
| `gate:signoff -- --range f74dec85..HEAD` | 3 commits, no finding |
| `gate:csp` (after the elements build) | 47 files, no finding |
| vitest: `metric.test.ts`, `browser/metric.test.ts`, `entry-metric.test.ts`, `entry-root.test.ts`, `exports.test.ts`, `consumers.test.ts`, `test/node`, `test/build`, `gates/test/manifest.test.ts`, `gates/test/integration/{manifest,plant-repo}.test.ts` | 18 files, 905 tests passed |
| `gate:storybook-build` | built 199 stories |
| `elements-stories.test.ts -t ocelle-metric` | 6 passed |
| `gate:visual` (docker; `docker info` checked first) | 398 captures match their baselines (docker only) |
| `gate:axe` | 398 story-theme runs, 0 serious or critical; 10 notes (the existing prose-document exceptions) |
| `gate:mutation -- --base f74dec85…` | none survived (above) |
| `gate:plants -- --affected f74dec85… --list` | exit 0; `note: affected: every plant, by packages/elements/package.json (not mapped)`; 317 of 317 selected, none judged; identical to `plants.md` (base equal to `base.sha`, exit 0) |

`check-head.log` (tdd-check) records the full `pnpm test` at head: 7933 tests passed in 244 files.

**Tasks.** T024 to T034 are ticked. T028 and T030 change no file, as amended at the phase-1 recheck (011's eyebrow
tokens used as merged; no token, so `gate:contrast` and `gate:brand-rules` are not required, contracts/checks.md § Gates
per phase). T031 to T033's work is present (`src/ocelle-metric.ts`, `index.ts`, `package.json` export, manifest and
its eight plant-tree copies, README § `ocelle-metric` with the find-in-page limitation and the `min-inline-size: 0`
rule, CHANGELOG statement and Added line, three stories, six baselines, `fail-empty-index` and `fail-token-changed`).
Nothing outside the phase was changed except the pinned counts the new stories and element move (axe, visual,
storybook-build, plant-repo, manifest gate tests), as T029 asks.

**Constitution.** I: `ocelle-metric`, no event, no I/O, every public member in the manifest (no method, slot, event
or state). II: token-only styles (style-lint clean), no monospace, no new token. III: term and definition, the term
named as written while shown uppercase, no ID reference across the shadow root, forced colours pinned, axe clean on
every story and body, no tab stop. IV: CSP gate and the strict-CSP fixture harness clean. V: stories per state
(`Stack`, `Row`, `EmptyValue`) in light and dark with baselines from the pinned container. VII: CHANGELOG names the
minor addition. VIII: above.

**Plan.** R-05's structure is followed (`dl` > `.pair` > `dt part="label"` with the `aria-hidden` eyebrow and the
`.written` copy, `dd part="value"`; Lit text binding; `break-word`; the row's `min-inline-size: 0`; `min-block-size:
1lh`; `:host([hidden])`), with the departures of R1-02 to R1-04, each recorded by the implementer and each meeting the
FR it serves.

## Earlier findings

None: this is the first round of phase 3.
