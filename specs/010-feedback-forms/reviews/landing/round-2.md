---
scope: landing
phase: landing
round: 2
verdict: approved
base: 4911fd0b971d1fa4fd0c629a0e95fe4d7a416c38
head: b746d15a
tdd_check: pass
---

# Landing review, round 2 (PR #49, mission 010-feedback-forms)

This is a stop-rule round, so I did not search afresh. I checked two things on head `b746d15a`, whose merge-base with
`origin/main` is `4911fd0b`:

1. Round 1's blocking findings L1-01 and L1-02 are resolved.
2. The landing folds and the three merges of main regressed nothing. I spent the most time on the third merge
   (`25ed484d`, main at `4911fd0b`), its one fix commit `d0e0d164`, and the operator decisions on the merged tree.

Settled, so not raised again: the operator decisions recorded in spec.md, plan.md and `reviews/**`, among them O3-01,
decision-stop-1, the shard-time limit and main's visual-test limit.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L2-01 | note | `reviews/landing/merge.md` § Third merge, "Resolution per file", first row (`packages/tokens/contrast/pairs.json` "auto-merged to main's file") | The record is slightly inaccurate, but the outcome is right. Git's own merge of the two sides (`git merge-tree --write-tree 763999fc 4911fd0b`) does not give main's file. It adds the branch's ten `color-ink`-on-state-ground rows a second time, near the top of each theme (5 light, 5 dark), because main has the same ten rows at lines 176-180 and 391-395. The merge commit holds main's file byte for byte (`git diff 4911fd0b 25ed484d -- packages/tokens/contrast/pairs.json` is empty), so each pair appears once and `gate:contrast` passes with 207/215. Outside the 28 conflicted files, this is the only file where the merge commit differs from git's own merge. | Record only: say that the duplicated rows were taken out in favour of main's file. |
| L2-02 | note | merge commit `25ed484d` message; `reviews/landing/merge.md` § Generated files | The merge commit message says "custom-elements.json and the eight manifest plant copies were regenerated". merge.md says "None regenerated; each was checked fresh". Both files in the merge commit equal git's own merge of the two sides, and `gate:manifest` passes ("23 elements checked, no finding"). The merge.md account fits the tree, and the commit message does not. | None. History is not rewritten for a commit message. |
| L1-03 | note, resolved | `packages/elements/src/ocelle-notice.ts:343` | The equivalent-mutant reason now names both things LitElement's `disconnectedCallback()` does: it tells reactive controllers, and it disconnects async directives. | None. |
| L1-04 | note, resolved | `packages/elements/README.md:183-184` | The README now says that the bar and the ground differ only by colour, and not at all in forced colours, "so the host's text must state the tone". | None. |
| L1-05 | note, carried | `packages/elements/scripts/manifest.ts:50,88-97,138-141` | (a) Under O3-01, bases are now read from a named list (`internalBases = ["form-control.ts", "overlay.ts"]`), and they are not read transitively. A third internal base would need a list entry. No element on the tree needs one: the only non-`LitElement` superclasses are `OcelleOverlay` and `FormControl`. (b) It is partly addressed by main's `declared()`: a standard attribute that the element itself declares with a description is kept. A standard attribute declared without a description is still dropped. | Follow-up only, as in round 1. |
| L1-06 | note, carried | `reviews/landing/merge.md` § Resolution per file (first merge) | The first merge's table still does not name `gates/test/integration/plants-robustness.test.ts`. The third merge's table does name it. | None. Completeness of the record only. |

No blocking finding.

## Round 1's blocking findings

