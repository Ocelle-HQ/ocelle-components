// The harness self-tests of 008 (research.md R-14; contracts/checks.md § Harness self-tests; tasks.md T001): one shared
// body per new driver method and browser command, run in process (test/harness.test.ts, test/harness.touch.test.ts)
// and on the strict-CSP fixture (test/browser/harness.test.ts, test/browser/harness.touch.test.ts). No element of the
// library is involved: the stand-in elements below, defined by `defineStandIns` in each harness's page, act when the
// driver sets their `act` attribute, so every observation goes through the driver alone. Expected values are written
// by hand from R-14 and the stand-ins' own markup: the counts of FR-047 are a delta from mount over the document and
// every shadow root, transient writes included; the device is a mouse (`(hover: hover)`, `(pointer: fine)`,
// `maxTouchPoints` 0) at 1280 × 800 by default and a touch device (`maxTouchPoints` above 0) in the touch context.
// Each body was red against the driver as it was (tasks.md T004): the driver methods it calls did not exist.
//
// Naming in `focusPath()` and `topLayer()`: an element is named by its `id`, or by its local name when it has none; an
// element inside a shadow root or a frame is written after its host's name in brackets (`ov[in]`, `fr[f1]`).
import type { Driver } from "./driver.ts";

/** A self-test body, its expected observation and, on the strict-CSP fixture, how many inline `<style>` it adds. */
export interface HarnessScenario {
  readonly name: string;
  readonly run: (driver: Driver) => Promise<unknown>;
  readonly expected: unknown;
  /**
   * The number of `<style>` elements the body adds to a shadow root. The fixture's policy blocks each one, which its
   * recorders see as one `style-src-elem` violation and one console error; every other body adds none.
   */
  readonly inlineStyles?: number;
}

/**
 * Defines the stand-in elements in the page that calls it. Self-contained (the fixture passes it to
 * `page.evaluate`), so it uses nothing from outside its own body, and defines nothing twice.
 * - `ocelle-harness-nest`: an open shadow root holding `ocelle-harness-inner`, whose own open shadow root holds
 *   `<span class="target">`. `act`: `write` sets the span's `color` through the CSSOM; `write-remove` does so and
 *   removes the `style` attribute again at once; `style` appends a `<style>` to the inner root; `style-remove`
 *   appends one and removes it at once; `detached` creates a `<span>`, sets its `color` through the CSSOM while it is
 *   detached and then appends it to the inner root; `fragment` clones a template holding
 *   `<p><i>One</i><b>Two</b></p>`, sets the `color` of the clone's `<i>` and `<b>` through the CSSOM while the clone
 *   is a detached fragment (as Lit commits a first render) and then appends the fragment to the inner root.
 * - `ocelle-harness-overlay`: an `open` property (false) and an open shadow root holding
 *   `<dialog><button id="in">`. `act`: `modal` shows the dialog modally and sets `open`; `announce` sets `open`, shows
 *   the dialog modally, focuses the button, dispatches `ocelle-harness-request` (cancelable, detail
 *   `{ reason: "escape" }`), then closes the dialog, blurs the button (focus on the body), clears `open` and
 *   dispatches `ocelle-harness-close` (not
 *   cancelable, detail `{ reason: "host" }`); both bubble and are composed.
 * - `ocelle-harness-pop`: `act="show"` calls its own `showPopover()` (the markup sets `popover="manual"`).
 * - `ocelle-harness-focus`: an open shadow root holding `<button id="in">`.
 * - `ocelle-harness-motion`: an open shadow root holding `<div class="panel">`; `act="animate"` animates the panel's
 *   opacity from 0 to 1 over 5 000 ms with `cubic-bezier(0.2, 0, 0, 1)`.
 * - `ocelle-harness-pad`: appends `<type>:<pointerType>:<button>` to its `data-log` attribute on each `pointerdown`
 *   and `pointerup` it receives, separated by spaces.
 * - `ocelle-harness-ax`: an open shadow root holding a dialog named "Panel" with a level-2 heading "Title" and a
 *   button "Go" described by a paragraph "More"; `act="modal"` shows the dialog modally.
 */
