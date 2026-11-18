# Phase 2 notes: User Story 1, `ocelle-button`

## Status

First stop (2026-11-14): the flush hover on dark `neutral-bg` (FR-019 listed no such ground, though dark
`--ocelle-color-neutral-bg` `#2A261F` equals dark `--ocelle-color-hover-bg`). The operator decided it in 48cdc95
(spec "Operator decisions at phase 2"): option (a), dark `neutral-bg` joins the hand-written exception list; US1-1 is
reworded to "exactly one node with a role other than `generic` or a name"; the tasks.md story list is kept (about 72
stories); a plants shard stops only at or over 10 minutes.

Resumed after the container restart: the base was re-recorded as 48cdc95 (`base.sh 2`, after removing the earlier
8b1cc6d record, which no commit had used). Applied: `flushHoverUnchanged` in `test/scenarios/button.ts` lists
`neutral-bg` in dark; the package README's flush-hover note (and its README test) names `color-neutral-bg` in dark;
US1-1 asserts the full node list `[generic "", button "Save"]` and the meaningful list (role other than `generic` or a
name) `[button "Save"]`, so a named host `generic` fails both.

## Further points for the review (not blocking)

- **The host is an unnamed `generic` node** (decided by the operator, kept here for the record). US1-1 says "exactly one node". Chromium 153 exposes the `ocelle-button`
  host as an unnamed, unignored `generic` node beside the inner `button` (in process: with and without an `id` on the
  host; mission 005 met the same for hosts with an `id`, `src/naming.ts` `expose`, and hides its decorative hosts, which
  a button cannot do since `aria-hidden` would hide the inner control too). No screen reader announces an unnamed
  generic. The scenario therefore pins the full list, `[generic "", button "Save"]`, and the other scenarios compare
  the meaningful nodes (every node but an unnamed generic). This reads "one node" as "one node with a role or a
  name"; the reviewer or the operator may want the spec's wording changed.
- **Story count** (decided by the operator: proceed, plan corrected in 48cdc95). This phase adds 17 button stories (21 → 38 in the repository; 76 story-themes). The plan's "about
  37 stories in all" for the feature does not match the story lists of tasks.md: phases 3 to 6 list 6 + 4 + 13 + 11 = 34
  stories, so with this phase's 17 the repository would reach about 72 stories, close to the split count of 76 at
  `shardSize` 1 (phase 1's question), against the plan's "about 58" and "about 18 stories of headroom".
- **Harness additions.** The driver gains `callClick(id)` (the element's own `click()`, for US1-2 and US1-3) and a
  `position` option on `click` (US1-15 and US1-17 click 4 px inside an edge); phase 1's harness had neither. Their two
  self-tests in `scenarios/harness.ts` pass in the red commit, because the code they test is test code committed in
  the same commit.
- **Test host.** `test/fixtures/test-host.ts` gains a `description` and a `tags` slot after the trailing wrapper, so
  T015's slot test can slot a non-icon element there (the test host is test code).
- **Icon-only gap.** The slot convention puts the icon's gap on the slotted icon (`margin-inline-end`), so an icon-only
  button keeps an 8 px gap after its icon, so the icon sits 4 px towards the inline start of the centre and the button
  is 8 px wider than its padding and icon need (still within FR-011: at least 24 px, and smaller than the default
  size). Not in the plan; left as it is. Fixed in review round 1 (R1-01, round-1-fixes.md): with no label the icon
  takes no gap and is centred.

## Visual baselines

The 34 button baselines (and the two changed `tokens--colour` captures, which show the four new colour tokens) were
written only by `pnpm run visual:update` with `OCELLE_VISUAL_ENGINE=docker` in #10's pinned container
(`mcr.microsoft.com/playwright@sha256:ee15712262f017b8157421b212b12099146645f44b1bc5c0514cbbe6a229b1d0`), and checked
with `pnpm run gate:visual` (76 captures match, "docker only: no cross-engine comparison"). No podman cross-engine
check was possible in this environment; CI confirms the baselines at landing. No baseline PNG was hand-edited or
hand-picked.

## Changes after the red commit (outside the red tests)

- The whole suite after the first green commit found pinned values the red commit had not updated, all changed by
  design: `gates/test/contrast-required.test.ts` (the hand-written required set gains R-08's rows: 182 per theme, 364
  in all), the manifest gate's "3 elements checked" (unit and integration), and the axe plant repository's 78
  story-theme runs. The red `build.test.ts` file filter lacked `ocelle-button.js` while its expected list named it (a
  test defect: it could never pass); the filter was fixed, the expectation unchanged.
- Plants: `visual/fail-token-changed` gains the fourteen light button story-themes that show `color-ink` (measured by
  running its shard); `contrast/exempt-disabled-ink` gains its figures on the two new chrome grounds (4.89, 4.42) and its
  `why` notes that `color-chrome` is above 4.5:1 with the planted value; the manifest plants' committed-manifest copies
  were regenerated with `ocelle-button`.

## Gate runs (T029)

`gate:manifest`, `gate:style-lint`, `gate:contrast` (193 pairs light, 201 dark, 182 required per theme),
`gate:csp`, `gate:prefix`, `gate:pins`, `gate:test-lint`, `gate:storybook-build` (38 stories), `gate:visual` (76
captures, docker), `gate:axe` (76 story-theme runs, 0 serious or critical, the 10 excepted notes), the whole suite
(3346 tests), and `gate:plants` shard by shard (`--shard 1` to `--shard 76`, one at a time, docker): every plant as
expected after the manifest plant copies were regenerated (shards 1 to 3 re-run); the slowest shard took 130 s, the
three other-plant shards 100 to 131 s, the visual shards about 105 to 130 s, the axe shards about 55 s.

`gate:mutation -- --base 48cdc95` first found nine surviving mutants, all on `ocelle-button`'s property options (the
reflection of `variant`, `size`, `flush`, `ground` and `disabled` was never asserted: the scenarios set attributes
only). Two tests were added to `test/button.test.ts` (9caad44); the second run: 134 mutants on the changed lines of 5
files, none survived (48 compile errors, 2 zero-mutant entries, 1 equivalent record).

## Fix round 4 (operator rounds 5 and 6: O3-01, O6-01)

**Why.** The operator ran two rounds on 2026-11-18. Round 5 (`round-5.md`, O3-01): a one-line `ocelle-button` in a
line of text sat 4.6 to 6.2 px above the text's baseline; fold the fix into this pull request. Round 6 (`round-6.md`,
O6-01): the first form of the rule, `.icon-row > .label { align-self: baseline }`, moved icon-only controls 10.5 to
11.6 px below the line; apply it to labelled rows only and make `bare` part of the convention. Plan decision 33 is
amended to match.

