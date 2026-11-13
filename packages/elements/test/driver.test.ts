import { describe, expect, it } from "vitest";
import { inProcessDriver } from "./in-process.ts";

// The driver's own methods, in process, each proven against a plain page (009 research.md R-17; T005). `viewport()`
// resizes the test's iframe from Vitest's 414 × 896 default; test/browser/driver.test.ts proves the fixture driver's.
const driver = inProcessDriver();

describe("the in-process driver", () => {
  it("viewport(width, height) sets the page's innerWidth and innerHeight", async () => {
    await driver.viewport(1280, 800);
    const wide = [window.innerWidth, window.innerHeight];
    await driver.viewport(320, 640);
    expect([wide, [window.innerWidth, window.innerHeight]]).toEqual([
      [1280, 800],
      [320, 640],
    ]);
  });
});
