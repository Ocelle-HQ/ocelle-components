// The live-region capture shared by both harnesses (specs/010-feedback-forms research.md R-01; contracts/testing.md
// § Live-region capture). A recorder in the page, a `MutationObserver` on the watched container and on every shadow
// root in it (and, through a patched `Element.prototype.attachShadow`, every shadow root attached later), pauses the
// page with `debugger` at each mutation batch; a frame hook (a `requestAnimationFrame` callback posting a
// `MessageChannel` message, whose handler runs after the rendering update) pauses it once per rendering update. On
// each pause the test side, holding a CDP session with `Debugger` and `Accessibility` enabled, reads
// `Accessibility.getFullAXTree`, takes every live region node at or inside the container with its text
// (`regionText`, live-reading.ts) and the role of every `ocelle-*` host with an id, appends a snapshot and resumes.
// `stop()` waits for the quiet window derived from the capture's delays and two further rendering updates, takes a
// final snapshot and returns the list. The in-process harness reaches it through the browser commands `liveStart` and
// `liveStop` (registered in the repository root's vitest.config.ts beside `axTree`); the fixture pages through
// `fixtureCapture` over the page's own CDP session, which also makes the page's evaluations run outside the capture's
// pauses (`runInTasks`).
import type { CDPSession, Frame, Page } from "playwright";
import type { BrowserCommandContext } from "vitest/node";
import { chromiumDelays, regionText } from "./live-reading.ts";
import type { AxRecord, Delays, HostRole, Politeness, Region, Snapshot } from "./live-reading.ts";

export type { Delays, Snapshot } from "./live-reading.ts";

/** Options of `stop`: wait at least `atLeast` milliseconds of page time since the capture started first. */
export interface StopOptions {
  readonly atLeast?: number;
}

/** The capture as a step of the driver. */
export interface LiveCapture {
  /** Arms the recorder on the element with `containerId` and returns when armed. */
  start(containerId: string): Promise<void>;
  /** Waits for the quiet window (after `atLeast`), takes the final snapshot, disarms and returns the snapshots. */
  stop(options?: StopOptions): Promise<Snapshot[]>;
}

/** The capture on fixture pages, with the document mode. */
export interface DocumentCapture extends LiveCapture {
  /** Installs the recorder before navigation and navigates to `url`, so the recorder sees the document's first node. */
  startDocument(url: string): Promise<void>;
}

/** The bounds of one capture (research R-01; re-measured in T002). */
export const bounds = { pauses: 2000, milliseconds: 5000 } as const;

/** The quiet window of `delays`: the largest `W` (2 × D) + the minimum hold (the largest `W`) + the largest `D`. */
export function quietWindow(delays: Delays): number {
  const largest = Math.max(delays.loaded, delays.loading);
  return 2 * largest + 2 * largest + largest;
}

// The page side. A string, so neither a transpiler nor a lint rule touches it (it holds `debugger`).
const recorder = String.raw`(() => {
  if (globalThis.__ocelleLive !== undefined) return;
  const state = { armed: false, frame: 0, pending: null, raf: 0, token: "" };
  const options = { childList: true, attributes: true, characterData: true, subtree: true };
  const info = (kind) => ({ token: state.token, kind, at: performance.now(), frame: state.frame, loaded: document.readyState === "complete" });
  const pause = (kind) => {
    if (!state.armed) return;
    state.pending = info(kind);
    debugger;
    state.pending = null;
  };
  const observer = new MutationObserver(() => pause("mutation"));
  const observe = (root) => {
    observer.observe(root, options);
    for (const each of root.querySelectorAll("*")) if (each.shadowRoot !== null) observe(each.shadowRoot);
  };
  const attachShadow = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (init) {
    const root = attachShadow.call(this, init);
    if (state.armed) observer.observe(root, options);
    return root;
  };
  const channel = new MessageChannel();
  const tick = () => channel.port2.postMessage(0);
  channel.port1.onmessage = () => {
    if (!state.armed) return;
    state.frame += 1;
    pause("lifecycle");
    if (state.armed) state.raf = requestAnimationFrame(tick);
  };
  globalThis.__ocelleLive = {
    arm(token, id) {
      const target = id === null ? document : document.getElementById(id);
      if (target === null) throw new Error("liveCapture: no #" + id + " on the page");
      state.token = token;
      state.frame = 0;
      state.armed = true;
      observe(target);
      state.raf = requestAnimationFrame(tick);
    },
    disarm() {
      state.armed = false;
      observer.disconnect();
      cancelAnimationFrame(state.raf);
    },
    info(kind) {
      return JSON.stringify(info(kind));
    },
    take() {
      return state.pending === null ? null : JSON.stringify(state.pending);
    },
  };
})();`;

