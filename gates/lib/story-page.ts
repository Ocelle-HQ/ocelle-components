// The page side of a story-theme, shared by the capture and the axe gate (FR-006, FR-014, FR-027, FR-028, FR-030,
// FR-031; contracts/container.md § Per story-theme; research.md R-04, R-05, R-08, R-14, R-15): the init script (the
// readiness recorder, the closed attachShadow recorder and the I/O recorder with the storage Proxy, cookie,
// IndexedDB, Cache API, clipboard, execCommand and beacon wraps), the request route, and the collection of plain data
// for the pure decisions of gates/lib/capture-plan.ts and gates/lib/story-checks.ts: the first render signal, the
// scroll position, the pointer parameter and its target, the text nodes of the story area through the DevTools
// protocol with `pierce: true` and their platform fonts, the font faces, and the storage left when the render ends.
// It is wiring only: every decision is in those modules, and each line here is a process boundary covered by the
// visual plants and gates/test/integration/visual.test.ts.
import { existsSync } from "node:fs";
import type { BrowserContext, CDPSession, Page } from "playwright";
import { classifyRequest, contextOptions, ioCalls, leftStorage, parsePointer, pointerProblem, readiness, readinessTimeout, scrollAction, storyPath } from "./capture-plan.ts";
import type { Conditions, RecordedCall, Signal } from "./capture-plan.ts";
import { closedShadowHosts, fontProblems, storyTextNodes } from "./story-checks.ts";
import type { CdpNode, ShadowCall, TextNode } from "./story-checks.ts";
import { servedFile } from "./storybook-serve.ts";
import type { Theme } from "./visual-verdict.ts";

/** What the init script records in the page (window.__ocelleCapture). */
interface Recorded {
  readonly signal: Signal | undefined;
  readonly shadows: readonly ShadowCall[];
  readonly calls: readonly RecordedCall[];
}

/** The page's record: what the init script saw, and how to read the session storage keys without recording. */
interface PageState {
  signal: Signal | undefined;
  readonly shadows: ShadowCall[];
  readonly calls: RecordedCall[];
  readonly sessionKeys: () => string[];
}

/** A method of an object, as the wraps call it. */
type Method = (this: unknown, ...args: unknown[]) => unknown;

/**
 * The init script, run in every page before Storybook's own code: it records the first render signal (Storybook's
 * channel events through a setter trap on the channel, and the error display's body class), every attachShadow call,
 * and every storage, clipboard and beacon call (research.md R-14). It keeps the real storage objects and the real
 * key method, so the storage-state read records nothing.
 */
// Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
export function recorders(): void {
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const realLocal = window.localStorage;
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const realSession = window.sessionStorage;
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const realKey = Object.getOwnPropertyDescriptor(Storage.prototype, "key")?.value as (this: Storage, index: number) => string | null;
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const state: PageState = {
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    signal: undefined,
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    shadows: [],
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    calls: [],
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    sessionKeys: () => Array.from({ length: realSession.length }, (_, at) => realKey.call(realSession, at) ?? ""),
  };
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  Object.defineProperty(window, "__ocelleCapture", { value: state });
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const signal = (kind: Signal["kind"], detail?: unknown): void => {
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    if (state.signal !== undefined) return;
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    const fields = typeof detail === "object" && detail !== null ? (detail as { message?: unknown; id?: unknown }) : {};
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    const found = typeof detail === "string" ? detail : (fields.message ?? fields.id);
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    const text = typeof found === "string" || typeof found === "number" ? String(found) : undefined;
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    state.signal = text === undefined ? { kind } : { kind, detail: text };
  };
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  let channel: unknown;
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  Object.defineProperty(window, "__STORYBOOK_ADDONS_CHANNEL__", {
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    configurable: true,
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    get: () => channel,
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    set: (value: { on: (event: string, listener: (arg: unknown) => void) => void }) => {
      // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      channel = value;
      // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      for (const kind of ["storyRendered", "storyThrewException", "storyErrored", "storyMissing"] as const) {
        // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
        value.on(kind, (arg) => {
          // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
          signal(kind, arg);
        });
      }
    },
  });
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const watchBody = (): void => {
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    const check = (): void => {
      // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      if (document.body.classList.contains("sb-show-errordisplay")) signal("errorDisplay");
    };
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    check();
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    new MutationObserver(check).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  };
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const loading = document.readyState === "loading";
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  if (loading) document.addEventListener("DOMContentLoaded", watchBody);
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  if (!loading) watchBody();
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const attach = Object.getOwnPropertyDescriptor(Element.prototype, "attachShadow")?.value as (this: Element, init: ShadowRootInit) => ShadowRoot;
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  Element.prototype.attachShadow = function (this: Element, init: ShadowRootInit): ShadowRoot {
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    state.shadows.push({ mode: init.mode, host: this.localName });
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    return attach.call(this, init);
  };
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const record = (call: RecordedCall): void => {
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    state.calls.push(call);
  };
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const storageName = (target: unknown): "localStorage" | "sessionStorage" => (target === realSession ? "sessionStorage" : "localStorage");
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const wrap = (target: object | undefined, methods: readonly string[], call: (method: string, args: readonly unknown[], self: unknown) => RecordedCall): void => {
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    if (target === undefined) return;
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    const table = target as Record<string, unknown>;
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    for (const method of methods) {
      // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      const real = table[method];
      // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      if (typeof real !== "function") continue;
      // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      const wrapped: Method = function (this: unknown, ...args: unknown[]): unknown {
        // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
        record(call(method, args, this));
        // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
        return (real as Method).apply(this, args);
      };
      // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      table[method] = wrapped;
    }
  };
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  wrap(Storage.prototype, ["getItem", "setItem", "removeItem", "clear", "key"], (method, _, self) => ({ kind: "storage-method", storage: storageName(self), method }));
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const members = new Set(Object.getOwnPropertyNames(Storage.prototype));
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const named = (key: string | symbol): key is string => typeof key === "string" && !members.has(key);
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const proxy = (target: Storage): Storage =>
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    new Proxy(target, {
      // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      get(object, key) {
        // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
        const value: unknown = Reflect.get(object, key, object);
        // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
        if (named(key)) record({ kind: "storage-property", storage: storageName(object), op: "get", key });
        // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
        return typeof value === "function" ? (value as Method).bind(object) : value;
      },
      // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      set(object, key, value) {
        // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
        if (named(key)) record({ kind: "storage-property", storage: storageName(object), op: "set", key });
        // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
        return Reflect.set(object, key, value, object);
      },
      // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      has(object, key) {
        // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
        if (named(key)) record({ kind: "storage-property", storage: storageName(object), op: "has", key });
        // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
        return Reflect.has(object, key);
      },
      // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      deleteProperty(object, key) {
        // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
        if (named(key)) record({ kind: "storage-property", storage: storageName(object), op: "delete", key });
        // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
        return Reflect.deleteProperty(object, key);
      },
    });
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const local = proxy(realLocal);
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const session = proxy(realSession);
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  Object.defineProperty(window, "localStorage", { configurable: true, get: () => local });
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  Object.defineProperty(window, "sessionStorage", { configurable: true, get: () => session });
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const cookie = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const accessors = cookie as { readonly get?: (this: Document) => string; readonly set?: (this: Document, value: string) => void } | undefined;
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const getCookie = accessors?.get;
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const setCookie = accessors?.set;
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  if (getCookie !== undefined && setCookie !== undefined) {
    // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    Object.defineProperty(Document.prototype, "cookie", {
      // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      configurable: true,
      // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      get(this: Document): unknown {
        // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
        record({ kind: "cookie", op: "get" });
        // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
        return getCookie.call(this);
      },
      // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      set(this: Document, value: string) {
        // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
        record({ kind: "cookie", op: "set" });
        // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
        setCookie.call(this, value);
      },
    });
  }
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  wrap(IDBFactory.prototype, ["open", "deleteDatabase"], (op, args) => ({ kind: "indexedDB", op, name: String(args[0]) }));
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const named0 = (op: string, args: readonly unknown[]): RecordedCall => (op === "open" || op === "has" || op === "delete" ? { kind: "caches", op, name: String(args[0]) } : { kind: "caches", op });
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  wrap(typeof CacheStorage === "undefined" ? undefined : CacheStorage.prototype, ["open", "has", "delete", "keys", "match"], named0);
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  wrap(typeof Clipboard === "undefined" ? undefined : Clipboard.prototype, ["write", "writeText"], (op) => ({ kind: "clipboard", op }));
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  wrap(Document.prototype, ["execCommand"], (_, args) => ({ kind: "execCommand", command: String(args[0]) }));
  // Stryker disable next-line all: process boundary, run in the page as an init script; covered by the visual plants fail-local-storage, fail-storage-property, fail-session-storage, fail-cookie, fail-indexeddb, fail-cache-api, fail-clipboard-write, fail-exec-copy, fail-beacon, fail-closed-shadow-root, fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  wrap(Navigator.prototype, ["sendBeacon"], (_, args) => ({ kind: "beacon", url: String(args[0]) }));
}

