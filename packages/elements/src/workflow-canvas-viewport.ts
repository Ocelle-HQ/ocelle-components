import type { WorkflowCanvasPoint, WorkflowCanvasViewport } from "./workflow-canvas-types.ts";

export interface CanvasBounds {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

// Computed overflow reports the legacy `overlay` keyword as `auto`.
const clippingOverflow = new Set(["auto", "clip", "hidden", "scroll"]);

export function* composedAncestors(element: Element): Generator<Element> {
  let current: Element = element;
  for (;;) {
    const root = current.getRootNode();
    const parent = current.assignedSlot ?? current.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
    if (parent === null) return;
    yield parent;
    current = parent;
  }
}

export function effectiveCanvasClip(element: Element): CanvasBounds {
  const rect = element.getBoundingClientRect();
  const viewport = element.ownerDocument.documentElement;
  let left = Math.max(0, rect.left);
  let top = Math.max(0, rect.top);
  let right = Math.min(viewport.clientWidth, rect.right);
  let bottom = Math.min(viewport.clientHeight, rect.bottom);
  for (const ancestor of composedAncestors(element)) {
    const style = getComputedStyle(ancestor);
    const containment = style.contain;
    // Boxless and non-atomic inline wrappers do not establish a paint clip.
    const clipsPaint = style.display !== "contents" && style.display !== "inline"
      && (containment === "content" || containment === "strict" || containment.split(" ").includes("paint"));
    const clipsX = clipsPaint || clippingOverflow.has(style.overflowX);
    const clipsY = clipsPaint || clippingOverflow.has(style.overflowY);
    if (!clipsX && !clipsY) continue;
    const pane = ancestor.getBoundingClientRect();
    const scaleX = ancestor instanceof HTMLElement && ancestor.offsetWidth > 0 ? pane.width / ancestor.offsetWidth : 1;
    const scaleY = ancestor instanceof HTMLElement && ancestor.offsetHeight > 0 ? pane.height / ancestor.offsetHeight : 1;
    const x = pane.left + ancestor.clientLeft * scaleX;
    const y = pane.top + ancestor.clientTop * scaleY;
    if (clipsX) {
      left = Math.max(left, x);
      right = Math.min(right, x + ancestor.clientWidth * scaleX);
    }
    if (clipsY) {
      top = Math.max(top, y);
      bottom = Math.min(bottom, y + ancestor.clientHeight * scaleY);
    }
  }
  return { left, top, right, bottom };
}

export function isInsideCanvasClip(clip: CanvasBounds, target: CanvasBounds): boolean {
  return target.left < target.right && target.top < target.bottom
    && clip.left <= target.left && clip.right >= target.right
    && clip.top <= target.top && clip.bottom >= target.bottom;
}

export function canvasBoundsOverlap(first: CanvasBounds, second: CanvasBounds): boolean {
  return first.left < second.right && second.left < first.right
    && first.top < second.bottom && second.top < first.bottom;
}

export function canvasActionBounds(action: HTMLButtonElement, transform: DOMMatrix | null): CanvasBounds {
  const { left, top, right, bottom } = action.getBoundingClientRect();
  const style = getComputedStyle(action);
  const outset = Math.max(0, (parseFloat(style.getPropertyValue("--ocelle-focus-offset")) || 0)
    + (parseFloat(style.getPropertyValue("--ocelle-focus-width")) || 0));
  const x = transform === null ? outset : outset * Math.hypot(transform.a, transform.c);
  const y = transform === null ? outset : outset * Math.hypot(transform.b, transform.d);
  return { left: left - x, top: top - y, right: right + x, bottom: bottom + y };
}

export function canvasViewport(viewport: WorkflowCanvasViewport): WorkflowCanvasViewport {
  const { x, y, scale } = viewport;
  return Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(scale) && scale > 0
    ? viewport : { x: 0, y: 0, scale: 1 };
}

export function canvasViewportPoint(point: WorkflowCanvasPoint, view: WorkflowCanvasViewport): WorkflowCanvasPoint {
  return { x: point.x * view.scale + view.x, y: point.y * view.scale + view.y };
}

function allFinite(values: readonly number[] | Float64Array): boolean {
  return values.find((value) => !Number.isFinite(value)) === undefined;
}

export function canvasScreenInverse(map: SVGSVGElement): DOMMatrix | null {
  const transform = map.getScreenCTM();
  if (transform === null || map.getClientRects().length === 0) return null;
  // The legacy SVG matrix can throw when a host transform temporarily has zero scale.
  const inverse = DOMMatrix.fromMatrix(transform).invertSelf();
  return allFinite(inverse.toFloat64Array()) ? inverse : null;
}

export function canvasRevealViewport(
  view: WorkflowCanvasViewport,
  map: SVGSVGElement,
  action: HTMLButtonElement,
): WorkflowCanvasViewport | null {
  const inverse = canvasScreenInverse(map);
  if (inverse === null) return null;
  const actionBounds = canvasActionBounds(action, map.getScreenCTM());
  const clip = effectiveCanvasClip(map);
  const fits = clip.right - clip.left >= actionBounds.right - actionBounds.left
    && clip.bottom - clip.top >= actionBounds.bottom - actionBounds.top;
  const target = fits ? clip : map.getBoundingClientRect();
  const delta = new DOMPoint(
    (target.left + target.right - actionBounds.left - actionBounds.right) / 2,
    (target.top + target.bottom - actionBounds.top - actionBounds.bottom) / 2,
    0,
    0,
  ).matrixTransform(inverse);
  return allFinite([delta.x, delta.y])
    ? { x: view.x + delta.x, y: view.y + delta.y, scale: view.scale } : null;
}
