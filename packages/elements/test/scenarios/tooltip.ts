// User Story 3's browser scenarios for `ocelle-tooltip` (008 spec US3 scenarios 1 to 15; FR-029 to FR-037, FR-047;
// contracts/checks.md § Tooltip, every row but the touch rows and "No Popover API"; tasks.md T041). Run in process on
// the element source (test/tooltip.test.ts) and on the built browser build on the strict-CSP fixture
// (test/browser/tooltip.test.ts). The touch rows are scenarios/tooltip.ts's `tooltipTouchScenarios`, run in the touch
// contexts (test/tooltip.touch.test.ts, test/browser/tooltip.touch.test.ts); "No Popover API" runs in process only
// (test/tooltip-no-popover.test.ts).
//
// Expected values are written by hand from the spec, research and the matrix: token values as the computed styles of
// `packages/tokens/src/source.ts` (light unless a row sets the theme), the test delay of fixtures/tooltip-delay.css
// (300 ms, R-15), geometry from R-11 (the bubble part's transparent `space-2` padding on the trigger's side, the gutter
// `gutter`, 16 px, for the flip and the clamp).
//
// The rules of scenarios/dialog.ts hold for every body: it ends with FR-047's counts as a delta from mount; every wait
// is a bounded pause or poll of at most 1 000 ms (R-15); a "does not" outcome shares its body with the positive outcome
// it guards; no body uses `driver.style()` (R-14).
//
// Timing is read in the page: the stand-in `ocelle-test-tip` (`defineTooltipStandIns`) samples, at every animation
// frame from its `track` command on, which tracked tooltips have their bubble `:popover-open` and how many animations
// run on the bubble part and its painted box; frame times are relative to the first `pointerover` from outside a
// tracked tooltip (its first entry), or to the `track` command when there was none. So "not shown at 150 ms" and
// "shown by 450 ms" hold whatever the latency of the harness. A row whose outcome needs the pointer to act before the
// delay (leave, move inside the tooltip, or click) reads when it really did, in the page, and is judged only on a run
// in which that came before the test delay, or before the shorter bound the row needs (`beforeDelay`). Names: the
// tooltip `tip` (and `tip2`), its trigger `trg` (and `trg2`), `before` a page button before the trigger in tree order,
// the bubble part `tip[div]` in `topLayer()`; the bubble part is `[part="bubble"]` and its painted box the part's only
// element child, `[part="bubble"] > *`.
import type { Driver, RecordedEvent } from "./driver.ts";
import { act, events, inspect, pause, row, sheetDark, state } from "./dialog.ts";
import type { DialogScenario, Inspected } from "./dialog.ts";

export { defineDialogStandIns } from "./dialog.ts";

/** A shared body of the tooltip, its expected observation and the name it runs under. */
export type TooltipScenario = DialogScenario;

/** A command of the stand-in `ocelle-test-tip` (see `defineTooltipStandIns`). */
export type TipCommand =
  | { readonly op: "track"; readonly ids: readonly string[] }
  | { readonly op: "frames" }
  | { readonly op: "over"; readonly id: string; readonly pointerType: string }
  | { readonly op: "keys"; readonly id?: string }
  | { readonly op: "keylog" }
  | { readonly op: "scroll"; readonly id: string; readonly inner?: string; readonly top: number }
  | { readonly op: "insert"; readonly id: string; readonly markup: string; readonly first: boolean }
  | { readonly op: "move"; readonly id: string; readonly to: string }
  | { readonly op: "describedBy"; readonly tip: string; readonly trigger: string }
  | { readonly op: "children"; readonly id: string; readonly markup: string }
  | { readonly op: "removeSpans"; readonly id: string }
  | { readonly op: "watchModal"; readonly id: string }
  | { readonly op: "modalLog" }
  | { readonly op: "keep"; readonly id: string }
  | { readonly op: "kept"; readonly id: string; readonly name: string };

/** One sample of `track`: its time in milliseconds, the tracked tooltips whose bubble is shown, the animations. */
export interface Frame {
  readonly t: number;
  readonly open: readonly string[];
  readonly animations: number;
}

/** What `frames` returns: the first entry's time after `track` (null without one), the samples, the same-task flag. */
export interface Frames {
  readonly t0: number | null;
  readonly frames: readonly Frame[];
  /** Whether the tracked bubble was shown when the first `pointerover` into it reached the window, or null. */
  readonly sameTask: boolean | null;
  /**
   * In that same task, the gap between the trigger's block start and the painted box's block end (8 px for a bubble
   * placed on top), rounded to 1/10 px, or null when the bubble was not shown then.
   */
  readonly sameTaskGap: number | null;
  /**
   * When the pointer first left the tracked tooltip after the first entry (a `pointerout` from it to a node outside
   * it, which ends the delay, R-12), in milliseconds from the entry, or null without an entry or a leave.
   */
  readonly left: number | null;
  /**
   * When the pointer last moved inside the tracked tooltip after the first entry and before the leave (a
   * `pointerover` whose `relatedTarget` is inside it, e.g. from the trigger onto its inner span), in milliseconds from
   * the entry, or null without such a move.
   */
  readonly moved: number | null;
  /**
   * When the first `click` inside the tracked tooltip after the first entry reached the window (capture phase, before
   * the trigger's own listeners), in milliseconds from the entry, or null without an entry or a click. A pointer click
   * that enters the trigger is its own entry: the `pointerover` of its move comes first.
   */
  readonly clicked: number | null;
}

/** What `describedBy` reads: the trigger's `aria-describedby` and the tooltip host's description spans. */
export interface Described {
  readonly attribute: string | null;
  readonly spans: readonly { readonly id: string; readonly role: string | null; readonly hidden: boolean; readonly slot: string | null; readonly text: string; readonly children: number; readonly sameId: number }[];
}

/**
 * Defines the stand-in `ocelle-test-tip` in the page that calls it. Self-contained (the fixture passes it to
 * `page.evaluate`), so it uses nothing from outside its own body, and defines nothing twice. Like `ocelle-test-act`,
 * it runs the command (JSON, `TipCommand`) set as its `do` attribute and writes `{ "result": … }` or
 * `{ "error": "…" }` to its `data-result` attribute:
 * - `track`: starts sampling, at once and then at every animation frame, which of the tooltips `ids` show their bubble
 *   and the number of animations on their bubble parts and painted boxes, and records the times of the first entry,
 *   of the last move inside the tooltip, of the first leave and of the first click (which also takes a sample, so a
 *   bubble shown by the click's focus is seen at the click's own time); `frames` stops it and returns the samples and
 *   times;
 * - `over`: a synthetic bubbling, composed `pointerover` of `pointerType` on the element `id`;
 * - `keys`: starts recording the `keydown` events that reach the document (capture and bubble phase) and the element
 *   `id` when given; `keylog` returns them and stops;
 * - `scroll`: sets `scrollTop` of the element `id` (or of `inner` in its shadow root);
 * - `insert`: parses `markup` into the element `id`, as its first or last children; `move`: appends `id` to `to`;
 *   `children`: replaces the children of `id` with `markup`; `removeSpans` removes the description spans among the
 *   children of the tooltip `id` (as a host re-render would) and returns how many; `watchModal` records, at each
 *   synchronous `beforetoggle` to open in the shadow root of the overlay `id` (its `<dialog>` about to be shown), whether
 *   any tooltip bubble of the page is shown at that moment, and `modalLog` returns those records; `keep` holds the element `id`, so `kept` reads its
 *   attribute `name` after it left the document;
 * - `describedBy`: the trigger's `aria-describedby`, and each `span[slot="description"]` child of the tooltip host with
 *   its id, role, `hidden`, slot, text, element children and how many elements of the trigger's root have its id.
 */
export function defineTooltipStandIns(): void {
  if (customElements.get("ocelle-test-tip") !== undefined) return;
  type Command = Record<string, unknown> & { op: string };
  interface Sample {
    t: number;
    open: string[];
    animations: number;
  }
  let tracked: string[] = [];
  let samples: Sample[] = [];
  let start = 0;
  let entry: number | null = null;
  let sameTask: boolean | null = null;
  let sameTaskGap: number | null = null;
  let left: number | null = null;
  let moved: number | null = null;
  let clicked: number | null = null;
  let sampling = false;
  let generation = 0;
  let recording = false;
  const keys: string[] = [];
  const bubbleOf = (id: string): Element | null => document.getElementById(id)?.shadowRoot?.querySelector('[part="bubble"]') ?? null;
  const isOpen = (id: string): boolean => bubbleOf(id)?.matches(":popover-open") === true;
  const animationsOf = (id: string): number => {
    const bubble = bubbleOf(id);
    return bubble === null ? 0 : [bubble, ...bubble.children].reduce((sum, each) => sum + each.getAnimations().length, 0);
  };
  const inside = (node: EventTarget | null, host: Element): boolean => node instanceof Node && (node === host || host.contains(node) || host.shadowRoot?.contains(node) === true);
  const hostOf = (event: Event): string | undefined =>
    tracked.find((id) => {
      const host = document.getElementById(id);
      return host !== null && event.composedPath().includes(host);
    });
  window.addEventListener(
    "pointerover",
    (event) => {
      const id = hostOf(event);
      const host = id === undefined ? null : document.getElementById(id);
      if (host === null) return;
      if (entry === null && !inside(event.relatedTarget, host)) entry = performance.now();
      else if (entry !== null && left === null && inside(event.relatedTarget, host)) moved = performance.now();
    },
    true,
  );
  window.addEventListener(
    "pointerout",
    (event) => {
      const id = hostOf(event);
      const host = id === undefined ? null : document.getElementById(id);
      if (host !== null && entry !== null && left === null && !inside(event.relatedTarget, host)) left = performance.now();
    },
    true,
  );
  window.addEventListener(
    "click",
    (event) => {
      if (entry === null || clicked !== null || hostOf(event) === undefined) return;
      clicked = performance.now();
      if (sampling) samples.push({ t: clicked, open: tracked.filter(isOpen), animations: tracked.reduce((sum, id) => sum + animationsOf(id), 0) });
    },
    true,
  );
  window.addEventListener("pointerover", (event) => {
    const id = hostOf(event);
    if (sameTask !== null || id === undefined) return;
    sameTask = isOpen(id);
    const host = document.getElementById(id);
    const box = bubbleOf(id)?.firstElementChild?.getBoundingClientRect();
    const trigger = host?.firstElementChild?.getBoundingClientRect();
    sameTaskGap = sameTask && box !== undefined && trigger !== undefined ? Math.round((trigger.top - box.bottom) * 10) / 10 : null;
  });
  const record = (where: string) => (event: Event) => {
    if (recording) keys.push(`${where}:${(event as KeyboardEvent).key}`);
  };
  document.addEventListener("keydown", record("document-capture"), true);
  document.addEventListener("keydown", record("document"));
  const sample = (current: number): void => {
    if (current !== generation) return;
    samples.push({ t: performance.now(), open: tracked.filter(isOpen), animations: tracked.reduce((sum, id) => sum + animationsOf(id), 0) });
    requestAnimationFrame(() => {
      sample(current);
    });
  };
  const byId = (id: string): HTMLElement => {
    const found = document.getElementById(id);
    if (found === null) throw new Error(`no #${id}`);
    return found;
  };
  const held = new Map<string, Element>();
  const modal: boolean[] = [];
  const parse = (markup: string): Node[] => {
    const template = document.createElement("template");
    template.innerHTML = markup;
    return [...template.content.childNodes];
  };
  const run = (command: Command): unknown => {
    switch (command.op) {
      case "track":
        tracked = [...(command.ids as string[])];
        samples = [];
        entry = null;
        sameTask = null;
        sameTaskGap = null;
        left = null;
        moved = null;
        clicked = null;
        sampling = true;
        start = performance.now();
        generation += 1;
        sample(generation);
        return null;
      case "frames": {
        generation += 1;
        sampling = false;
        const origin = entry ?? start;
        const fromEntry = (time: number | null): number | null => (entry === null || time === null ? null : Math.round((time - entry) * 10) / 10);
        return { t0: entry === null ? null : entry - start, frames: samples.map((each) => ({ ...each, t: Math.round((each.t - origin) * 10) / 10 })), sameTask, sameTaskGap, left: fromEntry(left), moved: fromEntry(moved), clicked: fromEntry(clicked) };
      }
      case "over":
        return byId(String(command.id)).dispatchEvent(new PointerEvent("pointerover", { bubbles: true, composed: true, pointerType: String(command.pointerType), isPrimary: true }));
      case "keys": {
        keys.length = 0;
        recording = true;
        if (typeof command.id === "string") byId(command.id).addEventListener("keydown", record(command.id));
        return null;
      }
      case "keylog":
        recording = false;
        return keys.splice(0);
      case "scroll": {
        const host = byId(String(command.id));
        const element = typeof command.inner === "string" ? host.shadowRoot?.querySelector(command.inner) : host;
        if (element === null || element === undefined) throw new Error(`no ${String(command.inner)} in #${String(command.id)}`);
        element.scrollTop = Number(command.top);
        return element.scrollTop;
      }
      case "insert": {
        const nodes = parse(String(command.markup));
        if (command.first === true) byId(String(command.id)).prepend(...nodes);
        else byId(String(command.id)).append(...nodes);
        return null;
      }
      case "move":
        byId(String(command.to)).append(byId(String(command.id)));
        return null;
      case "children":
        byId(String(command.id)).replaceChildren(...parse(String(command.markup)));
        return null;
      case "watchModal":
        byId(String(command.id)).shadowRoot?.addEventListener(
          "beforetoggle",
          (event) => {
            if ((event as ToggleEvent).newState === "open") modal.push([...document.querySelectorAll("ocelle-tooltip")].some((each) => each.shadowRoot?.querySelector('[part="bubble"]')?.matches(":popover-open") === true));
          },
          true,
        );
        return null;
      case "modalLog":
        return modal.splice(0);
      case "removeSpans": {
        const spans = [...byId(String(command.id)).children].filter((child) => child.localName === "span" && child.getAttribute("slot") === "description");
        for (const each of spans) each.remove();
        return spans.length;
      }
      case "keep":
        held.set(String(command.id), byId(String(command.id)));
        return null;
      case "kept":
        return held.get(String(command.id))?.getAttribute(String(command.name)) ?? null;
      case "describedBy": {
        const trigger = byId(String(command.trigger));
        const root = trigger.getRootNode() as Document | ShadowRoot;
        const spans = [...byId(String(command.tip)).children].filter((child) => child.localName === "span" && child.getAttribute("slot") === "description");
        return {
          attribute: trigger.getAttribute("aria-describedby"),
          spans: spans.map((span) => ({
            id: span.id,
            role: span.getAttribute("role"),
            hidden: span.hasAttribute("hidden"),
            slot: span.getAttribute("slot"),
            text: span.textContent,
            children: span.children.length,
            sameId: span.id === "" ? 0 : root.querySelectorAll(`[id="${span.id}"]`).length,
          })),
        };
      }
      default:
        throw new Error(`unknown command ${command.op}`);
    }
  };
  customElements.define(
    "ocelle-test-tip",
    class extends HTMLElement {
      static get observedAttributes(): string[] {
        return ["do"];
      }

      attributeChangedCallback(_name: string, _old: string | null, value: string | null): void {
        if (value === null) return;
        try {
          this.setAttribute("data-result", JSON.stringify({ result: run(JSON.parse(value) as Command) ?? null }));
        } catch (error) {
          this.setAttribute("data-result", JSON.stringify({ error: String(error) }));
        }
      }
    },
  );
}

