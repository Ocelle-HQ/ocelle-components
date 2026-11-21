import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { compositions } from "../scenarios/link.ts";

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
// README and in the repository's `NOTICE`), and the CHANGELOG's final surface list (FR-031). Since 009 phase 2 (T019,
// T029): `ocelle-scroller` (its attribute, slot, tokens, tree, keyboard, handover, fades, clearance, scrollbar, naming
// guidance, shrink-to-fit hosts and reduced motion), the overflow-region module's interface under the element
// conventions, the Host ARIA rule scoped per element, the styles rule with the per-instance sheet, the mask properties
// in the engine floor, its entry point, and its CHANGELOG entries. Since 009 phase 3 (T036, T043):
// `ocelle-workflow-board` (its layout, attribute, slot, tokens, tree, lane content, ground, wide content, nested images,
// shrink-to-fit hosts and the width-only change) and `ocelle-workflow-lane` (its attributes, the name rule with no
// built-in word, the hidden visible text, no live region, the `color-sheet` ground, the flat variant, its tokens and
// the title wrapping), their entry points and their CHANGELOG entries. Since 009 phase 4 (T052, T060):
// `ocelle-list-detail` (its attributes, slots, `remeasure()`, tokens, widths and borders, the focus rule, the upgrade
// rule and the host's own landmarks), the container-tier convention under the element conventions (one assertion per
// item of FR-034: the own measured size, the grammar and its resolution, the token default and its fallback, exclusive
// bounds, the forcing boolean, no `container-type`, tier-independent intrinsic sizes, the re-measure triggers, the
// unseen changes and `remeasure()`, the cost of one pass, the loop message and setting the attributes from a task),
// its entry point and its CHANGELOG entries. Since the landing pass (O5-01, T079): becoming rendered as a re-measure
// trigger, and a pass or `remeasure()` on an element that is not rendered writing nothing, in both places. Since 009 phase 5 (T062): the four frames as the tested screen sizes, WebKit
// not measured for the layout elements' focus behaviour, the print note and the states that do not apply.
// 013 phase 3 adds `ocelle-progress` (T043, T043a): its statements, its entry point, its mapping rows by role name and its
// CHANGELOG names.
/** A file's text, relative to the package; empty while it does not exist, so each assertion reports what is missing. */
function read(file: string): string {
  const url = new URL(`../../${file}`, import.meta.url);
  return existsSync(url) ? readFileSync(url, "utf8") : "";
}
const flat = (text: string): string => text.replace(/\s+/g, " ");

/** A control convention: its bold title, then its first rule. */
function convention(title: string, rule: string): string {
  return `**${title}.** ${rule}`;
}

