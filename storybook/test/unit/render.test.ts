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
  compact: {
    heading: "Drift & <2>",
    paragraph: 'Dense "text"',
    facts: [
      { label: "Id <a>", value: "3f2a & 9c1b" },
      { label: 'At "t"', value: "2026 > 2025" },
    ],
    note: "Run & see",
    command: "pnpm <test>",
  },
  prose: {
    title: "Prose & <3>",
    intro: 'Intro "q"',
    link: "Link <b>",
    code: "a<b",
    listHeading: "Lists & more",
    list: ["One <li>", "Two"],
    nestedLabel: "Nested &",
    nested: ["n1 <x>", "n2"],
    quoteHeading: "Quote <h3>",
    quote: "Quote > all",
    codeHeading: "Code <h4>",
    pre: "line <1>\n  line 2",
    tableHeading: "Table <h5>",
    table: { caption: "Cap & <c>", head: ["H1 <", 'H2 "'], rows: [["a&", "b"], ["c", "d>"]] },
    linkedHeading: "Linked <h6>",
    linked: { caption: "", head: ["K & k", "V"], rows: [["k<1>", "v1"], ["k2", "v2"]] },
  },
  wrap: {
    heading: "Wrap & <4>",
    intro: 'Intro "w"',
    identifier: "id<&>",
    short: "Short >",
    note: "Note &",
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
      elements(parseFragment(renderFamily("base", { ...content, base: { ...content.base, list } })).childNodes).filter((element) => element.tagName === "li").length;
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

// The Compact screen story (003 FR-023, research.md R-12, phase 3): a region with the compact hook
// (data-ocelle-density="compact") holding a heading, a paragraph and a list of facts whose values carry the value hook
// (data-ocelle-value=""), and a command in the hook's ink variant (data-ocelle-value="ink").
describe("renderFamily(\"compact\")", () => {
  it("renders the Compact screen from the given text, escaping & < > \" in every text", () => {
    expect(renderFamily("compact", content)).toBe(
      '<article data-story="compact" data-ocelle-density="compact">' +
        "<h1>Drift &amp; &lt;2&gt;</h1>" +
        "<p>Dense &quot;text&quot;</p>" +
        '<dl><dt>Id &lt;a&gt;</dt><dd data-ocelle-value="">3f2a &amp; 9c1b</dd><dt>At &quot;t&quot;</dt><dd data-ocelle-value="">2026 &gt; 2025</dd></dl>' +
        '<p>Run &amp; see <span data-ocelle-value="ink">pnpm &lt;test&gt;</span></p>' +
        "</article>",
    );
  });

  it("renders a term and a value per fact, and none for an empty list", () => {
    const facts = (list: Content["compact"]["facts"]): number[] => {
      const all = elements(parseFragment(renderFamily("compact", { ...content, compact: { ...content.compact, facts: list } })).childNodes);
      return ["dt", "dd"].map((tag) => all.filter((element) => element.tagName === tag).length);
    };
    const fact = { label: "a", value: "b" };
    expect([facts([]), facts([fact]), facts([fact, fact, fact])]).toEqual([
      [0, 0],
      [1, 1],
      [3, 3],
    ]);
  });

  it("renders the Compact screen from base-content.json by default: the compact hook, the value hook in both variants, no style attribute and no class", () => {
    const all = elements(parseFragment(renderFamily("compact")).childNodes);
    const value = (element: Element): string | undefined => element.attrs.find((attribute) => attribute.name === "data-ocelle-value")?.value;
    expect(all.filter((element) => element.attrs.some((attribute) => attribute.name === "data-ocelle-density")).map((element) => [element.tagName, element.attrs.find((attribute) => attribute.name === "data-ocelle-density")?.value])).toEqual([["article", "compact"]]);
    expect(all.filter((element) => value(element) === "").length).toBeGreaterThanOrEqual(3);
    expect(all.filter((element) => value(element) === "ink").length).toBe(1);
    expect(all.filter((element) => value(element) !== undefined && value(element) !== "" && value(element) !== "ink")).toEqual([]);
    expect(all.filter((element) => element.attrs.some((attribute) => attribute.name === "style" || attribute.name === "class"))).toEqual([]);
    expect(all.filter((element) => value(element) !== undefined && element.childNodes.length === 0)).toEqual([]);
    expect(["article", "h1", "p", "dl", "dt", "dd", "span"].filter((tag) => !all.some((element) => element.tagName === tag))).toEqual([]);
  });
});

// The Prose document story (003 FR-023, research.md R-12, phase 4): a container with the prose hook
// (data-ocelle-prose="") holding a rendered Markdown document: every element of the prose family (FR-014), h1 to h6,
// a nested list, a block quote, a code block, a rule, a wide table with a caption and a table whose first body cell is
// a link.
describe("renderFamily(\"prose\")", () => {
  it("renders the Prose document from the given text, escaping & < > \" in every text", () => {
    expect(renderFamily("prose", content)).toBe(
      '<article data-story="prose" data-ocelle-prose="">' +
        "<h1>Prose &amp; &lt;3&gt;</h1>" +
        "<p>Intro &quot;q&quot; <code>a&lt;b</code></p>" +
        '<p><a href="#prose-document">Link &lt;b&gt;</a></p>' +
        "<h2>Lists &amp; more</h2>" +
        "<ul><li>One &lt;li&gt;</li><li>Two</li><li>Nested &amp;<ol><li>n1 &lt;x&gt;</li><li>n2</li></ol></li></ul>" +
        "<h3>Quote &lt;h3&gt;</h3>" +
        "<blockquote><p>Quote &gt; all</p></blockquote>" +
        "<h4>Code &lt;h4&gt;</h4>" +
        "<pre><code>line &lt;1&gt;\n  line 2</code></pre>" +
        "<hr>" +
        "<h5>Table &lt;h5&gt;</h5>" +
        '<table tabindex="0"><caption>Cap &amp; &lt;c&gt;</caption><thead><tr><th>H1 &lt;</th><th>H2 &quot;</th></tr></thead>' +
        "<tbody><tr><td>a&amp;</td><td>b</td></tr><tr><td>c</td><td>d&gt;</td></tr></tbody></table>" +
        "<h6>Linked &lt;h6&gt;</h6>" +
        '<table tabindex="0"><thead><tr><th>K &amp; k</th><th>V</th></tr></thead>' +
        '<tbody><tr><td><a href="#prose-document">k&lt;1&gt;</a></td><td>v1</td></tr><tr><td>k2</td><td>v2</td></tr></tbody></table>' +
        "</article>",
    );
  });

  it("renders an item per list entry and per nested entry, and a row per table row, none for empty lists", () => {
    const count = (prose: Content["prose"], tag: string): number => elements(parseFragment(renderFamily("prose", { ...content, prose })).childNodes).filter((element) => element.tagName === tag).length;
    const lists = (list: readonly string[], nested: readonly string[]): number => count({ ...content.prose, list, nested }, "li");
    expect([lists([], []), lists(["a"], []), lists([], ["a", "b"]), lists(["a", "b"], ["c"])]).toEqual([1, 2, 3, 4]);
    const rows = (table: Content["prose"]["table"]): number => count({ ...content.prose, table }, "tr");
    expect([rows({ caption: "", head: ["h"], rows: [] }), rows({ caption: "", head: ["h"], rows: [["a"], ["b"], ["c"]] })]).toEqual([1 + 3, 4 + 3]);
    expect(count({ ...content.prose, table: { ...content.prose.table, caption: "" } }, "caption")).toBe(0);
    expect(count({ ...content.prose, linked: { ...content.prose.linked, caption: "C" } }, "caption")).toBe(2);
    expect(count({ ...content.prose, linked: { ...content.prose.linked, rows: [] } }, "a")).toBe(1);
  });

  it("renders the Prose document from base-content.json by default: the prose hook, every element of the family, a wide table, a table with a link, no style attribute and no class", () => {
    const all = elements(parseFragment(renderFamily("prose")).childNodes);
    const tags = new Set(all.map((element) => element.tagName));
    const hooked = all.filter((element) => element.attrs.some((attribute) => attribute.name === "data-ocelle-prose"));
    expect(hooked.map((element) => [element.tagName, element.attrs.find((attribute) => attribute.name === "data-ocelle-prose")?.value])).toEqual([["article", ""]]);
    expect(["h1", "h2", "h3", "h4", "h5", "h6", "p", "ul", "ol", "li", "blockquote", "code", "pre", "hr", "a", "table", "caption", "thead", "th", "td"].filter((tag) => !tags.has(tag))).toEqual([]);
    const tables = all.filter((element) => element.tagName === "table");
    const columns = tables.map((table) => elements(table.childNodes).filter((element) => element.tagName === "th").length);
    expect(columns).toEqual([12, 12]);
    expect(tables.map((table) => elements(table.childNodes).filter((element) => element.tagName === "a").length)).toEqual([0, 1]);
    // FR-029, operator decision on the phase 1 spike § 7 ("tabindex + exceptions"): every table, its own horizontal
    // scroll box under base.css, is focusable, as packages/styles/README.md tells WebKit hosts to do; this clears axe's
    // scrollable-region-focusable on the wide table that holds no link.
    expect(tables.map((table) => table.attrs)).toEqual([[{ name: "tabindex", value: "0" }], [{ name: "tabindex", value: "0" }]]);
    expect(all.filter((element) => element.attrs.some((attribute) => attribute.name === "style" || attribute.name === "class"))).toEqual([]);
    expect(all.filter((element) => ["h1", "h2", "h3", "h4", "h5", "h6", "a", "code", "pre", "caption", "th", "td"].includes(element.tagName) && element.childNodes.length === 0)).toEqual([]);
  });
});

// The Identifier wrap story (003 FR-023, research.md R-12, phase 5): a 300 px two-column grid (stories-layout.css, on
// its data-story="wrap-grid" attribute) whose first cell holds a 120-character unbroken identifier with the
// identifier-wrap hook (data-ocelle-wrap="anywhere") beside a short text, and the same identifier in a paragraph with
// the hook combined with the value hook (FR-020: the wrap sets no font property).
describe("renderFamily(\"wrap\")", () => {
  it("renders the Identifier wrap story from the given text, escaping & < > \" in every text", () => {
    expect(renderFamily("wrap", content)).toBe(
      '<article data-story="wrap">' +
        "<h1>Wrap &amp; &lt;4&gt;</h1>" +
        "<p>Intro &quot;w&quot;</p>" +
        '<div data-story="wrap-grid"><div data-ocelle-wrap="anywhere">id&lt;&amp;&gt;</div><div>Short &gt;</div></div>' +
        '<p>Note &amp; <span data-ocelle-wrap="anywhere" data-ocelle-value="">id&lt;&amp;&gt;</span></p>' +
        "</article>",
    );
  });

  it("renders the Identifier wrap story from base-content.json by default: the hook on the grid cell and on the value span, a 120-character unbroken identifier, no style attribute and no class", () => {
    const all = elements(parseFragment(renderFamily("wrap")).childNodes);
    const attribute = (element: Element, name: string): string | undefined => element.attrs.find((each) => each.name === name)?.value;
    const text = (element: Element): string => element.childNodes.map((node) => ("value" in node ? node.value : "")).join("");
    const hooked = all.filter((element) => attribute(element, "data-ocelle-wrap") !== undefined);
    expect(hooked.map((element) => [element.tagName, attribute(element, "data-ocelle-wrap"), attribute(element, "data-ocelle-value")])).toEqual([
      ["div", "anywhere", undefined],
      ["span", "anywhere", ""],
    ]);
    expect(hooked.map((element) => /^\S{120}$/.test(text(element)))).toEqual([true, true]);
    const grid = all.filter((element) => attribute(element, "data-story") === "wrap-grid");
    expect(grid.map((element) => element.childNodes.filter((node) => "tagName" in node).length)).toEqual([2]);
    expect(grid.map((element) => text(elements(element.childNodes)[1] ?? element).length > 0)).toEqual([true]);
    expect(all.filter((element) => element.tagName === "article").map((element) => attribute(element, "data-story"))).toEqual(["wrap"]);
    expect(all.filter((element) => element.attrs.some((each) => each.name === "style" || each.name === "class"))).toEqual([]);
    expect(["h1", "p"].filter((tag) => !all.some((element) => element.tagName === tag && element.childNodes.length > 0))).toEqual([]);
  });
});
