// The driver of the shared scenario bodies (005 research.md R-11, T013). A scenario body (scenarios/*.ts) is
// written once against this interface and run by two harnesses: in process on the element source (test/*.test.ts,
// the `elements` project, which Stryker mutates) and on the built browser build on strict-CSP fixture pages
// (test/browser/*.test.ts, the `elements-browser` project). Every method reads or acts on the page by element `id`;
// nothing in a body depends on which harness runs it. Elements inside a shadow root are reached by a selector in the
// element's shadow root.
import type { ActiveElement, AxNode, ForcedColors, Palette, ReducedMotion, TextBox } from "../commands.ts";
import type { Pixels } from "../pixels.ts";

export type { ActiveElement, AxNode, ForcedColors, Palette, ReducedMotion, TextBox } from "../commands.ts";
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

/**
 * An element the input and scroll methods act on: the element with an `id`, or the first element matching `inner` in
 * that element's shadow root (009 research.md R-17; 009's `Target`, renamed by operator decision D1).
 */
export type ElementTarget = string | { readonly id: string; readonly inner: string };

/** A point relative to the top-left corner of an element's border box, in CSS pixels. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * A click (012 research.md R-06, R-11): always sent with `force: true`, so a click on an unusable control is sent; at
 * the element's centre, or at `position` from its top-left corner (012 phase 2: the stretched and restyled hosts of
 * US1-15 and US1-17 are clicked 4 px inside an edge).
 */
export interface ClickOptions extends Target {
  readonly modifiers?: readonly Modifier[];
  readonly button?: MouseButton;
  readonly position?: Point;
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

/** The reduced-motion preference the page emulates (012; the same type as 013's `ReducedMotion`). */
export type Motion = ReducedMotion;

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

/**
 * What a frame record reads each time it records (009 research.md R-17): a DOM property (`scrollLeft`, `clientHeight`),
 * a computed CSS property (`mask-image`) or an attribute (`tabindex`), as text (an absent attribute reads `"null"`), of
 * the record's target or, with `of`, of another element.
 */
export type Reading = ({ readonly property: string } | { readonly computed: string } | { readonly attribute: string }) & { readonly of?: ElementTarget };

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
  /**
   * No move to this point, which must be the previous step's: its press and release follow that step's at once, with
   * no intermediate moves between them (each move waits for a frame).
   */
  readonly still?: boolean;
}

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

/**
 * One current animation or transition with a stable identity (018 research.md R-11; contracts/checks.md § Test harness
 * row 1): 013's `Running` record, and `identity`, a number the page gives each `Animation` object the first time it is
 * read and keeps for it (the same object reads the same number, a new object a new one), and `iterations`, its
 * effect's computed iteration count (`"infinite"` for an infinite one).
 */
