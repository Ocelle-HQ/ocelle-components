// User Story 1's browser scenarios for `ocelle-dialog` (008 spec US1 scenarios 1 to 16; FR-001 to FR-024, FR-042 to
// FR-047; contracts/checks.md § Dialog, every row; tasks.md T015). Each body is written once against the driver and
// run in process on the element source (test/dialog.test.ts) and on the built browser build on the strict-CSP fixture
// (test/browser/dialog.test.ts). Expected values are written by hand from the spec, research and the matrix: token
// values as the computed styles of `packages/tokens/src/source.ts` (light unless a row sets the theme), focus lists
// written out, events with the state read at dispatch by `record()`.
//
// The bodies are built by `overlayScenarios` for one overlay element, its tag and its event prefix: `ocelle-dialog`
// runs every group (`dialogScenarios` below), and `ocelle-drawer` runs the groups matrix § Drawer inherits (008
// tasks.md T030; scenarios/drawer.ts). The nested rows with an open `ocelle-drawer` as the outer overlay are the
// dialog's (T031).
//
// Rules of every body: it ends with FR-047's counts as a delta from mount (0 `style` attributes, 0 added `<style>`
// elements, transient writes included); every wait is a bounded poll of at most 1 000 ms that fails with a message, or
// a bounded pause before a "does not" outcome, which shares its body with the positive outcome it guards (R-15); no
// body uses `driver.style()` (R-14).
//
// Host actions the driver has no method for (a host's veto, a listener, a script `focus()`, a removal, a synthetic
// event) go through the stand-in `ocelle-test-act` that `defineDialogStandIns` defines in the page: the body sets its
// `do` attribute to a command (JSON) through the driver, the stand-in runs it synchronously in its
// `attributeChangedCallback`, and the body reads its `data-result` attribute through the driver. So every observation
// still goes through the driver alone. Names in `focusPath()`: an element by its `id`, else its local name, an
// element in a shadow root or a frame after its host in brackets: `dlg[button]` is the dialog's close control (its
// only `<button>`), `dlg[dialog]` the `<dialog>` itself, `dlg[div]` its body part while it is a Tab stop, `fr[f1]`
// a frame's f1, `xc[c1]` the closed host's c1.
import type { Driver, RecordedEvent } from "./driver.ts";

/** A shared body, its expected observation, and the name it runs under. */
export interface DialogScenario {
  readonly name: string;
  readonly run: (driver: Driver) => Promise<unknown>;
  readonly expected: unknown;
}

/** A command of the stand-in `ocelle-test-act` (see `defineDialogStandIns`). */
export type Act =
  | { readonly op: "focus"; readonly id: string; readonly inner?: string }
  | { readonly op: "blur" }
  | { readonly op: "remove"; readonly id: string; readonly inner?: string }
  | { readonly op: "reinsert"; readonly id: string }
  | { readonly op: "set"; readonly id: string; readonly name: string; readonly value: unknown }
  | { readonly op: "attr"; readonly id: string; readonly inner?: string; readonly name: string; readonly value: string | null }
  | { readonly op: "call"; readonly id: string; readonly inner?: string; readonly method: string }
  | { readonly op: "veto"; readonly id: string; readonly event: string }
  | { readonly op: "on"; readonly id: string; readonly event: string; readonly then: readonly Act[] }
  | { readonly op: "settled"; readonly id: string; readonly then: readonly Act[] }
  | { readonly op: "escape"; readonly id: string; readonly mode: "stop" | "prevent" }
  | { readonly op: "watch"; readonly id: string; readonly inner?: string; readonly events: readonly string[] }
  | { readonly op: "log" }
  | { readonly op: "dispatch"; readonly id: string; readonly inner?: string; readonly type: string; readonly cancelable: boolean; readonly bubbles?: boolean }
  | { readonly op: "key"; readonly key: string; readonly isComposing: boolean }
  | { readonly op: "inspect"; readonly id: string; readonly inner?: string; readonly pseudo?: string; readonly styles?: readonly string[] }
  | { readonly op: "hit"; readonly x: number; readonly y: number }
  | { readonly op: "pointerdown"; readonly id: string; readonly inner?: string; readonly x: number; readonly y: number; readonly isPrimary: boolean }
  | { readonly op: "clicks"; readonly id: string; readonly inner?: string }
  | { readonly op: "clicked" }
  | { readonly op: "seq"; readonly ops: readonly Act[] };

/** What `clicks` records of a click, when the window sees it, before any element's listener. */
export interface Click {
  /** Whether the click's composed path holds the watched element. */
  readonly on: boolean;
  /** Whether the host carries its `open` attribute. */
  readonly open: boolean;
  /** Whether the host's inner `<dialog>` is open (it stays open through the exit). */
  readonly panel: boolean;
}

/** What `inspect` reads of an element (its border box relative to the viewport; `exists` false when there is none). */
export interface Inspected {
  readonly exists: boolean;
  readonly tag: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly text: string;
  readonly children: number;
  readonly last: boolean;
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly width: number;
  readonly height: number;
  readonly scrollTop: number;
  readonly scrollLeft: number;
  readonly scrollHeight: number;
  readonly clientHeight: number;
  readonly scrollWidth: number;
  readonly clientWidth: number;
  readonly open: boolean | null;
  readonly value: string | null;
  readonly popoverOpen: boolean;
  readonly modal: boolean;
  readonly styles: Readonly<Record<string, string>>;
}

/**
 * Defines the stand-ins in the page that calls it. Self-contained (the fixture passes it to `page.evaluate`), so it
 * uses nothing from outside its own body, and defines nothing twice.
 * - `ocelle-test-act`: runs the command (JSON, `Act`) set as its `do` attribute and writes `{ "result": … }` or
 *   `{ "error": "…" }` to its `data-result` attribute. `focus`, `remove` (kept for `reinsert`, which puts the element
 *   back where it was), `set` (a property), `attr` (an attribute), `call` (a method without arguments), `veto` (a
 *   listener that cancels the event), `on` (runs commands from a listener), `settled` (runs commands in the host's
 *   continuation of the element's `updateComplete`, as `el.open = false; await el.updateComplete; …` does; 008
 *   tasks.md T058), `escape` (a keydown listener that stops
 *   the propagation of, or prevents, Escape), `watch` (records events of an element, in the capture phase, as
 *   `<type>:<cancelable>`) and `log` (returns and clears those records), `dispatch` (a synthetic event, bubbling when
 *   `bubbles` is true, returns whether it was not cancelled), `key` (a synthetic bubbling, composed, cancelable `keydown` on the deep active
 *   element), `inspect`, `hit` (the id or local name of the element at a viewport point), `pointerdown` (a synthetic
 *   bubbling, composed `pointerdown` of a touch pointer's primary button at a viewport point, primary or not, as a
 *   second finger gives; 008 T036), `clicks` (from then on records each `click` the window sees in the capture phase,
 *   before any element's listener, as a `Click`: whether its composed path holds the element, and whether the host,
 *   the element `id` names, has its `open` attribute and its inner `<dialog>` open) and `clicked` (returns and clears
 *   those records), `seq` (commands in one task). An `inner` selector is looked up in the element's shadow root.
 * - `ocelle-test-closed` and `ocelle-test-closed-delegating`: a closed shadow root holding `<button id="c1">` and
 *   `<button id="c2">`, the second with `delegatesFocus`.
 * - `ocelle-test-opener`: an open shadow root holding `<button id="in">Inner</button>`.
 * - `ocelle-test-radio`: an open shadow root holding a radio button `#sr` of the name `g`.
 * - `ocelle-test-fallback`: an open shadow root holding `<div id="t" tabindex="-1">` (not a stop), then a slot whose
 *   fallback content is `<button id="fb">`.
 * - `ocelle-test-autofocus`: an open shadow root holding `<button id="pa">`, then `<button id="af" autofocus>`.
 * - `ocelle-test-positive`: an open shadow root holding `<button id="s1" tabindex="1">`.
 */
export function defineDialogStandIns(): void {
  if (customElements.get("ocelle-test-act") !== undefined) return;
  const closed = (delegatesFocus: boolean): CustomElementConstructor =>
    class extends HTMLElement {
      constructor() {
        super();
        const root = this.attachShadow({ mode: "closed", delegatesFocus });
        root.innerHTML = '<button id="c1">C1</button><button id="c2">C2</button>';
      }
    };
  customElements.define("ocelle-test-closed", closed(false));
  customElements.define("ocelle-test-closed-delegating", closed(true));
  const openRoot = (markup: string): CustomElementConstructor =>
    class extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: "open" }).innerHTML = markup;
      }
    };
  customElements.define("ocelle-test-opener", openRoot('<button id="in">Inner</button>'));
  customElements.define("ocelle-test-radio", openRoot('<input type="radio" name="g" id="sr" aria-label="Shadow">'));
  customElements.define("ocelle-test-fallback", openRoot('<div id="t" tabindex="-1">Not a stop</div><slot><button id="fb">Fallback</button></slot>'));
  customElements.define("ocelle-test-autofocus", openRoot('<button id="pa">Plain</button><button id="af" autofocus>Auto</button>'));
  customElements.define("ocelle-test-positive", openRoot('<button id="s1" tabindex="1">S1</button>'));
  type Command = Record<string, unknown> & { op: string };
  const removed = new Map<string, { element: Element; parent: Node; next: Node | null }>();
  const log: string[] = [];
  const clicks: unknown[] = [];
  let clickWatch: { readonly host: HTMLElement; readonly element: HTMLElement | null } | null = null;
  const byId = (id: string): HTMLElement => {
    const found = document.getElementById(id) ?? (removed.get(id)?.element as HTMLElement | undefined);
    if (found === undefined) throw new Error(`no #${id}`);
    return found;
  };
  const target = (command: Command): HTMLElement | null => {
    const host = byId(String(command.id));
    if (typeof command.inner !== "string") return host;
    return host.shadowRoot?.querySelector<HTMLElement>(command.inner) ?? null;
  };
  const deep = (): Element => {
    let active = document.activeElement ?? document.body;
    while (active.shadowRoot?.activeElement != null) active = active.shadowRoot.activeElement;
    return active;
  };
  const run = (command: Command): unknown => {
    switch (command.op) {
      case "focus":
        target(command)?.focus();
        return null;
      case "blur":
        (deep() as HTMLElement).blur();
        return null;
      case "remove": {
        const element = target(command);
        if (element === null) return null;
        if (typeof command.inner !== "string") removed.set(String(command.id), { element, parent: element.parentNode as Node, next: element.nextSibling });
        element.remove();
        return null;
      }
      case "reinsert": {
        const entry = removed.get(String(command.id));
        if (entry === undefined) throw new Error(`#${String(command.id)} was not removed`);
        entry.parent.insertBefore(entry.element, entry.next);
        removed.delete(String(command.id));
        return null;
      }
      case "set":
        (byId(String(command.id)) as unknown as Record<string, unknown>)[String(command.name)] = command.value;
        return null;
      case "attr": {
        const element = target(command);
        if (command.value === null) element?.removeAttribute(String(command.name));
        else element?.setAttribute(String(command.name), command.value as string);
        return null;
      }
      case "call": {
        const element = target(command) as unknown as Record<string, () => unknown> | null;
        const method = String(command.method);
        if (element === null || typeof element[method] !== "function") return "no such method";
        element[method]();
        return null;
      }
      case "veto":
        byId(String(command.id)).addEventListener(String(command.event), (event) => {
          event.preventDefault();
        });
        return null;
      case "on": {
        const then = command.then as Command[];
        byId(String(command.id)).addEventListener(String(command.event), () => {
          for (const each of then) run(each);
        });
        return null;
      }
      case "settled": {
        const then = command.then as Command[];
        void (byId(String(command.id)) as unknown as { readonly updateComplete: Promise<unknown> }).updateComplete.then(() => {
          for (const each of then) run(each);
        });
        return null;
      }
      case "escape":
        byId(String(command.id)).addEventListener("keydown", (event) => {
          if (event.key !== "Escape") return;
          if (command.mode === "stop") event.stopPropagation();
          else event.preventDefault();
        });
        return null;
      case "watch": {
        log.length = 0;
        const element = target(command);
        for (const name of command.events as string[])
          element?.addEventListener(
            name,
            (event) => {
              if (event.target === element) log.push(`${event.type}:${String(event.cancelable)}`);
            },
            true,
          );
        return null;
      }
      case "log":
        return log.splice(0);
      case "dispatch":
        return target(command)?.dispatchEvent(new Event(String(command.type), { cancelable: command.cancelable === true, bubbles: command.bubbles === true })) ?? null;
      case "key":
        return deep().dispatchEvent(new KeyboardEvent("keydown", { key: String(command.key), bubbles: true, composed: true, cancelable: true, isComposing: command.isComposing === true }));
      case "inspect": {
        const element = target(command);
        if (element === null) return { exists: false, attributes: {}, styles: {} };
        const rect = element.getBoundingClientRect();
        const computed = getComputedStyle(element, typeof command.pseudo === "string" ? command.pseudo : null);
        const styles = Object.fromEntries(((command.styles as string[] | undefined) ?? []).map((name) => [name, computed.getPropertyValue(name)]));
        const dialog = element instanceof HTMLDialogElement ? element : null;
        return {
          exists: true,
          tag: element.localName,
          attributes: Object.fromEntries([...element.attributes].map((attribute) => [attribute.name, attribute.value])),
          text: element.textContent,
          children: element.children.length,
          last: element.parentElement?.lastElementChild === element,
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height,
          scrollTop: element.scrollTop,
          scrollLeft: element.scrollLeft,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          open: dialog === null ? ((element as unknown as { open?: unknown }).open === undefined ? null : Boolean((element as unknown as { open?: unknown }).open)) : dialog.open,
          value: element instanceof HTMLInputElement ? element.value : null,
          popoverOpen: element.matches(":popover-open"),
          modal: element.matches(":modal"),
          styles,
        };
      }
      case "hit": {
        const found = document.elementFromPoint(Number(command.x), Number(command.y));
        return found === null ? null : found.id === "" ? found.localName : found.id;
      }
      case "pointerdown":
        return (
          target(command)?.dispatchEvent(
            new PointerEvent("pointerdown", { bubbles: true, composed: true, cancelable: true, clientX: Number(command.x), clientY: Number(command.y), button: 0, buttons: 1, pointerType: "touch", pointerId: 7, isPrimary: command.isPrimary === true }),
          ) ?? null
        );
      case "clicks": {
        clicks.length = 0;
        const host = byId(String(command.id));
        const element = target(command);
        // One listener for the page, so commands of later bodies on the same page do not add more.
        if (clickWatch === null)
          window.addEventListener(
            "click",
            (event) => {
              if (clickWatch === null) return;
              const { host: watched, element: on } = clickWatch;
              clicks.push({ on: on !== null && event.composedPath().includes(on), open: watched.hasAttribute("open"), panel: watched.shadowRoot?.querySelector("dialog")?.open === true });
            },
            true,
          );
        clickWatch = { host, element };
        return null;
      }
      case "clicked":
        return clicks.splice(0);
      case "seq":
        return (command.ops as Command[]).map(run);
      default:
        throw new Error(`unknown command ${command.op}`);
    }
  };
  customElements.define(
    "ocelle-test-act",
    class extends HTMLElement {
      static get observedAttributes(): string[] {
        return ["do"];
      }

      attributeChangedCallback(_name: string, _old: string | null, value: string | null): void {
        if (value === null) return;
        try {
          this.setAttribute("data-result", JSON.stringify({ result: run(JSON.parse(value) as Command) ?? null }));
        } catch (error) {
          this.setAttribute("data-result", JSON.stringify({ error: String(error) }));
        }
      }
    },
  );
}

// Helpers -------------------------------------------------------------------------------------------------------


/** Runs a stand-in command and returns its result; a command that failed throws its message. */
export async function act(driver: Driver, command: Act): Promise<unknown> {
  await driver.setAttribute("act", "do", JSON.stringify(command));
  const text = await driver.attribute("act", "data-result");
  const parsed = JSON.parse(text ?? '{"error":"no result"}') as { result?: unknown; error?: string };
  if (parsed.error !== undefined) throw new Error(`stand-in command ${command.op}: ${parsed.error}`);
  return parsed.result;
}

export const inspect = async (driver: Driver, id: string, inner?: string, styles?: readonly string[], pseudo?: string): Promise<Inspected> =>
  (await act(driver, { op: "inspect", id, ...(inner === undefined ? {} : { inner }), ...(styles === undefined ? {} : { styles }), ...(pseudo === undefined ? {} : { pseudo }) })) as Inspected;

export const pause = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** Polls `recorded()` until it holds `count` events, at most 1 000 ms; fails with a message otherwise. */
export async function events(driver: Driver, count: number): Promise<RecordedEvent[]> {
  for (const start = Date.now(); ; ) {
    const recorded = await driver.recorded();
    if (recorded.length >= count) return recorded;
    if (Date.now() - start > 1000) throw new Error(`${String(count)} events not recorded within 1 000 ms: ${JSON.stringify(recorded.map((each) => each.type))}`);
    await pause(20);
  }
}

/** The events after a pause long enough for an exit animation to end (motion-base is 200 ms), for "does not" rows. */
export async function after(driver: Driver): Promise<RecordedEvent[]> {
  await pause(350);
  return driver.recorded();
}

/** The stand-in's watch log, read after a pause in which a queued native `close` event arrives. */
export async function logAfter(driver: Driver): Promise<unknown> {
  await pause(100);
  return act(driver, { op: "log" });
}

/** Polls `read` until it returns true, at most 1 000 ms (keyboard scrolling is animated); returns the last reading. */
export async function eventually(read: () => Promise<boolean>): Promise<boolean> {
  for (const start = Date.now(); ; ) {
    if (await read()) return true;
    if (Date.now() - start > 1000) return false;
    await pause(20);
  }
}

/** FR-047's counts since mount. */
export async function counts(driver: Driver): Promise<{ readonly styleAttributes: number; readonly styleElements: number }> {
  return { styleAttributes: await driver.styleAttributes(), styleElements: await driver.styleElements() };
}
export const none = { styleAttributes: 0, styleElements: 0 };

/** Presses `key` `n` times and returns `focusPath()` after each press, joined by spaces. */
export async function presses(driver: Driver, n: number, shift = false, key = "Tab"): Promise<string> {
  const path: string[] = [];
  for (let index = 0; index < n; index += 1) {
    await driver.inputPress(key, { shift });
    path.push(await driver.focusPath());
  }
  return path.join(" ");
}

export const close = '[part="close-button"]';
export const focusClose = (driver: Driver, id = "dlg"): Promise<unknown> => act(driver, { op: "focus", id, inner: close });

/** Whether the dialog is open: its `open` attribute and whether its inner `<dialog>` is `:modal`, and the top layer. */
export async function state(driver: Driver, id = "dlg"): Promise<{ readonly open: boolean; readonly modal: boolean; readonly topLayer: number }> {
  const panel = await inspect(driver, id, "dialog");
  return { open: (await driver.attribute(id, "open")) !== null, modal: panel.modal, topLayer: (await driver.topLayer()).length };
}
export const shown = { open: true, modal: true, topLayer: 1 };
export const gone = { open: false, modal: false, topLayer: 0 };

/** A scenario whose observation ends with FR-047's counts. */
export function row(name: string, body: (driver: Driver) => Promise<Record<string, unknown>>, expected: Record<string, unknown>): DialogScenario {
  return {
    name,
    run: async (driver) => ({ ...(await body(driver)), counts: await counts(driver) }),
    expected: { ...expected, counts: none },
  };
}

/** How many runs a row judged on a page-side measurement makes at most before it fails with what it measured. */
const tries = 3;

/**
 * For a row of two clicks on the close control during the exit: runs `attempt`, which mounts its page, clicks and
 * returns its observation with the clicks the page recorded (the stand-in's `clicks`, read before any element's
 * listener). A run is judged when the page saw exactly two clicks, both on the close control, the first while the
 * overlay was open and the second during the exit (the `open` attribute gone, the inner `<dialog>` still open): its
 * observation is returned. Any other run (a click that missed the control, or came after the exit) judges nothing, so
 * the body runs again, at most `tries` times in all; then the row fails with the recorded clicks, never passing
 * without a judged run.
 */
export async function duringExit(attempt: () => Promise<{ readonly clicked: readonly Click[]; readonly observed: Record<string, unknown> }>): Promise<Record<string, unknown>> {
  const seen: string[] = [];
  for (let run = 0; run < tries; run += 1) {
    const { clicked, observed } = await attempt();
    const [first, second] = clicked;
    if (clicked.length === 2 && first?.on === true && first.open && second?.on === true && !second.open && second.panel) return observed;
    seen.push(JSON.stringify(clicked));
  }
  throw new Error(`the two clicks were not both on the close control, the second during the exit, in any of ${String(tries)} runs (${seen.join(", ")}): the row has no run it can judge`);
}

