// The shared bodies of the harness self-tests (012 research.md R-11; contracts/checks.md § Test harness; tasks.md T001,
// T002, T004 and T005): each new driver method on plain test pages, a native `<button>` and `<a href>`, and, where a
// method reads or acts on a shadow element (`inner`), `ocelle-test-host` (test/fixtures/test-host.ts: an inner
// `<button class="icon-row">` with a 1 px border, the light-DOM text its label). Every body runs in both harnesses:
// in process (test/harness/*.test.ts) and on the strict-CSP fixture (test/browser/harness.test.ts), on `button.html`
// or, for a body with the test host, `slot.html`. The expected values are written by hand: the colours are the ones the
// body's own page rules set, the records what the DOM specification says each dispatch carries.
//
// Every "does not" outcome shares its body with the positive outcome it guards: unhovered with hovered, unpressed with
// pressed, a disabled button's missing click with the `aria-disabled` button's click (which only `force: true`
// delivers), an empty `activeInner` with the focused inner control, a second `takeEvents()` with the first, an
// unprevented dispatch with a prevented one, a control without states with one carrying each state, no
// `aria-current` with one, and a scope with no finding with a page that has one.
import type { AxeResult, AxState, Driver, EventRecord } from "./driver.ts";

/** A harness body, and whether its page needs the test host. */
export interface HarnessScenario {
  /** The method under test and what the body checks. */
  readonly name: string;
  readonly host: boolean;
  readonly run: (driver: Driver) => Promise<unknown>;
  readonly expected: unknown;
}

/** The page rules of the native button: a colour and a ground of its own, another ground on hover, another colour while pressed. */
const buttonRules = "#plain { color: rgb(4, 4, 4); background-color: rgb(1, 1, 1); } #plain:hover { background-color: rgb(2, 2, 2); } #plain:active { color: rgb(3, 3, 3); }";

/** A native button, an `aria-disabled` one, a disabled one and a paragraph to move the pointer to, away from them. */
const buttons = '<button id="plain" type="button">Plain</button> <button id="dim" type="button" aria-disabled="true">Dim</button> <button id="off" type="button" disabled>Off</button><p id="away">Away from the buttons</p>';

/** The test host with a label, and a paragraph away from it. */
const host = '<ocelle-test-host id="h">Label</ocelle-test-host><p id="away">Away from the host</p>';

/** The test host's page rules: a colour on the host, another while hovered, another while pressed (its inner button inherits it). */
const hostRules = "#h { color: rgb(6, 6, 6); } #h:hover { color: rgb(5, 5, 5); } #h:active { color: rgb(7, 7, 7); }";

/** The records of one trusted click on `#plain` inside `#wrap`, at each listener from the button out to `window`. */
function clickRecords(serial: number, defaultPrevented: boolean): EventRecord[] {
  return ["button#plain", "div#wrap", "body", "html", "document", "window"].map((at) => ({
    type: "click",
    at,
    target: "button#plain",
    isTrusted: true,
    bubbles: true,
    composed: true,
    cancelable: true,
    defaultPrevented,
    detail: 1,
    serial,
  }));
}

/** The types of the records taken at the listener `at`, in order. */
function typesAt(records: readonly EventRecord[], at: string): string[] {
  return records.filter((record) => record.at === at).map((record) => record.type);
}

