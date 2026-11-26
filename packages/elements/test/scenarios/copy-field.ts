// The shared bodies of User Story 4's browser scenarios for `ocelle-copy-field` (014 spec US4 scenarios 1 to 12 and the
// copy field's Edge Cases; FR-031 to FR-044; research.md R-07, R-11, R-15; contracts/elements.md § Pairings; T077).
// Each body mounts its page, acts with real keyboard and pointer input through the driver, sets up and reads what the
// driver has no command for with a self-contained function run in the page (`InPage`: the request recorder, the host
// listeners, the live region's text and its mutations) and returns one observation; each harness asserts it equals
// `expected`, written by hand from the spec, the data model and research (colours from the token table of
// packages/tokens/test/expected.ts; sizes from the tokens: `--ocelle-target-min` 44 px, `--ocelle-border-width` 1 px,
// `--ocelle-focus-width` 3 px at `--ocelle-focus-offset` 2 px). Every "does not" outcome is observed in the same body
// as the positive outcome it guards, with the setup that makes it falsifiable; the plant that makes each fail is named
// beside the body and run once in reviews/phase-5/plants.md. The in-process harness (test/copy-field.test.ts) runs
// every body; the fixture harness (test/browser/copy-field.test.ts) runs the bodies marked `fixture`. Both assert that
// the page made no clipboard call (SC-006), beside each body's own outcome.
//
// The field `#cf` sits in `#box`, a plain block padded by 12 px by a host rule, so the focus ring (2 to 5 px outside
// the Copy control) and the field's outer lines lie inside `#box`'s screenshot. The request arrives after the next
// rendering update (FR-035, R-07), so every body waits for two animation frames and a task before it reads the requests.
//
// US4-6 observes the request's timing and the tree's history, never a tree read from the listener (R-07, "What US4-6
// observes"; reviews/phase-5/spike.md): the driver's `activationRecord` (the activating click in the capture and the
// bubble phase at the document, the first animation frame registered in the activation's task, the request) and its
// `axUpdates` of the field (Chromium's `Accessibility.nodesUpdated`), with a synchronous host listener that sets the
// same status text again inside the event.
import { tokenColour } from "./icon.ts";
import type { AxNodeState, Driver, Focused, InPage, Pixels } from "./driver.ts";

/** One body: what it checks, what it must observe, and whether the fixture harness runs it too. */
export interface CopyFieldScenario {
  readonly name: string;
  readonly run: (driver: Driver, inPage: InPage) => Promise<unknown>;
  readonly expected: unknown;
  readonly fixture: boolean;
}

const command = "pnpm --filter @ocelle/elements run manifest";
/**
 * A 300-character command with no space (US4-2) and no other break opportunity (no hyphen or punctuation), so only
 * `overflow-wrap: anywhere` can wrap it (made stricter after the plant run, reviews/phase-5/notes.md).
 */
const longCommand = `${"ocelle0123456789".repeat(18)}abcdefghijkl`;
const copied = "Copied to clipboard";
const failed = "Could not copy: the bridge is unavailable";
const fontFamily = '"Schibsted Grotesk", "Helvetica Neue", Arial, system-ui, sans-serif';

/** The page of most bodies: a button before `#box`, the field `#cf` in `#box` with `attributes`, a button after it. */
function page(attributes: string): string {
  return `<button id="before" type="button">Before</button><div id="box"><ocelle-copy-field id="cf" ${attributes}></ocelle-copy-field></div><button id="after" type="button">After</button><p id="away">Away from the field</p>`;
}

/** The field's attributes with `value` the command. */
const withCommand = `value="${command}"`;

/**
 * Mounts `markup`, pads `#box` and scrolls the page to its start. The document listeners an earlier body installed
 * (the request recorder, the host listeners; `listen`) are removed first: in process the document outlives a mount.
 */
async function mount(driver: Driver, inPage: InPage, markup: string): Promise<void> {
  await inPage(() => {
    const scope = window as unknown as { __copyFieldOff?: (() => void)[] };
    for (const off of (scope.__copyFieldOff ?? []).splice(0)) off();
  }, null);
  await driver.mount(markup);
  await driver.rules("#box { padding: 12px; }");
  await inPage(() => {
    window.scrollTo(0, 0);
  }, null);
}

const control: Focused = { host: "cf", part: "copy-control" };

/**
 * The computed `property` of the part `which` of `#cf`'s shadow root, or `"no part"` when the shadow root holds no such
 * part (the field did not render it), so a missing part is an observed value the body's assertion reports.
 */
async function partStyle(driver: Driver, which: string, property: string): Promise<string> {
  const parts = await driver.elements("cf");
  return parts.some((part) => (part.attributes.part ?? "").split(" ").includes(which)) ? driver.computedPart("cf", which, property) : "no part";
}

/** Waits for two animation frames and a task in the page. */
function frames(): Promise<void> {
  return new Promise((done) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(done, 0);
      });
    });
  });
}

/**
 * Records every `ocelle-copy-field-request` at the document on `window.__requests`: its type, `detail` (a copy),
 * `bubbles`, `composed`, `cancelable`, the target's id, and the target's `status` and live region's text at dispatch
 * (FR-002, FR-035). A second call replaces the first's listener.
 */
function recordRequests(): void {
  const scope = window as unknown as { __requests: unknown[]; __requestsOff?: () => void };
  scope.__requestsOff?.();
  const requests: unknown[] = [];
  scope.__requests = requests;
  const listener = (event: Event): void => {
    const custom = event as CustomEvent<unknown>;
    const target = custom.target as (HTMLElement & { status?: unknown }) | null;
    requests.push({
      type: custom.type,
      detail: JSON.parse(JSON.stringify(custom.detail ?? null)) as unknown,
      bubbles: custom.bubbles,
      composed: custom.composed,
      cancelable: custom.cancelable,
      target: target?.id ?? null,
      status: target?.status ?? null,
      region: target?.shadowRoot?.querySelector('[role="status"]')?.textContent ?? null,
    });
  };
  document.addEventListener("ocelle-copy-field-request", listener);
  scope.__requestsOff = () => {
    document.removeEventListener("ocelle-copy-field-request", listener);
  };
  const registry = window as unknown as { __copyFieldOff?: (() => void)[] };
  (registry.__copyFieldOff ??= []).push(scope.__requestsOff);
}

/** A copy of the requests `recordRequests` recorded. */
function recordedRequests(): unknown {
  return JSON.parse(JSON.stringify((window as unknown as { __requests?: unknown[] }).__requests ?? [])) as unknown;
}

