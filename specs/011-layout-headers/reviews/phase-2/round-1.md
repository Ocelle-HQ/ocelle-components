---
phase: 2
round: 1
verdict: changes_requested
base: 296e02d1606eb51b2a2f7caa4ac8a1e5cc73ac0d
head: 671196dfb94bd40b99ae12cb50723bd412c8f3a1
tdd_check: fail
---

# Phase 2 review, round 1

Scope: `git diff 296e02d..671196d` (scaffold `05d8571`, red `3829e84`, green `6d9da2f`; `1b9cc98` is operator
decision 3, `671196d` the red/green check outputs). The working tree was clean. Read against spec.md (US1, FR-001 to
FR-018, FR-030 to FR-039), plan.md and research.md (R-04, R-05), tasks.md Phase 2, the constitution, the operator
decisions in `reviews/operator-decisions-implementation.md`, and the implementer's `notes.md` and `plants.md`.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | reviews/phase-2/tdd-check.json | The red/green check reports `fail`, problem "tests fail at HEAD". My own `pnpm test` at `671196d` confirms exactly 5 of 3302 failures, all in `gates/test/integration/visual.test.ts` (lines 115, 126, 239, 251, 271): no docker or podman here. Lines 115, 126, 251 and 271 fail on the missing engine as at the base. Line 239 now fails one assertion earlier, `expected 42 to be 66` (the baseline-file count that the red commit raised from 42 to 66), because the twelve new story-themes have no baselines yet. That is the open T023 baselines part of operator decision 2, not a test that was weakened. Per the skill, a `fail` problem is blocking. It is the same known gap the operator accepted for phase 1 (`reviews/phase-1/operator-accepted.md`). | No code change. This needs an operator accept under decision 2, as for phase 1. The five tests, and the 66 count at line 239, go green once CI's captures are committed at `/ocelle-land`. |
| R1-02 | blocking | packages/elements/src/ocelle-section-header.ts:175-185 (render: the heading column is always rendered); README.md "An empty slot of the section header takes no space" | **FR-005 broken by notes.md departure 6 ("the heading column is never hidden").** A header with empty `heading` and `description` still has a flex item for the heading column in the row. When the actions fit beside it, nothing shows. When the actions are wider than the line minus `--ocelle-space-4`, the row wraps: the empty heading column takes the first line and the actions move to a second line, `--ocelle-space-2` (row-gap) below. Measured on the browser build with `tokens.css`, in a 300 px container in Chromium 1243: `<ocelle-section-header>` with two 140 px `slot="actions"` buttons is 29 px tall, and its actions start 8 px below the host's block start (they should start at 0, and the host should be 21 px tall). With an eyebrow added, the actions start 12 px below the eyebrow (space-1 + space-2) instead of the `--ocelle-space-1` that the FR-005/FR-010 scenario asserts at 1280 px. So two empty slots add a gap, which FR-005 forbids ("An empty slot MUST add no box, padding, gap, margin"), and the README's empty-slot statement is false for this case. No scenario covers it: the "FR-005, FR-010" eyebrow-and-actions scenario (test/scenarios/section-header.ts:368) runs only at 1280 px, where the actions fit. The case is realistic: a toolbar-only header in a card at 320 px (FR-004) with a few actions. | First add a red test: a header with actions but no heading and no description (with and without an eyebrow) whose actions do not fit on one line beside a `--ocelle-space-4` gap, e.g. at 320 px or in a narrow container. It should assert that the first action's block start is the host's (or `--ocelle-space-1` under the eyebrow), paired with a filled twin's gaps. Then fix: for example, hide the heading column while heading and description are both empty, and keep the actions at the inline end some other way (e.g. `margin-inline-start: auto` on the actions wrapper when the column is hidden). Keep FR-010's inline-end outcome and the existing scenarios green. Record it as a `fix-1` red commit. |
| R1-03 | note | commits 1b9cc98, 671196d | `pnpm run gate:signoff -- --range 296e02d..HEAD` reports 2 findings: these two commits have no `Signed-off-by` line. Earlier orchestrator commits (`296e02d`, `26957c5`, `6be5516`) have one. Neither commit is the implementer's work, and the phase checkpoint does not list `signoff`. The gate still fails on the branch range and will fail at the pull request. | Orchestrator: sign off these commits (or record why not) before landing. This is not a change for the implementer. |
| R1-04 | note | specs/011-layout-headers/research.md R-04 vs packages/elements/src/ocelle-section-header.ts:8-11, 79-83 | Departure 4: the actions wrapper keeps `flex: 0 1 auto`, not R-04's `flex: 0 0 auto`. Judged against the spec, this is correct. FR-004 requires parts that stack rather than overflow, and the red "many actions at 320 px" scenario shows that R-04's value overflows. Flex line breaking uses the hypothetical (unshrunk) sizes, so the side-by-side test of FR-010 is unchanged. The plan text now disagrees with the code; the departure is recorded only in notes.md and the source comment. | Record R-04's amended value in research.md or in a plan amendment, so later phases (page header R-07, which reuses R-04) inherit it. |
| R1-05 | note | tasks.md T023; storybook/stories/section-header.stories.ts, card.stories.ts | T023 is unticked: there are no baselines for the twelve stories, and the `visual` gate cannot run here ("no container engine"). Under operator decisions 2 and 3 this is a recorded known gap, not a finding against the implementer. The stories exist: 6 section-header and 6 card stories, covering the sizes, the eyebrow variant, empty and filled slots, both densities, inset, no header and nesting, with no `style` attribute. They render in light and dark and pass the 320 px pass in `storybook/test/integration/elements-stories.test.ts` (green at HEAD), and `gate:axe` reports 66 story-theme runs with 0 serious or critical findings. The `tokens--colour` and `tokens--type` baselines and the `visual/fail-token-changed` plant list are part of the same open item (notes.md § Left open). | Produce them at `/ocelle-land` from CI's captures, as decisions 2 and 3 say. |

