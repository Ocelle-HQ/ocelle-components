// The accessibility-tree reader and the forced-colours emulation of the element tests (005 research.md R-11, R-13;
// reviews/phase-2/spike.md § 3), and the document readers of 011 research.md R-13 (scroll width, deep active element,
// text boxes), each a self-contained `evaluate` on a Playwright frame, so both harnesses use the same reader: the
// in-process project through the browser commands `scrollWidth`, `activeElement` and `textBoxes`, the fixture suites
// on their page's main frame. `axNodes` reads Chromium's full accessibility tree over CDP and keeps the unignored
// nodes of the element with an `id` and of its shadow roots' subtrees (not its light-DOM children), so both
// harnesses read the tree the same way: the in-process `elements` project through the Vitest browser commands
// `axTree` and `emulateForcedColors` below (registered in vitest.config.ts), the fixture suites through a Playwright
// CDP session on their page.
//
// 012 adds (research.md R-11; contracts/checks.md § Test harness) the Node side of the interaction, state and axe
// methods, again one function for both harnesses, each acting on a Playwright `Frame` (the test's frame in process, the
// fixture page's main frame): `press`, `pointer` (hover, click with `force: true`, press and release of the mouse),
// `axState` (one element's accessibility node), `emulateMotion` and `audit` (axe-core with 006's rule selection,
// gates/lib/axe-rules.ts). They are the browser commands `press`, `hover`, `pointer`, `emulateReducedMotion`, `axe`
// and `axState` below. Ending forced colours (`emulate(page, "none")`) leaves reduced motion alone (013 research.md
// R-08; operator decision A1, 2026-11-16), so a test file's reset ends both.
//
// 008 adds (research.md R-14): `axTree` also gives a node's description and its modal flag where Chromium reports
// them; `pointerPath(steps)`, which drives `page.mouse`, and `touchTap(x, y)`, which drives `page.touchscreen`, both at
// points of the test's frame with the frame's offset and scale in the runner page added. Reduced motion is 013's
// `emulateReducedMotion(mode)`, which forced colours leave alone, so each test file's reset helper ends both.
import { createRequire } from "node:module";
import type { CDPSession, Frame, Locator, Page } from "playwright";
import type { BrowserCommandContext } from "vitest/node";
import { ruleMeta, ruleOptions } from "../../../gates/lib/axe-rules.ts";
import type { AxeRule } from "../../../gates/lib/axe-rules.ts";
import type { AxeResult, AxState, ClickOptions, Modifier } from "./scenarios/driver.ts";

/**
 * One unignored accessibility node: its role and its computed name, for a heading its level (011 research.md R-13;
 * 013 US2-1, US2-2), where Chromium reports them its computed description (when not empty) and its `modal` flag (008
 * R-14), and for a range node (a progressbar, a slider) its value properties (013 phase 3, contracts/checks.md § Driver
 * additions): `value` when the node has a current value, and `valuemin`, `valuemax` and `valuetext` as Chromium reports
 * them. `valuetext` reads `""` in Chromium whatever the page sets (reviews/phase-3/spike.md), so no test asserts a
 * value text on it. A node without one of these has no such key.
 */
export interface AxNode {
  readonly role: string;
  readonly name: string;
  readonly description?: string;
  readonly modal?: boolean;
  readonly level?: number;
  readonly value?: number;
  readonly valuemin?: number;
  readonly valuemax?: number;
  readonly valuetext?: string;
}

/**
 * One unignored accessibility node with its description and the states a form control's node carries
 * (specs/010-feedback-forms US2: "the focused control's node" reports its name, description and invalid state): `host`
 * marks the node of the element itself; `invalid` is Chromium's token (`"true"`, `"false"`, or `""` when absent), and
 * an absent boolean state reads false.
 */
export interface AxDetail extends AxNode {
  readonly host: boolean;
  readonly description: string;
  readonly invalid: string;
  readonly required: boolean;
  readonly disabled: boolean;
  readonly readonly: boolean;
  readonly focused: boolean;
  readonly focusable: boolean;
}

/** A box relative to the viewport. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * The deep active element (011 research.md R-13): the focused element found through open shadow roots, by its local
 * name and `id` (the empty string when it has none), with the `id` (or, without one, the local name) of each shadow
 * host on the way to it, outermost first. With nothing focused it is the `body`.
 */
