import { readFileSync } from "node:fs";
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
// test serves the whole build with the header and opens the Storybook page, the preview (iframe.html): the spike
// found that the manager UI cannot run under this CSP (its Emotion and React <style> elements), so the page is the
// preview alone and the header has no frame-src (R-10). The collector (addInitScript, which the page's CSP does not
// govern) must report the control page's one violation; then each group story, in light and dark (the theme global
// sets data-theme on the preview's <html>), reports zero violations and zero requests outside the origin, and lists
// exactly its group's tokens with their value in that theme (Appendix A, expected.ts). The monospace check walks
// every element of the page, open shadow roots included, for a computed font-family naming a family of the prefix
// gate's list; its control element (styled through the CSSOM, which CSP does not govern) must be reported exactly
// once, and after it is removed nothing may be.
const policy = "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'";
const controlPage = "<!doctype html>\n<html lang=\"en\">\n<head>\n<title>control</title>\n<style>body { margin: 0; }</style>\n</head>\n<body></body>\n</html>\n";
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

beforeAll(async () => {
  server = createServer((request, response) => {
    const path = normalize(new URL(request.url ?? "/", "http://localhost").pathname).replace(/^[/\\]+/, "");
    let body: Buffer | string;
    try {
      if (path.startsWith("..")) throw new Error("outside the served directory");
      body = path === "control.html" ? controlPage : readFileSync(join(built.out, path === "" ? "iframe.html" : path));
    } catch {
      response.writeHead(404, { "Content-Security-Policy": policy }).end();
      return;
    }
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

async function open(path: string, ready: string | undefined): Promise<Visit> {
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
  const response = await page.goto(`${origin}/${path}`, { waitUntil: "load" });
  // Waits for the story to render, but not past 10 s: a story that never renders is reported by the assertions on
  // the violations and the rows, not by a timeout.
  if (ready !== undefined) await page.waitForSelector(ready, { state: "attached", timeout: 10_000 }).catch(() => undefined);
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
});

describe("the Storybook page under its CSP", { timeout: 60_000 }, () => {
  it("serves the header, and the collector reports exactly the control page's one violation", async () => {
    const control = await open("control.html", undefined);
    expect(control.header).toBe(policy);
    expect(await violations(control.page)).toEqual([{ directive: "style-src-elem", blocked: "inline" }]);
    await control.page.close();
  });

  for (const [id, group] of groups) {
    for (const theme of ["light", "dark"] as const) {
      it(`tokens--${id} in ${theme}: the header, no violation, no request outside the origin, exactly its tokens, no monospace`, async () => {
        const { page, header, outside } = await open(`iframe.html?id=tokens--${id}&viewMode=story&globals=theme:${theme}`, "#storybook-root dt");
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
});