Departures in notes.md, judged against the spec:

1. A second order file, `entry-card-order-reverse.test.ts`. Needed because a definition cannot be undone in one
   iframe. Fine.
2. The readme Styles fragment was replaced by the two fragments of the amended convention. This is what FR-001 and
   FR-036 require, and it is stricter. Fine.
3. Driver gains `listen`, `heard` and `move`. Test plumbing that forwards to DOM readers. Fine.
4. The actions wrapper keeps `flex: 0 1 auto`. Consistent with FR-004 and FR-010 (R1-04).
5. Slotted heading, eyebrow and description are `display: block` through normal `::slotted()` rules, which a page
   rule beats. Consistent with FR-008's "a page rule wins". Fine.
6. The heading column is never hidden. This breaks FR-005 when the actions wrap (R1-02).

Constitution and plan: `ocelle-` names. No event: tested for both elements across mount, slot and attribute changes.
No I/O. Tokens only (style-lint, brand-rules and the token-sentinel scenarios). Colour and ground rules sit inside
`@media not (forced-colors: active)` and layout rules outside, with US1-13 tested in both palettes. No ID reference
across a shadow root: headings are slotted. No tab stop (US1-12). No role on the card (US1-19). Strict CSP: the fixture
harness records zero violations and no request per scenario, and `gate:csp` passes. R-05's pull model is as planned:
no state, no export from `index.ts`, local-name matching, and the mixed-copy fixture tested. Entry points, `exports`
order and the manifest match T016a and T022.

## Test quality

- **Red evidence.** `check-red-phase.log` and `check-final-tests-on-scaffold.log` show 226 failures at the red commit,
  all `AssertionError`s on missing behaviour. Examples: the elements undefined in stories (`defined: false`), token
  lists 40/41 and 21/24, contrast counts, the manifest and exports lists, and section-header sizes `24px` against
  `20px`/`18px`. None is a module-not-found or setup error. Two indirect ones are consequences of the red token tests,
  not setup errors: `font.test.ts:158`, where the four new tokens are empty, and
  `vitest-mutation-config.test.ts:147`, where the bail order changes while the source-table test fails. Both pass at
  HEAD. The final tests on the base exit 2 ("no test file found"), which still counts as failing. The scaffold
  (`05d8571`) adds signatures only: `inCompactCardHeader` returns false, `notifyHeaders` returns `[]`, and the two
  bare classes are not defined. It has no test file, and the final tests fail against it (exit 1).
