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
  throw new Error(`not implemented (capture-plan, phase 3): ${facts.platform} ${pin.node}`);
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
  throw new Error(`not implemented (capture-plan, phase 3): ${theme}`);
}

/** The screenshot options of a capture. */
export interface ScreenshotOptions {
  readonly fullPage: true;
  readonly animations: "disabled";
  readonly caret: "hide";
}

export function screenshotOptions(): ScreenshotOptions {
  throw new Error("not implemented (capture-plan, phase 3)");
}

/** The path and query that open a story in a theme in the preview. */
export function storyPath(story: string, theme: Theme): string {
  throw new Error(`not implemented (capture-plan, phase 3): ${story} ${theme}`);
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

export function readiness(signal: Signal | undefined): Readiness {
  throw new Error(`not implemented (capture-plan, phase 3): ${String(signal?.kind)}`);
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
export const storybookRequests: readonly string[] = [];

/** The route's decision on a request: the origin's files served, I/O and requests elsewhere recorded. */
export function classifyRequest(request: PageRequest, origin: string, inDist: boolean): RequestDecision {
  throw new Error(`not implemented (capture-plan, phase 3): ${request.url} ${origin} ${String(inDist)}`);
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

/** The I/O texts of the recorded calls not on the allow-list, in order. */
export function ioCalls(calls: readonly RecordedCall[], allow?: readonly string[]): string[] {
  throw new Error(`not implemented (capture-plan, phase 3): ${String(calls.length)} ${String(allow?.length)}`);
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
  throw new Error(`not implemented (capture-plan, phase 3): ${String(state.cookies.length)} ${String(allow?.length)}`);
}

/** A story's declared pointer state. */
export interface Pointer {
  readonly kind: "hover" | "press";
  readonly selector: string;
}

/** The story's pointer state from its parameters: none, the state, or the problem with a malformed one. */
export function parsePointer(parameters: unknown): Pointer | undefined | { readonly problem: string } {
  throw new Error(`not implemented (capture-plan, phase 3): ${String(parameters)}`);
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
  throw new Error(`not implemented (capture-plan, phase 3): ${JSON.stringify(box)} ${String(viewport.width)}`);
}

/** The pointer-target problem of a declared state given how many elements match and the one's box, or undefined. */
export function pointerProblem(pointer: Pointer, matches: number, box: Box | null, viewport: { readonly width: number; readonly height: number }): string | undefined {
  throw new Error(`not implemented (capture-plan, phase 3): ${pointer.selector} ${String(matches)} ${JSON.stringify(box)} ${String(viewport.width)}`);
}

/** Whether the page must be scrolled back to (0, 0). */
export function scrollAction(x: number, y: number): "none" | "reset" {
  throw new Error(`not implemented (capture-plan, phase 3): ${String(x)} ${String(y)}`);
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
  throw new Error(`not implemented (capture-plan, phase 3): ${String(Object.keys(conditions).length)}`);
}