export interface ActiveElement {
  readonly name: string;
  readonly id: string;
  readonly hosts: readonly string[];
}

/**
 * One text node under an element (011 research.md R-13): its data, the box of its text (a `Range` over it), the
 * ancestors in the flat tree whose computed `overflow` clips, each by its `id` or, without one, its local name, nearest
 * first, and whether a line of the text reaches outside the padding box of one of them.
 */
export interface TextBox {
  readonly text: string;
  readonly box: Rect;
  readonly clippers: readonly string[];
  readonly clipped: boolean;
}

/** The reduced-motion modes the tests emulate. */
export type ReducedMotion = "reduce" | "no-preference";

/** The forced-colours modes and the system palettes the tests emulate. */
export type ForcedColors = "active" | "none";
export type Palette = "light" | "dark";

interface DomNode {
  readonly nodeId: number;
  readonly backendNodeId: number;
  readonly frameId?: string;
  readonly attributes?: readonly string[];
  readonly children?: readonly DomNode[];
  readonly shadowRoots?: readonly DomNode[];
  readonly contentDocument?: DomNode;
}

interface RawAxNode {
  readonly nodeId: string;
  readonly ignored: boolean;
  readonly childIds?: readonly string[];
  readonly backendDOMNodeId?: number;
  readonly role?: { readonly value?: unknown };
  readonly name?: { readonly value?: unknown };
  readonly description?: { readonly value?: unknown };
  readonly value?: { readonly value?: unknown };
  readonly properties?: readonly RawAxProperty[];
}

interface RawAxProperty {
  readonly name: string;
  readonly value: { readonly value?: unknown; readonly relatedNodes?: readonly { readonly idref?: string }[] };
}

interface FrameTree {
  readonly frame: { readonly id: string; readonly url: string };
  readonly childFrames?: readonly FrameTree[];
}

/** A protocol value as text: a string as it is, anything else as the empty string. */
function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * A node as the readers report it: role and name, a heading's `level` property (011 research.md R-13; 013 US2-1,
 * US2-2), the description and modal flag it has (008 R-14), and a range node's value properties, each only when
 * Chromium reports it (013 phase 3).
 */
function reported(node: RawAxNode): AxNode {
  const role = text(node.role?.value);
  const property = (name: string): unknown => node.properties?.find((each) => each.name === name)?.value.value;
  const level = property("level");
  const named = role === "heading" && typeof level === "number" ? { role, name: text(node.name?.value), level } : { role, name: text(node.name?.value) };
  const description = text(node.description?.value);
  const modal = property("modal");
  const described = { ...(description === "" ? {} : { description }), ...(typeof modal === "boolean" ? { modal } : {}) };
  const values: { value?: number; valuemin?: number; valuemax?: number; valuetext?: string } = {};
  const value = node.value?.value;
  if (typeof value === "number") values.value = value;
  const [min, max, valueText] = [property("valuemin"), property("valuemax"), property("valuetext")];
  if (typeof min === "number") values.valuemin = min;
  if (typeof max === "number") values.valuemax = max;
  if (typeof valueText === "string") values.valuetext = valueText;
  return { ...named, ...described, ...values };
}

function inner(node: DomNode): readonly DomNode[] {
  return [...(node.children ?? []), ...(node.shadowRoots ?? [])];
}

/** The first node, depth first, whose `id` attribute is `id`. */
function byId(node: DomNode, id: string): DomNode | undefined {
  const attributes = node.attributes ?? [];
  for (let i = 0; i < attributes.length; i += 2) if (attributes[i] === "id" && attributes[i + 1] === id) return node;
  for (const child of inner(node)) {
    const found = byId(child, id);
    if (found !== undefined) return found;
  }
  return undefined;
}

/** The document of the frame `frameId`: the root itself, or the content document of the frame owner that holds it. */
function documentOf(node: DomNode, frameId: string | undefined): DomNode | undefined {
  if (frameId === undefined || node.frameId === frameId) return node.contentDocument ?? node;
  for (const child of [...inner(node), ...(node.contentDocument === undefined ? [] : [node.contentDocument])]) {
    const found = documentOf(child, frameId);
    if (found !== undefined) return found;
  }
  return undefined;
}

