// The shared bodies of `ocelle-event-timeline` and `ocelle-timeline-event` (019 spec US2-1 to US2-14, the US2 edge
// cases, FR-001, FR-016, FR-020 to FR-027, FR-052; contracts/ocelle-event-timeline.md, contracts/ocelle-timeline-event.md,
// contracts/checks.md § Oracles; research.md R-08 to R-11; reviews/phase-2/spike.md; tasks.md T030 to T033), run in
// process on the element source (test/event-timeline.test.ts, mutated) and on the strict-CSP fixture with the browser
// build and `base.css` (test/browser/event-timeline.test.ts). Every body mounts with `@ocelle/styles`' base.css and the
// token probe. Lengths and colours are compared with the token's value read from the probe on the same page, never a
// literal; "within 0.5 px" is inclusive everywhere.
//
// Shadow reads go through `read` (one in-page read, `lib`'s helpers first), so a body run against the scaffold, which
// renders nothing, fails on its assertion and not on a missing node. Item texts are the driver's `itemTexts` (R-11).
// Every "does not" is paired with the positive outcome it guards in the same body. The axe clause of US2-1
// (`aria-required-children` and `aria-required-parent`, which axe applies to the explicit roles; spike Q2 (a)) is the
// `axe` gate's on the timeline stories: element tests run no axe.
import type { Driver } from "./driver.ts";
import type { Scenario } from "./icon.ts";
import { evaluate, identifier } from "./data-table.ts";
import { probe } from "./layout.ts";

/** The test page's rules. */
const rules = ['[data-w="200"] { inline-size: 200px; }'].join("\n");

/** Mounts `markup` and the token probe with base.css at `width` × 800, with the test rules, and settles. */
async function page(driver: Driver, markup: string, width = 1280): Promise<void> {
  await driver.viewport(width, 800);
  await driver.mount(`${markup}${probe}`, { base: true });
  await driver.rules(rules);
  await driver.settle();
}

/** An `ocelle-timeline-event`; `attributes` is written as given. */
const ev = (id: string, attributes: string, content: string): string => `<ocelle-timeline-event id="${id}"${attributes === "" ? "" : ` ${attributes}`}>${content}</ocelle-timeline-event>`;

/** An `ocelle-event-timeline`. */
const tl = (id: string, attributes: string, events: readonly string[]): string => `<ocelle-event-timeline id="${id}"${attributes === "" ? "" : ` ${attributes}`}>${events.join("")}</ocelle-event-timeline>`;

/** US2-1's three events. */
const three = [ev("e1", 'time="14:02"', "Mission created"), ev("e2", 'time="14:20"', "Plan approved"), ev("e3", 'time="14:41"', "Review requested")];
const threeTexts = ["14:02 Mission created", "14:20 Plan approved", "14:41 Review requested"];

/**
 * The in-page helpers every read starts with:
 * - `px(token)` and `token(name)`: a length token in px and a colour token's computed colour, from the probe;
 * - `lis(id)`: the `<li>`s of the timeline `id`; `eventOf(li)`: the event assigned to its slot;
 * - `part(event, name)`: the event's `part="time"` or `part="content"`;
 * - `timeOf(event)`: null with no time box, the box's own text, or `slot[<ids>]` for the `time` slot with the ids of
 *   its assigned elements (and ` + <text>` when the box also holds text);
 * - `line(li)`: the part whose first line the marker is centred on (`time` or `content`), within 0.5 px;
 * - `gaps(id)`: per connector, `space-1` when both gaps (dot end to connector start, connector end to next dot start)
 *   equal `--ocelle-space-1` within 0.5 px, else the two figures;
 * - `hits(id)`: per dot, whether `elementFromPoint` at its centre returns the marker.
 */
const lib = `
const $ = (id) => document.getElementById(id);
const shadow = (id) => $(id)?.shadowRoot ?? null;
const probeEl = () => $("probe");
const px = (name) => { const p = probeEl(); p.style.paddingInlineStart = "var(--ocelle-" + name + ")"; const v = Number.parseFloat(getComputedStyle(p).paddingInlineStart); p.style.removeProperty("padding-inline-start"); return v; };
const colourOf = (value) => { const p = probeEl(); p.style.color = value; const v = getComputedStyle(p).color; p.style.removeProperty("color"); return v; };
const token = (name) => colourOf("var(--ocelle-" + name + ")");
const near = (a, b) => Math.abs(a - b) <= 0.5;
const lis = (id) => [...(shadow(id)?.querySelectorAll("ol > li") ?? [])];
const eventOf = (li) => li.querySelector("slot")?.assignedElements()[0] ?? null;
const part = (event, name) => event?.shadowRoot?.querySelector('[part="' + name + '"]') ?? null;
const timeOf = (event) => {
  const box = part(event, "time");
  if (box === null) return null;
  const own = [...box.childNodes].filter((node) => node.nodeType === 3).map((node) => node.data).join("").trim();
  const slot = box.querySelector('slot[name="time"]');
  if (slot === null) return own;
  return "slot[" + slot.assignedNodes().filter((node) => node.nodeType === 1).map((node) => node.id).join(",") + "]" + (own === "" ? "" : " + " + own);
};
const firstLine = (event) => {
  const box = part(event, "time") ?? part(event, "content");
  if (box === null) return null;
  return { part: box.getAttribute("part"), centre: box.getBoundingClientRect().top + Number.parseFloat(getComputedStyle(box).lineHeight) / 2 };
};
const centreY = (element) => { const r = element.getBoundingClientRect(); return r.top + r.height / 2; };
const line = (li) => {
  const first = firstLine(eventOf(li));
  const marker = li.querySelector(".marker");
  if (first === null || marker === null) return "no marker or no line";
  const off = centreY(marker) - first.centre;
  return near(off, 0) ? first.part : "off the " + first.part + " line by " + off.toFixed(2);
};
const gaps = (id) => {
  const items = lis(id);
  const space = px("space-1");
  return items.slice(0, -1).map((li, at) => {
    const connector = li.querySelector(".connector");
    const dot = li.querySelector(".marker");
    const next = items[at + 1].querySelector(".marker");
    if (connector === null || dot === null || next === null) return "missing";
    const c = connector.getBoundingClientRect();
    const start = c.top - dot.getBoundingClientRect().bottom;
    const end = next.getBoundingClientRect().top - c.bottom;
    return near(start, space) && near(end, space) ? "space-1" : "start " + start.toFixed(2) + ", end " + end.toFixed(2);
  });
};
const hits = (id) => lis(id).map((li) => {
  const dot = li.querySelector(".marker");
  if (dot === null) return false;
  const r = dot.getBoundingClientRect();
  return shadow(id).elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === dot;
});
const classes = (id) => lis(id).map((li) => ["has-time", "next-has-time"].filter((name) => li.classList.contains(name)).join(" "));
const rects = (id) => $(id)?.getClientRects().length ?? -1;
`;

