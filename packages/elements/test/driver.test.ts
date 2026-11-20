import { afterEach, describe, expect, it } from "vitest";
import "../src/ocelle-icon.ts";
import { FirstLoadBase, OcelleTestProbe, OcelleTestRegion } from "./fixtures/live-regions.ts";
import { inProcessDriver, timing } from "./in-process.ts";
import type { InsertHow } from "./scenarios/driver.ts";
import { defineDriverHelpers, driverAdditionScenarios } from "./scenarios/driver-additions.ts";

// The driver steps in process (specs/010-feedback-forms T001b; contracts/testing.md § Driver steps, § Forms): each
// step on test-only elements of test/fixtures/live-regions.ts and plain controls, so each test fails without its step.
// `registerFirstLoad` and `readyState` are in-process steps only; the fixture-page steps are
// test/browser/driver.test.ts.
// The driver's own methods, in process, each proven against a plain page (009 research.md R-17; T005, T010).
// `viewport()` resizes the test's iframe from the elements project's 1280 × 800 (vitest.config.ts, since 008). Since
// phase 2 (T010) every method the US1 scenarios use: real keys and chords (`chord()`), a real click at a point
// (`clickAt()`) and wheel, the deep active element, the tab walk, `scrollLeft`, the last keydown's `defaultPrevented`,
// reduced motion, the frame record and the two-frame `settle()`, plus `messages()` and `sheets()` (which 005 added; their plants are in reviews/phase-2/plants.md). The pages are plain
// markup and a shadow host defined below; each test observes the page itself, not through the method it proves.
// test/browser/driver.test.ts proves the fixture driver's.
// The driver additions of 013 phase 1 in process (contracts/checks.md § Driver additions; tasks.md T003): the shared
// bodies of scenarios/driver-additions.ts on the in-process driver, with their helper elements defined in this file's
// frame. The same bodies run on the strict-CSP fixture in test/browser/driver.test.ts.
const driver = inProcessDriver();
// The helper elements of the driver additions of 013 phase 1 (scenarios/driver-additions.ts), defined in this file's
// frame for the shared bodies at the end of this file.
defineDriverHelpers();

function byId(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (found === null) throw new Error(`no #${id}`);
  return found;
}

afterEach(async () => {
  await driver.mount("");
});

afterEach(async () => {
  await driver.reducedMotion("no-preference").catch(() => undefined);
});

/**
 * A shadow host for the shadow targets: an inner `.inner` button and an inner `.scroll` box with wider content, kept
 * out of the tab order (`tabindex="-1"`, so Chromium does not make the overflowing box a tab stop of its own).
 */
class DriverHost extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(".scroll { inline-size: 200px; overflow-x: auto; } .wide { inline-size: 1000px; block-size: 20px; }");
    root.adoptedStyleSheets = [sheet];
    root.innerHTML = '<button class="inner" type="button">Inner</button><div class="scroll" tabindex="-1"><div class="wide"></div></div>';
  }
}
if (customElements.get("driver-host") === undefined) customElements.define("driver-host", DriverHost);

/** The keydowns the window saw, modifiers left out: key, the four modifier flags and whether the event is trusted. */
function recordKeys(): { key: string; alt: boolean; ctrl: boolean; meta: boolean; shift: boolean; trusted: boolean }[] {
  const seen: { key: string; alt: boolean; ctrl: boolean; meta: boolean; shift: boolean; trusted: boolean }[] = [];
  window.addEventListener("keydown", (event) => {
    if (!["Alt", "Control", "Meta", "Shift"].includes(event.key)) seen.push({ key: event.key, alt: event.altKey, ctrl: event.ctrlKey, meta: event.metaKey, shift: event.shiftKey, trusted: event.isTrusted });
  });
  return seen;
}

const plain = { alt: false, ctrl: false, meta: false, shift: false, trusted: true };

describe("insert(containerId, markup, how)", () => {
  const markup = '<ocelle-test-probe id="p" data-x="1"><span>child</span> text</ocelle-test-probe>';
  it.each([
    ["innerHTML", true],
    ["template", true],
    ["domparser", true],
    ["createElement", false],
  ] as const)("%s puts the markup into the container, the element constructed connected: %s", async (how: InsertHow, connected) => {
    await driver.mount('<main id="c"></main>');
    await driver.insert("c", markup, how);
    const probe = document.getElementById("p") as OcelleTestProbe | null;
    expect({ html: byId("c").innerHTML, upgraded: probe instanceof OcelleTestProbe, connected: probe?.constructedConnected, document: probe?.ownerDocument === document }).toEqual({
      html: markup,
      upgraded: true,
      connected,
      document: true,
    });
  });
});

