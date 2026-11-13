import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";

// The `touchTap(x, y)` browser command of 008 (research.md R-14; tasks.md T003), in the `elements-touch` project, whose
// context has `hasTouch`: a real tap through Playwright's touchscreen at a point of this test's frame, the frame's
// offset in the runner page added. A plain button stands in for an element.
afterEach(() => {
  document.body.replaceChildren();
});

describe("touchTap(x, y)", () => {
  it("taps the button whose centre is at the point, with a pointerdown and a pointerup of pointer type touch there", async () => {
    const button = document.createElement("button");
    button.id = "tap";
    button.textContent = "Tap";
    Object.assign(button.style, { position: "fixed", left: "100px", top: "100px", width: "80px", height: "40px", margin: "0" });
    document.body.append(button);
    const log: string[] = [];
    for (const type of ["pointerdown", "pointerup"]) {
      button.addEventListener(type, (event) => {
        const pointer = event as PointerEvent;
        log.push(`${pointer.type} ${pointer.pointerType} ${String(Math.round(pointer.clientX))} ${String(Math.round(pointer.clientY))}`);
      });
    }
    await commands.touchTap(140, 120);
    expect(log).toEqual(["pointerdown touch 140 120", "pointerup touch 140 120"]);
  });
});
