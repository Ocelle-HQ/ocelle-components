// The browser suites' server and browser (research.md R-03): each suite's beforeAll writes what the generator
// produces from the current source, and a copy of the package's fonts/ (phase 4, US2), into a temporary directory
// inside the test worker (never a pre-built dist/), serves it with Node's http module and an optional Content-Security-Policy header, and launches Chromium through
// Playwright (OCELLE_CHROMIUM_PATH overrides the executable). The violation collector is injected with
// page.addInitScript, which the page's CSP does not govern, and records every securitypolicyviolation event.
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";
import type { Browser, Page } from "playwright";
import { css } from "../../src/generate.ts";
import { source } from "../../src/source.ts";

/** A running server of one suite. */
export interface Served {
  /** `http://127.0.0.1:<port>`. */
  readonly origin: string;
  readonly close: () => Promise<void>;
}

/** The page that loads the tokens stylesheet by <link>, as a host does (contracts/token-package.md). */
export const tokenPage = '<!doctype html>\n<html lang="en">\n<head>\n<title>tokens</title>\n<link rel="stylesheet" href="tokens.css">\n</head>\n<body></body>\n</html>\n';

/** The control page: one inline <style>, the one violation `style-src 'self'` must report. */
export const controlPage =
  '<!doctype html>\n<html lang="en">\n<head>\n<title>control</title>\n<style>body { margin: 0; }</style>\n<link rel="stylesheet" href="tokens.css">\n</head>\n<body></body>\n</html>\n';

/** The weights at which the font page sets text in `--ocelle-font-sans` (US2 scenario 3). */
export const fontWeights = [400, 500, 600, 800] as const;

const digitSpans = "0123456789".split("").map((digit) => `<span>${digit}</span>`).join("");

/**
 * The font page (US2 scenarios 3, 4 and 6): a line of text in `--ocelle-font-sans` at each weight, a reference line in
 * the fallback families of `--ocelle-font-sans` alone, and the digits 0 to 9 in `--ocelle-font-sans` with and without
 * `--ocelle-figures`. Its styles come from font.css by <link>, so the page itself needs no inline style.
 */
export const fontPage =
  '<!doctype html>\n<html lang="en">\n<head>\n<title>font</title>\n<link rel="stylesheet" href="tokens.css">\n<link rel="stylesheet" href="font.css">\n</head>\n<body>\n' +
  fontWeights.map((weight) => `<p id="w${String(weight)}" class="sans w${String(weight)}">Schibsted Grotesk ${String(weight)}</p>\n`).join("") +
  '<p id="fallback" class="fallback w400">Schibsted Grotesk 400</p>\n' +
  `<p id="figures" class="sans w400 figures">${digitSpans}</p>\n` +
  `<p id="proportional" class="sans w400">${digitSpans}</p>\n` +
  "</body>\n</html>\n";

/** The font page's stylesheet: the reference line uses the fallback families of `--ocelle-font-sans` (FR-013). */
export const fontSheet =
  ".sans { font-family: var(--ocelle-font-sans); font-size: 64px; }\n" +
  '.fallback { font-family: "Helvetica Neue", Arial, system-ui, sans-serif; font-size: 64px; }\n' +
  fontWeights.map((weight) => `.w${String(weight)} { font-weight: ${String(weight)}; }\n`).join("") +
  ".figures { font-variant-numeric: var(--ocelle-figures); }\n";

/** The package's vendored font directory (research.md R-06). */
const fontsDir = new URL("../../fonts", import.meta.url);

const types: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
};

/**
 * Writes the generator's stylesheet, a copy of the package's fonts/ (unless `fonts` is false: the "font file removed"
 * control) and the fixture pages into a new directory and serves it.
 */
export async function serve(options: { readonly csp?: string; readonly fonts?: boolean } = {}): Promise<Served> {
  const dir = mkdtempSync(join(tmpdir(), "ocelle-tokens-browser-"));
  writeFileSync(join(dir, "tokens.css"), css(source));
  if (options.fonts !== false && existsSync(fontsDir)) cpSync(fontsDir, join(dir, "fonts"), { recursive: true });
  writeFileSync(join(dir, "index.html"), tokenPage);
  writeFileSync(join(dir, "control.html"), controlPage);
  writeFileSync(join(dir, "font.html"), fontPage);
  writeFileSync(join(dir, "font.css"), fontSheet);
  const server = createServer((request, response) => {
    const path = normalize(new URL(request.url ?? "/", "http://localhost").pathname).replace(/^[/\\]+/, "");
    let body: Buffer;
    try {
      if (path.startsWith("..")) throw new Error("outside the served directory");
      body = readFileSync(join(dir, path === "" ? "index.html" : path));
    } catch {
      response.writeHead(404).end();
      return;
    }
    const headers: Record<string, string> = { "Content-Type": types[extname(path)] ?? "application/octet-stream" };
    if (options.csp !== undefined) headers["Content-Security-Policy"] = options.csp;
    response.writeHead(200, headers).end(body);
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

/** Chromium, or the executable OCELLE_CHROMIUM_PATH names. */
export function launch(): Promise<Browser> {
  const executablePath = process.env.OCELLE_CHROMIUM_PATH;
  return chromium.launch(executablePath === undefined || executablePath === "" ? {} : { executablePath });
}

/** One CSP violation the page reported. */
export interface Violation {
  readonly directive: string;
  readonly blocked: string;
}

/** Installs the violation collector before any page script runs. */
export async function collectViolations(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const list: { directive: string; blocked: string }[] = [];
    Object.defineProperty(window, "__ocelleViolations", { value: list });
    document.addEventListener("securitypolicyviolation", (event) => {
      list.push({ directive: event.violatedDirective, blocked: event.blockedURI });
    });
  });
}

/** The violations the collector has recorded so far. */
export function violations(page: Page): Promise<Violation[]> {
  return page.evaluate(() => [...((window as unknown as { __ocelleViolations?: Violation[] }).__ocelleViolations ?? [])]);
}
