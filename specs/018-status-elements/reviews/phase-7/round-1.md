---
phase: 7
round: 1
verdict: changes_requested
base: bd40cf3078bbfd8bd5fee54f9ad82be9f41e96fc
head: f4193195
tdd_check: pass
---

# Phase 7 review, round 1

Under review: `bd40cf30..f4193195`. That is the red commit `50b72071`, the green commit `9e8cfc52`, the operator
decisions `dc1e825b` (Q-P7-1 (a), Q-P7-2 (a)) and the red/green check `f4193195`. There was no uncommitted change.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | specs/018-status-elements/contracts/checks.md:80 (plant column, last plant) | **The corrected reason for the dropped-override plant gets the plant wrong.** The row now names the plant as `.icon-row { align-items: baseline }` alone, placed after the slot convention's styles. It then says the wrappers' block-starts stay equal "since `.icon-slot { align-self: flex-start }` keeps the icon wrapper at the row's start". The element has no such rule. `ocelle-pill-tag.ts` has no `align-self` declaration, and `icon-slot.ts:35-50` has only `.icon-row { align-items: flex-start }` and `.label { align-self: baseline }`. The rule belongs to the plant. Every source the row cites defines the dropped override as the two declarations together, `.icon-row { align-items: baseline } .icon-slot { align-self: flex-start }`: plan.md:174-175 (decision 15's earlier override), reviews/phase-1/spikes.md:63 and :216-217, and reviews/phase-4/notes.md:126 (the plant as run, 4 bodies failed). As written, the row tells the next plant run to apply one declaration and explains the measurement by a rule that run would not contain. The phase was meant to fix this deferred item (phase-4 R1-03), and the fix brings in a new misstatement. | Name the plant as both declarations, `.icon-row { align-items: baseline } .icon-slot { align-self: flex-start }`, in the pill's own styles after `iconSlotStyles`. Say that the block-starts stay equal because the plant's own `.icon-slot { align-self: flex-start }` holds the icon wrapper at the row's start. Keep the rest: the icon-only pill hangs below the line (top −4.00 px, as with `bare` never set), and the sources. This is a records-only fix, so it needs no red test. |
| R1-02 | note | specs/018-status-elements/reviews/phase-7/plants.md:3 | **The plant record's base is phase 2's (`4fc2ed5b`), not this phase's `base.sha` (`bd40cf30`).** The skill counts another base as blocking. Here, though, plan.md:240 and :288 and tasks.md T065 prescribe phase 2's base, so that the run covers the whole feature and not phase 7's documentation-only diff. I reran `gate:plants -- --affected 4fc2ed5b… --list` and got the recorded output: exit 0, "every plant, by packages/elements/package.json (not mapped)", 317 of 317 selected, none judged. Under reviews/operator-plants.md that is a `--list`-only record, and CI's Plants check judges the plants. Against `bd40cf30` the same command selects 0 of 317, so the prescribed base covers the phase's own selection. Accepted as planned. | None. |
| R1-03 | note | packages/elements/test/node/readme.test.ts:1003, :1006 | **Two of the eight new pins pass at the base.** (1) The `slotchange` pin (Q-F1 (c), phase-6 R2-01) passes because phase 6's `5a871ac2` wrote the sentence. Its non-vacuity log is reviews/phase-7/check-slotchange-pin-before-sentence.log, and I reproduced it: with 62b78799's README the file fails 7 of 784, the six red bodies plus this pin, each an `AssertionError` on the missing sentence. The sentence is absent at 62b78799, present at 5a871ac2 and at the base, and the pin text is unchanged since the red commit. (2) The pill's existing "(see Control conventions)" back-link pin (:1006) also passes at the base and at 62b78799, and has no before-run. It is a literal `toContain` in a named section, so it fails if the sentence goes. | None. |
| R1-04 | note | specs/018-status-elements/reviews/phase-7/notes.md (T064 tables) | **Parts of the quickstart are left to CI or to the scenarios.** The by-hand Chromium steps were not done because the session has no interactive browser. Each is pinned by a scenario that passed in the red run. `gate:storybook-build`, `gate:visual` and `gate:axe` were not run locally, as reviews/operator-ci-first.md allows; phase 7 changes no story, style or source. SC-002's 42 baselines are committed (`git ls-files`: 42 PNGs for the three elements, 21 stories × 2 themes), but its axe half is judged by CI. | None locally. CI's Visual, Axe and Storybook checks must pass on the pull request. |

## Test quality

- **Red evidence.** The red commit `50b72071` changes only `readme.test.ts`, tasks.md (T063's text naming the pin) and
  `base.sha`, so the story tests are in the red commit. `red-phase.log` and `check-red-phase.log` each show 6 of 8325
  failing. All six are new bodies of § "the status elements together (018 phase 7)", at readme.test.ts:1015 and :1019,
  and each is an `AssertionError` on a README sentence the base lacks. None is a setup, import or syntax error. With
  the base README I reproduced 6 failed and 778 passed in the file. `check-final-tests-on-base.log` matches (6 of
  8325). At HEAD the file passes 784 of 784.
- **Weakening.** `git diff 50b72071..HEAD -- packages/elements/test` is empty: no test changed after red.
- **Vacuity.** Each body is one `toContain` of a literal README sentence, read in the named `##` section
  (`readmeSection`) or in the intro before the first `##`. There is no conditional, skip or only. The section regex
  returns `""` when the heading is missing, so a missing section fails the test rather than passing it.
- **Coverage.** Phase 7 adds no behaviour. Every README sentence T063 adds is pinned, along with the intro correction
  (Q-P7-2 (a)).
- **Mutation.** `gate:mutation -- --base bd40cf30`: "nothing to mutate: no package or gate source line changed", exit
  0, as in `mutation-phase.log`. No equivalent-mutant record applies.
- **tdd-check.** `tdd-check.json` reports `pass`, with red exit 1, final tests on base exit 1 and head exit 0. It was
  run at `dc1e825b`, and the only later commit is `f4193195`, which adds the check's own output. There is no
  `tdd-exempt.md`, per Q-P7-1 (a). That is right: `red-commits` is not empty, so an exemption would not apply.

## Checks run

Node 26 first on PATH, at HEAD `f4193195`:

- `gate:typecheck`: exit 0.
- `gate:lint`: 481 files, exit 0.
- `gate:style-lint`: 45 files, exit 0.
- `gate:test-lint`: 358 files, exit 0.
- `gate:manifest`: 23 elements, exit 0.
- `gate:config-copies`: identical, exit 0.
- `gate:csp`: 48 files, exit 0.
- `gate:prefix`: 511 files, exit 0.
- `gate:pins`: 5 manifests, exit 0.
- `gate:contrast`: 207 pairs in light, 215 in dark, exit 0.
- `gate:brand-rules`: 7 rules, exit 0.
- `gate:signoff -- --range bd40cf30..HEAD`: 4 commits, no finding.
- `gate:mutation -- --base bd40cf30`: nothing to mutate, exit 0.
- `gate:plants -- --affected 4fc2ed5b --list`: 317 of 317, exit 0, matching plants.md. With `--affected bd40cf30
  --list`: 0 of 317.
- `vitest --project elements-node`: 846 of 846 passed.
- `readme.test.ts` with the base README: 6 failed. With 62b78799's README: 7 failed. At HEAD: all passed.

Not run, per reviews/operator-ci-first.md and the instruction not to run the full tdd-check: the full unit, browser,
visual, axe and storybook-build runs. Phase 7 changes no source, story or style. The full suite's last local run is
`red-phase.log` at `50b72071`, whose source equals HEAD's: 8319 of 8325 passed, and the 6 failures are the README pins
that pass at HEAD.

Other items checked:

- **Tasks.** T063 to T065 are ticked, and their work is in the diff or in notes.md. Nothing outside phase 7 changed.
- **README.** The intro now names 23 `ocelle-*` elements, matching the 23 `src/ocelle-*.ts` modules and the
  manifest's 23, which settles Q-P7-2 (a). The cross-links are in the indicator, metric and pill sections and in §
  Control conventions. § Engines is unchanged.
- **CHANGELOGs.** In `packages/elements/CHANGELOG.md` § Unreleased, each surface item of the three elements appears
  in one Added bullet. The pill's entry point defining `ocelle-tooltip` appears once in Added, plus once in the
  summary paragraph, which follows the file's existing convention (lines 1-32). In `packages/tokens/CHANGELOG.md`, the
  four new tokens each have one Added entry and one summary paragraph. The second mention of `--ocelle-motion-pulse`
  states a different fact (reduced motion). No change was needed.
- **research.md R-05.** It now matches `ocelle-metric.ts`. Size, weight and tracking are on the `dt` (:61-66).
  Uppercase is on `.eyebrow` (:68-70), and its colour on `.eyebrow` outside forced colours (:101-104). The family is
  set by `.metric { font-family: var(--ocelle-font-sans) }` (:50-52). Phase-3 R1-02 and R1-03 are resolved.
- **SC-001 to SC-006.** The notes' table maps each criterion to its test or gate. SC-003 and SC-006 (manifest, CSP,
  prefix, lint, mutation) were confirmed above. SC-001, SC-004 and SC-005 passed in the red run, and SC-002 is covered
  under R1-04.

## Earlier findings

This is round 1 of phase 7, so there is no earlier round. The items deferred to polish by other phases:

- Phase-3 R1-02 and R1-03 (research.md R-05): resolved, see above.
- Phase-4 R1-03 (contracts/checks.md:80): not resolved correctly, see R1-01.
- Phase-6 Q-F1 (c) and R2-01 (the `slotchange` README pin): resolved, see R1-03.
