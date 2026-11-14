import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { expectedTokens, excludedNames } from "./expected.ts";

// The package documentation (research.md R-15, contracts/token-package.md § Host contract, FR-025): the README states
// the host contract (load once, the theme rule, the color-scheme hand-off to #6, forced colours and the box-shadow
// caveat, the rendered brand rules, and from phase 4 the font's CSP allowance `font-src 'self'`, FR-012), and the
// changelog's "Unreleased" section lists every token under "Added".
// Whitespace is normalised, so a fragment may wrap across lines.
/** A package file's text; empty while it does not exist, so each assertion below reports what is missing. */
function read(file: string): string {
  const url = new URL(`../${file}`, import.meta.url);
  return existsSync(url) ? readFileSync(url, "utf8") : "";
}
const flat = (text: string): string => text.replace(/\s+/g, " ");

const fragments = [
  // load once
  "Load `tokens.css` once on the document",
  "Elements read the tokens by inheritance",
  // the theme rule
  "follows the system setting (`prefers-color-scheme`)",
  "light when the system states no preference",
  '`data-theme="light"` or `data-theme="dark"` on `<html>` overrides the system setting',
  "Any other value, or the attribute on another element, has no effect",
  // the color-scheme hand-off
  "The stylesheet sets no `color-scheme` property",
  "`--ocelle-color-scheme` is `light` or `dark` with the theme",
  // 003 (research.md R-14, contracts/styles-package.md § `@ocelle/tokens` additions): the hand-off names its stylesheet
  "`@ocelle/styles` `base.css` applies it with `color-scheme: var(--ocelle-color-scheme)` on the root",
  // CSP of the stylesheet
  "`style-src 'self'`",
  // CSP allowance of the font (FR-012, US2 scenario 6)
  "the font needs `font-src 'self'`",
  "Without `font-src`, text renders in the fallback families of `--ocelle-font-sans` and the only violation is the font file",
  // forced colours
  "The tokens never override the system palette in forced colours",
  "`box-shadow` is not drawn in forced colours",
  "the rings and shadows of the `elevation-*` tokens vanish there",
  "must also draw a border or outline",
  // rendered brand rules
  "The top bar, the icon rail and the personal rail use the chrome tokens in both themes",
  "Digests are shown in groups of four",
  "In light mode the ochre fill is never the only mark of a state",
  // 008 (tasks.md T033, T035): the drawer's inline size
  "`--ocelle-drawer-inline` is the inline size of `ocelle-drawer`, the sidebar width `--ocelle-shell-sidebar-width`",
  "A control drawn on `color-accent-low`, `color-inset`, `color-hover-bg`, `color-danger-bg`, `color-warning-bg`, `color-success-bg`, `color-info-bg` or `color-neutral-bg` is bordered with `color-accent-strong`",
];

describe("packages/tokens/README.md", () => {
  const readme = flat(read("README.md"));

  it.each(fragments)("states: %s", (fragment) => {
    expect(readme).toContain(fragment);
  });
});

describe("packages/tokens/CHANGELOG.md", () => {
  const changelog = read("CHANGELOG.md");
  const unreleased = /^## Unreleased\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(changelog)?.[1] ?? "";
  const added = /^### Added\n([\s\S]*?)(?=^### |(?![\s\S]))/m.exec(unreleased)?.[1] ?? "";

  it("names every token as added in the Unreleased section (FR-025)", () => {
    const named = new Set([...added.matchAll(/`(--ocelle-[a-z0-9-]+)`/g)].map((match) => match[1]));
    expect([...named].sort()).toEqual(expectedTokens.map((token) => `--ocelle-${token.name}`).sort());
  });

  it("names no excluded token (A.6)", () => {
    expect(excludedNames.filter((name) => changelog.includes(`--ocelle-${name}\``))).toEqual([]);
    expect(changelog).toContain("## Unreleased");
  });
});
