---
phase: 5
round: 2
verdict: approved
base: eeb95d43d7ffa147e14193e215859c2c4a41586d
head: c097c8c5dd846226ee92e0cdfc05fee62c197eb6
tdd_check: pass
---

# Phase 5 review, round 2

Scope: `git diff 686241c..c097c8c` (the round 1 review commit to head), plus the uncommitted `tdd-check.sh 5`
evidence. The change since round 1 is exactly four commits:

- 83f1bf5: the operator decision for R1-01. Option (c) was chosen.
- a015eab: the planner's amendment of contracts/gates.md, data-model.md, plan.md and research.md R-08, plus the open
  task T068 in tasks.md. It also adds a pointer to T068 in T055. No code changed.
- 03520ef: the fix-1 red commit. It changes test files only: `gates/test/plant-repo.test.ts`,
  `gates/test/integration/plant-repo.test.ts` and two fixtures under `gates/test/fixtures/plant-repo/`.
- c097c8c: green for T068. It changes `gates/lib/plant-repo.ts`, the two plant `delta.json` files, `gates/README.md`
  and the T068 tick, and adds the red evidence.

`git diff --stat 686241c..HEAD` lists no other file. Nothing else changed since round 1.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | gates/lib/plant-repo.ts:229, :231 | The contract does not give the error texts, so I judge them as a choice. `delta.json: pairsList must be "empty" or "not-json"` names the part and the two allowed values. `delta.json: pairs and pairsList exclude each other` keeps the form of the round 1 message it replaces. Neither can be confused with another rejection. A stray `pairsText` hits the existing `delta.json: unknown key pairsText` (:216), which matches the contract's "a part not named here is an error". The checks run in a fixed order: unknown key, then value, then exclusion. So `{"pairsList":"empty","pairsText":…}` reports the unknown key, and the tests pin that. I accept all three texts. | None. |
| R2-02 | note | gates/test/gates-readme.test.ts:70-78; gates/README.md:53-57 | The README paragraph now describes `pairsList` correctly: both values, both exact texts, the three rejections and the reason. No test pins this text. That matches round 1, where `pairsText` was not pinned either, and T068 does not ask for a README test. | None. Optional later: one `toContain("`pairsList`")`. |

No blocking finding.

## T068 against the amended contract

- **Exact texts.** contracts/gates.md:29-34 gives `"[]\n"` for `empty` and `"[\n  {\"theme\":\"light\",\n"` for
  `not-json`. `pairsListTexts` (plant-repo.ts:166-169) holds `"[]\n"` and `'[\n  {"theme":"light",\n'`, which are
  the same strings. The integration tests (`gates/test/integration/plant-repo.test.ts` "writes pairsList \"empty\"…"
  and "…\"not-json\"…") check with `toBe` that the written file is exactly each text. They also check that the
  `empty` text parses to `[]` and that the `not-json` text makes `JSON.parse` throw `SyntaxError`.
- **Rejections.** plant-repo.test.ts:153-162 rejects these `pairsList` values: an arbitrary string (`"[]\n"`, which
  is the old free-text form), a wrong case (`"Empty"`), the empty string, a number, `null` and an array. It rejects
  `pairs` together with `pairsList` twice, once with an empty `pairs` list and once with a non-empty one. It rejects
  `pairsText` alone and next to a valid `pairsList`. Each case asserts the exact message with an anchored regex. The
  acceptance test covers both values on their own and `pairsList` combined with `tokens` and `generator`. The
  combination is allowed because the contract excludes only `pairs`. These are all the cases contracts/gates.md:55-58
  and T068 list.
- **No `pairsText` part left.** `git grep pairsText` outside the reviews directory finds these hits:
  - the contract and task text that name it as a rejected example;
  - the two rejection cases in plant-repo.test.ts;
  - a test helper function `pairsText()` in `gates/test/token-tree.ts:67` and in
    `gates/test/integration/plants-robustness.test.ts:61`. It writes test fixture lists and is not a delta part.

  `deltaKeys` (:204), the `Delta` type (:175-181) and `applyDelta` (:371) use only `pairsList`.
- **The two breaking plants.** `gates/plants/contrast/empty-list/delta.json` is `{ "pairsList": "empty" }` and
  `unparsable-list/delta.json` is `{ "pairsList": "not-json" }`. Both `plant.json` files are unchanged since round 1
  (`git diff --stat 686241c..HEAD -- gates/plants` lists only the two deltas). Their expected causes,
  `…pairs.json: the list is empty` and `…pairs.json: not JSON`, still come out: `gate:plants` judges all 176 plants
  as expected.
- **README.** `gates/README.md:53-57` replaces the `pairsText` sentence with the closed form, using the contract's
  wording and texts.