function collect(node: DomNode, into: Set<number>): void {
  into.add(node.backendNodeId);
  for (const child of inner(node)) collect(child, into);
}

/**
 * The unignored accessibility nodes of the element with `id` in the frame `frameId` (the main frame when undefined)
 * and of its shadow subtree, in tree order. An element that is not there has none.
 */
export async function axNodes(session: CDPSession, id: string, frameId?: string): Promise<AxNode[]> {
  const { root } = (await session.send("DOM.getDocument", { depth: -1, pierce: true })) as { root: DomNode };
  const document = documentOf(root, frameId);
  const element = document === undefined ? undefined : byId(document, id);
  if (element === undefined) return [];
  const ids = new Set<number>([element.backendNodeId]);
  for (const shadow of element.shadowRoots ?? []) collect(shadow, ids);
  const params = frameId === undefined ? {} : { frameId };
  const { nodes } = (await session.send("Accessibility.getFullAXTree", params)) as { nodes: readonly RawAxNode[] };
  return nodes
    .filter((node) => !node.ignored && node.backendDOMNodeId !== undefined && ids.has(node.backendDOMNodeId))
    .map(reported);
}

/** The value of the property `name` of `node`, or undefined. */
function propertyOf(node: RawAxNode, name: string): unknown {
  return node.properties?.find((property) => property.name === name)?.value?.value;
}

/**
 * The unignored accessibility nodes of the element with `id` and of its shadow subtree, as `axNodes` reads them, each
 * with its description and states (`AxDetail`).
 */
export async function axDetails(session: CDPSession, id: string, frameId?: string): Promise<AxDetail[]> {
  const { root } = (await session.send("DOM.getDocument", { depth: -1, pierce: true })) as { root: DomNode };
  const document = documentOf(root, frameId);
  const element = document === undefined ? undefined : byId(document, id);
  if (element === undefined) return [];
  const ids = new Set<number>([element.backendNodeId]);
  for (const shadow of element.shadowRoots ?? []) collect(shadow, ids);
  const params = frameId === undefined ? {} : { frameId };
  const { nodes } = (await session.send("Accessibility.getFullAXTree", params)) as { nodes: readonly RawAxNode[] };
  return nodes
    .filter((node) => !node.ignored && node.backendDOMNodeId !== undefined && ids.has(node.backendDOMNodeId))
    .map((node) => ({
      role: text(node.role?.value),
      name: text(node.name?.value),
      host: node.backendDOMNodeId === element.backendNodeId,
      description: text(node.description?.value),
      invalid: text(propertyOf(node, "invalid")),
      required: propertyOf(node, "required") === true,
      disabled: propertyOf(node, "disabled") === true,
      readonly: propertyOf(node, "readonly") === true,
      focused: propertyOf(node, "focused") === true,
      focusable: propertyOf(node, "focusable") === true,
    }));
}

/**
 * The unignored accessibility nodes of the accessibility subtree of the element with `id`, in tree order: its own node
 * and every descendant in the accessibility tree, through ignored nodes, so slotted content and generated content
 * (which has no DOM node of its own, such as a `::before` strut's text) are included; inline text boxes are left out.
 * This is how a control's name and text nodes are read with its slotted icons (005 US3 scenarios 6 and 11).
 */
export async function axSubtree(session: CDPSession, id: string, frameId?: string): Promise<AxNode[]> {
  const { root } = (await session.send("DOM.getDocument", { depth: -1, pierce: true })) as { root: DomNode };
  const document = documentOf(root, frameId);
  const element = document === undefined ? undefined : byId(document, id);
  if (element === undefined) return [];
  const params = frameId === undefined ? {} : { frameId };
  const { nodes } = (await session.send("Accessibility.getFullAXTree", params)) as { nodes: readonly RawAxNode[] };
  const byNodeId = new Map(nodes.map((node) => [node.nodeId, node]));
  const start = nodes.find((node) => node.backendDOMNodeId === element.backendNodeId);
  const found: AxNode[] = [];
  const walk = (node: RawAxNode): void => {
    const role = text(node.role?.value);
    if (!node.ignored && role !== "InlineTextBox") found.push(reported(node));
    for (const child of node.childIds ?? []) {
      const next = byNodeId.get(child);
      if (next !== undefined) walk(next);
    }
  };
  if (start !== undefined) walk(start);
  return found;
}