describe("laterTask()", () => {
  it("returns after a message posted before it and a rendering update, so a removal and an insertion are in different tasks", async () => {
    await driver.mount('<main id="c"><span id="s"></span></main>');
    const order: string[] = [];
    const channel = new MessageChannel();
    channel.port1.onmessage = () => order.push("message");
    byId("s").remove();
    channel.port2.postMessage(0);
    requestAnimationFrame(() => order.push("frame"));
    await driver.laterTask();
    order.push("insert");
    expect([...order.slice(0, 2)].sort()).toEqual(["frame", "message"]);
    expect(order.slice(2)).toEqual(["insert"]);
    channel.port1.close();
  });
});

describe("registerFirstLoad(containerId, markup, base)", () => {
  it("mounts the markup with a fresh tag, arms the capture, then defines the tag so the registration upgrades the elements", async () => {
    await driver.mount('<main id="c"></main>');
    const tag = await driver.registerFirstLoad("c", '<ocelle-first-load id="f"></ocelle-first-load><ocelle-first-load id="g"></ocelle-first-load>', FirstLoadBase);
    const elements = [document.getElementById("f"), document.getElementById("g")];
    const snapshots = await driver.liveCapture.stop();
    expect({ fresh: tag.startsWith("ocelle-first-load-"), names: elements.map((each) => each?.localName), upgraded: elements.map((each) => each instanceof FirstLoadBase && each.constructedConnected) }).toEqual({
      fresh: true,
      names: [tag, tag],
      upgraded: [true, true],
    });
    expect({ first: snapshots[0]?.regions ?? null, final: snapshots.at(-1)?.regions.map(({ host, text }) => ({ host, text })) ?? null }).toEqual({
      first: [],
      final: [
        { host: "f", text: "Ready" },
        { host: "g", text: "Ready" },
      ],
    });
  });

  it("takes a new tag each time", async () => {
    await driver.mount('<main id="c"></main>');
    const first = await driver.registerFirstLoad("c", '<ocelle-first-load id="f"></ocelle-first-load>', FirstLoadBase);
    await driver.liveCapture.stop();
    await driver.mount('<main id="c"></main>');
    const second = await driver.registerFirstLoad("c", '<ocelle-first-load id="f"></ocelle-first-load>', FirstLoadBase);
    await driver.liveCapture.stop();
    expect({ defined: [customElements.get(first) !== undefined, customElements.get(second) !== undefined], same: first === second }).toEqual({ defined: [true, true], same: false });
  });
});

describe("readyState(value)", () => {
  it("makes document.readyState read the value until the next mount, and the capture reads it too", async () => {
    await driver.mount('<main id="c"><div id="r" aria-live="polite"></div></main>');
    await driver.readyState("loading");
    const during = document.readyState;
    await driver.liveCapture.start("c");
    byId("r").textContent = "Saved";
    const snapshots = await driver.liveCapture.stop();
    await driver.mount("");
    expect({ during, loaded: [...new Set(snapshots.map((snapshot) => snapshot.loaded))], after: document.readyState }).toEqual({ during: "loading", loaded: [false], after: "complete" });
  });

  it("null gives the real value back", async () => {
    await driver.mount("");
    await driver.readyState("interactive");
    const during = document.readyState;
    await driver.readyState(null);
    expect([during, document.readyState]).toEqual(["interactive", "complete"]);
  });
});

describe("insertInteractive(containerId, markup)", () => {
  it("arms the capture, then inserts while readyState is interactive with the element defined, and returns the insertion's time", async () => {
    await driver.mount('<main id="c"></main>');
    const before = performance.now();
    const at = await driver.insertInteractive("c", '<ocelle-test-probe id="p"></ocelle-test-probe>');
    const after = performance.now();
    const probe = document.getElementById("p") as OcelleTestProbe | null;
    const snapshots = await driver.liveCapture.stop();
    expect({ readyState: probe?.connectedReadyState, defined: probe?.definedWhenConnected, constructedConnected: probe?.constructedConnected }).toEqual({
      readyState: "interactive",
      defined: true,
      constructedConnected: true,
    });
    expect(at).toBeGreaterThanOrEqual(before);
    expect(at).toBeLessThanOrEqual(after);
    expect({ first: snapshots[0]?.hosts ?? null, final: snapshots.at(-1)?.hosts.map(({ host }) => host) ?? null }).toEqual({ first: [], final: ["p"] });
  });
});

