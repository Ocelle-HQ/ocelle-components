// The shared bodies of User Story 5's browser scenarios for `ocelle-link` (014 spec US5 scenarios 1 to 14 and the
// link's Edge Cases; FR-045 to FR-049; research.md R-08, R-11, R-15; contracts/elements.md § Pairings; T093). Each body
// mounts its page, acts with real keyboard and pointer input through the driver, sets up and reads what the driver has
// no command for with a self-contained function run in the page (`InPage`: the event and click recorders, the
// cancelling listener, the navigation state) and returns one observation; each harness asserts it equals `expected`,
// written by hand from the spec, the data model and research (colours from the token table of
// packages/tokens/test/expected.ts; sizes from the tokens: `--ocelle-focus-width` 3 px at `--ocelle-focus-offset` 2 px).
// Every "does not" outcome is observed in the same body as the positive outcome it guards, with the setup that makes it
// falsifiable; the plant that makes each fail is named beside the body and run once in reviews/phase-6/plants.md.
//
// Harnesses. The in-process harness (test/link.test.ts) runs the bodies with `fixtureOnly` false; the fixture harness
// (test/browser/link.test.ts) runs every body, on its own link.html page of the strict-CSP fixture, with the link
// target page link-target.html beside it. Outcomes that need a real cross-document navigation run on the fixture only
// (spec "The strict-CSP fixture"; research.md R-11 "Navigation in process"): in process the navigations are
// same-document fragments, read from `location.hash`, and `javascript:` hrefs whose body would set `window.__ran`.
//
// Observing navigation (spec US5 "Observing navigation"). `mount` sets a marker on `window` and remembers the page's URL.
// "The page navigates to U": the page is U, the marker is gone and the link target page's own text is present
// (`where`). "The page does not navigate": after the activation's task the URL is unchanged, the marker is still set,
// and no `securitypolicyviolation` event, dialog or console error occurred (the fixture harness asserts the console and
// the violations of the final document beside every body; the bodies read the first document's violations before
// their paired navigation). The activation events are recorded in `sessionStorage`, which survives a same-origin
// navigation, each with the marker and the fragment at dispatch, so "the event first, then the navigation" is read from
// the record after the navigation. Fixture bodies act through `Navigation`, whose activations wait for the end of the
// activation's task and for a navigation it started to load.
//
// The modifier activations (US5-13). Chromium on Linux, where these tests run, opens a new tab for Ctrl and a middle
// click and a new window for Shift; the Meta key there is not a new-tab modifier, and Chromium follows a Meta click on
// an `<a href>` in place (reviews/phase-6/notes.md). The element's part is the same for every modifier: it emits nothing
// and leaves the click's default alone (FR-046). For Meta, a click and Enter, the body asserts only that part, no event
// and the default not prevented, and nothing about the navigation that follows (operator decision 2 during phase 6,
// R1-01); it asserts the "no navigation in place" of a modified activation for Ctrl, Shift and the middle click.
import { tokenColour } from "./icon.ts";
import type { AxState, TargetClickOptions, Driver, InPage, Modifier, Pixels, DriverTarget } from "./driver.ts";

/**
 * What a fixture body uses to activate a link that may navigate, and to observe what the browser did beside the page:
 * `host` the fixture's `host:port`; `click` and `press` act with real input and then wait for the end of the
 * activation's task and for a navigation it started to load; `back` opens the fixture's link.html again; `opened` the
 * file names of the other pages the context opened (new tabs and windows); `dialogs` the dialogs the page opened.
 */
export interface Navigation {
  readonly host: string;
  click(target: DriverTarget, options?: TargetClickOptions): Promise<void>;
  press(key: string, modifiers?: readonly Modifier[]): Promise<void>;
  back(): Promise<void>;
  opened(): Promise<string[]>;
  dialogs(): Promise<string[]>;
}

/** One body: what it checks, what it must observe, and whether only the fixture harness runs it. */
export interface LinkScenario {
  readonly name: string;
  readonly run: (driver: Driver, inPage: InPage, navigation: Navigation) => Promise<unknown>;
  readonly expected: unknown;
  readonly fixtureOnly: boolean;
}

const text = "the mission log";
const label = "the mission log, opens in the viewer";
const longText = "the mission log of every selection element in this feature";

/** The page of most bodies: a button before the paragraph, the paragraph holding the link `#link`, a button after it, tall text below. */
function page(attributes: string, content = text): string {
  return `<button id="before" type="button">Before</button><p id="para">See <ocelle-link id="link" ${attributes}>${content}</ocelle-link> for details.</p><button id="after" type="button">After</button><p id="away">Away from the link</p>`;
}

/**
 * Mounts `markup`, pads `#para` and makes the page taller than the viewport, scrolls the page to its start, removes the
 * URL's fragment, sets the marker and remembers the URL. The listeners an earlier body installed are removed first (in
 * process the document outlives a mount), and the recorded events and clicks are cleared.
 */
async function mount(driver: Driver, inPage: InPage, markup: string, rules = ""): Promise<void> {
  await inPage(() => {
    const scope = window as unknown as { __linkOff?: (() => void)[]; __ran?: unknown };
    for (const off of (scope.__linkOff ?? []).splice(0)) off();
    delete scope.__ran;
    sessionStorage.removeItem("__linkEvents");
    sessionStorage.removeItem("__linkClicks");
  }, null);
  await driver.mount(markup);
  await driver.rules(`#para { padding: 12px; } #away { block-size: 3000px; } ${rules}`);
  await inPage(() => {
    window.scrollTo(0, 0);
    history.replaceState(history.state, "", location.pathname + location.search);
    const scope = window as unknown as { __marker?: boolean; __url?: string };
    scope.__marker = true;
    scope.__url = location.href;
  }, null);
}

/**
 * Records every `ocelle-link-activate` at the document in `sessionStorage`: its type, `detail` (a copy), `bubbles`,
 * `composed`, `cancelable`, the target's id, and the marker and the URL's fragment at dispatch (FR-002, FR-046).
 */
function recordEvents(): void {
  const listener = (event: Event): void => {
    const custom = event as CustomEvent<unknown>;
    const list = JSON.parse(sessionStorage.getItem("__linkEvents") ?? "[]") as unknown[];
    list.push({
      type: custom.type,
      detail: JSON.parse(JSON.stringify(custom.detail ?? null)) as unknown,
      bubbles: custom.bubbles,
      composed: custom.composed,
      cancelable: custom.cancelable,
      target: (custom.target as HTMLElement | null)?.id ?? null,
      marker: (window as unknown as { __marker?: boolean }).__marker === true,
      hash: location.hash,
    });
    sessionStorage.setItem("__linkEvents", JSON.stringify(list));
  };
  document.addEventListener("ocelle-link-activate", listener);
  const registry = window as unknown as { __linkOff?: (() => void)[] };
  (registry.__linkOff ??= []).push(() => {
    document.removeEventListener("ocelle-link-activate", listener);
  });
}

