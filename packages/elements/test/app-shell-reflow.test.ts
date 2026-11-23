import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { driver, focused, menu, mount, open, panel, rail, required, sidebar } from "./app-shell-drawer-fixture.ts";

afterEach(async () => {
  await driver.viewport(1280, 800);
  await commands.emulateForcedColors("none");
  await commands.emulateReducedMotion("no-preference");
});

describe("app shell narrow reflow", () => {
  it.each(["mission", "project", "personal"])("fits and operates by keyboard at 320px in %s layout", async (layout) => {
    await driver.viewport(320, 800);
    await commands.emulateForcedColors("active");
    await commands.emulateReducedMotion("reduce");
    const shell = await mount(layout, rail + sidebar.replace("Arbeitsbereich", "Arbeitsbereichsorganisation und Projekteinstellungen"), 320);
    const trigger = required(menu(shell));
    const style = getComputedStyle(trigger);
    const minimum = Number.parseFloat(style.minInlineSize);
    const hit = trigger.getBoundingClientRect();
    expect(minimum).toBeGreaterThanOrEqual(24);
    expect(hit.width).toBeGreaterThanOrEqual(minimum);
    expect(hit.height).toBeGreaterThanOrEqual(minimum);
    expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
    await open(shell);
    expect(panel(shell)?.getAnimations()).toHaveLength(0);
    expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
    const destination = required(document.getElementById(layout === "mission" ? "account" : "work"));
    await focused(destination);
    expect(destination.matches(":focus-visible")).toBe(true);
    await commands.press("Escape");
    await expect.poll(() => panel(shell)?.open).toBe(false);
    await focused(trigger);
    const main = required(document.getElementById("content"));
    await commands.press("Tab");
    await commands.press("Tab");
    await focused(main);
  });

  it("keeps main available and omits the trigger and modal when navigation is absent", async () => {
    await driver.viewport(320, 800);
    const shell = await mount("project", rail, 320);
    expect(menu(shell)).toBeNull();
    expect(panel(shell)?.open ?? false).toBe(false);
    expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
    required(document.getElementById("content")).focus();
    await focused(document.getElementById("content"));
  });
});
