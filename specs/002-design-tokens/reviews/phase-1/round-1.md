---
phase: 1
round: 1
verdict: approved
base: 100d279968b8407ded5f321dc46a79e650fbb52d
head: a02314232675a4e936f1dc5f5ad606f97a6d3dad
tdd_check: exempt
---

# Phase 1 review, round 1

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | pnpm-workspace.yaml:9-12; specs/002-design-tokens/tasks.md:39 | T002 says "empty `allowBuilds`", but the file now has `allowBuilds: { esbuild: false }`. The deviation is recorded in `tdd-exempt.md` and the commit message, and it does not loosen the policy: 001 research R-14 has the pins gate reject only entries set to `true` (`gates/lib/pins-rules.ts:97`), `gate:pins` passes, and `node_modules/.pnpm/esbuild@0.28.2/node_modules/esbuild/bin/esbuild` is the 9350-byte JS launcher, so the postinstall did not run. Without the entry, pnpm 12.16.1 stops installs with `ERR_PNPM_IGNORED_BUILDS` (implementer's evidence; not reproduced here). The task text and the 001 plan comment (`specs/001-repository-foundation/plan.md:229`, "allowBuilds {}") now describe a state the repository does not have. | Not required for this phase. When the feature's docs are next touched, reword T002 / the R-04 description to "no entry set to `true`" so the record matches the file. |
| R1-02 | note | environment | `pnpm test` and `gate:plants` only run here with `PLAYWRIGHT_BROWSERS_PATH` pointing at a scratch directory that aliases Chromium build 1248 to the preinstalled 1243, because `playwright install` is blocked by the sandbox proxy. This is an environment limit that predates the phase, not caused by it; CI with network access installs the right build. | None for this phase. |

No blocking finding.

## Test quality

- `tdd-check.json`: `status: exempt`, head `a023142` (the current HEAD), pointing at `tdd-exempt.md`.
- The exemption holds. The phase adds no source and no test: an ignore entry pair (`.gitignore:8-9`), a workspace
  package entry and an explicit `allowBuilds` denial (`pnpm-workspace.yaml:3,11-12`), one `tsconfig.json` include
  pattern that matches no file yet (`tsconfig.json:6`), a `storybook/package.json` with no scripts or source, and the
  regenerated lockfile. None of these is behaviour a test could observe. The checks that cover these files (pins,
  typecheck, the frozen install) are existing gates, and they pass. The behaviour that uses this wiring (token
  build, Storybook build, the `tokens-browser` / `storybook` projects) is assigned to phases 2 and 3, where it is
  written red first.
- No test file was added, changed or deleted since base (`git diff 100d279..HEAD` touches no path in `test_pathspec`).
- No `scaffold.sha` exists for this phase.
- Mutation: `pnpm run gate:mutation -- --base 100d279…` reports "nothing to mutate: no package or gate source line
  changed", which is correct for this diff.

## Checks run

All run on HEAD `a023142` with the working tree otherwise clean (only the uncommitted `tdd-check.json`).

- `pnpm install --frozen-lockfile --offline`: exit 0, "Lockfile passes supply-chain policies" (so the 10.6.5 pins
  satisfy `minimumReleaseAge: 10080` strict).
- `gate:pins`: exit 0, 5 manifests, no finding (`@ocelle/tokens` as `workspace:0.0.0` matches
  `packages/tokens/package.json` version `0.0.0`; `storybook` and `@storybook/html-vite` exact `10.6.5`).
- `gate:typecheck`, `gate:lint`, `gate:test-lint`, `gate:style-lint`, `gate:csp`, `gate:prefix`,
  `gate:config-copies`: exit 0, no finding.
- `gate:signoff -- --range 100d279..HEAD`: 1 commit checked, no finding.
- `pnpm test`: exit 0, 1249 tests passed in 55 files (with the browser alias of R1-02).
- `gate:plants`: exit 0, 136 plants of 11 gates and the registry judged as expected.
- `gate:mutation`: nothing to mutate (above).
- T007: `sha256sum specs/002-design-tokens/sources/console-v2-tokens.md` gives
  `7b0a5d0c4af7d1c7fa83f2a4af130e76097f6e6283e980da704c424395d9e61a`, equal to R-05; the file is not in the diff.

Tasks: T001 to T007 are ticked and their work is present (`tdd-exempt.md`, the files above). Nothing outside the
phase changed: the diff is `.gitignore`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `storybook/package.json`,
`tsconfig.json`, `tasks.md` ticks and this phase's review directory. Constitution: no `sk-` name, no element code, no
CSS, no network request at run time; Apache-2.0 and the font are untouched; the supply-chain rules (exact pins,
release age, no install script) hold. Plan: `storybook/` as a private workspace package with no scripts and the
include for `.storybook/` follow plan.md and contracts/gates.md.

## Earlier findings

None: this is the first round.
