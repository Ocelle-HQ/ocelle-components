# Phase 2 focused checks

- Source candidate `f4fc2e8bbf2ab1c30b2513fbb0078bfe81440a5f`
- Phase base `a6ef9048f9ca30f69a32dd9b55e7d4085f154104`
- Canonical replay preserved 18 missing-behavior assertions across the two scoped projects. The base exited 1 on those assertions and the candidate exited 0. [Replay](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46158714296/job/141020981092)
- The focused regression ran 70 tests in six files, including Phase 1 lifecycle, keyboard, pointer and touch coverage. The earlier candidate exposed two same-turn focus and hit-test regressions. Both original cases passed unchanged after the correction. [Regression job](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46158714296/job/141020981097)
- The type, lint, style, test lint, CSP and manifest checks passed. [Static job](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46158714296/job/141020980869)

```text
typecheck: no type error in the files of tsconfig.json
lint: 739 files checked, no finding
style-lint: 86 files checked, no finding
test-lint: 559 files checked, no finding
csp: 91 files checked, no finding
manifest: 50 elements checked, no finding
```
