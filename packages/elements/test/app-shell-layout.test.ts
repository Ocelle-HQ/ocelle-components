import { describe, expect, it } from "vitest";
import { type AppShellTier } from "../src/ocelle-app-shell.ts";
import "../src/ocelle-app-shell.ts";
import { inProcessDriver } from "./in-process.ts";

const driver = inProcessDriver();

function required<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error("Expected a mounted element");
  return value;
}

async function mount(attributes = "", content = '<section id="panel">Workspaces</section>'): Promise<HTMLElementTagNameMap["ocelle-app-shell"]> {
  await driver.mount(`<div id="frame"><ocelle-app-shell id="shell" product-name="Kitty" ${attributes}>${content}</ocelle-app-shell></div>`);
  return required(document.querySelector("ocelle-app-shell"));
}

function size(inlineSize: string): void {
  required(document.getElementById("frame")).style.inlineSize = inlineSize;
}

async function tier(shell: HTMLElementTagNameMap["ocelle-app-shell"], expected: AppShellTier): Promise<void> {
  await expect.poll(() => shell.tier).toBe(expected);
  await shell.updateComplete;
}

describe("ocelle-app-shell layout", () => {
  it("uses exclusive default boundaries on its own logical border box with a fixed viewport", async () => {
    const before = window.innerWidth;
    const shell = await mount();
    shell.style.borderInline = "2px solid";
    shell.style.paddingInline = "8px";
    size("719.5px");
    await tier(shell, "narrow");
    size("720px");
    await tier(shell, "collapsed");
    size("720.5px");
    await tier(shell, "collapsed");
    size("1099.5px");
    await tier(shell, "collapsed");
    size("1100px");
    await tier(shell, "expanded");
    size("1100.5px");
    await tier(shell, "expanded");
    expect(shell.getBoundingClientRect().width).toBe(1100.5);
    expect(window.innerWidth).toBe(before);
  });

  it("treats the vertical writing-mode inline axis as the measured axis", async () => {
    const shell = await mount('narrow-below="400px" collapse-below="600px"');
    shell.style.writingMode = "vertical-rl";
    shell.style.inlineSize = "399px";
    shell.style.blockSize = "710px";
    await tier(shell, "narrow");
    shell.style.inlineSize = "400px";
    await tier(shell, "collapsed");
    shell.style.inlineSize = "600px";
    await tier(shell, "expanded");
    expect(shell.getBoundingClientRect().height).toBe(600);
  });

  it("resolves explicit px, root rem, host em and unitless zero ahead of computed tokens", async () => {
    const shell = await mount('narrow-below=" 40rem " collapse-below="40EM"');
    shell.style.fontSize = "20px";
    shell.style.setProperty("--ocelle-app-shell-narrow-below", "500px");
    shell.style.setProperty("--ocelle-app-shell-collapse-below", "900px");
    size("639px");
    await tier(shell, "narrow");
    size("640px");
    await tier(shell, "collapsed");
    size("800px");
    await tier(shell, "expanded");
    shell.narrowBelow = "0";
    shell.collapseBelow = "500.5px";
    size("501px");
    await tier(shell, "expanded");
    size("500px");
    await tier(shell, "collapsed");
    size("320px");
    await tier(shell, "collapsed");
    expect([shell.narrowBelow, shell.collapseBelow]).toEqual(["0", "500.5px"]);
  });

  it("falls through invalid and non-finite candidates, and resets inverted pairs to both defaults", async () => {
    const shell = await mount('narrow-below="50%" collapse-below="calc(300px + 1rem)"');
    shell.style.setProperty("--ocelle-app-shell-narrow-below", "500px");
    shell.style.setProperty("--ocelle-app-shell-collapse-below", "800px");
    size("650px");
    await tier(shell, "collapsed");
    shell.narrowBelow = `${"9".repeat(400)}px`;
    await shell.updateComplete;
    await tier(shell, "collapsed");
    shell.style.setProperty("--ocelle-app-shell-narrow-below", `${"9".repeat(400)}em`);
    shell.remeasure();
    await tier(shell, "narrow");
    shell.style.setProperty("--ocelle-app-shell-collapse-below", "auto");
    size("1100px");
    await tier(shell, "expanded");
    shell.narrowBelow = "900px";
    shell.collapseBelow = "500px";
    size("800px");
    await tier(shell, "collapsed");
    expect([shell.narrowBelow, shell.collapseBelow]).toEqual(["900px", "500px"]);
  });

  it("coalesces same-width remeasurement and emits one composed event per effective transition", async () => {
    const events: unknown[] = [];
    await driver.mount('<div id="frame"><ocelle-app-shell id="shell" narrow-below="400px" collapse-below="600px">Content</ocelle-app-shell></div>');
    const shell = required(document.querySelector("ocelle-app-shell"));
    required(document.getElementById("frame")).addEventListener("ocelle-app-shell-tier-change", (event) => {
      events.push({ detail: (event as CustomEvent<unknown>).detail, bubbles: event.bubbles, composed: event.composed });
    });
    size("500px");
    await tier(shell, "collapsed");
    events.length = 0;
    shell.collapseBelow = undefined;
    shell.style.setProperty("--ocelle-app-shell-collapse-below", "500px");
    shell.style.setProperty("--ocelle-app-shell-narrow-below", "500px");
    shell.narrowBelow = undefined;
    shell.remeasure();
    shell.remeasure();
    await tier(shell, "expanded");
    size("499px");
    await tier(shell, "narrow");
    size("498px");
    await tier(shell, "narrow");
    const event = (previousTier: AppShellTier, next: AppShellTier): unknown => ({ detail: { previousTier, tier: next }, bubbles: true, composed: true });
    expect(events).toEqual([event("collapsed", "expanded"), event("expanded", "narrow")]);
  });

  it("reports no initial transition and waits until a hidden frame is rendered again", async () => {
    await driver.mount('<div id="frame"></div>');
    size("500px");
    const shell = document.createElement("ocelle-app-shell");
    shell.narrowBelow = "400px";
    shell.collapseBelow = "600px";
    const received: unknown[] = [];
    shell.addEventListener("ocelle-app-shell-tier-change", (event) => { received.push((event as CustomEvent<unknown>).detail); });
    expect(shell.contentTarget).toBeNull();
    required(document.getElementById("frame")).append(shell);
    await tier(shell, "collapsed");
    expect(received).toEqual([]);
    shell.hidden = true;
    size("310px");
    shell.remeasure();
    await shell.updateComplete;
    expect(shell.tier).toBe("collapsed");
    shell.hidden = false;
    await tier(shell, "narrow");
    expect(received).toEqual([{ previousTier: "collapsed", tier: "narrow" }]);
  });

  it("remeasures a host-em threshold after a style-only font change", async () => {
    const shell = await mount('narrow-below="20em" collapse-below="30em"');
    shell.style.fontSize = "20px";
    size("500px");
    await tier(shell, "collapsed");
    shell.style.fontSize = "25px";
    shell.remeasure();
    await tier(shell, "collapsed");
    shell.style.fontSize = "26px";
    shell.remeasure();
    await tier(shell, "narrow");
    expect(shell.getBoundingClientRect().width).toBe(500);
  });

  it("keeps the same main node and constrains layout growth from intrinsic content", async () => {
    const shell = await mount("", '<p id="panel">Content</p>');
    size("800px");
    await tier(shell, "collapsed");
    const main = shell.contentTarget;
    expect(main?.localName).toBe("main");
    expect(main?.tabIndex).toBe(-1);
    required(document.getElementById("panel")).textContent = "workspaces".repeat(200);
    shell.remeasure();
    await tier(shell, "collapsed");
    expect(shell.getBoundingClientRect().width).toBe(800);
    size("710px");
    await tier(shell, "narrow");
    expect(shell.contentTarget).toBe(main);
  });

  it("measures the border box when the consumer switches to content-box sizing", async () => {
    const shell = await mount('narrow-below="400px" collapse-below="600px" flush-block-end flush-inline-end');
    shell.style.boxSizing = "content-box";
    shell.style.borderInline = "2px solid";
    shell.style.paddingInline = "8px";
    shell.style.inlineSize = "379px";
    await tier(shell, "narrow");
    shell.style.inlineSize = "380px";
    await tier(shell, "collapsed");
    shell.style.inlineSize = "580px";
    await tier(shell, "expanded");
    expect(shell.getBoundingClientRect().width).toBe(600);
    const main = required(shell.contentTarget);
    expect(getComputedStyle(main).paddingBlockEnd).toBe("0px");
    expect(getComputedStyle(main).paddingInlineEnd).toBe("0px");
  });

  it.each(["ltr", "rtl"])("opts each logical end out independently in %s", async (direction) => {
    const shell = await mount(`dir="${direction}"`);
    await tier(shell, "expanded");
    const main = shell.contentTarget;
    expect(main?.getAttribute("part")).toBe("main");
    const read = (): readonly string[] => {
      const css = getComputedStyle(required(main));
      return [css.paddingBlockStart, css.paddingInlineStart, css.paddingBlockEnd, css.paddingInlineEnd];
    };
    const initial = read();
    expect(initial).toEqual(["16px", "16px", "16px", "16px"]);
    shell.flushBlockEnd = true;
    await shell.updateComplete;
    expect(read()).toEqual(["16px", "16px", "0px", "16px"]);
    shell.flushBlockEnd = false;
    shell.flushInlineEnd = true;
    await shell.updateComplete;
    expect(read()).toEqual(["16px", "16px", "16px", "0px"]);
    shell.flushBlockEnd = true;
    await shell.updateComplete;
    expect(read()).toEqual(["16px", "16px", "0px", "0px"]);
    const panel = required(document.getElementById("panel")).getBoundingClientRect();
    const frame = required(main).getBoundingClientRect();
    expect(panel.bottom).toBe(frame.bottom);
    expect(direction === "ltr" ? panel.right : panel.left).toBe(direction === "ltr" ? frame.right : frame.left);
  });
});
