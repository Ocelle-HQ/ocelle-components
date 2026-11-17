import { afterEach, describe, expect, it } from "vitest";
import { run } from "../bin/contrast.ts";
import { cleanTrees, repoRoot, runGate, tree } from "./token-tree.ts";
import type { Data, GateRun, TreeSpec } from "./token-tree.ts";

// The contrast gate (002 FR-016, FR-017, FR-021; research.md R-07; contracts/gates.md § `contrast`; data-model.md
// § Gate findings), in process on fixture roots: each finding rule and its order, the figure's precision interval,
// the unrounded threshold, the exempt disabled ink, the required pairs derived from the source, the exit 2 causes,
// the success line and --print. Ratios of the fixture colours (WCAG 2.x, computed for this test by hand):
// #000000 on #FFFFFF 21; on #F0F0F0 18.4273; #FFFFFF on #000000 21, on #202020 16.2933; #767676 on #FFFFFF 4.5422,
// on #F0F0F0 3.9858; #8A8A8A on #000000 6.0830, on #202020 4.7196; #AAAAAA on #FFFFFF 2.3231; #555555 on #000000
// 2.8168; #8A8A8A on #FFFFFF 3.4522. Colours on #FFFFFF at a boundary: #BB7BDF 2.9950004, #E969A1 3.0000002, #A05941 5.2500016, #A91AE8
// 5.2499999, #7C51CE 5.3499977, #4D57EF 5.3500007, #6995DF 3.0150007, #A79522 3.0149996, #A87BFF 3.0249996,
// #74A14B 3.0250002, #9A6C5A 4.4999999, #7C7290 4.5000006 (both 3.9487 on #F0F0F0).
const pairsPath = "packages/tokens/contrast/pairs.json";
const sourcePath = "packages/tokens/src/source.ts";

/** The fixture source; record i is on line 5 + i of source.ts. */
const records: readonly Data[] = [
  { name: "color-canvas", group: "colour", value: { light: "#FFFFFF", dark: "#000000" } },
  { name: "color-sheet", group: "colour", value: { light: "#F0F0F0", dark: "#202020" } },
  { name: "color-ink", group: "colour", value: { light: "#000000", dark: "#FFFFFF" }, contrast: { kind: "text", grounds: ["color-canvas", "color-sheet"] } },
  { name: "color-border", group: "colour", value: { light: "#767676", dark: "#8A8A8A" }, contrast: { kind: "non-text", grounds: ["color-canvas"] } },
  { name: "color-mark", group: "colour", value: { light: "#767676", dark: "#8A8A8A" } },
  {
    name: "color-focus",
    group: "colour",
    value: { light: "var(--ocelle-color-mark)", dark: "var(--ocelle-color-mark)" },
    ref: { light: ["color-mark"], dark: ["color-mark"] },
    contrast: { kind: "non-text", grounds: ["color-sheet"] },
  },
  { name: "color-disabled-ink", group: "colour", value: { light: "#AAAAAA", dark: "#555555" }, contrast: { kind: "text", grounds: ["color-canvas"], exempt: true } },
  { name: "color-overlay", group: "colour", value: { light: "rgb(0 0 0 / 0.5)", dark: "rgb(0 0 0 / 0.65)" } },
  { name: "space-1", group: "space", value: "0.25rem" },
];
const line = { ink: 7, border: 8, focus: 10, disabled: 11 } as const;

function entry(theme: string, fg: string, bg: string, kind: string, figure: string, extra: Data = {}): Data {
  return { theme, fg, bg, kind, figure, status: "checked", source: "computed", ...extra };
}

