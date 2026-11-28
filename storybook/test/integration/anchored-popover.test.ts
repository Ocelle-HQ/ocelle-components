import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import type { Browser, Locator, Page } from "playwright";
import { expect, inject, it } from "vitest";
import { parseIndex } from "../../../gates/lib/storybook-index.ts";
import { serve } from "../../../gates/lib/storybook-serve.ts";
import { contrastRatio } from "../../../gates/lib/wcag.ts";

interface Variant {
  readonly id: string;
  readonly kind: "appearance" | "profile";
  readonly open: boolean;
  readonly theme: "light" | "dark";
  readonly forcedColors: "none" | "active";
}

const variants = [
  { id: "elements-ocelle-anchored-popover--appearance-closed", kind: "appearance", open: false, theme: "light", forcedColors: "none" },
  { id: "elements-ocelle-anchored-popover--appearance-open", kind: "appearance", open: true, theme: "dark", forcedColors: "active" },
  { id: "elements-ocelle-anchored-popover--profile-closed", kind: "profile", open: false, theme: "dark", forcedColors: "none" },
  { id: "elements-ocelle-anchored-popover--profile-open", kind: "profile", open: true, theme: "light", forcedColors: "active" },
] as const satisfies readonly Variant[];

async function withStory(out: string, variant: Variant, run: (page: Page, demo: Locator) => Promise<void>): Promise<void> {
  const server = await serve(out);
  let browser: Browser | undefined;
  try {
    const executablePath = process.env.OCELLE_CHROMIUM_PATH;
    browser = await chromium.launch(executablePath === undefined || executablePath === "" ? {} : { executablePath });
    const page = await browser.newPage({
      viewport: { width: 960, height: 720 },
      colorScheme: variant.theme,
      forcedColors: variant.forcedColors,
    });
    const outside: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== server.origin) outside.push(request.url());
    });
    const query = new URLSearchParams({ id: variant.id, viewMode: "story", globals: `theme:${variant.theme}` });
    await page.goto(`${server.origin}/iframe.html?${query}`, { waitUntil: "load" });
    const demo = page.locator(`#storybook-root [data-anchored-popover-demo="${variant.kind}"]`);
    await demo.waitFor({ state: "visible" });
    await run(page, demo);
    expect(outside, "the fictional demo makes no off-origin requests").toEqual([]);
  } finally {
    try {
      await browser?.close();
    } finally {
      await server.close();
    }
  }
}

function hex(rgb: string): string {
  const channels = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(rgb)?.slice(1);
  if (channels === undefined) throw new Error(`expected an opaque computed RGB color, saw ${rgb}`);
  return `#${channels.map((channel) => Number(channel).toString(16).padStart(2, "0")).join("")}`;
}

async function expectReadableFocus(button: Locator, panel: Locator): Promise<void> {
  const control = await button.evaluate((element) => {
    const style = getComputedStyle(element);
    const width = Number.parseFloat(style.outlineWidth);
    const outset = Math.max(0, width + Number.parseFloat(style.outlineOffset));
    const { left, right, top, bottom } = element.getBoundingClientRect();
    return {
      focused: element.matches("button:focus-visible"),
      outline: style.outlineStyle !== "none" && width > 0,
      foreground: style.color,
      background: style.backgroundColor,
      ring: style.outlineColor,
      edges: { left: left - outset, right: right + outset, top: top - outset, bottom: bottom + outset },
    };
  });
  const sheet = await panel.evaluate((element) => {
    const { left, right, top, bottom } = element.getBoundingClientRect();
    return {
      background: getComputedStyle(element).backgroundColor,
      edges: { left: Math.max(0, left), right: Math.min(innerWidth, right), top: Math.max(0, top), bottom: Math.min(innerHeight, bottom) },
    };
  });
  const background = control.background === "rgba(0, 0, 0, 0)" ? sheet.background : control.background;
  expect(control.focused, "native Tab reaches the visible action").toBe(true);
  expect(control.outline, "the focused action has an outline with positive width").toBe(true);
  expect(contrastRatio(hex(control.foreground), hex(background)), "action text is readable against its actual background").toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(hex(control.ring), hex(sheet.background)), "the focus ring contrasts with the surrounding panel").toBeGreaterThanOrEqual(3);
  expect(control.edges.left).toBeGreaterThanOrEqual(sheet.edges.left - 0.5);
  expect(control.edges.right).toBeLessThanOrEqual(sheet.edges.right + 0.5);
  expect(control.edges.top).toBeGreaterThanOrEqual(sheet.edges.top - 0.5);
  expect(control.edges.bottom).toBeLessThanOrEqual(sheet.edges.bottom + 0.5);
}

