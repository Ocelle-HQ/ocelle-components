// The shared bodies of the driver additions of 013 phase 1 (contracts/checks.md § Driver additions; tasks.md T003):
// `viewport`, `scrollWidth`, `layout`, `clipboardCopy`, `move`, `text` and `open`, with the readers the facts bodies use
// (`boxes`, `styles`, `structure`). They pin the harnesses, not an element: plain elements and the small helper
// elements of defineDriverHelpers() stand in, defined by each harness before the bodies run (in process by a call, on
// the fixture through `page.evaluate`, so the function is self-contained). Run in process by test/driver.test.ts and
// on the strict-CSP fixture by test/browser/driver.test.ts.
// - `layout` returns on the second frame for a still element, reads a change made in an animation frame that a
//   `ResizeObserver` callback scheduled (the deferred measure pass's shape, R-02), never the geometry before it, and
//   rejects after 10 frames for an element that never settles;
// - `clipboardCopy` returns the text a user copy put on the clipboard, unchanged (a U+200B in it is kept, so the US1-4 plant
//   that inserts one is seen);
// - `text` makes a `characterData` change, not a `childList` one.
// Phase 2 (tasks.md T023) adds `pressTab` and `focused`: Tab moves focus in the page's sequential order, into a shadow
// root and out of it, and `focused` names the innermost focused element through shadow roots, or null on the body.
// Phase 3 (tasks.md T037) adds `animations`, `remove`, `frames` and `replace`: `animations` lists a shadow element's
// CSS animation and, once started, its CSS transition with their part, property, play state and end time; `remove`
// takes an element out of the page; `frames` waits that many animation frames; `replace` swaps an element for parsed
// markup in one mutation; `changeAttributes` sets and removes attributes in one task, so an observer sees them in one
// delivery; `textOf` reads a shadow element's text; `rendered` tells shown light-DOM text from text that is not
// rendered (an unslotted child of a shadow host); `dispatched` (review round 1) lists the events script dispatches on an
// element and in its shadow root during a change, and not those on another element. `reducedMotion` and the AX value
// properties have their own tests (test/commands.test.ts), and the loading-episode reset of `mount` is a progress body (scenarios/progress.ts), since it needs the element.
import type { Scenario } from "./icon.ts";

