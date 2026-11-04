// The post-build step of the Storybook (FR-023, research.md R-10, reviews/phase-3/spike.md step 2): moves every
// inline script and style of the built HTML entries to same-origin files, so the Storybook page runs under
// `script-src 'self'; style-src 'self'`. Read with the parse5 tokenizer (as the csp gate reads markup): an inline
// <script> keeps its start tag and gains `src="./<file>"`, its text moving to the file; a <style> element becomes a
// <link rel="stylesheet"> to a file holding its text, keeping its attributes; a style attribute becomes
// `data-ocelle-style="<hash>"`, its declarations moving to one stylesheet of `[data-ocelle-style="<hash>"]` rules
// linked before </head>. Files are named `inline-<first 16 hex digits of the SHA-256 of the text>.<js|css>` and are
// written beside the HTML entry, so relative imports in a moved module keep working. External scripts and links are
// left as they are.
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

/** An HTML entry with its inline scripts and styles moved out, and the files they moved to. */
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

/** An inline <script> or <style> whose end tag has not been read yet. */
interface Open {
  readonly tag: Token.TagToken;
  readonly start: number;
  readonly content: number;
}

const attributeEscapes: Readonly<Record<string, string>> = { "&": "&amp;", '"': "&quot;" };

function hash(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function fileName(text: string, extension: "js" | "css"): string {
  return `inline-${hash(text)}.${extension}`;
}

function attribute(name: string, value: string): string {
  return ` ${name}="${value.replace(/[&"]/g, (character) => attributeEscapes[character] ?? character)}"`;
}

/** Moves the inline scripts, style elements and style attributes of one HTML text out. */
export function externalise(html: string): Externalised {
  const edits: Edit[] = [];
  const files = new Map<string, string>();
  const rules = new Map<string, string>();
  let open: Open | undefined;
  const ignore = (): void => undefined;
  const tokenizer: Tokenizer = new Tokenizer(
    { sourceCodeLocationInfo: true },
    {
      onStartTag: (tag) => {
        const location = tag.location;
        if (location === null) return;
        for (const attr of tag.attrs) {
          const span = location.attrs?.[attr.name];
          if (attr.name !== "style" || span === undefined) continue;
          rules.set(hash(attr.value), attr.value);
          edits.push({ start: span.startOffset, end: span.endOffset, text: `data-ocelle-style="${hash(attr.value)}"` });
        }
        const inline = tag.tagName === "style" || (tag.tagName === "script" && !tag.attrs.some((attr) => attr.name === "src"));
        if (inline && !tag.selfClosing) open = { tag, start: location.startOffset, content: location.endOffset };
        if (tag.tagName === "script") tokenizer.state = TokenizerMode.SCRIPT_DATA;
        if (tag.tagName === "style") tokenizer.state = TokenizerMode.RAWTEXT;
      },
      onEndTag: (tag) => {
        const location = tag.location;
        if (open === undefined || location === null || tag.tagName !== open.tag.tagName) return;
        const text = html.slice(open.content, location.startOffset);
        if (open.tag.tagName === "script") {
          const name = fileName(text, "js");
          files.set(name, text);
          edits.push({ start: open.content - 1, end: location.endOffset, text: `${attribute("src", `./${name}`)}></script>` });
        } else {
          const name = fileName(text, "css");
          files.set(name, text);
          const kept = open.tag.attrs.map((attr) => attribute(attr.name, attr.value)).join("");
          edits.push({ start: open.start, end: location.endOffset, text: `<link rel="stylesheet" href="./${name}"${kept}>` });
        }
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
  tokenizer.write(html, true);
  let result = html;
  for (const edit of edits.sort((a, b) => b.start - a.start)) result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
  if (rules.size > 0) {
    const sheet = [...rules].map(([key, declarations]) => `[data-ocelle-style="${key}"] { ${declarations} }\n`).join("");
    const name = fileName(sheet, "css");
    files.set(name, sheet);
    const link = `<link rel="stylesheet" href="./${name}">`;
    const head = result.search(/<\/head\s*>/i);
    result = head < 0 ? link + result : result.slice(0, head) + link + result.slice(head);
  }
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

// Stryker disable next-line all: process boundary, covered by storybook-integration: storybook/test/integration/setup.ts externalises the build that csp.test.ts serves
if (import.meta.main) {
  // Stryker disable next-line all: process boundary, covered by storybook-integration: storybook/test/integration/setup.ts externalises the build that csp.test.ts serves
  const dir = process.argv[2];
  // Stryker disable next-line all: process boundary, covered by storybook-integration: storybook/test/integration/setup.ts externalises the build that csp.test.ts serves
  if (dir === undefined) throw new Error("usage: node scripts/externalise.ts <dir>");
  // Stryker disable next-line all: process boundary, covered by storybook-integration: storybook/test/integration/setup.ts externalises the build that csp.test.ts serves
  externaliseDir(dir);
}
