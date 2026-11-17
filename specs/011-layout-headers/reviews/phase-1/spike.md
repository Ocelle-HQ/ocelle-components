# Phase 1: #10 recheck and spike (T001, T002)

Phase base `767c097` (`base.sha`). Measured on 2026-11-13 in this container: Chromium for Testing 1243
(`/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, through `OCELLE_CHROMIUM_PATH`), Playwright as pinned, Node
22.23.4, axe-core 4.14.0 from the repository's `node_modules`. Scratch pages only (scratchpad, not committed): plain
custom elements with open shadow roots and adopted stylesheets that carry the shadow structure and the declarations
research.md states for each element (R-02, R-04, R-07, R-08, R-09, R-10, R-11), with `tokens.css` and `base.css` built
from the packages, served on one origin by Playwright routes. Token values are read on the page (a probe element),
never typed in.

**Result**: T001 finds no difference that changes a task. T002 confirms R-02, R-04, R-10's measured items and R-11.
One R-09 measurement fails and research.md names no fallback for it: **the sidebar does not grow past a shorter
flex-row or grid container** (§ R-09, item 6). The same holds for the vertical rail (§ R-10, item 4), whose R-10
decision states that a taller rail grows with its content. This is a stop-and-ask point (tasks.md, T002); the question
is at the end of this file. Phase 1 stops here: no red commit, no implementation.

## T001: #10 as merged against R-14

#10 is merged on `main` as `3828d2f` ("Mission 006: Storybook workbench, visual regression and axe gates (#10) (#24)",
`origin/main` holds it), and `main` is merged into `claude/008-layout-headers` by the merge `767c097` (a merge, not a
rebase). The precondition holds.

| Item (R-14, T001) | Planned at `5f49794` | As merged (`3828d2f`) | Changes a task? |
|---|---|---|---|
| Story file location | `storybook/stories/<element>.stories.ts` | `storybook/stories/<name>.stories.ts`, one per element, CSF with `@storybook/html-vite`; the existing files use the short name (`icon.stories.ts`, `brand-mark.stories.ts`, `storybook/README.md`) | No: T023, T031, T039 and T046 already name `section-header`, `card`, `page-header`, `context-sidebar`, `personal-rail` |
| Story id scheme | from the title | title `Elements/<tag>` gives `elements-<tag>--<story>` (`elements-ocelle-icon--close`, `storybook/test/integration/elements-stories.test.ts:104`) | No |
| Baseline path | `storybook/baselines/<story-id>.<theme>.png` | the same (`storybook/README.md` § Baselines; e.g. `elements-ocelle-icon--close.light.png`) | No |
| Baseline command | `pnpm run visual:update` | the same (`package.json`: `node gates/bin/baselines.ts`); a pinned linux/amd64 container (`storybook/visual/container.json`: `mcr.microsoft.com/playwright` `v1.64.1-noble`, digest pinned) under docker or podman | No (environment note below) |
| Gate commands | `gate:storybook-build`, `gate:visual`, `gate:axe` | all three in `package.json` and registered in `gates/gates.json` | No |
| `axe` gate | a stub at `5f49794` ("not implemented (axe, phase 4)") | implemented (`gates/bin/axe.ts`): builds the Storybook, opens every story of the built index in light and dark in a fresh context, runs axe-core on the whole document less Storybook's harness nodes, fails on each serious or critical violation or incomplete node (FR-013 to FR-015) | No: FR-038 and FR-028's axe clause have their gate |
| Rule set and excluded rules (#10 FR-016) | R-11 names `region`, `landmark-one-main` and `page-has-heading-one` off | every default-enabled rule plus every rule tagged `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, less experimental rules and eight harness-document rules: `bypass`, `document-title`, `html-has-lang`, `html-lang-valid`, `html-xml-lang-mismatch`, `landmark-one-main`, `page-has-heading-one`, `region` (`gates/lib/axe-rules.ts`). FR-016's text is unchanged between `5f49794` and `3828d2f`; R-11 named only the three that bear on landmarks. 85 rules run on axe-core 4.14.0 (measured below) | No: the five further exclusions judge the harness document (title, `lang`, skip links), not an element's host or subtree |
| Pinned axe-core | 4.14.0 | 4.14.0 (root `package.json` `devDependencies`; `node_modules/axe-core` reads `4.14.0`) | No |
| Contributor note (#10 FR-025) | the FR-025 items | `storybook/README.md` holds them: one story per variant and state, the pointer parameter, both themes by the harness, baselines by `pnpm run visual:update` and CI's artifact committed when they disagree, the PR description for a baseline change, arm64 emulation, open shadow roots (`closed-shadow-root`), surfaces inside the host (`outside-root`), `font: inherit` for form controls, strict CSP proved by the package's own browser tests | No |
| Story layout sheet | `storybook/.storybook/stories-layout.css` or a sheet beside it, keyed on `[data-story]` | the sheet exists, imported by `preview.ts`, selectors on `data-story` only (its comment says "base-style stories"); no test pins its rule list (`storybook/test/unit/*` read the stories' markup, not this sheet), so T046's `[data-story="rail-items"]` rules can go in it or a sheet beside it | No |
| Exceptions file | not in R-14 | `storybook/a11y-exceptions.json` entries must name a feature plan holding the row (`specs/<feature>/plan.md`, amendment of 2026-11-13); this feature plans no exception | No |

Other changes in #10's spec and contracts between `5f49794` and `3828d2f` (FR-023, FR-024, US4-4, US4-5, the
`storybook-build` config-unreadable cause and the exception-plan check) do not touch R-14's items.

Environment note (not a task change): this container has the docker CLI but no daemon
(`/var/run/docker.sock` missing) and no podman, so `pnpm run visual:update` and `gate:visual` cannot run here. They are
needed from phase 2 on (T023's baselines); R-14 already says CI's captures from the job artifact are committed when
local and CI captures disagree, which is the route open here.

## T002: spike

### R-02 Slotted headings and edge margins

| Measurement | Result |
|---|---|
| `h1` to `h6` in `slot="heading"` of a section header, `::slotted([slot="heading"])` with `margin: 0` and the heading tokens | each level: margin `0px`, font size `24px` = `--ocelle-font-size-xl` read on the page, weight `800` = `--ocelle-font-weight-display`; a plain document `h1` beside them keeps the UA `21.44px 0px` margin and `32px` size. UA heading rules lose to `::slotted()`: **holds** |
| Eyebrow `text-transform: uppercase` on a slotted `span` | computed `uppercase`: **holds** |
| `<p slot="description">` with `margin-block: 0` | margins `0px/0px`; heading bottom to description top `4px` = `--ocelle-space-1`, the column gap: **holds** |
| Card body `<p>One</p><p>Two</p>` after a header | first `p` top = header bottom + `8px` (`--ocelle-space-2`); between the two `p` `16px` (the UA margin kept); last `p` bottom = content edge (`0px`): **holds** |
| Card body `<p hidden>Draft</p><p>Body</p><p hidden>After</p>`, with and without a header | visible `p` starts `8px` below the header (or `0px` from the padding edge with no header) and ends `0px` from the padding edge, margins `0px/0px`: hidden edge elements are skipped by `:not([hidden])`: **holds** |
| Sidebar head `<p hidden>`, `<p>`, `<p hidden>`; footer `<p hidden>`, two `<p>`, `<p hidden>` | head `p` `16px` from its part's top and bottom; footer first `p` `16px` from the top, `16px` between the two footer `p` (kept), last `p` `16px` from the bottom: **holds** |
| `ul` and `p` sections | margins `0px/0px` under `margin-block: 0`: **holds** |

### R-04 Section header and page header wrap rule

Heading "Release planning overview" (`h2`, the heading tokens), description, two actions (`Edit`, `Share`;
`111.08px` with their gap). Longest word (min-content of the heading) `112.66px`. Threshold box width = longest word +
`--ocelle-space-4` column gap + actions = `239.73px` (section header) and `287.73px` (page header, + `2 × 24px`
inline padding). Structure and declarations as R-04 and R-07.

| Case | Section header | Page header |
|---|---|---|
| (a) box 1 px wider than the threshold | actions beside the column (actions left ≥ column right), actions top = heading top (`0`), heading on 3 lines inside the column | the same (tops both `16px`, the band padding) |
| (b) box 2 px narrower than the threshold | actions under the column, `8px` below it (`--ocelle-space-2` row gap), column takes the full width (`238px`) | the same |
| (c) "Mission" + a 60-character run + "end" at a 320 px viewport | column `320px`, the run broken inside it over 5 lines, every text rect inside the column and the host, `scrollingElement.scrollWidth` `320` | column `272px` (320 − 48), the same |
| (d) with an eyebrow, wide (1000 px) and at the threshold | actions top = heading top (`27.19px`, eyebrow line + `--ocelle-space-1`), actions beside | the same (`43.19px`) |

(a) to (d) **hold** in both headers; R-04's grid fallback is not needed.

### R-09 Context sidebar box and dividers

Sidebar `320px` wide, R-09's declarations with `!important` on the section's display, padding, inline margins and
divider; `margin-block: 0` normal.

1. **First-section selector**, a `slot="head"` element before the sections in DOM order: the first section has
   `border-block-start` `0px none`, every later one `1px solid`. `::slotted(:nth-child(1 of :not([slot]):not([hidden])))`
   matches the first visible section: **holds**.
2. **Negative inline margins**, sections `div`, `span`, `ocelle-section-header` (prototype with its own
   `:host { display: block }` and `:host([hidden]) { display: none }`), `ul`, `p`: each `display: block`, border box
   from the sidebar's left edge to its right edge (`0px` / `0px`), padding `16px` on every side, margins `0px/0px`;
   with a text node between two `div` sections the same: **holds**.
3. **Page resets**, two `ul` sections, the `!important` rules against a copy with the same rules normal:

   | Page rule | `!important` rules | Normal rules (control) |
   |---|---|---|
   | `ul { margin: 0; padding: 0; list-style: none }` | padding `16px` all sides, sections `0`/`0` from the edges, second section's divider `1px solid` | padding `0`, sections inset `16px` each side, divider inset |
   | `* { margin: 0; padding: 0; border: 0 solid }` | as above | padding `0`, inset, divider `0px solid` (gone) |
   | `*, ::before, ::after { box-sizing: border-box; border: 0 solid; margin: 0; padding: 0 }` | as above | as the line above |
   | `* { margin: 0 !important; padding: 0 !important; border: 0 solid !important }` | as above (the shadow context's `!important` wins over the page's) | as the line above |

   The `!important` rules keep each section's padding and full-width divider; dropped, they do not (as plan squad
   round 3 probed): **holds**.
4. **Hidden sections**, `div`, hidden `div`, hidden `ocelle-section-header`, `div`: both hidden sections
   `display: none` with no client rects; exactly one divider between the visible two (`0px none` then `1px solid`):
   **holds**.
5. **Hidden first section**, a hidden `div` (and, separately, a hidden `ocelle-section-header`) first: the first
   visible section has `border-block-start` `0px none`, the next `1px solid`; the sections wrapper keeps its head
   divider (`1px`): **holds**.
6. **Host box in three container kinds**, with and without base.css (R-09's `:host { display: flex;
   flex-direction: column; min-block-size: 100%; box-sizing: border-box }`, layout `div` `flex: 1 0 auto`, footer
   `margin-block-start: auto`). Short content in a 600 px container; tall content (12 sections, 713 to 786 px) in a
   100 px container:

   | Container | base.css | Short content in 600 px | Tall content in 100 px |
   |---|---|---|---|
   | block | with | `600px`, footer at the block end, free space `432.44px` between the sections wrapper and the footer | `785.63px`, grows, footer follows the last section |
   | block | without | `600px`, footer at the end | `713px`, grows |
   | flex row | with | `600px`, footer at the end | **`100px`**: the host stays the container's height and its content overflows it |
   | flex row | without | `600px` | **`100px`** |
   | grid | with | `600px` | **`100px`** |
   | grid | without | `600px` | **`100px`** |

   Fills the container: **holds** in all three. Grows past a shorter one: **holds in the block container only; fails
   in the flex-row and grid containers**, with and without base.css. Cause, measured on a plain `div` with the same
   box: in a single-line flex row with a definite block size, `align-self: stretch` (the default) sets the item's block
   size to the line's, whatever its content; in a grid with a definite block size, the item with
   `min-block-size: 100%` stays at the container's `100px` while the same item without `min-block-size` grows to its
   `700px` content. Measured with `:host { align-self: start }` added (the candidate of option (a) below, not part of
   the plan): the host fills the 600 px container in all three kinds (`600px`) and grows past the 100 px one in all
   three, with and without base.css.

   R-09 names no fallback for this measurement ("if the measurement fails, the operator is asked before the US3 red
   commit"). See the question below.

### R-10 Personal rail

1. **Box sizes**, with and without base.css: vertical border box `52 × 600px` in a 600 px block container, content box
   `44 × 584px`, padding `8px 4px`, `box-sizing: border-box`; horizontal in a 320 px container: border box `320px`
   wide (`56px` tall with one row of 40 px items), padding `8px`: **holds** both ways.
2. **Focus ring** of a 40 px stand-in item focused by Tab (`:focus-visible`, base.css ring): item `40 × 40px`, outline
   `3px` solid at offset `2px`, the ring `5px` outside the item and `1px` inside the host's border box on each side; no
   ancestor in the flat tree clips (`overflow` visible on every one): **holds**.
3. **Host in three container kinds**, a 600 px container, with and without base.css: `52 × 600px` in block, flex-row
   and grid: **holds** (R-10's measured item).
4. **Taller than its container** (not in R-10's list of measurements, but its decision: "a vertical rail taller than
   its container grows with its content"), 14 items plus a bottom item (`677px`) in a 100 px container: grows to
   `677px` in the block container; stays **`100px`** in the flex-row and grid containers, the bottom group outside the
   host's box, with and without base.css. With `:host { align-self: start }` it grows to `677px` in all three and
   still fills a 600 px container. Same cause as R-09 item 6.
5. **Horizontal rail with only bottom items**, 320 px, two items: left to right, the group's inline end at the content
   box's end (`0px`) and `220px` free at the start; right to left, mirrored (`0px` at the left end, `220px` at the
   right); the divider `display: none`: **holds**.
6. **Stand-in items** (`[data-story="rail-items"] a` from a linked same-origin sheet, R-10's declarations), vertical
   and horizontal, light and dark: computed `color` `rgb(237, 233, 225)` = `--ocelle-color-chrome-ink` read on the
   page, items `40 × 40px`; axe-core 4.14.0 with #10's rule set (85 rules): no `color-contrast` or `target-size`
   violation or incomplete result (4 passing nodes each), no serious or critical result at all: **holds**. Control:
   plain `<a>` items without the sheet are `rgb(0, 0, 238)` with two serious `color-contrast` violations, as plan squad
   round 2 probed.

### R-11 Landmark naming

Prototype hosts with `[Symbol("internals")] = this.attachInternals()`, `role = "navigation"`, `ariaLabel` from the
trimmed `label` (no inner `<nav>`); sidebars with head, two `ul` sections and a footer; rails with stand-in items.

1. **Tree reads**, the four US3-12 and three US4-11 cases on one page (CDP full tree, unignored nodes): exactly seven
   `navigation` nodes, one per host: `Team`, `Other`, unnamed, unnamed (sidebars); `Personal`, `Other`, unnamed (rails);
   no other node carries `Team`, `Other`, `Projects`, `Personal` or `Me`; every host keeps the `aria-label` the page
   wrote (`Team`, `Other`, `""`, none, `Personal`, `Other`, `""`). After script removes `aria-label` from the second
   and third of each: `Projects`, `Projects`, `Me`, `Me`, still seven navigation nodes and no other node with a
   landmark's name: **holds**.
2. **axe on each case alone**, light and dark, axe-core 4.14.0, #10's rule set (85 rules), whole document: no
   violation and no incomplete result of any impact on any of the 14 runs; `axe.commons.aria.getRole(host)` is
   `navigation` on each: **holds**.
3. **Role probe**: `getRole` reads `navigation` for a sidebar and a rail with `label`, with a host `aria-label` and with
   neither (the own symbol's description is `internals`); with the internals in a `#private` field instead it reads
   `null` for all six: **holds**.

## Stop-and-ask: the sidebar and the rail in a stretching container

**Fact**: with the box R-09 and R-10 specify, a sidebar (and a vertical rail) whose content is taller than its
container keeps the container's block size, its content overflowing, when the container is a flex row or a grid with
a definite block size. FR-023 ("when its content is taller, it MUST grow with its content", US3-4: "the sidebar's
block size is its content's") and R-10's "a vertical rail taller than its container grows with its content"
(SPEC-2-05) hold only in a block container. #12's shell, which places both, is likely a grid or flex row. research.md
names no fallback (R-09: "if the measurement fails, the operator is asked before the US3 red commit").

**Options**:

- **(a)** Add `align-self: start` to the `:host` rule of `ocelle-context-sidebar` and of `ocelle-personal-rail`
  (measured above: fills a 600 px container and grows past a 100 px one in block, flex-row and grid containers, with
  and without base.css). It is a layout declaration, one more R-17 style plant per element; a page rule on the host's
  `align-self` still wins (outer context), which the README would state. Amends R-09, R-10, plan decisions 5 and 6,
  and adds the flex-row and grid variants to US3-4 (and the rail's taller case) as scenarios.
- **(b)** Keep the box as planned and narrow the claim: FR-023's growth and R-10's taller rail are guaranteed in a
  block container; in a flex or grid container the page (or #12's shell) sets the host's `align-self` (or the row
  size) itself, stated in the README. Amends FR-023, R-09, R-10 and the README statements of T035 and T043; US3-4 stays
  measured in a block container.
- **(c)** Another box the operator prefers (for example no `min-block-size` and the page sizing the sidebar), measured
  in a new spike before the US3 red commit.

The rest of phase 1 (T003 to T008: the slot-state controller, the command readers, the driver plumbing) does not
depend on this answer; US3 (phase 4) and US4 (phase 5) do.
