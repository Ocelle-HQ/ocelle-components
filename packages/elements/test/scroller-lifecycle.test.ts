import { describe, expect, it } from "vitest";
import "../src/ocelle-scroller.ts";
import { inProcessDriver } from "./in-process.ts";

// The overflow-region module's lifecycle (009 contracts/overflow-region.md § Lifecycle; T023), in process: a scroller
// that a host moves to another place of the page (disconnected, then connected again) follows its box there: the
// module observes the box again when the host connects, so the tab stop and the group follow the new box's size, the
// arrow key still scrolls one 40 px step, and the module's per-instance sheet is adopted once, not again. A guard on
// the green implementation, proven able to fail by its plants (reviews/phase-2/plants.md, L1 and L2).
const driver = inProcessDriver();

describe("ocelle-scroller moved to another place of the page", () => {
  it("follows its box after it is connected again: it overflows in the narrower place, scrolls 40 px per key and keeps one per-instance sheet", async () => {
    await driver.viewport(1280, 800);
    await driver.mount('<button id="before" type="button">before</button><div id="wide"></div><div id="narrow"><ocelle-scroller id="s" label="Filters"><span id="w"></span></ocelle-scroller></div>');
    await driver.rules("#wide { inline-size: 600px; } #narrow { inline-size: 200px; } #w { display: inline-block; inline-size: 400px; block-size: 24px; vertical-align: top; }");
    const scroller = document.getElementById("s");
    const box = (): Element | null | undefined => scroller?.shadowRoot?.querySelector(".region-box");
    const narrow = { tabindex: box()?.getAttribute("tabindex"), role: box()?.getAttribute("role") };
    if (scroller !== null) document.getElementById("wide")?.append(scroller);
    await driver.settle();
    const wide = { tabindex: box()?.getAttribute("tabindex") ?? null, role: box()?.getAttribute("role") ?? null };
    if (scroller !== null) document.getElementById("narrow")?.append(scroller);
    await driver.settle();
    await driver.tabWalk("before", "s >> div.region-box");
    await driver.press("ArrowRight");
    expect({ narrow, wide, back: box()?.getAttribute("tabindex"), scrolled: await driver.scrollLeft({ id: "s", inner: ".region-box" }), sheets: await driver.sheets("ocelle-scroller") }).toEqual({
      narrow: { tabindex: "0", role: "group" },
      wide: { tabindex: null, role: null },
      back: "0",
      scrolled: 40,
      sheets: { elements: 1, perRoot: [3], distinct: 3, styleElements: 0 },
    });
  });
});
