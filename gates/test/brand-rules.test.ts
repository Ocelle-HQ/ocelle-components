import { afterEach, describe, expect, it } from "vitest";
import { css } from "../../packages/tokens/src/generate.ts";
import type { TokenRecord } from "../../packages/tokens/src/generate.ts";
import { run } from "../bin/brand-rules.ts";
import { cleanTrees, lineOf, repoRoot, runGate, tree } from "./token-tree.ts";
import type { Data, GateRun, TreeSpec } from "./token-tree.ts";

// The brand-rules gate (002 FR-018, FR-019; research.md R-08; contracts/gates.md § `brand-rules`), in process on
// fixture roots: one fixture per rule (a) to (g) with its rule id, the exit 2 causes and the success line. The
// fixture source holds Appendix A's values of the tokens the rules read. Ratios and luminances (WCAG 2.x, computed for
// this test by hand): #C68A1E on #F1EEE8 2.5704, on #FBFAF7 2.8516; #5A5A5A on #15130F 2.6899, on #211E18 2.4097;
// #8A8276 on #F1EEE8 3.2763, on #FBFAF7 3.6347; #A0A0A0 on #F1EEE8 2.2582, on #FBFAF7 2.5053; #6E6E6E on #15130F
// 3.6385, on #211E18 3.2595; relative luminance #3F3F3F 0.0497, #404040 0.0513, #FFFFFF 1.
const sourcePath = "packages/tokens/src/source.ts";
const overridesPath = "packages/tokens/src/overrides.ts";
const pairsPath = "packages/tokens/contrast/pairs.json";
const cssPath = "packages/tokens/dist/tokens.css";

/** The fixture source; record i is on line 5 + i of source.ts. */
const records: readonly Data[] = [
  { name: "color-canvas", group: "colour", value: { light: "#F1EEE8", dark: "#15130F" } },
  { name: "color-sheet", group: "colour", value: { light: "#FBFAF7", dark: "#211E18" } },
  { name: "color-rule", group: "colour", value: { light: "#D9D3C7", dark: "#3A342B" } },
  { name: "color-rule-strong", group: "colour", value: { light: "#B9B1A2", dark: "#4D463A" } },
  { name: "color-control-border", group: "colour", value: { light: "#8A8276", dark: "#7A7264" } },
  { name: "color-chrome", group: "colour", value: { light: "#15130F", dark: "#0D0C0A" } },
  { name: "color-chrome-hover", group: "colour", value: { light: "#211D18", dark: "#24211B" } },
  { name: "color-chrome-ink", group: "colour", value: { light: "#EDE9E1", dark: "#EDE9E1" } },
  { name: "color-chrome-muted", group: "colour", value: { light: "#A39D92", dark: "#A39D92" } },
  { name: "color-accent", group: "colour", value: { light: "#C68A1E", dark: "#C68A1E" } },
  { name: "color-link", group: "colour", value: { light: "#84560D", dark: "#E0A23A" } },
  { name: "font-sans", group: "type", value: '"Schibsted Grotesk", "Helvetica Neue", Arial, system-ui, sans-serif' },
  { name: "font-display", group: "type", value: "var(--ocelle-font-sans)", ref: ["font-sans"] },
  { name: "figures", group: "type", value: "tabular-nums" },
  { name: "radius-1", group: "shape", value: "2px" },
  { name: "radius-2", group: "shape", value: "4px" },
  { name: "radius-row", group: "shape", value: "6px" },
  { name: "radius-shell", group: "shape", value: "10px" },
  { name: "radius-pill", group: "shape", value: "999px" },
  { name: "motion-fast", group: "motion", value: "120ms" },
  { name: "motion-base", group: "motion", value: "200ms" },
];
const line = {
  ruleLight: 7,
  ruleStrong: 8,
  controlBorder: 9,
  chrome: 10,
  chromeHover: 11,
  chromeInk: 12,
  accent: 14,
  link: 15,
  fontSans: 16,
  radius2: 20,
} as const;
const ochre: Data = { theme: "light", fg: "color-accent", bg: "color-canvas", kind: "text", figure: "2.6", status: "excluded", reason: "ochre text never on bone", source: "#5" };