/** What the recorder reports with each pause. */
interface PauseInfo {
  readonly token: string;
  readonly kind: "mutation" | "lifecycle" | "start" | "final";
  readonly at: number;
  readonly frame: number;
  readonly loaded: boolean;
}

interface DomNode {
  readonly backendNodeId: number;
  readonly nodeType: number;
  readonly localName?: string;
  readonly frameId?: string;
  readonly attributes?: readonly string[];
  readonly children?: readonly DomNode[];
  readonly shadowRoots?: readonly DomNode[];
  readonly contentDocument?: DomNode;
}

interface FrameTree {
  readonly frame: { readonly id: string; readonly url: string };
  readonly childFrames?: readonly FrameTree[];
}

function inner(node: DomNode): readonly DomNode[] {
  return [...(node.children ?? []), ...(node.shadowRoots ?? [])];
}

function idOf(node: DomNode): string | undefined {
  const attributes = node.attributes ?? [];
  for (let i = 0; i < attributes.length; i += 2) if (attributes[i] === "id") return attributes[i + 1];
  return undefined;
}

function byId(node: DomNode, id: string): DomNode | undefined {
  if (idOf(node) === id) return node;
  for (const child of inner(node)) {
    const found = byId(child, id);
    if (found !== undefined) return found;
  }
  return undefined;
}

function documentOf(node: DomNode, frameId: string | undefined): DomNode | undefined {
  if (frameId === undefined || node.frameId === frameId) return node.contentDocument ?? node;
  for (const child of [...inner(node), ...(node.contentDocument === undefined ? [] : [node.contentDocument])]) {
    const found = documentOf(child, frameId);
    if (found !== undefined) return found;
  }
  return undefined;
}

/** The watched subtree: each node's nearest `ocelle-*` host with an id (at or above it), and the hosts in order. */
interface Watched {
  readonly hostOf: Map<number, string | null>;
  readonly hosts: { readonly id: string; readonly node: number }[];
}

function watch(container: DomNode): Watched {
  const hostOf = new Map<number, string | null>();
  const hosts: { id: string; node: number }[] = [];
  const walk = (node: DomNode, host: string | null): void => {
    const id = idOf(node);
    const own = node.nodeType === 1 && node.localName?.startsWith("ocelle-") === true && id !== undefined ? id : null;
    if (own !== null) hosts.push({ id: own, node: node.backendNodeId });
    const current = own ?? host;
    hostOf.set(node.backendNodeId, current);
    for (const child of inner(node)) walk(child, current);
  };
  walk(container, null);
  return { hostOf, hosts };
}

function politenessOf(node: AxRecord): Politeness | null {
  const live = node.properties?.find((property) => property.name === "live")?.value.value;
  return live === "polite" || live === "assertive" ? live : null;
}

async function frameIdOf(session: CDPSession, url: string): Promise<string | undefined> {
  const { frameTree } = (await session.send("Page.getFrameTree")) as { frameTree: FrameTree };
  const frames: FrameTree["frame"][] = [];
  const walk = (tree: FrameTree): void => {
    frames.push(tree.frame);
    for (const child of tree.childFrames ?? []) walk(child);
  };
  walk(frameTree);
  return frames.find((frame) => frame.url === url)?.id;
}

/** Where a capture runs: its CDP session, the Playwright frame and the CDP frame id (undefined: the main frame). */
interface Target {
  readonly session: CDPSession;
  readonly frame: Frame;
  readonly frameId: string | undefined;
}

let tokens = 0;