/** The events `recordEvents` recorded, in this document or before a navigation. */
function recordedEvents(): unknown {
  return JSON.parse(sessionStorage.getItem("__linkEvents") ?? "[]") as unknown;
}

/** An event as `recordEvents` records it, from `#link`, before any navigation, with the fragment `hash` at dispatch. */
function event(href: string | null, target = "link", hash = ""): unknown {
  return { type: "ocelle-link-activate", detail: { href }, bubbles: true, composed: true, cancelable: true, target, marker: true, hash };
}

/** Installs a document listener that cancels every `ocelle-link-activate`; the next `mount` removes it. */
function cancelEvents(): void {
  const listener = (event: Event): void => {
    event.preventDefault();
  };
  document.addEventListener("ocelle-link-activate", listener);
  const registry = window as unknown as { __linkOff?: (() => void)[] };
  (registry.__linkOff ??= []).push(() => {
    document.removeEventListener("ocelle-link-activate", listener);
  });
}

/**
 * Records every `click` and `auxclick` at the window in the bubble phase, after the element's own listeners, in
 * `sessionStorage`: its type, button, modifiers held and whether its default was prevented (US5-13).
 */
function recordClicks(): void {
  const listener = (event: Event): void => {
    const mouse = event as MouseEvent;
    const list = JSON.parse(sessionStorage.getItem("__linkClicks") ?? "[]") as unknown[];
    const held = [mouse.altKey ? "Alt" : "", mouse.ctrlKey ? "Control" : "", mouse.metaKey ? "Meta" : "", mouse.shiftKey ? "Shift" : ""].filter((key) => key !== "");
    list.push({ type: mouse.type, button: mouse.button, held, defaultPrevented: mouse.defaultPrevented });
    sessionStorage.setItem("__linkClicks", JSON.stringify(list));
  };
  window.addEventListener("click", listener);
  window.addEventListener("auxclick", listener);
  const registry = window as unknown as { __linkOff?: (() => void)[] };
  (registry.__linkOff ??= []).push(() => {
    window.removeEventListener("click", listener);
    window.removeEventListener("auxclick", listener);
  });
}

/** The clicks `recordClicks` recorded. */
function recordedClicks(): unknown {
  return JSON.parse(sessionStorage.getItem("__linkClicks") ?? "[]") as unknown;
}

/** A click as `recordClicks` records it. */
function click(held: readonly string[], defaultPrevented: boolean, type = "click", button = 0): unknown {
  return { type, button, held, defaultPrevented };
}

/**
 * Where the page is: whether its URL is the one `mount` remembered, its file name and fragment, whether the marker is
 * still set, whether a `javascript:` href ran, the link target page's own text (null on any other page) and the CSP
 * violations of this document.
 */
function where(): unknown {
  const scope = window as unknown as { __marker?: boolean; __url?: string; __ran?: unknown; __ocelleViolations?: unknown[] };
  return {
    same: scope.__url === location.href,
    page: location.pathname.split("/").pop() ?? "",
    hash: location.hash,
    marker: scope.__marker === true,
    ran: scope.__ran !== undefined,
    target: document.getElementById("target")?.textContent ?? null,
    violations: [...(scope.__ocelleViolations ?? [])],
  };
}

/** `where` on the fixture page that did not navigate, its fragment `hash`. */
function stayed(hash = ""): unknown {
  return { same: hash === "", page: "link.html", hash, marker: true, ran: false, target: null, violations: [] };
}

/** `where` on the fixture's link target page after a navigation. */
const arrived = { same: false, page: "link-target.html", hash: "", marker: false, ran: false, target: "The link target page", violations: [] };

/** `where` in process, as `stayed` on the fixture, without the page's file name. */
function stayedHere(): unknown {
  return (window as unknown as { __marker?: boolean; __url?: string; __ran?: unknown }).__url === location.href;
}

/** An exposed node as the scenarios state it. */
interface Exposed {
  readonly role: string;
  readonly name: string;
}

/**
 * The accessibility subtree of `#para` in tree order: every node except unnamed generic structure (a generic or a
 * group with an empty name).
 */
async function tree(driver: Driver, id = "para"): Promise<Exposed[]> {
  const nodes = await driver.axStates(id, "subtree");
  return nodes.filter((node: AxState) => !((node.role === "generic" || node.role === "group") && node.name === "")).map((node) => ({ role: node.role, name: node.name }));
}

/** The paragraph's tree: the text before, the link named `name` holding `content`, the text after. */
function paragraph(name = text, content = text): Exposed[] {
  return [
    { role: "paragraph", name: "" },
    { role: "StaticText", name: "See " },
    { role: "link", name },
    { role: "StaticText", name: content },
    { role: "StaticText", name: " for details." },
  ];
}

/** The named nodes of a tree other than its text: the nodes that carry an accessible name of their own. */
function named(nodes: readonly Exposed[]): Exposed[] {
  return nodes.filter((node) => node.role !== "StaticText" && node.name !== "");
}

const linkFocus = { host: "link", part: "anchor" };

/** The attributes of the anchor in `#link`'s shadow root that the element sets, or "no anchor". */
async function anchor(driver: Driver, id = "link"): Promise<unknown> {
  const parts = await driver.elements(id);
  const found = parts.find((part) => (part.attributes.part ?? "").split(" ").includes("anchor"));
  if (found === undefined) return "no anchor";
  const read = (name: string): string | null => found.attributes[name] ?? null;
  return { name: found.name, href: read("href"), role: read("role"), tabindex: read("tabindex"), label: read("aria-label") };
}