**Red, two steps.**

- `fix-4`, 19921596 (T029a to T029c, `red-fix-4.log`): 9 of 7761 tests failed, all on their assertions. The label
  marker sits above the paragraph's marker for the button (both harnesses) and for the test host (both harnesses, with
  and without `base.css`). The README's label-wrapper and baseline lines and the CHANGELOG line were missing. The
  block-start checks (`rowStart`) passed at once, because the positions were already equal. The first plant of
  plants.md § Fix round 4 proves them.
- `fix-5`, 082fcd50 (T029f to T029h, `red-fix-5.log`): 11 of 7765 tests failed, all on their assertions: the 9 of
  `fix-4`, plus the README's two new lines (the `bare` modifier; baseline alignment for labelled rows only and the
  icon-only icon). This step's own proof is those two README lines. The icon-only scenario (default, compact, busy)
  passed at once in both harnesses: before the rule, the icon sits where the native button's svg does. The second plant
  of plants.md § Fix round 4 proves it.
- Why `fix-5` and not a second `fix-4`: `red.sh` keeps one record per label, so a second `fix-4` would replace the
  first commit's record. It is still fix round 4, and `red-commits` holds both.
- `scenarios/slot.ts` does not change in the second step. The test host (`test/fixtures/test-host.ts`) always renders
  `class="icon-row"` and has no bare row, so the icon-only case is covered on `ocelle-button` only (T029g).
- The icon-only scenario's method: in each paragraph, an icon-only `ocelle-button` (an `ocelle-icon` in the `icon`
  slot, `aria-label`) sits beside a native `<button aria-label>` holding a `viewBox` svg that is `--ocelle-icon-size`
  square. The button's icon (the spinner's svg while busy) must have its block-centre within 0.5 px of the native
  svg's, both read relative to the paragraph marker. Each case also checks that the native svg is 20 px tall and that
  the row carries `bare`.

**Green (T029d).**

- `packages/elements/src/icon-slot.ts` gains `.icon-row:not(.bare) > .label { align-self: baseline; }`. Nothing else
  in the stylesheet changes. The header comment now names the label wrapper and the `bare` modifier, and says why the
  rule exists and why it skips `bare` rows.
