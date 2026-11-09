// A wrapper of the real generator (002 contracts/gates.md § Plant deltas, generator "wrapped"): the real css() with one change.
import { css as realCss } from "./generate.real.ts";
import type { TokenRecord } from "./generate.real.ts";
export * from "./generate.real.ts";

export function css(source: readonly TokenRecord[]): string {
  return realCss(source).replace("--ocelle-motion-fast: 0ms;", "--ocelle-motion-fast: 60ms;");
}