/** The computed `property` of `#link`'s anchor part, or "no part" when its shadow root holds none. */
async function anchorStyle(driver: Driver, property: string, id = "link"): Promise<string> {
  const parts = await driver.elements(id);
  return parts.some((part) => (part.attributes.part ?? "").split(" ").includes("anchor")) ? driver.computedPart(id, "anchor", property) : "no part";
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

/** A screenshot of `#para`, with its place in the viewport and its device-pixel scale. */
interface Shot {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly image: Pixels;
}

async function shot(driver: Driver): Promise<Shot> {
  const box = await driver.box("para");
  const image = await driver.pixels("para");
  return { x: box.x, y: box.y, scale: image.width / box.width, image };
}

function colourAt(s: Shot, cssX: number, cssY: number): string {
  const offset = (Math.floor((cssY - s.y) * s.scale) * s.image.width + Math.floor((cssX - s.x) * s.scale)) * 4;
  return `rgb(${String(s.image.data[offset])}, ${String(s.image.data[offset + 1])}, ${String(s.image.data[offset + 2])})`;
}

/**
 * Whether a fragment of the link is underlined in `colour`: some pixel row inside the fragment's box has at least 60% of
 * its pixels in `colour` (glyph rows never come close; the underline runs the fragment's width).
 */
function underlined(s: Shot, rect: { x: number; y: number; width: number; height: number }, colour: string): boolean {
  const left = Math.ceil((rect.x - s.x) * s.scale);
  const right = Math.floor((rect.x + rect.width - s.x) * s.scale);
  const top = Math.ceil((rect.y - s.y) * s.scale);
  const bottom = Math.floor((rect.y + rect.height - s.y) * s.scale);
  for (let y = top; y < bottom; y++) {
    let count = 0;
    for (let x = left; x < right; x++) {
      const offset = (y * s.image.width + x) * 4;
      if (`rgb(${String(s.image.data[offset])}, ${String(s.image.data[offset + 1])}, ${String(s.image.data[offset + 2])})` === colour) count += 1;
    }
    if (right > left && count / (right - left) >= 0.6) return true;
  }
  return false;
}

/**
 * The colour 3.5 CSS px outside each fragment of the link (inside the ring band, 2 to 5 px out), per fragment: before
 * its inline start and after its inline end at its middle height, and above the first fragment and below the last at
 * their middle (R-15 "Per-fragment ring").
 */
async function ringPixels(driver: Driver): Promise<unknown> {
  const s = await shot(driver);
  const rects = await driver.lines("link");
  const out = 3.5;
  const first = rects[0];
  const last = rects.at(-1);
  return {
    fragments: rects.length,
    sides: rects.map((rect) => [colourAt(s, rect.x - out, rect.y + rect.height / 2), colourAt(s, rect.x + rect.width + out, rect.y + rect.height / 2)]),
    top: first === undefined ? "none" : colourAt(s, first.x + first.width / 2, first.y - out),
    bottom: last === undefined ? "none" : colourAt(s, last.x + last.width / 2, last.y + last.height + out),
  };
}

/** Whether every fragment of the link is underlined in `colour`, and the number of fragments. */
async function underlines(driver: Driver, colour: string): Promise<unknown> {
  const s = await shot(driver);
  const rects = await driver.lines("link");
  return { fragments: rects.length, underlined: rects.map((rect) => underlined(s, rect, colour)) };
}

/** The number of pixels of `#link`'s first fragment in `colour`. */
async function inkPixels(driver: Driver, colour: string): Promise<number> {
  const s = await shot(driver);
  const [rect] = await driver.lines("link");
  if (rect === undefined) return 0;
  let count = 0;
  for (let y = rect.y + 0.25; y < rect.y + rect.height; y += 0.5) for (let x = rect.x + 0.25; x < rect.x + rect.width; x += 0.5) if (colourAt(s, x, y) === colour) count += 1;
  return count;
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

const linkLight = tokenColour("color-link", "light");
const linkDark = tokenColour("color-link", "dark");
const linkHoverLight = tokenColour("color-link-hover", "light");
const linkHoverDark = tokenColour("color-link-hover", "dark");
const focusLight = tokenColour("color-focus", "light");
const focusDark = tokenColour("color-focus", "dark");

/** Tabs from the button before the paragraph onto the link. */
async function tabToLink(driver: Driver): Promise<void> {
  await driver.focus("before");
  await driver.pressKeys("Tab");
}

/** The page of US5-9: the four refused hrefs as links `#j1` to `#j4`, and the link target page's link `#go`. */
const refused = ["javascript:alert(1)", " javascript:alert(1)", "java\tscript:alert(1)", "data:text/html,x"];

function refusedPage(hrefs: readonly string[]): string {
  const links = hrefs.map((href, index) => `<ocelle-link id="j${String(index + 1)}" href="${href}">refused ${String(index + 1)}</ocelle-link>`).join(" ");
  return `<button id="before" type="button">Before</button><p id="para">${links} <ocelle-link id="go" href="link-target.html">the target</ocelle-link></p><p id="away">Away</p>`;
}

/** The in-process US5-9 hrefs: the padded and tab-split `javascript:` forms, whose body would set `window.__ran`. */
const refusedHere = ["javascript:void(window.__ran=1)", " javascript:void(window.__ran=2)", "java\tscript:void(window.__ran=3)", "\n JAVASCRIPT:void(window.__ran=4)"];

/** The page of US5-14: the link to `#section-2`, a spacer, and the section lower in the page. */
function fragmentPage(href: string): string {
  return `<button id="before" type="button">Before</button><p id="para">See <ocelle-link id="link" href="${href}">the second section</ocelle-link> for details.</p><div id="spacer"></div><p id="section-2">The second section</p>`;
}

export const linkScenarios: readonly LinkScenario[] = [
  {
    // Plants: the link in another token (ink) or not underlined; no hover rule; the anchor not in the tab order; the
    // host named or given a role (a second node).
    name: "US5-1: a link in a paragraph is exposed as a link named by its text inside the paragraph's text, is in the tab order, is drawn inline in color-link with an underline, and in color-link-hover under the pointer",
    fixtureOnly: false,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(""));
      const nodes = await tree(driver);
      await tabToLink(driver);
      const focused = await driver.focusedElement();
      const host = await driver.computed("link", "display");
      await driver.pressKeys("Tab");
      const next = await driver.focusedElement();
      await driver.hoverTarget("before");
      const rest = { colour: await anchorStyle(driver, "color"), decoration: await anchorStyle(driver, "text-decoration-line"), underline: await underlines(driver, linkLight) };
      await driver.hoverTarget("link");
      const hovered = { colour: await anchorStyle(driver, "color"), underline: await underlines(driver, linkHoverLight), ink: (await inkPixels(driver, linkHoverLight)) > 4 };
      return { tree: nodes, focused, host, next, rest, hovered };
    },
    expected: {
      tree: paragraph(),
      focused: linkFocus,
      host: "inline",
      next: { id: "after" },
      rest: { colour: linkLight, decoration: "underline", underline: { fragments: 1, underlined: [true] } },
      hovered: { colour: linkHoverLight, underline: { fragments: 1, underlined: [true] }, ink: true },
    },
  },
  {
    // Plants: the paint in other tokens in dark (the link, the hover).
    name: "R-15: in dark the link is drawn in the dark color-link with an underline, and in the dark color-link-hover under the pointer",
    fixtureOnly: false,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(""));
      await driver.theme("dark");
      await driver.hoverTarget("before");
      const rest = { colour: await anchorStyle(driver, "color"), underline: await underlines(driver, linkDark) };
      await driver.hoverTarget("link");
      return { rest, hovered: { colour: await anchorStyle(driver, "color"), underline: await underlines(driver, linkHoverDark) } };
    },
    expected: {
      rest: { colour: linkDark, underline: { fragments: 1, underlined: [true] } },
      hovered: { colour: linkHoverDark, underline: { fragments: 1, underlined: [true] } },
    },
  },
  {
    // Plants: activation on the native click only (Enter on an anchor without href fires no click); the event not
    // cancelable, not composed or not bubbling; Space handled on the link (`preventDefault()` on its keydown);
    // navigating on every activation (in process: a `location.assign` of a null target throws, or of the page URL
    // reloads the frame).
    name: "US5-2: with the link focused, Enter emits one ocelle-link-activate with detail { href: null }, bubbling, composed and cancelable, and the page does not navigate; Space is not handled: no event, its keydown not prevented and the page scrolls, beside Enter's event",
    fixtureOnly: false,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(""));
      await inPage(recordEvents, null);
      await tabToLink(driver);
      await driver.pressKeys("Enter");
      await inPage(frames, undefined);
      const enter = { events: await inPage(recordedEvents, null), stayed: await inPage(stayedHere, null), marker: await inPage(() => (window as unknown as { __marker?: boolean }).__marker === true, null) };
      await driver.pressKeys(" ");
      await inPage(frames, undefined);
      const keys = (await driver.keydownRecord()).filter((key) => key.key === "Enter" || key.key === " ");
      return { enter, space: { events: await inPage(recordedEvents, null), scrolled: (await driver.scrollOffset()).y > 0, focused: await driver.focusedElement() }, keys };
    },
    expected: {
      enter: { events: [event(null)], stayed: true, marker: true },
      space: { events: [event(null)], scrolled: true, focused: linkFocus },
      keys: [
        { key: "Enter", defaultPrevented: false },
        { key: " ", defaultPrevented: false },
      ],
    },
  },
  {
    // Plants: no click handler (the click emits nothing); two events per click; the click's default not prevented.
    name: "US5-3: a click on the link without href emits one ocelle-link-activate with detail { href: null } and the page does not navigate; the element prevents the click's default (read at the window in the bubble phase)",
    fixtureOnly: false,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(""));
      await inPage(recordEvents, null);
      await inPage(recordClicks, null);
      await driver.clickTarget("link");
      await inPage(frames, undefined);
      return { events: await inPage(recordedEvents, null), clicks: await inPage(recordedClicks, null), stayed: await inPage(stayedHere, null) };
    },
    expected: { events: [event(null)], clicks: [click([], true)], stayed: true },
  },
  {
    // Plants: the event dispatched after the navigation or not at all; no `location.assign`; the target resolved
    // against something other than the document's base.
    name: "US5-4: on the fixture, Enter on <ocelle-link href=link-target.html> with no listener cancelling emits one ocelle-link-activate with { href: link-target.html } first (dispatched on the first page), then the page navigates to the link target page; a plain click does the same",
    fixtureOnly: true,
    run: async (driver, inPage, navigation) => {
      await mount(driver, inPage, page('href="link-target.html"'));
      await inPage(recordEvents, null);
      await tabToLink(driver);
      await navigation.press("Enter");
      const enter = { where: await inPage(where, null), events: await inPage(recordedEvents, null) };
      await navigation.back();
      await mount(driver, inPage, page('href="link-target.html"'));
      await inPage(recordEvents, null);
      await navigation.click("link");
      return { enter, click: { where: await inPage(where, null), events: await inPage(recordedEvents, null) } };
    },
    expected: {
      enter: { where: arrived, events: [event("link-target.html")] },
      click: { where: arrived, events: [event("link-target.html")] },
    },
  },
  {
    // Plant: ignoring `defaultPrevented` (navigating after a cancelled event).
    name: "US5-5: on the fixture, with a listener that cancels the event, Enter and a click on <ocelle-link href=link-target.html> each emit the event and the page does not navigate, beside the same link's navigation once no listener cancels",
    fixtureOnly: true,
    run: async (driver, inPage, navigation) => {
      await mount(driver, inPage, page('href="link-target.html"'));
      await inPage(recordEvents, null);
      await inPage(cancelEvents, null);
      await tabToLink(driver);
      await navigation.press("Enter");
      await navigation.click("link");
      const cancelled = { where: await inPage(where, null), events: await inPage(recordedEvents, null), dialogs: await navigation.dialogs() };
      await mount(driver, inPage, page('href="link-target.html"'));
      await inPage(recordEvents, null);
      await navigation.click("link");
      return { cancelled, uncancelled: { where: await inPage(where, null), events: await inPage(recordedEvents, null) } };
    },
    expected: {
      cancelled: { where: stayed(), events: [event("link-target.html"), event("link-target.html")], dialogs: [] },
      uncancelled: { where: arrived, events: [event("link-target.html")] },
    },
  },
  ...(["light", "dark"] as const).map(
    (theme): LinkScenario => ({
      // Plants: the link as `display: inline-block` (one box, one ring: the text no longer wraps as two fragments); the
      // ring as a `box-shadow`; the ring in another token; no ring on keyboard focus.
      name: `US5-6: in ${theme}, a link that wraps across two lines in a narrow paragraph, focused by keyboard, has its 3 px color-focus outline 2 px out drawn around each line's fragment: before and after each fragment, above the first and below the last (FR-048)`,
      fixtureOnly: false,
      run: async (driver, inPage) => {
        await mount(driver, inPage, page("", longText), "#para { inline-size: 220px; }");
        if (theme === "dark") await driver.theme("dark");
        await driver.hoverTarget("before");
        await tabToLink(driver);
        const outline = `${await anchorStyle(driver, "outline-style")} ${await anchorStyle(driver, "outline-width")} ${await anchorStyle(driver, "outline-offset")} ${await anchorStyle(driver, "outline-color")}`;
        const ring = (await ringPixels(driver)) as { fragments: number; sides: string[][]; top: string; bottom: string };
        return { focused: await driver.focusedElement(), outline, ring: { fragments: ring.fragments >= 2, sides: ring.sides.slice(0, 2), top: ring.top, bottom: ring.bottom } };
      },
      expected: {
        focused: linkFocus,
        outline: `solid 3px 2px ${theme === "light" ? focusLight : focusDark}`,
        ring: {
          fragments: true,
          sides: [
            [theme === "light" ? focusLight : focusDark, theme === "light" ? focusLight : focusDark],
            [theme === "light" ? focusLight : focusDark, theme === "light" ? focusLight : focusDark],
          ],
          top: theme === "light" ? focusLight : focusDark,
          bottom: theme === "light" ? focusLight : focusDark,
        },
      },
    }),
  ),
  {
    // Plants: `forced-color-adjust: none` on the anchor with the token colour kept; the underline removed in forced
    // colours; the ring removed in forced colours. The ring's `outline-color: Highlight` swapped for the token colour
    // alone does not bite: it is equivalent in Chromium, which forces an author outline colour to the system colour in
    // forced colours unless `forced-color-adjust: none` is set (reviews/phase-6/plants.md, T115).
    name: "US5-7: in forced colours the link with and without href is drawn in the system LinkText colour, underlined, and its keyboard focus ring is visible in Highlight on both sides of the fragment, read from pixels",
    fixtureOnly: false,
    run: async (driver, inPage) => {
      // The link is spaced from its neighbours, so their glyphs sit clear of the ring band and the ring samples 3.5 px
      // out do not depend on how the machine antialiases text: with subpixel text (CI) the coloured fringe of the "e"
      // in "See " moved the left sample under the translucent Highlight ring (landing L1-01, O3-01).
      await mount(driver, inPage, page(""), "#link { margin-inline: 0.75em; }");
      await driver.hoverTarget("before");
      await driver.forcedColors("active", "light");
      const linkText = await driver.resolveColour("LinkText");
      const highlight = await driver.resolveColour("Highlight");
      const canvas = await driver.resolveColour("Canvas");
      const plain = { colour: (await anchorStyle(driver, "color")) === linkText, underline: await underlines(driver, linkText), ink: (await inkPixels(driver, linkText)) > 10 };
      await tabToLink(driver);
      const ring = (await ringPixels(driver)) as { sides: string[][] };
      const focusedRing = (ring.sides[0] ?? []).map((colour) => colour === over(highlight, canvas));
      await driver.setAttribute("link", "href", "#nav-1");
      await driver.hoverTarget("before");
      const withHref = { colour: (await anchorStyle(driver, "color")) === linkText, underline: await underlines(driver, linkText) };
      await driver.forcedColors("none");
      return { distinct: linkText !== canvas && over(highlight, canvas) !== canvas, plain, ring: focusedRing, withHref };
    },
    expected: {
      distinct: true,
      plain: { colour: true, underline: { fragments: 1, underlined: [true] }, ink: true },
      ring: [true, true],
      withHref: { colour: true, underline: { fragments: 1, underlined: [true] } },
    },
  },
  {
    // Plants: `label` set as the host's `aria-label` instead of the anchor's (a named generic around a link named by its
    // text: two named nodes); `label` not trimmed; the label read once at first render; a blank label naming the link
    // "" (no fall back to the text).
    name: "US5-8: a label that starts with the visible text names the link, with exactly one named node in the paragraph, the link itself; a later label change is followed; a blank or removed label leaves the link named by its text, as a link with no label is (FR-045)",
    fixtureOnly: false,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(""));
      const plain = await tree(driver);
      await mount(driver, inPage, page(`label="  ${label}  "`));
      const labelled = { tree: await tree(driver), anchor: await anchor(driver), host: await driver.attribute("link", "aria-label") };
      await driver.setProperty("link", "label", "the mission log, opens in the side viewer");
      const changed = await tree(driver);
      await driver.setAttribute("link", "label", "   ");
      const blank = { tree: await tree(driver), anchor: await anchor(driver) };
      await driver.setAttribute("link", "label", label);
      await driver.setAttribute("link", "label", null);
      return { plain, labelled: { ...labelled, named: named(labelled.tree) }, changed: named(changed), blank, removed: await tree(driver), attribute: await driver.attribute("link", "label") };
    },
    expected: {
      plain: paragraph(),
      labelled: { tree: paragraph(label), anchor: { name: "a", href: null, role: "link", tabindex: "0", label }, host: null, named: [{ role: "link", name: label }] },
      changed: [{ role: "link", name: "the mission log, opens in the side viewer" }],
      blank: { tree: paragraph(), anchor: { name: "a", href: null, role: "link", tabindex: "0", label: null } },
      removed: paragraph(),
      attribute: null,
    },
  },
  {
    // Plant: forwarding the host `aria-label` to `part="anchor"` (at first render, or on a later change); the element
    // removing or rewriting the host's `aria-label`.
    name: "US5-8: a host aria-label does not name the link: beside label the link is named from label, also after the host changes its aria-label, and with no label the link is named by its text; no link is named by the host aria-label, which reads as the host wrote it; paired with the link named from its text alone (FR-045)",
    fixtureOnly: false,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(""));
      const plain = named(await tree(driver));
      await mount(driver, inPage, page(`label="${label}" aria-label="Other name"`));
      const beside = { links: (await tree(driver)).filter((node) => node.role === "link"), host: await driver.attribute("link", "aria-label") };
      await driver.setAttribute("link", "aria-label", "Changed name");
      const changed = { links: (await tree(driver)).filter((node) => node.role === "link"), host: await driver.attribute("link", "aria-label"), anchor: await anchor(driver) };
      await mount(driver, inPage, page('aria-label="Other name"'));
      const alone = { links: (await tree(driver)).filter((node) => node.role === "link"), host: await driver.attribute("link", "aria-label"), anchor: await anchor(driver) };
      return { plain, beside, changed, alone };
    },
    expected: {
      plain: [{ role: "link", name: text }],
      beside: { links: [{ role: "link", name: label }], host: "Other name" },
      changed: { links: [{ role: "link", name: label }], host: "Changed name", anchor: { name: "a", href: null, role: "link", tabindex: "0", label } },
      alone: { links: [{ role: "link", name: text }], host: "Other name", anchor: { name: "a", href: null, role: "link", tabindex: "0", label: null } },
    },
  },
  {
    // Plants: deciding on the written string (the padded and tab-split forms pass a `startsWith("javascript:")` check);
    // navigating on every activation (the `javascript:` body runs and sets `window.__ran`); no fragment navigation (the
    // pair fails).
    name: "US5-9, in process: Enter and a plain click on links whose href is javascript: (plain, padded with spaces, with a tab inside the scheme, padded with a newline and in capitals) each emit the event with the href exactly as written and run nothing, beside a fragment link whose activation navigates to its fragment",
    fixtureOnly: false,
    run: async (driver, inPage) => {
      const links = refusedHere.map((href, index) => `<ocelle-link id="j${String(index + 1)}" href="${href}">refused ${String(index + 1)}</ocelle-link>`).join(" ");
      await mount(driver, inPage, `<button id="before" type="button">Before</button><p id="para">${links} <ocelle-link id="go" href="#nav-1">to the first section</ocelle-link></p><p id="nav-1">The first section</p><p id="away">Away</p>`);
      await inPage(recordEvents, null);
      for (const id of ["j1", "j2", "j3", "j4"]) {
        await driver.focus(id);
        await driver.pressKeys("Enter");
        await driver.clickTarget(id);
      }
      await inPage(frames, undefined);
      const refusedState = { stayed: await inPage(stayedHere, null), state: (await inPage(where, null)) as Record<string, unknown> };
      await driver.clickTarget("go");
      await inPage(frames, undefined);
      const after = (await inPage(where, null)) as Record<string, unknown>;
      return {
        refused: { stayed: refusedState.stayed, hash: refusedState.state.hash, ran: refusedState.state.ran, marker: refusedState.state.marker },
        events: await inPage(recordedEvents, null),
        pair: { hash: after.hash, marker: after.marker, ran: after.ran },
      };
    },
    expected: {
      refused: { stayed: true, hash: "", ran: false, marker: true },
      events: [...refusedHere.flatMap((href, index) => [event(href, `j${String(index + 1)}`), event(href, `j${String(index + 1)}`)]), event("#nav-1", "go")],
      pair: { hash: "#nav-1", marker: true, ran: false },
    },
  },
  {
    // Plants: deciding on the written string; navigating on every activation (the `data:` and `javascript:` targets are
    // then blocked by the browser and the policy, a violation, a dialog or a console error).
    name: "US5-9, on the fixture: Enter and a plain click on javascript:alert(1), its padded form, its form with a tab inside the scheme and data:text/html,x each emit the event with the href exactly as written, and the page does not navigate (no violation, no dialog), beside the link target page's link, whose activation navigates",
    fixtureOnly: true,
    run: async (driver, inPage, navigation) => {
      await mount(driver, inPage, refusedPage(refused));
      await inPage(recordEvents, null);
      for (const id of ["j1", "j2", "j3", "j4"]) {
        await driver.focus(id);
        await navigation.press("Enter");
        await navigation.click(id);
      }
      const before = { where: await inPage(where, null), dialogs: await navigation.dialogs() };
      await navigation.click("go");
      return { before, events: await inPage(recordedEvents, null), after: await inPage(where, null) };
    },
    expected: {
      before: { where: stayed(), dialogs: [] },
      events: [...refused.flatMap((href, index) => [event(href, `j${String(index + 1)}`), event(href, `j${String(index + 1)}`)]), event("link-target.html", "go")],
      after: arrived,
    },
  },
  {
    // Plant: deciding on the written string (a protocol-relative href has no `http:` written).
    name: "US5-10: on the fixture, a protocol-relative href naming the fixture's own host emits the event with the href as written and the page navigates to the link target page (it resolves to the document's http: protocol)",
    fixtureOnly: true,
    run: async (driver, inPage, navigation) => {
      const href = `//${navigation.host}/link-target.html`;
      await mount(driver, inPage, page(`href="${href}"`));
      await inPage(recordEvents, null);
      await navigation.click("link");
      const events = (await inPage(recordedEvents, null)) as { detail: { href: string } }[];
      return { where: await inPage(where, null), events: events.map((each) => ({ ...each, detail: { href: each.detail.href === href ? "as written" : each.detail.href } })) };
    },
    expected: { where: arrived, events: [{ ...(event("") as object), detail: { href: "as written" } }] },
  },
  {
    // Plants: deciding on the document URL rather than the base (`x` against the page is http:); resolving once at render
    // rather than at each activation; the anchor's href not refreshed at the activation's first event (the native
    // navigation to kitty-app:, a console error).
    name: "US5-11: on the fixture, with <base href=kitty-app://app/> inserted after the element loaded (document.baseURI reads it), Enter and a click on <ocelle-link href=x> each emit { href: x } and the page does not navigate; with the base removed (document.baseURI the fixture's URL again) the link target page's link navigates",
    fixtureOnly: true,
    run: async (driver, inPage, navigation) => {
      await mount(driver, inPage, `<button id="before" type="button">Before</button><p id="para">See <ocelle-link id="link" href="x">the app view</ocelle-link> and <ocelle-link id="go" href="link-target.html">the target</ocelle-link>.</p><p id="away">Away</p>`);
      await inPage(recordEvents, null);
      const base = await inPage(() => {
        const element = document.createElement("base");
        element.id = "kitty-base";
        element.href = "kitty-app://app/";
        document.head.prepend(element);
        return document.baseURI;
      }, null);
      await driver.focus("link");
      await navigation.press("Enter");
      await navigation.click("link");
      const withBase = { where: await inPage(where, null), dialogs: await navigation.dialogs() };
      const removed = await inPage(() => {
        document.getElementById("kitty-base")?.remove();
        return document.baseURI.split("/").pop() ?? "";
      }, null);
      await navigation.click("go");
      return { base, withBase, removed, events: await inPage(recordedEvents, null), after: await inPage(where, null) };
    },
    expected: {
      base: "kitty-app://app/",
      withBase: { where: stayed(), dialogs: [] },
      removed: "link.html",
      events: [event("x"), event("x"), event("link-target.html", "go")],
      after: arrived,
    },
  },
  {
    // Plants: the anchor's state not refreshed at the activation's first event (the `pointerdown` of a click, the
    // `keydown` of Enter): the anchor keeps `href="#x"` under the new base, so a modified activation would be the
    // browser's own to a refused target; deciding on the document URL rather than the base (`#x` against the page is
    // allowed, the fragment changes).
    name: "US5-11, in process: with <base href=kitty-app://app/> inserted after render, Enter on one link and a click on another, both href=#x, each emit { href: #x }, leave the fragment unchanged and leave each anchor without href (refreshed at the activation); with the base removed, Enter navigates to #x and the anchor carries its href again",
    fixtureOnly: false,
    run: async (driver, inPage) => {
      await mount(driver, inPage, `<button id="before" type="button">Before</button><p id="para">See <ocelle-link id="k1" href="#x">the first view</ocelle-link> and <ocelle-link id="k2" href="#x">the second view</ocelle-link>.</p><p id="x">The view</p><p id="away">Away</p>`);
      await inPage(recordEvents, null);
      const before = [await anchor(driver, "k1"), await anchor(driver, "k2")];
      const base = await inPage(() => {
        const element = document.createElement("base");
        element.id = "kitty-base";
        element.href = "kitty-app://app/";
        document.head.prepend(element);
        return document.baseURI;
      }, null);
      await driver.focus("k1");
      await driver.pressKeys("Enter");
      await driver.clickTarget("k2");
      await inPage(frames, undefined);
      const withBase = { hash: ((await inPage(where, null)) as Record<string, unknown>).hash, anchors: [await anchor(driver, "k1"), await anchor(driver, "k2")] };
      await inPage(() => {
        document.getElementById("kitty-base")?.remove();
      }, null);
      await driver.focus("k1");
      await driver.pressKeys("Enter");
      await inPage(frames, undefined);
      return { before, base, withBase, after: { hash: ((await inPage(where, null)) as Record<string, unknown>).hash, anchor: await anchor(driver, "k1") }, events: await inPage(recordedEvents, null) };
    },
    expected: {
      before: [
        { name: "a", href: "#x", role: null, tabindex: null, label: null },
        { name: "a", href: "#x", role: null, tabindex: null, label: null },
      ],
      base: "kitty-app://app/",
      withBase: {
        hash: "",
        anchors: [
          { name: "a", href: null, role: "link", tabindex: "0", label: null },
          { name: "a", href: null, role: "link", tabindex: "0", label: null },
        ],
      },
      after: { hash: "#x", anchor: { name: "a", href: "#x", role: null, tabindex: null, label: null } },
      events: [event("#x", "k1"), event("#x", "k2"), event("#x", "k1")],
    },
  },
  {
    // Plants: emitting on every click (modified clicks emit); `preventDefault()` on every click (the new tab or window
    // no longer opens); the modifiers not read on Enter (Ctrl+Enter emits).
    name: "US5-13, with href, on the fixture: Ctrl and Shift held on a click or on Enter, and a middle click, emit no ocelle-link-activate and the element does not prevent the click's default: the browser opens the link target page in a new tab or window and the page itself does not navigate; Meta held on a click and on Enter emits nothing and leaves the default alone (the platform's behaviour after that is not asserted); only Alt held is a plain activation, which emits and navigates, its default prevented",
    fixtureOnly: true,
    run: async (driver, inPage, navigation) => {
      await mount(driver, inPage, page('href="link-target.html"'));
      await inPage(recordEvents, null);
      await inPage(recordClicks, null);
      await navigation.click("link", { modifiers: ["Control"] });
      await navigation.click("link", { modifiers: ["Shift"] });
      await navigation.click("link", { button: "middle" });
      await driver.focus("link");
      await navigation.press("Enter", ["Control"]);
      await navigation.press("Enter", ["Shift"]);
      const modified = { where: await inPage(where, null), events: await inPage(recordedEvents, null), clicks: await inPage(recordedClicks, null), opened: await navigation.opened() };
      await navigation.click("link", { modifiers: ["Meta"] });
      const meta = { events: await inPage(recordedEvents, null), clicks: ((await inPage(recordedClicks, null)) as unknown[]).slice(5) };
      await navigation.back();
      await mount(driver, inPage, page('href="link-target.html"'));
      await inPage(recordEvents, null);
      await inPage(recordClicks, null);
      await driver.focus("link");
      await navigation.press("Enter", ["Meta"]);
      const metaEnter = { events: await inPage(recordedEvents, null), clicks: await inPage(recordedClicks, null) };
      await navigation.back();
      await mount(driver, inPage, page('href="link-target.html"'));
      await inPage(recordEvents, null);
      await inPage(recordClicks, null);
      await navigation.click("link", { modifiers: ["Alt"] });
      return { modified, meta, metaEnter, alt: { where: await inPage(where, null), events: await inPage(recordedEvents, null), clicks: await inPage(recordedClicks, null) } };
    },
    expected: {
      modified: {
        where: stayed(),
        events: [],
        clicks: [click(["Control"], false), click(["Shift"], false), click([], false, "auxclick", 1), click(["Control"], false), click(["Shift"], false)],
        opened: ["link-target.html", "link-target.html", "link-target.html", "link-target.html", "link-target.html"],
      },
      meta: { events: [], clicks: [click(["Meta"], false)] },
      metaEnter: { events: [], clicks: [click(["Meta"], false)] },
      alt: { where: arrived, events: [event("link-target.html")], clicks: [click(["Alt"], true)] },
    },
  },
  {
    // Plants: emitting on every click or every Enter (modified activations emit); Alt treated as a modifier (the Alt
    // click emits nothing).
    name: "US5-13, without href: Ctrl, Meta or Shift held on a click or on Enter, and a middle click, emit nothing, leave the click's default alone and do not navigate, beside a plain click's event { href: null } with its default prevented, and Alt held on a click and on Enter, which are plain activations",
    fixtureOnly: false,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(""));
      await inPage(recordEvents, null);
      await inPage(recordClicks, null);
      for (const modifier of ["Control", "Meta", "Shift"] as const) await driver.clickTarget("link", { modifiers: [modifier] });
      await driver.clickTarget("link", { button: "middle" });
      await driver.focus("link");
      for (const modifier of ["Control", "Meta", "Shift"] as const) await driver.pressKeys("Enter", [modifier]);
      await inPage(frames, undefined);
      const modified = { events: await inPage(recordedEvents, null), clicks: await inPage(recordedClicks, null), stayed: await inPage(stayedHere, null) };
      await driver.clickTarget("link");
      await driver.clickTarget("link", { modifiers: ["Alt"] });
      await driver.focus("link");
      await driver.pressKeys("Enter", ["Alt"]);
      await inPage(frames, undefined);
      return { modified, plain: { events: await inPage(recordedEvents, null), clicks: ((await inPage(recordedClicks, null)) as unknown[]).slice(4), stayed: await inPage(stayedHere, null) } };
    },
    expected: {
      modified: { events: [], clicks: [click(["Control"], false), click(["Meta"], false), click(["Shift"], false), click([], false, "auxclick", 1)], stayed: true },
      plain: { events: [event(null), event(null), event(null)], clicks: [click([], true), click(["Alt"], true)], stayed: true },
    },
  },
  {
    // Plant: ignoring `defaultPrevented` (the cancelled fragment link changes the fragment); no `location.assign` (the
    // fragment never changes); the event after the navigation (the recorded fragment at dispatch is #section-2).
    name: "US5-14: Enter and a plain click on <ocelle-link href=#section-2> with no listener cancelling each emit { href: #section-2 } first and then the page navigates to the fragment section-2 (the marker stays); with a listener that cancels, the fragment is unchanged",
    fixtureOnly: false,
    run: async (driver, inPage) => {
      await mount(driver, inPage, fragmentPage("#section-2"), "#spacer { block-size: 2000px; }");
      await inPage(recordEvents, null);
      await tabToLink(driver);
      await driver.pressKeys("Enter");
      await inPage(frames, undefined);
      const enter = (await inPage(where, null)) as Record<string, unknown>;
      await inPage(() => {
        history.replaceState(history.state, "", location.pathname + location.search);
      }, null);
      await driver.clickTarget("link");
      await inPage(frames, undefined);
      const clicked = (await inPage(where, null)) as Record<string, unknown>;
      await inPage(() => {
        history.replaceState(history.state, "", location.pathname + location.search);
      }, null);
      await inPage(cancelEvents, null);
      await driver.focus("link");
      await driver.pressKeys("Enter");
      await driver.clickTarget("link");
      await inPage(frames, undefined);
      const cancelled = (await inPage(where, null)) as Record<string, unknown>;
      return {
        enter: { hash: enter.hash, marker: enter.marker },
        clicked: { hash: clicked.hash, marker: clicked.marker },
        cancelled: { hash: cancelled.hash, marker: cancelled.marker },
        events: await inPage(recordedEvents, null),
      };
    },
    expected: {
      enter: { hash: "#section-2", marker: true },
      clicked: { hash: "#section-2", marker: true },
      cancelled: { hash: "", marker: true },
      events: [event("#section-2"), event("#section-2"), event("#section-2"), event("#section-2")],
    },
  },
  {
    // Plants: an empty href treated as no href (no navigation, or the event's href null); ignoring `defaultPrevented`.
    name: 'US5-14, on the fixture: href="" is an href: cancelled, the event carries { href: "" } and the page does not navigate; uncancelled, the event carries { href: "" } and the document is navigated to itself (the marker is gone, the page is link.html again)',
    fixtureOnly: true,
    run: async (driver, inPage, navigation) => {
      await mount(driver, inPage, page('href=""'));
      await inPage(recordEvents, null);
      await inPage(cancelEvents, null);
      await navigation.click("link");
      const cancelled = { where: await inPage(where, null), events: await inPage(recordedEvents, null) };
      await mount(driver, inPage, page('href=""'));
      await inPage(recordEvents, null);
      await navigation.click("link");
      return { cancelled, uncancelled: { where: await inPage(where, null), events: await inPage(recordedEvents, null) } };
    },
    expected: {
      cancelled: { where: stayed(), events: [event("")] },
      uncancelled: { where: { same: false, page: "link.html", hash: "", marker: false, ran: false, target: null, violations: [] }, events: [event("")] },
    },
  },
  {
    // Plants: `href` on the anchor whatever its protocol (a refused href kept on the anchor, so a modified activation
    // would open it); no `role="link"` or `tabindex` without href (not focusable, not a link); the anchor's state not
    // refreshed on an `href` change.
    name: "R-08: the anchor carries the host's href as written only when it is allowed, else no href with role link and tabindex 0, following each href change; the link is a link in the tree in every case",
    fixtureOnly: false,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(""));
      const none = { anchor: await anchor(driver), links: (await tree(driver)).filter((node) => node.role === "link") };
      await driver.setAttribute("link", "href", "#nav-1");
      const allowed = { anchor: await anchor(driver), links: (await tree(driver)).filter((node) => node.role === "link") };
      await driver.setAttribute("link", "href", " javascript:void(0)");
      const refusedHref = { anchor: await anchor(driver), links: (await tree(driver)).filter((node) => node.role === "link") };
      await driver.setAttribute("link", "href", null);
      return { none, allowed, refused: refusedHref, removed: await anchor(driver) };
    },
    expected: {
      none: { anchor: { name: "a", href: null, role: "link", tabindex: "0", label: null }, links: [{ role: "link", name: text }] },
      allowed: { anchor: { name: "a", href: "#nav-1", role: null, tabindex: null, label: null }, links: [{ role: "link", name: text }] },
      refused: { anchor: { name: "a", href: null, role: "link", tabindex: "0", label: null }, links: [{ role: "link", name: text }] },
      removed: { name: "a", href: null, role: "link", tabindex: "0", label: null },
    },
  },
  {
    // Plants: `href` not reflected; `label` reflected; another default.
    name: "the properties: href is reflected to the attribute, label is not; with no attribute both read undefined, beside the link exposed",
    fixtureOnly: false,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(""));
      const defaults = await inPage(() => {
        const link = document.getElementById("link") as unknown as Record<string, unknown> | null;
        return link === null ? null : [link.href === undefined, link.label === undefined];
      }, null);
      await driver.setProperty("link", "href", "#nav-2");
      await driver.setProperty("link", "label", "the mission log, opens in the viewer");
      return { defaults, attributes: [await driver.attribute("link", "href"), await driver.attribute("link", "label")], links: (await tree(driver)).filter((node) => node.role === "link") };
    },
    expected: { defaults: [true, true], attributes: ["#nav-2", null], links: [{ role: "link", name: label }] },
  },
  {
    // Plant: a `display` rule on `:host` that overrides `:host([hidden])`.
    name: "Edge Cases: host hidden removes the link, no box and no node; without it the link has a box and its node",
    fixtureOnly: false,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(""));
      await driver.setAttribute("link", "hidden", "");
      const box = await driver.box("link");
      const hidden = { display: box.display, height: box.height, links: (await tree(driver)).filter((node) => node.role === "link") };
      await driver.setAttribute("link", "hidden", null);
      const again = await driver.box("link");
      return { hidden, shown: { display: again.display, boxed: again.height > 0, links: (await tree(driver)).filter((node) => node.role === "link") } };
    },
    expected: { hidden: { display: "none", height: 0, links: [] }, shown: { display: "inline", boxed: true, links: [{ role: "link", name: text }] } },
  },
  {
    // Plant: a `transition` on the link's colour or ring.
    name: "Edge Cases, motion: the link declares no transition or animation, beside the focus ring it shows at once",
    fixtureOnly: false,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(""));
      await tabToLink(driver);
      return {
        ring: await anchorStyle(driver, "outline-color"),
        motion: [await anchorStyle(driver, "transition-duration"), await anchorStyle(driver, "animation-name"), await driver.computed("link", "transition-duration")],
      };
    },
    expected: { ring: focusLight, motion: ["0s", "none", "0s"] },
  },
];