/** Runs `body` in the page after `lib` (evaluate's contract: a thrown error comes back as `"error: …"`). */
const read = (driver: Driver, body: string): Promise<unknown> => evaluate(driver, `${lib}\n${body}`);

/** The roles and names of the accessibility subtree of `id`, StaticText left out, `role` or `role name`. */
async function tree(driver: Driver, id: string): Promise<string[]> {
  return (await driver.axSubtree(id)).filter((node) => node.role !== "StaticText").map((node) => (node.name === "" ? node.role : `${node.role} ${node.name}`));
}

/** The names of the `list` nodes of the accessibility subtree of `id`. */
async function lists(driver: Driver, id: string): Promise<string[]> {
  return (await driver.axSubtree(id)).filter((node) => node.role === "list").map((node) => node.name);
}

/** The `StaticText` names of the accessibility subtree of `id`, in tree order. */
async function statics(driver: Driver, id: string): Promise<string[]> {
  return (await driver.axSubtree(id)).filter((node) => node.role === "StaticText").map((node) => node.name);
}

/** The item texts of `id`, with whether each is not empty. */
async function texts(driver: Driver, id: string): Promise<{ readonly texts: string[]; readonly filled: boolean }> {
  const found = await driver.itemTexts(id);
  return { texts: found, filled: found.length > 0 && found.every((text) => text !== "") };
}