async function brandRules(spec: TreeSpec): Promise<GateRun> {
  return runGate(run, ["--root", tree({ records, pairs: [ochre], ...spec })]);
}

/** A generator wrapper (a plant's `generator: "wrapped"`) whose css() changes the real stylesheet with `change`. */
function wrapper(change: string): string {
  return [
    'import { css as realCss } from "./generate.real.ts";',
    'import type { TokenRecord } from "./generate.real.ts";',
    'export * from "./generate.real.ts";',
    `export function css(source: readonly TokenRecord[]): string { const text = realCss(source); return ${change}; }`,
    "",
  ].join("\n");
}

/** The stylesheet the real generator makes from the fixture source, changed as a wrapper's css() changes it. */
const stylesheet = css(records as unknown as readonly TokenRecord[]);
const findings = (ran: GateRun): string[] => ran.out.slice(0, -1);

afterEach(cleanTrees);

describe("brand-rules: success", () => {
  it("passes the fixture and reports the seven rules checked", async () => {
    expect(await brandRules({})).toEqual({ code: 0, out: ["brand-rules: 7 rules checked"], err: [] });
  });

  it("passes the repository's values", async () => {
    expect(await runGate(run, ["--root", repoRoot])).toEqual({ code: 0, out: ["brand-rules: 7 rules checked"], err: [] });
  });
});

describe("brand-rules (a) monospace-font", () => {
  it("rejects a monospace family in font-sans at its line, and not the derived font-display", async () => {
    expect(await brandRules({ overrides: [{ token: "font-sans", value: '"Menlo", sans-serif' }] })).toEqual({
      code: 1,
      out: [`${sourcePath}:${String(line.fontSans)}: brand-rules: monospace-font: font-sans names the monospace family Menlo`, "brand-rules: 1 finding"],
      err: [],
    });
  });

  it("names every monospace family of a type token an override adds, at its line in overrides.ts", async () => {
    const ran = await brandRules({ overrides: [{ add: { name: "font-code", group: "type", value: "ui-monospace, Courier New, monospace" } }] });
    expect(findings(ran)).toEqual([`${overridesPath}:3: brand-rules: monospace-font: font-code names the monospace family ui-monospace, Courier New, monospace`]);
  });
});

describe("brand-rules (a) monospace-font: only type tokens", () => {
  it("does not read a token outside the type group as a font", async () => {
    const ran = await brandRules({ overrides: [{ add: { name: "size-monospace", group: "size", value: "monospace" } }] });
    expect(ran).toEqual({ code: 0, out: ["brand-rules: 7 rules checked"], err: [] });
  });
});

