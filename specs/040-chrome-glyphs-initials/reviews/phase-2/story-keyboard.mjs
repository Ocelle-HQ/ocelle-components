import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve("storybook/dist");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, "http://localhost").pathname;
    const file = resolve(root, "." + pathname);
    if (!file.startsWith(root + "/")) throw new Error("out of root");
    response.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" }).end(await readFile(file));
  } catch {
    if (!response.headersSent) response.writeHead(404);
    response.end();
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const stories = [
  { id: "elements-ocelle-button--initials-trigger", state: "standalone" },
  { id: "elements-ocelle-button--initials-trigger-busy", state: "busy" },
  { id: "elements-ocelle-button--initials-trigger-disabled", state: "disabled" },
  { id: "elements-ocelle-personal-rail--initials-trigger", state: "rail" },
];
const results = [];
try {
  for (const { id, state } of stories) {
    for (const palette of ["light", "dark", "forced"]) {
      const theme = palette === "dark" ? "dark" : "light";
      const page = await browser.newPage({ viewport: { width: 320, height: 800 }, forcedColors: palette === "forced" ? "active" : "none" });
      try {
        await page.goto(`${origin}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`);
        await page.addStyleTag({ content: "html { font-size: 200%; }" });
        const account = page.getByRole("button", { name: "Account actions for WW", exact: true });
        await account.waitFor();
        assert.equal(await account.count(), 1);
        const host = page.locator("#storybook-root ocelle-button[initials]");
        await host.evaluate((host) => {
          window.verifiedKeys = [];
          window.verifiedIntents = [];
          host.addEventListener("keydown", (event) => window.verifiedKeys.push([event.key, event.isTrusted]));
          host.addEventListener("ocelle-button-activate", (event) => window.verifiedIntents.push({ target: event.target.localName, bubbles: event.bubbles, composed: event.composed }));
        });
        const mark = host.locator("[aria-hidden=true] svg circle");
        assert.equal(await mark.count(), state === "busy" ? 0 : 1);
        const text = host.locator(".initials-text");
        if (state !== "busy") assert.equal(await text.textContent(), "WW");
        assert.equal(await account.isDisabled(), state === "disabled" || state === "busy");
        const rootSize = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const target = await account.boundingBox();
        assert.equal(rootSize, "32px");
        assert.ok(scrollWidth <= 320);
        assert.equal(target?.width, 88);
        assert.equal(target?.height, 88);
        const tabOrder = [];
        const tabs = state === "rail" ? 5 : 1;
        for (let at = 0; at < tabs; at++) {
          await page.keyboard.press("Tab");
          tabOrder.push(await page.evaluate(() => {
            const host = document.activeElement;
            const control = host?.shadowRoot?.activeElement ?? host;
            return control?.getAttribute("aria-label") ?? control?.textContent?.trim() ?? null;
          }));
        }
        if (state === "rail") assert.deepEqual(tabOrder, ["In", "Ru", "Do", "Settings", "Account actions for WW"]);
        const focus = await host.evaluate((host) => {
          const control = host.shadowRoot.querySelector("button");
          const { outlineColor, outlineStyle, outlineWidth } = getComputedStyle(control);
          return { current: document.activeElement === host && host.shadowRoot.activeElement === control && control.matches(":focus-visible"), outlineColor, outlineStyle, outlineWidth };
        });
        assert.equal(focus.current, state !== "disabled");
        if (state !== "disabled") {
          assert.equal(focus.outlineStyle, "solid");
          assert.ok(Number.parseFloat(focus.outlineWidth) > 0);
        }
        const activates = state === "standalone" || state === "rail";
        await page.keyboard.press("Enter");
        assert.equal(await page.evaluate(() => window.verifiedIntents.length), Number(activates));
        await page.keyboard.press("Space");
        const action = await page.evaluate(() => ({ keys: window.verifiedKeys, intents: window.verifiedIntents }));
        assert.deepEqual(action.intents, Array.from({ length: activates ? 2 : 0 }, () => ({ target: "ocelle-button", bubbles: true, composed: true })));
        if (state !== "disabled") assert.deepEqual(action.keys, [["Enter", true], [" ", true]]);
        await page.addScriptTag({ path: resolve("node_modules/axe-core/axe.min.js") });
        const violations = await page.evaluate(async () => {
          const result = await window.axe.run(document.querySelector("#storybook-root"));
          return result.violations.map(({ id, impact }) => ({ id, impact }));
        });
        assert.deepEqual(violations.filter(({ impact }) => impact === "serious" || impact === "critical"), []);
        results.push({ id, state, palette, rootSize, scrollWidth, target, tabOrder, focus, action, violations });
      } finally {
        await page.close();
      }
    }
  }
  process.stdout.write(JSON.stringify({ chromium: browser.version(), cases: results }, null, 2) + "\n");
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
