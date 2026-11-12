# Implementation Plan: Mutation gate strictness

**Branch**: `claude/023-mutation-gate-strictness` (feature directory `specs/007-mutation-gate-strictness`) | **Date**:
2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/007-mutation-gate-strictness/spec.md` (approved by the operator at the spec
gate, 2026-11-10; spec check 3 clean).

## Summary

The mutation gate keeps every verdict and gains a report: every Timeout and CompileError mutant on a changed line, and
every entry with no mutant on its changed lines, is printed as a located line with a reserved rule (`timeout`,
`compile-error`, `zero-mutants`), in the shape the equivalent records already use, and counted in both summary lines
(research.md R-01 to R-04, `contracts/mutation-output.md`). The plant judge learns the reserved rules and an optional
`reports` key so plants can assert the lines (R-02). A `--files` list that names one file more than once ends as
could-not-run, so every entry of a run has one name (R-03, operator decision PLAN-CORRECTNESS-1-005 (a)).

For `packages/tokens/src/source.ts`, Stryker's runs start with `packages/tokens/test/source-table.test.ts`, then the
other token tests, then every other project: in `vitest.mutation.config.ts` only, the `tokens` project is split into
`tokens-source-table` (that one file, `sequence.groupOrder` 1) and `tokens` (the rest, 2), every other project at 3; no
project at 0, which under Stryker's `maxWorkers: 1` runs last (R-05, lever 1, operator decision PLAN-FRESH-3-001 (a)).
So the static `""` mutants whose killers are token tests stop at the first failing token test instead of waiting
behind the other projects until the ≈32 s limit, and that first test is a value/group test of `source-table.test.ts`,
never `build.test.ts`, whose child build process never sees Stryker's active mutant. A measured concurrency
(lever 2, either direction, chosen for the CI runner's core count) and an FR-014 amendment (lever 3) follow only if the
measurement says so, decided on the measured entry time alone, lever 2 always tried before lever 3; the checker split
of each entry is recorded as a diagnostic only. The red and green evidence is the gate itself, `--files` per
`source.ts` entry against `ec0f533~1`, checker on (R-06), the red runs taken at the phase base before any User Story 1
code; the CI half is a measurement commit on the mission's pull request at landing, with a source.ts-only draft run
only if a mixed shard misses 480 s (R-07).

*Amendment, 2026-11-11 (operator round from the landing review, phase 3 O2-01, landing L1-01):* lever 1 is narrowed.
`tokens-source-table` stays alone at `groupOrder` 1, and every other mutation project, the rest of `tokens` included,
is one group at 2 in Vitest's default order. The earlier split delayed the static mutants of gate source behind every
token file and turned some of their kills into Timeouts, which FR-013 forbids. The eight 30-line `source.ts` entries,
the FR-013 reference entries and a gate-source before/after comparison are measured again (R-05 amendment).

## Technical Context

**Language/Version**: TypeScript (strict), run by Node: CI pins 26.13.0; the sandbox runs Node 22 (spec *Assumptions*).

**Primary Dependencies**: Stryker 10.1.1 with the Vitest runner and the TypeScript checker; Vitest 5.0.5. No new
dependency.

**Storage**: N/A. Evidence files under `specs/007-mutation-gate-strictness/evidence/`.

**Testing**: Vitest (`pnpm test`); gate tests in `gates/test/` (in-process with the doubles of
`gates/test/mutation-fakes.ts`, and `gates/test/integration/` for real tools); plants via `pnpm run gate:plants`.

**Target Platform**: the repository's CI (`.github/workflows/ci.yml`, `ubuntu-24.04`; 2 or 4 vCPUs, not settled while
the repository is internal, recorded by the CI measurement, R-05) and the sandbox (4 cores).

**Project Type**: repository tooling (quality gates) of a web-component library; semver `none`.

**Performance Goals**: each `source.ts` measurement run ≤ 176 s on the sandbox; each `source.ts` shard's
`gate:mutation` step ≤ 480 s on CI (spec FR-010).

**Constraints**: no verdict changes (FR-007); none of the forbidden levers of FR-012; FR-013's reference entries
(`packages/tokens/src/generate.ts` first `--plan` entry, `gates/lib/wcag.ts`) not worse; token `dist/` byte-identical.

**Scale/Scope**: `gates/bin/mutation.ts`, `gates/lib/mutation/report.ts`, `gates/lib/mutation/shards.ts`,
`gates/lib/plant-judge.ts`, `gates/lib/findings.ts` (`plural`), their tests, two new plants and two edited ones,
`vitest.mutation.config.ts` (and `stryker.config.json` only under lever 2), records in
`specs/001-repository-foundation/` (`spec.md`, `contracts/gate-cli.md`, `contracts/plants.md`, `data-model.md`
§ Finding and § Plant), `gates/README.md`, `knowledge/speckit-flows/`, one sentence in all three tracked copies of the
story review command (the source `tooling/speckit/extensions/story/commands/speckit.story.review.md`, the installed
`.specify/extensions/story/commands/speckit.story.review.md` and the generated
`.specify/extensions/story/.specify-dev/agent-commands/claude/speckit-story-review/SKILL.md`, which the phase reviewer
loads through the `.claude/skills/speckit-story-review/SKILL.md` symlink; R-08), and one in
`.claude/skills/ocelle-land/SKILL.md`.

## Constitution Check

*GATE: checked before research and again after design.*

| Principle | How the plan meets it |
|---|---|
| I, II, III, IV, V | Not touched: no element, token value, style, CSP surface or story changes. `source.ts` text is not edited (FR-012; dist identical). |
| VI Consumer needs | The consumer is the repository's review process (spec header). No new dependency. |
| VII Semver | `none`: no published surface changes. |
| VIII Test-first | US1: every behaviour (classification and its order, lines, summaries and their exact nouns, `plural`'s irregular form, `selectFiles` entry names and the new repeated-file cause, the zero-mutant handling of R-03, judge `reports` and `records`) gets a red test first in `gates/test/`; the judge support goes first, then the `plant.json` edits and new plants run red against the old gate, then the gate code (R-02). Existing exact-summary assertions are extended, and the "entries of one file joined" assertion is replaced by the exit-2 case the operator decided, each named in R-03/R-04. US2: lever 1 has a behavioural red test (module start order under Stryker's options: `source-table.test.ts` before every other module, then the other token modules before any other project) in `gates/test/integration/vitest-mutation-config.test.ts`, and the config deep-equal assertion is replaced by a stricter one (project names, the two stated split exceptions, each `sequence`, every test module collected once) with the reason stated; its timing evidence is the FR-011a red runs, taken before any mission code, and the green runs (exemption for configuration, stated in the review). The gate's own new code is mutation-tested by the gate. Plants prove the gate change (`pass-zero-mutant`, `pass-compile-error` with `reports`, `error-zero-mutant-failing-test`). *Amendment, 2026-11-11 (operator round from the landing review):* phase 2 O2-01 gets a red test of the report line with no replacement. For phase 3 O2-01 (lever 1 narrowed), the red test asserts `source-table.test.ts` first, the next module from `elements` and the sequence values 1 and 2 (R-05). Its timing evidence is the FR-013 gate-source comparison and the eight `source.ts` entries run again. |
| Quality gates | The mutation gate's verdicts are unchanged; it prints more. The parallel branches for #17 and #10 see the new lines once they merge `main`, and no new failure (spec *Assumptions*, Policy). |

No violation; Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/007-mutation-gate-strictness/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/mutation-output.md
├── evidence/            # US2 measurement runs (red/, green/, README.md), and the US1 zero-mutant probe
├── reviews/             # spec checks, squad rounds, phase reviews
└── tasks.md             # /speckit-tasks
```

