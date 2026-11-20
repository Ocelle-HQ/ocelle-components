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
// 008 adds (research.md R-14): `axTree` also gives a node's description and its modal flag where Chromium reports
// them; `pointerPath(steps)`, which drives `page.mouse`, and `touchTap(x, y)`, which drives `page.touchscreen`, both at
// points of the test's frame with the frame's offset and scale in the runner page added. Reduced motion is 013's
// `emulateReducedMotion(mode)`, which forced colours leave alone, so each test file's reset helper ends both.
import type { CDPSession, Frame, Page } from "playwright";
import type { BrowserCommandContext } from "vitest/node";

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
 * What a driver command acts on (014 research.md R-11): an element's `id`, or the `index`-th element child of tag `kind`
 * of the element with id `parent` (the parent's own children, not its shadow root's).
 */
export type Target = string | { readonly parent: string; readonly kind: string; readonly index: number };

/**
 * One unignored accessibility node with its states (014 research.md R-11, PLAN-TESTABILITY-1-014): its role and name,
 * and each of `selected`, `pressed`, `disabled`, `orientation`, `live` and `controls` that Chromium reports for it;
 * `controls` as the controlled nodes' roles and names. `AxNode` keeps its own fields.
 */
export interface AxNodeState {
  readonly role: string;
  readonly name: string;
  readonly selected?: boolean;
  readonly pressed?: boolean | "mixed";
  readonly disabled?: boolean;
  readonly orientation?: string;
  readonly live?: string;
  readonly controls?: readonly AxNode[];
}

/**
 * One `Accessibility.nodesUpdated` update of a node of a recorded subtree (014 research.md R-07, R-11): its role, its
 * `live` politeness (empty when it has none) and its text, the names of its static-text descendants joined.
 */
export interface AxUpdate {
  readonly role: string;
  readonly live: string;
  readonly text: string;
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
  readonly backendNodeId: number;
  readonly nodeType?: number;
  readonly localName?: string;
  readonly frameId?: string;
  readonly attributes?: readonly string[];
  readonly children?: readonly DomNode[];
  readonly shadowRoots?: readonly DomNode[];
  readonly contentDocument?: DomNode;
}