/** The CDP frame id of the frame whose URL is `url`. */
async function frameIdOf(session: CDPSession, url: string): Promise<string | undefined> {
  const { frameTree } = (await session.send("Page.getFrameTree")) as { frameTree: FrameTree };
  const frames: FrameTree["frame"][] = [];
  const walk = (tree: FrameTree): void => {
    frames.push(tree.frame);
    for (const child of tree.childFrames ?? []) walk(child);
  };
  walk(frameTree);
  return frames.find((frame) => frame.url === url)?.id;
}

/**
 * Emulates forced colours (`active` with a light or dark system palette) or ends the emulation (`none`). Ending it also
 * puts the page back in the light colour scheme the fixture contexts start in (browser/serve.ts), so a dark palette
 * never leaks into later tests on the same page (005 phase 4 review R1-01). It leaves reduced motion alone (013
 * research.md R-08; operator decision A1, 2026-11-16): `emulateMotion` ends that.
 */
export async function emulate(page: Page, mode: ForcedColors, palette?: Palette): Promise<void> {
  if (mode === "none") {
    await page.emulateMedia({ forcedColors: "none", colorScheme: "light" });
    return;
  }
  await page.emulateMedia(palette === undefined ? { forcedColors: mode } : { forcedColors: mode, colorScheme: palette });
}

/** The element with `id` in `frame`, or the first element matching `inner` in its shadow root. */
function locate(frame: Frame, id: string, inner?: string): Locator {
  const host = frame.locator(`[id="${id}"]`);
  return inner === undefined ? host : host.locator(inner).first();
}

/** Presses `key` on `page`'s keyboard (the focused frame gets it) with `modifiers` held, released in reverse order. */
export async function press(page: Page, key: string, modifiers: readonly Modifier[] = []): Promise<void> {
  for (const modifier of modifiers) await page.keyboard.down(modifier);
  await page.keyboard.press(key);
  for (const modifier of [...modifiers].reverse()) await page.keyboard.up(modifier);
}

/** A pointer action: move to the element (`hover`), click it, or press (`down`) or release (`up`) the left button there. */
export type PointerAction = "hover" | "click" | "down" | "up";

/**
 * Moves `page`'s mouse to the centre of the element with `id` in `frame` (or its shadow element `inner`), Playwright's
 * actionability checks skipped (`force: true`, 012 research.md R-06), and clicks, presses or releases there; a click
 * lands at `options.position` from the element's top-left corner when given.
 */
export async function pointer(page: Page, frame: Frame, action: PointerAction, id: string, options: ClickOptions = {}): Promise<void> {
  const target = locate(frame, id, options.inner);
  if (action === "click") {
    await target.click({
      force: true,
      ...(options.modifiers === undefined ? {} : { modifiers: [...options.modifiers] }),
      ...(options.button === undefined ? {} : { button: options.button }),
      ...(options.position === undefined ? {} : { position: { x: options.position.x, y: options.position.y } }),
    });
    return;
  }
  await target.hover({ force: true });
  if (action === "down") await page.mouse.down();
  if (action === "up") await page.mouse.up();
}

/** A boolean AX property, false when Chromium does not report it (Chromium reports `busy` as the number 1). */
function flag(node: RawAxNode, name: string): boolean {
  const value = node.properties?.find((each) => each.name === name)?.value.value;
  return value === true || value === 1;
}

/** An AX property's value as text, or null when Chromium does not report it. */
function token(node: RawAxNode, name: string): string | null {
  const value = node.properties?.find((each) => each.name === name)?.value.value;
  if (typeof value === "string") return value;
  return typeof value === "boolean" || typeof value === "number" ? String(value) : null;
}

/**
 * The accessibility node of the element with `id` in the frame `frameId` (the main frame when undefined), or of the
 * first element matching `inner` in its shadow root, as `AxState` (012 research.md R-11).
 */
