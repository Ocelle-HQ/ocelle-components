import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import type { Browser, Locator, Page } from "playwright";
import { expect, inject, it } from "vitest";
import { parseIndex } from "../../../gates/lib/storybook-index.ts";
import { serve } from "../../../gates/lib/storybook-serve.ts";

const storyId = "workflow-studio-authoring--journey";
const reviewId = "security-review-1";
const narrowWidth = 320;
const built = inject("storybook");

async function withAuthoring(
  options: Parameters<Browser["newPage"]>[0],
  run: (page: Page, fixture: Locator) => Promise<void>,
): Promise<void> {
  const ids = parseIndex(readFileSync(join(built.out, "index.json"), "utf8")).map(({ id }) => id);
  expect(ids, "built Storybook index contains the exact Workflow Studio authoring journey ID").toContain(storyId);
  const server = await serve(built.out);
  let browser: Browser | undefined;
  try {
    const executablePath = process.env.OCELLE_CHROMIUM_PATH;
    browser = await chromium.launch(executablePath ? { executablePath } : {});
    const page = await browser.newPage(options);
    const outside: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== server.origin) outside.push(request.url());
    });
    const query = new URLSearchParams({ id: storyId, viewMode: "story", globals: "theme:light" });
    await page.goto(`${server.origin}/iframe.html?${query}`, { waitUntil: "load" });
    const fixture = page.locator('article[data-story="workflow-studio-authoring"]');
    await fixture.waitFor({ state: "visible" });
    await run(page, fixture);
    const inlineMarkup = await fixture.evaluate((root) => [root, ...root.querySelectorAll("*")].flatMap((node) => [
      ...(node.matches("script, style") ? [node.localName] : []),
      ...node.getAttributeNames().filter((name) => name === "style" || name.startsWith("on")),
      ...["href", "src", "action", "formaction"].filter((name) => /^\s*javascript:/i.test(node.getAttribute(name) ?? "")),
    ]));
    expect(inlineMarkup).toEqual([]);
    expect(outside).toEqual([]);
  } finally {
    try {
      await browser?.close();
    } finally {
      await server.close();
    }
  }
}

const paletteEntry = (fixture: Locator) => fixture
  .locator("[data-workflow-palette]").getByRole("button", { name: "Add Security review", exact: true });
const stepSelector = (fixture: Locator) => fixture
  .locator("[data-step-selector]").getByRole("combobox", { name: "Select workflow step", exact: true });
const selectReview = (fixture: Locator) => fixture
  .locator(`[data-select-step="${reviewId}"]`).getByRole("button", { name: "Select Security review", exact: true });
const finding = (fixture: Locator) => fixture
  .locator("[data-finding]").getByRole("button", { name: "Missing reviewer for Security review", exact: true });

function graphState(fixture: Locator): Promise<{ count: number; selected: string | null }> {
  return fixture.locator("ocelle-workflow-canvas[data-workflow-canvas]").evaluate((element, id) => {
    const canvas = element as HTMLElementTagNameMap["ocelle-workflow-canvas"];
    return { count: canvas.graph.nodes.filter((node) => node.id === id).length, selected: canvas.selectedNodeId };
  }, reviewId);
}

function hasDeepFocus(target: Locator): Promise<boolean> {
  return target.evaluate((element) => {
    let active = element.ownerDocument.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active === element;
  });
}

