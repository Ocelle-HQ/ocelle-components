import type { WorkflowCanvasPoint, WorkflowCanvasViewport } from "./workflow-canvas-types.ts";

export interface CanvasBounds {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

// Computed overflow reports the legacy `overlay` keyword as `auto`.
const clippingOverflow = new Set(["auto", "clip", "hidden", "scroll"]);
type CanvasClipContour = readonly [WorkflowCanvasPoint, ...WorkflowCanvasPoint[]];

// Restrict polygon geometry to the browser's resolved straight vertices in the default box.
const linearPolygon = /polygon\((?:evenodd, )?((?:-?[\d.]+(?:px|%) -?[\d.]+(?:px|%)(?:, )?)+)\)/;

// Computed CSS keeps percentages and combines mixed pixel/percentage lengths as calc().
const rectangularInset = /inset\(((?:[\d.%px -]|calc\(-?[\d.]+% [+-] [\d.]+px\))+)\)(?: (padding-box|content-box|margin-box))?/;
const insetValues = /calc\([^)]+\)|[^ ]+/g;

function screenInset(value: string, span: number, scale: number): number {
  if (value.startsWith("calc(")) {
    const [percent, operator, pixels] = value.slice(5, -1).split(" ") as [string, string, string];
    const absolute = parseFloat(pixels) * scale;
    return span * (parseFloat(percent) / 100) + (operator === "-" ? -absolute : absolute);
  }
  const length = parseFloat(value);
  return value.endsWith("%") ? span * (length / 100) : length * scale;
}

function insetAxis(start: number, end: number, near: string, far: string, scale: number): readonly [number, number] {
  const span = end - start;
  const first = screenInset(near, span, scale);
  const last = screenInset(far, span, scale);
  const total = first + last;
  if (total > span) {
    // CSS proportionally reduces opposing insets when the pair exceeds the reference box.
    const edge = start + span * (first / total);
    return [edge, edge];
  }
  return [start + first, end - last];
}

function insetReferenceBox(pane: CanvasBounds, style: CSSStyleDeclaration, box: string | undefined, scaleX: number, scaleY: number): CanvasBounds {
  if (box === undefined) return pane;
  if (box === "margin-box") {
    return {
      left: pane.left - parseFloat(style.marginLeft) * scaleX,
      right: pane.right + parseFloat(style.marginRight) * scaleX,
      top: pane.top - parseFloat(style.marginTop) * scaleY,
      bottom: pane.bottom + parseFloat(style.marginBottom) * scaleY,
    };
  }
  const content = box === "content-box";
  return {
    left: pane.left + scaleX * (parseFloat(style.borderLeftWidth) + (content ? parseFloat(style.paddingLeft) : 0)),
    right: pane.right - scaleX * (parseFloat(style.borderRightWidth) + (content ? parseFloat(style.paddingRight) : 0)),
    top: pane.top + scaleY * (parseFloat(style.borderTopWidth) + (content ? parseFloat(style.paddingTop) : 0)),
    bottom: pane.bottom - scaleY * (parseFloat(style.borderBottomWidth) + (content ? parseFloat(style.paddingBottom) : 0)),
  };
}

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

function hasUntransformedClipBox(element: Element): boolean {
  return element.getClientRects().length === 1 && [element, ...composedAncestors(element)].every((ancestor) => {
    const style = getComputedStyle(ancestor);
    const transforms = [style.transform, style.rotate, style.scale, style.perspective, style.offsetPath];
    return ancestor instanceof HTMLElement && transforms.every((value) => value === "none") && style.zoom === "1";
  });
}

function polygonContour(coordinates: string, pane: DOMRect): CanvasClipContour {
  return coordinates.split(", ").map((pair) => {
    const [x, y] = pair.split(" ") as [string, string];
    return { x: pane.left + screenInset(x, pane.width, 1), y: pane.top + screenInset(y, pane.height, 1) };
  }) as [WorkflowCanvasPoint, ...WorkflowCanvasPoint[]];
}

function contourBounds(contour: CanvasClipContour): CanvasBounds {
  let { x: left, y: top } = contour[0];
  let right = left;
  let bottom = top;
  for (const { x, y } of contour) {
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
  }
  return { left, top, right, bottom };
}

function segmentInterval(start: number, end: number, low: number, high: number): readonly [number, number] {
  const delta = end - start;
  // A parallel line inside the slab yields an unbounded interval. At a shared boundary, NaN fails the open overlap check.
  const first = (low - start) / delta;
  const last = (high - start) / delta;
  return [Math.min(first, last), Math.max(first, last)];
}

