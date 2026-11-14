# Operator decisions at the tasks gate (2026-11-13, human:jeroennouwsdev)

Analysis: `specs/013-data-display/analysis-report.md` (1 critical, 1 high, 8 medium, 8 low, coverage 100).

- **Saving refused profile records:** "Save verbatim, always". When the environment refuses a profile's write of its
  own record, the orchestrator saves the profile's text verbatim and commits it alone, with the commit message saying
  so. It does not ask again and never edits the content. The analysis report was saved this way.
- **C1 (critical, story-less states):** "Record exception row". Add a Complexity Tracking row for the three states
  with no story: the unnamed progress, the progress named by a host `aria-label`, and `ocelle-fact` outside
  `ocelle-facts`. The row gives scope, rationale and a sunset (for example, when axe reads ElementInternals ARIA), and
  is approved by the operator with this decision. FR-050 names the host-`aria-label` exclusion.
- **I1 (high, `sk-` strings in tests):** "Roles, not sk- names". The README mapping table holds the `.sk-*` names (the
  `prefix` gate skips Markdown). The readme tests assert mapping rows keyed by role names, for example "facts
  compact", without any `sk-` string in test code.
- **Tasks gate:** approve, on the condition that the planner resolves C1, I1 and the medium and low findings with these
  answers before implementation.

## Second tasks gate (2026-11-14, human:jeroennouwsdev)

After the input decisions, the second analysis (`analysis-report.md`, head d221dd5) found 0 critical, 1 high, 5
medium and 6 low, with coverage at 100. Decision: "approve + fix all". The planner fixes I1, the five medium findings
(I2, I3, G1, G2) and the six low findings before implementation. The fixes are
wording and added test bodies only, with no new surface. The flow then stops before implementation.