// Token values (packages/tokens/src/source.ts), as computed styles in the light theme unless stated.
export const sheetLight = "rgb(251, 250, 247)";
export const sheetDark = "rgb(33, 30, 24)";
export const inkLight = "rgb(21, 19, 15)";
export const inkDark = "rgb(237, 233, 225)";
export const overlayLight = "rgba(21, 19, 15, 0.5)";
export const overlayDark = "rgba(0, 0, 0, 0.65)";
export const raisedLight = "rgba(21, 19, 15, 0.1) 0px 2px 4px 0px, rgba(21, 19, 15, 0.16) 0px 12px 32px 0px";
export const raisedDark = "rgb(77, 70, 58) 0px 0px 0px 1px";
export const focusLight = "rgb(143, 94, 15)";
export const radius2 = "4px";
export const motionBase = 200;
export const easingStandard = "cubic-bezier(0.22, 1, 0.36, 1)";
/** `calc(3 * var(--ocelle-target-min))` at a 16 px root: 3 × 2.75rem. */
export const bodyMinimum = 132;
export const targetMin = 44;

/** An opacity animation's two keyframes, as `animations()` reads them: the dialog's entry and exit (R-06). */
const fade = (from: number, to: number): unknown[] => [
  { offset: 0, easing: "linear", opacity: String(from) },
  { offset: 1, easing: "linear", opacity: String(to) },
];

/** The element a builder of `overlayScenarios` writes its rows for: its tag and its event prefix. */
export interface OverlayKind {
  readonly tag: "ocelle-dialog" | "ocelle-drawer";
  /** `ocelle-<element>`: the events are `<prefix>-close-request` and `<prefix>-close`. */
  readonly prefix: string;
  /** The entry animation's keyframes at the default attributes, as `animations()` reads them. */
  readonly entry: readonly unknown[];
  /**
   * Waits, before a pointer click on the page, until no open overlay's panel moves: the drawer's entry slides the panel
   * in (FR-028), so a click at an element's centre during it would land where the element was; the dialog's fade does
   * not move it, and its rows click at once.
   */
  readonly settle?: (driver: Driver) => Promise<void>;
}

/**
 * The shared bodies of matrix § Dialog for one overlay element: every row with `kind`'s tag in its markup and `kind`'s
 * event names in its expected events (008 tasks.md T015, T030). `ocelle-dialog` runs every group; `ocelle-drawer`
 * runs the groups matrix § Drawer inherits (test/scenarios/drawer.ts).
 */
