/// <reference types="vite/client" />
import { copyFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Browser, Locator, Page } from "playwright";
import { build } from "vite";
import { expect, inject, it } from "vitest";
import { clean, launch, policy, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

type AuthoringModule = typeof import("../../../../storybook/stories/workflow-studio-authoring.ts");
type AuthoringOptions = NonNullable<Parameters<AuthoringModule["renderWorkflowStudioAuthoring"]>[0]>;
type FixtureMount = HTMLElement & Pick<ReturnType<AuthoringModule["renderWorkflowStudioAuthoring"]>, "readSemanticSnapshot">;

const modules = import.meta.glob<AuthoringModule>("../../../../storybook/stories/workflow-studio-authoring.ts", { eager: true });
const authoring = modules["../../../../storybook/stories/workflow-studio-authoring.ts"];
if (authoring === undefined) {
  throw new Error("Cannot find module '../../../../storybook/stories/workflow-studio-authoring.ts'");
}

const built = inject("elementsFixture");
const authoringSource = new URL("../../../../storybook/stories/workflow-studio-authoring.ts", import.meta.url);
const stylesheetSource = new URL("../../../../storybook/stories/workflow-studio.css", import.meta.url);
const fixturePage = "workflow-studio.html";
const script = "workflow-studio-authoring.js";
const stylesheet = "workflow-studio.css";

async function withAuthoring<T>(scenario: NonNullable<AuthoringOptions["scenario"]>, exercise: (page: Page) => Promise<T>): Promise<T> {
  expect(typeof authoring?.renderWorkflowStudioAuthoring).toBe("function");
  const temporary = await mkdtemp(join(tmpdir(), "ocelle-workflow-studio-csp-"));
  let server: Served | undefined;
  let browser: Browser | undefined;
  try {
    const entry = join(temporary, "mount.ts");
    const staged = join(temporary, "staged");
    await writeFile(entry, `
      import { renderWorkflowStudioAuthoring } from ${JSON.stringify(fileURLToPath(authoringSource))};
      const fixture = renderWorkflowStudioAuthoring({ scenario: ${JSON.stringify(scenario)} });
      const mount = document.getElementById("recipe-host");
      mount.append(fixture.root);
      mount.readSemanticSnapshot = fixture.readSemanticSnapshot;
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
    const { origin } = server;
    const { page, finish } = await visit(browser, origin, fixturePage, ["ocelle-elements.js", script, stylesheet]);
    const response = await page.request.get(`${origin}/${fixturePage}`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-security-policy"]).toBe(policy);

    const scriptUrl = `${origin}/${script}`;
    const stylesheetUrl = `${origin}/${stylesheet}`;
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

    const observed = await exercise(page);
    expect(await finish()).toEqual(clean);
    return observed;
  } finally {
    await browser?.close();
    await server?.close();
    await rm(temporary, { recursive: true, force: true });
  }
}

async function keyboardAction(page: Page, control: Locator, key: string, eventType: "click" | "change"): Promise<void> {
  await control.evaluate((element, event) => {
    const mount = document.getElementById("recipe-host");
    element.addEventListener(event, (delivered) => {
      mount?.setAttribute("data-trusted-action", String(delivered.isTrusted));
    }, { once: true });
  }, eventType);
  await control.focus();
  expect(await control.evaluate((element) => {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active === element;
  })).toBe(true);
  await page.keyboard.press(key);
  expect(await page.locator("#recipe-host").getAttribute("data-trusted-action"), "the keyboard action reached its native control").toBe("true");
}

async function selectedStep(canvas: Locator): Promise<string | null> {
  return canvas.evaluate(async (element) => {
    const control = element as HTMLElementTagNameMap["ocelle-workflow-canvas"];
    await control.updateComplete;
    return control.selectedNodeId;
  });
}

it("applies keyboard step selection to the canvas under strict CSP", async () => {
  const selected = await withAuthoring("wired", async (page) => {
    const canvas = page.locator("ocelle-workflow-canvas");
    expect(await selectedStep(canvas)).toBe("security-review-1");
    const action = page.getByRole("button", { name: "Select Publish decision", exact: true });
    await action.waitFor({ state: "visible" });
    await keyboardAction(page, action, "Enter", "click");
    return selectedStep(canvas);
  });
  expect(selected, "the authoring host selects the requested step in the real canvas").toBe("publish-decision");
}, 45_000);

it("accepts a keyboard reviewer binding in the authoritative fixture under strict CSP", async () => {
  const reviewer = await withAuthoring("unassigned", async (page) => {
    const field = page.getByRole("combobox", { name: "Accountable reviewer", exact: true });
    await field.waitFor({ state: "visible" });
    expect(await field.inputValue()).toBe("");
    await keyboardAction(page, field, "ArrowDown", "change");
    expect(await field.inputValue()).toBe("Avery Example");
    return page.locator("#recipe-host").evaluate((node) => {
      const snapshot = JSON.parse((node as FixtureMount).readSemanticSnapshot()) as {
        readonly steps: readonly { readonly id: string; readonly reviewer: string }[];
      };
      return snapshot.steps.find((step) => step.id === "security-review-1")?.reviewer;
    });
  });
  expect(reviewer, "the authoring host binds the selected reviewer to Security review").toBe("Avery Example");
}, 45_000);
