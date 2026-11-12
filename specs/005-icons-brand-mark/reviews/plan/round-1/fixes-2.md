# Squad round 1: fixes 2

The two rows verify 1 left unresolved. PLAN-A11Y-SECURITY-1-005 follows the operator's scope, now recorded in
refute.md's Decision column (2026-11-10): the install-script approval covers both `rs-module-lexer@2.9.0` and
`fsevents@2.3.3`. Read in this pass: `npm view fsevents@2.3.3 scripts gypfile os` (`install: node-gyp rebuild`,
`gypfile: true`, `os: darwin`) and the lockfile (`fsevents@2.3.3` is already an optional dependency of
`vite@8.3.5`).

| ID | Resolution | Where |
|----|------------|-------|
| PLAN-A11Y-SECURITY-1-005 | decided: (c) | research R-16 (title; `allowBuilds` gains `"fsevents@2.3.3": true` beside `"rs-module-lexer@2.9.0": true`; the `pins` gate's approved list holds exactly those two keys; tests for both entries and both unpinned forms; new plant `fail-allow-builds-unpinned-fsevents`, `pass-approved-build` holds both; 001 R-04 amendment names both; what the `fsevents` script does, that it runs only on macOS and changes existing macOS installs through Vite, residual risk in the README `pins` row; verification: `fsevents` absent on Linux, the macOS run unverified; the "if needed" reasoning removed and listed as a rejected alternative), R-06 § Dependency tree (only the analyzer runs in the gate on CI); contracts/checks.md `pins` row; quickstart step 4; plan Summary, Technical Context, Constitution Check (Licence and supply chain), decision 3 and 4, phase 1 |
| PLAN-TESTABILITY-1-008 | fixed | the fixture half is dropped, as the refute's remedy is in-process: research R-05 (runtime half in-process only, and why), R-11 (no single-entry bundles in the `globalSetup`; the fixture-only cases state that US1-17 has no fixture case, since the spec's fixture admits no such bundle and the browser build defines both elements on every page); contracts/checks.md `test/browser/*.test.ts` row; plan phase 2. The in-process `entry-icon.test.ts` and `entry-root.test.ts` (R-02) and the tightened build test (R-05) stay. |
