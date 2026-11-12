---
scope: landing
round: 1
verdict: approved
base: 64c61d9e2a33131ae3e0059f11fd5c97d53be6f0
head: 14165b47c23c896e99e440f5fa9771f2341b76a6
tdd_check: pass
---

# Landing review, round 1: PR #22 (op 004, issue #20)

The integrated diff is `origin/main...HEAD`, with merge base `64c61d9`, which is the tip of `origin/main`, so the
branch is up to date. The code change is confined to `packages/tokens/src/source.ts` (17 lines) and one new test
file, `packages/tokens/test/source-form.test.ts`. The rest is evidence and records. Nothing under `gates/`,
`.github/`, the Stryker or Vitest configuration, or any `package.json` changed (OR-008). I read the phase 1 review
(`reviews/phase-1/round-1.md`) as input and did not rely on it. Every claim below was checked again on HEAD.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L1-01 | note | specs/002-design-tokens/reviews/phase-2/notes.md:26-27 | The correction note says that every non-Killed mutant "is a Timeout whose mutant was applied by hand and shown to fail the tests". The evidence it cites applied **one representative per group**, 3 of the 121 (mutation/README.md:64-75). The claim itself is true: I applied all 121 Timeout mutants (see *Test quality*), and each one fails `source-table.test.ts` on an assertion. But a note written to correct an overclaim should not overclaim its own evidence. | Cheap fold: say "one representative per cause group was applied by hand; the landing review applied all 121", or similar. |
| L1-02 | note | ops/004-token-source-mutation/mutation/README.md:36-39 | "Whole file" leaves out one mutant. Stryker generates a mutant only if its whole location lies inside the `--mutate` range. The `ArrayDeclaration` `[]` of the records array spans lines 34-228, so no 60-line entry generates it. I checked every multi-line mutant in the four reports. This is the only node that spans an entry boundary. I applied it by hand in a scratch copy (`tokenRecords([])`): `source-table.test.ts` fails 5 of 8 tests. So it is killed, and SC-001 (per line) holds. The README just does not mention it. | Optional: one sentence in the README naming this mutant and its kill. |
| L1-03 | note | gates/lib/mutation/report.ts:41 | Gate boundary, existing behaviour, not changed here. `gate:mutation` passes `Timeout` and `CompileError`. In this op, 121 of 681 mutants end as Timeout only because the slow in-process suite reaches `source-table.test.ts` after Stryker's ~32 s limit. Also, with the checker on, the gate reports name and `[]` mutants as CompileError (my gate run: lines 25, 27 `[]` and line 30 `{}` are CompileError there but Killed with the checker off). So for a later change to the dense lines 121-230, a green gate cannot tell a late kill from a slow survivor. This op closed that gap for itself by evidence, not by the gate. Together with the CI-time risk in README § CI risk (entry 121-180 at 578 s locally), this is a follow-up candidate for the gate, outside OR-008. | None for this PR. Offer the operator a follow-up issue (for example, run `source-table.test.ts` early, or bound mutants per shard). |
| L1-04 | note | packages/tokens/dist/source.d.ts (built) | Public surface. `dist/index.d.ts` is byte-identical. `dist/source.d.ts` changes: `records` was a literal tuple and is now `readonly (TokenRecord & { readonly name: N })[]`, so `group` and `value` are no longer literal types. This is not reachable by a consumer: `exports` maps only `.`, `./tokens.css`, `./tokens.json` and `./fonts/*`, and the package is private. No file in the repository reads `(typeof records)[number]` except for `["name"]` (`index.ts:7`). The name set of `TokenName` is unchanged: base and head both give the same 115 names. The union is printed in TypeScript's internal order (it begins `"color-disabled-ink" \| "color-overlay" \| …`), which only affects the text of consumer error messages. | None. |

No blocking finding.

## Correctness and fail-closed behaviour

- **The seam.** `tokenRecords<const N extends string>` (`source.ts:29-31`) is an unexported identity. It adds no runtime
  behaviour: the emitted JS differs from the base only by the function and the call. The type is fail-closed, because
  a misspelt key or a wrong group in a record is still a type error. README:89-99 shows TS2561 and TS2820 for these
  cases, and `gate:typecheck` uses the `@ts-expect-error` at `index.test.ts:27`. The ground lists become mutable
  `string[]` at the type level only. `as const` was never a runtime freeze, and every reader sees them through
  readonly `TokenRecord`/`Contrast` types, so nothing changes at run time.
- **Gates that read `source.ts`.** The contrast, brand-rules, token-only, plant-repo and stylelint token-lists gates
  read `source` or locate records by `name: "<token>"` lines (`source.ts#<name>`). The op leaves the records and their
  lines unchanged, so none of them depends on the removed form. The CI Plants, Contrast, Brand rules and Style lint
  jobs passed on 14165b4.
- **Exit 0/1/2 contract.** No gate code changed. 545 of the 560 kills come from `gates/test/contrast.test.ts`
  ("passes the repository's values"), which turns a broken source into exit 1 or 2 of the contrast gate. That is the
  existing contract working as intended. `gate:mutation` exits 0 against both the op base and `origin/main`.
- **Overlap.** `source-form.test.ts` is a unit test of the source's syntactic form. No gate or lint rule checks this,
  so it duplicates nothing. It lives in the `tokens` project, which the mutation config includes, and Stryker's
  initial run passed on the instrumented copy in all four entries.
