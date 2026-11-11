import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  captureStatus,
  classifyRequest,
  contextOptions,
  ioCalls,
  leftStorage,
  parsePointer,
  pointerProblem,
  readiness,
  readinessTimeout,
  refusal,
  screenshotOptions,
  scrollAction,
  storybookCalls,
  storybookRequests,
  storyPath,
  targetInViewport,
} from "../lib/capture-plan.ts";
import type { Conditions, Facts, RecordedCall, Signal } from "../lib/capture-plan.ts";
import type { Pin } from "../lib/container.ts";

// The capture's decisions (FR-006, FR-009, FR-012, FR-026 to FR-028, FR-030, FR-031; contracts/container.md; research.md
// R-04 to R-06, R-08, R-14, R-15), on injected facts, the phase 1 spike's recorded render signals and Storybook
// requests (gates/test/fixtures/storybook-signals/signals.json), and written cases. Expected values come from the
// contracts and research.md.
const digest = "sha256:ee15712262f017b8157421b212b12099146645f44b1bc5c0514cbbe6a229b1d0";
const pin: Pin = { image: "mcr.microsoft.com/playwright", digest, platform: "linux/amd64", tag: "v1.64.1-noble", node: "26.13.0", browser: "chromium_headless_shell-1248" };
const browserDir = "/ms-playwright/chromium_headless_shell-1248";
const facts: Facts = {
  platform: "linux",
  arch: "x64",
  version: "v26.13.0",
  env: { OCELLE_VISUAL_PIN: digest },
  exists: (path) => path === browserDir,
  executable: `${browserDir}/chrome-linux/headless_shell`,
};

interface Recorded {
  readonly signals: readonly { readonly signal: string; readonly arg?: string }[];
  readonly requests: readonly { readonly type: string; readonly url: string }[];
}
const signals = JSON.parse(readFileSync(new URL("fixtures/storybook-signals/signals.json", import.meta.url), "utf8")) as Record<string, Recorded>;

describe("refusal (the capture's checks before any page, one test per check)", () => {
  it("lets the pinned container run", () => {
    expect(refusal(facts, pin)).toBeUndefined();
  });

  it("platform: refuses any platform but linux", () => {
    expect(refusal({ ...facts, platform: "darwin" }, pin)).toBe("not the pinned container: platform: platform darwin, expected linux");
  });

  it("arch: refuses any architecture but x64", () => {
    expect(refusal({ ...facts, arch: "arm64" }, pin)).toBe("not the pinned container: arch: arch arm64, expected x64");
  });

  it("node: refuses any Node but the pin's", () => {
    expect(refusal({ ...facts, version: "v22.23.4" }, pin)).toBe("not the pinned container: node: node v22.23.4, expected v26.13.0");
    expect(refusal({ ...facts, version: "v26.13.01" }, pin)).toBe("not the pinned container: node: node v26.13.01, expected v26.13.0");
  });

  it("pin: refuses an absent or another pin variable", () => {
    expect(refusal({ ...facts, env: {} }, pin)).toBe("not the pinned container: pin: pin variable absent");
    expect(refusal({ ...facts, env: { OCELLE_VISUAL_PIN: "" } }, pin)).toBe("not the pinned container: pin: pin variable absent");
    expect(refusal({ ...facts, env: { OCELLE_VISUAL_PIN: `${digest}x` } }, pin)).toBe("not the pinned container: pin: pin variable differs");
  });

  it("browser: refuses when the pinned browser's directory is absent, or the executable Playwright resolves lies elsewhere", () => {
    const expected = (path: string): string => `not the pinned container: browser: browser ${path}, expected ${browserDir}`;
    expect(refusal({ ...facts, exists: () => false }, pin)).toBe(expected(facts.executable));
    const host = "/root/.cache/ms-playwright/chromium_headless_shell-1248/chrome-linux/headless_shell";
    expect(refusal({ ...facts, executable: host }, pin)).toBe(expected(host));
    expect(refusal({ ...facts, executable: `${browserDir}0/headless_shell` }, pin)).toBe(expected(`${browserDir}0/headless_shell`));
  });

  it("names the first failing check in the order platform, arch, node, pin, browser", () => {
    const all: Facts = { platform: "win32", arch: "arm64", version: "v22.1.0", env: {}, exists: () => false, executable: "/x" };
    expect(refusal(all, pin)).toMatch(/^not the pinned container: platform: /);
    expect(refusal({ ...all, platform: "linux" }, pin)).toMatch(/^not the pinned container: arch: /);
    expect(refusal({ ...all, platform: "linux", arch: "x64" }, pin)).toMatch(/^not the pinned container: node: /);
    expect(refusal({ ...all, platform: "linux", arch: "x64", version: "v26.13.0" }, pin)).toMatch(/^not the pinned container: pin: /);
  });
});