- **L1-01 (form reset before the select's first render throws): resolved.** It was handled as operator round
  `phase-4/round-2.md` (O2-01). The fix record is `phase-4/round-2-fixes.md`, and the stop-rule review
  `phase-4/round-3.md` approves it.
  - The red commit is `307f3d32` (`red-commits` `fix-2`, the folded SHA of `e01ecf3`) and is an ancestor of the head.
    It changes tests and drivers only. `red-fix-2.log` and `check-red-fix-2.log` show exactly the 3 new tests failing
    with `Cannot read properties of null (reading 'options')`.
  - On the head, `initialValue()` (`ocelle-form-select.ts:174-177`) reads the default from `listedOptions()`
    (light-DOM `<option>` children and `<optgroup>` children's options, `:153-155`), not from the shadow select. The
    `control()` comment (`:163-168`) now says that a reset or restore before the first render does not ask for the
    select.
  - The red tests are unweakened on the head. `git diff 307f3d32 HEAD` on `form-select-rules.test.ts` is empty. In
    `scenarios/form-select.ts`, the only changes are the second merge's driver-step renames (`listen` to `listenFor`,
    `press` to `pressOn`, `heard` to `heardEvents`, `click` to `clickPoint`, `focusPath` to `focusChain`). The FR-024
    scenario itself (`:417-433`) is unchanged.
  - Neither the third merge nor its fix touched `ocelle-form-select.ts` or `form-control.ts`.
  - I ran both test files on the head (single files, Chromium 1243). `form-select-rules.test.ts` passed 11 of 11 tests.
    In `form-select.test.ts`, the scenario "FR-024, reset before the first render" passed (1 test, the other 52
    skipped by `-t`).
  - Phase 4 round 3's R3-03 is a follow-up. Before its first render the select submits no form value, which dates from
    `436e727`. It stays a follow-up and is not a regression.
- **L1-02 (`832e36b` without sign-off): resolved.** `history-map.txt` § "History re-sign" maps `832e36bd` to
  `569c7f0b`, and the old head is kept as `refs/ocelle/prefold/resign/...`. `832e36bd` is no longer an ancestor of the
  head. `569c7f0b` (`docs(plan): squad round 3 — 4 confirmed, 2 forks`) carries
  `Signed-off-by: Claude <noreply@anthropic.com>`. `pnpm run gate:signoff -- --range origin/main..HEAD` exits 0 with
  "signoff: 134 commits checked, no finding". That is merge.md's 133 at `d0e0d164`, plus `b746d15a`. merge.md records
  that the range `763999fc..HEAD` reports main's own squash commit `4911fd0b`. That commit is not the branch's, and the
  pull request's range is clean.

## Folds and merges: no regression

- **Folds.** Every SHA in `phase-{1..5}/red-commits` is an ancestor of the head, and every phase's `tdd-check.json` is
  `pass`. `history-map.txt` maps each folded commit, and the re-sign keeps every other commit's SHA unchanged.
- **Third merge, `25ed484d`** (parents `763999fc` and `4911fd0b`, merge base `b594b7e9`):
  - **Conflicted files.** I recomputed the conflicted set with `git merge-tree --name-only 763999fc 4911fd0b`. It is
    28 files, exactly the files in merge.md's table.
  - **Files only one side changed.** For each file only one side changed since `b594b7e9`, the merge commit equals
    that side (a scripted check over both sides' `git diff --name-only`, no difference).
  - **Files both sides changed without a conflict.** 44 files changed on both sides. Apart from the 28 conflicted
    ones, the merge commit equals git's own merge in every file except `pairs.json` (L2-01).
  - **Both sides kept.**
    - Element sources: `git diff 4911fd0b 25ed484d` is empty for `ocelle-button.ts`, `ocelle-action-row.ts` and
      `control.ts`. `git diff 763999fc 25ed484d` is empty for `ocelle-notice.ts`, `ocelle-form-input.ts`,
      `ocelle-form-select.ts`, `form-control.ts` and `live.ts`.
    - `index.ts` exports all 23 element classes in code-point order, with the four type exports.
    - The README has main's `ocelle-button`, `ocelle-action-row` and "Control conventions" sections, and the branch's
      `ocelle-notice`, "Form controls", `ocelle-form-input` and `ocelle-form-select` sections.
    - `vitest.config.ts` `elementBrowserCommands` holds main's `press`, `hover`, `pointer`, `axState` and `axe`, and the
      branch's `liveStart` and `liveStop`.
    - `scenarios/driver.ts` holds main's `focusTarget`, `computedOf`, `clipboardCopy`, `dispatched`, `inputPress`,
      `inputClick`, `inputHover`, `axState` and `axe`, and the branch's `pressOn`, `clickPoint`, `focusChain`,
      `listenFor`, `heardEvents`, `call`, `property` and `batch`.
    - `visual/fail-token-changed/plant.json` has 189 distinct findings, exactly the union of the branch's 146 and
      main's 159 (base 116). I compared the JSON of all four commits.
  - **Contrast pairs.** `color-ink` on the five state grounds appears once per theme (L2-01).
- **Fix `d0e0d164`.** It changes one line of `packages/elements/test/commands.ts`, `propertyOf`: `?.value?.value` becomes
  `?.value.value`, because main made `RawAxProperty.value` required. It is test-harness code with no behaviour change,
  and `gate:typecheck` and `gate:lint` pass on the head. It is signed off.
  - After it, the head commit `b746d15a` changes only `reviews/landing/merge.md` (`git diff --stat 25ed484d HEAD`: 2
    files, `commands.ts` and `merge.md`).
- **Operator decisions on the merged tree.**
  - **O3-01.** `internalBases = ["form-control.ts", "overlay.ts"]` (`scripts/manifest.ts:50`). In the committed
    manifest, `OcelleFormInput` and `OcelleFormSelect` keep `superclass` `{FormControl, /src/form-control.ts}` and their
    members have `inheritedFrom`. `OcelleDialog` keeps `{OcelleOverlay, /src/overlay.ts}`. `OcelleButton` and
    `OcelleActionRow` have `LitElement` from `lit`. `gate:manifest` passes with 23 elements and 23 modules.
  - **75-minute element-shard limit.** It is present in `.github/workflows/ci.yml:90`
    (`contains(matrix.shard.files, 'packages/elements/src/') && 75 || 10`) and pinned in
    `gates/test/ci-workflow.test.ts:43,57-66`. The branch's change since `b594b7e9` is kept: `ci.yml` equals the
    branch side. That test file passes on the head (10 of 10).
  - **Main's 1200 s visual-test limit.** It is kept: `gates/test/integration/visual.test.ts:31`
    (`const timeout = 1_200_000`), with its comment at `:28`.
  - **`fileParallelism: false` on the `elements` project.** It is kept at `vitest.config.ts:165`, and also on
    `elements-build` at `:212`.
- **Scope.** `scope-check.sh landing 763999fc` returns `ok: false` and lists every file main brought in (main's 012
  sources, tests, baselines and specs). That is expected for a merge commit and is not a finding.

## Test quality

The scope is the stop rule's: the fix for L1-01 and the merge. There is red evidence for the one behavioural fix
(L1-01, `fix-2`, above). The third merge's resolution weakened no test. In the conflicted gate tests, the count
changes are the exact union figures, still exact `toEqual`/`toBe`: 448/450 story-themes, 224 stories, 23 elements,
207/215 pairs and 196 required per theme. The 012 tests of main and the 010 tests of the branch are both present. The
only test-harness change after the merge, `d0e0d164`, removes an unneeded optional chain.

## Checks run

On head `b746d15a`, in this container:

| Check | Result |
|---|---|
| `pnpm run gate:signoff -- --range origin/main..HEAD` | exit 0, "signoff: 134 commits checked, no finding" |
| `pnpm run gate:typecheck` | exit 0, "no type error in the files of tsconfig.json" |
| `pnpm run gate:lint` | exit 0, "lint: 505 files checked, no finding" |
| `pnpm run gate:manifest` | exit 0, "manifest: 23 elements checked, no finding" |
| `vitest run --project gates gates/test/ci-workflow.test.ts` | exit 0, 10 of 10 passed |
| `vitest run --project elements packages/elements/test/form-select-rules.test.ts` (`OCELLE_CHROMIUM_PATH` Chromium 1243) | exit 0, 11 of 11 passed |
| `vitest run --project elements packages/elements/test/form-select.test.ts -t 'reset before the first render'` | exit 0, 1 passed (52 skipped by the filter) |

Not run, as instructed: the full unit-test suite (another process is running it), plus visual, axe, plants and
mutation. For those I rely on merge.md's gate table at `d0e0d164`:
- unit tests: 5093 element tests and 162 conflicted gates tests passed;
- `gate:visual`: 448 captures match;
- `gate:plants`: 317 of 317 plants judged as expected;
- contrast, CSP, prefix, pins and brand-rules: all exit 0.

`b746d15a` changes only merge.md, so those results apply to the head.

The first attempt at single files went through `pnpm run gate:unit-tests -- <file>`. That passes `-- <file>
--outputFile...` to Vitest, which does not limit the run to the file. I stopped it after 11 minutes and before it
reported, so it is not counted. I ran Vitest directly on each file instead.
