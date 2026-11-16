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

## Red run

`red.sh 6 phase` on 14ca8d5 reported `tests_only: true`, `red: true`, `recorded: true`: 109 of 3824 tests failed
(red-phase.log). Every failure is the missing behaviour:
- assertion mismatches on the absent current mark, unavailable state, link-row cancel and modifier handling, card
  layout, wrapper `aria-disabled`, reflection and US2-12's link-mode pressed state;
- the driver's own `no .bar in the shadow root` on a row that draws no bar (as phase 4's `no .spinner svg`);
- the README, CHANGELOG and manifest tests, the eleven story tests (stories not built yet) and the pinned counts.

There was no import, syntax or setup error; I grepped the log for `Cannot find`, `SyntaxError`, `Failed to load` and
`Failed to resolve`.

A draft run of the whole suite before the red commit, with the code beside the tests, passed: 3824 tests in 152 files.
So no pin was missed. The pinned counts in the red commit are:
- 72 stories (`storybook-build`);
- 144 story-themes (`visual`, three places, and `axe`);
- 146 axe plant-repo runs;
- 144 baselines (`plant-repo`).

The manifest stays at 4 elements, and no token or contrast pair changed.

**US2-12 replaced by a stricter test** (constitution VIII; plan decision 32, operator decision at phase 6). The phase 3
test asserted `:state(pressed)` on a link-mode host. FR-009 forbids `aria-pressed` on a link, and the operator ruled
that a link has no pressed state.
- The link-mode host `lp` now matches no `:state(pressed)` in `set`, `off`, `again` and `empty`.
- A new step checks that a button-mode host stops matching once `href` is set, and matches again once it is removed.
- readme.test.ts's custom-states sentence gains "in button mode".

These two are the only changes to existing tests, as authorised.

## Green notes

- **Card grid without raw numbers.** Style-lint (token-only) rejects raw grid numbers (`grid-row: 1`,
  `minmax(0, 1fr)`). The card grid uses names only: `grid-template-areas: "title trailing"`,
  `grid-template-columns: [full-start] 1fr auto [full-end]` and `grid-column: full`. Strings, identifiers and `fr` are
  already allowed, so no new allowance was needed.
- **A cancelled activate event and the click.** The row calls `preventDefault()` on the originating click in both
  modes, as the button does (FR-023). That cancels a link's navigation and changes nothing visible on a `<button>`.
- **Manifest plants' copies.** The eight copies of `custom-elements.json` under `gates/plants/manifest/*/tree` were
  regenerated from the new manifest with each plant's own defect reapplied:
  - `fail-lost-attribute` with its attribute removed;
  - the six `fail-undescribed-*` plants with their extra module;
  - `pass-reordered` with its keys reversed.
  The script first reproduced the old copies byte for byte from the old manifest. `break-not-json` is unchanged.
- **T068.** The figures in `gates/README.md` and in 006's Complexity Tracking row are corrected for the repository's
  72 stories after 012:
  - about 588 s per size-1 `visual` shard;
  - 4 stories of headroom to the split count of 76;
  - about 11.9 Plants runner-hours per CI run (73 × 588 s).
  **The operator's request (operator decision at phase 2, plan decision 15, research R-13):** when this feature lands,
  open a triage record for a plant design whose shard time does not grow with the repository's story count.

## Visual baselines

The 22 row baselines (`elements-ocelle-action-row--*`, 11 stories in light and dark) were written only by
`OCELLE_VISUAL_ENGINE=docker pnpm run visual:update` in #10's pinned container.
- The first run reported "wrote 22 files (22 added, 0 changed, 0 removed)".
- A second run after the card-grid style-lint change wrote nothing ("0 files").
- The "card with many tags" story then got more tags, so that it wraps in the 1280 px frame. Its two baselines were
  rewritten by the same command ("2 changed").

No baseline was hand-edited. No podman cross-engine check was possible in this environment; CI confirms the
baselines at landing.

## Gate runs (T066), on cf36bbf

- **Element plants:** plants.md. Every plant bit.
- **`gate:storybook-build`:** 72 stories.
- **`OCELLE_VISUAL_ENGINE=docker gate:visual`:** 144 captures match (docker only: no cross-engine comparison).
- **`gate:visual` under load:** 16 `yes > /dev/null` processes, three runs, each "144 captures match".
  - A count taken one second after `pkill -9 -x yes` still showed 16. A second `pkill -9 -x yes` and a later
    `pgrep -x yes` showed 0 left.