/** What the route and the websocket listener recorded for one page. */
export interface Requests {
  readonly network: string[];
  readonly io: string[];
}

/** Opens a story-theme in a new page of `context` (already made with contextOptions(theme)), with the recorders and the route. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
export async function openStory(context: BrowserContext, origin: string, dist: string, story: string, theme: Theme): Promise<{ readonly page: Page; readonly requests: Requests }> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const requests: Requests = { network: [], io: [] };
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-network, fail-same-origin-fetch, fail-xhr and fail-font-file-missing
  const keep = (record: { readonly kind: "io" | "network"; readonly text: string } | undefined): void => {
    // Stryker disable next-line all: process boundary, covered by the visual plants fail-network, fail-same-origin-fetch, fail-xhr and fail-font-file-missing
    if (record !== undefined) requests[record.kind].push(record.text);
  };
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  await context.addInitScript(recorders);
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-network, fail-same-origin-fetch, fail-xhr and fail-font-file-missing
  await context.route("**/*", async (route) => {
    // Stryker disable next-line all: process boundary, covered by the visual plants fail-network, fail-same-origin-fetch, fail-xhr and fail-font-file-missing
    const request = route.request();
    // Stryker disable next-line all: process boundary, covered by the visual plants fail-network, fail-same-origin-fetch, fail-xhr and fail-font-file-missing
    const file = servedFile(dist, new URL(request.url()).pathname);
    // Stryker disable next-line all: process boundary, covered by the visual plants fail-network, fail-same-origin-fetch, fail-xhr and fail-font-file-missing
    const decision = classifyRequest({ url: request.url(), resourceType: request.resourceType() }, origin, file !== undefined && existsSync(file));
    // Stryker disable next-line all: process boundary, covered by the visual plants fail-network, fail-same-origin-fetch, fail-xhr and fail-font-file-missing
    keep(decision.record);
    // Stryker disable next-line all: process boundary, covered by the visual plants fail-network, fail-same-origin-fetch, fail-xhr and fail-font-file-missing
    await (decision.action === "abort" ? route.abort() : route.continue());
  });
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const page = await context.newPage();
  // Stryker disable next-line all: process boundary, covered by the visual plant fail-websocket
  page.on("websocket", (socket) => {
    // Stryker disable next-line all: process boundary, covered by the visual plant fail-websocket
    keep(classifyRequest({ url: socket.url(), resourceType: "websocket" }, origin, false).record);
  });
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  await page.goto(`${origin}${storyPath(story, theme)}`);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  return { page, requests };
}

