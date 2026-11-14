// The accessibility-tree reader and the forced-colours emulation of the element tests (005 research.md R-11, R-13;
// reviews/phase-2/spike.md § 3). `axNodes` reads Chromium's full accessibility tree over CDP and keeps the unignored
// nodes of the element with an `id` and of its shadow roots' subtrees (not its light-DOM children), so both
// harnesses read the tree the same way: the in-process `elements` project through the Vitest browser commands
// `axTree` and `emulateForcedColors` below (registered in vitest.config.ts), the fixture suites through a Playwright
// CDP session on their page.
//
// 008 adds (research.md R-14): `axTree` also gives a node's description, its modal flag and its level where Chromium
// reports them; `emulateReducedMotion(on)`; `pointerPath(steps)`, which drives `page.mouse`, and `touchTap(x, y)`,
// which drives `page.touchscreen`, both at points of the test's frame with the frame's offset and scale in the runner
// page added. Ending forced colours (`emulate(page, "none")`) also ends reduced motion, so the reset helper of each
// test file leaves no emulation behind.
import type { CDPSession, Page } from "playwright";
import type { BrowserCommandContext } from "vitest/node";

/**
 * One unignored accessibility node: its role and its computed name, and where Chromium reports them its computed
 * description (when not empty), its `modal` flag and its `level`; a node without one has no such key.
 */
export interface AxNode {
  readonly role: string;
  readonly name: string;
  readonly description?: string;
  readonly modal?: boolean;
  readonly level?: number;
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
  readonly description?: { readonly value?: unknown };
  readonly properties?: readonly { readonly name: string; readonly value: { readonly value?: unknown } }[];
}

interface FrameTree {
  readonly frame: { readonly id: string; readonly url: string };
  readonly childFrames?: readonly FrameTree[];
}

/** A protocol value as text: a string as it is, anything else as the empty string. */
function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** The `AxNode` of a protocol node: role and name, and the description, modal flag and level it has. */
function axNode(node: RawAxNode): AxNode {
  const description = text(node.description?.value);
  const property = (name: string): unknown => node.properties?.find((each) => each.name === name)?.value.value;
  const modal = property("modal");
  const level = property("level");
  return {
    role: text(node.role?.value),
    name: text(node.name?.value),
    ...(description === "" ? {} : { description }),
    ...(typeof modal === "boolean" ? { modal } : {}),
    ...(typeof level === "number" ? { level } : {}),
  };
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
    const role = text(node.role?.value);
    if (!node.ignored && role !== "InlineTextBox") found.push(axNode(node));
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
 * never leaks into later tests on the same page (005 phase 4 review R1-01), and ends reduced motion (008 R-14), so the
 * one reset helper of a test file resets both.
 */
export async function emulate(page: Page, mode: ForcedColors, palette?: Palette): Promise<void> {
  if (mode === "none") {
    await page.emulateMedia({ forcedColors: "none", colorScheme: "light", reducedMotion: "no-preference" });
    return;
  }
  await page.emulateMedia(palette === undefined ? { forcedColors: mode } : { forcedColors: mode, colorScheme: palette });
}

/** Emulates `prefers-reduced-motion: reduce`, or with false `no-preference`. */
export async function emulateMotion(page: Page, on: boolean): Promise<void> {
  await page.emulateMedia({ reducedMotion: on ? "reduce" : "no-preference" });
}

/** One step of a pointer path: a point, and a press or release of `button` (`left`) there. */
export interface PathStep {
  readonly x: number;
  readonly y: number;
  readonly down?: boolean;
  readonly up?: boolean;
  readonly button?: "left" | "right" | "middle";
}

/** Moves `page.mouse` through `steps` (points of the page, after `map`), with intermediate moves. */
export async function movePointer(page: Page, steps: readonly PathStep[], map: (x: number, y: number) => { x: number; y: number } = (x, y) => ({ x, y })): Promise<void> {
  for (const step of steps) {
    const point = map(step.x, step.y);
    const button = step.button ?? "left";
    await page.mouse.move(point.x, point.y, { steps: 4 });
    if (step.down === true) await page.mouse.down({ button });
    if (step.up === true) await page.mouse.up({ button });
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

/** The `emulateForcedColors(mode, palette)` browser command (registered in vitest.config.ts). */
export async function emulateForcedColors(context: BrowserCommandContext, mode: ForcedColors, palette?: Palette): Promise<void> {
  await emulate(context.page, mode, palette);
}

/** The `emulateReducedMotion(on)` browser command (registered in vitest.config.ts). */
export async function emulateReducedMotion(context: BrowserCommandContext, on: boolean): Promise<void> {
  await emulateMotion(context.page, on);
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
    /** Emulates `prefers-reduced-motion: reduce`, or ends it with false. */
    emulateReducedMotion: (on: boolean) => Promise<void>;
    /** Moves the real pointer through points of this frame, pressing and releasing where a step says so. */
    pointerPath: (steps: readonly PathStep[]) => Promise<void>;
    /** A real touch tap at a point of this frame (a context with `hasTouch` only). */
    touchTap: (x: number, y: number) => Promise<void>;
  }
}