describe("brand-rules (b) link-accent", () => {
  it("rejects color-link equal to color-accent, which also fails 4.5:1 on canvas and sheet (US3 scenario 6)", async () => {
    const ran = await brandRules({ overrides: [{ token: "color-link", light: "#c68a1e" }] });
    expect(findings(ran)).toEqual([
      `${sourcePath}:${String(line.link)}: brand-rules: link-accent: color-link equals color-accent in light; color-link is 2.5704:1 on color-canvas in light, below 4.5:1; color-link is 2.8516:1 on color-sheet in light, below 4.5:1`,
    ]);
  });

  it("rejects color-link below 4.5:1 on canvas and sheet in dark", async () => {
    const ran = await brandRules({ overrides: [{ token: "color-link", dark: "#5A5A5A" }] });
    expect(findings(ran)).toEqual([
      `${sourcePath}:${String(line.link)}: brand-rules: link-accent: color-link is 2.6899:1 on color-canvas in dark, below 4.5:1; color-link is 2.4097:1 on color-sheet in dark, below 4.5:1`,
    ]);
  });

  it("rejects the ochre pair listed as checked, at its line in the pair list", async () => {
    const ran = await brandRules({ pairs: [{ ...ochre, status: "checked" }] });
    expect(findings(ran)).toEqual([`${pairsPath}:2: brand-rules: link-accent: the pair color-accent on color-canvas in light is not listed as an excluded text pair`]);
  });

  it("rejects the ochre pair listed as excluded but not as a text pair", async () => {
    const ran = await brandRules({ pairs: [{ theme: "dark", fg: "color-ink", bg: "color-ink", kind: "text", figure: "1.0", status: "checked", source: "computed" }, { ...ochre, kind: "non-text" }] });
    expect(findings(ran)).toEqual([`${pairsPath}:3: brand-rules: link-accent: the pair color-accent on color-canvas in light is not listed as an excluded text pair`]);
  });

  it("rejects a pair list without the ochre pair (only a dark one), at color-accent's line (US3 scenario 6)", async () => {
    const ran = await brandRules({ pairs: [{ ...ochre, theme: "dark" }] });
    expect(findings(ran)).toEqual([`${sourcePath}:${String(line.accent)}: brand-rules: link-accent: the pair color-accent on color-canvas in light is not listed as an excluded text pair`]);
  });

  it("does not take color-accent on another ground for the ochre pair", async () => {
    expect(findings(await brandRules({ pairs: [{ ...ochre, bg: "color-sheet" }] }))).toEqual([
      `${sourcePath}:${String(line.accent)}: brand-rules: link-accent: the pair color-accent on color-canvas in light is not listed as an excluded text pair`,
    ]);
  });

  it("rejects an empty pair list the same way", async () => {
    expect(findings(await brandRules({ pairs: [] }))).toEqual([
      `${sourcePath}:${String(line.accent)}: brand-rules: link-accent: the pair color-accent on color-canvas in light is not listed as an excluded text pair`,
    ]);
  });
});

describe("brand-rules (c) radius-set", () => {
  it("rejects a second radius at 4px outside the closed set, at its line in overrides.ts (US3 scenario 6)", async () => {
    const ran = await brandRules({ overrides: [{ add: { name: "radius-4", group: "shape", value: "4px" } }] });
    expect(findings(ran)).toEqual([
      `${overridesPath}:3: brand-rules: radius-set: radius-4 is not in the closed radius set (radius-1, radius-2, radius-row, radius-shell, radius-pill)`,
    ]);
  });

  it("rejects a radius of the set with another value", async () => {
    const ran = await brandRules({ overrides: [{ token: "radius-2", value: "5px" }] });
    expect(findings(ran)).toEqual([`${sourcePath}:${String(line.radius2)}: brand-rules: radius-set: radius-2 is 5px, expected 4px`]);
  });

  it("rejects a missing radius of the set, at its record in source.ts when an override removes it, else at the token source", async () => {
    const ran = await brandRules({ overrides: [{ remove: "radius-pill" }, { remove: "radius-1" }] });
    expect(findings(ran)).toEqual([`${sourcePath}:19: brand-rules: radius-set: radius-1 is missing`, `${sourcePath}:23: brand-rules: radius-set: radius-pill is missing`]);
    const absent = await brandRules({ records: records.filter((record) => record.name !== "radius-row") });
    expect(findings(absent)).toEqual([`${sourcePath}: brand-rules: radius-set: radius-row is missing`]);
  });
});

