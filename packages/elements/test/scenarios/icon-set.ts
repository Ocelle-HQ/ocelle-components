// The shared bodies of User Story 2's browser scenarios, the icon set (005 spec US2 scenarios 1 to 4, FR-010, FR-017,
// FR-018; research.md R-07, R-08, R-11; T032), and, per name of the eighteen, US1-2's box (SC-002) and US1-7's
// forced-colour contexts (SC-004; analysis G1). Expected values are written by hand: the drawings from
// test/icons-expected.ts, the sizes and system colours as in scenarios/icon.ts, the pixel rules of R-08 as measured in
// reviews/phase-3/spike.md. Every "does not" outcome is observed in the same scenario as the positive outcome it
// guards (spec § "Does not" outcomes are paired):
// - no forbidden content (`style`, `id`, `href`, `xlink:href`, `<use>`, `<image>`, `<foreignObject>`, `<script>`,
//   `on*`; analysis L13) and no paint of a shape's own, beside the icon's exact expected drawing;
// - no near-miss name draws, beside the eighteen names that do;
// - the fourteen non-directional icons are not mirrored, beside the four inline-direction icons that are (plant:
//   mirroring applied to every icon, which `folder`, `file`, `search` and `copy` catch; spike.md).
import { expectedDrawing, expectedIcons, iconNames } from "../icons-expected.ts";
import { differs, equal, flipped } from "../pixels.ts";
import type { Bounds, Driver, Part } from "./driver.ts";
import { forcedExpected, forcedMarkup, forcedObservation, iconSize, shown, size, svgInHost } from "./icon.ts";
import type { Scenario } from "./icon.ts";

/** The geometry attributes each shape kind may carry (data-model.md § Icon); the stroke style is the svg's alone. */
const geometryAttributes: Readonly<Record<string, readonly string[]>> = {
  line: ["x1", "y1", "x2", "y2"],
  polyline: ["points"],
  path: ["d"],
  rect: ["x", "y", "width", "height", "rx"],
  circle: ["cx", "cy", "r"],
};

/** The elements FR-010 forbids in a drawing, by lower-case local name. */
const forbiddenElements = new Set(["use", "image", "foreignobject", "script"]);

/** Whether an attribute is one FR-010 forbids: `style`, `id`, an `href` in any namespace, an event handler. */
function forbiddenAttribute(name: string): boolean {
  const lower = name.toLowerCase();
  return lower === "style" || lower === "id" || lower === "href" || lower.endsWith(":href") || lower.startsWith("on");
}

/** Every forbidden element and attribute of the shadow root's elements, as `element` or `element[attribute]`. */
function forbidden(parts: readonly Part[]): string[] {
  return parts.flatMap((part) => [
    ...(forbiddenElements.has(part.name.toLowerCase()) ? [part.name] : []),
    ...Object.keys(part.attributes)
      .filter(forbiddenAttribute)
      .map((attribute) => `${part.name}[${attribute}]`),
  ]);
}

/** Every attribute of a shape inside the svg that is not one of its kind's geometry attributes. */
function ownAttributes(parts: readonly Part[]): string[] {
  return parts
    .filter((part) => part.name !== "svg")
    .flatMap((part) =>
      Object.keys(part.attributes)
        .filter((attribute) => !(geometryAttributes[part.name] ?? []).includes(attribute))
        .map((attribute) => `${part.name}[${attribute}]`),
    );
}

/**
 * The painted area of a drawing (US2-2): the union of every shape's geometry bounding box grown by half the stroke
 * width (1 unit, every shape is stroked), and whether it lies within 0 to 24 on both axes.
 */
function painted(shapes: readonly Bounds[]): { readonly inside: boolean } {
  const left = Math.min(...shapes.map((shape) => shape.x - 1));
  const top = Math.min(...shapes.map((shape) => shape.y - 1));
  const right = Math.max(...shapes.map((shape) => shape.x + shape.width + 1));
  const bottom = Math.max(...shapes.map((shape) => shape.y + shape.height + 1));
  return { inside: left >= 0 && top >= 0 && right <= 24 && bottom <= 24 };
}

/** The expected icon of the set named `name`. */
function icon(name: string): { readonly mirror: boolean; readonly shapes: readonly Part[] } {
  const entry = expectedIcons[name];
  if (entry === undefined) throw new Error(`no expected icon ${name}`);
  return entry;
}

/** Names close to the set's that are not in it: the physical directions, other spellings and other glyphs. */
const nearMisses = ["chevron-left", "chevron-right", "arrow-left", "arrow-right", "chevron", "arrow", "hamburger", "x", "folder-open", "files", "magnifier", "grid", "duplicate"];

/** The size of the mirroring captures: four times the icon size, whole pixels (R-08). */
const capture = 80;

/** Mounts one icon of `name` under `ltr` and one under `rtl`, each at 80 px in an absolutely placed box (R-08). */
async function mountDirections(driver: Driver, name: string): Promise<void> {
  await driver.mount(`<div id="ltr"><ocelle-icon id="icon-ltr" name="${name}"></ocelle-icon></div><div id="rtl"><ocelle-icon id="icon-rtl" name="${name}"></ocelle-icon></div>`);
  await driver.dir("ltr", "ltr");
  await driver.dir("rtl", "rtl");
  for (const [id, left] of [["ltr", "0px"], ["rtl", "100px"]] as const) {
    await driver.style(id, "position", "absolute");
    await driver.style(id, "left", left);
    await driver.style(id, "top", "0px");
    await driver.style(id, "display", "flex");
    await driver.style(id, "color", "black");
    await driver.style(id, "background-color", "white");
    await driver.style(id, "--ocelle-icon-size", `${String(capture)}px`);
  }
}

