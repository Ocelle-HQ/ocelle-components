import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canvasActionBounds,
  canvasBoundsOverlap,
  canvasRevealViewport,
  canvasViewport,
  canvasViewportPoint,
  effectiveCanvasClip,
  isInsideCanvasClip,
} from "../src/workflow-canvas-viewport.ts";

const svg = "http://www.w3.org/2000/svg";
const view = { x: 37, y: -23, scale: 2.5 };

function viewportFixture(width: number, height: number) {
  const pane = document.createElement("div");
  pane.style.cssText = `position: absolute; left: 120px; top: 80px; overflow: hidden;
    width: ${String(width)}px; height: ${String(height)}px;`;
  const map = document.createElementNS(svg, "svg");
  map.setAttribute("viewBox", "0 0 200 150");
  map.setAttribute("preserveAspectRatio", "none");
  map.style.cssText = "position: absolute; left: 0; top: 0; width: 400px; height: 300px;";
  const face = document.createElementNS(svg, "foreignObject");
  face.setAttribute("x", "110");
  face.setAttribute("y", "90");
  face.setAttribute("width", "40");
  face.setAttribute("height", "30");
  const action = document.createElement("button");
  action.type = "button";
  action.textContent = "Workflow step";
  action.style.cssText = "box-sizing: border-box; display: block; margin: 0; width: 100%; height: 100%; --ocelle-focus-offset: 2px; --ocelle-focus-width: 3px;";
  face.append(action);
  map.append(face);
  pane.append(map);
  document.body.append(pane);
  return { action, map, pane };
}

afterEach(() => { document.body.replaceChildren(); });

