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

/** One step of a pointer path: a point in the page's (the frame's) coordinates, and a press or release there. */
export interface PointerStep {
  readonly x: number;
  readonly y: number;
  /** Presses the button at this point, after moving there. */
  readonly down?: boolean;
  /** Releases the button at this point, after moving there (and after `down`, when both are set). */
  readonly up?: boolean;
  /** The mouse button of `down` and `up`; `left` when not set. */
  readonly button?: MouseButton;
}

export type MouseButton = "left" | "right" | "middle";

/**
 * An event recorded by `record()`, with the state read synchronously inside the listener, at dispatch: the host's
 * `open` (null when it has no boolean `open`), whether the first `<dialog>` of its shadow root is open and `:modal`
 * (false when it has none), and `focusPath()`.
 */
export interface RecordedEvent {
  readonly type: string;
  /** A `CustomEvent`'s detail as JSON would carry it, or null. */
  readonly detail: unknown;
  readonly cancelable: boolean;
  readonly bubbles: boolean;
  readonly composed: boolean;
  readonly open: boolean | null;
  readonly dialogOpen: boolean;
  readonly modal: boolean;
  readonly focusPath: string;
}

/** One keyframe of an animation: its computed offset, its easing and its property values. */
export type AnimationKeyframe = { readonly offset: number; readonly easing: string } & Readonly<Record<string, string | number>>;

/** One animation of an element, read through `getAnimations()`. */
export interface AnimationRecord {
  /** The effect's duration in milliseconds, or `"auto"`. */
  readonly duration: number | string;
  readonly easing: string;
  readonly playState: string;
  readonly keyframes: readonly AnimationKeyframe[];
}

/** An element in the top layer: its name (see `focusPath()`) and whether it is `:modal` and `:popover-open`. */
export interface TopLayerEntry {
  readonly element: string;
  readonly modal: boolean;
  readonly popoverOpen: boolean;
}

/** The input device and preferences the page sees. */
export interface Device {
  /** `(hover: hover)`. */
  readonly hover: boolean;
  /** `(pointer: fine)`. */
  readonly pointerFine: boolean;
  readonly maxTouchPoints: number;
  /** `(prefers-reduced-motion: reduce)`. */
  readonly reducedMotion: boolean;
}

/** The size of the page's viewport (the frame, in process), in CSS pixels. */
export interface Size {
  readonly width: number;
  readonly height: number;
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

  // The additions of 008 (research.md R-14). Input is real input through the browser (CDP): keys go to the focused
  // element, pointer input to a point of the page, so `:hover`, `:focus-visible` and the pointer events are the
  // browser's own. None of them writes a `style` attribute or a `<style>` element, so FR-047's counts are left alone;
  // `style()` above does write one and is not used by the overlay scenarios.

  /** Presses and releases `key` (a `KeyboardEvent.key` value: "Tab", "Escape", " ", …), with Shift held when `shift`. */
  press(key: string, options?: { readonly shift?: boolean }): Promise<void>;
  /** Moves the pointer to the centre of the element with `id` (or of `inner` in its shadow root), or with null to (0, 0). */
  hover(id: string | null, inner?: string): Promise<void>;
  /** Moves the pointer to the centre of the element with `id` (or of `inner`) and clicks there with `button` (`left`). */
  click(id: string, inner?: string, options?: { readonly button?: MouseButton }): Promise<void>;
  /** Moves the pointer through `path` in order, with intermediate moves, pressing and releasing where a step says so. */
  pointer(path: readonly PointerStep[]): Promise<void>;
  /** A real touch tap at the centre of the element with `id` (or of `inner`); only in a touch context. */
  touchTap(id: string, inner?: string): Promise<void>;
  /**
   * The deep active element: its name (its `id`, or its local name when it has none), with the active element of its
   * shadow root (open or closed) or of its frame after it in brackets, as deep as focus goes (`fh[in]`, `fr[f1]`); or
   * `"body"` when nothing is focused.
   */
  focusPath(): Promise<string>;
  /** Whether the element with `id` (or `inner` in its shadow root) matches `:focus-visible`. */
  focusVisible(id: string, inner?: string): Promise<boolean>;
  /** Emulates `prefers-reduced-motion: reduce`, or ends it. Ending forced colours (`forcedColors("none")`) ends it too. */
  reducedMotion(on: boolean): Promise<void>;
  /** The viewport's size. */
  viewport(): Promise<Size>;
  /** Resizes the viewport. */
  setViewport(width: number, height: number): Promise<void>;
  /** The input device and preferences the page sees. */
  device(): Promise<Device>;
  /** Starts recording the events `names` on the element with `id`, until the next `mount`. */
  record(id: string, names: readonly string[]): Promise<void>;
  /** The events recorded since the last `mount`, in dispatch order. */
  recorded(): Promise<RecordedEvent[]>;
  /** The animations of the element with `id` (or of `inner` in its shadow root), not of its subtree. */
  animations(id: string, inner?: string): Promise<AnimationRecord[]>;
  /** The open `:modal` and `:popover-open` elements of the page and its shadow roots, bottom first. */
  topLayer(): Promise<TopLayerEntry[]>;
  /** FR-047: the number of elements whose `style` attribute was written since the last `mount`, removed or not. */
  styleAttributes(): Promise<number>;
  /** FR-047: the number of `<style>` elements added to the document or a shadow root since the last `mount`, removed or not. */
  styleElements(): Promise<number>;
}