/** The interaction methods (T001): focus, press, click, hover, pointer down and up, tab order, the active inner control, computed with `inner`. */
export const interactionScenarios: readonly HarnessScenario[] = [
  {
    name: "hover(id) puts the pointer on a native button, which takes its :hover ground, and hovering away ends it (computed)",
    host: false,
    run: async (driver) => {
      await driver.mount(buttons);
      await driver.rules(buttonRules);
      await driver.hover("away");
      const before = await driver.computed("plain", "background-color");
      await driver.hover("plain");
      const hovered = await driver.computed("plain", "background-color");
      await driver.hover("away");
      return { before, hovered, after: await driver.computed("plain", "background-color") };
    },
    expected: { before: "rgb(1, 1, 1)", hovered: "rgb(2, 2, 2)", after: "rgb(1, 1, 1)" },
  },
  {
    name: "pointerDown(id) presses a native button, which takes its :active colour, pointerUp(id) releases it, and the press and release give one click",
    host: false,
    run: async (driver) => {
      await driver.mount(buttons);
      await driver.rules(buttonRules);
      await driver.hover("away");
      await driver.events("plain", ["pointerdown", "pointerup", "click"]);
      const before = await driver.computed("plain", "color");
      await driver.pointerDown("plain");
      const pressed = await driver.computed("plain", "color");
      await driver.pointerUp("plain");
      const released = await driver.computed("plain", "color");
      return { before, pressed, released, types: typesAt(await driver.takeEvents(), "button#plain") };
    },
    expected: { before: "rgb(4, 4, 4)", pressed: "rgb(3, 3, 3)", released: "rgb(4, 4, 4)", types: ["pointerdown", "pointerup", "click"] },
  },
  {
    name: "click(id) always forces: the aria-disabled button gets its click, the disabled one gets none, the plain one gets its click",
    host: false,
    run: async (driver) => {
      await driver.mount(buttons);
      for (const id of ["plain", "dim", "off"]) await driver.events(id, ["click"]);
      await driver.click("dim");
      await driver.click("off");
      await driver.click("plain");
      const records = await driver.takeEvents();
      return { dim: typesAt(records, "button#dim"), off: typesAt(records, "button#off"), plain: typesAt(records, "button#plain") };
    },
    expected: { dim: ["click"], off: [], plain: ["click"] },
  },
  {
    name: 'click(id, { button: "middle" }) sends a middle click, which a native button gets as auxclick and not as click, beside a left click',
    host: false,
    run: async (driver) => {
      await driver.mount(buttons);
      await driver.events("plain", ["click", "auxclick"]);
      await driver.click("plain", { button: "middle" });
      await driver.click("plain");
      return typesAt(await driver.takeEvents(), "button#plain");
    },
    expected: ["auxclick", "click"],
  },
  {
    name: 'focus(id) focuses a native button and press("Enter"), press(" ") and press("Enter", ["Shift"]) each activate it once',
    host: false,
    run: async (driver) => {
      await driver.mount(buttons);
      await driver.events("plain", ["click"]);
      await driver.press("Enter");
      const unfocused = typesAt(await driver.takeEvents(), "button#plain");
      await driver.focus("plain");
      await driver.press("Enter");
      await driver.press(" ");
      await driver.press("Enter", ["Shift"]);
      const records = (await driver.takeEvents()).filter((record) => record.at === "button#plain");
      return { unfocused, focused: records.map((record) => ({ type: record.type, isTrusted: record.isTrusted, detail: record.detail })) };
    },
    expected: {
      unfocused: [],
      focused: [
        { type: "click", isTrusted: true, detail: 0 },
        { type: "click", isTrusted: true, detail: 0 },
        { type: "click", isTrusted: true, detail: 0 },
      ],
    },
  },
  {
    name: "tabOrder() is the Tab order from the start of the page and tabOrder({ reverse: true }) the Shift+Tab order from its end, the inner control of a host included and tabindex=-1 left out",
    host: true,
    run: async (driver) => {
      await driver.mount('<button id="first" type="button">First</button> <ocelle-test-host id="h">Label</ocelle-test-host> <a id="link" href="#here">Link</a> <button id="skipped" type="button" tabindex="-1">Skipped</button> <button id="last" type="button">Last</button>');
      return { forward: await driver.tabOrder(), reverse: await driver.tabOrder({ reverse: true }) };
    },
    expected: {
      forward: [["button#first"], ["ocelle-test-host#h", "button"], ["a#link"], ["button#last"]],
      reverse: [["button#last"], ["a#link"], ["ocelle-test-host#h", "button"], ["button#first"]],
    },
  },
  {
    name: 'click(id, { inner }) clicks the shadow button of a host, which activeInner(id) then names, null before; a native button has no inner control',
    host: true,
    run: async (driver) => {
      await driver.mount(`${host}<button id="plain" type="button">Plain</button>`);
      const before = await driver.activeInner("h");
      await driver.click("h", { inner: "button" });
      const after = await driver.activeInner("h");
      await driver.focus("plain");
      return { before, after, native: await driver.activeInner("plain"), host: await driver.activeInner("h") };
    },
    expected: { before: null, after: "button", native: null, host: null },
  },
  {
    name: "computed(id, property, inner) reads the host's shadow button (its 1 px border), computed(id, property) the host (no border)",
    host: true,
    run: async (driver) => {
      await driver.mount(host);
      return { inner: await driver.computed("h", "border-top-width", "button"), host: await driver.computed("h", "border-top-width") };
    },
    expected: { inner: "1px", host: "0px" },
  },
  {
    name: "hover(id, { inner }) and pointerDown(id, { inner }) act on the host's shadow button: the host takes :hover, then :active, and the inner button inherits each",
    host: true,
    run: async (driver) => {
      await driver.mount(host);
      await driver.rules(hostRules);
      await driver.hover("away");
      const before = [await driver.computed("h", "color"), await driver.computed("h", "color", "button")];
      await driver.hover("h", { inner: "button" });
      const hovered = [await driver.computed("h", "color"), await driver.computed("h", "color", "button")];
      await driver.pointerDown("h", { inner: "button" });
      const pressed = [await driver.computed("h", "color"), await driver.computed("h", "color", "button")];
      await driver.pointerUp("h");
      await driver.hover("away");
      return { before, hovered, pressed, after: await driver.computed("h", "color", "button") };
    },
    expected: {
      before: ["rgb(6, 6, 6)", "rgb(6, 6, 6)"],
      hovered: ["rgb(5, 5, 5)", "rgb(5, 5, 5)"],
      pressed: ["rgb(7, 7, 7)", "rgb(7, 7, 7)"],
      after: "rgb(6, 6, 6)",
    },
  },
  // 012 phase 2 (US1-2, US1-3, US1-15, US1-17): a click at a position, and the element's own click().
  {
    name: "click(id, { position }) clicks at that point of the element's box: inside a 100 × 100 box, 10 px in lands on the 20 × 20 button there, 4 px inside the bottom-right corner on the box",
    host: false,
    run: async (driver) => {
      await driver.mount('<div id="box"><button id="corner" type="button">C</button></div>');
      await driver.rules("#box { inline-size: 100px; block-size: 100px; } #corner { display: block; inline-size: 20px; block-size: 20px; margin: 0; padding: 0; }");
      await driver.events("corner", ["click"]);
      await driver.click("box", { position: { x: 10, y: 10 } });
      await driver.click("box", { position: { x: 96, y: 96 } });
      return (await driver.takeEvents()).filter((record) => record.at === "div#box").map((record) => record.target);
    },
    expected: ["button#corner", "div#box"],
  },
  {
    name: "callClick(id) calls the element's own click(): an enabled native button gets one untrusted click, a disabled one none",
    host: false,
    run: async (driver) => {
      await driver.mount(buttons);
      for (const id of ["plain", "off"]) await driver.events(id, ["click"]);
      await driver.callClick("off");
      await driver.callClick("plain");
      const records = await driver.takeEvents();
      return { off: typesAt(records, "button#off"), plain: records.filter((record) => record.at === "button#plain").map((record) => ({ type: record.type, isTrusted: record.isTrusted })) };
    },
    expected: { off: [], plain: [{ type: "click", isTrusted: false }] },
  },
];

