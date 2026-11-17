// The page side of the driver (014 research.md R-07, R-11, T006): one self-contained function that installs, once per
// page, what both harnesses need in the page itself, on `window.__ocelleDriver`. The in-process driver calls it at every
// mount (test/in-process.ts); the fixture installs it with Playwright's `addInitScript` on every page before any page
// script runs (test/browser/serve.ts), and the fixture driver reaches it through `page.evaluate`
// (test/browser/driver.ts). It must not refer to anything outside its own body, since Playwright sends its source.
//
// - `resolve` finds a target: an element's id, the index-th element child of a tag of a parent with an id, or (since the
//   merge of main, 009 research.md R-17) the element matching `inner` in the shadow root of the element with an id.
// - The keydown recorder: a `document` listener in the bubble phase, recording each key and `defaultPrevented`.
// - The clipboard observer (PLAN-TESTABILITY-1-009, SC-006): `navigator.clipboard`'s `write`, `writeText`, `read` and
//   `readText` (on `Clipboard.prototype`) and `document.execCommand` with `copy`, `cut` or `paste` are recorded and
//   never performed; a `copy` or `cut` event whose `clipboardData` is set (`DataTransfer.prototype.setData` wrapped) is
//   recorded too.
// - `focused` names the focused element through shadow roots; `mutate` applies DOM steps synchronously; `activation`
//   installs the record of an activation (research.md R-07).
// `reset` (at every mount) empties the records and removes the activation listeners.
import type { ActivationEntry, ActivationOptions, Focused, Keydown, Step, Target } from "./scenarios/driver.ts";

/** What `installPageHelpers` puts on `window.__ocelleDriver`. */
export interface PageHelpers {
  readonly resolve: (target: Target) => HTMLElement;
  readonly keydowns: Keydown[];
  readonly clipboard: string[];
  readonly activations: ActivationEntry[];
  readonly focused: () => Focused | null;
  readonly mutate: (target: Target, steps: readonly Step[]) => void;
  readonly activation: (target: Target, options: ActivationOptions) => void;
  readonly reset: () => void;
}

/** The page's helpers; `installPageHelpers` must have run in it. */
export function pageHelpers(): PageHelpers {
  const helpers = (window as unknown as { __ocelleDriver?: PageHelpers }).__ocelleDriver;
  if (helpers === undefined) throw new Error("the driver's page helpers are not installed");
  return helpers;
}

