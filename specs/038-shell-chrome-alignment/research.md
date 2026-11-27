# Shell Chrome Research

## R-01 — Chrome boundary ownership

Remove the top bar's normal block-end border and its corresponding forced-colour color. The menu button's forced-colour rules are independent. The app shell can contain explicit consumer-owned pane styling. Hiding a line with a transparent border would keep its height contribution and could resolve to a system color in forced colours. Place test pane styles in the host fixture and assert the edge and pane separately. Reuse the existing built app shell test and serve its external CSS and JavaScript under the fixture's strict policy. [Previous proposal](https://github.com/Ocelle-HQ/ocelle-components/pull/83)

## R-02 — Redistribute the rail’s auto margin

Move the auto block-start margin to the existing visible divider for the populated opt-in vertical case, replacing the bottom group's auto margin in the same case. Flex computes the same free space and keeps both groups at their existing positions. Changing slot order, moving the divider around the DOM, or switching to a wrapper-based alternate layout could disturb focus or default grouping. The existing shared tests provide token sizes, actual divider pixel runs, RTL/horizontal geometry, and built parity. [Previous proposal](https://github.com/Ocelle-HQ/ocelle-components/pull/84)

## R-03 — Forward an optional native slot

A named slot supplies the existing browser projection behavior. Keep the product text separate from the badge and use CSS shrink and ellipsis on the product text while reserving room for the short host accessory. Prefer an unboxed slot or conditional presence handled by existing slot-presence logic so the default layout has no new flex gap. The existing controller uses direct assigned nodes, so a wrapping slot by itself reads as populated. A native boxless slot or the shell's existing content detection avoids a phantom gap. If sizing is needed apply it to the distributed element using a flattened slot selector, and verify the result in both direct and forwarded cases. The 320 px browser test compares actual bounds and keyboard behavior with the existing Settings fixture. A second visible or accessible product-name label would duplicate information. [Previous proposal](https://github.com/Ocelle-HQ/ocelle-components/pull/85)

## R-04 — Establish generated evidence from the same specimen

Reuse Vitest, the shared rail geometry helpers, existing externally built app-shell fixture, pinned Storybook capture, and normal Axe and Plants. Scope the feature replay to changed files while keeping the full landing check. Use the phase base to determine intended document and fixture changes. Derive actual capture and Axe totals from the built index and findings. The standard Storybook preview boot uses inline script. Use the built strict-CSP shell fixture for the separate policy and native interaction proof.
