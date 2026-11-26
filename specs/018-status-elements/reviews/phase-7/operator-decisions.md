# Phase 7 operator decisions

## Q-P7-1: a tdd-exempt.md for the records-only changes?

Phase 7 has a red commit (the README pins). tdd-check reads an exemption only while `red-commits` is empty.

**Decision: (a) no exempt file.** T064's text and notes.md record why there is none.

## Q-P7-2: the README intro correction beyond T063's listed scope

The implementer changed the intro from "twenty elements" to "twenty-three" and named the three status elements. Two red pins cover the change.

**Decision: (a) accept it as part of T063's README polish.**

## Fold, pull request and landing

The operator allowed this run to do three things after phase 7 is approved:
- fold phase 7;
- open a pull request for claude/007-status-elements;
- run /ocelle-land on it.

This replaces constraint 2 of the run command ("never open a PR") for this step only.