### Source code (repository root)

```text
gates/
├── bin/mutation.ts                  # prints the report lines and the new summaries
├── lib/mutation/report.ts           # classifyMutants: timeouts, compileErrors, zeroEntries
├── lib/mutation/shards.ts           # selectFiles keeps the entry name; rejects a file named more than once
├── lib/findings.ts                  # plural() with an optional irregular plural
├── lib/plant-judge.ts               # reserved rules; optional `reports`
├── plants/mutation/pass-compile-error/plant.json   # + reports
├── plants/mutation/pass-fully-checked/plant.json   # + reports: []
├── plants/mutation/pass-zero-mutant/               # new: base/, head/, plant.json
├── plants/mutation/error-zero-mutant-failing-test/ # new: base/, head/, plant.json
├── test/mutation-report.test.ts, mutation-shards.test.ts, mutation-records.test.ts, mutation-ranges.test.ts,
│   findings.test.ts, plant-judge.test.ts, plants.test.ts
├── test/integration/vitest-mutation-config.test.ts
└── README.md                        # mutation row
vitest.mutation.config.ts            # tokens split: tokens-source-table 1, tokens 2, every other project 3 (lever 1)
stryker.config.json                  # concurrency, only under lever 2
specs/001-repository-foundation/spec.md, contracts/gate-cli.md, contracts/plants.md, data-model.md   # dated amendments
tooling/speckit/extensions/story/commands/speckit.story.review.md   # source: report lines are not blocking findings
.specify/extensions/story/commands/speckit.story.review.md          # installed copy, the same sentence
.specify/extensions/story/.specify-dev/agent-commands/claude/speckit-story-review/SKILL.md   # generated skill, the same sentence
.claude/skills/ocelle-land/SKILL.md  # report lines are not findings; one --files entry per file
knowledge/speckit-flows/log.md, findings/frontend-missions.md    # closed entries
```

