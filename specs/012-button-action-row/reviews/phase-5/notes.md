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

## Red run

`red.sh 5 phase` on df9dcc7 reported `tests_only: true, red: true, recorded: true`: 192 of 3715 tests failed
(red-phase.log). Every failure is the missing behaviour:
- assertion failures on the row's absent rendering, events, AX and look;
- the drivers' own errors on the scaffold's empty shadow root (`no .hit in the shadow root`, `axState: #r has no
  shadow root`, `empty`), as phase 4's `no .spinner svg`;
- the token tests on the missing `focus-offset-inset` (expected table, stylesheet, the six theme conditions, the shape
  story);
- the contrast, README, CHANGELOG, manifest, build and story tests, and the pinned counts.

One knock-on failure: `gates/test/integration/vitest-mutation-config.test.ts` "starts source-table.test.ts first …"
expects more than one started module. At the red commit `source-table.test.ts` itself fails on the missing token, so
the ordered run stops after it. It passes once the token exists (the whole suite below).

Pinned counts written in the red commit:
- 61 stories (`storybook-build`);
- 122 story-themes (`visual`, three places, and `axe`);
- 124 axe plant-repo runs;
- 122 baselines (`plant-repo`);
- 4 manifest elements (unit and integration);
- contrast: 198 pairs in light and 206 in dark, 187 required per theme, 374 required pairs in all;
- 404 pair-list entries;
- the robustness variants at 198/199 and 206 pairs.

A draft run of the whole suite before the red commit found one pin I had missed, the 394 → 404 pair-list entries.
It went into the red commit with the others, so no pin changed after the red commit.

## Visual baselines

The 26 row baselines (`elements-ocelle-action-row--*`, 13 stories in light and dark) and the two `tokens--shape`
baselines were written only by `OCELLE_VISUAL_ENGINE=docker pnpm run visual:update` in #10's pinned container: "wrote
28 files (26 added, 2 changed, 0 removed)". The `tokens--shape` baselines changed by design, because the shape story
now lists `focus-offset-inset`. I checked the baselines with `gate:visual`: 122 captures match, "docker only: no
cross-engine comparison". No podman cross-engine check was possible in this environment; CI confirms the baselines at
landing. No baseline PNG was hand-edited or hand-picked.

Under load (16 `yes > /dev/null` processes), `OCELLE_VISUAL_ENGINE=docker pnpm run gate:visual` ran three times, and
122 captures matched each time. The first `pkill -x yes` left the 16 processes running. They were killed with
`pkill -9` afterwards (0 left).

## Gate runs (T059)

- `gate:typecheck`, `gate:lint` (289 files) and `gate:test-lint` (195 files): pass.
- `gate:style-lint` (16 files), `gate:csp` (14 files), `gate:prefix` (233 files) and `gate:pins` (5 manifests): pass.
- `gate:manifest`: 4 elements, no finding.
- `gate:contrast`: 198 pairs in light, 206 in dark, 187 required per theme. `gate:brand-rules`: 7 rules, 0 findings.
- `gate:storybook-build`: 61 stories. `gate:visual`: 122 captures match.
- `gate:axe`: 122 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted, the Prose document's).
  So every row story with description or tag text ("All slots", "Busy", "Hovered", "Right to left", "Chrome" and the
  grounds) is at 0 findings (T054, decision 30).
- Element plants: plants.md. Every plant bit.
- `gate:plants`, shard by shard (`OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard <k>`, one at a time):
  all 76 shards "every plant as expected".
  - Shards 1 to 3 judged 77, 76 and 76 other plants, in 111 s, 93 s and 87 s; the manifest plants' copies gained the
    row's module first (8f78754).
  - The slowest shard was 40 (`visual/fail-token-changed`), 190 s.
  - The visual shards took about 145 to 153 s each and the axe shards about 76 to 78 s.
  - 8417 s in all, and no shard near 10 minutes.
  - The first background loop reached its two-hour limit during shard 61. I ran shards 61 to 76 again in a second loop;
    the summary counts each shard once.
