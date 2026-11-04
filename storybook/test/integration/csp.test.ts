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
async function open(query: string): Promise<Visit> {
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
  await page.waitForSelector("#storybook-root dt", { state: "attached", timeout: 10_000 }).catch(() => undefined);
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

  it("opened the preview and nothing else: every HTML document served was iframe.html, one per page", () => {
    expect(documents).toEqual(Array.from({ length: 1 + groups.length * 2 }, () => "iframe.html"));
  });
});
