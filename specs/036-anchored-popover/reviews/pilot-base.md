# Anchored popover pilot base

- Mission records came from `036-anchored-popover` at `82b3f741`. The stacked branch contains the same mission documents.
- Verified tooling head `e7658048a82d24714f8e395d814a396d2db9e0d2` is the pinned base of the pilot. PR #107 is open and its branch still points at that verified commit. The 19 required tooling checks and independent review passed. [Tooling CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45901385962) · [Tooling review](https://github.com/Ocelle-HQ/ocelle-components/blob/0dfa36f85bcd1d70b391bb3f5cac5b784b1da8a8/ops/037-pilot-feedback/reviews/phase-1/round-2.md)
- Phase 1 starts at `58a38e180433d2b1eb748ac321e1234acd761c4b`. The pinned checkout passed offline setup on Node 26.13.0 and pnpm 12.16.1 with Playwright browser revision 1248. The Storybook image retains the pinned linux/amd64 digest `sha256:ee15712262f017b8157421b212b12099146645f44b1bc5c0514cbbe6a229b1d0`.
- The exact minimum-browser runs are separately pinned in the [verification contract](../contracts/verification.md). This initial setup establishes the regular current-browser test environment.

Phase 1 checkpoint opened 2026-11-27T09:59:09Z UTC.
