import { afterEach, expect, it, vi } from "vitest";
import { commands, page } from "vitest/browser";
import "../src/ocelle-anchored-popover.ts";
import { inProcessDriver } from "./in-process.ts";

const driver = inProcessDriver();
const epsilon = 1;
const verticalCases = [
  { name: "below chooses the opposite side before a fitting adjacent side", preferred: "below", direction: "ltr", x: 214, y: 420, width: 640, height: 480, expected: "above" },
  { name: "above uses its preferred side near the bottom of the viewport", preferred: "above", direction: "ltr", x: 214, y: 400, width: 640, height: 480, expected: "above" },
  { name: "above uses below only if both adjacent sides are too narrow", preferred: "above", direction: "ltr", x: 118, y: 40, width: 280, height: 480, expected: "below" },
] as const;
const adjacentCases = [
  { name: "below chooses an adjacent side when both vertical extents are too small", preferred: "below", direction: "ltr", x: 240, y: 44, width: 640, height: 132, expected: "right" },
  { name: "above chooses LTR inline end before the ample below side", preferred: "above", direction: "ltr", x: 240, y: 40, width: 640, height: 480, expected: "right" },
  { name: "above chooses RTL inline end before the ample below side", preferred: "above", direction: "rtl", x: 240, y: 40, width: 640, height: 480, expected: "left" },
  { name: "above tries the other adjacent side when inline end does not fit", preferred: "above", direction: "ltr", x: 575, y: 40, width: 640, height: 480, expected: "left" },
] as const;

interface Position {
  readonly x?: number;
  readonly y?: number;
  readonly preferred?: "above" | "below";
  readonly direction?: "ltr" | "rtl";
  readonly width?: number;
  readonly height?: number;
}

function px(value: number): string {
  return String(value) + "px";
}

function required<T extends Element>(value: T | null, name: string): T {
  if (value === null) throw new Error("Missing placement fixture " + name);
  return value;
}

function settle(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { resolve(); });
    });
  });
}

async function fixture({
  x = 240,
  y = 110,
  preferred = "below",
  direction = "ltr",
  width = 640,
  height = 480,
}: Position = {}) {
  await page.viewport(width, height);
  await driver.mount(
    '<ocelle-anchored-popover id="placement" label="Appearance">' +
      '<span slot="trigger" aria-hidden="true">A</span>' +
      '<button type="button">Light</button><button type="button">Dark</button>' +
      '<button type="button">System</button><button type="button">Warm contrast</button>' +
      '<button type="button">Cool contrast</button><button type="button">Device default</button>' +
    '</ocelle-anchored-popover><button type="button" id="placement-outside">Outside action</button>',
  );
  await driver.rules(
    '#placement > button { display: block; inline-size: 160px; min-block-size: var(--ocelle-target-min); box-sizing: border-box; }',
  );
  const host = required(document.querySelector("ocelle-anchored-popover"), "host");
  host.placement = preferred;
  host.dir = direction;
  Object.assign(host.style, { position: "fixed", left: px(x), top: px(y) });
  const root = host.shadowRoot;
  if (root === null) throw new Error("Missing placement fixture shadow root");
  const trigger = required(root.querySelector<HTMLButtonElement>("button[part=trigger]"), "trigger");
  const panel = required(root.querySelector<HTMLElement>("[part=surface]"), "surface");
  const first = required(host.querySelector("button"), "first action");
  const outside = required(document.querySelector<HTMLButtonElement>("#placement-outside"), "outside action");
  await host.updateComplete;
  await settle();
  expect([window.innerWidth, window.innerHeight], "the actual fixture viewport is set").toEqual([width, height]);
  return { host, trigger, panel, first, outside };
}

type Fixture = Awaited<ReturnType<typeof fixture>>;

async function open({ trigger, panel }: Fixture): Promise<void> {
  trigger.focus({ preventScroll: true });
  await commands.press("Enter");
  await settle();
  expect(panel.matches(":popover-open"), "trusted Enter opens the real surface").toBe(true);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
}

