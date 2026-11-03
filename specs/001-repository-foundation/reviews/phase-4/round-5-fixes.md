# Phase 4 review round 5 (operator round, landing review): fixes

tasks.md T096 is done. Test commit 8bc2efc holds only tests and fixtures. `red.sh 4 fix-5` reports
`"red": true, "recorded": true` (red-fix-5.log): 39 of 1179 tests fail, and every failure is an `AssertionError`
against the old code, not a load error.

The red commit also brings the existing test worlds onto the new contract, without weakening any of them:

- The breaking plants of gates/test/plants.test.ts and plants-job.test.ts now name the cause that their recorded
  runs print.
- The parse cases of plants.test.ts give an error plant a `cause`.
- Both breaking plants under gates/test/fixtures/plants-root/ (pins `error-invalid-json` and mutation
  `error-unresolvable-base`) now name the cause that their gate prints. The integration test
  gates/test/integration/plants.test.ts runs them, so it checks those causes against the real gates.

Some new cases passed at the red commit because the behaviour already existed. Following T096 step 2, they were not
forced red:

- the exit problem for an error plant's exit other than 2;
- a fail plant that keeps its `base`.

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| O5-01 | fixed. `parsePlant` now reads `cause`. An `error` plant must name it as a non-empty string; otherwise the problem is "an error plant names its cause, a non-empty string". `cause` on a `fail` or `pass` plant gives "only an error plant names a cause". `judgePlant` accepts an error plant only at exit 2 and only when some line of the gate's error output (stderr, not stdout, and not only the first line) contains the cause. Otherwise the problem is `expected exit 2 (could not run) with the cause "<cause>", got exit 2 (<first error line>)`, and the plant job reports it as `not-reported-broken`. Each of the 13 breaking plants under gates/plants/ (each `error-*`) now names a substring of the cause line that its gate prints for exactly that breakage. I first ran the plant job with a placeholder cause to read each gate's actual line, then chose substrings with no temporary path or commit hash, for example `mutation: could not run: --base refs/heads/no-such-base does not resolve to a commit` and `lint: could not run: packages/tokens/src/x.ts:2 does not parse`. The tasks text says "14 today"; there are 13 `error-*` plants under gates/plants/ (config-copies 1, csp 1, lint 1, mutation 2, pins 1, prefix 1, signoff 1, style-lint 1, test-lint 1, typecheck 1, unit-tests 2), and all of them have a cause. gates/README.md describes `cause`. | gates/test/plant-judge.test.ts "parsePlant: cause and base" and "judgePlant: error plants and their cause". gates/test/plants.test.ts "fails when a gate breaks on its breaking plant for another cause" and "rejects a pass plant that sets base and a breaking plant without a cause as invalid plants". Red: `unknown key cause`, and an exit 2 for another cause was accepted (`expected undefined to be 'expected exit 2 ... with the cause ...'`). | gates/lib/plant-judge.ts, gates/plants/*/error-*/plant.json, gates/README.md |
| O5-02 | fixed. `parsePlant` rejects `base` on a `pass` plant with "a pass plant may not set base". This check comes before the value check, so `base: ""` on a pass plant gives the same problem. `base` stays accepted on a `fail` or `error` plant (contracts/plants.md). No pass plant under gates/plants/ sets `base`. | gates/test/plant-judge.test.ts (pass plant with `base` `HEAD`, `""`, and with records; fail plant keeps its `base`). gates/test/plants.test.ts (the job reports the pass plant as an invalid plant). Red: the plant was accepted, or `base must be a non-empty string`. | gates/lib/plant-judge.ts |

Checks, run with `PATH=/opt/node26/bin:$PATH` and `OCELLE_CHROMIUM_PATH` set, on the fix tree, after T095's fix
(b40a768):

- `pnpm test`: exit 0, "1179 tests passed in 54 files".
- Every gate exits 0:
  - config-copies: the two copies are identical.
  - test-lint: "56 files checked, no finding".
  - typecheck: no type error.
  - lint: "99 files checked, no finding".
  - style-lint: "1 file checked, no finding".
  - csp: "3 files checked, no finding".
  - prefix: "19 files checked, no finding".
  - pins: "4 manifests checked, no finding".
  - signoff `--range bdb9b70..HEAD`: "145 commits checked, no finding".
- `pnpm run gate:plants`: exit 0, "136 plants of 11 gates and the registry judged, every plant as expected".
  Every breaking plant is judged on its cause, and the mutation plants run on T095's gate.
- `pnpm run gate:mutation -- --base 4df12b0823f1a777cf37c501271201fdf4daca64 --files gates/lib/plant-judge.ts`
  (the only changed gate source): exit 0, "353 mutants on the changed lines of 1 file, none survived; 0 equivalent
  records" (mutation-fix-5-phase-base.log).
- The same run with `--base bdb9b70`, the PR base: exit 0, with the same result (mutation-fix-5-pr-base.log).
