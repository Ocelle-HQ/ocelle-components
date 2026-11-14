// The slot-state controller (011 research.md R-03, FR-005; data-model.md § Validation rules and § State transitions):
// whether each slot of an element's shadow root is empty by the spec's definition, no element assigned and every
// assigned text node empty or whitespace only (`assignedNodes()`, not flattened). The element renders each slot in a
// wrapper whose class is `empty` while `empty(name)` is true, and styles that class `display: none`, so an empty part
// takes no gap, padding or divider.
// - Every slot reads as empty until the first read, so the first render never shows a wrapper that then disappears.
// - The slots are re-read on `slotchange` in the shadow root (an element or text node assigned or unassigned, a `slot`
//   attribute changed) and on the host's mutation records: `slotchange` does not fire when an assigned text node's
//   data changes, so a `MutationObserver` on the host watches character data in its subtree.
// - The state of each slot is the host's reactive state: the controller asks the host for an update only when a slot's
//   state changed. It is not a property or an attribute and is not in the manifest.
// Both registrations are made on every connection and are idempotent (the same listener, the same observer on the same
// node), so a host that is moved keeps one of each. Internal, not exported from the package root.
import type { LitElement, ReactiveController } from "lit";

/** Tracks, per slot of `host`'s shadow root, whether the slot is empty, and updates `host` when that changes. */
export class SlotState implements ReactiveController {
  readonly #host: LitElement;
  readonly #empty = new Map<string, boolean>();

  /** Re-reads every slot of the shadow root and asks for an update when one changed state. */
  readonly #read = (): void => {
    let changed = false;
    for (const slot of this.#host.renderRoot.querySelectorAll("slot")) {
      const empty = slot.assignedNodes().every((node) => node.nodeType === Node.TEXT_NODE && (node as Text).data.trim() === "");
      if (this.#empty.get(slot.name) !== empty) {
        this.#empty.set(slot.name, empty);
        changed = true;
      }
    }
    if (changed) this.#host.requestUpdate();
  };

  readonly #observer = new MutationObserver(this.#read);

  constructor(host: LitElement) {
    this.#host = host;
    host.addController(this);
  }

  /** Whether the slot named `name` (`""` for the default slot) is empty; true until the slot is first read. */
  empty(name: string): boolean {
    return this.#empty.get(name) ?? true;
  }

  hostConnected(): void {
    this.#host.renderRoot.addEventListener("slotchange", this.#read);
    this.#observer.observe(this.#host, {
      characterData: true,
      // Stryker disable next-line BooleanLiteral: equivalent, a child added to or removed from the host changes a slot's assigned nodes, which fires slotchange, so the child-list records only repeat that read
      childList: true,
      subtree: true,
    });
  }
}