describe("after(ms) and the W in force", () => {
  it("returns no earlier than ms after the previous step's end, with the gap it achieved in page milliseconds", async () => {
    await driver.mount('<main id="c"></main>');
    const before = performance.now();
    const gap = await driver.after(100);
    const after = performance.now();
    expect(gap).toBeGreaterThanOrEqual(100);
    expect(Math.abs(after - before - gap)).toBeLessThan(10);
  });

  it("measures from the end of the step before it, not from its own call", async () => {
    await driver.mount('<main id="c"></main>');
    await new Promise((resolve) => setTimeout(resolve, 60));
    const before = performance.now();
    const gap = await driver.after(100);
    const after = performance.now();
    expect(gap).toBeGreaterThanOrEqual(100);
    expect(after - before).toBeLessThan(gap - 40);
  });

  it("the H in force is the hold of the in-process timing constant (specs/010-feedback-forms phase 2)", () => {
    expect(driver.H).toBe(timing.hold);
  });

  it("the W in force is 2 × D of the in-process timing constant, a D of at least two rendering updates and under Chromium's 150 ms", () => {
    expect(driver.W).toEqual({ loaded: 2 * timing.delayLoaded, loading: 2 * timing.delayLoading });
    expect(timing.delayLoaded).toBeGreaterThanOrEqual(34);
    expect(timing.delayLoaded).toBeLessThan(150);
    expect(timing.delayLoading).toBe(timing.delayLoaded);
  });
});

describe("hostRole(id)", () => {
  it("reads the role of a host in the final snapshot of the last capture", async () => {
    await driver.mount('<main id="c"><ocelle-test-alert id="a" role="alert">Alert</ocelle-test-alert><ocelle-test-alert id="s" role="status">Status</ocelle-test-alert></main>');
    await driver.liveCapture.start("c");
    byId("a").textContent = "Changed";
    await driver.liveCapture.stop();
    expect([await driver.hostRole("a"), await driver.hostRole("s")]).toEqual(["alert", "status"]);
  });
});

describe("forms", () => {
  const form = '<form id="f"><input name="title" id="t" value="draft"><input name="note" id="n"><button id="go" name="via" value="button">Go</button></form>';

  it("formData(formId) returns the form's entries", async () => {
    await driver.mount(form);
    expect(await driver.formData("f")).toEqual([
      ["title", "draft"],
      ["note", ""],
    ]);
  });

  it("submit(formId) submits through the form's submitter and returns the entries with the submitter's", async () => {
    await driver.mount(form);
    expect(await driver.submit("f")).toEqual([
      ["title", "draft"],
      ["note", ""],
      ["via", "button"],
    ]);
    expect(document.getElementById("f")).not.toBeNull();
  });

  it("submit(formId) returns null when no submit event fires (a required field empty)", async () => {
    await driver.mount('<form id="f"><input name="title" id="t" required><input name="x" value="1"><button>Go</button></form>');
    const valid = await driver.submit("f");
    (byId("t") as HTMLInputElement).value = "Fix lane";
    expect({ empty: valid, filled: await driver.submit("f") }).toEqual({
      empty: null,
      filled: [
        ["title", "Fix lane"],
        ["x", "1"],
      ],
    });
  });

  it("after a key step, submit(formId) takes that step's submission, or null when it made none", async () => {
    await driver.mount('<form id="f"><input name="title" id="t" value="Fix lane"></form>');
    await driver.pressOn("t", "Enter");
    const one = await driver.submit("f");
    await driver.mount('<form id="f"><input name="title" id="t" value="Fix lane"><input name="other" id="o"></form>');
    await driver.pressOn("t", "Enter");
    expect({ one, two: await driver.submit("f") }).toEqual({ one: [["title", "Fix lane"]], two: null });
  });

  it("reset(formId) resets the form", async () => {
    await driver.mount(form);
    (byId("t") as HTMLInputElement).value = "Fix lane";
    await driver.reset("f");
    expect((byId("t") as HTMLInputElement).value).toBe("draft");
  });

  it("type(id, text) focuses the control and types the text key by key", async () => {
    await driver.mount('<input id="t">');
    const inputs: string[] = [];
    byId("t").addEventListener("input", () => inputs.push((byId("t") as HTMLInputElement).value));
    await driver.type("t", "Fix {lane}");
    expect({ value: (byId("t") as HTMLInputElement).value, inputs: inputs.length, focused: document.activeElement?.id }).toEqual({ value: "Fix {lane}", inputs: 10, focused: "t" });
  });

  it("press(id, key) focuses the element and presses the key", async () => {
    await driver.mount('<input id="t" value="ab">');
    const keys: string[] = [];
    byId("t").addEventListener("keydown", (event) => keys.push(event.key));
    await driver.pressOn("t", "End");
    await driver.pressOn("t", "Backspace");
    expect({ keys, value: (byId("t") as HTMLInputElement).value, focused: document.activeElement?.id }).toEqual({ keys: ["End", "Backspace"], value: "a", focused: "t" });
  });

  it("blur() moves focus away from the focused element, through shadow roots", async () => {
    await driver.mount('<ocelle-test-field id="f"></ocelle-test-field>');
    byId("f").focus();
    const inner = byId("f").shadowRoot?.querySelector("input");
    const blurred: string[] = [];
    inner?.addEventListener("blur", () => blurred.push("input"));
    const focused = document.activeElement?.id;
    await driver.blur();
    expect({ focused, blurred, active: document.activeElement }).toEqual({ focused: "f", blurred: ["input"], active: document.body });
  });

  it("click(id, at) clicks at that point of the element's box", async () => {
    await driver.mount('<button id="b" class="wide">Wide button</button>');
    await driver.rules("#b { width: 200px; height: 40px; }");
    const points: { x: number; y: number }[] = [];
    byId("b").addEventListener("click", (event) => {
      const rect = byId("b").getBoundingClientRect();
      points.push({ x: Math.round(event.clientX - rect.x), y: Math.round(event.clientY - rect.y) });
    });
    await driver.clickPoint("b", { x: 150, y: 30 });
    expect(points).toEqual([{ x: 150, y: 30 }]);
  });

  it("focusPath() lists the focused element through shadow roots", async () => {
    await driver.mount('<ocelle-test-field id="f"></ocelle-test-field><input id="t">');
    const empty = await driver.focusChain();
    byId("f").focus();
    expect({ empty, field: await driver.focusChain() }).toEqual({ empty: [], field: ["ocelle-test-field#f", "input"] });
  });
});

