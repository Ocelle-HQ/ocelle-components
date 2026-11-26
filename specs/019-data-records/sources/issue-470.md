<!-- Provenance: spec-kitty/spec-kitty-design issue #470, title, metadata, body and comments as fetched on 2026-11-20, supplied by the operator (IQ-25 (b), reviews/phase-1/inventory-decisions.md; reviews/phase-2-inventory-decisions.md). Recorded verbatim below this note, unedited. The `sk-*` and `--sk-*` names are spec-kitty roles, not names of this library. -->

# Desktop V2 application-primitives consumer contract and immutable train handoff

- Number: #470
- URL: https://github.com/spec-kitty/spec-kitty-design/issues/470
- State: open
- Author: MOES-Media
- Created: 2026-09-19T21:39:50Z
- Updated: 2026-09-28T20:25:22Z
- Labels: (none)
- Milestone: (none)
- Fetched: 2026-11-20 20:03:41 UTC

## Body

## Program context

D1 of the Kitty Desktop V2 redesign program.

- Target branch: `train/elements-first`
- Accepted input ref: `173774af635cf34aeb13ea03a3bdaa12c651557d`
- Consumer: Kitty Desktop, a local/offline Tauri application
- The approved prototype is composition evidence only; its code and data must not be copied.

## Scope

Produce a machine-checked consumer contract and immutable handoff for the existing primitives: action-row, app-shell, button, card, context-sidebar, data-table, disclosure, empty-state, event-timeline, facts, form-select, metric, nav-pill, notice, page-header, personal-rail, pill-tag, progress, segmented-choice, status-indicator, workflow-board, workflow-lane.

The handoff must record immutable source SHA, source path, content hash, license, state coverage, accessibility evidence, and visual evidence suitable for verified offline vendoring.

Neutral selected navigation is a Desktop consumer composition made with existing tokens, not a vendored CSS fork. The artifact file/presence tree is a Desktop-owned domain adapter, not a new generic design primitive.

## Exclusions

- Tauri behavior
- Desktop screens, routes, or typed application data
- An npm runtime dependency
- A new generic file-tree component
- Whole-train promotion to protected `main`

## Acceptance boundary

Acceptance must include repository-native lint, test, build, Storybook, axe, visual, and export checks, plus a deterministic verification seam that fails on consumer-contract drift.

## Comments (1)

### Comment 1 — MOES-Media — 2026-09-28T20:25:22Z

D1 Stage B handoff artifact update (2026-09-28): PR #489 merged into develop by the required rebase method at a6518cd29c53a6f7d61b6dfddefc842143653bca. Its retained artifact tree is identical to reviewed H=e6438f2b6ec417de836eaefe6fc470f0b7ae9019 (tree 06de13e29bfabb111ef601a00a1996881c988471); the landed diff is 201 handoff-only files. PR CI 36475263924 and full exact-H dispatch 36475303527 passed, with all four Codex lens verdicts PASS. See PR #489 final gate comment for counts and H-bound adverse proof.

This is artifact delivery, not native Spec Kitty WP/mission acceptance. Native closeout remains held: develop requires a rebase merge, which rewrites the exact commit SHAs recorded by the current accept/merge metadata. No false final verdict was recorded. K1/K2 final S/R compatibility is also still a separate decision, not implied by this artifact merge. Issue remains open.
