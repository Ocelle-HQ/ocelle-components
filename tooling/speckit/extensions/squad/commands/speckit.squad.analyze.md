---
description: "Run /speckit-analyze's cross-artifact analysis unchanged and save the report as analysis-report.md"
---

# Analyze and Save the Report

Run the cross-artifact analysis of spec, plan and tasks exactly as `/speckit-analyze` defines it, then save the
report so the tasks gate (and anyone later) can read it. The only difference from `/speckit-analyze` is that the
report is written to a file and committed. **Change no spec, plan or task file.**

## User Input

```text
$ARGUMENTS
```

No input is needed.

## Steps

1. Read the `/speckit-analyze` command (for Claude Code: `.claude/skills/speckit-analyze/SKILL.md`) and follow its
   steps 1 to 7 exactly: prerequisites, loading the artifacts, the semantic model, every detection pass, severity
   assignment, the report structure and the next actions. Constitution conflicts stay CRITICAL. Skip its step 8
   (offering remediation) and run its step 9 (hooks) as written.
2. Write the report to `FEATURE_DIR/analysis-report.md`, replacing any earlier one (git keeps the history), with
   this frontmatter above the report exactly as `/speckit-analyze` formats it:

   ```markdown
   ---
   analyzed_at: <ISO 8601 UTC>
   head: <git rev-parse HEAD>
   critical: <count>
   high: <count>
   medium: <count>
   low: <count>
   coverage: <percentage of requirements with at least one task, a number>
   ---
   ```

   The counts must equal the rows of each severity in the findings table.
3. Commit only that file: `docs(analyze): <feature> — <critical> critical, <high> high`, signed off. Do not push.

## Report

The counts per severity, the coverage, and the next actions.
