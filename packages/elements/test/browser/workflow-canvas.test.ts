import type { Browser, Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, inject, it } from "vitest";
import type { OcelleWorkflowCanvas } from "../../src/ocelle-workflow-canvas.ts";
import type { OcelleWorkflowNode } from "../../src/ocelle-workflow-node.ts";
import type { WorkflowCanvasGraph, WorkflowCanvasViewportRequestDetail } from "../../src/workflow-canvas-types.ts";
import { audit, axeSetup } from "../commands.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

const built = inject("elementsFixture");
const selection = "ocelle-workflow-node-select";
const viewport = "ocelle-workflow-canvas-viewport-request";
const graph: WorkflowCanvasGraph = {
  nodes: [
    { id: "review", label: "Initial review", kind: "Approval", accountableRole: "Reviewer", outcomes: [{ id: "approved", label: "Approved" }, { id: "rejected", label: "Rejected" }] },
    { id: "publish", label: "Publish", kind: "Publication", accountableRole: "Author", outcomes: [] },
    { id: "revise", label: "Revise", kind: "Planning", accountableRole: "Author", outcomes: [] },
  ],
  connections: [
    { sourceId: "review", outcomeId: "approved", destinationId: "publish" },
    { sourceId: "review", outcomeId: "rejected", destinationId: "revise" },
  ],
};
let served: Served | undefined;
let browser: Browser | undefined;
let openPage: Page | undefined;

beforeAll(async () => {
  served = await serve(built);
  browser = await launch();
}, 120_000);

afterEach(async () => {
  await openPage?.context().close();
  openPage = undefined;
});

afterAll(async () => {
  await browser?.close();
  await served?.close();
});

