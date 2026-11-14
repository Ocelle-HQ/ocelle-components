// The driver of the shared scenario bodies (005 research.md R-11, T013). A scenario body (scenarios/*.ts) is
// written once against this interface and run by two harnesses: in process on the element source (test/*.test.ts,
// the `elements` project, which Stryker mutates) and on the built browser build on strict-CSP fixture pages
// (test/browser/*.test.ts, the `elements-browser` project). Every method reads or acts on the page by element `id`;
// nothing in a body depends on which harness runs it. Elements inside a shadow root are reached by a selector in the
// element's shadow root.
import type { AxNode, ForcedColors, Palette } from "../commands.ts";
import type { DocumentCapture, LiveCapture } from "../live.ts";
import type { Pixels } from "../pixels.ts";

export type { AxNode, ForcedColors, Palette } from "../commands.ts";
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
