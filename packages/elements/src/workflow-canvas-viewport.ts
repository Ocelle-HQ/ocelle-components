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

interface CanvasEllipse {
  readonly x: number;
  readonly y: number;
  readonly radiusX: number;
  readonly radiusY: number;
}

interface CanvasClipGeometry {
  readonly bounds: CanvasBounds;
  readonly contours: readonly CanvasClipContour[];
  readonly ellipses: readonly CanvasEllipse[];
}

export interface CanvasClipMeasurement extends CanvasClipGeometry {
  contains(outline: CanvasBounds): boolean;
}

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

function axisAlignedScale(element: Element): WorkflowCanvasPoint | undefined {
  if (element.getClientRects().length !== 1) return undefined;
  let x = 1;
  let y = 1;
  for (const ancestor of [element, ...composedAncestors(element)]) {
    const style = getComputedStyle(ancestor);
    const independent = [style.rotate, style.scale, style.perspective, style.offsetPath];
    if (!(ancestor instanceof HTMLElement) || independent.some((value) => value !== "none") || style.zoom !== "1") return undefined;
    const matrix = new DOMMatrixReadOnly(style.transform);
    if (!matrix.is2D || matrix.b !== 0 || matrix.c !== 0 || matrix.a <= 0 || matrix.d <= 0) return undefined;
    x *= matrix.a;
    y *= matrix.d;
  }
  return { x, y };
}

function polygonCoordinates(path: string): string | undefined {
  const polygon = /polygon\((?:evenodd, )?((?:-?[\d.]+(?:px|%) -?[\d.]+(?:px|%)(?:, )?)+)\)/.exec(path);
  return polygon?.[0] === path ? polygon[1] : undefined;
}

function polygonContour(coordinates: string, pane: DOMRect, scale: WorkflowCanvasPoint): CanvasClipContour {
  return coordinates.split(", ").map((pair) => {
    const [x, y] = pair.split(" ") as [string, string];
    return { x: pane.left + screenInset(x, pane.width, scale.x), y: pane.top + screenInset(y, pane.height, scale.y) };
  }) as [WorkflowCanvasPoint, ...WorkflowCanvasPoint[]];
}

function roundedEllipse(path: string, pane: DOMRect, scale: WorkflowCanvasPoint, circular: boolean): CanvasEllipse | undefined {
  const match = /(?:ellipse|circle)\(([\d.]+(?:px|%))(?: ([\d.]+(?:px|%)))?(?: at (-?[\d.]+(?:px|%)) (-?[\d.]+(?:px|%)))?\)/.exec(path);
  if (match?.[0] !== path) return undefined;
  const [radiusX, radiusY = radiusX, centerX = "50%", centerY = "50%"] = match.slice(1) as [string, string?, string?, string?];
  const x = pane.left + screenInset(centerX, pane.width, scale.x);
  const y = pane.top + screenInset(centerY, pane.height, scale.y);
  // A percentage circle radius resolves against the normalized unscaled diagonal.
  const diagonal = circular ? Math.hypot(pane.width / scale.x, pane.height / scale.y) / Math.SQRT2 : null;
  const rx = screenInset(radiusX, diagonal === null ? pane.width : diagonal * scale.x, scale.x);
  const ry = screenInset(radiusY, diagonal === null ? pane.height : diagonal * scale.y, scale.y);
  return { x, y, radiusX: rx, radiusY: ry };
}

