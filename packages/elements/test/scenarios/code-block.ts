// The shared bodies of User Story 2's browser scenarios, `ocelle-code-block` (020 spec US2-1 to US2-21, FR-020 to
// FR-035 and the code block's edge cases; research.md R-05 to R-07, R-09; data-model.md § `ocelle-code-block`;
// contracts/checks.md § Scenario bodies, § Bodies the platform alone could pass, § Oracles; tasks.md T024, T025). Each
// body is written once against the driver and run in process on the element source (test/code-block.test.ts) and on
// the built browser build on the strict-CSP fixture (test/browser/code-block.test.ts). Expected values are written by
// hand from the spec, the data model and research: token values from packages/tokens/src/source.ts by the names the
// plan names (`--ocelle-font-sans`, `--ocelle-figures`, `--ocelle-font-size-md` 1rem, `--ocelle-line-height-relaxed`
// 1.55, `--ocelle-space-1` 0.25rem, `--ocelle-space-3` 0.75rem, `--ocelle-radius-2` 4px, `--ocelle-border-width` 1px,
// `--ocelle-focus-width` 3px), colours by token name from the hand-written token table (packages/tokens/test/
// expected.ts, through `tokenColour`), forced colours as `resolveColour(<keyword>)`, the digest groups written out.
//
// Oracles (contracts/checks.md § Oracles): no monospace on `.code` and every unit, the host not read; the cap against a
// probe of `--ocelle-measure-reading` in the same font; break positions from client rects (`clientRects`), one per
// group, one for the prefix only where it and its gap fit; the copy through `copyShadow` and `copyShadowRun`, never
// `clipboardCopy`; the AX text from the CDP StaticText names under the host and the `ariaSnapshot` of the shadow `pre`;
// the visual order and the line starts from the boxes of the characters (`characters`). Every text change is read
// after the mutation record, the element's update and the driver's settle (the driver's `setProperty`, `text` and
// `textData` settle).
//
// Every "does not" outcome shares its body with the positive outcome it guards:
// - a wrap block has no tab stop, role or name (US2-3) beside its wrapped text in the sans on the inset ground;
// - a fitting scroll block has none (US2-6) beside the tab stop and name it gets once it overflows;
// - an empty scroll block is no tab stop (US2-19) beside its one line's height;
// - a run-time switch leaves no tab stop, role or name (FR-025) beside the other policy's behaviour, and the block's
//   temporary `tabindex` goes (FR-025) beside the block having held focus with the token ring;
// - a text with whitespace inside is not grouped (US2-15) beside the text shown as written;
// - child markup adds no element (US2-20, FR-020) beside its text shown;
// - no write under `ltr` (US2-8) beside every line's start in view and the end fade.
//
// A body reads parts the scaffold does not render; `guarded` turns a read that throws (a missing shadow part) into the
// observation `{ error }`, so the body fails on its assertion and the log names the part.
import { source } from "../../../tokens/src/source.ts";
import { tokenColour } from "./icon.ts";
import type { Scenario } from "./icon.ts";
import type { Bounds, Box, CharacterBox, Driver, ElementTarget, Palette } from "./driver.ts";
import { boxAttributes, readOnce } from "./scroller.ts";

export type { Scenario } from "./icon.ts";

/** A token's declared value in packages/tokens/src/source.ts. */
function token(name: string): string {
  const found = source.find((each) => each.name === name);
  if (found === undefined || typeof found.value !== "string") throw new Error(`no single-valued token ${name}`);
  return found.value;
}

/** A rem token in CSS px at the default 16 px root size. */
function rem(name: string): number {
  const value = token(name);
  if (!value.endsWith("rem")) throw new Error(`${name} is not a rem length: ${value}`);
  return Number.parseFloat(value) * 16;
}

/** A px token as a number. */
function pxToken(name: string): number {
  const value = token(name);
  if (!value.endsWith("px")) throw new Error(`${name} is not a px length: ${value}`);
  return Number.parseFloat(value);
}

const px = (value: number): string => `${String(value)}px`;
const tenth = (value: number): number => Math.round(value * 10) / 10 + 0;

const sans = token("font-sans");
const figures = token("figures");
const fontSize = rem("font-size-md");
/** One line of `.code`: `--ocelle-line-height-relaxed` (1.55) times the 16 px body size, 24.8 px. */
const lineHeight = tenth(Number.parseFloat(token("line-height-relaxed")) * fontSize);
const gap = rem("space-1");
const padding = rem("space-3");
const radius = pxToken("radius-2");
const border = pxToken("border-width");
const focusWidth = pxToken("focus-width");
/** The module's block ring room on `.region-box` (`--ocelle-focus-offset` 2 px + `--ocelle-focus-width` 3 px, 009 contract). */
const ringRoom = pxToken("focus-offset") + focusWidth;
/** The inline space `.block` takes around the `pre`: its padding and border on each side. */
const around = 2 * (padding + border);
/** The module's arrow step (009 contract, default). */
const step = 40;

const code = ".code";
const block = ".block";
const regionBox = ".region-box";
const units = ".code > span";
const groups = ".code > span.group";
const prefix = ".code > span.prefix";

const boxOf = (id: string): ElementTarget => ({ id, inner: regionBox });

/** The digest of the spec (US2-9) and its 16 groups, written out. */
const hex = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
const digest = `sha256:${hex}`;
const hexGroups = ["9f86", "d081", "884c", "7d65", "9a2f", "eaa0", "c55a", "d015", "a3bf", "4f1b", "2b0b", "822c", "d15d", "6c15", "b0f0", "0a08"];

/** The sweep strings of contracts/checks.md (analysis A1): the SHA-256 of `test`, base64url and base64. */
const base64url = "sha256:n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg";
const base64urlUnits = ["sha256:", "n4bQ", "gYhM", "fWWa", "L-qg", "xVrQ", "FaO_", "Txsr", "C4Is", "0V1s", "FbDw", "Cgg"];
const base64 = "sha256:n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=";
const base64Units = ["sha256:", "n4bQ", "gYhM", "fWWa", "L+qg", "xVrQ", "FaO/", "Txsr", "C4Is", "0V1s", "FbDw", "Cgg="];

/** A 200-character line with no space (US2-3, US2-4). */
const longLine = "abcdefghij".repeat(20);
/** A deploy command longer than a 288 px block, with spaces (the scroll stories' line). */
const command = "docker compose --file deploy/compose.production.yaml --project-name ocelle-components up --detach --remove-orphans";

/** The test page's rules: the frames, a measure probe, a flex container. Layout only, on light-DOM elements. */
const rules = [
  "body { margin: 0; }",
  '[data-test="narrow"] { inline-size: 288px; }',
  '[data-test="wide"] { inline-size: 1200px; }',
  '[data-test="frame"] { inline-size: 300px; }',
  '[data-test="measure"] { inline-size: var(--ocelle-measure-reading); block-size: 1px; }',
  '[data-test="flex"] { display: flex; inline-size: 300px; }',
].join("\n");