/** The first render signal within the readiness timeout, as the readiness decision reads it. */
// Stryker disable next-line all: process boundary, covered by the visual plants fail-throws-on-load and fail-render-throws, and by gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
export async function waitForRender(page: Page): Promise<ReturnType<typeof readiness>> {
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-throws-on-load and fail-render-throws
  const recordedSignal = (): Signal | undefined => (window as unknown as { __ocelleCapture: Recorded }).__ocelleCapture.signal;
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-throws-on-load and fail-render-throws
  const options = { timeout: readinessTimeout };
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-throws-on-load and fail-render-throws
  const waited = page.waitForFunction(recordedSignal, undefined, options);
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-throws-on-load and fail-render-throws
  const timedOut = (): undefined => undefined;
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-throws-on-load and fail-render-throws
  const signal = await waited.then((handle) => handle.jsonValue() as Promise<Signal>, timedOut);
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-throws-on-load and fail-render-throws
  return readiness(signal);
}

/** Scrolls the page back to (0, 0) when a story moved it (research.md R-04). */
// Stryker disable next-line all: process boundary, covered by the visual plant pass-focus-below-fold
export async function scrollBack(page: Page): Promise<void> {
  // Stryker disable next-line all: process boundary, covered by the visual plant pass-focus-below-fold
  const { x, y } = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
  // Stryker disable next-line all: process boundary, covered by the visual plant pass-focus-below-fold
  if (scrollAction(x, y) === "reset") {
    // Stryker disable next-line all: process boundary, covered by the visual plant pass-focus-below-fold
    await page.evaluate(() => {
      // Stryker disable next-line all: process boundary, covered by the visual plant pass-focus-below-fold
      window.scrollTo(0, 0);
    });
  }
}

/** Applies the story's declared pointer state with page.mouse only; the pointer-target problem, or undefined (research.md R-15). */
// Stryker disable next-line all: process boundary, covered by the visual plants pass-hover-and-press, fail-hover-style-changed, fail-press-style-changed, fail-pointer-target-missing and fail-pointer-target-below-fold
export async function applyPointer(page: Page, theme: Theme): Promise<string | undefined> {
  // Stryker disable next-line all: process boundary, covered by the visual plants pass-hover-and-press and fail-pointer-target-missing
  const parameters = await page.evaluate(() => {
    // Stryker disable next-line all: process boundary, covered by the visual plants pass-hover-and-press and fail-pointer-target-missing
    const current = (window as unknown as { __STORYBOOK_PREVIEW__?: { currentRender?: { story?: { parameters?: Record<string, unknown> } } } }).__STORYBOOK_PREVIEW__?.currentRender?.story?.parameters;
    // Stryker disable next-line all: process boundary, covered by the visual plants pass-hover-and-press and fail-pointer-target-missing
    return current === undefined ? undefined : JSON.parse(JSON.stringify({ ocelle: current.ocelle ?? {} })) as unknown;
  });
  // Stryker disable next-line all: process boundary, covered by the visual plants pass-hover-and-press and fail-pointer-target-missing
  const pointer = parsePointer(parameters);
  // Stryker disable next-line all: process boundary, covered by the visual plants pass-hover-and-press and fail-pointer-target-missing
  if (pointer === undefined) return undefined;
  // Stryker disable next-line all: process boundary, covered by the visual plants pass-hover-and-press and fail-pointer-target-missing
  if ("problem" in pointer) return pointer.problem;
  // Stryker disable next-line all: process boundary, covered by the visual plants pass-hover-and-press and fail-pointer-target-missing
  const target = page.locator(pointer.selector);
  // Stryker disable next-line all: process boundary, covered by the visual plants pass-hover-and-press and fail-pointer-target-missing
  const matches = await target.count();
  // Stryker disable next-line all: process boundary, covered by the visual plants pass-hover-and-press and fail-pointer-target-below-fold
  const box = matches === 1 ? await target.boundingBox() : null;
  // Stryker disable next-line all: process boundary, covered by the visual plants pass-hover-and-press, fail-pointer-target-missing and fail-pointer-target-below-fold
  const problem = pointerProblem(pointer, matches, box, contextOptions(theme).viewport);
  // Stryker disable next-line all: process boundary, covered by the visual plants pass-hover-and-press, fail-pointer-target-missing and fail-pointer-target-below-fold
  if (problem !== undefined || box === null) return problem;
  // Stryker disable next-line all: process boundary, covered by the visual plants pass-hover-and-press and fail-hover-style-changed
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  // Stryker disable next-line all: process boundary, covered by the visual plants pass-hover-and-press and fail-press-style-changed
  if (pointer.kind === "press") await page.mouse.down();
  // Stryker disable next-line all: process boundary, covered by the visual plants pass-hover-and-press
  return undefined;
}

