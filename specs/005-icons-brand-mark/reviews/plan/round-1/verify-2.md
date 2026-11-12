# Squad round 1: verify 2

Checked against the artifacts at `9d3c308` (spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md).
Since verify 1 (`a4d1752`), only plan.md, research.md (R-05, R-06, R-11, R-16), contracts/checks.md and quickstart.md
changed, in the places fixes-2.md names; spec.md and data-model.md are unchanged. The 26 rows verify 1 found resolved
were re-checked against that diff: none of their text was changed or contradicted. Read in this pass: the
fixes-2 diff in full, grep of the feature artifacts for stale install-script and US1-17 fixture wording (none left),
spec.md § The strict-CSP fixture and US1-17, the lockfile (`fsevents@2.3.3` an optional dependency of `vite@8.3.5`)
and `pnpm-workspace.yaml` (`allowBuilds` today holds only `esbuild: false`). No probe was needed: both changes are
documentary and the measured facts they rest on were re-run in verify 1.

| ID | Status | Reason |
|----|--------|--------|
| PLAN-A11Y-SECURITY-1-001 | resolved | Unchanged since verify 1: R-09 and data-model § Variants wrap every variant rule in `@media not (forced-colors: active)`, the plant is the bare `.ring` sheet, the README rule is in R-15. |
| PLAN-A11Y-SECURITY-1-002 | resolved | Unchanged since verify 1: option (a) in FR-034, data-model § State, R-13, the contract and R-15; US1-18 `blank-labelled` and US4-14 `blank-labelled-mark` with the fall-back-to-`label` plant. |
| PLAN-A11Y-SECURITY-1-003 | resolved | Unchanged since verify 1: option (a), trimmed host `aria-label` in US1-18, US4-14, FR-034, the contract and R-15; R-13 records the measurement; no conditional stop in the plan decisions. |
| PLAN-A11Y-SECURITY-1-004 | resolved | Unchanged since verify 1: no strut (R-10, data-model § Slot convention), US3-11 reads "Open project" exactly, the strut without empty alt text is the plant. |
| PLAN-A11Y-SECURITY-1-005 | resolved | Option (c) with the scope now recorded in refute.md (both `rs-module-lexer@2.9.0` and `fsevents@2.3.3`). R-16 approves both by version-exact `allowBuilds` keys, the `pins` gate's approved list holds exactly those two, tests cover both entries passing and both unpinned forms and another version failing, plants add `fail-allow-builds-unpinned-fsevents` and `pass-approved-build` holds both; the 001 R-04 amendment names both; what the `fsevents` script does (`node-gyp rebuild`, darwin only, also Vite's optional dependency, as the lockfile shows), its effect on existing macOS installs and the unverified macOS run are recorded as residual risk for the README `pins` row. The "if needed" wording survives only as a rejected alternative. plan Summary, Technical Context, Constitution Check, decisions 3 and 4, phase 1 (four pins plants, `fsevents` absent check), contracts/checks.md and quickstart step 4 agree; no artifact still says one approval or that `fsevents` is not approved. |
| PLAN-A11Y-SECURITY-1-006 | resolved | Unchanged since verify 1: R-11 § Recorders uses `collectViolations` (`addInitScript`) and 002's control page; contracts/checks.md matches. |
| PLAN-A11Y-SECURITY-1-007 | resolved | Unchanged since verify 1: R-05 § Engine floor, the README (R-15), the contract § Engines and plan Technical Context state constructable stylesheets. |
| PLAN-A11Y-SECURITY-1-008 | resolved | Unchanged since verify 1: option (a), output `banner` asserted in build.test.ts and vite-config.test.ts (FR-029, R-05, the contract). |
| PLAN-CORRECTNESS-1-002 | resolved | Option (a) as in verify 1; fixes 2 only removed US1-17 from the fixture-only list (R-11, plan phase 2, contracts/checks.md), which this fork's row left to PLAN-TESTABILITY-1-008. US1-8's console check and US1-14's request half stay fixture cases. |
| PLAN-CORRECTNESS-1-004 | resolved | Unchanged since verify 1: option (a), `block-size: 1lh` wrapper, `1lh` only in token-only with plants, US3-1 measured at xs, sm/tight and a 2rem icon, strut as plant. |
| PLAN-CORRECTNESS-1-005 | resolved | Unchanged since verify 1: `@tagname` and `@default` tags (R-02), schema 1.0.0 and the `aria-label` drop (R-06, data-model § Manifest), spike element in the real shape. |
| PLAN-CORRECTNESS-1-006 | resolved | Unchanged since verify 1: R-12 § Plant repositories, plan phase 1 and contracts/checks.md list the plant-repo set change, tests first. |
| PLAN-CORRECTNESS-1-007 | resolved | Unchanged since verify 1: every pinned 158/157/315 count and the contrast.ts comment listed, 328 entries. |
| PLAN-CORRECTNESS-1-009 | resolved | Unchanged since verify 1: `test/node/brand-pairs.test.ts`, phase 2 spike, schema 1.0.0, `font-src 'self'` in Technical Context. |
| PLAN-CORRECTNESS-1-010 | resolved | Unchanged since verify 1: the operator ruleset change and fourteen-to-fifteen change in the plan, R-06, contracts/checks.md and phase 2. |
| PLAN-CORRECTNESS-1-011 | resolved | Unchanged since verify 1: option (a), `viewBox="4 4 92 92"` from the painted extent, US4-9 fit stated as scale 1, translation 0. |
| PLAN-FRESH-1-006 | resolved | Unchanged since verify 1: option (a), `block-size` token, `inline-size: auto`, `aspect-ratio: 1` with token-only allowance and plants, US4-7 height-only and width-only cases. |
| PLAN-FRESH-1-007 | resolved | Unchanged since verify 1: R-11 writes `tokens.css`, fonts and `base.css` into the `mkdtemp` directory and never into a package's `dist/`; the fixes-2 edit of that paragraph (fewer bundles) kept this. |
| PLAN-FRESH-1-008 | resolved | Unchanged since verify 1: `dist/browser/ocelle-elements.js` named public surface in the contract, R-02, R-15, FR-031 and plan. |
| PLAN-TESTABILITY-1-001 | resolved | Unchanged since verify 1: whole-pixel 80 × 80 capture as setup and the count rule measured before phase 3's red step (R-08, plan decision 11). |
| PLAN-TESTABILITY-1-002 | resolved | Unchanged since verify 1: element-source survivor, NoCoverage and mixed plants in R-12, contracts/checks.md and plan phase 2. |
| PLAN-TESTABILITY-1-003 | resolved | Unchanged since verify 1: the analyzer is a root devDependency with the `pass-repository` built-plant-tree expectation. |
| PLAN-TESTABILITY-1-004 | resolved | Unchanged since verify 1: in-process `define.test.ts` for an already-defined and a fresh tag (R-02). |
| PLAN-TESTABILITY-1-005 | resolved | Unchanged since verify 1: option (a), explicit `IconName` union, no `as const`, independent `test/icons-expected.ts`. |
| PLAN-TESTABILITY-1-006 | resolved | Unchanged since verify 1: disabled-button `GrayText` context in US1-7, US3-8, US4-5, the `fill: CanvasText` plant and the recorded `ButtonText` equality in R-09. |
| PLAN-TESTABILITY-1-008 | resolved | The fixture half is gone: R-05 says US1-17's runtime half is tested in-process only and why; R-11's `globalSetup` builds only the browser build, the test-host bundle and US1-10's two bundles (matching the spec's fixture exceptions and allowed requests), and its fixture-only cases state that US1-17 has no fixture case; contracts/checks.md's `test/browser` row and plan phase 2 no longer list it. What remains is the refute's remedy: in-process `entry-icon.test.ts` and `entry-root.test.ts` in separate files (R-02) and the build test that `dist/ocelle-icon.js` imports neither `index.js` nor `ocelle-brand-mark.js` (R-05). It matches spec.md, which already says the module build is not loaded on the fixture and is covered by the `csp` gate and US1-17. |
| PLAN-TESTABILITY-1-009 | resolved | Unchanged since verify 1: `vite-config.test.ts`, `manifest.test.ts`, the `elements-build` project and the default mutation config's exclusions, with vitest-config.test.ts first. |
| PLAN-TESTABILITY-1-011 | resolved | Unchanged since verify 1: option (a), `scale` only `-1` and `1`, `fail-scale-factor` added, `fail-scale-length` kept. |
