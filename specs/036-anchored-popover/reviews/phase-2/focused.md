# Phase 2 focused checks

- Candidate `3ff4e940ae544b0010d0b091602685c858b03823`
- Base `a6ef9048f9ca30f69a32dd9b55e7d4085f154104`
- Canonical replay retained all 18 originally recorded missing-behavior assertions. The base exited 1 and the candidate exited 0. [Replay](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46162402315/job/141032406363)
- All 77 tests in six files passed, with the existing Phase 1 lifecycle, pointer and touch cases unchanged. [Regression](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46162402315/job/141032406376)
- The type, lint, style, test lint, CSP and manifest checks passed. [Static checks](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46162402315/job/141032406124)

```text
typecheck: no type error in the files of tsconfig.json
lint: 739 files checked, no finding
style-lint: 86 files checked, no finding
test-lint: 559 files checked, no finding
csp: 91 files checked, no finding
manifest: 50 elements checked, no finding
```
