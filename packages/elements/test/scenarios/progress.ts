// The shared bodies of User Story 3's browser scenarios, `ocelle-progress` (013 spec US3 scenarios 1 to 15; FR-030 to
// FR-039; research.md R-05, R-06; data-model.md § `ocelle-progress`; contracts/checks.md § Oracles (Progress), § Extra
// scenario bodies, § CSS-only behaviours; tasks.md T038, T038a). Each body observes the page through the driver and
// returns one observation; each harness asserts it equals `expected`, written by hand from the spec, the data model and
// research. Lengths come from packages/tokens/src/source.ts through the token names R-06 names, at the default 16 px
// root size (the track `--ocelle-space-2`, compact `--ocelle-space-1`); the sweep from `--ocelle-motion-base` (200 ms):
// three loops of 7 × 200 ms, an end time of 4200 ms; colours from the token table of packages/tokens/test/expected.ts
// (`tokenColour`); the forced-colours system colours are read from the platform (`resolveColour`) in the same body.
//
// The mark and the fill are read against the track: `start` and `end` are the fill's inline-start and inline-end edges
// as fractions of the track's inline size from the track's inline start (the left, or the right under `dir="rtl"`),
// `share` its inline size as a fraction of the track's, each rounded to 1/100. The still mark is 0.3 to 0.7 (R-06).
// The value text (US3-3) is read on the visible `value-text` part, not on the accessibility tree: no read a test can
// make in Chromium exposes a value text (reviews/phase-3/spike.md; operator decision (a), "Prove the wiring, not the
// exposure"). The AX `valuetext` field is left out of every read here.
//
// Motion: every body starts without reduced motion (each harness resets it after each body) and with a fresh loading
// episode (each harness's `mount` deletes the episode record). Bodies that wait for the sweep window (4.2 s) wait on
// the test's own clock (`pause`).
//
// Every "does not" outcome shares its body with the positive outcome it guards (contracts/checks.md § Scenario
// bodies). Every page gets `pageRules` (body margin 0, so the two harnesses agree; container widths; the probes of
// the measure tokens) after its mount.
import { source } from "../../../tokens/src/source.ts";
import { tokenColour } from "./icon.ts";
import type { Scenario } from "./icon.ts";
import type { AxNode, Box, Driver, Palette, Running } from "./driver.ts";

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

/** A px token's number. */
function pixels(name: string): number {
  const value = token(name);
  if (!value.endsWith("px")) throw new Error(`${name} is not a px length: ${value}`);
  return Number.parseFloat(value);
}

/** A ms token's number. */
function ms(name: string): number {
  const value = token(name);
  if (!value.endsWith("ms")) throw new Error(`${name} is not a ms duration: ${value}`);
  return Number.parseFloat(value);
}

/** R-06's track block sizes: `--ocelle-space-2` (8 px) and, compact, `--ocelle-space-1` (4 px). */
const trackSize = { default: rem("space-2"), compact: rem("space-1") };
/** The border width of the track's boundary and the fill's edge (1 px). */
const border = pixels("border-width");
/** R-06's sweep: `calc(var(--ocelle-motion-base) * 7)` per loop, 3 loops; its end time. */
const loop = ms("motion-base") * 7;
const sweepEnd = loop * 3;
/** A wait past the sweep window, with room for a slow frame. */
const pastWindow = sweepEnd + 400;

const pageRules = `
body { margin: 0; }
.w400 { inline-size: 400px; }
.w600 { inline-size: 600px; }
.cell { display: block; inline-size: var(--ocelle-measure-cell); block-size: 1px; }
.inline-bar { display: inline-block; inline-size: 12rem; }
`;

async function mount(driver: Driver, markup: string): Promise<void> {
  await driver.mount(markup);
  await driver.rules(pageRules);
}

