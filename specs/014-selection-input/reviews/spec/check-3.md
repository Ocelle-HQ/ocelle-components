---
check: 3
verdict: issues
---

# Spec check 3

Inputs read: `specs/014-selection-input/spec.md` (after commit `6f01044`, "fixes for check 2"),
`checklists/requirements.md`, `reviews/spec/check-1.md`, `check-1-fixes.md`, `check-2.md`, `check-2-fixes.md` and
`.specify/memory/constitution.md`. No `[NEEDS CLARIFICATION]` marker is left. No requirement conflicts with a
constitution principle. The spec still names no I/O other than FR-047's navigation, no raw style value, no `sk-` name
and no monospace.

**Earlier check.** Both blocking findings of check 2 are resolved as the fix note says.

- SPEC-2-01: FR-011 now gives one focus target for all three parents: the next enabled child after it, else the
  nearest enabled child before it, else focus leaves as the browser does. It states that this target equals FR-011a's
  selection target in tabs and the segmented choice. US1 scenario 14 has the worked example (`beta` removed, focus to
  `delta`), and US2 scenario 18 says focus and selection land together.
- SPEC-2-02: FR-010 says that setting the current value is always a no-op and wins over the other clauses. US1
  scenario 18 covers the disabled selected `gamma`.

Both operator answers are recorded and carried through:

- Q1 (b): FR-010a, US1 scenario 19, US2 scenario 19 and US3 scenario 16.
- Q2 (b): FR-046, FR-049 and US5 scenario 13.

The new FR-010a overlaps the fallback rules that already pick a child without user action, and the spec does not say
which rule wins (SPEC-3-01). That is the one blocking finding.

| ID | Severity | Where | Finding | Fix |
|----|----------|-------|---------|-----|
| SPEC-3-01 | blocking | spec.md FR-010a, FR-011a, FR-021, FR-027, FR-010 ("on first render … the first enabled child"); US2 scenario 18, US2 scenario 19, US3 scenario 16 | When tabs or the segmented choice pick a child without user action, FR-010a and the "first enabled child" fallbacks can name different children. FR-011a says: "when a child becomes enabled again, the first enabled child is selected". FR-021 and FR-027 say: "on first render with … a `value` no enabled tab has, the first enabled tab". FR-010a says that when a child with the remembered value "becomes enabled and present", it is selected. Take the case Q1 (b) was asked for (SPEC-2-03). A framework host sets `tabs.value = "tasks"` on an empty `ocelle-tabs`, then appends `Spec`, `Plan` and `Tasks` in one operation. FR-011a and FR-021 select `Spec`; FR-010a selects `Tasks`. The same split happens when every tab is disabled, a value is remembered, and the host enables `Spec` and `Tasks` in the same task. The scenarios only add the matching child alone, to a parent that already has a selection (US2 scenario 19, US3 scenario 16), so they never meet the conflict. It is also not stated whether a parent with no children counts as "no child is enabled" under FR-011a, or whether its first children count as "first render" under FR-021 and FR-027. | Every time a parent picks a child without user action, a remembered value should take precedence: on first render, in FR-011a's fallbacks, and when a child becomes enabled after none was. Pick the first enabled child with the remembered value if one is present, else the rule's own target. This follows the operator's wording "when a matching enabled child appears, the parent selects it". State it in FR-010a, and refer to it from FR-011a, FR-021 and FR-027. Add a scenario to US2 and US3: on an empty parent, the host sets `value = "tasks"`, then appends all children in one operation. The result is that `Tasks` is selected, its panel is shown, it is the tab stop, and no event is emitted. State that a parent with no children falls under FR-011a's "no child is enabled". |
| SPEC-3-02 | note | spec.md FR-011, FR-011a, FR-016, US1 scenario 18 | FR-011 moves focus only when the focused child is removed. FR-011a moves focus only when the selected or pressed child becomes disabled. No rule covers a focused child that is not selected and becomes disabled, which can happen in the listbox, in tabs after a host set (US2 scenario 13) and in the segmented choice. The listbox case of a focused and selected option that becomes disabled is not covered either: US1 scenario 18 keeps it selected but does not say where focus goes. Focus could stay on the disabled child, from where arrows still move, or move as for a removal. | State the focus outcome when the focused child gains `disabled`. For example, focus stays and the next arrow key moves from it, or it moves as FR-011 does for a removed child. Add the listbox case to US1 scenario 18. |
| SPEC-3-03 | note | spec.md FR-011, US1 scenario 14 | "Reordered" is listed beside "added" and "removed". In the DOM, reordering is a removal and an insertion, and Chromium blurs a focused element that is removed. The spec does not say what happens when the focused or selected child is moved within its parent. Focus could stay on the moved child or move as for a removal. In the listbox, the selection could stay or be lost: US1 scenario 14 says `value` becomes `""` when the selected option is removed. A host that sorts the folder list would see the difference. | State that moving a child within its parent keeps its selected or pressed state. Also state whether focus stays on it or follows FR-011. |
| SPEC-3-04 | note | check-2.md SPEC-2-05 to SPEC-2-14; check-1.md SPEC-1-13 to -16, -19, -20, -22 to -27 | The check-2 fix note leaves these notes open, and the spec is unchanged for them. Two would fail a gate if the plan leaves them out: SPEC-1-16 (axe `target-size` on short option and tab rows) and SPEC-1-14 (`color-control-border` on `--ocelle-color-inset` is 2.80:1). SPEC-2-07 also touches FR-046 directly, and FR-046 was just edited. An Alt-click with `href` is a plain activation, but Chromium's default for it is a download, not a navigation. | The plan answers each one in its decisions or research, or the next spec fix closes them. For SPEC-2-07, state the expected outcome of an Alt-click with `href` in US5 scenario 13. |

## Operator questions

None.

## Counts

- blocking: 1 (SPEC-3-01)
- operator: 0
- note: 3 (SPEC-3-02 to SPEC-3-04)
