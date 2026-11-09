import type { Browser, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { monospaceFamilies } from "../../../../gates/bin/prefix.ts";
import { themeConditions } from "../../../tokens/test/expected.ts";
import { collectViolations, imagePolicy, launch, policy, serve, violations } from "./serve.ts";
import type { Served } from "./serve.ts";

// The base layer in Chromium (003 spec User Story 1 scenarios 1, 2, 4, 5, 6 (computed half), 7, 9 and 10; FR-006 to
// FR-009, FR-011, FR-022, FR-025, FR-026; research.md R-05, R-09, R-10; reviews/phase-2/spike.md). The pages of
// test/fixtures/ are served under the strict CSP by serve.ts, which links a plant stylesheet after base.css on
// request (`after=plants/<name>`). Every scenario runs in both themes, under emulateMedia({ colorScheme }) light and
// dark (FR-022). Each guard (a "does not") shares its test with the positive assertion it guards and runs once more
// with its plant, where its helper must report the problem (SC-002, R-10). Expected values are transcribed by hand
// from 002's Appendix A (spec, data-model § Rule table): the theme conditions come from the tokens' hand-written
// expected.ts, never from the token source.
type Theme = "light" | "dark";
const themes: readonly Theme[] = ["light", "dark"];

/** Appendix A values the base layer applies, as Chromium reports computed colours. */
const palette: Readonly<Record<Theme, { readonly ink: string; readonly canvas: string; readonly focus: string }>> = {
  light: { ink: "rgb(21, 19, 15)", canvas: "rgb(241, 238, 232)", focus: "rgb(143, 94, 15)" },
  dark: { ink: "rgb(237, 233, 225)", canvas: "rgb(21, 19, 15)", focus: "rgb(224, 162, 58)" },
};
/** `--ocelle-font-size-md` (1rem) and `--ocelle-line-height-normal` (1.45) at the default 16px root. */
const regular = { fontSize: "16px", lineHeight: "23.2px" };
/** `--ocelle-focus-width` and `--ocelle-focus-offset`. */
const ring = { width: "3px", offset: "2px" };
const sans = '"Schibsted Grotesk"';

let browser: Browser | undefined;
let served: Served | undefined;

beforeAll(async () => {
  served = await serve();
  browser = await launch();
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await served?.close();
});

interface Options {
  readonly colorScheme: Theme | "no-preference";
  readonly dataTheme?: string;
  readonly width?: number;
  readonly forced?: boolean;
}

/** Opens a fixture page (path with its query) in a new context, with the violation collector installed. */
async function open(path: string, options: Options): Promise<Page> {
  if (browser === undefined || served === undefined) throw new Error("the suite did not start");
  const context = await browser.newContext({ viewport: { width: options.width ?? 1280, height: 800 } });
  const page = await context.newPage();
  await collectViolations(page);
  await page.emulateMedia({ colorScheme: options.colorScheme, forcedColors: options.forced === true ? "active" : "none" });
  await page.goto(`${served.origin}/${path}`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const dataTheme = options.dataTheme;
  if (dataTheme !== undefined) {
    await page.evaluate((value) => {
      document.documentElement.setAttribute("data-theme", value);
    }, dataTheme);
  }
  return page;
}

async function close(page: Page): Promise<void> {
  await page.context().close();
}

/** Presses Tab until the element with `id` has focus (keyboard focus); throws if it never gets it. */
async function tabTo(page: Page, id: string): Promise<void> {
  for (let presses = 0; presses < 40; presses += 1) {
    await page.keyboard.press("Tab");
    if ((await page.evaluate(() => document.activeElement?.id)) === id) return;
  }
  throw new Error(`Tab never reached #${id}`);
}

function computed(page: Page, id: string, properties: readonly string[], pseudo?: string): Promise<Record<string, string>> {
  return page.evaluate(
    ({ id, properties, pseudo }) => {
      const element = document.getElementById(id);
      if (element === null) throw new Error(`no #${id}`);
      const style = getComputedStyle(element, pseudo);
      return Object.fromEntries(properties.map((property) => [property, style.getPropertyValue(property)]));
    },
    { id, properties, pseudo: pseudo ?? null },
  );
}

interface PageReading {
  readonly colorScheme: string;
  readonly color: string;
  readonly background: string;
  readonly fontStart: boolean;
  readonly fontSize: string;
  readonly lineHeight: string;
  readonly margin: string;
}

/** The root's color-scheme and the body's text, ground, family, scale and margin (US1-1, US1-7). */
function reading(page: Page): Promise<PageReading> {
  return page.evaluate((family) => {
    const body = getComputedStyle(document.body);
    return {
      colorScheme: getComputedStyle(document.documentElement).colorScheme.trim(),
      color: body.color,
      background: body.backgroundColor,
      fontStart: body.fontFamily.startsWith(family),
      fontSize: body.fontSize,
      lineHeight: body.lineHeight,
      margin: body.margin,
    };
  }, sans);
}

function expectedReading(theme: Theme): PageReading {
  return { colorScheme: theme, color: palette[theme].ink, background: palette[theme].canvas, fontStart: true, ...regular, margin: "0px" };
}

describe("US1-1: the six theme conditions of 002 (FR-006, FR-008)", { timeout: 60_000 }, () => {
  it.each(themeConditions)("$id: the root's color-scheme is $theme, and the body is ink on canvas in Schibsted Grotesk at the regular scale", async (condition) => {
    const page = await open("page.html", { colorScheme: condition.colorScheme, dataTheme: condition.dataTheme });
    const result = await reading(page);
    await close(page);
    expect(result).toEqual(expectedReading(condition.theme));
  });
});

const focusable = ["link", "button", "input", "tabstop"] as const;

/** The ring each element shows when focused from the keyboard, in Tab order. */
async function keyboardRings(page: Page): Promise<Record<string, Record<string, string>>> {
  const rings: Record<string, Record<string, string>> = {};
  for (const id of focusable) {
    await tabTo(page, id);
    rings[id] = await computed(page, id, ["outline-style", "outline-width", "outline-color", "outline-offset"]);
  }
  return rings;
}

/**
 * The pointer half of US1-2 (a guard): after a click, the link, the button and the tabindex="0" element show no ring
 * and the text input shows one. A click on the in-page link would navigate to its fragment, which leaves nothing
 * focused, so its default is prevented first (reviews/phase-2/spike.md, Notes for the tests).
 */
async function pointerRingProblems(page: Page): Promise<string[]> {
  await page.evaluate(() => {
    document.getElementById("link")?.addEventListener("click", (event) => {
      event.preventDefault();
    });
  });
  const problems: string[] = [];
  for (const id of focusable) {
    await page.click(`#${id}`);
    const focused = await page.evaluate(() => document.activeElement?.id);
    const style = (await computed(page, id, ["outline-style"]))["outline-style"];
    if (focused !== id) problems.push(`${id}: not focused by the click`);
    else if (id === "input" && style !== "solid") problems.push("input: no ring after a click");
    else if (id !== "input" && style !== "none") problems.push(`${id}: ring after a click`);
  }
  return problems;
}

describe("US1-2: keyboard focus shows the token ring; pointer focus shows it only on the text input (FR-009)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s", async (theme) => {
    const page = await open("page.html", { colorScheme: theme });
    const rings = await keyboardRings(page);
    const pointer = await pointerRingProblems(page);
    await close(page);
    const planted = await open("page.html?after=plants/pointer-ring", { colorScheme: theme });
    const plantedPointer = await pointerRingProblems(planted);
    await close(planted);
    const token = { "outline-style": "solid", "outline-width": ring.width, "outline-color": palette[theme].focus, "outline-offset": ring.offset };
    expect(rings).toEqual({ link: token, button: token, input: token, tabstop: token });
    expect(pointer).toEqual([]);
    expect(plantedPointer).toEqual(["link: ring after a click", "button: ring after a click", "tabstop: ring after a click"]);
  });
});

