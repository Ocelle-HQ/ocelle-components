import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import type { Browser, Locator, Page } from "playwright";
import { afterAll, beforeAll, expect, inject, it } from "vitest";
import { parseIndex } from "../../../gates/lib/storybook-index.ts";
import { serve } from "../../../gates/lib/storybook-serve.ts";
import type { Server } from "../../../gates/lib/storybook-serve.ts";
import { axSubtree, readScrollWidth } from "../../../packages/elements/test/commands.ts";

const record = ["rec:workflow:", "K7M4", "VP2T", "R8CZ", "Q6HX", "J3N9", "FW5A", "Y2BK", "D8L6", "C4ER", "7N5Q", "9X2T", "H6ZK", "P3MA", "5VD"];
const digest = ["workflow-build-artifact:sha256:", "aB12", "cD34", "eF56", "Ab78", "Cd90", "Ef12", "aB34", "cD56", "eF78", "Ab90", "Cd12", "Ef34", "aB56", "cD78", "eF9"];
const preview = ["workflow-build-artifact:sha256:", "aB12", "…", "eF9"];
const variants = [
  { id: "elements-ocelle-copy-field--grouped-record-id", name: "Workflow record ID", copy: "Copy record ID", units: record, expanded: null },
  { id: "elements-ocelle-copy-field--compact-digest", name: "Build artifact digest", copy: "Copy digest", units: digest, expanded: false },
  { id: "elements-ocelle-copy-field--revealed-digest", name: "Build artifact digest", copy: "Copy digest", units: digest, expanded: true },
] as const;
const modes = [
  { theme: "light", forcedColors: "none", width: 320, scale: 1 },
  { theme: "dark", forcedColors: "none", width: 320, scale: 1 },
  { theme: "light", forcedColors: "active", width: 320, scale: 1 },
  { theme: "light", forcedColors: "none", width: 520, scale: 2 },
] as const;

const built = inject("storybook");
const storyIds = parseIndex(readFileSync(join(built.out, "index.json"), "utf8")).map(({ id }) => id);
let server: Server | undefined;
let browser: Browser | undefined;

beforeAll(async () => {
  if (!variants.some(({ id }) => storyIds.includes(id))) return;
  server = await serve(built.out);
  const executablePath = process.env.OCELLE_CHROMIUM_PATH;
  browser = await chromium.launch(executablePath === undefined || executablePath === "" ? {} : { executablePath });
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

function afterPaint(page: Page): Promise<void> {
  return page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 0)));
  }));
}

function fontSize(element: Locator): Promise<number> {
  return element.evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
}

function observeFocus(button: Locator) {
  return button.evaluate((control) => {
    const style = getComputedStyle(control);
    const outline = Number.parseFloat(style.outlineWidth);
    const outset = outline + Number.parseFloat(style.outlineOffset);
    const rect = control.getBoundingClientRect();
    const ring = { left: rect.left - outset, right: rect.right + outset, top: rect.top - outset, bottom: rect.bottom + outset };
    const parentOf = (element: Element): Element | null => {
      const root = element.getRootNode();
      return element.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
    };
    const clippedBy: string[] = [];
    for (let parent = parentOf(control); parent !== null; parent = parentOf(parent)) {
      const parentStyle = getComputedStyle(parent);
      const outer = parent.getBoundingClientRect();
      const left = outer.left + parent.clientLeft;
      const top = outer.top + parent.clientTop;
      const horizontal = ring.left < left - 0.5 || ring.right > left + parent.clientWidth + 0.5;
      const vertical = ring.top < top - 0.5 || ring.bottom > top + parent.clientHeight + 0.5;
      if ((parentStyle.overflowX !== "visible" && horizontal) || (parentStyle.overflowY !== "visible" && vertical)) clippedBy.push(parent.localName);
    }
    return {
      native: control instanceof HTMLButtonElement,
      focused: control.matches(":focus-visible"),
      outline: style.outlineStyle === "solid" && outline > 0 && !["transparent", "rgba(0, 0, 0, 0)"].includes(style.outlineColor),
      insideViewport: ring.left >= -0.5 && ring.right <= innerWidth + 0.5 && ring.top >= -0.5 && ring.bottom <= innerHeight + 0.5,
      clippedBy,
    };
  });
}

const visibleFocus = { native: true, focused: true, outline: true, insideViewport: true, clippedBy: [] };

