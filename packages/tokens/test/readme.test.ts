import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { expectedTokens, excludedNames } from "./expected.ts";

// The package documentation (research.md R-15, contracts/token-package.md § Host contract, FR-025): the README states
// the host contract (load once, the theme rule, the color-scheme hand-off to #6, forced colours and the box-shadow
// caveat, the rendered brand rules, and from phase 4 the font's CSP allowance `font-src 'self'`, FR-012), and the
// changelog's "Unreleased" section lists every token under "Added". 012 (research.md R-08) adds the roles of the four
// control colour tokens. 018 adds the status indicator's dot size and pulse duration, the pill tag's compact line
// height and the interactive pill tag's minimum target.
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
  // 008 (tasks.md T045, T047): the tooltip's delay and maximum inline size
  "`--ocelle-tooltip-delay` (`500ms`) is how long the pointer rests on a trigger before `ocelle-tooltip` shows its bubble; it is not set to 0 under `prefers-reduced-motion: reduce`, because a delay is not motion",
  "`--ocelle-tooltip-max-inline` (`18rem`) is the maximum inline size of the tooltip's bubble",
  "A control drawn on `color-accent-low`, `color-inset`, `color-hover-bg`, `color-danger-bg`, `color-warning-bg`, `color-success-bg`, `color-info-bg` or `color-neutral-bg` is bordered with `color-accent-strong`",
  // 012 (research.md R-08 items 3 and 4a): the hover and active tokens of the controls
  "`--ocelle-color-hover-border` is the border of a hovered or pressed bordered control: `--ocelle-color-ink` unless a host overrides it on an ancestor",
  "`--ocelle-color-accent-hover` is the hover fill of a primary control, with `--ocelle-color-on-accent` text on it",
  "`--ocelle-color-active-bg` is the pressed surface of a secondary, quiet or flush control on the main and state grounds",
  "`--ocelle-color-chrome-active` is the pressed surface of a control on the chrome grounds, with `--ocelle-color-chrome-ink` text on it",
  // 012 (research.md R-07; tasks.md T042): the spinner's motion tokens and the reduced-motion rule for every duration
  "`--ocelle-motion-spin` is the duration of one turn of a busy spinner, `800ms`",
  "`--ocelle-motion-turn` is the angle of one turn, `1turn`; it is not a duration and reduced motion does not change it",
  // 018 (research.md R-10; tasks.md T015): motion-pulse joins the list, a stricter replacement of the three names
  "Under `prefers-reduced-motion: reduce` every motion duration (`--ocelle-motion-fast`, `--ocelle-motion-base`, `--ocelle-motion-spin`, `--ocelle-motion-pulse`) is `0ms`",
  // Operator decision C1 (landing of 012 with 008): a motion token marked as a delay keeps its value
  "and so does a motion token the source marks as a delay, `--ocelle-tooltip-delay`, because a delay is not motion",
  // 012 (research.md R-08 item 2, R-12; tasks.md T052): the inside focus ring offset and the description ink's grounds
  "`--ocelle-focus-offset-inset` is the negative offset that draws a focus ring inside a box: `calc(-1 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)))`, -5 px",
  "`--ocelle-color-ink-soft` is also declared on the state grounds (`color-danger-bg`, `color-warning-bg`, `color-success-bg`, `color-info-bg`, `color-neutral-bg`), where an action row's description and tags sit",
  // 018 (research.md R-03, R-04, R-10; tasks.md T015): the status indicator's two tokens
  "`--ocelle-size-indicator` (`0.5rem`) is the size of the dot of `ocelle-status-indicator`, 8 px at the default root font size",
  "`--ocelle-motion-pulse` is the duration of one iteration of the status indicator's pulse, `1600ms`; the indicator runs three iterations, 4.8 s in all, within the 5 s limit",
  // 018 (research.md R-06, R-10; tasks.md T038): the pill tag's compact line height
  "`--ocelle-line-height-snug` (1.2) is the line height of the compact `ocelle-pill-tag` of `@ocelle/elements`, with `--ocelle-font-size-xs`",
  // 018 (research.md R-07, R-10; tasks.md T048): the interactive pill tag's minimum target
  "`--ocelle-target-small` (`1.5rem`) is the minimum block size and inline size of an interactive `ocelle-pill-tag` of `@ocelle/elements`, 24 px at the default root font size, the minimum target size for a pointer; it is not a primary action, so `--ocelle-target-min` does not apply to it",
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
