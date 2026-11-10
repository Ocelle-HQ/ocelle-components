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
`reports` key so plants can assert the lines (R-02).

For `packages/tokens/src/source.ts`, Stryker's runs order the `tokens` test project first (`sequence.groupOrder` in
`vitest.mutation.config.ts` only), so the static `""` mutants whose killers are token tests stop at the first failing
token test instead of waiting behind the slow files until the ≈32 s limit (R-05, lever 1). Concurrency matching the
cores (lever 2) and an FR-014 amendment (lever 3) follow only if the measurement says so. The red and green evidence is
the gate itself, `--files` per `source.ts` entry against `ec0f533~1`, checker on (R-06); the CI half is a measurement
commit at landing (R-07).

## Technical Context

**Language/Version**: TypeScript (strict), run by Node: CI pins 26.13.0; the sandbox runs Node 22 (spec *Assumptions*).

**Primary Dependencies**: Stryker 10.1.1 with the Vitest runner and the TypeScript checker; Vitest 5.0.5. No new
dependency.

**Storage**: N/A. Evidence files under `specs/007-mutation-gate-strictness/evidence/`.

**Testing**: Vitest (`pnpm test`); gate tests in `gates/test/` (in-process with the doubles of
`gates/test/mutation-fakes.ts`, and `gates/test/integration/` for real tools); plants via `pnpm run gate:plants`.

**Target Platform**: the repository's CI (`.github/workflows/ci.yml`, `ubuntu-24.04`) and the sandbox (4 cores).

**Project Type**: repository tooling (quality gates) of a web-component library; semver `none`.

**Performance Goals**: each `source.ts` measurement run ≤ 176 s on the sandbox; each `source.ts` shard's
`gate:mutation` step ≤ 480 s on CI (spec FR-010).

**Constraints**: no verdict changes (FR-007); none of the forbidden levers of FR-012; FR-013's reference entries
(`packages/tokens/src/generate.ts` first `--plan` entry, `gates/lib/wcag.ts`) not worse; token `dist/` byte-identical.

**Scale/Scope**: `gates/bin/mutation.ts`, `gates/lib/mutation/report.ts`, `gates/lib/mutation/shards.ts`,
`gates/lib/plant-judge.ts`, their tests, two plants, `vitest.mutation.config.ts` (and `stryker.config.json` only under
lever 2), records in `specs/001-repository-foundation/`, `gates/README.md` and `knowledge/speckit-flows/`.

## Constitution Check

*GATE: checked before research and again after design.*

| Principle | How the plan meets it |
|---|---|
| I, II, III, IV, V | Not touched: no element, token value, style, CSP surface or story changes. `source.ts` text is not edited (FR-012; dist identical). |
| VI Consumer needs | The consumer is the repository's review process (spec header). No new dependency. |
| VII Semver | `none`: no published surface changes. |
| VIII Test-first | US1: every behaviour (classification, lines, summaries, `selectFiles` entry names, judge `reports`) gets a red test first in `gates/test/`, and plants on the real gate. US2: lever 1 has a red assertion in `gates/test/integration/vitest-mutation-config.test.ts`, and its timing evidence is the FR-011a red/green runs (exemption for configuration, stated in the review). The gate's own new code is mutation-tested by the gate. Plants prove the gate change (`pass-zero-mutant`, `pass-compile-error` with `reports`). |
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
├── lib/mutation/shards.ts           # selectFiles keeps the entry name
├── lib/plant-judge.ts               # reserved rules; optional `reports`
├── plants/mutation/pass-compile-error/plant.json   # + reports
├── plants/mutation/pass-fully-checked/plant.json   # + reports: []
├── plants/mutation/pass-zero-mutant/               # new: base/, head/, plant.json
├── test/mutation-report.test.ts, mutation-shards.test.ts, mutation-records.test.ts, plant-judge.test.ts, plants.test.ts
├── test/integration/vitest-mutation-config.test.ts
└── README.md                        # mutation row
vitest.mutation.config.ts            # tokens project groupOrder 0 (lever 1)
stryker.config.json                  # concurrency, only under lever 2
specs/001-repository-foundation/spec.md, contracts/gate-cli.md   # dated amendments
knowledge/speckit-flows/log.md, findings/frontend-missions.md    # closed entries
```

**Structure decision**: two user-story phases, in the spec's order.

- **Phase US1 (P1), the report.** Red tests for `classifyMutants`, `selectFiles` entry names, the output and summary
  lines of the contract, and the judge's `reports` key; then the code. Plants: the zero-mutant probe of R-03 first
  (it decides whether a no-report Stryker run needs handling), then `pass-zero-mutant`, `pass-compile-error` and
  `pass-fully-checked` with `reports`. Records: 001 FR-011 amendment, the contract row, `gates/README.md`, the
  `log.md` zero-mutant candidate.
- **Phase US2 (P2), the token source.** Red: the measurement runs of R-06 on the code before the lever, for the four
  `source.ts` entries and the two reference entries, kept in `evidence/red/`. Then the red assertion on
  `vitest-mutation-config.test.ts`, lever 1, the green runs; lever 2 only if an entry misses 176 s or keeps a Timeout;
  if lever 2 also misses, stop and bring FR-014 to the operator (a gate question in this run, not a follow-up). The
  FR-011 per-mutant record and the by-hand kills. `dist` comparison. Records: `findings/frontend-missions.md`
  § Mutation shard time; 001 FR-013 and SC-005 only under lever 3. The CI half of FR-010 stays open for landing (R-07).

US1 lands first so that US2's runs already print their Timeouts as report lines, which makes the red and green
evidence readable from the gate's output.

## Complexity Tracking

None.