export function overlayScenarios(kind: OverlayKind) {
  /** A real click at the centre of the element with `id` (or `inner` in its shadow root), once `kind.settle` allows it. */
  const click = async (driver: Driver, id: string, inner?: string): Promise<void> => {
    await kind.settle?.(driver);
    await driver.inputClick(id, inner);
  };
  const requestName = `${kind.prefix}-close-request`;
  const closeName = `${kind.prefix}-close`;
  const both = [requestName, closeName];

  /** A page: an opener, the dialog with `content` (and `footer` in a footer `<div>`), a page button and the stand-in. */
  function page(content: string, options: { readonly attrs?: string; readonly footer?: string; readonly before?: string; readonly label?: string } = {}): string {
    const footer = options.footer === undefined ? "" : `<div slot="footer">${options.footer}</div>`;
    return `${options.before ?? ""}<button id="opener">Open</button><${kind.tag} id="dlg" label="${options.label ?? "Open project"}"${options.attrs ?? ""}>${content}${footer}</${kind.tag}><button id="after">After</button><ocelle-test-act id="act"></ocelle-test-act>`;
  }

  /**
   * Clicks the opener (which focuses it), or with `script` focuses it by script (a click outside would light-dismiss a
   * slotted `closedby="any"` dialog), and sets `open`; then records the dialog's two events.
   */
  async function open(driver: Driver, id = "dlg", script = false): Promise<void> {
    if (script) await act(driver, { op: "focus", id: "opener" });
    else await driver.inputClick("opener");
    await driver.setAttribute(id, "open", "");
    await driver.record(id, both);
  }

  /** A recorded request event, as the matrix states it at dispatch: `open` true, the inner dialog open and `:modal`. */
  const request = (reason: string, focusPath: string): RecordedEvent => ({
    type: requestName,
    detail: { reason },
    cancelable: true,
    bubbles: true,
    composed: true,
    open: true,
    dialogOpen: true,
    modal: true,
    focusPath,
  });

  /** A recorded close event: `open` false, the inner dialog neither open nor `:modal`, focus already on its target. */
  const closeEvent = (reason: string, focusPath: string): RecordedEvent => ({
    type: closeName,
    detail: { reason },
    cancelable: false,
    bubbles: true,
    composed: true,
    open: false,
    dialogOpen: false,
    modal: false,
    focusPath,
  });

  // Open and initial focus --------------------------------------------------------------------------------------------

  const initialRows: DialogScenario[] = [
    { label: "a slotted autofocus button", content: '<button id="b1">B1</button><button id="b2" autofocus>B2</button>', focus: "b2" },
    { label: "the first focusable element of the body", content: '<p>Choose a folder.</p><button id="b1">B1</button><button id="b2">B2</button>', focus: "b1" },
    { label: "the close control when nothing is focusable", content: "<p>Nothing to focus.</p>", focus: "dlg[button]" },
    { label: "the next button when the first is display: none", content: '<button id="h1">Hidden</button><button id="b1">B1</button>', rules: "#h1 { display: none; }", focus: "b1" },
    { label: "the next button when the first is visibility: hidden", content: '<button id="h1">Hidden</button><button id="b1">B1</button>', rules: "#h1 { visibility: hidden; }", focus: "b1" },
    {
      label: "the checked radio of a radio group first",
      content: '<input type="radio" name="g" id="r1" aria-label="One"><input type="radio" name="g" id="r2" aria-label="Two" checked><button id="b1">B1</button>',
      focus: "r2",
    },
    { label: "the first radio of a radio group with none checked", content: '<input type="radio" name="g" id="r1" aria-label="One"><input type="radio" name="g" id="r2" aria-label="Two"><button id="b1">B1</button>', focus: "r1" },
    {
      label: "the checked radio of a group of three, the middle one",
      content: '<input type="radio" name="g" id="r1" aria-label="One"><input type="radio" name="g" id="r2" aria-label="Two" checked><input type="radio" name="g" id="r3" aria-label="Three"><button id="b1">B1</button>',
      focus: "r2",
    },
    {
      label: "the first stop past a disabled button, an <a> without href and a hidden input",
      content: '<button id="d1" disabled>Off</button><a id="na">No link</a><input type="hidden" id="hi" value="x"><button id="b1">B1</button>',
      focus: "b1",
    },
    { label: "an <a> without href that tabindex=0 makes a stop", content: '<a id="ta" tabindex="0">Link-like</a><button id="b1">B1</button>', focus: "ta" },
    { label: "a media element with controls", content: '<video id="vid" controls></video><button id="b1">B1</button>', focus: "vid" },
    { label: "a button inside an SVG foreignObject", content: '<svg width="120" height="48"><foreignObject width="120" height="48"><button id="fo">FO</button></foreignObject></svg><button id="b1">B1</button>', focus: "fo" },
    { label: "a slot's fallback button in a slotted open shadow root", content: '<ocelle-test-fallback id="fh"></ocelle-test-fallback><button id="b1">B1</button>', focus: "fh[fb]" },
    { label: "an autofocus button in a slotted element's open shadow root", content: '<button id="b1">B1</button><ocelle-test-autofocus id="ah"></ocelle-test-autofocus>', focus: "ah[af]" },
    {
      label: "a button before a radio group whose second radio is checked: the button",
      content: '<button id="b1">B1</button><input type="radio" name="g" id="r1" aria-label="One"><input type="radio" name="g" id="r2" aria-label="Two" checked>',
      focus: "b1",
    },
    { label: "a closed shadow root with delegatesFocus first: its first inner button", content: '<ocelle-test-closed-delegating id="xc"></ocelle-test-closed-delegating><button id="b1">B1</button>', focus: "xc[c1]" },
    { label: "a vertical scroller with no stop inside, first: the scroller", content: '<div id="sy"><p>Line 1.</p><p>Line 2.</p><p>Line 3.</p><p>Line 4.</p></div><button id="b1">B1</button>', rules: "#sy { overflow-y: auto; block-size: 40px; }", focus: "sy" },
    {
      label: "a scroller holding a button inside a block, first: the button",
      content: '<div id="sb"><div><button id="ib">In</button></div><p>Line 1.</p><p>Line 2.</p><p>Line 3.</p></div><button id="b1">B1</button>',
      rules: "#sb { overflow-y: auto; block-size: 40px; }",
      focus: "ib",
    },
    {
      label: "a scroller holding a radio button, first: the radio",
      content: '<div id="sr"><input type="radio" name="g" id="q1" aria-label="Q"><p>Line 1.</p><p>Line 2.</p><p>Line 3.</p></div><button id="b1">B1</button>',
      rules: "#sr { overflow-y: auto; block-size: 40px; }",
      focus: "q1",
    },
    {
      label: "nested scrollers, first: the inner one",
      content: '<div id="so"><div id="si"><p>Line 1.</p><p>Line 2.</p><p>Line 3.</p><p>Line 4.</p></div><p>Line 5.</p><p>Line 6.</p><p>Line 7.</p></div><button id="b1">B1</button>',
      rules: "#so { overflow-y: auto; block-size: 80px; } #si { overflow-y: auto; block-size: 40px; }",
      focus: "si",
    },
  ].map(({ label, content, rules, focus }) =>
    row(
      `open and initial focus: ${label}; shown modally in the top layer over the inert page, no event on open (US1-1, FR-002, FR-007, FR-015)`,
      async (driver) => {
        await driver.mount(page(content));
        if (rules !== undefined) await driver.rules(rules);
        await driver.record("dlg", both);
        await driver.record("after", ["click", "focus"]);
        await driver.inputClick("opener");
        await driver.setAttribute("dlg", "open", "");
        const focused = await driver.focusPath();
        const layer = await driver.topLayer();
        const box = await driver.box("after");
        const hit = await act(driver, { op: "hit", x: box.x + box.width / 2, y: box.y + box.height / 2 });
        await click(driver, "after");
        return { focused, layer, hit, afterClick: await driver.focusPath(), pageTree: await driver.ax("after"), recorded: await driver.recorded(), state: await state(driver) };
      },
      { focused: focus, layer: [{ element: "dlg[dialog]", modal: true, popoverOpen: false }], hit: "dlg", afterClick: "dlg[dialog]", pageTree: [], recorded: [], state: shown },
    ),
  );

  // The Tab cycle (SC-002) ------------------------------------------------------------------------------------------

  interface Cycle {
    readonly label: string;
    readonly content: string;
    readonly footer?: string;
    readonly rules?: string;
    /** How focus gets to its start: a command, or "close" for the close control. */
    readonly start: Act | "close" | "prose" | "removed";
    readonly n: number;
    /** The presses when a measured list is longer than n + 2 (contracts/checks.md § Dialog "Opaque content" (ii)). */
    readonly presses?: number;
    readonly tab: string;
    readonly shift: string;
    /** The focus path at the start, when the row states it. */
    readonly at?: string;
  }

  function cycleRows(name: string, cycles: readonly Cycle[]): DialogScenario[] {
    return cycles.flatMap((cycle) =>
      ([false, true] as const).map((shift) =>
        row(
          `${name}: ${cycle.label}, ${shift ? "Shift+Tab" : "Tab"} × ${cycle.presses === undefined ? `n + 2 = ${String(cycle.n + 2)}` : `${String(cycle.presses)}, the measured list (n = ${String(cycle.n)})`}`,
          async (driver) => {
            await driver.mount(page(cycle.content, cycle.footer === undefined ? {} : { footer: cycle.footer }));
            if (cycle.rules !== undefined) await driver.rules(cycle.rules);
            await open(driver);
            if (cycle.start === "close") await focusClose(driver);
            else if (cycle.start === "prose") await click(driver, "prose");
            else if (cycle.start === "removed") await act(driver, { op: "seq", ops: [{ op: "focus", id: "gone" }, { op: "remove", id: "gone" }] });
            else await act(driver, cycle.start);
            const at = await driver.focusPath();
            return { at, path: await presses(driver, cycle.presses ?? cycle.n + 2, shift), state: await state(driver) };
          },
          { at: cycle.at ?? (cycle.start === "close" ? "dlg[button]" : expectStart(cycle.start)), path: shift ? cycle.shift : cycle.tab, state: shown },
        ),
      ),
    );
  }

  function expectStart(start: Act | "prose" | "removed"): string {
    if (start === "prose") return "dlg[dialog]";
    if (start === "removed") return "body";
    return start.op === "focus" ? start.id : "";
  }

  const basic = '<button id="b1">B1</button><button id="b2">B2</button>';
  const tabCycleRows = cycleRows("Tab cycle (US1-2, SC-002)", [
    { label: "close control, b1, b2, footer f1, from the close control", content: basic, footer: '<button id="f1">F1</button>', start: "close", n: 4, tab: "b1 b2 f1 dlg[button] b1 b2", shift: "f1 b2 b1 dlg[button] f1 b2" },
    { label: "the same from the first body stop b1", content: basic, footer: '<button id="f1">F1</button>', start: { op: "focus", id: "b1" }, n: 4, tab: "b2 f1 dlg[button] b1 b2 f1", shift: "dlg[button] f1 b2 b1 dlg[button] f1" },
    { label: "the same from the last stop f1", content: basic, footer: '<button id="f1">F1</button>', start: { op: "focus", id: "f1" }, n: 4, tab: "dlg[button] b1 b2 f1 dlg[button] b1", shift: "b2 b1 dlg[button] f1 b2 b1" },
    {
      label: "a radio group is one stop and a CSS-hidden button is skipped",
      content: '<button id="b1">B1</button><button id="h1">Hidden</button><input type="radio" name="g" id="r1" aria-label="One"><input type="radio" name="g" id="r2" aria-label="Two" checked><input type="radio" name="g" id="r3" aria-label="Three"><button id="b2">B2</button>',
      rules: "#h1 { display: none; }",
      start: "close",
      n: 4,
      tab: "b1 r2 b2 dlg[button] b1 r2",
      shift: "b2 r2 b1 dlg[button] b2 r2",
    },
  ]);

  // Op 022 (#57; ops/022-focus-trap-details-icon-name spec.md scenarios 1, 2, 4 and 5): the content of a closed
  // <details>, apart from its summary, is not rendered and so is no stop. Chromium hides the closed panel with
  // content-visibility, so its link keeps a client rect and visibility: visible; only checkVisibility() is false.
  const closedDetails = '<button id="b1">B1</button><details id="d"><summary id="s">More</summary><a id="l" href="#x">Hidden link</a></details>';
  const openDetails = '<button id="b1">B1</button><details id="d" open><summary id="s">More</summary><a id="l" href="#x">Hidden link</a></details>';
  const detailsRows = cycleRows("Tab cycle with a <details> at the end (op 022, #57)", [
    { label: "a closed <details> last, no footer, from its summary: its link is no stop", content: closedDetails, start: { op: "focus", id: "s" }, n: 3, tab: "dlg[button] b1 s dlg[button] b1", shift: "b1 dlg[button] s b1 dlg[button]" },
    { label: "a closed <details> last, no footer, from the close control", content: closedDetails, start: "close", n: 3, tab: "b1 s dlg[button] b1 s", shift: "s b1 dlg[button] s b1" },
    { label: "an open <details> last, no footer, from its summary: its link is a stop", content: openDetails, start: { op: "focus", id: "s" }, n: 4, tab: "l dlg[button] b1 s l dlg[button]", shift: "b1 dlg[button] l s b1 dlg[button]" },
    { label: "a closed <details> before a footer f1, from its summary", content: closedDetails, footer: '<button id="f1">F1</button>', start: { op: "focus", id: "s" }, n: 4, tab: "f1 dlg[button] b1 s f1 dlg[button]", shift: "b1 dlg[button] f1 s b1 dlg[button]" },
  ]);

  const nonStopRows = cycleRows("Tab cycle from a non-stop (R-04)", [
    { label: "the focused <dialog> after a click on body prose", content: '<button id="b1">B1</button><p id="prose">Some prose to click on.</p><button id="b2">B2</button>', start: "prose", n: 3, tab: "dlg[button] b1 b2 dlg[button] b1", shift: "b2 b1 dlg[button] b2 b1" },
    {
      label: "a slotted tabindex=-1 element focused by script",
      content: '<button id="b1">B1</button><div id="t" tabindex="-1">Not a stop</div><button id="b2">B2</button>',
      start: { op: "focus", id: "t" },
      n: 3,
      tab: "b2 dlg[button] b1 b2 dlg[button]",
      shift: "b1 dlg[button] b2 b1 dlg[button]",
    },
  ]);

  const bodyStartRows = cycleRows("Tab cycle from the body (R-02, R-04)", [
    {
      label: "a focused slotted button that the host removes",
      content: '<button id="b1">B1</button><button id="gone">Gone</button><button id="b3">B3</button>',
      start: "removed",
      n: 3,
      tab: "dlg[button] b1 b3 dlg[button] b1",
      shift: "b3 b1 dlg[button] b3 b1",
    },
  ]);

  /** A wide prose table that overflows on the inline axis, with no link (a slotted scroller, R-04). */
  const wideTable = '<div data-ocelle-prose=""><table id="tbl"><tbody><tr><td id="cell">A wide table cell that does not wrap and so overflows the panel on the inline axis, as a prose table does</td></tr></tbody></table></div>';
  const tableRules = "#tbl { display: block; overflow-x: auto; } #cell { white-space: nowrap; }";
  const scrollerRows = [
    ...cycleRows("Tab cycle with a slotted scroller (R-04)", [
      { label: "a body ending in a wide prose table, no footer", content: `<button id="b1">B1</button>${wideTable}`, rules: tableRules, start: "close", n: 3, tab: "b1 tbl dlg[button] b1 tbl", shift: "tbl b1 dlg[button] tbl b1" },
      {
        label: "the table before a footer of one button",
        content: `<button id="b1">B1</button>${wideTable}`,
        footer: '<button id="f1">F1</button>',
        rules: tableRules,
        start: "close",
        n: 4,
        tab: "b1 tbl f1 dlg[button] b1 tbl",
        shift: "f1 tbl b1 dlg[button] f1 tbl",
      },
    ]),
    row(
      "Tab cycle with a slotted scroller: ArrowRight on the focused table scrolls it (R-04)",
      async (driver) => {
        await driver.mount(page(`<button id="b1">B1</button>${wideTable}`));
        await driver.rules(tableRules);
        await open(driver);
        await driver.inputPress("Tab");
        const focused = await driver.focusPath();
        const before = await inspect(driver, "tbl");
        await driver.inputPress("ArrowRight");
        const scrolled = await eventually(async () => (await inspect(driver, "tbl")).scrollLeft > 0);
        return { focused, overflows: before.scrollWidth > before.clientWidth, start: before.scrollLeft, scrolled };
      },
      { focused: "tbl", overflows: true, start: 0, scrolled: true },
    ),
  ];

  const closedHost = (tag: string): string => `<${tag} id="xc"></${tag}>`;
  const frame = '<iframe id="fr" title="Two buttons" srcdoc="<button id=f1>F1</button><button id=f2>F2</button>"></iframe>';
  const opaqueRows = cycleRows("Tab cycle with opaque content (US1-14, SC-002, R-04; lists measured in T014)", [
    { label: "(i) a closed shadow root between two buttons", content: `<button id="b1">B1</button>${closedHost("ocelle-test-closed")}<button id="b2">B2</button>`, start: "close", n: 5, tab: "b1 xc[c1] xc[c2] b2 dlg[button] b1 xc[c1]", shift: "b2 xc[c2] xc[c1] b1 dlg[button] b2 xc[c2]" },
    {
      label: "(i) a closed shadow root with delegatesFocus between two buttons",
      content: `<button id="b1">B1</button>${closedHost("ocelle-test-closed-delegating")}<button id="b2">B2</button>`,
      start: "close",
      n: 5,
      tab: "b1 xc[c1] xc[c2] b2 dlg[button] b1 xc[c1]",
      shift: "b2 xc[c2] xc[c1] b1 dlg[button] b2 xc[c2]",
    },
    { label: "(i) an iframe between two buttons", content: `<button id="b1">B1</button>${frame}<button id="b2">B2</button>`, start: "close", n: 5, tab: "b1 fr[f1] fr[f2] b2 dlg[button] b1 fr[f1]", shift: "b2 fr[f2] fr[f1] b1 dlg[button] b2 fr[f2]" },
    { label: "(ii) a closed shadow root last, no footer", content: `<button id="b1">B1</button>${closedHost("ocelle-test-closed")}`, start: "close", n: 4, presses: 7, tab: "b1 xc[c1] xc[c2] dlg[button] b1 xc[c1] xc[c2]", shift: "xc[c2] xc[c1] b1 dlg[button] xc[c2] xc[c1] b1" },
    {
      label: "(ii) a closed shadow root with delegatesFocus last, no footer",
      content: `<button id="b1">B1</button>${closedHost("ocelle-test-closed-delegating")}`,
      start: "close",
      n: 4, presses: 7,
      tab: "b1 xc[c1] xc[c2] dlg[button] b1 xc[c1] xc[c2]",
      shift: "xc[c2] xc[c1] b1 dlg[button] xc[c2] xc[c1] b1",
    },
    { label: "(ii) an iframe last, no footer (one body entry: the stated extra press)", content: `<button id="b1">B1</button>${frame}`, start: "close", n: 4, presses: 7, tab: "b1 fr[f1] fr[f2] body dlg[button] b1 fr[f1]", shift: "fr[f2] fr[f1] b1 dlg[button] fr[f2] fr[f1] b1" },
  ]);

  // The native move from a closed host into an iframe ends the host's focus with no related target, as a move to the
  // body does; focus is in the frame, so R-04's repair leaves it there.
  const opaquePairRows = cycleRows("Tab cycle with opaque content: a closed shadow root before an iframe (R-04)", [
    {
      label: "between two buttons",
      content: `<button id="b1">B1</button>${closedHost("ocelle-test-closed")}${frame}<button id="b2">B2</button>`,
      start: "close",
      n: 7,
      tab: "b1 xc[c1] xc[c2] fr[f1] fr[f2] b2 dlg[button] b1 xc[c1]",
      shift: "b2 fr[f2] fr[f1] xc[c2] xc[c1] b1 dlg[button] b2 fr[f2]",
    },
  ]);

  const opaqueMoreRows = cycleRows("Tab cycle with opaque content at the end (US1-14, FR-008, R-04)", [
    {
      label: "an audio element with controls last: its two controls reached in both directions",
      content: '<button id="b1">B1</button><audio id="au" controls></audio>',
      start: "close",
      n: 4,
      presses: 7,
      tab: "b1 au au dlg[button] b1 au au",
      shift: "au au b1 dlg[button] au au b1",
    },
    {
      label: "a closed shadow root before a tabindex=1 button: the root last in the navigation order",
      content: `${closedHost("ocelle-test-closed")}<button id="b1" tabindex="1">B1</button>`,
      start: "close",
      n: 4,
      presses: 7,
      tab: "b1 xc[c1] xc[c2] dlg[button] b1 xc[c1] xc[c2]",
      shift: "xc[c2] xc[c1] b1 dlg[button] xc[c2] xc[c1] b1",
    },
  ]);

  const sentinelRows = [
    ...[
      ["a closed shadow root", closedHost("ocelle-test-closed")],
      ["a closed shadow root with delegatesFocus", closedHost("ocelle-test-closed-delegating")],
      ["an iframe", frame],
    ].map(([label, content]) =>
      row(
        `End sentinel (R-04, FR-008): (ii) ${String(label)} last: after every Shift+Tab focus is not on the sentinel, the panel's last child, tabindex=-1, aria-hidden, no text, name or role, zero block size`,
        async (driver) => {
          await driver.mount(page(`<button id="b1">B1</button>${String(content)}`));
          await open(driver);
          await focusClose(driver);
          const ends: string[] = [];
          for (let index = 0; index < 6; index += 1) {
            await driver.inputPress("Tab", { shift: true });
            ends.push(await driver.focusPath());
          }
          const sentinel = await inspect(driver, "dlg", '[part="panel"] > :last-child');
          return {
            onSentinel: ends.filter((each) => each === `dlg[${sentinel.tag}]`),
            sentinel: { last: sentinel.last, attributes: sentinel.attributes, text: sentinel.text, children: sentinel.children, height: sentinel.height },
          };
        },
        { onSentinel: [], sentinel: { last: true, attributes: { class: "sentinel", tabindex: "-1", "aria-hidden": "true" }, text: "", children: 0, height: 0 } },
      ),
    ),
  ];

  const middleRows = cycleRows("Tab cycle: middle moves are native, in the navigation order (R-04)", [
    { label: "a slotted button with tabindex=2 between two plain buttons", content: '<button id="b1">B1</button><button id="b2" tabindex="2">B2</button><button id="b3">B3</button>', start: "close", n: 4, tab: "b2 b1 b3 dlg[button] b2 b1", shift: "b3 b1 b2 dlg[button] b3 b1" },
  ]);

  const positiveRows = cycleRows("Tab cycle: positive tabindex at the ends (US1-15, R-04)", [
    { label: "(i) tabindex=2 on b3, the flat-tree last", content: '<button id="b1">B1</button><button id="b2">B2</button><button id="b3" tabindex="2">B3</button>', start: "close", n: 4, tab: "b3 b1 b2 dlg[button] b3 b1", shift: "b2 b1 b3 dlg[button] b2 b1" },
    {
      label: "(ii) tabindex=2 on b1, the flat-tree first content stop, and on b3",
      content: '<button id="b1" tabindex="2">B1</button><button id="b2">B2</button><button id="b3" tabindex="2">B3</button>',
      start: "close",
      n: 4,
      tab: "b1 b3 b2 dlg[button] b1 b3",
      shift: "b2 b3 b1 dlg[button] b2 b3",
    },
    {
      label: "(iii) case (i) with a footer of two buttons, the first with tabindex=1 (measured in T014)",
      content: '<button id="b1">B1</button><button id="b2">B2</button><button id="b3" tabindex="2">B3</button>',
      footer: '<button id="g1" tabindex="1">G1</button><button id="g2">G2</button>',
      start: "close",
      n: 6,
      tab: "b3 b1 b2 g1 g2 dlg[button] b3 b1",
      shift: "g2 g1 b2 b1 b3 dlg[button] g2 g1",
    },
  ]);

  /** Prose taller than the 40 px scrollers of the rows below, with no stop. */
  const tallProse = (id: string): string => Array.from({ length: 6 }, (_, index) => `<p id="${id}${String(index)}">Line ${String(index + 1)} of prose that overflows its scroller.</p>`).join("");
  const stopRows = cycleRows("Tab cycle: what is a stop, at the cycle's ends (FR-008, R-04)", [
    {
      label: "two radio groups of different names",
      content: '<button id="b1">B1</button><input type="radio" name="g" id="g1" aria-label="G"><input type="radio" name="h" id="h1" aria-label="H">',
      start: "close",
      n: 4,
      tab: "b1 g1 h1 dlg[button] b1 g1",
      shift: "h1 g1 b1 dlg[button] h1 g1",
    },
    {
      label: "radio buttons of one name in two forms",
      content: '<button id="b1">B1</button><form><input type="radio" name="g" id="fa" aria-label="A"></form><form><input type="radio" name="g" id="fz" aria-label="Z"></form>',
      start: "close",
      n: 4,
      tab: "b1 fa fz dlg[button] b1 fa",
      shift: "fz fa b1 dlg[button] fz fa",
    },
    {
      label: "radio buttons of one name, the second in a slotted open shadow root",
      content: '<button id="b1">B1</button><input type="radio" name="g" id="lr" aria-label="Light"><ocelle-test-radio id="tr"></ocelle-test-radio>',
      start: "close",
      n: 4,
      tab: "b1 lr tr[sr] dlg[button] b1 lr",
      shift: "tr[sr] lr b1 dlg[button] tr[sr] lr",
    },
    {
      label: "radio buttons without a name, each a stop",
      content: '<button id="b1">B1</button><input type="radio" id="u1" aria-label="U1"><input type="radio" id="u2" aria-label="U2">',
      start: "close",
      n: 4,
      tab: "b1 u1 u2 dlg[button] b1 u1",
      shift: "u2 u1 b1 dlg[button] u2 u1",
    },
    {
      label: "checkboxes of one name, each a stop",
      content: '<button id="b1">B1</button><input type="checkbox" name="c" id="c1" aria-label="C1"><input type="checkbox" name="c" id="c2" aria-label="C2">',
      start: "close",
      n: 4,
      tab: "b1 c1 c2 dlg[button] b1 c1",
      shift: "c2 c1 b1 dlg[button] c2 c1",
    },
    {
      label: "a radio group last, its checked radio second",
      content: '<button id="b1">B1</button><input type="radio" name="g" id="r1" aria-label="One"><input type="radio" name="g" id="r2" aria-label="Two" checked>',
      start: "close",
      n: 3,
      tab: "b1 r2 dlg[button] b1 r2",
      shift: "r2 b1 dlg[button] r2 b1",
    },
    {
      label: "a radio group alone, its checked radio second",
      content: '<input type="radio" name="g" id="r1" aria-label="One"><input type="radio" name="g" id="r2" aria-label="Two" checked>',
      start: "close",
      n: 2,
      tab: "r2 dlg[button] r2 dlg[button]",
      shift: "r2 dlg[button] r2 dlg[button]",
    },
    {
      label: "positive tabindex against tree order, the body's only stops",
      content: '<button id="p3" tabindex="3">P3</button><button id="p1" tabindex="1">P1</button>',
      start: "close",
      n: 3,
      tab: "p1 p3 dlg[button] p1 p3",
      shift: "p3 p1 dlg[button] p3 p1",
    },
    { label: "an <a> without href last, not a stop", content: '<button id="b1">B1</button><a id="na">No link</a>', start: "close", n: 2, tab: "b1 dlg[button] b1 dlg[button]", shift: "b1 dlg[button] b1 dlg[button]" },
    { label: "an <a> without href with tabindex=-1 last, not a stop", content: '<button id="b1">B1</button><a id="nt" tabindex="-1">Not a stop</a>', start: "close", n: 2, tab: "b1 dlg[button] b1 dlg[button]", shift: "b1 dlg[button] b1 dlg[button]" },
    { label: "a disabled button last, not a stop", content: '<button id="b1">B1</button><button id="d1" disabled>Off</button>', start: "close", n: 2, tab: "b1 dlg[button] b1 dlg[button]", shift: "b1 dlg[button] b1 dlg[button]" },
    { label: "a video without controls last, not a stop", content: '<button id="b1">B1</button><video id="nv"></video>', start: "close", n: 2, tab: "b1 dlg[button] b1 dlg[button]", shift: "b1 dlg[button] b1 dlg[button]" },
    {
      label: "a vertical scroller with no stop inside, last",
      content: `<button id="b1">B1</button><div id="sy">${tallProse("y")}</div>`,
      rules: "#sy { overflow-y: auto; block-size: 40px; }",
      start: "close",
      n: 3,
      tab: "b1 sy dlg[button] b1 sy",
      shift: "sy b1 dlg[button] sy b1",
    },
    {
      label: "a vertical scroller holding prose and a MathML formula, last",
      content: `<button id="b1">B1</button><div id="sm">${tallProse("m")}<math><mi>x</mi><mo>=</mo><mn>1</mn></math></div>`,
      rules: "#sm { overflow-y: auto; block-size: 40px; }",
      start: "close",
      n: 3,
      tab: "b1 sm dlg[button] b1 sm",
      shift: "sm b1 dlg[button] sm b1",
    },
    { label: "a block with overflow: auto that does not overflow, last, not a stop", content: '<button id="b1">B1</button><div id="nx">Short.</div>', rules: "#nx { overflow: auto; }", start: "close", n: 2, tab: "b1 dlg[button] b1 dlg[button]", shift: "b1 dlg[button] b1 dlg[button]" },
    {
      label: "a scroller holding a radio button, last: the radio is the stop, not the scroller",
      content: `<button id="b1">B1</button><div id="sq"><input type="radio" name="g" id="q1" aria-label="Q">${tallProse("q")}</div>`,
      rules: "#sq { overflow-y: auto; block-size: 40px; }",
      start: "close",
      n: 3,
      tab: "b1 q1 dlg[button] b1 q1",
      shift: "q1 b1 dlg[button] q1 b1",
    },
    {
      label: "nested scrollers, last: the inner one is the stop, not the outer",
      content: `<button id="b1">B1</button><div id="so"><div id="si">${tallProse("i")}</div>${tallProse("o")}</div>`,
      rules: "#so { overflow-y: auto; block-size: 80px; } #si { overflow-y: auto; block-size: 40px; }",
      start: "close",
      n: 3,
      tab: "b1 si dlg[button] b1 si",
      shift: "si b1 dlg[button] si b1",
    },
    {
      label: "a slot's fallback button in a slotted open shadow root, last",
      content: '<button id="b1">B1</button><ocelle-test-fallback id="fh"></ocelle-test-fallback>',
      start: "close",
      n: 3,
      tab: "b1 fh[fb] dlg[button] b1 fh[fb]",
      shift: "fh[fb] b1 dlg[button] fh[fb] b1",
    },
  ]);

  const moreStopRows = cycleRows("Tab cycle: what is a stop, at the cycle's ends, continued (FR-008, R-04)", [
    { label: "a display: none button last, not a stop", content: '<button id="b1">B1</button><button id="h1">Hidden</button>', rules: "#h1 { display: none; }", start: "close", n: 2, tab: "b1 dlg[button] b1 dlg[button]", shift: "b1 dlg[button] b1 dlg[button]" },
    { label: "a visibility: hidden button last, not a stop", content: '<button id="b1">B1</button><button id="h1">Hidden</button>', rules: "#h1 { visibility: hidden; }", start: "close", n: 2, tab: "b1 dlg[button] b1 dlg[button]", shift: "b1 dlg[button] b1 dlg[button]" },
    { label: "an <a> with href last, a stop", content: '<button id="b1">B1</button><a id="lk" href="#lk">Link</a>', start: "close", n: 3, tab: "b1 lk dlg[button] b1 lk", shift: "lk b1 dlg[button] lk b1" },
    { label: "an inert block holding a button last, not a stop", content: '<button id="b1">B1</button><div inert><button id="ib">In</button></div>', start: "close", n: 2, tab: "b1 dlg[button] b1 dlg[button]", shift: "b1 dlg[button] b1 dlg[button]" },
    { label: "a button with an attribute named controls last, an ordinary stop", content: '<button id="b1">B1</button><button id="bc" controls>C</button>', start: "close", n: 3, tab: "b1 bc dlg[button] b1 bc", shift: "bc b1 dlg[button] bc b1" },
    {
      label: "a scroller with tabindex=-1 last, not a stop",
      content: `<button id="b1">B1</button><div id="st" tabindex="-1">${tallProse("t")}</div>`,
      rules: "#st { overflow-y: auto; block-size: 40px; }",
      start: "close",
      n: 2,
      tab: "b1 dlg[button] b1 dlg[button]",
      shift: "b1 dlg[button] b1 dlg[button]",
    },
    { label: "a scroller with overflow-y: scroll last, a stop", content: `<button id="b1">B1</button><div id="sc">${tallProse("c")}</div>`, rules: "#sc { overflow-y: scroll; block-size: 40px; }", start: "close", n: 3, tab: "b1 sc dlg[button] b1 sc", shift: "sc b1 dlg[button] sc b1" },
    { label: "an overflowing block with overflow: hidden last, not a stop", content: `<button id="b1">B1</button><div id="oh">${tallProse("h")}</div>`, rules: "#oh { overflow: hidden; block-size: 40px; }", start: "close", n: 2, tab: "b1 dlg[button] b1 dlg[button]", shift: "b1 dlg[button] b1 dlg[button]" },
    {
      label: "a scroller holding only an inert button, last: the scroller is the stop",
      content: `<button id="b1">B1</button><div id="sv"><div inert><button id="ib">In</button></div>${tallProse("v")}</div>`,
      rules: "#sv { overflow-y: auto; block-size: 40px; }",
      start: "close",
      n: 3,
      tab: "b1 sv dlg[button] b1 sv",
      shift: "sv b1 dlg[button] sv b1",
    },
    {
      label: "positive tabindex inside a plain block, which is no navigation scope",
      content: '<button id="b1">B1</button><div><button id="b2" tabindex="1">B2</button></div>',
      start: "close",
      n: 3,
      tab: "b2 b1 dlg[button] b2 b1",
      shift: "b1 b2 dlg[button] b1 b2",
    },
    {
      label: "positive tabindex in a slotted open shadow root, its own navigation scope, after a tabindex=2 button",
      content: '<ocelle-test-positive id="sp"></ocelle-test-positive><button id="b1" tabindex="2">B1</button>',
      start: "close",
      n: 3,
      tab: "b1 sp[s1] dlg[button] b1 sp[s1]",
      shift: "sp[s1] b1 dlg[button] sp[s1] b1",
    },
  ]);

  const shadowNonStopRows = cycleRows("Tab cycle from a non-stop (R-04)", [
    {
      label: "a tabindex=-1 element in a slotted open shadow root, before the slot's fallback button, focused by script",
      content: '<button id="b1">B1</button><ocelle-test-fallback id="fh"></ocelle-test-fallback><button id="b2">B2</button>',
      start: { op: "focus", id: "fh", inner: "#t" },
      at: "fh[t]",
      n: 4,
      tab: "fh[fb] b2 dlg[button] b1 fh[fb] b2",
      shift: "b1 dlg[button] b2 fh[fb] b1 dlg[button]",
    },
  ]);

  // Escape ----------------------------------------------------------------------------------------------------------

  /** Watches `cancel` and `close` on the dialog's inner `<dialog>`; `log` returns what they recorded. */
  const watchPanel = (driver: Driver): Promise<unknown> => act(driver, { op: "watch", id: "dlg", inner: "dialog", events: ["cancel", "close"] });

  const iframeEscapeRows = ([false, true] as const).map((veto) =>
    row(
      `Escape in a slotted iframe, ${veto ? "veto" : "no veto"}: nothing is requested, no cancel, the dialog stays open and :modal (US1-14, FR-010)`,
      async (driver) => {
        await driver.mount(page(`<button id="b1">B1</button>${frame}`));
        await open(driver);
        await watchPanel(driver);
        if (veto) await act(driver, { op: "veto", id: "dlg", event: requestName });
        await driver.inputPress("Tab");
        const at = await driver.focusPath();
        await driver.inputPress("Escape");
        return { at, recorded: await after(driver), log: await act(driver, { op: "log" }), state: await state(driver), focus: await driver.focusPath() };
      },
      { at: "fr[f1]", recorded: [], log: [], state: shown, focus: "fr[f1]" },
    ),
  );

  const prose = '<button id="b1">B1</button><p id="prose">Some prose to click on.</p><button id="gone">B2</button>';
  interface EscapeContext {
    readonly label: string;
    readonly start: (driver: Driver) => Promise<unknown>;
    readonly at: string;
  }
  const escapeContexts: EscapeContext[] = [
    { label: "focus on the first stop", start: () => Promise.resolve(), at: "b1" },
    { label: "after a click on body prose (focus on the <dialog>)", start: (driver) => click(driver, "prose"), at: "dlg[dialog]" },
    {
      label: "after that click and a Shift+Tab",
      start: async (driver) => {
        await click(driver, "prose");
        await driver.inputPress("Tab", { shift: true });
      },
      at: "gone",
    },
    { label: "after the host removed a focused slotted button (focus on the body)", start: (driver) => act(driver, { op: "seq", ops: [{ op: "focus", id: "gone" }, { op: "remove", id: "gone" }] }), at: "body" },
  ];
  const escapeRows = escapeContexts.flatMap(({ label, start, at }) => [
    row(
      `Escape, no veto, ${label}: one request with reason escape, then the close with escape and focus on the opener (US1-3)`,
      async (driver) => {
        await driver.mount(page(prose));
        await open(driver);
        await watchPanel(driver);
        await start(driver);
        const focused = await driver.focusPath();
        await driver.inputPress("Escape");
        return { focused, recorded: await events(driver, 2), log: await logAfter(driver), state: await state(driver), focus: await driver.focusPath() };
      },
      { focused: at, recorded: [request("escape", at), closeEvent("escape", "opener")], log: ["close:false"], state: gone, focus: "opener" },
    ),
    row(
      `Escape, veto, ${label}: one request, the dialog stays open and :modal, focus stays (US1-4)`,
      async (driver) => {
        await driver.mount(page(prose));
        await open(driver);
        await watchPanel(driver);
        await act(driver, { op: "veto", id: "dlg", event: requestName });
        await start(driver);
        await driver.inputPress("Escape");
        return { recorded: await after(driver), log: await act(driver, { op: "log" }), state: await state(driver), focus: await driver.focusPath() };
      },
      { recorded: [request("escape", at)], log: [], state: shown, focus: at },
    ),
    row(
      `Escape, veto, then Escape twice, ${label}: one request per press, never a cancel:false close, open with focus where it was (US1-4, R-02)`,
      async (driver) => {
        await driver.mount(page(prose));
        await open(driver);
        await watchPanel(driver);
        await act(driver, { op: "veto", id: "dlg", event: requestName });
        await start(driver);
        await presses(driver, 3, false, "Escape");
        return { recorded: await after(driver), log: await act(driver, { op: "log" }), state: await state(driver), focus: await driver.focusPath() };
      },
      { recorded: [request("escape", at), request("escape", at), request("escape", at)], log: [], state: shown, focus: at },
    ),
  ]);

  const slottedEscapeRows = [
    row(
      "Escape with slotted content: a focused control that stops Escape's propagation, no veto: closes with escape (R-02)",
      async (driver) => {
        await driver.mount(page('<button id="stopper">Stops Escape</button>'));
        await open(driver);
        await act(driver, { op: "escape", id: "stopper", mode: "stop" });
        await driver.inputPress("Escape");
        return { recorded: await events(driver, 2), state: await state(driver) };
      },
      { recorded: [request("escape", "stopper"), closeEvent("escape", "opener")], state: gone },
    ),
    row(
      "Escape with slotted content: a slotted control that calls preventDefault() on Escape: no request, the dialog stays open (FR-010)",
      async (driver) => {
        await driver.mount(page('<button id="preventer">Prevents Escape</button>'));
        await open(driver);
        await act(driver, { op: "escape", id: "preventer", mode: "prevent" });
        await driver.inputPress("Escape");
        return { recorded: await after(driver), state: await state(driver), focus: await driver.focusPath() };
      },
      { recorded: [], state: shown, focus: "preventer" },
    ),
    row(
      "Escape with slotted content: a slotted search field with a value: Escape clears it, no request, open (FR-010)",
      async (driver) => {
        await driver.mount(page('<input type="search" id="find" aria-label="Find" value="abc">'));
        await open(driver);
        await driver.inputPress("Escape");
        const field = await inspect(driver, "find");
        return { value: field.value, recorded: await after(driver), state: await state(driver), focus: await driver.focusPath() };
      },
      { value: "", recorded: [], state: shown, focus: "find" },
    ),
    row(
      "Escape with slotted content: an Escape keydown with isComposing: no request (FR-010)",
      async (driver) => {
        await driver.mount(page('<input type="text" id="ime" aria-label="Name">'));
        await open(driver);
        const passed = await act(driver, { op: "key", key: "Escape", isComposing: true });
        return { passed, recorded: await after(driver), state: await state(driver) };
      },
      { passed: true, recorded: [], state: shown },
    ),
  ];

  interface Watcher {
    readonly label: string;
    readonly content: string;
    readonly openIt: (driver: Driver) => Promise<unknown>;
    readonly focusAt: string;
    readonly watcher: string;
  }
  const menu = (popover: string): string => `<button id="inv" popovertarget="menu">Menu</button><div id="menu" popover="${popover}"><button id="m1">Item</button></div>`;
  const watchers: Watcher[] = (["auto", "hint"] as const).flatMap((popover) => [
    { label: `a slotted popover="${popover}" menu, focus on its invoker`, content: menu(popover), openIt: (driver: Driver) => click(driver, "inv"), focusAt: "inv", watcher: "menu" },
    {
      label: `a slotted popover="${popover}" menu, focus on a button inside it`,
      content: menu(popover),
      openIt: async (driver: Driver) => {
        await click(driver, "inv");
        await act(driver, { op: "focus", id: "m1" });
      },
      focusAt: "m1",
      watcher: "menu",
    },
  ]);
  const closeWatcherRows = watchers.flatMap(({ label, content, openIt, focusAt, watcher }) =>
    ([false, true] as const).map((veto) =>
      row(
        `Slotted close watchers (US1-13, R-02): ${label}, ${veto ? "veto" : "no veto"}: the first Escape closes it alone with no request and no cancel, the dialog stays open and :modal; the second requests with escape`,
        async (driver) => {
          await driver.mount(page(content));
          await open(driver);
          await watchPanel(driver);
          if (veto) await act(driver, { op: "veto", id: "dlg", event: requestName });
          await openIt(driver);
          const before = { focus: await driver.focusPath(), open: (await inspect(driver, watcher)).popoverOpen };
          await driver.inputPress("Escape");
          const first = { recorded: await after(driver), log: await act(driver, { op: "log" }), watcherOpen: (await inspect(driver, watcher)).popoverOpen, state: await state(driver) };
          const focus = await driver.focusPath();
          await driver.inputPress("Escape");
          const second = veto ? { recorded: await after(driver), state: await state(driver), focus: await driver.focusPath() } : { recorded: await events(driver, 2), state: await state(driver) };
          return { before, first, focus, second };
        },
        {
          before: { focus: focusAt, open: true },
          first: { recorded: [], log: [], watcherOpen: false, state: shown },
          focus: "inv",
          second: veto ? { recorded: [request("escape", "inv")], state: shown, focus: "inv" } : { recorded: [request("escape", "inv"), closeEvent("escape", "opener")], state: gone },
        },
      ),
    ),
  );

  const nestedModal = '<button id="sm">Show</button><dialog id="nd"><button id="n1">N1</button><button id="n2">N2</button></dialog>';
  const nativeModalRows = [
    ...([false, true] as const).map((shift) =>
      row(
        `Slotted close watchers: a slotted native modal <dialog> shown above the dialog: ${shift ? "Shift+Tab" : "Tab"} × 4 from n1 gives the platform's list, measured in Chromium 153 (US1-13, FR-010, operator decision 2026-11-14)`,
        async (driver) => {
          await driver.mount(page(nestedModal));
          await open(driver);
          await act(driver, { op: "call", id: "nd", method: "showModal" });
          const at = await driver.focusPath();
          const path = await presses(driver, 4, shift);
          return { at, path, layer: await driver.topLayer() };
        },
        // The body entries are the platform's past the nested modal's ends: no entry is page content or one of the
        // overlay's own stops, and neither the repair nor the body path acts on them while the nested modal is open,
        // which stays above the dialog, still open and :modal beneath it.
        {
          at: "n1",
          path: shift ? "body n2 n1 body" : "n2 body n1 n2",
          layer: [
            { element: "dlg[dialog]", modal: true, popoverOpen: false },
            { element: "nd", modal: true, popoverOpen: false },
          ],
        },
      ),
    ),
    row(
      "Slotted close watchers: a slotted native modal <dialog>: Escape closes it alone with no request and no cancel on the dialog; a further Escape requests with escape (US1-13)",
      async (driver) => {
        await driver.mount(page(nestedModal));
        await open(driver);
        await watchPanel(driver);
        await act(driver, { op: "call", id: "nd", method: "showModal" });
        await driver.inputPress("Escape");
        const first = { recorded: await after(driver), log: await act(driver, { op: "log" }), nested: (await inspect(driver, "nd")).open, state: await state(driver) };
        const focus = await driver.focusPath();
        await driver.inputPress("Escape");
        return { first, focus, recorded: await events(driver, 2), state: await state(driver) };
      },
      { first: { recorded: [], log: [], nested: false, state: shown }, focus: "sm", recorded: [request("escape", "sm"), closeEvent("escape", "opener")], state: gone },
    ),
  ];

  // Slotted non-modal dialogs (US1-16, R-02) --------------------------------------------------------------------------

  const nonModal = (attributes: string): string => `<button id="sib">Sibling</button><dialog id="nm"${attributes}><button id="nb">Inner</button></dialog>`;
  interface NonModal {
    readonly label: string;
    readonly markup: string;
    /** Opens the slotted dialog before the overlay opens (after the mount). */
    readonly before?: Act;
    /** Opens (or reopens) the slotted dialog after the overlay opened. */
    readonly afterOpen?: Act;
    /**
     * Where focus is once the platform closed the slotted dialog alone: back on the element focused when `show()` opened
     * it (the sibling), or on the body when the `open` attribute opened it (the engine's dialog focusing steps).
     */
    readonly focusAfter?: string;
  }
  const closedbys = [
    ["absent", ""],
    ["auto", ' closedby="auto"'],
    ["none", ' closedby="none"'],
    ["closerequest", ' closedby="closerequest"'],
    ["any", ' closedby="any"'],
  ] as const;
  const openBefore: NonModal[] = [
    ...closedbys.map(([label, attribute]) => ({ label: `open before the overlay in the parsed markup, closedby ${label}`, markup: nonModal(`${attribute} open`) })),
    { label: 'opened with show() before the overlay opens, closedby="any"', markup: nonModal(' closedby="any"'), before: { op: "call", id: "nm", method: "show" } },
  ];
  const openedAfterAbsorbed: NonModal[] = closedbys.slice(0, 3).flatMap(([label, attribute]) => [
    { label: `opened after the overlay with show(), closedby ${label}`, markup: nonModal(attribute), afterOpen: { op: "call", id: "nm", method: "show" } },
    { label: `opened after the overlay with the open attribute, closedby ${label}`, markup: nonModal(attribute), afterOpen: { op: "attr", id: "nm", name: "open", value: "" } },
  ]);
  const openedAfterAbove: NonModal[] = closedbys.slice(3).flatMap(([label, attribute]) => [
    { label: `opened after the overlay with show(), closedby ${label}`, markup: nonModal(attribute), afterOpen: { op: "call", id: "nm", method: "show" } as Act, focusAfter: "sib" },
    { label: `opened after the overlay with the open attribute, closedby ${label}`, markup: nonModal(attribute), afterOpen: { op: "attr", id: "nm", name: "open", value: "" } as Act },
  ]);
  const reopenedAfter: NonModal = {
    label: 're-opened after the overlay: a parsed <dialog open closedby="any"> closed with close() and opened again with the open attribute',
    markup: nonModal(' closedby="any" open'),
    afterOpen: { op: "seq", ops: [{ op: "call", id: "nm", method: "close" }, { op: "attr", id: "nm", name: "open", value: "" }] },
  };
  const reopenedByAttribute: NonModal = {
    label: 're-opened by the attribute alone: a parsed <dialog open closedby="any"> whose open attribute is removed and set again (the stated limit)',
    markup: nonModal(' closedby="any" open'),
    afterOpen: { op: "seq", ops: [{ op: "attr", id: "nm", name: "open", value: null }, { op: "attr", id: "nm", name: "open", value: "" }] },
  };

  async function openNonModal(driver: Driver, setup: NonModal): Promise<void> {
    await driver.mount(page(setup.markup));
    if (setup.before !== undefined) await act(driver, setup.before);
    await open(driver, "dlg", true);
    await watchPanel(driver);
    if (setup.afterOpen !== undefined) await act(driver, setup.afterOpen);
  }

  /** Ordinary content: every Escape requests with escape, no cancel, the slotted dialog stays open. */
  const ordinaryRows = [...openBefore, ...openedAfterAbsorbed, reopenedByAttribute].flatMap((setup) =>
    (["nb", "sib"] as const).flatMap((focusAt) => [
      row(
        `Slotted non-modal dialogs (US1-16, R-02): ${setup.label}, focus on ${focusAt === "nb" ? "its button" : "a sibling button"}, no veto: one request with escape and no cancel, the overlay closes, the slotted dialog stays open`,
        async (driver) => {
          await openNonModal(driver, setup);
          await act(driver, { op: "focus", id: focusAt });
          await driver.inputPress("Escape");
          return { recorded: await events(driver, 2), log: await logAfter(driver), slotted: (await inspect(driver, "nm")).open, state: await state(driver) };
        },
        { recorded: [request("escape", focusAt), closeEvent("escape", "opener")], log: ["close:false"], slotted: true, state: gone },
      ),
      row(
        `Slotted non-modal dialogs (US1-16, R-02): ${setup.label}, focus on ${focusAt === "nb" ? "its button" : "a sibling button"}, veto then Escape twice: one request per press, no cancel, both stay open, focus inside`,
        async (driver) => {
          await openNonModal(driver, setup);
          await act(driver, { op: "veto", id: "dlg", event: requestName });
          await act(driver, { op: "focus", id: focusAt });
          await presses(driver, 3, false, "Escape");
          return { recorded: await after(driver), log: await act(driver, { op: "log" }), slotted: (await inspect(driver, "nm")).open, state: await state(driver), focus: await driver.focusPath() };
        },
        { recorded: [request("escape", focusAt), request("escape", focusAt), request("escape", focusAt)], log: [], slotted: true, state: shown, focus: focusAt },
      ),
    ]),
  );

  /** Above the overlay: the first Escape closes the slotted dialog alone, the second requests the overlay's close. */
  const aboveRows = [...openedAfterAbove, reopenedAfter].flatMap((setup) =>
    ([false, true] as const).map((veto) =>
      row(
        `Slotted non-modal dialogs (US1-16, R-02): ${setup.label}, focus inside, ${veto ? "veto" : "no veto"}: the first Escape closes it alone with no request and no cancel; the second requests with escape`,
        async (driver) => {
          await openNonModal(driver, setup);
          if (veto) await act(driver, { op: "veto", id: "dlg", event: requestName });
          await act(driver, { op: "focus", id: "nb" });
          await driver.inputPress("Escape");
          const first = { recorded: await after(driver), log: await act(driver, { op: "log" }), slotted: (await inspect(driver, "nm")).open, state: await state(driver) };
          const focus = await driver.focusPath();
          await driver.inputPress("Escape");
          const second = veto ? { recorded: await after(driver), state: await state(driver) } : { recorded: await events(driver, 2), state: await state(driver) };
          return { first, focus, second };
        },
        {
          first: { recorded: [], log: [], slotted: false, state: shown },
          focus: setup.focusAfter ?? "body",
          second: veto ? { recorded: [request("escape", setup.focusAfter ?? "body")], state: shown } : { recorded: [request("escape", setup.focusAfter ?? "body"), closeEvent("escape", "opener")], state: gone },
        },
      ),
    ),
  );

  /** Every non-modal case: the slotted dialog's button is an ordinary stop. */
  const nonModalTabRows = [...openBefore, ...openedAfterAbsorbed, ...openedAfterAbove, reopenedAfter, reopenedByAttribute].flatMap((setup) =>
    ([false, true] as const).map((shift) =>
      row(
        `Slotted non-modal dialogs: ${setup.label}: ${shift ? "Shift+Tab" : "Tab"} × 5 from the close control, its button an ordinary stop, no body (US1-16)`,
        async (driver) => {
          await openNonModal(driver, setup);
          await focusClose(driver);
          return { path: await presses(driver, 5, shift) };
        },
        { path: shift ? "nb sib dlg[button] nb sib" : "sib nb dlg[button] sib nb" },
      ),
    ),
  );

  // Cancel, the close control, the backdrop, host and platform closes ------------------------------------------------

  const cancelRows = [
    row(
      `Synthetic cancel: a dispatched non-cancelable cancel, then the inner close(): ${closeName} with reason host, no request (R-03)`,
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        const dispatched = await act(driver, { op: "dispatch", id: "dlg", inner: "dialog", type: "cancel", cancelable: false });
        const between = await after(driver);
        await act(driver, { op: "call", id: "dlg", inner: "dialog", method: "close" });
        return { dispatched, between, recorded: await events(driver, 1), state: await state(driver), focus: await driver.focusPath() };
      },
      { dispatched: true, between: [], recorded: [closeEvent("host", "opener")], state: gone, focus: "opener" },
    ),
    row(
      "Synthetic cancel: a dispatched cancelable cancel is prevented and runs the request path once, reason escape (R-02)",
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        const dispatched = await act(driver, { op: "dispatch", id: "dlg", inner: "dialog", type: "cancel", cancelable: true });
        return { dispatched, recorded: await events(driver, 2), state: await state(driver) };
      },
      { dispatched: false, recorded: [request("escape", "b1"), closeEvent("escape", "opener")], state: gone },
    ),
  ];

  const closeControlRows = [
    { label: "a click", activate: (driver: Driver) => click(driver, "dlg", close), at: "dlg[button]" },
    {
      label: "Enter",
      activate: async (driver: Driver) => {
        await focusClose(driver);
        await driver.inputPress("Enter");
      },
      at: "dlg[button]",
    },
    {
      label: "Space",
      activate: async (driver: Driver) => {
        await focusClose(driver);
        await driver.inputPress(" ");
      },
      at: "dlg[button]",
    },
  ].flatMap(({ label, activate, at }) => [
    row(
      `Close control by ${label}, no veto: the request and the close carry reason close-button, focus back on the opener (US1-5, FR-011)`,
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        await activate(driver);
        return { recorded: await events(driver, 2), state: await state(driver), focus: await driver.focusPath() };
      },
      { recorded: [request("close-button", at), closeEvent("close-button", "opener")], state: gone, focus: "opener" },
    ),
    row(
      `Close control by ${label}, veto: one request with close-button, the dialog stays open with focus inside (US1-4)`,
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        await act(driver, { op: "veto", id: "dlg", event: requestName });
        await activate(driver);
        return { recorded: await after(driver), state: await state(driver), focus: await driver.focusPath() };
      },
      { recorded: [request("close-button", at)], state: shown, focus: at },
    ),
  ]);

  const closeControlLooks = [
    row(
      "Close control: a native button named by close-label holding the close icon, at least --ocelle-target-min in both axes, the token focus ring when focused by keyboard (FR-006)",
      async (driver) => {
        await driver.mount(page(basic, { attrs: ' close-label="Schließen"' }));
        await open(driver);
        await driver.inputPress("Tab", { shift: true });
        // The box is read once the entry has ended: during the drawer's slide (FR-028) the translated box of the
        // 44 px control read 43.99998 px wide at some frames.
        await kind.settle?.(driver);
        const control = await inspect(driver, "dlg", close, ["outline-style", "outline-width", "outline-color", "outline-offset"]);
        const icon = await inspect(driver, "dlg", `${close} > ocelle-icon`);
        return {
          focused: await driver.focusPath(),
          visible: await driver.focusVisible("dlg", close),
          tag: control.tag,
          label: control.attributes["aria-label"],
          icon: icon.attributes.name,
          size: { inline: control.width >= targetMin, block: control.height >= targetMin },
          ring: control.styles,
        };
      },
      {
        focused: "dlg[button]",
        visible: true,
        tag: "button",
        label: "Schließen",
        icon: "close",
        size: { inline: true, block: true },
        ring: { "outline-style": "solid", "outline-width": "3px", "outline-color": focusLight, "outline-offset": "2px" },
      },
    ),
  ];

  const backdropRows = [
    row(
      "Backdrop click: nothing is dispatched and the dialog stays open (US1-6, FR-012)",
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        await driver.pointer([{ x: 8, y: 8, down: true, up: true }]);
        return { recorded: await after(driver), state: await state(driver), focus: await driver.focusPath() };
      },
      { recorded: [], state: shown, focus: "dlg[dialog]" },
    ),
  ];

  const hostRows = [
    row(
      `Host close (open = false): no request, ${closeName} with reason host, focus back on the opener (US1-7)`,
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        await driver.setAttribute("dlg", "open", null);
        return { recorded: await events(driver, 1), state: await state(driver), focus: await driver.focusPath() };
      },
      { recorded: [closeEvent("host", "opener")], state: gone, focus: "opener" },
    ),
    row(
      "Platform close: the inner close() through the shadow root: reason host, open false, focus returned (FR-016, R-03)",
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        await act(driver, { op: "call", id: "dlg", inner: "dialog", method: "close" });
        return { recorded: await events(driver, 1), state: await state(driver), focus: await driver.focusPath() };
      },
      { recorded: [closeEvent("host", "opener")], state: gone, focus: "opener" },
    ),
    row(
      'Platform close: a slotted <form method="dialog"> submitted: nothing happens, open stays true, no event (FR-016, R-03)',
      async (driver) => {
        await driver.mount(page('<form method="dialog" id="frm"><button id="sub">Submit</button></form>'));
        await open(driver);
        await click(driver, "sub");
        return { recorded: await after(driver), state: await state(driver), focus: await driver.focusPath() };
      },
      { recorded: [], state: shown, focus: "sub" },
    ),
  ];

  // Focus return (FR-009, R-05) --------------------------------------------------------------------------------------

  const returnRows = [
    {
      label: "an opener inside a shadow root: focus returns to the inner button",
      before: '<ocelle-test-opener id="op"></ocelle-test-opener>',
      opener: async (driver: Driver) => act(driver, { op: "focus", id: "op", inner: "#in" }),
      change: undefined,
      focus: "op[in]",
    },
    { label: "an opener removed before the close: the body, nothing thrown", before: "", opener: (driver: Driver) => driver.inputClick("opener"), change: { op: "remove", id: "opener" } as Act, focus: "body" },
    { label: "an opener disabled before the close: the body, nothing thrown", before: "", opener: (driver: Driver) => driver.inputClick("opener"), change: { op: "attr", id: "opener", name: "disabled", value: "" } as Act, focus: "body" },
    { label: "an opener made inert: the body", before: "", opener: (driver: Driver) => driver.inputClick("opener"), change: { op: "attr", id: "opener", name: "inert", value: "" } as Act, focus: "body" },
    { label: "opened with focus on the body: the body", before: "", opener: (driver: Driver) => act(driver, { op: "blur" }), change: undefined, focus: "body" },
    {
      label: "an opener that is a custom element's inner button, removed while its host stays: the body",
      before: '<ocelle-test-opener id="op"></ocelle-test-opener>',
      opener: async (driver: Driver) => act(driver, { op: "focus", id: "op", inner: "#in" }),
      change: { op: "remove", id: "op", inner: "#in" } as Act,
      focus: "body",
    },
  ].map(({ label, before, opener, change, focus }) =>
    row(
      `Focus return: ${label} (FR-009, R-05)`,
      async (driver) => {
        await driver.mount(page(basic, { before }));
        await opener(driver);
        await driver.setAttribute("dlg", "open", "");
        await driver.record("dlg", both);
        if (change !== undefined) await act(driver, change);
        await driver.inputPress("Escape");
        return { recorded: await events(driver, 2), focus: await driver.focusPath(), messages: await driver.messages() };
      },
      { recorded: [request("escape", "b1"), closeEvent("escape", focus)], focus, messages: [] },
    ),
  );

  const twoDialogs = `<button id="opener">Open</button><button id="other">Other</button><${kind.tag} id="dlg" label="A"><button id="a1">A1</button></${kind.tag}><${kind.tag} id="dlgb" label="B"><button id="bb1">B1</button></${kind.tag}><ocelle-test-act id="act"></ocelle-test-act>`;
  const conditionalRows = [
    row(
      "Focus return is conditional (a): close A and open B in one task: focus stays in B when A's exit ends; closing B returns focus to the page control that opened A (FR-009, R-05)",
      async (driver) => {
        await driver.mount(twoDialogs);
        await open(driver);
        await driver.record("dlgb", both);
        await act(driver, { op: "seq", ops: [{ op: "set", id: "dlg", name: "open", value: false }, { op: "set", id: "dlgb", name: "open", value: true }] });
        const recorded = await events(driver, 1);
        await pause(50);
        const inB = await driver.focusPath();
        await driver.inputPress("Escape");
        const all = await events(driver, 3);
        return { aClosed: recorded[0], inB, last: all[2], focus: await driver.focusPath() };
      },
      { aClosed: closeEvent("host", "bb1"), inB: "bb1", last: closeEvent("escape", "opener"), focus: "opener" },
    ),
    row(
      "Focus return is conditional (b): open = false and a focus move to another page control in the …-close listener: focus stays on that control, after the event and the next frame (R-05)",
      async (driver) => {
        await driver.mount(twoDialogs);
        await open(driver);
        await act(driver, { op: "on", id: "dlg", event: closeName, then: [{ op: "focus", id: "other" }] });
        await driver.setAttribute("dlg", "open", null);
        const recorded = await events(driver, 1);
        const atEvent = await driver.focusPath();
        await pause(50);
        return { recorded, atEvent, later: await driver.focusPath() };
      },
      { recorded: [closeEvent("host", "opener")], atEvent: "other", later: "other" },
    ),
    row(
      "Focus return is conditional (c): open = false, then focus() on another page control during the exit: focus does not move (the page is inert) and lands on the opener when the exit ends (R-05)",
      async (driver) => {
        await driver.mount(twoDialogs);
        await open(driver);
        await driver.setAttribute("dlg", "open", null);
        await act(driver, { op: "focus", id: "other" });
        const during = await driver.focusPath();
        const recorded = await events(driver, 1);
        return { during, recorded, focus: await driver.focusPath() };
      },
      { during: "a1", recorded: [closeEvent("host", "opener")], focus: "opener" },
    ),
  ];

  // Nested, first render, removal, moves, toggles, exit input, stale close events -------------------------------------

  const nested = `<button id="opener">Open</button><${kind.tag} id="dlg" label="Outer"><button id="oi">Open inner</button><${kind.tag} id="inner" label="Inner"><button id="i1">I1</button><button id="i2">I2</button></${kind.tag}><button id="ob">Outer button</button></${kind.tag}><ocelle-test-act id="act"></ocelle-test-act>`;
  /** Opens the outer dialog, watches its own events (those targeted at it, not the inner's that bubble through it), then opens the inner one from `oi` and records the inner's events. */
  async function openNested(driver: Driver): Promise<void> {
    await driver.mount(nested);
    await driver.inputClick("opener");
    await driver.setAttribute("dlg", "open", "");
    await act(driver, { op: "watch", id: "dlg", events: both });
    await click(driver, "oi");
    await driver.setAttribute("inner", "open", "");
    await driver.record("inner", both);
  }
  const nestedRows = [
    row(
      `Nested: an inner ${kind.tag} slotted in an open outer one: one Escape gives one request, on the inner; the outer dispatches nothing and stays open and :modal; focus returns to the outer button that opened the inner (FR-023)`,
      async (driver) => {
        await openNested(driver);
        const at = await driver.focusPath();
        await driver.inputPress("Escape");
        const recorded = await events(driver, 2);
        return { at, recorded, outerEvents: await logAfter(driver), outer: { open: (await driver.attribute("dlg", "open")) !== null, modal: (await inspect(driver, "dlg", "dialog")).modal }, focus: await driver.focusPath() };
      },
      { at: "i1", recorded: [request("escape", "i1"), closeEvent("escape", "oi")], outerEvents: [], outer: { open: true, modal: true }, focus: "oi" },
    ),
    ...([false, true] as const).map((shift) =>
      row(
        `Nested: ${shift ? "Shift+Tab" : "Tab"} in the inner dialog never runs the outer's wrap (FR-023)`,
        async (driver) => {
          await openNested(driver);
          return { path: await presses(driver, 5, shift) };
        },
        { path: shift ? "inner[button] i2 i1 inner[button] i2" : "i2 inner[button] i1 i2 inner[button]" },
      ),
    ),
    row(
      "Nested: an inner dialog whose opener (a button of the outer) is removed before its close: focus on the outer dialog's initial target (R-05)",
      async (driver) => {
        await openNested(driver);
        await act(driver, { op: "remove", id: "oi" });
        await driver.inputPress("Escape");
        const recorded = await events(driver, 2);
        return { last: recorded[1], focus: await driver.focusPath() };
      },
      { last: closeEvent("escape", "ob"), focus: "ob" },
    ),
    // An inner overlay whose close is ended by its removal leaves the stack once, and the outer stays on it (008
    // tasks.md T058, landing review L1-01); motion on is the positive half.
    ...([true, false] as const).map((reduced) =>
      row(
        `Stacked: an inner overlay closed ${reduced ? "under reduced motion" : "with motion on"} and removed in the host's continuation, then a second inner one opened over the outer: the outer stays on the stack, Escape with focus on the body closes only the top one (FR-023, R-05a)`,
        async (driver) => {
          if (reduced) await driver.reducedMotion("reduce");
          await driver.mount(
            `<button id="opener">Open</button><${kind.tag} id="dlg" label="Outer"><button id="ob">Outer button</button><${kind.tag} id="in1" label="Inner one"><button id="i1">I1</button></${kind.tag}><${kind.tag} id="in2" label="Inner two"><button id="i2">I2</button></${kind.tag}></${kind.tag}><ocelle-test-act id="act"></ocelle-test-act>`,
          );
          await act(driver, { op: "focus", id: "opener" });
          await driver.setAttribute("dlg", "open", "");
          await act(driver, { op: "watch", id: "dlg", events: both });
          await driver.record("in1", both);
          await driver.record("in2", both);
          await driver.setAttribute("in1", "open", "");
          await act(driver, { op: "seq", ops: [{ op: "set", id: "in1", name: "open", value: false }, { op: "settled", id: "in1", then: [{ op: "remove", id: "in1" }] }] });
          await pause(100);
          await driver.setAttribute("in2", "open", "");
          await act(driver, { op: "blur" });
          await driver.inputPress("Escape");
          await events(driver, 2);
          const recorded = await after(driver);
          const outerEvents = await act(driver, { op: "log" });
          const first = { recorded, outerEvents, outer: { open: (await driver.attribute("dlg", "open")) !== null, modal: (await inspect(driver, "dlg", "dialog")).modal }, layer: await driver.topLayer(), focus: await driver.focusPath() };
          await driver.record("dlg", both);
          await act(driver, { op: "blur" });
          await driver.inputPress("Escape");
          const second = (await events(driver, recorded.length + 1)).slice(recorded.length, recorded.length + 1);
          return { first, second };
        },
        {
          first: { recorded: [request("escape", "body"), closeEvent("escape", "ob")], outerEvents: [], outer: { open: true, modal: true }, layer: [{ element: "dlg[dialog]", modal: true, popoverOpen: false }], focus: "ob" },
          second: [request("escape", "body")],
        },
      ),
    ),
  ];

  const firstRenderRows = [
    { label: "a slotted autofocus button", content: '<button id="b1">B1</button><button id="b2" autofocus>B2</button>', focus: "b2" },
    { label: "only plain slotted buttons", content: basic, focus: "b1" },
    { label: "no focusable content", content: "<p>Nothing to focus.</p>", focus: "dlg[button]" },
  ].map(({ label, content, focus }) =>
    row(
      `Open at first render (a): open in the mounted markup, focus on the body, ${label}: shown modally with FR-007's focus; open = false gives reason host and focus on the body`,
      async (driver) => {
        await driver.mount(`<${kind.tag} id="dlg" label="Open project" open>${content}</${kind.tag}><ocelle-test-act id="act"></ocelle-test-act>`);
        await driver.record("dlg", both);
        const opened = { property: (await inspect(driver, "dlg")).open, state: await state(driver), focus: await driver.focusPath() };
        await driver.setAttribute("dlg", "open", null);
        return { opened, recorded: await events(driver, 1), focus: await driver.focusPath() };
      },
      { opened: { property: true, state: shown, focus }, recorded: [closeEvent("host", "body")], focus: "body" },
    ),
  );

  const removalRows = [
    row(
      "Removed while open: no inert content, no top-layer entry, no backdrop; open false and no event (FR-022)",
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        await act(driver, { op: "remove", id: "dlg" });
        await pause(50);
        const property = (await act(driver, { op: "inspect", id: "dlg" })) as Inspected;
        await click(driver, "after");
        return { property: property.open, layer: await driver.topLayer(), focus: await driver.focusPath(), pageTree: await driver.ax("after"), recorded: await after(driver) };
      },
      { property: false, layer: [], focus: "after", pageTree: [{ role: "button", name: "After" }], recorded: [] },
    ),
    ...(["the same task", "a later task"] as const).map((when) =>
      row(
        `Moved while open, re-inserted in ${when}: open false, the dialog neither :modal nor open, the page not inert, no event; open = true then shows it with initial focus (FR-022, R-05a)`,
        async (driver) => {
          await driver.mount(page(basic));
          await open(driver);
          if (when === "the same task") await act(driver, { op: "seq", ops: [{ op: "remove", id: "dlg" }, { op: "reinsert", id: "dlg" }] });
          else {
            await act(driver, { op: "remove", id: "dlg" });
            await pause(50);
            await act(driver, { op: "reinsert", id: "dlg" });
          }
          await pause(50);
          const panel = await inspect(driver, "dlg", "dialog");
          const moved = { attribute: await driver.attribute("dlg", "open"), modal: panel.modal, open: panel.open, layer: (await driver.topLayer()).length };
          await click(driver, "after");
          const pageFocus = await driver.focusPath();
          const recorded = await after(driver);
          await driver.setAttribute("dlg", "open", "");
          return { moved, pageFocus, recorded, reopened: { state: await state(driver), focus: await driver.focusPath() } };
        },
        { moved: { attribute: null, modal: false, open: false, layer: 0 }, pageFocus: "after", recorded: [], reopened: { state: shown, focus: "b1" } },
      ),
    ),
    // The end of a close with no motion is cancelled by a removal or a reopen in the host's continuation of the
    // update's updateComplete, as the exit animation is (008 tasks.md T058, landing review L1-01); motion on is the
    // positive half.
    ...([true, false] as const).map((reduced) =>
      row(
        `Closing ${reduced ? "under reduced motion" : "with motion on"}, then removed in the host's continuation of updateComplete: no close event, open false, no top-layer entry, the page not inert (FR-022, R-05a, R-06)`,
        async (driver) => {
          if (reduced) await driver.reducedMotion("reduce");
          await driver.mount(page(basic));
          await open(driver);
          await act(driver, { op: "seq", ops: [{ op: "set", id: "dlg", name: "open", value: false }, { op: "settled", id: "dlg", then: [{ op: "remove", id: "dlg" }] }] });
          await pause(100);
          const property = (await inspect(driver, "dlg")).open;
          const layer = await driver.topLayer();
          await click(driver, "after");
          return { property, layer, focus: await driver.focusPath(), recorded: await after(driver) };
        },
        { property: false, layer: [], focus: "after", recorded: [] },
      ),
    ),
    ...([true, false] as const).map((reduced) =>
      row(
        `Closing ${reduced ? "under reduced motion" : "with motion on"}, then reopened in the host's continuation of updateComplete: no close event, the overlay stays shown; one Escape then gives exactly one request and one close (FR-014, R-06)`,
        async (driver) => {
          if (reduced) await driver.reducedMotion("reduce");
          await driver.mount(page(basic));
          await open(driver);
          await act(driver, { op: "seq", ops: [{ op: "set", id: "dlg", name: "open", value: false }, { op: "settled", id: "dlg", then: [{ op: "set", id: "dlg", name: "open", value: true }] }] });
          await pause(100);
          await driver.setAttribute("act", "data-wait", "");
          const reopened = { recorded: await driver.recorded(), state: await state(driver) };
          await driver.inputPress("Escape");
          await events(driver, 2);
          return { reopened, recorded: await after(driver) };
        },
        { reopened: { recorded: [], state: shown }, recorded: [request("escape", "b1"), closeEvent("escape", "opener")] },
      ),
    ),
    // A show that the update could not make because the host was out of the document is made once it is connected
    // again; `open` stays true, as the overlay was never shown (008 tasks.md T059, landing review L1-03). The same task
    // is the positive half.
    ...(
      [
        { label: "Opened, then moved before it is shown, re-inserted in a later task", ops: [[{ op: "set", id: "dlg", name: "open", value: true }, { op: "remove", id: "dlg" }], [{ op: "reinsert", id: "dlg" }]] },
        { label: "Opened while out of the document, re-inserted in a later task", ops: [[{ op: "remove", id: "dlg" }, { op: "set", id: "dlg", name: "open", value: true }], [{ op: "reinsert", id: "dlg" }]] },
        { label: "Opened, then moved before it is shown, re-inserted in the same task", ops: [[{ op: "set", id: "dlg", name: "open", value: true }, { op: "remove", id: "dlg" }, { op: "reinsert", id: "dlg" }]] },
      ] satisfies { readonly label: string; readonly ops: readonly (readonly Act[])[] }[]
    ).map(({ label, ops }) =>
      row(
        `${label}: open true, shown and :modal with initial focus, no event; open = false then gives one close with reason host (FR-004)`,
        async (driver) => {
          await driver.mount(page(basic));
          await act(driver, { op: "focus", id: "opener" });
          await driver.record("dlg", both);
          for (const [index, each] of ops.entries()) {
            if (index > 0) await pause(50);
            await act(driver, { op: "seq", ops: each });
          }
          await pause(100);
          await driver.setAttribute("act", "data-wait", "");
          const moved = { attribute: await driver.attribute("dlg", "open"), state: await state(driver), focus: await driver.focusPath(), recorded: await driver.recorded() };
          await driver.setAttribute("dlg", "open", null);
          // A bounded poll that does not throw, so a show that was never made fails on its observation.
          await eventually(async () => (await driver.recorded()).length > 0);
          return { moved, recorded: await driver.recorded() };
        },
        { moved: { attribute: "", state: shown, focus: "b1", recorded: [] }, recorded: [closeEvent("host", "opener")] },
      ),
    ),
  ];

  const toggleRows = [
    row(
      "Rapid toggle: open true and false in one task: the element ends closed, no event (FR-014)",
      async (driver) => {
        await driver.mount(page(basic));
        await driver.record("dlg", both);
        await driver.inputClick("opener");
        await act(driver, { op: "seq", ops: [{ op: "set", id: "dlg", name: "open", value: true }, { op: "set", id: "dlg", name: "open", value: false }] });
        return { recorded: await after(driver), state: await state(driver), focus: await driver.focusPath() };
      },
      { recorded: [], state: gone, focus: "opener" },
    ),
    row(
      "Rapid toggle: re-open during the exit, motion on: the exit is cancelled, the dialog stays :modal, no close event (R-06)",
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        await driver.inputPress("Escape");
        await driver.setAttribute("dlg", "open", "");
        // Read at once, within the 200 ms exit: the reopen cancelled the exit animation, it does not run to its end.
        const atReopen = (await driver.ownAnimations("dlg", "dialog")).length;
        const recorded = await after(driver);
        const animations = await driver.ownAnimations("dlg", "dialog");
        return { atReopen, recorded, state: await state(driver), running: animations.length };
      },
      { atReopen: 0, recorded: [request("escape", "b1")], state: shown, running: 0 },
    ),
  ];

  // The two close-control clicks are judged only on a run in which the page saw both on the close control, the second
  // during the exit (`duringExit`).
  const exitInputRows = [
    { label: "Escape twice", input: (driver: Driver) => presses(driver, 2, false, "Escape"), at: "b1", clicks: false },
    {
      label: "two close-control clicks",
      // Both clicks at the control's centre in one pointer path, the second at once after the first, with no move
      // between them: a second click of its own, or one after the moves of a path step, came 60 to 100 ms later, when
      // the drawer's slide (FR-028) had moved the control off that point.
      input: async (driver: Driver) => {
        await kind.settle?.(driver);
        const control = await inspect(driver, "dlg", close);
        const centre = { x: control.left + control.width / 2, y: control.top + control.height / 2 };
        await driver.pointer([
          { ...centre, down: true, up: true },
          { ...centre, down: true, up: true, still: true },
        ]);
      },
      at: "dlg[button]",
      clicks: true,
    },
    {
      label: "Enter twice on the close control",
      input: async (driver: Driver) => {
        await focusClose(driver);
        await presses(driver, 2, false, "Enter");
      },
      at: "dlg[button]",
      clicks: false,
    },
  ].map(({ label, input, at, clicks }) => {
    const attempt = async (driver: Driver): Promise<{ readonly clicked: readonly Click[]; readonly observed: Record<string, unknown> }> => {
      await driver.mount(page(basic));
      await open(driver);
      await watchPanel(driver);
      if (clicks) await act(driver, { op: "clicks", id: "dlg", inner: close });
      await input(driver);
      await events(driver, 2);
      const observed = { recorded: await after(driver), log: await act(driver, { op: "log" }), focus: await driver.focusPath() };
      return { clicked: clicks ? ((await act(driver, { op: "clicked" })) as Click[]) : [], observed };
    };
    return row(
      `Input during the exit, motion on: ${label}: exactly one request and one close, no cancel event, focus on the opener (FR-013, FR-014, R-02, R-06)`,
      async (driver) => (clicks ? duringExit(() => attempt(driver)) : (await attempt(driver)).observed),
      { recorded: [request(label === "Escape twice" ? "escape" : "close-button", at), closeEvent(label === "Escape twice" ? "escape" : "close-button", "opener")], log: ["close:false"], focus: "opener" },
    );
  });

  const staleRows = [
    ...([false, true] as const).map((reduced) =>
      row(
        `Stale native close event: the host sets open = true in the …-close listener${reduced ? ", under reduced motion" : ", motion on"}: after the next task and frame shown, :modal, open true, exactly one close (R-03)`,
        async (driver) => {
          if (reduced) await driver.reducedMotion("reduce");
          await driver.mount(page(basic));
          await open(driver);
          await act(driver, { op: "on", id: "dlg", event: closeName, then: [{ op: "set", id: "dlg", name: "open", value: true }] });
          await driver.inputPress("Escape");
          await events(driver, 2);
          await pause(100);
          await driver.setAttribute("act", "data-wait", "");
          return { recorded: (await driver.recorded()).map((each) => each.type), state: await state(driver) };
        },
        { recorded: [requestName, closeName], state: shown },
      ),
    ),
    row(
      "Stale native close event: remove, re-insert and open = true in the same task: after the next task and frame shown, :modal, open true, no close (R-03, R-05a)",
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        await act(driver, { op: "seq", ops: [{ op: "remove", id: "dlg" }, { op: "reinsert", id: "dlg" }, { op: "set", id: "dlg", name: "open", value: true }] });
        await pause(100);
        await driver.setAttribute("act", "data-wait", "");
        return { recorded: await driver.recorded(), state: await state(driver) };
      },
      { recorded: [], state: shown },
    ),
  ];

  // Motion (FR-020, R-06) ---------------------------------------------------------------------------------------------

  const motionRows = [
    row(
      "Motion: entry and exit are opacity animations of the panel with the duration of --ocelle-motion-base and the easing of --ocelle-easing-standard; open is false at once, the close fires after the dialog left the top layer, focus returned first (FR-020, R-06, R-15)",
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        const entry = (await driver.ownAnimations("dlg", "dialog")).map(({ playState, ...rest }) => ({ ...rest, running: playState === "running" }));
        await pause(300);
        await driver.inputPress("Escape");
        const exit = (await driver.ownAnimations("dlg", "dialog")).map(({ playState, ...rest }) => ({ ...rest, running: playState === "running" }));
        const during = { attribute: await driver.attribute("dlg", "open"), modal: (await inspect(driver, "dlg", "dialog")).modal };
        return { entry, exit, during, recorded: await events(driver, 2) };
      },
      {
        entry: [{ duration: motionBase, easing: easingStandard, keyframes: fade(0, 1), running: true }],
        exit: [{ duration: motionBase, easing: easingStandard, keyframes: fade(1, 0), running: true }],
        during: { attribute: null, modal: true },
        recorded: [request("escape", "b1"), closeEvent("escape", "opener")],
      },
    ),
    ...(["", "an ancestor sets --ocelle-motion-base: 200ms"] as const).map((ancestor) =>
      row(
        `Motion under reduced motion${ancestor === "" ? "" : `, ${ancestor}`}: no animation on open or close, the whole close in one update (FR-020, SC-008)`,
        async (driver) => {
          await driver.reducedMotion("reduce");
          await driver.mount(`<div id="wrap">${page(basic)}</div>`);
          if (ancestor !== "") await driver.rules("#wrap { --ocelle-motion-base: 200ms; }");
          await open(driver);
          const entry = await driver.ownAnimations("dlg", "dialog");
          await driver.inputPress("Escape");
          const exit = await driver.ownAnimations("dlg", "dialog");
          const recorded = await driver.recorded();
          return { entry, exit, recorded };
        },
        { entry: [], exit: [], recorded: [request("escape", "b1"), closeEvent("escape", "opener")] },
      ),
    ),
  ];

  // Geometry and styles (FR-003, FR-018, FR-019, FR-024, R-18) -------------------------------------------------------

  const paragraphs = Array.from({ length: 40 }, (_, index) => `<p id="p${String(index)}">Paragraph ${String(index + 1)} of a long body that is taller than the dialog's maximum block size, so the body scrolls.</p>`).join("");
  const geometryRows = [
    row(
      "Long body (US1-10, FR-018): no taller than dialog-max-block, heading and footer inside the panel, the body scrolls, Tab from the close control reaches it, ArrowDown and PageDown scroll it; no tabindex once it no longer overflows",
      async (driver) => {
        await driver.mount(page(paragraphs, { footer: '<button id="f1">F1</button>' }));
        await open(driver);
        const panel = await inspect(driver, "dlg", "dialog");
        const heading = await inspect(driver, "dlg", '[part="heading"]');
        const footer = await inspect(driver, "dlg", '[part="footer"]');
        const body = await inspect(driver, "dlg", '[part="body"]');
        await focusClose(driver);
        await driver.inputPress("Tab");
        const focused = await driver.focusPath();
        const top = (): Promise<number> => inspect(driver, "dlg", '[part="body"]').then((body) => body.scrollTop);
        await driver.inputPress("ArrowDown");
        const down = await eventually(async () => (await top()) > 0);
        await pause(300);
        const afterDown = await top();
        await driver.inputPress("PageDown");
        const paged = await eventually(async () => (await top()) > afterDown);
        const ids = Array.from({ length: 39 }, (_, index) => `p${String(index + 1)}`);
        await act(driver, { op: "seq", ops: ids.map((id): Act => ({ op: "remove", id })) });
        let tabindex: string | undefined = "0";
        for (const start = Date.now(); tabindex !== undefined && Date.now() - start < 1000; ) {
          await pause(20);
          tabindex = (await inspect(driver, "dlg", '[part="body"]')).attributes.tabindex;
        }
        return {
          capped: panel.height <= 768,
          headingInside: heading.top >= panel.top && heading.bottom <= panel.bottom,
          footerInside: footer.top >= panel.top && footer.bottom <= panel.bottom,
          overflows: body.scrollHeight > body.clientHeight,
          bodyTabindex: body.attributes.tabindex,
          focused,
          scrolled: { down, page: paged },
          after: tabindex ?? null,
        };
      },
      { capped: true, headingInside: true, footerInside: true, overflows: true, bodyTabindex: "0", focused: "dlg[div]", scrolled: { down: true, page: true }, after: null },
    ),
    row(
      "Short viewport 320 × 256 (US1-10, WCAG 1.4.10, R-18): the body keeps its minimum block size and its last content is reachable by scrolling",
      async (driver) => {
        await driver.viewport(320, 256);
        try {
          await driver.mount(page(paragraphs, { footer: '<button id="f1">F1</button><button id="f2">Second action</button>' }));
          await open(driver);
          const body = await inspect(driver, "dlg", '[part="body"]');
          await focusClose(driver);
          await driver.inputPress("Tab");
          const focused = await driver.focusPath();
          await driver.inputPress("End");
          const atEnd = await eventually(async () => {
            const ended = await inspect(driver, "dlg", '[part="body"]');
            return ended.scrollTop + ended.clientHeight >= ended.scrollHeight - 1;
          });
          return { minimum: body.height, overflows: body.scrollHeight > body.clientHeight, focused, atEnd };
        } finally {
          await driver.viewport(1280, 800);
        }
      },
      { minimum: bodyMinimum, overflows: true, focused: "dlg[div]", atEnd: true },
    ),
    row(
      "One-line body (US1-10, R-18): the body's border box is calc(3 * --ocelle-target-min), 132 px, the text at its block start, no tabindex",
      async (driver) => {
        await driver.mount(page('<p id="line">Delete this project?</p>'));
        await open(driver);
        const body = await inspect(driver, "dlg", '[part="body"]', ["padding-block-start", "min-block-size"]);
        const line = await inspect(driver, "line", undefined, ["margin-block-start"]);
        return {
          height: body.height,
          minimum: body.styles["min-block-size"],
          start: Math.round(line.top - body.top - Number.parseFloat(body.styles["padding-block-start"] ?? "NaN") - Number.parseFloat(line.styles["margin-block-start"] ?? "NaN")),
          tabindex: body.attributes.tabindex ?? null,
        };
      },
      { height: bodyMinimum, minimum: `${String(bodyMinimum)}px`, start: 0, tabindex: null },
    ),
  ];

  const panelStyles = ["border-top-width", "border-top-style", "border-top-color", "padding-top", "padding-left", "max-inline-size", "max-block-size", "background-color", "color", "border-top-left-radius", "border-top-right-radius", "border-bottom-left-radius", "border-bottom-right-radius", "box-shadow"];
  const styleRows = [
    ...(["light", "dark"] as const).map((theme) =>
      row(
        `Styles in ${theme} (US1-9, FR-003): the UA reset to tokens (border, padding, max sizes), sheet ground and ink, the overlay backdrop, radius-2 on four corners, the raised shadow, centred`,
        async (driver) => {
          await driver.mount(page(basic));
          await driver.theme(theme);
          await open(driver);
          const panel = await inspect(driver, "dlg", "dialog", panelStyles);
          const backdrop = await inspect(driver, "dlg", "dialog", ["background-color"], "::backdrop");
          const viewport = await driver.viewportSize();
          return {
            styles: panel.styles,
            backdrop: backdrop.styles["background-color"],
            centred: { inline: Math.abs((panel.left + panel.right) / 2 - viewport.width / 2) < 1, block: Math.abs((panel.top + panel.bottom) / 2 - viewport.height / 2) < 1 },
          };
        },
        {
          styles: {
            "border-top-width": "1px",
            "border-top-style": "solid",
            "border-top-color": "rgba(0, 0, 0, 0)",
            "padding-top": "0px",
            "padding-left": "0px",
            "max-inline-size": "1248px",
            "max-block-size": "768px",
            "background-color": theme === "light" ? sheetLight : sheetDark,
            color: theme === "light" ? inkLight : inkDark,
            "border-top-left-radius": radius2,
            "border-top-right-radius": radius2,
            "border-bottom-left-radius": radius2,
            "border-bottom-right-radius": radius2,
            "box-shadow": theme === "light" ? raisedLight : raisedDark,
          },
          backdrop: theme === "light" ? overlayLight : overlayDark,
          centred: { inline: true, block: true },
        },
      ),
    ),
    row(
      "Sizes (FR-024): the panel's inline size at 1280 × 800 equals the computed --ocelle-dialog-inline-size (the reading measure)",
      async (driver) => {
        await driver.mount(page('<p>Body.</p><div id="ref">Reference</div>'));
        await driver.rules("#ref { inline-size: var(--ocelle-dialog-inline-size); }");
        await open(driver);
        const panel = await inspect(driver, "dlg", "dialog", ["inline-size"]);
        const ref = await inspect(driver, "ref", undefined, ["inline-size"]);
        const hook = await driver.computed("dlg", "--ocelle-dialog-inline-size");
        return { hook: hook.trim(), equal: panel.styles["inline-size"] === ref.styles["inline-size"], px: Number.parseFloat(panel.styles["inline-size"] ?? "0") > 288 };
      },
      { hook: "68ch", equal: true, px: true },
    ),
    row(
      "Sizes (US1-10, FR-024): at 320 × 800 the panel's inline size equals the computed dialog-max-inline, 288 px",
      async (driver) => {
        await driver.viewport(320, 800);
        try {
          await driver.mount(page(basic));
          await open(driver);
          const panel = await inspect(driver, "dlg", "dialog", ["inline-size", "max-inline-size"]);
          return panel.styles;
        } finally {
          await driver.viewport(1280, 800);
        }
      },
      { "inline-size": "288px", "max-inline-size": "288px" },
    ),
    row(
      "Body inline size is definite with prose and a table (US1-11, FR-019): a short paragraph fills the body's content box, the body fills the panel",
      async (driver) => {
        await driver.mount(page('<p id="short">Short.</p><table id="narrow"><tbody><tr><td>A</td><td>B</td></tr></tbody></table>'));
        await open(driver);
        const panel = await inspect(driver, "dlg", "dialog", ["border-left-width", "border-right-width"]);
        const body = await inspect(driver, "dlg", '[part="body"]', ["padding-left", "padding-right"]);
        const short = await inspect(driver, "short");
        const borders = Number.parseFloat(panel.styles["border-left-width"] ?? "NaN") + Number.parseFloat(panel.styles["border-right-width"] ?? "NaN");
        const padding = Number.parseFloat(body.styles["padding-left"] ?? "NaN") + Number.parseFloat(body.styles["padding-right"] ?? "NaN");
        return { bodyFills: Math.abs(body.width - (panel.width - borders)) < 0.5, prose: Math.abs(short.width - (body.width - padding)) < 0.5 };
      },
      { bodyFills: true, prose: true },
    ),
    row(
      "Footer (FR-017): with the footer slot empty there is no footer box; filled, the footer box ends at the panel's end",
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        const empty = await driver.box("dlg", '[part="footer"]');
        await driver.setAttribute("act", "data-wait", "");
        await driver.mount(page(basic, { footer: '<button id="f1">F1</button>' }));
        await open(driver);
        const panel = await inspect(driver, "dlg", "dialog", ["border-bottom-width"]);
        const footer = await inspect(driver, "dlg", '[part="footer"]');
        return { empty: { width: empty.width, height: empty.height }, filled: footer.height > 0, atEnd: Math.abs(footer.bottom - (panel.bottom - Number.parseFloat(panel.styles["border-bottom-width"] ?? "NaN"))) < 0.5 };
      },
      { empty: { width: 0, height: 0 }, filled: true, atEnd: true },
    ),
  ];

  const forcedRows = (["light", "dark"] as const).map((palette) =>
    row(
      `Forced colours, ${palette} palette (US1-9, FR-021): a CanvasText panel border, a Canvas ground, the backdrop Canvas so it does not hide the border, an outline focus indicator on the close control`,
      async (driver) => {
        await driver.mount(page(basic));
        await driver.forcedColors("active", palette);
        await open(driver);
        await driver.inputPress("Tab", { shift: true });
        const panel = await inspect(driver, "dlg", "dialog", ["border-top-style", "border-top-width", "border-top-color", "background-color"]);
        const backdrop = await inspect(driver, "dlg", "dialog", ["background-color"], "::backdrop");
        const control = await inspect(driver, "dlg", close, ["outline-style", "outline-width", "outline-color"]);
        const canvasText = await driver.resolveColour("CanvasText");
        const canvas = await driver.resolveColour("Canvas");
        const highlight = await driver.resolveColour("Highlight");
        return {
          border: { style: panel.styles["border-top-style"], width: panel.styles["border-top-width"], canvasText: panel.styles["border-top-color"] === canvasText },
          ground: panel.styles["background-color"] === canvas,
          backdrop: backdrop.styles["background-color"] === canvas,
          distinct: canvas !== canvasText,
          ring: { style: control.styles["outline-style"], width: control.styles["outline-width"], highlight: control.styles["outline-color"] === highlight },
        };
      },
      { border: { style: "solid", width: "1px", canvasText: true }, ground: true, backdrop: true, distinct: true, ring: { style: "solid", width: "3px", highlight: true } },
    ),
  );

  const treeRows = [
    row(
      "Accessibility tree (US1-8, FR-044): one modal dialog named by label, a level-2 heading, the close control a button named by close-label, the icon hidden, no node for the end sentinel",
      async (driver) => {
        await driver.mount(page("<p>Choose a folder.</p>"));
        await open(driver);
        return { tree: await driver.ax("dlg") };
      },
      {
        tree: [
          { role: "dialog", name: "Open project", modal: true },
          { role: "heading", name: "Open project", level: 2 },
          { role: "button", name: "Close" },
          { role: "StaticText", name: "Open project" },
        ],
      },
    ),
    ...[
      ["a host aria-label instead of label", ' aria-label="Settings"', ""],
      ["a host aria-label as well as label", ' aria-label="Settings"', "Open project"],
    ].map(([label, attrs, heading]) =>
      row(
        `Accessibility tree with ${String(label)} (US1-8, FR-005, R-08): while open the only named node for the overlay is the modal dialog named by the host aria-label; while closed the host is a named generic node`,
        async (driver) => {
          await driver.mount(`<button id="opener">Open</button><${kind.tag} id="dlg"${String(heading) === "" ? "" : ` label="${String(heading)}"`}${String(attrs)}><p>Body.</p></${kind.tag}><ocelle-test-act id="act"></ocelle-test-act>`);
          const closedTree = await driver.ax("dlg");
          await open(driver);
          const openTree = (await driver.ax("dlg")).filter((node) => node.name !== "" && node.role !== "StaticText" && node.role !== "heading" && node.role !== "button");
          return { openTree, closedTree: closedTree.filter((node) => node.name !== "") };
        },
        { openTree: [{ role: "dialog", name: "Settings", modal: true }], closedTree: [{ role: "generic", name: "Settings" }] },
      ),
    ),
  ];

  // Further rows of the matrix's rules, each at the point where the rule decides (T025, R-15) ---------------------------

  const fieldEscapeRows = [
    row(
      "Escape with slotted content: a slotted text field with a value: one request with escape, no cancel, the close, the value kept (FR-010: only a search field is cleared)",
      async (driver) => {
        await driver.mount(page('<input type="text" id="tx" aria-label="Name" value="abc">'));
        await open(driver);
        await watchPanel(driver);
        await driver.inputPress("Escape");
        return { recorded: await events(driver, 2), log: await logAfter(driver), value: (await inspect(driver, "tx")).value, state: await state(driver) };
      },
      { recorded: [request("escape", "tx"), closeEvent("escape", "opener")], log: ["close:false"], value: "abc", state: gone },
    ),
    row(
      "Escape with slotted content: an empty slotted search field: one request with escape, no cancel, the close (FR-010: only a non-empty search field takes Escape)",
      async (driver) => {
        await driver.mount(page('<input type="search" id="find" aria-label="Find">'));
        await open(driver);
        await watchPanel(driver);
        await driver.inputPress("Escape");
        return { recorded: await events(driver, 2), log: await logAfter(driver), state: await state(driver) };
      },
      { recorded: [request("escape", "find"), closeEvent("escape", "opener")], log: ["close:false"], state: gone },
    ),
    row(
      'Slotted close watchers: a shown slotted popover="manual" is not one: Escape requests with escape, no cancel, and the dialog closes, the popover left open (FR-010)',
      async (driver) => {
        await driver.mount(page(menu("manual")));
        await open(driver);
        await watchPanel(driver);
        await click(driver, "inv");
        const before = { focus: await driver.focusPath(), open: (await inspect(driver, "menu")).popoverOpen };
        await driver.inputPress("Escape");
        const recorded = await events(driver, 2);
        const log = await logAfter(driver);
        const panel = await inspect(driver, "dlg", "dialog");
        return { before, recorded, log, dialog: { open: (await driver.attribute("dlg", "open")) !== null, modal: panel.modal }, menuOpen: (await inspect(driver, "menu")).popoverOpen };
      },
      { before: { focus: "inv", open: true }, recorded: [request("escape", "inv"), closeEvent("escape", "opener")], log: ["close:false"], dialog: { open: false, modal: false }, menuOpen: true },
    ),
  ];

  const entryExitRows = [
    row(
      "Close control activated during the entry, motion on: the request and the close carry close-button, focus back on the opener (FR-011, FR-013)",
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        const entering = (await driver.ownAnimations("dlg", "dialog")).map((each) => each.playState);
        await act(driver, { op: "call", id: "dlg", inner: close, method: "click" });
        return { entering, recorded: await events(driver, 2), state: await state(driver), focus: await driver.focusPath() };
      },
      { entering: ["running"], recorded: [request("close-button", "b1"), closeEvent("close-button", "opener")], state: gone, focus: "opener" },
    ),
    row(
      "Close control activated after the entry ended, motion on: the request and the close carry close-button, focus back on the opener (FR-011, FR-013)",
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        await pause(300);
        const entering = await driver.ownAnimations("dlg", "dialog");
        await act(driver, { op: "call", id: "dlg", inner: close, method: "click" });
        return { entering, recorded: await events(driver, 2), state: await state(driver), focus: await driver.focusPath() };
      },
      { entering: [], recorded: [request("close-button", "b1"), closeEvent("close-button", "opener")], state: gone, focus: "opener" },
    ),
    row(
      "Platform close during a 1 000 ms exit: the inner close() through the shadow root ends the close at once: the exit animation cancelled and the close, with reason escape, within 300 ms (FR-014, FR-016, R-03, R-06)",
      async (driver) => {
        await driver.mount(`<div id="wrap">${page(basic)}</div>`);
        await driver.rules("#wrap { --ocelle-motion-base: 1000ms; }");
        await open(driver);
        await pause(1100);
        await driver.inputPress("Escape");
        const exiting = (await driver.ownAnimations("dlg", "dialog")).map((each) => each.playState);
        await act(driver, { op: "call", id: "dlg", inner: "dialog", method: "close" });
        await pause(300);
        return { exiting, recorded: await driver.recorded(), animations: await driver.ownAnimations("dlg", "dialog"), state: await state(driver), focus: await driver.focusPath() };
      },
      { exiting: ["running"], recorded: [request("escape", "b1"), closeEvent("escape", "opener")], animations: [], state: gone, focus: "opener" },
    ),
    row(
      "Platform close during a 1 000 ms entry: the inner close() through the shadow root cancels the entry animation: no animation left on the closed panel, one close with reason host (FR-016, R-03, R-06)",
      async (driver) => {
        await driver.mount(`<div id="wrap">${page(basic)}</div>`);
        await driver.rules("#wrap { --ocelle-motion-base: 1000ms; }");
        await open(driver);
        const entering = (await driver.ownAnimations("dlg", "dialog")).map((each) => each.playState);
        await act(driver, { op: "call", id: "dlg", inner: "dialog", method: "close" });
        const recorded = await events(driver, 1);
        return { entering, recorded, animations: await driver.ownAnimations("dlg", "dialog"), state: await state(driver), focus: await driver.focusPath() };
      },
      { entering: ["running"], recorded: [closeEvent("host", "opener")], animations: [], state: gone, focus: "opener" },
    ),
    row(
      "Motion: an ancestor sets --ocelle-easing-standard to initial (no value): the entry runs with linear easing over --ocelle-motion-base (FR-020, R-06)",
      async (driver) => {
        await driver.mount(`<div id="wrap">${page(basic)}</div>`);
        await driver.rules("#wrap { --ocelle-easing-standard: initial; }");
        await open(driver);
        return { entry: (await driver.ownAnimations("dlg", "dialog")).map(({ duration, easing }) => ({ duration, easing })) };
      },
      { entry: [{ duration: motionBase, easing: "linear" }] },
    ),
    row(
      "Input during the exit, motion on: a cancelable cancel dispatched on the inner dialog during the exit requests nothing more: one request and one close (FR-013, FR-014)",
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        await driver.inputPress("Escape");
        await act(driver, { op: "dispatch", id: "dlg", inner: "dialog", type: "cancel", cancelable: true });
        await events(driver, 2);
        return { recorded: await after(driver), state: await state(driver), focus: await driver.focusPath() };
      },
      { recorded: [request("escape", "b1"), closeEvent("escape", "opener")], state: gone, focus: "opener" },
    ),
    row(
      "Platform close during the exit, motion on: the inner close() through the shadow root after an Escape: one close, with reason escape, focus on the opener (FR-014, FR-016, R-03)",
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        await driver.inputPress("Escape");
        await act(driver, { op: "call", id: "dlg", inner: "dialog", method: "close" });
        await events(driver, 2);
        return { recorded: await after(driver), state: await state(driver), focus: await driver.focusPath() };
      },
      { recorded: [request("escape", "b1"), closeEvent("escape", "opener")], state: gone, focus: "opener" },
    ),
    row(
      "Synthetic cancel: a bubbling cancelable cancel dispatched on a slotted button is not the dialog's: not prevented, no request, open (R-02)",
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        const dispatched = await act(driver, { op: "dispatch", id: "b1", type: "cancel", cancelable: true, bubbles: true });
        return { dispatched, recorded: await after(driver), state: await state(driver), focus: await driver.focusPath() };
      },
      { dispatched: true, recorded: [], state: shown, focus: "b1" },
    ),
    row(
      "Platform open: the inner dialog shown non-modally through the shadow root, then open = true: shown modally in the top layer with initial focus, no event (FR-002, FR-015)",
      async (driver) => {
        await driver.mount(page(basic));
        await driver.record("dlg", both);
        await act(driver, { op: "call", id: "dlg", inner: "dialog", method: "show" });
        await open(driver);
        return { layer: await driver.topLayer(), focus: await driver.focusPath(), recorded: await after(driver), state: await state(driver) };
      },
      { layer: [{ element: "dlg[dialog]", modal: true, popoverOpen: false }], focus: "b1", recorded: [], state: shown },
    ),
    row(
      "Rapid toggle during the entry, motion on: open false and true in one task: the dialog stays shown, no event, the entry animation runs on (FR-014, R-06)",
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        await act(driver, { op: "seq", ops: [{ op: "set", id: "dlg", name: "open", value: false }, { op: "set", id: "dlg", name: "open", value: true }] });
        await driver.setAttribute("act", "data-wait", "");
        const entry = (await driver.ownAnimations("dlg", "dialog")).map(({ playState, keyframes }) => ({ running: playState === "running", keyframes }));
        return { entry, recorded: await after(driver), state: await state(driver), focus: await driver.focusPath() };
      },
      { entry: [{ running: true, keyframes: kind.entry }], recorded: [], state: shown, focus: "b1" },
    ),
    row(
      "Motion: an ancestor sets --ocelle-motion-base in seconds, 0.3s: the entry and the exit run 300 ms (FR-020, R-06)",
      async (driver) => {
        await driver.mount(`<div id="wrap">${page(basic)}</div>`);
        await driver.rules("#wrap { --ocelle-motion-base: 0.3s; }");
        await open(driver);
        const entry = (await driver.ownAnimations("dlg", "dialog")).map((each) => each.duration);
        await pause(400);
        await driver.inputPress("Escape");
        const exit = (await driver.ownAnimations("dlg", "dialog")).map((each) => each.duration);
        return { entry, exit, recorded: await events(driver, 2) };
      },
      { entry: [300], exit: [300], recorded: [request("escape", "b1"), closeEvent("escape", "opener")] },
    ),
  ];

  const lifecycleRows = [
    row(
      "Removed in the close-request listener, no veto: no close event, the dialog neither open nor :modal (FR-014, FR-022)",
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        await act(driver, { op: "on", id: "dlg", event: requestName, then: [{ op: "remove", id: "dlg" }] });
        await driver.inputPress("Escape");
        const recorded = await after(driver);
        return { recorded, property: ((await act(driver, { op: "inspect", id: "dlg" })) as Inspected).open, layer: await driver.topLayer() };
      },
      { recorded: [request("escape", "b1")], property: false, layer: [] },
    ),
    row(
      "After the close, focus on the body: Escape and Tab on the page dispatch nothing more, and Tab moves natively past the closed dialog from the opener, the last focused element (FR-013, R-02)",
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        await driver.inputPress("Escape");
        await events(driver, 2);
        await act(driver, { op: "blur" });
        await driver.inputPress("Escape");
        await driver.inputPress("Tab");
        return { recorded: (await after(driver)).map((each) => each.type), focus: await driver.focusPath() };
      },
      { recorded: [requestName, closeName], focus: "after" },
    ),
    row(
      "Nested: after the inner dialog closed, the outer handles Tab from the body again: a focused outer button the host removes, then Tab, gives the outer's first stop (R-02, R-04)",
      async (driver) => {
        await openNested(driver);
        await driver.inputPress("Escape");
        await events(driver, 2);
        const back = await driver.focusPath();
        await act(driver, { op: "seq", ops: [{ op: "focus", id: "ob" }, { op: "remove", id: "ob" }] });
        const removed = await driver.focusPath();
        await driver.inputPress("Tab");
        return { back, removed, focus: await driver.focusPath() };
      },
      { back: "oi", removed: "body", focus: "dlg[button]" },
    ),
    row(
      "Motion: an ancestor sets --ocelle-motion-base to a negative duration, -200ms: no animation on open or close, the whole close in one update, no console message (FR-020, R-06)",
      async (driver) => {
        await driver.mount(`<div id="wrap">${page(basic)}</div>`);
        await driver.rules("#wrap { --ocelle-motion-base: -200ms; }");
        await open(driver);
        const entry = await driver.ownAnimations("dlg", "dialog");
        await driver.inputPress("Escape");
        const exit = await driver.ownAnimations("dlg", "dialog");
        return { entry, exit, recorded: await driver.recorded(), messages: await driver.messages() };
      },
      { entry: [], exit: [], recorded: [request("escape", "b1"), closeEvent("escape", "opener")], messages: [] },
    ),
  ];

  /** Polls the body part's `tabindex` until it is gone, at most 1 000 ms; returns the last reading. */
  async function bodyTabindexGone(driver: Driver): Promise<string | null> {
    let tabindex: string | undefined = (await inspect(driver, "dlg", '[part="body"]')).attributes.tabindex;
    for (const start = Date.now(); tabindex !== undefined && Date.now() - start < 1000; ) {
      await pause(20);
      tabindex = (await inspect(driver, "dlg", '[part="body"]')).attributes.tabindex;
    }
    return tabindex ?? null;
  }

  /** The footer of the short-viewport rows, which holds the body at its minimum block size at 320 × 256. */
  const shortFooter = '<button id="f1">F1</button><button id="f2">Second action</button>';
  const nativeEventRows = [
    row(
      "Synthetic close: a close event dispatched on the inner dialog while it is open changes nothing: no event, open and :modal (R-03)",
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        const dispatched = await act(driver, { op: "dispatch", id: "dlg", inner: "dialog", type: "close", cancelable: false });
        return { dispatched, recorded: await after(driver), state: await state(driver), focus: await driver.focusPath() };
      },
      { dispatched: true, recorded: [], state: shown, focus: "b1" },
    ),
    row(
      "Stale native close event, then a platform close: the host reopens in the …-close listener, then the inner close() through the shadow root: a second close, with reason host (FR-014, FR-016, R-03)",
      async (driver) => {
        await driver.reducedMotion("reduce");
        await driver.mount(page(basic));
        await open(driver);
        await act(driver, { op: "on", id: "dlg", event: closeName, then: [{ op: "set", id: "dlg", name: "open", value: true }] });
        await driver.inputPress("Escape");
        await events(driver, 2);
        await pause(100);
        await driver.setAttribute("act", "data-wait", "");
        const reopened = await state(driver);
        await act(driver, { op: "call", id: "dlg", inner: "dialog", method: "close" });
        const recorded = await events(driver, 3);
        return { reopened, recorded: recorded.map((each) => [each.type, (each.detail as { reason: string }).reason]) };
      },
      { reopened: shown, recorded: [[requestName, "escape"], [closeName, "escape"], [closeName, "host"]] },
    ),
    row(
      'Slotted non-modal dialogs (US1-16, R-02): opened with show() in the same task as the overlay\'s open, closedby="any": below the overlay, ordinary content: Escape requests with escape, the slotted dialog stays open',
      async (driver) => {
        await driver.mount(page(nonModal(' closedby="any"')));
        await act(driver, { op: "focus", id: "opener" });
        await driver.record("dlg", both);
        await act(driver, { op: "seq", ops: [{ op: "call", id: "nm", method: "show" }, { op: "set", id: "dlg", name: "open", value: true }] });
        await pause(100);
        await act(driver, { op: "focus", id: "nb" });
        await driver.inputPress("Escape");
        return { recorded: await events(driver, 2), slotted: (await inspect(driver, "nm")).open, state: await state(driver) };
      },
      // show() focused nb, the slotted dialog's button, which is then the opener: hidden with the overlay, it cannot take
      // focus back, so focus goes to the body (FR-009).
      { recorded: [request("escape", "nb"), closeEvent("escape", "body")], slotted: true, state: gone },
    ),
  ];

  const t025Rows = [
    row(
      "Open and initial focus: a footer button with autofocus and nothing focusable in the body: the close control (FR-007: the body only)",
      async (driver) => {
        await driver.mount(page("<p>Nothing to focus.</p>", { footer: '<button id="f1" autofocus>F1</button>' }));
        await open(driver);
        return { focus: await driver.focusPath() };
      },
      { focus: "dlg[button]" },
    ),
    row(
      "Slotted close watchers (US1-13, R-02): a popover=\"auto\" menu inside a slotted block: the first Escape closes it alone, no request, the dialog stays open",
      async (driver) => {
        await driver.mount(page(`<div id="wrapm">${menu("auto")}</div>`));
        await open(driver);
        await click(driver, "inv");
        const opened = (await inspect(driver, "menu")).popoverOpen;
        await driver.inputPress("Escape");
        return { opened, recorded: await after(driver), menuOpen: (await inspect(driver, "menu")).popoverOpen, state: await state(driver) };
      },
      { opened: true, recorded: [], menuOpen: false, state: shown },
    ),
    row(
      "Accessibility tree: a host aria-label set while open names the modal dialog (FR-005, R-08)",
      async (driver) => {
        await driver.mount(page("<p>Body.</p>"));
        await open(driver);
        await driver.setAttribute("dlg", "aria-label", "Settings");
        await driver.setAttribute("act", "data-wait", "");
        return { tree: (await driver.ax("dlg")).filter((node) => node.role === "dialog") };
      },
      { tree: [{ role: "dialog", name: "Settings", modal: true }] },
    ),
    row(
      "Body (FR-018, R-18): content that fits at 1280 × 800 overflows once the viewport shrinks to 320 × 256, and the body becomes a Tab stop",
      async (driver) => {
        try {
          await driver.mount(page('<p>Line 1 of a body.</p><p>Line 2 of a body.</p><p>Line 3 of a body.</p><p>Line 4 of a body.</p><p>Line 5 of a body.</p>', { footer: shortFooter }));
          await open(driver);
          const before = (await inspect(driver, "dlg", '[part="body"]')).attributes.tabindex ?? null;
          await driver.viewport(320, 256);
          let after: string | undefined;
          for (const start = Date.now(); after === undefined && Date.now() - start < 1000; ) {
            await pause(20);
            after = (await inspect(driver, "dlg", '[part="body"]')).attributes.tabindex;
          }
          return { before, after: after ?? null };
        } finally {
          await driver.viewport(1280, 800);
        }
      },
      { before: null, after: "0" },
    ),
    row(
      "Host close after the entry ended (open = false while shown): no request, the close with reason host, focus back on the opener (US1-7)",
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        await pause(300);
        await driver.setAttribute("dlg", "open", null);
        return { recorded: await events(driver, 1), state: await state(driver), focus: await driver.focusPath() };
      },
      { recorded: [closeEvent("host", "opener")], state: gone, focus: "opener" },
    ),
    row(
      "Two dialogs, B opened over A: a focused button of B that the host removes, then Tab: B's first stop, A does nothing (R-02)",
      async (driver) => {
        await driver.mount(twoDialogs);
        await open(driver);
        await driver.setAttribute("dlgb", "open", "");
        await act(driver, { op: "remove", id: "bb1" });
        const removed = await driver.focusPath();
        await driver.inputPress("Tab");
        return { removed, focus: await driver.focusPath(), layer: (await driver.topLayer()).map((each) => each.element) };
      },
      { removed: "body", focus: "dlgb[button]", layer: ["dlg[dialog]", "dlgb[dialog]"] },
    ),
    row(
      "A closed dialog removed and re-inserted while another is open, then opened over it: Tab from the body in it gives its first stop, the one beneath does nothing (R-02, R-05a)",
      async (driver) => {
        await driver.mount(twoDialogs);
        await open(driver);
        await act(driver, { op: "seq", ops: [{ op: "remove", id: "dlgb" }, { op: "reinsert", id: "dlgb" }] });
        await driver.setAttribute("dlgb", "open", "");
        await act(driver, { op: "remove", id: "bb1" });
        const removed = await driver.focusPath();
        await driver.inputPress("Tab");
        return { removed, focus: await driver.focusPath() };
      },
      { removed: "body", focus: "dlgb[button]" },
    ),
    row(
      "Body (FR-018, R-18): the viewport shrinks to 1280 × 256, the content keeps its size and the body its width, and the body that now overflows becomes a Tab stop",
      async (driver) => {
        try {
          await driver.mount(page('<p>Line 1 of a body.</p><p>Line 2 of a body.</p><p>Line 3 of a body.</p><p>Line 4 of a body.</p><p>Line 5 of a body.</p>', { footer: shortFooter }));
          await open(driver);
          const before = (await inspect(driver, "dlg", '[part="body"]')).attributes.tabindex ?? null;
          await driver.viewport(1280, 256);
          let after: string | undefined;
          for (const start = Date.now(); after === undefined && Date.now() - start < 1000; ) {
            await pause(20);
            after = (await inspect(driver, "dlg", '[part="body"]')).attributes.tabindex;
          }
          return { before, after: after ?? null };
        } finally {
          await driver.viewport(1280, 800);
        }
      },
      { before: null, after: "0" },
    ),
    row(
      "A closed dialog removed while another is open: the open one still handles Tab from the body (R-02, R-05a)",
      async (driver) => {
        await driver.mount(twoDialogs);
        await open(driver);
        await act(driver, { op: "remove", id: "dlgb" });
        await act(driver, { op: "remove", id: "a1" });
        const removed = await driver.focusPath();
        await driver.inputPress("Tab");
        return { removed, focus: await driver.focusPath() };
      },
      { removed: "body", focus: "dlg[button]" },
    ),
  ];

  const closedPanelRows = [
    row(
      "Synthetic close: a close event dispatched on the inner dialog after the close changes nothing: no second close event (FR-014, R-03)",
      async (driver) => {
        await driver.mount(page(basic));
        await open(driver);
        await driver.inputPress("Escape");
        await events(driver, 2);
        await pause(100);
        await act(driver, { op: "dispatch", id: "dlg", inner: "dialog", type: "close", cancelable: false });
        return { recorded: (await after(driver)).map((each) => each.type), state: await state(driver) };
      },
      { recorded: [requestName, closeName], state: gone },
    ),
    row(
      "Footer (FR-017): content assigned to no slot that the host gives the footer slot after open makes the footer box; given another name again, no footer box",
      async (driver) => {
        await driver.mount(page('<button id="b1">B1</button><button id="late" slot="later">Later</button>'));
        await open(driver);
        const footerHeight = async (): Promise<number> => (await driver.box("dlg", '[part="footer"]')).height;
        const empty = await footerHeight();
        await act(driver, { op: "attr", id: "late", name: "slot", value: "footer" });
        const filled = await eventually(async () => (await footerHeight()) > 0);
        await act(driver, { op: "attr", id: "late", name: "slot", value: "later" });
        const emptied = await eventually(async () => (await footerHeight()) === 0);
        return { empty, filled, emptied };
      },
      { empty: 0, filled: true, emptied: true },
    ),
  ];

  const shortBodyRows = [
    row(
      "Short viewport 320 × 256 (FR-018, R-18): the body held at its minimum block size becomes a Tab stop when the host adds content that overflows it, and stops being one when the host shortens that content",
      async (driver) => {
        await driver.viewport(320, 256);
        try {
          // The long paragraph is assigned to no slot until the host takes its slot attribute away.
          await driver.mount(page(`<p id="line">One line.</p><p id="long" slot="later">${"A long paragraph that overflows the body at its minimum block size. ".repeat(12)}</p>`, { footer: shortFooter }));
          await open(driver);
          const before = await inspect(driver, "dlg", '[part="body"]');
          await act(driver, { op: "attr", id: "long", name: "slot", value: null });
          let added: string | undefined;
          for (const start = Date.now(); added === undefined && Date.now() - start < 1000; ) {
            await pause(20);
            added = (await inspect(driver, "dlg", '[part="body"]')).attributes.tabindex;
          }
          await act(driver, { op: "set", id: "long", name: "textContent", value: "Short." });
          return { before: { height: before.height, tabindex: before.attributes.tabindex ?? null }, added: added ?? null, shortened: await bodyTabindexGone(driver) };
        } finally {
          await driver.viewport(1280, 800);
        }
      },
      { before: { height: bodyMinimum, tabindex: null }, added: "0", shortened: null },
    ),
    row(
      "Short viewport 320 × 256 (FR-018, R-18): the body held at its minimum block size stops being a Tab stop when the host shortens the one paragraph that overflowed it",
      async (driver) => {
        await driver.viewport(320, 256);
        try {
          await driver.mount(page(`<p id="long">${"A long paragraph that overflows the body at its minimum block size. ".repeat(12)}</p>`, { footer: shortFooter }));
          await open(driver);
          const before = await inspect(driver, "dlg", '[part="body"]');
          await act(driver, { op: "set", id: "long", name: "textContent", value: "Short." });
          return { before: { height: before.height, tabindex: before.attributes.tabindex }, after: await bodyTabindexGone(driver) };
        } finally {
          await driver.viewport(1280, 800);
        }
      },
      { before: { height: bodyMinimum, tabindex: "0" }, after: null },
    ),
  ];

  const unitlessMotionRows = [
    row(
      "Motion: an ancestor sets --ocelle-motion-base without a unit, 300, which is no duration: no animation on open or close, the whole close in one update (FR-020, R-06)",
      async (driver) => {
        await driver.mount(`<div id="wrap">${page(basic)}</div>`);
        await driver.rules("#wrap { --ocelle-motion-base: 300; }");
        await open(driver);
        const entry = await driver.ownAnimations("dlg", "dialog");
        await driver.inputPress("Escape");
        const exit = await driver.ownAnimations("dlg", "dialog");
        return { entry, exit, recorded: await driver.recorded() };
      },
      { entry: [], exit: [], recorded: [request("escape", "b1"), closeEvent("escape", "opener")] },
    ),
  ];

  const footerSlotRows = [
    row(
      "Footer (FR-017): content given the footer slot after open makes the footer box, at the panel's end; taken out of it again, no footer box",
      async (driver) => {
        await driver.mount(page('<button id="b1">B1</button><button id="late">Later</button>'));
        await open(driver);
        const footerHeight = async (): Promise<number> => (await driver.box("dlg", '[part="footer"]')).height;
        const empty = await footerHeight();
        await act(driver, { op: "attr", id: "late", name: "slot", value: "footer" });
        const filled = await eventually(async () => (await footerHeight()) > 0);
        const panel = await inspect(driver, "dlg", "dialog", ["border-bottom-width"]);
        const footer = await inspect(driver, "dlg", '[part="footer"]');
        await act(driver, { op: "attr", id: "late", name: "slot", value: null });
        const emptied = await eventually(async () => (await footerHeight()) === 0);
        return { empty, filled, atEnd: Math.abs(footer.bottom - (panel.bottom - Number.parseFloat(panel.styles["border-bottom-width"] ?? "NaN"))) < 0.5, emptied };
      },
      { empty: 0, filled: true, atEnd: true, emptied: true },
    ),
  ];

  const moreReturnRows = [
    row(
      "Focus return is conditional (d): A's opener removed, then A closed and B opened in one task, and focus moved within B during A's exit: focus stays where B has it when A's exit ends (FR-009, R-05)",
      async (driver) => {
        await driver.mount(twoDialogs);
        await open(driver);
        await act(driver, { op: "remove", id: "opener" });
        await act(driver, { op: "seq", ops: [{ op: "set", id: "dlg", name: "open", value: false }, { op: "set", id: "dlgb", name: "open", value: true }] });
        await focusClose(driver, "dlgb");
        const recorded = await events(driver, 1);
        await pause(50);
        return { recorded, focus: await driver.focusPath() };
      },
      { recorded: [closeEvent("host", "dlgb[button]")], focus: "dlgb[button]" },
    ),
    row(
      "Nested: an inner dialog whose opener is removed before its close, the outer's body holding a hidden autofocus button first: focus on the outer's first rendered target (FR-007, R-05)",
      async (driver) => {
        await driver.mount(`<button id="opener">Open</button><${kind.tag} id="dlg" label="Outer"><button id="ha" autofocus hidden>Hidden</button><button id="oi">Open inner</button><${kind.tag} id="inner" label="Inner"><button id="i1">I1</button></${kind.tag}><button id="ob">Outer button</button></${kind.tag}><ocelle-test-act id="act"></ocelle-test-act>`);
        await driver.inputClick("opener");
        await driver.setAttribute("dlg", "open", "");
        const outerFocus = await driver.focusPath();
        await click(driver, "oi");
        await driver.setAttribute("inner", "open", "");
        await driver.record("inner", both);
        await act(driver, { op: "remove", id: "oi" });
        await driver.inputPress("Escape");
        const recorded = await events(driver, 2);
        return { outerFocus, last: recorded[1], focus: await driver.focusPath() };
      },
      { outerFocus: "oi", last: closeEvent("escape", "ob"), focus: "ob" },
    ),
  ];

  const unnamedRows = [
    row(
      "Accessibility tree without label or host aria-label (FR-005, a label is required): the modal dialog has no name and no heading node; the close control stays",
      async (driver) => {
        await driver.mount(`<button id="opener">Open</button><${kind.tag} id="dlg"><p>Body.</p></${kind.tag}><ocelle-test-act id="act"></ocelle-test-act>`);
        await open(driver);
        return { tree: await driver.ax("dlg") };
      },
      {
        tree: [
          { role: "dialog", name: "", modal: true },
          { role: "button", name: "Close" },
        ],
      },
    ),
  ];

  /**
   * The veto-then-Escape-twice case of the stop-propagation row (operator decision 2026-11-14, R-02; reviews/phase-2/
   * measure.md), kept out of `dialogScenarios` so that each harness runs it in a page of its own: whether the platform's
   * second `cancel` is cancelable depends on the page's history of user activations and vetoed cancels (measured in
   * Chromium 153), so after the many rows of the in-process page the veto can hold on the second press however the row
   * warms up. On a fresh page, the warm-up below and then the row are deterministic in both harnesses: the fixture gives
   * every row a page of its own, and the in-process harness runs this one in test/dialog-repeated-escape.test.ts.
   */
  const repeatedEscapeScenario: DialogScenario = row(
      "Escape with slotted content: a control that stops Escape's propagation, veto, after a warm-up: open on the first press, the second closes with reason host (the stated limit, R-02)",
      async (driver) => {
        // The warm-up (operator decision 2026-11-14, R-02; reviews/phase-2/measure.md): in Chromium the first vetoed
        // cancel sequence in a page holds the veto on a second press as well, a plain native <dialog> too, so one such
        // sequence runs first on a stand-in, in this page; its outcome is not asserted.
        await driver.mount('<button id="wopener">Open</button><dialog id="wd"><button id="ws">Stops Escape</button></dialog><ocelle-test-act id="act"></ocelle-test-act>');
        await driver.inputClick("wopener");
        await act(driver, { op: "call", id: "wd", method: "showModal" });
        await act(driver, { op: "escape", id: "ws", mode: "stop" });
        await act(driver, { op: "veto", id: "wd", event: "cancel" });
        await act(driver, { op: "focus", id: "ws" });
        await presses(driver, 2, false, "Escape");
        await driver.mount(page('<button id="stopper">Stops Escape</button>'));
        await open(driver);
        await act(driver, { op: "escape", id: "stopper", mode: "stop" });
        await act(driver, { op: "veto", id: "dlg", event: requestName });
        await pause(300);
        await driver.inputPress("Escape");
        const first = { recorded: await after(driver), state: await state(driver) };
        await driver.inputPress("Escape");
        return { first, recorded: await events(driver, 2), state: await state(driver) };
      },
      { first: { recorded: [request("escape", "stopper")], state: shown }, recorded: [request("escape", "stopper"), closeEvent("host", "opener")], state: gone },
    );

  // The before-definition case of the open-at-first-render row (test/dialog-upgrade.test.ts in process; the
  // overlays-upgrade.html page on the fixture): the markup is mounted while `ocelle-dialog` is undefined, the page
  // button focused; the runner then loads the definition and calls `upgraded`.

  /** The markup of the before-definition case: a page button and an open `ocelle-dialog` with two slotted buttons. */
  const upgradeMarkup = `<button id="page">Page</button><${kind.tag} id="dlg" label="Open project" open><button id="b1">B1</button><button id="b2">B2</button></${kind.tag}><ocelle-test-act id="act"></ocelle-test-act>`;

  /** Before the definition loads: focus the page button and record the dialog's events. */
  async function beforeUpgrade(driver: Driver): Promise<unknown> {
    await act(driver, { op: "focus", id: "page" });
    await driver.record("dlg", both);
    return { focus: await driver.focusPath(), defined: (await inspect(driver, "dlg", "dialog")).exists };
  }

  /** After the definition loaded: shown modally with focus on the first slotted button, no event; open = false returns focus. */
  async function afterUpgrade(driver: Driver): Promise<unknown> {
    const opened = { state: await state(driver), focus: await driver.focusPath(), recorded: await driver.recorded() };
    await driver.setAttribute("dlg", "open", null);
    return { opened, recorded: await events(driver, 1), focus: await driver.focusPath(), counts: await counts(driver) };
  }

  const upgradeExpected = {
    before: { focus: "page", defined: false },
    after: { opened: { state: shown, focus: "b1", recorded: [] }, recorded: [closeEvent("host", "page")], focus: "page", counts: none },
  };

  return {
    initialRows,
    tabCycleRows,
    detailsRows,
    nonStopRows,
    bodyStartRows,
    scrollerRows,
    opaqueRows,
    opaquePairRows,
    opaqueMoreRows,
    sentinelRows,
    middleRows,
    positiveRows,
    stopRows,
    moreStopRows,
    shadowNonStopRows,
    iframeEscapeRows,
    geometryRows,
    escapeRows,
    slottedEscapeRows,
    closeWatcherRows,
    nativeModalRows,
    ordinaryRows,
    aboveRows,
    nonModalTabRows,
    cancelRows,
    closeControlRows,
    closeControlLooks,
    backdropRows,
    hostRows,
    returnRows,
    conditionalRows,
    nestedRows,
    firstRenderRows,
    removalRows,
    toggleRows,
    exitInputRows,
    staleRows,
    motionRows,
    styleRows,
    forcedRows,
    treeRows,
    fieldEscapeRows,
    entryExitRows,
    lifecycleRows,
    t025Rows,
    nativeEventRows,
    closedPanelRows,
    shortBodyRows,
    unitlessMotionRows,
    footerSlotRows,
    moreReturnRows,
    unnamedRows,
    repeatedEscapeScenario,
    upgrade: { markup: upgradeMarkup, before: beforeUpgrade, after: afterUpgrade, expected: upgradeExpected },
  };
}

