import { describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-app-shell.ts";
import { deepActive } from "../src/focusable.ts";
import "../src/ocelle-breadcrumbs.ts";
import "../src/ocelle-nav-pill.ts";
import { inProcessDriver } from "./in-process.ts";

const driver = inProcessDriver();

function required<T>(node: T | null | undefined): T {
  if (node == null) throw new Error("Missing navigation fixture node");
  return node;
}

async function navigationNames(id = "shell"): Promise<string[]> {
  return (await commands.axTree(id, "subtree"))
    .filter(({ role }) => role === "navigation").map(({ name }) => name);
}

describe("shell composition with data-driven navigation", () => {
  it.each(["mission", "project"])("preserves a nav pill's name in the %s sidebar", async (layout) => {
    await driver.mount(`<ocelle-app-shell id="shell" layout="${layout}"><ocelle-nav-pill slot="sidebar" label="Project sections"></ocelle-nav-pill></ocelle-app-shell>`);
    const pill = required(document.querySelector("ocelle-nav-pill"));
    pill.items = [{ label: "Overview", href: "#overview" }];
    await pill.updateComplete;
    expect(await navigationNames()).toEqual(["Project sections"]);
  });

  it("removes an emptied pill from the expanded accessibility tree", async () => {
    await driver.mount('<ocelle-app-shell id="shell" layout="project"><ocelle-nav-pill slot="sidebar" label="Project sections"></ocelle-nav-pill></ocelle-app-shell>');
    const pill = required(document.querySelector("ocelle-nav-pill"));
    pill.items = [{ label: "Overview", href: "#overview" }];
    await pill.updateComplete;
    expect(await navigationNames()).toContain("Project sections");
    pill.items = [];
    await pill.updateComplete;
    const shell = required(document.querySelector("ocelle-app-shell"));
    const sidebar = required(shell.shadowRoot?.querySelector<HTMLElement>(".sidebar"));
    await expect.poll(() => sidebar.hidden).toBe(true);
    await expect.poll(navigationNames).toEqual([]);
  });

  it("preserves the localized breadcrumb landmark supplied through a nested wrapper", async () => {
    await driver.mount('<ocelle-app-shell id="shell" layout="project"><section slot="sidebar"><ocelle-breadcrumbs label="Project trail"></ocelle-breadcrumbs></section></ocelle-app-shell>');
    const breadcrumbs = required(document.querySelector("ocelle-breadcrumbs"));
    breadcrumbs.items = [{ label: "Projects", href: "#projects" }, { label: "Overview" }];
    await breadcrumbs.updateComplete;
    await expect.poll(navigationNames).toEqual(["Project trail"]);
    breadcrumbs.items = [];
    await breadcrumbs.updateComplete;
    await expect.poll(navigationNames).toEqual([]);
  });

  it("keeps a supplied open-shadow navigation landmark named by its owning component", async () => {
    await driver.mount('<ocelle-app-shell id="shell" layout="project"></ocelle-app-shell>');
    const shell = required(document.querySelector("ocelle-app-shell"));
    const host = document.createElement("div");
    host.slot = "sidebar";
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = '<style>nav { display: block; }</style><nav aria-label="Project tools"><slot name="tools"></slot></nav>';
    host.innerHTML = '<a slot="tools" href="#tools">Tools</a>';
    shell.append(host);
    await expect.poll(navigationNames).toEqual(["Project tools"]);
    host.hidden = true;
    await expect.poll(navigationNames).toEqual([]);
    host.hidden = false;
    await expect.poll(navigationNames).toEqual(["Project tools"]);
    const slot = required(root.querySelector("slot"));
    slot.name = "elsewhere";
    await expect.poll(navigationNames).toEqual([]);
    slot.name = "tools";
    await expect.poll(navigationNames).toEqual(["Project tools"]);
    root.querySelector("nav")?.remove();
    await expect.poll(navigationNames).toEqual([]);
  });
});

it("gives the standalone top-bar menu its fallback name when menu-label is whitespace", async () => {
  await driver.mount('<ocelle-top-bar id="top" show-menu menu-label="   "></ocelle-top-bar>');
  expect((await commands.axState("top", "button")).name).toBe("Open navigation");
});

it("updates the narrow drawer affordance when items change without a light DOM mutation", async () => {
  await driver.mount('<ocelle-app-shell id="shell" layout="project" narrow-below="10000px" collapse-below="11000px"><ocelle-nav-pill slot="sidebar" label="Project sections"></ocelle-nav-pill></ocelle-app-shell>');
  const shell = required(document.querySelector("ocelle-app-shell"));
  const pill = required(document.querySelector("ocelle-nav-pill"));
  const top = () => shell.shadowRoot?.querySelector("ocelle-top-bar");
  const hasMenu = () => top()?.showMenu;
  await expect.poll(() => shell.tier).toBe("narrow");
  pill.items = [{ label: "Overview", href: "#overview" }];
  await pill.updateComplete;
  await expect.poll(hasMenu).toBe(true);
  required(top()?.shadowRoot?.querySelector("button")).focus();
  await commands.press("Enter");
  await expect.poll(deepActive).toBe(pill.shadowRoot?.querySelector("a"));
  pill.items = [];
  await pill.updateComplete;
  await expect.poll(hasMenu).toBe(false);
  await expect.poll(deepActive).toBe(shell.contentTarget);
  pill.items = [{ label: "Tasks", href: "#tasks" }];
  await pill.updateComplete;
  await expect.poll(hasMenu).toBe(true);
  required(top()?.shadowRoot?.querySelector("button")).focus();
  await commands.press("Enter");
  const panel = required(shell.shadowRoot?.querySelector("ocelle-drawer")?.shadowRoot?.querySelector("dialog"));
  await expect.poll(() => panel.open).toBe(true);
  panel.id = "pill-drawer";
  await expect.poll(() => navigationNames("pill-drawer")).toEqual(["Project sections"]);
  await commands.press("Escape");
  await expect.poll(() => panel.open).toBe(false);
});