export async function axStateOf(session: CDPSession, id: string, inner?: string, frameId?: string): Promise<AxState> {
  const { root } = (await session.send("DOM.getDocument", { depth: -1, pierce: true })) as { root: DomNode };
  const document = documentOf(root, frameId);
  const element = document === undefined ? undefined : byId(document, id);
  if (element === undefined) throw new Error(`axState: no #${id} on the page`);
  let backendNodeId = element.backendNodeId;
  if (inner !== undefined) {
    const shadow = element.shadowRoots?.[0];
    if (shadow === undefined) throw new Error(`axState: #${id} has no shadow root`);
    const { nodeId } = await session.send("DOM.querySelector", { nodeId: shadow.nodeId, selector: inner });
    if (nodeId === 0) throw new Error(`axState: no ${inner} in the shadow root of #${id}`);
    ({ node: { backendNodeId } } = await session.send("DOM.describeNode", { nodeId }));
  }
  const { nodes } = (await session.send("Accessibility.getPartialAXTree", { backendNodeId, fetchRelatives: false })) as { nodes: readonly RawAxNode[] };
  const node = nodes.find((each) => each.backendDOMNodeId === backendNodeId);
  if (node === undefined) throw new Error(`axState: no accessibility node for #${id}${inner === undefined ? "" : ` ${inner}`}`);
  const expanded = node.properties?.find((each) => each.name === "expanded")?.value.value;
  const controls = node.properties?.find((each) => each.name === "controls")?.value.relatedNodes ?? [];
  return {
    role: text(node.role?.value),
    name: text(node.name?.value),
    description: text(node.description?.value),
    disabled: flag(node, "disabled"),
    expanded: typeof expanded === "boolean" ? expanded : null,
    pressed: token(node, "pressed"),
    hasPopup: token(node, "hasPopup"),
    busy: flag(node, "busy"),
    focusable: flag(node, "focusable"),
    controls: controls.map((each) => each.idref ?? ""),
  };
}

/** axe-core's script and the `rules` option of 006's selection, from axe-core's own rule objects (as gates/bin/axe.ts). */
export function axeSetup(): { readonly path: string; readonly rules: Record<string, { readonly enabled: boolean }> } {
  const require = createRequire(import.meta.url);
  const core = require("axe-core") as { readonly _audit: { readonly rules: readonly AxeRule[] } };
  return { path: require.resolve("axe-core/axe.min.js"), rules: ruleOptions(ruleMeta(core._audit.rules)) };
}

/**
 * Runs axe-core in `frame` on the whole document, or on the element with `scope`, with `rules`, after `load` has put
 * `window.axe` there when it is missing; its violations and incomplete results of every impact, so a test sees that a
 * rule 006 leaves out (a moderate harness-document rule such as `region`) gives nothing.
 */
export async function audit(frame: Frame, load: () => Promise<unknown>, rules: Readonly<Record<string, { readonly enabled: boolean }>>, scope?: string): Promise<AxeResult[]> {
  if (!(await frame.evaluate(() => "axe" in window))) await load();
  return frame.evaluate(
    async ({ rules, scope }) => {
      interface Result {
        readonly id: string;
        readonly impact?: string | null;
        readonly nodes: readonly { readonly target: readonly (string | readonly string[])[] }[];
      }
      const axe = (window as unknown as { axe: { run: (context: unknown, options: unknown) => Promise<{ violations: Result[]; incomplete: Result[] }> } }).axe;
      const context = scope === undefined ? document : document.getElementById(scope);
      if (context === null) throw new Error(`axe: no #${scope ?? ""} on the page`);
      const results = await axe.run(context, { rules, resultTypes: ["violations", "incomplete"] });
      const listed = (list: readonly Result[], kind: "violation" | "incomplete"): AxeResult[] =>
        list.map((result) => ({ id: result.id, impact: result.impact ?? "", kind, targets: result.nodes.map((node) => node.target.map((part) => (typeof part === "string" ? part : part.join(" >>> "))).join(" >>frame>> ")) }));
      return [...listed(results.violations, "violation"), ...listed(results.incomplete, "incomplete")];
    },
    { rules, scope },
  );
}

/** One step of a pointer path: a point, and a press or release of `button` (`left`) there. */
export interface PathStep {
  readonly x: number;
  readonly y: number;
  readonly down?: boolean;
  readonly up?: boolean;
  readonly button?: "left" | "right" | "middle";
  readonly still?: boolean;
}

