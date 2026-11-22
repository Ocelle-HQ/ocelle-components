import { describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { deepActive } from "../src/focusable.ts";
import "../src/ocelle-app-shell.ts";
import "../src/ocelle-skip-link.ts";
import { inProcessDriver } from "./in-process.ts";

const driver = inProcessDriver();

function required<T>(value: T | undefined | null): T {
  if (value == null) throw new Error("Missing skip-link fixture node");
  return value;
}

function control(skip: HTMLElementTagNameMap["ocelle-skip-link"]): HTMLButtonElement {
  return required(skip.shadowRoot?.querySelector("button"));
}

describe("ocelle-skip-link", () => {
  it("reveals the localized control on first Tab and continues after the first selector match", async () => {
    await driver.mount('<ocelle-skip-link id="skip" target-selector=".destination">Zum Inhalt</ocelle-skip-link><button>Navigation</button><main class="destination" tabindex="-1"><button id="next">Next</button></main><aside class="destination" tabindex="-1"></aside>');
    const skip = required(document.querySelector("ocelle-skip-link"));
    const button = control(skip);
    const style = getComputedStyle(button);
    expect(style.clipPath).not.toBe("none");
    await commands.press("Tab");
    expect(deepActive()).toBe(button);
    expect(style.clipPath).toBe("none");
    expect(style.outlineStyle).toBe("solid");
    expect((await commands.axState("skip", "button")).name).toBe("Zum Inhalt");
    await commands.press("Enter");
    expect(deepActive()).toBe(document.querySelector("main"));
    await commands.press("Tab");
    expect(deepActive()?.id).toBe("next");
  });

  it("uses the containing shadow root and only its first matching target", async () => {
    await driver.mount('<div class="destination" tabindex="-1"></div><div id="host"></div>');
    const host = required(document.getElementById("host"));
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = '<ocelle-skip-link id="skip" target-selector=".destination"></ocelle-skip-link><main class="destination" tabindex="-1"></main><aside class="destination" tabindex="-1"></aside>';
    const skip = required(root.querySelector("ocelle-skip-link"));
    await skip.updateComplete;
    const button = control(skip);
    button.focus();
    await commands.press("Space");
    expect(root.activeElement).toBe(root.querySelector("main"));
    expect(button.textContent).toContain("Skip to main content");
  });

  it("uses a direct cross-root reference before the selector and continues into shell content", async () => {
    await driver.mount('<ocelle-app-shell><ocelle-skip-link slot="skip-link" target-selector="#other"></ocelle-skip-link><button id="primary">Primary action</button></ocelle-app-shell><aside id="other" tabindex="-1"></aside>');
    const shell = required(document.querySelector("ocelle-app-shell"));
    const skip = required(document.querySelector("ocelle-skip-link"));
    await shell.updateComplete;
    skip.target = required(shell.contentTarget);
    await commands.press("Tab");
    expect(deepActive()).toBe(control(skip));
    await commands.press("Enter");
    expect(deepActive()).toBe(shell.contentTarget);
    await commands.press("Tab");
    expect(deepActive()?.id).toBe("primary");
  });

  it("re-resolves the selector at activation and follows the first remaining match", async () => {
    await driver.mount('<ocelle-skip-link target="#new"></ocelle-skip-link><main id="old" class="candidate" tabindex="-1"></main><main id="new" class="candidate" tabindex="-1"></main>');
    const skip = required(document.querySelector("ocelle-skip-link"));
    expect(skip.target).toBeNull();
    expect(skip.targetSelector).toBe("");
    skip.targetSelector = ".candidate";
    const button = control(skip);
    button.focus();
    document.getElementById("old")?.remove();
    await commands.press("Enter");
    expect(deepActive()?.id).toBe("new");
  });

  it("does not pass over the first matching destination when it cannot be focused", async () => {
    await driver.mount('<ocelle-skip-link target-selector=".candidate"></ocelle-skip-link><main class="candidate" hidden tabindex="-1"></main><main class="candidate" tabindex="-1"></main>');
    const button = control(required(document.querySelector("ocelle-skip-link")));
    button.focus();
    await commands.press("Enter");
    expect(deepActive()).toBe(button);
  });

  it.each([
    ["malformed selector", "[", "", false],
    ["missing match", "#missing", "", false],
    ["hidden target", "#target", '<main id="target" hidden tabindex="-1"></main>', false],
    ["not focusable", "#target", '<main id="target"></main>', false],
    ["disconnected reference with a valid selector", "#target", '<main id="target" tabindex="-1"></main>', true],
    ["non-HTML match", "#target", '<svg id="target" tabindex="-1"></svg>', false],
  ] as const)("retains focus with a %s and then continues on Tab", async (_case, selector, target, detached) => {
    await driver.mount(`<ocelle-skip-link></ocelle-skip-link><button id="next">Navigation</button>${target}`);
    const skip = required(document.querySelector("ocelle-skip-link"));
    skip.targetSelector = selector;
    if (detached) {
      const reference = document.createElement("main");
      reference.tabIndex = -1;
      skip.target = reference;
    }
    const button = control(skip);
    button.focus();
    await commands.press("Enter");
    expect(deepActive()).toBe(button);
    await commands.press("Tab");
    expect(deepActive()?.id).toBe("next");
  });
});