const fragments = [
  // module and registration (FR-002, R-02)
  // amended by 014 (research.md R-16): a parent's module also defines the children it owns; this covers 013's
  // container exception (a container module imports its item element) and 008's rendered icon (merge of main)
  "Each element lives in its own module, `src/<tag>.ts`, which ends with one `define(\"<tag>\", <Class>)` call: importing the module defines that element and the elements it renders or owns as children, and importing the package root defines every element",
  "`define` (`src/define.ts`, internal) defines a tag only while it is free: a second definition of the same tag does nothing and throws nothing.",
  // static properties and the JSDoc tags (R-01, R-02, R-06)
  "Elements declare their reactive properties with `static override properties = { … }` and `declare` fields, not decorators",
  // restated for the notice's defaults (specs/010-feedback-forms FR-001; analysis I10, I15)
  "Every element class carries the JSDoc tag `@tagname <tag>`, every public property a description, and every public property that can be set a `@default` tag with the value the property reads before anything sets it, `@default undefined` for an optional one: the manifest takes the tag name and the defaults from them",
  "An element that observes a standard attribute such as `aria-label` adds it to `observedAttributes` without declaring a property, so the manifest does not list it",
  // the element's own attribute without a property (specs/010-feedback-forms FR-021, FR-034; analysis U6; T034a)
  "An attribute that is the element's own and has no property of its own, such as `ocelle-form-input`'s `value` (its default value), is declared in the manifest with the class's JSDoc tag `@attribute`, with its type, default and description",
  // styles (FR-003, R-03, R-04, R-09)
  // since 009 (T019, FR-030): the shared sheets and at most one per-instance sheet of measured figures, replacing "one
  // shared stylesheet"
  "An element's styles are its shared `static styles`, one or more `css` tagged templates built only from `--ocelle-*` tokens and the values the `style-lint` gate allows, which every instance adopts, plus at most one per-instance constructed stylesheet that holds only px figures the element measured from layout",
  "The per-instance sheet never holds a value from an attribute, a property, a token's text or slotted text, and it is written through `CSSStyleRule.style`, never through an element's `style`: the overflow-region module's mask size and `ocelle-list-detail`'s intrinsic sizes are its two uses",
  "No template has a `style` attribute or a `<style>` element",
  "Every element's styles hold `:host([hidden]) { display: none; }` beside its `:host` display rule, which would otherwise beat the user-agent `[hidden]` rule.",
  // amended by 011 (FR-001, FR-036; research.md R-01): colour and ground variants inside the query, layout-only ones outside
  "Variant rules that set colours or grounds go inside `@media not (forced-colors: active)`, so a forced-colours rule never has to outrank a variant selector",
  "Variant rules that set layout only (size, padding, gap, direction, wrapping) stay outside it, so a compact or horizontal variant keeps its layout in forced colours",
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
  // 012 phase 3 (tasks.md T033; research.md R-04): the floor rises to Chromium 135 and WebKit 17.4 (014 phase 4 had
  // raised it to Chromium 125 and WebKit 17.4 for custom states, the line below; the second merge of main)
  "Engine floor: Chromium 135+ and WebKit 17.4+, with no `window.ShadyCSS` polyfill on the page",
  "ARIA element reflection (`ariaControlsElements`, `ariaLabelledByElements`, `ariaDescribedByElements`): Chromium 135, WebKit 16.4 (the controls' ID references)",
  "Custom states (`ElementInternals.states` and `:state()`): Chromium 125, WebKit 17.4 (`ocelle-button`'s moved states)",
  // 008 (tasks.md T044; FR-040, research.md R-10): the Popover API, WebKit 17, below the floor 012 raised
  "The Popover API: Chromium 114, WebKit 17",
  "`:dir()`: Chromium 120, WebKit 16.4",
  "`@media not (forced-colors: active)` (Media Queries 4's `not (…)` without a media type): Chromium 104, WebKit 16.4",
  "The `lh` unit: Chromium 109",
  "The `scale` property: Chromium 104",
  "Constructable stylesheets (`adoptedStyleSheets`): Chromium 73, WebKit 16.4",
  "An element that uses a feature newer than the floor raises the floor in this section, the one list of the floor features, and records the feature in its own feature's research",
  "Only Chromium is measured. WebKit (Kitty Desktop on macOS and Linux) is not: its accessibility tree, forced colours and mirroring are an open limitation",
  // since 009 (T019, R-18)
  "`mask-image`, and `mask-size`, `mask-position`, `mask-origin`, `mask-clip`, `mask-repeat` and `mask-composite`, unprefixed: Chromium 120, WebKit 15.4",
  // forwarded slots, for shell authors (011 FR-036, the spec's Empty slot; research.md R-03 § Forwarded slots; phase 1 review R2-01, landing L1-04)
  "A shell that forwards a slot of its own into an element of this package, such as `<slot name=\"footer\" slot=\"footer\"></slot>` in its shadow root, assigns that `<slot>` element to the element's slot. The element counts it as content even when nothing is assigned to the forwarded slot, so the part takes its wrapper, gap, padding or divider with nothing in it. Forward a slot only when it has content, or remove the forwarding `<slot>` when it has none.",
  // host ARIA (FR-034, PLAN-A11Y-SECURITY-1-002 (a), 1-003 (a)), scoped per element: since 009 (T019,
  // PLAN-CORRECTNESS-1-005 (a)) the first sentence split, for 005's two elements, from the package-wide one, which both
  // missions replaced (the landing's second merge keeps 009's wording, which states 010's icon and brand-mark rule too),
  // and the notice's and form controls' rules beside 005's (specs/010-feedback-forms FR-001, FR-009, FR-022; analysis
  // I10, I14, U10, U11, A5; T034a)
  "A host `aria-label` names the element as `label` does. For `ocelle-icon` and `ocelle-brand-mark`, when present it decides alone: a blank host `aria-label` leaves the element unlabelled even with a `label`",
  "On a form control a host `aria-label` that is not blank names the control alone; a blank one, empty or whitespace only, is skipped, and the labels and `label` name the control",
  "For `ocelle-scroller`, `ocelle-workflow-board` and `ocelle-workflow-lane` a blank host `aria-label` counts as absent, so `label` still names the element: Chromium names a host from a present `aria-label` and does not fall back from a blank one, so these elements put their role and name on a node in their shadow root, named by the host's non-blank `aria-label`, trimmed, or else by `label`",
  "`ocelle-list-detail` takes no name: a host `aria-label` is not used",
  "On `ocelle-icon` and `ocelle-brand-mark`, when both are set, the host `aria-label` is the name; removing it falls back to `label`",
  "On `ocelle-icon` and `ocelle-brand-mark`, Chromium uses a host `aria-label` as written, surrounding spaces included, so pass it trimmed; the element never rewrites it",
  "On a form control the control's name is a host `aria-label` with whitespace collapsed and trimmed, while the host's node keeps it as written, surrounding spaces included, so pass it trimmed with single spaces",
  "On `ocelle-icon` and `ocelle-brand-mark`, a host `aria-hidden=\"true\"` hides the element, labelled or not",
  "On `ocelle-icon` and `ocelle-brand-mark`, a host `hidden` attribute removes the element: no box and no node, labelled or not",
  "On `ocelle-notice` a host `aria-hidden=\"true\"` is not supported: hide the notice with a host `hidden` attribute, which gives it no box and announces nothing while it is set",
  "On a form control a host `aria-hidden=\"true\"` is not supported, since the control stays focusable: hide the control with a host `hidden` attribute instead",
  "On `ocelle-icon` and `ocelle-brand-mark`, a host `role` or `aria-hidden=\"false\"` is not supported: name the element with `label` or `aria-label` instead",
  "On a form control a host `role` or `aria-hidden=\"false\"` is not supported: name the control with `label`, a `<label>` or `aria-label` instead",
  "`ocelle-notice` takes a host `role` as its section says: `alert` and `status` make it announce, a role that gives its node no live politeness leaves it as without a role, and `log`, other live roles and a host `aria-live`, `aria-atomic`, `aria-relevant` or `aria-hidden=\"false\"` are not supported",
  // the base rules for the remaining elements, as 009 kept them package-wide (the landing's second merge)
  "On the other elements, a host `aria-hidden=\"true\"` hides the element, a host `hidden` attribute removes it, and a host `role` or `aria-hidden=\"false\"` is not supported",
  // the icon set (FR-017, FR-018, FR-029, US2 scenarios 1 and 5)
  "`name` (attribute and property, reflected): the icon's name, exactly as listed in Icons",
  "Every drawing is the project's own, on a 24-unit grid with one stroke width, round caps and joins, painted only in `currentColor`",
  "`chevron-start`, `chevron-end`, `arrow-start` and `arrow-end` follow the inline direction: under right-to-left text (`dir=\"rtl\"` on the icon or an ancestor) they are mirrored, so start points right and end points left; the other icons are never mirrored",
  "The names are public surface: renaming or removing one is a major change, adding one a minor change",
  "Every icon is the project's own drawing, under Apache-2.0; no third-party icon set is used, so `THIRD_PARTY_NOTICES` lists none",
  // the slot convention (FR-020 to FR-022, SC-007; research.md R-03, R-10, R-15; US3 scenario 7)
  "A control that shows icons follows one slot convention: an `icon` slot before its label and, where it has an end icon such as the action row's arrow, a `trailing` slot after it",
  // 012 plan decision 33 (phase 2 review round 5, O3-01; tasks.md T029b): the label wrapper is part of the markup, and
  // it takes part in baseline alignment
  "The control renders, in its shadow root, a row with the class `icon-row` holding `<span class=\"icon-slot\"><slot name=\"icon\"></slot></span>`, its label wrapper `<span class=\"label\"><slot></slot></span>` around the default slot, and `<span class=\"icon-slot trailing\"><slot name=\"trailing\"></slot></span>`, and adds `iconSlotStyles` (`src/icon-slot.ts`, internal) to its `static styles`",
  "The label wrapper takes part in baseline alignment, so the control's baseline is its label's first line and a one-line control in a line of text sits on the text's baseline",
  // 012 plan decision 33 as amended by phase 2 review round 6 (O6-01; tasks.md T029g): the `bare` modifier is part of
  // the convention, the label's baseline alignment applies to labelled rows only, and an icon-only control's icon sits
  // where a native button puts it
  "A control with no label, such as an icon-only control, puts the class `bare` on its row: the `bare` modifier is part of the convention",
  "The label's baseline alignment applies to labelled rows only: a `bare` row is not changed, so an icon-only control's icon sits where a native `<button>` with an svg puts it in a line of text",
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
  // ocelle-notice (specs/010-feedback-forms FR-004 to FR-011, FR-035; research.md R-02, R-03; T016b)
  "`ocelle-notice` shows a message about a state or result in a box whose look follows its tone, with an optional heading, in the regular or the compact size",
  "`tone` (attribute and property, reflected): `info` (the default), `success`, `warning`, `danger` or `neutral`; any other value behaves as `info` and the property reads `\"info\"`, while the attribute keeps the value as written",
  // the tone is in the host's text (FR-034, the spec's assumption; phase 2 operator round 4, O4-02; T025c)
  "The bar and the ground differ from one tone to another only by colour, and not at all in forced colours, so the host's text must state the tone, as \"Run failed\" or \"Saved.\" does: the look of the box alone does not tell a warning from a success",
  "`size` (attribute and property, reflected): `regular` (the default) or `compact`; any other value behaves as `regular` and the property reads `\"regular\"`, while the attribute keeps the value as written",
  "`announce` (boolean attribute and property, reflected): the notice announces its text once, politely for `info`, `success` and `neutral` and assertively for `warning` and `danger`",
  "Slots: `heading` (optional; only elements are assigned to it) and the default slot, the body. CSS parts: `heading` and `body`. The notice has no event and no CSS custom property of its own",
  "`ocelle-notice` reads the tokens `--ocelle-color-<tone>`, `--ocelle-color-<tone>-bg`, `--ocelle-color-ink`, `--ocelle-radius-row`, `--ocelle-bar-width`, `--ocelle-border-width`, `--ocelle-space-1` to `--ocelle-space-4`, `--ocelle-font-size-subhead`, `--ocelle-font-size-sm`, `--ocelle-font-weight-strong`, `--ocelle-line-height-tight` and `--ocelle-line-height-compact`",
  "The heading is absent when no element is assigned to the `heading` slot or the text content of its elements is empty or whitespace only: it then draws no box and leaves no gap",
  "The rule reads text content only, so a heading whose only content is an `ocelle-icon` or an `img` is absent, and a heading whose only text is inside an `aria-hidden=\"true\"` element is drawn but adds nothing to the announced text",
  "The announced text is the heading text, then the body text, joined by one space: the text nodes, the `label` of an `ocelle-icon` and the `alt` of an `img`, skipping elements with `hidden` or `aria-hidden=\"true\"` and `script`, `style` and `template` elements",
  "For other slotted content (an element with `role=\"img\"` and an `aria-label`, an `svg`, CSS-generated content, content hidden by a host rule without `hidden`) the announced text is not specified",
  "\"Announced\" in this library's tests means a change of a live region's text in Chromium's accessibility tree, read from the states that Chromium can hand to assistive technology; no screen reader runs in the tests",
  "The notice announces through a separate live region in its shadow root, visually hidden and atomic, that never holds the visible content: a copy of the text is written into it `W` after the last trigger",
  "`W` is twice Chromium's accessibility serialisation delay, 150 ms once `document.readyState` is `\"complete\"` and 350 ms before (`AXObjectCacheImpl::GetDeferredEventsDelay()` in `ax_object_cache_impl.cc`), so 300 ms after load and 700 ms before",
  // the wait from the empty state's start (phase 2 stop 2, decision (a); research R-02 step 2; T025a)
  "The wait also ends no earlier than `W` of the load state in which the region last became empty, counted from then, so a change right after a first load is written no earlier than the pre-load `W` after the notice was first rendered",
  "Changes closer together than `W`, in one task or in different tasks, merge: only the final text is announced, once, and a text that is back to the last announced text when the wait ends announces nothing",
  "A text that keeps changing more often than every `W` is not announced until it stops changing",
  "A copy is held for `H`, 5000 ms, or until the next announcement but at least `W`, and then removed",
  "`H` is a chosen figure, not measured: the tests cannot see when a screen reader fetches the text",
  "For up to `H` a browse-mode user may meet the text twice, in the notice and in the copy",
  "For a host `role=\"alert\"`, the insertion, the reveal and a change of the role to `alert` write no copy: Chromium's alert event for the host's node reads the notice (`ui/accessibility/ax_event_generator.cc`, lines 394, 416-417 and 1081-1082)",
  "The alert event is Chromium's behaviour and is not measured; WebKit is not measured, and its live regions in shadow roots are an open limitation",
  "Text or a `tone` set in the same task as that insertion, reveal or role change is part of the alert reading and is not announced again",
  "A change made in a later task but before Chromium's next serialisation is read twice, by the alert event and by the copy, so set the text before, or in the same task as, the insertion, reveal or role change",
  "A notice inserted or revealed as `role=\"alert\"` and changed to `role=\"status\"` in the same task announces its text politely once, as a `status` notice would, since no alert event fires",
  "Only the host's own `hidden` attribute hides and reveals the notice: removing it announces the current text once, as an insertion does, and changes while hidden are not announced",
  "A notice shown by a hidden ancestor (a container with `hidden`, a closed `<details>`, a `display: none` panel) is not announced by its live region; a `role=\"alert\"` notice shown that way is read by Chromium's alert event all the same",
  "A host `role=\"alert\"` announces assertively and `role=\"status\"` politely whatever the tone, with or without `announce`; with a role that gives the host's node no live politeness, such as `note`, `region` or `none`, the notice behaves as with no role",
  "A notice that is part of the page as first loaded is not announced: one connected while `document.readyState` is `\"loading\"`, or upgraded by the registration of the definition",
  "A notice inserted after the build has loaded is announced, however it is inserted (`innerHTML`, a `<template>`, a `DOMParser` document, an htmx swap or `document.createElement`)",
  "Load the build before any swap or script inserts announcing notices: a notice upgraded by the registration does not announce",
  "Setting `announce`, or a host `role` of `alert` or `status`, on an existing notice announces nothing: its current text is the baseline for the next change",
  "Moving a notice within the page in one task, or a re-render, announces nothing",
  // the form-control convention (specs/010-feedback-forms FR-020 to FR-028, FR-035, SC-006; research.md R-05, R-06, R-10; T034a)
  "`ocelle-form-input` and later form-like elements are form-associated custom elements: the native control, its visible label, its description and its error live in one open shadow root, so every ID reference among them stays inside it",
  "The host takes part in its form through `ElementInternals`: it submits its value under `name` (nothing without `name` or while disabled), joins the form a `form` attribute names, follows a disabled `<fieldset>`, restores its default value on a form reset and its state on history restore, and is associated with an external `<label for>`",
  "Shared attributes and properties: `name`, `label`, `description`, `error`, `required` and `disabled` (all reflected), and the `value` property",
  "The host exposes `form`, `labels`, `validity`, `validationMessage`, `willValidate`, `checkValidity()` and `reportValidity()` as a native control does; `focus()` on the host focuses the inner control, and the host is not a tab stop of its own",
  "The inner control's accessible name is a host `aria-label` that is not blank, alone; otherwise the text of each external `<label>` in `labels` order, then the `label` text, each with whitespace collapsed and trimmed, joined by one space; with none of them the control has no name, and one is required",
  "The `description` is the control's accessible description, followed by a host `aria-description` and the error",
  "The host's validity flags and message are the inner control's native constraint validation, and `reportValidity()` focuses the inner control and makes the browser show its message",
  "The native `input` event of the inner control reaches the host with `value` already updated; each committed change dispatches `ocelle-form-input-change`, a `CustomEvent` with `detail: { value }`, `bubbles` and `composed`; a change by script, by reset or by restore dispatches none",
  "The host is `display: block` and the control fills its inline size; the element sets no width of its own, so in a filter bar the page sets the element's width or places it as a flex or grid item",
  "A non-empty `error` is shown under the control in `--ocelle-color-danger`, with the control's boundary in `--ocelle-color-danger` at `--ocelle-bar-width`, makes the control invalid for assistive technology, is added after the description to its accessible description, and is announced politely once each time it changes to a new text",
  "The error does not block submission or change the form's validity: the host clears it",
  "An `error` in the page as first loaded is not announced and does not move focus: it is read with the control's description when the user reaches it, so put an error summary or a notice at the top of the page and focus it",
  "A control inserted after the build has loaded with an `error` announces it politely once, each control its own",
  "Setting `error` to empty resets the baseline, so the same text set again is announced again; a change of whitespace only is no change; changes closer together than `W` merge",
  "Only the host's own `hidden` attribute counts as a reveal for a form control: removing it announces the current error once; a control shown through a hidden ancestor announces nothing",
  "Load the build before any swap or script inserts form controls with `error`: a control upgraded by the registration does not announce",
  "A host `aria-invalid`, `aria-required` or `aria-disabled` reaches the inner control only with the value `\"true\"`, combined with the element's own `error`, `required` and `disabled`; write only `\"true\"` or nothing: any other value is not supported. Prefer the element's own attributes",
  "When a visible label is drawn (`label` or an external `<label>`), a host `aria-label` must contain the visible label text; any other combination is not supported",
  "A host `aria-label` and `aria-description` also stay on the host's node, so Chromium exposes the host as a generic with the same name and description beside the control",
  "A host `aria-labelledby` and a host `aria-describedby` are not supported: they would reference across the shadow root; use `label`, `aria-label` or `description` instead",
  "The `form` attribute joins the form it names, as on a native control; it is a standard attribute and the manifest does not list it",
  "In a form with no submit button that holds a native text input and a form control, Enter in the native input submits, since the browser does not count the custom element as a field that blocks implicit submission; Enter in the form control does not",
  "For htmx, trigger on `hx-trigger=\"ocelle-form-input-change\"` (or `input`): the native `change` event does not leave the shadow root, and htmx's default trigger for an unknown element is `click`",
  "Before the definition has loaded, a form control is not in its form's data and is not validated; to hide undefined elements, add a rule such as `ocelle-form-input:not(:defined) { visibility: hidden; }` to the page's own stylesheet",
  "The form controls are for the main grounds; a control on a state ground, `--ocelle-color-accent-low`, an inset or a hover ground is not supported",
  "Not measured: restore by autofill, where the browser draws the validation message, the `email` keyboard hint and the masking of `password`",
  "WebKit is not measured for form controls: its form association and `ElementInternals` are an open limitation",
  // ocelle-form-input (specs/010-feedback-forms FR-021, FR-029, FR-030, FR-035; T034a)
  "`ocelle-form-input` is a labelled text field with an optional description and a host-set error, that takes part in its form like a native input",
  "`type` (attribute and property, reflected): `text` (the default), `email`, `url`, `tel`, `search`, `password` or `number`; any other value behaves as `text` and the property reads `\"text\"`, while the attribute keeps the value as written",
  "`placeholder`, `autocomplete`, `inputmode` (`inputMode`), `pattern`, `min`, `max` and `step` (strings), `minlength` (`minLength`) and `maxlength` (`maxLength`) (numbers) and `readonly` (`readOnly`, boolean), attributes and reflected properties, pass to the inner field unchanged; an absent one reads `undefined` (`readOnly` reads `false`)",
  "The input's `value` attribute is its default value, restored on reset; the `value` property is the current value. Changing the attribute changes the current value only while the user has not edited it and no script has set `value` since the last reset",
  "Pressing Enter in the field dispatches `ocelle-form-input-change` if the value changed, then submits the form as a native input does",
  "Event: `ocelle-form-input-change`, `detail: { value }`. CSS parts: `label`, `control`, `description` and `error`. Slots: none. No CSS custom property of its own",
  "`ocelle-form-input` reads the tokens `--ocelle-color-sheet`, `--ocelle-color-control-border`, `--ocelle-color-ink`, `--ocelle-color-ink-muted`, `--ocelle-color-danger`, `--ocelle-color-focus`, `--ocelle-color-disabled-bg`, `--ocelle-color-disabled-ink`, `--ocelle-border-width`, `--ocelle-bar-width`, `--ocelle-radius-2`, `--ocelle-target-min`, `--ocelle-focus-width`, `--ocelle-focus-offset`, `--ocelle-font-size-sm`, `--ocelle-font-weight-strong`, `--ocelle-line-height-normal`, `--ocelle-space-1`, `--ocelle-space-2` and `--ocelle-space-3`",
  // ocelle-form-select (specs/010-feedback-forms FR-021, FR-026, FR-031, FR-032, FR-035, Edge Cases; T052a)
  "`ocelle-form-select` is a labelled native select for closed choices, with an optional description and a host-set error, that takes part in its form like a native select. It follows the form-control convention above",
  "Attributes and reflected properties: `name`, `label`, `description`, `error`, `required` and `disabled`. Properties: `value`, `form`, `labels`, `validity`, `validationMessage` and `willValidate`. Methods: `checkValidity()`, `reportValidity()` and `focus()`",
  "Its choices are its light-DOM `<option>` and `<optgroup>` children, written as for a native `<select>`: the native select inside mirrors their order, labels, values, `selected` (the default selection, restored on reset) and `disabled`, and follows every later change to them. The light-DOM children are not rendered and not exposed",
  "One choice only: there is no `multiple` and no `size`",
  "A host `value` attribute is ignored: the default selection is the last option marked `selected`, or the first enabled option without one. The `value` property is the current choice; setting it to a value no option has selects nothing and reads `\"\"`, as on a native select. There is no `defaultValue` property",
  "When the chosen option is removed, the choice falls back to the first enabled option, as on a native select, with no event",
  "The native select's own keys are unchanged: ArrowDown and ArrowUp change the choice, and typing a letter selects the next option whose label starts with it. Each change the user makes dispatches `ocelle-form-select-change`",
  "The open-list indicator is the `chevron-down` icon of the set, drawn in `currentColor` at `--ocelle-icon-size` at the inline end of the select, decorative and visible in forced colours; it takes no pointer events, so a click on it reaches the select",
  "Event: `ocelle-form-select-change`, `detail: { value }`. CSS parts: `label`, `control`, `description` and `error`. Slots: none. No CSS custom property of its own",
  "`ocelle-form-select` reads the tokens `--ocelle-color-sheet`, `--ocelle-color-control-border`, `--ocelle-color-ink`, `--ocelle-color-ink-muted`, `--ocelle-color-danger`, `--ocelle-color-focus`, `--ocelle-color-disabled-bg`, `--ocelle-color-disabled-ink`, `--ocelle-border-width`, `--ocelle-bar-width`, `--ocelle-radius-2`, `--ocelle-target-min`, `--ocelle-focus-width`, `--ocelle-focus-offset`, `--ocelle-font-size-sm`, `--ocelle-font-weight-strong`, `--ocelle-line-height-normal`, `--ocelle-space-1`, `--ocelle-space-2`, `--ocelle-space-3` and `--ocelle-icon-size`, the last for its indicator",
  "For htmx, trigger on `hx-trigger=\"ocelle-form-select-change\"` (or `input`)",
  "Not measured for `ocelle-form-select`: that Alt+Down or Space opens the list, and how the browser draws the open list",
  "Before the definition has loaded, a select's `<option>` children may show as text",
  "Importing `@ocelle/elements/ocelle-form-select.js` defines `ocelle-form-select` only: the select draws its indicator itself and does not define `ocelle-icon`",
  // the overflow-region module, under the element conventions (009 FR-011, FR-034; contracts/overflow-region.md; T019)
  "The overflow-region module (`src/overflow-region.ts`, internal) gives an element a scroll box that is a tab stop and a named group, or region, only while it overflows: `ocelle-scroller` uses it, and so does any later element with a scroll region",
  "Inputs: the host element (`new OverflowRegion(host, { box, role, step })`), `box`, a function that returns the scroll box in the host's shadow root, `role`, `\"group\"` by default or `\"region\"`, `step`, 40 px by default, and the label through `setLabel(label)`; the host lists `aria-label` in `observedAttributes` and re-renders on its change",
  "Outputs, read by the host's render: `overflowing`, `offStart`, `offEnd`, `fadeStart`, `fadeEnd`, `fadeAttribute` (`\"start\"`, `\"end\"`, `\"both\"` or undefined) and `name`; the module requests an update when one changes",
  "Effects, on the scroll box and the module's own shadow nodes only, never on the host: the box's `tabindex`, `role` and `aria-label`, the arrow keys on the box, the focus clearance of slotted controls and the focus handover when overflow ends",
  // the Lifecycle statement as contracts/overflow-region.md § Lifecycle has it (009 phase 2 review R2-02, landing review
  // L1-03 and L1-04, operator round phase 2 round 3, O3-03 and O3-04; T070)
  "Lifecycle: when the host connects, it adds its `keydown`, `focusin` and `focusout` listeners on the host and its `ResizeObserver`; after each update it follows the box, and on a new box, or none, it first lets go of the old one (unobserved, its `scroll` and `slotchange` listeners and its frame's `focusout` listener taken off, its `tabindex`, `role` and `aria-label` removed), so the new box takes them over; when the host disconnects, it disconnects the observer and takes its three listeners off the host, and the box keeps its attributes as last set; it emits no event",
  "The host renders `.region-frame` holding `.region-box` (with `data-fade` bound through `ifDefined`), whose `.region-track` holds the content, then `.region-ring` and two `.region-edge` elements (`start`, `end`), all but the box `aria-hidden`, and adds `overflowRegionStyles` to its `static styles`",
  "An element that uses the module does not set `tabindex`, `role` or `aria-label` on the box, handle the arrow keys on it, add a second fade or edge cue, scroll it smoothly, bind `data-fade` without `ifDefined`, or set the mask's size or a ring on `.region-frame` itself",
  // ocelle-scroller (009 FR-001 to FR-010, FR-034; contracts/elements.md § `ocelle-scroller`; Edge Cases; T019)
  "`ocelle-scroller` lays out its slotted content in one box that scrolls in the inline direction only; it is a tab stop and a named group only while its content overflows",
  "`label` (attribute and property, not reflected): the name of the scroller's group while it overflows, trimmed; empty or whitespace-only counts as none",
  "It has one default slot, the strip's content",
  "`ocelle-scroller` reads the tokens `--ocelle-focus-offset`, `--ocelle-focus-width`, `--ocelle-color-focus`, `--ocelle-scroller-fade-size`, `--ocelle-color-ink` (as a mask colour only) and `--ocelle-border-width` (the forced-colours edge line)",
  "While it overflows and has a name, the scroller is one `group` node with that name, holding its content; it is not a landmark. While it overflows without a name it is a tab stop with no role and no name. While its content fits it adds no tab stop and no role, beyond the `generic` node the host gets from an `id` or a host `aria-label`",
  "While it overflows, the scroller is a tab stop before its content. `ArrowLeft` and `ArrowRight` on the focused scroller, without a modifier, scroll it 40 px with no animation; `Home`, `End`, arrows with Alt, Ctrl, Meta or Shift, and every key pressed while a slotted control has focus get the browser's default",
  "When the content stops overflowing while the scroller has focus, focus moves to its first focusable slotted element, also inside a slotted element's open shadow root, and otherwise to the scroller itself, which shows the focus ring inside its box",
  "Each inline edge with content off-screen fades the content toward transparency over `--ocelle-scroller-fade-size`; in forced colours it shows a 1 px `CanvasText` line instead",
  "A slotted control focused with a focus ring is scrolled into view with its ring, at least the fade depth from each edge that fades; a control too wide for that keeps the fade off the side it would cover until focus leaves it or the box is scrolled",
  "The platform's horizontal scrollbar is kept: where it takes space it adds its thickness to the scroller's block size, and it is never faded",
  "Always give a scroller a `label`. A scroller repeated per item takes a name that identifies the item, such as \"Tags of WP-12\", not the same name on every card",
  "In a shrink-to-fit host (a default flex item, a dialog, a table cell) the scroller takes its content's size and does not overflow, so the page may scroll sideways instead: give the scroller a definite or maximum inline size there so that it scrolls",
  "Under reduced motion nothing the scroller does animates. The browser's own scrolling of the strip on a key pressed while a slotted control has focus is not the scroller's and may animate, also under reduced motion; the element does not control it",
  "`ocelle-scroller` has no event, CSS part or CSS custom property",
  // ocelle-workflow-board (009 FR-012 to FR-016, FR-034; contracts/elements.md § `ocelle-workflow-board`; Edge Cases;
  // research.md R-08, R-10; T036)
  "`ocelle-workflow-board` lays its children out in one row in the inline direction, `--ocelle-space-3` apart: each child takes at least `--ocelle-lane-min-width` and the children share any extra space equally; when their minimum widths exceed its size, the board scrolls inside itself",
  "`label` (attribute and property, not reflected): the name of the board's region while it overflows, trimmed; empty or whitespace-only counts as none",
  "It has one default slot, the lanes",
  "`ocelle-workflow-board` reads the tokens `--ocelle-lane-min-width`, `--ocelle-space-3`, `--ocelle-focus-offset`, `--ocelle-focus-width`, `--ocelle-color-focus`, `--ocelle-scroller-fade-size`, `--ocelle-color-ink` (as a mask colour only) and `--ocelle-border-width` (the forced-colours edge line)",
  "While it overflows and has a name, the board is one `region` landmark with that name, holding its lanes. Otherwise its tree, keyboard, focus, fades and scrollbar are those of `ocelle-scroller`, through the same overflow-region module",
  "A board holds lanes. Any other child is laid out as a lane: it takes the same minimum and the same equal share",
  "No content widens a lane past its share: text wraps, and a word wider than the lane breaks inside it. Content that cannot shrink, such as an element of fixed inline size, is not clipped: it overflows its lane over the next one, and when it reaches past the board's end the board scrolls. Put wide content, such as a row of chips, in an `ocelle-scroller`",
  "`base.css` caps images nested in a card at the lane's width; a host without it caps them itself",
  "The board paints no ground of its own: put it, and its flat lanes, on a main ground",
  "In a shrink-to-fit host (a default flex item, a dialog, a table cell) the board takes its lanes' minimum widths and gaps and does not overflow, so the page may scroll sideways instead: give the board a definite or maximum inline size there so that it scrolls",
  "A change inside a lane that changes only the inline size of a descendant, and neither the board's size nor a lane's, is picked up at the board's next size, slot or scroll event",
  "`ocelle-workflow-board` has no event, CSS part or CSS custom property",
  // ocelle-workflow-lane (009 FR-017 to FR-021, FR-034; contracts/elements.md § `ocelle-workflow-lane`; research.md
  // R-09, R-10; T036)
  "`ocelle-workflow-lane` is a column of a board with an optional title, an optional count and a variant. It has one default slot, the lane's content",
  "`label` (attribute and property, not reflected): the lane's title, shown and used as its name, trimmed; empty or whitespace-only counts as absent, and no title is shown",
  "`count` (attribute and property, not reflected): a whole number of 0 or more, shown after the title with tabular figures as plain digits (`03` shows 3). The attribute counts only when, after trimming, it is decimal digits alone, at most `Number.MAX_SAFE_INTEGER`; the property, when it is a safe integer of 0 or more; anything else counts as absent",
  "`count-label` (attribute, and property `countLabel`, not reflected): the count's text in the name, trimmed, such as \"3 work packages\"; the visible count still shows the number",
  "`variant` (attribute and property, reflected): `flat` drops the lane's ground, corners and padding and sets the title and count in small uppercase; any other value gives the default",
  "The lane is one `group` named by its title, then \", \" and the `count-label` or the count when a count is shown (\"Ready, 3\"); without a title, by the count's text alone; without a shown count, by the title alone. With neither it adds no role and no name. A non-blank host `aria-label` names the group alone",
  "No word is added to the name in any language: a host that wants words passes them in `count-label`",
  "The visible title and count are hidden from the accessibility tree, so the name is not read twice",
  "The lane is not a live region: a change of `count` or `count-label` updates the visible count and the name, and is not announced",
  "The default lane's ground is `--ocelle-color-sheet`, which differs from `--ocelle-color-canvas`, `--ocelle-color-panel`, `--ocelle-color-inspector` and `--ocelle-color-pane` in both themes, with `--ocelle-radius-row` corners and `--ocelle-space-3` padding; its title is `--ocelle-font-size-sm` at `--ocelle-font-weight-strong` in `--ocelle-color-ink`, and its count follows in `--ocelle-color-ink-muted`. In forced colours it draws a 1 px `CanvasText` border",
  "The flat lane has no ground, corners or padding of its own: its cards sit on the board's ground. Its title and count are `--ocelle-font-size-xs` at `--ocelle-font-weight-strong` in `--ocelle-color-ink-soft`, uppercase, spaced by `--ocelle-tracking-eyebrow`, in `--ocelle-font-sans` with tabular figures. In forced colours it draws no border",
  "`ocelle-workflow-lane` reads the tokens `--ocelle-color-sheet`, `--ocelle-radius-row`, `--ocelle-space-3`, `--ocelle-font-size-sm`, `--ocelle-font-size-xs`, `--ocelle-font-weight-strong`, `--ocelle-color-ink`, `--ocelle-color-ink-soft`, `--ocelle-color-ink-muted`, `--ocelle-tracking-eyebrow`, `--ocelle-font-sans`, `--ocelle-figures` and `--ocelle-border-width`; the board gives it `--ocelle-lane-min-width`",
  "A long title wraps between words, and a word wider than the lane breaks inside it; the lane does not widen for it, and the count stays visible",
  "`ocelle-workflow-lane` has no event, CSS part or CSS custom property",
  // ocelle-list-detail (009 FR-022 to FR-029, FR-034; contracts/elements.md § `ocelle-list-detail`; research.md R-11,
  // R-13, R-14; Edge Cases; T052)
  "`ocelle-list-detail` lays out a list beside the selected record's detail, with an optional inspector: three columns when there is room for them, two with the inspector stacked under the detail, and one pane at a time below its threshold or when the host sets `narrow`",
  "`collapse-below` (attribute, and property `collapseBelow`, not reflected): one column below this length; the default is `--ocelle-list-detail-collapse` (40rem) as computed on the element",
  "`inspector-below` (attribute, and property `inspectorBelow`, not reflected): the inspector stacks under the detail below this length; the default is `--ocelle-list-detail-inspector-collapse` (60rem) as computed on the element",
  "`narrow` (attribute and property, reflected): forces the one-column layout whatever the element's size",
  "`detail-open` (attribute, and property `detailOpen`, reflected): in one column, shows the detail pane, with the inspector stacked under it, instead of the list; in two or three columns it has no effect",
  "`remeasure()`: requests a measurement of the element's intrinsic sizes for the next animation frame, for a change the element cannot see (the container-tier convention lists them), and in that frame re-chooses the tier from a fresh measurement of the element's border box. On an element that is not in a document, never connected or removed, it does nothing: a never-connected element measures itself at its first render anyway, and after changing a removed element, call `remeasure()` once it is inserted again",
  // since the landing pass (operator round phase 4 round 5, O5-01; T079): not rendered
  "On an element in a document that is not rendered, with no box (in a closed `<dialog>`, under a `display: none` ancestor or with `hidden`), a pass or a call of `remeasure()` writes nothing and leaves the figures and the tier as they were; once the element is rendered (the dialog opened, the ancestor or the host shown) it measures itself afresh, with no call of `remeasure()` needed",
  "It has three slots: `list`, the list pane; the default slot, the detail pane; and `inspector`, the optional inspector pane. An empty `inspector` slot adds no track, no border and no space",
  "`ocelle-list-detail` reads the tokens `--ocelle-list-track-width`, `--ocelle-shell-inspector-width`, `--ocelle-list-detail-collapse`, `--ocelle-list-detail-inspector-collapse`, `--ocelle-color-rule`, `--ocelle-border-width`, `--ocelle-focus-width` and `--ocelle-color-focus`",
  "The list pane is `--ocelle-list-track-width` wide, the inspector `--ocelle-shell-inspector-width`, its border included, and the detail takes the rest; a 1 px `--ocelle-color-rule` border, decorative only, runs between adjacent panes, in `CanvasText` in forced colours",
  "When a layout or `detail-open` change hides the pane that holds focus, the element moves focus to the start of the pane that is shown: that pane takes focus by script only, never as a tab stop, and shows the focus ring inset, in `Highlight` in forced colours. Focus outside the hidden pane is not moved. The way back to the list is the host's own control; the element emits no event",
  "At upgrade, focus is moved only when it is inside a pane that the first layout hides",
  "The element adds no role, landmark or name of its own: the host names its own landmarks or headings in the panes",
  "`ocelle-list-detail` has no event, CSS part or CSS custom property",
  // the container-tier convention, under the element conventions (009 FR-025, FR-034, SC-009; contracts/elements.md
  // § Container-tier convention; research.md R-12, R-13; T052)
  "The container-tier convention: a tier is chosen from the element's own border-box inline size, measured by a `ResizeObserver`, never from the viewport. `ocelle-list-detail` follows it, and so does any later element with tiers",
  "A threshold is a `*-below` attribute. After trimming ASCII whitespace it accepts exactly `^(?:0|[0-9]+(?:\\.[0-9]+)?(?:px|rem|em))$`, units in any ASCII letter case: `rem` resolves at the root's computed font size and `em` at the host's, and every other value counts as absent",
  "Without the attribute, the threshold is its token as computed on the element, parsed with the same grammar, so a host that sets the token on the element or an ancestor moves it; a token value that is not an accepted form gives the token's published value",
  "Bounds are exclusive: the narrower tier applies only below the threshold, and at exactly the threshold the wider tier applies",
  "A boolean attribute set by the host, such as `narrow`, forces the narrowest tier",
  "No `container-type` is set on a host that may shrink to fit, such as a flex item, a dialog or a table cell: it would collapse to 0 px there",
  "The element's intrinsic inline sizes do not depend on the tier it shows: its max-content size is that of its widest tier and its min-content size that of its narrowest, so a shrink-to-fit host cannot make the tier alternate",
  "The intrinsic sizes are measured in one pass, at most once per animation frame and never inside a `ResizeObserver` callback, after a slot change or a light-DOM node or text change in any pane, shown or hidden, after a call of `remeasure()`, and, synchronously, before a tier change the host sets through an attribute or a property",
  // since the landing pass (operator round phase 4 round 5, O5-01; T079): becoming rendered is a trigger
  "Becoming rendered is a re-measure trigger too: an element first rendered or changed while it had no box, in a closed `<dialog>`, under a `display: none` ancestor or with `hidden`, measures its intrinsic sizes afresh in the next animation frame once it is rendered (the dialog opened, the ancestor or the host shown), never inside the `ResizeObserver` callback that sees it, and then has the size and the tier it has when rendered from the start; the host need not call `remeasure()`",
  "While the element is not rendered, a pass or a call of `remeasure()` writes nothing: the figures, the measured size and the tier stay as they were, and no figure becomes `NaN` or the 0 px of the missing box",
  "Changes with no light-DOM node or text change are not seen and wait for the next of these: an image or a font loading, content a slotted element renders in its own shadow root, and an attribute-only change such as a class swap; the host calls `remeasure()` after one",
  // the known limitations and their remedy (phase 4 review round 2, R2-01 and R2-02; operator decision P4)
  "The element's own inline padding and borders are added to each and are no floor of either",
  "A change of the element's own inline padding or borders alone re-chooses the tier. Two cases are known limitations, and the host calls `remeasure()` after a change in either; it re-chooses the tier from a fresh measurement of the element's border box in the next animation frame",
  "a percentage inline padding that changes with the host's container while the element's content box keeps its size, such as a content-box host with a fixed or capped inline size and percentage gutters: the change may go unseen, unless, for example, the host's container is positioned and the host is not; otherwise the tier stays stale until `remeasure()` or the next change the element sees",
  "a host whose content box is narrower than its own inline padding and borders: a change of a px or em padding or of a border alone is seen there too, and only a percentage padding may go unseen, as above",
  "One pass renders every pane in the measurement grid twice and restores it: about 10 ms (7 to 19 ms) with a 1000-row list. Attribute changes, such as a selection's `class` or `aria-selected`, run none; light-DOM swaps and text changes run at most one per frame",
  "Content a consumer mutates inside its own `ResizeObserver` callback can still make the browser report \"ResizeObserver loop completed with undelivered notifications.\" through layout alone, when the shown layout grows a shrink-to-fit host; the element does not cause it and cannot prevent it",
  "Hosts set `narrow`, `detail-open` and the `*-below` thresholds from a task, not from a `ResizeObserver` callback",
  // since 009 phase 5 (T062, FR-034): the frames of User Scenarios as the tested screen sizes
  "The layout elements are tested in four frames that stand for screens, each a block box of a stated inline size on a page whose viewport is wider than the frame, so the element's own measurement is tested, not the viewport's; the figures assume a 16 px root font size",
  "Frame W, 876 px: the 1280 px window beside a context sidebar, 1280 px less the rail (52 px), the sidebar (320 px) and two gutters (32 px)",
  "Frame R, 1196 px: the 1280 px window with the rail only",
  "Frame N, 636 px: the narrow tier, at a 720 px viewport (`--ocelle-shell-collapse-sidebar`, 45rem), where the sidebar has collapsed",
  "Frame S, 288 px: the 320 px reflow width",
  // since 009 phase 5 (T062, FR-034; spec User Scenarios, Engines): WebKit and the layout elements' focus behaviour
  "WebKit is not measured for the layout elements either: the tab stop of `ocelle-scroller` and `ocelle-workflow-board` while they overflow, their arrow keys, their focus handover when overflow ends and `ocelle-list-detail`'s focus moves are untested there",
  // since 009 phase 5 (T062; spec Edge Cases, Print)
  "These elements are screen layouts. In print, a board shows its lanes as the browser lays them out, and content off-screen in a scroller is not printed",
  // since 009 phase 5 (T062; research.md R-15, Not applicable)
  "Loading, error and disabled states do not apply to `ocelle-scroller`, `ocelle-workflow-board`, `ocelle-workflow-lane` and `ocelle-list-detail`: they are layout elements, with no such state and no story for one",
  // ocelle-section-header (011 FR-036, FR-010 to FR-013, FR-031, SC-006; contracts/elements-package.md § Tokens each element reads)
  '<ocelle-section-header> <span slot="eyebrow">Mission</span> <h2 slot="heading">Runs</h2> <p slot="description">Every run of the mission, newest first.</p> <button slot="actions" type="button">New run</button> </ocelle-section-header>',
  "It creates no heading of its own: slot one heading element (`h1` to `h6`) in `heading`, and its level is the page's. The page's own rules for that heading win over the header's styles.",
  "Place the header outside a `[data-ocelle-prose]` region: the prose rules of `@ocelle/styles` for `h1` to `h6` are page rules, so they win over the header's heading style.",
  "`heading` (slot): the page's heading element, drawn in `--ocelle-font-display` at `--ocelle-font-weight-strong`, `--ocelle-line-height-tight` and `--ocelle-color-ink`, at `--ocelle-font-size-lg`, or at `--ocelle-font-size-subhead` at the compact size, with no margin.",
  "`eyebrow` (slot): a short label above the heading, on a line of its own, drawn with the eyebrow style: `--ocelle-font-sans` at `--ocelle-font-size-eyebrow`, `--ocelle-font-weight-eyebrow`, `--ocelle-tracking-eyebrow` and `--ocelle-line-height-normal`, in `--ocelle-color-eyebrow`, upper case, with `--ocelle-figures`.",
  "`description` (slot): supporting text under the heading, at `--ocelle-font-size-sm` in `--ocelle-color-ink-muted`.",
  "`actions` (slot): controls at the inline end of the heading's first line, their block start at the heading's. When the heading's longest word and the actions do not fit side by side, the actions move under the heading, `--ocelle-space-2` below it, at its inline start, and a word longer than the line wraps inside itself.",
  "The gaps are `--ocelle-space-1` between eyebrow and heading and between heading and description, `--ocelle-space-4` between the heading and the actions, and `--ocelle-space-2` between two actions; the header has no padding of its own.",
  "`size` (attribute and property, reflected): `regular` or `compact`. Not set, or any other value, draws the heading regular, at `--ocelle-font-size-lg`, or compact in a compact `ocelle-card`'s `header` slot. `compact` draws it at `--ocelle-font-size-subhead`; the gaps stay the same.",
  "`variant` (attribute and property, reflected): `default` or `eyebrow`. Not set, or any other value, draws as `default`. `eyebrow` draws the heading with the eyebrow style, for a heading used as a label above a list, and renders neither the `eyebrow` nor the `description` slot; `actions` stay. `size` and a compact card change nothing in the eyebrow variant.",
  "The eyebrow variant draws the heading upper case while its DOM text stays as written",
  "`ocelle-section-header` reads the tokens `--ocelle-font-display`, `--ocelle-font-sans`, `--ocelle-font-size-lg`, `--ocelle-font-size-subhead`, `--ocelle-font-size-sm`, `--ocelle-font-weight-strong`, `--ocelle-line-height-tight`, `--ocelle-line-height-normal`, `--ocelle-color-ink`, `--ocelle-color-ink-muted`, `--ocelle-space-1`, `--ocelle-space-2`, `--ocelle-space-4`, `--ocelle-figures`, `--ocelle-font-size-eyebrow`, `--ocelle-font-weight-eyebrow`, `--ocelle-tracking-eyebrow` and `--ocelle-color-eyebrow`.",
  "The section header trims the block margins of its slotted eyebrow and description, so a `p` description sits `--ocelle-space-1` under the heading; a page rule that sets those margins wins.",
  "An empty slot of the section header takes no space: no box, gap or margin. A slot is empty when no element is assigned to it and every text assigned to it is whitespace; an assigned element counts as content even when it is `hidden`, so remove an element from the slot rather than hide it.",
  "The section header replaces the part-level padding and gap overrides Kitty Desktop sets on its section headers",
  "`ocelle-section-header` has no event, CSS part or CSS custom property, and adds no tab stop.",
  // ocelle-card (011 FR-036, FR-014 to FR-018; contracts/elements-package.md § Tokens each element reads)
  '<ocelle-card density="compact"> <ocelle-section-header slot="header"><h2 slot="heading">Runs</h2></ocelle-section-header> <p>Twelve runs this week.</p> </ocelle-card>',
  "`header` (slot): the card's header, usually an `ocelle-section-header`.",
  "The default slot: the card's body.",
  "`density` (attribute and property, reflected): `regular` or `compact`. Not set, or any other value, draws regular: padding `--ocelle-space-7` and a `--ocelle-space-2` gap between header and body. `compact` has padding `--ocelle-space-5` and a `--ocelle-space-4` gap.",
  "`inset` (boolean attribute and property, reflected): present with any value, the empty string included, draws the card on `--ocelle-color-inset`, for a card nested inside another surface, and changes nothing else. Absent, the card is on `--ocelle-color-sheet`.",
  "A compact card draws an `ocelle-section-header` in its `header` slot at the compact size, unless the header has a valid `size` of its own (`regular` or `compact`), which wins; a header with an empty or invalid `size` takes the card's density.",
  "Only a header assigned to the card's own `header` slot is compacted: one in its body, inside another element in the `header` slot, or in a card nested in it keeps its own size.",
  "`@ocelle/elements/ocelle-card.js` does not define `ocelle-section-header`: a page that slots one imports both.",
  "a header of a copy that does not answer Lit's `requestUpdate()` learns of a density change only at its own next update",
  "The card has no role: it adds no region, article or group, and a page that needs a region or an article adds it",
  "`ocelle-card` reads the tokens `--ocelle-border-width`, `--ocelle-color-rule`, `--ocelle-radius-row`, `--ocelle-color-sheet`, `--ocelle-color-inset`, `--ocelle-space-2`, `--ocelle-space-4`, `--ocelle-space-5` and `--ocelle-space-7`.",
  "The card trims the block-start margin of the first visible body element and the block-end margin of the last, skipping a `hidden` element at either edge, so a `p` body starts at the header gap and ends at the padding edge. The margins between body elements are the page's, and a page rule that sets the trimmed margins wins.",
  "An empty slot of the card takes no space: a card with no header has no header gap. A slot is empty when no element is assigned to it and every text assigned to it is whitespace; an assigned element counts as content even when it is `hidden`, so remove an element from the slot rather than hide it.",
  "In forced colours the card's border is drawn in a system colour, and a compact card keeps its padding, gap and compact header.",
  "`ocelle-card` has no event, CSS part or CSS custom property, and adds no tab stop.",
  // ocelle-page-header (011 FR-036, FR-019, FR-031, SC-006; research.md R-07; contracts/elements-package.md § Tokens each element reads; T028)
  '<ocelle-page-header size="compact"> <span slot="eyebrow">Workspace</span> <h1 slot="heading">Missions</h1> <p slot="description">Every mission of the workspace, newest first.</p> <button slot="actions" type="button">New mission</button> </ocelle-page-header>',
  "The page header creates no heading of its own: slot one heading element (`h1` to `h6`) in `heading`, usually the screen's `h1`, and its level is the page's. The page's own rules for that heading win over the header's styles.",
  "Place the page header outside a `[data-ocelle-prose]` region: the prose rules of `@ocelle/styles` for `h1` to `h6` are page rules, so they win over the header's heading style.",
  "`heading` (slot): the page's heading element, the screen's title, drawn in `--ocelle-font-display` at `--ocelle-font-weight-display`, `--ocelle-tracking-display`, `--ocelle-line-height-tight` and `--ocelle-color-ink`, at `--ocelle-font-size-2xl`, or at `--ocelle-font-size-xl` at the compact size, with no margin.",
  "`eyebrow` (slot): a short label above the heading naming the area, on a line of its own, drawn with the eyebrow style at both sizes: `--ocelle-font-sans` at `--ocelle-font-size-eyebrow`, `--ocelle-font-weight-eyebrow`, `--ocelle-tracking-eyebrow` and `--ocelle-line-height-normal`, in `--ocelle-color-eyebrow`, upper case, with `--ocelle-figures`.",
  "`description` (slot): a subtitle under the heading, at `--ocelle-font-size-md` in `--ocelle-color-ink-soft`, `--ocelle-space-1` below the heading.",
  "`actions` (slot): the screen's controls at the inline end of the heading's first line, their block start at the heading's, `--ocelle-space-4` from it. When the heading's longest word and the actions do not fit side by side, the actions move under the description, or under the heading when there is none, `--ocelle-space-2` below it, at its inline start, and a word longer than the line wraps inside itself.",
  "The band has block padding `--ocelle-space-4`, inline padding `--ocelle-space-6` and a `--ocelle-border-width` rule in `--ocelle-color-rule` along its block end. The gaps are `--ocelle-space-1` between eyebrow and heading and `--ocelle-space-2` between two actions.",
  "The page header has no ground of its own: the band shows the surface it sits on, the page canvas or a pane.",
  "`size` (attribute and property, reflected): `regular` or `compact`. Not set, or any other value, draws regular, the heading at `--ocelle-font-size-2xl`. `compact` draws the heading at `--ocelle-font-size-xl` (24 px), for dense screens; everything else stays the same.",
  "`ocelle-page-header` reads the tokens `--ocelle-font-display`, `--ocelle-font-sans`, `--ocelle-font-size-2xl`, `--ocelle-font-size-xl`, `--ocelle-font-size-md`, `--ocelle-font-weight-display`, `--ocelle-tracking-display`, `--ocelle-line-height-tight`, `--ocelle-line-height-normal`, `--ocelle-color-ink`, `--ocelle-color-ink-soft`, `--ocelle-color-rule`, `--ocelle-border-width`, `--ocelle-space-1`, `--ocelle-space-2`, `--ocelle-space-4`, `--ocelle-space-6`, `--ocelle-figures`, `--ocelle-font-size-eyebrow`, `--ocelle-font-weight-eyebrow`, `--ocelle-tracking-eyebrow` and `--ocelle-color-eyebrow`.",
  "The page header trims the block margins of its slotted eyebrow and description, so a `p` description sits `--ocelle-space-1` under the heading; a page rule that sets those margins wins.",
  "An empty slot of the page header takes no space: no box, gap or margin. A slot is empty when no element is assigned to it and every text assigned to it is whitespace; an assigned element counts as content even when it is `hidden`, so remove an element from the slot rather than hide it.",
  "The page header replaces the pinned page-header font rules Kitty Desktop sets on its page headers",
  "`ocelle-page-header` has no event, CSS part or CSS custom property, adds no tab stop, and exposes no heading, banner or other landmark of its own.",
  // ocelle-context-sidebar (011 FR-036, FR-020 to FR-023, FR-028, SC-006; research.md R-09, R-11; contracts/elements-package.md § Tokens each element reads; operator decisions 6 and 7 of the implementation; T035)
  '<ocelle-context-sidebar label="Team navigation"> <p slot="head">Kitty team</p> <ul> <li><a href="/missions">Missions</a></li> <li><a href="/runs">Runs</a></li> </ul> <ocelle-section-header><h2 slot="heading">Projects</h2></ocelle-section-header> <p slot="footer">3 of 5 missions done</p> </ocelle-context-sidebar>',
  "`head` (slot): the sidebar's head, the team or project it belongs to, padded `--ocelle-space-4` on every side.",
  "The default slot: the sections, one element each (a `ul` of links, a `div`, an `ocelle-section-header`), each drawn as a block padded `--ocelle-space-4` on every side across the sidebar's whole inline size.",
  "`footer` (slot): the sidebar's footer, a progress summary for example, padded `--ocelle-space-4` on every side and kept at the sidebar's block end.",
  "A `--ocelle-border-width` divider in `--ocelle-color-rule` lies between the head and the first section, between each two sections and between the last section and the footer, across the sidebar's whole inline size; with no sections, one divider lies between the head and the footer. The sidebar's ground is `--ocelle-color-rail`.",
  "`label` (attribute and property, not reflected): the name of the sidebar's navigation landmark, trimmed. Not set, empty or whitespace-only, the landmark has no name; the sidebar is drawn the same either way.",
  "Set a distinct `label` on every sidebar: assistive technology lists the navigation landmarks of a page, and unnamed ones give its user nothing to tell them apart.",
  "A host `aria-label` decides the landmark's name alone when present: a non-empty one is the name even when `label` is set, and a blank one leaves the landmark unnamed even with a `label`. `label` names the landmark only when the host has no `aria-label`, so removing the host `aria-label` falls back to `label`. The sidebar never writes, changes or removes the host's `aria-label`.",
  "`ocelle-context-sidebar` reads the tokens `--ocelle-color-rail`, `--ocelle-color-rule`, `--ocelle-border-width` and `--ocelle-space-4`.",
  "The sidebar trims the block margins of each section, and the block-start margin of the first visible element and the block-end margin of the last visible element of its head and of its footer, skipping a `hidden` element at either edge, so a `p` or a `ul` sits `--ocelle-space-4` inside its part. The margins between the elements of the head or of the footer are the page's, and a page rule that sets the trimmed margins wins.",
  "An empty slot of the sidebar takes no space: no padding and no divider. A slot is empty when no element is assigned to it and every text assigned to it is whitespace; an assigned element counts as content even when it is `hidden`, so remove an element from the slot rather than hide it.",
  "Wrap each section in an element: text in the default slot is drawn between the sections, with the sections' inline padding and no block padding, but it is not a section and gets no divider of its own.",
  "A `hidden` section draws nothing of its own, no box, padding or divider, but it still counts as content: a sidebar whose sections are all hidden keeps the dividers around its empty default slot, so remove sections from the slot rather than hide them all.",
  // a template or script in the default slot (011 FR-021, FR-022, FR-036; research.md R-09 § never-rendered elements; phase 4 review R2-01, landing L1-03)
  "A `template` or `script` element in the default slot, such as a `<template>` that Alpine.js keeps in the page for `x-if` or `x-for`, is not a section: it is not drawn and gets no padding or divider. Like a hidden section, it still counts as content.",
  "A page rule does not change a section's padding, inline margins, divider or display: the sidebar sets them `!important`, as the slot convention does, so a page reset such as `ul { margin: 0; padding: 0 }` leaves them in place. A section's block margins are the page's to set.",
  "The sidebar fills its container's block size when its content is shorter, with the footer at the block end and the free space above the footer, and grows with its content when it is taller, the footer following the last section; scrolling is the container's. This holds in a block, flex-row or grid container alike, because the host is `align-self: start`. A page rule on the host's `align-self` wins, so a page that sets it to `stretch` in a flex row or grid of definite block size keeps the sidebar at the container's size.",
  "In a flex row or a flex column the container sets the sidebar's inline size (an `inline-size`, a `flex` value, a grid track): there `align-self: start` leaves it at its content's inline size. In a flex column, `align-self: stretch` on the host also gives it the container's inline size.",
  "The sidebar replaces the part-level padding and gap overrides and the token-painted dividers Kitty Desktop sets on its context sidebars",
  "In forced colours the sidebar's dividers are drawn in a system colour.",
  "`ocelle-context-sidebar` has no event, CSS part or CSS custom property and adds no tab stop. The host itself is its one navigation landmark, with no other landmark inside it.",
  // ocelle-personal-rail (011 FR-036, FR-024 to FR-028, SC-006; research.md R-10, R-11; contracts/elements-package.md § Tokens each element reads and the note for #12; T043)
  '<ocelle-personal-rail label="Personal"> <a href="/inbox">Inbox</a> <a href="/runs">Runs</a> <a href="/docs">Docs</a> <a slot="bottom" href="/account">Account</a> </ocelle-personal-rail>',
  "The default slot: the primary items, from the rail's block start (vertical) or inline start (horizontal).",
  "`bottom` (slot): the bottom group, kept at the rail's block end (vertical) or at the inline end of its first row (horizontal).",
  "The items are `--ocelle-space-1` apart and centred across the rail. A `--ocelle-border-width` divider in `--ocelle-color-chrome-muted` lies between the two groups, `--ocelle-space-1` from each, only when both are filled.",
  "`orientation` (attribute and property, reflected): `vertical` or `horizontal`. Not set, or any other value, draws vertical: a column `--ocelle-shell-rail-width` (52 px) wide, padded `--ocelle-space-2` in the block direction and `--ocelle-space-1` inline, which leaves a 44 px content box, with the divider across it.",
  "`horizontal` draws a row padded `--ocelle-space-2` that fills its container's inline size: the primary items wrap onto further rows from its inline start, the bottom group sits at the inline end of the first row, at most half the content box wide, and the divider runs over the rail's whole block size.",
  "`label` (attribute and property, not reflected): the name of the rail's navigation landmark, trimmed. Not set, empty or whitespace-only, the landmark has no name; the rail is drawn the same either way.",
  "Set a distinct `label` on every rail: assistive technology lists the navigation landmarks of a page, and unnamed ones give its user nothing to tell them apart.",
  "A host `aria-label` decides the landmark's name alone when present: a non-empty one is the name even when `label` is set, and a blank one leaves the landmark unnamed even with a `label`. `label` names the landmark only when the host has no `aria-label`, so removing the host `aria-label` falls back to `label`. The rail never writes, changes or removes the host's `aria-label`.",
  "The rail changes orientation only when `orientation` changes: it has no viewport or container query of its own, and changing it keeps focus, the document and tab order and the landmark.",
  "this one sets it from a viewport media query whose bound is exclusive, `matchMedia(\"(width < Npx)\")` (never `max-width: N`, which also matches at N), vertical while the viewport is at least 720 px wide and horizontal below:",
  'const narrow = matchMedia("(width < 720px)");',
  "For #12: `orientation` and `label` are the whole interface a shell or a personal drawer uses to drive the rail.",
  "The rail sizes no item: items are sized by themselves, at `--ocelle-size-rail-item` (40 px)",
  // stricter at the phase 5 review R2-01 (landing L1-05; FR-027): the old statement up to its full stop, and that no release ships ocelle-nav-item yet
  "A plain `<a>` does not: give `<a>` items `color: inherit` and a target of at least 24 px, or use `ocelle-nav-item` elements once they are released; no release of this package ships `ocelle-nav-item` yet.",
  "`ocelle-personal-rail` reads the tokens `--ocelle-color-chrome`, `--ocelle-color-chrome-ink`, `--ocelle-color-chrome-muted`, `--ocelle-border-width`, `--ocelle-shell-rail-width`, `--ocelle-space-1` and `--ocelle-space-2`.",
  "An empty slot of the rail takes no space: no gap and no divider, so a rail without bottom items has no divider, and one with only bottom items has them at its block end (vertical) or inline end (horizontal). A slot is empty when no element is assigned to it and every text assigned to it is whitespace; an assigned element counts as content even when it is `hidden`, so remove an element from the slot rather than hide it.",
  "A vertical rail fills its container's block size when its content is shorter, with the free space between the divider and the bottom group, and grows with its content when it is taller, the bottom group following the primary items; scrolling is the container's. This holds in a block, flex-row or grid container alike, because the host is `align-self: start`. A page rule on the host's `align-self` wins, so a page that sets it to `stretch` in a flex row or grid of definite block size keeps the rail at the container's size.",
  "The rail replaces the personal-rail `::part` overrides Kitty Desktop sets on its personal rail",
  "In forced colours the rail's divider is drawn in a system colour, and a horizontal rail keeps its row.",
  "`ocelle-personal-rail` has no event, CSS part or CSS custom property and adds no tab stop. The host itself is its one navigation landmark, with no other landmark inside it.",
  // 012 (tasks.md T020; contracts/elements-package.md § Control conventions, § ocelle-button): the control conventions
  // that later controls follow, conventions 1 (one inner control, the filled host, the host guard and its limits), 3
  // (the disabled half), 5 (the name order, label in name) and 7 (primary action), and the ocelle-button section
  convention("One inner control", "Each control renders exactly one native `<button type=\"button\">` (button mode) or `<a>` (link mode) in an open shadow root attached with `delegatesFocus`; the host has no role and no tabindex"),
  "`element.focus()` focuses the inner control, and `element.click()` clicks it, so a click started by `click()` gets the same guarantees as any other click",
  "A click dispatched on the host with `dispatchEvent` is outside the guarantees: it does not pass through the inner control, so the element stops it",
  "The host is a grid container (`inline-grid` for `ocelle-button`) and the inner control its single stretched item, so the inner control fills the host when a flex row or a grid stretches it; a stretched button grows to the row's height (set `align-self` on the element to avoid it)",
  "A host may restyle the element's `display` and size: the element also listens for `click` and `auxclick` on the host from its constructor and stops any that did not pass through the inner control, in every state, so host area outside the inner control never activates it",
  "Capture-phase listeners, and listeners added to the element before it is upgraded, are outside that guarantee: they run before the element's own listener",
  convention("Disabled", "`disabled` means the control cannot be used here at all: the inner control is out of the tab order, reported disabled and not activated"),
  "Not activated means: no `ocelle-*` event and no `click` reaching a bubble-phase listener on the element or its ancestors (up to `document` and `window`); capture-phase listeners are outside it",
  convention("Name order", "The inner control's name is, in this order: the host's `aria-labelledby`, the host's `aria-label`, the element's `label` (trimmed; empty or whitespace-only counts as none), and otherwise the element's content; slotted icons never contribute"),
  "When a control's content is visible, its `label` contains the visible text, ideally at its start, so a user who speaks a control's visible name reaches it (label in name)",
  convention("Primary action", "A primary action uses `size=\"default\"` (44 × 44 px minimum); `variant=\"primary\"` is a look, not what makes an action primary"),
  // the ocelle-button section (FR-009 to FR-014, FR-018 to FR-020, FR-022, FR-023)
  "`variant` (attribute and property, reflected): `primary` (filled), `secondary` (the default; bordered on a surface) or `quiet` (bordered, no fill); any other value renders `secondary`",
  "`size` (attribute and property, reflected): `default` (the default; at least `--ocelle-target-min`, 44 px, in both dimensions) or `compact` (the compact text scale, `--ocelle-font-size-sm` and `--ocelle-line-height-compact`, and at least 24 px in both dimensions); any other value renders `default`",
  "`flush` (boolean attribute and property, reflected): no inline padding, no border and no fill, the label in `--ocelle-color-ink`, and the content at the box's inline start, so its label (or icon) lines up with the text around it; the minimum block and inline size of its `size` stay",
  "`ground` (attribute and property, reflected): the ground the button sits on, since an element cannot see its ancestor's colour. `accent-low`, `inset`, `hover-bg` or `state` (any of the state grounds) gives a bordered variant an `--ocelle-color-accent-strong` border; absent or any other value means the main grounds `color-canvas`, `color-sheet`, `color-pane`, `color-panel`, `color-inspector` and `color-rail`, with an `--ocelle-color-control-border` border",
  "`ground=\"chrome\"` is for the chrome grounds (`color-chrome`, `color-chrome-hover`): the label is `--ocelle-color-chrome-ink`, a bordered variant has an `--ocelle-color-chrome-muted` border and no fill, so `secondary` looks like `quiet` there; hover fills with `--ocelle-color-chrome-hover`, pressed with `--ocelle-color-chrome-active`, and both turn the border `--ocelle-color-chrome-ink`; the primary looks as on every ground",
  "On a container whose surface changes (a list or table row that takes `color-hover-bg` on hover, or `color-accent-low` when selected), set `ground` for the changed surface statically (`hover-bg` or `accent-low`): `--ocelle-color-accent-strong` meets 3:1 on every main ground, so the border holds in both states",
  "`label` (attribute and property, not reflected): the accessible name, trimmed; empty or whitespace-only counts as none",
  "`disabled` (boolean attribute and property, reflected): the disabled state of the control conventions",
  "Each activation that delivers a `click` (a pointer click, Enter or Space, the element's `click()`) also dispatches `ocelle-button-activate` from the element: a `CustomEvent` with `bubbles: true`, `composed: true`, `cancelable: true` and `detail` `{}`, dispatched before the `click` reaches any bubble-phase listener on the element or its ancestors",
  "Calling `preventDefault()` on it cancels the `click`'s default action; a button has none, so the `click` is still delivered, with `defaultPrevented` `true`",
  "A disabled button dispatches neither event",
  "Hover and pressed change the surface and the border: a bordered variant's border becomes `--ocelle-color-hover-border`; the primary fills with `--ocelle-color-accent-hover` on hover and `--ocelle-color-accent` when pressed; `secondary` and `quiet` fill with `--ocelle-color-hover-bg` on hover and `--ocelle-color-active-bg` when pressed; a flush button changes its surface only",
  "A flush button's hover fill is `--ocelle-color-hover-bg`, so its hover shows no change where the ground has that colour: on `color-hover-bg` in both themes, on `color-inset` in light, on `color-neutral-bg` in dark, and with `ground=\"chrome\"` on `color-chrome-hover` in both themes; hover carries no information there, and focus and pressed still show",
  "The focus ring is drawn outside the button: a container that clips (`overflow` other than `visible`) and holds a flush button at its edge keeps at least `--ocelle-focus-offset` + `--ocelle-focus-width` of unclipped space around it, for example `padding-inline` of that size with a matching negative margin",
  "Keyboard focus shows the token focus ring on the inner control (`--ocelle-color-focus`, `--ocelle-focus-width`, `--ocelle-focus-offset`); a pointer click does not",
  "In forced colours the label and border are `ButtonText`, hover and pressed borders and the focus ring `Highlight`, a flush button's hover and pressed a dashed `Highlight` outline, and a disabled button `GrayText`",
  "`ocelle-button` does not take part in forms: its inner control is always `type=\"button\"`, so activating it inside a `<form>` neither submits nor resets the form, and it has no `type`, `name`, `value` or `form` attribute. A host that submits from it calls `form.requestSubmit()` in its click handler",
  "A long label wraps between words inside the button, which grows in block size; it is never truncated",
  // 012 phase 3 (tasks.md T033, T038; contracts/elements-package.md § Control conventions 2, 4 and 6, § ocelle-button):
  // link mode, the moved host ARIA with its recipes, mirrors and custom states, the two surfaces of current, the
  // link-mode activate event and look, and the engine floor above
  convention("Link versus button", "A control is in link mode exactly when its `href` is not empty or whitespace only, parses as a URL against the document's base URL and is not a `javascript:` URL as the URL parser reads it (so `JAVASCRIPT:`, `java\\tscript:` and a leading space or control character count); otherwise it is in button mode, with no error for an `href` that does not parse"),
  "Link mode renders an `<a>` with the `href` as written and the native link behaviour: Enter activates, Space does not, and modifier clicks get the browser's own modifier handling (the element prevents nothing); button mode renders a `<button type=\"button\">` (Enter and Space activate). Both modes look the same for the same variant",
  "`data:` and `vbscript:` URLs are link mode and left to the host: Chromium blocks a top-level `data:` navigation and runs no `vbscript:`",
  "A disabled link has no `href`: it is an `<a role=\"link\" aria-disabled=\"true\">` out of the tab order, so neither a click, a modifier click, a middle click, the context menu nor a drag opens it",
  convention("Host ARIA is moved", "The ARIA attributes a control lists, and `title`, are moved from the host onto the inner control: the element applies the value there and removes the attribute from the host, so the state appears once, on the inner control, and `getAttribute` on the host returns `null` afterwards"),
  "To clear a moved state, set an empty or whitespace-only value (`aria-controls=\"\"`, `aria-label=\"\"`, `title=\"\"`) or the ARIA off value (`aria-expanded=\"false\"`, `aria-pressed=\"false\"`, `aria-current=\"false\"`); any other value is applied as written",
  "`removeAttribute` on a moved attribute changes nothing, and neither does a framework binding that becomes `undefined`, `null` or `nothing`, so bind the off value",
  "| React | `aria-current={active ? \"page\" : \"false\"}`, `aria-expanded={open ? \"true\" : \"false\"}`, `aria-controls={open ? \"panel\" : \"\"}` | `undefined` or `null` |",
  "| Lit | `aria-current=${active ? \"page\" : \"false\"}` (an attribute binding with a string) | `nothing`, `ifDefined(undefined)` |",
  "| Svelte | `aria-current={active ? \"page\" : \"false\"}` | `undefined`, `null` |",
  "| htmx, Thymeleaf | render the attribute with the off value (`th:attr=\"aria-current=${active} ? 'page' : 'false'\"`) | omitting the attribute on an element that is updated in place; writing a `data-ocelle-moved-*` attribute |",
  "Each moved value is mirrored in a host attribute the element owns, `data-ocelle-moved-<attribute>` (for example `data-ocelle-moved-aria-label`), removed when the value is cleared; at upgrade the element reads a mirror back for an attribute the host does not set, and a host attribute set at upgrade wins over its mirror. So copies of the live DOM (`cloneNode(true)`, `innerHTML` and `outerHTML`, htmx's history snapshot) keep names and states",
  "The element restores a mirror that is removed or changed while it holds the value, so a morphing swap (htmx's idiomorph `morph` swap, Turbo 8 page-refresh morphs), which removes every attribute the server markup lacks, keeps the mirrors",
  "Hosts never write or remove a mirror: one written while the element holds no value for it is not read until the next upgrade",
  "With htmx, a swap that replaces the element moves the new element's attributes at upgrade; a morphing swap sets the changed attributes on the live element, which moves them, and the element restores the mirrors the morph removes; htmx's history restore keeps the moved values through the mirrors",
  "Since a host attribute selector no longer matches a moved state, `ocelle-button` exposes custom states: `:state(expanded)` while the moved `aria-expanded` is `\"true\"`, `:state(pressed)` while the moved `aria-pressed` is `\"true\"` in button mode, and `:state(current)` while the moved `aria-current` is anything but `\"false\"`, for example `ocelle-button:state(expanded) ocelle-icon`",
  "ID references (`aria-controls`, `aria-labelledby`, `aria-describedby`) are resolved by id in the host's own tree (its document, or the shadow root it is in) when they are set and when the element is connected, and related to the inner control by element reference, never by copying the id into the shadow root; ids not found are skipped, an element in another shadow root is not resolved, and an element added later with the id is picked up only when the attribute is set again",
  "Any other `aria-*` attribute on the host is not supported: it stays on the host and axe flags it",
  "This is the controls' own rule: `ocelle-icon` and `ocelle-brand-mark` keep their host `aria-label` rule (Host ARIA), so the two families differ",
  "An element that moves a standard attribute declares it with `@attr` and a description, with its mirror, so the manifest lists both",
  convention("Current", "On `ocelle-button`, `aria-current` is passed through to the inner control with any value and draws no visual mark; a host that wants a visible mark styles `:state(current)` or uses a row, whose `current` property draws the mark and sets `aria-current`"),
  "`href`, `target`, `rel` and `download` (attributes and properties, reflected): link mode (Link versus button) and the inner link's attributes, set while the link is available; in button mode and on a disabled link they have no effect. With `target=\"_blank\"` and no `rel`, the inner link gets `rel=\"noopener\"`",
  "`ocelle-button` moves `aria-expanded`, `aria-controls`, `aria-current`, `aria-haspopup`, `aria-pressed`, `aria-label`, `aria-labelledby`, `aria-describedby` and `title` (Host ARIA is moved); `aria-pressed` is applied in button mode only, since a link cannot be pressed",
  "A moved `title` is the inner control's native tooltip and its description, or its name when nothing else names it",
  "In link mode, calling `preventDefault()` on `ocelle-button-activate` cancels the navigation. A click with Ctrl, Meta, Shift or Alt held dispatches no `ocelle-button-activate`: its `click` is delivered, the element prevents nothing and the browser's own modifier handling applies (on Chromium on Linux, Ctrl, Shift and Alt give a new tab, a new window or a download and leave the page as it is; Meta is not a link modifier there and navigates the current tab); a middle click delivers no `click` and dispatches nothing",
  "In forced colours a link-mode button's text and border are `LinkText`",
  // 012 phase 4 (tasks.md T043, T048; contracts/elements-package.md § Control conventions 3, § ocelle-button): the
  // unavailable half of convention 3, the busy button, its spinner, the 4.8 s stop and the 833 ms limit of an override
  convention("Unavailable", "Unavailable means the control exists but cannot be used right now: the inner control stays in the tab order and keeps focus, reports `aria-disabled=\"true\"`, keeps its name and description so a user can learn why, and is not activated"),
  "An unavailable link has no `href` either: it is an `<a role=\"link\" tabindex=\"0\" aria-disabled=\"true\">` that stays focusable, so neither a click, a modifier click, a middle click, Enter, the context menu nor a drag opens it",
  "`busy` (boolean attribute and property, reflected): the button is unavailable (the control conventions) while a host waits for the result of an action, and its inner control reports `aria-busy=\"true\"`; `disabled` wins over `busy`: a disabled busy button is disabled and shows no spinner",
  "A busy button dispatches neither `ocelle-button-activate` nor a `click`; once `busy` is removed, the next activation delivers both",
  "While busy, a spinner takes the place of the slotted icon, so the button keeps its size; without an icon it sits before the label with the slot convention's gap. It never covers the label, is drawn in the control's text colour (`currentColor`, the system colour in forced colours) and adds nothing to the accessibility tree",
  "The spinner turns six times in 4.8 s and then stays still on the same arc it shows under `prefers-reduced-motion: reduce`, where it does not move at all, so it stops within 5 s. A host with long-running work that wants continuous motion shows its own pausable indicator",
  "A host that overrides `--ocelle-motion-spin` (one turn of the spinner, 800 ms) keeps it at or below 833 ms, so the six turns end within 5 s",
  "The library shows and announces no text while busy (no \"Loading\" string): a host that wants an announcement makes it",
  "While busy it also reads the motion tokens `--ocelle-motion-spin` and `--ocelle-motion-turn`",
  // 012 phase 5 (tasks.md T053, T057; contracts/elements-package.md § ocelle-action-row; plan decision 30): the
  // ocelle-action-row section, its conventions and its interface
  "The host is a grid container (`grid` for `ocelle-action-row`, with `min-inline-size: min-content`, so a shrink-wrapping container never makes it 0 wide)",
  "`row-id` (property `rowId`, reflected): the row's id, which `ocelle-action-row-activate` carries as `detail.rowId` (`\"\"` when absent)",
  "`layout` (attribute and property, reflected): `row` (the default) puts the icon, the title and the description on one line with the tags and the trailing icon, which move together to a second line when the line cannot hold them",
  "`presentation` (attribute and property, reflected): `default` (a bordered row on `--ocelle-color-sheet`, `--ocelle-radius-row`) or `flush` (no border and no surface, the block padding `--ocelle-space-1` and the compact text scale); any other value renders `default`",
  "Every row is at least `--ocelle-target-min` (44 px) tall in every presentation and layout, with the inline padding `--ocelle-space-3`",
  "`ground` (attribute and property, reflected): as on `ocelle-button`, it selects the default row's border: `--ocelle-color-control-border` on the main grounds, `--ocelle-color-accent-strong` with `accent-low`, `inset`, `hover-bg` or `state`; `ground=\"chrome\"` gives no fill, a `--ocelle-color-chrome-muted` border, the title in `--ocelle-color-chrome-ink` and the description and tags in `--ocelle-color-chrome-muted`",
  "On hover the surface becomes `--ocelle-color-hover-bg` (`--ocelle-color-chrome-hover` on chrome) and a default row's border `--ocelle-color-hover-border` (`--ocelle-color-chrome-ink` on chrome); a flush row gets no border and nothing moves",
  "`busy` (boolean attribute and property, reflected): the row's content is updating; its inner control reports `aria-busy=\"true\"`, and activation still dispatches the event: on a row, busy does not mean unavailable",
  "Each activation (a pointer click, Enter or Space, the element's `click()`) dispatches `ocelle-action-row-activate` from the element: a `CustomEvent` with `bubbles: true`, `composed: true`, `cancelable: true` and `detail` `{ rowId }`",
  "The row is named by its title (the default slot), then by `label` or the host's `aria-label` or `aria-labelledby` in the name order; its accessible description is the text of the `description` slot followed by that of the `tags` slot, unless the host sets `aria-describedby`",
  "A `description` or `tags` element without non-whitespace text (an empty `<span slot=\"description\"></span>`, as a server template renders a missing value) contributes nothing and takes no space; text written into it later is picked up",
  "The description, tags and trailing content are shown beside the row's control and hidden from assistive technology as content: the description and tags reach it as the row's accessible description",
  "Interactive content (a link, a button, an input) in the `description`, `tags` or `trailing` slot is not supported: it is hidden from assistive technology there, and axe reports it as `aria-hidden-focus`",
  "Slotted content that sets its own `pointer-events` takes the clicks on it, which the row then ignores (they do not pass through its control)",
  "The part `control` is the row's icon-and-title control, not its surface: `::part(control)` styles do not reach the row's surface or border",
  "The title and the description wrap anywhere when a word does not fit, so a long identifier never makes the row wider than its container",
  "The focus ring is drawn inside the row (`--ocelle-focus-offset-inset`), so a scroll container's edge or the next row never clips or covers it",
  "`ocelle-action-row` moves `aria-label`, `aria-labelledby`, `aria-describedby` and `title` (Host ARIA is moved); a moved `title` describes the row when nothing else does",
  // 012 phase 6 (tasks.md T062, T065; contracts/elements-package.md § ocelle-action-row; plan decisions 13, 16, 21, 30
  // and 31): the row's link activation, current, unavailable and card layout
  "In link mode the event is dispatched before the navigation, and calling `preventDefault()` on it cancels the navigation. A click with Ctrl, Meta, Shift or Alt held, or a middle click, dispatches no event and the element prevents nothing: the browser's own modifier handling applies (on Chromium on Linux a Meta-click navigates the current tab)",
  "`current` (attribute and property, reflected): `page` or `true` marks the current item: the inner control reports `aria-current` with that value and the row shows the current mark, an `--ocelle-color-accent-low` surface (`--ocelle-color-chrome-hover` with `ground=\"chrome\"`) and a bar in `--ocelle-color-current`, `--ocelle-bar-width` wide, at the inline start; any other value is not current",
  "The bar is drawn 7 px inside the row's edge, apart from the focus ring, so on a focused current row the ring and the bar stay two marks. The current mark stays on hover; in forced colours the bar is `Highlight`",
  "`unavailable` (boolean attribute and property, reflected): the row is unavailable (the control conventions): its inner control stays in the tab order with `aria-disabled=\"true\"`, keeps its name and description and is not activated by any click or key; a link row has no `href`. Its title, description, tags and trailing icon are in `--ocelle-color-disabled-ink` (`GrayText` in forced colours), and hovering it changes nothing",
  "An unavailable current row keeps its current surface and `aria-current`, with the bar in `--ocelle-color-disabled-ink`",
  "While the row is unavailable its description, tags and trailing wrappers carry `aria-disabled=\"true\"` too, so a checker reads their text as part of the inactive control",
  "`layout=\"card\"`: the icon and the title on the first line with the trailing icon at its end, then the description, then the tags, each `--ocelle-space-1` below the line above; the title is the part `title`, so a host can adjust it",
  "Tags wrap only between tags: a tag's text is not broken inside a word, except a tag wider than the row, which may break",
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
  // ocelle-listbox and ocelle-option (014 US1, FR-006, FR-009 to FR-018, FR-014a, FR-056; research.md R-01, R-03 to R-05, R-15, R-18)
  "`ocelle-listbox` is a single-select listbox of `ocelle-option` children: the host writes the options as its children, in the page's own markup, and reads the selected value from the listbox",
  "`value` (attribute and property, not reflected): the selected option's value, `\"\"` when none. Setting it to a value an enabled option has selects the first such option; setting it to `\"\"` or to a value no enabled option has clears the selection. A host set never emits an event, and setting the current value changes nothing",
  "A non-empty `value` that no enabled option has is remembered until an option with that value appears or is enabled, which is then selected, with no event; the next user selection or host set forgets it",
  "`label` (attribute and property, not reflected): the listbox's accessible name, trimmed; a host `aria-label` decides over it. Without either the listbox is unnamed: a host must name it",
  "`ocelle-listbox-change` with `detail` `{ value }`: the user selected another option with Enter, Space or a click; `value` already reads the new value when it is dispatched",
  "`ocelle-listbox-activate` with `detail` `{ value }`: the user confirmed an option, with Enter on the selected option or a double-click on an enabled option (whose first click selects it, so its change event comes first); not cancelable. A host confirms the choice by listening to it, for example to open a folder",
  "Both events bubble and are composed",
  "Keys, on an option: ArrowDown and ArrowUp move focus to the next and previous enabled option without wrapping, Home and End to the first and last; selection does not follow focus. Enter and Space select the focused option. The listbox handles no other key: Escape, Tab, ArrowLeft, ArrowRight and letters (there is no typeahead) reach the page unhandled",
  "The listbox is one tab stop: the selected option when it is enabled, else the option that last had focus, else the first enabled option. Disabled options are skipped by the keys and the tab stop but stay focusable, so a focused option that becomes disabled keeps focus",
  "`ocelle-option`: `value` (attribute and property, reflected) and `disabled` (boolean, reflected). An option with no `value`, or a blank one, has its index among the listbox's options as its value, as a string; the default is not written to the attribute",
  "Options added, removed or reordered after render are followed; when the focused option is removed, focus moves to the next enabled option after it, else the nearest one before it; when the selected option is removed, `value` becomes `\"\"` with no event. A moved option keeps its selection and its focus",
  "The listbox writes `aria-selected`, `aria-disabled` and `tabindex` on its options; a host's own values of these on an option are overwritten. Keep option values unique: a host set selects the first option with the value",
  "An `ocelle-option` is only meaningful inside an `ocelle-listbox`: outside one it has no role and no tab stop",
  "The scroll container is the part `list`: a host that limits the listbox's height sets `max-block-size` on `ocelle-listbox`, and the focused option is scrolled into view with its focus ring inside the list",
  "The selected option shows a bar of `--ocelle-bar-width` in `--ocelle-color-accent-strong` on its inline-start edge, and `Highlight` in forced colours; the listbox is for the main grounds",
  "`ocelle-listbox` and `ocelle-option` read the tokens `--ocelle-color-ink`, `--ocelle-color-hover-bg`, `--ocelle-color-accent-strong`, `--ocelle-color-disabled-ink`, `--ocelle-color-focus`, `--ocelle-focus-width`, `--ocelle-focus-offset`, `--ocelle-bar-width`, `--ocelle-target-min`, `--ocelle-space-2`, `--ocelle-space-3` and `--ocelle-icon-size`",
  "An option's `icon` slot takes a leading icon by the slot convention; the icon adds nothing to the option's name",
  "A listbox has no `disabled` of its own; disable every option to disable it. A listbox whose every option is disabled, or with no option, has no tab stop",
  // ocelle-tabs, ocelle-tab and ocelle-tab-panel (014 US2, FR-006's tabs exception, FR-009 to FR-011a, FR-019 to FR-025, FR-056; research.md R-01 to R-05, R-15)
  "`ocelle-tabs` is a tablist of `ocelle-tab` children with their `ocelle-tab-panel` panels: the host writes the tabs and the panels as its children, in the page's own markup, and the tabs pair with the panels by order (the first tab with the first panel, and so on); tabs or panels without a partner are not rendered",
  "The tabs write the association themselves: an `id` on each tab and panel that has none (a child's own `id` is kept and used), `aria-controls` on every paired tab and `aria-labelledby` on the shown panel. A host writes no `id`, `aria-*` or `slot` on the children",
  "`value` (attribute and property, not reflected): the selected tab's value. Exactly one tab is selected whenever a tab is enabled: on first render the tab whose value `value` names, else the first enabled tab. Setting `value` to a value an enabled tab has selects the first such tab; setting it to `\"\"` or to a value no enabled tab has keeps the selection. A host set never emits an event, and setting the current value changes nothing",
  "A non-empty `value` that no enabled tab has is remembered until a tab with that value appears or is enabled, which is then selected, with no event; the next user selection or host set forgets it",
  "`label` (attribute and property, not reflected): the tablist's accessible name, trimmed. Name the tabs with `label`: a host `aria-label` on `ocelle-tabs` does not name the tablist (the element does not forward it, and it would name the host as a second node around the tablist)",
  "`ocelle-tabs-change` with `detail` `{ value }`: the user selected another tab with an arrow key, Home, End, Enter, Space or a click; `value` already reads the new value when it is dispatched. It bubbles and is composed",
  "Keys, on a tab: ArrowRight and ArrowLeft move focus and selection to the next and previous enabled tab in visual order (swapped under right-to-left), wrapping at the ends; Home and End to the first and last enabled tab. Enter and Space select a focused tab that is not selected. The tabs handle no other key: ArrowUp, ArrowDown, Escape and letters reach the page unhandled, and keys pressed inside a panel are the panel content's",
  "Only the selected tab is in the tab order. Tab from it moves into the selected panel: to the panel's first focusable element, or to the panel itself, which then shows the focus ring, when the panel holds nothing focusable (focusables inside shadow roots count, and the panel's content is followed after render)",
  "When the selected tab is removed or disabled, the next enabled tab after it is selected, else the nearest one before it, with no event; focus moves with the selection when the tab had focus. With every tab disabled, or none, no tab is selected, no panel is shown and `value` reads `\"\"`",
  "`ocelle-tab`: `value` (attribute and property, reflected) and `disabled` (boolean, reflected). A tab with no `value`, or a blank one, has its index among the tabs as its value, as a string; the default is not written to the attribute",
  "The tabs write `aria-selected`, `aria-disabled` and `tabindex` on their tabs and `tabindex` on the shown panel; a host's own values of these are overwritten. Keep tab values unique: a host set selects the first tab with the value",
  "An `ocelle-tab` or `ocelle-tab-panel` is only meaningful inside an `ocelle-tabs`: outside one it has no role and no tab stop",
  "The tab row is the part `tablist`, and the shown panel sits in the part `panels`, beside the tablist; when the tabs are wider than the row they wrap onto further rows, and the row never scrolls sideways",
  "The selected tab shows a bar of `--ocelle-bar-width` in `--ocelle-color-accent-strong` on its block-end edge, and `Highlight` in forced colours; the tabs are for the main grounds",
  "`ocelle-tabs`, `ocelle-tab` and `ocelle-tab-panel` read the tokens `--ocelle-color-ink`, `--ocelle-color-hover-bg`, `--ocelle-color-accent-strong`, `--ocelle-color-disabled-ink`, `--ocelle-color-focus`, `--ocelle-focus-width`, `--ocelle-focus-offset`, `--ocelle-bar-width`, `--ocelle-target-min`, `--ocelle-space-2`, `--ocelle-space-3` and `--ocelle-icon-size`",
  "A tab's `icon` slot takes a leading icon by the slot convention; the icon adds nothing to the tab's name or its panel's",
  "The tabs have no `disabled` of their own; disable every tab to disable them",
  // ocelle-segmented-choice and ocelle-segment (014 US3, FR-006, FR-009 to FR-011a, FR-026 to FR-030, FR-056; research.md R-01, R-03 to R-06, R-15)
  "`ocelle-segmented-choice` is a toolbar of `ocelle-segment` toggle buttons, exactly one of them pressed: the host writes the segments as its children, in the page's own markup, and the group is one tab stop with arrow keys between the segments",
  "`value` (attribute and property, not reflected): the pressed segment's value. Exactly one segment is pressed whenever a segment is enabled: on first render the segment whose value `value` names, else the first enabled segment. Setting `value` to a value an enabled segment has presses the first such segment; setting it to `\"\"` or to a value no enabled segment has keeps the press. A host set never emits an event, and setting the current value changes nothing",
  "A non-empty `value` that no enabled segment has is remembered until a segment with that value appears or is enabled, which is then pressed, with no event; the next user press or host set forgets it",
  "`label` (attribute and property, not reflected): the toolbar's accessible name, trimmed; a host `aria-label` names it too and, when present, decides alone",
  "`joined` (boolean, reflected): the joined variant. The segments touch, one shared line of `--ocelle-border-width` lies between neighbours and between rows, and only each row's first segment has rounded start corners and each row's last segment rounded end corners. The group recomputes the rounding itself when it wraps or unwraps: no host script, observer or `style` attribute is needed",
  "`ocelle-segmented-choice-change` with `detail` `{ value }`: the user pressed another segment with Enter, Space or a click; `value` already reads the new value when it is dispatched. It bubbles and is composed",
  "Keys, on a segment: ArrowRight and ArrowDown move focus to the next enabled segment, ArrowLeft and ArrowUp to the previous one (ArrowLeft and ArrowRight swapped under right-to-left), wrapping at the ends; Home and End to the first and last enabled segment. The arrows move focus only. Enter and Space press the focused segment. The group handles no other key: Escape and letters reach the page unhandled, and Tab leaves the group",
  "Only the pressed segment is in the tab order. A pressed segment cannot be un-pressed by the user",
  "When the pressed segment is removed or disabled, the next enabled segment after it is pressed, else the nearest one before it, with no event; focus moves with the press when the segment had focus. With every segment disabled, or none, no segment is pressed and `value` reads `\"\"`",
  "`ocelle-segment`: `value` (attribute and property, reflected) and `disabled` (boolean, reflected). A segment with no `value`, or a blank one, has its index among the segments as its value, as a string; the default is not written to the attribute",
  "The segmented choice writes `aria-pressed`, `aria-disabled` and `tabindex` on its segments; a host's own values of these are overwritten. Keep segment values unique: a host set presses the first segment with the value",
  "An `ocelle-segment` is only meaningful inside an `ocelle-segmented-choice`: outside one it has no role and no tab stop",
  "In the default variant the segments stand `--ocelle-space-2` apart, each with a border of `--ocelle-border-width` in `--ocelle-color-control-border` and the radius `--ocelle-radius-2`; the pressed segment is filled `--ocelle-color-accent-low` with a border of `--ocelle-bar-width` in `--ocelle-color-accent-strong`",
  "In the joined variant the lines around the pressed segment, and around a hovered one, are `--ocelle-color-accent-strong` at the same width, and the pressed segment is filled `--ocelle-color-accent-low` with a bar of `--ocelle-bar-width` in `--ocelle-color-accent-strong` along its block-end edge inside its box; in forced colours the bar and the default pressed border are `Highlight` and every line is `ButtonBorder`; the segmented choice is for the main grounds",
  "`ocelle-segmented-choice` and `ocelle-segment` read the tokens `--ocelle-color-ink`, `--ocelle-color-hover-bg`, `--ocelle-color-accent-low`, `--ocelle-color-accent-strong`, `--ocelle-color-control-border`, `--ocelle-color-disabled-ink`, `--ocelle-color-focus`, `--ocelle-focus-width`, `--ocelle-focus-offset`, `--ocelle-border-width`, `--ocelle-bar-width`, `--ocelle-radius-2`, `--ocelle-target-min`, `--ocelle-space-2`, `--ocelle-space-3` and `--ocelle-icon-size`",
  "Each segment's box is at least `--ocelle-target-min` high",
  "A segment's `icon` slot takes a leading icon by the slot convention; the icon adds nothing to the segment's name",
  "The segmented choice has no `disabled` of its own; disable every segment to disable it",
  // ocelle-copy-field (014 US4, FR-031 to FR-044, FR-056; research.md R-07, R-15, R-16)
  "`ocelle-copy-field` shows a command or identifier the user may copy, with a Copy control flush at its inline end. It never writes or reads the clipboard: activating the Copy control emits `ocelle-copy-field-request`, the host writes the clipboard (through a desktop bridge or the page's clipboard API) and reports the outcome in its own words by setting `status`",
  "`value` (attribute and property, not reflected): the text shown and requested, as written. It wraps at any point when it does not fit, never scrolls sideways, keeps its whitespace runs, is drawn in the sans with tabular figures on `--ocelle-color-inset` and stays selectable. With an empty or missing `value` the Copy control is disabled and emits nothing",
  "The text is plain text; a host that shows a digest in groups of four formats `value` itself",
  "`copy-label` (attribute and property `copyLabel`, not reflected): the Copy control's accessible name, trimmed; without it, or blank, the control is named \"Copy\"",
  "`status` (attribute and property, not reflected): the host's outcome text, shown as the content of the field's one polite live region (`role=\"status\"`) after the Copy control. The region is present and empty from first render; a blank `status` shows nothing. Setting the text the region already holds changes nothing. The field draws no colour or icon of its own for success or failure: the words are the host's",
  "The field clears `status` (the property reads `\"\"` and the region is emptied) when a new request starts and when `value` changes after first render; it changes `status` in no other way and emits nothing on its own. A `status` attribute the host wrote stays as written and is read again only when it changes",
  "`ocelle-copy-field-request` with `detail` `{ text }`: the user activated the Copy control with a click, Enter or Space; `text` is `value` at the activation. It bubbles and is composed, and is not cancelable",
  "The request is not dispatched in the activation's task: the field clears `status` at once, then dispatches the request after the next rendering update, once the emptied live region has reached the accessibility tree, so a screen reader hears the host's new text even when it is the same as before. Each activation emits one request; a field removed from the page before the dispatch emits none",
  "A host that writes the clipboard from the page (`navigator.clipboard.writeText(event.detail.text)`) receives the request outside the click's task, a frame later, and must check its engines' user-activation rules for clipboard writes: Chromium still counts the click's activation then, and WebKit is not measured. A host that writes the clipboard through a desktop bridge is not affected",
  "Name the field with a host `aria-label`: it is exposed as a group holding the text and the Copy control, unnamed without one. A host `aria-label` names the group, not the control",
  "Keys: the Copy control is one tab stop, and Enter and Space activate it, as on any button. The field handles no other key: Escape and letters reach the page unhandled",
  "CSS parts: `value` (the text) and `copy-control` (the Copy control). `copy-control` guarantees its box (its position, its size and the rules a host sets on it), its accessible name and the events its activation leads to, not which element carries it: a native `<button>` today. Rules a host writes against `:disabled`, `:focus-visible` or the inner border of the native button are outside that surface",
  "The Copy control will become `ocelle-button` (#7) in a later change once that element has merged. The `value` and `copy-control` parts, the control's accessible name and its events stay, so the swap is a PATCH under the surface stated here",
  "The field's outer border is `--ocelle-border-width` in `--ocelle-color-control-border` with the radius `--ocelle-radius-2`. The Copy control sits flush at the field's inline end, inside that border, filled `--ocelle-color-sheet`, with one line of `--ocelle-border-width` in `--ocelle-color-accent-strong` between it and the text: no gap and no double line. The control is at least `--ocelle-target-min` in both dimensions and shows the token focus ring when focused by keyboard. In forced colours the boundaries are `ButtonBorder`, the icon is `ButtonText` and the ring `Highlight`. The copy field is for the main grounds",
  "Importing `ocelle-copy-field` defines `ocelle-icon` too, for its copy icon",
  "`ocelle-copy-field` reads the tokens `--ocelle-font-sans`, `--ocelle-figures`, `--ocelle-color-ink`, `--ocelle-color-inset`, `--ocelle-color-sheet`, `--ocelle-color-control-border`, `--ocelle-color-accent-strong`, `--ocelle-color-disabled-ink`, `--ocelle-color-focus`, `--ocelle-focus-width`, `--ocelle-focus-offset`, `--ocelle-border-width`, `--ocelle-radius-2`, `--ocelle-target-min`, `--ocelle-space-1`, `--ocelle-space-2`, `--ocelle-space-3` and `--ocelle-icon-size`",
  // ocelle-link (014 US5, FR-045 to FR-049, FR-056; research.md R-08, R-15, R-16)
  "`ocelle-link` is a link inside running text: it is drawn inline in `--ocelle-color-link` with an underline, in `--ocelle-color-link-hover` under the pointer, and shows the token focus ring around each line it wraps onto. It always tells the host it was activated, with `ocelle-link-activate`; without `href` it never navigates, and with `href` it navigates unless the host cancels the event",
  "`href` (attribute and property, reflected): the link's target, as written. Without it the link is still a link in the tab order and only emits its event",
  "`label` (attribute and property, not reflected): the link's accessible name instead of its text, trimmed; blank counts as none. Name the link with `label`: a host `aria-label` on `ocelle-link` does not name the link (the element does not forward it, and it would name the host as a second node around the link)",
  "A `label` must contain the link's visible text, best starting with it (text \"the mission log\", label \"the mission log, opens in the viewer\"): a name without the visible text fails WCAG 2.5.3, Label in Name, and the `axe` gate's `label-content-name-mismatch`",
  "`ocelle-link-activate` with `detail` `{ href }`: the user activated the link with Enter or a primary-button click; `href` is the `href` attribute as written, or `null` without one. It bubbles, is composed and is cancelable: a host that routes the activation itself calls `preventDefault()`",
  "`detail.href` is the attribute as written and is not validated: it may be a `javascript:` or `data:` URL. The element refuses those, and any scheme other than `http:`, `https:` and the document's own, only for its own navigation",
  "With `href`, after the event and unless a listener cancelled it, the link resolves `href` against the document's base URL at that moment and navigates to it only when the resolved protocol is `http:`, `https:` or the document's own protocol. The check is on the resolved URL, so spaces before the scheme or a tab inside it do not bypass it. An empty `href` is an `href`, and a fragment navigates within the document",
  "A host that navigates itself from the event applies the same check: resolve `detail.href` against `document.baseURI` and navigate only when the resolved protocol is `http:`, `https:` or the document's own",
  "A host that needs another scheme (an app's own scheme on a page served over `http:`, say) handles the event: it cancels it and navigates or acts itself",
  "Only plain activations emit: Enter, or a primary-button click, with no modifier or with Alt alone. A user's modified activation (Ctrl, Meta or Shift held on a click or on Enter, or a middle-button click) emits nothing, and the element leaves its default to the browser: a new tab or window for Ctrl, Shift and the middle click, and the platform's convention for Meta (on macOS Meta is Cmd, which opens a new tab; Chromium on Linux follows the link in place)",
  // axe-core 4.14.0 on a link wrapped onto exactly two lines (operator decision 4 during phase 6)
  "axe-core 4.14.0 reports a serious `color-contrast` incomplete (`bgOverlap`) on a link whose text wraps onto exactly two lines: the link's text is slotted, so axe measures the union box of that text, whose centre lies on the surrounding paragraph, and cannot find the background. It is not a contrast failure: the link's colours are checked pairs of the tokens, and on one line or on three lines axe reports nothing",
  "A modified activation of a link without `href` does nothing: it emits no event and the page does not navigate",
  "The link has no `target`, `download` or `rel`. A host that wants to open a new window itself handles the event: it cancels it and opens the window",
  "Keys: the link is one tab stop. Enter activates it; Space does not, and scrolls the page as on any link. It handles no other key",
  "The link's focusable anchor is in its shadow root (`delegatesFocus`); a parent that counts its focusable content, such as a tab panel, counts the link",
  "CSS part: `anchor`, the link's anchor. In forced colours the link is `LinkText`, underlined, and its focus ring `Highlight`. The link is for the main grounds",
  "`ocelle-link` reads the tokens `--ocelle-color-link`, `--ocelle-color-link-hover`, `--ocelle-color-focus`, `--ocelle-focus-width` and `--ocelle-focus-offset`",
  // two copies on a page (FR-006, Edge Cases)
  "Two copies of the package on one page, two versions or the browser build beside a bundle of the module build, cannot both define an element: the first definition wins and the second import throws nothing",
];