/** US2-1 to US2-10 (tasks.md T030). */
export const eventTimelineStoryScenarios: readonly Scenario[] = [
  {
    name: "US2-1 one list named by label, three listitems in source order, item text time then content, no marker or connector node, every marker wrapper and connector aria-hidden (FR-016, FR-020, FR-022)",
    run: async (driver) => {
      await page(driver, tl("t", 'label="Mission history"', three));
      return {
        tree: await tree(driver, "t"),
        items: await texts(driver, "t"),
        hidden: await read(driver, 'const r = shadow("t"); const spans = [...(r?.querySelectorAll(".marker-line, .connector") ?? [])]; return { markerLines: r?.querySelectorAll(".marker-line").length ?? 0, connectors: r?.querySelectorAll(".connector").length ?? 0, all: spans.length > 0 && spans.every((span) => span.getAttribute("aria-hidden") === "true") };'),
      };
    },
    expected: { tree: ["generic", "list Mission history", "listitem", "generic", "listitem", "generic", "listitem", "generic"], items: { texts: threeTexts, filled: true }, hidden: { markerLines: 3, connectors: 2, all: true } },
  },
  {
    name: "US2-2 each dot is --ocelle-size-dot square within 0.5 px and round, centred on its time's line; a connector after each event but the last (FR-021)",
    run: async (driver) => {
      await page(driver, tl("t", 'label="Mission history"', three));
      return read(
        driver,
        `const size = px("size-dot");
return lis("t").map((li) => { const dot = li.querySelector(".marker"); const r = dot?.getBoundingClientRect(); return { dot: r !== undefined && near(r.width, size) && near(r.height, size) ? "size-dot" : r === undefined ? "none" : r.width + " x " + r.height, radius: dot === null ? null : getComputedStyle(dot).borderTopLeftRadius, line: line(li), connector: li.querySelector(".connector") !== null }; });`,
      );
    },
    expected: [
      { dot: "size-dot", radius: "50%", line: "time", connector: true },
      { dot: "size-dot", radius: "50%", line: "time", connector: true },
      { dot: "size-dot", radius: "50%", line: "time", connector: false },
    ],
  },
  {
    name: "US2-3 the time is in --ocelle-font-sans with tabular figures and --ocelle-color-ink-muted, distinct from the content by size or weight; an event with no time has no time box and its item text is its content alone (FR-023)",
    run: async (driver) => {
      await page(driver, tl("t", 'label="Mission history"', [ev("e1", 'time="14:02"', "Mission created"), ev("e2", "", "Plan approved")]));
      return {
        time: await read(
          driver,
          `const time = part($("e1"), "time"); const content = part($("e1"), "content");
if (time === null || content === null) return "no time or content part";
const p = probeEl(); p.style.fontFamily = "var(--ocelle-font-sans)"; const sans = getComputedStyle(p).fontFamily; p.style.removeProperty("font-family");
const t = getComputedStyle(time); const c = getComputedStyle(content);
return { family: t.fontFamily === sans, figures: t.fontVariantNumeric, colour: t.color === token("color-ink-muted"), distinct: t.fontSize !== c.fontSize || t.fontWeight !== c.fontWeight };`,
        ),
        untimed: await read(driver, 'return { time: part($("e2"), "time") !== null, content: part($("e2"), "content") !== null };'),
        items: await texts(driver, "t"),
      };
    },
    expected: { time: { family: true, figures: "tabular-nums", colour: true, distinct: true }, untimed: { time: false, content: true }, items: { texts: ["14:02 Mission created", "Plan approved"], filled: true } },
  },
  {
    name: "US2-4 at 320 px an event's 26-character identifier with wrap=\"anywhere\" stays inside the event and the page does not scroll sideways, and copying gives the identifier unchanged; in a 200 px column, narrower than the identifier, it wraps inside the event (FR-024, FR-009)",
    run: async (driver) => {
      const timeline = (id: string, ident: string): string => tl(id, 'label="Mission history"', [ev(`${id}-e1`, 'time="14:02" wrap="anywhere"', `Deployed <span id="${ident}">${identifier}</span>`), ev(`${id}-e2`, 'time="14:20"', "Plan approved")]);
      await page(driver, `${timeline("t", "ident")}<div data-w="200">${timeline("n", "narrow")}</div>`, 320);
      const shown = await read(
        driver,
        `const of = (event, ident) => { const content = part($(event), "content"); if (content === null) return "no content part";
const rectsOf = [...$(ident).getClientRects()]; const box = content.getBoundingClientRect();
return { lines: new Set(rectsOf.map((r) => Math.round(r.top))).size, inside: rectsOf.length > 0 && rectsOf.every((r) => r.left >= box.left - 0.5 && r.right <= box.right + 0.5), wrap: getComputedStyle(content).overflowWrap }; };
return { wide: of("t-e1", "ident"), narrow: of("n-e1", "narrow") };`,
      );
      return { shown, scrollWidth: await driver.scrollWidth(), copied: await driver.copy("ident") };
    },
    expected: { shown: { wide: { lines: 1, inside: true, wrap: "anywhere" }, narrow: { lines: 2, inside: true, wrap: "anywhere" } }, scrollWidth: 320, copied: identifier },
  },
  {
    name: "US2-5 an event appended, one removed and one hidden after mount: the listitems follow the visible events, the connectors join only visible events, and nothing throws (FR-025)",
    run: async (driver) => {
      await page(driver, tl("t", 'label="Mission history"', three));
      const state = async (): Promise<unknown> => ({ items: (await texts(driver, "t")).texts, gaps: await read(driver, 'return gaps("t");') });
      await driver.append("t", ev("e4", 'time="14:50"', "Merged"));
      const appended = await state();
      await driver.remove("e2");
      const removed = await state();
      await driver.setAttribute("e3", "hidden", "");
      const hidden = await state();
      return { appended, removed, hidden, messages: await driver.messages() };
    },
    expected: {
      appended: { items: [...threeTexts, "14:50 Merged"], gaps: ["space-1", "space-1", "space-1"] },
      removed: { items: ["14:02 Mission created", "14:41 Review requested", "14:50 Merged"], gaps: ["space-1", "space-1"] },
      hidden: { items: ["14:02 Mission created", "14:50 Merged"], gaps: ["space-1"] },
      messages: [],
    },
  },
  {
    name: "US2-6 only the ocelle-timeline-event children are shown and exposed: loose text, a div and an li are neither; the events are (FR-020)",
    run: async (driver) => {
      await page(driver, tl("t", 'label="Mission history"', ["Loose text", '<div id="d">A div</div>', '<li id="l">A list item</li>', ev("e1", 'time="14:02"', "Mission created"), ev("e2", 'time="14:20"', "Plan approved")]));
      return {
        items: await texts(driver, "t"),
        statics: await statics(driver, "t"),
        shown: await read(driver, 'return { div: rects("d"), li: rects("l"), events: [rects("e1") > 0, rects("e2") > 0], loose: [...$("t").childNodes].filter((node) => node.nodeType === 3 && node.data.trim() !== "").map((node) => { const range = document.createRange(); range.selectNodeContents(node); return range.getClientRects().length; }) };'),
      };
    },
    expected: { items: { texts: ["14:02 Mission created", "14:20 Plan approved"], filled: true }, statics: ["14:02", "Mission created", "14:20", "Plan approved"], shown: { div: 0, li: 0, events: [true, true], loose: [0] } },
  },
  {
    name: "US2-7 a link in an event keeps its own tab stop and focus ring, inside the item's content column after the marker column; the timeline adds no tab stop and its list stays named (FR-026)",
    run: async (driver) => {
      await page(driver, `<button id="before" type="button">Before</button>${tl("t", 'label="Mission history"', [ev("e1", 'time="14:02"', 'Opened <a id="lnk" href="#lnk">pull request 42</a>'), ev("e2", 'time="14:20"', "Plan approved")])}<button id="after" type="button">After</button>`);
      const walk = await driver.tabWalk("before", "after");
      await driver.focus("before");
      await driver.pressTab();
      const focused = await driver.focused();
      const ring = await driver.focusVisible("lnk");
      const column = await read(
        driver,
        `const li = lis("t")[0]; const markerLine = li?.querySelector(".marker-line");
if (li === undefined || markerLine === null) return "no item";
const link = $("lnk").getBoundingClientRect(); const m = markerLine.getBoundingClientRect(); const box = li.getBoundingClientRect();
return { afterMarker: link.left >= m.right, insideItem: link.right <= box.right + 0.5 && link.top >= box.top - 0.5 && link.bottom <= box.bottom + 0.5 };`,
      );
      return { walk, focused, ring, column, lists: await lists(driver, "t") };
    },
    expected: { walk: ["lnk", "after"], focused: "lnk", ring: true, column: { afterMarker: true, insideItem: true }, lists: ["Mission history"] },
  },
  {
    name: "US2-8 light and dark: time, content, dot and connector painted in the tokens the source names; forced colours: the dot's border-block-start and the connector's border-inline-start CanvasText with a width above zero and a box, the text in CanvasText (FR-013, FR-027)",
    run: async (driver) => {
      await page(driver, tl("t", 'label="Mission history"', three));
      const painted = `const event = $("e1"); const li = lis("t")[0]; const time = part(event, "time"); const content = part(event, "content"); const dot = li?.querySelector(".marker") ?? null; const connector = li?.querySelector(".connector") ?? null;
if (time === null || content === null || dot === null || connector === null) return "missing part, dot or connector";
const d = getComputedStyle(dot); const c = getComputedStyle(connector);`;
      const themed = `${painted}
return { time: getComputedStyle(time).color === token("color-ink-muted"), content: getComputedStyle(content).color === token("color-ink"), dot: d.borderTopColor === token("color-ink-muted") && Number.parseFloat(d.borderTopWidth) > 0, connector: c.borderLeftColor === token("color-rule-strong") && Number.parseFloat(c.borderLeftWidth) > 0 };`;
      await driver.theme("light");
      const light = await read(driver, themed);
      await driver.theme("dark");
      const dark = await read(driver, themed);
      await driver.theme(null);
      await driver.forcedColors("active");
      const forced = await read(
        driver,
        `${painted}
const text = colourOf("CanvasText"); const dr = dot.getBoundingClientRect(); const cr = connector.getBoundingClientRect();
return { dot: d.borderTopColor === text && Number.parseFloat(d.borderTopWidth) > 0 && dr.width > 0 && dr.height > 0, connector: c.borderLeftColor === text && Number.parseFloat(c.borderLeftWidth) > 0 && cr.height > 0, time: getComputedStyle(time).color === text, content: getComputedStyle(content).color === text };`,
      );
      await driver.forcedColors("none");
      return { light, dark, forced };
    },
    expected: { light: { time: true, content: true, dot: true, connector: true }, dark: { time: true, content: true, dot: true, connector: true }, forced: { dot: true, connector: true, time: true, content: true } },
  },
  {
    name: "US2-9 under dir=\"rtl\" the dots and connectors are on the inline start side, the right, with the content to their left (FR-021)",
    run: async (driver) => {
      await page(driver, `<div dir="rtl">${tl("t", 'label="Mission history"', three)}</div>`);
      return read(
        driver,
        `const host = $("t").getBoundingClientRect();
return lis("t").map((li) => { const dot = li.querySelector(".marker"); const connector = li.querySelector(".connector"); const content = part(eventOf(li), "content"); if (dot === null || content === null) return "missing";
const d = dot.getBoundingClientRect(); const c = connector?.getBoundingClientRect();
return { atRight: near(d.right, host.right), contentLeft: content.getBoundingClientRect().right <= d.left, connector: c === undefined ? null : near(c.left + c.width / 2, d.left + d.width / 2) }; });`,
      );
    },
    expected: [
      { atRight: true, contentLeft: true, connector: true },
      { atRight: true, contentLeft: true, connector: true },
      { atRight: true, contentLeft: true, connector: null },
    ],
  },
  {
    name: "US2-10 a blank host aria-label counts as absent (label names the list), a blank one with no or a blank label leaves it unnamed, a non-blank host aria-label names it over label (FR-022)",
    run: async (driver) => {
      const one = (id: string): string => ev(`${id}-e`, 'time="14:02"', "Mission created");
      await page(
        driver,
        [
          tl("t1", 'aria-label="" label="Mission history"', [one("t1")]),
          tl("t2", 'aria-label="  " label="Mission history"', [one("t2")]),
          tl("t3", 'aria-label=" "', [one("t3")]),
          tl("t4", 'aria-label="" label="  "', [one("t4")]),
          tl("t5", 'aria-label="History" label="Mission history"', [one("t5")]),
        ].join(""),
      );
      return { t1: await lists(driver, "t1"), t2: await lists(driver, "t2"), t3: await lists(driver, "t3"), t4: await lists(driver, "t4"), t5: await lists(driver, "t5") };
    },
    expected: { t1: ["Mission history"], t2: ["Mission history"], t3: [""], t4: [""], t5: ["History"] },
  },
];

