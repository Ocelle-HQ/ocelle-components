import { afterEach, describe, expect, it } from "vitest";
import { loopMarkup } from "./fixtures/live-loop.ts";
import { plainRegion } from "./fixtures/live-regions.ts";
import type { OcelleTestRegion } from "./fixtures/live-regions.ts";
import { delays, inProcessDriver } from "./in-process.ts";
import { expectAnnouncements } from "./live-reading.ts";
import type { Snapshot } from "./live-reading.ts";

// The live-region capture in process (specs/010-feedback-forms T001a; contracts/testing.md § Live-region capture): the
// browser commands behind `liveCapture.start` and `stop` on planted regions and test-only elements of
// test/fixtures/live-regions.ts and the looping element of test/fixtures/live-loop.ts, at the in-process `D` of
// test/in-process.ts. The same behaviour on the fixture pages is test/browser/live-capture.test.ts.
const driver = inProcessDriver();
const D = Math.max(delays.loaded, delays.loading);
/** The quiet window: the largest W (2 × D) + the minimum hold (the largest W) + the largest D. */
const quiet = 2 * D + 2 * D + D;

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** The next animation frame's callbacks. */
const frame = (): Promise<number> => new Promise((resolve) => requestAnimationFrame(resolve));

function byId(id: string, root: Document | ShadowRoot = document): HTMLElement {
  const found = root.getElementById(id);
  if (found === null) throw new Error(`no #${id}`);
  return found;
}

/** The texts a region keyed by host had in snapshots that were taken at a mutation pause (not by the frame hook). */
function pauseTexts(snapshots: readonly Snapshot[], host: string | null): string[] {
  return snapshots.filter((snapshot) => !snapshot.lifecycle).flatMap((snapshot) => snapshot.regions.filter((region) => region.host === host).map((region) => region.text));
}

/** The texts a region keyed by host had in lifecycle snapshots. */
function lifecycleTexts(snapshots: readonly Snapshot[], host: string | null): string[] {
  return snapshots.filter((snapshot) => snapshot.lifecycle).flatMap((snapshot) => snapshot.regions.filter((region) => region.host === host).map((region) => region.text));
}

afterEach(async () => {
  await driver.mount("");
});

