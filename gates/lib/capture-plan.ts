// Every decision of the capture and of the in-page steps both Storybook gates share (FR-006, FR-009, FR-012, FR-026
// to FR-028, FR-030, FR-031; contracts/container.md § The capture's checks before any page, § Per story-theme;
// research.md R-04 to R-06, R-08, R-14, R-15): the refusal outside the pinned container, the browser context and
// screenshot options, the story's URL, readiness, request, recorded-call and storage-state classification, the
// pointer parameter and its viewport rule, the scroll decision and the one status of a capture. Pure, tested in
// process (gates/test/capture-plan.test.ts); gates/visual/capture.ts and gates/lib/story-page.ts only collect page data.
import type { Pin } from "./container.ts";
import type { CaptureEntry, Theme } from "./visual-verdict.ts";

/** What the refusal reads of the process it runs in (injected, so each check is tested alone). */
export interface Facts {
  readonly platform: string;
  readonly arch: string;
  readonly version: string;
  readonly env: Readonly<Record<string, string | undefined>>;
  /** Whether a directory exists. */
  readonly exists: (path: string) => boolean;
  /** The executable Playwright resolves for a headless launch without a channel. */
  readonly executable: string;
}

/** The cause of the capture's refusal (`not the pinned container: <check>: <detail>`), or undefined when all hold. */
export function refusal(facts: Facts, pin: Pin): string | undefined {
  const refuse = (check: string, detail: string): string => `not the pinned container: ${check}: ${detail}`;
  if (facts.platform !== "linux") return refuse("platform", `platform ${facts.platform}, expected linux`);
  if (facts.arch !== "x64") return refuse("arch", `arch ${facts.arch}, expected x64`);
  if (facts.version !== `v${pin.node}`) return refuse("node", `node ${facts.version}, expected v${pin.node}`);
  const variable = facts.env.OCELLE_VISUAL_PIN;
  if (variable === undefined || variable === "") return refuse("pin", "pin variable absent");
  if (variable !== pin.digest) return refuse("pin", "pin variable differs");
  const browser = `/ms-playwright/${pin.browser}`;
  if (!facts.exists(browser) || !facts.executable.startsWith(`${browser}/`)) return refuse("browser", `browser ${facts.executable}, expected ${browser}`);
  return undefined;
}

/** The browser context options of a story-theme, for the capture and the axe gate (research.md R-04, R-08). */
export interface ContextOptions {
  readonly viewport: { readonly width: number; readonly height: number };
  readonly deviceScaleFactor: number;
  readonly colorScheme: Theme;
  readonly reducedMotion: "reduce";
  readonly forcedColors: "none";
  readonly locale: string;
  readonly timezoneId: string;
}

export function contextOptions(theme: Theme): ContextOptions {
  return { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, colorScheme: theme, reducedMotion: "reduce", forcedColors: "none", locale: "en-GB", timezoneId: "UTC" };
}

/** The screenshot options of a capture. */
export interface ScreenshotOptions {
  readonly fullPage: true;
  readonly animations: "disabled";
  readonly caret: "hide";
}

export function screenshotOptions(): ScreenshotOptions {
  return { fullPage: true, animations: "disabled", caret: "hide" };
}

/** The path and query that open a story in a theme in the preview. */
export function storyPath(story: string, theme: Theme): string {
  return `/iframe.html?id=${story}&viewMode=story&globals=theme:${theme}`;
}

/** How long the capture waits for a render signal (research.md R-04). */
export const readinessTimeout = 15_000;

/** The first render signal the readiness recorder saw. */
export interface Signal {
  readonly kind: "storyRendered" | "storyThrewException" | "storyErrored" | "storyMissing" | "errorDisplay";
  readonly detail?: string;
}

/** What the first render signal (undefined: none within the timeout) means for the story-theme. */
export type Readiness = { readonly ready: true } | { readonly ready: false; readonly status: "render-failed" | "render-timeout"; readonly message: string };

/** Storybook's channel events by the recorder's kinds (spike § 2). */
const events: Readonly<Record<Exclude<Signal["kind"], "storyRendered" | "errorDisplay">, string>> = {
  storyThrewException: "STORY_THREW_EXCEPTION",
  storyErrored: "STORY_ERRORED",
  storyMissing: "STORY_MISSING",
};

