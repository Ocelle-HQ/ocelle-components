import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import type { Browser, Locator, Page } from "playwright";
import { expect, inject, it } from "vitest";
import { parseIndex } from "../../../gates/lib/storybook-index.ts";
import { serve } from "../../../gates/lib/storybook-serve.ts";
import { readScrollWidth, readTextBoxes } from "../../../packages/elements/test/commands.ts";

const recipeId = "pane-action-footer";
const secondaryStory = "recipes-pane-action-footer--secondary-and-primary";
const desktopWidth = 1440;
const choosing = "Continue to Confirm";
const longStep = "Choose how the workflow handles incoming review requests";
const longActions = ["Review options for the selected approval workflow", "Continue to confirm and publish the approval workflow"] as const;

const variants = [
  { storyId: "recipes-pane-action-footer--primary-only", names: ["Continue"], current: [], labels: ["Review", "Choose", "Confirm"] },
  { storyId: secondaryStory, names: ["Review options", choosing], current: ["Choose"], labels: ["Review", "Choose", "Confirm"] },
  { storyId: "recipes-pane-action-footer--back-and-primary", names: ["Back", choosing], current: ["Choose"], labels: ["Review", "Choose", "Confirm"] },
  { storyId: "recipes-pane-action-footer--empty", names: ["Continue"], current: [], labels: [] },
] as const;

interface Mode {
  readonly theme: "light" | "dark";
  readonly forcedColors: "none" | "active";
}

const light: Mode = { theme: "light", forcedColors: "none" };
const modes: readonly Mode[] = [light, { theme: "dark", forcedColors: "none" }, { theme: "light", forcedColors: "active" }];

function storyIds(out: string): string[] {
  return parseIndex(readFileSync(join(out, "index.json"), "utf8")).map(({ id }) => id);
}

function actions(recipe: Locator): Locator {
  return recipe.locator("[data-pane-actions]");
}

async function actionNames(group: Locator): Promise<string[]> {
  return (await group.locator("ocelle-button").allTextContents()).map((name) => name.trim());
}

function activeFooter(recipe: Locator): Locator {
  return recipe.locator('[data-pane-footer="active"]');
}

async function withStory(
  out: string,
  storyId: string,
  width: number,
  mode: Mode,
  run: (page: Page, recipe: Locator, outside: string[]) => Promise<void>,
): Promise<void> {
  const server = await serve(out);
  let browser: Browser | undefined;
  try {
    const executablePath = process.env.OCELLE_CHROMIUM_PATH;
    browser = await chromium.launch(executablePath === undefined || executablePath === "" ? {} : { executablePath });
    const page = await browser.newPage({ viewport: { width, height: 900 }, forcedColors: mode.forcedColors });
    const outside: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== server.origin) outside.push(request.url());
    });

    const query = new URLSearchParams({ id: storyId, viewMode: "story", globals: `theme:${mode.theme}` });
    await page.goto(`${server.origin}/iframe.html?${query}`, { waitUntil: "load" });
    const recipe = page.locator(`#storybook-root article#${recipeId}[data-story="${recipeId}"]`);
    await recipe.waitFor({ state: "visible" });
    await recipe.evaluate(async (article) => {
      const indicator = article.querySelector("ocelle-step-indicator");
      await indicator?.updateComplete;
      const buttons = article.querySelectorAll("ocelle-button");
      await Promise.all([...buttons].map((button) => button.updateComplete));
      await document.fonts.ready;
    });
    await run(page, recipe, outside);
  } finally {
    await browser?.close();
    await server.close();
  }
}

function observeFocus(button: Locator): Promise<{ focused: boolean; outline: boolean; insideViewport: boolean; clippedBy: string[] }> {
  return button.evaluate((control) => {
    const style = getComputedStyle(control);
    const outlineWidth = Number.parseFloat(style.outlineWidth);
    const outset = Math.max(0, outlineWidth + Number.parseFloat(style.outlineOffset));
    const rect = control.getBoundingClientRect();
    const ring = { left: rect.left - outset, right: rect.right + outset, top: rect.top - outset, bottom: rect.bottom + outset };
    const parentOf = (element: Element): Element | null => {
      const root = element.getRootNode();
      return element.assignedSlot ?? element.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
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
      focused: control.matches(":focus-visible"),
      outline: style.outlineStyle !== "none" && outlineWidth > 0 && style.outlineColor !== "rgba(0, 0, 0, 0)",
      insideViewport: ring.left >= -0.5 && ring.right <= innerWidth + 0.5 && ring.top >= -0.5 && ring.bottom <= innerHeight + 0.5,
      clippedBy,
    };
  });
}

const visibleFocus = { focused: true, outline: true, insideViewport: true, clippedBy: [] };

