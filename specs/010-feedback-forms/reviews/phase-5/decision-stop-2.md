# Phase 5 stop 2: operator decision

decided_by: human:jeroennouwsdev
date: 2026-11-16
question: stop-2.md (`gate:plants` fails on two of #10's plants that list the repository's stories:
`storybook-build/fail-empty-index` has no empty replacement for the three new story files, and
`visual/fail-token-changed` lacks the 30 new light story-themes in its expected findings; the plant files are
outside T066's file list)

**Decision: option (a), fix the plants in this phase.** In one commit of its own after green, with no test
assertion change:
- `gates/plants/storybook-build/fail-empty-index/tree/storybook/stories/{notice,form-input,form-select}.stories.ts`,
  each a default export with no story and the plant's one-line comment, as mission 005 did for `icon` and
  `brand-mark`;
- `gates/plants/visual/fail-token-changed/plant.json`: the 30 findings
  `elements-ocelle-{notice,form-input,form-select}--<story>/light` `differs` added, and the `why` text's figure
  moved from twenty to fifty light story-themes, naming mission 010's 30.

T066's file list is widened to name them. Shards 1 and 16 and the verdict are rerun and recorded in `plants.md`.

Options not taken: (b) a planner change to tasks.md first; (c) a separate op.
