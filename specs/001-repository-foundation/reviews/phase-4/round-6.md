---
phase: 4
round: 6
verdict: approved
base: 4df12b0823f1a777cf37c501271201fdf4daca64
head: fffb7e7f21aa870cdb945f19da8dad82fb1e039a
tdd_check: pass
---

# Phase 4 review, round 6

Scope: the T096 addendum for operator round 5 (O5-01, O5-02). That is red 8bc2efc, fix 268c4d8, and evidence commit
fffb7e7, which touches only `reviews/`. The phase 3 commits d8cd958 and b40a768 underneath are reviewed separately
(phase 3 round 8) and are not judged here. CI for fffb7e7 was still running when this review was written. The verdict
rests on local evidence only: the checks below were run on the working tree at fffb7e7, which has no uncommitted
change.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R6-01 | note | gates/README.md:49 | The 268c4d8 edit put the new `cause` sentences between the `base` sentence and "The mutation plant `error-unresolvable-base` uses it to present a `--base`…". So "it" now reads as if it meant `cause`, but it means `base`. | Optional: write "uses `base` to present". |
| R6-02 | note | specs/001-repository-foundation/tasks.md:258 | T096 step 3 says "14 today". There are 13 breaking plants: `ls -d gates/plants/*/error-*` lists 13, and 13 `plant.json` files under gates/plants/ have `"expect": "error"`. These are config-copies 1, csp 1, lint 1, mutation 2, pins 1, prefix 1, signoff 1, style-lint 1, test-lint 1, typecheck 1 and unit-tests 2. All 13 name a `cause`. The miscount is in the planner's text. The code is correct, and the fix note reports the discrepancy. | None for the implementer. The planner may correct the count. |

No blocking finding.

### Specificity of the 13 causes (O5-01)

Each `cause` names the breakage its plant plants, not just the generic "could not run" exit 2:

- config-copies/error-copy-missing: `cannot read tooling/speckit/extensions/story/story-config.yml`
- csp/error-unparsable: `packages/elements/dist/x.js:2 does not parse`
- lint/error-unparsable: `packages/tokens/src/x.ts:2 does not parse`
- mutation/error-dry-run-fails: `Stryker wrote no report (There were failed tests in the initial test run.)`
- mutation/error-unresolvable-base: `--base refs/heads/no-such-base does not resolve to a commit`
- pins/error-invalid-json: `packages/elements/package.json is not valid JSON`
- prefix/error-invalid-utf8: `packages/elements/src/x.ts is not valid UTF-8`
- signoff/error-empty-range: `..HEAD holds no commit; pass the pull request's <base>..<head>`. This one has no gate prefix because the range's base sha changes from run to run, but it is the exact empty-range message of gates/bin/signoff.ts:99.
- style-lint/error-unparsable: `packages/styles/src/x.css:2 does not parse (Unclosed block)`
- test-lint/error-unparsable: `packages/tokens/test/x.test.ts:4 does not parse`
- typecheck/error-missing-reference: `TS6053 at packages/tokens/src/x.ts:1`
- unit-tests/error-no-test-file: `no test file found`
- unit-tests/error-throws-while-loading: `packages/tokens/test/x.test.ts failed to load: planted: this file fails while loading`

My first local `gate:plants` run, without `OCELLE_CHROMIUM_PATH`, showed that the check works on real gates. Both
unit-tests breaking plants exited 2 with "Chromium not found…" and were reported `not-reported-broken … with the cause
…`. Before this fix they would have been counted as proven.

### Contract agreement

The documents agree with the code:

- **contracts/plants.md L4-15 and L63-65:** `cause` is required on `error` plants and invalid on the others; `base` is allowed on `fail` and `error` plants only.
- **data-model.md § Plant (`cause` and `base` rows):** the same rules.
- **gates/README.md L41-51:** the same rules.

The code matches these rules:

- **gates/lib/plant-judge.ts:99-108** (`parsePlant`) checks `cause` and rejects `base` on a pass plant before the value check.
- **gates/lib/plant-judge.ts:184-189** (`judgePlant`) requires exit 2 and a stderr line that contains `cause`. Otherwise it names the cause and the first error line.

No plant under gates/plants/ has a `cause` on a non-error plant or a `base` on a pass plant. I checked every
`plant.json`.

## Test quality

- **Red evidence:** `red-fix-5.log` / `check-red-fix-5.log` record red 8bc2efc with 39 failures, every one an `AssertionError` and none a load error. The new cases fail for the missing behaviour: `unknown key cause`, an error plant without `cause` accepted, a pass plant with `base` accepted or rejected for the wrong reason, and exit 2 for another cause accepted (`expected undefined to be …`). The pre-existing job and integration tests also fail in red, because their fixtures now carry `cause`, which the old parser rejects. That is the right reason.
- **Existing tests not weakened:** in 8bc2efc the existing tests changed only to add a `cause` to their error plants:
  - `errorPlant` in plants.test.ts and `error` in plants-job.test.ts.
  - The parse cases at plants.test.ts:401, 405 and 423.
  - The two plants-root fixtures.

  No assertion was removed or loosened. The R1-11 base test and the `only a pass plant lists records` case keep their expected values. The fixtures' causes are checked against the real gates by gates/test/integration/plants.test.ts.
- **No change after red:** `git diff 8bc2efc..HEAD -- gates/test` is empty.
- **The new tests can fail:**
  - The pass-plant `base: ""` case pins the check order.
  - The stdout-only case shows the cause is read from stderr only.
  - The second-line case shows that any stderr line is accepted, not just the first.
  - The exit-1 case keeps the old message.
  - The job-level test checks the `not-reported-broken` output and the two `invalid-plant` lines exactly.
- **Not forced red:** two cases already passed at red because the behaviour existed: an error plant's exit other than 2, and `base` kept on a fail plant. T096 step 2 allows this, and the fix note reports it.
- **Mutation:** `pnpm run gate:mutation -- --base 4df12b0… --files gates/lib/plant-judge.ts` exited 0 with "404 mutants on the changed lines of 3 files, none survived; 10 equivalent records". The count is higher than the 353 in the fix note because the phase base diff now also includes the phase 3 T095 mutation sources. Those records are in gates/lib/mutation/ and belong to the phase 3 review. No record is in plant-judge.ts.

## Checks run

Run on fffb7e7 with `PATH=/opt/node26/bin:$PATH`. `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` was set for test, plants and mutation.

| Check | Result |
|-------|--------|
| `tdd-check.json` (head 268c4d8; fffb7e7 adds evidence only) | pass, no problems; red commits phase, fix-1, fix-3 and fix-5 each exit 1 |
| `pnpm test` | exit 0, "1179 tests passed in 54 files" |
| `pnpm run gate:plants` | exit 0, "136 plants of 11 gates and the registry judged, every plant as expected". The first run without the Chromium path exited 1 for that environmental reason only (see above). |
| config-copies | "identical" |
| test-lint | 56 files, no finding |
| typecheck | no type error |
| lint | 99 files, no finding |
| style-lint | 1 file, no finding |
| csp | 3 files, no finding |
| prefix | 19 files, no finding |
| pins | 4 manifests, no finding |
| signoff (`--range bdb9b70..HEAD`) | 147 commits, no finding |
| `gate:mutation` (phase base, plant-judge.ts) | exit 0, none survived |
| CI for fffb7e7 | still running at review time; not judged |

## Earlier findings

- **O5-01: resolved.** `cause` is required on error plants and checked against stderr at exit 2 (plant-judge.ts:99-103, 184-189). All 13 breaking plants name a specific cause, as listed above. Red tests are in plant-judge.test.ts and plants.test.ts, under red label fix-5.
- **O5-02: resolved.** A pass plant with `base` gets "a pass plant may not set base" (plant-judge.ts:106). `base` is still accepted on fail and error plants. Red tests are in plant-judge.test.ts and plants.test.ts.
