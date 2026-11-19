// The shared bodies of User Story 2's browser scenarios, `ocelle-button` in link mode and the ARIA passthrough (012 spec
// US2-1 to US2-14, the link-mode half of US1-11 and FR-002's same look, SC-006's three consumer compositions, and the
// edge cases of contracts/checks.md § Edge cases and plan decisions that belong to phase 3; FR-002 to FR-006, FR-009,
// FR-021, FR-023; research.md R-02 to R-06, R-12; plan decisions 19, 22, 24, 26 and 28; tasks.md T031, T031a).
//
// Three lists, each written against the driver:
// - `linkScenarios` run in both harnesses, in process on the element source (test/button.test.ts) and on the built
//   browser build on the strict-CSP fixture (test/browser/button.test.ts). No body of this list navigates: the links it
//   clicks are disabled, and the links it presses or hovers are never released on themselves.
// - `linkSinkScenarios` run in process only: the link bodies on the navigation sink's records (research.md R-11), which
//   the mutated `elements` project runs, so the modifier test, the `auxclick` guard and the cancel path are covered.
// - `linkNavigationScenarios` run on the fixture only: the same link bodies on real navigation, the new tabs and the
//   server's visits of `link-target.html` (a `Navigation`, which test/browser/button.test.ts implements).
// There is no conditional expect: each list's bodies assert what their harness observes.
//
// Expected values are written by hand: colours by token name from packages/tokens/test/expected.ts (`tokenColour`),
// forced colours from research.md R-12's table read as `resolveColour(<keyword>)`, sizes from spec FR-011. Every body
// ends with axe on its page (006's rule selection): no serious or critical result.
//
// Measured on this platform (reviews/phase-3/notes.md): Chromium on Linux treats Ctrl and Shift as new-tab and
// new-window modifiers, Alt as "download" and the middle button as a new tab, but Meta as no link modifier, so a
// Meta-click navigates the current tab; that navigation is the browser's default, which the element does not prevent,
// and the fixture body asserts it as such.
//
// Every "does not" outcome shares its body with the positive outcome it guards, and its plant is named here (run once
// and recorded in reviews/phase-3/plants.md):
// - a moved attribute is gone from the host (US2-4 to US2-14) beside its value on the inner control; plant: no mirror
//   (the copies of US2-13 lose the name), mirror not restored (the morph case), `title` not moved (US2-14);
// - a modifier or middle click dispatches no `ocelle-button-activate` (US2-1) beside the plain click's and Enter's one;
//   plant: activate on a modifier click;
// - a cancelled activate event leaves no navigation (US2-1) beside the uncancelled one's; plant: the cancel not
//   forwarded to the click;
// - a disabled link has no `href`, no tab stop and no activation (US2-3) beside its enabled twin;
// - Space does not activate a link (US2-1) beside Enter's activation;
// - the link-mode look equals the button-mode look (FR-002) in each variant and state; plant: link mode drops the
//   variant rules;
// - `aria-current` on a button draws no mark (edge case) beside the inner control's `aria-current`.
import { tokenColour } from "./icon.ts";
import type { Scenario } from "./icon.ts";
import { dispatches, meaningful, severe, summary } from "./button.ts";
import type { Driver, EventRecord, Modifier, NavigationRecord, Palette } from "./driver.ts";

export type { Scenario } from "./icon.ts";

/** The inner control of an `ocelle-button`, by its CSS part. */
const control = '[part="control"]';
const activate = "ocelle-button-activate";
const transparent = "rgba(0, 0, 0, 0)";
/** The page a link of the harness navigates to (the fixture server records each request for it). */
const target = "link-target.html";

/** `--ocelle-target-min` at the default root font size (002 Appendix A: 2.75rem). */
const targetMin = 44;
/** The compact minimum of FR-011 (WCAG 2.5.8), written by hand. */
const compactMin = 24;

const colour = (token: string, theme: Palette): string => tokenColour(`color-${token}`, theme);

/**
 * The markup of SC-006's three consumer compositions (plan decision 28; tasks.md T031a), exactly as the package
 * README's `ocelle-button` section gives them (test/node/readme.test.ts asserts it): #12's breadcrumb item, #12's
 * top-bar menu button and #14's copy control.
 */
export const compositions = {
  breadcrumb: '<ocelle-button flush size="compact" href="/projects" aria-current="page">Projects</ocelle-button>',
  menu: '<ocelle-button variant="quiet" ground="chrome" aria-haspopup="menu" aria-expanded="false">Menu</ocelle-button>',
  copy: '<ocelle-button flush label="Copy"><ocelle-icon slot="icon" name="copy"></ocelle-icon></ocelle-button>',
} as const;

/** A composition's markup with an `id` on its element, the one attribute the harness adds to reach it. */
function withId(markup: string, id: string): string {
  return markup.replace("<ocelle-button ", `<ocelle-button id="${id}" `);
}

/** The attributes of the inner control that the link and passthrough scenarios read; absent ones are left out. */
const innerAttributes = ["type", "href", "target", "rel", "download", "role", "tabindex", "aria-disabled", "aria-expanded", "aria-current", "aria-haspopup", "aria-pressed", "aria-label", "title"];

/** The inner control of the element `id`: its local name and the attributes of `innerAttributes` it carries. */
async function inner(driver: Driver, id: string): Promise<Record<string, string>> {
  const found = (await driver.elements(id)).filter((part) => part.attributes.part === "control");
  return Object.fromEntries([["tag", found.map((part) => part.name).join(",")], ...innerAttributes.flatMap((name) => found.flatMap((part) => (part.attributes[name] === undefined ? [] : [[name, part.attributes[name]] as const])))]);
}

/** The host attribute of a moved attribute and its mirror. */
async function hostPair(driver: Driver, id: string, name: string): Promise<{ readonly host: string | null; readonly mirror: string | null }> {
  return { host: await driver.attribute(id, name), mirror: await driver.attribute(id, `data-ocelle-moved-${name}`) };
}

/** The page rules a host writes against the button's custom states (US2-12), one property per state. */
const stateRules = "ocelle-button:state(expanded) { outline-style: dotted; } ocelle-button:state(pressed) { text-decoration-line: underline; } ocelle-button:state(current) { font-style: italic; }";

/** Which of the custom states the element `id` matches, read through `stateRules`. */
async function states(driver: Driver, id: string): Promise<string[]> {
  return [
    ...((await driver.computed(id, "outline-style")) === "dotted" ? ["expanded"] : []),
    ...((await driver.computed(id, "text-decoration-line")) === "underline" ? ["pressed"] : []),
    ...((await driver.computed(id, "font-style")) === "italic" ? ["current"] : []),
  ];
}

/** The click and activate dispatches at the element `id`. */
function counts(records: readonly EventRecord[], id: string): { readonly click: number; readonly auxclick: number; readonly activate: number } {
  return { click: dispatches(records, "click", id), auxclick: dispatches(records, "auxclick", id), activate: dispatches(records, activate, id) };
}

/** The sink's record of a plain activation of a link to `link-target.html`, with `changes`. */
function navigation(changes: Partial<NavigationRecord> = {}): NavigationRecord {
  return { type: "click", defaultPrevented: false, button: 0, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, href: target, ...changes };
}

/** The listeners from the button out to `window` when it sits in `<div id="wrap">`. */
const path = ["ocelle-button#b", "div#wrap", "body", "html", "document", "window"];