function relation({ trigger, panel }: Fixture): "below" | "above" | "left" | "right" | "overlap" {
  const anchor = trigger.getBoundingClientRect();
  const surface = panel.getBoundingClientRect();
  if (surface.top >= anchor.bottom - epsilon) return "below";
  if (surface.bottom <= anchor.top + epsilon) return "above";
  if (surface.right <= anchor.left + epsilon) return "left";
  if (surface.left >= anchor.right - epsilon) return "right";
  return "overlap";
}

function gutterWidth(host: HTMLElement): number {
  const probe = document.createElement("span");
  Object.assign(probe.style, { display: "block", position: "absolute", inlineSize: "var(--ocelle-gutter)" });
  host.after(probe);
  const gutter = probe.getBoundingClientRect().width;
  probe.remove();
  return gutter;
}

function assertWithinViewport({ host, panel }: Fixture): void {
  const gutter = gutterWidth(host);
  expect(gutter, "the fixture resolves the viewport gutter token").toBeGreaterThan(0);
  const box = panel.getBoundingClientRect();
  expect(box.left, "the panel fits inside the left gutter").toBeGreaterThanOrEqual(gutter - epsilon);
  expect(box.top, "the panel fits inside the top gutter").toBeGreaterThanOrEqual(gutter - epsilon);
  expect(box.right, "the panel fits inside the right gutter").toBeLessThanOrEqual(innerWidth - gutter + epsilon);
  expect(box.bottom, "the panel fits inside the bottom gutter").toBeLessThanOrEqual(innerHeight - gutter + epsilon);
}

function assertLogicalStart({ host, trigger, panel }: Fixture): void {
  const gutter = gutterWidth(host);
  const anchor = trigger.getBoundingClientRect();
  const surface = panel.getBoundingClientRect();
  const requestedLeft = getComputedStyle(trigger).direction === "rtl" ? anchor.right - surface.width : anchor.left;
  const expectedLeft = Math.max(gutter, Math.min(requestedLeft, innerWidth - gutter - surface.width));
  expect(Math.abs(surface.left - expectedLeft), "logical inline start is clamped only as needed to fit the viewport").toBeLessThanOrEqual(epsilon);
}

afterEach(async () => {
  document.getElementById("placement")?.remove();
  document.getElementById("placement-outside")?.remove();
  await page.viewport(1280, 800);
});

it.each(verticalCases)("$name", async (layout) => {
  const mounted = await fixture(layout);
  await open(mounted);
  expect(relation(mounted), "the vertical side follows the placement priority and available extent").toBe(layout.expected);
  assertLogicalStart(mounted);
  assertWithinViewport(mounted);
});

it.each(adjacentCases)("$name", async (layout) => {
  const mounted = await fixture(layout);
  await open(mounted);
  expect(relation(mounted), "the adjacent side follows the available space and inline direction").toBe(layout.expected);
  assertWithinViewport(mounted);
});

it("keeps a usable preferred side when the content is taller than the space there", async () => {
  const mounted = await fixture({ y: 326 });
  await open(mounted);
  expect(relation(mounted), "usable space below wins despite more room above").toBe("below");
  expect(mounted.panel.scrollHeight, "excess content scrolls within the preferred side").toBeGreaterThan(mounted.panel.clientHeight);
  assertWithinViewport(mounted);
});

it.each(["ltr", "rtl"] as const)("aligns a vertical panel to the %s logical inline start", async (direction) => {
  const mounted = await fixture({ direction });
  await open(mounted);
  const anchor = mounted.trigger.getBoundingClientRect();
  const surface = mounted.panel.getBoundingClientRect();
  const startDelta = direction === "ltr" ? surface.left - anchor.left : surface.right - anchor.right;
  expect(Math.abs(startDelta), "the panel's inline-start edge follows the native trigger edge").toBeLessThanOrEqual(epsilon);
  expect(relation(mounted)).toBe("below");
  assertWithinViewport(mounted);
});

