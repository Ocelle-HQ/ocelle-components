# Phase 1: TDD exemption (T010)

Constitution VIII *Exemption*: a unit with no behaviour may skip the red step if its review states why no test could
fail for it.

- **Exempt: T008** (the pins, the lockfile and the ignore list). `lit` 3.3.3 in `packages/elements/package.json`
  `dependencies`, `@custom-elements-manifest/analyzer` 0.11.0 in the root `devDependencies`, the `pnpm-lock.yaml` that
  `pnpm install` wrote for them, and the three `.gitignore` entries for the elements package's packed copies of
  `LICENSE`, `NOTICE` and `THIRD_PARTY_NOTICES` (R-15). None of them is behaviour of the repository's code: no source
  imports `lit` or the analyzer yet (phase 2 does, test-first), and the packed copies are written by the phase 2 build.
  What can be checked about them is checked by existing gates, unchanged: the `pins` gate (exact versions, the
  lockfile matching the manifests; `pnpm run gate:pins` exits 0) and the verification of T009
  (`install-scripts.md`). No new test could fail for them that is not one of those.
- **Not exempt: T004 to T007.** Their tests are the phase's red commit (T001 to T003), recorded in `red-commits` and
  `red-phase.log`: 26 tests failed on assertions, for the missing projects and exclusions (T001), the approved builds
  (T002) and the configuration set and `node_modules` links (T003). T006's `pnpm-workspace.yaml` entries are checked
  by the pins gate tests of T002 and `gate:pins` on the repository; its README row and 001 amendment are records.
- **T009 and T010** are records (`install-scripts.md`, this file).
