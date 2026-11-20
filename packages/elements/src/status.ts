// The status vocabulary (018 research.md R-02; data-model.md § Status vocabulary), phase 2 scaffold: the exported
// signatures only, with no behaviour, so the red tests of phase 2 fail on their assertions, not on a missing module.

/** A value of the status vocabulary. */
export type Status = "info" | "success" | "warning" | "danger" | "neutral";

/** The five values of the vocabulary (not filled in yet). */
export const statuses: readonly Status[] = [];

/** The status a value names (not implemented yet: always the neutral value). */
export function statusOf(value: string | null | undefined): Status {
  void value;
  return "neutral";
}
