import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { expectAnnouncements } from "../live-reading.ts";
import type { Snapshot } from "../live-reading.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served, Visit } from "./serve.ts";

// The live-region capture on the strict-CSP fixture pages (specs/010-feedback-forms T001a; contracts/testing.md
// § Live-region capture): the same behaviour as test/live-capture.test.ts over each page's own CDP session, at
// Chromium's delays (150 ms loaded, 350 ms loading), and the document mode `startDocument`. The planted regions are
// pages under fixtures/ with their plain scripts: live.html with live-regions.js (the test-only elements),
// live-document.html, and capture-loop.html with capture-loop.js (the looping element). Every test also asserts zero
// CSP violations, only allowed requests, no failed request and no console message.
const built = inject("elementsFixture");
const scripts = ["ocelle-elements.js", "live-regions.js"];
const chromium = { loaded: 150, loading: 350 };
/** The quiet window at Chromium's figures: 700 (the largest W) + 700 (the minimum hold) + 350 (the largest D). */
const quiet = 700 + 700 + 350;
let served: Served | undefined;
let browser: Browser | undefined;

beforeAll(async () => {
  served = await serve(built);
  browser = await launch();
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await served?.close();
});

async function open(page = "live.html", allowed: readonly string[] = scripts): Promise<{ readonly visit: Visit; readonly driver: ReturnType<typeof fixtureDriver> }> {
  if (browser === undefined || served === undefined) throw new Error("the suite did not start");
  const opened = await visit(browser, served.origin, page, allowed);
  return { visit: opened, driver: fixtureDriver(opened.page, opened.log, false, served) };
}

/** The texts a region keyed by host had in snapshots taken at a mutation pause, and in lifecycle snapshots. */
function texts(snapshots: readonly Snapshot[], host: string | null, lifecycle: boolean): string[] {
  return snapshots.filter((snapshot) => snapshot.lifecycle === lifecycle).flatMap((snapshot) => snapshot.regions.filter((region) => region.host === host).map((region) => region.text));
}

