// The driver of the shared scenario bodies (005 research.md R-11, T013). A scenario body (scenarios/*.ts) is
// written once against this interface and run by two harnesses: in process on the element source (test/*.test.ts,
// the `elements` project, which Stryker mutates) and on the built browser build on strict-CSP fixture pages
// (test/browser/*.test.ts, the `elements-browser` project). Every method reads or acts on the page by element `id`;
// nothing in a body depends on which harness runs it. Elements inside a shadow root are reached by a selector in the
// element's shadow root.
import type { AxNode, ForcedColors, Palette, ReducedMotion } from "../commands.ts";
import type { Pixels } from "../pixels.ts";

export type { AxNode, ForcedColors, Palette, ReducedMotion } from "../commands.ts";
export type { Pixels } from "../pixels.ts";

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

/** One element of a shadow root's element tree: its local name and its element children (`structure`). */
export interface TreeNode {
  readonly name: string;
  readonly children: readonly TreeNode[];
}

/**
 * One current animation or transition on an element or in its shadow root (`getAnimations()`, 013 phase 3): its kind,
 * the `part` of its target (the target's `part` attribute, `host` for the element itself, else the target's local
 * name), the property it animates (a transition's `transitionProperty`, else the properties of its keyframes, joined
 * by a comma), its play state, its effect's computed end time and its current time, in ms.
 */
export interface Running {
  readonly kind: string;
  readonly part: string;
  readonly property: string;
  readonly playState: string;
  readonly endTime: number;
  readonly currentTime: number | null;
}

export interface MountOptions {
  /** Links `@ocelle/styles`' `base.css` (after `tokens.css`) on the page. */
  readonly base?: boolean;
}

export interface Driver {
  /**
   * Replaces the page's body with `markup` (no `style` attribute: the fixture's CSP would block it) and waits until
   * every `ocelle-*` element in it has rendered. Also starts a new list of messages (`messages`). Before it replaces
   * the body it deletes the document's loading-episode record (`Symbol.for("ocelle.progress.sweepStart")`, 013
   * research.md R-06), so every mount starts as a fresh page would.
   */
  mount(markup: string, options?: MountOptions): Promise<void>;
  /**
   * Sets a property of the element with `id` (undefined deletes the value; since 013 phase 3 a number, a boolean or
   * null may be set as well) and waits for it to render.
   */
  setProperty(id: string, name: string, value: string | number | boolean | null | undefined): Promise<void>;
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
  /** The border box of the element with `id`, or of the first element matching `inner` in its shadow root. */
  box(id: string, inner?: string): Promise<Box>;
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
  /** The computed value of a CSS property of the element with `id`. */
  computed(id: string, property: string): Promise<string>;
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
  // The additions of 013 phase 1 (contracts/checks.md § Driver additions; tasks.md T003).
  /** Sets the page's viewport to `width` × `height` CSS px and waits for every element to render. */
  viewport(width: number, height: number): Promise<void>;
  /** The document element's scroll width. */
  scrollWidth(): Promise<number>;
  /**
   * The layout-settle wait (013 research.md R-02; operator decision "(a) Defer + 2-frame wait"): waits for every
   * `ocelle-*` element's update, then reads the border box of the element with `id` and of the first `dl` of its shadow
   * root once per animation frame, each read after the frame's rendering (so after its `ResizeObserver` delivery), and
   * returns the number of frames waited once two consecutive frames give the same geometry with no update pending,
   * comparing from the second frame on; it rejects after 10 frames.
   */
  layout(id: string): Promise<number>;
  /**
   * Selects the rendered text of the element with `id` (its light-DOM content), performs a user copy (the platform's
   * copy shortcut) and returns the `text/plain` the copy put on the clipboard, read from the `clipboardData` of a user
   * paste into a scratch text field; the copy event's own `clipboardData` is empty while it is dispatched.
   */
  copy(id: string): Promise<string>;
  /** Appends the element with `id` to the element with `parentId`, or to the body when it is null, and waits for every element to render. */
  move(id: string, parentId: string | null): Promise<void>;
  /**
   * Sets the data of the first text node child of the element with `id` (a `characterData` change, not a `childList`
   * one) and waits for every element to render.
   */
  text(id: string, value: string): Promise<void>;
  /** Opens the `dialog` with `id` as a modal (`showModal()`) or the popover with `id` (`showPopover()`), and waits for every element to render. */
  open(id: string): Promise<void>;
  /** The border boxes of every element matching `inner` in the shadow root of the element with `id`, in tree order. */
  boxes(id: string, inner: string): Promise<Box[]>;
  /**
   * The computed values of `properties` of every element matching `inner` in the shadow root of the element with `id`
   * (of the element itself when `inner` is null), in tree order, each a record by property name.
   */
  styles(id: string, inner: string | null, properties: readonly string[]): Promise<Record<string, string>[]>;
  /** The element children, as a tree, of the first element matching `inner` in the shadow root of the element with `id` (of the shadow root itself when `inner` is null); empty when there is none. */
  structure(id: string, inner: string | null): Promise<TreeNode[]>;
  // The additions of 013 phase 2 (contracts/checks.md § Driver additions; tasks.md T023).
  /** Presses Tab, as a user does, and waits for every element to render. */
  pressTab(): Promise<void>;
  /**
   * The focused element, followed through open shadow roots to the innermost one: its `id`, or `<local name>` when it
   * has none; null when nothing on the page has focus (the body).
   */
  focused(): Promise<string | null>;
  // The additions of 013 phase 3 (contracts/checks.md § Driver additions; tasks.md T037).
  /** Emulates `prefers-reduced-motion: reduce`, or ends it with `"no-preference"`, and waits for every element to render. */
  reducedMotion(mode: ReducedMotion): Promise<void>;
  /** The current animations and transitions on the element with `id` and in its shadow root, in tree order. */
  animations(id: string): Promise<Running[]>;
  /** Removes the element with `id` from the page. */
  remove(id: string): Promise<void>;
  /** Waits `count` animation frames. */
  frames(count: number): Promise<void>;
  /**
   * Replaces the element with `id` with the nodes parsed from `markup`, in one task (as an htmx swap does), and waits
   * for every element to render.
   */
  replace(id: string, markup: string): Promise<void>;
  /**
   * Sets (or, with null, removes) the attributes `changes` of the element with `id` in order, all in one task, and then
   * waits for every element to render (013 phase 3: a value set and removed before a frame).
   */
  changeAttributes(id: string, changes: readonly (readonly [string, string | null])[]): Promise<void>;
  /** The value of the property `name` of the element with `id`, as the page holds it (013 phase 3: a converted attribute). */
  property(id: string, name: string): Promise<unknown>;
  /** The text content of the first element matching `inner` in the shadow root of the element with `id`, or null when there is none. */
  textOf(id: string, inner: string): Promise<string | null>;
  /**
   * How the light-DOM content of the element with `id` renders: the element's `innerText`, and the number of client
   * rects of a range over its contents (0 when none of it is rendered).
   */
  rendered(id: string): Promise<{ readonly innerText: string; readonly rects: number }>;
  /**
   * Runs `during` and returns the types of the events script dispatched (`EventTarget.prototype.dispatchEvent`, wrapped
   * on the page for the duration of `during` and restored after it) on the element with `id`, on its shadow root or on
   * a node in its shadow root, in order (013 phase 3 review round 1, R1-01: US3-2's "no event is emitted").
   */
  events(id: string, during: () => Promise<void>): Promise<string[]>;
}
