// The fractional overflow measure of 018 (research.md R-09, R-11; contracts/checks.md § Test harness row 8), used by
// both drivers through `readOverflows` (test/commands.ts): the in-process `overflows` browser command and the fixture
// driver run it in their frame with `evaluate`, so it is self-contained (no import, no outer name). `scrollWidth` and
// `clientWidth` are integers and miss an overflow below about 0.5 px, which `text-overflow: ellipsis` still draws; a
// `Range`'s box is unclipped layout geometry under the ellipsis (reviews/phase-1/spikes.md § R-09), so the content's
// inline extent is a `Range` from before the first to after the last node assigned to the first `slot` in the target
// (its own child nodes when it holds none), compared in fractional CSS pixels with the target's content box.
import type { ElementTarget } from "./scenarios/driver.ts";

/** Whether the target's content passes the inline end of its content box (the inline start when right-to-left) by more than 0. */
export function overflowOf(target: ElementTarget): boolean {
  const host = document.getElementById(typeof target === "string" ? target : target.id);
  const element = typeof target === "string" ? host : (host?.shadowRoot?.querySelector(target.inner) ?? null);
  if (element === null) throw new Error(`no target ${JSON.stringify(target)} on the page`);
  const slot = element.querySelector("slot");
  const nodes: Node[] = slot === null ? [...element.childNodes] : slot.assignedNodes({ flatten: true });
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (first === undefined || last === undefined) return false;
  const range = document.createRange();
  range.setStartBefore(first);
  range.setEndAfter(last);
  const content = range.getBoundingClientRect();
  const box = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  if (style.direction === "rtl") return box.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft) - content.left > 0;
  return content.right - (box.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight)) > 0;
}
