import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-nav-pill.ts";
import "../src/ocelle-top-bar.ts";
import { deepActive } from "../src/focusable.ts";
import { inProcessDriver } from "./in-process.ts";

const driver = inProcessDriver();

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error("Expected a nav-pill fixture element");
  return value;
}

describe("ocelle-nav-pill", () => {
  afterEach(async () => {
    await commands.emulateForcedColors("none");
  });

  it("exposes a named ordered list, marking only the first current page", async () => {
    await driver.mount('<ocelle-nav-pill id="pill" label="Projektansichten" items="[]"></ocelle-nav-pill>');
    const pill = required(document.querySelector("ocelle-nav-pill"));
    expect(pill.items).toEqual([]);
    expect((await commands.axTree("pill", "subtree")).filter((node) => node.role === "navigation")).toEqual([]);
    pill.items = [{ label: "Plan", href: "#plan" }, { label: "Arbeit", href: "#work", current: true }, { label: "Prüfung", href: "#review", current: true }];
    await pill.updateComplete;
    const links = [...(pill.shadowRoot?.querySelectorAll("a") ?? [])];
    expect(links.map((link) => [link.textContent, link.getAttribute("href"), link.getAttribute("aria-current")])).toEqual([
      ["Plan", "#plan", null], ["Arbeit", "#work", "page"], ["Prüfung", "#review", null],
    ]);
    const tree = await commands.axTree("pill", "subtree");
    expect(tree.filter((node) => node.role === "navigation").map((node) => node.name)).toEqual(["Projektansichten"]);
    expect(tree.filter((node) => node.role === "list")).toHaveLength(1);
    const current = required(links[1]);
    expect(getComputedStyle(current).fontWeight).not.toBe(getComputedStyle(required(links[0])).fontWeight);
    pill.items = [];
    await pill.updateComplete;
    expect(pill.shadowRoot?.querySelector("nav")).toBeNull();
  });

  it("follows native pointer and keyboard links while top-bar actions stay separate", async () => {
    await driver.mount('<ocelle-top-bar><button id="cta" slot="actions">Create project</button></ocelle-top-bar><ocelle-nav-pill id="pill"></ocelle-nav-pill>');
    const pill = required(document.querySelector("ocelle-nav-pill"));
    expect(pill.label).toBe("Navigation");
    pill.label = " ";
    pill.items = [{ label: "Unavailable", href: " " }, { label: "Plan", href: "#plan" }, { label: "Work", href: "#work" }];
    await pill.updateComplete;
    expect(pill.shadowRoot?.querySelector("nav")?.getAttribute("aria-label")).toBe("Navigation");
    expect(pill.shadowRoot?.querySelectorAll("a")).toHaveLength(2);
    required(document.getElementById("cta")).focus();
    await commands.press("Tab");
    expect(deepActive()?.getAttribute("href")).toBe("#plan");
    await commands.press("Enter");
    await commands.pointer("click", "pill", { inner: 'a[href="#work"]' });
    expect((await driver.navigations()).map(({ href, defaultPrevented }) => [href, defaultPrevented])).toEqual([
      ["#plan", false], ["#work", false],
    ]);
    expect(pill.shadowRoot?.querySelector("[aria-current]")).toBeNull();
    expect(pill.shadowRoot?.querySelector("ocelle-drawer, button, slot")).toBeNull();
  });

  it("wraps long labels within its frame and keeps the same focused link", async () => {
    await driver.mount('<div id="frame"><ocelle-nav-pill></ocelle-nav-pill></div>');
    const frame = required(document.getElementById("frame"));
    const pill = required(document.querySelector("ocelle-nav-pill"));
    pill.items = [{ label: "Projektverwaltungsübersicht".repeat(4), href: "#one" }, { label: "Arbeitsbereiche und Einstellungen", href: "#two" }];
    await pill.updateComplete;
    const first = required(pill.shadowRoot?.querySelector("a"));
    await driver.viewport(320, 400);
    await commands.emulateForcedColors("active");
    await commands.press("Tab");
    frame.style.inlineSize = "240px";
    expect(deepActive()).toBe(first);
    expect(frame.scrollWidth).toBe(frame.clientWidth);
    expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
    const outline = getComputedStyle(first);
    expect(outline.outlineStyle).toBe("solid");
    expect(parseFloat(outline.outlineWidth)).toBeGreaterThan(0);
    const second = required(pill.shadowRoot?.querySelector('a[href="#two"]'));
    expect(second.getBoundingClientRect().top).toBeGreaterThan(first.getBoundingClientRect().top);
  });
});