// The phase 2 steps (specs/010-feedback-forms T011): `batch`, `property`, `computedIn`, `contentBox`, `firstLoad` and
// `defineSecond`, each on test-only elements and plain markup, so each test fails without its step.
describe("the phase 2 steps", () => {
  it("batch(operations) runs every operation in order in one task: one MutationObserver delivery holds all their records", async () => {
    await driver.mount('<main id="c"><span id="s">old</span><input id="i"><div id="from"><b id="m">moved</b></div><div id="to"></div><i id="r">gone</i></main>');
    const deliveries: number[] = [];
    const observer = new MutationObserver((records) => deliveries.push(records.length));
    observer.observe(byId("c"), { childList: true, characterData: true, attributes: true, subtree: true });
    await driver.batch([
      { op: "insert", container: "c", markup: '<p id="new">fresh</p>' },
      { op: "text", id: "s", text: "new" },
      { op: "attribute", id: "s", name: "data-x", value: "1" },
      { op: "property", id: "i", name: "value", value: "typed" },
      { op: "move", id: "m", to: "to" },
      { op: "remove", id: "r" },
      { op: "focus", id: "i" },
    ]);
    observer.disconnect();
    expect({
      deliveries,
      inserted: document.getElementById("new")?.textContent ?? null,
      text: byId("s").textContent,
      attribute: byId("s").getAttribute("data-x"),
      value: (byId("i") as HTMLInputElement).value,
      moved: byId("m").parentElement?.id ?? null,
      removed: document.getElementById("r"),
      focused: document.activeElement?.id ?? null,
    }).toEqual({ deliveries: [6], inserted: "fresh", text: "new", attribute: "1", value: "typed", moved: "to", removed: null, focused: "i" });
  });

  it("property(id, name) reads a property as the page has it", async () => {
    await driver.mount('<input id="i" value="x" type="checkbox" checked>');
    expect([await driver.property("i", "value"), await driver.property("i", "checked"), await driver.property("i", "tabIndex")]).toEqual(["x", true, 0]);
  });

  it("computedIn(id, inner, property) reads a computed value in the element's shadow root, and \"\" without the element", async () => {
    await driver.mount('<ocelle-test-region id="r"></ocelle-test-region>');
    expect([await driver.computedIn("r", "div", "display"), await driver.computedIn("r", "p", "display")]).toEqual(["block", ""]);
  });

  it("contentBox(id, inner) is the shadow element's border box less its borders and padding", async () => {
    await driver.mount('<ocelle-test-field id="f"></ocelle-test-field>');
    const box = await driver.box("f", "input");
    const input = byId("f").shadowRoot?.querySelector("input");
    const style = input === null || input === undefined ? null : getComputedStyle(input);
    const px = (property: string): number => Number.parseFloat(style?.getPropertyValue(property) ?? "0");
    const content = await driver.contentBox("f", "input");
    expect(content).toEqual({
      x: box.x + px("border-left-width") + px("padding-left"),
      y: box.y + px("border-top-width") + px("padding-top"),
      width: box.width - px("border-left-width") - px("padding-left") - px("padding-right") - px("border-right-width"),
      height: box.height - px("border-top-width") - px("padding-top") - px("padding-bottom") - px("border-bottom-width"),
    });
    expect(content.width).toBeGreaterThan(0);
  });

  it("firstLoad(containerId, markup, tag) mounts the markup with a fresh subclass of tag's class upgraded by its registration, the capture armed", async () => {
    await driver.mount('<main id="c"></main>');
    await driver.firstLoad("c", '<ocelle-first-load id="f"></ocelle-first-load>', "ocelle-test-probe");
    const found = document.getElementById("f");
    const snapshots = await driver.liveCapture.stop();
    expect({
      upgraded: found instanceof OcelleTestProbe,
      fresh: found?.localName.startsWith("ocelle-first-load-") ?? false,
      connected: found instanceof OcelleTestProbe && found.constructedConnected,
      captured: snapshots.length > 0,
    }).toEqual({ upgraded: true, fresh: true, connected: true, captured: true });
  });

  it("defineSecond(tag) defines a free tag and leaves a defined tag's first class in place without throwing", async () => {
    const unused = `ocelle-test-second-${String(Math.round(performance.now()))}`;
    await driver.defineSecond(unused);
    await driver.defineSecond("ocelle-test-region");
    expect({ defined: customElements.get(unused) !== undefined, kept: customElements.get("ocelle-test-region") === OcelleTestRegion }).toEqual({ defined: true, kept: true });
  });
});