async function tabTo(page: Page, target: Locator): Promise<void> {
  await target.waitFor({ state: "visible" });
  for (let remaining = 36; remaining > 0; remaining--) {
    if (await hasDeepFocus(target) && await target.evaluate((element) => element.matches(":focus-visible"))) return;
    await page.keyboard.press("Tab");
  }
  expect(await hasDeepFocus(target), "the named control is in the keyboard tab order").toBe(true);
  expect(await target.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
}

async function expectUnclippedTarget(target: Locator): Promise<void> {
  const result = await target.evaluate((control) => {
    const style = getComputedStyle(control);
    const probe = document.createElement("span");
    probe.style.position = "fixed";
    probe.style.visibility = "hidden";
    probe.style.inlineSize = style.getPropertyValue("--ocelle-target-min");
    document.body.append(probe);
    const minimum = probe.getBoundingClientRect().width;
    probe.remove();

    const bounds = control.getBoundingClientRect();
    const outlineWidth = Number.parseFloat(style.outlineWidth);
    const outset = Math.max(0, outlineWidth + Number.parseFloat(style.outlineOffset));
    const ring = { left: bounds.left - outset, right: bounds.right + outset, top: bounds.top - outset, bottom: bounds.bottom + outset };
    const epsilon = 0.5;
    const clippedBy: string[] = [];
    const parentOf = (element: Element): Element | null => {
      const parent = element.assignedSlot ?? element.parentElement;
      if (parent !== null) return parent;
      const root = element.getRootNode();
      return root instanceof ShadowRoot ? root.host : null;
    };
    for (let parent = parentOf(control); parent !== null; parent = parentOf(parent)) {
      const parentStyle = getComputedStyle(parent);
      const outer = parent.getBoundingClientRect();
      const left = outer.left + parent.clientLeft;
      const top = outer.top + parent.clientTop;
      const horizontal = ring.left < left - epsilon || ring.right > left + parent.clientWidth + epsilon;
      const vertical = ring.top < top - epsilon || ring.bottom > top + parent.clientHeight + epsilon;
      if ((parentStyle.overflowX !== "visible" && horizontal) || (parentStyle.overflowY !== "visible" && vertical)) {
        clippedBy.push(parent.localName);
      }
    }
    return {
      minimum,
      width: bounds.width + epsilon,
      height: bounds.height + epsilon,
      focusVisible: control.matches(":focus-visible"),
      visibleRing: ["solid", "dashed"].includes(style.outlineStyle) && outlineWidth > 0
        && !["transparent", "rgba(0, 0, 0, 0)"].includes(style.outlineColor),
      insideViewport: ring.left >= -epsilon && ring.right <= innerWidth + epsilon
        && ring.top >= -epsilon && ring.bottom <= innerHeight + epsilon,
      clippedBy,
    };
  });
  expect(result.minimum, "--ocelle-target-min resolves to a positive size").toBeGreaterThan(0);
  expect(result.width, "native target width").toBeGreaterThanOrEqual(result.minimum);
  expect(result.height, "native target height").toBeGreaterThanOrEqual(result.minimum);
  expect(result).toMatchObject({ focusVisible: true, visibleRing: true, insideViewport: true, clippedBy: [] });
}

it("routes the authoring keyboard journey and returns focus after its finding is hidden in a narrow container", async () => {
  const viewportWidth = 1_440;
  await withAuthoring({ viewport: { width: viewportWidth, height: 900 }, reducedMotion: "reduce" }, async (page, fixture) => {
    const entry = paletteEntry(fixture);
    await entry.waitFor({ state: "visible" });
    expect((await graphState(fixture)).count).toBe(0);
    await tabTo(page, entry);
    await page.keyboard.press("Enter");
    await expect.poll(async () => (await graphState(fixture)).count).toBe(1);

    await tabTo(page, selectReview(fixture));
    await page.keyboard.press("Enter");
    await expect.poll(() => graphState(fixture)).toEqual({ count: 1, selected: reviewId });
    await fixture.locator("[data-reviewer-status]").waitFor({ state: "visible" });
    expect(await fixture.locator("[data-reviewer-status]").textContent()).toBe("Reviewer unassigned");

    // Resize the story boundary with the browser viewport held wide.
    await page.locator("#storybook-root").evaluate((root, width) => { root.style.inlineSize = `${String(width)}px`; }, narrowWidth);
    await expect.poll(() => fixture.evaluate((root) => ({
      viewport: innerWidth,
      width: Math.round(root.getBoundingClientRect().width),
    }))).toEqual({ viewport: viewportWidth, width: narrowWidth });

    const layout = fixture.locator("ocelle-list-detail");
    await expect.poll(() => layout.evaluate((element) => (element as HTMLElementTagNameMap["ocelle-list-detail"]).narrow)).toBe(true);
    const opener = finding(fixture);
    await tabTo(page, opener);
    const openerNode = await opener.evaluateHandle((element) => element);
    await page.keyboard.press("Enter");
    const drawer = fixture.getByRole("dialog", { name: "Reviewer inspector", exact: true });
    await drawer.waitFor({ state: "visible" });
    const reviewer = drawer.getByRole("combobox", { name: "Accountable reviewer", exact: true });
    await expect.poll(() => hasDeepFocus(reviewer)).toBe(true);
    expect(await reviewer.inputValue()).toBe("");
    expect(await graphState(fixture)).toEqual({ count: 1, selected: reviewId });

    const closeReasons = await fixture.locator("ocelle-drawer[data-workflow-drawer]").evaluateHandle((element) => {
      const reasons: string[] = [];
      element.addEventListener("ocelle-drawer-close", (event) => {
        reasons.push((event as CustomEvent<{ reason: string }>).detail.reason);
      });
      return reasons;
    });
    // Keep the opener in the composed tree while the public pane API hides its detail pane.
    await layout.evaluate((element) => { (element as HTMLElementTagNameMap["ocelle-list-detail"]).detailOpen = false; });
    await expect.poll(() => openerNode.evaluate((element) => ({
      connected: element.isConnected,
      rendered: element.getClientRects().length > 0,
    }))).toEqual({ connected: true, rendered: false });
    expect(await drawer.isVisible()).toBe(true);
    await page.keyboard.press("Escape");
    await drawer.waitFor({ state: "hidden" });
    await expect.poll(() => closeReasons.jsonValue()).toEqual(["escape"]);
    const fallback = stepSelector(fixture);
    await fallback.waitFor({ state: "visible" });
    await expect.poll(() => hasDeepFocus(fallback)).toBe(true);
  });
}, 60_000);

for (const forcedColors of ["none", "active"] as const) {
  it(`reaches narrow authoring controls by keyboard and real tap (${forcedColors} forced colours)`, async () => {
    await withAuthoring({ viewport: { width: narrowWidth, height: 900 }, hasTouch: true, forcedColors, reducedMotion: "reduce" }, async (page, fixture) => {
      const add = fixture.locator("[data-add-step]").getByRole("button", { name: "Add step", exact: true });
      await tabTo(page, add);
      await expectUnclippedTarget(add);
      const initial = await graphState(fixture);
      expect(initial.count).toBe(0);
      await add.tap();
      const entry = paletteEntry(fixture);
      await entry.waitFor({ state: "visible" });
      const pointers = await entry.evaluateHandle((element) => {
        const deliveries: { pointerType: string; isTrusted: boolean }[] = [];
        element.addEventListener("pointerdown", (event) => {
          const pointer = event as PointerEvent;
          deliveries.push({ pointerType: pointer.pointerType, isTrusted: pointer.isTrusted });
        });
        return deliveries;
      });
      await entry.tap();
      expect(await pointers.jsonValue()).toEqual([{ pointerType: "touch", isTrusted: true }]);
      await expect.poll(async () => (await graphState(fixture)).count).toBe(1);
      await selectReview(fixture).tap();
      await expect.poll(() => graphState(fixture)).toEqual({ count: 1, selected: reviewId });

      const opener = finding(fixture);
      await tabTo(page, opener);
      await expectUnclippedTarget(opener);
      await page.keyboard.press("Enter");
      const drawer = fixture.getByRole("dialog", { name: "Reviewer inspector", exact: true });
      await drawer.waitFor({ state: "visible" });
      const reviewer = drawer.getByRole("combobox", { name: "Accountable reviewer", exact: true });
      await expect.poll(() => hasDeepFocus(reviewer)).toBe(true);
      await page.keyboard.press("Escape");
      await drawer.waitFor({ state: "hidden" });
      await expect.poll(() => hasDeepFocus(opener)).toBe(true);

      const remove = fixture.locator(`[data-remove-step="${reviewId}"]`)
        .getByRole("button", { name: "Remove Security review", exact: true });
      await tabTo(page, remove);
      await expectUnclippedTarget(remove);
      await remove.tap();
      await expect.poll(async () => (await graphState(fixture)).count).toBe(0);
      const successor = fixture.locator('[data-select-step="publish-decision"]')
        .getByRole("button", { name: "Select Publish decision", exact: true });
      await expect.poll(() => hasDeepFocus(successor)).toBe(true);
    });
  }, 60_000);
}
