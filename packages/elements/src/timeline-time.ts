// The internal "has a time" predicates of `ocelle-timeline-event` and `ocelle-event-timeline` (019 FR-023; research.md
// R-10; contracts/ocelle-timeline-event.md § Has a time; plan gate Q-E and Q-G (a)). Both read the event's light DOM
// directly, never `assignedNodes()`, which is empty while the event renders no `time` slot, so the event and its
// timeline give the same answer. The file is outside the manifest's glob (`src/ocelle-*.ts`) and the package's exports
// map, and the package root does not re-export it, so neither predicate is public surface.

/**
 * Whether the event has a slotted time: at least one of its direct children with `slot="time"` that is neither
 * `hidden` nor `aria-hidden="true"` has text that is not blank. An empty, white-space-only or hidden slotted time
 * counts as none.
 */
export function hasSlottedTime(event: Element): boolean {
  for (const child of event.children) {
    if (child.getAttribute("slot") !== "time" || child.hasAttribute("hidden") || child.getAttribute("aria-hidden") === "true") continue;
    if (child.textContent.trim() !== "") return true;
  }
  return false;
}

/**
 * Whether the event has a time: a slotted time, or a `time` attribute that is not blank (absent, empty or white space
 * counts as no attribute time).
 */
export function hasTime(event: Element): boolean {
  return hasSlottedTime(event) || (event.getAttribute("time") ?? "").trim() !== "";
}
