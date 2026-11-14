// The driver of the shared scenario bodies (005 research.md R-11, T013). A scenario body (scenarios/*.ts) is
// written once against this interface and run by two harnesses: in process on the element source (test/*.test.ts,
// the `elements` project, which Stryker mutates) and on the built browser build on strict-CSP fixture pages
// (test/browser/*.test.ts, the `elements-browser` project). Every method reads or acts on the page by element `id`;
// nothing in a body depends on which harness runs it. Elements inside a shadow root are reached by a selector in the
// element's shadow root.
import type { AxNode, ForcedColors, Palette } from "../commands.ts";
import type { Pixels } from "../pixels.ts";

export type { AxNode, ForcedColors, Palette } from "../commands.ts";
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

/**
 * An element the input and scroll methods act on: the element with an `id`, or the first element matching `inner` in
 * that element's shadow root (009 research.md R-17).
 */
export type Target = string | { readonly id: string; readonly inner: string };

/** A point in an element's border box, in CSS px from its top-left corner. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * What a frame record reads each time it records (009 research.md R-17): a DOM property (`scrollLeft`, `clientHeight`),
 * a computed CSS property (`mask-image`) or an attribute (`tabindex`), as text (an absent attribute reads `"null"`), of
 * the record's target or, with `of`, of another element.
 */
export type Reading = ({ readonly property: string } | { readonly computed: string } | { readonly attribute: string }) & { readonly of?: Target };

/** A running frame record (`frameRecord`). */
export interface FrameRecorder {
  /**
   * Settles (`settle`), stops recording and returns the record: the reading at the start, then, in order, `"keydown"`
   * for each keydown the window saw, the reading in each animation frame, and `"resize: <reading>"` in each callback of
   * a `ResizeObserver` the record registers on the target's border box when it starts (so it runs after the observers
   * the page registered before, in the same delivery, and sees a scrollbar that comes or goes).
   */
  stop(): Promise<string[]>;
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
  /**
   * Calls the method `name` of the element with `id` with no argument, then settles (`settle`): since 009 phase 4,
   * list-detail's `remeasure()` (research.md R-13).
   */
  call(id: string, name: string): Promise<void>;
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
  /** The computed value of a CSS property of the target (since 009 a shadow target too). */
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
  /**
   * Sets the page's viewport to `width` × `height` CSS px and waits for a frame: in process the test's iframe
   * (`vitest/browser`'s `page.viewport`, whose default is 414 × 896), on the fixture pages the page itself
   * (`page.setViewportSize`, 1280 × 800 when the page opens). A frame scenario sets its frame's viewport before it
   * mounts (009 research.md R-17).
   */
  viewport(width: number, height: number): Promise<void>;
  /**
   * Presses a key or a chord with real keyboard input, never a dispatched event (`:focus-visible` follows real input
   * only), then settles: `Tab`, `Shift+Tab`, `ArrowLeft`, `ArrowRight`, `Home`, `End`, `Alt+ArrowLeft`,
   * `Ctrl+ArrowRight`, `Meta+ArrowRight`, `Shift+ArrowRight` (009 research.md R-17).
   */
  press(key: string): Promise<void>;
  /** A real pointer click at `point` of the target's border box, then a settle. */
  click(target: Target, point: Point): Promise<void>;
  /** A real wheel event over the centre of the target's border box, `deltaX` CSS px to the right, then a settle. */
  wheel(target: Target, deltaX: number): Promise<void>;
  /**
   * The deep active element: from `document.activeElement` down through each shadow root's active element, each level
   * as its `id`, or as its local name and its classes (`div.region-box`) when it has none, joined by `" >> "`
   * (`"s1 >> div.region-box"`, `"l3"`, `"body"`).
   */
  activeElement(): Promise<string>;
  /**
   * Focuses the element with id `from` by script, then presses `Tab` (or `Shift+Tab` when `backward`) until the deep
   * active element is `to` (an id, or a deep active element as `activeElement()` names it), and returns
   * `activeElement()` after each press, `to` included; at most 40 presses.
   */
  tabWalk(from: string, to: string, backward?: boolean): Promise<string[]>;
  /**
   * Focuses the target by script (`focus()`), then settles. Chromium's `:focus-visible` follows the last input: after
   * keyboard input the target matches it, after a pointer click it does not.
   */
  focus(target: Target): Promise<void>;
  /** The target's `scrollLeft`. */
  scrollLeft(target: Target): Promise<number>;
  /** Sets the target's `scrollLeft` with an instant scroll, then settles. */
  setScrollLeft(target: Target, value: number): Promise<void>;
  /** Whether the last keydown the window saw since the last `mount` was default-prevented; false when there was none. */
  lastKeyPrevented(): Promise<boolean>;
  /** Emulates `prefers-reduced-motion: reduce` (`on`), or `no-preference`, beside `forcedColors()`. */
  reducedMotion(on: boolean): Promise<void>;
  /**
   * Starts a frame record of `read` on the target (009 research.md R-13, R-17), and returns after two animation frames,
   * once the record's `ResizeObserver` has delivered its first observation of the target.
   */
  frameRecord(target: Target, read: Reading): Promise<FrameRecorder>;
  /** Waits two animation frames, then until every `ocelle-*` element of the page has rendered (`updateComplete`). */
  settle(): Promise<void>;
}