/** The entry points (FR-002): specifier, file and what it defines, exactly, in the README's table. */
const entryRows = [
  "| `@ocelle/elements` | `dist/index.js` | every element; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-icon.js` | `dist/ocelle-icon.js` | `ocelle-icon` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-brand-mark.js` | `dist/ocelle-brand-mark.js` | `ocelle-brand-mark` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-notice.js` | `dist/ocelle-notice.js` | `ocelle-notice` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-form-input.js` | `dist/ocelle-form-input.js` | `ocelle-form-input` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-form-select.js` | `dist/ocelle-form-select.js` | `ocelle-form-select` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-scroller.js` | `dist/ocelle-scroller.js` | `ocelle-scroller` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-workflow-board.js` | `dist/ocelle-workflow-board.js` | `ocelle-workflow-board` only, not the lane; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-workflow-lane.js` | `dist/ocelle-workflow-lane.js` | `ocelle-workflow-lane` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-list-detail.js` | `dist/ocelle-list-detail.js` | `ocelle-list-detail` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-dialog.js` | `dist/ocelle-dialog.js` | `ocelle-dialog` and the `ocelle-icon` it renders; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-drawer.js` | `dist/ocelle-drawer.js` | `ocelle-drawer` and the `ocelle-icon` it renders; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-tooltip.js` | `dist/ocelle-tooltip.js` | `ocelle-tooltip` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-card.js` | `dist/ocelle-card.js` | `ocelle-card` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-section-header.js` | `dist/ocelle-section-header.js` | `ocelle-section-header` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-page-header.js` | `dist/ocelle-page-header.js` | `ocelle-page-header` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-context-sidebar.js` | `dist/ocelle-context-sidebar.js` | `ocelle-context-sidebar` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-personal-rail.js` | `dist/ocelle-personal-rail.js` | `ocelle-personal-rail` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-button.js` | `dist/ocelle-button.js` | `ocelle-button` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-action-row.js` | `dist/ocelle-action-row.js` | `ocelle-action-row` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-facts.js` | `dist/ocelle-facts.js` | `ocelle-facts` and its item `ocelle-fact`; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-fact.js` | `dist/ocelle-fact.js` | `ocelle-fact` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-empty-state.js` | `dist/ocelle-empty-state.js` | `ocelle-empty-state` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-progress.js` | `dist/ocelle-progress.js` | `ocelle-progress` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-listbox.js` | `dist/ocelle-listbox.js` | `ocelle-listbox` and `ocelle-option`; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-option.js` | `dist/ocelle-option.js` | `ocelle-option` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-tabs.js` | `dist/ocelle-tabs.js` | `ocelle-tabs`, `ocelle-tab` and `ocelle-tab-panel`; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-tab.js` | `dist/ocelle-tab.js` | `ocelle-tab` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-tab-panel.js` | `dist/ocelle-tab-panel.js` | `ocelle-tab-panel` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-segmented-choice.js` | `dist/ocelle-segmented-choice.js` | `ocelle-segmented-choice` and `ocelle-segment`; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-segment.js` | `dist/ocelle-segment.js` | `ocelle-segment` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-copy-field.js` | `dist/ocelle-copy-field.js` | `ocelle-copy-field` and `ocelle-icon`; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-link.js` | `dist/ocelle-link.js` | `ocelle-link` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-nav-item.js` | `dist/ocelle-nav-item.js` | `ocelle-nav-item` and its compact label tooltip; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-top-bar.js` | `dist/ocelle-top-bar.js` | `ocelle-top-bar`, its brand mark and its menu icon; for hosts with a bundler |",
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
    expect(Object.keys(manifest.exports ?? {})).toEqual([
      ".",
      "./ocelle-icon.js",
      "./ocelle-brand-mark.js",
      "./ocelle-notice.js",
      "./ocelle-form-input.js",
      "./ocelle-form-select.js",
      "./ocelle-scroller.js",
      "./ocelle-workflow-board.js",
      "./ocelle-workflow-lane.js",
      "./ocelle-list-detail.js",
      "./ocelle-dialog.js",
      "./ocelle-drawer.js",
      "./ocelle-tooltip.js",
      "./ocelle-card.js",
      "./ocelle-section-header.js",
      "./ocelle-page-header.js",
      "./ocelle-context-sidebar.js",
      "./ocelle-personal-rail.js",
      "./ocelle-button.js",
      "./ocelle-action-row.js",
      "./ocelle-facts.js",
      "./ocelle-fact.js",
      "./ocelle-empty-state.js",
      "./ocelle-progress.js",
      "./ocelle-listbox.js",
      "./ocelle-option.js",
      "./ocelle-tabs.js",
      "./ocelle-tab.js",
      "./ocelle-tab-panel.js",
      "./ocelle-segmented-choice.js",
      "./ocelle-segment.js",
      "./ocelle-copy-field.js",
      "./ocelle-link.js",
      "./ocelle-nav-item.js",
      "./ocelle-top-bar.js",
      "./browser.js",
      "./custom-elements.json",
    ]);
  });

  it("lists the thirteen names of the set, whether each mirrors and the consumer need it meets, in its Icons table (US2-1, FR-018, SC-007)", () => {
    expect(tableRows(read("README.md"), "Icons")).toEqual(iconRows);
  });

  it("keeps the rail's item-size sentence and the next one on one line of the README as written, with no line break between them (phase 5 review R2-01, landing L1-05)", () => {
    expect(read("README.md")).toContain("`ocelle-nav-item` is expected to have. The rail sets only the gap");
  });

  // Plan decision 28 (SC-006; tasks.md T033): the `ocelle-button` section gives the markup of #12's breadcrumb item,
  // #12's top-bar menu button and #14's copy control, exactly as scenarios/link.ts renders them.
  it("gives the three consumer compositions in its ocelle-button section, the markup scenarios/link.ts renders (SC-006)", () => {
    const section = /^## `ocelle-button`\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(read("README.md"))?.[1] ?? "";
    const block = /\*\*Consumer compositions\.\*\*[\s\S]*?```html\n([\s\S]*?)```/.exec(section)?.[1] ?? "";
    expect(block.split("\n").filter((line) => line !== "" && !line.startsWith("<!--"))).toEqual([compositions.breadcrumb, compositions.menu, compositions.copy]);
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
    // ocelle-notice (specs/010-feedback-forms FR-036; T016b)
    "`ocelle-notice`",
    "`@ocelle/elements/ocelle-notice.js`",
    "`tone`, `size` and `announce` (reflected)",
    "the slots `heading` and the default slot (the body), the CSS parts `heading` and `body`, and no event",
    // ocelle-form-input (specs/010-feedback-forms FR-036; T034a)
    "`ocelle-form-input`",
    "`@ocelle/elements/ocelle-form-input.js`",
    "its attributes and reflected properties `name`, `label`, `description`, `error`, `required`, `disabled`, `type`, `placeholder`, `autocomplete`, `inputmode`, `pattern`, `min`, `max`, `step`, `minlength`, `maxlength` and `readonly`",
    "the `value` attribute (its default value), the properties `value`, `form`, `labels`, `validity`, `validationMessage` and `willValidate` and the methods `checkValidity()`, `reportValidity()` and `focus()`",
    "the event `ocelle-form-input-change` with `detail: { value }`, no slot, and the CSS parts `label`, `control`, `description` and `error`",
    "the form-control convention",
    // ocelle-form-select (specs/010-feedback-forms FR-036; T052a)
    "`ocelle-form-select`",
    "`@ocelle/elements/ocelle-form-select.js`",
    "its options from its light-DOM `<option>` and `<optgroup>` children",
    "its attributes and reflected properties `name`, `label`, `description`, `error`, `required` and `disabled`; the properties `value`, `form`, `labels`, `validity`, `validationMessage` and `willValidate` and the methods `checkValidity()`, `reportValidity()` and `focus()`",
    "the event `ocelle-form-select-change` with `detail: { value }`, no slot, and the CSS parts `label`, `control`, `description` and `error`",
    // since 009 (T029, FR-035)
    "`ocelle-scroller`",
    "`@ocelle/elements/ocelle-scroller.js`",
    "the overflow-region module convention",
    // since 009 phase 3 (T043, FR-035)
    "`ocelle-workflow-board`",
    "`ocelle-workflow-lane`",
    "`@ocelle/elements/ocelle-workflow-board.js`",
    "`@ocelle/elements/ocelle-workflow-lane.js`",
    "`label`, `count`, `count-label` and `variant` (reflected)",
    // since 009 phase 4 (T060, FR-035)
    "`ocelle-list-detail`",
    "`@ocelle/elements/ocelle-list-detail.js`",
    "`collapse-below`, `inspector-below`, `narrow` (reflected) and `detail-open` (reflected)",
    "`remeasure()`",
    "the container-tier convention",
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
    // 011 (FR-036): the two layout elements, their entry points and properties, and the eyebrow tokens they read
    "`ocelle-section-header`",
    "`ocelle-card`",
    "`@ocelle/elements/ocelle-section-header.js`",
    "`@ocelle/elements/ocelle-card.js`",
    "`size` and `variant` (reflected)",
    "`density` and `inset` (reflected)",
    "`--ocelle-font-size-eyebrow`, `--ocelle-font-weight-eyebrow`, `--ocelle-tracking-eyebrow` and `--ocelle-color-eyebrow`",
    "variant rules that set colours or grounds go inside `@media not (forced-colors: active)`, and layout-only variant rules stay outside it",
    // 011 phase 3 (FR-036; T028): the page header and its entry point
    "`ocelle-page-header`",
    "`@ocelle/elements/ocelle-page-header.js`",
    // 011 phase 4 (FR-036; T035): the context sidebar and its entry point
    "`ocelle-context-sidebar`",
    "`@ocelle/elements/ocelle-context-sidebar.js`",
    // 011 phase 5 (FR-036; T043): the personal rail, its entry point and its properties
    "`ocelle-personal-rail`",
    "`@ocelle/elements/ocelle-personal-rail.js`",
    "`orientation` (reflected) and `label`",
    // 012 (tasks.md T020)
    "`ocelle-button`",
    "`@ocelle/elements/ocelle-button.js`",
    "`ocelle-button-activate`",
    "`variant`, `size`, `flush` and `ground` (reflected), `label` and `disabled` (reflected)",
    "the control conventions",
    "`--ocelle-color-hover-border`",
    // 012 phase 3 (tasks.md T038)
    "link mode",
    "`href`, `target`, `rel` and `download` (reflected)",
    "`aria-expanded`, `aria-controls`, `aria-current`, `aria-haspopup`, `aria-pressed`, `aria-label`, `aria-labelledby`, `aria-describedby` and `title`",
    "`data-ocelle-moved-<attribute>`",
    "`:state(expanded)`, `:state(pressed)` and `:state(current)`",
    "Chromium 135 and WebKit 17.4",
    // 012 phase 4 (tasks.md T048)
    "`busy` (reflected)",
    "a busy spinner",
    // 012 phase 5 (tasks.md T057)
    "`ocelle-action-row`",
    "`@ocelle/elements/ocelle-action-row.js`",
    "`ocelle-action-row-activate`",
    "`row-id`, `layout`, `presentation`, `ground`, `href`, `target`, `rel` and `busy` (reflected) and `label`",
    "`--ocelle-focus-offset-inset`",
    // 012 phase 6 (tasks.md T064a, T065)
    "`current` and `unavailable` (reflected)",
    "`layout=\"card\"`",
    "`:state(pressed)` only in button mode",
    // 013 (FR-057): the facts sheet, the empty state and the progress bar, their entry points and properties
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
    // 014 phase 2 (FR-058, research.md R-16, R-18)
    "`ocelle-listbox`",
    "`ocelle-option`",
    "`ocelle-listbox-change`",
    "`ocelle-listbox-activate`",
    "`@ocelle/elements/ocelle-listbox.js`",
    "`@ocelle/elements/ocelle-option.js`",
    // 014 phase 3 (FR-058, research.md R-16)
    "`ocelle-tabs`",
    "`ocelle-tab`",
    "`ocelle-tab-panel`",
    "`ocelle-tabs-change`",
    "`@ocelle/elements/ocelle-tabs.js`",
    "`@ocelle/elements/ocelle-tab.js`",
    "`@ocelle/elements/ocelle-tab-panel.js`",
    // 014 phase 4 (FR-058, research.md R-16)
    "`ocelle-segmented-choice`",
    "`ocelle-segment`",
    "`ocelle-segmented-choice-change`",
    "`joined`",
    "`@ocelle/elements/ocelle-segmented-choice.js`",
    "`@ocelle/elements/ocelle-segment.js`",
    // 014 phase 5 (FR-058, research.md R-16)
    "`ocelle-copy-field`",
    "`ocelle-copy-field-request`",
    "`copy-label`",
    "`copy-control`",
    "`@ocelle/elements/ocelle-copy-field.js`",
    // 014 phase 6 (FR-058, research.md R-16)
    "`ocelle-link`",
    "`ocelle-link-activate`",
    "`@ocelle/elements/ocelle-link.js`",
    ...["chevron-start", "chevron-end", "chevron-up", "chevron-down", "arrow-start", "arrow-end", "menu", "close", "folder", "file", "search", "table", "copy"].map((name) => `\`${name}\``),
  ])("names %s under Unreleased / Added (constitution VII, FR-031, SC-008)", (surface) => {
    expect(added).toContain(surface);
  });

  // 014 phase 4 (plan decision 1) raised the floor to Chromium 125 for custom states; 012 raised it again to Chromium
  // 135, so since the second merge of main the entry names what the segment needs within the merged floor.
  it("records that ocelle-segment's custom states need Chromium 125 and WebKit 17.4, within the Chromium 135 floor, under Unreleased (014 phase 4, plan decision 1)", () => {
    expect(flat(unreleased)).toContain("`ocelle-segment` uses custom states (`:state()`), which need Chromium 125 and WebKit 17.4: within the engine floor of Chromium 135 and WebKit 17.4 that `ocelle-button` sets (below)");
  });
});

