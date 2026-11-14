// The accessibility-tree reader and the forced-colours emulation of the element tests (005 research.md R-11, R-13;
// reviews/phase-2/spike.md § 3), and the document readers of 011 research.md R-13 (scroll width, deep active element,
// text boxes), each a self-contained `evaluate` on a Playwright frame, so both harnesses use the same reader: the
// in-process project through the browser commands `scrollWidth`, `activeElement` and `textBoxes`, the fixture suites
// on their page's main frame. `axNodes` reads Chromium's full accessibility tree over CDP and keeps the unignored
// nodes of the element with an `id` and of its shadow roots' subtrees (not its light-DOM children), so both
// harnesses read the tree the same way: the in-process `elements` project through the Vitest browser commands
// `axTree` and `emulateForcedColors` below (registered in vitest.config.ts), the fixture suites through a Playwright
// CDP session on their page.
import type { CDPSession, Frame, Page } from "playwright";
import type { BrowserCommandContext } from "vitest/node";

/** One unignored accessibility node: its role and its computed name, and its level where it has one (a heading's). */
export interface AxNode {
  readonly role: string;
  readonly name: string;
  readonly level?: number;
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

/** The forced-colours modes and the system palettes the tests emulate. */
export type ForcedColors = "active" | "none";
export type Palette = "light" | "dark";

interface DomNode {
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
  readonly properties?: readonly { readonly name: string; readonly value?: { readonly value?: unknown } }[];
}

interface FrameTree {
  readonly frame: { readonly id: string; readonly url: string };
  readonly childFrames?: readonly FrameTree[];
}

/** A protocol value as text: a string as it is, anything else as the empty string. */
function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** The node's role and name, and its `level` property when it has a numeric one (a heading's, 011 research.md R-13). */
function axNode(node: RawAxNode): AxNode {
  const level = node.properties?.find((property) => property.name === "level")?.value?.value;
  const found = { role: text(node.role?.value), name: text(node.name?.value) };
  return typeof level === "number" ? { ...found, level } : found;
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
    .map(axNode);
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
    if (!node.ignored && text(node.role?.value) !== "InlineTextBox") found.push(axNode(node));
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

/** Which nodes `axTree` reads: the element's own and its shadow subtree's (`axNodes`), or its accessibility subtree (`axSubtree`). */
export type AxScope = "element" | "subtree";

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

declare module "vitest/browser" {
  interface BrowserCommands {
    /**
     * The unignored accessibility nodes of the element with `id` and of its shadow subtree, or with `"subtree"` of its
     * accessibility subtree.
     */
    axTree: (id: string, scope?: AxScope) => Promise<AxNode[]>;
    /** Emulates forced colours with a system palette, or ends the emulation with `"none"`. */
    emulateForcedColors: (mode: ForcedColors, palette?: Palette) => Promise<void>;
    /** The scrolling width of the test frame's document (`document.scrollingElement.scrollWidth`). */
    scrollWidth: () => Promise<number>;
    /** The focused element of the test frame through open shadow roots. */
    activeElement: () => Promise<ActiveElement>;
    /** Each text node with non-whitespace data under the element with `id`, in flat-tree order. */
    textBoxes: (id: string) => Promise<TextBox[]>;
  }
}
