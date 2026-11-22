// The token table of spec Appendix A (A.1 to A.6), transcribed by hand for the tests (data-model.md § Expected
// tables; PLAN-TESTABILITY-1-001, -002). Never read from src/source.ts: the tests compare the generator's output and
// the browser's computed values with this table. Values the plan supplied are included: the light
// `color-chrome-hover` #211D18 (R-04), the light shadows, the 1px ring and the vw/dvh dialog sizes (R-05).
//
// Each entry: the name without the `--ocelle-` prefix, the group, the value (per theme for colour and elevation,
// else one value) as the stylesheet declares it, the resolved value where the token is derived (FR-002, R-12), the
// comparison kind (`colour`, `keyword` for `color-scheme`, else the probe of research.md R-03), and for a probe the
// used value the browser reports at a 1280 × 800 viewport, a 16px root font size and a 1000px wide containing block.

export type Group = "colour" | "type" | "space" | "shape" | "size" | "shell" | "elevation" | "motion";

/** A value per theme. */
export interface PerTheme {
  readonly light: string;
  readonly dark: string;
}

/** How a browser test observes a non-colour token: a CSS property of a probe element and the used value it reports. */
export interface Probe {
  readonly property: string;
  /** The used value: a number of CSS pixels (compared within 1/64 px, the layout unit) or the exact computed text. */
  readonly used: number | string | { readonly light: string; readonly dark: string };
}

export interface ExpectedToken {
  readonly name: string;
  readonly group: Group;
  /** The declared value: per theme for the theme-dependent groups, else one value; derived tokens in reference form. */
  readonly declared: string | PerTheme;
  /** The resolved value (the JSON export's value); the declared value where the token is not derived. */
  readonly resolved: string | PerTheme;
  /** The tokens a derived token references, per theme where the value is per theme. */
  readonly ref?: readonly string[] | { readonly light: readonly string[]; readonly dark: readonly string[] };
  readonly compare: "colour" | "keyword" | Probe;
}

function colour(name: string, light: string, dark: string): ExpectedToken {
  return { name, group: "colour", declared: { light, dark }, resolved: { light, dark }, compare: "colour" };
}

function derivedColour(name: string, from: string, light: string, dark: string): ExpectedToken {
  const reference = `var(--ocelle-${from})`;
  return {
    name,
    group: "colour",
    declared: { light: reference, dark: reference },
    resolved: { light, dark },
    ref: { light: [from], dark: [from] },
    compare: "colour",
  };
}

function plain(name: string, group: Group, value: string, probe: Probe): ExpectedToken {
  return { name, group, declared: value, resolved: value, compare: probe };
}

function derived(name: string, group: Group, value: string, resolved: string, ref: readonly string[], probe: Probe): ExpectedToken {
  return { name, group, declared: value, resolved, ref, compare: probe };
}

const width = (px: number): Probe => ({ property: "width", used: px });
const fontFamily = '"Schibsted Grotesk", "Helvetica Neue", Arial, system-ui, sans-serif';

