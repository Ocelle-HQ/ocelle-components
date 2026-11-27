// The harness self-tests of 018 (research.md R-11; contracts/checks.md § Test harness rows 1, 2, 7 and 8; tasks.md
// T003, T004, T007): one shared body per driver method `main` lacks, run in process (test/harness/animation.test.ts,
// test/harness/text.test.ts, test/harness/layout.test.ts) and on the strict-CSP fixture (test/browser/harness.test.ts).
// No element of the library is involved: the plain stand-in elements below, defined by `defineStatusStandIns` in each
// harness's page, so every observation goes through the driver alone. Each "does not" reading shares its body with the
// positive one it guards. Expected values are written by hand from the stand-ins' own styles: an opacity animation of
// 4000 ms, linear, three iterations (end time 12 000 ms, opacity 0.5 at 2000 ms); a 100 px clipping text box holding a
// 100 px or a 100.1 px inline-block (an overflow of 0.1 px, which layout snaps to 0.09375 px, still above 0); a box that
// grows by 10 px a frame, from 10 px to 130 px, once started.
// Rows 3 to 6 of § Test harness exist on `main` and are used as merged, with no self-test here (operator decision Q4 (a)).
import type { Driver } from "./driver.ts";

/** A self-test body and its expected observation. */
export interface StatusHarnessScenario {
  readonly name: string;
  readonly run: (driver: Driver) => Promise<unknown>;
  readonly expected: unknown;
}

/**
 * Defines the stand-in elements in the page that calls it. Self-contained (the fixture passes it to `page.evaluate`),
 * so it uses nothing from outside its own body, and defines nothing twice. Every style is an adopted sheet, which the
 * fixture's policy allows; no `style` attribute or `<style>` element is written.
 * - `ocelle-harness-pulse`: an open shadow root `<span class="dot"><span part="ring" class="ring"></span></span>`; the
 *   ring animates its opacity from 0 to 1, linear, over 4000 ms, three times; with the host attribute `still` it has
 *   `animation: none`.
 * - `ocelle-harness-clip`: an open shadow root `<span class="text"><slot></slot></span>`, the text box 100 px wide,
 *   `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`; a slotted `<i>` is an inline-block 100 px wide,
 *   100.1 px with the class `over`. The host's `dir` sets the direction.
 * - `ocelle-harness-grow`: an open shadow root `<div class="box">`, 10 px wide; a `ResizeObserver` on the box sets the
 *   property `seen` to its rounded content width at each delivery. With the host attribute `go`, the box grows by
 *   10 px one animation frame after each delivery, up to 130 px (12 steps), so the last value arrives about 12 frames
 *   after `go` is set.
 */
