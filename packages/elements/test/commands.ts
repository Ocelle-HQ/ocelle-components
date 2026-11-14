// The accessibility-tree reader and the forced-colours emulation of the element tests (005 research.md R-11, R-13;
// reviews/phase-2/spike.md § 3). `axNodes` reads Chromium's full accessibility tree over CDP and keeps the unignored
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
// and `axState` below. Ending forced colours (`emulate(page, "none")`) also ends reduced motion, so the one reset
// helper of a test file leaves no emulation behind.
import { createRequire } from "node:module";
import type { CDPSession, Frame, Locator, Page } from "playwright";
import type { BrowserCommandContext } from "vitest/node";
import { ruleMeta, ruleOptions } from "../../../gates/lib/axe-rules.ts";
import type { AxeRule } from "../../../gates/lib/axe-rules.ts";
import type { AxeResult, AxState, ClickOptions, Modifier, Motion } from "./scenarios/driver.ts";

/** One unignored accessibility node: its role and its computed name. */
export interface AxNode {
  readonly role: string;
  readonly name: string;
}

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
    .map((node) => ({ role: text(node.role?.value), name: text(node.name?.value) }));
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
    if (!node.ignored && role !== "InlineTextBox") found.push({ role, name: text(node.name?.value) });
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
 * never leaks into later tests on the same page (005 phase 4 review R1-01), and ends reduced motion (012 R-11).
 */
export async function emulate(page: Page, mode: ForcedColors, palette?: Palette): Promise<void> {
  if (mode === "none") {
    await page.emulateMedia({ forcedColors: "none", colorScheme: "light", reducedMotion: "no-preference" });
    return;
  }
  await page.emulateMedia(palette === undefined ? { forcedColors: mode } : { forcedColors: mode, colorScheme: palette });
}

/** Emulates the reduced-motion preference (`reduce` or `no-preference`). */
export async function emulateMotion(page: Page, mode: Motion): Promise<void> {
  await page.emulateMedia({ reducedMotion: mode });
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
 * actionability checks skipped (`force: true`, 012 research.md R-06), and clicks, presses or releases there.
 */
export async function pointer(page: Page, frame: Frame, action: PointerAction, id: string, options: ClickOptions = {}): Promise<void> {
  const target = locate(frame, id, options.inner);
  if (action === "click") {
    await target.click({ force: true, ...(options.modifiers === undefined ? {} : { modifiers: [...options.modifiers] }), ...(options.button === undefined ? {} : { button: options.button }) });
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

/** The `emulateReducedMotion(mode)` browser command (registered in vitest.config.ts). */
export async function emulateReducedMotion(context: BrowserCommandContext, mode: Motion): Promise<void> {
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

declare module "vitest/browser" {
  interface BrowserCommands {
    /**
     * The unignored accessibility nodes of the element with `id` and of its shadow subtree, or with `"subtree"` of its
     * accessibility subtree.
     */
    axTree: (id: string, scope?: AxScope) => Promise<AxNode[]>;
    /** Emulates forced colours with a system palette, or ends the emulation (and reduced motion) with `"none"`. */
    emulateForcedColors: (mode: ForcedColors, palette?: Palette) => Promise<void>;
    /** Emulates the reduced-motion preference. */
    emulateReducedMotion: (mode: Motion) => Promise<void>;
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
  }
}
