// The token source (FR-008, research.md R-01, data-model.md § Token): every token of spec Appendix A as a record.
// `source` is the records with the overrides of overrides.ts applied; the generator, the build and the gates read it.
import { applyOverrides } from "./generate.ts";
import type { TokenRecord } from "./generate.ts";
import { overrides } from "./overrides.ts";

export const records: readonly TokenRecord[] = [];

export const source: readonly TokenRecord[] = applyOverrides(records, overrides);
