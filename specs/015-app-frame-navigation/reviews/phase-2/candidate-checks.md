# Phase 2 candidate checks

The focused checks below used the repository's pinned Node 26.13.0, pnpm 12.16.1 and Playwright Chromium 156.0.8078.4. The candidate adds the top bar and navigation item, their package entry points and manifest, and 13 stories with light and dark baselines.

## Targeted evidence

- The five Chromium files `entry-nav-item`, `entry-top-bar`, `exports`, `nav-item` and `top-bar` ran under the `elements` project. With the final test files overlaid at the inert scaffold and red commit `b94c103`, all 14 tests failed on missing behavior. The same tests passed 14/14 on the candidate. See `targeted-red.log` and `targeted-green.log`.
- The focused Stryker run exercised the two new element source files with those five Chromium test files. It killed 63 reachable mutants, with zero survivors or uncovered mutants and four generated TypeScript mutations excluded by the checker. See `focused-mutation.log`.
- Package build tests passed 30/30. README and manifest tests passed 838/838. Storybook-build and plant-copy integration tests passed 38/38.
- The repository's visual capture and update logic captured all 13 new stories in both themes twice under the pinned Docker image. It wrote 26 new baseline PNGs and changed or removed no existing baseline. The repository axe logic audited those 26 story-theme pairs with zero findings, incomplete results or exceptions.
- Typecheck, lint, style lint, test lint, manifest, CSP and prefix gates passed.

## Canonical workflow checks pending

The standard mutation gate exited 2 without a report because the full initial browser suite failed. A direct run identified existing notice and form live-announcer timing plants. Running their unchanged test file on the pristine phase base `024919e` also produced 12 failures, including frame gaps of roughly 485–505 ms outside the fixtures' timing bounds. A retry with one Vitest worker also exited 2 in the initial browser suite and wrote no report.

The workflow's full `red.sh 2 phase` detached run and affected plants command were still active at the checkpoint. The package export change selects all 317 plants. The workflow's head and final-tests-on-base checks and independent review were pending. The focused results above do not count as canonical gate results.
