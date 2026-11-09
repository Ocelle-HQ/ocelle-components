// The base-style browser suites' server (003 research.md R-09): each suite's beforeAll writes into a temporary
// directory what a host serves, tokens.css from the token generator (the current source, never a pre-built dist/),
// base.css copied from src/, the vendored fonts, the fixtures of test/fixtures/ (pages, layout.css, media.svg, host
// stylesheets and plants/) and control.html from 002's controlPage (one inline <style>), and serves it on 127.0.0.1
// with the strict CSP `default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'`. page.html alone,
// whose local image the media scenario loads, gets `img-src 'self'` added (plan decision 15). Chromium, the violation
// collector and the control page are 002's (packages/tokens/test/browser/serve.ts).
//
// A page's stylesheet links can be varied by query string, so a plant is linked after base.css exactly as R-10
// describes without a fixture page per plant: `after=plants/x,host` links `plants/x.css` and `host.css` right after
// base.css, in that order; `tokens=none` drops the tokens.css link (US1-6) and `tokens=last` moves it after base.css
// (US1-7). The fixture files themselves link tokens.css, then base.css, then layout.css where they need it.
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { css } from "../../../tokens/src/generate.ts";
import { source } from "../../../tokens/src/source.ts";
import { controlPage } from "../../../tokens/test/browser/serve.ts";

export { collectViolations, launch, violations } from "../../../tokens/test/browser/serve.ts";
export type { Violation } from "../../../tokens/test/browser/serve.ts";

/** The strict CSP of every fixture page (constitution IV, FR-022) plus the tokens' `font-src 'self'`. */
export const policy = "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'";
/** The policy of page.html, the one fixture that shows a local image (US1-5, US1-10). */
export const imagePolicy = `${policy}; img-src 'self'`;

/** A running server of one suite. */
export interface Served {
  /** `http://127.0.0.1:<port>`. */
  readonly origin: string;
  readonly close: () => Promise<void>;
}

const fixtures = fileURLToPath(new URL("../fixtures", import.meta.url));
const baseSheet = fileURLToPath(new URL("../../src/base.css", import.meta.url));
const fonts = fileURLToPath(new URL("../../../tokens/fonts", import.meta.url));

const types: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
};

const tokensLink = '<link rel="stylesheet" href="tokens.css">\n';
const baseLink = '<link rel="stylesheet" href="base.css">\n';

/** A fixture page with its stylesheet links varied as the query asks (see the header comment). */
export function variant(html: string, query: URLSearchParams): string {
  const after = (query.get("after") ?? "")
    .split(",")
    .filter((name) => name !== "")
    .map((name) => `<link rel="stylesheet" href="${name}.css">\n`)
    .join("");
  const tokens = query.get("tokens");
  let page = html.replace(baseLink, `${baseLink}${after}`);
  if (tokens === "none" || tokens === "last") page = page.replace(tokensLink, "");
  if (tokens === "last") page = page.replace(baseLink, `${baseLink}${tokensLink}`);
  return page;
}

/** Writes the served directory (see the header comment) and serves it under the strict CSP. */
export async function serve(): Promise<Served> {
  const dir = mkdtempSync(join(tmpdir(), "ocelle-styles-browser-"));
  cpSync(fixtures, dir, { recursive: true });
  writeFileSync(join(dir, "tokens.css"), css(source));
  cpSync(baseSheet, join(dir, "base.css"));
  if (existsSync(fonts)) cpSync(fonts, join(dir, "fonts"), { recursive: true });
  writeFileSync(join(dir, "control.html"), controlPage);
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    const path = normalize(url.pathname).replace(/^[/\\]+/, "");
    let body: Buffer | string;
    try {
      if (path.startsWith("..")) throw new Error("outside the served directory");
      body = readFileSync(join(dir, path));
    } catch {
      response.writeHead(404, { "Content-Security-Policy": policy }).end();
      return;
    }
    if (extname(path) === ".html") body = variant(body.toString("utf8"), url.searchParams);
    response
      .writeHead(200, { "Content-Type": types[extname(path)] ?? "application/octet-stream", "Content-Security-Policy": path === "page.html" ? imagePolicy : policy })
      .end(body);
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
