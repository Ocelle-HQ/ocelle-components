---
phase: 2
round: 1
verdict: approved
base: b48309ce699109f445e650f624e8abb196982a73
head: 4f4420284002956b2ca4f4cfb4d36d153252f15a
tdd_check: pass
---

# Phase 2 review, round 1

User Story 1, `ocelle-status-indicator` (T011 to T023). Change reviewed: `git diff b48309ce..4f442028` (6 commits:
scaffold `c082789d`, red `2e6138e3`, green `585492b1`, notes and the unconditional update request `1437302c`, the
operator decision `81cc44ea`, the plant-step close `4f442028`), plus the uncommitted `tdd-check.sh 2` outputs.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | packages/elements/src/ocelle-status-indicator.ts:126, :135; packages/elements/custom-elements.json; contracts/elements-status.md:17-18 | The manifest declares `label` and `pulse` with type `string \| undefined` / `boolean \| undefined` and default `undefined`, where the contract table (and FR-010) give defaults `""` and `false`. Unset, empty and false behave the same (US1-1, US1-3 and the `pulse` reflection body read it), the repository uses both conventions (`ocelle-card` `inset`, `ocelle-button` `href` declare `undefined`), and the implementer raised it under "Points for the review". Not a behavioural gap. | None required for this phase. If the operator wants the contract and the manifest to say the same, amend contracts/elements-status.md's Default column (or record the reading) in a later step. |
| R1-02 | note | packages/elements/test/node/manifest.test.ts:799-800 | The 013 `ocelle-progress` comment now sits above the new indicator test (inserted between that comment and its `it` at :850), so it no longer heads the test it describes. | Optional: move the 018 test above the 013 comment, or the comment down to the progress test, in a later touch of this file. |
| R1-03 | note | specs/018-status-elements/reviews/phase-2/plants.md; notes.md § Story capture | No plant was judged locally, by the operator decision in reviews/operator-plants.md; the new `fail-token-changed` line `elements-ocelle-status-indicator--tones/light` (gates/plants/visual/fail-token-changed/plant.json) is therefore unconfirmed until CI's Plants check runs on the pull request. | None here; CI's Plants check must be green on the PR. |

No blocking finding.

## Test quality

- **TDD check**: `tdd-check.json` status `pass`, head `4f442028` = HEAD, base = `base.sha`; final tests on base exit 2
  (no test file: the modules do not exist), on the scaffold exit 1 (145 failed), red commit exit 1 (146 failed), head
  exit 0; no problem listed.
- **Scaffold** (`c082789d`): adds only `src/status.ts` (types, `statuses = []`, `statusOf` always `"neutral"`) and the
  empty `OcelleStatusIndicator` class with no registration; no test file, no behaviour. The final tests fail against it
  (check-final-tests-on-scaffold.log).
- **Red reasons** (check-red-phase.log, red-phase.log): every failure is on missing behaviour: `statusOf`/`statuses`
  assertion mismatches; the element undefined, so the bodies find no `[part="ring"]`/`[part="dot"]` (`seek`/`advance`
  reject, in-process `Error: empty`); missing tokens, manifest entries, README/CHANGELOG lines, exports and pinned
  counts. No setup or import error. The extra 146th red failure (vitest-mutation-config ordering) is explained in
  notes.md as a consequence of the red token pin and passes in green.
- **No weakening**: `git diff 2e6138e3..HEAD` touches no test, scenario, gate-test or story-test file; every test
  change of the phase is in the red commit.
- **Non-vacuous**: each body returns one observation compared with `toEqual` against hand-written values (sizes from
  `0.5rem`, colours from `expected.ts`'s token table, 1600 ms × 3 = 4800 ms, the spike's measured trees); every "does
  not" is paired with its positive twin in the same body (listed changes vs. a later-task re-set; same-task toggle vs.
  separate tasks; `moveBefore` vs. remove-and-insert; `until-found`/`<details>` vs. a `hidden` twin; the own
  reduced-motion rule vs. its no-preference twin; host `aria-label` vs. the same indicators without it; `hidden` host
  vs. visible twin; unknown tone vs. known). The ternaries in US1-4's frame loop compute the observation, not the
  assertion. No `skip`/`only`, no snapshot, no mock assertion, no swallowed error; axe (in process) and CSP/requests/
  console (fixture) are asserted in the same `expect` as the body.
