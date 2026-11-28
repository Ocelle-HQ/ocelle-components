# Squad round 1: verify 1

| ID | Status | Reason |
|----|--------|--------|
| PLAN-A11Y-SECURITY-1-001 | resolved | Phase 2 and the quickstart require computed HTML text and SVG fill to match the two declared contrast tokens in both themes. They also require the contrast gate for that pair. |
| PLAN-CORRECTNESS-1-001 | resolved | The contract specifies 2.75rem on both axes. Phase 2 measures both controls at each root size against the resolved token, with 44 and 88 CSS px expected at 16 and 32 px respectively. |
| PLAN-CORRECTNESS-1-002 | resolved | Phase 2 names two standalone stories, identifies the spinner and disabled palette to show, and lists a light and dark baseline for each. |
| PLAN-FRESH-1-001 | resolved | The spec and contract reject a value containing any wholly default-ignorable cluster. Phase 2 exercises U+200B and U+2060, including an invisible cluster alongside a visible letter, and checks exact preservation of combining and joined examples. |
| PLAN-TESTABILITY-1-001 | resolved | Phase 2 checks the exact trimmed decomposed letter plus W and the joined emoji. On the same mounted host, each rejected input must remove the mark, restore ordinary rendering and preserve the action name. The list includes blank, overlong and internally separated inputs. |