function insetParts(path: string): RegExpExecArray | null {
  const rounding = path.indexOf(" round ");
  const outer = rounding === -1 ? path : path.slice(0, rounding) + path.slice(path.lastIndexOf(")"));
  const inset = /inset\(((?:[\d.%px -]|calc\(-?[\d.]+% [+-] [\d.]+px\))+)\)(?: (padding-box|content-box|margin-box))?/.exec(outer);
  return inset?.[0] === outer ? inset : null;
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

export function canvasClipping(element: Element): CanvasClipGeometry & { readonly hasConvexClip: boolean } {
  const rect = element.getBoundingClientRect();
  const viewport = element.ownerDocument.documentElement;
  let left = Math.max(0, rect.left);
  let top = Math.max(0, rect.top);
  let right = Math.min(viewport.clientWidth, rect.right);
  let bottom = Math.min(viewport.clientHeight, rect.bottom);
  let hasConvexClip = false;
  const contours: CanvasClipContour[] = [];
  const ellipses: CanvasEllipse[] = [];
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
    const shape = clipPath.slice(0, clipPath.indexOf("("));
    const rounded = shape === "ellipse" || shape === "circle";
    hasConvexClip ||= shape === "inset" || rounded;
    let inset: RegExpExecArray | null = null;
    let coordinates: string | undefined;
    switch (shape) {
      case "inset":
        inset = insetParts(clipPath);
        break;
      case "polygon":
        coordinates = polygonCoordinates(clipPath);
        break;
    }
    const offsets = inset?.[1];
    const shapeScale = coordinates !== undefined || rounded ? axisAlignedScale(ancestor) : undefined;
    if (!clipsX && !clipsY && offsets === undefined && shapeScale === undefined) continue;
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
    if (shapeScale !== undefined) {
      let box;
      if (coordinates !== undefined) {
        const contour = polygonContour(coordinates, pane, shapeScale);
        contours.push(contour);
        box = contourBounds(contour);
      } else {
        const ellipse = roundedEllipse(clipPath, pane, shapeScale, shape === "circle");
        if (ellipse !== undefined) {
          ellipses.push(ellipse);
          const { x, y, radiusX, radiusY } = ellipse;
          box = { left: x - radiusX, right: x + radiusX, top: y - radiusY, bottom: y + radiusY };
        }
      }
      if (box !== undefined) {
        left = Math.max(left, box.left);
        right = Math.min(right, box.right);
        top = Math.max(top, box.top);
        bottom = Math.min(bottom, box.bottom);
      }
    }
    if (offsets !== undefined) {
      const [insetTop, insetRight = insetTop, insetBottom = insetTop, insetLeft = insetRight] =
        offsets.match(/calc\([^)]+\)|[^ ]+/g) as [string, ...string[]];
      const box = insetReferenceBox(pane, style, inset?.[2], scaleX, scaleY);
      const [clipLeft, clipRight] = insetAxis(box.left, box.right, insetLeft, insetRight, scaleX);
      const [clipTop, clipBottom] = insetAxis(box.top, box.bottom, insetTop, insetBottom, scaleY);
      left = Math.max(left, clipLeft);
      right = Math.min(right, clipRight);
      top = Math.max(top, clipTop);
      bottom = Math.min(bottom, clipBottom);
    }
  }
  return { bounds: { left, top, right, bottom }, hasConvexClip, contours, ellipses };
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

function centeredOutline(outline: CanvasBounds, target: CanvasBounds): CanvasBounds {
  const x = (target.left + target.right - outline.left - outline.right) / 2;
  const y = (target.top + target.bottom - outline.top - outline.bottom) / 2;
  return { left: outline.left + x, right: outline.right + x, top: outline.top + y, bottom: outline.bottom + y };
}

// A center can change its relation to a contour only where its outline contacts a segment or a vertex.
type ContactLine = readonly [normalX: number, normalY: number, offset: number];

function outlineContactLines(contours: readonly CanvasClipContour[], halfWidth: number, halfHeight: number): ContactLine[] {
  const lines: ContactLine[] = [];
  for (const contour of contours) {
    contour.forEach((start, index) => {
      const end = contour[index + 1] ?? contour[0];
      const x = end.y - start.y;
      const y = start.x - end.x;
      const offset = x * start.x + y * start.y;
      const reach = Math.abs(x) * halfWidth + Math.abs(y) * halfHeight;
      // Each vertex's column contacts fall where its two row contacts meet the incident offset edges.
      lines.push(
        [0, 1, start.y - halfHeight], [0, 1, start.y + halfHeight],
        [x, y, offset - reach], [x, y, offset + reach],
      );
    });
  }
  return lines;
}

