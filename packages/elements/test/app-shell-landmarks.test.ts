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

async function navigationNames(id: string): Promise<string[]> {
  return (await commands.axTree(id, "subtree"))
    .filter(({ role }) => role === "navigation").map(({ name }) => name);
}

describe("shell composition with data-driven navigation", () => {
  it.each(["mission", "project"])("preserves a nav pill's name in the %s sidebar", async (layout) => {
    await driver.mount(`<ocelle-app-shell id="shell" layout="${layout}"><ocelle-nav-pill slot="sidebar" label="Project sections"></ocelle-nav-pill></ocelle-app-shell>`);
    const pill = required(document.querySelector("ocelle-nav-pill"));
    pill.items = [{ label: "Overview", href: "#overview" }];
    await pill.updateComplete;
    expect(await navigationNames("shell")).toEqual(["Project sections"]);
  });

  it("removes an emptied pill from the expanded accessibility tree", async () => {
    await driver.mount('<ocelle-app-shell id="shell" layout="project"><ocelle-nav-pill slot="sidebar" label="Project sections"></ocelle-nav-pill></ocelle-app-shell>');
    const pill = required(document.querySelector("ocelle-nav-pill"));
    pill.items = [{ label: "Overview", href: "#overview" }];
    await pill.updateComplete;
    expect(await navigationNames("shell")).toContain("Project sections");
    pill.items = [];
    await pill.updateComplete;
    const shell = required(document.querySelector("ocelle-app-shell"));
    const sidebar = required(shell.shadowRoot?.querySelector<HTMLElement>(".sidebar"));
    await expect.poll(() => sidebar.hidden).toBe(true);
    await expect.poll(() => navigationNames("shell")).toEqual([]);
  });

  it("preserves the localized breadcrumb landmark supplied through a nested wrapper", async () => {
    await driver.mount('<ocelle-app-shell id="shell" layout="project"><section slot="sidebar"><ocelle-breadcrumbs label="Project trail"></ocelle-breadcrumbs></section></ocelle-app-shell>');
    const breadcrumbs = required(document.querySelector("ocelle-breadcrumbs"));
    breadcrumbs.items = [{ label: "Projects", href: "#projects" }, { label: "Overview" }];
    await breadcrumbs.updateComplete;
    await expect.poll(() => navigationNames("shell")).toEqual(["Project trail"]);
    breadcrumbs.items = [];
    await breadcrumbs.updateComplete;
    await expect.poll(() => navigationNames("shell")).toEqual([]);
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
    await expect.poll(() => navigationNames("shell")).toEqual(["Project tools"]);
    host.hidden = true;
    await expect.poll(() => navigationNames("shell")).toEqual([]);
    host.hidden = false;
    await expect.poll(() => navigationNames("shell")).toEqual(["Project tools"]);
    const slot = required(root.querySelector("slot"));
    slot.name = "elsewhere";
    await expect.poll(() => navigationNames("shell")).toEqual([]);
    slot.name = "tools";
    await expect.poll(() => navigationNames("shell")).toEqual(["Project tools"]);
    root.querySelector("nav")?.remove();
    await expect.poll(() => navigationNames("shell")).toEqual([]);
  });
});

it("keeps a supplied landmark through a light wrapper, followed by bare controls", async () => {
  await driver.mount('<ocelle-app-shell id="shell"><form slot="sidebar"><nav aria-label="Tools"><a href="#tools">Tools</a></nav></form><button slot="sidebar" aria-label="More"></button></ocelle-app-shell>');
  const shell = required(document.querySelector("ocelle-app-shell"));
  expect(await navigationNames("shell")).toEqual(["Tools"]);
  required(shell.querySelector("form")).remove();
  await expect.poll(() => navigationNames("shell")).toEqual(["Workspace"]);
});

it("tracks role, visibility, and text changes in the open shadow region", async () => {
  await driver.mount('<ocelle-app-shell id="shell"></ocelle-app-shell>');
  const shell = required(document.querySelector("ocelle-app-shell"));
  const host = document.createElement("div");
  host.slot = "sidebar";
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = '<div role="navigation" aria-label="Tools">Tools</div>';
  shell.append(host);
  const region = required(root.querySelector("div"));
  await expect.poll(() => navigationNames("shell")).toEqual(["Tools"]);
  region.removeAttribute("role");
  await expect.poll(() => navigationNames("shell")).toEqual(["Workspace"]);
  region.hidden = true;
  await expect.poll(() => navigationNames("shell")).toEqual([]);
  region.hidden = false;
  await expect.poll(() => navigationNames("shell")).toEqual(["Workspace"]);
  const text = required(region.firstChild) as Text;
  text.data = " ";
  await expect.poll(() => navigationNames("shell")).toEqual([]);
  text.data = "Tools";
  await expect.poll(() => navigationNames("shell")).toEqual(["Workspace"]);
});

