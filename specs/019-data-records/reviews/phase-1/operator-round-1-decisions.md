# Phase 1, review round 1: operator decisions

The verdict was changes_requested (round-1.md, 20e6d1c; `verdict.sh 1`). Asked as multiple choice.

## R1-01 (blocking): a caption that grows after the first measure

**Decision: (a) Fix it,** test-first. First a red shared body: a caption word grows at run time in an inline-block host, a `<dialog>` and a column flex, and the body expects what a fresh mount gives. Then the fix. README line 949 and research R-05 are corrected to match.

## Notes R1-03, R1-04, R1-06, R1-07

**Decision: Fix the notes too.**
- R1-03: correct T080's wording and its evidence.
- R1-06: correct the trigger plants.md names.
- R1-07: reattach the JSDoc to its export.
- R1-04: record in the fix record that two bodies arrived after their fix.

## R1-05: gaps in gate:mutation rule (c)'s own-path reading

**Decision: Accept the rule and note the gaps.** Keep the own-path rule as built, and record both gaps in the run's after-run notes as a gate follow-up:
- a file whose own type error the checker reports under another path passes silently;
- a single-mutant file whose error lands on another line of the same file gets a false exit 2.
