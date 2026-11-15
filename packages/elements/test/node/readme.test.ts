import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The package documentation (005 FR-002, FR-007, FR-008, FR-029, FR-031, FR-033, FR-034, SC-008; research.md R-15;
// T020), on the model of 003's readme test: the README states the element conventions a later element mission
// follows (module and registration, `static properties`, `define`, the JSDoc tags, styles, the `hidden` rule, the
// forced-colours rule, the manifest and the token rule of FR-007, stories, the file and test layout, the two builds and
// which host uses which, the browser build's path, the engine-floor rule), the entry points, the tokens (link
// `tokens.css` first; an icon without it), `ocelle-icon`'s token, the engines, host ARIA and two copies on a page; the
// CHANGELOG names `ocelle-icon` and the entry points under Unreleased; THIRD_PARTY_NOTICES holds the Lit entry for the
// browser build, with the licence text beside it. One assertion per statement; whitespace is normalised, so a fragment
// may wrap across lines. Phase 3 adds the icon set: its table of names with their consumer needs, the drawing and
// mirroring rules and the licence sentence (US2-5's "`THIRD_PARTY_NOTICES` lists no icon set" is exempt from red,
// reviews/phase-3/tdd-exempt.md), and the thirteen names in the CHANGELOG. Phase 4 adds the slot convention (slots,
// size, alignment, the `1lh` row and its padding rule, gap, colour, the base-stylesheet interaction, resizing, the
// `viewBox` rule and the lint's `1lh` limit) and the naming rule (T045, SC-007). Phase 5 adds the mark (T056): its
// variants and grounds, the tokens it reads, its box and the percentage-height rule, forced colours, the light-mode
// spot, behaviour without `tokens.css`, its entry point, its licence sentence and the trademark note of FR-030 (in the
// README and in the repository's `NOTICE`), and the CHANGELOG's final surface list (FR-031).
/** A file's text, relative to the package; empty while it does not exist, so each assertion reports what is missing. */
function read(file: string): string {
  const url = new URL(`../../${file}`, import.meta.url);
  return existsSync(url) ? readFileSync(url, "utf8") : "";
}
const flat = (text: string): string => text.replace(/\s+/g, " ");

const fragments = [
  // module and registration (FR-002, R-02)
  "Each element lives in its own module, `src/<tag>.ts`, which ends with one `define(\"<tag>\", <Class>)` call: importing the module defines that element and no other, and importing the package root defines every element",
  "`define` (`src/define.ts`, internal) defines a tag only while it is free: a second definition of the same tag does nothing and throws nothing.",
  // static properties and the JSDoc tags (R-01, R-02, R-06)
  "Elements declare their reactive properties with `static override properties = { … }` and `declare` fields, not decorators",
  "Every element class carries the JSDoc tag `@tagname <tag>`, and every public property a description and `@default undefined`: the manifest takes the tag name and the defaults from them",
  "An element that observes a standard attribute such as `aria-label` adds it to `observedAttributes` without declaring a property, so the manifest does not list it",
  // styles (FR-003, R-03, R-04, R-09)
  "An element's styles are one `css` tagged template assigned to `static styles`, built only from `--ocelle-*` tokens and the values the `style-lint` gate allows, so every instance adopts one shared stylesheet",
  "No template has a `style` attribute or a `<style>` element",
  "Every element's styles hold `:host([hidden]) { display: none; }` beside its `:host` display rule, which would otherwise beat the user-agent `[hidden]` rule.",
  "Variant rules go inside `@media not (forced-colors: active)`, so a forced-colours rule never has to outrank a variant selector",
  // the manifest and the token rule (FR-007, FR-009)
  "`custom-elements.json` is generated from the element source by `pnpm --filter @ocelle/elements run manifest` and committed; the `manifest` gate fails when it differs from a regeneration or when a public member has no description",
  "It declares, for every element, its tag name, its class, every public property and attribute with type, default and description, and its events, slots, CSS parts and CSS custom properties, each list stated even when empty",
  "An `--ocelle-*` token of `@ocelle/tokens` that an element reads by inheritance is not one of the element's CSS custom properties and is not in its manifest entry",
  "This README names the tokens each element reads, and overriding a token is the way to change what the element takes from it",
  "An element's own hook is a CSS custom property named `--ocelle-<element>-<property>`, which matches no token name",
  // stories (FR-019, R-14)
  "Every element has a story per variant and per state in `storybook/stories/<element>.stories.ts`, in light and dark, and its stories pass the `csp` and `prefix` gates' Storybook checks",
  // file and test layout (FR-008, R-11)
  "Files: `src/<tag>.ts` per element, internal modules beside them in `src/` (not entry points), `src/index.ts` (the package root) and `src/browser.ts` (the browser build's entry)",
  "Tests: the browser scenarios are written once in `test/scenarios/` against a driver and run twice, in process on the element source by `test/*.test.ts` (the `elements` project, which Stryker mutates) and on the built browser build on strict-CSP fixture pages by `test/browser/*.test.ts` (the `elements-browser` project)",
  "Node tests of the generator, the configuration and this README are in `test/node/`; tests that run the build or `pnpm pack` are in `test/build/`",
  // the two builds and which host uses which (FR-033, R-05)
  "The module build, `dist/*.js`, imports `lit` by a bare specifier and needs a bundler: it is for hosts with one, such as Kitty Desktop",
  "The browser build, `dist/browser/ocelle-elements.js`, holds Lit, imports nothing and defines every element: it is for hosts without a bundler, such as the Ocelle console",
  "A host without a bundler copies `dist/browser/ocelle-elements.js` out of the package, serves it by path and loads it with one same-origin `<script type=\"module\" src>` and no import map",
  "A page under `script-src 'self'` cannot load the module build directly: nothing can map its bare `lit` import there",
  "The browser build starts with a licence banner naming Apache-2.0, Lit's copyright and BSD-3-Clause licence, and `THIRD_PARTY_NOTICES`",
  // tokens (FR-008, R-04, R-15)
  "Link `tokens.css` of `@ocelle/tokens` first",
  "The elements read their sizes and colours from its custom properties by inheritance and bundle none of them",
  "Linked without it, `--ocelle-icon-size` is undefined, so an icon is drawn at the SVG default size (300 × 300 px in a paragraph)",
  // ocelle-icon's token (FR-007, FR-011, US1-11)
  "`ocelle-icon` reads the token `--ocelle-icon-size`: overriding it on an ancestor resizes every icon in that subtree",
  // engines (FR-008, R-05)
  // 008 (tasks.md T044; FR-040, research.md R-10): the floor raised to WebKit 17 by the Popover API
  "Engine floor: Chromium 120+ and WebKit 17+, with no `window.ShadyCSS` polyfill on the page",
  "The Popover API: Chromium 114, WebKit 17",
  "`:dir()`: Chromium 120, WebKit 16.4",
  "`@media not (forced-colors: active)` (Media Queries 4's `not (…)` without a media type): Chromium 104, WebKit 16.4",
  "The `lh` unit: Chromium 109",
  "The `scale` property: Chromium 104",
  "Constructable stylesheets (`adoptedStyleSheets`): Chromium 73, WebKit 16.4",
  "An element that uses a feature newer than the floor raises the floor in this section, the one list of the floor features, and records the feature in its own feature's research",
  "Only Chromium is measured. WebKit (Kitty Desktop on macOS and Linux) is not: its accessibility tree, forced colours and mirroring are an open limitation",
  // host ARIA (FR-034, PLAN-A11Y-SECURITY-1-002 (a), 1-003 (a))
  "A host `aria-label` names the element as `label` does, and when present it decides alone: a blank host `aria-label` leaves the element unlabelled even with a `label`",
  "When both are set, the host `aria-label` is the name; removing it falls back to `label`",
  "Chromium uses a host `aria-label` as written, surrounding spaces included, so pass it trimmed; the element never rewrites it",
  "A host `aria-hidden=\"true\"` hides the element, labelled or not",
  "A host `hidden` attribute removes the element: no box and no node, labelled or not",
  "A host `role` or `aria-hidden=\"false\"` is not supported: name the element with `label` or `aria-label` instead",
  // the icon set (FR-017, FR-018, FR-029, US2 scenarios 1 and 5)
  "`name` (attribute and property, reflected): the icon's name, exactly as listed in Icons",
  "Every drawing is the project's own, on a 24-unit grid with one stroke width, round caps and joins, painted only in `currentColor`",
  "`chevron-start`, `chevron-end`, `arrow-start` and `arrow-end` follow the inline direction: under right-to-left text (`dir=\"rtl\"` on the icon or an ancestor) they are mirrored, so start points right and end points left; the other icons are never mirrored",
  "The names are public surface: renaming or removing one is a major change, adding one a minor change",
  "Every icon is the project's own drawing, under Apache-2.0; no third-party icon set is used, so `THIRD_PARTY_NOTICES` lists none",
  // the slot convention (FR-020 to FR-022, SC-007; research.md R-03, R-10, R-15; US3 scenario 7)
  "A control that shows icons follows one slot convention: an `icon` slot before its label and, where it has an end icon such as the action row's arrow, a `trailing` slot after it",
  "The control renders, in its shadow root, a row with the class `icon-row` holding `<span class=\"icon-slot\"><slot name=\"icon\"></slot></span>`, its label, and `<span class=\"icon-slot trailing\"><slot name=\"trailing\"></slot></span>`, and adds `iconSlotStyles` (`src/icon-slot.ts`, internal) to its `static styles`",
  "A slotted icon, an `ocelle-icon` or a bare `<svg>`, is `--ocelle-icon-size` square and does not shrink, whatever a normal page rule, `base.css` or its `width` and `height` attributes set",
  "The row sets the type (font size and line height) that the wrappers and the label inherit; each wrapper is one line box tall (`1lh`) with the icon centred in it, so the icon is centred on the label's first line at any type size and leading, overflowing the line box evenly when it is taller",
  "The row's block padding, `calc((var(--ocelle-icon-size) - 1lh) / 2)` from `iconSlotStyles` (0 when the line box is at least the icon size), keeps that overflow inside the control's box",
  "A control never sets block padding on the row; it puts any further block padding on an element around the row",
  "A slotted icon is separated from the label by `--ocelle-space-2`; an empty slot takes no space and adds no gap",
  "A slotted icon takes the control's text colour: `ocelle-icon` draws in `currentColor`, and a bare `<svg>` does so when its drawing uses `currentColor`",
  "`base.css` gives every light-DOM `svg` `max-inline-size: 100%` and `block-size: auto`, and page rules beat a shadow root's normal rules; the convention's size rules on slotted elements are `!important`, so neither `base.css` nor a host rule changes a slotted icon's box",
  "Resize slotted icons only by overriding `--ocelle-icon-size` on the control or an ancestor: the convention pins the token on every slotted element to the control's value, so `--ocelle-icon-size` set on a slotted icon itself has no effect",
  "A slotted SVG needs a `viewBox` to scale: with one, the drawing is scaled into the box, centred, aspect kept; without one it gets the box only",
  "The `style-lint` gate allows the unit `lh` only as `1lh`, alone or once as an operand of `+` or `-` beside an `--ocelle-*` token inside `calc()`; a factor on a parenthesised `calc()` group that holds `1lh`, such as `calc((var(--ocelle-space-1) + 1lh) * 2)`, passes the gate and is checked in review",
  // the naming rule (FR-023, SC-003)
  "An icon-only control names its own inner control (for example with `aria-label` on its inner `<button>`), never its icon: a slotted icon stays decorative and is never given a `label`",
  "The convention adds no generated content, so a control named by its visible label keeps exactly that name",
  // ocelle-brand-mark (FR-024 to FR-028, US4 scenarios 1 to 8 and 12; research.md R-09, R-15; Edge Cases)
  "`ocelle-brand-mark` draws the Ocelle rosette, a broken ring around an ochre spot, inline in its shadow root from tokens only",
  "By default it is for the main grounds (`color-canvas`, `color-sheet`, `color-pane`, `color-panel`, `color-inspector`, `color-rail`, `color-inset`, `color-accent-low` and `color-hover-bg`): ring `--ocelle-color-ink`, spot `--ocelle-color-accent`",
  "`ground` (attribute and property, reflected): `chrome` for the dark chrome grounds `color-chrome` and `color-chrome-hover` (the top bar and the rails, in both themes): ring `--ocelle-color-chrome-ink`, spot `--ocelle-color-accent`",
  "`tone` (attribute and property, reflected): `mono` paints ring and spot in `currentColor`, the colour of the text around the mark, on any ground; it wins over `ground`",
  "Any other value of `ground` or `tone` gives the default",
  "`label` (attribute and property, not reflected): the accessible name of the mark, trimmed; empty or whitespace-only counts as none. Without a label the mark is decorative: hidden from the accessibility tree, as beside the product name in a top bar, which carries the name",
  "`ocelle-brand-mark` reads the tokens `--ocelle-icon-size`, `--ocelle-color-ink`, `--ocelle-color-chrome-ink` and `--ocelle-color-accent`",
  "The mark is `--ocelle-icon-size` high and as wide as high: a host that sets only its `block-size` gets a square, in a flex column too, and one that sets only its `inline-size` gets a box that is not square, with the drawing scaled to the smaller side and centred",
  "A host that sizes the mark by percentage needs a container of definite height: against an indefinite one (a bar with only a minimum height, or a paragraph) the percentage acts as `auto` and the mark falls back to the SVG default size, 300 × 300 px",
  "In forced colours the ring and the spot are painted in `currentColor` in every variant, the system colour of their context",
  "The main-ground variant on the chrome, or the chrome variant on a main ground, is a host mistake: it is documented, not detected",
  "On the light main grounds the ochre spot measures 2.6:1: the ring carries the mark, and a host that needs every part at 3:1 uses `tone=\"mono\"`",
  "Linked without it, an `ocelle-brand-mark` is drawn at the SVG default size too, and its ring is not painted",
  "`ocelle-brand-mark` has no slot, event, CSS part or CSS custom property",
  // the mark's licence and the trademark note (FR-029, FR-030, US4 scenario 10)
  "The mark is the project's own drawing of the Ocelle rosette, redrawn from the geometry of Ocelle's app icon, under Apache-2.0",
  "\"Ocelle\" and the rosette mark are trademarks of their owner. The Apache-2.0 licence grants no right to use them (section 6 of the licence); they may be used only to refer to Ocelle",
  // two copies on a page (FR-006, Edge Cases)
  "Two copies of the package on one page, two versions or the browser build beside a bundle of the module build, cannot both define an element: the first definition wins and the second import throws nothing",
];

/** The entry points (FR-002): specifier, file and what it defines, exactly, in the README's table. */
const entryRows = [
  "| `@ocelle/elements` | `dist/index.js` | every element; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-icon.js` | `dist/ocelle-icon.js` | `ocelle-icon` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-brand-mark.js` | `dist/ocelle-brand-mark.js` | `ocelle-brand-mark` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-dialog.js` | `dist/ocelle-dialog.js` | `ocelle-dialog` and the `ocelle-icon` it renders; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-drawer.js` | `dist/ocelle-drawer.js` | `ocelle-drawer` and the `ocelle-icon` it renders; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-tooltip.js` | `dist/ocelle-tooltip.js` | `ocelle-tooltip` only; for hosts with a bundler |",
  "| `@ocelle/elements/browser.js` | `dist/browser/ocelle-elements.js` | every element, Lit inside; for hosts without a bundler |",
  "| `@ocelle/elements/custom-elements.json` | `custom-elements.json` | the manifest, also named by the `customElements` field |",
];

/**
 * The icon set (FR-017, FR-018, SC-007; research.md R-07): every name with whether it mirrors and the consumer need it
 * meets, exactly, in the README's Icons table, in the spec's order; `folder`, `file`, `search` and `table` name the
 * kitty-mission-ui needs they replace.
 */
const iconRows = [
  "| `chevron-start` | yes | back navigation; the start direction of scrollers and breadcrumbs |",
  "| `chevron-end` | yes | the disclosure (#13); the end direction of scrollers and breadcrumbs |",
  "| `chevron-up` | no | collapsing a disclosure (#13) and scrolling up |",
  "| `chevron-down` | no | expanding a disclosure (#13), menus and selects |",
  "| `arrow-start` | yes | going back to the previous screen |",
  "| `arrow-end` | yes | the action row's trailing arrow (#7) |",
  "| `menu` | no | the top bar's menu button (#12) |",
  "| `close` | no | closing a dialog or drawer and dismissing (#16) |",
  "| `folder` | no | kitty-mission-ui's Projects screen (\"Open project\") and the folders of the Artifact Viewer's file tree, replacing its dropped folder icon (spec-kitty-design#496) |",
  "| `file` | no | the files of kitty-mission-ui's Artifact Viewer file tree (spec-kitty-design#496) |",
  "| `search` | no | kitty-mission-ui's Artifact Viewer, replacing its own magnifier glyph (spec-kitty-design#496) |",
  "| `table` | no | kitty-mission-ui's Artifact Viewer, replacing its own table glyph (spec-kitty-design#496) |",
  "| `copy` | no | the copy field's control (#14) |",
];

/** The table rows of one `##` section of the README, as written, without the header and the separator rows. */
function tableRows(text: string, heading: string): string[] {
  const section = new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m").exec(text)?.[1] ?? "";
  return section
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .slice(2);
}

describe("packages/elements/README.md", () => {
  const readme = flat(read("README.md"));

  it.each(fragments)("states: %s", (fragment) => {
    expect(readme).toContain(flat(fragment));
  });

  it("lists exactly the entry points of package.json's exports in its Entry points table (FR-002)", () => {
    const manifest = JSON.parse(read("package.json")) as { exports?: Record<string, string> };
    expect(tableRows(read("README.md"), "Entry points")).toEqual(entryRows);
    expect(Object.keys(manifest.exports ?? {})).toEqual([".", "./ocelle-icon.js", "./ocelle-brand-mark.js", "./ocelle-dialog.js", "./ocelle-drawer.js", "./ocelle-tooltip.js", "./browser.js", "./custom-elements.json"]);
  });

  it("lists the thirteen names of the set, whether each mirrors and the consumer need it meets, in its Icons table (US2-1, FR-018, SC-007)", () => {
    expect(tableRows(read("README.md"), "Icons")).toEqual(iconRows);
  });

  it("names the @ocelle/tokens peer dependency of package.json", () => {
    const manifest = JSON.parse(read("package.json")) as { peerDependencies?: Record<string, string> };
    const pin = manifest.peerDependencies?.["@ocelle/tokens"];
    expect(pin).toBe("workspace:0.0.0");
    expect(readme).toContain(`"@ocelle/tokens": "${String(pin)}"`);
  });
});

/**
 * The `ocelle-dialog` section and the statements about it (008 tasks.md T019; contracts/elements-overlays.md; research.md
 * R-02 to R-05, R-08, R-18; data-model.md § `ocelle-dialog`): what it is, its surface, the tokens it reads, the host
 * pattern, the stated limits, where focus lands when the opener is gone, the opaque-content Tab statement and the
 * closed host's exposure with a host `aria-label` (§ Host ARIA).
 */
const dialogFragments = [
  // the element and its surface
  "`ocelle-dialog` shows its content modally over the page in a native `<dialog>`: the page behind is inert to pointer, keyboard and the accessibility tree until it closes",
  "`open` (attribute and property, reflected): whether the dialog is shown; setting it shows or closes the dialog, and the dialog sets it to false whenever it closes",
  "`label` (attribute and property): the visible heading (level 2) and the dialog's accessible name",
  "`close-label` (attribute; property `closeLabel`): the name of the close control, \"Close\" by default; set it in the host's language",
  "Slots: the default slot is the body; `footer` holds the actions, at the end of the panel, and is not rendered while empty",
  "Parts: `panel` (the `<dialog>`), `heading`, `body`, `footer` and `close-button`",
  "`--ocelle-dialog-inline-size`: the dialog's preferred inline size, `--ocelle-measure-reading` by default; the dialog is never wider than `--ocelle-dialog-max-inline` nor taller than `--ocelle-dialog-max-block`",
  "Events: `ocelle-dialog-close-request` (cancelable; `detail.reason` is `\"escape\"` or `\"close-button\"`) when the user asks to close it, and `ocelle-dialog-close` (`detail.reason` is the request's reason, or `\"host\"` when the host set `open` to false or the platform closed it) once it has left the top layer and focus has returned; both bubble and are composed, and opening dispatches nothing",
  "Cancelling `ocelle-dialog-close-request` keeps the dialog open, with focus inside, on every repetition",
  "A click on the backdrop does nothing",
  // the tokens it reads
  "`ocelle-dialog` reads the tokens `--ocelle-color-sheet`, `--ocelle-color-ink`, `--ocelle-color-overlay`, `--ocelle-elevation-raised`, `--ocelle-radius-2`, `--ocelle-border-width`, `--ocelle-dialog-max-inline`, `--ocelle-dialog-max-block`, `--ocelle-measure-reading`, `--ocelle-font-sans`, `--ocelle-font-size-md`, `--ocelle-font-size-lg`, `--ocelle-font-weight-strong`, `--ocelle-line-height-normal`, `--ocelle-line-height-tight`, `--ocelle-space-2`, `--ocelle-space-3`, `--ocelle-space-4`, `--ocelle-space-6`, `--ocelle-target-min`, `--ocelle-focus-width`, `--ocelle-focus-offset`, `--ocelle-color-focus`, `--ocelle-motion-base` and `--ocelle-easing-standard`, and its close icon `--ocelle-icon-size`",
  // the host pattern
  'opener.addEventListener("click", () => { dialog.open = true; });',
  'dialog.addEventListener("ocelle-dialog-close-request", (e) => { if (hasUnsavedInput()) e.preventDefault(); });',
  'dialog.addEventListener("ocelle-dialog-close", (e) => { /* e.detail.reason */ });',
  // focus and the opener (R-05)
  "On open, focus moves to the first slotted element marked `autofocus` in the body, else to the body's first focusable element, else to the close control",
  "On close, focus returns to the element that had it when the dialog opened, inside shadow roots too, as long as focus is still inside the dialog or on the body; focus another dialog has taken is kept",
  "Where focus lands when the opener is gone: the opener while it is connected, not `disabled` and not inert; otherwise the initial focus target of the overlay beneath, if one is open; otherwise the document body",
  "To move focus elsewhere after a close, move it in the `ocelle-dialog-close` listener, which runs after focus returned: the page stays inert until the exit ends, so a move to page content between `open = false` and `ocelle-dialog-close` has no effect",
  // the label (R-08)
  "A label is required: without a `label` or a host `aria-label` the dialog has no accessible name, and it invents none",
  // the stated limits (R-02, R-03, R-04, R-05a, R-18)
  "A slotted `<form method=\"dialog\">` does nothing to the dialog: close it with `open = false` from the form's submit handler",
  "A slotted widget that handles Escape calls `preventDefault()`, not `stopPropagation()`: if it stops Escape's propagation, the dialog does not see the key, and the platform can close a vetoed dialog on a repeated Escape, with reason `\"host\"`; the first vetoed sequence in a page may hold the veto on a second press as well",
  "Escape with focus inside a slotted iframe does nothing to the dialog",
  "Removing an open dialog from the document (a move, a morph, a portal) closes it with no event and sets `open` to false; set `open` again after re-inserting it",
  "The body is at least three times `--ocelle-target-min` tall (132 px by default) at every size, so a one-line confirmation has space below its text; while the body overflows it is a Tab stop, so it scrolls by keyboard",
  "An overflowing scroller in slotted content with nothing focusable inside (a wide prose table) is a Tab stop where the engine focuses scrollers (Chromium 130 and later); elsewhere it is skipped",
  // the opaque-content Tab statement (R-04)
  "Between the cycle's ends Tab moves as the engine does, so content with a closed shadow root, an iframe or media controls keeps its inner focusable parts reachable by Tab and Shift+Tab in both directions: Shift+Tab from the close control onto such content at the dialog's end enters it from its end, with or without `delegatesFocus`",
  "Leaving a slotted iframe past the cycle's end with Tab can cost one extra press",
  "Slotted content with a positive `tabindex` is visited in the engine's order, and the cycle wraps where that order ends",
  // slotted close watchers and non-modal dialogs (R-02)
  "While a slotted popover (`popover=\"auto\"` or `\"hint\"`, a menu), a native `<dialog>` shown modally from slotted content, or a non-modal `<dialog>` opened after the dialog (by `show()` or the `open` attribute) whose `closedby` is `closerequest` or `any` is open, Escape closes it alone, as the platform does, and the dialog requests nothing; Tab inside a nested native modal is left to the platform",
  "A slotted non-modal `<dialog>` that was already open when the dialog opened, whatever its `closedby`, or one opened after it with `closedby` absent, `auto` or `none`, is ordinary content: Escape requests the dialog's close on every press and leaves it open, so close it yourself if needed",
  "Such a dialog reopened by removing and setting its `open` attribute stays ordinary content (the change fires no event the dialog can see); reopen it with `close()` and then `show()` or the attribute to have Escape close it alone",
  "An open `<dialog>` moved into an already open dialog is outside what was measured: if the platform then closes the dialog on Escape, the close comes with reason `\"host\"`",
  "During the exit, Escape, the close control and the backdrop request nothing; only `open = true` stops a close",
  // reduced motion and forced colours (FR-020, FR-021)
  "The dialog fades in and out over `--ocelle-motion-base` with `--ocelle-easing-standard`, and not at all under `prefers-reduced-motion: reduce`, whatever an ancestor sets on those tokens",
  "In forced colours the panel has a `CanvasText` border on a `Canvas` ground, the backdrop is `Canvas`, and the close control's focus ring is a `Highlight` outline",
  // host ARIA for the overlays (R-08)
  "With a host `aria-label`, an open `ocelle-dialog` exposes one named node, its modal dialog, named by the host `aria-label`; while it is closed, Chromium exposes the host itself as a named generic node",
];

describe("packages/elements/README.md: ocelle-dialog (008)", () => {
  const text = read("README.md");
  const readme = flat(text);

  it.each(dialogFragments)("states: %s", (fragment) => {
    expect(readme).toContain(flat(fragment));
  });

  it("names ocelle-dialog in its intro, before the first section", () => {
    expect(flat(text.split(/^## /m)[0] ?? "")).toContain("`ocelle-dialog`, a modal dialog");
  });

  it("has an `ocelle-dialog` section", () => {
    expect(text).toMatch(/^## `ocelle-dialog`$/m);
  });

  // Operator decision of 2026-11-14 (R-04, the sentinel wrap): the former reverse-wrap limit is gone, so the README
  // states no sentence that a closed shadow root is skipped by the Shift+Tab wrap.
  it("states no reverse-wrap limit: no closed shadow root skipped by the Shift+Tab wrap", () => {
    expect(readme.match(/[^.]*\bskipped by the Shift\+Tab wrap[^.]*/g) ?? []).toEqual([]);
    expect(readme.match(/[^.]*closed shadow root[^.]*\bskipped\b[^.]*/g) ?? []).toEqual([]);
  });
});

/**
 * The `ocelle-drawer` section and the statements about it (008 tasks.md T032; contracts/elements-overlays.md
 * § `ocelle-drawer`; research.md R-07, R-08, R-18; data-model.md § `ocelle-drawer`): what it is, its own surface, what
 * it shares with the dialog, the backdrop, its size, shape and motion, the tokens it reads in the dialog's sentence
 * form, and #12's personal-drawer example.
 */
const drawerFragments = [
  // the element and its surface
  "`ocelle-drawer` shows its content modally in a full-height panel against the inline start or end edge of the viewport, in a native `<dialog>`: the page behind is inert to pointer, keyboard and the accessibility tree until it closes",
  "It has the focus, Escape, close control and event model of `ocelle-dialog`, with the `ocelle-drawer-` events, and a click on the backdrop asks to close it",
  "`open`, `label` and `close-label`, the slots and the parts are those of `ocelle-dialog`",
  "`side` (attribute and property, reflected): `start` (the default) or `end`, the inline edge of the viewport in the drawer's direction, so `start` is the left edge under `dir=\"ltr\"` and the right edge under `dir=\"rtl\"`",
  "`ground` (attribute and property, reflected): `sheet` (the default) or `chrome`, the chrome ground `--ocelle-color-chrome` with `--ocelle-color-chrome-ink` in both themes",
  "Any other value of `side` or `ground` gives the default",
  "`heading-hidden` (attribute; property `headingHidden`, reflected): the heading is not painted and takes no space, but stays in the accessibility tree as the drawer's level-2 heading, and the drawer's accessible name is unchanged; the close control stays visible, focusable and in its place at the panel's block start",
  "Events: `ocelle-drawer-close-request` (cancelable; `detail.reason` is `\"escape\"`, `\"close-button\"` or `\"backdrop\"`) when the user asks to close it, and `ocelle-drawer-close` (`detail.reason` is the request's reason, or `\"host\"` when the host set `open` to false or the platform closed it) once it has left the top layer and focus has returned; both bubble and are composed, and opening dispatches nothing",
  "Cancelling `ocelle-drawer-close-request` keeps the drawer open, with focus inside, on every repetition",
  // the backdrop (R-07)
  "A primary-button click on the backdrop asks to close the drawer with reason `\"backdrop\"`; a press that starts in the panel and ends on the backdrop, or starts on the backdrop and ends in the panel, a click inside the panel and a secondary-button click do nothing",
  "A click on the backdrop of an `ocelle-dialog` opened over the drawer closes neither",
  // size, shape, layout, motion (FR-003, FR-018, FR-026, FR-028)
  "The drawer is as wide as `--ocelle-drawer-inline` (the sidebar width), never wider than `--ocelle-dialog-max-inline`, and as tall as the viewport; it has no `--ocelle-dialog-inline-size`",
  "The two corners on the panel's inner edge, the edge facing the page, are rounded with `--ocelle-radius-2`; the two against the viewport's edge are square",
  "The body fills the panel between the header and the footer, so the footer sits at the panel's end",
  "The drawer slides in from its own edge and back out over `--ocelle-motion-base` with `--ocelle-easing-standard`, mirrored under `dir=\"rtl\"`, and not at all under `prefers-reduced-motion: reduce`, whatever an ancestor sets on those tokens",
  // the tokens it reads (data-model § `ocelle-drawer`)
  "`ocelle-drawer` reads the tokens `--ocelle-color-sheet`, `--ocelle-color-ink`, `--ocelle-color-overlay`, `--ocelle-color-chrome`, `--ocelle-color-chrome-ink`, `--ocelle-elevation-raised`, `--ocelle-radius-2`, `--ocelle-border-width`, `--ocelle-drawer-inline`, `--ocelle-dialog-max-inline`, `--ocelle-font-sans`, `--ocelle-font-size-md`, `--ocelle-font-size-lg`, `--ocelle-font-weight-strong`, `--ocelle-line-height-normal`, `--ocelle-line-height-tight`, `--ocelle-space-2`, `--ocelle-space-3`, `--ocelle-space-4`, `--ocelle-space-6`, `--ocelle-target-min`, `--ocelle-size-visually-hidden`, `--ocelle-focus-width`, `--ocelle-focus-offset`, `--ocelle-color-focus`, `--ocelle-motion-base` and `--ocelle-easing-standard`, and its close icon `--ocelle-icon-size`",
  // #12's personal drawer
  '<ocelle-drawer label="Personal" ground="chrome" heading-hidden side="start">',
  "#12's personal drawer: the chrome ground, a heading kept for the accessibility tree only, and the personal rail as its body",
  // host ARIA for the overlays (R-08)
  "With a host `aria-label`, an open `ocelle-drawer` exposes one named node, its modal dialog, named by the host `aria-label`; while it is closed, Chromium exposes the host itself as a named generic node",
];

describe("packages/elements/README.md: ocelle-drawer (008)", () => {
  const text = read("README.md");
  const readme = flat(text);

  it.each(drawerFragments)("states: %s", (fragment) => {
    expect(readme).toContain(flat(fragment));
  });

  it("names ocelle-drawer in its intro, before the first section", () => {
    expect(flat(text.split(/^## /m)[0] ?? "")).toContain("`ocelle-drawer`, a modal side drawer");
  });

  it("has an `ocelle-drawer` section", () => {
    expect(text).toMatch(/^## `ocelle-drawer`$/m);
  });

  // data-model § `ocelle-drawer`: the drawer has no block cap and no --ocelle-dialog-inline-size, so its tokens
  // sentence names neither --ocelle-dialog-max-block nor --ocelle-measure-reading, nor --ocelle-color-chrome-hover.
  it("names no --ocelle-dialog-max-block, --ocelle-measure-reading or --ocelle-color-chrome-hover in its tokens sentence", () => {
    const sentence = /`ocelle-drawer` reads the tokens [^.]*/.exec(readme)?.[0] ?? "";
    expect({ found: sentence !== "", excluded: ["--ocelle-dialog-max-block", "--ocelle-measure-reading", "--ocelle-color-chrome-hover"].filter((name) => sentence.includes(`\`${name}\``)) }).toEqual({ found: true, excluded: [] });
  });
});

/**
 * The `ocelle-tooltip` section and the statements about it (008 tasks.md T044; contracts/elements-overlays.md
 * § `ocelle-tooltip`; research.md R-10 to R-13; data-model.md § `ocelle-tooltip`): what it is, its surface, show and
 * hide, Escape, placement, the tokens it reads in the dialog's sentence form (analysis U1(a)), FR-037's statement and
 * FR-036's advice (analysis U1(c)), the stated limits (text-field triggers, custom-element triggers with `describes`,
 * touch) and #7's and #12's usage.
 */
const tooltipFragments = [
  // what it is and its surface
  "`ocelle-tooltip` shows a short text in a bubble beside its trigger, the first element in its default slot, when the pointer rests on the trigger or the trigger receives keyboard focus",
  "`text` (attribute and property): the bubble's plain text; an empty text shows no bubble",
  "`placement` (attribute and property, reflected): `top` (the default), `bottom`, `start` or `end`, the side of the trigger the bubble is shown on, `start` and `end` in the tooltip's direction",
  "`disabled` (attribute and property, reflected): no bubble is shown",
  "`describes` (attribute and property, reflected): the text becomes the trigger's accessible description",
  "Slots: the default slot holds the trigger; the `description` slot is the tooltip's own and is never rendered. Part: `bubble`. Events: none",
  "The host is `display: contents`, so wrapping a trigger leaves the trigger's box unchanged",
  // show and hide
  "The bubble shows after the pointer has rested on the trigger for `--ocelle-tooltip-delay`, and at once when the trigger, or a control inside it, receives keyboard focus (it matches `:focus-visible`); focus from a pointer click or a tap neither shows nor keeps it",
  "It stays while the pointer is on the trigger or on the bubble, which the pointer can reach across the gap between them, or the trigger has keyboard focus, with no timeout, and hides when none of these holds",
  "Escape hides it and goes no further: focus and pointer do not move, an open dialog or drawer around it stays open and the next Escape asks to close that, and the bubble stays hidden until the pointer re-enters or keyboard focus arrives again",
  "At most one bubble is shown on the page; it hides when its trigger is removed or disabled and when a dialog or drawer opens",
  "The delay applies under `prefers-reduced-motion: reduce` too (a delay is not motion), and the bubble never animates",
  // placement
  "The bubble is shown in the top layer through the Popover API, above any open dialog or drawer, whole, whatever the overflow, transform or stacking context around the trigger",
  "It is placed on its `placement` side, `--ocelle-space-2` away, and shown on the opposite side when it would overflow the viewport less `--ocelle-gutter`; when it fits on neither side it stays on its `placement` side; across that axis it is kept inside the viewport less `--ocelle-gutter`; it follows the trigger when anything scrolls or the viewport is resized",
  "It is never wider than `--ocelle-tooltip-max-inline`: longer text wraps, an unbreakable string included",
  "Its position is written to a stylesheet the tooltip adopts, never to a `style` attribute",
  // the tokens it reads (analysis U1(a); data-model § ocelle-tooltip)
  "`ocelle-tooltip` reads the tokens `--ocelle-color-chrome`, `--ocelle-color-chrome-ink`, `--ocelle-radius-2`, `--ocelle-border-width`, `--ocelle-font-sans`, `--ocelle-font-size-sm`, `--ocelle-line-height-normal`, `--ocelle-space-1`, `--ocelle-space-2`, `--ocelle-gutter`, `--ocelle-tooltip-delay` and `--ocelle-tooltip-max-inline`",
  "In forced colours the bubble has the `Canvas` ground, `CanvasText` text and a `CanvasText` border",
  // FR-037's statement and FR-036's advice (analysis U1(c))
  "The trigger carries its own accessible name: the tooltip never names it. The bubble only repeats or supplements what is available otherwise, so it never carries essential information; touch input shows no bubble, except on a text-field trigger, which shows it on any focus",
  "Without `describes`, the bubble is hidden from assistive technology and the trigger gets no description from the tooltip: use it when the text repeats the trigger's name",
  "Set `describes` when the text adds to the trigger's name",
  "With `describes`, the tooltip adds one hidden `span` with `slot=\"description\"` and `role=\"tooltip\"` to its own children, its text set as text, and that span's id to the trigger's `aria-describedby`, keeping the ids the host put there; it puts both back when a re-render of the host's template removes them, and moves the id when the trigger is replaced",
  // the stated limits
  "Triggers are buttons and links. A text field matches `:focus-visible` on any focus, so around one the bubble shows on focus however it arrives, by a click or a tap too",
  "`describes` is supported only when the trigger is itself the focusable element (a native control, or a custom element focusable as its host): a custom element whose inner control takes focus cannot be described from outside its shadow root",
  "On touch there is no hover, and a tap on a button or link does not give keyboard focus, so a tap shows no bubble",
  "In an engine without the Popover API (below the engine floor) the tooltip shows nothing and throws nothing",
  // #7's and #12's usage
  '<ocelle-tooltip text="Projects" placement="end"><a href="/projects" aria-label="Projects">',
  '<ocelle-tooltip text="${this.text}" ?disabled=${!this.truncated}><button class="pill">${this.text}</button></ocelle-tooltip>',
  "#12's icon-only nav item: the link carries its name, and the bubble repeats it on hover and keyboard focus",
  "#7's pill tag: the tooltip shows the full text only while the tag is ellipsised",
];

describe("packages/elements/README.md: ocelle-tooltip (008)", () => {
  const text = read("README.md");
  const readme = flat(text);

  it.each(tooltipFragments)("states: %s", (fragment) => {
    expect(readme).toContain(flat(fragment));
  });

  it("names ocelle-tooltip in its intro, before the first section", () => {
    expect(flat(text.split(/^## /m)[0] ?? "")).toContain("`ocelle-tooltip`, a tooltip");
  });

  it("has an `ocelle-tooltip` section", () => {
    expect(text).toMatch(/^## `ocelle-tooltip`$/m);
  });

  // FR-040: the floor's line names WebKit 17 and no longer WebKit 16.4.
  it("states no WebKit 16.4 floor in § Engines", () => {
    const engines = flat(/^## Engines\n([\s\S]*?)(?=^## )/m.exec(text)?.[1] ?? "");
    expect({ found: engines !== "", old: engines.includes("WebKit 16.4+") }).toEqual({ found: true, old: false });
  });
});

describe("packages/elements/CHANGELOG.md", () => {
  const changelog = read("CHANGELOG.md");
  const unreleased = /^## Unreleased\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(changelog)?.[1] ?? "";
  const added = flat(/^### Added\n([\s\S]*?)(?=^### |(?![\s\S]))/m.exec(unreleased)?.[1] ?? "");

  it.each([
    "`ocelle-icon`",
    "`@ocelle/elements`",
    "`@ocelle/elements/ocelle-icon.js`",
    "`@ocelle/elements/browser.js`",
    "`@ocelle/elements/custom-elements.json`",
    "`dist/browser/ocelle-elements.js`",
    "`@ocelle/tokens` as a peer dependency",
    "`ocelle-brand-mark`",
    "`@ocelle/elements/ocelle-brand-mark.js`",
    "`ground` and `tone` (reflected) and `label`",
    "the slot convention for icons in controls",
    // 008 (T019, T024): the dialog's surface
    "`ocelle-dialog`",
    "`@ocelle/elements/ocelle-dialog.js`",
    "`ocelle-dialog-close-request`",
    "`ocelle-dialog-close`",
    "`--ocelle-dialog-inline-size`",
    "`open` (reflected), `label` and `close-label`",
    // 008 (T032, T037): the drawer's surface
    "`ocelle-drawer`",
    "`@ocelle/elements/ocelle-drawer.js`",
    "`ocelle-drawer-close-request`",
    "`ocelle-drawer-close`",
    "`side`, `ground` and `heading-hidden` (reflected)",
    // 008 (T043, T049): the tooltip's surface and the floor
    "`ocelle-tooltip`",
    "`@ocelle/elements/ocelle-tooltip.js`",
    "`text`, `placement`, `disabled` and `describes`",
    "the engine floor raised to Chromium 120 and WebKit 17",
    ...["chevron-start", "chevron-end", "chevron-up", "chevron-down", "arrow-start", "arrow-end", "menu", "close", "folder", "file", "search", "table", "copy"].map((name) => `\`${name}\``),
  ])("names %s under Unreleased / Added (constitution VII, FR-031, SC-008)", (surface) => {
    expect(added).toContain(surface);
  });
});

/**
 * The planning IDs of the specs (005 OP2-02, landing L1-04): requirement, criterion, scenario, plan, research and task
 * references belong to `specs/`, so the package-facing documents carry none.
 */
const planningIds = /\b(?:FR-\d+|SC-\d+|US\d+-\d+|PLAN-[A-Z0-9-]+|R-\d{2}|T\d{3})\b/g;

describe("the package-facing documents carry no planning ID (OP2-02)", () => {
  it.each(["README.md", "CHANGELOG.md"])("%s holds no FR-, SC-, US<n>-<n>, PLAN-, R-<nn> or T<nnn> reference", (file) => {
    const text = read(file);
    expect(text).not.toBe("");
    expect(text.match(planningIds) ?? []).toEqual([]);
  });
});

describe("NOTICE: the repository's Apache-2.0 notice with the trademark note (FR-030, US4 scenario 10)", () => {
  const notice = flat(read("../../NOTICE"));

  it.each([
    "ocelle-components",
    "Licensed under the Apache License, Version 2.0; see LICENSE",
    "\"Ocelle\" and the rosette mark are trademarks of their owner. The Apache-2.0 licence grants no right to use them (section 6 of the licence); they may be used only to refer to Ocelle",
    "Third-party assets and their licences are listed in THIRD_PARTY_NOTICES",
  ])("states: %s", (statement) => {
    expect(notice).toContain(flat(statement));
  });
});

describe("THIRD_PARTY_NOTICES: the Lit entry (FR-029)", () => {
  const notices = read("../../THIRD_PARTY_NOTICES");
  const entry = flat(notices.slice(notices.indexOf("\nLit (")));

  it.each([
    "Lit (lit, lit-html, lit-element, @lit/reactive-element), bundled into the @ocelle/elements browser build",
    "Packages: lit 3.3.3, lit-html 3.3.3, lit-element 4.2.2, @lit/reactive-element 2.1.2",
    "Licence: BSD-3-Clause; the licence text ships beside the build as packages/elements/licenses/lit-BSD-3-Clause.txt",
    "Copyright: Copyright (c) 2017 Google LLC. All rights reserved.",
    "Repository: https://github.com/lit/lit",
    "Published: @ocelle/elements dist/browser/ocelle-elements.js (exports @ocelle/elements/browser.js), with licenses/lit-BSD-3-Clause.txt",
  ])("states: %s", (statement) => {
    expect(entry).toContain(flat(statement));
  });

  it("ships Lit's licence text unchanged as licenses/lit-BSD-3-Clause.txt", () => {
    expect(read("licenses/lit-BSD-3-Clause.txt")).toBe(read("node_modules/lit/LICENSE"));
    expect(read("licenses/lit-BSD-3-Clause.txt")).toContain("BSD 3-Clause License");
  });
});
