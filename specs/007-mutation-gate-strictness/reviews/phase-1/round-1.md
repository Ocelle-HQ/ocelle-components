---
phase: 1
round: 1
verdict: approved
base: bfd31fec6c61ffc8f2dcdb1616fc3b7b82e14917
head: 42d064eebbd43346e3c22dbab495c013592b3508
tdd_check: exempt
---

# Phase 1 review, round 1

Scope: `git diff bfd31fe..42d064e` (commits `212539e` "docs(007): red measurement before any change" and `42d064e`
"chore(phase-1): red/green check before review"); working tree clean. Every changed path is under
`specs/007-mutation-gate-strictness/` (46 files): `evidence/` (README and 41 run files), `reviews/phase-1/`
(`base.sha`, `tdd-exempt.md`, `tdd-check.json`) and the three ticks in `tasks.md:67-69`. No package, gate, test or
configuration file changed; `stryker.config.json` has no diff since base (the T003 scratch edit was restored).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | `evidence/README.md:76-82` | The stop-and-ask point ("any mutation shard over 10 minutes", `tasks.md:42`) was raised for the checker-off diagnostic run of `source.ts:121-180` (606.54 s, `evidence/red/source-121-180/no-checker/time.txt`) and left as an open question in the README. Operator decision, human:jeroennouwsdev, 2026-11-10: "Diagnostic only; go on": the 606 s run was a scratch checker-off diagnostic, not a gate shard; it is recorded as measured and the stop rule does not apply to it. The gate as configured took 537.27 s for that entry. The README still reads as an open question. | None for this phase; the decision is recorded here. |
| R1-02 | note | `evidence/README.md:26-32`; `tasks.md:68` | `/usr/bin/time` is not installed in the sandbox, so wall times were taken with `date +%s.%N` around the same command instead of `/usr/bin/time -f '%e s'`. Same scope (the whole `pnpm` command), stated in the README, and the discarded exit-127 attempt is disclosed. Acceptable deviation. | None. |
| R1-03 | note | commit `212539e` | T003 says "Commit the evidence alone"; the commit also carries the phase's workflow files (`tasks.md` ticks, `reviews/phase-1/base.sha`, `tdd-exempt.md`). None is code, configuration or test, so the intent (no mission code beside the red figures) holds. | None. |
| R1-04 | note | `reviews/phase-1/tdd-check.json` | `head` in the check is `212539e`, one commit before HEAD; the only later commit `42d064e` adds that JSON file itself, so the check is not stale in substance. | None. |

No blocking finding.

## Test quality

- **TDD status `exempt`, justified.** `tdd-exempt.md` states why no test can fail: the phase adds text output, wall
  times, copies of Stryker reports and a README; nothing in it is executed by any command. Verified: the diff touches
  only `specs/007-mutation-gate-strictness/`, and `gate:mutation -- --base bfd31fe` reports "nothing to mutate: no
  package or gate source line changed" (`check-mutation.log`). Constitution VIII *Exemption* (constitution.md:140-141)
  applies: documentation and evidence, no behaviour. The phase's own purpose (`tasks.md:57-61`) requires the red
  figures to be taken before any code or test change, so a red test here would contradict FR-011a.
- No test was added, changed, weakened or deleted (no path in the diff matches the test pathspec).
- **Mutation:** `pnpm run gate:mutation -- --base bfd31fec…` exit 0, nothing to mutate; no equivalent-mutant records in
  changed code (none to read).
- **Evidence checked against its own data** (scratch scripts, not kept):
  - `red/plan.txt`: base `eaf16896…` equals `git rev-parse ec0f533~1`; 28 shards, stderr "27 cuts"; the `source.ts`
    entries are exactly `:1-60`, `:61-120`, `:121-180`, `:181-230`; the first `generate.ts` entry is `:1-60`. Matches
    T001.
  - Red table (`README.md` *Red table*): every count (mutants, Killed, Timeout, Survived, NoCoverage, CompileError,
    Ignored) of all six entries recomputed from each kept `mutation.json` and matches; each report holds only the
    entry's file. Times match each `time.txt`; every run exit 0.
  - Checker-off table and per-mutant comparison: counts recomputed from `no-checker/mutation.json`; keys (start-end,
    mutator, replacement) unique within each run and all present in both runs; the transition counts (70/65;
    103/99; 67/59/52/45/1; 59/37/13/11) match exactly.
  - Per-mutant lists: the Timeout and CompileError rows of each `source.ts` entry (65, 99, 157, 61), of the checker-off
    runs (97, 24) and of the reference entries (4, 5) are, as sets of (status, mutator, start-end, replacement),
    identical to the kept reports. Spot check of record names against `packages/tokens/src/source.ts`: lines 36
    (`color-canvas`), 122 (`font-sans`), 178 (`shell-inspector-width`) agree.
  - Checker split is labelled "diagnostic, not the checker's share" and no lever is chosen on it (README, research
    R-06 / R-05 lever text).

## Checks run

Node 22.23.4 in the sandbox (CI pins 26.13.0). Logs in this directory.

| Check | Result | Log |
|---|---|---|
| `gate:mutation -- --base bfd31fe` | exit 0, nothing to mutate | `check-mutation.log` |
| `pnpm test` (unit-tests) | exit 0, 2038 tests passed in 97 files, 123 s | `check-test.log` |
| `gate:typecheck` | exit 0 | `check-typecheck.log` |
| `gate:lint` | exit 0 | `check-lint.log` |
| `gate:test-lint` | exit 0 | `check-test-lint.log` |
| `gate:style-lint` | exit 0 | `check-style-lint.log` |
| `gate:config-copies` | exit 0 | `check-config-copies.log` |
| `gate:signoff -- --range bfd31fe..HEAD` | exit 0, 2 commits, no finding | `check-signoff.log` |
| `gate:pins` | exit 0 | `check-pins.log` |
| `gate:prefix` | exit 0 | `check-prefix.log` |
| `gate:csp` | exit 0 | `check-csp.log` |
| `gate:contrast` | exit 0 | `check-contrast.log` |
| `gate:brand-rules` | exit 0 | `check-brand-rules.log` |

Not run: `gate:plants` (heavy; the phase changes no gate code or plant, so it cannot change their outcome).
Constitution principles on elements, tokens, accessibility, CSP and stories do not apply: no element, token, story or
baseline changed.

## Earlier findings

None; this is the first round.
