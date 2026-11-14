// How a compact card reaches a slotted section header (011 research.md R-05, FR-017; operator decision
// PLAN-CORRECTNESS-1-007 (a), the pull model): the section header works out from the DOM whether it is assigned to a
// compact card's own `header` slot, and the card only asks the headers assigned to that slot, and those that just
// left it, to look again. Two functions and no state: nothing module-private carries the channel, so a card and a
// header defined by two copies of the package still agree (the card's notice is the `requestUpdate()` every Lit
// element has, and both match by local name). No CSS custom property, part, attribute or public property carries it
// (FR-007). Internal, not exported from the package root.

const card = "ocelle-card";
const header = "ocelle-section-header";

/**
 * Whether `element` is assigned to the slot named `header` of the shadow root of an `ocelle-card` whose `density`
 * attribute is `compact`, the value the card's own compact rule keys on (an empty or invalid `density` is regular
 * here too). Only an element assigned to that slot itself has it as its `assignedSlot`: a header in the card's body,
 * nested inside an element in the `header` slot, or in a card nested in it is not in a compact card's header.
 */
export function inCompactCardHeader(element: Element): boolean {
  const slot = element.assignedSlot;
  if (slot?.name !== "header") return false;
  const root = slot.getRootNode();
  return root instanceof ShadowRoot && root.host.localName === card && root.host.getAttribute("density") === "compact";
}

/** An upgraded section header: one that answers `requestUpdate()`. */
function upgraded(element: Element): element is Element & { requestUpdate: () => void } {
  return typeof (element as Partial<{ requestUpdate: unknown }>).requestUpdate === "function";
}

/**
 * Calls `requestUpdate()` on every upgraded `ocelle-section-header` among the elements assigned to `slot` and among
 * `previous` (the headers notified last time, so one that has left the slot is told too), once each, and returns the
 * `ocelle-section-header` elements assigned to `slot` now, in slot order: the `previous` of the next call.
 */
export function notifyHeaders(slot: HTMLSlotElement, previous: readonly Element[]): Element[] {
  const current = slot.assignedElements().filter((element) => element.localName === header);
  for (const each of new Set([...current, ...previous])) if (upgraded(each)) each.requestUpdate();
  return current;
}