/** One capture over a CDP session (both harnesses). */
export class Capture {
  readonly #target: Target;
  readonly #delays: Delays;
  readonly #token = `capture-${String((tokens += 1))}`;
  #container: string | null = null;
  #snapshots: Snapshot[] = [];
  #lastMutation = 0;
  #pauses = 0;
  #exceeded: string | undefined;
  #failure: string | undefined;
  #startAt = 0;
  #check: (() => void) | undefined;
  #reading: Promise<void> = Promise.resolve();
  readonly #onPause = (event: { callFrames: readonly { callFrameId: string }[] }): void => {
    this.#reading = this.#reading.then(() => this.#paused(event)).catch(() => undefined);
  };

  constructor(target: Target, delays: Delays = chromiumDelays) {
    this.#target = target;
    this.#delays = delays;
  }

  /** The snapshots so far. */
  get snapshots(): readonly Snapshot[] {
    return this.#snapshots;
  }

  async #enable(): Promise<void> {
    const { session } = this.#target;
    session.on("Debugger.paused", this.#onPause);
    await session.send("Debugger.enable");
    await session.send("Accessibility.enable");
    await session.send("DOM.enable");
  }

  /** Arms on the element with `containerId` in the target frame. */
  async start(containerId: string): Promise<void> {
    await this.#enable();
    await this.#target.frame.evaluate(recorder);
    this.#container = containerId;
    await this.#target.frame.evaluate(([token, id]) => {
      (globalThis as unknown as { __ocelleLive: { arm: (token: string, id: string) => void } }).__ocelleLive.arm(token, id);
    }, [this.#token, containerId] as const);
    await this.#snapshot("start");
  }

  /** Installs the recorder for the next document, armed on the document, and navigates the page to `url`. */
  async startDocument(page: Page, url: string): Promise<void> {
    await this.#enable();
    this.#container = null;
    const source = `${recorder}\nglobalThis.__ocelleLive.arm(${JSON.stringify(this.#token)}, null);`;
    await this.#target.session.send("Page.enable");
    await this.#target.session.send("Page.addScriptToEvaluateOnNewDocument", { source });
    await page.goto(url, { waitUntil: "load" });
  }

  /** Reads a snapshot of kind `kind` now; the page is paused or about to be read as it is. */
  async #read(info: PauseInfo): Promise<Snapshot> {
    const { session, frameId } = this.#target;
    const { root } = (await session.send("DOM.getDocument", { depth: -1, pierce: true })) as { root: DomNode };
    const document = documentOf(root, frameId);
    const container = document === undefined ? undefined : this.#container === null ? document : byId(document, this.#container);
    const watched = container === undefined ? { hostOf: new Map<number, string | null>(), hosts: [] } : watch(container);
    const params = frameId === undefined ? {} : { frameId };
    const { nodes } = (await session.send("Accessibility.getFullAXTree", params)) as unknown as { nodes: readonly AxRecord[] };
    const regions: Region[] = [];
    for (const node of nodes) {
      const politeness = politenessOf(node);
      const backend = node.backendDOMNodeId;
      if (node.ignored || politeness === null || backend === undefined || !watched.hostOf.has(backend)) continue;
      regions.push({ node: String(backend), host: watched.hostOf.get(backend) ?? null, politeness, text: regionText(nodes, node.nodeId) });
    }
    const hosts: HostRole[] = watched.hosts.map(({ id, node: backend }) => {
      const node = nodes.find((each) => each.backendDOMNodeId === backend);
      const role = node === undefined || node.ignored ? "none" : (typeof node.role?.value === "string" ? node.role.value : "none");
      return { host: id, role };
    });
    return { at: info.at, frame: info.frame, lifecycle: info.kind === "lifecycle", loaded: info.loaded, regions, hosts };
  }

  async #snapshot(kind: "start" | "final"): Promise<void> {
    const raw = await this.#target.frame.evaluate(
      (kind) => (globalThis as unknown as { __ocelleLive: { info: (kind: string) => string } }).__ocelleLive.info(kind),
      kind,
    );
    const info = JSON.parse(raw) as PauseInfo;
    const snapshot = await this.#read(info);
    this.#snapshots.push(snapshot);
    if (kind === "start") {
      this.#startAt = snapshot.at;
      this.#lastMutation = snapshot.at;
    }
  }

  async #paused(event: { callFrames: readonly { callFrameId: string }[] }): Promise<void> {
    const { session } = this.#target;
    const top = event.callFrames[0];
    // Another capture's pause (another test file's frame on the same page) is left to that capture to resume.
    let ours = true;
    try {
      if (top === undefined) return;
      const { result } = (await session.send("Debugger.evaluateOnCallFrame", {
        callFrameId: top.callFrameId,
        expression: "globalThis.__ocelleLive === undefined ? null : globalThis.__ocelleLive.take()",
        returnByValue: true,
      })) as { result: { value?: unknown } };
      if (typeof result.value !== "string") return;
      const info = JSON.parse(result.value) as PauseInfo;
      if (info.token !== this.#token) {
        ours = false;
        return;
      }
      if (this.#exceeded !== undefined) return;
      this.#pauses += 1;
      if (info.kind === "mutation") this.#lastMutation = info.at;
      if (this.#pauses > bounds.pauses) {
        this.#exceeded = `capture exceeded ${String(bounds.pauses)} pauses`;
        await session.send("Debugger.evaluateOnCallFrame", { callFrameId: top.callFrameId, expression: "globalThis.__ocelleLive.disarm()" }).catch(() => undefined);
        return;
      }
      if (this.#snapshots.length === 0) this.#startAt = info.at;
      this.#snapshots.push(await this.#read(info));
    } catch (error) {
      this.#failure ??= `capture could not read a pause: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      if (ours) await session.send("Debugger.resume").catch(() => undefined);
      this.#check?.();
    }
  }

  /** Waits for the quiet window (after `atLeast`), takes the final snapshot, disarms and returns the snapshots. */
  async stop(options: StopOptions = {}): Promise<Snapshot[]> {
    const window = quietWindow(this.#delays);
    const atLeast = options.atLeast ?? 0;
    try {
      if (this.#snapshots.length === 0) this.#startAt = await this.#target.frame.evaluate(() => performance.now());
      await new Promise<void>((resolve, reject) => {
        let quietFrame: number | undefined;
        let limit: ReturnType<typeof setTimeout> | undefined;
        const fail = (message: string): void => {
          clearTimeout(limit);
          this.#check = undefined;
          reject(new Error(message));
        };
        const armLimit = (): void => {
          limit = setTimeout(() => {
            this.#exceeded ??= `capture exceeded ${String(bounds.milliseconds)} ms`;
            fail(this.#exceeded);
          }, bounds.milliseconds);
        };
        this.#check = () => {
          const failed = this.#exceeded ?? this.#failure;
          if (failed !== undefined) {
            fail(failed);
            return;
          }
          const last = this.#snapshots.at(-1);
          if (!last?.lifecycle) return;
          if (last.at < this.#startAt + atLeast) return;
          if (limit === undefined) armLimit();
          if (last.at - this.#lastMutation < window) {
            quietFrame = undefined;
            return;
          }
          quietFrame ??= last.frame;
          if (last.frame >= quietFrame + 2) {
            clearTimeout(limit);
            this.#check = undefined;
            resolve();
          }
        };
        if (atLeast === 0) armLimit();
        this.#check();
      });
    } finally {
      await this.#target.frame.evaluate(() => {
        (globalThis as unknown as { __ocelleLive?: { disarm: () => void } }).__ocelleLive?.disarm();
      });
      await this.#reading;
    }
    await this.#snapshot("final");
    await this.#disable();
    return this.#snapshots;
  }

  /** Disarms and lets the page run on its own (after a failed capture too). */
  async dispose(): Promise<void> {
    await this.#target.frame.evaluate(() => {
      (globalThis as unknown as { __ocelleLive?: { disarm: () => void } }).__ocelleLive?.disarm();
    }).catch(() => undefined);
    await this.#reading;
    await this.#disable();
  }

  async #disable(): Promise<void> {
    const { session } = this.#target;
    session.off("Debugger.paused", this.#onPause);
    await session.send("Debugger.disable").catch(() => undefined);
  }
}

