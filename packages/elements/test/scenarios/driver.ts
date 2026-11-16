// The driver of the shared scenario bodies (005 research.md R-11, T013). A scenario body (scenarios/*.ts) is
// written once against this interface and run by two harnesses: in process on the element source (test/*.test.ts,
// the `elements` project, which Stryker mutates) and on the built browser build on strict-CSP fixture pages
// (test/browser/*.test.ts, the `elements-browser` project). Every method reads or acts on the page by element `id`;
// nothing in a body depends on which harness runs it. Elements inside a shadow root are reached by a selector in the
// element's shadow root.
import type { AxDetail, AxNode, ForcedColors, Palette, ReducedMotion } from "../commands.ts";
import type { DocumentCapture, LiveCapture } from "../live.ts";
import type { Pixels } from "../pixels.ts";

export type { AxDetail, AxNode, ForcedColors, Palette, ReducedMotion } from "../commands.ts";
export type { DocumentCapture, LiveCapture, Snapshot, StopOptions } from "../live.ts";
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
 * How `insert` puts markup into a container (specs/010-feedback-forms contracts/testing.md § Driver steps):
 * `innerHTML` (the container's `innerHTML` set to the markup), `template` (a `<template>`'s content cloned and
 * appended), `domparser` (the body nodes of a `DOMParser` document adopted and appended), `createElement` (the
 * elements built with `document.createElement`, their attributes and children set before insertion, then appended).
 */
export type InsertHow = "innerHTML" | "template" | "domparser" | "createElement";

/** A point in an element's border box, from its top left corner, in CSS pixels. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Form entries as `[name, value]` pairs, in order (a file's value is its name). */
export type Entries = readonly (readonly [string, string])[];

/** The announcement wait `W` in force, by the document's load state, in milliseconds. */
export interface Waits {
  readonly loaded: number;
  readonly loading: number;
}

/**
 * One DOM operation of a `batch` step (specs/010-feedback-forms phase 2): `insert` appends `markup` to the container by
 * fragment parsing (`insertAdjacentHTML("beforeend", …)`), `text` replaces the element's children with one text node
 * (`textContent`), `attribute` sets an attribute (null removes it), `property` sets a property, `move` appends the
 * element to another container (a removal and an insertion in one operation; an element a `remove` removed is found
 * by its id too), `remove` removes it, `focus` focuses it. `data` (phase 4) sets the data of the element's first child
 * node, a text node, so the change is a `characterData` mutation and not a `childList` one.
 */
export type Operation =
  | { readonly op: "insert"; readonly container: string; readonly markup: string }
  | { readonly op: "text"; readonly id: string; readonly text: string }
  | { readonly op: "data"; readonly id: string; readonly data: string }
  | { readonly op: "attribute"; readonly id: string; readonly name: string; readonly value: string | null }
  | { readonly op: "property"; readonly id: string; readonly name: string; readonly value: string | number | boolean | null }
  | { readonly op: "move"; readonly id: string; readonly to: string }
  | { readonly op: "remove"; readonly id: string }
  | { readonly op: "focus"; readonly id: string };

/**
 * One event a `listen` step heard (specs/010-feedback-forms phase 3): its type, the id of the element it was heard on,
 * the id of its target as the listener saw it (the local name for an element without an id), the `value` property of
 * the element it was heard on at that moment, its `detail` (a structured copy, null when it has none), and whether it
 * bubbles and is composed.
 */
export interface Heard {
  readonly type: string;
  readonly at: string;
  readonly target: string;
  readonly value: unknown;
  readonly detail: unknown;
  readonly bubbles: boolean;
  readonly composed: boolean;
}

/** An element's validity (`validity`'s flags), `validationMessage` and `willValidate`. */
export interface Validity {
  readonly valid: boolean;
  readonly valueMissing: boolean;
  readonly typeMismatch: boolean;
  readonly patternMismatch: boolean;
  readonly tooLong: boolean;
  readonly tooShort: boolean;
  readonly rangeUnderflow: boolean;
  readonly rangeOverflow: boolean;
  readonly stepMismatch: boolean;
  readonly badInput: boolean;
  readonly customError: boolean;
  readonly message: string;
  readonly willValidate: boolean;
}

