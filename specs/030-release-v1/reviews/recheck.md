# Recheck of the design against `main` as merged (030, T002)

- branch: `claude/011-release-v1`
- phase 0 base: `7af6180b2ac3027f565c296db3c03facfea86aaa`
- merged (`FETCH_HEAD` of `git fetch origin main`, T001): `d45efd57402395999fcd7ab8fc29fba2c14a4e88`
- merge commit: the signed-off merge of `d45efd57` into the branch (`git merge --no-edit --signoff -s ort FETCH_HEAD`),
  clean; nothing under `specs/030-release-v1/` was touched by it.

Open differences that change a task: **one**, item 2b below (the Visual evidence reuse observer's hard-coded check
list). Per T002, phase 1 (T004 onwards) waits for the operator's answer.

## 1. Mission 018 and op 023 in the merged history; the `main` commit merged

- as planned: both merged on `main` before this run; T040 writes the full SHA of the merged `main` commit into
  `gates/release/first-release-base`.
- as on `main`: `main` lands every pull request as one squash commit, so each is one first-parent commit:
  - mission 018: `d45efd57` "Mission 018: status elements — pill tag, status indicator and metric (closes #7) (#105)";
  - op 023: `69add83a` "Op 023: public repository hygiene: sandbox-path gate, redaction and SECURITY.md (#60) (#80)".
  - first-parent commits of `main` since `183b20f9`: `6a6d74c2` (#94, mission 029 workflow canvas), `69add83a`
    (op 023), `c3d9000d` (#98), `25c53a91` (#99), `64c57578` (#101), `3d090026` (#102, step indicator and pane
    action footer), `1d599fd4` (#103), `d45efd57` (mission 018).
  - full SHA for T040: `d45efd57402395999fcd7ab8fc29fba2c14a4e88`.
- difference: none (#99 and #102 also landed; they add elements and stories only, see items 7 and 9).

## 2. Gate ids and check names: `gates/gates.json`, `gates/lib/registry.ts`, `.github/workflows/ci.yml`

- as planned: 18 gates with `sandbox-paths`, 19 required checks, plus mission 029's changes; the new ids
  `pack-contents`, `release-readiness`, `release-workflow` and checks "Pack contents", "Release readiness", "Release
  workflow" collide with nothing.
- as on `main`:
  - `gates/gates.json`: 18 entries; the last is `sandbox-paths` ("Sandbox paths", form `tracked-tree`, line 141).
    Helper jobs: `unit-tests` has `unit-tests-plan`, `unit-tests-shard`, `unit-tests-full`; `mutation` has
    `mutation-plan`, `mutation-shard`.
  - `gates/lib/registry.ts:22-45`: the FR-020 list, 18 ids, ending `// op 023 (#60): the sandbox-paths gate.` and
    `"sandbox-paths"` (line 44); `plantJob` `plants` (line 48), `plantHelperJobs` `plants-plan`, `plants-shard` (51).
  - `.github/workflows/ci.yml`: the 18 gate jobs plus `unit-tests-plan` (46), `unit-tests-shard` (65),
    `unit-tests-full` (91), `mutation-plan` (160), `mutation-shard` (178), `sandbox-paths` (350, "Sandbox paths"),
    `plants-plan` (359), `plants-shard` (374), `plants` (408, "Plants").
  - `gates/README.md:191-218`: "exactly these nineteen checks", Typecheck to Sandbox paths (18) and Plants (19).
  - mission 029 (#94) changed no gate, registry entry or `ci.yml` job (its diff under `gates/` is test fixtures and
    plant trees). #103 added two steps to the `visual` job (`ci.yml:311-314`, `325-328`) and two new workflows,
    `.github/workflows/evidence-reuse-shadow.yml` and `.github/workflows/mutation-config-shadow.yml`; #98 added
    `.github/workflows/mutation-shadow.yml`. None of them is a required check.
  - no job id, check name or workflow on `main` is `pack-contents`, `release-readiness`, `release-workflow`, "Pack
    contents", "Release readiness", "Release workflow", `release.yml`, `release-dry-run.yml` or "Release dry run".
- difference (2a, no task change): the header comment of `ci.yml:1-4` still says the ruleset "requires the eighteen
  check names", while `gates/README.md:194` says nineteen. The header is a comment no test reads; T019, T033 and T047
  touch `ci.yml` and may correct it, no task needs to change for it.
- difference (2b, **changes tasks**): #103 added a fourth hard-coded list of the required checks, outside the three
  files T019, T033 and T047 change:
  - `gates/bin/evidence-reuse-shadow.ts:3-9`: `safeguards = ["Sign-off", "Sandbox paths"]` and `requiredJobs`, the 19
    check names; `expectedJob` (line 146) accepts only those names, the helpers and the shard patterns, and
    `completeJobs` (lines 155-166) requires every job of a `ci.yml` run to be an expected one.
  - tests: `gates/test/evidence-reuse-shadow.test.ts:8-13` (`requiredJobs`, the same 19 names) and
    `gates/test/integration/evidence-reuse-observe.test.ts:16-18`. Neither reads the real `ci.yml`, so no test turns
    red when the mission adds its jobs.
  - effect: once `ci.yml` has the `pack-contents`, `release-readiness` and `release-workflow` jobs, every run of
    `ci.yml` holds jobs the observer does not expect, so the Visual evidence reuse observer
    (`.github/workflows/evidence-reuse-shadow.yml`, opt-in, not required) judges every later run ineligible. No task of
    `tasks.md` names `gates/bin/evidence-reuse-shadow.ts` or its tests.

## 3. `gates/lib/sandbox-paths.ts` (contract `pack-contents-gate.md`, rule `sandbox-path`)

- as planned: the exported rule and allowed-files list, which the pack-contents gate reuses on every text entry.
- as on `main`: the file exists. `export const sandboxPathRule` (line 16,
  `"(^|[^A-Za-z0-9._~-])/(root|home/user)/[A-Za-z0-9._-]"`, a regular-expression source string),
  `export const allowedFiles` (lines 19-24, four repository paths: `gates/test/capture-plan.test.ts`, two pins
  fixtures, `specs/001-repository-foundation/reviews/phase-4/round-1.md`), and `grepArgs`, `attributeFreeOptions`,
  `parseGrep`, `verdict`; the finding message names `tooling/speckit/bin/redact-sandbox-paths.sh --in-place`.
- difference: none. (The allowed files are repository paths; none can be a tarball entry, so the pack-contents gate
  applies the rule to every text entry with no exception, as the contract says.)

## 4. `gates/lib/plant-repo.ts` and `gates/bin/plants.ts` against research R-17

- as planned (R-17 facts): `commit-repo` plants are built with `commit-tree` on the empty tree and `parseCommits`
  accepts only `author`, `parent` and `merge` headers; the `workspace` form copies the plant directory only; the
  configuration set lacks `.github/`, `gates/release/`, changelogs, styles sources beyond `base.css`, the gap-table
  source and `verification.md` files. T017 adds the `pack-tree` form in `plant-repo.ts` and `plants.ts`; T019 touches
  `gates/lib/registry.ts`.
- as on `main`:
  - `parseCommits` (`plant-repo.ts:138`) reads the headers `author`, `parent`, `merge` (lines 140-177) and nothing
    else; `buildCommitRepo` (line 635); `configurationSet` (line 97) = `rootConfiguration` (37-50), package
    manifests and tsconfigs, `gates/eslint`, `gates/stylelint`, `tokenFiles` (57-62), `elementFiles` and
    `optionalElementFiles` (69-74), `storybookFiles` (81-91, with `packages/styles/src/base.css` and
    `packages/tokens/fonts`). No `.github/`, `gates/release/`, changelog, other styles source, gap-table source,
    `verification.md` or root licence file.
  - op 023 added a fifth form, `tracked-tree` (`buildTrackedTree`, `plant-repo.ts:689`; `plants.ts:594`; the
    `PlantForm` union and `forms` list of `registry.ts:8` and `53`).
  - the build map of the forms is `plants.ts:586-594`; `plantValues` is in `gates/lib/plant-runner.ts:139` (it was
    there at `183b20f` too), not in `gates/bin/plants.ts`. `plantArgs` (`gates/lib/plant-judge.ts:227`) replaces
    `{name}` inside an argument, so a plant command `--tarballs {root}/tarballs` needs no new placeholder value.
- difference: none that changes a task. Notes for T017 and T019: the `pack-tree` form also enters the `PlantForm`
  union, the `forms` list and its error text in `gates/lib/registry.ts` (T019 already changes that file and T008
  asserts the form there), and the `build` record type of `plant-runner.ts:28` (typed by `PlantForm`) follows from it;
  `plantValues` needs no change.

## 5. `gates/lib/mutation/ranges.ts` (R-11)

- as planned: `gates/lib` and `gates/bin` are in the mutation gate's scope.
- as on `main`: `scopePathspecs` (lines 27-43) include `:(glob)gates/bin/**/*.ts` (29) and `:(glob)gates/lib/**/*.ts`
  (30); `inScope` (line 50) uses the same set. `stryker.elements.config.json` `dryRunTimeoutMinutes` is 45 (mission
  018), and `gates/README.md:237` states the 75-minute limit for element shards.
- difference: none.

## 6. `gates/test/ci-workflow.test.ts` and the `ci.yml` jobs the US2 and US3 red tests amend

- as planned: T024 asserts `fetch-depth: 0` on the checkouts of `unit-tests-shard` and `unit-tests-full`; T037 the
  `workflow_call` trigger and `BASE: ${{ inputs.base || github.event.pull_request.base.sha }}` in the mutation jobs
  and the sign-off range.
- as on `main`:
  - `ci.yml:12-13`: `on:` / `pull_request:` only.
  - `unit-tests-shard` (65-90): checkout at 74-76 with `persist-credentials: false`, no `fetch-depth`.
  - `unit-tests-full` (91-109): `if:` same-repository and `<!-- verify-unit-test-parity -->` (94); checkout 97-99, no
    `fetch-depth`.
  - `mutation-plan` (160-177): `fetch-depth: 0` (169), `BASE: ${{ github.event.pull_request.base.sha }}` (173).
  - `mutation-shard` (178-198): `fetch-depth: 0` (192), `BASE: ${{ github.event.pull_request.base.sha }}` (196),
    `timeout-minutes` 75 or 10 (183).
  - `signoff` (254-266): `fetch-depth: 0` (261), `BASE` (264), `HEAD: ${{ github.event.pull_request.head.sha }}`
    (265), `--range "$BASE..$HEAD"` (266).
  - `gates/test/ci-workflow.test.ts`: `job()` helper (15-20); "ci.yml mutation jobs" (23-73: the `mutation-plan` tail
    with `BASE` at 27, the full `mutation-shard` job with `BASE` at 51, the 75-minute case at 57); op 023's
    "ci.yml sandbox-paths job" (112-126); the visual and plants jobs (168-), which #103 amended for the two new visual
    steps; "ci.yml full Unit tests gate" (277-290). No test of `ci-workflow.test.ts` asserts the `on:` block or the
    `signoff` job.
- difference: none. These lines are the same as at `183b20f` except the visual steps of #103, which T024 and T037 do
  not touch.

## 7. Existing tests that pin what this mission changes (T009, T025, T051, T058)

- as planned: the tests listed in T002.
- as on `main`:
  - manifests: `packages/tokens/test/build.test.ts:102` `describe("package.json")`, case at 103; `packages/styles/test/build.test.ts:55`
    "node scripts/build.ts <out>, the package build's second step", with `peerDependencies: { "@ocelle/tokens":
    "workspace:0.0.0" }` at 66.
  - peer and version sentences: `packages/styles/test/readme.test.ts:38-39` (the `workspace:0.0.0` and "stay at 0.0.0
    until the first release (#11)" fragments), `:164` "names the tokens version of package.json's peer dependency"
    (`toBe("workspace:0.0.0")` at 167); `packages/elements/test/node/readme.test.ts:1215` "names the @ocelle/tokens
    peer dependency of package.json" (`toBe("workspace:0.0.0")` at 1218).
  - root `NOTICE`: `packages/elements/test/node/readme.test.ts:2173` "NOTICE: the repository's Apache-2.0 notice with
    the trademark note".
  - "Unreleased" sections: `packages/tokens/test/readme.test.ts:87` `describe("packages/tokens/CHANGELOG.md")` (89,
    92, 99, 107); `packages/styles/test/readme.test.ts:172` (174, cases 177-219);
    `packages/elements/test/node/readme.test.ts:1786` `describe("packages/elements/CHANGELOG.md")` (1788, 1991, 2006)
    and `:2142` "MINOR entry (014 T111)" (2143); `packages/elements/test/node/changelog.test.ts` (helper `unreleased`
    at 21; 15 describes at 23, 33, 43, 63, 73, 83, 93, 103, 115, 127, 139, 150, 158, 166). Mission 018 added the
    describes at 73, 83, 93, 103, 127 (elements) and 150, 158, 166 (tokens changelog), all reading "under Unreleased";
    mission 018 also added fragments to `packages/tokens/test/readme.test.ts` (README, not changelog).
  - READMEs, `CONTRIBUTING.md`, `THIRD_PARTY_NOTICES`: `gates/test/governance.test.ts:32`, `:41`, `:47`, `:78`;
    `packages/tokens/test/font.test.ts:84` `describe("THIRD_PARTY_NOTICES")`.
  - also seen, no change needed: `packages/elements/test/build/pack.test.ts` (since mission 015; mission 018 added
    cases 38-59) asserts only that files are packed (`LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES`, entry points), which
    stays true; `packages/elements/test/build/build.test.ts` (018 module-build cases) reads no manifest field this
    mission changes. Missions 029 and #102 added element tests only.
  - `git grep` over the `test_pathspec` files for `.specify/memory/constitution.md` and
    `specs/001-repository-foundation/`: four hits:
    1. `gates/test/governance.test.ts:51`, "CONTRIBUTING.md states there is no contributor licence agreement and
       points to Spec Kit and the constitution (FR-031)": asserts `CONTRIBUTING.md` contains the constitution's path;
       mentions, does not read it.
    2. `gates/test/plant-runner.test.ts:856`: the path in a list of no-plant paths; mentions, does not read it.
    3. `gates/test/sandbox-paths.test.ts:15` (op 023): `specs/001-repository-foundation/reviews/phase-4/round-1.md` in
       the expected allowed-files list; mentions, does not read it.
    4. `gates/test/integration/sandbox-paths.test.ts:19` (op 023): the same path in the same list; the test runs the
       gate on temporary repositories it builds; mentions, does not read it.
- difference: two more hits than expected (3 and 4, from op 023). Neither reads the constitution or any file of spec
  001, and neither names a file phase 5 amends (`contracts/ci-checks.md`, `contracts/plants.md`, `spec.md`), so the
  claim of phase 5 holds and no task changes. (The Sandbox paths gate scans every tracked file, the amended
  constitution and spec 001 among them; it is a gate, not a test reading them.)

## 8. `packages/elements/custom-elements.json`: mission 018's tags and members (gap rows 6, 10, 15)

- as planned: `ocelle-status-indicator`, `ocelle-metric`, `ocelle-pill-tag` and their members for rows 6, 10 and 15.
- as on `main`: 52 tags (47 at `183b20f`; added: `ocelle-workflow-canvas` (#94), `ocelle-step-indicator` (#102),
  and the three of mission 018).
  - `ocelle-status-indicator` (line 6375, `src/ocelle-status-indicator.ts`): attributes and fields `tone`, `label`,
    `pulse`; css parts `dot`, `ring`.
  - `ocelle-metric` (line 4756, `src/ocelle-metric.ts`): attributes `layout` (`"stack" | "row"`), `label`,
    `display-value`; fields `label`, `displayValue`, `layout`; css parts `label`, `value`.
  - `ocelle-pill-tag` (line 5655, `src/ocelle-pill-tag.ts`): attributes `status`, `variant` (`"pill" | "badge"`),
    `density` (`"default" | "compact"`), `interactive`, `href`, `disabled`, `label` and the moved ARIA attributes;
    fields `interactive`, `href`, `disabled`, `label`, `status`, `variant`, `density`; slots default and `icon`; css
    parts `pill`, `control`; events `ocelle-pill-tag-activate`, `click`.
  - row 10's other evidence: `ocelle-notice` (line 5075) attribute and field `size` (`"regular" | "compact"`); the
    eyebrow style hook in `packages/styles/src/base.css` (column-header rule at 312-318 and 426-428, using the
    `--ocelle-*-eyebrow` tokens), present at `183b20f` too.
- difference: none. Rows 6 (`ocelle-status-indicator`), 10 (`ocelle-metric` with `layout` `row`) and 15
  (`ocelle-pill-tag` with `interactive`, `density` `compact`, `variant` `badge`) now have element and member evidence
  on `main`, and none of the three tags is in the manifest at `183b20f`, as R-07 expects.

## 9. Package manifests, changelogs, root `NOTICE` and `THIRD_PARTY_NOTICES` as merged

- as planned: data-model.md § Package manifest fields describes the change from the state on `main`.
- as on `main`:
  - `packages/tokens/package.json`: `version` `0.0.0`, `private: true`, `files` `["dist", "CHANGELOG.md",
    "README.md"]`, build `tsc -p tsconfig.json && node scripts/build.ts`, 4 exports (unchanged since `183b20f`).
  - `packages/styles/package.json`: the same `files` and build, peer `"@ocelle/tokens": "workspace:0.0.0"`, 2
    exports (unchanged since `183b20f`).
  - `packages/elements/package.json`: `0.0.0`, `private: true`, `files` `["dist", "custom-elements.json",
    "licenses", "README.md", "CHANGELOG.md", "LICENSE", "NOTICE", "THIRD_PARTY_NOTICES"]`, build copies the three
    root files, `lit` `3.3.3`, peer `workspace:0.0.0`; 55 exports (five more since `183b20f`:
    `ocelle-workflow-canvas.js`, `ocelle-step-indicator.js`, `ocelle-status-indicator.js`, `ocelle-metric.js`,
    `ocelle-pill-tag.js`).
  - `packages/*/CHANGELOG.md`: each has `## Unreleased` at line 6 and no released section; elements `### Added` at 95.
  - root `NOTICE` (13 lines; "The published @ocelle/elements package holds a copy.") and `THIRD_PARTY_NOTICES` (28
    lines), `LICENSE` (202 lines): unchanged since `183b20f`.
- difference: none (the five new element entry points are exports the pack manifest of T014 takes from
  `package.json` as merged).

## 10. Strict-CSP server pattern and `font-src 'self'` (R-11, FR-030)

- as planned: the install check reuses the pattern of `packages/elements/test/browser/serve.ts` and the policy of
  `packages/tokens/test/browser/csp.test.ts`.
- as on `main`: `serve.ts:41` `export const policy = "default-src 'none'; script-src 'self'; style-src 'self';
  font-src 'self'"`, sent on every response (110, 123, 126); `csp.test.ts:11` the same policy string. Both
  unchanged since `183b20f`.
- difference: none.

## 11. `.node-version`, `packageManager`, npm bundled with the pinned Node (R-01, R-02)

- as planned: the npm CLI of the pinned Node is at least 11.5.1 (trusted publishing), checked with `npm --version`
  after `pnpm run setup:online`.
- as on `main`: `.node-version` `26.13.0`; `package.json:5` `"packageManager": "pnpm@12.16.1"`; the shared setup
  (`.github/actions/setup/action.yml`) installs Node from `.node-version` with `actions/setup-node` and checks
  `node --version` equals it.
  - npm bundled with Node v26.13.0: **11.20.0** (the Node.js release index `https://nodejs.org/dist/index.json`,
    entry `v26.13.0`, field `npm`, release date 2026-10-28), at least 11.5.1.
  - this agent's environment does not run the pinned Node (it has Node 22.23.5 with npm 10.9.9), so `npm --version`
    here does not show the pinned Node's npm; the value above is the release index's. `pnpm run setup:online` does
    not install Node (it is `pnpm install --frozen-lockfile && pnpm exec playwright install chromium`).
- difference: none for the design (11.20.0 meets R-01, R-02). The way it was checked differs from T002's wording; CI's jobs
  run on the pinned Node.

## 12. `183b20f` in the merged history (R-07)

- as planned: the commit resolves.
- as on `main`: `git rev-parse 183b20f` is `183b20f9148e6fa0a402b23e367328f6a8683f97`, an ancestor of `HEAD`
  (`git merge-base --is-ancestor`).
- difference: none.

## Checks run after the merge

- `pnpm run gate:typecheck`: "typecheck: no type error in the files of tsconfig.json".
- `pnpm run gate:lint`: "lint: 759 files checked, no finding".
- `pnpm run gate:sandbox-paths`: "sandbox-paths: 6609 tracked files checked, none holds a sandbox path (4 allowed
  files)".

## Question for the operator (difference 2b)

Once this mission adds the `pack-contents`, `release-readiness` and `release-workflow` jobs to `ci.yml`, the Visual
evidence reuse observer of #103 (`gates/bin/evidence-reuse-shadow.ts`, hard-coded required-check list) judges every
later `ci.yml` run ineligible; no task covers it and no test would show it. Which?

- (a) Extend T008/T019, T024/T033 and T047 (and their red tests): each registration also adds its check name to
  `requiredJobs` in `gates/bin/evidence-reuse-shadow.ts`, red-first in `gates/test/evidence-reuse-shadow.test.ts`
  (and the fixture list of `gates/test/integration/evidence-reuse-observe.test.ts`).
- (b) One new task in phase 6: add the three check names to the observer's list, red-first, once all three jobs exist.
- (c) Leave the observer as it is (an opt-in, non-required trial) and record it as a follow-up issue for the owner of
  #103; no task changes.