it("allows bounded anchor overlap when every side is unusable and restores the preferred side when room returns", async () => {
  const mounted = await fixture({ x: 118, y: 44, width: 280, height: 132 });
  await open(mounted);
  expect(relation(mounted), "the last-resort panel overlaps the anchor").toBe("overlap");
  assertWithinViewport(mounted);
  const chrome = getComputedStyle(mounted.panel);
  const chromeHeight = [chrome.paddingTop, chrome.paddingBottom, chrome.borderTopWidth, chrome.borderBottomWidth]
    .map((value) => Number.parseFloat(value))
    .reduce((sum, size) => sum + size, 0);
  expect(mounted.panel.getBoundingClientRect().height, "the fallback exposes a complete target plus panel chrome")
    .toBeGreaterThanOrEqual(mounted.first.getBoundingClientRect().height + chromeHeight - epsilon);
  expect(mounted.panel.scrollHeight).toBeGreaterThan(mounted.panel.clientHeight);
  await page.viewport(280, 480);
  await settle();
  expect(relation(mounted), "viewport growth re-evaluates the preferred side").toBe("below");
  assertLogicalStart(mounted);
  assertWithinViewport(mounted);
});

it("repositions with a moved same-size anchor and a resized viewport during one open lifetime", async () => {
  const mounted = await fixture({ x: 176, y: 88 });
  const { host, trigger, panel, first } = mounted;
  const toggles: string[] = [];
  panel.addEventListener("beforetoggle", (event) => { toggles.push(event.newState); });
  await open(mounted);
  await commands.press("Tab");
  expect(document.activeElement, "native Tab reaches the first projected action").toBe(first);
  const initialAnchor = trigger.getBoundingClientRect();
  const initialPanel = panel.getBoundingClientRect();

  Object.assign(host.style, { left: "auto", right: "220px", top: "128px" });
  await settle();
  const movedAnchor = trigger.getBoundingClientRect();
  const movedPanel = panel.getBoundingClientRect();
  expect([movedAnchor.width, movedAnchor.height], "movement preserves the trigger's size")
    .toEqual([initialAnchor.width, initialAnchor.height]);
  expect(movedAnchor.x - initialAnchor.x).toBeGreaterThan(100);
  expect(movedPanel.x - initialPanel.x, "the surface follows same-size horizontal movement").toBeCloseTo(movedAnchor.x - initialAnchor.x, 0);
  expect(movedPanel.y - initialPanel.y, "the surface follows same-size vertical movement").toBeCloseTo(movedAnchor.y - initialAnchor.y, 0);

  await page.viewport(820, 480);
  await settle();
  const resizedAnchor = trigger.getBoundingClientRect();
  const resizedPanel = panel.getBoundingClientRect();
  expect(resizedAnchor.x - movedAnchor.x, "the viewport resize moves the trailing anchor").toBeCloseTo(180, 0);
  expect(resizedPanel.x - movedPanel.x, "the surface tracks the viewport-induced movement").toBeCloseTo(resizedAnchor.x - movedAnchor.x, 0);
  expect(panel.matches(":popover-open")).toBe(true);
  expect(document.activeElement).toBe(first);
  expect(toggles, "movement leaves the original opening intact").toEqual(["open"]);
  assertWithinViewport(mounted);
});

it("closes when the viewport cannot fit a target and preserves outside focus", async () => {
  const mounted = await fixture({ x: 236, y: 8 });
  const { trigger, panel, outside } = mounted;
  await open(mounted);
  outside.focus({ preventScroll: true });
  await page.viewport(640, 54);
  await settle();
  expect(trigger.getClientRects(), "the anchor still has a rendered box").toHaveLength(1);
  expect(panel.matches(":popover-open"), "a viewport smaller than an operable target dismisses the surface").toBe(false);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(outside);
  await page.viewport(640, 480);
  await settle();
  expect(panel.matches(":popover-open"), "restoring room does not reopen it").toBe(false);
  await open(mounted);
  expect(relation(mounted)).toBe("below");
});