/** The fixture pair list; entry i is on line 2 + i of pairs.json. */
const pairs: readonly Data[] = [
  entry("light", "color-ink", "color-canvas", "text", "21.0"),
  entry("light", "color-ink", "color-sheet", "text", "18.43"),
  entry("light", "color-border", "color-canvas", "non-text", "4.54"),
  entry("light", "color-focus", "color-sheet", "non-text", "3.99"),
  entry("light", "color-disabled-ink", "color-canvas", "text", "2.32"),
  entry("light", "color-mark", "color-sheet", "text", "3.99", { status: "excluded", reason: "fixture: no text on this ground" }),
  entry("dark", "color-ink", "color-canvas", "text", "21.0"),
  entry("dark", "color-ink", "color-sheet", "text", "16.29"),
  entry("dark", "color-border", "color-canvas", "non-text", "6.08"),
  entry("dark", "color-focus", "color-sheet", "non-text", "4.72"),
  entry("dark", "color-disabled-ink", "color-canvas", "text", "2.82"),
];

/** The pair list with the fields of the entry `(theme, fg, bg)` replaced. */
function setPair(list: readonly Data[], theme: string, fg: string, bg: string, fields: Data): Data[] {
  return list.map((e) => (e.theme === theme && e.fg === fg && e.bg === bg ? { ...e, ...fields } : e));
}

function withoutPair(list: readonly Data[], theme: string, fg: string, bg: string): Data[] {
  return list.filter((e) => !(e.theme === theme && e.fg === fg && e.bg === bg));
}

async function contrast(spec: TreeSpec, args: readonly string[] = []): Promise<GateRun> {
  return runGate(run, ["--root", tree({ records, pairs, ...spec }), ...args]);
}

const success = "contrast: 6 pairs checked in light, 5 in dark (5 required per theme)";
const at = (n: number): string => `${pairsPath}:${String(n)}: contrast:`;

afterEach(cleanTrees);

describe("contrast: success", () => {
  it("passes the fixture and reports the pairs checked per theme, excluded pairs included, and the required pairs per theme", async () => {
    expect(await contrast({})).toEqual({ code: 0, out: ["contrast: 6 pairs checked in light, 5 in dark (5 required per theme)"], err: [] });
  });

  it("passes the repository's values: 207 in light, 215 in dark, 196 required per theme (US3 scenario 1)", async () => {
    expect(await runGate(run, ["--root", repoRoot])).toEqual({ code: 0, out: ["contrast: 207 pairs checked in light, 215 in dark (196 required per theme)"], err: [] });
  });

  it("counts a pair outside the required set among the pairs checked", async () => {
    const extra = entry("dark", "color-border", "color-ink", "non-text", "3.45");
    expect((await contrast({ pairs: [...pairs, extra] })).out).toEqual(["contrast: 6 pairs checked in light, 6 in dark (5 required per theme)"]);
  });
});

