// The internal "has a time" predicates of `ocelle-timeline-event` and `ocelle-event-timeline` (019 FR-023; research.md
// R-10; contracts/ocelle-timeline-event.md § Has a time). Outside the manifest's glob and the package's exports map.
// Phase 2 scaffold: the signatures only, no behaviour (both give false: no element has an empty local name).

/** Whether the event has a slotted time: a visible direct `slot="time"` child with non-blank text. */
export function hasSlottedTime(event: Element): boolean {
  return event.localName === "";
}

/** Whether the event has a time: a slotted time, or a non-blank `time` attribute. */
export function hasTime(event: Element): boolean {
  return event.localName === "";
}