function identifierLayout(value: Locator) {
  return value.evaluate((part) => {
    const root = part.getRootNode();
    if (!(root instanceof ShadowRoot)) throw new Error("the value is outside the built copy field's shadow root");
    const walker = document.createTreeWalker(part, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    const pieces: { text: string; rows: number[]; fits: boolean }[] = [];
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      const text = node.textContent?.trim() ?? "";
      const parent = node.parentElement;
      if (text === "" || parent === null) continue;
      range.selectNodeContents(node);
      const rects = [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);
      // The accessible-only full value has range geometry but cannot be hit through its clip.
      const painted = rects.some((rect) => {
        const hit = root.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        return hit !== null && parent.contains(hit);
      });
      if (painted) {
        const bounds = part.getBoundingClientRect();
        pieces.push({ text, rows: rects.map(({ top }) => Math.round(top)), fits: rects.every(({ left, right }) => left >= bounds.left - 0.5 && right <= bounds.right + 0.5) });
      }
    }
    return { pieces, fits: part.scrollWidth <= part.clientWidth };
  });
}

async function verifyPresentation(page: Page, field: Locator, variant: typeof variants[number], expanded: boolean | null): Promise<void> {
  const value = field.locator('[part~="value"]');
  const expected = expanded === false ? preview : variant.units;
  const { pieces, fits } = await identifierLayout(value);
  expect(pieces.map(({ text }) => text), "visible prefix and body groups match the current presentation").toEqual(expected);
  expect(pieces.filter((piece) => !piece.fits || piece.rows.length === 0 || new Set(piece.rows).size !== 1), "each unit stays intact within the field").toEqual([]);
  expect(new Set(pieces.flatMap(({ rows }) => rows)).size, "the example wraps onto more than one line").toBeGreaterThan(1);
  expect(fits, "the value part has no horizontal overflow").toBe(true);
  expect(await field.evaluate((node) => node.scrollWidth <= node.clientWidth), "the field has no horizontal overflow").toBe(true);
  expect(await readScrollWidth(page.mainFrame()), "the preview document fits its fixed viewport").toBeLessThanOrEqual(await page.evaluate(() => innerWidth));

  const session = await page.context().newCDPSession(page);
  const tree = await axSubtree(session, "copy-field-story-probe");
  await session.detach();
  const firstControl = tree.findIndex(({ role }) => role === "button");
  expect(firstControl).toBeGreaterThan(0);
  const identifier = tree.slice(0, firstControl).filter(({ role }) => role === "StaticText").map(({ name }) => name).join("");
  expect(identifier, "Chromium reads one complete identifier in order before the controls").toBe(variant.units.join(""));
  const buttons = expanded === null ? [variant.copy] : [expanded ? "Show less" : "Show full identifier", variant.copy];
  expect(tree.filter(({ role }) => role === "button").map(({ name }) => name)).toEqual(buttons);
  const disclosure = field.getByRole("button", { name: /^(Show full identifier|Show less)$/ });
  expect(await disclosure.count()).toBe(expanded === null ? 0 : 1);
  expect(await disclosure.evaluateAll((controls) => controls.map((control) => control.getAttribute("aria-expanded"))))
    .toEqual(expanded === null ? [] : [String(expanded)]);
}

function recordCopy(field: Locator) {
  return field.evaluateHandle((node) => {
    const requests: { detail: unknown; bubbles: boolean; composed: boolean }[] = [];
    const clicks: { trusted: boolean; expanded: string | null }[] = [];
    document.addEventListener("ocelle-copy-field-request", (event) => {
      requests.push({ detail: (event as CustomEvent<unknown>).detail, bubbles: event.bubbles, composed: event.composed });
    });
    node.addEventListener("click", (event) => {
      const control = event.composedPath().find((item): item is HTMLButtonElement => item instanceof HTMLButtonElement);
      if (control !== undefined) clicks.push({ trusted: event.isTrusted, expanded: control.getAttribute("aria-expanded") });
    }, { capture: true });
    return { requests, clicks };
  });
}

function addTabStop(page: Page): Promise<void> {
  return page.evaluate(() => {
    const after = document.createElement("button");
    after.type = "button";
    after.textContent = "After the copy field";
    document.getElementById("storybook-root")?.after(after);
  });
}

