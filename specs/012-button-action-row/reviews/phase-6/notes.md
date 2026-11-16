# Phase 6 notes: User Story 5, row states and the card layout

## Status

- **Base.** 89a1369, recorded by `base.sh 6` in base.sha. base.sha is untracked and goes in with the red commit.
- **Environment.** Docker was up (`docker info` passed), so no restart was needed.
- **Draft.** I wrote T064's behaviour as a draft of `src/ocelle-action-row.ts` in the working tree, so the spike could
  measure it. That draft is not committed. It also brings the header comment and the `@csspart control` description
  in line with decision 30 (phase 5 review R1-01).
- **Not started.** No test, scaffold or red commit exists yet.

The phase stopped at spike T060 on the question below.

## Operator question 1 (stop-and-ask): axe `color-contrast` on unavailable rows

**What was measured** (spike.md check (4)). On a current row with every slot, the plain, hovered and focused states
give 0 axe results of any impact in light and dark, default and chrome, default and flush. US5-4 holds: there is no
`color-contrast` incomplete result over the hit layer.

The **unavailable** state does not hold. Every unavailable current row gets one serious `color-contrast` violation,
on the slotted description and tags only. A wider probe of 72 unavailable pages gave the same violation on 52 of them:
- every unavailable current row;
- every unavailable flush row off canvas and sheet;
- every unavailable chrome row.

**Why.**
- axe-core 4.14.0 skips `color-contrast` for text that has `aria-disabled="true"` on it or on an ancestor. The title
  is inside the inner control, which is `aria-disabled` when the row is unavailable, so axe skips it.
- Since plan decision 30, the description, tags and trailing wrappers are siblings of that control, not inside it.
  So axe checks their `--ocelle-color-disabled-ink` text (US5-7, R-10 § Sibling ink) as active text.
- That ink is below 4.5:1 on several surfaces, for example `accent-low` (4.27:1 light, 3.75:1 dark) and
  `chrome-hover` (3.04:1 light).
- WCAG exempts inactive components, and FR-042 records the exemption, but axe cannot tell that these siblings belong
  to the inactive control.

So T060 ("no violation and no incomplete result" for the unavailable state), FR-052 and T063 (0 serious or critical
results on the "unavailable current" story) cannot all hold on decision 30's model as written.

**Options.**

- **(a) Recommended. Mark the sibling wrappers `aria-disabled` while the row is unavailable.**
  - The description, tags and trailing wrappers get `aria-disabled="true"` while `unavailable` is set. They are
    already `aria-hidden` and have no accessibility node.
  - axe then treats their text as part of the inactive control, as WCAG and FR-042 already do.
  - Measured (spike.md, the variant):
    - all 72 unavailable pages give 0 axe results of any impact, with no `aria-allowed-attr`;
    - the accessibility tree, name, description, disabled state, focusability and `aria-current` are unchanged in
      both modes.
  - Wording changes: decision 30 (or a new decision 31), data-model.md § Shadow structure, R-10 § Sibling ink and T064
    each gain one sentence. T061 gains the axe check on unavailable rows with description and tags, with a plant: the
    wrappers without `aria-disabled`.
  - No principle is relaxed and no exception is recorded.
- **(b) Keep the siblings in their available ink while the row is unavailable.** Only the title takes the disabled
  ink; the description and tags stay `ink-soft` (or `chrome-muted` on chrome). This changes US5-7 ("its title and
  description use the disabled ink token") and R-10 § Sibling ink, and weakens the unavailable look.
- **(c) Record an FR-052 exception.** `storybook/a11y-exceptions.json` entries for the description and tag nodes of the
  unavailable stories, with a Complexity Tracking row and a sunset that you set. Consumers' pages would show the same
  serious finding on every unavailable row that has a description or tags.
- **(d) Something else** that you state.

**A reading to confirm at the same time (decision 16).** For a row that is both unavailable and current, I read "the
unavailable look wins (disabled ink, no hover), and the current bar stays drawn (in disabled ink)" as follows:
- the current surface (`accent-low`, or `chrome-hover` on chrome) stays;
- the ink and the bar are disabled;
- there is no hover.

The other reading is that the surface drops to the idle surface (`sheet`). Tell me if you want that one.
- (i) The surface stays `accent-low`. This is my reading and what the draft does.
- (ii) The surface becomes the idle surface.

**Operator decision at phase 6, 2026-11-16** (multiple choice): option (a), and reading (i). The planner recorded both
as plan decision 31 (babcfb3). The same answer routed a finding from mission 018 to this phase:
- `ocelle-button` set `:state(pressed)` in link mode, though FR-009 forbids `aria-pressed` on a link;
- the operator chose "fix in phase 6": a link has no pressed state;
- the planner recorded it as plan decision 32 (565acb6) and added tasks T061a and T064a.

**Park and restore.** The coordinator parked my uncommitted draft while the planner ran and restored it exactly
afterwards. The draft was `src/ocelle-action-row.ts`, with the T064 draft and the R1-01 header fixes, plus base.sha,
spike.md and notes.md. `git status` afterwards showed the same modified file and the same untracked directory. The
planner's two commits sit between the base 89a1369 and the red commit and change only specs/. `red.sh` checks only
the red commit's own diff.

**Also, T067 cannot be done in this run.** T067 pushes the branch and records a CI run. Pushing is outside my
permissions here, so T067 will stay open for whoever may push.