// Helpers ------------------------------------------------------------------------------------------------------------

/** Runs a command of `ocelle-test-tip` and returns its result; a command that failed throws its message. */
export async function tip(driver: Driver, command: TipCommand): Promise<unknown> {
  await driver.setAttribute("tt", "do", JSON.stringify(command));
  const text = await driver.attribute("tt", "data-result");
  const parsed = JSON.parse(text ?? '{"error":"no result"}') as { result?: unknown; error?: string };
  if (parsed.error !== undefined) throw new Error(`stand-in command ${command.op}: ${parsed.error}`);
  return parsed.result;
}

export const track = (driver: Driver, ids: readonly string[] = ["tip"]): Promise<unknown> => tip(driver, { op: "track", ids });
export const frames = async (driver: Driver): Promise<Frames> => (await tip(driver, { op: "frames" })) as Frames;

/** The stand-ins every page holds after its content. */
export const standIns = '<ocelle-test-act id="act"></ocelle-test-act><ocelle-test-tip id="tt"></ocelle-test-tip>';

/** Where the pointer rests outside every box of the pages: the viewport's bottom-left corner. */
export const rest = { x: 4, y: 796 } as const;

/**
 * The stage of the pages: no body margin, the content centred in the 1280 × 800 viewport, the page button `before`
 * in the top-left corner (before the trigger in tree order, out of the centred flow) and an overlay page's `opener`
 * below it.
 */
export const stage = "body { margin: 0; } #stage { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; gap: 2rem; pointer-events: none; } #stage * { pointer-events: auto; } #before { position: fixed; left: 8px; top: 8px; } #opener { position: fixed; left: 8px; top: 48px; }";

/** A named button trigger, its name "Projects". */
export const button = '<button id="trg" aria-label="Projects">P</button>';

interface PageOptions {
  readonly text?: string;
  readonly attrs?: string;
  readonly trigger?: string;
  readonly stageAttrs?: string;
  readonly after?: string;
}

/** A page: `before`, the stage holding the tooltip `tip` around `trigger` (and `after`), the stand-ins. */
export function page(options: PageOptions = {}): string {
  return `<button id="before">Before</button><div id="stage"${options.stageAttrs ?? ""}><ocelle-tooltip id="tip" text="${options.text ?? "Projects"}"${options.attrs ?? ""}>${options.trigger ?? button}</ocelle-tooltip>${options.after ?? ""}</div>${standIns}`;
}

/** Rests the pointer outside every box, mounts `markup` and adds the stage rules and `rules`. */
export async function start(driver: Driver, markup: string, rules = ""): Promise<void> {
  await driver.pointer([rest]);
  await driver.mount(markup);
  await driver.rules(`${stage} ${rules}`);
}

/** Focuses `before` by script, then Tab: keyboard focus arrives on the next stop with `:focus-visible`. */
export async function tabFrom(driver: Driver, from = "before"): Promise<void> {
  await act(driver, { op: "focus", id: from });
  await driver.press("Tab");
}

const bubblePart = '[part="bubble"]';
const painted = '[part="bubble"] > *';

/** Whether the bubble of the tooltip `id` is `:popover-open`. */
export const bubbleOpen = async (driver: Driver, id = "tip"): Promise<boolean> => (await inspect(driver, id, bubblePart)).popoverOpen;

/** The tooltips of `f` whose bubble shows, by time. */
const openTimes = (f: Frames, id = "tip"): number[] => f.frames.filter((each) => each.open.includes(id)).map((each) => each.t);

/** The hover delay as the matrix states it (test delay 300 ms): shown at no frame before 150 ms, shown by 450 ms. */
export function delay(f: Frames, id = "tip"): { readonly entered: boolean; readonly before150: boolean; readonly by450: boolean } {
  const times = openTimes(f, id);
  return { entered: f.t0 !== null, before150: times.some((t) => t < 150), by450: times.some((t) => t <= 450) };
}
export const delayed = { entered: true, before150: false, by450: true };

/** Persistence (FR-032): from the first frame that shows the bubble, every frame shows it, over at least 900 ms. */
export function persisted(f: Frames, id = "tip"): boolean {
  const first = f.frames.findIndex((each) => each.open.includes(id));
  const from = f.frames.slice(first);
  return first >= 0 && from.every((each) => each.open.includes(id)) && (from.at(-1)?.t ?? 0) - (from[0]?.t ?? 0) >= 900;
}

/** Whether the bubble of `id` shows at no frame of `f`, and `f` holds frames over at least `span` ms. */
export function never(f: Frames, span: number, id = "tip"): boolean {
  const first = f.frames[0]?.t ?? 0;
  return f.frames.every((each) => !each.open.includes(id)) && (f.frames.at(-1)?.t ?? 0) - first >= span;
}

/** The test delay of fixtures/tooltip-delay.css (R-15), and how many runs a row timed against it may take. */
const testDelay = 300;
const tries = 3;
/** The text-field row's bound: its click must come this soon after the entry for "shown before 150 ms" to be judged. */
const early = 150;
/**
 * The R-12 leave row's own hover delay, set as `--ocelle-tooltip-delay` on its tooltip (operator decision after
 * tdd-check 4: under load its leave came after the 300 ms test delay), and its wait from the entry: 1.5 times that
 * delay, as 450 ms is for the test delay, so a delay the leave did not end would show the bubble inside the window.
 */
const longDelay = 1000;
const longWait = 1500;

/**
 * For a row whose outcome holds only when the pointer acted before the hover delay (or before `bound`, a shorter time
 * the row's outcome needs): runs `attempt`, which mounts its page, acts and returns its observation with `at`, the
 * page-side time of that act in milliseconds from the first entry (`Frames.left`, `Frames.moved` or
 * `Frames.clicked`). A run in which it came before `bound` is judged: its observation is returned. One in which it
 * came at or after `bound` judges nothing (the bubble may rightly show, or not yet show, by then), so the body runs
 * again, at most `tries` times in all; then the row fails with the measured times, never passing without a judged
 * run. A run in which the page recorded no such time fails at once.
 */
export async function beforeDelay(what: string, attempt: () => Promise<{ readonly at: number | null; readonly observed: Record<string, unknown> }>, bound = testDelay): Promise<Record<string, unknown>> {
  const late: number[] = [];
  for (let run = 0; run < tries; run += 1) {
    const { at, observed } = await attempt();
    if (at === null) throw new Error(`${what}: the page recorded no time for it after the entry`);
    if (at < bound) return observed;
    late.push(at);
  }
  const limit = bound === testDelay ? `the ${String(testDelay)} ms test delay` : `${String(bound)} ms from the entry`;
  throw new Error(`${what} came at or after ${limit} in each of ${String(tries)} runs (${late.join(", ")} ms from the entry): the row has no run it can judge`);
}

/** A coordinate, or 0 where an absent element gave none, so a pointer move to it is still a valid one. */
const finite = (value: number): number => (Number.isFinite(value) ? value : 0);

/** The centre of a box. */
const centre = (box: Inspected): { readonly x: number; readonly y: number } => ({ x: finite(box.left + box.width / 2), y: finite(box.top + box.height / 2) });

/**
 * Where the painted box lies against the trigger (R-11): the side whose gap is `space-2` (8 px, within 0.5 px) with
 * the painted box centred on the trigger's cross axis (within 0.5 px), or `none`.
 */
export function relation(trigger: Inspected, box: Inspected): string {
  const near = (a: number, b: number): boolean => Math.abs(a - b) < 0.5;
  const centredX = near(box.left + box.width / 2, trigger.left + trigger.width / 2);
  const centredY = near(box.top + box.height / 2, trigger.top + trigger.height / 2);
  if (near(trigger.top - box.bottom, 8) && centredX) return "above";
  if (near(box.top - trigger.bottom, 8) && centredX) return "below";
  if (near(trigger.left - box.right, 8) && centredY) return "left";
  if (near(box.left - trigger.right, 8) && centredY) return "right";
  return `none (trigger ${JSON.stringify([trigger.left, trigger.top, trigger.right, trigger.bottom])}, box ${JSON.stringify([box.left, box.top, box.right, box.bottom])})`;
}

/** The trigger's and the painted box's boxes, and where the box lies against the trigger. */
async function placed(driver: Driver, trigger = "trg", id = "tip"): Promise<string> {
  return relation(await inspect(driver, trigger), await inspect(driver, id, painted));
}

/** Whether `box` lies wholly inside the viewport `width` × `height`. */
const onScreen = (box: Inspected, width = 1280, height = 800): boolean => box.width > 0 && box.left >= 0 && box.top >= 0 && box.right <= width && box.bottom <= height;

/** The element hit at the centre and at the four corners (1 px inside) of `box`, by id or local name. */
async function hits(driver: Driver, box: Inspected): Promise<unknown[]> {
  const points = [centre(box), { x: box.left + 1, y: box.top + 1 }, { x: box.right - 1, y: box.top + 1 }, { x: box.left + 1, y: box.bottom - 1 }, { x: box.right - 1, y: box.bottom - 1 }];
  const found: unknown[] = [];
  for (const point of points) found.push(await act(driver, { op: "hit", ...point }));
  return found;
}

const tipLayer = { element: "tip[div]", modal: false, popoverOpen: true };
const dialogLayer = { element: "dlg[dialog]", modal: true, popoverOpen: false };

