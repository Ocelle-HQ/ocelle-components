import stylelint from "stylelint";
import { describe, expect, it } from "vitest";
import plugin, { rawValues, ruleName } from "../stylelint/token-only.ts";

// The token-only rule's lists and edges (FR-024, research.md R-07; phase 4 review round 1, R1-05): every CSS Color 4
// named colour is raw and every other identifier is not; every unitless property takes a bare number and others do
// not; a font value takes only the CSS-wide keywords; each calc() operator is allowed, also in a font value; the var()
// fallback starts after the first comma between its parts; nested functions in calc(); unicode ranges; and the
// rule's option, through Stylelint itself (in process, no child process).
const named =
  "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood " +
  "cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray " +
  "darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen " +
  "darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue " +
  "firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew " +
  "hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan " +
  "lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray " +
  "lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue " +
  "mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred " +
  "midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid " +
  "palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple " +
  "rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue " +
  "slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white " +
  "whitesmoke yellow yellowgreen";

describe("rawValues: named colours", () => {
  it("has the 148 named colours of CSS Color 4", () => {
    expect(named.split(" ")).toHaveLength(148);
  });

  it.each(named.split(" "))("reports the named colour %s, in any case", (colour) => {
    expect([rawValues("color", colour), rawValues("color", colour.toUpperCase())]).toEqual([[colour], [colour.toUpperCase()]]);
  });

  it.each(["transparent", "currentColor", "Canvas", "auto", "none", "redder", "inherit"])("allows the identifier %s", (word) => {
    expect(rawValues("color", word)).toEqual([]);
  });
});

describe("rawValues: unitless numbers", () => {
  it.each(["line-height", "flex", "flex-grow", "flex-shrink", "z-index", "opacity", "order", "LINE-HEIGHT"])("allows a bare number in %s", (property) => {
    expect(rawValues(property, "2")).toEqual([]);
  });

  it.each(["width", "font-weight", "flex-basis", "column-count"])("reports a bare number in %s", (property) => {
    expect(rawValues(property, "2")).toEqual(["2"]);
  });
});

describe("rawValues: font values", () => {
  it.each(["inherit", "initial", "unset", "revert", "revert-layer", "INHERIT"])("allows the CSS-wide keyword %s in font and font-family", (word) => {
    expect([rawValues("font", word), rawValues("font-family", word)]).toEqual([[], []]);
  });

  it("reports any other identifier and any string in a font value, and allows a string elsewhere", () => {
    expect([rawValues("font-family", "Inter"), rawValues("font", '"Inter"'), rawValues("content", '"x"')]).toEqual([["Inter"], ['"Inter"'], []]);
  });

  it.each(["+", "-", "*", "/"])("allows the calc() operator %s, also in a font value", (operator) => {
    expect(rawValues("font", `calc(var(--a) ${operator} var(--b))`)).toEqual([]);
  });
});

describe("rawValues: functions", () => {
  it.each([
    { value: "var(--a)", raw: [] },
    { value: "var(--a, rgb(0 0 0))", raw: ["rgb(0 0 0)"] },
    { value: "var(--a, Canvas, red)", raw: ["red"] },
    { value: 'var(--a "," 4px, red)', raw: ["red"] },
    { value: "var(4px, Canvas)", raw: [] },
    { value: "var(--x 4px, Canvas)", raw: [] },
    { value: "VAR(--a, 4px)", raw: ["4px"] },
    { value: "calc(2 * min(4px, 1px))", raw: ["min(4px, 1px)"] },
    { value: "calc((var(--a) + 4px) * 2)", raw: ["4px"] },
    { value: "CALC(var(--a) * 2)", raw: [] },
    { value: "(4px)", raw: ["(4px)"] },
    { value: "(2)", raw: ["(2)"] },
  ])("reports $raw in $value", ({ value, raw }) => {
    expect(rawValues("margin", value)).toEqual(raw);
  });

  it("reports a unicode range as written", () => {
    expect(rawValues("unicode-range", "U+0025-00FF, U+4??")).toEqual(["U+0025-00FF", "U+4??"]);
  });
});

describe("the rule in Stylelint", () => {
  async function lint(option: unknown): Promise<{ readonly warnings: string[]; readonly invalid: string[] }> {
    const result = await stylelint.lint({ code: "a { color: red; margin: var(--ocelle-x); }", config: { plugins: [plugin], rules: { [ruleName]: option } } });
    const [file] = result.results;
    return { warnings: (file?.warnings ?? []).map((warning) => warning.text), invalid: (file?.invalidOptionWarnings ?? []).map((warning) => warning.text) };
  }

  it("reports each declaration with raw values once, with option true", async () => {
    expect(await lint(true)).toEqual({ warnings: ["color: raw red; use a --ocelle-* token (FR-024) (ocelle/token-only)"], invalid: [] });
  });

  it("reports an invalid option and checks nothing with it", async () => {
    const result = await lint("yes");
    expect({ warnings: result.warnings, invalid: result.invalid.length }).toEqual({ warnings: [], invalid: 1 });
  });
});
