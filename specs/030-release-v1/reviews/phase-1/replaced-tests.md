# Replaced and extended tests of phase 1 (030 US1)

Every test below is changed in the red commit of phase 1 (constitution VIII), never in a green commit. Each replaced
test carries a comment naming 030 and the reason. Line numbers are those after the red commit. `<v>` is the version
read from `packages/tokens/package.json` (no literal `1.0.0`, research R-15).

Reason for every package test (T009): "the first release replaces the internal `0.0.0` state: FR-001, FR-002, FR-003,
FR-042".

## Package tests (T009)

| File and line | Old assertion | New assertion | Reason |
|---|---|---|---|
| `packages/tokens/test/build.test.ts:107` "package.json" | `exports` as now; `files` `["dist", "CHANGELOG.md", "README.md"]`; `scripts` `{ build: "tsc -p tsconfig.json && node scripts/build.ts" }` | `exports` unchanged; `files` `["dist", "CHANGELOG.md", "README.md", "LICENSE", "NOTICE", "THIRD_PARTY_NOTICES"]`; `scripts` `{ build: "tsc -p tsconfig.json && node scripts/build.ts && cp ../../LICENSE ../../NOTICE ../../THIRD_PARTY_NOTICES ." }`; no `private`; `license` `Apache-2.0`; `repository` with `directory` `packages/tokens`; `publishConfig` `{ access: "public", registry: "https://registry.npmjs.org/" }`; `version` a release version of major 1 or higher with no pre-release part | the reason above (FR-001, FR-002) |
| `packages/styles/test/build.test.ts:55` "node scripts/build.ts <out>, the package build's second step" (manifest part, lines 61-85) | `files` `["dist", "CHANGELOG.md", "README.md"]`; `scripts` without the copy; `peerDependencies` `{ "@ocelle/tokens": "workspace:0.0.0" }` | `files` `["dist", "CHANGELOG.md", "README.md", "LICENSE", "NOTICE"]`; `scripts` `{ build: "tsc -p tsconfig.json && node scripts/build.ts && cp ../../LICENSE ../../NOTICE ." }`; `peerDependencies` `{ "@ocelle/tokens": "workspace:^<v>" }`; no `private`, `license`, `repository` (`packages/styles`), `publishConfig` as for tokens; `version` equal to the tokens version, a release version | the reason above (FR-001 to FR-003) |
| `packages/styles/test/readme.test.ts:169` "names the tokens version of package.json's peer dependency" | the manifest's peer is `workspace:0.0.0` and the README contains `"@ocelle/tokens": "workspace:0.0.0"` | the manifest's peer is `workspace:^<v>`, the README contains `"@ocelle/tokens": "^<v>"` and no `workspace:` | the reason above (FR-003, FR-042) |
| `packages/elements/test/node/readme.test.ts:1218` "names the @ocelle/tokens peer dependency of package.json" | the manifest's peer is `workspace:0.0.0` and the README contains `"@ocelle/tokens": "workspace:0.0.0"` | the manifest's peer is `workspace:^<v>`, the README contains `"@ocelle/tokens": "^<v>"` and no `workspace:` | the reason above (FR-003, FR-042) |
| `packages/styles/test/readme.test.ts` fragments (two removed from the `fragments` table) and the new test "states the tokens version as a caret peer of the shared release version (030)" | "The package declares it as an exact peer dependency, `"@ocelle/tokens": "workspace:0.0.0"`" and "Both packages stay at 0.0.0 until the first release (#11), so the pin becomes meaningful at that release" | "The package declares it as a peer dependency at a caret range of the same version" and "The three packages share one version and are released together" (the range itself is the derived `^<v>` case above) | the reason above (FR-042) |
| `packages/elements/test/node/readme.test.ts` "NOTICE: the repository's Apache-2.0 notice with the trademark note" (extended by a new test in that describe) | four statements | the same four, and the new test "says that each published @ocelle package holds a copy and where THIRD_PARTY_NOTICES is (030)": "Each published @ocelle package holds a copy" and "in this repository and in the @ocelle/tokens and @ocelle/elements packages" (T011, research R-04) | the `identical` rule ships the root `NOTICE` in all three packages |

## Gate tests whose expected values the registration of pack-contents changes (T006, T008)

