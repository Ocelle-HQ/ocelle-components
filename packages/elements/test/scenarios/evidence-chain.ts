// The shared bodies of `ocelle-evidence-chain` and `ocelle-evidence-step` (019 spec US3-1 to US3-10, the US3 edge
// cases, FR-001, FR-016, FR-030 to FR-036; contracts/ocelle-evidence-chain.md, contracts/ocelle-evidence-step.md,
// contracts/checks.md § Oracles; research.md R-08, R-09, R-11, R-12; reviews/phase-3/spike.md; tasks.md T055, T056),
// run in process on the element source (test/evidence-chain.test.ts, mutated) and on the strict-CSP fixture with the
// browser build and `base.css` (test/browser/evidence-chain.test.ts). Every body mounts with `@ocelle/styles`' base.css
// and the token probe. Lengths and colours are compared with the token's value read from the probe on the same page,
// never a literal; a border width is compared with the token read as a border width (`border-top-width`), which
// Chromium floors as it floors the element's (spike Q2 (a)); "within 0.5 px" is inclusive everywhere.
//
// Shadow reads go through `read` (one in-page read, `lib`'s helpers first), so a body run against the scaffold, which
// renders nothing, fails on its assertion and not on a missing node. Item texts are the driver's `itemTexts` (R-11).
// Every "does not" is paired with the positive outcome it guards in the same body. Line ends depend on the text's
// widths, so the bodies compare each `<li>`'s `data-line-end` and shown connector with the line ends its measured
// block starts give, never with a fixed pattern. The axe clause of US3-1 (`aria-required-children` and
// `aria-required-parent`, which axe applies to the explicit roles; spike § 5) is the `axe` gate's on the chain
// stories: element tests run no axe.
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

/** An `ocelle-evidence-step`; `attributes` is written as given. */
const st = (id: string, attributes: string, content: string): string => `<ocelle-evidence-step id="${id}"${attributes === "" ? "" : ` ${attributes}`}>${content}</ocelle-evidence-step>`;

/** An `ocelle-evidence-chain`. */
const ch = (id: string, attributes: string, steps: readonly string[]): string => `<ocelle-evidence-chain id="${id}"${attributes === "" ? "" : ` ${attributes}`}>${steps.join("")}</ocelle-evidence-chain>`;

/** The six steps of US3-1, the third and fifth chips when `chips`; ids `<prefix>1` to `<prefix>6`. */
const names = ["Spec", "Plan", "Tasks", "Red commit", "Green commit", "Review"];
const six = (prefix: string, chips: boolean): string[] => names.map((name, at) => st(`${prefix}${String(at + 1)}`, chips && (at === 2 || at === 4) ? 'variant="chip"' : "", name));

/**
 * The in-page helpers every read starts with:
 * - `px(token)`, `borderPx(token)` and `token(name)`: a length token in px (as a padding, and as a border width, which
 *   Chromium floors), and a colour token's computed colour, from the probe;
 * - `lis(id)`: the `<li>`s of the chain `id`; `stepOf(li)`: the step assigned to its slot; `content(step)`: its
 *   `part="content"`;
 * - `ordinals(id)`: per `<li>`, its marker's text, or `chip` for a `<li>` without a marker;
 * - `ends(id)`: per `<li>`, whether its `data-line-end` and its shown connector both agree with the line end its
 *   block start gives (`ok`), else what was found; `tops(id)`: the number of distinct lines;
 * - `inside(id)`: whether every `<li>`, every shown connector and every step box lies inside the chain's inline edges.
 */