/** Controls without a visible border (FR-007): a side of zero width or of style none. */
function borderProblems(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    ["button", "input", "region-button"].filter((id) => {
      const element = document.getElementById(id);
      if (element === null) return true;
      const style = getComputedStyle(element);
      return (["top", "right", "bottom", "left"] as const).some((side) => {
        const width = style.getPropertyValue(`border-${side}-width`);
        const kind = style.getPropertyValue(`border-${side}-style`);
        return parseFloat(width) === 0 || kind === "none" || kind === "hidden";
      });
    }),
  );
}

interface RegionRing {
  readonly ring: string;
  readonly highlight: string;
  readonly focus: string;
}

/** The keyboard-focused ring of the button in the forced-color-adjust: none region, and the two probes beside it. */
async function regionRing(page: Page): Promise<RegionRing> {
  await tabTo(page, "region-button");
  return page.evaluate(() => {
    const colour = (id: string): string => {
      const element = document.getElementById(id);
      return element === null ? "" : getComputedStyle(element).color;
    };
    const button = document.getElementById("region-button");
    return { ring: button === null ? "" : getComputedStyle(button).outlineColor, highlight: colour("highlight"), focus: colour("focus") };
  });
}

/** R-05: the region's ring must be the resolved Highlight and not the resolved focus token. */
function regionRingProblems(region: RegionRing): string[] {
  const problems: string[] = [];
  if (region.ring !== region.highlight) problems.push("region-button: ring is not Highlight");
  if (region.ring === region.focus) problems.push("region-button: ring is the token focus colour");
  return problems;
}