async function mount(nested = false) {
  if (served === undefined || browser === undefined) throw new Error("The strict-CSP workflow canvas fixture did not start");
  const mounted = await visit(browser, served.origin, "workflow-canvas.html", ["ocelle-elements.js", "axe.js"]);
  const { page } = mounted;
  openPage = page;
  expect(await page.evaluate(() => customElements.get("ocelle-workflow-canvas") !== undefined), "the built aggregate registers the workflow canvas").toBe(true);
  await page.evaluate(async ({ graph, nested }) => {
    const host = document.createElement("section");
    host.id = "host";
    host.setAttribute("aria-label", "Built workflow fixture");
    const before = document.createElement("button");
    before.textContent = "Before canvas";
    const after = document.createElement("button");
    after.textContent = "After canvas";
    const canvas = document.createElement("ocelle-workflow-canvas");
    canvas.id = "canvas";
    canvas.graph = graph;
    canvas.layout = [
      { nodeId: "review", x: 30, y: 20 },
      { nodeId: "publish", x: 321, y: 20 },
      { nodeId: "revise", x: 1080, y: 20 },
    ];
    canvas.viewport = { x: 0, y: 0, scale: 1 };
    canvas.mode = "author";
    canvas.selectedNodeId = "publish";
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      #pane { overflow: auto; inline-size: 760px; block-size: 490px; }
      #pane.moved { transform: translateX(-1200px); }
      #canvas { display: block; inline-size: 720px; block-size: 430px; }
    `);
    const pane = document.createElement("div");
    pane.id = "pane";
    pane.append(canvas);
    if (nested) {
      const root = host.attachShadow({ mode: "open" });
      root.adoptedStyleSheets = [sheet];
      root.append(before, pane, after);
    } else {
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      host.append(before, pane, after);
    }
    const requests: { type: string; detail: unknown }[] = [];
    for (const type of ["ocelle-workflow-node-select", "ocelle-workflow-canvas-viewport-request", "ocelle-workflow-canvas-position-request", "ocelle-workflow-canvas-connection-request"]) {
      host.addEventListener(type, (event) => {
        requests.push({ type, detail: (event as CustomEvent<unknown>).detail });
        host.dataset.requests = JSON.stringify(requests);
      });
    }
    document.body.append(host);
    await canvas.updateComplete;
  }, { graph, nested });
  return mounted;
}

async function requests(page: Page): Promise<unknown> {
  const encoded = await page.locator("#host").getAttribute("data-requests");
  return JSON.parse(encoded ?? "[]") as unknown;
}

async function focusedId(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    let current = document.activeElement;
    while (current !== null) {
      if (current.localName === "ocelle-workflow-node") return (current as OcelleWorkflowNode).nodeId;
      current = current.shadowRoot?.activeElement ?? null;
    }
    return null;
  });
}

describe("workflow canvas on the built aggregate under strict CSP", () => {
  it("renders stable steps and a branching map, emitting exact native pointer and keyboard selection requests", async () => {
    const { page, finish } = await mount();
    const review = page.getByRole("button", { name: /^Initial review/ });
    await review.click();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    const expected = { type: selection, detail: { nodeId: "review" } };
    expect(await requests(page)).toEqual([expected, expected, expected]);
    expect(await page.locator("ocelle-workflow-canvas").evaluate((canvas: OcelleWorkflowCanvas) => ({ graph: canvas.graph, selected: canvas.selectedNodeId })))
      .toEqual({ graph, selected: "publish" });
    expect(await page.locator("ocelle-workflow-canvas svg g[aria-hidden='true'] path").count()).toBe(2);

    const publish = page.getByRole("button", { name: /^Publish/ });
    await publish.waitFor();
    await page.evaluate(() => document.fonts.ready.then(() => new Promise((resolve) => requestAnimationFrame(resolve))));
    const contrast = await audit(page.mainFrame(), () => page.addScriptTag({ url: "axe.js" }), axeSetup().rules, "host");
    expect(contrast, "axe can measure the visible native action labels").toEqual([]);

    const canvas = page.locator("ocelle-workflow-canvas");
    await publish.evaluate((button) => {
      const pane = document.getElementById("pane");
      if (pane === null) throw new Error("Canvas test pane unavailable");
      const style = getComputedStyle(button);
      const focusOutset = parseFloat(style.getPropertyValue("--ocelle-focus-width"))
        + parseFloat(style.getPropertyValue("--ocelle-focus-offset"));
      const width = Math.ceil(button.getBoundingClientRect().right - pane.getBoundingClientRect().left + focusOutset + 2);
      const shift = focusOutset / 2 + 2;
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(`#pane { inline-size: ${String(width)}px; }
        #canvas.focus-outline-clipped { transform: translateX(${String(shift)}px); }`);
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    });
    await publish.focus();
    expect(await focusedId(page)).toBe("publish");
    await canvas.evaluate((element) => { element.classList.add("focus-outline-clipped"); });
    await expect.poll(() => publish.count()).toBe(0);
    expect(await canvas.evaluate((element) => {
      const pane = document.getElementById("pane");
      const node = [...element.shadowRoot?.querySelectorAll("ocelle-workflow-node") ?? []].find(({ nodeId }) => nodeId === "publish");
      const button = node?.shadowRoot?.querySelector("button");
      return pane !== null && button !== null && button !== undefined
        && button.getBoundingClientRect().right < pane.getBoundingClientRect().right;
    }), "the host pane clips only the focus outline").toBe(true);
    expect(await focusedId(page)).not.toBe("publish");

    await canvas.evaluate((element) => { element.classList.remove("focus-outline-clipped"); });
    await expect.poll(() => publish.count()).toBe(1);
    expect(await requests(page)).toEqual([expected, expected, expected]);
    expect(await finish()).toEqual(clean);
  });

  it("retains focus in a nested strict-CSP host while the viewport is withheld, and reveals on host acceptance", async () => {
    const { page, finish } = await mount(true);
    const reveal = page.getByRole("button", { name: /^Reveal\b/i });
    await page.getByRole("combobox").selectOption("revise");
    await reveal.focus();
    await page.keyboard.press("Enter");
    expect(await focusedId(page)).toBeNull();
    expect(await reveal.evaluate((button) => button.getRootNode() instanceof ShadowRoot && (button.getRootNode() as ShadowRoot).activeElement === button)).toBe(true);
    const recorded = await requests(page);
    expect(recorded).toMatchObject([{ type: viewport, detail: { viewport: {} } }]);
    expect(recorded).toHaveLength(1);

    await page.locator("ocelle-workflow-canvas").evaluate(async (current: OcelleWorkflowCanvas) => {
      const host = document.getElementById("host");
      const events = JSON.parse(host?.dataset.requests ?? "[]") as { detail: WorkflowCanvasViewportRequestDetail }[];
      const proposed = events.at(-1)?.detail.viewport;
      if (proposed === undefined) throw new Error("The host did not receive a viewport proposal");
      current.viewport = proposed;
      await current.updateComplete;
    });
    await expect.poll(() => focusedId(page)).toBe("revise");
    await page.keyboard.press("Enter");
    expect(await requests(page)).toEqual([...(recorded as unknown[]), { type: selection, detail: { nodeId: "revise" } }]);
    expect(await finish()).toEqual(clean);
  });

  it("changes native focus eligibility after a host pane translates away and back without canvas inputs", async () => {
    const { page, finish } = await mount(true);
    const publish = page.getByRole("button", { name: /^Publish/ });
    await publish.focus();
    expect(await focusedId(page)).toBe("publish");

    await page.locator("#pane").evaluate((pane) => { pane.classList.add("moved"); });
    await expect.poll(() => publish.count()).toBe(0);
    expect(await focusedId(page)).not.toBe("publish");
    expect(await requests(page)).toEqual([]);

    await page.locator("#pane").evaluate((pane) => { pane.classList.remove("moved"); });
    await expect.poll(() => publish.count()).toBe(1);
    await publish.click();
    expect(await requests(page)).toEqual([{ type: selection, detail: { nodeId: "publish" } }]);
    expect(await finish()).toEqual(clean);
  });
});
