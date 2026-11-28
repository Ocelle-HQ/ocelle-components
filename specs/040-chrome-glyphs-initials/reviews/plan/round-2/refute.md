# Squad round 2: refute

| ID | Verdict | Kind | Decision | Reason |
|----|---------|------|----------|--------|
| PLAN-FRESH-2-001 | confirmed | fix | - | The Node probe reproduced the claim for U+0007 and U+0000. Each survives trimming as one grapheme cluster and matches neither whitespace nor Default_Ignorable_Code_Point. FR-003 therefore selects the initials presentation for a string with no readable initial, contrary to SC-002. Reject a trimmed value containing a Cc character and cover a live assignment that restores ordinary rendering and preserves the action name. |
