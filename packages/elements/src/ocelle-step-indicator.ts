import { LitElement } from "lit";
import { define } from "./define.ts";

export interface StepIndicatorStep {
  readonly label: string;
  readonly state: "upcoming" | "current" | "completed";
}

export class OcelleStepIndicator extends LitElement {
  steps: readonly StepIndicatorStep[] = [];
}

define("ocelle-step-indicator", OcelleStepIndicator);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-step-indicator": OcelleStepIndicator;
  }
}