/** The box's size when it lies at whole-pixel coordinates, else "fractional" (a setup error, R-08). */
async function wholeBox(driver: Driver, id: string): Promise<unknown> {
  const box = await driver.box(id);
  return [box.x, box.y, box.width, box.height].every(Number.isInteger) ? [box.width, box.height] : "fractional";
}

export const iconSetScenarios: readonly Scenario[] = [
  {
    name: "US2-1, US2-2: exactly the eighteen names draw, no near-miss name draws, and no two names draw the same drawing (FR-017)",
    run: async (driver) => {
      await driver.mount(
        `<p>${iconNames.map((name) => `<ocelle-icon id="set-${name}" name="${name}"></ocelle-icon>`).join("")}</p>` +
          `<p>${nearMisses.map((name, index) => `<ocelle-icon id="miss-${String(index)}" name="${name}"></ocelle-icon>`).join("")}</p>`,
      );
      const drawings = [];
      for (const name of iconNames) drawings.push({ name, drawing: await driver.drawing(`set-${name}`) });
      const missesDrawn = [];
      for (const [index, name] of nearMisses.entries()) if ((await driver.drawing(`miss-${String(index)}`)).svg !== null) missesDrawn.push(name);
      const drawn = drawings.filter(({ drawing }) => drawing.svg !== null && drawing.svg.parts.length > 0);
      return {
        drawn: drawn.map(({ name }) => name),
        distinct: new Set(drawn.map(({ drawing }) => JSON.stringify(drawing.svg?.parts))).size,
        missesDrawn,
      };
    },
    expected: {
      drawn: ["chevron-start", "chevron-end", "chevron-up", "chevron-down", "arrow-start", "arrow-end", "menu", "close", "folder", "file", "search", "table", "copy", "inbox", "history", "settings", "notifications", "appearance"],
      distinct: 18,
      missesDrawn: [],
    },
  },
  ...iconNames.map(
    (name): Scenario => ({
      name: `US2-2, US2-3, US1-2, US1-7: ${name} draws its expected drawing on the 24-unit grid with the shared stroke, nothing forbidden, painted inside the box, at the icon size, and in the system colour of each forced-colours context (FR-010, FR-011, FR-015, FR-017, FR-018)`,
      run: async (driver) => {
        await driver.mount(`<p>Icon <ocelle-icon id="icon" name="${name}"></ocelle-icon></p>`);
        const drawing = await driver.drawing("icon");
        if (drawing.svg === null) return { drawing };
        const parts = await driver.elements("icon");
        const geometry = await driver.geometry("icon");
        const observed = {
          drawing,
          elements: parts.map((part) => part.name),
          forbidden: forbidden(parts),
          ownAttributes: ownAttributes(parts),
          painted: painted(geometry),
          shapes: geometry.length,
          box: size(await driver.box("icon")),
          svg: await svgInHost(driver, "icon"),
        };
        const forced: Record<string, unknown> = {};
        for (const palette of ["dark", "light"] as const) {
          await driver.mount(forcedMarkup(name));
          forced[palette] = await forcedObservation(driver, palette);
        }
        return { ...observed, forced };
      },
      expected: {
        drawing: expectedDrawing(name),
        elements: ["svg", ...icon(name).shapes.map((shape) => shape.name)],
        forbidden: [],
        ownAttributes: [],
        painted: { inside: true },
        shapes: icon(name).shapes.length,
        box: shown,
        svg: { width: iconSize, height: iconSize, dx: 0, dy: 0 },
        forced: { dark: forcedExpected("dark", 1 + icon(name).shapes.length), light: forcedExpected("light", 1 + icon(name).shapes.length) },
      },
    }),
  ),
  {
    name: "US2-4: under dir=rtl the four inline-direction icons render as their left-to-right capture flipped and differ from it unflipped, while the other fourteen render as their left-to-right capture (FR-017)",
    run: async (driver) => {
      const observed: Record<string, unknown> = {};
      for (const name of iconNames) {
        await mountDirections(driver, name);
        const setup = { boxes: [await wholeBox(driver, "icon-ltr"), await wholeBox(driver, "icon-rtl")], drawn: [(await driver.drawing("icon-ltr")).children, (await driver.drawing("icon-rtl")).children] };
        const ltr = await driver.pixels("icon-ltr");
        const rtl = await driver.pixels("icon-rtl");
        const captures = [[ltr.width, ltr.height], [rtl.width, rtl.height]];
        observed[name] = icon(name).mirror
          ? { setup, captures, rtlEqualsFlippedLtr: equal(rtl, flipped(ltr)), rtlDiffersFromLtr: differs(rtl, ltr) }
          : { setup, captures, rtlEqualsLtr: equal(rtl, ltr) };
      }
      return observed;
    },
    expected: Object.fromEntries(
      iconNames.map((name) => {
        const setup = { boxes: [[capture, capture], [capture, capture]], drawn: [["svg"], ["svg"]] };
        const captures = [[capture, capture], [capture, capture]];
        return [name, icon(name).mirror ? { setup, captures, rtlEqualsFlippedLtr: true, rtlDiffersFromLtr: true } : { setup, captures, rtlEqualsLtr: true }];
      }),
    ),
  },
];
