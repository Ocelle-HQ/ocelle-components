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

/** A modifier key held for a press or a click (Playwright's names). */
export type Modifier = "Alt" | "Control" | "Meta" | "Shift";

/** A mouse button. */
export type MouseButton = "left" | "middle" | "right";

/** Where a pointer action lands: the element with the `id`, or the first element matching `inner` in its shadow root. */
export interface Target {
  readonly inner?: string;
}

/** A click (012 research.md R-06, R-11): always sent with `force: true`, so a click on an unusable control is sent. */
export interface ClickOptions extends Target {
  readonly modifiers?: readonly Modifier[];
  readonly button?: MouseButton;
}

/**
 * One event as one listener of the recorder saw it (012 research.md R-11): `at` and `target` are the listener's node
 * and the event's target there, each `window`, `document`, `#shadow-root` or an element's local name with `#<id>` when
 * it has one; `detail` is the event's `detail` (a UI event's count, a custom event's payload) or null; `serial` is one
 * number per event object, from 1 at each mount, so the records of one dispatch share it.
 */
export interface EventRecord {
  readonly type: string;
  readonly at: string;
  readonly target: string | null;
  readonly isTrusted: boolean;
  readonly bubbles: boolean;
  readonly composed: boolean;
  readonly cancelable: boolean;
  readonly defaultPrevented: boolean;
  readonly detail: unknown;
  readonly serial: number;
}

/**
 * One activation of a link as the in-process navigation sink saw it (012 research.md R-11): whether something prevented
 * it before the sink, the button, the modifier flags and the link's `href` attribute.
 */
export interface NavigationRecord {
  readonly type: "click" | "auxclick";
  readonly defaultPrevented: boolean;
  readonly button: number;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly href: string;
}

/**
 * The accessibility node of one element as Chromium computes it (012 research.md R-11): its role and name, its
 * description (empty when none), the states (expanded, pressed and hasPopup null when the element states none), and the
 * ids of the elements it controls. `aria-current` is not here: CDP never reports it (`current`).
 */
export interface AxState {
  readonly role: string;
  readonly name: string;
  readonly description: string;
  readonly disabled: boolean;
  readonly expanded: boolean | null;
  readonly pressed: string | null;
  readonly hasPopup: string | null;
  readonly busy: boolean;
  readonly focusable: boolean;
  readonly controls: readonly string[];
}

/** An element's `aria-current`, as its attribute and as its `ariaCurrent` reflection (null when absent). */
export interface Current {
  readonly attribute: string | null;
  readonly property: string | null;
}

/** The reduced-motion preference the page emulates. */
export type Motion = "reduce" | "no-preference";

/**
 * One axe result (012 research.md R-11): the rule, its impact, whether a violation or an incomplete result, and each
 * node's target (shadow levels joined by ` >>> `). Every impact is reported, so a test can see that a moderate rule
 * 006's selection leaves out (`region`) gives nothing; 006's gate fails on the serious and critical ones.
 */
export interface AxeResult {
  readonly id: string;
  readonly impact: string;
  readonly kind: "violation" | "incomplete";
  readonly targets: readonly string[];
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
  /** The computed value of a CSS property of the element with `id`, or of the first element matching `inner` in its shadow root. */
  computed(id: string, property: string, inner?: string): Promise<string>;
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
  // 012 (research.md R-11; contracts/checks.md § Test harness): interaction, events, navigation, states and axe.
  /** Focuses the element with `id` (`focus()`). */
  focus(id: string): Promise<void>;
  /** Presses `key` (Playwright's key names; `" "` is Space) through the browser's keyboard, `modifiers` held. */
  press(key: string, modifiers?: readonly Modifier[]): Promise<void>;
  /** Clicks the element with `id` (or its shadow element `inner`) at its centre with the mouse, with `force: true`. */
  click(id: string, options?: ClickOptions): Promise<void>;
  /** Moves the mouse to the centre of the element with `id` (or its shadow element `inner`). */
  hover(id: string, options?: Target): Promise<void>;
  /** Moves the mouse to the element with `id` (or its shadow element `inner`) and presses the left button there. */
  pointerDown(id: string, options?: Target): Promise<void>;
  /** Moves the mouse to the element with `id` and releases the left button there. */
  pointerUp(id: string): Promise<void>;
  /**
   * The sequential focus order: Tab from the start of the page (or, with `reverse`, Shift+Tab from its end) until
   * focus leaves the page or comes round again; each step the path of focused elements from the document's active
   * element down through each shadow root's (described as `EventRecord.at` is).
   */
  tabOrder(options?: { readonly reverse?: boolean }): Promise<string[][]>;
  /** The focused element inside the shadow root of the element with `id`, described as `EventRecord.at` is, or null. */
  activeInner(id: string): Promise<string | null>;
  /**
   * Starts recording the events of `types` at the element with `id`, each of its ancestors, `document` and `window`,
   * in the bubble phase (each listener once, whatever the number of calls); the next `mount` stops it.
   */
  events(id: string, types: readonly string[]): Promise<void>;
  /** The records since the last `takeEvents` (or `mount`), in the order the listeners ran; empties the record. */
  takeEvents(): Promise<EventRecord[]>;
  /** Makes the next event of `type` call `preventDefault()` before any other listener of the page sees it. */
  preventNext(type: string): Promise<void>;
  /** In process, the navigation sink's records since the last `mount`; the fixture navigates for real instead and throws. */
  navigations(): Promise<NavigationRecord[]>;
  /** Emulates the reduced-motion preference; `forcedColors("none")` also resets it to `no-preference`. */
  reducedMotion(mode: Motion): Promise<void>;
  /** The accessibility node of the element with `id`, or of the first element matching `inner` in its shadow root. */
  axState(id: string, inner?: string): Promise<AxState>;
  /** The `aria-current` of the element with `id`, or of the first element matching `inner` in its shadow root. */
  current(id: string, inner?: string): Promise<Current>;
  /**
   * The violations and incomplete results, every impact, of axe-core on the whole page, or on the element with `scope`,
   * with 006's rule selection (gates/lib/axe-rules.ts `ruleMeta` and `ruleOptions`, as gates/bin/axe.ts).
   */
  axe(scope?: string): Promise<AxeResult[]>;
}