it("tracks fallback and reassigned slot children across nested open roots", async () => {
  await driver.mount('<ocelle-app-shell id="shell"></ocelle-app-shell>');
  const shell = required(document.querySelector("ocelle-app-shell"));
  const outer = document.createElement("div");
  outer.slot = "sidebar";
  const root = outer.attachShadow({ mode: "open" });
  const inner = document.createElement("div");
  const nested = inner.attachShadow({ mode: "open" });
  nested.innerHTML = '<slot name="tools"><nav aria-label="Fallback tools"><a href="#fallback">Tools</a></nav></slot>';
  inner.innerHTML = '<nav aria-label="Assigned tools"><a href="#assigned">Tools</a></nav>';
  root.append(inner);
  shell.append(outer);
  await expect.poll(() => navigationNames("shell")).toEqual(["Fallback tools"]);
  const assigned = required(inner.querySelector("nav"));
  assigned.slot = "tools";
  await expect.poll(() => navigationNames("shell")).toEqual(["Assigned tools"]);
  assigned.slot = "";
  await expect.poll(() => navigationNames("shell")).toEqual(["Fallback tools"]);
});

it("stops observing a replaced or disconnected open navigation root", async () => {
  await driver.mount('<ocelle-app-shell id="shell"></ocelle-app-shell>');
  const shell = required(document.querySelector("ocelle-app-shell"));
  const first = document.createElement("div");
  first.slot = "sidebar";
  const firstRoot = first.attachShadow({ mode: "open" });
  firstRoot.innerHTML = '<nav aria-label="First tools"><a href="#first">Tools</a></nav>';
  shell.append(first);
  await expect.poll(() => navigationNames("shell")).toEqual(["First tools"]);
  const second = document.createElement("div");
  second.slot = "sidebar";
  const secondRoot = second.attachShadow({ mode: "open" });
  secondRoot.innerHTML = '<nav aria-label="Second tools"><a href="#second">Tools</a></nav>';
  first.replaceWith(second);
  await expect.poll(() => navigationNames("shell")).toEqual(["Second tools"]);
  const settled = shell.updateComplete;
  firstRoot.replaceChildren();
  await new Promise(requestAnimationFrame);
  expect(shell.updateComplete).toBe(settled);
  const parent = required(shell.parentElement);
  shell.remove();
  const detached = shell.updateComplete;
  const secondNav = required(secondRoot.querySelector("nav"));
  secondNav.hidden = true;
  await new Promise(requestAnimationFrame);
  expect(shell.updateComplete).toBe(detached);
  parent.append(shell);
  await expect.poll(() => navigationNames("shell")).toEqual([]);
  secondNav.hidden = false;
  await expect.poll(() => navigationNames("shell")).toEqual(["Second tools"]);
});

it("shows the narrow menu for a mission rail alone and applies its chrome foreground", async () => {
  await driver.mount('<ocelle-app-shell id="shell" narrow-below="10000px" collapse-below="11000px"><ocelle-nav-item slot="rail" label="Overview" href="#overview"></ocelle-nav-item></ocelle-app-shell>');
  const shell = required(document.querySelector("ocelle-app-shell"));
  const item = required(document.querySelector("ocelle-nav-item"));
  const top = () => shell.shadowRoot?.querySelector("ocelle-top-bar");
  const hasMenu = () => top()?.showMenu;
  const color = () => getComputedStyle(required(item.shadowRoot?.querySelector("a"))).color;
  item.style.setProperty("--ocelle-color-link", "rgb(1, 2, 3)");
  item.style.setProperty("--ocelle-color-chrome-ink", "rgb(4, 5, 6)");
  await expect.poll(hasMenu).toBe(true);
  await expect.poll(color).toBe("rgb(4, 5, 6)");
  shell.layout = "project";
  await expect.poll(hasMenu).toBe(false);
  await expect.poll(color).toBe("rgb(1, 2, 3)");
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