describe("brand-rules (d) rule-boundary", () => {
  it("rejects color-rule at or above 3:1 on canvas and sheet", async () => {
    const ran = await brandRules({ overrides: [{ token: "color-rule", light: "#8A8276" }] });
    expect(findings(ran)).toEqual([
      `${sourcePath}:${String(line.ruleLight)}: brand-rules: rule-boundary: color-rule is 3.2763:1 on color-canvas in light, at or above 3:1; color-rule is 3.6347:1 on color-sheet in light, at or above 3:1`,
    ]);
  });

  it("rejects color-rule-strong at or above 3:1 in dark", async () => {
    const ran = await brandRules({ overrides: [{ token: "color-rule-strong", dark: "#6E6E6E" }] });
    expect(findings(ran)).toEqual([
      `${sourcePath}:${String(line.ruleStrong)}: brand-rules: rule-boundary: color-rule-strong is 3.6385:1 on color-canvas in dark, at or above 3:1; color-rule-strong is 3.2595:1 on color-sheet in dark, at or above 3:1`,
    ]);
  });

  it("rejects color-control-border below 3:1 on canvas and sheet", async () => {
    const ran = await brandRules({ overrides: [{ token: "color-control-border", light: "#A0A0A0" }] });
    expect(findings(ran)).toEqual([
      `${sourcePath}:${String(line.controlBorder)}: brand-rules: rule-boundary: color-control-border is 2.2582:1 on color-canvas in light, below 3:1; color-control-border is 2.5053:1 on color-sheet in light, below 3:1`,
    ]);
  });
});

describe("brand-rules (e) dark-chrome", () => {
  it("rejects a chrome ground with a relative luminance above 0.05, per theme", async () => {
    const ran = await brandRules({ overrides: [{ token: "color-chrome", light: "#FFFFFF" }, { token: "color-chrome-hover", dark: "#404040" }] });
    expect(findings(ran)).toEqual([
      `${sourcePath}:${String(line.chrome)}: brand-rules: dark-chrome: color-chrome has relative luminance 1.0000 in light, above 0.05`,
      `${sourcePath}:${String(line.chromeHover)}: brand-rules: dark-chrome: color-chrome-hover has relative luminance 0.0513 in dark, above 0.05`,
    ]);
  });

  it("reports a missing chrome ground or chrome ink once, and a chrome ink that is not opaque in one theme", async () => {
    const missing = await brandRules({ overrides: [{ remove: "color-chrome-hover" }, { remove: "color-chrome-ink" }] });
    expect(findings(missing)).toEqual([
      `${sourcePath}:${String(line.chromeHover)}: brand-rules: dark-chrome: color-chrome-hover is missing`,
      `${sourcePath}:${String(line.chromeInk)}: brand-rules: dark-chrome: color-chrome-ink is missing`,
    ]);
    const overlay = { add: { name: "color-overlay", group: "colour", value: { light: "#000000", dark: "rgb(0 0 0 / 0.5)" } } };
    const translucent = await brandRules({ overrides: [overlay, { token: "color-chrome-ink", dark: "var(--ocelle-color-overlay)", ref: { light: [], dark: ["color-overlay"] } }] });
    expect(findings(translucent)).toEqual([`${sourcePath}:${String(line.chromeInk)}: brand-rules: dark-chrome: color-chrome-ink is not an opaque colour in dark`]);
  });

  it("accepts a chrome ground at 0.0497", async () => {
    expect(await brandRules({ overrides: [{ token: "color-chrome-hover", light: "#3F3F3F", dark: "#3F3F3F" }] })).toEqual({ code: 0, out: ["brand-rules: 7 rules checked"], err: [] });
  });

  it("rejects chrome ink that differs between themes, and accepts the same colour in another case", async () => {
    const ran = await brandRules({ overrides: [{ token: "color-chrome-ink", dark: "#FFFFFF" }, { token: "color-chrome-muted", dark: "#a39d92" }] });
    expect(findings(ran)).toEqual([
      `${sourcePath}:${String(line.chromeInk)}: brand-rules: dark-chrome: color-chrome-ink differs between themes (#EDE9E1 in light, #FFFFFF in dark)`,
    ]);
  });
});

// Rule (f) since 012 (plan decision 29; operator decision at phase 4, option (a); tasks.md T042a): the reduced-motion
// block sets exactly every motion token whose source value is a duration to 0ms, the set read from the token source,
// not a list of names; the messages name the motion durations. The cases of 002's rule (f) are kept with the new
// message; a source with motion-spin needs it in the block, and a motion token that is no duration (motion-turn) is
// rejected there.
const onlyDurations = "only the motion durations, each 0ms, belong there";
const spin: Data = { name: "motion-spin", group: "motion", value: "800ms" };
const turn: Data = { name: "motion-turn", group: "motion", value: "1turn" };