/** The ways US2-1 activates a link, each from a fresh mount. */
const activations = [
  { name: "a pointer click", act: (driver: Driver, id: string) => driver.click(id), trusted: true },
  {
    name: "Enter on the focused link",
    act: async (driver: Driver, id: string) => {
      await driver.focus(id);
      await driver.press("Enter");
    },
    trusted: true,
  },
  { name: "the element's click() method", act: (driver: Driver, id: string) => driver.callClick(id), trusted: false },
] as const;

/** The modifier clicks of US2-1, with the flag each sets on the click. */
const modifierClicks: readonly { readonly modifier: Modifier; readonly flag: "ctrlKey" | "metaKey" | "shiftKey" | "altKey" }[] = [
  { modifier: "Control", flag: "ctrlKey" },
  { modifier: "Meta", flag: "metaKey" },
  { modifier: "Shift", flag: "shiftKey" },
  { modifier: "Alt", flag: "altKey" },
];

/** The computed look of the inner control that FR-002 compares between the two modes. */
async function look(driver: Driver, id: string): Promise<Record<string, string>> {
  const properties = ["background-color", "border-top-color", "border-top-width", "border-top-style", "color", "padding-inline-start", "padding-inline-end", "padding-block-start", "text-decoration-line", "outline-style", "outline-color", "outline-width", "outline-offset", "cursor"];
  return Object.fromEntries(await Promise.all(properties.map(async (property) => [property, await driver.computed(id, property, control)] as const)));
}

type Kind = "primary" | "secondary" | "quiet" | "flush";
const kinds: readonly Kind[] = ["primary", "secondary", "quiet", "flush"];

/** A button-mode and a link-mode twin of a kind, and their disabled twins. */
function twins(kind: Kind): string {
  const attributes = kind === "flush" ? " flush" : ` variant="${kind}"`;
  return `<ocelle-button id="${kind}-b"${attributes}>Save</ocelle-button> <ocelle-button id="${kind}-l"${attributes} href="#look">Save</ocelle-button> `;
}

function disabledTwins(kind: Kind): string {
  const attributes = kind === "flush" ? " flush" : ` variant="${kind}"`;
  return `<ocelle-button id="${kind}-bd"${attributes} disabled>Save</ocelle-button> <ocelle-button id="${kind}-ld"${attributes} href="#look" disabled>Save</ocelle-button> `;
}

/** The idle fill and ink of each kind on the main grounds (research.md R-08), written by hand. */
function idleLook(kind: Kind, theme: Palette): { readonly fill: string; readonly ink: string } {
  const c = (token: string): string => colour(token, theme);
  if (kind === "primary") return { fill: c("accent"), ink: c("on-accent") };
  return { fill: kind === "secondary" ? c("sheet") : transparent, ink: c("ink") };
}

/** The scenarios of one theme where colours depend on it. */
function themed(theme: Palette): Scenario[] {
  const c = (token: string): string => colour(token, theme);
  return [
    {
      name: `FR-002, US1-11 link half (${theme}): for each variant and flush, the link-mode control's colours, border, padding, decoration, cursor and focus ring equal its button-mode twin's when idle, hovered, pressed, keyboard-focused and disabled, and the idle link has the variant's token fill and ink`,
      run: async (driver) => {
        await driver.mount(`<p class="on"><button id="start" type="button">Start</button> ${kinds.map(twins).join("")}</p><p class="on">${kinds.map(disabledTwins).join("")}</p><p id="away">Away</p>`);
        await driver.rules(".on { background-color: var(--ocelle-color-canvas); }");
        await driver.theme(theme);
        const found: Record<string, unknown> = {};
        await driver.focus("start");
        const focused: Record<string, { button: Record<string, string>; link: Record<string, string> }> = {};
        for (const kind of kinds) {
          await driver.press("Tab");
          const button = await look(driver, `${kind}-b`);
          await driver.press("Tab");
          focused[kind] = { button, link: await look(driver, `${kind}-l`) };
        }
        await driver.focus("start");
        for (const kind of kinds) {
          const [b, l] = [`${kind}-b`, `${kind}-l`];
          await driver.hover("away");
          const idle = { button: await look(driver, b), link: await look(driver, l) };
          await driver.hover(b);
          const hoveredButton = await look(driver, b);
          await driver.hover(l);
          const hovered = { button: hoveredButton, link: await look(driver, l) };
          await driver.pointerDown(b);
          const pressedButton = await look(driver, b);
          await driver.pointerUp("away");
          await driver.pointerDown(l);
          const pressed = { button: pressedButton, link: await look(driver, l) };
          await driver.pointerUp("away");
          await driver.hover("away");
          const disabled = { button: await look(driver, `${kind}-bd`), link: await look(driver, `${kind}-ld`) };
          const same = (pair: { button: Record<string, string>; link: Record<string, string> }): boolean => JSON.stringify(pair.button) === JSON.stringify(pair.link);
          found[kind] = {
            idle: same(idle),
            hovered: same(hovered),
            pressed: same(pressed),
            focused: same(focused[kind] ?? { button: {}, link: { missing: "" } }),
            disabled: same(disabled),
            ring: focused[kind]?.link["outline-style"],
            idleLink: { fill: idle.link["background-color"], ink: idle.link.color, decoration: idle.link["text-decoration-line"] },
            modes: [(await inner(driver, b)).tag, (await inner(driver, l)).tag, (await inner(driver, `${kind}-ld`)).tag],
          };
        }
        return { found, axe: await severe(driver) };
      },
      expected: {
        found: Object.fromEntries(kinds.map((kind) => [kind, { idle: true, hovered: true, pressed: true, focused: true, disabled: true, ring: "solid", idleLink: { ...idleLook(kind, theme), decoration: "none" }, modes: ["button", "a", "a"] }])),
        axe: [],
      },
    },
    {
      name: `SC-006, decision 28 (${theme}): the README's three consumer compositions, rendered with no style that targets the elements: the breadcrumb item a compact flush link named Projects with aria-current page, at least 24 px, its label at the heading's inline start; the menu button on the chrome ground a button named Menu with a menu popup, collapsed, at least 44 px, chrome-ink label and chrome-muted border, then expanded and :state(expanded); the copy control a button named Copy, at least 44 px`,
      run: async (driver) => {
        await driver.mount(`<div class="page"><nav id="trail">${withId(compositions.breadcrumb, "crumb")}</nav><h1 id="title">Projects</h1><div class="top-bar">${withId(compositions.menu, "menu")}</div><p>${withId(compositions.copy, "copy")}</p><p id="away">Away</p></div>`);
        await driver.rules(".page { background-color: var(--ocelle-color-canvas); color: var(--ocelle-color-ink); } .top-bar { background-color: var(--ocelle-color-chrome); }");
        await driver.theme(theme);
        await driver.hover("away");
        const size = async (id: string): Promise<readonly [number, number]> => {
          const box = await driver.box(id, control);
          return [box.width, box.height];
        };
        const [crumbSize, menuSize, copySize] = [await size("crumb"), await size("menu"), await size("copy")];
        const [label, heading] = [await driver.box("crumb", ".label"), await driver.box("title")];
        const crumb = await driver.axState("crumb", control);
        const menu = await driver.axState("menu", control);
        const copy = await driver.axState("copy", control);
        const found = {
          crumb: { role: crumb.role, name: crumb.name, current: await driver.current("crumb", control), compact: crumbSize.every((side) => side >= compactMin), aligned: Math.abs(label.x - heading.x) <= 0.5 },
          menu: {
            role: menu.role,
            name: menu.name,
            hasPopup: menu.hasPopup,
            expanded: menu.expanded,
            target: menuSize.every((side) => side >= targetMin),
            ink: await driver.computed("menu", "color", control),
            border: await driver.computed("menu", "border-top-color", control),
          },
          copy: { role: copy.role, name: copy.name, target: copySize.every((side) => side >= targetMin) },
          axe: await severe(driver),
        };
        await driver.setAttribute("menu", "aria-expanded", "true");
        await driver.rules(stateRules);
        return { ...found, opened: { expanded: (await driver.axState("menu", control)).expanded, states: await states(driver, "menu"), host: await driver.attribute("menu", "aria-expanded") } };
      },
      expected: {
        crumb: { role: "link", name: "Projects", current: { attribute: "page", property: "page" }, compact: true, aligned: true },
        menu: { role: "button", name: "Menu", hasPopup: "menu", expanded: false, target: true, ink: c("chrome-ink"), border: c("chrome-muted") },
        copy: { role: "button", name: "Copy", target: true },
        axe: [],
        opened: { expanded: true, states: ["expanded"], host: null },
      },
    },
  ];
}

