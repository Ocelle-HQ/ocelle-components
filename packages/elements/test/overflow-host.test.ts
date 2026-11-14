import { afterEach, describe, expect, it } from "vitest";
import "./fixtures/overflow-host.ts";
import "./fixtures/shadow-controls.ts";
import { inProcessDriver } from "./in-process.ts";
import { regionScenarios } from "./scenarios/scroller.ts";

// The overflow-region module carries the behaviour (009 spec US1 scenario 16, FR-011, SC-008; research.md R-17; T015):
// US1 scenarios 1, 3, 4 and 12 of scenarios/scroller.ts, in process, against `ocelle-test-overflow-host`, a test-only
// element built on `OverflowRegion` with its own template and the default `group` role. Its box and frame are the
// contract's `div.region-box` and `div.region-frame`.
const driver = inProcessDriver();

afterEach(async () => {
  await driver.forcedColors("none");
});

describe("ocelle-test-overflow-host, in process (US1-16)", { timeout: 60_000 }, () => {
  it.each(regionScenarios({ tag: "ocelle-test-overflow-host", box: "div.region-box", frame: "div.region-frame" }))("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