/**
 * Defines the helper elements of these bodies (self-contained, for `page.evaluate`):
 * - `ocelle-test-deferred`: observes its own size; when its inline size is at least 400 px it sets `data-wide` in an
 *   animation frame scheduled from the callback, and removes it below;
 * - `ocelle-test-restless`: toggles `data-wide` on every animation frame while connected;
 * - `ocelle-test-recorder`: records the types of the mutation records of its own subtree in `data-records`;
 * - `ocelle-test-shadow`: an open shadow root holding `<dl><dt>Term</dt><dd><slot></slot></dd></dl>`;
 * - `ocelle-test-focus`: an open shadow root holding `<button id="inner">Inner</button>` and an unnamed `<button>`;
 * - `ocelle-test-animated` (phase 3): an open shadow root holding `<div part="dot">`, which runs a 10 s CSS animation
 *   of `transform` and has a 10 s `opacity` transition that `data-fade` on the host starts, from a stylesheet adopted
 *   by the shadow root (the CSSOM, which the fixture's CSP does not govern);
 * - `ocelle-test-frames` (phase 3): counts its own animation frames in `data-count` while connected;
 * - `ocelle-test-attributes` (phase 3): records in `data-deliveries` the number of attribute records of each
 *   delivery of its `MutationObserver`, attribute `data-x` only;
 * - `ocelle-test-emitter` (phase 3 review round 1): an open shadow root holding `<span>`; each change of its
 *   `data-ping` attribute dispatches `ocelle-test-ping` (a composed CustomEvent) on the host, then `inner-ping` on the
 *   `<span>`.
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
  customElements.define(
    "ocelle-test-focus",
    class extends HTMLElement {
      constructor() {
        super();
        const root = this.attachShadow({ mode: "open" });
        root.innerHTML = '<button id="inner">Inner</button><button>Unnamed</button>';
      }
    },
  );
  customElements.define(
    "ocelle-test-animated",
    class extends HTMLElement {
      constructor() {
        super();
        const root = this.attachShadow({ mode: "open" });
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(
          "@keyframes ocelle-test-slide { from { transform: translateX(0px); } to { transform: translateX(10px); } } " +
            "[part=dot] { inline-size: 10px; block-size: 10px; animation: ocelle-test-slide 10s linear 1; transition: opacity 10s linear; } " +
            ":host([data-fade]) [part=dot] { opacity: 0; }",
        );
        root.adoptedStyleSheets = [sheet];
        root.innerHTML = '<div part="dot"></div>';
      }
    },
  );
  customElements.define(
    "ocelle-test-attributes",
    class extends HTMLElement {
      readonly #observer = new MutationObserver((records) => {
        this.dataset.deliveries = [...(this.dataset.deliveries ?? "").split(" ").filter((each) => each !== ""), String(records.length)].join(" ");
      });

      connectedCallback(): void {
        this.#observer.observe(this, { attributes: true, attributeFilter: ["data-x"] });
      }
    },
  );
  customElements.define(
    "ocelle-test-frames",
    class extends HTMLElement {
      connectedCallback(): void {
        const step = (): void => {
          if (!this.isConnected) return;
          this.dataset.count = String(Number(this.dataset.count ?? "0") + 1);
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    },
  );
  customElements.define(
    "ocelle-test-emitter",
    class extends HTMLElement {
      static readonly observedAttributes = ["data-ping"];

      constructor() {
        super();
        this.attachShadow({ mode: "open" }).innerHTML = "<span>Inner</span>";
      }

      attributeChangedCallback(): void {
        this.dispatchEvent(new CustomEvent("ocelle-test-ping", { bubbles: true, composed: true }));
        this.shadowRoot?.querySelector("span")?.dispatchEvent(new Event("inner-ping", { bubbles: true }));
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
    name: "clipboardCopy: a user copy of a paragraph puts its text on the clipboard unchanged, a U+200B in it kept",
    run: async (driver) => {
      await driver.mount('<p id="plain">abc def</p><p id="spaced">abc​def</p>');
      return { plain: await driver.clipboardCopy("plain"), spaced: await driver.clipboardCopy("spaced") };
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
  {
    name: "pressTab and focused: nothing is focused at first; Tab moves through a button, into a shadow root's two buttons (the second without an id) and on to a link, each read through the shadow root",
    run: async (driver) => {
      await driver.mount('<button id="first">First</button><ocelle-test-focus id="host"></ocelle-test-focus><p>Text</p><a id="link" href="#link">Link</a>');
      const sequence: (string | null)[] = [await driver.focused()];
      for (let press = 0; press < 4; press += 1) {
        await driver.pressTab();
        sequence.push(await driver.focused());
      }
      return sequence;
    },
    expected: [null, "first", "inner", "<button>", "link"],
  },
  {
    name: "animations: a shadow part's CSS animation of transform is read with its part, play state and end time, and a transition of opacity started on it is read beside it, the host itself animating nothing",
    run: async (driver) => {
      await driver.mount('<ocelle-test-animated id="animated"></ocelle-test-animated>');
      await driver.frames(2);
      const shape = (list: Awaited<ReturnType<typeof driver.animations>>): unknown => list.map(({ currentTime, ...rest }) => ({ ...rest, timed: currentTime !== null && currentTime >= 0 }));
      const before = shape(await driver.animations("animated"));
      await driver.setAttribute("animated", "data-fade", "");
      await driver.frames(2);
      return { before, after: shape(await driver.animations("animated")) };
    },
    expected: {
      before: [{ kind: "CSSAnimation", part: "dot", property: "transform", playState: "running", endTime: 10000, timed: true }],
      after: [
        { kind: "CSSTransition", part: "dot", property: "opacity", playState: "running", endTime: 10000, timed: true },
        { kind: "CSSAnimation", part: "dot", property: "transform", playState: "running", endTime: 10000, timed: true },
      ],
    },
  },
  {
    name: "remove: an element removed from the page is no longer in the accessibility tree, which held it before",
    run: async (driver) => {
      await driver.mount('<button id="gone" type="button">Gone</button><button id="kept" type="button">Kept</button>');
      const before = await driver.ax("gone");
      await driver.remove("gone");
      return { before, after: await driver.ax("gone"), kept: await driver.ax("kept") };
    },
    expected: { before: [{ role: "button", name: "Gone" }], after: [], kept: [{ role: "button", name: "Kept" }] },
  },
  {
    name: "frames: waiting 3 frames lets an element that counts its frames count at least 3 more",
    run: async (driver) => {
      await driver.mount('<ocelle-test-frames id="frames"></ocelle-test-frames>');
      await driver.frames(1);
      const before = Number(await driver.attribute("frames", "data-count"));
      await driver.frames(3);
      const after = Number(await driver.attribute("frames", "data-count"));
      return { counted: before >= 1, atLeastThree: after - before >= 3 };
    },
    expected: { counted: true, atLeastThree: true },
  },
  {
    name: "replace: an element replaced by two parsed paragraphs gives one childList record, the old element gone and the new ones in its place",
    run: async (driver) => {
      await driver.mount('<ocelle-test-recorder id="recorder"><p id="old">Old</p><p id="after">After</p></ocelle-test-recorder>');
      await driver.replace("old", '<p id="new-1">New one</p><p id="new-2">New two</p>');
      return {
        records: await driver.attribute("recorder", "data-records"),
        old: await driver.ax("old"),
        text: (await driver.axSubtree("recorder")).filter((node) => node.role === "StaticText").map((node) => node.name),
      };
    },
    expected: { records: "childList", old: [], text: ["New one", "New two", "After"] },
  },
  {
    name: "changeAttributes: an attribute set and then removed in one call reaches an observer as one delivery of two records, and the attribute is gone",
    run: async (driver) => {
      await driver.mount('<ocelle-test-attributes id="watched"></ocelle-test-attributes>');
      await driver.changeAttributes("watched", [
        ["data-x", "1"],
        ["data-x", null],
      ]);
      return { deliveries: await driver.attribute("watched", "data-deliveries"), x: await driver.attribute("watched", "data-x") };
    },
    expected: { deliveries: "2", x: null },
  },
  {
    name: "textOf and rendered: a shadow element's text is read, a missing one is null; light-DOM text a shadow root does not slot has no rect and no innerText, beside slotted text that has both",
    run: async (driver) => {
      await driver.mount('<ocelle-test-shadow id="slotted">Shown</ocelle-test-shadow><ocelle-test-focus id="unslotted">Hidden</ocelle-test-focus>');
      return {
        term: await driver.textOf("slotted", "dt"),
        missing: await driver.textOf("slotted", "table"),
        slotted: await driver.rendered("slotted"),
        unslotted: await driver.rendered("unslotted"),
      };
    },
    expected: { term: "Term", missing: null, slotted: { innerText: "Shown", rects: 1 }, unslotted: { innerText: "", rects: 0 } },
  },
  {
    name: "property: a property's value is read as the page holds it, a number as a number and an unset one as undefined",
    run: async (driver) => {
      await driver.mount('<input id="field" type="number" value="7">');
      return { valueAsNumber: await driver.property("field", "valueAsNumber"), value: await driver.property("field", "value"), missing: await driver.property("field", "notAProperty") };
    },
    expected: { valueAsNumber: 7, value: "7", missing: undefined },
  },
  {
    name: "dispatched: the events script dispatches on an element and in its shadow root while a change runs are listed in order, not those on another element, and a change that dispatches none on it gives an empty list",
    run: async (driver) => {
      await driver.mount('<ocelle-test-emitter id="watched"></ocelle-test-emitter><ocelle-test-emitter id="other"></ocelle-test-emitter>');
      const during = await driver.dispatched("watched", async () => {
        await driver.setAttribute("watched", "data-ping", "1");
        await driver.setAttribute("other", "data-ping", "1");
      });
      const quiet = await driver.dispatched("watched", () => driver.setAttribute("other", "data-ping", "2"));
      const other = await driver.dispatched("other", () => driver.setAttribute("other", "data-ping", "3"));
      return { during, quiet, other };
    },
    expected: { during: ["ocelle-test-ping", "inner-ping"], quiet: [], other: ["ocelle-test-ping", "inner-ping"] },
  },
];
