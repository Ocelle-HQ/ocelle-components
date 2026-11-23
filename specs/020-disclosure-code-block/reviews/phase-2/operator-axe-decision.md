# Operator decision: T021a axe stop

Date: 2026-11-21. Operator: jeroennouwsdev. Source: `reviews/phase-2/axe-unnamed-scroll.md`.

## Finding

The axe gate reports one result on every overflowing scroll code block, in light and dark, whether the block is
labelled or not: rule `color-contrast`, an incomplete result of serious impact, target `.code`, message
`elmPartiallyObscured`. The cause is the text clipped in the scroll box, not the missing name. No rule fires on the
unnamed tab stop. `storybook/a11y-exceptions.json` already holds 10 entries of this kind for the Prose document's
wide-table scroll box.

## Answer

**Add exceptions and keep the story.**

- Add `color-contrast-incomplete` exception entries for each overflowing scroll story and each theme, following the
  Prose precedent and using the same sunset ("the op that fixes the color-contrast incomplete results ...").
- The unnamed block raised no naming finding, so T028 adds the `ScrollUnlabelled` story and its story test, and the
  state leaves plan.md's Complexity Tracking row.
- Before T028, the planner records the following in a documentation commit of its own:
  - the measured result in research R-09 and spec FR-050;
  - the exception entries T028 adds.