describe("contextOptions and screenshotOptions (research.md R-04, R-08)", () => {
  it("opens each theme at 1280 × 800, scale 1, its colour scheme, reduced motion, no forced colours, en-GB, UTC", () => {
    const base = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, reducedMotion: "reduce", forcedColors: "none", locale: "en-GB", timezoneId: "UTC" };
    expect(contextOptions("light")).toEqual({ ...base, colorScheme: "light" });
    expect(contextOptions("dark")).toEqual({ ...base, colorScheme: "dark" });
  });

  it("takes the full page with no clip, animations disabled and the caret hidden", () => {
    expect(screenshotOptions()).toEqual({ fullPage: true, animations: "disabled", caret: "hide" });
  });

  it("opens a story in a theme through the preview's theme global", () => {
    expect(storyPath("tokens--colour", "dark")).toBe("/iframe.html?id=tokens--colour&viewMode=story&globals=theme:dark");
  });
});

describe("readiness (research.md R-04)", () => {
  const kinds: Record<string, Signal["kind"]> = {
    storyRendered: "storyRendered",
    storyThrewException: "storyThrewException",
    storyErrored: "storyErrored",
    storyMissing: "storyMissing",
    "sb-show-errordisplay": "errorDisplay",
  };
  /** The first recorded signal of a spike case as the readiness recorder hands it on. */
  const first = (key: string): Signal => {
    const [signal] = signals[key]?.signals ?? [];
    const kind = kinds[signal?.signal ?? ""] ?? "errorDisplay";
    return signal?.arg === undefined ? { kind } : { kind, detail: signal.arg };
  };

  it("goes on after STORY_RENDERED, and fails the spike's three failure cases on their first signal", () => {
    expect(readiness(first("spike--fine/light"))).toEqual({ ready: true });
    expect(readiness(first("spike-module--module-throws/light"))).toEqual({ ready: false, status: "render-failed", message: "STORY_MISSING: spike-module--module-throws" });
    expect(readiness(first("spike--render-throws/light"))).toEqual({ ready: false, status: "render-failed", message: "STORY_THREW_EXCEPTION: render throws on purpose" });
    expect(readiness(first("no-such--story/light"))).toEqual({ ready: false, status: "render-failed", message: "STORY_MISSING: no-such--story" });
  });

  it("fails STORY_ERRORED and the error display, and times out with no signal within 15 s", () => {
    expect(readiness({ kind: "storyErrored", detail: "boom" })).toEqual({ ready: false, status: "render-failed", message: "STORY_ERRORED: boom" });
    expect(readiness({ kind: "storyErrored" })).toEqual({ ready: false, status: "render-failed", message: "STORY_ERRORED" });
    expect(readiness({ kind: "errorDisplay" })).toEqual({ ready: false, status: "render-failed", message: "the error display is shown (sb-show-errordisplay)" });
    expect(readiness(undefined)).toEqual({ ready: false, status: "render-timeout", message: "no render signal within 15 s" });
    expect(readinessTimeout).toBe(15_000);
  });
});