/** Waits `duration` ms on the test's own clock. */
function pause(duration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

const round = (value: number): number => Math.round(value * 100) / 100;
const right = (box: Box): number => box.x + box.width;
const bottom = (box: Box): number => box.y + box.height;

/** The progressbar nodes of the element with `id`, with name and value properties (no `valuetext`, see above). */
async function bars(driver: Driver, id: string): Promise<unknown[]> {
  return (await driver.ax(id))
    .filter((node: AxNode) => node.role === "progressbar")
    .map(({ role, name, value, valuemin, valuemax }) => ({ role, name, value, valuemin, valuemax }));
}

const exposed = (name: string, value: number | undefined, valuemax: number): unknown => ({ role: "progressbar", name, value, valuemin: 0, valuemax });

/** The fill against the track of the bar `id` (above), in its inline direction. */
async function mark(driver: Driver, id: string, direction: "ltr" | "rtl" = "ltr"): Promise<{ start: number; end: number; share: number }> {
  const track = await driver.box(id, '[part="track"]');
  const fill = await driver.box(id, '[part="fill"]');
  if (track.width === 0) return { start: -1, end: -1, share: -1 };
  const from = (edge: number): number => round(direction === "ltr" ? (edge - track.x) / track.width : (right(track) - edge) / track.width);
  return direction === "ltr"
    ? { start: from(fill.x), end: from(right(fill)), share: round(fill.width / track.width) }
    : { start: from(right(fill)), end: from(fill.x), share: round(fill.width / track.width) };
}

const still = { start: 0.3, end: 0.7, share: 0.4 };
const filled = (share: number): unknown => ({ start: 0, end: share, share });

/** The animations of the bar `id`, without their clock (kind, part, property, play state). */
async function motion(driver: Driver, id: string): Promise<unknown[]> {
  return (await driver.animations(id)).map(({ kind, part, property, playState }) => ({ kind, part, property, playState }));
}

const sweeping = [{ kind: "CSSAnimation", part: "fill", property: "transform", playState: "running" }];

/** The first running mark animation of the bar `id`, or undefined. */
async function sweep(driver: Driver, id: string): Promise<Running | undefined> {
  return (await driver.animations(id)).find((each) => each.part === "fill" && each.playState === "running");
}

/** Whether the inline ranges of two boxes overlap, and whether their block ranges do. */
const overlaps = (a: Box, b: Box): { inline: boolean; block: boolean } => ({
  inline: a.x < right(b) && b.x < right(a),
  block: a.y < bottom(b) && b.y < bottom(a),
});

const near = (a: number, b: number): boolean => Math.abs(a - b) <= 0.5;

/** The computed colours the bar `id` paints: the track's ground and boundary, the fill's ground and edge. */
async function paint(driver: Driver, id: string): Promise<unknown> {
  const [track] = await driver.styles(id, '[part="track"]', ["background-color", "box-shadow"]);
  const [fill] = await driver.styles(id, '[part="fill"]', ["background-color", "box-shadow"]);
  return { track, fill };
}

/** The paint R-06 gives in `theme`, the track's boundary in `boundary`. */
function painted(theme: Palette, boundary: "color-control-border" | "color-accent-strong" = "color-control-border"): unknown {
  return {
    track: { "background-color": tokenColour("color-inset", theme), "box-shadow": `${tokenColour(boundary, theme)} 0px 0px 0px ${String(border)}px` },
    fill: { "background-color": tokenColour("color-accent", theme), "box-shadow": `${tokenColour("color-accent-strong", theme)} 0px 0px 0px ${String(border)}px inset` },
  };
}

/** The page rule's `inline-size: 12rem` at the default 16 px root size. */
const inlineBar = 12 * 16;

const longLabel =
  "The plan for this mission is still loading from the server, and it can take a little while when the queue is long, so the bar keeps showing that work goes on";

export const progressScenarios: readonly Scenario[] = [
  {
    name: "US3-1: value=7 max=12 label=Tasks done exposes one progressbar named Tasks done with value 7, min 0 and max 12, and no ID reference in the host or its shadow root (FR-030)",
    run: async (driver) => {
      await mount(driver, '<div class="w400"><ocelle-progress id="p" value="7" max="12" label="Tasks done"></ocelle-progress></div>');
      const references = ["aria-labelledby", "aria-describedby", "aria-controls", "aria-owns", "for", "id"];
      const parts = await driver.elements("p");
      return {
        bars: await bars(driver, "p"),
        drawn: parts.length > 0,
        references: parts.flatMap((part) => Object.keys(part.attributes).filter((name) => references.includes(name))),
        host: (await Promise.all(references.slice(0, 4).map((name) => driver.attribute("p", name)))).filter((value) => value !== null),
      };
    },
    expected: { bars: [exposed("Tasks done", 7, 12)], drawn: true, references: [], host: [] },
  },
  {
    name: "US3-2: value changed to 9 exposes 9, and the fill is 75% of the track at once, with no animation or transition on the bar and no event dispatched from the bar or its shadow root during the change (FR-030, PLAN-FRESH-3-003 (b))",
    run: async (driver) => {
      await mount(driver, '<div class="w400"><ocelle-progress id="p" value="7" max="12" label="Tasks done"></ocelle-progress></div>');
      const before = { bars: await bars(driver, "p"), fill: await mark(driver, "p") };
      const events = await driver.events("p", () => driver.setProperty("p", "value", 9));
      return { before, after: { bars: await bars(driver, "p"), fill: await mark(driver, "p"), animations: await motion(driver, "p"), events } };
    },
    expected: {
      before: { bars: [exposed("Tasks done", 7, 12)], fill: filled(0.58) },
      after: { bars: [exposed("Tasks done", 9, 12)], fill: filled(0.75), animations: [], events: [] },
    },
  },
  {
    name: "US3-3: with value-text=7 of 12 and show-label the visible value text reads 7 of 12, beside the progressbar named Tasks done with value 7, min 0 and max 12 (FR-031; operator decision on the phase 3 spike, (a))",
    run: async (driver) => {
      await mount(driver, '<div class="w400"><ocelle-progress id="p" value="7" max="12" label="Tasks done" value-text="7 of 12" show-label></ocelle-progress></div>');
      const box = await driver.box("p", '[part="value-text"]');
      return { text: await driver.textOf("p", '[part="value-text"]'), shown: box.width > 0 && box.height > 0, bars: await bars(driver, "p") };
    },
    expected: { text: "7 of 12", shown: true, bars: [exposed("Tasks done", 7, 12)] },
  },
  {
    name: "SPEC-2-02: value-text is not shown while the bar is indeterminate, beside a determinate bar that shows it (FR-031, US3-3)",
    run: async (driver) => {
      await mount(
        driver,
        '<div class="w400"><ocelle-progress id="i" label="Loading" value-text="7 of 12" show-label></ocelle-progress><ocelle-progress id="d" value="7" max="12" label="Tasks done" value-text="7 of 12" show-label></ocelle-progress></div>',
      );
      return {
        indeterminate: { text: await driver.textOf("i", '[part="value-text"]'), label: await driver.textOf("i", '[part="label"]'), bars: await bars(driver, "i") },
        determinate: { text: await driver.textOf("d", '[part="value-text"]'), bars: await bars(driver, "d") },
      };
    },
    expected: {
      indeterminate: { text: null, label: "Loading", bars: [exposed("Loading", undefined, 100)] },
      determinate: { text: "7 of 12", bars: [exposed("Tasks done", 7, 12)] },
    },
  },
  {
    name: "SPEC-2-02: value-text is kept as given when the value is clamped (value 20 of max 12 shows All 12 done and exposes 12), beside an unclamped bar (FR-031, FR-032)",
    run: async (driver) => {
      await mount(
        driver,
        '<div class="w400"><ocelle-progress id="c" value="20" max="12" label="Tasks done" value-text="All 12 done" show-label></ocelle-progress><ocelle-progress id="d" value="7" max="12" label="Tasks done" value-text="7 of 12" show-label></ocelle-progress></div>',
      );
      return {
        clamped: { text: await driver.textOf("c", '[part="value-text"]'), bars: await bars(driver, "c"), fill: await mark(driver, "c") },
        unclamped: { text: await driver.textOf("d", '[part="value-text"]'), bars: await bars(driver, "d") },
      };
    },
    expected: {
      clamped: { text: "All 12 done", bars: [exposed("Tasks done", 12, 12)], fill: filled(1) },
      unclamped: { text: "7 of 12", bars: [exposed("Tasks done", 7, 12)] },
    },
  },
  {
    name: "US3-4: without a value the bar is indeterminate, named, with no current value and a moving mark on the fill, beside a determinate bar whose value is read (FR-032, FR-033)",
    run: async (driver) => {
      await mount(driver, '<div class="w400"><ocelle-progress id="i" label="Loading"></ocelle-progress><ocelle-progress id="d" value="40" label="Copied"></ocelle-progress></div>');
      await driver.frames(2);
      return { indeterminate: await bars(driver, "i"), moving: await motion(driver, "i"), determinate: await bars(driver, "d") };
    },
    expected: { indeterminate: [exposed("Loading", undefined, 100)], moving: sweeping, determinate: [exposed("Copied", 40, 100)] },
  },
  {
    name: "US3-5: under reduced motion the indeterminate bar runs nothing and shows the still mark (30% to 70%); then, without reduced motion, inside the first loop, its mark sweeps (FR-033, PLAN-TESTABILITY-1-009)",
    run: async (driver) => {
      await driver.reducedMotion("reduce");
      await mount(driver, '<div class="w400"><ocelle-progress id="i" label="Loading"></ocelle-progress></div>');
      await driver.frames(2);
      const reduced = { animations: await motion(driver, "i"), mark: await mark(driver, "i") };
      await driver.reducedMotion("no-preference");
      await driver.frames(2);
      const running = await sweep(driver, "i");
      return { reduced, moving: await motion(driver, "i"), inside: running !== undefined && running.currentTime !== null && running.currentTime < loop };
    },
    expected: { reduced: { animations: [], mark: still }, moving: sweeping, inside: true },
  },
  {
    name: "US3-6: below 0, above max, not a number, max 0 or less, value=\"\", value=\"   \" and the property set to null after a value each follow FR-032, beside a determinate bar, and nothing is thrown (FR-032)",
    run: async (driver) => {
      await driver.reducedMotion("reduce");
      await mount(
        driver,
        '<div class="w400">' +
          '<ocelle-progress id="below" value="-5" max="12" label="Below"></ocelle-progress>' +
          '<ocelle-progress id="above" value="20" max="12" label="Above"></ocelle-progress>' +
          '<ocelle-progress id="nan" value="abc" label="Not a number"></ocelle-progress>' +
          '<ocelle-progress id="zero-max" value="50" max="0" label="Zero max"></ocelle-progress>' +
          '<ocelle-progress id="negative-max" value="50" max="-3" label="Negative max"></ocelle-progress>' +
          '<ocelle-progress id="nan-max" value="50" max="abc" label="Max not a number"></ocelle-progress>' +
          '<ocelle-progress id="empty" value="" label="Empty"></ocelle-progress>' +
          '<ocelle-progress id="blank" value="   " label="Blank"></ocelle-progress>' +
          '<ocelle-progress id="nulled" value="7" max="12" label="Nulled"></ocelle-progress>' +
          '<ocelle-progress id="removed" value="7" max="12" label="Removed"></ocelle-progress>' +
          '<ocelle-progress id="infinite" label="Infinite"></ocelle-progress>' +
          "</div>",
      );
      const before = { bars: await bars(driver, "nulled"), fill: await mark(driver, "nulled") };
      await driver.setProperty("nulled", "value", null);
      await driver.setProperty("removed", "value", undefined);
      await driver.setProperty("infinite", "value", Number.POSITIVE_INFINITY);
      const read = async (id: string): Promise<unknown> => ({ bars: await bars(driver, id), mark: await mark(driver, id) });
      return {
        below: await read("below"),
        above: await read("above"),
        nan: await read("nan"),
        zeroMax: await read("zero-max"),
        negativeMax: await read("negative-max"),
        nanMax: await read("nan-max"),
        empty: await read("empty"),
        blank: await read("blank"),
        before,
        nulled: await read("nulled"),
        removed: await read("removed"),
        infinite: await read("infinite"),
        messages: await driver.messages(),
      };
    },
    expected: {
      below: { bars: [exposed("Below", 0, 12)], mark: filled(0) },
      above: { bars: [exposed("Above", 12, 12)], mark: filled(1) },
      nan: { bars: [exposed("Not a number", undefined, 100)], mark: still },
      zeroMax: { bars: [exposed("Zero max", 50, 100)], mark: filled(0.5) },
      negativeMax: { bars: [exposed("Negative max", 50, 100)], mark: filled(0.5) },
      nanMax: { bars: [exposed("Max not a number", 50, 100)], mark: filled(0.5) },
      empty: { bars: [exposed("Empty", undefined, 100)], mark: still },
      blank: { bars: [exposed("Blank", undefined, 100)], mark: still },
      before: { bars: [exposed("Nulled", 7, 12)], fill: filled(0.58) },
      nulled: { bars: [exposed("Nulled", undefined, 12)], mark: still },
      removed: { bars: [exposed("Removed", undefined, 12)], mark: still },
      infinite: { bars: [exposed("Infinite", undefined, 100)], mark: still },
      messages: [],
    },
  },
  {
    name: "US3-7: the fill is accent with an accent-strong inset edge on an inset track with a control-border boundary, determinate, indeterminate and under reduced motion, in light and dark (FR-036, constitution II)",
    run: async (driver) => {
      await mount(driver, '<div class="w400"><ocelle-progress id="d" value="40" label="Copied"></ocelle-progress><ocelle-progress id="i" label="Loading"></ocelle-progress></div>');
      await driver.theme("light");
      const light = { determinate: await paint(driver, "d"), indeterminate: await paint(driver, "i") };
      await driver.reducedMotion("reduce");
      const reduced = await paint(driver, "i");
      await driver.theme("dark");
      const dark = { determinate: await paint(driver, "d"), indeterminate: await paint(driver, "i") };
      return { light, reduced, dark };
    },
    expected: {
      light: { determinate: painted("light"), indeterminate: painted("light") },
      reduced: painted("light"),
      dark: { determinate: painted("dark"), indeterminate: painted("dark") },
    },
  },
  {
    name: "US3-8: under forced colours, in both palettes, the track has a solid CanvasText outline, the fill is Highlight, which differs from it, and the fill has no box-shadow (FR-037, PLAN-A11Y-SECURITY-1-006)",
    run: async (driver) => {
      await mount(driver, '<div class="w400"><ocelle-progress id="d" value="40" label="Copied"></ocelle-progress></div>');
      const read = async (palette: Palette): Promise<unknown> => {
        await driver.forcedColors("active", palette);
        const [track] = await driver.styles("d", '[part="track"]', ["outline-style", "outline-width", "outline-color"]);
        const [fill] = await driver.styles("d", '[part="fill"]', ["background-color", "box-shadow"]);
        const canvasText = await driver.resolveColour("CanvasText");
        const highlight = await driver.resolveColour("Highlight");
        return {
          outline: { style: track?.["outline-style"], width: track?.["outline-width"], canvasText: track?.["outline-color"] === canvasText },
          fill: { highlight: fill?.["background-color"] === highlight, differs: highlight !== canvasText, shadow: fill?.["box-shadow"] },
        };
      };
      const light = await read("light");
      const dark = await read("dark");
      await driver.forcedColors("none");
      return { light, dark };
    },
    expected: {
      light: { outline: { style: "solid", width: `${String(border)}px`, canvasText: true }, fill: { highlight: true, differs: true, shadow: "none" } },
      dark: { outline: { style: "solid", width: `${String(border)}px`, canvasText: true }, fill: { highlight: true, differs: true, shadow: "none" } },
    },
  },
  {
    name: "US3-9: the track is 8 px with the label above it at the default size, and 4 px with the label beside it and the value text after its inline end on the same line in compact (FR-034, FR-035, IQ-13 (b))",
    run: async (driver) => {
      await mount(
        driver,
        '<div class="w400"><ocelle-progress id="d" value="40" label="Copying" show-label></ocelle-progress><ocelle-progress id="c" size="compact" value="40" label="Copying" value-text="40%" show-label></ocelle-progress></div>',
      );
      const defaultTrack = await driver.box("d", '[part="track"]');
      const defaultLabel = await driver.box("d", '[part="label"]');
      const compactTrack = await driver.box("c", '[part="track"]');
      const compactLabel = await driver.box("c", '[part="label"]');
      const compactText = await driver.box("c", '[part="value-text"]');
      return {
        default: { track: defaultTrack.height, above: defaultLabel.height > 0 && bottom(defaultLabel) <= defaultTrack.y + 0.5, aligned: near(defaultLabel.x, defaultTrack.x) },
        compact: {
          track: compactTrack.height,
          label: compactLabel.height > 0 ? overlaps(compactLabel, compactTrack) : "no label",
          labelFirst: right(compactLabel) <= compactTrack.x + 0.5,
          text: compactText.height > 0 ? overlaps(compactText, compactTrack) : "no value text",
          textAfter: compactText.x >= right(compactTrack) - 0.5,
        },
      };
    },
    expected: {
      default: { track: trackSize.default, above: true, aligned: true },
      compact: { track: trackSize.compact, label: { inline: false, block: true }, labelFirst: true, text: { inline: false, block: true }, textAfter: true },
    },
  },
  {
    name: "US3-10: the visible label is the name, a host aria-label overrides it, the label and value text use tabular figures, and at the default size the label starts at the track's inline start and the value text ends at its inline end, both above it, mirrored under dir=rtl (FR-030, FR-035, IQ-13 (b))",
    run: async (driver) => {
      await mount(
        driver,
        '<div class="w400"><ocelle-progress id="p" value="7" max="12" label="Tasks done" value-text="7 of 12" show-label></ocelle-progress><ocelle-progress id="o" value="7" max="12" label="Tasks done" aria-label="Mission tasks" show-label></ocelle-progress></div>',
      );
      const place = async (): Promise<unknown> => {
        const track = await driver.box("p", '[part="track"]');
        const label = await driver.box("p", '[part="label"]');
        const text = await driver.box("p", '[part="value-text"]');
        return {
          label: { left: near(label.x, track.x), right: near(right(label), right(track)), above: label.height > 0 && bottom(label) <= track.y + 0.5 },
          text: { left: near(text.x, track.x), right: near(right(text), right(track)), above: text.height > 0 && bottom(text) <= track.y + 0.5 },
        };
      };
      const [figures] = await driver.styles("p", '[part="label"], [part="value-text"]', ["font-variant-numeric"]);
      const [textFigures] = await driver.styles("p", '[part="value-text"]', ["font-variant-numeric"]);
      const ltr = await place();
      await driver.dir("p", "rtl");
      return {
        visible: await driver.textOf("p", '[part="label"]'),
        named: await bars(driver, "p"),
        overridden: await bars(driver, "o"),
        figures: [figures?.["font-variant-numeric"], textFigures?.["font-variant-numeric"]],
        ltr,
        rtl: await place(),
      };
    },
    expected: {
      visible: "Tasks done",
      named: [exposed("Tasks done", 7, 12)],
      overridden: [exposed("Mission tasks", 7, 12)],
      figures: ["tabular-nums", "tabular-nums"],
      ltr: { label: { left: true, right: false, above: true }, text: { left: false, right: true, above: true } },
      rtl: { label: { left: false, right: true, above: true }, text: { left: true, right: false, above: true } },
    },
  },
  {
    name: "US3-11: a bar with neither label nor host aria-label is a progressbar with no name and its value (FR-030, FR-050)",
    run: async (driver) => {
      await mount(driver, '<div class="w400"><ocelle-progress id="p" value="40"></ocelle-progress></div>');
      return await bars(driver, "p");
    },
    expected: [exposed("", 40, 100)],
  },
  {
    name: "US3-12: without reduced motion the sweep has a finite end time of 4200 ms, under 5000 ms, and once it has finished nothing runs and the mark is the still mark (FR-033, PLAN-A11Y-SECURITY-1-001 (a))",
    run: async (driver) => {
      await mount(driver, '<div class="w400"><ocelle-progress id="i" label="Loading"></ocelle-progress></div>');
      await driver.frames(2);
      const running = await sweep(driver, "i");
      const endTime = running?.endTime ?? -1;
      await pause(Math.max(0, Math.min(endTime, sweepEnd) - (running?.currentTime ?? 0)) + 400);
      return { endTime, bounded: endTime > 0 && endTime < 5000, after: { animations: await motion(driver, "i"), mark: await mark(driver, "i") } };
    },
    expected: { endTime: sweepEnd, bounded: true, after: { animations: [], mark: still } },
  },
  {
    name: "US3-13: with ground=tinted the track's boundary is accent-strong, unset it is control-border, in light and dark (FR-036, PLAN-A11Y-SECURITY-1-002 (a))",
    run: async (driver) => {
      await mount(driver, '<div class="w400"><ocelle-progress id="t" value="40" label="Copied" ground="tinted"></ocelle-progress><ocelle-progress id="u" value="40" label="Copied"></ocelle-progress></div>');
      const read = async (): Promise<unknown> => ({ tinted: await paint(driver, "t"), unset: await paint(driver, "u") });
      await driver.theme("light");
      const light = await read();
      await driver.theme("dark");
      return { light, dark: await read() };
    },
    expected: {
      light: { tinted: painted("light", "color-accent-strong"), unset: painted("light") },
      dark: { tinted: painted("dark", "color-accent-strong"), unset: painted("dark") },
    },
  },
  {
    name: "US3-14: an indeterminate bar replaced in one task 2 s after it was shown continues the one sweep (the new bar's mark runs at the episode's time), and 5 s after the first was shown nothing runs and the still mark shows (FR-033, PLAN-FRESH-2-005 (a))",
    run: async (driver) => {
      await mount(driver, '<div class="w400" id="region"><ocelle-progress id="first" label="Loading"></ocelle-progress></div>');
      const shown = Date.now();
      await driver.frames(2);
      const first = (await sweep(driver, "first")) !== undefined;
      await pause(2000 - (Date.now() - shown));
      await driver.replace("first", '<ocelle-progress id="second" label="Loading"></ocelle-progress>');
      await driver.frames(1);
      const joined = await sweep(driver, "second");
      await pause(5000 - (Date.now() - shown));
      return {
        first,
        joined: { running: joined !== undefined, continued: (joined?.currentTime ?? 0) >= 1500 },
        after: { animations: await motion(driver, "second"), mark: await mark(driver, "second") },
      };
    },
    expected: { first: true, joined: { running: true, continued: true }, after: { animations: [], mark: still } },
  },
  {
    name: "US3-15: after the sweep has ended, the only bar removed and two frames later a new indeterminate bar shown starts a new episode: its mark sweeps from its own start and ends under 5000 ms (FR-033, PLAN-FRESH-3-004 (a))",
    run: async (driver) => {
      await mount(driver, '<div class="w400" id="region"><ocelle-progress id="first" label="Loading"></ocelle-progress><span id="placeholder"></span></div>');
      await driver.frames(2);
      const started = (await sweep(driver, "first")) !== undefined;
      await pause(pastWindow);
      const ended = { animations: await motion(driver, "first"), mark: await mark(driver, "first") };
      await driver.remove("first");
      await driver.frames(2);
      await driver.replace("placeholder", '<ocelle-progress id="second" label="Loading"></ocelle-progress>');
      await driver.frames(1);
      const running = await sweep(driver, "second");
      return {
        started,
        ended,
        second: { running: running !== undefined, fresh: running?.currentTime !== null && running?.currentTime !== undefined && running.currentTime < loop, endTime: running?.endTime },
      };
    },
    expected: { started: true, ended: { animations: [], mark: still }, second: { running: true, fresh: true, endTime: sweepEnd } },
  },
  {
    name: "one episode: after the window, a bar made determinate and indeterminate again within one task runs nothing and shows the still mark at once (FR-033, PLAN-FRESH-3-004 (a))",
    run: async (driver) => {
      await mount(driver, '<div class="w400"><ocelle-progress id="i" label="Loading"></ocelle-progress></div>');
      await driver.frames(2);
      const started = (await sweep(driver, "i")) !== undefined;
      await pause(pastWindow);
      await driver.changeAttributes("i", [
        ["value", "50"],
        ["value", null],
      ]);
      return { started, after: { animations: await motion(driver, "i"), mark: await mark(driver, "i"), bars: await bars(driver, "i") } };
    },
    expected: { started: true, after: { animations: [], mark: still, bars: [exposed("Loading", undefined, 100)] } },
  },
  {
    name: "driver: each mount starts a fresh loading episode, so a bar mounted after an earlier bar's sweep has ended sweeps again (contracts/checks.md § Driver additions)",
    run: async (driver) => {
      await mount(driver, '<div class="w400"><ocelle-progress id="i" label="Loading"></ocelle-progress></div>');
      await driver.frames(2);
      const started = (await sweep(driver, "i")) !== undefined;
      await pause(pastWindow);
      const ended = await motion(driver, "i");
      await mount(driver, '<div class="w400"><ocelle-progress id="j" label="Loading"></ocelle-progress></div>');
      await driver.frames(2);
      return { started, ended, again: await motion(driver, "j") };
    },
    expected: { started: true, ended: [], again: sweeping },
  },
  {
    name: "value removed: the mark is 40% of the track at once, with no CSSTransition and nothing on the fill's inline size, without reduced motion (the sweep may run) and with it (nothing runs) (FR-032, PLAN-CORRECTNESS-1-005, PLAN-FRESH-3-003 (b))",
    run: async (driver) => {
      const read = async (): Promise<unknown> => {
        await mount(driver, '<div class="w400"><ocelle-progress id="p" value="60" label="Copying"></ocelle-progress></div>');
        const before = await mark(driver, "p");
        await driver.setAttribute("p", "value", null);
        const animations = await driver.animations("p");
        return {
          before,
          share: (await mark(driver, "p")).share,
          transitions: animations.filter((each) => each.kind === "CSSTransition").length,
          sized: animations.filter((each) => /inline-size|width/i.test(each.property)).length,
        };
      };
      const moving = await read();
      await driver.reducedMotion("reduce");
      const reduced = await read();
      return { moving, reduced, reducedAnimations: await motion(driver, "p") };
    },
    expected: {
      moving: { before: filled(0.6), share: 0.4, transitions: 0, sized: 0 },
      reduced: { before: filled(0.6), share: 0.4, transitions: 0, sized: 0 },
      reducedAnimations: [],
    },
  },
  {
    name: "right-to-left, indeterminate: within the first loop the mark of a dir=rtl bar moves from right to left, while a dir=ltr bar's moves left to right (FR-038, PLAN-CORRECTNESS-1-004)",
    run: async (driver) => {
      await mount(driver, '<div class="w400"><ocelle-progress id="l" label="Loading"></ocelle-progress><ocelle-progress id="r" label="Loading" dir="rtl"></ocelle-progress></div>');
      await driver.frames(1);
      const first = { l: await driver.box("l", '[part="fill"]'), r: await driver.box("r", '[part="fill"]') };
      await driver.frames(10);
      const second = { l: await driver.box("l", '[part="fill"]'), r: await driver.box("r", '[part="fill"]') };
      const running = await sweep(driver, "r");
      return {
        ltr: second.l.x > first.l.x,
        rtl: second.r.x < first.r.x,
        inside: running !== undefined && running.currentTime !== null && running.currentTime < loop,
      };
    },
    expected: { ltr: true, rtl: true, inside: true },
  },
  {
    name: "right-to-left, determinate: the fill grows from the left under dir=ltr and from the right under dir=rtl (FR-038)",
    run: async (driver) => {
      await mount(driver, '<div class="w400"><ocelle-progress id="l" value="25" label="Copied"></ocelle-progress><ocelle-progress id="r" value="25" label="Copied" dir="rtl"></ocelle-progress></div>');
      return { ltr: await mark(driver, "l", "ltr"), rtl: await mark(driver, "r", "rtl") };
    },
    expected: { ltr: filled(0.25), rtl: filled(0.25) },
  },
  {
    name: "at a 320 px viewport, while the sweep runs, the page scroll width stays 320 at every sample: the track clips the mark (PLAN-CORRECTNESS-1-006)",
    run: async (driver) => {
      await driver.viewport(320, 800);
      await mount(driver, '<ocelle-progress id="i" label="Loading"></ocelle-progress>');
      const samples: number[] = [];
      let running = 0;
      for (let sample = 0; sample < 12; sample++) {
        await driver.frames(4);
        samples.push(await driver.scrollWidth());
        if ((await sweep(driver, "i")) !== undefined) running += 1;
      }
      return { widths: [...new Set(samples)], running: running === samples.length };
    },
    expected: { widths: [320], running: true },
  },
  {
    name: "compact long label at 320 px: the track keeps at least --ocelle-measure-cell and stays beside the label (their block ranges overlap), the label wraps between words onto more than one line, and the page does not scroll sideways (edge case, analysis G5)",
    run: async (driver) => {
      await driver.viewport(320, 800);
      await mount(
        driver,
        `<span id="cell" class="cell"></span><ocelle-progress id="short" size="compact" value="30" label="Plan" show-label></ocelle-progress><ocelle-progress id="long" size="compact" value="30" label="${longLabel}" show-label></ocelle-progress>`,
      );
      const cell = await driver.box("cell");
      const track = await driver.box("long", '[part="track"]');
      const shortLabel = await driver.box("short", '[part="label"]');
      const label = await driver.box("long", '[part="label"]');
      const [wrap] = await driver.styles("long", '[part="label"]', ["overflow-wrap", "word-break"]);
      return {
        cell: cell.width > 0,
        track: track.width >= cell.width - 0.5,
        beside: overlaps(label, track).block,
        wraps: shortLabel.height > 0 && label.height > shortLabel.height * 1.5,
        betweenWords: wrap,
        scrollWidth: await driver.scrollWidth(),
      };
    },
    expected: { cell: true, track: true, beside: true, wraps: true, betweenWords: { "overflow-wrap": "normal", "word-break": "normal" }, scrollWidth: 320 },
  },
  {
    name: "no tab stop: from a button before the bar one Tab focuses the button after it, the bar exposed with its name between them (FR-039)",
    run: async (driver) => {
      await mount(driver, '<button id="before" type="button">Before</button><ocelle-progress id="p" value="40" label="Copying"></ocelle-progress><button id="after" type="button">After</button>');
      await driver.pressTab();
      const first = await driver.focused();
      await driver.pressTab();
      return { sequence: [first, await driver.focused()], bars: await bars(driver, "p") };
    },
    expected: { sequence: ["before", "after"], bars: [exposed("Copying", 40, 100)] },
  },
  {
    name: "unset size and ground write no attribute; set, they are reflected (FR-034, FR-036)",
    run: async (driver) => {
      await mount(driver, '<ocelle-progress id="p" value="40" label="Copying"></ocelle-progress>');
      const unset = { size: await driver.attribute("p", "size"), ground: await driver.attribute("p", "ground") };
      await driver.setProperty("p", "size", "compact");
      await driver.setProperty("p", "ground", "tinted");
      return { unset, set: { size: await driver.attribute("p", "size"), ground: await driver.attribute("p", "ground") } };
    },
    expected: { unset: { size: null, ground: null }, set: { size: "compact", ground: "tinted" } },
  },
  {
    name: "fallback text: 7/12 inside a named bar has no client rect, is not in its innerText and is in no accessibility node after upgrade, beside the progressbar named Tasks done with value 7 (FR-039, IQ-15 (b))",
    run: async (driver) => {
      await mount(driver, '<div class="w400" id="wrap"><ocelle-progress id="p" value="7" max="12" label="Tasks done">7/12</ocelle-progress></div>');
      const nodes = await driver.axSubtree("wrap");
      return {
        rendered: await driver.rendered("p"),
        exposed: nodes.filter((node) => node.name.includes("7/12")).length,
        bars: await bars(driver, "p"),
      };
    },
    expected: { rendered: { innerText: "", rects: 0 }, exposed: 0, bars: [exposed("Tasks done", 7, 12)] },
  },
  {
    name: "inline placement: the host is display: block; a bar given display: inline-block and inline-size: 12rem by a page rule sits on the paragraph's first line beside the text before it, 12rem wide (IQ-12 (a))",
    run: async (driver) => {
      await mount(
        driver,
        '<div class="w600"><ocelle-progress id="block" value="40" label="Copying"></ocelle-progress><p><span id="before">Loading projects</span> <ocelle-progress id="inline" class="inline-bar" label="Loading"></ocelle-progress> and the rest of the line</p></div>',
      );
      const before = await driver.box("before");
      const bar = await driver.box("inline");
      return {
        display: await driver.computed("block", "display"),
        width: bar.width,
        line: { block: overlaps(bar, before).block, after: bar.x >= right(before) },
        drawn: (await driver.box("inline", '[part="track"]')).width,
      };
    },
    expected: { display: "block", width: inlineBar, line: { block: true, after: true }, drawn: inlineBar },
  },
  // Added after green for the mutation run (gate:mutation, phase 3): behaviours of FR-031, FR-032, FR-033 and FR-035
  // that no red body pinned.
  {
    name: "value and max attributes give number properties: value=7 and max=12 read 7 and 12, an empty value and a max that is not a number read undefined (FR-032; contracts/elements.md `number | undefined`)",
    run: async (driver) => {
      await mount(driver, '<ocelle-progress id="p" value="7" max="12" label="Tasks done"></ocelle-progress><ocelle-progress id="e" value="" max="abc" label="Loading"></ocelle-progress>');
      return { value: await driver.property("p", "value"), max: await driver.property("p", "max"), empty: await driver.property("e", "value"), notNumber: await driver.property("e", "max"), bars: await bars(driver, "p") };
    },
    expected: { value: 7, max: 12, empty: undefined, notNumber: undefined, bars: [exposed("Tasks done", 7, 12)] },
  },
  {
    name: "an empty label and an empty value text, or both set to null, show no label row parts and give no name, and without show-label a label and value text are not shown, the bar named by its label (FR-030, FR-031, FR-035)",
    run: async (driver) => {
      await mount(
        driver,
        '<div class="w400"><ocelle-progress id="e" value="7" max="12" label="" value-text="" show-label></ocelle-progress><ocelle-progress id="h" value="7" max="12" label="Tasks done" value-text="7 of 12"></ocelle-progress><ocelle-progress id="s" value="7" max="12" label="Tasks done" value-text="7 of 12" show-label></ocelle-progress><ocelle-progress id="n" value="7" max="12" label="Tasks done" value-text="7 of 12" show-label></ocelle-progress></div>',
      );
      await driver.setProperty("n", "label", null);
      await driver.setProperty("n", "valueText", null);
      const parts = async (id: string): Promise<unknown> => ({ label: await driver.textOf(id, '[part="label"]'), valueText: await driver.textOf(id, '[part="value-text"]') });
      return {
        empty: { parts: await parts("e"), bars: await bars(driver, "e") },
        nulled: { parts: await parts("n"), bars: await bars(driver, "n") },
        hidden: { parts: await parts("h"), bars: await bars(driver, "h") },
        shown: await parts("s"),
      };
    },
    expected: {
      empty: { parts: { label: null, valueText: null }, bars: [exposed("", 7, 12)] },
      nulled: { parts: { label: null, valueText: null }, bars: [exposed("", 7, 12)] },
      hidden: { parts: { label: null, valueText: null }, bars: [exposed("Tasks done", 7, 12)] },
      shown: { label: "Tasks done", valueText: "7 of 12" },
    },
  },
  {
    name: "a bar determinate for two frames and then indeterminate again, after the sweep has ended, starts a new episode: its mark sweeps from its own start (FR-033, PLAN-FRESH-3-004 (a))",
    run: async (driver) => {
      await mount(driver, '<div class="w400"><ocelle-progress id="i" label="Loading"></ocelle-progress></div>');
      await driver.frames(2);
      const started = (await sweep(driver, "i")) !== undefined;
      await pause(pastWindow);
      const ended = await motion(driver, "i");
      await driver.setAttribute("i", "value", "50");
      await driver.frames(2);
      await driver.setAttribute("i", "value", null);
      await driver.frames(1);
      const running = await sweep(driver, "i");
      return { started, ended, again: { running: running !== undefined, fresh: running?.currentTime !== null && running?.currentTime !== undefined && running.currentTime < loop } };
    },
    expected: { started: true, ended: [], again: { running: true, fresh: true } },
  },
  {
    name: "re-shown within the episode: a bar hidden by its parent and moved, while hidden, into another hidden parent stays in the episode, and shown again after the window it runs nothing and shows the still mark (FR-033, R-06 membership)",
    run: async (driver) => {
      await mount(driver, '<div class="w400" id="a"><ocelle-progress id="m" label="Loading"></ocelle-progress></div><div class="w400" id="b" hidden></div>');
      await driver.frames(2);
      const started = (await sweep(driver, "m")) !== undefined;
      await driver.setAttribute("a", "hidden", "");
      await driver.move("m", "b");
      await driver.frames(2);
      await pause(pastWindow);
      await driver.setAttribute("b", "hidden", null);
      await driver.frames(2);
      return { started, shown: { animations: await motion(driver, "m"), mark: await mark(driver, "m") } };
    },
    expected: { started: true, shown: { animations: [], mark: still } },
  },
  {
    name: "a swap in one task keeps the episode open: a third bar inserted a second later continues the sweep at the episode's time (FR-033, PLAN-FRESH-2-005 (a))",
    run: async (driver) => {
      await mount(driver, '<div class="w400"><ocelle-progress id="first" label="Loading"></ocelle-progress><span id="placeholder"></span></div>');
      const shown = Date.now();
      await driver.frames(2);
      await driver.replace("first", '<ocelle-progress id="second" label="Loading"></ocelle-progress>');
      await driver.frames(3);
      await pause(1000 - (Date.now() - shown));
      await driver.replace("placeholder", '<ocelle-progress id="third" label="Loading"></ocelle-progress>');
      await driver.frames(1);
      const third = await sweep(driver, "third");
      return { running: third !== undefined, continued: (third?.currentTime ?? 0) >= 800 };
    },
    expected: { running: true, continued: true },
  },
  {
    name: "a determinate bar moved does not keep the episode open: after the only indeterminate bar is removed, a new indeterminate bar two frames later sweeps from its own start (FR-033, R-06 membership)",
    run: async (driver) => {
      await mount(driver, '<div class="w400" id="a"><ocelle-progress id="i" label="Loading"></ocelle-progress><ocelle-progress id="d" value="40" label="Copying"></ocelle-progress><span id="placeholder"></span></div><div class="w400" id="b"></div>');
      await driver.frames(2);
      const started = (await sweep(driver, "i")) !== undefined;
      await pause(pastWindow);
      await driver.move("d", "b");
      await driver.remove("i");
      await driver.frames(2);
      await driver.replace("placeholder", '<ocelle-progress id="n" label="Loading"></ocelle-progress>');
      await driver.frames(1);
      const running = await sweep(driver, "n");
      return { started, moved: await bars(driver, "d"), fresh: running !== undefined && running.currentTime !== null && running.currentTime < loop };
    },
    expected: { started: true, moved: [exposed("Copying", 40, 100)], fresh: true },
  },
  {
    name: "after the window, while the episode lasts, a bar inserted shows the still mark at once: at the first read after its render nothing runs on it (FR-033, PLAN-FRESH-2-005 (a))",
    run: async (driver) => {
      await mount(driver, '<div class="w400"><ocelle-progress id="first" label="Loading"></ocelle-progress><span id="placeholder"></span></div>');
      await driver.frames(2);
      const started = (await sweep(driver, "first")) !== undefined;
      await pause(pastWindow);
      await driver.replace("placeholder", '<ocelle-progress id="late" label="Loading"></ocelle-progress>');
      return { started, late: { animations: await motion(driver, "late"), mark: await mark(driver, "late") } };
    },
    expected: { started: true, late: { animations: [], mark: still } },
  },
];
