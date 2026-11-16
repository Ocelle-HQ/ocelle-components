// The accessibility-tree reader and the forced-colours emulation of the element tests (005 research.md R-11, R-13;
// reviews/phase-2/spike.md § 3). `axNodes` reads Chromium's full accessibility tree over CDP and keeps the unignored
// nodes of the element with an `id` and of its shadow roots' subtrees (not its light-DOM children), so both
// harnesses read the tree the same way: the in-process `elements` project through the Vitest browser commands
// `axTree` and `emulateForcedColors` below (registered in vitest.config.ts), the fixture suites through a Playwright
// CDP session on their page.
import type { CDPSession, Page } from "playwright";
import type { BrowserCommandContext } from "vitest/node";

/**
 * One unignored accessibility node: its role and its computed name, for a heading its level (013 US2-1, US2-2), and for
 * a range node (a progressbar, a slider) its value properties (013 phase 3, contracts/checks.md § Driver additions):
 * `value` when the node has a current value, and `valuemin`, `valuemax` and `valuetext` as Chromium reports them.
 * `valuetext` reads `""` in Chromium whatever the page sets (reviews/phase-3/spike.md), so no test asserts a value text
 * on it.
 */
export interface AxNode {
  readonly role: string;
  readonly name: string;
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

/** The reduced-motion modes the tests emulate. */
export type ReducedMotion = "reduce" | "no-preference";

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
  readonly value?: { readonly value?: unknown };
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

/**
 * A node as the readers report it: role and name, a heading's `level` property (013 US2-1, US2-2), and a range node's
 * value properties, each only when Chromium reports it (013 phase 3).
 */
function reported(node: RawAxNode): AxNode {
  const role = text(node.role?.value);
  const property = (name: string): unknown => node.properties?.find((each) => each.name === name)?.value?.value;
  const level = property("level");
  const named = role === "heading" && typeof level === "number" ? { role, name: text(node.name?.value), level } : { role, name: text(node.name?.value) };
  const values: { value?: number; valuemin?: number; valuemax?: number; valuetext?: string } = {};
  const value = node.value?.value;
  if (typeof value === "number") values.value = value;
  const [min, max, valueText] = [property("valuemin"), property("valuemax"), property("valuetext")];
  if (typeof min === "number") values.valuemin = min;
  if (typeof max === "number") values.valuemax = max;
  if (typeof valueText === "string") values.valuetext = valueText;
  return { ...named, ...values };
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
 * never leaks into later tests on the same page (005 phase 4 review R1-01).
 */
export async function emulate(page: Page, mode: ForcedColors, palette?: Palette): Promise<void> {
  const scheme = mode === "none" ? "light" : palette;
  await page.emulateMedia(scheme === undefined ? { forcedColors: mode } : { forcedColors: mode, colorScheme: scheme });
}

/**
 * Emulates `prefers-reduced-motion` (013 research.md R-08, PLAN-CORRECTNESS-1-013): through Playwright's own
 * `reducedMotion` option of `page.emulateMedia`, beside `emulate()`, so a later forced-colours call keeps it (every
 * `emulateMedia` call sends all the media features, the reduced motion Playwright holds among them).
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

/** The `emulateForcedColors(mode, palette)` browser command (registered in vitest.config.ts). */
export async function emulateForcedColors(context: BrowserCommandContext, mode: ForcedColors, palette?: Palette): Promise<void> {
  await emulate(context.page, mode, palette);
}

/** The `emulateReducedMotion(mode)` browser command (registered in vitest.config.ts; 013 phase 3). */
export async function emulateReducedMotion(context: BrowserCommandContext, mode: ReducedMotion): Promise<void> {
  await emulateMotion(context.page, mode);
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
    /** Emulates `prefers-reduced-motion: reduce`, or ends it with `"no-preference"` (013 phase 3). */
    emulateReducedMotion: (mode: ReducedMotion) => Promise<void>;
  }
}