const lib = `
const $ = (id) => document.getElementById(id);
const shadow = (id) => $(id)?.shadowRoot ?? null;
const probeEl = () => $("probe");
const px = (name) => { const p = probeEl(); p.style.paddingInlineStart = "var(--ocelle-" + name + ")"; const v = Number.parseFloat(getComputedStyle(p).paddingInlineStart); p.style.removeProperty("padding-inline-start"); return v; };
const borderPx = (name) => { const p = probeEl(); p.style.borderTopStyle = "solid"; p.style.borderTopWidth = "var(--ocelle-" + name + ")"; const v = Number.parseFloat(getComputedStyle(p).borderTopWidth); p.style.removeProperty("border-top-style"); p.style.removeProperty("border-top-width"); return v; };
const colourOf = (value) => { const p = probeEl(); p.style.color = value; const v = getComputedStyle(p).color; p.style.removeProperty("color"); return v; };
const token = (name) => colourOf("var(--ocelle-" + name + ")");
const family = (name) => { const p = probeEl(); p.style.fontFamily = "var(--ocelle-" + name + ")"; const v = getComputedStyle(p).fontFamily; p.style.removeProperty("font-family"); return v; };
const near = (a, b) => Math.abs(a - b) <= 0.5;
const lis = (id) => [...(shadow(id)?.querySelectorAll("ol > li") ?? [])];
const stepOf = (li) => li.querySelector("slot")?.assignedElements()[0] ?? null;
const content = (step) => step?.shadowRoot?.querySelector('[part="content"]') ?? null;
const shown = (element) => element !== null && getComputedStyle(element).display !== "none" && element.getBoundingClientRect().width > 0;
const ordinals = (id) => lis(id).map((li) => { const m = li.querySelector(".marker"); return m === null ? "chip" : m.textContent.trim(); });
const top = (element) => element.getBoundingClientRect().top;
const tops = (id) => new Set(lis(id).map((li) => Math.round(top(li)))).size;
const ends = (id) => { const items = lis(id); return items.map((li, at) => { const next = items[at + 1]; const end = next === undefined || top(next) > top(li) + 0.5; const marked = li.hasAttribute("data-line-end"); const connector = shown(li.querySelector(".connector")); return marked === end && connector === !end ? "ok" : "end " + end + ", data-line-end " + marked + ", connector " + connector; }); };
const inside = (id) => { const host = $(id).getBoundingClientRect(); const within = (r) => r.left >= host.left - 0.5 && r.right <= host.right + 0.5; const items = lis(id); return items.length > 0 && items.every((li) => { const c = li.querySelector(".connector"); return within(li.getBoundingClientRect()) && within(stepOf(li).getBoundingClientRect()) && (!shown(c) || (within(c.getBoundingClientRect()) && c.getBoundingClientRect().right <= li.getBoundingClientRect().right + 0.5 && c.getBoundingClientRect().top >= li.getBoundingClientRect().top - 0.5 && c.getBoundingClientRect().bottom <= li.getBoundingClientRect().bottom + 0.5)); }); };
const overlaps = (id) => { const boxes = lis(id).map((li) => stepOf(li).getBoundingClientRect()); return boxes.some((a, i) => boxes.some((b, j) => i < j && a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5)); };
const fill = (id) => { const host = $(id).getBoundingClientRect(); const rtl = getComputedStyle($(id)).direction === "rtl"; const items = lis(id); return items.every((li, at) => { const r = li.getBoundingClientRect(); const prev = items[at - 1]; if (prev === undefined || top(prev) + 0.5 < top(li)) return rtl ? near(r.right, host.right) : near(r.left, host.left); const p = prev.getBoundingClientRect(); return rtl ? r.right <= p.left + 0.5 : r.left >= p.right - 0.5; }); };
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

/** The wrapping reading of US3-3 for the chain `id`: lines, line ends, fill, overlap, inside, and the steps' boxes. */
const wrapped = (id: string): string => `({ lines: tops("${id}") > 1, ends: ends("${id}"), fill: fill("${id}"), overlaps: overlaps("${id}"), inside: inside("${id}"), order: lis("${id}").map((li) => stepOf(li)?.id ?? null) })`;

/** US3-1 to US3-10 (tasks.md T055). */
export const evidenceChainStoryScenarios: readonly Scenario[] = [
  {
    name: "US3-1 one list named Evidence, six listitems in source order, each item text the step's content only (no ordinal, no connector text), every marker and connector aria-hidden in the DOM, the explicit list and listitem roles kept (FR-016, FR-030, FR-032; R-08)",
    run: async (driver) => {
      await page(driver, ch("c", 'label="Evidence"', six("s", true)));
      return {
        tree: await tree(driver, "c"),
        items: await texts(driver, "c"),
        statics: await statics(driver, "c"),
        hidden: await read(driver, 'const r = shadow("c"); const spans = [...(r?.querySelectorAll(".marker, .connector") ?? [])]; return { markers: r?.querySelectorAll(".marker").length ?? 0, connectors: r?.querySelectorAll(".connector").length ?? 0, all: spans.length > 0 && spans.every((span) => span.getAttribute("aria-hidden") === "true"), roles: [r?.querySelector("ol")?.getAttribute("role") ?? null, ...lis("c").map((li) => li.getAttribute("role"))] };'),
      };
    },
    expected: {
      tree: ["generic", "list Evidence", "listitem", "generic", "listitem", "generic", "listitem", "generic", "listitem", "generic", "listitem", "generic", "listitem", "generic"],
      items: { texts: names, filled: true },
      statics: names,
      hidden: { markers: 4, connectors: 6, all: true, roles: ["list", "listitem", "listitem", "listitem", "listitem", "listitem", "listitem"] },
    },
  },
  {
    name: "US3-2 at 1280 px six steps in one row from the inline start in source order; each marker --ocelle-size-step square within 0.5 px, round, ringed by a solid --ocelle-ring-step border (read as a border width), showing 1 to 6 in --ocelle-font-sans with tabular figures; a connector between consecutive steps on the row and none after the last (FR-031, FR-033, FR-034)",
    run: async (driver) => {
      await page(driver, ch("c", 'label="Evidence"', six("s", false)));
      return read(
        driver,
        `const size = px("size-step"); const ring = borderPx("ring-step"); const sans = family("font-sans");
