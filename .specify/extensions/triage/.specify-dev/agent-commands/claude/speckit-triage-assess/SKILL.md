---
name: speckit-triage-assess
description: Triage GitHub issues with the triage-tara profile and write a triage record; change no code
compatibility: Requires spec-kit project structure with .specify/ directory
metadata:
  author: Ocelle-HQ
  source: triage:commands/speckit.triage.assess.md
---

# Triage Issues

Decide what kind of work the given issues are, and how much belongs together, before any mission or op starts.

## User Input

```text
$ARGUMENTS
```

Issue numbers (`#4 #5`, `4, 5`) and optionally a note from the operator. No issue number: stop with an error.

## Steps

1. Run the assessment as the **triage-tara** agent profile: delegate to the `triage-tara` subagent when your
   environment can, passing the issues and the note; otherwise read `.claude/agents/triage-tara.md` and follow it
   yourself, exactly.
2. Make sure the result is one triage record in `triage/`, committed alone, with every frontmatter key the profile
   lists, `status: proposed`, and `spec_prompt` on one line.
3. Change nothing else: no code, no spec, no GitHub comment, label or state change.

## Report

The decision, the issues in and out of scope, and the record's path.