it.each(["hidden", "detached"] as const)("clears the old geometry after the anchor is %s and requires a fresh activation", async (exit) => {
  const mounted = await fixture({ x: 166, y: 94 });
  const { host, trigger, panel, outside } = mounted;
  await open(mounted);
  outside.focus({ preventScroll: true });
  if (exit === "hidden") host.hidden = true;
  else host.remove();
  await settle();
  expect(trigger.getClientRects(), "the anchor has lost its rendered box").toHaveLength(0);
  expect(panel.matches(":popover-open")).toBe(false);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(outside);

  host.style.left = "425px";
  host.style.top = "408px";
  host.hidden = false;
  if (!host.isConnected) outside.before(host);
  await settle();
  expect(trigger.getClientRects(), "the original trigger has regained its box").toHaveLength(1);
  expect(panel.matches(":popover-open"), "restoring the anchor does not reopen it").toBe(false);
  expect(document.activeElement).toBe(outside);
  await open(mounted);
  expect(relation(mounted), "a fresh activation places against the current anchor").toBe("above");
  const anchor = trigger.getBoundingClientRect();
  const surface = panel.getBoundingClientRect();
  expect(Math.abs(surface.left - anchor.left), "reopened geometry uses the moved anchor rather than the old position").toBeLessThanOrEqual(epsilon);
  assertWithinViewport(mounted);
});

type VisibleRectangle = Pick<VisualViewport, "offsetLeft" | "offsetTop" | "width" | "height">;

function setVisualViewportRectangle(rectangle: VisibleRectangle): () => void {
  const visual = window.visualViewport;
  if (visual === null) throw new Error("The placement fixture requires a VisualViewport");
  const properties = ["offsetLeft", "offsetTop", "width", "height"] as const;
  const originals = properties.map((key) => ({ key, descriptor: Object.getOwnPropertyDescriptor(visual, key) }));
  for (const key of properties) {
    Object.defineProperty(visual, key, { configurable: true, get: () => rectangle[key] });
  }
  return () => {
    for (const { key, descriptor } of originals) {
      if (descriptor === undefined) Reflect.deleteProperty(visual, key);
      else Object.defineProperty(visual, key, descriptor);
    }
  };
}

it.each(["width", "height"] as const)("fits one operable target exactly and closes when the visible %s loses one pixel", async (axis) => {
  const mounted = await fixture({ x: 234, y: 112 });
  const { host, trigger, panel, first, outside } = mounted;
  await driver.rules(`
    #placement::part(surface) {
      padding: 3px 7px 5px 11px;
      border-width: 2px 4px 6px 8px;
      scrollbar-width: none;
    }
    #placement > button { max-inline-size: 100%; }
    #placement > button:first-of-type {
      inline-size: var(--ocelle-target-min);
      block-size: var(--ocelle-target-min);
      padding-inline: 0;
    }
  `);
  await open(mounted);
  const target = first.getBoundingClientRect();
  const anchor = trigger.getBoundingClientRect();
  const style = getComputedStyle(panel);
  const borderLeft = Number.parseFloat(style.borderLeftWidth);
  const borderTop = Number.parseFloat(style.borderTopWidth);
  const chromeLeft = borderLeft + Number.parseFloat(style.paddingLeft);
  const chromeTop = borderTop + Number.parseFloat(style.paddingTop);
  const chromeRight = Number.parseFloat(style.borderRightWidth) + Number.parseFloat(style.paddingRight);
  const chromeBottom = Number.parseFloat(style.borderBottomWidth) + Number.parseFloat(style.paddingBottom);
  const gutter = gutterWidth(host);
  expect([target.width, target.height], "the first action is the size of one native minimum target").toEqual([anchor.width, anchor.height]);
  expect([chromeLeft, chromeTop, chromeRight, chromeBottom], "the asymmetric host chrome is applied").toEqual([19, 5, 11, 11]);
  expect(gutter, "the viewport has a real positive token gutter").toBeGreaterThan(0);
  const usableWidth = target.width + chromeLeft + chromeRight;
  const usableHeight = target.height + chromeTop + chromeBottom;
  const uncapped = panel.getBoundingClientRect();
  expect(uncapped.width, "later actions give the surface a larger natural width").toBeGreaterThan(usableWidth);
  expect(uncapped.height, "the surface has more than one action's content").toBeGreaterThan(usableHeight);
  const visible = { offsetLeft: 206, offsetTop: 86, width: usableWidth + 2 * gutter, height: usableHeight + 2 * gutter };
  const restore = setVisualViewportRectangle(visible);
  try {
    await settle();
    const fit = panel.getBoundingClientRect();
    expect(panel.matches(":popover-open"), "equality at both available dimensions is usable").toBe(true);
    expect([fit.left, fit.top, fit.width, fit.height], "the real rendered panel fills the narrow offset viewport inside its gutters")
      .toEqual([visible.offsetLeft + gutter, visible.offsetTop + gutter, usableWidth, usableHeight]);
    await commands.press("Tab");
    expect(document.activeElement, "the fitting native control is reachable by Tab").toBe(first);
    const action = first.getBoundingClientRect();
    expect([action.left, action.top, action.right, action.bottom], "the complete target fits inside all four edges of the host chrome")
      .toEqual([fit.left + chromeLeft, fit.top + chromeTop, fit.right - chromeRight, fit.bottom - chromeBottom]);

    outside.focus({ preventScroll: true });
    visible[axis] -= 1;
    await settle();
    expect(panel.matches(":popover-open"), "one CSS pixel less cannot expose an operable target").toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement, "the space-driven close preserves outside focus").toBe(outside);
  } finally {
    restore();
  }
});