return { lines: tops("c"), fill: fill("c"), order: lis("c").map((li) => stepOf(li)?.id ?? null), ends: ends("c"), connectors: lis("c").map((li) => shown(li.querySelector(".connector"))),
  markers: lis("c").map((li) => { const m = li.querySelector(".marker"); if (m === null) return "none"; const r = m.getBoundingClientRect(); const s = getComputedStyle(m); return { size: near(r.width, size) && near(r.height, size), radius: s.borderTopLeftRadius, ring: [s.borderTopStyle, s.borderLeftStyle, s.borderBottomStyle, s.borderRightStyle].every((each) => each === "solid") && [s.borderTopWidth, s.borderLeftWidth, s.borderBottomWidth, s.borderRightWidth].every((each) => Number.parseFloat(each) === ring), text: m.textContent.trim(), family: s.fontFamily === sans, figures: s.fontVariantNumeric }; }) };`,
      );
    },
    expected: {
      lines: 1,
      fill: true,
      order: ["s1", "s2", "s3", "s4", "s5", "s6"],
      ends: ["ok", "ok", "ok", "ok", "ok", "ok"],
      connectors: [true, true, true, true, true, false],
      markers: ["1", "2", "3", "4", "5", "6"].map((text) => ({ size: true, radius: "50%", ring: true, text, family: true, figures: "tabular-nums" })),
    },
  },
  {
    name: "US3-3 at 320 px the six steps wrap onto further lines filled from the inline start in source order, no step cut or overlapping, no connector past the chain's inline edges or across lines, data-line-end on each line's last step, and the page's scroll width 320 (FR-034, FR-009)",
    run: async (driver) => {
      await page(driver, ch("c", 'label="Evidence"', six("s", true)), 320);
      return { wrapped: await read(driver, `return ${wrapped("c")};`), scrollWidth: await driver.scrollWidth() };
    },
    expected: { wrapped: { lines: true, ends: ["ok", "ok", "ok", "ok", "ok", "ok"], fill: true, overlaps: false, inside: true, order: ["s1", "s2", "s3", "s4", "s5", "s6"] }, scrollWidth: 320 },
  },
  {
    name: "US3-3 in a 200 px container, #517's narrow column (Q-T5 (b)): the same chain wraps with the same outcomes, every step's box inside the chain's, and the page does not scroll sideways (FR-034)",
    run: async (driver) => {
      await page(driver, `<div data-w="200">${ch("c", 'label="Evidence"', six("s", true))}</div>`);
      return { wrapped: await read(driver, `return { ...${wrapped("c")}, width: Math.round($("c").getBoundingClientRect().width) };`), scrollWidth: await driver.scrollWidth() };
    },
    expected: { wrapped: { lines: true, ends: ["ok", "ok", "ok", "ok", "ok", "ok"], fill: true, overlaps: false, inside: true, order: ["s1", "s2", "s3", "s4", "s5", "s6"], width: 200 }, scrollWidth: 1280 },
  },
  {
    name: "US3-4 a chip beside default steps: no marker or ordinal, an outline of --ocelle-ring-step (read as a border width) with the --ocelle-radius-2 corner radius, never --ocelle-radius-pill, no fill, block size below --ocelle-size-step, its font size one step below the default step's on xs < sm < md < lg < xl < 2xl; list semantics and order unchanged (FR-035)",
    run: async (driver) => {
      await page(driver, ch("c", 'label="Evidence"', [st("d1", "", "Spec"), st("k1", 'variant="chip"', "3 checks"), st("d2", "", "Review")]));
      const chip = await read(
        driver,
        `const items = lis("c"); const chipLi = items[1]; const chip = $("k1"); const step = $("d1");
if (chipLi === undefined || chip === null) return "no chip item";
const s = getComputedStyle(chip); const ring = borderPx("ring-step");
const scale = ["xs", "sm", "md", "lg", "xl", "2xl"].map((name) => px("font-size-" + name));
const at = (element) => scale.indexOf(Number.parseFloat(getComputedStyle(element).fontSize));
return { marker: chipLi.querySelector(".marker") !== null, chipClass: chipLi.classList.contains("chip"), radius: Number.parseFloat(s.borderTopLeftRadius) === px("radius-2") && [s.borderTopRightRadius, s.borderBottomLeftRadius, s.borderBottomRightRadius].every((each) => each === s.borderTopLeftRadius), pill: Number.parseFloat(s.borderTopLeftRadius) === px("radius-pill"),
  outline: [s.borderTopStyle, s.borderLeftStyle, s.borderBottomStyle, s.borderRightStyle].every((each) => each === "solid") && [s.borderTopWidth, s.borderLeftWidth, s.borderBottomWidth, s.borderRightWidth].every((each) => Number.parseFloat(each) === ring),
  fill: s.backgroundColor, shorter: chip.getBoundingClientRect().height < px("size-step") && chip.getBoundingClientRect().height > 0, steps: at(step) - at(chip), defaultAtSmOrAbove: at(step) >= 1, markers: items.map((li) => li.querySelector(".marker") !== null) };`,
      );
      return { chip, items: await texts(driver, "c"), tree: await tree(driver, "c") };
    },
    expected: {
      chip: { marker: false, chipClass: true, radius: true, pill: false, outline: true, fill: "rgba(0, 0, 0, 0)", shorter: true, steps: 1, defaultAtSmOrAbove: true, markers: [true, false, true] },
      items: { texts: ["Spec", "3 checks", "Review"], filled: true },
      tree: ["generic", "list Evidence", "listitem", "generic", "listitem", "generic", "listitem", "generic"],
    },
  },
  {
    name: "US3-5 at 320 px a long step wraps between words inside the step and never widens the chain; with wrap=\"anywhere\" a step's unbroken identifier breaks inside the step (FR-034, FR-024)",
    run: async (driver) => {
      await page(driver, ch("c", 'label="Evidence"', [st("l1", "", '<span id="long">The specification was approved by the operator after two rounds of review</span>'), st("l2", 'wrap="anywhere"', `<span id="ident">${identifier}${identifier}</span>`), st("l3", "", "Review")]), 320);
      return {
        shown: await read(
          driver,
          `const of = (id, step) => { const box = $(step).getBoundingClientRect(); const lines = [...$(id).getClientRects()]; return { lines: new Set(lines.map((r) => Math.round(r.top))).size > 1, inside: lines.length > 0 && lines.every((r) => r.left >= box.left - 0.5 && r.right <= box.right + 0.5) }; };