/** Token values (packages/tokens/src/source.ts) as computed styles. */
const chromeLight = "rgb(21, 19, 15)";
const chromeDark = "rgb(13, 12, 10)";
const chromeInk = "rgb(237, 233, 225)";
const transparent = "rgba(0, 0, 0, 0)";
/** `--ocelle-tooltip-max-inline`, 18rem at a 16 px root. */
const maxInline = 288;
/** `--ocelle-gutter` (`space-4`, 1rem) at a 16 px root. */
const gutter = 16;

// Hover delay, keyboard focus and persistence (US3-1, US3-3, FR-031, FR-032, R-12, R-15) --------------------------------

const showRows = [
  row(
    "Hover delay (US3-1, FR-031, R-15): the pointer resting on the trigger with the test delay of 300 ms: not shown at any frame before 150 ms, shown by 450 ms from the first entry; persistence (a) (US3-3, FR-032): then shown at every frame of a 900 ms wait, the bubble in the top layer, focus nowhere",
    async (driver) => {
      await start(driver, page());
      await track(driver);
      await driver.hover("trg");
      await pause(450);
      await pause(950);
      const f = await frames(driver);
      return { delay: delay(f), persisted: persisted(f), layer: await driver.topLayer(), focus: await driver.focusPath() };
    },
    { delay: delayed, persisted: true, layer: [tipLayer], focus: "body" },
  ),
  row(
    "Hover delay, moves inside the tooltip before the delay (R-12's delay rule, the matrix's re-entry): the pointer enters the trigger, moves onto its inner span and back onto the trigger's edge, both moves before the delay: the timer is not restarted, not shown before the 300 ms delay from the first entry, shown before 300 ms from the move back and by 450 ms",
    async (driver) =>
      beforeDelay("the move back onto the trigger", async () => {
        await start(driver, page({ trigger: '<button id="trg" aria-label="Projects">Edge <span id="inner">inner text</span> edge</button>' }));
        const trigger = await inspect(driver, "trg");
        const inner = await inspect(driver, "inner");
        const edge = { x: trigger.left + 4, y: trigger.top + trigger.height / 2 };
        await track(driver);
        await driver.pointer([edge]);
        await driver.pointer([centre(inner)]);
        await driver.pointer([edge]);
        await pause(450);
        const f = await frames(driver);
        const back = f.moved ?? 0;
        const shown = openTimes(f);
        return {
          at: f.moved,
          observed: { entered: f.t0 !== null, beforeDelay: shown.some((t) => t < testDelay), beforeRestart: shown.some((t) => t < back + testDelay), by450: shown.some((t) => t <= 450) },
        };
      }),
    { entered: true, beforeDelay: false, beforeRestart: true, by450: true },
  ),
  row(
    "Hover delay under reduced motion (US3-8, R-09, R-15): with prefers-reduced-motion: reduce the delay is not zeroed: not shown before 150 ms, shown by 450 ms",
    async (driver) => {
      await start(driver, page());
      await driver.reducedMotion(true);
      try {
        await track(driver);
        await driver.hover("trg");
        await pause(450);
        return { reduced: (await driver.device()).reducedMotion, delay: delay(await frames(driver)) };
      } finally {
        await driver.reducedMotion(false);
      }
    },
    { reduced: true, delay: delayed },
  ),
  row(
    "Hover delay 0 (R-12, R-15): --ocelle-tooltip-delay: 0ms on the tooltip: the bubble is shown in the same task as the pointerover that enters the trigger",
    async (driver) => {
      await start(driver, page(), "#tip { --ocelle-tooltip-delay: 0ms; }");
      await track(driver);
      await driver.hover("trg");
      const f = await frames(driver);
      return { sameTask: f.sameTask, gap: f.sameTaskGap, open: await bubbleOpen(driver) };
    },
    { sameTask: true, gap: 8, open: true },
  ),
  row(
    "Hover delay 0 on the trigger (R-12: the delay is read from the trigger's computed --ocelle-tooltip-delay): --ocelle-tooltip-delay: 0ms on the trigger itself, the tooltip at the test delay: shown in the same task as the pointerover",
    async (driver) => {
      await start(driver, page(), "#trg { --ocelle-tooltip-delay: 0ms; }");
      await track(driver);
      await driver.hover("trg");
      return { sameTask: (await frames(driver)).sameTask };
    },
    { sameTask: true },
  ),
  row(
    "Hover delay in seconds (R-12, R-15): --ocelle-tooltip-delay: 0.3s on the tooltip is the same 300 ms: not shown before 150 ms, shown by 450 ms",
    async (driver) => {
      await start(driver, page(), "#tip { --ocelle-tooltip-delay: 0.3s; }");
      await track(driver);
      await driver.hover("trg");
      await pause(450);
      return { delay: delay(await frames(driver)) };
    },
    { delay: delayed },
  ),
  row(
    "Hover delay without a unit (R-12; read as the overlays read a duration, R-06): --ocelle-tooltip-delay: 300, no unit, is no delay: shown in the same task as the pointerover",
    async (driver) => {
      await start(driver, page(), "#tip { --ocelle-tooltip-delay: 300; }");
      await track(driver);
      await driver.hover("trg");
      return { sameTask: (await frames(driver)).sameTask };
    },
    { sameTask: true },
  ),
  row(
    "Touch never starts a show (R-12, FR-037): with delay 0, a pointerover of pointerType touch shows no bubble; one of pointerType mouse then shows it at once",
    async (driver) => {
      await start(driver, page(), "#tip { --ocelle-tooltip-delay: 0ms; }");
      await tip(driver, { op: "over", id: "trg", pointerType: "touch" });
      const touch = await bubbleOpen(driver);
      await tip(driver, { op: "over", id: "trg", pointerType: "mouse" });
      return { touch, mouse: await bubbleOpen(driver) };
    },
    { touch: false, mouse: true },
  ),
  row(
    "Hover delay, moves inside the tooltip, then leaving before the delay (R-12): with --ocelle-tooltip-delay: 1000ms on the tooltip, the pointer enters the trigger, moves onto its inner span and leaves both boxes before that delay: no bubble at any frame of a 1500 ms wait from the entry",
    async (driver) =>
      beforeDelay(
        "the leave",
        async () => {
          await start(driver, page({ trigger: '<button id="trg" aria-label="Projects">Edge <span id="inner">inner text</span> edge</button>' }), `#tip { --ocelle-tooltip-delay: ${String(longDelay)}ms; }`);
          const trigger = await inspect(driver, "trg");
          const inner = await inspect(driver, "inner");
          await track(driver);
          await driver.pointer([{ x: trigger.left + 4, y: trigger.top + trigger.height / 2 }]);
          await pause(35);
          await driver.pointer([centre(inner)]);
          await pause(35);
          await driver.pointer([rest]);
          await pause(1000);
          await pause(longWait - 1000);
          const f = await frames(driver);
          const leave = f.left ?? Infinity;
          const shown = openTimes(f);
          return {
            at: f.left,
            observed: { moved: f.moved !== null, beforeLeave: shown.some((t) => t < leave), afterLeave: shown.some((t) => t >= leave), toWait: (f.frames.at(-1)?.t ?? 0) >= longWait },
          };
        },
        longDelay,
      ),
    { moved: true, beforeLeave: false, afterLeave: false, toWait: true },
  ),
  row(
    "Keyboard focus inside a custom-element trigger (FR-031: the trigger, or a control inside it): Tab onto the inner button of an open shadow root slotted as the trigger shows the bubble at once",
    async (driver) => {
      await start(driver, page({ trigger: '<ocelle-test-opener id="trg"></ocelle-test-opener>' }));
      await tabFrom(driver);
      return { focus: await driver.focusPath(), open: await bubbleOpen(driver) };
    },
    { focus: "trg[in]", open: true },
  ),
  row(
    "Keyboard focus (US3-1, FR-031): Tab onto the trigger (it matches :focus-visible) shows the bubble at once, whatever the delay; persistence (c) (FR-032): with the pointer outside both boxes it is shown at every frame of a 900 ms wait",
    async (driver) => {
      await start(driver, page());
      await tabFrom(driver);
      const atOnce = await bubbleOpen(driver);
      await track(driver);
      await pause(950);
      const f = await frames(driver);
      return { focus: await driver.focusPath(), visible: await driver.focusVisible("trg"), atOnce, persisted: persisted(f), layer: await driver.topLayer() };
    },
    { focus: "trg", visible: true, atOnce: true, persisted: true, layer: [tipLayer] },
  ),
  row(
    "Click focus (FR-031): a pointer click on the button trigger and the pointer moved off it before the delay: focus on the trigger without :focus-visible, no bubble at any frame of a 450 ms wait from the click; then Shift+Tab and Tab back (keyboard focus) show it at once",
    async (driver) =>
      beforeDelay("the move off the trigger", async () => {
        await start(driver, page());
        await track(driver);
        await driver.click("trg");
        await driver.pointer([rest]);
        await pause(450);
        const f = await frames(driver);
        const clicked = { focus: await driver.focusPath(), visible: await driver.focusVisible("trg"), never: never(f, 400), to450: (f.frames.at(-1)?.t ?? 0) >= 450 };
        await driver.press("Tab", { shift: true });
        await driver.press("Tab");
        return { at: f.left, observed: { clicked, keyboard: await bubbleOpen(driver) } };
      }),
    { clicked: { focus: "trg", visible: false, never: true, to450: true }, keyboard: true },
  ),
  row(
    "Late :focus-visible (SPEC-2-03, R-12): click the trigger, move the pointer off both boxes, press Shift: the trigger now matches :focus-visible, yet no bubble at any frame of a 450 ms wait; keyboard focus arriving again (Shift+Tab, Tab) shows it at once",
    async (driver) => {
      await start(driver, page());
      await driver.click("trg");
      await driver.pointer([rest]);
      await driver.press("Shift");
      const visible = await driver.focusVisible("trg");
      await track(driver);
      await pause(450);
      const f = await frames(driver);
      await driver.press("Tab", { shift: true });
      await driver.press("Tab");
      return { visible, never: never(f, 400), focus: await driver.focusPath(), again: await bubbleOpen(driver) };
    },
    { visible: true, never: true, focus: "trg", again: true },
  ),
  row(
    "Click focus, then hover (US3-12, FR-031, FR-032; analysis C3): the button trigger clicked and the pointer resting on it: not shown before 150 ms, shown by 450 ms; the pointer moved off both boxes: hidden within one frame while focus stays on the trigger, not shown at any frame of a 900 ms wait; the pointer resting on the trigger again: shown by 450 ms from that entry",
    async (driver) => {
      await start(driver, page());
      await track(driver);
      await driver.click("trg");
      await pause(450);
      const first = delay(await frames(driver));
      const clicked = { focus: await driver.focusPath(), visible: await driver.focusVisible("trg") };
      await driver.pointer([rest]);
      const left = await bubbleOpen(driver);
      await track(driver);
      await pause(950);
      const away = { never: never(await frames(driver), 900), focus: await driver.focusPath() };
      await track(driver);
      await driver.hover("trg");
      await pause(450);
      return { first, clicked, left, away, again: delay(await frames(driver)) };
    },
    { first: delayed, clicked: { focus: "trg", visible: false }, left: false, away: { never: true, focus: "trg" }, again: delayed },
  ),
  row(
    "Click focus, then hover, then keyboard focus (US3-12; analysis C3): after the pointer left and the bubble hid with focus on the clicked trigger, Shift+Tab to the page button before it and Tab back onto the trigger (focus arriving with :focus-visible) show it at once",
    async (driver) => {
      await start(driver, page());
      await driver.click("trg");
      await pause(450);
      const shown = await bubbleOpen(driver);
      await driver.pointer([rest]);
      const left = await bubbleOpen(driver);
      await driver.press("Tab", { shift: true });
      const back = await driver.focusPath();
      await driver.press("Tab");
      return { shown, left, back, focus: await driver.focusPath(), again: await bubbleOpen(driver) };
    },
    { shown: true, left: false, back: "before", focus: "trg", again: true },
  ),
  row(
    "Text-field trigger (FR-029, US3-10, R-12; stated limit): a clicked <input type=text> trigger matches :focus-visible and shows the bubble at once, before the hover delay",
    async (driver) =>
      beforeDelay(
        "the click on the text field",
        async () => {
          await start(driver, page({ trigger: '<input id="trg" type="text" aria-label="Search">', text: "Search the workspace" }));
          await track(driver);
          await driver.click("trg");
          const atOnce = await bubbleOpen(driver);
          const f = await frames(driver);
          return { at: f.clicked, observed: { focus: await driver.focusPath(), visible: await driver.focusVisible("trg"), atOnce, early: openTimes(f).some((t) => t < 150) } };
        },
        early,
      ),
    { focus: "trg", visible: true, atOnce: true, early: true },
  ),
];