function blockSize(footer: Locator): Promise<number> {
  return footer.evaluate((element) => element.getBoundingClientRect().height);
}

function actionRows(recipe: Locator): Promise<number[]> {
  return actions(recipe).getByRole("button").evaluateAll((controls) => controls.map((control) => Math.round(control.getBoundingClientRect().top)));
}

function stepLabel(recipe: Locator, text: string): Locator {
  return recipe.locator("ocelle-step-indicator").getByText(text, { exact: true });
}

function labelPainted(label: Locator): Promise<boolean> {
  return label.evaluate((element) => {
    const { width, height, left, right } = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return width > 1 && height > 1 && left >= -0.5 && right <= innerWidth + 0.5
      && style.visibility === "visible" && Number.parseFloat(style.opacity) > 0;
  });
}

async function textBounds(page: Page, labels: readonly string[]): Promise<{ name: string; fits: boolean }[]> {
  const viewportWidth = await page.evaluate(() => innerWidth);
  const texts = await readTextBoxes(page.mainFrame(), recipeId);
  return labels.map((name) => ({
    name,
    fits: texts.some(({ text, box, clipped }) => text.trim() === name && !clipped
      && box.width > 1 && box.height > 1 && box.x >= -0.5 && box.x + box.width <= viewportWidth + 0.5),
  }));
}

async function setLongLabels(recipe: Locator): Promise<void> {
  await recipe.locator("ocelle-step-indicator").evaluate((element, label) => {
    const indicator = element as HTMLElementTagNameMap["ocelle-step-indicator"];
    indicator.steps = indicator.steps.map((step) => step.state === "current" ? { ...step, label } : step);
    return indicator.updateComplete;
  }, longStep);
  const actionLabels = actions(recipe).locator("ocelle-button");
  for (const [index, label] of longActions.entries()) {
    await actionLabels.nth(index).evaluate((button, text) => {
      const defaultLabel = button.querySelector('[slot=""]');
      if (defaultLabel === null) {
        for (const node of [...button.childNodes]) {
          if (!(node instanceof Element) || !node.hasAttribute("slot")) node.remove();
        }
        button.append(text);
      } else {
        defaultLabel.textContent = text;
      }
    }, label);
  }
}

it.each(variants)("shows and tabs through the ordered actions in $storyId at desktop width", async ({ storyId, names, current, labels }) => {
  const { out } = inject("storybook");
  expect(storyIds(out), `built Storybook index contains ${storyId}`).toContain(storyId);

  await withStory(out, storyId, desktopWidth, light, async (page, recipe) => {
    const footer = activeFooter(recipe);
    const adjacent = recipe.locator('[data-pane-footer="adjacent"]');
    const activeBox = await footer.boundingBox();
    const adjacentBox = await adjacent.boundingBox();
    expect(activeBox?.height, "the action footer is 72 px tall at desktop width").toBeCloseTo(72, 1);
    expect(adjacentBox?.height, "the adjacent pane uses the same desktop footer height").toBeCloseTo(72, 1);
    expect(activeBox?.y, "the two footer bars align").toBeCloseTo(adjacentBox?.y ?? Number.NaN, 1);

    const indicator = footer.locator("ocelle-step-indicator");
    expect(await indicator.count(), "the example mounts one ordered step indicator").toBe(1);
    const items = indicator.getByRole("listitem");
    expect(await items.count(), "the built recipe uses the indicator for the supplied steps").toBe(labels.length);
    expect(await items.evaluateAll((steps) => steps.map((step) => step.querySelector(".label")?.textContent))).toEqual(labels);
    expect(await indicator.locator('[aria-current="step"] .label').allTextContents()).toEqual(current);

    const group = footer.locator("[data-pane-actions]");
    expect(await group.count(), "there is one action group").toBe(1);
    const groupBox = await group.boundingBox();
    const endOffset = await footer.evaluate((element) => {
      const style = getComputedStyle(element);
      return Number.parseFloat(style.paddingRight) + Number.parseFloat(style.borderRightWidth);
    });
    expect((activeBox?.x ?? 0) + (activeBox?.width ?? 0) - (groupBox?.x ?? 0) - (groupBox?.width ?? 0),
      "the action group reaches the end of the action footer").toBeCloseTo(endOffset, 0);
    expect(await actionNames(group), "DOM action order puts the primary last").toEqual(names);
    expect(await group.locator('ocelle-button[variant="primary"]').getByRole("button", { name: names.at(-1) ?? "", exact: true }).count()).toBe(1);

    for (const name of names) {
      const button = group.getByRole("button", { name, exact: true });
      expect(await button.count(), "an actual button has the expected accessible name").toBe(1);
      await page.keyboard.press("Tab");
      expect(await observeFocus(button), "native Tab follows the action order and keeps the ring visible").toEqual(visibleFocus);
    }
  });
}, 60_000);

