// The shared bodies of User Story 1's browser scenarios, `ocelle-status-indicator` (018 spec US1-1 to US1-8, FR-010 to
// FR-016, FR-041; research.md R-02 to R-04; data-model.md § `ocelle-status-indicator`; contracts/checks.md § US1
// bodies and § Edge cases; tasks.md T012). Each body observes the page through the driver and returns one observation;
// each harness asserts it equals `expected`, written by hand from the spec, the data model and research:
// - sizes from `--ocelle-size-indicator`, 0.5rem = 8 px at the default 16 px root size, and the ring's reach, half of
//   it (4 px) on every side at the end of an iteration (R-04); the pill radius `--ocelle-radius-pill`, 999px;
// - colours from the token table of packages/tokens/test/expected.ts (`tokenColour`), never from the element source;
//   the forced-colours system colours read from the platform (`resolveColour`) in the same mode, in the same body;
// - the pulse from `--ocelle-motion-pulse`, 1600 ms, and the literal count 3 (operator decision Q1 (a) at the phase-1
//   recheck): 3 iterations, an end time of 4800 ms, within the 5 s limit (FR-012);
// - the behaviour of `moveBefore()`, `hidden="until-found"` and `<details>` and Chromium's tree for a host
//   `aria-label` on an `img` of `ElementInternals`, as the phase-1 spike measured them on stand-ins
//   (reviews/phase-1/spikes.md § R-04 (d) and § R-03, US1-8), written here by hand.
//
// A run is read through the driver's animation record (`animationStates`, identity per `Animation` object). "Near 0"
// is a current time under 500 ms, read right after the change that starts the run settles; "the same run" is the same
// identity. `seek` pauses a run at a time; `advance` moves it on without pausing, so it can end within the body. Waits
// are on the test's own clock (`pause`). A run that ends inside a closed `<details>` or under `hidden="until-found"` may
// still be listed there as `finished` until the content is shown (the spike read it so), so those reads count the
// runs that are not finished.
//
// Every "does not" outcome shares its body with the positive outcome it guards, and its plant is named (contracts/
// checks.md § US1 bodies):
// - a listed change keeps the run (plant: the ring re-created on every render), beside the positive twin in which
//   `pulse` removed and set again in a later task starts a new run (plant: the ring kept when `pulse` is removed);
// - a same-task toggle starts no run and keeps the ring node, beside that positive twin;
// - `moveBefore()`, `hidden="until-found"` and `<details>` keep or end the run as measured, each beside a remove-and-
//   insert or a `hidden` twin that starts a new run;
// - under reduced motion with a host rule restoring `--ocelle-motion-pulse: 1600ms` no run, beside its twin under no
//   preference with the same rule, which runs (plant: the element's own `animation: none` removed);
// - a host `aria-label` changes nothing the element decides, beside the same indicators without it (plant: the
//   element reads `aria-label`);
// - an unlabelled indicator adds no node, beside its labelled twin; a host `hidden` removes its box, beside a visible
//   twin (plant: `:host([hidden])` removed); an unknown tone draws the neutral colour, beside a known one.
import { tokenColour } from "./icon.ts";
import type { Scenario } from "./icon.ts";
import type { AnimationState, Box, Driver, Palette } from "./driver.ts";

/** The five tones of the status vocabulary, in its order (data-model.md § Status vocabulary). */
export const tones = ["info", "success", "warning", "danger", "neutral"] as const;

/** `--ocelle-size-indicator`: 0.5rem at the 16 px root (expected.ts). */
export const dotSize = 8;
/** The ring's reach at the end of an iteration: half the dot's size on every side (R-04). */
const reach = 4;
/** `--ocelle-motion-pulse`: 1600 ms (expected.ts), the length of one iteration. */
const iteration = 1600;
/** The fixed iteration count, the literal 3 (operator decision Q1 (a)). */
const count = 3;
/** The end of a run: 3 × 1600 ms, 4800 ms. */
const runEnd = count * iteration;
/** What "near 0" means for a run read right after the change that starts it. */
const fresh = 500;

const dot = '[part="dot"]';
const ring = '[part="ring"]';

/** Waits `ms` on the test's own clock. */
export function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const hundredth = (value: number): number => Math.round(value * 100) / 100 + 0;

/** The ring's runs on the element with `id` (its other parts run none). */
async function runs(driver: Driver, id: string): Promise<AnimationState[]> {
  return driver.animationStates(id);
}

