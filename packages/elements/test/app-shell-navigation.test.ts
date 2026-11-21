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
    expect(shown(menu(shell))).toBe(false);
    size(850);
    await expect.poll(() => shell.tier).toBe("collapsed");
    expect(await landmarks()).toEqual(wide);
    expect(shown(document.getElementById("head"))).toBe(!compact);
    expect(shown(document.getElementById("foot"))).toBe(!compact);
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

  it("uses chrome foreground on unselected rail links in light mode", async () => {
    const shell = await mount(rail + grouped);
    await expect.poll(landmarks).toEqual(["Persönlich", "Projekte"]);
    const railHost = required(shell.querySelector("ocelle-personal-rail"));
    const link = required(railHost.querySelector("ocelle-nav-item")?.shadowRoot?.querySelector("a"));
    expect(getComputedStyle(link).color).toBe(getComputedStyle(railHost).color);
  });
});
