---
phase: 1
round: 1
verdict: approved
base: 44fd04282f99f0395a4580b3a101ac527fdd3f9c
head: ae5f4c7df7bbfc6961bf52e26fc71c9c64a02d5f
tdd_check: fail
---

# Phase 1 review, round 1

Change under review: `git diff 44fd0428..ae5f4c7d`. The commits are scaffold `cea2bea8`, red `1a24aa0b`, two
operator decisions (`b8b639b6`, `5e6ab0bc`), green `9a9b05d2`, plants and T020 `1f1fa043`, and tdd-check output
`ae5f4c7d`. The only uncommitted change is the untracked `reviews/phase-1/red-phase.log`. `operator-red-decision.md`
keeps it uncommitted on purpose.

`tdd_check` is `fail`. The cause is the one that `reviews/phase-1/operator-red-decision.md` names and accepts: `red.sh`
rejected `1a24aa0b` because about 120 existing tests fail on assertion lines that the commit did not change. The three
problems listed in `tdd-check.json` all come from that one cause: no red commit recorded, and no proven red assertion
to replay on the base or on the scaffold. I judged the red evidence against that decision, as instructed, and checked
it independently (see Test quality). The head run in `tdd-check.json` is green (`head_exit` 0, evidence `green`) on
`1f1fa043`. The later commit `ae5f4c7d` adds only the tdd-check output files. It has no `deferred_ci` list.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | `storybook/package.json:11-12`; `specs/030-release-v1/research.md:539-542` | The green commit pins Storybook's dev dependencies at `workspace:1.0.0`. This is needed: pnpm no longer resolves `workspace:0.0.0`, the pins gate accepts it, and the lockfile change is limited to these specifiers and the two peers. But it adds a fourth place that holds the version literally. R-15's version-bump pull request lists "exactly" the three manifests, the peers, the lockfile, the READMEs and the changelogs, and does not list `storybook/package.json`. A bump to `x.y.z+1` that follows R-15 as written would leave Storybook pinned to a version that no longer exists. | When `RELEASING.md` / R-15's procedure is written (US5, FR-043), add `storybook/package.json`'s two devDependencies to the bump list, or relax that pin in a way the pins rule accepts. This does not block this phase. |
| R1-02 | note | `gates/release/pack-manifest.json:58` | Elements also requires `licenses/lit-BSD-3-Clause.txt`, which is not in the minimum list of data-model.md § Pack manifest. That is allowed ("at least"). It matches research R-04, where elements ships `licenses/` with Lit's licence. The file is tracked (`packages/elements/licenses/lit-BSD-3-Clause.txt`), matches the `licenses/**` allow pattern, and every elements plant tree carries a stand-in, so no plant fails on it by accident. No change is needed. | none |
| R1-03 | note | `specs/030-release-v1/reviews/phase-1/red-phase.log` (untracked) | T010 says to keep the red output as the red evidence. The log exists, is redacted (no sandbox path), and records only `red.sh`'s first rejection, not the 151 changed-line failures. `operator-red-decision.md` keeps it uncommitted, and the caller asked for no commit in this round, so it remains untracked. | The operator chooses whether it is committed later. |

No blocking finding.

## Test quality

- **Red commit is tests-only.** Every path of `1a24aa0b` is in `test_pathspec` (`gates/test/**`,
  `packages/*/test/**`, `gates/test/fixtures/registry/*`, `gates/test/integration/workspace.ts`) or under
  `specs/030-release-v1/`. No source file is touched.