/** A request as `recordRequests` records it, from `#cf`, with the status and region empty at dispatch. */
function request(text: string): unknown {
  return { type: "ocelle-copy-field-request", detail: { text }, bubbles: true, composed: true, cancelable: false, target: "cf", status: "", region: "" };
}

/**
 * Installs a host listener on the document that sets `#cf`'s `status` to `text` on each request, synchronously; the
 * next `mount` removes it.
 */
function answerWith(text: string): void {
  const listener = (event: Event): void => {
    (event.target as HTMLElement & { status: string }).status = text;
  };
  document.addEventListener("ocelle-copy-field-request", listener);
  const registry = window as unknown as { __copyFieldOff?: (() => void)[] };
  (registry.__copyFieldOff ??= []).push(() => {
    document.removeEventListener("ocelle-copy-field-request", listener);
  });
}

/** The text of the live region (`role="status"`) in the shadow root of `#cf`, or null when there is none. */
function regionText(): string | null {
  return document.getElementById("cf")?.shadowRoot?.querySelector('[role="status"]')?.textContent ?? null;
}

/** The `status` property of `#cf`. */
function statusOf(): unknown {
  return (document.getElementById("cf") as unknown as { status?: unknown } | null)?.status ?? null;
}

/**
 * Starts recording the mutations of `#cf`'s live region (text, child list, attributes, in its subtree): each delivery
 * of the observer records the region's text at that moment.
 */
function watchRegion(): void {
  const scope = window as unknown as { __region?: { observer: MutationObserver; texts: string[] } };
  scope.__region?.observer.disconnect();
  const region = document.getElementById("cf")?.shadowRoot?.querySelector('[role="status"]');
  const watch = { observer: new MutationObserver(() => watch.texts.push(region?.textContent ?? "")), texts: [] as string[] };
  if (region !== null && region !== undefined) watch.observer.observe(region, { subtree: true, childList: true, characterData: true, attributes: true });
  scope.__region = watch;
}

/** The region texts `watchRegion` recorded since the last call, pending records included. */
function regionMutations(): string[] {
  const watch = (window as unknown as { __region?: { observer: MutationObserver; texts: string[] } }).__region;
  if (watch === undefined) return ["not watched"];
  const region = document.getElementById("cf")?.shadowRoot?.querySelector('[role="status"]');
  if (watch.observer.takeRecords().length > 0) watch.texts.push(region?.textContent ?? "");
  return watch.texts.splice(0);
}

/** An exposed node as the scenarios state it: role and name, a button's disabled state, a region's politeness. */
interface Exposed {
  readonly role: string;
  readonly name: string;
  readonly disabled?: boolean;
  readonly live?: string;
}

/** The roles the field's tree is read in; every other node (a generic wrapper) is structure. */
const readRoles = new Set(["group", "StaticText", "button", "status", "img", "image", "link", "textbox"]);

/** The accessibility subtree of `#cf` in tree order, the nodes of `readRoles` only. */
async function tree(driver: Driver): Promise<Exposed[]> {
  const nodes = await driver.axStates("cf", "subtree");
  return nodes
    .filter((node: AxNodeState) => readRoles.has(node.role))
    .map((node) => {
      if (node.role === "button") return { role: node.role, name: node.name, disabled: node.disabled === true };
      if (node.role === "status") return { role: node.role, name: node.name, live: node.live ?? "" };
      return { role: node.role, name: node.name };
    });
}

/** The field's tree: a group named `group`, the text, the Copy control named `label`, the live region and its text. */
function exposed(options: { readonly text?: string; readonly group?: string; readonly label?: string; readonly disabled?: boolean; readonly status?: string } = {}): Exposed[] {
  const text = options.text ?? command;
  return [
    { role: "group", name: options.group ?? "" },
    ...(text === "" ? [] : [{ role: "StaticText", name: text }]),
    { role: "button", name: options.label ?? "Copy", disabled: options.disabled === true },
    { role: "status", name: "", live: "polite" },
    ...(options.status === undefined ? [] : [{ role: "StaticText", name: options.status }]),
  ];
}

/** A screenshot of `#box`, with its place in the viewport and its device-pixel scale. */
interface Shot {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly image: Pixels;
}

async function shot(driver: Driver): Promise<Shot> {
  const box = await driver.box("box");
  const image = await driver.pixels("box");
  return { x: box.x, y: box.y, scale: image.width / box.width, image };
}

function colourAt(s: Shot, cssX: number, cssY: number): string {
  const offset = (Math.floor((cssY - s.y) * s.scale) * s.image.width + Math.floor((cssX - s.x) * s.scale)) * 4;
  return `rgb(${String(s.image.data[offset])}, ${String(s.image.data[offset + 1])}, ${String(s.image.data[offset + 2])})`;
}

/** A run of one line colour across a boundary: its colour and its length in CSS px. */
interface Run {
  readonly colour: string;
  readonly width: number;
}

/**
 * The run of line colour crossing a boundary: scanning along `axis` from `from` to `to` (viewport CSS px) at the fixed
 * other coordinate `at`, the first pixel in one of `colours` and the number of pixels after it of the same colour, in
 * CSS px; `{ colour: "none", width: 0 }` when no pixel of the window is in a line colour.
 */
function lineRun(s: Shot, axis: "x" | "y", at: number, from: number, to: number, colours: readonly string[]): Run {
  const fixed = Math.floor((at - (axis === "x" ? s.y : s.x)) * s.scale);
  const origin = axis === "x" ? s.x : s.y;
  const first = Math.floor((from - origin) * s.scale);
  const last = Math.floor((to - origin) * s.scale);
  const read = (along: number): string => {
    const [x, y] = axis === "x" ? [along, fixed] : [fixed, along];
    const offset = (y * s.image.width + x) * 4;
    return `rgb(${String(s.image.data[offset])}, ${String(s.image.data[offset + 1])}, ${String(s.image.data[offset + 2])})`;
  };
  for (let along = first; along <= last; along++) {
    const colour = read(along);
    if (!colours.includes(colour)) continue;
    let length = 0;
    while (along + length <= last + 8 && read(along + length) === colour) length++;
    return { colour, width: length / s.scale };
  }
  return { colour: "none", width: 0 };
}

/**
 * The opaque colour `top` (a computed `rgb()` or `rgba()`) paints over the opaque `ground`: each channel
 * `alpha × top + (1 − alpha) × ground`, rounded, as `rgb(r, g, b)`.
 */
