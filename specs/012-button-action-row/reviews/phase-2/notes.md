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
  size). Not in the plan; left as it is.

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
