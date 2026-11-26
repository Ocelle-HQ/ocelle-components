# Landing verification

Issue #87 adds an ordered, non-interactive step indicator and a Storybook recipe for pane actions. The indicator exposes current and completed states and retains the full accessible label at compact widths. The host owns action labels and navigation. [Issue #87](https://github.com/Ocelle-HQ/ocelle-components/issues/87)

## LAND

Triage 033 is approved. Both phases are complete and their independent reviews and focused replays cleared. The final integrated branch has a separate landing review. [Triage](../../triage/033-pane-step-indicator.md) · [Phase 1 review](reviews/phase-1/round-2.md) · [Phase 2 review](reviews/phase-2/round-2.md) · [Landing review](reviews/landing/round-1.md)

## Evidence

| Verification | Evidence |
|---|---|
| Indicator behaviour and package surface | Focused browser checks verify order, current and completed states, accessible names and list semantics, empty input, host updates, forced colours, and the absence of marker activation. Built aggregate and individual registration, the export map and generated manifest also pass. [Phase 1 replay](reviews/phase-1/tdd-check.json) |
| Footer behaviour and responsive layout | Real Storybook examples cover all four states, aligned desktop footers, 1200 px compaction, 320 px flow, 200% text, keyboard progression and retained focus. The separate strict-CSP fixture loads the same module. The navigation and clipping controls each fail their intended assertion. [Phase 2 replay](reviews/phase-2/tdd-check.json) · [Negative controls](reviews/phase-2/negative-controls.md) |
| Exact Unit and Plants receipts | Six hosted Unit shards cover 369 files, including the four existing inventory-only files deferred from local replay. All 326 Plants pass. The Phase 1 correction keeps each altered manifest fixture's configured finding exact. [Unit and Plants receipts](reviews/phase-2/round-1-fixes.md) · [Manifest overlays](reviews/phase-1/round-1-fixes.md) |
| Visual, accessibility and CSP | Both pinned Visual engines match all 796 story-theme files. Axe reports zero serious or critical issues and zero incomplete results beyond 132 existing exceptions. The required Content security check and both scoped built-browser proofs pass. [Capture evidence](reviews/phase-2/visual-baselines.md) · [Accessibility](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45749472887/job/139673514920) |
| Changed-source mutation | The standard local footer host run covers 140 mutants without a survivor, uncovered mutant or timeout. The supported element and shared host shards pass in the exact Phase 2 candidate. [Phase 1 mutation](reviews/phase-1/mutation.md) · [Phase 2 mutation](reviews/phase-2/mutation.md) · [Exact hosted candidate](reviews/phase-2/round-1-fixes.md) |

Phase 2's approved hosted candidate tested merge `aa12493e9bc93d97f761337a0ebd9dc9f4ca7e92` against main `25c53a915717fe464a67b53a7dd58ceaf4abc0c7`. The final folded head receives a fresh run of all 19 repository checks. Its exact head, base, tested merge and results are recorded on the pull request. [Phase 2 CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45749472887) · [PR #102](https://github.com/Ocelle-HQ/ocelle-components/pull/102)

## Repository settings

The main branch ruleset requires 18 CI contexts. Landing verification also checks the repository's Sandbox paths context. GitHub ruleset, permission, and approval settings are operator-controlled. Keep the folded branch and both phase archive refs after the squash so the test-first commits remain reachable.