function over(top: string, ground: string): string {
  const channels = (colour: string): number[] => (colour.match(/[\d.]+/g) ?? []).map(Number);
  const [r = 0, g = 0, b = 0, alpha = 1] = channels(top);
  const [gr = 0, gg = 0, gb = 0] = channels(ground);
  const mix = (front: number, back: number): string => String(Math.round(alpha * front + (1 - alpha) * back));
  return `rgb(${mix(r, gr)}, ${mix(g, gg)}, ${mix(b, gb)})`;
}

const inkLight = tokenColour("color-ink", "light");
const insetLight = tokenColour("color-inset", "light");
const insetDark = tokenColour("color-inset", "dark");
const sheetLight = tokenColour("color-sheet", "light");
const sheetDark = tokenColour("color-sheet", "dark");
const accentLight = tokenColour("color-accent-strong", "light");
const accentDark = tokenColour("color-accent-strong", "dark");
const borderLight = tokenColour("color-control-border", "light");
const borderDark = tokenColour("color-control-border", "dark");
const focusLight = tokenColour("color-focus", "light");
const focusDark = tokenColour("color-focus", "dark");
const lineColours = [accentLight, borderLight, accentDark, borderDark];

/**
 * The field's lines, read from one screenshot of `#box` (US4-9, R-15): across the boundary between the text and the
 * Copy control at the control's middle height, and across the field's outer border above the control, beside its
 * inline end and above the text.
 */
async function fieldLines(driver: Driver, colours: readonly string[]): Promise<unknown> {
  const s = await shot(driver);
  const text = await driver.box("cf", '[part="value"]');
  const copy = await driver.box("cf", '[part="copy-control"]');
  const middle = copy.y + copy.height / 2;
  return {
    divider: lineRun(s, "x", middle, copy.x - 2, copy.x + 2, colours),
    top: lineRun(s, "y", copy.x + copy.width / 2, copy.y - 3, copy.y + 1, colours),
    end: lineRun(s, "x", middle, copy.x + copy.width - 1, copy.x + copy.width + 3, colours),
    textTop: lineRun(s, "y", text.x + text.width / 2, text.y - 3, text.y + 1, colours),
  };
}

/** The colour 3.5 CSS px outside the middle of each edge of the Copy control (inside the ring band, 2 to 5 px out): top, end, bottom, start. */
async function ringPixels(driver: Driver): Promise<string[]> {
  const s = await shot(driver);
  const copy = await driver.box("cf", '[part="copy-control"]');
  const out = 3.5;
  return [
    colourAt(s, copy.x + copy.width / 2, copy.y - out),
    colourAt(s, copy.x + copy.width + out, copy.y + copy.height / 2),
    colourAt(s, copy.x + copy.width / 2, copy.y + copy.height + out),
    colourAt(s, copy.x - out, copy.y + copy.height / 2),
  ];
}

/** The computed paint of the field: its outer border, the text's ground, the control's fill, divider and ink, the region's ink. */
async function fieldPaint(driver: Driver): Promise<unknown> {
  const side = (property: string): Promise<string> => partStyle(driver, "copy-control", property);
  return {
    text: { ground: await partStyle(driver, "value", "background-color"), ink: await partStyle(driver, "value", "color") },
    control: { fill: await side("background-color"), divider: `${await side("border-left-width")} ${await side("border-left-color")}`, ink: await side("color") },
  };
}

/** The local names of every element in the shadow root of `#cf`, in tree order. */
async function shadowElements(driver: Driver): Promise<string[]> {
  return (await driver.elements("cf")).map((part) => part.name);
}

/** Whether the page scrolls sideways, which of the field's elements scroll sideways, the number of lines the text lies on and whether the field ends inside the viewport. */
function overflow(): unknown {
  const host = document.getElementById("cf");
  const text = host?.shadowRoot?.querySelector<HTMLElement>('[part="value"]');
  if (host === null || text === null || text === undefined) return null;
  const parts = [host, ...host.shadowRoot?.querySelectorAll<HTMLElement>("*") ?? []];
  const range = document.createRange();
  range.selectNodeContents(text);
  return {
    sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    scrolling: parts.filter((each) => each.scrollWidth > each.clientWidth + 1 && each.clientWidth > 0).map((each) => each.localName),
    lines: new Set([...range.getClientRects()].filter((rect) => rect.width > 0).map((rect) => Math.round(rect.top))).size,
    inside: host.getBoundingClientRect().right <= document.documentElement.clientWidth,
  };
}