async function activateControls(page: Page, field: Locator, variant: typeof variants[number]): Promise<void> {
  const events = await recordCopy(field);
  const request = { detail: { text: ` ${variant.units.join("")} ` }, bubbles: true, composed: true };
  const expectedRequests: typeof request[] = [];
  const expectedClicks: { trusted: boolean; expanded: string | null }[] = [];
  const copy = field.getByRole("button", { name: variant.copy, exact: true });
  const disclosure = field.getByRole("button", { name: /^(Show full identifier|Show less)$/ });
  await addTabStop(page);
  await page.keyboard.press("Tab");

  const states = variant.expanded === null ? [null] : [variant.expanded, !variant.expanded];
  for (const [index, expanded] of states.entries()) {
    if (expanded !== null) {
      expect(await observeFocus(disclosure), "native Tab reaches the visible disclosure focus ring").toEqual(visibleFocus);
      const target = await disclosure.elementHandle();
      await page.keyboard.press(index === 0 ? "Enter" : "Space");
      expectedClicks.push({ trusted: true, expanded: String(expanded) });
      await afterPaint(page);
      await verifyPresentation(page, field, variant, !expanded);
      expect(await disclosure.evaluate((node, original) => node === original, target)).toBe(true);
      expect(await observeFocus(disclosure), "activating the disclosure leaves it visibly focused").toEqual(visibleFocus);
      expect(await events.jsonValue(), "a trusted disclosure click leaves the Copy requests unchanged").toEqual({ requests: expectedRequests, clicks: expectedClicks });
      await page.keyboard.press("Tab");
    }

    expect(await observeFocus(copy), "native Tab reaches the visible Copy focus ring").toEqual(visibleFocus);
    await page.keyboard.press(index === 0 ? "Space" : "Enter");
    expectedRequests.push(request);
    expectedClicks.push({ trusted: true, expanded: null });
    await expect.poll(() => events.jsonValue(), { timeout: 5_000 }).toEqual({ requests: expectedRequests, clicks: expectedClicks });
    expect(await observeFocus(copy), "Copy leaves the native control visibly focused").toEqual(visibleFocus);
    if (index + 1 < states.length) await page.keyboard.press("Shift+Tab");
  }

  await page.keyboard.press("Tab");
  expect(await page.getByRole("button", { name: "After the copy field", exact: true }).evaluate((node) => node.matches(":focus"))).toBe(true);
  await afterPaint(page);
  expect(await events.jsonValue(), "each trusted Copy activation issues one complete raw request").toEqual({ requests: expectedRequests, clicks: expectedClicks });
}

async function exercise(variant: typeof variants[number], mode: typeof modes[number]): Promise<void> {
  if (browser === undefined || server === undefined) throw new Error("the built Storybook server did not start");
  const { origin } = server;
  const page = await browser.newPage({ viewport: { width: mode.width, height: 900 }, forcedColors: mode.forcedColors });
  page.setDefaultTimeout(8_000);
  try {
    const outside: string[] = [];
    const errors: string[] = [];
    page.on("request", (request) => {
      const address = request.url();
      if (new URL(address).origin !== origin) outside.push(address);
    });
    page.on("pageerror", (error) => errors.push(error.message));
    const query = new URLSearchParams({ id: variant.id, viewMode: "story", globals: `theme:${mode.theme}` });
    const response = await page.goto(`${origin}/iframe.html?${query}`, { waitUntil: "load" });
    expect(response?.status(), "the built Storybook preview loaded").toBe(200);
    const canvas = page.locator("#storybook-root");
    const field = canvas.getByRole("group", { name: variant.name, exact: true });
    await field.waitFor({ state: "visible" });
    await field.evaluate(async (node) => {
      node.id = "copy-field-story-probe";
      await (node as HTMLElementTagNameMap["ocelle-copy-field"]).updateComplete;
      await document.fonts.ready;
    });
    const value = field.locator('[part~="value"]');
    const disclosure = field.getByRole("button", { name: /^(Show full identifier|Show less)$/ });
    const sizesBefore = [await fontSize(value), ...await disclosure.evaluateAll((buttons) => buttons.map((button) => Number.parseFloat(getComputedStyle(button).fontSize)))];
    await page.evaluate((scale) => {
      const root = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(`html { font-size: ${String(root * scale)}px !important; }`);
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    }, mode.scale);
    await afterPaint(page);
    expect(await page.evaluate(() => ({ width: innerWidth, theme: document.documentElement.dataset.theme, forced: matchMedia("(forced-colors: active)").matches })))
      .toEqual({ width: mode.width, theme: mode.theme, forced: mode.forcedColors === "active" });
    const sizesAfter = [await fontSize(value), ...await disclosure.evaluateAll((buttons) => buttons.map((button) => Number.parseFloat(getComputedStyle(button).fontSize)))];
    expect(sizesAfter, "the identifier and its applicable disclosure use the requested computed text scale").toEqual(sizesBefore.map((size) => size * mode.scale));
    expect(sizesAfter).toHaveLength(variant.expanded === null ? 1 : 2);

    await verifyPresentation(page, field, variant, variant.expanded);
    await activateControls(page, field, variant);
    const inline = await canvas.evaluate((root) => [...root.querySelectorAll("*")].flatMap((node) => [
      ...(node.matches("script, style") ? [node.localName] : []),
      ...node.getAttributeNames().filter((name) => name === "style" || name.startsWith("on")),
    ]));
    expect(inline, "story markup has no inline script or style").toEqual([]);
    expect(outside, "all preview requests stay on the Storybook origin").toEqual([]);
    expect(errors, "the built story and its play function complete without errors").toEqual([]);
  } finally {
    await page.close();
  }
}

it.each(variants)("exercises $id in the built Storybook", async (variant) => {
  expect(storyIds, `built Storybook index is missing ${variant.id}`).toContain(variant.id);
  expect(built.build, "the Storybook build uses no external network").toEqual([]);
  for (const mode of modes) await exercise(variant, mode);
}, 120_000);