// Hoverable gap and leave (US3-2, FR-032, R-11, R-12) --------------------------------------------------------------------

const leaveRows = [
  row(
    "Hoverable gap (US3-2, FR-032, R-11): from the shown bubble's trigger the pointer stops in the gap between trigger and painted box: shown; moves on onto the painted box: shown, and persistence (b): shown at every frame of a 900 ms wait; stops beside the bubble part, outside both boxes: hidden",
    async (driver) => {
      await start(driver, page());
      await driver.hover("trg");
      await pause(450);
      const trigger = await inspect(driver, "trg");
      const part = await inspect(driver, "tip", bubblePart);
      const box = await inspect(driver, "tip", painted);
      await driver.pointer([{ x: finite(trigger.left + trigger.width / 2), y: finite(trigger.top - 4) }]);
      const gap = await bubbleOpen(driver);
      await driver.pointer([centre(box)]);
      const onBubble = await bubbleOpen(driver);
      await track(driver);
      await pause(950);
      const f = await frames(driver);
      await driver.pointer([{ x: finite(part.right + 6), y: finite(part.bottom - 2) }]);
      return { gapIsPadding: Math.abs(part.bottom - trigger.top) < 0.5 && Math.abs(box.bottom - (trigger.top - 8)) < 0.5, gap, onBubble, persisted: persisted(f), beside: await bubbleOpen(driver) };
    },
    { gapIsPadding: true, gap: true, onBubble: true, persisted: true, beside: false },
  ),
  row(
    "Leave (US3-2, FR-032): shown by hover, the pointer leaves both boxes with no keyboard focus: hidden within one frame; shown by keyboard focus, Tab moves focus on while neither box is hovered: hidden; then shown by hover again, the pointer leaving hides it (the keyboard focus that left no longer holds it)",
    async (driver) => {
      await start(driver, page({ after: '<button id="next">Next</button>' }));
      await driver.hover("trg");
      await pause(450);
      const hovered = await bubbleOpen(driver);
      await driver.pointer([rest]);
      const left = await bubbleOpen(driver);
      await tabFrom(driver);
      const focused = await bubbleOpen(driver);
      await driver.press("Tab");
      const focusout = { focus: await driver.focusPath(), open: await bubbleOpen(driver), layer: await driver.topLayer() };
      await driver.hover("trg");
      await pause(450);
      const again = await bubbleOpen(driver);
      await driver.pointer([rest]);
      return { hovered, left, focused, focusout, again, leftAgain: await bubbleOpen(driver) };
    },
    { hovered: true, left: false, focused: true, focusout: { focus: "next", open: false, layer: [] }, again: true, leftAgain: false },
  ),
  row(
    "Leave with the other condition holding (FR-032, data-model § State): with keyboard focus on the trigger, the pointer that entered and leaves both boxes keeps it shown; hovered, focus moving off the trigger keeps it shown",
    async (driver) => {
      await start(driver, page({ after: '<button id="next">Next</button>' }));
      await tabFrom(driver);
      await driver.hover("trg");
      await driver.pointer([rest]);
      const keptByFocus = await bubbleOpen(driver);
      await driver.hover("trg");
      await driver.press("Tab");
      return { keptByFocus, focus: await driver.focusPath(), keptByHover: await bubbleOpen(driver) };
    },
    { keptByFocus: true, focus: "next", keptByHover: true },
  ),
];

// Escape (US3-4, FR-033, SC-005, R-12) -------------------------------------------------------------------------------

/** The page of a tooltip inside an open overlay: an opener, the overlay `dlg` with a first button and the tooltip. */
const overlayPage = (tag: "ocelle-dialog" | "ocelle-drawer", body = `<button id="first">First</button><ocelle-tooltip id="tip" text="Projects">${button}</ocelle-tooltip>`, attrs = ""): string =>
  `<button id="before">Before</button><button id="opener">Open</button><${tag} id="dlg" label="Settings"${attrs}>${body}</${tag}>${standIns}`;

/** Clicks the opener, opens the overlay `dlg` and records its two events; waits for its entry (motion-base, 200 ms). */
async function openOverlay(driver: Driver, tag: "ocelle-dialog" | "ocelle-drawer"): Promise<void> {
  await driver.click("opener");
  await driver.setAttribute("dlg", "open", "");
  await driver.record("dlg", [`${tag}-close-request`, `${tag}-close`]);
  await pause(300);
}

const overlayEvent = (tag: string, type: "close-request" | "close", reason: string, focusPath: string): RecordedEvent => ({
  type: `${tag}-${type}`,
  detail: { reason },
  cancelable: type === "close-request",
  bubbles: true,
  composed: true,
  open: type === "close-request",
  dialogOpen: type === "close-request",
  modal: type === "close-request",
  focusPath,
});

const escapeRows = [
  row(
    "Escape, then a brief hover (FR-033, R-12): shown by keyboard focus and hidden by Escape, focus kept on the trigger; the pointer enters the trigger and leaves both boxes within 100 ms: no bubble at any frame of a 450 ms wait from the entry",
    async (driver) =>
      beforeDelay("the leave", async () => {
        await start(driver, page());
        await tabFrom(driver);
        await driver.press("Escape");
        await track(driver);
        await driver.hover("trg");
        await pause(50);
        await driver.pointer([rest]);
        await pause(450);
        const f = await frames(driver);
        return { at: f.left, observed: { never: never(f, 400), focus: await driver.focusPath(), visible: await driver.focusVisible("trg") } };
      }),
    { never: true, focus: "trg", visible: true },
  ),
  row(
    "Escape (US3-4, FR-033): shown by keyboard focus, another key (Shift) leaves it shown and reaches the document; Escape hides it; focus stays on the trigger; a keydown recorder on the document (capture and bubble) sees nothing; dismissed: no bubble at any frame of a 450 ms wait with focus and pointer unchanged; the pointer entering the trigger shows it again by 450 ms",
    async (driver) => {
      await start(driver, page());
      await tabFrom(driver);
      const shown = await bubbleOpen(driver);
      await tip(driver, { op: "keys" });
      await driver.press("Shift");
      const other = { open: await bubbleOpen(driver), keys: await tip(driver, { op: "keylog" }) };
      await tip(driver, { op: "keys" });
      await driver.press("Escape");
      const hidden = !(await bubbleOpen(driver));
      const keys = await tip(driver, { op: "keylog" });
      await track(driver);
      await pause(450);
      const dismissed = never(await frames(driver), 400);
      await track(driver);
      await driver.hover("trg");
      await pause(450);
      return { shown, other, hidden, keys, dismissed, focus: await driver.focusPath(), again: delay(await frames(driver)) };
    },
    { shown: true, other: { open: true, keys: ["document-capture:Shift", "document:Shift"] }, hidden: true, keys: [], dismissed: true, focus: "trg", again: delayed },
  ),
  row(
    "Escape (US3-4, FR-033): shown by hover, Escape hides it with the pointer resting on the trigger: dismissed, no bubble at any frame of a 450 ms wait; keyboard focus entering (Tab onto the trigger) shows it again at once",
    async (driver) => {
      await start(driver, page());
      await driver.hover("trg");
      await pause(450);
      const shown = await bubbleOpen(driver);
      await driver.press("Escape");
      await track(driver);
      await pause(450);
      const dismissed = never(await frames(driver), 400);
      await tabFrom(driver);
      return { shown, dismissed, again: await bubbleOpen(driver) };
    },
    { shown: true, dismissed: true, again: true },
  ),
  ...(["ocelle-dialog", "ocelle-drawer"] as const).map((tag) =>
    row(
      `Escape inside an open ${tag} (US3-4, SC-005, FR-010, FR-033): the bubble shown by keyboard focus; the first Escape hides the bubble only: the ${tag} stays open and :modal, no event, a keydown recorder on its host sees nothing; the second Escape requests its close, which closes it, focus back on the opener`,
      async (driver) => {
        await start(driver, overlayPage(tag));
        await openOverlay(driver, tag);
        await driver.press("Tab");
        const shown = { focus: await driver.focusPath(), open: await bubbleOpen(driver), layer: await driver.topLayer() };
        await tip(driver, { op: "keys", id: "dlg" });
        await driver.press("Escape");
        const first = { open: await bubbleOpen(driver), state: await state(driver), recorded: await driver.recorded(), keys: await tip(driver, { op: "keylog" }) };
        await driver.press("Escape");
        return { shown, first, recorded: await events(driver, 2), state: await state(driver) };
      },
      {
        shown: { focus: "trg", open: true, layer: [dialogLayer, tipLayer] },
        first: { open: false, state: { open: true, modal: true, topLayer: 1 }, recorded: [], keys: [] },
        recorded: [overlayEvent(tag, "close-request", "escape", "trg"), overlayEvent(tag, "close", "escape", "opener")],
        state: { open: false, modal: false, topLayer: 0 },
      },
    ),
  ),
  row(
    "Escape with a bubble shown behind the topmost overlay (R-12): a synthetic pointerover on a page trigger with delay 0 while a dialog is open shows its bubble; Escape is not taken by the tooltip: the dialog's close request has reason escape",
    async (driver) => {
      await start(
        driver,
        `<button id="before">Before</button><button id="opener">Open</button><ocelle-tooltip id="tip" text="Projects">${button}</ocelle-tooltip><ocelle-dialog id="dlg" label="Settings"><button id="first">First</button></ocelle-dialog>${standIns}`,
        "#tip { --ocelle-tooltip-delay: 0ms; }",
      );
      await openOverlay(driver, "ocelle-dialog");
      await act(driver, { op: "veto", id: "dlg", event: "ocelle-dialog-close-request" });
      await tip(driver, { op: "over", id: "trg", pointerType: "mouse" });
      const behind = await bubbleOpen(driver);
      await driver.press("Escape");
      return { behind, recorded: await events(driver, 1), focus: await driver.focusPath() };
    },
    { behind: true, recorded: [overlayEvent("ocelle-dialog", "close-request", "escape", "first")], focus: "first" },
  ),
];

// A trigger that opens an overlay (FR-010, FR-034, R-10) -------------------------------------------------------------

const opensRows = (["ocelle-dialog", "ocelle-drawer"] as const).map((tag) =>
  row(
    `Trigger opens an ${tag} (FR-010, FR-034, R-10): the bubble shown by hover past the delay; a click on the trigger opens the ${tag}: the bubble is already hidden when the ${tag}'s <dialog> is shown (its beforetoggle), the top layer holds only the ${tag}; one Escape requests the ${tag}'s close`,
    async (driver) => {
      await start(driver, `<button id="before">Before</button><div id="stage"><ocelle-tooltip id="tip" text="Settings">${button}</ocelle-tooltip></div><${tag} id="dlg" label="Settings"><button id="inner">Inside</button></${tag}>${standIns}`);
      await act(driver, { op: "on", id: "trg", event: "click", then: [{ op: "attr", id: "dlg", name: "open", value: "" }] });
      await act(driver, { op: "veto", id: "dlg", event: `${tag}-close-request` });
      await driver.record("dlg", [`${tag}-close-request`, `${tag}-close`]);
      await tip(driver, { op: "watchModal", id: "dlg" });
      await driver.hover("trg");
      await pause(450);
      const shown = await bubbleOpen(driver);
      await driver.click("trg");
      await pause(300);
      const opened = { atOpen: await tip(driver, { op: "modalLog" }), open: await bubbleOpen(driver), layer: await driver.topLayer(), focus: await driver.focusPath() };
      await driver.press("Escape");
      return { shown, opened, recorded: await events(driver, 1) };
    },
    {
      shown: true,
      opened: { atOpen: [false], open: false, layer: [dialogLayer], focus: "inner" },
      recorded: [overlayEvent(tag, "close-request", "escape", "inner")],
    },
  ),
);

