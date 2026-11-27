# Op 037 landing verification

## Test-first repair

The new regression tests failed at both expected exit-code assertions on the tests-only revision. The
same tests and all earlier phase evidence passed after the advisory selection fix. The current main pin
is `d45efd57402395999fcd7ab8fc29fba2c14a4e88`. The integrated replay also passed 97 focused tests across
the split and range suites, including the ordinary zero-change case.
[Red](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46064366877/job/140725999475) · [Replay](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46072216214/job/140751594341)

## Required CI

The prior full run passed on the original candidate. Use the required PR run for the final
reviewed head against the current main and verify its exact tested merge before landing.
[Prior run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45901385962) · [PR #107](https://github.com/Ocelle-HQ/ocelle-components/pull/107)