/** The `time` property and `time` slot bodies (tasks.md T031; R-10, Q-E, Q-G). */
export const eventTimelineTimeScenarios: readonly Scenario[] = [
  {
    name: "time set, changed and cleared by property after mount: reflected, the time box follows and the marker moves between the time's line and the content's (R-10)",
    run: async (driver) => {
      await page(driver, tl("t", 'label="Mission history"', [ev("e1", "", "Mission created"), ev("e2", 'time="14:20"', "Plan approved")]));
      const state = async (): Promise<unknown> => ({ attribute: await driver.attribute("e1", "time"), ...((await read(driver, 'return { time: timeOf($("e1")), line: lis("t")[0] === undefined ? "no item" : line(lis("t")[0]), classes: classes("t"), gaps: gaps("t") };')) as object) });
      const before = await state();
      await driver.setProperty("e1", "time", "14:02");
      const set = await state();
      await driver.setProperty("e1", "time", "09:30");
      const changed = await state();
      await driver.setProperty("e1", "time", undefined);
      const cleared = await state();
      return { before, set, changed, cleared };
    },
    expected: {
      before: { attribute: null, time: null, line: "content", classes: ["next-has-time", "has-time"], gaps: ["space-1"] },
      set: { attribute: "14:02", time: "14:02", line: "time", classes: ["has-time next-has-time", "has-time"], gaps: ["space-1"] },
      changed: { attribute: "09:30", time: "09:30", line: "time", classes: ["has-time next-has-time", "has-time"], gaps: ["space-1"] },
      cleared: { attribute: null, time: null, line: "content", classes: ["next-has-time", "has-time"], gaps: ["space-1"] },
    },
  },
  {
    name: "time=\"\" and time=\" \" give no time box and no has-time, the marker on the content's line and the item text the content alone, beside a timed event (R-10)",
    run: async (driver) => {
      await page(driver, tl("t", 'label="Mission history"', [ev("e1", 'time=""', "Mission created"), ev("e2", 'time=" "', "Plan approved"), ev("e3", 'time="14:41"', "Review requested")]));
      return {
        items: await texts(driver, "t"),
        read: await read(driver, 'return { times: [timeOf($("e1")), timeOf($("e2")), timeOf($("e3"))], lines: lis("t").map(line), classes: classes("t"), gaps: gaps("t") };'),
      };
    },
    expected: {
      items: { texts: ["Mission created", "Plan approved", "14:41 Review requested"], filled: true },
      read: { times: [null, null, "14:41"], lines: ["content", "content", "time"], classes: ["", "next-has-time", "has-time"], gaps: ["space-1", "space-1"] },
    },
  },
  {
    name: "US2-11 a <time slot=\"time\" datetime> written after the content is shown above it unchanged and read first, with the attribute time's type; a <b slot=\"time\"> takes the same type over its bold; the marker on the time's line (FR-023, FR-016)",
    run: async (driver) => {
      await page(
        driver,
        tl("t", 'label="Mission history"', [
          ev("e1", 'time="14:02"', "Mission created"),
          ev("e2", "", 'Plan approved<time id="st" slot="time" datetime="2026-11-15T14:20">14:20</time>'),
          ev("e3", "", 'Review requested<b id="sb" slot="time">14:41</b>'),
        ]),
      );
      return {
        items: await texts(driver, "t"),
        read: await read(
          driver,
          `const reference = part($("e1"), "time");
if (reference === null) return "no attribute time box";
const ref = getComputedStyle(reference);
const keys = ["fontFamily", "fontSize", "fontWeight", "color", "fontVariantNumeric", "lineHeight"];
const slotted = (id, event) => { const node = $(id); const style = getComputedStyle(node); const content = part($(event), "content"); return { slot: node.assignedSlot?.name ?? null, box: node.assignedSlot?.parentElement?.getAttribute("part") ?? null, above: content !== null && node.getBoundingClientRect().bottom <= content.getBoundingClientRect().top + 0.5, attributes: [...node.attributes].map((a) => a.name + "=" + a.value), differs: keys.filter((key) => style[key] !== ref[key]) }; };
return { time: slotted("st", "e2"), bold: slotted("sb", "e3"), times: [timeOf($("e2")), timeOf($("e3"))], lines: lis("t").map(line) };`,
        ),
      };
    },
    expected: {
      items: { texts: threeTexts, filled: true },
      read: {
        time: { slot: "time", box: "time", above: true, attributes: ["id=st", "slot=time", "datetime=2026-11-15T14:20"], differs: [] },
        bold: { slot: "time", box: "time", above: true, attributes: ["id=sb", "slot=time"], differs: [] },
        times: ["slot[st]", "slot[sb]"],
        lines: ["time", "time", "time"],
      },
    },
  },
  {
    name: "US2-12 an event with time=\"09:00\" and a slotted time \"14:20\" shows and exposes only 14:20; once the slotted node is removed 09:00 is shown and read (FR-023, FR-025)",
    run: async (driver) => {
      await page(driver, tl("t", 'label="Mission history"', [ev("e1", 'time="09:00"', 'Plan approved<time id="s12" slot="time">14:20</time>'), ev("e2", 'time="14:41"', "Review requested")]));
      const state = async (): Promise<unknown> => ({ time: await read(driver, 'return timeOf($("e1"));'), items: await texts(driver, "t"), nine: (await statics(driver, "t")).filter((name) => name.includes("09:00")).length });
      const slotted = await state();
      await driver.remove("s12");
      const removed = await state();
      return { slotted, removed };
    },
    expected: {
      slotted: { time: "slot[s12]", items: { texts: ["14:20 Plan approved", "14:41 Review requested"], filled: true }, nine: 0 },
      removed: { time: "09:00", items: { texts: ["09:00 Plan approved", "14:41 Review requested"], filled: true }, nine: 1 },
    },
  },
  {
    name: "US2-13 an empty, white-space-only, hidden or aria-hidden slotted time counts as none: without a time attribute no time box, no has-time, the marker on the content's line, the node unassigned and not shown; with time=\"09:00\" that time shows (Q-G (a)); every connector gapped (FR-021, FR-023)",
    run: async (driver) => {
      const kinds: readonly (readonly [string, string])[] = [
        ["empty", ""],
        ["blank", "   "],
        ["hidden", "11:00"],
        ["masked", "12:00"],
      ];
      const extra = (kind: string): string => (kind === "hidden" ? " hidden" : kind === "masked" ? ' aria-hidden="true"' : "");
      const events = kinds.flatMap(([kind, text]) => [ev(`n-${kind}`, "", `${kind} content<time id="sn-${kind}" slot="time"${extra(kind)}>${text}</time>`), ev(`a-${kind}`, 'time="09:00"', `${kind} timed<time id="sa-${kind}" slot="time"${extra(kind)}>${text}</time>`)]);
      await page(driver, tl("t", 'label="Mission history"', [ev("e0", 'time="14:00"', "Start"), ...events]));
      return {
        items: (await texts(driver, "t")).texts,
        read: await read(
          driver,
          `const items = lis("t");
const of = (id, node) => { const at = items.findIndex((li) => eventOf(li)?.id === id); const li = items[at]; return { time: timeOf($(id)), hasTime: li?.classList.contains("has-time") ?? "no item", line: li === undefined ? "no item" : line(li), assigned: $(node).assignedSlot !== null, rects: rects(node) }; };
return { events: ["empty", "blank", "hidden", "masked"].map((kind) => [of("n-" + kind, "sn-" + kind), of("a-" + kind, "sa-" + kind)]), gaps: gaps("t") };`,
        ),
      };
    },
    expected: {
      items: ["14:00 Start", "empty content", "09:00 empty timed", "blank content", "09:00 blank timed", "hidden content", "09:00 hidden timed", "masked content", "09:00 masked timed"],
      read: {
        events: ["empty", "blank", "hidden", "masked"].map(() => [
          { time: null, hasTime: false, line: "content", assigned: false, rects: 0 },
          { time: "09:00", hasTime: true, line: "time", assigned: false, rects: 0 },
        ]),
        gaps: Array.from({ length: 8 }, () => "space-1"),
      },
    },
  },
  {
    name: "US2-14 a slotted time filled, shown, emptied and hidden after mount: the time box, the item text, the marker's line and the previous connector's end follow at once (FR-023, FR-025)",
    run: async (driver) => {
      await page(driver, tl("t", 'label="Mission history"', [ev("e0", 'time="14:00"', "Start"), ev("e1", "", '<time id="f" slot="time"> </time>Filled'), ev("e2", 'time="14:05"', "Middle"), ev("e3", "", '<time id="h" slot="time" hidden>14:30</time>Shown')]));
      const state = async (): Promise<unknown> => ({ items: (await texts(driver, "t")).texts, ...((await read(driver, 'return { times: [timeOf($("e1")), timeOf($("e3"))], lines: lis("t").map(line), classes: classes("t"), gaps: gaps("t") };')) as object) });
      const before = await state();
      await driver.text("f", "14:20");
      const filled = await state();
      await driver.setAttribute("h", "hidden", null);
      const shown = await state();
      await driver.text("f", " ");
      const emptied = await state();
      await driver.setAttribute("h", "hidden", "");
      const hidden = await state();
      return { before, filled, shown, emptied, hidden };
    },
    expected: {
      before: { items: ["14:00 Start", "Filled", "14:05 Middle", "Shown"], times: [null, null], lines: ["time", "content", "time", "content"], classes: ["has-time", "next-has-time", "has-time", ""], gaps: ["space-1", "space-1", "space-1"] },
      filled: { items: ["14:00 Start", "14:20 Filled", "14:05 Middle", "Shown"], times: ["slot[f]", null], lines: ["time", "time", "time", "content"], classes: ["has-time next-has-time", "has-time next-has-time", "has-time", ""], gaps: ["space-1", "space-1", "space-1"] },
      shown: { items: ["14:00 Start", "14:20 Filled", "14:05 Middle", "14:30 Shown"], times: ["slot[f]", "slot[h]"], lines: ["time", "time", "time", "time"], classes: ["has-time next-has-time", "has-time next-has-time", "has-time next-has-time", "has-time"], gaps: ["space-1", "space-1", "space-1"] },
      emptied: { items: ["14:00 Start", "Filled", "14:05 Middle", "14:30 Shown"], times: [null, "slot[h]"], lines: ["time", "content", "time", "time"], classes: ["has-time", "next-has-time", "has-time next-has-time", "has-time"], gaps: ["space-1", "space-1", "space-1"] },
      hidden: { items: ["14:00 Start", "Filled", "14:05 Middle", "Shown"], times: [null, null], lines: ["time", "content", "time", "content"], classes: ["has-time", "next-has-time", "has-time", ""], gaps: ["space-1", "space-1", "space-1"] },
    },
  },
  {
    name: "US2-14 slot change (analysis G1): a <time> child without slot is part of the content; slot=\"time\" set moves it to the time box, time first, the marker and the previous connector follow; slot removed moves it back (FR-023)",
    run: async (driver) => {
      await page(driver, tl("t", 'label="Mission history"', [ev("e0", 'time="14:00"', "Start"), ev("e1", "", 'Merged <time id="sc" datetime="2026-11-15T14:50">14:50</time> today')]));
      const state = async (): Promise<unknown> => ({
        item: (await texts(driver, "t")).texts[1] ?? null,
        ...((await read(driver, 'const node = $("sc"); return { time: timeOf($("e1")), slot: node.assignedSlot?.name ?? null, box: node.assignedSlot?.parentElement?.getAttribute("part") ?? null, lines: lis("t").map(line), classes: classes("t"), gaps: gaps("t") };')) as object),
      });
      const before = await state();
      await driver.setAttribute("sc", "slot", "time");
      const set = await state();
      await driver.setAttribute("sc", "slot", null);
      const removed = await state();
      return { before, set, removed };
    },
    expected: {
      before: { item: "Merged 14:50 today", time: null, slot: "", box: "content", lines: ["time", "content"], classes: ["has-time", ""], gaps: ["space-1"] },
      set: { item: "14:50 Merged today", time: "slot[sc]", slot: "time", box: "time", lines: ["time", "time"], classes: ["has-time next-has-time", "has-time"], gaps: ["space-1"] },
      removed: { item: "Merged 14:50 today", time: null, slot: "", box: "content", lines: ["time", "content"], classes: ["has-time", ""], gaps: ["space-1"] },
    },
  },
];

