# Implementation plan — Anchored popover for compact controls

**Branch** `036-anchored-popover`
**Date** 2026-11-27
**Input** [Approved #86 spec](spec.md) and [triage](../../triage/036-anchored-popover.md)

## Summary

Add `ocelle-anchored-popover` to `@ocelle/elements`. A named native button and the adjacent nonmodal surface share an open shadow root. Use the native manual top layer, native sequential focus, and scoped dismissal. Position the surface with one adopted stylesheet per instance. Add executable appearance and fictional profile examples and pilot the three verified workflow changes.

## Technical context

Use Lit 3, the repository’s pinned Node 26.13.0 and pnpm 12.16.1, and existing browser and Storybook tools. Target Chromium 135+ and WebKit 17.4+. The package performs no I/O. Test exact native behavior in the element project, published import and built strict-CSP fixtures, and the built Storybook. Track placement only while open. The public surface is one element and its package entry points. [Research](research.md)

## Implementation phases

1. **US1 — Interaction and public package surface.** Scaffold the package entry and a minimal visible test surface for assertion-level red. Cover named native triggers, disclosure state, native forward and reverse Tab, visible external focus, outside dismissal using trusted mouse and touch, captured release across the panel boundary, host close, editable and readonly native search Escape and both foreground overlay sequences. Build the packaged element under strict CSP and prove its target dimensions, checked token pairs and visible focus in both themes and forced colors. Preflight the strict fixture from each runner’s namespace and run the engine-neutral checks on the exact browser floors described in the verification contract. Verify native pointer focus against a control button on the same browser. Assign the root entry, individual entry, package tests, README and changelog to one package task. Assign canonical manifest generation and its affected snapshots to one owner and use manifest preflight before capture.
2. **US2 — Placement and lifecycle.** Test both placement priorities and constrained-content cases in transformed clipping parents at a real 320 CSS pixel browser viewport. At a separate fixed viewport prove the native control’s computed text doubles, a long label wraps and every enabled action stays reachable. Verify RTL inline start, internal scrolling, dynamic anchor and viewport movement, responsive hiding of a still-connected anchor, and detachment. Own geometry as a separate unit under this phase. Keep one integration owner for `ocelle-anchored-popover.ts` and common fixtures. Test the joined public component before phase promotion.
3. **US3 — Executable examples and pilot.** Write a shared external appearance/profile host. Feed the same host to the regular built Storybook and the separate packaged strict-CSP fixture. Cover realistic keyboard and pointer interactions, forced colors, and light/dark baselines. Declare the implementation story in the phase replay scope. Assign built-index and Plant inventory updates to one owner, distinct from fixture and story authoring where paths are disjoint. Gather the scoped capture, advisory mutation and Visual evidence observations and run all required CI.

Each phase has one canonical tests-only red proof on the correct base, focused green, mutation and applicable Plants, independent review, and replay after fold. Mark worktree tasks parallel only after prerequisites are met and exact write paths are disjoint. Browser and source drafts may be prepared separately and joined by the integration owner. Common component, fixture-helper and generated files each have one owner.

## Repository integration

- Source and package ownership cover `packages/elements/src/ocelle-anchored-popover.ts`, `src/index.ts`, `package.json`, `README.md`, `CHANGELOG.md` and the generated `custom-elements.json` in the package. Verify root registration and per-element isolation, emit/pack and types. Check existing root, exports, manifest and README inventories before the first hosted build. `src/browser.ts` imports the root.
- Run manifest preflight from the full phase base. Give one owner the generated manifest and all eight active full Plant snapshots. Preserve each exact seeded finding and the reordered pass case. [Verification inventory](contracts/verification.md)
- Implement the independent appearance and profile examples in `storybook/stories/anchored-popover.stories.ts`. Use four closed/open IDs and eight theme baselines. Check the actual built index and both theme names before capture. Update the Workbench, axe, visual, plant-repo and token-change proof inventories from observed results.
- Assign one owner to `storybook/stories/anchored-popover.ts` and `storybook/stories/anchored-popover.css`. Assign the strict fixture and temporary external build to the browser-proof owner, and `storybook/test/unit/browser/anchored-popover.test.ts` to the retained host-test owner. Run host route preflight and scoped ordinary Mutation on the exact shared production module. Preserve both independent built browser proofs.

## Pilot base and evidence

PR #107 passed all 19 required checks on `e7658048a82d24714f8e395d814a396d2db9e0d2` with independent approval. If #107 is open when implementation is approved, create a linear pilot branch at that exact commit and replay only the mission records from `036-anchored-popover`. Publish the new branch and retain the existing spec branch. Base the same-repository pilot PR on `037-pilot-feedback-verified` while it points at the verified commit.

If #107 has landed by implementation start, pin the current `origin/main` commit after comparing its required pilot workflow, command and audited input blobs against #107 as described in the verification contract. Start the linear mission branch at that verified main commit. If the tooling differs, verify the changed tooling and re-audit the observer before using it. Hold each matched pair to one exact common base. A change to that base or the target requires a new pair.

For a stacked pilot, preserve its exact receipts, reviews and fold material. Once the tooling is verified on main, use the normal landing pass to integrate main after the fold, check the resulting mission-only diff and retarget to main. A squash can preserve tooling content without preserving its source ancestry. Confirm the integrated tree instead of using ancestry as a proxy. Record a fresh landing review and all 19 required checks on the exact final main-targeted candidate. [Workflow CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45901385962) · [Workflow review](https://github.com/Ocelle-HQ/ocelle-components/blob/0dfa36f85bcd1d70b391bb3f5cac5b784b1da8a8/ops/037-pilot-feedback/reviews/phase-1/round-2.md)

Run the full selection and the advisory related-file arm on the same exact element-only mutation shard, starting with the first reviewable element checkpoint. Capture the four exact Storybook IDs through the separate pinned hosted artifact before final full Visual. Once two successful exact same-PR candidates differ only by approved review evidence, observe reuse eligibility. [Measurement contract](contracts/verification.md)

## Constitution check

Pass. Additive MINOR package surface under the existing token, strict-CSP, offline and accessible native-control rules. Shadow-local IDs reference only nodes in the same root. Publish the surface in the manifest. Require signed test-first proof, real interaction and placement assertions, visual and Axe coverage, and all ordinary merge gates. No exceptions requested.
