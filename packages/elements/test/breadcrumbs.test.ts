import { describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-breadcrumbs.ts";
import { deepActive } from "../src/focusable.ts";
import { inProcessDriver } from "./in-process.ts";

const driver = inProcessDriver();

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error("Expected a breadcrumb fixture element");
  return value;
}

describe("ocelle-breadcrumbs", () => {
  it("exposes an ordered named trail and a text current page even with its own URL", async () => {
    await driver.mount('<ocelle-breadcrumbs id="crumbs" label="Pfad" items="[]"></ocelle-breadcrumbs>');
    const crumbs = required(document.querySelector("ocelle-breadcrumbs"));
    expect(crumbs.items).toEqual([]);
    expect((await commands.axTree("crumbs", "subtree")).filter(({ role }) => role === "navigation")).toEqual([]);
    crumbs.items = [{ label: "Konto", href: "#account" }, { label: "Organisation" }, { label: "Aktuell", href: "#current" }];
    await crumbs.updateComplete;
    const items = [...(crumbs.shadowRoot?.querySelectorAll("li") ?? [])];
    expect(items.map((item) => item.querySelector('[part="link"], [part="current"], [data-ancestor]')?.textContent)).toEqual(["Konto", "Organisation", "Aktuell"]);
    const current = required(crumbs.shadowRoot?.querySelector('[part="current"]'));
    expect(current.localName).toBe("span");
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(current.hasAttribute("href")).toBe(false);
    expect(crumbs.shadowRoot?.querySelectorAll("a")).toHaveLength(1);
    expect(crumbs.shadowRoot?.querySelectorAll("li > [aria-hidden=true]")).toHaveLength(2);
    const tree = await commands.axTree("crumbs", "subtree");
    expect(tree.filter((node) => node.role === "navigation").map((node) => node.name)).toEqual(["Pfad"]);
    expect(tree.filter((node) => node.role === "listitem")).toHaveLength(3);
    expect(tree.map((node) => node.name)).not.toContain("/");
    crumbs.label = " ";
    await crumbs.updateComplete;
    expect(crumbs.shadowRoot?.querySelector("nav")?.getAttribute("aria-label")).toBe("Breadcrumb");
    crumbs.items = [];
    await crumbs.updateComplete;
    expect(crumbs.shadowRoot?.querySelector("nav")).toBeNull();
  });

  it.each(["ltr", "rtl"])("aligns at logical inline start and keeps wrapped links usable in %s", async (dir) => {
    await driver.mount(`<div id="frame" dir="${dir}" style="inline-size: 240px"><h1 id="title">Project</h1><ocelle-breadcrumbs></ocelle-breadcrumbs></div>`);
    const frame = required(document.getElementById("frame"));
    const crumbs = required(document.querySelector("ocelle-breadcrumbs"));
    crumbs.items = [{ label: "Workspace", href: "#space" }, { label: "Arbeitsbereichseinstellungen".repeat(3), href: "#work" }, { label: "Detailansicht" }];
    await crumbs.updateComplete;
    const first = required(crumbs.shadowRoot?.querySelector("a"));
    const second = required(crumbs.shadowRoot?.querySelector('a[href="#work"]'));
    const title = required(document.getElementById("title")).getBoundingClientRect();
    const firstBox = first.getBoundingClientRect();
    expect(dir === "rtl" ? firstBox.right : firstBox.left).toBe(dir === "rtl" ? title.right : title.left);
    expect(frame.scrollWidth).toBe(frame.clientWidth);
    first.focus();
    await commands.press("Tab");
    expect(deepActive()).toBe(second);
    await commands.press("Enter");
    expect((await driver.navigations()).map(({ href, defaultPrevented }) => [href, defaultPrevented])).toEqual([["#work", false]]);
  });
});