const opensPendingRow = row(
  "Trigger opens an ocelle-dialog before the delay (FR-010, FR-034, R-10): the pointer enters the trigger and clicks it before the delay, which opens the dialog: the pending bubble does not show, at no frame of a 450 ms wait from the entry",
  async (driver) =>
    beforeDelay("the click that opens the dialog", async () => {
      await start(driver, `<button id="before">Before</button><div id="stage"><ocelle-tooltip id="tip" text="Settings">${button}</ocelle-tooltip></div><ocelle-dialog id="dlg" label="Settings"><button id="inner">Inside</button></ocelle-dialog>${standIns}`);
      await act(driver, { op: "on", id: "trg", event: "click", then: [{ op: "attr", id: "dlg", name: "open", value: "" }] });
      await track(driver);
      await driver.click("trg");
      await pause(450);
      const f = await frames(driver);
      return { at: f.clicked, observed: { never: never(f, 400), to450: (f.frames.at(-1)?.t ?? 0) >= 450, layer: await driver.topLayer(), focus: await driver.focusPath() } };
    }),
  { never: true, to450: true, layer: [dialogLayer], focus: "inner" },
);

// No bubble: empty text, disabled; hidden when the trigger goes (US3-9, FR-030, Edge Cases) ----------------------------

const noBubbleRows = [
  ...(
    [
      ['an empty text (text="")', ' text=""', "text", "Projects"],
      ["disabled", ' text="Projects" disabled', "disabled", null],
    ] as const
  ).map(([label, attrs, name, value]) =>
    row(
      `No bubble with ${label} (US3-9, FR-030): no bubble at any frame of a 450 ms hover nor on keyboard focus; once ${name === "text" ? "text is set" : "disabled is removed"}, keyboard focus arriving shows it at once`,
      async (driver) => {
        await start(driver, page().replace(' text="Projects"', attrs));
        await track(driver);
        await driver.hover("trg");
        await pause(450);
        await tabFrom(driver);
        const f = await frames(driver);
        const none = { never: never(f, 400), focus: await driver.focusPath() };
        await driver.pointer([rest]);
        await driver.setAttribute("tip", name, value);
        await tabFrom(driver);
        return { none, shown: await bubbleOpen(driver) };
      },
      { none: { never: true, focus: "trg" }, shown: true },
    ),
  ),
  row(
    "No bubble without a text attribute (FR-030, data-model § ocelle-tooltip: text defaults to the empty string): no bubble at any frame of a 450 ms hover nor on keyboard focus; once text is set, keyboard focus arriving shows it at once",
    async (driver) => {
      await start(driver, page().replace(' text="Projects"', ""));
      await track(driver);
      await driver.hover("trg");
      await pause(450);
      await tabFrom(driver);
      const none = { never: never(await frames(driver), 400), text: (await inspect(driver, "tip", painted)).text };
      await driver.pointer([rest]);
      await driver.setAttribute("tip", "text", "Projects");
      await tabFrom(driver);
      return { none, shown: await bubbleOpen(driver) };
    },
    { none: { never: true, text: "" }, shown: true },
  ),
  row(
    "Tooltip removed during the delay (Edge Cases, FR-034): the pointer enters the trigger and the tooltip is removed at once: no bubble at any frame of a 450 ms wait, nothing thrown",
    async (driver) => {
      await start(driver, page());
      await track(driver);
      await driver.hover("trg");
      await act(driver, { op: "remove", id: "tip" });
      await pause(450);
      return { layer: await driver.topLayer(), messages: await driver.messages() };
    },
    { layer: [], messages: [] },
  ),
  row(
    "Hidden while shown when the tooltip is removed (Edge Cases, FR-033): shown by keyboard focus, the tooltip removed: no bubble in the top layer, and a later Escape is not taken: it reaches the document",
    async (driver) => {
      await start(driver, page());
      await tabFrom(driver);
      const shown = await bubbleOpen(driver);
      await act(driver, { op: "remove", id: "tip" });
      await act(driver, { op: "focus", id: "before" });
      await tip(driver, { op: "keys" });
      await driver.press("Escape");
      return { shown, layer: await driver.topLayer(), keys: await tip(driver, { op: "keylog" }) };
    },
    { shown: true, layer: [], keys: ["document-capture:Escape", "document:Escape"] },
  ),
  ...(
    [
      ["the trigger becomes disabled", { op: "attr", id: "trg", name: "disabled", value: "" }],
      ["the trigger is removed", { op: "remove", id: "trg" }],
      ["the tooltip becomes disabled", { op: "attr", id: "tip", name: "disabled", value: "" }],
      ["the tooltip's text is emptied", { op: "attr", id: "tip", name: "text", value: "" }],
    ] as const
  ).map(([label, command]) =>
    row(
      `Hidden while shown when ${label} (Edge Cases, FR-030): shown by hover, then hidden within one frame, the top layer empty`,
      async (driver) => {
        await start(driver, page());
        await driver.hover("trg");
        await pause(450);
        const shown = await bubbleOpen(driver);
        await act(driver, command);
        await pause(20);
        return { shown, layer: await driver.topLayer() };
      },
      { shown: true, layer: [] },
    ),
  ),
];

// Slot change and two tooltips (R-12, FR-034) -------------------------------------------------------------------------

const slotRows = [
  row(
    "Slot change after the trigger (R-12: the trigger is the first assigned element): a second element slotted after the trigger while the bubble is shown by keyboard focus leaves it shown",
    async (driver) => {
      await start(driver, page());
      await tabFrom(driver);
      await tip(driver, { op: "insert", id: "tip", markup: '<span id="extra">Extra</span>', first: false });
      await pause(50);
      return { open: await bubbleOpen(driver), focus: await driver.focusPath() };
    },
    { open: true, focus: "trg" },
  ),
  row(
    "Slot change with keyboard focus on the old trigger (R-12: the trigger is the first assigned element): the trigger keyboard-focused, a new one slotted before it, so the focused one is no longer the trigger: the bubble hides at once; the pointer that entered the new trigger and showed its bubble hides it when it leaves (focus on the old one no longer holds it)",
    async (driver) => {
      await start(driver, page());
      await tabFrom(driver);
      await tip(driver, { op: "insert", id: "tip", markup: '<button id="trg2" aria-label="Second">S</button>', first: true });
      const afterSlot = await bubbleOpen(driver);
      await driver.hover("trg2");
      await pause(450);
      const shown = await bubbleOpen(driver);
      await driver.pointer([rest]);
      return { afterSlot, focus: await driver.focusPath(), shown, left: await bubbleOpen(driver) };
    },
    { afterSlot: false, focus: "trg", shown: true, left: false },
  ),
  row(
    "Slot change (R-12): a new trigger slotted first and the old one moved out of the tooltip: the new trigger shows the bubble on keyboard focus and on hover; the old one shows none on hover or keyboard focus",
    async (driver) => {
      await start(driver, page());
      await tip(driver, { op: "insert", id: "tip", markup: '<button id="trg2" aria-label="Second">S</button>', first: true });
      await tip(driver, { op: "move", id: "trg", to: "stage" });
      await track(driver);
      await driver.hover("trg");
      await pause(450);
      const oldHover = never(await frames(driver), 400);
      await tabFrom(driver);
      const keyboard = { focus: await driver.focusPath(), open: await bubbleOpen(driver) };
      await driver.press("Tab");
      await track(driver);
      await pause(450);
      const old = { hover: oldHover, keyboard: never(await frames(driver), 400), focus: await driver.focusPath() };
      await track(driver);
      await driver.hover("trg2");
      await pause(450);
      return { old, keyboard, hover: delay(await frames(driver)) };
    },
    { old: { hover: true, keyboard: true, focus: "trg" }, keyboard: { focus: "trg2", open: true }, hover: delayed },
  ),
  row(
    "Two tooltips (FR-034, Edge Cases): one bubble shown by keyboard focus; hovering the other tooltip's trigger past the delay shows its bubble and hides the first, focus unchanged: one bubble in the top layer",
    async (driver) => {
      await start(driver, page({ after: '<ocelle-tooltip id="tip2" text="Files"><button id="trg2" aria-label="Files">F</button></ocelle-tooltip>' }));
      await tabFrom(driver);
      const first = await bubbleOpen(driver);
      await driver.hover("trg2");
      await pause(450);
      return { first, focus: await driver.focusPath(), open: [await bubbleOpen(driver), await bubbleOpen(driver, "tip2")], layer: await driver.topLayer() };
    },
    { first: true, focus: "trg", open: [false, true], layer: [{ element: "tip2[div]", modal: false, popoverOpen: true }] },
  ),
  row(
    "Two tooltips, keyboard focus after the other's hover (FR-034): the first trigger clicked and the pointer moved onto the second, whose bubble shows by hover; Shift+Tab moves focus from the first trigger to the page button and Tab back onto it: the first's bubble shows at once and the second's hides, one bubble in the top layer",
    async (driver) => {
      await start(driver, page({ after: '<ocelle-tooltip id="tip2" text="Files"><button id="trg2" aria-label="Files">F</button></ocelle-tooltip>' }));
      await driver.click("trg");
      await driver.hover("trg2");
      await pause(450);
      const second = await bubbleOpen(driver, "tip2");
      await driver.press("Tab", { shift: true });
      const away = await driver.focusPath();
      await driver.press("Tab");
      return { second, away, focus: await driver.focusPath(), open: [await bubbleOpen(driver), await bubbleOpen(driver, "tip2")], layer: await driver.topLayer() };
    },
    { second: true, away: "before", focus: "trg", open: [true, false], layer: [tipLayer] },
  ),
];

// Placement (US3-5, US3-6, US3-13, US3-15, FR-035, SC-006, R-11) -----------------------------------------------------

type Placement = "top" | "bottom" | "start" | "end";
const sideOf = (placement: Placement, dir: "ltr" | "rtl"): string =>
  ({ top: "above", bottom: "below", start: dir === "ltr" ? "left" : "right", end: dir === "ltr" ? "right" : "left" })[placement];

const placementRows = [
  ...(["top", "bottom", "start", "end"] as const).flatMap((placement) =>
    (["ltr", "rtl"] as const).map((dir) =>
      row(
        `Placement (US3-1, US3-13, US3-15, FR-030, FR-035, R-11): placement="${placement}" under ${dir}: the painted box on the ${sideOf(placement, dir)} of the trigger, space-2 (8 px) away, centred on the cross axis, wholly on screen; the placement attribute reflected`,
        async (driver) => {
          await start(driver, page({ attrs: ` placement="${placement}"`, stageAttrs: ` dir="${dir}"` }));
          await tabFrom(driver);
          return { side: await placed(driver), onScreen: onScreen(await inspect(driver, "tip", painted)), reflected: await driver.attribute("tip", "placement") };
        },
        { side: sideOf(placement, dir), onScreen: true, reflected: placement },
      ),
    ),
  ),
  row("Placement (FR-030, data-model § ocelle-tooltip): no placement attribute gives top, reflected as placement=\"top\"; the painted box above the trigger", async (driver) => {
    await start(driver, page());
    await tabFrom(driver);
    return { side: await placed(driver), reflected: await driver.attribute("tip", "placement") };
  }, { side: "above", reflected: "top" }),
  row(
    "Reflection (FR-030, data-model § ocelle-tooltip): placement, disabled and describes set as properties are reflected as attributes; text set as a property is not",
    async (driver) => {
      await start(driver, page());
      await driver.setProperty("tip", "placement", "end");
      await act(driver, { op: "set", id: "tip", name: "disabled", value: true });
      await act(driver, { op: "set", id: "tip", name: "describes", value: true });
      await driver.setProperty("tip", "text", "Files");
      return { placement: await driver.attribute("tip", "placement"), disabled: await driver.attribute("tip", "disabled"), describes: await driver.attribute("tip", "describes"), text: await driver.attribute("tip", "text") };
    },
    { placement: "end", disabled: "", describes: "", text: "Projects" },
  ),
];

/** The stage rules that put the trigger against one edge of the viewport, 4 px from it, in either direction. */
const edgeRules: Record<string, string> = {
  top: "#stage { align-items: flex-start; padding-top: 4px; }",
  bottom: "#stage { align-items: flex-end; padding-bottom: 4px; }",
  left: "#stage { justify-content: left; padding-left: 4px; }",
  right: "#stage { justify-content: right; padding-right: 4px; }",
};