- **Accessibility and security.** `tokens.css`, `tokens.json` and `index.d.ts` are byte-identical to the base build
  (README:105-111, and my own declaration build), so contrast data, CSP and runtime behaviour are untouched. The new
  test reads one repository file and has no network or I/O beyond that.

## Test quality

- **Red evidence.** Red commit `4e2ce98` (`red-commits`: `phase`, remapped from `b5059d2` via
  `reviews/history-map.txt`) adds only the form test. `red-phase.log:37` shows one failure, an AssertionError at
  `source-form.test.ts`. I ran it again against `origin/main`'s `source.ts` in a scratch copy: it fails and names
  `records: SatisfiesExpression`, `records: AsExpression`, `main`, `stateGrounds` and `chrome`, with no import or parse
  error. That failure is the missing behaviour.
- **Unchanged since red.** `git diff 4e2ce98..HEAD -- packages/tokens/test` is empty. No existing test changed.
- **Non-vacuity.** A missing declaration becomes an offender, not a skip. The `records` initializer must hold
  `"color-canvas"` and `"#F1EEE8"`. The test has no conditional assertion, no skip/only, no snapshot and no mock. The
  phase review's R1-03 (offender line points to the start of the expression) still applies and is cosmetic.
- **Mutation counts.** I recounted the four final reports myself. Each embedded `source` equals HEAD's `source.ts`.
  `1-60`: 135 Killed. `61-120`: 202 Killed. `121-180`: 127 Killed and 97 Timeout. `181-230`: 96 Killed and 24
  Timeout. In total 681 mutants: 560 Killed, 121 Timeout, 0 Survived, 0 NoCoverage, 0 CompileError. Every line with a
  string literal outside a comment carries a mutant, except the three import lines and the doc comment at line 12.
  L1-02 covers the one spanning mutant that no entry generates.
- **Timeout accounting, all 121 checked.** Every Timeout is `StringLiteral → ""`: 65 on `group`, 53 on `value`, and
  3 on elevation `light`/`dark` (lines 209 and 224). This matches README:52-56. I did not rely on the three
  representatives. In a scratch copy of the repository, I applied **each of the 121** to `source.ts` and ran
  `vitest run --config vitest.mutation.config.ts packages/tokens/test/source-table.test.ts` under a 60 s bound. All
  121 exit 1, with 1 or 2 assertion failures each against `expected.ts`, in about 1 s. None loops, hangs or errors on
  load. So each Timeout is a real kill, and none is a survivor in disguise, which is what OR-005 asks for. The
  working tree was never edited, and the scratch copy was restored and `cmp`-checked.
- **Equivalent mutants (R-08).** `source.ts` has no `Stryker disable` record. The gate reports "0 equivalent
  records", and none was needed, so no R-08 reasoning needs judging.
- **TDD check.** `tdd-check.json` is `pass` (head `564eaea`). The commits after it change only check logs and the
  run summary, not code or tests.

## Checks run

Node 22, `OCELLE_CHROMIUM_PATH` set, `PLAYWRIGHT_BROWSERS_PATH` on a scratchpad alias (`chromium-1248` →
`chromium-1243`), one heavy job at a time.

| Check | Result |
|---|---|
| `pnpm test` | exit 0, 2038 tests in 97 files |
| `gate:typecheck`, `gate:lint`, `gate:test-lint` | exit 0 |
| `gate:mutation -- --base 7cb3430` | exit 0, 10 mutants on changed lines, none survived, 0 equivalent records (58 s) |
| `gate:mutation -- --base origin/main` | exit 0, same 10 mutants |
| Declaration build, base vs head (scratch) | only `source.d.ts`/`source.js` differ; `index.d.ts` identical; `TokenName` name set identical (115) |
| `pnpm --filter @ocelle/tokens build` + scratch consumer (`nodenext`, strict) | `cssName("color-canvas")` and `TokenName = "measure-container"` exit 0; `cssName("color-canvs")` exit 2, TS2345 |
| All 121 Timeout mutants, hand-applied in scratch | 121/121 fail `source-table.test.ts` on assertions |
| Records-array `[]` mutant, hand-applied in scratch | 5 of 8 `source-table.test.ts` tests fail |
| Red test against `origin/main`'s `source.ts` (scratch) | fails on the assertion, five offenders named |
| CI on 14165b4 (given) | 16 of 16 jobs succeeded, including the `source.ts` mutation shard |

I did not run these myself: `gate:plants`, `gate:csp`, `gate:prefix`, `gate:contrast` and `gate:brand-rules`. CI
passed all of them on this head, the phase review ran them, and the op changes none of their inputs' outputs.

**Records.** `notes.md` quotes `round-1.md:39` and leaves `round-1.md` unedited. The addenda in `data-model.md` and
`research.md` are dated and keep the original text. The `log.md` Update closes the 2026-11-04 finding and keeps the
zero-mutant flag as a candidate. L1-01 is the only wording issue.

## Earlier findings

This is landing round 1. Phase 1 round 1 had no blocking findings. Its notes: R1-01 (CI time risk) is carried into
L1-03, R1-02 is confirmed and extended to all 121 Timeouts, R1-03 is cosmetic and still open, and R1-04 is
superseded by the post-fold check (`564eaea`).
