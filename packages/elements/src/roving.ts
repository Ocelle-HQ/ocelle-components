// The keyboard mechanism of the selection parents (014 FR-005, FR-013, FR-015; research.md R-04; data-model.md § Roving
// input). Internal, not an entry point and not in the manifest. Two pure functions, tested with no DOM in the in-process
// project Stryker runs (test/roving.test.ts):
// - `target(key, move)`: the index a key moves focus to among the parent's children, or null for a key that is not a
//   move of the parent's axis. `block` (listbox): ArrowDown and ArrowUp; `inline` (tabs): ArrowRight and ArrowLeft,
//   swapped under right-to-left; `both` (segmented choice): ArrowRight and ArrowDown forward, ArrowLeft and ArrowUp
//   back, Left and Right swapped under right-to-left; Home and End in each, to the first and the last enabled child.
//   Moves skip disabled children, which stay in the list; with no enabled child in the direction a move stays on the
//   focused child (or, wrapping, comes round), and with no enabled child at all every move is null.
// - `owns(event, children)`: the origin filter. A parent host receives every keydown of its light-DOM descendants (a
//   tab panel's content, a control inside a child, a nested parent's children); it acts only on a keydown whose target
//   is one of its own children itself and whose default no nested control has prevented.
// `RovingController`, a Lit reactive controller each parent owns, listens to `keydown` on the host, applies the filter,
// asks the parent on Enter and Space, moves focus for a move, and prevents the default of the keys it handles only;
// it never stops propagation, so a containing dialog still receives Escape.
import type { ReactiveController, ReactiveControllerHost } from "lit";

/** The axis a parent's arrow keys move along: `block` (listbox), `inline` (tabs) or `both` (segmented choice). */
export type Axis = "block" | "inline" | "both";

/** Where focus is and how the parent moves it. */
export interface Move {
  /** The index of the focused child among the parent's children. */
  readonly index: number;
  /** Per child, whether it is enabled (disabled children stay in the list, skipped by every move). */
  readonly enabled: readonly boolean[];
  readonly wrap: boolean;
  readonly rtl: boolean;
  readonly axis: Axis;
}

/** The direction of an arrow key on an axis: 1 forward, -1 back, 0 not a move of the axis. */
function direction(key: string, axis: Axis, rtl: boolean): number {
  const inline = rtl ? -1 : 1;
  if (axis !== "inline" && key === "ArrowDown") return 1;
  if (axis !== "inline" && key === "ArrowUp") return -1;
  if (axis !== "block" && key === "ArrowRight") return inline;
  if (axis !== "block" && key === "ArrowLeft") return -inline;
  return 0;
}

/** The index a key moves focus to, or null for a key that is not a move of this axis. */
export function target(key: string, move: Move): number | null {
  const { index, enabled } = move;
  const first = enabled.indexOf(true);
  if (key === "Home" || key === "End") return first === -1 ? null : key === "Home" ? first : enabled.lastIndexOf(true);
  const step = direction(key, move.axis, move.rtl);
  if (step === 0 || first === -1) return null;
  // The children in the order the key walks them from the focused one, coming round only when the parent wraps.
  const all = enabled.map((_, at) => at);
  const ahead = step === 1 ? all.slice(index + 1) : all.slice(0, index).reverse();
  // Stryker disable next-line MethodExpression,ArithmeticOperator: equivalent, `behind` is read only after every child `ahead` was found disabled, so a longer list that repeats them, or adds the focused child, finds the same child or falls back to it
  const behind = step === 1 ? all.slice(0, index) : all.slice(index + 1).reverse();
  return (move.wrap ? [...ahead, ...behind] : ahead).find((at) => enabled[at] === true) ?? index;
}

/** What the origin filter reads of a keydown. */
export interface KeyOrigin {
  readonly target: EventTarget | null;
  readonly defaultPrevented: boolean;
}

/** Whether a keydown is the parent's to handle: its target is one of `children` itself and it is not handled yet. */
export function owns(event: KeyOrigin, children: readonly unknown[]): boolean {
  return !event.defaultPrevented && children.includes(event.target);
}

/** What a parent tells its controller. */
export interface RovingOptions {
  readonly axis: Axis;
  readonly wrap: boolean;
  /** The parent's children, in document order. */
  readonly children: () => readonly HTMLElement[];
  readonly enabled: (child: HTMLElement) => boolean;
  /** Enter or Space on a child. */
  readonly choose: (child: HTMLElement, key: "Enter" | " ") => void;
}

/** The parent's keydown handling: the origin filter, the key map and the focus move. */
export class RovingController implements ReactiveController {
  readonly #host: ReactiveControllerHost & HTMLElement;
  readonly #options: RovingOptions;

  constructor(host: ReactiveControllerHost & HTMLElement, options: RovingOptions) {
    this.#host = host;
    this.#options = options;
    host.addController(this);
  }

  hostConnected(): void {
    this.#host.addEventListener("keydown", this.#keydown);
  }

  // Stryker disable next-line BlockStatement: equivalent, a detached host receives no keydown, and the listener a re-connected host adds again finds every key it shares with the first already handled (`owns` reads `defaultPrevented`)
  hostDisconnected(): void {
    this.#host.removeEventListener("keydown", this.#keydown);
  }

  readonly #keydown = (event: KeyboardEvent): void => {
    const children = this.#options.children();
    if (!owns(event, children)) return;
    const child = event.target as HTMLElement;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.#options.choose(child, event.key);
      return;
    }
    const rtl = getComputedStyle(this.#host).direction === "rtl";
    const index = target(event.key, { index: children.indexOf(child), enabled: children.map(this.#options.enabled), wrap: this.#options.wrap, rtl, axis: this.#options.axis });
    if (index === null) return;
    event.preventDefault();
    // Focus scrolls the child into view, its scroll margin included (FR-017).
    // Stryker disable next-line ObjectLiteral,BooleanLiteral: equivalent in Chromium, whose focus heuristic shows the ring after a keyboard-driven focus() anyway
    children[index]?.focus({ focusVisible: true });
  };
}