describe("US1-4: forced colours keep a solid system-colour ring and control borders (FR-011, FR-007)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s", async (theme) => {
    const page = await open("page.html", { colorScheme: theme, forced: true });
    const outside: Record<string, Record<string, string>> = {};
    for (const id of ["button", "input"]) {
      await tabTo(page, id);
      outside[id] = await computed(page, id, ["outline-style", "outline-width", "outline-color"]);
    }
    const system = await page.evaluate(() => ["highlight", "canvas-text"].map((id) => getComputedStyle(document.getElementById(id) ?? document.body).color));
    const borders = await borderProblems(page);
    const region = await regionRing(page);
    await close(page);
    const withoutBorders = await open("page.html?after=plants/control-borders", { colorScheme: theme, forced: true });
    const plantedBorders = await borderProblems(withoutBorders);
    await close(withoutBorders);
    const withoutHighlight = await open("page.html?after=plants/forced-ring", { colorScheme: theme, forced: true });
    const plantedRegion = regionRingProblems(await regionRing(withoutHighlight));
    await close(withoutHighlight);

    for (const id of ["button", "input"]) {
      expect({ id, style: outside[id]?.["outline-style"], width: outside[id]?.["outline-width"] }).toEqual({ id, style: "solid", width: ring.width });
      expect(system).toContain(outside[id]?.["outline-color"]);
    }
    expect(borders).toEqual([]);
    expect(regionRingProblems(region)).toEqual([]);
    expect(region.ring).toBe(region.highlight);
    expect(plantedBorders).toEqual(["button", "region-button"]);
    expect(plantedRegion).toEqual(["region-button: ring is not Highlight", "region-button: ring is the token focus colour"]);
  });
});

describe("US1-5: no CSP violation under the strict policy (SC-001)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s: page.html (with img-src 'self') reports none with base.css applied and its image loaded; control.html reports exactly its one", async (theme) => {
    if (browser === undefined || served === undefined) throw new Error("the suite did not start");
    const context = await browser.newContext();
    const page = await context.newPage();
    await collectViolations(page);
    await page.emulateMedia({ colorScheme: theme });
    const response = await page.goto(`${served.origin}/page.html`, { waitUntil: "load" });
    await page.waitForTimeout(250);
    const pageResult = {
      header: response?.headers()["content-security-policy"],
      violations: await violations(page),
      loaded: await page.evaluate(() => (document.getElementById("img") as HTMLImageElement | null)?.naturalWidth ?? 0),
      applied: await reading(page),
    };
    const control = await page.goto(`${served.origin}/control.html`, { waitUntil: "load" });
    await page.waitForTimeout(250);
    const controlResult = { header: control?.headers()["content-security-policy"], violations: await violations(page) };
    await context.close();
    expect(pageResult).toEqual({ header: imagePolicy, violations: [], loaded: 200, applied: expectedReading(theme) });
    expect(controlResult).toEqual({ header: policy, violations: [{ directive: "style-src-elem", blocked: "inline" }] });
  });
});

