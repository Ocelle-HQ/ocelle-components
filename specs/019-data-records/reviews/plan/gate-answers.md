# Plan-gate answers applied, 019-data-records

- **Source:** `reviews/plan/operator-gate.md` (2026-11-16, human:jeroennouwsdev).
- **Applied:** 2026-11-16, to the spec and design artifacts only. No source or test code exists or was written.

| Answer | Change | Where |
|---|---|---|
| Decision 1 (R-03): (a) | Marked decided; the plan's default stands (`:host .region-track { inline-size: fit-content }`) | research.md R-03 (heading, Decision, Alternatives) and § Questions of the plan gate; plan.md Summary, § Decisions at the plan gate item 1, Complexity Tracking; contracts/ocelle-data-table.md; spec.md § Operator decisions at the plan gate |
| Q-A: (a) | Marked decided: outline only, no fill | research.md R-12 heading, R-13, § Questions; plan.md Summary (chain), § Decisions item 2; spec.md FR-035 (the "open question" sentence replaced by "no fill") and § Operator decisions at the plan gate |
| Q-B: (a) | Marked decided: medium weight in `ink-muted` | research.md R-06 (the "may change" sentence), R-13, § Questions; plan.md § Decisions item 3; spec.md § Operator decisions at the plan gate |
| Q-C: (a) | Marked decided: the time on its own line above the content, the marker on that line | research.md R-10 Decision, § Questions; plan.md Summary (timeline), § Decisions item 4; contracts/ocelle-timeline-event.md; spec.md FR-023 ("before or above" narrowed to "above") and § Operator decisions at the plan gate |
| Q-E: "Yes: named time slot" | Spec change: FR-023 rewritten (a named `time` slot taking precedence over the `time` attribute; visible non-blank slotted content required; styled through `::slotted()`; nothing written on the slotted nodes; item text time first wherever the node sits; updates without reload). Recorded under the spec's new § Operator decisions at the plan gate | spec.md § Operator decisions at the plan gate, US2 narrative and Independent Test, US2-3 ("no time" defined), FR-023, FR-050, Key Entities, Edge Cases (before upgrade, items outside their container, more than one slotted time, `lang` and `dir`) |
| Q-E | New acceptance scenarios: US2-11 (slotted `<time datetime>` after the content shown above it, attribute time's computed type, a `<b slot="time">` included, read first, marker on the time's line), US2-12 (attribute ignored while the slot has content, shown again when the slotted node is removed), US2-13 (empty, white-space-only, `hidden` or `aria-hidden="true"` slotted time: no time box, not shown or exposed, content alone, marker on the content line, connector as untimed; with a `time` attribute the attribute applies), US2-14 (filled, emptied, hidden and shown after mount) | spec.md US2-11 to US2-14 |
| Q-E | Contract: the `time` slot in the manifest table; named (not manual) slot assignment; the time box holds the slot only while `hasSlottedTime`, else the attribute's text; `::slotted(*)` type rule and `::slotted([hidden])`, `::slotted([aria-hidden="true"])` `display: none`; `hasSlottedTime(event)` and `hasTime(event)` reading the light DOM; the event's own `MutationObserver`; item text; what the slot carries (replaces § Limits); outside a timeline; before upgrade | contracts/ocelle-timeline-event.md (rewritten) |
| Q-E | Contract: `hasTime(event)` counts a slotted time for `has-time` and `next-has-time`; the observer watches the events' subtrees (`childList`, `characterData`, `hidden`, `aria-hidden`, `time`, `slot`); usage example with a slotted time; AX tree note (slot or attribute, never both); before upgrade | contracts/ocelle-event-timeline.md |
| Q-E | Data model: `time` row (ignored while slotted), new `slotted time` and `has a time` rows on the event; `has time` row on the timeline and `next has time` via `hasTime(event)` (the stray blank line that split the timeline table removed); item text; before upgrade | data-model.md |
| Q-E | Research: R-08 (the timeline's observer on subtrees; before upgrade a slotted time shows inline, no new rule; the phase 2 spike gains the slot checks); R-10 (Decision, "Has a time" rewritten around `hasSlottedTime(event)` and `hasTime(event)` in `src/timeline-time.ts`, the `::slotted()` rules, the event's own observer, the manifest slot statement, the slot bodies; the connector's `next-has-time` from `hasTime(event)`; the mixed geometry body includes a slot-timed and an empty-slot event; the slot plants); R-15 baseline counts 24, 20, 22; § Questions (Q-E decided) | research.md |
| Q-E | Checks: oracles list US2-11 to US2-14 and the slotted-time bodies; two new "platform alone could pass" rows (US2-13, US2-12); eight slot plants; a tenth timeline story (marked-up times); 33 stories, 66 baselines, phase 2 adds 20 | contracts/checks.md |
| Q-E | Styles contract: before upgrade only attribute times are missing; a slotted time shows inline, no rule added | contracts/styles-data-table.md |
| Q-E | Plan: Summary (timeline), Performance (one observer per event; the timeline's on subtrees), Scale (33 stories, 10 in phase 2, 66 PNGs), Constitution Check header and rows I, III, VI, § Decisions item 6, Documentation tree, Source tree (`timeline-time.ts`), phase 2 spike, red list (US2-1 to US2-14, slot bodies, mixed geometry, manifest slot statement, slot edge bodies, the README statements for the slot), green list (predicates, slot, observers, manifest slot, 10 stories, README and CHANGELOG naming the slot) | plan.md |
| Q-E | README notes, planned in phase 2's red and green: the `time` slot takes precedence over the attribute; it carries `datetime`, `title`, `lang`, `dir` or an htmx target, which the attribute cannot; one time element per event; a consumer rule on the slotted node beats the `::slotted()` type; before upgrade a slotted time shows inline where written | plan.md phase 2 Red (README statements) and Green; contracts/ocelle-timeline-event.md § What the slot carries, § Before upgrade |
| All | Quickstart's by-hand timeline check gains the marked-up times story; the spec checklist records the plan gate | quickstart.md; checklists/requirements.md |

The Constitution Check still passes with no exception: the slot is a declared manifest slot (I, VII MINOR), its type
comes from tokens through `::slotted()` (II), its text keeps `ink-muted` on the nine grounds and is exposed in order
(III), and it adds no inline style (IV).

## Question for the operator

**Q-G. An empty or hidden slotted time beside a `time` attribute (FR-023, US2-13).** The answer to Q-E says the slot
takes precedence and that an empty or hidden slotted time counts as no time, but not whether a non-blank `time`
attribute then applies.

- **(a) The attribute applies.** The slot wins only when it has visible non-blank content; otherwise the event falls
  back to its `time` attribute. This is the plan's reading, written into FR-023, US2-13 and R-10, and it stands until
  you answer.
- **(b) No time at all.** Any `slot="time"` child, empty or hidden included, silences the attribute, so a consumer can
  clear a time by emptying the slotted node. This changes FR-023, US2-13's second half, `hasTime(event)` and the
  `hasSlottedTime` plant before tasks.