// `ocelle-dialog` ----------------------------------------------------------------------------------------------------

const dialogBuilt = overlayScenarios({ tag: "ocelle-dialog", prefix: "ocelle-dialog", entry: fade(0, 1) });

/** The dialog's two events as `record()` reads them at dispatch (matrix § Dialog). */
const dialogRequest = (reason: string, focusPath: string): RecordedEvent => ({
  type: "ocelle-dialog-close-request",
  detail: { reason },
  cancelable: true,
  bubbles: true,
  composed: true,
  open: true,
  dialogOpen: true,
  modal: true,
  focusPath,
});
const dialogClose = (reason: string, focusPath: string): RecordedEvent => ({
  type: "ocelle-dialog-close",
  detail: { reason },
  cancelable: false,
  bubbles: true,
  composed: true,
  open: false,
  dialogOpen: false,
  modal: false,
  focusPath,
});

// The nested row with an open `ocelle-drawer` as the outer overlay and the dialog slotted inside it (matrix § Dialog
// "Nested", "Backdrop click over an open drawer"; FR-012, FR-023, R-07; tasks.md T031). The drawer is `drw` on its
// default side, the start edge; it records its own events (those targeted at it, not the dialog's that bubble through
// it) with the stand-in's `watch`.
const inDrawer = '<button id="opener">Open</button><ocelle-drawer id="drw" label="Outer"><button id="oi">Open inner</button><ocelle-dialog id="inner" label="Inner"><button id="i1">I1</button><button id="i2">I2</button></ocelle-dialog><button id="ob">Outer button</button></ocelle-drawer><ocelle-test-act id="act"></ocelle-test-act>';
const drawerEvents = ["ocelle-drawer-close-request", "ocelle-drawer-close"];