const flipRows = (
  [
    ["top", "ltr", "top", "below"],
    ["bottom", "ltr", "bottom", "above"],
    ["start", "ltr", "left", "right"],
    ["end", "ltr", "right", "left"],
    ["start", "rtl", "right", "left"],
    ["end", "rtl", "left", "right"],
  ] as const
).map(([placement, dir, edge, side]) =>
  row(
    `Flip (US3-6, US3-15, FR-035, R-11): placement="${placement}" under ${dir} with the trigger 4 px from the ${edge} edge, where the bubble would overflow the viewport less the gutter: shown on the opposite side, the ${side}, wholly on screen; the placement attribute unchanged`,
    async (driver) => {
      await start(driver, page({ attrs: ` placement="${placement}"`, stageAttrs: ` dir="${dir}"` }), edgeRules[edge]);
      await tabFrom(driver);
      return { side: await placed(driver), onScreen: onScreen(await inspect(driver, "tip", painted)), reflected: await driver.attribute("tip", "placement") };
    },
    { side, onScreen: true, reflected: placement },
  ),
);

const exactRows = (["top", "bottom", "start", "end"] as const).map((placement) =>
  row(
    `Flip boundary (FR-035, R-11): placement="${placement}" with exactly the bubble's size plus the gutter between the trigger and the viewport's edge on that side: the bubble fits, so it is not flipped`,
    async (driver) => {
      await start(driver, page({ attrs: ` placement="${placement}"` }));
      await tabFrom(driver);
      const part = await inspect(driver, "tip", bubblePart);
      const room = placement === "top" || placement === "bottom" ? part.height + gutter : part.width + gutter;
      const edge = { top: "top", bottom: "bottom", start: "left", end: "right" }[placement];
      const rules = {
        top: `#stage { align-items: flex-start; padding-top: ${String(room)}px; }`,
        bottom: `#stage { align-items: flex-end; padding-bottom: ${String(room)}px; }`,
        left: `#stage { justify-content: left; padding-left: ${String(room)}px; }`,
        right: `#stage { justify-content: right; padding-right: ${String(room)}px; }`,
      }[edge] ?? "";
      await driver.rules(rules);
      await pause(50);
      return { side: await placed(driver), onScreen: onScreen(await inspect(driver, "tip", painted)) };
    },
    { side: sideOf(placement, "ltr"), onScreen: true },
  ),
);

const shortRows = (["top", "bottom", "start", "end"] as const).map((placement) =>
  row(
    `Flip boundary (FR-035, R-11): placement="${placement}" with one pixel less than the bubble's size plus the gutter between the trigger and the viewport's edge on that side: it does not fit, so it is shown on the opposite side`,
    async (driver) => {
      await start(driver, page({ attrs: ` placement="${placement}"` }));
      await tabFrom(driver);
      const part = await inspect(driver, "tip", bubblePart);
      const room = (placement === "top" || placement === "bottom" ? part.height + gutter : part.width + gutter) - 1;
      const rules = {
        top: `#stage { align-items: flex-start; padding-top: ${String(room)}px; }`,
        bottom: `#stage { align-items: flex-end; padding-bottom: ${String(room)}px; }`,
        start: `#stage { justify-content: left; padding-left: ${String(room)}px; }`,
        end: `#stage { justify-content: right; padding-right: ${String(room)}px; }`,
      }[placement];
      await driver.rules(rules);
      await pause(50);
      return { side: await placed(driver), onScreen: onScreen(await inspect(driver, "tip", painted)) };
    },
    { side: { top: "below", bottom: "above", start: "right", end: "left" }[placement], onScreen: true },
  ),
);

const blockClampRows = (
  [
    ["top", "#stage { align-items: flex-start; padding-top: 4px; }", (box: Inspected) => Math.round(box.top), gutter],
    ["bottom", "#stage { align-items: flex-end; padding-bottom: 4px; }", (box: Inspected) => Math.round(box.bottom), 800 - gutter],
  ] as const
).map(([edge, rules, read, expected]) =>
  row(
    `Cross-axis clamp on the block axis (FR-035, R-11): placement="end", a long text, the trigger 4 px from the ${edge} edge: the painted box right of the trigger, its ${edge} edge at the gutter (16 px) from the viewport's`,
    async (driver) => {
      await start(driver, page({ text: longText, attrs: ' placement="end"' }), rules);
      await tabFrom(driver);
      const trigger = await inspect(driver, "trg");
      const box = await inspect(driver, "tip", painted);
      return { right: Math.abs(box.left - trigger.right - 8) < 0.5, edge: read(box), onScreen: onScreen(box) };
    },
    { right: true, edge: expected, onScreen: true },
  ),
);

const changeRows = [
  row(
    'Placement changed while shown (FR-030, FR-035): placement set from "top" to "bottom" while the bubble is shown by keyboard focus: within one frame it is below the trigger; the direction set to rtl with placement="start": within one frame it is on the trigger\'s right',
    async (driver) => {
      await start(driver, page());
      await tabFrom(driver);
      const before = await placed(driver);
      await driver.setAttribute("tip", "placement", "bottom");
      const bottom = await placed(driver);
      await driver.setAttribute("tip", "placement", "start");
      await driver.dir("stage", "rtl");
      return { before, bottom, rtlStart: await placed(driver) };
    },
    { before: "above", bottom: "below", rtlStart: "right" },
  ),
];

const longText = "Shows the missions of the workspace that match every filter you set in the panel on the left";

const clampRows = (
  [
    ["ltr", "left", (box: Inspected) => Math.round(box.left), gutter],
    ["rtl", "right", (box: Inspected) => Math.round(box.right), 1280 - gutter],
  ] as const
).map(([dir, edge, read, expected]) =>
  row(
    `Cross-axis clamp (FR-035, SPEC-1-08, R-11): placement="top" under ${dir}, a long text, the trigger 4 px from the ${edge} edge: the painted box above the trigger, its ${edge} edge at the gutter (16 px) from the viewport's, not centred`,
    async (driver) => {
      await start(driver, page({ text: longText, stageAttrs: ` dir="${dir}"` }), edgeRules[edge]);
      await tabFrom(driver);
      const trigger = await inspect(driver, "trg");
      const box = await inspect(driver, "tip", painted);
      return { above: Math.abs(trigger.top - box.bottom - 8) < 0.5, edge: read(box), onScreen: onScreen(box) };
    },
    { above: true, edge: expected, onScreen: true },
  ),
);

const neitherRow = row(
  'Neither side fits (FR-035, R-11; analysis A2): placement="top" around a trigger centred in a 1280 × 120 viewport with a text whose bubble is taller than the space above and below less the gutter: the bubble stays on top, its block end space-2 above the trigger, not flipped; its cross axis inside the viewport less the gutter',
  async (driver) => {
    await driver.setViewport(1280, 120);
    try {
      await start(driver, page({ text: `${longText}, and keeps the filters until you reset them` }));
      await tabFrom(driver);
      const trigger = await inspect(driver, "trg");
      const box = await inspect(driver, "tip", painted);
      const part = await inspect(driver, "tip", bubblePart);
      return {
        tooTall: part.height > trigger.top - gutter && part.height > 120 - gutter - trigger.bottom,
        onTop: Math.abs(trigger.top - box.bottom - 8) < 0.5,
        crossInside: box.left >= gutter - 0.5 && box.right <= 1280 - gutter + 0.5,
      };
    } finally {
      await driver.setViewport(1280, 800);
    }
  },
  { tooTall: true, onTop: true, crossInside: true },
);

/** The containers of SC-006: clipped, transformed. */
const containerRows = (
  [
    ["a container with overflow: hidden", "#box { overflow: hidden; inline-size: 40px; block-size: 30px; }"],
    ["a transformed container", "#box { transform: translateX(10px) scale(0.9); }"],
  ] as const
).map(([label, rules]) =>
  row(
    `Placement in ${label} (US3-5, US3-13, SC-006, FR-034): the bubble is in the top layer, painted whole: its painted box wholly on screen and hit at its centre and four corners, above the container`,
    async (driver) => {
      await start(driver, `<button id="before">Before</button><div id="stage"><div id="box"><ocelle-tooltip id="tip" text="${longText}">${button}</ocelle-tooltip></div></div>${standIns}`, rules);
      await tabFrom(driver);
      const box = await inspect(driver, "tip", painted);
      return { layer: await driver.topLayer(), onScreen: onScreen(box), hits: await hits(driver, box), side: await placed(driver) };
    },
    { layer: [tipLayer], onScreen: true, hits: ["tip", "tip", "tip", "tip", "tip"], side: "above" },
  ),
);

const insideRows = (["ocelle-dialog", "ocelle-drawer"] as const).map((tag) =>
  row(
    `Placement inside an open ${tag} (US3-5, US3-13, SC-006, FR-034): the bubble shown by keyboard focus is above the ${tag} and its backdrop in the top layer, painted whole: wholly on screen and hit at its centre and four corners`,
    async (driver) => {
      await start(driver, overlayPage(tag));
      await openOverlay(driver, tag);
      await driver.press("Tab");
      const box = await inspect(driver, "tip", painted);
      return { layer: await driver.topLayer(), onScreen: onScreen(box), hits: await hits(driver, box), side: await placed(driver) };
    },
    { layer: [dialogLayer, tipLayer], onScreen: true, hits: ["tip", "tip", "tip", "tip", "tip"], side: "above" },
  ),
);

const paragraphs = Array.from({ length: 30 }, (_, index) => `<p>Paragraph ${String(index + 1)} of a body that scrolls.</p>`).join("");

const followRows = [
  row(
    "Following the trigger (US3-15, FR-035, R-11): a light-DOM container scrolled by 40 px while the bubble is shown: within one frame the painted box is beside the trigger again",
    async (driver) => {
      await start(driver, `<button id="before">Before</button><div id="stage"><div id="scroller"><p>Top</p><ocelle-tooltip id="tip" text="Projects">${button}</ocelle-tooltip>${paragraphs}</div></div>${standIns}`, "#scroller { overflow: auto; block-size: 300px; inline-size: 400px; padding-top: 120px; }");
      await tabFrom(driver);
      const before = await placed(driver);
      const moved = await tip(driver, { op: "scroll", id: "scroller", top: 40 });
      return { before, moved, after: await placed(driver) };
    },
    { before: "above", moved: 40, after: "above" },
  ),
  row(
    "Following the trigger (US3-15, FR-035, R-11): the open dialog's body, a scroller in its shadow root, scrolled by 40 px with the keyboard-focused trigger inside it: within one frame the painted box is beside the trigger again",
    async (driver) => {
      await start(driver, overlayPage("ocelle-dialog", `<button id="first">First</button><p>Top</p><p>More</p><p>More</p><p>More</p><p>More</p><ocelle-tooltip id="tip" text="Projects">${button}</ocelle-tooltip>${paragraphs}`));
      await openOverlay(driver, "ocelle-dialog");
      await driver.press("Tab");
      const before = await placed(driver);
      const moved = await tip(driver, { op: "scroll", id: "dlg", inner: '[part="body"]', top: 40 });
      return { focus: await driver.focusPath(), before, moved, after: await placed(driver), open: await bubbleOpen(driver) };
    },
    { focus: "trg", before: "above", moved: 40, after: "above", open: true },
  ),
  row(
    "Following the trigger (US3-15, FR-035, R-11): the viewport resized from 1280 × 800 to 1000 × 600 while the bubble is shown, which moves the centred trigger: within one frame the painted box is beside the trigger again",
    async (driver) => {
      await start(driver, page());
      await tabFrom(driver);
      const before = await placed(driver);
      try {
        await driver.setViewport(1000, 600);
        return { before, after: await placed(driver), open: await bubbleOpen(driver) };
      } finally {
        await driver.setViewport(1280, 800);
      }
    },
    { before: "above", after: "above", open: true },
  ),
];

const unbreakable = "A".repeat(90);

const sizeRows = [
  row(
    "Size (US3-6, FR-035, R-11): a long text wraps: the painted box and the bubble part are at most --ocelle-tooltip-max-inline (288 px) wide, the box more than one line tall",
    async (driver) => {
      await start(driver, page({ text: `${longText}, ${longText}` }));
      await tabFrom(driver);
      const box = await inspect(driver, "tip", painted, ["line-height"]);
      const part = await inspect(driver, "tip", bubblePart);
      return { box: box.width <= maxInline + 0.5, part: part.width <= maxInline + 0.5, wide: box.width > maxInline - 20, lines: box.height > 2 * Number.parseFloat(box.styles["line-height"] ?? "NaN") };
    },
    { box: true, part: true, wide: true, lines: true },
  ),
  row(
    "Size, unbreakable text (Edge Cases, FR-035, R-11): a 90-character word breaks inside the painted box: at most 288 px wide, its content not wider than the box",
    async (driver) => {
      await start(driver, page({ text: unbreakable }));
      await tabFrom(driver);
      const box = await inspect(driver, "tip", painted);
      return { width: box.width <= maxInline + 0.5, inside: box.scrollWidth <= box.clientWidth, broken: box.height > 30 };
    },
    { width: true, inside: true, broken: true },
  ),
];

