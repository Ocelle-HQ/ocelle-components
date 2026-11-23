import { expect, it } from "vitest";
import "../src/ocelle-nav-item.ts";
import { inProcessDriver } from "./in-process.ts";

const driver = inProcessDriver();

it("activates a compact nav link on the first touch without opening its bubble", async () => {
  await driver.mount('<ocelle-nav-item id="nav" compact label="Projects" href="#projects"></ocelle-nav-item>');
  const item = document.querySelector("ocelle-nav-item");
  await driver.touchTap("nav", "a");
  expect((await driver.navigations()).map(({ href }) => href)).toEqual(["#projects"]);
  expect(item?.shadowRoot?.querySelector("ocelle-tooltip")?.shadowRoot?.querySelector('[part="bubble"]')?.matches(":popover-open")).toBe(false);
});