/** The connector geometry bodies (tasks.md T032; R-10, PLAN-FRESH-2-004 (a)). */
export const eventTimelineGeometryScenarios: readonly Scenario[] = [
  {
    name: "connectors, three timed events: each clear of both dots with both gaps --ocelle-space-1 within 0.5 px; elementFromPoint inside each dot returns the marker (R-10)",
    run: async (driver) => {
      await page(driver, tl("t", 'label="Mission history"', three));
      return read(driver, 'return { gaps: gaps("t"), hits: hits("t") };');
    },
    expected: { gaps: ["space-1", "space-1"], hits: [true, true, true] },
  },
  {
    name: "connectors, a mixed timeline (timed, untimed, timed by its slot, untimed with an empty slotted time, timed): each gap --ocelle-space-1 within 0.5 px, each dot on its first line, elementFromPoint the marker (R-10)",
    run: async (driver) => {
      await page(
        driver,
        tl("t", 'label="Mission history"', [
          ev("e1", 'time="14:02"', "Mission created"),
          ev("e2", "", "Untimed note"),
          ev("e3", "", '<time slot="time" datetime="2026-11-15T14:41">14:41</time>Review requested'),
          ev("e4", "", 'Untimed again<time slot="time"></time>'),
          ev("e5", 'time="15:00"', "Merged with a long content line that wraps over more than one line when the timeline is narrow"),
        ]),
      );
      return read(driver, 'return { lines: lis("t").map(line), classes: classes("t"), gaps: gaps("t"), hits: hits("t") };');
    },
    expected: {
      lines: ["time", "content", "time", "content", "time"],
      classes: ["has-time", "next-has-time", "has-time", "next-has-time", "has-time"],
      gaps: ["space-1", "space-1", "space-1", "space-1"],
      hits: [true, true, true, true, true],
    },
  },
];