- **Failures are for the right reason.** I ran the red commit's tests again in a temporary worktree of `1a24aa0b`,
  covering the gates, tokens, styles and elements-node projects: pack-contents, pins-rules, plant-repo, registry,
  ci-workflow, gates-readme and the four package tests. Result: 140 of 1728 tests fail, every one with an
  `AssertionError` on missing behaviour. Examples:
  - exit codes 2 against the expected 1 or 0 (the scaffold's "not implemented" verdict);
  - parser messages that are expected but not thrown;
  - an empty deny list;
  - `licenceCopies` returning `[]`;
  - the manifests' `workspace:0.0.0` against `workspace:^<v>`;
  - the missing `pack-contents` job, README row and twenty-check text.

  None is an import, setup or type error. The about 120 shared-data failures (fixture registry, `requiredJobs`, plant
  counts) are listed in `replaced-tests.md`. They fail because pack-contents is not registered yet, which is also the
  right reason. The operator's decision covers them.
- **Scaffold** (`cea2bea8`) holds signatures and stubs only. The verdict is "not implemented" (exit 2),
  `parsePackManifest` and `readTarball` throw, `globMatch` returns false, and `buildPackTree` rejects. It adds no test
  file. The final tests fail against it (`final_tests_on_scaffold_exit` 2).
- **Green edits no test.** `git diff 1a24aa0b..HEAD` over `test_pathspec` is empty. The plant trees of the green
  commit (`dist/index.test.js` in `fail-test-file` included) do not match `test_pathspec`.
- **Replacements are stricter.** Each replaced package test:
  - carries a comment naming 030 and the reason;
  - adds `private`, `license`, `repository`, `publishConfig` and release-version assertions;
  - derives `<v>` from `packages/tokens/package.json`, never from a literal;
  - asserts that no `workspace:` is left in the READMEs.

  The registry "rejects" row for `plantForm` moved into the forms test with the six-form message. It is not dropped.
- **Non-vacuous.** test-lint passes (579 files, no conditional assertion, skip, only or snapshot-only). The sandbox-path
  unit test builds its value at run time (`"/" + "home/user"`) and asserts the finding never echoes it. The
  `fail-sandbox-path` plant uses op 023's `@SANDBOX_HOME_USER@` marker.
- **Acceptance scenarios of Story 1.**
  - 1: the exit-0 lines, in the unit test and in integration on the real workspace.
  - 2: each entry field, including the browser build.
  - 3: `LICENSE`, `NOTICE` and `OFL.txt` (required and identical).
  - 4: workspace, private and version.
  - 5: not-allowed, the deny list including `.npmrc`, `.env*` and test files, and sandbox-path.
  - 6: the ci-workflow, registry and gates-readme tests.

  Every scenario has a test. The phase has no element, event or keyboard path.
- **Mutation.** I did not run it locally. The caller's rule and the CI-first rule of tasks.md leave mutation to CI's
  required "Mutation testing" check. The new process-boundary lines in `gates/bin/pack-contents.ts` and
  `buildPackTree` carry `Stryker disable` records, each naming the integration test or plant that covers it, in the
  repository's usual style. The pure code (`gates/lib/pack-contents.ts`, `parseOmit`, `licenceCopies`, the pins rule)
  has no disable record.

## Checks run

Local runs, all on HEAD `ae5f4c7d`:

| Command | Exit | Result |
|---|---|---|
| `pnpm run gate:typecheck` | 0 | no type error |
| `pnpm run gate:lint` | 0 | 763 files, no finding |
| `pnpm run gate:test-lint` | 0 | 579 files, no finding |
| `pnpm run gate:pins` | 0 | 5 manifests, no finding |
| `pnpm run gate:prefix` | 0 | 875 files, no finding |
| `pnpm run gate:csp` | 0 | 93 files, no finding |
| `pnpm run gate:config-copies` | 0 | the copies are identical |
| `pnpm run gate:sandbox-paths` | 0 | 6948 tracked files, none holds a sandbox path |
| `pnpm run gate:pack-contents` | 0 | tokens@1.0.0: 22 files, 4 entry points; styles@1.0.0: 9 files, 2 entry points; elements@1.0.0: 264 files, 56 entry points; "3 packages at 1.0.0, each tarball exactly as declared" |
| `pnpm exec vitest run`, projects gates, tokens, styles and elements-node, on the 15 changed unit test files | 0 | 2078 tests passed |
| `pnpm run gate:plants -- --affected 44fd0428… --list` | 0 | `note: affected: every plant, by .gitignore (not mapped)`; 344 of 344 selected |

- **Plants.** The `--list` selection matches `plants.md`, whose base equals `base.sha`: every plant, by `.gitignore`.
  298 plants were judged and 46 visual plants were not run, 344 in total. `plants.md` records exit 2. The only cause is
  "no container engine" for the 46 visual plants. No problem line appears, and all 18 `pack-contents` plants and the 8
  registry plants were judged as expected. `reviews/phase-0/operator-plants-decision.md` accepts this ("CI decides
  plants").
- **CI pin.** The ci.yml blob of HEAD is `0b807c71…`, the value the observer now pins
  (`tooling/speckit/bin/evidence-reuse-observe.ts:410`). The base was `6eb0ec30…`.
  - `git diff 44fd0428..HEAD -- .github/workflows/ci.yml` changes only the header count ("eighteen" to "twenty") and
    adds the `pack-contents` job: pinned checkout with `persist-credentials: false`, `./.github/actions/setup` and
    `pnpm run gate:pack-contents`.
  - `.github/actions/` and `tooling/speckit/bin/record-visual-runtime.ts` are unchanged, and their pinned blobs are not
    edited. The visual job is untouched.
  - This is as `operator-ci-pin-decision.md` allows.
- **Registry plants.** All eight `gates/plants/plants/*` get the same nine-line `pack-contents` job in `ci.yml` and the
  same eight-line `gates.json` entry, copied from the real registry. Their planted defects and `plant.json` files are
  unchanged: `fail-gate-without-entry` still lacks `csp`, and `fail-gate-without-job` still lacks the `pins` job.
- **Lockfile.** `pnpm-lock.yaml` changes only four specifiers. The elements and styles `@ocelle/tokens` specifiers go
  from `workspace:0.0.0` to `workspace:^1.0.0`. Storybook's two go to `workspace:1.0.0`. The `link:` resolutions are
  unchanged.
- **Credentials and sandbox paths.** I scanned every added line of the phase for npm, GitHub and AWS token shapes,
  private-key headers, `password` and `secret` assignments, `_authToken`, and `/home/`, `/tmp/`, `/root/` and `/Users/`
  paths. There was no hit. The `fail-npmrc` plant's `.npmrc` holds only `save-exact=true`. The evidence logs hold no
  sandbox path.
- **Tasks.** T004 to T020 are all ticked, and their work is present:
  - NOTICE edited exactly as R-04 says;
  - manifests per data-model.md § Package manifest fields;
  - build-script copies, with the copies in `.gitignore`;
  - READMEs at `^1.0.0`;
  - the pins rule (D2) accepts `workspace:^<own version>` in peers only;
  - the pack manifest;
  - the gate and CLI per the contract, including the deny list;
  - the `pack-tree` form with the licence copy and `omit.txt`;
  - the 18 plants, of which only `fail-notice-differs` ships its own `NOTICE`;
  - the registration: `gates.json`, the FR-020 list and the form union, the ci.yml job, `requiredJobs`, the README row
    and spec 001 `ci-checks.md`;
  - changelogs unchanged.

  `plants.md` confirms that the gate requires only each changelog's presence. The changes outside the tasks are the
  storybook pin and the lockfile, the registry plants and the observer re-pin. Each comes with a reason in the green
  commit message or in an operator decision.
- **Constitution.**
  - VIII: red-first; replacements stricter and recorded.
  - Supply chain: exact pins kept; the peer caret is the plan's D2 exception, pending the US5 amendment that the plan's
    Constitution Check records.
  - Licence: Apache-2.0 and the licence files shipped.
  - No secrets.
  - Every commit is signed off.
  - The element-side principles (I to V) do not apply to this phase, which changes no element, story or style.
- **Not verified here.** I could not read CI's required checks for HEAD: the read-only `gh api` query was not
  permitted in this session. Mutation testing, Visual regression, Accessibility, the full Unit tests, the full Plants
  job and the new Pack contents check are decided by CI under the CI-first rule. This approval assumes they pass on the
  pull request before merge, which the required checks enforce.

## Earlier findings

None: this is the first round of phase 1.
