// Plant for the prefix check.
export function select(target) {
  target.dispatchEvent(new CustomEvent("sk-select", { bubbles: true, composed: true }));
}
