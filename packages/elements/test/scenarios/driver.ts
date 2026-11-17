// The driver of the shared scenario bodies (005 research.md R-11, T013). A scenario body (scenarios/*.ts) is
// written once against this interface and run by two harnesses: in process on the element source (test/*.test.ts,
// the `elements` project, which Stryker mutates) and on the built browser build on strict-CSP fixture pages
// (test/browser/*.test.ts, the `elements-browser` project). Every method reads or acts on the page by element `id`;
// nothing in a body depends on which harness runs it. Elements inside a shadow root are reached by a selector in the
// element's shadow root.
//
// Since 014 (research.md R-11, T006) a target is an element's `id` or a child of a parent (`Target`): the index-th
// element child of tag `kind` of the element with id `parent`. Real keyboard and pointer input (`pressKeys`, `clickTarget`), the
// focused element through shadow roots (`focusedElement`), DOM steps in one task (`mutate`), a resize that does not wait
// for a frame and the wait for its observations (`resize`, `afterResizeDelivery`), shadow parts' and pseudo-elements'
// computed styles (`computedPart`), the page's scroll offset and viewport (`scrollOffset`, `setViewportSize`), the
// recorders (keydowns at the document in the bubble phase, clipboard calls, the order of an activation, accessibility
// tree updates) and the accessibility states (`axStates`) are the driver's too.
import type { AxNode, AxScope, AxState, AxUpdate, ForcedColors, Palette, Target } from "../commands.ts";
import type { Pixels } from "../pixels.ts";

export type { AxNode, AxScope, AxState, AxUpdate, ForcedColors, Palette, Target } from "../commands.ts";
export type { Pixels } from "../pixels.ts";

/** A modifier key held during a key press or a click. */
export type Modifier = "Alt" | "Control" | "Meta" | "Shift";

/**
 * How `clickTarget` clicks: the mouse button (left by default), the modifiers held, and the number of clicks (1 by default).
 * With `force` the click skips Playwright's actionability checks, so a target it counts as disabled (an
 * `aria-disabled="true"` element) is still clicked with real input (014 phase 2).
 */
export interface ClickOptions {
  readonly button?: "left" | "middle" | "right";
  readonly modifiers?: readonly Modifier[];
  readonly count?: number;
  readonly force?: boolean;
}

/**
 * The focused element, found through shadow roots: its `id`; else, when it has a `part` inside the shadow root of a
 * host with an id, that host and part; else, when its parent element has an id, its place among that parent's children
 * of its tag; else its local name.
 */
export type Focused =
  | { readonly id: string }
  | { readonly host: string; readonly part: string }
  | { readonly parent: string; readonly kind: string; readonly index: number }
  | { readonly unidentified: string };

/**
 * One DOM step of `mutate`, on the target's element children as they are when the step runs: append markup at the
 * end, remove child n, move child n before child m (counted before the move) or to the end, remove child n and insert
 * it back in its place, set (or with null remove) an attribute of child n, set a property of the target or of child n.
 */
export type Step =
  | { readonly append: string }
  | { readonly remove: number }
  | { readonly move: number; readonly before: number | "end" }
  | { readonly reinsert: number }
  | { readonly child: number; readonly attribute: string; readonly value: string | null }
  | { readonly property: string; readonly value: unknown; readonly child?: number };

/** A scroll offset of the page, in CSS pixels. */
export interface Offset {
  readonly x: number;
  readonly y: number;
}

/** One keydown event as the document saw it in the bubble phase. */
export interface Keydown {
  readonly key: string;
  readonly defaultPrevented: boolean;
}

/**
 * What `activationRecord` observes: the event the target dispatches as its request; `read`, a selector in the target's
 * shadow root (or in the target when it has none) whose text each entry records; `property`, a property of the target
 * each entry records.
 */
export interface ActivationOptions {
  readonly request: string;
  readonly read?: string;
  readonly property?: string;
}

/**
 * One entry of an activation's record (research.md R-07): the activating `clickTarget` in the capture phase at the document
 * (`activation`), the same click in the bubble phase at the document, after the target's own handlers in that task
 * (`activation end`), the first animation frame callback registered in the activation's task (`frame`), and each
 * request (`request`); each with the number of requests before it, the `read` text and the `property` value (null when
 * not asked for).
 */
export interface ActivationEntry {
  readonly entry: "activation" | "activation end" | "frame" | "request";
  readonly requests: number;
  readonly text: string | null;
  readonly value: unknown;
}

