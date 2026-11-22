import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { contrastRatio } from "../../../gates/lib/wcag.ts";
import { click, close, driver, focused, menu, mount, open, panel, rail, required, resize, sidebar } from "./app-shell-drawer-fixture.ts";

beforeEach(async () => {
  await commands.emulateReducedMotion("reduce");
});

afterEach(async () => {
  await commands.emulateReducedMotion("no-preference");
});

describe("app shell drawer", () => {
  it.each([
    { layout: "mission", input: "pointer", first: "account", names: ["Konto", "Projekte"] },
    { layout: "project", input: "Enter", first: "work", names: ["Projekte"] },
    { layout: "personal", input: "Space", first: "work", names: ["Projekte"] },
  ])("opens $layout navigation with $input and preserves one localized landmark per region", async ({ layout, input, first, names }) => {
    const shell = await mount(layout, rail + sidebar);
    const requests: Event[] = [];
    shell.addEventListener("ocelle-top-bar-menu-request", (event) => { requests.push(event); });
    await open(shell, input);
    expect(requests).toEqual([]);
    await focused(document.getElementById(first));
    expect(menu(shell)?.getAttribute("aria-expanded")).toBe("true");
    expect(close(shell).getAttribute("aria-label")).toBe("Bereiche schließen");
    required(panel(shell)).id = "drawer-panel";
    const tree = await commands.axTree("drawer-panel", "subtree");
    expect(tree.find((node) => node.role === "dialog")?.name).toBe("Bereiche");
    expect(tree.filter((node) => node.role === "navigation").map((node) => node.name)).toEqual(names);
  });

  it("keeps a bare rail link readable against chrome beside content and in the drawer", async () => {
    const shell = await mount("mission", rail + sidebar, 1150);
    const link = required(document.getElementById("account"));
    const rgb = (color: string): string => `#${required(/^rgb\((\d+), (\d+), (\d+)\)$/.exec(color))
      .slice(1).map((channel) => Number(channel).toString(16).padStart(2, "0")).join("")}`;
    const ratio = (): number => {
      const region = required(shell.shadowRoot?.querySelector(".rail"));
      return contrastRatio(rgb(getComputedStyle(link).color), rgb(getComputedStyle(region).backgroundColor));
    };
    expect(ratio()).toBeGreaterThanOrEqual(4.5);
    resize(700);
    await open(shell);
    expect(ratio()).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    { row: "sequential before flat order", first: "", second: 'tabindex="1"', expected: "second" },
    { row: "sequential before autofocus", first: "", second: "autofocus", expected: "first" },
  ])("focuses the first supplied destination in $row", async ({ first, second, expected }) => {
    const shell = await mount("project", `<nav slot="sidebar" aria-label="Projekte"><a id="first" href="#one" ${first}>One</a><a id="second" href="#two" ${second}>Two</a></nav>`);
    await open(shell);
    expect(document.getElementById(expected)).toBe(document.activeElement);
  });

  it("wraps forward and reverse and returns focus to the menu on Escape", async () => {
    const shell = await mount("project", sidebar);
    await open(shell);
    await focused(document.getElementById("work"));
    await commands.press("Tab", ["Shift"]);
    await focused(close(shell));
    await commands.press("Tab", ["Shift"]);
    await focused(document.getElementById("files"));
    await commands.press("Tab");
    await focused(close(shell));
    await commands.press("Escape");
    await expect.poll(() => panel(shell)?.open).toBe(false);
    await focused(menu(shell));
    expect(menu(shell)?.getAttribute("aria-expanded")).toBe("false");
  });

  it.each(["close", "backdrop"])("restores the menu after dismissal by %s", async (method) => {
    const shell = await mount("mission", rail + sidebar);
    await open(shell);
    let completions = 0;
    shell.addEventListener("ocelle-drawer-close", () => { completions++; });
    if (method === "close") await click(close(shell));
    else {
      const rect = required(panel(shell)).getBoundingClientRect();
      await driver.pointer([{ x: rect.right + 20, y: rect.y + 40, down: true, up: true }]);
    }
    await expect.poll(() => panel(shell)?.open).toBe(false);
    await focused(menu(shell));
    expect(completions).toBe(1);
  });

  it("reflects the accepted close request while navigation stays projected during the exit", async () => {
    const shell = await mount("project", sidebar);
    await open(shell);
    const dialog = required(panel(shell));
    await commands.emulateReducedMotion("no-preference");
    shell.style.setProperty("--ocelle-motion-base", "10s");
    await commands.press("Escape");
    await expect.poll(() => menu(shell)?.getAttribute("aria-expanded")).toBe("false");
    expect(dialog.open).toBe(true);
    expect(required(document.getElementById("work")).getClientRects().length).toBeGreaterThan(0);
    required(dialog.getAnimations()[0]).finish();
    await expect.poll(() => dialog.open).toBe(false);
    await focused(menu(shell));
  });

  it("honors cancellation of its own close request", async () => {
    const shell = await mount("project", sidebar);
    await open(shell);
    shell.addEventListener("ocelle-drawer-close-request", (event) => { event.preventDefault(); }, { once: true });
    await commands.press("Escape");
    expect(panel(shell)?.matches(":modal")).toBe(true);
    expect(menu(shell)?.getAttribute("aria-expanded")).toBe("true");
    await commands.press("Escape");
    await expect.poll(() => panel(shell)?.open).toBe(false);
  });
});