// Styles, animation, theme, host layout (US3-8, US3-14, FR-029, R-09, R-11) -------------------------------------------

const boxStyles = ["border-top-left-radius", "border-top-right-radius", "border-bottom-left-radius", "border-bottom-right-radius", "padding-top", "padding-bottom", "padding-left", "padding-right", "background-color", "color", "font-size", "line-height", "font-family"];
const partStyles = ["border-top-left-radius", "border-top-right-radius", "border-bottom-left-radius", "border-bottom-right-radius", "background-color", "padding-top", "padding-right", "padding-bottom", "padding-left"];

const styleRows = (
  [
    ["top", "ltr", "padding-bottom"],
    ["end", "ltr", "padding-left"],
    ["end", "rtl", "padding-right"],
  ] as const
).map(([placement, dir, side]) =>
  row(
    `Bubble styles (R-09, analysis U2, constitution II): placement="${placement}" under ${dir}: the painted box has the computed radius-2 on its four corners (not radius-pill), padding-block space-1 and padding-inline space-2, ground color-chrome, ink color-chrome-ink, font-size-sm with line-height-normal in font-sans; the bubble part has no radius, no ground and padding space-2 on the trigger's side (${side}) only`,
    async (driver) => {
      await start(driver, page({ attrs: ` placement="${placement}"`, stageAttrs: ` dir="${dir}"` }));
      await tabFrom(driver);
      return { box: (await inspect(driver, "tip", painted, boxStyles)).styles, part: (await inspect(driver, "tip", bubblePart, partStyles)).styles };
    },
    {
      box: {
        "border-top-left-radius": "4px",
        "border-top-right-radius": "4px",
        "border-bottom-left-radius": "4px",
        "border-bottom-right-radius": "4px",
        "padding-top": "4px",
        "padding-bottom": "4px",
        "padding-left": "8px",
        "padding-right": "8px",
        "background-color": chromeLight,
        color: chromeInk,
        "font-size": "14px",
        "line-height": "20.3px",
        "font-family": '"Schibsted Grotesk", "Helvetica Neue", Arial, system-ui, sans-serif',
      },
      part: {
        "border-top-left-radius": "0px",
        "border-top-right-radius": "0px",
        "border-bottom-left-radius": "0px",
        "border-bottom-right-radius": "0px",
        "background-color": transparent,
        "padding-top": "0px",
        "padding-right": "0px",
        "padding-bottom": "0px",
        "padding-left": "0px",
        [side]: "8px",
      },
    },
  ),
);

const motionRows = [
  row(
    "No animation (US3-8, SC-008's note; analysis C2): with motion allowed and --ocelle-motion-base at its real value, no animation on the bubble part or its painted box after a show by hover, at every frame of the 900 ms persistence wait, and after the hide; the same after a show by keyboard focus",
    async (driver) => {
      await start(driver, page());
      await track(driver);
      await driver.hover("trg");
      await pause(450);
      await pause(950);
      const hover = await frames(driver);
      await driver.pointer([rest]);
      const afterHide = [...(await driver.animations("tip", bubblePart)), ...(await driver.animations("tip", painted))];
      await tabFrom(driver);
      await track(driver);
      await pause(300);
      const keyboard = await frames(driver);
      return {
        reduced: (await driver.device()).reducedMotion,
        hover: { shown: persisted(hover), animations: hover.frames.reduce((sum, each) => sum + each.animations, 0) },
        afterHide,
        keyboard: { shown: keyboard.frames.every((each) => each.open.includes("tip")), animations: keyboard.frames.reduce((sum, each) => sum + each.animations, 0) },
      };
    },
    { reduced: false, hover: { shown: true, animations: 0 }, afterHide: [], keyboard: { shown: true, animations: 0 } },
  ),
];

const themeRow = row(
  'Theme change while shown (Edge Cases; analysis C6): the bubble shown by keyboard focus inside an open dialog, data-theme switched from light to dark: within one frame the painted box\'s ground and ink are the dark computed color-chrome and color-chrome-ink and the panel\'s ground the dark color-sheet; the bubble still shown, the dialog open and :modal, no event',
  async (driver) => {
    await start(driver, overlayPage("ocelle-dialog"));
    await driver.theme("light");
    await openOverlay(driver, "ocelle-dialog");
    await driver.press("Tab");
    const light = (await inspect(driver, "tip", painted, ["background-color", "color"])).styles;
    await driver.theme("dark");
    return {
      light,
      dark: (await inspect(driver, "tip", painted, ["background-color", "color"])).styles,
      panel: (await inspect(driver, "dlg", "dialog", ["background-color"])).styles["background-color"],
      open: await bubbleOpen(driver),
      state: await state(driver),
      recorded: await driver.recorded(),
    };
  },
  {
    light: { "background-color": chromeLight, color: chromeInk },
    dark: { "background-color": chromeDark, color: chromeInk },
    panel: sheetDark,
    open: true,
    state: { open: true, modal: true, topLayer: 2 },
    recorded: [],
  },
);

const layoutRow = row(
  "Host layout (US3-14, FR-029, R-11): the host is display: contents; a pill-shaped button that ellipsises in an 80 px container has the same box wrapped in ocelle-tooltip as unwrapped, and still ellipsises",
  async (driver) => {
    const pill = (id: string): string => `<button id="${id}" class="pill">A pill tag with a long name</button>`;
    await start(
      driver,
      `<button id="before">Before</button><div id="stage"><div id="n1"><ocelle-tooltip id="tip" text="A pill tag with a long name">${pill("p1")}</ocelle-tooltip></div><div id="n2">${pill("p2")}</div></div>${standIns}`,
      "#n1, #n2 { inline-size: 80px; } .pill { display: block; max-inline-size: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border-radius: var(--ocelle-radius-pill); }",
    );
    const wrapped = await inspect(driver, "p1");
    const unwrapped = await inspect(driver, "p2");
    return {
      display: await driver.computed("tip", "display"),
      same: { width: wrapped.width === unwrapped.width, height: wrapped.height === unwrapped.height, left: wrapped.left - unwrapped.left === (await inspect(driver, "n1")).left - (await inspect(driver, "n2")).left },
      ellipsises: [wrapped.scrollWidth > wrapped.clientWidth, unwrapped.scrollWidth > unwrapped.clientWidth],
    };
  },
  { display: "contents", same: { width: true, height: true, left: true }, ellipsises: [true, true] },
);

// The accessibility tree (US3-7, US3-11, FR-036, FR-037, R-13) ----------------------------------------------------------

const named = (nodes: readonly { readonly name: string }[], text: string): unknown[] => nodes.filter((node) => node.name.includes(text));

const treeRows = [
  row(
    "Accessibility tree without describes (US3-7, FR-036, R-13): with the bubble shown, the text is exposed once, as the trigger's own name: one node holds it, the button named Projects with no description; no tooltip node; the bubble part aria-hidden",
    async (driver) => {
      await start(driver, page());
      await tabFrom(driver);
      const subtree = await driver.axSubtree("tip");
      return { open: await bubbleOpen(driver), named: named(subtree, "Projects"), tooltips: subtree.filter((node) => node.role === "tooltip"), hidden: (await inspect(driver, "tip", bubblePart)).attributes["aria-hidden"], trigger: await driver.ax("trg") };
    },
    { open: true, named: [{ role: "button", name: "Projects" }], tooltips: [], hidden: "true", trigger: [{ role: "button", name: "Projects" }] },
  ),
  row(
    'Accessibility tree, name and text differing in case and spacing (US3-11, FR-036): name "Open  project", text "open project", no describes: the trigger has no accessible description (its name as Chromium computes it, white space collapsed)',
    async (driver) => {
      await start(driver, page({ text: "open project", trigger: '<button id="trg" aria-label="Open  project">O</button>' }));
      await tabFrom(driver);
      return { open: await bubbleOpen(driver), trigger: await driver.ax("trg") };
    },
    { open: true, trigger: [{ role: "button", name: "Open project" }] },
  ),
  row(
    "Accessibility tree with describes (US3-7, FR-036, R-13): on a named button the text is its accessible description; the description node is hidden, so no tooltip node is in the tree; describes reflected",
    async (driver) => {
      await start(driver, page({ text: "Saves a draft you can reopen later", attrs: " describes", trigger: '<button id="trg">Save</button>' }));
      await tabFrom(driver);
      return { trigger: await driver.ax("trg"), tooltips: (await driver.axSubtree("tip")).filter((node) => node.role === "tooltip"), reflected: await driver.attribute("tip", "describes") };
    },
    { trigger: [{ role: "button", name: "Save", description: "Saves a draft you can reopen later" }], tooltips: [], reflected: "" },
  ),
  row(
    "Accessibility tree with describes, text equal to the name (US3-11, FR-036): the text is still the trigger's accessible description (the element compares no names)",
    async (driver) => {
      await start(driver, page({ text: "Save", attrs: " describes", trigger: '<button id="trg">Save</button>' }));
      return { trigger: await driver.ax("trg") };
    },
    { trigger: [{ role: "button", name: "Save", description: "Save" }] },
  ),
];

// The describes lifecycle (FR-036, R-13) -------------------------------------------------------------------------------

const describedBy = async (driver: Driver, tipId = "tip", trigger = "trg"): Promise<Described> => (await tip(driver, { op: "describedBy", tip: tipId, trigger })) as Described;
const descPattern = /^ocelle-tooltip-desc-\d+$/;

/** The description spans with the id checked against the pattern instead of its number. */
const spansOf = (described: Described): unknown[] => described.spans.map(({ id, ...rest }) => ({ ...rest, id: descPattern.test(id) }));
const span = (text: string): unknown => ({ id: true, role: "tooltip", hidden: true, slot: "description", text, children: 0, sameId: 1 });

