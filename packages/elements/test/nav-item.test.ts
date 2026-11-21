import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { setNavItemCompact } from "../src/ocelle-nav-item.ts";
import { inProcessDriver } from "./in-process.ts";

const driver = inProcessDriver();

function required<T>(target: T | null | undefined): T {
  if (target === null || target === undefined) throw new Error("Expected mounted element");
  return target;
}

async function mount(attributes: string): Promise<HTMLElementTagNameMap["ocelle-nav-item"]> {
  await driver.mount(`<ocelle-nav-item id="nav" label="Projects" ${attributes}><svg slot="icon" aria-label="Folder icon" viewBox="0 0 16 16"><path d="M2 2h12v12H2z"></path></svg></ocelle-nav-item>`);
  return required(document.querySelector("ocelle-nav-item"));
}

function bubble(item: HTMLElementTagNameMap["ocelle-nav-item"]): HTMLElement | null | undefined {
  return item.shadowRoot?.querySelector("ocelle-tooltip")?.shadowRoot?.querySelector('[part="bubble"]');
}

describe("ocelle-nav-item", () => {
  afterEach(async () => {
    await commands.emulateForcedColors("none");
    await commands.emulateReducedMotion("no-preference");
  });

  it("keeps its icon decorative and exposes native link activation and current state", async () => {
    const item = await mount('href="#projects" current="page"');
    const link = item.shadowRoot?.querySelector("a");
    expect(link?.getAttribute("href")).toBe("#projects");
    expect(link?.getAttribute("aria-current")).toBe("page");
    expect(getComputedStyle(required(link)).display).toBe("flex");
    expect(item.shadowRoot?.querySelector('slot[name="icon"]')?.parentElement?.getAttribute("aria-hidden")).toBe("true");
    expect((await commands.axState("nav", "a")).name).toBe("Projects");
    const activations: boolean[] = [];
    item.addEventListener("click", (event) => {
      activations.push(event.defaultPrevented);
      event.preventDefault();
    });
    await commands.pointer("click", "nav", { inner: "a" });
    await commands.press("Enter");
    expect(activations).toEqual([false, false]);
    item.current = "true";
    await item.updateComplete;
    expect(link?.getAttribute("aria-current")).toBe("true");
    item.current = "location";
    await item.updateComplete;
    expect(link?.hasAttribute("aria-current")).toBe(false);
  });

  it("shows an unfocusable label when no href is supplied", async () => {
    const item = await mount("compact");
    const label = item.shadowRoot?.querySelector<HTMLElement>('[part="label"]');
    expect(label?.textContent).toBe("Projects");
    expect(label?.hidden).toBe(false);
    expect(item.shadowRoot?.querySelector("a")).toBeNull();
    expect(item.shadowRoot?.querySelector('[tabindex="0"]')).toBeNull();
  });

  it("starts expanded with an empty label when the host supplies neither", async () => {
    await driver.mount('<ocelle-nav-item href="#projects"></ocelle-nav-item>');
    const item = required(document.querySelector("ocelle-nav-item"));
    const label = item.shadowRoot?.querySelector<HTMLElement>('[part="label"]');
    expect(item.label).toBe("");
    expect(item.compact).toBe(false);
    expect(label?.hidden).toBe(false);
    expect(label?.textContent).toBe("");
  });

  it("preserves host compact preference and the same focused link under an effective override", async () => {
    const item = await mount('href="#projects" compact');
    const link = item.shadowRoot?.querySelector("a");
    const label = item.shadowRoot?.querySelector<HTMLElement>('[part="label"]');
    expect(label?.hidden).toBe(true);
    expect((await commands.axState("nav", "a")).name).toBe("Projects");
    link?.focus();
    setNavItemCompact(item, false);
    await item.updateComplete;
    expect(label?.hidden).toBe(false);
    expect(item.compact).toBe(true);
    expect(item.shadowRoot?.activeElement).toBe(link);
    setNavItemCompact(item, undefined);
    await item.updateComplete;
    expect(label?.hidden).toBe(true);
    item.compact = false;
    setNavItemCompact(item, true);
    await item.updateComplete;
    expect(label?.hidden).toBe(true);
    expect(item.compact).toBe(false);
    setNavItemCompact(item, undefined);
    await item.updateComplete;
    expect(label?.hidden).toBe(false);
  });

  it("shows the visual-only compact label on hover, allows travel to it, and dismisses on Escape", async () => {
    const item = await mount('href="#projects" compact');
    const link = item.shadowRoot?.querySelector("a");
    expect(link?.getAttribute("aria-label")).toBe("Projects");
    item.style.setProperty("--ocelle-tooltip-delay", "0ms");
    await commands.hover("nav", "a");
    await expect.poll(() => bubble(item)?.matches(":popover-open")).toBe(true);
    expect(bubble(item)?.textContent).toBe("Projects");
    expect(bubble(item)?.getAttribute("aria-hidden")).toBe("true");
    expect(link?.hasAttribute("aria-describedby")).toBe(false);
    const box = required(bubble(item)).getBoundingClientRect();
    await commands.pointerPath([{ x: box.x + box.width / 2, y: box.y + box.height / 2 }]);
    expect(bubble(item)?.matches(":popover-open")).toBe(true);
    await commands.press("Escape");
    expect(bubble(item)?.matches(":popover-open")).toBe(false);
  });

  it("keeps a long translated label readable and the keyboard ring visible in forced colors and reduced motion", async () => {
    const item = await mount('href="#projects" compact');
    const link = item.shadowRoot?.querySelector("a");
    expect(link?.getAttribute("aria-label")).toBe("Projects");
    item.label = "Projektübersicht mit allen zugeordneten Arbeitsbereichen und gemeinsamen Projekteinstellungen";
    await item.updateComplete;
    await driver.viewport(320, 400);
    await commands.emulateForcedColors("active");
    await commands.emulateReducedMotion("reduce");
    await commands.press("Tab");
    expect(item.shadowRoot?.activeElement).toBe(link);
    const outline = getComputedStyle(required(link));
    expect(outline.outlineStyle).toBe("solid");
    expect(parseFloat(outline.outlineWidth)).toBeGreaterThan(0);
    await expect.poll(() => bubble(item)?.matches(":popover-open")).toBe(true);
    const shown = required(bubble(item));
    expect(shown.textContent).toBe(item.label);
    expect(shown.getBoundingClientRect().right).toBeLessThanOrEqual(document.documentElement.clientWidth);
    expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
  });
});