/** The nine elements and six events this feature adds (014 contracts/elements.md; plan.md VII: a MINOR change). */
const selectionElements = ["ocelle-listbox", "ocelle-option", "ocelle-tabs", "ocelle-tab", "ocelle-tab-panel", "ocelle-segmented-choice", "ocelle-segment", "ocelle-copy-field", "ocelle-link"];
/** The elements 008 to 013 added on main before 014 merged it (landing operator decisions 1 and 4). */
const mainElements = ["ocelle-notice", "ocelle-form-input", "ocelle-form-select", "ocelle-button", "ocelle-action-row", "ocelle-scroller", "ocelle-workflow-board", "ocelle-workflow-lane", "ocelle-list-detail", "ocelle-dialog", "ocelle-drawer", "ocelle-tooltip", "ocelle-section-header", "ocelle-card", "ocelle-page-header", "ocelle-context-sidebar", "ocelle-personal-rail", "ocelle-facts", "ocelle-fact", "ocelle-empty-state", "ocelle-progress"];
const selectionEvents = ["ocelle-listbox-change", "ocelle-listbox-activate", "ocelle-tabs-change", "ocelle-segmented-choice-change", "ocelle-copy-field-request", "ocelle-link-activate"];

/**
 * 014 phase 7 (T110, plan.md step 7, analysis G3): the README overview, the text before its first `##` section, names
 * every element with the nine of this feature, the engine floor raised to Chromium 125 / WebKit 17.4 at the phase 4
 * stop (reviews/phase-4/decision-1.md) and the module rule of research R-16. The entry-point table's new specifiers are
 * checked exactly by "lists exactly the entry points of package.json's exports" above.
 */
