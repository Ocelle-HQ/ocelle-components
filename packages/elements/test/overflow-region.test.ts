import { describe, expect, it } from "vitest";
import { clearanceScroll, edgeState, resolveName } from "../src/overflow-region.ts";

// The pure helpers of the overflow-region module (009 contracts/overflow-region.md § Pure functions; research.md
// R-01, R-03, R-06; data-model.md § Overflow-region state; T012), in process and without layout. The figures are
// written by hand from the spec's Overflow rule (more than 1 px, measured in the box's inline direction, `scrollLeft`
// negative under `rtl`) and from R-06's clearance rule, on one strip: a 300 px box whose client area spans 100 to
// 400 px of the viewport, twelve 80 px links 4 px apart after a 5 px ring room (`scrollWidth` 1018, so the scroll
// range is 718 px) and the 32 px fade of `--ocelle-scroller-fade-size` at a 16 px root. A link's ring box is its
// border box grown by the 5 px ring room: link i spans 5 + 84 i to 85 + 84 i of the content, its ring box 84 i to
// 90 + 84 i.
describe("edgeState(scrollLeft, scrollWidth, clientWidth)", () => {
  it.each([
    { label: "content that fits exactly", at: [0, 300, 300], state: { overflowing: false, offStart: false, offEnd: false } },
    { label: "1 px more content, within the tolerance", at: [0, 301, 300], state: { overflowing: false, offStart: false, offEnd: false } },
    { label: "1.5 px more content", at: [0, 301.5, 300], state: { overflowing: true, offStart: false, offEnd: true } },
    { label: "at the start", at: [0, 1018, 300], state: { overflowing: true, offStart: false, offEnd: true } },
    { label: "1 px from the start, within the tolerance", at: [1, 1018, 300], state: { overflowing: true, offStart: false, offEnd: true } },
    { label: "1.5 px from the start", at: [1.5, 1018, 300], state: { overflowing: true, offStart: true, offEnd: true } },
    { label: "in the middle", at: [300, 1018, 300], state: { overflowing: true, offStart: true, offEnd: true } },
    { label: "1.5 px from the end", at: [716.5, 1018, 300], state: { overflowing: true, offStart: true, offEnd: true } },
    { label: "1 px from the end, within the tolerance", at: [717, 1018, 300], state: { overflowing: true, offStart: true, offEnd: false } },
    { label: "at the end", at: [718, 1018, 300], state: { overflowing: true, offStart: true, offEnd: false } },
    { label: "rtl: at the start", at: [0, 1018, 300], state: { overflowing: true, offStart: false, offEnd: true } },
    { label: "rtl: 1 px from the start, within the tolerance", at: [-1, 1018, 300], state: { overflowing: true, offStart: false, offEnd: true } },
    { label: "rtl: 1.5 px from the start", at: [-1.5, 1018, 300], state: { overflowing: true, offStart: true, offEnd: true } },
    { label: "rtl: 1 px from the end, within the tolerance", at: [-717, 1018, 300], state: { overflowing: true, offStart: true, offEnd: false } },
    { label: "rtl: at the end", at: [-718, 1018, 300], state: { overflowing: true, offStart: true, offEnd: false } },
  ])("$label: $at gives $state", ({ at, state }) => {
    const [scrollLeft = Number.NaN, scrollWidth = Number.NaN, clientWidth = Number.NaN] = at;
    expect(edgeState(scrollLeft, scrollWidth, clientWidth)).toEqual(state);
  });
});

/** The strip's box at a scroll position: its client area at 100 to 400 px, 1018 px of content. */
const box = (scrollLeft: number): { left: number; right: number; scrollLeft: number; scrollWidth: number; clientWidth: number } => ({ left: 100, right: 400, scrollLeft, scrollWidth: 1018, clientWidth: 300 });

/** A ring box at `start` to `end` of the content (from the inline start), seen at distance `at` scrolled, in viewport px. */
function ring(start: number, end: number, at: number, direction: "ltr" | "rtl"): { left: number; right: number } {
  return direction === "ltr" ? { left: 100 + start - at, right: 100 + end - at } : { left: 400 - (end - at), right: 400 - (start - at) };
}

const fits = { suppressStart: false, suppressEnd: false };

