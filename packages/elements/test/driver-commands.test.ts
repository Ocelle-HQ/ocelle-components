import { afterEach, describe, expect, it } from "vitest";
import "../src/ocelle-icon.ts";
import { inProcessDriver } from "./in-process.ts";
import { driverCommandScenarios } from "./scenarios/driver-commands.ts";
import type { InPage } from "./scenarios/driver.ts";

// The driver commands of 014 (research.md R-11, T002), in process: real keyboard and mouse input (`pressKeys`, `clickTarget` with
// button, modifiers and count), child targets, the focused element through shadow roots, DOM steps in one task, the
// resize that does not wait for a frame and the wait for its delivery, shadow parts' computed styles, the page's scroll
// offset and viewport. Every body of scenarios/driver-commands.ts runs here; test/browser/driver.test.ts runs the same
// bodies on the fixture driver.
const driver = inProcessDriver();
const inPage: InPage = async (fn, arg) => fn(arg);

afterEach(() => {
  document.body.replaceChildren();
});

describe("the driver commands, in process (014 R-11)", () => {
  it.each(driverCommandScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver, inPage)).toEqual(expected);
  });
});
