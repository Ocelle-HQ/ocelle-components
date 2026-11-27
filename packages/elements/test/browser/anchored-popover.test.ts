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
