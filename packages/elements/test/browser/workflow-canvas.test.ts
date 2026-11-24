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

async function setUpPaintPane(canvas: Locator, clipped: boolean): Promise<void> {
  await canvas.evaluate(async (element: OcelleWorkflowCanvas, clipped) => {
    const pane = element.parentElement;
    if (pane === null) throw new Error("The paint containment fixture is missing its pane");
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      #pane { inline-size: 700px; block-size: 180px; overflow: visible; }
      #pane.paint-clipped { contain: paint; }
      #canvas { inline-size: 700px; block-size: 390px; }
    `);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    pane.classList.toggle("paint-clipped", clipped);
    element.layout = [
      { nodeId: "review", x: 35, y: 15 },
      { nodeId: "publish", x: 330, y: 220 },
      { nodeId: "revise", x: 1080, y: 20 },
    ];
    element.selectedNodeId = "review";
    await element.updateComplete;
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, clipped);
}

async function setUpClippingPane(canvas: Locator, mode: "inset" | "calculated" | "overflow" | "contents" | "ordinary", clipped = true): Promise<void> {
  await canvas.evaluate(async (element: OcelleWorkflowCanvas, { mode, clipped }) => {
    const pane = element.parentElement;
    const root = element.getRootNode();
    if (pane === null || !(root instanceof ShadowRoot)) throw new Error("The nested clipping fixture is missing its pane");
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      #pane { overflow: visible; block-size: 445px; }
      #pane.clipped { clip-path: inset(0 0 220px 0); }
      #pane.calculated { clip-path: inset(0 0 calc(50% - 2.5px) 0); }
      #pane.overflow { block-size: 250px; overflow: clip; }
      #pane.contents { display: contents; overflow: hidden; }
    `);
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    pane.classList.toggle("clipped", mode === "inset" && clipped);
    pane.classList.add(mode);
    element.layout = [
      { nodeId: "review", x: 24, y: 14 },
      { nodeId: "publish", x: 330, y: 236 },
      { nodeId: "revise", x: 1080, y: 20 },
    ];
    element.selectedNodeId = clipped ? "review" : "publish";
    await element.updateComplete;
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, { mode, clipped });
}

async function canvasActionNames(page: Page): Promise<string[]> {
  const session = await page.context().newCDPSession(page);
  try {
    const { nodes } = await session.send("Accessibility.getFullAXTree");
    return nodes.flatMap(({ ignored, role, name }) => {
      const label: unknown = name?.value;
      return !ignored && role?.value === "button" && typeof label === "string" && /^(Initial review|Publish)/.test(label) ? [label] : [];
    });
  } finally {
    await session.detach();
  }
}