return { long: of("long", "l1"), ident: of("ident", "l2"), wrap: [content($("l1")) === null ? null : getComputedStyle(content($("l1"))).overflowWrap, content($("l2")) === null ? null : getComputedStyle(content($("l2"))).overflowWrap], inside: inside("c"), width: Math.round($("c").getBoundingClientRect().width) };`,
        ),
        scrollWidth: await driver.scrollWidth(),
      };
    },
    expected: { shown: { long: { lines: true, inside: true }, ident: { lines: true, inside: true }, wrap: ["normal", "anywhere"], inside: true, width: 320 }, scrollWidth: 320 },
  },
  {
    name: "US3-6 a step added, removed or hidden, and a chip hidden and shown again: the ordinals are the positions 1 to N among the visible steps, chip steps counted (SPEC-3-02), and the listitems match the visible steps (FR-033, FR-025)",
    run: async (driver) => {
      await page(driver, ch("c", 'label="Evidence"', six("s", true)));
      const state = async (): Promise<unknown> => ({ ordinals: await read(driver, 'return ordinals("c");'), items: (await texts(driver, "c")).texts });
      const start = await state();
      await driver.append("c", st("s7", "", "Merged"));
      const appended = await state();
      await driver.remove("s2");
      const removed = await state();
      await driver.setAttribute("s4", "hidden", "");
      const hidden = await state();
      await driver.setAttribute("s3", "hidden", "");
      const chipHidden = await state();
      await driver.setAttribute("s3", "hidden", null);
      const chipShown = await state();
      return { start, appended, removed, hidden, chipHidden, chipShown, messages: await driver.messages() };
    },
    expected: {
      start: { ordinals: ["1", "2", "chip", "4", "chip", "6"], items: names },
      appended: { ordinals: ["1", "2", "chip", "4", "chip", "6", "7"], items: [...names, "Merged"] },
      removed: { ordinals: ["1", "chip", "3", "chip", "5", "6"], items: ["Spec", "Tasks", "Red commit", "Green commit", "Review", "Merged"] },
      hidden: { ordinals: ["1", "chip", "chip", "4", "5"], items: ["Spec", "Tasks", "Green commit", "Review", "Merged"] },
      chipHidden: { ordinals: ["1", "chip", "3", "4"], items: ["Spec", "Green commit", "Review", "Merged"] },
      chipShown: { ordinals: ["1", "chip", "chip", "4", "5"], items: ["Spec", "Tasks", "Green commit", "Review", "Merged"] },
      messages: [],
    },
  },
  {
    name: "US3-7 only the ocelle-evidence-step children are shown and exposed: loose text, a div and an li are neither; the steps are (FR-030)",
    run: async (driver) => {
      await page(driver, ch("c", 'label="Evidence"', ["Loose text", '<div id="d">A div</div>', '<li id="l">A list item</li>', st("s1", "", "Spec"), st("s2", "", "Plan")]));
      return {
        items: await texts(driver, "c"),
        statics: await statics(driver, "c"),
        shown: await read(driver, 'return { div: rects("d"), li: rects("l"), steps: [rects("s1") > 0, rects("s2") > 0], loose: [...$("c").childNodes].filter((node) => node.nodeType === 3 && node.data.trim() !== "").map((node) => { const range = document.createRange(); range.selectNodeContents(node); return range.getClientRects().length; }) };'),
      };
    },
    expected: { items: { texts: ["Spec", "Plan"], filled: true }, statics: ["Spec", "Plan"], shown: { div: 0, li: 0, steps: [true, true], loose: [0] } },
  },
  {
    name: "US3-8 light and dark: step and chip text in --ocelle-color-ink, the ordinal and ring in --ocelle-color-ink-muted, the chip outline in ink-muted, the connector in the decorative --ocelle-color-rule-strong; forced colours: ring, connector and chip outline each a CanvasText border side with a width above zero and a box, the ordinal and texts CanvasText (FR-013, FR-036)",
    run: async (driver) => {
      await page(driver, ch("c", 'label="Evidence"', [st("d1", "", "Spec"), st("k1", 'variant="chip"', "3 checks"), st("d2", "", "Review")]));
      const painted = `const li = lis("c")[0]; const marker = li?.querySelector(".marker") ?? null; const connector = li?.querySelector(".connector") ?? null; const chip = $("k1"); const step = $("d1");