it.each(modes)("advances the real pane and retains keyboard focus in $theme with forced colours $forcedColors", async (mode) => {
  const { out } = inject("storybook");
  expect(storyIds(out), `built Storybook index contains ${secondaryStory}`).toContain(secondaryStory);

  await withStory(out, secondaryStory, desktopWidth, mode, async (page, recipe, outside) => {
    const observedMode = await page.evaluate(() => ({
      theme: document.documentElement.dataset.theme,
      forcedColors: matchMedia("(forced-colors: active)").matches,
    }));
    expect(observedMode).toEqual({ theme: mode.theme, forcedColors: mode.forcedColors === "active" });
    const inlineMarkup = await recipe.evaluate((article) => [article, ...article.querySelectorAll("*")].flatMap((node) => [
      ...(node.matches("script:not([src]), style") ? [node.localName] : []),
      ...node.getAttributeNames().filter((name) => name === "style" || name.startsWith("on")),
    ]));
    expect(inlineMarkup, "the recipe uses external assets and no inline event or style markup").toEqual([]);

    const indicator = recipe.locator("ocelle-step-indicator");
    const current = indicator.locator('[aria-current="step"]');
    expect(await recipe.getByRole("heading", { name: "Choose", exact: true }).count()).toBe(1);
    expect(await current.getByText("Choose", { exact: true }).count()).toBe(1);
    const reviewStep = indicator.getByRole("listitem").filter({ hasText: "Review" });
    expect(await reviewStep.ariaSnapshot()).toContain("Completed");
    const cue = await current.locator(".marker").evaluate((marker) => {
      const style = getComputedStyle(marker);
      return style.outlineStyle === "solid" && Number.parseFloat(style.outlineWidth) > 0;
    });
    expect(cue, "the current marker has a visible non-colour cue").toBe(true);

    await recipe.evaluate((article) => {
      const next = document.createElement("button");
      next.type = "button";
      next.textContent = "Next fixture control";
      article.after(next);
    });

    const group = actions(recipe);
    const original = group.getByRole("button", { name: choosing, exact: true });
    await page.keyboard.press("Tab");
    expect(await observeFocus(group.getByRole("button", { name: "Review options", exact: true }))).toEqual(visibleFocus);
    await page.keyboard.press("Tab");
    expect(await observeFocus(original)).toEqual(visibleFocus);

    const originalControl = await original.evaluateHandle((button) => button);
    await page.keyboard.press("Enter");
    await expect.poll(() => recipe.getByRole("heading", { name: "Confirm", exact: true }).count(), { timeout: 5_000 })
      .toBe(1);
    expect(await recipe.getByRole("heading", { name: "Choose", exact: true }).count()).toBe(0);
    expect(await current.getByText("Confirm", { exact: true }).count(), "the host updates the current step").toBe(1);
    const chooseStep = indicator.getByRole("listitem").filter({ hasText: "Choose" });
    expect(await chooseStep.ariaSnapshot(), "the host marks Choose completed").toContain("Completed");

    const finish = group.getByRole("button", { name: "Finish", exact: true });
    expect(await finish.evaluate((button, before) => button === before, originalControl),
      "the host updates the existing native primary control in place").toBe(true);
    expect(await observeFocus(finish), "the updated primary remains visibly focused").toEqual(visibleFocus);
    await page.keyboard.press("Tab");
    expect(await page.getByRole("button", { name: "Next fixture control", exact: true }).evaluate((button) => button.matches(":focus")),
      "the next Tab moves to the next control after the recipe").toBe(true);
    expect(outside, "all requests stay on the built Storybook origin").toEqual([]);
  });
}, 60_000);