export interface AnimationState extends Running {
  readonly identity: number;
  readonly iterations: number | "infinite";
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
  /** The computed value of a CSS property of the element with `id`, or of the first element matching `inner` in its shadow root. */
  computed(id: string, property: string, inner?: string): Promise<string>;
  /** The computed value of a CSS property of the target, a light-DOM or a shadow element (009's `computed`, renamed by D1). */
  computedOf(target: ElementTarget, property: string): Promise<string>;
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
  /**
   * Clicks the element with `id` (or its shadow element `inner`) with the mouse, with `force: true`, at its centre or at
   * `options.position`.
   */
  click(id: string, options?: ClickOptions): Promise<void>;
  /**
   * Calls the element's own `click()` method in the page, as a host's script does (012 phase 2: US1-2, US1-3), and
   * waits for every element to render.
   */
  callClick(id: string): Promise<void>;
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
  /** The accessibility node of the element with `id`, or of the first element matching `inner` in its shadow root. */
  axState(id: string, inner?: string): Promise<AxState>;
  /** The `aria-current` of the element with `id`, or of the first element matching `inner` in its shadow root. */
  current(id: string, inner?: string): Promise<Current>;
  /**
   * The violations and incomplete results, every impact, of axe-core on the whole page, or on the element with `scope`,
   * with 006's rule selection (gates/lib/axe-rules.ts `ruleMeta` and `ruleOptions`, as gates/bin/axe.ts).
   */
  axe(scope?: string): Promise<AxeResult[]>;
  // 012 phase 3 (US2-13): copies of the live DOM and a morph's attribute sync.
  /**
   * Copies the live DOM into the container `into` and waits for every element to render: `outerHTML` parses the element
   * `id`'s `outerHTML`, `clone` appends its `cloneNode(true)`, `innerHTML` writes the container `id`'s `innerHTML`. Each
   * id in the copy gets `-<into>` appended.
   */
  copy(id: string, via: CopyVia, into: string): Promise<void>;
  /**
   * Applies a morph's attribute sync (idiomorph's order) of the first element of `markup` to the live element `id`: set
   * each attribute that differs, then remove, from the last, each live attribute the markup lacks; waits for every
   * element to render.
   */
  morph(id: string, markup: string): Promise<void>;
  // The input, focus, scroll and frame-record plumbing of 009 research.md R-17.
  /**
   * Presses a key or a chord with real keyboard input, never a dispatched event (`:focus-visible` follows real input
   * only), then settles: `Tab`, `Shift+Tab`, `ArrowLeft`, `ArrowRight`, `Home`, `End`, `Alt+ArrowLeft`,
   * `Ctrl+ArrowRight`, `Meta+ArrowRight`, `Shift+ArrowRight` (009 research.md R-17). 008's `inputPress(key, options)`
   * (below) presses one key, with Shift held when asked.
   */
  chord(key: string): Promise<void>;
  /**
   * A real pointer click at `point` of the target's border box, then a settle. 008's `inputClick(id, inner, options)`
   * (below) clicks the centre of an element.
   */
  clickAt(target: ElementTarget, point: Point): Promise<void>;
  /** A real wheel event over the centre of the target's border box, `deltaX` CSS px to the right, then a settle. */
  wheel(target: ElementTarget, deltaX: number): Promise<void>;
  /**
   * The deep active element: from `document.activeElement` down through each shadow root's active element, each level
   * as its `id`, or as its local name and its classes (`div.region-box`) when it has none, joined by `" >> "`
   * (`"s1 >> div.region-box"`, `"l3"`, `"body"`). 011's `activeElement()` (below) reads the same element as a record.
   */
  deepActive(): Promise<string>;
  /**
   * Focuses the element with id `from` by script, then presses `Tab` (or `Shift+Tab` when `backward`) until the deep
   * active element is `to` (an id, or a deep active element as `deepActive()` names it), and returns
   * `deepActive()` after each press, `to` included; at most 40 presses.
   */
  tabWalk(from: string, to: string, backward?: boolean): Promise<string[]>;
  /**
   * Focuses the target by script (`focus()`), then settles (009's `focus`, renamed by D1). Chromium's `:focus-visible` follows the last input: after
   * keyboard input the target matches it, after a pointer click it does not.
   */
  focusTarget(target: ElementTarget): Promise<void>;
  /** The target's `scrollLeft`. */
  scrollLeft(target: ElementTarget): Promise<number>;
  /** Sets the target's `scrollLeft` with an instant scroll, then settles. */
  setScrollLeft(target: ElementTarget, value: number): Promise<void>;
  /** Whether the last keydown the window saw since the last `mount` was default-prevented; false when there was none. */
  lastKeyPrevented(): Promise<boolean>;
  /**
   * Starts a frame record of `read` on the target (009 research.md R-13, R-17), and returns after two animation frames,
   * once the record's `ResizeObserver` has delivered its first observation of the target.
   */
  frameRecord(target: ElementTarget, read: Reading): Promise<FrameRecorder>;
  /** Waits two animation frames, then until every `ocelle-*` element of the page has rendered (`updateComplete`). */
  settle(): Promise<void>;

  // The additions of 008 (research.md R-14). Input is real input through the browser (CDP): keys go to the focused
  // element, pointer input to a point of the page, so `:hover`, `:focus-visible` and the pointer events are the
  // browser's own. None of them writes a `style` attribute or a `<style>` element, so FR-047's counts are left alone;
  // `style()` above does write one and is not used by the overlay scenarios. Their key, hover and click methods are
  // `inputPress`, `inputHover` and `inputClick`, apart from 012's `press`, `hover` and `click` (operator decision C2).

