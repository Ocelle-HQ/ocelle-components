// Shared readers of 011's layout scenarios (research.md R-13; tasks.md, "token values are read from the same page by
// token name, never literals"). Every expected length, colour and font of the section-header and card scenarios is a
// token name: the reader sets the token on a hidden probe element of the same page (`probe`, which every scenario
// mounts) and compares the computed value of the element under test with the probe's, so a scenario expects
// `"space-7"` where the padding is `--ocelle-space-7` and observes the measured value with the token's when it is not.
// Lengths between two boxes (a gap, a padding edge) are compared to a tenth of a pixel.
import type { Box, Driver } from "./driver.ts";

/** The hidden probe each scenario mounts after its own markup; its computed style gives a token's value on the page. */
export const probe = '<div id="probe" hidden></div>';

/** A value to a tenth of a pixel, without a negative zero. */
export const tenth = (value: number): number => Math.round(value * 10) / 10 + 0;

/** `--ocelle-<token>` as a `var()` reference. */
const reference = (token: string): string => `var(--ocelle-${token})`;

/** The used length of a length token on the page, in px (the probe's computed `padding-inline-start`). */
export async function tokenPx(driver: Driver, token: string): Promise<number> {
  await driver.style("probe", "padding-inline-start", reference(token));
  return Number.parseFloat(await driver.computed("probe", "padding-inline-start"));
}

/**
 * `token` when `length` equals the length token on the page to a tenth of a pixel, else the measured length and the
 * token's, so a failing comparison shows both.
 */
export async function lengthIs(driver: Driver, length: number, token: string): Promise<string> {
  const value = await tokenPx(driver, token);
  return tenth(length) === tenth(value) ? token : `${String(tenth(length))}px, not ${token} (${String(tenth(value))}px)`;
}

/** The colour a colour token computes to on the page, in the current theme. */
export function tokenColour(driver: Driver, token: string): Promise<string> {
  return driver.resolveColour(reference(token));
}

/**
 * For each CSS property of `spec`, the token it names (a token name, `--ocelle-` left out) or, for a value that is not
 * a token, that value after `=` (`"=uppercase"`), when the computed value of the element with `id` equals what the probe computes
 * for it on the same page; otherwise the element's value and the probe's. The probe takes the element's font size
 * first, so an `em` letter spacing and a number line height compare at the same size; a `font-size` entry is read
 * first. A scenario expects `spec` itself.
 */
export async function tokensOf(driver: Driver, id: string, spec: Readonly<Record<string, string>>): Promise<Record<string, string>> {
  const observed: Record<string, string> = {};
  await driver.style("probe", "font-size", await driver.computed(id, "font-size"));
  const entries = Object.entries(spec).sort(([a], [b]) => Number(b === "font-size") - Number(a === "font-size"));
  for (const [property, token] of entries) {
    const literal = token.startsWith("=") ? token.slice(1) : undefined;
    await driver.style("probe", property, literal ?? reference(token));
    const expected = await driver.computed("probe", property);
    const actual = await driver.computed(id, property);
    observed[property] = actual === expected ? token : `${actual}, not ${token} (${expected})`;
  }
  return Object.fromEntries(Object.keys(spec).map((property) => [property, observed[property] ?? ""]));
}

/** The four sides' value of a box property (`padding`, `border-*-width`, `margin`) of the element with `id`. */
export async function sides(driver: Driver, id: string, property: (side: string) => string): Promise<string[]> {
  return Promise.all(["top", "right", "bottom", "left"].map((side) => driver.computed(id, property(side))));
}

/** The block gap from the end of box `a` to the start of box `b`. */
export const below = (a: Box, b: Box): number => b.y - (a.y + a.height);

/** The inline gap from the end of box `a` to the start of box `b`, in the reading direction: `b` after `a`. */
export const after = (a: Box, b: Box, rtl = false): number => (rtl ? a.x - (b.x + b.width) : b.x - (a.x + a.width));

/** The border boxes of the elements with `ids`, by id. */
export async function boxes(driver: Driver, ids: readonly string[]): Promise<Record<string, Box>> {
  return Object.fromEntries(await Promise.all(ids.map(async (id) => [id, await driver.box(id)] as const)));
}

/** The box of `id` in a record `boxes` read. */
export function pick(read: Readonly<Record<string, Box>>, id: string): Box {
  const box = read[id];
  if (box === undefined) throw new Error(`no box read for #${id}`);
  return box;
}

/**
 * The unignored accessibility nodes of the subtree of the element with `id`, text nodes left out. The first is the
 * element's own node: a host the page gave an `id` is a `generic` node in Chromium, as a `div` with an `id` is, so the
 * scenarios expect it; every node after it is slotted content or a node the element added.
 */
export async function treeOf(driver: Driver, id: string): Promise<unknown[]> {
  return (await driver.axSubtree(id)).filter((node) => node.role !== "StaticText");
}

/**
 * `read` of each item, one after the other: the token readers share the one probe, so two reads must never run at
 * once.
 */
export async function inOrder<T, R>(items: readonly T[], read: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (const [index, item] of items.entries()) out.push(await read(item, index));
  return out;
}
