---
check: 2
verdict: clean
---

# Spec check 2

Spec read: `specs/013-data-display/spec.md` at commit `c92156e`, with `checklists/requirements.md`, `check-1.md`,
`check-1-fixes.md`, constitution 1.3.1, `triage/013-data-display.md`, `packages/elements/README.md` § Host ARIA,
`packages/tokens/src/source.ts` and `gates/bin/prefix.ts`. No `[NEEDS CLARIFICATION]` remains.

Earlier checks: the three blocking findings of check 1 are resolved as `check-1-fixes.md` says. SPEC-1-01: FR-005 states
the behaviour (switch on the element's own inline size, threshold above 320 px), FR-009 gives a checkable inline size in
shrink-to-fit hosts and moves the container query to research. SPEC-1-02: US3-7 and FR-036 both say "against the track
and against the ground", the `accent-strong` mark is required on every light-mode variant, and visible text waives
nothing. SPEC-1-03: US3-11 is browser-test only, and FR-050 and SC-003 name the exception. The notes SPEC-1-05 to SPEC-1-15
are applied as the fix note says. SPEC-1-04 was answered by the operator ("D: decide after measuring"). FR-004 and US1-6
stay conditional until the operator confirms or replaces FR-004 after the plan's measurement, and the spec says that
tasks wait for that decision. This is a gate the operator has already set, not a new question, so it has no row here.

The `sk-` names in the README mapping (FR-058) do not conflict with FR-002: the `prefix` gate reads no Markdown
(`gates/bin/prefix.ts`).

| ID | Severity | Where | Finding | Fix |
|----|----------|-------|---------|-----|
| SPEC-2-01 | note | spec.md FR-035, Assumptions ("The element does not format numbers") | FR-035 says a determinate bar "MAY show its value text beside the label". Without `value-text`, the only value text is the platform's percentage, which reaches assistive technology but is not visible. Showing a "58%" would mean the element formats a number, which the Assumptions rule out. Because of the "MAY", it is not settled whether this visible text exists or what it shows, so no test can fail on it. | State the rule: visible value text is shown only when `value-text` is set (and, if needed, an attribute such as `show-label`), and the element never computes it. Or drop the MAY clause. Add a US3 scenario for it. |
| SPEC-2-02 | note | spec.md FR-031, FR-032, US3 scenario 3 | The spec does not say what `value-text` does on an indeterminate bar (no `value`, or a `value` treated as absent): whether the value text is still exposed or suppressed. It also does not say whether a `value-text` the consumer set is kept when the value is clamped. | State both results in FR-031, and add them to US3-6 or as a new scenario. |
| SPEC-2-03 | note | spec.md FR-036, US3 scenario 7, SC-004 | FR-036 and US3-7 set the 3:1 non-text contrast only for light mode. Constitution III requires WCAG 2.2 AA in both themes, and 1.4.11 applies to the bar in dark mode too. SC-004 ("every non-text pair the four elements introduce ... in light and dark") does not name the pairs. It is also not stated whether the track must meet 3:1 against the ground. Without that, a determinate bar's full extent (and so the proportion it shows) may not be visible. | Name the dark-mode pairs (fill or its mark against the track and against the ground), and state whether the track's boundary has to meet 3:1 against each main ground. Add the dark theme to US3-7 or add a scenario for it. |
| SPEC-2-04 | note | spec.md US1 story ("a digest or path"), FR-003; constitution II ("digests are shown in groups of four") | US1 names a digest as a facts value, and constitution II requires digests to be shown in groups of four. FR-003 forbids the element to rewrite content, and US1-4 requires the copied text to be unchanged. The spec does not say who groups a digest shown in `ocelle-facts`. The triage record leaves digest grouping to the code block's digest mode (follow-on 2). | State that `ocelle-facts` does not group digests, and that the README says a digest in a value is grouped by the consumer's markup until follow-on 2's digest mode exists. Or remove "digest" from the US1 story. |
| SPEC-2-05 | note | spec.md FR-009, Edge Case "Facts at 200% zoom and 320 px" | "At 200% zoom" names no viewport, so no test can be set up from it. "200% zoom and 320 px" can be read as a 320 CSS px viewport or as a 640 px window at 200%. | Name the setup, for example "a 640 px window at 200% zoom (320 CSS px)", or drop the zoom clause, since the 320 CSS px case already covers WCAG 1.4.10. |
| SPEC-2-06 | note | spec.md US1, US2, FR-003, FR-023 | No scenario covers content that changes after the first render: an `ocelle-fact` added, removed or reordered; a `label` changed; an empty-state slot filled or emptied later (FR-023's "takes no space" then has to update). US3-2 covers this for progress only. | Add one scenario to US1 (add a pair, change a label: the grid and the description list follow) and one to US2 (fill an empty slot, then empty it: the gap appears, then goes). |
| SPEC-2-07 | note | spec.md Edge Cases (narrow width), FR-021 | The narrow-width edge cases cover the empty-state heading and body. They do not cover an actions slot with two or more buttons at 320 px, the common "primary and secondary action" case. | Add an edge case: at 320 px the actions wrap, keep their target size, and nothing overflows the element or the page. |
| SPEC-2-08 | note | spec.md Edge Case "Right-to-left" | "The facts columns mirror" appears only in an edge case. For progress, the matching rule is FR-038, but there is no FR or scenario for facts, so FR-052 ("every acceptance scenario") does not bring a test for it. | Add the RTL rule to FR-005 or add a US1 scenario under `dir="rtl"`. |
| SPEC-2-09 | note | spec.md FR-004, FR-005, operator decision SPEC-1-04 | FR-005's label column is sized to the widest label across all pairs. Each pair is its own `ocelle-fact` host, so the hosts need to share one grid track (for example through `display: contents` or subgrid on the hosts). That choice also changes how Chromium exposes the hosts, which affects FR-004. If the plan's research measures FR-004 with a structure the layout cannot use, the operator decides on the wrong evidence. | In the Issues paragraph or in FR-004's operator clause, say that the research measures FR-004 and FR-005 on the same structure and reports both to the operator. |
| SPEC-2-10 | note | spec.md FR-007, US1 scenario 3 | It is not said where `data-ocelle-wrap="anywhere"` may sit: on the `ocelle-fact` host or on a descendant of the value. If it is on the host, `overflow-wrap` inherits, so the label would also wrap anywhere. US1-3's "marked as an identifier (FR-007)" depends on that choice. | State that the policy applies to the value only, and name the places the marking is accepted (on a value descendant, on the host, or both), with the label unaffected. |
