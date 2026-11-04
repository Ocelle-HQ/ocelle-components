// Token overrides (data-model.md § Token overrides): the way a gate plant changes the token source by key. The
// committed list is empty, so the records of source.ts are exactly what ships; a plant's delta.json fills it.
import type { TokenOverride } from "./generate.ts";

export const overrides: readonly TokenOverride[] = [];
