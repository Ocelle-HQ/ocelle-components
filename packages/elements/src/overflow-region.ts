// The overflow-region module (009 FR-011; contracts/overflow-region.md): phase 2 scaffold. The exported signatures
// only, with no behaviour; the green step of phase 2 implements them. Internal, not an entry point.
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function -- the scaffold has signatures and no behaviour */
import { css } from "lit";
import type { ReactiveController, ReactiveControllerHost } from "lit";

/** The edge state of a scroll box. */
export interface EdgeState {
  readonly overflowing: boolean;
  readonly offStart: boolean;
  readonly offEnd: boolean;
}

/** An inline span of the viewport, in CSS px from its left edge. */
export interface Span {
  readonly left: number;
  readonly right: number;
}

/** The scroll box for the clearance: its client area and its scroll metrics. */
export interface ClearanceBox extends Span {
  readonly scrollLeft: number;
  readonly scrollWidth: number;
  readonly clientWidth: number;
}

/** What `clearanceScroll` reads. */
export interface ClearanceInput {
  readonly ring: Span;
  readonly box: ClearanceBox;
  readonly fade: number;
  readonly direction: "ltr" | "rtl";
}

/** What `clearanceScroll` returns. */
export interface Clearance {
  readonly scrollLeft: number;
  readonly suppressStart: boolean;
  readonly suppressEnd: boolean;
}

export function edgeState(_scrollLeft: number, _scrollWidth: number, _clientWidth: number): EdgeState {
  throw new Error("not implemented");
}

export function clearanceScroll(_input: ClearanceInput): Clearance {
  throw new Error("not implemented");
}

export function resolveName(_hostAriaLabel: string | null, _label: string | undefined): string | undefined {
  throw new Error("not implemented");
}

/** The options of an `OverflowRegion`. */
export interface OverflowRegionOptions {
  readonly box: () => HTMLElement | null;
  readonly role?: "group" | "region";
  readonly step?: number;
}

export const overflowRegionStyles = css``;

export class OverflowRegion implements ReactiveController {
  readonly overflowing: boolean = false;
  readonly offStart: boolean = false;
  readonly offEnd: boolean = false;
  readonly fadeStart: boolean = false;
  readonly fadeEnd: boolean = false;
  readonly fadeAttribute: "start" | "end" | "both" | undefined = undefined;
  readonly name: string | undefined = undefined;

  constructor(_host: ReactiveControllerHost & HTMLElement, _options: OverflowRegionOptions) {}

  hostConnected(): void {}

  setLabel(_label: string | undefined): void {}
}