/** A run's shape: which part, its play state, its iteration count and end time (to the ms). */
function shape(run: AnimationState | undefined): unknown {
  return run === undefined ? "no run" : { part: run.part, playState: run.playState, iterations: run.iterations, endTime: Math.round(run.endTime) };
}

/** The one run of a pulsing indicator as research.md R-04 writes it. */
const oneRun = { part: "ring", playState: "running", iterations: count, endTime: runEnd };

/** The dot's box size, opacity and fill. */
async function dotLook(driver: Driver, id: string): Promise<{ readonly width: number; readonly height: number; readonly opacity: string; readonly fill: string }> {
  const box = await driver.box(id, dot);
  const [style] = await driver.styles(id, dot, ["opacity", "background-color"]);
  return { width: hundredth(box.width), height: hundredth(box.height), opacity: style?.opacity ?? "missing", fill: style?.["background-color"] ?? "missing" };
}

/** The solid dot of `tone` in `theme`. */
function solid(tone: string, theme: Palette = "light"): unknown {
  return { width: dotSize, height: dotSize, opacity: "1", fill: tokenColour(`color-${tone}`, theme) };
}

/** The ring's box against the dot's: its size and how far its centre is from the dot's centre. */
function around(ringBox: Box, dotBox: Box): { readonly width: number; readonly height: number; readonly offset: readonly [number, number] } {
  const centre = (box: Box): readonly [number, number] => [box.x + box.width / 2, box.y + box.height / 2];
  const [rx, ry] = centre(ringBox);
  const [dx, dy] = centre(dotBox);
  return { width: hundredth(ringBox.width), height: hundredth(ringBox.height), offset: [hundredth(rx - dx), hundredth(ry - dy)] };
}

/** Whether `after` is the same run as `before`, still at or past `at` ms. */
function kept(before: AnimationState | undefined, after: AnimationState | undefined, at: number): unknown {
  return { same: before !== undefined && after?.identity === before.identity, atOrPast: (after?.currentTime ?? -1) >= at, playState: after?.playState ?? "no run" };
}

/** Whether `after` is a new run (a new identity) from near 0. */
function restarted(before: AnimationState | undefined, after: AnimationState | undefined): unknown {
  return { new: before !== undefined && after !== undefined && after.identity !== before.identity, nearZero: after?.currentTime !== null && after?.currentTime !== undefined && after.currentTime < fresh, playState: after?.playState ?? "no run" };
}

const keptRunning = { same: true, atOrPast: true, playState: "running" };
const keptPaused = { same: true, atOrPast: true, playState: "paused" };
const newRun = { new: true, nearZero: true, playState: "running" };

/** Ends the run of `id` within the body: moves it to 50 ms before its end and waits past that end. */
async function endRun(driver: Driver, id: string): Promise<void> {
  await driver.advance(id, ring, runEnd - 50);
  await pause(300);
  await driver.frames(2);
}

/** The listed changes of FR-012 that start no run, each applied to the indicator `i` (contracts/checks.md § US1-4). */
const listedChanges: readonly { readonly name: string; readonly apply: (driver: Driver) => Promise<void> }[] = [
  { name: "tone", apply: (driver) => driver.setAttribute("i", "tone", "danger") },
  { name: "label", apply: (driver) => driver.setAttribute("i", "label", "Blocked") },
  { name: "theme", apply: (driver) => driver.theme("dark") },
  { name: "inline size", apply: (driver) => driver.size("i", 40, null) },
  { name: "position", apply: (driver) => driver.style("i", "margin-inline-start", "24px") },
  {
    name: "visibility",
    apply: async (driver) => {
      await driver.style("i", "visibility", "hidden");
      await driver.style("i", "visibility", "visible");
    },
  },
  { name: "opacity", apply: (driver) => driver.style("i", "opacity", "0.5") },
  {
    name: "scroll out of view and back",
    apply: async (driver) => {
      await driver.setScrollLeft("scroller", 600);
      await driver.setScrollLeft("scroller", 0);
    },
  },
];

/** The rules of the scroll container of the listed-change body. */
const scrollerRules = "#scroller { inline-size: 200px; overflow-x: auto; white-space: nowrap; } #spacer { display: inline-block; inline-size: 800px; block-size: 1px; }";

