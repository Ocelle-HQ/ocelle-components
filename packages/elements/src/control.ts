// The control conventions (012 spec FR-001 to FR-006; research.md R-01 to R-06, R-12; data-model.md § Shared: the
// control), internal, shared by `ocelle-button` and the controls after it:
// - `linkHref`: link versus button (FR-002, research.md R-02). Link mode exactly when `href` is not empty or whitespace
//   only, parses as a URL against the document's base URL, and its scheme as the URL parser reads it is not
//   `javascript:` (so `JAVASCRIPT:`, `java\tscript:` and a leading space or control character count); an `href` that
//   does not parse is button mode, with no error. `data:` and `vbscript:` are link mode, left to the host.
// - `MovedAttributes`: the attribute move (FR-004, research.md R-03; plan decisions 19, 22 and 24). Each listed
//   attribute set on the host is stored as written and removed from the host; an empty or whitespace-only value clears
//   it; the element's own removal, and a host's later `removeAttribute`, change nothing. Each stored value is mirrored in
//   the element-owned host attribute `data-ocelle-moved-<attribute>`, read back at the first connection (upgrade) for an
//   attribute the host did not set, and written back when it is removed or changed while a value is held (a morphing
//   swap removes it); the element's own writes, which equal the stored value, are ignored, so there is no loop.
// - `resolveIds`: ID references resolved by id in the host's own tree (its document or the shadow root it is in), in
//   order, ids not found skipped, for element reflection on the inner control (FR-005, research.md R-04).
// - `controlState`: disabled versus unavailable (FR-003; data-model.md § Shared: the control). Disabled wins; a control
//   that is not disabled and is unavailable (a busy button, an unavailable row) is unavailable; else it is available.
//   An unavailable control stays in the tab order, reports `aria-disabled="true"`, is not activated, and in link mode
//   renders no `href` and `tabindex="0"`, so it stays a focusable node of role `link` (plan decision 9).
// - `guardHost`: the host guard (plan decision 23, PLAN-FRESH-3-001 (a)). A page rule on the element (its `display`,
//   `width` or `height`) outranks the element's `:host` styles and can leave host area outside the inner control, so
//   the element listens for `click` and `auxclick` on the host itself, from its constructor (before any host listener
//   added after upgrade), and stops (`preventDefault()` and `stopImmediatePropagation()`) every such event whose
//   composed path does not pass through the inner control, in every state, and every such event while the control is
//   not available. A click outside the inner control therefore never activates the element; a synthetic click
//   dispatched on the host is such a click.
// - `controlStyles`: the token focus ring on the inner control's `:focus-visible`, drawn with the `outline` longhands
//   outside the control (mission 005 finding: the shorthand with `var()` fails in Chromium), a link's underline
//   removed (both modes look the same, FR-002), and the forced-colours table of research.md R-12: `ButtonText` text and
//   border in button mode, `LinkText` in link mode (on `Canvas`, which a native button's `ButtonFace` gives it in
//   button mode), `Highlight` for the hover and active border and the focus ring, `GrayText` when disabled.
// The disabled look of each variant, and the `.icon-slot[hidden]` rule (src/icon-slot.ts), live with the element and
// the slot convention.
import { css } from "lit";

/** The `href` a control renders in link mode, as written, or undefined for button mode (FR-002; research.md R-02). */
export function linkHref(href: string | null | undefined, base: string): string | undefined {
  if (href === undefined || href === null || href.trim() === "") return undefined;
  let url: URL;
  try {
    url = new URL(href, base);
  } catch {
    return undefined;
  }
  return url.protocol === "javascript:" ? undefined : href;
}

/** A control's state (FR-003): available, unavailable (in the tab order, not activated) or disabled. */
export type ControlState = "available" | "unavailable" | "disabled";

/** The state of a control from its `disabled` and its unavailable condition (a busy button): disabled wins. */
export function controlState(disabled: boolean, unavailable: boolean): ControlState {
  if (disabled) return "disabled";
  return unavailable ? "unavailable" : "available";
}

/** The element-owned host attribute that mirrors a moved attribute (research.md R-03). */
export function mirrorOf(name: string): string {
  return `data-ocelle-moved-${name}`;
}

