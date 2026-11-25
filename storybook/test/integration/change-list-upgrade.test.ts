import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import type { Browser, Locator } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { parseIndex } from "../../../gates/lib/storybook-index.ts";
import { serve } from "../../../gates/lib/storybook-serve.ts";
import type { Server } from "../../../gates/lib/storybook-serve.ts";
import { readScrollWidth, readTextBoxes } from "../../../packages/elements/test/commands.ts";

const storyId = "workflow-studio-node-upgrade--pinned-versions";
const width = 320;
const prefix = "sha256:";
const previous = prefix + "0123456789abcdef".repeat(4);
const next = prefix + "fedcba9876543210".repeat(4);
const actions = [
  { name: "Copy previous digest", key: "Enter", digest: previous, result: "Simulated copy complete for previous digest" },
  { name: "Copy new digest", key: "Space", digest: next, result: "Simulated copy complete for new digest" },
] as const;
const modes = [
  { theme: "light", forcedColors: "none" },
  { theme: "dark", forcedColors: "none" },
  { theme: "light", forcedColors: "active" },
] as const;

const built = inject("storybook");
const storyIds = parseIndex(readFileSync(join(built.out, "index.json"), "utf8")).map((story) => story.id);
let server: Server | undefined;
let browser: Browser | undefined;

