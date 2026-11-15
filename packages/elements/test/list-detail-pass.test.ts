import { describe, expect, it } from "vitest";
import "../src/ocelle-list-detail.ts";
import { passCount } from "../src/list-detail-measure.ts";
import { inProcessDriver } from "./in-process.ts";

// The once-per-frame measurement pass of `ocelle-list-detail` (009 FR-025; research.md R-13, PLAN-FRESH-3-002 and
// 3-003, the round 3 verify note; T048), in process only, because the count is read from the test-only pass counter of
// src/list-detail-measure.ts, which is not exported from the package. A `MutationObserver` delivers once per task, so
// three changes in one task would pass against one pass per delivery; the counted case spans tasks: three
// `setTimeout(0)` tasks each change a pane's light DOM before one animation frame, and that frame runs exactly one pass.
// Each task records the timestamp of the last animation frame seen by a `requestAnimationFrame` loop, so the test first
// confirms that all three ran between the same two frames; if they did not, the case is tried again, and a count is
// never taken across two frames. A change in a later frame then runs one more pass. Plant: one pass per
// `MutationObserver` delivery (three passes).
const driver = inProcessDriver();

const markup =
  '<div data-frame="R"><ocelle-list-detail id="c"><div slot="list"><p id="c-a">One</p></div><div><p id="c-b">Detail</p></div><div slot="inspector"><p id="c-c">Inspector</p></div></ocelle-list-detail></div>';

/** Resolves after the next animation frame's callbacks. */
const nextFrame = (): Promise<number> => new Promise((resolve) => requestAnimationFrame(resolve));