- **No weakening.** `git diff 3829e84..HEAD` on the test pathspecs touches only two plant story files under
  `gates/plants/storybook-build/fail-empty-index/tree/` (story files with no export, part of the plant's design). No
  test, scenario or story was changed after the red commit. The pinned counts changed in the red commit are all
  raises that follow from the new elements and tokens (notes.md T016a table); none was loosened. Visual 42 → 66 and
  axe 42 → 66 are exact counts.
- **Assertions.** Every scenario returns one observation compared with `toEqual` against a hand-written expectation in
  token names. Every "does not" outcome is paired with a positive one in the same body. There are no `skip`, `only` or
  `todo`, no conditional assertions, no swallowed errors and no snapshot-only assertions, and `gate:test-lint` is
  clean. `card-context.test.ts` uses stand-in elements that count `requestUpdate()`. That asserts the unit's
  observable effect on its collaborators, not a mock of the unit.
- **Coverage.** US1-1 to US1-19 each have a scenario in both harnesses, plus FR-006 invalid values for `size`,
  `variant` and `density`, upgrade with no attributes, R-05 transitions (script density, `slot` attribute changes,
  DOM moves), token sentinels, hidden hosts, the border box, no-event checks and the keyboard path (US1-12). The gap
  is R1-02: no narrow-width case for a header without heading and description.
- **Plants (T025).** `plants.md` records 56 style plants and 31 pairing plants, each caught in each harness. The one
  exception, the CSP plant, is fixture-only by design. My `node gates/bin/plants.ts --skip-container` result:
  "253 plants of 17 gates and the registry judged, every plant as expected; partial run: 48 visual plants not run".
- **Mutation.** `pnpm run gate:mutation -- --base 296e02d`: "138 mutants on the changed lines of 6 files, none
  survived; 0 timeouts, 43 compile errors, 2 zero-mutant entries; 2 equivalent records". The two equivalent records:
  - `ocelle-section-header.ts` `#compact = false`: `willUpdate` assigns it before every render, so the initial value
    is never read. Accepted.
  - `gates/bin/contrast.ts` process-boundary record: pre-existing, only its comment's counts updated. Accepted.

  The 43 compile errors (typed literals in `source.ts` and the card and context modules) are reports, not findings.

## Checks run

All at `671196d`, with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.

| Check | Result |
|---|---|
| `pnpm test` | exit 1: 5 of 3302 failed, only `visual.test.ts:115, 126, 239, 251, 271` (R1-01) |
| `gate:typecheck` | pass |
| `gate:lint` | pass (283 files) |
| `gate:style-lint` | pass (16 files) |
| `gate:test-lint` | pass (189 files) |
| `gate:prefix` | pass (243 files) |
| `gate:contrast` | pass: 169 light / 177 dark / 158 required, as the checkpoint states |
| `gate:brand-rules` | pass (7 rules) |
| `gate:manifest` | pass (4 elements) |
| `gate:csp` | pass (21 files) |
| `gate:storybook-build` | pass (33 stories) |
| `gate:axe` | pass: 66 story-theme runs, 0 serious or critical |
| `gate:pins`, `gate:config-copies` | pass |
| `gate:signoff -- --range 296e02d..HEAD` | 2 findings, on the orchestrator commits 1b9cc98 and 671196d (R1-03) |
| `gate:plants --skip-container` | pass (partial: 48 visual plants not run) |
| `gate:visual` | could not run: no container engine (operator decision 2; R1-05) |
| `gate:mutation -- --base 296e02d` | pass: none survived |
| Ad hoc browser probe (browser build and `tokens.css`, 300 px container) | shows R1-02 |

`tdd-check.json` was written at `1b9cc98`; HEAD `671196d` adds only that check's outputs. My full run at HEAD gives
the same result, so I did not run the check again.

## Earlier findings

None: this is round 1.