describe("classifyRequest (research.md R-14)", () => {
  const origin = "http://127.0.0.1:4321";
  const request = (resourceType: string, path: string): { url: string; resourceType: string } => ({ url: `${origin}${path}`, resourceType });

  it("lets every request Storybook made in the spike through with no record, its one fetch /index.json included", () => {
    const requests = Object.values(signals).flatMap((recorded) => recorded.requests);
    expect(requests.length).toBeGreaterThan(40);
    expect(requests.map((r) => classifyRequest(request(r.type, r.url), origin, true)).filter((decision) => decision.action !== "continue" || decision.record !== undefined)).toEqual([]);
    expect(storybookRequests).toEqual(["/index.json"]);
    expect(classifyRequest(request("fetch", "/index.json?refresh=1"), origin, true)).toEqual({ action: "continue" });
  });

  it("records same-origin fetch, xhr, websocket, eventsource and ping other than Storybook's own as io, by path", () => {
    expect(classifyRequest(request("fetch", "/api/items"), origin, false)).toEqual({ action: "continue", record: { kind: "io", text: "fetch /api/items" } });
    expect(classifyRequest(request("fetch", "/project.json"), origin, true)).toEqual({ action: "continue", record: { kind: "io", text: "fetch /project.json" } });
    expect(classifyRequest(request("xhr", "/api/items?q=1"), origin, false)).toEqual({ action: "continue", record: { kind: "io", text: "xhr /api/items" } });
    expect(classifyRequest({ url: "ws://127.0.0.1:4321/socket", resourceType: "websocket" }, origin, false)).toEqual({ action: "continue", record: { kind: "io", text: "websocket /socket" } });
    expect(classifyRequest(request("eventsource", "/events"), origin, false)).toEqual({ action: "continue", record: { kind: "io", text: "eventsource /events" } });
    expect(classifyRequest(request("ping", "/api/beacon"), origin, false)).toEqual({ action: "continue", record: { kind: "io", text: "ping /api/beacon" } });
  });

  it("records any other same-origin request for a path not in dist as io", () => {
    expect(classifyRequest(request("font", "/fonts/missing.woff2"), origin, false)).toEqual({ action: "continue", record: { kind: "io", text: "font /fonts/missing.woff2" } });
    expect(classifyRequest(request("image", "/a.png"), origin, true)).toEqual({ action: "continue" });
  });

  it("aborts and records every request outside the origin as network: another host, port or name of the loopback", () => {
    for (const url of ["https://example.com/a.png", "http://127.0.0.1:9999/a.png", "http://localhost:4321/a.png", "ws://example.com/socket"]) {
      expect(classifyRequest({ url, resourceType: "image" }, origin, false)).toEqual({ action: "abort", record: { kind: "network", text: url } });
    }
  });

  it("lets a data URL through: it is no request", () => {
    expect(classifyRequest({ url: "data:image/png;base64,AAAA", resourceType: "image" }, origin, false)).toEqual({ action: "continue" });
  });
});

describe("ioCalls (research.md R-14: every kind, disallowed and allowed)", () => {
  const cases: readonly (readonly [RecordedCall, string])[] = [
    [{ kind: "storage-method", storage: "localStorage", method: "setItem" }, "localStorage.setItem"],
    [{ kind: "storage-method", storage: "sessionStorage", method: "getItem" }, "sessionStorage.getItem"],
    [{ kind: "storage-property", storage: "localStorage", op: "get", key: "k" }, "localStorage get k"],
    [{ kind: "storage-property", storage: "localStorage", op: "set", key: "k" }, "localStorage set k"],
    [{ kind: "storage-property", storage: "sessionStorage", op: "delete", key: "k" }, "sessionStorage delete k"],
    [{ kind: "storage-property", storage: "localStorage", op: "has", key: "k" }, "localStorage has k"],
    [{ kind: "cookie", op: "get" }, "cookie get"],
    [{ kind: "cookie", op: "set" }, "cookie set"],
    [{ kind: "indexedDB", op: "open", name: "d" }, "indexedDB.open d"],
    [{ kind: "indexedDB", op: "deleteDatabase", name: "d" }, "indexedDB.deleteDatabase d"],
    [{ kind: "caches", op: "open", name: "ocelle-plant" }, "caches.open ocelle-plant"],
    [{ kind: "caches", op: "keys" }, "caches.keys"],
    [{ kind: "clipboard", op: "writeText" }, "clipboard.writeText"],
    [{ kind: "clipboard", op: "write" }, "clipboard.write"],
    [{ kind: "execCommand", command: "copy" }, "execCommand copy"],
    [{ kind: "execCommand", command: "Cut" }, "execCommand cut"],
    [{ kind: "beacon", url: "/api/beacon" }, "sendBeacon /api/beacon"],
  ];

  it("names each recorded call, in order, with Storybook's allow-list (empty, spike § 3)", () => {
    expect(storybookCalls).toEqual([]);
    expect(ioCalls(cases.map(([call]) => call))).toEqual(cases.map(([, text]) => text));
  });

  it.each(cases)("drops %j only when its exact text is allowed", (call, text) => {
    expect(ioCalls([call], [text])).toEqual([]);
    expect(ioCalls([call], [`${text}x`, "localStorage"])).toEqual([text]);
  });

  it("is not I/O for execCommand of anything but copy and cut", () => {
    expect(ioCalls([{ kind: "execCommand", command: "bold" }, { kind: "execCommand", command: "insertText" }])).toEqual([]);
  });
});