/**
 * Mounts `markup` at `width` × 800 with the test rules: an empty root first, then the rules, then the markup appended
 * to it, so every element first renders in its frame (the `rtl` opening write follows the box's first layout and the
 * text, never a later resize, FR-021).
 */
async function page(driver: Driver, markup: string, width = 1280): Promise<void> {
  await driver.viewport(width, 800);
  await driver.mount('<div id="page"></div>');
  await driver.rules(rules);
  await driver.append("page", markup);
}

/** A page with a button before and after `content`, so Tab has somewhere to come from and to go to. */
const between = (content: string): string => `<p><button id="before" type="button">Before</button></p>${content}<p><button id="after" type="button">After</button></p>`;

/** Runs a body, turning a read that throws (a shadow part that is not rendered) into the observation `{ error }`. */
function guarded(run: (driver: Driver) => Promise<unknown>): (driver: Driver) => Promise<unknown> {
  return async (driver) => {
    try {
      return await run(driver);
    } catch (error) {
      return { error: error instanceof Error ? error.message.split("\n")[0] : String(error) };
    }
  };
}

/** The text of each unit of the digest, in order (`.code > span`), read one by one. */
async function unitTexts(driver: Driver, id: string): Promise<string[]> {
  const found: string[] = [];
  for (let index = 1; index <= 40; index += 1) {
    const text = await driver.textOf(id, `${units}:nth-of-type(${String(index)})`);
    if (text === null) break;
    found.push(text);
  }
  return found;
}

/** Every attribute of the shadow root's elements that would give a tab stop, a role or a name. */
async function stopsAndNames(driver: Driver, id: string): Promise<string[]> {
  return (await driver.elements(id)).flatMap((part) => ["tabindex", "role", "aria-label", "aria-labelledby"].filter((name) => name in part.attributes).map((name) => `${part.name}.${part.attributes.class ?? ""}[${name}=${part.attributes[name] ?? ""}]`));
}

/** Whether the shadow root renders the module's scroll box. */
async function hasScrollBox(driver: Driver, id: string): Promise<boolean> {
  return (await driver.elements(id)).some((part) => (part.attributes.class ?? "").split(" ").includes("region-box"));
}

/** The number of lines a set of rects lies on (distinct tops, to a tenth of a px). */
function lineCount(rects: readonly Bounds[]): number {
  return new Set(rects.map((rect) => tenth(rect.y))).size;
}

/** The number of lines the characters of `.code` lie on, line breaks left out. */
async function codeLines(driver: Driver, id: string): Promise<number> {
  return lineCount((await driver.characters(id, code)).filter((each) => each.text !== "\n" && each.width > 0));
}

/** The characters of `.code` in visual order: sorted by their left edge, line by line from the top. */
function visualOrder(chars: readonly CharacterBox[]): string {
  return [...chars]
    .filter((each) => each.text !== "\n")
    .sort((a, b) => tenth(a.y) - tenth(b.y) || a.x - b.x)
    .map((each) => each.text)
    .join("");
}

/** The first character of every line of the characters of `.code`. */
function lineStarts(chars: readonly CharacterBox[]): CharacterBox[] {
  return chars.filter((each, index) => each.text !== "\n" && (index === 0 || chars[index - 1]?.text === "\n"));
}

/** Whether `inner` lies inside `outer` on the inline axis, half a px of tolerance. */
const insideInline = (inner: { readonly x: number; readonly width: number }, outer: Box): boolean => inner.x >= outer.x - 0.5 && inner.x + inner.width <= outer.x + outer.width + 0.5;

/** The scroll box's figures: its overflow, its range and its position. */
async function scrollFigures(driver: Driver, id: string): Promise<{ readonly scrollWidth: number; readonly clientWidth: number; readonly scrollHeight: number; readonly clientHeight: number; readonly scrollLeft: number }> {
  const read = async (property: string): Promise<number> => Number(await readOnce(driver, boxOf(id), property));
  return { scrollWidth: await read("scrollWidth"), clientWidth: await read("clientWidth"), scrollHeight: await read("scrollHeight"), clientHeight: await read("clientHeight"), scrollLeft: await driver.scrollLeft(boxOf(id)) };
}

/** The box's tab stop, role, name and fade, from its attributes. */
async function boxState(driver: Driver, id: string): Promise<Record<string, string | null>> {
  const fade = (await driver.elements(id)).find((part) => (part.attributes.class ?? "").split(" ").includes("region-box"))?.attributes["data-fade"] ?? null;
  return { ...(await boxAttributes(driver, id)), "data-fade": fade };
}

const overflowingNamed = (name: string, fade: string | null): Record<string, string | null> => ({ tabindex: "0", role: "group", "aria-label": name, "data-fade": fade });
const atRest: Record<string, string | null> = { tabindex: null, role: null, "aria-label": null, "data-fade": null };

/** The block's ring: style, width and colour of `.block`'s outline. */
async function blockRing(driver: Driver, id: string): Promise<{ readonly style: string; readonly width: string; readonly colour: string }> {
  return { style: await driver.computed(id, "outline-style", block), width: await driver.computed(id, "outline-width", block), colour: await driver.computed(id, "outline-color", block) };
}

/** The `tabindex` of `.block`, or null. */
async function blockTabindex(driver: Driver, id: string): Promise<string | null> {
  return (await driver.elements(id)).find((part) => (part.attributes.class ?? "").split(" ").includes("block"))?.attributes.tabindex ?? null;
}

/** The StaticText names under the element `id` in the CDP tree, joined in tree order. */
async function axText(driver: Driver, id: string): Promise<string> {
  return (await driver.axSubtree(id))
    .filter((node) => node.role === "StaticText")
    .map((node) => node.name)
    .join("");
}

/** A code block with `id`, its attributes and its text. */
const codeBlock = (id: string, text: string, attributes = ""): string => `<ocelle-code-block id="${id}"${attributes}>${text}</ocelle-code-block>`;

/** The type of `.code`: what US2-1 and FR-021 read. */
async function codeType(driver: Driver, id: string): Promise<Record<string, string>> {
  const [style] = await driver.styles(id, code, ["font-family", "font-variant-numeric", "font-size", "line-height", "white-space", "overflow-wrap", "margin-top", "direction", "text-align"]);
  if (style === undefined) throw new Error(`no ${code} in the shadow root of #${id}`);
  return style;
}

/** The ground and the box of `.block`: what US2-1, FR-021 and FR-034 read. */
async function blockLook(driver: Driver, id: string): Promise<Record<string, string>> {
  const [style] = await driver.styles(id, block, ["background-color", "padding-top", "padding-left", "border-top-left-radius", "border-top-style", "border-top-width", "border-top-color"]);
  if (style === undefined) throw new Error(`no ${block} in the shadow root of #${id}`);
  return style;
}

const wrapType = { "font-family": sans, "font-variant-numeric": figures, "font-size": px(fontSize), "line-height": px(lineHeight), "white-space": "pre-wrap", "overflow-wrap": "anywhere", "margin-top": "0px", direction: "ltr", "text-align": "left" };
const blockFor = (theme: Palette): Record<string, string> => ({
  "background-color": tokenColour("color-inset", theme),
  "padding-top": px(padding),
  "padding-left": px(padding),
  "border-top-left-radius": px(radius),
  "border-top-style": "solid",
  "border-top-width": px(border),
  "border-top-color": "rgba(0, 0, 0, 0)",
});