export function readiness(signal: Signal | undefined): Readiness {
  if (signal === undefined) return { ready: false, status: "render-timeout", message: `no render signal within ${String(readinessTimeout / 1000)} s` };
  if (signal.kind === "storyRendered") return { ready: true };
  if (signal.kind === "errorDisplay") return { ready: false, status: "render-failed", message: "the error display is shown (sb-show-errordisplay)" };
  const event = events[signal.kind];
  return { ready: false, status: "render-failed", message: signal.detail === undefined ? event : `${event}: ${signal.detail}` };
}

/** A request the page makes, as the route sees it. */
export interface PageRequest {
  readonly url: string;
  readonly resourceType: string;
}

/** What the route does with a request, and what it records. */
export interface RequestDecision {
  readonly action: "continue" | "abort";
  readonly record?: { readonly kind: "io" | "network"; readonly text: string };
}

/** Storybook's own same-origin requests of the kinds that are I/O (research.md R-14, spike § 3). */
export const storybookRequests: readonly string[] = ["/index.json"];

/** The request types that are I/O when the page makes them to its own origin (research.md R-14). */
const ioTypes = new Set(["fetch", "xhr", "websocket", "eventsource", "ping"]);

/** The route's decision on a request: the origin's files served, I/O and requests elsewhere recorded. */
export function classifyRequest(request: PageRequest, origin: string, inDist: boolean): RequestDecision {
  const url = new URL(request.url);
  if (url.protocol === "data:" || url.protocol === "blob:") return { action: "continue" };
  if (url.host !== new URL(origin).host) return { action: "abort", record: { kind: "network", text: request.url } };
  const path = url.pathname;
  const io = !inDist || (ioTypes.has(request.resourceType) && !storybookRequests.includes(path));
  return io ? { action: "continue", record: { kind: "io", text: `${request.resourceType} ${path}` } } : { action: "continue" };
}

/** One call the I/O recorder saw (research.md R-14). */
export type RecordedCall =
  | { readonly kind: "storage-method"; readonly storage: "localStorage" | "sessionStorage"; readonly method: string }
  | { readonly kind: "storage-property"; readonly storage: "localStorage" | "sessionStorage"; readonly op: "get" | "set" | "delete" | "has"; readonly key: string }
  | { readonly kind: "cookie"; readonly op: "get" | "set" }
  | { readonly kind: "indexedDB"; readonly op: string; readonly name: string }
  | { readonly kind: "caches"; readonly op: string; readonly name?: string }
  | { readonly kind: "clipboard"; readonly op: string }
  | { readonly kind: "execCommand"; readonly command: string }
  | { readonly kind: "beacon"; readonly url: string };

/** Storybook's own storage, clipboard and beacon use (spike § 3: none). */
export const storybookCalls: readonly string[] = [];

/** The I/O text of a recorded call, or undefined when it is no I/O (execCommand of anything but copy and cut). */
function callText(call: RecordedCall): string | undefined {
  switch (call.kind) {
    case "storage-method":
      return `${call.storage}.${call.method}`;
    case "storage-property":
      return `${call.storage} ${call.op} ${call.key}`;
    case "cookie":
      return `cookie ${call.op}`;
    case "indexedDB":
      return `indexedDB.${call.op} ${call.name}`;
    case "caches":
      return call.name === undefined ? `caches.${call.op}` : `caches.${call.op} ${call.name}`;
    case "clipboard":
      return `clipboard.${call.op}`;
    case "execCommand": {
      const command = call.command.toLowerCase();
      return command === "copy" || command === "cut" ? `execCommand ${command}` : undefined;
    }
    case "beacon":
      return `sendBeacon ${call.url}`;
  }
}

/** The I/O texts of the recorded calls not on the allow-list, in order. */
export function ioCalls(calls: readonly RecordedCall[], allow?: readonly string[]): string[] {
  const allowed = allow ?? storybookCalls;
  return calls.flatMap((call) => {
    const text = callText(call);
    return text === undefined || allowed.includes(text) ? [] : [text];
  });
}

/** The storage left when the render ends, by kind and name. */
export interface StorageLeft {
  readonly cookies: readonly string[];
  readonly localStorage: readonly string[];
  readonly sessionStorage: readonly string[];
  readonly indexedDB: readonly string[];
}

