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
// README and in the repository's `NOTICE`), and the CHANGELOG's final surface list (FR-031). 013 phase 3 adds
// `ocelle-progress` (T043, T043a): its statements, its entry point, its mapping rows by role name and its CHANGELOG names.
/** A file's text, relative to the package; empty while it does not exist, so each assertion reports what is missing. */
function read(file: string): string {
  const url = new URL(`../../${file}`, import.meta.url);
  return existsSync(url) ? readFileSync(url, "utf8") : "";
}
const flat = (text: string): string => text.replace(/\s+/g, " ");

const fragments = [
  // module and registration (FR-002, R-02)
  // 013 phase 1 (T010, PLAN-CORRECTNESS-1-012 (a)): the container exception to "no other"
  "Each element lives in its own module, `src/<tag>.ts`, which ends with one `define(\"<tag>\", <Class>)` call: importing the module defines that element and no other, except that a container module also imports its item element, and importing the package root defines every element",
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
  "Engine floor: Chromium 120+ and WebKit 16.4+, with no `window.ShadyCSS` polyfill on the page",
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
  // ocelle-facts and ocelle-fact (013 FR-003 to FR-014, FR-056; research.md R-01 to R-03, R-07; tasks.md T010, T010a)
  "`ocelle-facts` shows label and value pairs as one description list: each pair is an `ocelle-fact` child, its label the `label` attribute and its value the fact's content, which the sheet never copies or rewrites",
  "With `layout` unset the sheet is two columns while its own inline size, as laid out in two columns, is at least `--ocelle-facts-stack-below`, and one column, each value below its label, below it",
  "`--ocelle-facts-stack-below` takes an absolute length; a percentage, 0 or an invalid value falls back to the default, `calc(var(--ocelle-space-10) * 6)` (24rem)",
  "`layout=\"columns\"` keeps two columns and `layout=\"stacked\"` one column at any size; any other value acts as unset",
  "In a shrink-to-fit host (a dialog, a popover, a float, a flex item) the two-column size is the content's own, so a sheet with short content stacks even where the host has room: set `layout` or give the sheet an inline size",
  "The sheet re-decides when it is resized, when the threshold changes, when its pairs or their content change (value text included) and when the window is resized",
  "It does not observe every change of the space it is offered: in a consumer's CSS grid `auto` track whose neighbour can be removed, the layout may stay as it was; set `layout` or give the sheet an inline size there (for `layout=\"grid\"`, an inline size)",
  "Only `ocelle-fact` children are pairs: other children, and facts with `hidden` or `aria-hidden=\"true\"`, are neither shown nor exposed; `lang` and `dir` on a fact apply to its label",
  "`wrap=\"anywhere\"` on a fact breaks a long identifier in its value anywhere; the label keeps word wrapping, and copying gives the value unchanged",
  "Digests are the consumer's text: the sheet does not group or rewrite them",
  "`density=\"compact\"` tightens the row gap and changes no type; in a `data-ocelle-density=\"compact\"` region of `@ocelle/styles` the values take the region's size and line height through `--ocelle-facts-value-size` and `--ocelle-facts-value-line-height`",
  "Before the elements are defined, `@ocelle/styles` shows each value on its own line and a hidden fact stays hidden; labels appear only after upgrade",
  "`ocelle-facts` reads the tokens `--ocelle-font-sans`, `--ocelle-font-size-sm`, `--ocelle-font-size-fact`, `--ocelle-font-weight-medium`, `--ocelle-font-weight-regular`, `--ocelle-color-ink`, `--ocelle-color-ink-muted`, `--ocelle-figures`, `--ocelle-line-height-normal`, `--ocelle-space-1`, `--ocelle-space-3`, `--ocelle-space-4` and `--ocelle-space-10`",
  "A container element renders its items' structure in its own shadow root and assigns each item there by manual slot assignment; its items are its direct children of one item element, and its module imports that item element",
  "An element written in the HTML before the script loads upgrades when it does; until then an element without light-DOM content has an empty box, and one with light-DOM content shows that content as plain inline text",
  "Manual slot assignment (`slotAssignment: \"manual\"`, `HTMLSlotElement.assign()`): Chromium 86, WebKit 16.4",
  "`layout=\"grid\"` shows each pair as a cell, its label above its value: four columns from twice `--ocelle-facts-stack-below`, two from it, one below it, as one description list",
  "In a shrink-to-fit host a grid sheet is four tracks wide, each as wide as its widest cell: give it an inline size there",
  "Set `wrap=\"anywhere\"` on machine values in a grid cell",
  "In every layout an unbroken value without `wrap=\"anywhere\"` can overflow its value box or cell, so machine values take `wrap=\"anywhere\"`",
  "Do not set `grid-template-columns` through `ocelle-facts::part(list)`: it overrides every layout",
  "In a consumer's CSS grid, set `min-inline-size: 0` on the `ocelle-facts` host, so a long value cannot widen the track",
  "Labels are at weight 500 (`--ocelle-font-weight-medium`); `ocelle-facts::part(label)` sets another weight",
  "The sheet never truncates a value: `break-word`, break-anywhere and an ellipsis all map to `wrap=\"anywhere\"`, with the full value shown",
  // ocelle-empty-state (013 FR-020 to FR-026, FR-056; research.md R-04; tasks.md T026, T026a)
  "`ocelle-empty-state` shows an empty or loading panel: the consumer's own heading, body and actions in one centred column. The heading level is the consumer's: slot your own heading element in `heading`; the element has no `level` property and never adds a heading, landmark, live region or tab stop of its own",
  "Slots: `visual` (an icon or an `ocelle-progress`, above the heading), `eyebrow` (a short line above the heading), `heading` (the consumer's heading element), the default slot (the body) and `actions` (buttons or links, which wrap when narrow); `part=\"body\"` is the centred column, with its padding and every slot in it",
  "`variant=\"panel\"` fills a list or inspector panel: block padding `--ocelle-space-10` instead of `--ocelle-space-6`, larger gaps between parts, and the heading at weight 500 (`--ocelle-font-weight-medium`) instead of 600 (`--ocelle-font-weight-strong`); any other value acts as unset",
  "The first present part starts at the block padding and the last ends at it. Between two present parts the gap is set by the upper one: after the visual `--ocelle-space-3` (panel `--ocelle-space-5`), after the heading `--ocelle-space-2` (panel `--ocelle-space-3`), after the body `--ocelle-space-4` (panel `--ocelle-space-6`)",
  "A part is present while something slotted in it renders: an empty slot, or one holding only elements with `hidden` or only whitespace, takes no space and adds no gap. Hide slotted content with `hidden` or remove it: content hidden by a class or a style rule is not observed",
  "An `ocelle-progress` in `visual` spans the column, up to `--ocelle-measure-reading`, in both variants; an icon stays centred",
  "The element styles slotted content through `::slotted()`, which beats the user-agent styles but not a page's own rules: a page rule on the slotted heading, eyebrow or body content wins, by design, since the consumer owns its content",
  "The loading panel is `variant=\"panel\"` with an indeterminate `ocelle-progress` in `visual`",
  "`ocelle-empty-state` reads the tokens `--ocelle-font-sans`, `--ocelle-font-size-xs`, `--ocelle-font-size-md`, `--ocelle-font-size-lg`, `--ocelle-font-weight-medium`, `--ocelle-font-weight-strong`, `--ocelle-color-ink`, `--ocelle-color-ink-muted`, `--ocelle-measure-reading`, `--ocelle-space-1`, `--ocelle-space-2`, `--ocelle-space-3`, `--ocelle-space-4`, `--ocelle-space-5`, `--ocelle-space-6` and `--ocelle-space-10`",
  "The `eyebrow` slot holds a short line above the heading (a `<p>`, for example \"Refused\"), not a heading: the element shows it in `--ocelle-font-sans` at `--ocelle-font-size-xs`, weight 500, `--ocelle-color-ink-muted`, in upper case, and adds no role to it",
  "The eyebrow sits `--ocelle-space-1` above a heading (panel `--ocelle-space-2`); with no heading it is `--ocelle-space-2` above the body or the actions (panel `--ocelle-space-3`)",
  "The element sets the block margins of the body's elements to 0 and separates the body's children by `--ocelle-space-2`, in both variants: each slotted element, and each run of slotted text, is a block of its own, so text meant to flow as one paragraph with a link or an identifier inside it goes in one `<p>`. A page rule that sets margins on the slotted body content wins over the reset",
  "The panel heading is at weight 500, lighter than the default's 600, following the text of spec-kitty-design#510; a heading that was bold in a consumer's card becomes 500",
  "Neither variant paints a ground, a border or a busy look: the element sits on its container's ground. A card around it (fill, radius, padding, a dashed or busy-keyed border) is the consumer's own; the dashed refusal card belongs to the panel-paint family of spec-kitty-design#509, not to this element",
  "A screen that moves focus to a loading block slots its own `<h2 tabindex=\"-1\">` in `heading`, with the bar in `visual`, and focuses the heading; do not put a `role` or `tabindex` on the `ocelle-progress` host",
  // ocelle-progress (013 FR-030 to FR-039; research.md R-05, R-06; tasks.md T043, T043a)
  "`ocelle-progress` is a progress bar: with a `value` it is determinate, its fill growing from the inline start (the right under `dir=\"rtl\"`); without one it is indeterminate",
  "Name every bar: set `label`, the accessible name, as text. A host `aria-label` also names it and overrides `label`, but makes axe report a false `aria-prohibited-attr` in your own audit; prefer `label`",
  "A bar with neither `label` nor a host `aria-label` has no name: that is a consumer error, which the element does not correct",
  "axe does not check the bar's name, since it does not read the element's internals: check the name in your own tests",
  "`max` defaults to 100; a `max` that is not a number above 0 counts as 100. A `value` below 0 is shown and exposed as 0, and above `max` as `max`",
  "An unset, empty or whitespace-only `value`, a `value` that is not a finite number, and the property set to `null` or `undefined` make the bar indeterminate: no current value is exposed",
  "`value-text` gives the words for the current value (for example \"7 of 12\"): it is exposed while the bar is determinate, kept as given when the value is clamped, and not used while the bar is indeterminate. Without it the platform announces the value itself; the element formats no number",
  "The library's tests do not verify the value text's exposure to assistive technology: no read a test can make in Chromium reports it. They check the visible value text, and the bar's name and value in the accessibility tree",
  "`show-label` shows the label as text above the bar, or beside it with `size=\"compact\"`, with the value text when the bar is determinate; both use tabular figures and are hidden from assistive technology, which reads the name and value from the bar itself",
  "The indeterminate bar's mark sweeps across the track three times, 4.2 s in all at the default tokens, and then rests as the still mark, a partial fill in the middle of the track, with nothing running: the motion ends by itself in less than 5 s (WCAG 2.2.2)",
  "The sweep lasts `--ocelle-motion-base` × 21 in all: overriding `--ocelle-motion-base` above 238 ms takes it past 5 s",
  "There is one sweep per loading episode: a bar inserted, replaced in one task, re-shown or made indeterminate again while the episode lasts continues the episode's sweep, and after the sweep has ended shows the still mark at once. The episode ends when no indeterminate bar is on the page at a frame; the next indeterminate bar starts a new episode with its own sweep",
  "Keep one bar, or swap it in one task, across one continuous wait: a bar removed and inserted again a frame or more later starts a new sweep",
  "Under `prefers-reduced-motion: reduce` nothing runs on the bar and the still mark shows at once",
  "The fill has no transition: its inline size changes at once with each value",
  "The fill is `--ocelle-color-accent` with an `--ocelle-color-accent-strong` edge on every side, so the filled part is never marked by ochre alone; the track is `--ocelle-color-inset` and clips the mark",
  "`ground=\"tinted\"` draws the track's boundary in `--ocelle-color-accent-strong`: use it for a bar on `color-inset`, `color-accent-low`, `color-hover-bg` or a state ground, and in a row that can be hovered or selected. Unset, the boundary is `--ocelle-color-control-border`, for `color-canvas`, `color-sheet`, `color-pane`, `color-panel`, `color-inspector` and `color-rail`",
  "The determinate bar is for work with a known amount, and the indeterminate bar for loading a region, or running work, with no known end; for a state, such as a row that is running, use `ocelle-status-indicator`",
  "`ocelle-progress` reads the tokens `--ocelle-color-accent`, `--ocelle-color-accent-strong`, `--ocelle-color-inset`, `--ocelle-color-control-border`, `--ocelle-color-ink`, `--ocelle-color-ink-muted`, `--ocelle-font-size-sm`, `--ocelle-figures`, `--ocelle-space-1`, `--ocelle-space-2`, `--ocelle-radius-1`, `--ocelle-border-width`, `--ocelle-measure-cell`, `--ocelle-motion-base` and `--ocelle-easing-standard`",
  "To name a bar after a nearby heading, pass the heading's text as `label`; the element takes no ID reference",
  "The host is the progressbar: a `role` on it replaces the progressbar and a `tabindex` makes it a tab stop, so set neither. For a loading block that takes focus, put your own `<h2 tabindex=\"-1\">` in an `ocelle-empty-state`'s `heading` slot, with the bar in `visual`",
  "The host is a block and fills its container's inline size. To place a bar inside a line of text, set its `display` (for example `inline-block`) and an inline size from outside",
  "The value text sits at the inline end of the label row: at the default size the row is above the bar, the label at its inline start; in compact the row holds the label, the bar and the value text, in that order",
  "The label is text only: there is no slot for a rich label",
  "The element has no slot: text inside it (a \"7/12\" fallback) shows only before the element is defined, and after that it is neither shown nor exposed; the bar keeps its own name and value",
  "`ocelle-progress` emits no event and adds no tab stop",
  // two copies on a page (FR-006, Edge Cases)
  "Two copies of the package on one page, two versions or the browser build beside a bundle of the module build, cannot both define an element: the first definition wins and the second import throws nothing",
];

