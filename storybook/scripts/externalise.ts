// The post-build step of the Storybook (006 research.md R-10, plan decision 5; operator decision on PLAN-FRESH-1-009,
// option (a)): moves every <style> element of the built HTML entries to a same-origin file, so Storybook's
// multi-line vendor monospace stack stays out of the HTML the prefix gate reads (FR-022). Read with the parse5
// tokenizer (as the csp gate reads markup): a <style> element becomes a <link rel="stylesheet"> to a file holding its
// text, keeping its attributes. Files are named `inline-<first 16 hex digits of the SHA-256 of the text>.css` and are
// written beside the HTML entry. Since 006 the Storybook is not a CSP target (FR-020), so inline <script> elements
// and style attributes stay as they are (002 had moved them too, for the Storybook page's CSP).
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Tokenizer, TokenizerMode } from "parse5";
import type { Token } from "parse5";

/** A file the externaliser writes beside the HTML entry. */
export interface MovedFile {
  readonly name: string;
  readonly text: string;
}

/** An HTML entry with its <style> elements moved out, and the files they moved to. */
export interface Externalised {
  readonly html: string;
  readonly files: readonly MovedFile[];
}

/** One replacement of a span of the markup. */
interface Edit {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

/** A <style> element whose end tag has not been read yet. */
interface Open {
  readonly tag: Token.TagToken;
  readonly start: number;
  readonly content: number;
}

const attributeEscapes: Readonly<Record<string, string>> = { "&": "&amp;", '"': "&quot;" };

function hash(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function fileName(text: string): string {
  return `inline-${hash(text)}.css`;
}

function attribute(name: string, value: string): string {
  return ` ${name}="${value.replace(/[&"]/g, (character) => attributeEscapes[character] ?? character)}"`;
}

/** Moves the <style> elements of one HTML text out. */
export function externalise(html: string): Externalised {
  const edits: Edit[] = [];
  const files = new Map<string, string>();
  let open: Open | undefined;
  const ignore = (): void => undefined;
  const tokenizer: Tokenizer = new Tokenizer(
    { sourceCodeLocationInfo: true },
    {
      onStartTag: (tag) => {
        const location = tag.location;
        if (location === null) return;
        // A script's text is read as script data, so markup inside an inline script is never taken for a <style>.
        if (tag.tagName === "script") tokenizer.state = TokenizerMode.SCRIPT_DATA;
        if (tag.tagName === "style") {
          open = { tag, start: location.startOffset, content: location.endOffset };
          tokenizer.state = TokenizerMode.RAWTEXT;
        }
      },
      onEndTag: (tag) => {
        const location = tag.location;
        // While a style is open the tokenizer is in its text state, which ends only at the matching end tag, so the
        // end tag read here is always that one.
        if (open === undefined || location === null) return;
        const text = html.slice(open.content, location.startOffset);
        const name = fileName(text);
        files.set(name, text);
        const kept = open.tag.attrs.map((attr) => attribute(attr.name, attr.value)).join("");
        edits.push({ start: open.start, end: location.endOffset, text: `<link rel="stylesheet" href="./${name}"${kept}>` });
        open = undefined;
      },
      onComment: ignore,
      onDoctype: ignore,
      onEof: ignore,
      onCharacter: ignore,
      onNullCharacter: ignore,
      onWhitespaceCharacter: ignore,
    },
  );
  // Stryker disable next-line BooleanLiteral: equivalent, a tag is emitted at its ">" whether or not the chunk is the last, and a tag left open at the end gives no edit either way
  tokenizer.write(html, true);
  let result = html;
  for (const edit of edits.sort((a, b) => b.start - a.start)) result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
  return { html: result, files: [...files].map(([name, text]) => ({ name, text })) };
}

/** Externalises every `*.html` directly inside `dir`, writing the moved files beside them. */
export function externaliseDir(dir: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
    const path = join(dir, entry.name);
    const result = externalise(readFileSync(path, "utf8"));
    for (const file of result.files) writeFileSync(join(dir, file.name), file.text);
    writeFileSync(path, result.html);
  }
}

// Stryker disable next-line all: process boundary, covered by storybook-integration: storybook/test/integration/setup.ts externalises the build that render.test.ts serves
if (import.meta.main) {
  // Stryker disable next-line all: process boundary, covered by storybook-integration: storybook/test/integration/setup.ts externalises the build that render.test.ts serves
  const dir = process.argv[2];
  // Stryker disable next-line all: process boundary, covered by storybook-integration: storybook/test/integration/setup.ts externalises the build that render.test.ts serves
  if (dir === undefined) throw new Error("usage: node scripts/externalise.ts <dir>");
  // Stryker disable next-line all: process boundary, covered by storybook-integration: storybook/test/integration/setup.ts externalises the build that render.test.ts serves
  externaliseDir(dir);
}
