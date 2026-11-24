import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Browser, Locator, Page } from "playwright";
import { build } from "vite";
import { afterAll, afterEach, beforeAll, describe, expect, inject, it } from "vitest";
import type { OcelleWorkflowCanvas } from "../../src/ocelle-workflow-canvas.ts";
import type { OcelleWorkflowNode } from "../../src/ocelle-workflow-node.ts";
import type { WorkflowCanvasGraph, WorkflowCanvasViewportRequestDetail } from "../../src/workflow-canvas-types.ts";
import { audit, axeSetup } from "../commands.ts";
import { clean, launch, policy, serve, visit } from "./serve.ts";
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
let standaloneNodeScript: string | undefined;

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

async function mount(nested = false, standaloneNodeFirst = false) {
  if (served === undefined || browser === undefined) throw new Error("The strict-CSP workflow canvas fixture did not start");
  const mounted = standaloneNodeFirst
    ? await visit(browser, served.origin, "workflow-canvas-mixed.html", ["workflow-node-bundle.js", "ocelle-elements.js"])
    : await visit(browser, served.origin, "workflow-canvas.html", ["ocelle-elements.js", "axe.js"]);
  const { page } = mounted;
  openPage = page;
  if (standaloneNodeFirst) await loadAggregateAfterStandaloneNode(page);
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

async function loadAggregateAfterStandaloneNode(page: Page): Promise<void> {
  standaloneNodeScript ??= await bundleStandaloneNode();
  const source = standaloneNodeScript;
  const url = new URL("workflow-node-bundle.js", page.url());
  await page.route(url.href, async (route) => {
    await route.fulfill({ body: source, contentType: "text/javascript", headers: { "Content-Security-Policy": policy } });
  });
  await page.addScriptTag({ type: "module", url: url.href });
  await page.evaluate(() => {
    document.body.append(document.createElement("ocelle-workflow-node"));
  });
  const standalone = page.locator("body > ocelle-workflow-node");
  expect(await standalone.evaluate((node) => ({
    registered: node.constructor === customElements.get("ocelle-workflow-node"),
    canvasRegistered: customElements.get("ocelle-workflow-canvas") !== undefined,
  })), "the standalone entry defines its node before the browser aggregate loads").toEqual({ registered: true, canvasRegistered: false });
  await page.addScriptTag({ type: "module", url: "ocelle-elements.js" });
  expect(await standalone.evaluate((node) => {
    const stillRegistered = node.constructor === customElements.get("ocelle-workflow-node");
    node.remove();
    return stillRegistered;
  }), "the aggregate retains the standalone node constructor").toBe(true);
}

async function bundleStandaloneNode(): Promise<string> {
  if (!("dir" in built)) throw new Error(built.problem);
  const host = join(built.dir, "host");
  const outDir = join(built.dir, "workflow-node-only");
  await build({
    configFile: false,
    root: host,
    logLevel: "error",
    resolve: { conditions: ["module", "browser", "production"] },
    build: {
      outDir,
      lib: { entry: join(host, "module", "ocelle-workflow-node.js"), formats: ["es"], fileName: () => "workflow-node-bundle.js" },
    },
  });
  return readFile(join(outDir, "workflow-node-bundle.js"), "utf8");
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

async function controlledState(canvas: Locator) {
  return canvas.evaluate((element: OcelleWorkflowCanvas) => ({
    graph: element.graph,
    layout: element.layout,
    viewport: element.viewport,
    selectedNodeId: element.selectedNodeId,
    scroll: [element.parentElement?.scrollLeft, element.parentElement?.scrollTop],
  }));
}

async function watchRestoredAction(canvas: Locator, eventType: "click" | "keydown"): Promise<void> {
  await canvas.evaluate((element, type) => {
    const pane = element.parentElement;
    const root = pane?.getRootNode();
    const node = element.shadowRoot?.querySelector("ocelle-workflow-node");
    const face = node?.parentElement;
    const action = node?.shadowRoot?.querySelector("button");
    if (!(root instanceof ShadowRoot) || pane === null || face == null || action == null || node?.nodeId !== "review") {
      throw new Error("The nested fixture's Review action is missing");
    }
    const sheet = new CSSStyleSheet();
    sheet.replaceSync("#pane { block-size: 390px; } #canvas.shifted { transform: translateX(-80px); }");
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    pane.scrollTop = 4;
    element.classList.add("shifted");
    document.addEventListener(type, (event) => {
      const clipped = action.getBoundingClientRect().left < pane.getBoundingClientRect().left;
      element.classList.remove("shifted");
      const bounds = action.getBoundingClientRect();
      const clip = pane.getBoundingClientRect();
      element.dataset.restoreInput = JSON.stringify({
        trusted: event.isTrusted,
        clipped,
        exposed: bounds.left > clip.left && bounds.right < clip.right && bounds.top > clip.top && bounds.bottom < clip.bottom,
        inert: face.inert,
      });
    }, { capture: true, once: true });
  }, eventType);
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
    const findings = await audit(page.mainFrame(), () => page.addScriptTag({ url: "axe.js" }), axeSetup().rules, "host");
    const contrastTitles = findings.flatMap(({ id, targets }) =>
      id === "color-contrast" ? targets.filter((target) => target.endsWith(" >>> #title")) : []);
    expect(contrastTitles, "axe can measure color contrast for the visible native workflow action titles").toEqual([]);

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

  it("recovers focus to the visible named picker when the idle strict-CSP host clips the reveal button", async () => {
    const { page, finish } = await mount(true);
    const canvas = page.locator("ocelle-workflow-canvas");
    const reveal = page.getByRole("button", { name: /^Reveal\b/i });
    const picker = page.getByRole("combobox", { name: /^Step/i });
    await canvas.evaluate(async (element: OcelleWorkflowCanvas) => {
      const pane = element.parentElement;
      const hostRoot = pane?.getRootNode();
      if (!(hostRoot instanceof ShadowRoot) || pane === null) throw new Error("The nested clip fixture is missing");
      element.graph = { nodes: element.graph.nodes.filter(({ id }) => id === "revise"), connections: [] };
      element.layout = [{ nodeId: "revise", x: 2000, y: 20 }];
      const sheet = new CSSStyleSheet();
      sheet.replaceSync("#pane { inline-size: 440px; overflow: hidden; }");
      hostRoot.adoptedStyleSheets = [...hostRoot.adoptedStyleSheets, sheet];
      await element.updateComplete;
      await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const button = element.shadowRoot?.querySelector("button");
      if (button === undefined || button === null) throw new Error("The reveal control is missing");
      const shift = pane.getBoundingClientRect().right - button.getBoundingClientRect().right + 15;
      sheet.insertRule(`#canvas.reveal-clipped { transform: translateX(${String(shift)}px); }`);
    });
    await reveal.focus();
    await page.keyboard.press("Enter");
    expect(await reveal.evaluate((button) => button.matches(":focus"))).toBe(true);
    const recorded = await requests(page);
    expect(recorded).toMatchObject([{ type: viewport, detail: { viewport: {} } }]);
    const before = await canvas.evaluate((element: OcelleWorkflowCanvas) => ({
      viewport: element.viewport, scroll: element.parentElement?.scrollLeft,
      width: element.offsetWidth, height: element.offsetHeight,
    }));
    await canvas.evaluate((element) => { element.classList.add("reveal-clipped"); });
    expect(await canvas.evaluate((element) => {
      const clip = element.parentElement?.getBoundingClientRect();
      const button = element.shadowRoot?.querySelector("button")?.getBoundingClientRect();
      const select = element.shadowRoot?.querySelector("select")?.getBoundingClientRect();
      return clip !== undefined && button !== undefined && select !== undefined
        && button.right > clip.right && select.left >= clip.left && select.right < clip.right;
    }), "the translated pane clips only the reveal button").toBe(true);
    await expect.poll(() => picker.evaluate((control) => control.matches(":focus")), {
      message: "the still-visible native picker takes focus without host interaction",
    }).toBe(true);
    expect(await canvas.evaluate((element: OcelleWorkflowCanvas) => ({
      viewport: element.viewport, scroll: element.parentElement?.scrollLeft,
      width: element.offsetWidth, height: element.offsetHeight,
    }))).toEqual(before);
    expect(await requests(page)).toEqual(recorded);
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

  it.each([
    { input: "ArrowLeft", eventType: "keydown" },
    { input: "Enter on Reveal step", eventType: "click" },
  ] as const)("focuses a newly exposed Review on the first trusted $input before observers deliver", async ({ input, eventType }) => {
    const { page, finish } = await mount(true);
    const canvas = page.locator("ocelle-workflow-canvas");
    const review = page.getByRole("button", { name: /^Initial review/ });
    const initiator = page.getByRole("button", { name: eventType === "keydown" ? /^Publish/ : /^Reveal\b/i });
    await expect.poll(() => review.count()).toBe(1);
    await watchRestoredAction(canvas, eventType);
    await expect.poll(() => review.count(), { message: "the clipped Review is unavailable before input" }).toBe(0);
    await initiator.evaluate((button: HTMLButtonElement) => { button.focus({ preventScroll: true }); });
    expect(await initiator.evaluate((button) => button.matches(":focus"))).toBe(true);
    const before = await controlledState(canvas);
    expect(before.scroll).toEqual([0, 4]);

    await page.keyboard.press(eventType === "keydown" ? "ArrowLeft" : "Enter");
    expect(JSON.parse(await canvas.getAttribute("data-restore-input") ?? "null") as unknown, `the trusted ${input} exposes Review while its wrapper is still inert`)
      .toEqual({ trusted: true, clipped: true, exposed: true, inert: true });
    await expect.poll(() => review.count()).toBe(1);
    expect(await controlledState(canvas)).toEqual(before);
    expect(await requests(page), "an already exposed target needs zero canvas requests").toEqual([]);
    const focused = await review.evaluate((button) => button.matches(":focus"));
    expect(await finish()).toEqual(clean);
    expect(focused, `the same trusted ${input} focuses the newly exposed native action`).toBe(true);
  });

  it.each([
    { destination: "the visible Step picker", external: false, keepPublish: false },
    { destination: "the host's external button", external: true, keepPublish: false },
    { destination: "the still-enabled Reveal button", external: false, keepPublish: true },
  ])("keeps focus on $destination when the host removes the pending reveal target", async ({ destination, external, keepPublish }) => {
    const { page, finish } = await mount(true);
    const canvas = page.locator("ocelle-workflow-canvas");
    const reveal = page.getByRole("button", { name: /^Reveal\b/i });
    const picker = page.getByRole("combobox", { name: /^Step/i });
    const externalButton = page.getByRole("button", { name: "After canvas" });
    await canvas.evaluate(async (element: OcelleWorkflowCanvas, keepSuccessor) => {
      const pane = element.parentElement;
      const root = pane?.getRootNode();
      if (!(root instanceof ShadowRoot) || pane === null) throw new Error("The nested reveal fixture is missing");
      const sheet = new CSSStyleSheet();
      sheet.replaceSync("#pane { block-size: 390px; }");
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
      element.graph = { nodes: element.graph.nodes.filter(({ id }) => id === "review" || (keepSuccessor && id === "publish")), connections: [] };
      element.layout = [{ nodeId: "review", x: 2000, y: 20 }, { nodeId: "publish", x: 321, y: 20 }];
      await element.updateComplete;
      await document.fonts.ready;
      pane.scrollTop = 4;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }, keepPublish);
    await reveal.evaluate((button: HTMLButtonElement) => { button.focus({ preventScroll: true }); });
    expect(await reveal.evaluate((button) => button.matches(":focus") && !button.matches(":disabled")), "Reveal is focused and enabled before the native request").toBe(true);
    await page.keyboard.press("Enter");
    expect(await reveal.evaluate((button) => button.matches(":focus") && !button.matches(":disabled")), "the focused Reveal stays enabled when the host withholds its viewport").toBe(true);
    const before = await controlledState(canvas);
    expect(before.scroll).toEqual([0, 4]);
    const recorded = await requests(page);
    expect(recorded, "the pending reveal has exactly one viewport proposal").toMatchObject([{ type: viewport, detail: { viewport: { scale: 1 } } }]);
    if (external) await externalButton.evaluate((button: HTMLButtonElement) => { button.focus({ preventScroll: true }); });

    const remaining = { nodes: before.graph.nodes.filter(({ id }) => keepPublish && id === "publish"), connections: [] };
    await canvas.evaluate(async (element: OcelleWorkflowCanvas, graph) => {
      element.graph = graph;
      await element.updateComplete;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }, remaining);
    const focusTarget = external ? externalButton : keepPublish ? reveal : picker;
    const [revealDisabled, pickerVisible, focused] = await Promise.all([
      reveal.isDisabled(),
      picker.isVisible(),
      focusTarget.evaluate((control) => control.matches(":focus")),
    ]);
    expect(revealDisabled).toBe(!keepPublish);
    expect(pickerVisible).toBe(true);
    expect(await controlledState(canvas)).toEqual({ ...before, graph: remaining });
    expect(await requests(page), "target removal emits no additional request").toEqual(recorded);
    expect(await finish()).toEqual(clean);
    expect(focused, `${destination} owns focus after the pending target is removed`).toBe(true);
  });

  it("traverses standalone nodes from the aggregate canvas and requests only the native destination selection", async () => {
    const { page, finish } = await mount(false, true);
    const canvas = page.locator("ocelle-workflow-canvas");
    const review = page.getByRole("button", { name: /^Initial review/ });
    await review.focus();
    expect(await focusedId(page)).toBe("review");
    const before = await controlledState(canvas);
    await page.keyboard.press("ArrowRight");
    const focused = await focusedId(page);
    expect(await requests(page), "mixed-bundle traversal emits no request").toEqual([]);
    await page.keyboard.press("Enter");
    const recorded = await requests(page);
    expect(await controlledState(canvas)).toEqual(before);
    expect(await finish()).toEqual(clean);
    expect(focused, "the trusted ArrowRight focuses the actual standalone Publish action").toBe("publish");
    expect(recorded, "native Enter requests the destination ID once with both bundles loaded").toEqual([{ type: selection, detail: { nodeId: "publish" } }]);
  });

  it("blocks a trusted selection click when a standalone node becomes clipped before its handler runs", async () => {
    const { page, finish } = await mount(true, true);
    const canvas = page.locator("ocelle-workflow-canvas");
    const publish = page.getByRole("button", { name: /^Publish/ });
    await publish.focus();
    expect(await focusedId(page)).toBe("publish");
    const before = await controlledState(canvas);
    await page.keyboard.press("Enter");
    const expected = [{ type: selection, detail: { nodeId: "publish" } }];
    expect(await requests(page), "the available standalone action emits one selection").toEqual(expected);

    await publish.evaluate((button) => {
      const node = (button.getRootNode() as ShadowRoot).host;
      const canvas = (node.getRootNode() as ShadowRoot).host as OcelleWorkflowCanvas;
      const pane = canvas.parentElement;
      const root = pane?.getRootNode();
      const face = node.parentElement;
      if (!(root instanceof ShadowRoot) || pane === null || face === null) throw new Error("The mixed-bundle clipping fixture is missing");
      const sheet = new CSSStyleSheet();
      sheet.replaceSync("#canvas.clipped { transform: translateX(350px); }");
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
      document.addEventListener("click", (event) => {
        canvas.classList.add("clipped");
        canvas.dataset.staleInput = JSON.stringify({
          trusted: event.isTrusted,
          clipped: button.getBoundingClientRect().right > pane.getBoundingClientRect().right,
          inert: face.inert,
        });
      }, { capture: true, once: true });
    });
    await page.keyboard.press("Enter");
    expect(JSON.parse(await canvas.getAttribute("data-stale-input") ?? "null") as unknown, "native Enter reaches the now-clipped action before inert is applied")
      .toEqual({ trusted: true, clipped: true, inert: false });
    await expect.poll(() => publish.count()).toBe(0);
    const focused = await focusedId(page);
    const recorded = await requests(page);
    expect(await controlledState(canvas)).toEqual(before);
    expect(await finish()).toEqual(clean);
    expect(recorded, "the mixed-bundle activation guard suppresses the stale selection").toEqual(expected);
    expect(focused, "focus recovers from the clipped standalone action to Review").toBe("review");
  });
});
