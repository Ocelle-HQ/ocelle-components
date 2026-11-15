# Phase 1, review round 2: fixes

Operator round at landing (PR #44), task T048 (`reviews/landing/round-1-tasks.md`).

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R2-01 | fixed: `packages/elements/README.md` gains a section `## Forwarded slots`, between `## Slot convention` and `## Host ARIA`, telling shell authors that a forwarded `<slot>` with nothing assigned to it counts as content (the part takes its wrapper, gap, padding or divider) and to forward a slot only when it has content, or remove the forwarding `<slot>`. No code changes: `src/slot-state.ts` keeps reading `assignedNodes()` unflattened (research.md R-03 § Forwarded slots). Each element's empty-slot paragraph is unchanged. No source, CHANGELOG or story change, so no mutation run and no baseline. | `fix-2` f47c795 (tests only), recorded by `red.sh 1 fix-2` (`red-fix-2.log`: "1 of 3594 tests failed", only `readme.test.ts:266` "states: A shell that forwards a slot of its own …", an `AssertionError` on `toContain`; dockerd running) | packages/elements/README.md; packages/elements/test/node/readme.test.ts (fix-2) |

## Checks at the fix

| Check | Result |
|---|---|
| `pnpm exec vitest run --project elements-node` | 249 passed |
| `gate:test-lint` | 207 files checked, no finding |
| `gate:lint` | 304 files checked, no finding |