/** The forced-colours scenario of one palette for link mode (US1-11's link half; research.md R-12's table). */
function forced(palette: Palette): Scenario {
  const links = kinds.map((kind) => `<ocelle-button id="${kind}" ${kind === "flush" ? "flush" : `variant="${kind}"`} href="#look">Save</ocelle-button>`).join(" ");
  const bordered = { rest: { ink: "LinkText", border: "LinkText", width: "1px" }, hovered: { border: "Highlight", outline: "none" }, focus: { style: "solid", colour: "Highlight" } };
  return {
    name: `US1-11 link half, forced colours with the ${palette} palette: each link-mode variant's text and border are LinkText, its hover border Highlight; a flush link has no border and its hover is a dashed Highlight outline; the focus ring is a solid Highlight outline; a disabled link is GrayText (FR-002, FR-020; research.md R-12)`,
    run: async (driver) => {
      await driver.mount(`<button id="start" type="button">Start</button> ${links} <ocelle-button id="off" href="#look" disabled>Save</ocelle-button><p id="away">Away</p>`);
      await driver.forcedColors("active", palette);
      const keywords = ["LinkText", "ButtonText", "Highlight", "GrayText"];
      const resolved = await Promise.all(keywords.map((keyword) => driver.resolveColour(keyword)));
      const named = (value: string): string => keywords[resolved.indexOf(value)] ?? value;
      const read = async (id: string, property: string): Promise<string> => named(await driver.computed(id, property, control));
      const found: Record<string, unknown> = {};
      await driver.focus("start");
      for (const kind of kinds) {
        await driver.hover("away");
        const rest = { ink: await read(kind, "color"), border: await read(kind, "border-top-color"), width: await driver.computed(kind, "border-top-width", control) };
        await driver.hover(kind);
        const hovered = kind === "flush" ? { width: await driver.computed(kind, "border-top-width", control), outline: await driver.computed(kind, "outline-style", control), colour: await read(kind, "outline-color") } : { border: await read(kind, "border-top-color"), outline: await driver.computed(kind, "outline-style", control) };
        await driver.hover("away");
        await driver.press("Tab");
        const focus = { style: await driver.computed(kind, "outline-style", control), colour: await read(kind, "outline-color") };
        found[kind] = { rest, hovered, focus };
      }
      const off = { ink: await read("off", "color"), border: await read("off", "border-top-color") };
      return { distinct: new Set(resolved).size, found, off, axe: await severe(driver) };
    },
    expected: {
      distinct: 4,
      found: {
        primary: bordered,
        secondary: bordered,
        quiet: bordered,
        flush: { rest: { ink: "LinkText", border: "LinkText", width: "0px" }, hovered: { width: "0px", outline: "dashed", colour: "Highlight" }, focus: { style: "solid", colour: "Highlight" } },
      },
      off: { ink: "GrayText", border: "GrayText" },
      axe: [],
    },
  };
}