export const copyFieldScenarios: readonly CopyFieldScenario[] = [
  {
    // Plants: a monospace family on the text; no tabular figures; the well in another token; the icon labelled (an
    // image node in the tree) or missing; the control named by its icon.
    name: "US4-1: the text is drawn in Schibsted Grotesk with tabular figures on color-inset, the field is a group holding the text and a button named Copy showing the copy icon, decorative, and the empty live region (FR-032, FR-033, FR-040)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(withCommand));
      const icon = await inPage(() => {
        const button = document.getElementById("cf")?.shadowRoot?.querySelector('[part~="copy-control"]');
        const icons = [...(button?.querySelectorAll("ocelle-icon") ?? [])];
        return icons.map((each) => ({ name: each.getAttribute("name"), drawn: each.shadowRoot?.querySelector("svg") !== null && each.shadowRoot !== null, label: each.getAttribute("label") }));
      }, null);
      return {
        font: [await partStyle(driver, "value", "font-family"), await partStyle(driver, "value", "font-variant-numeric")],
        ground: await partStyle(driver, "value", "background-color"),
        icon,
        tree: await tree(driver),
      };
    },
    expected: { font: [fontFamily, "tabular-nums"], ground: insetLight, icon: [{ name: "copy", drawn: true, label: null }], tree: exposed() },
  },
  ...(["light", "dark"] as const).map(
    (theme): CopyFieldScenario => ({
      // Plants: `white-space: nowrap` or `pre` on the text; no `overflow-wrap: anywhere`; the field at a fixed inline size.
      name: `US4-2: in ${theme}, a 300-character command with no space at a 320 px viewport wraps onto several lines inside the field, no part of the field scrolls sideways, the page does not scroll sideways, and the whole command is the field's text (SC-004)`,
      fixture: true,
      run: async (driver, inPage) => {
        const start = await inPage(() => [window.innerWidth, window.innerHeight], null);
        await mount(driver, inPage, page(`value="${longCommand}"`));
        if (theme === "dark") await driver.theme("dark");
        await driver.setViewportSize(320, 640);
        const read = (await inPage(overflow, null)) as Record<string, unknown> | null;
        const observed = { overflow: read === null ? null : { ...read, lines: Number(read.lines) > 4 }, tree: await tree(driver) };
        await driver.setViewportSize(start[0] ?? 0, start[1] ?? 0);
        return observed;
      },
      expected: { overflow: { sideways: false, scrolling: [], lines: true, inside: true }, tree: exposed({ text: longCommand }) },
    }),
  ),
  {
    // Plants: `white-space: normal` (runs collapsed) on the text; the text trimmed.
    name: "FR-032: the text keeps its whitespace runs as written, leading and trailing ones included, and the request carries them, the text wrapping anywhere",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(""));
      await driver.setProperty("cf", "value", "  pnpm  run   build\ttwice  ");
      await inPage(recordRequests, null);
      await clickControl(driver, inPage);
      await inPage(frames, undefined);
      return {
        wrap: [await partStyle(driver, "value", "white-space"), await partStyle(driver, "value", "overflow-wrap")],
        shown: await inPage(() => document.getElementById("cf")?.shadowRoot?.querySelector('[part~="value"]')?.textContent ?? null, null),
        requests: await inPage(recordedRequests, null),
      };
    },
    expected: { wrap: ["pre-wrap", "anywhere"], shown: "  pnpm  run   build\ttwice  ", requests: [request("  pnpm  run   build\ttwice  ")] },
  },
  {
    // Plants: a `navigator.clipboard.writeText` call in the click handler; a `document.execCommand("copy")` call; two
    // requests per click; the request without `composed`.
    name: "US4-3: a click on the Copy control emits exactly one ocelle-copy-field-request with detail { text } the value exactly, bubbling, composed and not cancelable, and the page makes no clipboard call (SC-006)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(withCommand));
      await inPage(recordRequests, null);
      await clickControl(driver, inPage);
      await inPage(frames, undefined);
      return { requests: await inPage(recordedRequests, null), clipboard: await driver.clipboardCalls(), focused: await driver.focusedElement() };
    },
    expected: { requests: [request(command)], clipboard: [], focused: control },
  },
  {
    // Plant: `preventDefault()` on every keydown of the field.
    name: "US4-4: Tab reaches the Copy control after the button before the field; Enter emits one request and Space another; Escape and a letter are not handled (defaultPrevented false at the document) and emit nothing, beside Enter's request",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(withCommand));
      await inPage(recordRequests, null);
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      const focused = await driver.focusedElement();
      await driver.pressKeys("Enter");
      await inPage(frames, undefined);
      const enter = await inPage(recordedRequests, null);
      await driver.pressKeys(" ");
      await inPage(frames, undefined);
      const space = await inPage(recordedRequests, null);
      await driver.pressKeys("Escape");
      await driver.pressKeys("a");
      await inPage(frames, undefined);
      const keys = (await driver.keydownRecord()).filter((each) => each.key === "Escape" || each.key === "a");
      return { focused, enter, space, after: await inPage(recordedRequests, null), keys, still: await driver.focusedElement() };
    },
    expected: {
      focused: control,
      enter: [request(command)],
      space: [request(command), request(command)],
      after: [request(command), request(command)],
      keys: [
        { key: "Escape", defaultPrevented: false },
        { key: "a", defaultPrevented: false },
      ],
      still: control,
    },
  },
  {
    // Plants: setting the region's `textContent` unconditionally (a repeated set mutates it); the region in the Lit
    // template (the text copied a second time, or the region not written at once); the status shown outside the region.
    name: "US4-5: the region is present and empty from first render; a listener that sets status to Copied to clipboard on the request puts the text in the tree exactly once, as the content of the one polite status node inside the field after the Copy control; setting the same status again mutates nothing, beside the recorded mutation of the first set (FR-041, SC-006)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(withCommand));
      const first = await tree(driver);
      await inPage(recordRequests, null);
      await inPage(answerWith, copied);
      await inPage(watchRegion, null);
      await clickControl(driver, inPage);
      await inPage(frames, undefined);
      const set = { mutations: await inPage(regionMutations, null), tree: await tree(driver), region: await inPage(regionText, null), status: await inPage(statusOf, null) };
      await driver.setProperty("cf", "status", copied);
      await inPage(frames, undefined);
      const again = { mutations: await inPage(regionMutations, null), tree: await tree(driver) };
      const inside = await inPage(() => {
        const host = document.getElementById("cf")?.getBoundingClientRect();
        const region = document.getElementById("cf")?.shadowRoot?.querySelector('[role="status"]')?.getBoundingClientRect();
        if (host === undefined || region === undefined) return null;
        return region.height > 0 && region.left >= host.left && region.right <= host.right && region.top >= host.top && region.bottom <= host.bottom;
      }, null);
      return { first, set, again, inside, requests: (await inPage(recordedRequests, null)) as unknown[] };
    },
    expected: {
      first: exposed(),
      set: { mutations: [copied], tree: exposed({ status: copied }), region: copied, status: copied },
      again: { mutations: [], tree: exposed({ status: copied }) },
      inside: true,
      requests: [request(command)],
    },
  },
  {
    // Plants: synchronous dispatch; dispatch in a microtask (the frame then sees the host's text again, and the tree
    // records no empty update); dispatch inside the element's own `requestAnimationFrame` callback (the frame order
    // holds, the tree records no empty update); the status not cleared before the request.
    name: "US4-6: with a status shown and a synchronous host listener that sets the same text again, an activation clears the status before the request (the listener sees status and region empty), no request comes in the activation's task, the first animation frame after it runs with the region empty and no request yet, the request follows; the region goes from empty to the text again (a recorded mutation) and the tree records the region empty before it records the text (FR-035, R-07)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(withCommand));
      await driver.setProperty("cf", "status", copied);
      const record = await driver.activationRecord("cf", { request: "ocelle-copy-field-request", read: '[role="status"]', property: "status" });
      await inPage((text: string) => {
        const seen: unknown[] = [];
        (window as unknown as { __seen: unknown[] }).__seen = seen;
        const listener = (event: Event): void => {
          const field = event.target as HTMLElement & { status: string };
          seen.push({ status: field.status, region: field.shadowRoot?.querySelector('[role="status"]')?.textContent ?? null });
          field.status = text;
        };
        document.addEventListener("ocelle-copy-field-request", listener);
        const registry = window as unknown as { __copyFieldOff?: (() => void)[] };
        (registry.__copyFieldOff ??= []).push(() => {
          document.removeEventListener("ocelle-copy-field-request", listener);
        });
      }, copied);
      await inPage(watchRegion, null);
      const stop = await driver.axUpdates("cf");
      await clickControl(driver, inPage);
      const order = await record();
      await inPage(frames, undefined);
      const updates = (await stop()).filter((update) => update.role === "status").map((update) => update.text);
      const history = updates.filter((text, index) => index === 0 || text !== updates[index - 1]);
      return {
        order,
        seen: await inPage(() => (window as unknown as { __seen?: unknown[] }).__seen ?? [], null),
        mutations: await inPage(regionMutations, null),
        history,
        tree: await tree(driver),
        status: await inPage(statusOf, null),
      };
    },
    expected: {
      order: [
        { entry: "activation", requests: 0, text: copied, value: copied },
        { entry: "activation end", requests: 0, text: "", value: "" },
        { entry: "frame", requests: 0, text: "", value: "" },
        { entry: "request", requests: 0, text: "", value: "" },
      ],
      seen: [{ status: "", region: "" }],
      mutations: ["", copied],
      history: ["", copied],
      tree: exposed({ status: copied }),
      status: copied,
    },
  },
  {
    // Plant: a success colour or icon on a status set (a class or a fill keyed on `status`).
    name: "US4-7: a failure text set by the host is shown in the live region as in scenario 5, and the field draws no colour or icon of its own: its paint and its shadow elements are the same before and after the set",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(withCommand));
      const before = { paint: await fieldPaint(driver), elements: await shadowElements(driver), region: await driver.computedNode("cf", "color") };
      await inPage(answerWith, failed);
      await clickControl(driver, inPage);
      await inPage(frames, undefined);
      return { before, after: { paint: await fieldPaint(driver), elements: await shadowElements(driver), region: await driver.computedNode("cf", "color") }, tree: await tree(driver) };
    },
    expected: {
      before: {
        paint: { text: { ground: insetLight, ink: inkLight }, control: { fill: sheetLight, divider: `1px ${accentLight}`, ink: inkLight } },
        elements: ["div", "span", "button", "span", "span", "ocelle-icon", "span"],
        region: inkLight,
      },
      after: {
        paint: { text: { ground: insetLight, ink: inkLight }, control: { fill: sheetLight, divider: `1px ${accentLight}`, ink: inkLight } },
        elements: ["div", "span", "button", "span", "span", "ocelle-icon", "span"],
        region: inkLight,
      },
      tree: exposed({ status: failed }),
    },
  },
  {
    // Plants: `copy-label` not trimmed; a host `aria-label` forwarded to the control; the control unnamed with a blank
    // `copy-label`; the label read once at first render.
    name: "US4-8: copy-label names the Copy control, trimmed, and a later change follows; without it, blank or removed, it is named Copy; a host aria-label names the field's group, not the control (FR-034)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(`${withCommand} copy-label="  Copy command  "`));
      const labelled = await tree(driver);
      await driver.setProperty("cf", "copyLabel", "Copy the command");
      const changed = await tree(driver);
      await driver.setAttribute("cf", "copy-label", "   ");
      const blank = await tree(driver);
      await driver.setAttribute("cf", "copy-label", "Copy again");
      await driver.setAttribute("cf", "copy-label", null);
      const removed = await tree(driver);
      await mount(driver, inPage, page(`${withCommand} aria-label="Install command"`));
      return { labelled, changed, blank, removed, host: await tree(driver) };
    },
    expected: {
      labelled: exposed({ label: "Copy command" }),
      changed: exposed({ label: "Copy the command" }),
      blank: exposed(),
      removed: exposed(),
      host: exposed({ group: "Install command" }),
    },
  },
  {
    // Plants: the divider in `control-border`; two borders between the text and the control (the text's own end
    // border); a gap between the text and the control; no minimum size on the control; the control outside the field's
    // border.
    name: "US4-9: the Copy control is at least 44 px in both dimensions, flush against the text with no gap and one 1 px accent-strong line between them, inside the field's one 1 px control-border outer line; its part is copy-control, a button in the tree (FR-037, FR-038)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(withCommand));
      await driver.hoverTarget("away");
      const text = await driver.box("cf", '[part="value"]');
      const copy = await driver.box("cf", '[part="copy-control"]');
      return {
        size: { width: copy.width >= 44, height: copy.height >= 44 },
        flush: Math.abs(text.x + text.width - copy.x) < 0.01,
        sameHeight: Math.abs(text.height - copy.height) < 0.01 && Math.abs(text.y - copy.y) < 0.01,
        lines: await fieldLines(driver, lineColours),
        part: await inPage(() => (document.getElementById("cf")?.shadowRoot?.querySelectorAll('[part~="copy-control"]').length ?? 0) === 1, null),
        control: (await tree(driver)).filter((node) => node.role === "button"),
      };
    },
    expected: {
      size: { width: true, height: true },
      flush: true,
      sameHeight: true,
      lines: { divider: { colour: accentLight, width: 1 }, top: { colour: borderLight, width: 1 }, end: { colour: borderLight, width: 1 }, textTop: { colour: borderLight, width: 1 } },
      part: true,
      control: [{ role: "button", name: "Copy", disabled: false }],
    },
  },
  {
    // Plants: the focus ring as a `box-shadow` (no ring pixels once a neighbour paints); the ring in another token in
    // dark; no ring on keyboard focus.
    name: "US4-9: the keyboard-focused Copy control shows the token focus ring, a 3 px color-focus outline 2 px out, drawn just outside all four edges, in light and dark (FR-007)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(withCommand));
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      const outline = async (): Promise<string> => `${await partStyle(driver, "copy-control", "outline-style")} ${await partStyle(driver, "copy-control", "outline-width")} ${await partStyle(driver, "copy-control", "outline-offset")} ${await partStyle(driver, "copy-control", "outline-color")}`;
      const light = { focused: await driver.focusedElement(), outline: await outline(), pixels: await ringPixels(driver) };
      await driver.theme("dark");
      return { light, dark: { outline: await outline(), pixels: await ringPixels(driver) } };
    },
    expected: {
      light: { focused: control, outline: `solid 3px 2px ${focusLight}`, pixels: [focusLight, focusLight, focusLight, focusLight] },
      dark: { outline: `solid 3px 2px ${focusDark}`, pixels: [focusDark, focusDark, focusDark, focusDark] },
    },
  },
  {
    // Plants: the paint in other tokens in dark (the well, the control's fill, the divider, the outer border).
    name: "R-15: in dark the well is color-inset, the control color-sheet with its accent-strong divider and the outer line control-border, as in light",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(withCommand));
      await driver.theme("dark");
      await driver.hoverTarget("away");
      return { paint: await fieldPaint(driver), lines: await fieldLines(driver, lineColours) };
    },
    expected: {
      paint: { text: { ground: insetDark, ink: tokenColour("color-ink", "dark") }, control: { fill: sheetDark, divider: `1px ${accentDark}`, ink: tokenColour("color-ink", "dark") } },
      lines: { divider: { colour: accentDark, width: 1 }, top: { colour: borderDark, width: 1 }, end: { colour: borderDark, width: 1 }, textTop: { colour: borderDark, width: 1 } },
    },
  },
  {
    // Plant: ignoring `disabled` (the control enabled with an empty value).
    name: "US4-10: with value empty, or missing, the Copy control is exposed as disabled and a click on it emits nothing; paired with the same field once value is set, whose enabled control emits one request (FR-036)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page('value=""'));
      await inPage(recordRequests, null);
      const empty = await tree(driver);
      await clickControl(driver, inPage);
      await inPage(frames, undefined);
      const clickedEmpty = await inPage(recordedRequests, null);
      await driver.setAttribute("cf", "value", null);
      const missing = await tree(driver);
      await clickControl(driver, inPage);
      await inPage(frames, undefined);
      const clickedMissing = await inPage(recordedRequests, null);
      await driver.setProperty("cf", "value", command);
      const enabled = await tree(driver);
      await clickControl(driver, inPage);
      await inPage(frames, undefined);
      return { empty, clickedEmpty, missing, clickedMissing, enabled, requests: await inPage(recordedRequests, null) };
    },
    expected: {
      empty: exposed({ text: "", disabled: true }),
      clickedEmpty: [],
      missing: exposed({ text: "", disabled: true }),
      clickedMissing: [],
      enabled: exposed(),
      requests: [request(command)],
    },
  },
  {
    // Plants: `forced-color-adjust: none` on the field with the token lines kept (no system colour); the divider
    // dropped in forced colours; the icon in a token colour; the ring in a token colour.
    name: "US4-11: in forced colours the field's outer boundary and the line between the text and the Copy control are drawn in ButtonBorder, the copy icon in the control's ButtonText, and the focused control's ring in Highlight, read from pixels",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(withCommand));
      await driver.hoverTarget("away");
      await driver.forcedColors("active", "light");
      const buttonBorder = await driver.resolveColour("ButtonBorder");
      const buttonText = await driver.resolveColour("ButtonText");
      const buttonFace = await driver.resolveColour("ButtonFace");
      const highlight = await driver.resolveColour("Highlight");
      const canvas = await driver.resolveColour("Canvas");
      // The emulated palette's Highlight is translucent (rgba(5, 0, 73, 0.8) in Chromium 153), so the ring's pixels are
      // Highlight composited over the ground behind it; ButtonBorder and ButtonText are opaque, and in this palette
      // the same colour, so each read below is named by the system colour the spec states for it.
      const control = { fill: await partStyle(driver, "copy-control", "background-color"), ink: await partStyle(driver, "copy-control", "color") };
      const ground = over(control.fill, canvas);
      const runs = (await fieldLines(driver, [over(buttonBorder, canvas), over(buttonBorder, ground)])) as Record<string, Run>;
      const lines = Object.fromEntries(Object.entries(runs).map(([key, run]) => [key, { buttonBorder: run.colour === buttonBorder, width: run.width }]));
      const s = await shot(driver);
      const icon = await inPage(() => {
        const element = document.getElementById("cf")?.shadowRoot?.querySelector("ocelle-icon")?.getBoundingClientRect();
        return element === undefined ? null : { x: element.x, y: element.y, width: element.width, height: element.height };
      }, null);
      let iconInk = 0;
      if (icon !== null) for (let y = icon.y + 0.5; y < icon.y + icon.height; y += 1) for (let x = icon.x + 0.5; x < icon.x + icon.width; x += 1) if (colourAt(s, x, y) === over(buttonText, ground)) iconInk += 1;
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      const ring = (await ringPixels(driver)).map((colour) => colour === over(highlight, canvas));
      await driver.forcedColors("none");
      return {
        distinct: buttonBorder !== canvas && buttonText !== ground && over(highlight, canvas) !== canvas,
        control: { fill: control.fill === buttonFace, ink: control.ink === buttonText },
        lines,
        icon: iconInk > 4,
        ring,
      };
    },
    expected: {
      distinct: true,
      control: { fill: true, ink: true },
      lines: {
        divider: { buttonBorder: true, width: 1 },
        top: { buttonBorder: true, width: 1 },
        end: { buttonBorder: true, width: 1 },
        textTop: { buttonBorder: true, width: 1 },
      },
      icon: true,
      ring: [true, true, true, true],
    },
  },
  {
    // Plant: `user-select: none` on the text.
    name: "US4-12: a triple click with the pointer on the text selects it as ordinary text (the selection, trimmed of the line ends a triple click takes, is the command), beside the request that the field still emits for its Copy control",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(withCommand));
      await inPage(recordRequests, null);
      await clickText(driver, inPage, 3);
      const selected = await inPage(() => {
        const selection = document.getSelection();
        return selection === null ? null : selection.toString().trim();
      }, null);
      await clickControl(driver, inPage);
      await inPage(frames, undefined);
      return { selected, userSelect: await partStyle(driver, "value", "user-select"), requests: await inPage(recordedRequests, null) };
    },
    expected: { selected: command, userSelect: "auto", requests: [request(command)] },
  },
  {
    // Plants: the request's text read at dispatch rather than at the activation; one request for two activations.
    name: "FR-035: each activation emits one request with the value at the moment of activation: a host that changes value in the activation's task still gets the old text, and two activations give two requests, the two clicks of a double click within one frame included",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(withCommand));
      await inPage(recordRequests, null);
      await inPage(() => {
        document.addEventListener(
          "click",
          (event) => {
            const field = document.getElementById("cf") as (HTMLElement & { value: string }) | null;
            if (field !== null && event.composedPath().includes(field)) field.value = "pnpm run changed";
          },
          { once: true },
        );
      }, null);
      await clickControl(driver, inPage);
      await inPage(frames, undefined);
      const changed = await inPage(recordedRequests, null);
      await clickControl(driver, inPage);
      await clickControl(driver, inPage);
      await inPage(frames, undefined);
      const twice = await inPage(recordedRequests, null);
      await clickAt(driver, inPage, '[part~="copy-control"]', 2);
      await inPage(frames, undefined);
      return { changed, twice, double: await inPage(recordedRequests, null) };
    },
    expected: {
      changed: [request(command)],
      twice: [request(command), request("pnpm run changed"), request("pnpm run changed")],
      double: [request(command), request("pnpm run changed"), request("pnpm run changed"), request("pnpm run changed"), request("pnpm run changed")],
    },
  },
  {
    // Plant: no `isConnected` check before the dispatch.
    name: "FR-035: a field removed from the page in the activation's task emits no request, neither to the document nor to a listener on the field itself, beside its earlier activation that did",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(withCommand));
      await inPage(recordRequests, null);
      await inPage(() => {
        const field = document.getElementById("cf");
        const own: string[] = [];
        (window as unknown as { __own: string[] }).__own = own;
        field?.addEventListener("ocelle-copy-field-request", (event) => own.push(event.type));
      }, null);
      await clickControl(driver, inPage);
      await inPage(frames, undefined);
      const first = { document: await inPage(recordedRequests, null), own: await inPage(() => [...(window as unknown as { __own: string[] }).__own], null) };
      await inPage(() => {
        document.addEventListener(
          "click",
          (event) => {
            const field = document.getElementById("cf");
            if (field !== null && event.composedPath().includes(field)) field.remove();
          },
          { once: true },
        );
      }, null);
      await clickControl(driver, inPage);
      await inPage(frames, undefined);
      await inPage(frames, undefined);
      return {
        first,
        removed: await inPage(() => document.getElementById("cf") === null, null),
        after: { document: await inPage(recordedRequests, null), own: await inPage(() => [...(window as unknown as { __own: string[] }).__own], null) },
      };
    },
    expected: {
      first: { document: [request(command)], own: ["ocelle-copy-field-request"] },
      removed: true,
      after: { document: [request(command)], own: ["ocelle-copy-field-request"] },
    },
  },
  {
    // Plants: the status not shown when set without a request; a blank status shown; the field emitting on a status set.
    name: "Edge Cases: a status set with no request is shown in the live region like any status and emits nothing; a blank status shows nothing and leaves the region empty (FR-041, FR-043)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(withCommand));
      await inPage(recordRequests, null);
      await driver.setProperty("cf", "status", "Ready to copy");
      const proactive = { tree: await tree(driver), region: await inPage(regionText, null) };
      await driver.setProperty("cf", "status", "   ");
      await inPage(frames, undefined);
      return { proactive, blank: { tree: await tree(driver), region: await inPage(regionText, null) }, requests: await inPage(recordedRequests, null) };
    },
    expected: {
      proactive: { tree: exposed({ status: "Ready to copy" }), region: "Ready to copy" },
      blank: { tree: exposed(), region: "" },
      requests: [],
    },
  },
  {
    // Plants: clearing `status` on every `value` set (the first render's set included); not clearing on a later change;
    // clearing on a set of the same value; reflecting `status`.
    name: "Edge Cases: with value and status both in the markup, in either order, the status is shown at first render; a later value change clears it (the property reads empty, the region is emptied) while the status attribute stays as written; a set of the same value clears nothing; a new status attribute is read again (FR-042)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(`${withCommand} status="${copied}"`));
      const first = { tree: await tree(driver), status: await inPage(statusOf, null) };
      await driver.setProperty("cf", "value", command);
      const same = { status: await inPage(statusOf, null), region: await inPage(regionText, null) };
      await driver.setAttribute("cf", "value", "pnpm run build");
      const changed = { status: await inPage(statusOf, null), region: await inPage(regionText, null), attribute: await driver.attribute("cf", "status"), tree: await tree(driver) };
      await driver.setAttribute("cf", "status", "Copied again");
      const again = { status: await inPage(statusOf, null), region: await inPage(regionText, null) };
      await mount(driver, inPage, page(`status="${copied}" ${withCommand}`));
      return { first, same, changed, again, statusFirst: { tree: await tree(driver), status: await inPage(statusOf, null) } };
    },
    expected: {
      statusFirst: { tree: exposed({ status: copied }), status: copied },
      first: { tree: exposed({ status: copied }), status: copied },
      same: { status: copied, region: copied },
      changed: { status: "", region: "", attribute: copied, tree: exposed({ text: "pnpm run build" }) },
      again: { status: "Copied again", region: "Copied again" },
    },
  },
  {
    // Plant: the region in the Lit template (rendered from `status`): Lit batches a clear and a set of the same text in
    // one task into one update, and its text binding skips the unchanged value, so the region is never emptied (review
    // round 1, R1-01).
    name: "FR-041, FR-042: a clear and a set of the same status in one task, with no microtask checkpoint between them, empty the region and fill it again (a value change then the set; the host's own clear then the set), each recorded as a text mutation from the old text to empty and from empty to the text, beside a repeated set in a later task that mutates nothing",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(`${withCommand} status="${copied}"`));
      const watch = (): void => {
        const scope = window as unknown as { __old?: { observer: MutationObserver; records: (string | null)[] } };
        scope.__old?.observer.disconnect();
        const region = document.getElementById("cf")?.shadowRoot?.querySelector('[role="status"]');
        const record = { observer: new MutationObserver((list) => record.records.push(...list.map((each) => (each.type === "characterData" ? each.oldValue : each.type)))), records: [] as (string | null)[] };
        if (region !== null && region !== undefined) record.observer.observe(region, { subtree: true, childList: true, characterData: true, characterDataOldValue: true });
        scope.__old = record;
      };
      const taken = (): (string | null)[] => {
        const record = (window as unknown as { __old?: { observer: MutationObserver; records: (string | null)[] } }).__old;
        if (record === undefined) return ["not watched"];
        record.records.push(...record.observer.takeRecords().map((each) => (each.type === "characterData" ? each.oldValue : each.type)));
        return record.records.splice(0);
      };
      await inPage(watch, null);
      await inPage((text: string) => {
        const field = document.getElementById("cf") as HTMLElement & { value: string; status: string };
        field.value = "pnpm run build";
        field.status = text;
      }, copied);
      await inPage(frames, undefined);
      const valueChange = { oldValues: await inPage(taken, null), region: await inPage(regionText, null) };
      await inPage((text: string) => {
        const field = document.getElementById("cf") as HTMLElement & { status: string };
        field.status = "";
        field.status = text;
      }, copied);
      await inPage(frames, undefined);
      const hostClear = { oldValues: await inPage(taken, null), region: await inPage(regionText, null) };
      await driver.setProperty("cf", "status", copied);
      await inPage(frames, undefined);
      return { valueChange, hostClear, repeated: { oldValues: await inPage(taken, null), region: await inPage(regionText, null) }, tree: await tree(driver) };
    },
    expected: {
      valueChange: { oldValues: [copied, ""], region: copied },
      hostClear: { oldValues: [copied, ""], region: copied },
      repeated: { oldValues: [], region: copied },
      tree: exposed({ text: "pnpm run build", status: copied }),
    },
  },
  {
    // Plant: reflecting `status` (the attribute rewritten to the empty value by the request's clear).
    name: "Edge Cases: a status attribute written in the markup is not reflected: after a request clears status the property reads empty and the attribute stays as written (FR-042)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(`${withCommand} status="${copied}"`));
      await inPage(recordRequests, null);
      await clickControl(driver, inPage);
      await inPage(frames, undefined);
      return { status: await inPage(statusOf, null), region: await inPage(regionText, null), attribute: await driver.attribute("cf", "status"), requests: await inPage(recordedRequests, null) };
    },
    expected: { status: "", region: "", attribute: copied, requests: [request(command)] },
  },
  {
    // Plants: another default for `status` or `copyLabel` (the property read before any set); the mutation run's
    // survivors on the field initialisers (reviews/phase-5/notes.md).
    name: "the properties' defaults: with no attribute value and status read empty and copyLabel reads Copy, beside the control named Copy and the region empty",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(""));
      const defaults = await inPage(() => {
        const field = document.getElementById("cf") as unknown as Record<string, unknown> | null;
        return field === null ? null : [field.value, field.status, field.copyLabel];
      }, null);
      return { defaults, region: await inPage(regionText, null), tree: await tree(driver) };
    },
    expected: { defaults: ["", "", "Copy"], region: "", tree: exposed({ text: "", disabled: true }) },
  },
  {
    // Plants: the `status` attribute's removal not handled (the property reads null and the setter throws, or the
    // removal shows another text); the mutation run's survivors on `attributeChangedCallback` (reviews/phase-5/notes.md).
    name: "removing the status attribute clears the status: the property reads empty and the region is emptied, beside the status the attribute showed",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(`${withCommand} status="${copied}"`));
      const shown = { status: await inPage(statusOf, null), region: await inPage(regionText, null) };
      await driver.setAttribute("cf", "status", null);
      return { shown, removed: { status: await inPage(statusOf, null), region: await inPage(regionText, null), tree: await tree(driver) }, messages: await driver.messages() };
    },
    expected: { shown: { status: copied, region: copied }, removed: { status: "", region: "", tree: exposed() }, messages: [] },
  },
  {
    // Plant: reflecting `value` or `copyLabel`.
    name: "the value and copyLabel properties are not reflected: property sets show the text and name the control and leave the attributes as written",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(`value="old" copy-label="Copy old"`));
      await driver.setProperty("cf", "value", command);
      await driver.setProperty("cf", "copyLabel", "Copy command");
      return { attributes: [await driver.attribute("cf", "value"), await driver.attribute("cf", "copy-label")], tree: await tree(driver) };
    },
    expected: { attributes: ["old", "Copy old"], tree: exposed({ label: "Copy command" }) },
  },
  {
    // Plant: a `display` rule on `:host` that overrides `:host([hidden])`.
    name: "Edge Cases: host hidden removes the copy field, no box and no node; without it the field has a box and its nodes",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(withCommand));
      await driver.setAttribute("cf", "hidden", "");
      const box = await driver.box("cf");
      const hidden = { display: box.display, height: box.height, tree: await tree(driver) };
      await driver.setAttribute("cf", "hidden", null);
      const again = await driver.box("cf");
      return { hidden, shown: { display: again.display, boxed: again.height > 0, tree: await tree(driver) } };
    },
    expected: { hidden: { display: "none", height: 0, tree: [] }, shown: { display: "block", boxed: true, tree: exposed() } },
  },
  {
    // Plant: a `transition` on the control's paint (its focus ring or fill).
    name: "Edge Cases, motion: the Copy control and the text declare no transition or animation, beside the focus ring the control shows at once",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(withCommand));
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      return {
        ring: await partStyle(driver, "copy-control", "outline-color"),
        motion: [
          await partStyle(driver, "copy-control", "transition-duration"),
          await partStyle(driver, "copy-control", "animation-name"),
          await partStyle(driver, "value", "transition-duration"),
          await driver.computedNode("cf", "transition-duration"),
        ],
      };
    },
    expected: { ring: focusLight, motion: ["0s", "none", "0s", "0s"] },
  },
  {
    // Plant: the text's paint keyed on the control's state (the text dimmed when the control is disabled).
    name: "the disabled Copy control is drawn in color-disabled-ink while the text keeps color-ink, beside the enabled control in color-ink",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(""));
      const disabled = [await partStyle(driver, "copy-control", "color"), await partStyle(driver, "value", "color")];
      await driver.setProperty("cf", "value", command);
      return { disabled, enabled: [await partStyle(driver, "copy-control", "color"), await partStyle(driver, "value", "color")] };
    },
    expected: { disabled: [tokenColour("color-disabled-ink", "light"), inkLight], enabled: [inkLight, inkLight] },
  },
];

