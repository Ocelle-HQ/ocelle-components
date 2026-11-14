// The control conventions (012 spec FR-001 to FR-006; research.md R-01, R-06, R-12; data-model.md § Shared: the
// control), internal, shared by `ocelle-button` and the controls after it. Phase 2 holds button mode:
// - `guardHost`: the host guard (plan decision 23, PLAN-FRESH-3-001 (a)). A page rule on the element (its `display`,
//   `width` or `height`) outranks the element's `:host` styles and can leave host area outside the inner control, so
//   the element listens for `click` and `auxclick` on the host itself, from its constructor (before any host listener
//   added after upgrade), and stops (`preventDefault()` and `stopImmediatePropagation()`) every such event whose
//   composed path does not pass through the inner control, in every state, and every such event while the control is
//   not available. A click outside the inner control therefore never activates the element; a synthetic click
//   dispatched on the host is such a click.
// - `controlStyles`: the token focus ring on the inner control's `:focus-visible`, drawn with the `outline` longhands
//   outside the control (mission 005 finding: the shorthand with `var()` fails in Chromium), and the forced-colours
//   table of research.md R-12 for button mode: `ButtonText` text and border, `Highlight` for the hover and active
//   border and the focus ring, `GrayText` when disabled.
// The disabled look of each variant, and the `.icon-slot[hidden]` rule (src/icon-slot.ts), live with the element and
// the slot convention.
import { css } from "lit";

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

/** The shared control styles: the focus ring and the forced-colours table of button mode (research.md R-12). */
export const controlStyles = css`
  .control:focus-visible {
    outline-style: solid;
    outline-width: var(--ocelle-focus-width);
    outline-color: var(--ocelle-color-focus);
    outline-offset: var(--ocelle-focus-offset);
  }

  @media (forced-colors: active) {
    .control {
      color: ButtonText;
      border-color: ButtonText;
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