describe("liveCapture on the strict-CSP fixture pages", { timeout: 60_000 }, () => {
  it("observes the container's subtree: a region added and written W later counts one under both rules; a region outside is not read", async () => {
    const { visit: page, driver } = await open();
    await driver.mount('<div id="outside" aria-live="polite"></div><main id="c"></main>');
    await driver.liveCapture.start("c");
    await page.page.evaluate(async () => {
      document.getElementById("c")?.insertAdjacentHTML("beforeend", '<div id="plain" aria-live="polite"></div>');
      await new Promise((resolve) => setTimeout(resolve, 320));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const plain = document.getElementById("plain");
      const outside = document.getElementById("outside");
      if (plain === null || outside === null) throw new Error("no region");
      plain.textContent = "Saved";
      outside.textContent = "Elsewhere";
    });
    const snapshots = await driver.liveCapture.stop();
    expect({ paused: texts(snapshots, null, false).includes("Saved"), lifecycle: texts(snapshots, null, true).includes("Saved") }).toEqual({ paused: true, lifecycle: true });
    expectAnnouncements(snapshots, [{ text: "Saved", politeness: "polite", host: null }], chromium);
    expect({ outside: snapshots.flatMap((snapshot) => snapshot.regions.map((region) => region.text)).includes("Elsewhere"), recorded: await page.finish() }).toEqual({ outside: false, recorded: clean });
  });

  it("observes the shadow roots in the container when it is armed: a text set and cleared within a task is seen at a mutation pause", async () => {
    const { visit: page, driver } = await open();
    await driver.mount('<main id="c"><ocelle-test-region id="h"></ocelle-test-region></main>');
    await driver.liveCapture.start("c");
    await page.page.evaluate(async () => {
      const host = document.getElementById("h") as unknown as { say: (text: string) => void };
      host.say("Saved");
      await Promise.resolve();
      host.say("");
    });
    const snapshots = await driver.liveCapture.stop();
    expect({ paused: texts(snapshots, "h", false).includes("Saved"), lifecycle: texts(snapshots, "h", true).includes("Saved"), frames: texts(snapshots, "h", true).length > 0, recorded: await page.finish() }).toEqual({
      paused: true,
      lifecycle: false,
      frames: true,
      recorded: clean,
    });
  });

  it("observes shadow roots attached after it is armed, nested ones included (the attachShadow patch)", async () => {
    const { visit: page, driver } = await open();
    await driver.mount('<main id="c"></main>');
    await driver.liveCapture.start("c");
    await page.page.evaluate(async () => {
      const container = document.getElementById("c");
      if (container === null) throw new Error("no container");
      container.innerHTML = '<ocelle-test-nest id="n"></ocelle-test-nest>';
      const inner = document.getElementById("n")?.shadowRoot?.getElementById("inner") as unknown as { say: (text: string) => void };
      inner.say("Saved");
      await Promise.resolve();
      inner.say("");
    });
    const snapshots = await driver.liveCapture.stop();
    expect({ paused: texts(snapshots, "inner", false).includes("Saved"), hosts: snapshots.at(-1)?.hosts.map(({ host }) => host), recorded: await page.finish() }).toEqual({
      paused: true,
      hosts: ["n", "inner"],
      recorded: clean,
    });
  });

  it("takes snapshots with at, frame, lifecycle, loaded, regions and hosts; lifecycle snapshots count the rendering updates", async () => {
    const { visit: page, driver } = await open();
    await driver.mount('<main id="c"><ocelle-test-region id="h"></ocelle-test-region><ocelle-test-alert id="a" role="alert">Alert</ocelle-test-alert></main>');
    await driver.liveCapture.start("c");
    await page.page.evaluate(() => {
      (document.getElementById("h") as unknown as { say: (text: string) => void }).say("Saved");
    });
    const snapshots = await driver.liveCapture.stop();
    const lifecycle = snapshots.filter((snapshot) => snapshot.lifecycle);
    expect(lifecycle.length).toBeGreaterThanOrEqual(3);
    expect(lifecycle.map((snapshot) => snapshot.frame)).toEqual(lifecycle.map((_, index) => (lifecycle[0]?.frame ?? Number.NaN) + index));
    expect(snapshots.map((snapshot) => snapshot.at)).toEqual([...snapshots.map((snapshot) => snapshot.at)].sort((a, b) => a - b));
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
    expect(await page.finish()).toEqual(clean);
  });

  it("startDocument(url) sees the document from its first node: the region parsed late is absent from the first snapshot and appears holding its text", async () => {
    const { visit: page, driver } = await open("live.html", [...scripts, "live-document.html"]);
    await driver.liveCapture.startDocument("live-document.html");
    const snapshots = await driver.liveCapture.stop();
    const late = (snapshot: Snapshot | undefined): string[] => snapshot?.regions.map((region) => region.text) ?? ["no snapshot"];
    expect({ first: late(snapshots[0]), loading: snapshots.some((snapshot) => !snapshot.loaded), final: late(snapshots.at(-1)), url: page.page.url().endsWith("/live-document.html") }).toEqual({
      first: [],
      loading: true,
      final: ["Ready"],
      url: true,
    });
    expectAnnouncements(snapshots, [], chromium);
    expect(await page.finish()).toEqual(clean);
  });

  it("stop() waits the quiet window (700 + 700 + 350 ms) after the last mutation, then two rendering updates", async () => {
    const { visit: page, driver } = await open();
    await driver.mount('<main id="c"><div id="plain" aria-live="polite"></div></main>');
    await driver.liveCapture.start("c");
    await page.page.evaluate(() => {
      const plain = document.getElementById("plain");
      if (plain !== null) plain.textContent = "Saved";
    });
    const snapshots = await driver.liveCapture.stop();
    const written = snapshots.find((snapshot) => !snapshot.lifecycle && snapshot.regions.some((region) => region.text === "Saved"));
    const final = snapshots.at(-1);
    expect({
      waited: final !== undefined && written !== undefined && final.at - written.at >= quiet,
      bounded: final !== undefined && written !== undefined && final.at - written.at < quiet + 1500,
      frames: written === undefined ? 0 : snapshots.filter((snapshot) => snapshot.lifecycle && snapshot.at >= written.at + quiet).length >= 2,
      recorded: await page.finish(),
    }).toEqual({ waited: true, bounded: true, frames: true, recorded: clean });
  });

  it("stop({ atLeast }) first waits until atLeast has passed since the capture started", async () => {
    const { visit: page, driver } = await open();
    await driver.mount('<main id="c"><div id="plain" aria-live="polite"></div></main>');
    await driver.liveCapture.start("c");
    const atLeast = quiet + 500;
    const snapshots = await driver.liveCapture.stop({ atLeast });
    const waited = (snapshots.at(-1)?.at ?? Number.NaN) - (snapshots[0]?.at ?? Number.NaN);
    expect({ waited: waited >= atLeast, bounded: waited < atLeast + 1500, recorded: await page.finish() }).toEqual({ waited: true, bounded: true, recorded: clean });
  });

  it('a capture over an element that mutates in a loop ends with "capture exceeded …", not a timeout', async () => {
    const { visit: page, driver } = await open("capture-loop.html", ["capture-loop.js"]);
    await driver.mount('<main id="c"></main>');
    await driver.liveCapture.start("c");
    await driver.insert("c", '<ocelle-test-loop id="loop"></ocelle-test-loop>', "innerHTML");
    const started = Date.now();
    await expect(driver.liveCapture.stop()).rejects.toThrow(/^capture exceeded (2000 pauses|5000 ms)$/);
    expect(Date.now() - started).toBeLessThan(15_000);
    await page.page.evaluate(() => document.getElementById("loop")?.remove());
    expect(await page.finish()).toEqual(clean);
  });
});
