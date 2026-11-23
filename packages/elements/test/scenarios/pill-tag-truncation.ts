// The shared bodies of User Story 5's browser scenarios, truncation and the full-text tooltip of the interactive
// `ocelle-pill-tag` (018 spec US5-1 to US5-6, FR-033, FR-034, FR-035 (d); research.md R-08, R-09; data-model.md
// § `ocelle-pill-tag` (fullText, truncated, the observers, the interactive host sheet); plan decisions 14 and 16;
// contracts/checks.md § US5 bodies, the tooltip half of § US4-10 and § Edge cases; tasks.md T056). Each body observes the
// page through the driver and returns one observation; each harness asserts it equals `expected`, written by hand from
// the spec, the data model, research and the phase-1 spikes (reviews/phase-1/spikes.md):
// - every step is settled by `settleLayout()`, so a `ResizeObserver` delivery and the update it requests have run;
// - the tooltip's state is read through `ocelle-tooltip`'s public behaviour only: its bubble open in the top layer
//   (`topLayer()`, the bubble part `<pill>[ocelle-tooltip[div]]`) and the text it shows (the last text box under the
//   pill, `textBoxes()`, which walks into the tooltip's shadow root), read after the pointer or keyboard focus has held
//   for `hold`, past the test delay of fixtures/tooltip-delay.css (300 ms, adopted in process and linked by the fixture
//   page `pill-tag-truncation.html`);
// - every "no tooltip" read sits in the same body as a truncated twin whose tooltip shows (contracts/checks.md § US5
//   negatives; plants `truncated` forced to false, `truncated` forced to true);
// - the full text is the default slot's flattened text, trimmed and with its whitespace collapsed.
// Exact-fit pills (`fit`): the container is set to the pill's natural width plus its two inline margins (one focus-ring
// extent each, plan decision 11), so the text span already has its whole inline size; a change of the text or of the
// font then changes no box, no `ResizeObserver` fires, and only the trigger the body names can re-measure. That is how
// each trigger body changes truncation through its trigger alone (research.md R-09). The `density` body sets the
// pill's spacing and line-height tokens on its host so both densities give the text span the same box.
//
// Carried from phase 5 (reviews/phase-5/round-1.md R1-04, operator decisions): the tooltip half of § US4-10 with its
// plant "the refocus in `updated()` (not queued)"; what the `min-inline-size: 0` chain is for, a truncating pill that
// shrinks to the room its flex row or grid track leaves (its margin box inside the row); and the disabled text's breaking
// of a long word inside the pill (US5-6's long-word body). In Chromium neither the host's and the row's
// `min-inline-size: 0` nor `overflow-wrap: anywhere` can be told apart from the rules already merged in any layout
// measured, so they are not written (reviews/phase-6/notes.md).
//
// One list, `pillTruncationScenarios`, run in both harnesses: in process on the element source
// (test/pill-tag-truncation.test.ts) and on the built browser build on the strict-CSP fixture
// (test/browser/pill-tag-truncation.test.ts). No body navigates: every link points at a fragment of the page. There is
// no conditional expect. Each body's plants are named in its name and run once, recorded in reviews/phase-6/notes.md.
import { expectedTokens } from "../../../tokens/test/expected.ts";
import type { Scenario } from "./icon.ts";
import type { Box, Driver, TextBox } from "./driver.ts";

/** A token's declared value, single-valued, as a number (its unit dropped). */
function declared(name: string): number {
  const entry = expectedTokens.find((each) => each.name === name);
  if (entry === undefined || typeof entry.declared !== "string") throw new Error(`no single declared value for ${name}`);
  return Number.parseFloat(entry.declared);
}

/** One focus-ring extent, the offset plus the width (plan decision 11): an interactive pill's inline margin. */
const ringExtent = declared("focus-offset") + declared("focus-width");

/** How long the pointer or keyboard focus is held before the bubble is read: past the 300 ms test delay. */
const hold = 700;