- `packages/elements/README.md` § Slot convention: the opening paragraph names the label wrapper and the `bare`
  modifier. The **Alignment** bullet gains the baseline lines for labelled rows and for `bare` rows.
- `packages/elements/CHANGELOG.md` gains one Unreleased line.
- The stashed green work (the unscoped rule and its 12 baselines) was not reused. Its red-commits line and
  `red-fix-4.log` were restored, and the stash was dropped.
- `packages/elements/src/ocelle-button.ts`: no change. It already renders `<span class="label">` in `.icon-row` and
  sets `bare` on a row with no label (R1-01), and its own `bare` gap rules stay.
- `ocelle-action-row`: the rule does not reach it. It adds `iconSlotStyles`, but its shadow root renders `.hit`,
  `.icon-slot` and `.title` (`ocelle-action-row.ts`, `render`), with no `.icon-row` and no `.label`. Its scenarios pass
  unchanged in the whole suite, and no `elements-ocelle-action-row--*` baseline moved.

**Visual baselines (constitution V).** The first `OCELLE_VISUAL_ENGINE=docker pnpm run gate:visual` reported 10 of
388 story-themes as `differs`. All 10 are `ocelle-button` stories, both themes each:

| Story | What moved (layout measured in the built Storybook, rule on vs. neutralised) |
|---|---|
| `elements-ocelle-button--compact` | The three compact labelled buttons, 0.5 px down as a whole |
| `elements-ocelle-button--busy-compact` | The three busy compact labelled buttons, 0.5 px down as a whole |
| `elements-ocelle-button--busy-with-icon` | The labelled busy button, 4.59 px down as a whole (5 px in the capture). The icon-only busy button (`bare`) did not move (0 px; its pixels are identical). |
| `elements-ocelle-button--current` | Both compact flush link buttons, 0.5 px down. The line box is shorter, so the "/" separator moves 6 px up and the heading below moves 5 px up. |
| `elements-ocelle-button--flush` | The compact flush button with an icon, 0.5 px down. The default flush button did not move. |

- Inside every control, every position and size (the row, the icon wrapper, the spinner, the label, the host's width
  and height) is identical with the rule on and off. In the captures, a control that moved by a whole pixel matches
  its baseline exactly at that shift. A 0.5 px move changes only the anti-aliasing of the borders and the spinner,
  while the label text stays on the same pixel rows.
- Not reported, and not moved: `elements-ocelle-button--icon-only` (both themes; its two `bare` buttons measure 0 px),
  every `elements-ocelle-action-row--*` story, and the other button stories. Of those, `primary` and `busy` were
  measured: 0 px for every button.
- Regenerated only with `OCELLE_VISUAL_ENGINE=docker pnpm run visual:update`: "wrote 10 files (0 added, 10 changed,
  0 removed)", exactly these 10. No visual plant has its own baseline of a button story: `fail-token-changed` uses the
  repository's baselines through its delta. So no `--plant` update was needed.
- `gate:visual` again: "388 captures match their baselines (docker only: no cross-engine comparison)".
- For the pull request's description: a labelled one-line button now sits on the surrounding text's baseline, so in
  stories where it shares a line it moves 0.5 to 4.6 px down (and a line holding only compact buttons gets shorter).
  Icon-only buttons and action rows are unchanged.

**Checks (T029e).**

- Plants: plants.md § Fix round 4. Both plants failed exactly as expected.
- `pnpm test`: 7765 tests passed in 232 files (the `elements` and `elements-browser` projects included).
- `gate:typecheck`, `gate:lint` (446 files), `gate:style-lint` (41), `gate:test-lint` (327), `gate:csp` (44),
  `gate:prefix` (465) and `gate:manifest` (20 elements, no change): no finding.
- `gate:storybook-build`: 194 stories.
- `gate:axe` (docker): 388 story-theme runs, 0 serious or critical, the 10 excepted notes.
- `pnpm run gate:mutation -- --base b594b7e --files packages/elements/src/icon-slot.ts`, alone, before the commit:
  "0 mutants on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 1 zero-mutant entry; 0
  equivalent records". Stryker makes no mutant inside the `css` tagged template, so the new rule has no mutant. The two
  plants above stand in for it: each one swaps the rule for the alternative that a mutant would test (all items, or
  every row) and fails.
- The base was `b594b7e`, as the orchestrator gave it: an ancestor of the red commit whose diff of `icon-slot.ts` also
  covers phase 2's earlier change to it. That is a superset of the T029c base.