/** Every element, and its ::before and ::after, whose box-sizing is not border-box (FR-007, US1-6). */
function boxSizingProblems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const problems: string[] = [];
    for (const element of document.querySelectorAll("*")) {
      for (const pseudo of [null, "::before", "::after"]) {
        if (getComputedStyle(element, pseudo).boxSizing !== "border-box") problems.push(`${element.localName}${element.id === "" ? "" : `#${element.id}`}${pseudo ?? ""}`);
      }
    }
    return problems;
  });
}

describe("US1-6: base.css without tokens.css keeps the reset and a visible ring (FR-007, FR-009)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s", async (theme) => {
    const page = await open("page.html?tokens=none", { colorScheme: theme });
    const boxes = await boxSizingProblems(page);
    const counted = await page.evaluate(() => document.querySelectorAll("*").length);
    const margin = await page.evaluate(() => getComputedStyle(document.body).margin);
    await tabTo(page, "button");
    const style = (await computed(page, "button", ["outline-style"]))["outline-style"];
    await close(page);
    const planted = await open("page.html?tokens=none&after=plants/shorthand-ring", { colorScheme: theme });
    await tabTo(planted, "button");
    const plantedStyle = (await computed(planted, "button", ["outline-style"]))["outline-style"];
    await close(planted);
    expect(counted).toBeGreaterThan(40);
    expect(boxes).toEqual([]);
    expect(margin).toBe("0px");
    expect(style).toBe("solid");
    expect(plantedStyle).toBe("none");
  });
});

describe("US1-7: base.css linked before tokens.css gives the same computed values (FR-025)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s", async (theme) => {
    const first = await open("page.html", { colorScheme: theme });
    const tokensFirst = await reading(first);
    await close(first);
    const last = await open("page.html?tokens=last", { colorScheme: theme });
    const baseFirst = await reading(last);
    const order = await last.evaluate(() => [...document.querySelectorAll("link")].map((link) => link.getAttribute("href")));
    await close(last);
    expect(order).toEqual(["base.css", "tokens.css", "layout.css"]);
    expect([tokensFirst, baseFirst]).toEqual([expectedReading(theme), expectedReading(theme)]);
  });
});

const codeIds = ["code", "kbd", "samp", "pre", "prose-code", "prose-kbd", "prose-samp", "prose-pre"] as const;

/** Code elements whose family does not begin with Schibsted Grotesk, lacks tabular figures or names a monospace face. */
function codeProblems(page: Page): Promise<string[]> {
  return page.evaluate(
    ({ ids, family, monospace }) => {
      const problems: string[] = [];
      for (const id of ids) {
        const element = document.getElementById(id);
        const style = element === null ? undefined : getComputedStyle(element);
        const families = (style?.fontFamily ?? "").split(",").map((part) => part.trim().replace(/^["']|["']$/g, "").toLowerCase());
        if (!(style?.fontFamily.startsWith(family) ?? false)) problems.push(`${id}: family`);
        if (!(style?.fontVariantNumeric.split(" ").includes("tabular-nums") ?? false)) problems.push(`${id}: figures`);
        if (families.some((each) => each === "monospace" || monospace.includes(each))) problems.push(`${id}: monospace`);
      }
      return problems;
    },
    { ids: codeIds, family: sans, monospace: monospaceFamilies.map((each) => each.toLowerCase()) },
  );
}

describe("US1-9: code, pre, kbd and samp in Schibsted Grotesk with tabular figures, inside and outside prose (FR-026)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s, and a host element rule linked after base.css overrides the figures", async (theme) => {
    const page = await open("page.html", { colorScheme: theme });
    const problems = await codeProblems(page);
    await close(page);
    const host = await open("page.html?after=host-code", { colorScheme: theme });
    const overridden = await computed(host, "code", ["font-variant-numeric", "font-family"]);
    await close(host);
    expect(problems).toEqual([]);
    expect(overridden["font-variant-numeric"]).toBe("normal");
    expect(overridden["font-family"]?.startsWith(sans)).toBe(true);
  });
});

const media = ["img", "picture", "picture-img", "video", "canvas", "svg"] as const;

/** Media wider than their container, or (for those with width and height attributes, 2:1) off their ratio by over 1 px. */
function mediaProblems(page: Page): Promise<string[]> {
  return page.evaluate((ids) => {
    const container = document.getElementById("media")?.getBoundingClientRect().width ?? 0;
    const problems: string[] = [];
    for (const id of ids) {
      const box = document.getElementById(id)?.getBoundingClientRect();
      if (box === undefined) {
        problems.push(`${id}: missing`);
        continue;
      }
      if (box.width > container + 0.5) problems.push(`${id}: wider than its container`);
      if (id !== "picture" && Math.abs(box.height - box.width / 2) > 1) problems.push(`${id}: ratio`);
    }
    return problems;
  }, media);
}

/** Form controls whose computed family or size differs from their parent's. */
function controlFontProblems(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    ["button", "input", "select", "textarea"].filter((id) => {
      const element = document.getElementById(id);
      const parent = element?.parentElement;
      if (element === null || parent === null || parent === undefined) return true;
      const own = getComputedStyle(element);
      const inherited = getComputedStyle(parent);
      return own.fontFamily !== inherited.fontFamily || own.fontSize !== inherited.fontSize;
    }),
  );
}

