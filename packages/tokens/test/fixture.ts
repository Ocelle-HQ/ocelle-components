// A small fixture token source for the generator's unit tests (research.md R-03: generator tests use fixture
// sources throughout): theme-dependent colours (one the same in both themes), derived colour, space and shell tokens,
// a nested reference, an elevation that references a colour in dark only, `color-scheme`, and the motion tokens.
import type { TokenRecord } from "../src/generate.ts";

export const fixture: readonly TokenRecord[] = [
  { name: "color-ground", group: "colour", value: { light: "#FFFFFF", dark: "#000000" } },
  { name: "color-ink", group: "colour", value: { light: "#111111", dark: "#EEEEEE" }, contrast: { kind: "text", grounds: ["color-ground"] } },
  { name: "color-same", group: "colour", value: { light: "#777777", dark: "#777777" } },
  {
    name: "color-focus",
    group: "colour",
    value: { light: "var(--ocelle-color-ink)", dark: "var(--ocelle-color-ink)" },
    ref: { light: ["color-ink"], dark: ["color-ink"] },
    contrast: { kind: "non-text", grounds: ["color-ground"] },
  },
  { name: "color-scheme", group: "colour", value: { light: "light", dark: "dark" } },
  { name: "color-overlay", group: "colour", value: { light: "rgb(0 0 0 / 0.5)", dark: "rgb(0 0 0 / 0.65)" } },
  { name: "space-4", group: "space", value: "1rem" },
  { name: "gutter", group: "space", value: "var(--ocelle-space-4)", ref: ["space-4"] },
  { name: "dialog-max", group: "shell", value: "calc(100vw - 2 * var(--ocelle-gutter))", ref: ["gutter"] },
  {
    name: "elevation-raised",
    group: "elevation",
    value: { light: "0 2px 4px rgb(0 0 0 / 0.1)", dark: "0 0 0 1px var(--ocelle-color-ink)" },
    ref: { light: [], dark: ["color-ink"] },
  },
  { name: "motion-fast", group: "motion", value: "120ms" },
  { name: "motion-base", group: "motion", value: "200ms" },
];

/** The fixture with one record replaced (by name) or, when `record` is undefined, removed. */
export function withRecord(name: string, record: TokenRecord | undefined): TokenRecord[] {
  return fixture.flatMap((each) => (each.name === name ? (record === undefined ? [] : [record]) : [each]));
}

/** The fixture with records appended. */
export function withAdded(...records: readonly TokenRecord[]): TokenRecord[] {
  return [...fixture, ...records];
}