/** The font family of `.code` and of every unit, each, distinct values only. */
async function families(driver: Driver, id: string): Promise<string[]> {
  const of = [...(await driver.styles(id, code, ["font-family"])), ...(await driver.styles(id, units, ["font-family"]))].map((each) => each["font-family"] ?? "");
  return [...new Set(of)];
}

/**
 * The break-position sweep of US2-12 (contracts/checks.md § Oracles, "Break positions"; operator decision Q2 (c)) over
 * `pre` widths from 60 to 300 px: the host's inline size is set through the CSSOM so that `.code`'s content box is
 * each width. At each width: every group has one rect; the prefix has one rect where its width at 300 px plus
 * `--ocelle-space-1` fits the content box; the block holds more than one line exactly where the digest's inline size
 * (the units' widths at 300 px and one gap per adjacent pair) is wider than the content box; every line's first unit
 * starts at the content box's inline start; the page does not scroll sideways. Each list names the widths that fail.
 */
async function sweep(driver: Driver, text: string): Promise<unknown> {
  await page(driver, codeBlock("cb", text, " digest"));
  const set = async (width: number): Promise<void> => {
    await driver.style("cb", "inline-size", px(width + around));
  };
  await set(300);
  const shown = await unitTexts(driver, "cb");
  const wide = await driver.clientRects("cb", units);
  const widths = wide.map((rects) => rects[0]?.width ?? 0);
  const prefixWidth = widths[0] ?? 0;
  const digestWidth = widths.reduce((sum, width) => sum + width, 0) + gap * (widths.length - 1);
  const viewport = await driver.scrollWidth();
  const faults = { widthWrong: [] as number[], groupSplit: [] as number[], prefixSplitWhereFits: [] as number[], lineCountWrong: [] as number[], lineStartOff: [] as number[], reflowWrong: [] as number[] };
  let measured = 0;
  let multiLine = 0;
  for (let width = 60; width <= 300; width += 1) {
    await set(width);
    const pre = await driver.box("cb", code);
    const rects = await driver.clientRects("cb", units);
    const groupRects = await driver.clientRects("cb", groups);
    if (rects.length === 0) continue;
    measured += 1;
    if (Math.abs(pre.width - width) > 0.01) faults.widthWrong.push(width);
    if (groupRects.some((each) => each.length !== 1)) faults.groupSplit.push(width);
    if (prefixWidth + gap <= width && (rects[0]?.length ?? 0) !== 1) faults.prefixSplitWhereFits.push(width);
    const all = rects.flat();
    const lines = lineCount(all);
    if (lines > 1) multiLine += 1;
    if (lines > 1 !== digestWidth > width) faults.lineCountWrong.push(width);
    const tops = [...new Set(all.map((rect) => tenth(rect.y)))];
    if (tops.some((top) => Math.abs(Math.min(...all.filter((rect) => tenth(rect.y) === top).map((rect) => rect.x)) - pre.x) > 0.5)) faults.lineStartOff.push(width);
    if ((await driver.scrollWidth()) !== viewport) faults.reflowWrong.push(width);
  }
  return { units: shown, measured, wrapsSomewhere: multiLine > 0, ...faults };
}

const sweepClean = (unitList: readonly string[]): unknown => ({ units: unitList, measured: 241, wrapsSomewhere: true, widthWrong: [], groupSplit: [], prefixSplitWhereFits: [], lineCountWrong: [], lineStartOff: [], reflowWrong: [] });

/** The rtl line-start bodies' three lines (contracts/checks.md, US2-8 line starts). */
const rtlLines = ["cd /srv/app", command, "ls"].join("\n");
const rtlLinesChanged = ["git status", "pnpm exec vitest run --project elements --project elements-browser code-block --reporter verbose", "pwd"].join("\n");

/** What the line-start oracle reads of an overflowing scroll block: directions, line starts, position, fade and mask. */
async function lineStartReading(driver: Driver, id: string): Promise<unknown> {
  const box = await driver.box(id, regionBox);
  const starts = lineStarts(await driver.characters(id, code));
  const figures = await scrollFigures(driver, id);
  const range = figures.scrollWidth - figures.clientWidth;
  const mask = await driver.computedOf(boxOf(id), "mask-image");
  return {
    directions: { block: await driver.computed(id, "direction", block), box: await driver.computed(id, "direction", regionBox), code: await driver.computed(id, "direction", code) },
    overflowing: range > 1,
    lines: starts.length,
    startsInside: starts.map((each) => insideInline(each, box)),
    position: Math.abs(figures.scrollLeft) < 1 ? "start of the scroll origin" : Math.abs(figures.scrollLeft + range) <= 1 ? "-(scrollWidth - clientWidth)" : `other: ${String(figures.scrollLeft)} of ${String(range)}`,
    fade: (await boxState(driver, id))["data-fade"],
    maskTransparentAtRight: mask.startsWith("linear-gradient(to left, rgba(0, 0, 0, 0)"),
  };
}

