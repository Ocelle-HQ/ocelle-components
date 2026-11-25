import { describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-app-shell.ts";
import { deepActive } from "../src/focusable.ts";
import { inProcessDriver } from "./in-process.ts";

const driver = inProcessDriver();

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error("Missing shell action fixture node");
  return value;
}

function actionsVisible(shell: HTMLElementTagNameMap["ocelle-app-shell"]): boolean {
  const actions = shell.shadowRoot?.querySelector("ocelle-top-bar")?.shadowRoot?.querySelector<HTMLElement>('[part="actions"]');
  return actions?.hidden === false;
}

describe("ocelle-app-shell top-bar actions", () => {
  it("ignores comments, whitespace and inactive children in nested action wrappers", async () => {
    await driver.mount('<ocelle-app-shell><div slot="actions"><section id="group"><!-- placeholder --><button hidden>Hidden</button><template>Template</template><script type="application/json">"Data"</script></section></div></ocelle-app-shell>');
    const shell = required(document.querySelector("ocelle-app-shell"));
    const group = required(document.getElementById("group"));
    expect(actionsVisible(shell)).toBe(false);

    const text = document.createTextNode(" \t\n ");
    group.append(text);
    expect(actionsVisible(shell)).toBe(false);
    text.data = " Ready ";
    await expect.poll(() => actionsVisible(shell)).toBe(true);
    text.data = " \t ";
    await expect.poll(() => actionsVisible(shell)).toBe(false);
  });

  it("projects and activates a bare icon action with an accessible name and no text", async () => {
    await driver.mount('<ocelle-app-shell id="shell"><button slot="actions" aria-label="Build" id="build"></button><button id="main">Main action</button></ocelle-app-shell>');
    const shell = required(document.querySelector("ocelle-app-shell"));
    const build = required(document.getElementById("build"));
    let activations = 0;
    build.addEventListener("click", () => { activations += 1; });
    expect(actionsVisible(shell)).toBe(true);
    await commands.press("Tab");
    expect(deepActive()).toBe(build);
    await commands.press("Enter");
    expect(activations).toBe(1);
    build.hidden = true;
    await expect.poll(() => actionsVisible(shell)).toBe(false);
  });

  it("keeps a genuinely empty action wrapper out of the top bar", async () => {
    await driver.mount('<ocelle-app-shell><div slot="actions"><span></span></div></ocelle-app-shell>');
    const shell = required(document.querySelector("ocelle-app-shell"));
    expect(actionsVisible(shell)).toBe(false);
  });
});
