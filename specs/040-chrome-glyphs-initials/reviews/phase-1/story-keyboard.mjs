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
const results = [];
try {
  for (const name of ["Inbox", "History", "Settings", "Notifications", "Appearance"]) {
    for (const palette of ["light", "dark", "forced"]) {
      const theme = palette === "dark" ? "dark" : "light";
      const page = await browser.newPage({ viewport: { width: 320, height: 800 }, forcedColors: palette === "forced" ? "active" : "none" });
      try {
        const id = `elements-ocelle-icon--${name.toLowerCase()}-action`;
        await page.goto(`${origin}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`);
        await page.addStyleTag({ content: "html { font-size: 200%; }" });
        const button = page.getByRole("button", { name, exact: true });
        await button.waitFor();
        const host = page.locator("#storybook-root ocelle-button");
        await host.evaluate((host) => {
          window.verifiedKeys = [];
          window.verifiedIntents = [];
          host.addEventListener("keydown", (event) => window.verifiedKeys.push([event.key, event.isTrusted]));
          host.addEventListener("ocelle-button-activate", (event) => window.verifiedIntents.push({ target: event.target.localName, bubbles: event.bubbles, composed: event.composed }));
        });
        assert.equal(await page.locator("#storybook-root ocelle-icon svg > *").count() > 0, true);
        assert.match(await host.ariaSnapshot(), new RegExp(`button "${name}"`));
        await page.keyboard.press("Tab");
        const state = await host.evaluate((host) => {
          const control = host.shadowRoot.querySelector("button");
          const { outlineColor, outlineStyle, outlineWidth } = getComputedStyle(control);
          const { left, right, top, bottom } = control.getBoundingClientRect();
          return {
            focused: document.activeElement === host && host.shadowRoot.activeElement === control && control.matches(":focus-visible"),
            outlineColor, outlineStyle, outlineWidth, withinViewport: left >= 0 && right <= innerWidth && top >= 0 && bottom <= innerHeight,
            rootSize: getComputedStyle(document.documentElement).fontSize, scrollWidth: document.documentElement.scrollWidth,
          };
        });
        assert.equal(state.focused, true, `${id} ${palette}: Tab focus`);
        assert.equal(state.withinViewport, true);
        assert.equal(state.outlineStyle, "solid");
        assert.ok(Number.parseFloat(state.outlineWidth) > 0);
        assert.equal(state.rootSize, "32px");
        assert.equal(state.scrollWidth <= 320, true);
        await page.keyboard.press("Enter");
        assert.equal(await page.evaluate(() => window.verifiedIntents.length), 1);
        await page.keyboard.press("Space");
        const actions = await page.evaluate(() => ({ keys: window.verifiedKeys, intents: window.verifiedIntents }));
        assert.deepEqual(actions.keys, [["Enter", true], [" ", true]]);
        assert.deepEqual(actions.intents, Array.from({ length: 2 }, () => ({ target: "ocelle-button", bubbles: true, composed: true })));
        results.push({ id, palette, state, actions });
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