/** The entry points (FR-002): specifier, file and what it defines, exactly, in the README's table. */
const entryRows = [
  "| `@ocelle/elements` | `dist/index.js` | every element; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-icon.js` | `dist/ocelle-icon.js` | `ocelle-icon` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-brand-mark.js` | `dist/ocelle-brand-mark.js` | `ocelle-brand-mark` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-facts.js` | `dist/ocelle-facts.js` | `ocelle-facts` and its item `ocelle-fact`; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-fact.js` | `dist/ocelle-fact.js` | `ocelle-fact` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-empty-state.js` | `dist/ocelle-empty-state.js` | `ocelle-empty-state` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-progress.js` | `dist/ocelle-progress.js` | `ocelle-progress` only; for hosts with a bundler |",
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

/**
 * The facts rows of the README's kitty-mission-ui mapping (013 FR-058, SC-001; research.md R-11, the facts family's
 * inventory; operator decision I1): each role name with the element and variant that covers it, exactly. The class
 * family column is not read, so no class-family name appears in this test.
 */
const factsMapping: readonly (readonly [string, string])[] = [
  ["facts stacked", "`ocelle-facts` with `layout` unset (it stacks below the threshold) or `layout=\"stacked\"`; in a consumer's CSS grid, `min-inline-size: 0` on the host"],
  ["facts two-col", "`ocelle-facts` with `layout=\"columns\"`, or unset at or above the threshold; drop the track override and do not restyle the columns through `::part(list)`"],
  ["facts compact", "`ocelle-facts density=\"compact\"`"],
  ["facts term", "`ocelle-fact`'s `label`, rendered as the sheet's term (`part=\"label\"`)"],
  ["facts term regular", "consumer's: `ocelle-facts::part(label)` with `font-weight: var(--ocelle-font-weight-regular)`"],
  ["facts value mono", "not supported: no monospace; values are sans with tabular figures, the small size through `--ocelle-facts-value-size` or a compact region"],
  ["facts value wrap", "`ocelle-fact wrap=\"anywhere\"`"],
  ["facts value ellipsis", "`ocelle-fact wrap=\"anywhere\"`, with the full value shown (no truncation)"],
  ["facts value identifier", "`ocelle-fact wrap=\"anywhere\"`, or a value element with `data-ocelle-wrap=\"anywhere\"`"],
  ["facts value tooltip", "consumer's: a `title` on its own value content, optional with the full value shown"],
  ["facts value pill", "consumer's: pills are inline content in the fact's value"],
  ["facts value action", "consumer's: a button in the value keeps its own tab stop"],
  ["facts row optional", "consumer's: leave the `ocelle-fact` out or set `hidden` on it"],
  ["facts group heading", "consumer's: the heading stays outside the sheet"],
  ["facts group omitted", "consumer's: leave the sheet out or render an `ocelle-empty-state`; a sheet with no pairs renders nothing"],
  ["facts workspace marker", "consumer's: a `data-*` attribute on the `ocelle-facts` host"],
];

/**
 * The empty-state rows of the README's kitty-mission-ui mapping (013 FR-058, SC-001; research.md R-11, the empty-state
 * family's inventory; operator decisions I1, IQ-06 to IQ-11): each role name with the element and variant or the
 * consumer's remedy that covers it, exactly. The class family column is not read, so no class-family name appears in
 * this test.
 */
const emptyStateMapping: readonly (readonly [string, string])[] = [
  ["empty-state panel", "`ocelle-empty-state variant=\"panel\"`, the heading at 500 and the larger rhythm, with no chrome of its own; the state wrapper and its `aria-busy` stay the consumer's"],
  ["empty-state regional", "`ocelle-empty-state`, default variant, with only the default slot"],
  ["empty-state refusal", "`ocelle-empty-state` with the eyebrow in the `eyebrow` slot, an `<h1>` in `heading`, the sentence and the path (with `data-ocelle-wrap=\"anywhere\"`) in the body, and an action; the dashed card is not this element's"],
  ["empty-state heading h1", "the consumer's `<h1>` in the `heading` slot"],
  ["empty-state heading h2", "the consumer's `<h2>` in the `heading` slot"],
  ["empty-state heading paragraph", "the consumer's `<p>` in the `heading` slot; a bar named by it takes its text as `label`"],
  ["empty-state no heading", "the `heading` slot left empty: a loading panel with `ocelle-progress` in `visual`, or a body-only notice"],
  ["empty-state body multiple", "both paragraphs in the default slot: their margins are reset and they are `--ocelle-space-2` apart"],
  ["empty-state body optional", "the default slot filled or left empty"],
  ["empty-state action", "the `actions` slot; the element gives the gap above it, so drop the consumer's own top margin"],
  ["empty-state action wrapper", "the `actions` slot"],
  ["empty-state inline", "not this mission: no left-aligned inline variant"],
  ["empty-state busy", "an indeterminate `ocelle-progress size=\"compact\"` in `visual`; `aria-busy` stays on the consumer's wrapper, and a busy look is the consumer's card"],
  ["empty-state message", "consumer's: its own dashed card around an `ocelle-empty-state` (default variant)"],
  ["empty-state card", "consumer's: its own card (fill, radius, inline padding, busy-keyed border) around `ocelle-empty-state variant=\"panel\"`, whose heading is at 500"],
  ["empty-state card dashed", "not this mission: panel and card paint, spec-kitty-design#509"],
  ["empty-state ops card", "consumer's: as the card, its own card around the element, the heading at the element's weight"],
  ["empty-state identifier", "consumer's: the value in the body with `data-ocelle-wrap=\"anywhere\"` and its own `title`; no monospace"],
  ["empty-state focus target", "consumer's: `tabindex=\"-1\"` on its slotted heading; for a loading block, its `<h2 tabindex=\"-1\">` in `heading` with the bar in `visual`"],
];

/**
 * The progress rows of the README's kitty-mission-ui mapping (013 FR-058, SC-001; research.md R-11, the progress
 * family's inventory; operator decisions I1, IQ-10 to IQ-15): each role name with the element and variant or the
 * consumer's remedy that covers it, exactly. The class family column is not read, so no class-family name appears in
 * this test.
 */
const progressMapping: readonly (readonly [string, string])[] = [
  ["progress default", "`ocelle-progress` with `value`, `max`, `label` and `show-label`"],
  ["progress narrow", "`ocelle-progress`; the track fills the host's inline size"],
  ["progress compact", "`ocelle-progress size=\"compact\"`"],
  ["progress indeterminate", "`ocelle-progress` with no `value`"],
  ["progress determinate", "`ocelle-progress` with `value` and `max`"],
  ["progress meta", "`value-text` with `show-label`, the consumer passing the formatted percentage (the element formats no number), at the inline end of the label row"],
  ["progress external text", "`value-text` with `show-label`, or the consumer's own text beside the element"],
  ["progress label", "`ocelle-progress` with `label` and `show-label`; the label is text only, with no slot"],
  ["progress labelled by heading", "consumer's: the heading's text passed as `label`, with no ID reference"],
  ["progress aria-label", "`label` without `show-label`, or a host `aria-label`"],
  ["progress fallback text", "consumer's: the element draws the bar itself; text inside it shows only before upgrade and is neither shown nor exposed after it"],
  ["progress heading", "consumer's: its own `<h2 tabindex=\"-1\">` in an `ocelle-empty-state`'s `heading` slot with the bar in `visual`; no `role` or `tabindex` on the host"],
  ["progress inline", "`ocelle-progress`, a block host given `display: inline-block` and an inline size by the consumer"],
  ["progress in empty-state", "`ocelle-empty-state`'s `visual` slot"],
  ["progress in busy region", "`ocelle-progress` placed directly; `aria-busy` stays on the consumer's region"],
  ["progress slotted", "`ocelle-progress` in another element's slot; nothing is needed from the element"],
  ["progress grid layout", "`ocelle-progress` with `show-label` at the default size: the label at the inline start and the value text at the inline end of the row above the bar, which spans the full width below; the consumer no longer places the parts"],
  ["progress centred", "`ocelle-empty-state`'s `visual` slot, which centres the bar and spans it up to the reading measure"],
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
    expect(Object.keys(manifest.exports ?? {})).toEqual([".", "./ocelle-icon.js", "./ocelle-brand-mark.js", "./ocelle-facts.js", "./ocelle-fact.js", "./ocelle-empty-state.js", "./ocelle-progress.js", "./browser.js", "./custom-elements.json"]);
  });

  it("lists the thirteen names of the set, whether each mirrors and the consumer need it meets, in its Icons table (US2-1, FR-018, SC-007)", () => {
    expect(tableRows(read("README.md"), "Icons")).toEqual(iconRows);
  });

  it.each(factsMapping)("maps the role %s to its element and variant in the kitty-mission-ui mapping (013 FR-058)", (role, covered) => {
    const row = tableRows(read("README.md"), "Mapping from kitty-mission-ui").map((line) => line.slice(2, -2).split(" | ")).find((cells) => cells[1] === role);
    expect(row?.[2]).toBe(covered);
  });

  it.each(emptyStateMapping)("maps the role %s to its element and variant or the consumer's remedy in the kitty-mission-ui mapping (013 FR-058)", (role, covered) => {
    const row = tableRows(read("README.md"), "Mapping from kitty-mission-ui").map((line) => line.slice(2, -2).split(" | ")).find((cells) => cells[1] === role);
    expect(row?.[2]).toBe(covered);
  });

  it.each(progressMapping)("maps the role %s to its element and variant or the consumer's remedy in the kitty-mission-ui mapping (013 FR-058)", (role, covered) => {
    const row = tableRows(read("README.md"), "Mapping from kitty-mission-ui").map((line) => line.slice(2, -2).split(" | ")).find((cells) => cells[1] === role);
    expect(row?.[2]).toBe(covered);
  });

  it("names the @ocelle/tokens peer dependency of package.json", () => {
    const manifest = JSON.parse(read("package.json")) as { peerDependencies?: Record<string, string> };
    const pin = manifest.peerDependencies?.["@ocelle/tokens"];
    expect(pin).toBe("workspace:0.0.0");
    expect(readme).toContain(`"@ocelle/tokens": "${String(pin)}"`);
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
    "`ocelle-facts`",
    "`ocelle-fact`",
    "`@ocelle/elements/ocelle-facts.js`",
    "`@ocelle/elements/ocelle-fact.js`",
    "`layout=\"grid\"`",
    "`ocelle-empty-state`",
    "`@ocelle/elements/ocelle-empty-state.js`",
    "`variant=\"panel\"`",
    "the `eyebrow` slot",
    "`ocelle-progress`",
    "`@ocelle/elements/ocelle-progress.js`",
    "`show-label`",
    "`size=\"compact\"`",
    "`ground=\"tinted\"`",
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
