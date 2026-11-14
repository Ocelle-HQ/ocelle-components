// How a compact card reaches a slotted section header (011 research.md R-05, FR-017; the pull model): two functions
// and no state. Internal, not exported from the package root.
// Scaffold (phase 2): the signatures only; the behaviour comes with T019.

/** Whether `header` is assigned to the `header` slot of a compact `ocelle-card`'s shadow root. */
export function inCompactCardHeader(header: Element): boolean {
  void header;
  return false;
}

/** Asks the section headers assigned to `slot`, and those in `previous`, to update; returns the assigned ones. */
export function notifyHeaders(slot: HTMLSlotElement, previous: readonly Element[]): Element[] {
  void slot;
  void previous;
  return [];
}