- **`gate:axe`:** 144 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted, the Prose
  document's). So the current, unavailable, unavailable current and card stories with description or tag text are at
  0 findings (T063, decisions 30 and 31).
- **`gate:plants`, shard by shard:** `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard <k>`, one at a
  time. All 76 shards report "every plant as expected".
  - Shards 1 to 3 judged 77, 76 and 76 other plants, in 128 s, 107 s and 101 s.
  - The visual shards took about 180 to 197 s each and the axe shards about 118 to 123 s.
  - The slowest was shard 40 (`visual/fail-token-changed`), 234 s.
  - 11,121 s in all, and no shard near 10 minutes.
  - The first background loop reached its two-hour limit during shard 45. A second loop ran shards 45 to 76; the
    summary counts each shard once.
- **Whole suite, `pnpm test`, with docker up:** 3824 tests passed in 152 files.
- **Static gates, all pass:**

  | Gate | Result |
  |---|---|
  | `gate:typecheck` | no type error |
  | `gate:lint` | 290 files, no finding |
  | `gate:test-lint` | 196 files, no finding |
  | `gate:style-lint` | 16 files, no finding |
  | `gate:csp` | 14 files, no finding |
  | `gate:prefix` | 310 files, no finding |
  | `gate:pins` | 5 manifests, no finding |
  | `gate:manifest` | 4 elements, no finding |
  | `gate:contrast` | 198 pairs in light, 206 in dark, 187 required per theme |
  | `gate:brand-rules` | 7 rules checked |
  | `gate:config-copies` | identical |
  | `gate:signoff -- --range 89a1369..HEAD` | 4 commits, no finding |

- **`gate:mutation -- --base 89a1369`: fails, with 1 surviving mutant.** 77 mutants on the changed lines of 2 files
  (`src/ocelle-action-row.ts`, `src/ocelle-button.ts`); 0 timeouts, 9 compile errors, 0 zero-mutant entries; 334 s.
  See the operator question below.
- I did not run tdd-check; the review step runs it.

## Operator question 2 (stop-and-ask): a mutant that survives the red tests

The survivor is in `src/ocelle-action-row.ts:624`:

```ts
if (linkHref(this.href, document.baseURI) !== undefined && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)) return;
```

It is `ConditionalExpression: replaced by true`, which drops the link-mode check, so a Ctrl, Meta, Shift or Alt click
on a **button-mode** row would dispatch no `ocelle-action-row-activate`. The data model says a button-mode row
dispatches on any click ("any click in button mode, which Enter, Space and `row.click()` produce"), and FR-033 limits
the modifier exception to link mode. No test of the red commit clicks a button-mode row with a modifier held. So the
mutant is observable, not equivalent.

Options:
- **(a) Recommended.** One in-process test, in its own signed-off test commit, recorded here as a test added after
  the red commit for a survivor (as phases 2 and 5 did). A Ctrl, Meta, Shift and Alt click on a button-mode row each
  give one `click` and one `ocelle-action-row-activate`. No existing or red test would change. Then run
  `gate:mutation -- --base 89a1369` again.
- **(b)** Add no test, and record the survivor for the reviewer as a known gap (it is not equivalent, so the review
  would treat it as blocking under constitution VIII).
- **(c)** Something else that you state.

T066 stays open until the mutation gate passes, and T067 stays open because it needs a push.

**Operator decision at phase 6, 2026-11-16: option (a).** The operator authorised one separate signed-off test
commit with one in-process test, changing no existing test and no source.

Applied:
- **c6eb589** (test), in `test/action-row.test.ts`, checks that a Ctrl, Meta, Shift and Alt click on a button-mode
  row each give exactly one `click` and one `ocelle-action-row-activate`.
  - It passes on the code.
  - With the mutation applied by hand (the link-mode check replaced by `true`), it fails.
  - No existing test changed.

After it:
- `gate:mutation -- --base 89a1369`: **pass**. 77 mutants on the changed lines of 2 files (`src/ocelle-action-row.ts`,
  `src/ocelle-button.ts`), none survived; 0 timeouts, 9 compile errors, 0 zero-mutant entries, 0 equivalent records;
  334 s.
- Whole suite, `pnpm test`: **3825 tests passed in 152 files**.
- `gate:typecheck` and lint on the test file: pass.

T066 is done. T067 stays open: it needs a push and a CI run.
