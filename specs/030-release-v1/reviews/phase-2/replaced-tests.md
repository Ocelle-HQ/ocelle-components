# Replaced tests of phase 2 (030 US2)

Constitution VIII: an existing test that this phase's change makes wrong is replaced in the red commit by a stricter
one, never edited in the green commit. Each replaced test carries a comment naming 030 and the reason. Line numbers are
those of the red commit.

## Changelog tests (T025; FR-005, research.md R-09, analysis K2 and F8)

Reason, for each: "FR-005: the first release turns the Unreleased content into the dated 1.0.0 entry". Old: the
`## Unreleased` section (and its `### Added`). New: the `## 1.0.0 - <YYYY-MM-DD>` section (and its `### Added`), which
is empty, so the test fails, unless the heading exists in exactly that form; the statements are the same. Stricter: it
adds the dated heading in its form, and reads the one section the first release moves the Unreleased content into.

| File and line | Old assertion | New assertion |
|---|---|---|
| `packages/elements/test/node/changelog.test.ts:20-24` (helper) | `unreleased(text)`: the `## Unreleased` section | `firstRelease(text)`: the `## 1.0.0 - <YYYY-MM-DD>` section, `""` without that heading |
| `packages/elements/test/node/changelog.test.ts:29-174`, the fourteen `"states under Unreleased: %s"` cases | `expect(section).toContain(flat(statement))` | `"states in the dated 1.0.0 entry: %s"`, `expect(released).toContain(flat(statement))` |
| `packages/elements/test/node/readme.test.ts:1792-1798` (describe `packages/elements/CHANGELOG.md`) | `unreleased`, `added` (Unreleased / Added) | `released`, `releasedAdded` (1.0.0 entry / Added) |
| `packages/elements/test/node/readme.test.ts`, "names %s under Unreleased / Added" | `expect(added).toContain(surface)` | "names %s in the dated 1.0.0 entry / Added", `expect(releasedAdded).toContain(surface)` |
| `packages/elements/test/node/readme.test.ts`, the step indicator, overflow-region and Chromium 125 / WebKit 17.4 cases | `expect(flat(unreleased)).toContain(...)` | `expect(flat(released)).toContain(...)`, the Chromium case renamed "in the dated 1.0.0 entry" |
| `packages/elements/test/node/readme.test.ts:2153-2170` (014 phase 7 MINOR lead, the three tests) | `lead`: the Unreleased text before its first `###` | `releaseLead`: the 1.0.0 entry's text before its first `###` |
| `packages/styles/test/readme.test.ts:186-241`, the nine cases | `added`, `flat(unreleased)` | `releasedAdded`, `flat(released)`; the data-table case's object is named before its assertion |
| `packages/tokens/test/readme.test.ts:91-120` | "names every token as added in the Unreleased section": the full names under Unreleased / Added equal `expectedTokens` | see below |

**Tokens (analysis K2, F8).** `packages/tokens/test/readme.test.ts`:

- new case "has the first release's heading in the form ## 1.0.0 - <YYYY-MM-DD>, after Unreleased": of the
  `## Unreleased` and `## 1.0.0...` headings, the first is `## Unreleased` and the second matches
  `^## 1\.0\.0 - \d{4}-\d{2}-\d{2}$`;
- "names every token in full as added in the 1.0.0 entry or under Unreleased": the set of full names
  `` `--ocelle-<name>` `` under `### Added` of the 1.0.0 entry and of Unreleased together equals `expectedTokens`, and the
  1.0.0 entry's `### Added` is not empty. A token named only under another heading does not count, and a
  `` `--ocelle-<prefix>-*` `` mention does not satisfy it. This is stricter than the old test, which read Unreleased only:
  it adds the required dated heading and keeps the full-name rule. The only section it adds is the one the first release
  moves the Unreleased content into. The package test stays stricter than the gate's prefix rule of R-09, because VIII
  replaces a test only with a stricter one and the 1.0.0 changelog already names every token in full.
- "names the selected bars' color-accent-strong ...": read from the 1.0.0 entry's `### Added` (was Unreleased / Added).
- "names no excluded token" is unchanged and keeps its `## Unreleased` heading check.

## Gate counts and lists (T024; FR-014, FR-044)

Reason, for each: "030 US2: release-readiness is a gate of FR-020 and Release readiness a required check".

