// The slot-state controller (011 research.md R-03, FR-005; data-model.md § Validation rules): whether each slot of an
// element's shadow root is empty by the spec's definition. Internal, not exported from the package root.
// Scaffold (phase 1): the signatures only; the behaviour comes with T005.
import type { LitElement, ReactiveController } from "lit";

/** Tracks, per slot of `host`'s shadow root, whether the slot is empty. */
export class SlotState implements ReactiveController {
  constructor(host: LitElement) {
    void host;
  }

  /** Whether the slot named `name` (`""` for the default slot) is empty. */
  empty(name: string): boolean {
    void name;
    return false;
  }

  hostConnected(): void {
    // Not implemented (scaffold).
  }
}