describe("leftStorage (research.md R-14: the backstop for writes)", () => {
  it("names each cookie, storage key and IndexedDB database left when the render ends", () => {
    expect(leftStorage({ cookies: ["c"], localStorage: ["k"], sessionStorage: ["s"], indexedDB: ["ocelle-left"] })).toEqual([
      "cookie c left when the render ends",
      "localStorage k left when the render ends",
      "sessionStorage s left when the render ends",
      "indexedDB ocelle-left left when the render ends",
    ]);
  });

  it("names nothing for an empty state or allowed entries (kind and name)", () => {
    expect(leftStorage({ cookies: [], localStorage: [], sessionStorage: [], indexedDB: [] })).toEqual([]);
    expect(leftStorage({ cookies: ["c"], localStorage: ["k"], sessionStorage: [], indexedDB: ["d"] }, ["cookie c", "localStorage k", "indexedDB d"])).toEqual([]);
    expect(leftStorage({ cookies: [], localStorage: ["k"], sessionStorage: ["k"], indexedDB: [] }, ["localStorage k"])).toEqual(["sessionStorage k left when the render ends"]);
  });
});

describe("parsePointer (research.md R-15, data-model.md § Pointer state)", () => {
  const malformed = { problem: "the pointer parameter is malformed: expected { hover: <selector> } or { press: <selector> }" };

  it("reads no state, a hover and a press from parameters.ocelle.pointer", () => {
    expect(parsePointer(undefined)).toBeUndefined();
    expect(parsePointer({})).toBeUndefined();
    expect(parsePointer({ ocelle: {} })).toBeUndefined();
    expect(parsePointer({ ocelle: { pointer: { hover: ".target" } } })).toEqual({ kind: "hover", selector: ".target" });
    expect(parsePointer({ layout: "x", ocelle: { pointer: { press: "button" } } })).toEqual({ kind: "press", selector: "button" });
  });

  it("names a malformed state: not one key, both states, another key, a selector that is no text", () => {
    for (const pointer of [null, "x", [], {}, { click: ".a" }, { hover: ".a", extra: 1 }]) expect(parsePointer({ ocelle: { pointer } })).toEqual(malformed);
    expect(parsePointer({ ocelle: { pointer: { hover: ".a", press: ".b" } } })).toEqual({ problem: "the pointer parameter names both hover and press" });
    expect(parsePointer({ ocelle: { pointer: { hover: 1 } } })).toEqual({ problem: "the pointer parameter's hover is not a selector" });
    expect(parsePointer({ ocelle: { pointer: { press: "" } } })).toEqual({ problem: "the pointer parameter's press is not a selector" });
  });
});