beforeAll(async () => {
  if (!storyIds.includes(storyId)) return;
  server = await serve(built.out);
  const executablePath = process.env.OCELLE_CHROMIUM_PATH;
  browser = await chromium.launch(executablePath === undefined || executablePath === "" ? {} : { executablePath });
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

function units(digest: string): readonly string[] {
  return [prefix, ...(digest.slice(prefix.length).match(/.{4}/g) ?? [])];
}

/** Reports whether the focused button and its computed outline fit in the viewport and clipping ancestors. */
function observeFocus(button: Locator): Promise<{ matchesFocusVisible: boolean; visibleRing: boolean; insideViewport: boolean; clippedBy: string[] }> {
  return button.evaluate((control) => {
    const style = getComputedStyle(control);
    const outlineWidth = Number.parseFloat(style.outlineWidth);
    const outset = Math.max(0, outlineWidth + Number.parseFloat(style.outlineOffset));
    const rect = control.getBoundingClientRect();
    const ring = { left: rect.left - outset, right: rect.right + outset, top: rect.top - outset, bottom: rect.bottom + outset };
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
      const horizontal = ring.left < left - 0.5 || ring.right > left + parent.clientWidth + 0.5;
      const vertical = ring.top < top - 0.5 || ring.bottom > top + parent.clientHeight + 0.5;
      if ((parentStyle.overflowX !== "visible" && horizontal) || (parentStyle.overflowY !== "visible" && vertical)) clippedBy.push(parent.localName);
    }
    return {
      matchesFocusVisible: control.matches(":focus-visible"),
      visibleRing: style.outlineStyle === "solid" && outlineWidth > 0
        && !["transparent", "rgba(0, 0, 0, 0)"].includes(style.outlineColor),
      insideViewport: ring.left >= -0.5 && ring.right <= innerWidth + 0.5 && ring.top >= -0.5 && ring.bottom <= innerHeight + 0.5,
      clippedBy,
    };
  });
}

const visibleFocus = { matchesFocusVisible: true, visibleRing: true, insideViewport: true, clippedBy: [] };

describe("the pinned node version comparison", { timeout: 60_000 }, () => {
  for (const { theme, forcedColors } of modes) {
    it(`shows the complete upgrade and copies either canonical digest by keyboard in ${theme}, forced colors ${forcedColors}`, async () => {
      expect(storyIds, "built Storybook index contains the pinned node versions story").toContain(storyId);
      if (browser === undefined || server === undefined) throw new Error("the node-upgrade story server did not start");
      const page = await browser.newPage({ viewport: { width, height: 800 }, forcedColors });
      const origin = server.origin;
      const outside: string[] = [];
      page.on("request", (request) => {
        if (new URL(request.url()).origin !== origin) outside.push(request.url());
      });
      try {
        const query = new URLSearchParams({ id: storyId, viewMode: "story", globals: `theme:${theme}` });
        await page.goto(`${origin}/iframe.html?${query}`, { waitUntil: "load" });
        const fixture = page.locator('#storybook-root article[data-story="change-list-upgrade"]');
        await fixture.waitFor({ state: "visible" });
        const fields = fixture.locator("ocelle-copy-field");
        const currentMode = await page.evaluate(() => ({
          theme: document.documentElement.dataset.theme,
          width: innerWidth,
          forced: matchMedia("(forced-colors: active)").matches,
        }));
        expect(currentMode).toEqual({ theme, width, forced: forcedColors === "active" });
        expect(await fixture.locator("ocelle-facts").count()).toBeGreaterThan(0);
        expect(await fixture.locator("ocelle-notice").count()).toBeGreaterThan(0);
        expect(await fields.count()).toBe(2);
        const groups = await fields.evaluateAll((items) => items.map((field) => field.getAttribute("aria-label")?.trim() ?? ""));
        expect(new Set(groups).size, "digest fields have separate group labels").toBe(2);
        expect(groups, "both group labels are present").not.toContain("");
        const codes = fixture.locator("ocelle-code-block [part~='code']");
        expect(await codes.count()).toBe(2);
        expect(await codes.evaluateAll((blocks) => blocks.map((code) => ({
          text: code.textContent,
          groups: [...code.querySelectorAll("span")].map((unit) => unit.textContent),
        }))), "digest presentation preserves canonical text and groups the body in fours").toEqual([
          { text: previous, groups: units(previous) },
          { text: next, groups: units(next) },
        ]);
        const previousHeading = fixture.getByRole("heading", { name: "Previous", exact: true });
        const nextHeading = fixture.getByRole("heading", { name: "New", exact: true });
        expect(await previousHeading.count()).toBe(1);
        expect(await nextHeading.count()).toBe(1);
        const previousTop = (await previousHeading.boundingBox())?.y ?? Infinity;
        expect(previousTop, "the comparison puts the previous version above the new version at 320 pixels")
          .toBeLessThan((await nextHeading.boundingBox())?.y ?? -Infinity);
        await page.evaluate(async () => {
          await document.fonts.ready;
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
        });
        const texts = ["Previous", ...units(previous), "New", ...units(next), "Removed outcome", "needs-review", "Added outbound capability", "metrics:write"];
        const boxes = (await readTextBoxes(page.mainFrame(), "storybook-root"))
          .filter((box) => box.box.width > 0 && box.box.height > 0 && texts.includes(box.text.trim()));
        expect(boxes.map((box) => box.text.trim()), "the visible upgrade text and digest groups follow document order").toEqual(texts);
        expect(boxes.filter((box) => box.clipped || box.box.x < -0.5 || box.box.x + box.box.width > width + 0.5), "required text fits without clipping").toEqual([]);
        expect(await readScrollWidth(page.mainFrame()), "the narrow upgrade page has no horizontal overflow").toBeLessThanOrEqual(width);
        const requests = await fixture.evaluateHandle((article) => {
          const seen: string[] = [];
          article.addEventListener("ocelle-copy-field-request", (event) => {
            const { detail } = event as CustomEvent<{ readonly text: string }>;
            seen.push(detail.text);
          });
          return seen;
        });
        for (const [index, { name, key, result }] of actions.entries()) {
          const field = fields.nth(index);
          const button = field.getByRole("button", { name, exact: true });
          const status = field.getByRole("status");
          expect(await button.count(), "the real Copy button has the distinct requested name").toBe(1);
          await page.keyboard.press("Tab");
          expect(await observeFocus(button), "native Tab reaches an unclipped, visible focus ring").toEqual(visibleFocus);
          await page.keyboard.press(key);
          await expect.poll(() => requests.jsonValue(), { timeout: 5_000 }).toEqual(actions.slice(0, index + 1).map((action) => action.digest));
          await expect.poll(() => status.textContent(), { timeout: 5_000 }).toBe(result);
          expect(await observeFocus(button), "simulated copy leaves the Copy control focused").toEqual(visibleFocus);
        }
        await page.evaluate(() => new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
        }));
        expect(await requests.jsonValue(), "the two native activations issue one exact request each").toEqual([previous, next]);
        const inline = await fixture.evaluate((article) => [article, ...article.querySelectorAll("*")].flatMap((node) => [
          ...(node.matches("script, style") ? [node.localName] : []),
          ...node.getAttributeNames().filter((name) => name === "style" || name.startsWith("on")),
        ]));
        expect(inline, "the composition emits no inline executable or style markup").toEqual([]);
        expect(outside, "all loaded requests stay on the Storybook origin").toEqual([]);
      } finally {
        await page.close();
      }
    });
  }
});