const describesRows = [
  row(
    "describes lifecycle (FR-036, R-13): a text with markup (<b>x</b>) is written as text: one hidden span[slot=description][role=tooltip] holding the literal string and no element child, its id ocelle-tooltip-desc-<n> unique in the trigger's root and in the trigger's aria-describedby; the description is the literal string",
    async (driver) => {
      await start(driver, page({ text: "&lt;b&gt;x&lt;/b&gt;", attrs: " describes", trigger: '<button id="trg">Save</button>' }));
      const described = await describedBy(driver);
      return { spans: spansOf(described), linked: described.attribute === described.spans[0]?.id, trigger: await driver.ax("trg") };
    },
    { spans: [span("<b>x</b>")], linked: true, trigger: [{ role: "button", name: "Save", description: "<b>x</b>" }] },
  ),
  row(
    "describes lifecycle (FR-036, R-13): the next three ids ocelle-tooltip-desc-<n> after a described tooltip's are already taken by elements of the trigger's root: a second tooltip given describes skips them, its span's id unique in that root",
    async (driver) => {
      await start(driver, page({ text: "Saves a draft", attrs: " describes", trigger: '<button id="trg">Save</button>', after: '<ocelle-tooltip id="tip2" text="Opens the folder"><button id="trg2">Open</button></ocelle-tooltip>' }));
      const first = Number((await describedBy(driver)).spans[0]?.id.replace("ocelle-tooltip-desc-", "") ?? "NaN");
      const taken = [1, 2, 3].map((step) => `ocelle-tooltip-desc-${String(first + step)}`);
      await tip(driver, { op: "insert", id: "stage", markup: taken.map((id) => `<p id="${id}">Taken</p>`).join(""), first: false });
      await driver.setAttribute("tip2", "describes", "");
      const second = await describedBy(driver, "tip2", "trg2");
      return { first: Number.isInteger(first), spans: spansOf(second), skipped: !taken.includes(second.spans[0]?.id ?? taken[0] ?? ""), linked: second.attribute === second.spans[0]?.id };
    },
    { first: true, spans: [span("Opens the folder")], skipped: true, linked: true },
  ),
  row(
    'describes lifecycle (FR-036, R-13): a host aria-describedby="x" on the trigger keeps x when describes is set (x then the id), when it is unset (x alone, no span) and after the tooltip is disconnected with describes set (x alone, no span)',
    async (driver) => {
      await start(driver, `${page({ text: "Saves a draft", trigger: '<button id="trg" aria-describedby="x">Save</button>' })}<p id="x">Extra</p>`);
      await driver.setAttribute("tip", "describes", "");
      const set = await describedBy(driver);
      await driver.setAttribute("tip", "describes", null);
      const unset = await describedBy(driver);
      await driver.setAttribute("tip", "describes", "");
      const again = (await describedBy(driver)).attribute;
      await tip(driver, { op: "keep", id: "trg" });
      await act(driver, { op: "remove", id: "tip" });
      const disconnected = await tip(driver, { op: "kept", id: "trg", name: "aria-describedby" });
      return { set: { attribute: set.attribute === `x ${set.spans[0]?.id ?? "?"}`, spans: spansOf(set) }, unset, again: again?.startsWith("x ocelle-tooltip-desc-"), disconnected };
    },
    { set: { attribute: true, spans: [span("Saves a draft")] }, unset: { attribute: "x", spans: [] }, again: true, disconnected: "x" },
  ),
  row(
    'describes lifecycle (FR-036, R-13): host ids "x y" on the trigger: describes set gives "x y <id>", unset gives "x y" again, in order',
    async (driver) => {
      await start(driver, `${page({ text: "Saves a draft", trigger: '<button id="trg" aria-describedby="x y">Save</button>' })}<p id="x">Ex</p><p id="y">Why</p>`);
      await driver.setAttribute("tip", "describes", "");
      const set = await describedBy(driver);
      await driver.setAttribute("tip", "describes", null);
      return { set: set.attribute === `x y ${set.spans[0]?.id ?? "?"}`, unset: (await describedBy(driver)).attribute };
    },
    { set: true, unset: "x y" },
  ),
  row(
    "describes lifecycle (FR-036, R-13): text changed: the description follows it; text emptied: no span and no id on the trigger",
    async (driver) => {
      await start(driver, page({ text: "Saves a draft", attrs: " describes", trigger: '<button id="trg">Save</button>' }));
      await driver.setAttribute("tip", "text", "Saves a copy");
      const changed = { spans: spansOf(await describedBy(driver)), trigger: await driver.ax("trg") };
      await driver.setAttribute("tip", "text", "");
      return { changed, emptied: await describedBy(driver), trigger: await driver.ax("trg") };
    },
    {
      changed: { spans: [span("Saves a copy")], trigger: [{ role: "button", name: "Save", description: "Saves a copy" }] },
      emptied: { attribute: null, spans: [] },
      trigger: [{ role: "button", name: "Save" }],
    },
  ),
  row(
    'describes lifecycle (FR-036, R-13; operator decision PLAN-FRESH-1-007 (a)): the host overwrites the trigger\'s aria-describedby with "y": after one microtask the tooltip\'s id is back after y, and the description is both texts',
    async (driver) => {
      await start(driver, `${page({ text: "Saves a draft", attrs: " describes", trigger: '<button id="trg">Save</button>' })}<p id="y">Why</p>`);
      const id = (await describedBy(driver)).spans[0]?.id ?? "no span";
      await act(driver, { op: "attr", id: "trg", name: "aria-describedby", value: "y" });
      const described = await describedBy(driver);
      return { attribute: described.attribute === `y ${id}`, spans: spansOf(described), trigger: await driver.ax("trg") };
    },
    { attribute: true, spans: [span("Saves a draft")], trigger: [{ role: "button", name: "Save", description: "Why Saves a draft" }] },
  ),
  row(
    "describes lifecycle (FR-036, R-13; squad round 2 PLAN-FRESH-2-005): the host removes the span (a re-render of the tooltip's children): after one microtask one span is back with the same id and text, still in the trigger's aria-describedby, and the trigger's description is the text",
    async (driver) => {
      await start(driver, page({ text: "Saves a draft", attrs: " describes", trigger: '<button id="trg">Save</button>' }));
      const before = (await describedBy(driver)).spans[0]?.id ?? "no span";
      const removed = await tip(driver, { op: "removeSpans", id: "tip" });
      const after = await describedBy(driver);
      return { removed, same: after.spans[0]?.id === before, spans: spansOf(after), linked: after.attribute === before, trigger: await driver.ax("trg") };
    },
    { removed: 1, same: true, spans: [span("Saves a draft")], linked: true, trigger: [{ role: "button", name: "Save", description: "Saves a draft" }] },
  ),
  row(
    "describes lifecycle, slot change (FR-036, R-13): a new trigger slotted first and the old one moved out: the new trigger is described, the old one no longer carries the id",
    async (driver) => {
      await start(driver, page({ text: "Saves a draft", attrs: " describes", trigger: '<button id="trg">Save</button>' }));
      await tip(driver, { op: "insert", id: "tip", markup: '<button id="trg2">Keep</button>', first: true });
      await tip(driver, { op: "move", id: "trg", to: "stage" });
      return { old: (await inspect(driver, "trg")).attributes["aria-describedby"] ?? null, oldTree: await driver.ax("trg"), newTree: await driver.ax("trg2") };
    },
    { old: null, oldTree: [{ role: "button", name: "Save" }], newTree: [{ role: "button", name: "Keep", description: "Saves a draft" }] },
  ),
];

const describesMoreRows = [
  row(
    'describes lifecycle (R-13: the tooltip removes only its own id): without describes, a host aria-describedby=" x  y " on the trigger is left exactly as written through updates and a slot change',
    async (driver) => {
      await start(driver, `${page({ text: "Saves a draft", trigger: '<button id="trg" aria-describedby=" x  y ">Save</button>' })}<p id="x">Ex</p><p id="y">Why</p>`);
      await driver.setAttribute("tip", "text", "Saves a copy");
      const updated = await driver.attribute("trg", "aria-describedby");
      await tip(driver, { op: "insert", id: "tip", markup: '<button id="trg2">Keep</button>', first: true });
      return { updated, slotted: await driver.attribute("trg", "aria-describedby") };
    },
    { updated: " x  y ", slotted: " x  y " },
  ),
  row(
    "describes lifecycle (FR-036, R-13): the trigger removed with nothing slotted after it: the span is removed and nothing thrown; a new trigger slotted later is described",
    async (driver) => {
      await start(driver, page({ text: "Saves a draft", attrs: " describes", trigger: '<button id="trg">Save</button>' }));
      await act(driver, { op: "remove", id: "trg" });
      await pause(20);
      const removed = { children: (await inspect(driver, "tip")).children, messages: await driver.messages() };
      await tip(driver, { op: "insert", id: "tip", markup: '<button id="trg2">Keep</button>', first: true });
      const back = await describedBy(driver, "tip", "trg2");
      return { removed, back: { spans: spansOf(back), linked: back.attribute === back.spans[0]?.id }, trigger: await driver.ax("trg2") };
    },
    { removed: { children: 0, messages: [] }, back: { spans: [span("Saves a draft")], linked: true }, trigger: [{ role: "button", name: "Keep", description: "Saves a draft" }] },
  ),
  row(
    "describes lifecycle (FR-036, R-13): a tooltip with describes and a text but no trigger adds no span, and nothing throws",
    async (driver) => {
      await start(driver, `<button id="before">Before</button><div id="stage"><ocelle-tooltip id="tip" text="Saves a draft" describes></ocelle-tooltip></div>${standIns}`);
      return { children: (await inspect(driver, "tip")).children, messages: await driver.messages() };
    },
    { children: 0, messages: [] },
  ),
  row(
    "describes lifecycle (FR-036, R-13): a disconnected tooltip whose text changes adds no span and no id back; re-inserted, its trigger is described again after the host's ids",
    async (driver) => {
      await start(driver, `${page({ text: "Saves a draft", attrs: " describes", trigger: '<button id="trg" aria-describedby="x">Save</button>' })}<p id="x">Extra</p>`);
      await tip(driver, { op: "keep", id: "trg" });
      await act(driver, { op: "remove", id: "tip" });
      await act(driver, { op: "set", id: "tip", name: "text", value: "Saves a copy" });
      await pause(20);
      const removed = await tip(driver, { op: "kept", id: "trg", name: "aria-describedby" });
      await act(driver, { op: "reinsert", id: "tip" });
      const back = await describedBy(driver);
      return { removed, back: { attribute: back.attribute === `x ${back.spans[0]?.id ?? "?"}`, spans: spansOf(back) }, trigger: await driver.ax("trg") };
    },
    { removed: "x", back: { attribute: true, spans: [span("Saves a copy")] }, trigger: [{ role: "button", name: "Save", description: "Extra Saves a copy" }] },
  ),
];

// Forced colours (US3-8, R-09) ---------------------------------------------------------------------------------------

const forcedRow = row(
  "Forced colours (US3-8, R-09): with forced colours active (light palette) the painted box has the Canvas ground, CanvasText ink and a border-width solid CanvasText border",
  async (driver) => {
    await start(driver, page());
    await driver.forcedColors("active", "light");
    try {
      await tabFrom(driver);
      const box = (await inspect(driver, "tip", painted, ["background-color", "color", "border-top-color", "border-top-style", "border-top-width"])).styles;
      const canvas = await driver.resolveColour("Canvas");
      const canvasText = await driver.resolveColour("CanvasText");
      return {
        open: await bubbleOpen(driver),
        ground: box["background-color"] === canvas,
        ink: box.color === canvasText,
        border: { canvasText: box["border-top-color"] === canvasText, style: box["border-top-style"], width: box["border-top-width"] },
        distinct: canvas !== canvasText,
      };
    } finally {
      await driver.forcedColors("none");
    }
  },
  { open: true, ground: true, ink: true, border: { canvasText: true, style: "solid", width: "1px" }, distinct: true },
);

/** Every shared body of matrix § Tooltip but the touch rows and "No Popover API", in matrix order. */
export const tooltipScenarios: readonly TooltipScenario[] = [
  ...showRows,
  ...leaveRows,
  ...escapeRows,
  ...opensRows,
  opensPendingRow,
  ...noBubbleRows,
  ...slotRows,
  ...placementRows,
  ...flipRows,
  ...exactRows,
  ...shortRows,
  ...clampRows,
  ...blockClampRows,
  ...changeRows,
  neitherRow,
  ...containerRows,
  ...insideRows,
  ...followRows,
  ...sizeRows,
  ...styleRows,
  ...motionRows,
  themeRow,
  layoutRow,
  ...treeRows,
  ...describesRows,
  ...describesMoreRows,
  forcedRow,
];

// Touch (US3-10, FR-029, FR-037; matrix § Tooltip "Touch") --------------------------------------------------------------

/** The touch rows, for the touch contexts only (test/tooltip.touch.test.ts, test/browser/tooltip.touch.test.ts). */
export const tooltipTouchScenarios: readonly TooltipScenario[] = [
  row(
    "Touch (US3-10, FR-031, FR-037): a tap on a button trigger runs its action (one click) and shows no bubble, neither on the tap nor at any frame of a 450 ms wait while the trigger keeps focus; keyboard focus arriving (Shift+Tab, Tab) then shows it at once",
    async (driver) => {
      await start(driver, page());
      await act(driver, { op: "watch", id: "trg", events: ["click"] });
      await track(driver);
      await driver.touchTap("trg");
      await pause(450);
      const f = await frames(driver);
      const tapped = { clicks: await act(driver, { op: "log" }), never: never(f, 400), focus: await driver.focusPath(), maxTouchPoints: (await driver.device()).maxTouchPoints > 0 };
      await driver.press("Tab", { shift: true });
      await driver.press("Tab");
      return { tapped, keyboard: await bubbleOpen(driver) };
    },
    { tapped: { clicks: ["click:true"], never: true, focus: "trg", maxTouchPoints: true }, keyboard: true },
  ),
  row(
    "Touch, text-field trigger (US3-10, FR-029; stated exception): a tap on an <input type=text> trigger focuses it with :focus-visible and shows the bubble",
    async (driver) => {
      await start(driver, page({ trigger: '<input id="trg" type="text" aria-label="Search">', text: "Search the workspace" }));
      await driver.touchTap("trg");
      return { focus: await driver.focusPath(), visible: await driver.focusVisible("trg"), open: await bubbleOpen(driver) };
    },
    { focus: "trg", visible: true, open: true },
  ),
];