export const linkScenarios: readonly Scenario[] = [
  {
    name: 'US2-1: <ocelle-button href="/projects">Projects</ocelle-button> is exactly one node with a role other than generic or a name, role link named Projects, focusable; the host an unnamed generic node; the inner control an <a> with the href as written; one tab stop in Tab and Shift+Tab order (FR-001, FR-002)',
    run: async (driver) => {
      await driver.mount('<button id="before" type="button">Before</button> <ocelle-button id="b" href="/projects">Projects</ocelle-button> <button id="after" type="button">After</button>');
      const state = await driver.axState("b", control);
      return {
        nodes: await driver.ax("b"),
        meaningful: await meaningful(driver, "b"),
        state: { role: state.role, name: state.name, disabled: state.disabled, focusable: state.focusable },
        inner: await inner(driver, "b"),
        forward: await driver.tabOrder(),
        reverse: await driver.tabOrder({ reverse: true }),
        axe: await severe(driver),
      };
    },
    expected: {
      nodes: [
        { role: "generic", name: "" },
        { role: "link", name: "Projects" },
      ],
      meaningful: [{ role: "link", name: "Projects" }],
      state: { role: "link", name: "Projects", disabled: false, focusable: true },
      inner: { tag: "a", href: "/projects" },
      forward: [["button#before"], ["ocelle-button#b", "a"], ["button#after"]],
      reverse: [["button#after"], ["ocelle-button#b", "a"], ["button#before"]],
      axe: [],
    },
  },
  {
    name: "US2-2: target, rel and download set on a link-mode host are on the inner link; target=_blank without rel gives rel=noopener, a rel of the host's wins; set as properties they reflect to the host's attributes and follow on the inner link; in button mode they have no effect (FR-021)",
    run: async (driver) => {
      await driver.mount(
        `<ocelle-button id="blank" href="${target}" target="_blank">Open</ocelle-button> <ocelle-button id="own" href="${target}" target="_blank" rel="nofollow" download="report.txt">Get</ocelle-button> <ocelle-button id="self" href="${target}" target="_self">Stay</ocelle-button> <ocelle-button id="plain" target="_blank" rel="nofollow" download="x">Button</ocelle-button>`,
      );
      const before = { blank: await inner(driver, "blank"), own: await inner(driver, "own"), self: await inner(driver, "self"), plain: await inner(driver, "plain") };
      await driver.setAttribute("blank", "target", "_top");
      const top = await inner(driver, "blank");
      await driver.setAttribute("blank", "rel", "external");
      const external = await inner(driver, "blank");
      await driver.setProperty("self", "href", "other.html");
      await driver.setProperty("self", "download", "self.txt");
      await driver.setProperty("self", "rel", "next");
      await driver.setProperty("self", "target", "_parent");
      const set = { inner: await inner(driver, "self"), host: { href: await driver.attribute("self", "href"), download: await driver.attribute("self", "download"), rel: await driver.attribute("self", "rel"), target: await driver.attribute("self", "target") } };
      await driver.setProperty("self", "target", undefined);
      await driver.setProperty("self", "rel", undefined);
      const unset = { inner: await inner(driver, "self"), host: { rel: await driver.attribute("self", "rel"), target: await driver.attribute("self", "target") } };
      return { before, top, external, set, unset, axe: await severe(driver) };
    },
    expected: {
      before: {
        blank: { tag: "a", href: target, target: "_blank", rel: "noopener" },
        own: { tag: "a", href: target, target: "_blank", rel: "nofollow", download: "report.txt" },
        self: { tag: "a", href: target, target: "_self" },
        plain: { tag: "button", type: "button" },
      },
      top: { tag: "a", href: target, target: "_top" },
      external: { tag: "a", href: target, target: "_top", rel: "external" },
      set: { inner: { tag: "a", href: "other.html", target: "_parent", rel: "next", download: "self.txt" }, host: { href: "other.html", download: "self.txt", rel: "next", target: "_parent" } },
      unset: { inner: { tag: "a", href: "other.html", download: "self.txt" }, host: { rel: null, target: null } },
      axe: [],
    },
  },
  {
    name: "US2-3: a disabled link-mode button has no href, target, rel or download, is one node of role link reported disabled, not focusable and out of the Tab and Shift+Tab order, and a plain, Ctrl, Shift or middle click delivers no click, auxclick or ocelle-button-activate; its enabled twin is a focusable link in the order; removing disabled brings the href and the link's attributes back (FR-003, FR-021)",
    run: async (driver) => {
      await driver.mount(
        `<div id="wrap"><button id="before" type="button">Before</button> <ocelle-button id="d" href="${target}" target="_blank" rel="nofollow" download="x" disabled>Projects</ocelle-button> <ocelle-button id="e" href="${target}">Projects</ocelle-button></div>`,
      );
      await driver.events("d", ["click", "auxclick", activate]);
      for (const options of [{}, { modifiers: ["Control"] as const }, { modifiers: ["Shift"] as const }, { button: "middle" as const }]) await driver.click("d", options);
      const records = await driver.takeEvents();
      await driver.focus("d");
      const focused = await driver.activeInner("d");
      const off = await driver.axState("d", control);
      const on = await driver.axState("e", control);
      const result = {
        inner: await inner(driver, "d"),
        nodes: await meaningful(driver, "d"),
        off: { role: off.role, name: off.name, disabled: off.disabled, focusable: off.focusable },
        on: { role: on.role, disabled: on.disabled, focusable: on.focusable },
        records: records.length,
        focused,
        forward: await driver.tabOrder(),
        reverse: await driver.tabOrder({ reverse: true }),
        axe: await severe(driver),
      };
      await driver.setAttribute("d", "disabled", null);
      return { ...result, enabled: await inner(driver, "d") };
    },
    expected: {
      inner: { tag: "a", role: "link", "aria-disabled": "true" },
      nodes: [{ role: "link", name: "Projects" }],
      off: { role: "link", name: "Projects", disabled: true, focusable: false },
      on: { role: "link", disabled: false, focusable: true },
      records: 0,
      focused: null,
      forward: [["button#before"], ["ocelle-button#e", "a"]],
      reverse: [["ocelle-button#e", "a"], ["button#before"]],
      axe: [],
      enabled: { tag: "a", href: target, target: "_blank", rel: "nofollow", download: "x" },
    },
  },
  {
    name: 'US2-4: aria-expanded="true" on the host is moved: the inner control reports expanded, the host has no aria-expanded and carries its mirror; "false" reports collapsed; "" reports no expanded state and drops the mirror; the host\'s ariaExpanded property set to "true" is moved the same way (FR-004, FR-009)',
    run: async (driver) => {
      await driver.mount('<ocelle-button id="b" aria-expanded="true">Filters</ocelle-button>');
      const read = async (): Promise<unknown> => ({ expanded: (await driver.axState("b", control)).expanded, inner: (await inner(driver, "b"))["aria-expanded"] ?? null, ...(await hostPair(driver, "b", "aria-expanded")) });
      const first = await read();
      await driver.setAttribute("b", "aria-expanded", "false");
      const collapsed = await read();
      await driver.setAttribute("b", "aria-expanded", "");
      const cleared = await read();
      await driver.setProperty("b", "ariaExpanded", "true");
      return { first, collapsed, cleared, property: await read(), axe: await severe(driver) };
    },
    expected: {
      first: { expanded: true, inner: "true", host: null, mirror: "true" },
      collapsed: { expanded: false, inner: "false", host: null, mirror: "false" },
      cleared: { expanded: null, inner: null, host: null, mirror: null },
      property: { expanded: true, inner: "true", host: null, mirror: "true" },
      axe: [],
    },
  },
  {
    name: 'US2-5 and the aria-current edge case: aria-current "page", "true", "step", "location", "date" and "time" on the host pass to the inner control as written and leave the host; "false" and "" remove it from the inner control; a current button draws no mark: its box and look equal its twin\'s without aria-current (FR-004, FR-009)',
    run: async (driver) => {
      await driver.mount('<p class="on"><ocelle-button id="b" aria-current="page">Projects</ocelle-button> <ocelle-button id="t">Projects</ocelle-button></p><p id="away">Away</p>');
      await driver.rules(".on { background-color: var(--ocelle-color-canvas); }");
      await driver.hover("away");
      const mark = async (id: string): Promise<string> => {
        const box = await driver.box(id, control);
        return JSON.stringify({ width: box.width, height: box.height, look: await look(driver, id) });
      };
      const noMark = (await mark("b")) === (await mark("t"));
      const passed: Record<string, unknown> = {};
      for (const value of ["page", "true", "step", "location", "date", "time", "false", ""]) {
        await driver.setAttribute("b", "aria-current", value);
        passed[value === "" ? "(empty)" : value] = { inner: await driver.current("b", control), host: await driver.attribute("b", "aria-current") };
      }
      return { noMark, passed, axe: await severe(driver) };
    },
    expected: {
      noMark: true,
      passed: {
        ...Object.fromEntries(["page", "true", "step", "location", "date", "time"].map((value) => [value, { inner: { attribute: value, property: value }, host: null }])),
        false: { inner: { attribute: null, property: null }, host: null },
        "(empty)": { inner: { attribute: null, property: null }, host: null },
      },
      axe: [],
    },
  },
  {
    name: "US2-6 and the reference edge cases: aria-controls relates the inner control to the element with that id in the host's tree and follows a change; an id with no element gives no relation and no error; several ids relate in order with missing ones skipped; an element given the id later is related only once the attribute is set again; an empty value clears the relation and the mirror (FR-005)",
    run: async (driver) => {
      await driver.mount('<ocelle-button id="b" aria-controls="panel-1">Filters</ocelle-button><div id="panel-1">One</div><div id="panel-2">Two</div><div id="spare">Spare</div>');
      const controls = async (): Promise<readonly string[]> => (await driver.axState("b", control)).controls;
      const first = { controls: await controls(), ...(await hostPair(driver, "b", "aria-controls")) };
      await driver.setAttribute("b", "aria-controls", "panel-2");
      const changed = await controls();
      await driver.setAttribute("b", "aria-controls", "nope");
      const missing = await controls();
      await driver.setAttribute("b", "aria-controls", "panel-2 nope panel-1");
      const several = await controls();
      await driver.setAttribute("b", "aria-controls", "late");
      const beforeLater = await controls();
      await driver.setAttribute("spare", "id", "late");
      const addedLater = await controls();
      await driver.setAttribute("b", "aria-controls", "late");
      const setAgain = await controls();
      await driver.setAttribute("b", "aria-controls", "");
      return { first, changed, missing, several, beforeLater, addedLater, setAgain, cleared: { controls: await controls(), ...(await hostPair(driver, "b", "aria-controls")) }, messages: await driver.messages(), axe: await severe(driver) };
    },
    expected: {
      first: { controls: ["panel-1"], host: null, mirror: "panel-1" },
      changed: ["panel-2"],
      missing: [],
      several: ["panel-2", "panel-1"],
      beforeLater: [],
      addedLater: [],
      setAgain: ["late"],
      cleared: { controls: [], host: null, mirror: null },
      messages: [],
      axe: [],
    },
  },
  {
    name: "US2-7: with every passthrough attribute set on hosts, in button and link mode, axe reports no serious or critical result, each host has none of the attributes and each inner control carries them (FR-004)",
    run: async (driver) => {
      await driver.mount(
        '<div id="panel">Panel</div><span id="lbl">Archive</span><span id="dsc">Gone for good</span>' +
          '<ocelle-button id="a1" aria-expanded="true" aria-controls="panel">Filters</ocelle-button> <ocelle-button id="a2" href="#here" aria-current="page">Projects</ocelle-button> ' +
          '<ocelle-button id="a3" aria-haspopup="menu" aria-expanded="false">Account</ocelle-button> <ocelle-button id="a4" aria-pressed="true">Bold</ocelle-button> ' +
          '<ocelle-button id="a5" aria-label="Close dialog">Close</ocelle-button> <ocelle-button id="a6" aria-labelledby="lbl" aria-describedby="dsc">Archive</ocelle-button> ' +
          '<ocelle-button id="a7" title="Close dialog">Save</ocelle-button> <ocelle-button id="a8" href="#here" aria-pressed="true">Bold</ocelle-button>',
      );
      const names = ["aria-expanded", "aria-controls", "aria-current", "aria-haspopup", "aria-pressed", "aria-label", "aria-labelledby", "aria-describedby", "title"];
      const ids = ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8"];
      const onHosts: string[] = [];
      for (const id of ids) for (const name of names) if ((await driver.attribute(id, name)) !== null) onHosts.push(`${id} ${name}`);
      const a6 = await driver.axState("a6", control);
      return {
        onHosts,
        inner: { a1: await inner(driver, "a1"), a2: await inner(driver, "a2"), a3: await inner(driver, "a3"), a4: await inner(driver, "a4"), a5: await inner(driver, "a5"), a7: await inner(driver, "a7"), a8: await inner(driver, "a8") },
        a1: (await driver.axState("a1", control)).controls,
        a6: { name: a6.name, description: a6.description },
        axe: await severe(driver),
      };
    },
    expected: {
      onHosts: [],
      inner: {
        a1: { tag: "button", type: "button", "aria-expanded": "true" },
        a2: { tag: "a", href: "#here", "aria-current": "page" },
        a3: { tag: "button", type: "button", "aria-expanded": "false", "aria-haspopup": "menu" },
        a4: { tag: "button", type: "button", "aria-pressed": "true" },
        a5: { tag: "button", type: "button", "aria-label": "Close dialog" },
        a7: { tag: "button", type: "button", title: "Close dialog" },
        a8: { tag: "a", href: "#here" },
      },
      a1: ["panel"],
      a6: { name: "Archive", description: "Gone for good" },
      axe: [],
    },
  },
  {
    name: 'US2-8: a host aria-label names the inner control and wins over label and the content; set to "" or to whitespace only it names the inner control by label, or by its content when there is no label, and its mirror is gone (FR-004, FR-006); each name holds the visible text (label in name)',
    run: async (driver) => {
      await driver.mount('<ocelle-button id="b" aria-label="Save draft" label="Save now">Save</ocelle-button> <ocelle-button id="c" aria-label="Save draft">Save</ocelle-button>');
      const name = async (id: string): Promise<string> => (await driver.axState(id, control)).name;
      const first = { b: await name("b"), c: await name("c"), mirror: (await hostPair(driver, "b", "aria-label")).mirror };
      await driver.setAttribute("b", "aria-label", "");
      const emptied = { name: await name("b"), ...(await hostPair(driver, "b", "aria-label")) };
      await driver.setAttribute("b", "aria-label", "Save draft");
      await driver.setAttribute("b", "aria-label", " \t ");
      const blank = { name: await name("b"), ...(await hostPair(driver, "b", "aria-label")) };
      await driver.setAttribute("c", "aria-label", "  ");
      return { first, emptied, blank, content: await name("c"), axe: await severe(driver) };
    },
    expected: {
      first: { b: "Save draft", c: "Save draft", mirror: "Save draft" },
      emptied: { name: "Save now", host: null, mirror: null },
      blank: { name: "Save now", host: null, mirror: null },
      content: "Save",
      axe: [],
    },
  },
  {
    name: 'US2-9 and the several-ids edge case: aria-labelledby naming "Archive" wins over aria-label="Remove"; several ids name the inner control in order, missing ones skipped; ids that all miss fall back to aria-label; aria-labelledby="" names it "Remove" (FR-005, FR-006)',
    run: async (driver) => {
      await driver.mount('<span id="x">Archive</span> <span id="y">now</span><ocelle-button id="b" aria-labelledby="x" aria-label="Remove"><ocelle-icon slot="icon" name="close"></ocelle-icon></ocelle-button>');
      const name = async (): Promise<string> => (await driver.axState("b", control)).name;
      const first = await name();
      await driver.setAttribute("b", "aria-labelledby", "y nope x");
      const several = await name();
      await driver.setAttribute("b", "aria-labelledby", "nope");
      const allMissing = await name();
      await driver.setAttribute("b", "aria-labelledby", "");
      return { first, several, allMissing, cleared: await name(), hosts: [await driver.attribute("b", "aria-labelledby"), await driver.attribute("b", "aria-label")], axe: await severe(driver) };
    },
    expected: { first: "Archive", several: "now Archive", allMissing: "Remove", cleared: "Remove", hosts: [null, null], axe: [] },
  },
  {
    name: 'US2-10: removeAttribute on a moved aria-current, and the host\'s ariaCurrent property set to null, change nothing: the inner control still reports "page"; setting "false" afterwards clears it (FR-004)',
    run: async (driver) => {
      await driver.mount('<ocelle-button id="b" href="#here" aria-current="page">Projects</ocelle-button>');
      const moved = await driver.current("b", control);
      await driver.setAttribute("b", "aria-current", null);
      const removed = await driver.current("b", control);
      await driver.setProperty("b", "ariaCurrent", undefined);
      const nulled = await driver.current("b", control);
      await driver.setAttribute("b", "aria-current", "false");
      return { moved, removed, nulled, cleared: await driver.current("b", control), mirror: (await hostPair(driver, "b", "aria-current")).mirror, axe: await severe(driver) };
    },
    expected: {
      moved: { attribute: "page", property: "page" },
      removed: { attribute: "page", property: "page" },
      nulled: { attribute: "page", property: "page" },
      cleared: { attribute: null, property: null },
      mirror: "false",
      axe: [],
    },
  },
  {
    name: 'US2-11: aria-haspopup="menu" with aria-expanded="false" reports a menu popup, collapsed; aria-pressed="true" reports pressed and "false" not pressed in button mode; on a link-mode host aria-pressed is not applied, and it is applied once the href is removed (FR-009)',
    run: async (driver) => {
      await driver.mount('<ocelle-button id="m" aria-haspopup="menu" aria-expanded="false">Account</ocelle-button> <ocelle-button id="p" aria-pressed="true">Bold</ocelle-button> <ocelle-button id="lp" href="#here" aria-pressed="true">Bold</ocelle-button>');
      const m = await driver.axState("m", control);
      const pressed = (await driver.axState("p", control)).pressed;
      await driver.setAttribute("p", "aria-pressed", "false");
      const released = (await driver.axState("p", control)).pressed;
      const link = { pressed: (await driver.axState("lp", control)).pressed, inner: await inner(driver, "lp"), host: await hostPair(driver, "lp", "aria-pressed") };
      await driver.setAttribute("lp", "href", null);
      const button = { pressed: (await driver.axState("lp", control)).pressed, inner: await inner(driver, "lp") };
      return { menu: { hasPopup: m.hasPopup, expanded: m.expanded }, pressed, released, link, button, axe: await severe(driver) };
    },
    expected: {
      menu: { hasPopup: "menu", expanded: false },
      pressed: "true",
      released: "false",
      link: { pressed: null, inner: { tag: "a", href: "#here" }, host: { host: null, mirror: "true" } },
      button: { pressed: "true", inner: { tag: "button", type: "button", "aria-pressed": "true" } },
      axe: [],
    },
  },
  {
    name: 'US2-12: host rules on ocelle-button:state(expanded), :state(pressed) and :state(current) match while the moved aria-expanded and aria-pressed are "true" and aria-current is any value but "false"; after "false" or "" they no longer match; a link has no pressed state: a link-mode host with aria-pressed="true" never matches :state(pressed) and its inner <a> carries no aria-pressed, and a button-mode host with aria-pressed="true" stops matching once an href makes it a link and matches again once the href is removed (FR-004, FR-009; plan decision 32)',
    run: async (driver) => {
      await driver.mount('<ocelle-button id="e" aria-expanded="true">A</ocelle-button> <ocelle-button id="p" aria-pressed="true">B</ocelle-button> <ocelle-button id="c" aria-current="page">C</ocelle-button> <ocelle-button id="n">N</ocelle-button> <ocelle-button id="lp" href="#here" aria-pressed="true">L</ocelle-button>');
      await driver.rules(stateRules);
      const all = async (): Promise<unknown> => ({ e: await states(driver, "e"), p: await states(driver, "p"), c: await states(driver, "c"), n: await states(driver, "n"), lp: await states(driver, "lp") });
      const set = await all();
      for (const [id, name] of [["e", "aria-expanded"], ["p", "aria-pressed"], ["c", "aria-current"], ["lp", "aria-pressed"]] as const) await driver.setAttribute(id, name, "false");
      const off = await all();
      await driver.setAttribute("c", "aria-current", "step");
      await driver.setAttribute("e", "aria-expanded", "true");
      await driver.setAttribute("lp", "aria-pressed", "true");
      const again = await all();
      await driver.setAttribute("c", "aria-current", "");
      await driver.setAttribute("e", "aria-expanded", "");
      await driver.setAttribute("lp", "aria-pressed", "");
      const empty = await all();
      const link = await inner(driver, "lp");
      await driver.mount('<ocelle-button id="sw" aria-pressed="true">S</ocelle-button>');
      await driver.rules(stateRules);
      const button = { states: await states(driver, "sw"), inner: await inner(driver, "sw") };
      await driver.setAttribute("sw", "href", "#here");
      const linked = { states: await states(driver, "sw"), inner: await inner(driver, "sw") };
      await driver.setAttribute("sw", "href", null);
      const back = { states: await states(driver, "sw"), inner: await inner(driver, "sw") };
      return { set, off, again, empty, link, switched: { button, linked, back }, axe: await severe(driver) };
    },
    expected: {
      set: { e: ["expanded"], p: ["pressed"], c: ["current"], n: [], lp: [] },
      off: { e: [], p: [], c: [], n: [], lp: [] },
      again: { e: ["expanded"], p: [], c: ["current"], n: [], lp: [] },
      empty: { e: [], p: [], c: [], n: [], lp: [] },
      link: { tag: "a", href: "#here" },
      switched: {
        button: { states: ["pressed"], inner: { tag: "button", type: "button", "aria-pressed": "true" } },
        linked: { states: [], inner: { tag: "a", href: "#here" } },
        back: { states: ["pressed"], inner: { tag: "button", type: "button", "aria-pressed": "true" } },
      },
      axe: [],
    },
  },
  {
    name: 'US2-13, copies: after aria-label="Close dialog" (content Close, so the name can come only from the moved label) and aria-current="page" are moved, the host carries data-ocelle-moved-aria-label="Close dialog" and data-ocelle-moved-aria-current="page"; a copy parsed from its outerHTML and a cloneNode(true) copy are each named "Close dialog", report aria-current page, match :state(current) and have neither host attribute; after aria-current="false" the mirror reads "false" and after aria-label="" its mirror is gone (FR-004)',
    run: async (driver) => {
      await driver.mount('<div id="live"><ocelle-button id="b" aria-label="Close dialog" aria-current="page">Close</ocelle-button></div><div id="parsed"></div><div id="cloned"></div>');
      await driver.rules(stateRules);
      const mirrors = { label: await hostPair(driver, "b", "aria-label"), current: await hostPair(driver, "b", "aria-current") };
      await driver.copy("b", "outerHTML", "parsed");
      await driver.copy("b", "clone", "cloned");
      const copy = async (id: string): Promise<unknown> => ({
        name: (await driver.axState(id, control)).name,
        current: (await driver.current(id, control)).attribute,
        states: await states(driver, id),
        host: [await driver.attribute(id, "aria-label"), await driver.attribute(id, "aria-current")],
      });
      const copies = { parsed: await copy("b-parsed"), cloned: await copy("b-cloned") };
      await driver.setAttribute("b", "aria-current", "false");
      await driver.setAttribute("b", "aria-label", "");
      return { mirrors, copies, after: { current: await hostPair(driver, "b", "aria-current"), label: await hostPair(driver, "b", "aria-label") }, axe: await severe(driver) };
    },
    expected: {
      mirrors: { label: { host: null, mirror: "Close dialog" }, current: { host: null, mirror: "page" } },
      copies: {
        parsed: { name: "Close dialog", current: "page", states: ["current"], host: [null, null] },
        cloned: { name: "Close dialog", current: "page", states: ["current"], host: [null, null] },
      },
      after: { current: { host: null, mirror: "false" }, label: { host: null, mirror: null } },
      axe: [],
    },
  },
  {
    name: 'US2-13, morph: a morph that applies the unchanged server markup <ocelle-button aria-label="Close dialog" aria-current="page">Close</ocelle-button> to the live element leaves both mirrors with their values and the inner control named "Close dialog" with aria-current page; a copy through the container\'s innerHTML afterwards is named "Close dialog" with aria-current page; a mirror the host removes, and one it overwrites, read their stored values again (FR-004)',
    run: async (driver) => {
      const server = '<ocelle-button id="m" aria-label="Close dialog" aria-current="page">Close</ocelle-button>';
      await driver.mount(`<div id="live">${server}</div><div id="copied"></div>`);
      await driver.morph("m", server);
      const morphed = {
        label: await hostPair(driver, "m", "aria-label"),
        current: await hostPair(driver, "m", "aria-current"),
        name: (await driver.axState("m", control)).name,
        inner: (await driver.current("m", control)).attribute,
      };
      await driver.copy("live", "innerHTML", "copied");
      const copied = { name: (await driver.axState("m-copied", control)).name, current: (await driver.current("m-copied", control)).attribute };
      await driver.setAttribute("m", "data-ocelle-moved-aria-label", null);
      await driver.setAttribute("m", "data-ocelle-moved-aria-current", "step");
      return {
        morphed,
        copied,
        restored: { label: await driver.attribute("m", "data-ocelle-moved-aria-label"), current: await driver.attribute("m", "data-ocelle-moved-aria-current"), inner: (await driver.current("m", control)).attribute, name: (await driver.axState("m", control)).name },
        axe: await severe(driver),
      };
    },
    expected: {
      morphed: { label: { host: null, mirror: "Close dialog" }, current: { host: null, mirror: "page" }, name: "Close dialog", inner: "page" },
      copied: { name: "Close dialog", current: "page" },
      restored: { label: "Close dialog", current: "page", inner: "page", name: "Close dialog" },
      axe: [],
    },
  },
  {
    name: 'US2-14: title="Close dialog" on the host of <ocelle-button>Save</ocelle-button> is moved: one node with a role other than generic or a name, the button named Save and described "Close dialog", no named generic node for the host, no host title; an icon-only button with title="Close" and no other name is named Close; title="" removes it from the inner control (FR-004, FR-009)',
    run: async (driver) => {
      await driver.mount('<ocelle-button id="b" title="Close dialog">Save</ocelle-button> <ocelle-button id="i" title="Close"><ocelle-icon slot="icon" name="close"></ocelle-icon></ocelle-button>');
      const state = await driver.axState("b", control);
      const first = { nodes: await driver.ax("b"), meaningful: await meaningful(driver, "b"), name: state.name, description: state.description, ...(await hostPair(driver, "b", "title")) };
      const icon = (await driver.axState("i", control)).name;
      const axe = await severe(driver);
      await driver.setAttribute("b", "title", "");
      return { first, icon, axe, cleared: { description: (await driver.axState("b", control)).description, inner: (await inner(driver, "b")).title ?? null, ...(await hostPair(driver, "b", "title")) } };
    },
    expected: {
      first: {
        nodes: [
          { role: "generic", name: "" },
          { role: "button", name: "Save", description: "Close dialog" },
        ],
        meaningful: [{ role: "button", name: "Save", description: "Close dialog" }],
        name: "Save",
        description: "Close dialog",
        host: null,
        mirror: "Close dialog",
      },
      icon: "Close",
      axe: [],
      cleared: { description: "", inner: null, host: null, mirror: null },
    },
  },
  {
    name: 'Edge case, href values: href="" and whitespace only, a javascript: URL and an unparseable "http://[" render button mode (an inner <button>, no href) with no error logged; a data: URL is link mode with the href as written (FR-002)',
    run: async (driver) => {
      await driver.mount(
        '<ocelle-button id="e" href="">A</ocelle-button> <ocelle-button id="w" href="   ">B</ocelle-button> <ocelle-button id="j" href="javascript:alert(1)">C</ocelle-button> <ocelle-button id="u" href="http://[">D</ocelle-button> <ocelle-button id="d" href="data:text/html,x">E</ocelle-button>',
      );
      const ids = ["e", "w", "j", "u", "d"];
      const found = Object.fromEntries(await Promise.all(ids.map(async (id) => [id, { inner: await inner(driver, id), role: (await driver.axState(id, control)).role }] as const)));
      return { found, messages: await driver.messages(), axe: await severe(driver) };
    },
    expected: {
      found: {
        e: { inner: { tag: "button", type: "button" }, role: "button" },
        w: { inner: { tag: "button", type: "button" }, role: "button" },
        j: { inner: { tag: "button", type: "button" }, role: "button" },
        u: { inner: { tag: "button", type: "button" }, role: "button" },
        d: { inner: { tag: "a", href: "data:text/html,x" }, role: "link" },
      },
      messages: [],
      axe: [],
    },
  },
  ...themed("light"),
  ...themed("dark"),
  forced("light"),
  forced("dark"),
];