if (marker === null || connector === null) return "missing marker or connector";
const m = getComputedStyle(marker); const c = getComputedStyle(connector); const k = getComputedStyle(chip); const sides = (s, colour) => ["Top", "Right", "Bottom", "Left"].every((side) => s["border" + side + "Color"] === colour && Number.parseFloat(s["border" + side + "Width"]) > 0);`;
      const themed = `${painted}
return { step: getComputedStyle(step).color === token("color-ink"), chipText: k.color === token("color-ink"), ordinal: m.color === token("color-ink-muted"), ring: sides(m, token("color-ink-muted")), chip: sides(k, token("color-ink-muted")), connector: c.borderTopColor === token("color-rule-strong") && Number.parseFloat(c.borderTopWidth) > 0, background: [m.backgroundColor, c.backgroundColor, k.backgroundColor] };`;
      await driver.theme("light");
      const light = await read(driver, themed);
      await driver.theme("dark");
      const dark = await read(driver, themed);
      await driver.theme(null);
      await driver.forcedColors("active");
      const forced = await read(
        driver,
        `${painted}
const text = colourOf("CanvasText"); const box = (element) => { const r = element.getBoundingClientRect(); return r.width > 0 && r.height >= 0; };
return { ring: sides(m, text) && box(marker), connector: c.borderTopColor === text && Number.parseFloat(c.borderTopWidth) > 0 && connector.getBoundingClientRect().width > 0, chip: sides(k, text) && box(chip), ordinal: m.color === text, step: getComputedStyle(step).color === text, chipText: k.color === text };`,
      );
      await driver.forcedColors("none");
      return { light, dark, forced };
    },
    expected: {
      light: { step: true, chipText: true, ordinal: true, ring: true, chip: true, connector: true, background: ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)"] },
      dark: { step: true, chipText: true, ordinal: true, ring: true, chip: true, connector: true, background: ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)"] },
      forced: { ring: true, connector: true, chip: true, ordinal: true, step: true, chipText: true },
    },
  },
  {
    name: "US3-9 under dir=\"rtl\" the first step is at the inline start, the right, each marker right of its step's content, and the lines fill towards the left (FR-034)",
    run: async (driver) => {
      await page(driver, `<div dir="rtl">${ch("c", 'label="Evidence"', six("s", false))}</div>`, 320);
      return read(
        driver,
        `const host = $("c").getBoundingClientRect(); const items = lis("c");
if (items.length === 0) return "no items";
return { first: near(items[0].getBoundingClientRect().right, host.right), fill: fill("c"), lines: tops("c") > 1, ends: ends("c"), markers: items.map((li) => { const m = li.querySelector(".marker"); const c = content(stepOf(li)); return m !== null && c !== null && m.getBoundingClientRect().left >= c.getBoundingClientRect().right - 0.5; }) };`,
      );
    },
    expected: { first: true, fill: true, lines: true, ends: ["ok", "ok", "ok", "ok", "ok", "ok"], markers: [true, true, true, true, true, true] },
  },
  {
    name: "US3-10 a blank host aria-label counts as absent (label names the list), a blank one with no or a blank label leaves it unnamed, a non-blank host aria-label \"Proof\" names it over label (FR-032, FR-022)",
    run: async (driver) => {
      const one = (id: string): string => st(`${id}-s`, "", "Spec");
      await page(
        driver,
        [
          ch("c1", 'aria-label="" label="Evidence"', [one("c1")]),
          ch("c2", 'aria-label="  " label="Evidence"', [one("c2")]),
          ch("c3", 'aria-label=" "', [one("c3")]),
          ch("c4", 'aria-label="" label="  "', [one("c4")]),
          ch("c5", 'aria-label="Proof" label="Evidence"', [one("c5")]),
        ].join(""),
      );
      return { c1: await lists(driver, "c1"), c2: await lists(driver, "c2"), c3: await lists(driver, "c3"), c4: await lists(driver, "c4"), c5: await lists(driver, "c5") };
    },
    expected: { c1: ["Evidence"], c2: ["Evidence"], c3: [""], c4: [""], c5: ["Proof"] },
  },
];

/** The ordinal-fit and mixed-chips geometry bodies (tasks.md T056; R-12, SPEC-3-03). */
export const evidenceChainGeometryScenarios: readonly Scenario[] = [
  {
    name: "twenty steps: each ordinal's text box inside its marker's padding box and no marker overflows, ordinals 1 to 20; the chain wraps onto more than one line at 640 px (SPEC-3-03, FR-033)",
    run: async (driver) => {
      await page(driver, ch("c", 'label="Evidence"', Array.from({ length: 20 }, (_, at) => st(`s${String(at + 1)}`, "", `Step ${String(at + 1)}`))), 640);
      return read(
        driver,
        `const markers = lis("c").map((li) => li.querySelector(".marker"));