/** A plain value a `call` step passes to a method. */
export type Plain = string | number | boolean | null;

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
  /** The live-region capture (contracts/testing.md § Live-region capture). */
  readonly liveCapture: LiveCapture;
  /** Puts `markup` into the element with `containerId` the way `how` says. */
  insert(containerId: string, markup: string, how: InsertHow): Promise<void>;
  /**
   * Returns after a `MessageChannel` round trip of its own, posted after the previous step, and one rendering update,
   * so a removal and an insertion separated by it are in different tasks.
   */
  laterTask(): Promise<void>;
  /**
   * Inserts `markup` into the element with `containerId` while `document.readyState` is `"interactive"`, with the
   * elements already defined, the capture armed before the insertion; returns the insertion's page time.
   */
  insertInteractive(containerId: string, markup: string): Promise<number>;
  /**
   * Returns no earlier than `ms` after the previous step's end, measured in the page, with the gap it achieved in page
   * milliseconds (from the previous step's end to its own return).
   */
  after(ms: number): Promise<number>;
  /** The announcement wait `W` in force for both load states, against which scenario bodies state their times. */
  readonly W: Waits;
  /** The announcer's hold `H` in force, in milliseconds (specs/010-feedback-forms research.md R-02). */
  readonly H: number;
  /**
   * Runs `operations` in order in one task of the page, then waits until every `ocelle-*` element has rendered, so
   * several changes of one step are changes "in one task" (specs/010-feedback-forms US1 scenarios 13 and 15).
   */
  batch(operations: readonly Operation[]): Promise<void>;
  /**
   * A property of the element with `id`, as the page holds it (013 phase 3: a converted attribute): a string, number or
   * boolean as it is, an unset one as undefined, null and anything else as null.
   */
  property(id: string, name: string): Promise<unknown>;
  /** The computed value of a CSS property of the first element matching `inner` in the shadow root of `id`, or "" without one. */
  computedIn(id: string, inner: string, property: string): Promise<string>;
  /** The content box (border and padding removed) of the first element matching `inner` in the shadow root of `id`. */
  contentBox(id: string, inner: string): Promise<Bounds>;
  /**
   * Puts `markup` into the container as part of the page as first loaded, its literal tag `ocelle-first-load` replaced
   * by `tag`, with the capture armed from before: in process the elements are upgraded by the registration of a fresh
   * subclass of `tag`'s class (`registerFirstLoad`); on fixture pages the page is navigated afresh (`startDocument`)
   * and its parser writes the markup, which the build loaded after it upgrades.
   */
  firstLoad(containerId: string, markup: string, tag: string): Promise<void>;
  /**
   * Defines `tag` once more as a second copy of the package would: through the guarded registration, with another
   * class; the first definition stays (Edge Cases, two copies).
   */
  defineSecond(tag: string): Promise<void>;
  /** The role of host `id` in the final snapshot of the last capture `liveCapture.stop()` returned. */
  hostRole(id: string): Promise<string>;
  /** The entries of `new FormData(form)` of the form with `formId`. */
  formData(formId: string): Promise<Entries>;
  /**
   * Submits the form with `formId` through its own submitter (its first submit button, or `requestSubmit()` when it
   * has none), or, after a key step, takes the submission that step made; returns the submitted entries, or null when
   * nothing was submitted.
   */
  submit(formId: string): Promise<Entries | null>;
  /** Resets the form with `formId`. */
  reset(formId: string): Promise<void>;
  /** Focuses the element with `id` and types `text` with the keyboard. */
  type(id: string, text: string): Promise<void>;
  /** Focuses the element with `id` and presses `key` (a key name, such as `Enter`). */
  press(id: string, key: string): Promise<void>;
  /** Moves focus away from the focused element. */
  blur(): Promise<void>;
  /** A pointer click at the point `at` of the border box of the element with `id`. */
  click(id: string, at: Point): Promise<void>;
  /** The focused element through shadow roots, outermost first, each as `localName` or `localName#id`. */
  focusPath(): Promise<string[]>;
  // The phase 3 steps (specs/010-feedback-forms T031 to T033).
  /** The unignored accessibility nodes of the element with `id` and of its shadow subtree, with descriptions and states. */
  axDetails(id: string): Promise<AxDetail[]>;
  /**
   * Starts recording the events of `types` that reach each element of `ids` (a listener on the element, bubble phase),
   * in the order they are heard, until the next `mount`.
   */
  listen(ids: readonly string[], types: readonly string[]): Promise<void>;
  /** The events heard since the last `heard` (or `listen`), in order; the record is then emptied. */
  heard(): Promise<Heard[]>;
  /** The validity flags, `validationMessage` and `willValidate` of the element with `id`. */
  validity(id: string): Promise<Validity>;
  /**
   * The ids of the elements a property of the element with `id` holds: of the element itself for an element, of each
   * item for a list (a `NodeList`, say), none for null or undefined.
   */
  ids(id: string, name: string): Promise<string[]>;
  /** `typeof` the property `name` of the element with `id`. */
  typeOf(id: string, name: string): Promise<string>;
  /** Whether `name in element` holds for the element with `id`. */
  has(id: string, name: string): Promise<boolean>;
  /** Calls the method `method` of the element with `id` with `args` and waits for every element to render; its result as `property` reads one. */
  call(id: string, method: string, ...args: readonly Plain[]): Promise<unknown>;
  /** A property of the first element matching `inner` in the shadow root of `id`, as `property` reads one; null without one. */
  propertyIn(id: string, inner: string, name: string): Promise<unknown>;
  /** The computed value of `property` of the pseudo-element `pseudo` of the first element matching `inner` in the shadow root of `id`. */
  pseudoIn(id: string, inner: string, pseudo: string, property: string): Promise<string>;
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

/** The in-process driver: the shared steps and the steps only the element source can take. */
export interface InProcessDriver extends Driver {
  /**
   * Mounts `markup` into the element with `containerId`, the literal tag `ocelle-first-load` replaced by a fresh
   * test-only tag, arms the capture on the container, then defines the fresh tag as `class extends base {}` through
   * `define` of src/define.ts, so the elements are upgraded by the registration (first load). Returns the fresh tag.
   */
  registerFirstLoad(containerId: string, markup: string, base: CustomElementConstructor): Promise<string>;
  /** Makes `document.readyState` read `value` until the next `mount` or the next call (null: the real value). */
  readyState(value: DocumentReadyState | null): Promise<void>;
  /** Whether the element with `id` is an instance of `constructor`. */
  instanceOf(id: string, constructor: abstract new (...args: never[]) => unknown): Promise<boolean>;
}

/** The fixture driver: the shared steps, the document mode of the capture and history navigation. */
export interface FixtureDriver extends Driver {
  readonly liveCapture: DocumentCapture;
  /**
   * Navigates away from the page (a page served with `Cache-Control: no-store`) and back through history; returns
   * the `persisted` flag of the `pageshow` event of the page shown again.
   */
  navigateAwayAndBack(): Promise<boolean>;
}