export const codeBlockScenarios: readonly Scenario[] = [
  {
    name: "US2-1: three lines shown with their line breaks and runs of spaces as written, in --ocelle-font-sans with --ocelle-figures at --ocelle-line-height-relaxed on --ocelle-color-inset (light), padding --ocelle-space-3, radius --ocelle-radius-2; no monospace on .code (FR-021)",
    run: guarded(async (driver) => {
      const text = "line one\n  two  spaced\nthree";
      await page(driver, codeBlock("cb", text));
      return { shown: await driver.textOf("cb", code), lines: await codeLines(driver, "cb"), type: await codeType(driver, "cb"), families: await families(driver, "cb"), block: await blockLook(driver, "cb") };
    }),
    expected: { shown: "line one\n  two  spaced\nthree", lines: 3, type: wrapType, families: [sans], block: blockFor("light") },
  },
  {
    name: "US2-1 in dark: the block's ground is the dark --ocelle-color-inset, the text still in --ocelle-font-sans with --ocelle-figures",
    run: guarded(async (driver) => {
      await page(driver, codeBlock("cb", "git push origin main"));
      await driver.theme("dark");
      return { ground: (await blockLook(driver, "cb"))["background-color"], families: await families(driver, "cb"), figures: (await codeType(driver, "cb"))["font-variant-numeric"] };
    }),
    expected: { ground: tokenColour("color-inset", "dark"), families: [sans], figures },
  },
  {
    name: "US2-2: in a container wider than --ocelle-measure-reading the block's inline size is the measure, read in px from a probe of the token in the same font, and less than the container",
    run: guarded(async (driver) => {
      await page(driver, `<div data-test="wide">${codeBlock("cb", longLine)}<div id="measure" data-test="measure"></div></div>`);
      const measure = (await driver.box("measure")).width;
      const host = await driver.box("cb");
      return { equalsMeasure: tenth(host.width) === tenth(measure), narrowerThanContainer: host.width < 1200, cap: Math.abs(Number.parseFloat(await driver.computed("cb", "max-inline-size")) - measure) < 0.05, display: host.display };
    }),
    expected: { equalsMeasure: true, narrowerThanContainer: true, cap: true, display: "block" },
  },
  {
    name: "US2-3: wrap mode, a 200-character line with no spaces in a 288 px element at a 320 px viewport wraps inside the block: block scroll width equals client width, page scroll width 320, no tab stop and no role; the shadow pre is in the sans on the inset ground",
    run: guarded(async (driver) => {
      await page(driver, `<div data-test="narrow">${codeBlock("cb", longLine)}</div>`, 320);
      const target: ElementTarget = { id: "cb", inner: block };
      return {
        lines: (await codeLines(driver, "cb")) > 1,
        block: { scrollWidth: Number(await readOnce(driver, target, "scrollWidth")) === Number(await readOnce(driver, target, "clientWidth")) },
        page: await driver.scrollWidth(),
        stops: await stopsAndNames(driver, "cb"),
        scrollBox: await hasScrollBox(driver, "cb"),
        families: await families(driver, "cb"),
        ground: (await blockLook(driver, "cb"))["background-color"],
      };
    }),
    expected: { lines: true, block: { scrollWidth: true }, page: 320, stops: [], scrollBox: false, families: [sans], ground: tokenColour("color-inset", "light") },
  },
  {
    name: "US2-4: overflow=scroll, label=Build log, narrower than the line: one line, the box scrolls inline only, it is a tab stop with role group named Build log, and the end fades",
    run: guarded(async (driver) => {
      await page(driver, `<div data-test="narrow">${codeBlock("cb", longLine, ' overflow="scroll" label="Build log"')}</div>`);
      const figures = await scrollFigures(driver, "cb");
      const ax = await driver.axState("cb", regionBox);
      return {
        lines: await codeLines(driver, "cb"),
        whiteSpace: await driver.computed("cb", "white-space", code),
        inline: figures.scrollWidth - figures.clientWidth > 1,
        block: figures.scrollHeight === figures.clientHeight,
        state: await boxState(driver, "cb"),
        ax: { role: ax.role, name: ax.name, focusable: ax.focusable },
        masked: (await driver.computedOf(boxOf("cb"), "mask-image")).startsWith("linear-gradient("),
      };
    }),
    expected: { lines: 1, whiteSpace: "pre", inline: true, block: true, state: overflowingNamed("Build log", "end"), ax: { role: "group", name: "Build log", focusable: true }, masked: true },
  },
  {
    name: "US2-5: the overflowing scroll block focused by Tab, ArrowRight scrolls 40 px with no frame between and the start fade appears; ArrowLeft scrolls back and only the end fades",
    run: guarded(async (driver) => {
      await page(driver, between(`<div data-test="narrow">${codeBlock("cb", longLine, ' overflow="scroll" label="Build log"')}</div>`));
      await driver.focus("before");
      await driver.chord("Tab");
      const focused = await driver.deepActive();
      const record = await driver.frameRecord(boxOf("cb"), { property: "scrollLeft" });
      await driver.chord("ArrowRight");
      const right = await record.stop();
      const afterRight = { scrollLeft: await driver.scrollLeft(boxOf("cb")), fade: (await boxState(driver, "cb"))["data-fade"] };
      await driver.chord("ArrowLeft");
      const afterLeft = { scrollLeft: await driver.scrollLeft(boxOf("cb")), fade: (await boxState(driver, "cb"))["data-fade"] };
      const frames = right.slice(right.indexOf("keydown") + 1).filter((each) => !each.startsWith("resize"));
      return { focused, afterRight, instant: frames.length > 0 && frames.every((each) => each === String(step)), afterLeft };
    }),
    expected: { focused: "cb >> div.region-box", afterRight: { scrollLeft: step, fade: "both" }, instant: true, afterLeft: { scrollLeft: 0, fade: "end" } },
  },
  {
    name: "US2-6: a fitting scroll block is no tab stop and has no role or name; narrowed until it overflows it becomes a tab stop named by its label; widened again while focused, focus moves to .region-frame (US2-21's oracle)",
    run: guarded(async (driver) => {
      await page(driver, between(`<div id="frame">${codeBlock("cb", "git push origin main", ' overflow="scroll" label="Build log"')}</div>`));
      const fitting = { state: await boxState(driver, "cb"), box: await hasScrollBox(driver, "cb") };
      await driver.size("frame", 120, null);
      const narrow = await boxState(driver, "cb");
      await driver.focus("before");
      await driver.chord("Tab");
      const focused = await driver.deepActive();
      await driver.size("frame", 1000, null);
      return { fitting, narrow, focused, widened: await driver.deepActive(), state: await boxState(driver, "cb") };
    }),
    expected: { fitting: { state: atRest, box: true }, narrow: overflowingNamed("Build log", "end"), focused: "cb >> div.region-box", widened: "cb >> div.region-frame", state: atRest },
  },
  {
    name: "US2-7: an overflowing scroll block with no label and no host aria-label is a tab stop with no role and no name (the module's rule), a generic node in the CDP tree",
    run: guarded(async (driver) => {
      await page(driver, between(`<div data-test="narrow">${codeBlock("cb", command, ' overflow="scroll"')}</div>`));
      const ax = await driver.axState("cb", regionBox);
      await driver.focus("before");
      await driver.chord("Tab");
      return { state: await boxState(driver, "cb"), ax: { role: ax.role, name: ax.name }, tabbed: await driver.deepActive() };
    }),
    expected: { state: { tabindex: "0", role: null, "aria-label": null, "data-fade": "end" }, ax: { role: "generic", name: "" }, tabbed: "cb >> div.region-box" },
  },
  {
    name: "US2-8 visual order: under a dir=rtl ancestor `--force main.` reads `--force main.` in visual order (characters sorted by their left edge), in wrap and in scroll mode",
    run: guarded(async (driver) => {
      await page(driver, `<div dir="rtl">${codeBlock("wrap", "--force main.")}${codeBlock("scroll", "--force main.", ' overflow="scroll" label="Flags"')}</div>`);
      return { wrap: visualOrder(await driver.characters("wrap", code)), scroll: visualOrder(await driver.characters("scroll", code)) };
    }),
    expected: { wrap: "--force main.", scroll: "--force main." },
  },
  {
    name: "US2-8 line starts: under a dir=rtl ancestor an overflowing scroll block at rest keeps the page direction (block and box rtl, code ltr), every line's first character is inside the box, the box is at -(scrollWidth - clientWidth), data-fade is start and the mask is transparent at the right",
    run: guarded(async (driver) => {
      await page(driver, `<div dir="rtl" data-test="frame">${codeBlock("cb", rtlLines, ' overflow="scroll" label="Commands"')}</div>`);
      return await lineStartReading(driver, "cb");
    }),
    expected: { directions: { block: "rtl", box: "rtl", code: "ltr" }, overflowing: true, lines: 3, startsInside: [true, true, true], position: "-(scrollWidth - clientWidth)", fade: "start", maskTransparentAtRight: true },
  },
  {
    name: "US2-8 line starts after a text change: the rtl scroll block's new overflowing lines open at their starts too (the write follows the text change)",
    run: guarded(async (driver) => {
      await page(driver, `<div dir="rtl" data-test="frame">${codeBlock("cb", rtlLines, ' overflow="scroll" label="Commands"')}</div>`);
      await driver.setScrollLeft(boxOf("cb"), -10);
      await driver.setProperty("cb", "textContent", rtlLinesChanged);
      return { shown: await driver.textOf("cb", code), ...((await lineStartReading(driver, "cb")) as object) };
    }),
    expected: { shown: rtlLinesChanged, directions: { block: "rtl", box: "rtl", code: "ltr" }, overflowing: true, lines: 3, startsInside: [true, true, true], position: "-(scrollWidth - clientWidth)", fade: "start", maskTransparentAtRight: true },
  },
  {
    name: "US2-8 ltr control: under a dir=ltr ancestor the overflowing scroll block is not written: scrollLeft 0, every line's first character inside the box, data-fade end, before and after a text change",
    run: guarded(async (driver) => {
      await page(driver, `<div dir="ltr" data-test="frame">${codeBlock("cb", rtlLines, ' overflow="scroll" label="Commands"')}</div>`);
      const read = async (): Promise<unknown> => {
        const box = await driver.box("cb", regionBox);
        const starts = lineStarts(await driver.characters("cb", code));
        return { scrollLeft: await driver.scrollLeft(boxOf("cb")), lines: starts.length, startsInside: starts.map((each) => insideInline(each, box)), fade: (await boxState(driver, "cb"))["data-fade"], box: await driver.computed("cb", "direction", regionBox) };
      };
      const atRestReading = await read();
      await driver.setProperty("cb", "textContent", rtlLinesChanged);
      return { atRest: atRestReading, changed: await read() };
    }),
    expected: {
      atRest: { scrollLeft: 0, lines: 3, startsInside: [true, true, true], fade: "end", box: "ltr" },
      changed: { scrollLeft: 0, lines: 3, startsInside: [true, true, true], fade: "end", box: "ltr" },
    },
  },
  {
    name: "US2-9: digest mode shows sha256: as written and 16 groups of four, a --ocelle-space-1 gap after every unit but the last (measured between units on one line), none inside a group; the light-DOM text is unchanged",
    run: guarded(async (driver) => {
      await page(driver, codeBlock("cb", digest, " digest"));
      const rects = (await driver.clientRects("cb", units)).map((each) => each[0]);
      const sameLineGaps = rects.flatMap((rect, index) => {
        const next = rects[index + 1];
        return rect !== undefined && next !== undefined && tenth(next.y) === tenth(rect.y) ? [tenth(next.x - (rect.x + rect.width))] : [];
      });
      const chars = await driver.characters("cb", code);
      const inGroup: number[] = [];
      let at = "sha256:".length;
      for (const group of hexGroups) {
        for (let index = at; index < at + group.length - 1; index += 1) {
          const a = chars[index];
          const b = chars[index + 1];
          if (a !== undefined && b !== undefined && tenth(a.y) === tenth(b.y)) inGroup.push(tenth(b.x - (a.x + a.width)));
        }
        at += group.length;
      }
      return {
        units: await unitTexts(driver, "cb"),
        margins: (await driver.styles("cb", units, ["margin-inline-end"])).map((each) => each["margin-inline-end"]),
        gaps: { measured: sameLineGaps.length > 10, all: [...new Set(sameLineGaps)] },
        inGroup: [...new Set(inGroup)],
        light: await driver.property("cb", "textContent"),
      };
    }),
    expected: {
      units: ["sha256:", ...hexGroups],
      margins: [...Array.from({ length: 16 }, () => px(gap)), "0px"],
      gaps: { measured: true, all: [gap] },
      inGroup: [0],
      light: digest,
    },
  },
  {
    name: "US2-10: with the block the last content of the page, a triple-click copy of the digest block gives exactly the trimmed digest; a run of groups 2 to 5 copies exactly their characters; the units carry the gap",
    run: guarded(async (driver) => {
      await page(driver, `<p>Before.</p>${codeBlock("cb", `  ${digest}\n  `, " digest")}`);
      await driver.box("cb", code);
      return { units: (await unitTexts(driver, "cb")).length, gap: (await driver.styles("cb", prefix, ["margin-inline-end"]))[0]?.["margin-inline-end"], whole: await driver.copyShadow("cb", code), run: await driver.copyShadowRun("cb", code, 4, 10) };
    }),
    expected: { units: 17, gap: px(gap), whole: digest, run: "d081884c7d659a2f" },
  },
  {
    name: "US2-10: with a paragraph after the block, the whole-block copy gives the trimmed digest followed by the platform's one newline, nothing added between groups",
    run: guarded(async (driver) => {
      await page(driver, `${codeBlock("cb", `\n${digest} `, " digest")}<p>After.</p>`);
      await driver.box("cb", code);
      return { units: (await unitTexts(driver, "cb")).length, whole: await driver.copyShadow("cb", code) };
    }),
    expected: { units: 17, whole: `${digest}\n` },
  },
  {
    name: "US2-10 in scroll mode: the digest block last on the page copies exactly the trimmed digest, and the prefix with the first group copies exactly `sha256:9f86`",
    run: guarded(async (driver) => {
      await page(driver, `<p>Before.</p><div data-test="narrow">${codeBlock("cb", digest, ' digest overflow="scroll" label="Digest"')}</div>`);
      await driver.box("cb", code);
      return { whole: await driver.copyShadow("cb", code), run: await driver.copyShadowRun("cb", code, 0, 2) };
    }),
    expected: { whole: digest, run: "sha256:9f86" },
  },
  {
    name: "US2-11: the StaticText names under the digest block in the CDP tree, joined in tree order, are the trimmed digest, and the aria snapshot of the shadow pre is one text run of it; the digest is rendered as 17 units",
    run: guarded(async (driver) => {
      await page(driver, codeBlock("cb", ` ${digest}\n`, " digest"));
      await driver.box("cb", code);
      return { units: (await unitTexts(driver, "cb")).length, ax: await axText(driver, "cb"), snapshot: await driver.ariaSnapshot("cb", code) };
    }),
    expected: { units: 17, ax: digest, snapshot: `- text: ${digest}` },
  },
  {
    name: "US2-12 base64url sweep, 60 to 300 px: no group breaks inside (`L-qg` guards the groups' nowrap), the prefix is one rect wherever it and its gap fit, lines break only where the digest is wider than the pre, every line starts at the content edge, no sideways page scroll",
    run: guarded(async (driver) => await sweep(driver, base64url)),
    expected: sweepClean(base64urlUnits),
  },
  {
    name: "US2-12 base64 sweep, 60 to 300 px: the same break positions for a digest whose groups hold `/` and `+`",
    run: guarded(async (driver) => await sweep(driver, base64)),
    expected: sweepClean(base64Units),
  },
  {
    name: "US2-12 wide prefix: `ni:sha-256:` with the base64url digest at a 60 px pre breaks inside the prefix (wider than the line, WCAG 1.4.10) while every group has one rect and the page does not scroll sideways; at 300 px the prefix is one rect",
    run: guarded(async (driver) => {
      await page(driver, codeBlock("cb", `ni:sha-256:${base64url.slice("sha256:".length)}`, " digest"));
      const viewport = await driver.scrollWidth();
      const read = async (width: number): Promise<unknown> => {
        await driver.style("cb", "inline-size", px(width + around));
        return { prefix: ((await driver.clientRects("cb", prefix))[0] ?? []).length, groups: [...new Set((await driver.clientRects("cb", groups)).map((each) => each.length))], reflow: (await driver.scrollWidth()) === viewport };
      };
      return { first: (await unitTexts(driver, "cb"))[0], narrow: await read(60), wide: await read(300) };
    }),
    expected: { first: "ni:sha-256:", narrow: { prefix: 2, groups: [1], reflow: true }, wide: { prefix: 1, groups: [1], reflow: true } },
  },
  {
    name: "US2-13: a digest block with overflow=scroll narrower than the digest keeps it on one line and scrolls: a tab stop named by its label",
    run: guarded(async (driver) => {
      await page(driver, `<div data-test="narrow">${codeBlock("cb", digest, ' digest overflow="scroll" label="Commit digest"')}</div>`);
      return { lines: lineCount((await driver.clientRects("cb", units)).flat()), units: (await unitTexts(driver, "cb")).length, state: await boxState(driver, "cb") };
    }),
    expected: { lines: 1, units: 17, state: overflowingNamed("Commit digest", "end") },
  },
  {
    name: "US2-14: digest content of ten characters with no colon gives the groups abcd, efgh and ij, counted from the start, and no prefix",
    run: guarded(async (driver) => {
      await page(driver, codeBlock("cb", "abcdefghij", " digest"));
      return { units: await unitTexts(driver, "cb"), prefix: (await driver.clientRects("cb", prefix)).length, groups: (await driver.clientRects("cb", groups)).length };
    }),
    expected: { units: ["abcd", "efgh", "ij"], prefix: 0, groups: 3 },
  },
  {
    name: "US2-15: digest content holding whitespace inside is shown as the default mode shows it, as written, with no groups",
    run: guarded(async (driver) => {
      await page(driver, codeBlock("cb", "sha256: 9f86 d081", " digest"));
      return { shown: await driver.textOf("cb", code), units: (await driver.clientRects("cb", units)).length, whiteSpace: await driver.computed("cb", "white-space", code) };
    }),
    expected: { shown: "sha256: 9f86 d081", units: 0, whiteSpace: "pre-wrap" },
  },
  {
    name: "US2-16 child list: textContent set by a script replaces the shown text, the digest groups and the overflow state follow",
    run: guarded(async (driver) => {
      await page(driver, `<div data-test="narrow">${codeBlock("wrap", "first")}${codeBlock("dig", "sha256:abcd", " digest")}${codeBlock("scroll", "ls", ' overflow="scroll" label="Log"')}</div>`);
      const before = { wrap: await driver.textOf("wrap", code), dig: await unitTexts(driver, "dig"), scroll: (await boxState(driver, "scroll")).tabindex };
      await driver.setProperty("wrap", "textContent", "second");
      await driver.setProperty("dig", "textContent", "sha256:12345678ab");
      await driver.setProperty("scroll", "textContent", command);
      return { before, after: { wrap: await driver.textOf("wrap", code), dig: await unitTexts(driver, "dig"), scroll: (await boxState(driver, "scroll")).tabindex } };
    }),
    expected: { before: { wrap: "first", dig: ["sha256:", "abcd"], scroll: null }, after: { wrap: "second", dig: ["sha256:", "1234", "5678", "ab"], scroll: "0" } },
  },
  {
    name: "US2-16 swap: an htmx-style swap of the content (innerHTML) is followed: the shown text and the digest groups are the new content's",
    run: guarded(async (driver) => {
      await page(driver, `${codeBlock("wrap", "old <b>text</b>")}${codeBlock("dig", "md5:aaaa", " digest")}`);
      await driver.setProperty("wrap", "innerHTML", "new <i>copy</i> here");
      await driver.setProperty("dig", "innerHTML", "md5:<span>bbbbcccc</span>");
      return { wrap: await driver.textOf("wrap", code), dig: await unitTexts(driver, "dig") };
    }),
    expected: { wrap: "new copy here", dig: ["md5:", "bbbb", "cccc"] },
  },
  {
    name: "US2-16 character data: a change of the data of the host's own text node is followed in wrap and in digest mode",
    run: guarded(async (driver) => {
      await page(driver, `${codeBlock("wrap", "before")}${codeBlock("dig", "sha256:abcd", " digest")}`);
      await driver.text("wrap", "after");
      await driver.text("dig", "sha256:abcdef12");
      return { wrap: await driver.textOf("wrap", code), dig: await unitTexts(driver, "dig") };
    }),
    expected: { wrap: "after", dig: ["sha256:", "abcd", "ef12"] },
  },
  {
    name: "US2-16 character data in a child element: a change of the data of a text node inside a child <b> is followed (the observer's subtree), in wrap and in digest mode",
    run: guarded(async (driver) => {
      await page(driver, `${codeBlock("wrap", 'a <b id="bold">bold</b> c')}${codeBlock("dig", 'sha256:<b id="part">abcd</b>', " digest")}`);
      await driver.textData("bold", 0, "strong");
      await driver.textData("part", 0, "1234ab");
      return { wrap: await driver.textOf("wrap", code), dig: await unitTexts(driver, "dig") };
    }),
    expected: { wrap: "a strong c", dig: ["sha256:", "1234", "ab"] },
  },
  {
    name: "US2-17: in forced colours the text is CanvasText and the block's edge a CanvasText border, in wrap and in scroll mode; an overflowing scroll block shows the module's CanvasText edge line at the hidden end",
    run: guarded(async (driver) => {
      await page(driver, `<div data-test="narrow">${codeBlock("wrap", "git push origin main")}${codeBlock("scroll", command, ' overflow="scroll" label="Deploy"')}</div>`);
      await driver.forcedColors("active");
      const canvasText = await driver.resolveColour("CanvasText");
      const look = async (id: string): Promise<unknown> => {
        const style = await blockLook(driver, id);
        return { text: (await driver.computed(id, "color", code)) === canvasText, edge: { style: style["border-top-style"], width: style["border-top-width"], colour: style["border-top-color"] === canvasText } };
      };
      const reading = {
        wrap: await look("wrap"),
        scroll: await look("scroll"),
        endLine: { style: await driver.computedOf({ id: "scroll", inner: ".region-edge.end" }, "border-right-style"), colour: (await driver.computedOf({ id: "scroll", inner: ".region-edge.end" }, "border-right-color")) === canvasText },
      };
      await driver.forcedColors("none");
      return reading;
    }),
    expected: {
      wrap: { text: true, edge: { style: "solid", width: px(border), colour: true } },
      scroll: { text: true, edge: { style: "solid", width: px(border), colour: true } },
      endLine: { style: "solid", colour: true },
    },
  },
  {
    name: "US2-18: with prefers-reduced-motion, ArrowRight on the focused scroll block moves it 40 px in the first frame and nothing animates between",
    run: guarded(async (driver) => {
      await page(driver, between(`<div data-test="narrow">${codeBlock("cb", command, ' overflow="scroll" label="Deploy"')}</div>`));
      await driver.reducedMotion("reduce");
      await driver.focus("before");
      await driver.chord("Tab");
      const record = await driver.frameRecord(boxOf("cb"), { property: "scrollLeft" });
      await driver.chord("ArrowRight");
      const frames = await record.stop();
      const after = frames.slice(frames.indexOf("keydown") + 1).filter((each) => !each.startsWith("resize"));
      const reading = { focused: await driver.deepActive(), first: after[0], every: [...new Set(after)], running: (await driver.animations("cb")).length };
      await driver.reducedMotion("no-preference");
      return reading;
    }),
    expected: { focused: "cb >> div.region-box", first: String(step), every: [String(step)], running: 0 },
  },
  {
    name: "US2-19: an empty block is one line of .code high (24.8 px) plus the block's padding and border in wrap mode, and plus the module's block ring room in scroll mode, and the scroll block is no tab stop",
    run: guarded(async (driver) => {
      await page(driver, `${codeBlock("wrap", "")}${codeBlock("scroll", "", ' overflow="scroll" label="Empty"')}`);
      return {
        wrap: { code: tenth((await driver.box("wrap", code)).height), block: tenth((await driver.box("wrap", block)).height) },
        scroll: { code: tenth((await driver.box("scroll", code)).height), block: tenth((await driver.box("scroll", block)).height), state: await boxState(driver, "scroll") },
      };
    }),
    expected: {
      wrap: { code: lineHeight, block: tenth(lineHeight + 2 * padding + 2 * border) },
      scroll: { code: lineHeight, block: tenth(lineHeight + 2 * ringRoom + 2 * padding + 2 * border), state: atRest },
    },
  },
  {
    name: "US2-20: `a <b>bold</b> c` is shown as `a bold c` in one weight: the shadow root has no slot and no b element, and .code has the regular weight",
    run: guarded(async (driver) => {
      await page(driver, codeBlock("cb", "a <b>bold</b> c"));
      const names = (await driver.elements("cb")).map((part) => part.name);
      return { shown: await driver.textOf("cb", code), slot: names.includes("slot"), bold: names.includes("b"), weight: await driver.computed("cb", "font-weight", code) };
    }),
    expected: { shown: "a bold c", slot: false, bold: false, weight: "400" },
  },
  {
    name: "US2-21: an overflowing scroll block focused by Tab, whose container widens until the text fits, hands focus to .region-frame; document.activeElement is the host",
    run: guarded(async (driver) => {
      await page(driver, between(`<div id="frame">${codeBlock("cb", "docker compose up --detach", ' overflow="scroll" label="Deploy"')}</div>`));
      await driver.size("frame", 150, null);
      await driver.focus("before");
      await driver.chord("Tab");
      const focused = await driver.deepActive();
      await driver.size("frame", 1000, null);
      const active = await driver.activeElement();
      return { focused, handed: await driver.deepActive(), host: active.hosts[0] ?? active.id, state: await boxState(driver, "cb") };
    }),
    expected: { focused: "cb >> div.region-box", handed: "cb >> div.region-frame", host: "cb", state: atRest },
  },
];

