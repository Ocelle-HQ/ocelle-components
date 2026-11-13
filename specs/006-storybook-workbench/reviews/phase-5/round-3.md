---
phase: 5
round: 3
verdict: approved
base: 0023ed66085eb5d7e6fda93cfd50b3ca3f47e932
head: 13bd3ec
tdd_check: pass
---

# Phase 5 review, round 3

Landing-pass round (landing stop rule, operator decision 2026-11-03): this round checks only that the operator round's
findings O2-01, O2-02 and O2-03 (`round-2.md`, label `fix-1`, tasks T086 to T092) are resolved as required, with red
evidence where behaviour changed, and that the fix regressed nothing in phase 5. Phase 5 was not searched afresh.
Commits under review: `24d50ef` (red), `ed4eb72` (green), `13bd3ec` (ticks).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|

None.

## Test quality

- **Red evidence.** `red-commits` has `fix-1 24d50ef…`. `red-fix-1.log` and the fresh `check-red-fix-1.log` agree:
  3 of 3112 tests fail at `24d50ef`, each an `AssertionError` on the expected value, no load or setup error:
  `gates/test/gates-readme.test.ts:86` (the Deferred gates table still holds a third row),
  `gates/test/gates-readme.test.ts:118` (the README's `visual` command lacks `--remove-docker-image`) and
  `gates/test/registry.test.ts:175` (the `gates.json` `visual` command lacks it). That is exactly T086 and T087 and
  nothing else (T088).
- **Strength of the changed tests.** The Deferred gates case (`gates-readme.test.ts:86`) now asserts the exact table
  (header and the "Remote loads in built output" row only), that the section's prose contains "mission 005 (#17)" and
  `` `packages/elements/test/browser/serve.ts` ``, and that the whole README holds no "(#17 or #7)": stricter than the
  case it replaces, as T086 asks. The two command expectations (`gates-readme.test.ts:116`, `registry.test.ts:180`)
  are exact-equality assertions. No conditional assertions, no skip/only, nothing swallowed.
- **No weakening after red.** `git diff 24d50ef..13bd3ec -- gates/test` is empty.
- **O2-02 without red.** Accepted: it changes only `specs/001-repository-foundation/contracts/ci-checks.md`, which no
  test reads (only a comment in `gates/test/ci-workflow.test.ts` names it), so there is no behaviour to fail first
  (Principle VIII); `round-2-fixes.md` records the reason, as T092 asks.
- **Mutation.** `pnpm run gate:mutation -- --base 24d50ef`: exit 0, "nothing to mutate: no package or gate source line
  changed since 24d50ef". The fix touches JSON, Markdown and tests only; the phase's source was mutation-checked in
  round 1 and is unchanged.

## Checks run

At head `13bd3ec`, one at a time:

- `tdd-check.sh 5` outputs (uncommitted, from head `13bd3ec`) verified rather than re-run: `tdd-check.json` is
  `pass` with `head` `13bd3ec1790d…`, red commits `phase` (exit 1) and `fix-1` (exit 1), final tests on base exit 1,
  head exit 0, no problems. `check-head.log` ends "3112 tests passed in 138 files", matching my own run below;
  `check-red-fix-1.log` matches the committed `red-fix-1.log` (same three failures); `check-red-phase.log` (25 of 3089
  failed) and `check-final-tests-on-base.log` (42 of 3140 failed) are assertion failures of the phase's own tests,
  now also including the fix-1 expectations (`registry.test.ts:175`, the README cases), as expected.
- `pnpm test` (`OCELLE_CHROMIUM_PATH` set): exit 0, 3112 tests passed in 138 files.
- `pnpm run gate:typecheck`: exit 0. `gate:lint`: exit 0, 263 files, no finding. `gate:test-lint`: exit 0, 173 files,
  no finding.
- `pnpm run gate:mutation -- --base 24d50ef` (env unset): exit 0, nothing to mutate (above).
- `pnpm run gate:plants -- --plan`: `[1,…,28]`, 28 shards, unchanged.
- `pnpm run gate:plants -- --shard k`, k = 1, 2, 3 (`OCELLE_VISUAL_ENGINE=docker`, `OCELLE_CHROMIUM_PATH` unset), one
  at a time: each exit 0, 76 plants judged, every plant as expected; together they hold all seven registry plants
  (`fail-gate-without-entry`, `fail-gate-without-job`, `fail-shard-in-plant-check`, `fail-skip-container-in-ci`,
  `fail-skip-container-in-shard`, `pass-matching`, `pass-split-plant-jobs`), which read the changed `gates.json`.
  Local times 79 s, 78 s, 98 s, far below the 570 s CI cap. The other shards were not re-run: the fix changes only
  the `visual` gate's `command`, which no plant runs (plants use `plantCommand`, unchanged).

## Earlier findings

- **O2-01: resolved.** `gates/README.md:187-199` (§ Deferred gates) holds only the "Remote loads in built output" row;
  the paragraph after it says the `@ocelle/elements` run-time strict-CSP browser test was delivered by mission 005
  (#17) in `packages/elements/test/browser/serve.ts`, which exists and serves element pages with a
  `Content-Security-Policy` header (`serve.ts:73,76`). `grep "(#17 or #7)" gates/README.md` finds nothing. 001's
  plan (`specs/001-repository-foundation/plan.md:413`) keeps the manifest row's text and adds "**Closed by feature
  005 (#17, `specs/005-icons-brand-mark/`)**" as T090 words it. Decision 32's amendment and decision 33
  (`specs/006-storybook-workbench/plan.md:411-438`), spec FR-023/FR-024 and research.md R-10's correction
  (`research.md:674-683`) were already made in `ab57df2`, before this round; the remaining "(#17 or #7)" strings
  in plan.md, spec.md and research.md are historical quotes marked as amended, not live claims. Red: `gates-readme.test.ts:86`.
- **O2-02: resolved.** `specs/001-repository-foundation/contracts/ci-checks.md` now has eighteen rows in the first
  table (`Storybook build`, `Visual regression`, `Accessibility` added; `Plants` the verdict job), the helper-job
  table gains `plants-plan` and `plants-shard`, "seventeen in all" and "eighteen" (twice), and a Mission 006
  paragraph on the ruleset. Checked against `.github/workflows/ci.yml` (`:217` visual command, `:229` pin-record,
  `:248-312` plants-plan, plants-shard with `fail-fast: false`, `OCELLE_VISUAL_ENGINE: both`, `plant-shard-*`,
  `merge-multiple`, the verdict job with `needs: [plants-plan, plants-shard]` and `if: always()`), `gates/gates.json`
  (17 gate ids), `gates/lib/registry.ts:49` (`plantHelperJobs`) and `gates/README.md:143-164` (eighteen checks). No
  red, with reason recorded (above).
- **O2-03: resolved.** `gates/gates.json:126` and the README gate table (`gates/README.md:39`) give
  `pnpm run gate:visual -- --engine both --remove-docker-image`, as `ci.yml:217`. Red: `gates-readme.test.ts:118`,
  `registry.test.ts:175`. The registry copies in plant trees and fixtures are left as T089 directs; the registry
  plants still judge as expected.
- **Tasks.** T086 to T092 are ticked and their work is present; no task of `## Phase 5:` is unticked. The ticks
  commit `13bd3ec` changes only `tasks.md`. Nothing outside the fix's scope changed.
