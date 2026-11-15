// The token source (FR-008, research.md R-01, data-model.md § Token): every token of spec Appendix A as a record, in
// the order of its tables. Each record's use (Appendix A's "Use" column) is the comment beside it, not data
// (PLAN-TESTABILITY-1-003 (a)). A derived token (FR-002) writes its source as var(--ocelle-<name>) and lists it in
// `ref`; a foreground colour carries its contrast kind and intended grounds (A.8: 149 required pairs per theme).
// `source` is the records with the overrides of overrides.ts applied; the generator, the build and the gates read it.
// No type assertion wraps the records or the ground lists (`as const`, `satisfies`): Stryker does not mutate inside
// one, so the values would go untested (op 004). `tokenRecords` keeps the names literal and checks each record instead.
import { applyOverrides } from "./generate.ts";
import type { TokenRecord } from "./generate.ts";
import { overrides } from "./overrides.ts";

/** A.8's main grounds: the grounds of #5's "Use" column on which content sits. */
const main = [
  "color-canvas",
  "color-sheet",
  "color-pane",
  "color-panel",
  "color-inspector",
  "color-rail",
  "color-inset",
  "color-accent-low",
  "color-hover-bg",
];
/** The five state grounds. */
const stateGrounds = ["color-danger-bg", "color-warning-bg", "color-success-bg", "color-info-bg", "color-neutral-bg"];
/** The chrome grounds. */
const chrome = ["color-chrome", "color-chrome-hover"];

/** The records as given; N keeps each name literal, so TokenName (index.ts) is their union without `as const`. */
function tokenRecords<const N extends string>(list: readonly (TokenRecord & { readonly name: N })[]): readonly (TokenRecord & { readonly name: N })[] {
  return list;
}

