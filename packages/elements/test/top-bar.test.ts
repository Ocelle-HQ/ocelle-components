import { describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-top-bar.ts";
import { inProcessDriver } from "./in-process.ts";

const driver = inProcessDriver();

function required<T>(target: T | null | undefined): T {
  if (target === null || target === undefined) throw new Error("Expected mounted element");
  return target;
}

async function mount(attributes: string, actions = ""): Promise<HTMLElementTagNameMap["ocelle-top-bar"]> {
  await driver.mount(`<ocelle-top-bar id="top" product-name="Kitty Dashboard" ${attributes}>${actions}</ocelle-top-bar>`);
  return required(document.querySelector("ocelle-top-bar"));
}

describe("ocelle-top-bar", () => {
  it("shows a decorative chrome brand mark, product name and supplied actions", async () => {
    const host = await mount("", '<button type="button" slot="actions">Settings</button>');
    const brand = host.shadowRoot?.querySelector('[part="brand"]');
    expect(brand?.textContent.trim()).toBe("Kitty Dashboard");
    expect(brand?.querySelector("ocelle-brand-mark")?.getAttribute("ground")).toBe("chrome");
    expect(host.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="actions"]')?.assignedElements().map((element) => element.textContent)).toEqual(["Settings"]);
  });

  it("leaves no menu button or action gap when omitted and reveals actions appended later", async () => {
    const host = await mount("");
    const actions = host.shadowRoot?.querySelector<HTMLElement>('[part="actions"]');
    expect(actions?.hidden).toBe(true);
    expect(host.shadowRoot?.querySelector('[part="menu-button"]')).toBeNull();
    const action = document.createElement("button");
    action.slot = "actions";
    host.append(action);
    await expect.poll(() => actions?.hidden).toBe(false);
    action.remove();
    await expect.poll(() => actions?.hidden).toBe(true);
  });

  it("requests once per native click, Enter and Space and lets the host set expansion", async () => {
    const host = await mount('show-menu menu-label="Navigation öffnen"');
    const menu = host.shadowRoot?.querySelector<HTMLButtonElement>("button");
    expect(menu?.getAttribute("type")).toBe("button");
    expect(menu?.getAttribute("aria-label")).toBe("Navigation öffnen");
    expect(menu?.getAttribute("aria-expanded")).toBe("false");
    const requests: unknown[] = [];
    host.parentElement?.addEventListener("ocelle-top-bar-menu-request", (event) => {
      requests.push({ detail: (event as CustomEvent<unknown>).detail, bubbles: event.bubbles, composed: event.composed });
    });
    await commands.pointer("click", "top", { inner: '[part="menu-button"]' });
    await commands.press("Enter");
    host.menuExpanded = true;
    await host.updateComplete;
    expect(menu?.getAttribute("aria-expanded")).toBe("true");
    await commands.press("Space");
    expect(requests).toEqual([
      { detail: { expanded: true }, bubbles: true, composed: true },
      { detail: { expanded: true }, bubbles: true, composed: true },
      { detail: { expanded: false }, bubbles: true, composed: true },
    ]);
  });

  it("reads initial menu expansion from markup and keeps an accessible fallback name", async () => {
    await driver.mount("<ocelle-top-bar show-menu menu-expanded></ocelle-top-bar>");
    const host = required(document.querySelector("ocelle-top-bar"));
    const menu = host.shadowRoot?.querySelector("button");
    expect(host.productName).toBe("");
    expect(host.menuLabel).toBe("Open navigation");
    expect(host.menuExpanded).toBe(true);
    expect(menu?.getAttribute("aria-expanded")).toBe("true");
    host.menuLabel = "";
    await host.updateComplete;
    expect(menu?.getAttribute("aria-label")).toBe("Open navigation");
  });

  it("keeps a named, focused menu at the minimum target size in a 320 px frame", async () => {
    await driver.mount('<div id="frame"><ocelle-top-bar id="top" product-name="Eine sehr lange Übersetzung des Produktnamens" show-menu><button type="button" slot="actions">Einstellungen</button></ocelle-top-bar></div>');
    const frame = required(document.getElementById("frame"));
    frame.style.inlineSize = "320px";
    const host = required(document.querySelector("ocelle-top-bar"));
    const menu = host.shadowRoot?.querySelector<HTMLButtonElement>("button");
    expect(menu?.getAttribute("aria-label")).toBe("Open navigation");
    const measured = document.createElement("div");
    measured.style.inlineSize = "var(--ocelle-target-min)";
    frame.append(measured);
    const size = measured.getBoundingClientRect().width;
    const box = menu?.getBoundingClientRect();
    expect(box?.width).toBeGreaterThanOrEqual(size);
    expect(box?.height).toBeGreaterThanOrEqual(size);
    expect(frame.scrollWidth).toBe(320);
    await commands.press("Tab");
    expect(host.shadowRoot?.activeElement).toBe(menu);
    expect(menu?.matches(":focus-visible")).toBe(true);
    expect(getComputedStyle(required(menu)).outlineStyle).toBe("solid");
  });
});