export function defineStandIns(): void {
  if (customElements.get("ocelle-harness-nest") !== undefined) return;
  const shadow = (host: HTMLElement, markup: string): ShadowRoot => {
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = markup;
    return root;
  };
  customElements.define(
    "ocelle-harness-inner",
    class extends HTMLElement {
      constructor() {
        super();
        shadow(this, '<span class="target">Nested</span>');
      }
    },
  );
  customElements.define(
    "ocelle-harness-nest",
    class extends HTMLElement {
      static get observedAttributes(): string[] {
        return ["act"];
      }

      constructor() {
        super();
        shadow(this, "<ocelle-harness-inner></ocelle-harness-inner>");
      }

      attributeChangedCallback(_name: string, _old: string | null, act: string | null): void {
        const inner = this.shadowRoot?.querySelector("ocelle-harness-inner")?.shadowRoot;
        const target = inner?.querySelector<HTMLElement>(".target");
        if (inner === null || inner === undefined || target === null || target === undefined) throw new Error("ocelle-harness-nest: no nested target");
        if (act === "write" || act === "write-remove") target.style.color = "rgb(1, 2, 3)";
        if (act === "write-remove") target.removeAttribute("style");
        if (act === "style" || act === "style-remove") {
          const added = document.createElement("style");
          inner.append(added);
          if (act === "style-remove") added.remove();
        }
        if (act === "detached") {
          const span = document.createElement("span");
          span.style.color = "rgb(1, 2, 3)";
          inner.append(span);
        }
        if (act === "fragment") {
          const template = document.createElement("template");
          template.innerHTML = "<p><i>One</i><b>Two</b></p>";
          const fragment = template.content.cloneNode(true) as DocumentFragment;
          for (const part of fragment.querySelectorAll<HTMLElement>("i, b")) part.style.color = "rgb(1, 2, 3)";
          inner.append(fragment);
        }
      }
    },
  );
  customElements.define(
    "ocelle-harness-overlay",
    class extends HTMLElement {
      open: boolean;

      static get observedAttributes(): string[] {
        return ["act"];
      }

      constructor() {
        super();
        this.open = false;
        shadow(this, '<dialog><button id="in">Inside</button></dialog>');
      }

      attributeChangedCallback(_name: string, _old: string | null, act: string | null): void {
        const dialog = this.shadowRoot?.querySelector("dialog");
        const button = this.shadowRoot?.querySelector("button");
        if (dialog === null || dialog === undefined || button === null || button === undefined) throw new Error("ocelle-harness-overlay: no dialog");
        if (act === "modal") {
          dialog.showModal();
          this.open = true;
        }
        if (act === "announce") {
          this.open = true;
          dialog.showModal();
          button.focus();
          this.dispatchEvent(new CustomEvent("ocelle-harness-request", { detail: { reason: "escape" }, bubbles: true, composed: true, cancelable: true }));
          dialog.close();
          // Chromium keeps focus on the button of a dialog closed with nothing focused before it opened; the stand-in
          // moves focus to the body itself, as an overlay returns focus before its close event.
          button.blur();
          this.open = false;
          this.dispatchEvent(new CustomEvent("ocelle-harness-close", { detail: { reason: "host" }, bubbles: true, composed: true, cancelable: false }));
        }
      }
    },
  );
  customElements.define(
    "ocelle-harness-pop",
    class extends HTMLElement {
      static get observedAttributes(): string[] {
        return ["act"];
      }

      attributeChangedCallback(_name: string, _old: string | null, act: string | null): void {
        if (act === "show") this.showPopover();
      }
    },
  );
  customElements.define(
    "ocelle-harness-focus",
    class extends HTMLElement {
      constructor() {
        super();
        shadow(this, '<button id="in">Inside</button>');
      }
    },
  );
  customElements.define(
    "ocelle-harness-motion",
    class extends HTMLElement {
      static get observedAttributes(): string[] {
        return ["act"];
      }

      constructor() {
        super();
        shadow(this, '<div class="panel">Panel</div>');
      }

      attributeChangedCallback(_name: string, _old: string | null, act: string | null): void {
        const panel = this.shadowRoot?.querySelector(".panel");
        if (act === "animate") panel?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 5000, easing: "cubic-bezier(0.2, 0, 0, 1)" });
      }
    },
  );
  customElements.define(
    "ocelle-harness-pad",
    class extends HTMLElement {
      constructor() {
        super();
        const log = (event: PointerEvent): void => {
          const entry = `${event.type}:${event.pointerType}:${String(event.button)}`;
          const before = this.getAttribute("data-log");
          this.setAttribute("data-log", before === null ? entry : `${before} ${entry}`);
        };
        this.addEventListener("pointerdown", log);
        this.addEventListener("pointerup", log);
      }
    },
  );
  customElements.define(
    "ocelle-harness-ax",
    class extends HTMLElement {
      static get observedAttributes(): string[] {
        return ["act"];
      }

      constructor() {
        super();
        shadow(this, '<dialog aria-label="Panel"><h2>Title</h2><button aria-describedby="more">Go</button><p id="more">More</p></dialog>');
      }

      attributeChangedCallback(_name: string, _old: string | null, act: string | null): void {
        if (act === "modal") this.shadowRoot?.querySelector("dialog")?.showModal();
      }
    },
  );
}