describe("brand-rules (f) reduced-motion", () => {
  it("rejects a reduced-motion value other than 0ms, at its line in the stylesheet", async () => {
    const ran = await brandRules({ wrapper: wrapper('text.replace("--ocelle-motion-fast: 0ms;", "--ocelle-motion-fast: 60ms;")') });
    expect(findings(ran)).toEqual([`${cssPath}:${String(lineOf(stylesheet, "--ocelle-motion-fast: 0ms"))}: brand-rules: reduced-motion: --ocelle-motion-fast: 60ms in the reduced-motion block; ${onlyDurations}`]);
  });

  it("rejects another property in the reduced-motion block", async () => {
    const ran = await brandRules({ wrapper: wrapper('text.replace("--ocelle-motion-base: 0ms;", "--ocelle-motion-base: 0ms;\\n    --ocelle-easing-standard: linear;")') });
    expect(findings(ran)).toEqual([`${cssPath}:${String(lineOf(stylesheet, "--ocelle-motion-base: 0ms") + 1)}: brand-rules: reduced-motion: --ocelle-easing-standard: linear in the reduced-motion block; ${onlyDurations}`]);
  });

  it("rejects a reduced-motion block that does not set one of the motion durations, at the block's line", async () => {
    const ran = await brandRules({ wrapper: wrapper('text.replace("    --ocelle-motion-base: 0ms;\\n", "")') });
    expect(findings(ran)).toEqual([`${cssPath}:${String(lineOf(stylesheet, "prefers-reduced-motion: reduce"))}: brand-rules: reduced-motion: the reduced-motion block does not set --ocelle-motion-base to 0ms`]);
  });

  it("accepts --ocelle-motion-spin: 0ms from the generator when the source has motion-spin, and rejects the same block without it at the block's line", async () => {
    const withSpin = [...records, spin];
    const sheet = css(withSpin as unknown as readonly TokenRecord[]);
    expect(await brandRules({ records: withSpin })).toEqual({ code: 0, out: ["brand-rules: 7 rules checked"], err: [] });
    const dropped = await brandRules({ records: withSpin, wrapper: wrapper('text.replace("    --ocelle-motion-spin: 0ms;\\n", "")') });
    expect(findings(dropped)).toEqual([`${cssPath}:${String(lineOf(sheet, "prefers-reduced-motion: reduce"))}: brand-rules: reduced-motion: the reduced-motion block does not set --ocelle-motion-spin to 0ms`]);
  });

  it("rejects --ocelle-motion-spin in the block when the source has no motion-spin, since only the source's durations belong there", async () => {
    const ran = await brandRules({ wrapper: wrapper('text.replace("--ocelle-motion-base: 0ms;", "--ocelle-motion-base: 0ms;\\n    --ocelle-motion-spin: 0ms;")') });
    expect(findings(ran)).toEqual([`${cssPath}:${String(lineOf(stylesheet, "--ocelle-motion-base: 0ms") + 1)}: brand-rules: reduced-motion: --ocelle-motion-spin: 0ms in the reduced-motion block; ${onlyDurations}`]);
  });

  it("rejects a motion token that is no duration (motion-turn, an angle) in the block, and does not require it there", async () => {
    const withTurn = [...records, turn];
    const sheet = css(withTurn as unknown as readonly TokenRecord[]);
    expect(await brandRules({ records: withTurn })).toEqual({ code: 0, out: ["brand-rules: 7 rules checked"], err: [] });
    const ran = await brandRules({ records: withTurn, wrapper: wrapper('text.replace("--ocelle-motion-base: 0ms;", "--ocelle-motion-base: 0ms;\\n    --ocelle-motion-turn: 0ms;")') });
    expect(findings(ran)).toEqual([`${cssPath}:${String(lineOf(sheet, "--ocelle-motion-base: 0ms") + 1)}: brand-rules: reduced-motion: --ocelle-motion-turn: 0ms in the reduced-motion block; ${onlyDurations}`]);
  });

  it("requires a duration of group motion only: a duration of another group is not required and is rejected in the block", async () => {
    const withOther = [...records, { name: "delay-other", group: "shell", value: "50ms" }];
    const sheet = css(withOther as unknown as readonly TokenRecord[]);
    expect(await brandRules({ records: withOther })).toEqual({ code: 0, out: ["brand-rules: 7 rules checked"], err: [] });
    const ran = await brandRules({ records: withOther, wrapper: wrapper('text.replace("--ocelle-motion-base: 0ms;", "--ocelle-motion-base: 0ms;\\n    --ocelle-delay-other: 0ms;")') });
    expect(findings(ran)).toEqual([`${cssPath}:${String(lineOf(sheet, "--ocelle-motion-base: 0ms") + 1)}: brand-rules: reduced-motion: --ocelle-delay-other: 0ms in the reduced-motion block; ${onlyDurations}`]);
  });

  it("reads the reduced-motion query with any spacing around its colon, and only in @media", async () => {
    const spaced = await brandRules({ wrapper: wrapper('text.replace("(prefers-reduced-motion: reduce)", "(prefers-reduced-motion :reduce)")') });
    expect(spaced).toEqual({ code: 0, out: ["brand-rules: 7 rules checked"], err: [] });
    const supports = await brandRules({ wrapper: wrapper('text + "@supports (prefers-reduced-motion: reduce) {\\n  :root {\\n    --ocelle-x: 1;\\n  }\\n}\\n"') });
    expect(supports).toEqual({ code: 0, out: ["brand-rules: 7 rules checked"], err: [] });
  });

  it("rejects a stylesheet without a reduced-motion block", async () => {
    const ran = await brandRules({ wrapper: wrapper('text.slice(0, text.indexOf("@media (prefers-reduced-motion: reduce)"))') });
    expect(findings(ran)).toEqual([`${cssPath}: brand-rules: reduced-motion: no @media (prefers-reduced-motion: reduce) block`]);
  });
});

