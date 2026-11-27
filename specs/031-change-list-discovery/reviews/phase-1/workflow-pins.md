# Workflow pins for the discovery pilot

The control is repository main at `6a6d74c246e3d64e3470f3d71e7c52c569db8f29`. The two exact browser test draft paths and Storybook IDs are in the reviewed plan. Test drafts start from the signed Phase 1 receipt and use the control scope checker and sign-off gate.

The candidate is under review on [Op 030](https://github.com/Ocelle-HQ/ocelle-components/pull/98). Record the exact reviewed candidate head and tree before candidate worktree verification and inventory integration. The dispatch time, signed return, staging start and first combined green are recorded with their revisions.

The control draft worktrees were ready at 2026-11-25T20:20:31.648Z. Their signed commits were recorded at 2026-11-25T21:23:00+01:00 and 2026-11-25T21:23:37+01:00. Canonical staging started at 2026-11-25T20:24:06.142Z. The combined test-only commit `65686514` produced six named assertions on the missing story IDs. [Red evidence](red-phase.log)

The independently reviewed local candidate for the stacked pilot is `b44317210a478a9a64780c1ba20b634a7cdc966e` (tree `4b005743c9aac09cb52c4c33e19f736905345600`). Its focused replay passed and the review found no blocker to the pilot. Full hosted verification and promotion remain open. [Op 030](https://github.com/Ocelle-HQ/ocelle-components/pull/98)

Implementation dispatch followed the common red pin at 2026-11-25T20:24:47.734Z. The signed story commits were recorded at 2026-11-25T21:25:36+01:00 and 2026-11-25T21:25:54+01:00. The candidate verifier accepted both signed disjoint returns, and staging began at 2026-11-25T20:27:39.689Z. The combined built-Storybook run passed six tests in 5.22 seconds. The static build reported 394 stories.

An early matched candidate pinned `ac68285d`. Its scoped replay reproduced all six named failures against the old source and passed at `ad472926` through the focused runner with explicit pathspec exclusions. That run passed dedicated Visual and Accessibility. The paired drafts exposed an issue in browser test lint and an empty-index Plant fixture omission. Both arms contain the same fixes. [Early hosted candidate](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45699064888)

The final paired candidate uses Op 030 head `b5688a9f736bb548952740f78535a6b0ec2677c7` (tree `29e51e02f288f884df97313621275621da861321`). Its phase base `43b1a5d3167a1cdf7ff3bd3073a8b2a59065cf63` places that workflow on the pre-implementation tree. Both arms use identical stories, layout, browser tests, Plant expectations and pinned baseline bytes. The original worker-return receipt stays tied to the workflow that verified both signed returns.

The standard focused replay consumes the two reviewed `implementation-story` declarations in this phase's scope. It keeps each requested story at the tested revision while preserving the six named assertions and existing collateral tests.

```sh
SPECIFY_FEATURE_DIRECTORY=specs/031-change-list-discovery \
  ./tooling/speckit/extensions/story/scripts/tdd-check.sh 1
```

The control Unit receipt exposed a stale negative Axe total. The test adds an unlabelled-button story to the 394 built stories, so both workflows now require exactly 790 story-theme runs, the same two critical findings and exit 1 in that fixture. [First control failure](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45700773081/job/139510218425)
