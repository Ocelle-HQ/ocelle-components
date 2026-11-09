import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";
import type { Browser, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { monospaceFamilies } from "../../../gates/bin/prefix.ts";
import { expectedTokens, inTheme } from "../../../packages/tokens/test/expected.ts";
import type { Group } from "../../../packages/tokens/test/expected.ts";

// The built Storybook under the Storybook page's CSP (FR-023, US1 scenarios 11 and 13; research.md R-10, R-03;
// reviews/phase-3/spike.md; T036). The global setup (setup.ts) built it into a temporary directory under the
// no-network preload: the build made no network access, and the preload's control recorded its one connection. The
// build runs the package's own build command (setup.ts reads it from package.json), so it ships the preview only:
// the spike found that the manager UI cannot run under this CSP (its Emotion and React <style> elements), and the
// operator decided (R1-01, 2026-11-04) that the preview is the Storybook page and the build ships no manager UI (no
// index.html, sb-manager/ or sb-addons/; its control: the preview's iframe.html is there). The test serves the whole
// build with the header, which has no frame-src (R-10), and opens the preview (iframe.html) and nothing else: the
// server records every HTML document it serves, and the last test asserts that each was iframe.html. The collector
// (addInitScript, which the page's CSP does not govern) must report nothing on a story, then exactly the one
// violation of a <style> element the control adds to it; then each group story, in light and dark (the theme global
// sets data-theme on the preview's <html>), reports zero violations and zero requests outside the origin, and lists
// exactly its group's tokens with their value in that theme (Appendix A, expected.ts). The monospace check walks
// every element of the page, open shadow roots included, for a computed font-family naming a family of the prefix
// gate's list; its control element (styled through the CSSOM, which CSP does not govern) must be reported exactly
// once, and after it is removed nothing may be.
const policy = "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'";
const types: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

const groups: readonly (readonly [string, Group])[] = [
  ["colour", "colour"],
  ["type", "type"],
  ["space", "space"],
  ["shape", "shape"],
  ["size", "size"],
  ["shell", "shell"],
  ["elevation", "elevation"],
  ["motion", "motion"],
];

const built = inject("storybook");
let server: Server | undefined;
let origin = "";
let browser: Browser | undefined;
/** The path of every HTML document the server served, in order. */
const documents: string[] = [];

beforeAll(async () => {
  server = createServer((request, response) => {
    const path = normalize(new URL(request.url ?? "/", "http://localhost").pathname).replace(/^[/\\]+/, "");
    let body: Buffer | string;
    try {
      if (path.startsWith("..")) throw new Error("outside the served directory");
      body = readFileSync(join(built.out, path));
    } catch {
      response.writeHead(404, { "Content-Security-Policy": policy }).end();
      return;
    }
    if (extname(path) === ".html") documents.push(path);
    response.writeHead(200, { "Content-Type": types[extname(path)] ?? "application/octet-stream", "Content-Security-Policy": policy }).end(body);
  });
  await new Promise<void>((resolve) => server?.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`;
  const executablePath = process.env.OCELLE_CHROMIUM_PATH;
  browser = await chromium.launch(executablePath === undefined || executablePath === "" ? {} : { executablePath });
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await new Promise<void>((resolve) => {
    if (server === undefined) resolve();
    else server.close(() => {
      resolve();
    });
  });
});

interface Visit {
  readonly page: Page;
  readonly header: string | undefined;
  readonly outside: readonly string[];
}

/** Opens the preview, iframe.html, with a query string: the only page the test opens. */
async function open(query: string, rendered = "#storybook-root dt"): Promise<Visit> {
  if (browser === undefined) throw new Error("the suite did not start");
  const page = await browser.newPage();
  await page.addInitScript(() => {
    const list: { directive: string; blocked: string }[] = [];
    Object.defineProperty(window, "__ocelleViolations", { value: list });
    document.addEventListener("securitypolicyviolation", (event) => {
      list.push({ directive: event.violatedDirective, blocked: event.blockedURI });
    });
  });
  const outside: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith(`${origin}/`)) outside.push(request.url());
  });
  const response = await page.goto(`${origin}/iframe.html?${query}`, { waitUntil: "load" });
  // Waits for the story to render, but not past 10 s: a story that never renders is reported by the assertions on
  // the violations and the rows, not by a timeout.
  await page.waitForSelector(rendered, { state: "attached", timeout: 10_000 }).catch(() => undefined);
  await page.waitForTimeout(250);
  return { page, header: response?.headers()["content-security-policy"], outside };
}

function violations(page: Page): Promise<{ directive: string; blocked: string }[]> {
  return page.evaluate(() => [...((window as unknown as { __ocelleViolations?: { directive: string; blocked: string }[] }).__ocelleViolations ?? [])]);
}

/** Every element of the page, open shadow roots included, whose computed font-family names a monospace family. */
function monospace(page: Page): Promise<string[]> {
  return page.evaluate((families) => {
    const wanted = families.map((family) => family.toLowerCase());
    const found: string[] = [];
    const walk = (root: Document | ShadowRoot): void => {
      for (const element of root.querySelectorAll("*")) {
        const list = getComputedStyle(element).fontFamily.split(",").map((part) => part.trim().replace(/^["']|["']$/g, "").toLowerCase());
        if (list.some((family) => wanted.includes(family))) found.push(`${element.localName}${element.id === "" ? "" : `#${element.id}`}`);
        if (element.shadowRoot !== null) walk(element.shadowRoot);
      }
    };
    walk(document);
    return found;
  }, [...monospaceFamilies]);
}

async function rows(page: Page): Promise<string[][]> {
  return page.evaluate(() =>
    [...document.querySelectorAll("#storybook-root dt")].map((term) => [term.textContent.trim(), term.nextElementSibling?.textContent.trim() ?? ""]),
  );
}

describe("the Storybook build", () => {
  it("makes no network access, and the preload records its control's one connection", () => {
    expect(built.control).toEqual([{ kind: "connect", host: "192.0.2.1", port: 443 }]);
    expect(built.build).toEqual([]);
  });

  it("ships the preview only: iframe.html, and no manager entry index.html, no sb-manager/, no sb-addons/", () => {
    expect(existsSync(join(built.out, "iframe.html"))).toBe(true);
    expect(["index.html", "sb-manager", "sb-addons"].filter((entry) => existsSync(join(built.out, entry)))).toEqual([]);
  });
});

describe("the Storybook page under its CSP", { timeout: 60_000 }, () => {
  it("serves the header, and the collector reports exactly the one violation of a <style> element added to a story", async () => {
    const control = await open("id=tokens--colour&viewMode=story&globals=theme:light");
    expect(control.header).toBe(policy);
    expect(await violations(control.page)).toEqual([]);
    await control.page.evaluate(() => {
      const style = document.createElement("style");
      style.textContent = "body { margin: 0; }";
      document.head.append(style);
    });
    await control.page.waitForTimeout(250);
    expect(await violations(control.page)).toEqual([{ directive: "style-src-elem", blocked: "inline" }]);
    await control.page.close();
  });

  for (const [id, group] of groups) {
    for (const theme of ["light", "dark"] as const) {
      it(`tokens--${id} in ${theme}: the header, no violation, no request outside the origin, exactly its tokens, no monospace`, async () => {
        const { page, header, outside } = await open(`id=tokens--${id}&viewMode=story&globals=theme:${theme}`);
        expect(header).toBe(policy);
        expect(await violations(page)).toEqual([]);
        expect(outside).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
        expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--ocelle-color-canvas").trim())).toBe(theme === "light" ? "#F1EEE8" : "#15130F");
        const expected = expectedTokens.filter((token) => token.group === group).map((token) => [`--ocelle-${token.name}`, inTheme(token.resolved, theme)]);
        expect(await rows(page)).toEqual(expected);

        await page.evaluate(() => {
          const control = document.createElement("span");
          control.id = "ocelle-monospace-control";
          control.style.fontFamily = "Menlo, monospace";
          document.body.append(control);
        });
        expect(await monospace(page)).toEqual(["span#ocelle-monospace-control"]);
        await page.evaluate(() => {
          document.getElementById("ocelle-monospace-control")?.remove();
        });
        expect(await monospace(page)).toEqual([]);
        expect(await violations(page)).toEqual([]);
        await page.close();
      });
    }
  }

  // The base-style stories (003 FR-023, research.md R-12, plan decision 16): preview-head.html links base.css after
  // tokens.css and preview.css is narrowed to the preview's error display (PLAN-FRESH-1-012), so the story's code is
  // styled by base.css alone: Schibsted Grotesk with tabular figures, and no element of the page is monospace. The
  // root's color-scheme follows the theme global, which only base.css applies.
  for (const theme of ["light", "dark"] as const) {
    it(`base-styles--base-page in ${theme}: the header, no violation, no request outside the origin, base.css applied, no monospace`, async () => {
      const { page, header, outside } = await open(`id=base-styles--base-page&viewMode=story&globals=theme:${theme}`, '#storybook-root [data-story="base"]');
      expect(header).toBe(policy);
      expect(await violations(page)).toEqual([]);
      expect(outside).toEqual([]);
      expect(await page.evaluate(() => document.querySelectorAll('#storybook-root [data-story="base"] code').length)).toBe(1);
      expect(
        await page.evaluate(() => {
          const code = document.querySelector("#storybook-root code") ?? document.body;
          return {
            scheme: getComputedStyle(document.documentElement).colorScheme,
            family: getComputedStyle(code).fontFamily.split(",")[0],
            figures: getComputedStyle(code).fontVariantNumeric,
          };
        }),
      ).toEqual({ scheme: theme, family: '"Schibsted Grotesk"', figures: "tabular-nums" });

      await page.evaluate(() => {
        const control = document.createElement("span");
        control.id = "ocelle-monospace-control";
        control.style.fontFamily = "Menlo, monospace";
        document.body.append(control);
      });
      expect(await monospace(page)).toEqual(["span#ocelle-monospace-control"]);
      await page.evaluate(() => {
        document.getElementById("ocelle-monospace-control")?.remove();
      });
      expect(await monospace(page)).toEqual([]);
      expect(await violations(page)).toEqual([]);
      await page.close();
    });
  }

  // The Compact screen story (003 FR-023, research.md R-12, phase 3): the compact hook and the value hook in both
  // variants, styled by base.css alone: the region at 14 px / 21 px, the values in Schibsted Grotesk with tabular
  // figures at 14 px in ink-muted, and the ink variant in ink (002 Appendix A).
  const compactInks = { light: { ink: "rgb(21, 19, 15)", muted: "rgb(94, 88, 79)" }, dark: { ink: "rgb(237, 233, 225)", muted: "rgb(163, 157, 146)" } } as const;
  for (const theme of ["light", "dark"] as const) {
    it(`base-styles--compact-screen in ${theme}: the header, no violation, no request outside the origin, the compact and value hooks applied, no monospace`, async () => {
      const { page, header, outside } = await open(`id=base-styles--compact-screen&viewMode=story&globals=theme:${theme}`, '#storybook-root [data-story="compact"]');
      expect(header).toBe(policy);
      expect(await violations(page)).toEqual([]);
      expect(outside).toEqual([]);
      expect(
        await page.evaluate(() => {
          const region = document.querySelector('#storybook-root [data-story="compact"]');
          const read = (element: Element): Record<string, string> => {
            const style = getComputedStyle(element);
            return { family: style.fontFamily.split(",")[0] ?? "", size: style.fontSize, lineHeight: style.lineHeight, figures: style.fontVariantNumeric, color: style.color };
          };
          return {
            region: region === null ? undefined : { size: read(region).size, lineHeight: read(region).lineHeight },
            values: [...document.querySelectorAll('#storybook-root [data-ocelle-value=""]')].map(read),
            ink: [...document.querySelectorAll('#storybook-root [data-ocelle-value="ink"]')].map(read),
          };
        }),
      ).toEqual({
        region: { size: "14px", lineHeight: "21px" },
        values: [0, 1, 2, 3].map(() => ({ family: '"Schibsted Grotesk"', size: "14px", lineHeight: "21px", figures: "tabular-nums", color: compactInks[theme].muted })),
        ink: [{ family: '"Schibsted Grotesk"', size: "14px", lineHeight: "21px", figures: "tabular-nums", color: compactInks[theme].ink }],
      });

      await page.evaluate(() => {
        const control = document.createElement("span");
        control.id = "ocelle-monospace-control";
        control.style.fontFamily = "Menlo, monospace";
        document.body.append(control);
      });
      expect(await monospace(page)).toEqual(["span#ocelle-monospace-control"]);
      await page.evaluate(() => {
        document.getElementById("ocelle-monospace-control")?.remove();
      });
      expect(await monospace(page)).toEqual([]);
      expect(await violations(page)).toEqual([]);
      await page.close();
    });
  }

  // The Prose document story (003 FR-023, research.md R-12, phase 4): the prose hook, styled by base.css alone: the
  // container at 16 px with the prose line height (26.4 px), the h2 at 18 px, the tables as their own scroll boxes, the
  // header cells at 12 px in Schibsted Grotesk with tabular figures, and the link underlined in the link colour.
  const proseLinks = { light: "rgb(132, 86, 13)", dark: "rgb(224, 162, 58)" } as const;
  for (const theme of ["light", "dark"] as const) {
    it(`base-styles--prose-document in ${theme}: the header, no violation, no request outside the origin, the prose hook applied, no monospace`, async () => {
      const { page, header, outside } = await open(`id=base-styles--prose-document&viewMode=story&globals=theme:${theme}`, '#storybook-root [data-story="prose"]');
      expect(header).toBe(policy);
      expect(await violations(page)).toEqual([]);
      expect(outside).toEqual([]);
      expect(
        await page.evaluate(() => {
          const one = (selector: string): CSSStyleDeclaration => getComputedStyle(document.querySelector(`#storybook-root [data-story="prose"] ${selector}`) ?? document.body);
          const container = getComputedStyle(document.querySelector('#storybook-root [data-story="prose"]') ?? document.body);
          return {
            container: [container.fontSize, container.lineHeight],
            h2: one("h2").fontSize,
            tables: [...document.querySelectorAll('#storybook-root [data-story="prose"] table')].map((table) => getComputedStyle(table).display),
            th: [one("th").fontSize, one("th").fontFamily.split(",")[0] ?? "", one("th").fontVariantNumeric],
            link: [one("a").color, one("a").textDecorationLine],
          };
        }),
      ).toEqual({
        container: ["16px", "26.4px"],
        h2: "18px",
        tables: ["block", "block"],
        th: ["12px", '"Schibsted Grotesk"', "tabular-nums"],
        link: [proseLinks[theme], "underline"],
      });

      await page.evaluate(() => {
        const control = document.createElement("span");
        control.id = "ocelle-monospace-control";
        control.style.fontFamily = "Menlo, monospace";
        document.body.append(control);
      });
      expect(await monospace(page)).toEqual(["span#ocelle-monospace-control"]);
      await page.evaluate(() => {
        document.getElementById("ocelle-monospace-control")?.remove();
      });
      expect(await monospace(page)).toEqual([]);
      expect(await violations(page)).toEqual([]);
      await page.close();
    });
  }

  // The Identifier wrap story (003 FR-023, research.md R-12, phase 5): the identifier-wrap hook, styled by base.css
  // alone: in the story's 300 px two-column grid (stories-layout.css) the hooked identifier wraps anywhere over more
  // than one line and its column is as wide as the short text's (within 1 px); in the paragraph, combined with the
  // value hook, it is Schibsted Grotesk with tabular figures.
  for (const theme of ["light", "dark"] as const) {
    it(`base-styles--identifier-wrap in ${theme}: the header, no violation, no request outside the origin, the identifier-wrap hook applied, no monospace`, async () => {
      const { page, header, outside } = await open(`id=base-styles--identifier-wrap&viewMode=story&globals=theme:${theme}`, '#storybook-root [data-story="wrap"]');
      expect(header).toBe(policy);
      expect(await violations(page)).toEqual([]);
      expect(outside).toEqual([]);
      const found = await page.evaluate(() => {
        const cells = [...document.querySelectorAll('#storybook-root [data-story="wrap-grid"] > *')];
        const span = document.querySelector('#storybook-root [data-story="wrap"] span[data-ocelle-wrap]') ?? document.body;
        const lines = (element: Element): number => {
          const range = document.createRange();
          range.selectNodeContents(element);
          return new Set([...range.getClientRects()].filter((rect) => rect.width > 0).map((rect) => Math.round(rect.top))).size;
        };
        const widths = cells.map((cell) => cell.getBoundingClientRect().width);
        return {
          cells: cells.length,
          wrap: cells.map((cell) => getComputedStyle(cell).overflowWrap),
          equal: Math.abs((widths[0] ?? 0) - (widths[1] ?? 0)) <= 1,
          wrapped: lines(cells[0] ?? document.body) > 1,
          span: [getComputedStyle(span).overflowWrap, getComputedStyle(span).fontFamily.split(",")[0] ?? "", getComputedStyle(span).fontVariantNumeric],
        };
      });
      expect(found).toEqual({ cells: 2, wrap: ["anywhere", "normal"], equal: true, wrapped: true, span: ["anywhere", '"Schibsted Grotesk"', "tabular-nums"] });

      await page.evaluate(() => {
        const control = document.createElement("span");
        control.id = "ocelle-monospace-control";
        control.style.fontFamily = "Menlo, monospace";
        document.body.append(control);
      });
      expect(await monospace(page)).toEqual(["span#ocelle-monospace-control"]);
      await page.evaluate(() => {
        document.getElementById("ocelle-monospace-control")?.remove();
      });
      expect(await monospace(page)).toEqual([]);
      expect(await violations(page)).toEqual([]);
      await page.close();
    });
  }

  it("opened the preview and nothing else: every HTML document served was iframe.html, one per page", () => {
    expect(documents).toEqual(Array.from({ length: 1 + groups.length * 2 + 2 + 2 + 2 + 2 }, () => "iframe.html"));
  });
});
