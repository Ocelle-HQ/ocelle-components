// A wrapper of the real generator (002 contracts/gates.md § Plant deltas, generator "wrapped"): the real generator
// with a validateSource() that lets the planted record motion-slow through, so that brand rule (f) sees it (012 plan
// decision 29; the gate validates the source with the root's validateSource() before the rules run).
import { validateSource as realValidateSource } from "./generate.real.ts";
import type { TokenRecord } from "./generate.real.ts";
export * from "./generate.real.ts";

export function validateSource(source: readonly TokenRecord[]): void {
  realValidateSource(source.filter((record) => record.name !== "motion-slow"));
}