/** The event recorder (T002): records at the element, its ancestors, `document` and `window`, a serial per dispatch, `preventNext`. */
export const eventScenarios: readonly HarnessScenario[] = [
  {
    name: "events(id, types) records each dispatch at the element, its ancestors, document and window with its fields; two dispatches give two serials, takeEvents() empties the record",
    host: false,
    run: async (driver) => {
      await driver.mount('<div id="wrap"><button id="plain" type="button">Plain</button></div>');
      await driver.events("plain", ["click"]);
      await driver.click("plain");
      await driver.click("plain");
      return { first: await driver.takeEvents(), second: await driver.takeEvents() };
    },
    expected: { first: [...clickRecords(1, false), ...clickRecords(2, false)], second: [] },
  },
  {
    name: "preventNext(type) makes the next dispatch of the type defaultPrevented at every listener, and only the next",
    host: false,
    run: async (driver) => {
      await driver.mount('<div id="wrap"><button id="plain" type="button">Plain</button></div>');
      await driver.events("plain", ["click"]);
      await driver.preventNext("click");
      await driver.click("plain");
      await driver.click("plain");
      return driver.takeEvents();
    },
    expected: [...clickRecords(1, true), ...clickRecords(2, false)],
  },
  {
    name: "events(id, types) on a host gives the host as the target at every listener for a click on its shadow button, one serial for the one dispatch",
    host: true,
    run: async (driver) => {
      await driver.mount(host);
      await driver.events("h", ["click"]);
      await driver.click("h", { inner: "button" });
      return driver.takeEvents();
    },
    expected: ["ocelle-test-host#h", "body", "html", "document", "window"].map((at) => ({
      type: "click",
      at,
      target: "ocelle-test-host#h",
      isTrusted: true,
      bubbles: true,
      composed: true,
      cancelable: true,
      defaultPrevented: false,
      detail: 1,
      serial: 1,
    })),
  },
];

/** A control's accessibility state with nothing set beyond its role and name. */
function plainState(role: string, name: string): AxState {
  return { role, name, description: "", disabled: false, expanded: null, pressed: null, hasPopup: null, busy: false, focusable: true, controls: [] };
}