export const statusIndicatorScenarios: readonly Scenario[] = [
  {
    name: "US1-1: with no attributes the indicator shows a solid 8 px dot in --ocelle-color-neutral, round with the pill radius, and is hidden from the accessibility tree, beside a labelled twin that is one image node (FR-011, FR-014; plan decision 3)",
    run: async (driver) => {
      await driver.mount('<p><ocelle-status-indicator id="i"></ocelle-status-indicator> Draft</p><p><ocelle-status-indicator id="named" label="Running"></ocelle-status-indicator></p>');
      const [radius] = await driver.styles("i", dot, ["border-top-left-radius", "border-bottom-right-radius"]);
      return {
        dot: await dotLook(driver, "i"),
        radius,
        tree: await driver.ax("i"),
        labelled: await driver.ax("named"),
        tone: await driver.property("i", "tone"),
        runs: (await runs(driver, "i")).length,
        ring: (await driver.boxes("i", ring)).length,
      };
    },
    expected: { dot: solid("neutral"), radius: { "border-top-left-radius": "999px", "border-bottom-right-radius": "999px" }, tree: [], labelled: [{ role: "image", name: "Running" }], tone: "neutral", runs: 0, ring: 0 },
  },
  ...(["light", "dark"] as const).map(
    (theme): Scenario => ({
      name: `US1-2: in ${theme}, the dot of each tone is filled with --ocelle-color-<tone>, solid and 8 px (FR-002, FR-011)`,
      run: async (driver) => {
        await driver.mount(tones.map((tone) => `<ocelle-status-indicator id="${tone}" tone="${tone}"></ocelle-status-indicator>`).join(""));
        await driver.theme(theme);
        const observed: Record<string, unknown> = {};
        for (const tone of tones) observed[tone] = await dotLook(driver, tone);
        return observed;
      },
      expected: Object.fromEntries(tones.map((tone) => [tone, solid(tone, theme)])),
    }),
  ),
  {
    name: "US1-3: label=\"Running\" gives exactly one image node named Running and nothing else from the element; the label is trimmed, and a blank or whitespace-only label is decorative, beside the named twin (FR-014; Edge Cases)",
    run: async (driver) => {
      await driver.mount(
        '<ocelle-status-indicator id="running" tone="success" label="Running"></ocelle-status-indicator>' +
          '<ocelle-status-indicator id="padded" label="  Running late  "></ocelle-status-indicator>' +
          '<ocelle-status-indicator id="blank" label=""></ocelle-status-indicator>' +
          '<ocelle-status-indicator id="spaces" label="   "></ocelle-status-indicator>',
      );
      return { running: await driver.ax("running"), subtree: await driver.axSubtree("running"), padded: await driver.ax("padded"), blank: await driver.ax("blank"), spaces: await driver.ax("spaces") };
    },
    expected: { running: [{ role: "image", name: "Running" }], subtree: [{ role: "image", name: "Running" }], padded: [{ role: "image", name: "Running late" }], blank: [], spaces: [] },
  },
  {
    name: "US1-3: a label set, changed and removed by property or attribute renames or hides the image at once, and label and pulse reflect (FR-010, FR-014)",
    run: async (driver) => {
      await driver.mount('<ocelle-status-indicator id="i"></ocelle-status-indicator>');
      const before = await driver.ax("i");
      await driver.setProperty("i", "label", "Online");
      const set = { tree: await driver.ax("i"), attribute: await driver.attribute("i", "label") };
      await driver.setAttribute("i", "label", "Offline");
      const changed = { tree: await driver.ax("i"), property: await driver.property("i", "label") };
      await driver.setAttribute("i", "label", null);
      const removed = await driver.ax("i");
      await driver.setProperty("i", "pulse", true);
      const pulseOn = await driver.attribute("i", "pulse");
      await driver.setProperty("i", "pulse", false);
      const pulseOff = await driver.attribute("i", "pulse");
      return { before, set, changed, removed, pulseOn, pulseOff };
    },
    expected: {
      before: [],
      set: { tree: [{ role: "image", name: "Online" }], attribute: "Online" },
      changed: { tree: [{ role: "image", name: "Offline" }], property: "Offline" },
      removed: [],
      pulseOn: "",
      pulseOff: null,
    },
  },
  {
    name: "US1-4: with pulse one run of 3 iterations of 1600 ms runs on the ring, ending at 4800 ms (within 5 s), while the dot keeps its full opacity and size and runs nothing in every sampled frame; the ring grows from the dot to 4 px beyond it on every side, centred on it, and fades (FR-011, FR-012, FR-041; R-04)",
    run: async (driver) => {
      await driver.mount('<p><ocelle-status-indicator id="i" tone="success" label="Running" pulse></ocelle-status-indicator> Running</p>');
      const started = await runs(driver, "i");
      const frames: Record<string, unknown> = {};
      for (const at of [0, 400, 800, 1500, 2400, 4000]) {
        await driver.seek("i", ring, at);
        const [ringStyle] = await driver.styles("i", ring, ["opacity"]);
        const ringOpacity = Number(ringStyle?.opacity ?? Number.NaN);
        const geometry = around(await driver.box("i", ring), await driver.box("i", dot));
        frames[String(at)] = {
          dot: await dotLook(driver, "i"),
          ringOpacity: at === 0 ? ringOpacity : ringOpacity > 0 && ringOpacity < 1 ? "between 0 and 1" : ringOpacity,
          ringWidth: at === 0 ? geometry.width : geometry.width > dotSize && geometry.width <= dotSize + 2 * reach ? "grown, at most 16" : geometry.width,
          square: geometry.width === geometry.height,
          centred: geometry.offset,
        };
      }
      return {
        runs: started.map(shape),
        fresh: (started[0]?.currentTime ?? fresh) < fresh,
        withinLimit: (started[0]?.endTime ?? Number.POSITIVE_INFINITY) <= 5000,
        frames,
      };
    },
    expected: {
      runs: [oneRun],
      fresh: true,
      withinLimit: true,
      frames: Object.fromEntries(
        [0, 400, 800, 1500, 2400, 4000].map((at) => [
          String(at),
          { dot: solid("success"), ringOpacity: at === 0 ? 1 : "between 0 and 1", ringWidth: at === 0 ? dotSize : "grown, at most 16", square: true, centred: [0, 0] },
        ]),
      ),
    },
  },
  {
    name: "US1-4: after its run ends no animation runs and the dot is solid while pulse stays set; removing pulse before the end stops the run and removes the ring; pulse set again in a later task starts a new run from near 0 (FR-012 (a))",
    run: async (driver) => {
      await driver.mount('<ocelle-status-indicator id="ended" tone="warning" pulse></ocelle-status-indicator><ocelle-status-indicator id="stopped" tone="info" pulse></ocelle-status-indicator>');
      await endRun(driver, "ended");
      const ended = { runs: (await runs(driver, "ended")).length, pulse: await driver.attribute("ended", "pulse"), dot: await dotLook(driver, "ended") };
      const [before] = await runs(driver, "stopped");
      await driver.setAttribute("stopped", "pulse", null);
      const stopped = { runs: (await runs(driver, "stopped")).length, ring: (await driver.boxes("stopped", ring)).length, dot: await dotLook(driver, "stopped") };
      await driver.setAttribute("stopped", "pulse", "");
      const [again] = await runs(driver, "stopped");
      return { ended, stopped, again: restarted(before, again), shape: shape(again), ring: (await driver.boxes("stopped", ring)).length };
    },
    expected: {
      ended: { runs: 0, pulse: "", dot: solid("warning") },
      stopped: { runs: 0, ring: 0, dot: solid("info") },
      again: newRun,
      shape: oneRun,
      ring: 1,
    },
  },
  {
    name: "US1-4: pulse removed and set again within one task on an ended run starts no run and keeps the ring node, beside the twin in which it is removed and set again in separate tasks and a new run starts with a new ring (FR-012 (a) as amended; README rule (vi))",
    run: async (driver) => {
      await driver.mount('<ocelle-status-indicator id="i" pulse></ocelle-status-indicator>');
      const [first] = await runs(driver, "i");
      await endRun(driver, "i");
      const nodes = await driver.identities("i");
      await driver.changeAttributes("i", [["pulse", null], ["pulse", ""]]);
      await driver.frames(2);
      const sameTask = { runs: (await runs(driver, "i")).length, sameNodes: JSON.stringify(await driver.identities("i")) === JSON.stringify(nodes), nodes: nodes.length };
      await driver.setAttribute("i", "pulse", null);
      await driver.setAttribute("i", "pulse", "");
      const [second] = await runs(driver, "i");
      const after = await driver.identities("i");
      return { sameTask, laterTask: restarted(first, second), newRing: after.length === 2 && after[1] !== nodes[1] };
    },
    expected: { sameTask: { runs: 0, sameNodes: true, nodes: 2 }, laterTask: newRun, newRing: true },
  },
  {
    name: "US1-4: no listed change restarts the run: after a seek to 1000 ms, a change of tone, label, theme, inline size, position, visibility, opacity, or a scroll out of view and back keeps the same animation at 1000 ms or later, beside the positive twin of pulse set again in a later task (FR-012; plant: the ring re-created on every render)",
    run: async (driver) => {
      const observed: Record<string, unknown> = {};
      for (const change of listedChanges) {
        await driver.mount('<div id="scroller"><ocelle-status-indicator id="i" tone="success" pulse></ocelle-status-indicator><span id="spacer"></span></div>');
        await driver.rules(scrollerRules);
        await driver.seek("i", ring, 1000);
        const [before] = await runs(driver, "i");
        await change.apply(driver);
        const [after] = await runs(driver, "i");
        observed[change.name] = kept(before, after, 1000);
      }
      await driver.mount('<ocelle-status-indicator id="i" tone="success" pulse></ocelle-status-indicator>');
      await driver.seek("i", ring, 1000);
      const [before] = await runs(driver, "i");
      await driver.setAttribute("i", "pulse", null);
      await driver.setAttribute("i", "pulse", "");
      observed.twin = restarted(before, (await runs(driver, "i"))[0]);
      return observed;
    },
    expected: { ...Object.fromEntries(listedChanges.map((change) => [change.name, keptPaused])), twin: newRun },
  },
  {
    name: "US1-4 (b): an indicator removed and inserted again with pulse set starts a new run from near 0, while a state-preserving moveBefore() keeps the run under way, the same animation at the time it had or later, as the phase-1 spike measured (FR-012 (b) as amended; README rule (vii))",
    run: async (driver) => {
      await driver.mount('<div id="a"><ocelle-status-indicator id="i" pulse></ocelle-status-indicator></div><div id="b"></div><div id="c"></div>');
      await driver.advance("i", ring, 500);
      const [before] = await runs(driver, "i");
      await driver.moveBefore("i", "b");
      const [moved] = await runs(driver, "i");
      await driver.move("i", "c");
      const [inserted] = await runs(driver, "i");
      return { moveBefore: kept(before, moved, 500), reinserted: restarted(moved, inserted), shape: shape(inserted) };
    },
    expected: { moveBefore: keptRunning, reinserted: newRun, shape: oneRun },
  },
  {
    name: "US1-4 (d): with the hidden attribute or display: none on an ancestor the run is cancelled, and revealing it starts a new run from near 0 (FR-012 (d); the phase-1 spike)",
    run: async (driver) => {
      await driver.mount('<div id="p"><ocelle-status-indicator id="i" pulse></ocelle-status-indicator></div><div id="q"><ocelle-status-indicator id="j" pulse></ocelle-status-indicator></div>');
      await driver.advance("i", ring, 500);
      await driver.advance("j", ring, 500);
      const [hiddenBefore] = await runs(driver, "i");
      const [noneBefore] = await runs(driver, "j");
      await driver.setAttribute("p", "hidden", "");
      await driver.style("q", "display", "none");
      const whileHidden = { hidden: (await runs(driver, "i")).length, none: (await runs(driver, "j")).length };
      await driver.setAttribute("p", "hidden", null);
      await driver.style("q", "display", "");
      return { whileHidden, hidden: restarted(hiddenBefore, (await runs(driver, "i"))[0]), none: restarted(noneBefore, (await runs(driver, "j"))[0]) };
    },
    expected: { whileHidden: { hidden: 0, none: 0 }, hidden: newRun, none: newRun },
  },
  {
    name: "US1-4 (d): a <details> closed and opened is not a start case, as the phase-1 spike measured: a run goes on while it is closed and the same run shows on opening; a run that ends while closed leaves none on opening and the dot solid; beside a hidden twin, hidden and revealed, that starts a new run (FR-012 (d); README rule (viii); PLAN-FRESH-2-001 (b))",
    run: async (driver) => {
      await driver.mount(
        '<details id="d" open><summary>Short</summary><ocelle-status-indicator id="i" tone="danger" pulse></ocelle-status-indicator></details>' +
          '<details id="e" open><summary>Long</summary><ocelle-status-indicator id="j" tone="danger" pulse></ocelle-status-indicator></details>' +
          '<div id="p"><ocelle-status-indicator id="k" pulse></ocelle-status-indicator></div>',
      );
      await driver.advance("i", ring, 500);
      const [before] = await runs(driver, "i");
      await driver.setProperty("d", "open", false);
      await pause(300);
      const [closed] = await runs(driver, "i");
      await driver.setProperty("d", "open", true);
      const [opened] = await runs(driver, "i");
      await driver.setProperty("e", "open", false);
      await endRun(driver, "j");
      const endedClosed = (await runs(driver, "j")).filter((run) => run.playState !== "finished").length;
      await driver.setProperty("e", "open", true);
      const endedOpened = { runs: (await runs(driver, "j")).length, dot: await dotLook(driver, "j") };
      const [twinBefore] = await runs(driver, "k");
      await driver.setAttribute("p", "hidden", "");
      await driver.setAttribute("p", "hidden", null);
      return { closed: kept(before, closed, 800), opened: kept(before, opened, 800), endedClosed, endedOpened, twin: restarted(twinBefore, (await runs(driver, "k"))[0]) };
    },
    expected: { closed: keptRunning, opened: keptRunning, endedClosed: 0, endedOpened: { runs: 0, dot: solid("danger") }, twin: newRun },
  },
  {
    name: "US1-4 (d): an indicator connected, or given pulse, inside a closed <details> runs while it is closed and the same run shows on opening; one whose run ends while closed shows none on opening, as the phase-1 spike measured (FR-012 (d))",
    run: async (driver) => {
      await driver.mount(
        '<details id="d"><summary>Connected</summary><ocelle-status-indicator id="i" pulse></ocelle-status-indicator></details>' +
          '<details id="e"><summary>Ended</summary><ocelle-status-indicator id="j" pulse></ocelle-status-indicator></details>' +
          '<details id="f"><summary>Set</summary><ocelle-status-indicator id="k"></ocelle-status-indicator></details>',
      );
      const [connected] = await runs(driver, "i");
      const connectedClosed = { shape: shape(connected), nearZero: (connected?.currentTime ?? fresh) < fresh };
      await driver.setProperty("d", "open", true);
      const [connectedOpened] = await runs(driver, "i");
      await endRun(driver, "j");
      await driver.setProperty("e", "open", true);
      const endedOpened = (await runs(driver, "j")).length;
      await driver.setAttribute("k", "pulse", "");
      const [set] = await runs(driver, "k");
      const setClosed = shape(set);
      await driver.setProperty("f", "open", true);
      const [setOpened] = await runs(driver, "k");
      return { connectedClosed, connectedOpened: kept(connected, connectedOpened, 0), endedOpened, setClosed, setOpened: kept(set, setOpened, 0) };
    },
    expected: { connectedClosed: { shape: oneRun, nearZero: true }, connectedOpened: keptRunning, endedOpened: 0, setClosed: oneRun, setOpened: keptRunning },
  },
  {
    name: "US1-4: hidden=\"until-found\" on an ancestor is not a start case, as the phase-1 spike measured: the run goes on while hidden and the same run shows on reveal; a run that ends while hidden leaves none on reveal; beside a hidden twin that starts a new run (FR-012 (d) as amended; README rule (vii))",
    run: async (driver) => {
      await driver.mount(
        '<div id="p"><ocelle-status-indicator id="i" pulse></ocelle-status-indicator></div>' +
          '<div id="q"><ocelle-status-indicator id="j" pulse></ocelle-status-indicator></div>' +
          '<div id="r"><ocelle-status-indicator id="k" pulse></ocelle-status-indicator></div>',
      );
      await driver.advance("i", ring, 500);
      const [before] = await runs(driver, "i");
      await driver.setAttribute("p", "hidden", "until-found");
      await pause(300);
      const [whileHidden] = await runs(driver, "i");
      await driver.setAttribute("p", "hidden", null);
      const [revealed] = await runs(driver, "i");
      await driver.setAttribute("q", "hidden", "until-found");
      await endRun(driver, "j");
      const endedHidden = (await runs(driver, "j")).filter((run) => run.playState !== "finished").length;
      await driver.setAttribute("q", "hidden", null);
      const endedRevealed = (await runs(driver, "j")).length;
      const [twinBefore] = await runs(driver, "k");
      await driver.setAttribute("r", "hidden", "");
      await driver.setAttribute("r", "hidden", null);
      return { whileHidden: kept(before, whileHidden, 800), revealed: kept(before, revealed, 800), endedHidden, endedRevealed, twin: restarted(twinBefore, (await runs(driver, "k"))[0]) };
    },
    expected: { whileHidden: keptRunning, revealed: keptRunning, endedHidden: 0, endedRevealed: 0, twin: newRun },
  },
  {
    name: "US1-4 (c), US1-5: under prefers-reduced-motion: reduce no animation runs and the dot is solid; reduce set during a run stops it at once; the change back to no preference starts one new run from near 0 (FR-012 (c), FR-013)",
    run: async (driver) => {
      await driver.mount('<ocelle-status-indicator id="i" tone="info" pulse></ocelle-status-indicator><ocelle-status-indicator id="j" tone="info" pulse></ocelle-status-indicator>');
      const [before] = await runs(driver, "j");
      await driver.reducedMotion("reduce");
      const reduced = { runs: (await runs(driver, "i")).length, stopped: (await runs(driver, "j")).length, dot: await dotLook(driver, "i") };
      await driver.setAttribute("i", "pulse", null);
      await driver.setAttribute("i", "pulse", "");
      const setUnderReduce = (await runs(driver, "i")).length;
      await driver.reducedMotion("no-preference");
      const after = await runs(driver, "j");
      return { reduced, setUnderReduce, resumed: restarted(before, after[0]), shape: after.map(shape) };
    },
    expected: { reduced: { runs: 0, stopped: 0, dot: solid("info") }, setUnderReduce: 0, resumed: newRun, shape: [oneRun] },
  },
  {
    name: "US1-5: the element's own rule stops the pulse under reduce, not only the token: with a host rule restoring --ocelle-motion-pulse: 1600ms no animation runs on the ring under reduce, beside its twin under no preference with the same rule, which runs one run (FR-013; R-04; plant: the element's animation: none removed)",
    run: async (driver) => {
      await driver.reducedMotion("reduce");
      await driver.mount('<ocelle-status-indicator id="i" pulse></ocelle-status-indicator>');
      await driver.rules("ocelle-status-indicator { --ocelle-motion-pulse: 1600ms; }");
      await driver.setAttribute("i", "pulse", null);
      await driver.setAttribute("i", "pulse", "");
      const reduced = (await runs(driver, "i")).map(shape);
      await driver.reducedMotion("no-preference");
      await driver.mount('<ocelle-status-indicator id="i" pulse></ocelle-status-indicator>');
      await driver.rules("ocelle-status-indicator { --ocelle-motion-pulse: 1600ms; }");
      await driver.setAttribute("i", "pulse", null);
      await driver.setAttribute("i", "pulse", "");
      return { reduced, twin: (await runs(driver, "i")).map(shape) };
    },
    expected: { reduced: [], twin: [oneRun] },
  },
  ...(["light", "dark"] as const).map(
    (palette): Scenario => ({
      name: `US1-6: in forced colours (${palette} palette) the dot of every tone is drawn in CanvasText, solid and 8 px, not the system background Canvas (FR-015)`,
      run: async (driver) => {
        await driver.mount(tones.map((tone) => `<ocelle-status-indicator id="${tone}" tone="${tone}" pulse></ocelle-status-indicator>`).join(""));
        await driver.forcedColors("active", palette);
        const canvasText = await driver.resolveColour("CanvasText");
        const canvas = await driver.resolveColour("Canvas");
        const observed: Record<string, unknown> = {};
        for (const tone of tones) {
          const look = await dotLook(driver, tone);
          observed[tone] = { ...look, fill: look.fill === canvasText ? "CanvasText" : look.fill, visible: look.fill !== canvas };
        }
        return observed;
      },
      expected: Object.fromEntries(tones.map((tone) => [tone, { width: dotSize, height: dotSize, opacity: "1", fill: "CanvasText", visible: true }])),
    }),
  ),
  {
    name: "US1-7: an unknown, miscased or empty tone stays in the attribute as written, the property reads neutral and the dot looks exactly like neutral, with no error; setting the property writes the attribute as given, beside a known tone that draws its own colour (FR-002, FR-010; Edge Cases)",
    run: async (driver) => {
      await driver.mount(
        '<ocelle-status-indicator id="bogus" tone="bogus"></ocelle-status-indicator><ocelle-status-indicator id="cased" tone="Success"></ocelle-status-indicator>' +
          '<ocelle-status-indicator id="empty" tone=""></ocelle-status-indicator><ocelle-status-indicator id="known" tone="warning"></ocelle-status-indicator>',
      );
      const read = async (id: string): Promise<unknown> => ({ attribute: await driver.attribute(id, "tone"), property: await driver.property(id, "tone"), dot: await dotLook(driver, id) });
      const attributes = { bogus: await read("bogus"), cased: await read("cased"), empty: await read("empty"), known: await read("known") };
      await driver.setProperty("known", "tone", "danger");
      const setKnown = await read("known");
      await driver.setProperty("known", "tone", "nope");
      const setUnknown = await read("known");
      return { attributes, setKnown, setUnknown, messages: await driver.messages() };
    },
    expected: {
      attributes: {
        bogus: { attribute: "bogus", property: "neutral", dot: solid("neutral") },
        cased: { attribute: "Success", property: "neutral", dot: solid("neutral") },
        empty: { attribute: "", property: "neutral", dot: solid("neutral") },
        known: { attribute: "warning", property: "warning", dot: solid("warning") },
      },
      setKnown: { attribute: "danger", property: "danger", dot: solid("danger") },
      setUnknown: { attribute: "nope", property: "neutral", dot: solid("neutral") },
      messages: [],
    },
  },
  {
    name: "US1-8: a host aria-label, present or blank, with and without label, is not read: Chromium's tree shows what the phase-1 spike measured on a stand-in (a present aria-label renames the image, a blank one leaves it unnamed, an unlabelled indicator stays hidden), and with the aria-label removed each equals its twin without one (FR-014; README rule (ii); plant: the element reads aria-label)",
    run: async (driver) => {
      await driver.mount(
        '<ocelle-status-indicator id="labelled-present" label="Online" aria-label="Busy"></ocelle-status-indicator>' +
          '<ocelle-status-indicator id="labelled-blank" label="Online" aria-label=""></ocelle-status-indicator>' +
          '<ocelle-status-indicator id="unlabelled-present" aria-label="Busy"></ocelle-status-indicator>' +
          '<ocelle-status-indicator id="unlabelled-blank" aria-label=""></ocelle-status-indicator>' +
          '<ocelle-status-indicator id="labelled" label="Online"></ocelle-status-indicator>' +
          '<ocelle-status-indicator id="unlabelled"></ocelle-status-indicator>',
      );
      const ids = ["labelled-present", "labelled-blank", "unlabelled-present", "unlabelled-blank", "labelled", "unlabelled"];
      const withAttribute: Record<string, unknown> = {};
      for (const id of ids) withAttribute[id] = await driver.ax(id);
      await driver.setAttribute("unlabelled", "aria-label", "Later");
      const setLater = await driver.ax("unlabelled");
      await driver.setAttribute("unlabelled", "aria-label", null);
      const removed: Record<string, unknown> = {};
      for (const id of ids.slice(0, 4)) {
        await driver.setAttribute(id, "aria-label", null);
        removed[id] = await driver.ax(id);
      }
      return { withAttribute, setLater, removed };
    },
    expected: {
      withAttribute: {
        "labelled-present": [{ role: "image", name: "Busy" }],
        "labelled-blank": [{ role: "image", name: "" }],
        "unlabelled-present": [],
        "unlabelled-blank": [],
        labelled: [{ role: "image", name: "Online" }],
        unlabelled: [],
      },
      setLater: [],
      removed: {
        "labelled-present": [{ role: "image", name: "Online" }],
        "labelled-blank": [{ role: "image", name: "Online" }],
        "unlabelled-present": [],
        "unlabelled-blank": [],
      },
    },
  },
  {
    name: "Edge cases: a host hidden attribute removes the indicator's box, beside its visible twin; pulse on a neutral indicator runs; the indicator sets no aria-busy and no live region (FR-016; plant: :host([hidden]) removed)",
    run: async (driver) => {
      await driver.mount('<ocelle-status-indicator id="gone" hidden pulse></ocelle-status-indicator><ocelle-status-indicator id="shown" tone="neutral" pulse></ocelle-status-indicator>');
      const box = (value: Box): unknown => ({ width: value.width, height: value.height, display: value.display });
      return {
        gone: box(await driver.box("gone")),
        shown: box(await driver.box("shown")),
        neutralRuns: (await runs(driver, "shown")).map(shape),
        busy: await driver.attribute("shown", "aria-busy"),
        live: await driver.attribute("shown", "aria-live"),
        shownTree: await driver.ax("shown"),
      };
    },
    expected: { gone: { width: 0, height: 0, display: "none" }, shown: { width: dotSize, height: dotSize, display: "inline-block" }, neutralRuns: [oneRun], busy: null, live: null, shownTree: [] },
  },
  {
    name: "Right to left: under dir=\"rtl\" the dot keeps its size and the ring grows centred on it (Edge Cases)",
    run: async (driver) => {
      await driver.mount('<p id="line">Running <ocelle-status-indicator id="i" tone="success" pulse></ocelle-status-indicator></p>');
      await driver.rules("#line ocelle-status-indicator { margin-inline: 8px; }");
      await driver.dir("line", "rtl");
      await driver.seek("i", ring, 800);
      const geometry = around(await driver.box("i", ring), await driver.box("i", dot));
      return { dot: await dotLook(driver, "i"), grown: geometry.width > dotSize && geometry.width <= dotSize + 2 * reach, centred: geometry.offset };
    },
    expected: { dot: solid("success"), grown: true, centred: [0, 0] },
  },
];