describe("targetInViewport and pointerProblem (research.md R-15)", () => {
  /** The viewport of the context both gates open, read when a test runs. */
  const view = (): { readonly width: number; readonly height: number } => contextOptions("light").viewport;

  it("is inside for a box wholly in the viewport of contextOptions, edges included", () => {
    expect(targetInViewport({ x: 10, y: 10, width: 100, height: 20 }, view())).toBe(true);
    expect(targetInViewport({ x: 0, y: 0, width: 1280, height: 800 }, view())).toBe(true);
    expect(targetInViewport({ x: 10, y: 740, width: 100, height: 40 }, view())).toBe(true);
  });

  it("is outside for a box partly outside on the right, below the fold, above or left of it, and for no box", () => {
    expect(targetInViewport({ x: 1200, y: 10, width: 100, height: 20 }, view())).toBe(false);
    expect(targetInViewport({ x: 10, y: 1500, width: 100, height: 20 }, view())).toBe(false);
    expect(targetInViewport({ x: 10, y: 790, width: 100, height: 20 }, view())).toBe(false);
    expect(targetInViewport({ x: -1, y: 10, width: 10, height: 10 }, view())).toBe(false);
    expect(targetInViewport({ x: 10, y: -1, width: 10, height: 10 }, view())).toBe(false);
    expect(targetInViewport(null, view())).toBe(false);
    expect(targetInViewport({ x: 10, y: 740, width: 100, height: 40 }, { width: 1280, height: 720 })).toBe(false);
  });

  it("names a target matching no element, several, or lying outside the viewport", () => {
    const hover = { kind: "hover", selector: ".trigger" } as const;
    expect(pointerProblem(hover, 0, null, view())).toBe("hover: no element matches .trigger");
    expect(pointerProblem({ kind: "press", selector: "li" }, 3, null, view())).toBe("press: 3 elements match li");
    expect(pointerProblem(hover, 1, { x: 10, y: 1500, width: 100, height: 20 }, view())).toBe("hover: target outside the viewport: .trigger");
    expect(pointerProblem(hover, 1, null, view())).toBe("hover: target outside the viewport: .trigger");
    expect(pointerProblem(hover, 1, { x: 10, y: 10, width: 100, height: 20 }, view())).toBeUndefined();
  });
});

describe("scrollAction (research.md R-04)", () => {
  it("does nothing at (0, 0) and resets any other position", () => {
    expect([scrollAction(0, 0), scrollAction(0, 1125), scrollAction(40, 0)]).toEqual(["none", "reset", "reset"]);
  });
});

describe("captureStatus (data-model.md § Verdict per story-theme, steps 1 to 7)", () => {
  const all = {
    renderFailed: "STORY_MISSING: x--y",
    renderTimeout: "no render signal within 15 s",
    closedShadowRoot: ["ocelle-x"],
    pointerTarget: "hover: no element matches .t",
    font: ["DejaVu Sans"],
    network: ["https://example.com/a.png"],
    io: ["font /fonts/missing.woff2"],
  };

  it("is captured with no condition, empty lists counting as none", () => {
    expect(captureStatus({})).toEqual({ status: "captured" });
    expect(captureStatus({ font: [], network: [], io: [], closedShadowRoot: [] })).toEqual({ status: "captured" });
  });

  it("chooses the first condition in the order, with that condition's details only", () => {
    expect(captureStatus(all)).toEqual({ status: "render-failed", message: "STORY_MISSING: x--y" });
    /** The conditions without the named ones. */
    const without = (...names: string[]): Conditions => Object.fromEntries(Object.entries(all).filter(([name]) => !names.includes(name)));
    expect(captureStatus(without("renderFailed"))).toEqual({ status: "render-timeout", message: "no render signal within 15 s" });
    expect(captureStatus(without("renderFailed", "renderTimeout"))).toEqual({ status: "closed-shadow-root", hosts: ["ocelle-x"] });
    expect(captureStatus(without("renderFailed", "renderTimeout", "closedShadowRoot"))).toEqual({ status: "pointer-target", message: "hover: no element matches .t" });
  });

  it("font over io and over network, network over io, each alone", () => {
    expect(captureStatus({ font: ["DejaVu Sans"], io: ["font /fonts/missing.woff2"] })).toEqual({ status: "font", families: ["DejaVu Sans"] });
    expect(captureStatus({ network: ["https://example.com/f.woff2"], font: ["DejaVu Sans"] })).toEqual({ status: "font", families: ["DejaVu Sans"] });
    expect(captureStatus({ network: ["https://example.com/a.png"], io: ["fetch /api/items"] })).toEqual({ status: "network", urls: ["https://example.com/a.png"] });
    expect(captureStatus({ io: ["cookie set"] })).toEqual({ status: "io", calls: ["cookie set"] });
  });
});