- `gate:mutation -- --base cf52eb1`: **fails, 17 surviving mutants**. 198 mutants on the changed lines of 3 files; 3
  timeouts (the `MutationObserver`'s options and constructor call), 36 compile errors, 1 zero-mutant entry
  (`src/index.ts`), 1 equivalent record (the `label` options, as on the button). 542 s. See the operator question
  below.

- Whole suite, `pnpm test` on 5b0917c (docker up): **3715 tests passed in 152 files**.

## Operator question 2 (stop-and-ask): mutants that survive the red tests

Every survivor is in `src/ocelle-action-row.ts`. Each one is behaviour that no test of the red commit observes:

| Line | Code | Mutants that survive | What no test observes |
|---|---|---|---|
| 421 | `if (references.some(...)) this.#resolve();` in the moved-attribute callback | always true; `!==` | the condition is redundant: resolving on every moved change gives the same result |
| 444 | `this.#text.observe(this, { characterData: true, ... })` | `characterData: false` | text written into the data of a slotted element's existing text node (the red tests replace children, a child-list change) |
| 456, 457 | `this.#resolve(); this.requestUpdate();` in `connectedCallback` | each call removed | a row whose `aria-labelledby` is moved before it is connected, or that is moved into another tree |
| 468 | `assignedElements({ flatten: true })` | `{}`; `flatten: false` | a description forwarded through another shadow root's slot |
| 495, 497 | the name helper's labelledby check and its empty-label check | each condition false; the `""` literal changed | the inner control's `aria-label` attribute: Chromium's name is the same either way (labelledby wins; an empty `aria-label` is ignored) |
| 517 | `.end ?hidden=${!tags && !slots.trailing}` | five variants | the end group's own gap: an empty but shown end group widens a shrink-wrapped row by 8 px; and a row with tags but no trailing icon |
| 528, 531 | `length === 0 ? null : list` for `ariaLabelledByElements` and `ariaDescribedByElements` | always the list | an empty list reflects `aria-labelledby=""` or `aria-describedby=""` onto the inner control, with the same name and description |

The fix I prepared needs new tests after the red commit; I added none.
- New tests: in-process tests of exactly these observables, added to `test/action-row.test.ts` in a separate signed-off
  test commit. No red test would change. They cover: the inner control's empty ARIA attributes; a text node's data
  written; a forwarded description; a row moved before and after connection; a shrink-wrapped title-only row's exact
  width; a row with tags and no trailing icon.
- One code simplification: line 421's condition removed, so a moved-attribute change always resolves the references.

The auto-mode check refused the test edit after the red commit as a possible weakening, as it did at phase 4. So the
phase stops here with T059 open.

Options:
- **(a) Recommended.** Add the new in-process tests above in their own test commit, recorded here as tests added after
  the red commit for survivors (as phase 2 did with the reflected properties, 9caad44). Then make the line 421
  simplification and run `gate:mutation -- --base cf52eb1` again.
- **(b)** Change the source only, where the survivor is redundant or equivalent: remove the line 421 condition, the
  495 and 497 checks and the 528 and 531 conditionals. Record the rest (444, 456, 457, 468, 517) as surviving mutants
  for the reviewer.
- **(c)** Something else that you state.

**Operator decision at phase 5, 2026-11-16: option (a).** The operator authorised exactly these two changes after the
red commit:
- one separate test commit with in-process tests for the 17 surviving behaviours, changing no existing or red test;
- the removal of the redundant line 421 condition.

The operator also accepted the positive stacking of the hit layer: the layer at `z-index: 0`, the content at
`z-index: 1`, and `Canvas` under forced colours. The planner aligns the plan, the data model and T056's wording; I did
not edit those artifacts.

Applied:
- **440340a** (test): five in-process tests in `test/action-row.test.ts`, one per surviving behaviour:
  - the inner control carries no empty `aria-label`, `aria-labelledby` or `aria-describedby` without a source
    (lines 495, 497, 528, 531);
  - text written into a slotted text node's data describes the row (444);
  - a description forwarded through another shadow root's slot is read (468);
  - a moved `aria-labelledby` is resolved when it is moved before connection, and again when the row moves into
    another tree (421, 456, 457);
  - a shrink-wrapped title-only row is exactly its title plus 13 px a side, and a row with tags and no trailing icon
    shows its tags (517).
  The tests pass on the code (48 of 48 in process). No existing test changed.
- **4637d79** (source): the moved-attribute callback resolves the references on every moved change.

After both:
- `gate:mutation -- --base cf52eb1`: **pass**. 191 mutants on the changed lines of 3 files, none survived; 3 timeouts
  (the `MutationObserver`'s options and constructor call, as before), 35 compile errors, 1 zero-mutant entry
  (`src/index.ts`), 1 equivalent record (the `label` options); 549 s. Every survivor of the first run is killed or
  gone, and no survivor proved impossible to observe.
- Whole suite, `pnpm test`: **3720 tests passed in 152 files**, with docker up.
- `gate:lint` (289 files), `gate:typecheck` and `gate:test-lint`: pass.

**Environment.** Between the first mutation run and these runs the container restarted. dockerd was down, because a
stale `/var/run/docker.pid` blocked it. The coordinator removed the pid file and restarted dockerd, and `docker info`
passed before the whole suite above. No run of this phase was cut off by it: the plant shards, the visual runs and the
first whole suite all ran before the restart.

T059 is done.
