// The shared bodies of the driver additions of 013 phase 1 (contracts/checks.md § Driver additions; tasks.md T003):
// `viewport`, `scrollWidth`, `layout`, `copy`, `move`, `text` and `open`, with the readers the facts bodies use
// (`boxes`, `styles`, `structure`). They pin the harnesses, not an element: plain elements and the small helper
// elements of defineDriverHelpers() stand in, defined by each harness before the bodies run (in process by a call, on
// the fixture through `page.evaluate`, so the function is self-contained). Run in process by test/driver.test.ts and
// on the strict-CSP fixture by test/browser/driver.test.ts.
// - `layout` returns on the second frame for a still element, reads a change made in an animation frame that a
//   `ResizeObserver` callback scheduled (the deferred measure pass's shape, R-02), never the geometry before it, and
//   rejects after 10 frames for an element that never settles;
// - `copy` returns the text a user copy put on the clipboard, unchanged (a U+200B in it is kept, so the US1-4 plant
//   that inserts one is seen);
// - `text` makes a `characterData` change, not a `childList` one.
import type { Scenario } from "./icon.ts";

/**
 * Defines the helper elements of these bodies (self-contained, for `page.evaluate`):
 * - `ocelle-test-deferred`: observes its own size; when its inline size is at least 400 px it sets `data-wide` in an
 *   animation frame scheduled from the callback, and removes it below;
 * - `ocelle-test-restless`: toggles `data-wide` on every animation frame while connected;
 * - `ocelle-test-recorder`: records the types of the mutation records of its own subtree in `data-records`;
 * - `ocelle-test-shadow`: an open shadow root holding `<dl><dt>Term</dt><dd><slot></slot></dd></dl>`.
 */
export function defineDriverHelpers(): void {
  if (customElements.get("ocelle-test-deferred") !== undefined) return;
  customElements.define(
    "ocelle-test-deferred",
    class extends HTMLElement {
      readonly #observer = new ResizeObserver(([entry]) => {
        const wide = (entry?.contentRect.width ?? 0) >= 400;
        requestAnimationFrame(() => {
          this.toggleAttribute("data-wide", wide);
        });
      });

      connectedCallback(): void {
        this.#observer.observe(this);
      }

      disconnectedCallback(): void {
        this.#observer.disconnect();
      }
    },
  );
  customElements.define(
    "ocelle-test-restless",
    class extends HTMLElement {
      connectedCallback(): void {
        const step = (): void => {
          if (!this.isConnected) return;
          this.toggleAttribute("data-wide");
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    },
  );
  customElements.define(
    "ocelle-test-recorder",
    class extends HTMLElement {
      readonly #observer = new MutationObserver((records) => {
        this.dataset.records = [...(this.dataset.records ?? "").split(" ").filter((each) => each !== ""), ...records.map((record) => record.type)].join(" ");
      });

      connectedCallback(): void {
        this.#observer.observe(this, { childList: true, characterData: true, subtree: true });
      }
    },
  );
  customElements.define(
    "ocelle-test-shadow",
    class extends HTMLElement {
      constructor() {
        super();
        const root = this.attachShadow({ mode: "open" });
        root.innerHTML = "<dl><dt>Term</dt><dd><slot></slot></dd></dl>";
      }
    },
  );
}

const helperRules =
  "ocelle-test-deferred, ocelle-test-restless { display: block; block-size: 10px; } " +
  "ocelle-test-deferred[data-wide], ocelle-test-restless[data-wide] { block-size: 100px; } " +
  "#narrow { inline-size: 300px; } #hidden-parent { display: none; } #wide { inline-size: 1000px; block-size: 10px; } body:has(#wide) { margin: 0; }";

