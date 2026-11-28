import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Browser, Locator, Page } from "playwright";
import { afterAll, beforeAll, expect, inject, it } from "vitest";
import { contrastRatio } from "../../../../gates/lib/wcag.ts";
import { axStateOf } from "../commands.ts";
import { anchoredPopoverBundle } from "./global-setup.ts";
import { clean, launch, policy, serve, visit } from "./serve.ts";
import type { Recorded, Served, Visit } from "./serve.ts";

const fixture = inject("elementsFixture");
const filename = "anchored-popover.html";
const triggerSelector = "button[part=trigger]";
const surfaceSelector = "[part=surface]";
let browser: Browser | undefined;
let server: Served | undefined;

beforeAll(async () => {
  if ("problem" in fixture) throw new Error(fixture.problem);
  if (!existsSync(join(fixture.dir, anchoredPopoverBundle))) return;
  server = await serve(fixture);
  browser = await launch();
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

const trigger = (page: Page, name: string): Locator => page.locator(`#${name}`).locator(triggerSelector);
const surface = (page: Page, name: string): Locator => page.locator(`#${name}`).locator(surfaceSelector);

function openState(page: Page, name: string): Promise<boolean> {
  return surface(page, name).evaluate((element) => element.matches(":popover-open"));
}

function focused(control: Locator): Promise<boolean> {
  return control.evaluate((element) => {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement != null) active = active.shadowRoot.activeElement;
    return element === active;
  });
}

async function disclosureState(page: Page, host: string) {
  const session = await page.context().newCDPSession(page);
  try {
    const { name, role, expanded } = await axStateOf(session, host, triggerSelector);
    return { name, role, expanded };
  } finally {
    await session.detach();
  }
}

type Activation = "Enter" | "Space" | "click";
type Theme = "light" | "dark";

async function open(host: string, activation: Activation, theme: Theme = "light", forced = false): Promise<Visit | undefined> {
  // The original phase base lacks the entry. This follows the same assertion path as a present but inert scaffold.
  if (browser === undefined || server === undefined) return undefined;

  const response = await fetch(`${server.origin}/${filename}`);
  if (response.status !== 200 || response.headers.get("content-security-policy") !== policy) {
    throw new Error("the packaged popover fixture did not serve the strict CSP header");
  }
  const seen = await visit(browser, server.origin, filename, ["anchored-popover.js"]);
  const { page } = seen;
  await page.emulateMedia({ colorScheme: theme, forcedColors: forced ? "active" : "none" });
  await page.locator("html").evaluate((root, selected) => { root.setAttribute("data-theme", selected); }, theme);
  const button = trigger(page, host);
  if (activation === "click") await button.click();
  else {
    await page.locator("#before").focus();
    if (host === "appearance") await page.keyboard.press("Tab");
    else await button.focus();
    await page.keyboard.press(activation);
  }
  // Check the product result after the rendering turn. The inert scaffold has the same selectors but stays closed.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => { resolve(undefined); })));
  return seen;
}

async function statesAfterTab(page: Page): Promise<readonly boolean[]> {
  await page.keyboard.press("Tab");
  const first = await focused(page.locator("#first"));
  await page.keyboard.press("Tab");
  const last = await focused(page.locator("#last"));
  await page.keyboard.press("Shift+Tab");
  const reverse = await focused(page.locator("#first"));
  await page.keyboard.press("Shift+Tab");
  const backToTrigger = await focused(trigger(page, "appearance"));
  return [first, last, reverse, backToTrigger];
}

it.each([
  ["appearance", "Appearance menu", "Enter"],
  ["appearance", "Appearance menu", "Space"],
  ["profile", "Profile menu", "click"],
] as const)("opens the %s popover whose button is named %s using %s under strict CSP", async (host, label, activation) => {
  const seen = await open(host, activation);
  let recorded: Recorded | undefined;
  try {
    expect(seen === undefined ? false : await openState(seen.page, host), "the packaged native invoker opens the popover").toBe(true);
    if (seen === undefined) throw new Error("the packaged popover is unavailable");
    const { page } = seen;
    expect(await disclosureState(page, host)).toEqual({ name: label, role: "button", expanded: true });
    expect(await focused(trigger(page, host))).toBe(true);
    await page.keyboard.press("Escape");
    expect(await openState(page, host)).toBe(false);
    expect(await disclosureState(page, host)).toEqual({ name: label, role: "button", expanded: false });
    expect(await focused(trigger(page, host))).toBe(true);
  } finally {
    recorded = await seen?.finish();
  }
  expect(recorded).toEqual(clean);
}, 25_000);

it("uses forward and reverse native Tab order, then preserves the focused outside pointer action", async () => {
  const seen = await open("appearance", "Enter");
  let recorded: Recorded | undefined;
  try {
    expect(seen === undefined ? false : await openState(seen.page, "appearance"), "the packaged panel opens for native navigation").toBe(true);
    if (seen === undefined) throw new Error("the packaged popover is unavailable");
    const { page } = seen;
    expect(await statesAfterTab(page)).toEqual([true, true, true, true]);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    expect(await focused(page.locator("#after"))).toBe(true);
    expect(await openState(page, "appearance")).toBe(false);
    await trigger(page, "appearance").focus();
    await page.keyboard.press("Enter");
    expect(await openState(page, "appearance")).toBe(true);
    const outside = page.getByRole("button", { name: "Outside action", exact: true });
    await outside.click();
    expect(await outside.getAttribute("data-activations")).toBe("1");
    expect(await focused(outside)).toBe(true);
    expect(await openState(page, "appearance")).toBe(false);
    expect(await disclosureState(page, "appearance")).toEqual({ name: "Appearance menu", role: "button", expanded: false });
  } finally {
    recorded = await seen?.finish();
  }
  expect(recorded).toEqual(clean);
}, 25_000);

function paint(control: Locator) {
  return control.evaluate((element) => {
    const style = getComputedStyle(element);
    const { width, height } = element.getBoundingClientRect();
    return {
      width,
      height,
      inlineSize: style.inlineSize,
      foreground: style.color,
      ground: style.backgroundColor,
      border: style.borderTopColor,
      outline: style.outlineColor,
      outlineWidth: Number.parseFloat(style.outlineWidth),
      outlineStyle: style.outlineStyle,
    };
  });
}

function hex(rgb: string): string {
  const channels = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(rgb)?.slice(1);
  if (channels === undefined) throw new Error(`expected an opaque computed RGB color, saw ${rgb}`);
  return `#${channels.map((channel) => Number(channel).toString(16).padStart(2, "0")).join("")}`;
}

it.each(["light", "dark"] as const)("uses the checked chrome and sheet token pairs in %s", async (theme) => {
  const seen = await open("appearance", "Enter", theme);
  let recorded: Recorded | undefined;
  try {
    expect(seen === undefined ? false : await openState(seen.page, "appearance"), "the packaged panel opens for token measurements").toBe(true);
    if (seen === undefined) throw new Error("the packaged popover is unavailable");
    const { page } = seen;
    const button = await paint(trigger(page, "appearance"));
    const panel = await paint(surface(page, "appearance"));
    const chrome = await paint(page.locator("#appearance-probe"));
    const sheet = await paint(page.locator("#panel-probe"));
    const ground = button.ground === "rgba(0, 0, 0, 0)" ? await page.locator("#chrome").evaluate((element) => getComputedStyle(element).backgroundColor) : button.ground;
    expect(Number.parseFloat(chrome.inlineSize)).toBeGreaterThan(0);
    expect(Math.min(button.width, button.height)).toBeGreaterThanOrEqual(Number.parseFloat(chrome.inlineSize));
    expect([button.foreground, ground, button.border, button.outline, button.outlineWidth]).toEqual([
      chrome.foreground, chrome.ground, chrome.border, chrome.outline, chrome.outlineWidth,
    ]);
    expect([panel.foreground, panel.ground, panel.border]).toEqual([sheet.foreground, sheet.ground, sheet.border]);
    expect(await focused(trigger(page, "appearance"))).toBe(true);
    expect(button.outlineStyle).not.toBe("none");
  } finally {
    recorded = await seen?.finish();
  }
  expect(recorded).toEqual(clean);
}, 25_000);

it.each(["light", "dark"] as const)("keeps native focus visible in the %s forced-colors palette", async (theme) => {
  const seen = await open("appearance", "Enter", theme, true);
  let recorded: Recorded | undefined;
  try {
    expect(seen === undefined ? false : await openState(seen.page, "appearance"), "the packaged panel opens with forced colors").toBe(true);
    if (seen === undefined) throw new Error("the packaged popover is unavailable");
    const { page } = seen;
    const button = trigger(page, "appearance");
    const ring = await paint(button);
    const background = await page.locator("#chrome").evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(await page.evaluate(() => matchMedia("(forced-colors: active)").matches)).toBe(true);
    expect(await focused(button)).toBe(true);
    expect(ring.outlineStyle).not.toBe("none");
    expect(ring.outlineWidth).toBeGreaterThan(0);
    expect(contrastRatio(hex(ring.outline), hex(background))).toBeGreaterThanOrEqual(3);
    await page.keyboard.press("Tab");
    expect(await focused(page.locator("#first"))).toBe(true);
  } finally {
    recorded = await seen?.finish();
  }
  expect(recorded).toEqual(clean);
}, 25_000);

type PlacementEdge = "top" | "bottom";

async function placementFixture(width: number, height: number): Promise<Visit> {
  if (browser === undefined || server === undefined) throw new Error("the built placement fixture is unavailable");
  const response = await fetch(`${server.origin}/${filename}`);
  if (response.status !== 200 || response.headers.get("content-security-policy") !== policy) {
    throw new Error("the packaged placement fixture did not serve the strict CSP header");
  }
  const seen = await visit(browser, server.origin, filename, ["anchored-popover.js"]);
  await seen.page.setViewportSize({ width, height });
  await seen.page.locator("html").evaluate((root) => { root.setAttribute("data-placement-fixture", "edges"); });
  return seen;
}

async function openPlacement(page: Page, edge: PlacementEdge): Promise<void> {
  const host = `placement-${edge}`;
  await trigger(page, host).focus();
  await page.keyboard.press("Enter");
  expect(await openState(page, host), "the native key opens the strict-fixture popover").toBe(true);
}

function fitsPreferredSide(page: Page, edge: PlacementEdge): Promise<boolean> {
  return page.locator(`#placement-${edge}`).evaluate((host, selected) => {
    const button = host.shadowRoot?.querySelector("[part=trigger]");
    const panel = host.shadowRoot?.querySelector("[part=surface]");
    if (button == null || panel == null) return false;
    const anchor = button.getBoundingClientRect();
    const box = panel.getBoundingClientRect();
    const outside = selected === "top" ? box.top >= anchor.bottom - 0.5 : box.bottom <= anchor.top + 0.5;
    return outside && box.width > 0 && box.height > 0 && box.left >= -0.5 && box.top >= -0.5
      && box.right <= innerWidth + 0.5 && box.bottom <= innerHeight + 0.5;
  }, edge);
}

function pointAt(action: Locator): Promise<{ x: number; y: number }> {
  return action.evaluate((element) => {
    const { x, y, width, height } = element.getBoundingClientRect();
    return { x: x + width / 2, y: y + height / 2 };
  });
}

function pageScroll(page: Page): Promise<{ x: number; y: number; width: number; client: number }> {
  return page.evaluate(() => ({ x: scrollX, y: scrollY, width: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
}

async function scrollAndActivateLast(page: Page, edge: PlacementEdge): Promise<void> {
  const host = `placement-${edge}`;
  const panel = surface(page, host);
  const scope = page.locator(`#${host}`);
  const first = scope.locator("[data-first-action]");
  const last = scope.locator("[data-last-action]");
  const capacity = await panel.evaluate((element) => element.scrollHeight - element.clientHeight);
  expect(capacity, "the last action starts past the edge of the constrained inner scroller").toBeGreaterThan(0);
  const before = await pageScroll(page);
  expect(before.width).toBe(before.client);
  const start = await pointAt(first);
  await page.mouse.move(start.x, start.y);
  await page.mouse.wheel(0, capacity);
  await expect.poll(() => panel.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect.poll(() => last.evaluate((element) => {
    const panel = element.closest("ocelle-anchored-popover")?.shadowRoot?.querySelector("[part=surface]");
    if (panel == null) return false;
    const visible = panel.getBoundingClientRect();
    const action = element.getBoundingClientRect();
    return action.top >= visible.top - 0.5 && action.bottom <= visible.bottom + 0.5;
  })).toBe(true);
  const end = await pointAt(last);
  await page.mouse.click(end.x, end.y);
  expect(await last.getAttribute("data-trusted-clicks"), "a real hit reaches the last action after inner scrolling").toBe("1");
  expect(await pageScroll(page), "scrolling the popover leaves the page width and scroll position alone").toEqual(before);
}

it.each(["top", "bottom"] as const)("anchors the %s strict fixture outside a transformed clip at 320 CSS px", async (edge) => {
  const seen = await placementFixture(320, 440);
  let recorded: Recorded;
  try {
    const { page } = seen;
    expect(await page.evaluate(() => innerWidth)).toBe(320);
    const clip = page.locator(`#placement-${edge}-clip`);
    const bounds = await clip.evaluate((element) => {
      const { top, bottom } = element.getBoundingClientRect();
      const { transform, overflowX, overflowY } = getComputedStyle(element);
      return { top, bottom, transform, overflowX, overflowY };
    });
    expect(bounds.transform).not.toBe("none");
    expect([bounds.overflowX, bounds.overflowY]).toEqual(["hidden", "hidden"]);
    await openPlacement(page, edge);
    await expect.poll(() => fitsPreferredSide(page, edge), {
      message: "the strict fixture stays on the usable preferred side inside the 320px viewport",
    }).toBe(true);
    const first = page.locator(`#placement-${edge} [data-first-action]`);
    const point = await pointAt(first);
    expect(edge === "top" ? point.y - bounds.bottom : bounds.top - point.y).toBeGreaterThan(0);
    await page.mouse.click(point.x, point.y);
    expect(await first.getAttribute("data-trusted-clicks"), "a physical hit outside the transformed clip reaches the action").toBe("1");
    await scrollAndActivateLast(page, edge);
  } finally {
    recorded = await seen.finish();
  }
  expect(recorded).toEqual(clean);
}, 25_000);

it("keeps the packaged surface usable after native action text doubles at a fixed viewport", async () => {
  const seen = await placementFixture(520, 520);
  let recorded: Recorded;
  try {
    const { page } = seen;
    await openPlacement(page, "top");
    const action = page.locator("#placement-top [data-first-action]");
    const originalFont = await action.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
    const viewport = await page.evaluate(() => [innerWidth, innerHeight]);
    await page.locator("html").evaluate((root) => { root.setAttribute("data-placement-fixture", "large-text"); });
    expect(await page.evaluate(() => [innerWidth, innerHeight])).toEqual(viewport);
    const enlarged = await action.locator("span").evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return {
        font: Number.parseFloat(getComputedStyle(element).fontSize),
        lines: new Set(Array.from(range.getClientRects(), ({ top }) => top)).size,
      };
    });
    expect(originalFont).toBeGreaterThan(0);
    expect(enlarged.font).toBe(originalFont * 2);
    expect(enlarged.lines, "the enlarged native action label is visibly broken into multiple lines").toBeGreaterThan(1);
    await expect.poll(() => fitsPreferredSide(page, "top"), {
      message: "the open surface follows the enlarged trigger and still fits below it",
    }).toBe(true);
    const beforeTabs = await pageScroll(page);
    expect(beforeTabs.width).toBe(beforeTabs.client);
    await page.keyboard.press("Tab");
    expect(await focused(action)).toBe(true);
    expect(await action.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
    expect((await paint(action)).outlineWidth).toBeGreaterThan(0);
    const controls = await page.locator("#placement-top .placement-actions button").all();
    const reached = [true];
    for (const control of controls.slice(1)) {
      await page.keyboard.press("Tab");
      reached.push(await focused(control));
    }
    expect(controls.length).toBeGreaterThan(1);
    expect(reached).toEqual(controls.map(() => true));
    expect(await surface(page, "placement-top").evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    expect(await pageScroll(page)).toEqual(beforeTabs);
  } finally {
    recorded = await seen.finish();
  }
  expect(recorded).toEqual(clean);
}, 25_000);
