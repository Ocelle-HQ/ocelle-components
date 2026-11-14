// The strict-CSP fixture of the element suites (005 spec § The strict-CSP fixture; research.md R-11, T015). Each suite
// writes into a temporary directory what a host serves: the fixture pages of fixtures/, `tokens.css` from the token
// generator (the current source, never a pre-built dist/) with the vendored fonts it loads by relative URL, `base.css`
// copied from packages/styles/src (linked only by the pages that say so), and the files the global setup built
// (global-setup.ts): the browser build `ocelle-elements.js`, US1 scenario 10's `bundle-a.js` and `bundle-b.js` and User
// Story 3's test host's file `ocelle-test-host.js`. It serves them on 127.0.0.1 with `Content-Security-Policy:
// default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'` on every response. Every page is opened
// in a fresh context with the recorders installed before navigation, none of them a page script or a request: CSP
// violations through 002's `addInitScript` collector
// (packages/tokens/test/browser/serve.ts), requests and their responses through Playwright's `request` and
// `response` events, and console messages and uncaught errors through its `console` and `pageerror` events.
//
// 008 (research.md R-14, R-15): the served directory also holds the test delay stylesheet `tooltip-delay.css`
// (test/fixtures/), which the overlay and tooltip pages link; every context is a mouse device at 1280 × 800, and
// `visit(…, { touch: true })` opens its page in a context with `hasTouch` instead, for the touch rows only.
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import type { Browser, Page } from "playwright";
import { css } from "../../../tokens/src/generate.ts";
import { source } from "../../../tokens/src/source.ts";
import { collectViolations, violations } from "../../../tokens/test/browser/serve.ts";
import type { Violation } from "../../../tokens/test/browser/serve.ts";
import type { Built } from "./global-setup.ts";

export { launch } from "../../../tokens/test/browser/serve.ts";

/** The fixture's policy: the library's strict policy plus the tokens' `font-src 'self'` (spec § The strict-CSP fixture). */
export const policy = "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'";

const fixtures = fileURLToPath(new URL("./fixtures", import.meta.url));
const baseSheet = fileURLToPath(new URL("../../../styles/src/base.css", import.meta.url));
const fonts = fileURLToPath(new URL("../../../tokens/fonts", import.meta.url));
const tooltipDelay = fileURLToPath(new URL("../fixtures/tooltip-delay.css", import.meta.url));

/** The built files each page may load, by served name, and where the global setup put them. */
const builtFiles: Readonly<Record<string, string>> = {
  "ocelle-elements.js": "dist/browser/ocelle-elements.js",
  "bundle-a.js": "bundles/bundle-a.js",
  "bundle-b.js": "bundles/bundle-b.js",
  "ocelle-test-host.js": "test-host/ocelle-test-host.js",
};

const types: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
};

/** A running fixture server. */
export interface Served {
  /** `http://127.0.0.1:<port>`. */
  readonly origin: string;
  readonly close: () => Promise<void>;
}

/** Writes the served directory (see the header comment) and serves it under the fixture's policy. */
export async function serve(built: Built | undefined): Promise<Served> {
  const dir = mkdtempSync(join(tmpdir(), "ocelle-elements-browser-"));
  cpSync(fixtures, dir, { recursive: true });
  writeFileSync(join(dir, "tokens.css"), css(source));
  cpSync(baseSheet, join(dir, "base.css"));
  cpSync(tooltipDelay, join(dir, "tooltip-delay.css"));
  if (existsSync(fonts)) cpSync(fonts, join(dir, "fonts"), { recursive: true });
  if (built !== undefined && "dir" in built) {
    for (const [name, path] of Object.entries(builtFiles)) if (existsSync(join(built.dir, path))) cpSync(join(built.dir, path), join(dir, name));
  }
  const server = createServer((request, response) => {
    const path = normalize(new URL(request.url ?? "/", "http://localhost").pathname).replace(/^[/\\]+/, "");
    let body: Buffer;
    try {
      if (path.startsWith("..")) throw new Error("outside the served directory");
      body = readFileSync(join(dir, path));
    } catch {
      response.writeHead(404, { "Content-Security-Policy": policy }).end();
      return;
    }
    response.writeHead(200, { "Content-Type": types[extname(path)] ?? "application/octet-stream", "Content-Security-Policy": policy }).end(body);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    origin: `http://127.0.0.1:${String(port)}`,
    close: async () => {
      await new Promise<void>((resolve) => server.close(() => {
        resolve();
      }));
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

/** What a page's recorders saw: the outcomes every fixture test asserts beside its positive outcome. */
export interface Recorded {
  readonly violations: readonly Violation[];
  /** Requests outside the fixture's allowed list. */
  readonly outside: readonly string[];
  /** Same-origin requests that did not succeed (status 400 or more, or failed), by path. */
  readonly failed: readonly string[];
  /** Console messages and uncaught errors. */
  readonly console: readonly string[];
}

/** A page of the fixture and its recorders. */
export interface Visit {
  readonly page: Page;
  /** Every console message and uncaught error since the page opened (the driver reads its own share). */
  readonly log: readonly string[];
  /** Stops recording, closes the page's context and returns what the recorders saw. */
  readonly finish: () => Promise<Recorded>;
}

/**
 * The allowed requests of a page (spec § The strict-CSP fixture): the page itself, its stylesheets (the test delay
 * stylesheet of 008 among them), the vendored
 * font and the scripts the page is allowed (the browser build, and on `scripts` pages the test-only bundles), all
 * same-origin.
 */
function allowed(origin: string, page: string, scripts: readonly string[]): (url: string) => boolean {
  const paths = new Set([page, "tokens.css", "base.css", "tooltip-delay.css", ...scripts]);
  return (url) => {
    if (!url.startsWith(`${origin}/`)) return false;
    const path = new URL(url).pathname.slice(1);
    return paths.has(path) || /^fonts\/[\w.-]+\.woff2$/.test(path);
  };
}

/** How `visit` opens a page. */
export interface VisitOptions {
  /** Opens the page in a context with `hasTouch` (a touch device) instead of the default mouse context (008 R-14). */
  readonly touch?: boolean;
}

/** Opens `page` of the fixture in a fresh context with the recorders installed before navigation. */
export async function visit(browser: Browser, origin: string, page: string, scripts: readonly string[] = ["ocelle-elements.js"], options: VisitOptions = {}): Promise<Visit> {
  const touch = options.touch === true ? { hasTouch: true } : {};
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: "light", ...touch });
  const opened = await context.newPage();
  const log: string[] = [];
  const requests: string[] = [];
  const failed: string[] = [];
  opened.on("request", (request) => requests.push(request.url()));
  opened.on("requestfailed", (request) => failed.push(new URL(request.url()).pathname.slice(1)));
  opened.on("response", (response) => {
    if (response.status() >= 400) failed.push(new URL(response.url()).pathname.slice(1));
  });
  opened.on("console", (message) => log.push(`console.${message.type()}: ${message.text()}`));
  opened.on("pageerror", (error) => log.push(`error: ${error.message}`));
  await collectViolations(opened);
  await opened.goto(`${origin}/${page}`, { waitUntil: "load" });
  const isAllowed = allowed(origin, page, scripts);
  return {
    page: opened,
    log,
    finish: async () => {
      const seen = await violations(opened);
      await context.close();
      return { violations: seen, outside: requests.filter((url) => !isAllowed(url)), failed: [...failed], console: [...log] };
    },
  };
}

/** What every fixture test expects of its page's recorders. */
export const clean: Recorded = { violations: [], outside: [], failed: [], console: [] };