describe("contrast: figure-mismatch", () => {
  it("names the recorded and computed figures, even above the threshold (US3 scenario 4)", async () => {
    expect(await contrast({ pairs: setPair(pairs, "light", "color-ink", "color-canvas", { figure: "20.9" }) })).toEqual({
      code: 1,
      out: [`${at(2)} figure-mismatch: light color-ink on color-canvas: recorded figure 20.9, computed 21.0000`, "contrast: 1 finding"],
      err: [],
    });
  });

  it.each([
    { colour: "#A05941", figure: "5.3", matches: true },
    { colour: "#A91AE8", figure: "5.3", matches: false },
    { colour: "#7C51CE", figure: "5.3", matches: true },
    { colour: "#4D57EF", figure: "5.3", matches: false },
    { colour: "#6995DF", figure: "3.02", matches: true },
    { colour: "#A79522", figure: "3.02", matches: false },
    { colour: "#A87BFF", figure: "3.02", matches: true },
    { colour: "#74A14B", figure: "3.02", matches: false },
  ])("matches a computed ratio to $figure within its precision interval: $colour $matches", async ({ colour, figure, matches }) => {
    const ran = await contrast({ overrides: [{ token: "color-border", light: colour }], pairs: setPair(pairs, "light", "color-border", "color-canvas", { figure }) });
    expect({ code: ran.code, rules: ran.out.slice(0, -1).map((l) => l.split(": ")[2]), summary: ran.out.at(-1) }).toEqual(
      matches ? { code: 0, rules: [], summary: success } : { code: 1, rules: ["figure-mismatch"], summary: "contrast: 1 finding" },
    );
  });

  it("reads a figure without decimals at a precision of one unit: 21 matches [20.5, 21.5)", async () => {
    expect(await contrast({ pairs: setPair(pairs, "light", "color-ink", "color-canvas", { figure: "21" }) })).toEqual({ code: 0, out: [success], err: [] });
    expect((await contrast({ pairs: setPair(pairs, "light", "color-ink", "color-canvas", { figure: "20" }) })).out).toEqual([
      `${at(2)} figure-mismatch: light color-ink on color-canvas: recorded figure 20, computed 21.0000`,
      "contrast: 1 finding",
    ]);
  });

  it("holds the exempt disabled ink to its figure", async () => {
    expect((await contrast({ pairs: setPair(pairs, "dark", "color-disabled-ink", "color-canvas", { figure: "2.9" }) })).out).toEqual([
      `${at(12)} figure-mismatch: dark color-disabled-ink on color-canvas: recorded figure 2.9, computed 2.8168`,
      "contrast: 1 finding",
    ]);
  });

  it("holds an excluded pair to its figure", async () => {
    expect((await contrast({ pairs: setPair(pairs, "light", "color-mark", "color-sheet", { figure: "3.9" }) })).out).toEqual([
      `${at(7)} figure-mismatch: light color-mark on color-sheet: recorded figure 3.9, computed 3.9858`,
      "contrast: 1 finding",
    ]);
  });

  it("resolves a derived token per theme with the generator's resolver: color-focus follows color-mark", async () => {
    const ran = await contrast({ overrides: [{ token: "color-mark", dark: "#FFFFFF" }] });
    expect(ran.out).toEqual([`${at(11)} figure-mismatch: dark color-focus on color-sheet: recorded figure 4.72, computed 16.2933`, "contrast: 1 finding"]);
  });
});