describe("brand-rules (g) forced-colours", () => {
  const forced = (declarations: string): string =>
    wrapper(`text + ${JSON.stringify(`\n@media (forced-colors: active) {\n  :root {\n${declarations}  }\n}\n`)}`);

  it("rejects a colour token set to a hex value in a forced-colours block, at its line", async () => {
    const appended = "    --ocelle-color-ink: CanvasText;\n    --ocelle-color-canvas: #FFFFFF;\n    --ocelle-space-1: 0;\n";
    const ran = await brandRules({ wrapper: forced(appended) });
    const text = `${stylesheet}\n@media (forced-colors: active) {\n  :root {\n${appended}  }\n}\n`;
    expect(findings(ran)).toEqual([
      `${cssPath}:${String(lineOf(text, "--ocelle-color-canvas: #FFFFFF"))}: brand-rules: forced-colours: --ocelle-color-canvas: #FFFFFF in a forced-colours block; a colour token may only map to a system colour`,
    ]);
  });

  it("accepts colour tokens mapped to system colours, in any case", async () => {
    const mapped = ["CanvasText", "Canvas", "LinkText", "ButtonBorder", "Highlight", "GrayText", "canvastext"].map((colour, i) => `    --ocelle-color-x${String(i)}: ${colour};\n`).join("");
    expect(await brandRules({ wrapper: forced(mapped) })).toEqual({ code: 0, out: ["brand-rules: 7 rules checked"], err: [] });
  });

  it("rejects forced-color-adjust: none anywhere in the stylesheet, and accepts auto", async () => {
    const none = await brandRules({ wrapper: wrapper('text + ":root {\\n  forced-color-adjust: none;\\n}\\n"') });
    expect(findings(none)).toEqual([`${cssPath}:${String(stylesheet.split("\n").length + 1)}: brand-rules: forced-colours: forced-color-adjust: none defeats forced colours`]);
    expect((await brandRules({ wrapper: wrapper('text + ":root {\\n  forced-color-adjust: auto;\\n}\\n"') })).code).toBe(0);
    const upper = await brandRules({ wrapper: wrapper('text + ":root {\\n  FORCED-COLOR-ADJUST: NONE;\\n}\\n"') });
    expect(findings(upper)).toEqual([`${cssPath}:${String(stylesheet.split("\n").length + 1)}: brand-rules: forced-colours: forced-color-adjust: none defeats forced colours`]);
  });
});