export const driverAdditionScenarios: readonly Scenario[] = [
  {
    name: "layout: a still element settles on the second frame, the earliest the wait compares",
    run: async (driver) => {
      await driver.mount('<p id="still">Still</p>');
      return await driver.layout("still");
    },
    expected: 2,
  },
  {
    name: "layout: a change made in an animation frame scheduled from a ResizeObserver callback is read, not the geometry before it, after at least 2 frames",
    run: async (driver) => {
      await driver.mount('<div id="narrow"><ocelle-test-deferred id="deferred"></ocelle-test-deferred></div>');
      await driver.rules(helperRules);
      await driver.layout("deferred");
      const before = (await driver.box("deferred")).height;
      await driver.style("narrow", "inline-size", "500px");
      const frames = await driver.layout("deferred");
      return { before, after: (await driver.box("deferred")).height, atLeastTwo: frames >= 2 };
    },
    expected: { before: 10, after: 100, atLeastTwo: true },
  },
  {
    name: "layout: an element whose box changes on every frame makes the wait reject after 10 frames",
    run: async (driver) => {
      await driver.mount('<ocelle-test-restless id="restless"></ocelle-test-restless>');
      await driver.rules(helperRules);
      return await driver.layout("restless").then(
        (frames) => `settled after ${String(frames)} frames`,
        (error: unknown) => (error instanceof Error ? error.message : String(error)).replace(/^.*?(layout: [^\n]*)[\s\S]*$/, "$1"),
      );
    },
    expected: "layout: #restless did not settle in 10 frames",
  },
  {
    name: "viewport and scrollWidth: a 400 × 300 viewport gives a scroll width of 400, and a 1000 px box in a body with no margin gives 1000",
    run: async (driver) => {
      await driver.mount('<p id="text">Text</p>');
      await driver.viewport(400, 300);
      const narrow = await driver.scrollWidth();
      await driver.mount('<div id="wide"></div>');
      await driver.rules(helperRules);
      const wide = await driver.scrollWidth();
      await driver.viewport(1280, 800);
      return { narrow, wide, restored: await driver.scrollWidth() };
    },
    expected: { narrow: 400, wide: 1000, restored: 1280 },
  },
  {
    name: "copy: a user copy of a paragraph puts its text on the clipboard unchanged, a U+200B in it kept",
    run: async (driver) => {
      await driver.mount('<p id="plain">abc def</p><p id="spaced">abc​def</p>');
      return { plain: await driver.copy("plain"), spaced: await driver.copy("spaced") };
    },
    expected: { plain: "abc def", spaced: "abc​def" },
  },
  {
    name: "move: an element moved into a hidden parent has no box, and moved to the body has one again",
    run: async (driver) => {
      await driver.mount('<p><span id="moving">Moving</span></p><div id="hidden-parent"></div>');
      await driver.rules(helperRules);
      const before = (await driver.box("moving")).width > 0;
      await driver.move("moving", "hidden-parent");
      const hidden = (await driver.box("moving")).width;
      await driver.move("moving", null);
      return { before, hidden, after: (await driver.box("moving")).width > 0 };
    },
    expected: { before: true, hidden: 0, after: true },
  },
  {
    name: "text: the first text node's data changes in place, a characterData record and no childList one, and the element shows the new text",
    run: async (driver) => {
      await driver.mount('<ocelle-test-recorder id="recorder">old<b>bold</b></ocelle-test-recorder>');
      await driver.text("recorder", "new");
      return { records: await driver.attribute("recorder", "data-records"), text: (await driver.axSubtree("recorder")).filter((node) => node.role === "StaticText").map((node) => node.name) };
    },
    expected: { records: "characterData", text: ["new", "bold"] },
  },
  {
    name: "open: a dialog shown as a modal and a popover shown have boxes, which they had not while closed",
    run: async (driver) => {
      await driver.mount('<dialog id="dialog"><p id="in-dialog">In the dialog</p></dialog><div id="popover" popover="manual"><p id="in-popover">In the popover</p></div>');
      const closed = [(await driver.box("in-dialog")).width, (await driver.box("in-popover")).width];
      await driver.open("dialog");
      await driver.open("popover");
      return { closed, open: [(await driver.box("in-dialog")).width > 0, (await driver.box("in-popover")).width > 0] };
    },
    expected: { closed: [0, 0], open: [true, true] },
  },
  {
    name: "structure, boxes and styles read a shadow root: its element tree, every matching box and the computed values of the matches or of the host",
    run: async (driver) => {
      await driver.mount('<ocelle-test-shadow id="shadow">Value</ocelle-test-shadow>');
      return {
        root: await driver.structure("shadow", null),
        dd: await driver.structure("shadow", "dd"),
        missing: await driver.structure("shadow", "table"),
        boxes: (await driver.boxes("shadow", "dt, dd")).map((box) => box.display),
        styles: await driver.styles("shadow", "dt, dd", ["display", "margin-inline-start"]),
        host: await driver.styles("shadow", null, ["display"]),
      };
    },
    expected: {
      root: [{ name: "dl", children: [{ name: "dt", children: [] }, { name: "dd", children: [{ name: "slot", children: [] }] }] }],
      dd: [{ name: "slot", children: [] }],
      missing: [],
      boxes: ["block", "block"],
      styles: [{ display: "block", "margin-inline-start": "0px" }, { display: "block", "margin-inline-start": "40px" }],
      host: [{ display: "inline" }],
    },
  },
];
