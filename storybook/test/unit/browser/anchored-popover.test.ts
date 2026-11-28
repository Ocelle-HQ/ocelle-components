/// <reference types="vite/client" />
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import "../../../../packages/elements/src/ocelle-anchored-popover.ts";
import { inProcessDriver } from "../../../../packages/elements/test/in-process.ts";

interface DemoHost {
  renderAnchoredPopoverAppearance(): HTMLElement;
  renderAnchoredPopoverProfile(onSignOut: () => void): HTMLElement;
}

const hosts = import.meta.glob<DemoHost>("../../../stories/anchored-popover.ts");
const styles = import.meta.glob<string>("../../../stories/anchored-popover.css", { query: "?inline", import: "default" });
const driver = inProcessDriver();

let root: HTMLElement | undefined;
let previousSheets: readonly CSSStyleSheet[] | undefined;
afterEach(() => {
  root?.remove();
  if (previousSheets !== undefined) document.adoptedStyleSheets = [...previousSheets];
  root = undefined;
  previousSheets = undefined;
});

function required<T>(value: T | null | undefined, name: string): T {
  if (value == null) throw new Error("Missing anchored popover fixture " + name);
  return value;
}

async function mount(render: (host: DemoHost) => HTMLElement, demo: string, menuName: string) {
  const loadHost = hosts["../../../stories/anchored-popover.ts"];
  const loadStyle = styles["../../../stories/anchored-popover.css"];
  expect([typeof loadHost, typeof loadStyle], "the shared anchored popover host and external stylesheet are available before loading")
    .toEqual(["function", "function"]);
  const [host, css] = await Promise.all([
    required(loadHost, "host source")(),
    required(loadStyle, "external stylesheet")(),
  ]);
  previousSheets = [...document.adoptedStyleSheets];
  await driver.mount("");
  await driver.rules(css);
  const fixture = render(host);
  root = fixture;
  document.body.append(fixture);
  const popover = required(fixture.querySelector("ocelle-anchored-popover"), "popover");
  await popover.updateComplete;
  const trigger = required(popover.shadowRoot?.querySelector<HTMLButtonElement>("button[part=trigger]"), "native trigger");
  const panel = required(popover.shadowRoot?.querySelector<HTMLElement>("[part=surface]"), "native surface");
  expect(fixture.dataset.anchoredPopoverDemo).toBe(demo);
  expect([trigger.type, trigger.getAttribute("aria-label"), trigger.getAttribute("aria-expanded")])
    .toEqual(["button", menuName, "false"]);
  expect(panel.matches(":popover-open")).toBe(false);
  return { popover, trigger, panel };
}

type Fixture = Awaited<ReturnType<typeof mount>>;

async function open({ trigger, panel }: Fixture): Promise<void> {
  trigger.focus();
  await userEvent.keyboard("{Enter}");
  expect(panel.matches(":popover-open"), "trusted Enter opens the actual surface").toBe(true);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
}

function expectClosed({ popover, trigger, panel }: Fixture): void {
  expect(panel.matches(":popover-open"), "the host action closes the actual surface").toBe(false);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(popover.shadowRoot?.activeElement).toBe(trigger);
}

function action({ popover }: Fixture, name: string): HTMLButtonElement {
  const named = [...popover.querySelectorAll("button")].find((button) =>
    (button.getAttribute("aria-label") ?? button.textContent.trim()) === name,
  );
  return required(named, name);
}

function pressed(light: HTMLButtonElement, dark: HTMLButtonElement): (string | null)[] {
  return [light.getAttribute("aria-pressed"), dark.getAttribute("aria-pressed")];
}

it("keeps exactly one fictional appearance pressed while the native panel closes and reopens", async () => {
  const fixture = await mount((host) => host.renderAnchoredPopoverAppearance(), "appearance", "Appearance menu");
  const light = action(fixture, "Light");
  const dark = action(fixture, "Dark");
  expect([light.type, dark.type]).toEqual(["button", "button"]);
  await open(fixture);
  expect(pressed(light, dark)).toEqual(["true", "false"]);
  await userEvent.tab();
  expect(document.activeElement).toBe(light);
  await userEvent.tab();
  expect(document.activeElement).toBe(dark);
  await userEvent.keyboard("{Enter}");
  expectClosed(fixture);

  await open(fixture);
  expect(pressed(light, dark)).toEqual(["false", "true"]);
  await userEvent.tab();
  expect(document.activeElement).toBe(light);
  await userEvent.keyboard("{Enter}");
  expectClosed(fixture);

  await open(fixture);
  expect(pressed(light, dark)).toEqual(["true", "false"]);
});

it("invokes the fictional host's Sign out callback once per native activation", async () => {
  let signOuts = 0;
  const fixture = await mount((host) => host.renderAnchoredPopoverProfile(() => { signOuts += 1; }), "profile", "Profile menu");
  const signOut = action(fixture, "Sign out");
  expect(signOut.type).toBe("button");
  const initials = fixture.popover.querySelector('[slot="trigger"][aria-hidden="true"]');
  expect(initials?.textContent.trim()).toMatch(/^[A-Z]{1,3}$/);
  expect(signOuts).toBe(0);

  for (const activation of [1, 2]) {
    await open(fixture);
    expect(signOuts, "opening only shows the menu").toBe(activation - 1);
    await userEvent.tab();
    expect(document.activeElement).toBe(signOut);
    await userEvent.keyboard("{Enter}");
    expect(signOuts, "one native activation sends exactly one host callback").toBe(activation);
    expectClosed(fixture);
  }
});
