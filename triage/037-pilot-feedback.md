---
triage: 037
issues: [92]
decision: op
target: "ops/037-pilot-feedback"
in_scope: []
out_of_scope: [7, 76, 86, 88, 89, 90, 91, 92]
semver: none
spec_prompt: "Use the first pilot's retrospective to improve mutation feedback, pinned capture and Visual evidence. Pilot the changes on independently triaged #86."
status: approved
decided_by: "human:MOES-Media"
decided_at: 2026-11-26T21:30:44Z
---

# Triage 037 — Feedback from the first verification pilot

The operator asked to apply the next three workflow improvements and trial them on the next issue. Issue #86 is the next independent issue in the approved Op 034 pilot sequence. It has no listed blockers. Its product work is a separate mission.

The #89 retrospective recorded a 39m34s element mutation shard, exact related-file mutant outcomes in one advisory sample, a costly full CI fallback for six baseline images, and a Visual observer that could not fetch the exact job log. Its pinned replay rejected capture reuse because pnpm launcher hashes differed.

Keep the required gates. Add an advisory related-files mutation lane, a two-engine capture path for explicitly selected Storybook stories, and an exact-job log fallback with verifiable native pnpm identity. On #86 record timings and coverage evidence, and use full CI for the merge candidate.

- [First-pilot diary](../knowledge/speckit-flows/log.md)
- [Approved pilot sequence](034-workflow-pilots.md)
- [Issue #86](https://github.com/Ocelle-HQ/ocelle-components/issues/86)