/** One attempt: three tasks, each a text change in a pane, and the passes run by the frame after them. */
async function attempt(round: number): Promise<{ sameFrame: boolean; passes: number }> {
  await nextFrame();
  await nextFrame();
  let last = 0;
  let looping = true;
  const loop = (time: number): void => {
    last = time;
    if (looping) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  await nextFrame();
  const start = passCount();
  const seen: number[] = [];
  await new Promise<void>((resolve) => {
    const change = (id: string, done: boolean): void => {
      setTimeout(() => {
        seen.push(last);
        const target = document.getElementById(id);
        if (target !== null) target.textContent = `Changed ${String(round)}`;
        if (done) resolve();
      }, 0);
    };
    change("c-a", false);
    change("c-b", false);
    change("c-c", true);
  });
  await nextFrame();
  await nextFrame();
  looping = false;
  return { sameFrame: seen.length === 3 && seen.every((time) => time === seen[0]), passes: passCount() - start };
}

describe("ocelle-list-detail's measurement pass (R-13)", () => {
  it("runs once in the frame after three light-DOM changes made in three tasks before that frame, and once more for a change in a later frame", async () => {
    await driver.viewport(1280, 800);
    await driver.mount(markup);
    let counted = { sameFrame: false, passes: -1 };
    for (let round = 0; round < 10 && !counted.sameFrame; round++) counted = await attempt(round);
    const start = passCount();
    const target = document.getElementById("c-b");
    if (target !== null) target.textContent = "Changed later";
    await nextFrame();
    await nextFrame();
    expect({ ...counted, later: passCount() - start }).toEqual({ sameFrame: true, passes: 1, later: 1 });
  });

  // Guards added after the green implementation, on paths no red test reached (the mutants of the observer's options,
  // its reset when the slots change and its stop on disconnection that survived the first mutation run;
  // reviews/phase-4/plants.md § Guards). The surviving mutants are their proof that they can fail.
  it("guard: a change of a text node's data two levels inside a pane's slotted element runs one pass (characterData, subtree)", async () => {
    await driver.viewport(1280, 800);
    await driver.mount(markup);
    await nextFrame();
    const start = passCount();
    const text = document.getElementById("c-b")?.firstChild;
    if (text instanceof Text) text.data = "Changed data";
    await nextFrame();
    await nextFrame();
    expect({ text: text instanceof Text, passes: passCount() - start }).toEqual({ text: true, passes: 1 });
  });

  it("guard: an element that leaves the slots is no longer observed: after its slot attribute names no slot, a change inside it runs no pass", async () => {
    await driver.viewport(1280, 800);
    await driver.mount(markup);
    const inspector = document.getElementById("c-c")?.parentElement;
    inspector?.setAttribute("slot", "spare");
    await driver.settle();
    const start = passCount();
    const target = document.getElementById("c-c");
    if (target !== null) target.textContent = "Unassigned";
    await nextFrame();
    await nextFrame();
    expect({ moved: inspector?.getAttribute("slot"), passes: passCount() - start }).toEqual({ moved: "spare", passes: 0 });
  });

  it("guard: a list-detail removed from the page runs no pass: the pass a change requested just before the removal is cancelled, and a change after it requests none", async () => {
    await driver.viewport(1280, 800);
    await driver.mount(markup);
    await nextFrame();
    const element = document.getElementById("c");
    const start = passCount();
    const before = document.getElementById("c-a");
    if (before !== null) before.textContent = "Before the removal";
    await Promise.resolve();
    element?.remove();
    await nextFrame();
    await nextFrame();
    const cancelled = passCount() - start;
    const after = element?.querySelector("#c-b");
    if (after !== null && after !== undefined) after.textContent = "After the removal";
    await nextFrame();
    await nextFrame();
    expect({ removed: element?.isConnected, cancelled, after: passCount() - start }).toEqual({ removed: false, cancelled: 0, after: 0 });
  });

  it("guard: a list-detail moved to another frame measures again: in Frame N it shows one column, and a change in its detail runs one pass", async () => {
    await driver.viewport(1280, 800);
    await driver.mount(`${markup}<div id="narrow" data-frame="N"></div>`);
    const element = document.getElementById("c");
    if (element !== null) document.getElementById("narrow")?.append(element);
    await driver.settle();
    const detail = element?.shadowRoot?.querySelector(".pane.detail");
    const start = passCount();
    const target = document.getElementById("c-b");
    if (target !== null) target.textContent = "Changed after the move";
    await nextFrame();
    await nextFrame();
    expect({ detail: detail === null || detail === undefined ? "absent" : getComputedStyle(detail).display, passes: passCount() - start }).toEqual({ detail: "none", passes: 1 });
  });

  // Added in phase 4's review round 2 (reviews/phase-4/round-2.md R2-01, operator decision P4), red before the fix: the
  // host's remedy for a change the element cannot see, `remeasure()`, re-chooses the tier from a fresh measurement of
  // the host's border box, in the pass it requests, so in the first animation frame after the call and in one pass
  // with a light-DOM change made in the same task. Plant (L22): that pass does not re-choose the tier.
  it("review R2-01: remeasure() re-chooses the tier from a fresh measurement of the host's border box in the first animation frame after the call, in one pass with a light-DOM change made in the same task: a content-box host 600 px wide with 2% inline padding and collapse-below 640px, whose container narrows from 1000 px to 500 px, shows one column by the end of that frame", async () => {
    await driver.viewport(1280, 800);
    await driver.mount('<div id="q-c"><ocelle-list-detail id="q" collapse-below="640px"><div slot="list"><p>One</p></div><div><p id="q-b">Detail</p></div></ocelle-list-detail></div>');
    await driver.rules("#q-c { inline-size: 1000px; } #q { box-sizing: content-box; inline-size: 600px; padding-inline: 2%; }");
    const element = document.querySelector("ocelle-list-detail");
    const tier = (): string | null | undefined => element?.shadowRoot?.querySelector(".grid")?.getAttribute("data-tier");
    const wide = tier();
    await driver.style("q-c", "inline-size", "500px");
    const stale = { tier: tier(), width: element?.getBoundingClientRect().width };
    const start = passCount();
    element?.remeasure();
    const target = document.getElementById("q-b");
    if (target !== null) target.textContent = "Changed with remeasure()";
    await nextFrame();
    const inFrame = tier();
    await nextFrame();
    expect({ wide, stale, inFrame, passes: passCount() - start }).toEqual({ wide: "two", stale: { tier: "two", width: 620 }, inFrame: "one", passes: 1 });
  });

  // Guard added after the round 2 fix (reviews/phase-4/round-2-fixes.md; plant L26, which survived without it): the
  // fresh measurement after a scheduled pass reads the probe's content box itself. Inserted from a task, the element's
  // first pass runs in the next animation frame, before its `ResizeObserver` first reports, so a measurement from the
  // last reported content box (none yet) would choose one column and then three again within that frame.
  it("guard: a list-detail inserted from a task in Frame R keeps three columns through its first pass: the grid's data-tier, read after every change of it and in each of six frames, is always three", async () => {
    await driver.viewport(1280, 800);
    await driver.mount('<div id="holder" data-frame="R"></div>');
    const seen: string[] = [];
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        const holder = document.getElementById("holder");
        if (holder !== null) holder.innerHTML = '<ocelle-list-detail id="x"><div slot="list">List</div><div>Detail</div><div slot="inspector">Inspector</div></ocelle-list-detail>';
        const element = document.getElementById("x");
        const tier = (): string => element?.shadowRoot?.querySelector(".grid")?.getAttribute("data-tier") ?? "none";
        const changes = new MutationObserver(() => seen.push(`change: ${tier()}`));
        queueMicrotask(() => {
          const grid = element?.shadowRoot?.querySelector(".grid");
          if (grid !== null && grid !== undefined) changes.observe(grid, { attributes: true, attributeFilter: ["data-tier"] });
        });
        let frames = 0;
        const loop = (): void => {
          seen.push(tier());
          frames += 1;
          if (frames < 6) requestAnimationFrame(loop);
          else {
            changes.disconnect();
            resolve();
          }
        };
        requestAnimationFrame(loop);
      }, 0);
    });
    expect({ tiers: [...new Set(seen)], frames: seen.filter((entry) => !entry.startsWith("change: ")).length, changes: seen.some((entry) => entry.startsWith("change: ")) }).toEqual({ tiers: ["three", "change: three"], frames: 6, changes: true });
  });
});

