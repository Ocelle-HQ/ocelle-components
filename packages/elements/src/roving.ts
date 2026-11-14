// The keyboard mechanism of the selection parents (014 research.md R-04; data-model.md § Roving input). Internal, not
// an entry point and not in the manifest. Scaffold: signatures only.
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

/** The index a key moves focus to, or null for a key that is not a move of this axis. */
export function target(_key: string, _move: Move): number | null {
  return null;
}

/** What the origin filter reads of a keydown. */
export interface KeyOrigin {
  readonly target: EventTarget | null;
  readonly defaultPrevented: boolean;
}

/** Whether a keydown is the parent's to handle: its target is one of `children` itself and it is not handled yet. */
export function owns(_event: KeyOrigin, _children: readonly unknown[]): boolean {
  return false;
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
  constructor(_host: ReactiveControllerHost & HTMLElement, _options: RovingOptions) {}

  hostConnected(): void {}

  hostDisconnected(): void {}
}