/**
 * The in-process link bodies (research.md R-11): on the navigation sink's records, which say whether something
 * prevented the link's activation before the sink, with which button and modifiers and to which `href`.
 */
export const linkSinkScenarios: readonly Scenario[] = [
  ...activations.map(
    ({ name, act, trusted }): Scenario => ({
      name: `US2-1 (sink), ${name}: exactly one ocelle-button-activate (bubbles, composed, cancelable, detail {}, target the host at every listener) recorded before exactly one click, and the sink records the click not prevented, to the link's href (FR-023)`,
      run: async (driver) => {
        await driver.mount(`<div id="wrap"><ocelle-button id="b" href="${target}">Projects</ocelle-button></div>`);
        await driver.events("b", ["click", activate]);
        await act(driver, "b");
        const records = await driver.takeEvents();
        const click = summary(records, "click") as Record<string, unknown>;
        return { types: records.map((record) => record.type), activate: summary(records, activate), click: { at: click.at, serials: click.serials, flags: click.flags }, navigations: await driver.navigations(), axe: await severe(driver) };
      },
      expected: {
        types: [...path.map(() => activate), ...path.map(() => "click")],
        activate: { at: path, targets: ["ocelle-button#b"], serials: 1, flags: [{ isTrusted: false, bubbles: true, composed: true, cancelable: true, defaultPrevented: false }], details: ["{}"] },
        click: { at: path, serials: 1, flags: [{ isTrusted: trusted, bubbles: true, composed: true, cancelable: true, defaultPrevented: false }] },
        navigations: [navigation()],
        axe: [],
      },
    }),
  ),
  ...activations.slice(0, 2).map(
    ({ name, act }): Scenario => ({
      name: `US2-1 (sink), cancelled, ${name}: a listener's preventDefault() on ocelle-button-activate cancels the navigation: the click is delivered once with defaultPrevented true and the sink records it prevented (FR-023)`,
      run: async (driver) => {
        await driver.mount(`<div id="wrap"><ocelle-button id="b" href="${target}">Projects</ocelle-button></div>`);
        await driver.events("b", ["click", activate]);
        await driver.preventNext(activate);
        await act(driver, "b");
        const records = await driver.takeEvents();
        return { counts: counts(records, "b"), prevented: [...new Set(records.map((record) => `${record.type} ${String(record.defaultPrevented)}`))], navigations: await driver.navigations() };
      },
      expected: { counts: { click: 1, auxclick: 0, activate: 1 }, prevented: [`${activate} true`, "click true"], navigations: [navigation({ defaultPrevented: true })] },
    }),
  ),
  {
    name: "US2-1 (sink), modifier and middle clicks and Space: a Ctrl, Meta, Shift or Alt click delivers its click and no ocelle-button-activate, and the sink records it not prevented with its flag; a middle click delivers no click and no activate event, and the sink records its auxclick not prevented; Space delivers nothing, while Enter on the same link gives one activate event, one click and one record (FR-023)",
    run: async (driver) => {
      await driver.mount(`<div id="wrap"><ocelle-button id="b" href="${target}">Projects</ocelle-button></div>`);
      await driver.events("b", ["click", "auxclick", activate]);
      const found: Record<string, unknown> = {};
      for (const { modifier } of modifierClicks) {
        await driver.click("b", { modifiers: [modifier] });
        found[modifier] = counts(await driver.takeEvents(), "b");
      }
      await driver.click("b", { button: "middle" });
      found.middle = counts(await driver.takeEvents(), "b");
      await driver.focus("b");
      await driver.press(" ");
      found.space = counts(await driver.takeEvents(), "b");
      await driver.press("Enter");
      found.enter = counts(await driver.takeEvents(), "b");
      return { found, navigations: await driver.navigations() };
    },
    expected: {
      found: {
        ...Object.fromEntries(modifierClicks.map(({ modifier }) => [modifier, { click: 1, auxclick: 0, activate: 0 }])),
        middle: { click: 0, auxclick: 1, activate: 0 },
        space: { click: 0, auxclick: 0, activate: 0 },
        enter: { click: 1, auxclick: 0, activate: 1 },
      },
      navigations: [...modifierClicks.map(({ flag }) => navigation({ [flag]: true })), navigation({ type: "auxclick", button: 1 }), navigation()],
    },
  },
  {
    name: "US2-3 (sink): a plain, Ctrl, Shift, Alt or middle click on a disabled link delivers no click, auxclick or activate event and leaves the sink nothing, while its enabled twin's click gives one click, one activate event and one record (FR-003)",
    run: async (driver) => {
      await driver.mount(`<div id="wrap"><ocelle-button id="d" href="${target}" disabled>Projects</ocelle-button> <ocelle-button id="e" href="${target}">Projects</ocelle-button></div>`);
      await driver.events("d", ["click", "auxclick", activate]);
      await driver.events("e", ["click", "auxclick", activate]);
      for (const options of [{}, { modifiers: ["Control"] as const }, { modifiers: ["Shift"] as const }, { modifiers: ["Alt"] as const }, { button: "middle" as const }]) await driver.click("d", options);
      const disabled = await driver.takeEvents();
      await driver.click("e");
      const enabled = counts(await driver.takeEvents(), "e");
      return { disabled: disabled.length, enabled, navigations: await driver.navigations() };
    },
    expected: { disabled: 0, enabled: { click: 1, auxclick: 0, activate: 1 }, navigations: [navigation()] },
  },
];