/**
 * The attributes a control moves from its host onto its inner control, with their mirrors (FR-004; research.md R-03).
 * The element observes `observed()`, hands every change of them to `handle` (a change of any other attribute is
 * ignored), calls `connected()` from its `connectedCallback` and reads the stored values with `get`; `changed` is told
 * the name of each moved attribute whose stored value was set or cleared.
 */
export class MovedAttributes {
  readonly #host: HTMLElement;
  readonly #names: readonly string[];
  readonly #changed: (name: string) => void;
  readonly #values = new Map<string, string>();
  #upgraded = false;

  constructor(host: HTMLElement, names: readonly string[], changed: (name: string) => void) {
    this.#host = host;
    this.#names = names;
    this.#changed = changed;
  }

  /** The moved attributes and their mirrors, for the element's `observedAttributes`. */
  static observed(names: readonly string[]): string[] {
    return [...names, ...names.map(mirrorOf)];
  }

  /** Handles a change of an observed attribute: a moved attribute is stored, a mirror restored. */
  handle(name: string, value: string | null): void {
    if (this.#names.includes(name)) {
      if (value !== null) this.#store(name, value);
      return;
    }
    const moved = this.#names.find((each) => mirrorOf(each) === name);
    const held = moved === undefined ? undefined : this.#values.get(moved);
    if (held !== undefined && value !== held) this.#host.setAttribute(name, held);
  }

  /** At the first connection (the upgrade), reads back the mirror of each attribute the host did not set. */
  connected(): void {
    if (this.#upgraded) return;
    this.#upgraded = true;
    for (const name of this.#names) {
      const mirror = this.#host.getAttribute(mirrorOf(name));
      if (mirror !== null && !this.#values.has(name)) this.#values.set(name, mirror);
    }
  }

  /** The stored value of a moved attribute, as written, or undefined when none is held. */
  get(name: string): string | undefined {
    return this.#values.get(name);
  }

  #store(name: string, value: string): void {
    if (value.trim() === "") {
      this.#values.delete(name);
      this.#host.removeAttribute(mirrorOf(name));
    } else {
      this.#values.set(name, value);
      this.#host.setAttribute(mirrorOf(name), value);
    }
    this.#host.removeAttribute(name);
    this.#changed(name);
  }
}

/**
 * The elements an ID-reference value names, looked up in `host`'s own tree (its document or the shadow root it is in),
 * in order, ids not found skipped; none while `host` is not connected (research.md R-04).
 */
export function resolveIds(host: Element, value: string | undefined): Element[] {
  if (value === undefined || !host.isConnected) return [];
  const root = host.getRootNode() as Document | ShadowRoot;
  // An empty id (around the separators) finds nothing: `getElementById("")` is null.
  return value.split(/\s/).flatMap((id) => {
    const found = root.getElementById(id);
    return found === null ? [] : [found];
  });
}

/**
 * Registers the host guard on `host`: a `click` or `auxclick` at the host whose composed path misses the inner control
 * (`control()`, null before the first render), or any while `available()` is false, is prevented and stopped.
 */
export function guardHost(host: HTMLElement, control: () => Element | null, available: () => boolean): void {
  const guard = (event: Event): void => {
    const inner = control();
    if (inner !== null && available() && event.composedPath().includes(inner)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  host.addEventListener("click", guard);
  host.addEventListener("auxclick", guard);
}

/**
 * The shared control styles: the focus ring, a link without its underline, and the forced-colours table of research.md
 * R-12 (`ButtonText` in button mode, `LinkText` in link mode).
 */
export const controlStyles = css`
  .control:focus-visible {
    outline-style: solid;
    outline-width: var(--ocelle-focus-width);
    outline-color: var(--ocelle-color-focus);
    outline-offset: var(--ocelle-focus-offset);
  }

  a.control {
    text-decoration-line: none;
  }

  @media (forced-colors: active) {
    .control {
      color: ButtonText;
      border-color: ButtonText;
    }

    a.control {
      color: LinkText;
      border-color: LinkText;
      background-color: Canvas;
    }

    .control:hover,
    .control:active {
      border-color: Highlight;
    }

    .control:focus-visible {
      outline-color: Highlight;
    }

    .control:disabled {
      color: GrayText;
      border-color: GrayText;
    }
  }
`;