export function canvasContourCrossesOutline(contour: CanvasClipContour, outline: CanvasBounds): boolean {
  return contour.some((start, index) => {
    const end = contour[index + 1] ?? contour[0];
    const [minX, maxX] = segmentInterval(start.x, end.x, outline.left, outline.right);
    const [minY, maxY] = segmentInterval(start.y, end.y, outline.top, outline.bottom);
    return Math.max(0, minX, minY) < Math.min(1, maxX, maxY);
  });
}

export function canvasClipping(element: Element): {
  readonly bounds: CanvasBounds;
  readonly hasInset: boolean;
  readonly contours: readonly CanvasClipContour[];
} {
  const rect = element.getBoundingClientRect();
  const viewport = element.ownerDocument.documentElement;
  let left = Math.max(0, rect.left);
  let top = Math.max(0, rect.top);
  let right = Math.min(viewport.clientWidth, rect.right);
  let bottom = Math.min(viewport.clientHeight, rect.bottom);
  let hasInset = false;
  const contours: CanvasClipContour[] = [];
  for (const ancestor of composedAncestors(element)) {
    const style = getComputedStyle(ancestor);
    if (style.display === "contents") continue;
    const containment = style.contain;
    // A non-atomic inline HTML wrapper establishes neither an overflow nor a paint clip.
    const inline = style.display === "inline";
    const clipsPaint = !inline
      && (containment === "content" || containment === "strict" || containment.split(" ").includes("paint"));
    const hasOverflowBox = !inline || ancestor instanceof SVGElement;
    const clipsX = clipsPaint || (hasOverflowBox && clippingOverflow.has(style.overflowX));
    const clipsY = clipsPaint || (hasOverflowBox && clippingOverflow.has(style.overflowY));
    const clipPath = style.clipPath;
    hasInset ||= clipPath.startsWith("inset(");
    // Resolve the outer rectangle for the viewport proposal. Chromium tests the actual rounded corners.
    const rounding = clipPath.indexOf(" round ");
    const square = rounding === -1 ? clipPath : clipPath.slice(0, rounding) + clipPath.slice(clipPath.lastIndexOf(")"));
    const inset = rectangularInset.exec(square);
    const offsets = inset?.[0] === square ? inset[1] : undefined;
    const referenceBox = inset?.[2];
    const polygon = linearPolygon.exec(clipPath);
    const coordinates = polygon?.[0] === clipPath && hasUntransformedClipBox(ancestor) ? polygon[1] : undefined;
    if (!clipsX && !clipsY && offsets === undefined && coordinates === undefined) continue;
    const pane = ancestor.getBoundingClientRect();
    const scaleX = ancestor instanceof HTMLElement && ancestor.offsetWidth > 0 ? pane.width / ancestor.offsetWidth : 1;
    const scaleY = ancestor instanceof HTMLElement && ancestor.offsetHeight > 0 ? pane.height / ancestor.offsetHeight : 1;
    if (clipsX) {
      const x = pane.left + ancestor.clientLeft * scaleX;
      left = Math.max(left, x);
      right = Math.min(right, x + ancestor.clientWidth * scaleX);
    }
    if (clipsY) {
      const y = pane.top + ancestor.clientTop * scaleY;
      top = Math.max(top, y);
      bottom = Math.min(bottom, y + ancestor.clientHeight * scaleY);
    }
    if (coordinates !== undefined) {
      const contour = polygonContour(coordinates, pane);
      contours.push(contour);
      const box = contourBounds(contour);
      left = Math.max(left, box.left);
      right = Math.min(right, box.right);
      top = Math.max(top, box.top);
      bottom = Math.min(bottom, box.bottom);
    }
    if (offsets !== undefined) {
      const [insetTop, insetRight = insetTop, insetBottom = insetTop, insetLeft = insetRight] =
        offsets.match(insetValues) as [string, ...string[]];
      const box = insetReferenceBox(pane, style, referenceBox, scaleX, scaleY);
      const [clipLeft, clipRight] = insetAxis(box.left, box.right, insetLeft, insetRight, scaleX);
      const [clipTop, clipBottom] = insetAxis(box.top, box.bottom, insetTop, insetBottom, scaleY);
      left = Math.max(left, clipLeft);
      right = Math.min(right, clipRight);
      top = Math.max(top, clipTop);
      bottom = Math.min(bottom, clipBottom);
    }
  }
  return { bounds: { left, top, right, bottom }, hasInset, contours };
}

export function effectiveCanvasClip(element: Element): CanvasBounds {
  return canvasClipping(element).bounds;
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
