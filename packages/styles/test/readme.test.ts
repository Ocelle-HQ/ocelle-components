import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The package documentation (003 research.md R-14, contracts/styles-package.md § Host contract; spec FR-004, US1
// scenario 6's documentation half): the README states the host contract and the CHANGELOG's Unreleased section names
// what is added. The statements grow red first with the phases; phase 2 checks the link order, the CSP, the tokens
// version (and that the workspace:0.0.0 pin becomes meaningful at the first release, #11), the base layer and its
// specificity, the custom-element hosts (plan decision 16) and the CHANGELOG entry naming base.css; phase 3 adds the
// density and value hooks (their values, that any other value does nothing, what the compact-scale family styles and
// its tokens, the main-grounds limit) and the CHANGELOG entries naming both attributes; phase 4 adds the prose hook
// (its value, what the prose family styles and its tokens, prose over compact, the <html> placement, the host-width
// cause sentence, asserted as the cause and not as the list of examples, the three-column, WebKit and print
// statements) and the CHANGELOG entry naming it; phase 5 adds the identifier-wrap hook (its value, what the family
// styles and that it uses no token, FR-020's list, the value-hook combination), the SC-006 table mapping
// kitty-mission-ui's stand-ins E-23, E-37 and E-39 to the hooks and tokens that replace them, the hook table with
// exactly the four hooks and their values, and the CHANGELOG entry naming data-ocelle-wrap, so all four hooks are
// documented (US1 scenario 6); its first review adds the base layer's token list and the host-width remedy with its
// "not a complete list" qualifier, the list of examples itself still unasserted (plan decision 14). Whitespace is normalised, so a fragment may wrap across lines.
/** A package file's text; empty while it does not exist, so each assertion below reports what is missing. */
function read(file: string): string {
  const url = new URL(`../${file}`, import.meta.url);
  return existsSync(url) ? readFileSync(url, "utf8") : "";
}
const flat = (text: string): string => text.replace(/\s+/g, " ");

const fragments = [
  // link order (FR-001, FR-025)
  'Link `tokens.css` first, then `base.css`, both on the document: `<link rel="stylesheet" href="…/tokens.css">` and then `<link rel="stylesheet" href="…/base.css">`',
  "Linked the other way round, the computed result is the same once both have loaded",
  "Linked without `tokens.css`, the reset and a visible focus outline still apply, but no token value does",
  // CSP (constitution IV, plan decision 15)
  "`style-src 'self'` for both stylesheets",
  "`font-src 'self'` for the tokens' font",
  "No inline style and no script",
  "`base.css` needs no `img-src`; a host page that shows its own images adds `img-src 'self'`",
  // tokens version (FR-001, plan decision 11)
  "`base.css` needs the `@ocelle/tokens` version that adds `line-height-compact`, `line-height-prose`, `font-size-subhead`, `measure-reading`, `measure-cell` and `measure-container`",
  "The package declares it as an exact peer dependency, `\"@ocelle/tokens\": \"workspace:0.0.0\"`",
  "Both packages stay at 0.0.0 until the first release (#11), so the pin becomes meaningful at that release",
  // base layer (FR-006 to FR-011, FR-026, FR-025)
  "The base layer applies with no hook: the reset, the body, the root `color-scheme`, the focus ring, code elements in Schibsted Grotesk with tabular figures, and forced colours",
  "It adds no motion",
  "Tokens it uses: `--ocelle-color-scheme`, `--ocelle-font-sans`, `--ocelle-font-size-md`, `--ocelle-line-height-normal`, `--ocelle-color-ink`, `--ocelle-color-canvas`, `--ocelle-figures`, `--ocelle-focus-width`, `--ocelle-color-focus` and `--ocelle-focus-offset`",
  "Every base selector has specificity (0,0,0), except the box-sizing rule's `:where(*)::before` and `:where(*)::after` at (0,0,1), so any rule of the host page's own stylesheets overrides it",
  // custom-element hosts (plan decision 16)
  "The base layer does not reach into shadow roots, but it styles each element's host, which is in the light DOM: the `box-sizing` reset on every host, and the focus ring on a host that is itself focusable",
  "For normal declarations the page's rules beat a shadow tree's `:host` rules whatever their specificity, so an element's own stylesheet cannot override them",
  "Elements put their focusable part inside the shadow root or use `delegatesFocus`, and do not depend on their host's `box-sizing`",
  // phase 3: the density and value hooks (FR-004, FR-005, FR-012, FR-013; research.md R-02, R-04, R-14)
  "Each hook is one `data-ocelle-` attribute and applies only with one of its documented values. Any other value of a hook attribute, `\"true\"` among them, has no effect",
  "Hook selectors have specificity (0,1,0)",
  "`data-ocelle-density` takes `compact` or `regular`",
  "`data-ocelle-density=\"compact\"` sets the compact scale on the element, and its descendants inherit it: `--ocelle-font-size-sm` (14 px) with `--ocelle-line-height-compact` (1.5)",
  "On `<html>` the hook sets the compact scale on the body instead, so the root font size never changes and every `rem` token keeps its value (`--ocelle-target-min` stays 44 px)",
  "`data-ocelle-density=\"regular\"` returns a region nested in a compact one to the regular scale: `--ocelle-font-size-md` (16 px) with `--ocelle-line-height-normal` (1.45)",
  "`data-ocelle-value` takes the empty value (a bare attribute has it) or `ink`",
  "`data-ocelle-value=\"\"` sets the value text style: `--ocelle-font-sans` at `--ocelle-font-size-sm` with `font-variant-numeric: var(--ocelle-figures)`, in `--ocelle-color-ink-muted`",
  "`data-ocelle-value=\"ink\"` sets the same style in `--ocelle-color-ink`",
  "The value hook is for the main grounds only (canvas, sheet, pane, panel, inspector, rail, inset, accent-low, hover-bg), not the chrome (the top bar, the icon rail and the personal rail), where light `ink` is 1.00:1 and `ink-muted` 2.64:1",
  "Tokens the compact scale uses: `--ocelle-font-size-sm`, `--ocelle-line-height-compact`, `--ocelle-font-size-md`, `--ocelle-line-height-normal`, `--ocelle-font-sans`, `--ocelle-figures`, `--ocelle-color-ink-muted` and `--ocelle-color-ink`",
  // phase 4: the prose hook (FR-004, FR-005, FR-014 to FR-019, FR-024; research.md R-02, R-06, R-14)
  "| `data-ocelle-prose` | (empty) | prose |",
  "`data-ocelle-prose` takes the empty value only (a bare attribute has it)",
  "The prose family styles a rendered Markdown document by element, with no class: `h1` to `h6`, `p`, `ul`, `ol`, `li`, `blockquote`, `code`, `pre`, `hr`, links (an `a` with an `href`), `table`, `caption`, `th` and `td`",
  "It sets no rule of its own for `img`, `strong`, `em`, `del` or a task list's checkbox",
  "Tokens the prose family uses: `--ocelle-font-size-md`, `--ocelle-line-height-prose`, `--ocelle-line-height-tight`, `--ocelle-space-6`, `--ocelle-space-3`, `--ocelle-font-size-2xl`, `--ocelle-font-weight-display`, `--ocelle-font-size-subhead`, `--ocelle-font-weight-strong`, `--ocelle-font-size-fact`, `--ocelle-space-4`, `--ocelle-measure-reading`, `--ocelle-bar-width`, `--ocelle-color-rule-strong`, `--ocelle-color-ink-soft`, `--ocelle-border-width`, `--ocelle-color-rule`, `--ocelle-color-link`, `--ocelle-color-link-hover`, `--ocelle-color-inset`, `--ocelle-space-1`, `--ocelle-radius-2`, `--ocelle-focus-width`, `--ocelle-measure-container`, `--ocelle-measure-cell`, `--ocelle-space-2`, `--ocelle-font-size-xs` and `--ocelle-figures`",
  "When the compact and prose hooks are nested, the nearest hook decides the size and line height of the text inside it",
  "On an element that carries both the prose hook and the compact hook, the prose hook wins: the element is a prose container at 16 px with a line height of 1.65",
  "The prose hook goes on a content container, not on `<html>`: on `<html>` its container rule does not apply, so it sets neither the root font size nor the root line height",
  "A prose container must not be sized from its content (shrink-to-fit or fit-content sizing); it gets its width from its context",
  "In a box sized from its content, a table that would fit is cut down, scrolls and becomes a tab stop",
  // the remedy and the qualifier, asserted on their own so that the list of examples between them stays unasserted
  // (plan decision 14)
  "Examples of such boxes, not a complete list:",
  "Give such a box a definite width or stretch it",
  "Tables of three or more columns overflow at 320 px, so they scroll and, with no focusable content, are tab stops",
  "The keyboard model of prose tables is guaranteed only in Chromium hosts. WebKit hosts (Kitty Desktop on macOS and Linux) add `tabindex=\"0\"` to tables in their renderer; this is an open limitation for kitty-mission-ui",
  "Print is out of scope: prose tables are screen scroll boxes, so a printed document shows only the columns that fit the page, and a host that prints adds its own print rule",
  // phase 5: the identifier-wrap hook (FR-004, FR-005, FR-020; research.md R-02, R-14)
  "`data-ocelle-wrap` takes `anywhere` only",
  "`data-ocelle-wrap=\"anywhere\"` sets `overflow-wrap: anywhere` on the element, so a machine identifier (a mission slug, an id, a path) breaks anywhere when it would overflow: it never widens its grid column or row, never overflows at 200% zoom, and is never cut by an ellipsis",
  "Selecting and copying it gives the full, unchanged identifier",
  "It sets no `word-break`, no `hyphens: auto`, no `text-overflow: ellipsis` and no `white-space: nowrap`",
  "It works in any container, inside prose and compact regions included, and keeps the size and line height of the text around it",
  "It sets no font property, so an identifier that needs tabular figures combines it with `data-ocelle-value`",
  "The identifier-wrap family uses no token: `overflow-wrap: anywhere` is a keyword",
  // 013 phase 1: the facts value hooks of the density rules and the facts rule before upgrade (FR-008, FR-012;
  // research.md R-03, R-07; tasks.md T009)
  "`data-ocelle-density=\"compact\"` also sets the value hooks of `ocelle-facts`: `--ocelle-facts-value-size` to `--ocelle-font-size-sm` and `--ocelle-facts-value-line-height` to `--ocelle-line-height-compact`, so fact values inside the region take the compact scale",
  "`data-ocelle-density=\"regular\"` sets them back to `--ocelle-font-size-fact` and `--ocelle-line-height-normal`",
  "Before the elements are defined, `base.css` shows each `ocelle-fact` child of an undefined `ocelle-facts` as a block, one value per line: `:where(ocelle-facts:not(:defined) > ocelle-fact:not([hidden])) { display: block; }`",
  "The whole selector is inside `:where()`, so its specificity is (0,0,0) and any page rule overrides it, and a fact with `hidden` keeps the user-agent `display: none`",
  "Labels are attributes, so they appear only once the elements are defined",
  // 019 phase 1: the data-table rules (contracts/styles-data-table.md; research.md R-06, R-07, R-18 to R-20; tasks.md T011)
  "`base.css` styles the direct `<table>` child of an `ocelle-data-table`, defined or not, with compact cells, eyebrow column headers in the eyebrow tokens, row headers and a rule between rows",
  "Every data-table selector is inside `:where()`, so its specificity is (0,0,0) and any rule of the page on the same element wins; a table nested in a cell is not styled",
  "Inside a `data-ocelle-prose` container an override at (0,1,0), placed after the prose rules, restates each data-table value, so a consumer rule there needs a specificity above (0,1,0), or (0,1,0) placed after `@ocelle/styles`",
  "The rule below the last row is removed from the last row of the table's last row group, in source order: write a `<tfoot>` after the `<tbody>` groups, as HTML says",
  "Before upgrade the table is styled the same, with no scroll region",
  "Base-style hook: the caption's cap reads `--data-table-box-size` and `--data-table-end-fade`, which `ocelle-data-table` writes on its track. Both names are public surface of `@ocelle/elements` and `@ocelle/styles` (a rename is a breaking change), and a consumer does not set them",
  "The caption is never narrower than its longest word, whatever the cap, so that word widens the table",
  "Chromium names each column header by its drawn upper-case text, so the accessible names of column headers follow the upper case (\"ID\" for \"Id\")",
  "`sticky-header` pins the `<thead>` on a `--ocelle-color-sheet` ground, in the separated border model (`border-collapse: separate`, `border-spacing: 0`), while the page bounds the host's block size with its own `block-size` or `max-block-size`",
  "The pinned header sits at the region's block-start edge once scrolled and keeps the focus ring's room above it at rest",
  "`striped` gives each `<tbody>`'s even rows the `--ocelle-color-inset` ground, hidden rows counted",
  "A hovered body row takes the `--ocelle-color-hover-bg` ground, only on a device that can hover; on a touch screen nothing changes",
  "In the light theme `hover-bg` and `inset` are equal, so a hovered striped row shows no change there",
  "In forced colours a band at the start of each body row stands in for both: `Canvas`, `CanvasText` on a striped row and `Highlight` on the hovered row; it scrolls away with a row scrolled sideways",
  // 019 phase 1: the numeric-cell hook (R-19, IQ-3)
  "`data-ocelle-align=\"end\"` end-aligns a cell with tabular figures, on any element; it sets no font, colour, padding or wrap",
  "Its selector has specificity (0,1,0) and comes after the data-table prose override, so it wins inside prose too",
  // 019 phase 2: the timeline before upgrade (research R-08; contracts/ocelle-event-timeline.md § Before upgrade; tasks.md T035)
  "Before the elements are defined, `base.css` shows each visible `ocelle-timeline-event` child of an undefined `ocelle-event-timeline` as a block, one event per line: `:where(ocelle-event-timeline:not(:defined) > ocelle-timeline-event:not([hidden]):not([aria-hidden=\"true\"])) { display: block; }`",
  "An `aria-hidden=\"true\"` event is not shown before upgrade either, as after it: `:where(ocelle-event-timeline:not(:defined) > ocelle-timeline-event[aria-hidden=\"true\"]) { display: none; }`",
  "An event's `time` attribute is rendered in its shadow root, so it shows only once the elements are defined; a slotted time (`slot=\"time\"`) is the page's own node and shows inline where it is written",
  // 019 phase 3: the chain before upgrade (research R-08; contracts/ocelle-evidence-chain.md § Before upgrade; tasks.md T059)
  "Before the elements are defined, `base.css` shows each visible `ocelle-evidence-step` child of an undefined `ocelle-evidence-chain` as a block, one step per line, with no marker or ordinal: `:where(ocelle-evidence-chain:not(:defined) > ocelle-evidence-step:not([hidden]):not([aria-hidden=\"true\"])) { display: block; }`",
  "An `aria-hidden=\"true\"` step is not shown before upgrade either, as after it: `:where(ocelle-evidence-chain:not(:defined) > ocelle-evidence-step[aria-hidden=\"true\"]) { display: none; }`",
];

/** The hook table of the README (FR-004): each hook's attribute, its values and its family, exactly. */
const hookRows = [
  "| `data-ocelle-density` | `compact`, `regular` | compact scale |",
  "| `data-ocelle-value` | (empty), `ink` | compact scale |",
  "| `data-ocelle-prose` | (empty) | prose |",
  "| `data-ocelle-wrap` | `anywhere` | identifier wrap |",
  "| `data-ocelle-align` | `end` | numeric cells |",
];

/** SC-006: each of kitty-mission-ui's local stand-ins with the hooks and tokens that replace it. */
const standInRows = [
  "| E-23 | `data-ocelle-prose` (`--ocelle-measure-reading`, `--ocelle-line-height-prose`, `--ocelle-measure-cell`) |",
  "| E-37 | `data-ocelle-density=\"compact\"` and `data-ocelle-value` (`--ocelle-line-height-compact`) |",
  "| E-39 | `data-ocelle-wrap=\"anywhere\"` |",
];

/** The table rows of one `##` section of the README, as written, without the header and the separator rows. */
function tableRows(text: string, heading: string): string[] {
  const section = new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m").exec(text)?.[1] ?? "";
  const rows = section.split("\n").filter((line) => line.startsWith("|"));
  return rows.slice(2);
}

describe("packages/styles/README.md", () => {
  const readme = flat(read("README.md"));

  it.each(fragments)("states: %s", (fragment) => {
    expect(readme).toContain(fragment);
  });

  it("US1-6: the hook table lists exactly the five hooks (019 adds data-ocelle-align, IQ-3), each with its exact attribute name and values (FR-004)", () => {
    expect(tableRows(read("README.md"), "Hooks")).toEqual(hookRows);
  });

  it("019: has a § Numeric cells section for the data-ocelle-align hook (IQ-3) and a § Data tables section", () => {
    expect({ numeric: /^## Numeric cells$/m.test(read("README.md")), tables: /^## Data tables$/m.test(read("README.md")) }).toEqual({ numeric: true, tables: true });
  });

  it("SC-006: maps each of kitty-mission-ui's stand-ins E-23, E-37 and E-39 to the hooks and tokens that replace it", () => {
    expect(readme).toContain("kitty-mission-ui's local stand-ins");
    expect(tableRows(read("README.md"), "Replacing kitty-mission-ui's stand-ins")).toEqual(standInRows);
  });

  it("names the tokens version of package.json's peer dependency", () => {
    const manifest = JSON.parse(read("package.json")) as { peerDependencies?: Record<string, string> };
    const pin = manifest.peerDependencies?.["@ocelle/tokens"];
    expect(pin).toBe("workspace:0.0.0");
    expect(readme).toContain(`"@ocelle/tokens": "${String(pin)}"`);
  });
});

describe("packages/styles/CHANGELOG.md", () => {
  const changelog = read("CHANGELOG.md");
  const unreleased = /^## Unreleased\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(changelog)?.[1] ?? "";
  const added = /^### Added\n([\s\S]*?)(?=^### |(?![\s\S]))/m.exec(unreleased)?.[1] ?? "";

  it("names the base.css export under Unreleased / Added (constitution VII, FR-004)", () => {
    expect(added).toMatch(/^- `base\.css`/m);
  });

  it("names the data-ocelle-density and data-ocelle-value hooks under Unreleased / Added (constitution VII, FR-004)", () => {
    expect(added).toMatch(/^- `data-ocelle-density`/m);
    expect(added).toMatch(/^- `data-ocelle-value`/m);
  });

  it("names the data-ocelle-prose hook under Unreleased / Added (constitution VII, FR-004)", () => {
    expect(added).toMatch(/^- `data-ocelle-prose`/m);
  });

  it("names the facts value hooks and the facts rule before upgrade under Unreleased / Added (013 R-07, constitution VII)", () => {
    expect({ hooks: /^- The `ocelle-facts` value hooks/m.test(added), upgrade: /^- `ocelle-facts` before upgrade/m.test(added) }).toEqual({ hooks: true, upgrade: true });
  });

  it("names the data-ocelle-wrap hook under Unreleased / Added, so each of the four hooks is named (constitution VII, FR-004)", () => {
    expect(added).toMatch(/^- `data-ocelle-wrap`/m);
    expect([...added.matchAll(/^- `(data-ocelle-[a-z]+)`/gm)].map((match) => match[1])).toEqual(["data-ocelle-density", "data-ocelle-value", "data-ocelle-prose", "data-ocelle-wrap", "data-ocelle-align"]);
  });

  // 019 phase 2 (constitution VII; research R-08; tasks.md T035, T043).
  it("names the timeline rules before upgrade under Unreleased / Added (019 phase 2)", () => {
    expect(added).toMatch(/^- `ocelle-event-timeline` before upgrade/m);
  });

  // 019 phase 3 (constitution VII; research R-08; tasks.md T059, T066).
  it("names the chain rules before upgrade under Unreleased / Added (019 phase 3)", () => {
    expect(added).toMatch(/^- `ocelle-evidence-chain` before upgrade/m);
  });

  // 019 phase 1 (constitution VII; analysis I7 (a); IQ-3; tasks.md T011, T017).
  it("names the data-table blocks, the base-style hook --data-table-box-size / --data-table-end-fade and the data-ocelle-align hook under Unreleased / Added (019)", () => {
    expect({
      blocks: /^- The `ocelle-data-table` rules/m.test(added),
      hook: /^- The base-style hook `--data-table-box-size` and `--data-table-end-fade`/m.test(added),
      align: /^- `data-ocelle-align`/m.test(added),
    }).toEqual({ blocks: true, hook: true, align: true });
  });
});
