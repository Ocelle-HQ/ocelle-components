# Phase 2 notes: User Story 1, `ocelle-button`

## Status: stopped for an operator decision (2026-11-14)

Base recorded by `base.sh 2`: 8b1cc6d92349c5076ab7a6da223e2e3593d5b577. The spike (T014) is done
(`spike.md`: plain `focus()` shows the ring in the pinned capture; no stop). The tests of T015 to T021 and the
implementation of T022 to T028 (without baselines) are written in the working tree, **not committed**: no scaffold, red
or green commit exists yet, because the red commit must hold the final US1-14 test and that test depends on the
decision below. With the implementation in place every new test passes except the one the decision is about (in
process and on the strict-CSP fixture).

## Operator question (stop-and-ask: the spec contradicts itself)

**Flush hover on the dark `color-neutral-bg` ground.** FR-019 states the rule "Where the hover surface equals the
ground, a flush control's hover shows no change" and then lists the grounds where that happens: `hover-bg` in both
themes, `inset` in light, `chrome-hover` (with `ground="chrome"`) in both themes. US1-14 and plan decision 6 repeat the
list, and US1-14 asks for it to be written by hand per theme so that any other ground fails. The token values add one
ground the list misses: dark `--ocelle-color-neutral-bg` is `#2A261F`, the same value as dark
`--ocelle-color-hover-bg` (`packages/tokens/test/expected.ts`, 002 Appendix A), so a flush button on the dark neutral
state ground shows no hover change. Measured: US1-14 (dark, flush) fails on `neutral-bg` with `hoverFromIdle: false`,
in process and on the fixture; every other ground and theme passes. (Light `neutral-bg` is `#E6E1D8`, which differs
from light `hover-bg` `#E2DDD3`; a bordered variant's hover still shows on dark `neutral-bg`, its border turns
`color-hover-border`.)

Options:

- **(a)** Add "`color-neutral-bg` in dark" to the exception list (spec FR-019, US1-14, plan decision 6, research R-08
  item 3, the README's flush-hover note, US4-8 later), as a case of FR-019's own rule. No token or design change; hover
  carries no information there, as on the other listed grounds.
- **(b)** Keep the list and change the flush hover look on the state grounds (for example a flush button with
  `ground="state"` hovers with `--ocelle-color-active-bg`, or a new token), so the hover shows on every state ground.
  A design change, with new contrast rows.
- **(c)** Change the dark `--ocelle-color-neutral-bg` value so it differs from `--ocelle-color-hover-bg`. A value
  change of an existing token, out of this feature's scope (plan decision 5) and a change to 002's Appendix A.

## Further points for the review (not blocking)

- **The host is an unnamed `generic` node.** US1-1 says "exactly one node". Chromium 153 exposes the `ocelle-button`
  host as an unnamed, unignored `generic` node beside the inner `button` (in process: with and without an `id` on the
  host; mission 005 met the same for hosts with an `id`, `src/naming.ts` `expose`, and hides its decorative hosts, which
  a button cannot do since `aria-hidden` would hide the inner control too). No screen reader announces an unnamed
  generic. The scenario therefore pins the full list, `[generic "", button "Save"]`, and the other scenarios compare
  the meaningful nodes (every node but an unnamed generic). This reads "one node" as "one node with a role or a
  name"; the reviewer or the operator may want the spec's wording changed.
- **Story count.** This phase adds 17 button stories (21 → 38 in the repository; 76 story-themes). The plan's "about
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
