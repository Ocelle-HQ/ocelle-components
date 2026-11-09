// The token stories' render code (FR-023, research.md R-10): one group of the token source as markup, name and value
// per token for a theme. Kept out of tokens.stories.ts so that the story file only binds the groups. The markup is a
// <dl> of <dt> name and <dd> value; an opaque colour token's <dt> starts with an empty swatch <span> whose colour
// comes from the generated swatch stylesheet by class and data-token (scripts/swatches.ts), never from a style
// attribute. Every text and attribute value is escaped. Since 003 (FR-023, research.md R-12) it also renders the
// base-style stories, one family each, from their text in base-content.json (kept out of the mutation scope), with
// no style attribute and no class.
import { resolve } from "../../packages/tokens/src/generate.ts";
import stories from "./base-content.json" with { type: "json" };
import type { Group, Theme, TokenRecord } from "../../packages/tokens/src/generate.ts";

const hex = /^#[0-9A-Fa-f]{6}$/;
const escapes: Readonly<Record<string, string>> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

/** Text or an attribute value with `&`, `<`, `>` and `"` escaped. */
function escape(text: string): string {
  return text.replace(/[&<>"]/g, (character) => escapes[character] ?? character);
}

/** Whether a token gets a swatch rule: a colour token whose value resolves to an opaque hex colour in both themes. */
export function hasSwatch(source: readonly TokenRecord[], record: TokenRecord): boolean {
  return record.group === "colour" && (["light", "dark"] as const).every((theme) => hex.test(resolve(source, record.name, theme)));
}

/** The markup of one group's story in a theme: every token of the group in source order, with its resolved value. */
export function renderGroup(source: readonly TokenRecord[], group: Group, theme: Theme): string {
  const rows = source
    .filter((record) => record.group === group)
    .map((record) => {
      const swatch = hasSwatch(source, record) ? `<span class="ocelle-swatch" data-token="${escape(record.name)}"></span>` : "";
      return `<dt>${swatch}--ocelle-${escape(record.name)}</dt><dd>${escape(resolve(source, record.name, theme))}</dd>`;
    });
  return `<dl class="ocelle-tokens" data-group="${group}">${rows.join("")}</dl>`;
}

/** A family of the base styles that has a story (003 FR-023, research.md R-12). */
export type Family = "base" | "compact" | "prose";

/** The text of the Base page story (storybook/stories/base-content.json). */
export interface BaseContent {
  readonly heading: string;
  readonly paragraph: string;
  readonly link: string;
  readonly button: string;
  readonly input: string;
  readonly list: readonly string[];
  readonly code: string;
  readonly kbd: string;
  readonly samp: string;
  readonly pre: string;
}

/** One fact of the Compact screen story: a label and its value, shown in the value text style. */
export interface Fact {
  readonly label: string;
  readonly value: string;
}

/** The text of the Compact screen story (storybook/stories/base-content.json). */
export interface CompactContent {
  readonly heading: string;
  readonly paragraph: string;
  readonly facts: readonly Fact[];
  readonly note: string;
  readonly command: string;
}

/** A table of the Prose document story: an optional caption (none when empty), a header row and body rows. */
export interface ProseTable {
  readonly caption: string;
  readonly head: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

/** The text of the Prose document story (storybook/stories/base-content.json): a rendered Markdown document. */
export interface ProseContent {
  readonly title: string;
  readonly intro: string;
  readonly link: string;
  readonly code: string;
  readonly listHeading: string;
  readonly list: readonly string[];
  readonly nestedLabel: string;
  readonly nested: readonly string[];
  readonly quoteHeading: string;
  readonly quote: string;
  readonly codeHeading: string;
  readonly pre: string;
  readonly tableHeading: string;
  readonly table: ProseTable;
  readonly linkedHeading: string;
  /** A table whose first body cell is a link. */
  readonly linked: ProseTable;
}

/** The stories' text, one entry per family. */
export interface Content {
  readonly base: BaseContent;
  readonly compact: CompactContent;
  readonly prose: ProseContent;
}

/** The stories' text of base-content.json. */
const storyContent: Content = stories;

/** The Compact screen: a compact region with facts in the value style and a command in its ink variant. */
function renderCompact(text: CompactContent): string {
  const facts = text.facts.map((fact) => `<dt>${escape(fact.label)}</dt><dd data-ocelle-value="">${escape(fact.value)}</dd>`).join("");
  return (
    '<article data-story="compact" data-ocelle-density="compact">' +
    `<h1>${escape(text.heading)}</h1>` +
    `<p>${escape(text.paragraph)}</p>` +
    `<dl>${facts}</dl>` +
    `<p>${escape(text.note)} <span data-ocelle-value="ink">${escape(text.command)}</span></p>` +
    "</article>"
  );
}

/** A prose table: its caption when it has one, the header row, then the body rows; `linked` makes the first body cell a link. */
function renderTable(table: ProseTable, linked: boolean): string {
  const caption = table.caption === "" ? "" : `<caption>${escape(table.caption)}</caption>`;
  const head = table.head.map((cell) => `<th>${escape(cell)}</th>`).join("");
  const rows = table.rows
    .map((row, index) => {
      const cells = row.map((cell, column) => (linked && index === 0 && column === 0 ? `<td><a href="#prose-document">${escape(cell)}</a></td>` : `<td>${escape(cell)}</td>`));
      return `<tr>${cells.join("")}</tr>`;
    })
    .join("");
  return `<table>${caption}<thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

/** The Prose document: a rendered Markdown document, plain elements with no class, in a container with the prose hook. */
function renderProse(text: ProseContent): string {
  const item = (entry: string): string => `<li>${escape(entry)}</li>`;
  return (
    '<article data-story="prose" data-ocelle-prose="">' +
    `<h1>${escape(text.title)}</h1>` +
    `<p>${escape(text.intro)} <code>${escape(text.code)}</code></p>` +
    `<p><a href="#prose-document">${escape(text.link)}</a></p>` +
    `<h2>${escape(text.listHeading)}</h2>` +
    `<ul>${text.list.map(item).join("")}<li>${escape(text.nestedLabel)}<ol>${text.nested.map(item).join("")}</ol></li></ul>` +
    `<h3>${escape(text.quoteHeading)}</h3>` +
    `<blockquote><p>${escape(text.quote)}</p></blockquote>` +
    `<h4>${escape(text.codeHeading)}</h4>` +
    `<pre><code>${escape(text.pre)}</code></pre>` +
    "<hr>" +
    `<h5>${escape(text.tableHeading)}</h5>` +
    renderTable(text.table, false) +
    `<h6>${escape(text.linkedHeading)}</h6>` +
    renderTable(text.linked, true) +
    "</article>"
  );
}

/** The markup of a family's story from the stories' text (base-content.json unless given), every text escaped. */
export function renderFamily(family: Family, content: Content = storyContent): string {
  if (family === "compact") return renderCompact(content.compact);
  if (family === "prose") return renderProse(content.prose);
  const text = content.base;
  const items = text.list.map((item) => `<li>${escape(item)}</li>`).join("");
  return (
    `<article data-story="${family}">` +
    `<h1>${escape(text.heading)}</h1>` +
    `<p>${escape(text.paragraph)} <a href="#base-page">${escape(text.link)}</a></p>` +
    `<p><button type="button">${escape(text.button)}</button> <input type="text" aria-label="${escape(text.input)}"></p>` +
    `<ul>${items}</ul>` +
    `<p><code>${escape(text.code)}</code> <kbd>${escape(text.kbd)}</kbd> <samp>${escape(text.samp)}</samp></p>` +
    `<pre>${escape(text.pre)}</pre>` +
    "</article>"
  );
}