it("retains the preferred vertical side when it can show exactly one target", async () => {
  const mounted = await fixture({ x: 180, y: 90 });
  const { host, trigger, panel } = mounted;
  await open(mounted);
  const roomyAnchor = trigger.getBoundingClientRect();
  const roomyPanel = panel.getBoundingClientRect();
  const style = getComputedStyle(panel);
  const boxChrome = [style.paddingTop, style.paddingBottom, style.borderTopWidth, style.borderBottomWidth]
    .map((value) => Number.parseFloat(value))
    .reduce((sum, value) => sum + value, 0);
  const minimum = roomyAnchor.height + boxChrome;
  const gap = roomyPanel.top - roomyAnchor.bottom;
  const bottom = document.documentElement.clientHeight - gutterWidth(host);
  expect(relation(mounted), "the roomy opening exposes the preferred side and its gap").toBe("below");
  expect(gap).toBeGreaterThan(0);

  host.style.top = px(bottom - minimum - gap - roomyAnchor.height);
  await settle();
  const anchor = trigger.getBoundingClientRect();
  const box = panel.getBoundingClientRect();
  expect(bottom - anchor.bottom - gap, "the preferred side has exactly the minimum block extent").toBe(minimum);
  expect(relation(mounted), "equality keeps the preferred side despite more space opposite it").toBe("below");
  expect([box.top, box.bottom, box.height]).toEqual([anchor.bottom + gap, bottom, minimum]);
  expect(panel.scrollHeight, "excess actions contribute scrollable content").toBeGreaterThan(panel.clientHeight);
});

it("uses the first adjacent side at its exact rendered width and flips after one pixel of loss", async () => {
  const mounted = await fixture({ preferred: "above", x: 120, y: 360 });
  const { host, trigger, panel } = mounted;
  await open(mounted);
  const roomyAnchor = trigger.getBoundingClientRect();
  const roomyPanel = panel.getBoundingClientRect();
  const gap = roomyAnchor.top - roomyPanel.bottom;
  const right = document.documentElement.clientWidth - gutterWidth(host);
  const exactLeft = right - roomyPanel.width - gap - roomyAnchor.width;
  expect(relation(mounted), "the roomy opening reveals the surface width and anchor gap").toBe("above");
  expect(gap).toBeGreaterThan(0);

  Object.assign(host.style, { left: px(exactLeft), top: "40px" });
  await settle();
  const anchor = trigger.getBoundingClientRect();
  const exact = panel.getBoundingClientRect();
  expect(right - anchor.right - gap, "available inline-end room equals the rendered preferred width").toBe(roomyPanel.width);
  expect(relation(mounted), "the LTR inline-end position fits at equality").toBe("right");
  expect([exact.left, exact.right, exact.width]).toEqual([anchor.right + gap, right, roomyPanel.width]);

  host.style.left = px(exactLeft + 1);
  await settle();
  expect(relation(mounted), "losing one pixel moves the surface to the fitting opposite adjacent side").toBe("left");
  expect(panel.getBoundingClientRect().right).toBe(trigger.getBoundingClientRect().left - gap);
});

