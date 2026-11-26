# Tasks — Harden phase replay and review handoffs

## Phase 1: Harden focused workflow verification

- [ ] T001 [P] [US1] Add replay regressions for main-only and shared test changes, the original red proof, and invalid or conflicting pins. Depends on none. Writes `gates/test/integration/test-workflow-evidence.test.ts`.
- [ ] T002 [P] [US1] Add regressions for missing, unexpected and duplicate shard test identities and top-level runner errors. Depends on none. Writes `gates/test/test-evidence-shards.test.ts` and `gates/test/test-shards-cli.test.ts`.
- [ ] T003 [P] [US1] Add disposable Git regressions for the scope guard's JSON and exit behavior, exact paths and rename coverage. Depends on none. Writes `gates/test/integration/scope-check.test.ts`.
- [ ] T004 [US1] Record the tests-only commit and the expected failing assertions on the phase base. Depends on T001, T002, T003. Writes the phase's red evidence under `ops/032-workflow-hardening/reviews/phase-1/`.
- [ ] T005 [P] [US1] Implement the pinned-main replay and document the review base in both story command copies. Depends on T004. Writes `gates/bin/story-evidence.ts`, `.specify/extensions/story/scripts/base.sh`, `tooling/speckit/extensions/story/scripts/base.sh`, `.specify/extensions/story/commands/speckit.story.review.md` and `tooling/speckit/extensions/story/commands/speckit.story.review.md`.
- [ ] T006 [P] [US1] Add shard diagnostics while retaining the inventory and runner rejection rules. Depends on T004. Writes `gates/lib/test-evidence.ts`.
- [ ] T007 [P] [US1] Make the scope guard fail closed with exact paths. Depends on T004. Writes `tooling/speckit/bin/scope-check.sh`.
- [ ] T008 [P] [US1] Record Storybook planning preflight and no-action gesture evidence in the planner profile. Depends on T004. Writes `.claude/agents/planner-pim.md`.
- [ ] T009 [US1] Document run and landing use of the updated guards, replay and exact hosted check evidence. Depends on T005, T006, T007. Writes `.claude/skills/ocelle-land/SKILL.md`, `.claude/skills/ocelle-run/SKILL.md` and `tooling/speckit/README.md`.
- [ ] T010 [US1] Rerun focused verification and applicable gates. Record results and readiness for independent review. Depends on T005, T006, T007, T008, T009. Writes green evidence under `ops/032-workflow-hardening/reviews/phase-1/` and marks progress in `ops/032-workflow-hardening/tasks.md`.