/** The pads' size and their hover mark, as a host stylesheet (no `style` attribute). */
const padRules = "ocelle-harness-pad { display: inline-block; width: 100px; height: 60px; margin: 20px; } ocelle-harness-pad:hover { color: rgb(1, 2, 3); }";
const hoverMark = "rgb(1, 2, 3)";

/** Whether each pad with these ids is hovered (shows the hover mark). */
async function hovered(driver: Driver, ...ids: string[]): Promise<Record<string, boolean>> {
  const marks = await Promise.all(ids.map(async (id) => [id, (await driver.computed(id, "color")) === hoverMark] as const));
  return Object.fromEntries(marks);
}

/** The centre of the border box of the element with `id`. */
async function centre(driver: Driver, id: string): Promise<{ x: number; y: number }> {
  const box = await driver.box(id);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** The self-tests of the default context (a mouse device at 1280 × 800). */
export const harnessScenarios: readonly HarnessScenario[] = [
  {
    name: "styleAttributes(): a CSSOM write in a nested shadow root and one in the light DOM are counted, the driver's own probe is not, a new mount starts at 0, and a write removed again is still counted",
    run: async (driver) => {
      await driver.mount('<ocelle-harness-nest id="nest"></ocelle-harness-nest><p id="light">Light</p>');
      const mounted = await driver.styleAttributes();
      await driver.setAttribute("nest", "act", "write");
      const nested = await driver.styleAttributes();
      await driver.style("light", "color", "rgb(4, 5, 6)");
      const light = await driver.styleAttributes();
      await driver.resolveColour("CanvasText");
      const probe = await driver.styleAttributes();
      await driver.mount('<ocelle-harness-nest id="nest"></ocelle-harness-nest>');
      const remounted = await driver.styleAttributes();
      await driver.setAttribute("nest", "act", "write-remove");
      return { mounted, nested, light, probe, remounted, transient: await driver.styleAttributes() };
    },
    expected: { mounted: 0, nested: 1, light: 2, probe: 2, remounted: 0, transient: 1 },
  },
  {
    name: "styleAttributes(): an element given a CSSOM style write while detached and then appended into a nested shadow root is counted",
    run: async (driver) => {
      await driver.mount('<ocelle-harness-nest id="nest"></ocelle-harness-nest>');
      const mounted = await driver.styleAttributes();
      await driver.setAttribute("nest", "act", "detached");
      return { mounted, appended: await driver.styleAttributes() };
    },
    expected: { mounted: 0, appended: 1 },
  },
  {
    name: "styleAttributes(): a cloned template fragment whose descendants are styled through the CSSOM before it is appended into a nested shadow root counts each styled descendant",
    run: async (driver) => {
      await driver.mount('<ocelle-harness-nest id="nest"></ocelle-harness-nest>');
      const mounted = await driver.styleAttributes();
      await driver.setAttribute("nest", "act", "fragment");
      return { mounted, committed: await driver.styleAttributes() };
    },
    expected: { mounted: 0, committed: 2 },
  },
  {
    name: "styleElements(): a <style> added to a shadow root attached after mount is counted, and one added and removed again at once is counted",
    run: async (driver) => {
      await driver.mount('<ocelle-harness-nest id="nest"></ocelle-harness-nest>');
      const mounted = await driver.styleElements();
      await driver.setAttribute("nest", "act", "style");
      const added = await driver.styleElements();
      await driver.mount('<ocelle-harness-nest id="nest"></ocelle-harness-nest>');
      const remounted = await driver.styleElements();
      await driver.setAttribute("nest", "act", "style-remove");
      return { mounted, added, remounted, transient: await driver.styleElements() };
    },
    expected: { mounted: 0, added: 1, remounted: 0, transient: 1 },
    inlineStyles: 2,
  },
  {
    name: "topLayer(): a manual popover and a modal dialog in a shadow root, in the order they were shown, each way round",
    run: async (driver) => {
      const markup = '<ocelle-harness-overlay id="ov"></ocelle-harness-overlay><ocelle-harness-pop id="pop" popover="manual">Pop</ocelle-harness-pop>';
      await driver.mount(markup);
      const mounted = await driver.topLayer();
      await driver.setAttribute("pop", "act", "show");
      await driver.setAttribute("ov", "act", "modal");
      const popoverFirst = await driver.topLayer();
      await driver.mount(markup);
      await driver.setAttribute("ov", "act", "modal");
      await driver.setAttribute("pop", "act", "show");
      return { mounted, popoverFirst, modalFirst: await driver.topLayer() };
    },
    expected: {
      mounted: [],
      popoverFirst: [
        { element: "pop", modal: false, popoverOpen: true },
        { element: "ov[dialog]", modal: true, popoverOpen: false },
      ],
      modalFirst: [
        { element: "ov[dialog]", modal: true, popoverOpen: false },
        { element: "pop", modal: false, popoverOpen: true },
      ],
    },
  },
  {
    name: "focusPath() and inputPress(): body at mount, Tab into an open shadow root, Tab into an iframe, Shift+Tab back into the shadow root",
    run: async (driver) => {
      await driver.mount('<ocelle-harness-focus id="fh"></ocelle-harness-focus><iframe id="fr" title="Frame" srcdoc="<button id=&quot;f1&quot;>F1</button>"></iframe>');
      const mounted = await driver.focusPath();
      await driver.inputPress("Tab");
      const shadow = await driver.focusPath();
      await driver.inputPress("Tab");
      const frame = await driver.focusPath();
      await driver.inputPress("Tab", { shift: true });
      return { mounted, shadow, frame, back: await driver.focusPath() };
    },
    expected: { mounted: "body", shadow: "fh[in]", frame: "fr[f1]", back: "fh[in]" },
  },
  {
    name: "focusVisible() and inputClick(): true after Tab (inner shadow button and light button), false after a click on a button that the click focused",
    run: async (driver) => {
      await driver.mount('<ocelle-harness-focus id="fh"></ocelle-harness-focus><button id="b">B</button>');
      await driver.inputPress("Tab");
      const inner = { path: await driver.focusPath(), visible: await driver.focusVisible("fh", "#in") };
      await driver.inputPress("Tab");
      const tabbed = { path: await driver.focusPath(), visible: await driver.focusVisible("b") };
      await driver.mount('<button id="b">B</button>');
      await driver.inputClick("b");
      return { inner, tabbed, clicked: { path: await driver.focusPath(), visible: await driver.focusVisible("b") } };
    },
    expected: {
      inner: { path: "fh[in]", visible: true },
      tabbed: { path: "b", visible: true },
      clicked: { path: "b", visible: false },
    },
  },
  {
    name: "record() and recorded(): each event with its detail and flags, and the host's open, the inner dialog's open and :modal and focusPath() read at dispatch",
    run: async (driver) => {
      await driver.mount('<ocelle-harness-overlay id="ov"></ocelle-harness-overlay>');
      await driver.record("ov", ["ocelle-harness-request", "ocelle-harness-close"]);
      const before = await driver.recorded();
      await driver.setAttribute("ov", "act", "announce");
      return { before, after: await driver.recorded() };
    },
    expected: {
      before: [],
      after: [
        { type: "ocelle-harness-request", detail: { reason: "escape" }, cancelable: true, bubbles: true, composed: true, open: true, dialogOpen: true, modal: true, focusPath: "ov[in]" },
        { type: "ocelle-harness-close", detail: { reason: "host" }, cancelable: false, bubbles: true, composed: true, open: false, dialogOpen: false, modal: false, focusPath: "body" },
      ],
    },
  },
  {
    name: "ownAnimations(): none before, then the shadow part's running animation with its duration, easing and keyframes, and none on the host itself",
    run: async (driver) => {
      await driver.mount('<ocelle-harness-motion id="mo"></ocelle-harness-motion>');
      const before = await driver.ownAnimations("mo", ".panel");
      await driver.setAttribute("mo", "act", "animate");
      return { before, panel: await driver.ownAnimations("mo", ".panel"), host: await driver.ownAnimations("mo") };
    },
    expected: {
      before: [],
      panel: [
        {
          duration: 5000,
          easing: "cubic-bezier(0.2, 0, 0, 1)",
          playState: "running",
          keyframes: [
            { offset: 0, easing: "linear", opacity: "0" },
            { offset: 1, easing: "linear", opacity: "1" },
          ],
        },
      ],
      host: [],
    },
  },
  {
    name: "pointer() and inputHover(): inputHover on one pad, a press there released on the other stops the pointer on it, a stop beyond both hovers neither, inputHover(null) leaves, a secondary click",
    run: async (driver) => {
      await driver.mount('<ocelle-harness-pad id="left"></ocelle-harness-pad><ocelle-harness-pad id="right"></ocelle-harness-pad>');
      await driver.rules(padRules);
      await driver.inputHover("left");
      const hover = await hovered(driver, "left", "right");
      const from = await centre(driver, "left");
      const to = await centre(driver, "right");
      await driver.pointer([{ ...from, down: true }, { ...to, up: true }]);
      const dragged = { ...(await hovered(driver, "left", "right")), left: await driver.attribute("left", "data-log"), right: await driver.attribute("right", "data-log") };
      await driver.pointer([{ x: to.x + 300, y: to.y }]);
      const beyond = await hovered(driver, "left", "right");
      await driver.inputHover("left");
      await driver.inputHover(null);
      const away = await hovered(driver, "left", "right");
      await driver.mount('<ocelle-harness-pad id="pad"></ocelle-harness-pad>');
      await driver.rules(padRules);
      await driver.inputClick("pad", undefined, { button: "right" });
      return { hover, dragged, beyond, away, secondary: await driver.attribute("pad", "data-log") };
    },
    expected: {
      hover: { left: true, right: false },
      dragged: { left: "pointerdown:mouse:0", right: "pointerup:mouse:0" },
      beyond: { left: false, right: false },
      away: { left: false, right: false },
      secondary: "pointerdown:mouse:2 pointerup:mouse:2",
    },
  },
  {
    name: "viewportSize() and viewport(width, height): 1280 × 800, a short 320 × 256 viewport, and back",
    run: async (driver) => {
      const initial = await driver.viewportSize();
      await driver.viewport(320, 256);
      const short = await driver.viewportSize();
      await driver.viewport(initial.width, initial.height);
      return { initial, short, restored: await driver.viewportSize() };
    },
    expected: { initial: { width: 1280, height: 800 }, short: { width: 320, height: 256 }, restored: { width: 1280, height: 800 } },
  },
  {
    name: "reducedMotion(mode): off by default, set, then reset",
    run: async (driver) => {
      await driver.mount("<p>Motion</p>");
      const initial = (await driver.device()).reducedMotion;
      await driver.reducedMotion("reduce");
      const on = (await driver.device()).reducedMotion;
      await driver.reducedMotion("no-preference");
      return { initial, on, off: (await driver.device()).reducedMotion };
    },
    expected: { initial: false, on: true, off: false },
  },
  {
    name: "ax(): a modal dialog's modal flag, a heading's level and a button's description, beside role and name",
    run: async (driver) => {
      await driver.mount('<ocelle-harness-ax id="axh"></ocelle-harness-ax>');
      await driver.setAttribute("axh", "act", "modal");
      const roles = new Set(["dialog", "heading", "button"]);
      return (await driver.ax("axh")).filter((node) => roles.has(node.role));
    },
    expected: [
      { role: "dialog", name: "Panel", modal: true },
      { role: "heading", name: "Title", level: 2 },
      { role: "button", name: "Go", description: "More" },
    ],
  },
  {
    name: "device(): the default context is a mouse device, (hover: hover) and (pointer: fine) with maxTouchPoints 0",
    run: async (driver) => {
      await driver.mount("<p>Device</p>");
      const { hover, pointerFine, maxTouchPoints } = await driver.device();
      return { hover, pointerFine, maxTouchPoints };
    },
    expected: { hover: true, pointerFine: true, maxTouchPoints: 0 },
  },
];

/** The self-tests of the touch context (`elements-touch`, `visit(…, { touch: true })`). */
export const touchScenarios: readonly HarnessScenario[] = [
  {
    name: "device(): the touch context has maxTouchPoints above 0",
    run: async (driver) => {
      await driver.mount("<p>Device</p>");
      return { touch: (await driver.device()).maxTouchPoints > 0 };
    },
    expected: { touch: true },
  },
  {
    name: "touchTap(): a tap on a pad gives a pointerdown and a pointerup of pointer type touch",
    run: async (driver) => {
      await driver.mount('<ocelle-harness-pad id="pad"></ocelle-harness-pad>');
      await driver.rules(padRules);
      await driver.touchTap("pad");
      return await driver.attribute("pad", "data-log");
    },
    expected: "pointerdown:touch:0 pointerup:touch:0",
  },
];