/** Waits `ms` milliseconds. */
function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** The inner control and the text span of an interactive pill (the slot convention's `.label` wrapper). */
const control = ".control";
const label = ".label";

/** The texts of the bodies. */
const long = "Blocked by the review of the scheduler";
const fitting = "Blocked by the review";
const short = "Blocked";
const other = "Waiting for the nightly integration run";
/** A 34-letter word, with no break opportunity. */
const longWord = "Supercalifragilisticexpialidocious";

/** The two interactive modes, as host attributes. */
const modes = [
  { mode: "button", mark: " interactive", tag: "button" },
  { mode: "link", mark: ' href="#mine"', tag: "a" },
] as const;

/** Where the pointer rests and focus goes when a body leaves a pill: a text and a button at the top of the page. */
const away = '<p><span id="away">Away</span> <button id="out" type="button">Out</button></p>';

/** Mounts `markup` after `away` on a page with base.css, as a host page links it, and adds the bodies' container rules. */
async function mount(driver: Driver, markup: string, rules = ""): Promise<void> {
  await driver.mount(`${away}${markup}`, { base: true });
  await driver.rules(`.narrow { inline-size: 160px; } .wide { inline-size: 600px; } ${rules}`);
  await driver.settleLayout();
}

/** A button, `b-<id>`, followed by a container of `className` holding the pill `id` (so Tab from the button reaches it). */
function boxed(id: string, className: string, attributes: string, content: string): string {
  return `<button id="b-${id}" type="button">Before</button><div id="c-${id}" class="${className}"><ocelle-pill-tag id="${id}" status="warning"${attributes}>${content}</ocelle-pill-tag></div>`;
}

/**
 * The tooltip of the pill `id` as a user sees it: `"none"` while its bubble is not open in the top layer, else the text
 * the bubble shows (the last text box under the pill: the bubble's text, after the slotted text).
 */
async function bubble(driver: Driver, id: string): Promise<string> {
  const open = (await driver.topLayer()).some((entry) => entry.element === `${id}[ocelle-tooltip[div]]` && entry.popoverOpen);
  const boxes = await driver.textBoxes(id);
  return open ? (boxes.at(-1)?.text ?? "no text") : "none";
}

/** Rests the pointer on the pill `id` for `hold`, reads its tooltip, then moves the pointer away. */
async function hovered(driver: Driver, id: string): Promise<string> {
  await driver.hover(id);
  await pause(hold);
  const seen = await bubble(driver, id);
  await driver.hover("away");
  return seen;
}

/**
 * Tabs from the button before the pill `id` to its inner control, holds for `hold`, reads the focus path and the tooltip,
 * then moves focus to the button at the top of the page.
 */
async function focused(driver: Driver, id: string): Promise<{ readonly path: string; readonly bubble: string }> {
  await driver.focus(`b-${id}`);
  await driver.press("Tab");
  await pause(hold);
  const seen = { path: await driver.focusPath(), bubble: await bubble(driver, id) };
  await driver.focus("out");
  return seen;
}

/** Sets the container of the pill `id` to `width` px and settles the layout. */
async function width(driver: Driver, id: string, inline: number): Promise<void> {
  await driver.size(`c-${id}`, inline, null);
  await driver.settleLayout();
}

/**
 * Sets the container of the pill `id`, which holds a fitting text, to the pill's natural width plus its two inline margins
 * less `less` px: the text span then has its whole inline size and, with `less` 0, fits it exactly.
 */
async function fit(driver: Driver, id: string, less = 0): Promise<void> {
  await width(driver, id, 1000);
  const natural = await driver.box(id);
  await width(driver, id, natural.width + 2 * ringExtent - less);
}

/** The first text box under the pill `id` (its slotted text). */
async function slotted(driver: Driver, id: string): Promise<TextBox | undefined> {
  return (await driver.textBoxes(id))[0];
}

/** The pill's accessibility subtree, each node as its role and name. */
async function tree(driver: Driver, id: string): Promise<string[]> {
  return (await driver.axSubtree(id)).map((node) => `${node.role} ${node.name}`.trim());
}

/** Whether `text` is on one line, against its one-line `twin`: the same height to the half pixel. */
function oneLine(text: TextBox | undefined, twin: TextBox | undefined): boolean {
  return text !== undefined && twin !== undefined && Math.abs(text.box.height - twin.box.height) <= 0.5;
}

/** Whether `text` is broken over two lines or more, against its one-line `twin`. */
function broken(text: TextBox | undefined, twin: TextBox | undefined): boolean {
  return text !== undefined && twin !== undefined && text.box.height >= 2 * twin.box.height - 0.5;
}

/** Whether `inner` lies inside `outer` in both axes, to the half pixel. */
function within(inner: { readonly x: number; readonly y: number; readonly width: number; readonly height: number } | undefined, outer: Box): boolean {
  return inner !== undefined && inner.x >= outer.x - 0.5 && inner.x + inner.width <= outer.x + outer.width + 0.5 && inner.y >= outer.y - 0.5 && inner.y + inner.height <= outer.y + outer.height + 0.5;
}

/** Whether two boxes have the same size, to the half pixel. */
function sameSize(box: Box, twin: Box): boolean {
  return Math.abs(box.width - twin.width) <= 0.5 && Math.abs(box.height - twin.height) <= 0.5;
}

/** Where a text box lies against its span in the inline axis: which edges it is flush with and which it passes. */
function edges(text: TextBox | undefined, span: Box): { readonly left: string; readonly right: string } {
  if (text === undefined) return { left: "no text", right: "no text" };
  const start = text.box.x - span.x;
  const end = text.box.x + text.box.width - (span.x + span.width);
  const side = (delta: number, outward: number): string => (Math.abs(delta) <= 0.5 ? "flush" : delta * outward > 0 ? "past" : "inside");
  return { left: side(start, -1), right: side(end, 1) };
}

export const pillTruncationScenarios: readonly Scenario[] = [
  ...modes.map(
    ({ mode, mark, tag }): Scenario => ({
      name: `US5-1, US5-3, ${mode} mode, hover and keyboard focus: in a 160 px container an enabled interactive pill whose text fits shows no tooltip when hovered or focused (read past the test delay), while its truncated twin shows its full text in ocelle-tooltip on hover and on keyboard focus; the tooltip adds nothing to the accessibility tree and the inner control's name is the full text (FR-033, FR-034; plants: truncated forced to false, truncated forced to true)`,
      run: async (driver) => {
        await mount(driver, `${boxed("f", "narrow", mark, short)}${boxed("t", "narrow", mark, long)}`);
        const restTree = await tree(driver, "t");
        const hover = { fitting: await hovered(driver, "f"), truncated: await hovered(driver, "t") };
        const focus = { fitting: await focused(driver, "f"), truncated: await focused(driver, "t") };
        await driver.focus("b-t");
        await driver.press("Tab");
        const shownTree = await tree(driver, "t");
        const state = await driver.axState("t", control);
        return { hover, focus, treeUnchanged: JSON.stringify(shownTree) === JSON.stringify(restTree) && restTree.length > 0, open: await bubble(driver, "t"), name: state.name, description: state.description };
      },
      expected: {
        hover: { fitting: "none", truncated: long },
        focus: { fitting: { path: `f[${tag}]`, bubble: "none" }, truncated: { path: `t[${tag}]`, bubble: long } },
        treeUnchanged: true,
        open: long,
        name: long,
        description: "",
      },
    }),
  ),
  {
    name: "US5-2, left to right and right to left: an enabled interactive pill whose text does not fit shows one line ending in an ellipsis at the inline end (its text span nowrap, overflow hidden, text-overflow ellipsis; the text flush with the span's inline start and past its inline end), measured as overflowing at the inline start in right to left, and the inner control's name is still the full text; its fitting twin is flush with both ends of its span, not overflowing; the right-to-left pill shows its full text in the tooltip and its fitting right-to-left twin none (FR-033; research.md R-09; § Edge cases, right-to-left)",
    run: async (driver) => {
      await mount(driver, `${boxed("f", "narrow", " interactive", short)}${boxed("t", "narrow", " interactive", long)}<div dir="rtl">${boxed("r", "narrow", " interactive", long)}${boxed("rf", "narrow", " interactive", short)}</div>`);
      const read = async (id: string): Promise<unknown> => {
        const text = await slotted(driver, id);
        const twin = await slotted(driver, "f");
        const [style] = await driver.styles(id, label, ["white-space", "overflow-x", "text-overflow"]);
        return { style, oneLine: oneLine(text, twin), edges: edges(text, await driver.box(id, label)), overflows: await driver.overflows({ id, inner: label }), name: (await driver.axState(id, control)).name };
      };
      return { fitting: { edges: edges(await slotted(driver, "f"), await driver.box("f", label)), overflows: await driver.overflows({ id: "f", inner: label }) }, ltr: await read("t"), rtl: await read("r"), rtlBubble: await hovered(driver, "r"), rtlFitting: { overflows: await driver.overflows({ id: "rf", inner: label }), bubble: await hovered(driver, "rf") } };
    },
    expected: {
      fitting: { edges: { left: "flush", right: "flush" }, overflows: false },
      ltr: { style: { "white-space": "nowrap", "overflow-x": "hidden", "text-overflow": "ellipsis" }, oneLine: true, edges: { left: "flush", right: "past" }, overflows: true, name: long },
      rtl: { style: { "white-space": "nowrap", "overflow-x": "hidden", "text-overflow": "ellipsis" }, oneLine: true, edges: { left: "past", right: "flush" }, overflows: true, name: long },
      rtlBubble: long,
      rtlFitting: { overflows: false, bubble: "none" },
    },
  },
  {
    name: "US5-4: a truncated pill's tooltip shown on hover hides on Escape and the pill does not change (still overflowing, the same name, focus where it was); shown on keyboard focus it hides when focus leaves; shown on hover it hides when the pointer leaves (FR-034; 008's WCAG 1.4.13 behaviour)",
    run: async (driver) => {
      await mount(driver, boxed("t", "narrow", " interactive", long));
      await driver.hover("t");
      await pause(hold);
      const hover = await bubble(driver, "t");
      await driver.press("Escape");
      const escaped = { bubble: await bubble(driver, "t"), overflows: await driver.overflows({ id: "t", inner: label }), name: (await driver.axState("t", control)).name, focus: await driver.focusPath() };
      await driver.hover("away");
      await driver.focus("b-t");
      await driver.press("Tab");
      const focus = await bubble(driver, "t");
      await driver.focus("out");
      const focusLeft = await bubble(driver, "t");
      await driver.hover("t");
      await pause(hold);
      const hoverAgain = await bubble(driver, "t");
      await driver.hover("away");
      return { hover, escaped, focus, focusLeft, hoverAgain, pointerLeft: await bubble(driver, "t") };
    },
    expected: { hover: long, escaped: { bubble: "none", overflows: true, name: long, focus: "body" }, focus: long, focusLeft: "none", hoverAgain: long, pointerLeft: "none" },
  },
  {
    name: "US5-5: a truncated pill whose container grows until its text fits stops being truncated (no tooltip on hover) without a reload, and truncates again (tooltip shown) when the container narrows; its text shortened until it fits shows no tooltip, and lengthened again shows the new full text; replaced by another text that does not fit either, the tooltip shows that text (FR-033; FR-034: the tooltip's text follows the full text)",
    run: async (driver) => {
      await mount(driver, boxed("t", "narrow", " interactive", long));
      const before = await hovered(driver, "t");
      await width(driver, "t", 600);
      const grown = await hovered(driver, "t");
      await width(driver, "t", 160);
      const narrowed = await hovered(driver, "t");
      await driver.textData("t", 0, short);
      await driver.settleLayout();
      const shortened = await hovered(driver, "t");
      await driver.textData("t", 0, `${long} pipeline`);
      await driver.settleLayout();
      const lengthened = await hovered(driver, "t");
      await driver.textData("t", 0, other);
      await driver.settleLayout();
      return { before, grown, narrowed, shortened, lengthened, replaced: await hovered(driver, "t") };
    },
    expected: { before: long, grown: "none", narrowed: long, shortened: "none", lengthened: `${long} pipeline`, replaced: other },
  },
  ...modes.map(
    ({ mode, mark }): Scenario => ({
      name: `US5-6, ${mode} mode: a disabled interactive pill whose text does not fit is not truncated: its text wraps onto further lines inside the pill (white-space normal, no ellipsis), every character visible, and it shows no tooltip on hover beside its enabled twin, which does; a disabled pill narrower than its own padding shows none either; with disabled removed it shows one line again and is truncated with the tooltip shown (FR-033; plant: truncated not cleared while disabled)`,
      run: async (driver) => {
        await mount(driver, `${boxed("f", "narrow", mark, short)}${boxed("d", "narrow", `${mark} disabled`, long)}${boxed("e", "narrow", mark, long)}${boxed("dt", "tiny", `${mark} disabled`, short)}${boxed("et", "tiny", mark, short)}`, ".tiny { inline-size: 30px; }");
        const twin = await slotted(driver, "f");
        const text = await slotted(driver, "d");
        const [style] = await driver.styles("d", label, ["white-space", "text-overflow"]);
        const disabled = { style, broken: broken(text, twin), clipped: text?.clipped, inside: within(text?.box, await driver.box("d", control)), overflows: await driver.overflows({ id: "d", inner: label }), bubble: await hovered(driver, "d") };
        const twins = { enabled: await hovered(driver, "e"), tinyDisabled: await hovered(driver, "dt"), tinyEnabled: await hovered(driver, "et") };
        await driver.setAttribute("d", "disabled", null);
        await driver.settleLayout();
        const enabledText = await slotted(driver, "d");
        return { disabled, twins, enabled: { oneLine: oneLine(enabledText, twin), overflows: await driver.overflows({ id: "d", inner: label }), bubble: await hovered(driver, "d") } };
      },
      expected: {
        disabled: { style: { "white-space": "normal", "text-overflow": "clip" }, broken: true, clipped: false, inside: true, overflows: false, bubble: "none" },
        twins: { enabled: long, tinyDisabled: "none", tinyEnabled: short },
        enabled: { oneLine: true, overflows: true, bubble: long },
      },
    }),
  ),
  ...modes.map(
    ({ mode, mark }): Scenario => ({
      name: `US5-6, ${mode} mode, a long unbroken word: in a 120 px container a disabled interactive pill holding a 34-letter word breaks the word inside the pill (more than one line, every character inside the control's box, not overflowing its text span), while its enabled twin in the same container truncates the word on one line (FR-033; R-07)`,
      run: async (driver) => {
        await mount(driver, `${boxed("w", "w120", `${mark} disabled`, longWord)}${boxed("o", "w120", mark, longWord)}`, ".w120 { inline-size: 120px; }");
        const text = await slotted(driver, "w");
        const twin = await slotted(driver, "o");
        return { broken: broken(text, twin), inside: within(text?.box, await driver.box("w", control)), overflows: await driver.overflows({ id: "w", inner: label }), twin: { overflows: await driver.overflows({ id: "o", inner: label }), bubble: await hovered(driver, "o") } };
      },
      expected: { broken: true, inside: true, overflows: false, twin: { overflows: true, bubble: longWord } },
    }),
  ),
  {
    name: "Trigger, width: a pill that fits a 600 px container shows no tooltip; the container narrowed to 160 px, it truncates and shows its full text; widened to 600 px again, none (research.md R-09; plant: the ResizeObserver removed)",
    run: async (driver) => {
      await mount(driver, boxed("t", "wide", " interactive", long));
      const wide = await hovered(driver, "t");
      await width(driver, "t", 160);
      const narrow = await hovered(driver, "t");
      await width(driver, "t", 600);
      return { wide, narrow, widened: await hovered(driver, "t") };
    },
    expected: { wide: "none", narrow: long, widened: "none" },
  },
  {
    name: "Trigger, characterData: an exactly fitting pill (no tooltip) whose Text node's data is edited so its text overflows shows the new full text; edited back so it fits exactly, none; no box changes, so only the MutationObserver's characterData records re-measure (research.md R-09; plant: characterData or subtree false)",
    run: async (driver) => {
      await mount(driver, boxed("x", "wide", " interactive", fitting));
      await fit(driver, "x");
      const exact = await hovered(driver, "x");
      await driver.text("x", long);
      await driver.settleLayout();
      const grown = await hovered(driver, "x");
      await driver.text("x", fitting);
      await driver.settleLayout();
      return { exact, grown, back: await hovered(driver, "x") };
    },
    expected: { exact: "none", grown: long, back: "none" },
  },
  {
    name: "Trigger, nested childList: an exactly fitting pill whose text is in a nested element, that element's text replaced (textContent) so the text overflows, shows the new full text (research.md R-09; plant: childList false)",
    run: async (driver) => {
      await mount(driver, boxed("x", "wide", " interactive", `<span id="n">${fitting}</span>`));
      await fit(driver, "x");
      const exact = await hovered(driver, "x");
      await driver.setProperty("n", "textContent", long);
      await driver.settleLayout();
      return { exact, replaced: await hovered(driver, "x") };
    },
    expected: { exact: "none", replaced: long },
  },
  {
    name: "Trigger, slotchange: an exactly fitting pill with a child assigned to no slot (slot=\"later\"), that child's slot attribute removed so the default slot's text grows past the width (no childList record on the host), shows the new full text (research.md R-09; plant: the slotchange listener removed)",
    run: async (driver) => {
      await mount(driver, boxed("x", "wide", " interactive", `${fitting}<span id="more" slot="later"> of the scheduler</span>`));
      await fit(driver, "x");
      const exact = await hovered(driver, "x");
      await driver.setAttribute("more", "slot", null);
      await driver.settleLayout();
      return { exact, assigned: await hovered(driver, "x") };
    },
    expected: { exact: "none", assigned: long },
  },
  {
    name: "Trigger, updated(): an exactly fitting compact pill, its spacing and line heights set by the host so both densities give its text span the same box, switched to the default density (a larger font): truncated, the tooltip shown; a disabled long pill in a 160 px container shows none, and with disabled removed it is truncated with the tooltip shown (research.md R-09; plant: re-measure in updated() removed)",
    run: async (driver) => {
      await mount(
        driver,
        `${boxed("y", "wide", ' interactive density="compact"', fitting)}${boxed("z", "narrow", " interactive disabled", long)}`,
        "#y { --ocelle-space-2: 8px; --ocelle-space-3: 8px; --ocelle-font-size-xs: 12px; --ocelle-font-size-sm: 16px; --ocelle-line-height-snug: 1.5; --ocelle-line-height-tight: 1.125; }",
      );
      await fit(driver, "y");
      const compact = await hovered(driver, "y");
      const spanBefore = await driver.box("y", label);
      await driver.setAttribute("y", "density", null);
      await driver.settleLayout();
      const spanAfter = await driver.box("y", label);
      const density = await hovered(driver, "y");
      const disabled = await hovered(driver, "z");
      await driver.setAttribute("z", "disabled", null);
      await driver.settleLayout();
      return { compact, sameSpan: sameSize(spanBefore, spanAfter), density, disabled, enabled: await hovered(driver, "z") };
    },
    expected: { compact: "none", sameSpan: true, density: fitting, disabled: "none", enabled: long },
  },
  {
    name: "Sub-pixel: a pill whose container is its natural width plus its margins shows no tooltip; 0.1 px narrower, its text overflows by a fraction of a pixel and the tooltip shows its full text (research.md R-09; plant: the measure by scrollWidth > clientWidth)",
    run: async (driver) => {
      await mount(driver, boxed("s", "wide", " interactive", fitting));
      await fit(driver, "s");
      const exact = await hovered(driver, "s");
      await fit(driver, "s", 0.1);
      return { exact, less: await hovered(driver, "s") };
    },
    expected: { exact: "none", less: fitting },
  },
  {
    name: "Flex row (plan decision 14): in a 200 px flex row (items aligned at the start) beside \"Mission name\", a truncating pill shrinks to the room left (its margin box inside the row) and shows its full text: with the sibling flex: none, and with the pill flex: 1 1 0, the sibling keeps its natural box (one line); with neither, the shrink is shared and the sibling is narrower than its natural width, on two lines; the flex: 1 1 0 route's cost: a fitting \"Blocked\" with flex: 1 1 0 in a 300 px row fills the room left (wider than its natural width) while with the sibling flex: none instead it keeps its natural width (R-09; PLAN-FRESH-2-003 (a), PLAN-FRESH-3-004; carried from phase 5: a truncating pill shrinks in its row)",
    run: async (driver) => {
      await mount(
        driver,
        `<div class="row wide"><span id="alone">Mission name</span></div><div id="row1" class="row r200"><span id="s1" class="none">Mission name</span><ocelle-pill-tag id="p1" interactive status="warning">${long}</ocelle-pill-tag></div><div id="row2" class="row r200"><span id="s2">Mission name</span><ocelle-pill-tag id="p2" class="grow" interactive status="warning">${long}</ocelle-pill-tag></div><div id="row3" class="row r200"><span id="s3">Mission name</span><ocelle-pill-tag id="p3" interactive status="warning">${long}</ocelle-pill-tag></div><div class="row r300"><span id="s4">Mission name</span><ocelle-pill-tag id="grown" class="grow" interactive status="warning">${short}</ocelle-pill-tag></div><div class="row r300"><span id="s5" class="none">Mission name</span><ocelle-pill-tag id="kept" interactive status="warning">${short}</ocelle-pill-tag></div><div class="wide"><ocelle-pill-tag id="natural" interactive status="warning">${short}</ocelle-pill-tag></div><div class="wide"><ocelle-pill-tag id="whole" interactive status="warning">${long}</ocelle-pill-tag></div>`,
        ".row { display: flex; align-items: flex-start; } .r200 { inline-size: 200px; } .r300 { inline-size: 300px; } .none { flex: none; } .grow { flex: 1 1 0; }",
      );
      const alone = await driver.box("alone");
      const whole = await driver.box("whole");
      const pill = async (id: string, row: string): Promise<unknown> => {
        const host = await driver.box(id);
        const box = await driver.box(row);
        return { shrunk: host.width < whole.width - 1, inRow: host.x + host.width + ringExtent <= box.x + box.width + 0.5, overflows: await driver.overflows({ id, inner: label }), bubble: await hovered(driver, id) };
      };
      const sibling = async (id: string): Promise<unknown> => {
        const box = await driver.box(id);
        return { natural: sameSize(box, alone), narrower: box.width < alone.width - 1, twoLines: box.height >= 2 * alone.height - 0.5 };
      };
      const grown = await driver.box("grown", control);
      const natural = await driver.box("natural", control);
      const roomLeft = 300 - alone.width - 2 * ringExtent;
      return {
        siblingNone: { pill: await pill("p1", "row1"), sibling: await sibling("s1") },
        pillGrows: { pill: await pill("p2", "row2"), sibling: await sibling("s2") },
        neither: { pill: await pill("p3", "row3"), sibling: await sibling("s3") },
        cost: { fillsRoom: Math.abs(grown.width - roomLeft) <= 0.5, widerThanNatural: grown.width > natural.width + 1, keptNatural: Math.abs((await driver.box("kept", control)).width - natural.width) <= 0.5 },
      };
    },
    expected: {
      siblingNone: { pill: { shrunk: true, inRow: true, overflows: true, bubble: long }, sibling: { natural: true, narrower: false, twoLines: false } },
      pillGrows: { pill: { shrunk: true, inRow: true, overflows: true, bubble: long }, sibling: { natural: true, narrower: false, twoLines: false } },
      neither: { pill: { shrunk: true, inRow: true, overflows: true, bubble: long }, sibling: { natural: false, narrower: true, twoLines: true } },
      cost: { fillsRoom: true, widerThanNatural: true, keptNatural: true },
    },
  },
  {
    name: "Grid track: a pill in a 150 px grid container's auto track shrinks to the track and truncates (overflowing, its host inside the container, the tooltip showing its full text), while a fitting twin in the same track shows none (R-09; carried from phase 5: a truncating pill shrinks in its track)",
    run: async (driver) => {
      await mount(driver, `<div id="g" class="grid"><ocelle-pill-tag id="t" interactive status="warning">${long}</ocelle-pill-tag><ocelle-pill-tag id="f" interactive status="warning">${short}</ocelle-pill-tag></div>`, ".grid { display: grid; grid-template-columns: auto; inline-size: 150px; }");
      const grid = await driver.box("g");
      const host = await driver.box("t");
      return { inside: host.x >= grid.x - 0.5 && host.x + host.width <= grid.x + grid.width + 0.5, overflows: await driver.overflows({ id: "t", inner: label }), bubble: await hovered(driver, "t"), fitting: await hovered(driver, "f") };
    },
    expected: { inside: true, overflows: true, bubble: long, fitting: "none" },
  },
  ...modes.map(
    ({ mode, mark }): Scenario => ({
      name: `After static → ${mode} mode: a static long pill in a 600 px container made interactive after connection (${mark.trim()}) shows no tooltip while it fits, and once the container narrows to 160 px it truncates and shows its full text (data-model.md § observers; plant: observers created in connectedCallback only)`,
      run: async (driver) => {
        await mount(driver, boxed("p", "wide", "", long));
        const [name, value] = mode === "button" ? (["interactive", ""] as const) : (["href", "#mine"] as const);
        await driver.setAttribute("p", name, value);
        await driver.settleLayout();
        const fits = await hovered(driver, "p");
        await width(driver, "p", 160);
        return { fits, narrowed: await hovered(driver, "p") };
      },
      expected: { fits: "none", narrowed: long },
    }),
  ),
  ...[
    { from: "button", mark: " interactive", change: ["href", "#mine"] as const },
    { from: "link", mark: ' interactive href="#mine"', change: ["href", null] as const },
  ].map(
    ({ from, mark, change }): Scenario => ({
      name: `After a mode switch from ${from} mode: a truncated pill in a 160 px container (tooltip shown) switched to ${from === "button" ? "link" : "button"} mode still shows it, and once the container widens to 600 px so its text fits it shows none (research.md R-09; plant: the ResizeObserver not re-targeted)`,
      run: async (driver) => {
        await mount(driver, boxed("m", "narrow", mark, long));
        const before = await hovered(driver, "m");
        await driver.setAttribute("m", change[0], change[1]);
        await driver.settleLayout();
        const switched = await hovered(driver, "m");
        await width(driver, "m", 600);
        return { before, switched, widened: await hovered(driver, "m") };
      },
      expected: { before: long, switched: long, widened: "none" },
    }),
  ),
  {
    name: "After a reconnection: a truncated pill in a 160 px container (tooltip shown) moved into a 600 px container shows none there, and once that container narrows to 160 px it truncates again and shows its full text (data-model.md § observers: the observers end on disconnection and observe the text span again on reconnection; plant: the ResizeObserver not re-targeted after a reconnection)",
    run: async (driver) => {
      await mount(driver, `${boxed("t", "narrow", " interactive", long)}<div id="c-d" class="wide"></div>`);
      const before = await hovered(driver, "t");
      await driver.move("t", "c-d");
      await driver.settleLayout();
      const moved = await hovered(driver, "t");
      await width(driver, "d", 160);
      return { before, moved, narrowed: await hovered(driver, "t") };
    },
    expected: { before: long, moved: "none", narrowed: long },
  },
  {
    name: "Ring in a clipping container: a keyboard-focused truncated pill in a 160 px container that clips (overflow: hidden) shows its focus ring (the control's box grown by one ring extent) inside the container, and its tooltip (R-07, plan decision 11; plant: the interactive host sheet not adopted)",
    run: async (driver) => {
      await mount(driver, boxed("t", "narrow clip", " interactive", long), ".clip { overflow: hidden; padding-block: 8px; }");
      await driver.focus("b-t");
      await driver.press("Tab");
      await pause(hold);
      const clip = await driver.box("c-t");
      const box = await driver.box("t", control);
      const ring = { x: box.x - ringExtent, y: box.y - ringExtent, width: box.width + 2 * ringExtent, height: box.height + 2 * ringExtent };
      return { visible: await driver.focusVisible("t", control), ringInside: within(ring, clip), overflows: await driver.overflows({ id: "t", inner: label }), bubble: await bubble(driver, "t") };
    },
    expected: { visible: true, ringInside: true, overflows: true, bubble: long },
  },
  {
    name: "US4-10, focus and tooltip (carried from phase 5): a keyboard-focused truncated pill switched from button to link mode and back has focus on the new inner control each time, with the focus ring and its tooltip shown (read past the test delay); a pointer-focused twin, the pointer moved away, keeps focus on its new control with no ring and no tooltip (FR-035 (d), R-08: the refocus queued after the tooltip's slotchange; plant: the refocus in updated() (not queued))",
    run: async (driver) => {
      await mount(driver, `${boxed("k", "narrow", " interactive", long)}${boxed("m", "narrow", " interactive", long)}`);
      const read = async (id: string): Promise<unknown> => {
        await pause(hold);
        return { path: await driver.focusPath(), ring: await driver.focusVisible(id, control), bubble: await bubble(driver, id) };
      };
      await driver.focus("b-k");
      await driver.press("Tab");
      const start = await read("k");
      await driver.setAttribute("k", "href", "#mine");
      await driver.settleLayout();
      const link = await read("k");
      await driver.setAttribute("k", "href", null);
      await driver.settleLayout();
      const back = await read("k");
      await driver.click("m");
      await driver.hover("away");
      await driver.setAttribute("m", "href", "#mine");
      await driver.settleLayout();
      return { start, link, back, pointer: await read("m") };
    },
    expected: {
      start: { path: "k[button]", ring: true, bubble: long },
      link: { path: "k[a]", ring: true, bubble: long },
      back: { path: "k[button]", ring: true, bubble: long },
      pointer: { path: "m[a]", ring: false, bubble: "none" },
    },
  },
  {
    name: "An icon (the icon slot): a truncated pill with a leading icon in its markup, and one whose icon is appended after it rendered, each shows its full text in the tooltip on keyboard focus and on hover; the icon is not the tooltip's trigger (FR-034; the slot convention; plant: the pill's slotchange events reaching ocelle-tooltip)",
    run: async (driver) => {
      await mount(driver, `${boxed("i", "narrow", " interactive", `<ocelle-icon slot="icon" name="folder"></ocelle-icon>${long}`)}${boxed("j", "narrow", ' href="#mine"', long)}`);
      const markup = { focus: await focused(driver, "i"), hover: await hovered(driver, "i") };
      await driver.append("j", '<ocelle-icon slot="icon" name="folder"></ocelle-icon>');
      await driver.settleLayout();
      return { markup, appended: { focus: await focused(driver, "j"), hover: await hovered(driver, "j") } };
    },
    expected: { markup: { focus: { path: "i[button]", bubble: long }, hover: long }, appended: { focus: { path: "j[a]", bubble: long }, hover: long } },
  },
  {
    name: "A forwarded slot (§ Edge cases, slotted text): a truncated pill in a host's shadow root whose text is the host's own, forwarded through a <slot>, shows that text, read through the flattened assignment, in its tooltip (R-09: the full text of the flattened assigned nodes)",
    run: async (driver) => {
      await mount(driver, `<div id="h" class="narrow">${long}</div>`);
      await driver.shadow("h", '<ocelle-pill-tag id="p" interactive status="warning"><slot></slot></ocelle-pill-tag>');
      await driver.settleLayout();
      await driver.hover("h", { inner: "ocelle-pill-tag" });
      await pause(hold);
      const open = (await driver.topLayer()).some((entry) => entry.element === "h[p[ocelle-tooltip[div]]]" && entry.popoverOpen);
      const shown = open ? ((await driver.textBoxes("h")).at(-1)?.text ?? "no text") : "none";
      await driver.hover("away");
      return { shown };
    },
    expected: { shown: long },
  },
  {
    name: "Full text (§ Edge cases): a truncated pill whose slotted text has leading, trailing and repeated whitespace and a nested <b> shows the trimmed, collapsed text in its tooltip; named by aria-label or by label with a name other than its text, its control keeps that name while the tooltip still shows the full text (FR-034; 012 FR-006)",
    run: async (driver) => {
      const spaced = `\n  Blocked   by the\n  <b>review</b>   of the scheduler  `;
      await mount(driver, `${boxed("a", "narrow", ` interactive aria-label="${long}, filter"`, spaced)}${boxed("l", "narrow", ` href="#mine" label="${long}, mine"`, spaced)}`);
      return {
        aria: { name: (await driver.axState("a", control)).name, bubble: await hovered(driver, "a") },
        label: { name: (await driver.axState("l", control)).name, bubble: await hovered(driver, "l") },
      };
    },
    expected: { aria: { name: `${long}, filter`, bubble: long }, label: { name: `${long}, mine`, bubble: long } },
  },
];
