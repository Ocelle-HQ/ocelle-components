---
phase: 4
round: 1
verdict: approved
base: b5c335c873aa99c1c8fe3d02fab779878731b9cc
head: 48fe0f3
tdd_check: exempt
---

# Phase 4 review, round 1

Change under review: `git diff b5c335c..48fe0f3` (no uncommitted change). It touches
`packages/elements/CHANGELOG.md` (+4 lines), `tasks.md` (four ticks) and the phase-4 review directory
(`base.sha`, `coverage.md`, `quickstart.md`, `tdd-exempt.md`, `tdd-check.json`). No source, test, story or baseline
file changed.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | packages/elements/README.md:349; reviews/phase-4/coverage.md (§ Each row's third cell) | The "facts value mono" row reads "not supported: no monospace; ..." where R-11 (research.md, `.sk-facts` rows) reads "Not this mission: no monospace (constitution II)". SC-001 (as fixed for I3) allows three forms. This row does not use the literal "not this mission" wording and cites no operator decision, because the ruling comes from constitution II and not from an IQ decision. The row exists, gives the reason and gives the consumer's alternative (sans with tabular figures, `--ocelle-facts-value-size` or a compact region). That meets SC-001's intent: a disposition plus the consumer's remedy for a variant the constitution rules out for good. The variant is covered, so this is not a gap. `coverage.md` counts it among the three "not this mission" rows while also flagging the wording, so the record is accurate. | None. If the operator wants the literal form, it is a one-cell wording change in a later mission, with the readme test (packages/elements/test/node/readme.test.ts:239) updated to match. |
| R1-02 | note | reviews/phase-4/quickstart.md (step 5, `gate:prefix`) | The record has `prefix: 256 files checked`. Rerun at HEAD it gives `252 files checked, no finding`. The gate walks `storybook/` outside `storybook/dist/`, including ignored run output (gates/bin/prefix.ts:57,137), so the count follows untracked artefacts such as the moved shard reports. There is still no finding, and no tracked file changed since the run (`git diff --stat d2b6a93..HEAD` touches only review records). | None. |

There are no blocking findings.

### Tasks

- **T053** [X]. The final surface lists cover every item of the task's list, each in its package's changelog:
  - the four elements and their entry points: `packages/elements/CHANGELOG.md:18-39`, which names `ocelle-facts.js`, `ocelle-fact.js`, `ocelle-empty-state.js` and `ocelle-progress.js`;
  - the `--ocelle-facts-stack-below` hook and the two value hooks `--ocelle-facts-value-size` and `--ocelle-facts-value-line-height`: `packages/elements/CHANGELOG.md:18-22`;
  - `base.css`'s two rules, the value hooks in the density regions and the pre-upgrade facts rule: `packages/styles/CHANGELOG.md` (the last two Added bullets);
  - the `token-only` allowance: `packages/elements/CHANGELOG.md:40-43`, added in this phase.

  On placement, the allowance admits values in element styles only. `base.css` uses none of the four values (no `fit-content`, `minmax`, `translateX` or `animation-iteration-count` under `packages/styles/src`), and the plants that prove it live under `packages/elements/src` (`gates/plants/style-lint/*-{grid-fit-content,minmax-auto,translate-*,iteration-count*}`). The elements changelog is therefore the right place, and leaving it out of `packages/styles/CHANGELOG.md` is correct. The bullet's four values match the plants (fit-content percentage pass / length fail, minmax auto fail, translate percentage pass / length fail, iteration count integer pass / fraction fail). It says that no token is added, which agrees with FR-057's "any added tokens" (none). This meets FR-057 and constitution VII.
- **T053a** [X]. `layout="grid"` is at `packages/elements/CHANGELOG.md:20` and the `eyebrow` slot at line 29. Both are present, so no edit was needed.
- **T054** [X]. I checked this independently. I extracted the family and role cells of every `` | `.sk-…` | `` row from research.md § R-11 and from `packages/elements/README.md` § Mapping from kitty-mission-ui (lines 337 to 396), and compared them with `diff`:
  - the lists are identical: 53 rows, same order, no duplicate role;
  - per family: 16 `.sk-facts`, 19 `.sk-empty-state`, 18 `.sk-progress`;
  - each row's role prefix matches its family name (`facts …` on 16 `.sk-facts` rows, `empty-state …` on 19, `progress …` on 18), so no row sits under the wrong `.sk-*` family;
  - third cells: 34 name an element and variant, 16 start "consumer's:", 2 are "not this mission" and 1 is "not supported" (R1-01);
  - `class=` appears in none of the rows;
  - the per-family Uses sums are 36, 82 and 63 (181), which matches `coverage.md`.

  The single table with three family blocks fulfils the task's "three README mapping sections". The family is a column of every row, which makes the family check stricter, not looser. No gap was found, so nothing goes to the operator.
- **T055** [X]. `quickstart.md` records steps 1 to 7 with their summary lines, and `gate:storybook-build`, `gate:visual` and `gate:axe` pass on all 122 captures and runs (SC-003, FR-051). The plants line is a verdict over the 28 `--plan` shards, run the way CI runs them. The 28 per-shard summary lines read "every plant as expected", and their counts sum to 308 (79 + 78 + 78 + 24 × 3 + 1), which matches the verdict line. The phase-base mutation run had nothing to mutate, so the mission-base run (3828d2f) was recorded: no mutant survived.
- Nothing outside the phase changed.

### Constitution

- **VII.** The surface additions are recorded as MINOR, in the right package.
- **VI.** The mapping names roles only. The README holds no copied code and no planning IDs.
- **VIII.** See Test quality.
- No principle about elements, CSP, accessibility or stories is touched: no source changed.

### Plan

The plan said phase 4 checks only that the three sections together cover the inventory (research.md § R-11, "Where the mapping is written"). That is what T054 did.

## Test quality

`tdd-check.json` is `exempt` (head 79f888f; HEAD 48fe0f3 only adds that file). I judged each exemption in
`tdd-exempt.md`:

- **T053 and T053a are justified.** The changelog lines are prose with no behaviour. The surface lines that a test can key on already exist and are asserted by `packages/elements/test/node/readme.test.ts` and `packages/styles/test/readme.test.ts`, which landed red in phases 1 to 3. The allowance bullet describes behaviour proven by `gates/test/token-only.test.ts` and its plants, so a red test for the sentence itself would only assert prose.
- **T054 is justified.** It is a review record under `reviews/` and changes no file outside it.
- **T055 is justified.** It runs the existing suites and gates and changes no source, test or baseline.

No test was added, changed or weakened since base (`git diff b5c335c..HEAD` contains no test file).

Mutation was rerun at the phase base: `pnpm run gate:mutation -- --base b5c335c` gives `mutation: nothing to mutate: no package or gate source line changed since b5c335c`. The mission-base run recorded in `quickstart.md` had no survivor.

## Checks run

These were rerun at HEAD 48fe0f3:

- `gate:typecheck`: `typecheck: no type error in the files of tsconfig.json`
- `gate:lint`: `lint: 296 files checked, no finding`
- `gate:test-lint`: `test-lint: 202 files checked, no finding`
- `gate:style-lint`: `style-lint: 16 files checked, no finding`
- `gate:prefix`: `prefix: 252 files checked, no finding` (see R1-02)
- `gate:manifest`: `manifest: 6 elements checked, no finding`
- `gate:mutation -- --base b5c335c`: nothing to mutate
- `vitest run --project elements-node --project styles`, which includes both readme tests: `Test Files 10 passed (10)`, `Tests 361 passed (361)`

These were not rerun: build, the browser suites, contrast, csp, plants, storybook-build, storybook-integration, visual and axe. They were run at d2b6a93 and recorded in `quickstart.md`, and nothing since d2b6a93 changes a tracked file other than review records and `tasks.md` (`git diff --stat d2b6a93..HEAD`). I relied on that record.

## Earlier findings

This is the first round of phase 4. There are no earlier findings.