/** The I/O texts of the storage left behind that is not on the allow-list. */
export function leftStorage(state: StorageLeft, allow?: readonly string[]): string[] {
  const allowed = allow ?? storybookCalls;
  const kinds = [
    ["cookie", state.cookies],
    ["localStorage", state.localStorage],
    ["sessionStorage", state.sessionStorage],
    ["indexedDB", state.indexedDB],
  ] as const;
  return kinds.flatMap(([kind, names]) => names.filter((name) => !allowed.includes(`${kind} ${name}`)).map((name) => `${kind} ${name} left when the render ends`));
}

/** A story's declared pointer state. */
export interface Pointer {
  readonly kind: "hover" | "press";
  readonly selector: string;
}

/** The story's pointer state from its parameters: none, the state, or the problem with a malformed one. */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parsePointer(parameters: unknown): Pointer | undefined | { readonly problem: string } {
  const ocelle = isObject(parameters) ? parameters.ocelle : undefined;
  if (!isObject(ocelle) || !("pointer" in ocelle)) return undefined;
  const { pointer } = ocelle;
  const malformed = { problem: "the pointer parameter is malformed: expected { hover: <selector> } or { press: <selector> }" };
  if (!isObject(pointer)) return malformed;
  const keys = Object.keys(pointer);
  if (keys.includes("hover") && keys.includes("press")) return { problem: "the pointer parameter names both hover and press" };
  const [kind] = keys;
  if (keys.length !== 1 || (kind !== "hover" && kind !== "press")) return malformed;
  const selector = pointer[kind];
  if (typeof selector !== "string" || selector === "") return { problem: `the pointer parameter's ${kind} is not a selector` };
  return { kind, selector };
}

/** A bounding box in viewport coordinates. */
export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Whether a box lies wholly inside the viewport (null: no box). */
export function targetInViewport(box: Box | null, viewport: { readonly width: number; readonly height: number }): boolean {
  if (box === null) return false;
  return box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width && box.y + box.height <= viewport.height;
}

/** The pointer-target problem of a declared state given how many elements match and the one's box, or undefined. */
export function pointerProblem(pointer: Pointer, matches: number, box: Box | null, viewport: { readonly width: number; readonly height: number }): string | undefined {
  if (matches === 0) return `${pointer.kind}: no element matches ${pointer.selector}`;
  if (matches > 1) return `${pointer.kind}: ${String(matches)} elements match ${pointer.selector}`;
  return targetInViewport(box, viewport) ? undefined : `${pointer.kind}: target outside the viewport: ${pointer.selector}`;
}

/** Whether the page must be scrolled back to (0, 0). */
export function scrollAction(x: number, y: number): "none" | "reset" {
  return x === 0 && y === 0 ? "none" : "reset";
}

/** Every condition one capture met. */
export interface Conditions {
  readonly renderFailed?: string;
  readonly renderTimeout?: string;
  readonly closedShadowRoot?: readonly string[];
  readonly pointerTarget?: string;
  readonly font?: readonly string[];
  readonly network?: readonly string[];
  readonly io?: readonly string[];
}

/** The one status of a capture and its details (data-model.md § Verdict per story-theme, steps 1 to 7). */
export function captureStatus(conditions: Conditions): Omit<CaptureEntry, "story" | "theme" | "file"> {
  const some = (items: readonly string[] | undefined): items is readonly string[] => items !== undefined && items.length > 0;
  if (conditions.renderFailed !== undefined) return { status: "render-failed", message: conditions.renderFailed };
  if (conditions.renderTimeout !== undefined) return { status: "render-timeout", message: conditions.renderTimeout };
  if (some(conditions.closedShadowRoot)) return { status: "closed-shadow-root", hosts: conditions.closedShadowRoot };
  if (conditions.pointerTarget !== undefined) return { status: "pointer-target", message: conditions.pointerTarget };
  if (some(conditions.font)) return { status: "font", families: conditions.font };
  if (some(conditions.network)) return { status: "network", urls: conditions.network };
  if (some(conditions.io)) return { status: "io", calls: conditions.io };
  return { status: "captured" };
}