export const codeBlockRuleScenarios: readonly Scenario[] = [
  {
    name: "FR-020: a newline directly after the opening tag is shown as an empty first line (two lines of .code)",
    run: guarded(async (driver) => {
      await page(driver, codeBlock("cb", "\nfirst"));
      return { shown: await driver.textOf("cb", code), height: tenth((await driver.box("cb", code)).height) };
    }),
    expected: { shown: "\nfirst", height: tenth(2 * lineHeight) },
  },
  {
    name: "FR-020: markup-like text stays text in wrap mode: the shadow root has no b or img element and the shown text is the characters",
    run: guarded(async (driver) => {
      await page(driver, codeBlock("cb", "&lt;b&gt;x&lt;/b&gt; &lt;img/src=x/onerror=alert(1)&gt;"));
      const names = (await driver.elements("cb")).map((part) => part.name);
      return { shown: await driver.textOf("cb", code), b: names.includes("b"), img: names.includes("img"), messages: await driver.messages() };
    }),
    expected: { shown: "<b>x</b> <img/src=x/onerror=alert(1)>", b: false, img: false, messages: [] },
  },
  {
    name: "FR-020: markup-like text stays text in digest mode: the groups hold the characters and the shadow root has no img element",
    run: guarded(async (driver) => {
      await page(driver, codeBlock("cb", "&lt;img/src=x/onerror=alert(1)&gt;", " digest"));
      const names = (await driver.elements("cb")).map((part) => part.name);
      return { units: await unitTexts(driver, "cb"), img: names.includes("img"), messages: await driver.messages() };
    }),
    expected: { units: ["<img", "/src", "=x/o", "nerr", "or=a", "lert", "(1)>"], img: false, messages: [] },
  },
  {
    name: "FR-022: overflow ` SCROLL ` (trimmed, any ASCII case) is the scroll policy; `auto` and an empty value are the wrap policy",
    run: guarded(async (driver) => {
      await page(driver, `<div data-test="narrow">${codeBlock("upper", command, ' overflow=" SCROLL " label="Log"')}${codeBlock("auto", command, ' overflow="auto" label="Log"')}${codeBlock("empty", command, ' overflow="" label="Log"')}</div>`);
      const policy = async (id: string): Promise<unknown> => ({ scrollBox: await hasScrollBox(driver, id), whiteSpace: await driver.computed(id, "white-space", code), stops: (await stopsAndNames(driver, id)).length });
      return { upper: await policy("upper"), auto: await policy("auto"), empty: await policy("empty") };
    }),
    expected: { upper: { scrollBox: true, whiteSpace: "pre", stops: 3 }, auto: { scrollBox: false, whiteSpace: "pre-wrap", stops: 0 }, empty: { scrollBox: false, whiteSpace: "pre-wrap", stops: 0 } },
  },
  {
    name: "FR-025: switching overflow at run time gives the other policy in full each way and leaves no tab stop, role or name behind: wrap, scroll, wrap, scroll",
    run: guarded(async (driver) => {
      await page(driver, `<div data-test="narrow">${codeBlock("cb", command, ' label="Deploy"')}</div>`);
      const read = async (): Promise<unknown> => ({ scrollBox: await hasScrollBox(driver, "cb"), whiteSpace: await driver.computed("cb", "white-space", code), stops: await stopsAndNames(driver, "cb") });
      const wrap = await read();
      await driver.setAttribute("cb", "overflow", "scroll");
      const scroll = await read();
      await driver.setAttribute("cb", "overflow", null);
      const back = await read();
      await driver.setProperty("cb", "overflow", "scroll");
      return { wrap, scroll, back, again: await read() };
    }),
    expected: {
      wrap: { scrollBox: false, whiteSpace: "pre-wrap", stops: [] },
      scroll: { scrollBox: true, whiteSpace: "pre", stops: ["div.region-box[tabindex=0]", "div.region-box[role=group]", "div.region-box[aria-label=Deploy]"] },
      back: { scrollBox: false, whiteSpace: "pre-wrap", stops: [] },
      again: { scrollBox: true, whiteSpace: "pre", stops: ["div.region-box[tabindex=0]", "div.region-box[role=group]", "div.region-box[aria-label=Deploy]"] },
    },
  },
  {
    name: "FR-025: a switch from scroll to wrap with the scroll box focused by Tab moves focus to .block, which shows the token ring (forced colours: Highlight); once focus leaves, .block has no tabindex",
    run: guarded(async (driver) => {
      await page(driver, between(`<div data-test="narrow">${codeBlock("cb", command, ' overflow="scroll" label="Deploy"')}</div>`));
      await driver.focus("before");
      await driver.chord("Tab");
      const focused = await driver.deepActive();
      await driver.setAttribute("cb", "overflow", "wrap");
      const moved = { deep: await driver.deepActive(), host: (await driver.activeElement()).hosts[0] ?? "none", ring: await blockRing(driver, "cb"), tabindex: await blockTabindex(driver, "cb") };
      await driver.forcedColors("active");
      const forced = (await blockRing(driver, "cb")).colour === (await driver.resolveColour("Highlight"));
      await driver.forcedColors("none");
      await driver.focus("after");
      return { focused, moved, forced, left: { deep: await driver.deepActive(), tabindex: await blockTabindex(driver, "cb") } };
    }),
    expected: {
      focused: "cb >> div.region-box",
      moved: { deep: "cb >> div.block", host: "cb", ring: { style: "solid", width: px(focusWidth), colour: tokenColour("color-focus", "light") }, tabindex: "-1" },
      forced: true,
      left: { deep: "after", tabindex: null },
    },
  },
  {
    name: "FR-025 after US2-21: overflow ended while the box was focused (focus on .region-frame), then the switch to wrap moves focus to .block with the token ring; once focus leaves, .block has no tabindex",
    run: guarded(async (driver) => {
      await page(driver, between(`<div id="frame">${codeBlock("cb", "docker compose up --detach", ' overflow="scroll" label="Deploy"')}</div>`));
      await driver.size("frame", 150, null);
      await driver.focus("before");
      await driver.chord("Tab");
      await driver.size("frame", 1000, null);
      const handed = await driver.deepActive();
      await driver.setAttribute("cb", "overflow", null);
      const moved = { deep: await driver.deepActive(), ring: await blockRing(driver, "cb") };
      await driver.focus("after");
      return { handed, moved, left: { deep: await driver.deepActive(), tabindex: await blockTabindex(driver, "cb") } };
    }),
    expected: { handed: "cb >> div.region-frame", moved: { deep: "cb >> div.block", ring: { style: "solid", width: px(focusWidth), colour: tokenColour("color-focus", "light") } }, left: { deep: "after", tabindex: null } },
  },
  {
    name: "FR-026: a non-blank host aria-label names the overflowing scroll box over label, at upgrade and when set later; a blank one counts as absent and label names it",
    run: guarded(async (driver) => {
      await page(driver, `<div data-test="narrow">${codeBlock("cb", command, ' overflow="scroll" label="Build log" aria-label="Deploy log"')}</div>`);
      const name = async (): Promise<unknown> => ({ attribute: (await boxAttributes(driver, "cb"))["aria-label"], ax: (await driver.axState("cb", regionBox)).name });
      const upgrade = await name();
      await driver.setAttribute("cb", "aria-label", "  ");
      const blank = await name();
      await driver.setAttribute("cb", "aria-label", "Release log");
      return { upgrade, blank, later: await name() };
    }),
    expected: { upgrade: { attribute: "Deploy log", ax: "Deploy log" }, blank: { attribute: "Build log", ax: "Build log" }, later: { attribute: "Release log", ax: "Release log" } },
  },
  {
    name: "FR-029: the prefix runs to the last colon (`ni:sha-256:abcd1`), a prefix alone has no groups (`sha256:`), and groups count code points (`x:ab😀cdef`: no lone surrogate in any group)",
    run: guarded(async (driver) => {
      await page(driver, `${codeBlock("colons", "ni:sha-256:abcd1", " digest")}${codeBlock("only", "sha256:", " digest")}${codeBlock("astral", "x:ab😀cdef", " digest")}`);
      const astral = await unitTexts(driver, "astral");
      return { colons: await unitTexts(driver, "colons"), only: await unitTexts(driver, "only"), astral, lone: astral.some((each) => /[\uD800-\uDFFF]/u.test(each)) };
    }),
    expected: { colons: ["ni:sha-256:", "abcd", "1"], only: ["sha256:"], astral: ["x:", "ab😀c", "def"], lone: false },
  },
  {
    name: "Host ARIA in wrap mode (story-less, plan Complexity Tracking): a host aria-label stays on the host as written and nothing in the shadow root gets a tab stop, role or name; the text is shown",
    run: guarded(async (driver) => {
      await page(driver, codeBlock("cb", "git push origin main", ' aria-label="Push command"'));
      return { attribute: await driver.attribute("cb", "aria-label"), stops: await stopsAndNames(driver, "cb"), shown: await driver.textOf("cb", code) };
    }),
    expected: { attribute: "Push command", stops: [], shown: "git push origin main" },
  },
  {
    name: "Edge case, shrink-to-fit host: a scroll block in a default flex item takes its content's size and does not overflow; given a definite inline size there, it overflows and is a tab stop named by its label",
    run: guarded(async (driver) => {
      await page(driver, `<div data-test="flex" id="flex">${codeBlock("cb", "docker compose --file deploy.yaml up --detach", ' overflow="scroll" label="Deploy"')}</div>`);
      const container = (await driver.box("flex")).width;
      const fitted = { wider: (await driver.box("cb")).width > container, state: await boxState(driver, "cb") };
      await driver.style("cb", "inline-size", "100%");
      return { fitted, sized: { width: tenth((await driver.box("cb")).width) === tenth(container), state: await boxState(driver, "cb") } };
    }),
    expected: { fitted: { wider: true, state: atRest }, sized: { width: true, state: overflowingNamed("Deploy", "end") } },
  },
  {
    name: "FR-001, Edge Cases: the host is a block box holding .block, and a hidden host has no box",
    run: guarded(async (driver) => {
      await page(driver, `${codeBlock("cb", "git push origin main")}${codeBlock("hidden", "git status", " hidden")}`);
      const host = await driver.box("cb");
      const inner = await driver.box("cb", block);
      return { display: host.display, holds: tenth(inner.height) === tenth(host.height) && inner.width > 0, hidden: { display: (await driver.box("hidden")).display, height: (await driver.box("hidden")).height } };
    }),
    expected: { display: "block", holds: true, hidden: { display: "none", height: 0 } },
  },
];