return { ordinals: ordinals("c"), lines: tops("c") > 1, fit: markers.map((m) => { if (m === null) return false; const r = m.getBoundingClientRect(); const s = getComputedStyle(m); const range = document.createRange(); range.selectNodeContents(m); const t = range.getBoundingClientRect(); const left = r.left + Number.parseFloat(s.borderLeftWidth); const right = r.right - Number.parseFloat(s.borderRightWidth); const topEdge = r.top + Number.parseFloat(s.borderTopWidth); const bottom = r.bottom - Number.parseFloat(s.borderBottomWidth); return t.width > 0 && t.left >= left - 0.01 && t.right <= right + 0.01 && t.top >= topEdge - 0.01 && t.bottom <= bottom + 0.01 && m.scrollWidth <= m.clientWidth && m.scrollHeight <= m.clientHeight; }) };`,
      );
    },
    expected: { ordinals: Array.from({ length: 20 }, (_, at) => String(at + 1)), lines: true, fit: Array.from({ length: 20 }, () => true) },
  },
  {
    name: "mixed chips on one row: each connector's centre and each one-line chip's centre on the row's marker centre within 0.5 px, and each default step's first line centred on its marker within 0.5 px (R-12, PLAN-FRESH-1-005)",
    run: async (driver) => {
      await page(driver, ch("c", 'label="Evidence"', six("s", true)));
      return read(
        driver,
        `const items = lis("c"); const first = items[0]?.querySelector(".marker");
if (first === null || first === undefined) return "no marker";
const centre = (r) => r.top + r.height / 2; const line = centre(first.getBoundingClientRect());
return { lines: tops("c"), connectors: items.slice(0, -1).map((li) => { const c = li.querySelector(".connector"); return c !== null && shown(c) && near(centre(c.getBoundingClientRect()), line); }),
  chips: items.filter((li) => li.classList.contains("chip")).map((li) => near(centre(stepOf(li).getBoundingClientRect()), line)),
  firstLines: items.filter((li) => !li.classList.contains("chip")).map((li) => { const step = stepOf(li); const s = getComputedStyle(step); const m = li.querySelector(".marker"); return m !== null && near(step.getBoundingClientRect().top + Number.parseFloat(s.lineHeight) / 2, centre(m.getBoundingClientRect())); }) };`,
      );
    },
    expected: { lines: 1, connectors: [true, true, true, true, true], chips: [true, true], firstLines: [true, true, true, true] },
  },
];

/** The chain edge-case bodies (tasks.md T056; FR-001, FR-011, FR-025, FR-026, FR-030). */
export const evidenceChainEdgeScenarios: readonly Scenario[] = [
  {
    name: "edge: a step outside a chain, default or chip, shows its part=\"content\" as plain text, with no list role, no marker and no chip box (FR-030)",
    run: async (driver) => {
      await page(driver, `<p id="p">${st("o1", "", "Alone")} ${st("o2", 'variant="chip"', "Chip alone")}</p>`);
      const shown = await read(driver, 'return ["o1", "o2"].map((id) => { const s = getComputedStyle($(id)); return { content: content($(id))?.textContent ?? null, slot: content($(id))?.querySelector("slot") !== null && content($(id)) !== null, marks: $(id).shadowRoot?.querySelectorAll(".marker, .connector, ol, li").length ?? -1, border: s.borderTopStyle, padding: s.paddingLeft, display: s.display }; });');
      return { shown, roles: await tree(driver, "p"), statics: await statics(driver, "p") };
    },
    expected: {
      shown: [
        { content: "", slot: true, marks: 0, border: "none", padding: "0px", display: "inline-block" },
        { content: "", slot: true, marks: 0, border: "none", padding: "0px", display: "inline-block" },
      ],
      roles: ["paragraph", "generic", "generic"],
      statics: ["Alone", "Chip alone"],
    },
  },
  {
    name: "edge: an empty chain renders no <ol> and no listitem and throws nothing, beside a chain with a step that renders its named list (FR-025)",
    run: async (driver) => {
      await page(driver, `${ch("c0", 'label="Nothing"', ['<p id="p0">Not a step</p>'])}${ch("c1", 'label="Evidence"', [st("s1", "", "Spec")])}`);
      return {
        ols: await read(driver, 'return [shadow("c0")?.querySelector("ol") !== null && shadow("c0") !== null, shadow("c1")?.querySelector("ol") !== null && shadow("c1") !== null];'),
        lists: [await lists(driver, "c0"), await lists(driver, "c1")],
        listitems: (await tree(driver, "c0")).filter((role) => role.startsWith("listitem")).length,
        messages: await driver.messages(),
      };
    },
    expected: { ols: [false, true], lists: [[], ["Evidence"]], listitems: 0, messages: [] },
  },
  {
    name: "edge: an aria-hidden=\"true\" step is neither shown nor exposed, gets no ordinal and no connector joins it; the steps around it are (FR-025)",
    run: async (driver) => {
      await page(driver, ch("c", 'label="Evidence"', [st("s1", "", "Spec"), st("s2", 'aria-hidden="true"', "Masked"), st("s3", "", "Review")]));
      return { items: await texts(driver, "c"), shown: await read(driver, 'return { rects: [rects("s1") > 0, rects("s2"), rects("s3") > 0], ordinals: ordinals("c"), ends: ends("c") };') };
    },
    expected: { items: { texts: ["Spec", "Review"], filled: true }, shown: { rects: [true, 0, true], ordinals: ["1", "2"], ends: ["ok", "ok"] } },
  },
  {
    name: "edge: a link in a step keeps its own tab stop and focus ring, its box inside its <li> after the marker; the chain adds no tab stop and its list stays named (FR-011, FR-026)",
    run: async (driver) => {
      await page(driver, `<button id="before" type="button">Before</button>${ch("c", 'label="Evidence"', [st("s1", "", 'Opened <a id="lnk" href="#lnk">pull request 42</a>'), st("s2", "", "Review")])}<button id="after" type="button">After</button>`);
      const walk = await driver.tabWalk("before", "after");
      await driver.focus("before");
      await driver.pressTab();
      const focused = await driver.focused();
      const ring = await driver.focusVisible("lnk");
      const column = await read(
        driver,
        `const li = lis("c")[0]; const marker = li?.querySelector(".marker");