describe("brand-rules: findings of several rules", () => {
  it("prints the findings in rule order (a) to (g), then the count", async () => {
    const ran = await brandRules({
      overrides: [{ token: "radius-2", value: "5px" }, { token: "font-sans", value: "monospace" }],
      pairs: [],
      wrapper: wrapper('text + ":root {\\n  forced-color-adjust: none;\\n}\\n"'),
    });
    expect(ran.out.map((l) => l.split(": ")[2] ?? l)).toEqual(["monospace-font", "link-accent", "radius-set", "forced-colours", "brand-rules: 4 findings"]);
  });

  it("reports a colour token the rules need that is missing, or not opaque, at its record", async () => {
    const ran = await brandRules({ overrides: [{ remove: "color-chrome-muted" }] });
    expect(findings(ran)).toEqual([`${sourcePath}:13: brand-rules: dark-chrome: color-chrome-muted is missing`]);
    const notOpaque = await brandRules({ overrides: [{ add: { name: "color-overlay", group: "colour", value: { light: "rgb(0 0 0 / 0.5)", dark: "#000000" } } }, { token: "color-link", light: "var(--ocelle-color-overlay)", ref: { light: ["color-overlay"], dark: [] } }] });
    expect(findings(notOpaque)).toEqual([`${sourcePath}:${String(line.link)}: brand-rules: link-accent: color-link is not an opaque colour in light`]);
  });
});

describe("brand-rules: could not run (exit 2)", () => {
  const cannot = (cause: string): GateRun => ({ code: 2, out: [], err: [`brand-rules: cannot run: ${cause}`] });

  it("names the token source when it is missing, throws, or fails validation (an A.6 name)", async () => {
    const missing = await runGate(run, ["--root", tree({ pairs: [ochre] })]);
    expect({ code: missing.code, err: missing.err.map((l) => l.startsWith(`brand-rules: cannot run: ${sourcePath}: `)) }).toEqual({ code: 2, err: [true] });
    expect(await brandRules({ overrides: 'throw new Error("planted source failure");\n' })).toEqual(cannot(`${sourcePath}: planted source failure`));
    expect(await brandRules({ overrides: [{ add: { name: "radius-3", group: "shape", value: "8px" } }] })).toEqual(
      cannot(`${sourcePath}: invalid token source: token radius-3: excluded token (spec Appendix A.6)`),
    );
  });

  it("names the generator when its stylesheet throws", async () => {
    const throwing = ['export * from "./generate.real.ts";', 'export function css(): string { throw new Error("planted css failure"); }', ""].join("\n");
    expect(await brandRules({ wrapper: throwing })).toEqual(cannot("packages/tokens/src/generate.ts: planted css failure"));
  });

  it("names the pair list when it is missing, not JSON or not the schema", async () => {
    const missing = await runGate(run, ["--root", tree({ records })]);
    expect({ code: missing.code, err: missing.err.map((l) => l.startsWith(`brand-rules: cannot run: ${pairsPath}: cannot read it (`)) }).toEqual({ code: 2, err: [true] });
    expect((await brandRules({ pairs: "[\n" })).err.map((l) => l.startsWith(`brand-rules: cannot run: ${pairsPath}: not JSON`))).toEqual([true]);
    expect(await brandRules({ pairs: [{ ...ochre, status: "maybe" }] })).toEqual(cannot(`${pairsPath}: entry 1: status must be checked or excluded`));
  });
});
