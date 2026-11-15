# Phase 5 notes: User Story 4, `ocelle-action-row`

## Status

Base cf52eb1 (`base.sh 5`; base.sha is committed with the red commit). Scaffold 5e3d44b (`scaffold.sh 5`: recorded,
no test touched): the `OcelleActionRow` class with no behaviour, so the red tests that import
`src/ocelle-action-row.ts` fail on their assertions, not on a missing module. The planner's 549409b (plan decision 30)
sits between the scaffold and the red commit. `red.sh` checks only the red commit's own diff (tests only), so
scaffold.sha needed no change. Docker was restarted by the coordinator after a container restart and was up
(`docker info` passed).

**Park and restore.** The phase first stopped before its red commit on the operator question below. During the
planner's run the coordinator parked my uncommitted draft (tests, element, token source) and restored it exactly
afterwards. `git status` showed the same files modified and untracked, and base.sha, scaffold.sha and notes.md were
back in reviews/phase-5/. I then reworked the draft to decision 30's structure.

**The draft beside the tests.** I wrote the element in the working tree beside the tests, to check that each red test
fails only for the missing behaviour and passes once the behaviour is there. Only the test files went into the red
commit; `red.sh` runs that commit in a separate worktree.

## Operator question 1 (stop-and-ask, resolved): a plan assumption that the measurement contradicts

**What was measured.** The draft runs in process (`vitest --project elements test/action-row.test.ts`, Chromium 156):
42 tests, 29 pass and 13 fail. In each of the 13 failing tests, the only difference from the expected value is one
serious axe violation, `label-content-name-mismatch`, at `#<row> >>> .control`. Every one of them is a page whose row
shows description or tag text (US4-3, US4-8 in both presentations and both themes, US4-12, US4-13, US4-14, US4-16,
US4-17, US4-18). Pages whose rows show only a title have no axe finding.

**Why.**
- The spec names the row exactly by its title (FR-034; R-05, PLAN-CORRECTNESS-1-002). The draft does this as R-05
  says: the inner control's `ariaLabelledByElements` is its own `[part=title]` wrapper.
- axe-core 4.14.0 reads that element reflection as the name. Its `getResolvedRefs` and `hasAriaValue` read the
  `ariaLabelledByElements` property, and setting the property also reflects `aria-labelledby=""` onto the inner
  control.
- The rule `label-content-name-mismatch` is tagged `cat.semantics`, `wcag21a` and `wcag253`, and is **not** tagged
  `experimental` in 4.14.0. 006's rule selection (`gates/lib/axe-rules.ts`) therefore runs it, in the element tests
  and in the story `axe` gate.
- The rule compares that name ("Mission 42") with the control's visible text ("Mission 42 Due Friday Blocked
  Design"). The visible text is read for on-screen visibility (`visibleVirtual(..., screenReader = false)`), so
  `aria-hidden` on the description and tags wrappers would not change it.
- R-05's statement "006's rule set does not run experimental rules, so `label-content-name-mismatch` never checks
  WCAG 2.5.3" is wrong for this rule and this axe version. Phase 3 already met the rule on the button, where the fix
  was content that matches the label.

So FR-034 (the name is exactly the title; the description and tags are inside the inner control, R-05 and R-10) and
FR-052 (axe reports no serious or critical finding on any story or test page) cannot both hold for a row that shows a
description or tags. The `axe: []` expectations of US4 cannot pass. The row stories with a description or tags
("card-free row with all slots" at least) would fail `gate:axe`. A consumer that runs axe on its own pages would see
the same violation on every described row.

**Options.**

- **(a) Record an exception.**
  - FR-052 gains an exception for the row: a row that shows a description or tags reports
    `label-content-name-mismatch`, because its description and tags are its accessible description, not its label,
    and its visible label, the title, is its name (WCAG 2.5.3 holds for the label).
  - The element-test bodies with a described row expect exactly `violation label-content-name-mismatch` at the row,
    as the empty-title edge case expects `button-name`.
  - Each affected story-theme node gets a `storybook/a11y-exceptions.json` entry with a Complexity Tracking row in
    012's plan and a sunset you set.
  - R-05 is corrected, and the README states it for consumers.
- **(b) Take the description, tags and trailing content out of the inner control.**
  - The inner control holds the icon and the title. The description, tags and trailing wrappers are shadow siblings
    drawn over the same grid cell with `pointer-events: none`, so every click still lands on the inner control. They
    are `aria-hidden`; the description reaches assistive technology only through `ariaDescribedByElements`.
  - axe then sees the title as the control's visible text, and the rows stay at 0 findings for consumers too.
  - This changes the structure of R-01, R-05 and R-10 (plan decisions 18 and 25 rest on it) and needs a planner
    update before the red commit.
- **(c) Name the row from all its content** (title, description, tags).
  - This reverses FR-034's "named exactly by its title" (US4-3) and the operator decision on SPEC-2-04. No exception
    is needed.
- **(d) Something else** that you state.

My recommendation is (b), if the planner confirms the structure, because it keeps 0 axe findings for consumers. (a)
is the smallest change for this phase.

**Operator decision at phase 5, 2026-11-15** (multiple choice): option (b). On the fork the planner then found, option
(c): the control (icon and title) and the sibling wrappers stay in one flex-wrap layout, and a positioned hit layer
inside the control fills the host. The planner recorded both as plan decision 30 in 549409b: spec FR-001, FR-034,
US4-3, US4-15 and the edge cases; research R-01, R-04, R-05, R-10 and R-12; the data model's shadow structure; tasks
T049a, T050, T053, T054 and T056 to T058.

## Spike T049a and one deviation from decision 30's wording

The results are in spike.md. Checks (1) to (4) hold as written. Check (5) does not hold with the hit layer at
`z-index: -1`: axe-core 4.14.0 gives every title, description and tag text a serious `color-contrast` incomplete
result (`bgOverlap`), because its element stack puts `span.hit` above the text.

I kept decision 30's painting and hit-testing order and changed only how it is reached:
- the hit layer is at `z-index: 0` in the layout wrapper's stacking context (`div.layout`:
  `position: relative; z-index: 0`, instead of `isolation: isolate`);
- the icon wrapper, the title and the siblings are at `position: relative; z-index: 1`.

The layer still paints beneath the title and every sibling. It is still the topmost hit target outside the icon and
the title, since the siblings take no pointer events. With this, axe gives 0 results of any impact on every page of
check (5). I took this as a variant within decision 30, not a result against it, because the decision's three stated
properties (painted beneath, takes every click, axe clean) all hold. The plan, the data model and T056 still say
`z-index: -1` and `isolation: isolate`. If the reviewer or the operator reads the wording as binding, the planner
should change those words to the measured variant.

A second detail, also found while measuring: under forced colours the hit layer sets `background-color: Canvas`, as
`a.control` does in `controlStyles`. Without it, axe read the dark palette's text over an unknown (white) background
and reported `color-contrast`. The forced-colours table of R-12 already maps backgrounds to `Canvas`.

## Other draft findings (test corrections before the red commit, not questions)

- The pages put their native "before" and "after" buttons at the minimum target (`nativeRules`), so axe's
  `target-size` has nothing to report beside the block-level rows.
- The hover bodies compare geometry relative to the host. A hover scrolls the page, which moves every box alike.