describe("contrast: below-threshold", () => {
  it("compares the unrounded ratio with 3:1: 2.9950 fails although it prints as 3.0 (spec edge case)", async () => {
    const ran = await contrast({ overrides: [{ token: "color-border", light: "#BB7BDF" }], pairs: setPair(pairs, "light", "color-border", "color-canvas", { figure: "3.00" }) });
    expect(ran).toEqual({
      code: 1,
      out: [`${at(4)} below-threshold: light color-border on color-canvas: 2.9950:1 is below the non-text threshold of 3:1`, "contrast: 1 finding"],
      err: [],
    });
  });

  it("passes 3.0000002 on 3:1", async () => {
    const ran = await contrast({ overrides: [{ token: "color-border", light: "#E969A1" }], pairs: setPair(pairs, "light", "color-border", "color-canvas", { figure: "3.00" }) });
    expect(ran).toEqual({ code: 0, out: [success], err: [] });
  });

  it("compares text pairs with 4.5:1, unrounded, one finding per pair under it (US3 scenario 2)", async () => {
    const below = await contrast({
      overrides: [{ token: "color-ink", light: "#9A6C5A" }],
      pairs: setPair(setPair(pairs, "light", "color-ink", "color-canvas", { figure: "4.50" }), "light", "color-ink", "color-sheet", { figure: "3.95" }),
    });
    expect(below.out).toEqual([
      `${at(2)} below-threshold: light color-ink on color-canvas: 4.5000:1 is below the text threshold of 4.5:1`,
      `${at(3)} below-threshold: light color-ink on color-sheet: 3.9487:1 is below the text threshold of 4.5:1`,
      "contrast: 2 findings",
    ]);
    const above = await contrast({
      overrides: [{ token: "color-ink", light: "#7C7290" }],
      pairs: setPair(setPair(pairs, "light", "color-ink", "color-canvas", { figure: "4.50" }), "light", "color-ink", "color-sheet", { figure: "3.95" }),
    });
    expect(above.out).toEqual([`${at(3)} below-threshold: light color-ink on color-sheet: 3.9487:1 is below the text threshold of 4.5:1`, "contrast: 1 finding"]);
  });

  it("gives figure-mismatch, then below-threshold, for one entry that has both (US3 scenario 4)", async () => {
    const ran = await contrast({ overrides: [{ token: "color-border", light: "#BB7BDF" }] });
    expect(ran.out).toEqual([
      `${at(4)} figure-mismatch: light color-border on color-canvas: recorded figure 4.54, computed 2.9950`,
      `${at(4)} below-threshold: light color-border on color-canvas: 2.9950:1 is below the non-text threshold of 3:1`,
      "contrast: 2 findings",
    ]);
  });

  it("exempts the disabled ink from the threshold, and not a token without exempt", async () => {
    expect((await contrast({})).code).toBe(0);
    const notExempt = await contrast({ overrides: [{ token: "color-disabled-ink", contrast: { kind: "text", grounds: ["color-canvas"] } }] });
    expect(notExempt.out).toEqual([
      `${at(6)} below-threshold: light color-disabled-ink on color-canvas: 2.3231:1 is below the text threshold of 4.5:1`,
      `${at(12)} below-threshold: dark color-disabled-ink on color-canvas: 2.8168:1 is below the text threshold of 4.5:1`,
      "contrast: 2 findings",
    ]);
  });

  it("does not apply the threshold to an excluded pair, and does once it is checked", async () => {
    const checked = await contrast({ pairs: setPair(pairs, "light", "color-mark", "color-sheet", { status: "checked" }) });
    expect(checked.out).toEqual([`${at(7)} below-threshold: light color-mark on color-sheet: 3.9858:1 is below the text threshold of 4.5:1`, "contrast: 1 finding"]);
  });

  it("uses the entry's kind for the threshold", async () => {
    const asText = await contrast({ pairs: setPair(pairs, "light", "color-focus", "color-sheet", { kind: "text" }) });
    expect(asText.out).toEqual([
      `${at(5)} below-threshold: light color-focus on color-sheet: 3.9858:1 is below the text threshold of 4.5:1`,
      `${sourcePath}:${String(line.focus)}: contrast: missing-required-pair: light color-focus on color-sheet: the required non-text pair is not in the pair list`,
      "contrast: 2 findings",
    ]);
  });
});

describe("contrast: excluded pairs", () => {
  it.each([
    { name: "an empty reason", fields: { reason: "" } },
    { name: "a reason of spaces", fields: { reason: "  " } },
    { name: "no reason", fields: { reason: undefined } },
  ])("reports an excluded pair with $name", async ({ fields }) => {
    expect((await contrast({ pairs: setPair(pairs, "light", "color-mark", "color-sheet", fields) })).out).toEqual([
      `${at(7)} excluded-without-reason: light color-mark on color-sheet: an excluded pair needs a reason`,
      "contrast: 1 finding",
    ]);
  });

  it("reports a required pair listed as excluded, and not as missing (US3 scenario 5)", async () => {
    const ran = await contrast({ pairs: setPair(pairs, "dark", "color-ink", "color-sheet", { status: "excluded", reason: "x" }) });
    expect(ran.out).toEqual([
      `${at(9)} required-pair-excluded: dark color-ink on color-sheet: a required text pair cannot be excluded (to stop requiring it, change the intended grounds in the token source)`,
      "contrast: 1 finding",
    ]);
  });

  it("gives both findings for a required pair excluded without a reason", async () => {
    const ran = await contrast({ pairs: setPair(pairs, "dark", "color-ink", "color-sheet", { status: "excluded" }) });
    expect(ran.out.slice(0, -1).map((l) => l.split(": ")[2])).toEqual(["excluded-without-reason", "required-pair-excluded"]);
  });
});