function removeVisualViewport(): () => void {
  const descriptor = Object.getOwnPropertyDescriptor(window, "visualViewport");
  Object.defineProperty(window, "visualViewport", { configurable: true, value: null });
  return () => {
    if (descriptor === undefined) Reflect.deleteProperty(window, "visualViewport");
    else Object.defineProperty(window, "visualViewport", descriptor);
  };
}

const layoutBoundsCases = [
  { name: "clips both negative origins and both overshooting edges", rectangle: { offsetLeft: -23, offsetTop: -31, width: 330, height: 190 } },
  { name: "uses the layout bounds without VisualViewport", rectangle: null },
] as const;

it.each(layoutBoundsCases)("$name", async ({ rectangle }) => {
  const mounted = await fixture({ width: 240, height: 110, x: 100, y: 34 });
  const { host, panel } = mounted;
  await driver.rules("#placement > button { inline-size: 360px; }");
  const gutter = gutterWidth(host);
  const { clientWidth, clientHeight } = document.documentElement;
  const restore = rectangle === null ? removeVisualViewport() : setVisualViewportRectangle(rectangle);
  try {
    await open(mounted);
    const box = panel.getBoundingClientRect();
    expect(relation(mounted), "neither side can expose the wide, tall fixture, so it uses the visible fallback").toBe("overlap");
    expect([box.left, box.top, box.right, box.bottom], "the rendered caps respect the actual layout edges and token gutters")
      .toEqual([gutter, gutter, clientWidth - gutter, clientHeight - gutter]);
    expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight);
    expect(panel.scrollWidth).toBeGreaterThan(panel.clientWidth);
  } finally {
    restore();
  }
});

it("reuses one adopted placement sheet and writes only coordinates or caps that changed", async () => {
  const mounted = await fixture({ x: 170, y: 100 });
  const { host, panel } = mounted;
  const root = host.shadowRoot;
  if (root === null) throw new Error("Missing placed shadow root");
  const originalSheets = [...root.adoptedStyleSheets];
  await open(mounted);
  const adopted = root.adoptedStyleSheets.filter((sheet) => !originalSheets.includes(sheet));
  expect(adopted, "opening adds one sheet to the real shadow root").toHaveLength(1);
  const sheet = adopted[0];
  const rule = sheet?.cssRules.item(0);
  if (!(rule instanceof CSSStyleRule)) throw new Error("Missing native placement rule");
  const writes = vi.spyOn(rule.style, "setProperty");
  const properties = () => writes.mock.calls.map(([name]) => name).sort();
  try {
    await settle();
    expect(properties(), "stable animation frames produce no CSSOM writes").toEqual([]);

    const initial = panel.getBoundingClientRect();
    host.style.left = "200px";
    await settle();
    expect(panel.getBoundingClientRect().left - initial.left, "the surface moves with its anchor").toBe(30);
    expect(properties(), "an inline move changes only its inline coordinate").toEqual(["left"]);
    writes.mockClear();

    await page.viewport(670, 480);
    await settle();
    expect(properties(), "a wider viewport changes only the inline cap").toEqual(["max-width"]);
    writes.mockClear();

    host.style.top = "120px";
    await settle();
    expect(panel.getBoundingClientRect().top - initial.top, "the surface also follows block movement").toBe(20);
    expect(properties(), "block movement changes its cap and block coordinate").toEqual(["max-height", "top"]);
    writes.mockClear();

    host.close();
    await settle();
    expect(panel.matches(":popover-open")).toBe(false);
    expect(rule.style.cssText, "closing clears the original geometry rule").toBe("");
    expect(properties(), "closed frames make no placement writes").toEqual([]);
    await open(mounted);
    expect(root.adoptedStyleSheets).toHaveLength(originalSheets.length + 1);
    expect(root.adoptedStyleSheets.at(-1), "reopening reuses the same sheet instance").toBe(sheet);
  } finally {
    writes.mockRestore();
  }
});
