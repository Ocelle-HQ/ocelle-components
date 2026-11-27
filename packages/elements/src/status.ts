// The status vocabulary (018 spec Terms, FR-002; research.md R-02; data-model.md § Status vocabulary): the five values
// `ocelle-status-indicator`'s `tone` and `ocelle-pill-tag`'s `status` take, each with its `--ocelle-color-<value>` and
// `--ocelle-color-<value>-bg` token pair. What is shared with #9's notice is the values and the pairs only: here an
// absent, empty or unknown value is `neutral`. The match is exact and case-sensitive, with no trimming, as 005's
// attribute conventions read attributes. Internal, not an entry point.

/** A value of the status vocabulary. */
export type Status = "info" | "success" | "warning" | "danger" | "neutral";

/** The five values of the vocabulary, in its order. */
export const statuses: readonly Status[] = ["info", "success", "warning", "danger", "neutral"];

/** The status `value` names: itself when it is one of the five, else `"neutral"`. */
export function statusOf(value: string | null | undefined): Status {
  return statuses.find((status) => status === value) ?? "neutral";
}