/**
 * Opens the drawer from the page's opener, watches its own events, then opens the dialog from `oi` and records the
 * dialog's. The click on `oi` waits, at most 1 000 ms, until the drawer's entry has ended: during it the slide
 * (FR-028) has `oi` off the viewport, so a click at once missed it and left focus on the body, and the dialog had no
 * opener. It fails with a message when the entry does not end in time, or when the click did not leave focus on `oi`.
 */
async function openInDrawer(driver: Driver): Promise<void> {
  await driver.mount(inDrawer);
  await driver.inputClick("opener");
  await driver.setAttribute("drw", "open", "");
  await act(driver, { op: "watch", id: "drw", events: drawerEvents });
  for (const start = Date.now(); (await driver.ownAnimations("drw", "dialog")).length > 0; ) {
    if (Date.now() - start > 1000) throw new Error("the entry of #drw did not end within 1 000 ms");
    await pause(20);
  }
  await driver.inputClick("oi");
  const opener = await driver.focusPath();
  if (opener !== "oi") throw new Error(`the click on #oi left focus on ${opener}, so the dialog would open with no opener in the drawer`);
  await driver.setAttribute("inner", "open", "");
  await driver.record("inner", ["ocelle-dialog-close-request", "ocelle-dialog-close"]);
}

/** The drawer's and the dialog's state: the `open` attribute and whether the inner `<dialog>` is open and `:modal`. */
async function overlaysState(driver: Driver): Promise<unknown> {
  const of = async (id: string): Promise<unknown> => {
    const panel = await inspect(driver, id, "dialog");
    return { open: (await driver.attribute(id, "open")) !== null, dialogOpen: panel.open, modal: panel.modal };
  };
  return { drawer: await of("drw"), dialog: await of("inner"), layer: (await driver.topLayer()).map((each) => each.element) };
}

