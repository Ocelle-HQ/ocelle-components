import { LitElement, html } from "lit";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { RovingController } from "../src/roving.ts";
import type { Axis } from "../src/roving.ts";

// The keyboard mechanism's controller (014 research.md R-04; T021), in process on a test host whose children are three
// focusable spans: the controller reads the host's direction at each keydown, so on the inline axis ArrowRight moves
// back under right-to-left and forward otherwise, and on the block axis the direction changes nothing; Enter and Space
// go to the host's `choose` with their default prevented; a key that is not a move is left alone. Real keyboard input.
const chosen: string[] = [];

class RovingTestHost extends LitElement {
  constructor(axis: Axis = "inline") {
    super();
    new RovingController(this, {
      axis,
      wrap: true,
      children: () => [...this.children] as HTMLElement[],
      enabled: () => true,
      choose: (child, key) => chosen.push(`${child.id} ${key}`),
    });
  }

  protected override render(): unknown {
    return html`<slot></slot>`;
  }
}
customElements.define("roving-test-host", RovingTestHost);

afterEach(() => {
  document.body.replaceChildren();
  chosen.length = 0;
});

/** Mounts the host with `dir`, focuses its first child, presses `keys` and returns the focused child's id after each. */
async function walk(dir: "ltr" | "rtl", keys: readonly string[]): Promise<unknown> {
  document.body.innerHTML = `<roving-test-host dir="${dir}"><span id="a" tabindex="0">a</span><span id="b" tabindex="-1">b</span><span id="c" tabindex="-1">c</span></roving-test-host>`;
  await document.querySelector<RovingTestHost>("roving-test-host")?.updateComplete;
  document.getElementById("a")?.focus();
  const prevented: boolean[] = [];
  const record = (event: KeyboardEvent): void => {
    prevented.push(event.defaultPrevented);
  };
  document.addEventListener("keydown", record);
  const focus: (string | undefined)[] = [];
  for (const key of keys) {
    await userEvent.keyboard(key);
    focus.push(document.activeElement?.id);
  }
  document.removeEventListener("keydown", record);
  return { focus, prevented, chosen: [...chosen.splice(0)] };
}

describe("RovingController on a host of the inline axis", () => {
  it("moves forward on ArrowRight left to right and back under right-to-left, wrapping; Enter and Space go to choose; a letter is left alone", async () => {
    expect([await walk("ltr", ["{ArrowRight}", "{ArrowRight}", "{ArrowRight}", "{Enter}", "x"]), await walk("rtl", ["{ArrowRight}", "{ArrowLeft}", "{ArrowLeft}", " "])]).toEqual([
      { focus: ["b", "c", "a", "a", "a"], prevented: [true, true, true, true, false], chosen: ["a Enter"] },
      { focus: ["c", "a", "b", "b"], prevented: [true, true, true, true], chosen: ["b  "] },
    ]);
  });
});
