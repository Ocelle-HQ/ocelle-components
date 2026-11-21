import { describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-app-shell.ts";
import "../src/ocelle-context-sidebar.ts";
import "../src/ocelle-personal-rail.ts";
import "../src/ocelle-nav-item.ts";
import "../src/ocelle-section-header.ts";
import { deepActive } from "../src/focusable.ts";
import { inProcessDriver } from "./in-process.ts";

const driver = inProcessDriver();
const rail = '<ocelle-personal-rail id="rail" slot="rail" label="Persönlich"><ocelle-nav-item id="rail-item" href="#home" label="Start" compact></ocelle-nav-item></ocelle-personal-rail>';
const grouped = '<ocelle-context-sidebar id="sidebar" slot="sidebar" label="Projekte"><button id="head" slot="head" type="button">Team wechseln</button><ocelle-section-header id="direct-heading"><h2 slot="heading">Arbeitsbereiche</h2></ocelle-section-header><section id="group"><h2 id="nested-heading">Projekte</h2><ul><li><ocelle-nav-item id="item" href="#one" label="Übersicht" current="page" compact></ocelle-nav-item></li><li><ocelle-nav-item href="#two" label="Aufgaben"></ocelle-nav-item></li></ul></section><button id="foot" slot="footer" type="button">Einstellungen</button></ocelle-context-sidebar>';

function required<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error("Expected a mounted element");
  return value;
}

function shown(node: Element | null | undefined): boolean {
  return (node?.getClientRects().length ?? 0) > 0;
}

async function mount(content: string, attributes = ""): Promise<HTMLElementTagNameMap["ocelle-app-shell"]> {
  await driver.mount(`<div id="frame"><ocelle-app-shell id="shell" product-name="Kitty" ${attributes}>${content}<button id="main-content" type="button">Read</button></ocelle-app-shell></div>`);
  return required(document.querySelector("ocelle-app-shell"));
}

function size(value: number): void {
  required(document.getElementById("frame")).style.inlineSize = `${String(value)}px`;
}

function top(shell: HTMLElementTagNameMap["ocelle-app-shell"]): HTMLElementTagNameMap["ocelle-top-bar"] | null | undefined {
  return shell.shadowRoot?.querySelector("ocelle-top-bar");
}

function menu(shell: HTMLElementTagNameMap["ocelle-app-shell"]): HTMLButtonElement | null | undefined {
  return top(shell)?.shadowRoot?.querySelector("button");
}

async function landmarks(): Promise<string[]> {
  return (await commands.axTree("shell", "subtree")).filter((node) => node.role === "navigation").map((node) => node.name);
}

