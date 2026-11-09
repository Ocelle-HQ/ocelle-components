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
// statements) and the CHANGELOG entry naming it. Whitespace is normalised, so a fragment may wrap across lines.
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
  "Tables of three or more columns overflow at 320 px, so they scroll and, with no focusable content, are tab stops",
  "The keyboard model of prose tables is guaranteed only in Chromium hosts. WebKit hosts (Kitty Desktop on macOS and Linux) add `tabindex=\"0\"` to tables in their renderer; this is an open limitation for kitty-mission-ui",
  "Print is out of scope: prose tables are screen scroll boxes, so a printed document shows only the columns that fit the page, and a host that prints adds its own print rule",
];

describe("packages/styles/README.md", () => {
  const readme = flat(read("README.md"));

  it.each(fragments)("states: %s", (fragment) => {
    expect(readme).toContain(fragment);
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
});
