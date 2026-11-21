import { afterEach, describe, expect, it } from "vitest";
import { inProcessDriver } from "./in-process.ts";
import { driverRecorderScenarios } from "./scenarios/driver-recorders.ts";
import type { InPage } from "./scenarios/driver.ts";

// The driver recorders of 014 (research.md R-07, R-11, T003), in process: the keydown recorder at the document in the
// bubble phase, the clipboard observer installed at every mount, the record of an activation (click, end of the click's
// task, first frame, request) and the accessibility tree updates of a subtree (`Accessibility.nodesUpdated`). Every body
// of scenarios/driver-recorders.ts runs here; test/browser/driver.test.ts runs them on the fixture driver.
const driver = inProcessDriver();
const inPage: InPage = async (fn, arg) => fn(arg);

afterEach(() => {
  document.body.replaceChildren();
});

describe("the driver recorders, in process (014 R-07, R-11)", () => {
  it.each(driverRecorderScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver, inPage)).toEqual(expected);
  });
});