async function openMedia(path: string, theme: Theme): Promise<Page> {
  const page = await open(path, { colorScheme: theme, width: 320 });
  await page.waitForFunction(() => {
    const image = document.getElementById("img") as HTMLImageElement | null;
    return image?.complete ?? false;
  });
  return page;
}

describe("US1-10: media stay inside their container at their ratio, and form controls inherit the font (FR-007)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s at 320 px", async (theme) => {
    const page = await openMedia("page.html", theme);
    const natural = await page.evaluate(() => (document.getElementById("img") as HTMLImageElement | null)?.naturalWidth ?? 0);
    const problems = await mediaProblems(page);
    const controls = await controlFontProblems(page);
    await close(page);
    const reverted = await openMedia("page.html?after=plants/media-ratio", theme);
    const plantedMedia = await mediaProblems(reverted);
    await close(reverted);
    const square = await openMedia("page.html?after=plants/canvas-ratio", theme);
    const plantedCanvas = await mediaProblems(square);
    await close(square);
    expect(natural).toBeGreaterThan(0);
    expect(problems).toEqual([]);
    expect(controls).toEqual([]);
    expect(plantedMedia).toEqual(["img: ratio", "picture-img: ratio", "video: ratio", "svg: ratio"]);
    expect(plantedCanvas).toEqual(["canvas: ratio"]);
  });
});

interface AxNode {
  readonly nodeId: string;
  readonly role?: { readonly value?: string };
  readonly childIds?: readonly string[];
}

/** The roles of the children of each `list` node in the accessibility tree (CDP Accessibility.getFullAXTree). */
async function lists(page: Page): Promise<string[][]> {
  const session = await page.context().newCDPSession(page);
  const { nodes } = (await session.send("Accessibility.getFullAXTree")) as { nodes: AxNode[] };
  await session.detach();
  const byId = new Map(nodes.map((node) => [node.nodeId, node]));
  return nodes.filter((node) => node.role?.value === "list").map((node) => (node.childIds ?? []).map((child) => byId.get(child)?.role?.value ?? ""));
}

// The list-semantics guard of FR-007 has no plant: no CSS rule drops role `list` in Chromium. The spike measured
// `list-style: none`, `display: contents`, `display: grid`, `display: flex` and `display: block` on the list, and
// `list-style: none` with `display: block` on its items, and each kept the list node and both items
// (reviews/phase-2/spike.md, R-10 § List semantics). So it shares its test with the box-sizing positive.
describe("FR-007: the reset keeps list semantics (guard) while every list box is border-box", { timeout: 60_000 }, () => {
  it.each(themes)("in %s", async (theme) => {
    const page = await open("page.html", { colorScheme: theme });
    const found = await lists(page);
    const sizing = await page.evaluate(() => [document.getElementById("list"), ...document.querySelectorAll("#list li")].map((element) => (element === null ? "" : getComputedStyle(element).boxSizing)));
    await close(page);
    expect(found).toEqual([["listitem", "listitem"]]);
    expect(sizing).toEqual(["border-box", "border-box", "border-box"]);
  });
});
