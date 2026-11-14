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
});