/** The timeline edge-case bodies (tasks.md T033; FR-001, FR-026, FR-052). */
export const eventTimelineEdgeScenarios: readonly Scenario[] = [
  {
    name: "edge: an event outside a timeline shows its time (attribute or slotted, even written after the content) above its content as plain text, with no marker and no list role",
    run: async (driver) => {
      await page(driver, `${ev("o1", 'time="14:02"', "Alone")}${ev("o2", "", 'Alone by slot<time id="ot" slot="time" datetime="2026-11-15T14:20">14:20</time>')}`);
      const shown = await read(
        driver,
        `const of = (id) => { const time = part($(id), "time"); const content = part($(id), "content"); if (time === null || content === null) return "missing part"; return { time: timeOf($(id)), above: time.getBoundingClientRect().bottom <= content.getBoundingClientRect().top + 0.5, marks: $(id).shadowRoot.querySelectorAll(".marker, .connector, ol, li").length }; };
return [of("o1"), of("o2")];`,
      );
      return { shown, o1: { roles: await tree(driver, "o1"), statics: await statics(driver, "o1") }, o2: { roles: await tree(driver, "o2"), statics: await statics(driver, "o2") } };
    },
    expected: {
      shown: [
        { time: "14:02", above: true, marks: 0 },
        { time: "slot[ot]", above: true, marks: 0 },
      ],
      o1: { roles: ["generic"], statics: ["14:02", "Alone"] },
      o2: { roles: ["generic", "time"], statics: ["14:20", "Alone by slot"] },
    },
  },
  {
    name: "edge: an empty timeline renders no <ol> and no listitem and throws nothing, beside a timeline with an event that renders its named list (FR-025)",
    run: async (driver) => {
      await page(driver, `${tl("t0", 'label="Nothing"', ['<p id="p0">Not an event</p>'])}${tl("t1", 'label="Mission history"', [ev("e1", 'time="14:02"', "Mission created")])}`);
      return {
        ols: await read(driver, 'return [shadow("t0")?.querySelector("ol") !== null && shadow("t0") !== null, shadow("t1")?.querySelector("ol") !== null && shadow("t1") !== null];'),
        lists: [await lists(driver, "t0"), await lists(driver, "t1")],
        listitems: (await tree(driver, "t0")).filter((role) => role.startsWith("listitem")).length,
        messages: await driver.messages(),
      };
    },
    expected: { ols: [false, true], lists: [[], ["Mission history"]], listitems: 0, messages: [] },
  },
  {
    name: "edge: an aria-hidden=\"true\" event is neither shown nor exposed and no connector joins it; the events around it are (FR-020, FR-025)",
    run: async (driver) => {
      await page(driver, tl("t", 'label="Mission history"', [ev("e1", 'time="14:02"', "Mission created"), ev("e2", 'time="14:20" aria-hidden="true"', "Masked"), ev("e3", 'time="14:41"', "Review requested")]));
      return { items: await texts(driver, "t"), shown: await read(driver, 'return { rects: [rects("e1") > 0, rects("e2"), rects("e3") > 0], gaps: gaps("t") };') };
    },
    expected: { items: { texts: ["14:02 Mission created", "14:41 Review requested"], filled: true }, shown: { rects: [true, 0, true], gaps: ["space-1"] } },
  },
  {
    name: "edge: lang and dir on an event reach its time and content boxes; a slotted time's own lang, dir and datetime stay the consumer's",
    run: async (driver) => {
      await page(driver, tl("t", 'label="Mission history"', [ev("e1", 'time="14:02" lang="fr" dir="rtl"', "Mission créée"), ev("e2", "", '<time id="lt" slot="time" lang="de" dir="rtl" datetime="2026-11-15T14:20">14:20</time>Plan')]));
      return read(
        driver,
        `const time = part($("e1"), "time"); const content = part($("e1"), "content"); const node = $("lt");
if (time === null || content === null) return "missing part";
return { time: getComputedStyle(time).direction, content: getComputedStyle(content).direction, slotted: { slot: node.assignedSlot?.name ?? null, lang: node.matches(":lang(de)"), dir: getComputedStyle(node).direction, attributes: [...node.attributes].map((a) => a.name + "=" + a.value) } };`,
      );
    },
    expected: { time: "rtl", content: "rtl", slotted: { slot: "time", lang: true, dir: "rtl", attributes: ["id=lt", "slot=time", "lang=de", "dir=rtl", "datetime=2026-11-15T14:20"] } },
  },
  {
    name: "edge: two slotted time nodes, one aria-hidden=\"true\": only the other is shown and read",
    run: async (driver) => {
      await page(driver, tl("t", 'label="Mission history"', [ev("e1", "", '<time id="ah" slot="time" aria-hidden="true">09:00</time><time id="vis" slot="time">14:20</time>Two times')]));
      return { items: await texts(driver, "t"), shown: await read(driver, 'return { time: timeOf($("e1")), rects: [rects("ah"), rects("vis") > 0] };') };
    },
    expected: { items: { texts: ["14:20 Two times"], filled: true }, shown: { time: "slot[ah,vis]", rects: [0, true] } },
  },
  {
    name: "edge (analysis A1): a blank slotted node beside a visible one: both are assigned to the time slot in source order and the item text gains no text from the blank one",
    run: async (driver) => {
      await page(driver, tl("t", 'label="Mission history"', [ev("e1", "", '<span id="bs" slot="time"> </span><time id="bt" slot="time">14:20</time>Blank beside'), ev("e2", 'time="14:41"', "Review requested")]));
      return { items: await texts(driver, "t"), shown: await read(driver, 'return { time: timeOf($("e1")), classes: classes("t") };') };
    },
    expected: { items: { texts: ["14:20 Blank beside", "14:41 Review requested"], filled: true }, shown: { time: "slot[bs,bt]", classes: ["has-time next-has-time", "has-time"] } },
  },
  {
    name: "edge: five events keep their source order in the list",
    run: async (driver) => {
      await page(driver, tl("t", 'label="Mission history"', ["A", "B", "C", "D", "E"].map((name, at) => ev(`e${String(at)}`, `time="1${String(at)}:00"`, `Event ${name}`))));
      return texts(driver, "t");
    },
    expected: { texts: ["10:00 Event A", "11:00 Event B", "12:00 Event C", "13:00 Event D", "14:00 Event E"], filled: true },
  },
  {
    name: "edge (FR-026): no live region, landmark, heading or tab stop in the timeline's subtree, while its named list is there",
    run: async (driver) => {
      await page(driver, tl("t", 'label="Mission history"', three));
      const roles = (await tree(driver, "t")).map((entry) => entry.split(" ")[0] ?? "");
      const forbidden = ["status", "log", "alert", "marquee", "timer", "region", "heading", "banner", "navigation", "main", "complementary", "contentinfo", "form", "search"];
      return {
        forbidden: roles.filter((role) => forbidden.includes(role)),
        lists: await lists(driver, "t"),
        shadow: await read(driver, 'const r = shadow("t"); return r === null ? "no shadow root" : { live: r.querySelectorAll("[aria-live], [role]:not(ol):not(li)").length, tabbable: r.querySelectorAll("[tabindex]").length, ol: r.querySelectorAll("ol").length };'),
      };
    },
    expected: { forbidden: [], lists: ["Mission history"], shadow: { live: 0, tabbable: 0, ol: 1 } },
  },
  {
    name: "edge (FR-001): a hidden timeline has no box and no list node, a hidden standalone event no box and no StaticText, each beside a shown one that renders its <ol> or its content part",
    run: async (driver) => {
      await page(
        driver,
        `${tl("th", 'hidden label="Hidden"', [ev("th-e", 'time="14:02"', "Hidden event")])}${tl("tv", 'label="Shown"', [ev("tv-e", 'time="14:02"', "Shown event")])}${ev("sh", 'hidden time="14:02"', "Hidden alone")}${ev("sv", 'time="14:03"', "Shown alone")}`,
      );
      return {
        boxes: await read(driver, 'const size = (id) => { const r = $(id).getBoundingClientRect(); return r.width * r.height; }; return { th: size("th"), tv: size("tv") > 0, sh: size("sh"), sv: size("sv") > 0, tvList: shadow("tv")?.querySelector("ol") !== null && shadow("tv") !== null, svContent: part($("sv"), "content") !== null };'),
        lists: [await lists(driver, "th"), await lists(driver, "tv")],
        statics: [await statics(driver, "sh"), await statics(driver, "sv")],
      };
    },
    expected: { boxes: { th: 0, tv: true, sh: 0, sv: true, tvList: true, svContent: true }, lists: [[], ["Shown"]], statics: [[], ["14:03", "Shown alone"]] },
  },
  {
    name: "edge: at 640 px a timeline of four events, one a long identifier with wrap, is one named list of four items and the page does not scroll sideways",
    run: async (driver) => {
      await page(
        driver,
        tl("t", 'label="Mission history"', [...three, ev("e4", 'time="14:50" wrap="anywhere"', `Deployed ${identifier}${identifier}${identifier}`)]),
        640,
      );
      return { lists: await lists(driver, "t"), items: (await texts(driver, "t")).texts.length, scrollWidth: await driver.scrollWidth() };
    },
    expected: { lists: ["Mission history"], items: 4, scrollWidth: 640 },
  },
  {
    name: "edge: unset properties write no attribute on the timeline or the event, which still render their list and content",
    run: async (driver) => {
      await page(driver, tl("t", "", [ev("e", "", "Plain")]));
      return read(driver, 'return { timeline: [...$("t").attributes].map((a) => a.name), event: [...$("e").attributes].map((a) => a.name), list: shadow("t")?.querySelector("ol") !== null && shadow("t") !== null, content: part($("e"), "content") !== null, time: part($("e"), "time") };');
    },
    expected: { timeline: ["id"], event: ["id"], list: true, content: true, time: null },
  },
];

/** Every timeline body, in the order of tasks.md T030 to T033. */
export const eventTimelineScenarios: readonly Scenario[] = [...eventTimelineStoryScenarios, ...eventTimelineTimeScenarios, ...eventTimelineGeometryScenarios, ...eventTimelineEdgeScenarios];
