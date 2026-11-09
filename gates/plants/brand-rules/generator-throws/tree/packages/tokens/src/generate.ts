// A wrapper of the real generator (002 contracts/gates.md § Plant deltas, generator "wrapped") whose css() throws.
export * from "./generate.real.ts";

export function css(): string {
  throw new Error("planted: the generator throws");
}