export function defineStatusStandIns(): void {
  if (customElements.get("ocelle-harness-pulse") !== undefined) return;
  const sheet = (text: string): CSSStyleSheet => {
    const made = new CSSStyleSheet();
    made.replaceSync(text);
    return made;
  };
  const pulse = sheet(`
    .dot { position: relative; display: inline-block; inline-size: 8px; block-size: 8px; }
    .ring { position: absolute; inset: 0; opacity: 0; animation-name: ocelle-harness-pulse; animation-duration: 4000ms;
      animation-timing-function: linear; animation-iteration-count: 3; }
    :host([still]) .ring { animation: none; }
    @keyframes ocelle-harness-pulse { from { opacity: 0; } to { opacity: 1; } }
  `);
  customElements.define(
    "ocelle-harness-pulse",
    class extends HTMLElement {
      constructor() {
        super();
        const root = this.attachShadow({ mode: "open" });
        root.adoptedStyleSheets = [pulse];
        root.innerHTML = '<span class="dot"><span part="ring" class="ring"></span></span>';
      }
    },
  );
  const clip = sheet(`
    .text { display: block; inline-size: 100px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    ::slotted(i) { display: inline-block; inline-size: 100px; block-size: 10px; }
    ::slotted(i.over) { inline-size: 100.1px; }
  `);
  customElements.define(
    "ocelle-harness-clip",
    class extends HTMLElement {
      constructor() {
        super();
        const root = this.attachShadow({ mode: "open" });
        root.adoptedStyleSheets = [clip];
        root.innerHTML = '<span class="text"><slot></slot></span>';
      }
    },
  );
  const steps = 12;
  const grow = sheet(
    [".box { inline-size: 10px; block-size: 10px; }", ...Array.from({ length: steps }, (_, index) => `.box.s${String(index + 1)} { inline-size: ${String(10 * (index + 2))}px; }`)].join("\n"),
  );
  customElements.define(
    "ocelle-harness-grow",
    class extends HTMLElement {
      seen: number | undefined;
      #step = 0;

      static get observedAttributes(): string[] {
        return ["go"];
      }

      constructor() {
        super();
        const root = this.attachShadow({ mode: "open" });
        root.adoptedStyleSheets = [grow];
        root.innerHTML = '<div class="box"></div>';
        const box = root.querySelector(".box");
        if (box === null) throw new Error("ocelle-harness-grow: no box");
        new ResizeObserver((entries) => {
          for (const entry of entries) this.seen = Math.round(entry.contentRect.width);
          if (this.hasAttribute("go") && this.#step > 0 && this.#step < steps) requestAnimationFrame(() => {
              this.#advance(box);
            });
        }).observe(box);
      }

      attributeChangedCallback(): void {
        const box = this.shadowRoot?.querySelector(".box");
        if (this.hasAttribute("go") && this.#step === 0 && box !== null && box !== undefined) this.#advance(box);
      }

      #advance(box: Element): void {
        this.#step += 1;
        box.className = `box s${String(this.#step)}`;
      }
    },
  );
}

/** The ring's animation as the stand-in declares it, without its identity and current time. */
const ring = { kind: "CSSAnimation", part: "ring", property: "opacity", playState: "running", iterations: 3, endTime: 12000 };

/** Row 1: the animation record with a stable identity and `iterations` (T003). */
export const animationScenarios: readonly StatusHarnessScenario[] = [
  {
    name: "animationStates(id): a 3-iteration CSS animation in the shadow root reads its iterations, end time and play state; read twice it keeps its identity, another element's animation and a re-created one have new identities; an element whose animation is removed, and one with none, read none",
    run: async (driver) => {
      await driver.mount('<ocelle-harness-pulse id="a"></ocelle-harness-pulse><ocelle-harness-pulse id="b"></ocelle-harness-pulse><ocelle-harness-pulse id="still" still></ocelle-harness-pulse>');
      const shape = (list: Awaited<ReturnType<Driver["animationStates"]>>): unknown =>
        list.map(({ identity, currentTime, ...rest }) => ({ ...rest, identified: typeof identity === "number", timed: currentTime !== null && currentTime >= 0 && currentTime < 12000 }));
      const first = await driver.animationStates("a");
      const again = await driver.animationStates("a");
      const other = await driver.animationStates("b");
      const none = await driver.animationStates("still");
      await driver.setAttribute("a", "still", "");
      const removed = await driver.animationStates("a");
      await driver.setAttribute("a", "still", null);
      const recreated = await driver.animationStates("a");
      const identity = first[0]?.identity;
      return {
        first: shape(first),
        none,
        removed,
        recreated: shape(recreated),
        same: again.length === 1 && again[0]?.identity === identity,
        otherIsNew: other.length === 1 && other[0]?.identity !== identity,
        recreatedIsNew: recreated.length === 1 && recreated[0]?.identity !== identity,
      };
    },
    expected: {
      first: [{ ...ring, identified: true, timed: true }],
      none: [],
      removed: [],
      recreated: [{ ...ring, identified: true, timed: true }],
      same: true,
      otherIsNew: true,
      recreatedIsNew: true,
    },
  },
];