  /** Presses and releases `key` (a `KeyboardEvent.key` value: "Tab", "Escape", " ", …), with Shift held when `shift`. */
  inputPress(key: string, options?: { readonly shift?: boolean }): Promise<void>;
  /** Moves the pointer to the centre of the element with `id` (or of `inner` in its shadow root), or with null to (0, 0). */
  inputHover(id: string | null, inner?: string): Promise<void>;
  /** Moves the pointer to the centre of the element with `id` (or of `inner`) and clicks there with `button` (`left`). */
  inputClick(id: string, inner?: string, options?: { readonly button?: MouseButton }): Promise<void>;
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
  // Reduced motion is 013's `reducedMotion(mode)` and resizing is 013's `viewport(width, height)`, below (the merge of
  // #43 kept them and converted 008's calls to them). Forced colours leave reduced motion alone.
  /** The viewport's size. */
  viewportSize(): Promise<Size>;
  /** The input device and preferences the page sees. */
  device(): Promise<Device>;
  /** Starts recording the events `names` on the element with `id`, until the next `mount`. */
  record(id: string, names: readonly string[]): Promise<void>;
  /** The events recorded since the last `mount`, in dispatch order. */
  recorded(): Promise<RecordedEvent[]>;
  /**
   * The animations of the element with `id` (or of `inner` in its shadow root), not of its subtree, with their
   * keyframes (008; 013's `animations(id)` below reads the element and its whole shadow root instead).
   */
  ownAnimations(id: string, inner?: string): Promise<AnimationRecord[]>;
  /** The open `:modal` and `:popover-open` elements of the page and its shadow roots, bottom first. */
  topLayer(): Promise<TopLayerEntry[]>;
  /** FR-047: the number of elements whose `style` attribute was written since the last `mount`, removed or not. */
  styleAttributes(): Promise<number>;
  /** FR-047: the number of `<style>` elements added to the document or a shadow root since the last `mount`, removed or not. */
  styleElements(): Promise<number>;
  // Light DOM, keyboard and size plumbing, and the document readers of 011 research.md R-13 (T006, T007).
  /** Appends `markup` (no `style` attribute) to the light DOM of the element with `id`, after its children, and waits for every element to render. */
  append(id: string, markup: string): Promise<void>;
  /** Removes the element with `id` from the page and waits for every element to render. */
  remove(id: string): Promise<void>;
  /**
   * Sets the data of the `index`-th text-node child (counting text nodes only, from 0) of the element with `id`, and
   * waits for every element to render.
   */
  textData(id: string, index: number, data: string): Promise<void>;
  /** Presses Tab, or Shift+Tab with `shift`, and waits for every element to render. */
  tab(shift?: boolean): Promise<void>;
  /** The focused element through open shadow roots, with the hosts on its path (test/commands.ts `readActiveElement`). */
  activeElement(): Promise<ActiveElement>;
  /**
   * Sets the viewport to `width` × `height` CSS px and waits for every element to render; it stays until set again: in
   * process the test's iframe (`vitest/browser`'s `page.viewport`, 1280 × 800 by vitest.config.ts since 008), on the
   * fixture pages the page itself (`page.setViewportSize`, 1280 × 800 when the page opens). A 009 frame scenario sets its frame's
   * viewport before it mounts (009 research.md R-17).
   */
  viewport(width: number, height: number): Promise<void>;
  /**
   * Sets the `inline-size` and `block-size` of the element with `id` (a container) through the CSSOM, in px; null
   * removes the value. Waits for every element to render.
   */
  size(id: string, inline: number | null, block: number | null): Promise<void>;
  /** The document's scrolling width (test/commands.ts `readScrollWidth`). */
  scrollWidth(): Promise<number>;
  /** Each text node under the element with `id`, its box and its clipping ancestors (test/commands.ts `readTextBoxes`). */
  textBoxes(id: string): Promise<TextBox[]>;
  // Event recording of 011 research.md R-05, R-13 (phase 2); its DOM move is `move` of the 013 additions below.
  /**
   * Starts recording every event dispatched by script (`EventTarget.prototype.dispatchEvent`, which a custom element's
   * own `dispatchEvent` calls) whose target is an element with one of `ids` or a node in the shadow tree of one, and
   * every event that reaches one of those elements in the capture phase for the types in `heardTypes`. It records
   * until `heard`, across `mount`, so it may be called before the elements exist.
   */
  listen(ids: readonly string[]): Promise<void>;
  /** Stops the recording `listen` started and returns what it recorded, as `<id>: <type>` in dispatch order. */
  heard(): Promise<string[]>;
  // 011 User Story 4 (US4-10, contracts/checks.md: the README's orientation example run on the page).
  /**
   * Runs `code` as an ES module of the page loaded from a same-origin URL (the fixture serves it under the page's
   * policy, so `script-src 'self'` allows it), and waits until it has run and every element has rendered.
   */
  module(code: string): Promise<void>;
  /**
   * A number for each element in the shadow root of the element with `id`, depth first in tree order: the same number
   * for the same node across calls on one page, a new number for a node first seen, so a body can tell kept nodes from
   * new ones (research.md R-10: the template does not change with orientation).
   */
  identities(id: string): Promise<number[]>;
  // A shell's own shadow root, forwarding a slot into an element (011 research.md R-05 § Forwarded slots; phase 2
  // review R4-01). The nodes of that shadow root are reached by a selector in it, `inner`.
  /**
   * Attaches an open shadow root holding `markup` (no `style` attribute) to the element with `id`, and waits for every
   * element, those in that shadow root included, to render.
   */
  shadow(id: string, markup: string): Promise<void>;
  /**
   * Appends `markup` (no `style` attribute) to the element matching `inner` in the shadow root of the element with
   * `id`, after its children, and waits for every element, those in that shadow root included, to render.
   */
  shadowAppend(id: string, inner: string, markup: string): Promise<void>;
  /**
   * Sets an attribute (null removes it) of the element matching `inner` in the shadow root of the element with `id`,
   * and waits for every element, those in that shadow root included, to render.
   */
  shadowAttribute(id: string, inner: string, name: string, value: string | null): Promise<void>;
  /** The computed value of a CSS property of the element matching `inner` in the shadow root of the element with `id`. */
  shadowComputed(id: string, inner: string, property: string): Promise<string>;
  // The additions of 013 phase 1 (contracts/checks.md § Driver additions; tasks.md T003); 013 also uses `viewport`,
  // `scrollWidth` and `remove` above, which 011 added too, and `move` below serves 011 phase 2 as well.
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
  clipboardCopy(id: string): Promise<string>;
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
  /**
   * Emulates `prefers-reduced-motion: reduce`, or ends it with `"no-preference"`, beside `forcedColors()`, and waits for
   * every element to render (since 009 the scroller scenarios use it too).
   */
  reducedMotion(mode: ReducedMotion): Promise<void>;
  /** The current animations and transitions on the element with `id` and in its shadow root, in tree order. */
  animations(id: string): Promise<Running[]>;
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
  dispatched(id: string, during: () => Promise<void>): Promise<string[]>;
  // The additions of 018 phase 1 (contracts/checks.md § Test harness rows 1, 2, 7 and 8; tasks.md T008). Rows 3 to 6
  // are `text`/`textData`, `topLayer`, `focusVisible`/`focusPath` and `click` with `position`/`clickAt` above, as merged.
  /**
   * The current animations and transitions on the element with `id` and in its shadow root, in tree order, as
   * `animations(id)` reads them, each with its stable identity and its iteration count (row 1).
   */
  animationStates(id: string): Promise<AnimationState[]>;
  /**
   * Pauses every animation of the element matching `inner` in the shadow root of the element with `id` (of the element
   * itself when `inner` is null), not of its subtree, at `ms` of its current time, then settles (row 2). Rejects when
   * the element has no animation.
   */
  seek(id: string, inner: string | null, ms: number): Promise<void>;
  /**
   * Settles (`settle`), then waits until the page's layout holds still (row 7): once per animation frame, after every
   * `ocelle-*` element's update, it reads the border box of every element of the document and of every open shadow
   * root after the frame's rendering (so after its `ResizeObserver` delivery and the update that delivery requests),
   * and returns from the second frame on when two consecutive reads agree and no element has an update pending. An
   * element with a running animation of its own, and its subtree, is left out of the read (a running animation moves
   * them every frame). Rejects after 30 frames.
   */
  settleLayout(): Promise<void>;
  /**
   * The fractional overflow measure of 018 research.md R-09 (row 8), on the target: whether its content's inline extent
   * (a `Range` from before the first to after the last node assigned to the first `slot` in it, or of its own child
   * nodes when it holds no slot) passes the inline end of its content box (the inline start when its direction is
   * right-to-left) by more than 0, in fractional CSS pixels. False when there is no content.
   */
  overflows(target: ElementTarget): Promise<boolean>;
  // The additions of 018 phase 2 (tasks.md T012): a run moved on in time without pausing it, and a state-preserving
  // move, for the pulse bodies of scenarios/status-indicator.ts (contracts/checks.md § US1 bodies).
  /**
   * Sets the current time of every animation of the element matching `inner` in the shadow root of the element with
   * `id` to `ms`, leaving each running (unlike `seek`, which pauses), then settles. Rejects when the element has no
   * animation, so a run never passes as moved on when there was none.
   */
  advance(id: string, inner: string, ms: number): Promise<void>;
  /**
   * Moves the element with `id` to the end of the element with `parentId` with `moveBefore()`, the state-preserving
   * move, and waits for every element to render; rejects where the engine has no `moveBefore()`.
   */
  moveBefore(id: string, parentId: string): Promise<void>;
}

/** How `copy` copies the live DOM. */
export type CopyVia = "outerHTML" | "clone" | "innerHTML";

/**
 * The event types `listen` also hears in the capture phase on the elements themselves: those an element could emit
 * for a slot or attribute change, and the library's own prefix is covered by the dispatch record.
 */
export const heardTypes: readonly string[] = ["change", "input", "select", "toggle", "slotchange", "click", "focus", "blur", "load", "error"];