/**
 * Moves `page.mouse` through `steps` (points of the page, after `map`), with intermediate moves; a `still` step does
 * not move, so its press and release follow the previous step's at once (it must name the previous step's point).
 */
export async function movePointer(page: Page, steps: readonly PathStep[], map: (x: number, y: number) => { x: number; y: number } = (x, y) => ({ x, y })): Promise<void> {
  let last: PathStep | undefined;
  for (const step of steps) {
    const point = map(step.x, step.y);
    const button = step.button ?? "left";
    if (step.still === true) {
      if (last?.x !== step.x || last.y !== step.y) throw new Error("a still pointer step must name the previous step's point");
    } else await page.mouse.move(point.x, point.y, { steps: 4 });
    if (step.down === true) await page.mouse.down({ button });
    if (step.up === true) await page.mouse.up({ button });
    last = step;
  }
}

/** Maps a point of the test's frame to a point of the runner page: the frame element's offset and its scale. */
async function frameMap(context: BrowserCommandContext): Promise<(x: number, y: number) => { x: number; y: number }> {
  const box = await context.iframe.owner().boundingBox();
  if (box === null) throw new Error("the test's frame has no box");
  const frame = await context.frame();
  const width = await frame.evaluate(() => window.innerWidth);
  const scale = box.width / width;
  return (x, y) => ({ x: box.x + x * scale, y: box.y + y * scale });
}

/**
 * Emulates `prefers-reduced-motion` (013 research.md R-08, PLAN-CORRECTNESS-1-013): through Playwright's own
 * `reducedMotion` option of `page.emulateMedia`, beside `emulate()`, so a later forced-colours call keeps it (every
 * `emulateMedia` call sends all the media features, the reduced motion Playwright holds among them). 009's scroller
 * scenarios (research.md R-17) use it too, with the same modes.
 */
export async function emulateMotion(page: Page, mode: ReducedMotion): Promise<void> {
  await page.emulateMedia({ reducedMotion: mode });
}

/**
 * Which nodes `axTree` reads: the element's own and its shadow subtree's (`axNodes`), or its accessibility subtree
 * (`axSubtree`); `"details"` reads the nodes of `axNodes` with their descriptions and states (`axDetails`).
 */
export type AxScope = "element" | "subtree" | "details";

/**
 * The `axTree(id, scope)` browser command (registered in vitest.config.ts): `axNodes`, or with `"subtree"` `axSubtree`,
 * in the frame of the calling test file.
 */
export async function axTree(context: BrowserCommandContext, id: string, scope: AxScope = "element"): Promise<AxNode[] | AxDetail[]> {
  const session = await context.page.context().newCDPSession(context.page);
  try {
    const frame = await context.frame();
    const frameId = await frameIdOf(session, frame.url());
    if (frameId === undefined) throw new Error(`axTree: no frame has the test's URL ${frame.url()}`);
    const read = { element: axNodes, subtree: axSubtree, details: axDetails }[scope];
    return await read(session, id, frameId);
  } finally {
    await session.detach();
  }
}

/** The scrolling width of `frame`'s document (`document.scrollingElement.scrollWidth`; 011 research.md R-13). */
export function readScrollWidth(frame: Frame): Promise<number> {
  return frame.evaluate(() => (document.scrollingElement ?? document.documentElement).scrollWidth);
}

/** The deep active element of `frame`'s document (ActiveElement; 011 research.md R-13). */
export function readActiveElement(frame: Frame): Promise<ActiveElement> {
  return frame.evaluate((): ActiveElement => {
    const hosts: string[] = [];
    let active = document.activeElement ?? document.body;
    while (active.shadowRoot?.activeElement != null) {
      hosts.push(active.id === "" ? active.localName : active.id);
      active = active.shadowRoot.activeElement;
    }
    return { name: active.localName, id: active.id, hosts };
  });
}