/** Waits for the fonts and two animation frames. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
export async function settle(page: Page): Promise<void> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  await page.evaluate(() => document.fonts.ready.then(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))));
}

/** What the init script recorded so far. */
// Stryker disable next-line all: process boundary, covered by the visual plants fail-closed-shadow-root and fail-local-storage
async function recorded(page: Page): Promise<Recorded> {
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-closed-shadow-root and fail-local-storage
  return page.evaluate(() => {
    // Stryker disable next-line all: process boundary, covered by the visual plants fail-closed-shadow-root and fail-local-storage
    const state = (window as unknown as { __ocelleCapture: Recorded }).__ocelleCapture;
    // Stryker disable next-line all: process boundary, covered by the visual plants fail-closed-shadow-root and fail-local-storage
    return { signal: state.signal, shadows: [...state.shadows], calls: [...state.calls] };
  });
}

/** The hosts of the closed shadow roots the story attached. */
// Stryker disable next-line all: process boundary, covered by the visual plant fail-closed-shadow-root
export async function closedShadows(page: Page): Promise<string[]> {
  // Stryker disable next-line all: process boundary, covered by the visual plant fail-closed-shadow-root
  return closedShadowHosts((await recorded(page)).shadows);
}

/** The faces of the font rule: every text node of the story area with its platform fonts and computed family (research.md R-05). */
// Stryker disable next-line all: process boundary, covered by the visual plants fail-other-font, fail-input-system-font, fail-font-not-loaded and pass-input-font
export async function fontCheck(page: Page, cdp: CDPSession): Promise<string[]> {
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-other-font and fail-input-system-font
  await cdp.send("DOM.enable");
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-other-font and fail-input-system-font
  await cdp.send("CSS.enable");
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-other-font and fail-input-system-font
  const { root } = (await cdp.send("DOM.getDocument", { depth: -1, pierce: true })) as unknown as { root: CdpNode };
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-other-font and fail-input-system-font
  const computed = new Map<number, string>();
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-other-font and fail-input-system-font
  const texts: TextNode[] = [];
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-other-font and fail-input-system-font
  for (const text of storyTextNodes(root)) {
    // Stryker disable next-line all: process boundary, covered by the visual plants fail-other-font and fail-input-system-font
    const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId: text.nodeId });
    // Stryker disable next-line all: process boundary, covered by the visual plants fail-font-not-loaded and pass-unused-face
    if (!computed.has(text.styleNodeId)) {
      // Stryker disable next-line all: process boundary, covered by the visual plants fail-font-not-loaded and pass-unused-face
      const { computedStyle } = await cdp.send("CSS.getComputedStyleForNode", { nodeId: text.styleNodeId });
      // Stryker disable next-line all: process boundary, covered by the visual plants fail-font-not-loaded and pass-unused-face
      computed.set(text.styleNodeId, computedStyle.find((property) => property.name === "font-family")?.value ?? "");
    }
    // Stryker disable next-line all: process boundary, covered by the visual plants fail-other-font and fail-input-system-font
    texts.push({ families: fonts.map((font) => font.familyName), userAgentShadow: text.userAgentShadow, computedFamily: computed.get(text.styleNodeId) ?? "" });
  }
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-font-not-loaded and pass-unused-face
  const faces = await page.evaluate(() => [...document.fonts].map((face) => ({ family: face.family, status: face.status })));
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-other-font, fail-input-system-font, fail-font-not-loaded and pass-unused-face
  return fontProblems(texts, faces);
}