const nestedInDrawerRows = [
  row(
    "Nested in an open ocelle-drawer: the dialog slotted in it: one Escape gives one request, on the dialog; the drawer dispatches nothing and stays open and :modal; focus returns to the drawer's button that opened the dialog (FR-023)",
    async (driver) => {
      await openInDrawer(driver);
      const at = await driver.focusPath();
      await driver.inputPress("Escape");
      const recorded = await events(driver, 2);
      return { at, recorded, drawerEvents: await logAfter(driver), drawer: { open: (await driver.attribute("drw", "open")) !== null, modal: (await inspect(driver, "drw", "dialog")).modal }, focus: await driver.focusPath() };
    },
    { at: "i1", recorded: [dialogRequest("escape", "i1"), dialogClose("escape", "oi")], drawerEvents: [], drawer: { open: true, modal: true }, focus: "oi" },
  ),
  ...([false, true] as const).map((shift) =>
    row(
      `Nested in an open ocelle-drawer: ${shift ? "Shift+Tab" : "Tab"} in the dialog never runs the drawer's wrap (FR-023)`,
      async (driver) => {
        await openInDrawer(driver);
        const path = await presses(driver, 5, shift);
        return { path, drawerEvents: await logAfter(driver), state: await overlaysState(driver) };
      },
      {
        path: shift ? "inner[button] i2 i1 inner[button] i2" : "i2 inner[button] i1 i2 inner[button]",
        drawerEvents: [],
        state: { drawer: { open: true, dialogOpen: true, modal: true }, dialog: { open: true, dialogOpen: true, modal: true }, layer: ["drw[dialog]", "inner[dialog]"] },
      },
    ),
  ),
  row(
    "Nested in an open ocelle-drawer: the dialog whose opener (a button of the drawer) is removed before its close: focus on the drawer's initial target (R-05)",
    async (driver) => {
      await openInDrawer(driver);
      await act(driver, { op: "remove", id: "oi" });
      await driver.inputPress("Escape");
      const recorded = await events(driver, 2);
      return { last: recorded[1], focus: await driver.focusPath(), drawerEvents: await logAfter(driver) };
    },
    { last: dialogClose("escape", "ob"), focus: "ob", drawerEvents: [] },
  ),
  ...(
    [
      ["outside both panels", { x: 1276, y: 4 }],
      ["inside the drawer panel's border box, outside the dialog's", { x: 160, y: 4 }],
    ] as const
  ).flatMap(([where, point]) =>
    ([false, true] as const).map((veto) =>
      row(
        `Nested in an open ocelle-drawer: a primary click on the dialog's backdrop ${where}, ${veto ? "the drawer's host vetoes" : "no veto"}: no ocelle-drawer-close-request, no ocelle-drawer-close and no ocelle-dialog-* event; both stay open and :modal, focus on the dialog's <dialog>; then one Escape closes the dialog alone with escape and focus on the drawer's button (FR-012, FR-023, R-07)`,
        async (driver) => {
          await openInDrawer(driver);
          if (veto) await act(driver, { op: "veto", id: "drw", event: "ocelle-drawer-close-request" });
          const drawer = await inspect(driver, "drw", "dialog");
          const dialog = await inspect(driver, "inner", "dialog");
          const inside = (box: Inspected): boolean => point.x >= box.left && point.x <= box.right && point.y >= box.top && point.y <= box.bottom;
          const placed = { inDrawer: inside(drawer), inDialog: inside(dialog) };
          await driver.pointer([{ ...point, down: true, up: true }]);
          const clicked = { recorded: await after(driver), drawerEvents: await act(driver, { op: "log" }), state: await overlaysState(driver), focus: await driver.focusPath() };
          await driver.inputPress("Escape");
          const recorded = await events(driver, 2);
          return { placed, clicked, escaped: { recorded, drawerEvents: await logAfter(driver), focus: await driver.focusPath() } };
        },
        {
          placed: { inDrawer: where !== "outside both panels", inDialog: false },
          clicked: {
            recorded: [],
            drawerEvents: [],
            state: { drawer: { open: true, dialogOpen: true, modal: true }, dialog: { open: true, dialogOpen: true, modal: true }, layer: ["drw[dialog]", "inner[dialog]"] },
            focus: "inner[dialog]",
          },
          escaped: { recorded: [dialogRequest("escape", "inner[dialog]"), dialogClose("escape", "oi")], drawerEvents: [], focus: "oi" },
        },
      ),
    ),
  ),
];