| File and line | Old assertion | New assertion | Why stricter or equal |
|---|---|---|---|
| `gates/test/registry.test.ts:12` (`ids`) | nineteen ids ending `pack-contents` | twenty, ending `release-readiness` | adds the new gate |
| `gates/test/registry.test.ts:19-21` | `last: fr020.at(-1)` is `pack-contents` | `last: fr020.slice(-2)` is `["pack-contents", "release-readiness"]` | pins both last ids |
| `gates/test/registry.test.ts:138-144` | empty registry and workflow: 38 findings | 40, and exactly two of them name `release-readiness` | adds the gate's two findings |
| `gates/test/registry.test.ts:162-168` | registry check `[]`, then `ids` equal, two statements | one assertion `{ findings: [], ids }`, twenty ids | same checks, the new id |
| `gates/test/registry-parts.test.ts:39-42` | nineteen gates of FR-020 | twenty, with `release-readiness` last | adds the gate |
| `gates/test/gates-readme.test.ts:85-114` | "requires exactly these twenty checks", the twenty names | "twenty-one checks", the last three are Pack contents, Release readiness, Plants, then the full list | adds the check and its position |
| `gates/test/ci-workflow.test.ts:131-147` | the pack-contents job, and the header "requires the twenty check names" | the pack-contents job alone; the header's "twenty-one" is asserted by the new release-readiness job test | the count moves to the test of the job that changes it, one more |
| `gates/test/plant-runner.test.ts` "deals the repository's plants ..." | `others: 271` inside the whole object | first `expect(dealt.counts)` with `others: 302`, then the whole object with 302 | the thirty-one readiness plants; counts asserted on their own |
| `gates/test/plants.test.ts`, `gates/test/plants-job.test.ts` (the fixture world) | `N plants of 19 gates`, `problems in N plants`, `toHaveLength(57)`, `2 * 48`, `ran: 57`, `others: 54`, `of 59 plants`, shard `52 plants judged`, `ran: 50` | each count three more plants and one more gate (`20 gates`, `of 62 plants`, `55 plants judged`, `ran: 53`, ...); the affected-mode counts of selected plants stay | the registry fixture holds the new gate with a fail, a pass and a breaking plant |
| `gates/test/fixtures/registry/gates.json`, `ci.yml` | nineteen gates and jobs | the `release-readiness` entry (`commit-repo`) and job | fixture data of the counts above |
| `gates/test/integration/plants.test.ts:118-122`, `209-213`, `260-264` | `missing("pack-contents", [])`, `53 problems` | also `missing("release-readiness", [])`, `56 problems` | the root lacks the new gate's plants too |
| `gates/test/integration/plants-robustness.test.ts:181-182` | `others: 17` | `others: 18` | one other gate more |
| `gates/test/evidence-reuse-shadow.test.ts:8-14` (`requiredJobs`) | twenty names | twenty-one, Release readiness after Pack contents; new cases reject a prior or current run without it | the observer's list gains the check (operator decision on recheck item 2b, option (a)) |
| `gates/test/integration/evidence-reuse-observe.test.ts:15-21` (`jobNames`) | twenty required names | twenty-one, Release readiness after Pack contents | as above |

The changes to the registry fixture, `requiredJobs` and `jobNames` are shared test data: tests that read them fail on
the red commit on assertion lines it does not change, because release-readiness is not registered yet (the reason
phase 1's red evidence was accepted by operator decision, `reviews/phase-1/operator-red-decision.md`).

## Shared-data failures of the red commit (operator decision, reviews/phase-2/operator-red-decision.md)

`red.sh 2 phase` rejected red commit `8f5fea78` (`evidence.status: invalid`, first problem `unchanged assertion in
gates/test/plants.test.ts:92`). Of the 530 failing tests of the selected files, 407 fail on lines the red commit
changed; these 123 fail on lines it did not change, all because release-readiness was not registered yet:

| File | Failing tests | Shared data |
|---|---|---|
| `gates/test/evidence-reuse-shadow.test.ts` | 65 | `requiredJobs` holds Release readiness, the observer's list did not |
| `gates/test/plants.test.ts` | 44 | the registry fixture holds `release-readiness`, the FR-020 list did not (`not-fr-020`) |
| `gates/test/registry.test.ts` | 6 | the registry fixture and `ids`, as above |
| `gates/test/plants-job.test.ts` | 4 | the registry fixture, as above |
| `gates/test/integration/plants.test.ts` | 3 | the expected output names the release-readiness gate the real registry did not hold |
| `gates/test/integration/evidence-reuse-observe.test.ts` | 1 | `jobNames` holds Release readiness, the observer's list did not |

All 123 pass on the green commit.

## Replaced in the green commit (with the reason in its commit body)

| File and test | Old | New | Why |
|---|---|---|---|
| `gates/test/integration/plant-repo.test.ts`, "keeps the empty base for a plant built without the repository, as sign-off plants are, and lays the files over it" | built `readiness-plant` with no repository | builds a copy of that plant without its `delete: gates/release/pack-manifest.json` header, and first asserts the copy lacks it; the same tree assertions | the red tests contradicted each other: deleting a path the tree does not hold fails the build ("fails to build a record that deletes a path ..."), and an empty base holds no `gates/release/` |
