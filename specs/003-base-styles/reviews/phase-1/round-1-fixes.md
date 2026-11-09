# Phase 1 review, round 1: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed | none: non-behavioural. The fix is a comment only (a reasoned `// Stryker disable next-line all:` record), so no test can fail for it and no red commit was made. | packages/styles/scripts/build.ts:17 |

## R1-01

A reasoned `// Stryker disable next-line all:` record now sits above `if (import.meta.main) await build();`, in the
form of packages/tokens/scripts/build.ts:61. Its reason: both mutants are equivalent while `build()` is the
phase-1 stub, which resolves without doing anything, so calling it on import or not calling it from the CLI
changes nothing observable. Phase 2 replaces it with the R-01 I/O-boundary record naming
packages/styles/test/build.test.ts.

R1-02 to R1-06 are notes and need no change.

## Checks run

- `pnpm run gate:mutation -- --base 9ba3efe`: exit 0. 5 mutants on the changed lines of 1 file, none survived, 1 equivalent record.
- `pnpm run gate:lint`: exit 0, 157 files, no finding.
- `pnpm run gate:typecheck`: exit 0.
- `pnpm test`: exit 0, 1799 tests passed in 88 files.