/**
 * Runs a self-contained function with one serialisable argument in the page, and returns its result: in process in the
 * test's own frame, on the fixture through `page.evaluate`. Only the driver's own tests use it, to set up and observe
 * what the driver acts on.
 */
export type InPage = <A, R>(fn: (arg: A) => R | Promise<R>, arg: A) => Promise<R>;

/** An element's border box, relative to the viewport, and its computed `display`. */
export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly display: string;
}

/** One element of a drawing: its local name and its attributes, by name. */
export interface Part {
  readonly name: string;
  readonly attributes: Readonly<Record<string, string>>;
}

/** What an element's shadow root holds: its element children, and the `svg` among them with its own children. */
export interface Drawing {
  /** The local names of the shadow root's element children, in order. */
  readonly children: readonly string[];
  /** The first `svg` child's attributes and its element children, or null when there is none. */
  readonly svg: { readonly attributes: Readonly<Record<string, string>>; readonly parts: readonly Part[] } | null;
}

/** The computed paint of one painted element of a drawing. */
export interface Paint {
  readonly name: string;
  readonly stroke: string;
  readonly fill: string;
}

/** An element's screen transformation of its drawing: the `svg`'s CTM scale and offset from the host's box. */
export interface Placement {
  readonly scaleX: number;
  readonly scaleY: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

/** A shape's geometry bounding box (SVG `getBBox()`) in the drawing's user units, rounded to 1/1000. */
export interface Bounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** The text direction an element sets for its subtree. */
export type Direction = "ltr" | "rtl";

/** How the shadow roots of a set of elements hold their adopted stylesheets. */
export interface Sheets {
  /** The number of elements matched. */
  readonly elements: number;
  /** The distinct numbers of adopted stylesheets per shadow root. */
  readonly perRoot: readonly number[];
  /** The number of distinct stylesheet objects over all the shadow roots. */
  readonly distinct: number;
  /** The number of `<style>` elements inside the shadow roots. */
  readonly styleElements: number;
}

export interface MountOptions {
  /** Links `@ocelle/styles`' `base.css` (after `tokens.css`) on the page. */
  readonly base?: boolean;
}

export interface Driver {
  /**
   * Replaces the page's body with `markup` (no `style` attribute: the fixture's CSP would block it) and waits until
   * every `ocelle-*` element in it has rendered. Also starts a new list of messages (`messages`).
   */
  mount(markup: string, options?: MountOptions): Promise<void>;
  /** Sets a property of the element with `id` (undefined deletes the value) and waits for it to render. */
  setProperty(id: string, name: string, value: string | undefined): Promise<void>;
  /** Sets an attribute of the element with `id` (null removes it) and waits for it to render. */
  setAttribute(id: string, name: string, value: string | null): Promise<void>;
  /** An attribute of the element with `id`, or null. */
  attribute(id: string, name: string): Promise<string | null>;
  /** Sets a CSS property on the element with `id` through the CSSOM (not governed by the CSP), as a host rule does. */
  style(id: string, property: string, value: string): Promise<void>;
  /**
   * Adds `rules` to the page as a stylesheet of the host page (a constructed sheet adopted by the document, which the
   * CSP does not govern), after the page's own; the next `mount` removes it.
   */
  rules(rules: string): Promise<void>;
  /** The border box of the target, or of the first element matching `inner` in its shadow root. */
  box(target: Target, inner?: string): Promise<Box>;
  /** The client rects of the element with `id` (`getClientRects()`): for an inline element, one per line it is on. */
  lines(id: string): Promise<Bounds[]>;
  /** What the shadow root of the element with `id` holds. */
  drawing(id: string): Promise<Drawing>;
  /**
   * Every element in the shadow root of the element with `id`, depth first in tree order, with its local name and
   * every attribute by its qualified name (so `xlink:href` is reported as written).
   */
  elements(id: string): Promise<Part[]>;
  /** The geometry bounding box of each element child of the `svg` of the element with `id`, in order. */
  geometry(id: string): Promise<Bounds[]>;
  /** Sets the `dir` attribute of the element with `id` and waits for every element to render. */
  dir(id: string, direction: Direction): Promise<void>;
  /**
   * The rendered pixels of the border box of the element with `id`, as a screenshot of that box, decoded to RGBA
   * (test/pixels.ts).
   */
  pixels(id: string): Promise<Pixels>;
  /** The computed stroke and fill of the `svg` of the element with `id` and of each element inside that `svg`. */
  paints(id: string): Promise<Paint[]>;
  /** The placement of the `svg` drawing of the element with `id` in the element's box. */
  placement(id: string): Promise<Placement>;
  /** The placement of the drawing of the light-DOM `svg` with `id` (its own screen CTM) in that `svg`'s own box. */
  ownPlacement(id: string): Promise<Placement>;
  /** The computed value of a CSS property of the target. */
  computed(target: Target, property: string): Promise<string>;
  /** The computed `color` a probe element takes from the CSS colour `value` (a system colour, say). */
  resolveColour(value: string): Promise<string>;
  /** The unignored accessibility nodes of the element with `id` and of its shadow subtree. */
  ax(id: string): Promise<AxNode[]>;
  /**
   * The unignored accessibility nodes of the accessibility subtree of the element with `id`, slotted and generated
   * content included, inline text boxes left out (test/commands.ts `axSubtree`).
   */
  axSubtree(id: string): Promise<AxNode[]>;
  /**
   * Sets the theme of the page: `data-theme` on its root element, `"light"` or `"dark"`, or null to remove it (the
   * system setting then decides, light in these harnesses), and waits for every element to render. The next `mount`
   * removes it.
   */
  theme(theme: Palette | null): Promise<void>;
  /** Emulates forced colours with a system palette, or ends it with `"none"`. */
  forcedColors(mode: ForcedColors, palette?: Palette): Promise<void>;
  /** How the shadow roots of the elements matching `selector` hold their adopted stylesheets. */
  sheets(selector: string): Promise<Sheets>;
  /** The console messages and uncaught errors the page reported since the last `mount`. */
  messages(): Promise<string[]>;
  /** Focuses the target (`focus()`). */
  focus(target: Target): Promise<void>;
  /** Presses `key` (a key name such as `"ArrowDown"`, or one character) on the focused element with `modifiers` held, as real keyboard input. */
  pressKeys(key: string, modifiers?: readonly Modifier[]): Promise<void>;
  /** Clicks the centre of the target with real mouse input. */
  clickTarget(target: Target, options?: ClickOptions): Promise<void>;
  /** Moves the mouse to the centre of the target with real input, pressing no button (014 phase 2). */
  hoverTarget(target: Target): Promise<void>;
  /** The focused element, through shadow roots, or null when nothing but the body is focused. */
  focusedElement(): Promise<Focused | null>;
  /** Applies `steps` to the target's children synchronously, in one task, then waits for every element to render. */
  mutate(target: Target, steps: readonly Step[]): Promise<void>;
  /** Sets the target's `inline-size` through the CSSOM, without waiting for a frame. */
  resize(target: Target, inlineSize: number): Promise<void>;
  /** Resolves once a `ResizeObserver` registered on the target now has had its observations delivered. */
  afterResizeDelivery(target: Target): Promise<void>;
  /**
   * The computed value of `property` of a part of the target's shadow root (`which` the part name), of that part's
   * pseudo-element (`"<part>::before"`), or of the target's own pseudo-element (`"::after"`).
   */
  computedPart(target: Target, which: string, property: string): Promise<string>;
  /** The page's scroll offset. */
  scrollOffset(): Promise<Offset>;
  /** Sets the page's viewport to `width` × `height` CSS pixels and waits for every element to render. */
  setViewportSize(width: number, height: number): Promise<void>;
  /** The keydown events the document saw in the bubble phase since the last `mount`. */
  keydownRecord(): Promise<Keydown[]>;
  /** The clipboard calls the page made since the last `mount` (none is ever made for real). */
  clipboardCalls(): Promise<string[]>;
  /** Starts recording an activation of the target (research.md R-07); the returned function waits and returns the record. */
  activationRecord(target: Target, options: ActivationOptions): Promise<() => Promise<ActivationEntry[]>>;
  /** The unignored accessibility nodes of the target with their states (test/commands.ts `axStates`). */
  axStates(target: Target, scope?: AxScope): Promise<AxState[]>;
  /**
   * Starts recording Chromium's accessibility tree updates of the target and its descendants
   * (`Accessibility.nodesUpdated`); the returned function waits for pending updates, stops and returns them.
   */
  axUpdates(target: Target): Promise<() => Promise<AxUpdate[]>>;
}
