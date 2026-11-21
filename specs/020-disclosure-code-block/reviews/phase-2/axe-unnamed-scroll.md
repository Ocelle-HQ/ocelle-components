# Axe measure of the unnamed overflowing scroll block (T021a)

Run on 2026-11-21 in this container (Linux x64, Node 22.23.5, headless Chromium **156.0.8078.4**, the repository's
pinned Playwright 1.64.1 browser, axe-core **4.14.0** from the repository's `node_modules`), on phase 2's base with
the planner's commit 6760434 on top. `packages/elements/src/overflow-region.ts` is unchanged.

**Result: axe reports a serious finding. This is a stop for the operator (tasks.md, Stop-and-ask points, T021a).**
The finding also occurs on a labelled control block, so it does not come from the missing name (see § Control).

## What was run

Scratch files only. None of them is committed, and all were removed from the repository tree before this commit,
along with the ignored `storybook/dist/` they were built into.

- **Scratch element:** `x-code-block`, the T021 stand-in (`reviews/phase-2/spike.md` § Stand-in), in a scratch
  directory at the repository root outside `packages/`. In scroll mode it renders research R-06's structure,
  `.block > .region-frame > .region-box[data-fade] > .region-track > pre.code`, with the ring and the two edges. It
  does this through the unchanged `OverflowRegion` module (`box: () => .region-box`, `setLabel(this.label)` in
  `updated()`) and `overflowRegionStyles`.
- **Scratch story:** `storybook/stories/scratch-code-block.stories.ts`, `title: "Scratch/x-code-block"`. It has two
  stories, each in the 288 px `data-frame="S"` frame, holding the one line `docker compose --file
  deploy/compose.production.yaml --project-name ocelle-components up --detach --remove-orphans`:
  - `ScrollUnlabelled` (`scratch-x-code-block--scroll-unlabelled`): `overflow="scroll"`, no `label` and no host
    `aria-label`. This is the measure.
  - `ScrollLabelledControl` (`scratch-x-code-block--scroll-labelled-control`): the same block with
    `label="Deploy command"`. This control was added to tell a name-related result from one caused by the layout.
- **Runner:** the `axe` gate's own code, called from a scratch driver and limited to the scratch stories:
  - `buildStories` (the storybook-build gate's build) and `serve` of `storybook/dist`.
  - `axeCore` from `gates/bin/axe.ts`, which gives the pinned axe-core script and the FR-016 rule options from its
    metadata (`ruleOptions(ruleMeta(...))`).
  - For each story in `light` and `dark`, `auditStoryTheme` from `gates/bin/axe.ts`. That is the gate's per-story
    audit: a fresh context with `contextOptions(theme)`, the render wait, the pointer state, the closed-shadow-root,
    empty-root and outside-root checks, then `runAxe` with `axeContext()` and the rule set.
  - `axeVerdict` from `gates/lib/axe-verdict.ts` over these four audits, with no exception entry.
- **Box properties:** read in a second fresh context per story and theme, after the gate's render wait, `scrollBack`
  and `settle`. The attributes come from the shadow `.region-box`. The role and name come from CDP
  `Accessibility.getFullAXTree`: the one non-ignored focusable node other than the root.
- **Diagnostic only, not part of the gate's run:** `axe.run(document, { runOnly: ["color-contrast"], resultTypes:
  ["incomplete"] })` on the same page, to read the check's `messageKey`.

## The unnamed block (`ScrollUnlabelled`)

| Theme | Role (AX) | Name (AX) | `role` attr | `aria-label` | `aria-labelledby` | `tabindex` | `scrollWidth` / `clientWidth` | `data-fade` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| light | `generic` | `""` (none) | absent | absent | absent | `0` | 938 / 262 | `end` |
| dark | `generic` | `""` (none) | absent | absent | absent | `0` | 938 / 262 | `end` |

The host has no `label` and no `aria-label`. The box overflows (938 > 262) and is a tab stop with no role and no name.

### Every axe result

| Theme | Type | Rule id | Impact | Target |
| --- | --- | --- | --- | --- |
| light | incomplete | `color-contrast` | serious | `["x-code-block", ".code"]` (printed `x-code-block >>> .code`) |
| dark | incomplete | `color-contrast` | serious | `["x-code-block", ".code"]` (printed `x-code-block >>> .code`) |

There are no violations in either theme. In particular, no `scrollable-region-focusable`, `aria-*`, `focus-order` or
name rule reports anything on the unnamed tab stop. The diagnostic `messageKey` of both incomplete nodes is
`elmPartiallyObscured`: "Element's background color could not be determined because it's partially obscured by
another element".

### Gate verdict on these runs

`axeVerdict` with no exception entry gives `exit: 1`, "axe: 4 findings in 4 story-theme runs". The two findings for
the unnamed block are `color-contrast-incomplete`, `serious: x-code-block >>> .code`, at
`scratch-x-code-block--scroll-unlabelled/light` and `/dark`. The gate blocks serious and critical nodes, incomplete
ones included, unless an entry in `storybook/a11y-exceptions.json` matches them.

## Control (`ScrollLabelledControl`)

| Theme | Role (AX) | Name (AX) | `role` attr | `aria-label` | `tabindex` | `scrollWidth` / `clientWidth` | `data-fade` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| light | `group` | `Deploy command` | `group` | `Deploy command` | `0` | 938 / 262 | `end` |
| dark | `group` | `Deploy command` | `group` | `Deploy command` | `0` | 938 / 262 | `end` |

| Theme | Type | Rule id | Impact | Target |
| --- | --- | --- | --- | --- |
| light | incomplete | `color-contrast` | serious | `["x-code-block", ".code"]` |
| dark | incomplete | `color-contrast` | serious | `["x-code-block", ".code"]` |

There are no violations, and the diagnostic `messageKey` is `elmPartiallyObscured`. The gate's verdict holds the same
two `color-contrast-incomplete` serious findings at `scratch-x-code-block--scroll-labelled-control/light` and
`/dark`.

## Reading

- **The unnamed tab stop:** with no `label`, the box is a `generic` tab stop with no name, and axe 4.14.0 with the
  gate's rule set reports no rule against that.
- **Not caused by the name:** the serious result is `color-contrast` incomplete with `elmPartiallyObscured` on the
  clipped `pre.code`. It is identical on the labelled block, so it comes from the overflowing scroll layout (the line
  clipped by the box, under the edges), not from the absent name.
- **Wider effect, for the operator:** under this stand-in, every overflowing scroll story in T028's list would be
  failed by the gate unless it gets an entry in `storybook/a11y-exceptions.json`. That covers ScrollOverflowing,
  ScrollMiddle, ScrollEnd, ScrollFocused, DigestScroll and RightToLeftScroll, not only ScrollUnlabelled. Needing such
  an entry is itself a stop-and-ask point (tasks.md, "axe"). The base Prose document's table scroll box has the same
  kind of entry today (`elmPartiallyObscured`).

## Stop

T021a's branch "axe reports one" applies: this is a stop for the operator before T028. Nothing in plan.md, research
R-09 or spec FR-050 is changed here. That documentation commit is the planner's, after the operator's answer.