describe("contrast: unknown-token and not-opaque", () => {
  it("reports a pair naming a token that does not exist, and nothing else for it (US3 scenario 5)", async () => {
    const ran = await contrast({ pairs: [...pairs, entry("light", "color-inc", "color-canvas", "text", "0")] });
    expect(ran.out).toEqual([`${at(13)} unknown-token: light color-inc on color-canvas: unknown token color-inc`, "contrast: 1 finding"]);
  });

  it("names both tokens when neither exists", async () => {
    const ran = await contrast({ pairs: [...pairs, entry("dark", "color-a", "color-b", "non-text", "0", { status: "excluded" })] });
    expect(ran.out).toEqual([`${at(13)} unknown-token: dark color-a on color-b: unknown token color-a, color-b`, "contrast: 1 finding"]);
  });

  it("reports a translucent ground (resolved) and gives no other finding for that entry", async () => {
    const ran = await contrast({ pairs: [...pairs, entry("light", "color-ink", "color-overlay", "text", "0")] });
    expect(ran.out).toEqual([`${at(13)} not-opaque: light color-ink on color-overlay: not an opaque colour in light: color-overlay (rgb(0 0 0 / 0.5))`, "contrast: 1 finding"]);
  });

  it("reports a token that is not a colour as not opaque, foreground first", async () => {
    const ran = await contrast({ pairs: [...pairs, entry("dark", "space-1", "color-overlay", "text", "0")] });
    expect(ran.out).toEqual([
      `${at(13)} not-opaque: dark space-1 on color-overlay: not an opaque colour in dark: space-1 (0.25rem), color-overlay (rgb(0 0 0 / 0.65))`,
      "contrast: 1 finding",
    ]);
  });

  it("judges opacity on the resolved value: a token referencing the overlay is not opaque", async () => {
    const veil = { add: { name: "color-veil", group: "colour", value: { light: "var(--ocelle-color-overlay)", dark: "#000000" }, ref: { light: ["color-overlay"], dark: [] } } };
    const ran = await contrast({ overrides: [veil], pairs: [...pairs, entry("light", "color-ink", "color-veil", "text", "0"), entry("dark", "color-ink", "color-veil", "text", "20.0")] });
    expect(ran.out).toEqual([
      `${at(13)} not-opaque: light color-ink on color-veil: not an opaque colour in light: color-veil (rgb(0 0 0 / 0.5))`,
      `${at(14)} figure-mismatch: dark color-ink on color-veil: recorded figure 20.0, computed 21.0000`,
      "contrast: 2 findings",
    ]);
  });
});