describe("clearanceScroll({ ring, box, fade, direction })", () => {
  // Each case in ltr and rtl: `at` is the distance scrolled from the inline start, `scrollLeft` its value in that
  // direction (negative under rtl). The new position is the smallest move that keeps the ring box at least the fade
  // depth from each inline edge that still fades there; an edge within 1 px of its end does not fade (the Overflow
  // rule), so a ring box near an end goes to that end.
  const cases = [
    { label: "link 3, half under the end fade at the start: moved until its ring box ends 32 px from the box's end", ring: [252, 342], at: 0, to: 74, ...fits },
    { label: "link 3 from the middle, past the start fade: moved until its ring box starts 32 px from the box's start", ring: [252, 342], at: 500, to: 220, ...fits },
    { label: "link 3 already clear of both fades: not moved", ring: [252, 342], at: 74, to: 74, ...fits },
    { label: "link 0 under the start fade: moved to the start, where the start does not fade", ring: [0, 90], at: 100, to: 0, ...fits },
    { label: "link 11 under the end fade: moved to the end, where the end does not fade", ring: [924, 1014], at: 600, to: 718, ...fits },
    { label: "a 250 px ring box, wider than the box less two fades, in the middle: aligned at the inline start, the start fade suppressed", ring: [400, 650], at: 300, to: 400, suppressStart: true, suppressEnd: false },
    { label: "a 250 px ring box at the content's start: aligned at the start, where it clears the end fade", ring: [0, 250], at: 300, to: 0, ...fits },
    { label: "a 340 px ring box, wider than the box, in the middle: aligned at the inline start, both fades suppressed", ring: [400, 740], at: 300, to: 400, suppressStart: true, suppressEnd: true },
  ];

  it.each(cases.map((each) => ({ ...each, direction: "ltr" as const })))("ltr, $label", ({ ring: [start = 0, end = 0], at, to, suppressStart, suppressEnd, direction }) => {
    expect(clearanceScroll({ ring: ring(start, end, at, direction), box: box(at), fade: 32, direction })).toEqual({ scrollLeft: to, suppressStart, suppressEnd });
  });

  it.each(cases.map((each) => ({ ...each, direction: "rtl" as const })))("rtl, $label", ({ ring: [start = 0, end = 0], at, to, suppressStart, suppressEnd, direction }) => {
    expect(clearanceScroll({ ring: ring(start, end, at, direction), box: box(-at), fade: 32, direction })).toEqual({ scrollLeft: to === 0 ? 0 : -to, suppressStart, suppressEnd });
  });

  it("reads the fade depth it is given: a 40 px fade at a 20 px root moves link 3 until its ring box ends 40 px from the box's end", () => {
    expect(clearanceScroll({ ring: ring(252, 342, 0, "ltr"), box: box(0), fade: 40, direction: "ltr" })).toEqual({ scrollLeft: 82, ...fits });
  });
});

describe("resolveName(hostAriaLabel, label)", () => {
  it.each([
    { label: "a non-blank host aria-label wins over the label", host: "Ready strip", own: "Filters", name: "Ready strip" },
    { label: "a non-blank host aria-label is trimmed", host: "  Ready strip ", own: undefined, name: "Ready strip" },
    { label: "a blank host aria-label falls back to the label", host: " ", own: "Filters", name: "Filters" },
    { label: "an empty host aria-label falls back to the trimmed label", host: "", own: " Filters ", name: "Filters" },
    { label: "no host aria-label: the trimmed label", host: null, own: "Filters ", name: "Filters" },
    { label: "no host aria-label and a blank label: no name", host: null, own: "  ", name: undefined },
    { label: "a blank host aria-label and no label: no name", host: " ", own: undefined, name: undefined },
    { label: "neither: no name", host: null, own: undefined, name: undefined },
  ])("$label", ({ host, own, name }) => {
    expect(resolveName(host, own)).toBe(name);
  });
});

// Guards added after the green implementation (reviews/phase-2/plants.md § Guards): the bounds of R-06's rule, which
// the first mutation run showed no case above reached. In ltr on the same strip; the surviving mutants of
// clearanceScroll are their proof that they can fail.
describe("clearanceScroll at its bounds", () => {
  it.each([
    { label: "1 px from the start the start does not fade: a ring box 10 px in stays", ring: [10, 100], at: 1, to: 1, ...fits },
    { label: "1 px from the start, a ring box at the box's start stays", ring: [1, 91], at: 1, to: 1, ...fits },
    { label: "a ring box whose fade clearance would leave 1 px goes to the start", ring: [33, 123], at: 200, to: 0, ...fits },
    { label: "1 px from the end the end does not fade: a ring box ending at the box's end stays", ring: [927, 1017], at: 717, to: 717, ...fits },
    { label: "a ring box ending under the end fade but inside the box moves until it ends 32 px from the end", ring: [200, 290], at: 0, to: 22, ...fits },
    { label: "a ring box well inside both fades stays", ring: [150, 200], at: 0, to: 0, ...fits },
    { label: "a ring box whose clearance lands 1 px from the end goes to the end", ring: [895, 985], at: 600, to: 718, ...fits },
    { label: "a ring box whose clearance lands half a px past the range goes to the end", ring: [896.5, 986.5], at: 600, to: 718, ...fits },
    { label: "a 280 px ring box moved toward the start that then reaches under the end fade: aligned at the start, both suppressed", ring: [100, 380], at: 200, to: 100, suppressStart: true, suppressEnd: true },
    { label: "a 340 px ring box at the content's start: at the start, where the start does not fade, the end suppressed", ring: [0, 340], at: 300, to: 0, suppressStart: false, suppressEnd: true },
    { label: "a ring box of the box less one fade, aligned at the start, ends where the end fade starts: only the start suppressed", ring: [400, 668], at: 300, to: 400, suppressStart: true, suppressEnd: false },
    { label: "a ring box as wide as the box, aligned at the start, reaches under the end fade: both suppressed", ring: [400, 700], at: 300, to: 400, suppressStart: true, suppressEnd: true },
  ])("$label", ({ ring: [start = 0, end = 0], at, to, suppressStart, suppressEnd }) => {
    expect(clearanceScroll({ ring: ring(start, end, at, "ltr"), box: box(at), fade: 32, direction: "ltr" })).toEqual({ scrollLeft: to, suppressStart, suppressEnd });
  });
});
