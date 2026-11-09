import { parseFragment } from "parse5";
import type { DefaultTreeAdapterMap } from "parse5";
import { describe, expect, it } from "vitest";
import type { TokenRecord } from "../../../packages/tokens/src/generate.ts";
import { hasSwatch, renderFamily, renderGroup } from "../../stories/render.ts";
import type { Content } from "../../stories/render.ts";

// The token stories' render code (FR-023, research.md R-10; phase 3 review round 1, R1-02): the exact markup of a
// group on fixture tokens, so the separator between rows, the escaping of `&`, `<`, `>` and `"` in names, attribute
// values and values, and the swatch rule are each pinned. A swatch belongs to a colour token whose value resolves to
// an opaque hex colour in both themes; a hex value outside the colour group gets none.
const fixture: readonly TokenRecord[] = [
  { name: "color-a&b", group: "colour", value: { light: "#AABBCC", dark: "#112233" } },
  { name: 'color-<"q">', group: "colour", value: { light: "#AABBCC", dark: "var(--ocelle-shell-hex)" } },
  { name: "color-see-through", group: "colour", value: { light: "#AABBCC", dark: "rgb(0 0 0 / 0.5)" } },
  { name: "shell-hex", group: "shell", value: "#123456" },
  { name: "space-1", group: "space", value: "4px" },
  { name: "space-2", group: "space", value: 'a & b < c > d "e"' },
];

function record(name: string): TokenRecord {
  const found = fixture.find((each) => each.name === name);
  if (found === undefined) throw new Error(`no fixture token ${name}`);
  return found;
}

describe("renderGroup", () => {
  it("renders the rows of a group with nothing between them, escaping & < > \" in the value", () => {
    expect(renderGroup(fixture, "space", "dark")).toBe(
      '<dl class="ocelle-tokens" data-group="space">' +
        "<dt>--ocelle-space-1</dt><dd>4px</dd>" +
        "<dt>--ocelle-space-2</dt><dd>a &amp; b &lt; c &gt; d &quot;e&quot;</dd>" +
        "</dl>",
    );
  });

  it("escapes & < > \" in names, in the swatch's data-token and in the <dt>, and resolves values per theme", () => {
    expect(renderGroup(fixture, "colour", "light")).toBe(
      '<dl class="ocelle-tokens" data-group="colour">' +
        '<dt><span class="ocelle-swatch" data-token="color-a&amp;b"></span>--ocelle-color-a&amp;b</dt><dd>#AABBCC</dd>' +
        '<dt><span class="ocelle-swatch" data-token="color-&lt;&quot;q&quot;&gt;"></span>--ocelle-color-&lt;&quot;q&quot;&gt;</dt><dd>#AABBCC</dd>' +
        "<dt>--ocelle-color-see-through</dt><dd>#AABBCC</dd>" +
        "</dl>",
    );
    expect(renderGroup(fixture, "colour", "dark")).toContain("<dd>#123456</dd><dt>--ocelle-color-see-through</dt><dd>rgb(0 0 0 / 0.5)</dd>");
  });

  it("draws no swatch for a hex value outside the colour group", () => {
    expect(renderGroup(fixture, "shell", "light")).toBe('<dl class="ocelle-tokens" data-group="shell"><dt>--ocelle-shell-hex</dt><dd>#123456</dd></dl>');
  });

  it("renders an empty list for a group with no token", () => {
    expect(renderGroup(fixture, "motion", "light")).toBe('<dl class="ocelle-tokens" data-group="motion"></dl>');
  });
});

describe("hasSwatch", () => {
  it("is true for a colour token opaque hex in both themes, directly or by reference, and false otherwise", () => {
    expect(fixture.map((each) => [each.name, hasSwatch(fixture, record(each.name))])).toEqual([
      ["color-a&b", true],
      ['color-<"q">', true],
      ["color-see-through", false],
      ["shell-hex", false],
      ["space-1", false],
      ["space-2", false],
    ]);
  });
});

// The base-style stories' render code (003 FR-023, research.md R-12): renderFamily(family, content) returns a family's
// story markup from the stories' text (storybook/stories/base-content.json by default), escaped, with no style
// attribute and no class. The Base page story shows what the base layer styles: body text with a link, a button and a
// text input, a list, code, kbd and samp, and a pre.
type Element = DefaultTreeAdapterMap["element"];

function elements(nodes: readonly DefaultTreeAdapterMap["childNode"][]): Element[] {
  return nodes.flatMap((node) => ("tagName" in node ? [node, ...elements(node.childNodes)] : []));
}

const content: Content = {
  base: {
    heading: "H & <1>",
    paragraph: 'Text "quoted"',
    link: "Link <a>",
    button: "Save & go",
    input: 'Name "x"',
    list: ["One <li>", "Two & three"],
    code: "a<b",
    kbd: "Ctrl > 1",
    samp: "exit & 2",
    pre: "line <1>\n  line 2",
  },
};

describe("renderFamily", () => {
  it("renders the Base page from the given text, escaping & < > \" in every text and attribute value", () => {
    expect(renderFamily("base", content)).toBe(
      '<article data-story="base">' +
        "<h1>H &amp; &lt;1&gt;</h1>" +
        '<p>Text &quot;quoted&quot; <a href="#base-page">Link &lt;a&gt;</a></p>' +
        '<p><button type="button">Save &amp; go</button> <input type="text" aria-label="Name &quot;x&quot;"></p>' +
        "<ul><li>One &lt;li&gt;</li><li>Two &amp; three</li></ul>" +
        "<p><code>a&lt;b</code> <kbd>Ctrl &gt; 1</kbd> <samp>exit &amp; 2</samp></p>" +
        "<pre>line &lt;1&gt;\n  line 2</pre>" +
        "</article>",
    );
  });

  it("renders a list item per entry, and none for an empty list", () => {
    const items = (list: readonly string[]): number =>
      elements(parseFragment(renderFamily("base", { base: { ...content.base, list } })).childNodes).filter((element) => element.tagName === "li").length;
    expect([items([]), items(["a"]), items(["a", "b", "c"])]).toEqual([0, 1, 3]);
  });

  it("renders the Base page from base-content.json by default: the elements the base layer styles, no style attribute and no class", () => {
    const all = elements(parseFragment(renderFamily("base")).childNodes);
    const tags = new Set(all.map((element) => element.tagName));
    expect(["article", "h1", "p", "a", "button", "input", "ul", "li", "code", "kbd", "samp", "pre"].filter((tag) => !tags.has(tag))).toEqual([]);
    expect(all.filter((element) => element.attrs.some((attribute) => attribute.name === "style" || attribute.name === "class"))).toEqual([]);
    expect(all.filter((element) => element.tagName === "li").length).toBeGreaterThanOrEqual(2);
    expect(all.filter((element) => ["h1", "a", "button", "code", "kbd", "samp", "pre"].includes(element.tagName) && element.childNodes.length === 0)).toEqual([]);
  });
});