- **Coverage of the story**: US1-1 to US1-8 each have a body, as do the four start cases of FR-012 (a) to (d), the
  pinned non-start cases (`moveBefore`, `until-found`, `<details>` closed/opened and start cases while closed), FR-013
  (reduce, reduce during a run, the change back), FR-015 (forced colours in both palettes), FR-016 (no `aria-busy`, no
  live region), `dir="rtl"`, the edge cases, SC-001's indicator row (consumers.ts), the entry point, root and exports,
  build, pack, manifest, README rules (i) to (viii), both CHANGELOGs, tokens (expected, generator, browser values,
  brand-rule (f)), and the story ids and pinned counts. The element has no event and no keyboard path.
- **Guard plants (T023)**: the five plants of contracts/checks.md § US1 bodies were each run once and each failed the
  named body (notes.md table); the source was restored (`git status` clean apart from the review evidence).
- **Mutation**: `pnpm run gate:mutation -- --base b48309ce…` (run by me): 47 mutants on the changed lines of 4 files,
  none survived; 0 timeouts, 15 compile errors, 1 zero-mutant entry (`index.ts`, re-export only); 0 equivalent records.
  The earlier survivor the implementer reported (`if (name === "tone")`) is gone since `1437302c` made the request
  unconditional, as `ocelle-brand-mark` does.

## Checks run

Node 26.13.0, `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, dockerd running, at HEAD
`4f442028`:

- `gate:typecheck`: no type error. `gate:lint`: 462 files, no finding. `gate:style-lint`: 43 files, no finding.
  `gate:test-lint`: 341 files, no finding. `gate:manifest`: 21 elements, no finding. `gate:prefix`: 485 files, no
  finding. `gate:pins`: 5 manifests, no finding. `gate:contrast`: 207 pairs light, 215 dark (196 required per theme).
  `gate:brand-rules`: 7 rules checked. `gate:config-copies`: identical. `gate:csp`: 46 files, no finding.
  `gate:signoff -- --range b48309ce..HEAD`: 6 commits, no finding.
- `gate:storybook-build`: 196 stories. `OCELLE_VISUAL_ENGINE=docker gate:visual`: 392 captures match their baselines
  (docker only). `gate:axe`: 392 story-theme runs, 0 serious or critical; 10 notes, the existing prose-document
  exceptions.
- `pnpm test`: `unit-tests: 7870 tests passed in 241 files`, exit 0. (A first run was cut off by my tool's 30-minute
  background limit while still progressing; the rerun, alone, passed.)
- `gate:mutation -- --base b48309ce…`: exit 0, as above.
- **Plants**: `plants.md` base = `base.sha`, recorded exit 0. `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants --
  --affected b48309ce… --list` (exit 0) printed `note: affected: every plant, by packages/elements/package.json (not
  mapped)` and `317 of 317 plants selected, none judged (--list)`, identical to the record. Not judged, per
  reviews/operator-plants.md (R1-03).

Constitution and plan: `ocelle-` name, no event, no I/O; tokens only (`size-indicator`, `motion-pulse`, the colour
pairs, `radius-pill` on the dot and ring as plan decision 3, the literal count 3 by operator decision Q1 (a), no `0s`
literal, own `animation: none` under reduce); naming from `label` alone through `expose` (plan decision 4), no
ID reference across the shadow root; forced colours `CanvasText`; strict CSP and no request on the fixture; stories
`Tones` (with its `pulse` row) and `Labelled` with docker baselines in light and dark; MINOR additions recorded in both
CHANGELOGs. Every task of `## Phase 2:` is ticked and its work is present; no file outside the phase was changed
without a reason (the plant trees' manifests, `fail-empty-index` and `fail-token-changed` follow T021/T022).

## Earlier findings

None: this is round 1.