/**
 * Each text node with non-whitespace data under the element with `id` in `frame`'s document (TextBox; 011
 * research.md R-13), in flat-tree order: the element's shadow root stands for its children, and a slot in a shadow root
 * for its assigned nodes (its fallback content when none is assigned), so light-DOM text that no slot takes is not
 * read. A text's clipping ancestors are found up the flat tree (a node's assigned slot, else its parent, a shadow
 * root's host) as the elements whose computed `overflow-x` or `overflow-y` is not `visible`; a text is clipped when one
 * of its client rects reaches more than 0.5 px outside the padding box of one of them.
 */
export function readTextBoxes(frame: Frame, id: string): Promise<TextBox[]> {
  return frame.evaluate((id): TextBox[] => {
    const element = document.getElementById(id);
    if (element === null) throw new Error(`no #${id} on the page`);
    const texts: Text[] = [];
    const walk = (node: Node): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        if ((node as Text).data.trim() !== "") texts.push(node as Text);
        return;
      }
      let children: readonly Node[] = [...node.childNodes];
      if (node instanceof Element && node.shadowRoot !== null) children = [...node.shadowRoot.childNodes];
      else if (node instanceof HTMLSlotElement && node.getRootNode() instanceof ShadowRoot && node.assignedNodes().length > 0) children = node.assignedNodes();
      for (const child of children) walk(child);
    };
    walk(element);
    const parentOf = (node: Node): Node | null => {
      const parent = (node as Element | Text).assignedSlot ?? node.parentNode;
      return parent instanceof ShadowRoot ? parent.host : parent;
    };
    return texts.map((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const whole = range.getBoundingClientRect();
      const rects = [...range.getClientRects()];
      const clippers: Element[] = [];
      for (let at = parentOf(node); at !== null; at = parentOf(at)) {
        if (!(at instanceof Element)) continue;
        const style = getComputedStyle(at);
        if (style.overflowX !== "visible" || style.overflowY !== "visible") clippers.push(at);
      }
      const clipped = clippers.some((clipper) => {
        const outer = clipper.getBoundingClientRect();
        const left = outer.left + clipper.clientLeft;
        const top = outer.top + clipper.clientTop;
        const right = left + clipper.clientWidth;
        const bottom = top + clipper.clientHeight;
        return rects.some((rect) => rect.left < left - 0.5 || rect.top < top - 0.5 || rect.right > right + 0.5 || rect.bottom > bottom + 0.5);
      });
      return {
        text: node.data,
        box: { x: whole.x, y: whole.y, width: whole.width, height: whole.height },
        clippers: clippers.map((clipper) => (clipper.id === "" ? clipper.localName : clipper.id)),
        clipped,
      };
    });
  }, id);
}

/** The `scrollWidth()` browser command (registered in vitest.config.ts): `readScrollWidth` on the test's frame. */
export async function scrollWidth(context: BrowserCommandContext): Promise<number> {
  return readScrollWidth(await context.frame());
}

/** The `activeElement()` browser command (registered in vitest.config.ts): `readActiveElement` on the test's frame. */
export async function activeElement(context: BrowserCommandContext): Promise<ActiveElement> {
  return readActiveElement(await context.frame());
}

/** The `textBoxes(id)` browser command (registered in vitest.config.ts): `readTextBoxes` on the test's frame. */
export async function textBoxes(context: BrowserCommandContext, id: string): Promise<TextBox[]> {
  return readTextBoxes(await context.frame(), id);
}

/** The `emulateForcedColors(mode, palette)` browser command (registered in vitest.config.ts). */
export async function emulateForcedColors(context: BrowserCommandContext, mode: ForcedColors, palette?: Palette): Promise<void> {
  await emulate(context.page, mode, palette);
}

/** The `emulateReducedMotion(mode)` browser command (registered in vitest.config.ts; 012, 013 phase 3). */
export async function emulateReducedMotion(context: BrowserCommandContext, mode: ReducedMotion): Promise<void> {
  await emulateMotion(context.page, mode);
}

/** The `press(key, modifiers)` browser command (registered in vitest.config.ts): the test frame has focus, so it gets the key. */
export async function pressKey(context: BrowserCommandContext, key: string, modifiers?: readonly Modifier[]): Promise<void> {
  await press(context.page, key, modifiers);
}