interface RawAxProperty {
  readonly name: string;
  readonly value: { readonly value?: unknown; readonly relatedNodes?: readonly { readonly backendDOMNodeId?: number }[] };
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

/** The node a target names: the element with the id, or the index-th element child of tag `kind` of the parent with the id. */
function byTarget(node: DomNode, target: Target): DomNode | undefined {
  if (typeof target === "string") return byId(node, target);
  const parent = byId(node, target.parent);
  return (parent?.children ?? []).filter((child) => child.nodeType === 1 && child.localName === target.kind)[target.index];
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
 * never leaks into later tests on the same page (005 phase 4 review R1-01).
 */
export async function emulate(page: Page, mode: ForcedColors, palette?: Palette): Promise<void> {
  const scheme = mode === "none" ? "light" : palette;
  await page.emulateMedia(scheme === undefined ? { forcedColors: mode } : { forcedColors: mode, colorScheme: scheme });
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
 * (`axSubtree`). `axStates` also reads `"ancestors"` (014 phase 3): the unignored ancestors of the target's node in the
 * accessibility tree, nearest first, the root included.
 */
export type AxScope = "element" | "subtree" | "ancestors";

/**
 * The `axTree(id, scope)` browser command (registered in vitest.config.ts): `axNodes`, or with `"subtree"` `axSubtree`,
 * in the frame of the calling test file.
 */
export async function axTree(context: BrowserCommandContext, id: string, scope: AxScope = "element"): Promise<AxNode[]> {
  const session = await context.page.context().newCDPSession(context.page);
  try {
    const frame = await context.frame();
    const frameId = await frameIdOf(session, frame.url());
    if (frameId === undefined) throw new Error(`axTree: no frame has the test's URL ${frame.url()}`);
    return await (scope === "subtree" ? axSubtree : axNodes)(session, id, frameId);
  } finally {
    await session.detach();
  }
}

/** A node's role and name. */
function named(node: RawAxNode): AxNode {
  return { role: text(node.role?.value), name: text(node.name?.value) };
}

/** A node's role, name and the states of `AxNodeState` that Chromium reports for it. */
function withStates(node: RawAxNode, byBackend: ReadonlyMap<number, RawAxNode>): AxNodeState {
  const state: { -readonly [K in keyof AxNodeState]: AxNodeState[K] } = named(node);
  for (const property of node.properties ?? []) {
    const value = property.value.value;
    if (property.name === "selected" && typeof value === "boolean") state.selected = value;
    if (property.name === "disabled" && typeof value === "boolean") state.disabled = value;
    if (property.name === "pressed") state.pressed = value === "mixed" ? "mixed" : value === "true";
    if (property.name === "orientation") state.orientation = text(value);
    if (property.name === "live") state.live = text(value);
    if (property.name === "controls") {
      const related = (property.value.relatedNodes ?? []).map((each) => (each.backendDOMNodeId === undefined ? undefined : byBackend.get(each.backendDOMNodeId)));
      state.controls = related.filter((each) => each !== undefined).map(named);
    }
  }
  return state;
}

/**
 * The unignored accessibility nodes of `target` with their states (`AxNodeState`), in tree order: with `"element"` its own
 * node and its shadow subtree's (as `axNodes`), with `"subtree"` its accessibility subtree (as `axSubtree`, inline text
 * boxes left out).
 */
export async function axStatesOf(session: CDPSession, target: Target, scope: AxScope = "element", frameId?: string): Promise<AxNodeState[]> {
  const { root } = (await session.send("DOM.getDocument", { depth: -1, pierce: true })) as { root: DomNode };
  const document = documentOf(root, frameId);
  const element = document === undefined ? undefined : byTarget(document, target);
  if (element === undefined) return [];
  const params = frameId === undefined ? {} : { frameId };
  const { nodes } = (await session.send("Accessibility.getFullAXTree", params)) as { nodes: readonly RawAxNode[] };
  const byBackend = new Map(nodes.filter((node) => !node.ignored && node.backendDOMNodeId !== undefined).map((node) => [node.backendDOMNodeId ?? 0, node]));
  if (scope === "element") {
    const ids = new Set<number>([element.backendNodeId]);
    for (const shadow of element.shadowRoots ?? []) collect(shadow, ids);
    return nodes.filter((node) => !node.ignored && node.backendDOMNodeId !== undefined && ids.has(node.backendDOMNodeId)).map((node) => withStates(node, byBackend));
  }
  const byNodeId = new Map(nodes.map((node) => [node.nodeId, node]));
  const found: AxNodeState[] = [];
  if (scope === "ancestors") {
    const parents = new Map<string, RawAxNode>();
    for (const node of nodes) for (const child of node.childIds ?? []) parents.set(child, node);
    const own = nodes.find((node) => node.backendDOMNodeId === element.backendNodeId);
    for (let up = own === undefined ? undefined : parents.get(own.nodeId); up !== undefined; up = parents.get(up.nodeId)) if (!up.ignored) found.push(withStates(up, byBackend));
    return found;
  }
  const walk = (node: RawAxNode): void => {
    if (!node.ignored && text(node.role?.value) !== "InlineTextBox") found.push(withStates(node, byBackend));
    for (const child of node.childIds ?? []) {
      const next = byNodeId.get(child);
      if (next !== undefined) walk(next);
    }
  };
  const start = nodes.find((node) => node.backendDOMNodeId === element.backendNodeId);
  if (start !== undefined) walk(start);
  return found;
}

/** How long after `Accessibility.enable` Chromium starts sending `nodesUpdated` at once rather than after a delay that merges updates (measured: about 270 ms). */
const axWarmUp = 500;
/** How long `stop` waits for updates still on their way. */
const axSettle = 300;

/**
 * Starts recording the `Accessibility.nodesUpdated` updates of `target` and its descendants (research.md R-07):
 * enables the domain, requests the target's node and its descendants (`getPartialAXTree`, then `getChildAXNodes`, the
 * requests after which Chromium reports a node's updates), and waits until updates are sent as they happen. Each update
 * of a requested node is recorded as its role, its `live` value and the names of its static-text descendants (fetched
 * at once, which also requests them). The returned function waits for updates still on their way, stops and returns
 * them in order.
 */
export async function recordAxUpdates(session: CDPSession, target: Target, frameId?: string): Promise<() => Promise<AxUpdate[]>> {
  await session.send("Accessibility.enable");
  const { root } = (await session.send("DOM.getDocument", { depth: -1, pierce: true })) as { root: DomNode };
  const document = documentOf(root, frameId);
  const element = document === undefined ? undefined : byTarget(document, target);
  if (element === undefined) throw new Error(`axUpdates: no element for ${JSON.stringify(target)}`);
  const frame = frameId === undefined ? {} : { frameId };
  const known = new Set<string>();
  const children = async (id: string): Promise<RawAxNode[]> => {
    const { nodes } = (await session.send("Accessibility.getChildAXNodes", { id, ...frame })) as { nodes: readonly RawAxNode[] };
    for (const node of nodes) known.add(node.nodeId);
    return [...nodes];
  };
  const textOf = async (node: RawAxNode): Promise<string> => {
    let found = "";
    for (const child of node.childIds?.length === 0 ? [] : await children(node.nodeId)) {
      if (text(child.role?.value) === "StaticText") found += text(child.name?.value);
      else if (text(child.role?.value) !== "InlineTextBox") found += await textOf(child);
    }
    return found;
  };
  const { nodes: start } = (await session.send("Accessibility.getPartialAXTree", { backendNodeId: element.backendNodeId, fetchRelatives: false })) as { nodes: readonly RawAxNode[] };
  for (const node of start) {
    known.add(node.nodeId);
    await textOf(node);
  }
  const updates: AxUpdate[] = [];
  let queue = Promise.resolve();
  const listener = ({ nodes }: { nodes: readonly RawAxNode[] }): void => {
    for (const node of nodes.filter((each) => known.has(each.nodeId))) {
      queue = queue.then(async () => {
        const live = (node.properties ?? []).find((property) => property.name === "live")?.value.value;
        updates.push({ role: text(node.role?.value), live: text(live), text: await textOf(node) });
      });
    }
  };
  session.on("Accessibility.nodesUpdated", listener);
  await new Promise((done) => setTimeout(done, axWarmUp));
  return async () => {
    await new Promise((done) => setTimeout(done, axSettle));
    session.off("Accessibility.nodesUpdated", listener);
    await queue;
    return updates;
  };
}

/** The `axStates(target, scope)` browser command (registered in vitest.config.ts), in the frame of the calling test file. */
export async function axStates(context: BrowserCommandContext, target: Target, scope: AxScope = "element"): Promise<AxNodeState[]> {
  const session = await context.page.context().newCDPSession(context.page);
  try {
    const frame = await context.frame();
    const frameId = await frameIdOf(session, frame.url());
    if (frameId === undefined) throw new Error(`axStates: no frame has the test's URL ${frame.url()}`);
    return await axStatesOf(session, target, scope, frameId);
  } finally {
    await session.detach();
  }
}

/** The recordings `axUpdatesStart` started, by browser session. */
const recordings = new Map<string, () => Promise<AxUpdate[]>>();

/** The `axUpdatesStart(target)` browser command: starts recording the updates of `target` in the calling test's frame. */
export async function axUpdatesStart(context: BrowserCommandContext, target: Target): Promise<void> {
  const session = await context.page.context().newCDPSession(context.page);
  const frame = await context.frame();
  const frameId = await frameIdOf(session, frame.url());
  if (frameId === undefined) throw new Error(`axUpdatesStart: no frame has the test's URL ${frame.url()}`);
  const stop = await recordAxUpdates(session, target, frameId);
  recordings.set(context.sessionId, async () => {
    try {
      return await stop();
    } finally {
      await session.detach();
    }
  });
}

/** The `axUpdatesStop()` browser command: stops the recording `axUpdatesStart` started and returns its updates. */
export async function axUpdatesStop(context: BrowserCommandContext): Promise<AxUpdate[]> {
  const stop = recordings.get(context.sessionId);
  if (stop === undefined) throw new Error("axUpdatesStop: no recording was started");
  recordings.delete(context.sessionId);
  return stop();
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

/** The `emulateReducedMotion(mode)` browser command (registered in vitest.config.ts; 013 phase 3). */
export async function emulateReducedMotion(context: BrowserCommandContext, mode: ReducedMotion): Promise<void> {
  await emulateMotion(context.page, mode);
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
    axTree: (id: string, scope?: AxScope) => Promise<AxNode[]>;
    /** Emulates forced colours with a system palette, or ends the emulation with `"none"`. */
    emulateForcedColors: (mode: ForcedColors, palette?: Palette) => Promise<void>;
    /** The unignored accessibility nodes of `target` with their states, of its own and shadow subtree or with `"subtree"` its accessibility subtree. */
    axStates: (target: Target, scope?: AxScope) => Promise<AxNodeState[]>;
    /** Starts recording the accessibility tree updates of `target` and its descendants. */
    axUpdatesStart: (target: Target) => Promise<void>;
    /** Stops the recording and returns its updates. */
    axUpdatesStop: () => Promise<AxUpdate[]>;
    /** The scrolling width of the test frame's document (`document.scrollingElement.scrollWidth`). */
    scrollWidth: () => Promise<number>;
    /** The focused element of the test frame through open shadow roots. */
    activeElement: () => Promise<ActiveElement>;
    /** Each text node with non-whitespace data under the element with `id`, in flat-tree order. */
    textBoxes: (id: string) => Promise<TextBox[]>;
    /** Emulates `prefers-reduced-motion: reduce`, or ends it with `"no-preference"` (013 phase 3). */
    emulateReducedMotion: (mode: ReducedMotion) => Promise<void>;
    /** Moves the real pointer through points of this frame, pressing and releasing where a step says so. */
    pointerPath: (steps: readonly PathStep[]) => Promise<void>;
    /** A real touch tap at a point of this frame (a context with `hasTouch` only). */
    touchTap: (x: number, y: number) => Promise<void>;
  }
}
