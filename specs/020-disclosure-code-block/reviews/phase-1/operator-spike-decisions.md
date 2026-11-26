# Operator decision at the phase 1 spike stop (2026-11-20, human:jeroennouwsdev)

- **T001 item 5 (a slotted bare `<svg><title>` under the `aria-hidden` icon wrapper still names the summary, Chromium
  156, `spike.md`):** "(a) label from `.label`". The element sets the summary's `ariaLabelledByElements` to its own
  `.label` wrapper (same shadow root, no ID crossing a root) only while the host gives no `aria-labelledby` or
  `aria-label`; a moved host `aria-labelledby` or `aria-label` takes over. FR-006's name order holds; an empty summary
  still has no name. Research R-01 and R-03 and the data model change; the spec's requirements do not.
