# 013 inputs: kitty-mission-ui inventory and spec-kitty-design #280/#498/#510/#523

Sources read on 2026-11-14:
- **kitty-mission-ui:** `MOES-Media/kitty-mission-ui` (private), default branch `main` at `c994c8ea07643050a5b2d159ae6ff16da709a7da` (2026-10-17).
- **Library CSS:** the three families' stylesheets in `spec-kitty/spec-kitty-design`, branch `develop`, `packages/styles/src/{facts,empty-state,progress}/`.
- **Issues:** the four issues and their timelines, through the GitHub API.

Nothing was changed, commented on or opened anywhere.

## Part A: kitty-mission-ui variant inventory

### How the counts were made, and the earlier figures

kitty-mission-ui has no Svelte or HTML components. Every element is a Lit custom element in TypeScript, with its markup in `html` tagged templates and its CSS in `css` blocks in the same `*-parts.ts` and `sk-*-screen.ts` files. The three families appear only in `packages/mission-ui/src`. No class is set or toggled by script anywhere (there is no `classList`, `classMap` or `className`). Variants change only when a template renders a different branch. No Storybook story uses the classes directly.

Earlier counts compared with three ways of counting at `c994c8ea`:

| Family | Earlier count | Text matches in `packages/mission-ui/src` | Text matches repo-wide (docs, tests, lint config) | Rendered instances (the "Uses" basis below) | Template sites |
|---|---|---|---|---|---|
| facts | 34 | **34**, confirmed | 106 | **8** | 7 |
| empty-state | 75 | **75**, confirmed | 263 | **25** | 17 |
| progress | 74 | **76**, corrected | 224 | **14** | 13 |

- **What the earlier figures were:** raw text matches in `src`. They count comments, local CSS selectors and every child class (`__term`, `__bar`, …) separately, so they are not use counts.
- **How "Uses" is counted:** one per place the family root is rendered. A shared helper counts once per caller.
- **Progress:** I couldn't reproduce the earlier 74. It was probably taken at an older commit; the clone is shallow, so I can't check.
- **Paths:** example paths are relative to `packages/mission-ui/src/elements/` unless they start with `packages/` or name a repo-root file.

### Facts