async function observeClipping(action: Locator) {
  return action.evaluate(async (button) => {
    const node = (button.getRootNode() as ShadowRoot).host;
    const canvas = (node.getRootNode() as ShadowRoot).host;
    const pane = canvas.parentElement;
    if (pane === null) throw new Error("The nested clipping fixture is missing its pane");
    const intersectionRatio = await new Promise<number | undefined>((resolve) => {
      const observer = new IntersectionObserver(([entry]) => {
        observer.disconnect();
        resolve(entry?.intersectionRatio);
      });
      observer.observe(button);
    });
    const bounds = button.getBoundingClientRect();
    const paneBounds = pane.getBoundingClientRect();
    return {
      intersectionRatio,
      hasPaneBox: pane.getClientRects().length > 0,
      insidePaneBox: paneBounds.top < bounds.top && bounds.bottom < paneBounds.bottom,
    };
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

  it("excludes a paint-clipped action from native traversal and the accessibility tree", async () => {
    const { page, finish } = await mount();
    const canvas = page.locator("#canvas");
    await setUpPaintPane(canvas, true);
    const publish = canvas.locator("ocelle-workflow-node").nth(1).locator("button");
    const geometry = await publish.evaluate(async (button) => {
      const pane = document.getElementById("pane");
      if (pane === null) throw new Error("The paint containment fixture is missing its pane");
      const bounds = button.getBoundingClientRect();
      const intersectionRatio = await new Promise<number | undefined>((resolve) => {
        const observer = new IntersectionObserver(([entry]) => {
          observer.disconnect();
          resolve(entry?.intersectionRatio);
        });
        observer.observe(button);
      });
      return {
        belowPane: bounds.top > pane.getBoundingClientRect().bottom,
        intersectionRatio,
        overflow: getComputedStyle(pane).overflow,
      };
    });
    expect(geometry, "Chromium clips Publish even with visible overflow").toEqual({ belowPane: true, intersectionRatio: 0, overflow: "visible" });

    const review = page.getByRole("button", { name: /^Initial review/ });
    await review.focus();
    expect(await review.evaluate((button) => button.matches(":focus"))).toBe(true);
    await page.keyboard.press("ArrowRight");
    const traversed = await review.evaluate((button) => button.matches(":focus"));
    expect(await requests(page)).toEqual([]);
    await page.keyboard.press("Enter");
    const recorded = await requests(page);
    const accessibility = await canvas.ariaSnapshot();
    await publish.evaluate((button: HTMLButtonElement) => { button.focus({ preventScroll: true }); });
    const focused = await review.evaluate((button) => button.matches(":focus"));
    const afterFocus = { recorded: await requests(page), diagnostics: await finish() };
    expect(accessibility).toMatch(/button "Initial review/);
    expect({ traversed, recorded, publishInTree: accessibility.includes('button "Publish'), focused },
      "paint-clipped Publish is unavailable to native traversal, activation, accessibility and direct focus")
      .toEqual({ traversed: true, recorded: [{ type: selection, detail: { nodeId: "review" } }], publishInTree: false, focused: true });
    expect(afterFocus).toEqual({ recorded, diagnostics: clean });
  });

  it("guards a trusted native activation when paint containment clips the action during capture", async () => {
    const { page, finish } = await mount();
    const canvas = page.locator("#canvas");
    await setUpPaintPane(canvas, false);
    const publish = page.getByRole("button", { name: /^Publish/ });
    await publish.focus();
    expect(await publish.evaluate((button) => button.matches(":focus"))).toBe(true);
    const before = await controlledState(canvas);
    await page.keyboard.press("Enter");
    const expected = [{ type: selection, detail: { nodeId: "publish" } }];
    expect(await requests(page)).toEqual(expected);

    await publish.evaluate((button) => {
      const node = (button.getRootNode() as ShadowRoot).host;
      const canvas = (node.getRootNode() as ShadowRoot).host;
      const pane = canvas.parentElement;
      const face = node.parentElement;
      if (pane === null || face === null) throw new Error("The paint containment fixture is missing its action wrapper");
      document.addEventListener("click", (event) => {
        pane.classList.add("paint-clipped");
        canvas.setAttribute("data-paint-input", JSON.stringify({
          trusted: event.isTrusted,
          nativeTarget: event.composedPath().includes(button),
          clipped: button.getBoundingClientRect().top > pane.getBoundingClientRect().bottom,
          inert: face.inert,
        }));
      }, { capture: true, once: true });
    });
    await page.keyboard.press("Enter");
    expect(JSON.parse(await canvas.getAttribute("data-paint-input") ?? "null") as unknown,
      "paint containment clips the trusted click target before the canvas makes it inert")
      .toEqual({ trusted: true, nativeTarget: true, clipped: true, inert: false });
    const recorded = await requests(page);
    const focused = await page.getByRole("button", { name: /^Initial review/ }).evaluate((button) => button.matches(":focus"));
    expect(await controlledState(canvas)).toEqual(before);
    const afterActivation = { available: await publish.count(), diagnostics: await finish() };
    expect(recorded, "activating the newly paint-clipped action adds no selection request").toEqual(expected);
    expect(afterActivation).toEqual({ available: 0, diagnostics: clean });
    expect(focused, "the visible native Review action recovers focus").toBe(true);
  });

  it("proposes and accepts a named reveal through a paint-containing host pane", async () => {
    const { page, finish } = await mount();
    const canvas = page.locator("#canvas");
    await setUpPaintPane(canvas, true);
    const picker = page.getByRole("combobox", { name: /^Step/i });
    const reveal = page.getByRole("button", { name: /^Reveal\b/i });
    const publish = page.getByRole("button", { name: /^Publish/ });
    expect(await picker.getByRole("option", { name: /^Publish/ }).count(), "the clipped step remains available by name").toBe(1);
    expect(await requests(page)).toEqual([]);
    const before = await controlledState(canvas);
    await picker.selectOption("publish");
    expect(await requests(page)).toEqual([]);
    await reveal.focus();
    await page.keyboard.press("Enter");
    const recorded = await requests(page);
    const proposed = { x: -68, y: -199, scale: 1 };
    const proposal = { type: viewport, detail: { viewport: proposed } };
    expect({
      recorded,
      revealFocused: await reveal.evaluate((button) => button.matches(":focus")),
      publishActions: await publish.count(),
    }, "the hidden destination issues one proposal centered in the visible map and keeps focus on Reveal")
      .toEqual({ recorded: [proposal], revealFocused: true, publishActions: 0 });
    expect(await controlledState(canvas)).toEqual(before);

    await canvas.evaluate(async (element: OcelleWorkflowCanvas, accepted) => {
      element.viewport = accepted;
      await element.updateComplete;
    }, (recorded as [typeof proposal])[0].detail.viewport);
    await expect.poll(() => focusedId(page)).toBe("publish");
    expect(await publish.evaluate((button) => {
      const pane = document.getElementById("pane");
      if (pane === null) throw new Error("The paint containment fixture is missing its pane");
      const bounds = button.getBoundingClientRect();
      const clip = pane.getBoundingClientRect();
      return button.matches(":focus") && clip.left < bounds.left && bounds.right < clip.right
        && clip.top < bounds.top && bounds.bottom < clip.bottom;
    }), "acceptance exposes and focuses the actual native Publish action").toBe(true);
    expect(await controlledState(canvas)).toEqual({ ...before, viewport: proposed });
    expect(await requests(page), "acceptance sends no follow-up request").toEqual([proposal]);
    await page.keyboard.press("Enter");
    expect(await requests(page)).toEqual([proposal, { type: selection, detail: { nodeId: "publish" } }]);
    expect(await finish()).toEqual(clean);
  });

  it("excludes an inset-clipped action inside the pane box from native focus, selection and accessibility", async () => {
    const { page, finish } = await mount(true);
    const canvas = page.locator("#canvas");
    await setUpClippingPane(canvas, "inset");
    const nodes = canvas.locator("ocelle-workflow-node");
    const review = nodes.nth(0).locator("button");
    const publish = nodes.nth(1).locator("button");
    expect(await observeClipping(publish), "Chromium clips Publish inside the pane border box").toEqual({
      intersectionRatio: 0, hasPaneBox: true, insidePaneBox: true,
    });

    await page.getByRole("button", { name: /^Reveal / }).focus();
    await page.keyboard.press("Tab");
    expect(await focusedId(page)).toBe("review");
    await page.keyboard.press("ArrowRight");
    const afterArrow = await focusedId(page);
    const navigationRequests = await requests(page);
    await page.keyboard.press("Enter");
    const selectionRequests = await requests(page);
    const actionNames = await canvasActionNames(page);
    await review.focus();
    await publish.evaluate((button: HTMLButtonElement) => { button.focus({ preventScroll: true }); });
    expect({
      actionNames, afterArrow, navigationRequests, selectionRequests,
      afterDirectFocus: await focusedId(page),
      finalRequests: await requests(page),
      diagnostics: await finish(),
    }).toEqual({
      actionNames: ["Initial review"], afterArrow: "review", navigationRequests: [], selectionRequests: [{ type: selection, detail: { nodeId: "review" } }],
      afterDirectFocus: "review",
      finalRequests: [{ type: selection, detail: { nodeId: "review" } }], diagnostics: clean,
    });
  });

  it("guards a trusted native click when an inset clips the action during capture", async () => {
    const { page, finish } = await mount(true);
    const canvas = page.locator("#canvas");
    await setUpClippingPane(canvas, "inset", false);
    const publish = page.getByRole("button", { name: /^Publish/ });
    await page.getByRole("button", { name: /^Reveal / }).focus();
    await page.keyboard.press("Tab");
    expect(await focusedId(page)).toBe("publish");
    await page.keyboard.press("Enter");
    const expected = [{ type: selection, detail: { nodeId: "publish" } }];
    expect(await requests(page)).toEqual(expected);
    const before = await controlledState(canvas);
    await publish.evaluate(async (button) => {
      const node = (button.getRootNode() as ShadowRoot).host;
      const canvas = (node.getRootNode() as ShadowRoot).host;
      const root = button.getRootNode() as ShadowRoot;
      const pane = canvas.parentElement;
      const face = node.parentElement;
      if (pane === null || face === null) throw new Error("The inset fixture is missing its action wrapper");
      let lastObservedRatio: number | undefined;
      await new Promise<void>((resolve) => {
        const observer = new IntersectionObserver(([entry]) => {
          lastObservedRatio = entry?.intersectionRatio;
          resolve();
        });
        observer.observe(button);
        document.addEventListener("click", (event) => {
          const bounds = button.getBoundingClientRect();
          const x = (bounds.left + bounds.right) / 2;
          const y = (bounds.top + bounds.bottom) / 2;
          const hitBefore = root.elementFromPoint(x, y) === button;
          pane.classList.add("clipped");
          canvas.setAttribute("data-inset-input", JSON.stringify({
            trusted: event.isTrusted,
            nativeTarget: event.composedPath().includes(button),
            hitBefore,
            hitAfter: root.elementFromPoint(x, y) === button,
            lastObservedRatio,
            inert: face.inert,
          }));
          observer.disconnect();
        }, { capture: true, once: true });
      });
    });

    await page.keyboard.press("Enter");
    expect(JSON.parse(await canvas.getAttribute("data-inset-input") ?? "null") as unknown,
      "capture changes the native hit test before inert or a new observer result").toEqual({
      trusted: true, nativeTarget: true, hitBefore: true, hitAfter: false, lastObservedRatio: 1, inert: false,
    });
    expect(await controlledState(canvas)).toEqual(before);
    expect({
      recorded: await requests(page), focused: await focusedId(page), exposedActions: await publish.count(), diagnostics: await finish(),
    }, "the clipped click is suppressed and native focus returns to Review")
      .toEqual({ recorded: expected, focused: "review", exposedActions: 0, diagnostics: clean });
  });

  it.each([
    { mode: "inset", y: -192.5, insidePaneBox: true },
    { mode: "calculated", y: -192.5, insidePaneBox: true },
    { mode: "overflow", y: -180, insidePaneBox: false },
  ] as const)("keeps named Reveal focused until the host reveals the same native action through $mode clipping", async ({ mode, y, insidePaneBox }) => {
    const { page, finish } = await mount(true);
    const canvas = page.locator("#canvas");
    await setUpClippingPane(canvas, mode);
    const action = canvas.locator("ocelle-workflow-node").nth(1).locator("button");
    const nativeAction = await action.elementHandle();
    expect(await observeClipping(action)).toEqual({ intersectionRatio: 0, hasPaneBox: true, insidePaneBox });
    const picker = page.getByRole("combobox", { name: "Step" });
    const reveal = page.getByRole("button", { name: /^Reveal / });
    expect(await picker.getByRole("option", { name: "Publish" }).count()).toBe(1);
    await picker.selectOption("publish");
    await picker.focus();
    await page.keyboard.press("Tab");
    expect(await reveal.evaluate((button) => button.matches(":focus"))).toBe(true);
    expect(await requests(page)).toEqual([]);
    const before = await controlledState(canvas);
    await page.keyboard.press("Enter");

    const proposed = { x: -58, y, scale: 1 };
    const proposal = { type: viewport, detail: { viewport: proposed } };
    expect(await controlledState(canvas)).toEqual(before);
    expect({
      recorded: await requests(page),
      revealFocused: await reveal.evaluate((button) => button.matches(":focus")),
      actions: await page.getByRole("button", { name: /^Publish/ }).count(),
    }, "the withheld proposal keeps focus on visible Reveal").toEqual({
      recorded: [proposal], revealFocused: true, actions: 0,
    });

    const stillClipped = { ...before.viewport, y: 5 };
    await canvas.evaluate(async (element: OcelleWorkflowCanvas, accepted) => {
      element.viewport = accepted;
      await element.updateComplete;
    }, stillClipped);
    expect(await reveal.evaluate((button) => button.matches(":focus"))).toBe(true);
    expect(await requests(page)).toEqual([proposal]);
    await canvas.evaluate(async (element: OcelleWorkflowCanvas, accepted) => {
      element.viewport = accepted;
      await element.updateComplete;
    }, proposed);
    await expect.poll(() => focusedId(page)).toBe("publish");
    expect(await nativeAction.evaluate((button) => button.isConnected && button.matches(":focus")),
      "the host's accepted proposal focuses the original native action").toBe(true);
    expect(await observeClipping(action)).toEqual({ intersectionRatio: 1, hasPaneBox: true, insidePaneBox: true });
    expect(await controlledState(canvas)).toEqual({ ...before, viewport: proposed });
    expect(await requests(page)).toEqual([proposal]);
    await page.keyboard.press("Enter");
    expect(await requests(page)).toEqual([proposal, { type: selection, detail: { nodeId: "publish" } }]);
    expect(await finish()).toEqual(clean);
  });

  it.each([
    { mode: "ordinary", hasPaneBox: true },
    { mode: "contents", hasPaneBox: false },
  ] as const)("keeps the $mode pane's visible actions in the native Tab, accessibility and local reveal paths", async ({ mode, hasPaneBox }) => {
    const { page, finish } = await mount(true);
    const canvas = page.locator("#canvas");
    await setUpClippingPane(canvas, mode);
    const publish = canvas.locator("ocelle-workflow-node").nth(1).locator("button");
    expect(await observeClipping(publish)).toEqual({ intersectionRatio: 1, hasPaneBox, insidePaneBox: hasPaneBox });
    const actionNames = await canvasActionNames(page);
    const picker = page.getByRole("combobox", { name: "Step" });
    const reveal = page.getByRole("button", { name: /^Reveal / });
    const after = page.getByRole("button", { name: "After canvas" });

    await reveal.focus();
    await page.keyboard.press("Tab");
    const forwardEntry = await focusedId(page);
    await page.keyboard.press("Tab");
    const tabExits = await after.evaluate((button) => button.matches(":focus"));
    await after.focus();
    await page.keyboard.press("Shift+Tab");
    const backwardEntry = await focusedId(page);
    await page.keyboard.press("ArrowRight");
    const afterArrow = await focusedId(page);
    const navigationRequests = await requests(page);
    await page.keyboard.press("Enter");
    const recorded = await requests(page);

    await picker.selectOption("publish");
    await picker.focus();
    await page.keyboard.press("Tab");
    expect(await reveal.evaluate((button) => button.matches(":focus"))).toBe(true);
    const before = await controlledState(canvas);
    await page.keyboard.press("Enter");
    expect(await controlledState(canvas)).toEqual(before);
    const expected = [{ type: selection, detail: { nodeId: "publish" } }];
    expect({
      actionNames,
      forwardEntry, tabExits, backwardEntry, afterArrow, navigationRequests, recorded,
      revealed: await publish.evaluate((button) => button.matches(":focus")),
      finalRequests: await requests(page), diagnostics: await finish(),
    }).toEqual({
      actionNames: ["Initial review", "Publish"],
      forwardEntry: "review", tabExits: true, backwardEntry: "review", afterArrow: "publish", navigationRequests: [], recorded: expected,
      revealed: true, finalRequests: expected, diagnostics: clean,
    });
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
