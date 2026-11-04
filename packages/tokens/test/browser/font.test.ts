import type { Browser, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { expectedTokens } from "../expected.ts";
import { collectViolations, fontWeights, launch, serve, violations } from "./serve.ts";
import type { Served, Violation } from "./serve.ts";

// The brand font in Chromium (US2 scenarios 3, 4 and 6; FR-012, FR-013, FR-015; research.md R-03 *Font observables*,
// R-06). getComputedStyle().fontFamily returns the declared list whether or not the face loaded, so the suite observes
// the face actually used: CDP CSS.getPlatformFontsForNode on the text at each weight. Three servers of the current
// generator output and the package's fonts/:
// - the constitution IV CSP plus `font-src 'self'`: the font is used at 400, 500, 600 and 800, requested once from
//   the page's origin, nothing goes elsewhere, and after the collector's control the page reports no violation;
// - the same with the font file removed: the positive control, the text renders in the fallback families;
// - exactly the constitution IV CSP (no `font-src`): the only violation is the font file, the text renders in a
//   fallback family of `--ocelle-font-sans`, and every token still has its value.
const strict = "default-src 'none'; script-src 'self'; style-src 'self'";
const withFont = `${strict}; font-src 'self'`;
const fontPath = "/fonts/SchibstedGrotesk-wght.woff2";

let browser: Browser | undefined;
let allowed: Served | undefined;
let removed: Served | undefined;
let blocked: Served | undefined;

beforeAll(async () => {
  allowed = await serve({ csp: withFont });
  removed = await serve({ csp: withFont, fonts: false });
  blocked = await serve({ csp: strict });
  browser = await launch();
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await allowed?.close();
  await removed?.close();
  await blocked?.close();
});

/** One platform font CDP reports for a node. */
interface PlatformFont {
  readonly familyName: string;
  readonly isCustomFont: boolean;
}

/** What one visit of a page observed. */
interface Visit {
  readonly header: string | undefined;
  readonly requests: readonly string[];
  readonly violations: readonly Violation[];
  /** The platform fonts of each element by id, as CSS.getPlatformFontsForNode reports them. */
  readonly fonts: Readonly<Record<string, readonly PlatformFont[]>>;
  /** The status of each face of the family "Schibsted Grotesk" in document.fonts. */
  readonly faces: readonly string[];
  /** The advance width of each digit span, by the id of its line. */
  readonly digits: Readonly<Record<string, readonly number[]>>;
  readonly figures: string;
  /** Every token of the table as the root's computed custom property, trimmed. */
  readonly tokens: Readonly<Record<string, string>>;
}

const ids = [...fontWeights.map((weight) => `w${String(weight)}`), "fallback", "figures"];

async function platformFonts(page: Page): Promise<Record<string, PlatformFont[]>> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument");
  const found: Record<string, PlatformFont[]> = {};
  for (const id of ids) {
    const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector: `#${id}` });
    // Node id 0: the page has no such element (the control page); it gets no entry.
    if (nodeId === 0) continue;
    const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
    found[id] = fonts.map((font) => ({ familyName: font.familyName, isCustomFont: font.isCustomFont }));
  }
  await cdp.detach();
  return found;
}