async function expectOpen(trigger: Locator, panel: Locator, open: boolean): Promise<void> {
  await expect.poll(() => panel.evaluate((element) => element.matches(":popover-open")), { message: "the actual native panel state updates" })
    .toBe(open);
  expect(await trigger.getAttribute("aria-expanded"), "the named trigger exposes the same state").toBe(String(open));
}

async function openFromKeyboard(page: Page, trigger: Locator, panel: Locator, alreadyOpen: boolean): Promise<void> {
  await expectOpen(trigger, panel, alreadyOpen);
  await trigger.focus();
  if (!alreadyOpen) await page.keyboard.press("Enter");
  await expectOpen(trigger, panel, true);
}

async function expectAppearance(light: Locator, dark: Locator, chosen: "light" | "dark"): Promise<void> {
  const state = await Promise.all([light.getAttribute("aria-pressed"), dark.getAttribute("aria-pressed")]);
  expect(state, "the host presents exactly one pressed native choice").toEqual([String(chosen === "light"), String(chosen === "dark")]);
}

async function exerciseAppearance(page: Page, demo: Locator, alreadyOpen: boolean): Promise<void> {
  const trigger = demo.getByRole("button", { name: "Appearance menu", exact: true });
  const panel = demo.locator('[part="surface"]');
  const light = demo.getByRole("button", { name: "Light", exact: true });
  const dark = demo.getByRole("button", { name: "Dark", exact: true });
  await openFromKeyboard(page, trigger, panel, alreadyOpen);
  await expectAppearance(light, dark, "light");
  await page.keyboard.press("Tab");
  await expectReadableFocus(light, panel);
  await page.keyboard.press("Tab");
  await expectReadableFocus(dark, panel);

  await page.keyboard.press("Space");
  await expectOpen(trigger, panel, false);
  await trigger.click();
  await expectOpen(trigger, panel, true);
  await expectAppearance(light, dark, "dark");

  await light.click();
  await expectOpen(trigger, panel, false);
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expectOpen(trigger, panel, true);
  await expectAppearance(light, dark, "light");
}

async function exerciseProfile(page: Page, demo: Locator, alreadyOpen: boolean): Promise<void> {
  const trigger = demo.getByRole("button", { name: "Profile menu", exact: true });
  const panel = demo.locator('[part="surface"]');
  const signOut = demo.getByRole("button", { name: "Sign out", exact: true });
  const initials = demo.locator('ocelle-anchored-popover [slot="trigger"][aria-hidden="true"]');
  expect((await initials.textContent())?.trim(), "decorative initials leave the accessible trigger name intact").toMatch(/^[A-Z]{2}$/);
  expect(await demo.getAttribute("data-sign-out-count")).toBe("0");
  await openFromKeyboard(page, trigger, panel, alreadyOpen);
  await page.keyboard.press("Tab");
  await expectReadableFocus(signOut, panel);

  await page.keyboard.press("Enter");
  expect(await demo.getAttribute("data-sign-out-count"), "one native activation invokes the fictional host callback once").toBe("1");
  await trigger.focus();
  await page.keyboard.press("Escape");
  await expectOpen(trigger, panel, false);

  await trigger.click();
  await expectOpen(trigger, panel, true);
  await trigger.focus();
  await page.keyboard.press("Escape");
  await expectOpen(trigger, panel, false);
  expect(await demo.getAttribute("data-sign-out-count"), "reopening and dismissing does not invoke the callback").toBe("1");
}

const exercises = { appearance: exerciseAppearance, profile: exerciseProfile };

it.each(variants)("runs the registered $id with native keyboard and pointer input", async (variant) => {
  const { out } = inject("storybook");
  const ids = parseIndex(readFileSync(join(out, "index.json"), "utf8")).map(({ id }) => id);
  expect(ids, `built Storybook index contains ${variant.id}`).toContain(variant.id);

  await withStory(out, variant, async (page, demo) => {
    const mode = await page.evaluate(() => ({
      theme: document.documentElement.dataset.theme,
      forcedColors: matchMedia("(forced-colors: active)").matches,
    }));
    expect(mode).toEqual({ theme: variant.theme, forcedColors: variant.forcedColors === "active" });
    await exercises[variant.kind](page, demo, variant.open);
  });
}, 60_000);