describe("contrast: missing-required-pair", () => {
  it("reports a required pair the list lacks at the foreground token's line in source.ts (US3 scenario 5)", async () => {
    expect((await contrast({ pairs: withoutPair(pairs, "dark", "color-focus", "color-sheet") })).out).toEqual([
      `${sourcePath}:${String(line.focus)}: contrast: missing-required-pair: dark color-focus on color-sheet: the required non-text pair is not in the pair list`,
      "contrast: 1 finding",
    ]);
  });

  it("counts a pair of another kind as missing", async () => {
    const ran = await contrast({ pairs: setPair(pairs, "light", "color-border", "color-canvas", { kind: "text" }) });
    expect(ran.out).toEqual([
      `${sourcePath}:${String(line.border)}: contrast: missing-required-pair: light color-border on color-canvas: the required non-text pair is not in the pair list`,
      "contrast: 1 finding",
    ]);
  });

  it("derives the required set from the source: a ground added by an override is required, a ground removed is not", async () => {
    const ran = await contrast({ overrides: [{ token: "color-border", contrast: { kind: "non-text", grounds: ["color-sheet"] } }] });
    expect(ran.out).toEqual([
      `${sourcePath}:${String(line.border)}: contrast: missing-required-pair: light color-border on color-sheet: the required non-text pair is not in the pair list`,
      `${sourcePath}:${String(line.border)}: contrast: missing-required-pair: dark color-border on color-sheet: the required non-text pair is not in the pair list`,
      "contrast: 2 findings",
    ]);
  });

  it("locates a token only an override adds at its line in overrides.ts", async () => {
    const extra = { add: { name: "color-extra", group: "colour", value: { light: "#000000", dark: "#FFFFFF" }, contrast: { kind: "text", grounds: ["color-canvas"] } } };
    const ran = await contrast({ overrides: [{ token: "color-ink", light: "#000000" }, extra] });
    expect(ran.out).toEqual([
      "packages/tokens/src/overrides.ts:4: contrast: missing-required-pair: light color-extra on color-canvas: the required text pair is not in the pair list",
      "packages/tokens/src/overrides.ts:4: contrast: missing-required-pair: dark color-extra on color-canvas: the required text pair is not in the pair list",
      "contrast: 2 findings",
    ]);
  });

  it("prints the entry findings in the order of the list's lines, then the missing pairs in the order of the source", async () => {
    let list = withoutPair(withoutPair(pairs, "light", "color-disabled-ink", "color-canvas"), "light", "color-ink", "color-sheet");
    list = setPair(list, "dark", "color-border", "color-canvas", { figure: "6.2" });
    list = setPair(list, "light", "color-mark", "color-sheet", { reason: "" });
    list = [...list, entry("light", "color-nope", "color-canvas", "text", "1")];
    const ran = await contrast({ pairs: list });
    expect(ran.out).toEqual([
      `${at(5)} excluded-without-reason: light color-mark on color-sheet: an excluded pair needs a reason`,
      `${at(8)} figure-mismatch: dark color-border on color-canvas: recorded figure 6.2, computed 6.0830`,
      `${at(11)} unknown-token: light color-nope on color-canvas: unknown token color-nope`,
      `${sourcePath}:${String(line.ink)}: contrast: missing-required-pair: light color-ink on color-sheet: the required text pair is not in the pair list`,
      `${sourcePath}:${String(line.disabled)}: contrast: missing-required-pair: light color-disabled-ink on color-canvas: the required text pair is not in the pair list`,
      "contrast: 5 findings",
    ]);
  });
});

