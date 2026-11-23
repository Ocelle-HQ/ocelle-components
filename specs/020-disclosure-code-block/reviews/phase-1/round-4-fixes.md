# Phase 1 operator round 4 fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| T014 | fixed | The shared browser scenario in `8fec7e26` fails in both harnesses with the pre-Op 022 focus walk. Op 022 (#64) already supplied the production fix. | `packages/elements/README.md`, `packages/elements/test/node/readme.test.ts`, `packages/elements/test/scenarios/disclosure.ts` |

The scenario puts a closed `ocelle-disclosure` with a link in its panel last in an open `ocelle-dialog`. It
records focus on the summary before pressing Tab and expects focus to wrap to the dialog's close button. The
README change removes the old limitation and its one matching assertion.

Test-only commit `8fec7e26` already contains Op 022 through the merge from `main`. In a disposable worktree of
that commit, only `packages/elements/src/focusable.ts` was replaced with its version at `1b8b0b2b`, the parent
of Op 022. Both Chromium harnesses failed on this comparison, with exit 1 and no setup failure:

```text
  "before": "d >> summary.control"
- "after": "dialog >> button"
+ "after": "body"
```

The same two focused tests passed in 6.41 seconds on the integrated code, including the built strict-CSP
fixture. The README test file passed all 1,017 tests after the obsolete fragment was removed. Typecheck,
targeted ESLint and the test-lint gate passed. The phase's existing red record covers the original feature.
The historical replay above proves the additional regression case after the production fix had landed.

Plant selection since the landing-round base `0c459416` found zero affected plants. Selection since the
phase base still selects all 317 plants, which the operator's CI-first decision leaves to required CI.
