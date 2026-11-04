import type { Browser, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { collectViolations, launch, serve, violations } from "./serve.ts";
import type { Served } from "./serve.ts";

// The tokens under the strict CSP (constitution IV, FR-004; US1 scenario 10's run-time half; research.md R-03 *CSP
// violations*): the page is served with the constitution's CSP plus `font-src 'self'` and loads tokens.css by <link>.
// The collector, injected with addInitScript, must report exactly one violation on the control page (an inline
// <style>), so a broken collector fails here instead of passing "zero violations"; then the token page reports none
// while its tokens are defined.
const policy = "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'";
let browser: Browser | undefined;
let served: Served | undefined;

beforeAll(async () => {
  served = await serve({ csp: policy });
  browser = await launch();
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await served?.close();
});

interface Visit {
  readonly header: string | undefined;
  readonly violations: readonly { readonly directive: string; readonly blocked: string }[];
  readonly refused: readonly string[];
  readonly canvas: string;
}

async function visit(path: string): Promise<Visit> {
  if (browser === undefined || served === undefined) throw new Error("the suite did not start");
  const page: Page = await browser.newPage();
  await collectViolations(page);
  const refused: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("Content Security Policy")) refused.push(message.text());
  });
  const response = await page.goto(`${served.origin}/${path}`, { waitUntil: "load" });
  await page.waitForTimeout(250);
  const result: Visit = {
    header: response?.headers()["content-security-policy"],
    violations: await violations(page),
    refused,
    canvas: await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--ocelle-color-canvas").trim()),
  };
  await page.close();
  return result;
}

describe("the tokens stylesheet under the strict CSP plus font-src 'self'", { timeout: 60_000 }, () => {
  it("the collector reports exactly the one violation of the control page (an inline <style>)", async () => {
    const control = await visit("control.html");
    expect(control.header).toBe(policy);
    expect(control.violations).toEqual([{ directive: "style-src-elem", blocked: "inline" }]);
    expect(control.refused).toHaveLength(1);
    expect(control.canvas).toBe("#F1EEE8");
  });

  it("the token page, loading tokens.css by <link>, reports no violation and has its tokens", async () => {
    const tokens = await visit("index.html");
    expect(tokens.header).toBe(policy);
    expect(tokens.violations).toEqual([]);
    expect(tokens.refused).toEqual([]);
    expect(tokens.canvas).toBe("#F1EEE8");
  });
});
