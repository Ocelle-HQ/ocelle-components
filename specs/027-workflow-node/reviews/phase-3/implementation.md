# Phase 3 implementation evidence

- Base `5cd17445bbe9cad02200548885d1e15ddfbc946a`
- Test-only red `ef5acce09c4e715ddc20e973003be87673937a4a`

`red.sh 3 phase` took 12.586 seconds wall and recorded four named assertion failures. The source
Chromium and built strict-CSP suites each exercised two inspection cases. The absent status slot
failed both placements before any browser driver needed to resolve it.

The native slot sits in the step details outside the button. Native slot distribution supplies the
button's description with the actual host content and updates it when that content changes. The green
tests read the computed accessible description after adding, replacing, editing, emptying and removing
status. They confirm that outcome and status clicks request zero selections. Pointer, Enter and Space
each send the same stable ID and preserve the original host data and status. The isolated source tests
also rejected a renamed slot and a slot moved inside the action. The isolated green fixture loads and
restores the token sheets so its pointer target remains stable even when only inspection cases run.

The serialized green run passed all 1,224 tests in nine behavior and inventory files, including all 43
workflow-node cases. The separate package export test passed. Typecheck, test lint, the token checks
and the built package CSP gate passed. The manifest gate found 42 valid elements.

## Storybook and affected Plants

The read-only inspection story has a pinned light and dark pair. Both Docker captures agreed for all
18 workflow-node story-themes. The 16 previous baseline files matched the existing bytes, and axe
reported zero serious, critical or incomplete findings in all 18 cases.

Storybook contains exactly 335 stories and 670 baselines. The eight manifest overlays carry the new slot
with their original intended findings and key order. The empty-index overlay still holds an empty index.
The visual token plant retains its earlier 287 findings and adds the one measured light-theme difference
for read-only inspection. The corresponding dark image matched its baseline in both pinned captures.

The phase-base selector found 21 of 317 affected plants and judged none with `--list`. The manifest
overlays and empty-index fixture passed their local probes. T013 remains open for the exact hosted
mutation, Plants and required CI outcomes, and the timing comparison with issue #74.