if (li === undefined || marker === null) return "no item";
const link = $("lnk").getBoundingClientRect(); const m = marker.getBoundingClientRect(); const box = li.getBoundingClientRect();
return { afterMarker: link.left >= m.right, insideItem: link.left >= box.left - 0.5 && link.right <= box.right + 0.5 && link.top >= box.top - 0.5 && link.bottom <= box.bottom + 0.5 };`,
      );
      return { walk, focused, ring, column, lists: await lists(driver, "c") };
    },
    expected: { walk: ["lnk", "after"], focused: "lnk", ring: true, column: { afterMarker: true, insideItem: true }, lists: ["Evidence"] },
  },
  {
    name: "edge: lang and dir on a step reach its content; the step stays a listitem with its ordinal",
    run: async (driver) => {
      await page(driver, ch("c", 'label="Evidence"', [st("s1", 'lang="fr" dir="rtl"', "Spécification"), st("s2", "", "Plan")]));
      return {
        read: await read(driver, 'const c = content($("s1")); if (c === null) return "no content part"; return { lang: c.matches(":lang(fr)"), dir: getComputedStyle(c).direction, chain: getComputedStyle(shadow("c").querySelector("ol")).direction, ordinals: ordinals("c") };'),
        items: await texts(driver, "c"),
      };
    },
    expected: { read: { lang: true, dir: "rtl", chain: "ltr", ordinals: ["1", "2"] }, items: { texts: ["Spécification", "Plan"], filled: true } },
  },
  {
    name: "edge: no live region, landmark or heading in the chain's accessibility subtree, beside its named list (FR-026)",
    run: async (driver) => {
      await page(driver, ch("c", 'label="Evidence"', six("s", true)));
      const roles = await tree(driver, "c");
      const nodes = await driver.axSubtree("c");
      return {
        list: roles.includes("list Evidence"),
        added: roles.filter((role) => /^(status|log|alert|marquee|timer|region|navigation|main|complementary|banner|contentinfo|form|search|heading)\b/.test(role)),
        live: nodes.filter((node) => JSON.stringify(node).includes("live")).length,
        attributes: await read(driver, 'return [...(shadow("c")?.querySelectorAll("[aria-live], [role=status], [role=log], [role=region], h1, h2, h3, h4, h5, h6, [tabindex]") ?? [])].length + ($("c").hasAttribute("tabindex") ? 1 : 0);'),
      };
    },
    expected: { list: true, added: [], live: 0, attributes: 0 },
  },
  {
    name: "edge (FR-001): a hidden chain has no box and no list node, and a hidden standalone step has no box and no StaticText, beside a chain and a step without hidden that render their <ol> and their part=\"content\"",
    run: async (driver) => {
      await page(driver, `<div id="w">${ch("ch", 'label="Hidden" hidden', [st("hs", "", "Hidden step")])}${ch("cv", 'label="Shown"', [st("vs", "", "Shown step")])}<p id="ps">${st("sh", "hidden", "Hidden alone")}${st("sv", "", "Shown alone")}</p></div>`);
      return {
        boxes: await read(driver, 'const b = (id) => { const r = $(id).getBoundingClientRect(); return Math.round(r.width * r.height); }; return { ch: b("ch"), sh: b("sh"), cv: b("cv") > 0, sv: b("sv") > 0, ols: [shadow("ch")?.querySelector("ol") !== null, shadow("cv")?.querySelector("ol") !== null], content: content($("sv")) !== null };'),
        lists: await lists(driver, "w"),
        statics: await statics(driver, "ps"),
      };
    },
    expected: { boxes: { ch: 0, sh: 0, cv: true, sv: true, ols: [true, true], content: true }, lists: ["Shown"], statics: ["Shown alone"] },
  },
  {
    name: "edge: at 640 px the six steps stay inside the chain with each line's ends marked and the page does not scroll sideways (FR-034)",
    run: async (driver) => {
      await page(driver, ch("c", 'label="Evidence"', six("s", true)), 640);
      return { read: await read(driver, 'return { ends: ends("c"), fill: fill("c"), overlaps: overlaps("c"), inside: inside("c") };'), scrollWidth: await driver.scrollWidth() };
    },
    expected: { read: { ends: ["ok", "ok", "ok", "ok", "ok", "ok"], fill: true, overlaps: false, inside: true }, scrollWidth: 640 },
  },
  {
    name: "edge: unset properties write no attribute; variant and wrap set by property reflect and re-render the chain (a chip <li> with no marker), any other variant acts as unset, and clearing them removes the attributes",
    run: async (driver) => {
      await page(driver, ch("c", "", [st("s1", "", "Spec"), st("s2", "", "Plan")]));
      const state = async (): Promise<unknown> => ({ variant: await driver.attribute("s2", "variant"), wrap: await driver.attribute("s2", "wrap"), ordinals: await read(driver, 'return ordinals("c");') });
      const unset = { ...((await state()) as object), label: await driver.attribute("c", "label"), aria: await read(driver, 'return shadow("c")?.querySelector("ol")?.hasAttribute("aria-label") ?? "no list";') };
      await driver.setProperty("s2", "variant", "chip");
      await driver.setProperty("s2", "wrap", "anywhere");
      const set = await state();
      await driver.setProperty("s2", "variant", "pill");
      const other = await state();
      await driver.setProperty("s2", "variant", undefined);
      await driver.setProperty("s2", "wrap", undefined);
      const cleared = await state();
      return { unset, set, other, cleared };
    },
    expected: {
      unset: { variant: null, wrap: null, ordinals: ["1", "2"], label: null, aria: false },
      set: { variant: "chip", wrap: "anywhere", ordinals: ["1", "chip"] },
      other: { variant: "pill", wrap: "anywhere", ordinals: ["1", "2"] },
      cleared: { variant: null, wrap: null, ordinals: ["1", "2"] },
    },
  },
];

/** The run-time naming changes (R-09): the host aria-label and label set, blanked and removed after mount. */
export const evidenceChainChangeScenarios: readonly Scenario[] = [
  {
    name: "naming after mount: a host aria-label set names the list, blanked falls back to label, label changed follows, the host aria-label removed keeps label, label cleared leaves the list unnamed (FR-022)",
    run: async (driver) => {
      await page(driver, ch("c", 'label="Evidence"', [st("s1", "", "Spec")]));
      const state = async (): Promise<unknown> => ({ lists: await lists(driver, "c"), attribute: await read(driver, 'return shadow("c")?.querySelector("ol")?.getAttribute("aria-label") ?? null;') });
      await driver.setAttribute("c", "aria-label", "Proof");
      const host = await state();
      await driver.setAttribute("c", "aria-label", "  ");
      const blank = await state();
      await driver.setProperty("c", "label", "Audit");
      const label = await state();
      await driver.setAttribute("c", "aria-label", null);
      const removed = await state();
      await driver.setProperty("c", "label", undefined);
      return { host, blank, label, removed, unnamed: await state() };
    },
    expected: {
      host: { lists: ["Proof"], attribute: "Proof" },
      blank: { lists: ["Evidence"], attribute: "Evidence" },
      label: { lists: ["Audit"], attribute: "Audit" },
      removed: { lists: ["Audit"], attribute: "Audit" },
      unnamed: { lists: [""], attribute: null },
    },
  },
];

/** The run-time change added for the mutation run (tasks.md T074): a step's `aria-hidden` set and removed after mount (the observer's attribute filter). */
export const evidenceChainMutationScenarios: readonly Scenario[] = [
  {
    name: "aria-hidden set and removed on a step after mount: the step leaves the list and the ordinals, then comes back (FR-025)",
    run: async (driver) => {
      await page(driver, ch("c", 'label="Evidence"', six("s", false)));
      const state = async (): Promise<unknown> => ({ ordinals: await read(driver, 'return ordinals("c");'), items: (await texts(driver, "c")).texts });
      await driver.setAttribute("s2", "aria-hidden", "true");
      const masked = await state();
      await driver.setAttribute("s2", "aria-hidden", null);
      return { masked, shown: await state() };
    },
    expected: {
      masked: { ordinals: ["1", "2", "3", "4", "5"], items: ["Spec", "Tasks", "Red commit", "Green commit", "Review"] },
      shown: { ordinals: ["1", "2", "3", "4", "5", "6"], items: names },
    },
  },
];

/** Every chain body, in the order of tasks.md T055 and T056, then the run-time changes and those of T074. */
export const evidenceChainScenarios: readonly Scenario[] = [...evidenceChainStoryScenarios, ...evidenceChainGeometryScenarios, ...evidenceChainEdgeScenarios, ...evidenceChainChangeScenarios, ...evidenceChainMutationScenarios];