describe("ocelle-app-shell navigation", () => {
  it.each([
    { layout: "mission", wide: ["Persönlich", "Projekte"], railVisible: true, compact: true },
    { layout: "project", wide: ["Projekte"], railVisible: false, compact: true },
    { layout: "personal", wide: ["Projekte"], railVisible: false, compact: false },
  ])("renders the $layout layout in all three tiers", async ({ layout, wide, railVisible, compact }) => {
    const shell = await mount(rail + grouped, `layout="${layout}" menu-label="Navigation öffnen"`);
    size(1150);
    await expect.poll(landmarks).toEqual(wide);
    expect(shown(document.getElementById("rail"))).toBe(railVisible);
    const sidebarWidth = (): number | undefined => shell.shadowRoot?.querySelector(".sidebar")?.getBoundingClientRect().width;
    expect(sidebarWidth()).toBe(320);
    expect(shown(menu(shell))).toBe(false);
    size(850);
    await expect.poll(() => shell.tier).toBe("collapsed");
    expect(await landmarks()).toEqual(wide);
    expect(shown(document.getElementById("head"))).toBe(!compact);
    expect(shown(document.getElementById("foot"))).toBe(!compact);
    expect(sidebarWidth()).toBe(compact ? 52 : 320);
    expect(shown(document.getElementById("rail"))).toBe(railVisible);
    size(700);
    await expect.poll(() => menu(shell)?.getAttribute("aria-label")).toBe("Navigation öffnen");
    expect(await landmarks()).toEqual([]);
    expect(shown(document.getElementById("rail"))).toBe(false);
    expect(shown(document.getElementById("sidebar"))).toBe(false);
    expect(shown(shell.contentTarget)).toBe(true);
  });

  it("gives bare content one localized landmark and preserves a supplied native landmark name", async () => {
    const shell = await mount('<a slot="rail" href="#home">Home</a><nav slot="sidebar" aria-label="Workspace destinations"><a href="#work">Work</a></nav>', 'rail-label="Konto" sidebar-label="Ersatz"');
    expect(await landmarks()).toEqual(["Konto", "Workspace destinations"]);
    const rail = shell.querySelector('[slot="rail"]');
    rail?.remove();
    await expect.poll(landmarks).toEqual(["Workspace destinations"]);
    shell.querySelector('[slot="sidebar"]')?.remove();
    await expect.poll(landmarks).toEqual([]);
    size(500);
    await expect.poll(() => shell.tier).toBe("narrow");
    expect(shown(menu(shell))).toBe(false);
  });

  it("defaults invalid layout and blank labels while an empty supplied landmark remains absent", async () => {
    const shell = await mount('<a slot="rail" href="#account">Account</a><ocelle-context-sidebar slot="sidebar" label="Empty"></ocelle-context-sidebar>', 'layout="unknown" rail-label=" "');
    await expect.poll(landmarks).toEqual(["Account"]);
    const sidebar = required(shell.querySelector("ocelle-context-sidebar"));
    const link = document.createElement("a");
    link.href = "#one";
    link.textContent = "Project";
    sidebar.append(link);
    await expect.poll(landmarks).toEqual(["Account", "Empty"]);
    sidebar.hidden = true;
    await expect.poll(landmarks).toEqual(["Account"]);
  });

  it("exposes navigation only while a generic wrapper projects content", async () => {
    const shell = await mount('<div slot="sidebar"><div><span> </span><a hidden href="#work">Work</a></div></div>');
    await expect.poll(landmarks).toEqual([]);
    const link = required(shell.querySelector("a"));
    link.hidden = false;
    await expect.poll(landmarks).toEqual(["Workspace"]);
    link.remove();
    await expect.poll(landmarks).toEqual([]);
    size(500);
    await expect.poll(() => shell.tier).toBe("narrow");
    expect(shown(menu(shell))).toBe(false);
  });

  it("uses the default product and menu settings and applies localized shell attributes", async () => {
    const shell = await mount('<div slot="sidebar"><a href="#work">Work</a></div>', 'sidebar-label="Projekte"');
    expect(top(shell)?.productName).toBe("Kitty");
    expect(await landmarks()).toEqual(["Projekte"]);
    const unnamed = document.createElement("ocelle-app-shell");
    shell.append(unnamed);
    await unnamed.updateComplete;
    expect(top(unnamed)?.productName).toBe("");
    expect([unnamed.menuLabel, unnamed.railLabel, unnamed.sidebarLabel]).toEqual(["Open navigation", "Account", "Workspace"]);
    shell.sidebarLabel = " ";
    await expect.poll(landmarks).toEqual(["Workspace"]);
    size(500);
    await expect.poll(() => menu(shell)?.getAttribute("aria-label")).toBe("Open navigation");
  });

  it("reevaluates nested landmarks and visible text when light DOM changes", async () => {
    const shell = await mount('<div slot="sidebar"><div hidden><nav aria-label="Hidden"><a href="#hidden">Hidden</a></nav></div><div id="nested" role="navigation" aria-label="Nested"><a href="#work">Work</a></div></div>');
    expect(await landmarks()).toEqual(["Nested"]);
    const nested = required(shell.querySelector("#nested"));
    nested.removeAttribute("role");
    await expect.poll(landmarks).toEqual(["Workspace"]);
    const text = document.createTextNode("Categories");
    nested.replaceChildren(text);
    await expect.poll(landmarks).toEqual(["Workspace"]);
    const emptied = (): boolean | undefined => shell.shadowRoot?.querySelector(".sidebar")?.hasAttribute("hidden");
    await expect.poll(emptied).toBe(false);
    text.data = " ";
    await expect.poll(landmarks).toEqual([]);
    text.data = "Categories";
    await expect.poll(landmarks).toEqual(["Workspace"]);
    required(shell.querySelector('[slot="sidebar"]')).setAttribute("slot", "rail");
    await expect.poll(landmarks).toEqual(["Account"]);
  });

  it("preserves a named landmark when the same slot also receives an empty wrapper", async () => {
    const shell = await mount('<div slot="sidebar"></div><nav slot="sidebar" aria-label="Work"><a href="#work">Overview</a></nav>');
    expect(await landmarks()).toEqual(["Work"]);
    required(shell.querySelector("nav")).remove();
    await expect.poll(landmarks).toEqual([]);
  });

  it("keeps the empty top-bar action region hidden and projects added actions", async () => {
    const shell = await mount("");
    const actions = (): HTMLElement | null | undefined => top(shell)?.shadowRoot?.querySelector<HTMLElement>('[part="actions"]');
    await expect.poll(() => actions()?.hidden).toBe(true);
    const action = document.createElement("button");
    action.slot = "actions";
    action.textContent = "Settings";
    shell.append(action);
    await expect.poll(() => actions()?.hidden).toBe(false);
    expect(shown(action)).toBe(true);
    action.remove();
    await expect.poll(() => actions()?.hidden).toBe(true);
  });

  it("compacts grouped nav and restores the same nodes, headings and host preference", async () => {
    const shell = await mount(grouped);
    size(1150);
    const item = required(shell.querySelector("ocelle-nav-item"));
    const link = (): HTMLAnchorElement | null | undefined => item.shadowRoot?.querySelector("a");
    const label = (): HTMLElement | null | undefined => item.shadowRoot?.querySelector<HTMLElement>('[part="label"]');
    await expect.poll(() => label()?.hidden).toBe(false);
    const original = required(link());
    original.focus();
    size(850);
    await expect.poll(() => label()?.hidden).toBe(true);
    expect(shown(document.getElementById("direct-heading"))).toBe(false);
    expect(shown(document.getElementById("nested-heading"))).toBe(false);
    expect(link()).toBe(original);
    const compactItem = original.getBoundingClientRect();
    const column = required(document.getElementById("sidebar")).getBoundingClientRect();
    expect(compactItem.width).toBeGreaterThanOrEqual(40);
    expect(compactItem.left).toBeGreaterThanOrEqual(column.left);
    expect(compactItem.right).toBeLessThanOrEqual(column.right);
    expect(deepActive()).toBe(original);
    expect(original.getAttribute("aria-current")).toBe("page");
    expect((await commands.axState("item", "a")).name).toBe("Übersicht");
    size(1150);
    await expect.poll(() => label()?.hidden).toBe(false);
    expect(shown(document.getElementById("direct-heading"))).toBe(true);
    expect(shown(document.getElementById("nested-heading"))).toBe(true);
    expect(link()).toBe(original);
    expect(deepActive()).toBe(original);
    expect(item.compact).toBe(true);
    required(shell.parentElement).append(item);
    await expect.poll(() => label()?.hidden).toBe(true);
    expect(item.compact).toBe(true);
  });

  it("compacts a directly assigned nav item and an explicit default-slot section while leaving footer items alone", async () => {
    const shell = await mount('<ocelle-nav-item id="bare" slot="sidebar" href="#bare" label="Bare"></ocelle-nav-item><ocelle-context-sidebar slot="sidebar" label="Projects"><section slot=""><ocelle-nav-item id="default-item" href="#default" label="Default"></ocelle-nav-item></section><ocelle-nav-item id="footer-item" slot="footer" href="#footer" label="Footer" compact></ocelle-nav-item></ocelle-context-sidebar>');
    const getLabel = (id: string): Element | null | undefined => shell.querySelector(`#${id}`)?.shadowRoot?.querySelector('[part="label"]');
    size(1150);
    await expect.poll(() => shown(getLabel("bare"))).toBe(true);
    expect(shown(getLabel("default-item"))).toBe(true);
    const footer = (): Element => required(getLabel("footer-item"));
    expect(footer().hasAttribute("hidden")).toBe(true);
    size(850);
    await expect.poll(() => shell.tier).toBe("collapsed");
    expect(shown(getLabel("bare"))).toBe(false);
    expect(shown(getLabel("default-item"))).toBe(false);
    expect(footer().hasAttribute("hidden")).toBe(true);
  });

  it("keeps the receiving shell's presentation when a destination moves between shells", async () => {
    const sender = await mount(grouped);
    size(850);
    const item = required(sender.querySelector("ocelle-nav-item"));
    const hidden = () => item.shadowRoot?.querySelector<HTMLElement>('[part="label"]')?.hidden;
    await expect.poll(hidden).toBe(true);
    const receiver = document.createElement("ocelle-app-shell");
    receiver.style.inlineSize = "1150px";
    const sidebar = document.createElement("section");
    sidebar.slot = "sidebar";
    receiver.append(sidebar);
    required(sender.parentElement).append(receiver);
    await receiver.updateComplete;
    receiver.remeasure();
    sidebar.append(item);
    await expect.poll(hidden).toBe(false);
    expect(item.compact).toBe(true);
    item.remove();
    await expect.poll(hidden).toBe(true);
  });

  it("does not let later sender cleanup clear the receiving shell's presentation", async () => {
    const sender = await mount(grouped);
    size(1150);
    const sidebar = required(sender.querySelector("ocelle-context-sidebar"));
    const head = required(document.getElementById("head"));
    const item = required(sidebar.querySelector("ocelle-nav-item"));
    item.compact = false;
    const label = () => item.shadowRoot?.querySelector<HTMLElement>('[part="label"]');
    await expect.poll(() => shown(label())).toBe(true);
    const receiver = document.createElement("ocelle-app-shell");
    receiver.style.inlineSize = "850px";
    required(sender.parentElement).append(receiver);
    await receiver.updateComplete;
    receiver.remeasure();
    receiver.append(sidebar);
    sender.remeasure();
    await Promise.all([receiver.updateComplete, sender.updateComplete]);
    await Promise.all([item.updateComplete, sidebar.updateComplete]);
    expect(shown(label())).toBe(false);
    expect(shown(head)).toBe(false);
  });

  it("restores sidebar chrome and a destination's authored presentation when they leave the shell", async () => {
    const shell = await mount(grouped);
    size(850);
    const sidebar = required(shell.querySelector("ocelle-context-sidebar"));
    const item = required(sidebar.querySelector("ocelle-nav-item"));
    const head = required(sidebar.querySelector('[slot="head"]'));
    item.compact = false;
    const label = () => item.shadowRoot?.querySelector('[part="label"]');
    await expect.poll(() => shell.tier).toBe("collapsed");
    expect(shown(label())).toBe(false);
    expect(shown(head)).toBe(false);

    required(shell.parentElement).append(sidebar);
    await expect.poll(() => shown(label())).toBe(true);
    expect(shown(head)).toBe(true);
    expect(item.compact).toBe(false);
  });

  it("restores a rail link's ordinary foreground when it leaves shell chrome", async () => {
    const shell = await mount(rail);
    const item = required(shell.querySelector("ocelle-nav-item"));
    const railHost = required(shell.querySelector("ocelle-personal-rail"));
    const link = () => required(item.shadowRoot?.querySelector("a"));
    const frame = required(shell.parentElement);
    const authoredForeground = "rgb(12, 34, 56)";
    frame.style.setProperty("--ocelle-color-link", authoredForeground);
    await expect.poll(() => getComputedStyle(link()).color).toBe(getComputedStyle(railHost).color);
    expect(getComputedStyle(link()).color).not.toBe(authoredForeground);
    frame.append(item);
    await expect.poll(() => getComputedStyle(link()).color).toBe(authoredForeground);
  });

  it("shares compact styles in one root until the last collapsed shell leaves", async () => {
    await driver.mount('<div id="frame"></div>');
    const root = required(document.getElementById("frame")).attachShadow({ mode: "open" });
    const authored = new CSSStyleSheet();
    authored.replaceSync("h2 { color: rgb(1, 2, 3); }");
    root.adoptedStyleSheets = [authored];
    const shell = (suffix: string): HTMLElementTagNameMap["ocelle-app-shell"] => {
      const host = document.createElement("ocelle-app-shell");
      host.style.inlineSize = "850px";
      host.innerHTML = `<section slot="sidebar"><h2 id="heading-${suffix}">Projects</h2><ul><li><a href="#${suffix}">Work</a></li></ul></section>`;
      return host;
    };
    const first = shell("one");
    const second = shell("two");
    const firstHeading = required(first.querySelector("h2"));
    const secondHeading = required(second.querySelector("h2"));
    root.append(first, second);
    await expect.poll(() => [shown(firstHeading), shown(secondHeading)]).toEqual([false, false]);
    expect(root.adoptedStyleSheets).toHaveLength(2);
    expect(root.adoptedStyleSheets[0]).toBe(authored);
    const list = required(second.querySelector("ul"));
    expect(getComputedStyle(list).paddingInlineStart).toBe("0px");

    first.remove();
    expect(root.adoptedStyleSheets).toHaveLength(2);
    expect(shown(secondHeading)).toBe(false);
    const removed = required(first.querySelector("section"));
    root.append(removed);
    expect(shown(firstHeading)).toBe(true);
    expect(getComputedStyle(firstHeading).color).toBe("rgb(1, 2, 3)");

    second.style.inlineSize = "1150px";
    await expect.poll(() => shown(secondHeading)).toBe(true);
    expect(root.adoptedStyleSheets).toHaveLength(1);
    expect(root.adoptedStyleSheets[0]).toBe(authored);
    expect(getComputedStyle(list).paddingInlineStart).toBe("40px");
  });

  it("moves focus from collapsing sidebar chrome to the first sequential destination, then main when none survives", async () => {
    const shell = await mount(grouped);
    size(1150);
    const head = required(document.getElementById("head"));
    head.focus();
    size(850);
    await expect.poll(() => deepActive()).toBe(shell.querySelector("ocelle-nav-item")?.shadowRoot?.querySelector("a"));
    size(1150);
    await expect.poll(() => shown(head)).toBe(true);
    shell.querySelectorAll("ocelle-nav-item").forEach((item) => { item.remove(); });
    head.focus();
    size(850);
    await expect.poll(() => deepActive()).toBe(shell.contentTarget);
  });

  it("recovers focus when a same-width layout swap removes the rail and when narrow removes navigation", async () => {
    const shell = await mount(rail + grouped);
    size(1150);
    const railLink = document.getElementById("rail-item")?.shadowRoot?.querySelector("a");
    await expect.poll(() => shown(railLink)).toBe(true);
    required(railLink).focus();
    const received: string[] = [];
    shell.addEventListener("ocelle-app-shell-tier-change", (event) => { received.push(event.type); });
    shell.layout = "project";
    await expect.poll(() => deepActive()).toBe(document.getElementById("item")?.shadowRoot?.querySelector("a"));
    expect(received).toEqual([]);
    size(700);
    await expect.poll(() => shown(menu(shell))).toBe(true);
    await expect.poll(() => deepActive()).toBe(menu(shell));
    size(1150);
    await expect.poll(() => deepActive()).toBe(document.getElementById("item")?.shadowRoot?.querySelector("a"));
    expect(received).toHaveLength(2);
  });

  it("recovers focus when a navigation destination becomes invisible but still occupies space", async () => {
    const shell = await mount(rail + grouped);
    size(1150);
    const railLink = required(shell.querySelector("#rail-item")?.shadowRoot?.querySelector("a"));
    await expect.poll(() => shown(railLink)).toBe(true);
    const topBar = required(top(shell));
    const { promise: hold, resolve: finish } = Promise.withResolvers<boolean>();
    Object.defineProperty(topBar, "updateComplete", { configurable: true, get: () => hold });

    railLink.focus();
    shell.remeasure();
    await shell.updateComplete;
    railLink.style.visibility = "hidden";
    expect(shown(railLink)).toBe(true);
    finish(true);
    const destination = required(shell.querySelector("#item")?.shadowRoot?.querySelector("a"));
    await expect.poll(() => deepActive()).toBe(destination);
  });

  it("does not recover unrelated focus inside the shell when it was outside navigation", async () => {
    const shell = await mount(rail + grouped);
    size(1150);
    await expect.poll(() => shell.tier).toBe("expanded");
    const button = required(shell.querySelector<HTMLButtonElement>("#main-content"));
    const topBar = required(top(shell));
    const { promise: hold, resolve: finish } = Promise.withResolvers<boolean>();
    Object.defineProperty(topBar, "updateComplete", { configurable: true, get: () => hold });

    button.focus();
    expect(deepActive()).toBe(button);
    shell.remeasure();
    await shell.updateComplete;
    button.style.visibility = "hidden";
    finish(true);
    await new Promise<void>((resolve) => { requestAnimationFrame(() => { resolve(); }); });
    expect(deepActive()).toBeNull();
  });

  it("preserves deliberately moved focus while a navigation update settles", async () => {
    const shell = await mount(rail + grouped);
    size(1150);
    const railLink = required(shell.querySelector("#rail-item")?.shadowRoot?.querySelector("a"));
    await expect.poll(() => shown(railLink)).toBe(true);
    const item = required(shell.querySelector("ocelle-context-sidebar ocelle-nav-item"));
    const { promise: hold, resolve: finish } = Promise.withResolvers<boolean>();
    Object.defineProperty(item, "updateComplete", { configurable: true, get: () => hold });

    railLink.focus();
    shell.layout = "project";
    await shell.updateComplete;
    const mainButton = required(shell.querySelector<HTMLButtonElement>("#main-content"));
    mainButton.focus();
    finish(true);
    await new Promise<void>((resolve) => { requestAnimationFrame(() => { resolve(); }); });
    expect(deepActive()).toBe(mainButton);
  });

  it("uses chrome foreground on unselected rail links in light mode", async () => {
    const shell = await mount(rail + grouped);
    await expect.poll(landmarks).toEqual(["Persönlich", "Projekte"]);
    const railHost = required(shell.querySelector("ocelle-personal-rail"));
    const link = required(railHost.querySelector("ocelle-nav-item")?.shadowRoot?.querySelector("a"));
    expect(getComputedStyle(link).color).toBe(getComputedStyle(railHost).color);
  });
});