| Family | Modifier or state (role name) | Uses | What it does (one sentence) | Example paths | Notes |
|---|---|---|---|---|---|
| facts | facts stacked | 2 | The default layout puts each term above its value, in the Artifact inspector's File group and Mission group. | sk-artifact-screen/inspector-parts.ts | One template rendered twice. Local `min-width: 0` lets it shrink inside the inspector grid (E-27). |
| facts | facts two-col | 6 | Puts terms and values side by side in two columns. | sk-work-package-screen/facts-parts.ts, sk-work-package-screen/work-parts.ts, sk-drift-screen/detail-parts.ts | Every use replaces the library tracks: label about 0.8fr with its longest word as the minimum, value about 1.2fr with a minimum of 0. The override is declared in two files (facts-parts.ts, detail-parts.ts). |
| facts | facts compact | 0 | The library's denser spacing for terms and rows. | none | Defined by the library, never used. |
| facts | facts term | 8 | Each label cell of a pair. | sk-work-package-screen/facts-parts.ts, sk-artifact-screen/inspector-parts.ts | Written through a small helper in 4 files. |
| facts | facts term regular | 1 | The label is shown at normal weight instead of the library's medium. | sk-drift-screen/detail-parts.ts | E-37 grant G-8, sunset spec-kitty-design#523 (its comment). |
| facts | facts value mono | 2 | The value uses the mono face: always on Drift (at the screen's small size), and per fact in the inspector for paths. | sk-drift-screen/detail-parts.ts, sk-artifact-screen/inspector-parts.ts | Drift: E-37 G-8 (#523). Inspector: a mono flag on the fact wraps the value in a code element. |
| facts | facts value wrap | 2 | A long unbroken value (branch, handle, slug) wraps inside its column instead of widening it. | sk-work-package-screen/facts-parts.ts, sk-drift-screen/detail-parts.ts | Two different rules. Work Package screen: E-21 (`break-word`, kept on purpose, no sunset issue). Drift: E-39 (breaks anywhere, sunset #535). |
| facts | facts value ellipsis | 1 | Values wrap only between words or after a path separator; a single word wider than the column ends in an ellipsis, and the full value is in a tooltip. | sk-artifact-screen/inspector-parts.ts | Each word is wrapped in a span, with break hints after separators. E-29 ellipsis declarations plus "E-21 in spirit"; FR-034. |
| facts | facts value identifier | 3 | Holds machine values: lane id, lane and planning branches, file paths, mission id or slug, tracker refs, actor. | sk-work-package-screen/work-parts.ts, sk-drift-screen/detail-parts.ts, sk-artifact-screen/inspector-parts.ts | work-parts and the actor fact pass values through a "breakable" helper that inserts break hints. |
| facts | facts value tooltip | 1 | Each value carries its full text as a tooltip (title). | sk-artifact-screen/inspector-parts.ts | Pairs with the ellipsis variant. |
| facts | facts value pill | 2 | The value is a status pill (committed state) or a list of pills (dependencies, requirement refs). | sk-work-package-screen/facts-parts.ts | Holds `sk-pill-tag` elements. |
| facts | facts value action | 1 | The Mission value is a small ghost button that opens the Mission, or plain id text when there is no slug. | sk-drift-screen/detail-parts.ts | Holds an `sk-button` that calls a handler. |
| facts | facts row optional | 2 | A row is left out entirely when its value is absent. | sk-work-package-screen/facts-parts.ts, sk-drift-screen/detail-parts.ts | Decided in the template helper. CSS adds no fallback. |
| facts | facts group heading | 2 | A level-3 heading sits just above the list and names the group ("Authored", the inspector's Mission group). | sk-work-package-screen/facts-parts.ts, sk-artifact-screen/inspector-parts.ts | The heading is outside the list, in a grouping wrapper. |
| facts | facts group omitted | 2 | The whole list is dropped (Assignment), or replaced by an empty-state notice (Frontmatter), when every value is absent. | sk-work-package-screen/facts-parts.ts | Frontmatter falls back to "empty-state regional". |
| facts | facts workspace marker | 1 | A data attribute marks the Workspace list so tests and layout can target it. | sk-work-package-screen/work-parts.ts | Data hook only; no visual change of its own. |

**Contexts:**
- Artifact inspector, a narrow side column.
- Drift detail panel.
- Work Package screen cards: Facts, Assignment, Frontmatter, Workspace. In narrow tiers these become single cards.

**Facts total: 8 uses (7 template sites; 34 text matches in src).** Hard to replace with one element:
- **Container-dependent layout:** both two-column consumers replace the library's column tracks with their own, and the inspector needs `min-width: 0` from its grid parent. The element needs a way to set track sizing and to shrink inside a grid.
- **Values hold other elements:** buttons, pills, code, and per-word spans with break hints. So `ocelle-fact` must accept rich slotted content, not just text.
- **Three different long-value rules on three screens:** words-only with ellipsis and tooltip, `break-word`, and break-anywhere. A single default won't cover them; the element needs a stated wrap policy.
- **Absence is handled by the consumer:** omitted rows, omitted lists, swapped-in empty states.
- **Unused modifier:** `compact` is never used.

Stand-ins and the issues they cite:
- **E-17 (Work Package screen):** class-only allowance. Its sunset says only "sk-facts element — design-library issue to file".
- **E-27 (Artifact Viewer):** class-only allowance, sunset G-20 → **spec-kitty-design#523**.
- **E-29:** the inspector's ellipsis declarations (its raw pill button cites #524).
- **E-37 G-8 (Drift):** term weight and value face, → **#523**.
- **E-39:** break-anywhere, → **#535**.
- **E-21:** kept on purpose; no issue.
- **CP-1 ruling 4:** accepted drift DA-28 and DA-34, so the inspector keeps the library facts look.
- **#280** (responsive facts grid) is cited nowhere in kitty-mission-ui.

### Empty-state

| Family | Modifier or state (role name) | Uses | What it does (one sentence) | Example paths | Notes |
|---|---|---|---|---|---|
| empty-state | empty-state panel | 15 | Fills a whole screen or region with a state: loading, empty, not found, error, "choose an item", "clean". | sk-drift-screen/state-parts.ts, sk-missions-screen/sk-missions-screen.ts, sk-ops-screen/ops-state-parts.ts | Always inside a state wrapper (a data attribute for the state, plus `aria-busy` on the wrapper while loading). |
| empty-state | empty-state regional | 9 | A small body-only notice inside a card section ("no files", "no history", "no subtasks", nothing selected, empty document). | sk-work-package-screen/state-parts.ts, sk-artifact-screen/state-parts.ts, sk-work-package-screen/files-parts.ts | One shared helper per screen; 7 callers on the Work Package screen and 2 on the Artifact Viewer. Keeps the library's centred block padding inside a card. |
| empty-state | empty-state refusal | 1 | A refusal card: small uppercase mono eyebrow, h1 title, optional mono path, one sentence, optional Retry. Also shown when reading content fails. | sk-artifact-screen/refusal-parts.ts | Dashed card look is E-45. FR-015. |
| empty-state | empty-state heading h1 | 2 | The heading is the page's level-1 title. | sk-artifact-screen/refusal-parts.ts, sk-artifact-screen/state-parts.ts | |
| empty-state | empty-state heading h2 | 9 | The heading is a level-2 section title. | sk-drift-screen/state-parts.ts, sk-pipeline-screen/pipeline-parts.ts, sk-work-package-screen/state-parts.ts | |
| empty-state | empty-state heading paragraph | 1 | During in-pane content loading, the heading text is a plain paragraph because the pane already has a hidden h1. | sk-artifact-screen/state-parts.ts | Same template as the h1 row; it switches by state. The paragraph's id names the progress bar. |
| empty-state | empty-state no heading | 14 | No heading: a progress label stands in (5 loading panels), or it's a body-only regional notice (9). | sk-missions-screen/sk-missions-screen.ts, sk-work-package-screen/files-parts.ts | |
| empty-state | empty-state body multiple | 2 | Two body paragraphs in one state: "clean" plus a last-scan time; an empty-state body plus a skipped-items note. | sk-drift-screen/state-parts.ts, sk-ops-screen/ops-state-parts.ts | |
| empty-state | empty-state body optional | 2 | The body paragraph is shown only when there's text (Artifact state text; Drift's stale-selection note). | sk-artifact-screen/state-parts.ts, sk-drift-screen/state-parts.ts | |
| empty-state | empty-state action | 4 | A secondary or default button (Retry, Return to Pipeline, Return to Missions) is the last child. In 3 of the 4 it is disabled while the screen is inert. | sk-artifact-screen/refusal-parts.ts, sk-drift-screen/state-parts.ts, sk-work-package-screen/state-parts.ts | `sk-button` is a direct child, not inside the library's action wrapper. Consumers add their own top margin. |
| empty-state | empty-state action wrapper | 0 | The library's wrapper class for an action row. | none | Defined by the library, never used. |
| empty-state | empty-state inline | 0 | The library's left-aligned, padded inline notice. | none | Defined by the library, never used. The regional notices use the centred block instead. |
| empty-state | empty-state busy | 6 | Holds an indeterminate compact progress bar during loading; the parent wrapper carries `aria-busy="true"`. | sk-missions-screen/sk-missions-screen.ts, sk-pipeline-screen/pipeline-parts.ts, sk-ops-screen/ops-state-parts.ts | Nests the progress family. On the Artifact Viewer, `aria-busy` is bound true or false by state. |
| empty-state | empty-state message | 3 | A dashed-border card with no internal gap, for an empty list and for "no filter matches". | sk-missions-screen/sk-missions-screen.ts, sk-pipeline-screen/pipeline-parts.ts | Keyed on a data attribute. E-13, sunset **#510**. The no-match card sits above the list, not in place of it. |
| empty-state | empty-state card | 5 | Card fill, large radius, wide inline padding, and a bold heading in the display face. The border is solid while the parent is busy and dashed otherwise. | sk-missions-screen/sk-missions-screen.ts, sk-pipeline-screen/sk-pipeline-screen.ts | Look changes with the parent's `aria-busy`. E-13, sunset **#510**. The Projects screen copies these values onto its own non-empty-state panel (E-33 b, sunset #510). |
| empty-state | empty-state card dashed | 2 | A dashed card with fill and radius around the Artifact refusal and state blocks, with padding and border inside the box. | sk-artifact-screen/refusal-parts.ts, sk-artifact-screen/state-parts.ts | E-45, sunset: the library's panel or card paint gap (E-12 family, #509). |
| empty-state | empty-state ops card | 2 | Ops padding, a dashed border when idle and a solid one when busy, a bold heading with tighter line height, and no gap when idle. | sk-ops-screen/ops-state-parts.ts | Keyed on the parent's `aria-busy`. Selectors pinned by `packages/mission-ui/test/ops-part-selectors.test.ts`. "E-03 precedent". |
| empty-state | empty-state identifier | 3 | Shows a machine value: a mono file path, an agent-profile id in code with a tooltip, a last-scan time with the full timestamp as tooltip. | sk-artifact-screen/refusal-parts.ts, sk-ops-screen/ops-state-parts.ts, sk-drift-screen/state-parts.ts | Long ids live inside a centred block. |
| empty-state | empty-state focus target | 2 | The heading (Ops empty) or the progress block (Ops loading) is made focusable so the screen can move focus to it after a state change. | sk-ops-screen/ops-state-parts.ts | Uses `tabindex="-1"` and a data marker. |

**Contexts:**
- Whole-screen state panels on Missions, Pipeline, Drift, Ops, Work Package and Artifact Viewer, including the narrow Artifact document pane.
- Card sections on the Work Package screen.
- The Artifact document pane.
- The Missions list region, above the list.

**Empty-state total: 25 uses (17 template sites; 75 text matches in src).** Hard to replace with one element:
- **Nests progress:** 6 of the 25 hold an indeterminate progress bar.
- **Look depends on things outside the element:** card chrome on 3 screens comes from ancestor selectors keyed on the parent's `aria-busy` and on a data attribute (solid when busy, dashed when idle or a message). The element needs explicit `busy` and `message`/`card` variants, so ancestors don't style its insides.
- **Heading varies:** it can be an h1, an h2, or a paragraph standing in for one, or absent. So the heading level must be chosen by the consumer.
- **Actions are bare child buttons**, not the library's action wrapper.
- **Extra content:** the refusal block adds an eyebrow and a path that the library has no parts for.
- **Focus management:** Ops needs focusable children.
- **Unused modifiers:** `inline` and the action wrapper are never used.

Stand-ins and the issues they cite:
- **E-03 (Missions and Pipeline):** gap G-06, "No empty-state element". Its sunset is the library `sk-empty-state` element; the issue was "to be filed", and later became **#523**.
- **E-13:** the panel spacing, weight and card chrome, → **#510**.
- **E-17 (Work Package):** class-only allowance, same family sunset.
- **E-27 (Artifact):** → **#523**.
- **E-45:** dashed card, → the panel-paint family **#509**.
- **Ops:** class allowance "E-03 precedent" (lint override in `eslint.config.mjs`).
- **E-33 (b) (Projects):** → **#510**.

### Progress

| Family | Modifier or state (role name) | Uses | What it does (one sentence) | Example paths | Notes |
|---|---|---|---|---|---|
| progress | progress default | 1 | A stacked determinate bar with a label: the subtask "done of total" bar. | sk-work-package-screen/work-parts.ts | No layout modifier. |
| progress | progress narrow | 3 | The bar fills the available width in a narrow spot: shell footer, Mission row progress, Work Package card. | sk-mission-shell/shell-parts.ts, sk-pipeline-screen/pipeline-parts.ts, sk-work-package-board/card-parts.ts | Two of the three replace the layout with their own grid (see below). |
| progress | progress compact | 10 | Puts label and bar on one row. | sk-drift-screen/state-parts.ts, sk-projects-screen/row-parts.ts | Always used together with indeterminate, never alone. |
| progress | progress indeterminate | 10 | A sweeping bar for loading of unknown length; the bar has no value attribute. | sk-missions-screen/sk-missions-screen.ts, sk-mission-shell/shell-parts.ts, sk-projects-screen/state-parts.ts | The library animation respects reduced motion and forced colours. 2 of the 10 come from one shared busy helper on the Work Package screen. |
| progress | progress determinate | 4 | Shows value out of max: done/total, or a weighted percentage out of 100. | sk-mission-shell/shell-parts.ts, sk-pipeline-screen/pipeline-parts.ts, sk-work-package-board/card-parts.ts | |
| progress | progress meta | 2 | A percentage text after the bar. | sk-mission-shell/shell-parts.ts, sk-pipeline-screen/pipeline-parts.ts | Missing from every indeterminate use and from 2 determinate ones. |
| progress | progress external text | 1 | A "done/total" text sits next to the bar in a plain span, not the meta part. | sk-work-package-board/card-parts.ts | |
| progress | progress label | 12 | A visible label is tied to the bar by for/id. | sk-ops-screen/ops-state-parts.ts, sk-pipeline-screen/pipeline-parts.ts | |
| progress | progress labelled by heading | 1 | No label element; the bar takes its name from the nearby state heading through `aria-labelledby`. | sk-artifact-screen/state-parts.ts | The library says to add no ARIA; the consumer does anyway. |
| progress | progress aria-label | 1 | No label element; the bar is named with `aria-label` from the progress text. | sk-work-package-board/card-parts.ts | |
| progress | progress fallback text | 2 | The bar holds "done/total" text for browsers that don't draw it. | sk-work-package-screen/work-parts.ts, sk-work-package-board/card-parts.ts | |
| progress | progress heading | 1 | The whole progress block acts as a level-2 heading and is focusable, so Ops loading can take focus. | sk-ops-screen/ops-state-parts.ts | Uses role heading, aria-level 2, tabindex -1. |
| progress | progress inline | 1 | Rendered as an inline span inside a Projects list row while that project loads. | sk-projects-screen/row-parts.ts | The root is a span, not a block. |
| progress | progress in empty-state | 6 | Sits inside an empty-state panel as its loading cue. | sk-drift-screen/state-parts.ts, sk-pipeline-screen/pipeline-parts.ts, sk-work-package-screen/state-parts.ts | See "empty-state busy". |
| progress | progress in busy region | 3 | Sits directly in a region marked `aria-busy`, with no empty-state around it (Projects list, Work Package detail, shell status region). | sk-projects-screen/state-parts.ts, sk-work-package-screen/state-parts.ts, sk-mission-shell/shell-parts.ts | |
| progress | progress slotted | 2 | Placed in another element's slot: a Work Package card's reference slot, and the shell footer slot. | sk-work-package-board/card-parts.ts, sk-mission-shell/shell-parts.ts | |
| progress | progress grid layout | 2 | Consumer CSS places label, bar and meta on a named grid: label and percent on one row, bar below across the full width. | sk-mission-shell/sk-mission-shell.ts, sk-pipeline-screen/pipeline-parts.ts | Styles the internal parts from outside. |
| progress | progress centred | 1 | Consumer CSS centres the bar in its state card and lets it shrink. | sk-artifact-screen/state-parts.ts | |

**Contexts:**
- Shell footer, a narrow sidebar strip.
- Shell status region.
- Mission rows on the Pipeline screen.
- Work Package board cards.
- Projects list rows (inline) and the Projects list panel.
- Whole-screen loading panels.
- Work Package detail and subtasks card.

**Progress total: 14 uses (13 template sites; 76 text matches in src, not the earlier 74).** Hard to replace with one element:
- **Three ways of naming the bar:** label element, `aria-labelledby` pointing at an outside heading, `aria-label`.
- **Root takes other roles:** a focusable level-2 heading on Ops, an inline span inside a row on Projects.
- **Consumers lay out the parts:** two consumers grid-place label, bar and meta from outside, which an encapsulated element won't allow without parts or slots.
- **Placement and nesting:** it is slotted into other components and nested inside empty-state.
- **Modifiers always paired:** `compact` only ever appears with `indeterminate`.
- **Indeterminate means no value:** the value attribute is absent, not empty or zero.
- **Stylesheet adopted directly:** the shell, Drift and Artifact screens load the library stylesheet into their shadow roots (`packages/mission-ui/src/progress-sheet.ts`).

Stand-ins and the issues they cite:
- **Operator ruling 2026-10-02:** the shell may use the progress classes in one file (eslint).
- **E-02 / E-03 (Missions and Pipeline):** gap G-03, "No progress element (existing #498)", → **spec-kitty-design#498**.
- **E-17 (Work Package):** class-only allowance, same family sunset.
- **E-27 (Artifact):** → **#523**, which itself points to #498 for progress.
- **WP06 ruling 2026-10-08 (Projects):** progress classes allowed in the row and state part files.
- **Ops:** "library gap", E-03 precedent.

## Part B: spec-kitty-design issues

## spec-kitty-design#280: [TKP1] responsive facts-grid extension — grouped metadata that reflows without lost labels
- **State:** open. **Labels:** none. **Opened:** 2026-09-08 12:16 UTC by MOES-Media. **Closed:** not closed.
- **Links in the body:** #279 Epic: Work Package Detail — responsive committed facts and honest document states (open); #125 Finish shared component-library conversion (est. 20–30 hrs), test, push to npm; implement into Team Kitty during UI redesign (open); #176 [styles] Native semantic dashboard primitives — facts, disclosure, data-table, empty-state, skip-link (closed); #177 [elements] sk-card operational status tone axis — the surface a status card composes onto (closed); #213 [TKW5] Work Package detail primitives — breadcrumbs, prose, event history, and read-only checklist state (closed).
- **Cross-referenced by (timeline):**
  - #281 [TKP2] Work Package Detail pattern stories — committed prompt and exact-commit absence states (open)
  - #283 [TKL1] native responsive record-list styles — aligned ledgers with labelled narrow records (open)
  - #300 Epic: Teams and membership — static-path contract, status tones, and public-boundary surfaces (closed)
  - #335 Epic: Connectors — native choice/navigation primitives and truth-preserving patterns (open)
  - #336 [TKC1] native radio-choice-group styles — exactly-one form selection with real controls (closed)
  - #337 [TKC2] native section-navigation styles — linked local routes without tab semantics (closed)
  - #338 [TKC3] Connectors pattern stories — honest installation, routing and account states (closed)
  - #395 [TKK3] Mission Kanban ten-lane pattern extension — detailed workflow and visibly unverified overlay (open)
  - #276 Epic: Mission Kanban — native detailed filters and exact-state board patterns (open)
  - PR #413 feat(elements): Connectors C1-C9b pattern stories (closed)
  - #523 (see below)
  - #535 No wrap policy for long machine identifiers (slugs, ids, paths) in rows, headers and fact values (open)
- **Referencing commits:**
  - `72e7bf0c` and `19fcc9e8` "docs: reconcile #280/#307 dependency map against measured train state (#338)"
  - `8d4bc005` and `b081439c` "feat(elements): connectors C6-C9a installation detail family (#338)"
  - `bf251f33` "feat(elements): Connectors C1-C9b pattern stories (#413)"

### Body
> **Mission:** `work-package-detail-facts-grid` · part of #279 · tracks #125.
>
> **Branch:** cut `mission/work-package-detail-facts-grid` from the latest `train/elements-first`; PR back into the train.
> **Read first:** ADR-9, ADR-10, ADR-11, the current component-authoring recipe, #176, #177, #213 and #279.
> **Delivery:** one bounded Work Package and one PR.
> **Squad tier:** C — pre-merge.
>
> ## Evidence
>
> W1 presents four committed fact pairs in one horizontal strip. W2 preserves the same labels and values in a two-column narrow grid, with long machine values wrapping within their cells. Existing `.sk-facts` supports stacked and term/value two-column layouts, but not grouped fact cells that responsively reflow.
>
> ## Outcome and public contract
>
> Extend `.sk-facts` with a backward-compatible grid modifier and documented fact-pair wrapper using valid light-DOM `<dl>/<dt>/<dd>` semantics. Existing default, compact and `--two-col` output remains unchanged.
>
> - Each item groups one term/value pair while preserving native description-list semantics and source order.
> - The grid supports four, two and one-column arrangements based on available space, not route state.
> - Terms remain visible at every width; values wrap without overlap or page overflow.
> - Missing values are consumer-supplied text; CSS invents no fallback.
> - Layout/dividers use authoritative tokens and logical properties.
> - Surface/tone remains container-owned; compose `sk-card`/#177 where needed.
>
> ## Required stories and tests
>
> - Four-field W1 strip; W2 two-column; one-column constraint; one/three/eight facts; compact density; long key/value; link/status value; explicit unavailable value; forced colors; default dark and required `LightMode`.
> - Accessibility-tree assertions for one description list with paired terms/definitions and unchanged source order.
> - 200% zoom, long unbroken values, RTL/logical dividers and no document overflow.
> - Existing stacked, compact and `--two-col` baselines remain unchanged.
> - Add exemplars, stories and docs; update ratchets and regenerate applicable CSS modules/barrels.
>
> ## Dependencies and parallelization
>
> Depends on closed #176. It is independent of the other two epics' public components and may run in parallel. The Work Package Detail pattern issue consumes it after merge.
>
> ## Non-goals
>
> Data fetching; object-to-DOM rendering; schema/allowlist; sorting; editing; validation; truncation that hides values; inferred status/tone; table replacement; card ownership; or a custom `sk-facts` element.

### Comments
None.

### Requirements stated
- **Grid layout:** a grid layout that groups one term/value pair per item and reflows between four, two and one columns based on available space, not route state. ("The grid supports four, two and one-column arrangements based on available space, not route state.")
- **Semantics:** native description-list semantics and source order are preserved, with each item grouping exactly one pair. ("Each item groups one term/value pair while preserving native description-list semantics and source order.")
- **Narrow widths:** terms never disappear at any width, and values wrap without overlapping or overflowing the page. ("Terms remain visible at every width; values wrap without overlap or page overflow.")
- **Long values:** long machine values wrap within their cells, including in the two-column narrow grid. ("W2 preserves the same labels and values in a two-column narrow grid, with long machine values wrapping within their cells.")
- **Missing values:** the consumer supplies the text for a missing value; styling adds no placeholder. ("Missing values are consumer-supplied text; CSS invents no fallback.")
- **Tokens:** spacing and dividers come from tokens and use logical (RTL-safe) properties. ("Layout/dividers use authoritative tokens and logical properties.")
- **Surface:** the surface and tone belong to the container, so facts don't paint a card themselves. ("Surface/tone remains container-owned; compose `sk-card`/#177 where needed.")
- **Existing layouts unchanged:** default stacked, compact and two-column output stay as they are. ("Existing default, compact and `--two-col` output remains unchanged.")
- **Cases to cover:** a four-field strip, two columns, one column, 1/3/8 facts, compact density, long key/value, a link or status value, an explicit unavailable value, forced colours, dark and light mode. (Required stories and tests, first bullet.)
- **Accessibility tree:** one list with paired terms/definitions in unchanged order. ("Accessibility-tree assertions for one description list with paired terms/definitions and unchanged source order.")
- **Robustness:** 200% zoom, long unbroken values, RTL dividers, no document overflow. ("200% zoom, long unbroken values, RTL/logical dividers and no document overflow.")
- **No hidden truncation:** values are never truncated in a way that hides them. (Non-goals: "truncation that hides values".)
- **Scope note:** this issue explicitly rules out a custom `sk-facts` element. (Non-goals: "or a custom `sk-facts` element.") That conflicts with #523's ask.

## spec-kitty-design#498: No sk-progress element (class only); sk-status-indicator pulses an empty box without a marker
- **State:** open. **Labels:** none. **Opened:** 2026-10-01 14:49 UTC by MOES-Media. **Closed:** not closed.
- **Links in the body:** #470 Desktop V2 application-primitives consumer contract and immutable train handoff (open).
- **Cross-referenced by:** #523 (see below); MOES-Media/kitty-mission-ui#3 [Imported PR] feat(app-shell): shared mission shell — layouts, width tiers, drawer and flyout (#2) (closed).

### Body
> Found while building the shared Kitty Desktop / dashboard mission shell on `@spec-kitty/elements` 1.1.0-rc.10 against the approved Desktop V2 prototype (consumer context: #470). The consumer currently works around it locally under a scoped exception that sunsets when this is resolved.
>
> ## Gap
> 1. **No `sk-progress` element.** Progress exists only as the `.sk-progress` stylesheet class (`@spec-kitty/styles`, with `sk-progress-indeterminate-sweep`). The prototype uses it for loading states (indeterminate, compact, labelled) and for summary bars (determinate). A shadow-DOM consumer has to adopt the stylesheet into its own shadow root and write the class markup by hand, which project lint rules (no `class=` in element templates) otherwise forbid.
> 2. **`sk-status-indicator pulsing` without a marker** pulses the empty marker fallback box, which reads as a missing icon ("a blinking square").
>
> ## Ask
> - An `sk-progress` element: `value`/`max` (determinate) or no value (indeterminate), `compact`, a label slot, accessible name from the label, reduced-motion respected.
> - A default marker (e.g. a dot) for `sk-status-indicator` when none is slotted, or no box at all.
>
> ## Consumer workaround
> Imports `@spec-kitty/styles/progress/sk-progress.css?inline` as a constructed stylesheet and renders the `.sk-progress` markup, under a single-file ESLint exception.

### Comments
None.

### Requirements stated
- **Element, not classes:** progress becomes an element, so consumers don't adopt the stylesheet and write class markup by hand. ("An `sk-progress` element: …"; "A shadow-DOM consumer has to adopt the stylesheet into its own shadow root and write the class markup by hand.")
- **Determinate:** set by `value` and `max`. ("`value`/`max` (determinate)")
- **Indeterminate:** expressed by having no value at all. ("or no value (indeterminate)")
- **Compact:** a `compact` option. ("`compact`")
- **Label:** a label slot, and the accessible name comes from that label. ("a label slot, accessible name from the label")
- **Motion:** reduced-motion preferences are respected. ("reduced-motion respected")
- **Use cases:** labelled, compact, indeterminate loading states, and determinate summary bars. ("The prototype uses it for loading states (indeterminate, compact, labelled) and for summary bars (determinate).")
- **Out of scope for the three families:** a default marker for `sk-status-indicator` when pulsing without one, or no box at all. ("A default marker (e.g. a dot) for `sk-status-indicator` when none is slotted, or no box at all.")

## spec-kitty-design#510: Loading and empty panels: spacing and weight tokens
- **State:** open. **Labels:** none. **Opened:** 2026-10-03 18:00 UTC by MOES-Media. **Closed:** not closed.
- **Links in the body:** "spec-kitty-mission-ui (mission-ui#4)". That matches MOES-Media/kitty-mission-ui#4, Missions and Pipeline screens against the Mission Status contract (closed); see "Could not read".
- **Cross-referenced by:** #523 (see below).

### Body
> **Gap.** `.sk-progress--indeterminate` with its label and `.sk-empty-state` use library padding and heading weight; the
> prototype's loading and empty panels use a larger vertical rhythm and a lighter heading weight.
>
> **Ask.** A `density` or spacing token set for panels (`--sk-panel-padding-block`, `--sk-panel-heading-weight`) or a
> `variant="page"` for empty-state and the progress panel.
>
> **Local stand-in (exception E-13).** Token-only `padding-block`, `gap` and `font-weight` on the panel wrappers of the two
> screens. Removed when the tokens or variant ship.
>
> Source: the Missions and Pipeline screens in spec-kitty-mission-ui (mission-ui#4) use a scoped local stand-in until this lands; its exception sunsets on this issue.

### Comments
None.

### Requirements stated
- **Page-level panels:** loading and empty panels need more vertical space than the library default. ("the prototype's loading and empty panels use a larger vertical rhythm")
- **Heading weight:** panel headings need a different weight from the library default; the issue says lighter. ("and a lighter heading weight")
- **How to deliver it:** either panel tokens for block padding and heading weight, or a page variant of empty-state and the progress panel. ("A `density` or spacing token set for panels (`--sk-panel-padding-block`, `--sk-panel-heading-weight`) or a `variant="page"` for empty-state and the progress panel.")
- **Settable properties:** padding-block, gap and font-weight on the panel. ("Token-only `padding-block`, `gap` and `font-weight` on the panel wrappers")
- **Discrepancy with the code:** the E-13 CSS on `main` doesn't match this text. It makes the heading bold in the display face, which is heavier than the library's semibold. It sets inline padding, card fill, radius and dashed or solid borders. Treat the code as the record of what was actually built, and check with the operator which is wanted.

## spec-kitty-design#523: No sk-facts or sk-empty-state elements (styles-only families need class= in consumers)
- **State:** open. **Labels:** none. **Opened:** 2026-10-08 11:42 UTC by MOES-Media. **Closed:** not closed. **Comments:** 1.
- **Links in the body:** #498 (above); #280 (above); #510 (above); "spec-kitty-mission-ui (mission-ui#7)", which matches MOES-Media/kitty-mission-ui#7, Artifact Viewer screen against the Mission Status contract (closed).
- **Link in the comment:** MOES-Media/kitty-mission-ui#10, Drift screen against the Mission Status contract (closed).
- **Cross-referenced by:** nothing in the timeline.

### Body
> **Gap.** The library ships facts and empty-state only as styles-only families, with no elements. A consumer bans `class=` in its parts and so cannot adopt them without a class-only exception, and it re-implements their structure in each screen. Progress has the same shape and is tracked in #498. Related: #280 (responsive facts grid) and #510 (loading and empty panel tokens).
>
> **Ask.** `sk-facts` and `sk-empty-state` elements that carry the family looks, so that screens compose elements rather than classes.
>
> **Local stand-in until then (exception E-27).** Class-only allowances for the facts, empty-state and progress families in the parts files that draw them. They are removed when the elements ship.
>
> ---
>
> Source: the Artifact Viewer screen in spec-kitty-mission-ui (mission-ui#7) uses a scoped local stand-in until this lands; its exception sunsets on this issue.

### Comments
> MOES-Media, 2026-10-11 10:45 UTC: The Drift screen in MOES-Media/kitty-mission-ui#10 styles the Facts list with two more details that an `sk-facts` element could default: `dt` at normal weight (library 500, prototype 400), and `dd` in the mono face at `--sk-text-sm` (library sans 16 px). Long machine values (a mission slug) also need `overflow-wrap: anywhere` on the `dd`; a shared wrap utility for identifiers would cover it. Local stand-in: exception E-37 (grant G-8) and E-39.

### Requirements stated
- **Elements, not classes:** facts and empty-state become elements that carry the family looks, so screens compose elements instead of writing classes. ("`sk-facts` and `sk-empty-state` elements that carry the family looks, so that screens compose elements rather than classes.")
- **Shared structure:** the element owns the internal structure, so it isn't rebuilt in each screen. ("it re-implements their structure in each screen")
- **Progress:** progress needs the same treatment, tracked in #498. ("Progress has the same shape and is tracked in #498.")
- **Term weight:** fact terms default to normal weight (400), not 500. ("`dt` at normal weight (library 500, prototype 400)")
- **Value face and size:** fact values can use the mono face at the small text size, not sans at 16 px. ("`dd` in the mono face at `--sk-text-sm` (library sans 16 px)")
- **Long values:** long machine values in a fact break anywhere, ideally through a shared wrap rule for identifiers. ("Long machine values (a mission slug) also need `overflow-wrap: anywhere` on the `dd`; a shared wrap utility for identifiers would cover it.")

## Could not read
- **The exact library version kitty-mission-ui uses:** `@spec-kitty/styles` 1.1.0-rc.10 is published only on GitHub Packages, which needs an npm auth token. I deliberately didn't configure one. The library modifiers listed in Part A come from the `develop` branch source in spec-kitty-design, which may differ slightly from rc.10. The repo has no tag for rc.10.
- **"spec-kitty-mission-ui (mission-ui#4 / #7)"** in #510 and #523: `spec-kitty/spec-kitty-mission-ui` returns 404, so it was renamed, is private, or is out of reach. I matched the references to MOES-Media/kitty-mission-ui #4 and #7 by their titles, but that match is an inference.
- **The earlier progress count of 74:** I couldn't reproduce it. The clone is shallow (only the head commit), so I couldn't count at older commits. At `c994c8ea` the same counting basis gives 76.
- **Edit history:** the API gives no earlier versions of edited issue text. The #523 comment shows no edits (its created and updated times are the same). The issue bodies are quoted as they read on 2026-11-14.
- **Images:** none of the four issues or the comment contains an image, so there was no alt text to report.
