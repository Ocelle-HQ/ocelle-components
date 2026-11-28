# Anchored popover Phase 2 start

- Started 2026-11-28T14:42:10.2087948Z
- Branch and folded Phase 1 base `036-anchored-popover-pilot` at `a6ef9048f9ca30f69a32dd9b55e7d4085f154104`
- The repository prerequisite, units, Phase 1 verdict, and Phase 2 base scripts passed. [Exact checkout](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46156001156/job/141012678918)
- Phase 2 adds placement and tracks geometry only while open. The package exports, native invoker, open state, dismissal precedence, focus and CSP contracts carry forward from Phase 1. Chromium 135 and pinned Jammy WebKit 17.4 still require real geometry evidence.
- The in-process test owns placement and lifecycle. The dedicated strict packaged test owns its HTML, external TypeScript fixture, and exact-floor runner. The fixture is specific to the scoped packaged test and browser-floor runner, and does not change the common setup.