- **Process-boundary disable at plant-repo.ts:370.** It covers only line 371, the `writeFile` of
  `pairsListTexts[delta.pairsList]` in the async `applyDelta`. That line is file I/O like its neighbours at :354-368,
  which round 1 accepted under the 001 builder convention. Both tests it names exist under those exact titles and run
  in `pnpm test`. They pin the written text exactly for each value, so any mutant of the condition or of the index
  would fail them. The decisions behind the line are not disabled and are mutated in full: `parseDelta`'s value and
  exclusion checks (:228-231) and the `pairsListTexts` literals (:166-169). The mutation run reports none surviving.
  The record is valid.

## Test quality

**Red evidence.** `red-fix-1.log` (03520ef): 13 of 1787 tests fail, each for missing behaviour.
- Ten fail on `delta.json: unknown key pairsList`, where the code before the fix did not know the part.
- One `pairsText` case fails with "expected to throw", because the old code accepted `pairsText`.
- The mixed case gets the wrong message.

None is a setup, import or syntax error. `tdd-check.json`: `status: pass`, red commits `phase` (06a58cb, exit 1) and
`fix-1` (03520ef, exit 1). The final tests exit 2 on the base and 1 on the scaffold, and pass at head (exit 0).

**Tests after red.** `git diff 03520ef..HEAD -- gates/test` is empty. Nothing was changed after the red commit. The
red commit replaces round 1's three `pairsText` assertions with stricter ones:
- the accept case became three accept cases;
- the two rejections became ten;
- the `toBe("[\n")` integration assertion became two exact-text assertions, each with a JSON parse check.

Nothing was weakened, skipped or deleted without a stricter replacement. The reason is given in comments
(plant-repo.test.ts:151-152, integration test:135-136). `gate:test-lint` finds no assertion-free, conditional,
skipped or focused test.

**Mutation.** `pnpm run gate:mutation -- --base eeb95d4`: *1183 mutants on the changed lines of 9 files, none
survived; 31 equivalent records*, exit 0. That is nine more mutants than round 1 (1174), from the new `parseDelta`
check and the `pairsListTexts` table. The 31 records are the round 1 set, with the :370 record's reason updated to
name the two new tests. Its wording is the only change. I checked it above. The other 30 are unchanged and my
round 1 checks of them still hold, including the exhaustive search over all 2^24 colours for the threshold records.

## Checks run

Node 22.23.4, `PLAYWRIGHT_BROWSERS_PATH` set to the scratchpad browsers.

| Check | Result |
|---|---|
| `pnpm test` | exit 0: 1787 tests passed in 87 files |
| `pnpm run gate:contrast` | exit 0: `contrast: 158 pairs checked in light, 157 in dark (149 required per theme)` |
| `pnpm run gate:brand-rules` | exit 0: `brand-rules: 7 rules checked` |
| `pnpm run gate:plants` | exit 0: 176 plants of 13 gates and the registry judged, every plant as expected |
| `pnpm run gate:typecheck` | exit 0 |
| `pnpm run gate:lint` | exit 0: 155 files, no finding |
| `pnpm run gate:test-lint` | exit 0: 97 files, no finding |
| `pnpm run gate:style-lint` | exit 0 |
| `pnpm run gate:config-copies` | exit 0 |
| `pnpm run gate:pins` | exit 0 |
| `pnpm -r build` then `pnpm run gate:csp` | exit 0: 19 files, no finding |
| `pnpm -r build` then `pnpm run gate:prefix` | exit 0: 75 files, no finding |
| `pnpm run gate:mutation -- --base eeb95d4` | exit 0: 1183 mutants, none survived, 31 equivalent records |

**Constitution.** VIII: the fix was test-first, with a separate red commit proven by `red.sh 5 fix-1`. The change
touches only plant-building tooling. It adds no element I/O, no network or CSP surface and no token or style.
**Plan.** plan.md item 9, research R-08, data-model § Contrast pair and contracts/gates.md § Configuration set all
describe the closed part, and the code matches them. **Tasks.** T050 to T063 and T068 are ticked, and the T068 work
is present as listed above.

## Earlier findings

Round 1 had no blocking finding.

- **R1-01** (operator decision): resolved with option (c), as recorded in `operator-decisions.md`. The record and the
  code now agree: the contract and data-model describe four parts, one of them the closed `pairsList`. The free-text
  form is gone and is rejected. The test-first fix has a `fix-1` red commit. Round 1's second concern, that a future
  pass or fail plant could carry a whole copy of the list, can no longer occur. Only two fixed texts can be written.
- **R1-02, R1-03, R1-04, R1-05**: unchanged. The code they cite was not touched (`brand-rules.ts`, `token-source.ts`,
  `contrast.ts` are not in the diff since round 1). They stand as notes.
