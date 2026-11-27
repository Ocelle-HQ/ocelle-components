import { afterEach, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-anchored-popover.ts";

const buttons = {
  left: { button: 0, buttons: 1 },
  right: { button: 2, buttons: 2 },
} as const;

const fixtureId = "popover-chord-fixture";

afterEach(() => {
  document.getElementById(fixtureId)?.remove();
});

async function mount() {
  const fixture = document.createElement("main");
  fixture.id = fixtureId;
  fixture.innerHTML = `
    <ocelle-anchored-popover label="Appearance">
      <button type="button">Use system appearance</button>
    </ocelle-anchored-popover>
    <button type="button">Outside</button>
  `;
  const host = fixture.querySelector("ocelle-anchored-popover");
  const outside = fixture.querySelector<HTMLButtonElement>(":scope > button");
  if (!host || !outside) throw new Error("missing popover fixture controls");
  Object.assign(outside.style, { position: "fixed", left: "350px", top: "24px", width: "120px", height: "40px" });
  outside.addEventListener("contextmenu", (event) => { event.preventDefault(); });
  document.body.append(fixture);
  await host.updateComplete;
  const trigger = host.shadowRoot?.querySelector<HTMLButtonElement>("[part=trigger]");
  const panel = host.shadowRoot?.querySelector<HTMLElement>("[part=surface]");
  if (!trigger || !panel) throw new Error("missing rendered popover parts");
  Object.assign(panel.style, { position: "fixed", inset: "auto", left: "70px", top: "150px", margin: "0" });
  return { outside, trigger, panel };
}

it.each([
  { first: "right", last: "left" },
  { first: "left", last: "right" },
] as const)("keeps the popover open when a $first press ends with a $last release outside", async ({ first, last }) => {
  const { outside, trigger, panel } = await mount();
  const { left, top, width, height } = outside.getBoundingClientRect();
  const point = { x: Math.floor(left + width / 2), y: Math.floor(top + height / 2) };
  expect(document.elementFromPoint(point.x, point.y)).toBe(outside);
  trigger.focus();
  await commands.press("Enter");
  expect(panel.matches(":popover-open")).toBe(true);

  const edges: PointerEvent[] = [];
  const record = (event: PointerEvent): void => { edges.push(event); };
  outside.addEventListener("pointerdown", record);
  outside.addEventListener("pointerup", record);

  // Chord transitions generate one pointerdown on the first press and one pointerup on the last release.
  await commands.pointerPath([
    { ...point, down: true, button: first },
    { ...point, down: true, button: last, still: true },
    { ...point, up: true, button: first, still: true },
    { ...point, up: true, button: last, still: true },
  ]);
  const pointerId = edges[0]?.pointerId;
  expect(pointerId).toBeGreaterThan(0);
  expect(edges).toEqual([
    expect.objectContaining({
      type: "pointerdown", ...buttons[first], pointerId, pointerType: "mouse", isPrimary: true,
      isTrusted: true, clientX: point.x, clientY: point.y, target: outside,
    }),
    expect.objectContaining({
      type: "pointerup", button: buttons[last].button, buttons: 0, pointerId, pointerType: "mouse",
      isPrimary: true, isTrusted: true, clientX: point.x, clientY: point.y, target: outside,
    }),
  ]);
  expect(panel.matches(":popover-open")).toBe(true);

  await commands.pointerPath([{ ...point, down: true }, { ...point, up: true, still: true }]);
  expect(panel.matches(":popover-open")).toBe(false);
});
