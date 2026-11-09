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
export type Family = "base";

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

/** The stories' text, one entry per family. */
export interface Content {
  readonly base: BaseContent;
}

/** The stories' text of base-content.json. */
const storyContent: Content = stories;

/** The markup of a family's story from the stories' text (base-content.json unless given), every text escaped. */
export function renderFamily(family: Family, content: Content = storyContent): string {
  const text = content[family];
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
