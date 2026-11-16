// What the overlays and the tooltip share without importing each other (008 research.md R-10, R-12): internal, not an
// entry point and no tag. `src/ocelle-tooltip.ts` sets `dismiss`, which hides the shown bubble (R-10 "hide current")
// until the pointer or keyboard focus enters its trigger again, and so also ends that tooltip's own pending delay. Of
// what an opening overlay brings, another tooltip's pending hover delay ends only by its trigger's `pointerout`, or by
// the tooltip's removal; `focusout` does not end it while the pointer is over the trigger, since a tooltip hides on
// `focusout` only when not hovered. `src/overlay.ts` calls it before an overlay opens, and sets `top`, which
// names the topmost open overlay, so the tooltip's Escape never takes a key meant for a modal above its trigger.
// Neither module imports the other: `ocelle-tooltip` defines no `ocelle-icon`, and the overlays no tooltip.

/** The hooks, each unset until the module that owns it is loaded. */
export const bubbles: {
  /** Hides the shown tooltip bubble (an overlay is opening), and ends that tooltip's own pending delay. */
  dismiss?: () => void;
  /** The topmost open overlay's host, or undefined when none is open. */
  top?: () => HTMLElement | undefined;
} = {};
