import { describe, expect, it } from "vitest";
import type { TokenRecord } from "../../../packages/tokens/src/generate.ts";
import { hasSwatch, renderGroup } from "../../stories/render.ts";

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
