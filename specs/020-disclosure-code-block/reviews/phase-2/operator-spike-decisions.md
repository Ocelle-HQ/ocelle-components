# Operator decisions: phase 2 spike (T021)

Date: 2026-11-21. Operator: jeroennouwsdev. Source: `reviews/phase-2/spike.md`, § Questions for the operator.

- **Q1, the whole-block copy's newline (FR-031, US2-10): (c) both bodies.** There are two story bodies, both measured
  under the pinned Chromium 156 in both harnesses:
  - With the block last on the page, the copy is exactly the trimmed digest.
  - With content after the block, the copy is the trimmed digest plus one `\n`.
- **Q2, the prefix breaking inside where it fits (FR-033, US2-12): (c) restate the oracle.** The prefix breaks inside
  only where the prefix and its gap are wider than the line. The body's threshold is the prefix's width plus
  `--ocelle-space-1`. This changes the spec only; the code and R-07's structure stay as they are.

The planner also takes the spike's two notes into the artifacts:
- The base64 sweep string does not guard the groups' `nowrap`; only base64url does.
- The host's computed font family comes from the page, because R-06 gives `:host` no font, while the contract's
  no-monospace check asserts the host's font.

T021 closes once these decisions are applied. T021a then runs before the scaffold.
