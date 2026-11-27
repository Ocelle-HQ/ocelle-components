# Public element contract

- Root and `@ocelle/elements/ocelle-anchored-popover.js` import paths. The per-element path registers this element. The exported class is `OcelleAnchoredPopover`.
- `label` names the native button. An absent or whitespace-only label leaves the trigger disabled. The `trigger` slot accepts a decorative icon or initials; the default slot accepts the surface’s ordinary controls. Trigger slot content is noninteractive and the accessible name comes from `label`.
- `placement` selects a preferred `below` or `above` position. It defaults to `below`. Constrain the rendered panel to the visible viewport. Choose the opposite vertical side when it has more usable room and the preferred side cannot fit. Favor an above surface with internal scrolling for a constrained bottom-rail trigger. When neither vertical side has usable space, use an adjacent side that has room, then constrain the surface to the visible viewport. Align to logical inline start and clamp both axes.
- `close()` closes an open panel and safely does nothing while closed or before first render. If an active node is in its flat surface, return focus to the enabled trigger with no page scroll. If focus has already moved elsewhere, preserve it. No new custom public events, focus trap or forced menu or dialog role.
- `trigger` and `surface` are CSS parts. Use inherited library tokens, visible focus and usable targets in both themes and forced colors. No new tokens are required.

## Interaction and lifetime

The native button toggles its manual popover. Expose expansion on the actual button, and a same-root controls relationship. Native Tab and Shift+Tab follow the shadow invoker and projected contents in document order. Disabled controls stay out. The panel receives no default focus on open.

Handle Escape on the trigger or within this open surface. Respect an already handled event, composition, and an active foreground close watcher. If a focused action opened an externally mounted overlay, its events and focus stay with that overlay until it closes. If a nested surface handles Escape, allow its own handler or native close request to run. Consume the popover’s own Escape so a surrounding Ocelle overlay cannot close on the same key.

For primary outside pointer dismissal, require a matching down/up pair outside both trigger and surface. Use composed paths and the containing root when retargeting hides the inner path. Resolve ambiguous retargeted events after dispatch before dismissing. Cancelled and inside-to-outside drags stay open. Closing cannot prevent or replace the outside target’s pointer activation or move focus back to the trigger. Keep pointer tracking attached only while open. Closing or disconnecting clears tracking, pending work, and geometry. Flat containment follows slot assignment and shadow hosts.