function* sectionCoordinates(events: Iterable<number>, low: number, high: number): Generator<number> {
  const boundaries = [...new Set([low, high, ...events])].filter((value) => value >= low && value <= high).sort((a, b) => a - b);
  // Open cells come first. Keep their boundaries too, so a gap that fits exactly can still be used.
  const [, ...laterBoundaries] = boundaries;
  let previous = low;
  for (const boundary of laterBoundaries) {
    yield (previous + boundary) / 2;
    previous = boundary;
  }
  yield* boundaries;
}

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

function ellipseReach(distance: number, radius: number, perpendicularRadius: number): number {
  return perpendicularRadius * Math.sqrt(1 - (distance / radius) ** 2);
}

export function canvasClipSections(outline: CanvasBounds, clip: CanvasClipGeometry) {
  const halfWidth = (outline.right - outline.left) / 2;
  const halfHeight = (outline.bottom - outline.top) / 2;
  let minX = clip.bounds.left + halfWidth;
  let maxX = clip.bounds.right - halfWidth;
  const minY = clip.bounds.top + halfHeight;
  const maxY = clip.bounds.bottom - halfHeight;
  if (minY > maxY) return undefined;
  for (const { x, y, radiusX, radiusY } of clip.ellipses) {
    // The closest feasible row minimizes the distance of the farthest corner from this ellipse's center.
    const distance = Math.abs(clamp(y, minY, maxY) - y) + halfHeight;
    const reach = ellipseReach(distance, radiusY, radiusX) - halfWidth;
    minX = Math.max(minX, x - reach);
    maxX = Math.min(maxX, x + reach);
  }
  if (!(minX <= maxX)) return undefined;
  const centers = clip.ellipses.map(({ x, y }) => ({ x: clamp(x, minX, maxX), y: clamp(y, minY, maxY) }));
  const lines = outlineContactLines(clip.contours, halfWidth, halfHeight);
  lines.push([0, 1, minY], [0, 1, maxY]);
  return {
    halfWidth, halfHeight, centers,
    rows(column: number) {
      let top = minY;
      let bottom = maxY;
      for (const { x, y, radiusX, radiusY } of clip.ellipses) {
        const distance = Math.abs(column - x) + halfWidth;
        const reach = ellipseReach(distance, radiusX, radiusY) - halfHeight;
        top = Math.max(top, y - reach);
        bottom = Math.min(bottom, y + reach);
      }
      const events = lines.map(([x, y, offset]) => (offset - x * column) / y);
      return sectionCoordinates(events, top, bottom);
    },
    columns() {
      // Between two contact intersections, the order of all section boundaries is fixed.
      const events = lines.flatMap(([x, y, offset], index) => {
        // Stryker disable next-line MethodExpression: Reversed pairs repeat the same cuts, which sectionCoordinates deduplicates.
        const others = lines.slice(index);
        return others.map(([otherX, otherY, otherOffset]) => (offset * otherY - otherOffset * y) / (x * otherY - otherX * y));
      });
      return sectionCoordinates([...events, ...centers.map(({ x }) => x)], minX, maxX);
    },
  };
}

function findOutlineInClip(outline: CanvasBounds, preferred: CanvasBounds, clip: CanvasClipMeasurement): CanvasBounds | undefined {
  const sections = canvasClipSections(outline, clip);
  if (sections === undefined) return undefined;
  const { halfWidth, halfHeight, centers } = sections;
  const outlineAt = (column: number, row: number) => ({
    left: column - halfWidth, top: row - halfHeight, right: column + halfWidth, bottom: row + halfHeight,
  });
  // For one ellipse, clamping its center to the feasible rectangle minimizes both corner distances.
  for (const { x, y } of centers) {
    const candidate = outlineAt(x, y);
    if (clip.contains(candidate)) return candidate;
  }
  const findInColumn = (column: number) => {
    for (const row of sections.rows(column)) {
      const candidate = outlineAt(column, row);
      if (clip.contains(candidate)) return candidate;
    }
    return undefined;
  };
  const sameColumn = findInColumn((preferred.left + preferred.right) / 2);
  if (sameColumn !== undefined) return sameColumn;
  for (const column of sections.columns()) {
    const candidate = findInColumn(column);
    if (candidate !== undefined) return candidate;
  }
  return undefined;
}