describe("packages/elements/README.md overview (014 T110)", () => {
  const overview = flat(/^# @ocelle\/elements\n([\s\S]*?)(?=^## )/m.exec(read("README.md"))?.[1] ?? "");

  // The merges of main (landing operator decisions 1 and 4) bring 008's, 009's, 010's, 011's, 012's and 013's
  // twenty-one elements beside the icon, the mark and the nine of this feature: thirty-two in all.
  it("counts and names the thirty-two elements, the nine of this feature with the icon, the mark and the twenty-one of 008 to 013", () => {
    expect(overview).toContain("thirty-two elements");
    for (const tag of ["ocelle-icon", "ocelle-brand-mark", ...mainElements, ...selectionElements]) expect(overview).toContain(`\`${tag}\``);
  });

  // The second merge of main (landing operator decision 4): 012 raised the floor to Chromium 135 after 014's 125.
  it("states the engine floor, Chromium 135 and WebKit 17.4", () => {
    expect(overview).toContain("The elements need Chromium 135 or WebKit 17.4 and later (see Engines)");
  });

  it("states that a parent element's entry point also defines its children", () => {
    expect(overview).toContain("A parent element's entry point also defines the elements it owns as children");
  });

  it("points to the examples of each use", () => {
    expect(overview).toContain("Examples shows each selection and input element built into a screen");
  });
});

/**
 * 014 SC-009 (T110, research R-14, analysis G3): the README has one example per use kitty-mission-ui builds from these
 * elements, each a `###` section of `## Examples` with one `html` code block, written from the elements' public surface
 * only: the entry point, the attributes, properties and events of the contract. The host writes no ARIA of its own (no
 * `aria-*` attribute or property, no `role`, `tabindex` or `id`), no `ResizeObserver` and no clipboard call. One
 * `aria-label` is allowed, on `ocelle-copy-field` alone: it is that element's documented name (it has no `label`
 * property; README "Name the field with a host `aria-label`", contracts/elements.md), not ARIA wiring.
 */
const examples = [
  {
    heading: "The Open project folder picker",
    uses: ["import \"@ocelle/elements/ocelle-listbox.js\"", "<ocelle-listbox label=", "<ocelle-option value=", "<ocelle-icon slot=\"icon\" name=\"folder\">", "ocelle-listbox-change", "ocelle-listbox-activate", "event.detail.value", ".value", "Open project"],
  },
  {
    heading: "Tabbed screens",
    uses: ["import \"@ocelle/elements/ocelle-tabs.js\"", "<ocelle-tabs label=", "<ocelle-tab value=", "<ocelle-tab-panel>", "ocelle-tabs-change", "event.detail.value"],
  },
  {
    heading: "Segmented choices",
    uses: ["import \"@ocelle/elements/ocelle-segmented-choice.js\"", "<ocelle-segmented-choice label=", " joined", "<ocelle-segment value=", "ocelle-segmented-choice-change", "event.detail.value"],
  },
  {
    heading: "In-text links",
    uses: ["import \"@ocelle/elements/ocelle-link.js\"", "<ocelle-link href=", "<ocelle-link label=", "ocelle-link-activate", "event.detail.href", "event.preventDefault()"],
  },
  {
    heading: "Copy fields",
    uses: ["import \"@ocelle/elements/ocelle-copy-field.js\"", "<ocelle-copy-field aria-label=", " value=", "ocelle-copy-field-request", "event.detail.text", ".status ="],
  },
];

/** The `###` subsections of the README's `## Examples`, by heading, each with the text of its `html` code blocks. */
function exampleBlocks(text: string): Map<string, string> {
  const section = /^## Examples\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(text)?.[1] ?? "";
  const blocks = new Map<string, string>();
  for (const part of section.split(/^### /m).slice(1)) {
    const heading = part.slice(0, part.indexOf("\n")).trim();
    const code = [...part.matchAll(/^```html\n([\s\S]*?)^```$/gm)].map((match) => match[1] ?? "").join("\n");
    blocks.set(heading, code);
  }
  return blocks;
}

describe("packages/elements/README.md examples, one per consumer use (014 SC-009, T110)", () => {
  const blocks = exampleBlocks(read("README.md"));

  it("has exactly the five examples, in order", () => {
    expect([...blocks.keys()]).toEqual(examples.map((example) => example.heading));
  });

  describe.each(examples)("$heading", ({ heading, uses }) => {
    const code = blocks.get(heading) ?? "";

    it("has an html example", () => {
      expect(code.trim()).not.toBe("");
    });

    it.each(uses)("uses %s", (use) => {
      expect(code).toContain(use);
    });

    it("writes no ARIA of the host's own (no aria-* attribute or property but the copy field's name, no role, tabindex or id)", () => {
      expect(code).toMatch(/<ocelle-[a-z-]+[\s>]/);
      const aria = [...code.matchAll(/<([a-z-]+)[^>]*?\saria-[a-z]+=|\baria[A-Z]\w*|["'`]aria-[a-z]+["'`]/g)].map((match) => match[0]);
      expect(aria.filter((found) => !/^<ocelle-copy-field\s[^>]*?aria-label=$/.test(found))).toEqual([]);
      expect(code).not.toMatch(/\s(?:role|tabindex|id)=/);
      expect(code).not.toMatch(/setAttribute\(\s*["'`](?:role|tabindex|id)["'`]|\.(?:role|tabIndex|id)\s*=/);
    });

    it("uses no ResizeObserver and no clipboard call", () => {
      expect(code).toMatch(/<ocelle-[a-z-]+[\s>]/);
      expect(code).not.toMatch(/ResizeObserver|navigator\.clipboard|execCommand|ClipboardItem|clipboardData/);
    });
  });
});

/**
 * 014 phase 7 (T111, plan.md VII): the Unreleased lead names this feature's MINOR change, the nine elements, the six
 * events and the custom states' Chromium 125 / WebKit 17.4 within the merged floor (reviews/phase-4/decision-1.md).
 */
describe("packages/elements/CHANGELOG.md MINOR entry (014 T111)", () => {
  const unreleased = /^## Unreleased\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(read("CHANGELOG.md"))?.[1] ?? "";
  const lead = flat(unreleased.slice(0, Math.max(unreleased.indexOf("### "), 0)));

  it("states that the selection and input elements are a MINOR change", () => {
    expect(lead).toContain("Selection and input elements, a MINOR change");
  });

  it.each([...selectionElements, ...selectionEvents])("names `%s`", (name) => {
    expect(lead).toContain(`\`${name}\``);
  });

  it("names the custom states' Chromium 125 and WebKit 17.4 within the release's Chromium 135 and WebKit 17.4 floor", () => {
    expect(lead).toContain("which need Chromium 125 and WebKit 17.4, within the release's engine floor of Chromium 135 and WebKit 17.4");
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