/** Installs the helpers on `window.__ocelleDriver`, once per page. Self-contained: Playwright sends its source. */
export function installPageHelpers(): void {
  const scope = window as unknown as { __ocelleDriver?: PageHelpers };
  if (scope.__ocelleDriver !== undefined) return;
  const keydowns: Keydown[] = [];
  const clipboard: string[] = [];
  const activations: ActivationEntry[] = [];
  const cleanups: (() => void)[] = [];

  const resolve = (target: Target): HTMLElement => {
    if (typeof target === "string") {
      const found = document.getElementById(target);
      if (found === null) throw new Error(`no #${target} on the page`);
      return found;
    }
    if ("inner" in target) {
      const found = document.getElementById(target.id)?.shadowRoot?.querySelector<HTMLElement>(target.inner);
      if (found === null || found === undefined) throw new Error(`no ${target.inner} in the shadow root of #${target.id}`);
      return found;
    }
    const parent = document.getElementById(target.parent);
    if (parent === null) throw new Error(`no #${target.parent} on the page`);
    const found = [...parent.children].filter((child) => child.localName === target.kind)[target.index];
    if (found === undefined) throw new Error(`no ${target.kind} ${String(target.index)} in #${target.parent}`);
    return found as HTMLElement;
  };

  document.addEventListener("keydown", (event) => {
    keydowns.push({ key: event.key, defaultPrevented: event.defaultPrevented });
  });

  const clipboardMethods: readonly [string, () => unknown][] = [
    ["write", () => undefined],
    ["writeText", () => undefined],
    ["read", () => []],
    ["readText", () => ""],
  ];
  if (typeof Clipboard !== "undefined") {
    for (const [name, result] of clipboardMethods) {
      Object.defineProperty(Clipboard.prototype, name, {
        configurable: true,
        writable: true,
        value: () => {
          clipboard.push(`navigator.clipboard.${name}`);
          return Promise.resolve(result());
        },
      });
    }
  }
  // Read through Reflect: `execCommand` is deprecated, and what the observer must still catch.
  const execCommand: (this: Document, command: string, showUI?: boolean, value?: string) => boolean = Reflect.get(Document.prototype, "execCommand");
  Object.defineProperty(Document.prototype, "execCommand", {
    configurable: true,
    writable: true,
    value: function (this: Document, command: string, showUI?: boolean, value?: string): boolean {
      const name = command.toLowerCase();
      if (name === "copy" || name === "cut" || name === "paste") {
        clipboard.push(`document.execCommand ${name}`);
        return false;
      }
      return execCommand.call(this, command, showUI, value);
    },
  });
  const clipboardEvents = new WeakMap<DataTransfer, string>();
  for (const type of ["copy", "cut"]) {
    window.addEventListener(
      type,
      (event) => {
        const data = (event as ClipboardEvent).clipboardData;
        if (data !== null) clipboardEvents.set(data, type);
      },
      { capture: true },
    );
  }
  const setData: (this: DataTransfer, format: string, data: string) => void = Reflect.get(DataTransfer.prototype, "setData");
  Object.defineProperty(DataTransfer.prototype, "setData", {
    configurable: true,
    writable: true,
    value: function (this: DataTransfer, format: string, data: string): void {
      const type = clipboardEvents.get(this);
      if (type !== undefined) clipboard.push(`${type} event setData`);
      setData.call(this, format, data);
    },
  });

  const focused = (): Focused | null => {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    if (active === null || active === document.body || active === document.documentElement) return null;
    if (active.id !== "") return { id: active.id };
    const root = active.getRootNode();
    const part = active.getAttribute("part");
    if (root instanceof ShadowRoot && part !== null && root.host.id !== "") return { host: root.host.id, part };
    const parent = active.parentElement;
    const kind = active.localName;
    if (parent !== null && parent.id !== "") return { parent: parent.id, kind, index: [...parent.children].filter((child) => child.localName === kind).indexOf(active) };
    return { unidentified: kind };
  };

  const childOf = (element: HTMLElement, index: number): HTMLElement => {
    const found = element.children[index];
    if (found === undefined) throw new Error(`no child ${String(index)} of the mutated element`);
    return found as HTMLElement;
  };

  const mutate = (target: Target, steps: readonly Step[]): void => {
    const element = resolve(target);
    for (const step of steps) {
      if ("append" in step) element.insertAdjacentHTML("beforeend", step.append);
      else if ("remove" in step) childOf(element, step.remove).remove();
      else if ("move" in step) element.insertBefore(childOf(element, step.move), step.before === "end" ? null : childOf(element, step.before));
      else if ("reinsert" in step) {
        const child = childOf(element, step.reinsert);
        const next = child.nextSibling;
        child.remove();
        element.insertBefore(child, next);
      } else if ("attribute" in step) {
        const child = childOf(element, step.child);
        if (step.value === null) child.removeAttribute(step.attribute);
        else child.setAttribute(step.attribute, step.value);
      } else {
        const owner = step.child === undefined ? element : childOf(element, step.child);
        (owner as unknown as Record<string, unknown>)[step.property] = step.value;
      }
    }
  };

  const activation = (target: Target, options: ActivationOptions): void => {
    const element = resolve(target);
    let requests = 0;
    const text = (): string | null => {
      if (options.read === undefined) return null;
      return (element.shadowRoot ?? element).querySelector(options.read)?.textContent ?? null;
    };
    const value = (): unknown => (options.property === undefined ? null : (element as unknown as Record<string, unknown>)[options.property]);
    const push = (entry: ActivationEntry["entry"]): void => {
      activations.push({ entry, requests, text: text(), value: value() });
    };
    const ours = (event: Event): boolean => event.composedPath().includes(element);
    const capture = (event: Event): void => {
      if (!ours(event)) return;
      push("activation");
      requestAnimationFrame(() => {
        push("frame");
      });
    };
    const bubble = (event: Event): void => {
      if (ours(event)) push("activation end");
    };
    const request = (event: Event): void => {
      if (!ours(event)) return;
      push("request");
      requests += 1;
    };
    document.addEventListener("click", capture, { capture: true });
    document.addEventListener("click", bubble);
    document.addEventListener(options.request, request);
    cleanups.push(() => {
      document.removeEventListener("click", capture, { capture: true });
      document.removeEventListener("click", bubble);
      document.removeEventListener(options.request, request);
    });
  };

  const reset = (): void => {
    keydowns.length = 0;
    clipboard.length = 0;
    activations.length = 0;
    for (const cleanup of cleanups.splice(0)) cleanup();
  };

  scope.__ocelleDriver = { resolve, keydowns, clipboard, activations, focused, mutate, activation, reset };
}