// The phase 3 step `call` (specs/010-feedback-forms phase 3 review round 1, R1-06): a missing method is an error of
// the scenario, not a result.
describe("call(id, method, ...args)", () => {
  it("calls the element's method with the arguments and returns its plain result", async () => {
    await driver.mount('<input id="i" value="draft">');
    expect([await driver.call("i", "checkValidity"), await driver.call("i", "getAttribute", "value"), await driver.call("i", "focus")]).toEqual([true, "draft", null]);
  });

  it("rejects when the element has no such method, rather than reading undefined", async () => {
    await driver.mount('<input id="i">');
    await expect(driver.call("i", "noSuchMethod")).rejects.toThrow("call: #i has no method noSuchMethod");
  });
});

describe("the in-process driver", () => {
  it("viewport(width, height) sets the page's innerWidth and innerHeight", async () => {
    await driver.viewport(1280, 800);
    const wide = [window.innerWidth, window.innerHeight];
    await driver.viewport(320, 640);
    expect([wide, [window.innerWidth, window.innerHeight]]).toEqual([
      [1280, 800],
      [320, 640],
    ]);
  });

  it.each([
    { key: "ArrowLeft", seen: { key: "ArrowLeft", ...plain } },
    { key: "ArrowRight", seen: { key: "ArrowRight", ...plain } },
    { key: "Home", seen: { key: "Home", ...plain } },
    { key: "End", seen: { key: "End", ...plain } },
    { key: "Alt+ArrowLeft", seen: { key: "ArrowLeft", ...plain, alt: true } },
    { key: "Ctrl+ArrowRight", seen: { key: "ArrowRight", ...plain, ctrl: true } },
    { key: "Meta+ArrowRight", seen: { key: "ArrowRight", ...plain, meta: true } },
    { key: "Shift+ArrowRight", seen: { key: "ArrowRight", ...plain, shift: true } },
  ])("chord($key) sends one trusted keydown of the key with exactly its modifiers", async ({ key, seen }) => {
    await driver.mount('<button id="a" type="button">A</button>');
    document.getElementById("a")?.focus();
    const keys = recordKeys();
    await driver.chord(key);
    expect(keys).toEqual([seen]);
  });

  it("chord(Tab) and chord(Shift+Tab) move focus with real input, so the focused button matches :focus-visible", async () => {
    await driver.mount('<button id="a" type="button">A</button><button id="b" type="button">B</button>');
    document.getElementById("a")?.focus();
    await driver.chord("Tab");
    const forward = { id: document.activeElement?.id, visible: document.activeElement?.matches(":focus-visible") };
    await driver.chord("Shift+Tab");
    expect([forward, { id: document.activeElement?.id, visible: document.activeElement?.matches(":focus-visible") }]).toEqual([
      { id: "b", visible: true },
      { id: "a", visible: true },
    ]);
  });

  it("clickAt(target, point) clicks at that point of the box with a trusted event, on a light-DOM and a shadow target, and a clicked button does not match :focus-visible", async () => {
    await driver.mount('<button id="a" type="button">A</button><div id="pad"></div><driver-host id="h"></driver-host>');
    await driver.rules("#pad { inline-size: 100px; block-size: 40px; }");
    const clicks: { target: string; x: number; y: number; trusted: boolean }[] = [];
    document.addEventListener("click", (event) => {
      const target = event.composedPath()[0] as Element;
      const box = target.getBoundingClientRect();
      clicks.push({ target: target.id === "" ? target.className : target.id, x: Math.round(event.clientX - box.left), y: Math.round(event.clientY - box.top), trusted: event.isTrusted });
    });
    await driver.clickAt("pad", { x: 30, y: 10 });
    await driver.clickAt({ id: "h", inner: ".inner" }, { x: 4, y: 4 });
    await driver.clickAt("a", { x: 2, y: 2 });
    expect({ clicks, focused: document.activeElement?.id, visible: document.activeElement?.matches(":focus-visible") }).toEqual({
      clicks: [
        { target: "pad", x: 30, y: 10, trusted: true },
        { target: "inner", x: 4, y: 4, trusted: true },
        { target: "a", x: 2, y: 2, trusted: true },
      ],
      focused: "a",
      visible: false,
    });
  });

  it("wheel(target, deltaX) sends a trusted wheel event over the target that scrolls it deltaX to the right, on a light-DOM and a shadow target", async () => {
    await driver.mount('<div id="box"><div id="wide"></div></div><driver-host id="h"></driver-host>');
    await driver.rules("#box { inline-size: 200px; overflow-x: auto; } #wide { inline-size: 1000px; block-size: 20px; }");
    const wheels: { target: string; deltaX: number; trusted: boolean }[] = [];
    document.addEventListener("wheel", (event) => wheels.push({ target: (event.composedPath()[0] as Element).className || (event.composedPath()[0] as Element).id, deltaX: event.deltaX, trusted: event.isTrusted }));
    await driver.wheel("box", 120);
    await driver.wheel({ id: "h", inner: ".scroll" }, 80);
    expect({ wheels, scrollLeft: [document.getElementById("box")?.scrollLeft, document.getElementById("h")?.shadowRoot?.querySelector(".scroll")?.scrollLeft] }).toEqual({
      wheels: [
        { target: "wide", deltaX: 120, trusted: true },
        { target: "wide", deltaX: 80, trusted: true },
      ],
      scrollLeft: [120, 80],
    });
  });

  it("call(id, name) calls the element's method with no argument, then settles: focus() of a button focuses it, and the call returns after at least two animation frames (009 phase 4)", async () => {
    await driver.mount('<button id="a" type="button">A</button><button id="b" type="button">B</button>');
    let frames = 0;
    const count = (): void => {
      frames += 1;
      requestAnimationFrame(count);
    };
    requestAnimationFrame(count);
    await driver.call("b", "focus");
    expect({ active: document.activeElement?.id, settled: frames >= 2 }).toEqual({ active: "b", settled: true });
  });

  it("deepActive() names the deep active element: a shadow node under its host's id, a light-DOM element by id, else body", async () => {
    await driver.mount('<button id="a" type="button">A</button><driver-host id="h"></driver-host><span id="plain"></span>');
    const atRest = await driver.deepActive();
    document.getElementById("a")?.focus();
    const light = await driver.deepActive();
    (document.getElementById("h")?.shadowRoot?.querySelector(".inner") as HTMLElement | null)?.focus();
    expect([atRest, light, await driver.deepActive()]).toEqual(["body", "a", "h >> button.inner"]);
  });

  it("tabWalk(from, to) lists the deep active element after each Tab from `from` to `to`, and with `backward` after each Shift+Tab", async () => {
    await driver.mount('<button id="before" type="button">0</button><button id="b1" type="button">1</button><driver-host id="h"></driver-host><button id="after" type="button">2</button>');
    const forward = await driver.tabWalk("before", "after");
    expect([forward, await driver.tabWalk("after", "before", true)]).toEqual([
      ["b1", "h >> button.inner", "after"],
      ["h >> button.inner", "b1", "before"],
    ]);
  });

  it("focusTarget(target) focuses a light-DOM and a shadow target by script, matching :focus-visible after keyboard input and not after a pointer click", async () => {
    await driver.mount('<button id="a" type="button">A</button><button id="b" type="button">B</button><driver-host id="h"></driver-host>');
    document.getElementById("a")?.focus();
    await driver.chord("Tab");
    await driver.focusTarget({ id: "h", inner: ".inner" });
    const afterKeys = { active: await driver.deepActive(), visible: document.getElementById("h")?.shadowRoot?.activeElement?.matches(":focus-visible") };
    await driver.clickAt("a", { x: 2, y: 2 });
    await driver.focusTarget("b");
    expect([afterKeys, { active: await driver.deepActive(), visible: document.activeElement?.matches(":focus-visible") }]).toEqual([
      { active: "h >> button.inner", visible: true },
      { active: "b", visible: false },
    ]);
  });

  it("scrollLeft(target) reads and setScrollLeft(target, value) writes an instant scroll, on a light-DOM box with smooth scroll-behavior and on a shadow box", async () => {
    await driver.mount('<div id="box"><div id="wide"></div></div><driver-host id="h"></driver-host>');
    await driver.rules("#box { inline-size: 200px; overflow-x: auto; scroll-behavior: smooth; } #wide { inline-size: 1000px; block-size: 20px; }");
    const before = [await driver.scrollLeft("box"), await driver.scrollLeft({ id: "h", inner: ".scroll" })];
    const at: number[] = [];
    document.getElementById("box")?.addEventListener("scroll", () => at.push(document.getElementById("box")?.scrollLeft ?? -1));
    await driver.setScrollLeft("box", 120);
    await driver.setScrollLeft({ id: "h", inner: ".scroll" }, 300);
    expect({
      before,
      after: [await driver.scrollLeft("box"), await driver.scrollLeft({ id: "h", inner: ".scroll" })],
      inner: document.getElementById("h")?.shadowRoot?.querySelector(".scroll")?.scrollLeft,
      scrolls: at,
    }).toEqual({ before: [0, 0], after: [120, 300], inner: 300, scrolls: [120] });
  });

  it("lastKeyPrevented() is false after mount, true after a key the page prevents and false after one it does not", async () => {
    await driver.mount('<button id="a" type="button">A</button>');
    const button = document.getElementById("a");
    button?.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") event.preventDefault();
    });
    button?.focus();
    const atMount = await driver.lastKeyPrevented();
    await driver.chord("ArrowRight");
    const prevented = await driver.lastKeyPrevented();
    await driver.chord("ArrowLeft");
    expect([atMount, prevented, await driver.lastKeyPrevented()]).toEqual([false, true, false]);
  });

  it("reducedMotion(mode) switches prefers-reduced-motion between reduce and no-preference", async () => {
    await driver.mount("<p>motion</p>");
    await driver.reducedMotion("reduce");
    const on = [matchMedia("(prefers-reduced-motion: reduce)").matches, matchMedia("(prefers-reduced-motion: no-preference)").matches];
    await driver.reducedMotion("no-preference");
    expect([on, [matchMedia("(prefers-reduced-motion: reduce)").matches, matchMedia("(prefers-reduced-motion: no-preference)").matches]]).toEqual([
      [true, false],
      [false, true],
    ]);
  });

  it("frameRecord(target, read) records the reading at the start, each keydown and the reading in every frame after, until stop()", async () => {
    await driver.mount('<div id="box" tabindex="0"><div id="wide"></div></div>');
    await driver.rules("#box { inline-size: 200px; overflow-x: auto; } #wide { inline-size: 1000px; block-size: 20px; }");
    const box = document.querySelector<HTMLElement>("#box") ?? document.body;
    box.addEventListener("keydown", (event) => {
      event.preventDefault();
      box.scrollLeft += 40;
    });
    box.focus();
    const recorder = await driver.frameRecord("box", { property: "scrollLeft" });
    await driver.chord("ArrowRight");
    const record = await recorder.stop();
    const frames = record.filter((each) => !each.startsWith("resize: "));
    const key = frames.indexOf("keydown");
    expect({ first: record[0], keys: frames.filter((each) => each === "keydown").length, before: [...new Set(frames.slice(0, key))], after: [...new Set(frames.slice(key + 1))], frames: frames.length - key - 1 >= 2, resizes: record.filter((each) => each.startsWith("resize: ")) }).toEqual({
      first: "0",
      keys: 1,
      before: ["0"],
      after: ["40"],
      frames: true,
      resizes: ["resize: 0"],
    });
  });

  it('frameRecord(target, read) reads computed styles and attributes, and records "resize: <reading>" in each callback of its ResizeObserver on the target', async () => {
    await driver.mount('<div id="box"></div>');
    await driver.rules("#box { inline-size: 200px; block-size: 10px; }");
    const width = await driver.frameRecord("box", { computed: "inline-size" });
    const attribute = await driver.frameRecord("box", { attribute: "data-state" });
    await driver.style("box", "inline-size", "120px");
    await driver.setAttribute("box", "data-state", "on");
    const [widths, states] = [await width.stop(), await attribute.stop()];
    expect({ widths: [widths[0], widths.at(-1)], states: [states[0], states.at(-1)], resizes: widths.filter((each) => each.startsWith("resize: ")) }).toEqual({ widths: ["200px", "120px"], states: ["null", "on"], resizes: ["resize: 200px", "resize: 120px"] });
  });

  it("frameRecord(target, read) with `of` reads another element, and its ResizeObserver runs after one the page registered before, in the same delivery", async () => {
    await driver.mount('<div id="box"></div><p id="note"></p>');
    await driver.rules("#box { inline-size: 200px; block-size: 10px; }");
    const box = document.getElementById("box");
    const note = document.getElementById("note");
    new ResizeObserver(([entry]) => note?.setAttribute("data-width", String(entry?.contentRect.width))).observe(box as Element);
    await driver.settle();
    const recorder = await driver.frameRecord("box", { attribute: "data-width", of: "note" });
    await driver.style("box", "inline-size", "120px");
    expect((await recorder.stop()).filter((each) => each.startsWith("resize: "))).toEqual(["resize: 200", "resize: 120"]);
  });

  it("computedOf(target, property) reads the computed style of a light-DOM and of a shadow target", async () => {
    await driver.mount('<div id="box"></div><driver-host id="h"></driver-host>');
    await driver.rules("#box { inline-size: 150px; }");
    expect([await driver.computedOf("box", "inline-size"), await driver.computedOf({ id: "h", inner: ".scroll" }, "inline-size"), await driver.computedOf({ id: "h", inner: ".scroll" }, "overflow-x")]).toEqual(["150px", "200px", "auto"]);
  });

  it("settle() waits at least two animation frames, then for every ocelle-* element to render", async () => {
    await driver.mount('<ocelle-icon id="i"></ocelle-icon>');
    let frames = 0;
    const count = (): void => {
      frames += 1;
      requestAnimationFrame(count);
    };
    requestAnimationFrame(count);
    (document.getElementById("i") as unknown as { name: string }).name = "close";
    await driver.settle();
    expect({ frames: frames >= 2, drawn: (document.getElementById("i")?.shadowRoot?.querySelector("svg")?.children.length ?? 0) > 0 }).toEqual({ frames: true, drawn: true });
  });

  it("messages() lists the console messages since the last mount, and a mount starts a new list", async () => {
    await driver.mount("<p>one</p>");
    console.warn("before the mount");
    await driver.mount("<p>two</p>");
    console.warn("driver message");
    expect(await driver.messages()).toEqual(["console.warn: driver message"]);
  });

  it("sheets(selector) counts the adopted sheets per shadow root, the distinct sheets and the <style> elements", async () => {
    await driver.mount('<ocelle-icon name="close"></ocelle-icon><ocelle-icon name="menu"></ocelle-icon><driver-host></driver-host>');
    expect([await driver.sheets("ocelle-icon"), await driver.sheets("driver-host, ocelle-icon")]).toEqual([
      { elements: 2, perRoot: [1], distinct: 1, styleElements: 0 },
      { elements: 3, perRoot: [1], distinct: 2, styleElements: 0 },
    ]);
  });
});

describe("the driver additions, in process (013 T003)", () => {
  it.each(driverAdditionScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