describe("liveCapture in process", { timeout: 30_000 }, () => {
  it("observes the container's subtree: a region added and written W later counts one under both rules; a region outside is not read", async () => {
    await driver.mount('<div id="outside" aria-live="polite"></div><main id="c"></main>');
    await driver.liveCapture.start("c");
    byId("c").insertAdjacentHTML("beforeend", plainRegion);
    await wait(2 * D + 20);
    await frame();
    await frame();
    byId("plain").textContent = "Saved";
    byId("outside").textContent = "Elsewhere";
    const snapshots = await driver.liveCapture.stop();
    expect({ paused: pauseTexts(snapshots, null), lifecycle: lifecycleTexts(snapshots, null) }).toEqual({
      paused: expect.arrayContaining(["", "Saved"]) as unknown,
      lifecycle: expect.arrayContaining(["", "Saved"]) as unknown,
    });
    expectAnnouncements(snapshots, [{ text: "Saved", politeness: "polite", host: null }], delays);
    expect(snapshots.flatMap((snapshot) => snapshot.regions.map((region) => region.text))).not.toContain("Elsewhere");
  });

  it("observes the shadow roots in the container when it is armed: a text set and cleared within a task is seen at a mutation pause", async () => {
    await driver.mount('<main id="c"><ocelle-test-region id="h"></ocelle-test-region></main>');
    await driver.liveCapture.start("c");
    const host = byId("h") as OcelleTestRegion;
    host.say("Saved");
    await Promise.resolve();
    host.say("");
    const snapshots = await driver.liveCapture.stop();
    expect({ paused: pauseTexts(snapshots, "h"), lifecycle: lifecycleTexts(snapshots, "h") }).toEqual({
      paused: expect.arrayContaining(["Saved"]) as unknown,
      lifecycle: expect.not.arrayContaining(["Saved"]) as unknown,
    });
    expect(lifecycleTexts(snapshots, "h").length).toBeGreaterThan(0);
  });

  it("observes shadow roots attached after it is armed, nested ones included (the attachShadow patch)", async () => {
    await driver.mount('<main id="c"></main>');
    await driver.liveCapture.start("c");
    byId("c").innerHTML = '<ocelle-test-nest id="n"></ocelle-test-nest>';
    const shadow = byId("n").shadowRoot;
    if (shadow === null) throw new Error("ocelle-test-nest has no shadow root");
    const inner = byId("inner", shadow) as OcelleTestRegion;
    inner.say("Saved");
    await Promise.resolve();
    inner.say("");
    const snapshots = await driver.liveCapture.stop();
    expect(pauseTexts(snapshots, "inner")).toContain("Saved");
    expect(snapshots.at(-1)?.hosts).toEqual([
      { host: "n", role: expect.any(String) as unknown },
      { host: "inner", role: expect.any(String) as unknown },
    ]);
  });

  it("takes snapshots with at, frame, lifecycle, loaded, regions and hosts; lifecycle snapshots count the rendering updates", async () => {
    await driver.mount('<main id="c"><ocelle-test-region id="h"></ocelle-test-region><ocelle-test-alert id="a" role="alert">Alert</ocelle-test-alert></main>');
    await driver.liveCapture.start("c");
    (byId("h") as OcelleTestRegion).say("Saved");
    const snapshots = await driver.liveCapture.stop();
    const lifecycle = snapshots.filter((snapshot) => snapshot.lifecycle);
    expect(lifecycle.length).toBeGreaterThanOrEqual(3);
    expect(lifecycle.map((snapshot) => snapshot.frame)).toEqual(lifecycle.map((_, index) => (lifecycle[0]?.frame ?? Number.NaN) + index));
    expect(snapshots.map((snapshot) => snapshot.at)).toEqual([...snapshots.map((snapshot) => snapshot.at)].sort((a, b) => a - b));
    expect(snapshots.every((snapshot) => snapshot.loaded)).toBe(true);
    expect(snapshots.at(-1)).toEqual({
      at: expect.any(Number) as unknown,
      frame: expect.any(Number) as unknown,
      lifecycle: false,
      loaded: true,
      regions: [{ node: expect.stringMatching(/^\d+$/) as unknown, host: "h", politeness: "polite", text: "Saved" }],
      hosts: [
        { host: "h", role: expect.any(String) as unknown },
        { host: "a", role: "alert" },
      ],
    });
  });

  it("stop() waits the quiet window (the largest W + the minimum hold + the largest D) after the last mutation, then two rendering updates", async () => {
    await driver.mount(`<main id="c">${plainRegion}</main>`);
    await driver.liveCapture.start("c");
    await wait(D);
    byId("plain").textContent = "Saved";
    const snapshots = await driver.liveCapture.stop();
    const written = snapshots.find((snapshot) => !snapshot.lifecycle && snapshot.regions.some((region) => region.text === "Saved"))?.at ?? Number.NaN;
    const final = snapshots.at(-1)?.at ?? Number.NaN;
    expect(final - written).toBeGreaterThanOrEqual(quiet);
    expect(final - written).toBeLessThan(quiet + 1000);
    expect(snapshots.filter((snapshot) => snapshot.lifecycle && snapshot.at >= written + quiet).length).toBeGreaterThanOrEqual(2);
  });

  it("stop({ atLeast }) first waits until atLeast has passed since the capture started", async () => {
    await driver.mount(`<main id="c">${plainRegion}</main>`);
    await driver.liveCapture.start("c");
    const atLeast = quiet + 500;
    const snapshots = await driver.liveCapture.stop({ atLeast });
    const first = snapshots[0]?.at ?? Number.NaN;
    const final = snapshots.at(-1)?.at ?? Number.NaN;
    expect(final - first).toBeGreaterThanOrEqual(atLeast);
    expect(final - first).toBeLessThan(atLeast + 1000);
  });

  it('a capture over an element that mutates in a loop ends with "capture exceeded …", not a timeout', async () => {
    await driver.mount('<main id="c"></main>');
    await driver.liveCapture.start("c");
    byId("c").innerHTML = loopMarkup;
    const started = performance.now();
    await expect(driver.liveCapture.stop()).rejects.toThrow(/^capture exceeded (2000 pauses|5000 ms)$/);
    expect(performance.now() - started).toBeLessThan(15_000);
  });
});
