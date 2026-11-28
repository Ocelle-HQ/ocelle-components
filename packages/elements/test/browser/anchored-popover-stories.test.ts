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
const recipeSource = new URL("../../../../storybook/stories/anchored-popover.ts", import.meta.url);
const stylesheetSource = new URL("../../../../storybook/stories/anchored-popover.css", import.meta.url);
const fixture = "anchored-popover-stories.html";
const script = "anchored-popover-stories.js";
const stylesheet = "anchored-popover-stories.css";

function hasFocus(control: Locator): Promise<boolean> {
  return control.evaluate((element) => {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement != null) active = active.shadowRoot.activeElement;
    return active === element;
  });
}

function isNativeButton(control: Locator): Promise<boolean> {
  return control.evaluate((element) => element instanceof HTMLButtonElement);
}

function expanded(control: Locator): Promise<string | null> {
  return control.getAttribute("aria-expanded");
}

async function appearanceState(light: Locator, dark: Locator): Promise<(string | null)[]> {
  return Promise.all([light.getAttribute("aria-pressed"), dark.getAttribute("aria-pressed")]);
}

it("runs the exact shared appearance and profile hosts with the packaged popover under strict CSP", async () => {
  expect({ recipe: existsSync(recipeSource), stylesheet: existsSync(stylesheetSource) }, "the shared anchored popover recipe assets exist").toEqual({
    recipe: true,
    stylesheet: true,
  });

  const temporary = await mkdtemp(join(tmpdir(), "ocelle-popover-stories-csp-"));
  let server: Served | undefined;
  let browser: Browser | undefined;
  try {
    const entry = join(temporary, "mount.ts");
    const staged = join(temporary, "staged");
    await writeFile(entry, `
      import { renderAnchoredPopoverAppearance, renderAnchoredPopoverProfile } from ${JSON.stringify(fileURLToPath(recipeSource))};
      const host = document.getElementById("recipe-host");
      let signOutCount = 0;
      host.append(renderAnchoredPopoverAppearance(), renderAnchoredPopoverProfile(() => {
        signOutCount += 1;
        host.dataset.signOutCount = String(signOutCount);
      }));
    `);
    await build({
      configFile: false,
      root: temporary,
      logLevel: "error",
      build: { outDir: staged, lib: { entry, formats: ["es"], fileName: () => script } },
    });
    await copyFile(stylesheetSource, join(staged, stylesheet));

    server = await serve(built);
    const documentResponse = await fetch(`${server.origin}/${fixture}`);
    expect(documentResponse.status).toBe(200);
    expect(documentResponse.headers.get("content-security-policy")).toBe(policy);
    browser = await launch();
    const { page, finish } = await visit(browser, server.origin, fixture, ["ocelle-elements.js", script, stylesheet]);
    expect(await page.evaluate(() => customElements.get("ocelle-anchored-popover") !== undefined)).toBe(true);

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
    expect(await page.evaluate((url) => Array.from(document.styleSheets).some((sheet) => sheet.href === url && sheet.cssRules.length > 0), stylesheetUrl)).toBe(true);
    await page.addScriptTag({ type: "module", url: scriptUrl });

    const appearance = page.locator('[data-anchored-popover-demo="appearance"]');
    const appearanceTrigger = appearance.getByRole("button", { name: "Appearance menu", exact: true });
    const light = appearance.getByRole("button", { name: "Light", exact: true });
    const dark = appearance.getByRole("button", { name: "Dark", exact: true });
    expect(await isNativeButton(appearanceTrigger)).toBe(true);
    expect(await expanded(appearanceTrigger)).toBe("false");
    await appearanceTrigger.focus();
    await page.keyboard.press("Enter");
    expect(await expanded(appearanceTrigger)).toBe("true");
    expect(await Promise.all([isNativeButton(light), isNativeButton(dark)])).toEqual([true, true]);
    expect(await appearanceState(light, dark)).toEqual(["true", "false"]);

    await dark.click();
    expect(await expanded(appearanceTrigger)).toBe("false");
    await appearanceTrigger.click();
    expect(await expanded(appearanceTrigger)).toBe("true");
    expect(await appearanceState(light, dark)).toEqual(["false", "true"]);
    await page.keyboard.press("Tab");
    expect(await hasFocus(light)).toBe(true);
    await page.keyboard.press("Enter");
    expect(await expanded(appearanceTrigger)).toBe("false");
    expect(await hasFocus(appearanceTrigger)).toBe(true);
    await page.keyboard.press("Space");
    expect(await expanded(appearanceTrigger)).toBe("true");
    expect(await appearanceState(light, dark)).toEqual(["true", "false"]);
    await page.keyboard.press("Escape");
    expect(await expanded(appearanceTrigger)).toBe("false");

    const profile = page.locator('[data-anchored-popover-demo="profile"]');
    const profileTrigger = profile.getByRole("button", { name: "Profile menu", exact: true });
    const signOut = profile.getByRole("button", { name: "Sign out", exact: true });
    const receipt = page.locator("#recipe-host");
    expect(await isNativeButton(profileTrigger)).toBe(true);
    expect(await receipt.getAttribute("data-sign-out-count")).toBe("0");
    await profileTrigger.focus();
    await page.keyboard.press("Enter");
    expect(await expanded(profileTrigger)).toBe("true");
    expect(await isNativeButton(signOut)).toBe(true);
    await page.keyboard.press("Tab");
    expect(await hasFocus(signOut)).toBe(true);
    await page.keyboard.press("Enter");
    expect(await receipt.getAttribute("data-sign-out-count")).toBe("1");
    expect(await expanded(profileTrigger)).toBe("false");
    expect(await hasFocus(profileTrigger)).toBe(true);
    await profileTrigger.click();
    expect(await receipt.getAttribute("data-sign-out-count")).toBe("1");
    await signOut.click();
    expect(await receipt.getAttribute("data-sign-out-count")).toBe("2");
    expect(await expanded(profileTrigger)).toBe("false");
    expect(await finish()).toEqual(clean);
  } finally {
    await browser?.close();
    await server?.close();
    await rm(temporary, { recursive: true, force: true });
  }
}, 45_000);