/** The run-time I/O of the story: its recorded calls and the storage it left (research.md R-14). */
// Stryker disable next-line all: process boundary, covered by the visual plants fail-local-storage, fail-storage-property, fail-cookie, fail-indexeddb and fail-storage-left-by-worker
export async function storageIo(page: Page, context: BrowserContext): Promise<string[]> {
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-local-storage, fail-storage-property, fail-cookie and fail-indexeddb
  const calls = ioCalls((await recorded(page)).calls);
  // Stryker disable next-line all: process boundary, covered by the visual plant fail-storage-left-by-worker
  const state = await context.storageState({ indexedDB: true });
  // Stryker disable next-line all: process boundary, covered by the visual plant fail-storage-left-by-worker
  const sessionStorage = await page.evaluate(() => (window as unknown as { __ocelleCapture: { sessionKeys: () => string[] } }).__ocelleCapture.sessionKeys());
  // Stryker disable next-line all: process boundary, covered by the visual plant fail-storage-left-by-worker
  const origins = state.origins;
  // Stryker disable next-line all: process boundary, covered by the visual plant fail-storage-left-by-worker
  const left = leftStorage({
    // Stryker disable next-line all: process boundary, covered by the visual plant fail-storage-left-by-worker
    cookies: state.cookies.map((cookie) => cookie.name),
    // Stryker disable next-line all: process boundary, covered by the visual plant fail-storage-left-by-worker
    localStorage: origins.flatMap((origin) => origin.localStorage.map((item) => item.name)),
    // Stryker disable next-line all: process boundary, covered by the visual plant fail-storage-left-by-worker
    sessionStorage,
    // Stryker disable next-line all: process boundary, covered by the visual plant fail-storage-left-by-worker
    indexedDB: origins.flatMap((origin) => ((origin as { readonly indexedDB?: readonly { readonly name: string }[] }).indexedDB ?? []).map((database) => database.name)),
  });
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-local-storage and fail-storage-left-by-worker
  return [...calls, ...left];
}

/** Every condition of a story-theme after readiness, in the order of contracts/container.md § Per story-theme. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
export async function conditionsAfterRender(page: Page, context: BrowserContext, theme: Theme, requests: Requests): Promise<Conditions> {
  // Stryker disable next-line all: process boundary, covered by the visual plant pass-focus-below-fold
  await scrollBack(page);
  // Stryker disable next-line all: process boundary, covered by the visual plants pass-hover-and-press and fail-pointer-target-missing
  const pointerTarget = await applyPointer(page, theme);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  await settle(page);
  // Stryker disable next-line all: process boundary, covered by the visual plant fail-closed-shadow-root
  const closedShadowRoot = await closedShadows(page);
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-other-font and fail-input-system-font
  const cdp = await context.newCDPSession(page);
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-other-font and fail-input-system-font
  const font = await fontCheck(page, cdp);
  // Stryker disable next-line all: process boundary, covered by the visual plants fail-local-storage and fail-storage-left-by-worker
  const storage = await storageIo(page, context);
  // Stryker disable next-line all: process boundary, covered by the visual plants pass-hover-and-press, fail-network and fail-local-storage
  return { closedShadowRoot, ...(pointerTarget === undefined ? {} : { pointerTarget }), font, network: requests.network, io: [...requests.io, ...storage] };
}