**Structure decision**: the FR-011a red runs first, then two user-story phases, in the spec's order.

- **First, before any US1 code: the red measurement (spec FR-011a).** At the phase base, with the gate and configuration
  of `main`: the measurement runs of R-06 for the four `source.ts` entries and the two FR-013 reference entries, and the
  checker split of each `source.ts` entry (a diagnostic, R-06), kept in `evidence/red/` with each run's
  `mutation.json`, from which the Timeouts and CompileErrors are read (the old gate prints none). Heavy; one at a time.
- **Phase US1 (P1), the report.** In this order (R-02): the judge's red tests (`records` against `record` lines only,
  `reports` as a multiset, `reports` rejected on non-mutation plants, `parsePlant` accepting `reports`), then the judge;
  the zero-mutant probe of R-03 (`pass-zero-mutant` on the real, unchanged gate), which confirms the report Stryker
  10.1.1 writes; the `plant.json` edits and new plants (`pass-compile-error` and `pass-fully-checked` with `reports`,
  `pass-zero-mutant`, `error-zero-mutant-failing-test`), red against the old gate where they assert report lines; red
  gate tests for `classifyMutants` and its order, `selectFiles` entry names and the repeated-file cause, the output and
  summary lines of the contract, `plural`'s irregular form, and the R-03 fallback only if the probe shows no report;
  the extended exact-summary tests (R-04); then the gate code. Records: 001 FR-011 amendment, the gate-cli mutation row
  (report lines, the new exit-2 cause, the location rule), 001 `contracts/plants.md` (the `plant.json` shape, the
  mutation row, the plant-job failure rule) and 001 data-model § Finding and § Plant, `gates/README.md`, the story
  review sentence in all three copies and the landing skill's sentence (R-08), the `log.md` zero-mutant candidate.
- **Phase US2 (P2), the token source.** The behavioural red test (`source-table.test.ts` first, then the other token
  modules) and the stricter config assertion on `vitest-mutation-config.test.ts` (R-05), lever 1 (the mutation-only
  split of `tokens`; `gate:plants` shows every mutation plant keeps its verdict with it), the green runs; the per-mutant
  comparison of each `source.ts` entry's red and green runs (R-06: a Killed → Timeout move, with its re-run rule, is
  named as lever 1's in the README before lever 2 is tried); lever 2 (measured in either direction, for the CI
  core count) only if an entry misses 176 s or keeps a Timeout, always before lever 3, whatever the checker split shows;
  if lever 2 also misses, stop and bring FR-014 to the operator (a gate question in this run, not a follow-up). FR-013's
  per-mutant comparison, keyed by start and end, mutator and replacement, with its re-run rule. The FR-011 per-mutant
  record with its three criteria (the third: `killedBy` is one of the named value/group tests of `source-table.test.ts`)
  and the by-hand kills, which show the tie to the record. `dist` comparison. Records: `findings/frontend-missions.md`
  § Mutation shard time; 001 FR-013 and SC-005 only under lever 3. The CI half of FR-010 stays open for landing (R-07).
  *Amendment, 2026-11-11 (phase 3 O2-01):* lever 1 is narrowed (above, R-05). The order test now expects
  `source-table.test.ts` first and the next module from `elements`. Its evidence is the FR-013 per-mutant comparison on
  the gate-source static mutants against `main`'s mutation configuration, and the eight `source.ts` entries and the
  reference entries run again.

US1 lands before US2's green runs so that they print their Timeouts as report lines, which makes the green evidence
readable from the gate's output; the red evidence is read from the kept reports.

## Complexity Tracking

None.
