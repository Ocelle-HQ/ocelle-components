import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import type { Browser, Page } from "playwright";
import { expect, inject, it } from "vitest";
import { parseIndex } from "../../../gates/lib/storybook-index.ts";
import { serve } from "../../../gates/lib/storybook-serve.ts";
import { readScrollWidth, readTextBoxes } from "../../../packages/elements/test/commands.ts";

const storyId = "workflow-studio-plan-revision--reviewed-plan";
const article = 'article[data-story="change-list-plan"]';
const width = 320;
const values = ["24 hours", "one hour", "Platform team"];

interface Mode {
  readonly theme: "light" | "dark";
  readonly forcedColors: "none" | "active";
}

const modes: readonly Mode[] = [
  { theme: "light", forcedColors: "none" },
  { theme: "dark", forcedColors: "none" },
  { theme: "light", forcedColors: "active" },
];

async function observe(page: Page, origin: string, theme: Mode["theme"], requiresReview: boolean) {
  const url = new URL("/iframe.html", origin);
  url.searchParams.set("id", storyId);
  url.searchParams.set("viewMode", "story");
  url.searchParams.set("globals", `theme:${theme}`);
  url.searchParams.set("args", `requiresReview:${String(requiresReview)}`);
  await page.goto(url.href);
  const fixture = page.locator(`#storybook-root ${article}`);
  await fixture.waitFor({ state: "visible" });
  await fixture.evaluate(async (element) => {
    const fields = element.querySelectorAll<HTMLElement & { readonly updateComplete?: Promise<unknown> }>("ocelle-facts, ocelle-fact, ocelle-notice");
    await Promise.all([...fields].map((field) => field.updateComplete));
    await document.fonts.ready;
  });
  const frame = page.mainFrame();
  const boxes = await readTextBoxes(frame, "storybook-root");
  const visible = boxes.filter(({ box, clipped }) =>
    !clipped && box.width > 0 && box.height > 0 && box.x >= -0.5 && box.x + box.width <= width + 0.5);
  return {
    text: visible.map(({ text }) => text).join(" ").replace(/\s+/g, " ").trim(),
    valueTops: values.map((value) => visible.find(({ text }) => text.includes(value))?.box.y ?? Number.NaN),
    scrollWidth: await readScrollWidth(frame),
    theme: await page.locator("html").getAttribute("data-theme"),
    forcedColors: await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
    inlineMarkup: await fixture.evaluate((element) => [element, ...element.querySelectorAll("*")].flatMap((child) => {
      const tags = child.matches("script:not([src]), style") ? [child.localName] : [];
      const attributes = child.getAttributeNames().filter((name) => name === "style" || name.startsWith("on"));
      return [...tags, ...attributes];
    })),
  };
}

it.each(modes)("shows the same plan changes with each host judgment at 320px ($theme, forced colors $forcedColors)", async ({ theme, forcedColors }) => {
  const built = inject("storybook");
  const stories = parseIndex(readFileSync(join(built.out, "index.json"), "utf8"));
  expect(stories.map(({ id }) => id), "the built index contains the reviewed plan story").toContain(storyId);

  const server = await serve(built.out);
  let browser: Browser | undefined;
  try {
    const executablePath = process.env.OCELLE_CHROMIUM_PATH;
    browser = await chromium.launch(executablePath === undefined || executablePath === "" ? {} : { executablePath });
    const page = await browser.newPage({ viewport: { width, height: 800 }, forcedColors });
    const outside: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== server.origin) outside.push(request.url());
    });

    const required = await observe(page, server.origin, theme, true);
    const optional = await observe(page, server.origin, theme, false);
    const diff = /Previous retention\b.*?24 hours\b.*?New retention\b.*?one hour\b.*?Unchanged owner\b.*?Platform team\b/i;
    for (const observation of [required, optional]) {
      expect(observation.text).toMatch(diff);
      const [previousTop, newTop, unchangedTop] = observation.valueTops;
      expect(previousTop).toBeLessThan(newTop ?? Number.NaN);
      expect(newTop).toBeLessThan(unchangedTop ?? Number.NaN);
      expect(observation.scrollWidth).toBe(width);
      expect(observation.theme).toBe(theme);
      expect(observation.forcedColors).toBe(forcedColors === "active");
      expect(observation.inlineMarkup).toEqual([]);
    }
    expect(required.text).toContain("Review required");
    expect(optional.text).toContain("Review not required");
    expect(required.text.replace("Review required", "")).toBe(optional.text.replace("Review not required", ""));
    expect(outside).toEqual([]);
  } finally {
    await browser?.close();
    await server.close();
  }
}, 60_000);