const deferred = new WeakSet<Page>();

/**
 * Makes every `page.evaluate` of a fixture page run its function in a task of its own when it would otherwise run
 * inside a pause of the capture (T002, reviews/phase-1/spike.md § Nested evaluation). The DevTools protocol answers
 * an evaluation that arrives while the page is paused at the recorder's `debugger` by running it at once, nested in
 * the paused stack; Chromium then neither upgrades a custom element the function inserts (it stays undefined, with
 * no error) nor delivers its mutations to the paused recorder. The wrapper checks, in the page, whether the
 * recorder holds a pause, and if so waits for a timer task, which runs only after the test side has resumed. Playwright
 * takes a function's source from `String(fn)` and calls it with the argument, so the wrapper is a function whose
 * source is the wrapped one; the page compiles it through the protocol, which the page's CSP does not govern.
 */
function runInTasks(page: Page): void {
  if (deferred.has(page)) return;
  deferred.add(page);
  const evaluate = page.evaluate.bind(page) as (fn: unknown, arg?: unknown) => Promise<unknown>;
  const wrap = (fn: unknown): unknown => {
    if (typeof fn !== "function") return fn;
    const wrapped = (): void => undefined;
    const source = `async (arg) => {
      const live = globalThis.__ocelleLive;
      if (live !== undefined && live.take() !== null) await new Promise((resolve) => setTimeout(resolve, 0));
      return (${String(fn)})(arg);
    }`;
    wrapped.toString = () => source;
    return wrapped;
  };
  (page as unknown as { evaluate: (fn: unknown, arg?: unknown) => Promise<unknown> }).evaluate = (fn, arg) => evaluate(wrap(fn), arg);
}

