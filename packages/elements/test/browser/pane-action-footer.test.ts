import { existsSync } from "node:fs";
import { copyFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Browser, Locator } from "playwright";
import { build } from "vite";
import { expect, inject, it } from "vitest";
import { clean, launch, policy, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

const built = inject("elementsFixture");
const recipeSource = new URL("../../../../storybook/stories/pane-action-footer.ts", import.meta.url);
const stylesheetSource = new URL("../../../../storybook/stories/pane-action-footer.css", import.meta.url);
const script = "pane-action-footer.js";
const stylesheet = "pane-action-footer.css";

function hasFocus(control: Locator): Promise<boolean> {
  return control.evaluate((element) => {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active === element;
  });
}

it("runs the shared recipe with the built elements under strict CSP and keeps keyboard focus through a step change", async () => {
  expect({ recipe: existsSync(recipeSource), stylesheet: existsSync(stylesheetSource) }, "the shared pane footer recipe assets exist").toEqual({
    recipe: true,
    stylesheet: true,
  });

  const temporary = await mkdtemp(join(tmpdir(), "ocelle-pane-footer-csp-"));
  let server: Served | undefined;
  let browser: Browser | undefined;
  try {
    const entry = join(temporary, "mount.ts");
    const staged = join(temporary, "staged");
    // Mount the shared recipe from a same-origin module. The fixture's aggregate supplies the custom elements.
    await writeFile(entry, `
      import { renderPaneActionFooter } from ${JSON.stringify(fileURLToPath(recipeSource))};
      document.getElementById("recipe-host").append(renderPaneActionFooter("secondary-and-primary"));
    `);
    await build({
      configFile: false,
      root: temporary,
      logLevel: "error",
      build: { outDir: staged, lib: { entry, formats: ["es"], fileName: () => script } },
    });
    await copyFile(stylesheetSource, join(staged, stylesheet));

    server = await serve(built);
    browser = await launch();
    const { page, finish } = await visit(browser, server.origin, "pane-action-footer.html", ["ocelle-elements.js", script, stylesheet]);
    expect(await page.evaluate(() => customElements.get("ocelle-step-indicator") !== undefined)).toBe(true);

    // The standard fixture server has a fixed file list. Serve the staged assets at their same-origin URLs.
    const scriptUrl = `${server.origin}/${script}`;
    const stylesheetUrl = `${server.origin}/${stylesheet}`;
    await page.route(scriptUrl, (route) => route.fulfill({
      path: join(staged, script),
      contentType: "text/javascript; charset=utf-8",
      headers: { "Content-Security-Policy": policy },
    }));
    await page.route(stylesheetUrl, (route) => route.fulfill({
      path: join(staged, stylesheet),
      contentType: "text/css; charset=utf-8",
      headers: { "Content-Security-Policy": policy },
    }));
    await page.addStyleTag({ url: stylesheetUrl });
    expect(await page.evaluate((url) => Array.from(document.styleSheets).some((sheet) => sheet.href === url), stylesheetUrl)).toBe(true);
    await page.addScriptTag({ type: "module", url: scriptUrl });

    const recipe = page.locator('article[data-story="pane-action-footer"]');
    const indicator = recipe.locator("ocelle-step-indicator");
    const current = indicator.locator('[aria-current="step"]');
    const choose = recipe.getByRole("heading", { name: "Choose", exact: true });
    expect(await choose.isVisible()).toBe(true);
    expect(await current.count()).toBe(1);
    expect(await current.textContent()).toContain("Choose");

    const secondary = recipe.getByRole("button", { name: "Review options", exact: true });
    const primary = recipe.getByRole("button", { name: "Continue to Confirm", exact: true });
    await page.keyboard.press("Tab");
    expect(await hasFocus(secondary)).toBe(true);
    await page.keyboard.press("Tab");
    expect(await hasFocus(primary)).toBe(true);
    const originalButton = await primary.elementHandle();
    await page.keyboard.press("Enter");

    const confirm = recipe.getByRole("heading", { name: "Confirm", exact: true });
    expect(await confirm.isVisible()).toBe(true);
    expect(await choose.isVisible()).toBe(false);
    expect(await current.count()).toBe(1);
    expect(await current.textContent()).toContain("Confirm");
    const completed = indicator.getByRole("listitem").filter({ hasText: "Choose" });
    expect(await completed.textContent()).toMatch(/Choose\s*Completed/);

    const updated = recipe.getByRole("button", { name: "Finish", exact: true });
    expect(await updated.evaluate((button, original) => button === original, originalButton)).toBe(true);
    expect(await hasFocus(updated)).toBe(true);
    await page.keyboard.press("Tab");
    expect(await hasFocus(page.getByRole("button", { name: "After recipe", exact: true }))).toBe(true);
    expect(await finish()).toEqual(clean);
  } finally {
    await browser?.close();
    await server?.close();
    await rm(temporary, { recursive: true, force: true });
  }
}, 45_000);
