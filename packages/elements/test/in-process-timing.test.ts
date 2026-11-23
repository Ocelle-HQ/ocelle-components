import { afterEach, describe, expect, it } from "vitest";
import "../src/ocelle-notice.ts";
import { delays, inProcessDriver, timing } from "./in-process.ts";

// One timing for element and oracle in process (specs/010-feedback-forms T014a; contracts/testing.md § Timing;
// research.md R-09; analysis G7): the capture's `D` for both load states is the timing constant test/in-process.ts
// exports, and the driver's per-scenario setup gives the element the same constant through the test-only setter, so an
// announcing notice inserted after load writes its copy `W` = 2 × `delayLoaded` of that constant after the insertion,
// no earlier, and before Chromium's 300 ms.
const driver = inProcessDriver();

afterEach(async () => {
  await driver.mount("");
});

describe("the in-process timing", () => {
  it("the capture's D is the constant's, and an inserted notice's copy is written no earlier than 2 × delayLoaded of it after the insertion and before 300 ms", async () => {
    await driver.mount('<main id="c"></main>');
    await driver.liveCapture.start("c");
    const inserted = performance.now();
    await driver.insert("c", '<ocelle-notice id="n" announce tone="success">Saved</ocelle-notice>', "innerHTML");
    const snapshots = await driver.liveCapture.stop();
    const written = snapshots.find((snapshot) => snapshot.regions.some((region) => region.host === "n" && region.text === "Saved"));
    expect(delays).toEqual({ loaded: timing.delayLoaded, loading: timing.delayLoading });
    const gap = (written?.at ?? Number.POSITIVE_INFINITY) - inserted;
    expect({ written: written !== undefined, early: gap < 2 * timing.delayLoaded, late: gap >= 300 }).toEqual({ written: true, early: false, late: false });
  });
});
