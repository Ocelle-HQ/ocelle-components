import { afterEach, describe, expect, it } from "vitest";
import { FirstLoadBase, OcelleTestProbe } from "./fixtures/live-regions.ts";
import { inProcessDriver, timing } from "./in-process.ts";
import type { InsertHow } from "./scenarios/driver.ts";

// The driver steps in process (specs/010-feedback-forms T001b; contracts/testing.md § Driver steps, § Forms): each
// step on test-only elements of test/fixtures/live-regions.ts and plain controls, so each test fails without its step.
// `registerFirstLoad` and `readyState` are in-process steps only; the fixture-page steps are
// test/browser/driver.test.ts.
const driver = inProcessDriver();

function byId(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (found === null) throw new Error(`no #${id}`);
  return found;
}

afterEach(async () => {
  await driver.mount("");
});

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
    await driver.press("t", "Enter");
    const one = await driver.submit("f");
    await driver.mount('<form id="f"><input name="title" id="t" value="Fix lane"><input name="other" id="o"></form>');
    await driver.press("t", "Enter");
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
    await driver.press("t", "End");
    await driver.press("t", "Backspace");
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
    await driver.click("b", { x: 150, y: 30 });
    expect(points).toEqual([{ x: 150, y: 30 }]);
  });

  it("focusPath() lists the focused element through shadow roots", async () => {
    await driver.mount('<ocelle-test-field id="f"></ocelle-test-field><input id="t">');
    const empty = await driver.focusPath();
    byId("f").focus();
    expect({ empty, field: await driver.focusPath() }).toEqual({ empty: [], field: ["ocelle-test-field#f", "input"] });
  });
});