/** Row 2: `seek(id, inner, ms)` (T003). */
export const seekScenarios: readonly StatusHarnessScenario[] = [
  {
    name: "seek(id, inner, ms): seeking the ring to 2000 ms pauses it there, with its keyframe value at that time (opacity 0.5) and the same identity; an unseeked twin runs on near 0; seeking an element with no animation is refused",
    run: async (driver) => {
      await driver.mount('<ocelle-harness-pulse id="a"></ocelle-harness-pulse><ocelle-harness-pulse id="b"></ocelle-harness-pulse><ocelle-harness-pulse id="still" still></ocelle-harness-pulse>');
      const before = await driver.animationStates("a");
      await driver.seek("a", ".ring", 2000);
      const [seeked] = await driver.animationStates("a");
      const [twin] = await driver.animationStates("b");
      const opacity = (await driver.styles("a", ".ring", ["opacity"]))[0]?.opacity;
      const twinOpacity = Number((await driver.styles("b", ".ring", ["opacity"]))[0]?.opacity);
      const refused = await driver.seek("still", ".ring", 2000).then(
        () => "seeked",
        (error: unknown) => (error instanceof Error ? "refused" : "other"),
      );
      return {
        seeked: { currentTime: seeked?.currentTime, playState: seeked?.playState, opacity, same: seeked?.identity === before[0]?.identity },
        twin: { playState: twin?.playState, nearZero: twin?.currentTime !== null && twin?.currentTime !== undefined && twin.currentTime < 1000, faint: twinOpacity < 0.25 },
        refused,
      };
    },
    expected: {
      seeked: { currentTime: 2000, playState: "paused", opacity: "0.5", same: true },
      twin: { playState: "running", nearZero: true, faint: true },
      refused: "refused",
    },
  },
];

/** Row 8: the fractional overflow measure of research.md R-09 (T004). */
export const overflowScenarios: readonly StatusHarnessScenario[] = [
  {
    name: "overflows(target): slotted content 0.1 px wider than its 100 px clipping box overflows, content of exactly 100 px does not, in left-to-right and right-to-left; a long text overflows and a short one does not",
    run: async (driver) => {
      await driver.mount(
        [
          '<ocelle-harness-clip id="over"><i class="over"></i></ocelle-harness-clip>',
          '<ocelle-harness-clip id="fit"><i></i></ocelle-harness-clip>',
          '<ocelle-harness-clip id="rtl-over" dir="rtl"><i class="over"></i></ocelle-harness-clip>',
          '<ocelle-harness-clip id="rtl-fit" dir="rtl"><i></i></ocelle-harness-clip>',
          '<ocelle-harness-clip id="long">Blocked by the review of the mission scheduler</ocelle-harness-clip>',
          '<ocelle-harness-clip id="short">Ok</ocelle-harness-clip>',
        ].join(""),
      );
      const read = (id: string): Promise<boolean> => driver.overflows({ id, inner: ".text" });
      return { over: await read("over"), fit: await read("fit"), rtlOver: await read("rtl-over"), rtlFit: await read("rtl-fit"), long: await read("long"), short: await read("short") };
    },
    expected: { over: true, fit: false, rtlOver: true, rtlFit: false, long: true, short: false },
  },
];

/** Row 7: `settleLayout()` (T007). */
export const layoutScenarios: readonly StatusHarnessScenario[] = [
  {
    name: "settleLayout(): a value a ResizeObserver sets is read at its final value (130) after settleLayout(), while a read after settle() alone is still stale (below 130); with nothing moving it returns with the value unchanged",
    run: async (driver) => {
      await driver.mount('<ocelle-harness-grow id="g"></ocelle-harness-grow>');
      await driver.settleLayout();
      const idle = await driver.property("g", "seen");
      await driver.setAttribute("g", "go", "");
      const afterSettle = await driver.property("g", "seen");
      await driver.settleLayout();
      const settled = await driver.property("g", "seen");
      return { idle, staleAfterSettle: typeof afterSettle === "number" && afterSettle < 130, settled };
    },
    expected: { idle: 10, staleAfterSettle: true, settled: 130 },
  },
];