export const records = tokenRecords([
  // A.1 Colour (theme-dependent)
  { name: "color-canvas", group: "colour", value: { light: "#F1EEE8", dark: "#15130F" } }, // bone, the page ground
  { name: "color-sheet", group: "colour", value: { light: "#FBFAF7", dark: "#211E18" } }, // facts sheet, cards, inputs
  { name: "color-pane", group: "colour", value: { light: "#FFFFFF", dark: "#1C1A15" } }, // detail reading pane
  { name: "color-panel", group: "colour", value: { light: "#F1EEE8", dark: "#15130F" } }, // list and inspector panels
  { name: "color-inspector", group: "colour", value: { light: "#F1EEE8", dark: "#15130F" } }, // right inspector, ruled off
  { name: "color-rail", group: "colour", value: { light: "#E9E5DD", dark: "#1C1A15" } }, // context sidebar
  { name: "color-inset", group: "colour", value: { light: "#E2DDD3", dark: "#302B23" } }, // wells, digest backgrounds
  { name: "color-ink", group: "colour", value: { light: "#15130F", dark: "#EDE9E1" }, contrast: { kind: "text", grounds: main } }, // body text
  // secondary headings
  { name: "color-ink-soft", group: "colour", value: { light: "#3F3A33", dark: "#CFC9BE" }, contrast: { kind: "text", grounds: main } },
  // muted text
  { name: "color-ink-muted", group: "colour", value: { light: "#5E584F", dark: "#A39D92" }, contrast: { kind: "text", grounds: main } },
  { name: "color-rule", group: "colour", value: { light: "#D9D3C7", dark: "#3A342B" } }, // decorative, never a control boundary
  { name: "color-rule-strong", group: "colour", value: { light: "#B9B1A2", dark: "#4D463A" } }, // decorative
  // inputs, buttons, chips; on accent-low, inset, hover-bg and the state grounds controls use color-accent-strong (#5 rule 1)
  {
    name: "color-control-border",
    group: "colour",
    value: { light: "#8A8276", dark: "#7A7264" },
    contrast: { kind: "non-text", grounds: ["color-canvas", "color-sheet", "color-pane", "color-panel", "color-inspector", "color-rail"] },
  },
  { name: "color-chrome", group: "colour", value: { light: "#15130F", dark: "#0D0C0A" } }, // top bar, icon rail, personal rail
  { name: "color-chrome-ink", group: "colour", value: { light: "#EDE9E1", dark: "#EDE9E1" }, contrast: { kind: "text", grounds: chrome } }, // on chrome
  { name: "color-chrome-muted", group: "colour", value: { light: "#A39D92", dark: "#A39D92" }, contrast: { kind: "text", grounds: chrome } }, // on chrome
  // on chrome; light #211D18 replaces #5's #2A261F so the focus ring meets 3:1 on it (research.md R-04, SPEC-2-01)
  { name: "color-chrome-hover", group: "colour", value: { light: "#211D18", dark: "#24211B" } },
  { name: "color-accent", group: "colour", value: { light: "#C68A1E", dark: "#C68A1E" } }, // ochre fill
  // black on the ochre fill
  { name: "color-on-accent", group: "colour", value: { light: "#15130F", dark: "#15130F" }, contrast: { kind: "text", grounds: ["color-accent"] } },
  { name: "color-accent-low", group: "colour", value: { light: "#F1E1C0", dark: "#3A2B10" } }, // selected rows, current nav
  // current bar, focus ring; the border of a control on accent-low, inset, hover-bg and the state grounds (#5 rule 1, extended)
  {
    name: "color-accent-strong",
    group: "colour",
    value: { light: "#8F5E0F", dark: "#E0A23A" },
    contrast: { kind: "non-text", grounds: ["color-accent-low", "color-inset", "color-hover-bg", ...stateGrounds] },
  },
  // focus ring
  {
    name: "color-focus",
    group: "colour",
    value: { light: "var(--ocelle-color-accent-strong)", dark: "var(--ocelle-color-accent-strong)" },
    ref: { light: ["color-accent-strong"], dark: ["color-accent-strong"] },
    contrast: { kind: "non-text", grounds: [...main, ...chrome, ...stateGrounds] },
  },
  // current bar
  {
    name: "color-current",
    group: "colour",
    value: { light: "var(--ocelle-color-accent-strong)", dark: "var(--ocelle-color-accent-strong)" },
    ref: { light: ["color-accent-strong"], dark: ["color-accent-strong"] },
    contrast: { kind: "non-text", grounds: [...chrome, "color-rail", "color-accent-low"] },
  },
  // links
  { name: "color-link", group: "colour", value: { light: "#84560D", dark: "#E0A23A" }, contrast: { kind: "text", grounds: [...main, ...stateGrounds] } },
  // links on hover
  { name: "color-link-hover", group: "colour", value: { light: "#15130F", dark: "#F7F4EE" }, contrast: { kind: "text", grounds: main } },
  { name: "color-hover-bg", group: "colour", value: { light: "#E2DDD3", dark: "#2A261F" } }, // hovered rows and controls
  // disabled text; exempt from the threshold (WCAG 1.4.3, FR-017)
  {
    name: "color-disabled-ink",
    group: "colour",
    value: { light: "#6F685D", dark: "#8C8579" },
    contrast: { kind: "text", grounds: [...main, "color-disabled-bg"], exempt: true },
  },
  { name: "color-disabled-bg", group: "colour", value: { light: "#E6E1D8", dark: "#2A261F" } }, // disabled controls
  { name: "color-overlay", group: "colour", value: { light: "rgb(21 19 15 / 0.5)", dark: "rgb(0 0 0 / 0.65)" } }, // dialog backdrop
  // danger state
  { name: "color-danger", group: "colour", value: { light: "#A8322C", dark: "#E97373" }, contrast: { kind: "text", grounds: [...main, "color-danger-bg"] } },
  { name: "color-danger-bg", group: "colour", value: { light: "#F6E2E0", dark: "#2E1616" } }, // danger ground
  // warning state
  { name: "color-warning", group: "colour", value: { light: "#7A5205", dark: "#E0A23A" }, contrast: { kind: "text", grounds: [...main, "color-warning-bg"] } },
  { name: "color-warning-bg", group: "colour", value: { light: "#F4E6C8", dark: "#2E2410" } }, // warning ground
  // success state
  { name: "color-success", group: "colour", value: { light: "#2F6B3A", dark: "#8FCB8F" }, contrast: { kind: "text", grounds: [...main, "color-success-bg"] } },
  { name: "color-success-bg", group: "colour", value: { light: "#E4EFE3", dark: "#15241A" } }, // success ground
  // info state
  { name: "color-info", group: "colour", value: { light: "#2C5E86", dark: "#A9C7E8" }, contrast: { kind: "text", grounds: [...main, "color-info-bg"] } },
  { name: "color-info-bg", group: "colour", value: { light: "#E6EDF3", dark: "#14202E" } }, // info ground
  // neutral state
  { name: "color-neutral", group: "colour", value: { light: "#5E584F", dark: "#A39D92" }, contrast: { kind: "text", grounds: [...main, "color-neutral-bg"] } },
  { name: "color-neutral-bg", group: "colour", value: { light: "#E6E1D8", dark: "#2A261F" } }, // neutral ground
  // not a colour: the theme's color-scheme keyword, applied by the base styles (#6) (PLAN-A11Y-SECURITY-1-004)
  { name: "color-scheme", group: "colour", value: { light: "light", dark: "dark" } },

  // A.2 Type (theme-independent)
  { name: "font-sans", group: "type", value: '"Schibsted Grotesk", "Helvetica Neue", Arial, system-ui, sans-serif' }, // all text
  { name: "font-display", group: "type", value: "var(--ocelle-font-sans)", ref: ["font-sans"] }, // display text
  { name: "figures", group: "type", value: "tabular-nums" }, // ids, digests, values
  { name: "font-size-xs", group: "type", value: "0.75rem" },
  { name: "font-size-sm", group: "type", value: "0.875rem" },
  { name: "font-size-md", group: "type", value: "1rem" },
  { name: "font-size-fact", group: "type", value: "1.0625rem" }, // facts sheet values
  { name: "font-size-subhead", group: "type", value: "1.125rem" }, // prose h2, 18 px (003)
  { name: "font-size-lg", group: "type", value: "1.25rem" },
  { name: "font-size-xl", group: "type", value: "1.5rem" },
  { name: "font-size-2xl", group: "type", value: "1.875rem" },
  { name: "line-height-tight", group: "type", value: "1.15" },
  { name: "line-height-normal", group: "type", value: "1.45" },
  { name: "line-height-relaxed", group: "type", value: "1.55" },
  { name: "line-height-compact", group: "type", value: "1.5" },
  { name: "line-height-prose", group: "type", value: "1.65" }, // prose running text (003)
  { name: "font-weight-regular", group: "type", value: "400" },
  { name: "font-weight-medium", group: "type", value: "500" },
  { name: "font-weight-strong", group: "type", value: "600" },
  { name: "font-weight-display", group: "type", value: "800" },
  { name: "tracking-display", group: "type", value: "-0.03em" }, // display letter spacing

  // A.3 Space, shape, size (theme-independent)
  { name: "space-1", group: "space", value: "0.25rem" },
  { name: "space-2", group: "space", value: "0.5rem" },
  { name: "space-3", group: "space", value: "0.75rem" },
  { name: "space-4", group: "space", value: "1rem" },
  { name: "space-5", group: "space", value: "1.25rem" },
  { name: "space-6", group: "space", value: "1.5rem" },
  { name: "space-7", group: "space", value: "2rem" },
  { name: "space-8", group: "space", value: "2.5rem" },
  { name: "space-9", group: "space", value: "3rem" },
  { name: "space-10", group: "space", value: "4rem" },
  { name: "gutter", group: "space", value: "var(--ocelle-space-4)", ref: ["space-4"] }, // page and dialog gutter
  { name: "radius-1", group: "shape", value: "2px" }, // small marks: dots, focus corners
  { name: "radius-2", group: "shape", value: "4px" }, // the one general radius
  { name: "radius-row", group: "shape", value: "6px" }, // rows and cards
  { name: "radius-shell", group: "shape", value: "10px" }, // the outer app shell only
  { name: "radius-pill", group: "shape", value: "999px" }, // state pills only
  { name: "border-width", group: "shape", value: "1px" },
  { name: "focus-width", group: "shape", value: "3px" }, // focus ring width
  { name: "focus-offset", group: "shape", value: "2px" }, // focus ring offset
  { name: "bar-width", group: "shape", value: "3px" }, // current bar width
  { name: "ring-step", group: "shape", value: "1.5px" },
  { name: "target-min", group: "size", value: "2.75rem" }, // 44px minimum target (spec-kitty-design#532)
  { name: "icon-size", group: "size", value: "1.25rem" },
  { name: "size-dot", group: "size", value: "0.45rem" },
  { name: "size-step", group: "size", value: "1.4rem" },
  { name: "size-avatar", group: "size", value: "1.6rem" },
  { name: "size-rail-item", group: "size", value: "2.5rem" },
  { name: "size-visually-hidden", group: "size", value: "1px" },

  // A.4 Shell and measure (theme-independent)
  { name: "shell-topbar-height", group: "shell", value: "3.25rem" },
  { name: "shell-rail-width", group: "shell", value: "3.25rem" },
  { name: "shell-sidebar-width", group: "shell", value: "20rem" },
  { name: "shell-inspector-width", group: "shell", value: "19rem" }, // replaces spec-kitty-design#505's 260px
  { name: "shell-main-max", group: "shell", value: "48rem" },
  { name: "shell-collapse-inspector", group: "shell", value: "75rem" },
  { name: "shell-collapse-sidebar", group: "shell", value: "45rem" },
  { name: "shell-height", group: "shell", value: "100dvh" },
  { name: "footer-h", group: "shell", value: "4.5rem" },
  { name: "measure-sheet", group: "shell", value: "var(--ocelle-shell-main-max)", ref: ["shell-main-max"] },
  { name: "measure-sentence", group: "shell", value: "var(--ocelle-shell-main-max)", ref: ["shell-main-max"] },
  { name: "measure-page", group: "shell", value: "100%" },
  { name: "measure-reading", group: "shell", value: "68ch" }, // prose paragraph measure (003)
  { name: "measure-cell", group: "shell", value: "12ch" }, // prose table cell floor (003)
  // the inline size of the nearest query container: caps a prose caption at its table's visible width (003)
  { name: "measure-container", group: "shell", value: "100cqi" },
  // the viewport's inline size minus two gutters (unit from the console prototype, research.md R-05)
  { name: "dialog-max-inline", group: "shell", value: "calc(100vw - 2 * var(--ocelle-gutter))", ref: ["gutter"] },
  // the viewport's block size minus two gutters (unit from the console prototype, research.md R-05)
  { name: "dialog-max-block", group: "shell", value: "calc(100dvh - 2 * var(--ocelle-gutter))", ref: ["gutter"] },
  // the drawer's inline size: the sidebar's width, which #12's personal drawer replaces at narrow widths
  // (spec-kitty-design#450; 008 research.md R-09)
  { name: "drawer-inline", group: "shell", value: "var(--ocelle-shell-sidebar-width)", ref: ["shell-sidebar-width"] },
  // decision bar
  { name: "bar-block-narrow", group: "shell", value: "calc(2 * var(--ocelle-target-min) + 3 * var(--ocelle-space-2))", ref: ["target-min", "space-2"] },

  // A.5 Elevation (theme-dependent) and motion (theme-independent); light shadows and ring widths from the console
  // prototype (research.md R-05)
  {
    name: "elevation-sheet",
    group: "elevation",
    value: { light: "0 0 0 1px var(--ocelle-color-rule)", dark: "0 0 0 1px var(--ocelle-color-rule)" },
    ref: { light: ["color-rule"], dark: ["color-rule"] },
  },
  {
    name: "elevation-raised",
    group: "elevation",
    value: { light: "0 2px 4px rgb(21 19 15 / 0.10), 0 12px 32px rgb(21 19 15 / 0.16)", dark: "0 0 0 1px var(--ocelle-color-rule-strong)" },
    ref: { light: [], dark: ["color-rule-strong"] },
  },
  {
    name: "elevation-row",
    group: "elevation",
    value: { light: "0 0 0 1px var(--ocelle-color-control-border), 0 2px 8px rgb(21 19 15 / 0.08)", dark: "0 0 0 1px var(--ocelle-color-control-border)" },
    ref: { light: ["color-control-border"], dark: ["color-control-border"] },
  },
  {
    name: "elevation-seg",
    group: "elevation",
    value: { light: "0 0 0 1px var(--ocelle-color-control-border), 0 1px 2px rgb(21 19 15 / 0.08)", dark: "0 0 0 1px var(--ocelle-color-control-border)" },
    ref: { light: ["color-control-border"], dark: ["color-control-border"] },
  },
  { name: "elevation-bar", group: "elevation", value: { light: "0 -6px 16px rgb(21 19 15 / 0.05)", dark: "none" } }, // bottom bars
  { name: "motion-fast", group: "motion", value: "120ms" }, // 0ms under reduced motion
  { name: "motion-base", group: "motion", value: "200ms" }, // 0ms under reduced motion
  { name: "easing-standard", group: "motion", value: "cubic-bezier(0.22, 1, 0.36, 1)" },
]);

export const source: readonly TokenRecord[] = applyOverrides(records, overrides);
