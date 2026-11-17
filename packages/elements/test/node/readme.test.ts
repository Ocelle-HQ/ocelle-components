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
  // restated for the notice's defaults (specs/010-feedback-forms FR-001; analysis I10, I15)
  "Every element class carries the JSDoc tag `@tagname <tag>`, every public property a description, and every public property that can be set a `@default` tag with the value the property reads before anything sets it, `@default undefined` for an optional one: the manifest takes the tag name and the defaults from them",
  "An element that observes a standard attribute such as `aria-label` adds it to `observedAttributes` without declaring a property, so the manifest does not list it",
  // the element's own attribute without a property (specs/010-feedback-forms FR-021, FR-034; analysis U6; T034a)
  "An attribute that is the element's own and has no property of its own, such as `ocelle-form-input`'s `value` (its default value), is declared in the manifest with the class's JSDoc tag `@attribute`, with its type, default and description",
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
  // host ARIA (FR-034, PLAN-A11Y-SECURITY-1-002 (a), 1-003 (a)), scoped to 005's two elements beside the notice's rules
  // (specs/010-feedback-forms FR-001, FR-009; analysis I10, I14, U10, U11)
  "On `ocelle-icon` and `ocelle-brand-mark`, a host `aria-label` names the element as `label` does, and when present it decides alone: a blank host `aria-label` leaves the element unlabelled even with a `label`",
  // the form controls' rules beside 005's (specs/010-feedback-forms FR-022; analysis I10, U10, U11, A5; T034a)
  "On a form control a host `aria-label` that is not blank names the control alone; a blank one, empty or whitespace only, is skipped, and the labels and `label` name the control",
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
  "| `@ocelle/elements/ocelle-notice.js` | `dist/ocelle-notice.js` | `ocelle-notice` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-form-input.js` | `dist/ocelle-form-input.js` | `ocelle-form-input` only; for hosts with a bundler |",
  "| `@ocelle/elements/ocelle-form-select.js` | `dist/ocelle-form-select.js` | `ocelle-form-select` only; for hosts with a bundler |",
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
    expect(Object.keys(manifest.exports ?? {})).toEqual([
      ".",
      "./ocelle-icon.js",
      "./ocelle-brand-mark.js",
      "./ocelle-notice.js",
      "./ocelle-form-input.js",
      "./ocelle-form-select.js",
      "./ocelle-facts.js",
      "./ocelle-fact.js",
      "./ocelle-empty-state.js",
      "./ocelle-progress.js",
      "./browser.js",
      "./custom-elements.json",
    ]);
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
