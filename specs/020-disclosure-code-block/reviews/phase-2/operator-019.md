# Operator decision: mission 019 before phase 2 (T020, FR-060)

Date: 2026-11-21. Operator: jeroennouwsdev.

## 019's status (orchestrator, origin/claude/013-data-display-2 at d3588232)

- Not landed and no PR. 019 is in phase 2 of 4 (US2, event timeline). The phase 2 spike is done; there is no red commit yet.
- 019 changes `packages/elements/src/overflow-region.ts` additively. It adds optional `blockAxis` and `blockStartBox`
  options plus block-axis helpers (`BlockSpan`, `BlockClearanceBox`, `blockClearanceScroll`, `blockEdgeState`), and
  widens the internal output key. Checked against the diff: the inline-axis `{ box }` interface that the code block
  uses is unchanged, and 020's spec has no block axis.
- Shared files will conflict at whichever mission lands second:
  - `packages/elements/src/index.ts`
  - `custom-elements.json`
  - `CHANGELOG.md`
  - `README.md`
  - `package.json`
  - the test drivers
  - the gate integration counts
  - `storybook/.storybook/stories-layout.css`

## Question

How should phase 2 proceed?

## Answer

**Proceed on main.** Build phase 2 on the overflow-region module as it is on main, inline axis only, with no main
merge. Record the shared-file conflicts and 019's additive module change as known gaps for /ocelle-land, which
resolves them for whichever mission lands second.

## Phase 2 base

The branch is built on as it is, so phase 2 builds on the phase 1 head: `8ebbe439b08562e3832fbe996645d4ff714f0874`. That is the branch base of SC-007
and SC-008 for phases 2 and 3 (T033, T041). No task merges `main`.
