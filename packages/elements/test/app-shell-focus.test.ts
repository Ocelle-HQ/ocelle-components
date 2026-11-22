import { describe, expect, it } from "vitest";
import { deepActive } from "../src/focusable.ts";
import { close, focused, menu, mount, open, panel, rail, required, resize, sidebar } from "./app-shell-drawer-fixture.ts";

describe("app shell drawer focus", () => {
  it("retains a destination on same-tier narrow resize and restores its identity after widening", async () => {
    const shell = await mount("mission", rail + sidebar);
    await open(shell);
    const destination = required(document.getElementById("files"));
    destination.focus();
    resize(680);
    await expect.poll(() => shell.getBoundingClientRect().width).toBe(680);
    expect(panel(shell)?.open).toBe(true);
    await focused(destination);
    resize(850);
    await expect.poll(() => panel(shell)?.open).toBe(false);
    await focused(destination);
    resize(1150);
    await expect.poll(() => shell.tier).toBe("expanded");
    await focused(destination);
    resize(850);
    await expect.poll(() => shell.tier).toBe("collapsed");
    await focused(destination);
    resize(690);
    await expect.poll(() => deepActive() === menu(shell) && menu(shell) !== null).toBe(true);
  });

  it("moves from close to the first available destination after leaving narrow", async () => {
    const shell = await mount("project", sidebar);
    await open(shell);
    close(shell).focus();
    resize(1150);
    await expect.poll(() => panel(shell)?.open).toBe(false);
    await focused(document.getElementById("work"));
  });

  it("falls back to the next destination or main when a drawer destination is removed", async () => {
    const shell = await mount("project", sidebar);
    await open(shell);
    required(document.getElementById("work")).remove();
    await focused(document.getElementById("files"));
    required(document.getElementById("files")).remove();
    await expect.poll(() => panel(shell)?.open).toBe(false);
    await focused(shell.contentTarget);
    expect(menu(shell)).toBeNull();
  });

  it("moves from a removed rail to the sidebar inside an open drawer on a same-width layout change", async () => {
    const shell = await mount("mission", rail + sidebar);
    await open(shell);
    await focused(document.getElementById("account"));
    shell.layout = "project";
    await focused(document.getElementById("work"));
    expect(panel(shell)?.open).toBe(true);
    resize(850);
    await expect.poll(() => panel(shell)?.open).toBe(false);
    await focused(document.getElementById("work"));
  });

  it("falls back to the first surviving destination after a layout and tier change together", async () => {
    const shell = await mount("mission", rail + sidebar);
    await open(shell);
    await focused(document.getElementById("account"));
    shell.layout = "project";
    resize(850);
    await expect.poll(() => panel(shell)?.open).toBe(false);
    await focused(document.getElementById("work"));
  });

  it("uses the close control when the open drawer still has a region but no sequential destination", async () => {
    const shell = await mount("mission", rail + '<div slot="sidebar">Overview</div>');
    await open(shell);
    shell.layout = "project";
    await focused(close(shell));
    expect(panel(shell)?.open).toBe(true);
  });

  it("keeps the former drawer destination through a second real resize during exit", async () => {
    const shell = await mount("project", sidebar);
    await open(shell);
    const dialog = required(panel(shell));
    for (const animation of dialog.getAnimations()) animation.finish();
    const destination = required(document.getElementById("files"));
    destination.focus();
    shell.style.setProperty("--ocelle-motion-base", "10s");
    const order: string[] = [];
    shell.addEventListener("ocelle-drawer-close", () => { order.push("close"); });
    resize(850);
    await expect.poll(() => shell.tier).toBe("collapsed");
    await expect.poll(() => dialog.getAnimations().length).toBe(1);
    const exit = required(dialog.getAnimations()[0]);
    exit.pause();
    expect(dialog.open).toBe(true);
    destination.blur();
    expect(deepActive()).not.toBe(destination);

    const { promise, resolve } = Promise.withResolvers<boolean>();
    const observer = new ResizeObserver(([entry]) => {
      if (entry?.borderBoxSize[0]?.inlineSize === 900) {
        order.push("resize");
        resolve(true);
      }
    });
    try {
      observer.observe(shell, { box: "border-box" });
      resize(900);
      await promise;
      await shell.updateComplete;
      expect(order).toEqual(["resize"]);
      exit.finish();
      await expect.poll(() => order).toEqual(["resize", "close"]);
      await focused(destination);
    } finally {
      observer.disconnect();
    }
  });
});