/** Clicks the centre of the Copy control with real mouse input (the control sits in the field's shadow root). */
async function clickControl(driver: Driver, inPage: InPage): Promise<void> {
  await clickAt(driver, inPage, '[part~="copy-control"]', 1);
}

/** Clicks the centre of the text `count` times with real mouse input. */
async function clickText(driver: Driver, inPage: InPage, count: number): Promise<void> {
  await clickAt(driver, inPage, '[part~="value"]', count);
}

/**
 * Clicks the centre of the element matching `inner` in `#cf`'s shadow root: the driver clicks the centre of a target it
 * can address (an id), so a probe element with an id is laid over that centre for the click, with `pointer-events:
 * none`, and the click (with `force`, so the probe need not receive it) lands on what lies beneath it. When the shadow
 * root holds no such element (the field did not render it), the probe is laid at the viewport's top end corner, away
 * from the field, and the click lands on nothing of it, which the body's assertions then report.
 */
async function clickAt(driver: Driver, inPage: InPage, inner: string, count: number): Promise<void> {
  await inPage((selector: string) => {
    const element = document.getElementById("cf")?.shadowRoot?.querySelector(selector);
    document.getElementById("probe")?.remove();
    const probe = document.createElement("div");
    probe.id = "probe";
    document.body.append(probe);
    const box = element?.getBoundingClientRect() ?? new DOMRect(document.documentElement.clientWidth - 4, 0, 2, 2);
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`#probe { position: fixed; left: ${String(box.left + box.width / 2 - 1)}px; top: ${String(box.top + box.height / 2 - 1)}px; inline-size: 2px; block-size: 2px; pointer-events: none; }`);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  }, inner);
  await driver.clickTarget("probe", { count, force: true });
}
