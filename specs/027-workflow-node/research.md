# Research decisions for the workflow node

## One native selection control

Use a dedicated native button and the registration and event conventions already used by `ocelle-action-row`. The action-row also supports navigation, host ARIA forwarding, and its own slot and availability semantics. The workflow node needs metadata and an explicit tab-order handoff. Keep its button and descriptive content under one component so the layout has one activation path. Use the card’s border, ground, spacing and radius token patterns and the repository’s icon conventions wherever a decorative icon is used. [Action row](../../packages/elements/src/ocelle-action-row.ts) · [Card](../../packages/elements/src/ocelle-card.ts) · [Icon](../../packages/elements/src/ocelle-icon.ts)

## Focus and accessible states

Set the native button’s tab participation from a property on the node. Forward `focus()` to that same control after render. The canvas chooses which node stays in sequential order and handles graph navigation. A shadow-local reference provides the button’s full title. Sibling metadata and state text remain readable and supply its description. Use stable text for Selected, Waiting and Invalid so state remains available with equalized colors and to assistive technology. Select a visual focus treatment from the existing focus tokens and prove it in forced colors. [Focus precedents](../../specs/012-button-action-row/)

A generic shadow-button probe in Chromium confirmed native Enter and Space activation, removal and restoration of the button’s tab stop, and direct focus at `-1`. The accessibility tree included the full title and the description from same-root metadata, state text and slotted status. Use a computed accessible description assertion for the component. The generic probe also showed that the accessibility snapshot omitted the description.

## Host-owned updates

Send one bubbling, composed selection request with only the stable ID. The host remains responsible for selection and may use the identical action in read-only inspection. Allow optional noninteractive status content outside the button so a host can provide readable text before the library’s other status elements land. Canvas layout, routing and outcome connections belong to #73. [Node issue](https://github.com/Ocelle-HQ/ocelle-components/issues/72) · [Canvas issue](https://github.com/Ocelle-HQ/ocelle-components/issues/73)