/** Where the fixture page is after an action: its page, the new tabs it opened and the server's visits of the target. */
export interface Outcome {
  /** The path of the page's URL (for example `button.html`). */
  readonly page: string;
  /** The paths of the tabs and windows the action opened. */
  readonly tabs: readonly string[];
  /** The requests for `link-target.html` the server saw (a navigation, a new tab or a download each make one). */
  readonly visits: number;
}

/** The fixture's real navigation, as test/browser/button.test.ts implements it. */
export interface Navigation {
  /**
   * Waits until the page has navigated or opened a tab, or until a quiet period has passed with neither, and returns
   * the outcome of the actions since the last call; then closes the new tabs and, if the page navigated, opens the
   * scenario page again, so the next body step mounts afresh.
   */
  outcome(): Promise<Outcome>;
}

/** A fixture link body. */
export interface NavigationScenario {
  readonly name: string;
  readonly run: (driver: Driver, navigation: Navigation) => Promise<unknown>;
  readonly expected: unknown;
}

const home = "button.html";
const stayed: Outcome = { page: home, tabs: [], visits: 0 };
const navigated: Outcome = { page: target, tabs: [], visits: 1 };

/** The fixture link bodies (research.md R-11): real navigation, new tabs and the server's visits. */
export const linkNavigationScenarios: readonly NavigationScenario[] = [
  {
    name: "US2-1 (fixture): a pointer click, Enter on the focused link and the element's click() each navigate the page to the link's href, once",
    run: async (driver, nav) => {
      const found: Record<string, Outcome> = {};
      for (const { name, act } of activations) {
        await driver.mount(`<ocelle-button id="b" href="${target}">Projects</ocelle-button>`);
        await act(driver, "b");
        found[name] = await nav.outcome();
      }
      return found;
    },
    expected: Object.fromEntries(activations.map(({ name }) => [name, navigated])),
  },
  {
    name: "US2-1 (fixture), cancelled: with a listener calling preventDefault() on ocelle-button-activate, a pointer click and Enter leave the page where it is, while the same click without the listener navigates",
    run: async (driver, nav) => {
      const found: Record<string, Outcome> = {};
      for (const { name, act } of activations.slice(0, 2)) {
        await driver.mount(`<ocelle-button id="b" href="${target}">Projects</ocelle-button>`);
        await driver.preventNext(activate);
        await act(driver, "b");
        found[name] = await nav.outcome();
      }
      await driver.mount(`<ocelle-button id="b" href="${target}">Projects</ocelle-button>`);
      await driver.click("b");
      found.uncancelled = await nav.outcome();
      return found;
    },
    expected: { ...Object.fromEntries(activations.slice(0, 2).map(({ name }) => [name, stayed])), uncancelled: navigated },
  },
  {
    name: "US2-1 (fixture), modifier and middle clicks and Space: the browser's default happens: Ctrl and Shift open the target in a new tab or window, Alt downloads it, the middle button opens a new tab, each with the page left where it is and its click delivered without ocelle-button-activate; Meta, which Chromium on Linux does not treat as a link modifier, navigates the page; Space does nothing",
    run: async (driver, nav) => {
      const found: Record<string, unknown> = {};
      for (const [key, options] of [["Control", { modifiers: ["Control"] as const }], ["Shift", { modifiers: ["Shift"] as const }], ["Alt", { modifiers: ["Alt"] as const }], ["middle", { button: "middle" as const }]] as const) {
        await driver.mount(`<div id="wrap"><ocelle-button id="b" href="${target}">Projects</ocelle-button></div>`);
        await driver.events("b", ["click", "auxclick", activate]);
        await driver.click("b", options);
        const outcome = await nav.outcome();
        found[key] = { outcome, counts: counts(await driver.takeEvents(), "b") };
      }
      await driver.mount(`<ocelle-button id="b" href="${target}">Projects</ocelle-button>`);
      await driver.click("b", { modifiers: ["Meta"] });
      found.Meta = await nav.outcome();
      await driver.mount(`<ocelle-button id="b" href="${target}">Projects</ocelle-button>`);
      await driver.focus("b");
      await driver.press(" ");
      found.Space = await nav.outcome();
      return found;
    },
    expected: {
      Control: { outcome: { page: home, tabs: [target], visits: 1 }, counts: { click: 1, auxclick: 0, activate: 0 } },
      Shift: { outcome: { page: home, tabs: [target], visits: 1 }, counts: { click: 1, auxclick: 0, activate: 0 } },
      Alt: { outcome: { page: home, tabs: [], visits: 1 }, counts: { click: 1, auxclick: 0, activate: 0 } },
      middle: { outcome: { page: home, tabs: [target], visits: 1 }, counts: { click: 0, auxclick: 1, activate: 0 } },
      Meta: navigated,
      Space: stayed,
    },
  },
  {
    name: "US2-3 (fixture): a plain, Ctrl, Shift, Alt or middle click on a disabled link navigates nowhere, opens no tab and downloads nothing, while its enabled twin's click navigates",
    run: async (driver, nav) => {
      const found: Record<string, Outcome> = {};
      for (const [key, options] of [["plain", {}], ["Control", { modifiers: ["Control"] as const }], ["Shift", { modifiers: ["Shift"] as const }], ["Alt", { modifiers: ["Alt"] as const }], ["middle", { button: "middle" as const }]] as const) {
        await driver.mount(`<ocelle-button id="d" href="${target}" disabled>Projects</ocelle-button>`);
        await driver.click("d", options);
        found[key] = await nav.outcome();
      }
      await driver.mount(`<ocelle-button id="e" href="${target}">Projects</ocelle-button>`);
      await driver.click("e");
      found.enabled = await nav.outcome();
      return found;
    },
    expected: { plain: stayed, Control: stayed, Shift: stayed, Alt: stayed, middle: stayed, enabled: navigated },
  },
];