export function canvasRevealViewport(
  view: WorkflowCanvasViewport,
  map: SVGSVGElement,
  action: HTMLButtonElement,
  measured?: CanvasClipMeasurement,
  visibleActions: readonly CanvasBounds[] = [],
): WorkflowCanvasViewport | null {
  const inverse = canvasScreenInverse(map);
  if (inverse === null) return null;
  const actionBounds = canvasActionBounds(action, map.getScreenCTM());
  const clip = measured?.bounds ?? effectiveCanvasClip(map);
  const fits = clip.right - clip.left >= actionBounds.right - actionBounds.left
    && clip.bottom - clip.top >= actionBounds.bottom - actionBounds.top;
  const target = centeredOutline(actionBounds, fits ? clip : map.getBoundingClientRect());
  const accepted = measured?.contains(target) === false
    ? visibleActions.map((bounds) => centeredOutline(actionBounds, bounds)).find((bounds) => measured.contains(bounds))
      ?? findOutlineInClip(actionBounds, target, measured)
    : target;
  const destination = accepted ?? target;
  const delta = new DOMPoint(destination.left - actionBounds.left, destination.top - actionBounds.top, 0, 0).matrixTransform(inverse);
  return allFinite([delta.x, delta.y])
    ? { x: view.x + delta.x, y: view.y + delta.y, scale: view.scale } : null;
}

export interface CanvasGestureFrame {
  readonly inverse: DOMMatrix;
  readonly width: number;
  readonly height: number;
}

export function canvasGestureFrame(map: SVGSVGElement): CanvasGestureFrame | null {
  const inverse = canvasScreenInverse(map);
  const width = map.clientWidth;
  const height = map.clientHeight;
  return inverse === null || width === 0 || height === 0 ? null : { inverse, width, height };
}

export function sameCanvasGestureFrame(first: CanvasGestureFrame, map: SVGSVGElement): boolean {
  const next = canvasGestureFrame(map);
  if (next === null || first.width !== next.width || first.height !== next.height) return false;
  const values = next.inverse.toFloat64Array();
  return first.inverse.toFloat64Array().every((value, index) => value === values[index]);
}

export function canvasGesturePoint(frame: CanvasGestureFrame, event: PointerEvent): DOMPoint {
  return new DOMPoint(event.clientX, event.clientY).matrixTransform(frame.inverse);
}

export function canvasZoomViewport(view: WorkflowCanvasViewport, width: number, height: number, factor: number): WorkflowCanvasViewport {
  const x = width / 2;
  const y = height / 2;
  return { x: x - (x - view.x) * factor, y: y - (y - view.y) * factor, scale: view.scale * factor };
}

interface CanvasFitNode extends WorkflowCanvasPoint {
  readonly width: number;
  readonly height: number;
}

export function canvasFitViewport(nodes: readonly CanvasFitNode[], width: number, height: number, padding: number): WorkflowCanvasViewport | null {
  if (nodes.length === 0) return null;
  const left = Math.min(...nodes.map(({ x }) => x));
  const top = Math.min(...nodes.map(({ y }) => y));
  const roomX = width - 2 * padding;
  const roomY = height - 2 * padding;
  let scale = 1;
  for (const node of nodes) {
    if (node.width > roomX || node.height > roomY) return null;
    // At positive scale the first origin stays first. Each footprint independently limits that scale.
    if (node.x > left) scale = Math.min(scale, (roomX - node.width) / (node.x - left));
    if (node.y > top) scale = Math.min(scale, (roomY - node.height) / (node.y - top));
  }
  if (!(scale > 0)) return null;
  const spanX = Math.max(...nodes.map(({ x, width }) => (x - left) * scale + width));
  const spanY = Math.max(...nodes.map(({ y, height }) => (y - top) * scale + height));
  const x = (width - spanX) / 2 - left * scale;
  const y = (height - spanY) / 2 - top * scale;
  return allFinite([x, y, scale]) ? { x, y, scale } : null;
}