/** The capture of a fixture page over its own CDP session, with the document mode. */
export function fixtureCapture(page: Page, delays: Delays = chromiumDelays): DocumentCapture & { readonly dispose: () => Promise<void> } {
  runInTasks(page);
  let capture: Capture | undefined;
  let session: CDPSession | undefined;
  const open = async (): Promise<Capture> => {
    await capture?.dispose();
    await session?.detach().catch(() => undefined);
    session = await page.context().newCDPSession(page);
    capture = new Capture({ session, frame: page.mainFrame(), frameId: undefined }, delays);
    return capture;
  };
  return {
    start: async (containerId) => {
      await (await open()).start(containerId);
    },
    startDocument: async (url) => {
      await (await open()).startDocument(page, url);
    },
    stop: async (options) => {
      if (capture === undefined) throw new Error("liveCapture.stop: no capture was started");
      try {
        return await capture.stop(options);
      } finally {
        capture = undefined;
        await session?.detach().catch(() => undefined);
        session = undefined;
      }
    },
    dispose: async () => {
      await capture?.dispose();
      capture = undefined;
      await session?.detach().catch(() => undefined);
      session = undefined;
    },
  };
}

// The in-process browser commands: one capture per browser session (a test file's page), kept between commands.
const running = new Map<string, { readonly capture: Capture; readonly session: CDPSession }>();

async function close(sessionId: string): Promise<void> {
  const open = running.get(sessionId);
  running.delete(sessionId);
  if (open === undefined) return;
  await open.capture.dispose();
  await open.session.detach().catch(() => undefined);
}

/** The `liveStart(containerId, delays)` browser command: arms a capture on the element in the calling test's frame. */
export async function liveStart(context: BrowserCommandContext, containerId: string, delays: Delays): Promise<void> {
  await close(context.sessionId);
  const session = await context.page.context().newCDPSession(context.page);
  const frame = await context.frame();
  const frameId = await frameIdOf(session, frame.url());
  if (frameId === undefined) throw new Error(`liveStart: no frame has the test's URL ${frame.url()}`);
  const capture = new Capture({ session, frame, frameId }, delays);
  running.set(context.sessionId, { capture, session });
  await capture.start(containerId);
}

/** The `liveStop(options)` browser command: stops the calling session's capture and returns its snapshots. */
export async function liveStop(context: BrowserCommandContext, options: StopOptions = {}): Promise<Snapshot[]> {
  const open = running.get(context.sessionId);
  if (open === undefined) throw new Error("liveStop: no capture was started");
  try {
    return await open.capture.stop(options);
  } finally {
    running.delete(context.sessionId);
    await open.capture.dispose();
    await open.session.detach().catch(() => undefined);
  }
}

declare module "vitest/browser" {
  interface BrowserCommands {
    /** Arms the live-region capture on the element with `containerId`, with the capture's delays. */
    liveStart: (containerId: string, delays: Delays) => Promise<void>;
    /** Stops the live-region capture and returns its snapshots. */
    liveStop: (options?: StopOptions) => Promise<Snapshot[]>;
  }
}