/** The `hover(id, inner)` browser command (registered in vitest.config.ts), in the test's frame. */
export async function hover(context: BrowserCommandContext, id: string, inner?: string): Promise<void> {
  await pointer(context.page, await context.frame(), "hover", id, inner === undefined ? {} : { inner });
}

/** The `pointer(action, id, options)` browser command (registered in vitest.config.ts), in the test's frame. */
export async function pointerCommand(context: BrowserCommandContext, action: PointerAction, id: string, options?: ClickOptions): Promise<void> {
  await pointer(context.page, await context.frame(), action, id, options);
}

/** The `axState(id, inner)` browser command (registered in vitest.config.ts), in the frame of the calling test file. */
export async function axState(context: BrowserCommandContext, id: string, inner?: string): Promise<AxState> {
  const session = await context.page.context().newCDPSession(context.page);
  try {
    const frame = await context.frame();
    const frameId = await frameIdOf(session, frame.url());
    if (frameId === undefined) throw new Error(`axState: no frame has the test's URL ${frame.url()}`);
    return await axStateOf(session, id, inner, frameId);
  } finally {
    await session.detach();
  }
}

/** The `axe(scope)` browser command (registered in vitest.config.ts): axe-core injected into the test's frame from node_modules. */
export async function axe(context: BrowserCommandContext, scope?: string): Promise<AxeResult[]> {
  const frame = await context.frame();
  const { path, rules } = axeSetup();
  return audit(frame, () => frame.addScriptTag({ path }), rules, scope);
}

/** The `pointerPath(steps)` browser command (registered in vitest.config.ts): `page.mouse` through points of the test's frame. */
export async function pointerPath(context: BrowserCommandContext, steps: readonly PathStep[]): Promise<void> {
  await movePointer(context.page, steps, await frameMap(context));
}

/** The `touchTap(x, y)` browser command (registered in vitest.config.ts): `page.touchscreen` at a point of the test's frame. */
export async function touchTap(context: BrowserCommandContext, x: number, y: number): Promise<void> {
  const point = (await frameMap(context))(x, y);
  await context.page.touchscreen.tap(point.x, point.y);
}

declare module "vitest/browser" {
  interface BrowserCommands {
    /**
     * The unignored accessibility nodes of the element with `id` and of its shadow subtree, or with `"subtree"` of its
     * accessibility subtree.
     */
    axTree: ((id: string, scope?: "element" | "subtree") => Promise<AxNode[]>) & ((id: string, scope: "details") => Promise<AxDetail[]>);
    /** Emulates forced colours with a system palette, or ends the emulation with `"none"`. */
    emulateForcedColors: (mode: ForcedColors, palette?: Palette) => Promise<void>;
    /** The scrolling width of the test frame's document (`document.scrollingElement.scrollWidth`). */
    scrollWidth: () => Promise<number>;
    /** The focused element of the test frame through open shadow roots. */
    activeElement: () => Promise<ActiveElement>;
    /** Each text node with non-whitespace data under the element with `id`, in flat-tree order. */
    textBoxes: (id: string) => Promise<TextBox[]>;
    /** Emulates `prefers-reduced-motion: reduce`, or ends it with `"no-preference"` (012, 013 phase 3). */
    emulateReducedMotion: (mode: ReducedMotion) => Promise<void>;
    /** Presses `key` with `modifiers` held. */
    press: (key: string, modifiers?: readonly Modifier[]) => Promise<void>;
    /** Moves the mouse to the element with `id` (or its shadow element `inner`). */
    hover: (id: string, inner?: string) => Promise<void>;
    /** Hovers, clicks (forced), presses or releases the mouse at the element with `id`. */
    pointer: (action: PointerAction, id: string, options?: ClickOptions) => Promise<void>;
    /** The accessibility node of the element with `id` (or its shadow element `inner`). */
    axState: (id: string, inner?: string) => Promise<AxState>;
    /** The axe results of the page, or of the element with `scope`, with 006's selection, every impact. */
    axe: (scope?: string) => Promise<AxeResult[]>;
    /** Moves the real pointer through points of this frame, pressing and releasing where a step says so. */
    pointerPath: (steps: readonly PathStep[]) => Promise<void>;
    /** A real touch tap at a point of this frame (a context with `hasTouch` only). */
    touchTap: (x: number, y: number) => Promise<void>;
  }
}