async function visit(served: Served | undefined, path: string): Promise<Visit> {
  if (browser === undefined || served === undefined) throw new Error("the suite did not start");
  const page = await browser.newPage();
  await collectViolations(page);
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const response = await page.goto(`${served.origin}/${path}`, { waitUntil: "load" });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(250);
  const observed = await page.evaluate((names) => {
    const root = getComputedStyle(document.documentElement);
    const widths = (id: string): number[] => [...document.querySelectorAll(`#${id} span`)].map((span) => span.getBoundingClientRect().width);
    const figures = document.querySelector("#figures");
    return {
      faces: [...document.fonts].filter((face) => face.family.replace(/"/g, "") === "Schibsted Grotesk").map((face) => face.status),
      digits: { figures: widths("figures"), proportional: widths("proportional") },
      figures: figures === null ? "" : getComputedStyle(figures).fontVariantNumeric,
      tokens: Object.fromEntries(names.map((name) => [name, root.getPropertyValue(`--ocelle-${name}`).trim()])),
    };
  }, expectedTokens.map((token) => token.name));
  const result: Visit = {
    header: response?.headers()["content-security-policy"],
    requests,
    violations: await violations(page),
    fonts: await platformFonts(page),
    ...observed,
  };
  await page.close();
  return result;
}

const families = (fonts: readonly PlatformFont[] | undefined): string[] => (fonts ?? []).map((font) => font.familyName);

describe("the brand font under the constitution IV CSP plus font-src 'self' (US2 scenarios 3 and 4)", { timeout: 60_000 }, () => {
  it("renders the text at weights 400, 500, 600 and 800 in Schibsted Grotesk, loaded, and in a fallback with the font file removed (positive control)", async () => {
    const control = await visit(removed, "font.html");
    expect(families(control.fonts.w400)).not.toContain("Schibsted Grotesk");
    expect(families(control.fonts.w400)).toEqual(families(control.fonts.fallback));
    expect(families(control.fonts.w400).length).toBeGreaterThan(0);
    const page = await visit(allowed, "font.html");
    expect(Object.fromEntries(fontWeights.map((weight) => [weight, page.fonts[`w${String(weight)}`]]))).toEqual(
      Object.fromEntries(fontWeights.map((weight) => [weight, [{ familyName: "Schibsted Grotesk", isCustomFont: true }]])),
    );
    expect(page.faces).toEqual(["loaded"]);
  });

  it("requests the font file once from the page's origin, and nothing from any other origin (FR-015)", async () => {
    if (allowed === undefined) throw new Error("the suite did not start");
    const page = await visit(allowed, "font.html");
    expect(page.requests.filter((url) => url.includes("/fonts/"))).toEqual([`${allowed.origin}${fontPath}`]);
    expect(page.requests.filter((url) => !url.startsWith(`${allowed?.origin ?? ""}/`))).toEqual([]);
    expect(page.requests.length).toBeGreaterThanOrEqual(4);
  });

  it("reports no CSP violation while the font loads, after the collector reports the control page's one violation", async () => {
    const control = await visit(allowed, "control.html");
    expect(control.header).toBe(withFont);
    expect(control.violations).toEqual([{ directive: "style-src-elem", blocked: "inline" }]);
    const page = await visit(allowed, "font.html");
    expect(page.header).toBe(withFont);
    expect(page.violations).toEqual([]);
    expect(families(page.fonts.w400)).toEqual(["Schibsted Grotesk"]);
  });

  it("gives the digits 0 to 9 equal advance widths with --ocelle-figures, in Schibsted Grotesk, and unequal ones without it (R-03)", async () => {
    const page = await visit(allowed, "font.html");
    expect(families(page.fonts.figures)).toEqual(["Schibsted Grotesk"]);
    expect(page.figures).toBe("tabular-nums");
    expect(page.digits.figures).toHaveLength(10);
    expect(new Set(page.digits.figures).size).toBe(1);
    expect(page.digits.proportional).toHaveLength(10);
    expect(new Set(page.digits.proportional).size).toBeGreaterThan(1);
  });
});

describe("the brand font under exactly the constitution IV CSP, no font-src (US2 scenario 6)", { timeout: 60_000 }, () => {
  it("reports the font file as the only violation, renders in a fallback family of --ocelle-font-sans, and keeps every token's value", async () => {
    if (blocked === undefined) throw new Error("the suite did not start");
    const page = await visit(blocked, "font.html");
    const reference = await visit(allowed, "font.html");
    expect(page.header).toBe(strict);
    expect(page.violations).toEqual([{ directive: "font-src", blocked: `${blocked.origin}${fontPath}` }]);
    expect(families(page.fonts.w400)).not.toContain("Schibsted Grotesk");
    expect(families(page.fonts.w400)).toEqual(families(page.fonts.fallback));
    expect(Object.values(page.tokens).filter((value) => value === "")).toEqual([]);
    expect(page.tokens).toEqual(reference.tokens);
    expect(page.tokens["color-canvas"]).toBe("#F1EEE8");
  });
});
