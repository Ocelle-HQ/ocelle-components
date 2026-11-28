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

/** Clamp the actual rendered box after the selected region's size cap has been applied. */
export function positionPopover(
  region: PlacementRegion,
  anchor: PopoverRect,
  { width, height }: { readonly width: number; readonly height: number },
  { preferred, rtl, gap }: Pick<PlacementOptions, "preferred" | "rtl" | "gap">,
): { readonly left: number; readonly top: number } {
  let left = rtl ? anchor.right - width : anchor.left;
  let top = anchor.top;
  switch (region.side) {
    case "above": top = region.bottom - height; break;
    case "below": top = region.top; break;
    case "left": left = region.right - width; break;
    case "right": left = region.left; break;
    case "viewport": top = preferred === "above" ? anchor.top - gap - height : anchor.bottom + gap; break;
  }
  return {
    left: clamp(left, region.left, region.right - width),
    top: clamp(top, region.top, region.bottom - height),
  };
}