/** The accessibility states and relations, `current` and reduced motion (T004). */
export const axScenarios: readonly HarnessScenario[] = [
  {
    name: "axState(id) gives role, name, description, disabled, expanded, pressed, hasPopup, busy, focusable and controls of native controls carrying those states, beside one carrying none",
    host: false,
    run: async (driver) => {
      await driver.mount(
        '<button id="toggle" type="button" aria-pressed="true">Bold</button> <button id="menu" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="panel">Options</button> <button id="described" type="button" aria-describedby="hint">Save</button> <button id="off" type="button" disabled>Off</button> <button id="busy" type="button" aria-busy="true">Saving</button> <button id="plain" type="button">Plain</button> <a id="link" href="#here">Here</a><p id="hint">Writes the file</p><div id="panel">Panel</div>',
      );
      const observed: Record<string, AxState> = {};
      for (const id of ["toggle", "menu", "described", "off", "busy", "plain", "link"]) observed[id] = await driver.axState(id);
      return observed;
    },
    expected: {
      toggle: { ...plainState("button", "Bold"), pressed: "true" },
      menu: { ...plainState("button", "Options"), expanded: false, hasPopup: "menu", controls: ["panel"] },
      described: { ...plainState("button", "Save"), description: "Writes the file" },
      off: { ...plainState("button", "Off"), disabled: true, focusable: false },
      busy: { ...plainState("button", "Saving"), busy: true },
      plain: plainState("button", "Plain"),
      link: plainState("link", "Here"),
    },
  },
  {
    name: "axState(id, inner) reads the host's shadow button, named by the host's light-DOM text",
    host: true,
    run: async (driver) => {
      await driver.mount(host);
      return driver.axState("h", "button");
    },
    expected: plainState("button", "Label"),
  },
  {
    name: "current(id) reads aria-current from the DOM, attribute and reflection, beside a link without it; current(id, inner) reads a shadow element",
    host: true,
    run: async (driver) => {
      await driver.mount(`<a id="here" href="#here" aria-current="page">Here</a> <a id="there" href="#there">There</a> ${host}`);
      return { here: await driver.current("here"), there: await driver.current("there"), inner: await driver.current("h", "button") };
    },
    expected: { here: { attribute: "page", property: "page" }, there: { attribute: null, property: null }, inner: { attribute: null, property: null } },
  },
  {
    name: 'reducedMotion("reduce") makes (prefers-reduced-motion: reduce) match, "no-preference" ends it, and forcedColors("none") resets it too',
    host: false,
    run: async (driver) => {
      await driver.mount(buttons);
      await driver.rules("#plain { color: rgb(4, 4, 4); } @media (prefers-reduced-motion: reduce) { #plain { color: rgb(8, 8, 8); } }");
      const before = await driver.computed("plain", "color");
      await driver.reducedMotion("reduce");
      const reduced = await driver.computed("plain", "color");
      await driver.reducedMotion("no-preference");
      const ended = await driver.computed("plain", "color");
      await driver.reducedMotion("reduce");
      await driver.forcedColors("none");
      return { before, reduced, ended, reset: await driver.computed("plain", "color") };
    },
    expected: { before: "rgb(4, 4, 4)", reduced: "rgb(8, 8, 8)", ended: "rgb(4, 4, 4)", reset: "rgb(4, 4, 4)" },
  },
];

/**
 * The driver's axe run (T005): 006's rule selection, every impact. Without the selection, axe-core 4.14.0's wcag2a,
 * wcag2aa and best-practice rules give this page `landmark-one-main`, `page-has-heading-one` and `region` (moderate)
 * beside `button-name` (measured in Chromium 153, 2026-11-14).
 */
export const axeScenarios: readonly HarnessScenario[] = [
  {
    name: "axe() gives button-name for an unnamed button, and nothing else on a page with no landmark and no heading (006's selection leaves out region, landmark-one-main and page-has-heading-one)",
    host: false,
    run: async (driver) => {
      await driver.mount('<button id="unnamed" type="button"></button> <a id="link" href="#here">Here</a><p>Text outside any landmark.</p>');
      return driver.axe();
    },
    expected: [{ id: "button-name", impact: "critical", kind: "violation", targets: ["#unnamed"] } satisfies AxeResult],
  },
  {
    name: "axe(scope) audits only the element with that id: nothing for a named button's wrapper, button-name for the unnamed button's",
    host: false,
    run: async (driver) => {
      await driver.mount('<div id="named"><button type="button">Named</button></div><div id="bare"><button id="unnamed" type="button"></button></div>');
      return { named: await driver.axe("named"), bare: await driver.axe("bare") };
    },
    expected: { named: [], bare: [{ id: "button-name", impact: "critical", kind: "violation", targets: ["#unnamed"] }] },
  },
];