describe("contrast: could not run (exit 2)", () => {
  const cannot = (cause: string): GateRun => ({ code: 2, out: [], err: [`contrast: cannot run: ${cause}`] });

  it("names the pair list when it is missing", async () => {
    const ran = await runGate(run, ["--root", tree({ records })]);
    expect({ code: ran.code, out: ran.out, err: ran.err.map((l) => l.startsWith(`contrast: cannot run: ${pairsPath}: cannot read it (`)) }).toEqual({
      code: 2,
      out: [],
      err: [true],
    });
  });

  it.each([
    { text: "[]\n", cause: "the list is empty" },
    { text: "{\n", cause: "not JSON" },
    { text: "{}\n", cause: "not a list of pairs" },
    { text: "[\n  1\n]\n", cause: "entry 1 is not an object" },
    { text: '[\n  {"theme":"light"}\n]\n', cause: "entry 1: fg must be a token name" },
  ])("names the pair list and the cause for $text", async ({ text, cause }) => {
    const ran = await contrast({ pairs: text });
    expect({ code: ran.code, out: ran.out, err: ran.err.map((l) => l.startsWith(`contrast: cannot run: ${pairsPath}: ${cause}`)) }).toEqual({ code: 2, out: [], err: [true] });
  });

  it.each([
    { fields: { theme: "sepia" }, cause: "entry 2: theme must be light or dark" },
    { fields: { fg: "" }, cause: "entry 2: fg must be a token name" },
    { fields: { bg: 3 }, cause: "entry 2: bg must be a token name" },
    { fields: { kind: "large-text" }, cause: "entry 2: kind must be text or non-text" },
    { fields: { figure: 18.43 }, cause: "entry 2: figure must be a decimal number written as a string" },
    { fields: { figure: "18,43" }, cause: "entry 2: figure must be a decimal number written as a string" },
    { fields: { figure: ".5" }, cause: "entry 2: figure must be a decimal number written as a string" },
    { fields: { figure: "5." }, cause: "entry 2: figure must be a decimal number written as a string" },
    { fields: { status: "skipped" }, cause: "entry 2: status must be checked or excluded" },
    { fields: { reason: 1 }, cause: "entry 2: reason must be a string" },
    { fields: { source: "#6" }, cause: "entry 2: source must be #5 or computed" },
    { fields: { note: "x" }, cause: "entry 2: unknown field note" },
  ])("rejects an entry that is not the schema: $cause", async ({ fields, cause }) => {
    expect(await contrast({ pairs: setPair(pairs, "light", "color-ink", "color-sheet", fields) })).toEqual(cannot(`${pairsPath}: ${cause}`));
  });

  it("rejects a list that does not hold one entry per line", async () => {
    const text = `[\n${JSON.stringify(pairs[0])}, ${JSON.stringify(pairs[1])}\n]\n`;
    expect(await contrast({ pairs: text })).toEqual(cannot(`${pairsPath}: not one entry per line`));
  });

  it("reads an entry written over several lines at its first line", async () => {
    const [first, ...rest] = pairs;
    const text = `[\n${JSON.stringify({ ...first, figure: "20.9" }, null, 2)},\n${rest.map((e) => JSON.stringify(e)).join(",\n")}\n]\n`;
    expect((await contrast({ pairs: text })).out).toEqual([`${at(2)} figure-mismatch: light color-ink on color-canvas: recorded figure 20.9, computed 21.0000`, "contrast: 1 finding"]);
  });

  it("names the theme that has no entry", async () => {
    expect(await contrast({ pairs: pairs.filter((e) => e.theme === "light") })).toEqual(cannot("no pairs for dark"));
    expect(await contrast({ pairs: pairs.filter((e) => e.theme === "dark") })).toEqual(cannot("no pairs for light"));
  });

  it("names the token source when it fails validation", async () => {
    const ran = await contrast({ records: [...records, ...records.slice(0, 1)] });
    expect(ran).toEqual(cannot(`${sourcePath}: invalid token source: token color-canvas: duplicate name`));
  });

  it("names the token source when it throws while loading", async () => {
    const ran = await contrast({ overrides: 'throw new Error("planted");\n' });
    expect(ran).toEqual(cannot(`${sourcePath}: planted`));
  });

  it("names the token source when it exports no source list", async () => {
    expect(await contrast({ sourceText: "export const records = [];\n" })).toEqual(cannot(`${sourcePath}: it exports no source list`));
  });

  it("names the generator when it does not load or lacks a function", async () => {
    expect(await contrast({ generatorText: 'throw new Error("no generator");\n' })).toEqual(cannot("packages/tokens/src/generate.ts: no generator"));
    expect(await contrast({ generatorText: "export const resolve = 1;\nexport function applyOverrides(r) { return r; }\n" })).toEqual(
      cannot("packages/tokens/src/generate.ts: it exports no resolve function"),
    );
  });
});

describe("contrast: --print", () => {
  it("lists every required pair with its ratio at four decimals, in source order, and exits 0 without reading the pair list", async () => {
    const ran = await runGate(run, ["--root", tree({ records }), "--print"]);
    expect(ran).toEqual({
      code: 0,
      out: [
        "light color-ink on color-canvas (text): 21.0000",
        "dark color-ink on color-canvas (text): 21.0000",
        "light color-ink on color-sheet (text): 18.4273",
        "dark color-ink on color-sheet (text): 16.2933",
        "light color-border on color-canvas (non-text): 4.5422",
        "dark color-border on color-canvas (non-text): 6.0830",
        "light color-focus on color-sheet (non-text): 3.9858",
        "dark color-focus on color-sheet (non-text): 4.7196",
        "light color-disabled-ink on color-canvas (text): 2.3231",
        "dark color-disabled-ink on color-canvas (text): 2.8168",
      ],
      err: [],
    });
  });
});
