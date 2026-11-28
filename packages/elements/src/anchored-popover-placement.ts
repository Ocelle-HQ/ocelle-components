export interface PopoverRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

interface PlacementRegion extends PopoverRect {
  readonly side: "above" | "below" | "left" | "right" | "viewport";
}

interface PlacementOptions {
  readonly preferred: "above" | "below";
  readonly rtl: boolean;
  readonly gap: number;
  readonly minimumHeight: number;
  readonly preferredWidth: number;
}

function clamp(value: number, start: number, end: number): number {
  return Math.max(start, Math.min(value, end));
}

/** Choose a region from available room and the surface's viewport-bounded preferred width. */
export function choosePopoverRegion(bounds: PopoverRect, anchor: PopoverRect, options: PlacementOptions): PlacementRegion {
  const { preferred, rtl, gap, minimumHeight, preferredWidth } = options;
  const above: PlacementRegion = { ...bounds, side: "above", bottom: clamp(anchor.top - gap, bounds.top, bounds.bottom) };
  const below: PlacementRegion = { ...bounds, side: "below", top: clamp(anchor.bottom + gap, bounds.top, bounds.bottom) };
  const left: PlacementRegion = { ...bounds, side: "left", right: clamp(anchor.left - gap, bounds.left, bounds.right) };
  const right: PlacementRegion = { ...bounds, side: "right", left: clamp(anchor.right + gap, bounds.left, bounds.right) };
  const adjacent = rtl ? [left, right] : [right, left];
  const choices = preferred === "above" ? [above, ...adjacent, below] : [below, above, ...adjacent];
  return choices.find((region) => {
    if (region.side === "left" || region.side === "right") return region.right - region.left >= preferredWidth;
    return region.bottom - region.top >= minimumHeight;
  }) ?? { ...bounds, side: "viewport" };
}

/** Clamp the measured box inside the selected region, aligning to the anchor's logical start. */
export function positionPopover(
  region: PopoverRect,
  anchor: PopoverRect,
  { width, height }: { readonly width: number; readonly height: number },
  rtl: boolean,
): { readonly left: number; readonly top: number } {
  return {
    left: clamp(rtl ? anchor.right - width : anchor.left, region.left, region.right - width),
    top: clamp(anchor.top, region.top, region.bottom - height),
  };
}
