# Workflow pins for the discovery pilot

The control is repository main at `6a6d74c246e3d64e3470f3d71e7c52c569db8f29`. The two exact browser test draft paths and Storybook IDs are in the reviewed plan. Test drafts start from the signed Phase 1 receipt and use the control scope checker and sign-off gate.

The candidate is under review on [Op 030](https://github.com/Ocelle-HQ/ocelle-components/pull/98). Record the exact reviewed candidate head and tree before candidate worktree verification and inventory integration. The dispatch time, signed return, staging start and first combined green are recorded with their revisions.

The control draft worktrees were ready at 2026-11-25T20:20:31.648Z. Their signed commits were recorded at 2026-11-25T21:23:00+01:00 and 2026-11-25T21:23:37+01:00. Canonical staging started at 2026-11-25T20:24:06.142Z. The combined test-only commit `65686514` produced six named assertions on the missing story IDs. [Red evidence](red-phase.log)

The independently reviewed local candidate for the stacked pilot is `b44317210a478a9a64780c1ba20b634a7cdc966e` (tree `4b005743c9aac09cb52c4c33e19f736905345600`). Its focused replay passed and the review found no blocker to the pilot. Full hosted verification and promotion remain open. [Op 030](https://github.com/Ocelle-HQ/ocelle-components/pull/98)

Implementation dispatch followed the common red pin at 2026-11-25T20:24:47.734Z. The signed story commits were recorded at 2026-11-25T21:25:36+01:00 and 2026-11-25T21:25:54+01:00. The candidate verifier accepted both signed disjoint returns, and staging began at 2026-11-25T20:27:39.689Z. The combined built-Storybook run passed six tests in 5.22 seconds. The static build reported 394 stories.

The matched hosted candidate uses Op 030 head `ac68285db926983c7372d47c11b7d7bf0be4981a` (tree `405ea488fa9d5a5ebcba90a49ba0946ef440b86c`). The candidate replay base `a992a37390b4572a49a42f9f070776a2a6a576a7` combines that exact workflow with the control pre-implementation tree. Both measured arms use identical stories, layout, browser tests, Plant expectations and pinned baseline images. The original worker-return receipt remains tied to the original candidate that verified the two signed returns.

The normal focused evidence runner accepts a pathspec argument. Here the two reviewed Storybook fixtures are the behavior under test. The local replay uses the repository test pathspec with the two fixture paths explicitly excluded, so a replay against the old source cannot install the missing story implementations as test overlays. Its changed browser tests and collateral scope stay intact.

```sh
node gates/bin/story-evidence.ts check specs/031-change-list-discovery 1 \
  'pnpm run setup:offline' \
  ':(glob)**/*.test.ts :(glob)**/*.spec.ts :(glob)**/test/** :(glob)**/*.stories.ts :(exclude)storybook/stories/change-list-plan.stories.ts :(exclude)storybook/stories/change-list-upgrade.stories.ts'
```
