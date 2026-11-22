import { expect, inject, it } from "vitest";
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
    expect(await drawer.getByRole("link", { name: "Project plan" }).isVisible()).toBe(true);
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