describe("workflow canvas viewport geometry", () => {
  it.each([
    ["visible", "visible", { left: 88, top: 53, right: 528, bottom: 593 }],
    ["clip", "visible", { left: 128, top: 53, right: 368, bottom: 593 }],
    ["visible", "clip", { left: 88, top: 98, right: 528, bottom: 368 }],
    ["clip", "clip", { left: 128, top: 98, right: 368, bottom: 368 }],
  ] as const)("uses only clipping axes in a scaled pane with %s x and %s y overflow", (overflowX, overflowY, expected) => {
    const { map, pane } = viewportFixture(120, 90);
    pane.style.cssText += `box-sizing: content-box; border: solid transparent; border-width: 6px 8px 8px 4px;
      transform: scale(2, 3); transform-origin: top left; overflow-x: ${overflowX}; overflow-y: ${overflowY};`;
    map.style.cssText += "left: -20px; top: -15px; width: 220px; height: 180px;";

    expect(effectiveCanvasClip(map)).toEqual(expected);
  });

  it.each([["scroll", "scroll"], ["overlay", "auto"]] as const)("clips at the pane edges for overflow %s", (overflow, computedOverflow) => {
    const { map, pane } = viewportFixture(250, 170);
    pane.style.overflow = overflow;

    const style = getComputedStyle(pane);
    expect([style.overflowX, style.overflowY]).toEqual([computedOverflow, computedOverflow]);
    expect(effectiveCanvasClip(map)).toEqual({ left: 120, top: 80, right: 120 + pane.clientWidth, bottom: 80 + pane.clientHeight });
  });

  it.each(["paint", "layout paint", "content", "strict"])("clips both axes at the scaled pane padding edge with contain: %s", (containment) => {
    const { map, pane } = viewportFixture(120, 90);
    pane.style.cssText += `box-sizing: content-box; border: solid transparent; border-width: 6px 8px 8px 4px;
      padding: 3px 5px 7px 11px; transform: scale(2, 3); transform-origin: top left;
      overflow: visible; contain: ${containment};`;
    map.style.cssText += "left: -20px; top: -15px; width: 220px; height: 180px;";

    expect(effectiveCanvasClip(map)).toEqual({ left: 128, top: 98, right: 400, bottom: 398 });
  });

  it.each([["contents", "paint"], ["inline", "paint"], ["block", "layout"]] as const)("leaves the map visible through display: %s with contain: %s", async (display, containment) => {
    const { map, pane } = viewportFixture(120, 90);
    pane.style.cssText = `display: ${display}; contain: ${containment}; width: 120px; height: 90px;`;
    map.style.cssText = "display: inline-block; width: 400px; height: 300px;";
    const { left, top, right, bottom } = map.getBoundingClientRect();
    const intersectionRatio = await new Promise<number | undefined>((resolve) => {
      const observer = new IntersectionObserver(([entry]) => {
        observer.disconnect();
        resolve(entry?.intersectionRatio);
      });
      observer.observe(map);
    });

    expect(intersectionRatio, "Chromium reports the full SVG map visible").toBe(1);
    expect(effectiveCanvasClip(map)).toEqual({ left, top, right, bottom });
  });

  it.each(["contents", "inline"])("ignores overflow: hidden on a %s wrapper that does not establish an overflow clip", (display) => {
    const { map, pane } = viewportFixture(120, 90);
    pane.style.cssText = `display: ${display}; overflow: hidden; width: 120px; height: 90px;`;
    map.style.cssText = "display: inline-block; width: 400px; height: 300px;";
    const { left, top, right, bottom } = map.getBoundingClientRect();

    expect(effectiveCanvasClip(map)).toEqual({ left, top, right, bottom });
  });

  it.each([
    ["inset(5px)", { left: 130, top: 95, right: 374, bottom: 377 }],
    ["inset(0 10%)", { left: 146.4, top: 80, right: 357.6, bottom: 392 }],
    ["inset(0 0 calc(100% - 20px) 0)", { left: 120, top: 80, right: 384, bottom: 140 }],
    ["inset(calc(25% + 3px) calc(25% - 2px) -5px 8px)", { left: 136, top: 167, right: 322, bottom: 407 }],
    ["inset(5px 20px 7px)", { left: 160, top: 95, right: 344, bottom: 371 }],
    ["inset(10% 20px 25% 8px)", { left: 136, top: 111.2, right: 344, bottom: 314 }],
    ["inset(5px 20px 7px 8px) padding-box", { left: 144, top: 113, right: 328, bottom: 347 }],
    ["inset(50% 75% 150% 125%)", { left: 285, top: 158, right: 285, bottom: 158 }],
  ] as const)("clips to the computed rectangular %s on a scaled host pane with visible overflow", (inset, expected) => {
    const { map, pane } = viewportFixture(120, 90);
    pane.style.cssText += `box-sizing: content-box; border: solid transparent; border-width: 6px 8px 8px 4px;
      transform: scale(2, 3); transform-origin: top left; overflow: visible; clip-path: ${inset};`;
    map.style.cssText += "left: -20px; top: -15px; width: 220px; height: 180px;";
    const clipPath = getComputedStyle(pane).clipPath;

    expect(clipPath).toMatch(/^inset\(/);
    expect(effectiveCanvasClip(map)).toEqual(expected);
  });

  it.each([
    ["inset(5px 20px 7px 8px round 4px 8px / 10% 5%)", { left: 136, top: 95, right: 344, bottom: 371 }],
    ["inset(calc(25% + 3px) 20px 7px 8px round 4px) margin-box", { left: 136, top: 185, right: 344, bottom: 443 }],
  ] as const)("finds the scaled reveal bounds of %s", (path, expected) => {
    const { map, pane } = viewportFixture(120, 90);
    pane.style.cssText += `box-sizing: content-box; border: solid transparent; border-width: 6px 8px 8px 4px;
      margin-bottom: 24px; transform: scale(2, 3); transform-origin: top left;
      overflow: visible; clip-path: ${path};`;
    map.style.cssText += "left: -20px; top: -15px; width: 220px; height: 180px;";

    expect(effectiveCanvasClip(map)).toEqual(expected);
  });

  it("uses all four scaled margins for an inset's margin box", () => {
    const { map, pane } = viewportFixture(120, 90);
    pane.style.cssText += `box-sizing: content-box; border: solid transparent; border-width: 6px 8px 8px 4px;
      margin: 2px 6px 8px 4px; transform: scale(2, 3); transform-origin: top left;
      overflow: visible; clip-path: inset(5px 20px 7px 8px) margin-box;`;
    map.style.cssText += "left: -20px; top: -15px; width: 220px; height: 180px;";

    expect(effectiveCanvasClip(map)).toEqual({ left: 132, top: 91, right: 360, bottom: 397 });
  });

  it("uses the outer bounds of a resolved straight-edge polygon for a viewport proposal", () => {
    const { map, pane } = viewportFixture(250, 170);
    pane.style.cssText += "overflow: visible; clip-path: polygon(evenodd, 25px 10px, 75% 10px, 75% 80%, 25px 80%);";

    expect(effectiveCanvasClip(map), "pixel and percentage vertices share the HTML border box").toEqual({
      left: 145, top: 90, right: 307.5, bottom: 216,
    });
  });

  it.each([
    ["transform", "rotate(10deg)"], ["rotate", "10deg"], ["scale", "1.25"],
    ["perspective", "900px"], ["offset-path", 'path("M 10 20 L 50 60")'], ["zoom", "1.25"],
  ])("uses the ordinary map bounds when polygon reference ancestry has %s", (property, value) => {
    const { map, pane } = viewportFixture(250, 170);
    const host = document.createElement("section");
    document.body.append(host);
    host.append(pane);
    host.style.setProperty(property, value);
    pane.style.cssText += "overflow: visible; clip-path: polygon(30px 20px, 100% 20px, 100% 80%, 30px 80%);";
    const { left, top, right, bottom } = map.getBoundingClientRect();

    expect(effectiveCanvasClip(map)).toEqual({
      left: Math.max(0, left), top: Math.max(0, top),
      right: Math.min(document.documentElement.clientWidth, right),
      bottom: Math.min(document.documentElement.clientHeight, bottom),
    });
  });

  it.each([
    "polygon(30px 20px, 100% 20px, 100% 80%, 30px 80%) margin-box",
    "polygon(calc(20% + 5px) 20px, 100% 20px, 100% 80%, 30px 80%)",
  ])("uses the ordinary map bounds when polygon vertices or reference box need more geometry: %s", (path) => {
    const { map, pane } = viewportFixture(250, 170);
    pane.style.cssText += `overflow: visible; margin-bottom: 10px; clip-path: ${path};`;
    const { left, top, right, bottom } = map.getBoundingClientRect();

    expect(effectiveCanvasClip(map)).toEqual({ left, top, right, bottom });
  });

  it("leaves an SVG clip reference to the browser's SVG geometry", () => {
    const pane = document.createElementNS(svg, "svg");
    pane.style.cssText = "display: block; width: 250px; height: 170px; overflow: visible; clip-path: polygon(20px 10px, 100% 10px, 100% 80%, 20px 80%);";
    const map = document.createElementNS(svg, "svg");
    map.setAttribute("width", "400");
    map.setAttribute("height", "300");
    const face = document.createElementNS(svg, "rect");
    face.setAttribute("width", "400");
    face.setAttribute("height", "300");
    map.append(face);
    pane.append(map);
    document.body.append(pane);
    const { left, top, right, bottom } = map.getBoundingClientRect();

    expect(effectiveCanvasClip(map)).toEqual({ left, top, right, bottom });
  });

  it("uses the ordinary map bounds for a fragmented CSS polygon reference box", () => {
    const { map } = viewportFixture(250, 170);
    const wrapper = document.createElement("span");
    wrapper.style.clipPath = "polygon(25px 10px, 100% 10px, 100% 80%, 25px 80%)";
    wrapper.append("First line", document.createElement("br"), "Second line", map);
    document.body.append(wrapper);
    expect(wrapper.getClientRects().length).toBeGreaterThan(1);
    const { left, top, right, bottom } = map.getBoundingClientRect();

    expect(effectiveCanvasClip(map)).toEqual({ left, top, right, bottom });
  });

  it.each([
    { name: "enclosing edges", points: [[-10, -10], [30, -10], [30, 30], [-10, 30]], crosses: false },
    { name: "closing edge", points: [[10, -10], [30, -10], [30, 30], [10, 30]], crosses: true },
    { name: "left boundary", points: [[0, -10], [30, -10], [30, 30], [0, 30]], crosses: false },
    { name: "top boundary", points: [[-10, 0], [30, 0], [30, 30], [-10, 30]], crosses: false },
    { name: "exact corner", points: [[-10, 10], [10, -10], [-10, -10]], crosses: false },
    { name: "diagonal crossing", points: [[-10, 20], [20, -10], [-10, -10]], crosses: true },
    { name: "right boundary", points: [[20, -10], [30, -10], [30, 30], [20, 30]], crosses: false },
    { name: "disjoint axis intervals", points: [[10, -25], [30, 5], [30, -25]], crosses: false },
    { name: "extension before start", points: [[30, 30], [50, 50], [45, 30]], crosses: false },
    { name: "extension beyond end", points: [[-30, -30], [-5, -5], [-40, -5]], crosses: false },
  ] as const)("checks every polygon segment for an interior outline crossing at the $name", async ({ points, crosses }) => {
    const { canvasContourCrossesOutline } = await import("../src/workflow-canvas-viewport.ts");
    const [first, ...rest] = points;
    const outline = { left: 0, top: 0, right: 20, bottom: 20 };

    expect(canvasContourCrossesOutline([{ x: first[0], y: first[1] }, ...rest.map(([x, y]) => ({ x, y }))], outline))
      .toBe(crosses);
  });

  it("measures content-box inset percentages relative to the scaled content edges", () => {
    const { map, pane } = viewportFixture(120, 90);
    pane.style.cssText += `box-sizing: content-box; border: solid transparent; border-width: 6px 8px 8px 4px;
      padding: 3px 5px 7px 11px; transform: scale(2, 3); transform-origin: top left;
      overflow: visible; clip-path: inset(10% 20% 25% 5%) content-box;`;
    map.style.cssText += "left: -20px; top: -15px; width: 220px; height: 180px;";

    expect(effectiveCanvasClip(map)).toEqual({ left: 162, top: 134, right: 342, bottom: 309.5 });
  });

  it("measures padding-box inset percentages from the padding edge with nonzero padding", () => {
    const { map, pane } = viewportFixture(120, 90);
    pane.style.cssText += `box-sizing: content-box; border: solid transparent; border-width: 6px 8px 8px 4px;
      padding: 3px 5px 7px 11px; transform: scale(2, 3); transform-origin: top left;
      overflow: visible; clip-path: inset(10% 20% 25% 5%) padding-box;`;
    map.style.cssText += "left: -20px; top: -15px; width: 220px; height: 180px;";

    expect(effectiveCanvasClip(map)).toEqual({ left: 141.6, top: 128, right: 345.6, bottom: 323 });
  });

  it("preserves the real overflow clip of an inline SVG viewport", () => {
    const host = document.createElement("div");
    host.style.cssText = "position: absolute; left: 120px; top: 80px;";
    const pane = document.createElementNS(svg, "svg");
    pane.style.cssText = "display: inline; vertical-align: top; width: 200px; height: 150px; overflow: hidden;";
    const map = document.createElementNS(svg, "svg");
    map.setAttribute("width", "400");
    map.setAttribute("height", "300");
    const face = document.createElementNS(svg, "rect");
    face.setAttribute("width", "400");
    face.setAttribute("height", "300");
    map.append(face);
    pane.append(map);
    host.append(pane);
    document.body.append(host);

    expect(getComputedStyle(pane).display).toBe("inline");
    expect(effectiveCanvasClip(map)).toEqual({ left: 120, top: 80, right: 320, bottom: 230 });
  });

  it("intersects a rectangular border-box inset with a real overflow clip at the client edge", () => {
    const { map, pane } = viewportFixture(120, 90);
    pane.style.cssText += `box-sizing: content-box; border: solid transparent; border-width: 6px 8px 8px 4px;
      transform: scale(2, 3); transform-origin: top left; clip-path: inset(0 0 15px 6px);`;
    map.style.cssText += "left: -20px; top: -15px; width: 220px; height: 180px;";

    expect(effectiveCanvasClip(map)).toEqual({ left: 132, top: 98, right: 368, bottom: 347 });
  });

  it("avoids a layout read for an ancestor that cannot clip either axis", () => {
    const { map, pane } = viewportFixture(250, 170);
    pane.style.overflow = "visible";
    const readBounds = vi.spyOn(pane, "getBoundingClientRect");

    try {
      expect(effectiveCanvasClip(map)).toEqual({ left: 120, top: 80, right: 520, bottom: 380 });
      expect(readBounds).not.toHaveBeenCalled();
    } finally {
      readBounds.mockRestore();
    }
  });

  it("reports an empty finite clip when the enclosing pane collapses along both axes", () => {
    const { map, pane } = viewportFixture(0, 0);
    pane.style.transform = "scale(2, 3)";
    pane.style.transformOrigin = "top left";

    expect(effectiveCanvasClip(map)).toEqual({ left: 120, top: 80, right: 120, bottom: 80 });
  });

  it("keeps a collapsed overflow pane with a zero inset finite", () => {
    const { map, pane } = viewportFixture(0, 0);
    pane.style.clipPath = "inset(0)";

    expect(effectiveCanvasClip(map)).toEqual({ left: 120, top: 80, right: 120, bottom: 80 });
  });

  it("includes boundary-equal focus bounds and rejects clipping or zero area on either axis", () => {
    const clip = { left: 12, top: 18, right: 112, bottom: 98 };

    expect(isInsideCanvasClip(clip, clip)).toBe(true);
    expect(isInsideCanvasClip(clip, { ...clip, left: 11 })).toBe(false);
    expect(isInsideCanvasClip(clip, { ...clip, right: 113 })).toBe(false);
    expect(isInsideCanvasClip(clip, { ...clip, top: 17 })).toBe(false);
    expect(isInsideCanvasClip(clip, { ...clip, bottom: 99 })).toBe(false);
    expect(isInsideCanvasClip(clip, { ...clip, left: clip.right })).toBe(false);
    expect(isInsideCanvasClip(clip, { ...clip, top: clip.bottom })).toBe(false);
  });

  it("treats intersecting controls as overlapping and touching sides as separate in both orders", () => {
    const action = { left: 20, top: 30, right: 60, bottom: 70 };
    const beside = { left: 60, top: 40, right: 80, bottom: 60 };
    const below = { left: 30, top: 70, right: 50, bottom: 90 };

    expect(canvasBoundsOverlap(action, { ...beside, left: 59 })).toBe(true);
    expect(canvasBoundsOverlap(action, beside)).toBe(false);
    expect(canvasBoundsOverlap(beside, action)).toBe(false);
    expect(canvasBoundsOverlap(action, { ...below, top: 69 })).toBe(true);
    expect(canvasBoundsOverlap(action, below)).toBe(false);
    expect(canvasBoundsOverlap(below, action)).toBe(false);
  });

  it("expands each side of a native action by the scaled sum of its focus tokens", () => {
    const { action, map } = viewportFixture(250, 170);
    map.setAttribute("viewBox", "0 0 200 100");

    expect(canvasActionBounds(action, null)).toEqual({ left: 335, top: 345, right: 425, bottom: 445 });
    expect(canvasActionBounds(action, map.getScreenCTM())).toEqual({ left: 330, top: 335, right: 430, bottom: 455 });
  });

  it("retains a finite host view and projects both axes with the same positive fractional scale", () => {
    const zoomedOut = { ...view, scale: 0.5 };

    expect(canvasViewport(zoomedOut)).toEqual(zoomedOut);
    expect(canvasViewportPoint({ x: 40, y: -24 }, zoomedOut)).toEqual({ x: 57, y: -35 });
  });

  it.each([
    { ...view, x: Infinity },
    { ...view, y: NaN },
    { ...view, scale: Infinity },
    { ...view, scale: 0 },
    { ...view, scale: -1 },
  ])("uses the identity viewport when a host supplies an invalid view %o", (invalid) => {
    expect(canvasViewport(invalid)).toEqual({ x: 0, y: 0, scale: 1 });
  });

  it.each([
    ["a visible portion that fits", 250, 170, { x: -30.5, y: -85.5, scale: 2.5 }],
    ["a portion that fits exactly including the focus outline", 100, 80, { x: -68, y: -108, scale: 2.5 }],
    ["a portion too narrow for the focus outline", 90, 170, { x: 7, y: -53, scale: 2.5 }],
    ["a portion too short for the focus outline", 250, 70, { x: 7, y: -53, scale: 2.5 }],
  ] as const)("proposes the exact graph translation for %s", (_label, width, height, expected) => {
    const { action, map } = viewportFixture(width, height);

    expect(canvasRevealViewport(view, map, action)).toEqual(expected);
  });

  it("declines a reveal while the SVG has no CSS box", () => {
    const { action, map } = viewportFixture(250, 170);
    map.style.display = "none";

    expect(canvasRevealViewport(view, map, action)).toBeNull();
  });

  it("declines a reveal when the rendering transform cannot be inverted", () => {
    const { action, map } = viewportFixture(250, 170);
    map.style.transform = "scaleX(0)";
    map.style.transformOrigin = "top left";

    expect(() => canvasRevealViewport(view, map, action), "a singular host transform must never throw").not.toThrow();
    expect(canvasRevealViewport(view, map, action)).toBeNull();
  });

  it("declines a reveal when a host focus token overflows the transformed outline", () => {
    const { action, map } = viewportFixture(250, 170);
    map.setAttribute("viewBox", "0 0 200 300");
    action.style.setProperty("--ocelle-focus-width", "1e308px");

    expect(canvasRevealViewport(view, map, action)).toBeNull();
  });
});
