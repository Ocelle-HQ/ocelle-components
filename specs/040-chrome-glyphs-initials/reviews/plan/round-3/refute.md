# Squad round 3: refute

| ID | Verdict | Kind | Decision | Reason |
|----|---------|------|----------|--------|
| PLAN-FRESH-3-001 | confirmed | fix | - | U+2800 survives trimming, segments as one grapheme, and passes the FR-003 character checks in Node. DejaVu Sans maps it to a glyph with zero contours. A lone blank cell therefore activates the plate without the legible initials SC-002 requires. Treat a cluster consisting solely of Braille Pattern Blank and default-ignorable characters as blank, and cover the transition from visible initials to this input. |