| File and line | Old assertion | New assertion | Reason |
|---|---|---|---|
| `gates/test/plant-repo.test.ts:29` "lists the root configuration, ..." | the exact configuration set of 002 and 006 for two package dirs | the same list called with two spec dirs and two stylesheets, followed by the 030 release inputs (`.github/workflows`, `.github/actions`, `gates/release`, the gap-table source, `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES`, `packages/tokens/fonts/OFL.txt`, each package's `CHANGELOG.md`, the stylesheets other than `base.css`, each spec's `verification.md`) | research R-17: the configuration set gains the release inputs |
| `gates/test/integration/plant-repo.test.ts` `copiedUnchanged`, `sourceRoot` (extended, not replaced) | `copiedUnchanged` reads the 26 files of `configuration`; `sourceRoot` copies them | `copiedUnchanged` takes the list to check (default `configuration`) and is false (not an error) for a file the repository lacks; a new list `releaseConfiguration` (14 release-input files) and a new test "copies the release inputs of 030 unchanged into a plant root"; `sourceRoot` also copies the release inputs the repository holds | research R-17 |
| `gates/test/gates-readme.test.ts:87` "requires twenty checks on main ..." (was "requires nineteen checks") | "requires exactly these nineteen checks", 19 names | "requires exactly these twenty checks", 20 names with Pack contents before Plants | FR-006: the gate joins the required checks the way op 023's did |
| `gates/test/registry.test.ts:12`, `:19`, `:156`; `gates/test/registry-parts.test.ts:39` | eighteen FR-020 gates ending `sandbox-paths` | nineteen, ending `pack-contents` | FR-006 |
| `gates/test/registry.test.ts:133` "reports every gate when the registry and the workflow are empty" | `toHaveLength(36)` (eighteen gates, each missing twice) | `toHaveLength(38)` (nineteen) | FR-006 |
| `gates/test/registry.test.ts` "accepts each plant form, pack-tree among them, and names the six in the error for another" (was "accepts each plant form"; the plantForm error row moved here from the "rejects $text" table) | the accepted forms and the error text without `pack-tree` | with `pack-tree` before `workspace`, asserted not to throw before its result is read | research R-17 |
| `gates/test/plant-runner.test.ts:40`, `:758` | the fake builders without `pack-tree`; 253 other plants | with a `pack-tree` builder; 271 other plants (the 18 pack-contents plants), still four shards | research R-17 |
| `gates/test/plants.test.ts`, `gates/test/plants-job.test.ts` (plant counts of the fixture world) | the counts of a fixture registry of 18 gates | three plants and one gate more in each count of the single run and the shards (the affected-mode selections unchanged), because the registry fixture gains the pack-contents entry and job | the registry fixture (`gates/test/fixtures/registry/`) must match the FR-020 list; its entry uses the repo-tree form so it loads before `pack-tree` exists, as op 023 did |
| `gates/test/evidence-reuse-shadow.test.ts:8` `requiredJobs`; `gates/test/integration/evidence-reuse-observe.test.ts:15` `jobNames` | 19 required check names | 20, with "Pack contents" | operator decision on recheck item 2b, option (a) |
| `gates/test/integration/plants.test.ts:117`, `:208`, `:259` (the plant job on a plants root) | eighteen gates missing their plants, "50 problems" | the same plus `missing("pack-contents", [])`, "53 problems" | the real registry gains the pack-contents gate, whose plants that root does not hold |
| `gates/test/integration/plants-robustness.test.ts:182` "has the two gates' plants and the registry's" | `others: 16` | `others: 17` | the pack-contents gate is one other gate more |
| `gates/test/integration/workspace.ts` `releaseInputs` (new helper), used by the roots of `gates/test/integration/plants.test.ts` and `gates/test/integration/plants-robustness.test.ts` | the roots held no release input | they hold the release inputs the repository has (research R-17), since the configuration set requires them | research R-17 |

## Shared-data failures of the red commit (operator-red-decision.md)

The red commit `1a24aa0b` is accepted as red evidence by `reviews/phase-1/operator-red-decision.md`, although
`red.sh` reports it `invalid`: about 120 existing tests fail in it on assertion lines the commit did not change,
because the commit changes data they share. All fail because pack-contents is not registered yet. By file:

| File | Failing tests | Shared data the red commit changes |
|---|---|---|
| `gates/test/evidence-reuse-shadow.test.ts` | 63 | `requiredJobs` gains "Pack contents" |
| `gates/test/plants.test.ts` | 44 | the registry fixture gains pack-contents |
| `gates/test/registry.test.ts` | 7 | the registry fixture (6) and `ids` against the real registry (`:164`) |
| `gates/test/plants-job.test.ts` | 4 | the registry fixture |
| `gates/test/integration/plants.test.ts` | 3 | the real registry's missing pack-contents plants |
| `gates/test/integration/evidence-reuse-observe.test.ts` | 1 | `jobNames` gains "Pack contents" |
| `gates/test/plant-runner.test.ts` | 1 | the count of the repository's plants (271 others) |

The other 151 failing assertions are on changed lines and the classifier accepts them.