/**
 * The veto-then-Escape-twice case of the stop-propagation row, kept out of `dialogScenarios` so that each harness runs
 * it in a page of its own (see the builder's `repeatedEscapeScenario`).
 */
export const repeatedEscapeScenario: DialogScenario = dialogBuilt.repeatedEscapeScenario;

/** Every row of matrix § Dialog. */
export const dialogScenarios: readonly DialogScenario[] = [
  ...dialogBuilt.initialRows,
  ...dialogBuilt.tabCycleRows,
  ...dialogBuilt.detailsRows,
  ...dialogBuilt.nonStopRows,
  ...dialogBuilt.bodyStartRows,
  ...dialogBuilt.scrollerRows,
  ...dialogBuilt.opaqueRows,
  ...dialogBuilt.opaquePairRows,
  ...dialogBuilt.opaqueMoreRows,
  ...dialogBuilt.sentinelRows,
  ...dialogBuilt.middleRows,
  ...dialogBuilt.positiveRows,
  ...dialogBuilt.stopRows,
  ...dialogBuilt.moreStopRows,
  ...dialogBuilt.shadowNonStopRows,
  ...dialogBuilt.iframeEscapeRows,
  ...dialogBuilt.geometryRows,
  ...dialogBuilt.escapeRows,
  ...dialogBuilt.slottedEscapeRows,
  ...dialogBuilt.closeWatcherRows,
  ...dialogBuilt.nativeModalRows,
  ...dialogBuilt.ordinaryRows,
  ...dialogBuilt.aboveRows,
  ...dialogBuilt.nonModalTabRows,
  ...dialogBuilt.cancelRows,
  ...dialogBuilt.closeControlRows,
  ...dialogBuilt.closeControlLooks,
  ...dialogBuilt.backdropRows,
  ...dialogBuilt.hostRows,
  ...dialogBuilt.returnRows,
  ...dialogBuilt.conditionalRows,
  ...dialogBuilt.nestedRows,
  ...nestedInDrawerRows,
  ...dialogBuilt.firstRenderRows,
  ...dialogBuilt.removalRows,
  ...dialogBuilt.toggleRows,
  ...dialogBuilt.exitInputRows,
  ...dialogBuilt.staleRows,
  ...dialogBuilt.motionRows,
  ...dialogBuilt.styleRows,
  ...dialogBuilt.forcedRows,
  ...dialogBuilt.treeRows,
  ...dialogBuilt.fieldEscapeRows,
  ...dialogBuilt.entryExitRows,
  ...dialogBuilt.lifecycleRows,
  ...dialogBuilt.t025Rows,
  ...dialogBuilt.nativeEventRows,
  ...dialogBuilt.closedPanelRows,
  ...dialogBuilt.shortBodyRows,
  ...dialogBuilt.unitlessMotionRows,
  ...dialogBuilt.footerSlotRows,
  ...dialogBuilt.moreReturnRows,
  ...dialogBuilt.unnamedRows,
];

// The before-definition case of the open-at-first-render row (test/dialog-upgrade.test.ts in process; the
// overlays-upgrade.html page on the fixture): the markup is mounted while `ocelle-dialog` is undefined, the page
// button focused; the runner then loads the definition and calls `afterUpgrade`.

/** The markup of the before-definition case: a page button and an open `ocelle-dialog` with two slotted buttons. */
export const upgradeMarkup: string = dialogBuilt.upgrade.markup;
/** Before the definition loads: focus the page button and record the dialog's events. */
export const beforeUpgrade: (driver: Driver) => Promise<unknown> = dialogBuilt.upgrade.before;
/** After the definition loaded: shown modally with focus on the first slotted button, no event; open = false returns focus. */
export const afterUpgrade: (driver: Driver) => Promise<unknown> = dialogBuilt.upgrade.after;
export const upgradeExpected: unknown = dialogBuilt.upgrade.expected;
