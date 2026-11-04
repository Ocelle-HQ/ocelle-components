// The token stories' render code (FR-023, research.md R-10): one group of the token source as markup, name and value
// per token for a theme. Kept out of tokens.stories.ts so that the story file only binds the groups. Scaffold: no
// behaviour yet.
/* eslint-disable @typescript-eslint/no-unused-vars -- scaffold: signatures only, the green commit implements them */
import type { Group, Theme, TokenRecord } from "../../packages/tokens/src/generate.ts";

/** Whether a token gets a swatch rule: an opaque colour token. */
export function hasSwatch(source: readonly TokenRecord[], record: TokenRecord): boolean {
  return false;
}

/** The markup of one group's story in a theme. */
export function renderGroup(source: readonly TokenRecord[], group: Group, theme: Theme): string {
  return "";
}
