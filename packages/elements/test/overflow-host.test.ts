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

// Since 009 phase 2's operator round 3 (O3-03, T069; landing review L1-03; contracts/overflow-region.md § Lifecycle
// `hostUpdated`): when `box()` returns a new box, or none, the module lets go of the old one (it unobserves it and its
// track, takes its `scroll` and `slotchange` listeners off and removes its `tabindex`, `role` and `aria-label`), and the
// new box takes over the tab stop, the role and the name. The host's fixture-only `current` attribute names the box
// (test/fixtures/overflow-host.ts); the replaced box stays rendered beside the followed one, so it can be measured.
// Box `b` of the second case holds a contained block whose inner block grows past the box: that changes neither box `b`
// nor its track, so the module sees it only at its next size, slot or scroll event (FR-014's known limitation). Any
// event the module still heard from the old box would measure box `b` then and change the outputs; none may.
// Plant: the module as it was (the old box left observed, listened to and with its attributes as last set), which
// each case fails.
const swapRules = [
  '[data-test="strip"] { inline-size: 300px; }',
  ".wide { display: inline-block; inline-size: 240px; block-size: 24px; margin-inline-end: 4px; vertical-align: top; }",
  ".contained { display: inline-block; inline-size: 100px; block-size: 24px; contain: inline-size; vertical-align: top; }",
  ".inner { display: block; inline-size: 50px; block-size: 24px; }",
].join("\n");

const wide = (slot: string, count: number): string => Array.from({ length: count }, (_, index) => `<span id="${slot}${String(index)}" slot="${slot}" class="wide"></span>`).join("");

function host(): HTMLElement {
  const found = document.getElementById("h");
  if (found === null) throw new Error("no host");
  return found;
}

function boxNamed(name: string): HTMLElement {
  const found = host().shadowRoot?.querySelector<HTMLElement>(`.region-box[data-box="${name}"]`);
  if (found === null || found === undefined) throw new Error(`no box ${name}`);
  return found;
}

/** The tab stop, role and name of the box `name`. */
const attributesOf = (name: string): unknown => {
  const box = boxNamed(name);
  return { tabindex: box.getAttribute("tabindex"), role: box.getAttribute("role"), "aria-label": box.getAttribute("aria-label") };
};

/** The host's outputs as its render shows them: the `data-fade` of box b, bound to `fadeAttribute` while it is followed. */
const outputs = (): unknown => ({ fade: boxNamed("b").getAttribute("data-fade") });

const none = { tabindex: null, role: null, "aria-label": null };
const filters = { tabindex: "0", role: "group", "aria-label": "Filters" };

async function mountSwap(current: string, inner: string): Promise<void> {
  await driver.viewport(1280, 800);
  await driver.mount(`<button id="before" type="button">before</button><div data-test="strip"><ocelle-test-overflow-host id="h" label="Filters" current="${current}">${inner}</ocelle-test-overflow-host></div>`);
  await driver.rules(swapRules);
}

describe("ocelle-test-overflow-host, a new box in place of the old one (O3-03, T069)", { timeout: 60_000 }, () => {
  it("after the swap the old box has no tab stop, role or name, and the new box is a tab stop, a group named \"Filters\", scrolled 40 px by ArrowRight", async () => {
    await mountSwap("a", wide("a", 3) + wide("b", 3));
    const before = { a: attributesOf("a"), b: attributesOf("b") };
    await driver.setAttribute("h", "current", "b");
    const after = { a: attributesOf("a"), b: attributesOf("b") };
    await driver.focus({ id: "h", inner: '.region-box[data-box="b"]' });
    await driver.press("ArrowRight");
    expect({ before, after, scrolled: { a: boxNamed("a").scrollLeft, b: boxNamed("b").scrollLeft } }).toEqual({
      before: { a: filters, b: none },
      after: { a: none, b: filters },
      scrolled: { a: 0, b: 40 },
    });
  });

  it("growing, scrolling or slotting into the old box after the swap changes no output and puts no attribute back on it: it is unobserved and its listeners are gone", async () => {
    await mountSwap("a", `${wide("a", 3)}<div slot="b" class="contained"><span id="inner" class="inner"></span></div>`);
    await driver.setAttribute("h", "current", "b");
    const swapped = { a: attributesOf("a"), b: attributesOf("b"), outputs: outputs() };
    // Box b now overflows, unseen: nothing of box b or its track changed size.
    await driver.style("inner", "inline-size", "1000px");
    const unseen = { b: attributesOf("b"), outputs: outputs(), overflows: boxNamed("b").scrollWidth - boxNamed("b").clientWidth > 1 };
    await driver.style("a0", "block-size", "60px");
    const grown = { a: attributesOf("a"), b: attributesOf("b"), outputs: outputs() };
    await driver.setScrollLeft({ id: "h", inner: '.region-box[data-box="a"]' }, 100);
    const scrolled = { a: attributesOf("a"), b: attributesOf("b"), outputs: outputs(), at: boxNamed("a").scrollLeft };
    const extra = document.createElement("span");
    extra.slot = "a";
    extra.className = "wide";
    host().append(extra);
    await driver.settle();
    const slotted = { a: attributesOf("a"), b: attributesOf("b"), outputs: outputs() };
    const quiet = { a: none, b: none, outputs: { fade: null } };
    expect({ swapped, unseen, grown, scrolled, slotted }).toEqual({
      swapped: quiet,
      unseen: { b: none, outputs: { fade: null }, overflows: true },
      grown: quiet,
      scrolled: { ...quiet, at: 100 },
      slotted: quiet,
    });
  });

  it("with no box, the old box loses its tab stop, role and name; a box rendered again is followed again", async () => {
    await mountSwap("a", wide("a", 3) + wide("b", 3));
    const followed = attributesOf("a");
    await driver.setAttribute("h", "current", "none");
    const without = { a: attributesOf("a"), b: attributesOf("b") };
    await driver.setAttribute("h", "current", "a");
    const again = { a: attributesOf("a"), b: attributesOf("b") };
    await driver.focus({ id: "h", inner: '.region-box[data-box="a"]' });
    await driver.press("ArrowRight");
    expect({ followed, without, again, scrolled: boxNamed("a").scrollLeft }).toEqual({ followed: filters, without: { a: none, b: none }, again: { a: filters, b: none }, scrolled: 40 });
  });
});