/** Every token of Appendix A, in the order of its tables. */
export const expectedTokens: readonly ExpectedToken[] = [
  // A.1 Colour
  colour("color-canvas", "#F1EEE8", "#15130F"),
  colour("color-sheet", "#FBFAF7", "#211E18"),
  colour("color-pane", "#FFFFFF", "#1C1A15"),
  colour("color-panel", "#F1EEE8", "#15130F"),
  colour("color-inspector", "#F1EEE8", "#15130F"),
  colour("color-rail", "#E9E5DD", "#1C1A15"),
  colour("color-inset", "#E2DDD3", "#302B23"),
  colour("color-ink", "#15130F", "#EDE9E1"),
  colour("color-ink-soft", "#3F3A33", "#CFC9BE"),
  colour("color-ink-muted", "#5E584F", "#A39D92"),
  // 011 (FR-030, research.md R-12, data-model.md § Tokens added): the eyebrow colour, an alias of the muted ink in both
  // themes, with a text contrast entry on every main ground (User Story 1, FR-032).
  derivedColour("color-eyebrow", "color-ink-muted", "#5E584F", "#A39D92"),
  colour("color-rule", "#D9D3C7", "#3A342B"),
  colour("color-rule-strong", "#B9B1A2", "#4D463A"),
  colour("color-control-border", "#8A8276", "#7A7264"),
  colour("color-chrome", "#15130F", "#0D0C0A"),
  colour("color-chrome-ink", "#EDE9E1", "#EDE9E1"),
  colour("color-chrome-muted", "#A39D92", "#A39D92"),
  colour("color-chrome-hover", "#211D18", "#24211B"),
  // 012 (research.md R-08 item 4a, plan decision 20): the pressed surface of a control on the chrome grounds.
  colour("color-chrome-active", "#3A342B", "#3A342B"),
  colour("color-accent", "#C68A1E", "#C68A1E"),
  // 012 (research.md R-08 item 3): the primary button's hover fill.
  colour("color-accent-hover", "#D9A23F", "#D9A23F"),
  colour("color-on-accent", "#15130F", "#15130F"),
  colour("color-accent-low", "#F1E1C0", "#3A2B10"),
  colour("color-accent-strong", "#8F5E0F", "#E0A23A"),
  derivedColour("color-focus", "color-accent-strong", "#8F5E0F", "#E0A23A"),
  derivedColour("color-current", "color-accent-strong", "#8F5E0F", "#E0A23A"),
  colour("color-link", "#84560D", "#E0A23A"),
  colour("color-link-hover", "#15130F", "#F7F4EE"),
  colour("color-hover-bg", "#E2DDD3", "#2A261F"),
  // 012 (research.md R-08 item 3, #525): the border of a hovered or pressed bordered control, an alias of color-ink a
  // host overrides on an ancestor; and the pressed surface of secondary, quiet and flush controls.
  derivedColour("color-hover-border", "color-ink", "#15130F", "#EDE9E1"),
  colour("color-active-bg", "#D3CCBF", "#3A342B"),
  colour("color-disabled-ink", "#6F685D", "#8C8579"),
  colour("color-disabled-bg", "#E6E1D8", "#2A261F"),
  colour("color-overlay", "rgb(21 19 15 / 0.5)", "rgb(0 0 0 / 0.65)"),
  colour("color-danger", "#A8322C", "#E97373"),
  colour("color-danger-bg", "#F6E2E0", "#2E1616"),
  colour("color-warning", "#7A5205", "#E0A23A"),
  colour("color-warning-bg", "#F4E6C8", "#2E2410"),
  colour("color-success", "#2F6B3A", "#8FCB8F"),
  colour("color-success-bg", "#E4EFE3", "#15241A"),
  colour("color-info", "#2C5E86", "#A9C7E8"),
  colour("color-info-bg", "#E6EDF3", "#14202E"),
  colour("color-neutral", "#5E584F", "#A39D92"),
  colour("color-neutral-bg", "#E6E1D8", "#2A261F"),
  { name: "color-scheme", group: "colour", declared: { light: "light", dark: "dark" }, resolved: { light: "light", dark: "dark" }, compare: "keyword" },

  // A.2 Type
  plain("font-sans", "type", fontFamily, { property: "font-family", used: fontFamily }),
  derived("font-display", "type", "var(--ocelle-font-sans)", fontFamily, ["font-sans"], { property: "font-family", used: fontFamily }),
  plain("figures", "type", "tabular-nums", { property: "font-variant-numeric", used: "tabular-nums" }),
  plain("font-size-xs", "type", "0.75rem", { property: "font-size", used: "12px" }),
  plain("font-size-sm", "type", "0.875rem", { property: "font-size", used: "14px" }),
  plain("font-size-md", "type", "1rem", { property: "font-size", used: "16px" }),
  plain("font-size-fact", "type", "1.0625rem", { property: "font-size", used: "17px" }),
  // 003 (research.md R-08, data-model.md § New tokens): the prose h2, 18 px (User Story 3, FR-015).
  plain("font-size-subhead", "type", "1.125rem", { property: "font-size", used: "18px" }),
  plain("font-size-lg", "type", "1.25rem", { property: "font-size", used: "20px" }),
  plain("font-size-xl", "type", "1.5rem", { property: "font-size", used: "24px" }),
  plain("font-size-2xl", "type", "1.875rem", { property: "font-size", used: "30px" }),
  plain("line-height-tight", "type", "1.15", { property: "line-height", used: 18.4 }),
  plain("line-height-normal", "type", "1.45", { property: "line-height", used: 23.2 }),
  plain("line-height-relaxed", "type", "1.55", { property: "line-height", used: 24.8 }),
  // 003 (research.md R-08, data-model.md § New tokens): the compact scale's line height (User Story 2, FR-012).
  plain("line-height-compact", "type", "1.5", { property: "line-height", used: 24 }),
  // 003 (research.md R-08, data-model.md § New tokens): the prose running text's line height (User Story 3, FR-015).
  plain("line-height-prose", "type", "1.65", { property: "line-height", used: 26.4 }),
  plain("font-weight-regular", "type", "400", { property: "font-weight", used: "400" }),
  plain("font-weight-medium", "type", "500", { property: "font-weight", used: "500" }),
  plain("font-weight-strong", "type", "600", { property: "font-weight", used: "600" }),
  plain("font-weight-display", "type", "800", { property: "font-weight", used: "800" }),
  plain("tracking-display", "type", "-0.03em", { property: "letter-spacing", used: -0.48 }),
  // 011 (FR-030, research.md R-12, data-model.md § Tokens added): the eyebrow's size and weight, aliases of the 12 px
  // size and the strong weight, and its letter spacing, 0.08em of the probe's 16 px (User Story 1, FR-031).
  derived("font-size-eyebrow", "type", "var(--ocelle-font-size-xs)", "0.75rem", ["font-size-xs"], { property: "font-size", used: "12px" }),
  derived("font-weight-eyebrow", "type", "var(--ocelle-font-weight-strong)", "600", ["font-weight-strong"], { property: "font-weight", used: "600" }),
  plain("tracking-eyebrow", "type", "0.08em", { property: "letter-spacing", used: 1.28 }),

  // A.3 Space, shape, size
  plain("space-1", "space", "0.25rem", width(4)),
  plain("space-2", "space", "0.5rem", width(8)),
  plain("space-3", "space", "0.75rem", width(12)),
  plain("space-4", "space", "1rem", width(16)),
  plain("space-5", "space", "1.25rem", width(20)),
  plain("space-6", "space", "1.5rem", width(24)),
  plain("space-7", "space", "2rem", width(32)),
  plain("space-8", "space", "2.5rem", width(40)),
  plain("space-9", "space", "3rem", width(48)),
  plain("space-10", "space", "4rem", width(64)),
  derived("gutter", "space", "var(--ocelle-space-4)", "1rem", ["space-4"], width(16)),
  // 009 (research.md R-16, FR-033): the scroller's fade depth and focus clearance.
  derived("scroller-fade-size", "space", "var(--ocelle-space-7)", "2rem", ["space-7"], width(32)),
  plain("radius-1", "shape", "2px", width(2)),
  plain("radius-2", "shape", "4px", width(4)),
  plain("radius-row", "shape", "6px", width(6)),
  plain("radius-shell", "shape", "10px", width(10)),
  plain("radius-pill", "shape", "999px", width(999)),
  plain("border-width", "shape", "1px", width(1)),
  plain("focus-width", "shape", "3px", width(3)),
  plain("focus-offset", "shape", "2px", width(2)),
  // 012 (research.md R-12; data-model.md § Tokens): the negative offset that draws a focus ring inside a box, -5 px
  derived("focus-offset-inset", "shape", "calc(-1 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)))", "calc(-1 * (2px + 3px))", ["focus-offset", "focus-width"], { property: "outline-offset", used: -5 }),
  plain("bar-width", "shape", "3px", width(3)),
  plain("ring-step", "shape", "1.5px", width(1.5)),
  plain("target-min", "size", "2.75rem", width(44)),
  plain("icon-size", "size", "1.25rem", width(20)),
  plain("size-dot", "size", "0.45rem", width(7.2)),
  plain("size-step", "size", "1.4rem", width(22.4)),
  plain("size-avatar", "size", "1.6rem", width(25.6)),
  plain("size-rail-item", "size", "2.5rem", width(40)),
  plain("size-visually-hidden", "size", "1px", width(1)),
  // 008 (data-model.md § New tokens, research.md R-09): the tooltip bubble's maximum inline size, about 40 characters of
  // font-size-sm.
  plain("tooltip-max-inline", "size", "18rem", width(288)),

  // A.4 Shell and measure
  plain("shell-topbar-height", "shell", "3.25rem", width(52)),
  plain("shell-rail-width", "shell", "3.25rem", width(52)),
  plain("shell-sidebar-width", "shell", "20rem", width(320)),
  plain("shell-inspector-width", "shell", "19rem", width(304)),
  plain("shell-main-max", "shell", "48rem", width(768)),
  plain("shell-collapse-inspector", "shell", "75rem", width(1200)),
  plain("shell-collapse-sidebar", "shell", "45rem", width(720)),
  plain("app-shell-narrow-below", "shell", "45rem", width(720)),
  plain("app-shell-collapse-below", "shell", "68.75rem", width(1100)),
  plain("shell-height", "shell", "100dvh", width(800)),
  plain("footer-h", "shell", "4.5rem", width(72)),
  derived("measure-sheet", "shell", "var(--ocelle-shell-main-max)", "48rem", ["shell-main-max"], width(768)),
  derived("measure-sentence", "shell", "var(--ocelle-shell-main-max)", "48rem", ["shell-main-max"], width(768)),
  plain("measure-page", "shell", "100%", width(1000)),
  // 003 (research.md R-08, R-13, data-model.md § New tokens): the prose reading measure and table cell floor (User
  // Story 3, FR-016, FR-017). A `ch` length is the width of "0" in the probe's font, which the token page leaves to
  // the browser's default font, so its pixel value would depend on the machine: these two are read as the value a
  // custom property substitutes, and the styles browser tests measure them against the zero of Schibsted Grotesk.
  plain("measure-reading", "shell", "68ch", { property: "--probe", used: "68ch" }),
  plain("measure-cell", "shell", "12ch", { property: "--probe", used: "12ch" }),
  // 003 (research.md R-08): the inline size of the nearest query container, which caps a prose caption at its table's
  // visible width (FR-017). The probes' 1000px block is a query container, so it resolves to 1000px, not to the
  // 1280px viewport that `cqi` falls back to without one.
  plain("measure-container", "shell", "100cqi", width(1000)),
  derived("dialog-max-inline", "shell", "calc(100vw - 2 * var(--ocelle-gutter))", "calc(100vw - 2 * 1rem)", ["gutter"], width(1248)),
  derived("dialog-max-block", "shell", "calc(100dvh - 2 * var(--ocelle-gutter))", "calc(100dvh - 2 * 1rem)", ["gutter"], width(768)),
  // 008 (data-model.md § New tokens, research.md R-09): the drawer's inline size, the sidebar's width, which #12's
  // personal drawer replaces at narrow widths (spec-kitty-design#450).
  derived("drawer-inline", "shell", "var(--ocelle-shell-sidebar-width)", "20rem", ["shell-sidebar-width"], width(320)),
  derived(
    "bar-block-narrow",
    "shell",
    "calc(2 * var(--ocelle-target-min) + 3 * var(--ocelle-space-2))",
    "calc(2 * 2.75rem + 3 * 0.5rem)",
    ["target-min", "space-2"],
    width(112),
  ),
  // 009 (research.md R-16, FR-033): a board lane's minimum and flex basis, list-detail's list pane, and list-detail's
  // default `collapse-below` and `inspector-below` thresholds.
  plain("lane-min-width", "shell", "10rem", width(160)),
  plain("list-track-width", "shell", "18rem", width(288)),
  plain("list-detail-collapse", "shell", "40rem", width(640)),
  plain("list-detail-inspector-collapse", "shell", "60rem", width(960)),

  // A.5 Elevation and motion
  {
    name: "elevation-sheet",
    group: "elevation",
    declared: { light: "0 0 0 1px var(--ocelle-color-rule)", dark: "0 0 0 1px var(--ocelle-color-rule)" },
    resolved: { light: "0 0 0 1px #D9D3C7", dark: "0 0 0 1px #3A342B" },
    ref: { light: ["color-rule"], dark: ["color-rule"] },
    compare: { property: "box-shadow", used: { light: "rgb(217, 211, 199) 0px 0px 0px 1px", dark: "rgb(58, 52, 43) 0px 0px 0px 1px" } },
  },
  {
    name: "elevation-raised",
    group: "elevation",
    declared: { light: "0 2px 4px rgb(21 19 15 / 0.10), 0 12px 32px rgb(21 19 15 / 0.16)", dark: "0 0 0 1px var(--ocelle-color-rule-strong)" },
    resolved: { light: "0 2px 4px rgb(21 19 15 / 0.10), 0 12px 32px rgb(21 19 15 / 0.16)", dark: "0 0 0 1px #4D463A" },
    ref: { light: [], dark: ["color-rule-strong"] },
    compare: {
      property: "box-shadow",
      used: {
        light: "rgba(21, 19, 15, 0.1) 0px 2px 4px 0px, rgba(21, 19, 15, 0.16) 0px 12px 32px 0px",
        dark: "rgb(77, 70, 58) 0px 0px 0px 1px",
      },
    },
  },
  {
    name: "elevation-row",
    group: "elevation",
    declared: {
      light: "0 0 0 1px var(--ocelle-color-control-border), 0 2px 8px rgb(21 19 15 / 0.08)",
      dark: "0 0 0 1px var(--ocelle-color-control-border)",
    },
    resolved: { light: "0 0 0 1px #8A8276, 0 2px 8px rgb(21 19 15 / 0.08)", dark: "0 0 0 1px #7A7264" },
    ref: { light: ["color-control-border"], dark: ["color-control-border"] },
    compare: {
      property: "box-shadow",
      used: {
        light: "rgb(138, 130, 118) 0px 0px 0px 1px, rgba(21, 19, 15, 0.08) 0px 2px 8px 0px",
        dark: "rgb(122, 114, 100) 0px 0px 0px 1px",
      },
    },
  },
  {
    name: "elevation-seg",
    group: "elevation",
    declared: {
      light: "0 0 0 1px var(--ocelle-color-control-border), 0 1px 2px rgb(21 19 15 / 0.08)",
      dark: "0 0 0 1px var(--ocelle-color-control-border)",
    },
    resolved: { light: "0 0 0 1px #8A8276, 0 1px 2px rgb(21 19 15 / 0.08)", dark: "0 0 0 1px #7A7264" },
    ref: { light: ["color-control-border"], dark: ["color-control-border"] },
    compare: {
      property: "box-shadow",
      used: {
        light: "rgb(138, 130, 118) 0px 0px 0px 1px, rgba(21, 19, 15, 0.08) 0px 1px 2px 0px",
        dark: "rgb(122, 114, 100) 0px 0px 0px 1px",
      },
    },
  },
  {
    name: "elevation-bar",
    group: "elevation",
    declared: { light: "0 -6px 16px rgb(21 19 15 / 0.05)", dark: "none" },
    resolved: { light: "0 -6px 16px rgb(21 19 15 / 0.05)", dark: "none" },
    compare: { property: "box-shadow", used: { light: "rgba(21, 19, 15, 0.05) 0px -6px 16px 0px", dark: "none" } },
  },
  plain("motion-fast", "motion", "120ms", { property: "transition-duration", used: "0.12s" }),
  plain("motion-base", "motion", "200ms", { property: "transition-duration", used: "0.2s" }),
  // 012 (research.md R-07; data-model.md § Tokens): one turn of the busy spinner, 0ms under reduced motion, and its angle
  plain("motion-spin", "motion", "800ms", { property: "transition-duration", used: "0.8s" }),
  plain("motion-turn", "motion", "1turn", { property: "rotate", used: "360deg" }),
  plain("easing-standard", "motion", "cubic-bezier(0.22, 1, 0.36, 1)", {
    property: "transition-timing-function",
    used: "cubic-bezier(0.22, 1, 0.36, 1)",
  }),
  // 008 (data-model.md § New tokens, research.md R-09): the tooltip's hover delay; not zeroed under reduced motion,
  // because a delay is not motion (brand rule (f) sets only motion-fast and motion-base).
  plain("tooltip-delay", "motion", "500ms", { property: "transition-duration", used: "0.5s" }),
];

/** A.6: the tokens that must not exist. */
export const excludedNames: readonly string[] = ["color-proto", "color-proto-bg", "font-size-ui", "font-size-body", "font-size-title", "radius-3"];

/** The theme-dependent groups (FR-001). */
export const themedGroups: readonly Group[] = ["colour", "elevation"];

/** The six theme conditions of FR-006 (data-model.md § Theme condition) and the theme each gives. */
export const themeConditions = [
  { id: "system-light", colorScheme: "light", dataTheme: undefined, theme: "light" },
  { id: "system-dark", colorScheme: "dark", dataTheme: undefined, theme: "dark" },
  { id: "no-preference", colorScheme: "no-preference", dataTheme: undefined, theme: "light" },
  { id: "system-dark+data-theme=light", colorScheme: "dark", dataTheme: "light", theme: "light" },
  { id: "system-light+data-theme=dark", colorScheme: "light", dataTheme: "dark", theme: "dark" },
  { id: "no-preference+data-theme=dark", colorScheme: "no-preference", dataTheme: "dark", theme: "dark" },
] as const;

/** A value in a theme. */
export function inTheme(value: string | PerTheme, theme: "light" | "dark"): string {
  return typeof value === "string" ? value : value[theme];
}