it("keeps the current label and both standard actions on one line at 1200 px", async () => {
  const { out } = inject("storybook");
  expect(storyIds(out), `built Storybook index contains ${secondaryStory}`).toContain(secondaryStory);

  await withStory(out, secondaryStory, 1200, light, async (page, recipe) => {
    const group = actions(recipe);
    const first = group.getByRole("button", { name: "Review options", exact: true });
    const second = group.getByRole("button", { name: choosing, exact: true });
    const firstBox = await first.boundingBox();
    const secondBox = await second.boundingBox();
    expect(firstBox?.y, "both standard buttons fit on one row").toBeCloseTo(secondBox?.y ?? Number.NaN, 0);

    const gap = await group.evaluate((element) => {
      const style = getComputedStyle(element);
      const actual = Number.parseFloat(style.columnGap);
      const rootFont = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      const tokenSizes = Array.from({ length: 10 }, (_, index) => style.getPropertyValue(`--ocelle-space-${String(index + 1)}`).trim())
        .map((size) => Number.parseFloat(size) * (size.endsWith("rem") ? rootFont : 1));
      return { actual, matchesToken: tokenSizes.some((size) => Math.abs(size - actual) < 0.5) };
    });
    expect(gap.actual, "the action gap is positive").toBeGreaterThan(0);
    expect(gap.matchesToken, "the action gap matches an Ocelle spacing token").toBe(true);
    expect((secondBox?.x ?? 0) - (firstBox?.x ?? 0) - (firstBox?.width ?? 0),
      "the observed gap between the two buttons matches the group gap").toBeCloseTo(gap.actual, 0);

    const indicator = activeFooter(recipe).locator("ocelle-step-indicator");
    expect((await indicator.boundingBox())?.x, "the indicator starts before the actions").toBeLessThan(firstBox?.x ?? Number.NaN);
    const current = stepLabel(recipe, "Choose");
    const currentBox = await current.boundingBox();
    expect(await labelPainted(current), "the current step label remains visible").toBe(true);
    expect(currentBox?.y, "the current label shares the action row").toBeLessThan((firstBox?.y ?? 0) + (firstBox?.height ?? 0));
    expect((currentBox?.y ?? 0) + (currentBox?.height ?? 0), "the current label is not above the action row")
      .toBeGreaterThan(firstBox?.y ?? Number.NaN);
    expect(await textBounds(page, ["Choose"])).toEqual([{ name: "Choose", fits: true }]);
    expect(await labelPainted(stepLabel(recipe, "Review")), "the completed label is compact").toBe(false);
    expect(await labelPainted(stepLabel(recipe, "Confirm")), "the upcoming label is compact").toBe(false);
    const list = await indicator.getByRole("list").ariaSnapshot();
    expect(list).toContain("Review");
    expect(list).toContain("Completed");
    expect(list).toContain("Choose");
    expect(list).toContain("Confirm");
    expect(await readScrollWidth(page.mainFrame())).toBeLessThanOrEqual(1200);
  });
}, 60_000);

function fontSize(element: Locator): Promise<number> {
  return element.evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
}

it.each([{ width: 320, enlarge: false }, { width: desktopWidth, enlarge: true }])(
  "wraps longer labels in normal flow at $width px (double text: $enlarge)",
  async ({ width, enlarge }) => {
    const { out } = inject("storybook");
    expect(storyIds(out), `built Storybook index contains ${secondaryStory}`).toContain(secondaryStory);

    await withStory(out, secondaryStory, width, light, async (page, recipe) => {
      await setLongLabels(recipe);
      const label = stepLabel(recipe, longStep);
      const group = actions(recipe);
      const [firstName, primaryName] = longActions;
      const nativePrimary = group.getByRole("button", { name: primaryName, exact: true });
      const stepBefore = await fontSize(label);
      const buttonBefore = await fontSize(nativePrimary);
      const heightBefore = await blockSize(activeFooter(recipe));
      // An adopted test stylesheet changes only the root text scale, without changing the viewport or recipe markup.
      await page.evaluate((shouldEnlarge) => {
        const rootFont = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
        const zoom = new CSSStyleSheet();
        zoom.replaceSync(`html { font-size: ${String(rootFont * (shouldEnlarge ? 2 : 1))}px !important; }`);
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, zoom];
      }, enlarge);
      expect(await page.evaluate(() => innerWidth), "the requested viewport does not change").toBe(width);
      const scale = enlarge ? 2 : 1;
      expect(await fontSize(label), "the current step text uses the requested scale").toBeCloseTo(stepBefore * scale, 1);
      expect(await fontSize(nativePrimary), "the native button text uses the requested scale").toBeCloseTo(buttonBefore * scale, 1);
      expect(await blockSize(activeFooter(recipe)), "the footer grows enough to hold the wrapped actions")
        .toBeGreaterThan(enlarge ? heightBefore : 72);
      expect(await activeFooter(recipe).evaluate((element) => getComputedStyle(element).position),
        "the action footer remains in normal flow").toMatch(/^(static|relative)$/);
      const [firstRow, secondRow] = await actionRows(recipe);
      expect(firstRow, "the secondary action wraps onto a row before the primary").toBeLessThan(secondRow ?? Number.NaN);
      expect(await actionNames(group)).toEqual(longActions);
      expect(await textBounds(page, [longStep, ...longActions])).toEqual([longStep, ...longActions].map((name) => ({ name, fits: true })));
      expect(await readScrollWidth(page.mainFrame()), "the document has no horizontal overflow").toBeLessThanOrEqual(width);

      for (const name of [firstName, primaryName]) {
        await page.keyboard.press("Tab");
        expect(await observeFocus(group.getByRole("button", { name, exact: true })),
          "native Tab reaches the whole visible focus ring after wrapping").toEqual(visibleFocus);
      }
    });
  }, 60_000,
);
