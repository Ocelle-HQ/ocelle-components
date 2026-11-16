import { cpSync, existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import type { Browser, Page } from "playwright";
import { build } from "vite";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { css } from "../../../tokens/src/generate.ts";
import { source } from "../../../tokens/src/source.ts";
import { collectViolations, violations } from "../../../tokens/test/browser/serve.ts";

// User Story 5 scenario 12 on a `file:` document (014 spec FR-057; research.md R-09, PLAN-CORRECTNESS-1-013; T094;
// reviews/phase-6/spike.md (1)), in the `elements-browser-file` project, which provides the Chromium argument
// `--allow-file-access-from-files` (vitest.config.ts). A `file:` document stands in for a webview whose document
// protocol is neither `http:` nor `https:` (Kitty Desktop's custom scheme). The suite writes into a temporary directory
// a copy of the link fixture whose policy is a `<meta http-equiv="Content-Security-Policy">` (the fixture's policy:
// `default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'`), the link target page beside it with the
// same policy, `tokens.css` from the token generator with the vendored fonts, and the browser build, built here with
// the package's own vite.browser.config.ts into that directory (never into dist/). It launches Chromium itself with the
// provided arguments and opens the page from its `file:` URL. `<ocelle-link href="link-target.html">`, activated by
// Enter and by a plain click, emits its event, and the page then navigates to the `file:` target, because the resolved
// protocol `file:` equals the document's own (FR-047): the URL is the target's, the marker is gone, the target page's
// text is present, with no CSP violation, no console message and no failed load. The events are recorded through a
// function Playwright exposes on every document of the context, so the record survives the navigation.
const elements = fileURLToPath(new URL("../..", import.meta.url));
const fixtures = fileURLToPath(new URL("./fixtures", import.meta.url));
const fonts = fileURLToPath(new URL("../../../tokens/fonts", import.meta.url));
const args = inject("chromiumArgs");
let dir = "";
let browser: Browser | undefined;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), "ocelle-elements-file-"));
  cpSync(fixtures, dir, { recursive: true });
  writeFileSync(join(dir, "tokens.css"), css(source));
  if (existsSync(fonts)) cpSync(fonts, join(dir, "fonts"), { recursive: true });
  await build({ configFile: join(elements, "vite.browser.config.ts"), root: elements, logLevel: "error", build: { outDir: join(dir, "dist") } });
  cpSync(join(dir, "dist", "browser", "ocelle-elements.js"), join(dir, "ocelle-elements.js"));
  const executablePath = process.env.OCELLE_CHROMIUM_PATH;
  browser = await chromium.launch(executablePath === undefined || executablePath === "" ? { args } : { executablePath, args });
}, 180_000);

afterAll(async () => {
  await browser?.close();
  if (dir !== "") rmSync(dir, { recursive: true, force: true });
});

/** Where the page is: its protocol and file name, whether the marker is set, the target page's text, whether the link is defined. */
function where(page: Page): Promise<unknown> {
  return page.evaluate(() => ({
    protocol: location.protocol,
    page: location.pathname.split("/").pop() ?? "",
    marker: (window as unknown as { __marker?: boolean }).__marker === true,
    target: document.getElementById("target")?.textContent ?? null,
    defined: customElements.get("ocelle-link") !== undefined,
  }));
}

/** Opens the `file:` link page in a fresh context with the recorders, sets the marker and returns the page and its records. */
async function open(): Promise<{ readonly page: Page; readonly events: unknown[]; readonly log: string[] }> {
  if (browser === undefined) throw new Error("the suite did not start");
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const events: unknown[] = [];
  const log: string[] = [];
  await context.exposeFunction("__recordLinkEvent", (json: string) => events.push(JSON.parse(json) as unknown));
  await context.addInitScript(() => {
    document.addEventListener("ocelle-link-activate", (event) => {
      const custom = event as CustomEvent<unknown>;
      void (window as unknown as { __recordLinkEvent: (json: string) => Promise<void> }).__recordLinkEvent(
        JSON.stringify({ detail: custom.detail, cancelable: custom.cancelable, marker: (window as unknown as { __marker?: boolean }).__marker === true, protocol: location.protocol }),
      );
    });
  });
  const page = await context.newPage();
  await collectViolations(page);
  page.on("console", (message) => log.push(`console.${message.type()}: ${message.text()}`));
  page.on("pageerror", (error) => log.push(`error: ${error.message}`));
  page.on("requestfailed", (request) => log.push(`failed: ${new URL(request.url()).pathname.split("/").pop() ?? ""}`));
  await page.goto(pathToFileURL(join(dir, "link.html")).href, { waitUntil: "load" });
  // Waits for the element, but not past 5 s: a link that is never defined is reported by the assertions.
  await page.evaluate(async () => {
    await Promise.race([customElements.whenDefined("ocelle-link"), new Promise((done) => setTimeout(done, 5000))]);
    (window as unknown as { __marker: boolean }).__marker = true;
  });
  return { page, events, log };
}

/** Waits for the end of the activation's task and for a navigation it started to load. */
async function settle(page: Page): Promise<void> {
  await page.waitForTimeout(300);
  await page.waitForLoadState("load");
}

describe("ocelle-link on a file: copy of the fixture (US5-12, R-09)", { timeout: 60_000 }, () => {
  it("US5-12: Enter on <ocelle-link href=link-target.html> emits { href: link-target.html } and the file: page navigates to its file: target, with no violation or console message", async () => {
    const { page, events, log } = await open();
    const before = await where(page);
    await page.focus("#before");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await settle(page);
    expect({ before, after: await where(page), events, violations: await violations(page), log }).toEqual({
      before: { protocol: "file:", page: "link.html", marker: true, target: null, defined: true },
      after: { protocol: "file:", page: "link-target.html", marker: false, target: "The link target page", defined: false },
      events: [{ detail: { href: "link-target.html" }, cancelable: true, marker: true, protocol: "file:" }],
      violations: [],
      log: [],
    });
    await page.context().close();
  });

  it("US5-12: a plain click on the same link emits its event and the file: page navigates to its file: target", async () => {
    const { page, events, log } = await open();
    await page.click("#link");
    await settle(page);
    expect({ after: await where(page), events, violations: await violations(page), log }).toEqual({
      after: { protocol: "file:", page: "link-target.html", marker: false, target: "The link target page", defined: false },
      events: [{ detail: { href: "link-target.html" }, cancelable: true, marker: true, protocol: "file:" }],
      violations: [],
      log: [],
    });
    await page.context().close();
  });
});
