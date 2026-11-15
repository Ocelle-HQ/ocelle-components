# Contract: checks (tests, oracles, plants, stories, gates)

Names of files and driver functions follow 013's on `main`; T001 rechecks them (R-14).

## Harnesses

Each shared scenario body in `test/scenarios/<element>.ts` runs twice:

- in process, on the element source, through `test/<element>.test.ts` (the `elements` project, mutated);
- on the built browser build, on strict-CSP fixture pages, through `test/browser/<element>.test.ts`.

Each body is named after its scenario (`US1-4 …`) or its edge case. Every acceptance scenario and every edge case
that states behaviour has a body (FR-052).

## Oracles

| Oracle | Used by | How |
|---|---|---|
| AX tree, table | US1-1, US1-4, US1-6, US1-7, US1-15, US1-16 | The full Chromium AX tree: compare the element's subtree with the same table outside; region `group` and name |
| `itemTexts(list)` (new, R-11) | US2-1, US2-3, US2-10, US3-1, US3-10 | `StaticText` names under each `listitem`, joined, collapsed and trimmed. Each assertion also checks the text is not empty |
| computed style | US1-2, US1-3, US1-10, US1-14, US2-3, US3-2, US3-4 | `getComputedStyle` on cells, headers, caption, time, marker and chip, against the token's computed value read from a probe |
| geometry | US1-4, US2-2, US3-2, US3-3, US3-4, ordinal fit | `getBoundingClientRect`: marker size, centring on the first line, connector ends inside the chain, chip block size < `size-step`, the ordinal box inside the marker's padding box |
| scroll width | US1-4, US2-4, US3-3, 640 px bodies | page `scrollWidth === innerWidth` |
| keyboard | US1-5, US1-8, US1-13, US2-7 | 009's and 013's `pressTab`, `focused` and arrow-key helpers; `scrollLeft` before and after |
| copy | US1-9, US2-4 | 013's `copy` |
| forced colours | US1-11, US2-8, US3-8 | `emulateMedia({ forcedColors: "active" })`: system colours, lines visible |
| contrast | US2-8, US3-8 | token-pair lookup in the token source (the contrast gate's data), not pixels |

The bodies that pass on light DOM alone also assert something only the element gives: the region's role, the list
role and name, the marker's existence and size, or an ordinal.

## Plants (CSS-only behaviour Stryker does not mutate)

| Plant | Must fail |
|---|---|
| The `fit-content` track rule removed (R-03) | US1-9 |
| The prose override removed, or one property of it removed (node test lists each) | US1-10, prose-override node test |
| The data-table block's `:where()` removed from the cell selector | US1-14 |
| The header selection's `scope="row"` rule placed before the column-header rule | the corner-header body |
| `overflow-wrap` set on header cells too | the FR-007 header body |
| The marker's `aria-hidden` removed | US2-1, US3-1 |
| The connector shown on the last `<li>` | US2-2 |
| `data-line-end` never set | US3-3 |
| The ordinal counting only default steps | US3-6 |
| The chip radius changed to `radius-pill` | US3-4 |
| The chip block padding raised to `space-1` | US3-4 (block size) |
| `role="list"` removed | the explicit-role body |
| A blank host `aria-label` treated as decisive | US2-10, US3-10 |

## Stories (FR-050)

In `storybook/stories/<element>.stories.ts`, each in light and dark:

- **Data table:**
  - fits;
  - overflows (named by `label`);
  - named by its caption;
  - unnamed but captioned (named by the caption);
  - row headers;
  - corner header;
  - `wrap="anywhere"`;
  - inside prose;
  - right-to-left;
  - empty body;
  - 320 px.
- **Timeline:**
  - three events;
  - an event without a time;
  - a long identifier with `wrap`;
  - a link in an event;
  - one event;
  - right-to-left;
  - 320 px.
- **Chain:**
  - six steps in one row;
  - wrapped at 320 px;
  - mixed chips;
  - all chips;
  - twenty steps;
  - a long step;
  - `wrap`;
  - right-to-left;
  - unnamed.

The item elements' states are in their container's file. A standalone item has no story (FR-050). No story sets a
blank or decisive host `aria-label` unless the phase 2 spike shows axe is clean on it (R-09). The story test checks
presence in light and dark, 320 px reflow of each container story, and that every list in every story has a name
except the unnamed chain story.

## Gates per phase

| Gate | When |
|---|---|
| `gate:unit-tests`, `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:test-lint`, `gate:csp`, `gate:prefix`, `gate:manifest`, `gate:contrast`, `gate:brand-rules` | every phase |
| `gate:storybook-build`, `gate:visual`, `gate:axe` | phases 1 to 3, with the phase's baselines from `visual:update` in #10's pinned container under docker |
| `gate:plants -- --affected <phase base>` (op 016), `--list` recorded in `reviews/phase-<N>/plants.md` | every phase; never a full local `gate:plants` |
| `gate:mutation` | every phase, under #23 and op 015 |
| `gate:signoff` | every commit signed off |
