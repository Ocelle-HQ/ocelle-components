import { inflateSync } from "node:zlib";
import { expect, inject, it } from "vitest";
import { decodePng } from "../pixels.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";

const built = inject("elementsFixture");

it("resizes the built shell, dismisses its real drawer, and transfers skip focus under strict CSP", async () => {
  const server = await serve(built);
  const browser = await launch();
  try {
    const fixture = await visit(browser, server.origin, "app-shell.html", ["ocelle-elements.js", "app-shell.css", "app-shell.js"]);
    const { page } = fixture;
    const focused = () => page.evaluate(() => {
      let element = document.activeElement;
      while (element?.shadowRoot?.activeElement != null) element = element.shadowRoot.activeElement;
      return element?.getAttribute("part") ?? element?.id;
    });
    const tier = () => page.evaluate(() => document.querySelector("ocelle-app-shell")?.tier);
    await expect.poll(tier).toBe("expanded");
    await page.getByRole("button", { name: "Narrow frame" }).click();
    await expect.poll(tier).toBe("narrow");
    expect(page.viewportSize()?.width).toBe(1280);
    const menu = page.getByRole("button", { name: "Show navigation" });
    await menu.focus();
    await page.keyboard.press("Enter");
    const drawer = page.getByRole("dialog", { name: "Projects navigation" });
    await drawer.waitFor({ state: "visible" });
    expect(await page.getByRole("link", { name: "Project plan" }).isVisible()).toBe(true);
    await expect.poll(focused).toBe("plan");
    await page.keyboard.press("Escape");
    await drawer.waitFor({ state: "hidden" });
    await expect.poll(focused).toBe("menu-button");
    await page.keyboard.press("Shift+Tab");
    expect(await focused()).toBe("control");
    await page.keyboard.press("Enter");
    const skipTarget = await focused();
    await page.keyboard.press("Tab");
    expect({ skipTarget, next: await focused(), recorded: await fixture.finish() }).toEqual({
      skipTarget: "main",
      next: "main-action",
      recorded: clean,
    });
  } finally {
    await Promise.all([browser.close(), server.close()]);
  }
}, 120_000);

it.each(["light", "dark", "forced colours"] as const)("preserves the app pane separator without a lower top-bar divider in %s", async (mode) => {
  const server = await serve(built);
  const browser = await launch();
  try {
    const fixture = await visit(browser, server.origin, "app-shell.html", ["ocelle-elements.js", "app-shell.css", "app-shell.js"]);
    const { page } = fixture;
    const driver = fixtureDriver(page, fixture.log);
    await driver.theme(mode === "dark" ? "dark" : "light");
    await driver.forcedColors(mode === "forced colours" ? "active" : "none");

    const bar = page.locator("#shell").locator("ocelle-top-bar").locator('[part="bar"]');
    const pane = page.getByRole("main");
    const sidebar = page.getByRole("navigation", { name: "Workspace" });
    const [barBounds, paneBounds, sidebarBounds] = await Promise.all([bar.boundingBox(), pane.boundingBox(), sidebar.boundingBox()]);
    if (barBounds === null || paneBounds === null || sidebarBounds === null) throw new Error("Expected the expanded shell and its two panes to be visible");
    expect(barBounds.width).toBeGreaterThan(0);
    expect(barBounds.height).toBeGreaterThan(0);
    expect(paneBounds.x).toBeCloseTo(sidebarBounds.x + sidebarBounds.width);
    expect(paneBounds.y).toBeCloseTo(sidebarBounds.y);
    expect(paneBounds.y).toBeCloseTo(barBounds.y + barBounds.height);

    const paneRule = await pane.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        colour: style.borderInlineStartColor,
        width: Number.parseFloat(style.borderInlineStartWidth),
        topInset: Number.parseFloat(style.paddingBlockStart),
      };
    });
    const colour = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(paneRule.colour);
    if (colour === null) throw new Error(`Expected an RGB shell pane rule, got ${paneRule.colour}`);
    const screenshot = { caret: "initial", animations: "allow", scale: "css" } as const;
    const paneImage = await decodePng(await pane.screenshot(screenshot), (data) => Promise.resolve(inflateSync(data)));
    const row = Math.floor(paneRule.topInset / 2);
    const adjacent = Math.ceil(paneRule.width);
    expect(paneRule.width).toBeGreaterThan(0);
    expect(paneImage.width).toBeGreaterThan(adjacent);
    expect(paneImage.height).toBeGreaterThan(row);
    const panePixels = Uint8Array.from(paneImage.data);
    const boundary = row * paneImage.width * 4;
    const rulePixel = Array.from(panePixels.subarray(boundary, boundary + 3));
    const panePixel = Array.from(panePixels.subarray(boundary + adjacent * 4, boundary + adjacent * 4 + 3));
    expect(rulePixel, "the app-owned separator is painted at the pane boundary").toEqual(colour.slice(1).map(Number));
    expect(panePixel, "the app-owned separator is visible against the pane").not.toEqual(rulePixel);

    const barImage = await decodePng(await bar.screenshot(screenshot), (data) => Promise.resolve(inflateSync(data)));
    const rowBytes = barImage.width * 4;
    const barPixels = Uint8Array.from(barImage.data);
    const lowerEdge = barPixels.subarray(barPixels.length - rowBytes);
    const hasDividerPixels = lowerEdge.some((channel, at) => channel !== barPixels[at]);
    expect(await fixture.finish()).toEqual(clean);
    expect(hasDividerPixels, "the built top bar paints zero lower-divider pixels").toBe(false);
  } finally {
    await Promise.all([browser.close(), server.close()]);
  }
}, 120_000);
