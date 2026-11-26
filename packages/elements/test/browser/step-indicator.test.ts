import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "playwright";
import { build } from "vite";
import { expect, inject, it } from "vitest";
import { clean, launch, policy, serve, visit } from "./serve.ts";

const built = inject("elementsFixture");

async function render(page: Page) {
  return page.evaluate(async () => {
    const indicator = document.createElement("ocelle-step-indicator");
    indicator.steps = [
      { label: "Review", state: "completed" },
      { label: "Choose", state: "current" },
      { label: "Confirm", state: "upcoming" },
    ];
    document.body.append(indicator);
    await indicator.updateComplete;
    return {
      registered: indicator.constructor === customElements.get("ocelle-step-indicator"),
      items: [...(indicator.shadowRoot?.querySelectorAll("ol > li") ?? [])].map((item) => ({
        text: item.querySelector(".label")?.textContent,
        current: item.getAttribute("aria-current"),
      })),
    };
  });
}

const displayed = {
  registered: true,
  items: [
    { text: "Review", current: null },
    { text: "Choose", current: "step" },
    { text: "Confirm", current: null },
  ],
};

it("registers and renders progress from the built browser aggregate under strict CSP", async () => {
  const server = await serve(built);
  const browser = await launch();
  try {
    const { page, finish } = await visit(browser, server.origin, "workflow-canvas.html");
    const rendered = await render(page);
    expect({ rendered, recorded: await finish() }).toEqual({ rendered: displayed, recorded: clean });
  } finally {
    await browser.close();
    await server.close();
  }
}, 30_000);

it("registers and renders progress from the standalone module without the rest of the library", async () => {
  if (!("dir" in built)) throw new Error(built.problem);
  const host = join(built.dir, "host");
  const entry = join(host, "module", "ocelle-step-indicator.js");
  const outDir = join(built.dir, "step-indicator-only");
  const bundle = "step-indicator-bundle.js";
  let script = "";
  if (existsSync(entry)) {
    await build({
      configFile: false,
      root: host,
      logLevel: "error",
      resolve: { conditions: ["module", "browser", "production"] },
      build: { outDir, lib: { entry, formats: ["es"], fileName: () => bundle } },
    });
    script = await readFile(join(outDir, bundle), "utf8");
  }

  const server = await serve(built);
  const browser = await launch();
  try {
    const { page, finish } = await visit(browser, server.origin, "workflow-canvas-mixed.html", [bundle]);
    const url = new URL(bundle, page.url());
    await page.route(url.href, async (route) => {
      await route.fulfill({ body: script, contentType: "text/javascript", headers: { "Content-Security-Policy": policy } });
    });
    await page.addScriptTag({ type: "module", url: url.href });
    const otherElementRegistered = await page.evaluate(() => customElements.get("ocelle-workflow-canvas") !== undefined);
    const rendered = await render(page);
    expect({ rendered, otherElementRegistered, recorded: await finish() }).toEqual({
      rendered: displayed, otherElementRegistered: false, recorded: clean,
    });
  } finally {
    await browser.close();
    await server.close();
  }
}, 30_000);
